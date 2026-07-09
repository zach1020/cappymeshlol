#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="${WORKSPACE:-/workspace}"
SAM3D_DIR="${SAM3D_DIR:-$WORKSPACE/sam-3d-objects}"
CAPPY_DIR="${CAPPY_DIR:-$WORKSPACE/cappymesh}"
ENV_NAME="${ENV_NAME:-sam3d-objects}"
MAMBA_ROOT_PREFIX="${MAMBA_ROOT_PREFIX:-$WORKSPACE/micromamba}"
CHECKPOINT_TAG="${CHECKPOINT_TAG:-hf}"
HF_REPO="${HF_REPO:-facebook/sam-3d-objects}"
INSTALL_DEV_EXTRAS="${INSTALL_DEV_EXTRAS:-0}"
RUN_TEST="${RUN_TEST:-0}"
TEST_IMAGE="${TEST_IMAGE:-}"
TEST_MASK="${TEST_MASK:-}"
TEST_OUT="${TEST_OUT:-$WORKSPACE/cappymesh-runs/bootstrap-test}"
TMPDIR="${TMPDIR:-$WORKSPACE/tmp}"
PIP_CACHE_DIR="${PIP_CACHE_DIR:-$WORKSPACE/pip-cache}"

log() {
  printf "\n==> %s\n" "$*"
}

warn() {
  printf "\n!! %s\n" "$*" >&2
}

require_linux_pod() {
  local kernel
  kernel="$(uname -s)"
  if [ "$kernel" != "Linux" ]; then
    cat >&2 <<EOF

This bootstrap must run inside your RunPod Linux Pod, not on your Mac.

On your Mac, run:
  ./scripts/mac_make_runpod_bundle.sh

Then upload the generated .tar.gz from dist/ to RunPod's /workspace folder.
Inside the RunPod terminal, run:
  cd /workspace
  mkdir -p cappymesh
  tar -xzf cappymesh-runpod-*.tar.gz -C cappymesh
  cd /workspace/cappymesh
  read -s HF_TOKEN
  export HF_TOKEN
  chmod +x scripts/runpod_sam3d_setup.sh
  WORKSPACE=/workspace ./scripts/runpod_sam3d_setup.sh

EOF
    exit 1
  fi

  if ! command -v apt-get >/dev/null 2>&1; then
    cat >&2 <<EOF

This script expects a Debian/Ubuntu-style RunPod image with apt-get.
Pick a RunPod PyTorch CUDA Ubuntu template, then rerun it inside that Pod.

EOF
    exit 1
  fi
}

as_root() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  else
    sudo "$@"
  fi
}

ensure_micromamba() {
  if command -v micromamba >/dev/null 2>&1; then
    return
  fi

  log "Installing micromamba"
  as_root mkdir -p /usr/local/bin
  curl -Ls https://micro.mamba.pm/api/micromamba/linux-64/latest \
    | as_root tar -xvj -C /usr/local/bin --strip-components=1 bin/micromamba

  as_root tee /usr/local/bin/mamba >/dev/null <<'EOF'
#!/usr/bin/env bash
exec micromamba "$@"
EOF
  as_root chmod +x /usr/local/bin/mamba
}

activate_mamba() {
  export MAMBA_ROOT_PREFIX
  mkdir -p "$MAMBA_ROOT_PREFIX"
  set +u
  eval "$(micromamba shell hook --shell bash)"
  micromamba activate "$ENV_NAME"
  set -u
}

install_system_packages() {
  log "Installing system packages"
  as_root apt-get update
  as_root apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    curl \
    ffmpeg \
    git \
    git-lfs \
    libgl1 \
    libglib2.0-0 \
    ninja-build \
    wget
  git lfs install
}

clone_sam3d() {
  if [ -d "$SAM3D_DIR/.git" ]; then
    log "SAM 3D Objects repo already exists at $SAM3D_DIR"
    git -C "$SAM3D_DIR" status --short >/dev/null || true
    return
  fi

  log "Cloning SAM 3D Objects into $SAM3D_DIR"
  git clone https://github.com/facebookresearch/sam-3d-objects "$SAM3D_DIR"
}

create_environment() {
  log "Creating or reusing micromamba env: $ENV_NAME"
  export MAMBA_ROOT_PREFIX
  mkdir -p "$MAMBA_ROOT_PREFIX"
  if micromamba env list | awk '{print $1}' | grep -qx "$ENV_NAME"; then
    echo "Environment already exists."
  else
    micromamba env create -f "$SAM3D_DIR/environments/default.yml"
  fi
}

install_sam3d_python_deps() {
  log "Installing SAM 3D Python dependencies"
  activate_mamba
  cd "$SAM3D_DIR"

  mkdir -p "$TMPDIR" "$PIP_CACHE_DIR"
  export TMPDIR PIP_CACHE_DIR
  pip install --upgrade pip setuptools wheel

  export PIP_EXTRA_INDEX_URL="https://pypi.ngc.nvidia.com https://download.pytorch.org/whl/cu121"
  if [ "$INSTALL_DEV_EXTRAS" = "1" ]; then
    pip install -e '.[dev]'
  else
    echo "Skipping .[dev] extras. Set INSTALL_DEV_EXTRAS=1 if you need SAM 3D development dependencies."
  fi

  pip install -e '.[p3d]'

  export PIP_FIND_LINKS="https://nvidia-kaolin.s3.us-east-2.amazonaws.com/torch-2.5.1_cu121.html"
  pip install -e '.[inference]'

  if [ -x ./patching/hydra ]; then
    ./patching/hydra
  fi

  pip install 'huggingface-hub[cli]<1.0' pillow runpod
}

login_huggingface() {
  activate_mamba

  if [ -n "${HF_TOKEN:-}" ]; then
    log "Logging in to Hugging Face with HF_TOKEN"
    hf auth login --token "$HF_TOKEN" --add-to-git-credential
    return
  fi

  if hf auth whoami >/dev/null 2>&1; then
    log "Hugging Face auth already configured"
    hf auth whoami || true
    return
  fi

  warn "HF_TOKEN is not set and Hugging Face is not logged in."
  warn "Run: hf auth login"
  warn "Then rerun this script to download checkpoints."
}

download_checkpoints() {
  activate_mamba

  local pipeline="$SAM3D_DIR/checkpoints/$CHECKPOINT_TAG/pipeline.yaml"
  if [ -f "$pipeline" ]; then
    log "Checkpoints already present: $pipeline"
    return
  fi

  if ! hf auth whoami >/dev/null 2>&1; then
    warn "Skipping checkpoint download because Hugging Face auth is not configured."
    warn "Request access to $HF_REPO, set HF_TOKEN or run hf auth login, then rerun this script."
    return
  fi

  log "Downloading SAM 3D checkpoints from $HF_REPO"
  cd "$SAM3D_DIR"
  mkdir -p checkpoints
  rm -rf "checkpoints/${CHECKPOINT_TAG}-download"
  hf download \
    --repo-type model \
    --local-dir "checkpoints/${CHECKPOINT_TAG}-download" \
    --max-workers 1 \
    "$HF_REPO"

  rm -rf "checkpoints/${CHECKPOINT_TAG}"
  mv "checkpoints/${CHECKPOINT_TAG}-download/checkpoints" "checkpoints/${CHECKPOINT_TAG}"
  rm -rf "checkpoints/${CHECKPOINT_TAG}-download"
}

verify_install() {
  log "Verifying install"
  nvidia-smi || warn "nvidia-smi failed. Make sure the Pod has an NVIDIA GPU attached."

  activate_mamba
  python - <<'PY'
import importlib.util
import torch

print("python ok")
print("torch", torch.__version__)
print("cuda available", torch.cuda.is_available())
if torch.cuda.is_available():
    print("gpu", torch.cuda.get_device_name(0))

for module in ["sam3d_objects", "pytorch3d", "kaolin"]:
    spec = importlib.util.find_spec(module)
    print(module, "ok" if spec else "missing")
PY

  local pipeline="$SAM3D_DIR/checkpoints/$CHECKPOINT_TAG/pipeline.yaml"
  if [ -f "$pipeline" ]; then
    echo "checkpoint ok: $pipeline"
  else
    warn "checkpoint missing: $pipeline"
  fi
}

run_optional_test() {
  if [ "$RUN_TEST" != "1" ]; then
    return
  fi

  if [ -z "$TEST_IMAGE" ]; then
    warn "RUN_TEST=1 but TEST_IMAGE is empty. Skipping test run."
    return
  fi

  if [ ! -f "$TEST_IMAGE" ]; then
    warn "TEST_IMAGE does not exist: $TEST_IMAGE"
    return
  fi

  local runner="$CAPPY_DIR/workers/gpu/sam3d_runner.py"
  if [ ! -f "$runner" ]; then
    warn "CappyMesh runner not found: $runner"
    return
  fi

  log "Running first CappyMesh SAM 3D test"
  activate_mamba
  mkdir -p "$TEST_OUT"

  local args=(
    python "$runner"
    --image "$TEST_IMAGE"
    --out "$TEST_OUT"
    --sam3d-repo "$SAM3D_DIR"
    --checkpoint-tag "$CHECKPOINT_TAG"
    --format all
    --seed 42
  )

  if [ -n "$TEST_MASK" ]; then
    args+=(--mask "$TEST_MASK")
  fi

  "${args[@]}"
}

main() {
  require_linux_pod

  log "CappyMesh RunPod SAM 3D bootstrap"
  echo "WORKSPACE=$WORKSPACE"
  echo "SAM3D_DIR=$SAM3D_DIR"
  echo "CAPPY_DIR=$CAPPY_DIR"
  echo "ENV_NAME=$ENV_NAME"
  echo "MAMBA_ROOT_PREFIX=$MAMBA_ROOT_PREFIX"

  install_system_packages
  ensure_micromamba
  clone_sam3d
  create_environment
  install_sam3d_python_deps
  login_huggingface
  download_checkpoints
  verify_install
  run_optional_test

  log "Done"
  cat <<EOF

Next shell setup:
  eval "\$(micromamba shell hook --shell bash)"
  micromamba activate $ENV_NAME

Manual test:
  cd "$CAPPY_DIR"
  python workers/gpu/sam3d_runner.py \\
    --image /workspace/test-inputs/chair.png \\
    --out /workspace/cappymesh-runs/chair-001 \\
    --sam3d-repo "$SAM3D_DIR" \\
    --checkpoint-tag "$CHECKPOINT_TAG" \\
    --format all \\
    --seed 42

EOF
}

main "$@"

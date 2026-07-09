#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${OUT_DIR:-$ROOT_DIR/dist}"
STAMP="$(date +%Y%m%d-%H%M%S)"
BUNDLE_PATH="${BUNDLE_PATH:-$OUT_DIR/cappymesh-runpod-$STAMP.tar.gz}"

mkdir -p "$OUT_DIR"

echo "==> Creating RunPod bundle"
echo "Root:   $ROOT_DIR"
echo "Bundle: $BUNDLE_PATH"

tar \
  --exclude="./node_modules" \
  --exclude="./apps/web/node_modules" \
  --exclude="./apps/web/.next" \
  --exclude="./.next" \
  --exclude="./output" \
  --exclude="./dist" \
  --exclude="./.git" \
  --exclude="./.DS_Store" \
  --exclude="./**/__pycache__" \
  --exclude="./**/*.pyc" \
  -czf "$BUNDLE_PATH" \
  -C "$ROOT_DIR" \
  .

echo
echo "Bundle ready:"
echo "$BUNDLE_PATH"
echo
echo "Upload it to your RunPod /workspace folder, then on the Pod run:"
cat <<'EOF'
cd /workspace
mkdir -p cappymesh
tar -xzf cappymesh-runpod-*.tar.gz -C cappymesh
cd /workspace/cappymesh
read -s HF_TOKEN
export HF_TOKEN
chmod +x scripts/runpod_sam3d_setup.sh
WORKSPACE=/workspace ./scripts/runpod_sam3d_setup.sh
EOF

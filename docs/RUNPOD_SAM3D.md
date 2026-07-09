# RunPod SAM 3D Setup

This is the first real image-to-3D path for CappyMesh. Start with a RunPod GPU Pod, prove one image produces an output artifact, then package the same runner for Serverless.

## Why start with a Pod

SAM 3D Objects has heavy CUDA/PyTorch/PyTorch3D/Kaolin dependencies and official setup notes call for Linux 64-bit plus an NVIDIA GPU with at least 32 GB VRAM. A Pod gives us SSH/Jupyter and persistent `/workspace` while we debug the first generation.

Serverless is the later production shape, after the environment and outputs are proven.

## RunPod choice

Use:

- Product: Pods
- Cloud: Secure Cloud if you want a network volume
- GPU: RTX PRO 6000 96 GB is a strong first choice. A40 48 GB, RTX A6000 48 GB, A100 40/80 GB, or better should also work.
- Template: RunPod PyTorch CUDA template
- Disk/volume: 80-120 GB minimum; 150+ GB is more comfortable
- Persistent path: `/workspace`

Network volumes are useful because RunPod mounts them at `/workspace` for Pods, so downloaded checkpoints survive Pod replacement.

RTX PRO 6000 note: the 96 GB VRAM gives us much more room than the SAM 3D minimum, but because this is a newer Blackwell GPU, the first setup check should confirm the Pod template has a recent NVIDIA driver and CUDA/PyTorch can see the device. The bootstrap prints `nvidia-smi`, `torch.cuda.is_available()`, and the GPU name for this reason.

## One-command Pod setup

Important: run the SAM 3D bootstrap inside the RunPod terminal, not on your Mac. Your Mac can package/upload code, but the install needs RunPod's Linux NVIDIA environment.

If this repo is already on GitHub, clone it inside the RunPod terminal:

```bash
cd /workspace
git clone https://github.com/YOUR_GITHUB_USER/cappymesh.git
cd /workspace/cappymesh
```

Then run the bootstrap. If you have a Hugging Face token, pass it inline so checkpoints download automatically:

```bash
chmod +x scripts/runpod_sam3d_setup.sh
HF_TOKEN=hf_your_token_here WORKSPACE=/workspace ./scripts/runpod_sam3d_setup.sh
```

If the Pod template already runs as root, omit `sudo`.

If the script says Hugging Face is not logged in, run:

```bash
eval "$(micromamba shell hook --shell bash)"
micromamba activate sam3d-objects
hf auth login
WORKSPACE=/workspace ./scripts/runpod_sam3d_setup.sh
```

The script is idempotent. You can rerun it after failed installs, Hugging Face approval, or Pod restarts.

## Hugging Face checkpoint access

Before checkpoints can download:

- Request access to `facebook/sam-3d-objects` on Hugging Face.
- Create a Hugging Face access token.
- Either set `HF_TOKEN=...` when running the bootstrap or run `hf auth login` inside the `sam3d-objects` environment.

Expected config:

```bash
test -f /workspace/sam-3d-objects/checkpoints/hf/pipeline.yaml && echo "checkpoint ok"
```

## First CappyMesh proof run

Copy or download a simple product/object image to the Pod. Best first inputs:

- one object
- uncropped
- plain background
- PNG with transparency if possible
- no humans, hands, or complicated scene

Run:

```bash
eval "$(micromamba shell hook --shell bash)"
micromamba activate sam3d-objects
cd /workspace/cappymesh
python workers/gpu/sam3d_runner.py \
  --image /workspace/test-inputs/chair.png \
  --out /workspace/cappymesh-runs/chair-001 \
  --format all \
  --seed 42
```

Or run the bootstrap with a test image:

```bash
RUN_TEST=1 \
TEST_IMAGE=/workspace/test-inputs/chair.png \
WORKSPACE=/workspace \
./scripts/runpod_sam3d_setup.sh
```

If you have a mask:

```bash
python workers/gpu/sam3d_runner.py \
  --image /workspace/test-inputs/chair.png \
  --mask /workspace/test-inputs/chair-mask.png \
  --out /workspace/cappymesh-runs/chair-001 \
  --format all \
  --seed 42
```

Outputs:

- `splat.ply`: Gaussian splat point cloud, expected from the official quickstart
- `model.glb`: exported if the installed SAM 3D pipeline returns a mesh-like output
- `model.obj`: exported when available and `--format all` or `--format obj`
- `model.stl`: exported when available and `--format all` or `--format stl`
- `metadata.json`: run result manifest

The first quality gate is simply: one real input produces a viewable artifact.

## API callback contract

The API now exposes worker endpoints:

```http
GET /worker/jobs/:id/manifest
POST /worker/jobs/:id/status
```

Set `WORKER_SHARED_SECRET` on the API and send it as:

```http
X-Worker-Secret: your-secret
```

Status payload:

```json
{
  "status": "running_sam3d",
  "progress": 35,
  "workerId": "runpod-a6000-001"
}
```

Complete payload:

```json
{
  "status": "complete",
  "progress": 100,
  "workerId": "runpod-a6000-001",
  "outputs": {
    "glbUrl": "s3://bucket/outputs/asset-id/model.glb",
    "plyUrl": "s3://bucket/outputs/asset-id/splat.ply",
    "metadata": {
      "gpu": "RTX A6000",
      "elapsedSeconds": 92.4
    }
  }
}
```

## Serverless later

The repo includes:

- `workers/gpu/runpod_handler.py`
- `workers/gpu/Dockerfile.runpod`
- `workers/gpu/requirements-runpod.txt`

After the Pod proof, build and push the Docker image, then create a RunPod Serverless Queue endpoint from Docker Hub or another registry.

Example local build on a Linux CUDA build box:

```bash
docker build -f workers/gpu/Dockerfile.runpod -t YOUR_DOCKER_USER/cappymesh-sam3d:0.1 .
docker push YOUR_DOCKER_USER/cappymesh-sam3d:0.1
```

RunPod Serverless test payload:

```json
{
  "input": {
    "job_id": "manual-001",
    "image_url": "https://example.com/chair.png",
    "format": "glb",
    "seed": 42
  }
}
```

Production serverless should upload outputs to R2/S3 and return signed URLs, not inline files.

## Troubleshooting

- If import fails, activate `sam3d-objects` and run from the Pod, not your Mac.
- If checkpoint config is missing, redo the Hugging Face download step.
- If GLB is missing but PLY exists, SAM 3D inference worked but mesh export needs another path.
- If texture baking fails, first ship vertex-color GLB or PLY proof, then isolate texture baking.
- If the Pod runs out of disk, use a larger `/workspace` volume and delete temporary checkpoint downloads.

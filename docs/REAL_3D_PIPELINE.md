# Real 3D Pipeline Plan

## Phase A: Pod proof

Goal: one local file on RunPod becomes one output artifact.

```txt
image.png + optional mask.png
  -> workers/gpu/sam3d_runner.py
  -> SAM 3D Objects
  -> splat.ply and, if available, model.glb
  -> metadata.json
```

Success criteria:

- The runner loads checkpoints.
- CUDA is visible.
- A real image produces `splat.ply`.
- If `model.glb` exists, it opens in Blender or the web viewer.
- Runtime, GPU type, and artifact sizes are captured.

## Phase B: API-connected worker

Goal: the app can create a job and a worker can update status.

```txt
API creates job
  -> worker fetches /worker/jobs/:id/manifest
  -> worker downloads image/mask
  -> worker posts status updates
  -> worker uploads outputs to R2/S3
  -> worker posts complete with output URLs
```

## Phase C: Production queue

Goal: reliable private alpha.

- PostgreSQL job persistence
- Redis queue
- R2/S3 presigned uploads
- worker shared secret
- cost metadata
- failed job refunds
- deletion of uploaded inputs and generated outputs

## Phase D: Serverless

Goal: scale down when idle.

- Package proven Pod environment into `workers/gpu/Dockerfile.runpod`
- Push image to registry
- Create RunPod Serverless Queue endpoint
- API submits jobs to endpoint or dispatches through Redis
- Worker uploads artifacts to object storage

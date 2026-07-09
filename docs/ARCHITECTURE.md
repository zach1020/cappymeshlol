# Architecture

## Services

```txt
apps/web             Next.js web app
apps/api             FastAPI API
workers/gpu          Mock SAM 3D inference worker
packages/shared      Shared product types
infra                Docker and deployment config later
docs                 Launch docs
```

## Request flow

```txt
Browser
  -> Next.js create page
  -> API creates upload URL
  -> Browser uploads image to object storage
  -> API creates generation job
  -> Redis queue
  -> GPU worker downloads input
  -> mask / SAM 3D / postprocess / export
  -> worker uploads output files
  -> API marks job complete
  -> Browser polls or receives websocket update
  -> 3D viewer displays GLB
```

## Current pass

- The web app is a functional shell with mock viewer geometry.
- The API stores users, assets, and jobs in memory.
- The generation endpoint exposes a deterministic mock state machine.
- The worker script prints staged progress and a fake GLB URL.

## Next technical steps

1. Add persistent PostgreSQL models for users, assets, jobs, and generation costs.
2. Add Redis and a real job queue.
3. Wire S3 or Cloudflare R2 presigned uploads.
4. Add Clerk, Auth.js, or Supabase Auth.
5. Replace mock worker with SAM 3D Objects runtime.
6. Add Blender CLI, trimesh, pymeshlab, and Open3D validation stages.

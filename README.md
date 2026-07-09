# CappyMesh

CappyMesh turns photos into production-ready 3D assets.

This repo is the first implementation pass from the product spec:

- `apps/web`: Next.js product shell with create, dashboard, job, asset, pricing, and legal pages.
- `apps/api`: FastAPI stub with health, upload, generation, asset, billing, and account endpoints.
- `workers/gpu`: mock GPU worker that simulates the future SAM 3D pipeline.
- `packages/shared`: shared TypeScript types.
- `docs`: architecture, pricing, and legal launch gate notes.

Billing and public launch are intentionally gated by `LEGAL_REVIEW_SAM_LICENSE=false` and `ENABLE_BILLING=false`.

## Local development

```bash
npm install
python3 -m pip install -r apps/api/requirements.txt
npm run dev:web
npm run dev:api
```

The web app defaults to [http://localhost:3000](http://localhost:3000). The API defaults to [http://localhost:8000](http://localhost:8000).

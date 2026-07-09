from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
import os
from typing import Any, Optional
from uuid import uuid4

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


app = FastAPI(title="CappyMesh API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class AssetMode(str, Enum):
    game = "game"
    print = "print"
    creator = "creator"
    shop = "shop"


class GenerationStatus(str, Enum):
    queued = "queued"
    running_sam3d = "running_sam3d"
    postprocessing = "postprocessing"
    texturing = "texturing"
    exporting = "exporting"
    complete = "complete"
    failed_refunded = "failed_refunded"


class PresignRequest(BaseModel):
    filename: str
    contentType: str


class PresignResponse(BaseModel):
    uploadUrl: str
    storageKey: str


class GenerationCreateRequest(BaseModel):
    inputImageKey: str
    prompt: Optional[str] = None
    mode: AssetMode = AssetMode.game
    targetFormat: str = "glb"
    quality: str = "standard"


class Asset(BaseModel):
    id: str
    userId: str
    title: str
    inputImageUrl: str
    prompt: Optional[str] = None
    mode: AssetMode
    visibility: str = "private"
    status: str
    previewImageUrl: Optional[str] = None
    glbUrl: Optional[str] = None
    objUrl: Optional[str] = None
    stlUrl: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    createdAt: str
    updatedAt: str


class GenerationJob(BaseModel):
    id: str
    userId: str
    assetId: str
    status: GenerationStatus
    progress: int
    creditsReserved: int
    creditsConsumed: int
    errorMessage: Optional[str] = None
    workerId: Optional[str] = None
    createdAt: str
    startedAt: Optional[str] = None
    completedAt: Optional[str] = None


class WorkerOutput(BaseModel):
    glbUrl: Optional[str] = None
    objUrl: Optional[str] = None
    stlUrl: Optional[str] = None
    plyUrl: Optional[str] = None
    previewImageUrl: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class WorkerJobManifest(BaseModel):
    jobId: str
    assetId: str
    userId: str
    inputImageUrl: str
    prompt: Optional[str]
    mode: AssetMode
    targetFormat: str
    quality: str
    seed: int = 42


class WorkerStatusUpdate(BaseModel):
    status: GenerationStatus
    progress: int = Field(ge=0, le=100)
    workerId: Optional[str] = None
    errorMessage: Optional[str] = None
    outputs: Optional[WorkerOutput] = None


USER = {
    "id": "mock-user",
    "email": "alpha@cappymesh.lol",
    "displayName": "Alpha Creator",
    "plan": "starter",
    "credits": 80,
    "createdAt": now_iso(),
    "updatedAt": now_iso(),
}

assets: dict[str, Asset] = {}
jobs: dict[str, GenerationJob] = {}


def verify_worker_secret(x_worker_secret: Optional[str]) -> None:
    expected = os.environ.get("WORKER_SHARED_SECRET")
    if expected and x_worker_secret != expected:
        raise HTTPException(status_code=401, detail="Invalid worker secret")


def credit_cost(quality: str, mode: AssetMode) -> int:
    base = {"preview": 5, "standard": 20, "high": 40}.get(quality, 20)
    return base + (5 if mode == AssetMode.print else 0)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "cappymesh-api"}


@app.get("/me")
def me() -> dict[str, Any]:
    return USER


@app.get("/me/credits")
def credits() -> dict[str, int]:
    return {"credits": USER["credits"]}


@app.get("/me/assets")
def me_assets() -> list[Asset]:
    return list(assets.values())


@app.post("/uploads/presign", response_model=PresignResponse)
def presign_upload(payload: PresignRequest) -> PresignResponse:
    storage_key = f"uploads/{USER['id']}/{uuid4()}-{payload.filename}"
    return PresignResponse(uploadUrl=f"http://localhost:8000/mock-upload/{storage_key}", storageKey=storage_key)


@app.post("/generations", response_model=GenerationJob)
def create_generation(payload: GenerationCreateRequest) -> GenerationJob:
    created_at = now_iso()
    asset_id = f"asset_{uuid4().hex[:10]}"
    job_id = f"job_{uuid4().hex[:10]}"
    cost = credit_cost(payload.quality, payload.mode)

    asset = Asset(
        id=asset_id,
        userId=USER["id"],
        title=payload.prompt[:44] if payload.prompt else "Untitled mesh",
        inputImageUrl=payload.inputImageKey,
        prompt=payload.prompt,
        mode=payload.mode,
        status="queued",
        metadata={
            "targetFormat": payload.targetFormat,
            "quality": payload.quality,
            "seed": 42,
            "billingEnabled": False,
            "legalReviewSamLicense": False,
        },
        createdAt=created_at,
        updatedAt=created_at,
    )
    job = GenerationJob(
        id=job_id,
        userId=USER["id"],
        assetId=asset_id,
        status=GenerationStatus.queued,
        progress=0,
        creditsReserved=cost,
        creditsConsumed=0,
        workerId="mock-worker-local",
        createdAt=created_at,
    )
    assets[asset_id] = asset
    jobs[job_id] = job
    return job


@app.get("/worker/jobs/{job_id}/manifest", response_model=WorkerJobManifest)
def get_worker_manifest(job_id: str, x_worker_secret: Optional[str] = Header(default=None)) -> WorkerJobManifest:
    verify_worker_secret(x_worker_secret)
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Generation job not found")
    asset = assets[job.assetId]
    return WorkerJobManifest(
        jobId=job.id,
        assetId=asset.id,
        userId=asset.userId,
        inputImageUrl=asset.inputImageUrl,
        prompt=asset.prompt,
        mode=asset.mode,
        targetFormat=str(asset.metadata.get("targetFormat", "glb")),
        quality=str(asset.metadata.get("quality", "standard")),
        seed=int(asset.metadata.get("seed", 42)),
    )


@app.post("/worker/jobs/{job_id}/status", response_model=GenerationJob)
def update_worker_status(
    job_id: str,
    payload: WorkerStatusUpdate,
    x_worker_secret: Optional[str] = Header(default=None),
) -> GenerationJob:
    verify_worker_secret(x_worker_secret)
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Generation job not found")

    job.status = payload.status
    job.progress = payload.progress
    job.workerId = payload.workerId or job.workerId
    job.errorMessage = payload.errorMessage
    job.startedAt = job.startedAt or now_iso()

    asset = assets[job.assetId]
    asset.updatedAt = now_iso()
    if payload.outputs:
        if payload.outputs.glbUrl:
            asset.glbUrl = payload.outputs.glbUrl
        if payload.outputs.objUrl:
            asset.objUrl = payload.outputs.objUrl
        if payload.outputs.stlUrl:
            asset.stlUrl = payload.outputs.stlUrl
        if payload.outputs.previewImageUrl:
            asset.previewImageUrl = payload.outputs.previewImageUrl
        asset.metadata["workerOutputs"] = payload.outputs.model_dump()

    if payload.status == GenerationStatus.complete:
        job.progress = 100
        job.creditsConsumed = job.creditsReserved
        job.completedAt = job.completedAt or now_iso()
        asset.status = "complete"
    elif payload.status == GenerationStatus.failed_refunded:
        job.progress = 100
        job.creditsConsumed = 0
        job.completedAt = job.completedAt or now_iso()
        asset.status = "failed"
    else:
        asset.status = "running"

    jobs[job_id] = job
    assets[asset.id] = asset
    return job


@app.get("/generations/{job_id}", response_model=GenerationJob)
def get_generation(job_id: str) -> GenerationJob:
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Generation job not found")

    elapsed = (datetime.now(timezone.utc) - datetime.fromisoformat(job.createdAt)).total_seconds()
    stages = [
        (8, GenerationStatus.queued, 8),
        (18, GenerationStatus.running_sam3d, 28),
        (28, GenerationStatus.postprocessing, 55),
        (38, GenerationStatus.texturing, 76),
        (48, GenerationStatus.exporting, 92),
    ]
    for threshold, status, progress in stages:
        if elapsed < threshold:
            job.status = status
            job.progress = progress
            job.startedAt = job.startedAt or now_iso()
            break
    else:
        job.status = GenerationStatus.complete
        job.progress = 100
        job.creditsConsumed = job.creditsReserved
        job.completedAt = job.completedAt or now_iso()
        asset = assets[job.assetId]
        asset.status = "complete"
        asset.glbUrl = "/mock-assets/cappymesh-demo.glb"
        asset.objUrl = "/mock-assets/cappymesh-demo.obj"
        if asset.mode == AssetMode.print:
            asset.stlUrl = "/mock-assets/cappymesh-demo.stl"
        asset.updatedAt = now_iso()

    jobs[job_id] = job
    return job


@app.post("/generations/{job_id}/cancel", response_model=GenerationJob)
def cancel_generation(job_id: str) -> GenerationJob:
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Generation job not found")
    job.status = GenerationStatus.failed_refunded
    job.progress = 100
    job.creditsConsumed = 0
    job.errorMessage = "Cancelled by user. Reserved credits refunded."
    jobs[job_id] = job
    return job


@app.get("/assets/{asset_id}", response_model=Asset)
def get_asset(asset_id: str) -> Asset:
    asset = assets.get(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@app.delete("/assets/{asset_id}")
def delete_asset(asset_id: str) -> dict[str, str]:
    if asset_id not in assets:
        raise HTTPException(status_code=404, detail="Asset not found")
    del assets[asset_id]
    return {"status": "deleted"}


@app.get("/billing/plans")
def billing_plans() -> dict[str, Any]:
    return {
        "enabled": False,
        "blockedBy": "LEGAL_REVIEW_SAM_LICENSE=false",
        "plans": ["free", "starter", "creator", "studio"],
    }

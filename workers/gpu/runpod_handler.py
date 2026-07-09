from __future__ import annotations

import json
import os
import tempfile
from dataclasses import asdict
from pathlib import Path
from typing import Any
from urllib.request import urlretrieve

from sam3d_runner import run_sam3d


def _download(url: str, destination: Path) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)
    urlretrieve(url, destination)
    return destination


def handler(event: dict[str, Any]) -> dict[str, Any]:
    payload = event.get("input", event)
    image_url = payload.get("image_url")
    if not image_url:
        return {"status": "failed", "error": "input.image_url is required"}

    job_id = payload.get("job_id", "manual")
    seed = int(payload.get("seed", 42))
    requested_format = payload.get("format", "glb")

    with tempfile.TemporaryDirectory(prefix=f"cappymesh-{job_id}-") as tmp:
        tmp_path = Path(tmp)
        image_path = _download(image_url, tmp_path / "input.png")
        mask_path = None
        if payload.get("mask_url"):
            mask_path = _download(payload["mask_url"], tmp_path / "mask.png")

        result = run_sam3d(
            image_path=image_path,
            mask_path=mask_path,
            output_dir=tmp_path / "outputs",
            repo_path=Path(os.environ.get("SAM3D_REPO", "/workspace/sam-3d-objects")),
            checkpoint_tag=os.environ.get("SAM3D_CHECKPOINT_TAG", "hf"),
            seed=seed,
            requested_format=requested_format,
            mask_threshold=int(payload.get("mask_threshold", 16)),
        )

        # Serverless responses should stay small. Real production should upload
        # these output files to R2/S3 and return signed URLs instead.
        response = asdict(result)
        response["metadata"] = json.loads(Path(result.metadata_path).read_text(encoding="utf-8"))
        return response


if __name__ == "__main__":
    try:
        import runpod
    except ImportError as exc:
        raise SystemExit("Install runpod with `pip install runpod` before launching serverless handler.") from exc

    runpod.serverless.start({"handler": handler})

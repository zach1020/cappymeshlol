from __future__ import annotations

import argparse
import json
import os
import sys
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import numpy as np
from PIL import Image


DEFAULT_SAM3D_REPO = "/workspace/sam-3d-objects"


@dataclass
class RunnerResult:
    status: str
    image_path: str
    mask_path: str
    output_dir: str
    glb_path: Optional[str]
    ply_path: Optional[str]
    obj_path: Optional[str]
    stl_path: Optional[str]
    metadata_path: str
    elapsed_seconds: float
    notes: list[str]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def log_event(stage: str, **payload: Any) -> None:
    print(json.dumps({"time": utc_now(), "stage": stage, **payload}), flush=True)


def ensure_sam3d_imports(repo_path: Path) -> Any:
    notebook_path = repo_path / "notebook"
    if not notebook_path.exists():
        raise RuntimeError(f"SAM 3D notebook path not found: {notebook_path}")

    sys.path.insert(0, str(notebook_path))
    try:
        from inference import Inference, load_image, load_mask  # type: ignore
    except Exception as exc:
        raise RuntimeError(
            "Could not import SAM 3D inference helpers. Activate the sam3d-objects environment "
            "and run this from a Linux NVIDIA GPU machine."
        ) from exc

    return Inference, load_image, load_mask


def create_mask_from_alpha_or_luminance(image_path: Path, mask_path: Path, threshold: int) -> Path:
    image = Image.open(image_path).convert("RGBA")
    rgba = np.asarray(image)
    alpha = rgba[..., 3]

    if int(alpha.min()) < 255:
        mask = alpha > threshold
        source = "alpha"
    else:
        rgb = rgba[..., :3].astype(np.int16)
        near_white = (rgb > 245).all(axis=-1)
        near_black = (rgb < 10).all(axis=-1)
        mask = ~(near_white | near_black)
        if mask.mean() < 0.02:
            mask = np.ones(alpha.shape, dtype=bool)
            source = "full_image"
        else:
            source = "background_heuristic"

    mask_image = Image.fromarray((mask.astype(np.uint8) * 255), mode="L")
    mask_image.save(mask_path)
    log_event("mask_created", mask_path=str(mask_path), source=source, coverage=float(mask.mean()))
    return mask_path


def export_available_outputs(output: dict[str, Any], output_dir: Path, requested_format: str) -> dict[str, Optional[str]]:
    paths: dict[str, Optional[str]] = {"glb": None, "ply": None, "obj": None, "stl": None}

    if "gs" in output:
        ply_path = output_dir / "splat.ply"
        output["gs"].save_ply(str(ply_path))
        paths["ply"] = str(ply_path)
        log_event("exported_ply", path=str(ply_path))

    mesh = output.get("glb") or output.get("mesh")
    if mesh is not None and hasattr(mesh, "export"):
        glb_path = output_dir / "model.glb"
        mesh.export(str(glb_path))
        paths["glb"] = str(glb_path)
        log_event("exported_glb", path=str(glb_path))

        if requested_format in {"obj", "all"}:
            obj_path = output_dir / "model.obj"
            mesh.export(str(obj_path))
            paths["obj"] = str(obj_path)
            log_event("exported_obj", path=str(obj_path))

        if requested_format in {"stl", "all"}:
            stl_path = output_dir / "model.stl"
            mesh.export(str(stl_path))
            paths["stl"] = str(stl_path)
            log_event("exported_stl", path=str(stl_path))

    if not paths["glb"]:
        log_event(
            "glb_not_exported",
            note="SAM 3D returned no mesh-like output with export(); PLY splat may still be valid.",
            output_keys=sorted(output.keys()),
        )

    return paths


def run_sam3d(
    image_path: Path,
    mask_path: Optional[Path],
    output_dir: Path,
    repo_path: Path,
    checkpoint_tag: str,
    seed: int,
    requested_format: str,
    mask_threshold: int,
) -> RunnerResult:
    started = time.time()
    output_dir.mkdir(parents=True, exist_ok=True)
    notes: list[str] = []

    if mask_path is None:
        mask_path = output_dir / "auto_mask.png"
        create_mask_from_alpha_or_luminance(image_path, mask_path, mask_threshold)
        notes.append("Mask was generated from alpha/background heuristic. Replace with SAM 2 or manual masking for quality.")

    Inference, load_image, load_mask = ensure_sam3d_imports(repo_path)
    config_path = repo_path / "checkpoints" / checkpoint_tag / "pipeline.yaml"
    if not config_path.exists():
        raise RuntimeError(f"SAM 3D checkpoint config not found: {config_path}")

    log_event("loading_model", config_path=str(config_path))
    inference = Inference(str(config_path), compile=False)

    log_event("loading_inputs", image_path=str(image_path), mask_path=str(mask_path))
    image = load_image(str(image_path))
    mask = load_mask(str(mask_path))

    log_event("running_sam3d", seed=seed)
    output = inference(image, mask, seed=seed)
    log_event("sam3d_complete", output_keys=sorted(output.keys()))

    paths = export_available_outputs(output, output_dir, requested_format)
    elapsed = time.time() - started

    metadata_path = output_dir / "metadata.json"
    result = RunnerResult(
        status="complete" if (paths["glb"] or paths["ply"]) else "failed",
        image_path=str(image_path),
        mask_path=str(mask_path),
        output_dir=str(output_dir),
        glb_path=paths["glb"],
        ply_path=paths["ply"],
        obj_path=paths["obj"],
        stl_path=paths["stl"],
        metadata_path=str(metadata_path),
        elapsed_seconds=round(elapsed, 3),
        notes=notes,
    )
    metadata_path.write_text(json.dumps(asdict(result), indent=2), encoding="utf-8")
    log_event("wrote_metadata", metadata_path=str(metadata_path))
    return result


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run SAM 3D Objects for one CappyMesh job.")
    parser.add_argument("--image", required=True, type=Path, help="Input PNG/JPG/WEBP path.")
    parser.add_argument("--mask", type=Path, help="Optional mask image path. White/object, black/background.")
    parser.add_argument("--out", required=True, type=Path, help="Output directory.")
    parser.add_argument("--sam3d-repo", default=os.environ.get("SAM3D_REPO", DEFAULT_SAM3D_REPO), type=Path)
    parser.add_argument("--checkpoint-tag", default=os.environ.get("SAM3D_CHECKPOINT_TAG", "hf"))
    parser.add_argument("--seed", default=42, type=int)
    parser.add_argument("--format", default="glb", choices=["glb", "obj", "stl", "all"])
    parser.add_argument("--mask-threshold", default=16, type=int)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    try:
        result = run_sam3d(
            image_path=args.image,
            mask_path=args.mask,
            output_dir=args.out,
            repo_path=args.sam3d_repo,
            checkpoint_tag=args.checkpoint_tag,
            seed=args.seed,
            requested_format=args.format,
            mask_threshold=args.mask_threshold,
        )
    except Exception as exc:
        log_event("failed", error=str(exc))
        raise

    print(json.dumps(asdict(result), indent=2))


if __name__ == "__main__":
    main()

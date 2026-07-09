from __future__ import annotations

import json
import time
from datetime import datetime, timezone


STAGES = [
    "validate_image",
    "generate_or_request_mask",
    "run_sam3d_objects",
    "postprocess_mesh",
    "bake_texture",
    "export_glb",
]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def main() -> None:
    print("CappyMesh mock GPU worker starting")
    for index, stage in enumerate(STAGES, start=1):
        time.sleep(0.8)
        print(json.dumps({"time": now_iso(), "stage": stage, "progress": round(index / len(STAGES), 2)}))
    print(
        json.dumps(
            {
                "time": now_iso(),
                "status": "complete",
                "glbUrl": "/mock-assets/cappymesh-demo.glb",
                "notes": "Replace this with SAM 3D Objects inference and Blender/trimesh export validation.",
            }
        )
    )


if __name__ == "__main__":
    main()

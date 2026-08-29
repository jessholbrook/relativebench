"""Pinned MLX conversion and provenance helpers for Apple-silicon smoke runs."""

import json
import platform
from importlib.metadata import version
from pathlib import Path

from .artifacts import sha256_file, write_json
from .manifest import validate_pilot

PROVENANCE_FILE = "relativebench-provenance.json"


def runtime_versions():
    return {
        "python": platform.python_version(),
        "mlx": version("mlx"),
        "mlx_lm": version("mlx-lm"),
        "huggingface_hub": version("huggingface-hub"),
        "tokenizers": version("tokenizers"),
        "transformers": version("transformers"),
    }


def model_file_hashes(model_dir):
    model_dir = Path(model_dir)
    return {
        str(path.relative_to(model_dir)): sha256_file(path)
        for path in sorted(model_dir.rglob("*"))
        if path.is_file() and path.name != PROVENANCE_FILE
    }


def prepare_quantized_model(pilot_path, model_role, output_dir, bits=4, group_size=64):
    """Convert one exact catalog revision to MLX and record every derived file hash."""
    if model_role not in {"previous", "new"}:
        raise ValueError(f"Unknown model role: {model_role}")

    validation = validate_pilot(pilot_path)
    if not validation["valid"]:
        raise ValueError("Invalid pilot configuration: " + "; ".join(validation["errors"]))

    output_dir = Path(output_dir).resolve()
    if output_dir.exists():
        raise ValueError(f"Output directory already exists: {output_dir}")

    model = validation["pilot"]["models"][model_role]
    from huggingface_hub import snapshot_download
    from mlx_lm import convert

    source_path = snapshot_download(
        repo_id=model["repository"],
        revision=model["revision"],
    )

    convert(
        source_path,
        mlx_path=str(output_dir),
        quantize=True,
        q_bits=bits,
        q_group_size=group_size,
        q_mode="affine",
    )

    provenance = {
        "provenance_version": "0.1.0",
        "pilot_id": validation["pilot"]["pilot_id"],
        "model_role": model_role,
        "model_id": model["id"],
        "source_repository": model["repository"],
        "source_revision": model["revision"],
        "transformation": {
            "format": "mlx",
            "quantization_mode": "affine",
            "bits": bits,
            "group_size": group_size,
        },
        "runtime": runtime_versions(),
        "files": model_file_hashes(output_dir),
    }
    write_json(output_dir / PROVENANCE_FILE, provenance)
    return provenance


def load_provenance(model_dir):
    path = Path(model_dir) / PROVENANCE_FILE
    if not path.is_file():
        raise ValueError(f"MLX model is missing {PROVENANCE_FILE}: {model_dir}")
    return json.loads(path.read_text())

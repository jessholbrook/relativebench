# Inference Runtime

Status: **Reproducible pinned-model MLX smoke complete**
Profile: **apple-m4-16gb-mlx-4bit-v1**

## Decision

The first local smoke run uses MLX-LM 0.31.3 on the recorded Apple M4 host. The runner converts each catalog-pinned Hugging Face revision locally to affine 4-bit MLX weights with group size 64, then runs the models sequentially. Every converted file is hashed and its provenance records the original repository and 40-character revision.

This profile validates model loading, chat-template behavior, seeding, sampling, response capture, and artifact hashing. It is not the primary evaluation profile: the local host has 16 GB unified memory and cannot safely execute either selected BF16 checkpoint directly. Quantized smoke outputs are excluded from all headline capability, compatibility, and Experience Delta estimates.

Both model roles completed all 12 scenarios with no infrastructure errors. Independent reruns produced identical stable artifact-set hashes for each role. Eleven Qwen2.5 generations stopped normally and one reached the 256-token smoke ceiling; all 12 Qwen3 generations stopped normally, and none emitted a thinking tag. The raw artifacts, run manifests, model provenance, and summary are published under [`data/pilots/qwen2.5-to-qwen3/execution`](../data/pilots/qwen2.5-to-qwen3/execution/).

The machine-readable hardware record is in [`data/pilots/qwen2.5-to-qwen3/execution/hardware-profile-apple-m4-16gb.json`](../data/pilots/qwen2.5-to-qwen3/execution/hardware-profile-apple-m4-16gb.json).

## Frozen controls

- neutral shared system instruction recorded in the pilot profile
- Qwen3 thinking disabled for the frozen condition
- temperature 0.7, top-p 0.8, top-k 20, and min-p 0
- seed 11 for infrastructure smoke; seeds 11, 29, and 47 remain frozen for full collection
- 256 generated-token ceiling for smoke; 1,024 for primary non-thinking collection
- no tools, retrieval, or provider system instruction

## Reproduction

Create the locked environment:

```bash
UV_CACHE_DIR=.uv-cache UV_PYTHON_INSTALL_DIR=.uv-python uv sync --extra mlx
```

Convert one exact revision at a time:

```bash
PYTHONPATH=evals UV_CACHE_DIR=.uv-cache UV_PYTHON_INSTALL_DIR=.uv-python uv run python -m relativebench prepare-mlx \
  data/pilots/qwen2.5-to-qwen3/smoke-pilot.json \
  --model-role previous \
  --output models/qwen2.5-7b-instruct-4bit
```

Run its smoke artifacts:

```bash
PYTHONPATH=evals UV_CACHE_DIR=.uv-cache UV_PYTHON_INSTALL_DIR=.uv-python uv run python -m relativebench mlx-run \
  data/pilots/qwen2.5-to-qwen3/smoke-pilot.json \
  --profile mlx-4bit-non-thinking-smoke-v1 \
  --model-role previous \
  --model-dir models/qwen2.5-7b-instruct-4bit \
  --output outputs/qwen2.5-smoke
```

Repeat conversion and execution for `new`. Keep the two run manifests separate so model memory can be released between processes.

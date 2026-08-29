# Evaluation reference package

The dependency-free Python package contains the canonical Protocol v0.1 point-estimate implementation. It is intentionally small enough to audit independently from the website.

Calculate Experience Delta from JSONL judgments:

```bash
PYTHONPATH=evals python3 -m relativebench experience judgments.jsonl
```

Calculate compatibility flips from JSONL scored pairs:

```bash
PYTHONPATH=evals python3 -m relativebench flips scored-pairs.jsonl
```

The runner includes manifest validation, deterministic dry-run artifacts, a provenance-checked MLX adapter, resumable per-artifact checkpoints, independent hash/completeness verification, sequential model-role execution, protocol weighting, and two-way clustered percentile intervals. The pinned-revision 4-bit full-corpus rehearsal is complete; full-precision primary execution remains gated on an appropriate host.

Validate the selected pilot:

```bash
PYTHONPATH=evals python3 -m relativebench validate-pilot data/pilots/qwen2.5-to-qwen3/pilot.json
```

Exercise the complete artifact pipeline without downloading or calling a model:

```bash
PYTHONPATH=evals python3 -m relativebench dry-run \
  data/pilots/qwen2.5-to-qwen3/pilot.json \
  --profile frozen-non-thinking-v1 \
  --output /tmp/relativebench-dry-run
```

Verify a completed or resumed model run without loading its model:

```bash
PYTHONPATH=evals python3 -m relativebench verify-run \
  data/pilots/qwen2.5-to-qwen3/rehearsal-pilot.json \
  --profile mlx-4bit-non-thinking-full-corpus-rehearsal-v1 \
  --model-role previous \
  --output data/pilots/qwen2.5-to-qwen3/execution/full-corpus-rehearsal/previous
```

Analyze judgment JSONL with the preregistered two-way clustered percentile interval:

```bash
PYTHONPATH=evals python3 -m relativebench analyze judgments.jsonl \
  --replicates 10000 \
  --seed 20260828
```

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

Bootstrap inference, provider adapters, and artifact manifests belong to the pilot runner milestone and are not represented as complete here.

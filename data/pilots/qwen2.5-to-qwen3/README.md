# Qwen transition pilot

This directory contains the selected candidate configuration, the reviewed 120-scenario candidate manifest, and the original 12-scenario smoke subset for:

```text
Qwen2.5-7B-Instruct -> Qwen3-8B
```

`pilot-scenarios.json` is the manifest referenced by `pilot.json`. It contains 20 scenarios in each of six categories with a 6 easy / 8 medium / 6 hard difficulty mix per category. `smoke-scenarios.json` remains as a small fixture for fast infrastructure checks and cannot produce a publishable model result.

Author review and automated structural review are complete. Independent domain review is still required before this candidate can be frozen for collection; see [`docs/scenario-review.md`](../../../docs/scenario-review.md).

Activation requires the gates in [`docs/first-pilot-transition.md`](../../../docs/first-pilot-transition.md), including a fixed runtime/hardware profile and incumbent recruitment feasibility.

The local MLX hardware profile and independently reproduced smoke artifacts are under [`execution/`](execution/). They validate infrastructure only and are excluded from benchmark estimates.

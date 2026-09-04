# RelativeBench

**How will the next model feel?**

RelativeBench evaluates model transitions rather than isolated model snapshots. It combines conventional benchmark deltas with item-level compatibility and human judgments from people who used the predecessor.

The primary unit is a directed transition:

```text
previous model -> new model
```

For every transition, RelativeBench reports three separate layers:

1. **Capability delta** — changes on transparent standard benchmarks.
2. **Compatibility delta** — positive and negative flips on identical items.
3. **Experience Delta (ΔE)** — the direction and magnitude of change perceived by users.

This repository is currently at **Protocol v0.1 / Milestone 4 internal blind-rating workflow**. The reviewed candidate manifest contains 120 scenarios for Qwen2.5-7B-Instruct → Qwen3-8B, both pinned revisions have independently reproduced 4-bit MLX artifacts across the entire corpus, and a counterbalanced owner-only rating workspace is ready for collection QA. The website uses illustrative data until the preregistered pilot is complete.

## Local development

Requirements: Node.js 22.13 or newer and Python 3.9 or newer.

```bash
npm install
npm run dev
```

Run all current checks:

```bash
npm run check
npm run build
```

## Repository map

```text
app/                  public website
components/ui/        accessible interface primitives
data/catalog/         versioned model and transition metadata
data/pilots/          selected pilot configuration and scenarios
docs/                 protocol, analysis plan, governance, and policy
evals/relativebench/  reference metric implementation
evals/tests/          metric and catalog verification
lib/                  website-facing metric implementation and tests
schemas/              versioned JSON Schemas
```

## Methodological status

- The constructs and estimands are frozen for the first pilot in [docs/methodology.md](docs/methodology.md).
- Statistical decisions are preregistered in [docs/statistical-analysis-plan.md](docs/statistical-analysis-plan.md).
- Pilot scope and exit criteria are in [docs/pilot-plan.md](docs/pilot-plan.md).
- Scenario construction, balance, and review evidence are in [docs/scenario-review.md](docs/scenario-review.md).
- The frozen local runtime, resumable runner, and rehearsal limitations are in [docs/inference-runtime.md](docs/inference-runtime.md).
- The blinded packet, interface sequence, and internal QA boundary are in [docs/internal-rating-pilot.md](docs/internal-rating-pilot.md).
- Mechanical end-to-end rating QA is complete for both mirrored forms. The exported choices were automated interface fixtures, not human judgments; independent human/domain review and primary collection remain pending.
- The `/demo` route is a reader-facing example report; all displayed models, scores, ratings, and run records are synthetic.
- No real model result should be presented as authoritative until the pilot gates pass.
- The selected candidate and immutable model revisions are documented in [docs/first-pilot-transition.md](docs/first-pilot-transition.md).

Validate and dry-run the pilot without model downloads:

```bash
PYTHONPATH=evals python3 -m relativebench validate-pilot \
  data/pilots/qwen2.5-to-qwen3/pilot.json

PYTHONPATH=evals python3 -m relativebench dry-run \
  data/pilots/qwen2.5-to-qwen3/pilot.json \
  --profile frozen-non-thinking-v1 \
  --output /tmp/relativebench-dry-run
```

## Contributing

Protocol changes must be proposed before result collection begins and recorded with a protocol version. See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/governance.md](docs/governance.md).

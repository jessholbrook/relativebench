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

The website is being prepared as a **public showcase**, separate from participant collection. It includes the homepage, practical benchmark guide, methodology, example report, and local-only rater experience. The current deployment remains private until explicit launch approval. No human preference results have been collected; the example report and rehearsal ratings aren't published model evidence.

For deployment steps, launch gates, rollback, and the separate research-collection boundary, see [the public launch runbook](docs/public-launch.md).

## Local development

Requirements: Node.js 22.13 or newer and Python 3.13 (the version used in CI).

```bash
npm ci
python3 -m pip install -r requirements-validation.txt
npm run dev
```

Run all current checks:

```bash
npm run check
npm run build
```

Copy `.env.example` to `.env.local` only if you need to override the canonical origin or indexing flag. Keep indexing disabled during private review. These settings never grant site access. The public build refuses unreviewed static assets or a primary participant packet.

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
- The `/demo` route is a reader-facing example report; its model names, scores, and ratings are examples, not collected results.
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

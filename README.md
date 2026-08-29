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

This repository is currently at **Protocol v0.1 / Milestone 1 foundation**. The website uses illustrative data until the preregistered pilot is complete.

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
- No real model result should be presented as authoritative until the pilot gates pass.

## Contributing

Protocol changes must be proposed before result collection begins and recorded with a protocol version. See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/governance.md](docs/governance.md).

# Contributing to RelativeBench

RelativeBench is an evaluation project before it is a leaderboard. Reproducibility and clear limits on claims take priority over adding models quickly.

## Before opening a change

- For protocol changes, explain the construct being changed and the expected effect on published scores.
- For a benchmark adapter, document its version, license, scoring method, and contamination risks.
- For a model transition, provide immutable model identifiers and evidence that the directed predecessor relationship is real.
- For UI changes, preserve clear labels distinguishing illustrative, pilot, and validated data.

## Required checks

```bash
npm run check
npm run build
```

Changes to metric code require tests in both the TypeScript and Python reference implementations. Published snapshots are append-only; corrections receive a new snapshot and an explanatory note.

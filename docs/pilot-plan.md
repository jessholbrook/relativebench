# First Pilot Plan

Status: **candidate protocol; transition not yet selected**

## Goal

Demonstrate that RelativeBench can produce a reproducible transition report and distinguish aggregate score change from item compatibility and perceived change.

## Transition selection criteria

The first transition must have:

- an explicit predecessor-successor relationship
- immutable, simultaneously accessible model versions
- permission to retain evaluation outputs and publish derived results
- comparable tool and system-instruction envelopes
- enough incumbent users to recruit without relying on provider employees
- no known retirement date during collection

The catalog intentionally contains placeholders until a transition passes every criterion.

## Intended sample

- 1 transition in the Model Core track
- 120 scenarios across 6 categories
- 3 generations per model where stochastic sampling applies
- 5 independent paired judgments per response pair
- at least 40 incumbent evaluators in the migration substudy
- balanced left/right order within scenario

These are operational targets, not a formal power claim. A simulation-based power and interval-width analysis is required before collection.

## Build sequence

1. Select and document the transition edge.
2. Freeze the scenario manifest and weights.
3. Implement provider and benchmark adapters.
4. Generate responses and verify artifact hashes.
5. Run the blind rating pilot internally without inspecting aggregate preference.
6. Complete human collection.
7. Execute the frozen statistical plan.
8. Publish a versioned snapshot and methods report.

## Exit gates

- Independent rerun reproduces deterministic results.
- Randomization is balanced and model identity is absent from the rating payload.
- TypeScript and Python point estimates agree on shared fixtures.
- Automated scoring fixtures have 100% expected agreement.
- Human quality-control exclusions are applied symmetrically.
- Every published number traces to a versioned manifest.
- The report clearly labels pilot and illustrative data.

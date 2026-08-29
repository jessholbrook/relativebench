# First Pilot Plan

Status: **candidate selected; smoke runner complete; model execution pending**

## Goal

Demonstrate that RelativeBench can produce a reproducible transition report and distinguish aggregate score change from item compatibility and perceived change.

## Transition selection criteria

The selected Qwen2.5-7B-Instruct → Qwen3-8B transition satisfies the catalog-level criteria below. It must still pass the runtime and recruitment activation gates:

- an explicit predecessor-successor relationship
- immutable, simultaneously accessible model versions
- permission to retain evaluation outputs and publish derived results
- comparable tool and system-instruction envelopes
- enough incumbent users to recruit without relying on provider employees
- no known retirement date during collection

The decision record and exact revisions are in [first-pilot-transition.md](first-pilot-transition.md).

## Intended sample

- 1 transition in the Model Core track
- 120 scenarios across 6 categories
- 3 generations per model where stochastic sampling applies
- 5 independent paired judgments per response pair
- at least 40 incumbent evaluators in the migration substudy
- balanced left/right order within scenario

These are operational targets, not a formal power claim. A simulation-based power and interval-width analysis is required before collection.

## Build sequence

1. ~~Select and document the transition edge.~~ Complete.
2. ~~Implement manifest validation, response artifacts, and dry-run inference.~~ Complete.
3. Expand and review the smoke manifest from 12 to 120 scenarios.
4. Fix the inference runtime and hardware profile, then execute both pinned models.
5. Generate responses and verify artifact hashes.
6. Run the blind rating pilot internally without inspecting aggregate preference.
7. Complete human collection.
8. Execute the frozen statistical plan.
9. Publish a versioned snapshot and methods report.

## Exit gates

- Independent rerun reproduces deterministic results.
- Randomization is balanced and model identity is absent from the rating payload.
- TypeScript and Python point estimates agree on shared fixtures.
- Automated scoring fixtures have 100% expected agreement.
- Human quality-control exclusions are applied symmetrically.
- Every published number traces to a versioned manifest.
- The report clearly labels pilot and illustrative data.

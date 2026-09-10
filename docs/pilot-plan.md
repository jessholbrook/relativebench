# First Pilot Plan

Status: **mechanical blind-rating QA complete; independent review and primary collection pending**

Participant-free follow-up: the [readiness checklist](preparticipant-checklist.md)
now records simulation results, automated full-form browser QA, blinded QC,
allocation checks, and staged BF16 execution. Real primary execution, independent
approval, and the sample-size decision remain pending; slot counts are not recruits.

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
3. ~~Expand and author-review the smoke manifest from 12 to 120 scenarios.~~ Complete. Independent domain review remains an activation gate.
4. ~~Fix the local inference runtime and hardware profile, then execute both pinned revisions.~~ Complete for the preregistered 4-bit infrastructure smoke; full-precision primary execution remains pending.
5. ~~Generate full-corpus rehearsal responses and verify artifact hashes.~~ Complete for the single-seed 4-bit infrastructure profile; three-seed full-precision primary generation remains pending.
6. ~~Complete mechanical end-to-end blind-rating QA without inspecting aggregate preference.~~ Complete. Both mirrored forms produced complete, schema-valid, blinded test exports; resume, reset, export, keyboard navigation, and the completion table were exercised. These automated choices are not human judgments or benchmark results.
7. Complete independent human/domain review of the scenarios, rubrics, blinding, and response rendering.
8. Satisfy recruitment, consent, power, and full-precision runtime activation gates, then generate the preregistered three-seed primary artifacts.
9. Complete human collection.
10. Execute the frozen statistical plan.
11. Publish a versioned snapshot and methods report.

## Exit gates

- Independent rerun reproduces deterministic results.
- Randomization is balanced and model identity is absent from the rating payload.
- TypeScript and Python point estimates agree on shared fixtures.
- Automated scoring fixtures have 100% expected agreement.
- Human quality-control exclusions are applied symmetrically.
- Every published number traces to a versioned manifest.
- The report clearly labels pilot and illustrative data.

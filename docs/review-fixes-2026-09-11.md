# AI review remediation — September 11, 2026

Baseline: `bae0dc4edc75539f72cead0055a2ae7e8207657d` (study-design proposal).
This is an engineering and AI-review record, not human ethics, consent, domain
or statistical sign-off. No primary runs or participant ratings were produced.

## Original findings

| Finding | Remediation |
| --- | --- |
| R1: mixed BF16 resume | Commit snapshot, runtime, context, attention and host/environment fingerprint to every artifact; compare before resume and independently verify within-run consistency. Incomplete coherent artifacts can recover a missing first checkpoint, but cannot resume with a different adapter fingerprint. |
| R2: exports unbound to stimuli | Hash exact prompts, rubrics, response text/IDs, scales and assignment order; export response IDs and digest; reject stale local restore. Primary verification also requires the independently retained private freeze-time receipt. |
| R3: crate capacity/reference mismatch | New candidate explicitly uses 10 weight units, whose optimum is $28. Original rehearsal manifest is unchanged. |
| R4: Back overwrote first-pass scores | Retain initial left/right scores per assignment; corrections have a separate replayable history and final scores. Back/reopen remain available, including across task boundaries. |
| R5: objective/preference mismatch | Separate deterministic candidate correctness scoring from human preference and human rubric judgments; add 42 content-bound scoring rules, explicit workspace wording, and an unresolved protocol-approval gate. |
| R6: flattened reference whitespace | Preserve reference line breaks/indentation in the rater. |
| R7: missing category changed target | Suppress the observed-only estimate when a planned category has no retained ratings; report planned/observed support and preserve full-plan worst-case bounds. |
| R8: simulation/production cluster mismatch | Matrix bootstrap resamples only observed scenarios/evaluators, while requiring support for every planned category. |
| R9: failures inflated design success | Precision/detection rates use all attempted trials; coverage/width summaries are explicitly conditional, and all-failed batches remain reportable. |
| R10: incomplete critical seed coverage | Require an explicit frozen seed list and every critical task × seed before clearance. |
| R11: empty packets passed | Shared nonempty/unique/order/reference validation in both packet auditor and session verifier; primary receipt commits the expected assignment list. |
| R12: unstated UTC rule | Corrected SQL prompt explicitly requests UTC calendar dates. |

The new manifest also clarifies sequence generation, topological-sort tie
breaking, a confirmed certificate cause, and JSON Schema dialect/format behavior.
It corrects the claim that overlapping cost estimates necessarily conflict.
These are candidate edits, not retroactive corrections to old response artifacts.

## Review and validation

Fresh read-only reviewers covered statistics, execution/packet integrity, and
rater/corpus/scoring changes. The first statistics re-review found no actionable
issues. The other reviews caught a packet-auditor bypass, pre-checkpoint resume
regression, and scorer rejection of equivalent CSV/XML/numeric answers. Those
received fixes and regression tests, followed by another review pass.

Final scoped AI reviews reported no remaining actionable findings. The statistics
reviewer ran 15 focused tests; the execution reviewer ran 25; the rater/corpus
reviewer ran the five objective-scoring tests and inspected the revised history
and content-binding logic. Reviews were read-only and did not grant any external
approval.

Validation passed: 73 Python tests, 26 TypeScript tests, TypeScript checking,
lint, the four-route production build, and all 21 isolated browser tests. The
browser suite independently verifies exports from both complete 120-task
rehearsal forms, plus Back/reopen corrections, reference whitespace, stale
restoration, access gating, failure handling, keyboard controls and automated
accessibility checks. These are software fixtures, not participant data.

Both full reruns completed: 1,600 simulation trials / 16 million bootstrap draws
and 2,000 design-study trials / 20 million draws. Every historical per-trial record
was reproduced exactly, with zero failed trials. See the hashed comparison in
`data/validation/review-fixes-2026-09-11/comparison.json`. Historical evidence
remains untouched. The numerical conclusions are unchanged: these assumed
designs do not establish participant-calibrated precision or sufficient power,
and outcome-dependent missingness still produces severe bias.

The full check uses the pinned temporary Python environment; an earlier mirror
attempt used the wrong interpreter and failed YAML tests. It was superseded by
the successful full run with all dependencies. The temporary validation mirror
was checked against the edited application source; no production state or local
user rating sessions were touched.

## Operational boundaries

Use `primary-candidate.json` for newly prepared primary work. Existing `pilot.json`
and the old manifests/runs remain reproducible historical rehearsal inputs.
No old activation can approve the new candidate plan hash. Primary collection
still requires the existing host/runtime, smoke replay, scenario review, sample
size, consent/recruitment and delivery gates, plus correctness/preference review.

Hashes detect mismatches; they are not signatures or proof that a rater is human,
eligible, honest or consented. Keep freeze-time receipts outside rater uploads
and never reconstruct a trusted receipt from a submitted packet. The owner-only
site remains unchanged until a separate publishing request.

Pre-change local sessions lack the new stimulus/exposure commitments. They are
preserved but not silently upgraded or resumed as trustworthy first-pass data;
the interface explains the mismatch and permits a separate rehearsal code.

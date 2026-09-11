# Collection rules prepared before participants

Status: **candidate operational rules; independent approval and preregistration
still required**. These supplement, and do not silently replace, analysis plan
0.1.0. The live rater packet remains an infrastructure rehearsal.

## Allocation and stopping

Freeze the manifest, seeds, evaluator-slot allocation, randomization seed, and
hashes before collecting preferences. The prepared plan has 1,800 assignments
and prevents the same evaluator seeing multiple seeds of a scenario. Five
judgments per pair allow a 2:3 split, not exact within-pair equality. Publish
realized side balance and workload after attrition as well as planned balance.
Do not infer balance from a hash-parity form selector or replenish only whichever
side has unfavorable responses. Reserve/replacement slots, if needed, require an
outcome-blind policy frozen before invitations.

Do not stop early because the estimate looks favorable. Stop for safety/privacy,
execution-integrity failures, or invalid protocol conditions; retain the stopped
run ID and reasons. New conditions require a new version and run ID.

## Blinded quality control

`prepare_collection` accepts side-relative ratings plus separately verified
incumbent/attention flags. It checks assignment ownership, duplicates, validity,
timing, and verified flags **before** consulting the private direction key.
All copies of duplicate assignments are quarantined; input order never chooses
the favorable duplicate. The original records remain intact and every decision
has reason codes. Unknown assignments and missing/malformed scores never count
as neutral ratings. Consent verification must precede admission to this tool;
boolean flags are not identity or consent authentication.

The existing plan mentions a minimum reading-time rule without a value. Do not
invent a supposedly validated cutoff. The utility defaults to zero (valid
nonnegative durations only); a nonzero exclusion cutoff must be explicitly passed
from an approved frozen plan. Short durations should be inspected blind as flags,
not automatically called low quality. Attention items, pass rules, accessibility
accommodations, withdrawal handling, and the final timing rule need independent
review before collection. No raw reviewer codes, contact details, consent forms,
or private role keys belong in the public repository or report artifacts.

## Missingness and critical regressions

Publish planned, received, excluded, and retained counts, with category and cohort
breakdowns. Never impute a missing preference into the headline. The utility
separately recalculates all-planned-rating lower/upper bounds with missing ratings
at −2 and +2 under the planned weights. These are worst-case sensitivity bounds,
not confidence intervals or replacement observations. They expose the fragility
seen in the outcome-dependent-dropout simulation; they do not repair selection bias.

Freeze critical scenario IDs before scoring. The candidate guardrail tolerates
zero new critical failures on previously passed tasks, and does not clear missing
or malformed scores. Independently verify all scenario/seed artifacts as well;
a guardrail check alone cannot establish completeness. Safety-category membership
alone is not sufficient independent critical-task selection. Retain objective
regressions even if raters prefer the new model overall.

Only after the analysis plan, task set, eligibility/consent, runtime, assignment
delivery, and stopping rules are approved should primary collection be enabled.

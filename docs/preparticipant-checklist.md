# Participant-free readiness pass

Status: engineering and simulation work implemented; this is not permission to
collect or a claim that the pilot is scientifically validated.

## Completed locally

- [x] Reproducible allocation generator and independent allocation audit: 120
  scenarios × 3 seeds × 5 judgments = 1,800 slots; 40 evaluators receive 45 each.
  Each evaluator sees a scenario only once. Within-pair side balance is 2:3 or
  3:2 because five is odd, not an impossible claim of exact 50:50.
- [x] Simulation runner with known population truths, independent Monte Carlo
  trials, 10,000 bootstrap draws per trial, coverage/width/bias/detection rates,
  Monte Carlo uncertainty, and retained per-trial results.
- [x] Sparse matrix implementation cross-checked against the production weighted
  estimator for 100 fixed multiplicity draws, including empty-category draws.
- [x] Blinded QC and duplicate quarantine, explicit missingness counts, no imputed
  headline, and worst-case all-planned-rating sensitivity bounds.
- [x] Critical-task regression guardrail with fail-closed missing/invalid scores.
- [x] Hash-committed primary execution/allocation plan and an offline BF16 adapter
  with snapshot/runtime/precision checks. Contract tests do not replace a GPU run.
- [x] Private assigned-packet generator, fixed-form/code binding in the rater,
  activation gate, and separate primary-export verification. No primary packets
  were deployed and no invitations were sent.
- [x] Isolated browser regression tests for both complete 120-task forms, resume,
  editing, export, keyboard safeguards, storage read/write/delete failures,
  corrupted sessions, failed packet loading, navigation, and mobile overflow.
- [x] Automated accessibility checks for all four routes and active rating states;
  contrast and accordion hydration fixes. Manual assistive-technology review remains.
- [x] CI runs the numerical tests and browser suite; failed browser runs retain
  traces. No participant outputs or reviewer codes enter these artifacts.

## Decisions or external resources still required before collection

- [ ] Choose the final sample-size/precision target after reviewing the simulation
  report. The existing minimum of 40 is not automatically adequate; no recruitment
  target or importance threshold has been silently changed.
- [ ] Approve a suitable full-precision execution host and lock its actual runtime.
  The current Mac was verified as Mac16,10 with 16 GiB memory. It cannot satisfy the
  candidate BF16 CUDA adapter's ≥32 GiB GPU preflight. No GPU was rented, no large
  model was downloaded, and no primary run was started.
- [ ] Independent review of scenarios, rubrics, critical-task selection, blinding,
  primary packet delivery, collection rules, and consent/recruitment materials.
  This requires a reviewer, but not recruited raters. An author or automated check
  cannot sign off as that independent reviewer.
- [ ] Run and independently replay the BF16 smoke on the approved host, freeze the
  runtime/host evidence, then generate and verify both 360-artifact primary sets.
- [ ] Approve consent and recruit eligible incumbents, collect real ratings, and
  calibrate the provisional importance threshold for future non-pilot claims.

The existing `/rate` remains the **rehearsal** packet. It has not been switched to
primary collection. The candidate allocation is an offline plan, not a roster or
a deployed personalized assignment service. Once the primary artifacts exist,
run the prepared packet generator and independently review its actual outputs
before invitation. Do not reuse the full-form hash-parity selector as the primary
allocation algorithm. Participant access and authorized packet delivery remain
external activation steps; existing site access remains owner-only.

See [simulation results](simulation-validation.md),
[collection rules](collection-readiness.md), and
[full-precision runbook](primary-execution-runbook.md).
Exact check coverage and unperformed work are recorded in
[the verification record](preparticipant-verification.md).

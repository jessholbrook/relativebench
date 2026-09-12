# Study design decision proposal

September 11, 2026. **Prospective simulation, not human evidence.** No sample size,
scenario manifest, important-difference threshold, analysis plan, or collection
activation has been changed. Expanded designs describe hypothetical independent
tasks that would still need to be authored and independently reviewed.

## The decision we are designing for

The agreed starting point is roughly **±5 Experience Delta points** on the overall
incumbent-user estimate. For screening, operationalize that as a 95% interval of
total width at most 10 points. Half-width is `(upper − lower) / 2`; the actual
percentile interval need not be symmetric around the point estimate.

I propose examining whether at least **80% of repeated studies** meet that width
target across predeclared plausible conditions, rather than relying on average
width alone. This frequency is a proposed design criterion for review, not an
existing protocol requirement. Coverage and bias must be assessed separately:
an artificially narrow interval that misses the truth is not a success. Neither
the 80% frequency nor a nominal 95% interval is a promise about a particular run.

Upgrade detection is a different question. The current provisional upgrade rule
requires the **lower** interval bound to exceed +5. We separately simulate a true
ΔE of +10. An approximately symmetric ±5 interval centered at +10 would sit right
on that decision boundary, so ±5 precision alone does not imply an 80% chance of
declaring an upgrade. Do not quietly move the true effect to an easier value to
claim that target was met. The ±5 important-difference cutoff itself still needs
anchor-based validation; it remains unchanged here.

Category-level estimates stay exploratory. The overall target does not certify
six separate category claims or rule out a critical-task regression. Scenario
review, frozen critical-task scoring, missingness sensitivity, and the existing
publication gates remain necessary regardless of sample size.

## What was compared

All five designs keep six equally weighted categories, three generated response
pairs per scenario, and five independent ratings per pair. The allocator prevents
one evaluator from seeing the same scenario twice and balances each person's
total workload to within one assignment. Thus each scenario has 15 judgments;
more evaluators at a fixed task count redistribute those judgments rather than
increasing their total.

| Scenarios | Evaluators | Paired judgments | Judgments per evaluator | Generation requests, both models |
| ---: | ---: | ---: | ---: | ---: |
| 120 | 40 | 1,800 | 45 | 720 |
| 120 | 160 | 1,800 | 11–12 | 720 |
| 240 | 160 | 3,600 | 22–23 | 1,440 |
| 480 | 320 | 7,200 | 22–23 | 2,880 |
| 480 | 640 | 7,200 | 11–12 | 2,880 |

These are evaluator **slots**, not eligible people recruited or verified. No real
task prompt is cloned to inflate independent sample size. Even the 120-scenario
case simulates independent latent task effects, using the real manifest's six
category names and count—not estimated difficulty or performance of its prompts.
Changing the real scenario count requires a new manifest and protocol version.

## Preliminary design decision

Do **not** freeze a recruitment number from this screen alone. The practical
choice for independent review is whether to run the existing smaller design as
an explicitly exploratory calibration pilot, without a ±5 promise, or to invest
in a substantially larger and newly reviewed task set for a precision-driven
study. Keeping the smaller design would change the ambition of the first
collection, not make its uncertainty disappear. That choice needs the owner's
agreement and a documented plan before collection.

For the precision-driven path, take the 480-task candidates forward for review
of workload, task independence, and recruitment feasibility. They are screened
candidates, **not the globally optimal or minimum sample sizes**: this comparison
does not exhaust intermediate task/rater counts or alternative allocations.
The additional target of reliably declaring a true +10 change an upgrade still
requires separate design work; passing a width screen must not clear that gate.

No threshold was raised, no variance assumption was tuned after seeing a result,
and no planned task was removed to make a design look successful. We also have
not silently redefined the estimand to generalize only to the fixed 120 tasks;
that could change uncertainty, but it would answer a different question.

## Workload implications

As a burden sensitivity, if one complete paired assignment took 2–4 minutes,
45 assignments would take 90–180 minutes; 22–23 would take 44–92 minutes; 11–12
would take 22–48 minutes. These are **unmeasured planning assumptions**, excluding
consent, onboarding, breaks, and attention items. Time the real experience before
setting compensation or session length. No participant budget is inferred from
the much smaller GPU bill.

## Measured comparison

The complete [machine-readable evidence](../data/validation/study-design-2026-09-11/results.json)
contains all 2,000 successful trials. There were zero failed trials and zero
rejected unsupported bootstrap draws in this run; sparse-support behavior
remains separately unit-tested, not proven impossible by this observation.

Average 95% interval half-widths are in ΔE points, not percentages of people.
The gain column is the fraction declaring an upgrade when the population truth
is +10 under baseline variation. All figures are rounded; the retained trial
records are authoritative.

| Scenarios / evaluators | Baseline null half-width | Strong-evaluator null half-width | Upgrade detection at true +10 |
| --- | ---: | ---: | ---: |
| 120 / 40 | ±9.32 | ±13.82 | 17% |
| 120 / 160 | ±7.37 | ±8.96 | 23% |
| 240 / 160 | ±5.81 | ±7.82 | 33% |
| 480 / 320 | ±4.11 | ±5.52 | 64% |
| 480 / 640 | ±3.75 | ±4.54 | 72% |

Four times as many raters on the same 120 tasks still did not meet the width
target. More genuinely independent tasks were important. The 480/320 design
met the width screen in 100/100 baseline-null trials but 0/100 strong-evaluator
trials. The 480/640 design met it in 100/100 in each of those conditions. Their
90th-percentile half-widths were respectively 4.23/5.69 and 3.84/4.64 points.
These are finite-simulation results under specified mechanisms, not guarantees
for the real population or proof that intermediate designs cannot work.

The 64% upgrade rate has a Wilson 95% interval of approximately 54–73%; the
72% rate has one of approximately 63–80%. **No tested design demonstrates an
80% upgrade-detection target at true +10.** The near-80 upper bound is not proof
that the largest design meets that goal. Null coverage for the baseline and
strong-evaluator conditions ranged from 94% to 99%, with substantial Monte Carlo
uncertainty; do not interpret that range as universal coverage validation.

Nor does width success reliably establish a sidegrade: under the strong-evaluator
null, 480/640 classified only 12/100 trials as wholly inside −5…+5, despite all
intervals having width at most 10. An interval can be narrow enough yet shifted
across a decision boundary. Keep “inconclusive” available and distinguish it from
“no meaningful difference.”

Independent 25% judgment dropout increased mean half-widths to 9.49, 7.71, 6.01,
4.26, and 3.92 points in table order. The first three designs met the width
criterion in 0/100 trials; the two 480-task designs did so in 100/100. Overall,
480/640 was the only **tested** design to satisfy the proposed width frequency
across all four conditions. Its strong-evaluator-plus-dropout performance is
still unknown because those stressors were not combined here.

## Simulation specification

Each design is tested under four conditions, with 100 independent trials per
condition and 10,000 accepted two-way bootstrap draws per trial. The 20 cells
therefore represent 2,000 simulated studies and 20 million accepted draws.
The same random seeds are reused across designs/conditions to reduce comparison
noise; those cells are not additional independent replications of each other.

Latent ratings contain independent normal scenario, evaluator, response-pair,
and residual effects, cut at −1.5, −0.5, +0.5, +1.5 onto ratings −2…+2. Baseline
SDs are 0.65, 0.5, 0.35, and 0.85 respectively. The response-pair effect is shared
by all five raters of that scenario/seed, addressing a limitation of the earlier
screen. Baseline null has true ΔE 0; the gain condition uses numerical inversion
of the known ordinal expectation to set true ΔE exactly +10, not a sample mean.

The third condition doubles evaluator SD to 1.0 while retaining baseline scenario
and pair variation. The fourth drops 25% of individual judgments independently
of their values. Neither is a calibrated prediction of human behavior. Strong
evaluator variation plus dropout together, whole-person dropout, fatigue,
category-specific response styles, and dependent task families are not simulated
in this pass. New tasks being more redundant than assumed would invalidate the
apparent benefit of expanding the manifest.

Outcome-dependent dropout is **not repaired by more raters**. The earlier
[missingness stress test](simulation-validation.md) produced substantial bias
and severe undercoverage. It remains a failure condition and must not be hidden
by restricting attention to this screen's random-dropout case. No missing rating
is imputed into the observed headline.

## Interpretation and freeze conditions

One hundred trials per cell are suitable for an initial screen, not fine-grained
claims about a 95% coverage guarantee. At 95% observed coverage the Monte Carlo
standard error is about 2.18 percentage points; the Wilson interval is roughly
88.8–97.8%. At an observed 80% success rate the MCSE is 4 points. Report Wilson
bounds for width and upgrade rates, not just rounded point estimates. Even
100/100 width successes has a Wilson lower bound of about 96.3%, not certainty.

After choosing an affordable candidate, preregister the next simulation conditions
and independent seeds, include combined/more adverse mechanisms, and increase
trials before freezing a recruitment target. For scale, 2,000 independent trials
give about 0.49 percentage-point MCSE at 95% coverage. An independent reviewer
must assess the estimator's coverage, omitted assumptions, and acceptance criteria;
this author-produced screen cannot approve itself.

This follows the aims, data-generating mechanisms, estimands, methods, and
performance-measures framework of [Morris, White and Crowther](https://arxiv.org/abs/1712.03198).
The engine reuses the existing ratio estimator and crossed bootstrap; its fixed
multiplicity tests compare against the production implementation. No production
estimator or previously retained simulation has been edited for this proposal.

## Independent review agenda

The independent review should explicitly decide:

- Is the first collection an exploratory calibration pilot, or must it satisfy a
  precision/performance requirement for transition claims? A small pilot cannot
  be described as meeting ±5 merely because the product UI works.
- Are the provisional important difference and a true +10 detection case useful
  decision anchors? If not, choose new anchors on substantive grounds before
  rerunning design selection, not to make an affordable design appear adequate.
- Which scenario/evaluator/pair variance ranges and missingness mechanisms should
  be required stress conditions, and which claims remain valid when they fail?
- Can the intended population supply the needed independent incumbent users?
  Neither repeated judgments from one person nor recruiting ineligible users
  substitutes for that requirement.
- If expanding tasks, are they truly distinct, representative, and scoreable?
  A fourfold increase in IDs or paraphrases is not fourfold independent evidence.
- What Monte Carlo tolerance and preregistered confirmation run are needed before
  selecting the final sample, workload, replacement policy, and stopping rule?

Record the reviewer, date, evidence, conflicts, requested changes, and decision.
An automated review or an author's agreement is not independent approval. No
reviewer has been contacted or marked as approving this proposal.

## Reproduction and evidence

Install the existing `requirements-validation.txt` in an isolated Python 3.13
environment, then run from the repository root with a fresh output path:

```bash
OPENBLAS_NUM_THREADS=1 VECLIB_MAXIMUM_THREADS=1 PYTHONPATH=evals \
  python -m relativebench.design_study --trials 100 --replicates 10000 \
  --seed 20260911 --output /tmp/relativebench-design-study-new.json
```

The result records code/engine/allocation/manifest hashes, Python and NumPy
versions, seeds, allocation audits, per-trial intervals, failures, and unsupported
draw counts. Hypothetical side assignments must never be used as collection keys.
Small-replicate unit tests check software only and are not retained as evidence
that the proposed precision target is achievable.

Verification on September 11: all 59 Python tests passed, including three new
checks for balanced hypothetical slots, known-truth inversion and deterministic
replay, and separation of interval width from coverage/classification. Code
compilation and whitespace checks passed. The result's code hashes and all 20
allocation/width summaries were checked against the retained files. No website
source, dependencies, model adapter, frozen manifest, or production estimator
changed in this proposal, so browser tests were not rerun locally for these
documentation and offline-simulation additions.

The [host proposal](execution-host-proposal.md) covers the separate decision about
generating responses. No host costs, participant recruitment, or independent
review have been approved by this document.

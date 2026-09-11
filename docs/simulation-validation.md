# Simulation-based design assessment

These are generated validation fixtures, not judgments from participants or model
results. The aim is to measure how the current interval procedure behaves, not to
force it to pass. This assessment does not certify coverage for every possible
distribution or settle the pilot's sample size.

## Design and reproduction

The first suite contains 200 independently generated datasets in each of eight
conditions, with 10,000 accepted bootstrap replicates per dataset: 1,600 datasets
and 16 million bootstrap draws. It uses the actual 120-scenario manifest, six
equally weighted categories, three generation seeds, five ratings per pair, and
the new deterministic no-repeat allocation. The 80-evaluator case keeps the same
1,800 assignments; it changes the number of independent people, not the number
of judgments. Workload becomes 22–23 each.

Latent ratings have normal scenario and evaluator effects plus independent
judgment noise (SD 0.85), discretized at −1.5, −0.5, 0.5, 1.5 onto −2…+2. Crossed
cases use scenario SD 0.65 and evaluator SD 0.5; the strong-evaluator case uses
0.25 and 1.0. Gain/loss shifts are ±0.3 on the latent scale. Population ΔE is
calculated analytically from the normal CDF, not estimated from the same dataset.
The first suite does not model a separate shared response-generation effect,
attention failures, real fatigue, or empirically calibrated category effects.

Random missingness removes each rating with probability 0.25. The deliberately
adversarial outcome-dependent condition removes negative ratings with probability
0.65 and other ratings with probability 0.05. Its target remains the **complete
population** mean, not a redefined mean among favorable respondents.

The optional NumPy engine computes the same equal-category/scenario/evaluator
ratio estimator as reference implementation 0.1.1. Tests compare 100 fixed
multiplicity draws with the production implementation, including sparse support.
It uses NumPy's RNG, so seeds are reproducible within this engine, not identical
draw-for-draw to Python's `random` engine. Production analysis is unchanged.

```bash
uv venv --python 3.13 /tmp/relativebench-validation
uv pip install --python /tmp/relativebench-validation/bin/python -r requirements-validation.txt
OPENBLAS_NUM_THREADS=1 VECLIB_MAXIMUM_THREADS=1 PYTHONPATH=evals \
  /tmp/relativebench-validation/bin/python -m relativebench.simulation \
  --trials 200 --replicates 10000 --seed 20260910 --output /tmp/rb-simulation-new.json
```

Use a new output path; the runner refuses overwriting a completed record and
checkpoints partial results separately. The retained
[machine-readable results](../data/validation/preparticipant-2026-09-10/simulation.json)
include per-trial intervals, seeds, code/manifest hashes, versions, allocation
audits, failures, and rejected draws. There were no failed trials or rejected draws
in this first suite; sparse-support rejection is covered separately by tests.

## Findings

| Condition | Coverage | Mean interval width (ΔE points) | Upgrade detection, lower bound > +5 |
| --- | ---: | ---: | ---: |
| Independent null, 40 | 100.0% | 6.95 | 0.0% |
| Crossed null, 40 | 95.0% | 18.55 | 0.5% |
| Crossed gain, 40 | 96.0% | 18.32 | 54.0% |
| Crossed gain, 80 | 97.0% | 15.81 | 63.5% |
| Crossed loss, 40 | 96.0% | 18.35 | 0.0% |
| Random dropout, 40 | 95.5% | 18.93 | 0.5% |
| Outcome-dependent dropout, 40 | 7.5% | 16.32 | 59.5% |
| Strong evaluator effects, 40 | 94.5% | 27.38 | 1.0% |

The gain condition's true ΔE is approximately +13.74 (the JSON retains the exact
analytic value). Loss detection is 36.0% in the mirrored loss case; the finite
simulation draws were not sign-mirrored, so detection rates need not coincide.
Detection rates have Monte Carlo uncertainty of roughly 3–3.5 percentage points
(one standard error), not precision to a tenth of a percent. At 95% observed
coverage, MCSE is 1.54 points and the Wilson 95% interval is 91.0–97.3%. The
independent-null 200/200 result has a Wilson interval of 98.1–100%; zero plug-in
MCSE there is not certainty. Coverage and detection uncertainty are retained in JSON.

## Decisions supported—and not supported

The clustered cases provide encouraging but limited coverage evidence under the
specified mechanisms. The independent case is conservative; crossed resampling
is not an exact iid bootstrap. **Neither 40 nor 80 is demonstrated to achieve an
80% upgrade-detection target in the tested gain condition.** Forty also cannot
reliably establish a narrow ±5 sidegrade under these cluster effects. Retain the
pilot's exploratory framing; choose and freeze the actual precision target before
collection. Do not keep changing simulation assumptions to obtain a desired sample.

Outcome-dependent missingness is a failure condition, not something to hide behind
a robust-sounding interval. The null case acquires about +14 ΔE bias. Collection
must publish planned/observed/excluded denominators and missingness sensitivity
bounds. No missing rating is inserted into the observed headline. Bounds spanning
different conclusions block confident model-transition claims.

This design follows the explicit aims/data-generating-mechanism/estimand/method/
performance approach in [Morris, White and Crowther](https://arxiv.org/abs/1712.03198).
The choice to resample crossed factors is motivated by [Owen's pigeonhole
bootstrap](https://arxiv.org/abs/0712.1111) and [Owen and Eckles](https://arxiv.org/abs/1106.2125),
not a claim that their asymptotic results validate this finite, sparse ratio estimator.

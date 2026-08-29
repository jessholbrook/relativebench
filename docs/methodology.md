# RelativeBench Methodology

Protocol version: **0.1.0**  
Status: **Frozen for the first pilot**  
Last updated: **2026-08-28**

## 1. Purpose

Most leaderboards estimate the capability of a model at one point in time. RelativeBench estimates the change experienced when a person moves from a predecessor to a successor.

The unit of analysis is a directed and justified transition edge, not a global rank:

```text
Transition(previous_model, new_model, track, execution_profile)
```

A release date alone does not define a transition. The catalog must document that users of the predecessor would reasonably be migrated to or choose the successor.

## 2. Separate tracks

RelativeBench never combines these tracks in one score:

- **Model Core:** immutable API or open-weight model identifiers, a controlled system instruction, and a fixed tool envelope.
- **Product Experience:** the complete user-facing surface, including system behavior, tools, memory, search, latency, and interface constraints.

Every result records its track and execution profile. Product Experience results may be more representative but are less reproducible.

## 3. Measurement layers

### 3.1 Capability delta

Standard benchmark scores are shown as a vector of benchmark-specific differences. RelativeBench does not average unrelated benchmarks into a universal capability number.

For benchmark `b`:

```text
capability_delta_b = score_new_b - score_previous_b
```

The benchmark version, prompt template, scoring implementation, and execution settings are part of the result.

### 3.2 Compatibility delta

The same scorable item is executed against both models. Each pair falls into one cell:

| Previous | New | Interpretation |
| --- | --- | --- |
| pass | pass | stable success |
| pass | fail | negative flip |
| fail | pass | positive flip |
| fail | fail | stable failure |

The principal compatibility measures are:

```text
negative_flip_rate = negative_flips / previous_passes
positive_flip_rate = positive_flips / previous_failures
```

Conditional rates are reported with their denominators. When a denominator is zero, the corresponding rate is undefined rather than zero.

### 3.3 Experience Delta (ΔE)

After pointwise assessment, a human evaluator gives one paired transition judgment:

| Rating | Meaning |
| ---: | --- |
| -2 | new is much worse |
| -1 | new is slightly worse |
| 0 | meaningfully indistinguishable |
| +1 | new is slightly better |
| +2 | new is much better |

With non-negative preregistered weights `w_i`:

```text
ΔE = 100 * sum(w_i * rating_i / 2) / sum(w_i)
```

ΔE ranges from -100 to +100. A zero means no net perceived directional change in the sampled task and evaluator population; it does not prove that the models behave identically.

Supporting measures:

```text
preference_lift = 100 * (P(rating > 0) - P(rating < 0))
noticeability = P(rating != 0)
strong_regression_rate = P(rating == -2)
```

The full five-bin response distribution and uncertainty interval accompany every ΔE.

## 4. Transition conditions

Each condition is a separate estimand.

### Frozen workflow (ΔE₀)

Prompts, conversation state, and task procedures developed for the predecessor are applied unchanged. This estimates immediate upgrade experience.

### Adapted workflow (ΔE*)

The workflow may be optimized separately for each model under a symmetric time and information budget. This estimates relative attainable performance.

### Learned transition (ΔEₜ)

Incumbent users work with the successor for a preregistered period and repeat matched tasks. The first pilot uses seven days and denotes the result ΔE₇.

Derived descriptive measures are:

```text
migration_friction = ΔE* - ΔE₀
learning_recovery = ΔE₇ - ΔE₀
```

These are reported descriptively until repeated studies establish their reliability.

## 5. Evaluator cohorts

Results are stratified by cohort:

- **Incumbent:** used the predecessor at least weekly during the preceding four weeks.
- **Fresh:** no more than incidental predecessor use during the preceding four weeks.
- **Domain expert:** passes a task-domain qualification defined before collection.
- **Automated judge:** used only as a separately labeled secondary analysis after calibration against humans.

The headline ΔE for a release transition uses the incumbent cohort. Exposure is self-reported in the first pilot and must be described as such.

## 6. Evaluation procedure

1. Assign a task using a preregistered, seeded randomization schedule.
2. Generate or retrieve responses under the transition execution profile.
3. Blind model identity and randomize left/right order.
4. Ask the evaluator to score each response independently against a task-specific rubric.
5. Reveal both responses together and collect the five-level transition judgment.
6. Collect optional reason tags only after the primary judgment.
7. Record timing, order, display characteristics, and evaluator cohort.

The protocol preserves ties. It does not ask which prose is preferable when an objective scoring rule fully resolves the task.

## 7. Scenario sampling

The first pilot uses a frozen manifest with six intended categories:

- reasoning and analysis
- coding and debugging
- instruction following
- structured output
- factual synthesis
- safety and appropriate refusal

Each scenario records its source, license, category, difficulty, required capabilities, scoring mode, and privacy class. Scenario weights are frozen before model responses are inspected.

Repeated generations share a scenario cluster in uncertainty estimation. Rephrasings of one underlying task are not treated as independent tasks.

## 8. Execution controls

Every run records:

- immutable provider and model identifiers
- collection timestamp
- system instruction hash
- tool and retrieval configuration
- temperature, seed when supported, and token limits
- input and output token counts
- latency and cost metadata when available
- raw response artifact hash
- benchmark and protocol versions

Unavailable predecessor models are not silently approximated. Previously archived outputs may be used only when their execution profile is complete and the limitation is disclosed.

## 9. Bias controls

- Left/right order is balanced within scenario and cohort.
- Pointwise scoring occurs before paired preference.
- Response length and formatting features are retained for sensitivity analysis.
- Duplicate evaluators and implausibly fast sessions are flagged using preregistered rules.
- Benchmark authors and maintainers do not inspect held-out pilot items before execution.
- Automated judging is tested for order reversal consistency and human agreement.

## 10. Claims

RelativeBench estimates change for a defined transition, task distribution, execution profile, and evaluator population. It does not establish universal model quality or a causal effect of architecture changes. Public summaries must link to the corresponding result manifest and protocol version.

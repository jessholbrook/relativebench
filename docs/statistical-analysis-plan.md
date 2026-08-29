# Statistical Analysis Plan

Plan version: **0.1.0**  
Applies to: **first RelativeBench pilot**

## Primary estimand

The primary estimand is weighted Experience Delta under the frozen-workflow condition among incumbent users (`ΔE₀, incumbent`). The unit of randomization is the response-pair presentation. The units of inference are scenarios and evaluators.

## Secondary estimands

- Fresh-user ΔE₀
- Domain-specific ΔE₀
- Preference lift and noticeability
- Negative and positive flip rates on objectively scored items
- Adapted-workflow ΔE*
- Seven-day learned transition ΔE₇
- Descriptive migration friction and learning recovery

Secondary estimates are labeled exploratory in the first pilot.

## Weighting

Scenario category weights are equal in the first pilot. Within a category, scenarios receive equal total weight regardless of the number of sampled generations or judgments. Each evaluator receives equal total weight within a scenario. Any later post-stratification weights must be specified in a new plan version before collection.

## Uncertainty

The primary 95% interval uses a two-way cluster bootstrap:

1. Resample scenarios with replacement within category.
2. Resample evaluators with replacement.
3. Recalculate normalized weights and ΔE.
4. Use the 2.5th and 97.5th percentiles from at least 10,000 replicates.

The reference implementation in Milestone 1 computes point estimates. Bootstrap implementation and simulation validation are an exit requirement for the pilot runner.

Flip-rate intervals use a scenario-cluster bootstrap. Undefined conditional rates remain null.

## Classification

The pilot starts with a provisional minimum important difference of 5 ΔE points. It is used to test presentation logic, not to make a validated scientific claim.

- **Upgrade:** lower interval bound is greater than +5.
- **Regression:** upper interval bound is less than -5.
- **Sidegrade:** interval lies entirely between -5 and +5.
- **Inconclusive:** all other cases.

The threshold will be recalibrated from pilot anchor judgments and frozen before the first public non-pilot comparison.

## Missing and excluded data

- Generation failures are retained as failures when attributable to the evaluated model and marked separately when attributable to infrastructure.
- A judgment is excluded if its primary rating is missing, the evaluator fails a preregistered attention check, or the session violates the minimum reading-time rule.
- Exclusions are applied without reference to which model benefited.
- Both raw and filtered counts are published.
- No missing human rating is imputed.

## Multiplicity

Only the primary estimand receives a confirmatory interpretation. Category and reason-tag analyses include intervals and are explicitly exploratory. No global rank is derived from multiple transition edges in the pilot.

## Sensitivity analyses

The report recalculates ΔE:

- without response pairs in the highest length-difference decile
- after reversing order for automated judges
- using equal judgment rather than equal scenario weights
- excluding each category in turn
- by evaluator exposure frequency

## Stopping rule

Collection targets are fixed before results are inspected. Early stopping is allowed only for safety, privacy, infrastructure integrity, or an execution-profile error that invalidates the comparison. A stopped run is labeled and not resumed under the same run identifier.

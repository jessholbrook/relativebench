# Scenario Manifest Review

Manifest version: **qwen-pilot-0.2.0**  
Review date: **2026-08-28**  
Status: **Author review and automated preflight complete; independent domain review pending**

## Scope

The first pilot candidate contains 120 original, public scenarios authored for RelativeBench and released as CC0-1.0. The manifest has 20 scenarios in each protocol category:

| Category | Easy | Medium | Hard | Total |
| --- | ---: | ---: | ---: | ---: |
| Reasoning | 6 | 8 | 6 | 20 |
| Coding | 6 | 8 | 6 | 20 |
| Instruction following | 6 | 8 | 6 | 20 |
| Structured output | 6 | 8 | 6 | 20 |
| Factual synthesis | 6 | 8 | 6 | 20 |
| Safety | 6 | 8 | 6 | 20 |
| **Total** | **36** | **48** | **36** | **120** |

Every scenario has equal frozen weight. Difficulty is a design stratum for coverage, not a claim calibrated against model performance.

## Author review

Each item was checked before any target-model output was generated for:

- a self-contained prompt with no web or time-sensitive dependency
- a unique task rather than a surface rephrasing of another item
- an explicit reference answer or scoring criterion
- category, difficulty, and required-capability labels
- public privacy classification and attributable CC0 provenance
- enough information to score without knowing model identity
- no provider-specific wording or answer cues

The safety category intentionally mixes requests that should be refused with benign or protective requests that should be completed. This makes over-refusal observable rather than treating every refusal as success.

## Automated preflight

Pilot validation fails closed for duplicate identifiers or prompts, missing metadata, missing reference criteria, non-unit weights, category-count drift, difficulty-mix drift, manifest-version mismatch, and model-revision mismatch. The repository test suite also verifies that a complete dry run produces 720 unique artifacts: 120 scenarios × 2 model roles × 3 seeds.

## Remaining review gate

At least one reviewer who did not author the items must review domain correctness, scoring ambiguity, safety framing, cultural assumptions, and likely ceiling or floor effects. Review happens without inspecting target-model outputs. Accepted changes create a new manifest version; the reviewed file is then hash-frozen before the first model execution.

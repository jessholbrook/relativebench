# First Pilot Transition

Decision date: **2026-08-28**  
Status: **Scenario candidate complete; independent review and execution pending**

## Selection

```text
Qwen2.5-7B-Instruct -> Qwen3-8B
```

Track: **Model Core**

Pinned checkpoints:

| Role | Repository | Revision | License |
| --- | --- | --- | --- |
| Previous | [Qwen/Qwen2.5-7B-Instruct](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct) | `a09a35458c702b33eeacc393d103063234e8bc28` | Apache-2.0 |
| New | [Qwen/Qwen3-8B](https://huggingface.co/Qwen/Qwen3-8B) | `b968826d9c46dd6066d109eabc6255188de91218` | Apache-2.0 |

Revisions were resolved from the repositories' `HEAD` references on the decision date and are immutable inputs to the pilot.

## Why this edge

- The Qwen3 technical report explicitly describes Qwen2.5 as its predecessor.
- The checkpoints are close in scale: approximately 7.61B and 8.2B parameters.
- Both remain simultaneously downloadable and use the same permissive license.
- Both support text chat through standard open inference runtimes.
- Qwen2.5-7B-Instruct has a substantial public installation footprint, making an incumbent-developer cohort more plausible than for a newly introduced family.
- Local or dedicated inference prevents a hosted alias from changing during collection.

## Execution conditions

### Primary: frozen non-thinking

The same system instruction, conversation, sampling parameters, and output budget are used for both models. Qwen3 receives `enable_thinking=false` through its chat template. This preserves a direct-response interaction contract comparable with Qwen2.5.

The profile uses:

- common context ceiling: 32,768 tokens
- maximum new tokens: 1,024
- temperature: 0.7
- top-p: 0.8
- seeds: 11, 29, and 47
- no tools, retrieval, or hidden provider system instruction

### Secondary: adapted thinking

Qwen3 thinking mode is enabled and scored as an adapted-workflow condition. It is never pooled with the primary ΔE₀ estimate. Token use, latency, and visible answer text are reported separately.

## Activation gates

The candidate becomes an active pilot only after:

- a fixed inference runtime and hardware profile are recorded
- both pinned checkpoints produce reproducible smoke-run artifacts
- the full 120-scenario manifest passes independent domain review (author review and automated checks are complete)
- at least 40 qualified Qwen2.5 incumbent users are recruitable
- the participant consent and compensation plan is approved

If incumbent recruitment fails, the run may still validate infrastructure, but it cannot publish the headline incumbent Experience Delta.

## Known limitations

The parameter counts are close rather than identical, and Qwen3 introduces a thinking-mode capability that Qwen2.5 does not possess. Separating controlled non-thinking and adapted-thinking conditions avoids pretending this interaction change does not exist while preserving an interpretable primary comparison.

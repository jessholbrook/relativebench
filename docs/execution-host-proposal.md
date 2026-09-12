# Execution host proposal

Prepared September 11, 2026. Research and cost scenarios only: **no account was
created, instance provisioned, checkpoint downloaded, or expenditure authorized**.
Prices below are advertised USD rates checked today, not an availability guarantee
or a binding quote. Confirm the exact single-GPU configuration and region at launch.

## Recommendation

Use a **single on-demand Runpod Secure Cloud L40S, 48 GB**, for an initial bounded
compatibility and timing test, after the required review and spending approvals.
The public GPU page lists Secure Cloud at $1.09/hour. Prefer dedicated on-demand
compute with direct control of the environment to a managed inference API: the
existing runner needs exact checkpoint revisions, BF16 weights, frozen sampling,
and inspectable runtime evidence. This is a workload-fit recommendation, not a
measured claim that the L40S is the fastest or cheapest per completed run.
[L40S specification and tier pricing](https://www.runpod.io/gpu-models/l40s),
[on-demand billing](https://docs.runpod.io/pods/pricing).

## Shortlist

| Candidate | GPU memory | Advertised single-GPU rate | Compute for 4 / 12 / 24 billed hours | Role |
| --- | ---: | ---: | ---: | --- |
| Runpod Secure Cloud L40S | 48 GB | $1.09/hour | $4.36 / $13.08 / $26.16 | Recommended first compatibility test |
| Runpod A100 PCIe | 80 GB | $1.59/hour | $6.36 / $19.08 / $38.16 | More memory headroom; confirm selected tier/configuration |
| Lambda A6000, **1×** instance | 48 GB | $1.09/hour | $4.36 / $13.08 / $26.16 | Alternative provider if availability or account access favors it |

Sources: [Runpod GPU pricing](https://www.runpod.io/pricing),
[Lambda single-GPU instance table](https://lambda.ai/instances).
The Lambda 1× A6000 table lists 100 GiB system RAM and 512 GiB SSD. Prices exclude
applicable taxes. No console inventory or account-specific quote was checked.
The durations in the table are **billing scenarios**, not measured completion times.

A lower-cost Runpod A40 is also advertised at $0.49/hour, but nominal GPU-hour
price alone does not settle end-to-end cost. We do not need a multi-GPU cluster,
reserved commitment, or a continuously running inference service for this batch.
[A40 listing](https://www.runpod.io/gpu-models/a40).

## Fit and the important memory caveat

The current frozen comparison is Qwen2.5-7B-Instruct versus Qwen3-8B, sequentially,
three seeds per scenario, at most 1,024 generated tokens per request. Its 120
scenarios imply 720 requests and at most **737,280 output tokens**, excluding
smoke tests or an independent replay. Both pinned snapshots together have roughly
30–32 GB of raw two-byte parameter storage by nominal model size; download
inventory, caches, and actual peak memory must be measured, not assumed.

Plan for at least 100 GB persistent storage and a separate temporary environment
disk, with enough system RAM to load a model before moving it to the GPU. Load
one model at a time. The adapter's 32 GiB preflight is a floor, not a guarantee
that a 48 GB device can execute every allowed prompt.

In particular, the adapter currently uses **eager attention** and permits a 32,768
token context envelope. Long-context attention intermediates can dominate memory.
The smoke must test the actual longest tokenized task and the declared envelope;
even 80 GB is not asserted to pass that stress test. If it fails, stop and review
the attention implementation or context contract under a new locked, validated
profile. Do not silently truncate prompts, quantize weights, change kernels, or
claim the context ceiling was tested because short examples worked.
[Attention-memory background](https://huggingface.co/docs/transformers/attention_interface).

Reproducibility is scoped to the locked environment. PyTorch does not guarantee
identical results across releases or platforms, even with matching seeds; changing
GPU family or attention backend requires renewed validation rather than an assumed
bit-for-bit replay. [PyTorch reproducibility notes](https://docs.pytorch.org/docs/2.14/notes/randomness.html).

## Cost model, not a throughput promise

For an approved design with S scenarios:

`requests = S × 3 seeds × 2 models`

`maximum output tokens = requests × 1,024`

`generation hours ≈ output tokens / measured aggregate output tokens per second / 3,600`

Then add measured prompt-prefill, environment setup, download, loading, verification,
replay, and idle time. The hourly bill includes setup and idle time.

For the current 120-task plan, **assuming** 10–50 output tokens/second gives about
4.1–20.5 generation hours at the output cap. This assumption has not been measured
on any shortlisted host. A hypothetical 480-task plan multiplies token volume by
four (2,949,120) and gives about 16.4–81.9 generation hours under the same
assumption, before overhead. The actual tokenized prompts and stop lengths matter.
Measure a representative mix before approving a complete-run budget.

Runpod lists standard network volumes below 1 TB at $0.07/GB/month; 100 GB is
$7/month, approximately $0.23/day using a 30-day month. Container disks cost
$0.10/GB/month while running. A 30 GB container adds approximately $0.10/day.
Persistent storage can keep accruing charges after compute stops; ordinary Pod
volume storage has a different stopped rate. These examples are not taxes or
provider-specific rounding guarantees. Runpod documents no ingress/egress fees.
[Storage and billing rules](https://docs.runpod.io/pods/pricing).

## Proposed approval boundary

First ask the owner to approve **one L40S, on demand, up to four billed hours and
$15 total incremental charges**, including storage and tax where applicable.
This is a proposed spending envelope, not current permission. The expected
four-hour compute component is $4.36, leaving contingency; a credit top-up or
minimum deposit is a separate cash payment and must also be approved.

Before launch, verify billing controls and an externally enforceable timeout or
shutdown mechanism. A shell timeout alone does not stop GPU billing, and the
provider's default account spend limit is not this proposed $15 project cap.
If hard limits cannot be verified, use a supervised session and disclose residual
billing risk before approval. No automatic replenishment, saved recurring job,
savings plan, or background service. Start teardown with budget/time headroom.

After the smoke, report actual peak memory, setup time, tokens/second by task mix,
runtime lock, and replay evidence. Request **separate approval** for full generation
with a revised time/cost ceiling based on the finally selected scenario count.
If the host is unavailable or the smoke fails, return with alternatives rather
than purchasing a different configuration automatically.

## Data and handoff

Generation needs reviewed task prompts and model weights, **not participant
identities, consent records, reviewer codes, private allocation keys, or collected
ratings**. Transfer only the generation inputs and code required. Use private
storage and restricted SSH/key access; do not expose a public notebook or model
endpoint. Agree the region and retention window with the owner. Secure Cloud's
data-center tier is not by itself a privacy or regulatory approval.
[Cloud tier comparison](https://docs.runpod.io/pods/choose-a-pod).

Export and verify artifact hashes locally before compute teardown; retain two
verified copies of irreplaceable artifacts. Do not delete paid persistent storage
until its exact contents and recovery copies are checked and deletion is approved.
Confirm compute billing has stopped and document remaining storage charges. A
stopped instance is not the same as a fully closed account or zero ongoing cost.

Follow the [existing execution runbook](primary-execution-runbook.md), including
independent scenario review and independent smoke replay before primary runs.
No review gate is cleared by this provider comparison.

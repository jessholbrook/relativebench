# Full-precision primary execution handoff

Status: **offline plan and adapter contracts implemented; real GPU execution not
performed**. The local Mac16,10 has 16 GiB unified memory, verified in this pass.
No full-precision host was provisioned and no model download was started.

## What is prepared

`python -m relativebench.readiness` validates the existing pilot and emits a
candidate plan with 720 exact request commitments, pinned model revisions,
scenario/pilot hashes, and a 1,800-slot allocation audit. The retained
[candidate plan](../data/validation/preparticipant-2026-09-10/primary-plan.json)
explicitly has `collection_authorized: false`. Slot identifiers are not people.
The deterministic audit is a planning fixture, not a primary side key. Create a
fresh secret-seed allocation with `python -m relativebench.private_allocation
--output private/primary-allocation.json` after the slot count is approved. That
command refuses public/tracked output locations and never prints its side key.
Keep the seed, key, and eventual slot-to-person mapping private; freeze their
commitments before collection. Do not deploy or reuse simulation assignments.

The optional `transformers-bf16` adapter requires a BF16-capable CUDA device with
at least 32 GiB GPU memory, offline snapshot integrity, exact runtime versions,
BF16 model parameters, deterministic algorithms, and a fixed context envelope.
This is a conservative preflight floor, **not a measured peak-memory guarantee**.
It refuses quantized fallback, silent truncation, adapted thinking, or mismatched
revisions. Models execute sequentially. The existing resumable artifact writer and
independent verifier are reused. Adapter sampling/integrity contracts are tested
without PyTorch; this does not demonstrate GPU compatibility or exact replay.

## Approved-host sequence

1. Select an available host with the owner's approval. Record GPU model/memory,
   driver, CUDA, OS, Python, package versions, dependency lock, and environment
   configuration without recording hardware serials or secrets. Choose the CUDA
   wheel from the [official PyTorch installation instructions](https://pytorch.org/get-started/locally/).
   Freeze the resolved environment on that host; do not pretend a lock resolved on
   this Mac is a validated CUDA lock. Required packages are torch, transformers
   (with Qwen3 support), tokenizers, safetensors, and huggingface-hub.
2. After independent task review, prepare each exact pinned snapshot explicitly:

   ```bash
   PYTHONPATH=evals python -m relativebench.bf16_setup \
     --model-role previous --output /approved-storage/qwen-previous \
     --allow-model-download
   ```

   Repeat for `new` in a separate directory. This downloads large checkpoints;
   it is never invoked by tests or CI. Snapshot inventory and runtime-lock files
   are generated alongside the downloaded data. Preserve immutable copies. The
   source and revision come from the pilot, not an operator-entered moving alias.
3. On that host, independently smoke-test model loading, maximum context, memory,
   pinned non-thinking templates, deterministic repeated generation, stop/length
   behavior, and artifact verification. A deterministic-kernel error must be
   investigated; do not disable the setting merely to pass. Record measured peak
   memory and replay hashes. Smoke evidence stays separate from primary results.
4. Complete generation approvals for independent scenario review, verified
   BF16 host/runtime, and independent smoke replay. Complete the remaining gates
   before **collection**, not before producing the artifacts needed to review
   packet delivery; generation and collection activation are separate.
   An activation JSON has the exact `plan_sha256` and an `approvals` object keyed
   by gate, each containing `approved: true`, `reviewer`, and `evidence`. This is
   a local operator checkpoint, not a cryptographic approval/authentication system.
   Never auto-fill the approvals or mark participants recruited from slot counts.
5. Run each role in a separate process, retaining a separate artifact directory:

   ```bash
   PYTHONPATH=evals python -m relativebench bf16-run \
     data/pilots/qwen2.5-to-qwen3/primary-candidate.json --model-role previous \
     --model-dir /approved-storage/qwen-previous \
     --runtime-lock /approved-storage/qwen-previous.runtime-lock.json \
     --activation /approved-private/activation.json \
     --output /approved-storage/primary/previous
   ```

   Use `--resume` only for verified same-profile artifacts. Repeat for `new`.
6. Independently run `verify-run` for each role under `frozen-non-thinking-v1`.
   Expect 360 artifacts per role (120 × 3). Verify BF16 metadata and exact runtime
   agreement, not only hashes. Preserve failures and cause classification; do not
   retry selectively based on answer quality.
7. Prepare primary evaluator-specific packets from verified BF16 artifacts:

   ```bash
   PYTHONPATH=evals python -m relativebench.primary_packets \
     --allocation private/primary-allocation.json \
     --execution-dir /approved-storage/primary --output private/assigned-packets
   ```

   The generator retains the code map privately, omits role fields from the
   packets, rejects rehearsal artifacts, and sets `collection_authorized: false`.
   Independently review actual response text for identity leakage and assignment
   delivery. Only after all collection approvals may reviewed copies be activated
   and delivered through approved participant access. The rater supports fixed
   assigned forms and code binding, and refuses inactive packets. Verify returned
   exports with `verify-primary-session PACKET SESSION --receipt PRIVATE_RECEIPT --require-complete`.
   Keep the generator's `private-receipt-*.json` records independently of rater
   uploads. They bind the exact stimulus digest and frozen assignment list;
   never reconstruct a trusted receipt from a returned packet.
   The current two mirrored full forms and `internal_interface_pilot` exports must
   not be relabeled as primary. Client-side code binding is not authentication;
   use approved site access controls, private delivery, and offline verification.

Primary generation cannot honestly be checked off until the host, runtime, smoke,
and review gates pass. The new adapter and plan make that next action reproducible;
they do not replace those observations.

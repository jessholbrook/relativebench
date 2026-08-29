# Internal Blind-Rating Pilot

Status: **blinded workflow ready; no human judgments collected or unblinded**

## Purpose

This milestone rehearses the collection procedure against the 120-pair 4-bit infrastructure corpus. It tests blinding, counterbalancing, pointwise-before-paired sequencing, device-local recovery, and export integrity. Its judgments are not eligible for a capability, compatibility, or Experience Delta result.

## Frozen interface sequence

For each assignment, the evaluator:

1. reads the prompt and task-specific rubric
2. sees only the left response and records `fails`, `partially_meets`, or `meets`
3. sees only the right response and records the same pointwise scale
4. sees both responses and records a side-relative five-level judgment from “left much better” to “right much better”
5. optionally adds reason tags after the primary paired judgment

The export remains side-relative and blinded. It does not contain model identity, model role, model revision, raw artifact identifiers, or the new-response side. Those fields are joined only after collection using the separately retained private role key.

## Packet and randomization audit

- 120 response pairs
- two deterministic forms with mirrored left/right assignments
- every pair appears once per form
- each form contains 60 new-on-left and 60 previous-on-left assignments
- every scenario is presented in both orientations across the two forms
- reviewer codes are hashed before storage or export
- the private key is excluded from Git and represented publicly only by its SHA-256 commitment
- public packet scans found no model names or forbidden identity fields

The public packet, schema, and machine-readable audit are under [`data/pilots/qwen2.5-to-qwen3/rating`](../data/pilots/qwen2.5-to-qwen3/rating/).

## Storage and output boundary

The owner-only `/rate` workspace stores progress in browser local storage under the packet and reviewer-code hashes. It sends no judgment data to the site and calculates no aggregate preference. Evaluators explicitly export a JSON session when ready.

Internal session exports use [`schemas/internal-rating-session.schema.json`](../schemas/internal-rating-session.schema.json). They are collection-QA records, not canonical [`judgment.schema.json`](../schemas/judgment.schema.json) records.

## Internal exit check

Before any primary collection infrastructure is approved:

- one complete internal session must be exported from each mirrored form
- both exports must pass the session schema and cover all 120 assignments without duplicates
- pointwise scoring must precede paired judgment for every assignment
- reset, resume, and export behavior must be exercised
- reviewers must report any identity leakage, rubric ambiguity, or unusable response display
- the two sessions must remain blinded and unaggregated during this QA milestone

The private key must remain unrevealed until these checks pass and a separate unblinding step is authorized.

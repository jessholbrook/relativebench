# Internal Blind-Rating Pilot

Status: **mechanical end-to-end QA complete; no human judgments collected or unblinded**

## Purpose

This milestone rehearses the collection procedure against the 120-pair 4-bit infrastructure corpus. It tests blinding, counterbalancing, pointwise-before-paired sequencing, device-local recovery, and export integrity. Its judgments are not eligible for a capability, compatibility, or Experience Delta result.

## Frozen interface sequence

For each assignment, the evaluator:

1. reads the prompt and task-specific rubric
2. sees only the left response and records `fails`, `partially_meets`, or `meets`
3. sees only the right response and records the same pointwise scale
4. sees both responses and records a side-relative five-level judgment from “left much better” to “right much better”; the choice saves immediately and opens the next task
5. optionally adds reason tags to the most recently saved judgment without interrupting the next task

Pointwise choices also advance immediately. `B` or the left-arrow key returns to the prior stage, including reopening the most recently saved paired judgment. Number keys select every score, `Shift` plus a number applies reason tags, `E` exports, `Shift+R` resets, and `?` opens the complete shortcut guide.

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

The owner-only `/rate` workspace stores progress in browser local storage under the packet and reviewer-code hashes. It sends no judgment data to the site and calculates no aggregate preference. On completion, evaluators can inspect a task-level table of their blinded judgments and explicitly export the same records as a JSON session.

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

## Mechanical QA record

On 2026-09-04, the owner-only deployment was exercised end to end with two clearly labeled, automated test-reviewer sessions. These are interface fixtures, not human judgments, and their deliberately uniform choices are not eligible for analysis.

- form A exported all 120 assignments and passed `verify-rating-session --require-complete` with no errors or warnings (`session_sha256`: `f4fd1286776e1aef25d6452fd99210b47c73157acfd46bfd7cda20a9b9d80a4c`)
- form B exported all 120 assignments and passed the same strict check with no errors or warnings (`session_sha256`: `f0ce9d3d4a548dd223b7c4d1ee5d130e77d9feb34f636a3878908e3eb0e3bad2`)
- pointwise-before-paired staging, automatic advance, keyboard back, reload-and-resume, the completion table, JSON export, and device-local reset were exercised
- both exports remained side-relative, blinded, and unaggregated; neither export is committed to Git

The mechanical portion of the internal exit check is complete. The remaining gate is an independent human/domain review for identity leakage, rubric ambiguity, and unusable response rendering before primary collection is activated.

# Correctness and perceived difference

Status: candidate rules, not an activated study protocol. The default candidate
plan carries an unresolved `objective_correctness_and_preference_separation_review`
gate. No participants, primary outputs, or human approval are implied.

The proposed separation preserves RelativeBench's existing paired preference
measurement. A deterministic correctness score answers whether a response meets
an objectively testable requirement. A human preference answers whether using
that response feels better, the same, or worse. Neither substitutes for the other.
Two correct responses can still differ in clarity or usability. Raters may also
prefer an incorrect response; the report must expose that disagreement rather
than convert their preference into a correctness pass.

For objective tasks, the workspace explicitly describes this separation. The
three-level pointwise rubric remains a human assessment, not the binary grader.
`partially_meets` is never automatically interpreted as a pass. For rubric-based
tasks, independently reviewed correctness judgments are still needed; arbitrary
model code is not executed by this scorer.

## Frozen candidate rules

`objective-rules-0.1.0.json` binds each of 42 rules to the hash of its complete
scenario in `pilot-scenarios-0.3.0.json`. Changed or historical prompts are
unscorable under these rules. Rule hashes are included in the candidate plan and
each scoring result. Every reference answer has a passing test, with additional
tests for equivalent representations, wrong types, duplicate keys, formatting,
and extra prose. Those software checks do not independently validate the corpus.

Rules compare the whole response, without extracting an answer from prose,
removing fences, or blanket whitespace trimming. Exact-text tasks retain exact
format requirements, including the six-character decimal task. Numerical tasks
accept finite equivalent decimal/scientific notation; the whole-dollar task
uses whole-number notation. Comma-separated names permit spaces around commas.

JSON comparisons preserve specified key order, reject duplicate keys and
non-finite values, distinguish booleans from numbers, and allow equivalent
escapes and numeric representations. Compactness is enforced only where asked.
CSV comparisons preserve records and field content. Minimal quoting is required
only for the two prompts that request it. Record formats accept LF or CRLF and
one final record terminator, not extra blank records. Markdown bullet/table
rules allow ordinary equivalent markers, spacing and optional outer table pipes.

XML compares decoded text and attributes, including numeric entities and CDATA;
it rejects declarations, DTDs, nested elements and outside whitespace where the
prompt forbids them. YAML uses the pinned PyYAML safe loader with duplicate-key
rejection and ordered typed comparisons. Aliases, anchors, explicit tags and
directives are returned as **unscorable**, not incorrectly marked as failures;
these require manual review. The loader's scalar interpretation is part of the
candidate rule and must be approved along with the other equivalence policies.
See the [PyYAML safe-loading documentation](https://pyyaml.org/wiki/PyYAMLDocumentation).

## Offline scoring

After primary runs are complete and verified:

```sh
PYTHONPATH=evals python -m relativebench.objective_scoring \
  --pilot data/pilots/qwen2.5-to-qwen3/primary-candidate.json \
  --execution-dir private/primary-execution \
  --output private/objective-scores-v1.json
```

The scorer verifies both full BF16 runs before scoring. It retains run, rule,
scenario and response commitments, and separates binary scored pairs from
unresolved pairs. Missing dependencies, unsupported rules and unsupported
responses do not become failed tasks. Critical-task clearance still requires
every frozen task × seed, including separately judged rubric tasks. This output
alone never grants publication eligibility.

Before collecting, approve this separation (or explicitly revise the preference
protocol), all equivalence policies, and the corrected scenario manifest. Any
material change requires a new candidate plan and fresh generation where prompts
changed. Old rehearsal outputs are not reusable as corrected-task evidence.

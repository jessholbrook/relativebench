# Verification record — September 10, 2026 UTC

## Completed checks

- 23 TypeScript unit tests, 56 Python tests (including optional NumPy tests),
  type checking, lint, and the four-route production build passed locally.
- 19 isolated Chromium browser tests passed. Both real rehearsal forms completed
  all 120 assignments and their exports passed the independent Python verifier.
  Other cases cover resume/reopen/tags/export, code binding, activation, keyboard
  modifiers/repeat/composition, read/write/delete storage faults, corrupt storage,
  failed packet fetch, navigation, keyboard accordion expansion, reset, and
  document overflow at 390px and 1440px.
- Axe WCAG 2 A/AA and 2.1 AA automated checks found no violations in the checked
  home, guide, report, rater entry, pointwise, paired, completed, shortcut-guide,
  and expanded-report states. This is not a complete accessibility certification;
  manual screen-reader, zoom, and participant usability review remain valuable.
- `npm audit --audit-level=low` reported zero known vulnerabilities after adding
  the pinned test-only dependencies. This is a dated registry result.
- Eight simulation conditions × 200 independent datasets × 10,000 accepted
  bootstrap draws completed. All per-trial results, environment versions, and
  code/manifest hashes are retained. Findings, uncertainty, and limitations are
  in [the assessment](simulation-validation.md), including the missingness failure.
- Candidate primary planning produced 720 unique request commitments and a
  valid 1,800-slot assignment design. It did not authorize collection.

Tests ran in the existing temporary source mirror because the repository's
installed dependency directory stalls during reads. The Python environment was
isolated with Python 3.13.12 and NumPy 2.4.3. The final check sequence was:

```bash
npm run check
npm run build
npm run test:browser
npm audit --audit-level=low
git diff --check
```

Install `requirements-validation.txt` into the Python environment before running
`check`; without NumPy, the two simulation-specific unit tests explicitly skip.
CI installs it and the Playwright Chromium runtime. Browser runs never access the
live site or the user's saved sessions, and all rating selections are software
fixtures. Tests generate no collected human preference results.

## Failures found and fixed

Initial axe checks failed on low-contrast home labels, white-on-coral links, and
the rater rubric label. Text colors were adjusted without changing the logo or
soft body highlights. A navigation test exposed a lost first keyboard activation
before the accordion hydrated; triggers now remain disabled until ready. Explicit
IDs fix the observed server/client accordion ID mismatch. The failed runs were
not counted as passes; the complete final suite was rerun.

Non-blocking build/dev warnings remain for future Vite JSON-import attributes,
deprecated punycode, Vinext route classification, and optimized client dependencies.
No warning was silenced to obtain the test result.

## Not performed or implied

No paid host provisioning, large checkpoint downloads, real BF16 inference,
participant contact, consent approval, independent human/domain sign-off, or
primary collection occurred. The BF16 adapter has contract/integrity tests, not
a validated GPU execution. The smoke test and runtime lock must be established
on the approved host. A local activation JSON is an operator checkpoint, not an
authentication/signature system. Private packet delivery must use approved site
access controls; a reviewer-code check alone is not authorization.

The existing `/rate` still loads the rehearsal packet. New changes are submitted
as an unmerged review PR; the production Sites version remains the previously
published merged stack until another merge/publish is requested.

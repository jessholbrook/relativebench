# Review verification — September 9

## Software checks

The cumulative four-change stack passes 23 TypeScript tests and 40 Python tests.
Type checking, lint, and the four-route production build were checked locally.
The dependency lockfile was unchanged for these four changes. Tests ran in a
temporary source mirror with dependencies installed from that lockfile because
the original dependency directory stalled during reads. The normal `.gitignore`
must be copied into that mirror to avoid scanning local Python/model caches.
Early stalled processes were interrupted; they are not counted as successful runs.

`tsconfig.json` now explicitly includes all first-party components, not only the
rater. Native cross-route anchors are intentional: this Vinext site previously
had broken client-side links. The Next-specific anchor prohibition is disabled;
the app still uses real, accessible links. Generated chart graphics retain named
image roles with narrow lint exceptions; grouping and live feedback use semantic
fieldset/output elements. Storage-error state reflects an external write result,
with a narrow React compiler lint exception explaining why it is necessary.

## Local browser walkthrough

- Home → guide → example → rater links rendered the intended routes.
- The guide retains article prose, soft coral emphasis, and direct research links.
- Example outcome selection changed the explanatory text and selected state.
- Expanding Reasoning exposed improved, unchanged, and regressed task examples.
- A new local code `qa-20260909-not-human-data` exercised pointwise selection via
  key 2, automatic left → right → pair, B to go back, reload, and same-code resume.
  Both pointwise choices were restored at the right-response stage. **No paired
  preference was submitted or exported.** This is a partial software-QA session,
  not human data. Existing saved sessions were not reset or deleted.
- At 390px width, home, guide, example, and active rater had document width equal
  to viewport width. Rater header actions wrap. The report header's redundant
  badge is hidden on phones so “Try it” stays on one line.
- At 1440px width, a #why deep link selected the matching nav item; scrolling
  updated aria-current to the later section. The viewport override was restored.

This is focused browser QA, not a new 120-task collection run, a full accessibility
audit, a real-user usability study, or verification of the deployed build. Storage
failure recovery is covered by code review and restoration guard tests; browser
fault injection was not performed. The owner-only live site was not deployed.

## Scientific limits

Nonconstant and sparse fixtures now exercise resampling, but formal interval
coverage and power simulations remain outstanding. No human preference results,
publication eligibility, or empirical model-quality claim follows from these
checks. The example interval and counts are illustrative and internally consistent,
not derived from collected runs.

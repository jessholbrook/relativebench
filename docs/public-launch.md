# Public showcase launch

Scope approved September 12, 2026: explain RelativeBench, show an example report,
and let visitors try example ratings. **No participant collection.**
Launch preparation does not authorize changing access, publishing a new version,
buying a domain, inviting participants, or renting an execution host.

## What this release prepares

- A canonical HTTPS origin and per-page title, description, canonical and sharing metadata.
- Indexing disabled by default. Robots and sitemap routes can be enabled for a later public launch;
  `/rate` and `/rating/` stay excluded. Crawler hints are not authentication.
- Local-storage/export information, made-up-code guidance, and a usable 404 page.
- Conservative response headers: no MIME sniffing, restricted device permissions,
  and a cross-origin referrer policy. No untested CSP or frame restriction is added:
  the framework uses inline scripts and Sites has its own embedding/access behavior.
- A prebuild asset allowlist and packet gate. Only the reviewed rehearsal packet
  may ship; primary assignments cannot be added to `public/` unnoticed. This is a
  release tripwire, not authorization or a substitute for reviewing file contents.
- Browser coverage for all six reading/rating routes, metadata, crawler defaults,
  404 recovery, accessibility, responsive layout, exports and local-only ratings.
- Old copy-dependent test selectors corrected. The September 12 deployed version's
  CI had four failures because it expected pre-contraction text; that failure must
  be superseded by a green full CI run before launch.

## Release gates

- [ ] Full GitHub CI green on the exact launch commit. Local compilation alone is insufficient.
- [ ] Manually review on phone and desktop, including keyboard and assistive-technology use.
  Automated accessibility checks do not establish a complete accessibility audit.
- [ ] Confirm the desired public URL. The existing Sites URL is the default; a custom
  domain is optional and requires a separate hosting/DNS decision.
- [ ] Review the existing `og.png` and rater GIF for current copy and presentation.
  This preparation preserves them; no new social image is generated.
- [ ] Review redistribution permissions for the public task/model-output packet and
  image/font assets. Example status does not waive provider or dataset terms.
- [ ] Confirm an operator/contact route, hosting access/log retention, and the visitor-facing
  data explanation. No analytics, ads, contact forms or collection backend are installed.
- [ ] Name who owns uptime/error alerts and incident response. Monitoring has not been scheduled.
- [ ] Explicit owner approval to launch publicly, including the audience and indexing choice.

## Configuration

`SITE_ORIGIN` defaults to `https://relativebench.jessh.chatgpt.site`. It must be
an HTTPS origin with no credentials, path, query or fragment. Do not derive it
from untrusted request headers. Use the final origin consistently for build and
hosted runtime settings. No secrets belong in `.openai/hosting.json` or Git.

`SITE_INDEXABLE=false` is the safe default. Set `true` only when public indexing
is approved. Rebuild after configuration changes; do not assume saved artifacts
pick up new build-time metadata. Configure hosted values through Sites rather
than assuming a local `.env` file is deployed. CI deliberately tests the private
default; unit tests cover the enabled sitemap and robots variants.

## Release procedure

1. Keep the current audience unchanged while preparing the release. Use the existing
   Site project `appgprj_6a9253360b108191ba014a1a87b3c396`; do not create a replacement.
2. Run `npm ci`, install `requirements-validation.txt`, then run `npm run check`,
   `npm run build`, and the existing browser suite in an isolated test environment.
   Confirm the full GitHub CI result for the same commit.
3. Review the built public assets as well as the source allowlist. No primary packets,
   participant exports, reviewer rosters, role keys or credentials may be present.
4. On launch approval, configure the selected origin/indexing values and build the
   exact approved commit using the Sites building/hosting workflow. Save an archive-backed
   version and deploy it to the approved audience. Verify terminal success before announcing it.
5. Only with explicit public-access approval, change the existing Site audience using
   Sites access controls. Verify actual unauthenticated access; crawler flags don't make a
   private Site public. Do not broaden the audience just to test deployment.
6. Check `/`, `/guide`, `/methodology`, `/demo`, `/rate`, `/privacy`, `/robots.txt`,
   `/sitemap.xml` and an unknown URL. Confirm correct titles, canonical links, headers,
   indexing behavior, 404 status, assets, and that example ratings aren't submitted.
   Exercise only throwaway example sessions, never existing saved user sessions.
7. Record commit, version, deployment, audience, configuration and verification evidence.

## Rollback

The known pre-preparation deployment is version 36, source
`836a659525be1da60612c067f8a555bfb583fe63`, saved version
`appgprj_6a9253360b108191ba014a1a87b3c396~appgver_3a8e35ca43308191bc7d3e8c90169624`.
Verify these against current Sites state before using them.

Record the actual last-good version before every release. Redeploy that saved
version to roll back code, then verify terminal success. Environment and audience
are separate state: restore their recorded values deliberately if needed.
For an exposure incident, restrict access first with owner authorization; merely
adding `noindex` doesn't remove access or recall downloaded material.

## Separate participant launch

Publishing this showcase does not approve the study, sample size, correctness rules,
consent, recruitment, retention policy, primary model execution or data collection.
Do not replace the public rehearsal packet with personalized primary assignments.
Those need authenticated, authorized delivery outside the public asset bundle and a
separate review. Continue with [the participant-readiness checklist](preparticipant-checklist.md)
when that work is authorized.

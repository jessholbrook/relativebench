# Dependency security review — September 9

The unchanged baseline lockfile reported 12 affected packages (8 high, 3 moderate,
1 low) via `npm audit`. This counts affected packages and their dependency chains,
not 12 independently exploitable production vulnerabilities.

The security-only PR updates React/React DOM/RSC together to 19.2.8, Vinext to
1.0.0-beta.9 with its required RSC plugin, Vite to 8.2.2, and the Cloudflare plugin
and Wrangler to their compatible patched releases. Wrangler requires the matching
5.x Workers type definitions. Unrelated direct dependencies remain pinned.

The lockfile refresh also patches `qs`. Miniflare pins an affected Sharp version,
so a narrowly scoped `miniflare → sharp: 0.35.4` override is used. Remove that
override once Miniflare itself requires an unaffected release. No force install,
legacy peer-dependency bypass, or audit-suggested framework downgrade was used.

Relevant upstream advisories:

- [React Server Functions denial of service](https://github.com/advisories/GHSA-wx67-qw84-cm4g)
- [image-size parser denial of service](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr)
- [Sharp/libheif vulnerabilities](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c)
- [Vite Windows file-deny bypass](https://github.com/advisories/GHSA-fx2h-pf6j-xcff)
- [qs denial of service](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g)

After the lockfile update, `npm audit` reported zero known vulnerabilities. This is
a dated registry result, not a security certification. The site remains owner-only;
this PR does not change authentication, hosting configuration, access policy, or
production deployment. Review runtime changes separately from the benchmark work.

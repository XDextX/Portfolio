# Spec 042 — One canonical origin

**Status:** implemented
**Size:** L
**Approved:** 2026-10-18 · one clarify round (1 blocker resolved by the owner: robots.txt generated; 7 minor applied) · 128 lines, 6 RF
**Implemented:** 2026-10-18 · commits `b7bad0d`, `21b7b06`, `8249c28`, `1818a20`, `ee2afeb`, `d76723c` on spec/042-canonical-origin · 7/7 tasks, `npm test` 311/311, e2e 240/240 · 6/6 RF, NFRs and edge cases validated by the SDD reviewer; injections 1–12 red; outputs read on the dev server, owner approval

## Context and goal

Production is served on `https://www.xdextx.dev`, but everything a search engine reads still
names the old host, `https://portfolio-dext.vercel.app` (measured on 2026-10-18): `canonical`, the
three `hreflang` alternates, every `<loc>` in `sitemap.xml`, the `Sitemap:` line in `robots.txt`
and the person's `url` in the JSON-LD. Only `og:url` and `og:image` name the new host, because
spec 034 composes them from the serving origin. So the head of every production page tells search
engines that the page lives somewhere else. The old address is also written out in five places —
`astro.config.mjs:9`, `src/pages/sitemap.xml.ts:4`, `src/data/about.ts:82`, `public/robots.txt:8`
and `README.md:4` and `:8` — plus one test, `tests/github-cache.test.ts:11`, so changing it means
editing each one.

Spec 034 decided with the owner on 2026-10-17 that social tags follow the serving origin, so a
preview shows its own card, and that canonical and hreflang stay on the one production origin, so
a search engine never sees a preview address as a page's own. This spec keeps that split. It
extends the production side to every URL a search engine or a structured-data reader takes as the
page's identity, and gives that origin one source. `robots.txt` stops being a static file and is
generated from that source, as `sitemap.xml` already is (owner, 2026-10-18).

## Definitions

- **Canonical origin**: the one production origin, scheme and host with no path, that pages claim
  as their own address: `https://www.xdextx.dev` (owner, 2026-10-18).
- **Serving origin**: the origin a request arrived on: production, a Vercel preview, or
  localhost.
- **Preview-like origin**: any serving origin that is not the canonical origin, localhost included.
  The checks use the e2e server's localhost origin; no faked `*.vercel.app` is needed.
- **Identity URL**: an absolute URL that tells a reader where a page or the person lives:
  `canonical`, every `hreflang` alternate, each sitemap `<loc>`, the `robots.txt` sitemap line,
  and the `url` of every JSON-LD entity.

## Actors

- Search engines and structured-data readers, reading the head, the sitemap and `robots.txt`.
- The owner, changing the domain once instead of once per file.

## User stories

- US-1: As the owner, I want every identity URL to name the domain the site is actually served on,
  so that search engines index `www.xdextx.dev` and not the old Vercel host.
- US-2: As the owner, I want to change the domain in one place, so that no copy is left behind.

## Requirements (EARS)

- RF-1: THE SYSTEM composes `canonical` and every `hreflang` alternate from the canonical origin,
  whatever the serving origin. — **Check:** `/`, `/proyectos?cat=backend&lang=en`, a project page
  and the 404 page, served on a preview-like origin, carry the canonical origin in `canonical` and
  in all three alternates.
- RF-2: THE SYSTEM composes every `<loc>` in `sitemap.xml` from the canonical origin, whatever the
  serving origin. — **Check:** the sitemap fetched from the dev server lists only URLs that start
  with the canonical origin.
- RF-3: THE SYSTEM generates `robots.txt` from the canonical origin, with one `Sitemap:` line
  naming the canonical origin's `/sitemap.xml`, whatever the serving origin. — **Check:**
  `robots.txt` fetched from the dev server has exactly one `Sitemap:` line, equal to
  `<canonical origin>/sitemap.xml`.
- RF-4: THE SYSTEM gives every JSON-LD entity's `url` the canonical origin: the person, the
  projects collection and each project. — **Check:** the JSON-LD of `/`,
  `/proyectos?cat=backend&lang=en` and a project page, served on a preview-like origin, has every
  `url` starting with the canonical origin.
- RF-5: THE SYSTEM declares the canonical origin in exactly one place in the code, and that place
  holds `https://www.xdextx.dev`. — **Check:** the single source's value is exactly
  `https://www.xdextx.dev`; with comments stripped, the canonical host appears in one source file
  across `src/`, `public/`, `scripts/` and `astro.config.mjs`, and the old host
  `portfolio-dext.vercel.app` appears in none of them, nor in `tests/` or `e2e/`. The scan is a
  source check on purpose (constitution 8): the rule is about a second copy of a datum, which only
  the source shows, as in 034 RF-3.
- RF-6: THE SYSTEM's README links the live site at the canonical origin. — **Check:** every link
  to the live site in `README.md` has an `href` starting with the canonical origin and visible
  text naming the canonical host, and the old host appears in neither.

## Non-functional requirements

- Spec 034 holds: `og:url`, `og:image` and `twitter:image` still follow the serving origin, and
  spec 033's single image expression is unchanged. — **Check:** spec 034's and 033's guards stay
  green unchanged.
- Only the origin changes; every identity URL keeps today's path and query. — **Check:** on the
  dev server, each identity URL is the canonical origin plus the rule it follows today:
  `canonical`, `es-CR` and `x-default` the request's path; `en-US` the path plus `?lang=en`; the
  collection's JSON-LD `url` the request's path and query; a project's, `/proyectos/<name>`.
- `robots.txt` keeps today's directives apart from the `Sitemap:` line: `Allow: /` and
  `Disallow: /api/` for every user agent. — **Check:** the fetched file carries both, under
  `User-agent: *`.

## Edge cases

- **Preview deployment** (`*.vercel.app`): its identity URLs name production, so a preview never
  claims to be canonical for itself; its social tags name the preview, as in 034. RF-1 to RF-4.
- **Production reached on the old host** (`portfolio-dext.vercel.app` still serves the site): its
  identity URLs name the canonical origin, and its social tags name the old host, as 034 decided.
  RF-1 to RF-4. The redirect that would end this case is out of scope.
- **Local development**: the identity URLs name production, not `localhost`. RF-1 to RF-4.
- **The GitHub listing fails**: the sitemap still lists the static routes, on the canonical
  origin, as today. RF-2. — **Check:** with the listing stubbed to fail, the sitemap lists `/` and
  `/proyectos`, both on the canonical origin.
- **A query on the request** (`/?lang=en`, a projects filter): canonical drops it and the `en-US`
  alternate keeps `?lang=en`, as today. Only the origin changes. RF-1, RF-4.
- **A test that needs the production origin** reads it from the same source, never from a
  literal of its own. RF-5.

## Out of scope

- The apex `https://xdextx.dev` failing TLS, and any redirect from the apex or the old host to the
  canonical origin: domain settings on Vercel and DNS, owner-side.
- Marking preview deployments `noindex` (Vercel's own setting, as in 034), and a different
  `robots.txt` for previews.
- Whether a filtered projects page's JSON-LD `url` should keep its query. RF-4 changes only the
  origin.
- The README's deployment badge image, apart from the link it carries (RF-6).

## Done when

`npm test` and `npm run test:e2e` green; each new guard shown red by injection; the head of `/`,
`/proyectos` and one project page, `/sitemap.xml` and `/robots.txt` read on the dev server, with
identity URLs on the canonical origin and social tags on localhost. After pushing, the owner reads
the production head, sitemap and robots once (outside this repository), which also confirms the
path-and-query NFR on the canonical origin itself.

## Open questions

None. Resolved 2026-10-18: the canonical origin is `https://www.xdextx.dev`, not the apex (owner).
Only `www` serves today, and a later switch is a one-value change under RF-5. `robots.txt` is
generated from that origin rather than kept static (owner, clarify round 1).

# Spec 034 — Social tags follow the serving origin

**Status:** implemented
**Size:** S
**Approved:** 2026-10-17 · one clarify round, one blocking finding applied (RF-3's check would have caught the avatar preconnect); approved with its plan and tasks · 81 lines
**Implemented:** 2026-10-17 · commits `eee63a7` (origin from the config), `4e6952a` (social tags on the serving origin) · 2/2 tasks, `npm test` 259/259, e2e 154/154 · 3/3 RF, NFRs and edge cases validated (the dev server's head: social tags on localhost, canonical and hreflang on production); 3 injections red. Pending, outside the repo: the owner checks a preview deployment in a validator and the production head after pushing

## Context and goal

`BaseLayout.astro` composes every absolute URL in the head from a literal,
`https://portfolio-dext.vercel.app`. On a Vercel preview deployment `og:image`, `twitter:image`
and `og:url` therefore point at production, where the preview's new social card (spec 033) does
not exist yet; and Facebook and LinkedIn re-fetch the page `og:url` names, so a validator shows
production's card even when it is given the preview's address. The owner cannot see a card as the
platforms will before publishing it.

Decided with the owner on 2026-10-17: the social tags follow the origin the page is served from;
`canonical` and `hreflang` keep pointing at production, so a search engine never sees a preview
address as a page's own. In production the two origins are the same and nothing changes.

The production origin is the one `astro.config.mjs` already declares as `site`, read through
`Astro.site`; the literal in the layout goes (AGENTS: one source per datum).

## Actors

- The owner, checking a preview deployment's card in a social validator before publishing.
- Social platforms and search engines reading the head.

## Requirements (EARS)

- RF-1: THE SYSTEM composes `og:image`, `twitter:image` and `og:url` from the origin the request
  was served on. — **Check:** the layout rendered for a request to `https://preview.example.test/`
  carries `https://preview.example.test/og-cover-es.png` in both image tags and
  `https://preview.example.test/` in `og:url`; on the running dev server the three start with its
  origin.
- RF-2: THE SYSTEM composes `canonical` and every `hreflang` alternate from the production origin
  `astro.config.mjs` declares, whatever origin served the request. — **Check:** the same render
  carries `canonical` and the three alternates on the configured `site`'s origin, with the page's
  path; on the dev server too.
- RF-3: THE SYSTEM spells the production origin nowhere in the layout. — **Check:** the layout's
  source, comments stripped, does not contain the configured `site`'s host (a source check on
  purpose, constitution 8: the rule is about a second copy of a datum, which only the source
  shows; the avatar host in the preconnect is another datum and stays).

## Non-functional requirements

- Spec 033's binding holds: both image tags bind one expression composing
  `${site}/og-cover-${locale}.png`, now with `site` the serving origin.
- In production, served on the configured origin, every tag is byte-identical to today's.

## Edge cases

- Local development: the social tags name `http://localhost:<port>`; the canonical stays
  production — RF-1, RF-2.
- A request with a query (`/?lang=en`): `og:url` and `canonical` carry the path without the query,
  as today; the `en-US` alternate keeps its `?lang=en` — RF-1, RF-2.
- A custom domain added later: the social tags follow it at once; the canonical follows when
  `astro.config.mjs`'s `site` is changed — RF-2.

## Guards this changes (AGENTS: never silently)

- None weakened. `tests/seo.test.ts` still finds `${site}/og-cover-${locale}.png`; what `site`
  holds changes, which RF-1 now settles.

## Out of scope

- `src/pages/sitemap.xml.ts` and its own fallback literal, and the person's `url` in
  `src/data/about.ts`: both name the production site on purpose and are not read by validators.
- Marking preview deployments `noindex` (Vercel's own setting).

## Done when

`npm test` and `npm run test:e2e` green; each new guard shown red by injection; the head of `/`
read on the dev server, the social tags on its origin and the canonical on production. After
pushing, the owner checks a preview deployment in a validator and the production head once
(outside this repository): that the serving origin Vercel hands Astro is the public one is an
assumption no local check can settle.

## Open questions

None.

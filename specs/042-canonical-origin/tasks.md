# Tasks 042 — One canonical origin

**Spec:** `specs/042-canonical-origin/spec.md` (6 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-18 · owner approval · 65 lines

Injection numbers refer to block 7 of the plan.

- [x] **T-1 — Create the single source and point the config and the regex readers at it**
  Covers: RF-5 (value), P-1
  Files: `src/data/site.ts`, `astro.config.mjs`, `tests/canonical-origin.test.ts`,
  `tests/seo.test.ts`, `e2e/og-cover-layout.spec.ts`
  Done when: `tests/canonical-origin.test.ts` asserts `CANONICAL_ORIGIN === 'https://www.xdextx.dev'`
  and that the config's `site` equals it, red under injection 8; `npm test` and
  `npm run test:e2e` green with both regex readers replaced by the import.

  First, because the config change breaks the two regex readers on `![1]`.

- [x] **T-2 — Compose canonical and hreflang from the single source**
  Covers: RF-1, NFR path and query (head)
  Files: `src/layouts/BaseLayout.astro`, `tests/seo.test.ts`
  Done when: the 034 block's new RF-1 test passes on a `preview.example.test` render and goes red
  under injection 1; the 034 social-tag test is unchanged and green; the stale comment at
  `tests/seo.test.ts:1079–1080` is rewritten.

- [x] **T-3 — Compose the sitemap from the single source**
  Covers: RF-2, edge case GitHub fails, P-2, P-3
  Files: `src/pages/sitemap.xml.ts`, `tests/github-cache.test.ts`
  Done when: `PRODUCTION` is gone from the test; the sitemap with no `site` and with a preview
  `site` lists only canonical `<loc>`s; with `github('fail')` it lists `/` and `/proyectos` on the
  canonical origin; red under injections 2 and 11.

- [x] **T-4 — Generate robots.txt from the single source**
  Covers: RF-3, NFR robots directives
  Files: `src/pages/robots.txt.ts` (new), `public/robots.txt` (delete),
  `tests/canonical-origin.test.ts`
  Done when: `GET()` returns one `Sitemap:` line equal to `${CANONICAL_ORIGIN}/sitemap.xml` and
  the three directives; red under injection 12; `/robots.txt` on the dev server answers 200 with
  the route's body, read in the browser.

- [x] **T-5 — Put every JSON-LD url on the single source**
  Covers: RF-4, NFR path and query (JSON-LD)
  Files: `src/data/about.ts`, `src/pages/proyectos/index.astro`,
  `src/pages/proyectos/[name].astro`
  Done when: `JsonLdAbout.url === CANONICAL_ORIGIN` in a unit assertion in
  `tests/canonical-origin.test.ts`; the head of `/proyectos?cat=backend&lang=en` and of a project
  page read on the dev server show both `url`s on the canonical origin with their path rule.

  The rendered RF-4 guard lands in T-7, with the other e2e checks.

- [x] **T-6 — Move the README links and guard the single source**
  Covers: RF-5 (scan), RF-6
  Files: `README.md`, `tests/canonical-origin.test.ts`
  Done when: the scan finds `www.xdextx.dev` only in `src/data/site.ts` and the old host nowhere
  in its directories; the README check passes; red under injections 3, 7, 9 and 10.

  After T-1 to T-5, because the scan is red until every old literal is gone.

- [x] **T-7 — Check every identity URL on the running server**
  Covers: RF-1, RF-2, RF-3, RF-4, NFR 034 holds, NFR path and query
  Files: `e2e/canonical-origin.spec.ts` (new)
  Done when: the spec passes on `/`, `/proyectos?cat=backend&lang=en`, the first project card's
  page, `/proyectos/__missing__`, `/sitemap.xml` and `/robots.txt`; red under injections 1, 3, 4, 5
  and 6; `npm test` and `npm run test:e2e` green; `Memory.md`'s debt line on the production URL in
  `sitemap.xml.ts` and `about.ts` removed.

# Tasks 023 — Pages read GitHub data without calling their own API

**Spec:** `specs/023-pages-without-self-fetch/spec.md` (approved, 4 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-16 · owner approval of plans and tasks 021–024 together, order 022, 024, 021, 023 · 31 lines

Injection numbers refer to plan §7. Starts after 021 is implemented. Not visible, so the stop is
the validation.

- [x] **T-1 — Write the cache and self-fetch cases**
  Covers: RF-1, RF-2, RF-3, RF-4
  Files: `tests/github-cache.test.ts`
  Done when: `npm test` shows RF-1 and RF-3 **red on today's pages** (requests to their own
  origin, the sitemap to production) and RF-2 red (no `listRepos` to import).

- [x] **T-2 — Add the shared cached reads**
  Covers: RF-2
  Files: `src/pages/lib/github.ts`
  Done when: the RF-2 cases green; injection 2 shown red and restored.

- [x] **T-3 — Route the API through the shared reads**
  Covers: RF-4
  Files: the three API routes
  Done when: the RF-4 cases and 021's route cases green; injection 4 shown red and restored.

- [x] **T-4 — Pages and sitemap call the shared reads**
  Covers: RF-1, RF-3
  Files: `Resume.astro`, `proyectos/index.astro`, `proyectos/[name].astro`, `Readme.astro`,
  `sitemap.xml.ts`, `tests/project-card.test.ts`
  Done when: RF-1 and RF-3 green; injections 1 and 3 shown red and restored; `npm test` and
  `npm run test:e2e` green; every route fetched from a running dev server in both locales.

# Tasks 021 — GitHub routes serve only the owner's repositories

**Spec:** `specs/021-github-routes/spec.md` (approved, 4 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-16 · owner approval of plans and tasks 021–024 together, order 022, 024, 021, 023 · 37 lines

Injection numbers refer to plan §7.

- [x] **T-1 — Write the data and Container cases**
  Covers: RF-1, RF-3, RF-4
  Files: `tests/github-routes.test.ts`
  Done when: `npm test` shows the RF-1, RF-3 and RF-4 cases **red on today's code** (any owner
  served, every failure redirected, the literal user requested).

- [x] **T-2 — Name the user once and refuse other owners**
  Covers: RF-1, RF-4
  Files: `src/pages/lib/github.ts`, the README route, the project route
  Done when: the RF-1 and RF-4 cases green; injections 1 and 2 shown red and restored
  byte-identical.

- [x] **T-3 — Write the rendered not-found check**
  Covers: RF-2
  Files: `e2e/github-routes.spec.ts`
  Done when: red on today's page (a 302 to `/404`).

- [x] **T-4 — Split not-found from unavailable on the project page**
  Covers: RF-2, RF-3
  Files: `src/pages/proyectos/[name].astro`, `i18n/locales/es.json`, `i18n/locales/en.json`
  Done when: the RF-2 and RF-3 checks green; injections 3 and 4 shown red and restored;
  `npm test` and `npm run test:e2e` green.

- [x] **T-5 — See the unavailable state**
  Covers: the spec's visual *Done when*
  Files: none
  Done when: from a dev server started with an invalid token, a project page in light and dark,
  es and en, at 1280 and 360, its stylesheet confirmed loaded; text contrast measured. **Stop for
  the owner's visual approval.**

# Tasks 037 — README images served from the site's own origin

**Spec:** `specs/037-readme-images/spec.md` (6 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 27 lines

Injection numbers refer to plan §7.

- [x] **T-1 — Rewrite and route, unit-tested**
  Covers: RF-2 to RF-6
  Files: `tests/readme-images.test.ts`, `src/pages/lib/github.ts`,
  `src/pages/api/v1/projects/readme/[owner]/[name]/image/[n].ts`
  Done when: the tests red first, then green; injections 2–6 red and restored.

- [x] **T-2 — The pages ask only this origin**
  Covers: RF-1
  Files: `e2e/readme-images.spec.ts`
  Done when: red on today's pages (camo and raw hosts); green after T-1; injection 1 red and
  restored; `npm test` and `npm run test:e2e` green.

- [x] **T-3 — Read the two pages**
  Covers: the spec's *Done when*
  Files: none
  Done when: /proyectos/Portfolio and /proyectos/XDextX in the browser, light and dark, every
  image loading. No visual change is intended, so no visual approval step: a difference found here
  is a defect.

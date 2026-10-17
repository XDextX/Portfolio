# Tasks 031 — The language logo inside the project badge

**Spec:** `specs/031-badge-logo/spec.md` (3 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 26 lines

Injection numbers refer to plan §7.

- [x] **T-1 — Write the checks and narrow spec 014's guard**
  Covers: RF-1 to RF-3
  Files: `e2e/badge-logo.spec.ts`, `tests/project-card.test.ts`, `e2e/project-cards.spec.ts`
  Done when: RF-1 and RF-2 **red on today's card**; RF-3 green (today no badge has a logo, so
  injection 4 is what proves it); spec 014's guard green on today's card.

- [x] **T-2 — The logo in the badge**
  Covers: RF-1, RF-2, RF-3
  Files: `src/components/ProjectCard.astro`
  Done when: RF-1 to RF-3 green; injections 1–4 red and restored; `npm test` and
  `npm run test:e2e` green.

- [x] **T-3 — See the cards**
  Covers: the spec's visual *Done when*
  Files: none
  Done when: home and /proyectos, light and dark, at 1280 and 390 px, stylesheet confirmed
  loaded. **Stop for the owner's visual approval.**

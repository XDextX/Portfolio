# Tasks 032 — Each project's own social preview on its card

**Spec:** `specs/032-project-preview-image/spec.md` (7 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 35 lines

Injection numbers refer to plan §7.

- [x] **T-1 — The previews in `github.ts` and the route**
  Covers: RF-4, RF-5, RF-6
  Files: `tests/github-previews.test.ts`, `src/pages/lib/github.ts`,
  `src/pages/api/v1/projects/preview/[name].ts`
  Done when: the tests written first and red; then green; injections 5–7 red and restored;
  `GITHUB_TOKEN` still read only in `github.ts`.

- [x] **T-2 — The card and its callers**
  Covers: RF-1, RF-2, RF-3, RF-7
  Files: `tests/project-card.test.ts`, `src/components/ProjectCard.astro`,
  `src/components/ProjectsSection.astro`, `src/components/Resume.astro`,
  `src/pages/proyectos/index.astro`
  Done when: Container checks red first, then green; injection 8 red and restored.

- [x] **T-3 — Rendered checks**
  Covers: RF-1, RF-2, RF-3
  Files: `e2e/project-preview.spec.ts`,
  `e2e/project-cards.spec.ts`
  Done when: injections 1–4 red and restored; spec 014's guard green with and without the
  preview; `npm test` and `npm run test:e2e` green.

- [x] **T-4 — See the cards**
  Covers: the spec's visual *Done when*
  Files: none
  Done when: a card with a preview beside cards without a preview, home and /proyectos, light and
  dark, 1280 and 390 px, stylesheet confirmed loaded. **Stop for the owner's visual approval.**

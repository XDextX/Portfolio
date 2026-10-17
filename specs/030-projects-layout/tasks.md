# Tasks 030 — Projects section arranged like the proposal

**Spec:** `specs/030-projects-layout/spec.md` (7 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 32 lines

Injection numbers refer to plan §7.

- [x] **T-1 — Write the rendered checks**
  Covers: RF-1 to RF-7
  Files: `e2e/projects-layout.spec.ts`
  Done when: **red on today's section** (no header line or link, the toggle, three per row,
  badge top-left, small actions, gold name, the date).

- [x] **T-2 — Header with "Ver todos", four cards, no toggle**
  Covers: RF-1, RF-2, RF-3
  Files: `src/components/ProjectsSection.astro`, `src/components/ProjectsFooter.astro` (deleted),
  `i18n/locales/es.json`, `i18n/locales/en.json`, `tests/viewtransitions.test.ts`,
  `e2e/primary-button.spec.ts`, `public/styles/03-components.css`
  Done when: RF-1 to RF-3 green; injections 1–3 red and restored.

- [x] **T-3 — The card like the proposal**
  Covers: RF-4, RF-5, RF-6, RF-7
  Files: `src/components/ProjectCard.astro`
  Done when: RF-4 to RF-7 green; spec 014's guards green; injections 4–7 red and restored;
  `npm test` and `npm run test:e2e` green.

- [x] **T-4 — See the section**
  Covers: the spec's visual *Done when*
  Files: none
  Done when: the home and /proyectos, light and dark, at 1280, 800 and 390 px beside the mockup,
  stylesheet confirmed loaded. **Stop for the owner's visual approval.**

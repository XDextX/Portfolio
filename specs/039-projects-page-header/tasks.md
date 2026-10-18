# Tasks 039 — The projects page header like the proposal

**Spec:** `specs/039-projects-page-header/spec.md` (4 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-18 · owner approval with the spec · 25 lines

Injection numbers refer to plan §7.

- [x] **T-1 — Rendered checks**
  Covers: RF-1 to RF-4
  Files: `e2e/projects-header.spec.ts`, `e2e/hero-background.spec.ts`
  Done when: red on today's page.

- [x] **T-2 — The header**
  Covers: RF-1 to RF-4
  Files: `src/pages/proyectos/index.astro`, the shared gold-word parser, `SectionTitle.astro`
  Done when: green; spec 008's and 036's guards green; injections 1–4 red and restored; `npm test`
  and `npm run test:e2e` green.

- [x] **T-3 — See the header**
  Covers: the spec's visual *Done when*
  Files: none
  Done when: light and dark at 1280, 800 and 390 px beside the proposal. **Stop for the owner's
  visual approval.**

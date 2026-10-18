# Tasks 035 — Hero arranged like the proposal

**Spec:** `specs/035-hero-layout/spec.md` (7 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 30 lines

Injection numbers refer to plan §7.

- [x] **T-1 — Write the rendered checks**
  Covers: RF-1 to RF-6
  Files: `e2e/hero-layout.spec.ts`
  Done when: red on today's hero.

- [x] **T-2 — Copy: bio and the hero's email label**
  Covers: RF-5, RF-6
  Files: `src/data/about.ts`, `i18n/locales/es.json`, `i18n/locales/en.json`
  Done when: RF-5, RF-6 green; injections 5–6 red and restored.

- [x] **T-3 — Tile, sizes and the phrases column**
  Covers: RF-1 to RF-4
  Files: `src/components/AboutSection.astro`
  Done when: RF-1 to RF-4 green; spec 010's guards green; injections 1–4 red and restored;
  `npm test` and `npm run test:e2e` green.

- [x] **T-4 — See the hero**
  Covers: the spec's visual *Done when*
  Files: none
  Done when: light and dark at 1280, 800 and 390 px beside the proposal, stylesheet confirmed
  loaded. **Stop for the owner's visual approval.**

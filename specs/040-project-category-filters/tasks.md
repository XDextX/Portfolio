# Tasks 040 — Category filters on the projects page

**Spec:** `specs/040-project-category-filters/spec.md` (5 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-18 · owner approval with the spec · 28 lines

Injection numbers refer to plan §7. Lands after spec 039 (the filters sit in its header).

- [x] **T-1 — Categories and filtering, unit-tested**
  Covers: RF-2, RF-4, RF-5
  Files: `tests/project-categories.test.ts`, `src/data/projectCategories.ts`,
  `src/pages/lib/github.ts`, `src/components/ProjectsSection.astro`, `src/pages/proyectos/index.astro`,
  `i18n/locales/es.json`, `i18n/locales/en.json`
  Done when: red first, then green; injections 2, 4, 5 red and restored.

- [x] **T-2 — The row of filters**
  Covers: RF-1, RF-3
  Files: `e2e/project-filters.spec.ts`, `src/components/ProjectFilters.astro`, the four Tabler
  glyphs and `NOTICE.md`
  Done when: red first, then green; injections 1 and 3 red and restored; `npm test` and
  `npm run test:e2e` green.

- [x] **T-3 — See the filters**
  Covers: the spec's visual *Done when*
  Files: none
  Done when: light and dark at 1280, 800 and 390 px beside the proposal. **Stop for the owner's
  visual approval.**

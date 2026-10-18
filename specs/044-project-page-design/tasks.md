# Tasks 044 — The project page in the site's design system

**Spec:** `specs/044-project-page-design/spec.md` (7 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-18 · owner approval · 64 lines

Injection numbers refer to block 7 of the plan.

Starts after spec 043 is merged: T-3 moves the sidebar as 043 leaves it. Each visible task ends
in a stop for the owner's approval, in light and dark, before the next one starts (AGENTS, visual
work one component at a time).

- [x] **T-1 — Extract `PageHeader` from the `/proyectos` header**
  Covers: none (mechanical refactor; `/proyectos` renders the same)
  Files: `src/components/PageHeader.astro`, `src/pages/proyectos/index.astro`,
  `e2e/projects-header.spec.ts`, `e2e/project-filters.spec.ts`, `e2e/return-to-origin.spec.ts`
  Done when: the three e2e files pass with only their selectors renamed to `.page-header*`;
  `/proyectos` at 1280 and 390, light and dark, screenshot-equal to before the change;
  `npm test` green (`tests/viewtransitions.test.ts` and `tests/project-categories.test.ts`
  included).

- [x] **T-2 — `tidyReadme`, as data**
  Covers: RF-6, RF-7
  Files: `tests/readme-headings.test.ts`, `src/pages/lib/github.ts`
  Done when: red first, then green under `npm test`; injections 6 and 7 red and restored.

- [x] **T-3 — The project page's header: tile, band, description as lead**
  Covers: RF-1, RF-2, RF-4, RF-5, edge cases no description and long name at 360
  Files: `src/pages/proyectos/[name].astro`, `i18n/locales/es.json`, `i18n/locales/en.json`,
  `tests/project-page.test.ts`, `tests/project-card.test.ts`, `e2e/projects-header.spec.ts`,
  `e2e/project-page.spec.ts`, `e2e/hero-background.spec.ts`
  Done when: red first, then green; injections 1, 2, 3 and 5 red and restored; `npm test` and
  `npm run test:e2e` green. **Stop: the header shown at 1280 and 390 in light and dark, beside
  `/proyectos`, for the owner's approval.**

- [x] **T-4 — The body at the cards' inset**
  Covers: RF-3
  Files: `src/pages/proyectos/[name].astro`, `e2e/project-page.spec.ts`
  Done when: red first, then green at 360, 390, 800 and 1280; injection 4 red and restored;
  `e2e/dark-glows.spec.ts` green unchanged (D-9). **Stop: shown at the four widths in light and
  dark for the owner's approval.**

- [x] **T-5 — The README without its repeated name and its anchor icons**
  Covers: RF-6, RF-7, edge cases no README and fragment link
  Files: `src/components/Readme.astro`, `tests/project-page.test.ts`, `e2e/project-page.spec.ts`
  Done when: red first, then green; injections 8 and 9 red and restored; `e2e/readme-images.spec.ts`
  green unchanged. **Stop: `/proyectos/Portfolio` and `/proyectos/XDextX` shown at 1280 and 390
  in light and dark for the owner's approval.**

- [x] **T-6 — The unavailable page through `PageHeader`**
  Covers: edge case unavailable page (RF-1, RF-3)
  Files: `src/pages/proyectos/[name].astro`, `tests/project-page.test.ts`
  Done when: the 500-stub render in `tests/project-page.test.ts` shows the tile, the `h1` and the
  message as lead, red first by rendering the old branch; `tests/github-routes.test.ts` green.
  **Stop: shown in light and dark (dev server with `GITHUB_TOKEN` unset or the network off) for
  the owner's approval.**

- [x] **T-7 — The whole page, read**
  Covers: the spec's Done when
  Files: none
  Done when: `npm test` and `npm run test:e2e` green; `/proyectos/Portfolio` (README opens with
  its name) and a repository without a README, if one exists on GitHub, read beside `/proyectos`
  at 360, 390, 800 and 1280 in light and dark, both locales. **Stop for the owner's visual
  approval.**

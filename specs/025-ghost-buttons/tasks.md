# Tasks 025 — Ghost buttons readable in both themes

**Spec:** `specs/025-ghost-buttons/spec.md` (4 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-16 · owner approval with the spec · 26 lines

Starts once 021–024 are committed (plan *Ordering*). Injection numbers refer to plan §7.

- [x] **T-1 — Write the rendered ghost-button checks**
  Covers: RF-1, RF-2, RF-3, RF-4
  Files: `e2e/ghost-buttons.spec.ts`
  Done when: **red on today's page** in light (text 1.00:1 and 1.49:1), on the code button's
  transparent border, on both hovers, and on the `ghost` class.

- [x] **T-2 — One ghost button**
  Covers: RF-1, RF-2, RF-3, RF-4
  Files: `public/styles/03-components.css`, `public/styles/themes/light.css`,
  `public/styles/themes/dark.css`, `src/pages/proyectos/[name].astro`
  Done when: T-1 green in both themes; injections 1–4 shown red and restored byte-identical;
  `npm test` and `npm run test:e2e` green.

- [x] **T-3 — See both buttons in both themes**
  Covers: the spec's visual *Done when*
  Files: none
  Done when: a project page in light and dark, at rest and hovered, stylesheet confirmed loaded.
  **Stop for the owner's visual approval.**

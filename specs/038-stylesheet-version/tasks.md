# Tasks 038 — Versioned links to the public stylesheets

**Spec:** `specs/038-stylesheet-version/spec.md` (3 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-17 · approved with the spec under the same delegation · 19 lines

Injection numbers refer to plan §7.

- [x] **T-1 — The version function**
  Covers: RF-2
  Files: `tests/styles-version.test.ts`, `src/utils/styles-version.ts`
  Done when: red first, then green; injection 2 red and restored.

- [x] **T-2 — The versioned links**
  Covers: RF-1, RF-3
  Files: `e2e/stylesheet-version.spec.ts`, `astro.config.mjs`, `src/layouts/BaseLayout.astro`
  Done when: red on today's head; then green; injections 1 and 3 red and restored; `npm test` and
  `npm run test:e2e` green; the head read on the dev server.

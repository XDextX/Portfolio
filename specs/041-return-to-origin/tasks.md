# Tasks 041 — Return to where you left

**Spec:** `specs/041-return-to-origin/spec.md` (6 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-18 · owner approval · 25 lines

Injection numbers refer to plan §7.

- [x] **T-1 — The pure rules, unit-tested**
  Covers: RF-5, RF-6 (as data)
  Files: `tests/return-origin.test.ts`, `src/utils/returnOrigin.ts`
  Done when: red first, then green under `npm test`; injection 5 red and restored.

- [x] **T-2 — Record and restore**
  Covers: RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, the NFRs and the storage edge case
  Files: `e2e/return-to-origin.spec.ts`, `src/components/ReturnToOrigin.astro`,
  `src/layouts/BaseLayout.astro`
  Done when: red first, then green; injections 1, 2, 3, 4 and 6 red and restored; `npm test` and
  `npm run test:e2e` green, spec 040's RF-9 included.

- [x] **T-3 — See the returns**
  Covers: the spec's visual *Done when*
  Files: none
  Done when: the three returns of RF-1 filmed in light and dark at 1280 and 390 px. **Stop for
  the owner's visual approval.**

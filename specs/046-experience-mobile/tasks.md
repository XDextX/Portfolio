# Tasks 046 — Experience on a phone, and its Spanish copy

**Spec:** `specs/046-experience-mobile/spec.md` (4 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-18 · owner approval · 41 lines

Injection numbers refer to block 7 of the plan.

- [x] **T-1 — Restore the Spanish accents, guarded by a data test**
  Covers: RF-4
  Files: `tests/experience.test.ts`, `src/data/experience.ts`
  Done when: the RF-4 test is red on today's data, then green under `npm test` with the six words
  accented (file saved UTF-8, CRLF kept, nothing else reworded); injection 5 red both ways and
  reverted.

- [x] **T-2 — Write the rendered checks, red first**
  Covers: RF-1, RF-2, RF-3, the 800/1280 NFR
  Files: `e2e/experience-timeline.spec.ts`
  Done when: the new "experience on a phone (spec 046)" tests run under `npm run test:e2e` and RF-1
  (360, 390), RF-2 (390) and RF-3 (360 es) are red on today's code while the 800/1280 check is
  green; the spec 028 test's 390 branch no longer asserts the tile ends before the role (plan D-5).

- [x] **T-3 — Put the tile on the period's row below 40rem**
  Covers: RF-1, RF-2
  Files: `src/components/ExperienceSection.astro`
  Done when: RF-1, RF-2 and the 800/1280 check green; injections 1, 2 and 4 red and reverted; the
  rule confirmed in `document.styleSheets` before measuring; the section shown at 360 and 390 in
  light and dark. **Stop for the owner's visual approval.**

- [x] **T-4 — Balance a wrapped role or company**
  Covers: RF-3
  Files: `src/components/ExperienceCard.astro`
  Done when: RF-3 green at 360 and 390 in both locales, the 360 es role reading
  "Desarrollador / Full Stack"; injections 3 and 6 red and reverted; shown at 360 in light and
  dark. **Stop for the owner's visual approval.**

- [x] **T-5 — Validate the whole spec**
  Covers: the NFRs and the spec's *Done when*
  Files: none
  Done when: `npm test` and `npm run test:e2e` green; the section read on the dev server at 360,
  390, 800 and 1280 px in light and dark, with 800 and 1280 matching today's layout.

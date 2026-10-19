# Tasks 047 — The hero's phrases read as a flow on a phone

**Spec:** `specs/047-hero-phrases-mobile/spec.md` (3 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-18 · owner approval · 38 lines

Injection numbers refer to block 7 of the plan.

- [x] **T-1 — Let the pixel helper read a pseudo-element's colour**
  Covers: RF-2 (mechanical: the measuring tool)
  Files: `e2e/helpers/pixels.ts`
  Done when: `PixelTarget` takes an optional `pseudo`, its JSDoc says the box stays the element's;
  `e2e/hero-background.spec.ts` and `e2e/dark-glows.spec.ts` still green under `npm run test:e2e`.

- [x] **T-2 — Write the rendered checks, red against today's wrap**
  Covers: RF-1, RF-2, RF-3, NFR (where four fit, one line), both edge cases
  Files: `e2e/hero-phrases.spec.ts`
  Done when: the spec runs and RF-1, RF-3 and the sweep are red on today's code at 360 and 390 in
  both locales (this is injection 1, observed before the fix); RF-2 passes or fails on its own.

- [x] **T-3 — Pair the phrases below each locale's breakpoint**
  Covers: RF-1, RF-2, RF-3, NFR (035 RF-3 untouched, markup order)
  Files: `src/components/AboutSection.astro`
  Done when: `e2e/hero-phrases.spec.ts` green; the new rule is in `document.styleSheets` on the dev
  server; injections 1, 2, 3 and 4 red and reverted by explicit path; the comment is at most five
  lines and `tests/comments.test.ts` and `tests/tokens.test.ts` green.

- [x] **T-4 — Widen 035's chevron assertion to the phrases that share a line**
  Covers: NFR (035 RF-4 still holds)
  Files: `e2e/hero-layout.spec.ts`
  Done when: RF-4 at 390 green with the pairing in place; injection 5 red and reverted; injection 6
  red and reverted.

- [x] **T-5 — Run both suites and read the hero**
  Covers: the spec's Done when
  Files: none
  Done when: `npm test` and `npm run test:e2e` green; the hero read on the dev server at 360, 390
  and 800 px in light and dark, es and en. **Stop for the owner's visual approval.**

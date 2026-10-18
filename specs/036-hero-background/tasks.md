# Tasks 036 — A flat-shape background behind the hero and the social card

**Spec:** `specs/036-hero-background/spec.md` (5 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 32 lines

Injection numbers refer to plan §7.

- [x] **T-1 — The shape definition**
  Covers: RF-2
  Files: `src/data/heroShapes.ts`, `tests/seo.test.ts`
  Done when: `shapeFill` tested red first, then green.

- [x] **T-2 — The band in the hero**
  Covers: RF-1, RF-2, RF-3, RF-5
  Files: `e2e/hero-background.spec.ts`, `src/components/HeroBackground.astro`,
  `src/components/AboutSection.astro`, `public/styles/00-tokens.css`, `src/styles/global.css`
  Done when: the checks red on today's hero; then green; injections 1–3 and 5 red and restored.

- [x] **T-3 — The shapes behind the cards**
  Covers: RF-4
  Files: `scripts/og-cover.ts`, `tests/seo.test.ts`, `e2e/og-cover-layout.spec.ts`,
  `public/og-cover-es.png`, `public/og-cover-en.png`
  Done when: red first; then green; injection 4 red and restored; cards regenerated, two runs
  byte-identical; `npm test` and `npm run test:e2e` green.

- [x] **T-4 — See the band and the cards**
  Covers: the spec's visual *Done when*
  Files: none
  Done when: light and dark at 1280, 800 and 390 px beside the proposal, both cards, stylesheet
  confirmed loaded. **Stop for the owner's visual approval.**

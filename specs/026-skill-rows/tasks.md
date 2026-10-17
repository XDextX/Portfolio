# Tasks 026 — Skill rows shaped like the design proposal

**Spec:** `specs/026-skill-rows/spec.md` (5 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 38 lines

Injection numbers refer to plan §7.

- [x] **T-1 — Amend the radius rule in AGENTS.md**
  Covers: none (the rule the RFs check against)
  Files: `AGENTS.md`
  Done when: the rule reads exactly as the spec's *Proposed amendment*; committed alone as
  `docs:` when the owner asks.

- [x] **T-2 — Write the colour and layout checks**
  Covers: RF-1, RF-2, RF-3, RF-4, RF-5
  Files: `tests/visual-language.test.ts`, `tests/markup.test.ts`, `e2e/skills.spec.ts`
  Done when: the three named guards are retired; the new checks are **red on today's rows**
  (two lines, framed square bar, intermediate blue, dark label 4.13:1, the pill).

- [x] **T-3 — Hue-named colours and the level map**
  Covers: RF-4, RF-5
  Files: `public/styles/00-tokens.css`, `public/styles/themes/light.css`,
  `public/styles/themes/dark.css`, `src/data/levelLabels.ts`
  Done when: the RF-4 and RF-5 data checks green; step tones equal before and after (D-3);
  injections 4 and 5 red and restored; `tests/tokens.test.ts` green.

- [x] **T-4 — One-line row with rounded segments**
  Covers: RF-1, RF-2, RF-3, RF-5
  Files: `src/components/SkillBar.astro`, `src/components/TechGrid.astro`
  Done when: the rendered checks green at 1280 and 360; injections 1, 2, 3 and 6 red and
  restored; `npm test` and `npm run test:e2e` green.

- [x] **T-5 — See the Skills section**
  Covers: the spec's visual *Done when*
  Files: none
  Done when: light and dark at 1280 and 360, stylesheet confirmed loaded, side by side with the
  proposal's crop. **Stop for the owner's visual approval.**

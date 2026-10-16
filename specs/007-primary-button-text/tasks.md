# Tasks 007 — Primary button: light gold in dark, text colour per theme

**Spec:** `specs/007-primary-button-text/spec.md` (**approved**, 4 RF).
**Plan:** `specs/007-primary-button-text/plan.md` (**approved**).
**Approved:** 2026-10-15 · owner approval

**Ordering across specs.** 016 lands first; then 007, 008 and 017, in that order.
Every vitest guard here builds on 016's `resolveColour(expr, ...layers)`, `contrast`,
`luminance` and `styleSources()` in `tests/helpers/colour.ts` (016 D-5; plan aligned).
016 already tests the resolver's two-hop, dead-end and cycle cases. This spec creates `e2e/helpers/dev-server.ts` and the theme setup
(`addInitScript` + `emulateMedia`) that 008 and 017 reuse; 008 later moves this spec's
`toHexColour` and `settle` into `e2e/helpers/rendered.ts`.

Injection numbers refer to the table in plan §7.

- [x] **T-1 — Amend the `--accent-surface` rule in `AGENTS.md`**
  Covers: none (mechanical; the spec's prerequisite, constitution 3)
  Files: `AGENTS.md`
  Done when: the line "`--accent-surface` stays dark in both themes" is gone, and
  `AGENTS.md` states that the fill is a theme choice, that the ink on it is
  `--accent-surface-text` declared in each theme file, and names
  `tests/visual-language.test.ts` and `e2e/primary-button.spec.ts` as what settles it.

  First, so the code commit points at a rule that already exists; its own `docs:`
  commit when you ask for one.

- [x] **T-2 — Admit the e2e suite: constitution 7 and the pre-commit hook**
  Covers: none (mechanical; the spec's prerequisite, a block decision shared with
  008 and 017)
  Files: `docs/constitution.md`, `.husky/pre-commit`, `playwright.config.ts`
  Done when: constitution 7 names `npm run test:e2e` as part of the test policy;
  `playwright.config.ts` runs on the installed Chrome (`channel: 'chrome'`, no browser
  download — cross-cutting decision);
  `.husky/pre-commit` runs it after `npm test` and exits non-zero when it fails,
  shown once by running the hook script directly (never a real commit attempt) against
  a deliberately failing e2e test, reverted by explicit path.

  Skip if the block has already landed it. The wording is yours; its own `docs:`
  commit when you ask. RF-3, RF-4 and the light NFR are not checks until this exists.

- [x] **T-3 — Move `startDevServer` into `e2e/helpers/dev-server.ts`**
  Covers: none (mechanical, plan D-8)
  Files: `e2e/helpers/dev-server.ts` (new), `e2e/about.spec.ts`
  Done when: `e2e/about.spec.ts` imports `startDevServer` and no longer defines it;
  `npm run test:e2e -- e2e/about.spec.ts` green with the same test count as before.

- [x] **T-4 — Replace the white-on-dark guard with the three data guards**
  Covers: RF-1, RF-2, the per-theme, no-shared-default and one-hue NFRs
  Files: `tests/visual-language.test.ts` (the guards, importing from the helper)
  Done when: "a surface that white text sits on is dark in both themes" is gone and
  the line-39 comment no longer names it; *button text contrast*, *dark fill above
  ink* and *per-theme declaration* are **red on today's code**, each failure naming
  its requirement and theme, an unresolvable value reported as a failure, not a skip.

- [x] **T-5 — Write the rendered guards in `e2e/primary-button.spec.ts`**
  Covers: RF-3, RF-4, the light-unchanged NFR
  Files: `e2e/primary-button.spec.ts` (new)
  Done when: *consumer ink* and *hover contrast* exist with the in-page
  `toHexColour`, `composite`, `groundOf` and settle-by-polling of plan §3–4;
  *consumer ink* is **red on today's code** in dark and on "Demo" in light; a missing
  "Demo" fails naming the data dependency; *hover contrast* green (light 4.75, dark
  as light today) — it is proven by injections 12 and 14 in T-7.

- [x] **T-6 — Declare the fill and its ink per theme**
  Covers: RF-1, RF-2, the per-theme, no-shared-default, one-hue and no-stale-count NFRs
  Files: `public/styles/00-tokens.css`, `public/styles/themes/light.css`,
  `public/styles/themes/dark.css`
  Done when: `00-tokens.css` declares no `--accent-surface`; light declares
  `--accent-surface-text: var(--neutral-0)`; dark declares fill
  `var(--brand-accent)` and ink `var(--color-brand)`, its comment carrying 6.66:1 and
  no count of white literals; `npm test` green, `tests/tokens.test.ts` included;
  injections 1–8 shown red as plan §7 predicts (9 is dropped) and restored byte-identical.

  Not committed alone: until T-7, dark draws white on light gold at 1.66:1.

- [x] **T-7 — Paint every consumer in `--accent-surface-text`**
  Covers: RF-3, RF-4, the light-unchanged and no-stale-count NFRs
  Files: `public/styles/03-components.css`, `src/pages/404.astro`,
  `src/components/AboutSection.astro`, `src/components/ContactCard.astro`
  Done when: no `#fff` is left on an accent-surface consumer (six replaced, hovers
  included); `.btn--primary` is unscoped in `03-components.css` after `.btn:active`
  and gone from `404.astro`; a grep of `public/styles` and `src` for "stays dark" and
  for a count of the white literal returns nothing; `npm test` and
  `npm run test:e2e` green; injections 10–15 shown red as predicted and restored
  byte-identical.

- [x] **T-8 — See it in both themes**
  Covers: RF-1–RF-4 as rendered; the spec's *Done when*
  Files: none
  Done when: `npm run build` green; from a running dev server, after
  `document.styleSheets` shows the new rules, every consumer seen at rest and hovered
  (the copy label included) in light and dark, at 1280 and 390 wide, on `/`, the
  first project page and the 404; computed values read in the browser match plan §5.
  **Stop for your visual approval.**

  After approval: one commit for the primary button, naming the 14 injections and
  spec 007; the spec goes to `implemented` once validated — both only when you ask.

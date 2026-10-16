# Tasks 017 — Control border contrast

**Spec:** `specs/017-control-border-contrast/spec.md` (**approved**, 4 RF).
**Plan:** `specs/017-control-border-contrast/plan.md` (**approved**).
**Approved:** 2026-10-15 · owner approval

**Ordering across specs.** 016 lands first; then 007, 008 and 017, in that order.
This spec depends on:

- 016's `tests/helpers/colour.ts` (`resolveColour(expr, ...layers)`, `contrast`,
  `styleSources()`, `cssRules()`, the theme layers), which T-2 extends.
- 007's `e2e/helpers/dev-server.ts` and theme setup, and 008's
  `e2e/helpers/rendered.ts` (`openIn`, `installHelpers` with `__toHex`, `settled`); the
  dev-server helper resolves with its own URL.
- 007's T-2: constitution 7 admits the e2e suite and the hook runs it. RF-3 is not a
  check until it has landed.

Line numbers in the plan are today's: re-read both theme files after 016 adds
`--focus-ring` and 007 adds `--accent-surface-text`.

Injection numbers refer to the table in plan §7.

- [x] **T-1 — Write the control-border rule into `AGENTS.md`**
  Covers: none (mechanical; the spec's *Done when*, constitution 3)
  Files: `AGENTS.md`
  Done when: `AGENTS.md` states that a bordered control rests in `--control-border`,
  at least 3:1 on the sheet and the card in each theme, and turns `--accent-text` on
  hover, and names `tests/visual-language.test.ts` and `e2e/control-borders.spec.ts`
  as what settles it.

  First, so the code commit points at a rule that already exists; its own `docs:`
  commit when you ask for one.

- [x] **T-2 — Add `hue`, `hueDistance` and `borderColourOf` to the colour helper**
  Covers: support for RF-1, RF-4 and the hue NFR (plan §3)
  Files: `tests/helpers/colour.ts`, `tests/visual-language.test.ts`
  Done when: the helper cases (`hue('#FF0000') = 0`, `hue('#0000FF') = 240`,
  `hueDistance(350, 10) = 20`, and `borderColourOf` on a `border-color`, a `border`
  shorthand and `none`) are shown red before the functions exist, then green;
  `npm test` green; injection 14 shown red and restored byte-identical.

- [x] **T-3 — Guard the resting border and its contrast**
  Covers: RF-1, RF-2, RF-4, the hue NFR
  Files: `tests/visual-language.test.ts`
  Done when: *control border* is **red on today's code**, naming all seven control
  rules and both `.theme-btn` overrides; *control contrast* is **red**, reporting
  that `--control-border` cannot be resolved as a failure, not a skip.

- [x] **T-4 — Write the hover guard in `e2e/control-borders.spec.ts`**
  Covers: RF-3
  Files: `e2e/control-borders.spec.ts` (new)
  Done when: *hover gold* is **red on today's code** for the language selector and
  the view-toggle group in both themes, green for the other six; an absent control
  (empty projects section) fails naming the control and its data dependency;
  injection 18 shown red on the theme toggle, light only, and restored
  byte-identical.

- [x] **T-5 — Rest every control in `--control-border`**
  Covers: RF-1, RF-2, RF-4, the hue and width/style/radius NFRs
  Files: `public/styles/themes/light.css`, `public/styles/themes/dark.css`,
  `src/components/ThemeSwitch.astro`, `src/components/AboutSection.astro`,
  `src/components/SkillChip.astro`, `public/styles/03-components.css`,
  `src/components/ContactCard.astro`, `src/components/LanguageSwitcher.astro`,
  `src/components/SkillViewToggle.astro`
  Done when: both theme files declare `--neutral-400` (`#848F9F` light, `#7D93C2`
  dark) and `--control-border: var(--neutral-400)`, and their `.theme-btn` overrides
  read the alias; each of the seven rules changes only the colour term of its
  `border`; `--color-border` still reads `var(--neutral-200)`; `npm test` green,
  `tests/tokens.test.ts` included; injections 1–13 and 19 (its data half) shown red
  as plan §7 predicts and restored byte-identical.

- [x] **T-6 — Turn the language selector and the view-toggle group gold on hover**
  Covers: RF-3
  Files: `src/components/LanguageSwitcher.astro`, `src/components/SkillViewToggle.astro`
  Done when: `.language-switcher:hover` and `.view-toggle:hover` set `border-color:
  var(--accent-text)` only, and each rule's `transition` lists `border-color`;
  `.toggle-btn:hover` and `.toggle-btn.active` unchanged; `npm run test:e2e` green;
  injections 15–17 and 19 (its precondition half) shown red and restored
  byte-identical.

- [x] **T-7 — See it in both themes**
  Covers: RF-1–RF-4 as rendered; the spec's *Done when*
  Files: none
  Done when: `npm run build` green; from a running dev server, after
  `document.styleSheets` shows the new rules and transitions settle, `/`,
  `/proyectos` and the 404 seen in light and dark, every listed control at rest and
  hovered; computed border colours read in the browser match plan §5 (`#848F9F` /
  `#7D93C2` at rest, the gold on hover). **Stop for your visual approval.**

  One stop for both changes, not one per component: once 007's T-2 puts the e2e
  suite in the hook, a commit with *hover gold* still red is refused, so T-5 and
  T-6 land in one commit. After approval: that commit, naming the 19 injections and
  spec 017; the spec goes to `implemented` once validated — both only when you ask.

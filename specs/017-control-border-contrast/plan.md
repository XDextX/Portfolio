# Plan 017 — Control border contrast

**Spec:** `specs/017-control-border-contrast/spec.md` (**approved**, 4 RF).
**Status:** approved
**Approved:** 2026-10-15 · owner approval · 188 lines
**Approved:** 2026-10-15 · re-approval: helper names aligned with what 007 and 008 landed (openIn, installHelpers, settled) · 189 lines

**Ordering.** Specs 016, 007 and 008 land first. 016 puts `resolveColour(expr, ...layers)`,
`contrast`, `styleSources()`, `cssRules()` and the per-theme layers in
`tests/helpers/colour.ts`; 007 creates `e2e/helpers/dev-server.ts` and the theme setup
(`addInitScript` + `emulateMedia`); 008 moved them into `e2e/helpers/rendered.ts` as
`openIn(page, base, theme, route)`, `installHelpers` (in-page `__toHex`) and `settled`;
`startDevServer` resolves with its own server's URL. Before any code, the spec's prerequisite: the constitution 7
amendment that admits the e2e suite. Line numbers are today's; re-read the theme files after
016 adds `--focus-ring` to them.

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 every bordered control rests in the control boundary colour | the seven control rules and both `.theme-btn` overrides read `var(--control-border)`; guard *control border* (§4) |
| RF-2 ≥ 3:1 on sheet and card, each theme | `--neutral-400` + `--control-border` in both theme files; guard *control contrast* |
| RF-3 hover turns the border gold | new hover rules on the language selector and the view-toggle group; e2e *hover gold* over all eight controls, both themes |
| RF-4 gold ≥ 1.5:1 from rest | guard *control contrast*, same test |
| NFR hue within 10° of `--neutral-200` | guard *control contrast*, same test |
| NFR width, style, radius unchanged | only the colour token in each `border` changes; the two hover rules set `border-color` only |
| Edge: touch keeps `:hover` | accepted by the spec; no `(hover: hover)` gate on the new rules (D-6) |

Every RF is covered. The `AGENTS.md` rule is its own `docs:` commit, first.

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `AGENTS.md` | modify | States the rule — a control rests in `--control-border` (≥ 3:1 on sheet and card) and turns `--accent-text` on hover — naming `tests/visual-language.test.ts` and `e2e/control-borders.spec.ts`. |
| `public/styles/themes/light.css` | modify | Decides the light boundary step (`--neutral-400`, cool) and aliases `--control-border` to it; `:root .theme-btn` (line 108) reads the alias. |
| `public/styles/themes/dark.css` | modify | The same in navy; `:root[data-theme="dark"] .theme-btn` (line 107) reads the alias. |
| `src/components/LanguageSwitcher.astro` | modify | `.language-switcher` rests in the boundary colour (line 68) and gains `:hover { border-color: var(--accent-text) }`; today only `.select:hover` (line 90) recolours the text. |
| `src/components/SkillViewToggle.astro` | modify | `.view-toggle` rests in the boundary colour (line 82) and gains the same group hover; `.toggle-btn:hover` (lines 103-106) and `.toggle-btn.active` (012) stay as they are. |
| the five other control files | modify | Each control's resting border: `ThemeSwitch.astro:111`, `AboutSection.astro:191`, `SkillChip.astro:45`, `03-components.css:55` (`.btn-action`: card actions and "show more"), `ContactCard.astro:167`. |
| `tests/helpers/colour.ts` | modify | Gains `hue`, `hueDistance` and `borderColourOf` (§3), beside 016's maths. |
| `tests/visual-language.test.ts` | modify | Gains *control border*, *control contrast* and the helper cases. |
| `e2e/control-borders.spec.ts` | create | The rendered hover check for RF-3. |

`--color-border` keeps `var(--neutral-200)`: cards, the card divider, `.contact-card`
(`ContactCard.astro:100`), the avatar and the topic code are untouched (owner decision).
No new dependency.

## 3. Pure logic

In `tests/helpers/colour.ts`; nothing reads a clock.

- `hue(hex: string): number` — HSL hue in degrees, 0 for a grey.
- `hueDistance(a: number, b: number): number` — circular, `min(|a-b|, 360-|a-b|)`.
- `borderColourOf(decls: Map<string, string>): string | null` — `border-color`, else the
  colour term of a `border` shorthand; `null` when neither has one (`none`, `0`).

## 4. Algorithm

**Controls**, one table in `e2e/control-borders.spec.ts` and one in the guard — the
guard reads a rule, the e2e a rendered element:

```
name               rule (file, selector)                        rendered on /
language selector  LanguageSwitcher.astro  .language-switcher   .language-switcher
theme toggle       ThemeSwitch.astro       .theme-btn           .theme-btn
hero social        AboutSection.astro      .btn-social          .btn-social
view-toggle group  SkillViewToggle.astro   .view-toggle         .view-toggle
skill chip         SkillChip.astro         .chip                .chip (list view on)
show more          03-components.css       .btn-action          .projects-footer__toggle
card action        (same rule)                                  .project-card .btn-action
contact button     ContactCard.astro       .icon-btn            .icon-btn
```

**Guard *control border* (RF-1).** For each of the seven rules: the base rule (no
pseudo-class) exists, and `borderColourOf` equals `var(--control-border)`. Then over every
rule in `styleSources()` (theme files included): strip a leading `:root` or
`:root[data-theme="dark"]`; if what remains equals a control's selector and the rule
declares a border colour, it must be `var(--control-border)`. This reaches both
`.theme-btn` overrides and any future one; `.btn-action.primary` (007) and `:hover`
rules do not match.

**Guard *control contrast* (RF-2, RF-4, hue).** Layers from 016:
`light: [light.css, 00-tokens.css]`, `dark: [dark.css, light.css, 00-tokens.css]`.

```
for theme in light, dark:
  c = resolve(--control-border)
  for ground in --main-bg, --card-background: contrast(c, ground) >= 3     # RF-2
  contrast(c, resolve(--accent-text)) >= 1.5                               # RF-4
  hueDistance(hue(c), hue(resolve(--neutral-200))) <= 10                   # NFR
```

**e2e *hover gold* (RF-3).** For each theme (007's setup), on `/`:

```
gold = toHexColour(computed color of a probe <span style="color: var(--accent-text)">)
click the list-view .toggle-btn                      # the chips render
for control in table:
  el = first match; absent -> fail naming the control and its data dependency
  mouse to (0, 0); settle; rest = border-top-color   # precondition: rest != gold
  el.hover(); settle
  all four border-*-color of el == gold, else fail naming control and theme
```

The view-toggle is hovered and read on `.view-toggle` itself, never on a `.toggle-btn`:
the active button is 012's. The show-more toggle and the card actions need repos from
the GitHub fetch, so an empty projects section fails, named, rather than skipping.

**Helper cases:** `hue('#FF0000') = 0`, `hue('#0000FF') = 240`, `hueDistance(350, 10) = 20`.

## 5. Interface

| State | Light | Dark |
|---|---|---|
| Rest, on the sheet | `#848F9F`, 3.19:1 (was 1.27) | `#7D93C2`, 3.59:1 (was 1.54) |
| Rest, on a card | 3.28:1 (was 1.30) | 3.18:1 (was 1.37) |
| Hovered, every control | border gold `#7A5D10`, 1.89:1 from rest | gold `#E3C770`, 1.86:1 from rest |
| Language selector hovered | border gold (new) + text gold (as today) | same |
| View-toggle group hovered | group border gold (new); the hovered button still fills `--neutral-200` | same |
| Tapped on touch | gold until the next tap elsewhere (accepted) | same |
| Skill chip on its own fill | 2.51:1 (was 1.00) | 4.20:1 |
| Hue vs `--neutral-200` | 215.6° vs 212.3° | 220.9° vs 219.5° |

The projects section without repos renders no card actions and no show-more: nothing
changes there, and the e2e names the missing data (§4).

## 6. Decisions

- **D-1 · Light `#848F9F`, dark `#7D93C2`, the spec's measured candidates**, re-measured
  above. Neither literal exists in either theme file, so `tokens.test.ts:219` (one
  literal, one name) stays green. *Discarded:* aliasing `--text-secondary` — no new
  literal, but 1.00:1 (light) and 1.23:1 (dark) from the gold fails RF-4.
- **D-2 · The literal is a ramp step, `--neutral-400`, and `--control-border` is `var()`
  of it**, as `--color-border` is of `--neutral-200`; both sit between 200 and 600 in
  luminance. *Discarded:* the literal on `--control-border` — `dark.css:62-64` says each
  surface name is `var()` of the step it means.
- **D-3 · A new token in both theme files**, never in `00-tokens.css` and never
  `--color-border` raised (owner decision). *Discarded:* a shared default — the
  both-themes guard (`tokens.test.ts:190`) and the `--accent-surface` history.
- **D-4 · Rewrite the `.theme-btn` overrides to the alias.** *Discarded:* deleting their
  `border-color` line — the theme files own the toggle's per-theme rules, and a
  scoped-versus-theme specificity race already painted it wrong once
  (`ThemeSwitch.astro:123-127`).
- **D-5 · The group hover goes on `.view-toggle`, not on `.toggle-btn`.** *Discarded:* a
  gold border on the hovered button — it is 012's surface, and the spec's control is the
  group. The new rules add `border-color` to their `transition`, as `.chip` and
  `.btn-action` do; *discarded:* an instant swap, the one hover on the site without it.
- **D-6 · No `(hover: hover)` gate.** The spec accepts the sticky tap; the gate in
  `AGENTS.md` is for the skills-row icon recolour. *Discarded:* gating — it would make
  these two controls the only ones whose hover differs on touch.
- **D-7 · RF-3 is e2e, RF-1/2/4 are data.** A rendered hover is the only proof the
  border turns (a later rule or specificity can undo a declared one). *Discarded:* a source
  check for a `:hover` rule — it passes while the cascade loses it.

## 7. Test strategy

`npm test` (`vitest --run tests`) for *control border*, *control contrast* and the helper
cases — stylesheets as data (constitution 8); `npm run test:e2e` (`playwright test`,
Chromium) for *hover gold*. Written first, red today: *control border* on all seven
rules and both overrides; *control contrast* cannot resolve `--control-border`; *hover
gold* on the language selector and the view-toggle group, both themes.

| # | Injection | Expected red |
|---|---|---|
| 1 | `.theme-btn` border back to `var(--color-border)` | control border, theme toggle |
| 2 | light.css override back to `var(--neutral-200)` | control border, theme toggle |
| 3 | dark.css override back to `var(--neutral-200)` | control border, theme toggle |
| 4 | `.btn-action` border with a literal `#848F9F` | control border, action button |
| 5 | `.icon-btn` border as `1px solid` (no colour) | control border, contact button |
| 6 | `:root .chip { border-color: var(--neutral-200) }` in light.css | control border, skill chip |
| 7 | light `--neutral-400: #9AA4B2` | control contrast, RF-2 (2.46 sheet) only |
| 8 | dark `--neutral-400: #6B83B8` | control contrast, RF-2 (2.92 / 2.59) only |
| 9 | light `--control-border: var(--text-secondary)` | control contrast, RF-4 (1.00) only |
| 10 | dark `--control-border: var(--text-secondary)` | control contrast, RF-4 (1.23) only |
| 11 | light `--neutral-400: #8F8A84` (warm) | control contrast, hue (32.7°) only |
| 12 | dark `--neutral-400: #9A8FC2` (violet) | control contrast, hue (252.9°) only |
| 13 | `--neutral-400` deleted from dark.css | control contrast (light's step on a dark card, 2.98), both-themes guard |
| 14 | `hueDistance` without the wrap-around | helper case (350, 10) |
| 15 | `.view-toggle:hover` rule removed | hover gold, view-toggle group, both themes |
| 16 | the gold moved from `.view-toggle:hover` to `.toggle-btn:hover` | hover gold, view-toggle group |
| 17 | `.language-switcher:hover` rule removed | hover gold, language selector |
| 18 | light `.theme-btn:hover` border-color → `var(--control-border)` | hover gold, theme toggle, light only |
| 19 | light `--control-border: var(--accent-text)` (rest = gold) | control contrast, RF-4 (1.00) and hue; hover gold, its rest ≠ gold precondition |

Rows 18 and 19 are the two halves of "the hover border is the rest colour": a hover rule
changed reddens RF-3 only, a rest token changed reddens RF-4. Each injection restored
byte-identical by explicit path, the commit naming them (constitution 4). Then
`npm run build`, and `/`, `/proyectos` and the 404 from the dev server in both themes —
then stop for the owner's approval.

# Plan 026 — Skill rows shaped like the design proposal

**Spec:** `specs/026-skill-rows/spec.md` (5 RF, with the AGENTS radius amendment).
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 102 lines
**Changed:** 2026-10-17 · at implementation: spec 006 RF-9's guard retired (one row per line follows from RF-2) and RF-10's rewritten on the new columns; the level keeps a 7rem cap with ellipsis so that minimum stays a sum of lengths; light amber fill moved to #A16207 (hue 23° to 35°)

**Ordering.** The AGENTS amendment is committed alone as `docs:` first; then the code.

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 (one line, four parts) | §4: `.bars-list` becomes a four-column grid and each `.bar-row` a subgrid row: logo · name · bar · label. |
| RF-2 (bars aligned in a card) | The shared columns: the name and label columns size to the longest entry of the card, so every bar gets the same start and width. |
| RF-3 (rounded segments, no frame) | `.bar-track` loses border and padding; `.bar-seg` is 6px tall with `--radius-pill`, 4px apart. |
| RF-4 (blue / teal / amber, ≥ 3:1 on unlit) | Level colours re-mapped through hue-named tokens (§6 D-2), a new teal pair in both themes. |
| RF-5 (label as text on the card, ≥ 4.5:1) | `.level-tag` loses its pill; the per-theme `-text` tokens are re-measured on the card face and adjusted where under 4.5:1. |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `AGENTS.md` | modify | The radius rule names the skill segments as lozenges (the spec's text). |
| `public/styles/00-tokens.css`, `themes/light.css`, `themes/dark.css` | modify | Hue-named colour tokens: `--clr-blue`, `--clr-teal`, `--clr-amber`, `--clr-green` and their `-text` pairs; the step tones alias them by hue. |
| `src/data/levelLabels.ts` | modify | Decides which colour a level wears: `LEVEL_COLOR` / `LEVEL_TEXT_COLOR` point at blue, teal and amber; no hex fallback (AGENTS: a hardcoded fallback never follows the theme). |
| `src/components/SkillBar.astro` | modify | One row: logo, name, segmented bar, label; the row joins its list's grid. |
| `src/components/TechGrid.astro` | modify | `.bars-list` owns the four columns the rows share. |
| `tests/markup.test.ts`, `tests/visual-language.test.ts` | modify | Retire the three guards the spec names; the fill guard reads the new map; a label-on-card guard (RF-5) and a hue-band guard (RF-4). |
| `e2e/skills.spec.ts` | modify | RF-1, RF-2, RF-3 and the no-pill half of RF-5, rendered. |

## 3. Pure logic

```ts
// tests/helpers/colour.ts — reused: contrast(), resolveColour(), hue()
LEVEL_COLOR = { advanced: 'var(--clr-blue)', intermediate: 'var(--clr-teal)', beginner: 'var(--clr-amber)' }
LEVEL_TEXT_COLOR = { advanced: 'var(--clr-blue-text)', intermediate: 'var(--clr-teal-text)', beginner: 'var(--clr-amber-text)' }
```

## 4. Algorithm

```css
.bars-list  { display: grid; grid-template-columns: 22px max-content minmax(60px, 1fr) max-content;
              column-gap: 0.6rem; row-gap: var(--sp-3); }
.bar-row    { grid-column: 1 / -1; display: grid; grid-template-columns: subgrid; align-items: center; }
.bar-name   { max-width: 9rem; ellipsis }        /* a long name gives way, the bar keeps 60px */
.bar-track  { display: grid; grid-template-columns: repeat(var(--segments), 1fr); gap: 4px; }
.bar-seg    { height: 6px; border-radius: var(--radius-pill); background: var(--neutral-200); }
.level-tag  { font-size: var(--fs-xs); font-weight: 600; white-space: nowrap; }   /* no background */
```

`.bar-main` (name over track) dissolves: name and track become direct grid children. The
lighting animation, `.lit` and the reduced-motion rule are untouched.

Colour values: blue and amber reuse today's measured pairs where they already pass (blue is
today's intermediate pair, amber today's beginner pair); teal is new. Each `-text` value is
measured on the card face (`#FFFFFF` light, `--neutral-100` dark) and moved within its hue band
until it clears 4.5:1 — the dark blue text, 4.13:1 today, is the known one to fix. Every value
is recorded in the commit.

## 5. Interface

| State | Light and dark |
|---|---|
| Rest | one line per skill: logo, name, three 6px rounded segments, level word in its colour |
| Scripts off | segments already at their level, no animation |
| Reduced motion | no stagger |
| 360 px | same one-line row, name ellipsized if needed, no page scroll |

## 6. Decisions

- **D-1 · A subgrid on the list.** *Discarded:* fixed name and label widths in `px` or `ch` —
  AGENTS: two translated labels differ in length in every language, so a fixed width is wrong
  somewhere.
- **D-2 · Rename the colour tokens by hue** (`--clr-advanced` → `--clr-green`,
  `--clr-intermediate` → `--clr-blue`, `--clr-beginner` → `--clr-amber`, plus `-text`; new
  `--clr-teal`). *Discarded:* pointing advanced at `--clr-intermediate` — a token named for one
  level worn by another, and the process steps alias these names too.
- **D-3 · The step tones keep their values** through the rename: `--step-2-tone` and
  `--step-3-tone` alias the hue names that hold today's values, checked by reading the computed
  tones before and after.
- **D-4 · Drop the hex fallbacks in `LEVEL_COLOR`.** *Discarded:* keeping them — AGENTS: a
  hardcoded colour as the only fallback is a bug, and every token is defined in both themes.

## 7. Test strategy

Runner from `package.json`: `npm test` (vitest) and `npm run test:e2e` (Playwright).

- **RF-4, data** (`tests/visual-language.test.ts`): each level's lit fill resolved per theme →
  hue in its band and ≥ 3:1 against the unlit segment (the existing fill guard, re-pointed, plus
  the band).
- **RF-5, data**: each level's label colour per theme against the card → ≥ 4.5:1 (replaces the
  badge guard).
- **RF-1 to RF-3 and RF-5's no-background half, rendered** (`e2e/skills.spec.ts`): at 1280 and
  360 px, per row: logo, name, track and label boxes overlap vertically and are ordered by x;
  per card, the tracks share left and width (±1px); segment count, lit count and position;
  segment radius ≥ height / 2; track border width 0; label background transparent; no page
  scroll at 360.
- **D-3:** the computed `--step-2-tone` / `--step-3-tone` per theme are equal before and after.
- **Injections:** (1) the row back to two lines (name over track) → RF-1 red; (2) a fixed name
  width on one row only → RF-2 red; (3) the 2px frame back → RF-3 red; (4) intermediate back to
  blue → RF-4 red; (5) the dark blue text back to `#7DA9F5` → RF-5 red; (6) the pill back →
  RF-5 rendered red.

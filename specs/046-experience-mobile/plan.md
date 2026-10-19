# Plan 046 — Experience on a phone, and its Spanish copy

**Spec:** `specs/046-experience-mobile/spec.md` (4 RF).
**Status:** approved
**Approved:** 2026-10-18 · owner approval · 142 lines

## 1. Scope and coverage

The card's header has two arrangements today (`src/components/ExperienceCard.astro`): below its
`@container card (min-width: 36rem)` it is `3rem 1fr` with areas `'period period' 'tile title'
'. location'`, from 36rem it is `'period period period' 'tile title location'`. Measured on the dev
server on 2026-10-18 (Chrome 155, the Playwright channel): the card is 256 px at 360, 286 at 390,
372.8 at 640, **520 at 800** and 873.6 at 1280, so the card is single-column at 800 too. At 800,
though, the period is not in the card: from 40rem `ExperienceSection.astro` moves it into its own
column, absolutely positioned, and the card's period row is empty. "The period's row" exists in
the card only below 40rem, which is why RF-1 now reads **below 40rem** (spec changed 2026-10-18,
from "while the card is a single column"). Applying it to the card's whole single-column range
would put the tile alone on an empty first row at 800, which the NFR forbids (block 6, D-1).

| Requirement | Covered by |
|---|---|
| RF-1 (tile on the period's row, title full width) | A `@media (width < 40rem)` block in `ExperienceSection.astro`, beside its existing 40rem rule, giving the header the areas `'tile period' 'title title' 'location location'`. Measured with that override: tile top 0, period 0–20.8 px, title left 0 and 214 / 244 px wide at 360 / 390. |
| RF-2 (one line at 390 and up) | Follows from RF-1: the title gets 244 px at 390 and the longest role is 226.7 px. No rule of its own; its own e2e check. |
| RF-3 (no lone last word, no lone suffix) | `text-wrap: balance` on `.exp-role` and `.exp-company` in `ExperienceCard.astro`. Measured at 360 es: "Desarrollador \| Full Stack" (greedy and `pretty` both give "Desarrollador Full \| Stack"). |
| RF-4 (accents) | The six words fixed in `src/data/experience.ts`; a unit test over every Spanish string of `EXPERIENCES`. |
| NFR both themes, no font shrinking | Only grid areas, one alignment and `text-wrap` change: no colour, no size. Checked visually in both themes (T-5). |
| NFR timeline at 800, desktop at 1280 | The rule is below 40rem only; an e2e check at 800 and 1280 that the tile still ends before the title on the title's row. The existing spec 027 (800, 1280) and spec 028 (1280, 800, 1024) tests stay green. |
| NFR radius, hover | Untouched: no `border-radius` or `:hover` rule changes. The spec 013 hover test stays green. |
| Edge: 360 role wraps | RF-3's check requires at least one wrapped heading at 360 es, so the guard is never vacuous. |
| Edge: "Ingeniero de Software", English roles fit at 360 | Measured one line each at 360 with the override. Covered by the RF-3 test reading them (no wrap = nothing to forbid). |
| Edge: "Plantas y Flores Ornamentales S.A." 1.5 px spare; "S. A." split | Both companies render one line at 360 and 390 with the override; if one wraps, `balance` was measured at 320 to give "Plantas y Flores \| Ornamentales S.A." and "SD Misiones de \| Costa Rica S. A.". RF-3's check forbids "S.A.", "S. A." and "A." as a last line. |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/components/ExperienceSection.astro` | modify | Below 40rem, where it leaves the period inside the card, it also puts the tile on the period's row and lets the title and location span the header. The breakpoint that decides where the period lives decides where the tile lives. |
| `src/components/ExperienceCard.astro` | modify | Decides how a wrapped role or company breaks: balanced lines, so the last line is never a lone short word. |
| `src/data/experience.ts` | modify | Restores the six accents. Nothing else: the "S. A." / "S.A." spelling stays (out of scope). The file becomes UTF-8 (it is ASCII today); CRLF kept. |
| `tests/experience.test.ts` | modify | RF-4 as data. |
| `e2e/experience-timeline.spec.ts` | modify | RF-1, RF-2, RF-3 and the 800/1280 NFR, rendered; the spec 028 test's 390 branch stops asserting the tile ends before the role, which spec 046 RF-1 replaces at that width. |

## 3. Pure logic

None in `src/`. Two helpers live in the tests, where they are used:

```ts
// tests/experience.test.ts
/** Every Spanish string of the experience data: role, period, location and bullets. */
spanishStrings(jobs: Experience[]): string[]

// e2e/experience-timeline.spec.ts, evaluated in the page
/** The words of an element's text grouped by line box, top to bottom. */
lineWords(el: Element): string[][]
```

No clock is read anywhere.

## 4. Algorithm

`lineWords(el)`: for each text node under `el`, for each `\S+` match, a `Range` over the word;
its first `getClientRects()` rect gives the word's `top`. Words whose `top` lies within 4 px of an
existing line join it, else open a new line. Return the lines in order. (Measured: this is how the
numbers in block 1 were read; per-word ranges keep a word split across lines impossible to miss,
since a word that is not broken has one rect.)

RF-3 verdict per heading: `lines = lineWords(el)`; if `lines.length < 2`, nothing to check;
else `last = lines.at(-1)`, red when `last.length < 2` or `last.join(' ')` is one of `S.A.`,
`S. A.`, `A.`. The explicit list is needed because "S. A." is two words by whitespace.

RF-4 verdict: join `spanishStrings(EXPERIENCES)`; red for each of the six unaccented words found
as a whole word (`(?<!\p{L})word(?!\p{L})`, `u` flag, so "indices" does not match inside
"índices"), and for each of the six accented words not found.

## 5. Interface

Below 40rem, both themes: first row the 3rem tile, then the period beside it, top-aligned with
the tile (`align-self: start` on the period, so it stays on the line the rail's dot is placed on:
`--dot-y` is the card padding plus 0.25rem); second row the role and company across the whole
header; third row the location, also full width, no longer indented under a 3rem gap that now
holds nothing. A role that wraps at 360 breaks as "Desarrollador / Full Stack". Colours, sizes,
radius, hover: unchanged. From 40rem: exactly today's layout.

Empty states: an entry without a `glyph` renders no tile, so below 40rem its period sits after an
empty 3rem column. Both entries carry a glyph today; accepted, not handled (no spec asks).

## 6. Decisions

- **D-1 · The condition is the section's 40rem breakpoint, written in `ExperienceSection.astro`.**
  The period leaves the card at 40rem, and RF-1 is about the period's row. *Discarded:* the card's
  own `@container card (width < 36rem)`, the literal single-column condition — the card is 520 px
  at 800, so it would move the tile onto an empty first row there and break the NFR. *Also
  discarded:* the same `@media (width < 40rem)` inside `ExperienceCard.astro`, a second copy of the
  section's breakpoint in another file, which drifts the day one of them changes. Specificity:
  `.exp-item :global(.exp-header)` compiles to three simple selectors against the card's two, so
  the section's rule wins without `!important`.
- **D-2 · `text-wrap: balance` on the role and the company, at every width.** Checked in the
  installed Chrome 155: `CSS.supports('text-wrap', 'balance')` and `'pretty'` are both true.
  Measured at 360 es: `balance` gives "Desarrollador | Full Stack"; `pretty` leaves
  "Desarrollador Full | Stack", as does no rule. It does nothing to a line that fits, so it needs no
  media query. *Discarded:* `text-wrap: pretty` (measured, does not fix the case the spec names);
  a non-breaking space inside "S. A." in the data, which edits a company name to fix a layout,
  touches only one of the two suffix spellings, and is not needed: with RF-1's width neither
  company wraps at 360 or 390, and `balance` keeps "S. A." whole at 320.
- **D-3 · The location spans the header below 40rem.** With the title at the header's left edge,
  an indented location would sit under nothing. *Discarded:* keeping `'. location'`, which aligns
  it with a tile that is no longer beside it.
- **D-4 · The period top-aligns with the tile.** *Discarded:* the grid's `align-items: center`,
  which would centre the period on the 48 px tile, 13.6 px down, off the rail's dot.
- **D-5 · The spec 028 tile check at 390 is replaced, not relaxed.** Its `tile.r <= role.l` at 390
  contradicts spec 046 RF-1 by design; the 1280 branch keeps it, and the new RF-1 test asserts the
  390 geometry instead.

## 7. Test strategy

Runners from `package.json`: `npm test` (`vitest --run tests`) and `npm run test:e2e`
(Playwright, installed Chrome, server on 4329). No new dependency.

- **Data (`tests/experience.test.ts`):** RF-4 as in block 4, plus a self-check that
  `spanishStrings` returns the role, period, location and every bullet of a two-entry fixture.
- **Rendered (`e2e/experience-timeline.spec.ts`, new `describe` "experience on a phone (spec
  046)"), after `settled()` and `document.fonts.ready`, light theme (geometry does not read
  colour):**
  - RF-1 at 360×844 and 390×844, `es`: per card, `tile.top` within `[period.top, period.bottom]`,
    `|title.left − header.left| ≤ 1`, and the dot's centre within the period's box. At 800 and
    1280: `tile.right ≤ title.left` and `tile.top < title.bottom` (the tile still beside the
    title — today's layout).
  - RF-2 at 390, both locales: `lineWords(.exp-role).length === 1` for every card.
  - RF-3 at 360 and 390, both locales: the verdict of block 4 on every `.exp-role` and
    `.exp-company`; and at least one wrapped heading measured across the run, so the check reads
    something.
  - The spec 028 test at 390 drops its tile-before-role assertion (D-5).
- **Injections**, each shown red, then reverted by explicit path:
  1. Remove the `grid-template-areas` override → RF-1 red at 360 and 390 (title left 61.6 px), and
     RF-2 red at 390 ("Desarrollador Full | Stack").
  2. Remove `align-self: start` from the period → RF-1's dot-on-period check red.
  3. Remove `text-wrap: balance` from `.exp-role` → RF-3 red at 360 es ("Stack" alone).
  4. Replace `@media (width < 40rem)` with `@container card (width < 36rem)` in the card →
     the 800 check red.
  5. Put "Diseno" back in the data → RF-4 red (unaccented word found); replace "Optimización" with
     "Mejora" → RF-4 red (accented word missing).
  6. Make `lineWords` return `[]` → the RF-3 "at least one wrapped heading" check red.

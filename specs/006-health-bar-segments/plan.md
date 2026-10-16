# Plan 006 — Skill bars as segmented health bars

Spec: `specs/006-health-bar-segments/spec.md` (10 RF, each with a check, no open
questions), approved 2026-10-15; RF-9 and RF-10 added and re-approved the same
day. RF-9 now reads "as many rows per line as fit", which the auto-fill below
already did. The `--radius-pill` amendment the spec puts
first is already committed (`9d725d9`).

Runner: `npm test` (`vitest --run tests`, read from `package.json`). Build:
`npm run build`. Rendered verification against a running dev server at 1280px
and 390px, light and dark, both locales, reduced motion emulated, and the
server HTML read with scripts off.

## 1. Scope and coverage

- RF-1 (one segment per level in the scale) → T-2 (data: the scale and
  `segmentsFor`), T-1 (guard, red first), T-4 (row renders from it).
- RF-2 (leftmost segments lit, as many as the level's step) → same tasks as
  RF-1: `segmentsFor` returns the lit flags, the row renders them.
- RF-3 (lit vs unlit at 3:1, both themes) → T-3 points spec 005's fill guard at
  the unlit segment colour; T-4 keeps the colours, so it stays green.
- RF-4 (frame in `--icon-mono` at 3:1 on the card) → T-3 (guard), T-4 (frame).
- RF-5 (2px border, extra-small radius, 2px padding and gap, derived segment
  radius, no pill on the bar) → T-3 (structural guard), T-4 (styles).
- RF-6 (lit segments light 120ms each, 120ms apart; unlit never animate) →
  T-3 (structural guard), T-4 (styles), T-5 (the script's hook moves from the
  fill to the track).
- RF-7 (reduced motion: no animation) → T-3, T-4.
- RF-8 (scripts off: lit state still shown) → T-3 (guard), T-4, and the manual
  server-HTML check in T-10.
- RF-9 (two rows per line where a card fits two rows of the derived minimum;
  a single-skill area at half width) → T-6 (guard, red first), T-7 (the row
  list's grid in `TechGrid`).
- RF-10 (as many area cards per line as fit, card minimum = row minimum +
  card padding + border) → T-8 (guard, red first), T-9 (the area grid in
  `TechGrid`).
- NFRs → T-10 walks them and writes the spec 005 Decision log entry; the stale
  token comment goes with the component (T-4).

Not covered on purpose (spec Out of scope): the compact view — `SkillChip`
keeps reading `LEVEL_COLOR` and nothing else from this change — the level
colours, the badge, the toggle's behaviour, options B and C, red.

## 2. Files

- `src/data/levelLabels.ts` — gains `LEVEL_SCALE`, the ordered list the spec
  calls the level scale, and derives `TechLevel` from it so the type and the
  order cannot drift; gains `levelStep` and `segmentsFor`; loses `LEVEL_FILL`.
  Responsibility: the one place that says what order the levels are in and
  what a level lights. `LEVEL_FILL` leaves with the component that reads it
  (T-4), so the build never breaks between tasks.
- `src/components/SkillBar.astro` — the bar becomes a frame holding one
  `.bar-seg` per entry of `segmentsFor(level)`, each carrying its index as
  `--i` and a `lit` class when lit; `.bar-fill` and its width animation go.
  Responsibility: draw the level as lit blocks and nothing else in the row
  moves.
- `src/components/TechGrid.astro` — its script replays the entrance by
  toggling `.animated` on `.bar-track` instead of `.bar-fill`. Responsibility:
  unchanged; only the element it replays.
- `public/styles/00-tokens.css` — the `--radius-pill` comment stops saying
  "only the view-toggle group" and names its real uses. No value changes.
- `specs/005-skills-bars/spec.md` — a Decision log entry: RF-2 is replaced by
  spec 006's RF-3. Nothing else in that spec moves.
- `tests/visual-language.test.ts` — the fill guard measures lit against the
  unlit segment; a new frame-versus-card contrast guard; `SKILL_LEVELS` (a
  literal list today) is replaced by `LEVEL_SCALE` imported from the data.
- `tests/markup.test.ts` — the structural guards for RF-5 to RF-8, beside the
  existing bars-view guards and with the same comment-stripped source reading.
- `src/components/TechGrid.astro`, RF-9 — `.bars-list` becomes a grid whose
  columns are an auto-fill of the minimum row width, capped at the card.
  Responsibility: how many rows share a line; the row itself is untouched.
- `tests/markup.test.ts`, RF-9 — a guard that reads both components and checks
  the minimum is the sum of the row's own values.
- `src/components/TechGrid.astro`, RF-10 — `.bars-grid` columns become an
  auto-fit of the derived card minimum. Responsibility: how many area cards
  share a line.
- `tests/markup.test.ts`, RF-10 — a guard that reads `TechGrid.astro`,
  `SkillBar.astro` and `public/styles/03-components.css` and checks the card
  minimum is the row minimum plus the card's padding and border.
- `tests/i18n.test.ts` — untouched; its RF-6 default-level guard still reads
  `tech.level ?? 'beginner'` in `TechGrid`.

## 3. Pure logic

In `src/data/levelLabels.ts`, no clock, no DOM:

- `LEVEL_SCALE: readonly ['beginner', 'intermediate', 'advanced']` — `as const`;
  `TechLevel = (typeof LEVEL_SCALE)[number]`.
- `levelStep(level: TechLevel): number` — `LEVEL_SCALE.indexOf(level) + 1`.
  Beginner 1, intermediate 2, advanced 3.
- `segmentsFor(level: TechLevel): boolean[]` — one entry per level in the
  scale, `true` for the first `levelStep(level)`. Advanced
  `[true, true, true]`, beginner `[true, false, false]`.

These make RF-1 and RF-2 data checks (constitution 8): the guard calls
`segmentsFor` for every level of the imported scale and asserts length and lit
flags, and only a thin source check is needed to prove the row renders from it.

## 4. Algorithm

Row markup, per spec 006:

```
<div class='bar-track' aria-hidden='true'
     style={`--clr:${color};--segments:${LEVEL_SCALE.length}`}>
  {segmentsFor(level).map((lit, i) =>
     <span class:list={['bar-seg', { lit }]} style={`--i:${i}`}></span>)}
</div>
```

Styles:

```
.bar-track {
	--bar-pad: 2px;                                   /* padding and gap, one value */
	display: grid;
	grid-template-columns: repeat(var(--segments), 1fr);
	gap: var(--bar-pad);
	padding: var(--bar-pad);
	border: 2px solid var(--icon-mono);
	border-radius: var(--radius-xs);
}
.bar-seg {
	height: 8px;                                      /* today's track height */
	background: var(--neutral-200);                   /* unlit = spec 005's track */
	border-radius: calc(var(--radius-xs) - var(--bar-pad));
}
.bar-seg.lit { background: var(--clr); }              /* content, not animation (RF-8) */

.bar-track.animated .bar-seg.lit {
	animation: seg-light 120ms var(--ease) calc(var(--i) * 120ms) both;
}
@keyframes seg-light {
	from { background: var(--neutral-200); }
	to   { background: var(--clr); }
}
@media (prefers-reduced-motion: reduce) {
	.bar-track.animated .bar-seg.lit { animation: none; }
}
```

- `both` holds the unlit colour through each segment's delay, so a lit segment
  starts unlit and ends lit, as RF-6 says; unlit segments match no animation
  rule at all.
- The lit colour lives on `.bar-seg.lit`, outside `.animated`: with scripts off
  the class is never added and every lit segment is already lit (RF-8).
- `--clr` is the level colour spec 005 already binds; the unlit colour is the
  token spec 005's track used, so the measured pair of RF-3 is the same two
  tokens and stays 4.13–5.44:1 light, 3.72:1 dark.
- The frame's colour is `--icon-mono`, measured 6.19:1 light and 4.78:1 dark on
  the card in spec 005 — RF-4 is met by the token, the guard proves it.

Guard procedures (all over `SkillBar.astro` with comments stripped, the same
reading `tests/markup.test.ts` already does):

1. RF-1/RF-2 (data): for each `level` of `LEVEL_SCALE`, `segmentsFor(level)`
   has `LEVEL_SCALE.length` entries, the first `levelStep(level)` are `true`
   and the rest `false`; `LEVEL_FILL` is not exported. Source: the row maps
   `segmentsFor(level)`, never a literal count.
2. RF-3: the fill guard reads the unlit colour from the `.bar-seg` rule's
   background instead of `.bar-track`, and iterates `LEVEL_SCALE`.
3. RF-4: read the `.bar-track` border colour, resolve per theme, measure
   against `--card-background`, assert ≥ 3.
4. RF-5: `.bar-track` has a 2px border, padding and gap equal to one custom
   property set to 2px, radius `var(--radius-xs)`; `.bar-seg` radius is
   `calc(var(--radius-xs) - var(--bar-pad))`; no rule whose selector contains
   `bar-track` or `bar-seg` reads `--radius-pill`.
5. RF-6: the only animated rule is `.bar-track.animated .bar-seg.lit`, with a
   120ms duration and a delay of `calc(var(--i) * 120ms)`; `--i` is mounted
   from the map index; no rule animates a segment without `.lit`.
6. RF-7: a `prefers-reduced-motion: reduce` block sets that selector's
   animation to `none`.
7. RF-8: the rule that paints `var(--clr)` on a segment has no `.animated` in
   its selector.

### RF-9, the row list (added with the 2026-10-15 change)

```
.bars-list {
	display: grid;
	grid-template-columns: repeat(
		auto-fill,
		minmax(min(calc(22px + 0.6rem + 60px + 0.6rem + 7rem), 100%), 1fr)
	);
	gap: var(--sp-2) var(--sp-4);
}
```

- The minimum is the row's own geometry from `SkillBar.astro`: the 22px icon
  column, the 0.6rem gap twice, the 60px track floor and the badge's 7rem
  maximum — 213.2px at a 16px root. Written as that sum so the relationship is
  visible; the guard below keeps the terms equal to the row's.
- `auto-fill` keeps an empty column in place, so a single-skill area's row
  stays at half the card (owner decision); `auto-fit` would stretch it.
- `min(…, 100%)` lets a card narrower than one row still show one full-width
  row instead of overflowing.
- Two rows fit when the card's content box is at least 2 × 213.2 + 16 =
  442.4px: 457px at 1280px and 609px at 800px fit, 278px at 390px does not.

RF-9 guard procedure (`tests/markup.test.ts`, comment-stripped sources):

1. Read `SkillBar.astro`'s `.bar-row` columns (first track and the
   `minmax` floor), its `gap`, and `.level-tag`'s `max-width`.
2. Read `TechGrid.astro`'s `.bars-list`: it is a grid whose columns are
   `repeat(auto-fill, minmax(min(calc(…), 100%), 1fr))`.
3. The `calc` terms, as a multiset, equal icon, gap, floor, gap and badge
   maximum from step 1. A typed total, or a term that disagrees with the row,
   is red.

### RF-10, the area grid (added with the second 2026-10-15 change)

```
.bars-grid {
	display: grid;
	grid-template-columns: repeat(
		auto-fit,
		minmax(min(calc(22px + 0.6rem + 60px + 0.6rem + 7rem + 1.25rem + 1.25rem + 1px + 1px), 100%), 1fr)
	);
	gap: var(--sp-3) var(--sp-6);                     /* unchanged */
}
```

- The minimum is RF-9's row minimum (213.2px) plus `.card-frame`'s padding
  (1.25rem twice) and border (1px twice, from `03-components.css`): 255.2px.
  Written as that sum; the guard keeps the terms equal to their sources.
- Section content is 1017.6px at 1280px (the sheet caps at `--max-w`, so no
  wider), 815px at 1024px, 649px at 800px, 318px at 390px. With the 24px
  column gap: 3 cards fit at 1280px and 1024px (3 × 255.2 + 48 = 813.6), 2 at
  800px, 1 at 390px — the prototype measured exactly that.
- `auto-fit`, as today: the first line uses every column, so the last line's
  cards keep the column width. With five areas and at most three columns there
  is always a full first line. The RF-9 list inside keeps `auto-fill`.

RF-10 guard procedure (`tests/markup.test.ts`, comment-stripped sources):

1. Read RF-9's four row values from `SkillBar.astro` (as the RF-9 guard does)
   and `.card-frame`'s `padding` and border width from `03-components.css`.
2. Read `TechGrid.astro`'s `.bars-grid`: columns are
   `repeat(auto-fit, minmax(min(calc(…), 100%), 1fr))`.
3. The `calc` terms, as a multiset, equal icon, gap, floor, gap, badge maximum,
   padding twice and border twice. A typed total or a disagreeing term is red.

## 5. Interface

Bars view, both themes, both locales, 1280px and 390px:

- Each row: 22px icon | name over a framed bar of three 8px-high segments |
  level badge, unchanged. The bar is 16px tall now (8 + 2×2 padding + 2×2
  border), 8px more than the old track, so each row grows by 8px.
- Frame in the icon's monochrome colour; lit segments in the level colour,
  unlit in the soft track colour; square corners inside a 2px-radius frame.
- Entrance: a beginner row lights one block at 0ms; an advanced row lights
  three, at 0, 120 and 240ms, done at 360ms. Unlit blocks never move.
- Reduced motion: lit blocks already lit, nothing moves.
- Scripts off: lit blocks already lit; no toggle, so no replay.
- Hover: the icon recolours as in spec 005; frame and segments do not change.
- Level-less entry: beginner, one block lit.
- Empty-data and single-area states: unchanged.
- Area cards: three per line at 1280px and 1024px, two at 800px, one at 390px.
  Inside each card, rows as many as fit: one per line at every measured width,
  because the cards are narrow; a lone row keeps half a card only when the
  card fits two. Bars measure 157–170px at 1280px, 102–115px at 1024px,
  146–159px at 800px. Section height: 366px at 1280px and 1024px, 556px at
  800px, 934px at 390px (the prototype's measurements).
- Visual-work rule: the row, the list and the area grid are shown in both
  themes and approved together before the re-validation task.

## 6. Decisions

- One element per segment, not a striped background. A
  `repeating-linear-gradient` draws the blocks with one element but cannot
  light them one at a time, and the lit count would become a percentage again.
  Discarded alternative: the gradient. Cost: three spans per row, thirty on the
  page.
- `segmentsFor` in the data module, not inline in the component. It makes
  RF-1/RF-2 a data check rather than a source grep (constitution 8). Discarded
  alternative: `Array.from({ length: 3 })` in the markup, which would also
  retype the scale's length.
- `TechLevel` derived from `LEVEL_SCALE`. Today the type and any ordering are
  two declarations; deriving one from the other is what stops a fourth level
  from being half-added. Discarded alternative: keep the union and add the
  array beside it.
- Animate `background` with a keyframe, not `opacity` of a lit layer. Opacity
  would need a second layer per segment; the keyframe goes from the exact
  unlit token to the exact lit one, so every frame is one of two measured
  colours at its ends. Discarded alternative: an overlay at `opacity: 0 → 1`.
- `--bar-pad` as a local custom property for padding and gap. The spec ties
  the segment radius to the frame's padding; naming it once makes that
  relationship literal in the `calc()` instead of a second `2px`. It is local
  to the bar, not a token, because nothing else shares it. Discarded
  alternative: two `2px` literals and a radius of `0`.
- Segments stay 8px high. Keeps the old track's visual weight per block and
  puts the growth in the frame, where the health-bar look comes from.
  Discarded alternative: 4px segments to keep the bar at 8px total, which
  turns the blocks into lines at 44px wide.
- The script keeps its timing and only changes its target. When the entrance
  happens is out of scope. Discarded alternative: an `IntersectionObserver`,
  which would change when, not what.

- RF-9: the minimum written as a `calc()` of the row's own values, checked
  against them by a guard, rather than shared custom properties defined on the
  list and read by the row. Shared properties would make the row depend on its
  parent for its own geometry and move the 22px the RF-7 guard pins into a
  variable. Discarded alternative: the shared properties. Cost: the five values
  appear twice, and the guard is what keeps them equal.
- RF-9: `auto-fill`, not `auto-fit` — the owner chose half width for a lone
  row.
- RF-10: the card minimum derived from one row, not two. Two rows (482.4px)
  would keep two skills per line but fit no more than two cards even at
  1280px, the widest the sheet gets — no change at all. Discarded alternative:
  the two-row minimum. Cost, accepted by the owner: one skill per line inside
  the cards at every measured width.

## 7. Test strategy

On `npm test`; no new dependency, no browser in the suite.

- Data checks (constitution 8): `segmentsFor`/`levelStep` over the imported
  scale (RF-1, RF-2); contrast over theme tokens (RF-3, RF-4). Source reads,
  for the reason the spec gives: RF-5 to RF-8 and the "row renders from
  `segmentsFor`" half of RF-1/RF-2.
- Probes, each reverted by explicit path with a byte-identical restore:
  `segmentsFor` returning one entry too few (RF-1); one segment too many lit
  (RF-2); the unlit colour set to the lit token (RF-3); the frame colour set to
  `--neutral-200` (RF-4); the pill back on the track (RF-5); a literal `240ms`
  delay (RF-6); the reduced-motion block deleted (RF-7); the lit colour moved
  under `.animated` (RF-8); the `calc` replaced by a typed `214px`, one term
  changed to disagree with the row, `auto-fill` swapped for `auto-fit` (RF-9); the card
  minimum typed as `256px`, the card padding term changed so it disagrees with
  `.card-frame` (RF-10).
- Rendered record: computed widths, radii and colours per segment at both
  widths and themes; computed `animation-delay`/`animation-duration` of an
  advanced row; reduced motion emulated; the home HTML fetched without scripts
  and its lit segments counted per row; spec 005's RF-1, RF-3 to RF-8
  re-measured, every NFR and edge case answered one by one.
- Regression: `tests/tokens.test.ts` on every styling change — `--bar-pad`,
  `--segments` and `--i` must count as defined.

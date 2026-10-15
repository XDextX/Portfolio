# Plan 005 — Skills bars redesign

Spec: `specs/005-skills-bars/spec.md` (7 RF, each with a check, no open
questions), **approved** — the status line reads `approved`. RF-5 was replaced
by the owner on 2026-10-11 after the implementer showed the approved wording
unsatisfiable; the spec's own Decision log carries the interval and the two
measured luminances. This plan covers the replacement: monochrome by default,
brand colour on the row's hover. T-1 through T-5 and T-7 do not touch RF-5
and none of their checks change.

**Change of 2026-10-15 (spec re-approved, 8 RF).** The mask made four icons
unreadable, so RF-5's hover now paints the *same* single-colour asset in one
brand colour from the data, and RF-8 requires every icon to be such an asset.
The sections below mark what this changes; T-9 to T-13 implement it. Where the
2026-10-11 text and the change disagree, the change wins: the brand `<img>` and
its opacity swap are retired.

Runner: `npm test` (`vitest --run tests`, read from `package.json`).
Build: `npm run build`. Rendered verification against a running dev
server (`astro dev`), at viewport widths 1280px and 390px, in light and
in dark — a green suite never settles what the eye sees.

## 1. Scope and coverage

- RF-1 (confirmed row geometry, three columns kept at 390px) → Task T-3
  (row rebuild) and the T-8 measurement record that proves the columns fit.
- RF-2 (per-level fill vs track at 3:1 or above, both themes) → Task T-1
  (contrast guard, red first) then T-4 (theme fill/track values).
- RF-3 (level label on its own badge at 4.5:1 or above, both themes) →
  Task T-1 (guard, red first) then T-5 (badge surface and label colours).
- RF-4 (one bordered area card per data category, headings via `t()`) →
  Task T-2 (cards, heading keys, count guard).
- RF-5 (every bars-view icon monochrome in one colour per theme at 3:1 or
  above against the area card; brand colours while the pointer is over the
  row) → Task T-6 (monochrome default mount, hover binding, contrast guard,
  structural guard).
- RF-6 (level-less entry renders the existing default with the row shape)
  → Task T-7 (data check plus record; no data change).
- RF-7 (broken icon keeps the 22px slot, the name, the bar and the level;
  nothing is painted behind it) → Task T-6 (markup guard) and the T-8
  injected-URL record; the guard is rewritten for the `<img>`-less row in T-11.
- RF-5, hover clause as changed 2026-10-15 (same asset, one brand colour read
  from the row's data entry) → T-11 (guards rewritten, red first) and T-12
  (row and grid).
- RF-8 (every icon a single-colour asset; brand colour as one 6-digit hex;
  the notice names every icon's source) → T-9 (guard, red first) and T-10
  (data, assets already in `public/tech/mono/`, notice).
- The NFRs and Edge cases, which the 2026-10-15 validation showed a record of
  RFs alone does not cover → T-13 walks them one by one.

Out of RF-5, deliberately: the contrast of the brand colours on hover. The
spec's Edge cases record it as an accepted cost (nine of ten dark rows fall
below 3:1 on hover), so no guard measures it and the plan invents no number
for it. The hover half of RF-5 is settled structurally.

Not covered on purpose (spec Out of scope): the compact/chips view, the
view toggle (persistence, default, animation), level values and fills as
data, the area set. Phase 2 owns the compact view. Note the compact view
renders the same logos through `SkillChip.astro` and is untouched by T-6:
only the bars-view row changes. After the change it still reads each entry's
`logo` (the colour files in `public/tech/`); only the bars view reads the new
`icon`, so nothing the visitor sees in the compact view moves.

## 2. Files

- `tests/visual-language.test.ts` — owns three contrast guards (RF-2, RF-3,
  RF-5). Responsibility: reproduce the WCAG contrast function over theme
  token values, exactly as the existing accent-surface check does, and fail
  on any level/theme pair, or the monochrome icon against the card, below
  threshold. The helpers (`luminance`, `contrast`, `themeValue`,
  `resolveColour`, `ruleBackground`) are reused, not duplicated; the RF-5
  guard reads the colour the component actually binds, so renaming the
  token moves the guard with it.
- `tests/markup.test.ts` — owns the RF-5 structural guard and the RF-7
  structural guard. Responsibility: assert the monochrome default mount, the
  hover-only binding of the brand presentation, that no hover rule paints or
  lifts the row, and that the reserved 22px slot and the decorative-empty-alt
  pattern survive refactors. This file
  already reads component source with comments stripped; the runner opens
  no browser and Astro's container API is not a dependency, so a source read
  is the only rendered-output check available here (constitution 8 asks for
  the reason, and this is it).
- `tests/i18n.test.ts` — settles the new area-heading keys (RF-4) and the
  default-level label resolution (RF-6). Responsibility: every key the bars
  view reads resolves in both locales.
- Locale files (`es`/`en`) — gain one heading key per data category
  (RF-4). Responsibility: the only place an area name is spelled for
  visitors; the data value stays a lookup key.
- Theme stylesheets plus the shared token layer — gain or adjust:
  per-level fill colours that clear 3:1 against the track in both themes
  (RF-2), the opaque level-badge surface with label colours clearing 4.5:1
  (RF-3), and one monochrome-icon colour per theme clearing 3:1 against
  `--card-background` (RF-5). Responsibility: every colour pair the guards
  measure. New tokens are defined in both theme files or in the shared
  layer, never in one theme; aliases use `var()`, never a second literal
  (token tests enforce this). The monochrome icon colour is a *new* name
  aliased to a token both themes already redefine — one alias, two
  resolved values, so the guard reads one name and gets one colour per
  theme.
- Bars-view row component — rebuilt to the confirmed geometry (RF-1,
  RF-5 icon presentation, RF-3 badge, RF-7 slot). Responsibility: one row
  reads as icon / (name over track) / level at every width, and the icon
  paints monochrome by default.
- Grid/section components — turn each category group into a bordered card
  sharing the other cards' padding, headings resolved via `t()` (RF-4).
  Responsibility: areas are told apart; nothing else on the page moves.
- Compact-view components and the toggle — untouched. Responsibility:
  none; phase 2.

Added by the 2026-10-15 change:

- `src/data/tech.ts` — each entry gains `icon` (root-absolute path to its
  single-colour asset) and an optional `brand` (one `#RRGGBB`), beside the
  `logo` the compact view keeps reading. Responsibility: the one place a
  tech's icon and brand colour are stated; SSE carries no `brand`.
- `public/tech/mono/` — the nine Devicon `plain` assets, Tabler `broadcast`,
  the two MIT licence files (already downloaded and inspected), and a new
  `NOTICE.md`. Responsibility: the icons the bars view draws, and the one
  file that says where each came from and under which licence.
- `tests/visual-language.test.ts` — gains the RF-8 guard beside the existing
  `luminance`/`contrast` helpers, which it reuses; and its RF-5 contrast guard
  follows `currentColor` to the wrapper's `color` (below), widening what it
  reads rather than what it accepts.
- `tests/markup.test.ts` — the RF-5 structural guard and the RF-7 guard are
  rewritten for a row with no `<img>`.
- `src/components/SkillBar.astro` — takes `icon` and `brand` instead of
  `logo`; drops the `<img>`. Responsibility: monochrome at rest, the row's own
  brand colour on hover, nothing else.
- `src/components/TechGrid.astro` — passes `icon` and `brand` to the bars
  view. The compact view's call is untouched.

## 3. Pure logic

Contrast helpers live in the tests, beside the existing accent-surface
math, and take every input as a parameter — no clock, no network, no DOM:

- `luminance(hex: string): number` — existing helper, reused, not
  duplicated. WCAG transfer function, with the reference anchors 21.0000
  (black on white), 1.0000 (white on white), 4.5422 (`#767676` on white).
- `contrast(a: string, b: string): number` — existing helper, reused.
  Returns `(hi + 0.05) / (lo + 0.05)`.
- `themeValue(themeSrc: string, token: string): string` — resolves one
  level of `var()` aliasing inside a theme file and returns the literal,
  throwing on an unresolvable alias. Signature:
  `(themeSrc: string, token: string) => string`.
- Area-key mapping `(category: string) => key` — lowercases the data value
  into the locale key suffix (e.g. `Frontend` → `skills.areas.frontend`).
  Pure string transform, tested through `i18n.test.ts` resolution rather
  than its source text.
- `svgPaints(svg: string): string[]` (RF-8, in the test) — every distinct
  value of `fill`/`stroke`, as attribute or inside `style`, lower-cased,
  `none` dropped; a file with no paint at all draws in the default black and
  returns `[]`. Pure: takes the file text, reads no disk.

## 4. Algorithm

Guard procedure (RF-2, RF-3), per theme file, per level:

1. Read the fill (RF-2) or label colour (RF-3) token the component uses.
2. Follow one `var()` alias into the theme file; an alias that resolves
   nowhere is a failure, not a skip.
3. Read the counterpart surface token (track for RF-2, badge for RF-3).
4. Compute `contrast` and assert `>= 3.0` (RF-2) or `>= 4.5` (RF-3).
5. Non-hex values (e.g. `rgb()`) are resolved to hex before measuring; a
   value that cannot be resolved fails the guard.

RF-1 fit procedure at 390px (done in the browser, recorded in T-8):

1. Set viewport to 390px, read the card's content-box width.
2. Assert `22 (icon) + 60 (track floor) + level strtolower + 2 × 9.6
   (0.6rem gaps) + card padding ≤ content width`, with the track actually
   rendered at or above 60px and the level at most 2 lines.
3. If the inequality fails, the level column's max width shrinks — never
   the icon, never the floor, never the gaps.

RF-5 mount, in the row component (the mechanism is CSS, not a new asset).
The first version of this section — `background-color` + `mask` on the element
carrying the `<img>`, restored on hover by dropping the mask — is **superseded
as impossible**; §6 records why:

```
/* The wrapper holds the 22px slot, not the <img> arriving. */
.bar-logo { position: relative; width: 22px; height: 22px; }

/* Default: the logo's own shape, painted in one colour per theme. */
.bar-logo::before {
	content: '';
	position: absolute;
	inset: 0;
	background-color: var(--icon-mono);            /* one colour, both themes  */
	mask: var(--logo) center / contain no-repeat;   /* --logo: url(logo), set inline */
	-webkit-mask: var(--logo) center / contain no-repeat;
}

/* The brand <img> is there and not painted. */
.bar-logo img { display: block; opacity: 0; }

/* Hover: the monochrome layer goes out, the brand pixels come in. Nothing else
   changes — the owner dropped the gold border on 2026-10-11. */
.bar-row:hover .bar-logo::before { opacity: 0; }
.bar-row:hover .bar-logo img     { opacity: 1; }
```

Measured in the running dev server on 2026-10-11, before and after the change:

- **The mask on the `<img>` itself does not work, and nothing says so.** With
  `background-color: #ff00ff` and the mask active on the element carrying the
  image, all ten logos render 100% in their brand colours and zero magenta: a
  replaced element paints its content *after* its background. The monochrome
  layer sits under the pixels it was meant to remove, and the console is quiet.
- The same `mask` on a box with no content — the pseudo — paints a perfect
  monochrome over the very same assets, including the multicolour ones
  (`angular.svg` carries two gradients, `dotnet.svg` a purple disc with white
  glyphs, `astro-icon-dark.svg` a red-magenta gradient and white marks), since
  a mask uses the asset's alpha.
- The pseudo is absolutely positioned with `inset: 0` so it fills the wrapper's
  22px box instead of taking a line of its own in the grid cell.
- `mask-image` with an unresolvable URL paints nothing at all, which is why
  RF-7 needs no special case: a broken logo leaves the reserved 22px slot and
  paints no plate — and the `<img>` behind it is at `opacity: 0` whatever it
  resolves to.

Three constraints the implementer must respect:

- `mask` is a shorthand that resets `mask-mode`, so a per-theme
  `mask-mode` must be written *after* it or it is silently dropped.
- `--webkit-mask` is written alongside `mask`; Safari < 15.4 needs it and
  nothing in the build adds prefixes.
- **The hover rule paints nothing.** No `border`, no `background`, no
  `outline`, no `transform`: the owner dropped the gold border on 2026-10-11,
  so the two existing guards in `tests/visual-language.test.ts` ("no hover rule
  sets a background and nothing else", "no hover lifts an element") are a state
  to preserve rather than a constraint to satisfy — `opacity` is not a
  background and nothing translates. `tests/markup.test.ts` asserts it
  directly: every `:hover` rule in the component is scanned for a
  border/background/outline and for a transform. Do not relax or allowlist any
  of the three: the fix is in the hover rule, not in the tests.

RF-5 contrast guard procedure, per theme file:

1. Read the colour the at-rest layer binds (`ruleBackground` over
   `SkillBar.astro`, keyed on `.bar-logo::before` — the shipped guard reads it
   from the rule, so renaming the token moves the guard with it).
2. Resolve it through the theme file then the shared layer.
3. Read `--card-background` from the same theme and resolve it.
4. Compute `contrast` and assert `>= 3.0`.
5. One colour per theme means one assertion per theme covers every icon;
   no logo file is opened and no icon is enumerated.

RF-5 structural guard procedure, over `SkillBar.astro` with comments
stripped (same convention as the rest of `tests/markup.test.ts`):

1. The at-rest layer is the `.bar-logo::before` rule: it paints a
   `background-color`, is clipped by a `mask` bound to the row's own logo, and
   does not drop that mask — the monochrome mount.
2. The brand `<img>` is not painted at rest (an `opacity: 0` or
   `visibility: hidden` on a non-hover rule) and is revealed only from a
   `:hover` selector scoped to `.bar-row`, where the pseudo goes to
   `opacity: 0` at the same time. No `:focus`, no `:focus-visible`, no
   `tabindex`, no `<script>`: a second path to the brand state is as much an
   offender as a focus style is.
3. No `:hover` rule in the component sets a border, background or outline, and
   none transforms: the gold border was dropped on 2026-10-11, so a hover that
   paints the row is now a failure, not the house rule. The new guard does not
   replace or relax the two existing hover guards in
   `tests/visual-language.test.ts`; all three run.
4. If the colour change is animated, an animation/transition on the icon
   is paired with a `prefers-reduced-motion: reduce` override.

RF-7 guard procedure: the `<img>` carries `alt=''` and explicit
`width`/`height` of 22, and the wrapper declares its own 22px box — that box
is what holds the slot, not the logo arriving — with no surface painted on it.
The guard asserts the decorative-empty-alt pattern and the reserved slot, and
the browser record shows the injected broken URL leaving name, bar and level
untouched.

### Mount after the 2026-10-15 change (supersedes the RF-5 mount above)

```
<span class='bar-logo' aria-hidden='true'
      style={`--logo: url("${icon}")` + (brand ? `; --brand: ${brand}` : '')} />

.bar-logo { position: relative; width: 22px; height: 22px; color: var(--icon-mono); }
.bar-logo::before {
	content: ''; position: absolute; inset: 0;
	background-color: currentColor;                 /* the wrapper's colour */
	mask: var(--logo) center / contain no-repeat;
	-webkit-mask: var(--logo) center / contain no-repeat;
}
@media (hover: hover) {
	.bar-row:hover .bar-logo { color: var(--brand, var(--icon-mono)); }
}
```

- One asset, one element, no `<img>`: the shape comes from the asset's alpha
  and the colour from `color`, so hover changes one property on one element.
- No `brand` (SSE): `--brand` is never set, the fallback is the at-rest token,
  and the hover changes nothing — the spec's edge case. The fallback is a
  token, not a hex, so it follows the theme.
- The hover sets `color`, not a background. That is what keeps the existing
  guard "no hover rule sets a background and nothing else" green without
  touching it; a hover writing `background-color` on the pseudo would be red
  there, and correctly so by the letter of the house rule.
- `--logo` and `--brand` are set inline, which `tests/tokens.test.ts` already
  counts as defined (it collects `--x:` from component source).
- A broken `icon` URL: the mask resolves to nothing and paints nothing, the
  wrapper keeps its 22px box (measured 2026-10-11 for the same mask).

RF-8 guard procedure, over `TECH` imported from `src/data/tech.ts` (a data
check; entries come from the data, never from a list in the test):

1. `icon` is root-absolute and the file exists under `public/`.
2. The file contains no `gradient` (linear or radial).
3. `svgPaints(file)` has at most one entry; any entry that is a hex has
   `luminance` ≤ 0.85. `currentColor` counts as the one paint.
4. `brand`, when present, matches `^#[0-9a-fA-F]{6}$`.
5. `public/tech/mono/NOTICE.md` names the file of every `icon`, and every
   licence file it cites exists.

RF-5 guards after the change:

- Contrast (visual-language): read the pseudo's `background-color`; if it is
  `currentColor`, read the `color` of the at-rest `.bar-logo` rule instead,
  then resolve and measure against `--card-background` as before. A pseudo
  that binds a literal or a second token is still measured as written.
- Structural (markup): at rest, the pseudo paints `currentColor` through a
  mask bound to `var(--logo)`, and nothing at rest reads `--brand`; the only
  rule that reads `--brand` is a `.bar-row:hover` rule inside
  `@media (hover: hover)` that sets `color` on the row's own `.bar-logo`;
  `--logo` and `--brand` are mounted inline from the row's own `icon` and
  `brand` props. Kept as they are: no `:focus`, no `tabindex`, no `<script>`,
  no hover that paints a border/background/outline or lifts, the hover gate.
- RF-7 (markup): the row renders no `<img>`; the slot element is
  `aria-hidden`, declares 22px by 22px, and paints no surface of its own.

## 5. Interface

Bars view, both themes, both locales, 1280px and 390px viewports:

- Each area is a bordered card with the shared card padding and a heading
  in `--fs-base`/600/`--text-secondary` (today's category voice, kept).
- Each row: 22px icon, monochrome in one colour per theme, painted
  directly on the card with no plate behind it | name (single line,
  ellipsis) stacked over the 8px pill track | level badge (at most 2
  lines, ellipsis, never a fixed pixel width).
- Row hovered: the icon's colour changes and **nothing else does**. The row's
  border stays the card's border — the gold border was dropped on 2026-10-11 —
  and no background, outline or lift appears. The level, name, track and card
  are untouched, and no other row changes.
- Pointer that does not hover (touch, stylus without hover): the icon
  stays monochrome and never flashes the brand colours, because the
  switch is CSS `:hover` only.
- Keyboard: nothing changes. The row is not focusable and the brand
  colour is not reachable — the icon is decorative and the name beside it
  already says which tech it is.
- `prefers-reduced-motion: reduce`: the icon does not animate at all.
- Level-less entry: identical shape, default-level badge (documents, not
  changes, the default).
- Broken icon: the reserved 22px box stays, nothing is painted behind it (the
  mask on the pseudo fails closed and the `<img>` behind it is at `opacity: 0`
  whatever it resolves to), and the name, bar and level are unchanged.
- Empty-data and single-area states: unchanged from today (no data change
  in this spec); a category with no items renders its card with an empty
  list, exactly as the group does now.
- Visual-work rule applies per task: one component shown in both themes,
  approval before the next, one component per commit.

After the 2026-10-15 change:

- At rest, every icon is its single-colour shape in `--icon-mono`, and the
  four rows that were blobs show their lettering: TypeScript's "TS", .NET's
  letters, PostgreSQL's elephant, SSE's broadcast mark.
- Row hovered on a pointer that hovers: the same shape, in that tech's brand
  colour; SSE's does not change. Touch: never the brand colour.
- Broken icon: the 22px box stays empty; nothing else moves.
- Compact view: the colour logos, exactly as today.

## 6. Decisions

- Contrast math duplicated beside the accent-surface check instead of
  imported: the tests have no shared-helper layer (`tests/helpers/` holds
  only what a test imports), and adding one for two functions is a new
  abstraction for a guard. Discarded alternative: a shared contrast
  module.
- Badge surface instead of card-face label (owner 2026-10-11): the card
  face already carries text at its own colour; a second text colour on the
  same face would fight the card's voice, while a badge isolates the
  4.5:1 pair. Discarded alternative: darker per-level text directly on
  the card.
- Monochrome-by-mask instead of a painted backdrop (owner 2026-10-11,
  replacing the universal backdrop): the backdrop was unsatisfiable, not
  merely hard — `dotnet.svg` at L=0.0620 demands a plate ≥0.2860 and
  `mongodb.svg` at L=0.6092 demands one ≤0.1697, an empty interval. A mask
  inverts the problem: the plate colour stops being something the logo has
  to clear and becomes the only colour the logo is allowed to be painted
  in, so the assertion is one number per theme instead of ten. Discarded
  alternatives: a flat plate behind the logo (the interval above);
  `filter: grayscale(1)`, which cannot reach 3:1 on the dark card for
  `mongodb.svg` and inverts wrongly for the light-on-dark logos; and
  recolouring the SVG files themselves, which would fork ten upstream
  assets the data file points at.
- Brand colour on the row's hover, and nowhere else (owner 2026-10-11):
  the brand colours are measured *below* 3:1 on the dark card for nine of
  ten rows (spec Edge cases), so they cannot be the default. They are
  decoration rewarded to the pointer, and the name beside the icon
  already carries the meaning. The row is not made focusable to reach it:
  a decoration is not worth a tab stop, and making it one would put a
  control where there is no action. Discarded alternative: brand colours as
  the default, which the measurements forbid.
- Hover swaps opacity between two layers; it does not drop a mask (owner and
  implementer, 2026-10-11): the pseudo paints the monochrome and goes to
  `opacity: 0` on the row's hover while the brand `<img>` comes up to
  `opacity: 1`. The mount this plan first approved — `background-color` plus
  `mask` on the element carrying the `<img>`, restored by dropping the mask —
  is **discarded as impossible**: a replaced element paints its content after
  its background, so the brand pixels keep painting on top of the monochrome
  layer. Measured, not inferred — with a `#ff00ff` background and an active
  mask all ten logos still render 100% in their brand colours and zero
  magenta, and the console stays quiet. One `<img>`, one request, one element
  in the accessibility tree survives every one of these candidates, which is
  why a second image was never needed either. Discarded alternatives: the
  mask on the `<img>` itself (above); a second `<img>` revealed on hover (a
  second decorative element to hide from assistive tech and keep in sync);
  `opacity` on the row instead of the icon layer, which would fade the name and
  the bar along with the logo.
- No gold border on hover (owner, 2026-10-11): a border that turns gold reads as
  selection, and the row is not a control — no action, no focus state, no
  `aria`. Hovering it now changes the icon's colour and nothing else.
  Discarded alternatives: keeping the gold border as the floor of the house
  rule, which is what this plan originally chose and the owner removed; a focus
  ring in its place, which would put a control affordance on a row that is not
  one; a cursor change, which promises a click that does not exist.
- The monochrome colour is an alias, not a new literal: one name resolved
  per theme, so `tests/tokens.test.ts`'s "one literal per value" rule holds
  and the guard reads one token. Discarded alternative: a hardcoded hex in
  the component, which would not follow the theme and is a house-rule
  violation on its own.
- Three per-level fills kept (owner 2026-10-11): the complaint was theme
  contrast, not the level coding. Discarded alternative: a single accent
  fill for all levels.
- Level column capped by max width, shrinking before anything else at
  390px: the icon (22px) and the track floor (60px) are the spec's
  non-negotiables, and gaps carry alignment. Discarded alternative:
  shrinking the icon or dropping the floor.
- RF-6 settled without a data fixture (recorded in the spec's Decision log,
  2026-10-12): all shipped entries carry a level, so the level-less branch
  never runs, and adding a level-less entry to the data would be the data
  change the spec forbids. The check claims no browser record of a level-less
  entry: the guard asserts the default label resolves through the same map the
  component reads in both locales, and an existing beginner row proves the
  label and the row shape. Discarded alternative: a temporary data entry.

Decisions of the 2026-10-15 change:

- Colour through `currentColor` and a hover on `color`, not a hover on the
  pseudo's `background-color`: the latter is a background-only hover, which
  the house rule and its guard forbid. Discarded alternatives: allowlisting
  this rule in that guard (relaxing a guard that is right); inline SVG with
  `fill: currentColor`, which needs the file contents read at build time for
  each row and buys nothing the mask does not.
- The `<img>` goes. With one asset per tech there is nothing for a second
  layer to reveal, and an element kept only to be hidden is the kind of
  attribute-nobody-reads the house rules forbid. Discarded alternative:
  keeping the `<img>` at `opacity: 0` for RF-7's "decorative-alt" wording.
  **Owner to confirm:** RF-7's check names "the decorative-alt pattern"; with
  no `<img>`, the guard reads it as "the icon exposes no accessible name"
  (`aria-hidden` slot, no `<img>`). If that reading is not accepted, the spec
  check is reworded through a change, not narrowed here in silence.
- `icon` and `brand` beside `logo`, not replacing it: the compact view is out
  of scope and still draws `logo`. Phase 2 decides whether `logo` survives.
  Discarded alternative: pointing `logo` at the new assets, which changes the
  compact view the spec says this phase does not touch.
- Brand colours: the Simple Icons data for the seven brands it lists (a
  colour is a fact, not a work), `#E76F00` for Java and `#0078D4` for Azure
  from their current files — the values the spec's accepted cost measured.
  Discarded alternative: the fills Devicon ships, which are not the brands'
  published colours (TypeScript `#007acc` against `#3178C6`).
- One `NOTICE.md` beside the assets, naming each file and its source, citing
  the two licence files. Discarded alternative: a source field in `tech.ts`,
  which mixes licensing into content data.

## 7. Test strategy

On the project runner, `npm test` (`vitest --run tests`); no new
dependency, no browser in the suite (`npm test` never opens one):

- Data checks (constitution 8): contrast guards compute over theme token
  values (RF-2, RF-3, RF-5); i18n resolution for heading keys and the
  default label (RF-4, RF-6); structural guards for card count, the
  monochrome mount and its hover-only binding, and the 22px slot with its
  decorative alt (RF-4, RF-5, RF-7). The one source read that is not a
  rendered-output check is the RF-5/RF-7 structural pair in
  `tests/markup.test.ts`: `npm test` opens no browser and Astro's container
  API is not a dependency, so the row cannot be rendered inside the suite —
  and that file already reads component source with comments stripped for
  every other structural rule it owns. No other new grep is introduced.
- Injection probes (constitution 4): each new/widened guard is shown red
  by an explicit violation and reverted by explicit path before green is
  claimed. For RF-5 that means, at least: pointing the icon at a colour
  below 3:1 against the card in one theme (red on the contrast guard),
  removing the `:hover` scope so the brand presentation is the default
  (red on the structural guard), and putting a gold `border-color` back into
  the row's `:hover` rule (red on the structural guard's "the hover paints
  nothing" assertion). The probe reverts by path, not by retyping the rule.
- Rendered output the runner cannot reach: browser records from the dev
  server at 1280px and 390px in light and dark — row order and widths
  (RF-1, fit proof), **the monochrome default state and the hovered state
  of the same row, at both widths and both themes** (RF-5), the default
  level's label and row shape via an existing beginner row (RF-6 — no
  level-less entry is recorded, none can be produced), injected broken icon URL
  (RF-7). The hover record is taken with the pointer actually over the row,
  after the state settles; `resize_page` does not move `innerWidth`, so the
  viewport is set with `emulate({ viewport: "1280x900" })`.
- Probes for the 2026-10-15 change, each reverted by explicit path: RF-8 —
  point the TypeScript entry's `icon` back at `/tech/typescript.svg` (two
  paints, one white), add a `<linearGradient>` to a copy of an asset, set a
  `brand` to `#12345`, drop one file from `NOTICE.md`; RF-5 — bind `--brand`
  in an at-rest rule, move the hover out of `@media (hover: hover)`, set the
  hover through `background-color` on the pseudo; RF-7 — put an `<img>` with
  a non-empty `alt` back in the row.
- Rendered record for the change: the four former blobs at 390px in both
  themes, measured as interior holes in the drawn mask (the method of the
  spec's Decision log), the hover on a brand row and on SSE, and the compact
  view unchanged against today. The NFRs and Edge cases are walked one by one,
  not inferred from the RFs.
- Regression: full `npm test` plus `tests/tokens.test.ts` attention on
  every styling change (undefined `var()`, single-theme tokens, duplicate
  literals), and `npm run build` green for Done when.

# Spec 005 — Skills bars redesign

**Status:** aprobada

## Decision log

**RF-5 as approved on 2026-10-11 was unsatisfiable, and was replaced the same
day.** The approved wording asked for one flat opaque backdrop clearing 3:1
against the *original* logo of every tech. Measured with the WCAG function the
repo's guards reproduce, over the fills the assets ship:

- `dotnet.svg` `#5c2d91`, relative luminance **0.0620**, demands a backdrop of
  luminance **≥ 0.2860**.
- `mongodb.svg` `#01EC64`, relative luminance **0.6092**, demands a backdrop of
  luminance **≤ 0.1697**.

The interval is empty, so no single flat colour satisfies it in either theme.
Closing it would take new logo assets, not a different backdrop:
**do not re-propose the universal backdrop without them.**

**Replacement (owner, 2026-10-11):** the icons may be recoloured, and the brand
colour appears only while the pointer is over the row; a device with no hover
stays monochrome.

**Accepted cost (owner, 2026-10-11):** the hover state carries no contrast
requirement, and on some rows the brand colour is less visible than the
monochrome it replaces. The measurements are in Edge cases.

**The hover no longer turns the row's border gold (owner, 2026-10-11).** The
plan kept the gold border as the house rule's floor and stacked the icon's
colour change on top of it; the owner removed it, so the hover changes the
icon's colour and nothing else. Reason: a border turning gold reads as
selection, and the row is not a control — no action, no focus state, no `aria`.
The rule it breaks is in Non-functional requirements; the guard that settles it
lives in `tests/markup.test.ts`, which now rejects any `:hover` rule in the row
component that paints a border, background or outline, or lifts.

**The approved mount was impossible; the row shipped with another one
(implementer, 2026-10-11).** The plan painted the monochrome layer on the
element carrying the `<img>` — `background-color` plus `mask` off an inline
`--logo` — and restored the brand pixels on hover by dropping that mask.
Measured in the dev server, it fails silently: with a `#ff00ff` background and
the mask active, all ten logos still render 100% in their brand colours and zero
magenta. A replaced element paints its own content *after* its background, so
the monochrome layer sits underneath the very pixels it was meant to remove.
Nothing in the console says so.

**Shipped mount:** a pseudo-element (`.bar-logo::before`) paints
`background-color` + `mask` in one colour per theme, and the `<img>` of brand
marks sits at `opacity: 0` by default and `opacity: 1` on the row's hover. The
same mask over a box with no content does work. One request, one element in the
accessibility tree, no second image.

**The 22px slot is held by the wrapper's box, not by the `<img>` arriving**
(implementer, 2026-10-11). RF-7 says the slot "is held by its width, not by a
backdrop"; with the monochrome layer on a pseudo, the width that holds it is
the icon wrapper's own 22px box. A logo that fails to load leaves the reserved
column exactly as it was, with nothing painted behind it.

**RF-6's check asked for a state the shipped data cannot produce, so it was
narrowed to what can be reproduced (owner, 2026-10-12).** The check read "the
browser record shows a level-less entry rendering that label". All ten entries
in `src/data/tech.ts` carry an explicit `level`, so `tech.level ?? 'beginner'`
never fires at runtime: the state the check asks to photograph does not occur.
Producing it would mean adding a level-less entry to the data — the change
Out of scope forbids — so a check that demanded it was a check that could
only ever be satisfied by breaking the spec. The plan had already substituted
"an existing beginner row proves the shape" without recording the substitution
here; it is now this spec's own text rather than a silent narrowing.

**Decision (owner): the data does not move to satisfy a check.** What survives
is the part that is reproducible: the guard in `tests/i18n.test.ts` reads the
fallback out of the component and asserts it resolves through the same map the
row reads, in both locales; and the browser record shows an existing beginner
row rendering that label with the RF-1 row shape. That record exercises the
same code path a level-less entry would take from the level onwards — which is
what the evidence covers, and it is not offered as proof of the branch
executing. RF-6 itself is untouched: the requirement, its default and its
thresholds are unchanged, and this entry changes only what the check asks for.

## Context and goal

The Skills section reads flat: the level bars fail against the colours of the
themes, the skill areas run into each other with no container telling them
apart, and some tech icons dissolve into the background. A skill row should
read at a glance as one unit — icon on the left, text over the bar, level on
the right — inside an area card with its own border, in both themes. The icon
reads in one colour of its own by default, so a row is legible before anything
is hovered; the brand logo is what the pointer is rewarded with.

## Definitions

- **Bars view:** the Skills view that renders one row per technology with a
  level bar. Phase 1 covers this view only.
- **Compact view:** the chip/list view behind the view toggle. Phase 2; not
  this spec.
- **Area:** one skill category from the data. The data file is the source of
  which areas exist; this spec names none.
- **Level:** one of three ordered values (`beginner`, `intermediate`,
  `advanced`) with its word label in the active locale.
- **Monochrome icon:** the tech icon as the row presents it by default — one
  single colour, the same one for every icon, chosen per theme. It is
  decorative: the tech name beside it carries the meaning.
- **Brand colour:** the colours the logo itself ships. They are presented only
  while the pointer is over the row (RF-5).
- **Level badge:** the level label's own pill surface, opaque and defined per
  theme (owner decision 2026-10-11).

## Actors

One: a visitor reading the Skills section, in either theme and in either
locale.

## User stories

- US-1: As a visitor, I want each skill row to read as icon + text-over-bar +
  level so that I can scan name, strength and level without decoding the layout.
- US-2: As a visitor in either theme, I want the bar and its level label to
  clear the background so that strength is visible, not inferred.
- US-3: As a visitor, I want each area in its own bordered card so that I can
  tell where one area ends and the next begins.

## Requirements (EARS)

- **RF-1: THE SYSTEM renders each bars-view row with the icon in a 22px left
  column, the name above the track in a flexible middle column floored at
  60px, and the level in a right column of at most 2 lines with ellipsis,
  with 0.6rem row gaps and the area-card padding shared with the other
  cards, keeping all three columns at 390px.**
  (Geometry decided 2026-10-11; columns are kept at 390px, not stacked.)
  — **Check:** measurement record from the dev server at viewports 1280px and
  390px, in light and in dark: every row reads icon / (name over track) /
  level, and the recorded widths show the 22px icon, a track at or above
  60px and a level of at most 2 lines at 390px — proving the three columns
  fit — with 0.6rem gaps and the shared card padding. The flexible track
  uses a `minmax` floor because a bare `1fr` collapses to zero when the fixed
  columns exceed the row.
- **RF-2: WHILE either theme is active, THE SYSTEM paints each level's own
  fill colour against the track at 3:1 or above.**
  The three fills stay one colour per level (decided 2026-10-11); each of the
  three clears 3:1 independently.
  — **Check:** new guard in `tests/visual-language.test.ts` reproducing the
  WCAG contrast function (as the existing accent-surface check does),
  asserting fill-versus-track at or above 3:1 for every level in both
  themes, plus the browser measurement record. The guard is shown red on an
  injected violation first.
- **RF-3: WHILE either theme is active, THE SYSTEM paints every level word
  label on its own badge at 4.5:1 or above.**
  (Badge decided 2026-10-11.) Contrast is language-independent: one
  measurement covers both locales.
  — **Check:** new guard in `tests/visual-language.test.ts` asserting
  label-versus-badge at or above 4.5:1 for every level in both themes, plus
  the browser measurement record. The guard is shown red on an injected
  violation first.
- **RF-4: THE SYSTEM groups the bars view by area, with one bordered card per
  area whose heading resolves through the locale files.**
  The data value is the lookup only; no area name is duplicated as literal
  text.
  — **Check:** new guard asserting the bars view renders one card container
  per data category (count read from the data, never a literal list), each
  with a border and a heading; `tests/i18n.test.ts` resolves the new heading
  keys in both locales; browser record in both themes.
- **RF-5: WHILE either theme is active, THE SYSTEM presents every bars-view tech
  icon as a monochrome icon at 3:1 or above against the area card. IF the
  pointer is over that skill's row, THEN THE SYSTEM presents that row's icon in
  its brand colours instead.**
  One requirement, because the second clause is only meaningful as a deviation
  from the first: neither half says anything on its own. The icon sits directly
  on the card — there is no surface painted behind it, and none is needed once
  the icon carries one colour. The default is monochrome on every device (owner
  decision 2026-10-11): the brand colour rewards the pointer, it never informs,
  and the name beside the icon already says which tech it is.
  — **Check:** two guards. (1) In `tests/visual-language.test.ts`, the WCAG
  contrast function (as the existing accent-surface check does), asserting the
  monochrome icon colour against the area card background at or above 3:1 in
  both themes — one colour per theme, so a single assertion covers every icon
  and no icon is enumerated. (2) A structural guard over the rendered row,
  asserting that the default mount is the monochrome presentation and that the
  brand-colour presentation is bound to the row's hover state and never to the
  default. Plus the browser record of both states at 1280px and 390px in both
  themes. The hover half is structural on purpose: no contrast number applies to
  it (Edge cases).
- **RF-6: THE SYSTEM renders a tech entry with no level as the existing
  default level, with the confirmed row shape.**
  This documents the current default, not a data change.
  — **Check:** two parts, neither of which needs a level-less entry to exist
  (Decision log, 2026-10-12). (1) `tests/i18n.test.ts` reads the fallback the
  component actually binds (`tech.level ?? '<level>'`) and asserts it resolves
  through the same map the row reads, in both locales. (2) The browser record
  shows an existing beginner row rendering that label with the RF-1 row shape —
  the same path a level-less entry would take from the level onwards. The check
  deliberately claims no browser record of a level-less entry: every shipped
  entry carries a level, and adding one is the data change Out of scope
  forbids.
- **RF-7: IF a tech icon fails to load, THEN THE SYSTEM keeps the reserved
  22px icon slot and the name, bar and level unchanged.**
  The icon is decorative (empty alt): the adjacent name carries the meaning.
  There is no painted surface to keep — the slot is held by its width, not by a
  backdrop (RF-5).
  — **Check:** guard in `tests/markup.test.ts` asserting the reserved slot and
  the decorative-alt pattern; browser record with an injected broken icon URL at
  390px and desktop.

## Non-functional requirements

- Both themes end green: no fix that passes in one theme by failing in the
  other.
- Every visitor-facing string stays resolved through the locale files in both
  locales, including area headings and level labels.
- No new runtime dependency and no third-party subresource to achieve any of
  the above.
- Hover in the bars view is a recorded exception to the house rule that a hover
  turns the border gold. **The border does not turn gold** (owner decision
  2026-10-11): the plan kept the gold border as the rule's floor and added the
  icon on top, and the owner dropped it — a gold border makes a row that is not
  a control read as selected. So the hover recolours the icon and does nothing
  else: no border, no background, no outline, no lift, and no other row
  affected.
- A device with no hover state — touch, or any pointer that does not hover —
  shows the monochrome icon and never the brand colour. This is the owner's
  stated behaviour, not an omission: the brand colour decorates.
- The row is not a control, so it has no focus state, and the brand colour is
  not reachable by keyboard. Nothing is lost — the icon is decorative and the
  name carries the meaning. With the border dropped (the NFR above), the icon's
  colour is the row's only hover-dependent state, so no other piece of
  information is lost with the absence of a focus state. Making the row
  focusable to reach a decoration is out of scope.
- If the icon's colour change is animated, it is disabled under
  `prefers-reduced-motion`.

## Edge cases

- Long tech names at 390px with three columns kept: the name is a single line
  with ellipsis and never pushes the track below 60px (RF-1).
- Long level words (`Principiante`, `Intermediate`) at 390px: at most 2 lines
  with ellipsis, never hidden, never a fixed pixel width (translated strings
  differ in length in every language).
- A tech entry with no level renders the RF-6 default (RF-6).
- A broken icon URL renders the RF-7 state (RF-7).
- A logo that ships two official variants, one per background, presents on hover
  the variant its brand publishes for the active background. Both are brand
  colours; neither is a second palette.
- **Accepted cost (owner, 2026-10-11):** the brand colour on hover carries no
  contrast requirement, and on several rows it is less visible than the
  monochrome it replaces. On the dark card `#2B4372` (luminance 0.0574) nine of
  the ten rows fall below 3:1 in their brand colours — from .NET's `#5c2d91`
  circle at **1.04:1** and Azure's `#114a8b` at **1.11:1** up to Docker at
  **2.80:1**; only MongoDB clears it, at **6.14:1**. On the light card
  `#FFFFFF`, MongoDB's `#01EC64` measures **1.59:1** and .NET's white glyphs
  **1.00:1**. Where a logo ships several tones, the worst one is the one
  counted. Accepted rather than answered with a second surface behind the logo:
  that surface is the machinery the replaced RF existed to remove.

## Out of scope

- The compact/chips view redesign (phase 2); this spec changes nothing the
  visitor sees there.
- Toggle behaviour (persistence, default view, animation): it stays as is.
- Level values, fills and the set of areas: no data change, only presentation
  (RF-6 documents the existing default).

## Done when

- `npm test` and `npm run build` are green.
- Each new or widened guard has been shown to fail on an injected violation
  and then to pass reverted.
- The bars view has been seen in a browser in light and in dark, at viewport
  widths 1280px and 390px, with the RF-1 through RF-7 records filed.

## Open questions

None. Owner decisions of 2026-10-11 (Q1–Q4) are recorded in RF-1, RF-2, RF-3
and RF-5; the replacement of RF-5 and its accepted cost, the 2026-10-11 border
decision and the correction of the mount are in the Decision log.

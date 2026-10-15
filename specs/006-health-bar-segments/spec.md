# Spec 006 — Skill bars as segmented health bars

**Status:** implementada

**Aprobada:** 2026-10-15 · owner interview (option A, 120ms stagger, square 2px frame, badge kept) and a QA pass whose 12 findings were all closed; four detail decisions accepted by the owner — 120ms per segment, 2px gap, segments start unlit, the fill percentage replaced by the level scale · 192 líneas, 8 RF

**Aprobada:** 2026-10-15 · re-approval after one factual correction in the radius NFR: the view toggle uses the medium radius, so the pill stays with the level badge and the language chip, and the token comment is named stale · 195 líneas, 8 RF

**Aprobada:** 2026-10-15 · change of requirement RF-9: two skill rows per line where a card fits two rows of the derived minimum (213.2px), one on a phone; the open question closed by the owner — a single-skill area keeps half width · 234 líneas, 9 RF

**Aprobada:** 2026-10-15 · change of requirement RF-10: as many area cards per line as fit, the card minimum derived from one minimum row plus the card's padding and border; RF-9 reworded to "as many as fit"; cost accepted by the owner — one skill per line at every measured width · 266 líneas, 10 RF

## Decision log

**As many area cards per line as fit (owner, 2026-10-15).** Asked before the
RF-9 row was approved: more area cards on a line when they fit. Measured with a
live prototype of the change, section height today against with it — 1280px:
450px (two areas × two skills) to 366px (three areas × one skill), −19%;
1024px: 670px (one area × three skills) to 366px, −45%; 800px: 776px (one area ×
two skills) to 556px (two areas × one skill), −28%; 390px: 934px, unchanged. The
card minimum is one minimum row plus the card's own padding and border, so a
card never takes a line it cannot fill with one row. **Accepted cost:** cards
that narrow hold one skill per line at every measured width, so RF-9's two per
line no longer shows at 1280px or 800px; it stays as the rule for a card that
does have the room. Bars grow from 95–108px to 157–170px at 1280px. Rejected:
a card minimum of two rows (482.4px), which keeps two skills per line but
changes nothing at 1280px, the widest the sheet gets.

**Two skill rows per line where they fit (owner, 2026-10-15, option A).** With
the framed bar in place the owner asked for a more compact section, two skills
per line inside each area. Measured before the change: each card's content box
is 457px at 1280px, 609px at 800px and 278px at 390px, and the section is 556px
tall at 1280px and 934px at 800px. A row needs 22 (icon) + 9.6 + 60 (spec 005's
track floor) + 9.6 + 112 (the badge's widest) = 213.2px, so two rows fit at
1280px and 800px and not at 390px. Estimated saving: about 19% at 1280px and 17%
at 800px. Rejected: three area cards per line at desktop (option B), which
compacts more but is not what the owner asked for.

## Context and goal

Spec 005 left the bars view legible: one card per area, a 3:1 fill on its track,
a 4.5:1 level badge, a single-colour icon. It still reads as a progress bar, a
continuous pill that suggests a measured percentage. The owner wants it to read
like an enemy's health bar in a video game: a hard frame holding discrete
blocks. That is also more honest about the data, because a level is one of
three ordered values, not a measurement — today's fill only approximates that
with thirds. One block per level step says exactly what the data says and
nothing more.

## Definitions

- **Level scale:** the ordered list of levels, lowest first — beginner,
  intermediate, advanced — stated once in the data. A level's **step** is its
  position in that list, counting from one.
- **Bar:** the level indicator in a bars-view row, below the tech name and to the
  left of the level badge. Spec 005 calls it the track and its fill.
- **Segment:** one of the equal-width blocks the bar is divided into, one per
  level in the scale.
- **Lit segment / unlit segment:** a segment painted in its row's level colour,
  or left in the track colour.
- **Frame:** the 2px outline that holds the segments.
- **Bar entrance:** the moment the existing bars-view script replays the bar's
  animation — on page load, and every time the visitor switches back to the
  bars view. Spec 005's bar already animates at this moment; this spec changes
  what animates, not when. With scripts off there is no entrance and no toggle.

## Actors

One: a visitor reading the Skills section, in either theme, in either locale,
with or without reduced motion, with or without scripts.

## User stories

- US-1: As a visitor, I want each skill's level drawn as lit blocks in a framed
  bar so that I read it at a glance as a health bar, not a percentage.
- US-2: As a visitor who asked for reduced motion, I want the blocks already lit
  so that nothing moves on screen.

## Requirements (EARS)

How these are checked. `npm test` renders no route, and a renderer for
components would be a dependency bought for a check (constitution 7), so the
component-level guards below read component source with comments stripped —
the reason constitution 8 asks for, and the one spec 005 gave. Every RF also
has a rendered record from the dev server, which is what settles what the eye
sees.

- **RF-1: THE SYSTEM draws each bars-view bar as one segment per level in the
  level scale.**
  The count comes from the scale, so a fourth level would mean a fourth
  segment without touching this requirement.
  — **Check:** a guard that reads the scale from the data (never a literal
  list) and asserts the segment count the row renders equals its length; shown
  red first by rendering one segment too few. Plus the browser record at 1280px
  and 390px.
- **RF-2: THE SYSTEM lights the leftmost segments of a row, as many as its
  level's step.**
  Beginner lights one, intermediate two, advanced three. The step is read from
  the scale; no second figure for the same fact — today's fill percentage —
  survives beside it.
  — **Check:** a guard that, for each level in the scale, asserts the count of
  segments the row marks lit equals the level's step and that they are the
  leftmost, and that no per-level fill percentage remains in the data; shown
  red first by lighting one segment too many. Plus the browser record of one
  row per level.
- **RF-3: WHILE either theme is active, THE SYSTEM paints each lit segment at
  3:1 or above against an unlit segment.**
  This replaces spec 005's RF-2 (fill against track): the colours do not change,
  the pair being measured does.
  — **Check:** spec 005's fill-versus-track guard, pointed at the lit and unlit
  segment colours, passing in both themes; shown red first by an unlit colour
  below 3:1. Plus the browser measurement record.
- **RF-4: WHILE either theme is active, THE SYSTEM draws the frame in the
  monochrome icon colour at 3:1 or above against the area card.**
  — **Check:** a contrast guard asserting frame-versus-card at 3:1 or above in
  both themes, reading the colour the component binds; shown red first by a
  frame colour below 3:1. Plus the browser record.
- **RF-5: THE SYSTEM draws the frame as a 2px border with the extra-small
  radius, a 2px padding, and a 2px gap between segments.**
  The segments follow the house rule for a child in a padded parent — the
  frame's radius minus its padding, written as that relationship — which makes
  them square. The pill radius leaves the bar.
  — **Check:** a structural guard that the frame's border, padding and gap are
  2px, its radius is the extra-small token, the segment's radius is derived
  from the frame's rather than typed, and no rule on the bar uses the pill
  radius; shown red first by putting the pill back. Plus the browser record of
  the computed widths and radii.
- **RF-6: WHEN the bar entrance happens, THE SYSTEM lights each lit segment from
  the unlit colour to its level colour over 120ms, starting 120ms after the
  segment to its left starts.**
  Only lit segments animate; an unlit segment stays unlit throughout. For an
  advanced row the three start at 0, 120 and 240ms and the last one finishes at
  360ms.
  — **Check:** a structural guard that a lit segment's delay is its position
  times 120ms, derived from the position rather than typed per segment, that
  its duration is 120ms, and that no animation applies to an unlit segment;
  shown red first by typing one delay as a literal. Plus the browser record of
  the computed delays and durations of an advanced row.
- **RF-7: IF the visitor has asked for reduced motion, THEN THE SYSTEM shows the
  lit segments already lit, with no animation.**
  — **Check:** a guard that a reduced-motion override removes the segment
  animation; shown red first by deleting the override. Plus the browser record
  with reduced motion emulated: no animation name applies and every lit segment
  is already in its level colour.
- **RF-8: IF scripts do not run, THEN THE SYSTEM still shows each row's lit
  segments at its level.**
  The lit state is content, not the animation's end state: the animation is the
  enhancement. Spec 005 fixed the same failure for the continuous bar, which
  once rendered ten empty tracks with scripts off.
  — **Check:** two parts. Automated: a guard that the lit state is set by the
  row's own markup and styles, never by the class the script adds; shown red
  first by making a segment's colour depend on that class. Manual, in the
  rendered record: the home page's HTML fetched from the dev server without
  running scripts marks each row's lit segments to match its level.
- **RF-9: WHILE an area card is wide enough for more than one skill row of the
  minimum row width, THE SYSTEM lays as many rows per line as fit, in data
  order, left to right.**
  (Added 2026-10-15; "two" became "as many as fit" the same day, which the
  auto-fill below already did.) The minimum row width is the narrowest row
  that still keeps spec 005's 60px track floor beside the widest level badge:
  icon, gaps, floor and badge maximum, written as that sum rather than as a
  number. Below it the card keeps one row per line, so a phone is unchanged.
  The decision is the card's own width, not the viewport's.
  — **Check:** a structural guard that the row list's columns are an auto-fill
  of the minimum row width capped at the card — auto-fill, so a lone row keeps
  half the card, and that the minimum is derived
  from the icon, gap, floor and badge values rather than typed; shown red first
  by typing the minimum as a literal. Plus the browser record: rows per line
  equal to how many minimum rows fit in each card's content box, at 1280px,
  1024px, 800px and 390px; every bar at or above 60px; and a single-skill
  area's row as wide as its neighbours'.
- **RF-10: THE SYSTEM lays as many area cards per line as fit, each card at
  least one minimum row wide plus its own padding and border.**
  (Added 2026-10-15, Decision log.) The card minimum is written as that sum —
  the RF-9 row minimum, the card's padding twice and its border twice — never
  as a number. A line with fewer cards than columns keeps the columns, so the
  last line's cards are as wide as the ones above.
  — **Check:** a structural guard that the area grid's columns are an auto-fit
  of the card minimum capped at the section, and that the minimum's terms are
  the row minimum's plus the card's padding and border as the card styles them;
  shown red first by typing the card minimum as a literal. Plus the browser
  record: three areas per line at 1280px and 1024px, two at 800px, one at 390px,
  with the section heights of the Decision log.

## Non-functional requirements

- Spec 005 keeps passing unchanged except its RF-2, which this spec's RF-3
  replaces: its RF-1 (three columns, 22px icon, track floored at 60px, level
  badge at most two lines, columns kept at 390px), its RF-3 (level badge at
  4.5:1), and its RF-4 to RF-8. Spec 005's Decision log records the
  replacement in the same change, so its text never claims what is no longer
  true. This spec changes the bar inside the middle column and, from RF-9 and
  RF-10 on, how rows and area cards are laid out; nothing else.
- Both themes end green: no fix that passes in one theme by failing in the
  other.
- The bar stays hidden from assistive technology: the badge beside it already
  says the level in words.
- Hover is unchanged: it recolours the icon and nothing else, so neither the
  frame nor the segments change on hover.
- No new runtime dependency and no third-party subresource.
- **The house rule on radius changes first.** `AGENTS.md` names the bar track
  and its fill as the pill radius's use; this spec makes the bar square, so that
  rule is amended in its own `docs:` commit before any code, and the pill is
  left to the lozenges that use it today, the level badge and the language chip.
  The token's own comment says "only the view-toggle group", which is stale — the
  toggle uses the medium radius — and is corrected with the component work.

## Edge cases

- At 390px the bar measures 145–169px (spec 005's record). Less the 2px border
  and 2px padding on each side and two 2px gaps, each segment is 44–52px wide.
- At the 60px track floor of spec 005's RF-1, each segment is 16px wide:
  (60 − 4 − 4 − 4) / 3. Still a block, and the narrowest the layout allows.
- A tech entry with no level falls back to beginner (spec 005 RF-6) and lights
  one segment.
- Switching to the compact view and back replays the entrance: the lit segments
  return to the unlit colour and light again in order, as spec 005's bar
  returns to zero and grows today. A switch mid-animation restarts it.
- With scripts off there is no toggle, so no entrance can replay; the lit
  segments show at their level from the first paint (RF-8).
- An unlit segment is lighter than the frame on the light card and darker on
  the dark card; the frame, not the unlit segment, is what outlines the bar.
- An area with an odd number of skills leaves its last row alone on its line.
- An area with a single skill (Cloud, DevOps today) keeps its row at half the
  card's width, so every bar on the page has the same length and half the card
  stays empty (owner, 2026-10-15). An empty column keeps its place rather than
  collapsing.
- At 1280px and 1024px, three areas per line give cards of 283px and 229px of
  content, one skill per line, and bars of 157–170px and 102–115px.
- A single area alone on a line wide enough for two rows (none at the measured
  widths) shows them two per line under RF-9; the two rules compose.

## Out of scope

- The compact/chips view (phase 2).
- The level colours and the level badge: unchanged from spec 005.
- The toggle's behaviour, and when the entrance happens: unchanged.
- A damage trail, a level number in a diamond, or any other health-bar ornament
  beyond frame and segments (options B and C of the 2026-10-15 sketch, not
  chosen).
- Red as a health-bar colour: navy and gold are the only chroma, and the level
  colours were measured and approved in spec 005.

## Done when

- `npm test` and `npm run build` are green.
- Each new or changed guard has been shown to fail on an injected violation and
  then to pass reverted by explicit path.
- The bars view has been seen in a browser in light and in dark, at 1280px and
  390px, in both locales, with reduced motion emulated, and with the
  server-rendered HTML checked for scripts off — every RF record filed, and
  every NFR and edge case answered one by one, not inferred from the RFs.
- The `AGENTS.md` amendment is committed on its own before the component, and
  spec 005's Decision log names the RF this spec replaces.

## Open questions

Owner decisions of 2026-10-15: option A (segments, one per level), lit
one by one 120ms apart and static with reduced motion, a square 2px frame in
the monochrome icon colour with square segments, the level badge kept on the
right. Clarified the same day after the QA pass: the scale is stated once and
the fill percentage goes; only lit segments animate, start-to-start 120ms with
a 120ms duration each; a 2px gap between segments; spec 005's RF-2 is replaced
and its Decision log says so. After the RF-9 change: two rows per line where
they fit, and a single-skill area keeps its row at half width. After the RF-10
change: as many area cards per line as fit, rows as many as fit inside each.

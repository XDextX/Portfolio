# Spec 016 — Focus ring contrast

**Status:** implemented

**Approved:** 2026-10-15 · seven clarify rounds, findings fixed; dark ring = text white (owner) · 189 lines, 7 RF
**Implemented:** 2026-10-15 · commits `b8a66ab` (docs) and `f00ddd2` (fix) · 6/6 tasks, `npm test` 162/162, `npm run build` green · 7/7 RF, NFRs and edge cases validated; 15 injections red as the plan predicted; seen in both themes at desktop and 375px

## Context and goal

A keyboard user finds their place on the page by the focus ring. Today the ring is
the brand navy in both themes, and in dark the sheet *is* the brand navy: the ring
measures **1.00:1** on the sheet, 1.13 on a card and 1.41 behind the sheet, so in
dark a keyboard user cannot see where they are. WCAG 1.4.11 asks 3:1 for a focus
indicator against what is adjacent to it. This is a defect on the live site, not
part of the redesign, so it ships before specs 007–015. In light the navy ring
already clears 8.46:1 on every ground and does not change.

A second ring exists: the avatar, when it is a link, draws its own in the border
colour — 1.27:1 on the light sheet and 1.54 on the dark one. No caller passes a
link today, so nobody sees it; it is a latent risk that fails the first time one
does.

## Definitions

- **Focus ring:** the outline drawn on an element while it matches `:focus-visible`.
- **Focus colour:** the one colour every focus ring is drawn in, the token
  `--focus-ring`. Each theme file declares it, and nothing else does, as a
  `var()` alias of an existing token (from that theme or the shared token layer) —
  never a new literal.
- **Brand navy:** the token `--color-brand` (today `#243972`), not `--brand-text`,
  which is gold in dark.
- **Outline declaration:** any `outline`, `outline-color`, `outline-style` or
  `outline-width` in a rule. Outlines are used only for focus today.
- **Ground:** a colour a focusable element can sit on, so the ring (offset outside
  the element) is drawn over it. Five per theme, by role:

  | Ground | Light | Dark |
  |---|---|---|
  | Behind the sheet (`--bg`) | `#E4E8EE` | `#16233F` |
  | The sheet (`--main-bg`) | `#FBFCFD` | `#243972` |
  | A card (`--card-background`) | `#FFFFFF` | `#2B4372` |
  | Chip surface in dark, lightest step in light (`--neutral-50`) | `#F4F6F9` | `#1F3059` |
  | Soft fill: a selected or hovered control, the chip in light, every border (`--neutral-200`) | `#DCE2E9` | `#3A578F` |

  Surveyed on every route (`/`, `/proyectos`, `/proyectos/<name>`, the 404): every
  focusable element sits inside the sheet; none sits on a gold fill. Behind the
  sheet stays in the list so a control moved there is still covered.

## Actors

One: a visitor navigating with the keyboard.

## User stories

- US-1: As a keyboard visitor, I want to see which element has focus in either
  theme, so that I know where Tab and Enter will act.

## Requirements (EARS)

- RF-1: THE SYSTEM draws every outline in the focus colour. — **Check:** a test
  reads every stylesheet in `public/styles` and `src/styles`, and every `<style>`
  block under `src/` (components, layouts and pages; comments stripped). A rule
  with any outline declaration that is not a removal (RF-7) must set the colour to
  `var(--focus-ring)` with no fallback, in the shorthand or in an
  `outline-color` of the same rule; anything else fails — no colour at all (it
  draws in `currentColor`), a literal, a `var()` fallback (a second colour),
  `currentColor`, `inherit` or `auto`. Red first, twice: inject `#243972` as a
  literal into the shared rule; then drop the colour from it.
- RF-2: THE SYSTEM defines the focus colour in each theme file, as a `var()`
  alias. — **Check:** the RF-1 test fails when either theme file lacks it, when
  its value is not a `var()`, or when any other file declares it. Red first:
  delete it from the dark theme file (the existing both-themes token guard goes
  red too, and so do RF-3 and RF-6: dark falls back to light's navy, 1.00); then
  redeclare it in `src/styles/global.css` (only this check goes red, since the
  resolver does not read that file); then set the light theme's value to the
  literal `#243972` (only this check goes red: the hex is unchanged).
- RF-3: THE SYSTEM gives the focus colour at least 3:1 against every ground, in
  each theme. — **Check:** the same test resolves the focus colour and each
  ground's token (never a hex typed into the test) to a hex per theme and computes contrast with the function that reproduces the
  WCAG references. Red first: alias the dark focus colour to the brand navy and
  watch it fail at 1.00 (RF-6 goes red too).
- RF-4: THE SYSTEM draws the avatar's focus ring in the focus colour. — **Check:**
  the RF-1 test reads the avatar's styles. Red first: restore the avatar's
  border-colour outline and watch the test fail naming the avatar.
- RF-5: WHILE the light theme is active, THE SYSTEM draws the focus ring in the
  brand navy, as today. — **Check:** the RF-3 test asserts the resolved light hex
  equals the resolved `--color-brand` hex. Red first: alias light to the light theme's
  gold text (`#7A5D10`) — RF-3 stays green at 4.73, only this one fails.
- RF-6: WHILE the dark theme is active, THE SYSTEM draws the focus ring in the
  theme's text colour (6.66:1 at its lowest, on the soft fill). — **Check:** the
  RF-3 test asserts the resolved dark hex equals the resolved dark text hex. Red
  first: alias dark to the brand gold `--brand-accent` (`#E3C770`) — RF-3 stays
  green at 4.31, only this one fails.
- RF-7: IF a rule removes the outline — `outline: none` or `0`, `outline-style:
  none`, or `outline-width: 0` — THEN THE SYSTEM gives the same element a
  `:focus-visible` ring in the focus colour. — **Check:** the RF-1 test splits
  each selector list and, for every selector carrying a removal, finds a rule
  for that selector plus `:focus-visible`, in the same file and the same `@media`
  context, drawing a ring per RF-1; a removal inside a `:focus-visible` rule fails
  outright. Red first, three times: add `outline: none` to a button with no focus
  rule; move the avatar's `:focus-visible` rule into a `@media` block its removal
  is not in; add `outline: none` inside the shared `:focus-visible` rule.

**Resolving an alias (part of this work).** RF-3, RF-5 and RF-6 need a colour
followed through every alias, across the theme file and the shared token layer —
the brand colour token is itself an alias in the shared layer, so the light focus
colour reaches its hex across files. The resolver in the existing contrast test
follows one alias in one file and would throw first. It is widened, not copied,
and shown working by its own cases: a chain of two or more aliases across files
resolves to its hex, and a chain that ends nowhere throws. It looks a token up
in the order the cascade applies it: for dark, the dark theme file, then the light
theme file (its `:root` is the base dark overrides), then the shared token layer;
for light, the light theme file, then the shared layer. It does not read
`src/styles/global.css`: RF-2 forbids the focus colour there, and that file
redeclares none of the five ground tokens. Red first: cap the resolver at one hop and watch the two-hop case fail
(RF-3 and RF-5 go red too, since the light chain is three hops); make it return
the last token instead of throwing and watch the dead-end case fail.

**Every failure message names its RF**, so an injection shows which checks went
red; where one injection reddens more than its own, the RF says so above.

**Why these checks read stylesheets (constitution 8).** `npm test` renders no
route, and the e2e suite is not yet part of the policy, so no rendered page is
within reach of the runner; the colours a rule declares are the data — for the
outline and for the avatar's border alike. When the e2e suite joins the hook,
rendered checks of the computed colours replace these reads.

## Non-functional requirements

- Width, style and offset stay as they are: 2px solid, 2px offset, and 4px for the
  avatar. Only the colour changes.
- The avatar's opt-in ring border keeps its ring-colour override; only the focus
  ring stops reading it. (The square tile's border is a separate `--neutral-200`
  rule that never read the override.) No test covers the ring border today, so the
  RF-1 test asserts it still reads the override; red first: point it at the focus
  colour.
- No new dependency (constitution 7).

## Edge cases

- **A ring next to a gold button.** With a 2px offset a strip of ground separates
  the ring from the button's fill, so the ground is the adjacent colour; RF-3
  measures grounds only.
- **A ring inside the view toggle.** The ring reaches 4px out; the group's padding
  plus its border is 4.2px, so the ring ends inside the border, and across the 4px
  gap it ends at the neighbouring button's edge. It is drawn over a card (the
  group) and the soft fill (the border, the active button) — grounds RF-3 measures.
- **Focus and hover at once.** Hover changes a border to gold (the theme toggle)
  or an opacity (the CV button); neither touches the outline, and the dark ring is
  the text white, so it never reads as the gold hover.
- **The theme switched while the toggle has focus.** The ring follows the theme
  with no extra rule, since the focus colour is per theme; covered by RF-5/RF-6.

## Out of scope

- Width, style or offset of the ring; a focus style per component.
- **A ring clipped by a scrolling container.** The README pane on
  `/proyectos/<name>` is `overflow: auto` at every width (with a max height above
  900px, none below), so a link at its edge can lose the part of its ring outside
  the pane, whatever its colour. Not measured; a separate fix if it shows up.
- **Forced colours** (Windows high contrast): the browser replaces the outline
  colour with the system's, which this spec does not try to override.
- Spec 009's glows: 009 measures the focus ring against its glows (its RF on 3:1
  surfaces) and has to use this spec's focus colour when it is revised.
- The view-toggle active state (spec 012) and the primary button colours (spec 007).
- Outlines set in an inline `style=` attribute or by a script: none exists today
  (grep of `src/`), and the test reads styles only.

## Done when

- `AGENTS.md` carries a focus-ring rule that names the test settling it
  (constitution 3), in its own `docs:` commit before the code.
- `npm test` and `npm run build` green, with each guard shown red by the injections
  above and the files restored byte-identical; the commit names those injections
  (constitution 4).
- In a running dev server, in both themes, tabbing on `/` shows the ring on the
  language selector, the theme toggle and the CV button; on the 404, on its home
  button. Those four render without the GitHub fetch, which the project cards and
  `/proyectos/<name>` depend on.

## Open questions

None.

## Decision

- 2026-10-15 · Dark ring colour: the text white, not the gold. Measured on the five
  dark grounds — white 14.53 / 10.28 / 9.11 / 12.04 / 6.66, gold 9.41 / 6.66 / 5.90
  / 7.80 / 4.31 — white keeps the higher floor and never reads as hover, which is
  gold. Owner decision.

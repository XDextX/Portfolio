# Spec 026 — Skill rows shaped like the design proposal

**Status:** implemented
**Size:** M
**Approved:** 2026-10-17 · one clarify round, two minor findings applied; approved with its plan, tasks and the AGENTS amendment · 101 lines, 5 RF
**Implemented:** 2026-10-17 · commits `bdedc68` (AGENTS radius rule) and `5b3b977` · 5/5 tasks, `npm test` 238/238, e2e 119/119 · 5/5 RF, NFRs and edge cases validated (process-step tones identical before and after; light and dark at 1280 and 360 beside the mockup, owner visual approval); 7 injections red
**Changed:** 2026-10-17 · at implementation: RF-2 (one start for every bar in a card) forces one row per line, so spec 006 RF-9's guard (two rows per line) is retired too, and RF-10's guard now derives the card minimum from the new row (logo, three gaps, the bar's 60px floor, the 7rem level cap)

## Context and goal

The owner's design proposal (2026-10-15 mockups, dark and light) draws each skill on one line:
logo, name, a thin rounded bar on a soft track, and the value at the end. Today each row takes
two lines — the name above a thick bar in a square 2px frame — and ends in a level pill
(spec 006). The owner keeps the segmented bar, so the level still reads as discrete blocks with
no invented percentage, and wants the row to look like the proposal (decided 2026-10-17):

- the level in words at the end of the row, where the mockup shows "90%", with no pill;
- three rounded segments with a small gap, unlit ones reading as a soft track, no frame;
- the mockup's colours: blue for advanced, teal for intermediate, amber for beginner.

Dropping the pill moves the label onto the card face, where today's dark intermediate label
measures 4.13:1, under the 4.5:1 text floor: the label colours change with the layout.

This supersedes spec 006's square frame (its RF-4 and RF-5) and the level badge, and spec 012's
bars-view row layout; the segment count, the lighting animation and the reduced-motion and
no-script behaviour stay.

## Proposed amendment to AGENTS.md (Visual language, radius rule)

> **Radius follows size class, not taste** — one radius everywhere is what makes a layout read
> as a template. `--radius-pill` is only for genuinely lozenge-shaped things — the language
> `Chip` and the thin segments of the skill bar (spec 026) — never a square button (at 32×32 it
> rounds the corners nearly off). A child inside a padded parent takes the parent's radius
> *minus the parent's padding*, written as that relationship.

Committed alone as `docs:` before the code, as AGENTS requires.

## Actors

Visitors reading the Skills section in either theme, at any width.

## User stories

- US-1: As a visitor, I want each skill on one line with its bar and level side by side so that
  I can scan an area at a glance, as in the proposal.

## Requirements (EARS)

- RF-1: THE SYSTEM lays out each bars-view skill on one line: logo, name, bar, level in words,
  in that order. — **Check:** a rendered test at 1280 and 360 px finds, for every row, the four
  parts sharing one line and ordered left to right, and no page scroll at 360 px.
- RF-2: THE SYSTEM aligns the bars of an area: every bar in an area card starts at the same x and
  has the same width. — **Check:** the same test compares the bars of each card and fails on a
  difference over 1px, at both widths.
- RF-3: THE SYSTEM draws the bar as one rounded segment per level, lit from the left, with no
  frame. — **Check:** a rendered test counts the segments against the level scale, the lit ones
  against the row's level and position, and fails if a segment's corner radius is under half its
  height or the bar draws a border.
- RF-4: THE SYSTEM fills lit segments by level — blue for advanced, teal for intermediate, amber
  for beginner — each at 3:1 or more against an unlit segment, in both themes. — **Check:** a
  test resolves each level's fill per theme, reads its hue band (blue 200–240°, teal 160–195°,
  amber 30–50°) and its contrast against the unlit segment.
- RF-5: THE SYSTEM draws the level label as plain text on the card face at 4.5:1 or more, in both
  themes. — **Check:** a test measures each level's label colour against the area card in each
  theme, and a rendered test fails if the label paints a background of its own.

## Non-functional requirements

- Kept from spec 006 and its guards: lit colour without scripts, the 120ms-per-segment lighting,
  no animation under reduced motion, the bar hidden from assistive tech while the label speaks.
- The list (chips) view and the area headings do not change.
- The process steps' tones (spec 011) keep their values, though they alias today's level tokens
  (settled by `e2e/process-steps.spec.ts` and the step-colour guards in
  `tests/visual-language.test.ts`).
- A long name ellipsizes instead of squeezing the bar under 60px.

## Edge cases

- The longest label ("Principiante" / "Intermediate") sets the label column, so bars stay
  aligned when levels differ within a card — RF-2.
- An area with one skill — RF-1 and RF-2 hold trivially.

## Out of scope

- Percentages, new skills, the area header icons' colour (the proposal paints them; the
  2026-10-15 decision keeps them monochrome).

## Guards this retires (AGENTS: never silently)

- `tests/markup.test.ts` "frames the bar square" (spec 006 RF-5) — the frame goes by decision.
- `tests/visual-language.test.ts` "the health bar frame clears the card" (spec 006 RF-4) — no
  frame to measure.
- `tests/visual-language.test.ts` "level labels clear their badge" — replaced by RF-5, which
  measures the label on the card face it now sits on.
- `tests/markup.test.ts` "the skill rows per line" (spec 006 RF-9) — RF-2 puts one row per line.
  Its sibling RF-10 stays, reading the new row geometry.

## Done when

`npm test` and `npm run test:e2e` green; every new guard shown red by injection; the Skills
section seen in light and dark at 1280 and 360, stopping for the owner's visual approval.

## Open questions

None.

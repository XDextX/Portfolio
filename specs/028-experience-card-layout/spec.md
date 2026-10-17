# Spec 028 — Experience card arranged like the proposal

**Status:** implemented
**Size:** M
**Approved:** 2026-10-17 · one clarify round, one minor finding applied; approved with its plan and tasks · 74 lines, 4 RF
**Implemented:** 2026-10-17 · commit `5f05b35` · 3/3 tasks, `npm test` 238/238, e2e 125/125 · 4/4 RF, NFRs and edge cases validated (light and dark at 1280, 800 and 390 beside the mockup, owner visual approval); 6 injections red

## Context and goal

The owner prefers the experience card's arrangement in the design proposal (2026-10-15 mockups,
asked on 2026-10-17). There, each card opens with the company's icon in a square tile, the role
and company beside it and the location at the far end of that line; below, the bullets on the
left and the tech chips in a column on the right. Today the card is one column: role, company
with a small inline icon, location, bullets, chips. Decided with the owner on 2026-10-17: the
tile holds the icon in the neutral icon colour (spec 013's decision stands, no colour exception),
and the chips keep today's tag look; only their place changes.

## Actors

Visitors reading the Experience section in either theme, at any width.

## Requirements (EARS)

- RF-1: THE SYSTEM shows each job's company icon in a square tile at the start of the card's
  header, before the role and the company. — **Check:** a rendered test at 1280 and 390 px finds
  one tile per card, square within 1px and at least 40px, holding the company icon, ending left
  of both the role and the company name, and hidden from assistive tech.
- RF-2: THE SYSTEM draws the company icon at 3:1 or more against its tile, in both themes. —
  **Check:** a rendered test reads the icon's colour and the tile's fill in each theme, also after
  a theme switch, and fails under 3:1.
- RF-3: WHILE the viewport is 1280 px wide, THE SYSTEM places the location at the end of the
  header line, level with the role. — **Check:** at 1280 px the location's box ends within 1px of
  the card's content edge and overlaps the role's line vertically; at 390 px it sits below the
  company, inside the card.
- RF-4: WHILE the viewport is 1280 px wide, THE SYSTEM shows the tech chips in a column to the
  right of the bullets. — **Check:** at 1280 px the chip list starts right of the bullet list and
  overlaps it vertically; at 390 px the chip list starts below the bullet list.

## Non-functional requirements

- Spec 013 holds, settled by its guards: the period once and before the role in reading order,
  one company icon per card masked from its declared glyph and aria-hidden, chips in data order
  with their accessible name, the CV link, hover gold with nothing lifting, no page scroll at
  390 px. Spec 027's rail order holds.
- The chips keep the shared `.tag` look; the icon keeps `--icon-mono`.
- At every width between 390 and 1280 px, nothing in the card overlaps anything else. Settled by
  a rendered test at 800 and 1024 px that fails if the boxes of tile, role, company, location,
  bullets and chips overlap pairwise.

## Edge cases

- A job without a location: the header ends after the company — RF-3 does not apply.
- A long location ("Costa Rica (Remoto)") at 1280 px: it shares the line with the role without
  overlapping it — NFR.
- More chips than fit one line in the right column: they wrap inside it — RF-4.

## Guards this changes (AGENTS: never silently)

- `e2e/experience-timeline.spec.ts` RF-6 (spec 013) measures the company icon against the card;
  the icon now sits on its tile, so the guard reads the tile as the ground. Same 3:1 floor.

## Out of scope

- Colour icons in the tile and pill-shaped chips (both declined on 2026-10-17).
- The job duration (dropped on 2026-10-15).

## Done when

`npm test` and `npm run test:e2e` green; each new guard shown red on today's card and by
injection; the section seen in light and dark at 1280, 800 and 390 px beside the mockup,
stopping for the owner's visual approval.

## Open questions

None.

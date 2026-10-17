# Spec 027 — Timeline rail on the left, as in the proposal

**Status:** implemented
**Size:** S
**Approved:** 2026-10-17 · one clarify round, no finding; approved with its plan and tasks · 56 lines, 2 RF
**Implemented:** 2026-10-17 · commit `80edecc` · 3/3 tasks, `npm test` 238/238, e2e 121/121 · 2/2 RF and NFRs validated (spec 013 guards unchanged and green; light and dark at 1280, 800 and 390 beside the mockup, owner visual approval); 2 injections red

## Context and goal

In the design proposal (2026-10-15 mockups) the experience timeline runs down the list's left
edge: the dotted rail and its dots first, each job's period beside its dot, then the card. From
40rem today the order is period, rail, card (spec 013 put the period in its own column left of
the rail); at 390 px the rail is already at the left edge with the period inside the card. The
owner asked on 2026-10-17 for the rail and dots on the left as in the image. The goal: from
40rem, rail and dots first, period between dot and card; below 40rem, unchanged.

## Actors

Visitors reading the Experience section at 40rem or wider, in either theme.

## Requirements (EARS)

- RF-1: WHILE the viewport is 40rem or wider, THE SYSTEM draws the rail and dots left of every
  period, and each period left of its card. — **Check:** a rendered test at 1280 and 800 px
  fails unless, for every job, the dot's right edge is left of the period's box and the period's
  box ends left of the card, with no overlap.
- RF-2: WHILE the viewport is 40rem or wider, THE SYSTEM sets each period level with its dot. —
  **Check:** the same test fails if a dot's centre falls outside its period's vertical extent.

## Non-functional requirements

- Spec 013 holds unchanged, settled by its guards in `e2e/experience-timeline.spec.ts`: one dot
  per job level with its card, a contiguous rail ending on each dot, the period once and before
  the role in reading order, rail and dots hidden from assistive tech, and at 390 px the rail at
  the left edge, the period inside the card, no page scroll.
- Contrast unchanged: the dot and rail keep their colours and the period its text colour on the
  sheet, in both themes.

## Edge cases

- A single job: one dot, no rail, period beside it — RF-1 and RF-2.
- The longest period string in either locale fits its column without reaching the card — RF-1.

## Out of scope

- The job duration ("2 años 7 meses"): dropped on 2026-10-15 for lack of start and end months.
- Extending the rail above the first dot towards the section title, as the mockup's ornament.

## Done when

`npm test` and `npm run test:e2e` green; RF-1 and RF-2 shown red on today's layout and by
injection; the section seen in light and dark at 1280, 800 and 390 px, stopping for the owner's
visual approval.

## Open questions

None.

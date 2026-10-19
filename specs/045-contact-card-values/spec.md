# Spec 045 — Contact cards without their value on a phone

**Status:** implemented
**Size:** S
**Approved:** 2026-10-18 · one clarify round with the owner's decisions (values hidden at 720 px and below); previewed on mobile in both themes · 107 lines, 6 RF
**Implemented:** 2026-10-18 · commit `4352ea1` on spec/045-contact-card-values · 4/4 tasks, `npm test` 325/325, e2e 319/319 · 6/6 RF, NFRs and edge cases validated by the SDD reviewer; injections 1–5 red; owner visual approval

## Context and goal

A contact card shows the channel's icon, its label, its value as a link, and the copy and open
controls. At 360 and 390 px every value is cut with an ellipsis: the email value is truncated, and
so are the two profile links. Decided with the owner on 2026-10-18, after seeing a preview, and
replacing an earlier decision that kept the email visible: on a phone no contact card shows its
value ("que la del correo solo diga correo"). On a desktop every card keeps its value, as today
(owner, 2026-10-18). Each card keeps the icon, the channel's label and the two controls. The value
stays where it does its job: in the card's accessible name, and in what the copy and open
controls act on.

Measured on the dev server on 2026-10-18, fine pointer unless stated:

- **Phone:** at 360 px the card's content is 246 px wide (276 at 390), the icon 28 px, each gap
  16 px. In the value's typography (13 px, weight 600 at 360 px) the labels measure "Email" 34,
  "Correo" 40.4, "GitHub" 42.5 and "LinkedIn" 53.2 px. At spec 048's sizes on a coarse pointer the
  controls take 121.5 px in Spanish and 110.8 in English (copy 71.9 / 61.2 wide, open 44, gap
  5.6), which leaves the label 64.5 px at 360 in Spanish, the tightest case: "LinkedIn" fits with
  11.3 px to spare. The controls' width is computed from the measured boxes, not measured with 048
  in place.
- **Threshold:** the widest value, the LinkedIn URL, is 258.9 px. Beside today's controls it fits
  from a viewport of 620 px (Spanish, 266.3 px of room) and is cut at 600 (248). At 721 px it has
  359.2 px in Spanish and 369.9 in English. With 048's controls on a coarse pointer the room shrinks
  by about 10 px, which leaves about 349.

## Definitions

- **Phone width**: a viewport 720 px wide or narrower, the line where the hero turns into a single
  column (spec 035 RF-7). Above it is **desktop width**.

## Actors

Visitors reading or copying a contact, on a phone or a desktop, with or without assistive tech.

## Requirements (EARS)

- RF-1: WHILE the viewport is at phone width, THE SYSTEM shows no value on any contact card, only
  the icon, the channel's label and the copy and open controls (owner, 2026-10-18). — **Check:** at
  360, 390 and 720 px, in both locales, no card renders a visible element holding its value, and
  each renders the icon, the label and both controls.
- RF-2: WHILE the viewport is at desktop width, THE SYSTEM shows every card's full value beside its
  controls, as today (owner, 2026-10-18). — **Check:** at 721 and 1280 px, in both locales, with a
  fine and with a coarse pointer, every card's value is visible, has no clipped content
  (`scrollWidth` equals `clientWidth`), and shares the controls' row.
- RF-3: THE SYSTEM keeps every card's value in its accessible name and in what its controls act on,
  at every width. — **Check:** at 360 and 1280 px each card's accessible name is "<label>: <value>",
  as today; the copy control writes the same text as today, and the open control links to the same
  `href`.
- RF-4: WHILE the viewport is at phone width, THE SYSTEM draws the channel's label in the value's
  typography (size, weight, colour), not the small muted label style, so the card does not read as
  empty (coordinator, 2026-10-18). — **Check:** at 360 and 390 px each card's label computes the
  `font-size`, `font-weight` and `color` the value computes at rest at that width today, per theme;
  at 1280 px the label keeps today's style.
- RF-5: WHILE the viewport is at phone width, THE SYSTEM keeps each card on one row: icon, label and
  controls. — **Check:** with a coarse pointer and spec 048's sizes at 360 and 390 px, in both
  locales, the icon, the label and both controls share one row (vertical centres within 1 px), and
  the label has no clipped content.
- RF-6: THE SYSTEM keeps the copy and open controls on every card, each with its accessible name.
  — **Check:** at 360, 390 and 1280 px both controls are visible and named as today on all three
  cards, and the copy control keeps one size across its three states, with its feedback as spec 018
  defines it.

## Non-functional requirements

- Both themes and both locales.
- One threshold for all three cards: no width shows the value on one card and hides it on another.
  — **Check:** at 720 and 721 px, either every card shows its value or none does.
- AGENTS' visual-language rules hold: hover is the gold border; two controls side by side state
  their `block-size`.

## Edge cases

- "LinkedIn" in Spanish at 360 px with a coarse pointer, the tightest phone row: 53.2 px against
  64.5. RF-5.
- The LinkedIn URL at 721 px in Spanish on a coarse pointer (a tablet): about 349 px of room
  against 258.9. RF-2.
- A phone held in landscape wider than 720 px: desktop width, so the values show. RF-2.
- A visitor at phone width who wants to read the value without copying it: the open control leads
  to it, and assistive tech reads it in the card's name. RF-3.
- A new contact kind added later: it follows these RFs like the others; a value wider than its
  room at 721 px, or a label wider than its room at 360 px, would be a finding for that change.
  RF-2, RF-5.

## Out of scope

- The cards' order and the section's grid.
- The copy feedback's wording and timing (spec 018).

## Done when

`npm test` and `npm run test:e2e` green; each new guard shown red by injection (a value back on
one card at 390 px for RF-1, a value hidden at 1280 px for RF-2, the muted label style back for
RF-4); the section read on the dev server at 360, 390, 720, 721 and 1280 px in light and dark.

## Open questions

None. Resolved 2026-10-18: no card shows its value on a phone, the email included, replacing the
earlier decision to keep the address visible; desktop keeps every value as today (owner,
2026-10-18). The label takes the value's typography (coordinator, 2026-10-18). The threshold is the
site's 720 px single-column line (spec 035): the contact section's only breakpoint, its 60rem
container, would hide values from about 640 to 1150 px, where they fit.

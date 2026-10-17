# Spec 029 — Contact section arranged like the proposal

**Status:** implemented
**Size:** M
**Approved:** 2026-10-17 · one clarify round, one minor note (two controls side by side) applied to the plan; approved with its plan and tasks · 83 lines, 7 RF
**Implemented:** 2026-10-17 · commit `7fd345e` · 4/4 tasks, `npm test` 239/239, e2e 130/130 · 7/7 RF (RF-2 as changed), NFRs and edge cases validated (light and dark at 1280, 800 and 390 beside the mockup, at rest and invalid, owner visual approval after two adjustments); 8 injections red
**Changed:** 2026-10-17 · owner decision at the visual review: RF-2 puts one card per row (was two), since a half-width card with both buttons cut every value at 1280 px ("germonr…"); then the title and its line join the cards column and Message drops to four rows, so the form starts level with the title and the cards column ends 68px short of it instead of ~240px

## Context and goal

The design proposal (2026-10-15 mockups) lays Contact out in two columns: the contact cards on
the left in a grid of equal cards, the form on the right inside its own card, with Name and Email
side by side, the field names small inside each field and a full-width send button with a
paper-plane icon. Today the cards wrap in a row, the form sits below them at reading width with
its labels above the fields, and its button is as wide as its text. The owner asked on
2026-10-17 for the proposal's arrangement and decided: field names small inside the field and
always visible (still real labels); the location card stays out (spec 018 decision); the email
card shows a gold envelope instead of the Gmail logo; each card keeps both copy and open buttons.

## Actors

Visitors who want to get in touch, in either theme, at any width.

## Requirements (EARS)

- RF-1: WHILE the viewport is 1280 px wide, THE SYSTEM shows the contact cards and the form side
  by side, the cards first, the form inside a card of its own. — **Check:** at 1280 px the form's
  card starts right of every contact card and overlaps them vertically; at 390 px the form starts
  below the last contact card; the form's container draws the card frame.
- RF-2: THE SYSTEM gives every contact card the full width of the cards column, one per row, so
  each value reads whole at 1280 px. — **Check:** at 1280 px every card spans the column within
  1px and no card's value is cut (its text fits its box); at 390 px each card spans the column.
- RF-3: THE SYSTEM shows each card's label as its locale text, in sentence case. — **Check:** each
  label's rendered text equals the locale string ("Correo"/"Email", "GitHub", "LinkedIn") and its
  computed `text-transform` is `none`.
- RF-4: THE SYSTEM draws the email card's icon as the site's mail glyph in the gold accent, at
  3:1 or more against the card, in both themes. — **Check:** the email card's icon masks
  `/icons/ui/mail.svg`, paints `--accent-text`, and measures ≥ 3:1 on the card in each theme; no
  card loads `gmail.svg`.
- RF-5: WHILE the form is wide, THE SYSTEM puts Name and Email on one row, Subject and Message
  each across the form. — **Check:** at 1280 px Name and Email share a row with equal widths and
  Subject and Message span the form; at 390 px every field spans the form.
- RF-6: THE SYSTEM shows each field's name small inside the field's box, visible while the field
  holds text, at 4.5:1 or more against the field. — **Check:** a rendered test types into every
  field and fails unless each label text's box lies inside its field's box, top-left, still
  visible, ≥ 4.5:1 on the field's fill, in each theme.
- RF-7: THE SYSTEM makes the send button as wide as the form, with a send icon hidden from
  assistive tech. — **Check:** the button's width equals the form's content width within 1px and
  it holds one aria-hidden icon before its text.

## Non-functional requirements

- Spec 015 holds, settled by its guards: accessible names per field, required and maxlength,
  the honeypot, plain and enhanced outcomes, errors described by their field, focus on the first
  invalid field, the privacy line, contrast, no scroll at 360 px.
- Spec 018 holds for GitHub and LinkedIn (logo per theme, visible on its card) and for every card
  (copy feedback, live announcement, both buttons).
- Bordered controls keep AGENTS' hover: the field's box rests in `--control-border` and turns
  `--accent-text` on hover; its focus shows the `--focus-ring` outline.

## Edge cases

- A failed or invalid outcome: the error text and the 2px invalid border sit on the field's box,
  not on the borderless input — RF-6, spec 015 guards.
- The longest card value (the LinkedIn URL) in a half-width card at 1280 px ellipsizes, as today.

## Guards this changes (AGENTS: never silently)

- `e2e/contact-cards.spec.ts` RF-1 (spec 018) checks each card's logo per theme: the email card
  now has a glyph, not a logo, so it is checked by RF-4 instead; GitHub and LinkedIn unchanged.

## Out of scope

- The section title's icon (paper plane in the mockup; spec 008 chose the envelope).
- The location card (stays out, spec 018).

## Done when

`npm test` and `npm run test:e2e` green; each new guard shown red on today's section and by
injection; Contact seen in light and dark at 1280, 800 and 390 px beside the mockup, at rest and
with a field filled and one invalid, stopping for the owner's visual approval.

## Open questions

None.

# Spec 047 — The hero's phrases read as a flow on a phone

**Status:** implemented
**Size:** S
**Approved:** 2026-10-18 · one clarify round with the owner's decisions; previewed on mobile in both themes · 63 lines, 3 RF
**Implemented:** 2026-10-18 · commits `3460541` (pixels helper), `5edef54` (phrase pairs) on spec/047-hero-phrases-mobile · 5/5 tasks, `npm test` 338/338, e2e 346/346 · 3/3 RF, NFRs and edge cases validated by the SDD reviewer (1 px sweep 320–720); injections 1–6 red; owner visual approval
**Changed:** 2026-10-18 · "035 needs no change" replaced by the fact: 035's spec stands, its chevron test at e2e/hero-layout.spec.ts:92 narrows, proved by injection 5 · 67 lines

## Context and goal

Spec 035 made the hero's four phrases a flow: stacked with gold checks joined by a line on wide
screens, and a row with gold chevrons below that (035 RF-4). At 390×844 the row wraps as
"Ideas › Código › Soluciones" and then "› Resultados" alone on the next line, so it no longer reads
as one sequence. A row of four doesn't fit on a phone in either locale: at the phrases' size, with
the chevrons and gaps, the Spanish row is 402 px and the English 338, against 288 px of content
width at 360 and 318 at 390. Two phrases fit: the widest Spanish pair, "Soluciones › Resultados",
is about 246 px. Measured on the dev server on 2026-10-18.

## Actors

Visitors opening the home page on a phone, in either locale.

## Requirements (EARS)

- RF-1: WHILE the four phrases do not fit on one line, THE SYSTEM shows them two per line, in their
  order (owner, 2026-10-18). — **Check:** at 360 and 390 px, in both locales, the phrases occupy
  exactly two line boxes, the first holding the first and second phrases and the second the third
  and fourth.
- RF-2: THE SYSTEM joins the two phrases of each line with a gold chevron. — **Check:** at 360 and
  390 px a chevron in `--accent-text` sits between the two phrases of each line, clearing 3:1 at the
  worst pixel of the hero's ground under it per theme (the dark glow included, spec 009).
- RF-3: THE SYSTEM never starts a line of the phrases with a chevron. — **Check:** at 360 and 390
  px, in both locales, the first thing on each line box is a phrase's text.

## Non-functional requirements

- Both themes. Spec 035 RF-3 (the stacked flow with checks, three columns) is untouched; where the
  four fit on one line, the row keeps today's single line with its three chevrons.
- The phrases keep their italic and their markup order; screen readers read the four items as
  today.
- Spec 035 RF-4 ("the phrases sit below the role line and above the bio, at least two on one line,
  chevrons drawn") still holds: two per line is at least two, and the chevrons stay. 035's spec is
  unchanged, but its test `e2e/hero-layout.spec.ts:92`, which asserts a chevron on phrases 2–4,
  narrows to "every phrase sharing a line with the one before carries a chevron", since RF-3
  removes phrase 3's; injection 5 of the plan proves the narrowed test still catches a missing
  chevron.

## Edge cases

- A width where three would fit but four would not: still two per line. RF-1.
- A fifth phrase in the data later: RF-1 no longer pairs them evenly; it would be a finding for that
  change. RF-1.

## Out of scope

- The phrases' wording.
- The hero above 720 px.

## Done when

`npm test` and `npm run test:e2e` green; each new guard shown red by injecting today's wrap; the
hero read on the dev server at 360, 390 and 800 px in light and dark.

## Open questions

None. Resolved 2026-10-18: two phrases per line joined by chevrons, not the stacked column (owner,
2026-10-18). Line one ends without a chevron: "Ideas › Código" / "Soluciones › Resultados"
(owner, 2026-10-18).

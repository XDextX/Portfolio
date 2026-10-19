# Spec 046 — Experience on a phone, and its Spanish copy

**Status:** implemented
**Size:** S
**Approved:** 2026-10-18 · one clarify round with the owner's decisions; previewed on mobile in both themes · 70 lines, 4 RF
**Implemented:** 2026-10-18 · commits `580fb10` (accents), `cdd85ec` (phone layout) on spec/046-experience-mobile · 5/5 tasks, `npm test` 338/338, e2e 331/331 · 4/4 RF, NFRs and edge cases validated by the SDD reviewer; injections 1–6 red; owner visual approval
**Changed:** 2026-10-18 · RF-1 holds below 40rem instead of "while the card is a single column": from 40rem the section takes the period out of the card, so its row is empty at 800 px · 71 lines

## Context and goal

At 390×844 the experience card leaves the title column 182.4 px beside its 3rem icon tile (152.4
at 360), so "Desarrollador Full Stack" (226.7 px at 20 px bold) breaks into "Desarrollador Full /
Stack", and the company's suffix sits alone on a line. With the tile moved off the title's row the
title gets the header's full width, 244 px at 390 and 214 at 360: the role fits at 390 with 17.3 px
to spare, and is 12.7 px short at 360. The Spanish bullets in the experience data also lost their
accents: "Optimizacion", "indices", "Implementacion", "Diseno", "moviles", "Administracion".
Measured on the dev server on 2026-10-18.

## Actors

Visitors reading the experience section on a phone, in either locale.

## Requirements (EARS)

- RF-1: WHILE the viewport is narrower than 40rem, THE SYSTEM places the company's icon tile on the
  period's row, so the title takes the header's full width (owner, 2026-10-18). — **Check:** at 360
  and 390 px the tile's top lies within the period's row and the title's left edge equals the
  header's within 1 px; at 1280 px the header keeps today's layout.
- RF-2: WHILE the viewport is 390 px wide or more, THE SYSTEM shows each role on one line. —
  **Check:** at 390 px, in both locales, each role heading renders as a single line box.
- RF-3: IF a role or a company name wraps, THEN THE SYSTEM ends it on a line of at least two
  words, never on its legal suffix alone. — **Check:** at 360 and 390 px, in both locales, the last
  line box of every wrapped role or company holds two words or more, and is not only "S.A.",
  "S. A." or "A.".
- RF-4: THE SYSTEM spells the Spanish experience copy with its accents. — **Check:** a test lists
  every Spanish string in the experience data, finds none of the six unaccented words above, and
  finds "Optimización", "índices", "Implementación", "Diseño", "móviles" and "Administración".

## Non-functional requirements

- Both themes. The type keeps its size: no font shrinking to make a line fit.
- The timeline at 800 px and the desktop layout at 1280 px stay as they are.
- AGENTS' visual-language rules hold: radius by size class, hover is the gold border.

## Edge cases

- At 360 px "Desarrollador Full Stack" wraps (12.7 px short); RF-3 keeps "Stack" from ending it
  alone, so it breaks as "Desarrollador / Full Stack". A three-word role on two lines always has
  one single-word line; RF-3 only forbids it at the end. RF-3.
- "Ingeniero de Software" (209.4 px) fits at 360 with 4.6 px to spare; the English roles (193.5,
  173.7) fit. RF-2, RF-3.
- "Plantas y Flores Ornamentales S.A." (212.5 px) fits the 214 px at 360 by 1.5 px; if it wraps,
  RF-3 keeps "S.A." with a word. "SD Misiones de Costa Rica S. A." can break between "S." and
  "A."; RF-3 forbids "A." alone. RF-3.

## Out of scope

- Rewording any bullet beyond restoring accents.
- The company spelled "S. A." in one entry and "S.A." in the other: content, flagged for the
  owner.
- The two-entry history for 6+ years (Memory.md debt).

## Done when

`npm test` and `npm run test:e2e` green; each new guard shown red by injection; the section read
on the dev server at 360, 390, 800 and 1280 px in light and dark.

## Open questions

None. Resolved 2026-10-18: the icon tile moves onto the period's row below the single-column width
(owner, 2026-10-18); the one-line floor is 390 px, since the role cannot fit at 360 without
shrinking the type (coordinator, from the measurements).

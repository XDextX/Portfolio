# Spec 048 — Touch targets a finger can hit

**Status:** implemented
**Size:** M
**Approved:** 2026-10-18 · one clarify round with the owner's decisions; previewed on mobile in both themes · 93 lines, 4 RF
**Implemented:** 2026-10-18 · nine commits `0da26c6`..`372bada` on spec/048-touch-targets, one per component, the guard last · 10/10 tasks, `npm test` 325/325, e2e 278/278 · 4/4 RF, NFRs and edge cases validated by the SDD reviewer; injections 1–13 red; owner visual approval of T-2 and of the whole spec, breadcrumbs adjusted at the owner's request
**Changed:** 2026-10-18 · stale edge case replaced: 045 keeps the contact controls on the card's one row (045 RF-5), measured at 048's sizes · 94 lines

## Context and goal

At 390×844 several controls are smaller than a fingertip. Measured on the dev server on
2026-10-18, each control's box, the same at 390 and at 1280 px with a fine pointer:

| Control | Box (width × height) |
|---|---|
| Language control (header; the `select` inside it is 37 × 19) | 106 × 30 px |
| Theme button (header) | 34 × 30 px |
| Skills view toggle, each button | 32 × 32 px |
| Contact copy button / open button | 71.9 × 32 (Spanish; 61.2 wide in English) / 34 × 32 px |
| Project page "Código" and "Demo" | 42 px tall |
| Project page back button | 37.2 px tall |
| Contact form submit | 42 px tall |
| Breadcrumb links | 17 px tall |

Under WCAG 2.5.8's 24 × 24 px minimum (AA), the breadcrumb links miss by height. Under 2.5.5's
44 × 44 px (AAA), which is also Apple's guideline (44 pt), every control in the table misses.

## Definitions

- **Touch device**: a device whose primary pointer is coarse (`pointer: coarse`), whatever its
  width (owner, 2026-10-18).
- **Control's box**: the box a visitor sees as the control. For the language control it is the
  labelled wrapper around the `select`, not the `select` element.
- **Target**: the area where a tap activates the control. It may be larger than the control's box.
- **Exempt link**: a link inside a sentence of running text (the bio, a project's description), or
  any link inside the README's HTML, which is the repository's content.

## Actors

Visitors on a phone or tablet, in either theme and locale.

## Requirements (EARS)

- RF-1: WHILE on a touch device, THE SYSTEM gives every control's target at least 44 × 44 px
  (owner, 2026-10-18). — **Check:** with a coarse pointer at 390×844, on `/`, `/proyectos` and a
  project page, every visible `a`, `button`, `select`, `input`, `textarea` and `summary` that is not
  an exempt link has a target at least 44 px wide and 44 px tall.
- RF-2: WHILE on a touch device, THE SYSTEM keeps targets from overlapping. — **Check:** in the same
  pass, no two targets intersect, so a tap on one never activates its neighbour.
- RF-3: WHILE the primary pointer is fine, THE SYSTEM keeps today's control boxes. — **Check:** at
  1280×800 with a fine pointer, every control in the table keeps the box measured there, within
  1 px.
- RF-4: THE SYSTEM keeps the language control's box and the theme button the same height as each
  other, with a fine and with a coarse pointer. — **Check:** their rendered heights are equal in
  both passes (AGENTS: two controls side by side state their `block-size`).

## Non-functional requirements

- Both themes and both locales; RF-1 is measured in each.
- AGENTS' visual-language rules hold: hover is the gold border; radius follows size class, so a
  control that grows takes its size class's radius, and no square control becomes a pill; every
  control keeps its `:focus-visible` ring in `--focus-ring`.
- A label swap keeps its stacked-cell sizing (spec 018): growing the target does not resize it
  between states.

## Edge cases

- A tablet in landscape at 1280 px with a coarse pointer: RF-1 applies; the layout may grow where
  the targets need it. RF-1.
- A laptop with a touchscreen whose primary pointer is fine: RF-3 applies. RF-3.
- A control whose drawn size must stay small (the breadcrumb's text): the target grows without the
  text growing. RF-1.
- The contact card's copy and open buttons are in RF-1's scope. Spec 045 keeps them on the card's
  one row (045 RF-5) and is measured at this spec's sizes, so 048 lands first. RF-1.
- The project filters' chips and the "Ver todos" links are controls too, though not in the table:
  RF-1's pass measures them. RF-1.
- A hidden control (`display: none`, a closed menu) is not measured. RF-1.
- The language control: its target counts only where a tap reaches the `select` itself, since a
  tap on the wrapper's text focuses the `select` without opening it. RF-1.

## Out of scope

- Exempt links (the WCAG 2.5.8 inline exception, and the README's content).
- Spacing and layout on fine-pointer devices beyond RF-3.

## Done when

`npm test` and `npm run test:e2e` green; each new guard shown red by injection; the three pages
read on the dev server with a coarse pointer at 390 px, and with a fine pointer at 1280 px, in
light and dark.

## Open questions

None. Resolved 2026-10-18: a 44 × 44 px floor, on a coarse primary pointer only, desktop unchanged
(owner, 2026-10-18).

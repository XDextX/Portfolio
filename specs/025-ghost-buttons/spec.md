# Spec 025 — Ghost buttons readable in both themes

**Status:** implemented
**Size:** M
**Approved:** 2026-10-16 · one clarify round, one minor note (focus ring already guarded); approved with its plan and tasks · 73 lines, 4 RF
**Implemented:** 2026-10-16 · commit `09589c9` · 3/3 tasks, `npm test` 240/240, e2e 117/117 · 4/4 RF, NFRs and edge cases validated; both buttons seen in light and dark, at rest and hovered, owner-approved; 375px checked, no overflow; 4 injections red

## Context and goal

The project page has two outline ("ghost") buttons: the back link and the code link. Measured on
2026-10-16 on a project page, each against its own fill:

| Button | Theme | Text on its fill | Border | Hover |
|---|---|---|---|---|
| back (`btn ghost`) | light | 1.00:1 (navy on navy) | navy | nothing changes |
| code (`btn btn--ghost`) | light | 1.49:1 (ink on navy) | transparent | nothing changes |
| back | dark | 6.66:1 | gold | nothing changes |
| code | dark | 10.28:1 | transparent | nothing changes |

The base button paints a navy fill that the `ghost` rules never clear, and `btn--ghost` has no
rule at all: one look under two names, neither finished. In light both buttons are unreadable on
every project page, and on the "project unavailable" state from spec 021. The goal: one ghost
button, readable in both themes, behaving on hover like every other bordered control.

## Actors

Visitors on a project page, in either theme.

## User stories

- US-1: As a visitor in the light theme, I want to read the back and code buttons so that I can
  leave the page or open the repository.

## Requirements (EARS)

- RF-1: THE SYSTEM draws a ghost button's text at 4.5:1 or more against what is behind it, at
  rest and hovered, in both themes. — **Check:** a rendered test measures the back and code
  buttons on a project page against their own ground, in each theme and state, and fails under
  4.5:1.
- RF-2: THE SYSTEM draws a ghost button's border at rest at 3:1 or more against what is behind
  the button, in both themes. — **Check:** the same test measures the resting border of both
  buttons against the ground behind them and fails under 3:1.
- RF-3: WHEN a ghost button is hovered, THE SYSTEM turns its border to the accent without moving
  it. — **Check:** the same test hovers each button and fails unless the border reads the
  theme's accent and the button's box is where it was at rest.
- RF-4: THE SYSTEM gives every ghost button one class. — **Check:** a rendered test fails if any
  element on a project page carries the old `ghost` class without the one ghost class.

## Non-functional requirements

- Visual language rules hold: the border rests in the control-border colour and turns the accent
  on hover, nothing lifts, the focus ring is the theme's (already settled for every outline by
  `tests/visual-language.test.ts`).
- No other button changes.

## Edge cases

- The code button sits on the sidebar card, not on the sheet — RF-1 and RF-2 measure against the
  ground actually behind each button.
- The back button on the "project unavailable" state uses the same class — RF-4.

## Out of scope

- The lift on hover of the other `.btn` variants.
- The disabled "no live demo" pill.

## Done when

`npm test` and `npm run test:e2e` green; each guard shown red by injection; both buttons seen in
light and dark, at rest and hovered, stopping for the owner's visual approval.

## Open questions

None.

# Spec 007 — Primary button: light gold in dark, text colour per theme

**Status:** implemented
**Size:** M
**Approved:** 2026-10-15 · two clarify rounds under the new process, no blocker left; owner decisions: dark ink brand navy, shared default deleted, Demo included · 143 lines, 4 RF
**Implemented:** 2026-10-15 · commits `956a13b` `63b317a` `3574d65` (rules, hook) and `ecec84e` `1bf25f8` (helper, fix) · 8/8 tasks, `npm test` 164/164, e2e 7/7, build green · 4/4 RF and NFRs validated; 14 injections red, 9 dropped, 12 replaced by 12b; seen in both themes at 1280 and 375px

## Context and goal

The owner's design shows the primary button in the dark theme as a light gold fill
with dark text; today it is dark gold with white text in both themes. That is not
a taste choice: six declarations write a literal white on the accent surface, so
the fill is pinned dark by a working rule and its guard. When one broken comment
opener dropped the dark fill (fixed in `26ea361`), three buttons rendered white on
light gold at 1.66:1 with every guard green.

The owner adopted the proposal (2026-10-15): remove every literal white on the
accent surface, give the text on it its own colour per theme, and move the guard
from "the surface is dark" to what it protected all along — the text on the
surface clears 4.5:1 in both themes.

## Definitions

- **Accent surface:** the gold fill of the primary action — `#7A5D10` in both
  themes today.
- **Button text colour:** the colour of everything drawn on the accent surface,
  including a transient label such as the contact card's "copied" or error text.
- **Accent-surface consumer:** any element whose fill is the accent surface, at
  rest or on hover. After this spec: the hero's CV download, "Ver todos" under the
  projects, the 404's "Ir al inicio", the project page's "Demo", and the contact
  card's icon buttons on hover. A future primary button (a form submit, a toggle)
  is one by the same definition.
- **Primary button:** a consumer whose fill is the accent surface at rest — the
  first four above. "Demo" carries the primary class today but renders the navy
  default button with the link ink, `#16202C` on `#243972`, 1.49:1 in light.

## Actors

One: the visitor, in either theme.

## User stories

- US-1: As a visitor in the dark theme, I want the primary action to be a light
  gold button with dark text, so that the one thing the page asks of me is the
  brightest fill on it.
- US-2: As the owner, I want the text on the accent surface chosen per theme, so
  that changing the fill can never again silently put white on light gold.

## Requirements (EARS)

- RF-1: THE SYSTEM draws the button text colour at 4.5:1 or above against the
  accent surface in each theme. — **Check:** a test resolves both values in each
  theme to an opaque colour and fails below 4.5:1, or on a value it cannot resolve.
- RF-2: WHILE the dark theme is active, THE SYSTEM fills the accent surface with a
  gold lighter than the button text colour. — **Check:** a test resolves both in
  dark and fails unless the fill's relative luminance is above the text's (brand
  gold under brand navy text, 6.66:1).
- RF-3: THE SYSTEM paints every accent-surface consumer's text in the button text
  colour. — **Check:** an e2e test reads the computed `color` of each consumer
  (icon buttons hovered) in both themes and fails on any that differs from the
  resolved button text colour.
- RF-4: WHILE a primary button is hovered, THE SYSTEM keeps its label at 4.5:1 or
  above against its fill as rendered over the sheet. — **Check:** an e2e test
  composites the hovered computed colours at the computed opacity in both themes
  and fails below 4.5:1.

## Non-functional requirements

- **Light renders unchanged, except "Demo"**, which moves from the navy `.btn`
  to the accent surface. — **Check:** the RF-3 e2e test also asserts each
  primary button in light computes fill `#7A5D10` and text white (6.18:1).
- **Each theme defines the button text colour itself**, never inheriting it from
  the other or from a shared default. — **Check:** a test fails when either theme
  file does not declare the button text colour itself (a shared default does not
  count).
- **The accent surface has no shared default**: it is declared in the two theme
  files only. — **Check:** a test fails when the shared token layer declares it.
- **One hue in dark, one value one name.** The dark text is the brand navy, an
  alias of the brand colour token; the dark fill is an alias of the brand gold.
- **No stale count.** Comments say "three" and "four" places hardcode white, the
  guard's failure message says "three"; there are six. Each comment that counts
  the literal or says the surface "stays dark" changes with the code, or goes.
- No new dependency, font or asset.

## Edge cases

- **Hover by opacity.** Hover contrast is not rest contrast: light measures 4.75,
  a 0.25 margin; dark 5.51 (6.66 at rest). RF-4.
- **Transient label on an icon button**, shown for 1.5 s while still hovered: it
  takes the button's own colour, so RF-3 on the hovered button covers it.
- **Icon-button hover border in dark** is the accent text, which then equals the
  new fill: the border disappears into it. The fill against the card (5.90) still
  marks the hover. No RF; noted for the plan.

## Retired guards

- `tests/visual-language.test.ts`, "a surface that white text sits on is dark in
  both themes": its premise (white on the fill) is what this spec removes.
  Replaced by RF-1, which reads more, not less — it follows the whole alias chain
  and fails, never skips, on what it cannot resolve.

## Prerequisites

- The `AGENTS.md` rule "`--accent-surface` stays dark in both themes" amended in
  its own `docs:` commit: the fill is a theme choice, the text on it is a
  per-theme token (proposed name `--accent-surface-text`), settled by RF-1.
- Constitution 7 amended and the e2e suite in the pre-commit hook (block
  cross-cutting decision), before RF-3 and RF-4 can be checks.
- Spec 016 owns the focus ring (`--focus-ring`); this spec does not touch it.

## Out of scope

- The hero redesign (spec 010).
- Hover by opacity on the primary buttons is neither hover `AGENTS.md` allows.
  Found here, not changed.
- The light accent text is commented as 6.4:1 on the sheet; it measures 6.01.
- Forced-colours mode; any other gold token changing value.

## Done when

`npm test` and the e2e suite green, each new guard shown red first; `npm run
build` green; every consumer seen at rest and hovered in light and dark, at 1280
and 390 wide, on `/`, a project page and the 404.

## Decision

2026-10-15, owner:

- **Dark ink:** the brand navy `#243972` (6.66:1 at rest, 5.51 hovered). Discarded:
  `#16233F` (9.41), because it equals the "behind the sheet" ground and would
  borrow a ground as ink; a new navy literal, because it adds a value.
- **Shared default deleted:** the accent surface lives only in the two theme files.
  Discarded: keeping `#E3C770` in the shared layer, a second name for the brand gold
  and the inheritance that caused the 1.66:1 bug.
- **"Demo" joins the accent surface here.** Discarded: a separate fix, which would
  leave 1.49:1 in light shipping.

## For the plan

- The guard follows a `var()` chain across files (`--brand-accent` lives in the
  shared tokens); a cycle or dead end fails. Comments are stripped before reading.
- RF-1/RF-2 injections: white as dark text (1.66), the old dark fill, an
  unresolvable `var()`. RF-3: restore one `#fff`, including a hover-only one.
- Measure after transitions settle; the copy label needs a click while hovered.

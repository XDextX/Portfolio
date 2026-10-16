# Spec 017 — Control border contrast

**Status:** implemented
**Size:** M
**Approved (superseded by the 2026-10-15 change below):** 2026-10-15 · two clarify rounds, no blocker left, trimmed to Size S; owner decision: controls only · 94 lines, 3 RF
**Approved:** 2026-10-15 · re-approval after the hover change of requirement (RF-3 new, 1.5:1 floor to RF-4, Size M); round 3 clarify, its blocker discarded (the e2e amendment is a prerequisite of the whole redesign) · 111 lines, 4 RF
**Implemented:** 2026-10-15 · commits `01d4877` (docs) and `58c0fb7` (fix) · 7/7 tasks, `npm test` 173/173, e2e 20/20, build green · 4/4 RF and NFRs validated; 19 injections red; seen in both themes on /, /proyectos and the 404

## Context and goal

Every bordered control on the site draws its edge in the soft fill `--neutral-200`:
1.27:1 on the light sheet, 1.30 on a light card, 1.54 on the dark sheet, 1.37 on a dark
card. WCAG 1.4.11 does not require 3:1 here, since each control also carries a label
or an icon, but the owner chose 3:1 (2026-10-15). Spec 009 depends on this one: it
holds control borders at their floor and leaves decorative borders unheld, so while
control borders sit under 3:1 its glows cannot lighten where a control renders.

## Definitions

- **Bordered control:** an interactive element whose edge at rest is a 1px border in
  the soft fill. Most read `--color-border`; the theme toggle's border is overridden
  with `--neutral-200` in each theme file, so the change must reach those overrides.

  | Control | Sits on | Light today | Dark today |
  |---|---|---|---|
  | Language selector, theme toggle, hero social buttons, view-toggle group, skill chip (a link, list view), "show more" toggle | sheet | 1.27 | 1.54 |
  | Project card action buttons, contact copy/open buttons | card | 1.30 | 1.37 |

- **Control boundary colour:** the one colour those borders are drawn in at rest,
  defined in each theme file.
- **Hover gold:** the colour a control's border turns on hover, `--accent-text`
  (`#7A5D10` light, `#E3C770` dark).

## User stories

- US-1: As a visitor in either theme, I want a control's edge to stand out from the
  ground it sits on, so that I can tell what I can act on.

## Requirements (EARS)

- RF-1: THE SYSTEM draws the resting border of every bordered control in the control
  boundary colour. — **Check:** a test reads each listed control's resting border,
  the theme files' toggle overrides included, and fails on any other colour, naming
  the control.
- RF-2: THE SYSTEM gives the control boundary colour at least 3:1 against the sheet and
  against the card, in each theme. — **Check:** a test resolves the colour and both
  grounds' tokens per theme and fails below 3:1.
- RF-3: WHEN a visitor hovers a bordered control, THE SYSTEM turns its border the hover
  gold. — **Check:** an e2e test hovers each listed control in both themes and fails,
  naming the control, unless its computed border colour equals the resolved gold
  (today the language selector and the view-toggle group fail).
- RF-4: THE SYSTEM keeps the hover gold at least 1.5:1 from the resting border, in each
  theme. — **Check:** the RF-2 test resolves both per theme and fails below 1.5:1.

Why 1.5:1: the room between the 3:1 floor and the gold (5.90–6.66) is about 2:1, and
1.5 rejects a rest border that matches the gold.

RF-1 reads stylesheets (constitution 8): which colour a rule declares is the data; RF-3
needs a rendered hover, so it is e2e (prerequisite below). Guards added: RF-1, RF-3 (e2e), and one contrast test for RF-2, RF-4 and the
hue NFR's check. Retired: none; the both-themes token guard and the hover guards stay.

## Non-functional requirements

- **Hue:** the control boundary colour stays in its theme's neutral hue, with no new
  hue in dark and a cool canvas in light. — **Check:** the contrast test fails when the
  resolved HSL hue is more than 10° from that theme's `--neutral-200` (212° light,
  220° dark).
- Width, style and radius stay as they are.
- No new dependency (constitution 7).

## Edge cases

- **The light skill chip** is filled with `--neutral-200`, its own border today (1.00
  border to fill); RF-2 measures the ground outside, not the fill.

- **Touch.** A tap applies `:hover` and keeps it, so a tapped control keeps its gold
  border until the next tap elsewhere — accepted, as the theme toggle does today; the
  `(hover: hover)` gate is for the skills-row icon recolour only.

## Out of scope

- **The contact card:** an `<article>`, not a control; its gold hover is the card
  signal the project cards share. Its links and buttons are in scope.
- The focus ring (016); the primary and 404 buttons (007); the view-toggle active state
  (012); the project-page back button, already 6+:1 (navy or gold border).
- The avatar tile (not a link) and its opt-in ring; the GitHub topic chip (no border).

## Prerequisites

- Constitution 7 amended to admit the e2e suite (cross-cutting decision); RF-3 is an
  e2e check.
- Spec 016 implemented (its colour helpers are reused).

## Done when

- An `AGENTS.md` rule for control borders names the test settling it, in its own
  `docs:` commit before the code (constitution 3).
- `npm test` and `npm run build` green, each new guard shown red by injecting its
  violation and reverted by explicit path (constitution 4).
- `/`, `/proyectos` and the 404 seen from a running dev server in both themes, and the
  owner approves the borders before the commit.

## Decision

- 2026-10-15 · Controls only. Decorative borders (cards, the card divider, the
  avatar tile, the topic code, the contact card) keep 1.27/1.30 light and 1.54/1.37
  dark; spec 009 does not hold them. Discarded: raising `--color-border` for every
  border, which turns every card hairline from about 1.3 to 3.2 — a visual change
  009 does not need. Owner decision.
- 2026-10-15 · Change of requirement: every bordered control turns its border gold on
  hover (RF-3, new); the 1.5:1 rest-to-gold floor moves to RF-4. The language selector
  and the view-toggle group have no gold hover today. Owner decision; re-approval due. Size S → M: four RF.

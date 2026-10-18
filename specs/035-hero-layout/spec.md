# Spec 035 — Hero arranged like the proposal

**Status:** implemented
**Size:** M
**Approved:** 2026-10-17 · one clarify round, no blocking finding; approved with its plan and tasks · 84 lines
**Implemented:** 2026-10-17 · commits `7f911dd` (bio, «Email»), `18a0f5c` (tile, role size), `1f171d4` (phrases flow), `6d3d33a` (phone) · 4/4 tasks, `npm test` 259/259, e2e 162/162 · 7/7 RF (RF-3 as changed, RF-7 added), NFRs and edge cases validated (light and dark at 1280, 800 and 390 beside the proposal, owner visual approval after two adjustments); 10 injections red

## Context and goal

The design proposal (2026-10-15 mockups) draws the hero as a framed avatar beside the name, a
larger role line, a short bio and the actions, with the four phrases stacked in a column on the
right. Today the avatar is a 180px square centred on the text, the role line is 13px, the bio runs
four lines of other copy, the phrases sit in a row under the name, and the email button reads
«Correo». Decided with the owner on 2026-10-17:

- No background illustration: the avatar stays the hero's only picture (spec 010 RF-1).
- The phrases move to a column on the right, stacked, in IBM Plex Sans italic — no handwriting
  font (AGENTS: Plex for everything). Below the width that holds three columns they return under
  the name, in today's row.
- The bio takes the proposal's copy, and its English translation.
- The avatar sits in a framed tile, smaller, top-aligned with the name; the role and location
  go up one step; the hero's email button reads «Email».
- Kept: the separator under the hero, the actions' order and styles, the name's colours.
- Changed at the visual review (owner, 2026-10-17): stacked alone, the phrases lost their order
  and read as a list, not a flow; a gold line with a check at each phrase joins them (RF-3). The
  check is Tabler's `circle-check` (v3.49.0, recorded in the NOTICE); being hollow, the line is
  drawn as segments between checks so it never crosses one.
- Added at the visual review (owner, 2026-10-17): on a phone the tile sits beside the name
  instead of above it (RF-7).

## Actors

Visitors landing on the home page, in either theme and locale.

## Requirements (EARS)

- RF-1: THE SYSTEM draws the avatar inside a framed tile whose top aligns with the name's. —
  **Check:** at 1280 px the tile carries a visible border in `--color-border` and padding around
  the image, its top within 4px of the name's top, and the image box at most 140px square.
- RF-2: THE SYSTEM draws the role and the location at `--fs-base`. — **Check:** both compute the
  token's size, per theme.
- RF-3: WHILE the hero is wide enough for three columns, THE SYSTEM stacks the four phrases in a
  column to the right of the text, one per line, in order, in italic, joined as a flow: a gold
  check at each phrase and a gold segment from each check to the next. — **Check:** at 1280 px each
  phrase sits below the previous one, all left of the sheet's content edge and right of the bio's
  box, `font-style: italic`; each phrase draws the `circle-check` mask in `--accent-text`; each
  phrase but the last draws a segment in `--accent-text` reaching the next check; no chevron.
- RF-4: WHILE the hero is narrower than that, THE SYSTEM shows the phrases under the name in a row
  with the gold chevrons, as today. — **Check:** at 390 px the phrases sit below the role line and
  above the bio, at least two on one line, chevrons drawn.
- RF-5: THE SYSTEM shows the proposal's bio in Spanish and its translation in English. —
  **Check:** the bio's text equals `ABOUT.bio[locale]`, and `ABOUT.bio.es` is the proposal's
  sentence: «Desarrollo soluciones de software completas, desde la arquitectura hasta su puesta
  en producción. Más de 6 años de experiencia trabajando con .NET, Java, TypeScript y tecnologías
  en la nube.»
- RF-6: THE SYSTEM labels the hero's email button «Email» in Spanish, leaving the contact card
  and the form's «Correo» as they are. — **Check:** the hero's email button reads «Email» in both
  locales; the contact card label and the form field keep `about.social.email`'s text.
- RF-7: WHILE the hero is a single column (720 px or narrower), THE SYSTEM places the avatar tile
  beside the name, with the phrases, bio and actions full width below. — **Check:** at 390 px the
  tile sits left of the name, its top within 4px of the name's, and the bio starts left of the
  name's left edge (it spans under the tile).

## Non-functional requirements

- Spec 010 holds: the avatar the only picture, the name's colours and contrast, the phrases one
  list of four in order and italic, the button heights matching.
- The phrases column, the bio and every text clear their contrast floors in both themes, as
  today (spec 009's glow check in dark included).
- No new font file, no new image, no new token.

## Edge cases

- A long phrase in English at the three-column width: it wraps inside its column, never under the
  bio — RF-3.
- 800 px: whichever layout the width allows, nothing overlaps — RF-3, RF-4.

## Guards this changes (AGENTS: never silently)

- None expected; `e2e/hero.spec.ts` reads the phrases as a list and the avatar as the only image,
  both kept. Anything it asserts about the row layout is retargeted to RF-4's narrow width.

## Out of scope

- A background illustration, a handwriting font, the theme toggle's design.
- The contact section's labels.

## Done when

`npm test` and `npm run test:e2e` green; each new guard shown red by injection; the hero seen in
light and dark at 1280, 800 and 390 px beside the proposal, stopping for the owner's visual
approval.

## Open questions

None.

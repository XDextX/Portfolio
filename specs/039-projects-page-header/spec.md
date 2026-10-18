# Spec 039 — The projects page header like the proposal

**Status:** implemented
**Size:** S
**Approved:** 2026-10-18 · one clarify round, minor findings applied; approved with its plan and tasks · 68 lines
**Implemented:** 2026-10-18 · commits `e19af32` (band variant), `8072b3d` (header) · 3/3 tasks, `npm test` 269/269, e2e 196/196 · 4/4 RF, NFRs and edge cases validated (light and dark at 1280, 800 and 390, owner visual approval); 5 injections red. Code by the implementer agent (Sonnet), verified by the coordinator

## Context and goal

The design proposal for /proyectos (2026-10-18) opens the page with a header: a gold tile holding
the projects glyph beside a large two-tone title, the section's line under it, and the soft-shape
background of the home hero behind it. Today the page shows the breadcrumb and a plain gold
«Proyectos». Decided with the owner on 2026-10-18: the cards stay as they are; the header takes
the tile, the title and the line, and the band of spec 036; no illustration; the category filters
are spec 040.

## Actors

Visitors on /proyectos, in either theme and locale.

## Requirements (EARS)

- RF-1: THE SYSTEM heads /proyectos with the projects glyph in a gold tile beside the page title. —
  **Check:** the tile sits left of the `h1` on one row at 1280 px, carries the `folder` mask the home
  section title uses (one glyph, one meaning), hidden from assistive tech, its fill the accent
  surface and its glyph the accent-surface ink at 3:1 or more, per theme.
- RF-2: THE SYSTEM draws the title in ink with its gold word in gold, as the locale string marks it.
  — **Check:** the `h1`'s accessible name is the plain title; the marked word renders in
  `--accent-text` and the rest in `--text-color`, each at 4.5:1 or more on the sheet, per theme.
- RF-3: THE SYSTEM shows the section's line under the title. — **Check:** a paragraph under the
  `h1` reads `projects.lead` in each locale, capped by `--measure`.
- RF-4: THE SYSTEM draws the band of spec 036 behind the header, from the sheet's top to the
  header's bottom. — **Check:** at 1280 and 390 px the band's box matches the sheet's left, right
  and top and the header's bottom within 1px; every text, icon and control in it clears its floor
  over the band at the worst pixel (the spec 036 pixel check, reused).

## Non-functional requirements

- The cards, the grid and the topic note keep their layout (spec 030); the breadcrumb stays.
- The band is the same component and definition as the hero's: no second copy of the shapes.
- The `h1` keeps its `transition:name`, so the home title still travels to this page.

## Edge cases

- English: «Projects» with its own marked word — RF-2.
- An API failure: the header renders, the error replaces the grid — RF-1 to RF-4.

## Guards this changes (AGENTS: never silently)

- `e2e/hero-background.spec.ts` asserts no band off the home page (spec 036 RF-1). /proyectos now
  has one: that check narrows to pages without a header band (the project detail page), and
  RF-4 here covers /proyectos.
- Found during implementation: a 340px header crops the 2000×744 shape box so that the hero's
  lower-left tile (gold in dark) sat under the breadcrumb, the title and the line (1.00–1.88:1). That
  tile is now marked hero-only (`only: 'hero'` in `heroShapes.ts`) and `HeroBackground` takes a
  `variant`; the header draws the rest. The cards keep every shape.

## Out of scope

- The proposal's mid-word colour split («Pro» / «yectos»): the title follows the locale's whole-word
  gold marking every section title uses.
- The illustration and the handwritten phrases; the filters (spec 040); the cards.

## Done when

`npm test` and `npm run test:e2e` green; each new guard shown red by injection; /proyectos seen in
light and dark at 1280, 800 and 390 px beside the proposal, stopping for the owner's visual
approval.

## Open questions

None.

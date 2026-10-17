# Spec 030 — Projects section arranged like the proposal

**Status:** implemented
**Size:** M
**Approved:** 2026-10-17 · one clarify round, one finding applied (the spec 007 primary-consumer entry and the .btn-action.primary rules); approved with its plan and tasks · 84 lines, 7 RF
**Implemented:** 2026-10-17 · commit `4ad165e` · 4/4 tasks, `npm test` 237/237, e2e 138/138 · 7/7 RF, NFRs and edge cases validated (home and /proyectos, light and dark at 1280, 800 and 390 beside the mockup, owner visual approval); 7 injections red

## Context and goal

The design proposal (2026-10-15 mockups) heads Projects with the title, a one-line description
and a "Ver todos →" button on the same line, then four equal cards in one row: a compact image
with the language badge in its top-right corner, the name in ink, the description, tags, and two
equal buttons, "Código" with GitHub's mark and "Demo" with an external arrow. Today the cards run
three per row at unequal heights, with a tall placeholder, a grey badge top-left, a gold name,
small buttons, the update date, and "Ver más proyectos" and "Ver todos" below the grid. Decided
with the owner on 2026-10-17: the badge top-right in the site's neutral tones; no date on the
card; only "Ver todos", in the header, and the home shows one row of four; the mockup's line as
the header description. Kept from 2026-10-15: no screenshots (the CSS placeholder stays), no
featured set, the title "Proyectos", "Demo" only where the repository has a homepage.

## Actors

Visitors browsing the projects on the home page and on /proyectos, in either theme.

## Requirements (EARS)

- RF-1: THE SYSTEM heads the home projects section with the title, the description line and a
  "Ver todos" link to /proyectos, on one row at 1280 px. — **Check:** at 1280 px the three share a
  row, the link ends at the section's content edge and points to /proyectos, and the line reads
  the locale's text in each locale; at 390 px they stack in that order.
- RF-2: THE SYSTEM shows at most four projects on the home page, with no control to reveal more.
  — **Check:** the home renders at most four cards and no show-more control, in both locales.
- RF-3: THE SYSTEM lays out the project cards four per row at 1280 px, every card in a row the
  same height. — **Check:** on the home and on /proyectos at 1280 px, up to four cards share each
  row and their heights differ by at most 1px.
- RF-4: THE SYSTEM places the language badge in the placeholder's top-right corner, and keeps the
  placeholder compact. — **Check:** the badge's box ends within 12px of the placeholder's right
  edge and starts within 12px of its top; the placeholder is at most 96px tall at 1280 px.
- RF-5: THE SYSTEM gives a card's actions equal widths across the card, "Código" with GitHub's
  mark and "Demo" with an external arrow, both marks hidden from assistive tech. — **Check:** the
  action links fill the card's content width in equal parts (a lone "Código" fills it alone),
  "Código" holds the GitHub glyph and "Demo" the arrow, both aria-hidden.
- RF-6: THE SYSTEM draws the project name in the ink colour at 4.5:1 or more on the card. —
  **Check:** the name's colour equals `--text-color` and measures ≥ 4.5:1 on the card, per theme.
- RF-7: THE SYSTEM shows no update date on the card. — **Check:** no card renders a date element.

## Non-functional requirements

- Spec 014 holds, settled by its guards: the placeholder with the language logo or the generic
  mark, the badge text and contrast, no project image, the resolved description, "Demo" only for
  an http(s) homepage.
- Visual language: the "Ver todos" link and the action buttons rest in `--control-border` and
  turn the accent on hover, with nothing lifting.
- The project page (/proyectos/<name>) keeps its date and metrics; only the card drops the date.

## Edge cases

- Fewer than four repositories: the row holds what there is, at the same card width — RF-3.
- A repository without a homepage: "Código" alone across the card — RF-5.
- An API failure: the error message replaces the grid; the header keeps its link — RF-1.

## Guards this changes (AGENTS: never silently)

- `tests/viewtransitions.test.ts` asserts `data-projects-toggle` in `ProjectsSection` and
  `ProjectsFooter`: the toggle and its component go, so those assertions are retired; the
  section's "no global ids" check stays.
- `e2e/primary-button.spec.ts` (spec 007) lists "Ver todos" (`.btn-action.primary`) among the known
  primary consumers: it becomes an outlined button, so that entry goes; the guard's discovery of
  any element painted with the primary fill stays. The `.btn-action.primary` rules lose their
  only reader and are deleted.
- Found during implementation: `e2e/control-borders.spec.ts` (spec 017) and
  `e2e/dark-glows.spec.ts` (spec 009 RF-6) measured the show-more toggle; both now measure the
  "Ver todos" link (`.projects-all`), the section's bordered control, so neither loses coverage.
- `e2e/project-cards.spec.ts` (spec 014) expected every repository on the home; it now expects
  `min(4, repositories)` there and all of them on /proyectos.
- `tests/markup.test.ts`'s scanner self-test quoted the toggle's `childNodes` note as its sample;
  that note went with the toggle, so the sample is now a fixture in the test.

## Out of scope

- Screenshots, a featured set, the "destacados" title word, an "En progreso" badge (2026-10-15).
- The project page's own layout.

## Done when

`npm test` and `npm run test:e2e` green; each new guard shown red on today's section and by
injection; the section seen on the home and on /proyectos, light and dark, at 1280, 800 and
390 px beside the mockup, stopping for the owner's visual approval.

## Open questions

None.

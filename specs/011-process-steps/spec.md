# Spec 011 — "Lo que construyo" as four process steps

**Status:** implemented
**Size:** M
**Approved:** 2026-10-15 · two clarify rounds, no blocker left; owner decisions: copy (US spelling), step 2–4 colours, stacked below 1131 px, 012 yields the glyphs · 262 lines, 8 RF
**Changed:** 2026-10-15 · owner decision: the tag radius is `--radius-xs` (2 px), not the skill chip's 4 px (Interface NFR)
**Implemented:** 2026-10-15 · commits `7684f4e` (docs) and `7d4b0bc` (feat) · 9/10 tasks before this record, T-10 here · `npm test` 182/182, e2e 55/55, build green · 8/8 RF, NFRs and edge cases validated; 17 injections red, 7b replaced by 7b'; LCP never this section; seen in light and dark, es and en, 1280 and 1130px, forced colours once

## Context and goal

Spec 003 put a section second on the home page, after the hero: one proposition and
three proof points, as prose in a list. On 2026-10-15 the owner adopted, for this
section, the design proposal's **four steps of a process, in order, joined by arrows**
— analyze and design, develop, integrate and optimize, deploy and evolve — each with a
description, two or three tags and an icon, under an intro line and a short italic
note. The steps say what the work is *and* in what order it happens, which the list
did not. This spec replaces 003's proposition and proof points, so 003 moves to
`superseded` when this one is `implemented`.

The proposal also gives each step a colour: a pastel tint on its card in light, and a
tone on its flat icon in both themes. That is outside "navy and gold are the only
chroma"; the owner adopted it **for this section only**, through a scoped exception
written before this spec starts (see Prerequisites). Step 1 is the brand gold — a gold
tint with the gold tone — not a separate yellow; the cool canvas stays.

## Prerequisites

Each lands in its own change before any code of this spec.

- **AGENTS.md, scoped chroma exception for this section.** It has to cover three things
  this spec does: the tones on the step icons in both themes; the four tints in light,
  including step 1's gold tint — the "canvas is cool" rule stays and governs the
  ground, not these cards; and the tints as fills inside the sheet beside the rule that
  `--neutral-200` is the one soft fill. Its *settled by* line names the guard in this
  spec's NFR "Scope of the colour exception" once that guard exists and has been shown
  red (constitution 3 and 4).
- **Constitution 7 amendment and the pre-commit hook running the e2e suite.** RF-1,
  RF-2 and RF-4 to RF-8 are rendered checks.
- **Spec 008**, which owns the section title (gold icon, gold word, gold dash), and
  **spec 010**, which hosts the italic face the note uses.
- **The owner's OK for each of the four icon downloads** (file, source, size).

## Definitions

- **Step**: one of the four items of the process: a number, a title, a description,
  two or three tags, an icon, a tint and a tone.
- **Number**: the step's position (1–4), shown as the ordered list's own visible
  marker — not a second text node, so a screen reader announces it once.
- **Tint**: the fill of a step's card. It has a value per theme: a pastel in light, the
  site's card surface in dark (the mockup keeps the navy card in dark).
- **Tone**: the colour of a step's icon, one value per theme. Tags, numbers and text do
  not take it. A tone equal to an existing colour token is that token, not a second
  value.
- **Gold**: the accent text colour (`--accent-text`), never the brand gold surface
  colour, which is 1.61:1 on the light sheet.
- **Intro line**: the sentence under the title; it replaces 003's proposition.
- **Note**: the phrase "De la idea a producción", in italic. Not a heading.
- **Arrow**: the mark between two consecutive steps; three in total.

## Actors

Unchanged from spec 003: the visitor arriving from a shared link, deciding in seconds
whether to keep reading.

## User stories

- US-1: As a visitor who just arrived, I want to see what this person does and in what
  order the work happens, so that I can judge the fit without reading prose.
- US-2: As a visitor reading in English, I want the same four steps in my language.
- US-3: As a visitor with low vision or a screen reader, I want the order and text of
  the steps without depending on colour, icons or arrows.

## Copy

The Spanish is the owner's, from the mockup; the English is the planner's translation.
Both approved by the owner (Decision). The section title is unchanged: «Lo que
construyo» / *What I build*.

**Intro line** — Desarrollo soluciones web completas, combinando diseño, arquitectura y
buenas prácticas para crear productos escalables y de alto impacto. / *I build complete
web solutions, combining design, architecture and good practices to create scalable,
high-impact products.*

**Note** — De la idea a producción / *From idea to production*

| # | Title (es / en) | Description (es / en) | Tags (es / en) |
|---|---|---|---|
| 1 | Analizo y diseño / *I analyze and design* | Comprendo el problema, defino la solución y diseño la arquitectura adecuada. / *I understand the problem, define the solution and design the right architecture.* | Planificación · Arquitectura / *Planning · Architecture* |
| 2 | Desarrollo / *I develop* | Implemento soluciones robustas con buenas prácticas y código mantenible. / *I implement robust solutions with good practices and maintainable code.* | Backend · Frontend · APIs / *Backend · Frontend · APIs* |
| 3 | Integro y optimizo / *I integrate and optimize* | Conecto con bases de datos, servicios en la nube y terceros. Optimizo rendimiento y seguridad. / *I connect to databases, cloud services and third parties. I optimize performance and security.* | Bases de datos · Cloud · DevOps / *Databases · Cloud · DevOps* |
| 4 | Despliego y evoluciono / *I deploy and evolve* | Llevo las soluciones a producción y las mantengo en constante mejora. / *I take solutions to production and keep improving them.* | CI/CD · Monitoreo · Escalabilidad / *CI/CD · Monitoring · Scalability* |

## Colour

WCAG 2.x ratios; the formula reproduces 21.00 black on white and 4.54 for `#767676` on
white. Light text is ink `#16202C` and secondary `#566274`; dark text is `#F5F7FA` and
`#A9B6CD` on the card `#2B4372`.

| Step | Light tint | Light tone | Tone on tint | Secondary on tint | Dark tone | Tone on dark card |
|---|---|---|---|---|---|---|
| 1 gold | `#FCF3D6` | `#7A5D10` = gold | 5.57 | 5.58 | `#E3C770` = gold | 5.90 |
| 2 blue | `#E3ECFB` | `#1F4494` = `--clr-intermediate-text` | 7.63 | 5.20 | `#9DBCF5` = `--clr-intermediate` | 5.09 |
| 3 green | `#DEF2E5` | `#14572A` = `--clr-advanced-text` | 7.39 | 5.28 | `#6EE7A8` = `--clr-advanced-text` | 6.36 |
| 4 violet | `#ECE6FA` | `#5532A0` (new) | 7.35 | 5.09 | `#C7B5F7` (new) | 5.30 |

Step 1's tint has the brand gold's hue (46° against `#E3C770`'s 45°). Ink on the tints is
13.52–14.82; dark ink on the card 9.11, secondary 4.78. Tags use the site's chip surface
with secondary text: 4.74 light, 6.31 dark. Intro and note in secondary on the sheet:
6.02 light, 5.39 dark. Arrows in gold on the sheet: 6.01 light, 6.66 dark.

**The tint does not delimit the card**: 1.08–1.18 against the sheet, so the card keeps
the 1 px border every content card has; the tint is identity, not edge.

## Layout

The row width is the sheet's content box minus the section's padding. Between 500 and
1192 px of viewport the sheet is `100% − 2.5rem` with `4vw` inline padding, so the row is
`0.92 V − 72` px; above 1192 px the sheet caps at `--max-w` (1152 px) and the row
narrows to 992 px at 1600 px, where the padding caps at 4rem.

A step card needs a content floor of **11rem (176 px)**: the longest unbreakable item
is the title word "evoluciono" at 20 px, estimated at 116 px, with room for a tag chip.
That is an estimate; the plan measures the real min-content, and a larger value moves
the breakpoint by the same formula. Card chrome is 2 × (1.25rem padding + 1 px border)
= 42 px; an arrow slot, gaps included, is taken as 2rem (32 px).

Four in a row needs `4 × (176 + 42) + 3 × 32 = 968` px. `0.92 V − 72 ≥ 968` gives
**V ≥ 1131 px**, and the capped row never drops below 992 px, so four fit at every width
from 1131 px up — Playwright's 1280 px viewport included (row 1017.6 px).

## Requirements (EARS)

- **RF-1: THE SYSTEM renders this section second on the home page, after the hero.**
  Carried over from 003 RF-1. — **Check:** the existing e2e assertion finds the section
  at index 1 of the home's sections.
- **RF-2: THE SYSTEM renders, in the visitor's locale, the intro line, then the note,
  then the four steps as one ordered list in the Copy table's order.** — **Check:** an
  e2e test in `es` and `en` reads the section in document order and finds intro, note
  and four list items whose number, title, description and tags equal the data.
- **RF-3: THE SYSTEM carries a complete, distinct entry for each step in both
  locales: a non-empty title, a non-empty description, two or three non-empty tags, no
  title or description shared by two steps.** Absorbs 003 RF-2, RF-3 and RF-6. —
  **Check:** a data test over both locales fails on a blank field, a tag count outside
  2–3, or a repeated text.
- **RF-4: THE SYSTEM fills each step card with that step's tint for the active
  theme.** — **Check:** an e2e test in each theme, reached by toggling, reads each card's
  background: equal to the four distinct light tints, and to the card surface in dark.
- **RF-5: THE SYSTEM paints each step's icon in that step's tone for the active
  theme.** — **Check:** an e2e test in each theme, reached by toggling, reads each icon's
  rendered colour and finds it equal to the tone in the Colour table.
- **RF-6: THE SYSTEM renders every text, icon and arrow in the section at or above its
  contrast floor against the surface behind it, in both themes.** Floors: 4.5:1 text,
  3:1 icons and arrows. — **Check:** an e2e test per theme resolves each text, icon and
  arrow against its effective background and fails below its floor.
- **RF-7: THE SYSTEM lays the four steps in one row from a 1131 px viewport up, and
  one per row below it** (Layout). Never a partial row: a 3 + 1 split leaves an arrow
  pointing at nothing. — **Check:** an e2e test counts the steps' distinct rows: 1 at
  1280 and 1131 px, 4 at 1130 and 320 px.
- **RF-8: THE SYSTEM draws one arrow between each pair of consecutive steps, pointing
  from step *n* toward step *n + 1* as laid out.** — **Check:** an e2e test at 1280 and
  1130 px finds three arrows, each between step *n* and *n + 1*, pointing right at 1280
  and down at 1130.

## Non-functional requirements

- **Scope of the colour exception.** No element outside this section takes a step's
  tint or tone. — **Check:** an e2e test in each theme walks every route and fails on any
  element outside the section whose background, text, border or icon colour equals a
  value the exception introduces (the four light tints, both violet tones); and a test
  over the stylesheets fails on any rule outside the section that reads a step's tint or
  tone by name. The second half reads source because the aliased tones (gold, the level
  colours) render identically to their existing uses, so no rendered check can tell
  them apart (constitution 8).
- **Card edge.** Each step card keeps the content cards' border. — **Check:** an e2e
  test in each theme reads a 1 px solid border in the border colour on each card.
- **Decoration stays silent.** Icons and arrows are absent from the accessibility tree;
  the ordered list carries the order (US-3). — **Check:** the section's accessibility
  tree holds the Copy texts and no node for an icon or an arrow.
- **Inert.** No link, button or tab stop in the steps, and hover paints, lifts or
  recolours nothing. — **Check:** an e2e test finds none of the three, and a hovered
  step keeps its border, background, transform and icon colour.
- **Editable content** (constitution 5). No component spells a text of this section. —
  **Check:** the existing walk over component sources, widened to every text in the
  Copy table, finds none.
- **Icons.** Flat Tabler outline `bulb`, `code`, `database`, `rocket`, unmodified, kept
  with the UI icons the owner decided on — own folder, notice and Tabler licence,
  painted in the current colour — and the same glyph means one thing across the page. —
  **Check:** a data test finds each icon's file, its notice row and the licence file.
- **No new dependency, no new host** (constitution 1 and 2; 003 RF-5): the existing e2e
  host baseline stays as is.
- **LCP.** The section must not become the LCP element. Today it is `p.about-bio` at
  116/124/116 ms (390/958/1440 px, commit `a6f1297`); before and after go in the commit
  that lands the section.
- **No client-side JavaScript.** The section is static.
- **Note in real italic**: IBM Plex Sans italic, the face spec 010 hosts — the hero's
  "handwriting → Plex italic" decision applied to this note; no third family.
- **Prose capped**: the intro line takes `--measure`, as 003's proposition did.
- **Radius by size class**: the step card takes the content cards' radius (14 px, the
  shared card frame's, not the 8 px of buttons); a tag takes the tag radius, `--radius-xs` (2 px;
  owner decision 2026-10-15, shared with 013) — not the pill, which is reserved for the level badge and the language
  chip.

## Edge cases

- **Narrowest width (320–390 px).** One step per row, arrows down (RF-7, RF-8); the
  longest description, step 3 in Spanish, wraps inside its card.
- **English runs longer.** At 1131 px the longest English title wraps rather than
  overflows; RF-7's row count catches a card pushed to a new row.
- **Text zoom 200 %.** The breakpoint is in px, so a zoomed card may need more than its
  floor: still one row or one per row, never partial (RF-7).
- **A missing English string** renders a half-empty card; RF-3 fails on it.
- **Theme switch without reload.** RF-4 and RF-5 run in a theme reached by toggling.
- **Forced colours.** The UA drops tints and tones; the order still reads from the list.
  Checked once by eye, not a guard.

## What happens to spec 003

- **RF-1** carried as RF-1; its e2e assertion stays, renamed with the section id if
  that changes.
- **RF-2, RF-3, RF-6** absorbed by RF-2 and RF-3. **Retired guards:** the four tests of
  "ABOUT value proposition and proof points" in the about data test (three proof points,
  both locales, distinct, proposition non-empty) — the data they read is removed, and
  RF-3's test replaces them in the same commit, so the section is never unguarded.
- **RF-4** carried as the "Editable content" NFR; the walk is widened from the
  proposition and proof points to the Copy texts, not relaxed.
- **RF-5** is constitution 1 and 2; the host baseline stays.
- **The approved wording** leaves the data; 003 keeps it as history.
- **Status:** 003 moves to `superseded`, with a line naming 011.

## Out of scope

- The section title's styling (spec 008) and the italic face itself (spec 010).
- The focus ring (spec 016); the steps are inert and take no focus.
- Any other section's colour; brand logos are a separate AGENTS amendment.
- 3D or raster icons (adapted to flat Tabler by owner decision).
- Animating the steps or arrows.
- Linking a step to the skills or projects it names.
- The home's meta description, pending since spec 004.
- **Found while writing:** "de alto impacto", "Monitoreo" and "Escalabilidad" are claims
  the page does not back up, which 003 avoided on purpose. They are the owner's words
  and stay unless the copy approval changes them.

## Done when

- The prerequisites are committed.
- `npm test`, the e2e suite and `npm run build` green; `package.json` `dependencies`
  unchanged.
- Every new guard shown red once, then reverted by explicit path.
- The section looked at in light and dark, `es` and `en`, at 1280 and 1130 px, with
  RF-6's measured ratios recorded against the Colour table.
- LCP before and after in the commit message; spec 003 marked `superseded`.

## Decision

- 2026-10-15 · Copy approved in `es` and `en` as tabled, with US spelling
  ("analyze / optimize") to match the rest of the site; not the British spelling first
  drafted. Owner decision.
- 2026-10-15 · Tints and tones of steps 2–4 approved as tabled (blue and green alias
  today's level tokens; violet and the three tints are new values). Owner decision.
- 2026-10-15 · Below 1131 px the four steps stack, down to 320 px (RF-7 as written);
  not a 2 × 2 grid in between. Owner decision.
- 2026-10-15 · Glyph clash with spec 012: 012 picks other glyphs; steps 2 and 3 keep
  `code` and `database` (one glyph, one meaning). Owner decision.


# Spec 008 — One section-title treatment for the home sections

**Status:** implemented
**Size:** M
**Approved:** 2026-10-15 · two clarify rounds, no blocker left; owner decisions: gold word Experiencia, five Tabler glyphs, titles 24px · 173 lines, 8 RF
**Implemented:** 2026-10-15 · commits `32cdf45` (docs) and `3dfdb32` (feat) · 9/9 tasks, `npm test` 169/169, e2e 18/18, build green · 8/8 RF and NFRs validated; 20 injections red, 19 cannot bite in Chrome; seen in both themes and locales at 1280 and 390px

## Context and goal

The home page has five sections below the hero — "Lo que construyo", "Habilidades",
"Experiencia laboral", "Proyectos" and "Contacto" — and their titles disagree. Four
are plain headings with no rule of their own: the browser's default 24px, in the body
text colour. The projects title carries a class that sets 32px and gold, but the
link inside it takes the link colour, so it renders 32px in the body text colour
with no gold at all. Two sizes for one role is a visible inconsistency.

The owner's mockup gives every section title one treatment: a gold icon before the
title, one word of it in gold ("Lo que **construyo**"), and a short gold dash after
it. The owner adopted it on 2026-10-15 **inside the navy-and-gold rule, with no
exception**. One treatment, defined once and used by all five, removes the
inconsistency; specs 011–015 build on it instead of drawing their own title.

## Definitions

- **Section title:** the level-2 heading that names a home section.
- **Gold:** each theme's text gold, `--accent-text` — `#7A5D10` light, `#E3C770`
  dark. Never the brand gold, which measures 1.61:1 on the light sheet.
- **Gold word:** the one word of a title painted gold, designated by each locale's
  translation, not by its position in the string.
- **Plain title:** the translated title as a visitor reads it, with no markup.
- **Icon / dash:** decoration before and after the title text. Neither is text.

## Actors

One: a visitor reading the home page, in either locale and either theme, from 390px
wide up — including a screen-reader user, for whom nothing about the heading changes.

## User stories

- US-1: As a visitor scanning the page, I want every section title to look the same
  so that I can tell where one section ends and the next begins.
- US-2: As a screen-reader user, I want each heading announced as its plain title so
  that the decoration adds nothing to what I hear.
- US-3: As an English reader, I want the gold word chosen for the English title so
  that the emphasis means something in my language too.

## Prerequisites

- **Constitution 7 amended** so the Playwright e2e suite is part of the test policy
  and of the pre-commit hook (owner decision, not yet written). RF-1–RF-4, RF-6 and
  RF-8 are rendered checks and cannot ship before it.
- **The UI-icon rule written into `AGENTS.md`** (owner decision, not yet written):
  own folder with its NOTICE and the Tabler licence, apart from brand logos; painted
  as a mask in `currentColor`; one glyph, one meaning across the page.
- **The owner's OK for each icon download** — file, source and size.

## Requirements (EARS)

Rendered checks run on `/` in `es` and `en`, light and dark; data checks run in
`npm test`.

- RF-1: THE SYSTEM renders the five section titles with one treatment, differing
  only in their text and their icon. — **Check:** e2e reads each heading's computed
  font size, weight, line height, icon and dash size, the gaps between icon, text and
  dash, and the three colours (icon and dash, gold word, rest of the title); all five
  are equal per theme.
- RF-2: THE SYSTEM leads each section title with a gold icon. — **Check:** e2e: the
  icon's box ends left of the first glyph on the same line, and its painted colour
  equals the theme's gold in both themes, including after a toggle without reload.
- RF-3: THE SYSTEM ends each section title with a gold dash. — **Check:** e2e: the
  dash's box starts right of the last glyph on the same line, has non-zero width and
  height, and its colour equals the theme's gold in both themes, after a toggle too.
- RF-4: THE SYSTEM paints only the locale's gold word of each title in gold. —
  **Check:** e2e: the text runs computing to the theme's gold join to exactly the
  designated word; every other run computes to the body text colour.
- RF-5: THE SYSTEM keeps the gold at or above 4.5:1 against the sheet in each theme.
  — **Check:** a data test resolves both values from each theme and fails below
  4.5:1, with a contrast function that reproduces the WCAG references. 4.5:1 also
  covers the 3:1 floor of the icon and the dash.
- RF-6: THE SYSTEM exposes each section heading, and the projects link inside its
  heading, with the plain title as accessible name. — **Check:** e2e: each computed
  name equals the translated title exactly — no icon or dash text, no doubled or
  missing space at the gold word's edges.
- RF-7: THE SYSTEM takes each title's gold word from that locale's translation. —
  **Check:** a data test over both locales: every section title designates one gold
  word, which occurs exactly once as a whole word of that locale's title.
- RF-8: IF a section title does not fit on one line, THEN THE SYSTEM wraps it
  between words with the icon on the first line and the dash on the last. —
  **Check:** e2e at 390×844 with a title forced to wrap: neither the icon nor the
  dash is alone on a line, and the heading's scroll width does not exceed its
  client width.

## Non-functional requirements

- **Self-hosted icons** (constitution 1, 2): flat Tabler SVGs, MIT, no icon library
  and no CDN; root-absolute paths to files that exist.
- **Navy and gold only:** no colour beyond the gold, the body text colour and the
  sheet; every token read is defined in both themes (`tests/tokens.test.ts`).
- **No hover state** on a title: it is not a control. The projects link keeps the
  hover links already have; nothing lifts and no border appears (AGENTS Hover).
- **Language:** the titles and their gold-word designation go through `t()`, and
  every key resolves in both locales (`tests/i18n.test.ts`). The plain title is
  stored once per locale — one source per datum.
- **View transitions — a new guard:** the home projects title and the `/proyectos`
  title keep one shared transition name. No test checks this pair today
  (`tests/viewtransitions.test.ts` covers only the project cards' pair). —
  **Check:** a test fails when the two titles stop carrying the same name.
- **Focus:** the projects link's focus ring is spec 016's, not specified here.
- **Retired guards:** none. No test reads the section titles or their class today.

## Edge cases

- **One-word titles** ("Habilidades", "Proyectos", "Contacto", "Skills"…): the gold
  word is the whole title, as the owner decided for "Proyectos" — RF-4, RF-7.
- **English word order:** the `en` gold word is designated by the `en` translation —
  RF-7.
- **A designation that names a missing or repeated word** after a later edit: the
  data test goes red — RF-7.
- **390px:** a title has about 318px (390 less 2×20px sheet padding less 2×16px
  section padding). Whether "Experiencia laboral" fits on one line is for the plan;
  if not, it wraps cleanly — RF-8. Text zoom lands in the same case.
- **Morph to `/proyectos`:** the home heading morphs into the projects page's `h1`,
  which has no icon or dash; they fade during the transition. Accepted.
- **Hovering the projects link:** today's link hover adds an underline and sets no
  colour for it, so the underline takes the link's own colour: the body text colour,
  under the gold word too. Accepted. Spec 008 adds no hover.
- **Forced colours:** the icon and dash may be repainted or vanish; they are
  decoration and the title text stays legible. Accepted.
- **Glows behind a title (009):** 009 owns the rule that a glow never lowers text
  below its floor; the gold's floor is RF-5's 4.5:1.

## Out of scope

- Each section's content (011–015) and the hero (010), which has no section title.
- Title wording: the projects title stays "Proyectos" / "Projects" (owner).
- The gold hairline between sections, and the `/proyectos` and project-detail
  headings.
- Viewports below 390px.
- Found in passing: the light theme's comment says the text gold reads 6.4:1 on the
  sheet; it measures 6.01:1 (6.18:1 is the white card). A stale number, for its own
  fix.

## Done when

- `npm test` green, with RF-5, RF-7 and the new transition-name guard each shown red
  once.
- The e2e suite green, each new rendered check shown red once.
- `npm run build` green.
- Seen on `/` at 390×844 and 1280×800, both themes and both locales, after animations
  settle, and approved by the owner before commit.

## Decision

- 2026-10-15 · Gold word in "Experiencia laboral": "Experiencia", the noun that
  names the section and matches `en` "Experience"; not "laboral", the mockup's
  second-word pattern. Owner decision.
- 2026-10-15 · Glyphs (Tabler): `tool` (Lo que construyo), `chart-bar`
  (Habilidades — not `code`, which 011 uses for step 2), `briefcase`
  (Experiencia), `folder` (Proyectos), `mail` (Contacto). Each download asks the
  owner first (file, source, size). Owner decision.
- 2026-10-15 · Title size 24px (`--fs-xl`, the step the scale names for section
  titles, what four titles render today); not 32px (`--fs-2xl`), which the
  projects title renders today and loses. Owner decision.

## For the plan

- The gold-word mechanism (placeholder in the title, or a marker stripped for the
  plain title) is a plan decision; a second key holding the word again is ruled out
  by one source per datum.
- Dark gold equals the brand gold, so a "paint it brand gold" injection cannot go
  red in dark; pick injections that differ in both themes.
- Dash length, thickness and vertical position are read from the mockup as numbers.
- Whether the icon and dash sit inside the projects link decides where the hover
  underline runs; neither may add a hover state of its own.

# Spec 012 — Skills section redesign: six areas, colour logos, toggle state

**Status:** implemented
**Size:** L
**Approved:** 2026-10-15 · three clarify rounds, no blocker left; six owner decisions recorded · 291 lines, 14 RF
**Changed:** 2026-10-16 · owner decision: Astro keeps its official svgl.app marks (Devicon has no white-mark Astro); Original logo definition and Decision updated
**Implemented:** 2026-10-16 · commits `882a9f5` (docs), `ea31181` (data and assets), `c3274d8` (SkillLogo), `02560de` (AreaHeading), `8655bb0` (toggle) · 11/11 tasks, `npm test` 183/183, e2e 72/72, build green · 14/14 RF, NFRs and edge cases validated; 28 injections red, 0 and 6 re-run after test fixes; layout prediction met; logo contrasts recorded; seen in light and dark, both views

## Context and goal

The owner's design proposal of 2026-10-15 regroups the Skills section into six
areas, shows each skill's original multi-colour logo at rest, and puts an icon on
each area heading. Specs 005 and 006 stay the base: the segmented health bars by
level are kept, with no percentages. What changes is the grouping, which logo a
row draws, and the area heading. The view toggle comes along because it sits in
the same section and its state cannot be seen: the active button differs from the
inactive one by a fill of **1.37:1** in dark (`#3A578F` on `#2B4372`) and
**1.30:1** in light (`#DCE2E9` on `#FFFFFF`), and its icon colour moves **1.23:1**
in dark (`#E3C770` against `#A9B6CD`) and **1.00:1** in light (`#7A5D10` against
`#566274`). Size L: data, both views, a new heading icon, the toggle and the
assets that lose their reader are separate pieces.

The colour logos this spec puts in the bars view carry no record of where they
came from: the only notice beside the skill icons covers the single-colour files
and names the logos as trademarks, and no file states the colour logos' source or
licence. The owner's answer is to replace them (Decision).

## Decision log

Owner decisions, 2026-10-15 (authoritative):

- Spec 006's segmented health bars stay; no percentages.
- Six areas, today's ten skills at their current levels, nothing added (table in
  Definitions). An area with no skills is not rendered; it appears on its own
  once a skill carries it.
- Original multi-colour logos at rest, in both views. This amends spec 005's
  "monochrome by default, brand colour on hover", and the single-colour mask
  mount of 005/006 goes. Brand logos are content, outside the navy-and-gold rule.
- Area header icons: monochrome or gold, the spec picks.
- The view-toggle card folds into this spec.

**Area header icons are monochrome (spec's pick).** Gold already means something
in this section — the section title's icon and word (spec 008) and the hover —
so a gold mark on a heading that is not a control reads as a second title or a
selected state; and the rows now carry up to nine brand palettes, so the heading
needs the quiet step. Rejected: gold.

**`icon`, `brand` and what only they read are removed.** Once the row draws the
colour logo, nothing reads them; keeping unread data is how a second source
drifts.

## Definitions

- **Area:** one of six skill groups. The ordered list of areas is stated once, in
  the data, by a neutral key; a skill entry names its area by that key. Headings
  are visitor text and live only in the locale files.

  | Order | Heading (es) | Heading (en) | Glyph (Tabler) | Skills |
  |---|---|---|---|---|
  | 1 | Lenguajes | Languages | `braces` | TypeScript, Java |
  | 2 | Frontend | Frontend | `layout` | Angular, Astro |
  | 3 | Backend | Backend | `server` | .NET, SSE |
  | 4 | Bases de datos | Databases | `table` | PostgreSQL, MongoDB |
  | 5 | Nube y DevOps | Cloud & DevOps | `cloud` | Azure, Docker |
  | 6 | Testing | Testing | `test-pipe` | — |

- **Populated area:** an area at least one entry names. Five today.
- **Original logo:** the Devicon "original" colour file (MIT) an entry records as
  its logo, one in both themes; Astro's is its own official mark, one file per theme
  (Decision, 2026-10-16).
  Gradients allowed.
- **Generic mark:** the single-colour UI icon drawn for an entry that records no
  logo of its own (SSE). One glyph, one meaning across the page.
- **Monochrome icon colour:** the per-theme icon colour of spec 005, which 006's
  bar frame also paints.
- **Active indicator:** a bar under the active button's icon, in the gold text
  colour (`--accent-text`).

## Actors

One: a visitor reading the Skills section, in either theme and locale, with or
without scripts, with or without a pointer that hovers.

## User stories

- US-1: As a visitor, I want skills grouped into areas a developer recognises, so
  that I find a skill where I expect it.
- US-2: As a visitor, I want each skill's real logo without hovering, so that I
  recognise it at a glance on any device.
- US-3: As a visitor, I want to see which view is selected, so that the toggle
  tells me what it will do before I press it.

## Requirements (EARS)

### Areas

- RF-1: THE SYSTEM files each of the ten skills under the area in Definitions,
  with its current name and level. Nothing type-checks here, so a stray area
  would otherwise become a seventh card. — **Check:** a data test fails unless
  every entry's name, level and area equal the Definitions table and today's
  levels, so a missing or undeclared area fails it.
- RF-2: THE SYSTEM renders the populated areas in the order of the declared list,
  in both views. — **Check:** an e2e test reads each view's headings and fails when
  their order differs from the declared list's.
- RF-3: IF a declared area has no entry, THEN THE SYSTEM renders no group for it.
  — **Check:** an e2e test fails when either view shows a group count other than
  the populated areas' (five) or a Testing heading.
- RF-4: THE SYSTEM resolves the heading of every declared area in both locales,
  empty areas included. — **Check:** a data test over the declared list fails
  unless each heading resolves to the Definitions table's text in `es` and `en`.
- RF-5: THE SYSTEM shows the compact view's headings in the visitor's locale.
  Today it prints the raw data value. — **Check:** an e2e test fails unless every
  compact heading equals that locale's heading, in `es` and in `en`.

### Logos

- RF-6: THE SYSTEM draws each skill's original logo for the active theme in its
  bars row, the same file the compact view draws. — **Check:** an e2e test fails
  when a row's icon source differs from the entry's logo for that theme, in either
  view and either theme.
- RF-7: WHEN the pointer is over a skill row, THE SYSTEM changes nothing in it. —
  **Check:** an e2e test fails when any computed style of the row or its icon
  differs between rest and hover.
- RF-8: IF an entry records no logo of its own, THEN THE SYSTEM draws the generic
  mark in the monochrome icon colour, never another product's logo. — **Check:**
  an e2e test fails, in both views and themes, when such an entry draws any file
  but the generic mark or paints it in any colour but the monochrome icon colour.
- RF-9: THE SYSTEM ships every logo and icon it draws with its source and licence
  on record. — **Check:** a data test fails when a drawn logo is not named in the
  Devicon notice, a drawn UI icon not in the Tabler one, or a notice cites a
  licence file that does not exist.

### Area headers

- RF-10: THE SYSTEM shows one decorative icon before each rendered area heading,
  no taller than the heading's line. — **Check:** an e2e test fails unless each
  heading has exactly one icon, its area's glyph from Definitions, hidden from
  assistive technology, left of the text, at or under the heading's line height.
- RF-11: WHILE either theme is active, THE SYSTEM paints every area header icon in
  the monochrome icon colour. — **Check:** an e2e test fails when the icon's
  painted colour differs from that colour or falls below 3:1 against the card.

### View toggle

- RF-12: WHILE a view is visible, THE SYSTEM shows the active indicator under its
  button's icon. — **Check:** an e2e test fails, in either theme, unless the
  active button shows a bar under its icon painted in `--accent-text`, at 3:1 or
  above against the group surface and the active button's fill, with its border
  unchanged from the inactive button's.
- RF-13: WHEN the pointer is over the inactive button, THE SYSTEM does not show the
  active indicator on it. — **Check:** an e2e test hovers the inactive button and
  fails when it shows the indicator.
- RF-14: IF scripts do not run, THEN THE SYSTEM shows the active indicator on the
  bars button. Today the active style hangs on a class only the script adds. —
  **Check:** an e2e test with scripts disabled fails unless only the bars button
  shows the indicator.

## Non-functional requirements

- **Prerequisites, each its own change before this spec's code:** constitution 7
  amended so the e2e suite is part of the policy and runs in the pre-commit hook;
  `AGENTS.md` amended so brand logos are content outside the navy-and-gold rule;
  `AGENTS.md`'s hover rules "A hover may recolour an icon…" and "That recolour
  sits inside `@media (hover: hover)`" rewritten, since RF-6 and RF-7 make them
  false; spec 008 (the section title) in place; the UI icon home with its notice
  and Tabler licence in place; the colour logos' Devicon notice and MIT licence
  beside them.
- **Guards retired, and why** (never silently; names in For the plan): the
  bars-icon guards on the masked mount and the hover-gated brand colour — no mask
  and no brand hover are left to guard (RF-6, RF-7); the single-colour-asset
  guard — replaced by RF-9; the monochrome row-icon contrast guard — replaced by
  RF-8 and RF-11. Re-pointed: the 22px-slot guard keeps the slot and drops its
  "no image element" clause. Widened: the area-card guards iterate the declared
  list (RF-3, RF-4). 006's bar-frame contrast guard stays.
- **Removed, since they lose every reader:** the entries' `icon` and `brand`, the
  nine Devicon files in the mono folder with their licence, today's colour logo
  files (replaced, Decision), the NGINX logo SSE draws today, the unread C# logo,
  the "Other" fallback area and its locale key, and the three old area keys the
  new list replaces. The generic mark moves to the UI icon home. — **Check:** a
  data test fails on a logo file no entry draws.
- **Specs 005 and 006 after this spec.** Superseded: 005 RF-5 and RF-8, its hover
  NFRs, and 006's "hover recolours the icon" NFR. Amended: 005 RF-4 (areas from
  the declared list, empty hidden). Standing: 005 RF-1, RF-3, RF-6, RF-7 (the
  22px slot survives a failed load, against the new mount) and 006 RF-1 to RF-10;
  006 RF-4's frame keeps the monochrome icon colour. 006's single-skill-area edge
  case no longer describes today's data. Both specs' Decision logs record this.
- **Layout predicted unchanged.** Five areas hold 3, 3, 2, 1, 1 skills today and
  2, 2, 2, 2, 2 after; at three cards per line that is 3 + 1 row-lines before and
  2 + 2 after, at two per line 3 + 2 + 1 and 2 + 2 + 2. A prediction, measured in
  Done when.
- The SEO description is unaffected: RF-1 changes no name, and `seo.home.techs`
  names only skills the data keeps.
- Every visitor-facing string goes through `t()`. No new dependency, no
  third-party subresource. Each logo or icon download asks the owner first (file,
  source, size).
- Under reduced motion the active indicator appears without animation; the bars'
  entrance is unchanged (006 RF-6, RF-7).

## Edge cases

- **Logo contrast at rest is accepted, not a defect** (Decision). Measured on
  today's files against the dark card `#2B4372`: .NET `#5c2d91` 1.04, Azure
  `#114a8b` 1.11, Angular `#6C00F5` 1.38, PostgreSQL `#336791` 1.62 (black outline
  2.15), TypeScript `#3178C6` 2.16, Java `#5382A1` 2.36, Docker `#008fe2` 2.81,
  MongoDB `#01EC64` 6.14; against the light card: MongoDB 1.59, Azure's light stop
  `#3ccbf4` 1.90. The Devicon replacements are re-measured at their visual review
  and recorded in this list; no file changes for contrast. Measured 2026-10-16, main
  colour on the light / dark card: TypeScript `#007ACC` 4.51 / 2.17 (white lettering
  9.77 on dark), Java `#0074BD` 4.96 / 1.97 and `#EA2D2E` 4.27 / 2.29, .NET
  `#124379`–`#97D6EE` 9.98–1.59 / 1.02–6.13, PostgreSQL `#336791` 6.02 / 1.62 (white
  9.77 on dark), MongoDB `#439934` 3.59 / 2.72, Azure `#114A8B`–`#3CCBF4` 8.84–1.90 /
  1.11–5.14, Docker `#3A4D54` 8.86 / 1.10 and `#00AADA` 2.71 / 3.61; Astro light
  `#17191E` 17.58 on light, Astro dark white 9.77 on dark.
- **Astro** draws a dark mark on the light card (`#17191E`, 17.58:1) and a white
  mark on the dark card. Today one white-mark file serves both, and on the light
  card its A body vanishes at 1.00:1.
- Logos with white lettering (TypeScript, .NET, PostgreSQL) read again: the mask
  that filled the lettering is gone.
- A header icon that fails to load leaves the heading text, which carries the
  meaning (RF-10).
- An area that gains its first skill appears in its declared position (RF-2,
  RF-3); its heading already resolves (RF-4).
- A long heading with its icon ("Bases de datos" at 1024px) wraps; it never
  widens the card minimum, which is derived from the row (006 RF-10).
- Touch: no hover state exists in the row (RF-7), and a tapped inactive toggle
  button does not keep the indicator (RF-13).

## Out of scope

- New skills, percentages, the mockup's bar colours.
- The compact view's layout and chip design, beyond the grouping, headings and
  generic mark that reach it through this spec's data.
- The section title (spec 008) and the toggle's focus ring (spec 016,
  `--focus-ring`).
- Toggle behaviour (persistence, default view, entrance replay), its hover beyond
  RF-13, and its border contrast (1.37–1.54:1). Found in passing: with scripts off
  the list button stays visible and does nothing.

## Done when

- `npm test`, the e2e suite and `npm run build` are green; every new, widened or
  re-pointed guard shown red on an injected violation first.
- The prerequisites above landed first, and 005/006 carry their Decision-log
  entries.
- Each component committed only after the owner approves it in light and dark.
- The section seen in both themes, both locales, both views, at 1280, 1024, 800
  and 390px, with scripts off and reduced motion — section heights set against the
  prediction.

## Open questions

None.

## Decision

2026-10-15 · Owner answers to round-1 open questions.

- **Colour logos: replace all ten** (nine skills, Astro twice; Astro amended below) with Devicon
  "original" variants, MIT — one source, one licence, one notice, against which
  RF-9 holds. Each download asks the owner per file (file, source, size), and each
  logo gets a visual review. Discarded: tracing today's files one by one — their
  origin is unrecorded, and a mix of sources means a notice per source.
- **Astro: its official marks from svgl.app, not Devicon** (2026-10-16). Devicon
  v2.16.0 ships no white-mark Astro (`astro-original` has a near-black body, 2.14:1 on
  the dark card); the two files already in `public/tech/` are Astro's own marks as
  svgl.app publishes them (`astro-icon-light.svg` byte-identical, `astro-icon-dark.svg`
  with its gradient id renamed), so they stay and the notice records that source.
  Discarded: Devicon `astro-original` in both themes.
- **Logo contrast: accepted as measured** (Edge cases), as the owner already
  decided when adopting brand colour at rest; logos are content under the
  `AGENTS.md` amendment this spec depends on. Discarded: swapping files for
  contrast — it would trade the brand's own logo for a legible imitation.
- **Astro: one file per theme.** Discarded: one file in both themes — its white A
  body measures 1.00:1 on the light card.
- **Toggle active indicator: a gold bar under the active icon, in
  `--accent-text`** (5.90:1 dark / 6.18:1 light on the group; 4.31 / 4.73 on the
  active fill). Discarded: a gold border — it collides with spec 017's RF-3, where
  every bordered control turns its border gold on hover; a solid accent fill — a
  fill is the channel that fails today, and it would depend on spec 007's text
  token.
- **Header glyphs (Tabler):** Lenguajes `braces`, Frontend `layout`, Backend
  `server`, Bases de datos `table`, Nube y DevOps `cloud`, Testing `test-pipe`
  (not drawn while Testing has no skills). Discarded: `code` and `database` — spec
  011 uses them with another meaning, and one glyph carries one meaning.
- **Headings:** es "Nube y DevOps"; en Languages, Frontend, Backend, Databases,
  Cloud & DevOps, Testing. Spec 011's "Bases de datos · Cloud · DevOps" tag stays as approved: a
  tag on a process step, a different context. Discarded: aligning the two — it
  would reopen 011's approved copy for no visitor-facing gain.

## For the plan

- RF-2's guard cannot go red by first-appearance grouping alone: today's entry
  order already yields the declared order. Reorder the entries to inject.
- Guards named in the NFRs: `tests/markup.test.ts` "mounts monochrome and
  reaches brand colour only on the row hover" and "reaches brand colour only on a
  pointer that can hover" (retired), "reserves the 22px slot and keeps the icon
  out of the accessibility tree" (re-pointed); `tests/visual-language.test.ts`
  "every skill icon is a single-colour asset with its source on record" and "the
  monochrome icon clears the card in both themes" (retired); the
  `tests/i18n.test.ts` "skills area cards" guards (widened).
- RF-8 and RF-11 mask a `currentColor` glyph: an `<img>` of it paints black
  (2.15:1 on the dark card).
- RF-12 measures the bar against what is beneath it — the active fill, if the
  button keeps one — and against the group.
- Astro's per-theme file cannot be swapped by CSS on an `<img>` source; how the
  theme picks the file is a plan decision.

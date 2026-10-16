# Tasks 008 — One section-title treatment for the home sections

**Spec:** `specs/008-section-titles/spec.md` (**approved**, 8 RF).
**Plan:** `specs/008-section-titles/plan.md` (**approved**).
**Approved:** 2026-10-15 · owner approval

**Ordering across specs.** 016 lands first; then 007, 008 and 017, in that order.
This spec depends on:

- 016's `resolveColour(expr, ...layers)`, `contrast`, `luminance` and the theme layers,
  in `tests/helpers/colour.ts` since 016's T-2 (the plan still says
  `tests/visual-language.test.ts`; import them from the helper).
- 007's `e2e/helpers/dev-server.ts`, its theme setup, and the `toHexColour` and settle
  helpers inside `e2e/primary-button.spec.ts`, which T-6 moves.
- 007's T-2: constitution 7 admits the e2e suite and the hook runs it. RF-1–RF-4,
  RF-6 and RF-8 are not checks until it has landed.

017 then reuses `e2e/helpers/rendered.ts` from T-6.

Injection numbers refer to the table in plan §7.

- [x] **T-1 — Write the UI-icon rule into `AGENTS.md`**
  Covers: none (mechanical; the spec's prerequisite, constitution 3)
  Files: `AGENTS.md`
  Done when: `AGENTS.md` states that UI icons live in `public/icons/ui/` with their
  `NOTICE.md` and the Tabler licence, apart from brand logos; are painted as a mask
  in `currentColor`; one glyph, one meaning across the page; and names
  `tests/visual-language.test.ts` (*ui icons*) as what settles it.

  First, so the code commit points at a rule that already exists; its own `docs:`
  commit when you ask for one.

- [x] **T-2 — Guard the gold word and the title gold's contrast**
  Covers: RF-5, RF-7
  Files: `tests/i18n.test.ts`, `tests/visual-language.test.ts`
  Done when: *gold word designation* is **red on today's code** (no title marks a
  word); *title gold contrast* and the WCAG reference case (21.0000, 1.0000, 4.5422)
  green, and injections 5–8 shown red as plan §7 predicts and restored
  byte-identical.

  RF-5 needs no code change, so its guard is proven here, before anything moves.

- [x] **T-3 — Mark each title's gold word and strip the marker in `t()`**
  Covers: RF-7, and the plain text RF-6 reads
  Files: `i18n/i18n.ts`, `i18n/index.ts`, `i18n/locales/es.json`,
  `i18n/locales/en.json`
  Done when: `plainText`, `titleWords` and `tWords` exist with JSDoc; the ten titles
  read as plan §4 lists them; `npm test` green, `tests/i18n.test.ts` included;
  injections 1–4 shown red and restored byte-identical.

  Nothing renders differently: `t()` returns the same plain titles as today.

- [x] **T-4 — Guard the UI icons and the projects title pair**
  Covers: the self-hosted-icons NFR, the transition-pair NFR
  Files: `tests/visual-language.test.ts`, `tests/viewtransitions.test.ts`
  Done when: *ui icons* and *projects title pair* are **red on today's code**, the
  first naming the five missing glyphs, the second the missing `SECTION_TITLES` entry.

- [x] **T-5 — Download the five Tabler glyphs, one OK per file**
  Covers: the self-hosted-icons NFR
  Files: `public/icons/ui/tool.svg`, `chart-bar.svg`, `briefcase.svg`, `folder.svg`,
  `mail.svg`, `public/icons/ui/LICENSE-tabler.txt`, `public/icons/ui/NOTICE.md`
  (all new)
  Done when: before each download you approved its file, its source
  (`https://cdn.jsdelivr.net/npm/@tabler/icons@3.49.0/icons/outline/<file>`) and its
  estimated size from plan §2, and the actual byte count was reported after; each SVG
  paints only `currentColor`; `LICENSE-tabler.txt` hashes equal to
  `public/tech/mono/LICENSE-tabler.txt` (copied, not fetched); `NOTICE.md` names each
  glyph, v3.49.0 and MIT. *ui icons* is then red only on distinctness, which reads
  `SECTION_TITLES` (T-8).

  **Stops for your OK five times.** A refused glyph stops this task, not just one file.

- [x] **T-6 — Move `toHexColour` and `settle` into `e2e/helpers/rendered.ts`**
  Covers: none (mechanical, plan D-11)
  Files: `e2e/helpers/rendered.ts` (new), `e2e/primary-button.spec.ts`
  Done when: `e2e/primary-button.spec.ts` imports both and defines neither;
  `npm run test:e2e -- e2e/primary-button.spec.ts` green with the same test count as
  before.

- [x] **T-7 — Write the rendered guards in `e2e/section-titles.spec.ts`**
  Covers: RF-1, RF-2, RF-3, RF-4, RF-6, RF-8, the no-hover NFR
  Files: `e2e/section-titles.spec.ts` (new)
  Done when: *one treatment*, *icon*, *dash*, *gold runs* and *wrap* are **red on
  today's code** in `es` and `en`, light and dark; *names* green (the plain title is
  the name today) — it is proven by injection 18 in T-8.

- [x] **T-8 — Render all five titles through `SectionTitle`**
  Covers: RF-1–RF-8, every NFR
  Files: `src/data/sectionTitles.ts` (new), `src/components/SectionTitle.astro` (new),
  `src/components/ValuePropositionSection.astro`, `HabilitiesSection.astro`,
  `ExperienceSection.astro`, `ContactSection.astro`, `ProjectsSection.astro`,
  `Resume.astro`,
  `src/pages/proyectos/index.astro`, `public/styles/04-layouts.css`
  Done when: `.section__title` exists nowhere in `src` or `public`; `npm test` green,
  `tests/tokens.test.ts`, `tests/comments.test.ts` and `tests/i18n.test.ts` included;
  `npm run test:e2e` green; injections 9–21 shown red as plan §7 predicts and
  restored byte-identical.

  The plan abbreviates the four section files; the names above are today's.

- [x] **T-9 — See it in both themes and both locales**
  Covers: RF-1–RF-4, RF-8 as rendered; the spec's *Done when*
  Files: none
  Done when: `npm run build` green; from a running dev server, after
  `document.styleSheets` shows the scoped rules and animations settle, `/` seen at
  390×844 and 1280×800 in light and dark, `es` and `en`; the width of "Experiencia
  laboral" with icon and dash measured at 390 and reported; the 24×2px dash and its
  middle alignment confirmed by you against the mockup. **Stop for your visual
  approval.**

  After approval: one commit for the section title, naming the 21 injections and
  spec 008; the spec goes to `implemented` once validated — both only when you ask.

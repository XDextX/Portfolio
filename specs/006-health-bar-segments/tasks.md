- [x] **T-1 — Add the RF-1/RF-2 data guard, red first**
  Covers: RF-1, RF-2
  Files: `tests/visual-language.test.ts`
  Done when: `npm test` shows the new guard red on today's data — there is no
  `LEVEL_SCALE`, `levelStep` or `segmentsFor` to read — with the failure
  naming each missing piece (read through a namespace import) rather than a
  module-resolution crash.

  Guard before data, so the data is written to pass it.

- [x] **T-2 — State the level scale once and derive what a level lights**
  Covers: RF-1, RF-2
  Files: `src/data/levelLabels.ts`, `tests/visual-language.test.ts`
  (`SKILL_LEVELS` replaced by the imported `LEVEL_SCALE`)
  Done when: the T-1 guard passes unmodified; `TechLevel` is derived from
  `LEVEL_SCALE`; `npm test` and `npm run build` green; probes red then
  reverted — `segmentsFor` one entry short, one segment too many lit.

  `LEVEL_FILL` stays for now: `SkillBar.astro` still reads it, and removing it
  here would break the build until T-4. Depends on T-1.

- [x] **T-3 — Add the RF-3 to RF-8 guards, red first**
  Covers: RF-3, RF-4, RF-5, RF-6, RF-7, RF-8
  Files: `tests/visual-language.test.ts`, `tests/markup.test.ts`
  Done when: the fill guard measures the level colours against the `.bar-seg`
  unlit colour; a frame-versus-card contrast guard exists; the structural
  guards of the plan's §4 (frame and gap, derived radius, no pill, stagger,
  reduced motion, lit state outside `.animated`) exist, plus the RF-2 half
  that no per-level fill percentage remains in the data; each is red against
  today's row and data for the reason it names, and nothing else is red.

  Reads component source, plus the data module for the fill-percentage check;
  goes after T-2 so the T-1 guard is green and only this task's guards are
  red. Depends on T-2.

- [x] **T-4 — Draw the bar as framed segments**
  Covers: RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8
  Files: `src/components/SkillBar.astro`, `src/data/levelLabels.ts`
  (`LEVEL_FILL` removed), `public/styles/00-tokens.css` (the `--radius-pill`
  comment only)
  Done when: the T-3 guards pass unmodified; `npm test` and `npm run build`
  green; the RF-3 to RF-8 probes of the plan's §7 each shown red then restored
  byte-identical; the new rules confirmed in `document.styleSheets`; the
  segments render lit at their level with no animation yet, because the script
  still targets `.bar-fill` until T-5.

  Depends on T-3.

- [x] **T-5 — Replay the entrance on the frame, not the old fill**
  Covers: RF-6
  Files: `src/components/TechGrid.astro`
  Done when: the script toggles `.animated` on `.bar-track`; the browser shows
  an advanced row lighting at 0, 120 and 240ms after load and again after
  switching views; `npm test` green.

  Caller change that makes T-4 visible, so it is part of the same component
  work. Implemented 2026-10-15; its approval moved to after T-9, so the owner
  approves the row, the list and the area grid together. Depends on T-4.

- [x] **T-6 — Add the RF-9 guard, red first**
  Covers: RF-9
  Files: `tests/markup.test.ts`
  Done when: the guard of the plan's RF-9 procedure exists and is red against
  today's `.bars-list` (a flex column, no grid) for that reason, and nothing
  else is red.

  Depends on T-5.

- [x] **T-7 — Lay as many rows per line as fit**
  Covers: RF-9
  Files: `src/components/TechGrid.astro` (`.bars-list` only)
  Done when: the T-6 guard passes unmodified; `npm test` and `npm run build`
  green; the RF-9 probes of the plan's §7 each red then restored
  byte-identical; the browser shows as many rows per line as fit in each card,
  every bar at or above 60px, and Cloud's and DevOps's rows as wide as their
  neighbours'. Implemented 2026-10-15 under the "two per line" wording (two at
  1280px and 800px, one at 390px, section 450px and 776px); RF-10 then narrows
  the cards, so its rows go one per line. Approval moves to after T-9.

  Depends on T-6.

- [x] **T-8 — Add the RF-10 guard, red first**
  Covers: RF-10
  Files: `tests/markup.test.ts`
  Done when: the guard of the plan's RF-10 procedure exists and is red against
  today's `.bars-grid` (a typed `420px` minimum) for that reason, and nothing
  else is red.

  Depends on T-7.

- [x] **T-9 — Lay as many area cards per line as fit**
  Covers: RF-10
  Files: `src/components/TechGrid.astro` (`.bars-grid` only)
  Done when: the T-8 guard passes unmodified; `npm test` and `npm run build`
  green; the RF-10 probes of the plan's §7 each red then restored
  byte-identical; the browser shows three areas per line at 1280px and 1024px,
  two at 800px, one at 390px, with the section heights of the spec's Decision
  log. Visual-work rule: show the row, the list and the area grid in both
  themes and **wait for approval** — this approval covers T-5, T-7 and T-9.

  Depends on T-8.

- [x] **T-10 — Record the replacement and re-validate the spec**
  Covers: RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10
  Files: `specs/005-skills-bars/spec.md` (Decision log entry only)
  Done when: spec 005's Decision log says its RF-2 is replaced by spec 006's
  RF-3; the rendered record of the plan's §7 is filed at 1280px and 390px,
  light and dark, both locales, reduced motion emulated, and the home HTML
  read without scripts; spec 005's RF-1 and RF-3 to RF-8 re-measured; every
  NFR and edge case answered one by one; `npm test` and `npm run build` with
  real output.

  Depends on T-9 and the owner's approval of it. The verdict here decides
  `implemented`.

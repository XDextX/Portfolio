# Tasks 013 — Experience as a vertical timeline

**Spec:** `specs/013-experience-timeline/spec.md` (**approved**, 8 RF).
**Plan:** `specs/013-experience-timeline/plan.md` (**approved**).

Injection and probe numbers refer to plan §7; line numbers are the plan's (today's).

**Landed: 016, 007, 008, 017, 009, 010, 011, 012.** These tasks read and never rebuild: 016's
`tests/helpers/colour.ts` (`resolveColour`, `contrast`, theme layers); 007's
`e2e/helpers/dev-server.ts` and theme setup; 008's `SectionTitle`, `public/icons/ui/` with
`NOTICE.md` and `LICENSE-tabler.txt`, the *ui icons* guard and `e2e/helpers/rendered.ts` (`openIn`,
`installHelpers` with `__groundOf`, `settled`); 009's `composites`, `worstPoint` and the section glow;
010's `axTree`/`axQuery` and `.btn-cv` on `ABOUT.resumeUrl`; 011's scoped `.step__tag` at
`--radius-xs`, which T-6 moves to a shared `.tag`. Glyphs
taken elsewhere (008, 011, 012) are what *ui icons* checks `building` and `plant` against.

**Stops.** One, at the end (owner, 2026-10-16): the card and the section shown in light and dark,
then committed one per component — the card (with T-5's data), then the section.

- [x] **T-1 — Land the prerequisite rules**
  Covers: none (mechanical; the spec's Prerequisites, constitution 3)
  Files: `docs/constitution.md` (art. 7), `AGENTS.md` (Commands, Git, the UI icon home rule),
  `.husky/pre-commit` — each only where 007, 008 or 012 has not already landed it
  Done when: constitution 7 admits the e2e suite and the hook runs it; `AGENTS.md` Commands and
  Git match; `AGENTS.md` states the UI icon home with its notice and licence; `npm test` green.

  First, so the code commits point at rules that already exist. Each its own `docs:` commit,
  when you ask; if all three are in place, this task closes with no edit.

- [x] **T-2 — Measure the bullets' box before any edit**
  Covers: none (measurement; the spec's *For the plan*, plan §5 T0)
  Files: `specs/013-experience-timeline/tasks.md` (the line below)
  Done when: the bullets' box width at 390×844, `/?lang=es`, both jobs, read from a running dev
  server after animations settle and written here: before `270 px` (both jobs, 2026-10-16), after `244 px` (T-10, the rail column costs 26 px).

  Before T-5, because every later task changes the number.

- [x] **T-3 — Download the two company glyphs**
  Covers: none (assets for RF-3)
  Files: `public/icons/ui/building.svg`, `public/icons/ui/plant.svg`
  Done when: both fetched under the owner's standing OK for icons (2026-10-16), each exact size
  reported against plan §2; each read before it is placed (no `<script>`, no external
  reference) and saved unmodified.

  Their `NOTICE.md` rows land with T-5, where the glyphs gain a reader.

- [x] **T-4 — Add the data and contrast guards, proven by injection**
  Covers: RF-2 (data half), RF-3, RF-6
  Files: `tests/experience.test.ts` (new: *experience shape*, `unknownKeys`),
  `tests/visual-language.test.ts` (*experience contrast*; 008's *ui icons* also reads each
  `EXPERIENCES` glyph)
  Done when: *experience shape* and *experience contrast* green on today's data and shown red by
  injections 1–3, then restored byte-identical by explicit path; the widened *ui icons* green
  while no job declares a glyph; `npm test` green.

  Green today by design (plan §7): no duration exists and the tokens already clear their
  floors, so the injections are the only proof.

- [x] **T-5 — Give each job its glyph and chip list**
  Covers: RF-2 (data half), RF-3, RF-4 (data)
  Files: `src/data/experience.ts` (`glyph?` and `tech?` on `Experience`), `public/icons/ui/NOTICE.md`
  Done when: each job's `tech` equals the owner's list in the spec's Decision log, in order, and
  its `glyph` is the one the Decision log names; *ui icons* finds both glyphs on record and
  injections 4 and 5 red, then restored; `npm test` green.

  No visible change yet; committed with T-8, the card that reads it. Depends on T-3 and T-4.

- [x] **T-6 — Move `.tag` to the shared sheet**
  Covers: none (mechanical; the tag-radius NFR, plan D-4)
  Files: `public/styles/03-components.css` (`.tag` beside `.card-frame`, on `--radius-xs`),
  `ValuePropositionSection.astro` (its `li.step__tag` gains `tag`; the scoped `.step__tag` rule goes)
  Done when: one `.tag` rule exists, in `03-components.css`; the computed `border-radius`,
  `color`, `background-color`, `padding` and `font-size` of 011's tags equal their values before
  the move, in both themes; `npm test` and `tests/tokens.test.ts` green.

  Its own commit, before the card that becomes the second consumer. Moving the rule drops
  specificity, so every consumer's computed value is re-read (AGENTS, DRY).

- [x] **T-7 — Add the rendered checks, red first**
  Covers: RF-1–RF-8; the no-spine and hover NFRs
  Files: `e2e/experience-timeline.spec.ts` (new)
  Done when: *timeline*, *period*, *company icon*, *chips*, *chip names*, *cv link*, *narrow*,
  *spine* and *hover* exist and are **red on today's section** for the reason each names;
  *contrast* green and left for injection 12; expectations read from `EXPERIENCES`, the locale
  JSON and token probes, never literals; nothing else red.

- [x] **T-8 — Redraw the card: period first, icon, chips, no spine**
  Covers: RF-2, RF-3, RF-4, RF-5, RF-6 (chip and icon); the no-spine and hover NFRs
  Files: `src/components/ExperienceCard.astro` (period, role, company with icon, location,
  bullets, chips; spine at 56-57, shadow hover at 66-67 and the 520px aside at 144-151 go),
  `src/components/ExperienceSection.astro` (passes `glyph`, `tech`),
  `i18n/locales/es.json`, `en.json` (`experience.techAria`)
  Done when: *period*, *company icon*, *chips*, *chip names*, *spine* and *hover* pass
  unmodified, es and en, both themes; injections 8–11, 15 and 16 red and restored; probe P2 (a
  job with `tech: []`) green with no list in `axTree`, reverted; the new rules found in
  `document.styleSheets`; `npm test`, `npm run test:e2e`, `npm run build`,
  `tests/tokens.test.ts` green.

  The period sits static in the header here; its column placement from 40rem is T-9's.

- [x] **T-9 — Draw the timeline and close it with the CV link**
  Covers: RF-1, RF-6 (dots), RF-7, RF-8
  Files: `src/components/ExperienceSection.astro` (list, `.exp-dot`, `.exp-rail`, geometry
  properties, the 40rem breakpoint, `.exp-cv`), `src/components/ExperienceCard.astro`
  (`.exp-period` from 40rem only), `i18n/locales/es.json`, `en.json` (`experience.cv`)
  Done when: *timeline* (1280 and 390, also with scripts off), *contrast* (again after the
  theme toggle, no reload), *cv link* and *narrow* pass unmodified; injections 6, 7, 12, 13 and
  14 red and restored; probe P1 (a third job) green on *timeline* and *chips*, reverted;
  `e2e/about.spec.ts:47-60` still green; `npm test`, `npm run test:e2e`, `npm run build`,
  `tests/tokens.test.ts` green. The English label "View full CV" is shown at the final approval.

- [x] **T-10 — Walk the section against the spec's Done when**
  Covers: the spec's *Done when*
  Files: `specs/013-experience-timeline/tasks.md` (T-2's after value)
  Done when: `npm test`, `npm run test:e2e`, `npm run build`, `tests/tokens.test.ts` green; `/`
  in es and en, light and dark, at 1280, 800 and 390px, `document.styleSheets` checked first,
  measured after animations settle; T-2's after value recorded beside the before.

  After: the spec goes to `implemented` once validated, and each code commit names its
  injections — both only when you ask.

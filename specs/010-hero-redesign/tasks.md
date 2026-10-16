# Tasks 010 — Hero redesign

**Spec:** `specs/010-hero-redesign/spec.md` (**approved**, 8 RF).
**Plan:** `specs/010-hero-redesign/plan.md` (**approved**).

**Ordering across specs.** 016, 007, 008, 017 and 009 have landed; 011 follows. This spec
reads what they leave: `tests/helpers/colour.ts` with `resolveColour(expr, ...layers)` and
`styleSources()` (016); the CV button's fill and ink, `e2e/helpers/dev-server.ts` and the theme
setup (007); `public/icons/ui/` with `NOTICE.md`, `LICENSE-tabler.txt` and `mail.svg`, the *ui
icons* guard and `e2e/helpers/rendered.ts` (`openIn`, `installHelpers` with `__toHex`, `settled`) (008); `.btn-social` on
`--control-border` (017); `section--hero`, the hero glow, `groundOf` and
`parseGradients`/`composites`/`worstPoint` (009). If 009 is not implemented at T-1, stop:
RF-6 measures against the final dark hero ground.

**Gate, not a task here:** the constitution 7 amendment with `npm run test:e2e` in
`.husky/pre-commit` (cross-cutting, 2026-10-15). Confirm it is committed before T-3.

Injection numbers refer to the table in plan §7. Identity values are written as the data's
fields (`given`, `family`), never spelled out here.

- [x] **T-1 — Name the test that settles the Plex rule in `AGENTS.md`**
  Covers: none (mechanical; constitution 3)
  Files: `AGENTS.md`
  Done when: the "IBM Plex Sans, variable 100–700, for everything" rule names
  `tests/visual-language.test.ts` (*font families*) as what settles it; nothing else in the
  file changes.

  First, so the code commits point at a rule that already exists; its own `docs:` commit
  when you ask for one.

- [x] **T-2 — Measure the LCP before**
  Covers: the LCP NFR (before half)
  Files: none (scratchpad script, never committed)
  Done when: a buffered `largest-contentful-paint` observer on `/`, with 009 in place, has
  recorded element and time at 390×844, 958×888 and 1440×900, kept for the commit message.

  Before any hero change, or there is no "before" left to measure.

- [x] **T-3 — Compute the name from the identity data, and widen the two name guards**
  Covers: RF-7, the no-family and compound-name edge cases, the guards the spec widens
  Files: `src/data/about.ts`, `tests/visual-language.test.ts`, `e2e/about.spec.ts`
  Done when: the *name cases* test (placeholders only) is shown **red** before `fullName`
  exists; then `IDENTITY` holds `given` and `family`, `ABOUT.name = fullName(IDENTITY)` and
  `ABOUT.nameParts = nameParts(IDENTITY)` (plan §3); the identity guard reads the parts and
  `e2e/about.spec.ts` asserts the avatar alt against `ABOUT.name` with the skip gone;
  `npm test` and `npm run test:e2e` green with every reader of `ABOUT.name` untouched;
  injections 15 and 16 (name-cases half) shown red and restored byte-identical.

- [x] **T-4 — Write the hero's data guards**
  Covers: RF-2 (keys), RF-3 (coverage), the two-families and icons NFRs
  Files: `tests/visual-language.test.ts`, `tests/i18n.test.ts`
  Done when: *italic coverage* and *hero keys* are **red on today's code** (no italic face,
  no phrase or label keys); *font families* passes today and injection 12 turns it red;
  008's *ui icons* reads the hero glyphs and is red for the two missing files; injection 12
  restored byte-identical.

- [x] **T-5 — Write the hero's rendered checks**
  Covers: RF-1–RF-8, the equal-height NFR
  Files: `e2e/hero.spec.ts` (new), `e2e/helpers/rendered.ts`
  Done when: `axTree(page)` lives in `rendered.ts` (moved out of 008's spec if it lives
  there, its callers importing it); *phrases*, *italic*, *name colours* (given is gold today)
  and *social buttons* are **red on today's code**, each message naming its RF; *hero
  images*, *heading name* and *button heights* pass today, proven by injection in T-8; the
  server URL comes from `startDevServer()`, never a literal 4321.

- [x] **T-6 — Download the italic face and the two Tabler icons**
  Covers: none (mechanical; the weight and icons NFRs' inputs)
  Files: `public/fonts/IBMPlexSans-latin-italic.woff2`,
  `public/icons/ui/brand-github.svg`, `public/icons/ui/brand-linkedin.svg`,
  `public/icons/ui/NOTICE.md`
  Done when: **each file was fetched only after your OK for that file**, given its name,
  source URL and size (plan §2); the exact byte size of each is reported (the italic
  expected at 50 184 B); `NOTICE.md` gains two rows as 008's; `mail.svg` is fetched only if
  008 has not landed it. Nothing else changes.

  Stops three times, once per file. Each download is its own request to you.

- [x] **T-7 — Declare the italic face and the hero's data and copy**
  Covers: RF-2, RF-3, RF-8 (data halves), the weight NFR
  Files: `public/styles/05-fonts.css`, `src/data/about.ts`, `src/types/contact.ts`,
  `i18n/locales/es.json`, `i18n/locales/en.json`
  Done when: the italic `@font-face` mirrors the roman latin block (`italic`, `100 700`,
  same range, `swap`, no preload) and the header reads "5 files, 157 188 B"; `phraseKeys`
  and each social's `labelKey` and root-absolute `glyph` sit in `about.ts`, typed by
  `HeroSocial`; both locale files carry the values of plan §4; *italic coverage*, *hero
  keys*, *font families* and *ui icons* green; injections 3 (coverage half), 13, 14 and 17
  shown red and restored byte-identical.

- [x] **T-8 — Redraw the hero: two-tone name, phrase list, icon buttons**
  Covers: RF-1–RF-8, the equal-height and both-themes NFRs
  Files: `src/components/AboutSection.astro`
  Done when: the `h1`, the phrase list and the social buttons render as plan §4 writes
  them, `aria-label` and `title` gone from the socials; `npm test` and `npm run test:e2e`
  green; injections 1, 2, 3 (rendered half), 4–11 and 16 (heading-name half) shown red as
  plan §7 predicts and restored byte-identical; `tests/tokens.test.ts` green.

- [x] **T-9 — Measure the LCP after, and see it in both themes**
  Covers: RF-1–RF-8 as rendered; the LCP NFR (after half); the spec's *Done when*
  Files: none
  Done when: `npm run build` green; LCP measured as in T-2, each viewport at most 200 ms
  with its element named (if the element moved to the phrases, D-4 reopens before the
  commit); in a running dev server, the new rules confirmed in `document.styleSheets`
  first, the hero seen at 390×844, 958×888 and 1440×900, light and dark, `es` and `en`,
  after animations settle; at 390 `scrollWidth <= innerWidth` and no chevron starts a line;
  the family name reads 6.01:1 in light and at least 6.06 in dark. **Stop for your visual
  approval.**

  After approval: one commit for the hero naming the 17 injections and the LCP before and
  after, and the spec to `implemented` once validated — both only when you ask.

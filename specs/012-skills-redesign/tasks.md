# Tasks 012 — Skills section redesign: six areas, colour logos, toggle state

**Spec:** `specs/012-skills-redesign/spec.md` (**approved**, 14 RF).
**Plan:** `specs/012-skills-redesign/plan.md` (**approved**).

Injection numbers refer to the table in plan §7; line numbers are the plan's (today's).

**Landed: 016, 007, 008, 017, 009, 010, 011.** These tasks read and never rebuild: 016's
`tests/helpers/colour.ts` (`contrast`, `resolveColour`, `styleSources`); 007's
`e2e/helpers/dev-server.ts` and theme setup; 008's `SectionTitle`, `public/icons/ui/` with
`NOTICE.md` and `LICENSE-tabler.txt`, the *ui icons* guard and `e2e/helpers/rendered.ts`
(`openIn`, `installHelpers` with `__groundOf`, `settled`); 010's `axTree`/`axQuery`; 017's gold group hover on
`.view-toggle`; 011's glyphs, which *ui icons* checks for collisions.

**Size.** Eleven tasks, one over the ~10 target. The toggle (T-9, T-10) touches only
`SkillViewToggle.astro` and could split off as its own spec if you prefer; the rest share the
data rewrite and cannot.

**Stops.** One, at the end (owner, 2026-10-16: decide during implementation, stop for the result):
the four components shown one by one in light and dark — data and assets, `SkillLogo` with its
callers, `AreaHeading`, the toggle — and committed one per component after approval (plan §7).

- [x] **T-1 — Land the rule amendments and the 005/006 Decision-log entries**
  Covers: none (mechanical; the spec's prerequisites NFR, constitution 3)
  Files: `docs/constitution.md` (art. 7) and `.husky/pre-commit`, unless already landed;
  `AGENTS.md` (brand-logo exception beside the "canvas is cool" rule at :306, hover rules at :370-375);
  `specs/005-skills-bars/spec.md`, `specs/006-health-bar-segments/spec.md`
  Done when: constitution 7 puts the e2e suite in the policy and the hook runs it; `AGENTS.md`
  states brand logos are content outside the navy-and-gold rule, and that a skill row has no
  hover state, with no `(hover: hover)` recolour rule left; 005 and 006 Decision logs record
  what is superseded, amended and standing, as the spec's "Specs 005 and 006 after this spec"
  lists; `npm test` green.

  First, so the code commits point at rules that already exist. Each its own `docs:` commit,
  when you ask; the constitution 7 change is shared with 013, and whichever lands first carries it.

- [x] **T-2 — Add the data and grouping guards, red first**
  Covers: RF-1, RF-2, RF-3, RF-4 (locale half), RF-9; the orphan-file NFR
  Files: `tests/skills.test.ts` (new), `tests/i18n.test.ts`, `tests/visual-language.test.ts`
  (008's *ui icons* also reads `SKILL_AREAS` glyphs and `GENERIC_MARK`), `e2e/skills.spec.ts`
  (new: *area order*, *empty areas*)
  Done when: *skill table*, *area headings* (locale half, and the vacuity test: `SKILL_AREAS`
  non-empty, the bars panel calls `populatedAreas(`), *logo record*, the widened *ui icons*, the
  §3 cases for `populatedAreas`, `logoFor`, `logoFiles`, and the two e2e checks exist and are
  **red on today's code**, each naming the missing export or file rather than crashing on module
  resolution; `groupKey` and `fallbackCategory` (i18n 102-108) gone with `Other`; nothing else red.

  The i18n card test that reads `AreaHeading` waits for T-7, so T-4 can turn this task green.

- [x] **T-3 — Download the logos and glyphs**
  Covers: none (assets for RF-6, RF-9, RF-10; the spec's Decision)
  Files: `public/tech/typescript.svg`, `java.svg`, `angular.svg`, `dotnet.svg`, `postgresql.svg`,
  `mongodb.svg`, `azure.svg`, `docker.svg` (Astro's two files stay, plan D-11);
  `public/icons/ui/braces.svg`, `layout.svg`, `server.svg`, `table.svg`, `cloud.svg`,
  `test-pipe.svg`
  Done when: the fourteen files fetched under the owner's standing OK for icons (2026-10-16),
  each exact size reported against plan §2; each read before it is placed (no `<script>`, no
  external reference) and saved unmodified; each logo's contrast on the light card (`#FFFFFF`)
  and the dark card (`#2B4372`) measured for the visual review; no licence fetched
  (`LICENSE-devicon.txt` moves in T-4).

  No stop: the measured contrasts go into the spec's Edge cases with the spec's closing `docs:` commit.

- [x] **T-4 — Rewrite the skill data, locales and asset records**
  Covers: RF-1, RF-2, RF-3, RF-4, RF-9; the removed-files NFR
  Files: `src/data/tech.ts`, `src/components/TechGrid.astro` (`populatedAreas` replaces 31-48;
  line 120 goes), `i18n/locales/es.json`, `en.json`, `public/tech/NOTICE.md` (new),
  `public/tech/LICENSE-devicon.txt` (`git mv` from `mono/`, byte-identical),
  `public/icons/ui/broadcast.svg` (`git mv` from `mono/`), `public/icons/ui/NOTICE.md`;
  deleted: `public/tech/mono/`, `csharp.svg`, `nginx.svg` (Astro's two files stay); `tests/visual-language.test.ts`
  Done when: the T-2 guards pass unmodified; `TECH` reordered alone stays green, then
  injections 1–4, 6, 7 and 13–16 shown red as plan §7 predicts and restored byte-identical;
  **retired, stated in the commit:** `tests/visual-language.test.ts:402-458` (single-colour
  asset, replaced by *logo record*); `tests/seo.test.ts:110` untouched and green; `npm test`,
  `npm run build` and `tests/tokens.test.ts` green. **Stop for your visual approval** in light
  and dark of the grouping: five areas in declared order in both views. Row slots stay empty
  until T-6 (`SkillBar` still reads the removed `icon`) and compact headings print raw keys
  until T-8.

  Depends on T-2 and T-3.

- [x] **T-5 — Add the logo and row guards, red first**
  Covers: RF-6, RF-7, RF-8
  Files: `e2e/skills.spec.ts` (*row logos*, *row at rest*, *generic mark*),
  `tests/markup.test.ts` (381-416 re-pointed: the `<img>` clause at 390-391 goes)
  Done when: *row logos*, *row at rest* and *generic mark* red on the T-4 tree for the reason
  each names (no image of the entry's logo, the hover rule, no `.mark`); the re-pointed slot
  guard green and shown red by injection 28, twice, then restored; the re-pointing stated in the
  commit; nothing else red.

- [x] **T-6 — Draw every logo through one `SkillLogo`, in both views**
  Covers: RF-6, RF-7, RF-8
  Files: `src/components/SkillLogo.astro` (new), `SkillBar.astro`, `SkillChip.astro`,
  `TechGrid.astro` (passes `logo`), `tests/markup.test.ts`, `tests/visual-language.test.ts`
  Done when: the T-5 checks pass unmodified, both themes and views; injections 8–12 red and
  restored; **retired, stated in the commit:** `tests/markup.test.ts:262-360` and `362-379`
  with their helpers (206-223, 235-259), and `tests/visual-language.test.ts:344-400` (replaced
  by *generic mark* and, in T-7, *header icon colour*); the new rules found in
  `document.styleSheets`; `npm test`, `npm run test:e2e`, `npm run build` green. **Stop for your
  visual approval** in light and dark: Astro's dark mark on light and white mark on dark, the
  generic mark for the entry with no logo, no change on hovering a row.

- [x] **T-7 — Add the area-heading guards, red first**
  Covers: RF-4 (card test), RF-5, RF-10, RF-11
  Files: `tests/i18n.test.ts` (card test 187-255 reads the `.map(` over `populatedAreas`,
  accepts `<AreaHeading`, checks `t(` inside its `<h4>`), `e2e/skills.spec.ts` (*compact
  headings*, *header icons*, *header icon colour*)
  Done when: each red on the T-6 tree for the reason it names (no `AreaHeading.astro`, the
  compact panel prints the raw key, no `.area-icon`), and nothing else red.

- [x] **T-8 — Render every area heading through `AreaHeading`**
  Covers: RF-2, RF-4, RF-5, RF-10, RF-11
  Files: `src/components/AreaHeading.astro` (new, owns `.cat-label`), `TechGrid.astro` (both
  panels; the raw `{cat}` at 86 and `.cat-label` at 191-196 go)
  Done when: the T-7 checks pass unmodified, es and en, both themes; injections 5 and 17–21 red
  as predicted (21 also reddens 006's frame guard while *generic mark* holds) and restored;
  "Bases de datos" at 1024px wraps beside its glyph with the card minimum unchanged; `npm test`,
  `npm run test:e2e`, `npm run build`, `tests/tokens.test.ts` green. **Stop for your visual
  approval** in light and dark.

- [x] **T-9 — Add the toggle guards, red first**
  Covers: RF-12, RF-13, RF-14; the reduced-motion NFR
  Files: `e2e/skills.spec.ts` (*active indicator*, also under `reducedMotion: 'reduce'`;
  *hover inactive*; *no script*)
  Done when: *active indicator* and *no script* red on today's toggle (no `.toggle-indicator`;
  the active style hangs on `.active`, which only the script adds); *hover inactive* fails only
  for want of the indicator; nothing else red.

  *Hover inactive* has nothing to bite on today; injection 26 in T-10 is its proof.

- [x] **T-10 — Show the active view with a gold indicator**
  Covers: RF-12, RF-13, RF-14; the reduced-motion NFR
  Files: `src/components/SkillViewToggle.astro`
  Done when: the T-9 checks pass unmodified in both themes, after clicking list, under reduced
  motion and with scripts off; injections 22–27 red and restored; a grep finds `.active` neither
  emitted nor read; `npm test`, `npm run test:e2e`, `npm run build` green. **Stop for your visual
  approval** in light and dark, with the indicator's measured ratios against the group and the
  active fill.

- [x] **T-11 — Walk the section against the spec's Done when**
  Covers: the layout-prediction NFR; the spec's *Done when*
  Files: none
  Done when: `npm test`, `npm run test:e2e`, `npm run build` green; `/` in es and en, light and
  dark, both views, at 1280, 1024, 800 and 390px, with scripts off and with reduced motion,
  `document.styleSheets` checked first; section heights measured after animations settle and set
  against the spec's prediction (2 + 2 row-lines at three cards per line, 2 + 2 + 2 at two), any
  difference reported as a number.

  After: the spec goes to `implemented` once validated, and each code commit names its
  injections — both only when you ask.

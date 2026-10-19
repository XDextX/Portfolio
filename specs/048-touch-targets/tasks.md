# Tasks 048 — Touch targets a finger can hit

**Spec:** `specs/048-touch-targets/spec.md` (4 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-18 · owner approval · 79 lines
**Changed:** 2026-10-18 · T-4 adds the breadcrumb row's offsets check and injection 13, as block 7 of the plan now says · 81 lines

Injection numbers refer to block 7 of the plan.

Lands before spec 045, which is measured at these sizes. T-2 to T-9 are visual: each component is
shown in light and dark with a coarse pointer at 390 px, then **stop for the owner's approval**
before its commit and before the next task (AGENTS, one component at a time).

- [x] **T-1 — The audit guard, green with every offender pending**
  Covers: RF-1, RF-2, RF-3, RF-4 (measurement), radius NFR
  Files: `e2e/helpers/targets.ts`, `tests/touch-targets.test.ts`, `e2e/touch-targets.spec.ts`
  Done when: the unit cases go red first, then green under `npm test`, injection 1 red and
  restored; the e2e lists every offender, `PENDING` holds exactly that list (reported to the
  owner, with any component outside the plan's block 2 stopping the work); `npm run test:e2e`
  green; injections 8 and 12 red and restored.

- [x] **T-2 — Shared buttons: `.btn` and `.btn-action`**
  Covers: RF-1, RF-3
  Files: `public/styles/03-components.css`, `e2e/touch-targets.spec.ts` (`PENDING`)
  Done when: their entries leave `PENDING` and the suite is green; injection 2 red and restored;
  computed height read on the back, Código, Demo, disabled demo, submit, "Ver todos" and card
  buttons in both pointers. **Stop for approval.**

- [x] **T-3 — Header pair: language control and theme button**
  Covers: RF-1, RF-2, RF-4
  Files: `src/components/LanguageSwitcher.astro`, `src/components/ThemeSwitch.astro`,
  `public/styles/00-tokens.css` (`--topbar-block`), `e2e/touch-targets.spec.ts`
  Done when: entries out of `PENDING`, suite green; injections 3, 4, 5, 6, 7 and 11 red and
  restored; the hero band still reaches the sheet's top edge on coarse. **Stop for approval.**

  One commit for both: RF-4 makes either alone red (plan D-7).

- [x] **T-4 — Breadcrumb links**
  Covers: RF-1
  Files: `src/components/BreadCrumbs.astro`, `e2e/touch-targets.spec.ts`
  Done when: entries out of `PENDING`, suite green; the row's offsets, widths and gaps on coarse
  equal the fine pointer's within 1px; injections 9 and 13 red and restored. **Stop for
  approval.**

- [x] **T-5 — Skills view toggle**
  Covers: RF-1, RF-3
  Files: `src/components/SkillViewToggle.astro`, `e2e/touch-targets.spec.ts`
  Done when: entries out of `PENDING`; the indicator stays centred under the icon in both
  pointers (`e2e/skills.spec.ts` green); suite green. **Stop for approval.**

- [x] **T-6 — Contact card controls and value link**
  Covers: RF-1, RF-3
  Files: `src/components/ContactCard.astro`, `e2e/touch-targets.spec.ts`
  Done when: entries out of `PENDING`; copy box equal at rest, copied and failed on coarse, in
  both locales; injection 10 red and restored; suite green. **Stop for approval.**

- [x] **T-7 — Hero buttons**
  Covers: RF-1
  Files: `src/components/AboutSection.astro`, `e2e/touch-targets.spec.ts`
  Done when: entries out of `PENDING`, suite green. **Stop for approval.**

- [x] **T-8 — Project filter chips**
  Covers: RF-1
  Files: `src/components/ProjectFilters.astro`, `e2e/touch-targets.spec.ts`
  Done when: entries out of `PENDING`; `e2e/project-filters.spec.ts` green; suite green. **Stop
  for approval.**

- [x] **T-9 — Standalone text links and skill chips**
  Covers: RF-1
  Files: `src/components/ProjectCard.astro`, `src/components/SectionTitle.astro`,
  `src/components/ExperienceSection.astro`, `src/components/SkillChip.astro`,
  `e2e/touch-targets.spec.ts`
  Done when: each component's entries out of `PENDING`, suite green after each. One component,
  one approval, one commit, in that order: **stop after each.**

- [x] **T-10 — Close: no pending, the spec's Done when**
  Covers: RF-1, RF-2, RF-3, RF-4, the NFRs and edge cases
  Files: `e2e/touch-targets.spec.ts` (delete `PENDING`)
  Done when: `PENDING` is gone; `npm test` and `npm run test:e2e` green; the three pages read on
  the dev server with a coarse pointer at 390 px and at 1280 px, and a fine one at 1280 px, in
  light and dark. **Stop for the owner's visual approval.**

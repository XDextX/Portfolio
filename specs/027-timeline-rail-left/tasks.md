# Tasks 027 — Timeline rail on the left, as in the proposal

**Spec:** `specs/027-timeline-rail-left/spec.md` (2 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 24 lines

Injection numbers refer to plan §7.

- [x] **T-1 — Write the rendered order check**
  Covers: RF-1, RF-2
  Files: `e2e/experience-timeline.spec.ts`
  Done when: **red on today's layout** at 1280 and 800 px (the period left of the rail).

- [x] **T-2 — Rail first, then the period**
  Covers: RF-1, RF-2
  Files: `src/components/ExperienceSection.astro`
  Done when: T-1 green; spec 013's guards green; injections 1 and 2 red and restored;
  `npm test` and `npm run test:e2e` green.

- [x] **T-3 — See the section**
  Covers: the spec's visual *Done when*
  Files: none
  Done when: light and dark at 1280, 800 and 390 px, beside the mockup's crop, stylesheet
  confirmed loaded. **Stop for the owner's visual approval.**

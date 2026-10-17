# Tasks 028 — Experience card arranged like the proposal

**Spec:** `specs/028-experience-card-layout/spec.md` (4 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 25 lines

Injection numbers refer to plan §7.

- [x] **T-1 — Write the rendered layout checks**
  Covers: RF-1, RF-2, RF-3, RF-4, the no-overlap NFR
  Files: `e2e/experience-timeline.spec.ts`
  Done when: spec 013's RF-6 icon pair reads the tile when there is one; the new checks are
  **red on today's card** (no tile, location under the company, chips under the bullets).

- [x] **T-2 — Tile, header line and two-column body**
  Covers: RF-1, RF-2, RF-3, RF-4
  Files: `src/components/ExperienceCard.astro`
  Done when: the new checks and spec 013's and 027's guards green; injections 1–5 red and
  restored; `npm test` and `npm run test:e2e` green.

- [x] **T-3 — See the section**
  Covers: the spec's visual *Done when*
  Files: none
  Done when: light and dark at 1280, 800 and 390 px beside the mockup's crop, stylesheet
  confirmed loaded. **Stop for the owner's visual approval.**

# Tasks 034 — Social tags follow the serving origin

**Spec:** `specs/034-social-tags-origin/spec.md` (3 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 19 lines

Injection numbers refer to plan §7.

- [x] **T-1 — Write the checks**
  Covers: RF-1, RF-2, RF-3
  Files: `tests/seo.test.ts`, `e2e/og-cover-layout.spec.ts`
  Done when: RF-1 and RF-3 red on today's layout; RF-2 green (today's canonical is production).

- [x] **T-2 — Two origins in the layout**
  Covers: RF-1, RF-2, RF-3
  Files: `src/layouts/BaseLayout.astro`
  Done when: all green; injections 1–3 red and restored; `npm test` and `npm run test:e2e` green;
  the head of `/` read on the dev server. No visual change, so no visual approval step.

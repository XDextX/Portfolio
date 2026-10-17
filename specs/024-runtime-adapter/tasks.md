# Tasks 024 — The runtime dependency is the adapter that runs the site

**Spec:** `specs/024-runtime-adapter/spec.md` (approved, 2 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-16 · owner approval of plans and tasks 021–024 together, order 022, 024, 021, 023 · 25 lines

Starts after 022 is implemented. Not visible, so the stop is the validation.

- [x] **T-1 — Amend constitution 1**
  Covers: none (the rule the RFs check against)
  Files: `docs/constitution.md`
  Done when: article 1 reads exactly as the spec's *Proposed amendment*; committed alone as
  `docs:` when the owner asks.

- [x] **T-2 — Update the dependency guard**
  Covers: RF-1
  Files: `tests/seo.test.ts`
  Done when: `npm test` shows the guard **red on today's `package.json`** (`@astrojs/node` listed,
  `@astrojs/vercel` in dev).

- [x] **T-3 — Move the adapter into the runtime dependencies**
  Covers: RF-1, RF-2
  Files: `package.json`, `package-lock.json`
  Done when: the guard green; injections 1 and 2 shown red and restored; `npm test`,
  `npm run test:e2e` and `npm run build` green, with `.vercel/output/config.json` present.

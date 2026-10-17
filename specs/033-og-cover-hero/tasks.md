# Tasks 033 — The social card composed like the hero, one per locale

**Spec:** `specs/033-og-cover-hero/spec.md` (9 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 37 lines

Injection numbers refer to plan §7.

- [x] **T-0 — The og:image rule in AGENTS**
  Covers: the spec's first guard change
  Files: `AGENTS.md`
  Done when: the rule reads one card per locale; committed alone as `docs:` before any code.

- [x] **T-1 — Readings and checks**
  Covers: RF-2, RF-3, RF-4, RF-5, RF-6, RF-8
  Files: `tests/seo.test.ts`, `scripts/og-cover.ts`
  Done when: the new checks red on today's generator; then green; injections 2–6 and 8 red and
  restored.

- [x] **T-2 — The avatar**
  Covers: RF-1, RF-7
  Files: `tests/seo.test.ts`, `scripts/og-cover.ts`, `e2e/og-cover-layout.spec.ts`
  Done when: red first, then green; injections 1 and 7 red and restored.

- [x] **T-3 — One card per locale, bound per page**
  Covers: RF-9, the NFRs
  Files: `scripts/og-cover.ts`, `src/layouts/BaseLayout.astro`, `tests/seo.test.ts`,
  `e2e/og-cover-layout.spec.ts`, `public/og-cover-es.png`, `public/og-cover-en.png`, `public/og-cover.png` (deleted)
  Done when: the generator run once (it fetches the avatar), both PNGs 1200×630 under 5 MB, a
  second run byte-identical; injection 9 red and restored; `npm test` and `npm run test:e2e`
  green.

- [x] **T-4 — See the card**
  Covers: the spec's visual *Done when*
  Files: none
  Done when: both cards beside the hero in dark. **Stop for the owner's visual approval.**

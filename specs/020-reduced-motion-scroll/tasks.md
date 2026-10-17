# Tasks 020 — Reduced motion stops smooth scrolling

**Spec:** `specs/020-reduced-motion-scroll/spec.md` (approved, 2 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-16 · owner approval of plan and tasks together · 21 lines

Injection numbers refer to plan §7. Nothing is drawn differently, so the stop is the
validation; nothing is committed until the owner asks.

- [x] **T-1 — Write the rendered scroll check**
  Covers: RF-1, RF-2
  Files: `e2e/reduced-motion.spec.ts`
  Done when: the spec runs on the e2e server and is **red on today's stylesheet** for `reduce`
  with a field focused (it reads `smooth`), in both themes, while the `no-preference` cases
  pass.

- [x] **T-2 — Scope smooth scrolling to no motion preference**
  Covers: RF-1, RF-2
  Files: `public/styles/01-base.css`
  Done when: T-1's check green in both themes and after the live switch; injections 1–3 shown
  red and restored byte-identical; `npm test` and `npm run test:e2e` green.

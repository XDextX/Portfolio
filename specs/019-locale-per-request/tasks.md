# Tasks 019 — Locale per request

**Spec:** `specs/019-locale-per-request/spec.md` (approved, 3 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-16 · owner approval of plan and tasks together · 39 lines

Injection numbers refer to plan §7. Nothing here is visible, so there is no visual stop: the
stop is the validation, and nothing is committed until the owner asks.

- [x] **T-1 — Write the data cases for the scope and the resolution order**
  Covers: RF-2, RF-3 (scope fallback), RF-1 as data
  Files: `tests/locale.test.ts`
  Done when: `npm test` shows the isolation and fallback cases **red on today's code** (no
  `runInLocale` to import) and the resolution and cookie cases green, since they pin today's
  behaviour; injections 3 and 4 shown red and restored byte-identical.

  The resolution cases pass first on purpose: RF-2 is "keep what exists", so the guard is proven
  by injection, not by a red start.

- [x] **T-2 — Give lookups a per-request scope**
  Covers: RF-1 (mechanism), RF-3
  Files: `i18n/i18n.ts`, `i18n/index.ts`, `src/utils/locale.ts`
  Done when: `npm test` all green, with `tests/i18n.test.ts`, `tests/seo.test.ts` and
  `tests/project-card.test.ts` unchanged (`git diff --stat` on them empty); injection 2 shown red
  and restored.

- [x] **T-3 — Write the rendered concurrency check**
  Covers: RF-1
  Files: `e2e/locale-concurrency.spec.ts`
  Done when: the spec runs against the e2e server and is **red on today's routes**, reporting
  the mixed pages per round (about 20/40, as the spec measured).

  Before T-4 so the guard is seen failing against the real bug, not only against an injection.

- [x] **T-4 — Run every request inside its locale**
  Covers: RF-1
  Files: `src/middleware.ts`
  Done when: the T-3 check green over its three rounds; injection 1 shown red and restored;
  `npm test`, `npm run test:e2e` and `npm run build` green.

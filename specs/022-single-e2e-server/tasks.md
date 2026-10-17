# Tasks 022 — One dev server for the whole e2e suite

**Spec:** `specs/022-single-e2e-server/spec.md` (approved, 3 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-16 · owner approval of plans and tasks 021–024 together, order 022, 024, 021, 023 · 26 lines

Injection numbers refer to plan §7. Not visible, so the stop is the validation.

- [x] **T-1 — Write the one-server guard**
  Covers: RF-1
  Files: `tests/e2e-infra.test.ts`
  Done when: `npm test` shows it **red on today's tree**, naming `e2e/helpers/dev-server.ts`.

- [x] **T-2 — Point every spec at the runner's server**
  Covers: RF-1, RF-2
  Files: `e2e/helpers/server.ts`, `playwright.config.ts`, every spec file that starts a server or names the address,
  `e2e/helpers/dev-server.ts` (deleted)
  Done when: the T-1 guard green; injection 1 shown red and restored; `npm run test:e2e` green
  with the same test count as just before this task; the RF-2 port check passes after a full run and after an
  interrupted one.

- [x] **T-3 — Drop the HTTP client dependency**
  Covers: RF-3
  Files: `e2e/about.spec.ts`, `package.json`, `package-lock.json`, `tests/seo.test.ts`
  Done when: `npm uninstall node-fetch @types/node-fetch` done; the dependency guard updated and
  green; injection 2 shown red and restored; `npm test` and `npm run test:e2e` green.

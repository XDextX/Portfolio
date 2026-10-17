# Plan 022 — One dev server for the whole e2e suite

**Spec:** `specs/022-single-e2e-server/spec.md` (**approved**, 3 RF).
**Status:** approved
**Approved:** 2026-10-16 · owner approval of plans and tasks 021–024 together, order 022, 024, 021, 023 · 83 lines

**Ordering.** Implementation order across 021–024: 022, 024, 021, 023. Lands before 024: both rewrite the dependency guard in `tests/seo.test.ts`, and
this one removes two dev dependencies that 024's new sets must not list.

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 (one server) | §4: the eleven specs that call `startDevServer` read the runner's address instead; `e2e/helpers/dev-server.ts` is deleted. Source guard in §7 (reason in the spec). |
| RF-2 (nothing left listening) | The runner's `webServer` owns the only server and stops it with the run. Scripted port check in §7. |
| RF-3 (platform `fetch`) | `e2e/about.spec.ts` uses the global `fetch`; `node-fetch` and `@types/node-fetch` leave `package.json` and the dependency guard. |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `e2e/helpers/server.ts` | create | The e2e server's one address (`E2E_PORT`, `E2E_URL`), read by the config and every spec. |
| `playwright.config.ts` | modify | Builds `webServer.command` and `url` from `server.ts`. |
| every `e2e/*.spec.ts` that starts a server (eleven today) | modify | Drop `beforeAll`/`afterAll` server code and the `DEV_URL` variable; import `E2E_URL`. |
| `e2e/contact-form.spec.ts`, `locale-concurrency.spec.ts`, `reduced-motion.spec.ts` | modify | Their literal `BASE` becomes `E2E_URL`. |
| `e2e/about.spec.ts` | modify | The CV check uses the global `fetch`. |
| `e2e/helpers/dev-server.ts` | delete | — |
| `package.json`, `package-lock.json` | modify | `node-fetch` and `@types/node-fetch` removed (`npm uninstall`). |
| `tests/seo.test.ts` | modify | The dependency guard's dev set loses the two. |
| `tests/e2e-infra.test.ts` | create | RF-1's guard. |

## 3. Pure logic

None beyond two constants: `E2E_PORT = 4329`, `E2E_URL = \`http://localhost:${E2E_PORT}\``.

## 4. Algorithm

Per spec file, mechanically:

```
- import { startDevServer, waitForServer } from './helpers/dev-server'
- let DEV_URL = ''; let proc …
- test.beforeAll(… startDevServer … waitForServer …)
- test.afterAll(… proc.kill() …)
+ import { E2E_URL as DEV_URL } from './helpers/server'
```

Aliasing to `DEV_URL` keeps every call site untouched, so the diff is the server code alone and
no assertion changes (the spec's coverage NFR). The three specs written on 4329 drop their own
literal for the same import.

## 5. Interface

Not visible: test infrastructure only.

## 6. Decisions

- **D-1 · Every spec on the runner's `webServer`.** *Discarded:* keeping per-file servers and
  killing their process tree (`taskkill /T`, `detached` groups) — platform-specific code to
  keep a design whose cold starts are the flakiness.
- **D-2 · Alias the import to `DEV_URL`.** *Discarded:* renaming every call site — a larger diff
  that hides the one change that matters.
- **D-3 · The address in `e2e/helpers/server.ts`, imported by the config.** *Discarded:* the
  literal in each spec and in the config — the three 4329 literals that exist today are the
  start of that drift.
- **D-4 · Keep `gotoPastOverlay`.** *Discarded:* deleting it now — one warm server should stop
  the overlays, but that is measured after this lands (spec *Out of scope*).

## 7. Test strategy

Runner from `package.json`: `npm test` (vitest) and `npm run test:e2e` (Playwright).

- **RF-1** (`tests/e2e-infra.test.ts`): read every `.ts` under `e2e/`, strip comments with
  `tests/helpers/source.ts`, and fail on an import of `child_process` or a call to `spawn(` /
  `exec(`. Source by necessity: the spec records why.
- **RF-2** (*Done when*, PowerShell): list `Get-NetTCPConnection -State Listen` on 4321–4339
  before and after `npm run test:e2e`, and again after a run stopped with Ctrl+C; any new port is
  a failure.
- **RF-3**: the dependency guard in `tests/seo.test.ts` with the two packages gone.
- **Coverage NFR:** the test count of `npm run test:e2e` just before T-2 equals the count after.
- **Wall time NFR:** the run's own duration, compared with today's 1.2–1.9 minutes.
- **Injections:** (1) a `spawn('npm', ['run','dev'])` added to one spec → RF-1 red; (2)
  `node-fetch` back in `devDependencies` → RF-3 red.

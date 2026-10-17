# Spec 022 — One dev server for the whole e2e suite

**Status:** implemented
**Size:** M
**Approved:** 2026-10-16 · one clarify round, one blocker fixed (constitution 8 reason for the source check) and one minor · 62 lines, 3 RF
**Implemented:** 2026-10-16 · commit `c4b55e9` · 3/3 tasks, `npm test` 223/223 at the time, e2e 112/112 in 1.0 min · 3/3 RF and NFRs validated: ports 4321–4339 unchanged after a full run and after one interrupted at 34/112, no overlay reloads; 2 injections red

## Context and goal

Eleven e2e spec files each start their own `npm run dev`; the contact-form spec uses the runner's
own server on 4329. Measured on 2026-10-16: every full run logs two or three
`vite-error-overlay` reloads from those cold servers, and each server stopped in `afterAll` is
killed through its shell, which on Windows leaves the real dev server running — orphan servers
held 4321 and 4329 that same day, and a busy 4329 makes the next run, and so the pre-commit hook,
fail. The goal: one dev server per run, started and stopped by the runner, and nothing left
behind.

## Actors

Whoever runs `npm run test:e2e`, the pre-commit hook included.

## User stories

- US-1: As the owner committing, I want the e2e run to start and stop cleanly so that a commit is
  never refused by a port a previous run left busy.

## Requirements (EARS)

- RF-1: THE SYSTEM's e2e suite renders every check against the one dev server the runner starts.
  — **Check:** a unit guard fails if any file under `e2e/` starts a process itself. A source
  check by necessity (constitution 8): a spec that starts a server shows only in its code, and the
  process list belongs to the operating system, not to the suite.
- RF-2: WHEN the e2e suite finishes, THE SYSTEM leaves no dev server listening. — **Check:** after
  a full run, no port in 4321–4339 is listening that was not listening before it (a scripted
  check in *Done when*, run on Windows).
- RF-3: THE SYSTEM's e2e code uses the platform's own `fetch`, with no HTTP client dependency. —
  **Check:** the dependency guard lists today's sets minus `node-fetch` and `@types/node-fetch`.

## Non-functional requirements

- No check loses coverage: every test that runs today runs after, against the same pages.
- A full run takes no longer than today's 1.2–1.9 minutes.

## Edge cases

- A run interrupted midway: the runner owns the server and stops it with the run (RF-2).
- A spec that needs a configuration the shared server lacks: none today; the contact-form stub
  configuration already lives on the shared server.

## Out of scope

- The `vite-error-overlay` guard in `openIn`/`gotoPastOverlay`: kept while a cold server can still
  show it once; whether it can go is measured after, not promised here.
- Changing what any check asserts.

## Done when

`npm test` and `npm run test:e2e` green; the RF-1 guard shown red by injecting a spawn into one
spec; RF-2 checked after a full run and after one interrupted on purpose.

## Open questions

None.

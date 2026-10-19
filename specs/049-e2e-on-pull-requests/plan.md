# Plan 049 — Rendered checks gate pull requests, not commits

**Spec:** `specs/049-e2e-on-pull-requests/spec.md` (8 RF).
**Status:** approved
**Approved:** 2026-10-18 · owner approval · 162 lines
**Changed:** 2026-10-18 · RF-6's Node major received from the owner: engines.node is `22.x`, Vercel's runtime; the guard checks that value · 163 lines

Three files change behaviour: `.husky/pre-commit`, `.github/workflows/ci.yml` and `package.json`.
Two documents change policy: `docs/constitution.md` rule 7 and `AGENTS.md`. The documents land
first, in their own `docs:` commit, then the hook, then the workflow (spec NFR). RF-6's Node major is
the owner's input, received 2026-10-18: the Vercel project runs `22.x`.

## 1. Scope and coverage

| RF / NFR / edge | Covered by |
|---|---|
| RF-1 (hook) | The `npm run test:e2e` block and its header line leave the hook; the `shortcut:` check and `npm test` stay. `tests/ci-policy.test.ts` reads the hook. |
| RF-2 (PR gate) | The e2e job keeps `needs: unit-tests` and runs on `pull_request` into `main`; the test reads the triggers and the job. |
| RF-3 (push backstop) | The same job keeps its `push` to `main` condition; the test reads it. |
| RF-4 (installed Chrome) | The `npx playwright install --with-deps` step goes; `playwright.config.ts` already says `channel: 'chrome'`. The test finds no `playwright install`; the first PR's log is the proof (P-3). |
| RF-5 (token, selection) | The e2e step gains `env: GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}`, `GITHUB_TOPIC: ${{ vars.GITHUB_TOPIC }}`, `GITHUB_USERNAME: ${{ vars.GITHUB_USERNAME }}`; the test reads them. |
| RF-6 (Node, one place) | `package.json` gains `"engines": { "node": "22.x" }`, the Vercel project's runtime; every `actions/setup-node` step uses `node-version-file: package.json` instead of `node-version` (P-2). |
| RF-7 (constitution 7) | New wording for rule 7 and its check (block 4). |
| RF-8 (AGENTS) | The Commands line, the Git line on the hook, and the new task rule (block 4). |
| NFR no dependency | Nothing added to `package.json` but `engines`; no new action. |
| NFR amendment first | T-1 is the documents, alone in their `docs:` commit, before T-2 touches the hook. |
| NFR webServer | Unchanged: `playwright.config.ts` starts the server with its fakes; the selection comes from RF-5. |
| Edge `--no-verify` | No change; the PR gate covers it. |
| Edge fork PR | `secrets.GITHUB_TOKEN` exists read-only on a fork's run; nothing to build. |
| Edge Linux-only failure | A rule in the AGENTS task line (block 4): reported and re-measured, never a widened tolerance. |
| Edge GitHub slow, 30/min | No change; spec 023's cache. |
| P-1 (YAML by regex) | The test reads the workflow with line regexes, `#` comments stripped, no YAML parser (constitution 1, 7). |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `docs/constitution.md` | modify | Rule 7 says where each suite runs, and its check names both files. |
| `AGENTS.md` | modify | Commands and Git say the hook runs `npm test` and CI runs both; a task still runs the e2e it touches. Names `tests/ci-policy.test.ts` as the guard (constitution 3). |
| `.husky/pre-commit` | modify | Decides what a commit waits on: the `shortcut:` check and `npm test`, nothing rendered. |
| `.github/workflows/ci.yml` | modify | Decides what a pull request into `main` and a push to `main` wait on, on which browser, Node and GitHub selection. |
| `package.json` | modify | Declares the Node major once (`engines.node`). |
| `tests/ci-policy.test.ts` | create | Reads the hook, the workflow and `package.json`; settles RF-1 to RF-6. |
| `Memory.md` | modify | Its traps on "the pre-commit measures the working tree" and "each commit passes the hook alone" now mean `npm test` only; rewritten, kept under 50 lines. |

## 3. Pure logic

Local to `tests/ci-policy.test.ts`; nothing reads the clock.

```ts
/** The text with every `#` comment removed, a shebang included; `${{ }}` and quoted `#` kept. */
stripHashComments(src: string): string

/** Each top-level job under `jobs:` as its name and the lines indented under it. */
jobs(workflow: string): { name: string; body: string }[]

/** The branches listed under `on.<event>.branches`, or [] when the event is absent. */
triggerBranches(workflow: string, event: 'push' | 'pull_request'): string[]
```

`stripHashComments` drops a `#` only at a line's start or after whitespace and outside quotes, so
`${{ secrets.GITHUB_TOKEN }}` and `'^+.*shortcut:'` survive. Both helpers stay in the test file: one
test imports them (AGENTS, Tests).

## 4. Algorithm

The guard (`tests/ci-policy.test.ts`), each `it` named after its RF:

```ts
hook = stripHashComments(read('.husky/pre-commit'))
RF-1: hook matches /shortcut:/ and /\bnpm test\b/; hook does not match /test:e2e|playwright/
wf = stripHashComments(read('.github/workflows/ci.yml'))
e2e = jobs(wf).find(j => /npm run test:e2e/.test(j.body))
unit = jobs(wf).find(j => /\bnpm test\b/.test(j.body))
RF-2: e2e and unit exist; triggerBranches(wf, 'pull_request') includes 'main';
      e2e.body matches new RegExp(`needs:\\s*\\[?\\s*${unit.name}`);
      e2e's `if:` (when present) admits pull_request with base_ref == 'main'
RF-3: triggerBranches(wf, 'push') includes 'main'; e2e's `if:` admits refs/heads/main
RF-4: wf does not match /playwright\s+install/
RF-5: for NAME, SOURCE in [GITHUB_TOKEN secrets, GITHUB_TOPIC vars, GITHUB_USERNAME vars]:
        e2e.body matches new RegExp(`${NAME}:\\s*\\$\\{\\{\\s*${SOURCE}\\.${NAME}\\s*\\}\\}`)
      and e2e.body has no other `NAME:` line (no literal value)
RF-6: JSON.parse(read('package.json')).engines?.node === '22.x';
      every `uses: actions/setup-node` step carries `node-version-file: package.json`
      and the workflow has no `node-version:` key
```

The documents' new text (RF-7, RF-8), for the owner to approve in T-1:

- **Constitution rule 7:** "**Tests run on what is installed.** `npm test` (`vitest --run tests`)
  and `npm run test:e2e` (Playwright on the installed Chrome) are the whole policy: the pre-commit
  hook runs `npm test`, and CI runs both on every pull request into `main`, the rendered suite on
  the runner's installed Chrome; a new dependency to test something needs its reason written down
  first. *Check:* `devDependencies` grew by nothing, `.husky/pre-commit` runs `npm test` and no
  rendered suite, and `.github/workflows/ci.yml` runs both on pull requests into `main` with no
  browser download (`tests/ci-policy.test.ts`)."
- **AGENTS, Commands:** the first line keeps both commands as the policy and adds: "**A task runs
  the rendered checks it touches before it is reported done** — the hook no longer runs them, so a
  red e2e found at the pull request is a task that skipped this. A check that fails only on CI's
  Linux Chrome is a finding for the owner, re-measured on the runner, never a widened tolerance."
- **AGENTS, Git:** "**The pre-commit hook runs the `shortcut:` check and `npm test`, and cancels the
  commit on failure**; CI runs `npm test` and `npm run test:e2e` on every pull request into `main`
  and every push to it. *Settled by `tests/ci-policy.test.ts`.*" The `--no-verify` sentence stays.
  The lint/format line's "add them to `.husky/pre-commit`" stays as is.

The hook loses its `npm run test:e2e` block and the header comment's line for it. The workflow
loses the `Install Playwright browsers` step and both `node-version: '20'` lines, and gains the
step `env` of RF-5 and `node-version-file: package.json` in both `setup-node` steps.

## 5. Interface

Nothing visitor-facing. For whoever commits: a commit waits on the `shortcut:` check and `npm test`
only. On GitHub: a pull request into `main` shows two checks, `unit-tests` and `e2e-tests`, the
second needing the first; a push to `main` runs the same two. Without the repository variables
set, `GITHUB_TOPIC` and `GITHUB_USERNAME` reach the server empty and the site falls back as it does
today without a `.env` (`USER` defaults to `XDextX`, no topic filter); that state is the owner step
in Done when, not a code path to add.

## 6. Decisions

- **D-1 · One guard file, `tests/ci-policy.test.ts`.** *Discarded:* extending
  `tests/e2e-infra.test.ts`, whose subject is the e2e files themselves (spec 022), not where the
  suites run.
- **D-2 · Regex over the YAML, no parser (P-1).** *Discarded:* a YAML dependency, which
  constitution 1 and 7 forbid for a check; the workflow is small and its shape is fixed by this
  spec.
- **D-3 · `node-version-file: package.json` (P-2).** `actions/setup-node` reads `engines.node`
  from it. *Discarded:* an `.nvmrc`, a second file for one datum; and a literal in the workflow,
  which RF-6 forbids.
- **D-4 · The Actions token, `secrets.GITHUB_TOKEN`.** *Discarded:* a personal token stored as a
  secret, which outlives the run and can write; the workflow's token is per run and read-only on
  forks.
- **D-5 · Keep `actions/cache` and `npm install` as they are.** *Discarded:* `npm ci` and an e2e
  cache, out of scope by the spec.
- **D-6 · The guard lands with each change, not before it.** The hook still runs `npm test`, so a
  red guard blocks the commit: each task writes its part of the test red, then the fix, in one
  commit. *Discarded:* the whole guard first, which no commit could pass.

## 7. Test strategy

Runners from `package.json`: `npm test` (`vitest --run tests`) and `npm run test:e2e` (Playwright on
the installed Chrome). The new guard runs under `npm test`; the workflow's own run is checked on
GitHub.

- **Data:** `stripHashComments`, `jobs` and `triggerBranches` on the real files and on small inline
  strings: a shebang, a `#` inside quotes, `${{ }}`, a job with `needs:` as a list and as a scalar.
- **Source (constitution 8 reason in the spec):** RF-1 to RF-6 per block 4.
- **Rendered, local:** none new. T-3 confirms by hand that a process environment variable reaches
  `import.meta.env` on the dev server: start it with `GITHUB_USERNAME` set to another account (Vite
  lets the process environment override `.env`) and read that the project list changes.
- **Rendered, CI:** the first pull request into `main` (P-3): the e2e job's log shows the `chrome`
  channel, no browser download, and both jobs green.
- **Injections**, each reverted by explicit path:
  1. Put `npm run test:e2e` back in the hook → RF-1 red.
  2. Mention `npm run test:e2e` only in a hook comment → RF-1 green, proving comments are stripped.
  3. Put a `npx playwright install --with-deps` step back → RF-4 red.
  4. Remove `pull_request` from `on:` → RF-2 red.
  5. Drop the e2e job's `needs:` → RF-2 red.
  6. Remove `main` from the push branches → RF-3 red.
  7. `GITHUB_TOKEN: ghp_fake` as a literal → RF-5 red.
  8. Drop `GITHUB_TOPIC` from the step's `env` → RF-5 red.
  9. Put `node-version: '20'` back in one job → RF-6 red.
  10. Delete `engines` from `package.json` → RF-6 red.

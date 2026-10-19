# Spec 049 — Rendered checks gate pull requests, not commits

**Status:** implemented
**Size:** L
**Approved:** 2026-10-18 · one clarify round (0 blockers, 6 minor applied) with the owner's three decisions · 135 lines, 8 RF
**Implemented:** 2026-10-18 · commits `1f32378` (constitution 7 + AGENTS), `2492c44` (hook, workflow, engines, guard) on spec/049-e2e-on-pull-requests · 5/6 tasks (T-6, the first PR with repository variables and branch protection, is the owner's), `npm test` 336/336, e2e 319/319 · 8/8 RF validated by the SDD reviewer in two rounds; injections 1–10 and A–C red
**Changed:** 2026-10-18 · RF-6 resolved: the owner's input, Vercel's Node.js 22.x, is the declared `engines.node` · 139 lines

## Context and goal

The owner's goal, in their words: "que los e2e solo se ejecuten al merge de un pr con main". Today
`.husky/pre-commit` runs the `shortcut:` check, then `npm test`, then `npm run test:e2e` on every
commit: spec 048's nine component commits spent about 25 minutes in suites. Constitution 7 makes
that the policy ("the pre-commit hook runs both"), and AGENTS repeats it in Commands and Git.

`.github/workflows/ci.yml` already runs `npm test` on pushes and pull requests and an e2e job on
pull requests into `main` and pushes to `main`, but it doesn't match the project's rules:

- It runs `npx playwright install --with-deps`, a browser download, although `playwright.config.ts`
  uses `channel: 'chrome'`, the installed Chrome (constitution 7).
- It passes no GitHub token, although the e2e server reads the live GitHub API, rate-limited per
  IP for anonymous calls on shared runners.
- It has no `.env`, while the local `.env` sets `GITHUB_TOPIC` and `GITHUB_USERNAME`, so a CI run
  and a local run list different repositories.
- It pins Node 20, while the local machine runs 23 and `package.json` declares no `engines`.

Decided with the owner on 2026-10-18: every spec branch reaches `main` through a GitHub pull
request, which the owner pushes and merges (no session pushes); the e2e run on pushes to `main`
stays as a backstop; CI runs the Node major the Vercel project runs.

Goal: commits stay fast, and the full rendered suite becomes the gate every change passes before
it reaches `main`.

## Definitions

- **The hook**: `.husky/pre-commit`, run by git before each commit.
- **CI**: the GitHub Actions workflow in `.github/workflows/`.
- **Pull request into main**: a GitHub pull request whose base branch is `main`.

## Actors

- The owner, who pushes spec branches and merges their pull requests into `main`.
- The sessions and agents that commit on spec branches.

## User stories

- US-1: As the owner, I want a commit to take seconds, not minutes, so that a spec's per-component
  commits don't wait on the full rendered suite.
- US-2: As the owner, I want no change to reach `main` without the rendered suite passing on it.

## Requirements (EARS)

RF-1 to RF-6 are settled by a test that reads the hook or the workflow (constitution 3). These are
source checks on purpose (constitution 8): both files are configuration, with no output to render.
RF-7 and RF-8 are settled by reading the two documents.

- RF-1: WHEN a commit is made, THE SYSTEM runs the `shortcut:` check and `npm test`, and not the
  rendered suite. — **Check:** the test finds, in the hook with comments stripped, the `shortcut:`
  check and `npm test`, and no `test:e2e` or `playwright`.
- RF-2: WHEN a pull request into `main` is opened or updated, THE SYSTEM runs `npm test` and then
  `npm run test:e2e` on it in CI (owner, 2026-10-18). — **Check:** the test finds a job that runs
  `npm run test:e2e` on `pull_request` events targeting `main`, needing the job that runs
  `npm test`.
- RF-3: WHEN a push lands on `main`, THE SYSTEM runs the same two suites in CI as a backstop (owner,
  2026-10-18). — **Check:** the test finds the e2e job also running on `push` events to `main`.
- RF-4: THE SYSTEM runs CI's rendered suite on the runner's installed Chrome and downloads no
  browser. — **Check:** the test finds no `playwright install` in the workflow; the first run's log
  shows the suite on the `chrome` channel and no browser download.
- RF-5: THE SYSTEM gives CI's rendered suite the GitHub token and the repository selection the site
  reads. — **Check:** the test finds, in the e2e step's environment, `GITHUB_TOKEN` from the
  workflow's own token (`secrets.GITHUB_TOKEN`), and `GITHUB_TOPIC` and `GITHUB_USERNAME` from
  repository variables (`vars.*`); no secret or variable value is written in the workflow.
- RF-6: THE SYSTEM runs CI on the Node major the project declares in one place, the one the Vercel
  project runs: 22 (owner, 2026-10-18; the project's setting reads `22.x`). — **Check:**
  `package.json` declares `engines.node` as `22.x`, and the
  test finds every job reading it from there rather than carrying a version literal of its own.
- RF-7: THE SYSTEM's constitution rule 7 states this policy and its check: the hook runs `npm test`,
  and CI runs `npm test` and `npm run test:e2e` on every pull request into `main`, the rendered
  suite on the installed Chrome. — **Check:** reading `docs/constitution.md`, rule 7's text and
  check name the hook for `npm test` and CI for both, and no longer say the hook runs both.
- RF-8: THE SYSTEM's `AGENTS.md` follows the new rule 7 in Commands and Git, and says that whoever
  implements a task still runs the rendered checks that task touches before reporting it done. —
  **Check:** reading `AGENTS.md`, no line says the hook runs `test:e2e`, and the Commands section
  carries the task rule.

## Non-functional requirements

- No new dependency, devDependency or third-party action beyond the ones the workflow already uses
  (`actions/checkout`, `actions/setup-node`, `actions/cache`) (constitution 1 and 7).
- The constitution 7 amendment is approved by the owner and lands first, in its own `docs:` commit
  with the `AGENTS.md` lines, before the hook stops running the rendered suite (AGENTS, Git).
- CI's e2e job starts the server through `playwright.config.ts`'s `webServer`, with its fake contact
  values, as a local run does; the GitHub selection comes from RF-5.

## Edge cases

- A commit made with `--no-verify`: unchanged, still an escape hatch; CI catches it at the pull
  request. RF-1, RF-2.
- A pull request from a fork: the workflow's token is read-only there and still authenticates the
  public API calls. RF-5.
- A push straight to `main` that skips a pull request: RF-3 runs the suites after the fact;
  stopping such pushes is branch protection, owner-side. RF-3.
- A spec task changes a component: its implementer runs that component's e2e specs locally before
  reporting done, so a red suite is found during the task, not at the pull request. RF-8.
- A rendered guard that fails only on the runner's Linux Chrome: a finding reported to the owner,
  re-measured on the runner, never a widened tolerance to make it pass. RF-4.
- The live GitHub API is slow or down during a CI run: the suite may fail on it, as it can locally
  today. With a token the Search API allows 30 requests a minute; spec 023's 30-minute cache keeps a
  run's calls under that. Out of scope beyond that.

## Out of scope

- Making the rendered suite independent of the live GitHub API, and fixing flaky tests.
- Running e2e in parallel or sharding it.
- `npm install` versus `npm ci`, and caching npm in the e2e job.
- Deployment (Vercel builds on its own).
- Branch protection and the repository variables themselves: GitHub settings the owner makes
  (Done when).

## Done when

The owner approves the constitution 7 amendment, and it lands in its own `docs:` commit before the
hook change. `npm test` green, with the new guard shown red by injection (`npm run test:e2e` put
back in the hook, then a `playwright install` step put back in the workflow). A commit on a spec
branch runs only the hook's checks. The first pull request into `main` after this spec shows
`npm test` and `npm run test:e2e` green in CI, on the installed Chrome with no browser download.

Owner steps, outside the repository:
- Node major: received 2026-10-18, the Vercel project "portfolio" runs Node.js `22.x` (its
  `nodeVersion` setting). Vercel lets `engines.node` override that setting, so the declared value
  stays `22.x` unless the owner changes the project's runtime.
- Set the repository variables `GITHUB_TOPIC` and `GITHUB_USERNAME` to the values `.env` and Vercel
  use.
- Turn on branch protection on `main`, requiring the e2e check to pass before a merge.

## Open questions

None. Resolved 2026-10-18 (owner): spec branches reach `main` through GitHub pull requests; the e2e
run on pushes to `main` stays; the Node major is Vercel's, `22.x`, read by the owner
(Done when).

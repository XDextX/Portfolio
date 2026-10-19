# Tasks 049 — Rendered checks gate pull requests, not commits

**Spec:** `specs/049-e2e-on-pull-requests/spec.md` (8 RF) · **Plan:** `plan.md`
**Status:** approved
**Approved:** 2026-10-18 · owner approval · 59 lines
**Changed:** 2026-10-18 · T-4 no longer waits: the owner's Node major is `22.x`, Vercel's runtime · 60 lines

Injection numbers refer to block 7 of the plan. Order: the documents, then the hook, then the
workflow, then Node (spec NFR). Each code task writes its part of `tests/ci-policy.test.ts` red,
then the fix, in one commit, since the hook still runs `npm test` (plan D-6).

- [x] **T-1 — Amend constitution rule 7 and AGENTS**
  Covers: RF-7, RF-8
  Files: `docs/constitution.md`, `AGENTS.md`
  Done when: rule 7 and the AGENTS Commands and Git lines read as block 4 of the plan proposes; no
  line in either says the hook runs `test:e2e`; **the owner approves the wording**, and it lands
  alone in its own `docs:` commit.

  First, because the amendment governs the hook change (spec NFR).

- [x] **T-2 — The hook runs the `shortcut:` check and `npm test` only**
  Covers: RF-1
  Files: `.husky/pre-commit`, `tests/ci-policy.test.ts` (`stripHashComments`, RF-1)
  Done when: the RF-1 test is red on today's hook, then green; injection 1 red and injection 2 green,
  both restored; `npm test` green; a commit on the branch runs no Playwright.

- [x] **T-3 — The workflow: PR gate, push backstop, installed Chrome, token and selection**
  Covers: RF-2, RF-3, RF-4, RF-5
  Files: `.github/workflows/ci.yml`, `tests/ci-policy.test.ts` (`jobs`, `triggerBranches`, RF-2 to
  RF-5)
  Done when: the RF-4 and RF-5 tests are red on today's workflow, then green, with RF-2 and RF-3
  green throughout; injections 3 to 8 red and restored; `npm test` green; the dev server started
  with `GITHUB_USERNAME` set to another account lists that account's repositories, so a process
  variable reaches `import.meta.env` (plan block 7).

- [x] **T-4 — Declare the Node major once and read it in CI**
  Covers: RF-6
  Files: `package.json` (`engines.node`), `.github/workflows/ci.yml`, `tests/ci-policy.test.ts`
  (RF-6)
  Done when: the RF-6 test is red, then green; injections 9 and 10 red and restored; `npm test`
  green.

  The owner's input is in (2026-10-18): the Vercel project runs Node.js `22.x`, so `engines.node`
  is `22.x`. Keep that value: Vercel lets `engines.node` override its dashboard setting, so any
  other value changes the production runtime.

- [x] **T-5 — Bring Memory.md in line** (mechanical, no RF)
  Files: `Memory.md`
  Done when: the traps on "the pre-commit measures the working tree" and "each commit passes the
  hook alone" say they now concern `npm test` only; the file stays under 50 lines.

- [ ] **T-6 — The first pull request into main**
  Covers: RF-2, RF-4, RF-5 (proved on GitHub)
  Files: none
  Done when: the owner has set the repository variables `GITHUB_TOPIC` and `GITHUB_USERNAME`,
  pushed the branch and opened its pull request; both checks are green; the e2e job's log shows the
  `chrome` channel and no browser download; the owner turns on branch protection on `main`
  requiring the e2e check.

  Last, because it needs every change pushed; no session pushes.

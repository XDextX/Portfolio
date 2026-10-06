# Constitution

Ten rules. Each names where it is decided: a test, a command, or a file to read.
Breaking one is a bug — the fix is the rule or an amendment, never a workaround
in the code. `AGENTS.md` elaborates these and wins on any conflict.

1. **Two runtime dependencies.** `astro` and `@astrojs/node`, nothing else: no UI
   framework, no CSS or icon library. *Check:* `package.json` `dependencies`.
2. **No third-party subresource.** Two font families self-hosted in
   `public/fonts`. The one remote asset a page loads is the GitHub avatar.
   *Check:* the only host in `src/` a browser **fetches** is
   `avatars.githubusercontent.com`; the rest are namespaces and outbound links.
3. **A mechanical rule ships with a guard.** If a rule can be settled by
   reading files, a test settles it. Prose is not a check. *Check:* the test
   table in `AGENTS.md` names a file per mechanical rule.
4. **A guard must fail once.** Never call a test green before injecting the
   violation it exists for and watching it go red; six guards here were green
   while doing the exact thing they forbid. *Check:* the commit names it.
5. **Content, rendering and routes stay apart.** Editable content is
   `src/data/*.ts` and `i18n/locales/*.json`, rendering is
   `src/components/*.astro`, and only routes live in `src/pages/`.
   *Check:* `notfound.test.ts` — `Resume.astro` is not in `pages/`.
6. **The token has one reader.** `GITHUB_TOKEN` is read in
   `src/pages/lib/github.ts` and nowhere else, and both routes rank with the
   same `sortRepos()`. *Check:* one reader, one definition.
7. **Tests run on what is installed.** `npm test` (`vitest --run tests`) is the
   whole policy; a new dependency to test something needs its reason written
   down first. *Check:* `devDependencies` grew by nothing.
8. **Assert data and rendered output, not source substrings.** A source grep
   breaks on refactors that change nothing visible. *Check:* a new one needs a
   reason it cannot be a data check.
9. **Secrets server-side, identifiers stated once.** `.env` is gitignored, and the
   literal full name and the real address live only in `src/data/contacts.ts` and
   `src/data/about.ts`. A public profile may be linked, never spelled out.
   *Check:* `grep -rn "gmail\.com" tests/` is empty.
10. **Two languages, on purpose.** Code, comments and these documents are
    English; visitor-facing text is Spanish and goes through `t()`.
    *Check:* `i18n.test.ts` — every key resolves in both locales.

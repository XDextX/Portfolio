# AGENTS.md

Astro 5 personal portfolio (SSR). Single package, no monorepo. Content is data-driven from
`src/data/*.ts`; projects are pulled live from the GitHub API.

This file must stay in English. `Memory.md` is the agent's call — it can be in any language.

## Commands — verified working vs. broken

| Command | Status |
|---|---|
| `npm run build` | works (~4s) |
| `npm test` | works |
| `npx playwright test` | works (1 test, ~7s, spawns its own dev server on :4321) |
| `npm run lint` | **broken** — `eslint` is not a dependency and there is no config |
| `npm run format` | **broken** — `prettier` is not a dependency and there is no config |
| `npx astro check` | **unavailable** — prompts to install `@astrojs/check` + `typescript` |

`npm run lint` / `npm run format` are aspirational. Don't report their failure as a regression you caused,
and don't add a formatting pass "to match" — there is no formatter config to match.

### Running tests

```bash
npm test                          # = vitest --run tests   (the positional `tests` arg scopes it)
npx vitest --run tests/foo.test.ts # one file
npx vitest --run -t "name"         # one test by name
```

Do **not** run bare `npx vitest --run`. Without the `tests` filter it also picks up `e2e/about.spec.ts`
and fails on a missing Playwright runtime. This is the single most likely way to get a confusing red result.

Tests assert on **data and rendered invariants, not on source substrings**. The old
`aboutsection.test.ts` asserted the literal `mailto:` appeared in `AboutSection.astro`; commit `7843605`
had already moved socials into `src/data/about.ts`, so the assertion broke while the page rendered fine.
Do not reintroduce grep-the-source tests — they rot on any refactor. Likewise `CONTACTS.length` is
asserted as ">= 1 with unique ids", not a fixed count, so adding a contact channel is not a breaking change.

## Environment variables

Read via `import.meta.env` only — never `process.env`. In `.env`:

- `GITHUB_USERNAME` — defaults to `XDextX` in code
- `GITHUB_TOKEN` — optional, avoids rate limits. Server-side only; never let it reach a client bundle.
- `GITHUB_TOPIC` — currently set to `""`. When empty, `ghListByTopic` falls back to `user:XDextX`
  (all public repos) and the topic filter on `/proyectos` becomes a no-op.
- `DEFAULT_LOCALE` — **dead config.** Nothing reads it. The default locale is the hardcoded
  `const DEFAULT_LOCALE: Locale = 'es'` in `src/utils/locale.ts`.

`.env` is gitignored and currently holds a live GitHub PAT in plaintext. Never commit it, never echo it.

## Verify live, not just with build and tests

A green build and green tests **do not** catch render bugs. Start a dev server and hit the pages:

```powershell
$job = Start-Job { npx astro dev --port 439X }; Start-Sleep 13
Invoke-WebRequest "http://localhost:439X/route" -UseBasicParsing | Select-Object StatusCode
Stop-Job $job; Remove-Job $job -Force
```

That is how two real bugs surfaced which the build did not flag: broken JSON-LD and the
duplicated `/Resume` route.

## Structural rules

- **Never leave a page component in `src/pages/`.** Astro registers it as a route even if it is only
  used as a component. `Resume.astro` lived there and served `/Resume`, duplicating `/` with
  conflicting canonical and hreflang tags. The home section is `src/components/Resume.astro`.
- **One source per datum.** `ABOUT.socials` is derived from `CONTACTS` by id; do not duplicate
  email/GitHub/LinkedIn across two files.
- **Public URLs need a leading slash.** `resumeUrl` is `/cv/...`, not `cv/...` — the relative form
  resolved incorrectly from `/proyectos`.
- **JSON-LD with `set:html`, never `is:inline` plus interpolation.** `is:inline` disables expression
  evaluation, so `{JSON.stringify(x)}` was emitted as literal text. Both sites are fixed in
  `AboutSection.astro` and `BaseLayout.astro`; do not reintroduce the old pattern.

## Design tokens are an invariant, not a convention

A custom property that is read but never defined **fails silently**. `var(--missing)` makes the
whole declaration "invalid at computed-value time", so the browser drops it and falls back to the
initial value with nothing in the console. `AvatarCircle` shipped
`border: var(--ring) solid var(--avatar-ring)` for weeks against a token that existed nowhere, and
the avatar rendered as `0px none`.

- **Never write `var(--x)` for a token you have not defined in `00-tokens.css` or `themes/*.css`.**
  If a fallback is genuinely needed, say why in a comment.
- **A hardcoded colour as the only fallback is a bug**, not a safety net: it never follows the
  theme. That is how `var(--border-color, #3a4056)` ended up dark-grey in both themes.
- `tests/tokens.test.ts` enforces all of this: no undefined-and-unfallbacked `var()`, no token kept
  alive only by a hardcoded colour, no duplicate declaration inside one rule. **Run it before
  claiming a styling change is done.** It fails on a typo (`--color-bordr`), so it is not vacuous.
- Alias a token when a component needs a theme-aware value: `--avatar-ring: var(--color-border)`
  resolves correctly in both themes because both redefine `--color-border`. That avoids a
  `--x` / `--x-dark` pair and any per-theme override inside a component.
- Prefer `!important` on a custom property in a media query when the base value is set inline —
  it is the only way an author rule can beat the inline declaration.

## CSS that silently does nothing

- **`attr()` only works for `content` properties.** `attr(data-size px)` in a size declaration is
  invalid everywhere. If a prop must change at a breakpoint, emit it as a custom property and read
  it from the media query.
- **Check `grid-template-columns` arithmetic against the real container width.** `SkillBar` spent
  ~260px on fixed columns inside a `repeat(2, 1fr)` column, leaving the progress track 31px at
  929px of viewport and **0px** below ~546px of content. A `1fr` track silently collapses to zero
  when the fixed columns exceed the row. Give the flexible track a `minmax(<floor>, 1fr)` and use
  `repeat(auto-fit, minmax(min(<needed>, 100%), 1fr))` so the column count adapts to real space.
- **Fixed-size decorative markup is a duplicate waiting to happen.** When you catch one, say so.

## Structured data: one entity, one format

- **Never mix microdata (`itemscope`) and JSON-LD for the same entity on one page.** Search engines
  read that as two conflicting entities. `AboutSection` owns the `Person` JSON-LD; do not add an
  `itemscope` wrapper elsewhere for the same person.
- **Person identity lives in `src/data/about.ts` only.** A literal name inside a component is a
  duplicate source, even in a `<meta itemprop>`.
- Prefer an explicit `sameAs: true` flag on a contact over re-deriving "is this publishable?"
  from another field. One flag, read by whoever needs it.

## Public asset paths

Root-absolute, always: `"/icons/gmail.svg"`, `"/tech/react.svg"`, `"/cv/file.pdf"`.

A relative `src="icons/x.svg"` resolves against the *current route*, so it works on `/` and
`/proyectos` but 404s on `/proyectos/<name>`. This is the `resumeUrl` bug again. `tests/contact.test.ts`
asserts the leading slash and that the file exists, for every contact.

## Interactive markup needs a stable hook, not a positional one

- **Never index into `childNodes` to swap a label.** `toggle.childNodes[0].textContent = …` breaks
  silently the moment someone adds whitespace or wraps the text. Give the label its own element
  (`data-projects-toggle-label`) and target that.
- **Do not emit an attribute nobody reads.** `data-preview` was written on every projects grid and
  consumed by nothing. Grep before adding one.
- **Do not pass a prop a component does not declare.** `Resume` sent `locale` to a `ContactSection`
  with no `Props`, where it was dropped without a word.
- Prefer the implicit `<label><select/></label>` association over a `for`/`id` pair: it needs no id,
  so it cannot collide.
- Render a non-interactive element when there is nothing to interact with. `SkillChip` emitted
  `<a href="#">` for techs with no link — a focusable element that only jumps the page to the top.
- Translations must go through `t()`. Inline `lang === 'es' ? '…' : '…'` and literals like
  `aria-label='Vista'` survive a locale switch and ship Spanish to English readers.
- `title` is a weak accessible name. Pair it with `aria-label`.

## Comments do not belong in the template

**Anything between the frontmatter fences and the markup is not a comment.** Astro emits it
verbatim into the response, so a `//` note in the template ships to every visitor as a stray HTML
comment and shows up in view-source and DevTools. Put implementation notes in the **frontmatter**,
where they never leave the build.

- Short HTML labels (`<!-- Header -->`, `<!-- BARS -->`) in the markup are the existing style and
  are fine. A prose note is not.
- `tests/comments.test.ts` enforces both halves: no `//` line in the markup region, and no HTML
  comment longer than 90 characters.
- Inside `<script>` and `<style>`, `//` is a real comment and is stripped at build. Only the
  markup region leaks.

## Client scripts under `<ClientRouter />`

`<ClientRouter />` (view transitions) is **enabled on purpose and stays**. Mandatory rules:

- Every client script binds via `document.addEventListener('astro:page-load', ...)`, never with
  `DOMContentLoaded` or a bare module-level `addEventListener`. The router replaces the DOM on each
  navigation, so a listener bound once dies on the first transition.
- **`<script is:inline>` is forbidden for client logic.** It only runs with the server HTML.
  Note: `is:inline` + `{JSON.stringify(x)}` does not evaluate the expression either, it emits the
  literal. For JSON-LD use `set:html={JSON.stringify(x)}`.
- **`document.currentScript` is forbidden** for capturing containers. After a swap it points at the
  stale node.
- **No global ids for JS hooks.** Use `data-*` and resolve relative to the container
  (`root.querySelector`), so several instances on one page work independently.
- `transition:name` must match between source and destination (e.g. `p-${repo.id}-title` in
  `ProjectCard.astro` and in `proyectos/[name].astro`) — that is what makes the card " travel".

`tests/viewtransitions.test.ts` enforces these rules. If you must skip one, do it explicitly and
update that test.

## MCP: chrome-devtools

`opencode.json` runs `npx chrome-devtools-mcp@latest` with no flags: the MCP finds a Chromium on its
own (Chrome or its bundled one) and starts with no extra configuration.

- **Do not nest `mcpServers`** inside `mcp` — that is the VS Code / Claude Desktop format and it does
  not work here. The `mcp` key is a direct map of servers, and each one requires `type` and `command`
  as an **array**.
- **Do not hardcode browser paths.** OpenCode does not expand `{env:VAR}` inside `mcp.*.command`
  (the placeholder is dropped unexpanded), and an absolute path breaks on any other machine. If you
  need a different browser, install Chrome rather than fighting the path.
- On Windows, a path containing spaces (e.g. `Opera GX`) gets truncated when it goes through
  `cmd.exe`, which is why paths are not passed as arguments here.

## Code conventions

**Language:** code, comments and JSDoc in **English**. Do not translate site content:
`i18n/locales/es.json`, `ABOUT.bio.es` and user-visible strings (e.g. `'Ver más'` in
`ProjectsFooter`) are deliberately in Spanish — they are the translation target.

**DRY — extract before duplicating.** When the same markup, logic or style appears twice:

- *Markup* → a new component in `src/components/`, not another copy of the block.
  Reference patterns: `ProjectCard.astro`, `ProjectsSection.astro`.
- *Fetch/transform logic* → a helper in `src/pages/lib/github.ts` (`ghListByTopic`, `ghRepo`,
  `ghSearch`, `ghRepoReadme`). Tests and API routes import those helpers instead of reimplementing the fetch.
- *Styles* → a new token in `public/styles/00-tokens.css` or a utility in `src/styles/global.css`,
  rather than copying values between files.

**JSDoc on public helpers and components.** One description line plus `@param`/`@returns` on
helpers; on components, a typed `interface Props`. Examples: `src/data/levelLabels.ts`,
`src/types/github.ts`.

**Centralised fetch mocks.** Use `tests/helpers/github-mocks.ts`
(`mockGitHubSearchResponse`, `mockGitHubRepoResponse`, `mockErrorResponse`, `sequenceFetch`) plus
`vi.unstubAllGlobals()` in `afterEach`. Do not repeat the GitHub `fetch` shape in every spec.

## Quick file reference

| File | Responsibility |
|---|---|
| `src/layouts/BaseLayout.astro` | head/meta, OG tags, stylesheet `<link>`s, `<ClientRouter />`, theme anti-FOUC |
| `src/pages/lib/github.ts` | the only place that reads `GITHUB_TOKEN`; API helpers |
| `src/pages/api/github-list.json.ts` | repo list, 30 min TTL cache |
| `src/pages/api/v1/projects/[name].json.ts` | repo detail, its own cache |
| `src/components/Resume.astro` | home composition; **must not** live in `pages/` (see Structural rules) |
| `src/components/ProjectsSection.astro` | projects grid, `preview`, show-more toggle |
| `src/components/ProjectCard.astro` | card carrying `transition:name` `p-${repo.id}-*` |
| `src/data/*.ts` | editable content, no markup changes needed |
| `src/pages/lib/github.ts` | also holds `sortRepos()`, the single repo ranking used by `/` and `/proyectos` |
| `i18n/locales/{es,en}.json` | UI strings; edit **both together** |

## Tests

`npm test` = `vitest --run tests`. Do **not** run bare `npx vitest --run`: without the `tests`
filter it also picks up `e2e/about.spec.ts` and fails on a missing Playwright runtime.

| File | Guards |
|---|---|
| `tests/tokens.test.ts` | every `var(--x)` resolves; no token alive only on a hardcoded fallback; no duplicate declaration per rule |
| `tests/comments.test.ts` | no `//` in the markup region and no HTML comment over 90 chars — a comment there ships to the visitor |
| `tests/viewtransitions.test.ts` | client scripts re-bind on `astro:page-load`; no `is:inline`, no `currentScript`, no global id in any component |
| `tests/contact.test.ts` | contact shape; **icon paths are root-absolute and exist in `public/`** |
| `tests/notfound.test.ts` | the `/404` redirect target exists and its keys are in both locales |
| `tests/about.test.ts`, `tests/aboutsection.test.ts`, `tests/github-helpers.test.ts` | data invariants and GitHub helper behaviour |

## Never document sensitive data

Do not write into `AGENTS.md`, `Memory.md`, `README.md`, commit messages or any other repo document:
paths containing the real user name (`C:\Users\<your-user>\...`), emails, full names, physical
addresses, tokens, API keys or passwords.

- Use placeholders: `C:\Users\<user>\...`, `<email>`, `<token>`.
- In path examples, prefer variables (`$env:USERPROFILE`) over the literal path.
- It is fine to **flag the existence** of a secret and the risk (`there is a PAT in .env,
  do not commit it`), but never its value.
- When documenting a bug, describe the shape (`--executablePath=C:\...\Programs\Opera`) without
  filling in the rest with data from your machine.

This also applies to `.env`, which is gitignored but still a file on disk.

## Commits: husky, and non-negotiable git rules

There is a pre-commit hook: `.husky/pre-commit` runs `npm test` and **cancels the commit** on failure.
It is enabled by `"prepare": "husky"` in `package.json`, which runs on every `npm install`.

- If a commit is rejected, that is not a git bug: the suite failed. Fix the test first.
- Escape hatch only when intentional: `git commit --no-verify`.
- The hook does **not** call `npm run lint` or `npm run format` because both are broken (see the
  table above). When you fix them, add them to `.husky/pre-commit`.
- **NEVER `git push`.** Not even if the task asks for it or if the tests pass. The user asks
  explicitly if they ever want it. Do not offer to push on your own initiative.
- **NEVER create commits unless asked.** Only commit when the user requests it explicitly or when the
  commit is part of a flow already agreed (e.g. "prepare the commits", "commit this"). Finishing a
  task **does not** imply committing: leave the changes in the working tree.
- If unsure whether to commit, **ask** instead of deciding on your own.
- Normal state: uncommitted changes in the working tree, unpushed commits.

## Memory
- `Memory.md` is your memory. Keep it small (50 lines max); summarise what is stale and delete it.
  Its language is your call — this file stays English.
- **Split of roles:** the *rules* live only here in `AGENTS.md`. `Memory.md` is state and context only
  (what was done, what is pending, what is verified). Do not duplicate rules across the two: if a rule
  changes, change it here and keep it in one place.
- If something comes up often enough, propose a new rule and add it to `AGENTS.md`.
- After each task, update both `Memory.md` and `AGENTS.md`.
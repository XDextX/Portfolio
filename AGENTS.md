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

### A guard that cannot fail is worse than no guard

Six of the tests below were green while the exact thing they exist to prevent was happening in the
repo. All six failures had the same shape: the guard did not look where the violation actually was.

- **A length threshold cannot tell a label from a note.** `comments.test.ts` rejected HTML comments over
  90 characters; four real prose notes of 47-72 characters sailed through, and the threshold looked
  like it was working.
- **A per-line check misses a multi-line note.** The same test measured the first line of a comment. My
  notes were wrapped, so line one was short and lines two to four were never read — `SkillBar` shipped a
  271-character note, repeated ten times per page.
- **A scanner can silently drop half a file.** The same test set `skipUntil` on any `<script>` and
  cleared it on `</script>`. `AboutSection` has a self-closing `<script type="application/ld+json" />`,
  so everything after that line left the analysis for good.
- **A brace inside a CSS comment swallows the rule after it.** `tokens.test.ts` looked for duplicate
  declarations with `/\{([^{}]*)\}/g` over raw CSS. `00-tokens.css` carries a note quoting
  ``a { color: … }``, and that `{` paired with the `}` closing `:root`, so the scan read **193 characters
  of that file out of 6389** and never saw a token. Strip comments first — the other three tests in the
  same file already did, which is why only this one was blind.
- **A hardcoded list of files goes stale silently.** `viewtransitions.test.ts` iterated five component
  names. A sixth component with a `DOMContentLoaded` binding passed all seventeen tests, because the
  guard only read the names it had been told about. Derive the list from the filesystem.
- **An assertion can be satisfied by something other than the thing.** `aboutsection.test.ts` asserted
  `toContain('AvatarCircle')`, which the import path `'./AvatarCircle.astro'` satisfies on its own —
  replacing the component entirely, usage and import, stayed green. Ask what else in the file matches.

So: **prove a guard still bites before reporting green.** Inject a violation and watch it fail — do not
conclude it works because the suite passed. A green suite that has never failed is untested. And when a
guard is right, the fix is not to loosen it. All three times the fix was to widen what it reads, never to
relax what it accepts. `tokens.test.ts` now strips comments before collecting, because a note explaining
why a token was removed is not a use of it — the guard was reporting its own explanation.

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

**`output: "server"` means there is no build output to inspect.** `dist/` holds no `.html` at all —
pages are rendered per request. So checking the shipped HTML means fetching a running server, route by
route, and there is no shortcut via `dist/`. A 404 route throws in PowerShell's `Invoke-WebRequest`
(`-ErrorAction Stop`), which looks like a broken route in a scan; check it in the browser instead.

### The repo lives under OneDrive and the watcher lies

Vite's file watcher misses changes because the OneDrive sync swallows some events. Twice the log showed
no `[watch]` line for a component I had just edited, and the browser served a stylesheet without the fix
while the file on disk was correct. **After editing a component's `<style>`, confirm the rule is actually
in the CSSOM (`document.styleSheets`) before trusting any measurement.** If it is not there, restart the
dev server. Without this you end up debugging code that is already right, twice in one session.

Two more measurement traps in this environment:

- **`resize_page` does not move `innerWidth`.** Use `emulate({ viewport: "WxH" })`.
- **Measure after animations settle.** Reading `width` or a `transform` mid-transition gave 3.125px and
  an identity matrix when the settled values were 100% and a 180° rotation.

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
- **A token defined in one theme and read in both is worse than a missing one.** Nothing errors, and
  the fallback is another theme's palette. `--bg-color` existed in `light.css` only; the skills view
  toggle read it, so in dark the selected button painted `#E4E8EE` — a near-white grey from the palette
  this site moved off — on top of the navy sheet. **When you add a token, define it in both theme
  files or neither.**
- **A token name that says "behind" or "surface" is a claim about where it may be used.** `--bg` is
  the ground the sheet sits on; using it to fill something *inside* the sheet inverts depth. The skills
  toggle did exactly that. Respect the meaning, not just the value.
- **Do not define the same value twice under two names.** `--bg-color` and `--bg` both read `#E4E8EE`
  in light; the duplicate is what let one theme drift.
- `tests/tokens.test.ts` enforces the mechanical half: no undefined-and-unfallbacked `var()`, no token
  kept alive only by a hardcoded colour, no duplicate declaration inside one rule. It strips comments
  before reading, so a note about a token is not a use of it. **Run it before claiming a styling change
  is done.** It fails on a typo (`--color-bordr`) and on an invented token, so it is not vacuous.
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
- **A hardcoded value in a derived rule goes stale silently.** `calc(var(--radius-md) - 2px)` looked
  like "the group radius less its inset" but the inset was `0.2rem`, so it was wrong by construction
  and would have drifted the moment the token moved. Write the relationship, not the number.
- **`ch` is not a character.** `1ch` is the width of `0`: 9.61px in IBM Plex Sans at 16px, so `60ch`
  is 577px and about 72 characters. Never reason about `ch` as if it counted glyphs.
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
  silently the moment someone adds whitespace or wraps the text. Better still, do not swap text at all:
  the show-more button carries both labels and CSS reveals one, so the width cannot change with the
  state and no JS touches the text. When you must rewrite, give the label its own element
  (`data-projects-toggle-label`) and target that.
- **A label swap must not resize the control, and it must not depend on a hardcoded width.** Two
  translated strings have different lengths in every language, so a fixed `min-width` in `px` or `ch`
  is wrong somewhere. Stack both states in one `grid-template-areas` cell with `visibility: hidden` on
  the inactive one: the cell is `max-content` across both, so the width follows the text. Note that
  `display: none` would drop it from `max-content` — that is why it is `visibility`.
- **Do not emit an attribute nobody reads.** `data-preview` was written on every projects grid and
  consumed by nothing. Grep before adding one, and delete the ones left behind when the reader goes.
- **Do not pass a prop a component does not declare.** `Resume` sent `locale` to a `ContactSection`
  with no `Props`, where it was dropped without a word.
- Prefer the implicit `<label><select/></label>` association over a `for`/`id` pair: it needs no id,
  so it cannot collide. The label can be the control's own box, which keeps the association and still
  needs no id.
- Render a non-interactive element when there is nothing to interact with. `SkillChip` emitted
  `<a href="#">` for techs with no link — a focusable element that only jumps the page to the top.
- Translations must go through `t()`. Inline `lang === 'es' ? '…' : '…'` and literals like
  `aria-label='Vista'` survive a locale switch and ship Spanish to English readers.
- `title` is a weak accessible name. Pair it with `aria-label`.
- **Two controls side by side must state the constraint, not assume it.** The language select and the
  theme button were 29.00px and 29.59px tall because each derived its height from different padding.
  Both now carry an explicit `block-size`, with `box-sizing: border-box` making padding sit inside it.
  That is written as a literal in each file rather than a shared token: two controls are not a design
  system, and a `--control-h` would imply there is one. **When a third control has to match, that is
  when a token starts meaning something.**

## Comments do not belong in the template

**Anything between the frontmatter fences and the markup is not a comment.** Astro emits it
verbatim into the response, so a `//` note in the template ships to every visitor as a stray HTML
comment and shows up in view-source and DevTools. Put implementation notes in the **frontmatter**,
where they never leave the build.

- `{/* … */}` is stripped and would survive, but prefer the frontmatter anyway: nobody converts a
  frontmatter note into an `<!-- -->` by accident, and someone "simplifying" a brace comment would
  silently start shipping it.
- **Short HTML labels** (`<!-- Header -->`, `<!-- BARS -->`) are the existing style and are fine.
  `tests/comments.test.ts` enforces this as an **allowlist of sixteen known labels**, not a length
  limit, because a length limit cannot tell a label from a note and the notes that matter are short.
  A new label has to be added deliberately; that is the point.
- Inside `<script>` and `<style>`, `//` is a real comment and is stripped at build. Only the
  markup region leaks.
- **A note in a stylesheet does not need this treatment**, but it must not name a token as if it used
  one — see the guard section above.

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
- Page ids are 1-based in `list_pages`.
- Code Mode's runtime chokes on long template literals in `evaluate_script`. Store a helper on
  `window` in a short call, then read it back.
- **Wait for a real gap between tool calls before reading a settled value.** A `wait_for` on text
  matches text in the DOM even when it is `visibility: hidden`, so it returns immediately and the
  transition has not finished.

## Code conventions

**Language:** code, comments and JSDoc in **English**. Do not translate site content:
`i18n/locales/es.json`, `ABOUT.bio.es` and user-visible strings (e.g. `'Ver más proyectos'` in
`ProjectsFooter`) are deliberately in Spanish — they are the translation target.

**DRY — extract before duplicating.** When the same markup, logic or style appears twice:

- *Markup* → a new component in `src/components/`, not another copy of the block.
  Reference patterns: `ProjectCard.astro`, `ProjectsSection.astro`.
- *Fetch/transform logic* → a helper in `src/pages/lib/github.ts` (`ghListByTopic`, `ghRepo`,
  `ghSearch`, `ghRepoReadme`). Tests and API routes import those helpers instead of reimplementing the fetch.
- *Styles* → a new token in `public/styles/00-tokens.css`, a utility in `src/styles/global.css`, or
  `public/styles/03-components.css` for a class **two components share**.

  That last case is forced, not preferred: Astro scopes each component's `<style>` to that component,
  so a class two components need cannot live in either of them. `.btn-action` sat in `ProjectCard`
  and `ProjectsFooter` and the two copies had already drifted — one had `cursor: pointer` and
  `font-family: inherit`, the other did not. Neither difference was visible, so **the risk was the
  drift rather than a present bug**, which is worth stating rather than overclaiming. Moving it also
  drops the selector's specificity (`.btn-action[data-astro-cid-…]` → `.btn-action`), so re-check
  computed values on every consumer, not just the one you looked at.

**A duplicated style is only harmless until it is not.** Before extracting, check whether the copies
have already diverged, and report honestly which it is: a visible bug, or a latent risk.

**JSDoc on public helpers and components.** One description line plus `@param`/`@returns` on
helpers; on components, a typed `interface Props`. Examples: `src/data/levelLabels.ts`,
`src/types/github.ts`.

**Centralised fetch mocks.** Use `tests/helpers/github-mocks.ts`
(`mockGitHubSearchResponse`, `mockGitHubRepoResponse`) plus `vi.unstubAllGlobals()` in `afterEach`.
Do not repeat the GitHub `fetch` shape in every spec.

The file once also exported `mockErrorResponse`, `sequenceFetch` and a `FetchStub` type. No test
imported them, and `tests/README.md` documented them as if they were in use — so a reader would reach
for a helper that nothing exercised. They are gone. **Add a mock helper when a test needs it, not
before**, or it is documentation of an untested path.

## Quick file reference

| File | Responsibility |
|---|---|
| `src/layouts/BaseLayout.astro` | head/meta, OG tags, stylesheet `<link>`s, `<ClientRouter />`, theme anti-FOUC |
| `src/pages/lib/github.ts` | the only place that reads `GITHUB_TOKEN`; API helpers; `sortRepos()`, the single repo ranking used by `/` and `/proyectos` |
| `src/pages/api/github-list.json.ts` | repo list, 30 min TTL cache |
| `src/pages/api/v1/projects/[name].json.ts` | repo detail, its own cache |
| `src/components/Resume.astro` | home composition; **must not** live in `pages/` (see Structural rules) |
| `src/components/ProjectsSection.astro` | projects grid, `preview`, show-more toggle (owns the JS) |
| `src/components/ProjectsFooter.astro` | the toggle button and the view-all link; both labels, CSS reveals one |
| `src/components/ProjectCard.astro` | card carrying `transition:name` `p-${repo.id}-*` |
| `src/data/*.ts` | editable content, no markup changes needed |
| `i18n/locales/{es,en}.json` | UI strings; edit **both together** |
| `public/styles/03-components.css` | shared, unscoped: `.btn`, `.card`, `.btn-action` |
| `public/styles/themes/{light,dark}.css` | theme-specific values, including per-theme hovers |

## Tests

`npm test` = `vitest --run tests`. Do **not** run bare `npx vitest --run`: without the `tests`
filter it also picks up `e2e/about.spec.ts` and fails on a missing Playwright runtime.

| File | Guards |
|---|---|
| `tests/tokens.test.ts` | every `var(--x)` resolves; no token alive only on a hardcoded fallback; no duplicate declaration per rule. Strips comments first |
| `tests/comments.test.ts` | every HTML comment in a template body is on the sixteen-label allowlist; no `//` line in the markup region |
| `tests/viewtransitions.test.ts` | client scripts re-bind on `astro:page-load`; no `is:inline`, no `currentScript`, no global id in any component. The component list is **derived** from the filesystem, not written out |
| `tests/visual-language.test.ts` | no hover lifts; no `font-weight` past 700; no hover signals by background alone; prose goes through `t()`; the person's name has one source; `--accent-surface` clears 4.5:1 under white in both themes |
| `tests/contact.test.ts` | contact shape and non-empty labels; **each `href` agrees with its own `value`** (mailto for email, an https URL whose host+path the value shows); `sameAs` only on browsable profiles; **icon paths are root-absolute and exist in `public/`** |
| `tests/about.test.ts` | `ABOUT.resumeUrl` points at a real file in `public/`; `ABOUT.socials` carries the email channel; `AboutSection` reads both from `ABOUT` |
| `tests/i18n.test.ts` | both locales share top-level keys; **every `t()` key used in any `src/` file** resolves in both. Comments stripped first |
| `tests/notfound.test.ts` | the `/404` redirect target exists and its keys are in both locales; `Resume.astro` has not moved back into `pages/` |
| `tests/github-helpers.test.ts` | `ghListByTopic` / `ghRepo` / `ghSearch`: response shape, `user:` scoping, `perPage` |

Two files are **not** in this table on purpose. `sortRepos()` and `ghRepoReadme()` are exported from
`src/pages/lib/github.ts` and have no tests; `sortRepos` is the single ranking both `/` and `/proyectos`
use, so a drift shows the same repo in two positions across routes. Add them before changing either.

A note on `tests/helpers/`: keep it to what a test actually imports. It is not a place to describe
shapes a future test might want.

## Working on components one at a time

Visual work is reviewed **per component** and approved before it is committed. Never redesign
several components and present them as a batch.

1. Change **one** component. Show it in both themes — light and dark.
2. **Stop and wait for approval.** Do not commit an unapproved component, and do not start the
   next one while waiting.
3. On approval, commit that component, then move on.

How to group the commit:

- **One component per commit.** A token or layout change belongs to the work that motivated it.
- **`AGENTS.md` gets its own `docs:` commit**, never folded into a component commit.
- **The caller's prop change counts as part of the component**, when it is what makes the change
  visible — for example when a component has a single caller and needs a new prop to do anything.
  Redesigning the caller is separate work and gets its own commit.
- **A block that mixes scopes gets split**, even mid-block. `SkillViewToggle` was a code change and
  the `Readme` note was a comment; those were two commits, not one.
- Which component is next, and what is still pending, is **state**: it belongs in `Memory.md`, not
  here. This file holds rules.

### Re-review your own proposal before showing it

For each proposal, read it back as a senior reviewer looking for inconsistency, contradiction and
incongruity — and say plainly what that turned up. Not padding: the findings have to be real.

In practice that surfaced, more than once:

- **A proposal that had never been measured.** Symmetrising the toggle labels was proposed as the
  fix for a button that resized; measured, it only took the jump from 44px to 13px, because
  "menos" is wider than "más" by 14px even though both are followed by the same noun. Equalising a
  label's *shape* does not equalise its *width*.
- **A regression announced from arithmetic.** A fixed 52px name was called a regression on a phone
  because 623px of text over a 273px column "should" wrap to two lines. Measured, it wrapped to three
  either way — no regression, and the reason given was false.
- **A number asserted, then checked.** "Body prose runs past 110 characters" was written into this
  file and defended in a plan. Measured, it was 98-101, and only from 1280px up.
- **A contrast figure computed with a value that was never fetched**, which reported 2.94:1 against a
  real 6.08:1 and would have been a false bug report.

Also: **prefer a number to an adjective, and say which one you have.** "Looks broken" is not a
finding; "144px to 100px" is. And when a claim cannot be defended with a measurement, present it as an
opinion and ask, rather than dressing it as a result.

## Visual language

A deliberate identity, not a starting point. Read this before changing any colour, font or radius.
Each rule states the failure mode it prevents, so the reasoning survives even after the specific
value it was written for has changed.

- **The canvas is cool; navy and gold are the only chroma.** The light ground is a grey ramp at
  hue ~215, in three steps of light: `--bg` behind the sheet, `--main-bg` the sheet,
  `--card-background` white. A warm cream ground with a warm gold accent is the most recognisable
  generated palette there is, and it cancels a navy-and-gold pair out into a default with a logo
  dropped on it. Reintroducing warm neutrals will look like a warmer, friendlier improvement to
  anyone who finds it. It is a regression.
- **The dark theme is one hue.** The sheet is the brand navy, cards are one step up, and the
  neutral scale is navy steps. Two surfaces in different hues read as two systems fighting rather
  than as steps of one — a navy page with grey-blue cards is the example to avoid. Every surface
  must be a step of the brand navy. A navy page is a deliberate choice and stays; the default to
  avoid is near-black with one acid accent.
- **`--accent-surface` must stay dark in both themes.** Components hardcode `color: #fff` on the
  primary button, so a light gold fill would put white on cream. Revisit only if the hardcoded
  `#fff` goes away.
- **Typography is self-hosted from `public/fonts`: two families, no third-party request.**
  IBM Plex Sans (variable, 100–700) for everything, IBM Plex Mono (400/600) for code and small
  data only. Never add a `<link>` to a font CDN. `05-fonts.css` links before the other
  stylesheets — `@font-face` must be known before anything computes a line box, or the first paint
  uses the fallback and the text reflows a frame later. A bare system stack is not an acceptable
  substitute to "simplify": it means every visitor sees whatever their OS ships, and the site has
  no voice of its own.
- **The variable font's range is a hard limit.** It declares 100–700. A `font-weight: 800` is
  clamped to 700 while the CSS claims otherwise — the declaration and the rendering quietly
  disagree. That was true of the hero name and is still true of the `404` code. Use 700.
- **Radius follows size class, not taste.** `--radius-xs` for chips and tags, `--radius-sm` for
  inputs, `--radius-md` for buttons and cards, `--radius-lg` for the page sheet, `--radius-pill`
  only for genuinely lozenge-shaped things — which includes a fully rounded bar track and its fill.
  Not a square button: at 32×32 a pill rounds the corners nearly off and stops reading as a button.
  When a child sits inside a padded parent, its radius is the parent's *minus the parent's padding*,
  written as that relationship. One radius everywhere is what makes a layout read as a template.
- **Type scale is 1.25 off a 16px base.** Adding a step means adding a token, not nudging an
  existing one — flatter steps make every level look like the one above it, and the page silently
  loses its hierarchy.
- **Body prose is capped** with `--measure` / `--measure-wide`. Unconstrained, the hero's bio
  measured 98-101 characters per line from 1280px up, past the point of comfortable return — and
  only there: the same bio is 73 characters at 958px and 34 on a phone, so a cap only bites on a
  wide screen.
- **The page sheet is sized with `min(100% - gutter, --max-w)`, never a percentage.** A percentage
  makes the measure change with the viewport, so the same paragraph takes a different shape on
  every screen.
- **Let the content choose the silhouette.** An avatar crop is right for a portrait and wrong for a
  mark with hard edges. Components should expose the shape as a prop rather than forcing one, and
  should not frame a shape with a second outline that says nothing — a ring drawn in `--color-border`
  is the same token every card border uses.
- **Hover means the border turns gold, and nothing lifts.** Chips, cards, action buttons, the footer
  toggle and the theme toggle all do this, so the pointer means one thing site-wide. Never
  `translateY(-2px)`. And never signal hover with a background change alone: it is the weakest
  channel available and it *lowers* the icon's contrast while doing it (16.44 → 14.11 in light,
  8.31 → 6.08 in dark on the theme toggle). A colour change carries the state; a surface shift alone
  does not.
- **A surface's hue must not invert.** Filling something *inside* the sheet with `--bg`, the ground
  the sheet sits on, sinks the selected state instead of raising it. A soft fill inside the sheet is
  `--neutral-200`, which is also `--tag-surface` in light — one colour for that job, everywhere.
- **Two things in a row are not peers.** The projects footer was `space-between` with a disclosure
  over the grid on the left and a navigation link on the right; opposite ends read as two unrelated
  items in opposite corners, and the control that governs the grid sat as far from it as the layout
  allowed. A disclosure goes under what it discloses, left-aligned.

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
- **Agent skills are NEVER tracked.** `.agents/` and `skills-lock.json` are tools installed per
  machine, not part of the site, and they change without the code changing. Both are in
  `.gitignore`. Do not `git add -f` them and do not move them out of the ignore list to make a
  diff look tidier. Same category, also ignored: `opencode.json`, `opencode.jsonc`, `.opencode/`.
- **`bloque/` is scratch and NEVER tracked.** One plan per pending block, deleted as soon as that
  block closes, and the whole directory deleted once the last one does. The commit message is where
  a finished block's summary belongs. In `.gitignore`; do not `git add -f` it to make a diff look
  complete.
- **NEVER create commits unless asked.** Only commit when the user requests it explicitly or when the
  commit is part of a flow already agreed (e.g. "prepare the commits", "commit this"). Finishing a
  task **does not** imply committing: leave the changes in the working tree.
- If unsure whether to commit, **ask** instead of deciding on your own.
- Normal state: uncommitted changes in the working tree, unpushed commits.
- **`git checkout -- .` destroys work that was never committed.** It restores from the index, so any
  edit made since the last commit is gone — and it fails silently, so the loss is only noticed later.
  This repo's normal state is uncommitted work, which makes this the default way to lose a session.
  When a probe or experiment needs to undo one mutation, revert **the files it touched** by explicit
  path, and hash the directories you did not mean to touch before and after to prove they survived.
  `git checkout -- <path>` on a path that is *untracked* (a file a script just created) does nothing
  at all — delete those by hand.

## Memory
- `Memory.md` is your memory. Keep it small (50 lines max); summarise what is stale and delete it.
  Its language is your call — this file stays English.
- **Split of roles:** the *rules* live only here in `AGENTS.md`. `Memory.md` is state and context only
  (what was done, what is pending, what is verified). Do not duplicate rules across the two: if a rule
  changes, change it here and keep it in one place.
- If something comes up often enough, propose a new rule and add it to `AGENTS.md`.
- After each task, update both `Memory.md` and `AGENTS.md`.

# AGENTS.md

Astro 5 personal portfolio, SSR, single package. Content is data-driven from `src/data/*.ts`;
projects come live from the GitHub API.

**`docs/constitution.md` outranks this file.** It holds ten non-negotiable rules, each naming the
test, command or file that settles it. Read it before proposing anything. It is deliberately not
summarised or repeated here — a second copy of a rule is a second thing to forget to update, and the
copy that drifts is the one people read. This file is the working detail underneath: how those rules
apply here, and the traps this repo has actually hit.

**Language.** Code, comments, JSDoc and these documents are English. `Memory.md` is the agent's call.
Site content is deliberately Spanish — `i18n/locales/es.json`, `ABOUT.bio.es`, strings like
`'Ver más proyectos'` — because that is the translation target, not an inconsistency.

## Commands — verified working vs. broken

| Command | Status |
|---|---|
| `npm run build` | works (~4s) |
| `npm test` | works — 61 tests, 9 files |
| `npx playwright test` | works (1 test, ~7s, spawns its own dev server on :4321) |
| `npm run lint` | **broken** — `eslint` is not a dependency and there is no config |
| `npm run format` | **broken** — `prettier` is not a dependency and there is no config |
| `npx astro check` | **unavailable** — prompts to install `@astrojs/check` + `typescript` |

`lint` and `format` are aspirational. Do not report their failure as a regression you caused, and do
not add a formatting pass "to match" — there is no formatter config to match. Constitution 7 says a
tool is not added to make a check pass; that applies here too. If they are ever fixed, add them to
`.husky/pre-commit` in the same change.

### Running tests

```bash
npm test                          # = vitest --run tests   (the positional `tests` arg scopes it)
npx vitest --run tests/foo.test.ts # one file
npx vitest --run -t "name"         # one test by name
```

Do **not** run bare `npx vitest --run`. Without the `tests` filter it also picks up `e2e/about.spec.ts`
and fails on a missing Playwright runtime. This is the single most likely way to get a confusing red
result.

## Verifying

A green build and green tests **do not** catch render bugs. Start a dev server and hit the pages:

```powershell
$job = Start-Job { npx astro dev --port 439X }; Start-Sleep 13
Invoke-WebRequest "http://localhost:439X/route" -UseBasicParsing | Select-Object StatusCode
Stop-Job $job; Remove-Job $job -Force
```

That is how two real bugs surfaced which the build did not flag: broken JSON-LD, and a duplicated
`/Resume` route.

**`output: "server"` means there is no build output to inspect.** `dist/` holds no `.html` at all —
pages render per request. Checking the shipped HTML means fetching a running server, route by route.
A 404 route throws in PowerShell's `Invoke-WebRequest` under `-ErrorAction Stop`, which looks like a
broken route in a scan; check it in the browser instead.

### Environment traps

- **The repo lives under OneDrive and the watcher lies.** Vite misses changes because the sync
  swallows events. Twice the log showed no `[watch]` line for a component just edited, while the
  browser served a stylesheet without the fix. **After editing a `<style>`, confirm the rule is in
  the CSSOM (`document.styleSheets`) before trusting any measurement.** If it is not, restart the
  server. Otherwise you debug code that is already right, twice in one session.
- **`resize_page` does not move `innerWidth`.** Use `emulate({ viewport: "WxH" })`.
- **Measure after animations settle.** Reading `width` or a `transform` mid-transition gave
  3.125px and an identity matrix when the settled values were 100% and a 180° rotation.
- **The working tree is CRLF** (`core.autocrlf=true`). An anchor written with `\n` never matches —
  normalise before comparing, or a probe silently finds nothing.
- **`git checkout -- .` destroys uncommitted work, silently.** See the git section.

## Tests

| File | Guards |
|---|---|
| `tests/tokens.test.ts` | every `var(--x)` resolves; no token alive only on a hardcoded fallback; no duplicate declaration per rule. Strips comments before reading |
| `tests/visual-language.test.ts` | no hover lifts; no `font-weight` past 700; no hover signals by background alone; prose goes through `t()`; the name has one source; `--accent-surface` clears 4.5:1 under white in both themes |
| `tests/comments.test.ts` | every HTML comment in a template body is on the sixteen-label allowlist; no `//` line in the markup region |
| `tests/viewtransitions.test.ts` | client scripts re-bind on `astro:page-load`; no `is:inline`, no `currentScript`, no global id in any component. The component list is **derived** from the filesystem |
| `tests/contact.test.ts` | shape and non-empty labels; **each `href` agrees with its own `value`**; `sameAs` only on browsable profiles; **icon paths are root-absolute and exist in `public/`** |
| `tests/i18n.test.ts` | both locales share top-level keys; **every `t()` key used in any `src/` file** resolves in both |
| `tests/about.test.ts` | `resumeUrl` points at a real file; `ABOUT.socials` carries the email channel; `AboutSection` reads both from `ABOUT` |
| `tests/notfound.test.ts` | the `/404` redirect target exists and its keys resolve; `Resume.astro` has not moved back into `pages/` |
| `tests/github-helpers.test.ts` | `ghListByTopic` / `ghRepo` / `ghSearch`: response shape, `user:` scoping, `perPage` |

**`sortRepos()` and `ghRepoReadme()` have no tests.** `sortRepos` is the single ranking both `/` and
`/proyectos` use, so a drift shows the same repo in two positions. Add them before changing either.

Keep `tests/helpers/` to what a test actually imports. It once exported `mockErrorResponse`,
`sequenceFetch` and a `FetchStub` type that nothing used, and a README advertised all three as if
they were in use — so a reader reached for a helper nothing exercised. They are gone. **Add a mock
helper when a test needs it, not before.**

### A guard that cannot fail is worse than no guard

Six guards here were green while the exact thing they exist to prevent was happening. All six had
the same shape: the guard did not look where the violation actually was.

- **A length threshold cannot tell a label from a note.** `comments.test.ts` rejected comments over
  90 characters; four real notes of 47-72 characters sailed through and the threshold looked like it
  was working.
- **A per-line check misses a multi-line note.** The same test measured a comment's first line. Notes
  were wrapped, so line one was short and lines two to four were never read — `SkillBar` shipped a
  271-character note, ten times per page.
- **A scanner can silently drop half a file.** The same test set `skipUntil` on any `<script>` and
  cleared it on `</script>`. `AboutSection` has a self-closing
  `<script type="application/ld+json" />`, so everything after it left the analysis for good.
- **A brace inside a CSS comment swallows the rule after it.** `tokens.test.ts` scanned raw CSS with
  `/\{([^{}]*)\}/g`. A note in `00-tokens.css` quotes ``a { color: … }``, and that `{` paired with
  the `}` closing `:root`, so the scan read **193 characters of that file out of 6389** and never saw a
  token. The other three tests in the same file already stripped comments, which is why only this one
  was blind.
- **A hardcoded list of files goes stale silently.** `viewtransitions.test.ts` iterated five component
  names. A sixth component with a `DOMContentLoaded` binding passed all seventeen tests.
- **An assertion can be satisfied by something other than the thing.** One test asserted
  `toContain('AvatarCircle')`, which the import path `'./AvatarCircle.astro'` satisfies alone —
  replacing the component entirely, usage and import, stayed green. Ask what else in the file
  matches your substring.

So: **prove a guard still bites before reporting green.** Inject the violation, watch it fail, then
revert. A green suite that has never failed is untested. When a guard is right, the fix is to widen
what it reads, never to relax what it accepts — all six times it was the former. Stripping comments
is the recurring instance: a note explaining why a token was removed is not a use of it, and a
frontmatter note quoting a removed `lang === 'es' ? …` is not a locale ternary.

**Undo a probe by explicit path, never `git checkout -- .`** — it restores from the index and throws
away uncommitted work without saying so. Hash the directories you did not mean to touch, before and
after, and prove they survived. This cost a rewritten `tests/` and made fourteen healthy guards look
dead in one sitting.

## Environment variables

Read via `import.meta.env` only — never `process.env`. In `.env`:

- `GITHUB_USERNAME` — defaults to `XDextX` in code
- `GITHUB_TOKEN` — optional, avoids rate limits. Server-side only; never let it reach a client bundle
- `GITHUB_TOPIC` — currently `""`. When empty, `ghListByTopic` falls back to `user:XDextX` (all public
  repos) and the topic filter on `/proyectos` becomes a no-op
- `DEFAULT_LOCALE` — **dead config.** Nothing reads it. The default is the hardcoded
  `const DEFAULT_LOCALE: Locale = 'es'` in `src/utils/locale.ts`

`.env` is gitignored and holds a live GitHub PAT in plaintext. Never commit it, never echo it.

Note `GITHUB_TOPIC` is read in three places (`ProjectsSection.astro`, `proyectos/index.astro`,
`api/github-list.json.ts`). That is deliberate and public — it is not a secret, and per-page reading
lets each route decide its own filter. `GITHUB_TOKEN` is the one with a single reader.

## Structure

- **Never leave a page component in `src/pages/`.** Astro registers it as a route even if it is only
  used as a component. `Resume.astro` lived there and served `/Resume`, duplicating `/` with
  conflicting canonical and hreflang tags. The home section is `src/components/Resume.astro`.
- **One source per datum.** `ABOUT.socials` is derived from `CONTACTS` by id. The literal name and
  the real address live in `src/data/about.ts` and `src/data/contacts.ts` and nowhere else; a public
  profile may be linked, never spelled out again (constitution 9).
- **Public URLs need a leading slash.** `resumeUrl` is `/cv/...`, not `cv/...` — the relative form
  resolved incorrectly from `/proyectos`.
- **JSON-LD with `set:html`, never `is:inline` plus interpolation.** `is:inline` disables expression
  evaluation, so `{JSON.stringify(x)}` emitted as literal text. Fixed in `AboutSection.astro` and
  `BaseLayout.astro`; do not reintroduce it.
- **Never mix microdata (`itemscope`) and JSON-LD** for the same entity on one page — search engines
  read that as two conflicting entities. `AboutSection` owns the `Person` JSON-LD.
- Prefer an explicit `sameAs: true` on a contact over re-deriving "is this publishable?" from another
  field. One flag, read by whoever needs it.

## Code conventions

**DRY — extract before duplicating.** When the same markup, logic or style appears twice:

- *Markup* → a new component in `src/components/`. Reference: `ProjectCard.astro`,
  `ProjectsSection.astro`.
- *Fetch/transform logic* → `src/pages/lib/github.ts` (`ghListByTopic`, `ghRepo`, `ghSearch`,
  `ghRepoReadme`, `sortRepos`). Tests and API routes import those rather than reimplementing the fetch.
- *Styles* → a token in `public/styles/00-tokens.css`, a utility in `src/styles/global.css`, or
  `public/styles/03-components.css` for a class **two components share**.

  That last case is forced: Astro scopes each component's `<style>`, so a class two components need
  cannot live in either. `.btn-action` sat in `ProjectCard` and `ProjectsFooter` and the copies had
  already drifted — one had `cursor: pointer` and `font-family: inherit`, the other did not. Neither
  difference was visible, so **the risk was the drift rather than a present bug**, which is worth
  stating rather than overclaiming. Moving it also drops specificity
  (`.btn-action[data-astro-cid-…]` → `.btn-action`), so re-check computed values on every consumer.

**A duplicated style is only harmless until it is not.** Before extracting, check whether the copies
have diverged, and report honestly which it is: a visible bug, or a latent risk.

**JSDoc on public helpers and components.** One description line plus `@param`/`@returns`; on
components a typed `interface Props`. Examples: `src/data/levelLabels.ts`, `src/types/github.ts`.

### Interactive markup needs a stable hook, not a positional one

- **Never index into `childNodes` to swap a label.** `toggle.childNodes[0].textContent = …` breaks the
  moment someone adds whitespace. Better: do not swap text at all — the show-more button carries
  both labels and CSS reveals one, so the width cannot change with state. When you must rewrite, give
  the label its own element (`data-projects-toggle-label`) and target that.
- **A label swap must not resize the control, nor depend on a hardcoded width.** Two translated
  strings differ in length in every language, so a fixed `min-width` in `px` or `ch` is wrong
  somewhere. Stack both states in one `grid-template-areas` cell with `visibility: hidden` on the
  inactive one: the cell is `max-content` across both. `display: none` would drop it from
  `max-content` — that is why it is `visibility`.
- **Do not emit an attribute nobody reads.** `data-preview` was on every projects grid and consumed by
  nothing. Grep before adding one; delete the leftovers when the reader goes.
- **Do not pass a prop a component does not declare.** `Resume` sent `locale` to a `ContactSection`
  with no `Props`, dropped without a word.
- Prefer the implicit `<label><select/></label>` over a `for`/`id` pair: no id, so no collision.
- Render a non-interactive element when there is nothing to interact with. `SkillChip` emitted
  `<a href="#">` for techs with no link — focusable, and it jumps the page to the top.
- Translations go through `t()`. `aria-label='Vista'` and `lang === 'es' ? '…' : '…'` survive a locale
  switch and ship Spanish to English readers.
- `title` is a weak accessible name. Pair it with `aria-label`.
- **Two controls side by side must state the constraint, not assume it.** The language select and the
  theme button were 29.00px and 29.59px tall because each derived its height from different padding.
  Both carry an explicit `block-size` with `box-sizing: border-box`. Written as a literal in each file
  rather than a shared token: two controls are not a design system, and `--control-h` would imply one.
  **When a third control has to match, that is when a token starts meaning something.**

### Client scripts under `<ClientRouter />`

`<ClientRouter />` (view transitions) is **enabled on purpose and stays**.

- Every client script binds via `document.addEventListener('astro:page-load', ...)`, never
  `DOMContentLoaded` or a bare module-level `addEventListener`. The router replaces the DOM on each
  navigation, so a listener bound once dies on the first transition.
- **`<script is:inline>` is forbidden for client logic** — it only runs with the server HTML. And
  `is:inline` + `{JSON.stringify(x)}` does not evaluate the expression either; for JSON-LD use
  `set:html={JSON.stringify(x)}`.
- **`document.currentScript` is forbidden** for capturing containers. After a swap it is stale.
- **No global ids for JS hooks.** Use `data-*`, resolved relative to the container (`root.querySelector`),
  so several instances work independently.
- `transition:name` must match between source and destination (`p-${repo.id}-title` in
  `ProjectCard.astro` and `proyectos/[name].astro`) — that is what makes the card travel.

`tests/viewtransitions.test.ts` enforces all of this, over a component list **derived from the
filesystem**. If you must skip a rule, do it explicitly and update that test.

### Comments do not belong in the template

**Anything between the frontmatter fences and the markup is not a comment.** Astro emits it verbatim
into the response, so a `//` note in the template ships to every visitor as a stray HTML comment and
shows up in view-source and DevTools. Put implementation notes in the **frontmatter**, where they never
leave the build.

- `{/* … */}` is stripped and would survive, but prefer the frontmatter: nobody converts a frontmatter
  note into an `<!-- -->` by accident, and someone "simplifying" a brace comment would start shipping it.
- **Short HTML labels** (`<!-- Header -->`, `<!-- BARS -->`) are the existing style and are fine.
  `tests/comments.test.ts` enforces this as an **allowlist of sixteen known labels**, not a length
  limit, because a length limit cannot tell a label from a note. A new label must be added
  deliberately; that is the point.
- Inside `<script>` and `<style>`, `//` is a real comment stripped at build. Only markup leaks.
- A note in a stylesheet needs no such treatment, but it must not name a token as if it used one.

### Public asset paths

Root-absolute, always: `"/icons/gmail.svg"`, `"/tech/react.svg"`, `"/cv/file.pdf"`. A relative
`src="icons/x.svg"` resolves against the *current route*, so it works on `/` and `/proyectos` but 404s
on `/proyectos/<name>`. This is the `resumeUrl` bug again; `tests/contact.test.ts` asserts the leading
slash and that the file exists, for every contact.

## Design tokens are an invariant, not a convention

A custom property that is read but never defined **fails silently**. `var(--missing)` makes the whole
declaration "invalid at computed-value time", so the browser drops it and falls back to the initial
value with nothing in the console. `AvatarCircle` shipped `border: var(--ring) solid var(--avatar-ring)`
for weeks against a token that existed nowhere, and the avatar rendered `0px none`.

- **Never write `var(--x)` for a token not defined in `00-tokens.css` or `themes/*.css`.** If a
  fallback is genuinely needed, say why in a comment.
- **A hardcoded colour as the only fallback is a bug**, not a safety net: it never follows the theme.
  That is how `var(--border-color, #3a4056)` ended up dark-grey in both themes.
- **A token defined in one theme and read in both is worse than a missing one.** Nothing errors and the
  fallback is another theme's palette. `--bg-color` lived in `light.css` only, so in dark the skills
  toggle painted `#E4E8EE` — a near-white grey from the palette this site moved off. **Define a token
  in both theme files or neither.**
- **A token named "behind" or "surface" is a claim about where it may be used.** `--bg` is the ground
  the sheet sits on; filling something *inside* the sheet with it inverts depth. The skills toggle did
  exactly that. Respect the meaning, not just the value.
- **Do not define one value under two names.** `--bg-color` and `--bg` both read `#E4E8EE` in light;
  the duplicate is what let one theme drift.
- Alias when a component needs a theme-aware value: `--avatar-ring: var(--color-border)` resolves in
  both themes because both redefine `--color-border`. That avoids a `--x` / `--x-dark` pair and any
  per-theme override inside a component.
- Prefer `!important` on a custom property in a media query when the base value is inline — the only
  way an author rule beats an inline declaration.
- **Run `tests/tokens.test.ts` before claiming a styling change is done.** It fails on a typo
  (`--color-bordr`) and on an invented token, so it is not vacuous.

## CSS that silently does nothing

- **`attr()` only works for `content` properties.** `attr(data-size px)` in a size declaration is
  invalid everywhere. Emit a custom property and read it from the media query instead.
- **Check `grid-template-columns` arithmetic against the real container width.** `SkillBar` spent
  ~260px on fixed columns inside a `repeat(2, 1fr)` column, leaving the progress track 31px at 929px
  of viewport and **0px** below ~546px of content. A `1fr` track silently collapses to zero when the
  fixed columns exceed the row. Give the flexible track `minmax(<floor>, 1fr)` and use
  `repeat(auto-fit, minmax(min(<needed>, 100%), 1fr))`.
- **A hardcoded value in a derived rule goes stale silently.** `calc(var(--radius-md) - 2px)` looked
  like "the radius less its inset" but the inset was `0.2rem` — wrong by construction. Write the
  relationship, not the number.
- **`ch` is not a character.** `1ch` is the width of `0`: 9.61px in IBM Plex Sans at 16px, so `60ch`
  is 577px and about 72 characters. Never reason about `ch` as glyphs.
- **Fixed-size decorative markup is a duplicate waiting to happen.** When you catch one, say so.

## Visual language

A deliberate identity, not a starting point. Read this before changing any colour, font or radius.
Each rule states the failure mode it prevents, so the reasoning survives the specific value.

- **The canvas is cool; navy and gold are the only chroma.** The light ground is a grey ramp at
  hue ~215, in three steps: `--bg` behind the sheet, `--main-bg` the sheet, `--card-background` white.
  A warm cream ground with a warm gold accent is the most recognisable generated palette there is, and
  it cancels a navy-and-gold pair out into a default with a logo dropped on it. Reintroducing warm
  neutrals will read as a warmer, friendlier improvement to anyone who finds it. It is a regression.
- **The dark theme is one hue.** The sheet is brand navy, cards one step up, the neutral scale navy
  steps. Two surfaces in different hues read as two systems fighting rather than steps of one — a
  navy page with grey-blue cards is the example to avoid. A navy page is deliberate and stays; the
  default to avoid is near-black with one acid accent.
- **`--accent-surface` stays dark in both themes.** Components hardcode `color: #fff` on the primary
  button, so a light gold fill puts white on cream (1.66:1 against 4.5:1 for text). Revisit only if
  the hardcoded `#fff` goes away.
- **Typography is self-hosted from `public/fonts`: two families, IBM Plex Sans (variable 100–700) for
  everything and IBM Plex Mono (400/600) for code and small data only.** Never add a font CDN link.
  `05-fonts.css` links before the other stylesheets — `@font-face` must be known before anything
  computes a line box, or the first paint uses the fallback and the text reflows a frame later. A bare
  system stack is not an acceptable "simplification": it means every visitor sees whatever their OS
  ships, and the site has no voice of its own.
- **The variable font's range is a hard limit.** A `font-weight: 800` is clamped to 700 while the CSS
  claims otherwise — the declaration and the rendering quietly disagree. That was true of the hero
  name and the `404` code. Use 700.
- **Radius follows size class, not taste.** `--radius-xs` chips and tags, `--radius-sm` inputs,
  `--radius-md` buttons and cards, `--radius-lg` the page sheet, `--radius-pill` only for genuinely
  lozenge-shaped things — the bar track and its fill. Not a square button: at 32×32 a pill rounds the
  corners nearly off and stops reading as a button. A child inside a padded parent takes the parent's
  radius *minus the parent's padding*, written as that relationship. One radius everywhere is what
  makes a layout read as a template.
- **Type scale is 1.25 off a 16px base.** Adding a step means adding a token, not nudging an existing
  one — flatter steps make every level look like the one above it and the page loses its hierarchy.
- **Body prose is capped** with `--measure` / `--measure-wide`. Unconstrained, the hero's bio measured
  98-101 characters per line from 1280px up, past a comfortable return — and only there: the same bio
  is 73 characters at 958px and 34 on a phone.
- **The page sheet is sized `min(100% - gutter, --max-w)`, never a percentage.** A percentage makes the
  measure change with the viewport, so one paragraph takes a different shape on every screen.
- **Let the content choose the silhouette.** An avatar crop suits a portrait and not a mark with hard
  edges. Expose the shape as a prop, and do not frame a shape with a second outline that says nothing
  — a ring in `--color-border` is the same token every card border uses.
- **Hover means the border turns gold, and nothing lifts.** Chips, cards, action buttons, the footer
  toggle and the theme toggle all do this, so the pointer means one thing site-wide. Never
  `translateY(-2px)`. And never signal hover with a background change alone: it is the weakest channel
  available and it *lowers* the icon's contrast while doing it (16.44 → 14.11 in light, 8.31 → 6.08 in
  dark on the theme toggle).
- **A surface's hue must not invert.** Filling something *inside* the sheet with `--bg` sinks the
  selected state instead of raising it. A soft fill inside the sheet is `--neutral-200`, which is also
  `--tag-surface` in light — one colour for that job, everywhere.
- **Two things in a row are not peers.** The projects footer was `space-between` with a disclosure over
  the grid on the left and a navigation link on the right; opposite ends read as two unrelated items
  in opposite corners, and the control governing the grid sat as far from it as the layout allowed. A
  disclosure goes under what it discloses, left-aligned.

## Never document sensitive data

Do not write into this file, `Memory.md`, `README.md`, `docs/`, commit messages or any other repo
document: paths containing the real user name (`C:\Users\<your-user>\...`), emails, full names,
physical addresses, tokens, API keys or passwords. This is constitution 9, with the mechanics:

- Use placeholders: `C:\Users\<user>\...`, `<email>`, `<token>`.
- Prefer variables (`$env:USERPROFILE`) over literal paths in examples.
- It is fine to **flag the existence** of a secret and the risk (`there is a PAT in .env, do not
  commit it`), but never its value.
- Describe a bug's shape (`--executablePath=C:\...\Programs\Opera`) without filling in the rest from
  your machine.
- `LICENSE.md` holds third-party copyright addresses. Those are not the concern — do not let a grep for
  "emails in documents" mislead you into thinking the rule is broken.

`README.md` used to spell the name four times and carry the real `mailto:`. It no longer does, and it
also documented an `og:image` path the layout never used.

## Working on components one at a time

Visual work is reviewed **per component** and approved before it is committed. Never redesign several
components and present them as a batch.

1. Change **one** component. Show it in both themes — light and dark.
2. **Stop and wait for approval.** Do not commit an unapproved component, and do not start the next
   while waiting.
3. On approval, commit that component, then move on.

How to group the commit:

- **One component per commit.** A token or layout change belongs to the work that motivated it.
- **This file and `docs/constitution.md` get their own `docs:` commit**, never folded into a
  component commit.
- **The caller's prop change counts as part of the component** when it is what makes the change
  visible — a component with a single caller needs a new prop to do anything. Redesigning the caller
  is separate work.
- **A block that mixes scopes gets split**, even mid-block.
- Which component is next and what is pending is **state**: `Memory.md`, not here.

### Re-review your own proposal before showing it

Read each proposal back as a senior reviewer looking for inconsistency, contradiction and incongruity,
and say plainly what that turned up. Not padding — the findings have to be real. This surfaced,
repeatedly:

- **A proposal that had never been measured.** Symmetrising the toggle labels was proposed as the fix
  for a button that resized; measured, it only took the jump from 44px to 13px, because "menos" is
  wider than "más" by 14px even though both are followed by the same noun. Equalising a label's
  *shape* does not equalise its *width*.
- **A regression announced from arithmetic.** A fixed 52px name was called a regression on a phone
  because 623px of text over a 273px column "should" wrap to two lines. Measured, it wrapped to three
  either way — no regression, and the reason given was false.
- **A number asserted, then checked.** "Body prose runs past 110 characters" was written into this file
  and defended in a plan. Measured, it was 98-101, and only from 1280px up.
- **A contrast figure computed from a value never fetched**, reporting 2.94:1 against a real 6.08:1 —
  which would have been a false bug report.
- **A claim that is false on arrival.** A draft constitution rule read "no third-party request at
  runtime" while `ABOUT.avatar` is a remote GitHub PNG. Checking each claim against the repo before
  writing it is what caught that, and three others.

**Prefer a number to an adjective, and say which one you have.** "Looks broken" is not a finding;
"144px to 100px" is. When a claim cannot be defended with a measurement, present it as an opinion and
ask, rather than dressing it as a result.

## MCP: chrome-devtools

`opencode.json` runs `npx chrome-devtools-mcp@latest` with no flags: the MCP finds a Chromium on its own.

- **Do not nest `mcpServers`** inside `mcp` — that is the VS Code / Claude Desktop format. `mcp` is a
  direct map of servers, each requiring `type` and `command` as an **array**.
- **Do not hardcode browser paths.** OpenCode does not expand `{env:VAR}` inside `mcp.*.command`, and an
  absolute path breaks on any other machine. Install Chrome instead of fighting the path.
- On Windows a path containing spaces gets truncated through `cmd.exe`, which is why paths are not
  passed as arguments here.
- Page ids are 1-based in `list_pages`.
- Code Mode's runtime chokes on long template literals in `evaluate_script`. Store a helper on `window`
  in a short call, then read it back.
- **Wait for a real gap between tool calls before reading a settled value.** A `wait_for` on text
  matches text in the DOM even when it is `visibility: hidden`.

## Git

`.husky/pre-commit` runs `npm test` and **cancels the commit** on failure, enabled by
`"prepare": "husky"` on every `npm install`.

- A rejected commit is not a git bug: the suite failed. Fix the test first. Escape hatch only when
  intentional: `git commit --no-verify`.
- The hook does **not** call `lint` or `format` because both are broken.
- **NEVER `git push`.** Not even if the task asks for it or the tests pass. The user asks explicitly.
  Do not offer to push on your own initiative.
- **NEVER create commits unless asked.** Finishing a task does not imply committing.
- If unsure whether to commit, **ask**.
- **Agent skills are NEVER tracked.** `.agents/`, `skills-lock.json`, `opencode.json`,
  `opencode.jsonc` and `.opencode/` are per-machine tooling that changes without the code changing. All
  are gitignored; do not `git add -f` them to tidy a diff.
- **`bloque/` is scratch and NEVER tracked.** One plan per pending block, deleted when that block
  closes, and the whole directory once the last one does. The commit message is where a finished
  block's summary belongs.
- Normal state: uncommitted changes in the working tree, unpushed commits.
- **`git checkout -- .` destroys uncommitted work silently** — it restores from the index. This repo's
  normal state is uncommitted work, which makes it the default way to lose a session. Revert explicit
  paths only, and hash what you did not mean to touch before and after. `git checkout -- <untracked>`
  does nothing at all: delete those by hand.

## Quick file reference

| File | Responsibility |
|---|---|
| `docs/constitution.md` | the ten non-negotiable rules; outranks this file |
| `src/layouts/BaseLayout.astro` | head/meta, OG tags, stylesheet `<link>`s, `<ClientRouter />`, theme anti-FOUC |
| `src/pages/lib/github.ts` | the only reader of `GITHUB_TOKEN`; API helpers; `sortRepos()`, the single ranking `/` and `/proyectos` use |
| `src/pages/api/github-list.json.ts` | repo list, 30 min TTL cache |
| `src/pages/api/v1/projects/[name].json.ts` | repo detail, its own cache |
| `src/components/Resume.astro` | home composition; **must not** live in `pages/` |
| `src/components/ProjectsSection.astro` | projects grid, `preview`, show-more toggle (owns the JS) |
| `src/components/ProjectsFooter.astro` | the toggle button and the view-all link; both labels, CSS reveals one |
| `src/components/ProjectCard.astro` | card carrying `transition:name` `p-${repo.id}-*` |
| `src/data/*.ts` | editable content and the literal identity; no markup change needed |
| `i18n/locales/{es,en}.json` | UI strings; edit **both together** |
| `public/styles/03-components.css` | shared, unscoped: `.btn`, `.card`, `.btn-action` |
| `public/styles/themes/{light,dark}.css` | theme-specific values, including per-theme hovers |

## Memory

- `Memory.md` is your memory. Keep it small (50 lines max); summarise what is stale and delete it. Its
  language is your call — this file stays English.
- **Split of roles:** the *non-negotiable* rules live in `docs/constitution.md`; the *working* rules
  live only here. `Memory.md` is state and context only — what was done, what is pending, what is
  verified. Do not duplicate a rule across the three: change it in the one place it belongs.
- If something comes up often enough, propose a new rule — here, or in the constitution if it is
  genuinely non-negotiable.
- After each task, update `Memory.md`. Update this file only when a rule actually changed.

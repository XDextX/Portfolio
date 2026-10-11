# AGENTS.md

Working rules, and nothing else. **A line that describes what the repo _is_ — an inventory, a lookup
table, a how-to, a story — does not belong here.** A rule carries the failure it prevents whenever
one is what makes it obeyable.

**`docs/constitution.md` outranks this file.** It holds the non-negotiable rules and is never
restated here. `docs/incidents.md` holds the history behind them — read it when a rule looks
arbitrary, not to learn whether it applies.

**Language.** Code, comments, JSDoc and every repo document are English. Visitor-facing text is
Spanish and goes through `t()`. `Memory.md` is the agent's call.

## Workflow

### Before writing code

- **A feature or a refactor starts with a spec**, in `specs/NNN-*.md`. Read the constitution and the
  active spec first — a spec nobody read is how the second version of the same idea arrives.
- A typo, a token rename, a comment or a formatting fix does not need a spec. When it is not clear
  which one a change is, **ask**: an unneeded spec wastes a cycle, a missing one costs two.
- **The spec template and its rules live in the `sdd` skill**, `.agents/skills/sdd/SKILL.md` — the
  only copy. It is gitignored, so it lives per machine: change it there, never here.
- **Every RF carries the check that settles it.** A requirement with no check is prose that reads
  like coverage, which is worse than an honest omission.
- **A spec never overrides the constitution or this file.** If a change appears to contradict either,
  that contradiction *is* the finding: resolve it in those two files first, then in the code.
- **Reference the spec in the commits it produces.** A commit that cannot be traced to a spec is
  where drift starts, and it is invisible until someone asks why the code looks like that.

### Verifying

- **A green build and green tests do not catch render bugs** — fetch every route from a running dev
  server before calling a change done. `output: "server"` renders per request, so `dist/` holds no
  HTML and there is nothing on disk to inspect.
- A 404 throws under `Invoke-WebRequest -ErrorAction Stop` and reads as a broken route in a scan.
  **Check it in the browser.**
- **After editing a `<style>`, confirm the rule is in `document.styleSheets`** before trusting any
  measurement. A stale sheet makes you debug code that is already right.
- **`resize_page` does not move `innerWidth`** — use `emulate({ viewport: "WxH" })`.
- **Measure after animations settle.** A `width` or a `transform` read mid-transition returns a
  value that was never rendered.
- **The working tree is CRLF.** Normalise before matching an anchor, or the probe finds nothing.

### Commands

- **`npm test` is the whole test policy.** Never run bare `npx vitest --run`: without the `tests`
  argument it also picks up the Playwright spec and fails on a missing runtime.
- **Do not run `lint` or `format`, and do not add them.** Neither eslint nor prettier is a
  dependency, and adding a tool to make a check pass is constitution 7. If they are ever wired up,
  add them to `.husky/pre-commit` in the same change.
- **Do not run `npx astro check`** — it prompts to install `@astrojs/check` and `typescript`, which
  is a dependency bought for a check.

### Visual work, one component at a time

1. Change **one** component. Show it in both themes — light and dark.
2. **Stop and wait for approval.** Do not commit an unapproved component, do not start the next.
3. On approval, commit that component, then move on.

- One component per commit. A token or layout change belongs to the work that motivated it.
- `AGENTS.md` and `docs/constitution.md` get their own `docs:` commit, never folded into a
  component commit.
- A caller's prop change counts as part of the component when it is what makes the change visible.
  Redesigning the caller is separate work.
- A block that mixes scopes gets split, even mid-block.
- Which component is next and what is pending is state: `Memory.md`, not here.

### Before showing a proposal

- **Re-read each proposal as a senior reviewer** looking for inconsistency and contradiction, and
  say plainly what that turned up. Padding is not a finding.
- **Prefer a number to an adjective, and say which one you have.** "Looks broken" is not a finding;
  "144px to 100px" is. A claim that cannot be defended with a measurement is an opinion: present it
  as one and ask.

## Rules

### Structure

- **Never leave a page component in `src/pages/`** — Astro registers it as a route even when it is
  only a component, which duplicated `/` with conflicting canonical and hreflang tags.
  *Settled by `tests/notfound.test.ts`.*
- **One source per datum.** A public profile may be linked, never spelled out again
  (constitution 9). Prefer an explicit `sameAs: true` over re-deriving "is this publishable?" from
  another field: one flag, read by whoever needs it. *Settled by `tests/visual-language.test.ts`*
  (the name) and `tests/about.test.ts` (socials iterate `ABOUT`, not a hardcoded list).
- **JSON-LD with `set:html`, never `is:inline` plus interpolation** — `is:inline` disables
  expression evaluation, so the JSON ships as literal text. *Settled by `tests/markup.test.ts`.*
- **Never mix microdata (`itemscope`) and JSON-LD** for the same entity on one page: search engines
  read that as two conflicting entities. *Settled by `tests/markup.test.ts`.*

### Code

- **TypeScript by default.** A file that is not `.ts` carries its reason: no compiler, no runner, no
  dependency that would justify one. **`.ts` buys editor support and a file that matches its
  neighbours, not verification** — nothing here type-checks, so never imply the extension does.
- **DRY — extract before duplicating.** Markup → a component in `src/components/`; fetch or
  transform logic → `src/pages/lib/github.ts`, imported by the tests and the routes rather than
  reimplemented (*its helpers are covered by `tests/github-helpers.test.ts`*); a style → a token, a
  utility in `src/styles/global.css`, or `public/styles/03-components.css` for a class **two
  components share**, because Astro scopes each component's `<style>`. Moving it there also drops
  specificity, so re-check the computed value on every consumer.
- **Before extracting a duplicated style, say which it is: a visible bug, or a latent risk.** A
  difference that renders the same today is still a difference that will not.
- **JSDoc on public helpers and components**: one description line plus `@param`/`@returns`, and a
  typed `interface Props` on components.

### Metadata

- **Every route passes its own `title` and `description` to `BaseLayout`.** Inheriting the layout's
  default is exactly what a well-intended change to that default would cause, with nothing noticing.
- **The description is generated through `t()` and names only technologies `src/data/tech.ts`
  lists** — the skills the page actually shows. **Interpolate the list, never retype it in the
  sentence**: a retyped copy drifts from `seo.home.techs` while every assertion stays green.
- **At most 160 characters, cut at a whole word.** Word integrity wins over the cap, so the two are
  not simultaneously satisfiable and a first word alone over the cap ships whole. The length is a
  consequence of the data, not a constant: crossing 160 has to go red here and not ship a meta tag
  that quietly lost its last clause.
- **The title never repeats the word the `- Portfolio` suffix already carries.**
- **No `{{` left unresolved in a title or a description.** `t()` prints a placeholder it has no
  value for and leaves it in the string, with nothing in the console.
- **The project entity carries the description the route resolves**, never a second copy of it: the
  repository's own text verbatim, or the translated fallback from the locale file when the repo
  carries none.
- **Type the project entity `SoftwareSourceCode`, `codeRepository` the repository and `url` this
  page.** Declare neither `applicationCategory` nor `operatingSystem`, and omit
  `programmingLanguage` **entirely** when the repository has none — a key present carrying
  `undefined` passes an equality check and still ships the field.
- *All settled by `tests/seo.test.ts`.*

### Interactive markup

- **Never index into `childNodes` to swap a label** — it breaks on the first added space. Better: do
  not swap text at all, the show-more button carries both labels and CSS reveals one.
  *Settled by `tests/markup.test.ts`.*
- **When you must rewrite a label, give it its own element and target that by class.** Do not invent
  a `data-*` hook for it; nothing ends up reading the hook.
- **A label swap must not resize the control, nor depend on a hardcoded width** — two translated
  strings differ in length in every language, so a fixed `min-width` in `px` or `ch` is wrong
  somewhere. Stack both states in one `grid-template-areas` cell with `visibility: hidden` on the
  inactive one, so the cell is `max-content` across both; `display: none` would drop it from
  `max-content`.
- **Do not emit an attribute nobody reads** — grep before adding one, delete it when the reader goes.
- **Do not pass a prop a component does not declare.**
- Prefer the implicit `<label><select/></label>` over a `for`/`id` pair: no id, so no collision.
- **Render a non-interactive element when there is nothing to interact with** — `<a href="#">` is
  focusable and it jumps the page to the top.
- **Every piece of visitor-facing text goes through `t()`.** `aria-label='Vista'` and a
  `lang === 'es' ? … : …` survive a locale switch and ship Spanish to English readers.
  *Settled by `tests/visual-language.test.ts`;* a key that resolves in neither locale is
  `tests/i18n.test.ts`.
- `title` is a weak accessible name. Pair it with `aria-label`.
- **Two controls side by side must state the constraint, not assume it** — both carry an explicit
  `block-size` with `box-sizing: border-box`, written as a literal in each file. Two controls are not
  a design system; `--control-h` would imply one. A third control that has to match is the moment a
  token starts meaning something.

### Client scripts under `<ClientRouter />`

`<ClientRouter />` is enabled on purpose and stays.

- **Bind every client script through `astro:page-load`**, never `DOMContentLoaded` or a bare
  module-level `addEventListener` — the router replaces the DOM on each navigation, so a listener
  bound once dies on the first transition.
- **`<script is:inline>` is forbidden for client logic** — it only runs with the server HTML.
  *Settled by `tests/markup.test.ts`,* which allows `is:inline` only on the anti-FOUC theme script.
- **`document.currentScript` is forbidden** for capturing containers: after a swap it is stale.
- **No global ids for JS hooks.** Use `data-*` resolved relative to the container, so several
  instances work independently.
- **`transition:name` must match between source and destination** — that is what makes the card
  travel.
- These four are *settled by `tests/viewtransitions.test.ts`*, over a component list derived from the
  filesystem. If you must skip one, do it explicitly in that test, never silently.

### Comments

- **Nothing between the frontmatter fences and the markup is a comment** — Astro emits it verbatim,
  so a `//` note there ships to every visitor. Implementation notes go in the frontmatter, where
  they never leave the build.
- `{/* … */}` is stripped and would survive, but prefer the frontmatter: nobody converts a
  frontmatter note into an `<!-- -->` by accident, and someone "simplifying" a brace comment would
  start shipping it.
- **A new HTML label goes into the allowlist in `tests/comments.test.ts` deliberately.** Short labels
  (`<!-- Header -->`) are the existing style; a length limit cannot tell a label from a note.
- **`//` inside `<script>` and `<style>` is stripped at build.** Only markup leaks.
- A note in a stylesheet must not name a token as if it used one.
- **No comment block runs past five lines** — a block nobody reads to the end is worse than none,
  because it looks like the subject is documented. *Settled by `tests/comments.test.ts`.*
- **Keep the number, cut the retelling.** A measurement is what makes a comment worth reading, but
  if `AGENTS.md` already carries it the comment points there instead of repeating it: two copies
  drift, and the one that drifts is the one nobody re-reads.
- **A stale number is worse than no comment**, because it reads as current — a change that
  invalidates a measurement touches the comment in the same commit.
- **What earns a comment:** why a non-obvious value is that value, what broke and how it was found,
  and a warning whose failure is silent. **A comment earns its keep by being wrong loudly** — if
  deleting it would change what the next person does, keep it compressed; if not, delete it rather
  than shortening it.

### Public asset paths

- **Root-absolute, always** — a relative `src="icons/x.svg"` resolves against the current route, so
  it works on `/` and 404s on `/proyectos/<name>`. *Settled by `tests/contact.test.ts`* (leading
  slash, file exists) and `tests/about.test.ts` (`resumeUrl` points at a real file).

### Design tokens

- **Never write `var(--x)` for a token that is not defined** in `00-tokens.css` or `themes/*.css`. A
  custom property that is read but never defined fails silently: the whole declaration is invalid
  at computed-value time, the browser drops it, and nothing appears in the console.
- **A hardcoded colour as the only fallback is a bug, not a safety net** — it never follows the
  theme. If a fallback is genuinely needed, say why in a comment.
- **A token defined in one theme and read in both is worse than a missing one**: nothing errors and
  the fallback is another theme's palette. Define a token in both theme files or neither.
- **A token named "behind" or "surface" is a claim about where it may be used** — `--bg` is the
  ground the sheet sits on, and filling something *inside* the sheet with it inverts depth. Respect
  the meaning, not just the value.
- **Do not define one value under two names.** The duplicate is what lets one theme drift.
- Alias a theme-aware value instead of pairing `--x` with `--x-dark`: `--avatar-ring:
  var(--color-border)` resolves in both themes because both redefine `--color-border`, and no
  component needs a per-theme override.
- Prefer `!important` on a custom property in a media query when the base value is inline — it is
  the only way an author rule beats an inline declaration.
- **Run `tests/tokens.test.ts` before claiming a styling change is done.** It fails on a typo and on
  an invented token, so it is not vacuous.

### The social card

- **The card is drawn with the sheet's own tokens at the sheet's own values.** A hex typed into the
  generator is a second palette, and a renamed token then renders `undefined` in the picture
  instead of failing the run.
- **The generator imports `ABOUT` from `src/data/about.ts` and spells out none of its values** — a
  literal name on the card is a second source for the identity (constitution 9).
- **The card is a static file in `public/`, and nothing renders it**: no HTML, CSS or JS beside the
  PNG, and no route matching `og-cover`. A renderer is a second copy that drifts from the site's
  own CSS and fonts.
- **`og:image` and `twitter:image` bind the same expression**, composing `${site}/og-cover.png`, and
  that file exists — the two platforms must not resolve different images.
- **The artifact is 1200×630 and under 5 MB**, read from the PNG's own header rather than from a
  constant repeated in the guard.
- **The accent on the card's ground clears 4.5:1**, and the function that computes it reproduces the
  WCAG references: 21.0000 black on white, 1.0000 white on white, 4.5422 for `#767676` on white. A
  `return 99` and a byte average that skips the sRGB transfer function both satisfy `>= 4.5`.
- **Nothing in the generator depends on the moment it runs** — `measure` is a parameter and nothing
  calls `new Date()`, or two runs produce different bytes and the picture carries no diff.
- *All settled by `tests/seo.test.ts`.*

### CSS that silently does nothing

- **`attr()` only works for `content` properties.** Emit a custom property and read it from the
  media query.
- **Check `grid-template-columns` arithmetic against the real container width** — a `1fr` track
  collapses to zero when the fixed columns exceed the row. Give the flexible track
  `minmax(<floor>, 1fr)` and use `repeat(auto-fit, minmax(min(<needed>, 100%), 1fr))`.
- **Write the relationship in a derived rule, not the number** — a hardcoded value there goes stale
  silently and reads as if it were derived.
- **`ch` is the width of `0`, not a character**: 9.61px at 16px in IBM Plex Sans, so `60ch` is about
  72 characters. Never reason about `ch` as glyphs.
- **Fixed-size decorative markup is a duplicate waiting to happen.** Say so when you catch one.

### Visual language

- **The canvas is cool; navy and gold are the only chroma.** A warm cream ground with a warm gold
  accent is the most recognisable generated palette there is, and it cancels a navy-and-gold pair
  out into a default with a logo dropped on it. Reintroducing warm neutrals reads as a warmer,
  friendlier improvement to anyone who finds it. It is a regression.
- **The dark theme is one hue** — sheet, cards one step up, neutral scale in navy steps. Two
  surfaces in different hues read as two systems fighting rather than steps of one. A navy page is
  deliberate and stays; near-black with one acid accent is not the default to reach for.
- **`--accent-surface` stays dark in both themes** — components hardcode `color: #fff` on the
  primary button, so a light gold fill puts white on cream at 1.66:1. Revisit it only when the
  hardcoded `#fff` goes. *Settled by `tests/visual-language.test.ts`.*
- **Two self-hosted families and no font CDN link** (constitution 2): IBM Plex Sans, variable
  100–700, for everything; IBM Plex Mono, 400/600, for code and small data only. A bare system stack
  is not an acceptable simplification: every visitor sees whatever their OS ships and the site has
  no voice of its own.
- **`05-fonts.css` links before the other stylesheets** — `@font-face` must be known before anything
  computes a line box, or the first paint uses the fallback and the text reflows a frame later.
- **The variable font's range is a hard limit.** `font-weight: 800` clamps to 700 while the CSS
  claims otherwise: the declaration and the rendering quietly disagree. Use 700.
  *Settled by `tests/visual-language.test.ts`.*
- **Radius follows size class, not taste** — one radius everywhere is what makes a layout read as a
  template. `--radius-pill` is only for genuinely lozenge-shaped things, the bar track and its fill,
  never a square button: at 32×32 it rounds the corners nearly off. A child inside a padded parent
  takes the parent's radius *minus the parent's padding*, written as that relationship.
- **The type scale is 1.25 off a 16px base.** Adding a step means adding a token, never nudging an
  existing one: flatter steps make every level look like the one above it.
- **Cap body prose** with `--measure` / `--measure-wide`. Unconstrained, the hero's bio ran 98–101
  characters per line from 1280px up, past a comfortable return.
- **Size the page sheet `min(100% - gutter, --max-w)`, never a percentage** — a percentage makes the
  measure change with the viewport, so one paragraph takes a different shape on every screen.
- **Let the content choose the silhouette**: expose the shape as a prop, and do not frame a shape
  with a second outline that says nothing — a ring in `--color-border` is the same token every card
  border uses.
- **Hover means the border turns gold, and nothing lifts.** Never `translateY(-2px)`. Never signal
  hover with a background change alone: it is the weakest channel available and it *lowers* the
  contrast of whatever sits on it — the theme toggle measured 16.44 → 14.11 in light and 8.31 →
  6.08 in dark. *Both settled by `tests/visual-language.test.ts`,* which carries the measurement.
- **A surface's hue must not invert.** Filling something *inside* the sheet with `--bg` sinks the
  selected state instead of raising it; the soft fill inside the sheet is `--neutral-200`, one
  colour for that job everywhere.
- **Two things in a row are not peers.** A disclosure goes under what it discloses, left-aligned;
  opposite ends read as two unrelated items in opposite corners, and the control that governs the
  grid sits as far from it as the layout allows.

### Sensitive data

- **Never write into this file, `Memory.md`, `README.md`, `docs/`, a commit message or any other
  repo document**: paths containing the real user name, emails, full names, physical addresses,
  tokens, API keys or passwords. This is constitution 9, with the mechanics.
- Use placeholders — `C:\Users\<user>\...`, `<email>`, `<token>` — and prefer variables
  (`$env:USERPROFILE`) over literal paths in examples.
- **Flagging the existence of a secret is fine; its value is not.** `there is a PAT in .env, do not
  commit it` is the right sentence.
- Describe a bug's shape (`--executablePath=C:\...\Programs\Opera`) without filling in the rest
  from your machine.
- **`.env` is gitignored and holds a live PAT.** Never commit it, never echo it.
- A grep for "emails in documents" hits `LICENSE.md`. Those are third-party copyright addresses:
  do not read that as the rule being broken.

### Tests

- **A mechanical rule ships with a guard** (constitution 3), and **the rule names the test that
  settles it.** Prose is not a check.
- **Prove a guard still bites before reporting green**: inject the violation, watch it fail, then
  revert by explicit path. A suite that has never been red is untested. When a guard is right, the
  fix is to widen what it reads, never to relax what it accepts.
- **Strip comments before scanning source** — a note quoting removed code is not a use of it.
- **Assert data and rendered output, not source substrings** (constitution 8); a new grep needs a
  reason it cannot be a data check.
- **A guard's own assertion must not be satisfiable by something else** — an import path alone can
  match the whole name it is meant to be checking the usage of.
- **Keep `tests/helpers/` to what a test actually imports.** Add a mock helper when a test needs it,
  not before.

### Environment

- **Read configuration with `import.meta.env`, never `process.env`.**
- **`GITHUB_TOKEN` is server-side only** and has one reader, `src/pages/lib/github.ts` (constitution
  6). Never let it reach a client bundle.
- **`DEFAULT_LOCALE` is dead config** — nothing reads it; the default is the constant in
  `src/utils/locale.ts`. Do not wire it up.

### Git

- **NEVER push. NEVER commit unless asked.** Finishing a task does not imply committing, and if you
  are unsure whether to commit, ask.
- **A rejected commit is the suite failing, not a git bug.** Fix the test first; `--no-verify` is an
  escape hatch only when that is intentional.
- **The pre-commit hook runs `npm test` and cancels the commit on failure.** It does not call
  `lint` or `format`, because neither exists.
- **Agent skills are never tracked** — `.agents/`, `skills-lock.json`, `opencode.json`,
  `opencode.jsonc` and `.opencode/` are per-machine tooling that changes without the code changing.
  Do not `git add -f` them to tidy a diff.
- **`bloque/` is scratch and never tracked.** One plan per pending block, deleted when that block
  closes, and the whole directory once the last one does; the commit message is where a finished
  block's summary belongs.
- **`git checkout -- .` destroys uncommitted work silently** — it restores from the index, and this
  repo's normal state is uncommitted work. Revert explicit paths only, and hash what you did not
  mean to touch. `git checkout -- <untracked>` does nothing at all: delete those by hand.

### Memory

- **Read `Memory.md` before proposing anything**, and update it after each task. Update this file
  only when a rule actually changed.
- **Keep `Memory.md` under 50 lines.** Summarise what is stale and delete it.
- **Three homes, one rule each**: the non-negotiable rules in `docs/constitution.md`, the working
  rules here, state and context in `Memory.md`. Never duplicate a rule across two — change it in
  the one place it belongs, because the copy that drifts is the one people read.
- If something comes up often enough, propose a new rule: here, or in the constitution when it is
  genuinely non-negotiable.

### MCP: chrome-devtools

- **Never nest `mcpServers` inside `mcp`** — that is the VS Code / Claude Desktop format; `mcp` is a
  direct map of servers, each with `type` and `command` as an **array**.
- **Never hardcode a browser path.** OpenCode does not expand `{env:VAR}` inside `mcp.*.command`, and
  an absolute path breaks on any other machine. Install Chrome instead of fighting the path.
- Page ids in `list_pages` are 1-based.
- **Code Mode's runtime chokes on long template literals in `evaluate_script`** — store the helper
  on `window` in a short call, then read it back.
- **Wait for a real gap between tool calls before reading a settled value** — a `wait_for` on text
  matches text in the DOM even when it is `visibility: hidden`.
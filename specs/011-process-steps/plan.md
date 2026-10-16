# Plan 011 — "Lo que construyo" as four process steps

**Spec:** `specs/011-process-steps/spec.md` (**approved**, 8 RF).
**Status:** approved
**Approved:** 2026-10-15 · owner approval · 248 lines
**Approved:** 2026-10-15 · re-approval: tag radius --radius-xs (owner decision, shared .tag with 013) · 249 lines
**Changed:** 2026-10-15 · ordering, helper names, line numbers and icon sizes aligned, tag radius 4px corrected to --radius-xs (2px) with what 016, 007, 008, 017, 009 and 010 landed · 250 lines · re-approved by the owner 2026-10-15

**Ordering.** Specs 016, 007, 008, 017, 009 and 010 have landed. 016 puts `contrast`,
`resolveColour(expr, ...layers)` and `styleSources()` in `tests/helpers/colour.ts`; 007 creates
`e2e/helpers/dev-server.ts` and the theme setup (`addInitScript` + `emulateMedia`); 008 creates
`SectionTitle.astro`, `public/icons/ui/` (`NOTICE.md`, `LICENSE-tabler.txt`), the *ui icons*
guard and `e2e/helpers/rendered.ts` (`openIn`, `installHelpers` with in-page `__toHex`, `settled`,
`composite`); 017 leaves `--color-border` on cards; 009 added the section glow, the in-page
`__groundOf`, `composites`, `worstPoint`, `floorFor`; 010 added the Plex Sans italic face, the
*italic coverage* guard (reading `ABOUT.phraseKeys`) and `axTree(page)`/`axQuery(page, selector, role)`. Before any code: the
`AGENTS.md` scoped chroma exception (own `docs:` commit), the constitution 7 amendment (e2e in
`.husky/pre-commit`), and the owner's OK for each download in §2. Line numbers are today's.

## 1. Scope and coverage

| Requirement | Covered by |
|---|---|
| RF-1 second on the home | section unchanged in `Resume.astro:44`, id `ValueProposition` kept; `e2e/about.spec.ts:40-45` as is |
| RF-2 intro, note, four steps in order | `PROCESS` in `src/data/process.ts` rendered as `p`, `p`, `ol`; e2e *document order* |
| RF-3 complete, distinct entries | `stepIssues()` (§3); guard *process data* |
| RF-4, RF-5 tint and tone per theme | `--step-N-tint`/`-tone` in both theme files, read by `:nth-child(N)`; e2e *tints*, *tones* |
| RF-6 contrast floors | e2e *floors*, over 009's ground and glow helpers |
| RF-7 one row from 1131 px, else one per row | derived container query (§4, D-3); e2e *rows* |
| RF-8 three arrows, right or down | `aria-hidden` arrow in steps 1–3; e2e *arrows* |
| NFR scope of the exception | e2e *exception scope* (rendered) + guard *step colour scope* (source) |
| NFR card edge, inert, silent, no JS, italic, measure, radius | `.card-frame`; no control, hover rule or `<script>`; 010's face; e2e *frame*, *inert*, *silent* |
| NFR editable content; icons | the 003 walk moved and widened, *process strings*; 008's *ui icons* and 010's *italic coverage* read `PROCESS` |
| NFR no dependency, no host, LCP | same-origin SVGs; host baseline `e2e/about.spec.ts:28-38` untouched; LCP in the commit |

Every RF is covered. **Retired with replacement in the same commit:** the four tests of
"ABOUT value proposition and proof points" (`tests/about.test.ts:85-108`) → *process data*;
the walk (115-151) → *process strings*, widened, never relaxed.

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/data/process.ts` | create | Owns every text of the section and which glyph each step shows, in step order. |
| `src/data/about.ts` | modify | Lines 75-95 (`valueProposition`, `proofPoints`, their comment) go: no reader is left. |
| `src/components/ValuePropositionSection.astro` | rewrite | Decides how the steps lay out, where arrows point and which tint and tone each position takes. |
| `public/styles/themes/light.css` | modify | After the skill-level tokens: four tints and four tones, light values (Colour table). |
| `public/styles/themes/dark.css` | modify | After the bar fills: four tints as `var(--card-background)`, four tones. |
| `public/icons/ui/{bulb,code,database,rocket}.svg` | create, download | Step glyphs, unmodified. |
| `public/icons/ui/NOTICE.md` | modify | Four rows, as 008's. |
| `tests/process.test.ts` | create | *process data* (RF-3), *process strings* (the moved walk). |
| `tests/about.test.ts` | modify | Lines 78-151 go (`LOCALES` has no other reader). |
| `tests/visual-language.test.ts` | modify | *step colour scope*; *ui icons* and *italic coverage* read `PROCESS`. |
| `e2e/process-steps.spec.ts` | create | The rendered checks of §4. |
| `AGENTS.md` | modify, `docs:` | The exception's *settled by* line names the two scope guards once shown red. |
| `specs/003-value-proposition/spec.md` | modify | `**Status:** superseded`, one line naming 011. |

The locale files are untouched: the title key stays as 008 marked it. No new dependency.

Downloads, each on the owner's OK at the moment of download: Tabler Icons v3.49.0 (the version
`public/tech/mono/NOTICE.md` records), MIT, unmodified, from
`https://cdn.jsdelivr.net/npm/@tabler/icons@3.49.0/icons/outline/<file>`. Sizes are estimates from
`broadcast.svg` (498 B, same set); the CDN's `Content-Length` on 2026-10-15: `bulb.svg` 514 B,
`code.svg` 413 B, `database.svg` 463 B, `rocket.svg` 541 B, re-reported on download.

## 3. Pure logic

Nothing reads a clock. In `src/data/process.ts`:

```ts
type Text = Record<Lang, string>;
export interface ProcessStep { icon: 'bulb' | 'code' | 'database' | 'rocket';
  title: Text; description: Text; tags: Record<Lang, readonly string[]> }
export const PROCESS: { intro: Text; note: Text; steps: readonly ProcessStep[] }
```

The number, tint and tone come from the position, so the data cannot disagree with the list.

- `stepIssues(p: typeof PROCESS, locales: readonly Lang[]): string[]` (in
  `tests/process.test.ts`) — one message per fault: a blank (`trim() === ''`) intro, note,
  title, description or tag; a tag count outside 2–3; a title or a description equal to another
  step's in the same locale; a step count other than 4. `[]` means valid.
- `rowCount(tops: number[], tol = 1): number` (in the e2e spec) — distinct rows among box tops.
- `pointing(rotate: string): 'right' | 'down' | string` — `none` → right, `90deg` → down.
- `EXCEPTION = ['#FCF3D6', '#E3ECFB', '#DEF2E5', '#ECE6FA', '#5532A0', '#C7B5F7']` — the values
  the exception introduces, copied from the spec's Colour table (dated, as `HOME_HOSTS` is).

## 4. Algorithm

**Markup** (`locale` prop kept; text indexed by locale, the shape `ValuePropositionSection.astro:12-15`
already uses):

```
<section class='section process' id='ValueProposition' aria-labelledby={008's id}>
  <SectionTitle section='valueProposition' />
  <p class=process__intro>{intro[locale]}</p>
  <p class=process__note>{note[locale]}</p>
  <ol class=steps> for s, i in steps:
    <li class='step card-frame'>
      <span class=step__icon aria-hidden=true style=--icon:url(/icons/ui/{s.icon}.svg)></span>
      <h3 class=step__title>{s.title[locale]}</h3>
      <p class=step__desc>{s.description[locale]}</p>
      <ul class=step__tags role=list> for g: <li class=step__tag>{g}</li>
      if i < 3: <span class=step__arrow aria-hidden=true></span>
```

**Styles (scoped).** `.process { container-type: inline-size }` — its content box is the row.
Intro: `--fs-base`, `--text-secondary`, `max-inline-size: var(--measure)`. Note: italic 400,
`--fs-base`, `--text-secondary`. `.steps`: `list-style: decimal inside`, `display: grid`, `gap:
2rem`, padding 0. `.step`: `position: relative`; `background: var(--tint)`; `li::marker` in
`--text-color`, `--fs-lg`, 700 — the number, announced once. `.step:nth-child(N)` sets `--tint:
var(--step-N-tint); --tone: var(--step-N-tone)` for N = 1–4. Frame, padding (1.25rem), 1px
border and 14px radius come from `.card-frame` (`03-components.css:49-54`); the scoped selector
outranks its `background`, re-checked computed (AGENTS DRY). Icon: inline-block 2rem,
`margin-inline-start: var(--sp-2)`, `color: var(--tone)`, `background-color: currentColor`, `mask`
and `-webkit-mask: var(--icon) center / contain no-repeat` (008's). Title: `--fs-lg`, 700,
`--text-color`, line height 1.3. Description: `--fs-sm`, `--text-secondary`. Tags: flex wrap,
gap 0.35rem, `list-style: none` (it would inherit the decimal); each `--fs-xs` 500, `nowrap`, `padding: 0.2rem 0.5rem`, `--tag-surface`,
`--text-secondary`, `--radius-xs` (owner decision 2026-10-15, shared `.tag` with 013), no border (not a control). No `:hover` rule anywhere.

**Arrow.** 1rem square, `background-color: var(--accent-text)`, `clip-path: polygon()` of a
right-pointing arrow (shaft + head), `position: absolute`. Stacked: `inset-block-start: calc(100%
+ (2rem - 1rem) / 2)`, centred inline, `rotate: 90deg`. In the row: `inset-inline-start:
calc(100% + (2rem - 1rem) / 2)`, centred block, `rotate: none`.

**Row (RF-7).** `@container (min-width: calc(4 * (11rem + 2 * (1.25rem + 1px)) + 3 * 2rem))`
— floor, chrome and arrow slot as the spec's Layout writes them, 968 px — sets `grid-template-
columns: repeat(4, minmax(0, 1fr))` and the row arrow. Chromium resolves `calc()` there (probed:
968 px wide applies, 967.5 px does not). Row = `0.92 V − 72` (`global.css:36-40`, `04-layouts.css:2`):
968.5 at V = 1131, 967.6 at 1130.

**Measured min-content** (dev server, Plex Sans loaded, a mock card with these styles, both
locales): "evoluciono" at 20 px / 700 is **101.45 px** (spec estimate 116) and sets the card's
content min-content; then the tag "Bases de datos" 99.11 px, "maintainable" 76.23 px at 13 px.
**The breakpoint does not move:** only a value above the 11rem floor moves it, and 101.45 is 74.6 px
under; the floor stays a design floor. Re-measured on the real component at the walk; a value
above 176 px moves V by `4 Δ / 0.92`.

**Guard *process data*** (RF-3): `stepIssues(PROCESS, ['es', 'en'])` equals `[]`; the four
icons are `bulb, code, database, rocket` in order. **Guard *process strings***: the 003 walk over
`src/components/*.astro`, comments stripped, for intro, note, titles, descriptions (substring)
and tags (whole token, `(?<![\p{L}/])tag(?![\p{L}/])`, `u` — "Cloud" or "APIs" as a substring of
an identifier is not a spelling). **Guard *step colour scope*** (source half): over
`styleSources()`, every `var(--step-` read sits in `ValuePropositionSection.astro`; a declaration's
left-hand side in a theme file is not a read. **Widened:** *ui icons* reads `PROCESS.steps[].icon`
(exists, `currentColor` only, in `NOTICE.md`, one meaning per glyph across 008, 010, 011);
*italic coverage* adds both `note` values beside `ABOUT.phraseKeys` ("ó" is inside the latin range).

**e2e** (`process-steps.spec.ts`; URL from `startDevServer()`; 007's theme setup (`openIn`); `settled` before
every read). Section = `#ValueProposition`.

- *document order* (RF-2): `/?lang=es`, `/?lang=en`; in tree order the intro, the note, then one
  `ol` with four `li`; each `li`'s title, description and tag texts equal `PROCESS`; the `ol`
  carries no `start` or `reversed` and no `li` a `value`, so the markers read 1–4.
- *tints*, *tones* (RF-4, 5): load light, click `[data-theme-toggle]` to dark, and the reverse.
  Each card's `background-color` → light: the four tints of the table, distinct; dark: a probe's
  `var(--card-background)`. Each icon's `background-color` equals the table's tone for the theme.
- *floors* (RF-6): per theme, after the toggle; texts (intro, note, marker, titles,
  descriptions, tags) at `floorFor()`, icons and arrows at 3. Ground from the in-page `__groundOf()`; on the
  glow, `worstPoint(composites())`; on a card or tag, its opaque fill. Message: element, colour,
  ground, ratio.
- *rows* (RF-7): `es` and `en`, viewports 1280, 1131, 1130, 320; `rowCount` of the cards' tops
  is 1, 1, 4, 4; `scrollWidth <= clientWidth` on each card.
- *arrows* (RF-8): at 1280 and 1130, three arrows; arrow *n* lies in step *n*; its box sits
  between card *n* and *n+1* (right edge ≤ next left at 1280, bottom ≤ next top at 1130);
  `pointing()` is right at 1280, down at 1130.
- *frame* (NFRs): card borders 1px solid in a probe's `var(--color-border)`, radius 14px; tag
  radius = a probe's `var(--radius-xs)` (2px today); note italic; intro `max-inline-size` = a probe's `var(--measure)`.
- *inert*, *silent*: no `a`, `button`, `[tabindex]` or `script` in the section; hover each card,
  then re-read border, background, transform and icon colour: equal. `axQuery(page, '#ValueProposition', role)` under the
  section holds the Copy texts and the four markers, and no node for an icon or an arrow.
- *exception scope* (NFR): each theme, `/`, `/proyectos`, its first project page (data
  dependency named on failure), `/no-such-page`; every element outside the section: its
  `background-color`, `color`, `border-*-color`, `outline-color`, `fill`, `stroke` as hex never
  in `EXCEPTION`.

## 5. Interface

| State | Light | Dark |
|---|---|---|
| Intro, note | secondary 6.02 on `#FBFCFD`; note italic | secondary on the glow, worst 5.08 (009; flat 5.39) |
| Card at rest | tint `#FCF3D6` / `#E3ECFB` / `#DEF2E5` / `#ECE6FA`, 1px `--color-border`, 14px | `#2B4372` all four, border `#3A578F` |
| Number, title / description / tag | ink 13.52–14.82 / secondary 5.09–5.58 / 4.74 on the chip fill | 9.11 / 4.78 / 6.31 |
| Icon | tones `#7A5D10`, `#1F4494`, `#14572A`, `#5532A0` | `#E3C770`, `#9DBCF5`, `#6EE7A8`, `#C7B5F7` |
| Arrow | gold 6.01 on the sheet | gold on the glow, worst 6.27 (009; flat 6.66) |
| ≥ 1131 px / < 1131 px | one row, arrows right / one per row, arrows down, cards full width | same |
| 320 px | stacked; step 3's Spanish description wraps in the card | same |
| Hover, focus, theme flip | nothing changes; no tab stop; tints switch with the theme | same |
| Text zoom 200 %, forced colours | the rem floor scales with it (D-3); UA colours, order from the list | same |

The section has no empty state: four steps are data, and RF-3 fails on a missing one.

## 6. Decisions

- **D-1 · Content in `src/data/process.ts`, indexed by locale.** 003's precedent, RF-3 as a typed
  data test. *Discarded:* locale-file keys through `t()` — tag arrays fit badly and `t()` returns
  the key for a missing string; keeping it in `ABOUT` — the steps describe the work, not the person.
- **D-2 · Tint and tone from `:nth-child(N)` over `--step-N-*`.** *Discarded:* an inline `style`
  per step — a second place that names a step's colour; a `data-step` hook — an attribute only CSS reads.
- **D-3 · A container query with the derivation in `calc()`.** The rule states the spec's
  relationship and follows any change to the sheet's gutter or padding; in rem, text zoom moves it
  with the text. *Discarded:* `@media (min-width: 1131px)` — a literal that goes stale silently.
  Headless Chromium has no scrollbar, so the e2e viewport is the layout width; a desktop with a
  classic 15 px scrollbar switches at about 1146 px.
- **D-4 · The number is `::marker`, inside.** *Discarded:* a counter in `::before` — generated
  text in the AX tree beside the list's own marker; a text node — announced twice.
- **D-5 · The arrow is a `clip-path` span in step *n*.** A real box RF-8 can read. *Discarded:* a
  fifth Tabler download (not in the spec's list); "→" as text — a font glyph, judged at 4.5:1 as
  text; a `::after` — no box for the e2e.
- **D-6 · Literals on the step names, no violet ramp.** *Discarded:* `--violet-*` — a ramp invites
  use outside the section the exception is scoped to.
- **D-7 · Tags are inert labels: no border, no hover.** *Discarded:* reusing `SkillChip` — a
  control with 017's border and a gold hover, against the inert NFR.
- **D-8 · Component and section id keep their names.** *Discarded:* `ProcessSection` — renames
  008's entry, the e2e id and the anchor for a name only.
- **D-9 · RF-4/5 expect the Colour table's literals.** *Discarded:* a probe of `--step-N-*`, which
  compares the token with itself.

## 7. Test strategy

Runners from `package.json`: `npm test` (`vitest --run tests`) for *process data*, *process
strings*, *step colour scope* and the widened guards; `npm run test:e2e` (`playwright test`,
Chromium) for the rest — colours, boxes and the AX tree are what those RFs are about
(constitution 8). *Step colour scope* reads source for the spec's stated reason. Red first
against today: *process data* (no `PROCESS`), *document order*, *tints*, *tones*, *rows*,
*arrows*, *frame*. Each injection restored byte-identical by explicit path, the commit naming them:

| # | Injection | Expected red |
|---|---|---|
| 1 | step 2 `es` title `''` | process data |
| 2 | step 4 `en` gets a fourth tag | process data |
| 3 | step 3 `es` description = step 1's | process data |
| 4 | step 1 title spelled in the component | process strings |
| 5 | tag `DevOps` as a text node in the component | process strings (whole-token half) |
| 6 | `.chip { color: var(--step-4-tone) }` in `SkillChip.astro` | step colour scope |
| 7 | `--step-4-tint` read by `.contact-card` | step colour scope; exception scope, light |
| 8 | `:nth-child(2)` and `(3)` tints swapped | tints |
| 9 | dark `--step-1-tint: #FCF3D6` | tints (dark), floors (dark ink on a pastel) |
| 10 | dark `--step-2-tone: var(--clr-intermediate-text)` | tones (dark), floors (`#1F4494` on `#2B4372`) |
| 11 | arrow `rotate: 90deg` in the row too | arrows (1280) |
| 12 | container query on `calc(... + 3 * 2rem + 40px)` | rows (1131) |
| 13 | `repeat(auto-fit, minmax(14rem, 1fr))` | rows (3 + 1 at 1131) |
| 14 | `.step:hover { border-color: var(--accent-text) }` | inert |
| 15 | `aria-hidden` dropped from the icon | silent |
| 16 | `.card-frame` dropped from the `li` | frame |
| 17 | `bulb.svg` renamed | ui icons |

Then `npm run build`, LCP before and after at 390/958/1440 px (003's method) in the commit, and the
*Done when* walk: `/` in light and dark, `es` and `en`, at 1280 and 1130 px after transitions
settle, `document.styleSheets` checked first, RF-6 ratios recorded against the Colour table, and
forced colours looked at once. Stop for the owner's approval before the commit.

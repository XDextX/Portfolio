# Plan 008 — One section-title treatment for the home sections

**Spec:** `specs/008-section-titles/spec.md` (**approved**, 8 RF).
**Status:** approved
**Approved:** 2026-10-15 · owner approval · 219 lines
**Approved:** 2026-10-15 · re-approval: ordering note aligned with what 016 and 007 actually landed (helper locations and names)

**Ordering.** Specs 016 and 007 land first: 016 moved the colour maths to `tests/helpers/colour.ts`
(D-5); 007 created `e2e/helpers/dev-server.ts` (it returns its own server's URL) and the
in-page `__toHex` and `settled` helpers in `e2e/primary-button.spec.ts`. Every guard here builds on those.
Before any code, the spec's prerequisites: the constitution 7 amendment (e2e in the
policy and the hook), the UI-icon rule in `AGENTS.md` (own `docs:` commit), and the
owner's OK for each download in §2. RF-1–4, 6 and 8 are not checks until the first lands.

## 1. Scope and coverage

| Requirement | Covered by |
|---|---|
| RF-1 one treatment | `SectionTitle.astro` in all five sections; e2e *one treatment* (§4) |
| RF-2 gold icon first | masked icon span glued to the first word; e2e *icon* |
| RF-3 gold dash last | dash span glued to the last word; e2e *dash* |
| RF-4 only the gold word gold | `titleWords()` marks one word; e2e *gold runs* |
| RF-5 gold ≥ 4.5:1 on the sheet | guard *title gold contrast* + WCAG reference case |
| RF-6 plain accessible name | icon and dash `aria-hidden`, words joined by one space; e2e *names* |
| RF-7 gold word from the locale | `*…*` marker in each title; guard *gold word designation* |
| RF-8 clean wrap at 390 | the two glue spans; e2e *wrap* |
| NFR icons, tokens, language | guard *ui icons*; `tokens.test.ts` and `i18n.test.ts` unchanged — `t()` stays plain |
| NFR no hover | no hover rule in the component; e2e *one treatment* hovers each title |
| NFR transition pair | one constant read by both routes; guard *projects title pair* |

Every RF is covered. No guard retires: none reads `.section__title` today.

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `public/icons/ui/<glyph>.svg` ×5 | create, download | One glyph per section, table below. |
| `public/icons/ui/LICENSE-tabler.txt` | create, copy | Tabler's MIT text, byte-identical to `public/tech/mono/LICENSE-tabler.txt` (1 094 B); no fetch. |
| `public/icons/ui/NOTICE.md` | create | Source, version and licence of each glyph, as `public/tech/mono/NOTICE.md`. |
| `i18n/i18n.ts` | modify | `t()` (32-56) returns plain text for marked strings; gains `titleWords`, `tWords`. |
| `i18n/index.ts` | modify | Re-exports `tWords`. |
| `i18n/locales/es.json`, `en.json` | modify | Each title (lines 32, 47, 68, 71, 99) marks its gold word. |
| `src/data/sectionTitles.ts` | create | Decides per section: locale key, heading id, glyph, link, transition name. |
| `src/components/SectionTitle.astro` | create | Renders a title — icon, words with the gold one, dash — and owns its look. |
| `ValueProposition`/`Habilities`/`Experience`/`ContactSection.astro` | modify | `<h2>` (20, 16, 16, 23) and id/title constants (10-11, 11-12, 11-12, 6-7) become `<SectionTitle>` and the entry's id. |
| `src/components/ProjectsSection.astro` | modify | `<h2>` (55-61) becomes `<SectionTitle section='projects'>`; `title` names only the hidden-title section. |
| `src/components/Resume.astro` | modify | Stops passing `title` (51), which the visible branch no longer reads. |
| `src/pages/proyectos/index.astro` | modify | The `h1` transition name (75) reads the projects entry's constant. |
| `public/styles/04-layouts.css` | modify | `.section__title` (5-10) goes with its only reader. |
| `tests/visual-language.test.ts` | modify | *title gold contrast*, the WCAG reference case, *ui icons*. |
| `tests/i18n.test.ts` / `viewtransitions.test.ts` | modify | *gold word designation* / *projects title pair*. |
| `e2e/helpers/rendered.ts` | create | `toHexColour` and `settle`, moved out of 007's `primary-button.spec.ts` (which imports them). |
| `e2e/section-titles.spec.ts` | create | Rendered checks of RF-1–4, 6, 8 and the hover NFR. |

Downloads, each on the owner's OK: Tabler Icons v3.49.0 (the version
`public/tech/mono/NOTICE.md` records), `outline`, unmodified, from
`https://cdn.jsdelivr.net/npm/@tabler/icons@3.49.0/icons/outline/<file>`. Sizes are
estimates from `broadcast.svg` (498 B, same set); the byte count is reported on download:
`tool.svg` (Lo que construyo, ~0.45 kB), `chart-bar.svg` (Habilidades, ~0.55 kB),
`briefcase.svg` (Experiencia, ~0.45 kB), `folder.svg` (Proyectos, ~0.4 kB), `mail.svg`
(Contacto, ~0.4 kB).

## 3. Pure logic

Nothing reads a clock. In `i18n/i18n.ts`:

- `plainText(raw: string): string` — drops the `*` pair (`'*Experiencia* laboral'` →
  `'Experiencia laboral'`). `t()` applies it, so the six other callers of
  `projects.title` (`Resume.astro:39`, `proyectos/index.astro:42, 54, 78, 97`,
  `[name].astro:25`) stay plain unchanged.
- `titleWords(raw: string): { text: string; gold: boolean }[]` — splits on single spaces;
  exactly one word is `*w*` with `w` matching `^\p{L}+$`. Throws on no marker, two, a
  marker inside a word (`con*struyo*`), or a doubled or edge space.
- `tWords(key: string)` — `titleWords` of the current locale's raw string; throws on a
  missing key, where `t()` would quietly return the key.

## 4. Algorithm

**`SectionTitle` (`section: keyof typeof SECTION_TITLES`).**

```
e = SECTION_TITLES[section]; w = tWords(e.key); n = w.length
piece(x) = x.gold ? <span class=section-title__word>{x.text}</span> : x.text
icon = <span class=section-title__icon aria-hidden style=--icon:url(/icons/ui/{e.icon}.svg)>
dash = <span class=section-title__dash aria-hidden>
body = n == 1 ? <span class=glue>{icon}{piece(w0)}{dash}</span>
     : <span class=glue>{icon}{piece(w0)}</span>, ' ', middle words joined by ' ', ' ',
       <span class=glue>{piece(w[n-1])}{dash}</span>
<h2 id={e.id} class=section-title transition:name={e.transitionName}>
  {e.href ? <a href={e.href}>{body}</a> : body}
```

Emitted on one line, so no template whitespace lands beside a span. If Astro emits a
scope attribute for an undefined `transition:name`, the component takes two branches.

**Styles (scoped).** `.section-title`: `font-size: var(--fs-xl)`, `font-weight: 700`,
line height from `01-base.css:52-56`, UA margins kept (D-6). `.glue`: `white-space:
nowrap`. Icon and dash: `inline-block`, `vertical-align: middle`, `background-color:
currentColor`; icon 1.5rem square, `margin-inline-end: var(--sp-2)`, `mask` and
`-webkit-mask: var(--icon) center / contain no-repeat` (`SkillBar.astro:64-71`); dash
1.5rem × 2px, `margin-inline-start: var(--sp-3)`. One selector list sets `color:
var(--accent-text)` on icon, dash and word; the rest inherits `--fg`, or in the link
`--text-color` (`01-base.css:43-46`), the same value in both themes.

**Guard *gold word designation* (RF-7).** Per entry and locale: `titleWords(raw)` does not
throw; the gold word occurs once in `plainText(raw)` as a whole word
(`(?<!\p{L})w(?!\p{L})`, `u`); `t(key) === plainText(raw)`, no `*` left. Strings: es
"Lo que \*construyo\*", "\*Habilidades\*", "\*Experiencia\* laboral", "\*Proyectos\*",
"\*Contacto\*"; en "What I \*build\*", "\*Skills\*", "\*Experience\*", "\*Projects\*", "\*Contact\*".

**Guard *title gold contrast* (RF-5).** Per theme, 016's layers: `contrast(resolveColour(
'var(--accent-text)', ...L), resolveColour('var(--main-bg)', ...L)) >= 4.5`; a throw is an
offender naming the theme. Reference case: 21.0000, 1.0000 and 4.5422 for black/white,
white/white and `#767676`/white, as `seo.test.ts:556` asks of the card's function.

**Guard *ui icons*.** The five glyphs are distinct; each `public/icons/ui/<icon>.svg`
exists with only `currentColor` paints (`svgPaints()`); NOTICE names each; the licence sits beside.

**Guard *projects title pair*.** `SECTION_TITLES.projects.transitionName` is non-empty;
the `<h2` tag of `SectionTitle.astro` carries `transition:name={e.transitionName}` and the
`<h1` tag of `proyectos/index.astro` `transition:name={SECTION_TITLES.projects.transitionName}`.
A source read (constitution 8): the name exists nowhere else until a route renders.

**e2e.** `/?lang=es` and `/?lang=en`, light and dark (007's `addInitScript` +
`emulateMedia`), every `h2.section-title`, after `settle`. Gold = a probe's computed
`var(--accent-text)`; body = `body`'s computed `color`; glyph boxes from a `Range`.

- *one treatment* (RF-1): font size (24px), weight, line height, icon and dash boxes, both
  gaps, three colours — one tuple for all five. Hover each: nothing changes but the
  projects link's `text-decoration-line`.
- *icon* / *dash* (RF-2, 3): icon right ≤ first glyph left, dash left ≥ last glyph right,
  each overlapping its glyph's line; dash non-zero; colour gold. Again after clicking
  `[data-theme-toggle]`, no reload.
- *gold runs* (RF-4): text nodes computing gold join to the `titleWords` gold word; all
  others compute body.
- *names* (RF-6): CDP `Accessibility.getFullAXTree`; each heading's name and the projects
  link's equal `t(key)` exactly.
- *wrap* (RF-8): 390×844, "Experiencia laboral" forced to `inline-size: 10ch`; glyph rects
  grouped by line; the icon's and the dash's lines each hold a glyph; `scrollWidth <= clientWidth`.

## 5. Interface

| State | Light | Dark |
|---|---|---|
| Title at rest | icon, word, dash `#7A5D10` (6.01:1 on `#FBFCFD`); rest `#16202C` | `#E3C770` (6.66:1 on `#243972`); rest `#F5F7FA` |
| Projects title | was 32px, body colour, no gold; now as above, linked | same |
| Projects link hovered | underline in the link colour, under the gold word too; icon and dash are atomic inlines and take none | same |
| Other titles hovered; one-word title (4 of 5 in `en`) | no change; icon, gold word, dash | same |
| 390px | ~318px wide; "Experiencia laboral" with icon and dash estimated ~290px, measured at the walk; wraps per RF-8 if not | same |
| GitHub fetch failed | title unchanged, alert below it | same |
| `/proyectos` | no `SectionTitle` (`hideTitle`); `h1` unchanged; the morph fades icon and dash | same |

The 24×2px dash and middle alignment are this plan's proposal: the mockup is not in the
repo, so they are confirmed against it at the visual walk.

## 6. Decisions

- **D-1 · `*word*` inside the title, stripped by `t()`.** *Discarded:* `{{gold}}` plus a
  word key — a second key, and `t()` leaves `{{gold}}` in the six other callers; a
  marker stripped by a helper only — those callers would print the asterisks.
- **D-2 · Icon and dash glued to their word by `nowrap` spans.** *Discarded:* a flex row —
  the dash lands right of the widest line, not the last glyph; absolute placement in
  padding — reserves ~32px on every line.
- **D-3 · Real `aria-hidden` spans.** *Discarded:* `::before`/`::after` — no box to read,
  and RF-2, 3, 8 measure boxes.
- **D-4 · The link wraps the whole body.** *Discarded:* a link around the words only —
  it cuts the glue spans and gives projects a DOM the other four lack.
- **D-5 · Entries in `src/data/sectionTitles.ts`** (constitution 5). *Discarded:* an icon
  literal per call site — distinctness would need a source grep.
- **D-6 · 24px, weight 700 declared, UA margins kept.** Four titles do not move; projects
  goes 16 → 19.92px below. *Discarded:* `margin: 0 0 var(--sp-4)` — moves four sections
  ~20px each, layout that 011–015 decide.
- **D-7 · Scoped style, `.section__title` deleted.** *Discarded:* a global class in
  `04-layouts.css` — one component renders it (AGENTS DRY).
- **D-8 · One transition-name constant.** *Discarded:* comparing the two template
  literals, which a read cannot evaluate.
- **D-9 · RF-6 from the CDP tree.** *Discarded:* `getByRole({ name, exact })` — Playwright
  normalises whitespace first.
- **D-10 · WCAG references on `visual-language`'s `contrast()`.** *Discarded:* importing
  `og-cover.ts`'s `contrastRatio`, gated by `requireGenerator()` — a second formula.
- **D-11 · Move 007's helpers to `e2e/helpers/rendered.ts`.** *Discarded:* a copy (DRY).

## 7. Test strategy

Runners from `package.json`: `npm test` (`vitest --run tests`) for the four data guards;
`npm run test:e2e` (`playwright test`, `@playwright/test` 1.56, Chromium) for the
rendered checks — a computed colour, box and name are what those RFs are about
(constitution 8). Red first against today: *gold word designation*, *ui icons*,
*projects title pair*; e2e *one treatment*, *icon*, *dash*, *gold runs*, *wrap*. RF-5 and
RF-6 are green today: proven by injection only. Injections avoid the brand gold for
rendered checks, since dark gold equals it.

Each restored byte-identical by explicit path, the commit naming them:

| # | Injection | Expected red |
|---|---|---|
| 1 | es "Lo que construyo", no marker | gold word designation |
| 2 | es "Lo que con\*struyo\*" | gold word designation |
| 3 | en "\*Experience\* Experience" | gold word designation (twice) |
| 4 | `t()` stops calling `plainText` | gold word designation (`*` left) |
| 5 | light `--accent-text: var(--brand-accent)` | title gold contrast, light (1.61) |
| 6 | dark `--accent-text: var(--brand-primary-light)` | title gold contrast, dark |
| 7 | `luminance()` without the sRGB transfer | reference case (4.5422) |
| 8 | `contrast()` returns 99 | reference case (21, 1) |
| 9 | `/proyectos` `h1` name back to a literal | projects title pair |
| 10 | `transition:name` dropped from `SectionTitle` | projects title pair |
| 11 | contact glyph `folder` | ui icons (distinct) |
| 12 | `mail.svg` renamed | ui icons (missing) |
| 13 | `ValuePropositionSection` back to a bare `<h2>` | one treatment, icon, dash |
| 14 | icon `color: var(--color-brand)` | icon, both themes |
| 15 | dash `color: var(--text-secondary)` | dash, both themes |
| 16 | every word of one title gold in markup | gold runs |
| 17 | word `color: var(--fg)` | gold runs, one treatment |
| 18 | words joined with `''` | names |
| 19 | `white-space: nowrap` removed | wrap (dash alone on a line) |
| 20 | icon colour the literal `#7A5D10` | icon, dark after the toggle |
| 21 | `.section-title:hover { color: var(--accent-text) }` | one treatment (hover) |

Then `npm run build`, and the *Done when* walk: `/` at 390×844 and 1280×800, both themes
and locales, after animations settle, `document.styleSheets` checked first.

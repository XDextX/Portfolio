# Plan 044 — The project page in the site's design system

**Spec:** `specs/044-project-page-design/spec.md` (7 RF).
**Status:** approved
**Approved:** 2026-10-18 · owner approval · 196 lines

Built on top of spec 043, which lands first and rewrites the sidebar's count spans and the
`aria-label`s on the topics and the README section of `src/pages/proyectos/[name].astro`. This
plan moves that sidebar as 043 leaves it and changes none of its lines.

Measured on the dev server, 2026-10-18 (left and right edge, px):

| Width | `/proyectos` header | `/proyectos` `.projects-grid` | project page, everything |
|---|---|---|---|
| 360 | 20–340 | 36–324 | 20–340 |
| 390 | 20–370 | 36–354 | 20–370 |
| 800 | 52–748 | 68–732 | 52–748 |
| 1280 | 115–1165 | 131–1149 | 115–1165 |

So `.wrap` is not the cause: both routes use it, and it is a `flex-wrap` no-op on each. The 16 px
is `.section { padding: 1rem }` (`public/styles/04-layouts.css` line 1), which wraps the cards on
`/proyectos` and every section on Home and wraps nothing on the project page. The `/proyectos`
header itself sits at the sheet's padding, outside any `.section`.

## 1. Scope and coverage

| Requirement | Covered by |
|---|---|
| RF-1 (tile) | `PageHeader.astro`, extracted from the `/proyectos` header, draws the tile with the `folder` mask beside the slotted `h1`; the project page renders it. |
| RF-2 (band) | `PageHeader` renders `<HeroBackground variant='header' />`; the sidebar and the README move out of `<header>` (today they sit inside it, lines 95–155), so the band ends at the header's bottom. |
| RF-3 (gutter) | The header matches the `/proyectos` header's edges, 20 and 370 px at 390 (same component, same place). The body (sidebar and README) takes the `section` class, the inset the `/proyectos` cards sit in, 36 and 354 px at 390. |
| RF-4 (lead) | `PageHeader`'s `lead` prop carries `desc`; the `h3` block, its `id='project-desc'` and the key `project.meta.description` go. |
| RF-5 (heading levels) | Falls out of RF-4: outside the README the page has its `h1` only. A guard walks the levels. |
| RF-6 (repeated name) | `tidyReadme` drops the README's leading heading when it has the repository's name. |
| RF-7 (anchors) | `tidyReadme` drops each heading's `a.anchor` and moves its `id` onto the heading. |
| NFR view transition | The `h1` stays in `[name].astro` (slotted), keeping `transition:name={`p-${repo.id}-title`}`. |
| NFR visual language | The tile reuses 039's fill (`--accent-surface`) and ink (`--accent-surface-text`), radius `--radius-md`. |
| NFR README untouched | `tidyReadme` runs after spec 037's image rewrite and touches only headings and their anchors. |
| Edge: no README / no headings | `tidyReadme` returns its input unchanged; `Readme.astro`'s missing state stays. |
| Edge: longer title, badge row | Algorithm, block 4: text before the heading counts, images do not; names compare normalised. |
| Out of scope: fragment links | README links to `#x` do not reach `user-content-x`, today or after; pre-existing, not fixed (spec Out of scope). |
| Edge: no description | `projectDescription` already returns the fallback; the lead shows it. |
| Edge: unavailable page | Its branch renders `PageHeader` with the unavailable title and message. |
| Edge: long name at 360 | The tile is `flex: none`; the `h1` wraps (`min-inline-size: 0`). |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/components/PageHeader.astro` | create | A route's header: band, `before` slot (breadcrumb, back button), tile beside the `title` slot, lead line, default slot for extras. Owns the header styles 039 wrote in `index.astro`. |
| `src/pages/proyectos/index.astro` | modify | Renders `PageHeader` with its breadcrumb, two-tone `h1`, `projects.lead`, topic and filters; keeps only `.projects-page__title`, `__word`, `__topic`, `__error` styles. |
| `src/pages/proyectos/[name].astro` | modify | Header through `PageHeader` (breadcrumb, back button, `h1` + badge, `desc` as lead); body section with `section`; unavailable branch through `PageHeader`; drops `.hero__top`, `.desc`, `.unavailable`, `aria-describedby`. |
| `src/pages/lib/github.ts` | modify | Adds `tidyReadme(html, repoName)`: decides which README heading markup reaches the page. |
| `src/components/Readme.astro` | modify | Passes the README through `tidyReadme(html, repo.name)` before `set:html`. |
| `i18n/locales/es.json`, `en.json` | modify | Remove `project.meta.description` (no reader left). |
| `tests/readme-headings.test.ts` | create | `tidyReadme` as data (RF-6, RF-7). |
| `tests/project-page.test.ts` | create | The route rendered by `AstroContainer` with stubbed GitHub: RF-4 text, RF-5, RF-6, RF-7 ids, no README, unavailable header. |
| `tests/project-card.test.ts` | modify | Line 140 reads the description from the header's lead instead of `id="project-desc"`. |
| `e2e/projects-header.spec.ts` | modify | Selectors to `.page-header*`; RF-1 and the band checks loop over `/proyectos` and `/proyectos/Portfolio`; route-specific pixel targets. |
| `e2e/project-filters.spec.ts`, `e2e/return-to-origin.spec.ts` | modify | Selectors `.projects-page__header` → `.page-header` (7 lines). |
| `e2e/project-page.spec.ts` | create | RF-3 edges, RF-4 position and measure, RF-6 and RF-7 rendered, long name at 360. |
| `e2e/hero-background.spec.ts` | modify | Delete "no band on … the project detail" (lines 43–46): RF-2 reverses it. |
| `e2e/dark-glows.spec.ts` | modify | Only if the project page's `section` keys change (block 6, D-9): the recorded key list, not the asserted value. |

## 3. Pure logic

```ts
/**
 * A README as the project page shows it: no permalink anchor on any heading, each anchor's id
 * moved onto its heading, and no leading heading that repeats the repository's name (spec 044).
 * @param html GitHub's rendered README, images already rewritten (spec 037)
 * @param repoName the repository's name @returns the HTML to render
 */
export function tidyReadme(html: string, repoName: string): string
```

Private helpers in the same module: `textOf(html): string` (tags stripped, entities decoded,
so link text counts and `alt` does not) and `sameName(a, b): boolean` (lowercase, drop every
character outside `\p{L}\p{N}`, equal and non-empty). No clock, no DOM.

## 4. Algorithm

GitHub's shape today, read from `/proyectos/Portfolio`:
`<div class="markdown-heading" dir="auto"><h1 class="heading-element" dir="auto">Portfolio</h1><a id="user-content-portfolio" class="anchor" aria-label="Permalink: Portfolio" href="#portfolio"><svg class="octicon octicon-link">…</svg></a></div>`.
No README heading carries an `id` itself; the id is the anchor's.

```
ANCHOR = <a\b[^>]*\bclass="anchor"[^>]*>[\s\S]*?</a>
idOf(a) = a's id="…" or null

// RF-7, current shape: anchor right after its heading
html = replace /(<h([1-6])\b)([^>]*)>([\s\S]*?<\/h\2>)\s*(ANCHOR)/g
       → `${open}${attrs}${hasId(attrs) || !idOf(a) ? '' : ` id="${idOf(a)}"`}>${rest}`
// RF-7, older shape: anchor first inside its heading
html = replace /(<h([1-6])\b)([^>]*)>\s*(ANCHOR)/g → same, the anchor dropped
// an a.anchor nowhere near a heading is left alone

// RF-6, after RF-7 so the leading heading's id goes with it
m = first /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/ in html; if none → return html
if textOf(html.slice(0, m.index)).trim() !== '' → return html   // badges have no text
if !sameName(textOf(m[2]), repoName) → return html
[start, end] = [m.index, m.index + m[0].length]
if html before start ends in /<div class="markdown-heading"[^>]*>\s*$/ and html after end
   starts with /^\s*<\/div>/ → widen [start, end] over that wrapper
return html.slice(0, start) + html.slice(end)
```

The heading's image, if it had one, leaves with it; spec 037's indices are assigned before this
runs and the image route reads the raw README, so every other image keeps its number.

## 5. Interface

| State | Light and dark, both locales |
|---|---|
| 1280 | Band from the sheet's top to the header's bottom; breadcrumb, back button; tile · name · language badge on one row; the description under it at `--measure`, in `--text-secondary`. Below: sidebar and README at the cards' inset (131–1149). |
| 390 / 360 | The same stacked; the tile stays 48 px beside a name that wraps; the badge wraps under it when the row is full; body at 36–354 (36–324). |
| README opens with the name | No second "Portfolio"; the README starts at its badges. |
| README headings | No link icon anywhere; each heading keeps `id="user-content-…"`. |
| No README | Header as above; the body shows `project.readme.missing`, as today. |
| No description | The lead reads `project.meta.noDescription`. |
| Unavailable | Band, back button, tile beside `project.unavailable.title`, the message as the lead; no breadcrumb, no body. |
| `/proyectos` | Unchanged to the pixel: same header, now through `PageHeader`. |

## 6. Decisions

- **D-1 · Extract `PageHeader.astro`; slots for the title and what goes above and below.** The
  callers keep their own `h1` (two-tone on `/proyectos`, `transition:name` here) and its scoped
  style, since slotted markup carries the caller's scope. *Discarded:* the header classes moved
  to `03-components.css` with the markup copied, which AGENTS' DRY rule sends to a component;
  and a `title` string prop, which would pull the gold-word parsing and the `transition:name`
  into the component.
- **D-2 · `transition:animate='none'` stays on the component's header, for both routes.** Spec 040
  needs it on `/proyectos` (`e2e/project-filters.spec.ts` line 120); here it makes the header
  hold still while the `h1` travels. *Discarded:* an `animate` prop, an option no requirement asks
  for. The owner's visual review is where a snap would show.
- **D-3 · The gutter is the `section` class on the body.** One source for the 1rem inset Home and
  the `/proyectos` cards use. *Discarded:* `padding-inline: 1rem` in the page's style, a second
  copy of `04-layouts.css`; and moving the header into the inset too, which would put it 16 px
  off the `/proyectos` header RF-3 measures against.
- **D-4 · Tidy the README in the consumer, `Readme.astro`, with the helper in `github.ts`.**
  `getReadme` also feeds `readme.json` and the cache tests, which keep GitHub's HTML. *Discarded:*
  inside `getReadme`, which changes an API response nobody asked to change.
- **D-5 · Drop the anchor and move its id; do not hide it with CSS.** A `display: none` anchor
  keeps its id but a fragment to it does not scroll. *Discarded:* the CSS rule.
- **D-9 · The body's `class` keeps `grid` first (`grid section`).** `e2e/dark-glows.spec.ts` keys
  each `section` by its first class, and its recorded `grid#1` then holds. *Discarded:* re-recording
  the keys, churn in a spec 009 guard for no visible change; if the structure has to change, the
  keys change in the same task and the asserted value does not.
- **D-6 · Remove the leading heading, not hide it.** *Discarded:* `hidden`, which leaves a second
  `h1` in the accessibility tree's source and an id a fragment cannot reach anyway.
- **D-7 · Drop `id='project-desc'` and the body's `aria-describedby`.** The description is the
  header's lead now, and a description on an unnamed `section` (generic role) is not announced.
  *Discarded:* a `leadId` prop to keep both.
- **D-8 · Regex over GitHub's HTML, no parser.** The HTML is GitHub-sanitised and the owner's own
  (`Readme.astro`'s note) and constitution 1 allows no parser dependency. *Discarded:* a DOM
  library.

## 7. Test strategy

Runners from `package.json`: `npm test` (`vitest --run tests`) and `npm run test:e2e`
(Playwright, server on 4329).

- **Data** (`tests/readme-headings.test.ts`): fixtures in GitHub's current shape and the older
  one — first heading "My App" with repo `my-app` (removed, wrapper too); "My App — a tool"
  (kept); a badge paragraph before "My App" (removed); `# [My App](…)` and `<img alt="x"> My App`
  (removed); text before the heading (kept); no headings and `''` (unchanged); every anchor gone,
  each id on its heading; an `<img>` later in the README unchanged byte for byte.
- **Rendered, vitest** (`tests/project-page.test.ts`, `AstroContainer`, fetch stubbed as
  `tests/project-card.test.ts` does): per locale, the header's lead equals the repository's text
  and, with `description: null`, the locale's fallback (RF-4); no heading ends with ":" and
  `project.meta.description` is absent from both locale files (RF-4); headings outside
  `.readme-body` step at most one level (RF-5); with the "My App" README exactly one heading named
  `my-app`, the `h1`, and with "Usage" first it shows (RF-6); each source anchor id is on its
  heading in the output (RF-7); a 404 README still renders the header; a 500 renders the
  unavailable header (tile, `h1`, message as lead).
- **Rendered, Playwright**: `e2e/projects-header.spec.ts` looped over both routes — RF-1 tile,
  mask, fill, ink, 3:1, both themes, 1280 and 390; RF-2 band box at 1280 and 390 and
  `worstOverBackground` with the project page's targets (crumbs, `a.back-btn` text and border,
  `h1`, `.lang`, `.page-header__lead`, topbar controls). `e2e/project-page.spec.ts` — RF-3 at 360,
  390, 800, 1280: header l/r equal `/proyectos`'s header, body's outermost children l/r equal
  `.projects-grid`'s, within 1 px; RF-4 the lead inside `.page-header`, below the `h1`,
  `max-width` equal to `--measure` resolved; RF-6 on `/proyectos/Portfolio` one visible heading
  named "portfolio", and on `/proyectos/XDextX` its README's first heading visible; RF-7 at 390
  and 1280 no `.readme-body .octicon-link` or `a.anchor`, every README heading with an
  `id^="user-content-"`; at 360, a long name injected into the `h1` wraps while the tile stays
  48×48 and left of it. Measure after a 400 ms settle; confirm the scoped sheet is loaded.
- **Injections:**
  1. Tile after the `h1` in `PageHeader` → RF-1 red on both routes.
  2. `HeroBackground` removed from `PageHeader` → RF-2 band box red.
  3. Grid left inside `<header>` → RF-2 band bottom red on the project page.
  4. `section` class dropped from the body → RF-3 red at every width.
  5. The `h3` "Descripción:" block restored → RF-4 and RF-5 red in vitest.
  6. `sameName` without normalising → RF-6 data red on `my-app` / "My App".
  7. Text-before check dropped → the "text before the heading" fixture red.
  8. Anchor removed without moving its id → RF-7 id checks red (vitest and e2e).
  9. `tidyReadme` not called in `Readme.astro` → RF-6 and RF-7 rendered red.

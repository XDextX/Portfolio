# Plan 040 — Category filters on the projects page

**Spec:** `specs/040-project-category-filters/spec.md` (5 RF).
**Status:** approved
**Approved:** 2026-10-18 · owner approval with the spec · 71 lines
**Changed:** 2026-10-18 · at the visual review: view transitions refined (RF-6 to RF-9), the topbar's own group, the scroll kept, the theme carried across the swap; table.svg for Base de datos

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 (seven links) | `src/data/projectCategories.ts`: the six keys in order, each with its topic (`other` has none), locale key and glyph; `ProjectFilters.astro` renders Todos plus the six. |
| RF-2 (filtered list) | `categoryOf(repo)` and `inCategory(repo, key)` in `src/pages/lib/github.ts`; `/proyectos` reads `Astro.url.searchParams.get('cat')` and filters before `ProjectsSection`. |
| RF-3 (current marked) | The matching link gets `aria-current="page"`; `[aria-current]` styles on the accent surface; the others take `.btn-action`'s bordered rest. |
| RF-4 (empty category) | `ProjectsSection` already renders a message for an empty list; a `projects.empty.category` key replaces the topic message when a filter is set. |
| RF-5 (unknown key) | `parseCategory(cat)` returns null for anything but the six; null means Todos. |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/data/projectCategories.ts` | create | The category list (content: constitution 5). |
| `src/pages/lib/github.ts` | modify | `parseCategory`, `inCategory`. |
| `src/components/ProjectFilters.astro` | create | The row of links. |
| `src/components/ProjectsSection.astro` | modify | The empty-category message. |
| `src/pages/proyectos/index.astro` | modify | Reads `cat`, filters, renders the row in the header. |
| `i18n/locales/es.json`, `en.json` | modify | Seven labels, the empty-category message. |
| `public/icons/ui/layout-grid.svg`, `world.svg`, `device-mobile.svg`, `dots.svg`, `NOTICE.md` | create | Tabler v3.49.0 glyphs (standing OK for icons). |
| `tests/project-categories.test.ts` | create | RF-2, RF-4, RF-5 through the Container with the list stubbed. |
| `e2e/project-filters.spec.ts` | create | RF-1, RF-3 rendered. |

## 3. Pure logic

`parseCategory(value)`, `inCategory(repo, key)`: `other` is true when the repo carries none of the
five topics.

## 4. Algorithm

```astro
const cat = parseCategory(Astro.url.searchParams.get('cat'));
const shown = cat ? repos.filter((r) => inCategory(r, cat)) : repos;
<ProjectFilters current={cat} />   <!-- inside the header -->
<ProjectsSection repos={shown} emptyKey={cat ? 'projects.empty.category' : undefined} … />
```

## 5. Interface

| Width | Light and dark |
|---|---|
| 1280 | seven pills on one row under the line, Todos gold when current |
| 390 | the row wraps to two or three lines |

## 6. Decisions

- **D-1 · Plain topics.** `web`, `backend`, … are what the owner types on GitHub. *Discarded:* a
  prefix (`cat-web`), which reads badly on GitHub's own page.
- **D-2 · Always seven filters.** *Discarded:* hiding empty ones, which leaves only Todos and Otros
  today and makes the row jump as topics are added.

## 7. Test strategy

Runner from `package.json`: `npm test` and `npm run test:e2e`.

- **Unit**: `parseCategory` and `inCategory` cases; the page rendered through the Container with a
  stubbed list for each `cat`, the cards rendered, the empty message, the unknown key.
- **Rendered**: the seven links, hrefs, labels per locale, glyph masks aria-hidden; one
  `aria-current`, its ink at 4.5:1 on the accent surface, the others' borders at 3:1, per theme;
  no horizontal scroll at 360 px.
- **Injections:** (1) a link without its glyph → RF-1; (2) `other` matching every repo → RF-2;
  (3) two links current → RF-3; (4) the empty message removed → RF-4; (5) an unknown key
  filtering to nothing → RF-5.

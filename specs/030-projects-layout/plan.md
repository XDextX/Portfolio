# Plan 030 — Projects section arranged like the proposal

**Spec:** `specs/030-projects-layout/spec.md` (7 RF).
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 92 lines
**Changed:** 2026-10-17 · at implementation: the spec 017 and 009 guards that measured the show-more toggle now measure the "Ver todos" link; spec 014's home card count expects four; the markup scanner's childNodes sample became a fixture; the toggle's data-projects attributes went with their reader

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 (header row) | `ProjectsSection` renders, when it shows a preview, a header: `SectionTitle`, the line (`projects.lead`) and a `.btn-action` link to /proyectos (`projects.viewAll`); a flex row that wraps below a container width. |
| RF-2 (four, no toggle) | The section renders `repos.slice(0, preview)`; `ProjectsFooter`, the toggle script and `showMore`/`showLess` go. |
| RF-3 (four per row, equal heights) | `.projects-grid` becomes `repeat(auto-fill, minmax(min(14rem, 100%), 1fr))`; cards stretch to the row (grid default) and lay out as a column with the actions pushed to the bottom. |
| RF-4 (badge top-right, compact placeholder) | `.card-lang` moves to `inset-block-start` / `inset-inline-end`; `.card-media` height 5.5rem (88px). |
| RF-5 (equal actions with marks) | `.card-actions` a grid `repeat(auto-fit, minmax(0, 1fr))`; "Código" gets the existing `/icons/ui/brand-github.svg` mask, "Demo" keeps its arrow. |
| RF-6 (name in ink) | `.card-title a` colour `--text-color`. |
| RF-7 (no date) | The `<time class="card-date">` and its `Intl.DateTimeFormat` go; stars and forks stay (shown only above zero, as today). |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/components/ProjectsSection.astro` | modify | Heads the home preview and lays out the cards; no toggle. |
| `src/components/ProjectsFooter.astro` | delete | — |
| `src/components/ProjectCard.astro` | modify | Badge corner, compact placeholder, ink name, equal actions with marks, no date. |
| `i18n/locales/es.json`, `en.json` | modify | `projects.lead` added; `projects.showMore` / `showLess` removed. |
| `tests/viewtransitions.test.ts` | modify | The two toggle assertions retired. |
| `e2e/primary-button.spec.ts` | modify | The "Ver todos" consumer entry goes; discovery stays. |
| `public/styles/03-components.css` | modify | `.btn-action.primary` and its hover deleted (no reader left). |
| `e2e/projects-layout.spec.ts` | create | RF-1 to RF-7, rendered. |

## 3. Pure logic

None.

## 4. Algorithm

```html
<!-- ProjectsSection, when preview is set and the title shown -->
<header class="projects-head">
  <SectionTitle section="projects" />
  <p class="projects-lead">{t('projects.lead')}</p>
  <a class="btn-action projects-all" href="/proyectos">{t('projects.viewAll')} <svg arrow aria-hidden/></a>
</header>
```

```css
.projects-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-3) var(--sp-6); margin-bottom: var(--sp-4); }
.projects-lead { flex: 1 1 18rem; margin: 0; font-size: var(--fs-sm); color: var(--text-secondary); max-width: var(--measure); }
.projects-all  { margin-inline-start: auto; }
.projects-grid { grid-template-columns: repeat(auto-fill, minmax(min(14rem, 100%), 1fr)); }
.project-card  { display: flex; flex-direction: column; } .card-footer { margin-top: auto; }
.card-media    { block-size: 5.5rem; }  .card-lang { inset-inline: auto 0.6rem; inset-block-start: 0.6rem; }
.card-actions  { display: grid; grid-template-columns: repeat(auto-fit, minmax(0, 1fr)); gap: var(--sp-2); }
.card-actions .btn-action { justify-content: center; }
```

Copy, approved with the owner on 2026-10-17 from the mockup: es «Una selección de proyectos
personales donde aplico diferentes tecnologías y exploro nuevas ideas.»; en "A selection of
personal projects where I apply different technologies and explore new ideas."

## 5. Interface

| Width | Light and dark |
|---|---|
| 1280 | title · line · Ver todos → on one row; four equal cards: 88px placeholder with logo, badge top-right; ink name; description; topics; Código and Demo side by side |
| 800 | header wraps (link under the line); cards two or three per row |
| 390 | header stacks; one card per row |

## 6. Decisions

- **D-1 · `.btn-action` for "Ver todos".** *Discarded:* the gold primary button it is today — the
  mockup draws an outlined button, and a primary fill in the header would compete with the title.
- **D-2 · `brand-github.svg` for "Código".** *Discarded:* the colour GitHub logo — UI marks are
  masks in `currentColor` (AGENTS), and that glyph already means GitHub in the hero.
- **D-3 · Render four, not hide the rest.** *Discarded:* keeping all repos in the DOM with
  `display: none` — with no toggle they would be markup nobody can reach.

## 7. Test strategy

Runner from `package.json`: `npm test` and `npm run test:e2e`.

- **Rendered** (`e2e/projects-layout.spec.ts`): RF-1 at 1280 and 390 (row, order, link target,
  line text per locale); RF-2 card count and no toggle; RF-3 on / and /proyectos at 1280 (row
  tops, equal heights); RF-4 badge corner and placeholder height; RF-5 action widths against the
  content width, marks, aria-hidden; RF-6 name colour against `--text-color` resolved on the page
  and contrast per theme; RF-7 no `time` in any card.
- **Kept:** spec 014's `e2e/project-cards.spec.ts` and `tests/project-card.test.ts`.
- **Injections:** (1) the header link moved below the grid → RF-1 red; (2) all repos rendered →
  RF-2 red; (3) the grid back to `minmax(280px, 1fr)` → RF-3 red; (4) the badge back top-left →
  RF-4 red; (5) the actions back to a flex row → RF-5 red; (6) the name back to gold → RF-6 red;
  (7) the date back → RF-7 red.

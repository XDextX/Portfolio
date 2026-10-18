# Spec 040 — Category filters on the projects page

**Status:** implemented
**Size:** M
**Approved:** 2026-10-18 · one clarify round, minor findings applied; approved with its plan and tasks · 77 lines
**Implemented:** 2026-10-18 · owner visual approval · commits 3951184, d33a1f5, 219ff4b
**Changed:** 2026-10-18 · owner, at the visual review: the filter change felt abrupt; option A of three (smooth the navigation's view transitions, no client script) adds RF-6 to RF-9. A first RF-9 kept the row in view with a `#filtros` anchor; filmed, the anchor made the router scroll (48–260px) and doubled the topbar mid-transition, so RF-9 now keeps the page still: the filters sit in the first screen, where whoever clicks them already is. Filmed again, the band's header group painted over the topbar mid-transition, so the topbar takes its own `layout-topbar` group, not animated, raised with `z-index: 1` (BaseLayout and `03-components.css`); the cards share `view-transition-class: project-card` instead of one name each. At the next review the owner hit scroll jumps: the router scrolls to the top on every new URL, and the first RF-9 only tested from the top. Option A's "no client script" gives way to a script in ProjectFilters that restores `scrollY` in `astro:after-swap` and, when the chosen category is too short, stretches the sheet so the browser does not clamp it (owner chose the stretch). Then a white flash in dark: the router copies <html>'s attributes from the new page, which carries no `data-theme`, so the body painted light and faded back on every navigation; ThemeSwitch now carries the theme onto the new document in `astro:before-swap`.

## Context and goal

The design proposal for /proyectos (2026-10-18) puts a row of filters under the header: Todos,
Web, Backend, Frontend, Móvil, Base de datos, Otros, each with a glyph, the current one in gold.
No repository carries a category today: measured the same day, the 16 listed repositories have
only the `portfolio-proyect` topic or none, and 10 have no language. Decided with the owner on
2026-10-18: the category comes from GitHub topics the owner adds (`web`, `backend`, `frontend`,
`mobile`, `database`); a repository with none of them is «Otros»; each filter is a link,
`/proyectos?cat=<key>`, rendered by the server — it works without JavaScript, can be shared and
the back button returns to the previous filter. The cards stay as they are.

## Actors

Visitors browsing /proyectos; the owner, who tags repositories on GitHub.

## Requirements (EARS)

- RF-1: THE SYSTEM shows the seven filters under the header, each a link with its glyph and its
  label in the visitor's locale. — **Check:** seven links in order, hrefs `/proyectos` and
  `/proyectos?cat=web|backend|frontend|mobile|database|other`, labels from the locale files, each
  glyph an aria-hidden mask from `public/icons/ui/`.
- RF-2: WHEN a filter is chosen, THE SYSTEM renders only the repositories of that category: those
  carrying its topic, or for «Otros» those carrying none of the five. — **Check:** with the list
  stubbed (repositories tagged web, backend+database, none), each `?cat=` renders exactly the
  expected cards; «Todos» renders all.
- RF-3: THE SYSTEM marks the current filter for sight and for assistive tech. — **Check:** exactly
  one link carries `aria-current="page"`, the one matching `cat` (or Todos without it); it rests on
  the accent surface with its ink at 4.5:1; the others rest as bordered controls (spec 017).
- RF-4: WHEN a category has no repository, THE SYSTEM says so instead of an empty grid. — **Check:**
  a filter with no match renders the locale's empty-category message and no card.
- RF-5: WHEN `cat` is not one of the six keys, THE SYSTEM renders every repository with «Todos»
  current. — **Check:** `?cat=unknown` renders the full list and marks Todos.
- RF-6: WHILE the filter changes, THE SYSTEM keeps the header and the filter row still. — **Check:**
  the header carries `transition:animate="none"` as rendered (`data-astro-transition-scope` with no
  animation) and its box is the same before and after a filter click.
- RF-7: WHILE the filter changes, THE SYSTEM moves the cards that stay to their new place and fades
  the ones that leave or arrive. — **Check:** every card keeps its `transition:name` across filters;
  the stylesheet in the document holds a rule for the cards' old and new view-transition images
  with a fade, inside `prefers-reduced-motion: no-preference`.
- RF-8: WHILE the filter changes, THE SYSTEM slides the gold mark from the old filter to the new one.
  — **Check:** exactly one element, the current filter's, has the view-transition name
  `project-filter-current`, on every filter.
- RF-9: WHEN a filter is chosen, THE SYSTEM keeps the page where it is. — **Check:**
  at 1280×640, from `scrollY` 0 and from 200, choosing Backend (empty, shorter than the window) and then Todos leaves `scrollY` and the row's top where they were after each swap.

## Non-functional requirements

- `canonical` stays `/proyectos` for every filter (spec 034 composes it from the path alone).
- Glyphs: one meaning each (AGENTS). Backend, Frontend and Base de datos reuse the skills areas'
  `server`, `layout` and `table` (`database.svg` already means process step 3); Todos, Web, Móvil and Otros take Tabler `layout-grid`, `world`,
  `device-mobile` and `dots` (v3.49.0, recorded in the NOTICE).
- The row wraps on narrow widths; nothing scrolls sideways at 360 px.
- The filters are plain links under `<ClientRouter />` and work without a script; one script only keeps the scroll (RF-9).
- The filters sit inside the header of spec 039, so its band reaches down to them.
- RF-2, RF-4 and RF-5 are settled on the page rendered through the Container with the GitHub list
  stubbed, as the project-page tests already do: the live list carries no category, and the e2e
  server takes no test seam (owner, spec 032).

## Edge cases

- A repository with two category topics shows under both — RF-2.
- Topic case: GitHub lowercases topics, compared as given — RF-2.
- Today no repository is tagged: every filter but Todos and Otros shows the empty message until the
  owner adds topics — RF-4.

## Guards this changes (AGENTS: never silently)

- None expected.

## Out of scope

- Counts per filter, multi-select, sorting; the home preview; the cards.

## Done when

`npm test` and `npm run test:e2e` green; each new guard shown red by injection; the filters seen in
light and dark at 1280, 800 and 390 px beside the proposal, stopping for the owner's visual
approval.

## Open questions

None.

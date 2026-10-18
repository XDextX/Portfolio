# Plan 041 — Return to where you left

**Spec:** `specs/041-return-to-origin/spec.md` (6 RF).
**Status:** approved
**Approved:** 2026-10-18 · owner approval · 111 lines
**Changed:** 2026-10-18 · §4 before-preparation listener is one stable handler without `once` (a re-armed once-listener left a ~500 ms gap after a swap that failed RF-1 at 390 px); the inner after-swap stays `once`; §4 fallback reads `querySelector('[id="…"]')` with `CSS.escape`, as the code does (`tests/viewtransitions.test.ts` bans `getElementById`); §4 each before-preparation first disarms a superseded navigation's pending restore, then arms its own named one; §7 injections 7 (re-armed once-listener) and 8 (no disarm) · 117 lines

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 (origin in view, focused) | `ReturnToOrigin.astro` records the followed link on leaving and, on a return, centres it with `scrollIntoView({ block: 'center' })` and focuses it with `preventScroll`. |
| RF-2 (section, then top) | The record carries the origin's section heading id; `findTarget` falls back to that heading (the page's `h1` when the record has none), then to nothing, which leaves the router's top. |
| RF-3 (no frame at the top) | The restore runs in `astro:after-swap`, inside the view transition's update, before the new view is captured — the technique spec 040 RF-9 proved. |
| RF-4 (back and forward) | Traverse navigations neither record nor restore; the router's own history state decides. |
| RF-5 (no origin, top) | No record for the destination's path → nothing runs. Storage that throws counts as no record. |
| RF-6 (filters untouched) | `isLeaving(from, to)` is false when only the query changes, so a filter or the language switch neither records nor restores. |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/utils/returnOrigin.ts` | create | Pure rules: what counts as leaving, the storage key, reading a record back without trusting it. |
| `src/components/ReturnToOrigin.astro` | create | The client script, no markup: records on leaving, restores on returning. |
| `src/layouts/BaseLayout.astro` | modify | Renders `<ReturnToOrigin />` once, so every page records and restores. |
| `tests/return-origin.test.ts` | create | The pure rules as data. |
| `e2e/return-to-origin.spec.ts` | create | RF-1 to RF-6, the NFRs and the storage edge case, rendered. |

## 3. Pure logic

```ts
/** A link leaves the page when it reaches another path on this site; a query change does not. */
isLeaving(from: URL, to: URL): boolean            // same origin && from.pathname !== to.pathname

/** The sessionStorage key a page's origin lives under. */
originKey(pathname: string): string               // `return-origin:${pathname}`

interface OriginRecord { href: string; index: number; heading: string | null }

/** A stored record, or null when it is missing, malformed or the wrong shape. */
parseOrigin(raw: string | null): OriginRecord | null
```

Nothing reads the clock or the DOM; the DOM parts stay in the component, covered by e2e.

## 4. Algorithm

```ts
// One stable named handler, added from every astro:page-load without `once`: re-adding the same
// function is a no-op, so it stays one listener. A once-listener re-armed on page-load is dead
// between a swap and its page-load, and a click in that gap (~500 ms) failed RF-1 at 390 px.
on astro:before-preparation (e):
  disarm()  // first, before any return: a superseded navigation's restore must not fire on this one
  if e.navigationType === 'traverse' || !isLeaving(e.from, e.to) || e.to.hash: return  // a hash scrolls itself
  link = e.sourceElement?.closest('a[href]')
  if link:
    href = link.getAttribute('href')
    index = [...document.querySelectorAll(`a[href="${CSS.escape(href)}"]`)].indexOf(link)
    heading = link.closest('section[aria-labelledby]')?.getAttribute('aria-labelledby') ?? null
    trySet(originKey(e.from.pathname), JSON.stringify({ href, index, heading }))
  record = parseOrigin(tryGet(originKey(e.to.pathname)))
  if record:
    on astro:after-swap, { once: true }, named restore; disarm = remove that restore:
      origin = document.querySelectorAll(`a[href="${CSS.escape(record.href)}"]`)[record.index]
      target = origin ?? (record.heading ? document.querySelector(`[id="${CSS.escape(record.heading)}"]`) : document.querySelector('main h1'))
      if target:
        target.scrollIntoView({ block: 'center', behavior: 'instant' })
        origin?.focus({ preventScroll: true })
```

`trySet` / `tryGet` wrap `sessionStorage` in `try/catch`: a blocked storage records nothing and
returns null. A modifier or middle click never reaches the router, so it never records.

## 5. Interface

Nothing new is drawn. On a return the page opens with the origin centred (or its heading, or the
top) in light and dark alike; the focus ring follows the browser's `:focus-visible` heuristic, as
the spec asks. Without a script, every link lands at the top, as today.

## 6. Decisions

- **D-1 · Remember the followed link, not a fixed anchor.** *Discarded:* `href="/#projects-title"`
  on "Inicio", which cannot know which card the visitor opened and puts the heading at 0 px, cut
  by the sheet's edge (measured).
- **D-2 · Identify the origin by `href` and its occurrence index.** *Discarded:* its text, which
  the language switch changes, and an id, which AGENTS forbids as a JS hook.
- **D-3 · `sessionStorage`, keyed by path.** *Discarded:* a module variable, which a reload of
  another page loses although the spec counts that return; `localStorage`, which outlives the tab.
- **D-4 · Keep the record after use.** The next leaving link overwrites it. *Discarded:* consuming
  it on return, which buys nothing the spec asks for and would make a second "Inicio" land
  elsewhere than the first.
- **D-5 · `scrollIntoView({ block: 'center' })`.** *Discarded:* computing the offset by hand,
  which the platform already does, viewport size included (edge case: resized window).

## 7. Test strategy

Runners from `package.json`: `npm test` (vitest over `tests`) and `npm run test:e2e` (Playwright).

- **Unit:** `isLeaving` for another path, a query-only change, a hash-only change and another
  origin; `parseOrigin` for null, invalid JSON, a missing field and a valid record.
- **Rendered**, choosing links by position rather than by repo name so the GitHub list does not
  matter (clarify: data source): Home → the second "Ver todos" → "Inicio"; Home → the first card
  → "Inicio"; `/proyectos` → the last card → each "Volver a proyectos" in turn; at 1280×800 and
  390×800, in both themes for one journey. RF-2 by rewriting the stored record (index out of
  range, then heading unknown) before returning (clarify: removing the origin). RF-3 by sampling
  `scrollY` every frame, under `prefers-reduced-motion` both ways. RF-4 back once, then back and
  forward after a return. RF-5 in a fresh context. RF-6: spec 040's RF-9 tests plus no
  `return-origin:` key written by a filter click. NFRs: no request during a return carries the
  record; with JavaScript disabled "Inicio" opens at the top. Storage edge: `sessionStorage`
  methods that throw, no `pageerror`, `scrollY` 0.
- **Injections:** (1) drop the `focus` call → RF-1; (2) drop the fallback → RF-2; (3) restore in
  `astro:page-load` instead of `astro:after-swap` → RF-3 (a frame at 0; rAF cannot see the
  router's same-task scroll, clarify); (4) restore on traverse too → RF-4; (5) `isLeaving` true
  on a query change → RF-6; (6) storage without `try` → the storage edge case; (7) re-arm the
  before-preparation listener with `{ once: true }` on each page-load → RF-1 red on a click right
  after a swap at 390 px (the 390 px `/proyectos` → last card test is the one that caught it); (8) drop the `disarm()` call → a superseded "Inicio" restores on
  `/proyectos` (the e2e "a superseded navigation restores nothing on the page that replaced it").

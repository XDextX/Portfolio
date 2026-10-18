# Spec 041 — Return to where you left

**Status:** implemented
**Size:** L
**Approved:** 2026-10-18 · one clarify round, 11 minor findings applied · 90 lines, 6 RF
**Implemented:** 2026-10-18 · commits `7e97240` (rules), `8d0d438` (record and restore) · 3/3 tasks, `npm test` 299/299, e2e 234/234 · 6/6 RF, NFRs and edge cases validated by the SDD reviewer in two rounds; injections 1–8 red; 12 returns filmed (light and dark at 1280 and 390), owner visual approval
**Changed:** 2026-10-18 · at planning: RF-6's check named a focus the router's swap replaces; it now checks that no origin is recorded and focus is left to the router · 92 lines, 6 RF

## Context and goal
Following "Inicio" from the projects page lands at the top of Home, 2004 px above the projects
section the visitor left from (measured at 1280×800); the browser's back button already returns
to the right place (1617 → 1617). The owner's rule is general: when a link takes the visitor from
one page to another and a link later brings them back, the page they return to shows the element
they left from, focused. Today the router lands every link at the top.

## Definitions
- **Leaving link:** a link the visitor follows from page A to a different page (a different path;
  a change of query alone, such as a project filter or the language switch, is not leaving, and the
  origin survives it). A link opened in another tab or window is not leaving this tab.
- **Returning:** reaching A again by following a link, from any page. Back and forward are not
  returning: the router already restores their position.
- **Origin:** the leaving link the visitor last followed from A, in this tab. It lasts as long as the
  tab, so a return after a reload of another page is still a return.

## Actors
A visitor moving between Home, `/proyectos` and a project page.

## User stories
- US-1: As a visitor who opened a project from Home, I want "Inicio" to bring me back to that
  project's card so that I keep my place instead of scrolling down again.
- US-2: As a keyboard visitor, I want focus on the link I left from so that Tab continues from
  there, not from the top of the page.

## Requirements (EARS)
- RF-1: WHEN the visitor returns to a page, THE SYSTEM shows that page with its origin fully inside
  the viewport and focused; the focus ring shows as for any other focus, not forced after a click. — **Check:** at 1280×800 and 390×800: Home → "Ver todos" → "Inicio",
  Home → the Portfolio card → "Inicio", and `/proyectos` → a card below the first screen → either "Volver
  a proyectos" link each end with the origin's box inside the viewport and `document.activeElement` the
  origin.
- RF-2: IF the origin is no longer on the page, THEN THE SYSTEM shows the section it belonged to,
  with that section's heading fully inside the viewport (on `/proyectos`, whose list has no heading of
  its own, the page heading); IF the section is gone too, the page opens
  at the top. — **Check:** with the origin's link removed from the returning page, the section
  heading is in view; with both removed, `scrollY` is 0.
- RF-3: WHEN the visitor returns, THE SYSTEM paints the page at its final position from the first
  frame, never at the top first. — **Check:** `scrollY` sampled every frame across the return holds
  only the leaving page's value and the final one.
- RF-4: WHEN the visitor goes back or forward, THE SYSTEM keeps the router's restored position,
  including on an entry a return created. — **Check:** Home scrolled to the projects section →
  "Ver todos" → back leaves `scrollY` where it was; after a return, back then forward ends where the
  return put it.
- RF-5: WHEN the visitor reaches a page by a link without having left it before in this tab, THE
  SYSTEM opens it at the top, as today. — **Check:** a fresh tab: `/proyectos` → "Inicio" ends at
  `scrollY` 0.
- RF-6: WHEN the visitor changes a project filter, THE SYSTEM keeps spec 040's behaviour: the page
  stays where it is and no origin is recorded or used. — **Check:** spec 040's RF-9 checks stay
  green; `/proyectos` → Backend → Todos records no origin and
  moves focus nowhere the router would not.

## Non-functional requirements
- Nothing about the visitor leaves the browser, and what is remembered lasts as long as the tab. —
  **Check:** no request made during a return carries the origin.
- Without a script every link still works and lands at the top. — **Check:** with JavaScript
  disabled, "Inicio" from `/proyectos` opens Home at the top.
- No smooth scrolling: the page appears in place (RF-3), with or without a motion preference. —
  **Check:** RF-3's frame samples, run with `prefers-reduced-motion` both ways.

## Edge cases
- The same link twice on a page (Home's projects header has two `/proyectos` links): the one
  followed is the origin, not the first match (RF-1).
- The viewport changed size between leaving and returning: the origin is placed for the viewport
  at return time (RF-1).
- The project list changed, or a different filter is showing, and the card is gone: RF-2.
- The origin cannot be remembered (storage blocked): links behave as today, at the top (RF-5). —
  **Check:** with storage throwing, Home → "Ver todos" → "Inicio" ends at `scrollY` 0 with no error.
- A modifier or middle click opens a new tab: no origin is recorded in this tab.
- The language switch between leaving and returning: the origin is still found, whatever its label
  now reads (RF-1).
- A full page load (reload, a typed URL, a new tab) is not a return: the browser decides (RF-5).

## Out of scope
- External links, the CV PDF and in-page hash links.
- Restoring the filter that was showing when the visitor left `/proyectos`: "Volver a proyectos"
  links to all projects and stays that way.
- Focus after back or forward.
- "Inicio" dropping the `lang` query (it links to `/`).

## Done when
`npm test` and `npm run test:e2e` green; each new guard's injection red and restored; the three
returns of RF-1 seen in light and dark at 1280 and 390 px.

## Open questions
- none

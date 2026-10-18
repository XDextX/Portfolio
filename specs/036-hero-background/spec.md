# Spec 036 — A flat-shape background behind the hero and the social card

**Status:** implemented
**Size:** M
**Approved:** 2026-10-17 · one clarify round, one minor finding applied; approved with its plan and tasks · 85 lines
**Implemented:** 2026-10-17 · commits `d135111` (sheet frame), `4975cfb` (hero band), `8658899` (card band) · 4/4 tasks, `npm test` 262/262, e2e 175/175 · 5/5 RF, NFRs and edge cases validated (light and dark at 1280, 800 and 390, both cards, owner visual approval); 5 injections red

## Context and goal

The second design proposal (2026-10-17) sets the hero on a band of soft geometric shapes: pale
navy and pale gold tiles in the corners on the light page, deeper navy tiles and thin gold and
navy diagonals on the dark one. The owner brought a raster version of that art (2000×744 WebP,
345 KB, with texture and a bright blue line) and asked for it in flat colours. A draft redrawn
from the site's tokens was shown and accepted on 2026-10-17. Decided with the owner the same day:
this spec takes the background only — the phrase icons, the name on two lines and the band layout
of the other sections stay out.

The art is drawn by the site, not loaded: an inline SVG whose fills are theme tokens, so it follows
the theme toggle, weighs about a kilobyte and adds no file and no request. The navy diagonal is
`--brand-primary-light`, a step of the navy, so the canvas keeps navy and gold as its only chroma
(AGENTS). The same shapes, from one definition, sit behind the social cards of spec 033.

## Actors

- Visitors landing on the home page, in either theme.
- Anyone who sees a shared link's card.

## Requirements (EARS)

- RF-1: THE SYSTEM draws a band of flat shapes behind the top of the home page: from the sheet's
  top edge to the hero's bottom, across the sheet's full width, clipped to the sheet's rounded
  corners. — **Check:** at 1280 and 390 px the band's box matches the sheet's left, right and top
  and the hero's bottom within 1px; it is `aria-hidden` and takes no pointer events; its corners
  follow the sheet's radius; /proyectos renders no band.
- RF-2: THE SYSTEM fills every shape with a theme token, or a mix of two, and follows the theme
  toggle without a reload. — **Check:** each shape's computed fill equals the value of one of the
  tokens the shape definition names, or their `color-mix`, in each theme; after toggling light to
  dark the fills are the dark values.
- RF-3: THE SYSTEM keeps every text, icon and control boundary in the band at its contrast floor
  over the shapes: 4.5:1 for text, 3:1 for icons and control borders, at the worst pixel behind
  each. — **Check:** in both themes at 1280, 800 and 390 px, for each text, icon and bordered
  control in the band, the page is captured with the element hidden and every pixel of its box
  measured against its colour; the lowest ratio clears the floor.
- RF-4: THE SYSTEM draws the same shapes behind the avatar and the text of each social card, from
  the definition the hero uses, in the dark theme's values. — **Check:** the generator imports the
  shape definition (no copy of its numbers); each card's markup holds one shape per entry, filled
  with the dark tokens' values; the cards' text clears 4.5:1 over the shapes at the worst pixel.
- RF-5: THE SYSTEM leaves the hero's layout as it is. — **Check:** the boxes of the tile, the name,
  the phrases, the bio and the actions are the same with and without the band, within 1px.

## Non-functional requirements

- No image file, no new request, no dependency; the band is markup and CSS (constitution 1, 2).
- Spec 009 holds: the dark hero glow stays under the band, the band has no ground of its own.
- Spec 010 holds: the avatar is the hero's only picture — the band is decoration, not an image.
- Spec 033 holds for the cards: tokens only, `ABOUT` only, byte-identical across runs.
- AGENTS: no colour literal in the component or the definition; every `var(--x)` defined.

## Edge cases

- A phone: the band is shorter and narrower; the shapes keep to the corners rather than shrinking
  behind the text — RF-3 at 390 px.
- The language switcher and theme toggle sit in the band: their borders are controls — RF-3.
- Another page (/proyectos): no hero, so no band — RF-1 applies to the home page only.

## Guards this changes (AGENTS: never silently)

- None expected. If spec 010's "only picture" check counts inline SVG, it is narrowed to images and
  CSS backgrounds, with the band named as decoration, never relaxed for anything else.

## Out of scope

- Icons in the phrases, the name on two lines, the hero as a full-bleed band with section cards
  (owner, 2026-10-17).
- The raster WebP itself.

## Done when

`npm test` and `npm run test:e2e` green; each new guard shown red by injection; the band seen in
light and dark at 1280, 800 and 390 px beside the proposal, and both cards regenerated and seen,
stopping for the owner's visual approval.

## Open questions

None.

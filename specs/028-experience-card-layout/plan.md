# Plan 028 — Experience card arranged like the proposal

**Spec:** `specs/028-experience-card-layout/spec.md` (4 RF).
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 98 lines
**Changed:** 2026-10-17 · at implementation: injection 5 is the location placed over the title (the planned fixed chip column overflowed the card without overlapping anything); spec 013 RF-3 also widened to accept an icon inside the aria-hidden tile

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 (icon tile before role and company) | §4: a `.exp-tile` holding the existing `.exp-company__icon`, in the header's first column. |
| RF-2 (icon ≥ 3:1 on its tile) | Tile filled with `--neutral-200`, icon kept in `--icon-mono`: 4.74:1 light, 3.49:1 dark (measured 2026-10-17). spec 013's RF-6 icon guard reads the tile as the ground. |
| RF-3 (location at the header's end) | A container query on the card: from a 36rem card the header becomes tile · title · location. |
| RF-4 (chips right of the bullets) | The same container: from a 44rem card the body becomes bullets · chips. |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/components/ExperienceCard.astro` | modify | Decides where each part of a job sits for the card's own width. |
| `e2e/experience-timeline.spec.ts` | modify | RF-1 to RF-4 and the no-overlap NFR, rendered; spec 013's RF-6 icon ground widened to the tile. |

## 3. Pure logic

None: markup and CSS.

## 4. Algorithm

```html
<article class="exp-card card-frame">              <!-- container: card / inline-size -->
  <header class="exp-header">
    <p class="exp-period">…</p>                    <!-- first in reading order (013 RF-2) -->
    <span class="exp-tile" aria-hidden="true"><span class="exp-company__icon" …></span></span>
    <div class="exp-title"><h3 class="exp-role">…</h3><span class="exp-company">…</span></div>
    <span class="exp-location">…</span>
  </header>
  <div class="exp-body"><ul class="exp-bullets">…</ul><ul class="exp-tech">…</ul></div>
</article>
```

```css
.exp-header { display: grid; grid-template-columns: 3rem 1fr; column-gap: 0.85rem; row-gap: 0.2rem;
              grid-template-areas: "period period" "tile title" ". location"; align-items: center; }
@container card (min-width: 36rem) {
  .exp-header { grid-template-columns: 3rem 1fr auto; grid-template-areas: "period period period" "tile title location"; }
  .exp-location { align-self: start; }
}
.exp-tile { grid-area: tile; inline-size: 3rem; block-size: 3rem; border-radius: var(--radius-md);
            background: var(--neutral-200); display: grid; place-items: center; }
.exp-tile .exp-company__icon { inline-size: 1.5rem; block-size: 1.5rem; }
.exp-body { display: flex; flex-direction: column; gap: 0.85rem; }
@container card (min-width: 44rem) {
  .exp-body { display: grid; grid-template-columns: 1fr minmax(12rem, 18rem); gap: 1.5rem; align-items: start; }
}
```

From 40rem the period is placed outside the card by the section (spec 027); its empty grid row
collapses. `container-type: inline-size` adds layout containment, which keeps the card as the
period's containing block, as `position: relative` already does.

Breakpoints measured on the card, not the viewport: at 1280 px the card is ~800px wide (both
rows side by side), at 800 px ~550px (stacked), at 390 px ~300px (stacked).

## 5. Interface

| Card width | Light and dark |
|---|---|
| ≥ 44rem | tile · role over company · location at the end; bullets left, chips in a right column |
| 36–44rem | header on one line; chips below the bullets |
| < 36rem | tile beside role and company, location below; bullets, then chips |

## 6. Decisions

- **D-1 · Container queries on the card.** *Discarded:* viewport media queries — the card's
  width depends on the rail and period columns (spec 027) and the sheet's gutter, so a viewport
  breakpoint would place the chips beside the bullets with too little room at some widths.
- **D-2 · The icon moves into the tile, out of the company line.** *Discarded:* keeping the small
  inline icon as well — two marks for one company (AGENTS: one glyph, one meaning).
- **D-3 · Tile in `--neutral-200`.** *Discarded:* the mockup's white tile — in dark a white square
  would be the brightest thing on the card; `--neutral-200` is the soft fill AGENTS reserves for
  inside the sheet.

## 7. Test strategy

Runner from `package.json`: `npm run test:e2e`; `npm test` stays green.

- **RF-1:** at 1280 and 390 px, per card: one `.exp-tile`, width = height ± 1 and ≥ 40px,
  containing `.exp-company__icon`, its right edge < role left and < company left, aria-hidden.
- **RF-2:** per theme, also after the theme toggle, icon colour (its mask fill) against the
  tile's background ≥ 3:1. Spec 013's RF-6 icon pair changes from the card to the tile.
- **RF-3:** at 1280, location right within 1px of the card's content right and vertically
  overlapping the role; at 390, location top ≥ company bottom.
- **RF-4:** at 1280, chips left ≥ bullets right and vertical overlap; at 390, chips top ≥
  bullets bottom.
- **NFR:** at 800 and 1024, the six boxes pairwise disjoint.
- **Injections:** (1) the tile removed (icon back inline) → RF-1 red; (2) the tile filled with
  `--icon-mono` → RF-2 red; (3) the header container query removed → RF-3 red; (4) the body
  container query removed → RF-4 red; (5) the body's chip column given a fixed 40rem → NFR red.

# Plan 027 — Timeline rail on the left, as in the proposal

**Spec:** `specs/027-timeline-rail-left/spec.md` (2 RF).
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 71 lines

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 (rail, period, card, left to right) | §4: from 40rem the item reserves the rail column then the period column; the period is placed in the second. |
| RF-2 (period level with its dot) | The period keeps `top: 1.25rem` (the card padding) and the dot `--dot-y`, both measured from the item top; the check holds them together. |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/components/ExperienceSection.astro` | modify | Decides the order of rail, period and card from 40rem. |
| `e2e/experience-timeline.spec.ts` | modify | RF-1 and RF-2, rendered at 1280 and 800 px. |

## 3. Pure logic

None: CSS only.

## 4. Algorithm

```css
@media (min-width: 40rem) {
    .exp-list { padding-inline-start: 0; }                       /* no period column before the rail */
    .exp-item { padding-inline-start: calc(var(--rail-col) + var(--period-col)); }
    .exp-item :global(.exp-period) {                             /* placed in the second column */
        position: absolute;
        inset-inline-start: var(--rail-col);
        inline-size: var(--period-col);
        top: 1.25rem;
        text-align: start;
    }
}
```

The dot and the rail stay where they are: positioned from the item's start inside
`--rail-col`, so the rail's geometry and its spec 013 guards do not move. The period's containing
block must be `.exp-item` (already `position: relative`); if the card is itself positioned, the
period would anchor to it, so T-2 confirms which box it anchors to before relying on the offset.
`text-align: start`, as in the mockup, where the period reads from the dot.

## 5. Interface

| Width | Light and dark |
|---|---|
| ≥ 40rem | dotted rail and gold dots at the left edge; "2022 - 2025" beside each dot; the card after |
| < 40rem | unchanged: rail at the left edge, period inside the card |

## 6. Decisions

- **D-1 · Move the period column after the rail, keep the rail where it is.** *Discarded:*
  moving the rail into the period column's place — every rail and dot offset is derived from
  `--rail-col` at the item's start and spec 013's guards measure exactly that geometry.
- **D-2 · Period aligned to the start.** *Discarded:* keeping `text-align: end` — beside the
  dot it would leave a gap between dot and text, unlike the mockup.

## 7. Test strategy

Runner from `package.json`: `npm run test:e2e`; `npm test` stays green.

- **RF-1, RF-2** (`e2e/experience-timeline.spec.ts`): at 1280 and 800 px, per job: dot box,
  period box, card box; dot right < period left, period right < card left; dot centre within the
  period's top and bottom.
- **Kept:** spec 013's RF-1, RF-2 and RF-8 guards, unchanged.
- **Injections:** (1) today's order back (period left of the rail) → RF-1 red; (2) the period's
  `top` moved by 2rem → RF-2 red.

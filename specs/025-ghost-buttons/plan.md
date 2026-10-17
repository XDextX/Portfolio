# Plan 025 — Ghost buttons readable in both themes

**Spec:** `specs/025-ghost-buttons/spec.md` (4 RF).
**Status:** approved
**Approved:** 2026-10-16 · owner approval with the spec · 85 lines

**Ordering.** `src/pages/proyectos/[name].astro` carries uncommitted work from 021 and 023.
Implementation starts once those are committed, so this spec's two class changes land in a
commit of their own.

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 (text ≥ 4.5:1) | §4: `.btn--ghost` has a transparent fill and `--brand-text` ink, so the text sits on the sheet or the card it is drawn over. |
| RF-2 (resting border ≥ 3:1) | `.btn--ghost` rests in `--control-border`, which spec 017 measured at 3:1 or more on the sheet and the card in each theme. |
| RF-3 (hover: accent border, nothing moves) | `.btn--ghost:hover` sets `--accent-text` on the border and cancels the base `.btn:hover` lift and shadow. |
| RF-4 (one class) | Both buttons on the project page use `btn btn--ghost`; the theme files' `.btn.ghost` rules go. |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `public/styles/03-components.css` | modify | Decides what an outline button looks like, at rest and hovered, beside `.btn--primary`. |
| `public/styles/themes/light.css`, `dark.css` | modify | Drop `.btn.ghost`: the tokens already change per theme. |
| `src/pages/proyectos/[name].astro` | modify | The back links (project view and unavailable state) use `btn--ghost`. |
| `e2e/ghost-buttons.spec.ts` | create | RF-1 to RF-4, rendered. |

## 3. Pure logic

None: CSS only.

## 4. Algorithm

```css
.btn--ghost {
    background: transparent;
    color: var(--brand-text);
    border: 1px solid var(--control-border);
}

.btn--ghost:hover {
    border-color: var(--accent-text);
    transform: none;
    box-shadow: none;
}
```

`--brand-text` is navy in light and gold in dark; the ink measured 6.66:1 in dark today and the
light value is the sheet's navy, so both clear 4.5:1 on a transparent fill. Moving the rule into
`03-components.css` drops specificity below the themes' `:root .btn.ghost`, which is why those
rules leave in the same change (AGENTS: re-check the computed value on every consumer).

## 5. Interface

| State | Light | Dark |
|---|---|---|
| Rest | navy text, grey control border, sheet/card behind | gold text, navy-step control border |
| Hover | border turns dark gold, nothing moves | border turns brand gold, nothing moves |
| Focus | the theme's focus ring, unchanged | same |

## 6. Decisions

- **D-1 · `btn--ghost` is the one name.** *Discarded:* keeping `ghost` — `btn--primary` is the
  existing modifier style, and `btn--ghost` is already in the markup.
- **D-2 · `--brand-text` for the ink.** *Discarded:* `--text-color` — the back link has always
  read as a brand-coloured link, gold in dark; only its fill was wrong.
- **D-3 · Cancel the lift on ghost hover only.** *Discarded:* removing it from `.btn` — every
  other button would change, which the spec leaves out.

## 7. Test strategy

Runner from `package.json`: `npm run test:e2e` (Playwright); `npm test` must stay green, its
tokens and visual-language guards included.

- **RF-1 to RF-3** (`e2e/ghost-buttons.spec.ts`): on a project page, per theme, for the back and
  code buttons: at rest, text against `__groundOf` the button itself (≥ 4.5:1) and border
  against `__groundOf` its parent (≥ 3:1); hovered after settling, the border equals the theme's
  `--accent-text` read from the root, text still ≥ 4.5:1, and `getBoundingClientRect()` equal to
  the resting one.
- **RF-4**: `document.querySelectorAll('.ghost:not(.btn--ghost)')` is empty and both buttons
  carry `btn--ghost`.
- **Injections:** (1) `.btn--ghost` without `background: transparent` → RF-1 red; (2) border in
  `transparent` → RF-2 red; (3) the hover keeps the lift → RF-3 red; (4) one back link back to
  `ghost` → RF-4 red.

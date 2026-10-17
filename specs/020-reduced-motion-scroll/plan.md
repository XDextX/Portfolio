# Plan 020 — Reduced motion stops smooth scrolling

**Spec:** `specs/020-reduced-motion-scroll/spec.md` (**approved**, 2 RF).
**Status:** approved
**Approved:** 2026-10-16 · owner approval of plan and tasks together · 71 lines

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 (no animation under reduced motion) | §4: the smooth rule applies only under `prefers-reduced-motion: no-preference`, so under `reduce` nothing sets it and the root stays `auto`. Rendered guard in §7. |
| RF-2 (unchanged without a preference) | The same rule, unchanged in what it does, now inside that media query: `auto` at rest, `smooth` with focus inside. Same guard. |

Measured on 2026-10-16: the root computes `smooth` with a field focused under both `reduce` and
`no-preference`, and `auto` at rest under both.

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `public/styles/01-base.css` | modify | Decides when the page scrolls with an animation: only when focus is inside the page and the visitor has stated no motion preference. |
| `e2e/reduced-motion.spec.ts` | create | Reads the root's computed `scroll-behavior` per preference, per theme, at rest and focused, and after switching the preference live. |

Untouched: the reduced-motion block in `00-tokens.css` (transitions, a different concern), every
component, and the e2e workarounds that force instant scrolling (D-2).

## 3. Pure logic

None: the browser evaluates the media query; there is no function to write.

## 4. Algorithm

```css
@media (prefers-reduced-motion: no-preference) {
    html:focus-within { scroll-behavior: smooth; }
}
```

`no-preference` rather than `not (reduce)`: a browser that cannot report the preference fails
the query and scrolls instantly, the safe side.

## 5. Interface

Without a preference: as today. With reduced motion: in-page links and focus jumps land at once.
Identical in light and dark; nothing is drawn differently.

## 6. Decisions

- **D-1 · Wrap the existing rule in `prefers-reduced-motion: no-preference`.** *Discarded:* a
  `reduce` block setting `html:focus-within { scroll-behavior: auto }` after the rule — two
  rules that must stay in step, and the override wins only by source order, which the next
  reorder breaks silently.
- **D-2 · Leave the e2e workarounds as they are.** `e2e/contact-form.spec.ts` sets the root's
  scroll inline and `e2e/experience-timeline.spec.ts` scrolls dots with `behavior: 'instant'`.
  *Discarded:* `reducedMotion: 'reduce'` for the whole suite — it also turns off every
  transition through `00-tokens.css`, changing what the hover and focus checks measure.
  Their comments stay true: without a preference, scrolling is still smooth.

## 7. Test strategy

Runner from `package.json`: `npm run test:e2e` (Playwright) for the rendered check; `npm test`
must stay green.

- **RF-1 and RF-2, rendered** (`e2e/reduced-motion.spec.ts`, on the e2e server): for each theme
  and each preference (`reduce`, `no-preference`), open `/`, read the root's computed
  `scroll-behavior` at rest, focus the contact form's first field and read it again. Expected:
  `auto`/`auto` under `reduce`, `auto`/`smooth` without a preference. Then, with the field still
  focused, switch to `reduce` live (`emulateMedia`) and expect `auto`. The stylesheet is
  confirmed in `document.styleSheets` before reading (AGENTS).
- **Injections:** (1) the rule back outside the media query → RF-1 red; (2) the rule deleted →
  RF-2 red; (3) the query inverted to `reduce` → both red.

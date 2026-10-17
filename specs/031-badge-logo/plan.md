# Plan 031 — The language logo inside the project badge

**Spec:** `specs/031-badge-logo/spec.md` (3 RF).
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 70 lines
**Changed:** 2026-10-17 · at implementation: the badge overlaps the centred logo by about 10px on a 242px card; the owner kept it, and spec 014's overlap check now fails only past the picture's centre (injection 5 added for it)

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 (logo before the name) | `ProjectCard` renders `<SkillLogo logo={logo} size={14} />` inside `.card-lang`, before a `.card-lang-text` span holding the language. |
| RF-2 (sized to the text, text intact) | 14px logo, `.card-lang` an `inline-flex` row centred on the cross axis; the ellipsis moves to the text span, the logo gets `flex: none`. |
| RF-3 (no logo, text alone) | The logo renders only when `languageLogo(lang)` resolves (the same `logo` the placeholder reads). |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/components/ProjectCard.astro` | modify | Badge holds the logo and the text. |
| `e2e/project-cards.spec.ts` | modify | Spec 014's one-image and overlap checks read the placeholder only. |
| `e2e/badge-logo.spec.ts` | create | RF-1, RF-2 rendered. |
| `tests/project-card.test.ts` | modify | RF-3 with a fixture repository whose language has no logo (the live list may hold none). |

## 3. Pure logic

None: `languageLogo` and `logoFor` exist and are tested.

## 4. Algorithm

```html
<span class="card-lang">
  {logo && <SkillLogo logo={logo} size={14} />}
  <span class="card-lang-text">{lang}</span>
</span>
```

```css
.card-lang      { display: inline-flex; align-items: center; gap: 0.3rem; /* overflow stays */ }
.card-lang img  { flex: none; }
.card-lang-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-inline-size: 0; }
```

## 5. Interface

| Width | Light and dark |
|---|---|
| 1280, 390 | the badge reads "[logo] TypeScript" top-right; the 48px logo stays in the placeholder |

## 6. Decisions

- **D-1 · Reuse `SkillLogo`.** It already picks the theme's file with two images; a second
  resolution would be a second source. *Discarded:* a CSS background on the badge.
- **D-2 · 14px.** The badge text is 12px on a 19.2px line (badge 24px tall, measured
  2026-10-17); a 14px logo sits inside that line, so the badge keeps its height. *Discarded:*
  16px, which also fits the line but outweighs 12px text (a judgement, not a measurement).

## 7. Test strategy

Runner from `package.json`: `npm test` and `npm run test:e2e`.

- **Rendered** (`e2e/badge-logo.spec.ts`): per theme, on / and /proyectos, each badge with a
  known language holds one visible image equal to `logoFor(…, theme)`, alt empty, left of the
  text, 12–16px, centres within 1px, `textContent` equal to the language.
- **Container** (`tests/project-card.test.ts`): a repo with language `Cobol` renders a badge with
  no `<img>` and no mark.
- **Changed:** spec 014's guard reads images and the picture inside `.card-media`, excluding
  `.card-lang`.
- **Injections:** (1) no logo in the badge → RF-1 red; (2) the logo after the text → RF-1 red;
  (3) `size={24}` → RF-2 red; (4) the logo for any language (a generic mark when none) → RF-3 red.

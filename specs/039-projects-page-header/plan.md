# Plan 039 — The projects page header like the proposal

**Spec:** `specs/039-projects-page-header/spec.md` (4 RF).
**Status:** approved
**Approved:** 2026-10-18 · owner approval with the spec · 67 lines
**Changed:** 2026-10-18 · at implementation: no new parser — tWords is already the shared gold-word parser, so SectionTitle is untouched; the hero's lower-left tile became hero-only and HeroBackground took a variant (dark text sat at 1.00–1.88:1 on it); the RF-1 test reads the glyph from the tile's ::before; injection 4 removes the header's position instead of moving the band

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 (glyph tile) | A `span.projects-page__tile` with the `folder` mask, `--accent-surface` fill and `--accent-surface-text` glyph, before the `h1`; the header row is flex. |
| RF-2 (two-tone title) | The `h1` renders `projects.title` through the same gold-word parsing `SectionTitle` uses, extracted to a helper both read (AGENTS: DRY). |
| RF-3 (line) | `p.projects-page__lead` with `t('projects.lead')`, `max-width: var(--measure)`. |
| RF-4 (band) | `<HeroBackground />` inside the header, which becomes `position: relative; isolation: isolate`, wrapping breadcrumb, title and line; the topbar already sits above (spec 036). |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/pages/proyectos/index.astro` | modify | Header markup and styles. |
| `src/utils/goldWord.ts` (or the existing parser's home) | create/move | The locale gold-word parser, shared. |
| `src/components/SectionTitle.astro` | modify | Reads the shared parser. |
| `e2e/projects-header.spec.ts` | create | RF-1 to RF-4. |
| `e2e/hero-background.spec.ts` | modify | The "no band" check moves to /proyectos/<name>. |

## 3. Pure logic

The gold-word parser moves unchanged; its existing tests (spec 008) keep covering it.

## 4. Algorithm

```astro
<header class='projects-page__header'>
  <HeroBackground />
  <Breadcrumbs … />
  <div class='projects-page__row'>
    <span class='projects-page__tile' aria-hidden='true'></span>
    <h1 …>{head}<span class='projects-page__word'>{gold}</span>…</h1>
  </div>
  <p class='projects-page__lead'>{t('projects.lead')}</p>
</header>
```

## 5. Interface

| Width | Light and dark |
|---|---|
| 1280 | band behind; tile · title on one row; the line under it; cards unchanged below |
| 390 | the same stacked, tile beside the title |

## 6. Decisions

- **D-1 · Reuse `HeroBackground`.** The band component already reaches to the sheet's edge from
  any block that starts under the topbar. *Discarded:* a second band component.
- **D-2 · Whole-word gold.** *Discarded:* the mid-word split, which no other title uses and which
  would need a new locale markup.

## 7. Test strategy

Runner from `package.json`: `npm test` and `npm run test:e2e`.

- **Rendered** (`e2e/projects-header.spec.ts`): RF-1 tile position, mask, fills and contrast per
  theme; RF-2 colours of the two runs and the accessible name; RF-3 the line per locale; RF-4 the
  band box at 1280 and 390 and the pixel check through `e2e/helpers/pixels.ts`.
- **Injections:** (1) the tile after the title → RF-1; (2) the gold run in ink → RF-2; (3) the line
  removed → RF-3; (4) the band outside the header (covering the grid) → RF-4.

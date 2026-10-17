# Plan 034 — Social tags follow the serving origin

**Spec:** `specs/034-social-tags-origin/spec.md` (3 RF).
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 68 lines
**Changed:** 2026-10-17 · at implementation: the Container types a site option but never applies it, so RF-2 is settled by the dev server's head alone, where the serving origin and production differ; injection 3 is red there, not in the Container; committed in two atomic steps (owner, same day)

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 (social tags on the serving origin) | `const site = Astro.url.origin`; `image` and `og:url` compose from it. |
| RF-2 (canonical and hreflang on production) | `const production = new URL(Astro.site ?? Astro.url).origin`; `canonical` (used by the `<link rel='canonical'>`) and the three alternates compose from it, and `og:url` gets its own value from `site`. |
| RF-3 (no literal) | The `https://portfolio-dext.vercel.app` line goes. |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/layouts/BaseLayout.astro` | modify | Two origins, each tag on the one the spec gives it. |
| `tests/seo.test.ts` | modify | RF-1, RF-2 on a Container render for a preview request; RF-3 on the source. |
| `e2e/og-cover-layout.spec.ts` | modify | RF-1, RF-2 on the dev server's head. |

## 3. Pure logic

None.

## 4. Algorithm

```astro
// The social tags follow the serving origin so a preview shows its own card (spec 034);
// search engines keep production, the site astro.config.mjs declares.
const site       = Astro.url.origin;
const production = new URL(Astro.site ?? Astro.url).origin;
const image      = `${site}/og-cover-${locale}.png`;
const canonical  = `${production}${Astro.url.pathname}`;
const shareUrl   = `${site}${Astro.url.pathname}`;
```

`og:url` binds `shareUrl`; the hreflang alternates compose from `production`. `Astro.site` is
`undefined` only without a configured `site`; the fallback keeps the page rendering on its own
origin rather than throwing.

## 5. Interface

None visible: head tags only.

## 6. Decisions

- **D-1 · Keep the name `site` for the serving origin.** Spec 033's guard and the AGENTS rule both
  read `${site}/og-cover-${locale}.png`; the new name is the production one. *Discarded:* renaming
  `site`, which would rewrite a rule and its guard for a word.
- **D-2 · `Astro.site`, not a second literal.** The config already declares the origin.
  *Discarded:* an env variable, a third source.

## 7. Test strategy

Runner from `package.json`: `npm test` and `npm run test:e2e`.

- **Container** (`tests/seo.test.ts`): render `BaseLayout` for
  `new Request('https://preview.example.test/?lang=en')` with the container's `site` set from
  `astro.config.mjs`; read `og:image`, `twitter:image`, `og:url`, `canonical` and the three
  alternates from the HTML. If the container cannot take a `site`, RF-2's check moves to e2e alone.
- **Source**: the layout, comments stripped, does not contain the configured site's host.
- **Rendered** (`e2e/og-cover-layout.spec.ts`): on `/?lang=es`, the social tags start with the dev
  server's origin; `canonical` and alternates start with the configured site.
- **Injections:** (1) `site` back to the literal → RF-1, RF-3; (2) `canonical` from `site` →
  RF-2; (3) `og:url` from `production` → RF-1.

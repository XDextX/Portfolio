# Plan 033 — The social card composed like the hero, one per locale

**Spec:** `specs/033-og-cover-hero/spec.md` (9 RF).
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 95 lines
**Changed:** 2026-10-17 · at implementation: cardHtml reads the font files to inline them (found: every card since spec 002 drew in the fallback, Chromium refusing file:// fonts on a setContent page), so it is not I/O-free as §3 said; main takes the repository root as a parameter so the failed-download test runs on a temporary copy (injection 7 had let main overwrite the real cards); the avatar is 240px beside a 48px gap, the role and location at --fs-lg, the phrases at --fs-xl, the corners at --radius-md

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 (avatar, left) | `fetchAvatar(url, fetchFn)` returns a `data:` URL from the answer's bytes; `cardHtml` takes it and lays out a two-column grid, avatar then text. |
| RF-2 (given ink, family gold) | `Readings.content` gains `given`/`family` from `ABOUT.nameParts`; `palette` gains `ink` (dark `--text-color`); the name is two spans. |
| RF-3 (role, location) | `content.role`, `content.location` from `ABOUT`, in one line under the name, the location in the secondary colour. |
| RF-4 (phrases) | `phrasesFor(locale)` reads `i18n/locales/<locale>.json` for `ABOUT.phraseKeys`, throwing on a missing key; italic, joined by a gold chevron as the hero draws them. |
| RF-5 (no action, no bio) | Nothing else is drawn. |
| RF-6 (tokens only) | `readTokens` reads `themes/dark.css` beside `00-tokens.css`; `DRAWN_TOKENS` splits into the base list and the dark list; `#FFFFFF` goes. |
| RF-7 (fail before writing) | `main` fetches the avatar before launching the browser; a non-OK or non-`image/*` answer throws. |
| RF-9 (one card per locale, bound per page) | `main` lists `i18n/locales/*.json`, renders one card per locale in one browser session and writes `og-cover-<locale>.png`, then deletes `og-cover.png`; `BaseLayout` composes `${site}/og-cover-${locale}.png` into the one `image` both tags read. |
| RF-8 (every text colour ≥ 4.5:1) | `palette` exports `ink`, `secondary`, `accent`, `ground`; measured 10.28, 5.39 and 6.66 on `#243972`. |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `scripts/og-cover.ts` | modify | Readings, avatar fetch, hero composition. |
| `tests/seo.test.ts` | modify | Widened drift check, contrast for every text colour, RF-2–RF-7 on the readings and the markup. |
| `e2e/og-cover-layout.spec.ts` | create | RF-1 placement and RF-4 italic on `cardHtml` rendered with `page.setContent` (installed Chrome, no server). |
| `src/layouts/BaseLayout.astro` | modify | `image` composes the page's locale. |
| `public/og-cover-es.png`, `public/og-cover-en.png` | create | The new cards. |
| `public/og-cover.png` | delete | Replaced by the two above. |
| `AGENTS.md` | modify | The og:image rule, in its own `docs:` commit before the code. |

## 3. Pure logic

- `fetchAvatar(url, fetchFn = fetch)`: one request, `image/*` or throw, bytes to a base64 `data:`
  URL with the answer's type.
- `cardHtml(readings, phrases, fitSizePx, publicDir, avatarDataUrl)`: markup only, no I/O.
- `phrasesFor(locale, localesDir)`: the four strings, or a throw naming the missing key.

## 4. Algorithm

```html
<body>                                  <!-- ground: --brand-primary, padding 64px -->
  <img class="avatar" src="data:…">     <!-- 240px square, white frame, radius like the hero's -->
  <div class="text">
    <h1 class="name"><span class="given">German</span> <span class="family">Montero Ramirez</span></h1>
    <p class="sub"><span class="role">Full-Stack Developer</span> <span class="loc">Costa Rica</span></p>
    <ul class="phrases"><li>Ideas</li><li>Código</li><li>Soluciones</li><li>Resultados</li></ul>
  </div>
</body>
```

The name fit (spec 002) measures against the text column's width, `contentWidthPx` minus the
avatar and the gap. The chevrons are a CSS `::before` in the accent, not a glyph file.

## 5. Interface

| Size | Dark |
|---|---|
| 1200×630 | avatar left, vertically centred; name on one line, family in gold; role · location; the four phrases in italic with gold chevrons |

## 6. Decisions

- **D-1 · Bytes in a `data:` URL.** The page Playwright renders has no origin to load the avatar
  from, and a file on disk would be the second source the owner ruled out.
  *Discarded:* passing the remote URL to the page, which makes the render itself depend on the
  network and on when it runs.
- **D-2 · One card per locale, both named by their locale (owner, 2026-10-17).** The default
  locale is still undecided, so no card is the unnamed `og-cover.png`. *Discarded:* Spanish only,
  and keeping `og-cover.png` as the Spanish card.
- **D-3 · Layout checked in a browser, content in vitest.** The readings and the markup are data
  for `tests/seo.test.ts`; where a box sits needs a layout engine, so it goes to Playwright with
  `setContent`, no server.

## 7. Test strategy

Runner from `package.json`: `npm test` and `npm run test:e2e`.

- **Unit** (`tests/seo.test.ts`): readings equal both sheets; every text colour ≥ 4.5:1; markup
  holds the name parts with their colours, title, location, the four Spanish phrases in order,
  none of the action labels or the bio; `fetchAvatar` with a stub: bytes in the `data:` URL, the
  URL asked is `ABOUT.avatar`; a failing and a `text/html` stub reject; `main` with a failing
  stub rejects and every PNG's hash is unchanged; the generator source holds no colour literal;
  per locale, the phrases equal that file's; `public/` holds one card per locale and no
  `og-cover.png`; the layout binds `og-cover-${locale}`.
- **Rendered** (`e2e/og-cover-layout.spec.ts`): `/?lang=es` and `/?lang=en` name their own file
  in `og:image` and `twitter:image`, and each answers 200.
- **Rendered** (`e2e/og-cover-layout.spec.ts`): the avatar's box left of the name's and inside
  the canvas; the phrases italic; the name on one line.
- **Injections:** (1) avatar after the text → RF-1; (2) family in ink → RF-2; (3) location
  dropped → RF-3; (4) phrases in another order → RF-4; (5) the CV label added → RF-5;
  (6) `#FFFFFF` back → RF-6; (7) the type check removed in `fetchAvatar` → RF-7; (8) the
  secondary colour swapped for a dark neutral → RF-8; (9) the layout binding a fixed
  `og-cover-es.png` → RF-9.

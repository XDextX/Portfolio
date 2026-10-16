# Plan 010 — Hero redesign

**Spec:** `specs/010-hero-redesign/spec.md` (**approved**, 8 RF).
**Status:** approved
**Approved:** 2026-10-15 · owner approval · 207 lines
**Changed:** 2026-10-15 · ordering aligned with what 016, 007, 008, 017 and 009 landed (helper names) · 207 lines · re-approved by the owner 2026-10-15

**Ordering.** Specs 016, 007, 008, 017 and 009 have landed. 016 leaves `tests/helpers/colour.ts`
with `resolveColour(expr, ...layers)` and `styleSources()`; 007 owns the CV button's fill and
ink and creates `e2e/helpers/dev-server.ts` and the theme setup; 008 creates `public/icons/ui/`
(`NOTICE.md`, `LICENSE-tabler.txt`, `mail.svg`) and `e2e/helpers/rendered.ts` (`openIn`,
`installHelpers` with in-page `__toHex`, `settled`, `composite`); 017 puts `.btn-social`'s border on `--control-border` (`AboutSection.astro:191`);
009 added `section--hero` (line 28), the hero glow, the in-page `__groundOf`, and `parseGradients`/
`composites`/`worstPoint`. Before any code: the spec's prerequisites (constitution 7, e2e in
`.husky/pre-commit`) and the owner's OK for each download in §2. Line numbers are today's.

## 1. Scope and coverage

| Requirement | Covered by |
|---|---|
| RF-1 no image but the avatar | masked spans and CSS only; e2e *hero images* |
| RF-2 four phrases as a list | `<ul role="list">` over `ABOUT.phraseKeys` through `t()`; e2e *phrases*; guard *hero keys* |
| RF-3 real italic face | italic `@font-face` in `05-fonts.css`; e2e *italic* |
| RF-4 / RF-5 given in text colour, family in gold | two spans in the `h1`; e2e *name colours* |
| RF-6 family ≥ 4.5:1 on the hero ground | e2e *name contrast*, over 009's glow samples in dark |
| RF-7 heading named with the computed full name | two spans, one space; e2e *heading name* |
| RF-8 translated label beside one hidden icon | `t(labelKey)` + one masked `aria-hidden` span; e2e *social buttons* |
| NFR two families / italic covers the phrases | guards *font families*, *italic coverage* |
| NFR LCP ≤ 200 ms at three viewports | measured before and after (§7), recorded in the commit |
| NFR icons | 008's guard *ui icons*, widened to the hero glyphs |
| NFR equal height; both themes | `block-size: 2.5rem` on both; e2e *button heights*; `tokens.test.ts` green |
| Guards the spec changes | identity guard and `e2e/about.spec.ts` avatar alt, widened (§4) |

Every RF and edge case is covered (name cases, §4). No guard retires; `tests/about.test.ts` stays as it is.

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/data/about.ts` | modify | States the identity once, `given` + optional `family`; computes `ABOUT.name`; owns the phrase key order and each social's label key and glyph. |
| `src/types/contact.ts` | modify | Gains `HeroSocial = ContactItem & { labelKey: string; glyph: string }`. |
| `i18n/locales/es.json`, `en.json` | modify | `about.phrases.{ideas,code,solutions,results}`, `about.social.{github,linkedin,email}`. |
| `src/components/AboutSection.astro` | modify | Draws the two-tone `h1` (46), the phrase list after `.about-meta`, and each social (68-79) as icon + translated label, without `aria-label`/`title` (74-75, D-6). |
| `public/styles/05-fonts.css` | modify | Declares the italic face; the header (1-5) becomes "5 files, 157 188 B". |
| `public/fonts/IBMPlexSans-latin-italic.woff2` | create, download | The latin italic, 100–700. |
| `public/icons/ui/brand-github.svg`, `brand-linkedin.svg` | create, download | GitHub and LinkedIn glyphs; email reuses 008's `mail.svg` (D-5). |
| `public/icons/ui/NOTICE.md` | modify | Two rows, as 008's. |
| `AGENTS.md` | modify, own `docs:` commit | The "IBM Plex Sans … for everything" rule names the test that settles it (constitution 3). |
| `tests/visual-language.test.ts` | modify | Widens the identity guard (269-302) and 008's *ui icons*; gains *font families*, *italic coverage*, name cases. |
| `tests/i18n.test.ts` | modify | Gains *hero keys*: keys held as data, which the `t('…')` scan (57) cannot see. |
| `e2e/about.spec.ts` | modify | The avatar-alt check (119-128) compares against the imported `ABOUT.name`, unconditionally. |
| `e2e/helpers/rendered.ts` | modify | Gains `axTree(page)`, moved out of 008's spec if it lives there (D-9). |
| `e2e/hero.spec.ts` | create | The rendered checks of §4. |

Downloads, each on the owner's OK at the moment of download; Tabler at v3.49.0, the version
`public/tech/mono/NOTICE.md` records; SVG sizes are estimates, reported exactly on download:

| File | Source | Size | Licence |
|---|---|---|---|
| `IBMPlexSans-latin-italic.woff2` | `https://cdn.jsdelivr.net/npm/@fontsource-variable/ibm-plex-sans@5.2.8/files/ibm-plex-sans-latin-wght-italic.woff2` | 50 184 B | OFL 1.1 |
| `brand-github.svg` | `https://cdn.jsdelivr.net/npm/@tabler/icons@3.49.0/icons/outline/brand-github.svg` | ~0.7 kB | MIT |
| `brand-linkedin.svg` | `https://cdn.jsdelivr.net/npm/@tabler/icons@3.49.0/icons/outline/brand-linkedin.svg` | ~0.6 kB | MIT |
| `mail.svg` | `https://cdn.jsdelivr.net/npm/@tabler/icons@3.49.0/icons/outline/mail.svg` | ~0.4 kB | MIT; 008's file, fetched here only if 008 has not landed |

## 3. Pure logic

Nothing reads a clock. In `src/data/about.ts`, exported for the tests:

- `fullName(id: { given: string; family?: string }): string` — `given`, plus `' ' + family`
  when present. Throws on an empty `given` or on edge or doubled whitespace in either part.
- `nameParts(id): { given: string; family: string | null }` — the split as the data states
  it; `family` is `null`, never `''`. Nothing splits on a space (D-1).

Test-local: `fontFaces(css)` → `{ family, style, src[], ranges }[]`, `unicode-range` parsed,
and `inRanges(cp, ranges): boolean`. Everything else is reused from the helpers named above.

## 4. Algorithm

**Data.** `IDENTITY = { given: "<given>", family: "<family>" }`; `ABOUT.name = fullName(IDENTITY)`,
`ABOUT.nameParts = nameParts(IDENTITY)`. The readers (`AboutSection.astro:37`,
`BaseLayout.astro:21,22,31`, `about.ts:60`) keep reading `ABOUT.name`, untouched.
`SOCIAL_ORDER` (10) becomes `{ id, labelKey, glyph }` entries, glyphs root-absolute under
`/icons/ui/`; `socials` spreads the matched contact and adds both. Locale values: es "Ideas",
"Código", "Soluciones", "Resultados", "Correo"; en "Ideas", "Code", "Solutions", "Results",
"Email"; "GitHub" and "LinkedIn" in both.

**Markup**, each element on one line so no template whitespace lands between spans:

```
<h1 id=about-title class=about-name><span class=about-name__given>{given}</span>{family && [' ', <span class=about-name__family>{family}</span>]}</h1>
<ul class=about-phrases role=list>{phraseKeys.map(k => <li>{t(k)}</li>)}</ul>      # before the bio
<a class=btn-social …><span class=btn-social__icon aria-hidden=true style=--icon:url({glyph})></span>{t(labelKey)}</a>
```

**Styles (scoped).** `.about-name` drops its colour (118); given `var(--text-color)`, family
`var(--accent-text)`. `.about-phrases`: flex wrap, `gap: var(--sp-2) var(--sp-3)`, no bullets,
italic 400 at `var(--fs-lg)`, `var(--text-secondary)`. `li` is `nowrap`; `li + li::before` is
`content: ''`, a 0.4em inline-block with 2px `var(--accent-text)` borders on two sides rotated
45° — a chevron riding at the start of its word, so it never starts a line alone and adds
nothing to the AX tree. `.btn-social__icon`: 1rem, `background-color: currentColor`, `mask` and
`-webkit-mask: var(--icon) center / contain no-repeat` (`SkillBar.astro:69-70`). `.btn-social`
gains `gap: 0.4rem`; it and `.btn-cv` gain `block-size: 2.5rem; box-sizing: border-box` (D-7).
The hover (202-206) is untouched: the icon follows `color` to gold. **Font face:** the roman
latin block (7-17), `italic`, the new file; same range, `100 700`, `swap`; no preload (D-4).

**Identity guard** (269-302). Import `ABOUT`; parts are the words of `nameParts.given` and
`nameParts.family`, longer than two letters (282); throw if none. The walk (285-294) and the
`about.ts` exemption (286) stay. **`e2e/about.spec.ts`:** import `ABOUT`; the regex (123) and
the `if (expectedName)` skip (125) go; assert an `img` with `alt === ABOUT.name`.

**Data guards.** *Font families*: over `styleSources()`, the `@font-face` families are exactly
{IBM Plex Sans, IBM Plex Mono}; each `src` matches `^/fonts/[^/]+\.woff2$` and exists; one Sans
face is italic. *Italic coverage*: every code point of every phrase value, both locales, is
`inRanges` of that face. *Hero keys*: each `phraseKeys` entry and `socials[].labelKey` resolves
in both locales. *Name cases*, placeholders only: `fullName({ given: 'Ana' })` is `'Ana'` with
`family === null`; "María José" + "Ruiz" stays whole and one-spaced; `' Ana'` and a doubled
space throw. *ui icons* (008) also reads the hero glyphs: root-absolute, existing,
`currentColor` only, in `NOTICE.md`; one file, one meaning — the email button and the contact
title share `mail.svg`.

**e2e** (`hero.spec.ts`). URL from `startDevServer()`, never a literal 4321. Hero =
`section.section--hero`; light and dark via 007's setup; `/?lang=es` and `/?lang=en`.

- *hero images* (RF-1): one `img`, `src === ABOUT.avatar`; no `picture`, `video`, `object`,
  `embed`, `iframe`, `canvas` or SVG `image`; no element or `::before`/`::after` with `url(`
  in `background-image`, `border-image-source`, `list-style-image` or `content`.
- *phrases* (RF-2): `axTree` holds one hero `list` of four `listitem`s, the locale's values in order.
- *italic* (RF-3): after `document.fonts.ready` and `settle`, each `li` computes `italic` and
  `document.fonts` holds an IBM Plex Sans face, style `italic`, status `loaded`.
- *name colours* (RF-4, 5): given = probe `var(--text-color)`, family = probe `var(--accent-text)`.
- *name contrast* (RF-6): light, against `groundOf`; dark, `worstPoint` over the hero glow's
  `composites` — the whole glow, conservative. 009's *worst point* floors large text at 3.
- *heading name* (RF-7): the `h1`'s AX name `=== ABOUT.name`, exactly (008's D-9).
- *social buttons* (RF-8): in order, visible text and AX name "GitHub", "LinkedIn", "Correo" /
  "Email"; exactly one `.btn-social__icon`, `aria-hidden`, absent from the AX tree.
- *button heights* (NFR): `.btn-cv` and each `.btn-social` within 0.5px, at 1280 and 390.

## 5. Interface

| State | Light | Dark |
|---|---|---|
| Name | given `#16202C`, family `#7A5D10` (6.01:1) | given `#F5F7FA`, family `#E3C770` (6.66 bare, 6.06 at the glow's brightest, plan 009) |
| Phrases | italic 20px, secondary ink, gold chevrons | same, on the glow |
| Social buttons | icon + label, 017's border; hover turns border, label and icon gold | same |
| CV button | 007's colours, 40px like the socials | same |
| One-word name (data only) | whole `h1` in text colour, no gold span | same |
| 390px | name may wrap, phrases wrap between items, `scrollWidth <= innerWidth` at the walk | same |

Chevron and phrase colour are this plan's proposal, confirmed at the walk.
| Italic loading / avatar failed | fallback italic one frame (`swap`) / alt = full name, unchanged | same |


## 6. Decisions

- **D-1 · `ABOUT.name` stays, computed from `IDENTITY`.** *Discarded:* `fullName()` at each of
  the five readers — five edits for one value.
- **D-2 · Keys held as data, guarded by *hero keys*.** *Discarded:* seven literal `t('…')`
  calls, which put the order in the template; `` t(`about.social.${id}`) ``, which no scan resolves.
- **D-3 · `resumeUrl` (24) keeps its literal file name.** *Discarded:* composing it from the
  name parts — the URL would follow a data edit the PDF on disk does not, and
  `about.test.ts:19` goes red for a rename nobody made. `about.ts` is a constitution 9 home.
- **D-4 · No italic preload now.** *Discarded:* preloading up front — 50 kB competing with the
  roman before the measurement says LCP moved (the spec defers it).
- **D-5 · Reuse 008's `mail.svg`.** *Discarded:* a second mail glyph — two pictures for one meaning.
- **D-6 · The visible text names the social button; `aria-label` and `title` go.**
  *Discarded:* `aria-label={t(labelKey)}` beside it — a copy that drifts (WCAG 2.5.3).
- **D-7 · `block-size: 2.5rem` literal on both** (AGENTS "Two controls side by side"); both
  compute 38.8px today. *Discarded:* `38.8px`, which reads as derived; a `--control-h` token.
- **D-8 · Separator `li + li::before`, `content: ''`.** *Discarded:* `content: '→'`, which
  enters the item names; a separator `li`, which makes the list seven.
- **D-9 · `axTree` in `rendered.ts`.** *Discarded:* a second CDP reader here (DRY).

## 7. Test strategy

Runners from `package.json`: `npm test` (`vitest --run tests`) for the data guards;
`npm run test:e2e` (`playwright test`, installed) for RF-1–8 — computed colour, font, box and
accessible name (constitution 8). Red first against today: *phrases*, *italic*, *name colours*
(given is gold), *social buttons*, *hero keys*, *italic coverage*. RF-5 and RF-6 fail today
only for want of the family span — the gold itself passes (the spec's note) — so each is also
proven by injection; RF-1, RF-7 and *font families* are green today: injection only.

Each injection restored byte-identical by explicit path, the commit naming them:

| # | Injection | Expected red |
|---|---|---|
| 1 | `background-image: url(/og-cover.png)` on the hero | hero images |
| 2 | `phraseKeys` order swapped | phrases |
| 3 | italic `@font-face` deleted | italic, italic coverage |
| 4 | given `color: var(--accent-text)` | name colours (RF-4) |
| 5 | family `color: var(--brand-accent)` | name colours (RF-5) |
| 6 | light `--accent-text: var(--brand-accent)` | name contrast, light (1.61); RF-5 holds |
| 7 | dark hero glow gold 40% | name contrast, dark |
| 8 | the space between the spans dropped | heading name |
| 9 | `aria-label="Email"` back on the socials | social buttons (`es`) |
| 10 | a second icon span; `aria-hidden` removed | social buttons |
| 11 | `.btn-social` `block-size` dropped, padding 0.6rem | button heights |
| 12 | a `'Caveat'` face added | font families |
| 13 | es phrase "Ideas→" (U+2192, outside the range) | italic coverage |
| 14 | `about.social.email` deleted from `en.json` | hero keys |
| 15 | the family name as a literal in `BaseLayout.astro` | identity guard |
| 16 | `fullName` joins with two spaces | name cases, heading name |
| 17 | `brand-linkedin.svg` renamed | ui icons |

**LCP**, as commit `a6f1297` did: a buffered `largest-contentful-paint` observer on `/` at
390×844, 958×888 and 1440×900, element and time, from a scratchpad script never committed;
before (after 009) and after, each ≤ 200 ms; if the element moves to the phrases, D-4 reopens.
Then `npm run build` and the *Done when* walk at those sizes, both themes and locales, after
animations settle and `document.styleSheets` checked; the owner approves before the commit.

# Plan 012 — Skills section redesign: six areas, colour logos, toggle state

**Spec:** `specs/012-skills-redesign/spec.md` (**approved**, 14 RF).
**Status:** approved
**Approved:** 2026-10-15 · owner approval · 272 lines
**Changed:** 2026-10-16 · ordering, helper names and line numbers aligned with what 016–011 landed; exact download sizes; Astro keeps its svgl.app marks (D-11, owner); downloads under the owner's standing OK for icons · 277 lines · re-approved by the owner 2026-10-16

**Ordering.** Specs 016, 007, 008, 017, 009, 010 and 011 have landed: 016's `tests/helpers/colour.ts`
(`contrast`, `resolveColour(expr, ...layers)`, `styleSources()`); 007's `e2e/helpers/dev-server.ts`
and theme setup (`addInitScript` + `emulateMedia`); 008's `SectionTitle` (already in place of
`HabilitiesSection.astro:16`), `public/icons/ui/` with `NOTICE.md` and `LICENSE-tabler.txt`, the
*ui icons* guard (010 and 011 widened it to the hero and step glyphs) and `e2e/helpers/rendered.ts`
(`openIn`, `installHelpers` with in-page `__toHex` and `__groundOf`, `settled`; 010 added `axTree` and
`axQuery`); 017's gold group hover on `.view-toggle`, which leaves the active button here; 011's
glyphs `bulb`, `code`, `database`, `rocket`, none reused here. Before any code, each its own `docs:` commit: the
constitution 7 amendment (e2e in the policy and the hook), the brand-logo exception beside
the "canvas is cool" rule (`AGENTS.md:306`, next to 011's step exception), and `AGENTS.md:370-375` rewritten (a skill row has no hover state; the
`(hover: hover)` rule goes with the recolour it gated). Then the owner's OK per download (§2).

## 1. Scope and coverage

| Requirement | Covered by |
|---|---|
| RF-1 ten skills, six areas, levels kept | `area` on each `TECH` entry, `SKILL_AREAS` in `src/data/tech.ts`; guard *skill table* |
| RF-2, RF-3 declared order; empty area not rendered | `populatedAreas()` (§3) feeds both panels; e2e *area order*, *empty areas*; §3 cases |
| RF-4 every declared heading in both locales | six `skills.areas.*` keys; *area headings* (widened i18n guard) |
| RF-5 compact headings translated | both panels render `AreaHeading`; e2e *compact headings* |
| RF-6 theme's original logo, same in both views | `SkillLogo` used by `SkillBar` and `SkillChip`; e2e *row logos* |
| RF-7 hover changes nothing in a row | every `.bar-row` hover rule deleted; e2e *row at rest* |
| RF-8 generic mark in the monochrome colour | `SkillLogo` masks `GENERIC_MARK` in `--icon-mono`; e2e *generic mark* |
| RF-9 every drawn file on record | `public/tech/NOTICE.md`; guard *logo record*; 008's *ui icons* reads the new glyphs |
| RF-10, RF-11 one decorative icon per heading, `--icon-mono`, ≥ 3:1 | `AreaHeading.astro`; e2e *header icons*, *header icon colour* |
| RF-12 gold bar under the active icon | `.toggle-indicator` span; e2e *active indicator*, both themes |
| RF-13 no indicator on hover | no hover rule touches it; e2e *hover inactive* |
| RF-14 bars indicator with scripts off | active style on `[aria-pressed='true']`, server-rendered; e2e *no script* |
| NFR removed files, no orphan; reduced motion | guard *logo record* (orphan clause); no transition on the indicator, *active indicator* under `reducedMotion` |
| NFR layout prediction; SEO; `t()`; no dependency | Done-when walk; `seo.test.ts:110` unchanged; i18n guards; same-origin SVGs |

Every RF is covered. **Retired**, each in the commit that removes its subject:
`tests/markup.test.ts:262-360` "mounts monochrome and reaches brand colour only on the row hover"
and `362-379` "reaches brand colour only on a pointer that can hover" — no mask, no `--brand`, no
row hover left to gate (RF-6, RF-7), replaced by *row logos* and *row at rest*; their only helpers
go too (`rulesInContext` 206-223, `selectorList`/`ROW_HOVER`/`outOfRowScope` 235-259).
`tests/visual-language.test.ts:402-458` "every skill icon is a single-colour asset…" — gradients
are the point now, replaced by *logo record*. `344-400` "the monochrome icon clears the card…" —
logo contrast is accepted; the mono colour survives on the generic mark and header icons, measured
rendered by *generic mark* and *header icon colour*. **Re-pointed:** `tests/markup.test.ts:381-416`
keeps the 22px slot, `aria-hidden` and no-surface clauses; the `<img>` clause (390-391) goes.
**Widened:** `tests/i18n.test.ts:80-256` iterates `SKILL_AREAS`. **Stays:** 006's bar-frame
contrast (`tests/visual-language.test.ts:499-535`) and `tests/markup.test.ts:419-591`.

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/data/tech.ts` | rewrite | States the six areas once, in order, each with its glyph; each skill's name, level, area and logo; the generic mark's path; `populatedAreas`, `logoFor`. `TechCategory` (1), `icon`, `brand` and the comment (3-7) go. |
| `src/components/TechGrid.astro` | modify | Decides which areas render and in what order: `groupBy`/`byCategory`/`areaKey` (31-48) become `populatedAreas(SKILL_AREAS, items)`; both panels (56-104) render `AreaHeading`, so the raw `{cat}` (86) goes; `TechItem` (14-22) becomes the data's type; `.cat-label` (191-196) moves out; line 120 (the unread `.active` class) goes. |
| `src/components/AreaHeading.astro` | create | Renders one area heading: the masked glyph, then the translated text; owns `.cat-label`. |
| `src/components/SkillLogo.astro` | create | Decides what a skill's slot draws: one `<img>`, one per theme, or the masked generic mark. |
| `src/components/SkillBar.astro` | modify | Props `icon`, `brand` (4-10, 24) become `logo`; the slot (31) wraps `SkillLogo`; the mask and hover rules (53-81) go; `.bar-logo` keeps its 22px box. |
| `src/components/SkillChip.astro` | modify | The `<img>` (26) becomes `SkillLogo` at 18px; `logo` becomes optional. |
| `src/components/SkillViewToggle.astro` | modify | Decides how the active view shows: a `.toggle-indicator` span per button, visible under `[aria-pressed='true']`; `.toggle-btn.active` (119-122) becomes that selector. |
| `i18n/locales/es.json`, `en.json` | modify | `skills.areas` (53-60): six keys, Definitions text; `database`, `cloud`, `devops`, `other` go. |
| `public/tech/*.svg` | replace, download | Eight Devicon files (table below); `astro-icon-light.svg` and `astro-icon-dark.svg` stay (D-11); `csharp.svg` and `nginx.svg` deleted. |
| `public/tech/NOTICE.md`, `LICENSE-devicon.txt` | create; `git mv` | The colour logos' source and licence; the licence moves byte-identical from `public/tech/mono/` (1 092 B), no fetch. |
| `public/tech/mono/` | delete | Nine Devicon files, `NOTICE.md`, both licences; `broadcast.svg` moves (`git mv`) to `public/icons/ui/`. |
| `public/icons/ui/*.svg`, `NOTICE.md` | create, download; modify | Six header glyphs and `broadcast.svg`, seven rows as 008's. |
| `tests/skills.test.ts` | create | *skill table*, *logo record*, the §3 cases. |
| `tests/i18n.test.ts`, `markup.test.ts`, `visual-language.test.ts` | modify | Widened, re-pointed, retired (§1); 008's *ui icons* reads `SKILL_AREAS` and `GENERIC_MARK`. |
| `e2e/skills.spec.ts` | create | The rendered checks of §4. |
| `specs/005-skills-bars/spec.md`, `006-health-bar-segments/spec.md` | modify, `docs:` | Decision-log entries per the spec's "Specs 005 and 006 after this spec". |

**Downloads, on the owner's OK, asked once for the whole set.** Sizes from jsDelivr's package
index on 2026-10-16, re-reported on download. Devicon v2.16.0 (the version `public/tech/mono/NOTICE.md` records), MIT,
unmodified, from `https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/<dir>/<dir>-original.svg`,
saved as `public/tech/<name>.svg`: `typescript` 943 B, `java` 1 540 B, `angular` 995 B,
`dot-net` → `dotnet.svg` 14 229 B, `postgresql` 9 178 B, `mongodb` 5 611 B, `azure` 1 713 B,
`docker` 4 452 B. **Astro is not downloaded** (D-11): v2.16.0 ships no white-mark Astro, so
`astro-icon-light.svg` (899 B) and `astro-icon-dark.svg` (1 690 B), already on disk, stay; the
notice records them as Astro's marks from `https://svgl.app/library/<file>`. Licence: `https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/LICENSE`, already on disk as
`LICENSE-devicon.txt` — no download. Tabler Icons v3.49.0, MIT, `outline`, unmodified, from
`https://cdn.jsdelivr.net/npm/@tabler/icons@3.49.0/icons/outline/<file>`: `braces.svg` 494 B,
`layout.svg` 609 B, `server.svg` 569 B, `table.svg` 470 B, `cloud.svg` 603 B, `test-pipe.svg` 519 B
(on record, not drawn yet).

## 3. Pure logic

Nothing reads a clock; the theme is a parameter. In `src/data/tech.ts`:

```ts
export const SKILL_AREAS = [
  { key: 'languages', glyph: 'braces' }, { key: 'frontend', glyph: 'layout' },
  { key: 'backend', glyph: 'server' },   { key: 'databases', glyph: 'table' },
  { key: 'cloudDevops', glyph: 'cloud' }, { key: 'testing', glyph: 'test-pipe' },
] as const;
export type AreaKey = (typeof SKILL_AREAS)[number]['key'];
export type Logo = string | { light: string; dark: string };
export interface TechEntry { name: string; logo?: Logo; href?: string; level?: TechLevel; area: AreaKey }
export const GENERIC_MARK = '/icons/ui/broadcast.svg';
```

- `populatedAreas<T extends { area: string }>(areas, items: readonly T[]): { key; glyph; items: T[] }[]`
  — walks `areas`, not `items`: each area with its items in data order, an area with none
  dropped. Cases: Testing absent; a reversed `items` yields the same area order.
- `logoFor(logo: Logo | undefined, theme: 'light' | 'dark'): string | null` — the string, the
  theme's member, or `null` (the generic mark draws). Cases: Astro differs per theme; SSE `null`.
- `logoFiles(logo): string[]` — the distinct files an entry draws (0, 1 or 2), for the guards.

## 4. Algorithm

**`SkillLogo` (`logo?: Logo`, `size: number`).**

```
logo undefined -> <span class=mark style=--mark:url(GENERIC_MARK)>        # mask, --icon-mono
typeof string  -> <img src=logo alt='' width=size height=size loading=lazy>
object         -> <img class=logo--light src=logo.light ...><img class=logo--dark src=logo.dark ...>
style: .logo--dark { display: none }
       :global(:root[data-theme='dark']) .logo--light { display: none }
       :global(:root[data-theme='dark']) .logo--dark { display: inline }
       .mark { size square; background-color: var(--icon-mono); mask/-webkit-mask: var(--mark) center / contain no-repeat }
```

The mark paints `--icon-mono`, not `currentColor`: the chip's hover turns its text gold. A
`display: none` lazy image is not fetched in Chromium, so Astro costs one request per theme.

**`AreaHeading` (`area: { key; glyph }`).** `<h4 class=cat-label><span class=area-icon aria-hidden
style=--icon:url(/icons/ui/{glyph}.svg)></span>{t('skills.areas.' + key)}</h4>`. `.cat-label`
keeps today's size, weight and margin and adds `display: flex; align-items: center; gap:
var(--sp-2)`: the text wraps, the card minimum (006 RF-10) holds. `.area-icon`: `flex: none`, `1em`
square, `background-color: var(--icon-mono)`, the mask of `.mark`.

**Toggle.** Each button gains `<span class=toggle-indicator aria-hidden=true>` after its svg;
`.toggle-btn` gains `position: relative`; the svg size moves to CSS, `1rem` square.

```
.toggle-indicator { position: absolute; inset-inline: calc((2rem - 1rem) / 2);   # button minus icon, halved
                    inset-block-end: 0.2rem; block-size: 2px; background: var(--accent-text); visibility: hidden }
.toggle-btn[aria-pressed='true'] { background: var(--neutral-200); color: var(--accent-text) }
.toggle-btn[aria-pressed='true'] .toggle-indicator { visibility: visible }
```

No transition on it; the server already renders bars `aria-pressed='true'` (`SkillViewToggle.astro:12`).

**Guard *skill table* (RF-1).** `SKILL_AREAS.map(a => a.key)` equals the six keys in order;
`TECH` projected to `{ name, level, area }` and sorted by name equals a dated literal of the
Definitions table (sorted, so a reorder reddens only RF-2); every `area` is a declared key.

**Guard *area headings* (RF-4, widened).** For each `SKILL_AREAS` key, `es` and `en`:
`skills.areas.<key>` equals the Definitions heading exactly. The vacuity test (153-159) asserts
`SKILL_AREAS` is non-empty and the bars panel calls `populatedAreas(`; the card test (187-255)
reads the `.map(` over it, accepts `<AreaHeading` as the heading, and checks `t(` inside
`AreaHeading.astro`'s `<h4>`. `groupKey`, `fallbackCategory` (102-108) go with `Other`.

**Guard *logo record* (RF-9, orphan NFR).** `drawn = TECH.flatMap(e => logoFiles(e.logo))`;
each basename is named in `public/tech/NOTICE.md`; every `LICENSE*.txt` it cites exists beside
it; every `.svg` in `public/tech/` is in `drawn`; `public/tech/mono/` does not exist. 008's *ui
icons* adds `SKILL_AREAS` glyphs and `GENERIC_MARK` to the files it checks against its notice.

**e2e** (`e2e/skills.spec.ts`): `/?lang=es` and `/?lang=en`, both themes (`openIn`), after
`settled`; expectations from `src/data/tech.ts` and the locale JSON; groups are `.card-frame` / `.cat-group`.

- *area order* / *empty areas* (RF-2, RF-3): per panel, heading texts equal
  `populatedAreas(SKILL_AREAS, TECH)` headings in order; group count 5; no Testing heading.
- *compact headings* (RF-5): list-panel headings equal the locale's text, both locales.
- *row logos* (RF-6): per row and chip, matched by name: the slot's images that
  `checkVisibility()` number one, and its `currentSrc` pathname equals `logoFor(e.logo, theme)`.
- *row at rest* (RF-7): every computed property of `.bar-row`, `.bar-logo` and its child,
  pointer at (0, 0) vs hovering the row: identical, both themes.
- *generic mark* (RF-8): SSE's slot in both panels and themes holds no `<img>`; the `.mark`'s
  `mask-image` ends in `GENERIC_MARK`; its background equals a probe's `var(--icon-mono)`.
- *header icons* (RF-10): per heading, one `.area-icon`, `mask-image` ending in its glyph,
  `aria-hidden='true'`, absent from `axQuery(page, <heading>, 'image')`, right edge ≤ the text's first glyph (a `Range`),
  height ≤ the heading's line height. *Header icon colour* (RF-11): background equals the
  `--icon-mono` probe, `contrast()` against the in-page `__groundOf()` (the card) ≥ 3.
- *active indicator* (RF-12): the pressed button's indicator is shown (visible, non-zero box),
  top ≥ the svg's bottom, horizontally within ±1px of it; colour equals the `--accent-text`
  probe; ≥ 3:1 against `.view-toggle`'s and the pressed button's backgrounds; the four
  `border-*` of both buttons equal; the other button's indicator hidden. Again after clicking
  list, and under `reducedMotion: 'reduce'`, where its `transition-duration` is `0s`.
- *hover inactive* (RF-13): the unpressed button hovered keeps its indicator hidden. *No
  script* (RF-14): in a `javaScriptEnabled: false` context only bars shows it.

## 5. Interface

| State | Light | Dark |
|---|---|---|
| Bars row at rest | colour logo; Astro dark mark | colour logo; Astro white mark |
| Bars row hovered, or tapped | no change | no change |
| SSE (no logo) | generic mark `#566274`, both views | `#A9B6CD`, both views |
| Logo fails to load | empty 22px slot (18px in the chip); name, bar, label unchanged | same |
| Area heading | glyph `#566274` (6.19:1 on `#FFFFFF`), text as today | glyph `#A9B6CD` (4.78:1 on `#2B4372`) |
| Long heading; Testing | "Bases de datos" at 1024 wraps beside the glyph, card minimum unchanged; Testing not rendered | same |
| Toggle, active | fill `#DCE2E9`, gold icon, bar `#7A5D10` (6.18 group / 4.73 fill) | `#3A578F`, bar `#E3C770` (5.90 / 4.31) |
| Toggle, inactive hovered | fill + text colour (today's rule), no bar; group border gold (017) | same |
| Scripts off | bars view, bars button with bar; list button inert (out of scope) | light only: the theme needs the script |
| Reduced motion | bar appears at once; bars' entrance as 006 | same |

Logo contrast is accepted (spec Edge cases); the Devicon files are re-measured at the visual review.

## 6. Decisions

- **D-1 · Astro's theme picks the file by two `<img>`s, one hidden per theme.** *Discarded:*
  `<picture>` with `prefers-color-scheme` — follows the OS, not the site's toggle; `content:
  url()` on the image — `currentSrc` keeps the old file, so RF-6 cannot read it; a script swap
  — wrong file with scripts off, and a flash on every navigation.
- **D-2 · One `SkillLogo` for both views.** *Discarded:* the slot logic in `SkillBar` and
  `SkillChip` each — two copies of "which file, which theme, or the mark" (AGENTS DRY), and RF-6
  asks for the same file in both.
- **D-3 · The generic mark and the header glyphs are masks painting `--icon-mono`.**
  *Discarded:* `<img>` — a `currentColor` glyph in an image paints black, 2.15:1 on the dark card.
- **D-4 · Areas from `SKILL_AREAS` by key; headings only in the locales.** *Discarded:* first-
  appearance grouping — the entry order would decide the card order; heading text in the data
  — a second source for visitor text (constitution 5, 10).
- **D-5 · Keys `databases` and `cloudDevops`, not `database` and `cloud`.** The spec removes
  three old keys; reusing `database` would keep a key whose text changes under it.
  *Discarded:* keeping `cloud` and `devops` as two areas — the owner's table merges them.
- **D-6 · `AreaHeading` as a component.** *Discarded:* the `<h4>` written in both panels — the
  glyph markup twice, and the compact copy is what drifted to the raw value (RF-5).
- **D-7 · The indicator is a real span.** *Discarded:* `::after` — no box for a `Range` or
  `getBoundingClientRect`, and RF-12 measures position.
- **D-8 · Active style hangs on `aria-pressed`.** *Discarded:* keeping `.active` — only the script
  adds it (RF-14), and with `aria-pressed` read it would be an attribute nobody reads.
- **D-9 · The active fill stays** (the spec measured the bar on it). *Discarded:* dropping it — the hover fill would out-weigh the active state.
- **D-11 · Astro keeps its official marks, one per theme** (owner, 2026-10-16). Devicon v2.16.0's
  `astro/` holds only `astro-original` (near-black body `#000014`–`#150426`, 2.14:1 on the dark card;
  flame `#FF5D01` 3.16) and `astro-plain` (black). The files on disk match svgl.app's (light
  byte-identical, dark with its gradient id renamed). *Discarded:* `astro-original` in both themes.
- **D-10 · Indicator offset written as `calc((2rem - 1rem) / 2)`.** The `1rem` is the icon,
  now set in CSS rather than the svg's `width='16'`. *Discarded:* `25%` — right only while the
  button is twice the icon. The `1rem` written twice in one file is the AGENTS "fixed-size
  decorative" duplicate, flagged here.

## 7. Test strategy

`npm test` (`vitest --run tests`) for *skill table*, *area headings*, *logo record*, *ui icons*,
the re-pointed slot guard and the §3 cases — data and files (constitution 8). `npm run test:e2e`
(`playwright test`, Chromium) for RF-2/3/5–8/10–14: a source, a computed colour, a box and an
accessibility tree are what those RFs are about. Red first today: *skill table*, *area headings*,
*logo record*, *compact headings*, *row logos*, *generic mark*, *header icons*, *active indicator*
(dark fill 1.37:1, no bar), *no script*. Each injection restored byte-identical by explicit path,
the commit naming it (constitution 4):

| # | Injection | Expected red |
|---|---|---|
| 1 | Java `area: 'frontend'` | skill table |
| 2 | Docker `area: 'devops'` (undeclared) | skill table |
| 3 | es `skills.areas.cloudDevops` "Nube" | area headings |
| 4 | en `skills.areas.testing` deleted | area headings (empty area) |
| 5 | `AreaHeading`'s `<h4>` prints `{area.key}` | area headings (card test); compact headings |
| 6 | `populatedAreas` by first appearance + Docker first in `TECH` | area order, both panels |
| 7 | `populatedAreas` keeps empty areas | empty areas; §3 case |
| 8 | `SkillLogo` draws `logo.light` in both themes | row logos, dark, both views |
| 9 | `SkillChip` back to `<img src={logo}>` | row logos, compact |
| 10 | `@media (hover: hover) { .bar-row:hover .bar-logo { opacity: .8 } }` | row at rest |
| 11 | SSE `logo: '/tech/docker.svg'` | generic mark |
| 12 | `.mark { background-color: currentColor }` | generic mark, light |
| 13 | `docker.svg` row deleted from `public/tech/NOTICE.md` | logo record |
| 14 | the notice cites `LICENSE-devicon.md` | logo record (missing licence) |
| 15 | `nginx.svg` kept in `public/tech/` | logo record (orphan) |
| 16 | `server.svg` row deleted from `public/icons/ui/NOTICE.md` | ui icons |
| 17 | `.cat-label { flex-direction: row-reverse }` | header icons (left of text) |
| 18 | `.area-icon` `2em` square | header icons (line height) |
| 19 | `aria-hidden` off `.area-icon` | header icons |
| 20 | `.area-icon { background-color: var(--accent-text) }` | header icon colour, both themes |
| 21 | dark `--icon-mono: var(--neutral-200)` | header icon colour (1.37:1), 006's frame guard; generic mark holds |
| 22 | `.toggle-indicator { background: var(--neutral-600) }` | active indicator (colour) |
| 23 | pressed fill `var(--accent-text)` | active indicator (1.00:1 on the fill) |
| 24 | pressed rule adds `border: 1px solid var(--accent-text)` | active indicator (border) |
| 25 | `.toggle-indicator { transition: visibility 200ms }` | active indicator (reduced motion) |
| 26 | `.toggle-btn:hover .toggle-indicator { visibility: visible }` | hover inactive |
| 27 | pressed selector back to `.toggle-btn.active` | no script (green with scripts) |
| 28 | `.bar-logo` `width: 20px`; then `aria-hidden` off the slot | re-pointed slot guard, twice |

Reordering `TECH` alone must stay green: run it before row 6. Then `npm run build`, and the
*Done when* walk: `/` in both themes and locales, both views, at 1280, 1024, 800 and 390px,
scripts off and reduced motion, `document.styleSheets` checked first, section heights set
against the spec's prediction. One component per commit, each after the owner's approval in
light and dark: data and assets, `SkillLogo` with its two callers, `AreaHeading`, the toggle.

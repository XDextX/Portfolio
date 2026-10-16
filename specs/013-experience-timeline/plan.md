# Plan 013 — Experience as a vertical timeline

**Spec:** `specs/013-experience-timeline/spec.md` (**approved**, 8 RF).
**Status:** approved
**Approved:** 2026-10-15 · owner approval; tag radius --radius-xs · 192 lines
**Changed:** 2026-10-16 · ordering, helper names and line numbers aligned with what 016–012 landed; exact glyph sizes; 011's `.step__tag` becomes the shared `.tag` (D-4); downloads under the standing OK; one stop at the end · 195 lines · re-approved by the owner 2026-10-16

**Ordering.** Specs 016, 007, 008, 017, 009, 010, 011 and 012 have landed. 016: `tests/helpers/colour.ts`
(`resolveColour(expr, ...layers)`, `contrast`, theme layers); 007: `e2e/helpers/dev-server.ts`
and the theme setup; 008: `public/icons/ui/` (`NOTICE.md`, `LICENSE-tabler.txt`), *ui icons*,
`SectionTitle` (the Experience `<h2>` is its entry) and `e2e/helpers/rendered.ts` (`openIn`,
`installHelpers` with in-page `__toHex` and `__groundOf`, `settled`); 009: `composites`, `worstPoint`,
the section glow; 010: `axTree` and `axQuery`, and `.btn-cv` on
`ABOUT.resumeUrl` with `download`. Glyphs taken: 008 `tool chart-bar briefcase folder mail`, 011
`bulb code database rocket`, 012 `braces layout server table cloud test-pipe`. Before any code:
the spec's prerequisites (all in place: constitution 7, the hook, the UI icon home); the two
downloads in §2 go under the owner's standing OK for icons (2026-10-16). Line numbers are today's.

## 1. Scope and coverage

| Requirement | Covered by |
|---|---|
| RF-1 one dot per job, rail first to last | `.exp-dot` and `.exp-rail` spans per item (§4); e2e *timeline*, at 1280 and 390, plus probe P1 |
| RF-2 period once, before the role, no duration | period first in the card's header; e2e *period* (AX order); guard *experience shape* |
| RF-3 declared company icon, no name | `glyph` field, masked `aria-hidden` span; e2e *company icon*; *ui icons* widened |
| RF-4 chips in data order | `tech` field rendered as `ul.exp-tech > li.tag`; e2e *chips* |
| RF-5 chip list named through `t()` | `aria-label={t('experience.techAria', { company })}`; e2e *chip names* |
| RF-6 contrast floors, each theme | tokens only (§5); guard *experience contrast*; e2e *contrast*, again after the toggle |
| RF-7 one CV link, opens, no download | `<a class=exp-cv href={ABOUT.resumeUrl}>` after the list; e2e *cv link* |
| RF-8 rail left, period in the card at 390 | one breakpoint (§4); e2e *narrow* |
| NFR no spine | `border-left` (`ExperienceCard.astro:57`) and `padding-left` go; e2e *spine* |
| NFR hover gold, nothing lifts | hover rule and its comment rewritten (66-67); e2e *hover* |
| NFR tag radius, no hue, no script; edges | `.tag` on `--radius-xs`; `tokens.test.ts`; *timeline* with JS off; §4 branches, probes P1, P2 |

Every RF is covered. No guard retires. 012 replaced the old licence guard with *logo record*
(`tests/skills.test.ts`); 013 widens 008's *ui icons* instead (§7).

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/data/experience.ts` | modify | `Experience` (3-9) gains `glyph?: 'building' \| 'plant'` and `tech?: string[]`; each job carries the owner's chip list and its glyph. Content, constitution 5. |
| `src/components/ExperienceSection.astro` | modify | Decides the timeline: list item per job with its dot and rail segment, the column widths, the breakpoint, and the CV link after the list (15-42). |
| `src/components/ExperienceCard.astro` | modify | Decides what one job shows and in which order: period, role, company with icon, location, bullets, chips. Spine (56-57, `border-left` in `--accent-color`), shadow hover (66-67) and the 520px aside (144-151) go. |
| `public/styles/03-components.css` | modify | Gains `.tag` beside `.card-frame` (49-54): the inert tag two sections share (D-4). |
| `i18n/locales/es.json`, `en.json` | modify | `experience` (78-80) gains `cv` and `techAria`. |
| `public/icons/ui/building.svg`, `plant.svg` | create, download | Company glyphs, unmodified; rows added to `NOTICE.md`. |
| `tests/experience.test.ts` | create | Guard *experience shape* (§4). |
| `tests/visual-language.test.ts` | modify | Guard *experience contrast*; 008's *ui icons* reads `EXPERIENCES` glyphs. |
| `e2e/experience-timeline.spec.ts` | create | The rendered checks in §4. |

Downloads under the owner's standing OK for icons: Tabler v3.49.0 (as `public/icons/ui/NOTICE.md`),
`outline`, MIT, unmodified; sizes from jsDelivr's package index, 2026-10-16.

| File | Source | Size | Meaning |
|---|---|---|---|
| `building.svg` | `https://cdn.jsdelivr.net/npm/@tabler/icons@3.49.0/icons/outline/building.svg` | 568 B | SD Misiones |
| `plant.svg` | `https://cdn.jsdelivr.net/npm/@tabler/icons@3.49.0/icons/outline/plant.svg` | 535 B | Plantas y Flores |

## 3. Pure logic

Nothing reads a clock or computes a duration: the period is shown verbatim. One helper, in
`tests/experience.test.ts`: `unknownKeys(job: object, allowed: readonly string[]): string[]` —
keys of `job` outside `role company period location bullets glyph tech`. Data half of RF-2: a
`duration`, `start` or `months` key is unknown, and so is a typo.

## 4. Algorithm

**Section** (each job `e`, index `i`, `n = EXPERIENCES.length`):

```
<ul class=exp-list><li class=exp-item>
    <span class=exp-dot aria-hidden=true></span>
    {i < n-1 && <span class=exp-rail aria-hidden=true></span>}
    <ExperienceCard ...e localised, glyph={e.glyph}, tech={e.tech} />
</li></ul>
<p class=exp-more><a class=exp-cv href={ABOUT.resumeUrl}>{t('experience.cv')}</a></p>
```

**Card.** `article.exp-card.card-frame` → `header`: `p.exp-period`, `h3` role, `span.exp-company`
(`{glyph && <span class=exp-company__icon aria-hidden=true style=--icon:url(/icons/ui/{glyph}.svg)>}`
then the name), location; bullets; `{tech?.length > 0 && <ul class=exp-tech aria-label=…>}` of
`li.tag` — absent or empty renders nothing. `idSuffix` untouched (out of scope).

**Geometry**, custom properties on `.exp-list` that every derived value reads: `--dot: 0.75rem;
--rail-col: 2rem; --period-col: 7rem; --gap: 1rem; --dot-y: calc(1.25rem + 0.25rem)` — 1.25rem
is `.card-frame`'s literal padding (the comment says so), so the dot lands on the first line.

- `.exp-item`: `position: relative; padding-inline-start: var(--rail-col)`; list `gap: var(--gap)`.
- `.exp-dot`: absolute, `inset-inline-start: calc((var(--rail-col) - var(--dot)) / 2)`, `top:
  var(--dot-y)`, square `--dot`, round, `background: var(--accent-text)`.
- `.exp-rail`: absolute, 2px wide, centred on the dot's x, `top: calc(var(--dot-y) + var(--dot) /
  2)`, `height: calc(100% + var(--gap))` — every dot sits at the same offset in its item, so a
  segment ends exactly on the next dot's centre; `var(--color-border)`. One job: no segment.
- **≥ 40rem:** `.exp-list { padding-inline-start: var(--period-col) }`; `.exp-period` absolute in
  the card (`position: relative`), `inset-inline-end: calc(100% + var(--rail-col))`, `inline-size:
  var(--period-col)`, `text-align: end`, `top: 1.25rem`, may wrap ("2025 - Presente").
- **< 40rem:** the period is static, first line of the card's header (RF-8); rail at the list's edge.
- Chips: flex wrap, gap 0.35rem, no bullets. Icon: `1em`, `background-color: var(--icon-mono)`,
  mask as 008. `.exp-card:hover { border-color: var(--accent-text) }`, transition `border-color`
  only. CV link: `--accent-text`, 600, underlined, no `target` (D-3).

**Guard *experience shape*.** Per job: `unknownKeys` is empty; `tech`, when present, is an array of
non-empty, trimmed, distinct strings; `glyph`, when present, is a declared value.

**Guard *experience contrast*.** Per theme, 016's layers: `--text-secondary` on `--tag-surface`
≥ 4.5, `--accent-text` on `--main-bg` ≥ 3, `--icon-mono` on `--card-background` ≥ 3; a throw is
an offender. The glow is the e2e's: a resolver cannot composite it.

**e2e.** `/?lang=es` and `/?lang=en`, light and dark (`openIn`), after `settled`; items matched by index to
`EXPERIENCES`. Gold, icon and fill colours from probes of the tokens, never literals.

- *timeline* (RF-1): 1280×800 and 390×844, also with JS off: n dots; each centre's y within its
  card (D-6); segments contiguous, the first's top and the last's bottom within 1px of the first
  and last dot centres; no `.exp-dot`/`.exp-rail` in `axTree`.
- *period* (RF-2): per item, AX text starts `[period, role]`; the period occurs once in it.
- *company icon* (RF-3): one icon per job with a `glyph`, `mask-image` ending in `<glyph>.svg`,
  `aria-hidden`, absent from `axTree`, right edge ≤ the name's first glyph (a `Range`).
- *chips* / *chip names* (RF-4, 5): `li` texts equal `e.tech` in order, 7 and 6 today as the
  spec states; the list's AX name contains `e.company`, differs between jobs, has no `{{`.
- *contrast* (RF-6): chip `color` on its fill; icon on the card; each dot against `worstPoint` of
  `composites()` over the glow the in-page `__groundOf()` reaches. Again after clicking `[data-theme-toggle]`, no reload.
- *cv link* (RF-7): one `.exp-cv`; `ul.exp-list.compareDocumentPosition(link)` is FOLLOWING; its
  `href` equals `.btn-cv`'s; no `download`; `request.get(href)` returns 200.
- *narrow* (RF-8): 390×844: every dot's and segment's right < every card's left; each period box
  inside its card box; `scrollWidth === clientWidth`.
- *spine* / *hover* (NFR): `border-left-width` equals the other three, both themes; on hover
  `border-top-color` equals the gold probe, `box-shadow` and `transform` equal their values at rest.

## 5. Interface

| State | Light | Dark |
|---|---|---|
| Dot on the sheet | `#7A5D10`, 6.01:1 on `#FBFCFD` | `#E3C770`, 6.66:1 on `#243972`; glow measured by *contrast* |
| Chip | `--text-secondary` on `--tag-surface`, 4.74:1 | 6.31:1 |
| Company icon | `#566274`, 6.19:1 on `#FFFFFF` | `#A9B6CD`, 4.78:1 on the card |
| Card at rest / hovered | 1px `--color-border` all round / gold border, no shadow | same |
| ≥ 40rem / 390px | period right-aligned left of the rail / rail at the edge, period in the card | same |
| Single job / no chips / no glyph / forced colours | one dot, no segment / no list / name alone / drawing may vanish | same |

RF-8's cost is the bullets' width at 390. It is measured before the first edit (T0, bullets' box
at 390×844 in es) and recorded in `tasks.md` with the after value; the rail column costs ~32px.

## 6. Decisions

- **D-1 · Period in the card's DOM, positioned out of it from 40rem.** *Discarded:* a sibling of
  the card — at 390 it could only sit inside the card's box with a second frame element.
- **D-2 · One rail segment per item, a real span.** *Discarded:* one `ul::before` — its bottom
  would need the last card's height; pseudo-elements have no box for RF-1 (008 D-3).
- **D-3 · CV link in the same tab, no `download`.** *Discarded:* `target=_blank` — a tab nobody asked for.
- **D-4 · `.tag` in `03-components.css`, 011's values** (two consumers, AGENTS DRY; a latent
  risk, not a visible bug). 011 landed its tag as a scoped `.step__tag`: its `li` gains the shared
  `tag` class and the scoped rule goes, in a commit of its own first (011's e2e keeps reading
  `.step__tag`). Radius `--radius-xs`, the step `00-tokens.css:82` files tags under; 011's plan moves to
  it too (owner decision 2026-10-15; discarded `--radius-sm`, 011's first value). *Discarded:* `Chip.astro` — `--radius-pill` (21), which the
  spec rules out; a scoped copy — two tags that drift.
- **D-5 · Glyph as a field per job.** *Discarded:* a company-to-glyph map — a rename drops the icon.
- **D-6 · RF-1's dot centre "within its card's box" read on y.** *Discarded:* both axes — RF-8.
- **D-7 · The mask paints `--icon-mono`** (012 D-3). *Discarded:* `currentColor` — the name's colour.

## 7. Test strategy

Runners from `package.json`: `npm test` (`vitest --run tests`) for the guards, `npm run test:e2e`
(`playwright test`, Chromium) for boxes, AX names and computed colours (constitution 8). Red
against today: *ui icons* once glyphs are declared, and every e2e check but *contrast*. *Experience
shape*, *experience contrast* and e2e *contrast* are green today: proven by injection only.
**Widened, not relaxed:** 008's *ui icons* also reads each `EXPERIENCES` glyph (exists,
`currentColor` only, in `NOTICE.md`, distinct from other sections'; may repeat within Experience).

Probes, expected **green**, reverted by explicit path: P1 a third job copied into
`experience.ts` (*timeline*, *chips*); P2 that job with `tech: []` (no list in `axTree`).

Injections, expected red, each restored byte-identical by explicit path, named in the commit:

| # | Injection | Expected red |
|---|---|---|
| 1 | a job gains `duration: '3 años'` | experience shape |
| 2 | light `--tag-surface: var(--text-secondary)` | experience contrast, light |
| 3 | dark `--icon-mono: var(--card-background)` | experience contrast, dark |
| 4 | `plant.svg` renamed | ui icons |
| 5 | second job `glyph: 'briefcase'` | experience shape; ui icons (collision) |
| 6 | `.exp-rail` `height: 100%` | timeline (segment short of the next dot) |
| 7 | dot `aria-hidden` removed | timeline (AX node) |
| 8 | period moved after the role | period |
| 9 | `aria-hidden` dropped from the icon | company icon |
| 10 | `tech.toReversed()` in the card | chips |
| 11 | `aria-label='Tecnologías'` literal | chip names (equal names, Spanish in en) |
| 12 | dot `background: var(--brand-accent)` | contrast, light (1.61) |
| 13 | `download` on `.exp-cv` | cv link |
| 14 | `.exp-item` `padding-inline-start: 0` at < 40rem | narrow |
| 15 | `border-left: 3px solid var(--accent-text)` restored | spine |
| 16 | `box-shadow: var(--shadow-md)` back in the hover | hover |

`e2e/about.spec.ts:47-60` still finds the hero's CV link first. Then `npm run build`,
`tests/tokens.test.ts`, and the *Done when* walk: `/` at 1280, 800 and 390, es and en, both
themes, `document.styleSheets` checked first, measured after animations settle.

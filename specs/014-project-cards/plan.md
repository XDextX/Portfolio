# Plan 014 — Project cards in the mockup's design

**Spec:** `specs/014-project-cards/spec.md` (**approved**, 8 RF).
**Status:** approved
**Approved:** 2026-10-15 · owner approval · 208 lines
**Changed:** 2026-10-16 · ordering, helper names and line numbers aligned with what 016–013 landed; prerequisites already in force; seo.test's second buildRepo moves too; exact glyph size; download under the standing OK; one stop at the end · 210 lines · re-approved by the owner 2026-10-16

**Ordering.** Specs 016, 007, 008, 017, 009, 010, 011, 012 and 013 have landed. 016: `tests/helpers/colour.ts`
(`contrast`); 007: `e2e/helpers/dev-server.ts` and the theme setup; 008: `public/icons/ui/` with
`NOTICE.md` and the Tabler licence, the *ui icons* guard, `e2e/helpers/rendered.ts`; 017:
`.btn-action` in `--control-border` (`03-components.css:68`), so both card buttons are bordered
controls and nothing here restyles them; 009: the in-page `__groundOf` (`rendered.ts`); 013: the shared
`.tag` (not used here, D-5); 012: `SkillLogo`, `Logo`, `logoFor`,
`logoFiles` and the Devicon colour logos (Astro per theme), reused instead of a second mapping.
Both prerequisites landed with 012 (constitution 7 with the e2e hook; brand logos as content in
AGENTS.md). Then its own commit: `vitest.config.ts` (D-1), neutral by an unchanged suite count; the
one download goes under the owner's standing OK for icons (2026-10-16).

## 1. Scope and coverage

| Requirement | Covered by |
|---|---|
| RF-1 placeholder above the name | `.card-media` first in the card; e2e *placeholder* |
| RF-2 known language → colour logo | `languageLogo()` into `SkillLogo`; data *logo files*; e2e *logo* |
| RF-3 none or unknown → `file-code` | `languageLogo()` `null`, card masks `PROJECT_MARK`; data *generic*; container *unknown*; e2e *mark* |
| RF-4 badge naming the language | `repoLanguage()` in `.card-lang`; data *language*; e2e *badge* |
| RF-5 no language → no badge | container *no badge*: four no-language fixtures, one positive control |
| RF-6 resolved description | `projectDescription()` (`seo.ts:43`); container *description* against the rendered detail page |
| RF-7 / RF-8 "Demo" only for http(s) | `demoUrl()`; data *demo URL*; container *demo*, *no demo* |
| NFR kept as today | chips, "Código", meta rules unchanged; `sortRepos` untouched; e2e *preview* guards `Resume.astro:50` |
| NFR themes, badge palette, no image | fill `--neutral-200`; e2e *fill*, *badge contrast*, *no project image* |
| NFR a11y, transitions, `t()`, deps | `alt=''`, `aria-hidden` (e2e *logo*, *mark*); `viewtransitions.test.ts:54-60` unchanged; no new key; one same-origin SVG |

Every RF is covered. No guard retires; the card stops printing `N/A`, which no guard reads.

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `vitest.config.ts` | create | `getViteConfig({ test: { include: ['tests/**/*.test.ts'] } })` from `astro/config`: vitest compiles `.astro`; Playwright's spec stays out. |
| `tests/seo.test.ts` | modify | Comment 22-24 ("an alias the runner has none of") goes stale with the config; rewritten in that commit. |
| `src/pages/lib/github.ts` | modify | Gains `repoLanguage`, `demoUrl`: what a repository's raw fields mean to a visitor. `sortRepos` (75-85) untouched. |
| `src/data/tech.ts` | modify | Decides which GitHub languages are known: `REPO_LANGUAGES`, `PROJECT_MARK`, `languageLogo`. |
| `src/components/ProjectCard.astro` | modify | Decides what a card shows and in which order. Lines 15-17 become the helpers; `LanguageBadge` (3, 45) goes; actions move above meta (59-115). |
| `public/icons/ui/file-code.svg`, `NOTICE.md` | download; modify | The generic mark and its row; the licence already sits beside (008). |
| `tests/helpers/github-mocks.ts` | modify | Gains `buildRepo`, moved from `github-helpers.test.ts:13-27`; `seo.test.ts:265` holds a second copy, which goes too: three tests import it. |
| `tests/github-helpers.test.ts`, `tests/seo.test.ts` | modify | Import `buildRepo`; the first gains *language*, *demo URL*. |
| `tests/project-card.test.ts` | create | *logo files*, *generic*, and the container cases. |
| `tests/visual-language.test.ts` | modify | 008's *ui icons* reads `PROJECT_MARK`; its distinctness rules out `code.svg`. |
| `e2e/project-cards.spec.ts` | create | The rendered checks of §7. |

`LanguageBadge.astro` stays for the detail page; `ProjectsSection.astro` and `Resume.astro` are
untouched. **Download, under the owner's standing OK for icons:** Tabler Icons v3.49.0 (008's version),
MIT, `outline`, unmodified, `https://cdn.jsdelivr.net/npm/@tabler/icons@3.49.0/icons/outline/file-code.svg`
→ `public/icons/ui/file-code.svg`, 518 B (jsDelivr's package index, 2026-10-16). Not in the
taken-glyph list. Not fetched by this plan.

## 3. Pure logic

Nothing reads a clock; no function takes a date. In `src/pages/lib/github.ts`:

- `repoLanguage(repo: Pick<GitHubRepo, 'language'>): string | null` — trimmed, or `null` when
  absent, `null` or blank.
- `demoUrl(repo: Pick<GitHubRepo, 'homepage'>): string | null` — the trimmed homepage when it is
  an absolute `http:`/`https:` URL, else `null`; the trimmed string, not `URL.href` (RF-7 links
  `'HTTPS://x.test'` as given, no slash added).

In `src/data/tech.ts`, beside 012's `GENERIC_MARK`:

```ts
export const REPO_LANGUAGES: Readonly<Record<string, string>> = { TypeScript: 'TypeScript', Java: 'Java', Astro: 'Astro' };
export const PROJECT_MARK = '/icons/ui/file-code.svg';
export function languageLogo(language: string | null): Logo | null;
```

GitHub name → `TECH` skill name; the logo is read from that entry, never restated. The keys
equal their values today by coincidence, which is why the table exists.

## 4. Algorithm

```
demoUrl:      s = (homepage ?? '').trim(); s == '' -> null
              try u = new URL(s) catch -> null             # scheme-less 'x.test' throws
              u.protocol in {'http:', 'https:'} ? s : null  # URL lower-cases the scheme
languageLogo: language == null or !Object.hasOwn(REPO_LANGUAGES, language) -> null
              TECH.find(e => e.name == REPO_LANGUAGES[language])?.logo ?? null

ProjectCard:  lang = repoLanguage(repo); logo = languageLogo(lang); demo = demoUrl(repo)
              desc = projectDescription(repo, t('project.meta.noDescription'))
<article class='project-card card-frame' ...>                       # attributes as today
  <div class=card-media>
    {lang && <span class=card-lang>{lang}</span>}
    {logo ? <SkillLogo logo={logo} size={48} />
          : <span class=card-mark aria-hidden=true style=--mark:url(PROJECT_MARK)>}
  <header> h3, transition:name p-{id}-title, unchanged; desc; topics as today
  <footer class=card-footer>
    <nav class=card-actions> "Código"; {demo && <a class=btn-action href={demo}>Demo</a>}
    <div class=card-meta> stars > 0, forks > 0, date — as today
```

**Styles (scoped).** `.project-card`: `overflow: clip`. `.card-media`: `margin: -1.25rem -1.25rem
0` (full bleed, the card's radius clips it), `aspect-ratio: 2 / 1`, `background:
var(--neutral-200)`, `display: grid; place-items: center; position: relative`, `color:
var(--icon-mono)`. `.card-mark`: `3rem` square, `background-color: currentColor`, `mask` /
`-webkit-mask: var(--mark) center / contain no-repeat` (008's icon). `.card-lang`: absolute at
`var(--sp-3)` top and start, `max-inline-size: calc(100% - 2 * var(--sp-3))`, `nowrap`, ellipsis,
`padding: 0.15rem var(--sp-2)`, `--radius-xs`, `--card-background` fill, `--text-secondary` text,
`--fs-xs`, weight 600. `.card-footer`: `flex-direction: column; align-items: flex-start`, so
"Código" alone keeps its natural width. Clearance at the grid floor (`ProjectsSection.astro:149`,
280px): media ≈ 278 × 139, logo top ≈ 45.5px, badge bottom ≈ 36px — ≈ 9.5px clear; `nowrap`
keeps the badge one line high whatever the language.

## 5. Interface

| State | Light | Dark |
|---|---|---|
| Known language | 48px logo on `#DCE2E9`; badge `#566274` on `#FFFFFF`, 6.19:1 | on `#3A578F`; badge `#A9B6CD` on `#2B4372`, 4.78:1 |
| Astro | dark-mark file | white-mark file (012) |
| Unknown (JavaScript, HTML, CSS, C#) | mark `#566274`, 4.74:1 on the fill; badge | mark `#A9B6CD`, 3.49:1; badge |
| No language (README-only) | mark, no badge, fallback description, no chips, "Código" alone, date | same |
| Homepage http(s) | "Código" and "Demo", both bordered (017) | same |
| Long name / language | name wraps / badge ellipsis inside the media | same |
| Logo fails to load | empty slot (`alt=''`), fill and badge unchanged | same |
| Card hovered; past the preview | gold border, media unchanged; `display: none`, lazy logo unfetched | same |
| Error / empty | unchanged | same |

The mark carries no floor (decorative, as the logo); its numbers are recorded, not promised.

## 6. Decisions

- **D-1 · Fixture cards render through Astro's Container API in vitest.** Installed astro is
  5.12.8; `astro/container` exports `experimental_AstroContainer.renderToString(Component, {
  props, params, request })`. It needs `vitest.config.ts` — a file, no dependency (constitution
  1, 7) — and no browser. If the config alone changes the suite's count or result, stop and ask.
  **Done 2026-10-16:** vitest 1.x bundles its own Vite and Astro 5's plugin failed every file
  (14 unhandled errors); the owner approved vitest ^3.2.7 (Vite 6), the same devDependency at a
  new version. With it, and with the config, the suite stays at 14 files, 186 tests.
  *Discarded:* e2e with a mocked GitHub — the routes fetch server-side, out of `page.route`'s
  reach, so the mock needs a test switch in shipping code; a helper test alone (spec, For the plan).
- **D-2 · RF-6 renders `[name].astro` too** (`params: { name }`, `request` with `?lang=`, `fetch`
  stubbed: `/readme/` → 404, `/api/v1/projects/<name>.json` → the fixture). *Discarded:* calling
  `projectDescription` — green if the detail page stopped using it.
- **D-3 · Helpers in `github.ts`, the known-language table in `tech.ts`.** AGENTS sends transform
  logic to `github.ts`; which languages have a logo is content (constitution 5), beside the logos.
  *Discarded:* all in `seo.ts` — `demoUrl` is not metadata.
- **D-4 · The card masks the mark itself; `SkillLogo` draws known logos.** The spec paints the
  mark in `currentColor`; 012's `.mark` paints `--icon-mono` on purpose. *Discarded:* a `mark`
  prop on `SkillLogo` — the wrong colour, or a colour prop for one caller.
- **D-5 · Badge `--text-secondary` on `--card-background`.** *Discarded:* 013's `.tag` — light
  `--tag-surface` is `--neutral-200`, the media's fill: 1.00:1, the badge vanishes.
- **D-6 · Full-bleed media.** *Discarded:* inside the padding — AGENTS:348 gives `14px − 20px`, a
  square box in a rounded card. `-1.25rem` restates `03-components.css:50`: the AGENTS:305
  duplicate, flagged; a token for it would be a second spacing scale.
- **D-7 · "Demo" stays `.btn-action`.** *Discarded:* primary — its gold fill competes with the
  gold title (the card's own note, 24-28).
- **D-8 · e2e expectations from `/api/github-list.json`, cards matched by name.** *Discarded:* a
  dated repository list — it drifts the day a repo gains a language.

## 7. Test strategy

`npm test` (`vitest --run tests`) for data and container; `npm run test:e2e` (`playwright test`)
for boxes, sources, colours. Container cases call `setLocale` from `@i18n/index` (the card's
module) for `es` and `en`, and read `.card-lang`, `.card-desc`, `#project-desc p` and the `<a>`
whose text is `t('project.actions.liveDemo')`.

- *language*: `undefined`, `null`, `''`, `'   '` → `null`; `' Go '` → `'Go'`. *Demo URL*:
  `' https://x.test '`, `'HTTPS://x.test'` → trimmed; `'javascript:alert(1)'`, `'x.test'`,
  `'ftp://x.test'`, `''`, `null` → `null`.
- *logo files* (RF-2): each `REPO_LANGUAGES` key yields a logo whose `logoFiles` are root-absolute
  and exist under `public/`. *Generic* (RF-3): `languageLogo(null)` and `('JavaScript')` both `null`.
- *no badge* (RF-5): the four no-language values — no `card-lang`, no `N/A`; control `'TypeScript'`
  renders one. *Unknown* (RF-3, 4): `'JavaScript'` — badge, no `<img>`, one `card-mark`.
- *description* (RF-6): `null`, `''`, `'   '`, `' Text '` — card text equals the detail page's.
  *Demo* / *no demo* (RF-7, 8): the *demo URL* values through the card; `href` the trimmed URL.

**e2e:** `/` (after "Ver más proyectos" and `settled`) and `/proyectos`, both themes; fail unless at
least one known-language and one no-language card render.

- *placeholder* (RF-1): media box inside the card; media bottom ≤ the `h3` top.
- *logo* (RF-2): one image in the media passes `checkVisibility()`; `currentSrc` pathname equals
  `logoFor(logo, theme)`; `alt === ''`. Dark variant: needs a live Astro card, else injection 11
  is reported unproven.
- *mark* (RF-3): no visible `<img>`; `mask-image` ends in `PROJECT_MARK`; `aria-hidden`.
- *badge* (RF-4): text equals `repoLanguage`; box inside the media, clear of the logo or mark.
  *Badge contrast*: ≥ 4.5 on its background, both themes.
- *fill*: equals a `var(--neutral-200)` probe. *No project image*: every `<img>` in
  `logoFiles(languageLogo(lang))`; `background-image: none` on the media and descendants.
  *Preview*: on `/` before expanding, visible cards = `min(4, n)`.

| # | Injection (restored by explicit path) | Expected red |
|---|---|---|
| 1 | `repoLanguage` skips the trim | language |
| 2 | `REPO_LANGUAGES.TypeScript = 'Typescript'` | logo files |
| 3 | `languageLogo` falls back to TypeScript's logo | generic; unknown |
| 4 | card back to `repo.language ?? 'N/A'` | no badge |
| 5 | card back to `repo.description ?? t(...)` | description (`'   '`) |
| 6 | `demoUrl` accepts any non-blank value | demo URL; no demo |
| 7 | card links `repo.homepage` | demo (untrimmed `href`) |
| 8 | `demoUrl` tests `s.startsWith('https://')` | demo URL; demo (`HTTPS`) |
| 9 | card back to `!!repo.homepage?.trim()`, helper intact | no demo |
| 10 | `.card-media { order: 2 }` | placeholder |
| 11 | card passes `logo.light` in both themes | logo (dark) |
| 12 | `PROJECT_MARK = '/icons/ui/code.svg'` | ui icons; mark |
| 13 | `.card-lang { inset: 50% auto auto 50% }` | badge |
| 14 | `.card-lang { color: var(--neutral-200) }` | badge contrast |
| 15 | `.card-media { background: var(--bg) }` | fill |
| 16 | `.card-media { background-image: url(/og-cover.png) }` | no project image |
| 17 | `Resume.astro` `preview={6}` | preview |
| 18 | `file-code.svg` row deleted from `NOTICE.md` | ui icons |
| 19 | `.card-mark` loses `aria-hidden` | mark |

Then `npm run build` and the *Done when* walk: both routes from a running dev server,
`document.styleSheets` first, every §5 state in light and dark at 1280 and 390px. One commit,
after the owner's approval in both themes: the card with its helpers, data and asset.

# Plan 043 — Project labels in the visitor's language

**Spec:** `specs/043-stars-forks-labels/spec.md` (3 RF).
**Status:** approved
**Approved:** 2026-10-18 · owner approval · 142 lines

## 1. Scope and coverage

| RF / NFR / edge | Covered by |
|---|---|
| RF-1 (the four strings) | `i18n/locales/es.json` line 19 `starsLabel` becomes `"Estrellas: {{count}}"`; `forksLabel` stays `"Forks: {{count}}"`; `en.json` lines 19–20 already read `"Stars: {{count}}"` / `"Forks: {{count}}"` and are pinned, not changed. |
| RF-2 (tooltip and announced text, card) | `src/components/ProjectCard.astro` lines 107–128: `title` becomes the resolved key; the `aria-label` on the `<span>` goes, replaced by a `.sr-only` child carrying the same string, and the visible `formatCount` digits sit in an `aria-hidden` span (D-1). |
| RF-2 (tooltip and announced text, page) | `src/pages/proyectos/[name].astro` lines 110–111: `title={starsLabel}` / `title={forksLabel}`, and the literal `aria-label` goes, so the visible "Estrellas: 1 234" is what is read (D-2). |
| RF-3 (topics, README section) | `[name].astro` line 116 `aria-label={t('project.meta.tags')}` plus `role='group'` (D-3); line 152 `aria-label={t('project.readme.label')}`. Two new keys in both locale files. |
| NFR both themes, nothing visual changes | No CSS edited; the `.sr-only` span is out of flow (`public/styles/02-utilities.css` line 107). Read in light and dark on the dev server (T-5). |
| NFR locale number format | The page keeps `fmtNum` (`Intl.NumberFormat`, lines 40–46) as today; the card keeps `String(count)` in its label as today (D-4). |
| Edge: count 0 | Card still hides the meta (line 104, untouched); the page still shows "Estrellas: 0". A render with zero counts asserts both. |
| Edge: large count on the card | The tooltip and the `.sr-only` text resolve the full count (`1234`), the visible text stays `1.2k`. |
| AGENTS "never bypasses `t()`" | The existing guard in `tests/visual-language.test.ts` (line 157) is widened to literal `title` / `aria-label` values (D-5). |

**Dependency:** spec 044 edits the same sidebar lines of `[name].astro` (spec 044 line 99). 043
lands first; 044's plan starts from this version of lines 106–122.

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `i18n/locales/es.json` | modify | Spanish words for the counts, the topics group and the README section. |
| `i18n/locales/en.json` | modify | The English words for the two new keys (`project.meta.tags`, `project.readme.label`). |
| `src/components/ProjectCard.astro` | modify | Decides what a pointer reads as tooltip and what assistive tech reads for each count. |
| `src/pages/proyectos/[name].astro` | modify | The same for the page's counts, and the names of the topics group and the README region. |
| `tests/project-card.test.ts` | modify | RF-1 as data; RF-2 and RF-3 on the rendered card and page, both locales. |
| `tests/visual-language.test.ts` | modify | The `t()` guard also rejects a quoted literal in `title` / `aria-label`. |

## 3. Pure logic

None new. The card's `formatCount` and the page's `fmtNum` stay as they are; the labels come from
the existing `t(key, { count })`. No clock is read.

## 4. Algorithm

Card, per count `n > 0` (stars shown; forks identical with `forksLabel`):

```
label = t('project.meta.starsLabel', { count: String(n) })
<span title={label}>
  <svg aria-hidden='true' …/>
  <span aria-hidden='true'>{formatCount(n)}</span>
  <span class='sr-only'>{label}</span>
</span>
```

Page: `<span title={starsLabel}>{starsLabel}</span>`, same for forks.

Widened guard, added to the existing loop over `src/**/*.astro`, on `stripComments(src)` from
`tests/helpers/source.ts` (it also blanks `<!-- -->` and `//`, which today's local `/* */` strip
does not):

```
for m of text.matchAll(/(?<![\w-])(title|aria-label)\s*=\s*(['"])([^'"]*)\2/g):
  if m[3].trim() === '': continue          // title='' names nothing
  offenders.push(`${where}  ${m[1]}='${m[3]}'`)
```

`aria-labelledby` cannot match: the `=` must follow `aria-label` directly. A braced value
(`title={label}`) cannot match: the value must open with a quote. Today's tree has exactly the six
literals this spec removes (`grep` on 2026-10-18), so no allowlist is needed.

## 5. Interface

Nothing new is drawn; light and dark render the same pixels as today apart from the word
"Estrellas" in Spanish on the page.

- Card, a repo with stars and forks: visible `★ 1.2k  ⑂ 5`; hovering a count shows "Estrellas:
  1234" / "Forks: 5" (es) or "Stars: 1234" / "Forks: 5" (en); a screen reader reads that string,
  not "1.2k".
- Card, both counts 0: no meta row, as today.
- Page: "Estrellas: 0  Forks: 0" (es), "Stars: 0  Forks: 0" (en), tooltip equal to the text.
- Page, topics: read as a group named "Etiquetas" / "Tags"; README region named "Documentación" /
  "Documentation". A repo without topics renders no group, as today.
- GitHub unavailable (503 state): no counts, no topics, no README region — nothing to label.

## 6. Decisions

- **D-1 · Card: the announced text is a `.sr-only` child, the visible digits `aria-hidden`.** The
  house pattern (`src/components/SkillChip.astro` line 32). *Discarded:* keeping `aria-label` on
  the `<span>` — ARIA 1.2 prohibits naming the generic role, so assistive tech may ignore it and
  read "1.2k", which fails RF-2's "what assistive tech reads". *Discarded:* `role='img'` with
  `aria-label` — valid, but it calls a number an image.
- **D-2 · Page: drop the `aria-label`, let the visible text be read.** The span's text already is
  "Estrellas: 0", which is RF-2's "its text when it has none". *Discarded:* `aria-label={starsLabel}`
  — a prohibited name repeating the text it would replace.
- **D-3 · Topics: `role='group'` beside the translated `aria-label`.** RF-3 asks for both (spec
  changed 2026-10-18): on a bare `<div>` the label names a generic and may never be announced, so
  translating it alone would change nothing a listener hears. *Discarded:* dropping the label — contradicts RF-3's
  check. *Discarded:* `role='list'` — the chips are not list items. The README `<section>` with a
  name is already a region and needs no role.
- **D-4 · Card label keeps `String(n)`, as today.** So 1234 reads "Estrellas: 1234" on the card
  and "Estrellas: 1 234" on the page (`es-CR` groups with a no-break space; `en-US` prints
  `1,234`; measured in Node on 2026-10-18). Both satisfy RF-2, which compares each surface with its
  own count. *Discarded:* `Intl.NumberFormat` on the card — a third copy of the `es-CR` / `en-US`
  ternary (`BaseLayout.astro` line 35, `[name].astro` line 29) that the spec does not ask for;
  extracting it is its own change.
- **D-5 · Widen the existing `t()` guard instead of adding one.** It is the guard AGENTS cites for
  this rule, and these literals passed it because it only read ternaries. *Discarded:* a parallel
  test — two guards for one rule drift. It stays a source scan, with its reason: the rendered
  tests below prove these six attributes, but only a scan of every `.astro` file catches the next
  literal on a component no test renders (constitution 8).
- **D-6 · Rendered checks in vitest through the Astro Container, no new e2e.** The page's counts
  need a repository, and the dev server reads GitHub live, where every repo may have 0 stars and
  the card would render no counts at all. The Container renders a stubbed repo with `1234` stars,
  as `tests/project-card.test.ts` line 125 already does for the page. *Discarded:* an e2e on the
  live list — vacuous when no repo has a star. The browser reading is T-5's look on the dev server.

## 7. Test strategy

Runner `npm test` (`vitest --run tests`); `npm run test:e2e` must stay green, nothing added to it.

- **Data (RF-1):** read `i18n/locales/es.json` and `en.json`; `project.meta.starsLabel` /
  `forksLabel` equal the four strings of RF-1 exactly.
- **Rendered card (RF-2):** for each locale, `buildRepo({ stargazers_count: 1234, forks_count: 5 })`
  rendered with `ProjectCard`. For each count span in `.card-meta`: `title` equals
  `t(key, { count: String(n) })`; it carries no `aria-label`; its `.sr-only` text equals the same
  string; the digits `1.2k` / `5` sit inside an `aria-hidden="true"` element. A zero-count repo
  renders no `card-meta`.
- **Rendered page (RF-2, RF-3):** for each locale, the page through the Container with `fetch`
  stubbed as at line 131, repo `name: 'fixture'`, `stargazers_count: 1234`, `forks_count: 0`,
  `topics: ['web']`. Each count span: no `aria-label`, `title` equal to its own text, and that text
  equal to `t(key, { count: new Intl.NumberFormat(tag).format(n) })` with `tag` `es-CR` / `en-US`.
  `.topics` carries `role="group"` and `aria-label` equal to `t('project.meta.tags')`; `.readme`
  `aria-label` equals `t('project.readme.label')`; in Spanish those are "Etiquetas" and
  "Documentación", and no attribute value in the page equals `Tags` or `Documentation`.
- **Guard:** the widened test in `tests/visual-language.test.ts`; `tests/i18n.test.ts` already
  fails a key missing from one locale.
- **Injections** (each reverted by explicit path):
  1. `es.json` `starsLabel` back to `"Stars: {{count}}"` → the RF-1 data test red.
  2. `title='Stars'` back on the card's star span → the widened guard red, and the card render red.
  3. `aria-label='Stars'` back on the page's star span → the widened guard red, and the page render
     red (span carries an `aria-label`).
  4. `aria-label='Tags'` back on `.topics` → the widened guard red, and the Spanish RF-3 assertion red.
  5. Delete the card's `.sr-only` span → the card render red (no announced string).
  6. Remove `role='group'` from `.topics` → the page render red.

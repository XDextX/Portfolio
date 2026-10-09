# Plan 004 — Per-page titles, descriptions and project JSON-LD

**Spec:** `specs/004-per-page-seo/spec.md` (aprobada). Approved, and read together with it.
**Status:** aprobada

**Q-1 to Q-4 were answered; Q-4 on 2026-10-09.** Their answers are in **D-6** (the wording,
**provisional**), **D-4** (the technologies) and **D-9** (the `- Portfolio` suffix, reversed).
Q-4 chose **`.NET` over `C#`** — the technology `src/data/tech.ts` actually contains — so the
spec is unchanged and RF-2 is enforced instead of contradicted. **Nothing here is blocked.**

**Runner:** `npm test` = `vitest --run tests` (`package.json:11`). `vitest@1.6.1` is in
`devDependencies` and present in `node_modules/vitest`. **Installed — nothing is being
invented here.**

**New dependencies:** none. Constitution 1 (two runtime deps) and constitution 7 (tests run
on what is installed).

---

## 1. Scope and coverage

| RF | What in this plan carries it |
|---|---|
| **RF-1** home supplies its own title | `src/pages/index.astro` passes `title={`${t('seo.home.title', { role: ABOUT.title })} - Portfolio`}` to `BaseLayout` (D-9). Checked by reading that route's `<BaseLayout …>` opening tag. |
| **RF-2** description generated from `ABOUT` + the tech list | `homeDescriptionDraft()` in `src/utils/seo.ts`; the check reads `ABOUT.title`, `seo.home.techs` from both locale files and `TECH` from `src/data/tech.ts`, and asserts over the returned string. **Both halves bite** — the second by membership lookup, not by a punctuation scan (D-4). |
| **RF-3** ≤160 chars, whole words | `homeDescription()`; two assertions, one on length and one on the boundary. |
| **RF-4** `SoftwareSourceCode` | `projectEntity()` returns the object; check asserts `@type`. |
| **RF-5** `codeRepository` | `projectEntity()`; check asserts equality with `repo.html_url`. |
| **RF-6** entity description = what the page shows | `projectDescription()` is the route's resolution, and the route feeds its return value to both the paragraph and the entity. Two calls in the check. |
| **RF-7** `programmingLanguage` present/absent | `projectEntity()` sets the key only when `repo.language` is truthy; check asserts `'programmingLanguage' in entity`. |
| **RF-8** no `applicationCategory` / `operatingSystem` | `projectEntity()` never writes them; check asserts both keys absent. |
| **RF-9** the other three routes unchanged | `tests/seo.test.ts` reads three route files and asserts each still passes `title=` and `description=`. |

**All nine are covered.** What no check in this plan reaches is not a gap in the plan — it is
the spec's stated limit, restated in §7 so nobody mistakes it for coverage.

---

## 2. Files

| File | | Responsibility |
|---|---|---|
| `src/utils/seo.ts` | **create** | Derives per-page SEO metadata from data: the home description text, which description a project page shows, and the project JSON-LD entity. Importable by a test without an alias — that constraint is in §6, decision D-2. |
| `tests/seo.test.ts` | **create** | The nine RFs' checks. |
| `src/pages/index.astro` | **modify** | Supplies its own title and description to the layout instead of inheriting both. Nothing else about the page changes. |
| `src/pages/proyectos/[name].astro` | **modify** | Calls the two project functions; stops carrying a hand-built `jsonLd` literal. |
| `i18n/locales/es.json` | **modify** | Carries the three new home strings. |
| `i18n/locales/en.json` | **modify** | The same three keys. AGENTS.md: both files, always together. |
| `src/layouts/BaseLayout.astro` | **untouched** | Its defaults stay. See D-8. |
| `src/data/about.ts` | **untouched** | Supplies `{{role}}`; it gains no fields. |
| `src/data/tech.ts` | **untouched** | **Read by `tests/seo.test.ts`, not by `src/utils/seo.ts`** — see D-4. Nothing in it changes; it is the yardstick RF-2's second half is measured against. |

`src/utils/seo.ts` imports **nothing** from `src/data/`. That is not a style preference —
see D-2 and D-4. `tests/seo.test.ts` **does** import `../src/data/tech`, and that is not a
contradiction of it: `tech.ts` imports nothing and runs nothing at module load, and
`tests/about.test.ts:6` already imports `../src/data/about` the same way. D-2's objection was
to an **alias** (`@i18n/*`) and to `i18n/index.ts`'s import-time `init()` — neither applies to
a test file reading a flat data array.

---

## 3. Pure logic

**No function in this plan reads a date or the clock.** The one date on the project page
(`repo.updated_at` → `Intl.DateTimeFormat`) is already formatted in the route and stays
there; nothing new needs a "today", so nothing gets a `today` parameter invented for it.

Four exports, two of them the same string at two lengths:

```ts
/** The home description before truncation. What RF-3 compares against. */
export function homeDescriptionDraft(template: string): string

/** The home description, whole words only, at most `maxLength`. */
export function homeDescription(
  template: string,
  maxLength = DESCRIPTION_MAX_LENGTH,
): string

/** The description a project page shows, and hands to the entity. */
export function projectDescription(repo: GitHubRepo, fallback: string): string

/** The `SoftwareSourceCode` entity for one repository. */
export function projectEntity(args: {
  repo: GitHubRepo;
  url: string;          // this page's own absolute URL
  description: string;  // what projectDescription() returned
}): ProjectEntity
```

**Why each of these is a parameter and not a constant or an import:**

- **`maxLength` (default 160).** 160 is a search-engine truncation point, so it belongs in
  one named place — but the edge case RF-3 names, *a single word longer than the maximum*,
  is otherwise only reachable by writing a 200-character fixture. As a parameter it is a
  three-word input. That is the reason it is a parameter, not "for testability" in general.
- **`template` (translated, already interpolated).** The route owns `t()` and substitutes
  `{{role}}` and `{{techs}}` before the call, so the module receives one finished string.
  See D-2 for why the module must not call `t()`.
- **`fallback` (translated).** Same: `t('project.meta.noDescription')` is read in the route
  and passed down. The module resolves `repo.description ?? fallback`, so the route and the
  entity cannot disagree about what "no description" means.
- **`url`.** The route has `Astro.url.origin`; `import.meta.env` inside a unit test is the
  test's environment, not the build's. Passing it in keeps one value (constitution 9's
  shape: state it once, read it everywhere).

**`techs` is gone from both signatures, and that is D-4's consequence.** It existed so the
check could read `TECH` for itself rather than call the module's own picker. With the picker
deleted, the names come from `i18n` and the module has no use for them — a parameter nothing
reads is the "prop nobody reads" anti-pattern in AGENTS.md, so it goes with its reason.

Internal, not exported: `truncateAtWord()`. Exporting it would add public surface nothing
calls.

---

## 4. Algorithm

```
DESCRIPTION_MAX_LENGTH = 160
// No TECH_COUNT: there is no picker. See D-4.

truncateAtWord(text, max):                       // never cuts inside a word
    words = text.split(/\s+/).filter(w -> w != "")
    kept = []
    for w in words:
        candidate = kept + [w] joined by a single space
        if candidate.length > max: break
        kept.push(w)
    if kept is empty:
        return words[0] ?? ""      // first word alone exceeds max -> keep it whole
    return kept joined by a single space

homeDescriptionDraft(template):
    return template with every run of whitespace collapsed to one space, trimmed
    // `template` arrives already interpolated: the route called
    // t('seo.home.description', { role: ABOUT.title, techs: t('seo.home.techs') })
    // and the placeholders are gone. Stated here so an implementer does not
    // "fix" it into a second splice.

homeDescription(template, max = 160):
    return truncateAtWord(homeDescriptionDraft(template), max)

projectDescription(repo, fallback):
    text = trim(repo.description or "")
    return text == "" ? fallback : text

projectEntity({ repo, url, description }):
    entity = {
        "@context": "https://schema.org",
        "@type":   "SoftwareSourceCode",
        name:      repo.name,
        url,
        description,
        codeRepository: repo.html_url,
    }
    if repo.language is truthy:
        entity.programmingLanguage = repo.language   // otherwise the key is absent
    return entity
```

`projectEntity` never receives the route's badge value. The route keeps
`lang = repo.language ?? 'N/A'` for the visible `LanguageBadge`, and that `N/A` **must not**
reach the entity — it is a string where schema.org expects a language name (RF-7). The
route passes `repo.language` to nothing; only `projectDescription`'s result is passed.

---

## 5. Interface

Metadata, so "what is seen" is a browser tab, a search result, a link preview, and one
`<script type="application/ld+json">` block.

| State | `<title>` | `<meta name="description">` | JSON-LD |
|---|---|---|---|
| `/`, normal | `` `${t('seo.home.title', { role: ABOUT.title })} - Portfolio` `` — measured **40** chars es / **38** en | generated, whole words, ≤160; **97** chars es / **98** en, so truncation does not fire on today's data | none today |
| `/`, `seo.home.techs` names one thing | same | names one technology — **RF-2 goes red on "at least two"**, which is the intended signal | — |
| `/`, `seo.home.techs` empty | same | role only — **RF-2 goes red** | — |
| `/`, a `{{placeholder}}` misspelled in either locale | same, with `{{rol}}` **printed literally** | same | — |
| `/proyectos/<repo>` with a description | unchanged | unchanged | `SoftwareSourceCode`, `description` = the repo's own text |
| `/proyectos/<repo>` with `description: null` or `""` | unchanged | `t('project.meta.noDescription')` | same string as the paragraph; `codeRepository` always present |
| `/proyectos/<repo>` with no language | unchanged | unchanged | `programmingLanguage` **absent**; the page still shows the `N/A` badge |
| `/proyectos`, `/404` | unchanged | unchanged | `CollectionPage` / none — untouched, RF-9 |

One behaviour change worth naming: a repository whose `description` is whitespace-only
currently renders an **empty** description block, because `repo.description ?? fallback`
does not fire on `"   "`. After `projectDescription()` trims, it renders
`t('project.meta.noDescription')`. That is the RF-6 edge case behaving correctly, not a
regression.

**The last table row is measured, not predicted.** `t()` in `i18n/i18n.ts:49-55` replaces a
placeholder it has a value for and **leaves it in the string when it does not** — it returns
the placeholder itself, unreplaced. So `{{rol}}` ships inside `<title>` and
`<meta name="description">` with nothing in the console. A missing *key* is loud instead:
`t()` returns the key, and `tests/i18n.test.ts` scans `src/` for `t()` keys and resolves them
in both locales, so a missing `seo.home.*` turns that test red without anything new being
written for it.

---

## 6. Decisions

**D-1 — One module, `src/utils/seo.ts`, four exports.**
*Discarded:* inline each expression in the route it serves. Then RF-4, RF-5, RF-7 and RF-8
have no object to assert on — every one of them would degrade to a grep of the `.astro`
file, which is what constitution 8 exists to stop.
*Also discarded:* `src/pages/lib/`. That directory is inside the routes tree and exists for
one job (GitHub fetching); SEO derivation is not that. `src/utils/` already holds
`locale.ts`.

**D-2 — The translated strings are parameters. The module never imports `@i18n`.**
*Discarded:* importing `@i18n/index` inside `src/utils/seo.ts` and calling `t()` there.
**There is no `vitest.config.ts` in this repo and no alias plugin installed**, so Vite cannot
resolve `@i18n/*` at test time; the value import throws before the first assertion runs.
(`tests/github-helpers.test.ts` survives an `@type/…` import only because `import type` is
erased — that is not evidence that value aliases resolve.) A second, independent reason:
`i18n/index.ts` calls `init(messages, 'es')` at import time, so a test importing it would be
mutating module-global locale state.
*Consequence, and it is deliberate:* the module imports **no data file at all** (D-4 removed
`../data/tech`; `ABOUT.title` is read in the route and passed in), and `tests/seo.test.ts`
imports it as `../src/utils/seo`.

**D-3 — Truncation keeps the word whole even when that word alone exceeds the maximum.**
*Discarded:* `text.slice(0, max)`. It always satisfies the length half and breaks the word —
precisely the 159-character string ending in `Angula` that RF-3's second half was written to
catch.
*The honest consequence:* "≤ max" and "whole words" are **not simultaneously satisfiable for
arbitrary input**. The function always keeps word integrity; RF-3's length assertion is a
guard on the *data*, not a promise the function can always keep. A single technology name
longer than 160 characters turns RF-3 red, which is the signal the spec wants.

**D-4 — REVISED 2026-10-09 (Q-4). The set is `.NET`, not `C#`, and it is held to `TECH` by a
membership check instead of a punctuation scan.**
Q-2 answered the *which* (2026-10-08); Q-4 answered the *conflict that created* (2026-10-09),
choosing the third of the three ways out: **name `.NET`, which is what `src/data/tech.ts`
actually contains.** The spec is untouched, and RF-2 is now true and enforceable rather than
true-by-assertion.

Read `src/data/tech.ts`: `TECH` is a flat array of
`{ name, logo, href?, level?, category? }`, ten entries, five categories — Frontend
(TypeScript, Angular, Astro), Backend (.NET, Java, SSE), Database (PostgreSQL, MongoDB),
Cloud (Azure), DevOps (Docker). All three chosen names are in it, in three different
categories. Two facts settle the rule against the original "one entry per category":

- **TypeScript and Angular are both `Frontend`.** One-per-category drops Angular by
  construction, so the rule cannot express the answer it was asked for. It was not a
  question of picking a better category split: the two named technologies share one.
- **`C#` is not in `TECH` at all.** Naming it made RF-2 false twice over — once against the
  spec's wording, once against the plan's own scan. The nearest entry is `.NET`, a Backend
  *platform*, and `ABOUT.bio` names the two as different things (*".NET Core, Azure Functions
  y Angular, con experiencia en Java, TypeScript, **C#** y SQL"*). `.NET` is the answer that
  tells the truth about the file the requirement points at. The cost of that truth is in D-6.

**The link to `tech.ts` survived, and it is now a check rather than a comment.** The names stay
in `i18n/locales/*.json` — that is where editable content lives (constitution 5), and where
Q-1's "I will change it later" is honoured — but `tests/seo.test.ts` imports `TECH` and
asserts **every name in `seo.home.techs` is a member of it, in both locales.** That is RF-2's
second half as a lookup rather than a proxy. The old worry was that the test could not tell
"sourced from `tech.ts`" from "typed by hand in the JSON"; with a lookup it does not have to —
a name absent from `TECH` is red whatever produced it. **The drift that half existed to
prevent is therefore closed, not conceded.**

How the names are read out of the JSON: split on `/,\s*|\s+and\s+/i`, trim, drop empties.
Measured, that yields `["TypeScript", ".NET", "Angular"]` from **both** locales. **The Spanish
list is comma-only, with no `y`, and that is load-bearing:** `"TypeScript, .NET y Angular"`
would split into `.NET y Angular` and fail the membership check on a correct value.
*Discarded:* a fourth key, `seo.home.techsConnector` (`"y"` / `"and"`), so the Spanish could
read naturally — it puts the connector in the right home, but it is a fourth key for one join,
and join-then-split is one rule instead of two.

**There is still no picker.** `pickTechs()` stays deleted from §4 and `techs` stays out of both
signatures in §3: `seo.ts` has no use for the names, and a parameter nothing reads is the
"prop nobody reads" anti-pattern in AGENTS.md. Changing *which three* are named is a JSON edit,
which is the answer to Q-1.
*Discarded:* one-per-category, extended by adding a `C#` entry. Two Backend entries would
still collide, so the picker would drop one — a rule that cannot be asked for the answer it gave.
*Discarded:* passing `TECH` into `seo.ts` as a parameter and letting the JSON carry a
*reference* to which three. `tech.ts` entries have no `id`, so the reference would have to be
the name (identical to writing the name) or an index (breaks on any reorder), and the `", "`
/ `" and "` join would move out of `i18n/` into code — editable content leaving the home
constitution 5 gives it, which is the same reason one-per-category was abandoned.

**D-5 — `projectDescription()` stays a separate function from `projectEntity()`.**
*Discarded:* folding the fallback into the entity builder. The route needs the description in
three places — the visible paragraph, `<meta>`, and the JSON-LD. If the builder resolved it
internally, the paragraph would resolve it a second time and one of the three could drift,
with nothing able to see it. This is the divergence the spec's own *What these checks do not
settle* section names; splitting the function is what keeps it to one value in the code.
**This mitigates the gap. It does not prove the paragraph prints it** — no check here can.

**D-6 — Three i18n keys per locale, and the wording is PROVISIONAL. The `title` was
REWORDED after approval on 2026-10-09**; see the note under the JSON below.
Answered 2026-10-08 (Q-1): *"decide tú un texto por ahora, lo modifico después"*. The keys,
with `{{role}}` and `{{techs}}`:

```json
// i18n/locales/es.json
"seo": {
  "home": {
    "title":       "Inicio: {{role}}",
    "techs":       "TypeScript, .NET, Angular",
    "description": "Portafolio de {{role}}: {{techs}}. Proyectos, experiencia y contacto."
  }
}
```

```json
// i18n/locales/en.json
"seo": {
  "home": {
    "title":       "Home: {{role}}",
    "techs":       "TypeScript, .NET and Angular",
    "description": "Portfolio of {{role}}: {{techs}}. Projects, experience and contact."
  }
}
```

**Changed after approval (2026-10-09), at the user's request:** `seo.home.title` was
`"Portafolio de {{role}}"` / `"{{role}} portfolio"`, measured **46 / 42** chars with D-9's
suffix. It is now `"Inicio: {{role}}"` / `"Home: {{role}}"`, measured **40 / 38**. Only the
`title` key moved; `techs` and `description` are the strings written here. The new wording is
an improvement and it resolves the weakness the last bullet below used to name — it also
satisfies the guard added in T-5, since `Inicio:` and `Home:` say nothing about the word
`- Portfolio` already ends the title with. **The requirement did not change, only this
provisional wording**, so no RF and no section of this plan moved; the figures are restated
here so no reader measures a title the site no longer sends.

`techs` is its own key rather than the names being typed inside `description`, so the list is
one editable value instead of something spliced across a sentence.
*Measured, interpolated:* description **97 / 98** chars against RF-3's 160; title **40 / 38**
with D-9's suffix. **The description strings got longer, not shorter** — `.NET` is four
characters and the Spanish lost its `y`, so the 2026-10-08 wording cost 96/96 and this one
costs 97/98.
**Truncation therefore never fires on today's data** — it is there for
the data to grow into, which is exactly what D-3 said RF-3's length half is a guard on.
*The voice is the site's own:* `BaseLayout.astro:22`'s default description is
`Portafolio de ${ABOUT.name}: .NET Core, Angular SSR, Java, SSE y optimizacion SQL. Proyectos,
experiencia y contacto.` — the same shape, the name replaced by the role.
*The English is a translation, not a copy:* ES says `Proyectos, experiencia y contacto`, EN
says `Projects, experience and contact`. The default locale is `es` — the hardcoded
`DEFAULT_LOCALE` in `src/utils/locale.ts` (the `.env` variable of that name reads nothing;
AGENTS.md) — so the Spanish is the target string.
*Discarded:* a Spanish template hardcoded in the module. It breaks the English locale, which
is `applyLocale`'s whole purpose, and constitution 10. The `{{name}}` placeholder style
follows `projects.description.withTopic` and `project.meta.starsLabel`, which already exist.

**This text is provisional, and here is exactly what to look at when you change it** —
all of it in the two JSON files, no code involved:

- **Say only what is true of you.** It names `ABOUT.title` and the three technologies you
  chose. No employer, no client, no certification, no seniority beyond the role already in
  `ABOUT` (constitution 9: a public identifier may be linked, never invented). If any clause
  is not true, change it in the JSON — do not soften it in the template.
- **`{{role}}` is not translated.** `ABOUT.title` is one string, `"Full-Stack Developer"`,
  with no per-locale variant, so the Spanish description contains those English words. That
  matches what the home already renders today; giving `ABOUT` a per-locale title is a change
  to `src/data/about.ts` and is **out of scope for this spec**.
- **The title no longer repeats the word the suffix ends it with.** The approved wording
  was `"Portafolio de {{role}} - Portfolio"`, which said the same word twice in one string;
  the 2026-10-09 rewording to `"Inicio: {{role}}"` removes that, and it is what the guard
  "does not repeat the word the suffix already carries" (§7) now enforces in both locales.
- **`.NET` is a platform where `ABOUT.bio` speaks of the language.** The bio names `.NET Core`
  and `C#` as separate things, so a reader comparing description and bio sees one technology
  there and both here. That is honest — the description names what the skills section
  (`tech.ts`) shows, and `tech.ts` shows `.NET` — but it reads as a smaller claim, and Q-4
  chose it deliberately over naming a technology the data file does not contain.
- **The Spanish has no `y`.** D-4's split rule cannot carry one; see D-4. It reads as an
  English list, which is the price of making the guard mechanical.

**D-7 — `RF-1` and `RF-9` are checked by reading the four route files.**
This is a source read, and constitution 8 requires a written reason for one. The reason: **an
Astro route's props to a layout are not importable from a test, and no test in `npm test`
renders a page.** The alternative — checking the served `<head>` — needs a rendering
capability, which this spec's non-functional requirements forbid and for which no dependency
reason exists. Recorded here as constitution 8 asks.
*Discarded:* a `vitest.config.ts` with `resolve.alias` so the module could be imported
through aliases. It adds machinery to a repo that has none, and D-2 shows nothing needs it.

**D-8 — `BaseLayout.astro` is not touched.**
*Discarded:* deleting the `title`/`description` defaults, now that all four routes supply
their own. It would turn a forgotten prop into an empty `<title>` instead of a visible
fallback, and RF-1's guard only exists because there is a default to stop relying on. This
is worth a follow-up spec — *"a route that forgets its metadata gets nothing"* — not this
one.

**D-9 — REVERSED 2026-10-08 (Q-3). The home title carries `- Portfolio`, like the other two.**
The previous decision kept the home on the layout default and refused to unify. The answer is
yes to the suffix, so the pattern is unified now. Measured, the pattern is already two routes
deep and the suffix is a **literal appended in the route**, with the translation carrying only
the label:

- `404.astro:9` — `title={`${t('notFound.title')} - Portfolio`}`
- `proyectos/index.astro:42` — `const pageTitle = `${t('projects.title')} - Portfolio``

The home joins them:
``title={`${t('seo.home.title', { role: ABOUT.title })} - Portfolio`}`` — measured **40** chars
es / **38** en (D-6, after the 2026-10-09 rewording of the key; it was 46/42 as approved).
What it stops inheriting is `BaseLayout.astro:21`'s default,
`${ABOUT.name} - ${ABOUT.title}`, which names the person and the role but never says the page
is the home — the row in the spec's own table that opened this spec.
*Discarded, and this was the old decision:* leaving the home without the suffix, on the
grounds that unifying is a redesign. The site would keep three routes ending in
`- Portfolio` while the one visitors land on does not, which is the disagreement Q-3 was asked
about.
*Also discarded:* taking the suffix from `siteName` (`${ABOUT.name} - Portfolio`,
`BaseLayout.astro:31`). It is the same word, but it is `og:site_name` — a different field —
and adopting it here would put the person's name into a page title. That is the redesign the
old D-9 refused, and it is still refused.
*RF-9 is untouched:* `/404` and `/proyectos` keep their own literal and their own label.
**What is unified is the suffix, not the label shape.** `seo.home.title` carries `{{role}}`,
so the home title says who the page is for; `proyectos.title` and `notFound.title` stay the
plain labels they are. Unifying the *labels* too would mean changing two routes' metadata,
which RF-9 forbids.

---

## 7. Test strategy

**Runner:** `npm test` = `vitest --run tests`. `vitest@1.6.1`, installed, in `devDependencies`.
**New dependencies: none.** `devDependencies` must not grow — that is the check.

**Data checks** (a value returned by an imported function, or by `ABOUT` / the locale JSON):

- `homeDescriptionDraft()` / `homeDescription()` returns for RF-2 and RF-3.
- `projectDescription()` and `projectEntity()` returns for RF-4, RF-5, RF-6, RF-7, RF-8.

**Source reads** (two RFs only, D-7): read `src/pages/index.astro`,
`src/pages/proyectos/index.astro`, `src/pages/proyectos/[name].astro` and `src/pages/404.astro`,
strip `<!-- … -->` **first**, match `/<BaseLayout\b[^>]*>/s`, and assert the tag carries
`title=` and `description=`.

Three things that source read must get right, each because a guard here failed that way:

- **Strip comments first.** An explanatory note in the markup region is emitted verbatim to
  visitors; one that mentions a prop name would be read as one.
- **`s` flag and `[^>]*`.** `proyectos/index.astro` spans seven lines. Known limit: a prop
  value containing `>` truncates the match and the guard silently under-reads. No prop today
  does; if one appears, this is the first thing to revisit.

**What is NOT checked, and what it would cost** — restated from the spec, not re-opened:

- **The served `<head>`.** Needs either a component-rendering dependency or a booted server in
  the suite. Constitution 7 requires a written reason for a new dependency, and there is none,
  so it stays out. When that reason exists, upgrade these checks.
- **Whether the JSON-LD parses.** A malformed block satisfies every assertion above and tells a
  search engine nothing. This stays the spec's one manual step: paste the served block into a
  JSON parser, once.
- **Whether the paragraph prints the value RF-6 compares against.** D-5 keeps it one value in
  the code. That is a mitigation, not a proof.

**Injection probes — one per new guard, each run before the guard is called green.** Revert by
editing the one path the probe touched; never `git checkout -- .` (AGENTS.md: it destroys
uncommitted work silently, and this repo's normal state *is* uncommitted work).

| Guard | Violation injected | Expected red |
|---|---|---|
| RF-1 | delete `title={…}` from `<BaseLayout>` in `index.astro` | RF-1 (fails on the missing prop, never on a served title) |
| RF-1 | misspell a placeholder — `{{rol}}` in `es.json` | RF-1 on a new assertion, no `{{` survives in the built title string. Needed **because** the placeholders were chosen in D-6; `t()` prints an unmatched one silently (`i18n/i18n.ts:53`) |
| RF-1 | put `"Portafolio de {{role}}"` back into `seo.home.title` in `es.json` | RF-1 on **"does not repeat the word the suffix already carries"** — the key would say the word `- Portfolio` already ends the title with. The guard T-5 added at the user's request; it was unproven until this probe |
| RF-2 | put `Vue.js` into `seo.home.techs` | RF-2 on the membership half — `Vue.js` is not in `TECH` |
| RF-2 | put `C#` back into `seo.home.techs` | RF-2 on the membership half. **This is Q-4's own probe**: it fails for exactly the reason the old `C#` wording would have, and that is what makes D-4's claim that the second half bites something other than prose |
| RF-2 | cut `seo.home.techs` to one name | RF-2 on "at least two" |
| RF-2 | cut `TECH` to one entry | RF-2 on membership. **This probe was void under the old wording and is live again** — with no picker in the module, `TECH` is now read by the check, which is what makes the spec's "empty or one entry" edge case reachable |
| RF-3 | hardcode a `.slice(0, 150)` of the draft | RF-3 on the **boundary** half while the length half still passes |
| RF-3 | lengthen `seo.home.description` in `es.json` until the generated text crosses 160 | RF-3 on the **real generated string** — "ships the whole generated text, dropping no word", reporting the measured length. Needed because the fixture probes cannot see the data: with only the length and boundary halves over `homeDescriptionFor()`, an over-long description truncates and stays green |
| RF-4 | `'@type': 'SoftwareApplication'` | RF-4 |
| RF-5 | drop `codeRepository` | RF-5 |
| RF-6 | feed the entity `repo.description` instead of the resolved `desc` | RF-6 on the no-description fixture (`undefined` vs the shown string) |
| RF-7 | `programmingLanguage: repo.language ?? 'N/A'` | RF-7 on the absent-language fixture — the only probe that proves it bites on absence |
| RF-8 | re-add `applicationCategory` | RF-8 |
| RF-9 | drop `description={…}` from `proyectos/index.astro` | RF-9 |

**RF-2's absence half: what it checks now, and what it still cannot see.**
It is a **membership lookup**: split `seo.home.techs` in each locale (D-4's rule), assert every
name is in `TECH`, assert at least two of them, and assert `seo.home.description` contains the
literal `{{techs}}` so the list is interpolated rather than retyped in the sentence.

**This restores the spec's edge case** *"`tech.ts` empty or one entry"*, which had gone
unreachable when the module stopped reading that file: a thinned `TECH` now fails membership
on all three names, which is the red check that edge case was written to ask for.

**The punctuation-residue scan is removed, and it was red on the right data.** The old form
subtracted `ABOUT.title` and the names from the rendered description and asserted the residue
carried no `.` `/` `+` `#` `&`. Measured, that residue is
`"Portafolio de : , , . Proyectos, experiencia y contacto."` — **two full stops the template
itself writes.** It would have failed on `TypeScript, .NET, Angular` exactly as it did on `C#`,
so `#` was never the only reason it was red and changing the technology would not have fixed
it. A guard that cannot tell a technology's punctuation from a sentence's full stop is the
"an assertion satisfied by something other than the thing" failure in AGENTS.md — and, like the
other five, it was green-looking rather than wrong, which is the part that should worry a
reader most. Membership does distinguish them, and it is a lookup rather than a heuristic.
**This adjustment belongs here and not in the spec:** RF-2's wording never mentioned
punctuation, so nothing outside this section moves, and no requirement changes.

**What it still cannot see:** a technology typed directly into `seo.home.description`'s fixed
text rather than through `{{techs}}` — appending `" and Kubernetes"` to the template, say. The
`{{techs}}` assertion narrows that from nobody to the template's author; it does not close it,
and closing it would mean parsing prose, which costs more than it buys.
*Discarded alternative:* a hardcoded blocklist of known-bad names, which is the exact
hand-maintained list that half exists to prevent, and which goes stale silently.

**No new guard is needed for the i18n keys.** `tests/i18n.test.ts` already resolves every
`t()` key found in `src/` in both locales, so `seo.home.*` missing from one file is caught
there. Adding the namespace to both files keeps it green by construction.

---

## Open questions

**All four answered. None of them blocks anything.**

- ~~Q-1 — the wording of the home strings.~~ **Answered:** written, marked provisional, in
  **D-6**. Three keys per locale: `seo.home.title`, `seo.home.techs`,
  `seo.home.description`.
- ~~Q-2 — which technologies the description names.~~ **Answered 2026-10-08:** TypeScript,
  Angular and one backend technology, named in the JSON rather than derived from `tech.ts`.
  See **D-4** for why the one-per-category rule cannot carry that answer.
- ~~Q-3 — whether the home title carries `- Portfolio`.~~ **Answered:** yes. **D-9** is
  reversed and now records the pattern as measured in the two routes that already do it.
- ~~Q-4 — `C#` is not in `tech.ts`, so RF-2 cannot be satisfied as written. Which way does
  it go?~~ **Answered 2026-10-09: `.NET`, not `C#`.** It is what `tech.ts` contains, so the
  spec needs no amendment and RF-2 becomes enforceable instead of false. **D-4** carries the
  membership check that makes it enforceable, and §7 records what it still cannot see.
  *The cost, stated rather than buried:* `ABOUT.bio` names `C#` as the language and `.NET`
  as the platform, so the description names the platform where the bio names both (D-6).
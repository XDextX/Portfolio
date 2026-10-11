# Plan 003 — Value proposition section

**Spec:** `specs/003-value-proposition/spec.md` (**aprobada**). The spec decides *what* and
*why*; this file decides *how* and cites the spec rather than restating it.
**Status:** aprobada
**Aprobada:** 2026-10-10 · approved as written, with three corrections already applied before
approval and verified by reading the code, not the previous draft: RF-5 carried by the e2e
host-set check alone (D-7), the section title confirmed by the owner (D-8), and the
`.section + .section` claim replaced by the measured `border-top` table — it **adds** a hairline
and moves none. No requirement is changed here, added here or reduced here · 682 líneas,
6 RF cubiertos · **cambio 2026-10-11:** la sección pasa a segunda tras el hero (D-14)
y el wording se reemplaza — `es` del dueño, `en` traducción del planificador (D-15).
RF-1, el orden en `Resume.astro`, la hairline (§5), D-3, D-4 y las sondas de RF-1 se
reescriben; el resto sigue valiendo

**Runner, read from `package.json`:** `npm test` = `vitest --run tests` (`package.json:11`).
The e2e runner is `npm run test:e2e` = `playwright test` (`package.json:12`); the spec writes
`npx playwright test`, the same command through another entry point. **New dependencies:
none** — constitution 1 and 7.

**The approved wording is not restated here.** The proposition and the three proof points
live in the spec under *Approved wording* and land in `src/data/about.ts` byte for byte (§2).
They are not re-drafted, improved or shortened.

**The visitor-facing strings are now three: two from the approved wording plus one heading
confirmed by the owner** (`valueProposition.title`, "Lo que construyo" / "What I build",
D-8). Nothing else in this plan invents a string a visitor reads.

**The LCP numbers already exist and are not measured again.** Measured 2026-10-10 on the
home's LCP element `p.about-bio`: 390×844 **88 ms**, 958×888 **152 ms**, 1440×900 **84 ms**.
§4.3 measures the *after* at the same three viewports and puts both sides in the commit.

---

## 1. Scope and coverage

| RF | What in this plan carries it | Where it is checked |
|---|---|---|
| **RF-1** the value proposition is the second section of `/`, after About | `ValuePropositionSection.astro` as the second element rendered by `Resume.astro`, after `AboutSection` (D-3, D-14) | New `test()` in the existing **`e2e/about.spec.ts`**: the `id`s of `main > section`, second is `ValueProposition` (`ids[1]`) |
| **RF-2** three proof points, each a specific claim | `ABOUT.proofPoints` — an array of exactly three `{ es, en }` (D-1) | New `describe` in **`tests/about.test.ts`**: length 3, and every `es` / `en` non-empty after `.trim()` |
| **RF-3** no proof point shares text with another | The same array | New guard in `tests/about.test.ts`: a `Set` over the three texts has size 3, **per locale** |
| **RF-4** the text lives in `ABOUT`, in both locales, and no component spells it | `ABOUT.valueProposition` + `ABOUT.proofPoints`; the component reads both by index | New guard in `tests/about.test.ts`, two halves: the fields exist **and are non-empty in both locales**, and a walk of `src/components/*.astro` carries neither string |
| **RF-5** no runtime dependency and no request to render the section | Nothing is imported that does not already exist; the component emits no `<img>`, `<link>`, `<script>` or `<iframe>` | **One** new `test()` in `e2e/about.spec.ts`: the set of hosts the served document requests, against a captured baseline. **RF-5 is carried by this check alone** — the source half of its wording is unguarded and stays unguarded, D-7 |
| **RF-6** the section renders in the visitor's locale | The `locale` prop read by index; the heading read through `t()` | **No new test.** `tests/i18n.test.ts:40-69` scans every `.astro` / `.ts` under `src/` for `t('…')` and resolves each key in both locale files, so `t('valueProposition.title')` is checked in both the day it is written. `tests/i18n.test.ts:36-38` additionally compares the two files' top-level key sets |
| **NFR** no client-side JavaScript | The component ships no `<script>` — the whole file is frontmatter, template and `<style>` | Nothing to add. `tests/viewtransitions.test.ts:18-22` derives its component list from disk and filters to components shipping a client script, so a scriptless file never enters it |
| **NFR** LCP measured before and after, both numbers in the commit | §4.3 | **Not a test.** Manual, in the browser, against `npm run dev`. The commit message is the only place it is recorded |
| **NFR** interface chrome goes through `t()` | One chrome string: `t('valueProposition.title')` | `tests/i18n.test.ts`, the same scan as RF-6 |
| **NFR** the prose is capped by the measure that protects body prose | `max-width: var(--measure)` on the `<p>` and on each `<li>` (D-11) | **Not a test.** No guard in this repo measures a rendered line length. §5 |

**All six RFs are covered and each carries the check the spec names for it.** What the
checks do **not** settle is listed once, at the end of §7. RF-5's unguarded source half is
listed there, and it is not the spec's list — that limit is this plan's.

**What this plan does not touch**, cited from the spec's *Out of scope* so it is not
re-litigated: the eleven placeholder repositories stay listed in `/proyectos` (16 public
repositories, 0 stars, 0 forks, 5 with code, 11 with only a `README.md`); the bio's last
sentence keeps naming SSE; the home's metadata is spec 004's to adjust after this lands.

---

## 2. Files

| File | | Responsibility |
|---|---|---|
| `src/components/ValuePropositionSection.astro` | **create** | Renders the heading, the sentence and the three points from `ABOUT`, in the visitor's locale, capped by `--measure`. Decides nothing about content and fetches nothing. |
| `src/data/about.ts` | **modify** | Gains `valueProposition` and `proofPoints` under `ABOUT` — the only place either string is written. |
| `i18n/locales/es.json` | **modify** | Gains `valueProposition.title`. |
| `i18n/locales/en.json` | **modify** | The same key. `AGENTS.md`: both files, always together. |
| `src/components/Resume.astro` | **modify** | Imports the new section and renders it **second**, after `AboutSection` and before `HabilitiesSection` (D-14). Nothing else in the file changes. |
| `tests/about.test.ts` | **modify** | One new `describe` carrying the RF-2, RF-3 and RF-4 guards. The eight existing tests are untouched. |
| `e2e/about.spec.ts` | **modify** | Two new `test()`s inside the existing `test.describe.serial`: RF-1 and RF-5. Reuses the dev server the file already starts (D-2). |
| `src/components/AboutSection.astro` | **untouched** | The hero keeps its `<h1>`, its `p.about-bio` and its identity block. Placing the section below it is the spec's decision (D-14); nothing inside moves. |
| `src/pages/index.astro` | **untouched** | It renders `<Resume>`; the new section arrives through `Resume`, and the home's title and description are spec 004's to adjust. |
| `src/pages/proyectos/**` | **untouched** | `/proyectos` composes `ProjectsSection` directly (`src/pages/proyectos/index.astro:4`), never `Resume`, so the new section does not appear there. |
| `public/styles/**` | **untouched** | Every `var()` in the new `<style>` resolves to a token that already exists — `--fs-lg`, `--lh-normal`, `--sp-3`, `--measure`, `--text-color`, `--text-secondary`, `--accent-text`. **No new token, so neither `themes/light.css` nor `themes/dark.css` is touched**, which also keeps `tests/tokens.test.ts:253` ("no token is declared in a theme and read by nobody") green. |
| `src/styles/global.css` | **untouched** | Nothing new to alias. |
| `package.json` | **untouched** | No dependency. `tests/seo.test.ts:827` already asserts `dependencies` and `devDependencies` by value; touching it breaks that assertion. |
| `tests/comments.test.ts` | **untouched** | The component ships **no** HTML comment (D-6), so the sixteen-entry `ALLOWED` set at `:174-194` is unchanged. If a comment is ever added, the entry goes on `ALLOWED` in the same change, deliberately — never as a side effect. |
| `tests/i18n.test.ts` | **untouched** | RF-6 needs no new guard; its existing scan already reaches the new component. |
| `tests/tokens.test.ts` | **untouched** | Nothing new is defined, so there is no typo to catch and no invented token to invent. |
| `tests/markup.test.ts` | **untouched** | No `<script>`, no `itemscope`, no `childNodes`, no `data-*` hook. |
| `tests/visual-language.test.ts` | **untouched** | No `:hover` rule at all (D-12), no `font-weight` above 700, no `lang === 'es' ? … : …`. |
| `tests/viewtransitions.test.ts` | **untouched** | The file's client-script list is derived from disk; no script, no entry. Its `currentScript` sweep at `:46-50` iterates every component and passes on a file with no script. |
| `tests/seo.test.ts` | **untouched** | `package.json` grows by nothing. No route metadata moves. |
| `tests/notfound.test.ts` | **untouched** | The new component lives in `src/components/`, not `src/pages/` (constitution 5). |

### The data

Two fields under `ABOUT`, next to `bio`, which is the shape already there: an object keyed by
locale. The three points are an **array**, not an object keyed by `1` / `2` / `3` — RF-2
asserts a count, and a count is what an array holds (D-1).

```ts
// src/data/about.ts — two fields added under ABOUT, after `bio`
    // Owner's Spanish 2026-10-11; English is the planner's translation per the owner's
    // "tradúcela tú" (D-15). Copied byte for byte from spec 003's "Approved wording".
    // Editable content lives here and nowhere else (constitution 5).
    valueProposition: {
        es: "Desarrollo soluciones web completas, desde la arquitectura hasta su puesta en producción.",
        en: "I develop complete web solutions, from architecture to production deployment."
    },
    proofPoints: [
        {
            es: "Código mantenible: priorizo las buenas prácticas, las pruebas y la documentación de las decisiones técnicas.",
            en: "Maintainable code: I prioritize good practices, testing, and documenting technical decisions."
        },
        {
            es: "Experiencia comprobable: más de seis años desarrollando soluciones de software para necesidades reales.",
            en: "Proven experience: over six years developing software solutions for real needs."
        },
        {
            es: "Desarrollo de principio a fin: trabajo con backend, frontend, bases de datos y despliegue para entregar funcionalidades completas.",
            en: "End-to-end development: I work with backend, frontend, databases, and deployment to deliver complete features."
        }
    ]
```

`ABOUT` is `as const` and stays that way. Indexing a narrowed entry by a `'es' | 'en'` key
resolves without a cast — the same thing `AboutSection.astro:56` already does with
`ABOUT.bio[lang]`. **No new exported type, no helper, no derivation.**

### The component

```astro
---
import { ABOUT } from '../data/about';
import { t } from '@i18n/index';

export interface Props {
	locale?: 'es' | 'en';
}

const { locale = 'es' } = Astro.props;
const titleId = 'value-prop-title';
const title = t('valueProposition.title');
// Indexed by locale, not chosen by a ternary: t() is for chrome, ABOUT is for
// this sentence, and visual-language.test.ts:131 reads the ternary shape as prose
// living in the component.
const proposition = ABOUT.valueProposition[locale];
const points = ABOUT.proofPoints.map((p) => p[locale]);
---

<section class='section' id='ValueProposition' aria-labelledby={titleId}>
	<h2 id={titleId}>{title}</h2>

	<p class='value-proposition'>{proposition}</p>

	<ul class='value-points'>
		{points.map((text) => (
			<li>{text}</li>
		))}
	</ul>
</section>
```

`class='section'` is not optional: it carries the shared padding (`04-layouts.css:1-3`) and
it is what the `.section + .section` hairline keys on (§5). `aria-labelledby` points at the
`<h2>`, so the section gets its accessible name without a second chrome string — the same
shape as the four sibling sections. The `<h2>` carries **no class**; D-9 says why.

Styles, every value a token that already exists:

```css
.value-proposition {
	font-size: var(--fs-lg);      /* 1.25rem — "card titles, section intros" */
	font-weight: 600;             /* inside the variable font's 100–700 range */
	color: var(--text-color);
	line-height: var(--lh-normal);
	max-width: var(--measure);
	/* `p` already carries margin: 0 0 var(--sp-4) from 01-base.css:58-60 — not repeated. */
}

.value-points {
	margin: 0;
	display: flex;
	flex-direction: column;
	gap: var(--sp-3);
	/* The UA disc stays: three lines with no marker do not read as three items. */
}

.value-points li {
	max-width: var(--measure);    /* on the li, not the ul — see §5 and D-11 */
	font-size: var(--fs-base);
	color: var(--text-secondary);
	line-height: var(--lh-normal);
}

.value-points li::marker {
	color: var(--accent-text);    /* the site's gold, for the same reason the hover border is */
}
```

**No `:hover` rule, and that is deliberate** (D-12): the section is static prose with nothing
to interact with. Adding one would mean inventing a target.

### The key

```json
// i18n/locales/es.json                        // i18n/locales/en.json
"valueProposition": {                          "valueProposition": {
  "title": "Lo que construyo"                    "title": "What I build"
},                                               },
```

A **new top-level namespace**, placed at the end of each file after `notFound`. Neither
locale file is alphabetical today — `layout`, `project`, `projects`, `skills`, `about`,
`experience`, `contact`, `nav`, `seo`, `notFound` — so position carries no meaning, and the
end keeps the diff to one hunk per file.

---

## 3. Pure logic

**None.** This spec adds no function, so there is no signature, no return type and no clock
to parameterise. What the component does is two property reads and one `t()` call, all of
them expressions:

```ts
const proposition = ABOUT.valueProposition[locale];        // string
const points = ABOUT.proofPoints.map((p) => p[locale]);   // string[]
```

Neither reads `new Date()` and neither needs a "today" parameter invented for it — there is
no date anywhere in this section, and nothing to sleep for in a test. The block is this
short because the work is this short; stating it is more useful than leaving it empty.

---

## 4. Algorithm

### 4.1 Render order

`Resume.astro` renders `<AboutSection lang={locale} withJsonLd={true} />` first. The
`<ValuePropositionSection>` element the first landing placed above it moves below it
(D-14):

```
import ValuePropositionSection from './ValuePropositionSection.astro';   // in the import block
...
<AboutSection lang={locale} withJsonLd={true} />
<ValuePropositionSection locale={locale} />
<HabilitiesSection locale={locale} />
<ExperienceSection locale={locale} />
<ProjectsSection … />
<ContactSection />
```

`Resume.astro` keeps its own `locale` variable and passes it down; the new component does
not resolve a locale itself. The four sections below stay in their current order — RF-1 moves
nothing but itself.

`<main>` is a plain block (`src/styles/global.css:35-42`): no `display: flex`, no `order`, no
grid. Document order **is** visual order, which is why a DOM-order assertion is a fair proxy
for "the second section on the page" here rather than merely a weaker version of it.

`Resume.astro` is imported by `src/pages/index.astro:2` and by nothing else, so the section
lands on `/` and nowhere else.

### 4.2 The two Playwright assertions

Both go in the existing `test.describe.serial('About section e2e')` in `e2e/about.spec.ts`,
which already owns a dev server on `http://localhost:4321` (`e2e/about.spec.ts:5,7-8,59-65`).
D-2 says why they cannot live in a new file.

```ts
// RF-1 — the value proposition is the SECOND section
const ids = await page.$$eval('main > section', (els) => els.map((e) => e.id));
expect(ids[1]).toBe('ValueProposition');
```

`'main > section'`, not `'section'`. `<main>` holds the topbar `<header>` and the slot
(`BaseLayout.astro:90-96`), so a direct-child selector reads exactly the sections and is
unbroken by a `<section>` appearing in `<head>` or in a footer later. Taking `[1]` off the
array `$$eval` already flattened into JavaScript is not the `childNodes` indexing
`tests/markup.test.ts:164` forbids: that rule is about DOM nodes whose text is being
rewritten, not about a list.

```ts
// RF-5 — the baseline set is captured first, not written from memory (§4.2.1)
const hosts = new Set<string>();
page.on('request', (r) => hosts.add(new URL(r.url()).host));   // BEFORE goto
await page.goto(DEV_URL);

const origin = new URL(DEV_URL).host;
const extra = [...hosts].filter((h) => h !== '' && h !== origin && !HOME_HOSTS.has(h));
expect(extra, `the home requests hosts it did not request before: ${extra.join(', ')}`).toEqual([]);
```

Three things that assertion has to get right:

- **The listener is attached before `page.goto`.** Attached after, it observes nothing and
  the set is empty — which is exactly what "green because it saw nothing" looks like.
- **`about:blank` and `data:` URLs yield `host === ''`**, which the filter drops. Left in,
  they print as an empty string in the failure message.
- **`HOME_HOSTS` is captured before the section is added**, from the home as it renders
  today — not guessed from memory, and not widened until it accepts anything.

#### 4.2.1 How `HOME_HOSTS` is obtained

Run the capture once against `/` **before** `Resume.astro` gains the new element, and write
the resulting host list into the test as a literal set. Reading the source suggests what the
set should contain — `ABOUT.avatar` is `https://github.com/XDextX.png` (`src/data/about.ts:22`)
and `BaseLayout.astro:70` preconnects `https://avatars.githubusercontent.com`, so a redirect
from the first to the second is expected — but a reading is not a measurement, and the
baseline exists precisely so a host nobody predicted fails the assertion instead of being
absorbed into it.

Everything else the home loads is same-origin: the stylesheets are `/styles/…`
(`BaseLayout.astro:72-79`) and the fonts are self-hosted (`public/fonts`, constitution 2).

### 4.3 The LCP measurement

**Who:** the implementer, by hand, in the browser, against `npm run dev`. No test, no
script, no threshold.

**What:** a performance trace reporting **both the value and the element**. The section
now sits below the hero, so the after run confirms `p.about-bio` was not displaced, and a
number without an element beside it cannot be compared with the before. Through the
chrome-devtools MCP: `emulate({ pageId, viewport: "390x844" })`, then
`performance_start_trace`, and read LCP and its element from the trace.

**Three traps this repo has already paid for**, from `AGENTS.md`:

- `resize_page` **does not move `innerWidth`**. The viewport goes through `emulate`, or all
  three runs measure the same width.
- **Measure after animations settle.** A width or a transform read mid-transition returns a
  value that was never rendered.
- The Code Mode runtime **chokes on a long template literal inside `evaluate_script`**. If
  a script is needed to read the entry, store the helper on `window` in one short call and
  read it back in a second.

**Where it is written:** the **commit message**, before and after side by side, which is
what the spec's *Done when* asks for. The before is the recorded figure — `p.about-bio`,
2026-10-10, 390×844 **88 ms**, 958×888 **152 ms**, 1440×900 **84 ms** — and it is **not
measured again**; this plan cites it. The after is measured at the same three viewports on
the same dev server, and **records which element it was**.

**A caveat the commit should carry.** The before was measured against a working tree whose
state this plan does not control. If `main` has moved since 2026-10-10, the pair is not a
clean A/B, and the message should say so rather than present two numbers as a controlled
comparison.

---

## 5. Interface

Static server-rendered content. There is **no loading state, no error state and no empty
state**, and none is invented: the section performs no fetch, so nothing can be pending or
fail. The only state it can be in besides "correct" is "a locale string is empty", and
RF-2, RF-4 and RF-6 all fail before that ever renders (the spec's *A locale missing the
text* edge case).

| State | What is seen |
|---|---|
| `/`, `es` | `<h2>` "Lo que construyo"; the Spanish sentence at `--fs-lg` / 600 in `--text-color`; three bullets at `--fs-base` in `--text-secondary` with gold markers |
| `/`, `en` | The same markup. The heading comes from `en.json`; both bodies are indexed by the same `locale` prop. **No second mechanism and no ternary** — switching locale changes the prop and nothing else |
| `/`, either locale, dark theme | Identical markup. Every colour above is a token both themes redefine, so nothing is hardcoded and nothing needs a theme override |
| `/` at 390×844 | One column, unchanged. `--measure` is 60ch — the token's own comment at `00-tokens.css:49-52` records it as 577px, about 72 characters of Plex Sans at 16px, and `ch` scales with the font size — so the cap never fires on a phone and the wrap is the browser's |
| `/` at ≥1280px | The paragraph and each bullet stop at `--measure`. The spec's NFR names the 98–101 character line that uncapped prose runs to from 1280px up |
| `/proyectos`, `/proyectos/[name]` | The section is **absent**: those routes compose `ProjectsSection` directly and never render `Resume`. Nothing to see and no state to handle |

**The cap is on the `<p>` and on each `<li>`, not on the `<ul>`, and that is arithmetic.**
`box-sizing: border-box` is global (`01-base.css:3-7`), so a `max-width` on the `<ul>` would
bound the box *including* the UA `padding-inline-start` a bare list still carries — the cap
would apply to less than the text it was chosen for. On the `<li>` it is the text.

**The one visible consequence of moving the section, and it should be looked at on
purpose.** Measured on the served home before the first landing (viewport 958, light theme), the
computed `border-top` of each `.section`:

| `.section` | `border-top` |
|---|---|
| `About` | `0px` |
| `skills` | 1px gold |
| `Experience` | 1px gold |
| `Projects` | 1px gold |
| `Contact` | `0px` |

`04-layouts.css:12` is `.section + .section { border-top: 1px solid var(--accent-color); }`,
and an adjacent-sibling selector matches **every adjacent pair**, not the first section.
With the section second, the added hairline sits between `About` and the value
proposition, and moves **none** of the three existing ones: `skills`, `Experience` and
`Projects` keep their hairline — `skills` keeps the rule with a new predecessor.
What changes against the first landing is that `About` is first again and loses the
top border it had gained. That is a rendering consequence to look at,
not a rule to move in CSS.

**Context, found on the way, and not a task here:** `Contact` has no `border-top` because
its immediately preceding sibling element is the bundled `<script>` from
`ProjectsSection.astro:96-150`, which breaks the adjacency of `.section + .section`. That is
how the page has been since before this spec, it is visible in the table above, and fixing it
belongs to a change of its own.

---

## 6. Decisions

**D-1 — `valueProposition` and `proofPoints`, flat under `ABOUT`, `{ es, en }` per entry.**
The names are the spec's own *Definitions* vocabulary, so the data file and the requirement
document use one word for the thing.
*Discarded:* nesting under a `value: { proposition, proofPoints }` object. It reads tidier
and adds a level every reader walks through to reach the same two fields; `ABOUT` is flat
today (`name`, `title`, `location`, `avatar`, `resumeUrl`, `socials`, `bio`).
*Also discarded:* `proofPoints` as an object keyed `"1" "2" "3"`. RF-2 asserts **exactly
three**; `Object.keys()` returns three for an object with one key too, so the count would
pass on data that is not a list.
*Also discarded:* `{ es: [...], en: [...] }`, one array per locale. The two are the same
three claims in two languages, so the count lives once and a locale switch cannot produce a
different number of points.

**D-2 — Both Playwright tests go in the existing `e2e/about.spec.ts`.**
This is a port collision, not tidiness. `e2e/about.spec.ts:7-8` spawns `npm run dev` and
waits for `http://localhost:4321`; `fullyParallel: false` in `playwright.config.ts:7`
serialises tests *within* a file while **files still run in parallel across workers**. A
second spec file with its own `beforeAll` binds the same port and one of the two servers
loses.
*Discarded:* `e2e/value-proposition.spec.ts`. It is the tidier split and the wrong one;
making it work means a `webServer` block in `playwright.config.ts` and rewriting the existing
file's server — a repo-wide e2e change this spec does not ask for.
*Recorded, not fixed:* the `describe` label still says `'About section e2e'` while the file
now also covers the second section of the home. Renaming it is a separate edit and is not
part of this change. Playwright is **not** in `.husky/pre-commit` (which runs `npm test` and
nothing else), so RF-1 and RF-5 run by hand. The spec calls that out and this plan does not
attempt to change it.

**D-3 — `<section class='section' id='ValueProposition'>`, second element of `Resume.astro`, after `AboutSection` (D-14).**
`class='section'` carries the shared padding (`04-layouts.css:1-3`) and is what the hairline
keys on.
`id='ValueProposition'` follows the two most recent siblings, `ExperienceSection.astro:15`
and `ContactSection.astro:19`. `HabilidadesSection.astro:15` uses `id='skills'` and
`ProjectsSection.astro:47-52` has no id at all, so the repo is already inconsistent;
matching the newest is the cheapest rule that is still a rule. Nothing links to these ids —
no `href='#…'` exists in `src/` — so the id exists for RF-1's assertion and for a human
reading the served document.
*Discarded:* no id, with the Playwright assertion matching the heading text instead. That
couples the guard to a string the owner can edit without touching the test, and a heading is
exactly the string most likely to be edited.

**D-4 — `<h2>`, the level its siblings take.**
`AboutSection.astro:46` holds the page's only `<h1>` — the name — and `aria-labelledby` on
that section points at it. The new section takes the level the other four take:
`HabilidadesSection.astro:16`, `ExperienceSection.astro:16` and `ContactSection.astro:23` are
all `<h2>`.
**The cost, stated rather than buried, and now decayed:** while the section rendered
first, the outline became `h2 → h1 → h2 → h2 → h2 → h2`, so a level-2 heading was
announced before the page's `h1`. That was the price of the original placement. With the
section second (D-14), the hero's `h1` is first again and the section's `h2` sits among
its sibling `h2`s — the cost is gone, and the spec's own *`h2` heading level* edge case
reads as it did before the section existed.
*Discarded:* `<h1>`. Two `h1`s on one page, and the identity block below still owns the real
one.
*Discarded:* a visually hidden heading, so the top of the page is the sentence alone. It
leaves the section with an accessible name no sighted reader can see, and it would be the
only place on this site where chrome is hidden on purpose.

**D-5 — A `locale` prop defaulting to `'es'`, as `HabilidadesSection.astro:6-10` takes it.**
Three of the five section components name it `locale`; `AboutSection.astro:7` names it
`lang`. `locale` is the majority and matches the `Resume.astro` variable it comes from.
*Discarded:* no prop, with the body read through `t()`. `t()` resolves locale JSON, and this
sentence is `ABOUT` data — putting it in the locale files would give it a second home and
put a `{{ }}` placeholder in it for no reason. `ContactSection` takes no prop because
**all** of its strings are chrome; that rule does not transfer.

**D-6 — The component ships no HTML comment, so `tests/comments.test.ts` is not touched.**
The allowlist holds sixteen known labels (`tests/comments.test.ts:174-194`) and adding one
is a deliberate act, not a side effect. `AboutSection.astro:43` carries `<!-- Content -->` to
orient a reader of its own source; this file is a section, a heading, a paragraph and a list,
and there is nothing in it to orient anyone. Implementation notes go in the frontmatter,
where they never reach a visitor.
*If a comment is ever added:* the label goes on `ALLOWED` **in the same change**, with its
reason written down.

**D-7 — RF-5's source clause, "the source names no new host", gets no guard, and no scanner
is written.**
There is no such guard today: nothing under `tests/` scans `src/` for hosts. Constitution 2
states the rule and names its own check, and **no test reads it** — that hole predates this
spec.
*Discarded:* writing the scanner. It would have to allowlist every host already spelled in
`src/` — `github.com` in `ABOUT.avatar`, `portfolio-dext.vercel.app` in `JsonLdAbout`,
`schema.org` in the JSON-LD `@context`, plus every outbound `href` — and it would then be
checking a hand-maintained list, which is the maintenance burden the rule exists to avoid. It
is also a source grep over the whole tree, which constitution 8 requires a written reason
for, and no such reason exists here.
*What carries RF-5 instead:* the request-set assertion in §4.2, on **rendered output** —
the surface constitution 8 asks for. A `<link>` to a font CDN, an `<img>` on a third host or
a `<script src>` each produce a request and turn that assertion red, which is the failure the
static scan was for.
**The honest limit:** it settles the rendered home, not `src/` as a whole. A host named in
source but never requested — an outbound link, a JSON-LD `@id` — passes, and that is
correct: constitution 2 governs what a browser **fetches**, not what a file spells.

**D-8 — The section heading is `valueProposition.title`: "Lo que construyo" / "What I build".
This is decided, not provisional.**
The owner confirmed it, and the 2026-10-11 change keeps it. The 2026-10-10 proposition
shared its verb — *"Construyo productos web completos"* / *"I build complete web
products"* — so the title and the sentence under it were **one claim, not two**; with the
new *"Desarrollo…"* sentence the title stands as the confirmed name it already is, and the
section still introduces nothing new being said.
*Discarded:* "Propuesta de valor". That is the spec's vocabulary for the author's benefit; a
visitor has never heard it, and it would put internal terminology at the top of the
section.
*Discarded:* no visible heading, with `aria-label` on the section. Four of the five sections
carry a visible one, and this section should not open with the shape the rest avoids.
*Consequence to accept:* changing it later is an edit to two JSON files and nothing else.
*Unchanged by the 2026-10-11 change:* the title stays "Lo que construyo" / "What I build" —
no task here touches either locale file.

**D-9 — The `<h2>` carries no class, not `class='section__title'`.**
`section__title` is defined at `04-layouts.css:5-10` (`--fs-2xl`, `--accent-text`,
`margin-bottom`) and used by **one** component, `ProjectsSection.astro:57`, whose heading
wraps an `<a>` to `/proyectos` and wants to read as a link. `HabilidadesSection`,
`ExperienceSection` and `ContactSection` all render a bare `<h2>`; `01-base.css:52-56` sets
only `line-height` on `h2`, so that is the size they already show.
*Discarded:* `class='section__title'`, which would make this section a 32px
gold title while its siblings stay at the level they use.

**D-10 — Keep the UA bullet and colour the marker with `--accent-text`.**
*Discarded:* `list-style: none`, which is what `ExperienceSection.astro:34-36` and
`ContactSection.astro:49-51` do for their lists. That is right where each row is a card with
its own border and role, and wrong here: three unlabelled lines of the same weight do not
read as three items.
*Discarded:* a hand-drawn SVG marker per `<li>`. Fixed-size decorative markup is a duplicate
waiting to happen, and no guard settles whether it matches the list it sits in.
`::marker` is valid CSS and takes an existing token; `tests/tokens.test.ts:83` reads
`var(--x)` inside `::marker` like any other declaration, so a rename breaks the build rather
than the page.

**D-11 — The measure goes on the `<p>` and on each `<li>`.**
See §5: `box-sizing: border-box` is global, so a cap on the `<ul>` counts its UA padding.
*Discarded:* `max-width` on the `<ul>`, one declaration instead of two. It produces a cap
nobody chose, smaller than the one the NFR asks for, and its size depends on a UA default
rather than on the token.

**D-12 — No `:hover` rule on this component.**
The section is static prose with no link, button or focusable control in it, so there is
nothing to hover and no target to attach one to. `AGENTS.md`'s rule — hover means the border
turns gold, nothing lifts, never a background change alone — is satisfied here by having no
hover state at all.
*Discarded:* a hover on the section or on the list, as a "this is interactive" signal. It
would signal nothing; nothing is interactive.

**D-13 — The LCP "after" is measured by hand and lands in the commit message.**
D-2 of the skill asks what the plan decides about measurement; the answer here is that
nothing is automated.
*Discarded:* a committed LCP threshold test. The renderer, the machine and the dev server
all move the number, and a threshold that fails on someone else's laptop trains everyone to
ignore it. The spec asks for the two numbers in a commit, not for a gate.

**D-14 — Second place, after `AboutSection`: the owner's 2026-10-11 decision, not a
measurement.**
The first landing put the section first; the owner moved it to second, between About
and Habilities. RF-1 is rewritten around `ids[1]`, D-3/D-4 and §5 follow it, and nothing
else in the plan changes meaning.
*Discarded:* staying first. It was the approved placement until the owner reversed it,
and keeping it would ship against an explicit owner decision.

**D-15 — The new English wording is the planner's translation, copied byte for byte
from the spec.**
The owner wrote the new Spanish and answered "tradúcela tú" for the English, so the
spec records the translation as a planner decision, not as the owner's words. The
implementer copies both locales from the spec's *Approved wording* without re-drafting,
improving or re-translating — the same rule the first landing followed (D-8's title,
which does not change, is the proof it works).
*Discarded:* waiting for an owner-written English version. It would leave RF-2/RF-4/RF-6
without both locales, and the owner already gave the alternative: translate it here and
record who did.

---

## 7. Test strategy

**Runner:** `npm test` = `vitest --run tests` (`package.json:11`), everything installed in
this repo, **no new dependency** (constitution 7). The e2e half runs under
`npm run test:e2e` = `playwright test`, by hand, and is **not** in the pre-commit hook.

### What is checked as data

Importing `ABOUT` and asserting on what it holds — `tests/about.test.ts`, one new `describe`:

```ts
describe('the value proposition data', () => {
  // RF-2
  expect(ABOUT.proofPoints).toHaveLength(3);
  for (const p of ABOUT.proofPoints)
    for (const l of ['es', 'en'] as const)
      expect(p[l].trim(), `proof point ${l}`).not.toBe('');

  // RF-3 — per locale: `es` and `en` differ by construction, so comparing across
  // locales would pass on two identical Spanish strings.
  for (const l of ['es', 'en'] as const)
    expect(new Set(ABOUT.proofPoints.map((p) => p[l])).size).toBe(3);

  // RF-4, half one
  for (const l of ['es', 'en'] as const)
    expect(ABOUT.valueProposition[l].trim(), `proposition ${l}`).not.toBe('');

  // RF-4, half two — see below.
});
```

### What is checked as rendered output

The data guards above read `ABOUT`, so the 2026-10-11 wording (D-15) flows through
them unchanged — but no guard is called green on the new text until its probe below is
re-run against it (tasks T-6).

The two Playwright tests in §4.2. RF-1 reads the order of the `<section>` elements in the
served document; RF-5 reads the set of hosts that document actually requests.

`output: "server"` (`astro.config.mjs:5`) means `dist/` holds no HTML, so **a green build
proves nothing about what a visitor sees**. That is why these two RFs cannot live in
`npm test`, and why they live in Playwright at all.

### The one source read, and its constitution-8 reason

RF-4's second half walks `src/components/*.astro` looking for the four strings. It is a
source grep, and constitution 8 requires a written reason: **the strings exist in
`about.ts` and there they will keep existing**, so a copy pasted into a template changes
nothing any data assertion can see. The data half passes with the literal in both places;
only the walk sees it. `tests/about.test.ts:61-65` already states this reasoning for the two
checks left in the file.

Three requirements that walk has:

- **Strip comments first** — `/* … */` and `//` lines — or a frontmatter note quoting the
  Spanish sentence fails the build. `tests/comments.test.ts:18-21` and
  `tests/i18n.test.ts:51-53` do this for the same reason.
- **Walk `src/components` only**, not all of `src/`. `about.ts` is where the strings live and
  is not a component; including it would make the assertion unsatisfiable.
- **Assert the walk found files.** A walk that resolved to nothing returns an empty offender
  list and reports green — the vacuous-guard failure `tests/i18n.test.ts:71-76` and
  `tests/viewtransitions.test.ts:32-36` each carry an assertion for.

**No new guard is needed for RF-6.** `tests/i18n.test.ts:40-69` scans every `.astro` and
`.ts` under `src/` for `t('…')` and resolves each key in both locale files, so the new
component's `t('valueProposition.title')` is checked the day it is written. `t()` returns
the key itself when a translation is missing and throws nothing — which is the whole reason
that guard exists.

### Injection probes — one per new guard, each run before the guard is called green

Revert by editing the one path the probe touched. **Never `git checkout -- .`**
(`AGENTS.md`: it restores from the index and destroys uncommitted work silently, and this
repo's normal state *is* uncommitted work).

| Guard | Violation injected | Expected red |
|---|---|---|
| RF-1 | move `<ValuePropositionSection locale={locale} />` **above** `<AboutSection …>` | `ids[1]` is `About` while the section still renders — the probe that proves the assertion reads **order**, not presence |
| RF-1 | delete the element from `Resume.astro` | `main > section` no longer has `ValueProposition` at all |
| RF-2 | set `proofPoints[2].es = ''` | the non-empty half, `es` only |
| RF-2 | delete the third entry | `toHaveLength(3)` |
| RF-3 | set `proofPoints[2].en = proofPoints[0].en` | the distinctness half, `en` only — the `es` strings still differ, which is why the probe is in the other locale |
| RF-4 | set `valueProposition.es = ''` | RF-4's non-empty half. This is also the probe for the gap the spec names: RF-2's own text covers the three points, not the sentence |
| RF-4 | paste the Spanish proposition into the component template | the component walk |
| RF-4 | rename a file the walk cannot find (point `COMPONENT_DIR` at an empty directory) | the walk's own "found files" assertion — this is what stops the guard from being green because it read nothing |
| RF-5 | put `<img src='https://cdn.example.com/probe.png' alt=''>` inside the section | the host assertion names `cdn.example.com` |
| RF-5 | attach the `page.on('request')` listener **after** `goto` | the set is empty and the test passes — which is why the listener's position is part of the assertion, and why the probe above is the one that matters |
| RF-6 | delete `valueProposition` from `en.json` | `tests/i18n.test.ts` — an existing guard, probed because it is the only thing standing between a missing key and a raw key on the page. `:36-38` goes red too, since the two files no longer share their top-level keys |

### What no check settles — the limits, once

1. **RF-5's source clause, "the source names no new host."** No guard, and deliberately so
   (D-7). Only what the served home *requests* is checked; a host named in source and never
   requested passes.
2. **That a reader can verify a proof point.** The spec settled this: it is the author's
   judgement and no guard settles it. RF-2 settles three non-empty, distinct strings. RF-2's
   own words "each stating a specific claim" are not machine-checkable here, and the plan
   does not pretend the check reaches them.
3. **That the section is visible.** RF-1 asserts DOM order, not paint. `dist/` holds no
   HTML; `npm run build` green says nothing about it. §5's table is a browser check.
4. **The LCP delta.** No test and no threshold in the spec; §4.3 is a measurement written
   into a commit message.
5. **The line measure.** No guard in this repo measures a rendered line.
   `max-width: var(--measure)` is the mechanism; whether it produces the intended line is
   looked at, not asserted.
6. **The outline formerly starting at `h2`.** Asserted by nothing. It was a design cost
   stated in D-4; with the section second the cost has decayed and the item stays as a
   record, not a defect a test would catch.
7. **Where the hairline lands.** §5's table is a measurement taken before the first
   landing, not a guard. The rework puts the added hairline between About and the value
   proposition and returns About to borderless-first — looked at, not asserted. Nothing
   fails if a later change moves the division again.
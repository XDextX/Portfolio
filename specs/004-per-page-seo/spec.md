# Spec 004 — Per-page titles, descriptions and project JSON-LD

**Status:** implementada

## Context and goal

`BaseLayout` provides a sensible default title and description, and three of the four
routes override it. The fourth — the one that does not — is the home, so the most
important page on the site shares its metadata with nothing that identifies it as the
home.

Measured, from the frontmatter of each route:

| Route | Own title | Own description |
|---|---|---|
| `/` | no | no |
| `/proyectos` | yes | yes |
| `/proyectos/[name]` | yes, from the repo | yes, from the repo |
| `/404` | yes | yes |

So the home inherits ``${ABOUT.name} - ${ABOUT.title}`` while `/proyectos` states
`Proyectos - Portfolio`. Two strings, so they are not interchangeable — but neither
names anything a reader can tell apart: one is the name and the role, the other is a
section label followed by the site's own name.

Separately, and found while verifying the above: every project page declares its entity as
**`SoftwareApplication`**, with `applicationCategory: DeveloperApplication` and
`operatingSystem: Any`. That type describes a running application, not a repository.
A repository is `SoftwareSourceCode`, and the fields that describe it are already in the
response this page fetches.

## Definitions

- **`SoftwareApplication` vs `SoftwareSourceCode`**: the first is an executable program;
  the second is source code. A GitHub repository is the second, whatever it builds.
- **Per-page metadata**: title and description that state what *this* page is, rather
  than what the site is.

## Actors

Two, neither of them on the site. A search engine, which reads this metadata to decide
what a page is and whether to show it; and a person who lands on the site from a search
result and sees the title before deciding to click.

## User stories

- US-1: As someone searching for this work, I want each page to say what it contains so
  that I can tell the results apart.
- US-2: As a search engine reading a project page, I want the entity typed correctly so
  that I can classify it as source code.

## Requirements (EARS)

- **RF-1: THE SYSTEM supplies a title of its own to the layout from the home route.**
  — **Check:** a data check over the home route's call to the layout, in
  `tests/seo.test.ts`: it supplies a `title` and does not fall back to the layout
  default. What this cannot settle is the rendered `<title>` — see the limits below.
- **RF-2: THE SYSTEM gives the home page a description of its own, generated from
  `ABOUT` and `src/data/tech.ts`.** — **Check:** `tests/seo.test.ts` asserts the
  generated description contains the role and at least two technologies from `TECH`,
  and that no technology outside that file appears in it. The second half is what stops
  the description from drifting into a hand-written list nobody maintains.
- **RF-3: THE SYSTEM keeps the home description inside the length search engines
  truncate at, without splitting a word.** — **Check:** `tests/seo.test.ts` asserts
  the generated description is at most 160 characters **and** that it is a whole prefix
  of the untruncated draft by whole words. The second half is what fails when a word is
  cut mid-way; a character count alone passes a 159-character string that ends in the
  middle of "Angular". Without a threshold at all, "it looks short" is an opinion.
- **RF-4: THE SYSTEM types every project entity as `SoftwareSourceCode`.**
  — **Check:** the JSON-LD builder is extracted into an imported function, and
  `tests/seo.test.ts` asserts on the object it returns. No server involved.
- **RF-5: THE SYSTEM declares `codeRepository` on every project entity.**
  — **Check:** in `tests/seo.test.ts`, the builder returns an entity whose
  `codeRepository` equals the repository's `html_url`. It is present for every
  repository: the repo exists.
- **RF-6: THE SYSTEM gives a project entity the same description the page shows,
  whether that text came from the repository or from the fallback.**
  — **Check:** two calls in `tests/seo.test.ts` on the entity builder, each given the
  description value that route resolves for that repository — the repository's own text
  when it has one, the translated fallback when it has none — read from the route's own
  resolution, not from a second copy of the fallback expression written out in the test.
  Each call asserts `entity.description` equals that value verbatim. Equality is the
  whole check: a builder that returns `repo.description` unchanged yields `undefined`
  where the page shows the fallback, so the assertion goes red on precisely the
  divergence between what is read and what is shown.
- **RF-7: THE SYSTEM declares `programmingLanguage` only when the repository provides
  one, and never `N/A`.** — **Check:** two calls in `tests/seo.test.ts`. With a language,
  the field is that language. Without one, the key is **absent** — asserted as
  `'programmingLanguage' in entity === false`, because asserting the absence of a value
  is what makes this RF able to fail.
- **RF-8: THE SYSTEM declares no `applicationCategory` or `operatingSystem` on any
  project entity.** — **Check:** the same call asserts both keys absent. A leftover
  field from the old type is the error being corrected.
- **RF-9: THE SYSTEM leaves the other three routes' metadata unchanged.**
  — **Check:** a data check in `tests/seo.test.ts` that `/proyectos`,
  `/proyectos/[name]` and `/404` each still supply their own title and description.
  This is the guard against a well-intended change to the layout default silently
  rewriting every page.

### What these checks do not settle

`npm test` is `vitest --run tests`. **No test in that suite renders a page** — verified:
the six files that appear to fetch HTML are testing GitHub helpers, not output. Rendering
lives in `e2e/`, under `npm run test:e2e`, which is a separate suite.

So no requirement here is checked against served HTML. That means four things remain
unverified by `npm test`:

- that the title and description actually reach the `<head>` of a served page — the
  rendered `<title>` element in particular, which RF-1's data check cannot see, because
  no test in `npm test` renders a page,
- that the JSON-LD block parses, rather than merely having the right keys,
- that a well-intended future change to the layout default breaks a page,
- that the route displays the very value `RF-6` compares the entity against. That check
  is over the resolved description, so a route computing one text for the entity and
  another for the visible paragraph would satisfy it; the two readings are one value in
  the code, and nothing here proves the paragraph prints it.

This is accepted deliberately, not overlooked. Adding render capability to `npm test`
means either a component-rendering dependency or a booted server, and the constitution
says a new dependency needs its reason written down first. If that reason is ever
accepted, these checks should be upgraded — they are the kind of rule that reads as
covered and is not.

## Non-functional requirements

- No new dependency. This is a metadata change.
- The JSON-LD must stay valid: a block that fails to parse is worse than a wrong type,
  because it is silently ignored.

## Edge cases

- **A repository with no language.** `programmingLanguage` is then absent. The page
  already renders `N/A`; the JSON-LD must omit the field rather than carry `N/A`, which
  is a string where the schema expects a language name. `RF-7` is the check for this:
  it passes when the key is absent and goes red when it is present in either case.
- **A repository with an empty description.** Already handled: the page falls back to a
  translated string. That fallback must reach the JSON-LD too, or the structured data
  and the visible page disagree. `RF-6` is the check for this, and it is phrased as
  non-divergence rather than as "the fallback reaches the JSON-LD": comparing the
  entity's description against the text the page shows goes red whichever side is
  changed, which a check on the fallback alone would not.
- **`tech.ts` empty or one entry.** The generated description would collapse. `RF-2`
  requires at least two, which turns a thin data file into a red check rather than a
  thin sentence.
- **The description crossing 160 characters when the role grows.** Generated text means
  the length is an accident of the data, not a decision. `RF-3` turns that accident into
  a red check instead of a silently truncated meta tag.

## Out of scope

- **Rendering assertions in `npm test`.** The four things listed under *What these
  checks do not settle* stay unverified here. Putting them in `e2e/` is the cheap half
  of the fix and belongs with the card work in spec 002.

- **`hreflang` and `canonical` across locales.** `/es` and `/en` are the same pathname
  with `?lang=`, and both declare the same canonical. That is a known multi-language
  indexing problem and deserves its own spec: the fix is URLs, not metadata.
- **`og:image`.** Broken on every page — `public/` has no raster image at all. That is
  RF-1 of `specs/002-social-preview-card/`.
- **A sitemap change.** It exists and lists the routes; whether it should list the
  projects is a separate question.
- **The value proposition for the home.** Spec 003 will add one. When it lands, this
  description is the text most likely to change — `RF-2` is written so that changing
  its source is a one-line edit, not a rewrite.

## Done when

- `npm test` and `npm run build` green.
- Every new guard proven by injection: remove the title the home route supplies to the
  layout and watch **RF-1** go red — it is a data check, so it goes red on the missing
  `title`, never on the title served; drop a route's own title or description and watch
  **RF-9** go red; set `@type` back to `SoftwareApplication` and watch **RF-4** go red;
  give a repository with no language a `programmingLanguage` of `N/A` and watch **RF-7**
  go red, which is the only probe that can prove it bites on absence; re-add
  `applicationCategory` and watch **RF-8** go red; resolve the fallback for the visible
  paragraph only and let the entity keep `repo.description` — a repository with no
  description, so the entity carries `undefined` where the page shows the translated
  string — and watch **RF-6** go red.
- **The JSON-LD is confirmed parseable by hand, once**, by pasting the served block
  into a JSON parser. `npm test` cannot do this, so it is a stated manual step rather
  than a green check. A block that does not parse satisfies every assertion in this
  spec and tells a search engine nothing.

## Open questions

- None. All four design questions were answered on 2026-10-08: scope includes the home
  and the JSON-LD correction; the metadata is written now and adjusted when spec 003
  lands; the description is generated from `ABOUT` and `tech.ts`; the project entity
  carries only the fields that describe source code.
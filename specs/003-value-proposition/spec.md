# Spec 003 — Value proposition section

**Status:** borrador

## Context and goal

The home page opens with an avatar, a name, "Full-Stack Developer", and a paragraph.
**Nothing on the page says what problem is solved.** A visitor arriving from a link has
roughly eight seconds before deciding whether to keep reading, and right now that
decision has nothing to work with.

Adding one section at the top — a statement of what the work is for, plus three points
that back it up — gives that decision something to stand on. It is the smallest change
on this list with the largest effect on whether a visitor stays.

## Definitions

- **Value proposition**: one sentence naming who the work is for and what it produces.
  Not a job title, not a tagline, not "Full-Stack Developer".
- **Proof points**: the three items under it. Each claims something specific and
  checkable by the reader; a reader must be able to ask "how do I know?".

## Actors

Two. The visitor arriving from a shared link, who decides in seconds whether to keep
reading. And whoever shares the link, who is choosing between candidates.

## User stories

- US-1: As a visitor who just arrived, I want to know what this person does within
  seconds so that I can decide whether to keep reading.
- US-2: As someone sharing a link, I want the page to state its value immediately so
  that the click is worth making.

## Requirements (EARS)

- **RF-1: THE SYSTEM shows the value proposition as the first section of the home
  page.** — **Check:** the served HTML of `/` renders the section before any other
  `<section>`. A data check cannot settle order; this is an assertion on rendered
  output, and it is the reason constitution 8 is satisfied by output rather than a
  source grep.
- **RF-2: THE SYSTEM shows three proof points, each stating a specific claim.**
  — **Check:** `about.test.ts` asserts exactly three entries in the data, each with
  non-empty text in **both** locales.
- **RF-3: THE SYSTEM shows no proof point that shares text with another.**
  — **Check:** `about.test.ts` asserts the three texts are distinct. Duplicated
  filler is the failure this catches, and a length threshold cannot see it.
- **RF-4: THE SYSTEM keeps the value proposition and proof points in
  `src/data/about.ts`, in both locales.** — **Check:** `about.test.ts` asserts the
  fields exist under `ABOUT` and that no component file contains either text.
- **RF-5: THE SYSTEM adds no runtime dependency and makes no request to render this
  section.** — **Check:** `package.json` grows by nothing, and the served HTML of `/`
  contains no new external host.
- **RF-6: THE SYSTEM renders the section in the visitor's locale.** — **Check:**
  `i18n.test.ts` asserts every new key resolves in `es.json` and `en.json`.

## Non-functional requirements

- The section adds no client-side JavaScript. It is static content.
- It does not change the page's LCP: the existing hero image is not displaced.
- Interface chrome (headings, aria labels) goes through `t()`, so a locale switch needs
  no second mechanism.

## Edge cases

- **A locale missing the text.** If either `es` or `en` lacks the proposition, the
  section would render half-empty and read as a bug. `RF-2` and `RF-6` both fail on
  that, which is the intent.
- **Very long proposition text on a narrow viewport.** The measured-width cap that
  protects body prose must also apply here, or the sentence wraps to a tall column on
  a phone. This is a rendering concern to verify visually, not a data check.
- **`h2` heading level.** The section must not break the document outline that the
  other four sections already establish.

## Out of scope

- **Filling `EXPERIENCES`.** Two entries for someone with 6+ years reads as an
  incomplete CV. That is content, not a feature, and it belongs to whoever owns the
  data — not to a spec that would ship it untested.
- **A blog.** The most obvious thing to add and the most expensive: content, routes,
  duplicated i18n, and a portfolio with two posts reads worse than one with none.
- **Per-page SEO.** `index.astro` and `404.astro` declare no title or description of
  their own. Real, worth doing, and unrelated to this section.
- **Hardening `ProjectsSection` against a GitHub outage.** The home currently loses
  its projects section if the API is down. Worth a spec of its own.

## Done when

- `npm test` and `npm run build` green.
- Every new guard proven by injection: remove the section and watch RF-1 go red; drop
  the Spanish text and watch RF-2 and RF-6 go red; copy one proof point over the
  other and watch RF-3 go red.
- The section is looked at in both locales and on a narrow viewport. `dist/` holds no
  HTML, so a green build does not prove any of the rendering claims.

## Open questions

- [NEEDS CLARIFICATION] **The words are yours.** The proposition and the three points
  are positioning, and a draft written by anyone else reads like that draft. This spec
  deliberately leaves them empty: whoever implements writes them, in both locales, and
  that is the last thing standing between this and `aprobada`.
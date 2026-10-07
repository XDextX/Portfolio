# Spec 002 — Social preview card

**Status:** proposed

## Context and goal

`BaseLayout.astro` publishes `og:image` and `twitter:image` pointing at
`${site}/og-cover.png`. That file has never existed: `public/` contains **zero** raster
images, so every share of this site resolves a 404 and renders a broken or empty card.
`README.md:111` documents the same nonexistent file.

The goal is a real 1200×630 card in the site's own visual language, rendered from the
site's own CSS and fonts so it cannot drift from them.

## Actors

Two, both indirect. The person sharing the link, who chooses not to share when the card
is broken; and whatever platform renders the preview, which silently drops an image it
cannot fetch. No one on the site itself sees this.

## User stories

- US-1: As someone sharing a link to this portfolio, I want the preview to show the site
  so that the link is worth clicking.

## Requirements (EARS)

- **RF-1: THE SYSTEM publishes an image at `/og-cover.png` that resolves 200.**
  — **Check:** `about.test.ts` stats the file, its PNG signature, and its IHDR dimensions,
  which is strictly stronger than the `https://`-prefix assertion that stands in for this
  today.
- **RF-2: THE SYSTEM builds the card at 1200×630.** — **Check:** the same IHDR read in
  RF-1. 630 is the platform-recommended height for a 1.91:1 card; a square image gets
  centre-cropped by X and Slack.
- **RF-3: THE SYSTEM adds no runtime and no build dependency to produce the card.**
  — **Check:** `package.json` `dependencies` and `devDependencies` grow by nothing, which
  is constitution 1 and 7 stated on the artifact instead of in a comment.
- **RF-4: THE SYSTEM draws the card from the site's own tokens and fonts.**
  — **Check:** the render script reads `--brand-primary`, `--brand-accent` and
  `public/fonts/IBMPlexSans-latin.woff2` by path, so a renamed token or font breaks the
  build instead of silently falling back to a system stack.
- **RF-5: THE SYSTEM renders the card without shipping HTML, CSS or a renderer to the
  browser.** — **Check:** `about.test.ts` asserts no `og-cover.html`, stylesheet or
  script accompanies it in `public/`; the card is a committed artifact.
- **RF-6: THE SYSTEM stops `README.md` from documenting a path that does not exist.**
  — **Check:** the README references only files that `about.test.ts` has stat'd.

## Non-functional requirements

- Security: nothing fetched at runtime. The card is a local file, like the fonts.
- Size: under 5 MB, the platform ceiling. A 1200×630 flat-colour PNG lands far below.
- Language: the card shows the visitor-facing name from `ABOUT`, not a literal. Spelling
  it out here would be a second source for the identity (constitution 9).

## Edge cases

- The brand name is long, and `--brand-accent` on navy must clear 4.5:1. That ratio is
  computed from the real token values, not assumed.
- Chromium is already installed for Playwright, but the cache lives in
  `%LOCALAPPDATA%\ms-playwright`. On a machine without it the build cannot produce the
  card; that is a documented prerequisite, not a silent fallback to a blank card.

## Out of scope

- **The avatar stays remote.** `specs/001` was rejected on purpose and this does not
  reopen it. Note the interaction: with no local raster image other than this card, a
  platform that finds no usable `og:image` falls back to the first `<img>` on the page,
  which is the remote GitHub avatar. Removing `og:image` (the rejected alternative) would
  have handed those cards to the avatar instead.
- Multi-language cards. One card, no locale variants.
- Video (`og:video`), `og:image:alt`, and the `summary_large_image` → `summary` card-size
  debate. Adding tags that nothing tests is how `og:image` broke in the first place.

## Done when

- `npm test` and `npm run build` green.
- Every new guard proven by injection: delete the file and watch RF-1 go red; rename a
  token and watch RF-4 go red; add a dependency and watch RF-3 go red.
- The card is looked at, at 1200×630, before it is committed — a raster artifact that
  nobody has seen is not verified.

## Open questions

Ninguna. Both design questions were answered (2026-10-06):

- **PNG**, not SVG. Facebook and X do not reliably render SVG in `og:image`, and those are
  the two platforms that matter for a portfolio.
- **Name + role**: the name in the large weight, `ABOUT.title` in small mono underneath.
  The name is what someone recognises; the role says whether the click is worth it. Both
  are read from `ABOUT`, never spelled out here.

Neither is a blocker now; the spec is ready for approval.

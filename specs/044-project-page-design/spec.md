# Spec 044 — The project page in the site's design system

**Status:** implemented
**Size:** L
**Approved:** 2026-10-18 · one clarify round with the owner's decisions; previewed on mobile in both themes · 115 lines, 7 RF
**Implemented:** 2026-10-18 · commits `66e3dbb` (PageHeader), `f60b4eb` (README headings), `e543953` (page) on spec/044-project-page-design · 7/7 tasks, `npm test` 319/319, e2e 257/257 · 7/7 RF, NFRs and edge cases validated by the SDD reviewer in two rounds; injections 1–9 red; owner visual approval of the header and the page
**Changed:** 2026-10-18 · RF-3 aligns the header with /proyectos's header (20 px at 390) and the body with its cards (36 px), as measured; RF-7 moves the anchor's id onto the heading, "#usage lands" moved to Out of scope as pre-existing; replaces 036's no-band assertion explicitly · 121 lines

## Context and goal

The project page (`/proyectos/<name>`) reads like a different site. Seen on the dev server at
390×844 and 1280 px on 2026-10-18:

- It has no header like spec 039's on `/proyectos`: no gold tile beside the title and no band of
  spec 036 behind it. It opens on a breadcrumb, a back button and a plain title.
- Its side gutter is 20 px at 390 px, against 36 px on Home and `/proyectos`.
- The description sits under a heading that reads "Descripción:", with a colon, unlike every other
  heading, and that heading is an `h3` straight under the `h1`.
- The project's name shows twice: as the page's `h1`, and again as the README's own first `h1`.
- Each README heading's anchor icon (🔗) sits on a line of its own, above or below its heading.

Goal: the page reads as part of the same design system as Home and `/proyectos`. The owner chose
the layout on 2026-10-18: the `/proyectos` tile and glyph, the description as the header's lead
line, the README's repeated name hidden, and no anchor icons.

## Definitions

- **README's leading heading**: the first heading of the README's HTML when nothing but whitespace
  or images comes before it.
- **Heading's name**: the heading's text content, link text included and image alt text excluded
  (`# [My App](…)` and `# <img> My App` are both named "My App").
- **Same name**: equal after lowercasing and dropping every character that is not a letter or a
  digit (`my-app` and `My App` are the same name).

## Actors

Visitors opening a project, from a card or a direct link, in either theme and locale.

## User stories

- US-1: As a visitor, I want a project's page to look like the page I came from, so that I know I
  am still on the same site.

## Requirements (EARS)

- RF-1: THE SYSTEM heads the project page with a gold tile holding the `folder` glyph beside the
  project's title, as `/proyectos` does (owner, 2026-10-18). — **Check:** at 1280 and 390 px the
  tile sits left of the `h1` on one row, carries the same `folder` mask as `/proyectos` (one glyph,
  one meaning), is hidden from assistive tech, and its glyph clears 3:1 on its fill per theme.
- RF-2: THE SYSTEM draws the band of spec 036 behind the project page's header. — **Check:** at
  1280 and 390 px the band's box matches the sheet's left, right and top and the header's bottom
  within 1 px, and every text, icon and control over it clears its floor at the worst pixel (the
  spec 036 pixel check, reused).
- RF-3: THE SYSTEM aligns the project page's header with `/proyectos`'s header, and its body with
  `/proyectos`'s cards. — **Check:** at 360, 390, 800 and 1280 px the header's left and right edges
  equal those of `/proyectos`'s header (20 and 370 px at 390), and the body's equal those of its
  cards (36 and 354 px at 390), within 1 px.
- RF-4: THE SYSTEM shows the project's description as the header's lead line, with no heading of
  its own (owner, 2026-10-18). — **Check:** in each locale a paragraph under the `h1`, inside the
  header, reads the description the route resolves (the repository's text, or the locale's
  fallback), capped by `--measure`; no heading on the page reads `project.meta.description`, and
  none ends with ":".
- RF-5: THE SYSTEM never skips a level among the page's own headings. — **Check:** walking the
  headings outside the README in order, each is at most one level below the one before it. The
  README's headings are the repository's content and are not checked.
- RF-6: IF the README's leading heading has the same name as the repository, THEN THE SYSTEM does
  not show it, keeping the page's `h1` (owner, 2026-10-18). — **Check:** with a README whose first
  heading is the repository's name, the page has exactly one visible heading with that name, the
  `h1`; with a README whose first heading is something else, that heading still shows.
- RF-7: THE SYSTEM renders no anchor icon on the README's headings, and moves each anchor's id onto
  its heading (owner, 2026-10-18). GitHub's HTML puts the id (`user-content-<slug>`) on the anchor
  beside the heading, not on the heading. — **Check:** at 390 and 1280 px no README heading contains
  or is followed by an anchor icon, and every heading whose anchor carried an id in the source HTML
  carries that id on the page.

## Non-functional requirements

- Both themes and both locales, at 360, 390, 800 and 1280 px.
- The card-to-page view transition keeps working: the title keeps the `transition:name` the card
  uses (AGENTS, client scripts).
- AGENTS' visual-language rules hold: navy and gold only, hover is the gold border, radius by size
  class, the tile's ink is `--accent-surface-text`.
- Spec 036's assertion that the project page has no band (`e2e/hero-background.spec.ts:43–46`)
  is replaced by RF-2; that test is removed, not loosened.
- The README's content is otherwise untouched: apart from RF-6's heading and RF-7's icons, its
  text, heading levels, images (spec 037) and links render as today.

## Edge cases

- A README with no headings, or none at all: RF-6 and RF-7 have nothing to act on; the page still
  has its header. RF-1, RF-2.
- A README whose leading heading is a longer title ("My App — a tool for…"): not the same name, so
  it shows. RF-6.
- A README that opens with a badge row before its first heading: the badges don't count, so the
  heading is still the leading one. RF-6.
- A repository with no description: the lead line shows the locale's fallback. RF-4.
- The unavailable-project page (GitHub down, unknown repo): it takes the gutter, and the header
  without a repository's data. RF-1, RF-3.
- A long repository name at 360 px: the title wraps beside the tile; the tile does not shrink.
  RF-1.

## Out of scope

- The sidebar's content (dates, counts, actions) beyond the gutter. The Stars/Forks words are
  spec 043, which edits the same sidebar lines and lands first.
- The breadcrumb and the back button both linking to `/proyectos`: kept, flagged for the owner.
- The README's own styling (code blocks, tables) and heading levels beyond RF-6 and RF-7.
- README links to `#x` do not reach the heading's `user-content-x` id, today or after this spec:
  pre-existing, not fixed here.
- Touch target sizes (spec 048).

## Done when

`npm test` and `npm run test:e2e` green; each new guard shown red by injection; two project pages
read on the dev server (one whose README opens with its name, one without a README) at 360, 390,
800 and 1280 px in light and dark, beside `/proyectos`; the owner's visual approval.

## Open questions

None. Resolved 2026-10-18 (owner): the `folder` glyph; the README's leading heading hidden when it
has the repository's name, the page's `h1` kept; no anchor icons, ids kept; the description as the
header's lead line, the "Descripción" block removed.

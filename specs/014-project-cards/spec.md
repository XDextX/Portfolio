# Spec 014 — Project cards in the mockup's design

**Status:** implemented
**Size:** M
**Approved:** 2026-10-15 · two clarify rounds, no blocker left; owner decisions: file-code mark, stars/forks/date row kept · 158 lines, 8 RF
**Implemented:** 2026-10-16 · commits `4c6805a` (vitest ^3.2.7 and its config, owner OK) and `ebe1b00` (feat) · 10/10 tasks, `npm test` 194/194, e2e 89/89, build green · 8/8 RF, NFRs and edge cases validated; 19 injections red, 9 re-run after a test fix; seen at 1280 and 390px in light and dark

**Depends on:** spec 008 (section title). **Prerequisites**, each its own change before
this spec's code: the constitution 7 amendment that adds the Playwright e2e suite to
the pre-commit hook (rendered checks below run there); the AGENTS.md amendment that
makes brand logos content, outside the navy-and-gold rule.

## Context and goal

The owner's mockup redraws the projects section as cards with a picture area on top, a
language badge on it, then the name, description, topic chips and two buttons, "Código"
and "Demo". Today's card is text only: name and language on one line, description,
chips, and a footer with stars, forks, date and the actions.

Owner decisions (2026-10-15): the section keeps listing the GitHub repositories it lists
today, in today's order, with no hand-picked featured set; the title stays "Proyectos" /
"Projects" (spec 008); no screenshots, so the picture area is a CSS-only placeholder
showing the repository's language logo; "Demo" only where the repository has a homepage;
no "En progreso" badge.

Most repositories are work in progress — 11 of 16 carry only a README (`Memory.md`) — so
the card with no language, no description and no topics is the common case, and the
design must say what it shows. The card also resolves its description with the raw
`description ?? fallback` form, so a whitespace-only description paints a blank
paragraph while the detail page shows the fallback (`Memory.md`, debt). That closes here.

**Language logo in colour (this spec's pick).** Brand logos are content (prerequisite
amendment), and the skills section draws them in colour at rest (spec 012): one look per
brand on the page. The logo is decorative — the badge names the language — so it carries
no contrast floor.

## Definitions

- **Placeholder**: the area at the top of a card where the mockup has a screenshot.
- **No language / no homepage**: the GitHub value is absent, `null`, or blank after trimming.
- **Known language**: one the site already holds a colour logo for. Which ones is data.
- **Resolved description**: the trimmed repository description, or the translated
  "no description" text when that is empty — what the detail page already shows.

## Actors

One: a visitor scanning the projects section, on `/` or on `/proyectos`.

## User stories

- US-1: As a visitor, I want each card to show what a project is written in, so that I
  can pick the ones in a stack I care about.
- US-2: As a visitor, I want "Demo" only where something is running, so that no button
  leads nowhere.
- US-3: As a visitor, I want a project with no metadata to still read as a card, so that
  work in progress does not look broken.

## Requirements (EARS)

- RF-1: THE SYSTEM renders a placeholder at the top of every project card, above the
  project's name. — **Check:** e2e on `/` and `/proyectos`: each visible card's
  placeholder lies inside the card and ends at or above the name's top edge.
- RF-2: WHEN a repository has a known language, THE SYSTEM shows that language's colour
  logo in the placeholder. — **Check:** a data test maps each known language to a
  root-absolute path that exists under `public/`; e2e reads that logo, in the active
  theme's variant where one exists, as the placeholder's only image.
- RF-3: IF a repository has no language or an unknown one, THEN THE SYSTEM shows the
  generic `file-code` mark in the placeholder (Decision). — **Check:** a data test yields
  the same generic result for no language and for a language with no logo; e2e finds
  the mark in that card's placeholder.
- RF-4: WHEN a repository has a language, THE SYSTEM shows a badge inside the placeholder
  naming that language. — **Check:** a data test reads the trimmed language as the label,
  known or not; e2e finds the badge's box inside the placeholder and clear of the logo.
- RF-5: IF a repository has no language, THEN THE SYSTEM renders no badge. — **Check:** for a
  fixture repository with each no-language value, the card's rendered output holds no
  badge; today it prints `N/A`.
- RF-6: THE SYSTEM shows the resolved description on the card. — **Check:** for the
  same fixture repository, the description the card renders equals the detail page's,
  whitespace-only and `null` included, in both locales.
- RF-7: WHEN a repository's homepage, trimmed, is an absolute URL whose scheme is `http`
  or `https` in any case, THE SYSTEM shows a "Demo" button linking to the trimmed URL. —
  **Check:** the card rendered for fixtures `' https://x.test '` and `'HTTPS://x.test'`
  holds a "Demo" link with the trimmed URL.
- RF-8: IF a repository's homepage is absent, blank, or not an `http`/`https` URL, THEN
  THE SYSTEM renders no "Demo" button. — **Check:** the card rendered for each of those,
  a `javascript:` and a scheme-less value included, holds no "Demo" link.

## Non-functional requirements

- **Kept as today**: the repositories listed and their order on both routes (one
  ranking, constitution 6; `tests/github-helpers.test.ts`); the first five topics as
  chips and no chip row without topics; "Código" on every card linking to the
  repository; the home preview of four (`Resume.astro:50`, unguarded today) with "Ver más
  proyectos" and "Ver todos"; the stars, forks and date row (stars and forks above zero
  only, Decision); the error alert and the empty message. No new GitHub request.
- **Themes**: the placeholder fill is the soft fill inside the sheet, `--neutral-200`,
  never `--bg` (AGENTS design tokens). Every state is shown in light and dark.
- **Badge palette**: the badge text uses the interface palette, not a per-language
  colour. — **Check:** e2e measures the badge text ≥ 4.5:1 on its fill in both themes.
- **No project image**: no screenshot, no per-project asset. — **Check:** e2e finds no
  image in any placeholder other than RF-2's logo, and no `url()` background.
- **Hover**: unchanged; the standing rule and its guard in `tests/visual-language.test.ts`.
- **Accessibility**: the logo has no accessible name; the card keeps its heading as name.
- **View transitions**: the title's transition name keeps its partner on the detail page
  (`tests/viewtransitions.test.ts`), the only card name that has one today.
- **Language**: every new visitor string goes through `t()` in both locales.
- **Dependencies**: none added, no icon library, no remote asset (constitutions 1, 2).
- **Guards retired**: none. The card stops printing `N/A`, which no guard reads.

## Edge cases

- **README-only repository** (the common card): generic mark (RF-3), no badge (RF-5),
  fallback description (RF-6), no chips, "Código" alone (RF-8) — at its natural width,
  not stretched. Shown in both themes before approval.
- **Language with no logo** (JavaScript, HTML, CSS): generic mark (RF-3), badge still
  names it (RF-4).
- **Logo with per-theme variants** (Astro): the active theme's variant (RF-2).
- **Homepage equal to the repository URL**: shown as given (RF-7); it is the owner's data.
- **Long name or long language**: the name wraps inside the card; the badge stays clear
  of the logo (RF-4).

## Out of scope

- A featured set, any reordering, screenshots, an "En progreso" badge (owner decisions).
- The section title and its icon: spec 008. The focus ring on the card's links: spec 016.
- A fallback list when GitHub fails.
- The detail page and its own language badge, which keeps its hardcoded colours.
- Found on the way, each its own change: both routes interpolate the raw English fetch
  error into the alert (`proyectos/index.astro:92`; on `/` via `Resume.astro:54`);
  `sortRepos` counts any non-blank homepage as a demo, so after RF-8 a `javascript:`
  homepage still ranks as one; the detail page still links a `javascript:` homepage
  (`[name].astro:31`, `:126`).

## Done when

- `npm test` and the e2e suite green, every new guard shown red once by injection; build
  green.
- `/` and `/proyectos` fetched from a running dev server, each card state above seen in
  light and dark.

## Decision

- 2026-10-15 · No or unknown language: a Tabler `file-code` glyph in the placeholder,
  a UI icon painted by mask in `currentColor`; the download asks the owner first.
  (`code` is spec 011's step 2 glyph — one glyph, one meaning.) Discarded: an empty
  placeholder, which reads as a broken image. Owner decision.
- 2026-10-15 · Stars, forks and the update date stay, as a row under the buttons,
  with today's rules (stars and forks only above zero, the date always). Discarded:
  dropping them to match the mockup — the date is what says a WIP repo is alive.
  Owner decision.

## For the plan

- Cards past the home preview are `display: none`: measure visible cards, or expand first.
- RF-5, RF-6 and RF-8 fail in the component today (`ProjectCard.astro:15-17`,
  `LanguageBadge.astro:6`): a helper test alone stays green if the card skips the helper.
- The derivation's home (`src/data`, `github.ts` or `utils/seo.ts`) is a plan decision;
  RF-6 reuses `projectDescription`, not a copy.
- Mapping GitHub names to logo files is not identity (`C#` → `csharp`).

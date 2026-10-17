# Spec 031 — The language logo inside the project badge

**Status:** implemented
**Size:** S
**Approved:** 2026-10-17 · one clarify round, one blocking finding applied (spec 014's overlap check reads the badge's own logo); approved with its plan and tasks · 71 lines
**Implemented:** 2026-10-17 · commit `057a871` · 3/3 tasks, `npm test` 238/238, e2e 142/142 · 3/3 RF, NFRs and edge cases validated (home and /proyectos, light and dark at 1280 and 390, owner visual approval); 5 injections red

## Context and goal

Spec 030 left each project card with its language named twice: the language's logo at 48px in
the placeholder, and a text badge ("TypeScript") in the placeholder's top-right corner. The
owner asked on 2026-10-17 for the technology's icon beside its name in the badge, and chose to
keep the large logo as it is: the badge becomes "[logo] TypeScript", the placeholder does not
change. The logo is the one spec 014 already resolves for the language, per theme.

## Actors

Visitors browsing the projects on the home page and on /proyectos, in either theme.

## Requirements (EARS)

- RF-1: WHERE the repository's language has a logo, THE SYSTEM draws that logo before the
  language's name inside the badge, the theme's own file, hidden from assistive tech. —
  **Check:** on / and /proyectos, in both themes, each such badge shows exactly one image, its
  path equals `logoFor(languageLogo(lang), theme)`, its `alt` is empty, and it sits left of the
  badge's text on the same line.
- RF-2: THE SYSTEM sizes the badge logo to the badge's text and leaves the badge's text intact. —
  **Check:** the logo is 12–16px square, its vertical centre within 1px of the text's, the badge
  no taller than a text-only badge (24px today, measured 2026-10-17) by more than 1px, and the
  badge's `textContent` still equals the language.
- RF-3: WHERE the repository's language has no logo, THE SYSTEM shows the badge as text alone. —
  **Check:** a badge whose language `languageLogo` does not resolve holds no image and no mark.

## Non-functional requirements

- Spec 014 holds: the placeholder shows the language logo at 48px or the generic mark, the badge
  text clears 4.5:1 on its fill, the badge never reaches the centre of the placeholder's picture
  (owner, 2026-10-17: see below).
- Spec 030 holds: the badge in the top-right corner, the placeholder at most 96px tall.
- Brand logos are content (AGENTS, spec 012): the badge logo keeps its own colours, contrast
  accepted as measured.

## Edge cases

- A long language name: the text ellipsises, the logo never shrinks — RF-2.
- No language: no badge at all, as spec 014 RF-5 — unchanged.

## Guards this changes (AGENTS: never silently)

- `e2e/project-cards.spec.ts` (spec 014 RF-2) asserts the card shows exactly one image. With the
  badge's logo it shows two of the same file; the check is narrowed to the placeholder (one
  image there, the language's logo) and RF-1 here counts the badge's. The "no other file than
  the language logo" check stays card-wide.
- The same guard's "badge covers the logo" check takes the card's first visible image as the
  placeholder's picture (`e2e/project-cards.spec.ts:98`); the badge now comes first in the DOM
  (`ProjectCard.astro:41`), so it would compare the badge with its own logo. It is narrowed to
  the placeholder's picture.
- Owner decision at implementation (2026-10-17): with its logo the badge measures 95px, and on a
  1280 px card (242px) it overlaps the centred 48px logo by about 10px; at 1008 px it clears it
  by 3px. Offered a left-aligned logo, the badge under the name or the badge bottom-left, the
  owner kept the layout as it is. Spec 014's check now fails only when the badge reaches the
  picture's horizontal centre, so the logo stays recognisable.

## Out of scope

- The project page (/proyectos/<name>) and its language display.
- Logos for languages `REPO_LANGUAGES` does not list.

## Done when

`npm test` and `npm run test:e2e` green; each new guard shown red on today's card and by
injection; the cards seen on the home and on /proyectos, light and dark, at 1280 and 390 px,
stopping for the owner's visual approval.

## Open questions

None.

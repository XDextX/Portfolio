# Spec 043 — Project labels in the visitor's language

**Status:** implemented
**Size:** S
**Approved:** 2026-10-18 · one clarify round with the owner's decisions; previewed on mobile in both themes · 65 lines, 3 RF
**Implemented:** 2026-10-18 · commits `68298e8` (labels), `8747d0b` (guard) on spec/043-stars-forks-labels · 5/5 tasks, `npm test` 302/302, e2e 234/234 · 3/3 RF, NFRs and edge cases validated by the SDD reviewer; injections 1–6 red; owner visual approval
**Changed:** 2026-10-18 · RF-3 adds role='group' on the topics, without which their label is not announced · 67 lines

## Context and goal

The Spanish project page reads "Stars: 0 / Forks: 0". The Spanish locale keeps the English
strings for `project.meta.starsLabel` and `project.meta.forksLabel`. The project card and the
project page also write `title='Stars'` / `title='Forks'` as literals, and on the page an
`aria-label='Stars'` / `'Forks'` replaces the visible "Stars: 0", so assistive tech hears no
count; the card already names its count. The same page labels its topics `aria-label='Tags'` and
its README section `aria-label='Documentation'`, also literals. AGENTS says visitor-facing text
never bypasses `t()`, because a literal survives a locale switch and ships one language to every
reader. Seen on the dev server at 390×844 on 2026-10-18.

## Actors

Visitors reading a project card or a project page, in either locale, with or without assistive
tech.

## Requirements (EARS)

- RF-1: THE SYSTEM labels the star and fork counts "Estrellas: {{count}}" and "Forks: {{count}}"
  in Spanish, and "Stars: {{count}}" and "Forks: {{count}}" in English (owner, 2026-10-18). —
  **Check:** each locale's `starsLabel` and `forksLabel` equal those strings.
- RF-2: THE SYSTEM gives the star and fork counts, on the card and on the project page, a tooltip
  and an announced text resolved from `starsLabel` / `forksLabel` with that count. — **Check:**
  rendered in each locale, every `title` on a count equals that key resolved with the count shown,
  and what assistive tech reads for the count (its accessible name, or its text when it has none)
  contains the same string.
- RF-3: THE SYSTEM labels the project page's topics and README section through `t()`, the topics
  as a group (`role='group'`), since a label on a generic element is not announced. — **Check:**
  rendered in each locale, the topics carry `role='group'`, and those two `aria-label`s equal their keys' strings — "Etiquetas" and
  "Documentación" in Spanish (owner, 2026-10-18), "Tags" and "Documentation" in English — and the Spanish render
  contains neither English word as an attribute value.

## Non-functional requirements

- Both themes and both locales; nothing changes visually beyond the words.
- The count keeps the locale's number format (`Intl.NumberFormat`), as today.

## Edge cases

- A count of 0: the card hides it, as today, and the page still shows it. RF-1 and RF-2 apply to
  both.
- A large count on the card (`formatCount`, e.g. `1.2k`): the tooltip carries the full count the
  key resolves. RF-2.

## Out of scope

- Whether the page should hide a 0 count like the card does.
- The rest of the project page's layout (spec 044). Both specs edit the same sidebar lines of the
  project page, so 043 lands first and 044 builds on it.

## Done when

`npm test` and `npm run test:e2e` green; each new guard shown red by injecting a literal back;
a Spanish and an English project page and card read on the dev server, in light and dark.

## Open questions

None. Resolved 2026-10-18: "Estrellas" and "Forks" in Spanish, "Forks" kept as the developers'
term over "Bifurcaciones" (owner, 2026-10-18); the `Tags` and `Documentation` literals folded in
as RF-3 (owner, 2026-10-18).

# Spec 013 — Experience as a vertical timeline

**Status:** implemented
**Size:** M
**Approved:** 2026-10-15 · three clarify rounds, no blocker left; five owner decisions recorded · 208 lines, 8 RF
**Changed:** 2026-10-16 · owner decisions: the chip list's name adds the job's period (review finding: two jobs at one company named their lists alike); the rail is dotted in `--neutral-400` and every dot paints over it
**Implemented:** 2026-10-16 · commits `b06c802` (shortcut rule and hook), `d85259f` (shared .tag), `e1e5b62` (card), `3471914` (section) · 10/10 tasks, `npm test` 186/186, e2e 84/84, build green · 8/8 RF, NFRs and edge cases validated; 17 injections red, probes P1 and P2 green; bullets at 390px 270 to 244px; seen in light and dark, es and en

One section, the Experience component and its card. The jobs stay one list, one
item per job, in data order, as they are today.

## Context and goal

The Experience section is two stacked cards with a gold left spine and nothing
that says they are a sequence. The owner's mockup draws the same jobs as a
vertical timeline — a rail with a gold dot per job and the year period beside it
— and adds, per job, a generic company icon and the technologies used as chips,
then closes the section with a "Ver CV completo" link to the CV. The goal: one
glance down the section tells *when* each job was, *where*, and *with what*, and
the full CV is one obvious step away from where the career is read. Section 4 of
the 2026-10 redesign; the section title is spec 008's.

## Decision log

- **No duration (owner, 2026-10-15).** The owner has no start or end months, so
  a duration ("3 años") would be typed by hand: a second datum for the same fact,
  checkable against nothing. The timeline shows the year period the data already
  carries, verbatim. If the months are recovered they enter the data first, and a
  duration becomes a new requirement on that data.
- **Generic company icons (owner, 2026-10-15).** The mockup's marks are generic,
  so the site's are too: a building for SD Misiones, a plant for Plantas y Flores,
  Tabler (MIT). They are decoration — the company name beside each says who it
  is. **Rejected:** real logos (a third party's mark and a licence per company).
- **Tech chips (owner, 2026-10-15).** SD Misiones — .NET, Angular, TypeScript,
  SQL Server, Azure Functions, SSE, CI/CD. Plantas y Flores — .NET, ASP.NET, Java,
  Kotlin, JavaScript, SQL Server. Free strings per job: a chip records what a job
  used, and SQL Server or CI/CD are not skills. Editable content, with the job.
- **"Gold" is the text gold** (cross-cutting): the dots use it. The brand gold
  measures 1.61:1 on the light sheet.

## Definitions

- **Job:** one entry of the experience data, rendered as one card.
- **Period:** the job's localised year range ("2022 - 2025"), shown as written.
- **Rail / dot:** the vertical line, and the gold mark on it, one per job.
- **Company icon:** the decorative pictogram beside a job's company name.
- **Tech list / chip:** the technologies a job used, each shown as a small tag.
- **CV link:** the "Ver CV completo" link that closes the section.

## Actors

One: a visitor reading the home page, either theme, either locale, from 390px
up, with or without a screen reader, with or without scripts.

## User stories

- US-1: As a visitor, I want the jobs on a timeline with their years so that I
  read the career as a sequence.
- US-2: As a visitor, I want each job's technologies as chips so that I see what
  was used without reading every bullet.
- US-3: As a visitor, I want a link to the full CV at the end of the section so
  that I can go deeper from where I am reading.
- US-4: As a screen-reader user, I want the jobs announced as a list and the
  drawing left out, so that decoration costs me nothing.

## Requirements (EARS)

Rendered checks run end-to-end against the home page, in both themes and both
locales unless an RF narrows it.

- RF-1: THE SYSTEM draws the timeline as decoration: one dot per job, level with
  its card, on a rail running from the first dot to the last.
  — **Check:** at 1280px and 390px, with the real data and with a third job added:
  dot count equals job count, each dot's centre lies within its card's box, the
  rail's ends lie within 1px of the first and last dots' centres, and the
  accessibility tree holds no node for the rail or any dot.
- RF-2: THE SYSTEM shows each job's period exactly once, inside that job's list
  item, before its role in reading order, with no duration.
  — **Check:** each item's text holds the data's period for the locale once, ahead
  of the role, and nothing else between dot and role; no job in the data carries
  a duration field.
- RF-3: THE SYSTEM shows each job's declared company icon beside its company name,
  with no accessible name.
  — **Check:** a building beside SD Misiones and a plant beside Plantas y Flores,
  and no accessibility-tree node for either icon.
- RF-4: THE SYSTEM shows a job's tech list as chips, one per entry, in data order.
  — **Check:** each job's chip texts equal its data list in order (7 and 6 today).
- RF-5: THE SYSTEM gives each chip list an accessible name, through `t()`, that
  names its job's company and period (two jobs at one company stay distinct).
  — **Check:** each chip list's accessible name contains its company and differs
  from the other's, in both locales, with no `{{` left in it.
- RF-6: WHILE either theme is active, THE SYSTEM paints each new mark at or above
  its contrast floor against its ground.
  — **Check:** computed colours per theme, also after a theme switch without
  reload: chip text on chip fill ≥ 4.5:1 (4.74 light, 6.31 dark today); each dot
  on the sheet, and on any spec 009 glow under it, ≥ 3:1 (text gold: 6.01 light,
  6.66 dark); each company icon, in the neutral icon colour (`--icon-mono`, the skills section's), on the card ≥ 3:1
  (6.19 light, 4.78 dark).
- RF-7: THE SYSTEM shows one CV link after the job list that opens the CV the
  hero's CV button (spec 010) points at, without downloading it.
  — **Check:** the link follows the list in document order, its target equals the
  hero CV button's, it carries no download attribute, and the target returns 200.
- RF-8: WHILE the viewport is 390px wide, THE SYSTEM keeps the rail and dots at
  the list's left edge with each period inside its card.
  — **Check:** at 390px, the rail lies left of every card, each period's box lies
  inside its card's box, and the page's scroll width equals its client width.

## Non-functional requirements

- Every visitor-facing string goes through `t()`; the CV label is "Ver CV
  completo" in Spanish, "View full CV" proposed in English (owner approves the
  copy). Company and technology names are data, the same in both locales.
- Company icons live with the other UI icons, with their source and the Tabler
  licence on record, painted as a single-colour mask in the current colour; each
  glyph keeps one meaning across the page. No new runtime dependency, no
  third-party subresource. Each icon download needs the owner's OK (file, source,
  size) when it happens.
- A chip is a tag: its corners take the tag size class, not the pill reserved for
  the level badge and the language chip (AGENTS, radius).
- Navy and gold only: no new hue; any token read is defined in both themes.
- Nothing in the section depends on scripts or animation.
- The card carries no gold left spine: the dot marks each job. — **Check:** the
  card's left border width equals its other borders' in both themes.
- Hover follows the AGENTS rule as written: the card's border turns text gold and
  nothing lifts; today's hover shadow goes. Spec 017 does not cover this card, so
  the check is this spec's. — **Check (e2e):** during hover the border colour
  equals the theme's text gold, and the shadow and transform equal their values
  at rest.
- The section title is spec 008's component; the CV link's focus ring is spec
  016's. This spec re-specifies neither.

## Edge cases

- **A third job, or more.** RF-1 follows the data.
- **A single job.** One dot, no visible rail (RF-1: first dot is last dot).
- **A job without chips** (absent or empty list). No chip list renders for it:
  an empty list is announced as "list, 0 items".
- **Two jobs at the same company.** Two items, two dots; the company icon may
  repeat.
- **A job without an icon.** No icon and no placeholder; the name stands alone
  (RF-3 shows only what a job declares).
- **A period not shaped "YYYY - YYYY"** ("2025 - Presente"). Shown verbatim
  (RF-2); RF-8 covers the longer string at 390px.
- **A long company name or tech list at 390px.** Wraps inside the card; RF-8's
  scroll-width check covers it.
- **Forced colours.** The rail, dots and icons are decoration and may vanish; the
  list, periods and names remain (RF-2).

## Out of scope

- A duration, or start and end months (Decision log).
- Rewriting the roles, bullets, locations or company names; adding jobs.
- A Spanish CV, or a hint that the only CV is in English.
- Company logos; linking a chip to the skills section; brand icons on chips.
- Found in passing: the card declares a heading-id suffix for two jobs at one
  company, but nothing passes it, so those ids would collide today.

## Prerequisites

- Constitution 7 amended to admit the e2e suite, AGENTS Commands and Git rules to
  match, and the pre-commit hook running it (cross-cutting decision).
- The AGENTS rule for the UI icon home, its notice and licence.
- Spec 008 (section title) and spec 016 (focus ring) implemented.
- Spec 010 (hero) implemented: RF-7 links to its CV button.
- Spec 009 (dark glows) implemented, or RF-6's dot floor is measured again once
  it is: the dots may sit on its glows.

## Guards retired

None. The icon-licence guard reads only the brand-icon notice today; it is widened
to the UI icon home, not relaxed.

## Done when

- `npm test` and the e2e suite green, and the build green.
- Every new guard shown red by injecting its violation, reverted by explicit
  path, the injection named in the commit (constitution 4).
- `tests/tokens.test.ts` green.
- The home page in es and en, light and dark, at 1280px, 800px and 390px, each
  component shown in both themes and approved before its own commit.
- Both icons downloaded with the owner's OK; the data carries the owner's chip
  lists above.

## Decision

Owner answers, 2026-10-15:

- **Spine removed.** The dot marks each job. **Discarded:** keeping it in text
  gold (6.18 light, 5.90 dark) — two gold verticals a few pixels apart saying one
  thing, the second outline the visual-language rules warn about.
- **Company icons in the neutral icon colour** (6.19 light, 4.78 dark on the
  card); gold stays for the dots. **Discarded:** text gold (6.18, 5.90) — it
  would compete with the dots and the section title for the one accent.
- **"Ver CV completo" opens the PDF**; the hero button keeps downloading.
  **Discarded:** downloading here too — the label says "Ver", and a download is
  what the hero's "Descargar CV" already offers.
- **Card hover: the border turns gold, nothing lifts** — the AGENTS Hover rule as
  written, no amendment; today's shadow goes. **Discarded:** no hover at all — it
  would need an AGENTS amendment extending the skills-row exception.
- **At 390px the rail and dots stay at the left; the period moves into the card.**
  **Discarded:** dropping the rail below a width — phones would lose the timeline,
  to save the bullets only the rail's width.

## For the plan

- RF-2's "nothing between dot and role" reads the rendered item, not a source
  grep; its data half reads the data module.
- RF-1 and the no-chips edge case inject a third job and an empty list into the
  data, then revert.
- RF-8's cost: measure the bullets' box at 390px before the change and record it.

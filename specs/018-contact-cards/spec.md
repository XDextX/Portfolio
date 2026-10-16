# Spec 018 — Contact cards: location card and copy controls

**Status:** implemented
**Size:** M
**Approved:** 2026-10-15 · two clarify rounds, no blocker left; owner decision: copy the full URL · 147 lines, 6 RF
**Changed:** 2026-10-16 · owner decisions at the visual review: no location card (RF-1 three cards, RF-2 two readers, RF-3 withdrawn, the location-icon NFR gone); GitHub logo one file per theme
**Implemented:** 2026-10-16 · commit `7ac906d` · 7/7 tasks, `npm test` 199/199, e2e 102/102, build green · RF-1, RF-2, RF-4–RF-6, NFRs and edge cases validated (RF-3 withdrawn); 13 injections red, 12 and 16 re-run after widening their checks; seen at 1280 and 360px in light and dark, es and en

## Context and goal

The contact section today is three cards — Email, GitHub, LinkedIn — and only the
email card can be copied (`ContactCard.astro:14`). The owner's proposal adds a
location card and a copy control on every card whose value is worth pasting
somewhere else.

Today's copy feedback swaps the button's content through `innerHTML` for 1.5 s
(`ContactCard.astro:81`, `:88`) inside a button fixed at 2rem × 2rem
(`ContactCard.astro:164-165`). AGENTS forbids both: a label swap must not resize
the control nor depend on a hardcoded width. Spec 007 (approved) owns the
colour of that visible label; this spec owns its mechanism, its duration and the
announcement to assistive technology. The location is spelled twice today
(`src/data/about.ts:21` and `:71`); the new card would be a third reader, so it
comes in with one source.

The section title (spec 008) and the section's place on the page are shared
context, owned by neither this spec nor spec 015.

## Definitions

- **Copy control:** the button on a card that writes the card's value to the
  clipboard.
- **Feedback label:** the visible "copied" or error text the copy control shows
  in place of its icon after a copy.
- **Location datum:** the owner's location as the About section shows it.

## Actors

One: the visitor, in either theme, on any viewport.

## User stories

- US-1: As a visitor, I want to copy the owner's email or a profile address in
  one click so that I can paste it where I already work.
- US-2: As a visitor, I want to see where the owner is based without hunting for
  it in the bio.

## Requirements (EARS)

- RF-1: THE SYSTEM shows three contact cards — Email, GitHub, LinkedIn — each with
  its icon visible on its card. — **Check:** an e2e test counts three cards in that
  order, each icon rendered with a non-zero box, in both themes; each logo shows its
  theme's file and paints some pixel at 1.5:1 or more against its card.
- RF-2: THE SYSTEM holds the location in one datum, which the About section and the
  person's structured data both read. — **Check:** a scan of comment-stripped
  site-level data and components finds the location's literal exactly once, in
  `about.ts`; a source read because a duplicated equal string renders the same
  (constitution 8); and e2e reads the About section's text and the structured data's
  country and fails unless both are equal. Job locations and the rest of the
  experience data are another datum, skipped by the scan.
- RF-3: *Withdrawn 2026-10-16* — the location card is out (Decision).
- RF-4: WHEN the visitor activates the copy control on the Email, GitHub or
  LinkedIn card, THE SYSTEM copies that card's value to the clipboard. —
  **Check:** e2e reads the clipboard after each: the email from the data; for GitHub
  and LinkedIn the profile's full `https://` URL (Decision).
- RF-5: WHEN a copy succeeds or fails, THE SYSTEM shows the feedback label for
  1.5 s inside the control, at the control's resting size. — **Check:** an e2e
  test, both locales, both outcomes: the label is visible, its scroll width does
  not exceed the control's client width, the control's box equals its resting
  box to the pixel, and the icon returns after 1.5 s.
- RF-6: WHEN a copy succeeds or fails, THE SYSTEM announces the result in a live
  region. — **Check:** an e2e test reads the polite live region's text after each
  outcome and matches the locale's string.

The control's fixed 2rem width goes: per AGENTS, icon and both labels stack in
one grid cell with the inactive ones `visibility: hidden`, so the resting size is
already the widest state in each locale and RF-5 holds without a hardcoded width.

## Non-functional requirements

- **Language.** The Email and Location card labels, the copy labels and the
  announcements through `t()`, es and en (constitution 10). GitHub and LinkedIn
  are proper names and stay as data.
- **No horizontal scroll at 360px** with a copy control on three cards (the
  current fix measured 84px of scroll at 360px without it,
  `ContactSection.astro:65`). Checked by e2e.
- **Icons.** The brand logos are content (prerequisite 2); the location icon is
  self-hosted with its licence (constitution 2).
- **Root-absolute icon paths**, already settled by `tests/contact.test.ts`.

## Edge cases

- **Clipboard denied or insecure context:** the error label (RF-5) and its
  announcement (RF-6).
- **A long value at 360px:** ellipsized, never widening the card (NFR).
- **A second click within 1.5 s:** shows and announces the new outcome; the box
  stays (RF-5, RF-6).
- **The longer locale's label:** sets the control's width in that locale (RF-5).

## Out of scope

- The contact form, its endpoint, anti-spam and privacy line: spec 015.
- The feedback label's colour and the icon buttons' fill and text on hover: spec
  007. Their border colour and hover border: spec 017. The focus ring: spec 016.
- Phone and website contact kinds; the type keeps them, nothing renders them.

## Guards retired

None. No test reads the copy control (`grep -rn "data-copy" tests/` is empty);
its `data-copied` and `data-error` attributes lose their reader and go (AGENTS
"do not emit an attribute nobody reads"). Spec 007's measurement of the feedback
label's colour while hovered still applies, on the new label.

## Done when

- `npm test` and the e2e suite green; `npm run build` green.
- Every new guard shown red by its injection, then reverted by explicit path.
- Seen from the dev server, light and dark, 1280px and 360px, both locales: four
  cards, a copy that succeeds, and one that fails.

## Prerequisites

1. **Constitution 7 amended** so the e2e suite runs in the pre-commit hook; every
   rendered check above depends on it.
2. **AGENTS amendment:** brand logos are content, outside the navy-and-gold rule.
3. **Spec 008** (section title), **spec 016** (focus ring), **spec 017** (control
   borders for the copy and open buttons) and **spec 007** (button text on the
   accent surface, which the icon buttons and the feedback label take on hover).
4. **Owner's OK** for the location icon download (Tabler, MIT), with file, source
   and size, into the UI icon folder with its licence.

## Decision

- 2026-10-15 · GitHub and LinkedIn copy the full `https://` URL, so the pasted value
  works as a link anywhere. Discarded: the displayed value without the scheme. Owner
  decision.
- 2026-10-16 · **No location card.** Seen implemented, the owner dropped it: the
  location stays one datum in `about.ts`, read by the hero and the JSON-LD, and the
  contact section shows the three linked channels. Discarded: keeping the datum in
  `CONTACTS` with no card to render it — an entry nothing draws. Owner decision.
- 2026-10-16 · **GitHub's logo, one file per theme.** The white mark vanished on the
  light card (1.00:1); Devicon `github-original` (`#181616`) draws in light, the
  white file in dark. Owner decision (option 2).

## For the plan

- The about data already imports the contacts one way (`about.ts` reads
  `contacts.ts`); the location card reading the location datum must not close
  that cycle.
- The contact item type has no location kind and requires an `href`
  (`src/types/contact.ts:1`, `:7`).
- RF-2's scan must tell the site-level location from the per-job ones
  (`src/data/experience.ts:23`, `:52`).

# Spec 020 — Reduced motion stops smooth scrolling

**Status:** implemented
**Size:** S
**Approved:** 2026-10-16 · one clarify round, three minor findings applied, no blocker · 61 lines, 2 RF
**Implemented:** 2026-10-16 · commit `008c648` · 2/2 tasks, `npm test` 225/225, e2e 112/112 · 2/2 RF, both themes and the live switch validated; 3 injections red

## Context and goal

Once anything on the page has focus, the page scrolls with an animation, and it does so for every
visitor. Measured on 2026-10-16 against the dev server: with the operating system asking for
reduced motion, the root's computed `scroll-behavior` is `smooth` as soon as a form field is
focused, exactly as with no preference. Transitions already stop under that preference; scrolling
does not. A visitor who asked for less motion still gets the page sliding under them on every
in-page link and focus jump, which is the motion WCAG 2.3.3 asks to be able to turn off. The goal:
the preference stops the animated scroll, and nothing changes for everyone else.

## Actors

Visitors whose system asks for reduced motion, and visitors whose system does not.

## User stories

- US-1: As a visitor who asked my system for reduced motion, I want in-page jumps to land
  instantly so that the page does not slide under me.

## Requirements (EARS)

- RF-1: WHILE the visitor prefers reduced motion, THE SYSTEM scrolls the page without animation,
  with or without focus inside it. — **Check:** a rendered test with reduced motion requested
  reads the root's computed `scroll-behavior` at rest and with a field focused, in each theme
  and again after the preference is switched on with the page open, and fails on anything but
  `auto`.
- RF-2: WHILE the visitor states no motion preference, THE SYSTEM keeps today's behaviour: no
  animation at rest, an animated scroll once focus is inside the page. — **Check:** the same
  test without the preference fails unless it reads `auto` at rest and `smooth` with a field
  focused.

## Non-functional requirements

- Both themes behave the same: the preference is about motion, not colour.
- The browser's own preference decides it; no dependency is added.

## Edge cases

- A visitor who changes the preference with the page open — RF-1, whose check switches it live.

## Out of scope

- Other animations: transitions already stop under the preference.
- How the end-to-end tests currently force instant scrolling; whether they can drop that is a
  plan question.

## Done when

`npm test` and `npm run test:e2e` green; the RF-1 guard shown red against today's stylesheet and
green after; the RF-2 guard shown red by injecting a rule that drops smooth scrolling for
everyone.

## Open questions

None.

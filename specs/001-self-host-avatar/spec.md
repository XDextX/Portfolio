# Spec 001 — Self-host the avatar

**Status:** rechazada

## Decision (2026-10-06)

Rejected on purpose. Constitution principle 2 keeps its carve-out — *"The one remote
asset a page loads is the GitHub avatar"* — and `ABOUT.avatar` stays remote. The user
chose this over amending the principle.

**This file is kept deliberately, as the record of an option that was considered and
turned down.** Deleting it would only make the next person re-propose it without knowing
why it was refused. Nothing here is implemented; the requirements below describe the work
that was *not* done.

What that choice leaves in place: the hero image costs a DNS lookup, a TLS handshake and
a redirect chain to a third party on first paint, and principle 2 stays unenforceable as a
plain check. Both are accepted costs, not oversights.

## Context and goal

`ABOUT.avatar` is `https://github.com/XDextX.png`, which redirects to
`https://avatars.githubusercontent.com/u/32227089?v=4`. The hero image therefore costs a
DNS lookup, a TLS handshake and a redirect chain to a third party on first paint, and
constitution principle 2 exists only to excuse it. Self-hosting removes the request and
lets that principle become the plain check it was meant to be.

## Actors

One: the visitor. There is no second actor and no admin surface.

## User stories

- US-1: As a visitor on a slow connection, I want the hero image served from the same
  origin as the page so that the first paint does not wait on a third-party CDN.

## Requirements (EARS)

- **RF-1: THE SYSTEM serves the avatar from `public/avatar.png` on every route that
  renders it.** — **Check:** `about.test.ts` stats the file and asserts `ABOUT.avatar` is
  root-absolute, mirroring the icon check `contact.test.ts` already does.
- **RF-2: IF a page is served, THEN THE SYSTEM makes no request to a third-party host.**
  — **Check:** the served HTML of `/` is fetched and asserted to contain no external
  `src`/`href` host. Not a source grep, and the reason is required by constitution 8:
  `output: "server"` means `dist/` holds no HTML, but the *served* response does, so this
  is an output check and a grep would break on refactors that change nothing visible.
- **RF-3: THE SYSTEM ships `Person.image` in the JSON-LD as an absolute URL.**
  — **Check:** `about.test.ts` asserts it starts with `https://`. A root-relative value
  would be a regression here, not a neutral change: the entity is consumed off-domain.
- **RF-4: THE SYSTEM declares no `preconnect` to a host it no longer contacts.**
  — **Check:** `about.test.ts` reads `BaseLayout.astro` and asserts no
  `preconnect` to a non-same-origin host remains.
- **RF-5: THE SYSTEM makes no request to `avatars.githubusercontent.com` from any file in
  `src/`.** — **Check:** this *is* a grep, and the reason it cannot be a data check is
  that constitution 2 names the host, so the rule is about a string's presence, not about
  observable output. `about.test.ts` owns it, which is what lets RF-2 be the real check.

## Non-functional requirements

- Performance: one fewer DNS lookup, TLS handshake and redirect on the LCP candidate.
- The shipped bytes must not grow. `public/avatar.png` is the same 460×460, 26,322-byte
  PNG the browser already downloads.

## Edge cases

- The PNG is RGBA but every pixel is opaque (`a=255` across all 211,600), so the square
  artwork needs the existing `is-square` field and border to read against a near-white
  sheet. Nothing changes: the bytes are the same ones already being rendered.
- `AvatarCircle` already accepts a root-absolute `src`; no prop changes.

## Out of scope

- **`og:image` points at `${site}/og-cover.png`, which does not exist in `public/`.**
  Every social preview of this site is already broken. One line, separate change.
- **The site URL is written three times** — `astro.config.mjs:8`, `BaseLayout.astro:27`,
  `about.ts:41`. RF-3 needs it in `about.ts`, which makes the duplication visible without
  making it worse. Collapsing it is a separate change.
- **The `is-square` comment credits the field with giving the tile a boundary.** The image
  is opaque and covers the padding box, so the field is never visible; the border is what
  shows. The claim is true only of the empty case, and does not say so.
- Resizing the avatar to 360×360 to save ~10 KB. It needs a resampling tool this repo does
  not have, and constitution 7 is against adding one to make an optimisation happen.

## Done when

- `npm test` and `npm run build` green.
- Every new guard proven by injection: revert the avatar to the remote URL and watch
  RF-1, RF-2, RF-4 and RF-5 go red.
- The avatar renders in both themes, checked against a running server — `dist/` holds no
  HTML, so a green build does not prove this.

## Open questions

- [NEEDS CLARIFICATION] **This spec contradicts constitution principle 2, and that
  contradiction is its first finding.** The principle currently reads: *"The one remote
  asset a page loads is the GitHub avatar."* Self-hosting makes that sentence false, and
  the check below it names `avatars.githubusercontent.com` as the expected host. Amending
  the constitution is your call, not mine. Two forms, and they are not equivalent:
  - *Delete the sentence and the carve-out*, leaving principle 2 as a rule that can be a
    plain check — which is what RF-2 and RF-5 then enforce.
  - *Keep the sentence and refuse this spec*, leaving the third-party request in place.
- [NEEDS CLARIFICATION] Should the existing test `ships the avatar as one fetchable https
  URL` be replaced or renamed? RF-1 supersedes it. It asserts only that the string starts
  with `https://`, which passes on a URL that 404s, so keeping it would be keeping a
  weaker version of the same check under a name that no longer describes it.

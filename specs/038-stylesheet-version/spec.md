# Spec 038 — Versioned links to the public stylesheets

**Status:** implemented
**Size:** S
**Approved:** 2026-10-17 · clarify by the coordinator, no finding; approved under the owner's delegation for the day ("decide tú", 2026-10-17) · 69 lines
**Implemented:** 2026-10-17 · commits `2a9139c` (version function), `dcdd05e` (versioned links) · 2/2 tasks, `npm test` 269/269, e2e 184/184 · 3/3 RF, NFRs and edge cases validated (the dev server's head carries ?v=61584e2881c9 on all eight sheets); 3 injections red

## Context and goal

The site's global sheets live in `public/styles/` and are linked from `BaseLayout.astro` by fixed
URLs (`/styles/00-tokens.css` and seven more), apart from the component CSS Vite bundles under
hashed names. Measured on 2026-10-17: production serves them with
`Cache-Control: public, max-age=0, must-revalidate` and an ETag, the dev server with `no-cache`,
so a full load always revalidates. The gap is `<ClientRouter />`: on an in-site navigation it
keeps a stylesheet already in the document when its URL is unchanged. A tab open across a deploy —
or across a token edit in development, which is what the owner saw after spec 036 — then pairs new
component CSS with old token sheets: the hero band read `--sheet-*` tokens the old
`00-tokens.css` lacked and spilled outside the sheet until a hard reload.

Decided on 2026-10-17 (the owner delegated the day's decisions): each public sheet's URL carries a
version derived from the content of `public/styles/`, so any change gives new URLs and the router
loads them.

## Actors

Visitors with the site open across a deploy; the owner developing locally.

## Requirements (EARS)

- RF-1: THE SYSTEM links every `public/styles` sheet with a `v` query equal to a hash of the
  directory's content. — **Check:** on `/` and `/proyectos`, every `<link rel="stylesheet">` whose
  path starts with `/styles/` carries `?v=`, the same value on all of them, equal to this test's own
  hash of `public/styles` (every file's relative path and bytes, in path order).
- RF-2: WHEN any file in `public/styles` changes, THE SYSTEM gives the sheets a different version.
  — **Check:** the version function returns different values for two copies of the directory that
  differ in one byte of one file, and the same value for two identical copies.
- RF-3: THE SYSTEM keeps the sheets' order and their content as they are. — **Check:** the linked
  paths, query removed, are the eight sheets in today's order, `05-fonts.css` before the others
  after `00-tokens.css`.

## Non-functional requirements

- No dependency (constitution 1); the version is computed in the build configuration, from the
  files, with Node's own `crypto` — no hand-bumped number to forget.
- The served sheets keep Vercel's `max-age=0, must-revalidate`; nothing else about caching changes.

## Edge cases

- A sheet edited while the dev server runs: the version is computed at server start, so a
  restart (or a full reload) is still needed in development; a deploy always rebuilds — RF-2.
- A file added to or removed from `public/styles`: it changes the hash — RF-2.

## Guards this changes (AGENTS: never silently)

- None.

## Out of scope

- Moving the sheets into Vite's bundle.
- Fonts and icons under `public/`: they do not change with tokens.

## Done when

`npm test` and `npm run test:e2e` green; each new guard shown red by injection; the head of `/`
read on the dev server with the versioned links.

## Open questions

None.

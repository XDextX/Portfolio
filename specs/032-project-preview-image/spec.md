# Spec 032 — Each project's own social preview on its card

**Status:** implemented
**Size:** M
**Approved:** 2026-10-17 · one clarify round, one blocking finding applied (spec 014's overlap check over a full-bleed preview) and four minor; approved with its plan and tasks · 102 lines
**Implemented:** 2026-10-17 · commit `f1817bc` · 4/4 tasks, `npm test` 247/247, e2e 150/150 · 7/7 RF, NFRs and edge cases validated (a preview beside cards without one, home and /proyectos, light and dark at 1280 and 390, owner visual approval); injections red, plus spec 014's widened guard
**Changed:** 2026-10-17 · owner decision after the visual review: no test image and no dev-only seam in the code. The rendered check gives the first card the element the component emits for a preview, drawn from a canvas, and RF-3 is settled on the section's rendered markup

## Context and goal

A project card's placeholder shows the repository's language logo, or a generic mark: it says
the technology, not the project (spec 014, spec 031). The owner asked on 2026-10-17 for the
project's own image wherever one exists, and chose its source from four options (document
`opciones-imagen-proyectos.pdf`): the **social preview** set in each repository's GitHub
settings. Only an image the owner uploaded counts; the one GitHub generates for every
repository does not. Measured the same day: 0 of 16 repositories carry a custom preview, so
the feature ships ready for images the owner will add.

Decided with the owner: when a card has the image, it fills the placeholder, the large logo goes
and the badge «[logo] TypeScript» stays in the top-right corner over it. Constitution 2 holds:
the browser never fetches the image from GitHub; the site serves it from its own origin.
Constitution 6 holds: the token that reads the preview stays read in `src/pages/lib/github.ts`.

## Actors

- Visitors browsing the projects on the home page and on /proyectos, in either theme.
- The owner, who uploads a repository's social preview on GitHub.

## Requirements (EARS)

- RF-1: WHERE a repository of the configured user has a custom social preview, THE SYSTEM fills
  that card's placeholder with it, edge to edge, in place of the language logo or the mark. —
  **Check:** with a preview in a card, its placeholder holds one image covering its box
  (within 1px each side, `object-fit: cover`), and no logo or mark; on / and /proyectos, both
  themes.
- RF-2: WHILE a card shows the preview, THE SYSTEM keeps the language badge in the
  placeholder's top-right corner, drawn above the image. — **Check:** the badge sits where spec
  030 RF-4 puts it, and the element at the badge's centre is the badge or inside it.
- RF-3: THE SYSTEM serves the preview from the site's own origin. — **Check:** the image's URL
  has the page's origin: the section renders the card's `src` as the route's path, and the home
  requests no host beyond the captured baseline.
- RF-4: WHERE a repository has no custom preview — GitHub's generated one included — or the
  preview cannot be read (no token, an API error), THE SYSTEM renders the card as without this
  spec. — **Check:** rendered with a generated preview, with no token and with a failing API,
  the card holds no preview image and the section still renders its cards.
- RF-5: WHEN the preview route is asked for a name that is not a configured repository with a
  custom preview, THE SYSTEM answers 404 without requesting any URL derived from that name. —
  **Check:** the route answers 404 for an unknown name, a repository without a custom preview, a
  repository of the user outside the configured topic and a path-traversal name, and no fetch
  carried any of those names.
- RF-6: WHEN the preview route is asked for a repository with a custom preview, THE SYSTEM
  answers the image's bytes with an image content type and a public cache lifetime; an upstream
  answer that is not an image is not relayed. — **Check:** the route answers 200 with the
  fixture's bytes, an `image/*` type and `Cache-Control: public`; an upstream `text/html` answer
  gives a 502 with none of the upstream body.
- RF-7: THE SYSTEM marks the preview decorative and declares its size, loading it lazily. —
  **Check:** the image's `alt` is empty, it carries `width`, `height` and `loading="lazy"`.

## Non-functional requirements

- Constitution 2: no remote host is fetched by the browser for a preview (RF-3).
- Constitution 6: `GITHUB_TOKEN` keeps one reader, `src/pages/lib/github.ts`; nothing about the
  preview reaches a client asset except the same-origin URL.
- The list of previews is read once per cache window (30 minutes, spec 023's cache), not once
  per card or per request.
- Specs 014, 030 and 031 hold for every card without a preview.
- The badge keeps its own fill, so its text keeps 4.5:1 whatever the image behind it.

## Edge cases

- A repository renamed on GitHub: its preview follows the new name — RF-1, RF-5.
- An oversized image: served as uploaded; the card crops it with `object-fit: cover` — RF-1.
- The preview read fails while the repository list succeeds: cards render as today — RF-4.
- A repository outside the configured topic with a preview: never shown, never served — RF-5.
- Production without `GITHUB_TOKEN`: no card shows a preview, as today — RF-4. The token is
  optional for the list, so the owner sets it in Vercel for previews to appear.

## Guards this changes (AGENTS: never silently)

- `e2e/project-cards.spec.ts` (spec 014 NFR "no project image"): an image in the placeholder
  other than the language logo was a violation. It becomes one unless it is the card's
  same-origin preview; with no preview the check is unchanged.
- The same guard's overlap check (`e2e/project-cards.spec.ts:98-101`, narrowed by spec 031) fails
  when the badge reaches the picture's centre. Over a preview that fills the placeholder the
  badge overlaps the picture by design (RF-2), and on a card narrower than about 214px it would
  reach the centre. The check is skipped for a preview and kept for the logo and the mark.

## Out of scope

- The project page (/proyectos/<name>).
- Resizing or re-encoding the image (constitution 1 allows no library for it).
- GitHub's generated preview, README images, files in the repository (options discarded in the
  document).

## Done when

`npm test` and `npm run test:e2e` green; each new guard shown red by injection; a card with a
preview seen on the home and on /proyectos, light and dark, at 1280 and 390 px, beside a
card without one, stopping for the owner's visual approval.

## Open questions

None.

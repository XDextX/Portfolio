# Spec 037 — README images served from the site's own origin

**Status:** implemented
**Size:** M
**Approved:** 2026-10-17 · one clarify round, one minor finding applied (RF-1 cannot pass on zero images); approved with its plan and tasks · 81 lines
**Implemented:** 2026-10-17 · commits `fe235ef` (route), `2415cf6` (page rewrite) · 3/3 tasks, `npm test` 268/268, e2e 176/176 · 6/6 RF, NFRs and edge cases validated (/proyectos/Portfolio 3/3 images and /proyectos/XDextX 33/35 loading from this origin, light and dark; the two left are broken at camo); 6 injections red

## Context and goal

A project page (/proyectos/<name>) shows the repository's README as GitHub renders it, and GitHub
points its images at other hosts. Measured on 2026-10-17 across the 16 listed repositories: two
READMEs carry images — Portfolio, three shields.io badges through `camo.githubusercontent.com`;
XDextX, 35 images through `camo.githubusercontent.com` and `raw.githubusercontent.com`. Each is a
third-party request from the visitor's browser, against constitution 2 (the GitHub avatar is the
one remote asset), and they hold the page's load event: about 520 ms each on Portfolio, found while
diagnosing two e2e timeouts.

Decided with the owner on 2026-10-17: serve them from the site's own origin, as spec 032 does for
project previews. The README keeps every image; the browser asks only this site for them.

## Actors

Visitors reading a project page.

## Requirements (EARS)

- RF-1: THE SYSTEM points every image of a rendered README at the site's own origin. — **Check:**
  on /proyectos/Portfolio and /proyectos/XDextX every README `img` has a same-origin `src`, none
  carries a `srcset`, and the page requests no host beyond the captured baseline (the avatar);
  the two pages hold at least one README image between them, so the check cannot pass empty. An image
  that does not load must be one the route answers 502 for (broken at its source, as two of
  XDextX's were on 2026-10-17: camo itself answered 404).
- RF-2: WHEN the README image route is asked for image N of a configured repository's README, THE
  SYSTEM answers the bytes GitHub's HTML points at for that image, with its image type. —
  **Check:** with GitHub stubbed, the route answers 200 with the stub's bytes and `image/*` type
  for an index in range.
- RF-3: WHEN the route is asked for another owner, a repository without a README, an index that is
  not a whole number in range, or an image whose host is not GitHub's (`camo.githubusercontent.com`,
  `raw.githubusercontent.com`, `github.com`, `user-images.githubusercontent.com`), THE SYSTEM
  answers 404 without requesting any URL built from the request. — **Check:** each case answers
  404, and a fetch spy records no image request for it.
- RF-4: IF the upstream answer is not an image, THEN THE SYSTEM does not relay it. — **Check:** an
  upstream `text/html` answer gives a 502 with none of its body.
- RF-5: THE SYSTEM serves each image so that it cannot run as a document from this origin. —
  **Check:** every 200 carries `X-Content-Type-Options: nosniff`, a `Content-Security-Policy` with
  `default-src 'none'` and `sandbox`, and `Cache-Control: public`.
- RF-6: THE SYSTEM leaves the rest of the README as GitHub rendered it. — **Check:** on a fixture
  README, the rewritten HTML differs from the original only in each `img`'s `src` and `srcset`.

## Non-functional requirements

- Constitution 2 holds again on project pages.
- The README and its image list are read once per cache window (spec 023's cache); an image route
  call does not refetch the README.
- `GITHUB_TOKEN` keeps its one reader (constitution 6); no dependency (constitution 1).
- The README route (`/api/v1/projects/readme/<owner>/<name>/readme.json`) serves the same rewritten
  HTML the page shows.

## Edge cases

- A README with no images: unchanged — RF-6.
- An upstream image that fails (camo down): the route answers 502 and the browser shows the image's
  alt text, as it would have before — RF-4.
- An animated GIF or an SVG badge: relayed as served, under RF-5's headers.

## Guards this changes (AGENTS: never silently)

- None expected.

## Out of scope

- Whether the XDextX profile repository belongs in the project list.
- Re-encoding or resizing images (constitution 1).
- Links inside the README that point at other hosts: a link is navigation, not a subresource.

## Done when

`npm test` and `npm run test:e2e` green; each new guard shown red by injection; /proyectos/Portfolio
and /proyectos/XDextX read in the browser with every image loading, light and dark.

## Open questions

None.

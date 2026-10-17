# Plan 032 — Each project's own social preview on its card

**Spec:** `specs/032-project-preview-image/spec.md` (7 RF).
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 107 lines
**Changed:** 2026-10-17 · at implementation: the pages read the names through one helper, listPreviewNames, which turns a failed read into none (RF-4) instead of a catch in each caller; owner, after the visual review: the dev-only fixture seam and its test image are gone (D-4 replaced), the rendered check builds the preview element in the page, and the section's Container render settles RF-3; a 2:1 preview loses about 27% of its height on a 1280px card and 48% on a 390px one, so an uploaded image keeps its subject centred and clear of the top-right badge

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 (preview fills the placeholder) | `ProjectCard` takes a `preview` URL; with one, `.card-media` holds an `<img class="card-preview">` (absolute, inset 0, `object-fit: cover`) and no `SkillLogo` or mark. |
| RF-2 (badge above it) | `.card-lang` gets `z-index: 1` over the image; its position is spec 030's. |
| RF-3 (own origin) | The card's `src` is `previewPath(name)` = `/api/v1/projects/preview/<name>`; the browser never sees GitHub's URL. |
| RF-4 (otherwise as today) | `ghPreviews()` keeps only `usesCustomOpenGraphImage: true`; with no token it makes no request and returns none; pages catch its failure as "no previews". |
| RF-5 (404, no name-derived request) | `getPreview(name)` answers null unless `name` is in the topic list **and** the previews map; the only URL fetched is the map's. |
| RF-6 (bytes, image type, cache) | The route relays the upstream body only when its type starts with `image/`, with `Cache-Control: public, max-age=1800`; otherwise 502 with a JSON error. |
| RF-7 (decorative, sized, lazy) | `alt=""`, `width="1280" height="640"` (GitHub's recommended preview size), `loading="lazy"`, `decoding="async"`. |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/pages/lib/github.ts` | modify | `ghPreviews` (GraphQL), `listPreviews` (cached), `getPreview` (name → bytes), `previewPath`. |
| `src/pages/api/v1/projects/preview/[name].ts` | create | The same-origin image route. |
| `src/components/ProjectCard.astro` | modify | `preview` prop; image in place of the logo; badge above. |
| `src/components/ProjectsSection.astro` | modify | `previews` prop (names), passes `previewPath(name)` to each card that has one. |
| `src/components/Resume.astro`, `src/pages/proyectos/index.astro` | modify | Read `listPreviews()` beside `listRepos()`, failure → none. |
| `tests/github-previews.test.ts` | create | RF-4, RF-5, RF-6 with stubbed fetch. |
| `tests/project-card.test.ts` | modify | RF-1 markup and RF-7. |
| `e2e/project-preview.spec.ts` | create | RF-1, RF-2, RF-3 rendered. |
| `e2e/project-cards.spec.ts` | modify | Spec 014's two checks, per the spec's guard list. |

## 3. Pure logic

`previewsFrom(nodes)`: GraphQL nodes → `Map<name, url>` of custom previews only. Tested with
custom, generated, missing-URL and empty inputs.

## 4. Algorithm

```ts
// github.ts
const PREVIEWS_QUERY = `query($login:String!){ user(login:$login){ repositories(first:100, ownerAffiliations:OWNER, privacy:PUBLIC){ nodes{ name usesCustomOpenGraphImage openGraphImageUrl } } } }`;
async function ghPreviews(): Promise<Map<string, string>> {
  if (!TOKEN) return new Map();                            // GraphQL requires a token
  const r = await fetch("https://api.github.com/graphql", { method: "POST", headers: baseHeaders, body: JSON.stringify({ query: PREVIEWS_QUERY, variables: { login: USER } }) });
  if (!r.ok) throw new Error(`GitHub error ${r.status}`);
  return previewsFrom((await r.json()).data?.user?.repositories?.nodes ?? []);
}
export const listPreviews = (now = Date.now()) => cached("previews", now, ghPreviews);
export async function getPreview(name, now = Date.now()) {
  const [repos, previews] = await Promise.all([listRepos(now), listPreviews(now)]);
  if (!repos.some((r) => r.name === name) || !previews.has(name)) return null;  // RF-5
  return fetch(previews.get(name)!);                                             // the map's URL only
}
export const previewPath = (name: string) => `/api/v1/projects/preview/${encodeURIComponent(name)}`;
```

```css
.card-preview { position: absolute; inset: 0; inline-size: 100%; block-size: 100%; object-fit: cover; }
.card-lang    { z-index: 1; }
```

## 5. Interface

| Width | Light and dark |
|---|---|
| 1280, 390 | a card with a preview: the image edge to edge in the 88px band, badge top-right over it; the others as today |

## 6. Decisions

- **D-1 · Names, not URLs, cross into the components.** The section receives the names that have
  a preview and composes `previewPath`; GitHub's image URL stays in `github.ts` and the route.
  *Discarded:* passing the upstream URL to the card, which is RF-3's violation one edit away.
- **D-2 · Check the topic list too.** The previews map covers every public repository; serving
  only names the site lists keeps the route from exposing a repository the site hides.
- **D-3 · Relay, don't cache bytes.** The route streams the upstream body with a public cache
  lifetime; the CDN and the browser hold it. *Discarded:* bytes in the memory cache, which a
  serverless instance loses anyway and which grows with every image.
- **D-4 · The preview element built in the page.** With 0 of 16 repositories carrying a
  preview, nothing renders one; the rendered check gives a card the element the component emits
  (its class and Astro scope attribute), so the site's own CSS is what is measured. *Discarded
  (owner, 2026-10-17):* a dev-only seam serving a test image, which put test code and a binary in
  the shipped module.

## 7. Test strategy

Runner from `package.json`: `npm test` and `npm run test:e2e`.

- **Unit** (`tests/github-previews.test.ts`): `previewsFrom` cases; `ghPreviews` with no token
  makes no request; a GraphQL error leaves the pages rendering (via `listPreviews` rejecting and
  the caller's catch, asserted on `Resume`/`proyectos` through the Container); the route's 404
  set with a fetch spy recording every URL; the 200 relay and the 502 on `text/html`.
- **Container** (`tests/project-card.test.ts`): with `preview`, one `img.card-preview` with
  `alt=""`, `width`, `height`, `loading="lazy"`, no logo, no mark, the badge present.
- **Rendered** (`e2e/project-preview.spec.ts`): the first card given a preview element, on / and
  /proyectos, both themes, at 1280 and 390: image box equals the placeholder's, `object-fit:
  cover`, element at the badge centre inside the badge. RF-3 on the section's Container render.
- **Injections:** (1) `object-fit: contain` → RF-1; (2) the logo kept beside the image → RF-1;
  (3) `z-index` removed and the image after the badge → RF-2; (4) the card `src` set to the
  upstream URL → RF-3; (5) `usesCustomOpenGraphImage` ignored → RF-4; (6) the route fetching
  without the map check → RF-5; (7) the type check removed → RF-6; (8) `alt={repo.name}` → RF-7.

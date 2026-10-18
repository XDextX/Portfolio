# Plan 037 — README images served from the site's own origin

**Spec:** `specs/037-readme-images/spec.md` (6 RF).
**Status:** approved
**Approved:** 2026-10-17 · owner approval with the spec · 76 lines
**Changed:** 2026-10-17 · at implementation: RF-1's check accepts a 502 for an image broken at its source (two XDextX images, camo answering 404); RF-3's inputs widened with 1e0 and ' 1' after the index-check injection stayed green (Number() alone let them through); the test's src reader uses \s, not \b, since data-canonical-src matched; the page's load event still waits on GitHub through the route (cached public for 30 minutes), so the e2e timeouts this was found from are not fully gone

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 (same-origin images) | `getReadme` returns the HTML with each `img` rewritten by `rewriteReadmeImages`: `src` → `readmeImagePath(owner, name, n)`, `srcset` dropped. |
| RF-2 (the route relays image N) | `getReadmeImage(owner, name, n)`: the raw README (cached), its N-th image URL, fetched. Route `src/pages/api/v1/projects/readme/[owner]/[name]/image/[n].ts`. |
| RF-3 (404 cases, no request built from input) | `getReadmeImage` returns null for a foreign owner (`isOwner`), no README, a non-integer or out-of-range N, or a host outside `README_IMAGE_HOSTS`; only the URL read from GitHub's HTML is ever fetched. |
| RF-4 (non-image not relayed) | The route checks the upstream type, 502 otherwise. |
| RF-5 (headers) | `nosniff`, `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox`, `Cache-Control: public, max-age=1800`. |
| RF-6 (nothing else changes) | The rewrite touches only `img` tags' `src` and `srcset` attributes. |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/pages/lib/github.ts` | modify | `readmeImageUrls`, `rewriteReadmeImages`, `readmeImagePath`, `getReadmeImage`, `README_IMAGE_HOSTS`; `getReadme` returns the rewritten HTML. |
| `src/pages/api/v1/projects/readme/[owner]/[name]/image/[n].ts` | create | The image route. |
| `tests/readme-images.test.ts` | create | RF-2 to RF-6 with stubbed fetch. |
| `e2e/readme-images.spec.ts` | create | RF-1 on the two pages. |

## 3. Pure logic

- `readmeImageUrls(html)`: the `src` of every `img`, in order.
- `rewriteReadmeImages(html, owner, name)`: each `img`'s `src` to its index path, `srcset` removed;
  everything else byte-identical.

## 4. Algorithm

```ts
const raw = await cached(`readme:${name}`, now, () => ghRepoReadme(...));   // as today
getReadme  → raw === null ? null : rewriteReadmeImages(raw, USER, name)
getReadmeImage(owner, name, n):
  if (!isOwner(owner) || !/^\d+$/.test(n)) return null;
  const raw = await cached(`readme:${name}`, ...); if (!raw) return null;
  const url = readmeImageUrls(raw)[Number(n)];
  if (!url || !README_IMAGE_HOSTS.has(new URL(url).host)) return null;
  return fetch(url);
```

The rewrite works on the `<img …>` tag text with a regex over attributes: GitHub's sanitised
output has quoted attributes and no nested `>` in them, which the fixture test pins.

## 5. Interface

None visible: the README looks as it does today.

## 6. Decisions

- **D-1 · Index, not URL, in the path.** The route never receives a URL, so it cannot be turned
  into an open proxy. *Discarded:* `?url=` with an allowlist alone.
- **D-2 · A host allowlist on top of the index.** GitHub's HTML is the owner's own, but the list
  bounds what a compromised or unusual README could make the server fetch.
- **D-3 · CSP sandbox on SVG.** An SVG opened directly from this origin could run script;
  `sandbox` and `default-src 'none'` stop it, and `nosniff` stops type confusion.

## 7. Test strategy

Runner from `package.json`: `npm test` and `npm run test:e2e`.

- **Unit** (`tests/readme-images.test.ts`): `readmeImageUrls` and `rewriteReadmeImages` on a
  fixture README (two camo images, one raw image, one with `srcset`, links and text around them);
  the route's 200, its headers, the 404 set with a fetch spy, the 502 on `text/html`; `getReadme`
  serves the rewritten HTML and one README fetch serves both calls.
- **Rendered** (`e2e/readme-images.spec.ts`): RF-1 on /proyectos/Portfolio and /proyectos/XDextX:
  `img` sources same-origin, no `srcset`, hosts within the baseline, at least one image found,
  every image `complete` with a natural width.
- **Injections:** (1) `getReadme` returning the raw HTML → RF-1; (2) the index check removed
  (`Number('1.5')`) → RF-3; (3) the host allowlist removed → RF-3; (4) the type check removed →
  RF-4; (5) the CSP header removed → RF-5; (6) the rewrite also touching `href` → RF-6.

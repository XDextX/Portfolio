# Plan 024 — The runtime dependency is the adapter that runs the site

**Spec:** `specs/024-runtime-adapter/spec.md` (**approved**, 2 RF, with the constitution 1
amendment).
**Status:** approved
**Approved:** 2026-10-16 · owner approval of plans and tasks 021–024 together, order 022, 024, 021, 023 · 56 lines
**Changed:** 2026-10-16 · at implementation: injection 2 is the adapter moved back to `devDependencies`; pointing the config at `@astrojs/node` crashed vitest, which loads `astro.config.mjs`, before the guard ran

**Ordering.** Implementation order across 021–024: 022, 024, 021, 023. After 022, which removes `node-fetch` and `@types/node-fetch` from the same
dependency guard. The constitution amendment is committed alone, as `docs:`, before the code.

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 (dependencies = astro + the adapter in use) | `@astrojs/vercel` moves to `dependencies` at its current range; `@astrojs/node` is removed. The dependency guard gains the adapter check. §7. |
| RF-2 (still builds for Vercel) | No config change; `npm run build` produces `.vercel/output`. §7. |

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `docs/constitution.md` | modify | Article 1 names `@astrojs/vercel`, the text approved in the spec. |
| `package.json`, `package-lock.json` | modify | `npm uninstall @astrojs/node`, then `npm install --save-prod @astrojs/vercel@^8.2.8` (already installed: no new code is fetched beyond resolving the range). |
| `tests/seo.test.ts` | modify | The dependency guard: `dependencies` equals `{ astro, @astrojs/vercel }`, and the adapter `astro.config.mjs` imports is one of them. |

## 3. Pure logic

None.

## 4. Algorithm

The guard's adapter check: read `astro.config.mjs`, strip comments, take the module of the
default import passed to `adapter:` (today `import vercel from "@astrojs/vercel"`), and expect it
among `dependencies`' keys. Source by necessity (constitution 8): the adapter choice exists only
in that file.

## 5. Interface

Not visible.

## 6. Decisions

- **D-1 · Keep the `^8.2.8` range.** *Discarded:* upgrading while moving it — out of scope, and
  a version change would mix two changes in one diff.
- **D-2 · The adapter check reads `astro.config.mjs`.** *Discarded:* importing the config and
  inspecting `adapter.name` — it runs the adapter's setup inside vitest for a name the import
  line already states.

## 7. Test strategy

Runner from `package.json`: `npm test`, `npm run test:e2e`, `npm run build`.

- **RF-1**: the updated guard in `tests/seo.test.ts`.
- **RF-2**: `npm run build` green and `.vercel/output/config.json` present.
- **Injections:** (1) `@astrojs/node` back in `dependencies` → RF-1 red; (2) the config imports
  `@astrojs/node` while `dependencies` lists `@astrojs/vercel` → the adapter check red.

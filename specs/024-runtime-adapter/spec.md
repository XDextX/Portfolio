# Spec 024 — The runtime dependency is the adapter that runs the site

**Status:** implemented
**Size:** S
**Approved:** 2026-10-16 · one clarify round, no finding; carries the constitution 1 amendment text, approved with it · 56 lines, 2 RF
**Implemented:** 2026-10-16 · commits `489cfb9` (constitution 1) and `a825a65` · 3/3 tasks, `npm test` 224/224 at the time, e2e 112/112, build green with `.vercel/output/config.json` · 2/2 RF validated; 2 injections red, the second swapped (see the plan)

## Context and goal

Constitution 1 names `astro` and `@astrojs/node` as the only runtime dependencies. The site is
built with the Vercel adapter, which sits in `devDependencies`, and `@astrojs/node` is imported
nowhere. The rule guards a dependency that does nothing and leaves the one that runs production
outside it. The goal: the runtime dependencies are exactly Astro and the adapter the build uses,
and the constitution says so.

## Proposed amendment to constitution 1

> 1. **Two runtime dependencies.** `astro` and `@astrojs/vercel`, the adapter the build uses,
>    nothing else: no UI framework, no CSS or icon library. *Check:* `package.json`
>    `dependencies`.

Committed alone as `docs:` before the code change, as AGENTS requires.

## Actors

The owner deploying; whoever installs the project.

## Requirements (EARS)

- RF-1: THE SYSTEM declares as runtime dependencies exactly `astro` and the adapter its build
  configuration imports. — **Check:** the dependency guard fails unless `dependencies` equals
  those two and the adapter named in the build configuration is one of them.
- RF-2: THE SYSTEM still builds for its deployment target. — **Check:** `npm run build` green,
  producing the Vercel output directory.

## Non-functional requirements

- No version changes: the same `@astrojs/vercel` range moves from `devDependencies` to
  `dependencies`; `@astrojs/node` is removed.

## Edge cases

- Running the site on plain Node again would need its adapter back: a new decision and a new
  amendment, not this spec.

## Out of scope

- Upgrading Astro or either adapter.

## Done when

`npm test`, `npm run test:e2e` and `npm run build` green; the RF-1 guard shown red by injecting
`@astrojs/node` back into `dependencies`.

## Open questions

None.

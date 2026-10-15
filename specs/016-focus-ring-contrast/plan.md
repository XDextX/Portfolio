# Plan 016 — Focus ring contrast

**Spec:** `specs/016-focus-ring-contrast/spec.md` (**approved**, 7 RF).
**Status:** approved
**Approved:** 2026-10-15 · as written, with two self-review corrections (guard count, D-6 reason) · 161 lines, 7 RF covered
**Approved:** 2026-10-15 · re-approval: D-5 changed by the owner (colour maths moves to tests/helpers/colour.ts, shared with e2e) · 165 lines, 7 RF covered

## 1. Scope and coverage

| RF | Covered by |
|---|---|
| RF-1 every outline in the focus colour | `01-base.css` and `AvatarCircle.astro` read `var(--focus-ring)`; guard *outline colour* (§7) |
| RF-2 focus colour in each theme file, as an alias | `--focus-ring` in `light.css` and `dark.css`; guard *focus token* |
| RF-3 ≥ 3:1 on every ground, each theme | guard *focus contrast*, over the widened resolver |
| RF-4 avatar ring in the focus colour | `AvatarCircle.astro` outline; guard *outline colour* reads it |
| RF-5 light = brand navy | `light.css`: `--focus-ring: var(--color-brand)`; guard *focus contrast* |
| RF-6 dark = text colour | `dark.css`: `--focus-ring: var(--text-color)`; guard *focus contrast* |
| RF-7 a removal is paired | guard *outline removal*; today's one removal (avatar) is already paired |
| NFR avatar ring border keeps its override | `.has-border` untouched; guard *avatar border* |

Every RF is covered. The `AGENTS.md` rule the spec's *Done when* asks for is its own
`docs:` commit, first.

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `AGENTS.md` | modify | States the rule — every outline is drawn in `--focus-ring`, defined per theme — and names the test that settles it. |
| `public/styles/themes/light.css` | modify | Decides the light focus colour: an alias of the brand navy. |
| `public/styles/themes/dark.css` | modify | Decides the dark focus colour: an alias of the text colour, with the 1.00:1 measurement that made the change. |
| `public/styles/01-base.css` | modify | The shared `:focus-visible` rule draws in the focus colour. |
| `src/components/AvatarCircle.astro` | modify | The linked avatar's focus ring draws in the focus colour; its ring border keeps the override. |
| `tests/helpers/colour.ts` | create | Owns the colour maths every guard shares — `luminance`, `contrast`, `toHex`, `resolveColour`, `styleSources`, `cssRules` — imported by vitest and, from spec 007 on, by the e2e suite. |
| `tests/visual-language.test.ts` | modify | Imports the colour maths instead of defining it; gains the five guards and the resolver cases below. |

One new test helper, no new dependency.

## 3. Pure logic

All in `tests/helpers/colour.ts` (D-5); nothing reads a clock.

- `resolveColour(expr: string, ...layers: string[]): string` — **widened, same name**.
  Follows `var()` aliases through any number of hops, each hop looked up in `layers`
  in order (first declaration wins), and falls back to a `var()` fallback only when
  the token resolves nowhere. Returns `#rrggbb`; throws on a dead end or a cycle.
  Today's seven callers pass `(expr, themeSrc, shared)` and keep working unchanged.
- `themeValue` is folded into it; nothing else calls it.
- `cssRules(src: string): { selectors: string[]; body: string; media: string }[]` —
  walks braces, so a rule inside `@media` keeps its context (the existing guards'
  innermost-rule regex loses it, and RF-7 needs it). Selector lists are split.
- `styleSources(): { file: string; css: string }[]` — every `.css` under
  `public/styles` and `src/styles`, and every `<style>` block of every `.astro`
  under `src/`, comments stripped.

## 4. Algorithm

**Resolution layers per theme** (the cascade the browser applies; `global.css` is
not read — RF-2 bans the token there and it redeclares no ground token):

```
light: [light.css, 00-tokens.css]
dark:  [dark.css, light.css, 00-tokens.css]   # light.css :root is dark's base
```

**Guard *outline colour* (RF-1, RF-4).** For each rule in `styleSources()`:

```
decls = outline / outline-color / outline-style / outline-width declarations
if none: skip
if rule is a removal (RF-7 forms) and draws nothing else: skip
colour = outline-color value, else the colour token in the outline shorthand
fail unless colour === 'var(--focus-ring)'      # message names RF-1, file, selector
```

A shorthand with no colour, `currentColor`, `inherit`, `auto`, a literal or a
fallback all fail that comparison.

**Guard *focus token* (RF-2).** `--focus-ring` declared in `light.css` and in
`dark.css`; each value matches `^var\(--[\w-]+\)$`; no other file in
`styleSources()` declares it.

**Guard *focus contrast* (RF-3, RF-5, RF-6).** Per theme, resolve `--focus-ring` and
the five ground tokens (`--bg`, `--main-bg`, `--card-background`, `--neutral-50`,
`--neutral-200`) with that theme's layers; each `contrast() >= 3` (message names
RF-3, theme, ground, ratio). Then light's hex equals the resolved `--color-brand`
(RF-5) and dark's equals the resolved `--text-color` (RF-6).

**Guard *outline removal* (RF-7).** For each rule with a removal: fail if its
selector already contains `:focus-visible`; else, per selector, require a rule in
the same file with the same `media` whose selector is `<selector>:focus-visible`
and which passes *outline colour*.

**Guard *avatar border* (NFR).** The `.avatar.has-border` rule's `border` reads
`var(--avatar-ring, …)`.

**Resolver cases.** Fixtures as strings: a two-hop alias split across two layers
resolves to its hex; an alias ending at an undeclared token throws.

## 5. Interface

| State | Light | Dark |
|---|---|---|
| Focused, on any ground | navy `#243972` ring, unchanged (≥ 8.46:1) | text white `#F5F7FA` ring (≥ 6.66:1), was navy at 1.00 |
| Focused and hovered | navy ring + gold border / opacity | white ring + gold border / opacity |
| Not focused | no ring | no ring |
| Linked avatar, focused | navy ring at 4px offset | white ring at 4px offset |

No data-dependent state: the ring is the same with or without the GitHub fetch.

## 6. Decisions

- **D-1 · Alias in each theme file**, not one token in `00-tokens.css` overridden in
  dark. *Discarded:* the shared default is what let `--accent-surface` ship light
  gold in dark; RF-2 forbids it.
- **D-2 · Dark aliases `--text-color`**, the literal holder, not `--fg`. *Discarded:*
  `--fg` is itself an alias of it — one more hop for the same value.
- **D-3 · Widen `resolveColour` in place, with rest `layers`.** *Discarded:* a second
  resolver for this guard — two copies of the same lookup, the thing AGENTS forbids;
  changing the signature would touch seven callers for nothing.
- **D-4 · A brace walker for rules.** *Discarded:* the innermost-rule regex the other
  guards use, which drops `@media` context RF-7 needs.
- **D-5 · Colour maths in `tests/helpers/colour.ts`; guards in `visual-language.test.ts`.**
  The e2e suite of specs 007–010 needs the same contrast and resolver, and one copy
  must serve both runners. *Discarded:* keeping them in the test file, which makes a
  test import from another test. Changed by the owner 2026-10-15 (was: keep local).
- **D-6 · Keep the avatar's `outline: none`** and recolour its `:focus-visible` rule.
  *Discarded:* deleting the removal — the spec changes the colour only (NFR), and
  whether the browser's default ring would then differ is unmeasured.
- **Not touched:** the accent-surface guard keeps its own one-hop lookup; spec 007
  rewrites that guard and can move it onto the resolver.

## 7. Test strategy

Runner: `npm test` (`vitest --run tests`, from `package.json`). Everything is a data
read of the stylesheets; the reason is the spec's constitution 8 note. Each guard is
written first and shown red against today's code where the code is wrong:

- before the CSS change: *focus token* red (no token), *focus contrast* red (cannot
  resolve), *outline colour* red on `01-base.css` and the avatar;
- *outline removal*, *avatar border* and the resolver cases are green today, so each
  is proven by injection only.

Injections, each restored byte-identical, the commit naming them (constitution 4):

| # | Injection | Expected red |
|---|---|---|
| 1 | literal `#243972` in the shared rule | outline colour |
| 2 | colour dropped from the shared rule | outline colour |
| 3 | `--focus-ring` deleted from `dark.css` | focus token, focus contrast (dark falls to navy), tokens both-themes guard |
| 4 | `--focus-ring` redeclared in `src/styles/global.css` | focus token |
| 5 | light `--focus-ring: #243972` | focus token |
| 6 | dark aliased to `--color-brand` | focus contrast (1.00; RF-6 too) |
| 7 | avatar outline back to `var(--avatar-ring, …)` | outline colour, naming the avatar |
| 8 | light aliased to `--accent-text` | focus contrast, RF-5 only |
| 9 | dark aliased to `--brand-accent` | focus contrast, RF-6 only |
| 10 | `outline: none` on a button with no focus rule | outline removal |
| 11 | avatar `:focus-visible` moved into a `@media` block | outline removal |
| 12 | `outline: none` inside the shared `:focus-visible` | outline removal |
| 13 | `.has-border` pointed at `var(--focus-ring)` | avatar border |
| 14 | resolver capped at one hop | resolver case, focus contrast (light chain is three hops) |
| 15 | resolver returns the last token instead of throwing | resolver dead-end case |

Then `npm run build`, and in the dev server, both themes: tab to the language
selector, the theme toggle and the CV button on `/`, and the home button on the
404.

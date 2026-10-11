# Spec 003 — Value proposition section

**Status:** implementada
**Aprobada:** 2026-10-10 · la aclaración cerrada: las palabras las escribió el dueño —la proposición y los tres proof points, en `es` y en `en`—, después de que se le preguntara por ellas en vez de inventarlas · tres correcciones sobre el texto anterior: el check de RF-1 pasa a Playwright, porque `npm test` es `vitest --run tests` y no renderiza ninguna ruta con `output: "server"`; RF-2 baja su promesa a lo que su guard comprueba, porque que un lector pueda verificar un punto es criterio del autor; y el NFR del LCP se reescribe alrededor de `p.about-bio`, que es el elemento LCP medido (88/152/84 ms a 390×844, 958×888 y 1440×900), no del avatar · se añade *Approved wording* y se corrige `Out of scope`: la 004 ya hizo el SEO por página, y los once repositorios con un solo `README` se quedan listados por decisión del dueño · cambio 2026-10-11 del dueño: la sección pasa a segunda tras el hero (RF-1 reescrito a `ids[1]`) y el wording se reemplaza — el `es` nuevo es del dueño, el `en` es traducción del planificador ("tradúcela tú") — · 224 líneas, 6 RF

## Context and goal

The home page opens with an avatar, a name, "Full-Stack Developer", and a paragraph.
**Nothing on the page says what problem is solved.** A visitor arriving from a link has
roughly eight seconds before deciding whether to keep reading, and right now that
decision has nothing to work with.

Adding one section below the hero — a statement of what the work is for, plus three points
that back it up — gives that decision something to stand on. It is the smallest change
on this list with the largest effect on whether a visitor stays.

It goes below the hero, not inside it, as the second section of the home page. That is
the owner's decision of 2026-10-11, which reverses the original placement above the
hero: the avatar, the name and the role stay the first thing on the page, and
everything below the hero moves down one section.

### What the page can and cannot back up

Measured on 2026-10-10, from the GitHub API and from the served page:

| Measured | Value |
|---|---|
| Public repositories | 16 |
| Stars, across all of them | 0 |
| Forks, across all of them | 0 |
| Repositories whose root contains code | 5 |
| Repositories containing only a `README.md` | 11 |

The card hides a zero star count, so the page shows no traction number at all.
Eleven of the sixteen projects listed are placeholders and work in progress, and
they stay listed.

A proof point that leans on traction, or on the code being there to inspect, is
falsified by the page itself: a reader who follows it finds a README. The wording
below leans on what the page can support — the CV, the stack, and the five
repositories that have code.

## Definitions

- **Value proposition**: one sentence naming who the work is for and what it produces.
  Not a job title, not a tagline, not "Full-Stack Developer".
- **Proof points**: the three items under it. Each claims something specific about the
  work; a reader must be able to ask "how do I know?". **That a reader can answer it
  is the author's judgement, and no guard settles it** — the guard below settles that
  the three exist, differ, and live in the data.

## Approved wording

The owner's Spanish words, written 2026-10-11 and asked for rather than drafted. The
English version below is the planner's translation — the owner answered "tradúcela tú" —
so it is recorded as a planner decision, not as the owner's words. Both land in
the data at implementation; this section is the record of what was approved, and it
stops being read the moment the spec is `implementada`.

**Proposition**

> Desarrollo soluciones web completas, desde la arquitectura hasta su puesta en producción.
> *I develop complete web solutions, from architecture to production deployment.*

**Proof points**

1. > Código mantenible: priorizo las buenas prácticas, las pruebas y la documentación de las decisiones técnicas.
   > *Maintainable code: I prioritize good practices, testing, and documenting technical decisions.*
2. > Experiencia comprobable: más de seis años desarrollando soluciones de software para necesidades reales.
   > *Proven experience: over six years developing software solutions for real needs.*
3. > Desarrollo de principio a fin: trabajo con backend, frontend, bases de datos y despliegue para entregar funcionalidades completas.
   > *End-to-end development: I work with backend, frontend, databases, and deployment to deliver complete features.*

**Replaced wording.** The 2026-10-10 wording below was replaced on 2026-10-11 at the
owner's request ("a petición del dueño"; no motive was given). It stays recorded here
so the change is visible:

> Antes: "Construyo productos web completos para equipos que los necesitan en producción."
> / *"I build complete web products for teams that need them in production."* — plus the
> three 2026-10-10 proof points about tests with decisions written beside the code, six
> years of shipping software backed by the CV, and backend, frontend and deployment
> coming from one person.

Four decisions behind them, recorded so the obvious one is not re-proposed:

- **Nothing about traction, nothing about the code being inspectable.** Measured
  above: there is no star or fork anywhere, and eleven of sixteen repositories are a
  README. A first draft said "the code, not the promise"; the page falsified it on
  click.
- **No single repository is held up.** Asked which one a recruiter should open, the
  answer was "none in particular" — the point is the habit, not the artifact.
- **Server-Sent Events is out.** The bio named it as something being learned, and both
  SSE repositories are a README. Nothing on the site can support the claim.
- **Nothing geographic.** The owner asked not to be tied to a country or a market, so
  neither the old nor the new proposition names a region.

## Actors

Two. The visitor arriving from a shared link, who decides in seconds whether to keep
reading. And whoever shares the link, who is choosing between candidates.

## User stories

- US-1: As a visitor who just arrived, I want to know what this person does within
  seconds so that I can decide whether to keep reading.
- US-2: As someone sharing a link, I want the page to state its value immediately so
  that the click is worth making.

## Requirements (EARS)

- **RF-1: THE SYSTEM shows the value proposition as the second section of the home
  page, after the hero (About) and before Habilities.** — **Check:** a Playwright check in `e2e/` loads `/` and asserts this section
  is the second `<section>` in the served document (`ids[1]`). A data check cannot settle order,
  and this is the assertion on rendered output that constitution 8 asks for — but
  `npm test` renders no route, so the check cannot live there. Playwright is not in
  the pre-commit hook, so this guard runs by hand, and *Done when* says so.
- **RF-2: THE SYSTEM shows three proof points, each stating a specific claim.**
  — **Check:** `about.test.ts` asserts exactly three entries in the data, each with
  non-empty text in **both** locales.
- **RF-3: THE SYSTEM shows no proof point that shares text with another.**
  — **Check:** `about.test.ts` asserts the three texts are distinct. Duplicated
  filler is the failure this catches, and a length threshold cannot see it.
- **RF-4: THE SYSTEM keeps the value proposition and proof points in
  `src/data/about.ts`, in both locales.** — **Check:** `about.test.ts` asserts the
  fields exist under `ABOUT` and that no component file contains either text.
- **RF-5: THE SYSTEM adds no runtime dependency and makes no request to render this
  section.** — **Check:** `package.json` grows by nothing (constitution 7), the source
  names no new host — constitution 2's check — and the same Playwright check as RF-1
  asserts the served document requests no host the home does not already request.
- **RF-6: THE SYSTEM renders the section in the visitor's locale.** — **Check:**
  `i18n.test.ts` asserts every new key resolves in `es.json` and `en.json`.

## Non-functional requirements

- The section adds no client-side JavaScript. It is static content.
- **The LCP is measured before and after, and both numbers are recorded in the commit
  that lands the section.** Measured on 2026-10-10, the home's LCP element is
  `p.about-bio` at 390×844 (88 ms), 958×888 (152 ms) and 1440×900 (84 ms) — not the
  avatar. The earlier version of this requirement promised the hero image would not be
  displaced, which protected the wrong element: an earlier draft assumed the avatar was
  the LCP and was wrong. Placing the section after the hero leaves the paragraph that is
   the LCP where it stands; the after measurement confirms it was not displaced.
- Interface chrome (headings, aria labels) goes through `t()`, so a locale switch needs
  no second mechanism.
- The proposition is capped by the same measure that protects body prose: the three
  points and the sentence are prose, and uncapped they run to a 98–101 character line
  from 1280px up.

## Edge cases

- **A proof point the page contradicts.** Eleven of the sixteen listed projects are a
  README, and no repository has a star or a fork. Wording that leans on either is
  falsified by a click. If a future revision adds such a claim, those placeholders have
  to stop being listed first.
- **A locale missing the text.** If either `es` or `en` lacks the proposition, the
  section would render half-empty and read as a bug. `RF-2` and `RF-6` both fail on
  that, which is the intent.
- **Very long proposition text on a narrow viewport.** The measured-width cap that
  protects body prose must also apply here, or the sentence wraps to a tall column on
  a phone. This is a rendering concern to verify visually, not a data check.
- **The identity pushed off the first screen.** Placing the section after the hero
  keeps the avatar, the name and the role first; everything below the hero moves down
  one section. On a phone that is where it gets tight — which
  is why the LCP is measured rather than promised.
- **`h2` heading level.** The section must not break the document outline that the
  other four sections already establish.

## Out of scope

- **Hiding the eleven placeholder repositories from `/proyectos`.** Found while writing
  this spec, and it constrains the wording above: ten of the sixteen projects listed on
  the site contain only a README. The owner decided they stay, as placeholders and work
  in progress, so nothing here claims otherwise.
- **Rewriting the bio's last sentence.** Found while writing this spec: the bio ends by
  naming Server-Sent Events, Jasmine and Selenium, and SSE is out of the wording above.
  The bio is content, not a requirement of this section; it is edited on its own.
- **Adjusting the home's metadata.** Spec 004 wrote it and recorded that it is adjusted
  when spec 003 lands. That adjustment is its own change, after this one.
- **Filling `EXPERIENCES`.** Two entries for someone with 6+ years reads as an
  incomplete CV. That is content, not a feature, and it belongs to whoever owns the
  data — not to a spec that would ship it untested.
- **A blog.** The most obvious thing to add and the most expensive: content, routes,
  duplicated i18n, and a portfolio with two posts reads worse than one with none.
- **Per-page SEO.** Out of scope and already done: spec 004 gave every route its own
  title and description.
- **Hardening `ProjectsSection` against a GitHub outage.** The home currently loses
  its projects section if the API is down. Worth a spec of its own.

## Done when

- `npm test` and `npm run build` green.
- `npx playwright test` green. Run by hand: it is not in the pre-commit hook, which is
  what makes RF-1 and RF-5 possible at all.
- Every new guard proven by injection: remove the section and watch RF-1 go red; drop
  the Spanish text and watch RF-2 and RF-6 go red; copy one proof point over the other
  and watch RF-3 go red.
- The section is looked at in both locales and on a narrow viewport. `dist/` holds no
  HTML, so a green build does not prove any of the rendering claims.
- The LCP is measured before and after and both numbers are in the commit message.

## Open questions

None open. The one clarification was answered on 2026-10-10: **the Spanish words are
the owner's**, written after being asked four questions — who reads the page and what they
decide, what the work produces, what the page can be checked on, and what it must not
say. A second clarification was answered on 2026-10-11: the owner replaced that wording
with new Spanish text and answered "tradúcela tú", so **the English version of the new
wording is the planner's translation**, recorded as such above. The answers decided the wording above, including the two that cost the most:
nothing about traction, and Server-Sent Events out.

Two decisions came out of measuring instead of assuming, and both are recorded above:
the section went before the hero at first, and the LCP requirement was rewritten around the
bio paragraph because the avatar was never the LCP element.

A third decision, on 2026-10-11, is the owner's and was not measured: the section moves
to after the hero (second section, between About and Habilities), so RF-1 is rewritten
around `ids[1]`. The `h2`-before-`h1` outline cost decays — the hero's `h1` is first
again — the added hairline moves with the section and now falls between About and the
value proposition, and About, now first again, loses the top border it had gained.

A fourth decision, also on 2026-10-11 and at the owner's request ("a petición del
dueño"; no motive was given): the 2026-10-10 wording is replaced by the wording above.
The Spanish text is the owner's; the English text is the planner's translation, per the
owner's "tradúcela tú", and is recorded as such, not as the owner's words.

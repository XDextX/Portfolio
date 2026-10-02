# AGENTS.md

Astro 5 personal portfolio (SSR). Single package, no monorepo. Content is data-driven from
`src/data/*.ts`; projects are pulled live from the GitHub API.

## Commands — verified working vs. broken

| Command | Status |
|---|---|
| `npm run build` | works (~4s) |
| `npm test` | works |
| `npx playwright test` | works (1 test, ~7s, spawns its own dev server on :4321) |
| `npm run lint` | **broken** — `eslint` is not a dependency and there is no config |
| `npm run format` | **broken** — `prettier` is not a dependency and there is no config |
| `npx astro check` | **unavailable** — prompts to install `@astrojs/check` + `typescript` |

`npm run lint` / `npm run format` are aspirational. Don't report their failure as a regression you caused,
and don't add a formatting pass "to match" — there is no formatter config to match.

### Running tests

```bash
npm test                          # = vitest --run tests   (the positional `tests` arg scopes it)
npx vitest --run tests/foo.test.ts # one file
npx vitest --run -t "name"         # one test by name
```

Do **not** run bare `npx vitest --run`. Without the `tests` filter it also picks up `e2e/about.spec.ts`
and fails on a missing Playwright runtime. This is the single most likely way to get a confusing red result.

Tests assert on **data and rendered invariants, not on source substrings**. The old
`aboutsection.test.ts` asserted the literal `mailto:` appeared in `AboutSection.astro`; commit `7843605`
had already moved socials into `src/data/about.ts`, so the assertion broke while the page rendered fine.
Do not reintroduce grep-the-source tests — they rot on any refactor. Likewise `CONTACTS.length` is
asserted as ">= 1 with unique ids", not a fixed count, so adding a contact channel is not a breaking change.

## Environment variables

Read via `import.meta.env` only — never `process.env`. In `.env`:

- `GITHUB_USERNAME` — defaults to `XDextX` in code
- `GITHUB_TOKEN` — optional, avoids rate limits. Server-side only; never let it reach a client bundle.
- `GITHUB_TOPIC` — currently set to `""`. When empty, `ghListByTopic` falls back to `user:XDextX`
  (all public repos) and the topic filter on `/proyectos` becomes a no-op.
- `DEFAULT_LOCALE` — **dead config.** Nothing reads it. The default locale is the hardcoded
  `const DEFAULT_LOCALE: Locale = 'es'` in `src/utils/locale.ts`.

`.env` is gitignored and currently holds a live GitHub PAT in plaintext. Never commit it, never echo it.

## Verifica en vivo, no solo con build y tests

Build verde y tests en verde **no** detectan bugs de render. Levanta un dev server y pega las páginas:

```powershell
$job = Start-Job { npx astro dev --port 439X }; Start-Sleep 13
Invoke-WebRequest "http://localhost:439X/ruta" -UseBasicParsing | Select-Object StatusCode
Stop-Job $job; Remove-Job $job -Force
```

Así se hallaron dos bugs reales que el build no marcó: JSON-LD roto y la ruta duplicada `/Resume`.

## Reglas de estructura

- **Nunca dejes un componente de página en `src/pages/`.** Astro lo registra como ruta aunque solo
  se use como componente. `Resume.astro` vivía ahí y generaba `/Resume`, duplicando `/` con canonical
  y hreflang conflictivos. La home section vive en `src/components/Resume.astro`.
- **Una sola fuente por dato.** `ABOUT.socials` se deriva de `CONTACTS` por id; no dupliques email/
  GitHub/LinkedIn en dos archivos.
- **URLs públicas con barra inicial.** `resumeUrl` es `/cv/...`, no `cv/...` — la relativa resolvía
  mal desde `/proyectos`.
- **JSON-LD con `set:html`, nunca `is:inline` + interpolación.** `is:inline` desactiva la evaluación
  de expresiones, así que `{JSON.stringify(x)}` se emitía como texto literal. Ambos patrones están
  arreglados en `AboutSection.astro` y `BaseLayout.astro`; no reintroduzcas el anterior.

## Client scripts bajo `<ClientRouter />`

`<ClientRouter />` (view transitions) está **activado a propósito y se mantiene**. Reglas obligatorias:

- Todo script de cliente se ata con `document.addEventListener('astro:page-load', ...)`, nunca con
  `DOMContentLoaded` ni un `addEventListener` suelto a nivel de módulo. El router reemplaza el DOM en
  cada navegación, así que un listener ligado una sola vez muere en la primera transición.
- **Prohibido `<script is:inline>` para lógica de cliente.** Solo se ejecuta con el HTML del servidor.
  Ojo: `is:inline` + `{JSON.stringify(x)}` tampoco evalúa la expresión, emite el literal. Para JSON-LD
  usa `set:html={JSON.stringify(x)}`.
- **Prohibido `document.currentScript`** para capturar contenedores. Tras un swap apunta al nodo viejo.
- **Nada de IDs globales para hooks de JS.** Usa `data-*` y resuelve relativo al contenedor
  (`root.querySelector`). Así varias instancias en la misma página funcionan de forma independiente.
- `transition:name` debe coincidir entre origen y destino (p. ej. `p-${repo.id}-title` en
  `ProjectCard.astro` y en `proyectos/[name].astro`) — es lo que hace que la card " viaje".

`tests/viewtransitions.test.ts` cubre estas reglas. Si necesitas saltar alguna, hazlo explícito y
actualiza ese test.

## MCP: chrome-devtools

`opencode.json` corre `npx chrome-devtools-mcp@latest` sin flags: el MCP busca un Chromium por su
cuenta (Chrome o su bundled) y arranca sin configuracion extra.

- **No anadas `mcpServers`** dentro de `mcp` (ese es el formato de VS Code/Claude Desktop y aqui no
  funciona). La clave `mcp` es un mapa directo de servidores, y cada uno exige `type` y `command`
  como **array**.
- **No hardcodees rutas de navegador.** OpenCode no expande `{env:VAR}` dentro de `mcp.*.command`
  (el placeholder se descarta sin expandirse), y una ruta absoluta rompe en otra maquina. Si necesitas
  otro navegador, instala Chrome en vez de pelear con el path.
- En Windows, un path con espacios (ej. `Opera GX`) se trunca si pasas por `cmd.exe`: por eso no se
  pasan rutas como argumento.

## Nunca documentes datos sensibles

No escribas en `AGENTS.md`, `Memory.md`, `README.md`, mensajes de commit ni ningún
documento del repo: rutas con el nombre de usuario real (`C:\Users\<tu-usuario>\...`), emails,
nombres completos, direcciones físicas, tokens, API keys o contraseñas.

- Usa placeholders: `C:\Users\<usuario>\...`, `<email>`, `<token>`.
- En ejemplos de rutas, prefiere variables (`$env:USERPROFILE`) en vez de la ruta literal.
- Sí es válido **señalar la existencia** de un secreto y el riesgo (`hay un PAT en .env,
  no lo commitees`), pero nunca su valor.
- Al documentar un bug, describes la forma (`--executablePath=C:\...\Programs\Opera`) sin
  rellenar el resto con datos de tu máquina.

Esto aplica también a `.env`, que está gitignored pero sigue siendo un archivo en disco.

## Commits: husky, y reglas de git que no se negocian

Hay un hook de pre-commit: `.husky/pre-commit` corre `npm test` y **cancela el commit** si algo falla.
Se activa por `"prepare": "husky"` en `package.json`, que se ejecuta en cada `npm install`.

- Si un commit se rechaza, no es un bug de git: la suite falló. Arregla el test primero.
- Escape solo si es intencional: `git commit --no-verify`.
- El hook **no** llama a `npm run lint` ni a `npm run format` porque ambas están rotas (ver tabla arriba).
  Cuando las arregles, añádelas en `.husky/pre-commit`.
- **NUNCA hagas `git push`.** Ni siquiera si te lo pide la tarea o si los tests pasan. El usuario
  lo pide explícitamente si algún día lo quiere. No ofrezcas pushear por iniciativa propia.
- **NUNCA crees commits sin que te lo pidan.** Solo commitea si el usuario lo pide explícitamente o si
  el commit es parte de un flujo que ya acordaste (p. ej. "prepara los commits", "commitea esto").
  Terminar una tarea **no** implica commitear: deja los cambios en el working tree.
- Si hay duda sobre si toca commitear, **pregunta** en vez de decidir por tu cuenta.
- Estado normal: cambios sin commitear en el working tree, commits sin pushear.

## Memory
- `Memory.md` es tu memoria. Mantenla chica y organizada (50 líneas máx); resume y borra lo que ya no
  sea relevante.
- **Reparto:** las *reglas* viven solo aquí en `AGENTS.md`. `Memory.md` es únicamente estado
  y contexto (qué se hizo, qué falta, qué está verificado). No dupliques reglas en los dos:
  si una regla cambia, cámbiala aquí y déjala en un solo sitio.
- Si algo se guarda de forma frecuente, propón una nueva regla y créala en `AGENTS.md`.
- Luego de cada tarea modifica `Memory.md` y `AGENTS.md`.

# Plan 015 — Contact form, sent from the server

**Spec:** `specs/015-contact-form/spec.md` (**approved**, 24 RF).
**Status:** approved
**Approved:** 2026-10-15 · owner approval · 287 lines
**Changed:** 2026-10-16 · ordering, helper names and line numbers aligned with what 016–018 landed; constitution 7 in force, only 6 pending; the stripper moves from 018's local scan; channel already set; Mailtrap needed only for T-10 · 289 lines · re-approved by the owner 2026-10-16
**Changed:** 2026-10-16 · at implementation: `astro.config.mjs` touched after all (the watcher ignores `.astro/`, owner choice: dev servers reloaded each other's pages); the seam compares `CONTACT_E2E` as text (Astro coerces it to a number) and imports the stub behind a literal `DEV` so the build drops it; the honeypot is also `visibility: hidden` and the submit transitions only what changes (spec 009 RF-6)

**Ordering.** Specs 016, 007, 008, 017, 009, 010–014 and 018 have landed: 016/009 leave `contrast`
in `tests/helpers/colour.ts`; 007 creates `e2e/helpers/dev-server.ts`, the theme setup, the
unscoped `.btn--primary` and `channel: 'chrome'` in `playwright.config.ts`; 008 creates
`e2e/helpers/rendered.ts` (`openIn`, `installHelpers` with in-page `__groundOf`, `settled`) and the
section title; 017 lands `--control-border`; 018 rewrites the cards of this section (three linked
cards, no location card) and leaves an HTML-aware comment stripper local to `tests/about.test.ts`'s
location scan, not at module scope; 014 moves vitest to ^3.2.7 with `vitest.config.ts`; 010's
`about.social.email` exists. Constitution 7 is in force; before code, one `docs:` commit extends
constitution 6 to "every secret has one reader".
Owner prerequisite, needed only for T-10's manual send and for production: the Mailtrap token
and the sender address as server-side configuration. Named, never valued: `MAILTRAP_API_TOKEN`, `CONTACT_FROM_EMAIL`,
optional `MAILTRAP_ENDPOINT`. Line numbers re-read 2026-10-16, after 018.

**Verified for the plan** (the spec's "For the plan"):

- *Client address.* `@astrojs/vercel` 8.2.8 passes `req.headers["x-forwarded-for"]` as
  `clientAddress` (`node_modules/@astrojs/vercel/dist/serverless/entrypoint.js:18`); Vercel's
  request-headers page says it overwrites that header and forwards no external IP (D-2).
- *Duration.* The adapter's `maxDuration` (`dist/index.d.ts:34`) is unset; the platform default is
  10 s on the legacy model, longer under fluid compute. 8 s fits both.
- *Sandbox.* Two Mailtrap products: sending is `POST https://send.api.mailtrap.io/api/send`
  (Bearer, 200 `{ success, message_ids }`); the sandbox is `POST
  https://sandbox.api.mailtrap.io/api/send/{sandbox_id}` with its own token. The manual send sets
  `MAILTRAP_ENDPOINT` and the sandbox token locally (D-6). The docs ask for a real `User-Agent`;
  Node's `fetch` sends `node`, so the sender sets its own.
- *Host scan.* None reads `src/`; constitution 2 is `e2e/about.spec.ts`'s browser request hosts,
  where a server `fetch` never appears. `checkOrigin` defaults on (`astro/dist/core/config/schemas/
  base.js:48`); `<ClientRouter />` skips a prevented submit (`astro/components/ClientRouter.astro:117`).

## 1. Scope and coverage

| Requirement | Covered by |
|---|---|
| RF-1 labelled fields and submit via `t()` | `ContactForm.astro`; e2e *names* |
| RF-2 privacy line | `contact.form.privacy`; e2e *privacy* |
| RF-3 `required`/`maxlength` = server | both read `FIELD_LIMITS`; e2e *limits* |
| RF-4 one message, recipient, reply-to | `handleContact` with `deps.recipient`; data *recipient* |
| RF-5 invalid names fields, no send | `validateFields`; data *rules* (rule × field) |
| RF-6 not a form POST, over 32 KB | `gateRequest` + `readCapped`; data *gate* |
| RF-7 honeypot → *sent*, no send | step 4 of §4; data *honeypot* |
| RF-8 3 per address per 10 min | `createRateLimiter`, supplied `now`; data *limit* |
| RF-9 configuration missing | `createMailtrapSender` returns `null`; data *config* |
| RF-10 throw, 8 s, non-2xx → *failed* | `sendWithTimeout`, supplied `schedule`; data *failure* |
| RF-11 / RF-12 nothing secret logged | fixed log kinds; data *silence* |
| RF-13 one reader, not in client assets | `mailtrap.ts`; data *one reader*; e2e *client assets* |
| RF-14 plain text, values verbatim | `ContactMessage.text` only; data *plain text*, *payload* |
| RF-15 – RF-17 scripts off | `index.astro` handles POST into `Astro.locals.contact`; e2e *plain* |
| RF-18 – RF-24 enhanced | client script; e2e *enhanced* |
| NFR no dependency, no subresource, no network in tests | `fetch` only; §4 seam; *client assets* |
| NFR visual, 4.5:1; honeypot; bounded memory | 007/016/017; e2e *contrast*, *360*, *trap*; data *limit* |

Every RF is covered. No guard retires.

## 2. Files

| File | Change | Responsibility |
|---|---|---|
| `src/pages/lib/contact.ts` | create | Decides a request's outcome; pure (no env, clock or network). Owns `FIELD_LIMITS`, `BODY_CAP`, `RATE`, `SEND_TIMEOUT_MS`. |
| `src/pages/lib/mailtrap.ts` | create | The one reader of the three Mailtrap variables; builds the real sender over `fetch`. Beside `github.ts` (4), the single-reader pattern. |
| `src/pages/lib/contact-runtime.ts` | create | Wires per-request deps: limiter singleton, `Date.now()`, `setTimeout`, recipient from `CONTACTS`, client key, sender choice. The only reader of the clock. |
| `e2e/helpers/stub-sender.ts` | create | The e2e stand-in: answers 200, throws on `STUB_FAIL_SUBJECT`. Loaded only through the seam. |
| `src/pages/api/contact.ts` | create | `ALL` route for the enhanced submit: JSON `{ outcome, fields }`. |
| `src/pages/index.astro` | modify | On POST, runs the handler before render into `Astro.locals.contact`, sets the status. |
| `src/env.d.ts` | create | Types `App.Locals.contact`. |
| `src/components/ContactForm.astro` | create | Decides what the form shows for a state: values, errors, status; owns the enhanced script. |
| `src/components/ContactSection.astro` | modify | Renders `<ContactForm />` after the card list (28-36). |
| `i18n/locales/es.json`, `en.json` | modify | `contact.form.{name,subject,message,submit,privacy,trap}`, `.errors.{name,email,subject,message}`, `.outcome.{sent,invalid,limited,failed}`; Email reuses `about.social.email`. |
| `tests/helpers/source.ts` | create | An HTML-aware `stripComments` (block, line and `<!-- -->`), moved from `about.test.ts`'s location scan; two importers now. `colour.ts`'s CSS-only stripper stays. |
| `tests/helpers/contact-mocks.ts` | create | `recordingSender`, `failingSender`, `fakeSchedule`, `captureConsole`. |
| `tests/about.test.ts` | modify | Its location scan imports `stripComments`; no behaviour change. |
| `tests/contact-form.test.ts` | create | Data cases RF-4 – RF-14, the seam, the secret scan. |
| `e2e/contact-form.spec.ts` | create | Rendered checks RF-1 – 3, 13, 15 – 24 and the visual NFRs. |
| `playwright.config.ts` | modify | `webServer` (§4); `channel: 'chrome'` is already on the project (007). |

Untouched: `package.json`, `astro.config.mjs`, `.husky/pre-commit` — `fetch` is a Node global.

## 3. Pure logic

Nothing below reads a clock, the env or the network. In `src/pages/lib/contact.ts`:

- `FIELD_LIMITS = { name: 100, email: 254, subject: 150, message: 5000 }`; `BODY_CAP = 32 * 1024`;
  `RATE = { max: 3, windowMs: 600_000 }`; `SEND_TIMEOUT_MS = 8000`; `type Field`, `type Outcome`.
- `fieldLength(v: string): number` — trimmed, CRLF folded to LF, UTF-16 units: the browser counts
  a textarea line break as one, the POST carries two.
- `validateFields(p: URLSearchParams): { values: Record<Field, string>; errors: Field[] }`.
- `gateRequest(method: string, headers: Headers): boolean`.
- `readCapped(body: ReadableStream<Uint8Array> | null, cap: number): Promise<string | null>`.
- `createRateLimiter(rate)` → `{ allows(key, now): boolean; record(key, now): void; size(): number }`.
- `sendWithTimeout(sender, m, ms, schedule): Promise<'ok' | 'threw' | 'timeout' | 'status'>`, with
  `schedule: (fn: () => void, ms: number) => () => void` (returns a cancel).
- `handleContact(req: Request, deps: ContactDeps): Promise<ContactResult>`; `ContactDeps = { sender:
  Sender | null; limiter; now: number; clientKey: string; recipient: string; schedule; log(kind) }`;
  `ContactResult = { outcome: Outcome; fields: Field[]; values?: Record<Field, string> }`.
- `ContactMessage = { to; replyTo; fromName; subject; text }` (strings);
  `Sender = (m: ContactMessage, signal: AbortSignal) => Promise<{ status: number }>`.

`mailtrap.ts`: `mailtrapConfig()` (the env read), `createMailtrapSender(config, fetchImpl):
Sender | null` (`null` unless token and sender address), `toMailtrapPayload(m, from)`.
`contact-runtime.ts`: `selectSender(flags, real, loadStub)`, `selectClientKey(flags, header,
clientAddress)`, pure over `flags: { dev: boolean; e2e: boolean }`.

## 4. Algorithm

**`handleContact`** (each early return leaves the sender untouched):
```
1 !gateRequest: method POST, base type x-www-form-urlencoded, Content-Length absent or <= cap
                                                          → { invalid, fields: [] }
2 text = await readCapped(req.body, BODY_CAP); null       → { invalid, fields: [] }
3 params = new URLSearchParams(text)
4 params.get('website')?.trim()                           → { sent }   (counts nothing)
5 { values, errors } = validateFields(params); errors     → { invalid, fields: errors, values }
6 !limiter.allows(clientKey, now)                         → { limited, values }
7 !sender                                                 → log('config'); { failed, values }
8 limiter.record(clientKey, now)                          (accepted = handed to the sender)
9 r = await sendWithTimeout(sender, message(values), SEND_TIMEOUT_MS, schedule)
  'ok' → { sent }; else log(r); { failed, values }
```

`message`: `to = recipient`, `replyTo = email`, `fromName = name`, `subject` verbatim, `text =
"<name> <email>\n\n<message>"`. A whole-body `try/catch` maps anything else to `failed` with
`log('internal')`: never a 500. `log` takes only `config|threw|timeout|status|internal`, never an
error, message or value (RF-11, RF-12).

**`validateFields`**, per field: `getAll(f)` of length 1; trimmed (`trim()` covers Unicode
whitespace) non-empty; `fieldLength <= limit`; name and subject reject CR, LF, NEL, U+2028 and
U+2029; email matches `^[^\s@]+@[^\s@]+\.[^\s@]+$`. Each failing field is named once. Multipart
stops at step 1, so every value is text.

**`readCapped`** sums chunk `byteLength`; past `cap` → `reader.cancel()`, `null`; else decodes.
**`sendWithTimeout`**: `AbortController`; `cancel = schedule(() => { timedOut = true;
ctrl.abort() }, ms)`; 2xx → `'ok'`, other status → `'status'`, throw → `timedOut ? 'timeout' :
'threw'`; `finally cancel()`. **Limiter**: `Map<key, number[]>`; each call first drops stamps
`<= now - windowMs` and empty keys; `allows` = remaining `< max`.

**Real sender**: `fetchImpl(endpoint, { method: 'POST', signal, headers: { Authorization: 'Bearer
' + token, 'Content-Type': 'application/json', 'User-Agent': 'portfolio-contact' }, body })` →
`{ status }`. Payload `{ from: { email: from, name: fromName }, to: [{ email: to }], reply_to:
{ email: replyTo }, subject, text, category: 'contact-form' }`, no `html`. `endpoint` defaults to
the sending URL.

**The e2e seam** (`contact-runtime.ts`):
```
flags  = { dev: import.meta.env.DEV, e2e: import.meta.env.CONTACT_E2E === '1' }
sender = flags.dev && flags.e2e ? (await import('../../../e2e/helpers/stub-sender')).stub
                                : createMailtrapSender(mailtrapConfig(), fetch)
key    = flags.dev && flags.e2e && header('x-e2e-client') ? that header : context.clientAddress
```

`import.meta.env.DEV` is a build-time constant, `false` in every `astro build`, and production is
a build: neither the stub nor the key override is selectable there, whatever the env holds. The
header gives each e2e test its own limiter key on one server process. `playwright.config.ts`:

```
webServer: { command: 'npm run dev -- --port 4329', url: 'http://localhost:4329',
  reuseExistingServer: false, timeout: 120_000,
  env: { CONTACT_E2E: '1', MAILTRAP_API_TOKEN: 'e2e-fake-token', CONTACT_FROM_EMAIL: 'form@example.test' } }
```

4329 never collides with a dev server on 4321, and a busy 4329 fails the run instead of reusing a
server of unknown configuration. Process env outranks `.env` in Vite's loading, and the stub never
builds the real sender. Existing specs keep their 4321 helper; this spec uses `baseURL` 4329.

**`index.astro`**: on POST, `Astro.locals.contact = await handleContact(Astro.request, await
contactDeps(Astro))`, `Astro.response.status = STATUS[outcome]`, `STATUS = { sent: 200, invalid:
400, limited: 429, failed: 503 }`, shared with the API route. **Markup**:

```
<form method="post" action="#Contact" data-contact-form>        (native validation stays on)
  per field: <label>{label}<input name=f required maxlength={FIELD_LIMITS[f]} value={values?.[f]}
    aria-invalid={bad || undefined} aria-describedby={bad ? 'contact-err-' + f : undefined}></label>
    <p id={'contact-err-' + f} data-error-for={f} hidden={!bad}>{t(errors.f)}</p>   (message: textarea)
  <div class=contact-form__trap aria-hidden=true><label>{t(trap)}<input name=website tabindex=-1 autocomplete=off></label></div>
  <button class="btn btn--primary">{t(submit)}</button> <p>{t(privacy)}</p>
  <p role=status aria-live=polite data-contact-status data-sent=… data-invalid=… data-limited=… data-failed=…>
    {state && t(outcome[state.outcome])}</p>
```

`action="#Contact"` posts to the current URL (keeping `?lang=`) and lands on the section; no value
reaches the URL (RF-17). **Script** (`astro:page-load`, per `form[data-contact-form]`):

```
submit(ev): ev.preventDefault(); if pending return; pending = true; aria-busy on
  res = await fetch('/api/contact', { method: 'POST', body: new URLSearchParams(new FormData(form)) })
  if !form.isConnected return                    (navigated away: discard)
  { outcome, fields } = await res.json()         (a parse failure reads as 'failed')
  per field: error hidden = !fields.includes(f); aria-invalid, aria-describedby follow
  outcome === 'sent' && form.reset()
  status.textContent = ''; next frame: status.textContent = status.dataset[outcome]
  outcome === 'invalid' && first invalid field.focus()
  finally pending = false; aria-busy off
```

## 5. Interface

| State | Light and dark |
|---|---|
| Rest (GET) | one column capped at `--measure`; 017's border, 016's ring, 007's button; privacy line in `--neutral-600`; status empty |
| Pending | unchanged; `aria-busy`, further submits ignored |
| *sent* | sent string; enhanced clears the fields, plain returns an empty form |
| *invalid* | `aria-invalid` fields with a 2px `--fg` border, error text under each at weight 600; values kept; focus on the first (enhanced) |
| *limited* / *failed* | the status string; values kept |
| 360px | fields full width, textarea resizes vertically only, no page scroll |

Errors in `--danger-color` (D-8). Sizes are measured at the walk, not estimated here.

## 6. Decisions

- **D-1 · Plain POST to the page, enhanced POST to `/api/contact`, one handler.** *Discarded:*
  Astro Actions — form results ride a cookie and a redirect, too small for 5000 characters; a
  redirect-after-POST, which loses the text.
- **D-2 · `context.clientAddress`** (verified above). *Discarded:* parsing the header by hand.
- **D-3 · Seam keyed on `DEV` and `CONTACT_E2E`.** *Discarded:* the flag alone — a stray production
  variable would drop every message; a test route, reachable wherever it is built.
- **D-4 · Per-test limiter keys by header, inside the seam.** *Discarded:* ordering tests so the
  fourth valid post comes last — a shared counter that breaks when a test is added.
- **D-5 · State through `Astro.locals`.** *Discarded:* a prop `Resume` would have to forward.
- **D-6 · `MAILTRAP_ENDPOINT` for the manual sandbox send.** *Discarded:* a second sender.
- **D-7 · Subject verbatim, the visitor's name as From display name.** *Discarded:* the owner's
  name, a second identity reader (constitution 9); a fixed prefix, unrequested.
- **D-8 · Errors in `--danger-color`**, the existing state token defined in both themes
  (~6.6:1 on the light sheet), plus the text itself, so colour is never the only signal.
  *Discarded:* errors in `--fg` with weight and a border only. Owner decision 2026-10-15:
  a state colour, not part of the interface palette.
- **D-9 · The secret scan also covers `GITHUB_TOKEN`.** Amended constitution 6 is one rule.
  *Discarded:* a Mailtrap-only scan beside an unguarded half.
- **D-10 · `channel: 'chrome'`**, as the spec asks. *Discarded:* bundled Chromium, a download on
  the next Playwright upgrade.
- **D-11 · A failed send counts toward the limit**: it was handed to the sender. *Discarded:*
  refunding it, which lets a bot probe failures for free.

## 7. Test strategy

Runners from `package.json`: `npm test` (`vitest --run tests`) and `npm run test:e2e`
(`playwright test`, 1.56). No network: vitest uses the recording sender, e2e the stub, and the real
sender runs only against a fake `fetchImpl`. Addresses on `example.com` / `.test` only.

**Data** (`tests/contact-form.test.ts`; `new Request`, a stream body with `duplex: 'half'` for the
no-`Content-Length` case): *recipient*; *rules* (each rule × field; 5000 chars with CRLFs counts
5000); *gate* (method, type, 32 KB + 1 B with and without length); *honeypot*; *limit* (three
accepted, invalid and honeypot posts between, fourth limited, `now + windowMs + 1` accepted,
`size()` 0); *config* (each variable missing, `fetchImpl` never called); *failure* (throw, fired
fake schedule, 502); *silence* (an error carrying `fake-token-123` and the values; response and
every `console.*` call free of them); *plain text*, *payload* (`<b>` verbatim, no `html`, Bearer,
`User-Agent`); *seam* (`dev: false` → never stub, never header key); *one reader* (comment-stripped
`src/**`: each secret name only in its reader; a source read, since a reader is not a datum).

**Rendered** (`e2e/contact-form.spec.ts`; both locales and themes, after `settled`, a fresh
`x-e2e-client` per test): *names*, *privacy*, *limits*, *trap* (untabbable, `aria-hidden`, off
screen); *plain* with `javaScriptEnabled: false` (valid; invalid with `a@b`, which the browser's
`type="email"` accepts and the server refuses; fourth valid → limited; `STUB_FAIL_SUBJECT` →
failed: status, values, URL, descriptions); *enhanced* (URL and document kept, also after a client
navigation away and back; double click against a `page.route` delayed 1 s → one request;
keep/clear; live region per outcome; descriptions; focus); *client assets* (no JS/CSS body holds
the variable name or `e2e-fake-token`); *contrast* (labels, errors, privacy ≥ 4.5:1 with `contrast`
and the in-page `__groundOf`); *360* (`scrollWidth <= clientWidth`).

Red first today: all of them. Injections, each restored by explicit path, named in the commit:

| # | Injection | Expected red |
|---|---|---|
| 1 | recipient from `values.email` | recipient |
| 2 | `fieldLength` without the CRLF fold; then without `trim()` | rules (two runs) |
| 3 | `getAll(f).length` check dropped | rules (repeated field) |
| 4 | `Content-Length` check dropped; then `readCapped` uncapped | gate (two runs) |
| 5 | honeypot step after the send | honeypot |
| 6 | `record` before validation; then the sweep removed | limit (two runs) |
| 7 | `!sender` check removed | config |
| 8 | `schedule` ignored | failure (timeout) |
| 9 | `log(String(error))` | silence |
| 10 | `html: text` in the payload | payload |
| 11 | `selectSender` without `flags.dev` | seam |
| 12 | `import.meta.env.MAILTRAP_API_TOKEN` read in `contact-runtime.ts` | one reader |
| 13 | Nombre `maxlength` hardcoded to 200 | limits |
| 14 | privacy line through a missing key | privacy |
| 15 | `action` built with `?name=` from the values | plain (URL) |
| 16 | `pending` guard dropped | enhanced (one request) |
| 17 | `form.reset()` on every outcome; then the focus call dropped | enhanced (two runs) |
| 18 | `aria-live` removed; then `aria-describedby` never set | enhanced (two runs) |
| 19 | trap `tabindex` removed | trap |

Then `npm run build`, a search of the build output for `STUB_FAIL_SUBJECT`'s value (absent), and
the *Done when* walk: 1280×800 and 360×800, both themes and locales, each outcome scripts on and
off, `document.styleSheets` checked first; last, the owner's one manual sandbox send.

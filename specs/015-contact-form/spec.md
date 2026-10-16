# Spec 015 — Contact form, sent from the server

**Status:** implemented
**Size:** L
**Approved:** 2026-10-15 · three clarify rounds after the split from 018, no blocker left; seven decisions recorded · 274 lines, 24 RF
**Implemented:** 2026-10-16 · commits `32e75c0` (constitution 6), `a26db3a` (dev servers no longer reload each other mid-suite) and `6628407` (feat) · T-1–T-9 done, `npm test` 213/213, e2e 109/109 in three runs, build green and free of the stub and fake values · 24/24 RF, NFRs and edge cases validated; 19 injections red, 4a and 15 only after their guards were strengthened · T-10, the owner's Mailtrap sandbox send, still open

## Context and goal

Today the only way to write to the owner is to leave the site for a mail client.
The owner's proposal adds a form in the contact section that a visitor can send
without leaving the page.

The form has to fit the constitution: two runtime dependencies (1), nothing
third-party fetched by the browser (2), secrets server-side (9). So the owner
decided: the site's own endpoint sends the message by calling Mailtrap's Email
Sending API over plain `fetch` with a Bearer token — no SDK, no dependency, and
the browser only ever talks to the site. The goal is a form that delivers a
real, well-formed message to the owner, refuses spam and malformed input on the
server, says what happens to the visitor's data, and loses nothing typed, with
or without scripts.

The section title (spec 008) and the section's place on the page are shared
context, owned by neither this spec nor spec 018.

## Definitions

- **The token:** the Mailtrap API token, server-side configuration. Its value
  never appears in a document, test, log or response.
- **Sender address:** the "from" address on the owner's verified domain,
  server-side configuration the owner sets at deploy beside the token. Neither
  the address nor the domain is written in source or in any document.
- **The sender:** whatever hands a validated message to Mailtrap. In tests it is
  a stand-in the test supplies; the code that validates and answers never builds
  the real one itself.
- **Outcome:** *sent*, *invalid* (the request or one or more fields failed),
  *limited* (rate limit hit) or *failed* (configuration missing, or Mailtrap
  threw, timed out or refused).
- **Accepted submission:** one handed to the sender. Only these count toward the
  rate limit.
- **Valid submission:** a form POST whose four fields each arrive once, as text;
  none blank after trimming (any Unicode whitespace); the email of the shape
  `local@domain.tld` with no whitespace; name and subject without a line break;
  each field within its limit — Nombre 100, Email 254, Asunto 150, Mensaje 5000.
  Length is counted as the browser's `maxlength` counts it, on the trimmed value,
  so anything the field accepts the server accepts.
- **Enhanced / plain:** submitted by the page's script, or as a native HTML POST
  with scripts off.

## Actors

- **Visitor** — sends a message.
- **Owner** — receives it; creates the Mailtrap account, token and verified
  domain, and sets them at deploy.
- **Bot** — submits the form automatically, at volume.

## User stories

- US-1: As a visitor, I want to send a message from the page so that I do not
  have to open a mail client.
- US-2: As a visitor, I want to know what is done with what I type so that I can
  decide whether to send it.
- US-3: As the owner, I want the messages that reach me to be real and
  well-formed so that the inbox is not a spam trap.

## Requirements (EARS)

### Rendering

- RF-1: THE SYSTEM renders a form with four labelled fields — Nombre, Email,
  Asunto, Mensaje — and a submit control "Enviar mensaje", every text through
  `t()`. — **Check:** an e2e test reads the five accessible names on each locale
  and matches them against that locale's file.
- RF-2: THE SYSTEM shows, beside the submit control, the approved privacy line
  (Decision 6). — **Check:** an e2e test reads the line inside the form on each
  locale; it equals the approved wording for that locale.
- RF-3: THE SYSTEM declares on each field the required flag and maximum length
  the server enforces. — **Check:** a test reads each rendered field's
  `required` and `maxlength` and fails on any difference from the server's
  limit for it.

### Server

- RF-4: WHEN a submission is valid, THE SYSTEM hands the sender exactly one
  message, addressed to the owner's email contact with the visitor's email as
  reply-to. — **Check:** a test with a recording sender: one call, recipient
  identical to the email contact in the data, reply-to the submitted address.
- RF-5: IF a submission's fields are not valid, THEN THE SYSTEM answers
  *invalid* naming each failing field, without calling the sender. —
  **Check:** a test per rule of "valid submission" and per field: outcome
  *invalid*, field named, zero sender calls.
- RF-6: IF a request is not a form POST or its body exceeds 32 KB, THEN THE
  SYSTEM answers *invalid* without reading past the cap. — **Check:** a test per
  case — another method, another content type, a 32 KB + 1 B body with and
  without `Content-Length` — answers *invalid* with zero sender calls.
- RF-7: IF the honeypot field arrives non-empty, THEN THE SYSTEM answers *sent*
  without calling the sender. — **Check:** a test: outcome *sent*, zero sender
  calls.
- RF-8: IF a client address already has 3 accepted submissions in the last 10
  minutes, THEN THE SYSTEM answers *limited* without calling the sender. —
  **Check:** a test with a supplied clock: the fourth valid submission inside
  the window is *limited*, invalid and honeypot posts in between do not count,
  and the first one after the window is accepted.
- RF-9: IF the token or the sender address is not configured, THEN THE SYSTEM
  answers *failed* without touching the network. — **Check:** a test with each
  one missing: outcome *failed*, no network call.
- RF-10: IF the sender throws, gets no answer within 8 s, or gets a non-2xx
  answer, THEN THE SYSTEM answers *failed*. — **Check:** a test per cause, with a
  supplied timer for the timeout, answers *failed* and never a 500.
- RF-11: THE SYSTEM never writes the token to a response or a log line. —
  **Check:** a test whose sender throws an error carrying a fake token; neither
  the response body nor any captured console call contains it.
- RF-12: THE SYSTEM never writes a visitor's field value to a log line. —
  **Check:** the same failing sender carrying the field values; no captured
  console call contains any of them.
- RF-13: THE SYSTEM reads the token in exactly one server-side place. —
  **Check:** a scan of comment-stripped source finds the variable's name in one
  server module and in no built client asset; a source read because a secret's
  reader is not a datum (constitution 8).
- RF-14: THE SYSTEM sends the message body as plain text, with the visitor's
  values as text. — **Check:** a test: the payload the sender receives carries a
  submitted `<b>` verbatim in a text body and no HTML body.

### Client

- RF-15: WHILE scripts are off, THE SYSTEM shows the outcome of a native POST on
  the page it returns, at the contact section. — **Check:** an e2e test with
  JavaScript disabled sends one valid and one invalid submission and reads each
  outcome in the section.
- RF-16: WHILE scripts are off, IF a submission answers *invalid*, *limited* or
  *failed*, THEN THE SYSTEM returns the page with the typed values in their
  fields. — **Check:** an e2e test with JavaScript disabled reads every field's
  value after each outcome; all equal what was typed.
- RF-17: THE SYSTEM never places a visitor's field value in a URL. — **Check:** a
  test reads the location of every plain-POST answer; none contains a submitted
  value.
- RF-18: WHEN scripts run, THE SYSTEM submits the form without a page
  navigation. — **Check:** an e2e test: the URL and the document are unchanged
  after a submission, also after a client navigation away and back.
- RF-19: WHILE an enhanced submission is pending, THE SYSTEM ignores further
  submits of that form. — **Check:** an e2e test double-clicks submit against a
  delayed endpoint and counts one request.
- RF-20: WHEN an enhanced submission answers *invalid*, *limited* or *failed*,
  THE SYSTEM keeps what the visitor typed. — **Check:** an e2e test reads every
  field's value after each outcome; all unchanged.
- RF-21: WHEN an enhanced submission answers *sent*, THE SYSTEM clears the form.
  — **Check:** an e2e test reads the four fields empty afterwards.
- RF-22: WHEN an enhanced submission answers, THE SYSTEM announces the outcome
  in a live region inside the section. — **Check:** an e2e test reads the polite
  live region after each of the four outcomes and matches the locale's string.
- RF-23: WHEN the server answers *invalid*, THE SYSTEM makes each error message
  the accessible description of its field. — **Check:** an e2e test, scripts on
  and off, reads each invalid field's accessible description; it equals that
  field's error string.
- RF-24: WHEN an enhanced submission answers *invalid*, THE SYSTEM moves focus to
  the first invalid field. — **Check:** an e2e test reads the focused element
  after an invalid submission.

## Non-functional requirements

- **No dependency.** `dependencies` and `devDependencies` grow by nothing
  (constitution 1, 7); the call to Mailtrap is `fetch`.
- **No browser subresource.** The browser talks only to the site (constitution
  2); Mailtrap's host is reached by the server only.
- **Tests use a stand-in sender and never the network** (Decision 7). The
  sandbox is for development and the one manual send in "Done when".
- **No real address in tests or source.** Reserved domains only (`example.com`,
  `.test`); `grep -rn "gmail\.com" tests/` stays empty (constitution 9); the
  sender address lives only in deploy configuration.
- **Language.** Labels, errors, outcomes and the privacy line through `t()`, es
  and en (constitution 10).
- **Visual language.** The submit control is spec 007's primary button. Field
  borders follow spec 017's control boundary and the focus ring is spec 016's;
  text meets 4.5:1 in both themes.
- **The honeypot** is hidden from people and assistive technology, out of the
  tab order, and marked not to autofill.
- **The rate limiter holds a client address in memory for its window only** and
  writes it nowhere; expired entries are dropped, so its memory is bounded.

## Edge cases

- **Mailtrap down or slow:** *failed* (RF-10); nothing typed is lost (RF-16,
  RF-20).
- **Spam burst:** RF-7 drops naive bots; RF-8 caps the rest per client address,
  per instance — best effort (Decision 1).
- **Oversized body, missing `Content-Length`, wrong method or content type:**
  RF-6.
- **Missing, repeated or non-text field:** RF-5.
- **Cross-origin POST:** refused by the framework's origin check; the site's own
  form passes it.
- **Double submit with scripts off:** can send twice until the limit stops it;
  accepted. With scripts on, RF-19.
- **Refresh after a plain-POST answer:** the browser asks before re-posting; a
  re-post goes through RF-8 like any other.
- **A send that timed out but was delivered:** the visitor's retry duplicates
  it; accepted. The site never retries on its own.
- **Navigation while an enhanced submission is pending:** its outcome is
  discarded.

## Out of scope

- The contact cards and their copy controls: spec 018.
- Storing messages, an admin view, an auto-reply, or alerting the owner when
  sends fail.
- CAPTCHAs or any third-party anti-bot script (constitution 2).
- A shared rate-limit store (Decision 1).
- Found while reading, not fixed here: the deployed adapter is `@astrojs/vercel`
  from `devDependencies` while constitution 1 names `@astrojs/node`.

## Guards retired

None; the form is new.

## Done when

- `npm test` and the e2e suite green; `npm run build` green.
- Every new guard shown red by its injection, then reverted by explicit path.
- Seen from the dev server, light and dark, 1280px and 360px: each outcome with
  scripts on and off.
- One send to the Mailtrap sandbox, run by hand with the owner's sandbox token,
  arrives there; no automated test does this.

## Prerequisites

1. **Owner:** the Mailtrap account, the token(s), the verified domain and the
   sender address, set as server-side configuration locally and in production.
2. **Constitution 7 amended** so the e2e suite runs in the pre-commit hook; every
   rendered check above depends on it.
3. **Constitution 6 extended** to "every secret has one reader", or RF-13 has no
   rule behind it.
4. **Spec 008** (section title), **spec 007** (primary button), **spec 016**
   (focus ring) and **spec 017** (control borders).

## Decision

All 2026-10-15, owner.

1. **Rate limit:** best effort in server memory, per instance, lost on a cold
   start, together with the honeypot. Discarded: a shared store, because it
   needs a second account and secret for a portfolio's traffic.
2. **Client address:** the adapter's client address. Discarded: the first hop of
   `x-forwarded-for`, which a client can set; the plan verifies what Vercel
   provides.
3. **Figures:** 3 accepted submissions per address per 10 minutes; Nombre 100,
   Email 254, Asunto 150, Mensaje 5000; body cap 32 KB; timeout 8 s. Only
   accepted submissions count. Discarded: counting every post, because a
   visitor fixing a typo would lock themselves out.
4. **Scripts off with *invalid*, *limited* or *failed*:** the server returns the
   page with the typed values and the error. Discarded: losing the text, and
   carrying it in the URL (privacy, RF-17).
5. **Sender address:** on the owner's own domain, verified by Mailtrap, set as
   deploy configuration. Discarded: a `vercel.app` address, whose DNS the owner
   cannot edit.
6. **Privacy line:** es «Solo para responderte; este sitio no guarda tu mensaje.
   Se envía a través de Mailtrap.» / en "Only used to reply to you; this site
   does not store your message. It is sent through Mailtrap." Discarded: stating
   Mailtrap's retention or the host's logs, which are unverified.
7. **Tests:** a stand-in sender, never the network; this narrows the earlier
   "sandbox for development and tests". Discarded: tests against the sandbox,
   because they would need the token in the hook and fail offline.

## For the plan

- Verify what the adapter exposes as the client address on Vercel.
- Check the 8 s timeout against the platform's function duration limit.
- Verify against Mailtrap's documentation whether the sandbox is the separate
  Email Testing product with its own host and token, not the sending host.
- Rendered checks run on the installed Chrome; the e2e server must not collide
  with a dev server on 4321.
- If constitution 2's host scan reads all of `src/`, it must tell the server-only
  Mailtrap host from a browser fetch.
- The e2e checks of RF-15, RF-16 and RF-22 need *sent*, *limited* and *failed* from a
  running server without the network: the plan defines the seam (a test-only server
  configuration that selects the stand-in sender, never reachable in production) and
  adds the e2e `webServer` entry.

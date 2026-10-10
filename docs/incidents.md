# Incidents

The history behind the rules in `AGENTS.md`. The rules live there; this file is the *why*.
Read it when a rule feels arbitrary — it is not.

## Six guards that were green while the violation happened

All six had the same shape: the guard did not look where the violation actually was.

- **A length threshold cannot tell a label from a note.** `comments.test.ts` rejected comments over
  90 characters; four real notes of 47-72 characters sailed through and the threshold looked like it
  was working.
- **A per-line check misses a multi-line note.** The same test measured a comment's first line. Notes
  were wrapped, so line one was short and lines two to four were never read — `SkillBar` shipped a
  271-character note, ten times per page.
- **A scanner can silently drop half a file.** The same test set `skipUntil` on any `<script>` and
  cleared it on `</script>`. `AboutSection` has a self-closing
  `<script type="application/ld+json" />`, so everything after it left the analysis for good.
- **A brace inside a CSS comment swallows the rule after it.** `tokens.test.ts` scanned raw CSS with
  `/\{([^{}]*)\}/g`. A note in `00-tokens.css` quotes ``a { color: … }``, and that `{` paired with
  the `}` closing `:root`, so the scan read **193 characters of that file out of 6389** and never saw a
  token. The other three tests in the same file already stripped comments, which is why only this one
  was blind.
- **A hardcoded list of files goes stale silently.** `viewtransitions.test.ts` iterated five component
  names. A sixth component with a `DOMContentLoaded` binding passed all seventeen tests — seventeen
  being the count then; the file has fewer now, and the number is not the point.
- **An assertion can be satisfied by something other than the thing.** One test asserted
  `toContain('AvatarCircle')`, which the import path `'./AvatarCircle.astro'` satisfies alone —
  replacing the component entirely, usage and import, stayed green. Ask what else in the file
  matches your substring.

## Proposals that were wrong on arrival

- **A proposal that had never been measured.** Symmetrising the toggle labels was proposed as the fix
  for a button that resized; measured, it only took the jump from 44px to 13px, because "menos" is
  wider than "más" by 14px even though both are followed by the same noun. Equalising a label's
  *shape* does not equalise its *width*.
- **A regression announced from arithmetic.** A fixed 52px name was called a regression on a phone
  because 623px of text over a 273px column "should" wrap to two lines. Measured, it wrapped to three
  either way — no regression, and the reason given was false.
- **A contrast figure computed from a value never fetched**, reporting 2.94:1 against a real 6.08:1 —
  which would have been a false bug report.
- **A claim that is false on arrival.** A draft constitution rule read "no third-party request at
  runtime" while `ABOUT.avatar` is a remote GitHub PNG. Checking each claim against the repo before
  writing it is what caught that, and three others.

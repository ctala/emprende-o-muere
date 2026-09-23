# Design

## Context

See proposal.md — Why. Implementation-relevant facts:

- The terminal model is built in `ui/view.js` (`buildModel` → `terminal` block)
  from `state.gameOver/reason`, `ctx.settlement` (captured from the RUN_ENDED
  event in `ui/main.js`, survived only) and `ctx.lastLearn`. Bankruptcy facts
  (month) are already in `state.month` — no new core surface is needed for the
  metadata line or the share post.
- The seed lives in `ui/main.js` as `SEED` (parsed from `?seed=` with the
  default fallback); `document.body.dataset.seed` already exposes it, and
  boot.test.js pins that the same seed replays the same run.
- The sheet DOM is static (`index.html`: stamp / headline / learn / settlement
  / restart); CSS classes `.stamp`, `.terminal-headline` own the look.
- The ledger red contract ("red is for negative money") is pinned by
  `tests/surfaces.test.js`; the green tier token `--tier-high` is what the
  morale/energy bars already use for "good".
- e2e runs over `http://127.0.0.1` (a secure context), so
  `navigator.clipboard` exists in the gate environment.

## Goals / Non-Goals

**Goals**

- One glance tells survived from bankrupt before reading (seal color), and
  one line tells WHICH run this is (seed + months).
- The terminal hands the player a ready WhatsApp post whose link replays the
  exact run, through the best channel the browser allows.
- Everything testable under the existing gate: pure compose in Node, behavior
  in the CDP harness.

**Non-Goals**

- No canvas/PNG share card, no per-run og:image (needs a server; backlog), no
  analytics or share tracking, no account/leaderboard — pure static rules.
- No core/economy change: sweep must stay byte-identical.
- No redesign of the settlement ledger values themselves.

## Decisions

**D1 — pure `composeShareText(terminal, seed, selfUrl)` in `ui/share.js`.**
Node-importable, zero DOM (same seam as view.js's pure `buildModel`). Inputs
are the already-built terminal model (headline stamp word, learn, settlement
lines), `SEED`, and `window.location.origin + pathname`. Output: plain-text
post (stamp word · months · personal total for survived · learning when
present · replay link). Alternative considered: compose at click-time in
main.js — rejected because the visible post text and the shared text MUST be
the same string, and the visible text is a view-model concern.

**D2 — seed comes from the URL const, not from state.** The spec's promise is
"the receiver replays your run", which is true only of the seed the page
actually played. `SEED` is that value by construction (it created the state).

**D3 — degradation chain, not feature-detection theater.** On click:
`navigator.canShare?.({text,url})` → `navigator.share(...)` (catch
`AbortError` silently — canceling is not an error); else
`navigator.clipboard.writeText(...)` with a visible "copiado" swap on the
button for ~1.5s; else `select()` the visible `<textarea readonly>` post
block. The visible post block is always rendered under the CTA (dim italic
annotation treatment, storyboard-style) so the chain always ends somewhere.

**D4 — green seal as a modifier class, `.stamp.survived`.** CSS: color +
dashed border + outline flip to `--tier-high` (same green the bars use — the
identity vocabulary stays closed under a single green token). Bankrupt keeps
`.stamp` red. The surfaces test gains a check that the survived modifier
references `--tier-high`, not `--red` (string-level, like the existing lock
reason check). Alternative: a different seal shape for survived — rejected,
the rotation/dashed double-outline IS the seal; color is the verdict channel.

**D5 — metadata line is view-only.** `.terminal-meta` mono, right-aligned:
`seed <n> · mes <month>`. Sourced from `ctx.seed` + `state.month` already in
the model inputs. Survived and bankrupt both get it (it identifies the run,
not the verdict).

**D6 — ctx extension, not a new layer.** `buildModel` gains `ctx.seed` and
`ctx.shareUrl` (two UI-only inputs, same category as `ctx.afford/reason`).
The terminal model gains `meta` and `post` strings; `renderView` paints them;
main.js wires the share button through `ui/share.js`'s perform function.

## Risks / Trade-offs

- **WhatsApp in-app browsers and plain-http hosts lack the clipboard API.**
  Covered by D3's last step: the post is visible and manually selectable.
- **`navigator.share` cancel throws.** Handled explicitly (silent) so the
  button never shows a false failure.
- **Post text reads as ad copy if over-polished.** Copy stays in the ledger
  voice (short facts + link); strings live in `content/strings_es.js` so the
  drift tests keep them honest.
- **`select()` on a readonly textarea is fiddly on iOS.** Accepted — it is
  the third fallback, and the text is on-screen regardless.
- **Two seeds in one URL** (friend forwards `?seed=X` then plays and shares):
  compose always uses the live `SEED`, so the forwarded link replays THEIR
  run, not the one they received. Correct by construction; pinned in a test.

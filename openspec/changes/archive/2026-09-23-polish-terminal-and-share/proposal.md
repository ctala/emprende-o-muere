# Proposal

## Why

The terminal screen is the game's only shareable artifact and today it fails
at both jobs. First, it has no cariño: the panel (2026-09-22 rounds, 0/5 would
share) describes it as a "factura atrasada" — survived and bankrupt render
with the same red rubber stamp, the same mono headline, the same lone CTA, so
the one moment worth forwarding reads identically whether you built a company
or burned one. The owner's elhda/Storyboard references (green APPROVED stamp
over a ruled card, glanceable metadata line) are the visual bar: a seal that
celebrates, a result line you read in one second.

Second, the viral path does not exist. The copy block is not copyable, there
is no share action, and — the load-bearing piece — nothing carries the run
itself. A friend who receives the link cannot replay YOUR 24 months because
the deterministic engine ignores the seed in the URL unless someone types it.
The game already renders every run from `?seed=` (boot contract pinned by
tests); forwarding that parameter turns every terminal screen into "jugá mi
misma partida", the cheapest viral loop a deterministic game can have.

## What Changes

- Stamp identity split: `SOBREVIVISTE` moves to the tier-high green seal with
  a celebratory treatment (ledger green border/text, no red — red stays
  reserved for negatives and bankruptcy per the ledger contract); `QUEBRASTE`
  keeps the red. Both stamps gain the storyboard metadata line (seed + months
  survived + personal total as right-aligned mono facts).
- Terminal typography pass: headline becomes large mono uppercase with wide
  tracking (documentary header treatment), settlement ledger rows inherit the
  ruled rhythm, learning line stays italic annotation style.
- Share block on the terminal: a "Compartir" button (same 52px ink CTA stamp)
  that posts a Spanish result post — stamp word, months, personal total, the
  learning line, and a link to the same page with `?seed=<current>` — via
  `navigator.share` when available, falling back to clipboard copy with a
  visible confirmation, and finally to selecting the visible post text. The
  post text is strings-content, built only from terminal facts the settlement
  already carries.
- The post text is also rendered on screen (dim italic annotation under the
  CTA) so the block reads as "a post worth forwarding" even when sharing
  fails outright.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `ui-shell`: "Shareable terminal screen" gains the share-block requirement
  (share action, seed replay link, clipboard fallback, on-screen post text);
  "Terminal screen states the reason" gains the outcome-colored stamp
  (green survive seal vs red bankrupt seal) and the metadata line.

## Impact

- Code: `ui/view.js` + `ui/main.js` (terminal model + share wiring),
  `content/strings_es.js` (share-copy keys), `styles.css` (green seal,
  headline treatment), `index.html` (share button + post block nodes).
- Tests: unit pins on the share-text composition (pure function over
  settlement params), e2e pins on stamp color classes and the share fallback
  (clipboard stub in the harness); the deterministic `?seed=` replay contract
  already exists in boot.test.js and gets one forwarding-URL pin.
- No core/economy change: the sweep must stay byte-identical; the share link
  is assembled in ui/ from state already exposed.
- Zero new dependencies; navigator.share/clipboard are progressive
  enhancements behind feature checks (no build step, stays pure browser).

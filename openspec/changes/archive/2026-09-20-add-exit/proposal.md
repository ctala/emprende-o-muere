# Proposal

## Why

The cap table is a promise the game has never paid out: fundraising sims end with founders at ~$1000k of company cash and 1-2% of it. Without a settlement the ownership numbers are decoration, and the player never learns whether each round they signed was worth it. The exit is the punchline that converts every prior decision — hires, pitches, counters, energy — into one personal-wealth number.

## What Changes

- New terminal-time settlement computed by the core (no new action, no PRNG): at run end, `valuationK = 150 + 10 * traction`, founder payout `payoutK = trunc(founderPctBps * valuationK / 10000)`, and — if the founder still holds control (`founderPctBps >= 5000`) — they also take the company cash, so `personalK = payoutK + (control ? cashK : 0)`
- The month-24 `survived` terminal event and screen gain the settlement facts (valuation, your %, payout, cash-out, personal total); bankruptcy ends with no settlement (company dies with the cash)
- Control threshold makes the naive-raise strategy visibly ruinous while rewarding hybrid play: sim over 8 seeds shows naive ASAP-pitching at personal ~$4k, bootstrapping ~$200-640k, and raise-early-then-build at ~$580-889k — the lesson is that raising is good when the money builds traction, bad when the traction builds the cap table
- `founderPctBps`/`investors` finally read by the core for payout math (integer-only, no truncation surprises: single multiply-trunc)

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `game-core`: run-end requirement gains the settlement computation on the `survived` terminal (valuation, payout, control cash-out) carried in the run-ended event; bankruptcy carries none
- `ui-shell`: terminal screen shows the settlement ledger (valuation, founder %, payout, cash-out, personal total) for survived runs instead of the bare survival line

## Impact

- `core/game.js`: `exitOf(state)` pure helper + settlement params in tuning block; END_MONTH terminal path attaches settlement params to the run-ended event on survived
- `content/strings_es.js`: settlement template lines (Spanish)
- `ui/renderer.js` + `ui/main.js`: terminal ledger render from event params only
- `tests/core.test.js`: settlement vectors (control vs non-control), strategy pins (bootstrap > naive; hybrid can beat both; bankrupt has no payout)
- No new actions, no PRNG draw, no state fields — settlement is derived at terminal time, so replays stay byte-identical

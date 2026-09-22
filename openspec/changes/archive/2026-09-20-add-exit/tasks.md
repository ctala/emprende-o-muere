# Tasks

## 1. Core settlement

- [x] 1.1 Add `exitOf(state)` to core/game.js with tuning constants (EXIT_BASE_K 150, EXIT_SLOPE 10, EXIT_CONTROL_BPS 5000): integer-only `valuationK = 150 + 10 * traction`, `payoutK = trunc(founderPctBps * valuationK / 10000)`, `cashOutK = founderPctBps >= 5000 ? cashK : 0`, `personalK = payoutK + cashOutK`; in `endMonth` attach `valuationK/payoutK/cashOutK/personalK` to the run-ended event params ONLY when reason is `survived`. Verify: `node --test 'tests/*.test.js'` green with new tests — control vector (traction 20, cash 300, 10000 bps -> valuation 350, payout 350, cashOut 300, personal 650), non-control (4900 bps -> payout 171, no cash-out), boundary exactly 5000 counts as control, bankrupt run-ended event carries no settlement keys, and settlement is deterministic across two replays of the same seed

## 2. Balance pins

- [x] 2.1 Pin the exit lesson in tests/core.test.js over seeds [11,22,33,44,55,66,77,88] with three harvest strategies: bootstrap-never-raises personal >= 150 on every seed; naive ASAP-raise personal <= 10 on every seed (the raise-everything disaster is strict, not average); early-raise-then-build beats bootstrap on at least 5/8 seeds and wins on average, without pinning the 2 seeds it loses (the lesson is a judgment call, not a formula). Verify: `node --test 'tests/*.test.js'` green; the three strategy helpers documented as pinned from the exit sim

## 3. Content + UI

- [x] 3.1 Add strings_es.js keys for the settlement ledger: `evt.run_ended.survived.settlement` base line plus `ui.exit.valuation` / `ui.exit.payout` / `ui.exit.cashout` / `ui.exit.personal` / `ui.exit.lost_control`, all filled only from event params. Verify the every-event-key-resolves test passes and format() throws on a missing param (loud)

- [x] 3.2 Render the ledger in ui/renderer.js + ui/main.js terminal screen: survived runs show the survival line + valuation + payout + (cash-out only when cashOutK > 0) + personal total; `founderPctBps` printed as a whole percent; bankrupt unchanged. Verify: a layout/fit check that the ledger lines land inside the canvas (existing layout test or a new assertion) and a CDP screenshot of a survived end with control and one without

## 4. End-to-end verification

- [x] 4.1 CDP playthrough to a survived end (seeded so month 24 hits): terminal ledger visible with real numbers, zero console errors, zero external requests, identical click plan across two sessions ends on identical final frame (settlement adds no PRNG); one bankruptcy run confirms no ledger renders; README dev log entry records the valuation slope choice and the three-strategy numbers

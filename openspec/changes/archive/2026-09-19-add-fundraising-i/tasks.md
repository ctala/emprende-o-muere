# Tasks

## 1. Core: energy and pitch

- [x] 1.1 Add energy/pitch constants (ENERGY_MAX/START, regen +10, REST +25, drain −80, gate 40, min month 6, cooldown 2, FUND_PRE_BASE 150, FUND_PRE_PER_TRACTION 4, FUND_ROUND_K 120, tier bounds 60/85) and the new state fields in `createGame` (founderEnergy 100, offer null, pitchCooldown 0, founderPctBps 10000, investors []) in core/state.js + core/game.js; verify: `node --test 'tests/*.test.js'` stays green (existing 64 tests) and a fresh state serializes with the new fields

- [x] 1.2 Implement PITCH in `takeAction`: reject when focus 0, month < 6, cooldown > 0, energy < 40, or offer pending; on success focus −1, energy −80 (clamp 0), frozen offer `{preK, roundK, investorPctBps, founderPctAfterBps}` with the energy-tier multiplier (×11/10 at ≥85, ×2/3 at <60, ×1 otherwise, all trunc integer math), emit `evt.offer_made`; verify: unit tests for each rejection and a priced-vector test (traction 50 @ energy 40 -> preK 233; traction 0 @ energy 85 -> preK 165; rngState unchanged)

- [x] 1.3 Implement ACCEPT_ROUND / DECLINE_ROUND (no focus cost; accept adds roundK cash, appends frozen investor row, assigns founderPctBps from the offer, sets cooldown 2; decline clears + cooldown 2) and the END_MONTH ticks (+10 energy clamp, cooldown −1, expire pending offer without cash change or cooldown); verify: unit tests for dilution math (4095 bps -> 5905; compound 4095+2000 -> 4724), expiry silence, and that PITCH is rejected while an offer is pending

## 2. Balance pins against the real core

- [x] 2.1 Port the sim strategies to `tests/core.test.js` as pinned trajectories over the fixed seed set [11,22,33,44,55,66,77,88]: no-pitch bootstrap end-month/cash identical to the hires pins; fresh-pitch strategy survives 8/8 with founderPctBps < 10000; drained-pitch (gate 40) strategy survives 8/8 with cash strictly below the fresh-pitch average ($540 vs $1020 — the energy price gradient); offer-vector pin: traction 50 @ energy 40 pre-prices below the same pitch @ energy 100; verify: `node --test 'tests/*.test.js'` green with these as new named tests

## 3. Content + UI

- [x] 3.1 Add strings_es.js keys for the PITCH button label (with month/cooldown hints), energy tiers, the offer panel (pre-money, round, investor %, founder-after %), ACCEPT/DECLINE buttons, and event templates `evt.offer_made` / `evt.round_closed` / `evt.offer_declined` / `evt.offer_expired`; verify: every EVENT_KEYS entry resolves to a string via the strings lookup test pattern (missing-key test fails loudly)

- [x] 3.2 Lay out and draw the energy bar in the HUD (segmented, fresh/ok/drained styles matching 85/60 bounds) and the founder % readout, plus the offer panel strip with ACEPTAR/DECLINAR hit regions in ui/layout.js + ui/renderer.js; verify: layout math fits the existing canvas size with no overlap (assert in a layout unit check or visual check via the CDP harness), HUD reads 100% at game start

- [x] 3.3 Wire dispatch in ui/main.js: PITCH button + panel buttons route through the same run-logged dispatch path; while `state.offer` is pending every other button dispatch is ignored and the auto-close timer is suppressed (manual END_MONTH hidden/disabled while pending); verify: CDP harness run — click to a pitch, offer panel appears, month does NOT auto-close with focus 0, clicking ACEPTAR adds round cash and updates the HUD founder %

## 4. End-to-end verification

- [x] 4.1 CDP playthrough (seed with a funded path, plan of clicks: build/talk to traction, pitch at high energy, accept, then a drained pitch declined): zero console errors, zero external requests, run log replays to the same final state via `applyAction` in the harness; screenshots of offer panel + post-round HUD saved for review; README dev log entry records the energy tuning (drain 80 / gate 40 rationale) and the cash-vs-ownership trade-off

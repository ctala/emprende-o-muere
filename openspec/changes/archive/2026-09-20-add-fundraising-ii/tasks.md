# Tasks

## 1. Core: counter action

- [x] 1.1 Add COUNTER_ROUND to `applyAction` + `counterRound` reducer in core/game.js with constants (COUNTER_ENERGY_COST 20, bps multiplier 4/5, walk 1/4 via one rngNext draw) and new event keys (offer_countered, offer_walked); rules: reject with no state change when no offer / already countered / energy < 20; on success keep preK/roundK, investorPctBps = trunc(old * 4/5), recompute founderPctAfterBps, set countered flag; on walk clear offer + cooldown 2. Verify: unit tests for each rejection, the pricing vector 4095 -> 3276, both walk and success reproducible from seed, one-draw-per-counter (rngState advances exactly once)

## 2. Balance pin

- [x] 2.1 Pin the counter trade-off in tests/core.test.js over seeds [11,22,33,44,55,66,77,88]: fresh+always-counter ends below fresh+never-counter on cash AND above it on founderPctBps (sim: ~$900/1-2% vs $1020/<1%); verify `node --test 'tests/*.test.js'` green

## 3. Content + UI

- [x] 3.1 Add strings_es.js keys: action.ui.offer.counter label + desc (cost + walk risk), evt.offer_countered, evt.offer_walked; verify the every-event-key-resolves test passes with the new keys
- [x] 3.2 Draw the third offer button NEGOCIAR in ui/layout.js + ui/renderer.js + ui/main.js: three-button row, disabled when offer.countered or founderEnergy < 20, panel re-renders improved terms after success; verify layout test covers the new region (no unsanctioned overlap, inside canvas) and CDP screenshots show pre/post-counter terms and the drained/disabled case

## 4. End-to-end verification

- [x] 4.1 CDP playthrough: fresh pitch -> NEGOCIAR success path (terms improve, second counter disabled), and a seeded run reaching a walk (panel gone, pitch on cooldown); zero console errors, zero external requests, identical click plan across two sessions ends on identical final frame (counter PRNG is deterministic); README dev log entry records the cash-for-ownership trade numbers

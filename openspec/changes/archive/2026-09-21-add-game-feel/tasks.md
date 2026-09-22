# Tasks

## 1. Effect model (pure)

- [ ] 1.1 Create `ui/fx.js`: `effectsFromEvents(events, before, after)` -> descriptor list (tween per changed HUD number with dur 350 ms; floater per signed delta near its HUD slot with dur 600 ms, max one per slot per dispatch; shake descriptor dur 120 ms only for RUN_ENDED(bankrupt) / ROUND_CLOSED / OFFER_WALKED, offsets from a fixed table hashed off event params — no Math.random, no Date.now; clock injected). Verify: `tests/fx.test.js` — descriptors for a build-product event (traction +8 floater, traction/morale tweens), merge rule for duplicate slots, shake fires exactly on the three events and not on build/rest, tweens land exactly on the `after` values, all durations <= 700 ms, and a determinism check (same events -> same descriptors)

## 2. Render loop (main.js only)

- [ ] 2.1 `ui/main.js`: keep per-dispatch draw; start a rAF loop while `fx.active` is non-empty, advancing an injected `performance.now()` clock, drawing tweens into the HUD number slots and floaters above the HUD, applying the shake as a temporary `ctx.translate` around the page block (hit testing stays untranslated); when the loop drains, run one final static draw and stop. Terminal draws skip tweens (truth shows immediately) but still fire the bankrupt shake. Verify: layout frozen-coordinate test untouched and green; `tests/fx.test.js` loop-state assertions (list drains to empty)

## 3. Verify against the contracts

- [ ] 3.1 Extend the CDP flow: after a BUILD the frame differs mid-effect (< 400 ms) and equals the settled frame after 800 ms; two sessions with the same plan (settled waits) end on identical final frames; bankrupt run shakes (frame captured at ~+60 ms differs from its settled frame); clicks during animation hit normally (BUILD during cash tween still dispatches); 0 console errors, 0 external requests
- [ ] 3.2 Full Node suite green, README dev log entry, then validate and archive

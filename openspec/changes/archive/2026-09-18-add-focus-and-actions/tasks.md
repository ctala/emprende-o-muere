# Tasks

## 1. Core: rules

- [x] 1.1 Add the tuning constants block to `core/game.js` (bases, morale costs, REST amount, jitter ranges, `TIER_HIGH_MIN`/`TIER_MEDIUM_MIN`, decay, `FOCUS_PER_MONTH`) and extend `createGame` in `core/state.js` with `focus: 2`, `traction: 0`, `teamMorale: 80`; verify `node --test` keeps the createGame determinism tests green
- [x] 1.2 Implement `END_MONTH` replacing `NEXT_MONTH`: morale decay (5 ± 2 jitter via one PRNG draw, clamp 0), focus reset to 2, month advance, terminal behavior unchanged; update existing replay/terminal tests to END_MONTH and add a test that `NEXT_MONTH` throws unknown-action; verify `node --test` passes
- [x] 1.3 Implement the 4 actions with focus cost, morale-tier scaling (100/50-trunc/0), integer jitter [-3,+3] drawn only when tier > 0, morale clamps, and rejection when focus = 0; verify `node --test` covers: cost accounting, 3rd action throws at focus 0, tier boundaries (exactly 67 and exactly 34), trunc-halving case, REST +15 with 100-clamp, low-tier action leaves rngState unchanged
- [x] 1.4 Emit `evt.action_taken` with actually-applied integer deltas from every action; verify a new core test asserts params match the diff between old and new state for BUILD_PRODUCT and REST
- [x] 1.5 Add the full-run draw audit: scripted month plan (`BUILD_PRODUCT, REST, END_MONTH` × 24, plus one low-morale plan) replayed twice is byte-identical and consumed draw count equals the audited count derived from rngState math; verify via `node --test`

## 2. Content

- [x] 2.1 Add Spanish strings for HUD (`hud.focus`, `hud.traction`, `hud.morale`), the 4 actions (name + short description), `end_month.button`, and `evt.action_taken` with `{action}`/deltas placeholders; verify the existing event-key coverage test still passes (all EVENT_KEYS resolve)

## 3. UI

- [x] 3.1 Implement a pure `ui/layout.js` exporting button regions for the 800×450 canvas (4 action buttons row, END_MONTH button) plus `hitRegion(x, y, layout)` with CSS-scale correction; add a node:test for hitRegion (inside region, outside, scaled coords) and verify `node --test` passes
- [x] 3.2 Rework `ui/main.js`: click routes through hitRegion to the correct core action; disabled drawing (50% alpha) and no dispatch when focus = 0 or gameOver; clicks outside buttons do nothing; verify via headless CDP script (same harness as before): 2 actions + END_MONTH updates HUD, 3rd action click is a no-op, empty-area click is a no-op, post-game-over clicks are pixel-identical
- [x] 3.3 Render the HUD from state only: focus as dots, traction number, morale bar tinted by tier (color from tier, not raw value); verify via CDP screenshot diff at focus 2 vs 0 and at high vs low morale (states forced through scripted actions)

## 4. Integration

- [x] 4.1 Full manual pass via static server: play a complete 24-month run entirely by clicks (both actions most months, rest when morale low, tier color visibly changes, dead months at morale < 34 give no traction), then `node --test` green and zero external network requests; record tuning impressions (which actions felt dominant) in the PR description for change 03 balancing

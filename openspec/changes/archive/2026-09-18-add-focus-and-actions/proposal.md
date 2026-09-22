# Proposal

## Why

The walking skeleton proves determinism and the core/UI seam, but there is no game yet: the only interaction is "next month". The roguelite's core fantasy — two actions per month, scarce time not money, hard tradeoffs — needs its first real decision loop before any economy or fundraising layer can be meaningfully built on top.

## What Changes

- Add a focus resource: 2 focus per month; actions cost 1 focus; focus does not carry over between months.
- Add 4 actions: `BUILD_PRODUCT`, `TALK_TO_CUSTOMERS`, `PUBLISH_CONTENT` (labor: raise traction, cost morale) and `REST` (raise morale, no traction).
- Add two game dimensions to state: `traction` and `teamMorale` (integers only).
- Add a morale effectiveness gate: action traction yield scales with the team's current morale tier — full / half / zero (integer arithmetic, e.g. halving via `Math.trunc` on integers). Morale decays by a fixed amount at the start of each month (with PRNG jitter).
- Each action's traction gain includes small PRNG jitter (±3, drawn from state-internal rngState), so the seeded RNG now drives real gameplay and replay tests cover it.
- UI: actions become the primary interaction — clickable hit-region buttons drawn on canvas; the month no longer advances on any click. Closing the month becomes an explicit `END_MONTH` button that resets focus, applies morale decay, and advances the month (terminal behavior at month 24 unchanged).
- New Spanish strings for action names, descriptions, HUD (focus/traction/morale), and their events.

## Capabilities

### New Capabilities

(none — the three capabilities from the walking skeleton already cover this behavior)

### Modified Capabilities

- `game-core`: state gains `focus`, `traction`, `teamMorale`, morale tier; `NEXT_MONTH` is replaced by `END_MONTH` (with morale decay + focus reset); four gameplay actions with focus cost, morale-gated yields, and PRNG jitter become specified.
- `ui-shell`: click semantics change from "any click advances the month" to hit-region buttons for the 4 actions + explicit END_MONTH; HUD renders focus, traction, morale.

(content-strings gains new keys but no spec-level behavior change, so no delta for it.)

## Impact

- `core/game.js`, `core/state.js`: new state fields, action set, focus/morale rules. **BREAKING** to the action vocabulary (`NEXT_MONTH` -> `END_MONTH`): old saves (seed+action logs) from development builds no longer replay; acceptable pre-release, no migration.
- `ui/main.js`: button layout, HUD, click routing.
- `content/strings_es.js`: new keys.
- `tests/`: new core tests (focus accounting, morale gate, decay, jitter replay); existing replay/terminal tests updated for `END_MONTH`.
- No new directories, dependencies, or build steps.

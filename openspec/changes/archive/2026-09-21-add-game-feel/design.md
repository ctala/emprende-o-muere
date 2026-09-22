# Design

## Context

The render is a single immediate-mode `draw()` triggered per dispatch. There is no frame loop; a click dispatches, draws, and stops. The CDP contracts that must keep passing: same click plan -> byte-identical FINAL frames across sessions (harnesses wait ~300 ms after the last click), frozen CLICKABLE coordinates, 0 external requests. Core purity is enforced by an import-graph test.

## Goals / Non-Goals

**Goals:**
- Numbers roll instead of jump; deltas float and fade; big moments shake
- After a fixed effect lifetime every frame equals the old static frame, so determinism contracts survive with slightly longer CDP waits
- The effect model is pure data (events in, timed effects out) and testable in Node

**Non-Goals:**
- No particles, no sound (roadmap 9c), no per-button hover states, no pausing the game for animation, no "juice" that changes perceived timing of decisions (auto-close stays 600 ms regardless of tweens)

## Decisions

**`ui/fx.js` — pure effect model + clock injection.** `effectsFromEvent(event, prevState, newState)` returns plain descriptors `{ kind: 'tween'|'floater'|'shake', from, to, at, dur, text, color }`. No Date.now inside: the module takes an injected clock; `main.js` feeds it `performance.now()` via rAF timestamps. Node tests advance a fake clock. Tween targets are always core truth, so a tween can only be late, never wrong.

**rAF loop that dies when idle.** `main.js` keeps its per-dispatch `draw()` and additionally starts `requestAnimationFrame` while the effect list is non-empty; each tick prunes expired effects and redraws; when the list empties, a final `draw()` runs the static path (identical code path to today) and the loop stops. No timer runs during idle months — battery and CDP neutrality.

**Shake = temporary page transform only.** A `shake(amount)` wraps the paper/panel drawing block in `ctx.translate(dx, dy)` computed from a fixed pseudo-random of (frame index, seeded hash of the triggering event params) — fixed tables, never `Math.random`. Hit testing reads the untranslated layout, so buttons do not move; the shake lasts <= 120 ms so a player cannot notice a visual/hit mismatch. High-impact events only: RUN_ENDED(bankrupt), ROUND_CLOSED, OFFER_WALKED.

**Floaters anchor to HUD slots, not screen-center.** Traction/morale/energy float near their bars (positions derived from the same constants `drawHud` uses), cash/runway near their mono values. Text is the signed delta from event params (already core facts), ink-red for negatives, ink for positives, drawn in mono to match ledger identity.

**Deterministic settled frame.** Every effect has dur <= 700 ms; CDP harnesses wait past that. The "final frame identical" contract is unchanged in kind — only the wait grows. A new test asserts mid-effect frames differ (animation really happened) while the settled frame equals the static render of the same state (screenshot two ways: animate then settle vs. suppress effects).

## Risks / Trade-offs

- [Animation could mask the auto-close state change] → the closing tint and month flip already complete before tweens matter; tweens are cosmetic and skip on terminal draws (shake still fires for bankrupt).
- [rAF loop adds a second render source] → loop is strictly additive: it only calls the same `draw()`; with an empty effect list nothing runs.
- [Shake perceived as input lag] → 4-frame, <= 120 ms, only three event types, and hit geometry never translates.
- [Effect spam (e.g. many floaters from month close)] → cap: at most one floater per HUD slot per dispatch, merging duplicates from the same event batch.

# Proposal

## Why

After the identity pass the game looks like a ledger but responds like a
spreadsheet: clicking BUILD_PRODUCT changes numbers with zero physical
acknowledgement. The roadmap's 9b step is the Balatro layer — the moment-to-
moment feedback that makes a turn feel like it happened. Right now the
player must read the log to learn what an action did; good game feel shows
it on the numbers themselves. It must land on top of the frozen-geometry,
fully-deterministic core without breaking either contract.

## What Changes

- Number tweens: HUD values (cash, traction, morale, energy, runway) roll
  from old to new over ~350 ms after an action resolves instead of jumping
- Floating delta texts: each action spawns small +/- lines (e.g. "+8" over
  traction, "-8" over morale) that drift up and fade over ~600 ms
- Camera shake: a short 4-frame translation of the whole page on high-
  impact events only (bankruptcy, round closed, investor walked) — never
  on routine actions, so punch keeps meaning
- Event-driven and self-terminating: effects derive from the event list of
  a dispatch (core facts only), run on a UI-side rAF loop that stops when
  idle, and every effect has a fixed duration so the settled frame after
  ~700 ms is byte-identical to today's static render (frozen-coordinates
  and cross-session determinism tests keep passing with a longer settle)
- No new dependencies, no binary assets, no randomness from `Math.random`
  (effect variation hashes off event params, so replays look identical)

## Capabilities

### New Capabilities
- `ui-feedback`: transient presentation-layer effects (tweens, floaters,
  shake) derived from core events, self-terminating, never gameplay-affecting

### Modified Capabilities
- `ui-shell`: "Canvas month display" gains the requirement that rendered
  values may animate toward their true values but the settled frame equals
  the static render, and the game remains playable during animation

## Impact

- New `ui/fx.js`: pure effect model (events in -> timed effect list out) +
  draw helpers; unit-testable in plain Node like the rest of ui/
- `ui/main.js`: owns the rAF tick (only while effects are active), applies
  tweened values to HUD drawing, shake transform around the page draw
- `ui/layout.js`: untouched (geometry stays frozen; shake is a canvas
  transform during animation only, hit regions are never moved)
- `core/`, `tests/core.test.js`: untouched
- Existing CDP harnesses: final-frame waits grow past the effect lifetime

## Status

**SUPERSEDED by `redesign-mobile-first`** (2026-09-21). This change's
design assumed the canvas shell would persist (rAF loops, ctx.translate
shake, tweens into canvas HUD slots). The shell is moving to responsive
DOM per the synthetic-panel evidence; canvas-specific game feel no longer
applies. CSS transitions cover the feel need in the new shell; a future
DOM-flavored game-feel change can be re-proposed against it. Planning
artifacts are kept for reference.

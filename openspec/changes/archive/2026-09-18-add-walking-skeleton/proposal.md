# Proposal

## Why

The project is greenfield: no code, no specs. Before any game systems (focus, cash, fundraising) can exist, we need a minimal end-to-end slice that proves the two hard constraints hold from day one: a pure deterministic core (same seed + same action sequence reproduces the exact same game) and a browser-only, dependency-free runtime (serve the folder, no build step). This change creates that walking skeleton.

## What Changes

- Add a pure game core module: `createGame(seed)` produces initial state; `applyAction(state, action)` returns a new state plus emitted semantic events, without mutating inputs.
- Add a seeded PRNG living inside game state, integer-only (mulberry32 using `Math.imul`/`>>>`), so replay is identical across engines.
- Add one action (`NEXT_MONTH`) and a 24-month game span with a terminal state at month 24.
- Add a browser UI shell: hand-written Canvas 2D rendering "Month N/24" (Spanish labels) and advancing the month on click. The UI consumes the core; the core never references DOM, `window`, `Date.now`, or `Math.random`.
- Add a narration-event contract: the core emits structured facts (template key + params); the UI renders text through a renderer interface (`render(fact) -> string`). Today only a deterministic template renderer exists; an LLM renderer can be added later behind the same interface without touching the core.
- Add player-visible text centralized in a single Spanish strings file (`content/strings_es.js`), containing only skeleton labels for now.
- Add deterministic replay tests using `node:test` (golden vectors for the PRNG; seed + action log -> identical serialized final state).

## Capabilities

### New Capabilities

- `game-core`: Pure, deterministic game state machine. Owns state shape, seeded PRNG, action application, event emission, and the 24-month run span. No DOM, no I/O, no floats, no global state.
- `ui-shell`: Browser presentation layer. Canvas 2D rendering of game snapshot, input-to-action mapping, and the narration-event renderer interface. Reads core state; never imported by the core.
- `content-strings`: Centralized player-visible Spanish text keyed by stable string IDs, consumed by the UI renderer.

### Modified Capabilities

(none — greenfield)

## Impact

- New directories: `core/`, `ui/`, `content/`, `tests/`.
- Runtime: native ES modules, static files only. No npm dependencies, no build step. Development requires any static file server (ES modules do not load over `file://`); production runtime is plain static hosting.
- Testing: `node --test` over `tests/` (core only). No test framework install.
- Out of scope (deliberately deferred): focus/action budget beyond the single noop-ish `NEXT_MONTH`, cash/runway/traction/morale/equity/reputation, events, fundraising, metaprogression/learnings, full Spanish copy.

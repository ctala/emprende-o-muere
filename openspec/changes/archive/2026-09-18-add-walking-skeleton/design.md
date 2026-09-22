# Design

## Context

Greenfield repo; see proposal.md for motivation. The hard constraints (browser-only static files, native ES modules, no build step/npm/CDN; pure deterministic integer-only core; node:test on core only; English code / Spanish copy) come from the project owner and are fixed, not open for re-litigation here.

## Goals / Non-Goals

**Goals:**
- Prove the core/UI seam works end to end (state in, click, state out, pixels change).
- Make determinism a tested property from the first commit, not retrofitted later.
- Name the two future seams now so later changes don't refactor: the event-renderer interface (LLM path) and the action log (record & replay path).

**Non-Goals:**
- No game economy, events content, fundraising, metaprogression storage (later changes).
- No LLM integration, no network code of any kind in this change.
- No localStorage usage (the skeleton has nothing worth persisting yet).

## Decisions

### Directory and module layout
```
index.html          loads ui/main.js as type="module"
core/               game.js (createGame/applyAction), rng.js, actions.js, state.js
content/            strings_es.js
ui/                 main.js (boot), renderer.js (render(event)->string)
tests/              core.test.js, rng.golden.test.js
```
Plain ES modules, relative imports with `.js` extensions. Alternative considered: single `game.js` file to keep it tiny — rejected; the core/UI boundary is the architectural promise and the layout should show it.

### Development vs "serve the folder"
Native ES modules do not load over `file://`, so local dev uses any static server (`python3 -m http.server`). Runtime deployment is plain static hosting. No build step exists in either mode; `npm install` is never needed to play. Documented in README.

### Action/state data shapes
- State is a plain frozen object: `{ seed, rngState, month, totalMonths: 24, gameOver: false }`.
- Actions are plain objects: `{ type: 'NEXT_MONTH' }`. Unknown types and post-game-over actions throw a plain `Error` — the caller must never see a mutated or half-applied state.
- Purity mechanism: shallow-spread copies (`{ ...state, month: n }`) + `Object.freeze`. No classes, no global state. A deep-freeze helper guards against accidental mutation; alternatives (immer) rejected — external dep, overkill.

### PRNG: mulberry32, integer-only
`mulberry32` implemented with `Math.imul` and `>>>` only; the next `rngState` lives in game state, never in module scope. Integers stay in the 32-bit lane, so results are bit-identical across V8/SpiderMonkey/JSC — the reason we avoid floats entirely. Alternatives: xorshift128 (fine, but bigger state in every snapshot), sfc32 (more state, no benefit here). Golden-vector tests pin the exact output sequence so a future swap is caught loudly.

### Events returned, not stored
`applyAction(state, action)` returns `{ state, events }`; events are not embedded in state. Rationale: state stays minimal and cheap to diff in replay tests; events are an output channel, which is exactly what the future LLM renderer consumes. Alternative (outbox array inside state) rejected: it grows state every turn and pollutes replay equality with text-adjacent data.

### Event contract (the LLM seam)
Event = `{ key, params }` where `key` is a stable template id (e.g. `evt.month_advanced`) and `params` are primitives. No prose in the core. `ui/renderer.js` exposes `render(event) -> string`; the only implementation today resolves `evt.*` keys to templates in `strings_es.js`. A future LLM renderer becomes a second implementation plus a fallback chain, with no core change. Record & replay note: if a future LLM renderer returns text, that text is appended to the UI-side run log (`seed + actions + renderedText`); replay plays back the stored text instead of re-calling the API. No logging code ships in this change — only the contract that makes it additive.

### Strings and template rendering
`content/strings_es.js` exports a frozen map (`month.label`, `evt.month_advanced`, ...). Templates use `{name}` placeholders filled from params; missing keys throw in dev (loud failure per spec). All numbers displayed come from core params, so what's on screen is always replay-reproducible.

### Testing
`node --test tests/` (Node 22 built-in runner, zero installs). Coverage: PRNG golden vectors; replay determinism (apply 24× NEXT_MONTH, deep-equal serialized finals); input-state immutability (serialize before, apply, compare); terminal-state rejection; event emission shape. Tests import `core/` only — the UI is exercised manually.

## Risks / Trade-offs

- [Deep-freeze on every transition costs perf] → Runs are 24 turns with tiny state; negligible. Revisit only if mid-game runs reach thousands of entities (later changes can gate freezing behind a dev flag).
- [Golden PRNG vectors lock the algorithm] → Intentional: it's a behavioral pin, not an accident. A deliberate swap updates vectors + spec in one reviewed change.
- [Event key drift between core and strings] → Keys live in core constants and the strings map; a test asserts every emittable key resolves in `strings_es.js`.
- [Canvas text differs per OS font stack] → Acceptable: we verify layout manually; determinism guarantees state, not pixels.

## Open Questions

- Final month/game-over copy beyond the skeleton label — deferred to the change that writes real Spanish copy.

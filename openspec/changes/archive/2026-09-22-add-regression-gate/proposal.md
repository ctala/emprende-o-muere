# Proposal

## Why

The owner opened the game to review and found a blank page. The unit suite was green (150/150) yet the browser was dead, because the only browser checks were ad-hoc CDP scripts kept in `/tmp` that never run automatically. Root cause of this specific incident: `ui/main.js` uses a top-level side effect (DOM wiring at import time), so it cannot be imported or exercised in Node — nothing between `node --test` (pure core/view logic) and "open the browser by hand" verifies the page actually boots, renders, and dispatches. There is no committed, runnable e2e/functional layer, so any change can ship broken UI and the tests will happily pass.

## What Changes

- Add a committed, self-contained browser verification harness under `tests/e2e/` (Node built-in test runner + CDP against a local static server and the cached Chromium headless shell): boots the page, asserts no console/page errors, asserts the DOM render contract (hero value, action rows, disabled reasons), and plays a scripted month via DOM clicks asserting core state changes (functional), plus a full run to a terminal stamp (e2e smoke).
- Add a failing-first loop (TDD discipline) for the change itself: every harness assertion is written against the current build first; the incident reproducer (page blank under `file://` / with a throwing module) becomes a permanent test.
- Expose a minimal, production-safe boot hook in `ui/main.js` (a `data-testid="booted"` marker set after wiring, and an optional `?seed=` query param for reproducible e2e runs). No new dependencies, no build step.
- Add one documented command: `npm run test:gate` (a plain `package.json` scripts entry or a `tests/gate.sh` — design decides) running unit + e2e in sequence, and README "Test" section updated so the owner's review ritual is one command, not hope.
- The gate MUST fail on: page console/pageerror events, missing render contract, click that does not change state, any load path where the page renders nothing.

## Capabilities

### New Capabilities
- `regression-gate`: committed automated verification that the built page boots, renders, and plays correctly in a real browser — the contract between "unit tests green" and "the owner can actually see the game".

### Modified Capabilities
- `ui-shell`: ADDED requirement — the shell guarantees a post-boot marker and a `?seed=` override for automated runs (small observable addition to boot behavior).

## Impact

- New: `tests/e2e/*` (harness + suites), a gate runner entry point.
- Touched: `ui/main.js` (boot marker + `?seed=` read), `README.md` (Test section), possibly a `package.json` with scripts only (no dependencies).
- Unchanged: `core/`, `content/`, game rules, playtest tooling. No CI is introduced (none exists); the gate is a local command, CI-ready later.
- Relationship to `redesign-mobile-first`: its task 3.1 (ad-hoc `playtest/verify.mjs` DOM-state checks) is superseded by this committed gate for the automated part; redesign keeps only the screenshot set for human review. The blank-page incident is the motivating repro: the gate must fail on it.
- Constraint inherited from project: zero runtime dependencies, no build step, system fonts, no network — the harness must respect that (dev-only tooling may use the already-cached Chromium and Node stdlib only).

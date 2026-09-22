# Design

## Context

The owner's review found a blank page while `node --test` reported 150/150 green. Reproduced: over `file://` the ES-module entry is CORS-blocked → nothing executes; over http the same build renders fine. The deeper gap: browser checks existed only as throwaway CDP scripts in `/tmp`, so nothing in the repo can catch a boot/render/dispatch regression. `ui/main.js` wires the whole game as import-time side effects (top-level `createGame`, listener attach, first render), so Node cannot import it at all — unit tests stop exactly where the incident lives.

Environment facts (verified): Node 22 (has global `WebSocket`), cached Chromium headless shell under `~/.cache/ms-playwright/chromium_headless_shell-1243/...`, CDP-over-WebSocket harness pattern already proven in `/tmp/opencode/*.mjs`, static serving via `python3 -m http.server`. The game is dependency-free and network-free by spec; the gate must stay dev-only tooling and cannot violate that.

## Goals / Non-Goals

**Goals:**
- One command = unit + browser layers; green means "owner can open the page and see the game"
- Deterministic: seeded runs, fixed viewport, no flake from timing (poll-with-deadline on DOM, never `sleep`-style guesses in assertions)
- Failing-first: the harness is authored against the current build, with its own boot-break scenario proven to actually fail (deliberate break injected in a temp copy) before being trusted
- Permanent reproducers for the blank-page class

**Non-Goals:**
- No CI service (no commits even exist yet; the gate is a local command, CI-ready by being one exit code)
- No npm dependencies (no Playwright/Puppeteer install; stdlib + cached browser + raw CDP)
- No visual diffing / screenshot goldens (the redesign change owns human screenshot review; pixel checks would fight the DOM redesign landing in parallel)
- No coverage tooling, no refactor of main.js into importable layers ( tempting, but the gate's whole point is validating the real boot path, side effects included)

## Decisions

1. **Raw CDP over stdlib WebSocket, not Playwright.** Playwright would add an install step to a zero-dependency repo and its own browser-download lifecycle. The pattern is already proven here (connect → `Runtime.enable`/`Page.enable`/`Log.enable` → evaluate/click). Cost: ~150 lines of tiny harness (`tests/e2e/browser.mjs`): spawn headless shell with a free `--remote-debugging-port`, fetch `/json/list`, attach, expose `evaluate(fn)`, `click(sel)`, `poll(expr)`, and collect `Log.entryAdded`/`Runtime.exceptionThrown` as failures. Alternative considered: `--dump-dom` only — rejected, no click dispatch.

2. **`node --test tests/e2e/*.test.js` as the runner, separate glob from unit tests.** Keeps the pure suite fast and DOM-free (purity spec). A helper `tests/e2e/harness.mjs` owns server + browser lifecycle: one shared server/browser per test file (module-level `before`), `after` kills both. Chromium path resolved from env `CHROME` falling back to a glob over `~/.cache/ms-playwright/chromium_headless_shell-*` picking the highest version; missing browser ⇒ clear skip-with-message (exit 0 with loud note) is rejected — spec says gate fails; chosen: **fail** with an explicit "browser not found" message so "green" never hides "never ran".

3. **Static server = `node:http` serving the repo folder (not python).** A ~30-line `tests/e2e/server.mjs` with correct `Content-Type` for `.js`/`.css` and `Directory traversal` guard; keeps the command Node-only and lets the gate pick a free port deterministically instead of assuming 8765 is free.

4. **Boot contract = `data-testid="booted"` on `<body>`.** `ui/main.js` sets `document.body.dataset.booted = '1'` as its last statement. Trivially observable by CDP without touching app internals; absence = page unwired. Alternative: a `window.__game` global — rejected, pollutes the page's global namespace for zero gain.

5. **Seed override in `ui/main.js`:** `const SEED = Number(new URLSearchParams(location.search).get('seed')) >>> 0 || DEFAULT_SEED`. Keeps default 20260918; malformed → `0 >>> 0` is falsy → default (seed 0 itself maps to the same default, acceptable — seeds are opaque). This is the only production-code change.

6. **Functional assertions read DOM text, never core internals.** E.g. month label `text` before/after Cerrar mes; hero value vs `floor(cash/burn)` computed from the same displayed cash/burn elements. This keeps the gate honest against what the owner sees, and survives internal refactors. Play script: pick seed whose fresh state enables a known action; click row → expect stat change; click end → month+1; loop to game over (bounded by max 24 months + offers) → terminal visible with stamp text.

7. **Runner entry = `package.json` with scripts only.** The repo has no package.json; adding one with `{"private": true, "scripts": {"test": "...", "gate": "node --test tests/*.test.js && node --test tests/e2e/*.test.js"}}` and zero dependencies keeps `npm run gate` portable and README-documented. Alternative `tests/gate.sh`: rejected, npm scripts are the universal entry even without deps.

8. **TDD ordering for the change itself** (the "no se ve nada" discipline): 1) write harness + boot test against a deliberately broken copy in `/tmp` (throwing module) and watch it fail; 2) unbreak, watch pass; 3) add render-contract, functional, terminal tests; 4) only then mark tasks. Every task row in tasks.md carries its verify command.

## Risks / Trade-offs

- **Headless-shell availability** is machine-local → gate fails loudly on absence (chosen over silent skip; owner's machine is the review machine).
- **CDP raw protocol drift** vs future Chromium versions: harness pins nothing (uses stable `Runtime`/`Page`/`Log` methods, ~5 calls); acceptable for a local dev gate.
- **Flake from the 600ms auto-close** and offer modals: all interaction helpers poll a predicate with a 2s deadline; the play script explicitly handles a pending offer (click decline) instead of racing it.
- **Dialog modals** are plain hidden divs here (no `<dialog>`), so click dispatch via `Input.dispatchMouseEvent` or `element.click()` — chosen: evaluate-based `el.click()` dispatches real click handlers without pointer/scroll flakiness.

## Migration / Rollback

Pure addition; rollback = delete `tests/e2e/`, the scripts entry, and revert the two `ui/main.js` lines. No data, no behavior change for players.

## Open Questions

- Whether redesign-mobile-first's `ui/main.js` rewrite will keep the `SEED`/wiring shape (assumed yes — its tasks.md says wiring stays in main.js; if it lands first, this change's tasks 2.x rebase onto the DOM-shell main.js, same two hooks).

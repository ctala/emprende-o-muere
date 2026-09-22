# Tasks

## 0. Failing first (prove the gate can catch the incident)

- [x] 0.1 Copy the current build to `/tmp/opencode/gate-break/`, inject a throwing statement into its `ui/main.js`, and write `tests/e2e/browser.mjs` (spawn cached headless shell on a free port, attach CDP, collect `Log.entryAdded`+`Runtime.exceptionThrown`, `evaluate`/`poll` helpers, guaranteed teardown of browser) plus `tests/e2e/boot.test.js` asserting boot marker + populated action list. Verify: `node --test tests/e2e/boot.test.js` FAILS against the broken copy (blank page caught) and PASSES against the repo build

- [x] 0.2 Add `tests/e2e/server.mjs`: `node:http` static server for the repo root (correct `.js`/`.css` Content-Type, path-traversal guard, free port), wired into the test lifecycle so one server+browser is shared per suite and both are killed in `after` on pass and fail. Verify: suite green; after a run, no `chrome-headless-shell` or server process spawned by the gate survives (`pgrep -f remote-debugging-port` empty)

## 1. Boot contract in production code (minimal)

- [x] 1.1 `ui/main.js`: set `document.body.dataset.booted = '1'` as the last wiring statement, and read `?seed=` overriding the default SEED (malformed → default unchanged). Verify: `node --test tests/e2e/boot.test.js` green; new case asserts same `?seed=` twice renders identical initial state and default load still renders (no regression for players)

## 2. Functional and terminal layers

- [x] 2.1 `tests/e2e/functional.test.js` (seeded): enabled action click changes a displayed stat; "Cerrar mes" click advances the month label; a hire click raises displayed burn; every disabled row carries non-empty `.row-reason` text. All predicates polled with deadline, no fixed sleeps; pending offer handled by clicking decline. Verify: `node --test tests/e2e/functional.test.js` green and still green twice in a row (determinism)

- [x] 2.2 `tests/e2e/smoke.test.js`: drive a seeded run through the DOM to a terminal outcome, assert the terminal sheet is visible with non-empty stamp text (game-over reproducible within a bounded 24-month loop). Verify: green; total e2e runtime stays under ~30s

## 3. Gate + docs

- [x] 3.1 Add `package.json` (`private: true`, zero dependencies, scripts `test` = unit glob, `gate` = unit then e2e) and update README "Test" section to one review command. Verify: `npm run gate` exits 0 on the clean build; on the `/tmp` broken copy it exits non-zero naming the boot failure

- [x] 3.2 file:// incident reproducer: add `tests/e2e/fileload.test.js` loading `file://.../index.html` and asserting the module CORS block is diagnosed (module never executes → boot marker absent → treated as unsupported load mode, not as a render pass). Verify: scenario green; `node --test 'tests/*.test.js'` pure suite untouched and green (150+ pass)

- [x] 3.3 Cross-change rebase check: if `redesign-mobile-first` tasks 2.x/3.1 landed first, re-run the whole gate against the DOM shell and confirm its `playtest/verify.mjs` DOM-state checks are covered here (if duplicated, delete them from that script, keeping screenshots). Verify: `npm run gate` green on whatever the merged shell is; README dev-log entry for the blank-page incident + the gate command

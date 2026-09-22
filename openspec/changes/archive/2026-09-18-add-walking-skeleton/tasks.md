# Tasks

## 1. Project scaffold

- [x] 1.1 Create `core/`, `ui/`, `content/`, `tests/` and `index.html` loading `ui/main.js` as `type="module"`; verify with a static server (`python3 -m http.server`) that the page loads with no console errors
- [x] 1.2 Add README section documenting how to run (static server for dev, plain static hosting for deploy) and how to test (`node --test tests/`); verify the commands exist as written

## 2. Core: PRNG

- [x] 2.1 Implement `core/rng.js` mulberry32 (integer ops only, `Math.imul`/`>>>`, state passed in/out) and verify `tests/rng.golden.test.js` with `node --test` matches recorded golden vectors for one fixed seed and 10 draws

## 3. Core: state and actions

- [x] 3.1 Implement `core/state.js` (`createGame(seed)` with month 1, `totalMonths` 24, `gameOver` false; deep-freeze helper) and verify `node --test` shows identical serialization for two `createGame(12345)` calls and differing rngState for a different seed
- [x] 3.2 Implement `core/game.js` `applyAction(state, action)` for `NEXT_MONTH` returning `{ state, events }` via shallow-spread copies, emitting `{ key: 'evt.month_advanced', params: { month } }`; verify `node --test` shows month N -> N+1 and one event per advance
- [x] 3.3 Implement terminal behavior: `NEXT_MONTH` at month 24 sets `gameOver`, and on a game-over state it throws leaving state unchanged; unknown action types throw; verify with `node --test` rejection scenarios
- [x] 3.4 Add replay determinism test: seed + 24× `NEXT_MONTH` applied twice, finals byte-identical; add input-immutability test: state serialized before `applyAction` still matches after; verify `node --test` passes both
- [x] 3.5 Verify core purity: a Node script imports every `core/` module and asserts no `window`/`document` references and core runs headless; run it as part of `node --test`

## 4. Content

- [x] 4.1 Implement `content/strings_es.js` (frozen map with `month.label`, `evt.month_advanced`, and minimal UI labels in neutral Spanish, `{name}` placeholder support, missing key throws); verify a lookup of a defined key returns text and an undefined key throws

## 5. UI shell

- [x] 5.1 Implement `ui/renderer.js` `render(event) -> string` resolving `evt.*` keys through `strings_es.js` templates; verify same event rendered twice gives identical output and every core-emittable event key resolves (asserted in the core test that imports strings)
- [x] 5.2 Implement `ui/main.js`: boot game with a fixed seed, hand-drawn Canvas 2D month display (system fonts, no assets), click -> `applyAction` -> re-render, clicks no-op after game over; verify manually: month 1/24 renders, clicks advance to 24/24 and terminal state is visibly flagged, further clicks do nothing

## 6. Integration check

- [x] 6.1 Full manual pass from a static server with devtools offline mode: page loads, plays a full 24-month run, no network requests fired, `node --test` green; record any font/layout differences per OS in the PR description

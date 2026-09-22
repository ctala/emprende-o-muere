# Tasks

## 1. Core: tier on offer event

- [x] 1.1 Have `priceOffer` return the pricing tier (`drained` / `fair` / `hot`) and pass it through the offer-made event params in core/game.js. Verify: unit test — pitch at energy 40 vs 100 yields tier drained vs hot, offer numbers unchanged, existing vectors still pass

## 2. Learnings module + tests

- [x] 2.1 Create `ui/learnings.js`: `LEARNING_IDS` (first_bankrupt, first_round, drained_deal, investor_walked, offer_expired, first_hire, broke_while_funded, lost_control_survivor), pure `matchLearnings(events, unlockedIds)` returning newly unlocked ids (idempotent), and `loadUnlocked(adapter)` / `saveUnlocked(adapter, ids)` with corrupt-payload fallback to empty. Verify: `tests/learnings.test.js` with one trigger vector per id using real EVENT_KEYS, double-trigger idempotency, and fake-storage round-trip — runs under `node --test` with no DOM

## 3. Content + screens

- [x] 3.1 Add the eight Spanish learning texts + library labels (title, ??? placeholder, button) to content/strings_es.js. Verify the every-event-key-resolves lookup test pattern extended to learning keys passes
- [x] 3.2 Library screen: hit region beside the title in ui/layout.js + modal render in ui/main.js (discovered rows show text, others "???"), open blocks all dispatch, button toggles closed. Verify: layout test covers the new region; CDP shows library with a discovered entry and clicks on BUILD while open are inert

## 4. End-to-end verification

- [x] 4.1 CDP: run bankrupts -> reload page -> library still shows first_bankrupt discovered (real localStorage); toast line appears in the log at unlock moment; zero console errors, zero external requests. Confirm core import-graph test still proves no core import of learnings. README dev log entry for the decision-A structural guarantee

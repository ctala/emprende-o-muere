# Proposal

## Why

The game teaches through pain, but each new run starts amnesiac: the player who learned "raised pitches sell cheap" relives the same disaster with no artifact of the lesson. Learnings close the loop between runs — a persistent library of discoveries the player earned, revealed by events that already happen. Decision A from the design phase: learnings reveal information, grant no perks; this is enforced structurally by living entirely in the UI layer, which the core never imports.

## What Changes

- New `ui/learnings.js` module (UI-only): watches the event stream of every run and unlocks learning entries when their trigger fires; unlocked ids persist in `localStorage` under one namespaced key
- Library screen (own `ui/` module per the roadmap rule): `BIBLIOTECA` button on the title area shows all known learnings with discovered/undiscovered state ("???" for unseen), in Spanish; no gameplay effect anywhere
- Eight discoveries, each a pure (events, state) -> unlock matcher: first bankruptcy, first accepted round, drained pitch accepted, investor walked, offer expired, first hire, bankrupt after a funded month, survived while losing control
- Minimal core addition: `evt.offer_made` gains an informational `tier` param (`'drained' | 'fair' | 'hot'`) so the drained-deal lesson is attributed precisely without the UI recomputing pricing — same pattern as the existing `action`/`reason` string params
- Beyond that param, core is unchanged: no new action, no state field, no new event; the replay contract is untouched because learnings only reads the reducer's outputs
- Storage accessed through an injected adapter so the matcher tests run under plain Node (no DOM); the browser uses real localStorage

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `game-core`: "Semantic event emission" — `evt.offer_made` gains an informational `tier` param (the pricing tier of the offer) so downstream text/learning layers do not recompute pricing
- `ui-shell`: gains run-learning observation (event-stream triggers -> unlock + persistence via an injected storage adapter) and the library screen rendering known/unknown entries from the content module

## Impact

- `core/game.js`: `tier` param on the offer-made event (derived from the same tier branch that priced the offer)
- `ui/learnings.js` (new): pure `matchLearnings(events, unlocked)` + storage read/write through adapter
- `ui/library.js` (new): library screen render + its own hit regions via layout
- `ui/main.js`: toast on unlock, library toggle button, storage adapter wiring
- `content/strings_es.js`: the eight learning texts + library screen labels
- `tests/learnings.test.js` (new): trigger vectors (each discovery unlocks on its pattern and only once), persistence round-trip with a fake storage, no-perk guard (assert core never imports learnings — import-graph test)
- No changes to core/, state serialization, or existing tests

# Proposal

## Why

Closing the month currently always requires an explicit click on "Cerrar mes", even after both focus points are spent — a redundant step every one of the 24 turns, and it makes the action economy feel like paperwork. Spending the last focus point should visibly tip the month over, so the game keeps its pace and the click that remains (closing early with focus left) keeps meaning.

## What Changes

- After the UI dispatches an action that leaves the game with focus 0 (and not game-over), it automatically dispatches `END_MONTH` after a short readability delay (~600 ms), so the player can read the action outcome before the decay event appears.
- The "Cerrar mes" button remains and still works manually, including with focus left (closing early stays legal).
- Core is untouched: the auto-dispatch happens in the UI, so the run log (seed + actions) still contains the explicit `END_MONTH` entry and replays are unaffected.
- A brief visual cue during the delay (button area showing the month is closing) communicates the auto-transition.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `ui-shell`: "Click advances the month" gains the auto-close rule (focus spent -> delayed automatic END_MONTH); manual early close preserved.

## Impact

- `ui/main.js`: post-action focus check + one-shot timer + disabled-during-timer input guard.
- No core, content (strings reuse `action.END_MONTH`), tests-of-core, or state changes.
- UI behavior verified via the existing headless CDP harness.

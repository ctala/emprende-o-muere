# Spec Delta

## MODIFIED Requirements

### Requirement: Click advances the month
Canvas clicks SHALL be routed by hit region: clicking one of the four action buttons dispatches that core action and re-renders; clicking the END_MONTH button dispatches END_MONTH and re-renders; clicks on empty canvas do nothing. Buttons whose action the player cannot currently afford (focus 0) or after game-over SHALL be drawn disabled and SHALL dispatch nothing.

After a dispatched action leaves the game with focus 0 and not game-over, the UI SHALL automatically dispatch END_MONTH after a short fixed delay (about 600 ms) so the player can read the action outcome first; during that delay player input SHALL be ignored and the closing state SHALL be visually indicated. The manual END_MONTH button SHALL remain available at any focus level, so closing a month early with focus left stays possible, and the auto-dispatch SHALL NOT prevent or replace that manual path. Auto-dispatched END_MONTH SHALL be dispatched to the core exactly like a click, keeping the run log and replays unchanged.

#### Scenario: Click advances and re-renders
- **WHEN** the player clicks the END_MONTH button at month N with a non-game-over state
- **THEN** the canvas re-renders showing month N+1 with focus reset

#### Scenario: Action button dispatches its action
- **WHEN** the player clicks the BUILD_PRODUCT button with focus > 0
- **THEN** the canvas re-renders reflecting the new traction, morale and focus

#### Scenario: End-month button advances the run
- **WHEN** the player clicks the END_MONTH button
- **THEN** the canvas re-renders showing the next month with focus back to 2

#### Scenario: Empty clicks do nothing
- **WHEN** the player clicks outside all buttons
- **THEN** the displayed state does not change

#### Scenario: Clicks ignored after game over
- **WHEN** the player clicks any button after the run reached month 24 and ended
- **THEN** the displayed state does not change

#### Scenario: Spending the last focus closes the month automatically
- **WHEN** the player dispatches an action that brings focus to 0 and the game is not over
- **THEN** after roughly 600 ms the month closes on its own, showing month N+1 with focus back to 2

#### Scenario: Input during the auto-close delay is ignored
- **WHEN** the player clicks any button during the auto-close delay
- **THEN** the displayed state changes only as a result of the automatic END_MONTH, with no extra action applied

#### Scenario: Early manual close still works
- **WHEN** the player clicks END_MONTH with focus remaining
- **THEN** the month closes immediately and the focus left is not granted

# Spec Delta

## MODIFIED Requirements

### Requirement: Click advances the month
Canvas clicks SHALL be routed by hit region: clicking one of the five action buttons dispatches that core action and re-renders; clicking the END_MONTH button dispatches END_MONTH and re-renders; clicks on empty canvas do nothing. Buttons whose action the player cannot currently afford (focus 0, or for CLOSE_CLIENT traction < 10) or after game-over SHALL be drawn disabled and SHALL dispatch nothing.

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

#### Scenario: Close-client button disabled without traction
- **WHEN** traction is below the CLOSE_CLIENT cost
- **THEN** the CLOSE_CLIENT button is drawn disabled and clicking it changes nothing

### Requirement: HUD shows focus, traction and morale
The UI SHALL render, from core state only, the remaining focus for the month, the traction value, the team morale value, the cash balance in thousands of dollars, and the runway in months (`floor(cash / burn)` of the active profile), using labels from the centralized strings content. Morale SHALL be visually differentiated by tier (high/medium/low) so the effectiveness gate is perceivable without reading numbers. Cash at or below one burn SHALL be visually alarming (e.g., red).

#### Scenario: HUD reflects state after actions
- **WHEN** the player spends both focus points on actions
- **THEN** the HUD shows focus 0 and updated traction/morale values

#### Scenario: HUD resets on new month
- **WHEN** END_MONTH is applied
- **THEN** the HUD shows focus 2 again

#### Scenario: Runway follows cash
- **WHEN** cash is 45 ($k) and burn is 15
- **THEN** the HUD shows runway 3 months

## ADDED Requirements

### Requirement: Terminal screen states the reason
On game-over the UI SHALL distinguish, from the core terminal reason only, at least the `survived` (reached month 24) and `bankrupt` endings, with distinct copy from the strings content.

#### Scenario: Bankruptcy shown
- **WHEN** the run ends with reason `bankrupt`
- **THEN** the canvas shows the bankruptcy message instead of the survive message

#### Scenario: Survival shown
- **WHEN** the run ends with reason `survived`
- **THEN** the canvas shows the survival message

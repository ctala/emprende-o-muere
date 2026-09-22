# Spec Delta

## MODIFIED Requirements

### Requirement: Click advances the month
Canvas clicks SHALL be routed by hit region: clicking one of the four action buttons dispatches that core action and re-renders; clicking the END_MONTH button dispatches END_MONTH and re-renders; clicks on empty canvas do nothing. Buttons whose action the player cannot currently afford (focus 0) or after game-over SHALL be drawn disabled and SHALL dispatch nothing.

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

## ADDED Requirements

### Requirement: HUD shows focus, traction and morale
The UI SHALL render, from core state only, the remaining focus for the month, the traction value, and the team morale value, using labels from the centralized strings content. Morale SHALL be visually differentiated by tier (high/medium/low) so the effectiveness gate is perceivable without reading numbers.

#### Scenario: HUD reflects state after actions
- **WHEN** the player spends both focus points on actions
- **THEN** the HUD shows focus 0 and updated traction/morale values

#### Scenario: HUD resets on new month
- **WHEN** END_MONTH is applied
- **THEN** the HUD shows focus 2 again

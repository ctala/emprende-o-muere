# Spec Delta

## ADDED Requirements

### Requirement: Focus budget
The game SHALL give the player exactly 2 focus at the start of each month. Each of the four player actions (BUILD_PRODUCT, TALK_TO_CUSTOMERS, PUBLISH_CONTENT, REST) costs 1 focus. Actions SHALL be rejected with no state change when focus is 0. Focus SHALL NOT carry over between months.

#### Scenario: Action costs one focus
- **WHEN** any player action is applied with focus > 0
- **THEN** the new state has focus decreased by 1

#### Scenario: Action rejected without focus
- **WHEN** a player action is applied with focus = 0
- **THEN** it is rejected and the state is unchanged

#### Scenario: Focus resets each month
- **WHEN** END_MONTH is applied
- **THEN** the new state has focus = 2

### Requirement: Monthly actions with morale-gated traction
BUILD_PRODUCT, TALK_TO_CUSTOMERS and PUBLISH_CONTENT SHALL increase `traction` by an integer base yield plus PRNG jitter in [-3, +3], scaled by the current morale tier, and SHALL decrease `teamMorale` by a fixed integer. The morale tier SHALL be an integer mapping of `teamMorale` (clamped 0..100) with three bands — high yields 100% of base+jitter, medium yields exactly half via integer truncation, low yields 0 — with the band thresholds fixed as named constants in the core. REST SHALL increase `teamMorale` by a fixed integer and SHALL NOT change traction. All traction and morale values SHALL be integers, clamped to [0, 100] for morale.

#### Scenario: Labor action raises traction and costs morale
- **WHEN** TALK_TO_CUSTOMERS is applied at focus 2 with high morale
- **THEN** traction increases by base + jitter and teamMorale decreases by the action cost

#### Scenario: Low morale nullifies labor
- **WHEN** a labor action is applied while teamMorale is in the low band
- **THEN** traction does not change and morale still decreases

#### Scenario: Rest recovers morale
- **WHEN** REST is applied
- **THEN** teamMorale increases by the fixed rest amount (up to the 100 clamp) and traction is unchanged

#### Scenario: Every action draws PRNG exactly when jitter applies
- **WHEN** the same action is applied twice to identical states
- **THEN** both produce identical traction values and rngState values

### Requirement: End of month
`END_MONTH` SHALL be the only action that advances the month. It SHALL cost no focus, apply a fixed morale decay with PRNG jitter at the start of the transition, reset focus to 2, and emit a month-advance event. END_MONTH remains valid at month 24 with the existing terminal behavior. `NEXT_MONTH` SHALL no longer exist as an action.

#### Scenario: End of month decays morale and resets focus
- **WHEN** END_MONTH is applied mid-run
- **THEN** month increases by 1, focus is 2, and teamMorale decreased by the fixed decay plus jitter (clamped to 0)

#### Scenario: Stale NEXT_MONTH is rejected
- **WHEN** an action of type NEXT_MONTH is applied to any state
- **THEN** it throws as an unknown action and the state is unchanged

## MODIFIED Requirements

### Requirement: Twenty-four month run span
The game SHALL start at month 1 and advance one month per `END_MONTH` action. After `END_MONTH` at month 24, the run SHALL be in a terminal state in which any further action (including `END_MONTH`) is rejected without changing state.

#### Scenario: Month advances one at a time
- **WHEN** `END_MONTH` is applied at month N (N < 24)
- **THEN** the new state has month N+1

#### Scenario: Run ends after month 24
- **WHEN** `END_MONTH` is applied at month 24
- **THEN** the resulting state is flagged as game-over

#### Scenario: Action after game-over is rejected
- **WHEN** any action is applied to a game-over state
- **THEN** it is rejected and the state is unchanged

### Requirement: Semantic event emission
Each state transition SHALL return an ordered list of structured events, each being a plain object with a stable template key and integer/string params. Events SHALL contain no player-visible prose and no random-looking or opaque values that the UI must pattern-match beyond key and params. Each player action SHALL emit at least one event describing its outcome (which action, and the integer deltas applied).

#### Scenario: Month advance emits an event
- **WHEN** `END_MONTH` is applied successfully
- **THEN** the returned events include at least one event with a month-advance template key carrying the new month number

#### Scenario: Action outcome is reported as facts
- **WHEN** BUILD_PRODUCT is applied
- **THEN** the returned events include an action-outcome event whose params carry the integer traction delta and morale delta actually applied

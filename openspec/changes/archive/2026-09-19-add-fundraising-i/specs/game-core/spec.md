# Spec Delta

## ADDED Requirements

### Requirement: Fundraising state fields
The core state SHALL additionally carry `founderEnergy` (integer 0..100, initial 100), `offer` (null or a frozen term-sheet object), `pitchCooldown` (integer months, initial 0), `founderPctBps` (initial 10000), and `investors` (frozen empty list). Game creation, replay, and freeze guarantees SHALL treat these fields like existing state fields.

#### Scenario: New game carries fresh fundraising fields
- **WHEN** a game is created
- **THEN** founderEnergy is 100, offer is null, pitchCooldown is 0, founderPctBps is 10000, and investors is empty

#### Scenario: Replayed run reproduces every offer decision
- **WHEN** a run log containing PITCH/ACCEPT_ROUND actions is replayed from its seed
- **THEN** the final state's cash, founderPctBps, and investors match the original run exactly

## MODIFIED Requirements

### Requirement: Focus budget
The game SHALL give the player exactly 2 focus at the start of each month. Each of the seven focus actions (BUILD_PRODUCT, TALK_TO_CUSTOMERS, PUBLISH_CONTENT, REST, CLOSE_CLIENT, HIRE, PITCH) costs 1 focus. Actions SHALL be rejected with no state change when focus is 0. Focus SHALL NOT carry over between months. ACCEPT_ROUND and DECLINE_ROUND SHALL cost no focus and SHALL remain dispatchable at focus 0.

#### Scenario: Action costs one focus
- **WHEN** any player action is applied with focus > 0
- **THEN** the new state has focus decreased by 1

#### Scenario: Action rejected without focus
- **WHEN** a player action is applied with focus = 0
- **THEN** it is rejected and the state is unchanged

#### Scenario: Focus resets each month
- **WHEN** END_MONTH is applied
- **THEN** the new state has focus = 2

#### Scenario: Offer decision costs no focus
- **WHEN** ACCEPT_ROUND or DECLINE_ROUND is applied with focus 0
- **THEN** it is applied and focus stays 0

### Requirement: End of month
`END_MONTH` SHALL be the only action that advances the month. It SHALL cost no focus, apply a fixed morale decay with PRNG jitter at the start of the transition, then run the month-end cash flow, reset focus to 2, regenerate founder energy by +10 (clamped to 100), decrement pitch cooldown toward 0, and expire a pending undecided offer (set offer to null without cash change or cooldown). It SHALL emit events for decay, collections, burn, month advance (or terminal reason). END_MONTH remains valid at month 24 with terminal behavior. `NEXT_MONTH` SHALL no longer exist as an action.

#### Scenario: End of month decays morale and resets focus
- **WHEN** END_MONTH is applied mid-run
- **THEN** month increases by 1, focus is 2, and teamMorale decreased by the fixed decay plus jitter (clamped to 0)

#### Scenario: Stale NEXT_MONTH is rejected
- **WHEN** an action of type NEXT_MONTH is applied to any state
- **THEN** it throws as an unknown action and the state is unchanged

#### Scenario: End of month ticks energy and cooldown
- **WHEN** END_MONTH is applied at founderEnergy 88 and pitchCooldown 2
- **THEN** founderEnergy is 98 and pitchCooldown is 1

#### Scenario: Pending offer expires silently
- **WHEN** END_MONTH is applied while an offer is pending
- **THEN** the returned state has offer null and cash shows no round money

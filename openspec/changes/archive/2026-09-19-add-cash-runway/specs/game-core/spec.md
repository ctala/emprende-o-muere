# Spec Delta

## ADDED Requirements

### Requirement: Vertical profile
The core SHALL read cash-related numbers from a named vertical profile table (`VERTICALS`), and every run SHALL use exactly one active profile. The `b2b_saas` profile SHALL define starting cash 120 ($k), monthly burn 15 ($k), invoice delay 3 months, and deal pricing `dealMin + dealTen * floor(traction / 10)` with `dealMin` 20 and `dealTen` 10 ($k). Adding a future vertical SHALL be a new table row plus choosing it at game start, without new rules code.

#### Scenario: Deal price scales with traction
- **WHEN** CLOSE_CLIENT is applied with traction 37 under b2b_saas
- **THEN** the signed invoice pays 20 + 10*3 = 50 ($k)

#### Scenario: Profile values come from the table
- **WHEN** a run starts
- **THEN** initial cash equals the active profile's `startCashK`

### Requirement: Closing clients
`CLOSE_CLIENT` SHALL be a 5th focus action costing 1 focus and exactly 10 traction. It SHALL be rejected without state change when focus is 0 or traction < 10. On success it SHALL create one invoice of the profile deal price (integer $k) due at month `currentMonth + delay`, and SHALL NOT change cash or draw from the PRNG.

#### Scenario: Client signs with invoice due in 3 months
- **WHEN** CLOSE_CLIENT is applied at month 2 with traction 30 and focus > 0
- **THEN** traction decreases by 10, an invoice for the priced amount exists with dueMonth 5, and cash is unchanged

#### Scenario: Insufficient traction is rejected
- **WHEN** CLOSE_CLIENT is applied with traction 9
- **THEN** it is rejected and the state is unchanged

#### Scenario: No PRNG draw for pricing
- **WHEN** CLOSE_CLIENT is applied
- **THEN** rngState is unchanged

### Requirement: Cash flow at month end
At each `END_MONTH`, after morale decay, the core SHALL: collect every invoice whose dueMonth equals the new month (adding its amount to cash, removing it), then subtract the profile burn, then evaluate bankruptcy. Events SHALL report collected total, burn paid, and resulting cash as integer $k.

#### Scenario: Invoice pays on its due month
- **WHEN** an invoice due month 5 exists and END_MONTH transitions the game to month 5
- **THEN** cash increases by the invoice amount and the invoice no longer exists

#### Scenario: Salaries always subtract
- **WHEN** END_MONTH is applied and no invoices are due
- **THEN** cash decreases by the profile burn amount

### Requirement: Bankruptcy ends the run
If after the month-end cash flow cash is negative, the run SHALL be terminal with a bankruptcy reason distinct from the month-24 reason. Cash reaching exactly 0 SHALL NOT end the run.

#### Scenario: Negative cash bankrupts
- **WHEN** end-of-month cash would be -5
- **THEN** the state is gameOver with reason `bankrupt`

#### Scenario: Zero cash survives
- **WHEN** end-of-month cash is exactly 0
- **THEN** the run continues and is not gameOver

## MODIFIED Requirements

### Requirement: Twenty-four month run span
The game SHALL start at month 1 and advance one month per `END_MONTH` action. The run SHALL be in a terminal state when either `END_MONTH` completes month 24 (reason `survived`, cash >= 0) or end-of-month cash goes negative (reason `bankrupt`). In a terminal state any further action (including `END_MONTH`) is rejected without changing state.

#### Scenario: Month advances one at a time
- **WHEN** `END_MONTH` is applied at month N (N < 24)
- **THEN** the new state has month N+1

#### Scenario: Run ends after month 24
- **WHEN** `END_MONTH` is applied at month 24 with cash >= 0
- **THEN** the resulting state is flagged as game-over with reason `survived`

#### Scenario: Run ends early by bankruptcy
- **WHEN** cash goes negative at any month
- **THEN** the run is terminal with reason `bankrupt` and the month stays as it was

#### Scenario: Action after game-over is rejected
- **WHEN** any action is applied to a game-over state
- **THEN** it is rejected and the state is unchanged

### Requirement: Focus budget
The game SHALL give the player exactly 2 focus at the start of each month. Each of the five player actions (BUILD_PRODUCT, TALK_TO_CUSTOMERS, PUBLISH_CONTENT, REST, CLOSE_CLIENT) costs 1 focus. Actions SHALL be rejected with no state change when focus is 0. Focus SHALL NOT carry over between months.

#### Scenario: Action costs one focus
- **WHEN** any player action is applied with focus > 0
- **THEN** the new state has focus decreased by 1

#### Scenario: Action rejected without focus
- **WHEN** a player action is applied with focus = 0
- **THEN** it is rejected and the state is unchanged

#### Scenario: Focus resets each month
- **WHEN** END_MONTH is applied
- **THEN** the new state has focus = 2

### Requirement: End of month
`END_MONTH` SHALL be the only action that advances the month. It SHALL cost no focus, apply a fixed morale decay with PRNG jitter at the start of the transition, then run the month-end cash flow, reset focus to 2, and emit events for decay, collections, burn, month advance (or terminal reason). END_MONTH remains valid at month 24 with terminal behavior. `NEXT_MONTH` SHALL no longer exist as an action.

#### Scenario: End of month decays morale and resets focus
- **WHEN** END_MONTH is applied mid-run
- **THEN** month increases by 1, focus is 2, and teamMorale decreased by the fixed decay plus jitter (clamped to 0)

#### Scenario: Stale NEXT_MONTH is rejected
- **WHEN** an action of type NEXT_MONTH is applied to any state
- **THEN** it throws as an unknown action and the state is unchanged

# Spec Delta

## MODIFIED Requirements

### Requirement: Twenty-four month run span
The game SHALL start at month 1 and advance one month per `END_MONTH` action. The run SHALL be in a terminal state when either `END_MONTH` completes month 24 (reason `survived`, cash >= 0) or end-of-month cash goes negative (reason `bankrupt`). In a terminal state any further action (including `END_MONTH`) is rejected without changing state.

On a `survived` terminal the core SHALL compute a settlement from the final state with integer-only math and no PRNG draw: `valuationK = 150 + 10 * traction`; `payoutK = trunc(founderPctBps * valuationK / 10000)`; the founder keeps control while `founderPctBps >= 5000`, and control lets them also take the company cash (`cashOutK = control ? cashK : 0`), so `personalK = payoutK + cashOutK`. The integers `valuationK`, `payoutK`, `cashOutK`, `personalK` and `founderPctBps` SHALL ride on the run-ended event params alongside `month` and `reason`. On a `bankrupt` terminal they SHALL NOT be computed or emitted.

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

#### Scenario: Full ownership settlement takes everything
- **WHEN** a survived run ends at traction 20, cash 300, founderPctBps 10000
- **THEN** valuationK is 350, payoutK is 350, the founder had control, and personalK is 650

#### Scenario: Diluted founder loses the cash-out
- **WHEN** a survived run ends at traction 20, cash 1000, founderPctBps 4900
- **THEN** payoutK is trunc(4900 * 350 / 10000) = 171 and personalK is 171 with no cash-out

#### Scenario: Exactly half is control
- **WHEN** a survived run ends with founderPctBps 5000
- **THEN** the settlement counts as control and includes the company cash

#### Scenario: Bankruptcy settles nothing
- **WHEN** a run ends with reason `bankrupt`
- **THEN** the run-ended event carries no settlement params

#### Scenario: Settlement is deterministic in replay
- **WHEN** a survived run is replayed from its seed
- **THEN** the run-ended settlement params are identical to the original run

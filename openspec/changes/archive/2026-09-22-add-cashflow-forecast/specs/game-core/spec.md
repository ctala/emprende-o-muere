# Spec Delta

## ADDED Requirements

### Requirement: Cash-flow forecast is a pure derivation
The core SHALL expose a pure derivation of the team-engine cash projection from a state, without PRNG draws, mutation, or new state fields (same pattern as the exit settlement). For each month from the next up to the run's last month, it SHALL apply the deterministic team engines in their month-end order — pipeline production, sales auto-close (same gates: autoClose granted, MVP present, traction covering the close cost), invoice collections (dueMonth <= newMonth), then effective burn — and report per month: the integer $k arriving (collections only; a team-closed deal arrives on its due month, not its signing month), the integer $k leaving (effective burn), and the resulting cash in integer $k. It SHALL mark the projected bankruptcy month (the first month whose projected cash is negative) and stop projecting there, and it SHALL project a survived horizon (no bankruptcy month) when the horizon completes non-negative. The derivation SHALL depend only on the state passed in, be pure-function testable in plain Node, and repeat byte-identically for the same input.

#### Scenario: Idle projection is exact for the no-input scenario
- **WHEN** the forecast of a state with VENTAS hired, MVP built, and one invoice due month 5 is walked month by month
- **THEN** each month's cash equals applying END_MONTH repeatedly with only END_MONTH actions from that state (same collections, team closes, and burn, same order)

#### Scenario: A team deal booked in the window arrives on its due month
- **WHEN** the projected months include a month where the team auto-closes and a later month where that invoice comes due
- **THEN** the signing month shows the deal in no cash line and the due month counts its amount as arriving

#### Scenario: Bankruptcy is projected and the horizon stops
- **WHEN** the projected cash would go negative in month 9 of a horizon running to 24
- **THEN** the derivation names 9 as the projected bankruptcy month and reports no months beyond it

#### Scenario: The forecast itself draws nothing and changes nothing
- **WHEN** the forecast derivation is applied to a frozen state
- **THEN** the state serializes identically afterwards, rngState is untouched, and calling the derivation twice returns identical output

#### Scenario: No team still projects
- **WHEN** the forecast of a state with an empty team and no invoices is walked
- **THEN** every month shows arrivals 0, departures equal to profile burn, and the cash line hits bankruptcy at the same month the idle game would

### Requirement: Burn is decomposable into named parts
The core SHALL expose the effective monthly burn as an ordered integer decomposition — the vertical base burn plus one named part per team role's salary — that always sums to the same total the existing burn derivation returns, with no PRNG and no state change.

#### Scenario: Parts sum to the effective burn
- **WHEN** the burn decomposition is requested for a team of VENTAS and CTO
- **THEN** it reports the base burn, one part per role with that role's salary, and the total equals the existing effective burn function exactly

#### Scenario: Empty team is just the base
- **WHEN** the burn decomposition is requested for an empty team
- **THEN** it reports exactly one part, the vertical base

### Requirement: Signed contracts count is derivable
The core SHALL present the count of active signed client contracts (unpaid invoices) as a derived integer so presentation layers can name clients separately from leads without adding state fields.

#### Scenario: Contracts count follows invoices
- **WHEN** three invoices exist and none is paid
- **THEN** the active contracts count is 3, and after one collects it is 2

## MODIFIED Requirements

### Requirement: Fundraising state fields
The core state SHALL additionally carry `founderEnergy` (integer 0..100, initial 100), `offer` (null or a frozen term-sheet object), `pitchCooldown` (integer months, initial 0), `founderPctBps` (initial 10000), and `investors` (frozen empty list). Game creation, replay, and freeze guarantees SHALL treat these fields like existing state fields. Forecasts, burn decompositions, and contract counts SHALL be derivations over existing fields, never new state fields.

#### Scenario: New game carries fresh fundraising fields
- **WHEN** a game is created
- **THEN** founderEnergy is 100, offer is null, pitchCooldown is 0, founderPctBps is 10000, and investors is empty

#### Scenario: Replayed run reproduces every offer decision
- **WHEN** a run log containing PITCH/ACCEPT_ROUND actions is replayed from its seed
- **THEN** the final state's cash, founderPctBps, and investors match the original run exactly

#### Scenario: Forecasts add no state fields
- **WHEN** a state is serialized before and after any derivation call
- **THEN** the serialization is identical and contains no projection field

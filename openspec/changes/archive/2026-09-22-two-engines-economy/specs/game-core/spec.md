# Spec Delta

## ADDED Requirements

### Requirement: Product MVP gates client signing
The core state SHALL carry `mvpBuilds` (integer >= 0, initial 0), incremented by exactly 1 every time BUILD_PRODUCT is successfully applied, regardless of morale tier. Client signing — both the founder's manual CLOSE_CLIENT and the team's auto-close — SHALL be rejected/blocked while `mvpBuilds` is below `MVP_REQUIRED_BUILDS` (named constant, initial value 2). Rejection follows the existing pattern: error thrown, state unchanged, no PRNG draw. The counter SHALL be frozen, replayed, and serialized like every other state field.

#### Scenario: Building twice unlocks signing
- **WHEN** BUILD_PRODUCT is applied successfully twice and then CLOSE_CLIENT with sufficient traction
- **THEN** the client signs and `mvpBuilds` is 2

#### Scenario: Signing before MVP is rejected
- **WHEN** CLOSE_CLIENT is applied with traction 40 and `mvpBuilds` 1
- **THEN** it is rejected, the state is unchanged, and rngState is unchanged

#### Scenario: Burned-out builds still count
- **WHEN** BUILD_PRODUCT is applied at low morale (tier 0, zero traction gained)
- **THEN** `mvpBuilds` still increments by 1

#### Scenario: MVP replays identically
- **WHEN** a run with builds is replayed from its seed
- **THEN** the final `mvpBuilds` matches the original run

### Requirement: Team produces pipeline monthly
At each END_MONTH, after morale decay and before invoice collection, the core SHALL add a passive pipeline yield to `traction`: the sum over the team of each role's table-defined `pipeline` value (roles without one contribute 0). The yield SHALL be a deterministic integer sum with no PRNG draw and no clamp on traction. With an empty team the yield SHALL be exactly 0 and no pipeline event SHALL be emitted. A pipeline event carrying the integer traction delta SHALL be emitted when the yield is greater than 0.

#### Scenario: Empty team produces nothing
- **WHEN** END_MONTH is applied with an empty team
- **THEN** traction is unchanged by production, no pipeline event is emitted, and no extra PRNG draw is taken

#### Scenario: Team feeds the pipeline every month
- **WHEN** END_MONTH is applied with VENTAS (pipeline 6) and CTO (pipeline 2) on the team
- **THEN** traction increases by 8 from production with no PRNG draw, and a pipeline event carries tractionDelta 8

### Requirement: Sales team closes deals on its own
When the team includes a role whose table entry grants auto-close, END_MONTH SHALL (after pipeline production, before invoice collection) close exactly one deal without spending focus or player input, provided the MVP gate is satisfied and `traction` is at least the perk-resolved close cost. The auto-close SHALL burn that close cost from traction, create one invoice priced `dealPriceK(traction)` due `newMonth + perk delay`, draw no PRNG, and emit one auto-close event carrying the amount, due month, and closing role. At most one auto-close SHALL happen per month regardless of how many roles are hired. Auto-close SHALL be skipped (with no event) when its MVP or traction condition fails. The invoice created by an auto-close SHALL never be collectible in the same transition (delay >= 2). Cash, month, and bankruptcy outcomes SHALL read auto-close results exactly like manual closes.

#### Scenario: Ventas closes while the founder rests
- **WHEN** END_MONTH is applied with VENTAS hired, MVP done, traction 20, and focus untouched
- **THEN** traction drops by the close cost from the post-production value, one invoice exists at the priced amount with the perk delay, an auto-close event is emitted, and no PRNG draw occurred

#### Scenario: No sales role, no auto-close
- **WHEN** END_MONTH is applied with CTO only and traction 40
- **THEN** traction is unchanged by closing, no invoice is created, and no auto-close event is emitted

#### Scenario: Auto-close waits for the MVP
- **WHEN** END_MONTH is applied with VENTAS hired, `mvpBuilds` 1, and traction 40
- **THEN** no auto-close happens and no invoice is created

#### Scenario: At most one auto-close per month
- **WHEN** END_MONTH is applied with VENTAS and CTO hired, MVP done, and traction 60
- **THEN** exactly one auto-close event fires and exactly one new invoice exists

#### Scenario: Auto-close cannot be collected the same month
- **WHEN** an auto-close invoice is created during the transition to month N
- **THEN** cash does not include that amount in the same transition

## MODIFIED Requirements

### Requirement: Closing clients
`CLOSE_CLIENT` SHALL be a focus action costing 1 focus and the perk-resolved traction cost (default 10). It SHALL be rejected without state change when focus is 0, traction is below that cost, or `mvpBuilds` is below the MVP constant. On success it SHALL create one invoice of the profile deal price (integer $k) due at month `currentMonth + perk delay`, and SHALL NOT change cash or draw from the PRNG.

#### Scenario: Client signs with invoice due in 3 months
- **WHEN** CLOSE_CLIENT is applied at month 2 with traction 30 and focus > 0 and no team, after the MVP is done
- **THEN** traction decreases by 10, an invoice for the priced amount exists with dueMonth 5, and cash is unchanged

#### Scenario: Insufficient traction is rejected
- **WHEN** CLOSE_CLIENT is applied with traction 9 and no team, after the MVP is done
- **THEN** it is rejected and the state is unchanged

#### Scenario: No MVP blocks signing even with traction
- **WHEN** CLOSE_CLIENT is applied at traction 50 with `mvpBuilds` 0
- **THEN** it is rejected and the state is unchanged

#### Scenario: No PRNG draw for pricing
- **WHEN** CLOSE_CLIENT is applied
- **THEN** rngState is unchanged

### Requirement: End of month
`END_MONTH` SHALL be the only action that advances the month. It SHALL cost no focus and run, in order: apply a fixed morale decay with PRNG jitter at the start of the transition; add the deterministic team pipeline yield (production events when nonzero); attempt the sales auto-close (deterministic, no PRNG, skipped without its MVP/traction conditions); collect every invoice whose dueMonth equals the new month; subtract the effective burn; evaluate bankruptcy; then reset focus to 2, regenerate founder energy by +10 (clamped to 100), decrement pitch cooldown toward 0, and expire a pending undecided offer (set offer to null without cash change or cooldown). It SHALL emit events for decay, pipeline production (when nonzero), auto-close (when it fires), collections, burn, month advance (or terminal reason). END_MONTH remains valid at month 24 with terminal behavior. `NEXT_MONTH` SHALL no longer exist as an action.

#### Scenario: End of month decays morale and resets focus
- **WHEN** END_MONTH is applied mid-run
- **THEN** month increases by 1, focus is 2, and teamMorale decreased by the fixed decay plus jitter (clamped to 0)

#### Scenario: Production precedes auto-close precedes collections
- **WHEN** END_MONTH is applied with VENTAS hired and an invoice due the new month
- **THEN** the events show pipeline production first, then the auto-close, then the collection, and cash reflects the collection but not the new invoice

#### Scenario: No-team run is rule-for-rule unchanged
- **WHEN** END_MONTH is applied to any state with an empty team
- **THEN** cash, morale, month, and rngState after the transition equal the pre-change behavior (no extra PRNG draws, no extra events beyond none)

#### Scenario: Stale NEXT_MONTH is rejected
- **WHEN** an action of type NEXT_MONTH is applied to any state
- **THEN** it throws as an unknown action and the state is unchanged

#### Scenario: End of month ticks energy and cooldown
- **WHEN** END_MONTH is applied at founderEnergy 88 and pitchCooldown 2
- **THEN** founderEnergy is 98 and pitchCooldown is 1

#### Scenario: Pending offer expires silently
- **WHEN** END_MONTH is applied while an offer is pending
- **THEN** the returned state has offer null and cash shows no round money

### Requirement: Team and hiring
The core SHALL maintain a `team` list (roles hired this run, initially empty). `HIRE` is an action `{ type: 'HIRE', role }` costing 1 focus and a one-time sign-on in $k. It SHALL be rejected without state change when focus is 0, cash is below the sign-on, the role is already on the team, or the role is not in the roles table. Hiring SHALL NOT draw from the PRNG. Roles are defined in a data table (`ROLES`) with, per role: sign-on cost, monthly salary, and a perk bundle of table-defined passive production and overrides; the four roles are VENTAS (sign 3, salary 2, close cost 10 -> 6, pipeline 6/month, auto-close on), CTO (sign 5, salary 4, BUILD yield 8 -> 12 and morale cost 8 -> 6, pipeline 2/month), CFO (sign 12, salary 8, invoice delay 3 -> 2, no pipeline), CPO (sign 8, salary 6, TALK yield 6 -> 9 and morale cost 5 -> 3, no pipeline) — sales and product roles feed the pipeline; money/strategy roles buy their perks instead, which is what keeps the bad-hire lesson alive at bootstrap — the sign-on/salary gradient is deliberate: VENTAS and CTO pay off at bootstrap, CFO/CPO are priced for funded companies and are expected to bankrupt at seed stage (the bad-hire lesson); the sweep re-pins the exact survival outcomes. Adding a future role SHALL be a new table row, without new rules code.

#### Scenario: Hire costs focus and sign-on cash
- **WHEN** HIRE CTO is applied with focus > 0 and cash >= 10
- **THEN** team includes CTO, cash decreased by 10 ($k), focus decreased by 1, and rngState is unchanged

#### Scenario: Already hired is rejected
- **WHEN** HIRE CTO is applied while CTO is on the team
- **THEN** it is rejected and the state is unchanged

#### Scenario: Unaffordable sign-on is rejected
- **WHEN** HIRE CFO is applied with cash 11 ($k)
- **THEN** it is rejected and the state is unchanged

#### Scenario: Unknown role is rejected
- **WHEN** HIRE is applied with a role not in the table
- **THEN** it is rejected and the state is unchanged

### Requirement: Perks resolve through one table-driven path
Action yields, action morale costs, close traction cost, invoice delay, monthly pipeline yield, and auto-close eligibility SHALL be computed from a single perk-resolution function that starts from the default action/vertical values and applies the perk bundle of every role on the team (pipeline values sum; auto-close is granted when any role's bundle grants it). Rules code SHALL NOT branch on specific role names.

#### Scenario: CTO changes build output
- **WHEN** BUILD_PRODUCT is applied with the CTO on the team at high morale
- **THEN** traction increases by 12 + jitter and teamMorale decreases by 6

#### Scenario: VENTAS cheapens client signing
- **WHEN** CLOSE_CLIENT is applied with the VENTAS on the team and traction 6
- **THEN** the client signs (traction cost 6, not 10)

#### Scenario: CFO shortens collections
- **WHEN** CLOSE_CLIENT is applied with the CFO on the team at month 1
- **THEN** the invoice dueMonth is 3 (delay 2, not 3)

#### Scenario: Pipeline sums across the team
- **WHEN** the perk resolver is asked for pipeline yield with VENTAS and CTO on the team
- **THEN** it returns 8 (6 + 2)

#### Scenario: Funded-stage roles carry no pipeline
- **WHEN** the perk resolver is asked for pipeline yield with CFO and CPO on the team
- **THEN** it returns 0

#### Scenario: Auto-close is table-granted
- **WHEN** the perk resolver is asked for auto-close eligibility with any team lacking VENTAS
- **THEN** it returns not eligible without the resolver checking role names

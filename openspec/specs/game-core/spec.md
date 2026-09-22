# game-core Specification

## Purpose
Defines the pure, deterministic game state machine: seeded initialization, action application without mutation, semantic event emission, and the fixed 24-month run span that all future game systems build on.

## Requirements

### Requirement: Seeded game creation
The core SHALL create a complete initial game state from an integer seed alone, with no other input. Same seed SHALL always produce an identical initial state.

#### Scenario: Same seed produces identical state
- **WHEN** a game is created twice with the same integer seed
- **THEN** the two resulting states serialize to identical strings

#### Scenario: Different seeds diverge
- **WHEN** games are created with two different seeds
- **THEN** the internal PRNG state of the two games differs



### Requirement: Pure action application
`applyAction(state, action)` SHALL return a new value `{ state, events }` without mutating the input state or any part of it, and without reading anything outside its arguments (no globals, no clock, no I/O).

#### Scenario: Input state is untouched
- **WHEN** `applyAction` is called with a state snapshot
- **THEN** the serialized snapshot taken before the call still matches the input state after the call

#### Scenario: Unknown action is rejected without side effects
- **WHEN** `applyAction` is called with an unrecognized action type
- **THEN** it signals an error and returns no new state



### Requirement: Deterministic replay
A run replayed from its seed with the same ordered action sequence SHALL produce an identical final state, across engines and repeated executions. The PRNG SHALL draw only from state-internal integer operations; the core SHALL NOT use `Math.random`, `Date.now`, or non-integer arithmetic for game logic.

#### Scenario: Replay reproduces final state
- **WHEN** a seed and an action sequence are applied twice from scratch
- **THEN** the final serialized states are byte-identical

#### Scenario: PRNG golden vectors
- **WHEN** a fixed seed is advanced a fixed number of draws
- **THEN** the emitted integers match a recorded golden vector exactly



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



### Requirement: Semantic event emission
Each state transition SHALL return an ordered list of structured events, each being a plain object with a stable template key and integer/string params. Events SHALL contain no player-visible prose and no random-looking or opaque values that the UI must pattern-match beyond key and params. Each player action SHALL emit at least one event describing its outcome (which action, and the integer deltas applied). The offer-made event SHALL carry a `tier` string param naming the energy pricing tier that priced the offer (`drained`, `fair` or `hot`), so layers that display or learn from offers never recompute pricing.

#### Scenario: Month advance emits an event
- **WHEN** `END_MONTH` is applied successfully
- **THEN** the returned events include at least one event with a month-advance template key carrying the new month number

#### Scenario: Action outcome is reported as facts
- **WHEN** BUILD_PRODUCT is applied
- **THEN** the returned events include an action-outcome event whose params carry the integer traction delta and morale delta actually applied

#### Scenario: Offer event names its pricing tier
- **WHEN** PITCH is applied at founderEnergy 40 and at founderEnergy 100 to otherwise identical states
- **THEN** the two offer events carry tier `drained` and `hot` respectively, with no other param changed by the tier itself



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



### Requirement: Monthly actions with morale-gated traction
BUILD_PRODUCT, TALK_TO_CUSTOMERS and PUBLISH_CONTENT SHALL increase `traction` by an integer base yield plus PRNG jitter in [-3, +3], scaled by the current morale tier, and SHALL decrease `teamMorale` by a fixed integer. Base yields and morale costs SHALL be the team-perk-resolved values (defaults: build 8/-8, talk 6/-5, publish 4/-3). The morale tier SHALL be an integer mapping of `teamMorale` (clamped 0..100) with three bands — high yields 100% of base+jitter, medium yields exactly half via integer truncation, low yields 0 — with the band thresholds fixed as named constants in the core. REST SHALL increase `teamMorale` by a fixed integer and SHALL NOT change traction. All traction and morale values SHALL be integers, clamped to [0, 100] for morale.

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


### Requirement: Vertical profile
The core SHALL read cash-related numbers from a named vertical profile table (`VERTICALS`), and every run SHALL use exactly one active profile. The `b2b_saas` profile SHALL define starting cash 120 ($k), monthly burn 15 ($k), invoice delay 3 months, and deal pricing `dealMin + dealTen * floor(traction / 10)` with `dealMin` 20 and `dealTen` 10 ($k). Adding a future vertical SHALL be a new table row plus choosing it at game start, without new rules code.

#### Scenario: Deal price scales with traction
- **WHEN** CLOSE_CLIENT is applied with traction 37 under b2b_saas
- **THEN** the signed invoice pays 20 + 10*3 = 50 ($k)

#### Scenario: Profile values come from the table
- **WHEN** a run starts
- **THEN** initial cash equals the active profile's `startCashK`



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


### Requirement: Cash flow at month end
At each `END_MONTH`, after morale decay, the core SHALL: collect every invoice whose dueMonth equals the new month (adding its amount to cash, removing it), then subtract the effective burn (profile burn + team salaries), then evaluate bankruptcy. Events SHALL report collected total, burn paid, and resulting cash as integer $k.

#### Scenario: Invoice pays on its due month
- **WHEN** an invoice due month 5 exists and END_MONTH transitions the game to month 5
- **THEN** cash increases by the invoice amount and the invoice no longer exists

#### Scenario: Salaries always subtract
- **WHEN** END_MONTH is applied and no invoices are due
- **THEN** cash decreases by the effective burn amount



### Requirement: Bankruptcy ends the run
If after the month-end cash flow cash is negative, the run SHALL be terminal with a bankruptcy reason distinct from the month-24 reason. Cash reaching exactly 0 SHALL NOT end the run.

#### Scenario: Negative cash bankrupts
- **WHEN** end-of-month cash would be -5
- **THEN** the state is gameOver with reason `bankrupt`

#### Scenario: Zero cash survives
- **WHEN** end-of-month cash is exactly 0
- **THEN** the run continues and is not gameOver



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


### Requirement: Effective burn is derived from the team
Monthly burn SHALL be `profile burn + sum of team salaries` (integer $k). Month-end cash flow, runway display input, and bankruptcy checks SHALL all read the effective burn. With an empty team, effective burn SHALL equal the profile burn exactly.

#### Scenario: Salaries add to monthly burn
- **WHEN** END_MONTH is applied with CTO and VENTAS hired and no invoices due
- **THEN** cash decreases by profile burn + CTO salary + VENTAS salary ($k)

#### Scenario: No team, no burn change
- **WHEN** END_MONTH is applied with an empty team and no invoices due
- **THEN** cash decreases by exactly the profile burn (15)



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


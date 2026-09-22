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

### Requirement: Vertical profile
The core SHALL read cash-related numbers from a named vertical profile table (`VERTICALS`), and every run SHALL use exactly one active profile. The `b2b_saas` profile SHALL define starting cash 120 ($k), monthly burn 15 ($k), invoice delay 3 months, and deal pricing `dealMin + dealTen * floor(traction / 10)` with `dealMin` 20 and `dealTen` 10 ($k). Adding a future vertical SHALL be a new table row plus choosing it at game start, without new rules code.

#### Scenario: Deal price scales with traction
- **WHEN** CLOSE_CLIENT is applied with traction 37 under b2b_saas
- **THEN** the signed invoice pays 20 + 10*3 = 50 ($k)

#### Scenario: Profile values come from the table
- **WHEN** a run starts
- **THEN** initial cash equals the active profile's `startCashK`

### Requirement: Closing clients
`CLOSE_CLIENT` SHALL be a focus action costing 1 focus and the perk-resolved traction cost (default 10). It SHALL be rejected without state change when focus is 0 or traction is below that cost. On success it SHALL create one invoice of the profile deal price (integer $k) due at month `currentMonth + perk delay`, and SHALL NOT change cash or draw from the PRNG.

#### Scenario: Client signs with invoice due in 3 months
- **WHEN** CLOSE_CLIENT is applied at month 2 with traction 30 and focus > 0 and no team
- **THEN** traction decreases by 10, an invoice for the priced amount exists with dueMonth 5, and cash is unchanged

#### Scenario: Insufficient traction is rejected
- **WHEN** CLOSE_CLIENT is applied with traction 9 and no team
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
The core SHALL maintain a `team` list (roles hired this run, initially empty). `HIRE` is an action `{ type: 'HIRE', role }` costing 1 focus and a one-time sign-on in $k. It SHALL be rejected without state change when focus is 0, cash is below the sign-on, the role is already on the team, or the role is not in the roles table. Hiring SHALL NOT draw from the PRNG. Roles are defined in a data table (`ROLES`) with, per role: sign-on cost, monthly salary, and at most one perk; the four roles are VENTAS (sign 3, salary 2, close cost 10 -> 6), CTO (sign 5, salary 4, BUILD yield 8 -> 12 and morale cost 8 -> 6), CFO (sign 12, salary 8, invoice delay 3 -> 2), CPO (sign 8, salary 6, TALK yield 6 -> 9 and morale cost 5 -> 3) — the sign-on/salary gradient is deliberate: VENTAS and CTO pay off at bootstrap, CFO/CPO are priced for funded companies and are bankruptcy at seed stage (the bad-hire lesson). Adding a future role SHALL be a new table row, without new rules code.

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
Action yields, action morale costs, close traction cost, and invoice delay SHALL be computed from a single perk-resolution function that starts from the default action/vertical values and applies the overrides of every role on the team. Rules code SHALL NOT branch on specific role names.

#### Scenario: CTO changes build output
- **WHEN** BUILD_PRODUCT is applied with the CTO on the team at high morale
- **THEN** traction increases by 12 + jitter and teamMorale decreases by 6

#### Scenario: VENTAS cheapens client signing
- **WHEN** CLOSE_CLIENT is applied with the VENTAS on the team and traction 6
- **THEN** the client signs (traction cost 6, not 10)

#### Scenario: CFO shortens collections
- **WHEN** CLOSE_CLIENT is applied with the CFO on the team at month 1
- **THEN** the invoice dueMonth is 3 (delay 2, not 3)

### Requirement: Effective burn is derived from the team
Monthly burn SHALL be `profile burn + sum of team salaries` (integer $k). Month-end cash flow, runway display input, and bankruptcy checks SHALL all read the effective burn. With an empty team, effective burn SHALL equal the profile burn exactly.

#### Scenario: Salaries add to monthly burn
- **WHEN** END_MONTH is applied with CTO and VENTAS hired and no invoices due
- **THEN** cash decreases by profile burn + CTO salary + VENTAS salary ($k)

#### Scenario: No team, no burn change
- **WHEN** END_MONTH is applied with an empty team and no invoices due
- **THEN** cash decreases by exactly the profile burn (15)

### Requirement: Fundraising state fields
The core state SHALL additionally carry `founderEnergy` (integer 0..100, initial 100), `offer` (null or a frozen term-sheet object), `pitchCooldown` (integer months, initial 0), `founderPctBps` (initial 10000), and `investors` (frozen empty list). Game creation, replay, and freeze guarantees SHALL treat these fields like existing state fields.

#### Scenario: New game carries fresh fundraising fields
- **WHEN** a game is created
- **THEN** founderEnergy is 100, offer is null, pitchCooldown is 0, founderPctBps is 10000, and investors is empty

#### Scenario: Replayed run reproduces every offer decision
- **WHEN** a run log containing PITCH/ACCEPT_ROUND actions is replayed from its seed
- **THEN** the final state's cash, founderPctBps, and investors match the original run exactly

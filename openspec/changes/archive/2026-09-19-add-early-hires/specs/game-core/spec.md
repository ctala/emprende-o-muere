# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Focus budget
The game SHALL give the player exactly 2 focus at the start of each month. Each of the six player actions (BUILD_PRODUCT, TALK_TO_CUSTOMERS, PUBLISH_CONTENT, REST, CLOSE_CLIENT, HIRE) costs 1 focus. Actions SHALL be rejected with no state change when focus is 0. Focus SHALL NOT carry over between months.

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

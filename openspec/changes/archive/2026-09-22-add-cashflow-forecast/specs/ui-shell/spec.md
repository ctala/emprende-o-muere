# Spec Delta

## ADDED Requirements

### Requirement: Cash-flow panel projects the ledger
The UI SHALL render a "flujo de caja" panel from the core forecast derivation
only (no UI-side projection math): one ledger row per projected month showing
money arriving, money leaving, and the running cash, plus a run-rate summary
line above the rows (expected $/month from currently signed contracts and
leads/month the team adds) and a distinct projected-bankruptcy line naming the
month when cash is projected to go negative. The panel SHALL be visually
secondary to the hero runway, SHALL use ledger styling (parts, mono digits, red
for negatives and the bankruptcy line), and SHALL NOT draw randomness or change
game state. When the horizon completes without bankruptcy the panel SHALL show
a survived/no-bankruptcy line instead. The panel's numbers SHALL originate only
from the core derivation and existing strings keys.

#### Scenario: Doomed run shows a projected bankruptcy month
- **WHEN** a fresh game (no team, no invoices) is projected and rendered
- **THEN** the panel shows monthly rows arriving 0 / leaving base burn / cash
  falling, and a red line naming the month cash is projected to go negative

#### Scenario: Signed contracts make money arrive on their due month
- **WHEN** the player has signed clients and re-renders
- **THEN** the due months show their invoice amounts in the arriving column and
  the cash line steps up there

#### Scenario: The CFO visibly moves collections earlier
- **WHEN** two otherwise equal states differ only by a CFO on the team
- **THEN** the CFO run's projected arrivals land one month earlier than the
  non-CFO run's, shown on the panel rows

#### Scenario: Projection is honest about what it models
- **WHEN** the panel renders
- **THEN** a short gloss (strings content) states the projection assumes the
  founder does nothing (team engines only) and that each contract pays once

#### Scenario: Panel renders without randomness or state change
- **WHEN** the panel is re-rendered several times on the same state, including
  across a month
- **THEN** repeated renders on one state are identical, the projection is only
  recomputed after the month changes, and no game action is dispatched by
  opening or refreshing it

## MODIFIED Requirements

### Requirement: HUD shows focus, traction and morale
The UI SHALL render, from core state only, the remaining focus for the month
(labeled in plain Spanish, not jargon), the leads value labeled in plain
Spanish as interested contacts (traction renamed in the player's language;
core field name unchanged), the active client-contract count derived from state
(plain Spanish, distinct from the leads label), the team morale value (with its
numeric value visible, not only a bar), the cash balance in thousands of
dollars with the effective monthly burn shown explicitly beside it as a
decomposition into named parts (base burn plus each team role's salary) summing
to the effective burn, the runway in months as the hero value
(`floor(cash / effective burn)`), the hired roles of the current team, the
founder energy bar, and the founder ownership percentage (founderPctBps
converted to % for display), using labels from the centralized strings
content. Morale SHALL be visually differentiated by tier (high/medium/low) so
the effectiveness gate is perceivable, with the tier thresholds named in plain
text at least in the help screen. Cash at or below one effective burn SHALL be
visually alarming. Energy below 60 SHALL be visually differentiated from fresh
energy (85 and above), matching the pitch pricing tiers. All HUD values SHALL
meet the text contrast and size floors of the responsive DOM presentation
requirement.

#### Scenario: HUD reflects state after actions
- **WHEN** the player spends both focus points on actions
- **THEN** the HUD shows focus 0 and updated leads/morale values

#### Scenario: HUD resets on new month
- **WHEN** END_MONTH is applied
- **THEN** the HUD shows focus 2 again

#### Scenario: Runway follows cash
- **WHEN** cash is 45 ($k) and burn is 15
- **THEN** the HUD shows runway 3 months

#### Scenario: Runway drops when hiring
- **WHEN** CTO is hired and cash is 45 ($k)
- **THEN** the HUD shows runway 2 months against the new effective burn

#### Scenario: Team visible on HUD
- **WHEN** any role has been hired
- **THEN** the HUD lists the role labels from the strings content

#### Scenario: Energy visible and tier-differentiated
- **WHEN** founderEnergy is 40 after a pitch
- **THEN** the HUD shows the energy bar in its drained style, distinct from the
  fresh style at 85 or above

#### Scenario: Ownership visible after a round
- **WHEN** a round at 4095 bps has been accepted
- **THEN** the HUD shows founder ownership 59%

#### Scenario: Focus label is plain Spanish
- **WHEN** a fresh game renders the HUD
- **THEN** the focus label is the plain Spanish string (no bare dots), and the
  help text matches it

#### Scenario: Morale shows its number
- **WHEN** the HUD renders morale
- **THEN** the numeric value appears next to the bar, readable at >= 16 CSS px
  on a phone

#### Scenario: Pipeline labeled as interested customers
- **WHEN** a fresh game renders the HUD
- **THEN** the traction field carries the plain-Spanish interested-contacts
  (leads) label from the strings content, not the raw jargon word

#### Scenario: Leads and clients are named differently
- **WHEN** a game has signed contracts and interested contacts
- **THEN** the leads field and the client-contract field carry distinct plain-
  Spanish labels from the strings content, and neither reuses the word for the
  other

#### Scenario: Burn is shown as a breakdown
- **WHEN** a team is hired
- **THEN** the burn shows the base plus one labeled part per role, and the
  parts sum visibly to the same total the runway divides by

### Requirement: Help legend screen
The UI SHALL offer a help screen ("¿Cómo se juega?") toggled from a "?" button
placed outside the action grid (like the library button), listing, from the
strings content only: what each HUD metric means (including the plain-Spanish
gloss of every venture term shown on the HUD, e.g. Runway = meses de vida, the
lead-vs-client distinction, and that leads are contacts ready to buy), what
each action does with its costs, what the team does on its own every month
(pipeline production and sales auto-close), what the cash-flow projection shows
and assumes (founder does nothing, each contract pays once), and the rules that
disable actions (morale tiers, pitch availability, hire affordability, closing
traction, the MVP requirement before signing). Opening help SHALL block
game-input dispatch while open and closing it SHALL restore normal dispatch. A
first-run hint pointing at the "?" SHALL show only when no learning has ever
been unlocked and help has never been opened, SHALL disappear permanently once
help is opened, and its seen-state SHALL persist through the same storage
adapter as learnings. The help screen SHALL NOT change game state or draw
randomness.

#### Scenario: Help lists metrics, actions and locks
- **WHEN** help is opened on a fresh game
- **THEN** the screen shows a line for each HUD metric, each action, and each
  lock rule, in Spanish

#### Scenario: Venture terms are glossed
- **WHEN** help is open
- **THEN** the Runway, Burn and Pre-money terms each appear with a
  plain-Spanish explanation

#### Scenario: Help explains what the team does alone
- **WHEN** help is open
- **THEN** the screen states that the team feeds the pipeline and Ventas closes
  deals without a founder click, and that a product (MVP) must be built before
  any client signs

#### Scenario: Help distinguishes leads from clients
- **WHEN** help is open
- **THEN** the screen states that leads are interested contacts and clients are
  signed contracts that each pay once

#### Scenario: Help explains the projection
- **WHEN** help is open
- **THEN** the screen states that the cash-flow panel assumes the founder does
  nothing and shows when cash is projected to run out

#### Scenario: Help blocks gameplay input while open
- **WHEN** help is open and the player clicks where an action button is
- **THEN** no action is dispatched and the game state is unchanged

#### Scenario: First-run hint points to help and retires on first open
- **WHEN** a game starts with no stored learnings and help never opened
- **THEN** a one-line hint to press "?" appears; after help has been opened once
  (even across a reload), the hint never shows again

#### Scenario: Help grants no mechanical effect
- **WHEN** help is opened, closed, and the month is played
- **THEN** game state evolves identically to the same actions played without
  opening help

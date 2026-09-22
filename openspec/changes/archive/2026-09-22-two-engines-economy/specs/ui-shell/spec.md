# Spec Delta

## MODIFIED Requirements

### Requirement: HUD shows focus, traction and morale
The UI SHALL render, from core state only, the remaining focus for the month (labeled in plain Spanish, not jargon), the pipeline value labeled in plain Spanish as interested customers (strings-content label; the core field name is not shown), the team morale value (with its numeric value visible, not only a bar), the cash balance in thousands of dollars with the effective monthly burn shown explicitly beside it, the runway in months as the hero value (`floor(cash / effective burn)`), the hired roles of the current team, the founder energy bar, and the founder ownership percentage (founderPctBps converted to % for display), using labels from the centralized strings content. Morale SHALL be visually differentiated by tier (high/medium/low) so the effectiveness gate is perceivable, with the tier thresholds named in plain text at least in the help screen. Cash at or below one effective burn SHALL be visually alarming. Energy below 60 SHALL be visually differentiated from fresh energy (85 and above), matching the pitch pricing tiers. All HUD values SHALL meet the text contrast and size floors of the responsive DOM presentation requirement.

#### Scenario: HUD reflects state after actions
- **WHEN** the player spends both focus points on actions
- **THEN** the HUD shows focus 0 and updated pipeline/morale values

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
- **THEN** the HUD shows the energy bar in its drained style, distinct from the fresh style at 85 or above

#### Scenario: Ownership visible after a round
- **WHEN** a round at 4095 bps has been accepted
- **THEN** the HUD shows founder ownership 59%

#### Scenario: Focus label is plain Spanish
- **WHEN** a fresh game renders the HUD
- **THEN** the focus label is the plain Spanish string (no bare dots), and the help text matches it

#### Scenario: Morale shows its number
- **WHEN** the HUD renders morale
- **THEN** the numeric value appears next to the bar, readable at >= 16 CSS px on a phone

#### Scenario: Pipeline labeled as interested customers
- **WHEN** a fresh game renders the HUD
- **THEN** the traction field carries the plain-Spanish interested-customers label from the strings content, not the raw jargon word

### Requirement: Click advances the month
Taps/clicks SHALL be routed by interactive DOM elements: activating one of the action rows or the HIRE row dispatches that core action and re-renders; activating the PITCH row dispatches PITCH; activating Cerrar mes dispatches END_MONTH and re-renders; activating inactive or disabled elements dispatches nothing. Buttons whose action the player cannot currently afford (focus 0; for CLOSE_CLIENT traction below its perk-resolved cost or the MVP not yet built; for HIRE cash below the next role's sign-on or all roles already hired; for PITCH month below 6, cooldown active, energy below 40, or an offer already pending) or after game-over SHALL be rendered disabled (with inline reason per the hierarchical-rows requirement) and SHALL dispatch nothing. The HIRE button SHALL target the next unhired role in progression order VENTAS -> CTO -> CFO -> CPO, showing the role's name, sign-on cost, and new effective burn in its label.

After a dispatched action leaves the game with focus 0 and not game-over, the UI SHALL automatically dispatch END_MONTH after a short fixed delay (about 600 ms) so the player can read the action outcome first; during that delay player input SHALL be ignored and the closing state SHALL be visually indicated. The auto-dispatch SHALL NOT fire while a term-sheet offer is pending, so the player always gets to decide the offer before the month (and the offer) expires; the manual END_MONTH button SHALL also be hidden or disabled while an offer is pending. The manual END_MONTH button SHALL remain available at any other focus level, so closing a month early with focus left stays possible, and the auto-dispatch SHALL NOT prevent or replace that manual path. Auto-dispatched END_MONTH SHALL be dispatched to the core exactly like a click, keeping the run log and replays unchanged.

#### Scenario: Click advances and re-renders
- **WHEN** the player activates the Cerrar mes row at month N with a non-game-over state
- **THEN** the view updates to month N+1 with focus reset

#### Scenario: Action button dispatches its action
- **WHEN** the player activates the Construir producto row with focus > 0
- **THEN** the view updates reflecting the new traction, morale and focus

#### Scenario: End-month button advances the run
- **WHEN** the player activates the Cerrar mes row
- **THEN** the view updates to month N+1 with focus back to 2

#### Scenario: Empty clicks do nothing
- **WHEN** the player taps outside interactive elements
- **THEN** the displayed state does not change

#### Scenario: Clicks ignored after game over
- **WHEN** the player activates any control after the run reached month 24 and ended
- **THEN** the displayed state does not change

#### Scenario: Spending the last focus closes the month automatically
- **WHEN** the player dispatches an action that brings focus to 0 and the game is not over
- **THEN** after roughly 600 ms the month closes on its own, showing month N+1 with focus back to 2

#### Scenario: Input during the auto-close delay is ignored
- **WHEN** the player activates controls during the auto-close delay
- **THEN** the displayed state changes only as a result of the automatic END_MONTH, with no extra action applied

#### Scenario: Early manual close still works
- **WHEN** the player activates Cerrar mes with focus remaining
- **THEN** the month closes immediately and the focus left is not granted

#### Scenario: Close-client button disabled without traction
- **WHEN** the MVP is built and traction is below the CLOSE_CLIENT cost
- **THEN** the row is rendered disabled with its inline reason and clicking it changes nothing

#### Scenario: Close-client button disabled before the MVP
- **WHEN** `mvpBuilds` is below the MVP constant and traction is sufficient
- **THEN** the row is rendered disabled with an inline reason naming the missing product, and clicking it changes nothing

#### Scenario: Hire button follows progression order
- **WHEN** nobody is hired and the next role is affordable
- **THEN** the HIRE row shows VENTAS and clicking it hires VENTAS

#### Scenario: Hire button disabled when unaffordable or complete
- **WHEN** cash is below the next role's sign-on, or all four roles are hired
- **THEN** the HIRE row is rendered disabled with its reason and clicking it changes nothing

#### Scenario: Pitch button disabled by its own gate
- **WHEN** month is below 6, cooldown is active, energy is below 40, or an offer is pending
- **THEN** the PITCH row is rendered disabled with its reason and clicking it changes nothing

#### Scenario: Auto-close waits for an undecided offer
- **WHEN** a PITCH leaves focus 0 with an offer pending
- **THEN** the month does not auto-close and the offer decision panel stays on screen until the player decides

### Requirement: Help legend screen
The UI SHALL offer a help screen ("¿Cómo se juega?") toggled from a "?" button placed outside the action grid (like the library button), listing, from the strings content only: what each HUD metric means (including the plain-Spanish gloss of every venture term shown on the HUD, e.g. Runway = meses de vida, and the interested-customers meaning of the pipeline), what each action does with its costs, what the team does on its own every month (pipeline production and sales auto-close), and the rules that disable actions (morale tiers, pitch availability, hire affordability, closing traction, the MVP requirement before signing). Opening help SHALL block game-input dispatch while open and closing it SHALL restore normal dispatch. A first-run hint pointing at the "?" SHALL show only when no learning has ever been unlocked and help has never been opened, SHALL disappear permanently once help is opened, and its seen-state SHALL persist through the same storage adapter as learnings. The help screen SHALL NOT change game state or draw randomness.

#### Scenario: Help lists metrics, actions and locks
- **WHEN** help is opened on a fresh game
- **THEN** the screen shows a line for each HUD metric, each action, and each lock rule, in Spanish

#### Scenario: Venture terms are glossed
- **WHEN** help is open
- **THEN** the Runway, Burn and Pre-money terms each appear with a plain-Spanish explanation

#### Scenario: Help explains what the team does alone
- **WHEN** help is open
- **THEN** the screen states that the team feeds the pipeline and Ventas closes deals without a founder click, and that a product (MVP) must be built before any client signs

#### Scenario: Help blocks gameplay input while open
- **WHEN** help is open and the player clicks where an action button is
- **THEN** no action is dispatched and the game state is unchanged

#### Scenario: First-run hint points to help and retires on first open
- **WHEN** a game starts with no stored learnings and help never opened
- **THEN** a one-line hint to press "?" appears; after help has been opened once (even across a reload), the hint never shows again

#### Scenario: Help grants no mechanical effect
- **WHEN** help is opened, closed, and the month is played
- **THEN** game state evolves identically to the same actions played without opening help

# Spec Delta

## ADDED Requirements

### Requirement: Help legend screen
The UI SHALL offer a help screen ("¿Cómo se juega?") toggled from a "?" button placed outside the action grid (like the library button), listing, from the strings content only: what each HUD metric means (including the plain-Spanish gloss of every venture term shown on the HUD, e.g. Runway = meses de vida), what each action does with its costs, and the rules that disable actions (morale tiers, pitch availability, hire affordability, closing traction). Opening help SHALL block game-input dispatch while open and closing it SHALL restore normal dispatch. A first-run hint pointing at the "?" SHALL show only when no learning has ever been unlocked and help has never been opened, SHALL disappear permanently once help is opened, and its seen-state SHALL persist through the same storage adapter as learnings. The help screen SHALL NOT change game state or draw randomness.

#### Scenario: Help lists metrics, actions and locks
- **WHEN** help is opened on a fresh game
- **THEN** the screen shows a line for each HUD metric, each action, and each lock rule, in Spanish

#### Scenario: Venture terms are glossed
- **WHEN** help is open
- **THEN** the Runway, Burn and Pre-money terms each appear with a plain-Spanish explanation

#### Scenario: Help blocks gameplay input while open
- **WHEN** help is open and the player clicks where an action button is
- **THEN** no action is dispatched and the game state is unchanged

#### Scenario: First-run hint points to help and retires on first open
- **WHEN** a game starts with no stored learnings and help never opened
- **THEN** a one-line hint to press "?" appears; after help has been opened once (even across a reload), the hint never shows again

#### Scenario: Help grants no mechanical effect
- **WHEN** help is opened, closed, and the month is played
- **THEN** game state evolves identically to the same actions played without opening help

## MODIFIED Requirements

### Requirement: Canvas month display
The UI SHALL render the current month and total months using hand-drawn Canvas 2D primitives and system fonts, with no binary assets. The label text SHALL come from the centralized strings content. The UI SHALL present a visual identity built from that same primitive set, with no network or binary assets: a paper document surface (warm off-white page, thin ink rule lines, one red margin rule) that the HUD, month panel, event log and offer panel are drawn upon as slightly-offset sheets with a solid drop-shadow; all numeric values rendered in a monospace system font and all prose in a serif system font; negative monetary values drawn in ledger red; a game-over state drawn as a rotated dashed-border ink stamp over the page. The identity layer SHALL NOT alter any clickable region's coordinates: every button hit region keeps its exact position and size, so input routing and existing layout/geometry tests are unaffected. All identity colors and fonts SHALL be defined in one theme module, referenced by every drawing routine rather than re-declared inline. The player-visible game name SHALL be "Emprende o Muere" (subtitle "El juego de las startups") in the title bar, the canvas aria-label and the in-canvas header, replacing the former English working title.

#### Scenario: Initial render shows month one
- **WHEN** the page loads with a fresh game
- **THEN** the canvas displays the Spanish label for month 1 of 24

#### Scenario: Screens read as one paper document
- **WHEN** a fresh game is rendered
- **THEN** the dominant surface is the paper color (not the prior dark theme) and the month panel, HUD and log sit on it as sheets, with no gradient or image assets used

#### Scenario: Numbers are monospace, prose is serif
- **WHEN** the HUD renders traction, cash and runway
- **THEN** their numeric values use the theme's monospace face and their labels use the serif face

#### Scenario: Negative cash shows in ledger red
- **WHEN** cash is below one effective burn
- **THEN** the cash line is drawn in the theme's red, distinct from normal ink

#### Scenario: Game over is stamped
- **WHEN** the run reaches a terminal state
- **THEN** a rotated dashed-border stamp seal is drawn over the page carrying the terminal message

#### Scenario: Identity does not move the buttons
- **WHEN** the visual identity layer is applied
- **THEN** every clickable region's x, y, width and height are identical to before, and no drawing routine reassigns a region's coordinates

#### Scenario: Brand is Spanish throughout
- **WHEN** the page loads
- **THEN** the browser tab title, the canvas aria-label and the in-canvas header all show "Emprende o Muere" with no English working title remaining

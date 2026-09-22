# Spec Delta

## MODIFIED Requirements

### Requirement: Canvas month display
The UI SHALL render the current month and total months using hand-drawn Canvas 2D primitives and system fonts, with no binary assets. The label text SHALL come from the centralized strings content. The UI SHALL present a visual identity built from that same primitive set, with no network or binary assets: a paper document surface (warm off-white page, thin ink rule lines, one red margin rule) that the HUD, month panel, event log and offer panel are drawn upon as slightly-offset sheets with a solid drop-shadow; all numeric values rendered in a monospace system font and all prose in a serif system font; negative monetary values drawn in ledger red; a game-over state drawn as a rotated dashed-border ink stamp over the page. The identity layer SHALL NOT alter any clickable region's coordinates: every button hit region keeps its exact position and size, so input routing and existing layout/geometry tests are unaffected. All identity colors and fonts SHALL be defined in one theme module, referenced by every drawing routine rather than re-declared inline. The player-visible game name SHALL be "Emprende o Muere" (subtitle "El juego de las startups") in the title bar, the canvas aria-label and the in-canvas header, replacing the former English working title. The HUD may animate numeric values toward their true state values (tweens) while effects are active; the displayed value at rest SHALL always equal the core state exactly, and animation SHALL never alter hit-region geometry or dispatch routing.

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

#### Scenario: Animated values settle on the truth
- **WHEN** any animation finishes
- **THEN** every displayed number equals the core state value it represents

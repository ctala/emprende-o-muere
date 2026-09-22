# regression-gate Specification

## Purpose
Committed automated verification that the built page boots, renders, and plays in a real browser, closing the gap between green unit tests and a visibly working game, so a broken UI can never reach a human review unnoticed.

## Requirements

### Requirement: One-command gate runs every layer
The repository SHALL provide a single documented command that runs, in order: the pure Node unit suite and the browser gate, and exits non-zero if any layer fails. The browser gate SHALL start its own static server on a local port, drive the page in a real browser engine with no network access beyond localhost, and tear everything down on completion (success or failure). The gate SHALL use only tools already present in the developer environment (Node stdlib, the cached Chromium headless shell, CDP over WebSocket) and SHALL NOT add runtime dependencies to the game or require a build step.

#### Scenario: Green build passes the gate
- **WHEN** the command runs against a build that boots, renders, and plays correctly
- **THEN** it exits 0 and prints a per-layer pass summary

#### Scenario: Broken UI fails the gate
- **WHEN** the command runs against a build whose page fails to render any game state (for example a module that throws at import, or an empty action list)
- **THEN** the command exits non-zero naming the failing check, even though the pure unit suite alone would pass

#### Scenario: No orphan processes or ports left behind
- **WHEN** the gate finishes, whether it passed or failed
- **THEN** the browser process and static server it started are terminated

### Requirement: Boot integrity check
The browser gate SHALL load the served page at a phone-sized viewport and assert boot integrity before any interaction: zero page console errors and zero uncaught exceptions during load, and the DOM render contract present (post-boot marker, month label, runway hero value, and the action list populated with rows). A load that produces a blank or unwired page SHALL fail the gate.

#### Scenario: Clean boot passes
- **WHEN** the page loads over the local server with no errors
- **THEN** the boot marker element exists and the action list has at least the five core action rows as elements

#### Scenario: Console error fails the gate
- **WHEN** any script error or uncaught exception is reported during load
- **THEN** the gate fails and reports the error text

#### Scenario: Unwired page fails the gate
- **WHEN** the page HTML loads but the entry module never completes its wiring (simulated by importing a build where a module throws)
- **THEN** the missing boot marker is reported as the failing assertion

### Requirement: Render contract check
The browser gate SHALL assert the rendered DOM against core state rather than pixels: the runway hero value equals floor(cash / effective burn) derived from the same state the page displays, cash and burn values appear as distinct elements, and every disabled action row carries a visible reason element whose text is non-empty.

#### Scenario: Hero matches the numbers on screen
- **WHEN** the fresh game renders with cash and burn from the initial state
- **THEN** the hero value equals floor(cash/burn) with its unit suffix

#### Scenario: Disabled rows explain themselves
- **WHEN** an action row is rendered disabled
- **THEN** it contains a non-empty reason element

### Requirement: Functional play check through the DOM
The browser gate SHALL play the game exclusively through DOM interactions (dispatching clicks/presses on the elements a player would use) and assert observable state changes in the DOM after each step: at least one action click changes a displayed stat, END_MONTH advances the displayed month, a hired role raises the displayed burn, and a scripted run driven to a terminal state shows the terminal dialog with its stamp. Each interaction SHALL use the seed override so the sequence is deterministic across runs.

#### Scenario: Action click changes a stat
- **WHEN** the gate clicks an enabled action row
- **THEN** at least one displayed stat element changes its text and no console error fires

#### Scenario: Month closes through the footer button
- **WHEN** the gate clicks the month-closing footer button
- **THEN** the month label advances by one

#### Scenario: Terminal screen is reached and stamped
- **WHEN** the gate drives a seeded run to a game-over outcome
- **THEN** the terminal dialog is visible and carries the stamp element with non-empty text

### Requirement: Incident reproducers are permanent tests
Every class of defect that once produced a visibly broken page SHALL have a permanent regression scenario in the gate. The blank-page-over-`file://` class is covered by asserting the documented load path (served over http) boots, and by a scenario that loads `index.html` directly from the filesystem and asserts the gate's diagnosis path reports it as an expected-unsupported load mode rather than silently passing a blank render.

#### Scenario: file:// load is diagnosed, not mistaken for the game
- **WHEN** the gate loads the page via the file scheme
- **THEN** it records the module-block failure explicitly (blank page is never treated as a render contract pass)

#### Scenario: Regression scenario survives later changes
- **WHEN** a future change removes or renames the boot marker or render contract hooks
- **THEN** the gate fails with a message naming the removed contract, not a generic timeout

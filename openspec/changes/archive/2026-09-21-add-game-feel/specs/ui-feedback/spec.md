# Spec Delta

## Purpose

Transient presentation-layer feedback — number tweens, floating delta texts and impact shake — derived from core events, self-terminating, with zero gameplay or geometry effect.

## ADDED Requirements

### Requirement: Action feedback effects
The UI SHALL derive transient visual effects from the events of each dispatch: HUD numbers SHALL tween from their previous to their new value over a short fixed duration (about 350 ms), and numeric changes SHALL spawn floating delta texts (signed numbers) near their HUD position that drift upward and fade out over a short fixed duration (about 600 ms). A full-screen shake SHALL fire only on the high-impact events bankruptcy, a closed round, and an investor walking — never on routine actions. Effects SHALL be driven by a UI-side animation loop that stops when no effect is active, SHALL NOT change game state, SHALL NOT move or resize any clickable region, and every effect parameter SHALL be a deterministic function of event params (no `Math.random`).

#### Scenario: Cash rolls after an invoice payment
- **WHEN** a month closes and an invoice pays
- **THEN** the cash value counts up to its new value over roughly 350 ms and lands exactly on it

#### Scenario: Deltas float up from the HUD
- **WHEN** the player builds product (+8 traction, -8 morale)
- **THEN** signed delta texts appear near the traction and morale values, rise and fade, and are gone after roughly 600 ms

#### Scenario: Shake only on big moments
- **WHEN** the run goes bankrupt or a round closes or an investor walks
- **THEN** the page shakes briefly; when a routine action happens, the page does not

#### Scenario: Effects never break the game
- **WHEN** the player clicks during any animation
- **THEN** every click hits the same regions as when idle and the settled state matches a run played without animation

#### Scenario: Settled frame is the static frame
- **WHEN** effects from any sequence of actions finish
- **THEN** the canvas equals the static render of the resulting state, frame for frame

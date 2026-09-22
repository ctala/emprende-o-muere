# Spec Delta

## ADDED Requirements

### Requirement: Automated-run boot contract
The shell SHALL signal completed boot in the DOM: after the entry module finishes state creation, input wiring, and the first render, an element marked as the boot marker SHALL exist in the document (absent before wiring completes). The shell SHALL additionally accept an integer `seed` query parameter on its own URL so an automated run can reproduce a game deterministically; without the parameter the game uses its default seed behavior unchanged. The seed override SHALL NOT alter game rules, only the seed given to game creation, and SHALL be ignored (default behavior kept) when unparseable.

#### Scenario: Boot marker appears only after wiring
- **WHEN** the page loads and the entry module has completed its wiring and first render
- **THEN** the boot marker element is present in the DOM

#### Scenario: Seed parameter reproduces a run
- **WHEN** the page is loaded twice over http with the same `?seed=` value
- **THEN** both sessions render the identical initial state, and a different seed renders a different initial state where one exists

#### Scenario: Malformed seed falls back
- **WHEN** the page loads with an unparseable seed parameter
- **THEN** the game boots normally with default behavior and no error surfaces

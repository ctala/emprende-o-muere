# Spec Delta

## Purpose

The browser presentation layer: renders core state onto a hand-drawn Canvas 2D, maps player input to core actions, and turns core semantic events into visible text through a swappable renderer interface.

## ADDED Requirements

### Requirement: UI consumes core only
The UI layer SHALL depend on the core in one direction only: it reads game state and dispatches actions. The core SHALL have no import of, or reference to, UI modules, DOM, `window`, or canvas.

#### Scenario: Core import graph is clean
- **WHEN** the core modules are imported in a plain Node process with no DOM
- **THEN** they load and run without errors

### Requirement: Canvas month display
The UI SHALL render the current month and total months using hand-drawn Canvas 2D primitives and system fonts, with no binary assets. The label text SHALL come from the centralized strings content.

#### Scenario: Initial render shows month one
- **WHEN** the page loads with a fresh game
- **THEN** the canvas displays the Spanish label for month 1 of 24

### Requirement: Click advances the month
A canvas click SHALL dispatch a `NEXT_MONTH` action to the core and re-render from the returned state. Clicks SHALL have no effect once the run is game-over.

#### Scenario: Click advances and re-renders
- **WHEN** the player clicks the canvas at month N
- **THEN** the canvas re-renders showing month N+1

#### Scenario: Clicks ignored after game over
- **WHEN** the player clicks after the run reached month 24 and ended
- **THEN** the displayed state does not change

### Requirement: Event renderer interface
Player-visible text from events SHALL be produced through a renderer interface `render(event) -> string` resolved via string keys. The default implementation SHALL be a deterministic template renderer over the strings content. The interface SHALL be structured so additional renderers can be added later without modifying core or event shapes.

#### Scenario: Deterministic default rendering
- **WHEN** an event is rendered with the default renderer
- **THEN** the output text comes only from the strings content and event params

#### Scenario: Same event renders identically twice
- **WHEN** the same event object is rendered twice
- **THEN** the outputs are identical

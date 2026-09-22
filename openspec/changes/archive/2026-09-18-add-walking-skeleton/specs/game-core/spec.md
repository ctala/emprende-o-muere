# Spec Delta

## Purpose

Defines the pure, deterministic game state machine: seeded initialization, action application without mutation, semantic event emission, and the fixed 24-month run span that all future game systems build on.

## ADDED Requirements

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
The game SHALL start at month 1 and advance one month per `NEXT_MONTH` action. After `NEXT_MONTH` at month 24, the run SHALL be in a terminal state in which any further `NEXT_MONTH` is rejected without changing state.

#### Scenario: Month advances one at a time
- **WHEN** `NEXT_MONTH` is applied at month N (N < 24)
- **THEN** the new state has month N+1

#### Scenario: Run ends after month 24
- **WHEN** `NEXT_MONTH` is applied at month 24
- **THEN** the resulting state is flagged as game-over

#### Scenario: Action after game-over is rejected
- **WHEN** `NEXT_MONTH` is applied to a game-over state
- **THEN** it is rejected and the state is unchanged

### Requirement: Semantic event emission
Each state transition SHALL return an ordered list of structured events, each being a plain object with a stable template key and integer/string params. Events SHALL contain no player-visible prose and no random-looking or opaque values that the UI must pattern-match beyond key and params.

#### Scenario: Month advance emits an event
- **WHEN** `NEXT_MONTH` is applied successfully
- **THEN** the returned events include at least one event with a month-advance template key carrying the new month number

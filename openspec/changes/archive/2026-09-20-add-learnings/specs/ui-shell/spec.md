# Spec Delta

## ADDED Requirements

### Requirement: Run learnings
The UI layer SHALL observe the event stream of every run and unlock learning entries when their triggers fire: `first_bankrupt` (run ends with reason bankrupt), `first_round` (a round is accepted), `drained_deal` (a round is accepted from an offer priced at the drained tier), `investor_walked` (a counter walk event occurs), `offer_expired` (an undecided offer expires), `first_hire` (a role is hired), `broke_while_funded` (bankruptcy occurs while the cap table has investors), `lost_control_survivor` (survived with founder ownership below 50%). Unlocking SHALL be idempotent (repeating a trigger does not duplicate), SHALL NOT change game state or draw randomness, and SHALL be implemented entirely in the UI layer: the core SHALL have no import of, or reference to, any learning code. Unlocked ids SHALL persist across sessions through a storage adapter (localStorage in the browser) injected into the learnings module, and unlock tests SHALL run in plain Node against a fake adapter.

#### Scenario: Bankruptcy unlocks its lesson
- **WHEN** a run emits a run-ended event with reason `bankrupt`
- **THEN** `first_bankrupt` is in the unlocked set after processing and persists to the adapter

#### Scenario: Double trigger unlocks once
- **WHEN** the same trigger event is processed twice
- **THEN** the unlocked set contains the id exactly once and the adapter payload is unchanged by the second pass

#### Scenario: Learnings cannot alter the run
- **WHEN** the learnings processor handles any event sequence
- **THEN** no game state is read or written and the sequence replays byte-identical without the learnings layer

#### Scenario: Persistence survives reload
- **WHEN** a page reloads and the storage adapter returns previously stored ids
- **THEN** the library shows those entries as discovered without replaying any run

### Requirement: Library screen
The UI SHALL offer a library screen, toggled from a button outside the action area, listing every learning entry with the Spanish text from the strings content when discovered and an unknown-placeholder ("???") when not. Opening the library SHALL block game-input dispatch (like the offer panel) and closing it SHALL restore it. The library SHALL reveal information only: discovering entries SHALL NOT unlock or disable any action, price, or perk in any run.

#### Scenario: Undiscovered entries show placeholders
- **WHEN** the library opens with zero learnings stored
- **THEN** every row shows the unknown placeholder and none shows its text

#### Scenario: Library blocks gameplay input
- **WHEN** the library is open and the player clicks where an action button is
- **THEN** no action is dispatched while the library is open

#### Scenario: Closing the library restores play
- **WHEN** the player clicks the close control
- **THEN** the normal month screen renders and action buttons dispatch again

#### Scenario: Discovery grants no mechanical effect
- **WHEN** all learnings are unlocked and a new run starts
- **THEN** game state matches a run started with an empty library (identical createGame serialization)

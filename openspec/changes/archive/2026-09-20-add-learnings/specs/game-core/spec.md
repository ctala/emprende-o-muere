# Spec Delta

## MODIFIED Requirements

### Requirement: Semantic event emission
Each state transition SHALL return an ordered list of structured events, each being a plain object with a stable template key and integer/string params. Events SHALL contain no player-visible prose and no random-looking or opaque values that the UI must pattern-match beyond key and params. Each player action SHALL emit at least one event describing its outcome (which action, and the integer deltas applied). The offer-made event SHALL carry a `tier` string param naming the energy pricing tier that priced the offer (`drained`, `fair` or `hot`), so layers that display or learn from offers never recompute pricing.

#### Scenario: Month advance emits an event
- **WHEN** `END_MONTH` is applied successfully
- **THEN** the returned events include at least one event with a month-advance template key carrying the new month number

#### Scenario: Action outcome is reported as facts
- **WHEN** BUILD_PRODUCT is applied
- **THEN** the returned events include an action-outcome event whose params carry the integer traction delta and morale delta actually applied

#### Scenario: Offer event names its pricing tier
- **WHEN** PITCH is applied at founderEnergy 40 and at founderEnergy 100 to otherwise identical states
- **THEN** the two offer events carry tier `drained` and `hot` respectively, with no other param changed by the tier itself

# content-strings Specification

## Purpose
Centralizes all player-visible text in one Spanish content module keyed by stable string IDs, so copy lives in exactly one place and future renderers can reuse the same keys.

## Requirements

### Requirement: Single Spanish text source
All player-visible text SHALL be defined in a single content module, keyed by stable string IDs, in neutral Latin-American Spanish. UI and renderer code SHALL reference keys rather than embed literal copy.

#### Scenario: Label lookup by key
- **WHEN** the renderer asks for a defined string key
- **THEN** the Spanish text is returned

#### Scenario: Missing key is surfaced in development
- **WHEN** a lookup is requested for an undefined key
- **THEN** the lookup fails loudly (thrown error or visible placeholder) rather than silently returning empty text

### Requirement: Parameterized templates
Strings with dynamic values SHALL use named placeholders filled from event/state params. All dynamic numbers rendered to the player SHALL originate from core values, never generated in the UI.

#### Scenario: Template with month number
- **WHEN** the month label template is filled with month 7 and total 24
- **THEN** the resulting text contains "7" and "24" in Spanish sentence order

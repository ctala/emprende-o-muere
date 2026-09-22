# Spec Delta

## Purpose

Offline synthetic-research capability: a persona panel of simulated LatAm founders that views real game screenshots and records structured feedback, gating visual/design decisions with auditable evidence.

## ADDED Requirements

### Requirement: Persona panel definition
The harness SHALL define exactly five founder personas as declarative JSON specifications, spanning the target audience's spread: an early-stage first-time founder (mobile-only, non-gamer), a funded second-time founder (native venture jargon), a curious aspiring founder (startup content consumer, zero domain knowledge), a traditional SME owner in their 40s (low patience, mid-range phone), and a designer-gamer. Each persona SHALL specify age, country, occupation, tech comfort, gaming relation, and at least one personality and one preference trait, and SHALL be loadable into a simulated agent without code changes.

#### Scenario: Panel covers the audience spread
- **WHEN** the persona set is loaded
- **THEN** it contains one persona per declared archetype, no two share both age-decade and gamer status, and at least one is a non-gamer and one is jargon-fluent

#### Scenario: Personas load into agents
- **WHEN** the runner initializes an agent from a persona JSON
- **THEN** the agent is created with the persona's defining traits present in its specification (adherence check)

### Requirement: Screenshot evidence rig
The harness SHALL capture the current browser build in three canonical states (fresh game at month 1, help screen open, QUEBRASTE game over) across three viewports (mobile portrait 393×852, mobile landscape 852×393, desktop 800+ width) using the same headless-browser mechanism the project already uses for visual verification, storing each PNG under `playtest/shots/` with a name encoding state and viewport.

#### Scenario: All nine shots exist after a rig run
- **WHEN** the rig completes against a served build
- **THEN** 9 PNGs (3 states × 3 viewports) exist on disk, each non-empty, and their names are parseable into (state, viewport)

#### Scenario: Rig works headless and offline
- **WHEN** the rig runs with no network access except localhost and the model endpoint
- **THEN** all shots are captured with zero page errors

### Requirement: Isolated persona feedback rounds
The harness SHALL run each persona through a fixed three-round protocol in isolation: (1) cold glance at the month-1 portrait shot — state what the product is and play intent; (2) imagined play with the help and a disabled action visible — what to tap first and why the disabled action is disabled; (3) game-over shot — share intent through a WhatsApp group, including what would be shared. Each round SHALL send the screenshot as image input (vision) with the persona active, SHALL produce a structured JSON answer (fields: comprehension, intent, friction list, quote), and SHALL be persisted verbatim to `playtest/results/round<N>.json` with persona id, model id, and prompt version so results are auditable and re-analyzable without re-paying the API.

#### Scenario: One JSON record per persona per round
- **WHEN** a round finishes for all five personas
- **THEN** results contains 15 records (5 personas × 3 rounds), each with the four required fields non-empty

#### Scenario: No cross-persona contamination
- **WHEN** a persona answers any round
- **THEN** its prompt contains only its own persona spec and the current screenshot/question — never another persona's answer

#### Scenario: Re-analysis is free
- **WHEN** a synthesis report is regenerated from stored results
- **THEN** no model API call is made

### Requirement: Model endpoint via local shim
The harness SHALL reach its model provider through a local OpenAI-compatible shim that maps the standard OpenAI environment variables (`OPENAI_API_KEY`, base URL) onto the local serving endpoint (this machine serves vision-capable `qwen3.8` via litellm/vLLM), so the simulated-agents library runs unmodified and no provider secret is committed to the repo. The shim SHALL run only on loopback, SHALL transparently map model names and cap output length for the local server, and SHALL fail loudly with a clear error when the provider key is absent.

#### Scenario: Library sees plain OpenAI
- **WHEN** a persona answers with the shim running
- **THEN** the agents library is configured with no custom endpoint knowledge and the call succeeds via the local model server

#### Scenario: Missing provider key fails loud
- **WHEN** the shim starts without `LITELLM_MASTER_KEY`
- **THEN** it exits with a non-zero status and a message naming the missing variable

### Requirement: Synthesis report as design evidence
The harness SHALL produce a markdown synthesis from stored results: per-persona verdicts, cross-persona friction list ranked by frequency, a comprehension score per screen (fraction of personas correctly stating purpose), and a share-intent count for the game-over screen — each claim citing its source record id. The report SHALL state that the panel is synthetic and recommend confirmation with a small human sample before irreversible decisions.

#### Scenario: Every claim is traceable
- **WHEN** the synthesis is generated
- **THEN** every friction item and score cites at least one persona id and round number present in the results file

#### Scenario: Synthesis is honest about limits
- **WHEN** the report renders
- **THEN** it contains the synthetic-panel disclaimer and the human-confirmation recommendation

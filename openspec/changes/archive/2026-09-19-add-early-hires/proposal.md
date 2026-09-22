# Proposal

## Why

Burn is currently a constant tax: the player never decides what they spend on. The defining early-startup decision — who to hire, when you can afford them, and getting it wrong — is missing, and "cuánto estás gastando" only becomes real when salaries are your own doing. Hires also make the future fundraising choice concrete (raise to pay the CTO you signed), and they deepen the two-path economy: bootstrapping stays winnable (verified: 8/8 harvest seeds survive with zero hires) while hiring is a risk/reward multiplier.

## What Changes

- Add four hireable early-stage roles as a data table (`ROLES`), each with a one-time sign-on, monthly salary added to burn, and one concrete perk:
  - `VENTAS` $3k + $2k/mes — signing a client costs 10 -> 6 traction
  - `CTO` $5k + $4k/mes — BUILD_PRODUCT yields 8 -> 12 traction, morale cost -8 -> -6
  - `CFO` $12k + $8k/mes — invoice delay 3 -> 2 months (90 -> 60 days)
  - `CPO` $8k + $6k/mes — TALK_TO_CUSTOMERS yields 6 -> 9, morale cost -5 -> -3
- Add the `HIRE` action: `{ type: 'HIRE', role }`; costs 1 focus + sign-on cash; rejected when focus 0, role already hired, or cash below sign-on. The run's team lives in state (`team: []`); no PRNG draws.
- Burn becomes derived: `burnFor(team) = vertical burn + Σ salaries`. Cash flow, runway, and bankruptcy rules are unchanged in shape — only the number they read changes.
- Perk resolution goes through a single read path (`perksFor(team)`) defaulting to the current `ACTION_DEFS` numbers, same pattern as `VERTICALS`: future roles are data rows.
- UI: HIRE button presents the next unhired role in progression order (VENTAS -> CTO -> CFO -> CPO) with its sign-on and new burn shown; HUD shows the team and runway now uses effective burn.
- Balance verified against the real core (see design): idle still dies (~month 9); hiring VENTAS or CTO from 3 months of runway survives 8/8 and ends richer; hiring CFO/CPO at bootstrap bankrupts every seed — their perks only pay off with funded volume, which is the lesson: some roles are services you buy as tasks (outsourced/fractional/agents), not salaries you take on early. The outsourcing alternative is deferred to a follow-up change.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `game-core`: ROLES table, team in state, HIRE action, derived burn, perk overrides on labor/close actions.
- `ui-shell`: HIRE button (next role in order, affordability-disabled), team display in HUD, runway from effective burn.
- `content-strings`: role names, HIRE button copy, hire event text (new keys only).

## Impact

- `core/game.js` (ROLES, perksFor, burnFor, hire branch), `core/state.js` (`team: []`), `ui/layout.js` + `ui/main.js` (button grid + HUD), `content/strings_es.js`, `tests/`.
- No new rng draws anywhere (hiring/pricing deterministic) — draw accounting from prior changes untouched.
- BREAKING for replay logs: state shape grows `team`; pre-release, no migration.
- Existing balance tests must stay green: no-hire trajectories are regression-pinned (hires must not silently change bootstrap economics).

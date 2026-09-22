# Design

## Context

See proposal.md. Cash/bankruptcy and the VERTICALS data-table pattern exist (`core/game.js`); the perk path must follow the same shape so future roles are data. Balance numbers were swept against a patched copy of the real core before writing this change (see Risks) — they are pinned in specs so a retune is a deliberate spec edit, not a silent drift.

## Goals / Non-Goals

**Goals:**
- Hiring is a visible-math gamble: richer survivors, eager hiring dies.
- No-hire bootstrap economics regress exactly (8/8 harvest seeds still survive untouched).
- Zero new rng draws: hire outcomes are deterministic.

**Non-Goals:**
- No employee churn, no bad-hire RNG rolls, no equity/socios (that's the cap table in fundraising), no vertical gating of roles, no firing.

## Decisions

### Perk resolution mirrors VERTICALS
`perksFor(team)` starts from the defaults (the current `ACTION_DEFS` numbers + vertical delay) and overlays each hired role's override fields; `burnFor(team)` sums profile burn + salaries. Rules code reads these two functions and never branches on role names — a new role is a `ROLES` row plus optional override keys. Alternative (inline `team.includes('CTO')` checks in rules) rejected: it hard-codes role knowledge into every action branch and breaks the "variants are data" rule.

### Hire action shape
`{ type: 'HIRE', role }` validated against `ROLES`; all rejections throw with no state change like every other action. The UI picks the role (next in `HIRE_ORDER = VENTAS, CTO, CFO, CPO`) so the core stays free of progression policy; progression order lives in the roles table (`hireOrder`) so the UI reads it, not hard-codes it. The action carries `role` in its `evt.action_taken` params for replay-visible text.

### Layout: 2x3 action grid
Current layout stacks 4 labor buttons + full-width CLOSE + full-width END (800x450). Six full-width-ish buttons won't stack: switch to a 2x3 grid of 246x54 buttons (rows y=204 and y=262: BUILD / TALK / PUBLISH, REST / CLOSE / HIRE), END_MONTH stays full-width at y=326, log below. HUD gains a compact team strip (role initials/labels). Alternative (tabbed action screens) rejected: hides the whole decision space this change exists to make visible.

### The HIRE button shows the math it asks for
Label is `Contratar VENTAS · $6k + $4k/mes` (strings content, numbers interpolated from ROLES + effective burn after hire). The player decides with the price visible, which is the whole educational point; no confirmation dialog needed.

### Balance numbers are spec-pinned, not code-only
The pre-authoring sim (single-hire gates, 8 seeds) overestimated: on the real core, every role at first prices bankrupted, and VENTAS/CTO only pay off after cheapening. Final gradient, pinned in tests: VENTAS 3+2 and CTO 5+4 survive 8/8 and end richer than no-hire mean; CFO 12+8 and CPO 8+6 bankrupt 8/8 at bootstrap — deliberate, they are priced for funded companies (their perks scale with invoice volume/focus pressure that only fundraising creates). The lesson the player gets is the real one: hire what multiplies you NOW, buy the rest as services; a future outsourcing change gives the "CFO as a task" alternative.

### Salary added to runway/alarm thresholds
HUD red-line is `cash <= effective burn`, not profile burn: after a hire the alarm should reflect the new obligations, which is exactly the "you can no longer afford your own team" feeling.

## Risks / Trade-offs

- [Numbers still guesses despite the sweep] → sweep used one policy family (harvest + hire-gate variants); playtest may find a dominant hire order. Mitigation: `hireOrder` is table data; retune is one line + spec edit.
- [HIRE button showing only next-in-order removes choice] → deliberate: it teaches "the next hire you can't afford is the mistake", and the progression doubles as difficulty ramp. Multi-hire menus would demand a hiring screen (bigger UI change) for little added lesson value.
- [Patched-core simulation ≠ shipped code until implemented] → the sim's hire branch is the code we're about to write verbatim (same perk reads); tests re-verify the same trajectories on the real implementation.

# Design

## Context

See proposal.md - Why. The core today is a pure (state, action) -> {state,
events} machine with an integer-only PRNG whose draw ORDER is load-bearing:
every golden test and the replay guarantee depend on draws happening in a fixed
sequence (labor jitter, then end-month decay). The team is currently 100%
founder-side perks (overrides of founder-action numbers) plus salaries; there
is no month-end team behavior. `traction` already works as a pipeline (closed
deals subtract it, deal price reads it) — only the framing is missing.

## Goals / Non-Goals

**Goals:**
- Team produces and closes while the founder plays buttons; every engine
  result is visible in the event log with its own event key
- No-team bootstrap stays byte-identical (same draws, same events, same
  goldens) so all existing regression stays meaningful
- Balance decided by a sweep script with pinned thresholds, not vibes
- MVP gate is a plain integer counter, no new resource screen

**Non-Goals:**
- No recurring-revenue (MRR) model — auto-close still produces one-time
  invoices; subscription revenue stays roadmap
- No new roles, no new actions, no UI screens; help/HUD rows absorb all copy
- No forecast UI (that is the follow-on `add-cashflow-forecast`, queued here)

## Decisions

### D1: Determinism by construction — team engines draw zero PRNG
Production, auto-close, and the MVP gate are deterministic integer math. No
PRNG draws are added anywhere in END_MONTH, so replay, PRNG goldens, and every
existing "same seed => same state" test survive untouched, and the no-team path
emits exactly the old events with the same rngState. Alternative considered:
auto-close with jitter for texture — rejected: it would shift every downstream
draw and invalidate the whole golden suite for cosmetic noise. Jitter flavor
already exists where players look (labor yields).

### D2: Fixed sub-step order inside END_MONTH
decay (1 draw) -> production (0 draws) -> auto-close (0 draws) -> collections
-> burn -> bankruptcy check. Production before auto-close so a thin pipeline
can fill up and convert in the same month; collections after auto-close (new
invoice has delay >= 2) so a closed deal can never pay instantly. The order is
spec-pinned; the events array carries it (production event precedes auto-close
event precedes invoice_paid events).

### D3: Engines are table rows, not rules
`ROLES[*].pipeline` (integer $/traction per month) and `ROLES[*].autoClose`
(bool) join the existing perk-resolution table; `perksFor` gains two derived
fields (`pipelinePerMonth` = sum, `autoClose` = any). Rules never branch on
role names, preserving the single-table-driven invariant that the CFO/VENTAS
scenarios already pin.

### D4: MVP gate is one frozen counter, UI shows it as a lock reason
`mvpBuilds` increments on BUILD_PRODUCT success regardless of morale tier
("a burned-out sprint still ships code"), constant `MVP_REQUIRED_BUILDS = 2`
in the tuning block. CLOSE_CLIENT and auto-close read the same predicate
`hasMvp(state)`. UI renders the lock as an inline reason on the Firmar row
(existing mechanism) — no new widget. Alternative (product quality levels)
rejected: scope creep; the complaint is "you can sell vaporware", not "product
depth".

### D5: Balance is a swept script, thresholds pinned in tests
A Node sim script (`scripts/sweep.mjs`, same policy harness style as
tests/core.test.js) runs the policy families — harvest-nohire, harvest+hire
(VENTAS/CTO), bad-hire (CFO/CPO), sales-first, publisher-first, fundraising —
across a fixed seed set, printing survival rate + median death month per
family. Acceptance bands (deliberately re-pinned, not silently):
- naive no-hire harvest: MUST still bankrupt on most seeds (tension alive)
- smart hire (VENTAS then CTO) + fundraising: survives on every seed
- bad-hire families: bankrupt on every seed
- median death of naive families shifts by no more than +4 months (engines
  help, not solve)
Knobs, in order of first touch: per-role `pipeline`, then `VENTAS.salaryK`,
then `MVP_REQUIRED_BUILDS`. Tuning block numbers in the spec delta (3/2/1/2
pipeline) are the sweep's starting point, not a promise.

### D6: Copy change is label-only
The core field stays `traction` (replay/serialization invariant). HUD label,
action rows, and help switch to "Clientes interesados" / pipeline framing from
strings content. Auto-close and production get their own event keys
(`evt.pipeline_produced`, `evt.client_closed_by_team`) so the log shows the
team working without any UI pattern-matching.

## Risks / Trade-offs

- **Engines soften bankruptcy** -> D5 sweep gate blocks the change if naive
  survival rises into "winning by default" territory.
- **Auto-close + CFO delay=2 makes cash swingy in late game** -> acceptable;
  bankruptcy check runs every month and the forecast change will surface it.
- **Golden churn** -> the sweep decides finals; tests re-pin with a comment
  naming the sweep run, same discipline as the fundraising finals.

## Migration Plan

Pure rule addition; no persisted run format exists (state is memory-only per
tab), so no migration. Rollback = revert the commit; goldens revert with it.
Land before `add-cashflow-forecast` so the forecast projects the new flows.

## Open Questions

- Whether VENTAS auto-close should also fire when the founder still has focus
  left (spec says yes — the team is not the founder's turn budget; revisit if
  the sweep shows founder-close becomes strictly dominated and manual signing
  stops mattering).

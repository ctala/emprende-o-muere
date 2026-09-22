# Design

## Context

See proposal.md - Why. The team engines (two-engines-economy, archived) made
END_MONTH run deterministic sub-steps in a fixed order: decay (PRNG) ->
pipeline production (0 draws) -> sales auto-close (0 draws, MVP/traction gates)
-> collections -> burn -> bankruptcy. The owner's report says the money is not
legible: no forward view, opaque burn, leads conflated with clients, CFO
invisible. The key structural fact this design leans on: **cash evolution is
independent of morale** (production and auto-close gates read MVP + traction +
table fields, not morale; collections and burn read invoices + team), so a
cash-only projection can reproduce the real END_MONTH cash line exactly while
drawing nothing.

## Goals / Non-Goals

**Goals:**
- A projection that is not an estimate: for the "founder does nothing" scenario
  its cash line equals repeated END_MONTH byte-for-byte
- Burn decomposed into named parts so hiring/CFO decisions are legible
- Leads and clients named as the two different things the state already tracks
- Zero new randomness, zero new state fields, zero balance change

**Non-Goals:**
- No modeling of founder actions in the projection (labor is jittered PRNG;
  guessing it would break the "exact" guarantee and lie about the future)
- No recurring/subscription revenue mechanics (roadmap; needs its own sweep)
- No new screens/modals: the panel is one more ledger sheet in the state column
- No historical cash chart (there is no persisted cash history; a forward
  projection is the actionable view)

## Decisions

### D1: `forecastOf(state)` is a pure core derivation, exitOf-style
`forecastOf(state, horizon?)` returns a frozen `{ months: [{ month, inK,
outK, cashK }], bankruptMonth | null }`. It loops month = state.month+1 ..
min(state.totalMonths, cap), replaying the cash-relevant sub-steps with plain
integer copies of traction/invoices/cash (no applyAction, no rngNext): produce
(post-production traction), maybe auto-close (same gates/price/delay), collect
(dueMonth <= month), subtract burn. It stops at the first negative cash and
records that month as bankruptMonth. Cap default is the full remaining run so a
doomed run's bankruptcy month is always inside the horizon. Because cash is
morale-independent, this equals the real engine's cash line exactly — pinned by
a test that compares forecastOf against a real END_MONTH-only replay.
Alternative (call applyAction on throwaway states): rejected — it would draw
PRNG and could not be a pure function of the input state.

### D2: burn and clients are exposed by the same derivation layer, not new state
`burnParts(state)` -> `[{ role|base, amountK }]` summing to burnFor (one place
that already sums salaries). `activeClients(state)` -> `state.invoices.length`.
Presentation never re-derives math; the drift tests keep the totals equal to the
existing burn function.

### D3: UI reads forecastOf once per render into the model
buildModel already takes ctx and is Node-testable; it calls forecastOf(state)
and puts the rows + run-rate summary + bankruptcy line into the model. No UI
projection math. renderView paints a new ledger section. One render per state
change, so the panel recomputes exactly when cash changes (after each month),
never mid-animation, satisfying "recompute only after the month changes".

### D4: run-rate rows use two honest rates, not a fake MRR
Panel top line shows leads/month (perk `pipelinePerMonth`) and $/month expected
collections = mean of active invoices spread across the horizon (integer, from
invoices). Copy calls them "leads/mes" and "cobros previstos"; help states
revenue is one-time per contract. This gives the owner the "MRR-shaped" number
without pretending recurring revenue exists.

### D5: burn breakdown and CFO legibility
The burn field renders "Quema 21k/mes" as "15 operativa · 2 Ventas · 4 CTO"
from burnParts (strings keys for base label + role names already exist). The
CFO's delay perk shows up in the panel because projected arrivals shift a month
earlier — an e2e compares two equal states differing only by CFO.

### D6: fix the CFO "+0 clientes/mes" card bug
hirePerkText only interpolates a pipeline segment when the next role actually
has pipeline > 0; CFO/CPO lines drop the dead segment. Pure copy-shaping in
view.js + strings; covered by a view test.

## Risks / Trade-offs

- **Projection reads as gospel** -> the gloss states the "founder does nothing"
  assumption; it is labeled a projection, not a promise. When the player acts,
  next render updates it.
- **Horizon length vs mobile height** -> cap the rendered rows to the projected
  bankruptcy month or a fixed window (e.g. next 6 months) with a "…" tail;
  bankruptcy line always visible when present.

## Migration Plan

Additive: new pure functions + a new model field + one DOM section + copy
keys. No state shape change, no save format, no balance change, so existing
goldens, replay guarantees, and the byte-identical bootstrap path are untouched.
Rollback reverts the commit.

## Open Questions

- Run-rate collections: average across remaining horizon vs sum of the next
  3 months — the design ships the average (integer) for stability; revisit with
  the owner after they see it rendered.

# Proposal

## Why

The founder is the only thing that works. Every dollar requires the founder to
press Firmar, so hiring Ventas feels like a discount coupon rather than a team,
Publicar contenido "does nothing" because its only payoff is buried behind that
same button, and you can sign a deal for a product that does not exist. The
owner's instinct — "buttons are the founder's hands, the team produces behind
the scenes" — is the standard management-game model and fixes all three
complaints at once, but it changes the economy, so it goes through OpenSpec with
a balance sweep rather than a gut tweak.

## What Changes

- **Traction becomes an explicit pipeline** (demand pool), not an abstract score:
  the UI and help now say so ("clientes interesados"), and the founder's
  Firmar action draws from it. This is copy + framing; the number already works
  this way.
- **Ventas closes deals on its own (inbound->cash engine):** each END_MONTH the
  team auto-closes a deal from the pipeline without spending founder focus or a
  click, producing the recurring cash the owner expected from a sales team. The
  manual Firmar stays as the founder's high-cost/high-control move.
- **Content feeds the pipeline so the team has something to sell (inbound
  engine):** PUBLISH_CONTENT's output is reframed in copy as feeding the
  pipeline that the team now converts on its own — its payoff stops being
  buried behind a founder click. The numeric yield stays unless the balance
  sweep says otherwise.
- **A product must exist before you can sell it:** the first Firmar/auto-close
  requires an MVP (>= 2 BUILD_PRODUCT done this run). Before that, closing is
  locked with a plain-Spanish reason. "You can't sell a product that doesn't
  work."
- **Team produces monthly, buttons are founder-only:** role perks become passive
  monthly production (CTO adds passive pipeline, VENTAS converts it, CPO/CFO
  tuned accordingly) resolved through the existing single perk table.
- **Balance re-sweep + golden re-pin:** every pinned balance test
  (`harvest-nohire 8/8`, bad-hire lessons, fundraising finals) is re-swept
  against the new engines; the balance report and golden finals are updated
  deliberately, not silently.
- **Forecast follow-on:** `add-cashflow-forecast` stays queued and runs AFTER
  this so its projection reflects the new automatic inflows truthfully.

## Capabilities

### New Capabilities
- (none — this extends existing capabilities)

### Modified Capabilities
- `game-core`: CLOSE_CLIENT gains an MVP gate; end-of-month gains a
  founder-independent auto-close pipeline step; role perks gain passive
  monthly production; PUBLISH_CONTENT retuned as lead generation. All still
  table-driven, integer-only, PRNG-deterministic.
- `ui-shell`: action/forecast copy and the help legend explain the pipeline, the
  two engines, the MVP gate, and that the founder's Firmar is optional; the
  pipeline value is surfaced (traction renamed in copy to "clientes
  interesados" — the field name in core is unchanged).
- `content-strings`: new/updated copy keys only (pipeline framing, MVP lock
  reason, auto-close event text, engine descriptions) — the existing
  single-source and parameterized-template requirements already cover them, so
  no requirement delta; the drift test is extended in tasks.

## Impact

- `core/game.js` (CLOSE_CLIENT gate, endMonth auto-close step, ROLES perks gain
  passive fields, PUBLISH retune), `content/strings_es.js` (framing + new keys),
  `ui/view.js` + `ui/main.js` (pipeline label, auto-close log, help text).
- `tests/core.test.js` re-swept balance suite; `tests/help.test.js` drift guard
  extended; e2e `functional.test.js` gains an auto-close + MVP-gate scenario.
- **Economy changes** — must pass the sweep before it can ship: the game must
  stay losable-by-default (naive policies still die early) yet winnable via a
  team+fundraising path, matching the current design intent.
- Reversible: pure additive rule fields; rollback reverts the perk table + one
  endMonth step + copy. No persisted-format change (single-run state only).
- Sequencing: land this before `add-cashflow-forecast` (which is created but has
  no artifacts yet and is blocked behind this in the queue).

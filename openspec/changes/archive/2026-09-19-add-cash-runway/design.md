# Design

## Context

See proposal.md. This adds the first lose condition and the first derived HUD value. Core stays pure/integers; all money in integer thousands (k) — no floats anywhere.

## Goals / Non-Goals

**Goals:**
- Cash pressure teachable in one run: sign client, wait, survive.
- VERTICALS as data so future verticals are rows.
- Bootstrapping winnable: at least one scripted plan trends cash-positive.

**Non-Goals:**
- No vertical selection UI (single profile constant this change), no fundraising, no partial payments, no late-payment risk, no cost inflation.

## Decisions

### State additions
```
cashK: 120                     (integer, thousands USD)
invoices: [{ amountK, dueMonth }]   // ordered append; freeze keeps it cheap
reason: null | 'survived' | 'bankrupt'
vertical: 'b2b_saas'
```
Invoices stay a flat array of frozen plain objects — replay diffing stays trivial, and the run holds single-digit items (1 client/month cap is de facto: 2 focus, and labor competes). Alternative (Map keyed by month) rejected: no need, and plain JSON state keeps the golden serialization honest.

### END_MONTH order (specified, not incidental)
morale decay (draws) -> month += 1 -> collect invoices with `dueMonth === newMonth` -> `cashK -= burn` -> bankrupt check (`cashK < 0` -> gameOver `reason:'bankrupt'`, month stays) -> survived check at 24 (`reason:'survived'`). Determinism note: invoice collection draws nothing, so draw accounting from 02 is untouched — the only rng draws remain labor jitter and decay.

### CLOSE_CLIENT pricing (no new randomness)
`dealK = VERTICALS[active].dealMin + dealTen * trunc(traction / 10)`, needs traction >= dealCost (10). Deterministic on purpose: the player learns "traction -> bigger deals" as a rule, not a lottery.

### Bankruptcy vs 24-month survived share the terminal slot via `reason`
`gameOver` stays the boolean gate (existing guards untouched); `reason` adds the flavor and the UI branch. Event on terminal: `evt.run_ended` gains `reason` param; strings split `evt.run_ended.survived` / `evt.run_ended.bankrupt` (renderer's existing action-suffix mechanism reused with `reason` as the discriminator key — generalize `render()` to check `${key}.${params.reason ?? params.action}`).

### Balance model (integer math, all k)
Tuned against simulated policies (see "Balance" note below). Idle play: -15/mes -> dead month ~10. Harvest play: build to traction 10, then CLOSE_CLIENT whenever traction allows while morale >= 40: 8/8 seeds survive 24 months, about half ending at cash ~0 — winning while gasping, the intended feel. Scripted balance tests pin both trajectories (idle bankrupts, disciplined survives 24) so any retune that breaks the game fails CI instead of feeling bad later.

### Layout (800x450)
5 action buttons: reuse the 4-button row for labor+rest (they keep their slots) and add CLOSE_CLIENT as a full-width button above END_MONTH (sales is qualitatively different: it converts traction to money). HUD becomes 2 rows: [Foco ● ● | Tracción] and [Caja $80k | Runway 4m | Moral bar]. Cash turns red when `cashK <= burn`.

## Risks / Trade-offs

- [Invoice array unbounded in theory] → real cap ~10-12 per run (focus-limited); no mitigation needed.
- [Redundant lose condition makes 24-month tests flaky] → replay loops switch to `while (!state.gameOver)`; bankrupt runs are asserted, never assumed.
- [Deal formula makes close-client strictly optimal with high traction] → intended early game; later changes (fundraising capital, churn) create competing uses for focus and traction.

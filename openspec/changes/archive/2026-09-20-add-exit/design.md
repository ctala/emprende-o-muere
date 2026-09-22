# Design

## Context

See proposal.md - Why. The cap table (founderPctBps, investors[]) exists since fundraising I but nothing reads it. All numbers below pinned by a sim over the real core (strategies A/B/D over 8 harvest seeds).

## Goals / Non-Goals

**Goals:**
- Settlement is pure derivation at terminal time: `exitOf(state)` helper, no new action, no PRNG, no new state fields — replays byte-identical by construction
- The control threshold (50%) turns the raise-everything strategy into a visible disaster without touching fundraising rules: B (naive ASAP) never beats A (bootstrap) on any seed — max personal 7 vs min 160
- Hybrid (raise early + hire, stop raising) is the strongest average but NOT strictly dominant (bootstrap wins 2/8 seeds) — the right answer is a judgment, not a formula

**Non-Goals:**
- No liquidation preferences, no investor payout lines, no down-rounds, no second-round valuation logic (a future fundraising III if ever)
- No interactive exit (a "sell now" mid-run action) — the 24-month frame already decides when the game ends
- No score history / meta — that is the learnings change's job

## Decisions

**Settlement formula (sim-pinned):** `valuationK = 150 + 10 * traction` (mirrors the pitch pre-money base — investors pay 150+4t, an acquirer pays 150+10t: the 10x slope makes traction, the only compounding asset, the real prize); `payoutK = trunc(founderPctBps * valuationK / 10000)`; control (`founderPctBps >= 5000`) adds the whole `cashK` as `cashOutK`.
- Why traction-driven and not cash-driven: cash-driven valuation would reward the B strategy's balance sheet; traction-driven rewards what money must be *spent on*. The sim shows exactly that separation.
- Control = founder still alone holds >= half (founderPctBps only shrinks, so control is monotonic: once lost, never regained — pitch cooldown spam cannot fake a co-control story).
- Alternative rejected: valuation from cashK + traction — double-counts the raise money and softened B's disaster into a wash.

**Event-borne params (`valuationK, payoutK, cashOutK, personalK`) on the existing run-ended event:** the renderer already formats from event facts; adding a key would fork the terminal template. Params are optional per reason (bankrupt carries none) — the strings variant system (`evt.run_ended.survived`) already keys by reason.

**Terminal ledger layout:** survival line + up to four ledger lines in the bottom band; the canvas already has the 40px terminal row — ledger replaces the log area for survived runs (the last log lines are the settlement anyway).

## Risks / Trade-offs

- [Hybrid loses 2/8 to bootstrap — feels random] → it is the honest kind: seed 22/77 harvest naturally to huge personal wealth, and raising *any* early money trades that away. The lesson is "know when you don't need the money", not "raising is bad".
- [5000 bps exact-boundary feels arbitrary to player] → the HUD shows founder % rounded to whole percents and the ledger prints the control rule in words ("mantuviste el control"), so the boundary is legible when crossed.
- [Settlement params inflate run-ended event] → four integers, still plain params; no template needs more than one line each.

## Migration Plan

Additive event params on survived only. Existing replay tests assert state, not events of the final event's param set — unaffected.

## Open Questions

(None.)

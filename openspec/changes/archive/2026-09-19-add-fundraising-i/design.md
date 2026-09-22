# Design

## Context

See proposal.md - Why. The core is a pure `(state, action) -> {state, events}` reducer with integer-only math, PRNG state in state, no DOM/Date/Math.random in core. The energy mechanic is the burnout seam postponed from the hires change; all tuning numbers below come from a throwaway sim that patched the real core (`/tmp/opencode/fund_sim`), not from hand math — the hires change proved hand math misprices gradients.

## Goals / Non-Goals

**Goals:**
- Energy is scarce only where pressure exists: it drains exclusively on PITCH, so the bootstrap economy is byte-for-byte unchanged
- The term sheet is fully priced at pitch time (offer is a frozen fact), so accept never recomputes and the UI never does math
- Cap table is append-only integers (bps) ready for the exit change to multiply against an exit price

**Non-Goals:**
- No multiple investor personas, no board seats, no liquidation preferences, no down-round mechanics (fundraising II / exit)
- No energy effects on other actions or on morale (that was the swept design; it stays swept)
- No new PRNG draws anywhere in this change

## Decisions

**Energy constants (from sim sweep):** max 100, start 100, month regen +10, REST +25, pitch drain −80, gate 40, min month 6, cooldown 2 after a decision.
- Drain 80 with regen 10 forces an alternate rhythm (pitch → ~4 months to refill, or 3 with REST); drain 70 let grinders re-pitch every 2-3 months with no cost. Gate 40 (not 70) is deliberate: pitch cost is 80, so the lowest energy you can ever pitch at is exactly 40, and the penalized band (<60) becomes reachable. Gate 70 made the penalty a dead mechanic — first sim draft caught this (same class of bug as the hires single-hire gate).
- Fundraising beats bootstrap hard on cash ($540-1020k vs ~$40 avg) but both strategies land the founder at ~1-2% after repeated rounds — the cap table is worthless until the exit change converts bps against company valuation, not cashK. Within fundraising, energy decides the price: grinding pitches at the drained floor (40) yields $540 avg vs $1020 for always-fresh pitches (same seed set); per identical state, a 40e pitch pre-prices 233 vs 385 at 100e. Cash ≠ ownership is the seed of the exit punchline.

**Offer pricing (integer-only):** `preK = trunc((150 + 4 * traction) * mult)` with mult = ×11/10 (energy ≥ 85), ×2/3 (energy < 60), ×1 (60..84); `roundK = 120`; `investorPctBps = trunc(roundK * 10000 / (preK + roundK))`; `founderPctAfterBps = trunc(founderPctBps * (10000 − investorPctBps) / 10000)` — computed at pitch and stored so ACCEPT_ROUND just assigns it.
- Fractions encoded as numerator/denominator truncation (`n * 2 / 3 | 0`), matching the morale tier's integer-half precedent; no floating point in state.

**Offer expiry at month end (no cooldown on expiry):** pitch sets focus −1 and energy −80; if the player closes the month without deciding, the offer silently dies with no cooldown. This costs a wasted pitch and is the pressure that makes the UI hold auto-close while an offer is pending — without the UI hold the 600ms auto-close would eat the offer every single pitch (caught by CDP harness before spec: core test can't see it).
- Alternative considered: offer persists across months (decide later). Rejected: stale offers stacking with new months would need a queue and muddies the "decide now" tension.

**UI layout:** energy bar joins the HUD row (morale-style segmented bar, tier styles reused: fresh ≥85 / ok / drained <60); the offer panel is a modal-style strip over the action grid with two hit regions (ACEPTAR / DECLINAR) drawn from `strings_es.js`; while `offer != null` the main.js dispatch path ignores every action except ACCEPT_ROUND/DECLINE_ROUND and suppresses the auto-close timer.

## Risks / Trade-offs

- [Auto-close eats the offer] → ui-shell spec adds the hold; CDP playthrough task asserts an undecided offer survives to a click.
- [Pitches feel like a tax if gate is too high] → gate 40 is the floor of reachable energy; worst case the player always has a drained option and chooses the price tier.
- [founderPctAfterBps stale if dilution could change between pitch and accept] → nothing else mutates founderPctBps and offers are single-pending + same-or-next-month lifetime; accept is assignment-only by spec.
- [Bootstrap regression] → pinned sim baselines (no-pitch trajectories) re-run against the real core in the balance-test task; energy touches no other path.

## Migration Plan

Additive only: new state fields with fresh-run defaults; no old run logs exist outside tests. Replays of pre-change tests must be byte-identical (they never dispatch PITCH/ACCEPT, so energy fields tick through END_MONTH regen only and no existing assertion reads them — the balance pins assert cash/traction/month which are unaffected).

## Open Questions

(None — investor persona/names deferred to fundraising II as a strings-only change.)

# Design

## Context

See proposal.md - Why. Fundraising I froze: offer priced at pitch time, accept never recomputes, UI reads only offer integers. This change adds one action (COUNTER_ROUND) on top of that pipeline; all numbers below come from a sim that patched the real core, per the project rule.

## Goals / Non-Goals

**Goals:**
- Negotiation is an energy trade, not a pure upside: 20 energy for a 4/5 dilution re-price with a 1-in-4 walk
- The fresh pitch buys exactly one counter: energy after a fresh pitch is 100 − 80 = 20, exactly COUNTER_ENERGY_COST — drained pitches (40 − 80 → 0) cannot negotiate; no new gate math needed
- Walk and success are both reducer outcomes with events, so replays stay byte-identical (PRNG draw lives in rngState)

**Non-Goals:**
- No multiple counters, no counter-offers on pre-money (only bps shrink), no investor personas reacting to traction (fundraising III / exit territory)
- No new state fields beyond the `countered` flag inside the existing offer object

## Decisions

**Counter constants (from real-core sim):** cost 20, bps multiplier 4/5 (trunc), walk odds 1/4 (rngStep % 4 < 1), one per offer.
- Sim pinned: fresh-no-counter $1020 avg @ <1% founder; fresh-always-counter ~$900 @ 1-2%; asap-counter $420 @ ~4% (4x ownership vs $540 @ 1%). Counter trades cash for ownership — exactly the pre-exit decision the exit change will cash out. Walk cost (lost round + 2-month cooldown) makes spamming counters against a drained founder strictly worse than declining.
- 4/5 (not 9/10) so a counter visibly matters: 32% -> 25% on the panel. 9/10 was a button press with no story.

**Walk kills the offer and sets cooldown (same as decline):** an angry investor who walks is indistinguishable from a declined offer downstream; no new state to carry.

**Counter recomputes founderPctAfterBps at counter time (not pitch time):** founderPctBps cannot change while an offer is pending (accept/decline clear it), so recomputation is safe and keeps accept assignment-only — the Fundraising I invariant survives untouched.

**Rejection order in counterRound:** no offer / already countered / drained — mirrored by the UI disabled logic (offer.countered || energy < 20).

## Risks / Trade-offs

- [PRNG draw in counters shifts rngState for later jitter] → intended; replay tests compare full serialized states, and the run log already stores COUNTER actions so replays reproduce walk/success exactly.
- [Always-counter could feel mandatory] → the sim shows it is not: the cash lost (~$120k/round) exceeds the ownership kept unless a founder values equity over cash — which is the point of the exit change, not a trap here.
- [Panel space: third button on a 130px panel] → buttons go in one row of three ~160px hit regions; layout test asserts no overlap outside the sanctioned panel overlay.

## Migration Plan

Additive: `countered` flag only appears on offers created after the change (createGame untouched); no old logs exist outside tests.

## Open Questions

(None.)

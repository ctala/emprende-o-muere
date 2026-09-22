# Proposal

## Why

Fundraising I made every offer a binary take-it-or-leave-it, so the term sheet is a fact, not a negotiation — yet negotiating is the most human part of a seed round. A single COUNTER action turns the offer panel into a real negotiation with a real cost, and it is the second lever connecting energy to ownership: a founder who pitches fresh has exactly the energy left to push back once, while a founder pitching drained has nothing left to negotiate with.

## What Changes

- New offer action COUNTER_ROUND: spends 20 energy on a pending offer to push dilution down — on success the investor keeps 4/5 of the original bps; on a 1-in-4 PRNG draw the investor walks (offer cleared, cooldown set). One counter per offer; rejected when drained below 20 or already countered
- A counter is the only fundraising action that draws PRNG beyond existing paths, so outcome text must be recorded in the run log (it already is, via the reducer)
- Offer gains a `countered` flag; after a successful counter the panel shows the improved terms and a second counter is unavailable (accept/decline only)
- Energy/pitch UI unchanged; the offer panel gains a third button (NEGOCIAR) with its cost and risk visible
- No cash or ownership formula changes for accept/decline — counter only re-prices the offer before acceptance

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `fundraising`: "Offer decision and expiry" gains COUNTER_ROUND (energy cost, 4/5 bps re-price, 1/4 walk with PRNG, once-per-offer) and the `countered` offer flag
- `ui-shell`: "Offer decision panel" gains the NEGOCIAR button (cost + odds, disabled when drained or already countered)

## Impact

- `core/game.js`: COUNTER_ROUND action + `counterRound` reducer, `COUNTER_ENERGY_COST`/`COUNTER_BPS`/`COUNTER_WALK` constants, `countered` offer field, new event keys
- `core/state.js`: unchanged (offer is already a freezable object)
- `ui/layout.js` + `ui/renderer.js` + `ui/main.js`: third offer button + hit region, disabled logic
- `content/strings_es.js`: counter button, success, and walk-away templates
- `tests/core.test.js`: counter pricing vector, walk determinism via seed, once-per-offer, drained rejection, and a fresh-vs-counter balance pin (counter trades cash for ownership: ~$900 vs $1020 but ~2x founder %; drained counter ~4x founder %)
- PRNG now draws on counters — replay tests must log/compare counters as they do labor jitter (already covered by the reducer contract)

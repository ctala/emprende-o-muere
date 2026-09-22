# Proposal

## Why

Runs currently end as pure bootstraps: cash oscillates near zero and the founder keeps 100% of nothing. Fundraising is the defining startup decision of the genre — money in exchange for ownership — and it is the natural home for founder burnout (postponed from the hires change): the pitch is the one action that drains the founder, so energy becomes a real resource exactly where pressure exists.

## What Changes

- Founder energy bar (0–100): regenerates +10 per month end; REST additionally restores +25; only PITCH drains it (−80, floor 0)
- New action PITCH (1 focus): available from month 6, blocked while drained (energy < 40), 2-month cooldown after a round is decided; produces a term-sheet offer `{preK, roundK, investorPctBps, founderPctAfterBps}` computed with integer-only math from traction and an energy-tier multiplier (burned-out pitch sells the company cheap: ×2/3 below 60; rested ≥85 gets ×11/10)
- Offer resolution: ACCEPT_ROUND injects cash, dilutes founder ownership (bps) and appends an investor row; DECLINE_ROUND refuses and sets the cooldown; an undecided offer expires at month end
- Cap table on state: `founderPctBps` + frozen `investors[]` — the setup for the exit punchline (sim: fundraising turns a ~$40 bootstrap into $540-1020k cash, but the founder ends at ~1-2% ownership; drained pitches earn strictly less than fresh ones)
- HUD gains the energy bar and an offer decision panel with the dilution math visible
- Bootstrap economy is untouched: no other action touches energy and no perk depends on it (verified by pinned-sim baselines)

## Capabilities

### New Capabilities

- `fundraising`: founder energy economy, PITCH availability/pipeline, offer pricing math (energy tiers, integer dilution), accept/decline/expiry, cap table state

### Modified Capabilities

- `game-core`: "Focus budget" adds PITCH as a focus-costing action (offer decisions cost none); "End of month" also regenerates energy, ticks the pitch cooldown, and expires a pending undecided offer
- `ui-shell`: HUD gains the founder energy bar and founder ownership %; a pending offer renders a decision panel whose buttons dispatch ACCEPT_ROUND / DECLINE_ROUND, and the auto-close of the month is held while an offer is undecided so expiry can never rob the player of the decision

## Impact

- `core/game.js`: energy/pitch constants, PITCH/ACCEPT_ROUND/DECLINE_ROUND in `takeAction`, offer math, end-of-month ticks
- `core/state.js`: `founderEnergy`, `offer`, `pitchCooldown`, `founderPctBps`, `investors` in initial state
- `ui/layout.js` + `ui/renderer.js` + `ui/main.js`: energy HUD, offer panel layout + hit regions
- `content/strings_es.js`: offer/energy strings
- `tests/core.test.js`: offer math vectors, dilution replay, bootstrap-unchanged pins, ASAP-vs-patient founder-% pins from the sim
- No UI module is imported by core; no randomness beyond existing PRNG use; all math integer-only

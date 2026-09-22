# Design

## Context

Walking skeleton shipped: `createGame(seed)`, frozen state, `applyAction -> { state, events }`, mulberry32 pinned by golden vectors, event keys cross-checked against `strings_es.js`, and a CDP-verified canvas loop. See proposal.md for motivation. This change introduces the first real gameplay decisions and the first numbers.

## Goals / Non-Goals

**Goals:**
- The 2-of-4 choice matters: labor now vs rest now is a genuine tension via the morale gate.
- The PRNG finally drives gameplay (jitter), and replay tests cover it end to end.
- All tuning constants in one clearly-marked block so 03+ can rebalance without hunting.

**Non-Goals:**
- No cash, runway, churn, events deck, or failure-by-bankruptcy (change 03). Morale-0 is an effective dead month, not a game over.
- No save/load UI; no focus carryover; no action unlocks.
- No animation or hover states beyond disabled/enabled.

## Decisions

### Numbers (integers, single BLOCK in core/game.js)
```
traction:   initial 0            morale: initial 80, clamp 0..100
BUILD_PRODUCT        base 8, morale -8
TALK_TO_CUSTOMERS    base 6, morale -5
PUBLISH_CONTENT      base 4, morale -3
REST                 morale +15, no draw, no traction
labor jitter         uniform integer in [-3, +3]
morale tier          high >= 67 -> 100% | medium >= 34 -> 50% (trunc) | low < 34 -> 0%
END_MONTH decay      5, with jitter in [-2, +2], clamped at 0
```
Rationale for base ordering: building is strongest but burns the team hardest, so no action strictly dominates; publish is the cheap pressure-valve. Tiers/thresholds are named constants (`TIER_HIGH_MIN`, `TIER_MEDIUM_MIN`), not magic numbers. Tradeoff: these are guesses — the mitigation is that they are data, not logic, and every number appears in events so playtest traces show real yields.

### PRNG draw accounting (determinism surface)
Draws happen only where rules need randomness: 1 draw per labor action **iff its tier yields > 0** (low morale = no roll, matching the spec scenario "no draw"), 0 draws for REST, 1 draw per END_MONTH decay. This keeps `rngState` progression identical across replays and makes the golden test's expectation auditable: a 24-month run of `REST×2 + END_MONTH` consumes exactly 24 draws. Alternative (always draw) rejected: it makes rng drift depend on invisible tier checks and complicates future golden vectors.

### Action cost model
Focus is the only cost gate; insufficient focus throws like unknown actions do today (caller must never see partial state). Actions at game-over throw via the existing terminal guard. `NEXT_MONTH` is removed outright rather than aliasing to END_MONTH — pre-release, no saves to migrate, and an alias would blur the "month closes explicitly" rule.

### State shape addition
`{ ...existing, focus: 2, focusPerMonth: 2, traction: 0, teamMorale: 80 }`. Kept flat (no nested resources object) because deep-freeze and replay diffing stay simpler and later changes can nest if fields multiply.

### Event contract for outcomes
One event per action: `{ key: 'evt.action_taken', params: { action, tractionDelta, moraleDelta } }` plus the existing month event on END_MONTH (`evt.month_advanced` / `evt.run_ended`). Deltas are the integers actually applied (after tier + jitter + clamps), so what the player reads is exactly what replay stores.

### UI hit regions and disabled affordance
Layout on the existing 800×450 canvas: HUD strip under the month box (focus dots, traction, morale bar tinted by tier), 4 action buttons in a row, END_MONTH below-right. Click routing: compute region from canvas coords scaled by CSS size (canvas may be shrunk by `max-width: 100%`). Disabled = focus 0 or gameOver: drawn 50% alpha + ignore click. Alternative (DOM buttons over canvas) rejected: keeps the "everything is hand-drawn canvas" promise and avoids layering/CSS drift.

### Tests
Update existing replay/terminal tests to END_MONTH; add: focus accounting (3rd action throws), tier table (boundary cases including exactly-at-threshold), trunc-halving (e.g. base 4 + jitter +1 = 5 -> 2 at medium), REST clamp at 100, decay clamp at 0, no-draw-at-low-tier (rngState unchanged), and the 24-draw run audit above. Renderer test extended for `evt.action_taken`.

## Risks / Trade-offs

- [Numbers unbalanced — 20-min runs with wrong tension feel bad] → single tuning block + deltas visible in events makes rebalance one-line; 03's bankruptcy pressure will also do balance work.
- [Morale-gate feels punishing rather than strategic at 0%] → acceptable for now: REST always available, visible tier coloring makes the rule learnable; retune after playtesting.
- [Scaling mouse coords with CSS-shrunk canvas] → scale factor computed from getBoundingClientRect on every click; unit-testable pure helper `hitRegion(x, y, layout)`.

## Open Questions

- Whether the 50% trunc or a rounding-up reads as fairer — playtest in 03; trunc chosen now because it's a stated core rule with a test.

# Spec Delta

## MODIFIED Requirements

### Requirement: Offer decision and expiry
While an offer is pending the player SHALL resolve it with `ACCEPT_ROUND` or `DECLINE_ROUND`; PITCH SHALL be rejected while pending. ACCEPT_ROUND SHALL add roundK to cash, append the investor to a frozen `investors` list with its investorPctBps and investedK, and set `founderPctBps` to the offer's `founderPctAfterBps` (never recomputed at accept time); it clears the offer and sets pitchCooldown to 2. DECLINE_ROUND SHALL clear the offer and set pitchCooldown to 2. END_MONTH with a pending offer SHALL expire it (offer cleared) without cash change and without setting the cooldown. Both decision actions SHALL cost no focus.

COUNTER_ROUND SHALL be a third offer action costing no focus and 20 founder energy, available only while an uncountered offer is pending and energy is at least 20; it draws the PRNG exactly once. On success (3 in 4) it SHALL reprice the pending offer keeping `preK`/`roundK`, setting investorPctBps to `trunc(investorPctBps * 4 / 5)` and recomputing founderPctAfterBps from the current founderPctBps, and SHALL mark the offer `countered` so a second counter is rejected. On the walk draw (1 in 4) it SHALL clear the offer and set pitchCooldown to 2. A countered offer is accepted or declined on its new terms with the same rules as any offer.

#### Scenario: Accept dilutes founder and adds cash
- **WHEN** ACCEPT_ROUND is applied to an offer of 4095 bps with cash 100
- **THEN** cash is 220 ($k), investors has one row at 4095 bps, and founderPctBps is trunc(10000 * 5905 / 10000) = 5905

#### Scenario: Decline keeps ownership
- **WHEN** DECLINE_ROUND is applied to any offer
- **THEN** cash, founderPctBps, and investors are unchanged, the offer is cleared, and pitchCooldown is 2

#### Scenario: Undecided offer expires at month end
- **WHEN** END_MONTH is applied while an offer is pending
- **THEN** the offer is null, cash is unchanged apart from normal flow, and pitchCooldown is 0

#### Scenario: Repeated dilution compounds with truncation
- **WHEN** two accepted rounds of 4095 and 2000 bps dilute a fresh founder
- **THEN** founderPctBps is trunc(trunc(10000 * 5905 / 10000) * 8000 / 10000) = 4724

#### Scenario: Successful counter improves the terms
- **WHEN** COUNTER_ROUND is applied to a pending offer of 4095 bps with energy 40
- **THEN** founderEnergy is 20, the offer keeps preK and roundK, its investorPctBps is trunc(4095 * 4 / 5) = 3276, founderPctAfterBps reflects 3276, and the offer is marked countered

#### Scenario: Walk-away draw kills the offer
- **WHEN** COUNTER_ROUND is applied on the 1-in-4 PRNG walk draw
- **THEN** the offer is null, pitchCooldown is 2, energy decreased by 20, and cash is unchanged

#### Scenario: One counter per offer
- **WHEN** COUNTER_ROUND is applied to an offer already marked countered
- **THEN** it is rejected and the state is unchanged

#### Scenario: Drained founder cannot negotiate
- **WHEN** COUNTER_ROUND is applied with founderEnergy 19 and an offer pending
- **THEN** it is rejected and the state is unchanged

#### Scenario: Counter is deterministic for the same seed
- **WHEN** the same pending offer and rngState are countered twice
- **THEN** both produce identical outcomes (walk or the same repriced offer) and identical rngState

# Spec Delta

## Purpose
Founder energy economy and the fundraising pipeline: pitching investors, receiving a priced term-sheet offer, and deciding it — money in, ownership out.

## ADDED Requirements

### Requirement: Founder energy
The core SHALL maintain `founderEnergy` as an integer in [0, 100] starting at 100. REST SHALL additionally restore +25 energy (clamped to 100) on top of its morale effect, and END_MONTH SHALL regenerate +10 (clamped to 100). PITCH SHALL be the only action that drains energy (−80, clamped to 0). No other action or month-end effect SHALL change energy, and energy changes SHALL NOT draw from the PRNG.

#### Scenario: Rest restores energy
- **WHEN** REST is applied at founderEnergy 60
- **THEN** founderEnergy is 85 and teamMorale increased as before

#### Scenario: Month end regenerates energy
- **WHEN** END_MONTH is applied at founderEnergy 20
- **THEN** the new month starts with founderEnergy 30

#### Scenario: Bootstrap actions leave energy untouched
- **WHEN** BUILD_PRODUCT, TALK_TO_CUSTOMERS, PUBLISH_CONTENT, CLOSE_CLIENT, or HIRE is applied
- **THEN** founderEnergy is unchanged

### Requirement: Pitch action and availability
`PITCH` SHALL be a player action costing 1 focus that drains 80 energy and sets a pending term-sheet offer. It SHALL be rejected without state change when focus is 0, month is below 6, a pitch cooldown is active, founderEnergy is below 40, or an offer is already pending. On success it SHALL emit an offer event carrying preK, roundK, and investorPctBps.

#### Scenario: Pitch produces an offer
- **WHEN** PITCH is applied at month 6 with focus > 0, cooldown 0, and energy 100
- **THEN** an offer is pending, focus decreased by 1, and founderEnergy is 20

#### Scenario: Too early to pitch
- **WHEN** PITCH is applied at month 5
- **THEN** it is rejected and the state is unchanged

#### Scenario: Drained founder cannot pitch
- **WHEN** PITCH is applied at founderEnergy 39
- **THEN** it is rejected and the state is unchanged

#### Scenario: Cooldown after a decided round
- **WHEN** PITCH is applied while pitchCooldown is 1
- **THEN** it is rejected and the state is unchanged

### Requirement: Offer pricing is integer math on traction and energy
The offer SHALL be priced by deterministic integer formulas: `preK = trunc((150 + 4 * traction) * mult)` where mult is ×2/3 when founderEnergy at pitch time (before the drain) is below 60, ×11/10 when it is 85 or above, and ×1 otherwise; `roundK` is fixed at 120; `investorPctBps = trunc(roundK * 10000 / (preK + roundK))`. The offer SHALL also carry `founderPctAfterBps` (the founder ownership the acceptance would produce, so the UI displays the panel without computing dilution). The offer SHALL be frozen and stored in state as `{ preK, roundK, investorPctBps, founderPctAfterBps }`. Pricing SHALL NOT draw from the PRNG.

#### Scenario: Burned-out pitch sells cheaper
- **WHEN** PITCH is applied at traction 50 and founderEnergy 40
- **THEN** preK is trunc((150 + 200) * 2 / 3) = 233 and dilution is larger than the same pitch at energy 100

#### Scenario: Fresh founder gets the hot tier
- **WHEN** PITCH is applied at traction 0 and founderEnergy 85
- **THEN** preK is trunc(150 * 11 / 10) = 165

#### Scenario: Same state prices the same offer
- **WHEN** PITCH is applied twice to identical states
- **THEN** both produce identical offers and identical rngState

### Requirement: Offer decision and expiry
While an offer is pending the player SHALL resolve it with `ACCEPT_ROUND` or `DECLINE_ROUND`; PITCH SHALL be rejected while pending. ACCEPT_ROUND SHALL add roundK to cash, append the investor to a frozen `investors` list with its investorPctBps and investedK, and set `founderPctBps` to the offer's `founderPctAfterBps` (never recomputed at accept time); it clears the offer and sets pitchCooldown to 2. DECLINE_ROUND SHALL clear the offer and set pitchCooldown to 2. END_MONTH with a pending offer SHALL expire it (offer cleared) without cash change and without setting the cooldown. Both decision actions SHALL cost no focus.

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

### Requirement: Cap table in state
The state SHALL carry `founderPctBps` (initially 10000) and a frozen ordered `investors` list of `{ name, pctBps, investedK }` rows in acceptance order. Ownership SHALL be expressed only in integer basis points; the UI SHALL be able to derive founder and each investor percentage from these integers.

#### Scenario: Fresh run is founder-owned
- **WHEN** a game is created
- **THEN** founderPctBps is 10000 and investors is empty

#### Scenario: Investors keep their rows after later rounds
- **WHEN** a second round is accepted after the first
- **THEN** both investor rows remain, in acceptance order, with their original bps

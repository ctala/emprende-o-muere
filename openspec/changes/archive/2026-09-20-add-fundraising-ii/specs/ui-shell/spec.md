# Spec Delta

## MODIFIED Requirements

### Requirement: Offer decision panel
While a term-sheet offer is pending the UI SHALL render a panel derived only from the offer state: pre-money, round size, investor percentage and resulting founder percentage, all read from the integers carried in the offer (the UI SHALL NOT compute dilution itself). The panel SHALL expose three hit-region buttons — ACCEPT, DECLINE and NEGOCIAR — dispatching ACCEPT_ROUND / DECLINE_ROUND / COUNTER_ROUND respectively, and no other action button SHALL dispatch while the panel is open. The NEGOCIAR button SHALL show its energy cost and that the investor may walk away, and SHALL be drawn disabled and dispatch nothing when the offer is already countered or founder energy is below 20. After a successful counter the panel SHALL re-render with the improved terms from the offer and a disabled NEGOCIAR button. After the decision the panel SHALL disappear and the run log SHALL contain the decision action like any other click.

#### Scenario: Offer shows the dilution math
- **WHEN** an offer of preK 173, roundK 120 is pending
- **THEN** the panel shows investor 40% and founder-to-be 59% derived from investorPctBps

#### Scenario: Accept click injects the round
- **WHEN** the player clicks ACCEPT on a pending offer
- **THEN** the canvas re-renders with cash increased, the panel gone, and the ownership HUD updated

#### Scenario: Decline click clears the panel
- **WHEN** the player clicks DECLINE on a pending offer
- **THEN** the panel is gone, cash is unchanged, and other buttons are clickable again

#### Scenario: Negotiate click improves the shown terms
- **WHEN** the player clicks NEGOCIAR on an uncountered offer with energy >= 20 and the investor does not walk
- **THEN** the panel re-renders with lower investor % and a disabled NEGOCIAR button, and the energy HUD dropped by 20

#### Scenario: Walk-away closes the panel
- **WHEN** the player clicks NEGOCIAR and the investor walks
- **THEN** the panel is gone, cash is unchanged, and the pitch button is disabled by cooldown

#### Scenario: Counter disabled when drained or used
- **WHEN** founder energy is below 20, or the pending offer is already countered
- **THEN** the NEGOCIAR button is drawn disabled and clicking it changes nothing

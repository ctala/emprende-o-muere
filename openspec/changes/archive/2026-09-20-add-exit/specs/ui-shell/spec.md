# Spec Delta

## MODIFIED Requirements

### Requirement: Terminal screen states the reason
On game-over the UI SHALL distinguish, from the core terminal reason only, at least the `survived` (reached month 24) and `bankrupt` endings, with distinct copy from the strings content. On a `survived` end the UI SHALL render a settlement ledger from the run-ended event params only (no UI math): final valuation, founder ownership %, equity payout, whether the company cash was cashed out, and the personal total. Bankruptcy shows its own line with no ledger.

#### Scenario: Bankruptcy shown
- **WHEN** the run ends with reason `bankrupt`
- **THEN** the canvas shows the bankruptcy message instead of the survive message

#### Scenario: Survival shown
- **WHEN** the run ends with reason `survived`
- **THEN** the canvas shows the survival message

#### Scenario: Settlement ledger rendered from event facts
- **WHEN** a survived run-ended event carries valuationK 350, founderPctBps 4210, payoutK 147, cashK 0, personalK 147
- **THEN** the terminal screen shows those values in Spanish, and the cash-out line is absent (no control)

#### Scenario: Cash-out line appears for controllers
- **WHEN** the settlement params carry a personalK that exceeds payoutK
- **THEN** the ledger includes the company-cash line explaining the difference

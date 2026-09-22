# Spec Delta

## MODIFIED Requirements

### Requirement: HUD shows focus, traction and morale
The UI SHALL render, from core state only, the remaining focus for the month, the traction value, the team morale value, the cash balance in thousands of dollars, the runway in months (`floor(cash / effective burn)` where effective burn is profile burn plus team salaries), the hired roles of the current team, the founder energy bar, and the founder ownership percentage (founderPctBps converted to % for display), using labels from the centralized strings content. Morale SHALL be visually differentiated by tier (high/medium/low) so the effectiveness gate is perceivable without reading numbers. Cash at or below one effective burn SHALL be visually alarming (e.g., red). Energy below 60 SHALL be visually differentiated from fresh energy (85 and above), matching the pitch pricing tiers.

#### Scenario: HUD reflects state after actions
- **WHEN** the player spends both focus points on actions
- **THEN** the HUD shows focus 0 and updated traction/morale values

#### Scenario: HUD resets on new month
- **WHEN** END_MONTH is applied
- **THEN** the HUD shows focus 2 again

#### Scenario: Runway follows cash
- **WHEN** cash is 45 ($k) and burn is 15
- **THEN** the HUD shows runway 3 months

#### Scenario: Runway drops when hiring
- **WHEN** CTO (salary 6) is hired and cash is 45 ($k)
- **THEN** the HUD shows runway 2 months against effective burn 21

#### Scenario: Team visible on HUD
- **WHEN** any role has been hired
- **THEN** the HUD lists the role labels from the strings content

#### Scenario: Energy visible and tier-differentiated
- **WHEN** founderEnergy is 40 after a pitch
- **THEN** the HUD shows the energy bar in its drained style, distinct from the fresh style at 85 or above

#### Scenario: Ownership visible after a round
- **WHEN** a round at 4095 bps has been accepted
- **THEN** the HUD shows founder ownership 59%

### Requirement: Click advances the month
Canvas clicks SHALL be routed by hit region: clicking one of the five action buttons or the HIRE button dispatches that core action and re-renders; clicking the PITCH button dispatches PITCH; clicking the END_MONTH button dispatches END_MONTH and re-renders; clicks on empty canvas do nothing. Buttons whose action the player cannot currently afford (focus 0; for CLOSE_CLIENT traction below its perk-resolved cost; for HIRE cash below the next role's sign-on or all roles already hired; for PITCH month below 6, cooldown active, energy below 40, or an offer already pending) or after game-over SHALL be drawn disabled and SHALL dispatch nothing. The HIRE button SHALL target the next unhired role in progression order VENTAS -> CTO -> CFO -> CPO, showing the role's name, sign-on cost, and new effective burn in its label.

After a dispatched action leaves the game with focus 0 and not game-over, the UI SHALL automatically dispatch END_MONTH after a short fixed delay (about 600 ms) so the player can read the action outcome first; during that delay player input SHALL be ignored and the closing state SHALL be visually indicated. The auto-dispatch SHALL NOT fire while a term-sheet offer is pending, so the player always gets to decide the offer before the month (and the offer) expires; the manual END_MONTH button SHALL also be hidden or disabled while an offer is pending. The manual END_MONTH button SHALL remain available at any other focus level, so closing a month early with focus left stays possible, and the auto-dispatch SHALL NOT prevent or replace that manual path. Auto-dispatched END_MONTH SHALL be dispatched to the core exactly like a click, keeping the run log and replays unchanged.

#### Scenario: Click advances and re-renders
- **WHEN** the player clicks the END_MONTH button at month N with a non-game-over state
- **THEN** the canvas re-renders showing month N+1 with focus reset

#### Scenario: Action button dispatches its action
- **WHEN** the player clicks the BUILD_PRODUCT button with focus > 0
- **THEN** the canvas re-renders reflecting the new traction, morale and focus

#### Scenario: End-month button advances the run
- **WHEN** the player clicks the END_MONTH button
- **THEN** the canvas re-renders showing the next month with focus back to 2

#### Scenario: Empty clicks do nothing
- **WHEN** the player clicks outside all buttons
- **THEN** the displayed state does not change

#### Scenario: Clicks ignored after game over
- **WHEN** the player clicks any button after the run reached month 24 and ended
- **THEN** the displayed state does not change

#### Scenario: Spending the last focus closes the month automatically
- **WHEN** the player dispatches an action that brings focus to 0 and the game is not over
- **THEN** after roughly 600 ms the month closes on its own, showing month N+1 with focus back to 2

#### Scenario: Input during the auto-close delay is ignored
- **WHEN** the player clicks any button during the auto-close delay
- **THEN** the displayed state changes only as a result of the automatic END_MONTH, with no extra action applied

#### Scenario: Early manual close still works
- **WHEN** the player clicks END_MONTH with focus remaining
- **THEN** the month closes immediately and the focus left is not granted

#### Scenario: Close-client button disabled without traction
- **WHEN** traction is below the CLOSE_CLIENT cost
- **THEN** the CLOSE_CLIENT button is drawn disabled and clicking it changes nothing

#### Scenario: Hire button follows progression order
- **WHEN** nobody is hired and the next role is affordable
- **THEN** the HIRE button shows VENTAS and clicking it hires VENTAS

#### Scenario: Hire button disabled when unaffordable or complete
- **WHEN** cash is below the next role's sign-on, or all four roles are hired
- **THEN** the HIRE button is drawn disabled and clicking it changes nothing

#### Scenario: Pitch button disabled by its own gate
- **WHEN** month is below 6, cooldown is active, energy is below 40, or an offer is pending
- **THEN** the PITCH button is drawn disabled and clicking it changes nothing

#### Scenario: Auto-close waits for an undecided offer
- **WHEN** a PITCH leaves focus 0 with an offer pending
- **THEN** the month does not auto-close and the offer decision panel stays on screen until the player decides

## ADDED Requirements

### Requirement: Offer decision panel
While a term-sheet offer is pending the UI SHALL render a panel derived only from the offer state: pre-money, round size, investor percentage and resulting founder percentage, all read from the integers carried in the offer (the UI SHALL NOT compute dilution itself). The panel SHALL expose two hit-region buttons, ACCEPT and DECLINE, dispatching ACCEPT_ROUND / DECLINE_ROUND respectively, and no other action button SHALL dispatch while the panel is open. After the decision the panel SHALL disappear and the run log SHALL contain the decision action like any other click.

#### Scenario: Offer shows the dilution math
- **WHEN** an offer of preK 173, roundK 120 is pending
- **THEN** the panel shows investor 40% and founder-to-be 59% derived from investorPctBps

#### Scenario: Accept click injects the round
- **WHEN** the player clicks ACCEPT on a pending offer
- **THEN** the canvas re-renders with cash increased, the panel gone, and the ownership HUD updated

#### Scenario: Decline click clears the panel
- **WHEN** the player clicks DECLINE on a pending offer
- **THEN** the panel is gone, cash is unchanged, and other buttons are clickable again

# Spec Delta

## REMOVED Requirements

### Requirement: Canvas month display
**Reason**: the fixed 800×450 hand-drawn canvas is the root cause of the mobile legibility failure confirmed by the synthetic panel round 1 (7 flagged frictions) and the owner (393×221 CSS px strip, ~6px text). It is replaced by the responsive DOM presentation requirements below.
**Migration**: all presentation moves to DOM at real text sizes; `core/`, `renderer.render(event) -> string`, and `content/strings_es.js` are unchanged. Frozen-coordinate canvas tests retire in favor of DOM structure tests.

#### Scenario: No canvas remains
- **WHEN** the redesigned shell is served and inspected
- **THEN** the game surface contains no canvas element and none of its DOM state is drawn from rasterized pixels

## ADDED Requirements

### Requirement: Responsive DOM presentation
The UI SHALL render game state as DOM elements (no canvas), readable without zoom on a 393px-wide portrait phone at default browser settings and scalable via browser zoom. The presentation SHALL be portrait-primary: portrait shows a single page (state column above a single-column action list ending in a sticky Cerrar mes + Pitch footer); landscape/desktop (>=700px) shows two columns of the same content — state left, actions right — with the event log spanning both. Touch targets SHALL be at least 48x48 CSS pixels and honor safe-area insets. The presentation SHALL depend only on core state plus the existing UI-only layers (offer modal, help, library), never on device type beyond viewport width, and SHALL NOT change game state or draw randomness.

#### Scenario: Portrait phone renders readable primary layout
- **WHEN** a fresh game loads at 393x852
- **THEN** all month/state text renders at >= 16 CSS px, the action list is a single column of full-width rows, and no content is clipped or horizontally scrollable

#### Scenario: Landscape reflows to two columns
- **WHEN** the same game is viewed at 844x390
- **THEN** the state and action groups sit side by side and the log spans the full width

#### Scenario: Every action stays reachable at every size
- **WHEN** the shell is rendered at 393x852, 844x390, and 1024x768
- **THEN** every action that the rules allow is present as an enabled element with a >= 48px target, and dispatching through the DOM updates core state identically to the previous canvas path

#### Scenario: Presentation never touches the core
- **WHEN** the DOM view renders the same state twice
- **THEN** two consecutive renders are byte-identical in structure and no core serialization changed

### Requirement: Runway hero and explicit burn
The UI SHALL present runway ("meses de vida") as the most prominent number of the state group (largest type weight/size in the header area), derived exactly from core state (`floor(cash / effective burn)`), with the effective burn itself displayed in plain Spanish next to cash. When runway drops to 2 months or fewer, the hero SHALL take the alarm treatment (ledger red, high contrast).

#### Scenario: Runway dominates the header
- **WHEN** a fresh game renders
- **THEN** the runway value is the largest numeric element in the state group and its gloss "meses de vida" appears adjacent

#### Scenario: Burn is explicit
- **WHEN** a hire raises the monthly cost
- **THEN** the burn value shown in the header updates to the new effective monthly figure without the player computing it

#### Scenario: Hero alarms when thin
- **WHEN** runway is 2 or fewer months
- **THEN** the runway hero renders in the alarm treatment distinct from normal ink

### Requirement: Hierarchical action rows with inline reason
Action buttons SHALL render as ledger rows with hierarchy: the core-loop actions (build, talk, publish) visually outweigh service actions (rest, close, hire) and the close-month/pitch footer. Every disabled action SHALL state its reason as inline text built from core-derived facts (e.g. traction needed, month not reached, energy cost), never by contrast drop alone, and SHALL remain discoverable as disabled.

#### Scenario: Core loop outweighs utilities
- **WHEN** the action list renders
- **THEN** primary actions carry the stronger treatment (weight/size/accent) and utility actions the lighter one

#### Scenario: Disabled rows explain themselves
- **WHEN** Close client is disabled for low traction
- **THEN** the row shows a reason line mentioning the required traction amount and contrast alone is not the only cue

### Requirement: Shareable terminal screen
On game over the UI SHALL render a stamp-styled terminal screen readable in a single glance as a shareable artifact: outcome stamp (Sobreviviste / Quebraste), the run's headline number, the learned one-liner from the learnings copy when available, and the settlement ledger for survived runs. The terminal copy SHALL be a single coherent block such that selecting it (or the page) reads as a post worth forwarding in a WhatsApp group. The document head SHALL expose the name, description, and social preview meta sufficient for a link preview.

#### Scenario: Terminal reads as a share card
- **WHEN** a run ends bankrupt at month 9
- **THEN** the screen shows the Quebraste stamp, the month and headline facts, and the learning line, as one glanceable block

#### Scenario: Link preview exists
- **WHEN** the page is loaded
- **THEN** the head contains title, description and og-style preview metadata with the Spanish game name

## MODIFIED Requirements

### Requirement: Click advances the month
Taps/clicks SHALL be routed by interactive DOM elements: activating one of the action rows or the HIRE row dispatches that core action and re-renders; activating the PITCH row dispatches PITCH; activating Cerrar mes dispatches END_MONTH and re-renders; activating inactive or disabled elements dispatches nothing. Buttons whose action the player cannot currently afford (focus 0; for CLOSE_CLIENT traction below its perk-resolved cost; for HIRE cash below the next role's sign-on or all roles already hired; for PITCH month below 6, cooldown active, energy below 40, or an offer already pending) or after game-over SHALL be rendered disabled (with inline reason per the hierarchical-rows requirement) and SHALL dispatch nothing. The HIRE button SHALL target the next unhired role in progression order VENTAS -> CTO -> CFO -> CPO, showing the role's name, sign-on cost, and new effective burn in its label.

After a dispatched action leaves the game with focus 0 and not game-over, the UI SHALL automatically dispatch END_MONTH after a short fixed delay (about 600 ms) so the player can read the action outcome first; during that delay player input SHALL be ignored and the closing state SHALL be visually indicated. The auto-dispatch SHALL NOT fire while a term-sheet offer is pending, so the player always gets to decide the offer before the month (and the offer) expires; the manual END_MONTH button SHALL also be hidden or disabled while an offer is pending. The manual END_MONTH button SHALL remain available at any other focus level, so closing a month early with focus left stays possible, and the auto-dispatch SHALL NOT prevent or replace that manual path. Auto-dispatched END_MONTH SHALL be dispatched to the core exactly like a click, keeping the run log and replays unchanged.

#### Scenario: Click advances and re-renders
- **WHEN** the player activates the Cerrar mes row at month N with a non-game-over state
- **THEN** the view updates to month N+1 with focus reset

#### Scenario: Action button dispatches its action
- **WHEN** the player activates the Construir producto row with focus > 0
- **THEN** the view updates reflecting the new traction, morale and focus

#### Scenario: End-month button advances the run
- **WHEN** the player activates the Cerrar mes row
- **THEN** the view updates to month N+1 with focus back to 2

#### Scenario: Empty clicks do nothing
- **WHEN** the player taps outside interactive elements
- **THEN** the displayed state does not change

#### Scenario: Clicks ignored after game over
- **WHEN** the player activates any control after the run reached month 24 and ended
- **THEN** the displayed state does not change

#### Scenario: Spending the last focus closes the month automatically
- **WHEN** the player dispatches an action that brings focus to 0 and the game is not over
- **THEN** after roughly 600 ms the month closes on its own, showing month N+1 with focus back to 2

#### Scenario: Input during the auto-close delay is ignored
- **WHEN** the player activates controls during the auto-close delay
- **THEN** the displayed state changes only as a result of the automatic END_MONTH, with no extra action applied

#### Scenario: Early manual close still works
- **WHEN** the player activates Cerrar mes with focus remaining
- **THEN** the month closes immediately and the focus left is not granted

#### Scenario: Close-client button disabled without traction
- **WHEN** traction is below the CLOSE_CLIENT cost
- **THEN** the row is rendered disabled with its inline reason and clicking it changes nothing

#### Scenario: Hire button follows progression order
- **WHEN** nobody is hired and the next role is affordable
- **THEN** the HIRE row shows VENTAS and clicking it hires VENTAS

#### Scenario: Hire button disabled when unaffordable or complete
- **WHEN** cash is below the next role's sign-on, or all four roles are hired
- **THEN** the HIRE row is rendered disabled with its reason and clicking it changes nothing

#### Scenario: Pitch button disabled by its own gate
- **WHEN** month is below 6, cooldown is active, energy is below 40, or an offer is pending
- **THEN** the PITCH row is rendered disabled with its reason and clicking it changes nothing

#### Scenario: Auto-close waits for an undecided offer
- **WHEN** a PITCH leaves focus 0 with an offer pending
- **THEN** the month does not auto-close and the offer decision panel stays on screen until the player decides

### Requirement: HUD shows focus, traction and morale
The UI SHALL render, from core state only, the remaining focus for the month (labeled in plain Spanish, not jargon), the traction value, the team morale value (with its numeric value visible, not only a bar), the cash balance in thousands of dollars with the effective monthly burn shown explicitly beside it, the runway in months as the hero value (`floor(cash / effective burn)`), the hired roles of the current team, the founder energy bar, and the founder ownership percentage (founderPctBps converted to % for display), using labels from the centralized strings content. Morale SHALL be visually differentiated by tier (high/medium/low) so the effectiveness gate is perceivable, with the tier thresholds named in plain text at least in the help screen. Cash at or below one effective burn SHALL be visually alarming. Energy below 60 SHALL be visually differentiated from fresh energy (85 and above), matching the pitch pricing tiers. All HUD values SHALL meet the text contrast and size floors of the responsive DOM presentation requirement.

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

#### Scenario: Focus label is plain Spanish
- **WHEN** a fresh game renders the HUD
- **THEN** the focus label is the plain Spanish string (no bare dots), and the help text matches it

#### Scenario: Morale shows its number
- **WHEN** the HUD renders morale
- **THEN** the numeric value appears next to the bar, readable at >= 16 CSS px on a phone

### Requirement: Terminal screen states the reason
On game-over the UI SHALL distinguish, from the core terminal reason only, at least the `survived` (reached month 24) and `bankrupt` endings, with distinct copy from the strings content. On a `survived` end the UI SHALL render a settlement ledger from the run-ended event params only (no UI math): final valuation, founder ownership %, equity payout, whether the company cash was cashed out, and the personal total. Bankruptcy shows its own line with no ledger. The terminal screen SHALL also satisfy the shareable terminal screen requirement (glanceable stamp block plus the learning one-liner when one was unlocked).

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

### Requirement: Offer decision panel
While a term-sheet offer is pending the UI SHALL render a panel derived only from the offer state: pre-money, round size, investor percentage and resulting founder percentage, all read from the integers carried in the offer (the UI SHALL NOT compute dilution itself). The panel SHALL expose three actions — ACCEPT, DECLINE and NEGOCIAR — dispatching ACCEPT_ROUND / DECLINE_ROUND / COUNTER_ROUND respectively, and no other action button SHALL dispatch while the panel is open. As a modal dialog over the game, it SHALL trap player focus until decided: the month does not auto-close and the rest of the game is inert while it is visible. The NEGOCIAR action SHALL show its energy cost and that the investor may walk away, and SHALL be drawn disabled with its reason (energy or already-countered) and dispatch nothing when the rules say so. After a successful counter the panel SHALL re-render with the improved terms from the offer and a disabled NEGOCIAR action. After the decision the panel SHALL disappear and the run log SHALL contain the decision action like any other click. On phones the panel SHALL be reachable by thumb (buttons at or near the lower half of the screen) at >= 48px targets.

#### Scenario: Offer shows the dilution math
- **WHEN** an offer of preK 173, roundK 120 is pending
- **THEN** the panel shows investor 40% and founder-to-be 59% derived from investorPctBps

#### Scenario: Accept click injects the round
- **WHEN** the player clicks ACCEPT on a pending offer
- **THEN** the game re-renders with cash increased, the panel gone, and the ownership HUD updated

#### Scenario: Decline click clears the panel
- **WHEN** the player clicks DECLINE on a pending offer
- **THEN** the panel is gone, cash is unchanged, and other actions are clickable again

#### Scenario: Negotiate click improves the shown terms
- **WHEN** the player clicks NEGOCIAR on an uncountered offer with energy >= 20 and the investor does not walk
- **THEN** the panel re-renders with lower investor % and a disabled NEGOCIAR action, and the energy HUD dropped by 20

#### Scenario: Walk-away closes the panel
- **WHEN** the player clicks NEGOCIAR and the investor walks
- **THEN** the panel is gone, cash is unchanged, and the pitch action is disabled by cooldown with its reason shown

#### Scenario: Counter disabled when drained or used
- **WHEN** founder energy is below 20, or the pending offer is already countered
- **THEN** the NEGOCIAR action is rendered disabled with its reason and clicking it changes nothing

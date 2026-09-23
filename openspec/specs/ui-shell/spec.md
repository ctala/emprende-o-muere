# ui-shell Specification

## Purpose
The browser presentation layer: renders core state as responsive DOM (portrait-first phone layout, ledger identity in CSS), maps player input to core actions, and turns core semantic events into visible text through a swappable renderer interface.

## Requirements

### Requirement: UI consumes core only
The UI layer SHALL depend on the core in one direction only: it reads game state and dispatches actions. The core SHALL have no import of, or reference to, UI modules, DOM, `window`, or canvas.

#### Scenario: Core import graph is clean
- **WHEN** the core modules are imported in a plain Node process with no DOM
- **THEN** they load and run without errors



### Requirement: Click advances the month
Taps/clicks SHALL be routed by interactive DOM elements: activating one of the action rows or the HIRE row dispatches that core action and re-renders; activating the PITCH row dispatches PITCH; activating Cerrar mes dispatches END_MONTH and re-renders; activating inactive or disabled elements dispatches nothing. Buttons whose action the player cannot currently afford (focus 0; for CLOSE_CLIENT traction below its perk-resolved cost or the MVP not yet built; for HIRE cash below the next role's sign-on or all roles already hired; for PITCH month below 6, cooldown active, energy below 40, or an offer already pending) or after game-over SHALL be rendered disabled (with inline reason per the hierarchical-rows requirement) and SHALL dispatch nothing. The HIRE button SHALL target the next unhired role in progression order VENTAS -> CTO -> CFO -> CPO, showing the role's name, sign-on cost, and new effective burn in its label.

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
- **WHEN** the MVP is built and traction is below the CLOSE_CLIENT cost
- **THEN** the row is rendered disabled with its inline reason and clicking it changes nothing

#### Scenario: Close-client button disabled before the MVP
- **WHEN** `mvpBuilds` is below the MVP constant and traction is sufficient
- **THEN** the row is rendered disabled with an inline reason naming the missing product, and clicking it changes nothing

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


### Requirement: Event renderer interface
Player-visible text from events SHALL be produced through a renderer interface `render(event) -> string` resolved via string keys. The default implementation SHALL be a deterministic template renderer over the strings content. The interface SHALL be structured so additional renderers can be added later without modifying core or event shapes.

#### Scenario: Deterministic default rendering
- **WHEN** an event is rendered with the default renderer
- **THEN** the output text comes only from the strings content and event params

#### Scenario: Same event renders identically twice
- **WHEN** the same event object is rendered twice
- **THEN** the outputs are identical



### Requirement: HUD shows focus, traction and morale
The UI SHALL render, from core state only, the remaining focus for the month
(labeled in plain Spanish, not jargon), the leads value labeled in plain
Spanish as interested contacts (traction renamed in the player's language;
core field name unchanged), the active client-contract count derived from state
(plain Spanish, distinct from the leads label), the team morale value (with its
numeric value visible, not only a bar), the cash balance in thousands of
dollars with the effective monthly burn shown explicitly beside it as a
decomposition into named parts (base burn plus each team role's salary) summing
to the effective burn, the runway in months as the hero value
(`floor(cash / effective burn)`), the hired roles of the current team, the
founder energy bar, and the founder ownership percentage (founderPctBps
converted to % for display), using labels from the centralized strings
content. Morale SHALL be visually differentiated by tier (high/medium/low) so
the effectiveness gate is perceivable, with the tier thresholds named in plain
text at least in the help screen. Cash at or below one effective burn SHALL be
visually alarming. Energy below 60 SHALL be visually differentiated from fresh
energy (85 and above), matching the pitch pricing tiers. All HUD values SHALL
meet the text contrast and size floors of the responsive DOM presentation
requirement.

#### Scenario: HUD reflects state after actions
- **WHEN** the player spends both focus points on actions
- **THEN** the HUD shows focus 0 and updated leads/morale values

#### Scenario: HUD resets on new month
- **WHEN** END_MONTH is applied
- **THEN** the HUD shows focus 2 again

#### Scenario: Runway follows cash
- **WHEN** cash is 45 ($k) and burn is 15
- **THEN** the HUD shows runway 3 months

#### Scenario: Runway drops when hiring
- **WHEN** CTO is hired and cash is 45 ($k)
- **THEN** the HUD shows runway 2 months against the new effective burn

#### Scenario: Team visible on HUD
- **WHEN** any role has been hired
- **THEN** the HUD lists the role labels from the strings content

#### Scenario: Energy visible and tier-differentiated
- **WHEN** founderEnergy is 40 after a pitch
- **THEN** the HUD shows the energy bar in its drained style, distinct from the
  fresh style at 85 or above

#### Scenario: Ownership visible after a round
- **WHEN** a round at 4095 bps has been accepted
- **THEN** the HUD shows founder ownership 59%

#### Scenario: Focus label is plain Spanish
- **WHEN** a fresh game renders the HUD
- **THEN** the focus label is the plain Spanish string (no bare dots), and the
  help text matches it

#### Scenario: Morale shows its number
- **WHEN** the HUD renders morale
- **THEN** the numeric value appears next to the bar, readable at >= 16 CSS px
  on a phone

#### Scenario: Pipeline labeled as interested customers
- **WHEN** a fresh game renders the HUD
- **THEN** the traction field carries the plain-Spanish interested-contacts
  (leads) label from the strings content, not the raw jargon word

#### Scenario: Leads and clients are named differently
- **WHEN** a game has signed contracts and interested contacts
- **THEN** the leads field and the client-contract field carry distinct plain-
  Spanish labels from the strings content, and neither reuses the word for the
  other

#### Scenario: Burn is shown as a breakdown
- **WHEN** a team is hired
- **THEN** the burn shows the base plus one labeled part per role, and the
  parts sum visibly to the same total the runway divides by


### Requirement: Terminal screen states the reason
On game-over the UI SHALL distinguish, from the core terminal reason only, at least the `survived` (reached month 24) and `bankrupt` endings, with distinct copy from the strings content. On a `survived` end the UI SHALL render a settlement ledger from the run-ended event params only (no UI math): final valuation, founder ownership %, equity payout, whether the company cash was cashed out, and the personal total. Bankruptcy shows its own line with no ledger. The terminal screen SHALL also satisfy the shareable terminal screen requirement (glanceable stamp block plus the learning one-liner when one was unlocked).

#### Scenario: Bankruptcy shown
- **WHEN** the run ends with reason `bankrupt`
- **THEN** the terminal screen shows the bankruptcy message instead of the survive message

#### Scenario: Survival shown
- **WHEN** the run ends with reason `survived`
- **THEN** the terminal screen shows the survival message

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



### Requirement: Run learnings
The UI layer SHALL observe the event stream of every run and unlock learning entries when their triggers fire: `first_bankrupt` (run ends with reason bankrupt), `first_round` (a round is accepted), `drained_deal` (a round is accepted from an offer priced at the drained tier), `investor_walked` (a counter walk event occurs), `offer_expired` (an undecided offer expires), `first_hire` (a role is hired), `broke_while_funded` (bankruptcy occurs while the cap table has investors), `lost_control_survivor` (survived with founder ownership below 50%). Unlocking SHALL be idempotent (repeating a trigger does not duplicate), SHALL NOT change game state or draw randomness, and SHALL be implemented entirely in the UI layer: the core SHALL have no import of, or reference to, any learning code. Unlocked ids SHALL persist across sessions through a storage adapter (localStorage in the browser) injected into the learnings module, and unlock tests SHALL run in plain Node against a fake adapter.

#### Scenario: Bankruptcy unlocks its lesson
- **WHEN** a run emits a run-ended event with reason `bankrupt`
- **THEN** `first_bankrupt` is in the unlocked set after processing and persists to the adapter

#### Scenario: Double trigger unlocks once
- **WHEN** the same trigger event is processed twice
- **THEN** the unlocked set contains the id exactly once and the adapter payload is unchanged by the second pass

#### Scenario: Learnings cannot alter the run
- **WHEN** the learnings processor handles any event sequence
- **THEN** no game state is read or written and the sequence replays byte-identical without the learnings layer

#### Scenario: Persistence survives reload
- **WHEN** a page reloads and the storage adapter returns previously stored ids
- **THEN** the library shows those entries as discovered without replaying any run



### Requirement: Library screen
The UI SHALL offer a library screen, toggled from a button outside the action area, listing every learning entry with the Spanish text from the strings content when discovered and an unknown-placeholder ("???") when not. Opening the library SHALL block game-input dispatch (like the offer panel) and closing it SHALL restore it. The library SHALL reveal information only: discovering entries SHALL NOT unlock or disable any action, price, or perk in any run.

#### Scenario: Undiscovered entries show placeholders
- **WHEN** the library opens with zero learnings stored
- **THEN** every row shows the unknown placeholder and none shows its text

#### Scenario: Library blocks gameplay input
- **WHEN** the library is open and the player clicks where an action button is
- **THEN** no action is dispatched while the library is open

#### Scenario: Closing the library restores play
- **WHEN** the player clicks the close control
- **THEN** the normal month screen renders and action buttons dispatch again

#### Scenario: Discovery grants no mechanical effect
- **WHEN** all learnings are unlocked and a new run starts
- **THEN** game state matches a run started with an empty library (identical createGame serialization)



### Requirement: Help legend screen
The UI SHALL offer a help screen ("¿Cómo se juega?") toggled from a "?" button
placed outside the action grid (like the library button), listing, from the
strings content only: what each HUD metric means in the same plain words the
HUD itself uses (after the jargon pass the legend explains the plain terms —
Contactos vs Clientes, Alcanza's no-new-money assumption, Gastos, Moral —
rather than glossing English venture terms, because the HUD no longer shows
them), what each action does with its costs, what the team does on its own
every month (pipeline production and sales auto-close), what the cash-flow
projection shows and assumes (founder does nothing, each contract pays once),
and the rules that disable actions (morale tiers, pitch availability, hire
affordability, closing contact cost, the MVP requirement before signing).
Opening help SHALL block game-input dispatch while open and closing it SHALL
restore normal dispatch. A first-run hint pointing at the "?" SHALL show only
when no learning has ever been unlocked and help has never been opened, SHALL
disappear permanently once help is opened, and its seen-state SHALL persist
through the same storage adapter as learnings. The "?" toggle SHALL present a
>= 48x48 CSS px touch target on any device. The help screen SHALL NOT change
game state or draw randomness.

#### Scenario: Help lists metrics, actions and locks
- **WHEN** help is opened on a fresh game
- **THEN** the screen shows a line for each HUD metric, each action, and each
  lock rule, in Spanish

#### Scenario: Venture terms are glossed
- **WHEN** help is open
- **THEN** the plain-Spanish vocabulary the HUD shows (Alcanza, Gastos,
  Contactos, Dueño) is the same vocabulary the legend explains — after the
  jargon pass there are no English venture terms left to gloss

#### Scenario: Help explains what the team does alone
- **WHEN** help is open
- **THEN** the screen states that the team feeds the pipeline and Ventas closes
  deals without a founder click, and that a product (MVP) must be built before
  any client signs

#### Scenario: Help distinguishes leads from clients
- **WHEN** help is open
- **THEN** the screen states that contactos are interested contacts and clientes
  are signed contracts that each pay once

#### Scenario: Help explains the projection
- **WHEN** help is open
- **THEN** the screen states that the cash-flow panel assumes the founder does
  nothing and shows when cash is projected to run out

#### Scenario: Help blocks gameplay input while open
- **WHEN** help is open and the player clicks where an action button is
- **THEN** no action is dispatched and the game state is unchanged

#### Scenario: First-run hint points to help and retires on first open
- **WHEN** a game starts with no stored learnings and help never opened
- **THEN** a one-line hint to press "?" appears; after help has been opened once
  (even across a reload), the hint never shows again

#### Scenario: Help grants no mechanical effect
- **WHEN** help is opened, closed, and the month is played
- **THEN** game state evolves identically to the same actions played without
  opening help

### Requirement: Automated-run boot contract
The shell SHALL signal completed boot in the DOM: after the entry module finishes state creation, input wiring, and the first render, an element marked as the boot marker SHALL exist in the document (absent before wiring completes). The shell SHALL additionally accept an integer `seed` query parameter on its own URL so an automated run can reproduce a game deterministically; without the parameter the game uses its default seed behavior unchanged. The seed override SHALL NOT alter game rules, only the seed given to game creation, and SHALL be ignored (default behavior kept) when unparseable.

#### Scenario: Boot marker appears only after wiring
- **WHEN** the page loads and the entry module has completed its wiring and first render
- **THEN** the boot marker element is present in the DOM

#### Scenario: Seed parameter reproduces a run
- **WHEN** the page is loaded twice over http with the same `?seed=` value
- **THEN** both sessions render the identical initial state, and a different seed renders a different initial state where one exists

#### Scenario: Malformed seed falls back
- **WHEN** the page loads with an unparseable seed parameter
- **THEN** the game boots normally with default behavior and no error surfaces



### Requirement: Responsive DOM presentation
The UI SHALL render game state as DOM elements (no canvas), readable without zoom on a 393px-wide portrait phone at default browser settings and scalable via browser zoom. The presentation SHALL be portrait-primary: portrait shows a single page (state column above a single-column action list ending in a sticky Cerrar mes + Pitch footer); landscape/desktop (>=700px) shows two columns of the same content — state left, actions right — with the event log spanning both. Touch targets SHALL be at least 48x48 CSS pixels and honor safe-area insets. The presentation SHALL depend only on core state plus the existing UI-only layers (offer modal, help, library), never on device type beyond viewport width, and SHALL NOT change game state or draw randomness.

Surface hierarchy SHALL come from rule lines, shadow elevation, and type weight — never from same-tone fills that read as one surface: distinct surface levels (desk, sheet, card) SHALL carry a measured separation of at least 1.3:1 against their containing surface, and the single primary CTA of the page SHALL be visually distinct from every secondary control by fill treatment. A footer bar pinned to the viewport SHALL NOT cover other content: at portrait 393x852 scrolled to the document bottom, the last event-log line SHALL be fully visible above the bar's top edge. Body list text SHALL render at line-height 1.5–1.75, and the ruled-paper background SHALL stay aligned with that line rhythm. The empty event log SHALL render a real ledger line from the strings content, not an empty band. Section headers SHALL use the documentary treatment (uppercase monospace with wide letter-spacing); prose SHALL remain serif.

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

#### Scenario: Surfaces are distinguishable, CTA is the one stamp
- **WHEN** the shell renders at any width
- **THEN** sheet, card, and CTA levels are separable by surface treatment (fill/edge/shadow measured >= 1.3:1 between adjacent levels) without relying on text alone, and the Cerrar mes row is the only fill-dark element in its column

#### Scenario: The pinned footer bar never covers the log
- **WHEN** a portrait 393x852 session scrolls to the document bottom after at least one action
- **THEN** the last event-log line's bottom edge sits above the pinned bar's top edge with no overlap

#### Scenario: Fresh log shows a ledger line, not a blank band
- **WHEN** a fresh game renders before any action
- **THEN** the log area shows one Spanish line from the strings content instead of an empty strip

### Requirement: Runway hero and explicit burn
The UI SHALL present runway as the most prominent number of the state group (largest type weight/size in the header area), derived exactly from core state (`floor(cash / effective burn)`), written out in plain words (`N meses`, never a bare `Nm` abbreviation), with an honest one-line gloss stating the projection's assumption. The monthly cost SHALL be displayed in plain Spanish next to cash (never the English jargon word). When the team has salaries, the burn SHALL be shown as named parts (base + each role) summing to the effective total; when the team has no salaries, the total alone SHALL be shown once — the same number SHALL NOT repeat as both a total and a single identical part. When runway drops to 2 months or fewer, the hero SHALL take the alarm treatment (ledger red, high contrast). HUD field labels SHALL carry no untranslated venture jargon (owner override of the earlier gloss-alongside-jargon pin, 2026-09-22): traction reads as interested contacts, burn as monthly expenses, runway as reach-until-zero, founder ownership as the owner's share, and the fundraising action as seeking an investor.

#### Scenario: Runway dominates the header
- **WHEN** a fresh game renders
- **THEN** the runway value is the largest numeric element in the state group, reads `8 meses` (not `8m`), and its gloss states the no-new-money assumption

#### Scenario: No bare jargon words on the HUD
- **WHEN** a fresh game renders
- **THEN** none of the HUD labels is a raw English venture term (Runway/Burn/Leads/Founder/Pitch), and the help legend uses the same plain words

#### Scenario: Burn is explicit
- **WHEN** a hire raises the monthly cost
- **THEN** the burn value shown in the header updates to the new effective monthly figure without the player computing it

#### Scenario: Burn parts appear only when they add information
- **WHEN** a fresh game with no team renders the burn field
- **THEN** no parts line repeats the same total shown beside the label

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

### Requirement: Cash-flow panel projects the ledger
The UI SHALL render a "flujo de caja" panel from the core forecast derivation only (no UI-side projection math): one ledger row per projected month showing money arriving, money leaving, and the running cash, plus a run-rate summary line above the rows (expected $/month from currently signed contracts and leads/month the team adds) and a distinct projected-bankruptcy line naming the month when cash is projected to go negative. The panel SHALL be visually secondary to the hero runway, SHALL use ledger styling (parts, mono digits, red for negatives and the bankruptcy line), and SHALL NOT draw randomness or change game state. When the horizon completes without bankruptcy the panel SHALL show a survived/no-bankruptcy line instead. The panel's numbers SHALL originate only from the core derivation and existing strings keys. Column headers for arriving/leaving/cash SHALL align over their respective numeric columns (right-aligned over right-aligned numbers).

#### Scenario: Doomed run shows a projected bankruptcy month
- **WHEN** a fresh game (no team, no invoices) is projected and rendered
- **THEN** the panel shows monthly rows arriving 0 / leaving base burn / cash falling, and a red line naming the month cash is projected to go negative

#### Scenario: Signed contracts make money arrive on their due month
- **WHEN** the player has signed clients and re-renders
- **THEN** the due months show their invoice amounts in the arriving column and the cash line steps up there

#### Scenario: The CFO visibly moves collections earlier
- **WHEN** two otherwise equal states differ only by a CFO on the team
- **THEN** the CFO run's projected arrivals land one month earlier than the non-CFO run's, shown on the panel rows

#### Scenario: Projection is honest about what it models
- **WHEN** the panel renders
- **THEN** a short gloss (strings content) states the projection assumes the founder does nothing (team engines only) and that each contract pays once

#### Scenario: Panel renders without randomness or state change
- **WHEN** the panel is re-rendered several times on the same state, including across a month
- **THEN** repeated renders on one state are identical, the projection is only recomputed after the month changes, and no game action is dispatched by opening or refreshing it

#### Scenario: Column labels sit over their columns
- **WHEN** the flow table renders
- **THEN** the arriving/leaving/cash header labels are right-aligned over their numeric columns, and the head label elements carry stable ids so they survive wiring


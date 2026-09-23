# Spec Delta

## MODIFIED Requirements

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

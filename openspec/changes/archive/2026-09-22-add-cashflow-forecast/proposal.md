# Proposal

## Why

The player can see cash and burn but cannot answer the only two questions that
matter before bankruptcy: "what money is coming in, and when?" and "where does
the burn go?". The owner's playtest report: no clear cashflow view, unclear
whether money is one-time (it is: every invoice pays once), the burn number is
undifferentiated so the CFO looks useless, and the pipeline framing from
two-engines-economy conflates two different things the game already tracks
separately — leads (traction) and clients (signed invoices). The team engines
landed last change; this one makes their money legible.

## What Changes

- **Leads and clients are named as what they are:** traction becomes **Leads**
  (contacts ready to buy) across HUD/cards/help; **Clientes** becomes the count
  of active signed invoices (derived from state, core field unchanged). A
  lead-only month can no longer be read as revenue.
- **Run-rate rows (the honest "MRR"):** the panel shows the two real monthly
  rates the economy has — leads/month the team adds, and $/month expected
  collections from currently signed contracts (average over their due months).
  Copy names them explicitly as run-rate, and help states that revenue is
  one-time per contract (recurring subscription revenue is roadmap).
- **Burn breakdown:** "Quema" stops being one number: base burn + each role's
  salary shown as parts (from the roles table via one derivation), so hiring
  and firing decisions are legible and the CFO's collection-delay perk finally
  shows up where money is discussed.
- **Cash-flow forecast panel ("Caja"):** a deterministic, zero-PRNG projection
  rendered in ledger style: for the next months, money arriving (due invoices
  + team auto-closes landing within the window), money leaving (team burn),
  the resulting cash line, and a projected bankruptcy month when cash goes
  negative. The projection models ONLY the team engines ("what happens if you
  don't touch anything") — founder labor is jittered and deliberately not
  guessed. The CFO becomes visible as collections landing a month earlier.
- **Fix found during scoping:** the CFO hire card currently renders
  "+0 clientes/mes" (pipeline field shown for a role without pipeline); the
  perk line only shows fields the role actually has.

## Capabilities

### New Capabilities
- (none)

### Modified Capabilities
- `game-core`: new pure derivation `forecastOf(state)` (integer-only, no PRNG,
  no state change — same precedent as exitOf), projecting per-month
  in/out/cash over the remaining run modeling the team engines alone.
- `ui-shell`: HUD names Leads and Clients; burn renders its breakdown; new
  cash-flow panel (next months, in/out bars, cash line, projected bankruptcy)
  built from the core derivation only; help legend documents the distinction
  and the projection's assumption.
- `content-strings`: no requirement change (copy keys + drift test extension in
  tasks; labels run through the existing single-source rule).

## Impact

- `core/game.js` (forecastOf + shared burn-breakdown helper), `ui/view.js` +
  `index.html` + `styles.css` (panel), `content/strings_es.js` (Leads/Clientes
  labels, run-rate lines, burn parts, CFO perk fix, help), `ui/main.js` (wire).
- New unit tests (forecastOf determinism/purity, burn parts, label drift) and
  e2e (panel shows projected bankruptcy on a doomed run; CFO run shows earlier
  collections than the same run without CFO at equal state).
- No balance change — pure legibility over the swept economy; no new draws, so
  all goldens and byte-identical bootstrap guarantees stay.
- Sequencing: lands after `two-engines-economy` (archived 2026-09-22), which
  created the engines this projects.

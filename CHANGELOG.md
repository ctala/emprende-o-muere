# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Rule: every version gets its section here **before** it is tagged.

## [Unreleased]

The ledger finally reads like a document, not a spreadsheet: surface depth,
a real type rhythm, and a vocabulary that stops speaking startup English.

### Changed
- Surface hierarchy from measured separation, not same-tone fills: cards lift
  off the ruled paper with a hard shadow token, the desk frames the sheet, and
  "Cerrar mes" is the one ink-dark stamp on the page (paper-on-ink >= 4.5:1)
- Documentary rhythm: ruled lines at 28px with list text locked to that grid,
  17px reading size, uppercase mono section headers, month metadata right-aligned
- Jargon pass (owner override of the "jargon stays, glossed" policy): Runway →
  Alcanza, Quema/Burn → Gastos, Leads → Contactos, Founder → Dueño, Pitch →
  Buscar inversor, Pre → Valor; the runway hero says "8 meses", never "8m", and
  the HUD's only remaining English is the role abbreviations (CTO/CFO/CPO)
- Energy shows its number next to the bar (the panel asked twice)
- Help rules gained the money loop (contactos → firmar → factura → cobra)

### Fixed
- Flow-head column labels ("entra / sale / Caja") rendered empty — `wire()`
  looked up ids the markup never had
- Pinned action bar could cover the last log line on a 393x852 phone (pinned
  by an e2e occlusion test)
- Fresh log rendered an empty band; it is now a real ledger line
- Burn echoed itself ("15k/mes · operativa 15k") on a teamless start
- Lock reasons (e.g. "Se destraba en el mes 6") no longer borrow the ledger
  red reserved for negative money
- "?" help button was a 35px-wide touch target; it now holds the full 48px square

### Evidence
- ux-review agent re-run: all five prior P1s closed (evidence in
  `openspec/changes/redesign-documentary-ledger/evidence/`)
- Synthetic panel (LLM, needs human confirmation): comprehension 5/5, intent
  "sí" 1/5 (was 0/5), zero jargon-friction complaints (was the dominant
  "habla en cristiano" cluster); balance sweep untouched

## [0.2.0] - 2026-09-22

The team finally works, and the money finally reads: the game
projects your bankruptcy month before you reach it.


### Added
- Two team engines that run on their own every month (zero new randomness,
  bootstrap replays byte-identical): each role adds leads (pipeline) passively,
  and Ventas closes one deal per month with no click and no focus — hiring
  sales finally means recurring work, not a discount coupon
- MVP gate: the first signed client (founder's or the team's) requires 2
  product builds. You can't sell vaporware anymore
- `scripts/sweep.mjs`: balance sweep (6 policy families x 16 seeds) with its
  acceptance bands pinned as tests; balance goldens re-pinned against it
- Cash-flow forecast panel ("Flujo de caja"): deterministic month-by-month
  projection of arrivals, departures, cash, and the projected bankruptcy
  month — exact for the founder-does-nothing scenario (cash evolution is
  morale-independent, so it replays the engine's cash line with zero PRNG)
- Burn shown decomposed into named parts (base + each role's salary), making
  hiring cost and the CFO's earlier collections legible
- Clients field (active signed contracts) distinct from Leads (traction)

### Changed
- Traction is framed as Leads (interested contacts) across the HUD, cards,
  help, and reasons — a pipeline you convert into invoices, not a score;
  a labor action adds leads, not revenue
- Content publishing pays off through the team (the pipeline it feeds is what
  Ventas converts into invoices); help legend explains both engines, the
  lead/client split, and the projection's assumptions (each contract pays
  once; recurring revenue is roadmap)

## [0.1.0] - 2026-09-22

First playable, versioned release: the game runs entirely in the browser with
no build step and no dependencies, and ships with a browser regression gate
that catches its own breakage.

### Added
- Responsive, portrait-first DOM shell (phone sessions from WhatsApp links):
  runway as the hero number ("8m / meses de vida"), explicit Quema beside
  Caja, ledger identity in CSS (paper, rules, margin red, rubber stamp)
- Honest action cards: yield ranges instead of bare numbers ("Tracción 5–11",
  half at low morale), inline burn/moral cost on Cerrar mes, live Pre-money
  valuation on Pitch, perk deltas on hires ("Firmar cliente: 10 → 6 trac"),
  and the burned-team warning ("Tracción +0 — descansa")
- Closable modals everywhere: help, library and the term sheet close by
  button, Esc, or backdrop; the terminal has "Jugar otra vez"
- Complete event log (scrollable history, not the last two lines)
- Regression gate: `npm run gate` runs the pure unit suite plus a real-browser
  e2e suite (CDP, no dependencies) that boots the page, plays a month, drives
  a run to its stamp, and fails on blank renders, console errors, dead clicks,
  or the file:// blank-page class
- Synthetic playtest panel (5 simulated LatAm founders) with rounds 1–2 on
  record; `ux-review` agent (ui-ux-pro-max skill) gates visual changes
- MIT license (Cristian Tala); vendored skill keeps its own MIT + provenance

### Changed
- Game named "Emprende o Muere — El juego de las startups"
- HUD jargon kept but always glossed (help legend covers every metric and rule)

### Removed
- Canvas rendering shell, frozen-coordinate geometry tests, theme.js/layout.js
  (superseded by the DOM shell; legibility on phones was the failure mode)

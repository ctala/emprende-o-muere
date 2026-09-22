# Proposal

## Why

The game plays well but photographs like a dev demo: dark rectangle, thin outlines. Before anyone can learn from it they have to pick it up, and a screenshot decides that. The genre's cheapest-to-build, highest-recognizability look is available under the project's constraints (Canvas 2D, system fonts, no assets): the interface IS the art — a startup's ledger and receipts. Paper-and-ink with accountant red, a term sheet that reads like a physical document, and game-over as a rubber stamp. This is change 9 of the three-part visual sequence (identity -> game feel -> metaphors/sound).

## What Changes

- New `ui/theme.js`: the single visual system — paper palette (warm paper surface, ink text, ledger-red for negatives/seals, deep-gold accents), two typefaces (display serif + system monospace for every number), and drawing primitives (ruled paper backdrop, red margin rule, dot leaders between HUD label and value, rotated stamp with dashed border, paper shadow via offset fill)
- Screen surfaces become paper documents: month panel, HUD, log and offer panel each draw as slightly-rotated paper sheets with drop shadow; the offer panel becomes a literal term sheet (document header, perforated tear line above its buttons)
- HUD numbers render monospace with ledger dot leaders (`Tracción ······ 18`); negatives in accountant red; cash line keeps its alarm state in ink-red
- Game-over becomes a stamp: rotated dashed-border seal (`QUEBRASTE` / `SOBREVIVISTE`) over a desaturated page
- Geometry contract: every CLICKABLE region keeps its exact coordinates — only pixels between them change, so all existing hit-region and layout tests must stay green untouched
- Deterministic only: no canvas gradients-per-frame cost concerns, no new randomness (paper jitter is fixed per surface, not PRNG)

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `ui-shell`: "Canvas month display" gains the visual identity contract (paper surfaces, system-font-only type system, monospace numerals, stamp terminal, pixel-checkable and asset-free)

## Impact

- `ui/theme.js` (new): palette, fonts, `drawPaper()`, `stamp()`, `dotLeader()`, `drawNumber()`
- `ui/main.js`: all draw functions rewired through theme; screen composition order (backdrop first, panels over it)
- `ui/renderer.js`, `content/strings_es.js`, `core/`, `ui/layout.js`: untouched (geometry and copy unchanged)
- `tests/layout.test.js`: existing region-coordinate tests act as the contract; new assertions that CLICKABLE coordinates are frozen values
- `tests/theme.test.js` (new): pure helpers (color contrast sanity, stamp rotation determinism) run under Node
- CDP pixel checks: dominant surface color flips dark->paper, digits sampled from monospace render

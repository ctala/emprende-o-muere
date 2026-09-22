# Proposal

## Why

A first-time Spanish-speaking player hits three walls before learning anything: the title ("Startup LatAm Roguelite") is untranslatable jargon, the HUD uses venture vocabulary (Runway, Burn, Pitch, Pre) with no gloss, and nothing explains what a button does or why it is sometimes greyed out (moral too low, before month 6, out of energy). The game teaches startup intuition, but currently assumes you already read the industry. Rename it something a Hispanophone instantly gets and add an always-available "?" legend that explains each metric, each action, and each lock — the vocabulary stays (it is part of what players learn), but it is never left undefined.

## What Changes

- Game name "Emprende o Muere" (with subtitle "El juego de las startups") across title, browser tab, and canvas aria-label — replacing "Startup LatAm Roguelite" everywhere
- New "?" help button beside the existing Biblioteca button opening a "Cómo se juega" screen: a scroll-free legend page, same modal pattern as the library (blocks gameplay dispatch while open, toggles closed)
- The legend covers, in Spanish, every HUD metric (Foco, Tracción, Moral, Caja, Runway, Energía, % Founder), every action (with its effect and its cost), and every lock rule (when a button is disabled and why): morale tiers gate traction gains, Pitch needs month ≥ 6 + energy + no cooldown, hiring needs sign-on cash, closing needs traction
- Venture jargon is kept on the HUD but the legend gives the plain-Spanish gloss next to each term (Runway = "meses de vida", Burn = "gasto mensual", Pre/Ronda, etc.) — the term is defined, not replaced
- First-run pointer: on a brand-new game (no learnings stored yet) a one-line hint under the HUD points at the "?" until the player opens it once, then never shows again
- Purely presentational and copy-only: no core change, no new game state, no new randomness; the "?" button is a new hit region outside the gameplay grid (same contract the library button already satisfies)

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `ui-shell`: gains the help screen (a "?" toggle button + a legend page rendered from the content module, blocking gameplay input while open like the library) and the game-title/copy identity ("Emprende o Muere"); a first-run hint pointing at the help entry until first open

(content-strings gains new keys — name, subtitle, and the `help.*` legend lines — but its requirements are unchanged: adding copy is data flowing through the existing "Single Spanish text source" requirement, not a behavior change.)

## Impact

- `content/strings_es.js`: new name, subtitle, help button label, and a `help.*` section of legend lines (one entry per metric/action/lock, so the screen is data-driven, not hardcoded rows)
- `ui/layout.js`: a `helpButton` region beside `libraryButton`, non-overlapping; help content reuses the library panel rect
- `ui/main.js`: help open/close toggle + render; first-run hint gating on "unlocked learnings empty AND help not opened", persisted through the same storage adapter learnings already uses
- `index.html`: `<title>` and canvas aria-label updated to the new name
- `tests/layout.test.js`: new-region test (clickable, outside the month box, no overlap); existing geometry-freeze tests stay green
- `tests/core.test.js`, `core/`: untouched — no gameplay surface changes

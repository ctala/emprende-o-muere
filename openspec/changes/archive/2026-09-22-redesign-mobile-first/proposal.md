# Proposal

## Why

The synthetic founder panel (round 1, `playtest/results/round1-report.md`)
tested the current build — mobile canvas at 393×221 CSS px, 9px text — with
five simulated LatAm founders and a human eye confirmed the worst of it.
Evidence, per report:

- **Legibility is the top friction**: 7 flagged records call text tiny or
  contrast illegible (letters ~6px on phones, disabled buttons unreadable).
  Flagged `needs-human` — and the human (this project's owner) confirmed it.
- **A flat grid defeats decisions**: "Construir producto pesa lo mismo que
  Contratar Ventas o Descansar, aunque una sea el core loop y la otra un
  reseteo de energía" [fernanda:r2]
- **The tension metric is invisible**: "Si la interfaz no te grita el
  runway antes de gastar, la interfaz perdió" [fernanda:r3] — and the
  burn number is never shown; you infer it [diego:r2]
- **Jargon lands wrong on the target audience**: "Runway" in English and
  "Foco" (two dots) are named as the least-understood terms by the
  non-gamers [camila, jorge, valentina]
- **The game over is a medical report, not a trophy**: share intent 2/5,
  with the blockers social ("me da vergüenza admitir que quebré")
  [valentina:r3, camila:r3] — for a game distributed through WhatsApp
  groups, share intent IS the growth engine.

Root cause of most of the above is one week-1 engineering decision that
crystallized into identity: the fixed 800×450 hand-drawn canvas. On phones
it shrinks to an unreadable strip; DOM text at real sizes fixes legibility
for free, and the ledger identity (typography + paper + stamp) is native
CSS material anyway.

## What Changes

- **Portrait-primary responsive DOM shell replaces the canvas** (BREAKING
  for the ui-shell canvas contract): real text, zoomable, accessible,
  ≥48px touch targets, safe-area insets. The deterministic `core/` and all
  its tests stay untouched; `renderer.render(event) -> string` survives.
- **Metaphor**: portrait = the closed ledger (one page), landscape/desktop
  = the open book (state left, actions right, log across the gutter).
- **Runway hero + explicit burn**: runway as the largest number on screen
  ("Meses de vida"), burn shown next to cash — not inferred.
- **Ledger-row actions with real hierarchy**: core-loop actions first and
  heavier; disabled rows state their reason inline ("requiere 10 de
  tracción"), not a grey ghost.
- **Copy fixes from evidence**: `Foco` → "Acciones" (or equivalent plain
  term), Runway glossed inline on first sight; jargon stays (learning is
  the point) but never undefined.
- **Game over as a shareable trophy**: stamp + result framed for WhatsApp
  forwarding (what you learned, one line), plus an `og:image`-style static
  preview target for link previews; the number to beat is share intent
  2/5 from round 1.
- **Every visual change now verifies 3 viewports** (390×844, 844×390,
  desktop) as a standing convention, and the synthetic panel re-runs as a
  gate before shipping (report must show the round-1 frictions resolved).
- `add-game-feel` is **superseded**: its canvas tween design cannot apply
  to a DOM shell; CSS transitions cover the feel need (re-proposed later
  as its own change if wanted).

## Capabilities

### New Capabilities
- (none)

### Modified Capabilities
- `ui-shell`: replace "Canvas month display" (and the canvas-wide hand-
  drawn presentation) with responsive DOM presentation rules — portrait
  primary, runway hero, hierarchical actions, shareable terminal screen;
  the modal help/library behavior and HUD content survive as DOM
  requirements.

(`content-strings` gains copy — the `Foco` label rename and terminal share
lines — but its requirements are unchanged: adding/renaming keys is data
flowing through "Single Spanish text source", same precedent as
`improve-onboarding`. The help-legend drift test will catch the rename.)

## Impact

- New DOM structure in `index.html` + a new `ui/view.js` (state -> DOM);
  `ui/main.js` shrinks to wiring (input, storage adapter, learnings/help
  observers stay as-is); `ui/renderer.js` and `ui/learnings.js` untouched
- Retired: `ui/layout.js` + its frozen-coordinates tests (replaced by DOM
  structure/role tests), `ui/theme.js` values become CSS custom properties,
  `ui/closing` indicator becomes a CSS class; `ui/fx` never existed
- Tests: CDP harnesses switch from pixel-diff to DOM-state assertions +
  3-viewport screenshots; core suite and help/learnings/personas tests
  stay green unchanged
- `playtest/`: shot rig retargets to the DOM build; round 2 re-run is the
  acceptance gate (round-1 friction list must shrink; share intent > 2/5)

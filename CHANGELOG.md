# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Rule: every version gets its section here **before** it is tagged.

## [Unreleased]

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

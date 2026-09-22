# Design

## Context

See proposal.md - Why. The library screen (change add-learnings) already established the modal pattern: button outside the action grid, open blocks all dispatch, close restores. Help is the same pattern with static content, plus one bit of persistence (hint-seen flag) reusing learnings' storage adapter. Sequencing note: add-visual-identity is paused mid-apply and modifies the same "Canvas month display" requirement and strings file; it must be finished and archived BEFORE this change is applied, so its scenarios are already in the main spec (this delta's MODIFIED block will need their scenarios copied in — the validator will say so).

## Goals / Non-Goals

**Goals:**
- A Spanish-only reader with zero startup background can name what each number is, what each button does, and why a button is dead — in two clicks max from any state
- Vocabulary is introduced, not removed: HUD keeps Runway/Burn/Pitch; the legend defines them in plain Spanish once
- The legend is data-driven: one `help.metrics` / `help.actions` / `help.rules` array in the strings module; the screen loops over them, so adding a future mechanic means adding array entries, not new render code
- Zero gameplay surface: no new state field, no core touch, no PRNG; hint persistence is UI-side localStorage only

**Non-Goals:**
- No tutorial that forces actions or gates the first months (user chose legend-over-tutorial)
- No per-metric tooltips on hover (canvas hit-testing for every label would outgrow the help screen for less value)
- No multi-page or scrolling help: one 740x170 panel, ~14 lines max, dense by design — this matches the library's fixed-row pattern and fits the 450px canvas

## Decisions

**Name: "Emprende o Muere" + subtitle "El juego de las startups"** (user's pick). Applied to four places: `<title>`, canvas aria-label, `ui.title` string (in-canvas header), README H1. The subtitle carries the genre explanation the old title's "Roguelite" attempted.

**Help layout reuses the library panel**: same rect (x40 y196 720x172), three column-banded sections instead of rows: metrics (HUD term — gloss) as dot-leader rows, actions (name — effect·cost) and a compact rules footer. Font 12px serif, two-line cap per entry; ~14 entries at rowH 12 is tight — instead: three mini-columns inside the panel (metrics | actions | rules), each 230px wide, which the library row loop becomes trivially (loop over arrays, column x-offset). Content overflow is caught by counting array lengths against available rows in a Node test (no canvas needed).

**"?" button next to Biblioteca**: top-right stack — Biblioteca at x640 w120, "?" at x768 w28 h20 (both in the title band, outside every gameplay region). They are mutually exclusive: opening one closes the other (two overlapping full-width panels cannot both be open).

**Hint gating**: `showHint = loadUnlocked(adapter).length === 0 && !loadFlag(adapter, HELP_SEEN_KEY)`. Opening help writes the flag (separate key `roguelike.helpSeen.v1`). One line under the HUD: "¿Nuevo aquí? Pulsa ? para una guía rápida." Renders in the desk margin above the action grid (y ~186, outside all regions) so it never overlaps a button.

**Help data shape in strings**: arrays of `key`ed lines would break getString's flat map, so the strings module gains `getHelpSections()` returning ordered arrays of already-translated lines (`['Foco: tu acción del mes…', …]`), keeping getString as the single-lookup path and making the screen render a plain loop. Test asserts non-empty sections and that every entry mentions one of the HUD/action terms it glosses (regex over the joined text) so copy cannot silently drift from the UI.

## Risks / Trade-offs

- [Legend goes stale when mechanics change] → the drift test enumerates HUD labels and action names from existing string keys and requires each to appear in some help line — a new action or metric fails the test until help is updated (same spirit as the every-event-key-resolves test).
- [172px panel too small for honest copy] → three-column layout gives ~14 lines of working room; the content budget (max entries/line length) is asserted in the Node test, and copy is trimmed during screenshot review, not silently overflowing.
- [Two top-right buttons crowd the title] → 28px "?" + 120px "Biblioteca" leave 40px gap to the title's right edge (title is centered at 400); CDP screenshot review confirms no collision with the identity pass's new header.

## Migration Plan

Copy- and UI-only. Existing players keep their learnings; the help-seen flag defaults to unseen (new key). The name change is pure string swap (aria-label + title + ui.title).

## Open Questions

(None.)

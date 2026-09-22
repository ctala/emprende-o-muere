# Design

## Context

See proposal.md for motivation. Current click routing lives in `ui/main.js`: click -> hitRegion -> applyAction -> draw. This adds one behavior after dispatch.

## Goals / Non-Goals

**Goals:** auto-close on spent focus, readable delay, replay log unchanged.
**Non-Goals:** no core changes, no new strings, no config for the delay.

## Decisions

### Auto-close in the UI, not the core
The core stays `rules + explicit actions`; the UI dispatches END_MONTH itself on focus 0, so the run log gains the same entry a click would produce and replay semantics are untouched. Alternative (core auto-closes) rejected: it hides actions in the log the log is supposed to record.

### Timer mechanism
`setTimeout(600)` stored in a module-level `closingTimer`; while it is pending, the click handler returns immediately and action buttons draw in the disabled style with the END_MONTH region highlighted (a "closing" tint) — the visual cue with zero new strings. Any pending timer is cleared on dispatching END_MONTH manually or on game-over. Alternative (rAF-driven countdown) rejected: extra state for no player value at 600 ms.

### Read order
Action render happens immediately on dispatch; the delayed dispatch then re-renders with its own events appended, so the log shows the action line and the "Cierra el mes" line in order.

## Risks / Trade-offs

- [A player clicking during the delay loses input] → acceptable: the delay is 600 ms and the closing cue explains it; clicks never corrupt state, only get ignored.

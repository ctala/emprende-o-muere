# Design

## Context

See proposal.md - Why. Project rule: learnings reveal information, never grant perks (decision A). The strongest guarantee that a perk can never sneak in is structural: the whole feature lives in `ui/`, and the core already has a spec scenario + a test proving it imports nothing from UI. No balance sim is needed — learnings has no numbers that affect play; triggers read existing events.

## Goals / Non-Goals

**Goals:**
- Unlock logic is a pure function `(events, unlockedSet) -> newIds` so it is testable in Node with zero DOM; persistence is an injected adapter (`{ getItem, setItem }`)
- Every trigger is attributable from events alone (plus final reason/pct which events already carry) — no hidden state reads
- The library screen reuses the established modal pattern (offer panel): blocks dispatch while open, restores on close

**Non-Goals:**
- No run-log replay across sessions, no per-run history, no stats screen (out of scope for a pure reveal feature)
- No learning that could ever gate an action or price; library entries are static strings
- No LLM rendering of learning texts (same seam as everything else; templates now)

## Decisions

**Eight discoveries and their triggers:**
- `first_bankrupt`: run-ended reason bankrupt
- `first_round`: round-closed event
- `drained_deal`: round-closed accepted after an offer event with tier `drained` (this attribution is why the core gains the tier param — otherwise the UI would recompute pricing and duplicate core math)
- `investor_walked`: offer-walked event
- `offer_expired`: offer-expired event
- `first_hire`: action-taken event with action HIRE
- `broke_while_funded`: bankrupt run-ended while investors non-empty — investors are not in events; tracked by the observer seeing round-closed since last run start (UI state, allowed: observer is a consumer)
- `lost_control_survivor`: survived with founderPctBps < 5000 — final pct is a state read, allowed for UI observers, but the settlement event already carries founderPctBps, so the trigger reads only the event
- Each id unlocks once and persists; the library lists all ids sorted by a fixed order, discovered first by unlock time is unnecessary — stable content order keeps ??? rows legible

**`tier` param derivation:** `priceOffer` already branches on energy; it returns tier alongside the price, and `pitch()` passes it through the event params. Frozen offer does not store tier (the event is the only consumer; offers are single-use).

**Storage key:** `roguelike.learnings.v1` holding a JSON array of ids; a corrupt payload is treated as empty (loud console.warn, never crash a run). Versioned key keeps future migration trivial.

**Library screen layout:** toggled from a small `BIBLIOTECA` hit region beside the title (outside all gameplay regions); renders inside the month box area as a modal panel like the offer; its hit region also participates in the "panel open blocks dispatch" guard. Closing = same button.

## Risks / Trade-offs

- [Observer drift: a future event rename silently breaks a trigger] → tests pin every trigger to the actual EVENT_KEYS constants, so a rename fails a test instead of killing a lesson.
- [localStorage denied (private mode)] → adapter catches and degrades to in-memory (learnings still unlock for the session, just don't persist).
- [Library click-through into hidden buttons] → the open-library flag uses the same afford() gate as the offer panel (already proven for offer by CDP inert-click test).

## Migration Plan

Additive feature; nothing stored before this change, so a first-ever read is empty. No state format changes (tier is an event-only param; replays compare states, which never contained event params).

## Open Questions

(None.)

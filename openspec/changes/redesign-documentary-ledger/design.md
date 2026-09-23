# Design

## Context

See proposal.md - Why. The identity contract (paper ledger: warm paper, ink
rules, ONE red margin, mono numbers, serif prose, rubber stamp) is fixed; the
owner's reference is a documentary paper in exactly that genre — the distance
between the two is execution, not identity. Three measured facts drive the
fixes: surface separation 1.09:1/1.3:1 (beige soup), the portrait bar covers
the last log line (bottom=830 vs bar-top=665), and the 22px ruled background
caps body line-height at 1.375 (the ruling and the 1.5–1.75 rule fight).

## Goals / Non-Goals

**Goals:**
- Surface hierarchy and CTA emphasis without touching the game loop or core
- Documentary depth (frame, shadow, blurred backdrop) on desktop, phone-first
  preserved
- Kill the two measurable bugs (bar occlusion, blank fresh log) and the copy
  noise the panel flagged (redundant burn parts, Energía gloss, invisible
  money loop)
- All existing gate scenarios stay green; new measurable scenarios pin the
  fixes

**Non-Goals:**
- No layout restructure (one-column portrait, two-column desktop stay)
- No core/balance/event changes, no new fonts, no images
- No re-pinning of balance or copy-policy decisions (jargon stays; glosses live
  in the fields, per the improve-onboarding policy)

## Decisions

### D1: Elevation scale replaces same-tone fills
New tokens: `--sheet-lift` (2px hard shadow, current card level),
`--sheet-float` (6px hard shadow + 2px `--gold-deep` frame, >=700px sheets),
card edges move from `--card-edge` (1.30:1 vs paper) to `--paper-rule`
(1.51:1) or darker; card FILL stays at paper tone (separation by edge+shadow,
ledger-authentic). The CTA flips to `--ink` fill + paper text (12.46:1) — the
page's only fill-dark element, reads as a stamp. No text token moves; all
existing contrast floors hold by construction.

### D2: The ruling moves to 26px, lists follow
`repeating-linear-gradient` rhythm 22px -> 26px; `.log-lines li`,
`.help-col li`, `.library-list li` go line-height 26px (1.625, in-band).
Rhythm preserved because ruling and text share the token (`--rule-line: 26px`).

### D3: Occlusion fixed at the scroll container
Portrait: `footer.log` moves inside `main`'s flow with the existing bottom
padding reserving the bar's height (the agent's finding: padding is on `main`,
log is a sibling of `main`, so the reservation never covers it). Pin the fix
with a rect-comparison e2e at 393x852 — measurable, not vibes.

### D4: Documentary cadence is label-level only
`.flow-title`, `.month-line`, help/library modal titles get uppercase mono +
letter-spacing .1em+. Body prose stays serif (identity). Modal/terminal
backdrop gains `backdrop-filter: blur(4px)` (dismissal cue). Flow head labels
right-align over their right-aligned numeric columns.

### D5: Copy fixes from the panel (content-strings only)
Burn: parts line renders only when salaries exist (diego's redundancy).
Energía field gains its plain gloss inline ("vigor para pitchear; Descansar lo
sube") — the panel asked twice. Help rules gain the 3-line money loop diego
couldn't derive: "Construí -> leads -> Firmar -> factura -> cobra" + "el equipo
produce y cierra cada mes". Fresh log first line: "Mes 1 · el libro está
limpio" from strings (no layout change). The already-fixed flow-label bug
(wire ids) rides in this change; it's the only core-adjacent file touched
(index.html, markup only).

### D6: Acceptance = evidence protocol, not opinion
After implementation: re-shoot + fresh synthetic round (goal: intent "sí" up
from 0/5; the feo/ardor/planilla cluster down). Panel is finding-generator —
humans still have the last word (the standing rule). ux-review re-run gates
before the synthetic round.

## Risks / Trade-offs

- **Contrast regressions from token swaps** -> every changed surface pair is
  measured in a test (no new test-runner needed: a strings/contrast unit test
  table over the token values).
- **26px ruling breaks the "one red margin" alignment** -> the margin rule is
  border-left, independent of vertical rhythm; the 22px background-origin math
  lives in one rule block.
- **Panel drift is LLM-noise-prone** -> acceptance compares against this
  round's exact friction strings, not vibes, and the human pass stays required.

## Migration Plan

Pure presentation + copy on top of v0.2.0; rollback reverts the commit. No
state, no persistence, no core serialization touched.

## Open Questions

- Whether "Runway/Burn/Leads" English terms get Spanish-first labels in this
  pass or wait for the human round — deliberately NOT decided here (the jargon
  policy stays owner-pinned; panel complaints about jargon are routed to the
  human pass, the improve-onboarding rule).

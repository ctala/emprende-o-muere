# Design

## Context

See proposal.md - Why. The dark-outline theme is a placeholder. The constraint set (Canvas 2D, system fonts, no binary/network assets, core purity, fixed 800x450) is exactly the constraint set of Papers, Please's UI — document-as-interface carries the whole look. This is the first of the 9/9b/9c visual sequence; it changes ONLY how things look, never where buttons are or what numbers mean, so the entire deterministic core and every geometry test must survive untouched.

## Goals / Non-Goals

**Goals:**
- One screenshot of a fresh game must read "accounting document / startup ledger," not "debug screen": the dark page becomes a warm paper sheet on a dark desk (the canvas), with ink text and a single red ledger rule
- A single theme module owns every color and font string so the next two changes (game feel, metaphors) reuse it and a palette tweak is one file
- Hit-region coordinates are frozen: identity is pixels drawn between buttons, never the buttons themselves
- Fully testable off-browser: pure helpers (stamp rotation, paper-rule placement, monospace number formatting) export as pure functions and get Node tests

**Non-Goals:**
- No motion, easing, particles or shake (that is change 9b); this pass is a static restyle
- No per-frame gradients or shadowBlur where a cheap solid offset fill reads the same — keep it 60fps on a potato and pixel-deterministic for the CDP pixel-equality tests
- No layout changes: same regions, same information density, same Spanish copy
- No new content strings (the copy is already central; only colors/fonts change)

## Decisions

**Palette (paper-and-ink, checked for legible contrast):**
- desk (behind paper) `#2b2118` warm near-black; page `#efe7d3`; page-rule `#c9bda0`; margin-rule + seals + negatives `#a3312a` (accountant red, kept close to existing DANGER so the "red means danger" reading survives); ink `#2a241c`; gold accent (buttons/seals highlights) stays `#8a6d1f`-darkened so it reads on paper (the old bright `#c9a227` was chosen for dark bg and washes out on cream)
- Tiers remap to paper-safe: green `#3c6b34`, amber `#a9772a`, danger-red `#a3312a`
- Rationale for warm paper over pure white: a startup ledger is aged paper, and warm off-white avoids the clinical look and the harsh contrast of #fff under a bright room; still far more "document" than the current near-black.

**Type system, two system faces only:** display serif `Georgia, "Times New Roman", serif` for month/title/prose (unchanged, already serif), plus `ui-monospace, "SFMono-Regular", Menlo, Consolas, "DejaVu Sans Mono", monospace` for EVERY number. Monospace numerals do two jobs: the ledger aesthetic and stable digit widths so HUD values don't jitter horizontally as they change (a free bridge into 9b's tweening).

**Paper is drawn, not textured:** sheet = solid page fill + a 2px solid darker offset fill as drop shadow (no shadowBlur), two or three thin ruled lines, one red margin rule at a fixed x. `drawPaper(ctx, x, y, w, h, {rotate})` rotates by a fixed tiny angle (±0.4°) using a stored per-surface constant, never Math.random — keeps frames byte-deterministic for the cross-session CDP test.

**Term-sheet / offer panel** becomes the most "physical" sheet: document header, the dilution lines as a ruled form, a dashed perforation line above ACCEPT/NEGOCIAR/DECLINE. Stamp on game-over: `stamp(ctx, cx, cy, text)` rotated ~-14°, dashed double border, red, over a desaturated page.

**Geometry-freeze enforcement:** `ui/layout.js` stays exactly as-is; theme.js imports nothing from layout and every draw call passes regions through unchanged. The existing layout tests (centers/edges/overlaps) are the regression net; add a test asserting the frozen coordinate table so an accidental nudge fails loudly.

## Risks / Trade-offs

- [Warm cream + red is a classic look that can read generic] → the red margin rule, dot leaders and stamp seal are the specific "LatAm office ledger" cues; validated by CDP screenshots reviewed like every prior UI change before we call it done.
- [Rotated sheets could clip at canvas edges] → panels already sit inside margins; rotation is ±0.4° over ≤740px width = <6px displacement, well inside the 40px gutter; layout fit test covers panel extents.
- [Monospace for all numbers may look sparse at small sizes] → HUD values already ≥11px; DejaVu/Consolas are legible at that size and the ledger feel depends on it.
- [Contrast of gold on cream] → gold is darkened specifically for paper; a Node helper test asserts each fg/bg pair clears a minimum luminance gap so we cannot ship an unreadable combo.

## Migration Plan

Presentational-only and self-contained (new theme.js + rewiring of existing draw calls). No state, no storage, no copy, no geometry. Revert = restore the six inline color constants; the theme module is additive. CDP pixel-equality across sessions still applies (no PRNG/Date.now/gradient-per-frame introduced).

## Open Questions

(None — palette specifics may be nudged during the screenshot review, which is expected polish work, not a spec change.)

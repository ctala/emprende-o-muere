# Design

## Context

The shell today is one immediate-mode canvas renderer (`ui/main.js`, 524
lines) whose geometry is pinned by `ui/layout.js` + frozen-coordinate
tests. Round-1 evidence: comprehension of the game loop is already high
(5/5); what fails is the physical presentation on phones (legibility
flagged 7x, `needs-human` confirmed) and framing decisions (flat grid,
invisible runway/burn, terminal screen not shareable, share intent 2/5).
The core is event/state purity with replays — none of that is presentation,
so the rewrite is UI-only. The synthetic panel (playtest/) is now a repo
capability and becomes this change's acceptance gate.

## Goals / Non-Goals

**Goals:**
- Readable-without-zoom at 393px portrait; 48px targets; browser zoom works
- One number in charge: runway hero; burn explicit; moral numeric visible
- Ledger identity survives the move: paper, rules, margin red, stamp — in
  CSS, not canvas
- Acceptance = synthetic round 2: round-1 frictions resolved, share > 2/5,
  zero NEW legibility flags; then a 5-human WhatsApp-group pass on the
  built page before the game is shared with anyone outside the project

**Non-Goals:**
- No gameplay, balance, core or copy-policy changes (jargon stays; the
  copy fix is limited to evidence-named labels: Foco, inline runway gloss)
- No animations beyond cheap CSS transitions (the superseded add-game-feel
  scope stays out; it is not a blocker for this change)
- No service worker / PWA / install flow (next change if wanted)
- No framework: DOM + a ~150-line `ui/view.js` with the project's
  hand-rolled style; no build step survives as the prime constraint

## Decisions

**DOM, not canvas (R3).** Decided in exploration with the user. `index.html`
gets semantic structure: `<header>` (title/month/runway hero/burn),
`<section aria-label="estado">`, `<ul>` of action rows, `<dialog>`
elements for offer/help/library, `<footer>` log + terminal stamp block.
`ui/view.js` is a pure renderer `render(state, ctx) -> void` diffed by
full-innerHTML-into-template replacement — the state space is tiny and the
render stays byte-deterministic (stable attribute order, sorted nothing
implicit: fixed template literals). The canvas files (`layout.js`,
`theme.js`, `renderer.js` canvas parts) are deleted at the end of the
tasks, not left half-used.

**Identity in CSS custom properties.** `ui/theme.js`'s palette/type values
move to `:root` variables in `styles.css` (one place, same discipline that
made theme.js work): desk `--desk` `#2b2118`, page `--paper` `#efe7d3`,
rules via `repeating-linear-gradient` on the ledger columns, red margin
rule as a 2px `border-left`, stamp as a rotated dashed double border. The
paper-shadow sheets become subtle `box-shadow`s — the metaphor is preserved
because it is type + color + rules, not rasterization.

**Layout: closed book portrait, open book landscape.** Single breakpoint at
700px (content-driven, not device names). Portrait grid is one column:
header hero → estado → acciones (core loop first) → sticky footer with the
two footer rows. Landscape: two columns with the log spanning the
viewport's bottom — the literal open-ledger metaphor. Sticky Cerrar mes
keeps the thumb zone. Safe-area: `padding: env(safe-area-inset-*)`.

**Testability contract preserved.** The Node suite keeps its shape:
- New `tests/view.test.js`: pure `buildModel(state) -> {hero, rows[], log[]}`
  (a small pure function extracted from view.js, unit-testable in Node —
  replaces layout.test.js as the "view contract")
- CDP: DOM-state assertions replace pixel diffs (query the hero number,
  assert disabled rows carry `.reason` text, click dispatch updates
  state), plus the standing 3-viewport screenshots
- Frozen-coordinates test is replaced by frozen-DOM-contract (stable data-
  testids per action) so the "geometry can't silently move" spirit survives

**Deterministic text, no new randomness:** same strings, same event→line
rendering; DOM order is fixed by template; no Date/Math.random in view.

**Foco -> "Acciones" and burn visible.** `hud.focus` becomes "Acciones"
(help text drift guard will force the legend update in the same task);
hero shows `8m` + gloss "meses de vida"; burn row `Quema: 15k/mes`. Runway
hero uses `font-size: clamp(2.2rem, 8vw, 4rem)`.

**Terminal as share card + meta:** survived/bankrupt stamps stay (they read
as winners — Valentina's "parece mi Excel" proved the stamp lands), add
learning one-liner under the stamp; head gains `og:title/description` and
a generated-stamp-as-inline-SVG data-URI `og:image` (no binary asset,
keeps the no-asset rule). The share-intent number to beat: 2/5.

**Migration order:** new shell behind no flag (single page, tiny app), old
canvas deleted in one step, docs rewritten (README Play/Layout sections).
`ui/main.js` keeps its role as wiring: listeners, dispatch, observers.

## Risks / Trade-offs

- [Full-innerHTML replace kills focus/scroll during typing] → nothing to
  type exists; only the terminal screen has selection — re-render skips
  when state is terminal and unchanged.
- [CSS identity reads weaker than canvas paper] → mitigated: the panel's
  complaint was never the metaphor's color, it was size/contrast; CSS
  reproduces the same tokens at real sizes; round-2 re-check.
- [Deleting frozen-geometry tests loses a safety net] → replaced by
  data-testid contract + DOM-state CDP; the tests that matter for the
  core (146) are untouched.
- [Synthetic gate can pass on sycophantic praise] → gate is friction-
  list shrink + zero new legibility flags + share > 2/5, i.e. negative
  signals, not vibes; humans still confirm before wider distribution.

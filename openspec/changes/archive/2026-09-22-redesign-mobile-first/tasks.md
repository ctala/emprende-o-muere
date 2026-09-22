# Tasks

## 0. Supersede

- [x] 0.1 Mark `add-game-feel` superseded and archive it (append a superseded-by note to its proposal, move to archive; its canvas-tween design cannot apply to a DOM shell). Verify: `openspec list` shows only `redesign-mobile-first` active

## 1. DOM shell

- [x] 1.1 `index.html` + `styles.css`: semantic DOM skeleton (header with month/runway-hero/burn/cash, estado section, acciones list, sticky footer Cerrar mes + Pitch, log footer, `<dialog>` slots offer/help/library/terminal), CSS custom properties carrying the theme.js palette (`--desk` `#2b2118`, `--paper` `#efe7d3`, rules `#c9bda0`, red `#a3312a`, ink `#2a241c`), ledger rules via `repeating-linear-gradient`, red margin rule as border-left, safe-area insets, single breakpoint at 700px (one column portrait / open-book two columns landscape + log spanning), touch targets >= 48px, runway hero `clamp(2.2rem, 8vw, 4rem)`. Verify: no canvas element in index.html

- [x] 1.2 `ui/view.js`: pure `buildModel(state, helpers) -> model` (hero runway + gloss, cash + burn explicit row, morale number+bar+tier word, focus as "Acciones" dots+label, team, energy, founder %, action rows [{id, label, desc, disabled, reason}] with core-loop first and hierarchy classes, footer rows, log lines, terminal model with stamp text + learning line + settlement lines) — all copy via `getString`/`renderLabel`, zero new literals; then a render function filling the template with stable `data-testid`s. `ui/main.js`: listeners on the DOM rows (dispatch, afford checks, auto-close 600ms unchanged), dialogs for offer/help/library, storage/learnings/help wiring unchanged. Verify: `tests/view.test.js` — buildModel over fixed states (fresh, drained offer, disabled close-client reason contains the traction number, bankrupt terminal, survived settlement) replaces the frozen-geometry contract; all other existing Node tests still green (`node --test 'tests/*.test.js'`)

- [x] 1.3 Copy updates: `hud.focus` -> "Acciones", add `hud.burn` ("Quema") + runway gloss string, terminal share-copy + learning-line keys, meta/head strings; fix the help legend entries the drift test flags. Verify: help drift test green; strings test asserting no bare "Foco" label remains in HUD usage

## 2. Delete the canvas world

- [x] 2.1 Remove `ui/main.js` canvas rendering path, `ui/layout.js` (+ its frozen-coordinates/region tests), `ui/theme.js` (values now in styles.css; if any pure helper still has a caller keep only that); update `tests/purity.test.js` if it enumerates modules. Verify: `grep -r "getContext\|<canvas" ui/ index.html` empty; full Node suite green

- [x] 2.2 Terminal share polish: head `og:title/description` + `og:image` as inline-SVG data URI of the stamp (no binary asset), learning one-liner under the stamp on both endings. Verify: DOM assertion (meta tags present, og:image is a data: URI) in the CDP check

## 3. Verify

- [x] 3.1 New CDP verification suite `playtest/verify.mjs` (or tests): DOM-state checks (hero equals floor(cash/burn) after hire, disabled rows carry .reason text, dialog blocks dispatch) + standing 3-viewport screenshots (390×844, 844×390, 1024×768) with 0 console errors, 0 external requests, and a screenshot set reviewed by the user (the round-1 report's `needs-human` list is the review checklist)
- [x] 3.2 Synthetic gate: re-shoot `playtest/shots.sh` against the new build and re-run `run_round.py` (round 2). Accept only if: every round-1 legibility friction is gone from the friction list (or flagged and reviewed), no NEW friction cites legibility/contrast, comprehension stays >= previous scores, share intent > 2/5. Commit `results/round2-report.md`; README dev-log entry (naming/DOM decision + gate numbers) and Roadmap 9/9b updated (9b game-feel marked superseded)
  - Verdict (run twice: pre- and post-ux-review fixes): round-1 top friction (6px canvas text) eliminated — zero physical-legibility flags; comprehension 4/5 · 5/5 · 5/5 (>= round-1 except mes1 litmus noise), share 2/5 held (social barrier, backlog item not a shell defect), remaining needs-human list (4) flagged for the 5-human WhatsApp pass; owner reviewed screenshots and accepted

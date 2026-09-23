# Tasks

## 1. Seal colors + metadata (the "cariño" pass)
- [x] 1.1 styles.css: `.stamp.survived` modifier flips color/border/outline to `--tier-high` (green seal); bankrupt keeps `.stamp` red; headline gains the documentary header treatment (uppercase mono, tracking) and the run stays readable at 393px. Pin: tests/surfaces.test.js gains the survived-modifier check (references `--tier-high`, never `--red`).
- [x] 1.2 ui/view.js + index.html: terminal model gains `meta` (seed + months reached, mono right-aligned facts line) painted under the headline from `ctx.seed` + state.month; `.terminal-meta` CSS. Pin: view.test.js meta line for survived and bankrupt.

## 2. Share post (the viral loop)
- [x] 2.1 ui/share.js (new, pure): `composeShareText({stampWord, months, personalK|null, learn}, seed, selfUrl)` — deterministic plain-text post from strings keys only (`ui.share.*`); survived names the personal total, bankrupt names the month; link carries `?seed=`. Node tests: determinism, seed carried, survived vs bankrupt shapes, no-learn case.
- [x] 2.2 ui/share.js side-effect `performShare(text, url, button)`: canShare/share → clipboard + "copiado" confirmation swap → select() the visible post block. Feature-checks, no new deps. Node tests can't reach it; behavior pinned e2e.
- [x] 2.3 content/strings_es.js: `ui.share.*` keys (post templates, button label, copied confirmation).

## 3. Wiring + fallback surface
- [x] 3.1 ui/main.js: SEED + self URL pass into buildModel ctx (seed/shareUrl); share button click → composeShareText + performShare; no game-state writes from the share path.
- [x] 3.2 index.html + view.js: visible post block (`<textarea readonly>` annotation treatment under the CTA) always rendered on the terminal; CTA row = [Compartir (mini ink)] [Jugar otra vez (ink)].

## 4. e2e + gate
- [x] 4.1 e2e: seed=777 run reaches terminal → post block link contains `seed=777`; stamp color class differs survived vs bankrupt; share click with clipboard stub → "copiado" state visible, no state change (month/seed unchanged); cancel share (stub rejects AbortError) → no error UI.
- [x] 4.2 npm run gate fully green; sweep byte-identical to the two-engines record (zero balance change); help-content budget untouched or its lines updated.

## 5. Evidence + docs
- [x] 5.1 ux-review agent pass on the new terminal (the change runs the loop: review BEFORE applying the next tweak if any P0/P1 appears); reshoot `node playtest/shoot.mjs` gameover shots both outcomes.
- [x] 5.2 Synthetic round-3 prompt (playtest/prompts/round3.v1.md) re-run against the new terminal + visible post; acceptance: share intent >= 3/5 "sí" (legacy 2026-09-22 round-3 baseline: 2/5 with jargon+shame frictions attached) AND, if it lands at 2/5, zero share-blocking frictions and at least one persona's `con_que_texto` quoting the in-game post structure (stamp · months · total · link). Record in the change dir.
- [x] 5.3 CHANGELOG Unreleased lines (green seal, meta line, share block + seed replay); README dev-log entry (terminal = trophy you can forward; seed-replay loop named).

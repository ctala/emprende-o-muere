# UX-review re-run (post-redesign, method: .opencode/agent/ux-review.md)

Prior P1 closure:

- (a) Beige soup — CLOSED. Seam guard `tests/surfaces.test.js` (desk/paper 12.78:1, card-edge/paper 1.30:1); `--card` fill + edge + `--lift` on hero/fields/rows; `fresh_portrait.png` shows cards floating over ruled paper.
- (b) Weak CTA — CLOSED. `.row-end` is the only ink-dark slab (paper-on-ink 12.46:1, 52px min-height); contract test in surfaces.test.js.
- (c) Footer occluding log — CLOSED. `.footer-rows` fixed + `body{padding-bottom:180px}`; e2e pin in flow.test.js (393x852, lastBottom <= barTop).
- (d) Empty log — CLOSED. `log.empty` dim italic line ("Mes 1 · el libro está limpio"); view.test.js.
- (e) Flow-head labels — CLOSED. Wired ids (8b05f25) + right-aligned numeric columns; flow.test.js pin.

Panel allegations measured:

- "Grey text fails WCAG" — REFUTED: --ink-dim #6f6450 = 4.71:1 on paper, 5.15:1 on card (>=4.5). Pinned in surfaces.test.js.
- "Red locked Pitch reads as error" — the disabled row is dashed ink-dim (correct); only the lock-reason text borrowed red → fixed to --gold-deep (6.22:1 on card), pinned by new surfaces test.

New findings, all fixed this change:

- [P0] `.mini` was 35x48 touch target (no min-width) → min-width 48px + inline-flex centering; pinned by surfaces test.
- [P2] Lock reason in ledger red → `.row[disabled] .row-reason { color: var(--gold-deep); }`.
- [P2] Hero "8m" vs "se acaba la caja en el mes 10" reads as contradiction (both provably right: m9 ends at exactly 0, m10 goes negative). Gloss reconciled: "meses de vida" → "meses hasta cero". Diego's next-round verdict now concedes "el cálculo del runway sí está bien planteado" but still reads the pair as tension; accepted as a legibility-of-arithmetic P2, not a bug.

Blocking: 0 P0 after fixes. Gate green (179 unit + 16 e2e).

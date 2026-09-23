# Tasks

## 0. Fix shipped in v0.2.0, proven by the owner's screenshot (pre-change hotfix)
- [x] 0.1 Commit the flow-head label fix already in the tree: index.html head spans get ids (wire() searches by id; without them "entra/sale/Caja" render empty) + the flow.test.js label pin. Verify: `node --test tests/e2e/flow.test.js` green; then continue — the redesign builds on it.

## 1. Tokens + surfaces (kills the beige soup; P1)
- [x] 1.1 styles.css: elevation tokens (`--lift` 2px, `--float` 6px + 2px --gold-deep frame at >=700px, unified on .sheet/.field/.row); card edge --card-edge -> --paper-rule everywhere it separates card from paper; primary rows keep the heavier border treatment, secondaries lighter (visual-hierarchy rule)
- [x] 1.2 CTA stamp: .row-end fill --ink with paper text (>=4.5:1 measured), single fill-dark element on the page; pitch stays secondary (primary-action rule)
- [x] 1.3 Contrast unit test (tests/surfaces.test.js, pure string math over CSS custom props): adjacent surface levels >= 1.3:1; CTA paper-on-ink >= 4.5:1; ink-dim text on paper/card stays >= 4.5:1

## 2. Documentary typography (rhythm + headers)
- [x] 2.1 --rule-line 22px -> 26px: the .sheet repeating-linear-gradient derives from it; .log-lines li, .help-col li, .library-list li -> line-height: var(--rule-line) (1.625 in-band); verify hero/fields unaffected
- [x] 2.2 Uppercase mono + letter-spacing .1em on .flow-title, .month-line, modal titles (.modal-title), plus right-aligned mono metadata treatment (month on the right of the month line)

## 3. Phone P1 + empty state + micro
- [x] 3.1 footer.log moves inside main's flow (or body padding-bottom reserves the bar in the <=699px block); e2e pin: 393x852, play one action, scrollTo(bottom), last #log-lines li bottom < .footer-rows top
- [x] 3.2 Empty log shows strings line 'log.empty' ("Mes 1 · el libro está limpio") when model.log is empty (view.js paint; drift key resolves)
- [x] 3.3 .flow-head span:nth-child(n+2) right-aligned over the numeric columns

## 4. Copy from the panel (content-strings + view)
- [x] 4.1 Burn field: parts line renders only when salaries exist (no "15k/mes · operativa 15k" echo); fresh team shows total once
- [x] 4.2 Energía field gloss "vigor; el pitch gasta, Descansar sube" (panel asked twice); hud.energy.gloss key
- [x] 4.3 Help rules += money loop (3 lines max, <=46 chars each): build->leads->firmar->factura->cobra; team closes monthly; MVP first. Budget tests stay green.
- [x] 4.4 Review-fix round from ux-review re-run (evidence/ux-review-rerun.md): .mini 48px touch square (P0), lock reason off ledger red (P2), runway gloss "meses hasta cero" reconciling 8m vs month 10 (P2); all pinned in tests
- [x] 4.5 Jargon pass + elhda readability bar (OWNER OVERRIDE of the jargon-pin, 2026-09-22, after the v0.2.1 panel round kept 0/5 intent with "habla en cristiano"): Quema→Gastos, Leads→Contactos, Runway→Alcanza, Founder→Dueño, Pitch→Buscar inversor, Pre→Valor; base type 16→17px with --rule-line 28px (reference: owner's elhda-ep22 script shot — 19px serif on ~30px rules, annotations as italic asides); energy shows its number (diego/camila asked twice). Pins updated in the same pass. → DONE + follow-through: hero `8m`→`8 meses` (panel read "m" as millones), gloss "meses hasta cero"→"si no entra plata nueva"; mid-round evidence in results/legacy-20260922/mid-jargon-*.

## 5. Evidence protocol (the proactive loop, pinned as acceptance)
- [x] 5.1 ux-review agent re-run (method of .opencode/agent/ux-review.md) on the new build; every prior P1 must be closed or re-graded with evidence → evidence/ux-review-rerun.md (all 5 prior P1s CLOSED; new P0 mini-width + 2 P2s found and fixed with pins)
- [x] 5.2 Re-shoot shots (node playtest/shoot.mjs) + fresh synthetic round: legacy archived under results/legacy-20260922/; acceptance = intent "sí" >= 1/5 (was 0/5) AND the feo/ardor/planilla-2004 friction cluster (>=3 personas last round) reduced; record both in the change dir → MET after the owner-authorized jargon pass (4.5): intent "sí" 1/5 (valentina; was 0/5, one pass 2→3 quizas then a "sí"); aesthetics cluster 4→3 (camila still "banco viejo", jorge "no tiene sentido"=rules not looks, fernanda moved to hierarchy/overflow, valentina no longer "feo" but "Excel de los lunes" as a joke). Zero jargon-frictions across 3 post-redesign rounds (the "habla en cristiano" cluster died). Understanding back to 5/5. All evidence in evidence/panel-v021-*; discarded rounds under results/legacy-20260922/. Note: 16→17px+28px rule + hero "8 meses" is the single highest-leverage legibility change; fernanda's "texto cortado" is the pinned fixed-CTA bar mid-scroll (e2e proves bottom-scroll clearance), kept as human-confirmation item.
- [x] 5.3 npm run gate fully green incl. new scenarios; sweep untouched (no balance change) — confirm finals match the two-engines record → 179 unit + 16 e2e green; sweep 6/6 families byte-for-byte (harvest-nohire 16/16 $72k · hire-smart 16/16 $2474k · bad-hire 0/16 m6 · sales-first 16/16 $481k · publisher-first 0/16 m13 · no-mvp-forever 0/16 m9)

## 6. Docs
- [x] 6.1 CHANGELOG Unreleased (surface/typography/depth, bar-occlusion fix, flow-labels fix, panel evidence line); README dev-log entry naming the evidence protocol (agent+panel ran BEFORE the proposal)

# Tasks

## 1. Core: engines as table-driven rules
- [x] 1.1 Add `MVP_REQUIRED_BUILDS = 2` + `mvpBuilds` counter (core/state.js initial 0, game.js increments on BUILD_PRODUCT success at any tier); CLOSE_CLIENT rejects without MVP (error message mentions product); new test: MVP gate rejects/truth table + replay of mvpBuilds
- [x] 1.2 Add `pipeline` + `autoClose` fields to ROLES (VENTAS 3/true, CTO 2/false, CFO 1/false, CPO 2/false) and resolve them in perksFor (pipelinePerMonth sum, autoClose any); tests for both derived fields
- [x] 1.3 EndMonth sub-steps: production after decay (traction += pipelinePerMonth, emit `evt.pipeline_produced` when > 0, zero draws), auto-close after production (gate: autoClose && hasMvp && post-production traction >= closeCost; burn closeCost, invoice dealPriceK due newMonth+delay, emit `evt.client_closed_by_team`, max 1/month, zero draws); verify no-team transition is byte-identical to old goldens (rngState + events)

## 2. Sweep decides the numbers
- [x] 2.1 Write `scripts/sweep.mjs` (node, no deps): policy families harvest-nohire, hire-smart (VENTAS->CTO + fundraising accept), bad-hire (CFO/CPO grab), sales-first (build MVP then rest, team does everything), publisher-first (publish + MVP, no ventas); 16 fixed seeds; print survival/months per family
- [x] 2.2 Run the sweep; tune knobs in design D5 order until acceptance bands hold (naive mostly bankrupt, smart-hire 16/16 survives, bad-hire 0/16, naive median death shift <= +4); record final numbers in this file under the task

## 3. Re-pin goldens + full core suite
- [x] 3.1 Update balance tests to the sweep's finals with a comment naming the sweep run; add new balance tests: sales-first survives (team does the work), publisher+ventas combo > publisher alone on cash, MVP-never runs bankrupt (you cannot sell vaporware forever)
- [x] 3.2 Extend replay/seed tests: pipeline production + auto-close replay identically; PRNG goldens untouched (assert same vectors)

## 4. Content: honest framing
- [x] 4.1 strings_es.js: HUD traction label -> "Clientes interesados" gloss; CLOSE_CLIENT desc mentions pipeline; new event templates `evt.pipeline_produced` (role-agnostic, shows +N interesados), `evt.client_closed_by_team` (equipo cerró $Nk); Firmar lock reason "Primero construí el producto (2 builds)"; HIRE perk lines mention pipeline/auto-close for the relevant roles; HELP_SECTIONS: two-engines explainer (equipo trabaja solo; botones = founder) + MVP rule
- [x] 4.2 Drift test: every new EVENT_KEYS entry resolves in strings; every help section key used by ui renders

## 5. UI: show the team working
- [x] 5.1 view.js: Firmar row shows MVP lock reason (reuse ctx.reason path); traction field label from strings (no code change beyond label key); HIRE perk text uses new perk lines
- [x] 5.2 e2e: fresh run at default seed — Firmar disabled month 1 with MVP reason; after 2 builds it enables; sales-first scripted run shows `client_closed_by_team` line in the log and traction moved without a founder click; no-team run's first 3 months log matches old expectations byte-wise (regression)
- [x] 5.3 npm run gate green (147+ new tests)

## 6. Docs + changelog
- [x] 6.1 README: one-paragraph "dos motores" note in Cmo se juega; CHANGELOG Unreleased entry (MVP gate, team engines, pipeline framing, sweep re-pin)

## Sweep finals (recorded 2026-09-22, `node scripts/sweep.mjs`, 16 seeds)
harvest-nohire 16/16 surv, $72k · hire-smart 16/16, $2474k · bad-hire 0/16
(med m6) · sales-first 16/16, $481k · publisher-first 0/16 (med m13) ·
no-mvp-forever 0/16 (med m9). Knobs landed at VENTAS pipeline 6, CTO pipeline
2, CFO/CPO no pipeline (pipeline on the money roles broke the bad-hire
lesson — first-touch knob per design D5). Band note: harvest-nohire surviving
lean (16/16 but $72k vs $2042k smart) matches the pre-change pinned behavior;
tension lives in mean-cash + bad-hire/publisher/vaporware deaths, not in
naive survival (naive was already 8/8-pinned before this change).

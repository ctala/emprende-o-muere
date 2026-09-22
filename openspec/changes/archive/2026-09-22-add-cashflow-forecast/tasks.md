# Tasks

## 1. Core: pure cash-flow derivations (no PRNG, no new state fields)
- [x] 1.1 Add `forecastOf(state, horizon?)` to core/game.js: loop next month .. totalMonths copying traction/invoices/cash as plain integers, replaying cash-relevant month-end steps in order (production -> auto-close with same MVP/traction gates and price/delay -> collect dueMonth<=month -> subtract burn), stop at first negative cash; return frozen `{ months:[{month,inK,outK,cashK}], bankruptMonth|null }`. No rngNext, deepFreeze result.
- [x] 1.2 Add `burnParts(state)` (base + one part per team role's salary, sum === burnFor) and `activeClients(state)` (invoices.length).
- [x] 1.3 Core tests: (a) forecastOf vs a real END_MONTH-only replay from the same state agree cash-for-cash incl. auto-close arrivals on due months and the same bankruptcy month; (b) purity: state serialization + rngState unchanged after forecastOf, and it is idempotent; (c) no-team idle forecast bankrupts at the same month as the idle game with arrivals 0 / burn-only; (d) burnParts sums equals burnFor for every team subset, empty team -> just base; (e) activeClients tracks invoices.

## 2. Copy: leads vs clients, burn parts, CFO fix, projection gloss
- [x] 2.1 strings_es.js: rename player-language traction -> Leads ("Contactos interesados"/"Leads"), add a distinct `hud.clients` "Clientes" label (active contracts); lead-only wording in labor rows (a labor action makes leads, not revenue).
- [x] 2.2 Burn breakdown strings (`hud.burn.base` "operativa", per-role part lines via existing `role.*`) + cash-flow panel strings (`ui.flow.title`, `ui.flow.in`/`ui.flow.out`, `ui.flow.rate.leads`/`.cash`, `ui.flow.bankrupt` "Se acaba la caja en el mes {month}", `ui.flow.survived`, `ui.flow.gloss` stating founder-does-nothing + one-time-per-contract).
- [x] 2.3 Fix CFO hire card: `hirePerkText` only emits the pipeline segment when the role has pipeline > 0 (no more "+0 clientes/mes"); CFO/CPO perk lines drop the dead segment.
- [x] 2.4 Help legend: leads-vs-clients line + projection line (stays within the <=9 lines / <=46 char budget); run-rate gloss.
- [x] 2.5 Drift: help.test HUD_LABEL_KEYS gains hud.clients; every new panel/reason key resolves; event-key strings test still green.

## 3. UI: leads/clients + burn breakdown + cash-flow panel
- [x] 3.1 view.js buildModel: leads field (traction, lead label), clients field (activeClients), burn field rendered as parts (burnParts) with the total matching the runway divisor; add `flow` model block from forecastOf(state) (rate line + rows + bankrupt/survived line). Keep buildModel pure (forecastOf is itself pure).
- [x] 3.2 index.html + styles.css: a secondary ledger section "Flujo de caja" between the state sheet and actions — run-rate line, one mono row per projected month (in / out / cash, red negatives), red bankrupt line or survived line, gloss; portrait-first, >=16px, respects the existing sheet/card identity.
- [x] 3.3 renderView: paint the flow block idempotently (same state -> same DOM; recompute naturally on the next render after a month changes — no timers, no randomness).
- [x] 3.4 view.test.js: leads vs clients distinct labels on a state with invoices; burn parts render and sum to the runway's burn; flow block present with a projected bankruptcy month on a fresh no-team state and with arrivals landing on a signed invoice's due month; CFO card no longer shows "+0"; CFO-state flow shows an arrival one month earlier than the equal non-CFO state.

## 4. Browser gate + sweep unchanged + docs
- [x] 4.1 e2e (tests/e2e/flow.test.js): fresh run shows the cash-flow panel with a red projected-bankruptcy month and no console errors; the burn shows its breakdown; leads and clients appear as separate fields; opening help shows the leads-vs-clients and projection lines. No external requests, targets >=48px (reuse the harness's checks).
- [x] 4.2 Confirm no balance/regression drift: `node scripts/sweep.mjs` finals unchanged vs two-engines-economy (legibility-only change) and full `npm run gate` green.
- [x] 4.3 README: cash-flow panel + leads-vs-clients + CFO-in-forecast note under Two engines / Test; CHANGELOG Unreleased entry; one Dev-log line.

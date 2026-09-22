# Tasks

## 1. Core: cash model

- [x] 1.1 Add `VERTICALS` (b2b_saas: startCashK 120, burnK 15, delayMonths 3, dealMin 20, dealTen 10, dealCostTraction 10) to `core/game.js`, extend `createGame` with `cashK`, `invoices: []`, `reason: null`, `vertical: 'b2b_saas'`; verify `node --test` createGame determinism/shape tests green with the new fields
- [x] 1.2 Implement `CLOSE_CLIENT` (cost 1 focus + 10 traction, rejected under 10 traction, invoice `{ amountK: dealMin + dealTen * trunc(traction/10), dueMonth: month + 3 }`, no cash change, no rng draw, `evt.action_taken` params match state diff); verify `node --test`: pricing at traction 37 -> 50k, rejection at traction 9, rngState unchanged
- [x] 1.3 Implement END_MONTH cash flow in specified order (decay -> month+1 -> collect due at new month -> burn -> bankruptcy check `cashK < 0` -> survived at 24), events for collected/burn and terminal `evt.run_ended` with `reason` param; verify `node --test`: invoice paid exactly at due month, burn always subtracts, cash 0 survives, cash -5 bankrupts with reason `bankrupt` and month stays
- [x] 1.4 Update run-span tests: replay loops become `while (!state.gameOver)`, terminal reason `survived` asserted at 24 with cash >= 0; add balance tests: idle plan (REST,REST,END_MONTH) bankrupts before month 10, disciplined plan (build up then REST/CLOSE_CLIENT cadence) survives 24 with cash >= 0; verify `node --test` fully green including pre-existing replay determinism

## 2. Content

- [x] 2.1 Add strings: `action.CLOSE_CLIENT(+desc)`, HUD `hud.cash`/`hud.runway`, events `evt.invoice_created`, `evt.invoice_paid`, `evt.salaries_paid`, `evt.run_ended.survived`, `evt.run_ended.bankrupt` (neutral Spanish, $k display via params); verify event-key coverage test green

## 3. UI

- [x] 3.1 Extend `ui/layout.js` with the CLOSE_CLIENT button region (full-width, above END_MONTH) and HUD two-row geometry; add hitRegion coverage + no-overlap tests for the new region; verify `node --test` layout suite green
- [x] 3.2 Generalize `render()` to resolve `${key}.${params.reason ?? params.action}` before falling back to `${key}` (existing action-suffix behavior unchanged); verify renderer test: run_ended renders survived vs bankrupt copy from reason param
- [x] 3.3 Rework `ui/main.js`: 5th button (disabled when focus 0 or traction < deal cost), HUD cash `$Xk` (red when <= burn) + runway months, terminal copy per reason; verify via CDP: full click-only disciplined run survives to month 24 (survived copy visible), idle run shows bankrupt copy at cash < 0, zero console errors, zero external requests

## 4. Integration

- [x] 4.1 `node --test` green and full CDP manual pass screenshots reviewed (bankrupt frame + survived frame); record balance impressions (when did cash turn positive, did runway feel scary early) in README dev log for vertical-selection tuning later

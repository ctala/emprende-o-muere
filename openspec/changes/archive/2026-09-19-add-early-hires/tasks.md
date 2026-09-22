# Tasks

## 1. Core: roles and perks

- [x] 1.1 Add `ROLES` (VENTAS 6/4/closeCost 6, CTO 10/6/buildBase 12/buildMorale 6, CFO 12/8/delay 2, CPO 8/6/talkBase 9/talkMorale 3, with `hireOrder`) plus `perksFor(team)` and `burnFor(team)` to `core/game.js`; add `team: []` to `createGame`; verify `node --test` existing suites stay fully green (empty team must be identity)
- [x] 1.2 Implement `HIRE` action (`{type:'HIRE', role}`): rejects unknown role / duplicate / cash < sign-on / focus 0 without state change; deducts sign-on, appends role, `evt.action_taken` params carry role and actual cash delta; no rng draw; verify `node --test` hire scenarios incl. immutability and freeze of team array
- [x] 1.3 Route labor yields/morale costs, CLOSE_CLIENT traction cost and delay through `perksFor(state.team)` (no role-name branches in rules code) and month-end burn + salary events through `burnFor`; verify `node --test`: CTO build = 12+jitter/-6, VENTAS signs at traction 6, CFO invoice due = month+2, burn 15+6+4 = 25 with CTO+VENTAS
- [x] 1.4 Balance regression tests on the real core: harvest-nohire survives 8/8 seeds (existing), harvest with hire-when-safe (hire next role only if cash - sign-on >= 3x effective burn) survives >= 5/8 and any survivor has cash > no-hire median survivor, hire-eager (hire whenever sign-on affordable) bankrupts 8/8 before month 24; verify `node --test` and record the survivor counts/cash finals in test output comments for the next tuning

## 2. Content

- [x] 2.1 Add strings: `role.VENTAS/CTO/CFO/CPO` names + perks one-liners, `action.HIRE` template with `{role}`/`{signOnK}`/`{newBurnK}` placeholders, `evt.action_taken.HIRE`; verify event-key coverage test green

## 3. UI

- [x] 3.1 Rework `ui/layout.js` to the 2x3 action grid (BUILD/TALK/PUBLISH, REST/CLOSE/HIRE) + full-width END_MONTH + log, keeping pure region exports; update layout tests for new regions and no-overlap; verify `node --test` layout suite green
- [x] 3.2 Rework `ui/main.js`: HIRE button targets next unhired role via `hireOrder`, label interpolates role + sign-on + new effective burn, disabled when unaffordable/complete/focus 0/game-over; HUD shows team role labels and runway from effective burn, alarm threshold = effective burn; verify via CDP harness: click-only run hires VENTAS then CTO when affordable and survives to month 24 (screenshot reviewed), hire-eager policy bankrupts with red HUD visible at low cash (screenshot reviewed), 0 console errors, 0 external requests

## 4. Integration

- [x] 4.1 `node --test` green + full CDP no-hire playthrough confirms bootstrap path unchanged (survives, cash trajectory matches 03 behavior); update README dev log with hire balance notes for fundraising tuning (which hire felt mandatory vs optional)

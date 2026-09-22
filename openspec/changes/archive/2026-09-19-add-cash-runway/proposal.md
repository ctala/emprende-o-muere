# Proposal

## Why

Right now the game cannot be lost and money does not exist. The defining startup experience — revenue arriving late while salaries leave every month, so you can be "going great" and still die — needs to land before fundraising means anything. This also realizes the two-path economy: reaching profitability (bootstrapping) is a complete winning strategy on its own; fundraising (change 04/05) will be an alternative that trades dilution for time, not a strictly better upgrade.

## What Changes

- Add cash and invoices. Single vertical profile (`b2b_saas`) as the first row of a VERTICALS data table (future b2c/enterprise are data rows, not mechanics): start cash 120k, monthly burn 15k, clients pay at 90 days (3 months).
- Add the 5th action `CLOSE_CLIENT`: costs 1 focus + 10 traction and signs a client whose invoice pays `dealMin + dealTen × floor(traction/10)` thousands, due 3 months later. Deal value reads the vertical profile.
- Cash flow at END_MONTH, fixed order: collect invoices due that month, then pay salaries (burn), then check bankruptcy.
- Bankruptcy = cash < 0 -> game over (terminal) with a distinct reason, ending the run before month 24. Reaching month 24 with cash >= 0 stays a normal run end (the exit math comes in change 07).
- HUD shows cash and runway (months floor(cash/burn)); new terminal screen for bankruptcy.
- Spanish strings for the new events (invoice created/paid, salaries, bankruptcy) and HUD labels.
- Tests: replay loops now run `while (!gameOver)`; new tests for deal pricing, invoice due timing, collection ordering, bankruptcy transition.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `game-core`: cash/invoices state, CLOSE_CLIENT action, END_MONTH cash order, bankruptcy terminal condition; run span now "month 24 OR earlier bankruptcy".
- `ui-shell`: 5th action button, cash/runway HUD, bankruptcy terminal display, new event keys rendered.
- `content-strings`: new keys only; no new normative behavior.

## Impact

- `core/game.js` (+ VERTICALS tuning block), `core/state.js` (state gains `cashK`, `invoices`, `reason`), `ui/layout.js` (5-button grid), `ui/main.js` (HUD + terminal variants), `content/strings_es.js`, `tests/` (replay loops + new suites).
- No new rng draws: deal pricing is a deterministic formula (traction compounds into larger deals; randomness stays in labor jitter and morale decay).
- BREAKING for existing replay logs: action vocabulary grows and old 24-turn scripts can now bankrupt earlier — pre-release, no migration.
- Bootstrapping balance target: disciplined play (build up, close growing deals, rest) trends cash-positive; idle or burnout play dies by month ~5. Verified by scripted runs in tests.

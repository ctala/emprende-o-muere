// Balance sweep: policy families x fixed seeds -> survival/months.
// The tuning block in core/game.js is the knob set; this script is the
// acceptance gate the tests pin. node scripts/sweep.mjs [--json]

import { createGame } from '../core/state.js';
import {
  applyAction,
  ACTION_END_MONTH,
  ACTION_HIRE,
  ACTION_PITCH,
  ACTION_ACCEPT_ROUND,
  perksFor,
  burnFor,
  VERTICALS,
  ACTIVE_VERTICAL,
  ROLES,
  HIRE_ORDER,
  FOCUS_PER_MONTH,
} from '../core/game.js';

const V = VERTICALS[ACTIVE_VERTICAL];
const SEEDS = [11, 22, 33, 44, 55, 66, 77, 88, 91, 102, 113, 124, 135, 146, 157, 168];
const mvp = (s) => s.mvpBuilds >= 2;

// Each policy is (state) -> action object | null. focus-0 -> close month.
const POLICIES = {
  'harvest-nohire': (s) => {
    if (mvp(s) && s.traction >= V.dealCostTraction && (s.cashK < 80 || s.traction >= 35)) {
      return { type: 'CLOSE_CLIENT' };
    }
    if (s.teamMorale >= 40) return { type: s.focus === FOCUS_PER_MONTH ? 'BUILD_PRODUCT' : 'REST' };
    return { type: 'REST' };
  },
  'hire-smart': (s) => {
    const next = HIRE_ORDER.find((r) => !s.team.includes(r) && (r === 'VENTAS' || r === 'CTO'));
    if (next) {
      const effBurn = burnFor([...s.team, next], V);
      if (s.cashK - ROLES[next].signOnK >= effBurn * 3) return { type: ACTION_HIRE, role: next };
    }
    if (s.month >= 6 && s.pitchCooldown === 0 && !s.offer && s.founderEnergy >= 40) {
      return { type: ACTION_PITCH };
    }
    if (s.offer) return { type: ACTION_ACCEPT_ROUND };
    if (mvp(s) && s.traction >= perksFor(s.team, V).closeCost && (s.cashK < 80 || s.traction >= 35)) {
      return { type: 'CLOSE_CLIENT' };
    }
    if (s.teamMorale >= 40) return { type: s.focus === FOCUS_PER_MONTH ? 'BUILD_PRODUCT' : 'REST' };
    return { type: 'REST' };
  },
  'bad-hire': (s) => {
    const next = HIRE_ORDER.find((r) => !s.team.includes(r) && (r === 'CFO' || r === 'CPO'));
    if (next && s.cashK >= ROLES[next].signOnK + 1) return { type: ACTION_HIRE, role: next };
    if (mvp(s) && s.traction >= perksFor(s.team, V).closeCost && (s.cashK < 80 || s.traction >= 35)) {
      return { type: 'CLOSE_CLIENT' };
    }
    if (s.teamMorale >= 40) return { type: s.focus === FOCUS_PER_MONTH ? 'BUILD_PRODUCT' : 'REST' };
    return { type: 'REST' };
  },
  'sales-first': (s) => {
    if (!s.team.includes('VENTAS') && s.cashK >= ROLES.VENTAS.signOnK + 20) {
      return { type: ACTION_HIRE, role: 'VENTAS' };
    }
    if (s.mvpBuilds < 2) return { type: 'BUILD_PRODUCT' };
    return { type: 'REST' }; // team feeds + closes itself; founder rests
  },
  'publisher-first': (s) => {
    if (s.mvpBuilds < 2) return { type: 'BUILD_PRODUCT' };
    if (s.traction >= perksFor(s.team, V).closeCost) return { type: 'CLOSE_CLIENT' };
    return { type: 'PUBLISH_CONTENT' };
  },
  'no-mvp-forever': (s) => {
    // Never builds twice: cannot sign. Proves the MVP gate actually bites.
    if (s.traction >= 5) return { type: 'TALK_TO_CUSTOMERS' };
    return { type: 'BUILD_PRODUCT' }; // exactly 1 build, never a 2nd
  },
};

function run(policyName, seed) {
  const policy = POLICIES[policyName];
  let state = createGame(seed);
  let guard = 0;
  while (!state.gameOver && guard < 600) {
    guard += 1;
    if (state.offer) { state = applyAction(state, { type: ACTION_ACCEPT_ROUND }).state; continue; }
    if (state.focus === 0) { state = applyAction(state, { type: ACTION_END_MONTH }).state; continue; }
    const action = policy(state);
    if (!action) { state = applyAction(state, { type: ACTION_END_MONTH }).state; continue; }
    try {
      state = applyAction(state, action).state;
    } catch {
      state = applyAction(state, { type: 'REST' }).state;
    }
  }
  return state;
}

export function sweep() {
  const out = {};
  for (const name of Object.keys(POLICIES)) {
    const results = SEEDS.map((seed) => run(name, seed));
    const survived = results.filter((s) => s.reason === 'survived').length;
    const months = results.map((s) => s.month).sort((a, b) => a - b);
    const cash = results.filter((s) => s.reason === 'survived').map((s) => s.cashK);
    out[name] = {
      survived,
      total: SEEDS.length,
      medianMonth: months[Math.floor(months.length / 2)],
      meanCashSurv: cash.length ? Math.round(cash.reduce((a, b) => a + b, 0) / cash.length) : 0,
    };
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = sweep();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(out, null, 2));
  } else {
    for (const [name, r] of Object.entries(out)) {
      console.log(`${name.padEnd(16)} survive ${r.survived}/${r.total}  med-month ${r.medianMonth}  mean-cash $${r.meanCashSurv}k`);
    }
  }
}

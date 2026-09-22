import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, TOTAL_MONTHS, INITIAL_MORALE, deepFreeze } from '../core/state.js';
import {
  applyAction,
  ACTION_END_MONTH,
  ACTION_HIRE,
  ACTION_TYPES,
  EVENT_KEYS,
  FOCUS_PER_MONTH,
  ACTION_DEFS,
  TIER_HIGH_MIN,
  TIER_MEDIUM_MIN,
  MORALE_MAX,
  END_MONTH_DECAY,
  END_MONTH_DECAY_JITTER,
  VERTICALS,
  ACTIVE_VERTICAL,
  ROLES,
  HIRE_ORDER,
  dealPriceK,
  priceOffer,
  perksFor,
  exitOf,
  burnFor,
  offerTier,
  moraleTier,
} from '../core/game.js';
import { getString } from '../content/strings_es.js';
import { rngNext } from '../core/rng.js';

const serialize = (x) => JSON.stringify(x);
const act = (type) => ({ type });
const endMonth = () => act(ACTION_END_MONTH);
const V = VERTICALS[ACTIVE_VERTICAL];

/** Apply actions until terminal (or list exhausted). Returns final state + events. */
function run(seedOrState, types) {
  let state = typeof seedOrState === 'number' ? createGame(seedOrState) : seedOrState;
  const events = [];
  for (const t of types) {
    if (state.gameOver) break;
    const r = applyAction(state, act(t));
    state = r.state;
    events.push(...r.events);
  }
  return { state, events };
}

/** Repeat a monthly plan until terminal or 24 months played. */
function runMonths(seedOrState, monthPlan) {
  const types = [];
  for (let i = 0; i < TOTAL_MONTHS; i += 1) types.push(...monthPlan);
  return run(seedOrState, types);
}

test('createGame is deterministic for the same seed', () => {
  assert.equal(serialize(createGame(12345)), serialize(createGame(12345)));
});

test('createGame differs for different seeds', () => {
  assert.notEqual(serialize(createGame(1).rngState), serialize(createGame(2).rngState));
});

test('initial state shape', () => {
  const s = createGame(12345);
  assert.equal(s.month, 1);
  assert.equal(s.totalMonths, TOTAL_MONTHS);
  assert.equal(s.gameOver, false);
  assert.equal(s.reason, null);
  assert.equal(s.focus, FOCUS_PER_MONTH);
  assert.equal(s.traction, 0);
  assert.equal(s.teamMorale, INITIAL_MORALE);
  assert.equal(s.vertical, 'b2b_saas');
  assert.equal(s.cashK, VERTICALS.b2b_saas.startCashK);
  assert.deepEqual(s.invoices, []);
});

test('END_MONTH advances month, resets focus, decays morale', () => {
  const s0 = createGame(12345);
  const { state: s1, events } = applyAction(s0, endMonth());
  assert.equal(s1.month, 2);
  assert.equal(s1.focus, FOCUS_PER_MONTH);
  const decayed = s0.teamMorale - s1.teamMorale;
  assert.ok(decayed >= END_MONTH_DECAY - END_MONTH_DECAY_JITTER);
  assert.ok(decayed <= END_MONTH_DECAY + END_MONTH_DECAY_JITTER);
  assert.ok(events.some((e) => e.key === EVENT_KEYS.MONTH_ADVANCED && e.params.month === 2));
});

test('stale NEXT_MONTH is rejected as unknown action', () => {
  const s = createGame(1);
  assert.throws(() => applyAction(s, act('NEXT_MONTH')), /unknown action/i);
});

test('every event key resolves in strings_es', () => {
  for (const key of Object.values(EVENT_KEYS)) {
    assert.equal(typeof getString(key), 'string');
  }
});

test('game name is Spanish, no English working title survives', () => {
  const title = getString('ui.title');
  const subtitle = getString('ui.subtitle');
  assert.equal(title, 'Emprende o Muere');
  assert.match(subtitle, /startups/);
  for (const word of ['Startup', 'Roguelite', 'LatAm']) {
    assert.ok(!title.includes(word));
    assert.ok(!subtitle.includes(word));
  }
});

test('run ends at month 24 with reason survived', () => {
  const rich = { ...createGame(777), cashK: 10000 };
  const { state, events } = run(rich, Array(TOTAL_MONTHS).fill(ACTION_END_MONTH));
  assert.equal(state.month, 24);
  assert.equal(state.gameOver, true);
  assert.equal(state.reason, 'survived');
  const ended = events.find((e) => e.key === EVENT_KEYS.RUN_ENDED);
  assert.equal(ended.params.reason, 'survived');
});

test('action after game over throws and leaves state unchanged', () => {
  const rich = { ...createGame(777), cashK: 10000 };
  const { state } = run(rich, Array(TOTAL_MONTHS).fill(ACTION_END_MONTH));
  const before = serialize(state);
  assert.throws(() => applyAction(state, endMonth()), /game is over/i);
  assert.throws(() => applyAction(state, act('REST')), /game is over/i);
  assert.equal(before, serialize(state));
});

test('unknown action type throws', () => {
  const s = createGame(1);
  assert.throws(() => applyAction(s, act('RAISE_SEED_ROUND')), /unknown action/i);
  assert.throws(() => applyAction(s, null), /invalid action/i);
});

test('input state is never mutated', () => {
  const s0 = { ...createGame(4242), traction: 25 };
  const before = serialize(s0);
  applyAction(s0, act('BUILD_PRODUCT'));
  applyAction(s0, act('CLOSE_CLIENT'));
  applyAction(s0, endMonth());
  assert.equal(before, serialize(s0));
});

test('returned state and events are deeply frozen', () => {
  const { state, events } = applyAction(createGame(4242), act('BUILD_PRODUCT'));
  assert.ok(Object.isFrozen(state));
  assert.ok(Object.isFrozen(events));
  assert.ok(Object.isFrozen(events[0].params));
});

test('deepFreeze reaches nested objects', () => {
  const obj = deepFreeze({ a: { b: [1, { c: 2 }] } });
  assert.ok(Object.isFrozen(obj.a.b[1]));
});

// --- focus budget ------------------------------------------------------------

test('each action costs one focus', () => {
  for (const type of ACTION_TYPES) {
    const traction = type === 'CLOSE_CLIENT' ? 25 : 0;
    const { state } = applyAction({ ...createGame(99), traction }, act(type));
    assert.equal(state.focus, FOCUS_PER_MONTH - 1, type);
  }
});

test('actions rejected when focus exhausted, state unchanged', () => {
  let state = { ...createGame(99), traction: 25 };
  ({ state } = applyAction(state, act('BUILD_PRODUCT')));
  ({ state } = applyAction(state, act('CLOSE_CLIENT')));
  assert.equal(state.focus, 0);
  const before = serialize(state);
  for (const type of ACTION_TYPES) {
    assert.throws(() => applyAction(state, act(type)), /no focus/i, type);
  }
  assert.equal(before, serialize(state));
});

test('END_MONTH costs no focus and refills it', () => {
  let state = createGame(99);
  ({ state } = applyAction(state, act('BUILD_PRODUCT')));
  ({ state } = applyAction(state, act('BUILD_PRODUCT')));
  assert.equal(state.focus, 0);
  ({ state } = applyAction(state, endMonth()));
  assert.equal(state.focus, FOCUS_PER_MONTH);
});

// --- morale tiers and labor yields --------------------------------------------

test('tier boundaries exactly at thresholds', () => {
  assert.equal(moraleTier(TIER_HIGH_MIN), 2);
  assert.equal(moraleTier(TIER_HIGH_MIN - 1), 1);
  assert.equal(moraleTier(TIER_MEDIUM_MIN), 2 - 1);
  assert.equal(moraleTier(TIER_MEDIUM_MIN - 1), 0);
});

function atMorale(morale, seed = 4242) {
  const base = createGame(seed);
  return deepFreeze({ ...base, teamMorale: Math.max(0, Math.min(100, morale)) });
}

test('high morale labor = base + jitter, morale cost applied', () => {
  const s = atMorale(80);
  const { state } = applyAction(s, act('TALK_TO_CUSTOMERS'));
  const gain = state.traction - s.traction;
  assert.ok(gain >= 6 - 3 && gain <= 6 + 3, `gain ${gain}`);
  assert.equal(state.teamMorale, 80 - ACTION_DEFS.TALK_TO_CUSTOMERS.moraleCost);
});

test('medium morale truncates yield in half for every possible jitter', () => {
  const seen = new Set();
  const s = atMorale(TIER_MEDIUM_MIN);
  for (let r = 0; r < 5000 && seen.size < 7; r += 1) {
    const trial = deepFreeze({ ...s, rngState: r });
    const { state } = applyAction(trial, act('PUBLISH_CONTENT'));
    if (state.rngState === trial.rngState) continue;
    const step = rngNext(r);
    const jitterVal = (step.value % 7) - 3;
    const expected = Math.trunc((4 + jitterVal) / 2);
    const gain = state.traction - trial.traction;
    assert.equal(gain, expected, `jitter ${jitterVal}: gain ${gain} != expected ${expected}`);
    seen.add(jitterVal);
  }
  assert.equal(seen.size, 7, 'expected to sweep all jitter values [-3..3]');
});

test('low morale labor yields nothing and does not draw rng', () => {
  const s = atMorale(TIER_MEDIUM_MIN - 1);
  const { state } = applyAction(s, act('BUILD_PRODUCT'));
  assert.equal(state.traction, s.traction);
  assert.equal(state.rngState, s.rngState, 'no draw at low tier');
  assert.equal(state.teamMorale, s.teamMorale - ACTION_DEFS.BUILD_PRODUCT.moraleCost);
});

test('REST gains morale without traction or rng draw', () => {
  const s = atMorale(50);
  const { state } = applyAction(s, act('REST'));
  assert.equal(state.traction, s.traction);
  assert.equal(state.rngState, s.rngState, 'REST must not draw');
  assert.equal(state.teamMorale, 50 + ACTION_DEFS.REST.moraleGain);
});

test('REST clamps at MORALE_MAX', () => {
  const s = atMorale(MORALE_MAX - 5);
  const { state } = applyAction(s, act('REST'));
  assert.equal(state.teamMorale, MORALE_MAX);
});

test('morale decays at END_MONTH clamp at 0', () => {
  const s = deepFreeze({ ...createGame(5), cashK: 100000, teamMorale: 1 });
  const { state } = applyAction(s, endMonth());
  assert.equal(state.teamMorale, 0);
  const again = applyAction(state, endMonth());
  assert.equal(again.state.teamMorale, 0);
});

// --- cash model ---------------------------------------------------------------

test('deal price scales with traction', () => {
  assert.equal(dealPriceK(37), 20 + 10 * 3);
  assert.equal(dealPriceK(10), 30);
  assert.equal(dealPriceK(9), 20);
});

test('CLOSE_CLIENT signs invoice due in delay months, no cash change, no draw', () => {
  const s = { ...createGame(42), traction: 30 };
  const { state, events } = applyAction(s, act('CLOSE_CLIENT'));
  assert.equal(state.traction, 30 - V.dealCostTraction);
  assert.equal(state.cashK, s.cashK);
  assert.equal(state.rngState, s.rngState);
  assert.equal(state.invoices.length, 1);
  assert.equal(state.invoices[0].amountK, dealPriceK(30));
  assert.equal(state.invoices[0].dueMonth, 1 + V.delayMonths);
  assert.ok(events.some((e) => e.key === EVENT_KEYS.INVOICE_CREATED));
  const taken = events.find((e) => e.key === EVENT_KEYS.ACTION_TAKEN);
  assert.equal(taken.params.tractionDelta, -V.dealCostTraction);
});

test('CLOSE_CLIENT rejected below traction cost, state unchanged', () => {
  const s = { ...createGame(42), traction: 9 };
  const before = serialize(s);
  assert.throws(() => applyAction(s, act('CLOSE_CLIENT')), /traction/i);
  assert.equal(before, serialize(s));
});

test('CLOSE_CLIENT price reads traction at signing time', () => {
  const s = { ...createGame(42), traction: 37 };
  const { state } = applyAction(s, act('CLOSE_CLIENT'));
  assert.equal(state.invoices[0].amountK, 50); // 20 + 10*3 (traction BEFORE cost deduction)
});

test('invoice pays exactly at due month', () => {
  let s = { ...createGame(7), traction: 25 };
  ({ state: s } = applyAction(s, act('CLOSE_CLIENT'))); // signed month 1, due month 4
  const dueMonth = s.invoices[0].dueMonth;
  assert.equal(dueMonth, 4);
  let paidEvent = null;
  while (s.month < dueMonth - 1 && !s.gameOver) {
    ({ state: s } = applyAction(s, endMonth()));
  }
  // currently month 3; closing advances to 4 and pays
  const r = applyAction(s, endMonth());
  paidEvent = r.events.find((e) => e.key === EVENT_KEYS.INVOICE_PAID);
  assert.ok(paidEvent);
  assert.equal(r.state.cashK, s.cashK + dueAmount(r) - V.burnK);
  assert.equal(r.state.invoices.length, 0);
  function dueAmount(res) {
    return paidEvent.params.amountK;
  }
});

test('salaries always subtract burn', () => {
  const s = deepFreeze({ ...createGame(3), cashK: 100 });
  const { state, events } = applyAction(s, endMonth());
  assert.equal(state.cashK, 100 - V.burnK);
  assert.ok(events.some((e) => e.key === EVENT_KEYS.SALARIES_PAID && e.params.amountK === V.burnK));
});

test('negative cash bankrupts with reason, month stays', () => {
  const s = deepFreeze({ ...createGame(3), cashK: 10 });
  const { state, events } = applyAction(s, endMonth());
  assert.equal(state.cashK, -5);
  assert.equal(state.gameOver, true);
  assert.equal(state.reason, 'bankrupt');
  assert.equal(state.month, 1);
  assert.equal(events.find((e) => e.key === EVENT_KEYS.RUN_ENDED).params.reason, 'bankrupt');
});

test('cash exactly zero survives', () => {
  const s = deepFreeze({ ...createGame(3), cashK: V.burnK });
  const { state } = applyAction(s, endMonth());
  assert.equal(state.cashK, 0);
  assert.equal(state.gameOver, false);
  assert.equal(state.reason, null);
});

// --- balance: scripted trajectories -------------------------------------------

test('idle plan goes bankrupt before month 10', () => {
  const { state } = runMonths(555, ['BUILD_PRODUCT', 'BUILD_PRODUCT', ACTION_END_MONTH]);
  assert.equal(state.gameOver, true);
  assert.equal(state.reason, 'bankrupt');
  assert.ok(state.month < 10, `bankrupt too late: month ${state.month}`);
});

test('harvest plan survives 24 months with cash >= 0 on many seeds', () => {
  const harvest = (s) => {
    if (s.traction >= V.dealCostTraction && (s.cashK < 80 || s.traction >= 35)) return 'CLOSE_CLIENT';
    if (s.teamMorale >= 40) return s.focus === FOCUS_PER_MONTH ? 'BUILD_PRODUCT' : 'REST';
    return 'REST';
  };
  let survivors = 0;
  for (const seed of [11, 22, 33, 44, 55, 66, 77, 88]) {
    let state = createGame(seed);
    while (!state.gameOver) {
      if (state.focus === 0) {
        ({ state } = applyAction(state, endMonth()));
        continue;
      }
      ({ state } = applyAction(state, act(harvest(state))));
    }
    if (state.reason === 'survived') {
      survivors += 1;
      assert.ok(state.cashK >= 0);
    }
  }
  assert.equal(survivors, 8, 'harvest plan must survive all pinned seeds at B tuning');
});

// --- replay determinism -------------------------------------------------------

test('replay determinism: scripted 24-month plan byte-identical', () => {
  const replay = () => {
    let state = createGame(20260918);
    for (let m = 0; m < TOTAL_MONTHS && !state.gameOver; m += 1) {
      for (const t of ['BUILD_PRODUCT', 'TALK_TO_CUSTOMERS']) {
        ({ state } = applyAction(state, act(t)));
      }
      ({ state } = applyAction(state, endMonth()));
    }
    return serialize(state);
  };
  assert.equal(replay(), replay());
});

test('draw audit: two identical replays consume identical rng transitions', () => {
  const trace = () => {
    let state = createGame(555);
    const seen = [];
    while (!state.gameOver) {
      let r = applyAction(state, act('BUILD_PRODUCT'));
      seen.push(r.state.rngState);
      state = r.state;
      if (state.focus > 0) {
        r = applyAction(state, act('REST'));
        seen.push(r.state.rngState); // REST must never advance rng
        state = r.state;
      }
      r = applyAction(state, endMonth());
      seen.push(r.state.rngState);
      state = r.state;
    }
    return { final: serialize(state), seen: serialize(seen) };
  };
  const a = trace();
  const b = trace();
  assert.equal(a.final, b.final);
  assert.equal(a.seen, b.seen);
});

// --- hiring -------------------------------------------------------------------

test('hire costs focus and sign-on cash, no rng draw', () => {
  const s = createGame(99);
  const { state, events } = applyAction(s, { type: ACTION_HIRE, role: 'CTO' });
  assert.ok(state.team.includes('CTO'));
  assert.equal(state.cashK, s.cashK - ROLES.CTO.signOnK);
  assert.equal(state.focus, FOCUS_PER_MONTH - 1);
  assert.equal(state.rngState, s.rngState);
  const e = events.find((ev) => ev.key === EVENT_KEYS.ACTION_TAKEN);
  assert.equal(e.params.role, 'CTO');
  assert.equal(e.params.cashDelta, -ROLES.CTO.signOnK);
});

test('duplicate hire rejected', () => {
  let s = createGame(99);
  ({ state: s } = applyAction(s, { type: ACTION_HIRE, role: 'CTO' }));
  const before = serialize(s);
  assert.throws(() => applyAction(s, { type: ACTION_HIRE, role: 'CTO' }), /already/i);
  assert.equal(before, serialize(s));
});

test('unaffordable sign-on rejected', () => {
  const s = deepFreeze({ ...createGame(3), cashK: ROLES.CFO.signOnK - 1 });
  assert.throws(() => applyAction(s, { type: ACTION_HIRE, role: 'CFO' }), /cash/i);
});

test('unknown role rejected', () => {
  const s = createGame(3);
  assert.throws(() => applyAction(s, { type: ACTION_HIRE, role: 'CMO' }), /unknown role/i);
});

test('team array is frozen and immutable', () => {
  let s = createGame(99);
  ({ state: s } = applyAction(s, { type: ACTION_HIRE, role: 'VENTAS' }));
  assert.ok(Object.isFrozen(s.team));
});

test('CTO build perk: 12+jitter with -6 morale', () => {
  const s = deepFreeze({ ...createGame(5), team: Object.freeze(['CTO']) });
  const { state } = applyAction(s, act('BUILD_PRODUCT'));
  const gain = state.traction - s.traction;
  assert.ok(gain >= 12 - 3 && gain <= 12 + 3, `gain ${gain}`);
  assert.equal(state.teamMorale, 80 - 6);
});

test('VENTAS signs at traction 6', () => {
  const s = deepFreeze({ ...createGame(5), traction: 6, team: Object.freeze(['VENTAS']) });
  const { state } = applyAction(s, act('CLOSE_CLIENT'));
  assert.equal(state.traction, 0);
  assert.equal(state.invoices.length, 1);
});

test('CFO shortens collection to delay 2', () => {
  const s = deepFreeze({ ...createGame(5), traction: 30, team: Object.freeze(['CFO']) });
  const { state } = applyAction(s, act('CLOSE_CLIENT'));
  assert.equal(state.invoices[0].dueMonth, 1 + 2);
});

test('burn with team: profile + salaries', () => {
  const s = deepFreeze({ ...createGame(5), cashK: 100, team: Object.freeze(['CTO', 'VENTAS']) });
  const expected = V.burnK + ROLES.CTO.salaryK + ROLES.VENTAS.salaryK;
  const { state } = applyAction(s, endMonth());
  assert.equal(state.cashK, 100 - expected);
});

test('no team, burn unchanged', () => {
  const s = deepFreeze({ ...createGame(5), cashK: 100 });
  const { state } = applyAction(s, endMonth());
  assert.equal(state.cashK, 100 - V.burnK);
});

// --- hire balance trajectories (spec-pinned) ---------------------------------

/** Harvest policy; optional hire gate. */
function playWithHire(seed, hireGate) {
  let state = createGame(seed);
  while (!state.gameOver) {
    if (state.focus === 0) {
      ({ state } = applyAction(state, endMonth()));
      continue;
    }
    let action = null;
    if (hireGate) action = hireGate(state);
    if (action) {
      ({ state } = applyAction(state, action));
      continue;
    }
    const p = { closeCost: V.dealCostTraction }; // no-hire default; perks recomputed per state below
    const closeCost = state.team.includes('VENTAS') ? ROLES.VENTAS.closeCost : V.dealCostTraction;
    const canClose = state.traction >= closeCost && (state.cashK < 80 || state.traction >= 35);
    let type;
    if (canClose) type = 'CLOSE_CLIENT';
    else if (state.teamMorale >= 40) type = state.focus === FOCUS_PER_MONTH ? 'BUILD_PRODUCT' : 'REST';
    else type = 'REST';
    ({ state } = applyAction(state, act(type)));
  }
  return state;
}

// Pinned trajectories from the sim sweep (retune => update deliberately):
// harvest-nohire 8/8 survive; hiring VENTAS or CTO once 3 months of runway
// exist survives 8/8 and ends richer; hiring CFO or CPO at bootstrap
// bankrupts every seed — the bad-hire lesson (their perks need funded
// velocity to pay off; that regime arrives with fundraising).
test('balance: harvest-nohire unchanged (8/8 survive)', () => {
  for (const seed of [11, 22, 33, 44, 55, 66, 77, 88]) {
    const s = playWithHire(seed, null);
    assert.equal(s.reason, 'survived', `seed ${seed} died: ${s.reason} m${s.month}`);
  }
});

test('balance: hire VENTAS or CTO when safe survives 8/8, richer than no-hire', () => {
  const SEEDS = [11, 22, 33, 44, 55, 66, 77, 88];
  const noHireFinals = SEEDS.map((seed) => playWithHire(seed, null).cashK);
  const noHireMean = noHireFinals.reduce((a, b) => a + b, 0) / noHireFinals.length;
  for (const role of ['VENTAS', 'CTO']) {
    let survivors = 0;
    let finalSum = 0;
    for (const seed of SEEDS) {
      const gate = (state) => {
        if (state.team.includes(role)) return null;
        const effBurn = V.burnK + state.team.reduce((s, r) => s + ROLES[r].salaryK, 0);
        return state.cashK - ROLES[role].signOnK >= effBurn * 3
          ? { type: ACTION_HIRE, role }
          : null;
      };
      const s = playWithHire(seed, gate);
      if (s.reason === 'survived') {
        survivors += 1;
        finalSum += s.cashK;
      }
    }
    assert.equal(survivors, 8, `${role}: only ${survivors}/8 survived`);
    const mean = finalSum / survivors;
    assert.ok(mean > noHireMean, `${role} mean ${mean} <= no-hire mean ${noHireMean}`);
  }
});

test('balance: CFO or CPO at bootstrap bankrupts every seed (bad-hire lesson)', () => {
  for (const role of ['CFO', 'CPO']) {
    for (const seed of [11, 22, 33, 44, 55, 66, 77, 88]) {
      const gate = (state) => {
        if (state.team.includes(role)) return null;
        const effBurn = V.burnK + state.team.reduce((s, r) => s + ROLES[r].salaryK, 0);
        return state.cashK - ROLES[role].signOnK >= effBurn * 3
          ? { type: ACTION_HIRE, role }
          : null;
      };
      const s = playWithHire(seed, gate);
      assert.equal(s.reason, 'bankrupt', `${role} seed ${seed} survived`);
      assert.ok(s.month < 24, `${role} seed ${seed} died too late (m${s.month})`);
    }
  }
});

const HIRE_EAGER = (state) => {
  const next = HIRE_ORDER.find((r) => !state.team.includes(r));
  if (!next) return null;
  return state.cashK >= ROLES[next].signOnK + 1
    ? { type: ACTION_HIRE, role: next }
    : null;
};

test('balance: hire-eager (grabbing CFO/CPO too) bankrupts every seed', () => {
  for (const seed of [11, 22, 33, 44, 55, 66, 77, 88]) {
    const s = playWithHire(seed, HIRE_EAGER);
    assert.equal(s.reason, 'bankrupt', `seed ${seed} did not die (reason ${s.reason})`);
    assert.ok(s.month < 24);
  }
});

test('HIRE rejected at focus 0 without state change', () => {
  let state = createGame(99);
  ({ state } = applyAction(state, act('BUILD_PRODUCT')));
  ({ state } = applyAction(state, act('BUILD_PRODUCT')));
  assert.equal(state.focus, 0);
  const before = serialize(state);
  assert.throws(() => applyAction(state, { type: ACTION_HIRE, role: 'VENTAS' }), /no focus/i);
  assert.equal(before, serialize(state));
});

// --- fundraising: energy, pitch, offers, cap table ----------------------------

const FUND_STATE = deepFreeze({
  ...createGame(7),
  month: 6,
  traction: 50,
  founderEnergy: 40,
});

test('energy starts fresh; fresh-state fundraising fields', () => {
  const s = createGame(42);
  assert.equal(s.founderEnergy, 100);
  assert.equal(s.offer, null);
  assert.equal(s.pitchCooldown, 0);
  assert.equal(s.founderPctBps, 10000);
  assert.deepEqual(s.investors, []);
});

test('REST restores energy on top of morale; clamp at max', () => {
  const s = deepFreeze({ ...createGame(7), founderEnergy: 60 });
  const { state } = applyAction(s, act('REST'));
  assert.equal(state.founderEnergy, 85);
  const full = deepFreeze({ ...createGame(7), founderEnergy: 90 });
  const r = applyAction(full, act('REST'));
  assert.equal(r.state.founderEnergy, 100);
});

test('bootstrap actions never touch energy', () => {
  const s = deepFreeze({ ...createGame(7), founderEnergy: 55 });
  for (const t of ['BUILD_PRODUCT', 'TALK_TO_CUSTOMERS', 'PUBLISH_CONTENT']) {
    const { state } = applyAction(s, act(t));
    assert.equal(state.founderEnergy, 55, t);
  }
  const close = deepFreeze({ ...s, traction: 30 });
  assert.equal(applyAction(close, act('CLOSE_CLIENT')).state.founderEnergy, 55);
  const hire = applyAction(deepFreeze({ ...s, cashK: 120 }), { type: ACTION_HIRE, role: 'VENTAS' });
  assert.equal(hire.state.founderEnergy, 55);
});

test('END_MONTH regenerates +10 and ticks cooldown', () => {
  const s = deepFreeze({ ...createGame(7), founderEnergy: 88, pitchCooldown: 2 });
  const { state } = applyAction(s, endMonth());
  assert.equal(state.founderEnergy, 98);
  assert.equal(state.pitchCooldown, 1);
});

test('END_MONTH never pushes energy past 100', () => {
  const s = deepFreeze({ ...createGame(7), founderEnergy: 95 });
  const { state } = applyAction(s, endMonth());
  assert.equal(state.founderEnergy, 100);
});

test('offer pricing tiers: drained x2/3, mid x1, fresh x11/10', () => {
  assert.equal(priceOffer(50, 40, 10000).preK, Math.trunc(350 * 2 / 3)); // 233
  assert.equal(priceOffer(50, 60, 10000).preK, 350);
  assert.equal(priceOffer(0, 85, 10000).preK, 165);
  assert.equal(priceOffer(0, 84, 10000).preK, 150);
});

test('offer bps math truncates deterministically', () => {
  const o = priceOffer(0, 100, 10000); // preK 165
  assert.equal(o.investorPctBps, Math.trunc(120 * 10000 / 285)); // 4210
  assert.equal(o.founderPctAfterBps, Math.trunc(10000 * (10000 - 4210) / 10000)); // 5790
});

test('PITCH spends focus and energy, prices from current state, no rng draw', () => {
  const { state, events } = applyAction(FUND_STATE, act('PITCH'));
  assert.equal(state.focus, FOCUS_PER_MONTH - 1);
  assert.equal(state.founderEnergy, 0); // 40 - 80 clamped
  assert.equal(state.rngState, FUND_STATE.rngState);
  assert.equal(state.offer.preK, 233); // (150 + 200) * 2/3 at energy 40
  assert.equal(state.offer.roundK, 120);
  assert.equal(state.offer.investorPctBps, 3399);
  assert.equal(state.offer.founderPctAfterBps, 6601);
  assert.ok(events.some((e) => e.key === EVENT_KEYS.OFFER_MADE && e.params.preK === 233));
});

test('PITCH at fresh energy gets the hot tier', () => {
  const s = deepFreeze({ ...FUND_STATE, founderEnergy: 100 });
  const { state } = applyAction(s, act('PITCH'));
  assert.equal(state.offer.preK, Math.trunc(350 * 11 / 10)); // 385
  assert.equal(state.founderEnergy, 20);
});

test('PITCH rejected: before month 6, on cooldown, drained, pending, focus 0', () => {
  assert.throws(() => applyAction(createGame(7), act('PITCH')), /early/i);
  assert.throws(() => applyAction(deepFreeze({ ...FUND_STATE, pitchCooldown: 1 }), act('PITCH')), /cooldown/i);
  assert.throws(() => applyAction(deepFreeze({ ...FUND_STATE, founderEnergy: 39 }), act('PITCH')), /drained/i);
  const offered = applyAction(FUND_STATE, act('PITCH')).state;
  assert.throws(() => applyAction(offered, act('PITCH')), /pending/i);
  let s = deepFreeze({ ...createGame(7), month: 6 });
  ({ state: s } = applyAction(s, act('BUILD_PRODUCT')));
  ({ state: s } = applyAction(s, act('BUILD_PRODUCT')));
  assert.throws(() => applyAction(s, act('PITCH')), /no focus/i);
});

test('ACCEPT_ROUND pays cash, dilutes from the offer, appends investor, cooldown', () => {
  const offered = applyAction(FUND_STATE, act('PITCH')).state;
  const { state, events } = applyAction(offered, act('ACCEPT_ROUND'));
  assert.equal(state.cashK, offered.cashK + 120);
  assert.equal(state.founderPctBps, offered.offer.founderPctAfterBps);
  assert.equal(state.investors.length, 1);
  assert.equal(state.investors[0].pctBps, offered.offer.investorPctBps);
  assert.equal(state.investors[0].investedK, 120);
  assert.equal(state.pitchCooldown, 2);
  assert.equal(state.offer, null);
  assert.ok(events.some((e) => e.key === EVENT_KEYS.ROUND_CLOSED));
  assert.ok(Object.isFrozen(state.investors));
});

test('ACCEPT/DECLINE cost no focus and work at focus 0', () => {
  const offered = applyAction(FUND_STATE, act('PITCH')).state;
  let drained = offered;
  ({ state: drained } = applyAction(drained, act('BUILD_PRODUCT')));
  assert.equal(drained.focus, 0);
  const { state } = applyAction(drained, act('ACCEPT_ROUND'));
  assert.equal(state.focus, 0);
  assert.equal(state.cashK, drained.cashK + 120);
});

test('decline keeps ownership and sets cooldown', () => {
  const offered = applyAction(FUND_STATE, act('PITCH')).state;
  const { state, events } = applyAction(offered, act('DECLINE_ROUND'));
  assert.equal(state.offer, null);
  assert.equal(state.pitchCooldown, 2);
  assert.equal(state.founderPctBps, 10000);
  assert.equal(state.cashK, offered.cashK);
  assert.ok(events.some((e) => e.key === EVENT_KEYS.OFFER_DECLINED));
});

test('repeated dilution compounds with truncation', () => {
  let state = deepFreeze({ ...FUND_STATE, traction: 0, founderEnergy: 100 });
  ({ state } = applyAction(state, act('PITCH'))); // preK 165, inv 4210
  ({ state } = applyAction(state, act('ACCEPT_ROUND')));
  assert.equal(state.founderPctBps, 5790);
  state = deepFreeze({ ...state, month: 9, pitchCooldown: 0, founderEnergy: 100, traction: 0 });
  ({ state } = applyAction(state, act('PITCH')));
  ({ state } = applyAction(state, act('ACCEPT_ROUND')));
  assert.equal(state.founderPctBps, Math.trunc(5790 * (10000 - 4210) / 10000));
  assert.equal(state.investors.length, 2);
  assert.equal(state.investors[0].pctBps, 4210); // first row keeps original bps
});

test('pending offer expires at month end, no cash change, no cooldown', () => {
  const offered = applyAction(FUND_STATE, act('PITCH')).state;
  const { state, events } = applyAction(offered, endMonth());
  assert.equal(state.offer, null);
  assert.equal(state.pitchCooldown, 0);
  assert.ok(events.some((e) => e.key === EVENT_KEYS.OFFER_EXPIRED && e.params.roundK === 120));
  const noOffer = deepFreeze({ ...offered, offer: null });
  const paid = applyAction(noOffer, endMonth()).state.cashK;
  assert.equal(state.cashK, paid); // expiry adds no cash
});

test('no pending offer: accept/decline rejected', () => {
  const s = createGame(7);
  assert.throws(() => applyAction(s, act('ACCEPT_ROUND')), /no pending/i);
  assert.throws(() => applyAction(s, act('DECLINE_ROUND')), /no pending/i);
});

// --- fundraising balance trajectories (spec-pinned, sim-graded) ---------------

/**
 * Fundraising policies: 'asap' pitches at the drained gate (40), 'fresh'
 * only at >=85 and RESTs to refill. Accepts every offer.
 * Pinned finals (retune => update deliberately): asap $540 avg / founder
 * ~1%, fresh $1020 avg. Fundraising converts a ~$40 bootstrap into ~$500-1k
 * cash but the cap table only pays off at exit; energy decides the price.
 */
function playFundraising(seed, mode) {
  let state = createGame(seed);
  let guard = 0;
  while (!state.gameOver && guard < 600) {
    guard += 1;
    if (state.offer) {
      ({ state } = applyAction(state, act('ACCEPT_ROUND')));
      continue;
    }
    if (state.focus === 0) {
      ({ state } = applyAction(state, endMonth()));
      continue;
    }
    let type = null;
    const pitchOk = state.month >= 6 && state.pitchCooldown === 0 && !state.offer;
    if (pitchOk && ((mode === 'asap' && state.founderEnergy >= 40) || (mode === 'fresh' && state.founderEnergy >= 85))) type = 'PITCH';
    if (!type) {
      if (mode === 'fresh' && state.founderEnergy < 100) type = 'REST';
      else if (state.traction >= perksFor(state.team).closeCost) type = 'CLOSE_CLIENT';
      else type = 'BUILD_PRODUCT';
    }
    try {
      ({ state } = applyAction(state, act(type)));
    } catch {
      ({ state } = applyAction(state, act('BUILD_PRODUCT')));
    }
  }
  return state;
}

test('balance: fundraising survives 8/8 and dilutes the founder', () => {
  for (const seed of [11, 22, 33, 44, 55, 66, 77, 88]) {
    const s = playFundraising(seed, 'asap');
    assert.equal(s.reason, 'survived', `seed ${seed}`);
    assert.ok(s.founderPctBps < 10000, `seed ${seed} never diluted`);
    assert.ok(s.investors.length >= 5);
  }
});

test('balance: energy decides price — drained pitches earn strictly less', () => {
  let asapCash = 0;
  let freshCash = 0;
  for (const seed of [11, 22, 33, 44, 55, 66, 77, 88]) {
    asapCash += playFundraising(seed, 'asap').cashK;
    freshCash += playFundraising(seed, 'fresh').cashK;
  }
  assert.ok(freshCash > asapCash + 3000, `fresh ${freshCash} vs asap ${asapCash}`);
});

test('balance: same traction prices cheaper when drained', () => {
  const drained = priceOffer(50, 40, 10000);
  const fresh = priceOffer(50, 100, 10000);
  assert.ok(drained.preK < fresh.preK);
  assert.ok(drained.investorPctBps > fresh.investorPctBps);
});

test('balance: fundraising beats bootstrap on cash (punchline setup)', () => {
  for (const seed of [11, 33, 55, 77]) {
    const fund = playFundraising(seed, 'fresh');
    assert.ok(fund.cashK >= 500, `seed ${seed}: $${fund.cashK}`);
  }
});

// --- fundraising II: counter-offers --------------------------------------------

const mkOffer = (over = {}) => deepFreeze({
  ...createGame(99),
  month: 6,
  founderEnergy: 40,
  pitchCooldown: 0,
  offer: Object.freeze({ preK: 173, roundK: 120, investorPctBps: 4095, founderPctAfterBps: 5905, countered: false }),
  ...over,
});
const RNG_SUCCESS = 1; // rngNext(1).value % 4 >= 1
const RNG_WALK = 4; // rngNext(4).value % 4 === 0

test('counter success reprices to 4/5 bps and flags the offer', () => {
  const s = mkOffer({ rngState: RNG_SUCCESS });
  const { state, events } = applyAction(s, act('COUNTER_ROUND'));
  assert.equal(state.founderEnergy, 20);
  assert.equal(state.offer.investorPctBps, Math.trunc(4095 * 4 / 5)); // 3276
  assert.equal(state.offer.preK, 173);
  assert.equal(state.offer.roundK, 120);
  assert.equal(state.offer.founderPctAfterBps, 6724);
  assert.equal(state.offer.countered, true);
  assert.equal(state.cashK, s.cashK); // no cash moves at counter time
  assert.ok(events.some((e) => e.key === EVENT_KEYS.OFFER_COUNTERED && e.params.investorPctBps === 3276));
});

test('counter walk clears offer, sets cooldown, burns energy', () => {
  const s = mkOffer({ rngState: RNG_WALK });
  const { state, events } = applyAction(s, act('COUNTER_ROUND'));
  assert.equal(state.offer, null);
  assert.equal(state.pitchCooldown, 2);
  assert.equal(state.founderEnergy, 20);
  assert.equal(state.cashK, s.cashK);
  assert.equal(state.founderPctBps, 10000);
  assert.ok(events.some((e) => e.key === EVENT_KEYS.OFFER_WALKED));
});

test('counter spends exactly one rng draw', () => {
  const s = mkOffer({ rngState: RNG_SUCCESS });
  const { state } = applyAction(s, act('COUNTER_ROUND'));
  assert.equal(state.rngState, rngNext(RNG_SUCCESS).next);
});

test('counter rejected: no offer, already countered, drained', () => {
  const none = deepFreeze({ ...createGame(99), rngState: RNG_SUCCESS });
  assert.throws(() => applyAction(none, act('COUNTER_ROUND')), /no pending/i);
  const done = mkOffer({ rngState: RNG_SUCCESS, offer: Object.freeze({ preK: 173, roundK: 120, investorPctBps: 3276, founderPctAfterBps: 6724, countered: true }) });
  assert.throws(() => applyAction(done, act('COUNTER_ROUND')), /already countered/i);
  const drained = mkOffer({ rngState: RNG_SUCCESS, founderEnergy: 19 });
  const before = serialize(drained);
  assert.throws(() => applyAction(drained, act('COUNTER_ROUND')), /drained/i);
  assert.equal(before, serialize(drained));
});

test('counter is deterministic for the same seed', () => {
  const s = mkOffer({ rngState: RNG_SUCCESS });
  assert.equal(serialize(applyAction(s, act('COUNTER_ROUND')).state), serialize(applyAction(s, act('COUNTER_ROUND')).state));
  const w = mkOffer({ rngState: RNG_WALK });
  assert.equal(serialize(applyAction(w, act('COUNTER_ROUND')).state), serialize(applyAction(w, act('COUNTER_ROUND')).state));
});

test('countered offer accepts on improved terms', () => {
  const s = mkOffer({ rngState: RNG_SUCCESS });
  const countered = applyAction(s, act('COUNTER_ROUND')).state;
  const { state } = applyAction(countered, act('ACCEPT_ROUND'));
  assert.equal(state.founderPctBps, 6724);
  assert.equal(state.investors[0].pctBps, 3276);
  assert.equal(state.cashK, s.cashK + 120);
});

test('fresh pitch leaves exactly one counter of energy', () => {
  let s = deepFreeze({ ...createGame(1), month: 6 });
  ({ state: s } = applyAction(s, act('PITCH')));
  assert.equal(s.founderEnergy, 20); // 100 - 80: enough for exactly one COUNTER
  const { state } = applyAction(s, act('COUNTER_ROUND'));
  assert.notEqual(state.rngState, s.rngState); // either way, the draw happened
});

// --- fundraising II balance pins (spec-pinned, sim-graded) ---------------------

function playCounter(seed, counter) {
  let state = createGame(seed);
  let guard = 0;
  while (!state.gameOver && guard < 600) {
    guard += 1;
    if (state.offer) {
      const type = counter && !state.offer.countered && state.founderEnergy >= 20 ? 'COUNTER_ROUND' : 'ACCEPT_ROUND';
      ({ state } = applyAction(state, act(type)));
      continue;
    }
    if (state.focus === 0) {
      ({ state } = applyAction(state, endMonth()));
      continue;
    }
    let type = null;
    const pitchOk = state.month >= 6 && state.pitchCooldown === 0 && !state.offer;
    if (pitchOk && state.founderEnergy >= 85) type = 'PITCH';
    if (!type) {
      if (state.founderEnergy < 100) type = 'REST';
      else if (state.traction >= perksFor(state.team).closeCost) type = 'CLOSE_CLIENT';
      else type = 'BUILD_PRODUCT';
    }
    try {
      ({ state } = applyAction(state, act(type)));
    } catch {
      ({ state } = applyAction(state, act('BUILD_PRODUCT')));
    }
  }
  return state;
}

test('balance: negotiating trades cash for ownership on every seed', () => {
  for (const seed of [11, 22, 33, 44, 55, 66, 77, 88]) {
    const plain = playCounter(seed, false);
    const negotiated = playCounter(seed, true);
    assert.ok(plain.cashK >= negotiated.cashK, `seed ${seed}: cash did not drop`);
    assert.ok(negotiated.founderPctBps > plain.founderPctBps, `seed ${seed}: ownership did not rise`);
  }
});

// --- exit settlement -----------------------------------------------------------

test('exit control vector: full ownership takes payout plus company cash', () => {
  const s = deepFreeze({ ...createGame(9), traction: 20, cashK: 300, founderPctBps: 10000 });
  const e = exitOf(s);
  assert.equal(e.valuationK, 350);
  assert.equal(e.payoutK, 350);
  assert.equal(e.cashOutK, 300);
  assert.equal(e.personalK, 650);
});

test('exit non-control: diluted founder keeps no company cash', () => {
  const s = deepFreeze({ ...createGame(9), traction: 20, cashK: 1000, founderPctBps: 4900 });
  const e = exitOf(s);
  assert.equal(e.payoutK, Math.trunc(4900 * 350 / 10000)); // 171
  assert.equal(e.cashOutK, 0);
  assert.equal(e.personalK, 171);
});

test('exit boundary: exactly 5000 bps counts as control', () => {
  const s = deepFreeze({ ...createGame(9), traction: 0, cashK: 77, founderPctBps: 5000 });
  assert.equal(exitOf(s).cashOutK, 77);
});

test('survived run-ended event carries settlement; bankrupt carries none', () => {
  const rich = deepFreeze({ ...createGame(777), traction: 15, cashK: 5000 });
  const { events } = run(rich, Array(TOTAL_MONTHS).fill(ACTION_END_MONTH));
  const ended = events.find((e) => e.key === EVENT_KEYS.RUN_ENDED);
  assert.equal(ended.params.reason, 'survived');
  assert.equal(ended.params.valuationK, 150 + 10 * rich.traction); // traction untouched by END_MONTH
  assert.equal(ended.params.payoutK, ended.params.valuationK); // 100% owner at start
  assert.ok(ended.params.cashOutK > 0); // controller
  assert.equal(ended.params.personalK, ended.params.payoutK + ended.params.cashOutK);
  const poor = { ...createGame(777), cashK: 5 };
  const broke = run(poor, Array(12).fill(ACTION_END_MONTH));
  const brokeEnd = broke.events.find((e) => e.key === EVENT_KEYS.RUN_ENDED);
  assert.equal(brokeEnd.params.reason, 'bankrupt');
  assert.equal(brokeEnd.params.valuationK, undefined);
});

test('settlement is deterministic across replays', () => {
  const playRun = () => run(createGame(4242), Array(TOTAL_MONTHS).fill(ACTION_END_MONTH));
  const a = playRun().events.find((e) => e.key === EVENT_KEYS.RUN_ENDED);
  const b = playRun().events.find((e) => e.key === EVENT_KEYS.RUN_ENDED);
  assert.equal(serialize(a), serialize(b));
});

// --- exit balance trajectories (spec-pinned, sim-graded) ----------------------

/** Harvest base policy used by all three exit strategies. */
function exitHarvest(state) {
  const closeCost = state.team.includes('VENTAS') ? ROLES.VENTAS.closeCost : V.dealCostTraction;
  if (state.traction >= closeCost && (state.cashK < 80 || state.traction >= 35)) return 'CLOSE_CLIENT';
  if (state.teamMorale >= 40) return state.focus === FOCUS_PER_MONTH ? 'BUILD_PRODUCT' : 'REST';
  return 'REST';
}

function playExit(seed, { pitch, hireRunway, hireRoles = HIRE_ORDER }) {
  let state = createGame(seed);
  let guard = 0;
  while (!state.gameOver && guard < 600) {
    guard += 1;
    if (state.offer) {
      ({ state } = applyAction(state, act('ACCEPT_ROUND')));
      continue;
    }
    if (state.focus === 0) {
      ({ state } = applyAction(state, endMonth()));
      continue;
    }
    let action = null;
    const pitchOk = state.month >= 6 && state.pitchCooldown === 0 && !state.offer;
    if (pitchOk && pitch(state)) action = act('PITCH');
    if (!action && hireRunway) {
      const next = hireRoles.find((r) => !state.team.includes(r));
      if (next && state.cashK - ROLES[next].signOnK >= burnFor(state.team, V) * hireRunway) {
        action = { type: ACTION_HIRE, role: next };
      }
    }
    if (!action) action = act(exitHarvest(state));
    try {
      ({ state } = applyAction(state, action));
    } catch {
      ({ state } = applyAction(state, act('REST')));
    }
  }
  return exitOf(state);
}

// Pinned from the exit sim over [11,22,33,44,55,66,77,88] (retune => update):
// bootstrap personal 160-640; naive ASAP 3-7 on every seed (the raise-everything
// disaster is strict, not average); hybrid 184-889 beating bootstrap on 6/8.
const EXIT_SEEDS = [11, 22, 33, 44, 55, 66, 77, 88];
const neverRaise = () => false;
const raiseEverything = (s) => s.founderEnergy >= 40;
const raiseThenBuild = (s) => s.founderEnergy >= 85 && s.cashK < 120 && s.month < 12;

test('exit balance: bootstraps end with real personal wealth', () => {
  for (const seed of EXIT_SEEDS) {
    assert.ok(playExit(seed, { pitch: neverRaise }).personalK >= 150, `seed ${seed}`);
  }
});

test('exit balance: raising everything is ruin on every seed', () => {
  for (const seed of EXIT_SEEDS) {
    const e = playExit(seed, { pitch: raiseEverything });
    assert.ok(e.personalK <= 10, `seed ${seed}: personal ${e.personalK}`);
  }
});

test('exit balance: hybrid raises early then builds beats bootstrap on average', () => {
  let wins = 0;
  let sumHybrid = 0;
  let sumBoot = 0;
  for (const seed of EXIT_SEEDS) {
    const hybrid = playExit(seed, { pitch: raiseThenBuild, hireRunway: 4, hireRoles: ['VENTAS', 'CTO'] }).personalK;
    const boot = playExit(seed, { pitch: neverRaise }).personalK;
    sumHybrid += hybrid;
    sumBoot += boot;
    if (hybrid > boot) wins += 1;
  }
  assert.ok(wins >= 5, `hybrid won only ${wins}/8`);
  assert.ok(sumHybrid > sumBoot, `sums hybrid ${sumHybrid} boot ${sumBoot}`);
});

test('offer event names its pricing tier', () => {
  const base = deepFreeze({ ...createGame(9), month: 6, traction: 50 });
  const drained = applyAction(deepFreeze({ ...base, founderEnergy: 40 }), act('PITCH'));
  const hot = applyAction(deepFreeze({ ...base, founderEnergy: 100 }), act('PITCH'));
  assert.equal(drained.events[0].params.tier, 'drained');
  assert.equal(hot.events[0].params.tier, 'hot');
  assert.equal(applyAction(deepFreeze({ ...base, founderEnergy: 70 }), act('PITCH')).events[0].params.tier, 'fair');
  assert.equal(offerTier(59), 'drained');
  assert.equal(offerTier(60), 'fair');
  assert.equal(offerTier(85), 'hot');
});

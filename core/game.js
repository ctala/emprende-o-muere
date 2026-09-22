// Core game rules: (state, action) -> { state, events }. Pure: no mutation,
// no globals, no clock, no I/O, no floats.

import { deepFreeze } from './freeze.js';
import { rngNext } from './rng.js';

// ---------------------------------------------------------------------------
// Tuning block — single source of gameplay numbers. Change freely; logic
// below must not contain magic numbers.
// ---------------------------------------------------------------------------
export const FOCUS_PER_MONTH = 2;

export const ACTION_DEFS = Object.freeze({
  BUILD_PRODUCT: Object.freeze({ tractionBase: 8, moraleCost: 8 }),
  TALK_TO_CUSTOMERS: Object.freeze({ tractionBase: 6, moraleCost: 5 }),
  PUBLISH_CONTENT: Object.freeze({ tractionBase: 4, moraleCost: 3 }),
  REST: Object.freeze({ tractionBase: 0, moraleCost: 0, moraleGain: 15 }),
  CLOSE_CLIENT: Object.freeze({ tractionCost: 10, moraleCost: 0, deal: true }),
});

// Vertical profiles: all cash numbers in integer thousands of USD ($k).
// New verticals are new rows here; rules below read them generically.
export const VERTICALS = Object.freeze({
  b2b_saas: Object.freeze({
    startCashK: 120,
    burnK: 15,
    delayMonths: 3,
    dealMinK: 20, // base price of a signed deal
    dealTenK: 10, // + per full 10 traction
    dealCostTraction: 10, // traction burned to sign
  }),
});
export const ACTIVE_VERTICAL = 'b2b_saas';

// Hireable roles: sign-on + salary feed cash; one perk each overrides action
// defaults. Rules read them through perksFor()/burnFor(), never by name.
// `pipeline` = interested-customers added every month; `autoClose` = the team
// closes one deal on its own each month (table-granted, no rules branch).
export const ROLES = Object.freeze({
  VENTAS: Object.freeze({ signOnK: 3, salaryK: 2, closeCost: 6, pipeline: 6, autoClose: true, hireOrder: 0 }),
  CTO: Object.freeze({ signOnK: 5, salaryK: 4, buildBase: 12, buildMoraleCost: 6, pipeline: 2, hireOrder: 1 }),
  CFO: Object.freeze({ signOnK: 12, salaryK: 8, delayMonths: 2, hireOrder: 2 }),
  CPO: Object.freeze({ signOnK: 8, salaryK: 6, talkBase: 9, talkMoraleCost: 3, hireOrder: 3 }),
});
export const HIRE_ORDER = Object.freeze(
  Object.keys(ROLES).sort((a, b) => ROLES[a].hireOrder - ROLES[b].hireOrder),
);

export const LABOR_JITTER = 3; // uniform integer in [-3, +3]
export const TIER_HIGH_MIN = 67;
export const TIER_MEDIUM_MIN = 34;
export const MORALE_MIN = 0;
export const MORALE_MAX = 100;
export const END_MONTH_DECAY = 5;
export const END_MONTH_DECAY_JITTER = 2; // uniform integer in [-2, +2]
export const MVP_REQUIRED_BUILDS = 2; // builds needed before any client signs

// Founder energy + fundraising. Energy only drains on PITCH, so bootstrap
// stays byte-identical; the drained floor (gate) equals start - drain - regen
// math, making the cheap-pitch tier reachable but punishing.
export const ENERGY_MAX = 100;
export const ENERGY_START = 100;
export const ENERGY_MONTH_REGEN = 10;
export const REST_ENERGY_GAIN = 25;
export const PITCH_ENERGY_COST = 80;
export const PITCH_ENERGY_GATE = 40; // lowest energy you can pitch at
export const PITCH_MIN_MONTH = 6;
export const PITCH_COOLDOWN = 2; // months, set when an offer is decided
export const FUND_PRE_BASE = 150; // $k pre-money at traction 0
export const FUND_PRE_PER_TRACTION = 4; // $k per point of traction
export const FUND_ROUND_K = 120; // $k raised per round
export const PITCH_TIER_LOW_BELOW = 60; // pre * 2/3
export const PITCH_TIER_HIGH_MIN = 85; // pre * 11/10
export const SEED_INVESTOR_NAME = 'seed_fund';
// Counter-offer: 20 energy to push dilution to 4/5; 1/4 of counters make the
// investor walk. A fresh pitch leaves exactly 100-80 = 20, so one fresh pitch
// buys exactly one negotiation and a drained pitch buys none.
export const COUNTER_ENERGY_COST = 20;
export const COUNTER_BPS_NUM = 4;
export const COUNTER_BPS_DEN = 5;
export const COUNTER_WALK_NUM = 1;
export const COUNTER_WALK_DEN = 4;
// Exit settlement (terminal-time derivation, sim-pinned): an acquirer pays
// 150 + 10 per traction — traction, not cash, is the compounding asset. A
// founder still holding >= half also takes the company cash.
export const EXIT_BASE_K = 150;
export const EXIT_SLOPE_K = 10;
export const EXIT_CONTROL_BPS = 5000;
// ---------------------------------------------------------------------------

export const ACTION_TYPES = Object.freeze(Object.keys(ACTION_DEFS));
export const ACTION_END_MONTH = 'END_MONTH';
export const ACTION_HIRE = 'HIRE';
export const ACTION_PITCH = 'PITCH';
export const ACTION_ACCEPT_ROUND = 'ACCEPT_ROUND';
export const ACTION_DECLINE_ROUND = 'DECLINE_ROUND';
export const ACTION_COUNTER_ROUND = 'COUNTER_ROUND';

/** Stable event keys emitted by the core. Every key must resolve in content/strings_es.js. */
export const EVENT_KEYS = Object.freeze({
  MONTH_ADVANCED: 'evt.month_advanced',
  RUN_ENDED: 'evt.run_ended',
  ACTION_TAKEN: 'evt.action_taken',
  INVOICE_CREATED: 'evt.invoice_created',
  INVOICE_PAID: 'evt.invoice_paid',
  SALARIES_PAID: 'evt.salaries_paid',
  PIPELINE_PRODUCED: 'evt.pipeline_produced',
  CLIENT_CLOSED_BY_TEAM: 'evt.client_closed_by_team',
  OFFER_MADE: 'evt.offer_made',
  ROUND_CLOSED: 'evt.round_closed',
  OFFER_DECLINED: 'evt.offer_declined',
  OFFER_EXPIRED: 'evt.offer_expired',
  OFFER_COUNTERED: 'evt.offer_countered',
  OFFER_WALKED: 'evt.offer_walked',
});

/**
 * Deal price in $k for the active vertical at a given traction.
 * @param {number} traction
 * @param {Readonly<object>} vertical
 * @returns {number}
 */
export function dealPriceK(traction, vertical = VERTICALS[ACTIVE_VERTICAL]) {
  return vertical.dealMinK + vertical.dealTenK * Math.trunc(traction / 10);
}

/**
 * Team-modified action parameters: defaults from ACTION_DEFS/VERTICALS, then
 * every hired role's overrides applied in team order. Rules read action
 * numbers here only — never by checking role names.
 * @param {ReadonlyArray<string>} team
 * @param {Readonly<object>} vertical
 * @returns {Readonly<object>}
 */
export function perksFor(team, vertical = VERTICALS[ACTIVE_VERTICAL]) {
  const perks = {
    buildBase: ACTION_DEFS.BUILD_PRODUCT.tractionBase,
    buildMoraleCost: ACTION_DEFS.BUILD_PRODUCT.moraleCost,
    talkBase: ACTION_DEFS.TALK_TO_CUSTOMERS.tractionBase,
    talkMoraleCost: ACTION_DEFS.TALK_TO_CUSTOMERS.moraleCost,
    closeCost: ACTION_DEFS.CLOSE_CLIENT.tractionCost,
    delayMonths: vertical.delayMonths,
    pipelinePerMonth: 0,
    autoClose: false,
  };
  for (const role of team) {
    const def = ROLES[role];
    if (!def) continue;
    if (def.buildBase !== undefined) perks.buildBase = def.buildBase;
    if (def.buildMoraleCost !== undefined) perks.buildMoraleCost = def.buildMoraleCost;
    if (def.talkBase !== undefined) perks.talkBase = def.talkBase;
    if (def.talkMoraleCost !== undefined) perks.talkMoraleCost = def.talkMoraleCost;
    if (def.closeCost !== undefined) perks.closeCost = def.closeCost;
    if (def.delayMonths !== undefined) perks.delayMonths = def.delayMonths;
    if (def.pipeline !== undefined) perks.pipelinePerMonth += def.pipeline;
    if (def.autoClose === true) perks.autoClose = true;
  }
  return perks;
}

/** Monthly burn ($k) = profile burn + team salaries. */
export function burnFor(team, vertical = VERTICALS[ACTIVE_VERTICAL]) {
  return vertical.burnK + team.reduce((sum, role) => sum + (ROLES[role]?.salaryK ?? 0), 0);
}

/** The product exists once enough BUILD_PRODUCT actions have landed. */
export function hasMvp(state) {
  return state.mvpBuilds >= MVP_REQUIRED_BUILDS;
}

/** Active signed client contracts (unpaid invoices), integer. */
export function activeClients(state) {
  return state.invoices.length;
}

/** Effective burn as named parts: [base, then one part per team role]. */
export function burnParts(state) {
  const vertical = VERTICALS[state.vertical];
  const parts = [Object.freeze({ role: null, label: 'base', amountK: vertical.burnK })];
  for (const role of state.team) {
    const salaryK = ROLES[role]?.salaryK ?? 0;
    if (salaryK > 0) parts.push(Object.freeze({ role, label: role, amountK: salaryK }));
  }
  return Object.freeze(parts);
}

/**
 * Deterministic cash projection for the "founder does nothing" scenario:
 * replays only the cash-relevant month-end steps (production -> auto-close
 * -> collections -> burn) on plain integer copies. Cash evolution is
 * morale-independent in the engine, so this equals repeated END_MONTH (cash
 * only) byte-for-byte. Pure: no PRNG draw, no mutation, no new state fields.
 * @param {Readonly<object>} state
 * @param {number} [horizon] months ahead to project (default: the remaining run)
 * @returns {Readonly<{ months: ReadonlyArray<{ month: number, inK: number, outK: number, cashK: number }>, bankruptMonth: number|null }>}
 */
export function forecastOf(state, horizon) {
  const vertical = VERTICALS[state.vertical];
  const perks = perksFor(state.team, vertical);
  const burnK = burnFor(state.team, vertical);
  // Real idle play applies one more cash flow per month AND one final flow at
  // month totalMonths (the terminal END_MONTH), so the step count covers both.
  const steps = Math.min(horizon ?? state.totalMonths - state.month + 1, state.totalMonths - state.month + 1);

  let traction = state.traction;
  let cashK = state.cashK;
  let invoices = state.invoices.map((i) => ({ amountK: i.amountK, dueMonth: i.dueMonth }));
  const months = [];
  let bankruptMonth = null;

  for (let k = 1; k <= steps && !state.gameOver; k += 1) {
    const nextMonth = Math.min(state.month + k, state.totalMonths);
    const postProduction = traction + perks.pipelinePerMonth;
    const closer = perks.autoClose && hasMvp(state)
      && postProduction >= perks.closeCost ? autoCloseRole(state.team) : null;
    traction = postProduction;
    let closedAmountK = 0;
    if (closer !== null) {
      traction = postProduction - perks.closeCost;
      closedAmountK = dealPriceK(postProduction, vertical);
      invoices = [...invoices, { amountK: closedAmountK, dueMonth: nextMonth + perks.delayMonths }];
    }
    const paid = invoices.filter((i) => i.dueMonth <= nextMonth);
    invoices = invoices.filter((i) => i.dueMonth > nextMonth);
    const inK = paid.reduce((sum, i) => sum + i.amountK, 0);
    cashK = cashK + inK - burnK;
    const row = months.at(-1);
    if (row !== undefined && row.month === nextMonth) {
      months[months.length - 1] = Object.freeze({
        month: nextMonth, inK: row.inK + inK, outK: row.outK + burnK, cashK,
      });
    } else {
      months.push(Object.freeze({ month: nextMonth, inK, outK: burnK, cashK }));
    }
    if (cashK < 0) {
      bankruptMonth = nextMonth;
      break;
    }
  }
  return deepFreeze({ months: Object.freeze(months), bankruptMonth });
}

/** First team role whose table grants self-closing (table-driven, no name branch). */
export function autoCloseRole(team) {
  return team.find((role) => ROLES[role]?.autoClose === true) ?? null;
}

/**
 * Exit settlement derived at terminal time from a final state: valuation
 * tracks traction (what investor money was supposed to build), the founder
 * is paid by ownership share, and retaining control also cashes out the
 * company balance. Integer-only, no PRNG, no state fields.
 * @param {Readonly<object>} state
 * @returns {Readonly<{ valuationK: number, payoutK: number, cashOutK: number, personalK: number }>}
 */
export function exitOf(state) {
  const valuationK = EXIT_BASE_K + EXIT_SLOPE_K * state.traction;
  const payoutK = Math.trunc(state.founderPctBps * valuationK / 10000);
  const cashOutK = state.founderPctBps >= EXIT_CONTROL_BPS ? state.cashK : 0;
  const personalK = payoutK + cashOutK;
  return Object.freeze({ valuationK, payoutK, cashOutK, personalK });
}

/**
 * Morale effectiveness tier: 2 = high (full yield), 1 = medium (half,
 * truncated), 0 = low (labor yields nothing).
 * @param {number} morale
 * @returns {0 | 1 | 2}
 */
export function moraleTier(morale) {
  if (morale >= TIER_HIGH_MIN) return 2;
  if (morale >= TIER_MEDIUM_MIN) return 1;
  return 0;
}

function clampMorale(value) {
  return Math.min(MORALE_MAX, Math.max(MORALE_MIN, value));
}

function clampEnergy(value) {
  return Math.min(ENERGY_MAX, Math.max(0, value));
}

/**
 * Pricing tier of a pitch at the given energy (informational label for
 * events; the pricing itself lives in priceOffer's branch on the same tiers).
 * @param {number} energy
 * @returns {'drained' | 'fair' | 'hot'}
 */
export function offerTier(energy) {
  if (energy < PITCH_TIER_LOW_BELOW) return 'drained';
  if (energy >= PITCH_TIER_HIGH_MIN) return 'hot';
  return 'fair';
}

/**
 * Term-sheet offer priced at pitch time from traction and the founder's
 * energy tier. Integer-only: fractions are numerator/denominator truncation,
 * same precedent as the morale half-tier. No PRNG draw.
 * @param {number} traction
 * @param {number} energy energy at pitch time (before the drain)
 * @param {number} founderPctBps current founder ownership
 * @returns {Readonly<object>}
 */
export function priceOffer(traction, energy, founderPctBps) {
  const tier = offerTier(energy);
  let preK;
  if (tier === 'drained') {
    preK = Math.trunc((FUND_PRE_BASE + FUND_PRE_PER_TRACTION * traction) * 2 / 3);
  } else if (tier === 'hot') {
    preK = Math.trunc((FUND_PRE_BASE + FUND_PRE_PER_TRACTION * traction) * 11 / 10);
  } else {
    preK = FUND_PRE_BASE + FUND_PRE_PER_TRACTION * traction;
  }
  const roundK = FUND_ROUND_K;
  const investorPctBps = Math.trunc(roundK * 10000 / (preK + roundK));
  const founderPctAfterBps = Math.trunc(founderPctBps * (10000 - investorPctBps) / 10000);
  return Object.freeze({ preK, roundK, investorPctBps, founderPctAfterBps, countered: false });
}

/** Uniform integer in [-range, +range] drawn from rngState. */
function jitter(rngState, range) {
  const step = rngNext(rngState);
  const span = 2 * range + 1;
  // 32-bit unsigned modulo is exact for our small span; integer-only.
  const offset = (step.value % span) - range;
  return { offset, next: step.next };
}

/**
 * @param {Readonly<object>} state
 * @param {Readonly<{ type: string }>} action
 * @returns {{ state: Readonly<object>, events: ReadonlyArray<{ key: string, params: object }> }}
 */
export function applyAction(state, action) {
  if (action === null || typeof action !== 'object' || typeof action.type !== 'string') {
    throw new Error(`Invalid action: ${JSON.stringify(action)}`);
  }
  if (state.gameOver) {
    throw new Error('Game is over; action rejected');
  }

  if (action.type === ACTION_END_MONTH) {
    return endMonth(state);
  }
  if (action.type === ACTION_HIRE) {
    return hire(state, action.role);
  }
  if (action.type === ACTION_PITCH) {
    return pitch(state);
  }
  if (action.type === ACTION_ACCEPT_ROUND) {
    return acceptRound(state);
  }
  if (action.type === ACTION_DECLINE_ROUND) {
    return declineRound(state);
  }
  if (action.type === ACTION_COUNTER_ROUND) {
    return counterRound(state);
  }
  if (!Object.hasOwn(ACTION_DEFS, action.type)) {
    throw new Error(`Unknown action type: ${action.type}`);
  }
  return takeAction(state, action.type);
}

function pitch(state) {
  if (state.focus <= 0) {
    throw new Error('No focus left; PITCH rejected');
  }
  if (state.month < PITCH_MIN_MONTH) {
    throw new Error(`Too early to pitch; PITCH rejected before month ${PITCH_MIN_MONTH}`);
  }
  if (state.pitchCooldown > 0) {
    throw new Error('Investors are busy; PITCH rejected on cooldown');
  }
  if (state.offer !== null) {
    throw new Error('An offer is already pending; PITCH rejected');
  }
  if (state.founderEnergy < PITCH_ENERGY_GATE) {
    throw new Error('Founder too drained to pitch; PITCH rejected');
  }
  const offer = priceOffer(state.traction, state.founderEnergy, state.founderPctBps);
  const nextState = deepFreeze({
    ...state,
    focus: state.focus - 1,
    founderEnergy: clampEnergy(state.founderEnergy - PITCH_ENERGY_COST),
    offer,
  });
  return deepFreeze({
    state: nextState,
    events: [{ key: EVENT_KEYS.OFFER_MADE, params: { preK: offer.preK, roundK: offer.roundK, investorPctBps: offer.investorPctBps, tier: offerTier(state.founderEnergy) } }],
  });
}

function acceptRound(state) {
  if (state.offer === null) {
    throw new Error('No pending offer; ACCEPT_ROUND rejected');
  }
  const offer = state.offer;
  const nextState = deepFreeze({
    ...state,
    offer: null,
    pitchCooldown: PITCH_COOLDOWN,
    cashK: state.cashK + offer.roundK,
    founderPctBps: offer.founderPctAfterBps,
    investors: Object.freeze([
      ...state.investors,
      Object.freeze({ name: SEED_INVESTOR_NAME, pctBps: offer.investorPctBps, investedK: offer.roundK }),
    ]),
  });
  return deepFreeze({
    state: nextState,
    events: [{
      key: EVENT_KEYS.ROUND_CLOSED,
      params: { roundK: offer.roundK, investorPctBps: offer.investorPctBps, founderPctBps: nextState.founderPctBps },
    }],
  });
}

function declineRound(state) {
  if (state.offer === null) {
    throw new Error('No pending offer; DECLINE_ROUND rejected');
  }
  const nextState = deepFreeze({ ...state, offer: null, pitchCooldown: PITCH_COOLDOWN });
  return deepFreeze({ state: nextState, events: [{ key: EVENT_KEYS.OFFER_DECLINED, params: {} }] });
}

function counterRound(state) {
  if (state.offer === null) {
    throw new Error('No pending offer; COUNTER_ROUND rejected');
  }
  if (state.offer.countered) {
    throw new Error('Offer already countered; COUNTER_ROUND rejected');
  }
  if (state.founderEnergy < COUNTER_ENERGY_COST) {
    throw new Error('Founder too drained to negotiate; COUNTER_ROUND rejected');
  }
  const step = rngNext(state.rngState);
  const energy = clampEnergy(state.founderEnergy - COUNTER_ENERGY_COST);
  if (step.value % COUNTER_WALK_DEN < COUNTER_WALK_NUM) {
    const nextState = deepFreeze({
      ...state,
      rngState: step.next,
      founderEnergy: energy,
      offer: null,
      pitchCooldown: PITCH_COOLDOWN,
    });
    return deepFreeze({ state: nextState, events: [{ key: EVENT_KEYS.OFFER_WALKED, params: {} }] });
  }
  const offer = state.offer;
  const investorPctBps = Math.trunc(offer.investorPctBps * COUNTER_BPS_NUM / COUNTER_BPS_DEN);
  const founderPctAfterBps = Math.trunc(state.founderPctBps * (10000 - investorPctBps) / 10000);
  const countered = Object.freeze({
    preK: offer.preK,
    roundK: offer.roundK,
    investorPctBps,
    founderPctAfterBps,
    countered: true,
  });
  const nextState = deepFreeze({
    ...state,
    rngState: step.next,
    founderEnergy: energy,
    offer: countered,
  });
  return deepFreeze({
    state: nextState,
    events: [{ key: EVENT_KEYS.OFFER_COUNTERED, params: { preK: countered.preK, roundK: countered.roundK, investorPctBps } }],
  });
}

function hire(state, role) {
  if (typeof role !== 'string' || !Object.hasOwn(ROLES, role)) {
    throw new Error(`Unknown role: ${JSON.stringify(role)}`);
  }
  if (state.focus <= 0) {
    throw new Error(`No focus left; HIRE rejected`);
  }
  if (state.team.includes(role)) {
    throw new Error(`Role ${role} already on the team`);
  }
  const def = ROLES[role];
  if (state.cashK < def.signOnK) {
    throw new Error(`Not enough cash for sign-on; HIRE ${role} rejected`);
  }
  const nextState = deepFreeze({
    ...state,
    focus: state.focus - 1,
    cashK: state.cashK - def.signOnK,
    team: Object.freeze([...state.team, role]),
  });
  return deepFreeze({
    state: nextState,
    events: [
      {
        key: EVENT_KEYS.ACTION_TAKEN,
        params: {
          action: ACTION_HIRE,
          role,
          tractionDelta: 0,
          moraleDelta: 0,
          cashDelta: -def.signOnK,
        },
      },
    ],
  });
}

function takeAction(state, type) {
  if (state.focus <= 0) {
    throw new Error(`No focus left; ${type} rejected`);
  }

  const def = ACTION_DEFS[type];
  const vertical = VERTICALS[state.vertical];
  const perks = perksFor(state.team, vertical);

  if (type === 'CLOSE_CLIENT') {
    if (!hasMvp(state)) {
      throw new Error(`No product yet; ${type} rejected before MVP`);
    }
    if (state.traction < perks.closeCost) {
      throw new Error(`Not enough traction; ${type} rejected`);
    }
    const amountK = dealPriceK(state.traction, vertical);
    const invoice = Object.freeze({
      amountK,
      dueMonth: state.month + perks.delayMonths,
    });
    const nextState = deepFreeze({
      ...state,
      focus: state.focus - 1,
      traction: state.traction - perks.closeCost,
      invoices: Object.freeze([...state.invoices, invoice]),
    });
    return deepFreeze({
      state: nextState,
      events: [
        {
          key: EVENT_KEYS.ACTION_TAKEN,
          params: { action: type, tractionDelta: -perks.closeCost, moraleDelta: 0 },
        },
        {
          key: EVENT_KEYS.INVOICE_CREATED,
          params: { amountK, dueMonth: invoice.dueMonth },
        },
      ],
    });
  }

  let rngState = state.rngState;
  let tractionDelta = 0;
  let moraleDelta = 0;
  let energyDelta = 0;
  const mvpDelta = type === 'BUILD_PRODUCT' ? 1 : 0;

  if (type === 'REST') {
    moraleDelta = Math.min(def.moraleGain, MORALE_MAX - state.teamMorale);
    energyDelta = Math.min(REST_ENERGY_GAIN, ENERGY_MAX - state.founderEnergy);
  } else {
    const base = type === 'BUILD_PRODUCT' ? perks.buildBase : type === 'TALK_TO_CUSTOMERS' ? perks.talkBase : def.tractionBase;
    const moraleCost = type === 'BUILD_PRODUCT' ? perks.buildMoraleCost : type === 'TALK_TO_CUSTOMERS' ? perks.talkMoraleCost : def.moraleCost;
    const tier = moraleTier(state.teamMorale);
    if (tier > 0) {
      const j = jitter(rngState, LABOR_JITTER);
      rngState = j.next;
      const raw = base + j.offset;
      const scaled = tier === 1 ? Math.trunc(raw / 2) : raw;
      tractionDelta = Math.max(0, scaled);
    }
    moraleDelta = -moraleCost;
  }

  const nextState = deepFreeze({
    ...state,
    rngState,
    focus: state.focus - 1,
    traction: state.traction + tractionDelta,
    mvpBuilds: state.mvpBuilds + mvpDelta,
    teamMorale: clampMorale(state.teamMorale + moraleDelta),
    founderEnergy: clampEnergy(state.founderEnergy + energyDelta),
  });

  return deepFreeze({
    state: nextState,
    events: [
      {
        key: EVENT_KEYS.ACTION_TAKEN,
        params: {
          action: type,
          tractionDelta,
          moraleDelta: nextState.teamMorale - state.teamMorale,
          ...(energyDelta !== 0 ? { energyDelta } : {}),
        },
      },
    ],
  });
}

function endMonth(state) {
  const vertical = VERTICALS[state.vertical];
  const perks = perksFor(state.team, vertical);
  const j = jitter(state.rngState, END_MONTH_DECAY_JITTER);
  const decay = END_MONTH_DECAY + j.offset;
  const newMorale = clampMorale(state.teamMorale - decay);
  const moraleDelta = newMorale - state.teamMorale;

  const closing = state.month >= state.totalMonths;
  const newMonth = closing ? state.month : state.month + 1;

  // Team engines (deterministic, zero PRNG draws): production feeds the
  // pipeline, then sales closes one deal from it, before collections.
  const production = perks.pipelinePerMonth;
  const postProductionTraction = state.traction + production;
  const closer = perks.autoClose && hasMvp(state)
    && postProductionTraction >= perks.closeCost ? autoCloseRole(state.team) : null;
  let tractionK = postProductionTraction;
  const extraInvoices = [];
  if (closer !== null) {
    const amountK = dealPriceK(postProductionTraction, vertical);
    tractionK = postProductionTraction - perks.closeCost;
    extraInvoices.push(Object.freeze({ amountK, dueMonth: newMonth + perks.delayMonths }));
  }

  // Cash flow: collect due invoices, then pay salaries (burn with team).
  const paid = state.invoices.filter((i) => i.dueMonth <= newMonth);
  const kept = [...state.invoices.filter((i) => i.dueMonth > newMonth), ...extraInvoices];
  const collectedK = paid.reduce((sum, i) => sum + i.amountK, 0);
  const burnK = burnFor(state.team, vertical);
  const newCashK = state.cashK + collectedK - burnK;

  const bankrupt = newCashK < 0;
  const reason = bankrupt ? 'bankrupt' : closing ? 'survived' : null;
  const expiredOffer = state.offer;

  const nextState = deepFreeze({
    ...state,
    rngState: j.next,
    focus: FOCUS_PER_MONTH,
    traction: tractionK,
    teamMorale: newMorale,
    founderEnergy: clampEnergy(state.founderEnergy + ENERGY_MONTH_REGEN),
    pitchCooldown: Math.max(0, state.pitchCooldown - 1),
    offer: null,
    cashK: newCashK,
    invoices: Object.freeze(kept),
    month: bankrupt ? state.month : newMonth,
    gameOver: bankrupt || closing,
    reason,
  });

  const events = [{ key: EVENT_KEYS.ACTION_TAKEN, params: { action: ACTION_END_MONTH, tractionDelta: 0, moraleDelta } }];
  if (expiredOffer !== null) {
    events.push({ key: EVENT_KEYS.OFFER_EXPIRED, params: { preK: expiredOffer.preK, roundK: expiredOffer.roundK } });
  }
  if (production > 0) {
    events.push({ key: EVENT_KEYS.PIPELINE_PRODUCED, params: { tractionDelta: production } });
  }
  if (closer !== null) {
    const invoice = extraInvoices[0];
    events.push({
      key: EVENT_KEYS.CLIENT_CLOSED_BY_TEAM,
      params: { role: closer, amountK: invoice.amountK, dueMonth: invoice.dueMonth, tractionDelta: -perks.closeCost },
    });
  }
  for (const invoice of paid) {
    events.push({
      key: EVENT_KEYS.INVOICE_PAID,
      params: { amountK: invoice.amountK, dueMonth: invoice.dueMonth },
    });
  }
  events.push({ key: EVENT_KEYS.SALARIES_PAID, params: { amountK: burnK } });
  if (reason) {
    const runEnded = { month: nextState.month, reason };
    if (reason === 'survived') Object.assign(runEnded, exitOf(nextState), { founderPctBps: nextState.founderPctBps });
    events.push({ key: EVENT_KEYS.RUN_ENDED, params: runEnded });
  } else {
    events.push({ key: EVENT_KEYS.MONTH_ADVANCED, params: { month: newMonth } });
  }
  return deepFreeze({ state: nextState, events });
}

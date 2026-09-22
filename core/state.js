// Pure game state: creation from seed. No mutation anywhere.

import { rngInit } from './rng.js';
import { deepFreeze } from './freeze.js';
import { FOCUS_PER_MONTH, VERTICALS, ACTIVE_VERTICAL, ENERGY_START } from './game.js';

export { deepFreeze };
export const TOTAL_MONTHS = 24;
export const INITIAL_MORALE = 80;

/**
 * Create the initial game state from an integer seed alone.
 * @param {number} seed
 * @returns {Readonly<object>}
 */
export function createGame(seed) {
  const vertical = VERTICALS[ACTIVE_VERTICAL];
  return deepFreeze({
    seed: seed >>> 0,
    rngState: rngInit(seed),
    month: 1,
    totalMonths: TOTAL_MONTHS,
    gameOver: false,
    reason: null,
    focus: FOCUS_PER_MONTH,
    traction: 0,
    teamMorale: INITIAL_MORALE,
    vertical: ACTIVE_VERTICAL,
    cashK: vertical.startCashK,
    invoices: Object.freeze([]),
    team: Object.freeze([]),
    founderEnergy: ENERGY_START,
    offer: null,
    pitchCooldown: 0,
    founderPctBps: 10000,
    investors: Object.freeze([]),
  });
}

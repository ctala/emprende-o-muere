// Seeded PRNG (mulberry32). Integer-only ops so output is bit-identical
// across engines. State is passed in and out; never module-global.

/**
 * @typedef {{ state: number, value: number, next: number }} RngStep
 */

/**
 * @param {number} seed
 * @returns {number} normalized 32-bit unsigned rng state
 */
export function rngInit(seed) {
  if (!Number.isInteger(seed)) {
    throw new Error(`rngInit requires an integer seed, got ${seed}`);
  }
  return seed >>> 0;
}

/**
 * Advance the generator one step.
 * @param {number} rngState
 * @returns {RngStep} drawn value plus the next state
 */
export function rngNext(rngState) {
  const state = (rngState + 0x6d2b79f5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = (t ^ (t >>> 14)) >>> 0;
  return { state, value, next: state };
}

/**
 * Draw `count` values.
 * @param {number} rngState
 * @param {number} count
 * @returns {{ values: number[], next: number }}
 */
export function rngDraw(rngState, count) {
  let state = rngState >>> 0;
  const values = [];
  for (let i = 0; i < count; i += 1) {
    const step = rngNext(state);
    values.push(step.value);
    state = step.next;
  }
  return { values, next: state };
}

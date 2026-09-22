// Run learnings: UI-only observer that unlocks information entries from the
// event stream. The core cannot import this (import-graph test), so learnings
// can never grant perks — only reveal. Persistence goes through an injected
// adapter so all logic tests run under plain Node.

import { EVENT_KEYS } from '../core/game.js';

export const STORAGE_KEY = 'roguelike.learnings.v1';

export const LEARNING_IDS = Object.freeze([
  'first_bankrupt',
  'first_hire',
  'first_round',
  'drained_deal',
  'investor_walked',
  'offer_expired',
  'broke_while_funded',
  'lost_control_survivor',
]);

/**
 * @typedef {{ unlocked: ReadonlyArray<string>, lastOfferTier: string | null, runFunded: boolean }} Observer
 */

/** Fresh per-run observer seeded with persisted unlocks. */
export function createObserver(unlockedIds) {
  return Object.freeze({
    unlocked: Object.freeze(LEARNING_IDS.filter((id) => unlockedIds.includes(id))),
    lastOfferTier: null,
    runFunded: false,
  });
}

function add(unlocked, id) {
  if (unlocked.includes(id)) return unlocked;
  return Object.freeze([...unlocked, id]);
}

/**
 * Pure observer fold over one dispatch's events: derives newly unlocked ids
 * plus the run-scoped context the next batch needs (offer tier at accept
 * time, funded status at bankruptcy). Never touches game state.
 * @param {ReadonlyArray<{ key: string, params: object }>} events
 * @param {Observer} observer
 * @returns {Readonly<{ observer: Observer, newIds: ReadonlyArray<string> }>}
 */
export function matchLearnings(events, observer) {
  let { unlocked, lastOfferTier, runFunded } = observer;
  const newIds = [];
  const unlock = (id) => {
    const next = add(unlocked, id);
    if (next !== unlocked) {
      unlocked = next;
      newIds.push(id);
    }
  };
  for (const e of events) {
    const p = e.params ?? {};
    if (e.key === EVENT_KEYS.OFFER_MADE) lastOfferTier = p.tier ?? null;
    if (e.key === EVENT_KEYS.ROUND_CLOSED) {
      runFunded = true;
      unlock('first_round');
      if (lastOfferTier === 'drained') unlock('drained_deal');
    }
    if (e.key === EVENT_KEYS.OFFER_WALKED) unlock('investor_walked');
    if (e.key === EVENT_KEYS.OFFER_EXPIRED) unlock('offer_expired');
    if (e.key === EVENT_KEYS.ACTION_TAKEN && p.action === 'HIRE') unlock('first_hire');
    if (e.key === EVENT_KEYS.RUN_ENDED) {
      if (p.reason === 'bankrupt') {
        unlock('first_bankrupt');
        if (runFunded) unlock('broke_while_funded');
      }
      if (p.reason === 'survived' && typeof p.founderPctBps === 'number' && p.founderPctBps < 5000) {
        unlock('lost_control_survivor');
      }
      lastOfferTier = null;
      runFunded = false;
    }
  }
  return Object.freeze({
    observer: Object.freeze({ unlocked, lastOfferTier, runFunded }),
    newIds: Object.freeze(newIds),
  });
}

/** @param {{ getItem: (key: string) => string | null }} adapter */
export function loadUnlocked(adapter) {
  try {
    const raw = adapter.getItem(STORAGE_KEY);
    if (raw === null) return Object.freeze([]);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('not an array');
    return Object.freeze(parsed.filter((id) => LEARNING_IDS.includes(id)));
  } catch (err) {
    console.warn('learnings: corrupt storage payload, starting empty', err);
    return Object.freeze([]);
  }
}

/** @param {{ setItem: (key: string, value: string) => void }} adapter */
export function saveUnlocked(adapter, ids) {
  try {
    adapter.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.warn('learnings: storage unavailable, unlocks live this session only', err);
  }
}

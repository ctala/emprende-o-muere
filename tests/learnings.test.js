import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EVENT_KEYS,
} from '../core/game.js';
import {
  LEARNING_IDS,
  STORAGE_KEY,
  createObserver,
  matchLearnings,
  loadUnlocked,
  saveUnlocked,
} from '../ui/learnings.js';

const ev = (key, params = {}) => Object.freeze({ key, params: Object.freeze(params) });
const run = (key, params) => matchLearnings([ev(key, params)], createObserver([]));

test('every learning id is listed once', () => {
  assert.equal(new Set(LEARNING_IDS).size, LEARNING_IDS.length);
  assert.equal(LEARNING_IDS.length, 8);
});

test('bankrupt run unlocks first_bankrupt', () => {
  const { newIds } = run(EVENT_KEYS.RUN_ENDED, { reason: 'bankrupt', month: 9 });
  assert.deepEqual([...newIds], ['first_bankrupt']);
});

test('hired action unlocks first_hire', () => {
  const { newIds } = run(EVENT_KEYS.ACTION_TAKEN, { action: 'HIRE', role: 'VENTAS' });
  assert.deepEqual([...newIds], ['first_hire']);
});

test('accepted round unlocks first_round', () => {
  const { newIds } = run(EVENT_KEYS.ROUND_CLOSED, { roundK: 120 });
  assert.deepEqual([...newIds], ['first_round']);
});

test('drained offer then accept unlocks drained_deal', () => {
  let o = createObserver([]);
  ({ observer: o } = matchLearnings([ev(EVENT_KEYS.OFFER_MADE, { tier: 'drained' })], o));
  const r = matchLearnings([ev(EVENT_KEYS.ROUND_CLOSED, { roundK: 120 })], o);
  assert.ok(r.newIds.includes('drained_deal'));
  assert.ok(r.observer.unlocked.includes('drained_deal'));
});

test('hot offer then accept does not unlock drained_deal', () => {
  let o = createObserver([]);
  ({ observer: o } = matchLearnings([ev(EVENT_KEYS.OFFER_MADE, { tier: 'hot' })], o));
  const r = matchLearnings([ev(EVENT_KEYS.ROUND_CLOSED, { roundK: 120 })], o);
  assert.ok(!r.newIds.includes('drained_deal'));
});

test('walked investor unlocks investor_walked', () => {
  const { newIds } = run(EVENT_KEYS.OFFER_WALKED, {});
  assert.deepEqual([...newIds], ['investor_walked']);
});

test('expired offer unlocks offer_expired', () => {
  const { newIds } = run(EVENT_KEYS.OFFER_EXPIRED, {});
  assert.deepEqual([...newIds], ['offer_expired']);
});

test('bankrupt while funded unlocks broke_while_funded too', () => {
  let o = createObserver([]);
  ({ observer: o } = matchLearnings([ev(EVENT_KEYS.ROUND_CLOSED, { roundK: 120 })], o));
  const r = matchLearnings([ev(EVENT_KEYS.RUN_ENDED, { reason: 'bankrupt', month: 20 })], o);
  assert.ok(r.newIds.includes('first_bankrupt'));
  assert.ok(r.newIds.includes('broke_while_funded'));
});

test('survived below control unlocks lost_control_survivor', () => {
  const low = matchLearnings([ev(EVENT_KEYS.RUN_ENDED, { reason: 'survived', founderPctBps: 4200, personalK: 100 })], createObserver([]));
  assert.ok(low.newIds.includes('lost_control_survivor'));
  const high = matchLearnings([ev(EVENT_KEYS.RUN_ENDED, { reason: 'survived', founderPctBps: 10000, personalK: 100 })], createObserver([]));
  assert.ok(!high.newIds.includes('lost_control_survivor'));
});

test('repeated trigger unlocks once and leaves observer idempotent', () => {
  let o = createObserver([]);
  const e = ev(EVENT_KEYS.INVOICE_PAID, {}); // no-op trigger sanity
  ({ observer: o } = matchLearnings([e], o));
  const first = matchLearnings([ev(EVENT_KEYS.OFFER_WALKED, {})], o);
  assert.deepEqual([...first.newIds], ['investor_walked']);
  const second = matchLearnings([ev(EVENT_KEYS.OFFER_WALKED, {})], first.observer);
  assert.deepEqual([...second.newIds], []);
  assert.equal(second.observer.unlocked.filter((id) => id === 'investor_walked').length, 1);
});

test('persisted unlocks seed the observer and are not re-unlocked', () => {
  const seeded = createObserver(['first_bankrupt']);
  const r = matchLearnings([ev(EVENT_KEYS.RUN_ENDED, { reason: 'bankrupt', month: 3 })], seeded);
  assert.deepEqual([...r.newIds], []);
  assert.ok(r.observer.unlocked.includes('first_bankrupt'));
});

test('run end resets run-scoped context', () => {
  let o = createObserver([]);
  ({ observer: o } = matchLearnings([ev(EVENT_KEYS.ROUND_CLOSED, {})], o));
  ({ observer: o } = matchLearnings([ev(EVENT_KEYS.RUN_ENDED, { reason: 'survived', founderPctBps: 10000 })], o));
  const r = matchLearnings([ev(EVENT_KEYS.RUN_ENDED, { reason: 'bankrupt', month: 24 })], o);
  assert.ok(!r.newIds.includes('broke_while_funded')); // funded flag reset at survived end
});

test('storage round-trip with a fake adapter', () => {
  const store = new Map();
  const adapter = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  assert.deepEqual([...loadUnlocked(adapter)], []);
  saveUnlocked(adapter, ['first_bankrupt', 'first_round']);
  assert.deepEqual([...loadUnlocked(adapter)].sort(), ['first_bankrupt', 'first_round']);
});

test('corrupt storage payload falls back to empty without throwing', () => {
  const adapter = { getItem: () => '{not json', setItem: () => {} };
  assert.deepEqual([...loadUnlocked(adapter)], []);
  const adapter2 = { getItem: () => '{"evil":true}', setItem: () => {} };
  assert.deepEqual([...loadUnlocked(adapter2)], []);
});

test('unknown ids in storage are filtered out', () => {
  const adapter = { getItem: () => JSON.stringify(['first_bankrupt', 'perk_money', 'nope']), setItem: () => {} };
  assert.deepEqual([...loadUnlocked(adapter)], ['first_bankrupt']);
});

test('storage write failure does not throw (private mode)', () => {
  const adapter = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
  assert.doesNotThrow(() => saveUnlocked(adapter, ['first_bankrupt']));
});

test('the core never imports learnings', async () => {
  // import-graph guarantee: learning code is a UI-only consumer of core
  // constants; nothing under core/ may reference it.
  const { readdirSync, readFileSync } = await import('node:fs');
  const dir = new URL('../core/', import.meta.url);
  const files = readdirSync(dir).filter((f) => f.endsWith('.js'));
  for (const f of files) {
    const src = readFileSync(new URL(f, dir), 'utf8');
    assert.ok(!/learnings|ui\//.test(src), `core/${f} must not reference learnings/UI`);
  }
});

test('every learning id resolves in strings_es', async () => {
  const { getString } = await import('../content/strings_es.js');
  for (const id of LEARNING_IDS) {
    assert.equal(typeof getString(`learning.${id}`), 'string');
  }
});

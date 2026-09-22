// The frozen-geometry contract retired with the canvas. This is the view
// contract: buildModel over fixed states must produce the exact DOM contract
// the e2e layer asserts. buildModel is pure, so this runs in plain Node.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../core/state.js';
import { applyAction, burnFor, perksFor, VERTICALS, ACTIVE_VERTICAL, ACTION_HIRE, ROLES } from '../core/game.js';
import { buildModel } from '../ui/view.js';

const V = VERTICALS[ACTIVE_VERTICAL];

function model(state, over = {}) {
  const perks = perksFor(state.team, V);
  const nextRole = ['VENTAS', 'CTO', 'CFO', 'CPO'].find((r) => !state.team.includes(r)) ?? null;
  const ctx = {
    v: V,
    burn: burnFor(state.team, V),
    closeCost: perks.closeCost,
    delayMonths: perks.delayMonths,
    nextRole,
    closing: false,
    settlement: null,
    lastLearn: null,
    afford: (a) => a !== 'CLOSE_CLIENT',
    reason: (a) => (a === 'CLOSE_CLIENT' ? `Requiere ${perks.closeCost} de tracción` : null),
    rowOrder: ['BUILD_PRODUCT', 'TALK_TO_CUSTOMERS', 'PUBLISH_CONTENT', 'REST', 'CLOSE_CLIENT', 'HIRE'],
    pitchMinMonth: 6,
    pitchCost: 80,
    counterCost: 20,
    log: ['línea a', 'línea b', 'línea c', 'línea d'],
    ...over,
  };
  return buildModel(state, ctx);
}

test('labor rows show honest yield ranges, never a single fake number', () => {
  const healthy = model({ ...createGame(1), teamMorale: 80 });
  const build = healthy.rows.find((r) => r.id === 'BUILD_PRODUCT');
  assert.equal(build.desc, 'Tracción 5–11 · Moral −8', 'tier alto: rango 8±3, no un +8 suelto');
  assert.match(healthy.rows.find((r) => r.id === 'TALK_TO_CUSTOMERS').desc, /^Tracción 3–9/);
  assert.match(healthy.rows.find((r) => r.id === 'PUBLISH_CONTENT').desc, /^Tracción 1–7/);

  const mid = model({ ...createGame(1), teamMorale: 50 });
  assert.equal(mid.rows.find((r) => r.id === 'BUILD_PRODUCT').desc, 'Tracción 2–5 · Moral −8 · moral baja',
    'tier medio: mitad truncada del rango, marcado');
});

test('hire row sells the perk, not just the cost', () => {
  const m = model(createGame(1));
  const hire = m.rows.find((r) => r.id === 'HIRE');
  assert.match(hire.desc, /Burn sube a 17k\/mes/);
  assert.match(hire.desc, /Firmar cliente: 10 → 6/, 'VENTAS perk must be visible on the card');
  const afterVentas = model({ ...createGame(1), team: Object.freeze(['VENTAS']) });
  assert.match(afterVentas.rows.find((r) => r.id === 'HIRE').desc, /Construir: 8 → 12/, 'CTO perk');
});

test('every visible row answers "what do I get / what does it cost": honest descs', () => {
  const m12 = model({ ...createGame(1), traction: 12 }, { afford: () => true });
  const close = m12.rows.find((r) => r.id === 'CLOSE_CLIENT');
  assert.equal(close.disabled, false);
  assert.match(close.desc, /Tracción −10/, 'cost shown');
  assert.match(m12.rows.find((r) => r.id === 'CLOSE_CLIENT').desc, /Factura \$30k/, 'deal derived from current traction');
  assert.match(m12.end.desc, /Caja −15k · moral −3 a −7/, 'end month names the real burn + decay band');
  const pitch = m12.pitch;
  assert.match(pitch.desc, /Valor \(Pre\) actual: \$198k/, 'pitch shows the live valuation anchor');
});

test('fresh state: hero matches floor(cash/burn), six rows, core-loop first', () => {
  const m = model(createGame(20260918));
  assert.equal(m.hero.value, `${Math.floor(120 / 15)}m`);
  assert.equal(m.hero.gloss, 'meses de vida');
  assert.equal(m.rows.length, 6);
  assert.equal(m.rows[0].id, 'BUILD_PRODUCT');
  assert.equal(m.rows[0].disabled, false);
  assert.equal(m.rows.find((r) => r.id === 'CLOSE_CLIENT').disabled, true);
  assert.match(m.rows.find((r) => r.id === 'CLOSE_CLIENT').reason, /10/);
  assert.deepEqual(m.log, ['línea a', 'línea b', 'línea c', 'línea d'], 'short log is kept whole');
  const long = model(createGame(2), { log: Array.from({ length: 30 }, (_, i) => `l${i}`) });
  assert.equal(long.log.length, 20);
  assert.equal(long.log.at(-1), 'l29', 'log keeps the most recent lines');
});

test('burned team (tier 0 morale): labor rows carry the burned warning', () => {
  const drained = { ...createGame(1), teamMorale: 20 };
  const m = model(drained);
  for (const id of ['BUILD_PRODUCT', 'TALK_TO_CUSTOMERS', 'PUBLISH_CONTENT']) {
    const row = m.rows.find((r) => r.id === id);
    assert.equal(row.disabled, false, `${id} stays clickable at burned morale`);
    assert.match(row.warn, /quemado/i, `${id} must warn about zero traction`);
  }
  assert.equal(m.rows.find((r) => r.id === 'REST').warn, null, 'REST is the escape, no warning');
  assert.equal(m.fields.find((f) => f.id === 'morale').alarm, true, 'morale field must alarm below tier');
});

test('healthy morale: no burned warning anywhere', () => {
  const m = model(createGame(2));
  assert.equal(m.rows.every((r) => !r.warn), true);
  assert.equal(m.fields.find((f) => f.id === 'morale').alarm, false);
});

test('bankrupt terminal model carries stamp + headline', () => {
  const bankrupt = { ...createGame(1), gameOver: true, reason: 'bankrupt' };
  const m = model(bankrupt);
  assert.equal(m.terminal.stamp, 'QUEBRASTE');
  assert.match(m.terminal.headline, /Quebraste/);
});

test('survived terminal model includes settlement lines', () => {
  const survived = { ...createGame(1), month: 24, gameOver: true, reason: 'survived', traction: 20, cashK: 50, founderPctBps: 8000 };
  const settlement = { traction: 20, cashK: 50, founderPctBps: 8000, valuationK: 350, payoutK: 280, cashOutK: 40, personalK: 320 };
  const m = model(survived, { settlement });
  assert.equal(m.terminal.stamp, 'SOBREVIVISTE');
  assert.ok(m.terminal.settlement.length >= 3, 'settlement must render payoff lines');
});

test('offer state: offer model with terms, dilution, counter gating', () => {
  const withOffer = {
    ...createGame(1),
    offer: { preK: 500, roundK: 120, investorPctBps: 2000, founderPctAfterBps: 8000, countered: false },
    founderEnergy: 10,
  };
  const m = model(withOffer);
  assert.match(m.offer.terms, /500/);
  assert.match(m.offer.dilution, /20/);
  assert.equal(m.offer.counterDisabled, true, 'counter must gate on energy');
  assert.match(m.offer.counterReason, /20/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../core/state.js';
import { applyAction, ACTION_END_MONTH } from '../core/game.js';
import { render } from '../ui/renderer.js';

// ui/renderer.js is pure string logic (no DOM), so it is testable headless.

const serialize = (x) => JSON.stringify(x);

test('same event renders identically twice', () => {
  const { events } = applyAction(createGame(12345), { type: 'BUILD_PRODUCT' });
  assert.equal(render(events[0]), render(events[0]));
});

test('action event renders Spanish with core numbers', () => {
  const { events } = applyAction(createGame(12345), { type: 'TALK_TO_CUSTOMERS' });
  const e = events[0];
  const text = render(e);
  assert.ok(text.startsWith('Hablaste con clientes: tracción '), text);
  assert.ok(text.includes(String(e.params.tractionDelta)), text);
});

test('run_ended event renders terminal text per reason', () => {
  let state = { ...createGame(5), cashK: 10000 };
  let last;
  for (let i = 0; i < 24; i += 1) {
    ({ state, events: last } = applyAction(state, { type: ACTION_END_MONTH }));
  }
  assert.equal(
    render(last.find((e) => e.key === 'evt.run_ended')),
    'Sobreviviste 24 meses. Fin de la partida.',
  );

  const broke = applyAction({ ...createGame(5), cashK: 1 }, { type: ACTION_END_MONTH });
  assert.equal(
    render(broke.events.find((e) => e.key === 'evt.run_ended')),
    'Quebraste en el mes 1. Fin de la partida.',
  );
});

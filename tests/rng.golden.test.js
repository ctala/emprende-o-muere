import test from 'node:test';
import assert from 'node:assert/strict';
import { rngInit, rngDraw } from '../core/rng.js';

test('rngInit normalizes seed to uint32', () => {
  assert.equal(rngInit(12345), 12345);
  assert.equal(rngInit(-7), (-7) >>> 0);
  assert.throws(() => rngInit(1.5), /integer seed/);
  assert.throws(() => rngInit('x'), /integer seed/);
});

// Pinning an intentional algorithm choice: a deliberate PRNG swap must
// update this vector AND the game-core spec in one reviewed change.
test('golden vectors: seed 0, ten draws', () => {
  const { values, next } = rngDraw(rngInit(0), 10);
  assert.deepEqual(values, [
    1144304738,
    1416247,
    958946056,
    627933444,
    2007157716,
    2340967985,
    2642484575,
    2787370982,
    1958536065,
    2496316458,
  ]);
  assert.equal(next, 1135788946);
});

test('golden vectors: seed 12345, ten draws', () => {
  const { values } = rngDraw(rngInit(12345), 10);
  assert.deepEqual(values, [
    4207900869,
    1317490944,
    2079646450,
    3513001552,
    2187978186,
    1492380277,
    316786230,
    3291647763,
    4281336957,
    3543444592,
  ]);
});

test('all draws are uint32 integers', () => {
  const { values } = rngDraw(rngInit(987654321), 1000);
  for (const v of values) {
    assert.ok(Number.isInteger(v));
    assert.ok(v >= 0 && v <= 0xffffffff);
  }
});

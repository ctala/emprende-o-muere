// Surface-contrast contract (redesign-documentary-ledger): hierarchy comes
// from measurable surface separation, not from same-tone fills. This test
// parses the design tokens straight out of styles.css and does the color
// math in plain Node, so a token swap that flattens a level fails loudly.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const CSS = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

const token = (name) => {
  const m = CSS.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(m, `token --${name} not found in styles.css`);
  return m[1];
};

function luminance(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function ratio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

test('surface levels separate by >= 1.3:1 at their seams (beige-soup guard)', () => {
  // Per design D1 the card FILL stays paper-tone; separation is measured at
  // the seams: desk against paper (page frame), and the card edge against
  // the paper it sits on. A seam flatter than 1.3:1 reads as one surface.
  const desk = token('desk');
  const paper = token('paper');
  const edge = token('paper-rule');
  assert.ok(ratio(desk, paper) >= 1.3, `desk/paper ${ratio(desk, paper).toFixed(2)}`);
  assert.ok(ratio(edge, paper) >= 1.3, `card-edge/paper ${ratio(edge, paper).toFixed(2)}`);
});

test('every raised surface carries a hard shadow token, not just an edge', () => {
  for (const sel of ['.sheet', '.hero', '.field', '.row {']) {
    const block = CSS.slice(CSS.indexOf(sel));
    assert.ok(block.slice(0, 400).includes('var(--lift)'), `${sel} must use the lift shadow`);
  }
});

test('the CTA stamp is the ink-dark element: paper-on-ink >= 4.5:1', () => {
  assert.ok(ratio(token('paper'), token('ink')) >= 4.5, 'CTA label must hold body contrast on the ink fill');
});

test('dim text keeps body contrast on both light surfaces', () => {
  const dim = token('ink-dim');
  assert.ok(ratio(dim, token('paper')) >= 4.5, 'ink-dim on paper');
  assert.ok(ratio(dim, token('card')) >= 4.5, 'ink-dim on card');
});

test('the red margin rule and alarm red stay >= 4.5:1 on paper and card', () => {
  for (const bg of [token('paper'), token('card')]) {
    assert.ok(ratio(token('red'), bg) >= 4.5, `red on ${bg}`);
  }
});

test('body list rhythm sits inside the 1.5-1.75 line-height band', () => {
  const m = CSS.match(/--rule-line:\s*(\d+)px/);
  assert.ok(m, '--rule-line must be a px number');
  const f = CSS.match(/html\s*{\s*font-size:\s*(\d+)px/);
  assert.ok(f, 'explicit root font-size required for the rhythm contract');
  const lh = Number(m[1]) / Number(f[1]);
  assert.ok(lh >= 1.5 && lh <= 1.75, `line-height ${lh.toFixed(3)} out of band`);
});

test('mini buttons hit the 48px touch square in both axes', () => {
  const block = CSS.slice(CSS.indexOf('.mini {'));
  assert.ok(/min-height:\s*48px/.test(block), 'min-height 48px missing');
  assert.ok(/min-width:\s*48px/.test(block), 'min-width 48px missing (one-char labels collapsed to 35px)');
});

test('disabled lock reasons stay off ledger red (red is for negative money)', () => {
  const m = CSS.match(/\.row\[disabled\] \.row-reason\s*{[^}]*color:\s*var\(--([\w-]+)\)/);
  assert.ok(m, 'no dim treatment for lock reasons');
  assert.notEqual(m[1], 'red', 'lock reason must not borrow alarm red');
});

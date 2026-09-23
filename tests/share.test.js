// Share seam contract: composeShareText is the single source of the post
// (visible block + shared payload); performShare's degradation chain and its
// zero-game-state rule are pinned here (pure env stubs) and in e2e.

import test from 'node:test';
import assert from 'node:assert/strict';
import { composeShareText, performShare } from '../ui/share.js';

const survived = { stampWord: 'SOBREVIVISTE', months: 24, personalK: 320, learn: '' };
const bankrupt = { stampWord: 'QUEBRASTE', months: 9, personalK: null, learn: '' };

test('post is deterministic: same facts in, byte-identical text out', () => {
  const a = composeShareText(survived, 777, 'http://x/y.html');
  const b = composeShareText(survived, 777, 'http://x/y.html');
  assert.equal(a, b);
});

test('post replays the exact run: link carries the live seed', () => {
  assert.match(composeShareText(bankrupt, 777, 'http://x/y.html'), /\?seed=777/);
});

test('survived names months and the personal total; bankrupt names the month', () => {
  const s = composeShareText(survived, 1, 'http://x');
  assert.match(s, /24 meses/);
  assert.match(s, /\$320k/);
  assert.match(s, /SOBREVIVISTE/);
  const b = composeShareText(bankrupt, 1, 'http://x');
  assert.match(b, /9 meses/);
  assert.ok(!b.includes('$'), 'bankrupt post names no money');
  const bare = composeShareText({ ...bankrupt, stampWord: '' }, 1, 'http://x');
  assert.ok(bare.includes('Aguanté'), 'empty stampWord composes without the stamp');
  assert.ok(!bare.includes('· ·'), 'empty parts must not leak separators');
});

test('learn line joins the post when unlocked, absent when not', () => {
  assert.match(composeShareText({ ...bankrupt, learn: 'APRENDE' }, 1, 'http://x'), /APRENDE/);
  assert.ok(!composeShareText(bankrupt, 1, 'http://x').includes('undefined'));
});

const fakeButton = () => ({ textContent: 'Compartir', dataset: {} });

test('share wins over clipboard when the platform offers it', async () => {
  const shared = [];
  const result = await performShare('texto', fakeButton(), {
    nav: { canShare: () => true, share: (p) => { shared.push(p); return Promise.resolve(); } },
  });
  assert.equal(result, 'shared');
  assert.equal(shared[0].text, 'texto');
});

test('a cancelled share sheet is not an error and does not copy', async () => {
  const result = await performShare('texto', fakeButton(), {
    nav: {
      canShare: () => true,
      share: () => Promise.reject(Object.assign(new Error('cancel'), { name: 'AbortError' })),
      clipboard: { writeText: () => { throw new Error('must not copy'); } },
    },
  });
  assert.equal(result, 'canceled');
});

test('no platform share falls back to clipboard with a visible confirm', async () => {
  const written = [];
  const button = fakeButton();
  const result = await performShare('texto', button, {
    nav: { clipboard: { writeText: (t) => { written.push(t); return Promise.resolve(); } } },
    restoreMs: 60_000,
  });
  assert.equal(result, 'copied');
  assert.equal(written[0], 'texto');
  assert.equal(button.textContent, 'Copiado');
});

test('no clipboard either: the on-page post block is selected for manual copy', async () => {
  const post = { hidden: true, focus: () => {}, select: () => { post.selected = true; } };
  const result = await performShare('texto', fakeButton(), {
    nav: {},
    doc: { getElementById: (id) => (id === 'share-post' ? post : null) },
  });
  assert.equal(result, 'manual');
  assert.equal(post.hidden, false);
  assert.equal(post.selected, true);
});

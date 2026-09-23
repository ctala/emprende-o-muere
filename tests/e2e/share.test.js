// Terminal share contract in the real browser: the post carries the live seed,
// the seal splits by verdict (red bankrupt vs positive-tier survived), the
// clipboard path confirms visibly, a cancelled share sheet is silent, and
// nothing in the share path touches the run.

import test from 'node:test';
import assert from 'node:assert/strict';
import { withHarness } from './harness.mjs';

const RED = 'rgb(163, 49, 42)';
const GREEN = 'rgb(60, 107, 52)';

const boot = async (browser, server, seed) => {
  await browser.navigate(server.url(`/index.html?seed=${seed}`));
  assert.ok(await browser.poll('document.body.dataset.booted === "1"', { timeoutMs: 2000 }), 'boot marker missing');
};

async function runToEnd(browser, server, seed, months) {
  await boot(browser, server, seed);
  for (let m = 2; m <= months; m += 1) {
    if (await browser.eval('document.getElementById("terminal").hidden === false')) break;
    if (await browser.eval('document.getElementById("end").disabled')) break;
    await browser.click('[data-testid="end"]');
    const settled = await browser.poll(
      `!document.getElementById("terminal").hidden || document.getElementById("month-label").textContent.startsWith("Mes ${m} ")`,
      { timeoutMs: 1500 },
    );
    assert.ok(settled, `neither month ${m} nor the terminal appeared`);
  }
  assert.ok(await browser.eval('!document.getElementById("terminal").hidden'), 'terminal never appeared');
}

test('bankrupt terminal: red seal, seed facts, clipboard confirm, silent cancel', async (t) => {
  const { server, browser } = await withHarness(t);
  await runToEnd(browser, server, '777', 12);

  assert.match(await browser.eval('document.querySelector(\'[data-testid="terminal-meta"]\').textContent'), /seed 777/);
  const stamp = await browser.eval('(() => { const s = document.querySelector(\'[data-testid="stamp"]\'); return [s.className, getComputedStyle(s).color].join("|"); })()');
  assert.ok(!/survived/.test(stamp), 'bankrupt seal must not carry the survived class');
  assert.ok(stamp.endsWith(RED), `bankrupt seal color is not ledger red: ${stamp}`);

  const post = await browser.eval('document.getElementById("share-post").value');
  assert.match(post, /Aguanté \d+ meses/);
  assert.match(post, /\d+ meses/);
  assert.match(post, /\?seed=777/, 'the post link must replay this exact run');
  assert.match(post, /seed=777[^\n]*$/m, 'the post ends with the replay link');

  const monthBefore = await browser.eval('document.getElementById("month-label").textContent');
  await browser.eval('navigator.clipboard.writeText = (t) => { window.__copied = t; return Promise.resolve(); }');
  await browser.click('[data-testid="share"]');
  assert.ok(await browser.poll('document.getElementById("share-btn").textContent === "Copiado"', { timeoutMs: 1500 }),
    'clipboard fallback must confirm visibly on the button');
  assert.match(await browser.eval('window.__copied'), /\?seed=777/);
  assert.equal(await browser.eval('document.getElementById("month-label").textContent'), monthBefore,
    'sharing must not change game state');
  assert.ok(await browser.poll('document.getElementById("share-btn").textContent === "Compartir"', { timeoutMs: 3000 }),
    'the confirmation must auto-restore');

  await browser.eval(`
    navigator.canShare = () => true;
    navigator.share = () => Promise.reject(Object.assign(new Error('cancel'), { name: 'AbortError' }));
    navigator.clipboard.writeText = (t) => { window.__copied2 = t; return Promise.resolve(); };
  `);
  await browser.click('[data-testid="share"]');
  await new Promise((r) => setTimeout(r, 300));
  assert.equal(await browser.eval('window.__copied2'), undefined, 'a cancelled share sheet must not copy');
  assert.equal(await browser.eval('document.getElementById("share-btn").textContent'), 'Compartir',
    'cancel must not leave a false confirmation');
  assert.deepEqual(browser.errors, [], `page errors: ${browser.errors.join(' | ')}`);
});

test('survived terminal: positive-tier green seal and a money-naming post', async (t) => {
  const { server, browser } = await withHarness(t);
  await boot(browser, server, '777');
  // DOM mirror of the sweep's harvest-nohire policy (survives 16/16 seeds):
  // two builds for the MVP, close deals when money runs low or contacts pile
  // up, rest the burned months. If this driver ever dies early, the policy
  // and the DOM diverged -- the sweep pins the policy side.
  const snap = () => browser.eval(`(() => {
    const hud = (id) => document.querySelector('[data-testid="field-' + id + '"] .field-value')?.textContent.trim() ?? '';
    return {
      month: Number(document.getElementById('month-label').textContent.match(/(\\d+)/)[1]),
      cash: Number(hud('cash').match(/(\\d+)/)?.[0] ?? NaN),
      traction: Number(hud('traction')),
      morale: Number(hud('morale')),
      focus: Number(hud('focus').match(/^(\\d)/)[0]),
      canClose: !document.querySelector('[data-action="CLOSE_CLIENT"]').disabled,
    };
  })()`);
  const settled = (prev) => browser.poll(`(() => {
    const hud = (id) => document.querySelector('[data-testid="field-' + id + '"] .field-value')?.textContent.trim() ?? '';
    const now = {
      month: Number(document.getElementById('month-label').textContent.match(/(\\d+)/)[1]),
      cash: Number(hud('cash').match(/(\\d+)/)?.[0] ?? NaN),
      focus: Number(hud('focus').match(/^(\\d)/)[0]),
    };
    return !document.getElementById("terminal").hidden
      || now.month !== ${prev.month} || now.focus !== ${prev.focus} || now.cash !== ${prev.cash};
  })()`, { timeoutMs: 2500 });

  let guard = 0;
  for (;;) {
    if (await browser.eval('!document.getElementById("terminal").hidden')) break;
    if (++guard > 120) throw new Error('harvest driver did not reach a terminal');
    const s = await snap();
    if (s.focus === 0) {
      await browser.click('[data-testid="end"]');
    } else if (s.canClose && s.cash < 80) {
      await browser.click('[data-action="CLOSE_CLIENT"]');
    } else if (s.morale < 40) {
      await browser.click('[data-action="REST"]');
    } else if (s.focus === 2) {
      await browser.click('[data-action="BUILD_PRODUCT"]');
    } else {
      await browser.click('[data-action="REST"]');
    }
    assert.ok(await settled(s), `driver stalled at month ${s.month}`);
  }

  const stamp = await browser.eval('(() => { const s = document.querySelector(\'[data-testid="stamp"]\'); return [s.textContent.trim(), s.className, getComputedStyle(s).color].join("|"); })()');
  assert.match(stamp, /^SOBREVIVISTE/);
  assert.match(stamp, /survived/, 'survived run must carry the survived class');
  assert.ok(stamp.endsWith(GREEN), `survived seal is not positive-tier green: ${stamp}`);

  const post = await browser.eval('document.getElementById("share-post").value');
  assert.match(post, /24 meses/);
  assert.match(post, /\$\d+k/, 'a survived post names the personal total');
  assert.match(post, /\?seed=777/);
  assert.match(post, /Jugá mi partida: http/, 'the replay call must read in the player language');
  assert.deepEqual(browser.errors, [], `page errors: ${browser.errors.join(' | ')}`);
});

test('the lesson line never leaks a previous run: bankrupt -> restart -> survived shows no stale lesson', async (t) => {
  const { server, browser } = await withHarness(t);
  await runToEnd(browser, server, '777', 12);

  const learn1 = await browser.eval('document.getElementById("terminal-learn").hidden');
  assert.equal(learn1, false, 'a bankrupt run unlocks first_bankrupt: its lesson must show');
  await browser.click('[data-testid="restart"]');
  assert.ok(await browser.poll('document.getElementById("terminal").hidden', { timeoutMs: 1500 }));

  // survive the restarted run (harvest driver); it unlocks no lesson of its own
  const snap = () => browser.eval(`(() => {
    const hud = (id) => document.querySelector('[data-testid="field-' + id + '"] .field-value')?.textContent.trim() ?? '';
    return {
      month: Number(document.getElementById('month-label').textContent.match(/(\\d+)/)[1]),
      cash: Number(hud('cash').match(/(\\d+)/)?.[0] ?? NaN),
      morale: Number(hud('morale')),
      focus: Number(hud('focus').match(/^(\\d)/)[0]),
      canClose: !document.querySelector('[data-action="CLOSE_CLIENT"]').disabled,
    };
  })()`);
  const settled = (s) => browser.poll(`(() => {
    const hud = (id) => document.querySelector('[data-testid="field-' + id + '"] .field-value')?.textContent.trim() ?? '';
    return !document.getElementById("terminal").hidden
      || Number(document.getElementById('month-label').textContent.match(/(\\d+)/)[1]) !== ${s.month}
      || Number(hud('focus').match(/^(\\d)/)[0]) !== ${s.focus}
      || Number(hud('cash').match(/(\\d+)/)?.[0] ?? NaN) !== ${s.cash};
  })()`, { timeoutMs: 2500 });
  let guard = 0;
  for (;;) {
    if (await browser.eval('!document.getElementById("terminal").hidden')) break;
    if (++guard > 120) throw new Error('driver did not reach a terminal');
    const s = await snap();
    if (s.focus === 0) await browser.click('[data-testid="end"]');
    else if (s.canClose && s.cash < 80) await browser.click('[data-action="CLOSE_CLIENT"]');
    else if (s.morale < 40) await browser.click('[data-action="REST"]');
    else if (s.focus === 2) await browser.click('[data-action="BUILD_PRODUCT"]');
    else await browser.click('[data-action="REST"]');
    await settled(s);
  }
  assert.match(await browser.eval('document.querySelector(\'[data-testid="stamp"]\').textContent'), /SOBREVIVISTE/);
  assert.equal(await browser.eval('document.getElementById("terminal-learn").hidden'), true,
    'the bankrupt lesson of the previous run must not sit under the survived stamp');
  assert.ok(!(await browser.eval('document.getElementById("share-post").value')).includes('quebraste'),
    'the share post must not carry the previous run\'s bankruptcy lesson');
});

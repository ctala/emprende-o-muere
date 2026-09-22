// E2E smoke: drive a seeded run to a terminal outcome through the DOM only.

import test from 'node:test';
import assert from 'node:assert/strict';
import { withHarness } from './harness.mjs';

test('seeded bootstrap run stamps the terminal screen', async (t) => {
  const { server, browser } = await withHarness(t);
  await browser.navigate(server.url('/index.html?seed=20260918'));
  assert.ok(await browser.poll('document.body.dataset.booted === "1"', { timeoutMs: 2000 }), 'boot marker missing');

  // Pure bootstrap: never act, only close months. Burn outpaces cash -> bankrupt
  // at the click that pushes cash negative; the month label stays on the last month.
  let monthsClicked = 0;
  for (let month = 2; month <= 12; month += 1) {
    if (await browser.eval('document.getElementById("end").disabled')) break;
    await browser.click('[data-testid="end"]');
    monthsClicked += 1;
    const settled = await browser.poll(
      `!document.getElementById("terminal").hidden || document.getElementById("month-label").textContent.startsWith("Mes ${month} ")`,
      { timeoutMs: 1500 },
    );
    assert.ok(settled, `neither month ${month} nor terminal appeared after closing it`);
    if (await browser.eval('!document.getElementById("terminal").hidden')) break;
  }
  assert.ok(monthsClicked >= 8, `run ended suspiciously early after ${monthsClicked} closes`);

  assert.ok(await browser.eval('!document.getElementById("terminal").hidden'), 'terminal never appeared');
  const stamp = await browser.eval('document.querySelector(\'[data-testid="stamp"]\').textContent.trim()');
  assert.ok(stamp.length > 0, 'stamp text empty');
  assert.match(stamp, /QUEBRASTE/i, 'bootstrap burn-out must stamp bankrupt');
  assert.match(await browser.eval('document.querySelector(\'[data-testid="headline"]\').textContent'), /fin/i,
    'terminal headline missing');
  assert.deepEqual(browser.errors, [], `page errors during run: ${browser.errors.join(' | ')}`);
});

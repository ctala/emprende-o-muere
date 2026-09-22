// Every overlay must be dismissable. The owner got trapped in help, library
// and the terminal stamp with no way out.

import test from 'node:test';
import assert from 'node:assert/strict';
import { withHarness } from './harness.mjs';

const boot = async (browser, server) => {
  await browser.navigate(server.url('/index.html?seed=20260918'));
  assert.ok(await browser.poll('document.body.dataset.booted === "1"', { timeoutMs: 2000 }), 'boot marker missing');
};

test('help and library open, close via button, Esc and backdrop', async (t) => {
  const { server, browser } = await withHarness(t);
  await boot(browser, server);

  const hidden = (id) => browser.eval(`document.getElementById('${id}').hidden`);

  await browser.click('[data-testid="help"]');
  assert.equal(await hidden('help-modal'), false, 'help did not open');
  assert.equal(await browser.eval('!!document.querySelector(\'#help-modal [data-testid="close"]\')'), true,
    'help sheet has no close button');
  await browser.keyboard('Escape');
  assert.equal(await hidden('help-modal'), true, 'Escape did not close help');

  await browser.click('[data-testid="library"]');
  assert.equal(await hidden('library-modal'), false, 'library did not open');
  await browser.click('#library-modal [data-testid="close"]');
  assert.equal(await hidden('library-modal'), true, 'close button did not close library');

  await browser.click('[data-testid="help"]');
  await browser.eval(`(() => { const m = document.getElementById('help-modal');
    m.dispatchEvent(new MouseEvent('click', { bubbles: true })); })()`);
  assert.equal(await hidden('help-modal'), true, 'backdrop click did not close help');

  assert.deepEqual(browser.errors, [], `page errors: ${browser.errors.join(' | ')}`);
});

test('terminal can be dismissed and the run restarted', async (t) => {
  const { server, browser } = await withHarness(t);
  await boot(browser, server);
  for (let i = 0; i < 9; i += 1) {
    if (await browser.eval('!document.getElementById("terminal").hidden')) break;
    await browser.click('[data-testid="end"]');
    await browser.poll('!document.getElementById("terminal").hidden || document.getElementById("end").disabled', { timeoutMs: 1500 });
  }
  assert.ok(await browser.eval('!document.getElementById("terminal").hidden'), 'terminal never appeared');
  assert.equal(await browser.eval('document.getElementById("month-label").textContent'), 'Mes 9 de 24', 'run should end at month 9');

  await browser.click('[data-testid="restart"]');
  await browser.poll('document.getElementById("terminal").hidden', { timeoutMs: 1500 });
  assert.equal(await browser.eval('document.getElementById("terminal").hidden'), true, 'terminal still open after restart');
  assert.equal(await browser.eval('document.getElementById("month-label").textContent'), 'Mes 1 de 24', 'restart did not reset the run');
  assert.match(await browser.eval('document.getElementById("hero-value").textContent'), /^8m$/, 'restart did not restore fresh runway');
  assert.deepEqual(browser.errors, [], `page errors: ${browser.errors.join(' | ')}`);
});

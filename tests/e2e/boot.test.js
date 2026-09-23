// Boot integrity: the page must actually boot and render, not just exist.
// This is the incident reproducer for "owner opens the page and sees nothing".

import test from 'node:test';
import assert from 'node:assert/strict';
import { withHarness } from './harness.mjs';

test('page boots and renders the game shell', async (t) => {
  const { server, browser } = await withHarness(t);
  await browser.navigate(server.url('/index.html'));
  const rendered = await browser.poll('document.getElementById("hero-value")?.textContent.trim().length > 0', { timeoutMs: 3000 });
  assert.ok(rendered, 'page blank: hero value never rendered (entry module broken or blocked)');

  assert.ok(await browser.poll('document.body.dataset.booted === "1"', { timeoutMs: 2000 }),
    'boot marker never appeared (wiring incomplete)');
  assert.match(await browser.eval('document.getElementById("month-label").textContent'), /1/,
    'month label not rendered');
  assert.match(await browser.eval('document.getElementById("hero-value").textContent'), /^\d+ meses$/,
    'runway hero not rendered');
  const rowCount = await browser.eval('document.querySelectorAll("#action-list [data-action]").length');
  assert.equal(rowCount, 6, 'action list not populated');
  // Render contract: hero must equal floor(displayed cash / displayed burn).
  assert.ok(await browser.eval(`(() => {
    const num = (id) => Number(document.querySelector('[data-testid="field-' + id + '"] .field-value')?.textContent.match(/[\\d.]+/)?.[0]);
    const cash = num('cash');
    const burn = num('burn');
    const hero = Number(document.getElementById('hero-value').textContent.replace(' meses', ''));
    return document.querySelector('[data-testid="field-cash"] .field-value') !== null
      && document.querySelector('[data-testid="field-burn"] .field-value') !== null
      && hero === Math.floor(cash / burn);
  })()`), 'hero value does not match floor(displayed cash / displayed burn)');
  assert.deepEqual(browser.errors, [], `page errors during load: ${browser.errors.join(' | ')}`);
});

test('seed parameter reproduces the run; malformed seed falls back to default', async (t) => {
  const { server, browser } = await withHarness(t);
  const seedAttr = async (query) => {
    await browser.navigate(server.url(`/index.html${query}`));
    assert.ok(await browser.poll('document.body.dataset.booted === "1"', { timeoutMs: 2000 }),
      `boot marker missing for ${query || 'default'}`);
    return browser.eval('document.body.dataset.seed');
  };
  assert.equal(await seedAttr('?seed=12345'), '12345');
  assert.equal(await seedAttr('?seed=12345'), '12345', 'same seed must reproduce the run');
  assert.equal(await seedAttr(''), '20260918', 'default seed must stay unchanged');
  assert.equal(await seedAttr('?seed=nope'), '20260918', 'malformed seed must fall back to default');
  assert.deepEqual(browser.errors, [], `page errors: ${browser.errors.join(' | ')}`);
});

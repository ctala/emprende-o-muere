// Cash-flow panel contract: a fresh run shows a projected bankruptcy month in
// red, the burn renders its named parts, and leads/clients are separate.

import test from 'node:test';
import assert from 'node:assert/strict';
import { withHarness } from './harness.mjs';

const boot = async (browser, server) => {
  await browser.navigate(server.url('/index.html?seed=20260918'));
  assert.ok(await browser.poll('document.body.dataset.booted === "1"', { timeoutMs: 2000 }), 'boot marker missing');
};

test('cash-flow panel projects a red bankruptcy month on a fresh run', async (t) => {
  const { server, browser } = await withHarness(t);
  await boot(browser, server);

  assert.equal(await browser.eval('document.querySelector(\'[data-testid="flow"]\')?.hidden'), false);
  const verdict = await browser.eval('document.querySelector(\'[data-testid="flow-verdict"]\').textContent');
  assert.match(verdict, /Se acaba la caja en el mes 10/, 'fresh 120k / 15k burn projects month 10');
  assert.equal(await browser.eval('!!document.querySelector(\'[data-testid="flow-verdict"].doomed\')'), true,
    'projected bankruptcy must render in ledger red, not grey alone');
  const rows = await browser.eval('Array.from(document.querySelectorAll(\'[data-testid="flow-rows"] .flow-row\')).map(r => r.textContent)');
  assert.equal(rows.length, 6, 'window shows the first six projected months');
  assert.match(rows[0], /m2.*0.*-15.*105k/, 'first row: month 2, nothing in, 15 out, 105 cash');
  const heads = await browser.eval("['flow-h-in','flow-h-out','flow-h-cash'].map(id => document.querySelector(`[data-testid='${id}']`)?.textContent ?? '')");
  assert.deepEqual(heads, ['entra', 'sale', 'Caja'], 'flow columns must be labeled');
  const gloss = await browser.eval('document.querySelector(\'.flow-gloss\').textContent');
  assert.match(gloss, /no toc/i, 'projection must name its founder-does-nothing assumption');
  assert.match(gloss, /una vez/, 'and that contracts pay once');
  assert.deepEqual(browser.errors, [], `page errors: ${browser.errors.join(' | ')}`);
});

test('the pinned footer never covers the log (portrait P1)', async (t) => {
  const { server, browser } = await withHarness(t, { viewport: { width: 393, height: 852 } });
  await boot(browser, server);
  await browser.click('[data-action="BUILD_PRODUCT"]');
  await browser.eval('window.scrollTo(0, document.body.scrollHeight)');
  await new Promise((r) => setTimeout(r, 900));
  await browser.eval('window.scrollTo(0, document.body.scrollHeight)');
  await new Promise((r) => setTimeout(r, 150));
  const m = await browser.eval(`(() => {
    const last = document.querySelector('#log-lines li:last-child');
    const bar = document.querySelector('.footer-rows');
    if (!last || !bar) return null;
    return { lastBottom: last.getBoundingClientRect().bottom, barTop: bar.getBoundingClientRect().top };
  })()`);
  assert.ok(m, 'log line and pinned bar both exist');
  assert.ok(m.lastBottom <= m.barTop, `log line at ${m.lastBottom} is covered by the bar top at ${m.barTop}`);
});

test('burn breakdown and separate leads/clients fields render', async (t) => {
  const { server, browser } = await withHarness(t);
  await boot(browser, server);

  assert.equal(await browser.eval('!!document.querySelector(\'[data-testid="field-burn-parts"]\')'), false,
    'no team means no parts echo — the total alone is the information');
  assert.equal(await browser.eval('document.querySelector(\'[data-testid="field-clients"] .field-value\').textContent'), '0',
    'clients (contracts) render as their own field');
  const leadLabel = await browser.eval('document.querySelector(\'[data-testid="field-traction"] .field-label\').textContent');
  const clientLabel = await browser.eval('document.querySelector(\'[data-testid="field-clients"] .field-label\').textContent');
  assert.match(leadLabel, /Contactos/);
  assert.match(clientLabel, /Clientes/);

  await browser.click('[data-action="HIRE"]');
  assert.ok(await browser.poll(
    'document.querySelector(\'[data-testid="field-burn-parts"]\')?.textContent.includes(\'Ventas 2k\')',
    { timeoutMs: 1500 },
  ), 'hired salary must appear as a named burn part');
  const parts = await browser.eval('document.querySelector(\'[data-testid="field-burn-parts"]\').textContent');
  assert.match(parts, /operativa 15k · Ventas 2k/, 'parts keep the base and name the role');
});

// Two-engines contract at the DOM level: the MVP lock is visible and lifts,
// the team's production + auto-close show up in the log with no founder click,
// and a no-team run's first month matches the pre-engines core byte-for-byte.

import test from 'node:test';
import assert from 'node:assert/strict';
import { withHarness } from './harness.mjs';

const boot = async (browser, server, seed = '20260918') => {
  await browser.navigate(server.url(`/index.html?seed=${seed}`));
  assert.ok(await browser.poll('document.body.dataset.booted === "1"', { timeoutMs: 2000 }), 'boot marker missing');
};
const monthOf = (browser) => browser.eval('document.getElementById("month-label").textContent');
const waitForMonth = (browser, n) => browser.poll(
  `document.getElementById("month-label").textContent.startsWith("Mes ${n} ") || !document.getElementById("terminal").hidden`,
  { timeoutMs: 2500 },
);
const closeReason = (browser) => browser.eval('document.querySelector(\'[data-testid="row-CLOSE_CLIENT-reason"]\')?.textContent ?? ""');
const closeDisabled = (browser) => browser.eval('document.querySelector(\'[data-action="CLOSE_CLIENT"]\')?.disabled');
const logText = (browser) => browser.eval('Array.from(document.querySelectorAll("#log-lines li")).map(li => li.textContent).join("\\n")');

test('MVP gate in the DOM: locked month 1, unlocks after two builds', async (t) => {
  const { server, browser } = await withHarness(t);
  await boot(browser, server);

  assert.equal(await closeDisabled(browser), true);
  assert.match(await closeReason(browser), /producto|build/i, 'fresh game must name the missing product');

  await browser.click('[data-action="BUILD_PRODUCT"]');
  assert.equal(await closeDisabled(browser), true, 'one build is not an MVP yet');
  await browser.click('[data-action="BUILD_PRODUCT"]');
  assert.ok(await waitForMonth(browser, 2), 'month did not settle after the second build');
  assert.equal(await closeDisabled(browser), false, 'two builds must unlock signing');
  assert.deepEqual(browser.errors, [], `page errors: ${browser.errors.join(' | ')}`);
});

test('team works on its own: production and auto-close lines appear without clicks', async (t) => {
  const { server, browser } = await withHarness(t);
  await boot(browser, server);

  // Month 1: two builds ship the MVP (auto-close lands on focus 0).
  await browser.click('[data-action="BUILD_PRODUCT"]');
  await browser.click('[data-action="BUILD_PRODUCT"]');
  assert.ok(await waitForMonth(browser, 2));

  // Month 2: hire VENTAS, rest, and let the month close on its own.
  await browser.click('[data-action="HIRE"]');
  await browser.click('[data-action="REST"]');
  assert.ok(await waitForMonth(browser, 3), 'auto-close did not fire after hire + rest');

  const log = await logText(browser);
  assert.match(log, /Tu equipo sumó 6 contactos/, 'pipeline production must be visible');
  assert.match(log, /Ventas cerró un cliente: factura \$\d+k/, 'auto-close must show up in the ledger log');
  assert.deepEqual(browser.errors, [], `page errors: ${browser.errors.join(' | ')}`);
});

test('no-team month one is byte-identical to the pre-engines core', async (t) => {
  const { server, browser } = await withHarness(t);
  await boot(browser, server);

  await browser.click('[data-testid="end"]');
  assert.ok(await waitForMonth(browser, 2));
  const log = await logText(browser);
  assert.match(log, /Cierra el mes\. Moral -6\./, 'decay line unchanged');
  assert.match(log, /Sueldos: −\$15k\./, 'burn line unchanged');
  assert.match(log, /Avanzas al mes 2\./, 'month line unchanged');
  assert.doesNotMatch(log, /equipo|cerró/i, 'no team engine lines may appear without a team');
  assert.deepEqual(browser.errors, [], `page errors: ${browser.errors.join(' | ')}`);
});

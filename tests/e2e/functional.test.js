// Functional layer: play through the DOM exactly like a player would and
// assert what the screen shows changes. No core internals, no pixels.

import test from 'node:test';
import assert from 'node:assert/strict';
import { withHarness } from './harness.mjs';

const boot = async (browser, server) => {
  await browser.navigate(server.url('/index.html?seed=20260918'));
  assert.ok(await browser.poll('document.body.dataset.booted === "1"', { timeoutMs: 2000 }), 'boot marker missing');
};
const fieldText = (browser, id) => browser.eval(`document.querySelector('[data-testid="field-${id}"] .field-value')?.textContent ?? ''`);
const monthText = (browser) => browser.eval('document.getElementById("month-label").textContent');

test('burned team (tier 0 morale): labor rows warn instead of silently yielding 0', async (t) => {
  const { server, browser } = await withHarness(t);
  await boot(browser, server);

  // Deterministic spiral with this seed: spam BUILD both actions per month;
  // auto-close advances the month. Morale < 34 is reached around month 3.
  let month = 1;
  for (let i = 0; i < 5; i += 1) {
    const morale = Number(await browser.eval('document.querySelector(\'[data-testid="field-morale"] .field-value\').textContent'));
    if (morale < 34) break;
    month += 1;
    await browser.click('[data-action="BUILD_PRODUCT"]');
    await browser.click('[data-action="BUILD_PRODUCT"]');
    const settled = await browser.poll(
      `document.getElementById("month-label").textContent.startsWith("Mes ${month} ") || !document.getElementById("terminal").hidden`,
      { timeoutMs: 2500 },
    );
    assert.ok(settled, `month did not settle to ${month}`);
  }
  const morale = Number(await browser.eval('document.querySelector(\'[data-testid="field-morale"] .field-value\').textContent'));
  assert.ok(morale < 34, `spiral did not reach burned morale (got ${morale})`);
  assert.match(await browser.eval('document.querySelector(\'[data-testid="row-BUILD_PRODUCT-warn"]\')?.textContent ?? ""'), /agotado/i,
    'labor row must carry the burned warning at tier 0');
  assert.equal(await browser.eval('!!document.querySelector(\'[data-testid="field-morale"] .field-value.alarm\')'), true,
    'morale field must alarm at tier 0');
  assert.equal(await browser.eval('!!document.querySelector(\'[data-testid="row-REST-warn"]\')'), false,
    'REST is the escape and must not warn');
  assert.deepEqual(browser.errors, [], `page errors: ${browser.errors.join(' | ')}`);
});

test('dom play: reasons, action click, manual close, hire raises burn', async (t) => {
  const { server, browser } = await withHarness(t);
  await boot(browser, server);

  // Disabled rows explain themselves from the very first render.
  assert.equal(await browser.eval('document.querySelector(\'[data-action="CLOSE_CLIENT"]\')?.disabled'), true);
  assert.match(await browser.eval('document.querySelector(\'[data-testid="row-CLOSE_CLIENT-reason"]\')?.textContent ?? ""'), /producto|build/i,
    'disabled CLOSE_CLIENT reason must point at the missing MVP first');
  assert.match(await browser.eval('document.querySelector(\'[data-testid="pitch-reason"]\')?.textContent ?? ""'), /mes/,
    'disabled PITCH reason must explain the gate');

  // An enabled action click changes a displayed stat.
  const descBefore = await browser.eval('document.querySelector(\'[data-testid="row-BUILD_PRODUCT"] .row-desc\').textContent');
  assert.match(descBefore, /Contactos \+\d+–\d+ · Moral −8/, 'labor card must show a yield range, never a bare +8');
  assert.equal(await fieldText(browser, 'traction'), '0');
  await browser.click('[data-action="BUILD_PRODUCT"]');
  assert.ok(await browser.poll('document.querySelector(\'[data-testid="field-traction"] .field-value\').textContent !== "0"', { timeoutMs: 1500 }),
    'traction did not change after clicking BUILD_PRODUCT');
  const gained = Number(await fieldText(browser, 'traction'));
  assert.ok(gained >= 5 && gained <= 11, `gain ${gained} must fall inside the advertised 5-11 range`);
  assert.equal(await monthText(browser), 'Mes 1 de 24', 'a single action must not close the month itself');

  // The footer button closes the month.
  await browser.click('[data-testid="end"]');
  assert.ok(await browser.poll('document.getElementById("month-label").textContent === "Mes 2 de 24"', { timeoutMs: 1500 }),
    'month label did not advance after clicking Cerrar mes');

  // A hire raises the effective burn shown on screen (15 -> 17 with VENTAS).
  // (Month 2 already charged 15 burn: cash 120 -> 105; sign-on 3 -> 102.)
  assert.equal(await fieldText(browser, 'burn'), '15k/mes');
  await browser.click('[data-action="HIRE"]');
  assert.ok(await browser.poll('document.querySelector(\'[data-testid="field-burn"] .field-value\').textContent === "17k/mes"', { timeoutMs: 1500 }),
    'burn did not rise after hiring VENTAS');
  assert.match(await fieldText(browser, 'cash'), /\$102k/, 'cash must drop by the sign-on');

  // The drained focus auto-closes the month so play continues.
  await browser.click('[data-action="REST"]');
  assert.ok(await browser.poll('document.getElementById("month-label").textContent === "Mes 3 de 24"', { timeoutMs: 2500 }),
    'auto-close did not fire after the month drained');
  assert.deepEqual(browser.errors, [], `page errors during play: ${browser.errors.join(' | ')}`);
});

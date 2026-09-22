// Incident reproducer: opening index.html via file:// shows a blank page
// because ES modules are CORS-blocked. The gate must DIAGNOSE this class
// (blank render + the blocking error), never pass it as a working game.

import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { withHarness } from './harness.mjs';

test('file:// load is diagnosed as unsupported, never mistaken for the game', async (t) => {
  const { browser } = await withHarness(t);
  await browser.navigate(pathToFileURL(`${import.meta.dirname}/../../index.html`).href);

  const rendered = await browser.poll('document.getElementById("hero-value")?.textContent.trim().length > 0', { timeoutMs: 1500 });
  if (rendered) return; // engine that allows module loads over file://: nothing to diagnose

  const booted = await browser.eval('document.body.dataset?.booted');
  assert.equal(booted, undefined, 'page claims to have booted over file:// — boot marker lies');
  assert.ok(
    browser.errors.some((e) => /blocked|CORS|Failed to load module|net::ERR/i.test(e)),
    `blank page with no diagnostic error (unexpected): ${browser.errors.join(' | ')}`,
  );
});

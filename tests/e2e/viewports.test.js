// Standing visual contract: the three reference viewports render with zero
// errors and zero external requests, and the terminal share metadata is set.
// Screenshots land in playtest/shots/ for the human review pass (round-1
// needs-human list is the checklist).

import test from 'node:test';
import assert from 'node:assert/strict';
import { withHarness } from './harness.mjs';

const VIEWPORTS = [
  { name: 'portrait-phone', width: 390, height: 844 },
  { name: 'landscape-phone', width: 844, height: 390 },
  { name: 'desktop', width: 1024, height: 768 },
];

test('head declares shareable terminal metadata (og:image inline)', async (t) => {
  const { server, browser } = await withHarness(t);
  await browser.navigate(server.url('/index.html'));
  await browser.poll('document.body.dataset.booted === "1"', { timeoutMs: 2000 });
  const meta = await browser.eval(`(() => {
    const get = (q) => document.head.querySelector(q)?.getAttribute('content') ?? '';
    return JSON.stringify({ title: get('[property="og:title"]'), image: get('[property="og:image"]'), desc: get('[property="og:description"]'), std: get('meta[name="description"]') });
  })()`);
  const { title, image, desc, std } = JSON.parse(meta);
  assert.match(title, /Emprende o Muere/);
  assert.ok(desc.length > 20 && std.length > 20, 'description/og:description missing');
  assert.ok(image.startsWith('data:image/svg+xml'), `og:image must be an inline data: URI, got ${image.slice(0, 24)}`);
});

test('three reference viewports render clean with no external requests', async (t) => {
  const { startServer } = await import('./server.mjs');
  const server = await startServer();
  t.after(() => server.stop());
  for (const vp of VIEWPORTS) {
    const { launchBrowser } = await import('./browser.mjs');
    const browser = await launchBrowser({ width: vp.width, height: vp.height });
    try {
      await browser.navigate(server.url('/index.html'));
      assert.ok(await browser.poll('document.body.dataset.booted === "1"', { timeoutMs: 3000 }), `${vp.name}: no boot`);
      assert.equal(await browser.eval('!!document.querySelector("canvas")'), false, `${vp.name}: canvas must be gone`);
      assert.deepEqual(browser.errors, [], `${vp.name}: page errors ${browser.errors.join(' | ')}`);
      const external = await browser.eval(`(() => {
        const origin = location.origin;
        return performance.getEntriesByType('resource')
          .map((e) => e.name)
          .filter((n) => !n.startsWith(origin + '/') && !n.startsWith('data:') && !n.startsWith('blob:'));
      })()`);
      assert.deepEqual(external, [], `${vp.name}: page reached outside the local server: ${external.join(', ')}`);
      await browser.screenshotPath(`playtest/shots/viewport-${vp.name}.png`);
    } finally {
      await browser.close();
    }
  }
});

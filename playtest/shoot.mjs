// Screenshot rig: 3 game states x 3 viewports -> playtest/shots/.
// DOM-shell version: clicks go through data-testids, never pixel regions.
// Usage: node playtest/shoot.mjs [url]   (default: http://localhost:8765/index.html)
import { withHarness } from '../tests/e2e/harness.mjs';

const BASE = process.argv[2] ?? 'http://localhost:8765/index.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VIEWPORTS = [
  { id: 'portrait', width: 393, height: 852 },
  { id: 'landscape', width: 852, height: 393 },
  { id: 'desktop', width: 1000, height: 620 },
];

for (const vp of VIEWPORTS) {
  const cleanups = [];
  const t = { after: (fn) => cleanups.push(fn) };
  const { server, browser } = await withHarness(t, { viewport: { width: vp.width, height: vp.height } });
  try {
    const load = async () => {
      await browser.navigate(BASE);
      await browser.poll('document.body.dataset.booted === "1"', { timeoutMs: 3000 });
      await browser.eval('window.localStorage.clear()');
      // reload after clear: the learning observer reads storage at boot, a
      // single navigate would keep the previous session's unlocks in memory
      await browser.navigate(BASE);
      await browser.poll('document.body.dataset.booted === "1"', { timeoutMs: 3000 });
    };
    const shot = (state) => browser.screenshotPath(`playtest/shots/${state}_${vp.id}.png`);

    await load();
    await shot('fresh');
    await browser.click('[data-testid="help"]');
    await sleep(250);
    await shot('help');

    // virgin reload so gameover shows without the help-seen flag
    await load();
    for (let m = 0; m < 9; m += 1) {
      if (await browser.eval('!document.getElementById("terminal").hidden')) break;
      await browser.click('[data-testid="end"]');
      await browser.poll(
        `!document.getElementById("terminal").hidden || document.getElementById("month-label").textContent.startsWith("Mes ${m + 2} ")`,
        { timeoutMs: 2000 },
      );
    }
    await browser.eval('document.getElementById("share-post").scrollIntoView({ block: "center" })');
    await sleep(300);
    await shot('gameover');

    // survived terminal (green seal): harvest-nohire driver mirrored from
    // scripts/sweep.mjs -- the sweep pins that this policy survives 16/16.
    await load();
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
      if (++guard > 120) throw new Error('harvest driver did not reach a terminal');
      const s = await snap();
      if (s.focus === 0) await browser.click('[data-testid="end"]');
      else if (s.canClose && s.cash < 80) await browser.click('[data-action="CLOSE_CLIENT"]');
      else if (s.morale < 40) await browser.click('[data-action="REST"]');
      else if (s.focus === 2) await browser.click('[data-action="BUILD_PRODUCT"]');
      else await browser.click('[data-action="REST"]');
      await settled(s);
    }
    await sleep(300);
    await shot('survived');
    console.log(`${vp.id}: fresh/help/gameover done (errors=${browser.errors.length})`);
  } finally {
    for (const fn of cleanups) await fn();
    void server;
  }
}

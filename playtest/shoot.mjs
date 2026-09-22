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
    await sleep(300);
    await shot('gameover');
    console.log(`${vp.id}: fresh/help/gameover done (errors=${browser.errors.length})`);
  } finally {
    for (const fn of cleanups) await fn();
    void server;
  }
}

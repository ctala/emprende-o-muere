// Minimal browser harness: raw CDP over the stdlib WebSocket (Node 22+).
// No dependencies; spawns the cached headless shell, connects, and collects
// page errors so any uncaught exception / console error fails the caller.

import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const PLAYWRIGHT_CACHE = `${process.env.HOME}/.cache/ms-playwright`;

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const shells = readdirSync(PLAYWRIGHT_CACHE)
    .filter((d) => d.startsWith('chromium_headless_shell-'))
    .sort((a, b) => Number(b.split('-').pop()) - Number(a.split('-').pop()));
  if (shells.length === 0) return null;
  const dir = `${PLAYWRIGHT_CACHE}/${shells[0]}`;
  const inner = readdirSync(dir).find((d) => d.startsWith('chrome-headless-shell'));
  return inner ? `${dir}/${inner}/chrome-headless-shell` : null;
}

export async function launchBrowser({ width = 390, height = 844 } = {}) {
  const exe = findChrome();
  if (!exe) throw new Error('no browser found: set CHROME env or install a chromium_headless_shell');
  const port = 9400 + Math.floor(Math.random() * 400);
  const proc = spawn(exe, [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--remote-debugging-port=${port}`,
    'about:blank',
  ], { stdio: 'ignore' });

  let list;
  for (let i = 0; i < 50; i += 1) {
    try {
      list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      if (list.some((t) => t.type === 'page')) break;
    } catch { /* not up yet */ }
    await sleep(100);
  }
  const page = list?.find((t) => t.type === 'page');
  if (!page) {
    proc.kill();
    throw new Error('headless shell did not expose a page target');
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let nextId = 0;
  const pending = new Map();
  const errors = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      errors.push(d.exception?.description ?? d.text ?? 'uncaught exception');
    } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      errors.push(msg.params.entry.text);
    }
  };
  const cdp = (method, params = {}) => new Promise((res) => {
    const id = ++nextId;
    pending.set(id, res);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await cdp('Runtime.enable');
  await cdp('Page.enable');
  await cdp('Log.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });

  return {
    errors,
    port,
    async navigate(url) {
      await cdp('Page.navigate', { url });
    },
    async eval(expression) {
      const r = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(`page eval threw: ${r.exceptionDetails.text}`);
      return r.result?.result?.value;
    },
    /** Poll a page-side predicate (expression returning bool) until true or deadline. */
    async poll(expression, { timeoutMs = 2000, intervalMs = 50 } = {}) {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        if (await this.eval(`!!(${expression})`)) return true;
        await sleep(intervalMs);
      }
      return false;
    },
    async keyboard(key) {
      await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key });
      await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key });
    },
    async click(selector) {
      const ok = await this.eval(`(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el || el.disabled || el.hidden) return false;
        el.click();
        return true;
      })()`);
      if (!ok) throw new Error(`click target unavailable: ${selector}`);
    },
    async screenshotPath(file) {
      const r = await cdp('Page.captureScreenshot', { format: 'png' });
      const { writeFileSync } = await import('node:fs');
      writeFileSync(file, Buffer.from(r.result.data, 'base64'));
    },
    async close() {
      try { ws.close(); } catch { /* already closed */ }
      proc.kill();
      await Promise.race([
        new Promise((res) => proc.on('exit', res)),
        sleep(1500).then(() => { proc.kill('SIGKILL'); }),
      ]);
    },
  };
}

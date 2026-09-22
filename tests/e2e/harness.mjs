// Shared harness lifecycle for one e2e test file: server + browser, torn down once.

/** @param {import('node:test').TestContext} t */
export async function withHarness(t, options = {}) {
  const { startServer } = await import('./server.mjs');
  const { launchBrowser } = await import('./browser.mjs');
  const server = await startServer();
  let browser = null;
  try {
    browser = await launchBrowser(options.viewport);
  } catch (err) {
    await server.stop();
    throw new Error(`e2e gate cannot run: ${err.message}`);
  }
  t.after(async () => {
    await browser.close();
    await server.stop();
  });
  return { server, browser };
}

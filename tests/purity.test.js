import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CORE_DIR = fileURLToPath(new URL('../core', import.meta.url));

test('core modules load headless in plain node', async () => {
  for (const file of readdirSync(CORE_DIR)) {
    await import(new URL(`../core/${file}`, import.meta.url).href);
  }
});

test('core sources never reference DOM globals, clock, or Math.random', () => {
  const forbidden = [
    /\bwindow\b/,
    /\bdocument\b/,
    /\bDate\b/,
    /Math\.random/,
    /\bfetch\b/,
    /\blocalStorage\b/,
  ];
  for (const file of readdirSync(CORE_DIR)) {
    const source = readFileSync(`${CORE_DIR}/${file}`, 'utf8');
    for (const pattern of forbidden) {
      assert.ok(
        !pattern.test(source),
        `${file} must not reference ${pattern} (found: ${source.match(pattern)?.[0]})`,
      );
    }
  }
});

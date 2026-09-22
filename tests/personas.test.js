import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Synthetic playtest panel: personas are data; this test is the drift guard
// for the spread constraints the research protocol depends on.

const PERSONAS_DIR = 'playtest/personas';

const loadAll = () => {
  const files = readdirSync(PERSONAS_DIR).filter((f) => f.endsWith('.json')).sort();
  return files.map((f) => ({ id: f.replace(/\.json$/, ''), ...JSON.parse(readFileSync(join(PERSONAS_DIR, f), 'utf8')) }));
};

const REQUIRED = ['name', 'age', 'residence', 'occupation', 'tech_comfort', 'gaming', 'personality', 'preferences', 'beliefs'];

test('exactly 5 persona specs exist', () => {
  const all = loadAll();
  assert.equal(all.length, 5);
});

test('every persona carries the full spec', () => {
  for (const p of loadAll()) {
    assert.equal(p.type, 'TinyPerson', p.id);
    for (const field of REQUIRED) {
      assert.ok(p.persona[field] !== undefined, `${p.id}: missing ${field}`);
    }
    assert.ok(Array.isArray(p.persona.personality.traits) && p.persona.personality.traits.length >= 2, `${p.id}: 2+ traits`);
    assert.ok(Array.isArray(p.persona.preferences.interests) && p.persona.preferences.interests.length >= 2, `${p.id}: 2+ interests`);
  }
});

test('panel spread: non-gamer, jargon-native, three age decades', () => {
  const all = loadAll();
  const gamers = all.filter((p) => p.persona.gaming.includes('gamer') && !p.persona.gaming.includes('No gamer') && !p.persona.gaming.includes('Nada gamer') && !p.persona.gaming.includes('Cero gamer'));
  const nonGamers = all.filter((p) => /No gamer|Nada gamer|Cero gamer/.test(p.persona.gaming));
  assert.ok(nonGamers.length >= 1, 'at least one non-gamer');
  const jargon = all.filter((p) => /burn|runway|term sheet|diluci/i.test(JSON.stringify(p.persona)));
  assert.ok(jargon.length >= 1, 'at least one jargon-native');
  const decades = new Set(all.map((p) => Math.floor(p.persona.age / 10)));
  assert.ok(decades.size >= 3, `ages must span >= 3 decades, got ${decades.size}`);
  void gamers;
});

test('shim: no hardcoded secret, loopback bind, loud exit without key', () => {
  const src = readFileSync('playtest/shim.py', 'utf8');
  assert.ok(!/sk-[A-Za-z0-9]/.test(src), 'no committed secrets');
  assert.ok(src.includes('127.0.0.1'), 'loopback only');
  const env = { PATH: '/usr/bin:/bin', HOME: '/nonexistent-shim-test' };
  for (const k of ['LITELLM_MASTER_KEY', 'SHIM_UPSTREAM_KEY', 'DASHSCOPE_API_KEY']) delete env[k];
  const py = process.platform === 'linux' ? '/usr/bin/python3' : 'python3';
  const run = spawnSync(py, ['playtest/shim.py'], { env, encoding: 'utf8', timeout: 15000 });
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /LITELLM_MASTER_KEY/);
});

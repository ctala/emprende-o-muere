import test from 'node:test';
import assert from 'node:assert/strict';
import { getString, hasString, getHelpSections } from '../content/strings_es.js';

// The help legend is the contract against copy drift: if a HUD label or an
// action name changes and the legend is not updated, these tests go red.

const HUD_LABEL_KEYS = [
  'hud.focus', 'hud.traction', 'hud.morale', 'hud.cash',
  'hud.runway', 'hud.team', 'hud.energy', 'hud.founder', 'hud.clients',
];
const ACTION_LABEL_KEYS = [
  'action.BUILD_PRODUCT', 'action.TALK_TO_CUSTOMERS', 'action.PUBLISH_CONTENT',
  'action.REST', 'action.CLOSE_CLIENT', 'action.HIRE', 'action.PITCH',
  'action.END_MONTH',
];
const TERM_GLOSS_KEYS = ['hud.runway', 'hud.energy']; // Runway/Burn/Pre live here too

const joined = () => Object.values(getHelpSections()).flat().join('\n');

test('help sections are non-empty', () => {
  const sections = getHelpSections();
  for (const key of ['metrics', 'actions', 'rules']) {
    assert.ok(Array.isArray(sections[key]) && sections[key].length > 0, key);
  }
});

test('every HUD label appears in the help text', () => {
  const text = joined();
  for (const key of HUD_LABEL_KEYS) {
    assert.ok(text.includes(getString(key)), `${key} (${getString(key)}) missing from help`);
  }
});

test('every action name appears in the help text', () => {
  const lines = getHelpSections().actions;
  for (const key of ACTION_LABEL_KEYS) {
    const label = getString(key).split(' {')[0];
    const word = label.split(' ')[0];
    const line = lines.find((l) => l.split(/[: ]/)[0] === word);
    assert.ok(line, `${key} (${label}) missing from help`);
    const labelWords = new Set(label.split(' '));
    const prefixWords = line.split(':')[0].split(' ');
    for (const word of prefixWords) {
      assert.ok(labelWords.has(word), `${key}: "${word}" not in label "${label}"`);
    }
  }
});

test('venture jargon terms carry a plain-Spanish gloss', () => {
  const text = joined();
  assert.match(text, /Runway: meses de vida/);
  assert.match(text, /Burn: gasto mensual/);
  assert.match(text, /Pre\s*=\s*valor/);
});

test('all HUD label keys still resolve', () => {
  for (const key of [...HUD_LABEL_KEYS, ...ACTION_LABEL_KEYS, ...TERM_GLOSS_KEYS]) {
    assert.ok(hasString(key), key);
  }
});

test('content budget: sections fit the three-column panel', () => {
  const sections = getHelpSections();
  for (const [key, lines] of Object.entries(sections)) {
    assert.ok(lines.length <= 9, `${key}: ${lines.length} lines exceeds panel rows`);
    for (const line of lines) {
      assert.ok(line.length <= 46, `${key}: line too long (${line.length}): ${line}`);
    }
  }
});

import { HELP_SEEN_KEY, loadHelpSeen, saveHelpSeen, shouldShowHint } from '../ui/help.js';

const fakeAdapter = (initial = {}) => {
  const store = { ...initial };
  return {
    store,
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = v; },
  };
};

test('help-seen flag round-trips', () => {
  const a = fakeAdapter();
  assert.equal(loadHelpSeen(a), false);
  saveHelpSeen(a);
  assert.equal(a.store[HELP_SEEN_KEY], 'true');
  assert.equal(loadHelpSeen(a), true);
});

test('corrupt help-seen payload reads as unseen', () => {
  const a = fakeAdapter({ [HELP_SEEN_KEY]: 'maybe' });
  assert.equal(loadHelpSeen(a), false);
});

test('hint shows only with zero learnings and help unseen', () => {
  assert.equal(shouldShowHint([], false), true);
  assert.equal(shouldShowHint([], true), false);
  assert.equal(shouldShowHint(['first_bankrupt'], false), false);
  assert.equal(shouldShowHint(['first_bankrupt'], true), false);
});

test('cash-flow panel keys resolve and name the projection honestly', () => {
  const gloss = getString('ui.flow.gloss');
  assert.match(gloss, /no toc/);
  assert.match(gloss, /una vez/);
  for (const key of ['ui.flow.title', 'ui.flow.in', 'ui.flow.out',
    'ui.flow.rate.leads', 'ui.flow.rate.cash', 'ui.flow.bankrupt', 'ui.flow.survived']) {
    assert.ok(hasString(key), key);
  }
});

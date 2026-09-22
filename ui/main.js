// UI entry point: owns state, input routing, and the game loop. The visual
// world lives in ui/view.js + styles.css (one-directional ui -> core).

import { createGame } from '../core/state.js';
import {
  applyAction,
  EVENT_KEYS,
  ACTION_END_MONTH,
  ACTION_HIRE,
  ACTION_PITCH,
  ACTION_ACCEPT_ROUND,
  ACTION_DECLINE_ROUND,
  ACTION_COUNTER_ROUND,
  VERTICALS,
  ACTIVE_VERTICAL,
  ROLES,
  HIRE_ORDER,
  burnFor,
  perksFor,
  PITCH_ENERGY_COST,
  PITCH_ENERGY_GATE,
  PITCH_MIN_MONTH,
  COUNTER_ENERGY_COST,
} from '../core/game.js';
import { render, renderLabel } from './renderer.js';
import { LEARNING_IDS, createObserver, matchLearnings, loadUnlocked, saveUnlocked } from './learnings.js';
import { getString, getHelpSections } from '../content/strings_es.js';
import { shouldShowHint, loadHelpSeen, saveHelpSeen } from './help.js';
import { buildModel, renderView } from './view.js';

const DEFAULT_SEED = 20260918;
const seedRaw = new URLSearchParams(window.location.search).get('seed');
const seedParam = seedRaw === null ? Number.NaN : Number(seedRaw);
const SEED = Number.isInteger(seedParam) && seedParam >= 0 ? seedParam : DEFAULT_SEED;
const AUTO_CLOSE_DELAY_MS = 600;
const V = VERTICALS[ACTIVE_VERTICAL];
const ROW_ORDER = ['BUILD_PRODUCT', 'TALK_TO_CUSTOMERS', 'PUBLISH_CONTENT', 'REST', 'CLOSE_CLIENT', ACTION_HIRE];

/** @type {Readonly<object>} */
let state = createGame(SEED);
function restartRun() {
  clearClosing();
  state = createGame(SEED);
  log = [];
  settlement = null;
  lastLearn = null;
  libraryOpen = false;
  helpOpen = false;
  draw();
}
/** @type {string[]} */
let log = [];
/** @type {Readonly<object> | null} */
let settlement = null;
let lastLearn = null;
let libraryOpen = false;
let helpOpen = false;
const storageAdapter = {
  getItem: (k) => { try { return window.localStorage.getItem(k); } catch { return null; } },
  setItem: (k, v) => { window.localStorage.setItem(k, v); },
};
let learningObserver = createObserver(loadUnlocked(storageAdapter));
let helpSeen = loadHelpSeen(storageAdapter);

function observeEvents(events) {
  const result = matchLearnings(events, learningObserver);
  learningObserver = result.observer;
  if (result.newIds.length > 0) {
    saveUnlocked(storageAdapter, learningObserver.unlocked);
    lastLearn = result.newIds[result.newIds.length - 1];
    log = [...log, ...result.newIds.map((id) => `Aprendiste: ${renderLabel(`learning.${id}`)}`)];
  }
}

/** @type {ReturnType<typeof setTimeout> | null} */
let closingTimer = null;
let inputLocked = false;

const OFFER_ACTIONS = new Set([ACTION_ACCEPT_ROUND, ACTION_DECLINE_ROUND, ACTION_COUNTER_ROUND]);

function clearClosing() {
  if (closingTimer !== null) {
    clearTimeout(closingTimer);
    closingTimer = null;
  }
  inputLocked = false;
}

function captureSettlement(events) {
  for (const e of events) {
    if (e.key === EVENT_KEYS.RUN_ENDED && e.params.reason === 'survived') settlement = e.params;
  }
}

function nextRole() {
  return HIRE_ORDER.find((r) => !state.team.includes(r)) ?? null;
}

function afford(action) {
  if (state.gameOver || inputLocked) return false;
  if (OFFER_ACTIONS.has(action)) {
    if (state.offer === null) return false;
    if (action === ACTION_COUNTER_ROUND) {
      return !state.offer.countered && state.founderEnergy >= COUNTER_ENERGY_COST;
    }
    return true;
  }
  if (state.offer !== null) return false;
  if (state.focus <= 0) return false;
  if (action === ACTION_HIRE) {
    const role = nextRole();
    return role !== null && state.cashK >= ROLES[role].signOnK;
  }
  if (action === 'CLOSE_CLIENT') {
    return state.traction >= perksFor(state.team, V).closeCost;
  }
  if (action === ACTION_PITCH) {
    return state.month >= PITCH_MIN_MONTH
      && state.pitchCooldown === 0
      && state.founderEnergy >= PITCH_ENERGY_GATE
      && state.offer === null;
  }
  return true;
}

/** Why an afford-able action is disabled, in plain Spanish (or null). */
function reason(action) {
  if (state.gameOver || inputLocked || (state.offer !== null && !OFFER_ACTIONS.has(action))) return null;
  if (state.focus <= 0 && action !== 'LIBRARY' && action !== 'HELP') return renderLabel('reason.focus');
  if (action === ACTION_HIRE) {
    const role = nextRole();
    if (role === null) return null; // label already says "Equipo completo"
    const missing = ROLES[role].signOnK - state.cashK;
    if (missing > 0) return renderLabel('reason.HIRE', { missing });
    return null;
  }
  if (action === 'CLOSE_CLIENT') {
    return renderLabel('reason.CLOSE_CLIENT', { cost: perksFor(state.team, V).closeCost });
  }
  if (action === ACTION_PITCH) {
    if (state.month < PITCH_MIN_MONTH) return renderLabel('reason.PITCH_month', { month: PITCH_MIN_MONTH });
    if (state.pitchCooldown > 0) return renderLabel('reason.PITCH_cooldown', { months: state.pitchCooldown });
    if (state.founderEnergy < PITCH_ENERGY_GATE) return renderLabel('reason.PITCH_energy', { gate: PITCH_ENERGY_GATE });
  }
  return null;
}

function dispatch(action) {
  if (!afford(action.type)) return;
  if (action.type === ACTION_END_MONTH) clearClosing();
  const result = applyAction(state, action);
  state = result.state;
  captureSettlement(result.events);
  log = [...log, ...result.events.map(render)];
  observeEvents(result.events);
  draw();
  if (!state.gameOver && state.focus === 0 && state.offer === null && action.type !== ACTION_END_MONTH) {
    scheduleAutoClose();
  }
}

function scheduleAutoClose() {
  inputLocked = true;
  draw();
  closingTimer = setTimeout(() => {
    closingTimer = null;
    inputLocked = false;
    const result = applyAction(state, { type: ACTION_END_MONTH });
    state = result.state;
    captureSettlement(result.events);
    log = [...log, ...result.events.map(render)];
    observeEvents(result.events);
    draw();
  }, AUTO_CLOSE_DELAY_MS);
}

function draw() {
  const perks = perksFor(state.team, V);
  const model = buildModel(state, {
    v: V,
    burn: burnFor(state.team, V),
    perks,
    closeCost: perks.closeCost,
    delayMonths: perks.delayMonths,
    nextRole: nextRole(),
    closing: inputLocked,
    settlement,
    lastLearn: lastLearn ?? learningObserver.unlocked.at(-1) ?? null,
    afford,
    reason,
    rowOrder: ROW_ORDER,
    pitchMinMonth: PITCH_MIN_MONTH,
    pitchCost: PITCH_ENERGY_COST,
    counterCost: COUNTER_ENERGY_COST,
    log,
  });
  renderView(model);
  document.getElementById('hint').hidden = libraryOpen || helpOpen
    || state.offer !== null || state.gameOver
    || !shouldShowHint(learningObserver.unlocked, helpSeen);
  drawModals();
}

function drawModals() {
  const help = document.getElementById('help-modal');
  const library = document.getElementById('library-modal');
  help.hidden = !helpOpen;
  library.hidden = !libraryOpen;
  document.getElementById('help-btn').setAttribute('aria-pressed', String(helpOpen));
  document.getElementById('library-btn').setAttribute('aria-pressed', String(libraryOpen));
  if (helpOpen) {
    setText('help-title', renderLabel('ui.help.title'));
    const grid = document.getElementById('help-grid');
    if (!grid.childElementCount) {
      const sections = getHelpSections();
      for (const [key, lines] of Object.entries({
        'ui.help.col.metrics': sections.metrics,
        'ui.help.col.actions': sections.actions,
        'ui.help.col.rules': sections.rules,
      })) {
        const col = document.createElement('div');
        col.className = 'help-col';
        const h = document.createElement('h3');
        h.textContent = renderLabel(key);
        const ul = document.createElement('ul');
        lines.forEach((line) => {
          const li = document.createElement('li');
          li.className = 'mono';
          li.textContent = line;
          ul.append(li);
        });
        col.append(h, ul);
        grid.append(col);
      }
    }
  }
  if (libraryOpen) {
    setText('library-title', renderLabel('ui.library.title'));
    const list = document.getElementById('library-list');
    list.textContent = '';
    LEARNING_IDS.forEach((id) => {
      const li = document.createElement('li');
      const discovered = learningObserver.unlocked.includes(id);
      li.className = discovered ? '' : 'undiscovered';
      li.textContent = discovered ? renderLabel(`learning.${id}`) : renderLabel('ui.library.unknown');
      list.append(li);
    });
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function toggleModals(next) {
  if (next === 'help') {
    helpOpen = !helpOpen;
    if (helpOpen) {
      libraryOpen = false;
      if (!helpSeen) {
        saveHelpSeen(storageAdapter);
        helpSeen = true;
      }
    }
  } else {
    libraryOpen = !libraryOpen;
    if (libraryOpen) helpOpen = false;
  }
}

function wire() {
  setText('ui-title', getString('ui.title'));
  setText('ui-subtitle', getString('ui.subtitle'));
  setText('library-btn', getString('ui.library.button'));
  setText('hint', getString('ui.help.hint'));
  setCloseLabels();
  setText('restart-btn', getString('ui.restart'));

  document.getElementById('help-btn').addEventListener('click', () => {
    if (state.offer === null) toggleModals('help');
    draw();
    if (helpOpen) document.querySelector('#help-modal .modal-close')?.focus();
  });
  document.getElementById('library-btn').addEventListener('click', () => {
    if (state.offer === null) toggleModals('library');
    draw();
    if (libraryOpen) document.querySelector('#library-modal .modal-close')?.focus();
  });

  document.getElementById('action-list').addEventListener('click', (ev) => {
    const btn = ev.target.closest('button[data-action]');
    if (btn && !btn.disabled) {
      dispatch(btn.dataset.action === ACTION_HIRE
        ? { type: ACTION_HIRE, role: nextRole() }
        : { type: btn.dataset.action });
    }
  });
  document.getElementById('end-btn').addEventListener('click', () => dispatch({ type: ACTION_END_MONTH }));
  document.getElementById('pitch-btn').addEventListener('click', () => dispatch({ type: ACTION_PITCH }));

  document.getElementById('accept-btn').addEventListener('click', () => dispatch({ type: ACTION_ACCEPT_ROUND }));
  document.getElementById('counter-btn').addEventListener('click', () => dispatch({ type: ACTION_COUNTER_ROUND }));
  document.getElementById('decline-btn').addEventListener('click', () => dispatch({ type: ACTION_DECLINE_ROUND }));

  document.getElementById('restart-btn').addEventListener('click', restartRun);

  for (const [id, kind] of [['help-modal', 'help'], ['library-modal', 'library']]) {
    const modal = document.getElementById(id);
    modal.addEventListener('click', (ev) => {
      if (ev.target === modal || ev.target.closest('[data-testid="close"]')) toggleModals(kind);
      draw();
    });
  }
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && (helpOpen || libraryOpen)) {
      toggleModals(helpOpen ? 'help' : 'library');
      draw();
    }
  });
}

function setCloseLabels() {
  document.querySelectorAll('.modal-close').forEach((btn) => {
    btn.textContent = getString('ui.close');
  });
}

wire();
draw();
document.body.dataset.seed = String(SEED);
document.body.dataset.booted = '1';

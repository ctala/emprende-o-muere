// DOM view for the ledger shell. Two layers:
//  - buildModel(state, ctx): PURE core-state -> plain data (Node-testable)
//  - renderView(model): fills the fixed DOM skeleton in index.html
// Every string comes from content/strings_es.js; every number from core.

import {
  ACTION_END_MONTH,
  ACTION_HIRE,
  ROLES,
  HIRE_ORDER,
  burnFor,
  burnParts,
  activeClients,
  forecastOf,
  perksFor,
  moraleTier,
  FOCUS_PER_MONTH,
  ENERGY_MAX,
  LABOR_JITTER,
  dealPriceK,
  FUND_PRE_BASE,
  FUND_PRE_PER_TRACTION,
  EXIT_SLOPE_K,
  END_MONTH_DECAY,
  END_MONTH_DECAY_JITTER,
} from '../core/game.js';
import { renderLabel } from './renderer.js';

export const ACTION_IDS = Object.freeze([
  'BUILD_PRODUCT',
  'TALK_TO_CUSTOMERS',
  'PUBLISH_CONTENT',
  'REST',
  'CLOSE_CLIENT',
  ACTION_HIRE,
]);

const LABOR_IDS = new Set(['BUILD_PRODUCT', 'TALK_TO_CUSTOMERS', 'PUBLISH_CONTENT']);

function laborDesc(id, perks, morale) {
  const tier = moraleTier(morale);
  const moraleCost = id === 'BUILD_PRODUCT' ? perks.buildMoraleCost
    : id === 'TALK_TO_CUSTOMERS' ? perks.talkMoraleCost : 3;
  if (tier === 0) return renderLabel('action.BURNED.desc', { moraleCost });
  const base = id === 'BUILD_PRODUCT' ? perks.buildBase
    : id === 'TALK_TO_CUSTOMERS' ? perks.talkBase : 4;
  let lo = base - LABOR_JITTER;
  let hi = base + LABOR_JITTER;
  if (tier === 1) {
    lo = Math.trunc(lo / 2);
    hi = Math.trunc(hi / 2);
  }
  return renderLabel('action.LABOR.desc', {
    range: `${lo}–${hi}`,
    moraleCost,
    lowTag: tier === 1 ? ` ${renderLabel('action.LABOR.low')}` : '',
  });
}

function hirePerkText(nextRole, team, v) {
  const now = perksFor(team, v);
  const withRole = perksFor([...team, nextRole], v);
  const diff = {
    VENTAS: ['closeCost', now.closeCost, withRole.closeCost],
    CTO: ['buildBase', now.buildBase, withRole.buildBase],
    CFO: ['delayMonths', now.delayMonths, withRole.delayMonths],
    CPO: ['talkBase', now.talkBase, withRole.talkBase],
  }[nextRole];
  if (!diff || diff[1] === diff[2]) return '';
  return renderLabel(`action.HIRE.perk.${nextRole}`, {
    from: diff[1],
    to: diff[2],
    pipeline: ROLES[nextRole].pipeline ?? 0,
  });
}

const pct = (bps) => Math.trunc(bps / 100);

/**
 * Build the view model from state + wiring context.
 * ctx: { v, burn, closeCost, delayMonths, nextRole, closing,
 *        settlement, lastLearn, afford(action)->bool, reason(action)->string|null,
 *        unlockedIds }
 */
export function buildModel(state, ctx) {
  const burn = ctx.burn;
  const runway = Math.max(0, Math.floor(state.cashK / burn));
  const alarm = runway <= 2;
  const team = state.team.map((r) => renderLabel(`role.${r}`)).join(', ');
  const fields = [];
  fields.push({ id: 'cash', label: renderLabel('hud.cash'), value: `$${state.cashK}k`, alarm: state.cashK <= burn });
  const parts = burnParts(state);
  fields.push({
    id: 'burn', label: renderLabel('hud.burn'), value: `${burn}k/${renderLabel('hud.burn.period')}`,
    parts: parts.length > 1
      ? parts.map((p) => ({ label: p.role ? renderLabel(`role.${p.role}`) : renderLabel('hud.burn.base'), amountK: p.amountK }))
      : null,
  });
  fields.push({
    id: 'traction', label: renderLabel('hud.traction'), value: String(state.traction),
    gloss: renderLabel('hud.traction.gloss'),
  });
  fields.push({
    id: 'clients', label: renderLabel('hud.clients'), value: String(activeClients(state)),
    gloss: renderLabel('hud.clients.gloss'),
  });
  const moraleBurned = moraleTier(state.teamMorale) === 0;
  fields.push({
    id: 'morale', label: renderLabel('hud.morale'), value: String(state.teamMorale),
    alarm: moraleBurned,
    bar: { pct: state.teamMorale, colorTier: moraleTier(state.teamMorale) },
  });
  fields.push({
    id: 'focus', label: renderLabel('hud.focus'),
    value: `${state.focus}/${FOCUS_PER_MONTH}`, alarm: state.focus === 0,
  });
  if (state.founderPctBps < 10000) {
    fields.push({
      id: 'founder', label: renderLabel('hud.founder'), value: `${pct(state.founderPctBps)}%`,
      alarm: state.founderPctBps < 5000,
    });
  }
  fields.push({
    id: 'energy', label: renderLabel('hud.energy'),
    value: String(state.founderEnergy),
    gloss: renderLabel('hud.energy.gloss'),
    bar: { pct: Math.round((state.founderEnergy * 100) / ENERGY_MAX), energy: state.founderEnergy },
  });
  if (team) fields.push({ id: 'team', label: renderLabel('hud.team'), value: team });

  const rows = ctx.rowOrder.map((id) => {
    const warn = !ctx.afford(id) ? null : moraleBurned && LABOR_IDS.has(id) ? renderLabel('ui.warn.burned') : null;
    const base = { id, disabled: !ctx.afford(id), reason: null, warn };
    if (id === ACTION_HIRE) {
      if (ctx.nextRole === null) {
        return { ...base, label: renderLabel('role.all_hired'), desc: '', kind: 'secondary' };
      }
      const def = ROLES[ctx.nextRole];
      const cost = renderLabel('action.HIRE.desc', { newBurnK: burnFor([...state.team, ctx.nextRole], ctx.v) });
      const perk = hirePerkText(ctx.nextRole, state.team, ctx.v);
      return {
        ...base,
        label: renderLabel('action.HIRE', {
          role: renderLabel(`role.${ctx.nextRole}`),
          signOnK: def.signOnK,
          salaryK: def.salaryK,
        }),
        desc: perk ? renderLabel('action.HIRE.perk', { base: cost, perk }) : cost,
        kind: 'secondary',
        reason: base.disabled ? ctx.reason(id) : null,
      };
    }
    if (id === 'CLOSE_CLIENT') {
      return {
        ...base,
        label: renderLabel('action.CLOSE_CLIENT'),
        desc: renderLabel('action.CLOSE_CLIENT.desc', {
          closeCost: ctx.closeCost,
          amountK: dealPriceK(state.traction, ctx.v),
          delay: ctx.delayMonths,
        }),
        kind: 'secondary',
        reason: base.disabled ? ctx.reason(id) : null,
      };
    }
    const primary = ['BUILD_PRODUCT', 'TALK_TO_CUSTOMERS', 'PUBLISH_CONTENT'].includes(id);
    return {
      ...base,
      label: renderLabel(`action.${id}`),
      desc: primary ? laborDesc(id, ctx.perks ?? perksFor(state.team, ctx.v), state.teamMorale) : renderLabel(`action.${id}.desc`),
      kind: primary ? 'primary' : 'secondary',
      reason: base.disabled ? ctx.reason(id) : null,
    };
  });

  const pitchDisabled = !ctx.afford('PITCH');
  const forecast = forecastOf(state);
  const perksModel = ctx.perks ?? perksFor(state.team, ctx.v);
  const lastDue = state.invoices.reduce((max, i) => Math.max(max, i.dueMonth), 0);
  const expectedK = state.invoices.reduce((sum, i) => sum + i.amountK, 0);
  const rateCashK = lastDue > 0 ? Math.round(expectedK / (lastDue - state.month + 1)) : 0;
  const flowRows = forecast.months.slice(0, 6);
  const flow = state.gameOver ? null : {
    title: renderLabel('ui.flow.title'),
    rate: [
      renderLabel('ui.flow.rate.leads', { leads: perksModel.pipelinePerMonth }),
      renderLabel('ui.flow.rate.cash', { cash: rateCashK }),
    ],
    rows: flowRows.map((m) => ({
      month: m.month, inK: m.inK, outK: m.outK, cashK: m.cashK,
    })),
    truncated: forecast.months.length > flowRows.length && forecast.bankruptMonth === null,
    bankrupt: forecast.bankruptMonth !== null
      ? renderLabel('ui.flow.bankrupt', { month: forecast.bankruptMonth })
      : renderLabel('ui.flow.survived'),
    doomed: forecast.bankruptMonth !== null,
    gloss: renderLabel('ui.flow.gloss'),
  };
  const terminal = state.gameOver
    ? {
        stamp: renderLabel(`ui.stamp.${state.reason ?? 'survived'}`),
        headline: renderLabel(`ui.game_over.${state.reason ?? 'survived'}`),
        learn: ctx.lastLearn ? renderLabel(`learning.${ctx.lastLearn}`) : '',
        settlement: ctx.settlement
          ? [
              renderLabel('ui.exit.valuation', ctx.settlement),
              renderLabel('ui.exit.payout', ctx.settlement),
              ctx.settlement.cashOutK > 0
                ? renderLabel('ui.exit.cashout', ctx.settlement)
                : renderLabel('ui.exit.lost_control', ctx.settlement),
            ].map((line, i, arr) => ({ line, personal: i === arr.length - 1 && false }))
              .concat({
                line: renderLabel('ui.exit.personal', ctx.settlement),
                personal: true,
              })
          : [],
      }
    : null;

  return {
    month: renderLabel('month.label', { month: state.month, total: state.totalMonths }),
    monthPct: Math.round((state.month / state.totalMonths) * 100),
    hero: { label: renderLabel('hud.runway'), value: `${runway} meses`, gloss: renderLabel('hud.runway.gloss'), alarm },
    fields,
    rows,
    flow,
    end: {
      label: renderLabel('action.END_MONTH'),
      desc: renderLabel('action.END_MONTH.desc', {
        burn,
        decayLo: END_MONTH_DECAY - END_MONTH_DECAY_JITTER,
        decayHi: END_MONTH_DECAY + END_MONTH_DECAY_JITTER,
      }),
      closing: ctx.closing,
    },
    pitch: {
      label: renderLabel('action.PITCH'),
      desc: renderLabel('action.PITCH.desc', {
        minMonth: ctx.pitchMinMonth,
        cost: ctx.pitchCost,
        preK: FUND_PRE_BASE + FUND_PRE_PER_TRACTION * state.traction,
      }),
      disabled: pitchDisabled,
      reason: pitchDisabled ? ctx.reason('PITCH') : null,
    },
    offer: state.offer
      ? {
          title: renderLabel('ui.offer.title'),
          terms: renderLabel('ui.offer.terms', { preK: state.offer.preK, roundK: state.offer.roundK }),
          dilution: renderLabel('ui.offer.dilution', {
            investorPct: pct(state.offer.investorPctBps),
            founderPct: pct(state.offer.founderPctAfterBps),
          }),
          risk: renderLabel('ui.offer.risk', { cost: ctx.counterCost }),
          accept: renderLabel('ui.offer.accept'),
          counter: state.offer.countered
            ? renderLabel('ui.offer.countered')
            : renderLabel('ui.offer.counter.label', { cost: ctx.counterCost }),
          counterDisabled: state.offer.countered || state.founderEnergy < ctx.counterCost,
          counterReason: state.offer.countered
            ? null
            : state.founderEnergy < ctx.counterCost
              ? renderLabel('ui.offer.counter.reason.energy', { cost: ctx.counterCost })
              : null,
          decline: renderLabel('ui.offer.decline'),
        }
      : null,
    log: ctx.log.slice(-20),
    logEmpty: renderLabel('log.empty'),
    terminal,
  };
}

const setText = (id, value) => {
  const el = document.getElementById(id);
  if (el && el.textContent !== value) el.textContent = value;
};

function renderField(f) {
  const el = document.createElement('div');
  el.className = 'field';
  el.dataset.testid = `field-${f.id}`;
  const label = document.createElement('span');
  label.className = 'field-label';
  label.textContent = f.label;
  el.append(label);
  if (f.value !== undefined) {
    const value = document.createElement('span');
    value.className = `field-value${f.alarm ? ' alarm' : ''}`;
    value.textContent = f.value;
    el.append(value);
  }
  if (f.gloss) {
    const gloss = document.createElement('span');
    gloss.className = 'field-gloss';
    gloss.textContent = f.gloss;
    el.append(gloss);
  }
  if (f.dots) {
    const dots = document.createElement('span');
    dots.className = 'dots';
    f.dots.forEach((on) => {
      const d = document.createElement('span');
      d.className = `dot${on ? ' on' : ''}`;
      dots.append(d);
    });
    el.append(dots);
  }
  if (f.parts) {
    const parts = document.createElement('span');
    parts.className = 'field-parts';
    parts.dataset.testid = `field-${f.id}-parts`;
    parts.textContent = f.parts.map((p) => `${p.label} ${p.amountK}k`).join(' · ');
    el.append(parts);
  }
  if (f.bar) {
    const bar = document.createElement('span');
    bar.className = 'bar';
    const fill = document.createElement('span');
    fill.className = 'bar-fill';
    fill.style.width = `${f.bar.pct}%`;
    fill.style.background = f.bar.energy !== undefined
      ? `var(--tier-${f.bar.energy >= 85 ? 'high' : f.bar.energy >= 60 ? 'mid' : 'low'})`
      : `var(--tier-${['low', 'mid', 'high'][f.bar.colorTier]})`;
    bar.append(fill);
    el.append(bar);
  }
  return el;
}

function fillRow(el, row, descExtra) {
  el.textContent = '';
  const label = document.createElement('span');
  label.className = 'row-label';
  label.textContent = row.label;
  el.append(label);
  const descText = descExtra ?? row.desc;
  if (descText) {
    const desc = document.createElement('span');
    desc.className = `row-desc${row.warn ? ' alarm' : ''}`;
    desc.textContent = descText;
    el.append(desc);
  }
  if (row.reason) {
    const reason = document.createElement('span');
    reason.className = 'row-reason';
    reason.dataset.testid = `${el.dataset.testid}-reason`;
    reason.textContent = row.reason;
    el.append(reason);
  }
  if (row.warn) {
    const warn = document.createElement('span');
    warn.className = 'row-warn';
    warn.dataset.testid = `${el.dataset.testid}-warn`;
    warn.textContent = row.warn;
    el.append(warn);
  }
  el.disabled = !!row.disabled;
}

/** Paint the pure-data cash-flow block. Idempotent: text compares guard DOM. */
function paintFlow(flow) {
  const section = document.querySelector('.flow');
  if (!flow) {
    section.hidden = true;
    return;
  }
  section.hidden = false;
  setText('flow-title', flow.title);
  const rate = document.getElementById('flow-rate');
  if (rate.textContent !== flow.rate.join(' · ')) rate.textContent = flow.rate.join(' · ');
  const rowsEl = document.getElementById('flow-rows');
  const sig = flow.rows.map((r) => `${r.month}|${r.inK}|${r.outK}|${r.cashK}`).join(';');
  if (rowsEl.dataset.sig !== sig) {
    rowsEl.dataset.sig = sig;
    rowsEl.textContent = '';
    for (const r of flow.rows) {
      const line = document.createElement('div');
      line.className = `flow-row${r.cashK < 0 ? ' alarm' : ''}`;
      const m = document.createElement('span');
      m.textContent = `m${r.month}`;
      const inEl = document.createElement('span');
      inEl.textContent = r.inK ? `+${r.inK}` : '0';
      inEl.className = r.inK ? 'pos' : '';
      const outEl = document.createElement('span');
      outEl.textContent = `-${r.outK}`;
      const cash = document.createElement('span');
      cash.textContent = `${r.cashK}k`;
      if (r.cashK < 0) cash.className = 'neg';
      line.append(m, inEl, outEl, cash);
      rowsEl.append(line);
    }
    if (flow.truncated) {
      const dots = document.createElement('div');
      dots.className = 'flow-trunc';
      dots.textContent = '…';
      rowsEl.append(dots);
    }
  }
  const verdict = document.getElementById('flow-verdict');
  if (verdict.textContent !== flow.bankrupt) verdict.textContent = flow.bankrupt;
  verdict.classList.toggle('doomed', flow.doomed === true);
  setText('flow-gloss', flow.gloss);
}

/** Paint the model into the fixed skeleton. Stable ids, no randomness. */
export function renderView(model) {
  setText('month-label', model.month);
  document.getElementById('month-fill').style.width = `${model.monthPct}%`;

  setText('hero-label', model.hero.label);
  setText('hero-value', model.hero.value);
  setText('hero-gloss', model.hero.gloss);
  document.getElementById('hero').classList.toggle('alarm', model.hero.alarm);
  paintFlow(model.flow);

  const fields = document.getElementById('state-fields');
  fields.textContent = '';
  model.fields.forEach((f) => fields.append(renderField(f)));

  const list = document.getElementById('action-list');
  model.rows.forEach((row) => {
    let li = list.querySelector(`[data-row="${row.id}"]`);
    if (!li) {
      li = document.createElement('li');
      li.dataset.row = row.id;
      const btn = document.createElement('button');
      btn.className = 'row';
      btn.dataset.action = row.id;
      btn.dataset.testid = `row-${row.id}`;
      li.append(btn);
      list.append(li);
    }
    const btn = li.querySelector('button');
    btn.className = `row row-${row.kind}`;
    fillRow(btn, row);
  });

  setText('end-btn', '');
  const endBtn = document.getElementById('end-btn');
  fillRow(endBtn, {
    label: model.end.label,
    desc: model.end.desc,
    disabled: model.offer !== null || model.terminal !== null,
  });
  endBtn.classList.toggle('closing', model.end.closing);

  const pitchBtn = document.getElementById('pitch-btn');
  fillRow(pitchBtn, { ...model.pitch, disabled: model.pitch.disabled || model.offer !== null || model.terminal !== null });

  const logList = document.getElementById('log-lines');
  const shown = model.log.length ? model.log : [model.logEmpty];
  const lines = [...logList.children].map((li) => li.textContent);
  if (lines.join('\n') !== shown.join('\n')) {
    logList.textContent = '';
    shown.forEach((line) => {
      const li = document.createElement('li');
      if (!model.log.length) li.className = 'dim';
      li.textContent = line;
      logList.append(li);
    });
    logList.scrollTop = logList.scrollHeight;
  }

  const offerPanel = document.getElementById('offer-panel');
  if (model.offer) {
    offerPanel.hidden = false;
    setText('offer-title', model.offer.title);
    setText('offer-terms-line', model.offer.terms);
    setText('offer-dilution', model.offer.dilution);
    setText('offer-risk', model.offer.risk);
    fillRow(document.getElementById('accept-btn'), { label: model.offer.accept });
    fillRow(document.getElementById('counter-btn'), {
      label: model.offer.counter,
      disabled: model.offer.counterDisabled,
      reason: model.offer.counterReason,
    });
    fillRow(document.getElementById('decline-btn'), { label: model.offer.decline });
  } else {
    offerPanel.hidden = true;
  }

  const terminal = document.getElementById('terminal');
  if (model.terminal) {
    terminal.hidden = false;
    setText('terminal-stamp', model.terminal.stamp);
    setText('terminal-headline', model.terminal.headline);
    const learn = document.getElementById('terminal-learn');
    learn.hidden = model.terminal.learn === '';
    setText('terminal-learn', model.terminal.learn);
    const st = document.getElementById('settlement');
    st.textContent = '';
    model.terminal.settlement.forEach(({ line, personal }) => {
      const p = document.createElement('p');
      p.className = personal ? 'personal' : '';
      p.textContent = line;
      st.append(p);
    });
  } else {
    terminal.hidden = true;
  }
}

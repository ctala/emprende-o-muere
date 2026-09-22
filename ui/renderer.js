// Renders core semantic events and state labels into player-visible text.
// Default implementation: deterministic templates from content/strings_es.js.
// A future LLM renderer would be a second implementation of this interface;
// the core never changes either way.

import { getString, format, hasString } from '../content/strings_es.js';

/**
 * @typedef {{ key: string, params: Readonly<Record<string, string | number>> }} GameEvent
 */

/**
 * @param {GameEvent} event
 * @returns {string}
 */
export function render(event) {
  return format(resolveTemplate(event.key, event.params), fillPct(fillRole(event.params)));
}

/**
 * @param {string} key
 * @param {Readonly<Record<string, string | number>>} [params]
 * @returns {string}
 */
export function renderLabel(key, params = {}) {
  return format(getString(key), fillPct(fillRole(params)));
}

/** Display-only bps -> whole percent formatting (never re-derives dilution). */
function fillPct(params) {
  const out = { ...params };
  if (typeof params.investorPctBps === 'number') out.investorPct = Math.trunc(params.investorPctBps / 100);
  if (typeof params.founderPctBps === 'number') out.founderPct = Math.trunc(params.founderPctBps / 100);
  return out;
}

/** Prefer `${key}.${reason|action}` variants over the base key. */
function resolveTemplate(key, params) {
  const variant = params.reason ?? params.action;
  if (variant && hasString(`${key}.${variant}`)) return getString(`${key}.${variant}`);
  return getString(key);
}

/** Fill role labels from role.* strings when a role id is present. */
function fillRole(params) {
  if (params.role !== undefined && hasString(`role.${params.role}`)) {
    return { ...params, role: getString(`role.${params.role}`) };
  }
  return params;
}

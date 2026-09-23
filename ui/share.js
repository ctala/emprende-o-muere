// Terminal share seam. composeShareText is pure (strings + facts only) and is
// the single source of the post: the visible textarea and the share payload
// are composed by this same call, never re-typed. performShare is the only
// side-effecting path and touches no game state.

import { getString, format } from '../content/strings_es.js';

/**
 * @param {Readonly<{ stampWord: string, months: number, personalK: number|null, learn: string }>} facts
 * @param {number|string} seed the seed the page actually played
 * @param {string} selfUrl origin + pathname of the game page
 * @returns {string} plain-text WhatsApp-ready post, deterministic per input
 */
export function composeShareText(facts, seed, selfUrl) {
  const url = `${selfUrl}?seed=${seed}`;
  const head = facts.personalK === null
    ? format(getString('ui.share.bankrupt'), { months: facts.months })
    : format(getString('ui.share.survived'), { months: facts.months, personalK: facts.personalK });
  const parts = [facts.stampWord, head].filter(Boolean);
  if (facts.learn !== '') parts.push(facts.learn);
  parts.push(`${getString('ui.share.cta')}: ${url}`);
  return parts.join(' · ');
}

/**
 * Degrades: platform share -> clipboard (+ visible confirm) -> select the
 * on-page post block. A share sheet cancel is not an error.
 * @param {string} text the composed post
 * @param {HTMLButtonElement} button
 * @param {{ nav?: Navigator, doc?: Document, restoreMs?: number }} [env]
 * @returns {Promise<'shared'|'copied'|'manual'>}
 */
export async function performShare(text, button, env = {}) {
  const nav = env.nav ?? (typeof navigator === 'undefined' ? {} : navigator);
  const doc = env.doc ?? (typeof document === 'undefined' ? null : document);
  if (typeof nav.canShare === 'function' && nav.canShare({ text }) && typeof nav.share === 'function') {
    try {
      await nav.share({ text });
      return 'shared';
    } catch (err) {
      if (err && err.name === 'AbortError') return 'canceled';
    }
  }
  if (nav.clipboard && typeof nav.clipboard.writeText === 'function') {
    try {
      await nav.clipboard.writeText(text);
      if (button.dataset.originalLabel === undefined) button.dataset.originalLabel = button.textContent;
      button.dataset.copied = '1';
      button.textContent = getString('ui.share.copied');
      const status = doc ? doc.getElementById('share-status') : null;
      if (status) status.textContent = getString('ui.share.copied');
      setTimeout(() => {
        button.textContent = button.dataset.originalLabel;
        delete button.dataset.copied;
        if (status) status.textContent = '';
      }, env.restoreMs ?? 1500);
      return 'copied';
    } catch {
      // clipboard refused (permissions/insecure context): fall through
    }
  }
  const post = doc ? doc.getElementById('share-post') : null;
  if (post) {
    post.hidden = false;
    post.focus();
    post.select();
  }
  return 'manual';
}

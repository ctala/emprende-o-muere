// First-run hint flag: UI-only persistence sharing learnings' adapter.
// Pure functions so flag logic tests run under plain Node.

export const HELP_SEEN_KEY = 'roguelike.helpSeen.v1';

/** Corrupt payloads fall back to "unseen" (show the hint again). */
export function loadHelpSeen(adapter) {
  try {
    return adapter.getItem(HELP_SEEN_KEY) === 'true';
  } catch (err) {
    console.warn('help: storage unavailable, treating help as unseen', err);
    return false;
  }
}

export function saveHelpSeen(adapter) {
  try {
    adapter.setItem(HELP_SEEN_KEY, 'true');
  } catch (err) {
    console.warn('help: storage unavailable, hint may show again next run', err);
  }
}

/** Hint shows only on a virgin install: nothing learned, help never opened. */
export function shouldShowHint(unlockedIds, helpSeen) {
  return unlockedIds.length === 0 && !helpSeen;
}

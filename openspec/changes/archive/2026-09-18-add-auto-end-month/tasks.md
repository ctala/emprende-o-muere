# Tasks

## 1. UI auto-close

- [x] 1.1 In `ui/main.js`, after dispatching an action, if `state.focus === 0` and not gameOver, start a 600 ms `closingTimer` that dispatches END_MONTH (same path as a click); during the timer set an `inputLocked` flag so clicks are ignored, and clear the flag/timer on the auto-dispatch, on a manual END_MONTH click, and on game-over; verify via headless CDP harness: spend 2 focus -> month advances by itself after the delay; click during delay applies nothing
- [x] 1.2 Draw the closing cue while the timer is pending (action buttons in disabled style, END_MONTH region tinted); verify via CDP screenshots: frames during the delay differ from idle frames and the post-close frame matches focus 2 at month N+1

## 2. Integration

- [x] 2.1 Full CDP playthrough with only 2 action clicks per month (no END_MONTH clicks): run reaches month 24 terminal state, zero console errors, zero external requests, and `node --test` still green (core untouched); record the timing feel of the 600 ms delay for tuning

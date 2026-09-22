# Tasks

## 1. Theme module

- [x] 1.1 Create `ui/theme.js`: palette (desk, page, page-rule, margin-rule/ink-red, ink, paper-gold, tier colors), the two font stacks (display serif, ledger mono), and pure drawing helpers `drawPaper(ctx, x, y, w, h, {rotate})` (solid-fill offset shadow, ruled lines, red margin rule, fixed ±0.4° rotation constant), `stamp(ctx, cx, cy, text)` (rotated dashed seal), `dotLeader(ctx, x1, x2, y, label, value)` and `money(ctx, x, y, value, opts)` (mono digits, red on negative). Verify: `tests/theme.test.js` — every fg/bg pair used together clears a minimum luminance contrast; stamp rotation and paper offsets are fixed values (two calls produce identical transform params); module imports nothing from core or layout (grep test in the file)

## 2. Rewire the screen (geometry frozen)

- [x] 2.1 Replace the inline color/font constants in ui/main.js with theme imports; draw the desk backdrop + paper sheets for month panel, HUD band, log band, offer panel; HUD numbers through `money()`/mono with dot leaders; negatives in ledger red. Verify: all existing tests stay green untouched (layout geometry contract + 126 core/ui tests), and a CDP pixel check shows the dominant surface is the paper color on load (sample the pixel at canvas center)

- [x] 2.2 Term-sheet treatment for the offer panel (document header, ruled form lines, dashed perforation above the three buttons) and game-over as rotated red stamp (`QUEBRASTE` / `SOBREVIVISTE`) over a desaturated page. Verify: CDP screenshots of offer panel and both endings reviewed (stamp legible, buttons visually outside the sheet edge); existing offer-panel CDP hold/determinism behaviors still pass

## 3. Freeze and verify

- [x] 3.1 Add a frozen-coordinates assertion test (CLICKABLE region table equals literal expected values) so any future geometry nudge fails loudly; run the full visual regression: two CDP sessions with the same click plan end on identical final frames (identity adds no randomness), 0 console errors, 0 external requests
- [x] 3.2 One fresh-game screenshot compared against the pre-identity capture and reviewed for the "would someone click this" bar; tune only palette constants in theme.js based on the review; README dev log entry records the palette/type decisions

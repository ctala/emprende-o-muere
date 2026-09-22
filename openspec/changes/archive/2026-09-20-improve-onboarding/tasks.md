# Tasks

## 0. Rebase

- [x] 0.1 Finish and archive the paused `add-visual-identity` change first (its MODIFIED "Canvas month display" must be in the main spec before this change modifies the same requirement); verify: `openspec status` shows no active changes other than improve-onboarding, then sync this delta's MODIFIED block to include the identity scenarios (validator will list the omissions) and re-validate

## 1. Name and copy

- [x] 1.1 Rename the game to "Emprende o Muere" (subtitle "El juego de las startups") in content/strings_es.js `ui.title` + new `ui.subtitle`, index.html `<title>`/aria-label, and README H1; update the canvas draw to header + subtitle line. Verify: a strings test asserts ui.title contains no English working-title words; grep shows zero remaining "Startup LatAm Roguelite" player-visible occurrences; CDP screenshot shows the new header
- [x] 1.2 Add `getHelpSections()` to the strings module: `help.metrics` (Foco, Tracción, Moral, Caja, Runway, Energía, % Founder each with plain-Spanish gloss including Runway/Burn/Pre terms), `help.actions` (all seven + cerrar mes with effect·cost), `help.rules` (moral tiers, pitch month 6 + energía + cooldown, hire sign-on, close traction, focus, auto-close). Verify: tests/learnings-style Node test — sections non-empty, every HUD label and action name from existing string keys appears in the joined help text (drift guard), and the content budget holds (each section fits its column: count and per-line length capped)

## 2. Help screen

- [x] 2.1 `ui/layout.js`: add `helpButton` (x 768, y 8, w 28, h 20) and include it in CLICKABLE; `ui/main.js`: "?" toggle beside Biblioteca, mutually exclusive with libraryOpen, opening help renders the three-column legend in the library panel rect, open blocks all gameplay dispatch (same guard as library), close restores. Verify: layout test — helpButton clickable, outside monthBox, no overlap with any region; the help-open click-then-BUILD CDP inertness check mirrors the library one
- [x] 2.2 First-run hint: "¿Nuevo aquí? Pulsa ? para una guía rápida." drawn in the desk band above the action grid when `loadUnlocked` is empty AND `roguelike.helpSeen.v1` flag absent; opening help persists the flag via the storage adapter. Verify: Node test for the flag round-trip with a fake adapter (corrupt payload -> unseen); CDP sequence: fresh game shows hint, open help, reload — hint gone, help still opens

## 3. End-to-end verification

- [x] 3.1 CDP: fresh game screenshot (new name + hint visible), help-open screenshot reviewed (all 3 columns legible, nothing clipped), clicks inert while help open, zero console errors, zero external requests, same click plan across two sessions -> identical final frame; README dev log entry records the naming decision and the keep-jargon+gloss policy

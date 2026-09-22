# Proposal

## Why

The game is in its first genuinely working state (DOM shell + regression gate green + synthetic round 2 shipped) and the repo has zero commits — no version, no changelog, no license, no history. Before anything else lands on top, the project needs to be versioned, licensed (MIT), and published publicly on GitHub as `ctala/emprende-o-muere` so progress is recoverable and shareable (which is itself the game's distribution channel: WhatsApp links).

## What Changes

- Git hygiene: `.gitignore` (excludes the 6.1 GB `playtest/.venv`, `.opencode/node_modules` 63 MB, `.claude`/`.cline`/`.cline rules`/`.hermes` agent droppings, `__pycache__`), initial commit with everything else — full open-dev: game, gate tests, `playtest/` (personas + round reports; LLM-simulated data, no personal data), `openspec/`, vendored MIT skill (`ui-ux-pro-max`, license + provenance preserved).
- Versioning: `package.json` gains `"version": "0.1.0"` (single source of truth, read by humans and tooling); first annotated tag `v0.1.0`.
- Changelog: `CHANGELOG.md` in Keep a Changelog format, seeded with the release narrative (v0.1.0 = playable DOM shell + gate + synthetic round 2) and a rule that every tagged release updates it first.
- License: MIT `LICENSE` (Cristian Tala, 2026); README gets License + a short Contributing pointer; vendored skill keeps its own MIT file.
- Publish: create the public GitHub repo via `gh` (already authenticated as `ctala`), push `main`, create the `v0.1.0` tag and a GitHub Release with the changelog notes. Repo description + topics (`game`, `roguelike`, `javascript`, `web-game`, `spanish`).
- Pre-flight safety: `git ls-files` reviewed (no `.env`, no keys — verified none exist in tracked content), `npm run gate` green on the exact commit being tagged.

## Capabilities

### New Capabilities
- `release-hygiene`: the project's versioning/licensing/publishing contract — what a release must contain and which files must stay out of the published artifact.

### Modified Capabilities
- (none)

## Impact

- New files: `.gitignore`, `LICENSE`, `CHANGELOG.md`; `package.json` gains `version` + `license` fields; README gets License/Contributing sections.
- External: public GitHub repo `ctala/emprende-o-muere` (irreversible — scraped after the fact; owner already accepted open-dev scope including `playtest/` synthetic data and full `openspec/` history).
- Dependencies on pending housekeeping: the two completed-but-unarchived changes (`redesign-mobile-first`, `add-regression-gate`) should be archived first so the initial commit captures the finished `openspec/` state; they are already verified 8/8.
- No game-code changes. No CI introduced (local `npm run gate` stays the release check).

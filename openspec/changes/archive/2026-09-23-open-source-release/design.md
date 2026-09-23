# Design

## Context

The repo is a zero-dependency browser game with a committed browser gate, synthetic playtest tooling, and full OpenSpec history — all untracked (0 commits). `gh` CLI is authenticated as `ctala` (https). Owner decisions already made: **full open-dev publication** (game + gate + playtest data + openspec + vendored MIT skill) and **v0.1.0** as the first tag (pre-1.0 until the 5-human pass). Tree audit done: no `.env`, no keys in tracked content, no emails/PII in personas; local junk = `playtest/.venv` (6.1G), `.opencode/node_modules` (63M), `.claude`/`.cline`/`.clinerules`/`.hermes`, `__pycache__`. Two changes (redesign-mobile-first, add-regression-gate) are 8/8 complete but unarchived; their delta specs touch `ui-shell`/`regression-gate` and the sync is part of their own archive flow, not this change.

## Goals / Non-Goals

**Goals:**
- First commit captures the finished project; history is clean from commit #1 (ignore rules before the initial `git add`)
- One version number, changelog-before-tag, MIT, public repo, annotated tag + GitHub Release
- The publish steps are re-runnable and never destructive

**Non-Goals:**
- No CI (no GitHub Actions yet — `npm run gate` locally remains the release check; CI is a future change)
- No auto-release tooling beyond a documented task checklist (the repo is one maintainer; scripts are for teams)
- No semantic-release/changesets machinery — overkill for manual tags at this stage
- Not syncing/archiving the two pending changes here (separate `/opsx-archive` runs, invoked first)

## Decisions

1. **Archive the two pending changes BEFORE the initial commit** (manual dependency, recorded in tasks step 0). The sync of `redesign-mobile-first` rewrites `openspec/specs/ui-shell/spec.md`; committing before it would bake a stale spec into public history. Order: archive gate → archive redesign (sync ui-shell) → `.gitignore` → commit.
2. **`.gitignore` written first, verified with `git status --ignored`** before staging: `playtest/.venv/`, `node_modules/`, `.opencode/node_modules/`, `__pycache__/`, `*.pyc`, `.DS_Store`, plus the four agent droppings dirs (`.claude/`, `.cline/`, `.clinerules/`, `.hermes/`). Keep `.opencode/skills/`, `.opencode/agent/`, `.opencode/commands/`, `.opencode/package.json` (the openspec skills are part of the open-dev story). If git status shows anything >10MB staged, stop and review.
3. **Version source = `package.json`** (`"version": "0.1.0"`, plus `"license": "MIT"`, `"description"`). It's dev-tooling-only metadata anyway (the game has no deps/build), so it can't desync from runtime. No VERSION file, no JS constant — the game page shows no version.
4. **CHANGELOG.md Keep a Changelog format**, Spanish headings? — no: **English** to match the README and maximize external contribution surface, game copy stays Spanish. `## [0.1.0] - 2026-09-22` section drafted from README dev log: what a player sees (DOM shell, phone-first, burned-team warning, closable modals, replay) and what a contributor gets (gate, ux agent, synthetic playtest). Rule stated in the changelog header: update it before tagging.
5. **MIT LICENSE** `Copyright (c) 2026 Cristian Tala`. Vendored skill keeps `LICENSE` + a one-line provenance note (repo URL, version 2.13.0) in its own directory — never merged into ours.
6. **Publication by explicit `gh` commands, run as apply tasks (not scripted):** `gh repo create ctala/emprende-o-muere --public --source . --push --description "..."` (creates+pushes main), then `git tag -a v0.1.0 -m "v0.1.0" && git push origin v0.1.0`, then `gh release create v0.1.0 --title "v0.1.0" --notes-file <(changelog section)`. Re-runnability: every command is idempotent-checked by the task text (repo exists? tag exists? release exists?) before acting; never `--force`.
7. **Secrets pre-flight = `git grep -I -nE '(sk-[A-Za-z0-9]{8,}|api[_-]?key\s*[=:]\s*["'\''][^"'\'']{8,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})'` on the index after staging** — must return nothing; the one local-only key file (`~/litellm/.env`) lives outside the repo by construction, and `shim.py` reads env vars only (audited).
8. **README additions:** License section (MIT + link), Contributing section (the `npm run gate` contract + "propose via openspec or issue"), and the "Play" section pointing at the GitHub Pages option as a future change (not enabled now).

## Risks / Trade-offs

- **Public is forever**: playtest reports contain LLM-simulated fictional opinions (tinytroupe) — accepted by owner; no real persons, no emails (audited).
- **Vendored 3.8MB skill in history**: bloats clone slightly; accepted (open-dev reproducibility); its `.gitignore` inside doesn't exclude its data, so the whole skill dir is tracked intentionally.
- **First commit = big commit** (~few MB): acceptable for a 0-history repo; splitting into 20 logical commits would fake history we didn't live.
- **gh repo create + --push in one shot** can fail on auth edge cases; task order separates create/push/tag/release so a retry resumes cleanly.

## Migration / Rollback

Before the first push everything is a local-only operation — rollback is `git reset` + delete the draft files. After `gh repo create --public` the repo exists; "unpublishing" is delete-repo (owner choice, documented in the task's pause point).

## Open Questions

- Repo name: `emprende-o-muere` assumed (matches package name); confirm before creating if the owner wants a display name with accents.

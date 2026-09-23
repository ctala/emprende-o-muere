# Tasks

## 0. Finish the housekeeping the commit depends on

- [x] 0.1 Archive `add-regression-gate` and `redesign-mobile-first` (openspec archive flow, syncing their delta specs into `openspec/specs/` — ui-shell gains the DOM requirements and drops canvas). Verify: `openspec list` shows no active changes; `openspec/specs/ui-shell/spec.md` no longer contains "Canvas month display"; `openspec/specs/regression-gate/spec.md` exists; `npm run gate` still exits 0

## 1. Ignore contract + first commit (clean from commit #1)

- [x] 1.1 Write `.gitignore` (`playtest/.venv/`, `node_modules/`, `.opencode/node_modules/`, `__pycache__/`, `*.pyc`, `.DS_Store`, `.claude/`, `.cline/`, `.clinerules/`, `.hermes/`, `*.log`). Verify: `git status --ignored --short | grep '^!!' | head` lists the venv and node_modules; `du -sh $(git status --short | awk '$1=="??"{print $2}')` shows no candidate dir >10MB outside the vendored skill

- [x] 1.2 Add release artifacts: `LICENSE` (MIT, "Copyright (c) 2026 Cristian Tala"), provenance note inside the vendored skill dir (upstream URL + v2.13.0 + its MIT preserved), `package.json` `"version": "0.1.0"` + `"license": "MIT"` + `"description"`. Verify: `head -4 LICENSE`; `node -e "const p=require('./package.json'); if(p.version!=='0.1.0'||p.license!=='MIT')process.exit(1)"`

- [x] 1.3 `CHANGELOG.md`: Keep a Changelog header + `## [0.1.0] - 2026-09-22` drafted from the README dev log (Added: DOM phone-first shell, runway hero, burned-team warning, closable modals + restart, regression gate, ux-review agent, synthetic round 2; Changed: naming; Removed: canvas shell). README gains License + Contributing sections. Verify: changelog section for 0.1.0 exists; README renders links to `LICENSE`

- [x] 1.4 Stage + secrets pre-flight + initial commit: `git add -A`, then `git grep -I -nE '(sk-[A-Za-z0-9]{8,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})' HEAD 2>/dev/null || git grep -I -nE '(sk-[A-Za-z0-9]{8,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})' -- .` on the index — zero hits required; then `git commit -m "v0.1.0: playable DOM shell, regression gate, open-dev tree"`. Verify: `git ls-files | grep -E "venv|node_modules|\.env"` empty; `git show --stat HEAD | tail -1` sane size; `npm run gate` green on the committed tree

## 2. Publish

- [x] 2.1 Create the public repo and push (pause point: this is the irreversible step — confirm with the owner immediately before running): `gh repo create ctala/emprende-o-muere --public --source . --push --description "Turn-based roguelite about founding a startup in Latin America. Vanilla JS, no build step, tests that catch their own regressions." --homepage ""`. Verify: `gh repo view ctala/emprende-o-muere --json visibility,pushedAt` → public, pushed; if the repo already exists, stop and report instead of re-creating. Set topics: `gh repo edit --add-topic game,roguelike,javascript,web-game,spanish,openspec`

- [x] 2.2 Tag + release: `git tag -a v0.1.0 -m "v0.1.0 — playable DOM shell + regression gate"`; `git push origin v0.1.0`; `gh release create v0.1.0 --title "v0.1.0" --notes` with the changelog section body. Verify: `gh release view v0.1.0` shows the notes; `git ls-remote origin refs/tags/v0.1.0` non-empty; tag/`package.json`/changelog all say 0.1.0 (the spec's mismatch rule)

- [x] 2.3 Post-publish report: print repo URL, tag URL, release URL, and a one-paragraph "what to test from a stranger's phone" note (open the raw index via any static host, run `npm run gate`); append a dev-log line to README recording the v0.1.0 publication and commit it as `chore: v0.1.0 published`. Verify: second run of 2.1/2.2 detects existing repo/tag/release and changes nothing destructive

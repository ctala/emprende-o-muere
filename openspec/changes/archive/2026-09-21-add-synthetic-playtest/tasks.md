# Tasks

## 1. Harness skeleton

- [x] 1.1 `playtest/` scaffold: `README.md` (uv venv + pip install from git + how to run one round), `requirements.txt` pinning TinyTroupe `@main` to a resolved commit hash, `.gitignore` (venv, cache, `shots/`, `results/*.json` raw except the committed round 1). Verify: fresh `uv venv && uv pip install -r requirements.txt` succeeds offline-first from cache; `import tinytroupe` works

- [x] 1.2 `playtest/shim.py`: stdlib `http.server` on 127.0.0.1:8788/v1, OpenAI `/chat/completions` passthrough to DashScope mode-compatible with model-name mapping (default `qwen-vl-max-latest`), `DASHSCOPE_API_KEY` required (exit non-zero + message naming the variable when absent), loopback bind only. Verify: `curl` with a dummy `OPENAI_API_KEY` and `OPENAI_BASE_URL=http://127.0.0.1:8788/v1` gets a real chat reply; missing key -> loud exit

## 2. Personas and rig

- [x] 2.1 `playtest/personas/*.json`: the 5 founder specs (early-stage non-gamer, funded second-timer, curious aspirant, SME owner 40s, designer-gamer) with age/country/occupation/tech-comfort/gamer-relation/2 traits/2 interests. Verify: new `tests/personas.test.js` — schema fields present, exactly 5 files, spread constraints (≥1 non-gamer, ≥1 jargon-native, ages in ≥3 distinct decades); stays green under `node --test 'tests/*.test.js'` with the game suite

- [x] 2.2 Shim guard tests in `tests/personas.test.js` or a small `tests/shim.test.js`: shim source contains no hardcoded secret (grep guard), binds 127.0.0.1, and the missing-key path exits non-zero (spawn with env stripped and assert exit code + message). Verify under `node --test`

- [x] 2.3 `playtest/shots.sh` + `playtest/shoot.mjs`: serve repo, drive headless Chrome (existing CDP pattern) shooting 3 states (fresh / help open / QUEBRASTE via 9 ENDs) × 3 viewports (393×852 DPR3, 852×393, 800×450 desktop) into `playtest/shots/`. Verify: 9 named PNGs exist non-empty; parseable names (state, viewport)

## 3. Round protocol

- [x] 3.1 `playtest/prompts/round{1,2,3}.v1.md`: Spanish questions per round (cold-glance purpose+intent / imagined-play taps+disabled-action / game-over WhatsApp share intent), complaint-first ordering, trailing strict-JSON schema. `playtest/run_round.py`: loads persona JSON via `TinyPerson.load_specification`, injects `see(png)` + question per round, isolated per-persona sessions, tolerant JSON extraction, appends records `{id,persona,round,model,promptVersion,answers,screenshot,ts}` to `playtest/results/round<N>.json`. Verify: 15 records after a full run, each with the 4 answer fields non-empty; a grep-style test asserts no persona answer text appears in another persona's prompt log

## 4. Synthesis + first real round

- [x] 4.1 `playtest/synthesize.mjs` (pure Node, no network): reads stored results -> markdown report with per-persona verdicts, frequency-ranked friction list, per-screen comprehension fraction, game-over share-intent count, every claim tagged [persona:round], synthetic-panel disclaimer + human-confirmation recommendation. Verify: re-running synthesis performs zero model calls (assert via shim request log staying flat); every cited id exists in the results file

- [x] 4.2 Execute round 1 against the current build with the shim+DashScope; commit `playtest/results/round1.json` (trimmed of raw verbose logs) and `playtest/results/round1-report.md`. Verify: report reviewed by the user before any redesign change is proposed; README gains a `## Playtest` section (what it is, how to re-run, its synthetic status)

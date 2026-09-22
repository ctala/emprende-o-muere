# Design

## Context

Target audience: LatAm startup communities, arriving via WhatsApp links, mobile portrait, short sessions. TinyTroupe v0.7+ supports vision (`see()`) and its `openai_client` reads `OPENAI_API_KEY` with no `base_url` parameter (verified on main: `clients/openai_client.py` constructs `OpenAI(api_key=os.getenv("OPENAI_API_KEY"), ...)`). This machine has no usable OpenAI key, but serves the vision-capable local model `qwen3.8-flash-next-vllm` through litellm (`127.0.0.1:4000/v1`, master key in `~/litellm/.env`). (The Bailian/Token-Plan key present here is rejected by DashScope's public endpoint, so the local model is the provider.) The repo is Node-only for the game; TinyTroupe is Python, installed from git (no PyPI recommendation).

## Goals / Non-Goals

**Goals:**
- A repo-resident, re-runnable panel: same command, new round, comparable JSON
- Feedback on *pixels* (the thing the user complained about), not on descriptions
- Results as evidence artifacts future changes can cite

**Non-Goals:**
- Not a replacement for human validation (disclaimer in every report)
- Not a gameplay simulator — agents never play the core; round 2 is "imagined play" over a screenshot (cheap, and the honest claim; a scripted interactive playtest would mean exposing state to agents and over-claims fidelity)
- No changes to `core/`, `ui/`, `content/`, game tests, or the browser bundle

## Decisions

**Python lives in `playtest/` with its own venv; nothing game-facing depends on it.** The game stays Node/no-dependencies. `playtest/README.md` documents `uv venv` + `pip install git+https://github.com/microsoft/TinyTroupe.git@main`. Persona-adherence tests run in plain Node by reading the JSON files (schema + spread checks), so `node --test 'tests/*.test.js'` stays the game gate and persona drift still fails loudly.

**Shim = stdlib-only `http.server` on `127.0.0.1:8788/v1`.** Accepts OpenAI `/chat/completions`, maps model names to the local `qwen3.8-flash-next-vllm`, translates the (dummy) client key into the litellm master key, caps output length (TinyTroupe's default 128k would wall a request for minutes at local generation speed) and disables thinking mode on qwen so answers stay fast and non-null. ~100 lines, no dependencies, fails loud on missing `LITELLM_MASTER_KEY`. Chosen over monkey-patching TinyTroupe/OpenAI SDK because it leaves both libraries untouched and keeps the diff honest. TinyTroupe's own response cache (JSON, since 0.7.0) plus our raw-JSON dumps give the "re-analyze for free" property: synthesis reads stored records only.

**Screenshots from the existing CDP pattern, Node side.** `playtest/shots.sh`: start `python3 -m http.server`, drive headless Chrome over CDP (the exact harness already used for every prior visual verification) to shoot 3 states × 3 viewports. State recipes: fresh load (month 1); click `?`; click END nine times to QUEBRASTE — all proven sequences from prior harnesses. `deviceScaleFactor: 3` for portrait shots so vision models read small text fairly.

**Personas as JSON specs + adherence tests.** Five archetypes agreed in exploration (Valentina/Bogotá, Diego/CDMX, Camila/BA, Jorge/Lima, Fernanda/SP), written in Spanish-flavored English persona detail (age, country, phone model, tech comfort, gamer relation, two traits, two interests each), loaded via `TinyPerson.load_specification`. Adherence = schema validation in Node (fields present, spread constraints: ≥1 non-gamer, ≥1 jargon-native, ages across 3 decades) — cheap drift guard; behavioral adherence is what the round outputs are for, judged in synthesis.

**Protocol prompts versioned in `playtest/prompts/`** (v1 files, one per round, Spanish questions since the product is Spanish — answers come back in Spanish, which is also the language of the target evidence). Structured output enforced by a trailing JSON schema in the prompt plus tolerant parser (extract first JSON object). Records: `{id, persona, round, model, promptVersion, answers{comprehension,intent,frictions[],quote}, screenshot, ts}`.

**Synthesis is a pure Node script over `results/*.json`** — frequency ranking of frictions, comprehension fraction per screen, share-intent count, every line tagged `[persona:round]`. Markdown in, human-readable; JSON stays the source of truth.

## Risks / Trade-offs

- [Synthetic sycophancy — agents over-praise] → prompts ask for the single most annoying thing FIRST before what they like; synthesis weights complaints above praise; the report disclaimer keeps humans in the loop.
- [Vision models hallucinate pixel-level legibility claims] → frictions citing legibility get flagged `needs-human` in synthesis; the rig shoots at DPR 3 so "I can't read it" from the model actually means contrast/size, not resolution.
- [Local vLLM concurrency/timing (qwen reasoning mode ate output once)] → shim caps tokens, forces `enable_thinking:false` on qwen, and the runner validates records (non-empty required fields, up to 3 attempts) before accepting them.
- [TinyTroupe API churn (their own warning)] → pinned `@main` commit hash in `playtest/requirements.txt`; runner wraps library import in a version check.
- [Panel is opinion, not data] → every report says so; the redesign change must cite at least one human confirmation before anything irreversible ships (the standing rule from the 3-viewport discussion).

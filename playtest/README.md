# Playtest — synthetic founder panel

Offline research harness: five simulated LatAm-founder personas (`TinyPerson`)
*see* real screenshots of the game and answer a fixed three-round protocol.
Results are the evidence gate for visual changes; they are **synthetic opinion,
not human data** — every report must be confirmed with a small human sample
before any irreversible decision.

The game itself (Node, no dependencies) never imports anything here.

## Setup

Python 3.10+ and `uv`:

```
cd playtest
uv venv
uv pip install -r requirements.txt   # TinyTroupe, pinned to a commit
```

## Run a round

Requires the repo's static server and `DASHSCOPE_API_KEY` in the environment.

```
python3 -m http.server 8765 &                 # the game
.venv/bin/python shim.py &                    # OpenAI-compat -> DashScope
sh shots.sh                                   # 3 states x 3 viewports -> shots/
.venv/bin/python run_round.py 1               # 5 personas x 3 rounds -> results/round1.json
node synthesize.mjs 1                         # -> results/round1-report.md
```

The shim exposes a plain OpenAI endpoint on `127.0.0.1:8788/v1`, backed by
the local litellm/vLLM `qwen3.8-flash-next-vllm` model (text + image). The
runner sets `OPENAI_API_KEY=playtest-local` and `OPENAI_BASE_URL` to the
shim, so TinyTroupe needs no custom config. Re-running `synthesize.mjs`
costs zero API calls — everything re-analyzes from the stored JSON.

## Layout

- `personas/*.json` — the five founder specs (drift-tested by `tests/personas.test.js`)
- `shim.py` — stdlib passthrough proxy; model-name mapped to DashScope vision
- `shoot.mjs` / `shots.sh` — CDP screenshot rig (same pattern as visual verification)
- `prompts/round*.v1.md` — versioned Spanish questions, complaint-first, strict JSON
- `run_round.py` — isolated per-persona vision sessions -> `results/roundN.json`
- `synthesize.mjs` — frequency-ranked frictions, comprehension scores, share
  intent; every claim tagged `[persona:round]`

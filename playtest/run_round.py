"""Run one synthetic playtest round: 5 personas x the 3-round protocol.

Usage: .venv/bin/python run_round.py [roundN]   (default: rounds 1..3)
Requires: shim running on 127.0.0.1:8788, shots present in playtest/shots/.

Each (persona, round) runs on a freshly loaded agent, so prompts never
contain other personas' answers. Records land in results/round<N>.json.
"""

import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

os.environ.setdefault("OPENAI_API_KEY", "playtest-local")
os.environ.setdefault("OPENAI_BASE_URL", "http://127.0.0.1:8788/v1")

import logging

logging.disable(logging.CRITICAL)

from tinytroupe.agent import TinyPerson  # noqa: E402

BASE = Path(__file__).parent
PROMPT_VERSION = "v1"
MODEL = os.environ.get("SHIM_MODEL", "qwen3.8-flash-next-vllm")
PERSONA_IDS = ["valentina", "diego", "camila", "jorge", "fernanda"]
ROUND_SHOTS = {
    1: ["fresh_portrait.png"],
    2: ["fresh_portrait.png", "help_portrait.png"],
    3: ["gameover_portrait.png"],
}
REQUIRED_FIELDS = {
    1: ["de_que_va", "jugarias", "por_que", "fricciones", "frase_textual"],
    2: ["primero_toco", "firma_cliente_gris", "espera_cerrar_mes", "fricciones", "frase_textual"],
    3: ["entiendes_por_que_perdiste", "compartiras", "volves_a_jugar", "fricciones", "frase_textual"],
}


def extract_json(text):
    start = text.find("{")
    if start < 0:
        return None
    try:
        obj, _ = json.JSONDecoder().raw_decode(text[start:])
        return obj if isinstance(obj, dict) else None
    except ValueError:
        return None


def talk_from(result):
    acts = result[1] if isinstance(result, tuple) and len(result) == 2 else (
        result if isinstance(result, list) else [result])
    for a in acts:
        action = a.get("action") if isinstance(a, dict) else None
        if action and action.get("type") == "TALK":
            return action.get("content")
    return None


def run_case(persona_id, round_n):
    question = (BASE / "prompts" / f"round{round_n}.{PROMPT_VERSION}.md").read_text(encoding="utf-8")
    images = [str(BASE / "shots" / s) for s in ROUND_SHOTS[round_n]]
    for path in images:
        if not Path(path).exists():
            raise SystemExit(f"missing screenshot {path}; run playtest/shots.sh first")

    person = TinyPerson.load_specification(str(BASE / "personas" / f"{persona_id}.json"))
    person.verbose = False
    try:
        person.see(images=images, description=f"Imágenes de la ronda {round_n} del juego, en orden.")
        person.listen(question)
        raw_answer, attempts, parsed = None, 0, None
        for _ in range(3):
            attempts += 1
            result = person.act(return_actions=True)
            talk = talk_from(result)
            if talk:
                parsed = extract_json(talk)
                if parsed is not None:
                    raw_answer = talk
                    break
                person.listen("Devuelve ÚNICAMENTE el objeto JSON pedido, sin texto alrededor.")
    finally:
        # free the global name registry so the same persona can run again
        # in another round within the same process
        TinyPerson.all_agents.pop(person.name, None)
    fields = REQUIRED_FIELDS[round_n]
    answers = {f: (parsed or {}).get(f, "") for f in fields} if parsed else {}
    ok = parsed is not None and all(str(answers.get(f, "")).strip() for f in fields)
    return {
        "id": f"{persona_id}-r{round_n}",
        "persona": persona_id,
        "round": round_n,
        "model": MODEL,
        "promptVersion": PROMPT_VERSION,
        "answers": answers,
        "raw": raw_answer,
        "attempts": attempts,
        "valid": bool(ok),
        "screenshot": [Path(p).name for p in images],
        "ts": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }


def main():
    wanted = [int(x) for x in sys.argv[1:] if x.isdigit()] or [1, 2, 3]
    (BASE / "results" / "raw").mkdir(parents=True, exist_ok=True)
    for round_n in wanted:
        out = BASE / "results" / f"round{round_n}.json"
        records = json.loads(out.read_text()) if out.exists() else []
        done = {r["persona"] for r in records if r.get("valid")}
        with (BASE / "results" / "raw" / f"round{round_n}.jsonl").open("a") as rawlog:
            for pid in PERSONA_IDS:
                if pid in done:
                    print(f"round {round_n} / {pid}: already valid, skipped")
                    continue
                print(f"round {round_n} / {pid}: running...", flush=True)
                rec = run_case(pid, round_n)
                records.append(rec)
                rawlog.write(json.dumps(rec, ensure_ascii=False) + "\n")
                out.write_text(json.dumps(records, ensure_ascii=False, indent=2))
                print(f"  -> valid={rec['valid']} attempts={rec['attempts']}"
                      + ("" if rec["valid"] else f" raw={str(rec['raw'])[:120]}"), flush=True)
                time.sleep(1)
        valid = sum(1 for r in records if r.get("valid"))
        print(f"round {round_n}: {valid}/{len(PERSONA_IDS)} valid records -> {out}")


if __name__ == "__main__":
    main()

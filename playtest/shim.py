"""OpenAI-compat shim: 127.0.0.1:8788/v1 -> local litellm (qwen3.8 via vLLM).

TinyTroupe's client hardcodes OPENAI_API_KEY with no base_url argument; the
OpenAI SDK it uses honors OPENAI_BASE_URL, so pointing that env var here
lets the library run unmodified. This proxy is a transparent passthrough:
the only transformation is the model-name mapping below. Loopback only.

Run:  python shim.py   (needs the local litellm on :4000 and a master key)
Env:  SHIM_PORT (default 8788), SHIM_UPSTREAM (default http://127.0.0.1:4000/v1),
      SHIM_MODEL (default qwen3.8-flash-next-vllm, supports text+image),
      key from LITELLM_MASTER_KEY env, SHIM_UPSTREAM_KEY env, or the
      LITELLM_MASTER_KEY line in ~/litellm/.env
"""

import json
import os
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib import error, request

LOOPBACK = "127.0.0.1"
DEFAULT_UPSTREAM = "http://127.0.0.1:4000/v1"
DEFAULT_MODEL = "qwen3.8-flash-next-vllm"
STATE_LOCK = threading.Lock()
STATE = {"requests": 0}


def provider_key():
    for var in ("LITELLM_MASTER_KEY", "SHIM_UPSTREAM_KEY"):
        value = os.environ.get(var, "")
        if value:
            return value
    env_file = Path.home() / "litellm" / ".env"
    try:
        for line in env_file.read_text().splitlines():
            if line.startswith("LITELLM_MASTER_KEY="):
                return line.split("=", 1)[1].strip()
    except OSError:
        pass
    return ""


def map_model(body):
    """Map OpenAI-style model names (the library's gpt-* defaults) onto the
    local vision-capable model. Also cap output length (TinyTroupe's default
    128k would wall a request for minutes at local generation speed) and
    disable thinking mode on qwen models so short answers stay fast."""
    cap = int(os.environ.get("SHIM_MAX_TOKENS", "1024"))
    for key in ("max_completion_tokens", "max_tokens"):
        value = body.get(key)
        if isinstance(value, int) and value > cap:
            body[key] = cap
    name = str(body.get("model", ""))
    mapped = name if ("qwen" in name or "litellm" in name) else os.environ.get("SHIM_MODEL", DEFAULT_MODEL)
    body["model"] = mapped
    if "qwen" in mapped and "chat_template_kwargs" not in body:
        body["chat_template_kwargs"] = {"enable_thinking": False}
    return mapped


class ShimHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):  # keep stderr clean; stats endpoint instead
        pass

    def _send(self, code, payload, ctype="application/json"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        if self.path.rstrip("/") == "/v1/__stats":
            with STATE_LOCK:
                body = json.dumps(STATE).encode()
            self._send(200, body)
        else:
            self._send(404, b'{"error":"not found"}')

    def do_POST(self):
        if not self.path.startswith("/v1/"):
            self._send(404, b'{"error":"not found"}')
            return
        raw = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        try:
            body = json.loads(raw)
        except ValueError:
            self._send(400, b'{"error":"invalid JSON body"}')
            return
        map_model(body)
        with STATE_LOCK:
            STATE["requests"] += 1
        # the client's Authorization is a dummy (its key env is a formality);
        # upstream auth always comes from DASHSCOPE_API_KEY
        upstream = os.environ.get("SHIM_UPSTREAM", DEFAULT_UPSTREAM).rstrip("/")
        req = request.Request(
            upstream + self.path[len("/v1"):],
            data=json.dumps(body).encode(),
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer " + provider_key(),
            },
            method="POST",
        )
        streaming = bool(body.get("stream"))
        try:
            with request.urlopen(req, timeout=300) as resp:
                if streaming:
                    self.send_response(resp.status)
                    self.send_header("Content-Type", resp.headers.get("Content-Type", "text/event-stream"))
                    self.end_headers()
                    while True:
                        chunk = resp.read(4096)
                        if not chunk:
                            break
                        self.wfile.write(chunk)
                else:
                    self._send(resp.status, resp.read(), resp.headers.get("Content-Type", "application/json"))
        except error.HTTPError as err:
            self._send(err.code, err.read() or json.dumps({"error": str(err)}).encode())
        except OSError as err:
            self._send(502, json.dumps({"error": f"upstream unreachable: {err}"}).encode())


def main():
    if not provider_key():
        sys.stderr.write("shim.py: LITELLM_MASTER_KEY is required but not found (env, SHIM_UPSTREAM_KEY, or ~/litellm/.env)\n")
        sys.exit(2)
    port = int(os.environ.get("SHIM_PORT", "8788"))
    server = ThreadingHTTPServer((LOOPBACK, port), ShimHandler)
    sys.stderr.write(f"shim listening on http://{LOOPBACK}:{port}/v1 -> {os.environ.get('SHIM_UPSTREAM', DEFAULT_UPSTREAM)}\n")
    server.serve_forever()


if __name__ == "__main__":
    main()

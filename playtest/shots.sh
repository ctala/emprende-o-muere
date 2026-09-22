#!/bin/sh
# Shoot the 3 states x 3 viewports against the served game.
# Usage: sh playtest/shots.sh [port]   (port default 8765; CHROME env required)
set -e
PORT="${1:-8765}"
python3 -m http.server "$PORT" >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT
sleep 1
node playtest/shoot.mjs "http://localhost:$PORT/index.html"

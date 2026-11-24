#!/bin/sh
# Compile the song to the module the page loads. Needs `wac` on PATH (see README).
set -e
cd "$(dirname "$0")"
wac compile src/song.wac docs/song.wasm

# chipdial

One chiptune song with a dial from **chill** to **intense**, for working to. **[Play it](https://botreevo.github.io/chipdial/)**

Turning the dial doesn't switch between tracks. Each feature of the song depends on one smoothed
intensity value:

| as intensity rises | |
|---|---|
| layers fade in | pad (always) → arp 0.1 → bass 0.25 → hats 0.38 → kick 0.45 → snare 0.6 → lead 0.7 |
| drums and bass gain hits | every step has a threshold, so hits are only added and the groove builds rather than reshuffling |
| arp | eighths, then the sixteenths between them from 0.45 |
| timbre | filters open, pulse waves narrow, the bass picks up a square |
| tempo | glides from 82 to 128 BPM |

The intensity value itself follows the dial with a time constant of about a second, so a sudden
move becomes a short build-up or wind-down.

## How it's made

The synth is all [wac](https://github.com/voltrevo/wac): [`src/song.wac`](src/song.wac) compiles to a
~16 KB WebAssembly GC module that has no imports. [`docs/worklet.js`](docs/worklet.js) runs it in
an AudioWorklet and copies samples out. The page and visuals are plain HTML/JS in [`docs/`](docs/).

wac has no mutable globals, so all of the song's state lives in one `Song` struct that JS holds as an
opaque handle.

## Building

Built with wac at `a3c62236e`. wac is unstable on purpose, so a newer commit may need changes.

```sh
curl -fsSL https://raw.githubusercontent.com/voltrevo/wac/master/bootstrap.sh | sh -s -- --host nodejs
./build.sh                          # writes docs/song.wasm
node tools/render.mjs docs/song.wasm sweep.wav   # levels at fixed intensities, and a 3-minute sweep
```

Browsers need WebAssembly GC: Chrome 119+, Firefox 120+, Safari 18.2+.

# chipdial

One chiptune song with a dial from **chill** to **intense**, for working to. **[Play it](https://botreevo.github.io/chipdial/)**

All of it is [wac](https://github.com/voltrevo/wac): the synth, the screen, and the page. There is no JavaScript of
its own; the page is built by wac's [`web`](https://github.com/voltrevo/wac/tree/master/projects/web).

Turning the dial doesn't switch between tracks. Each feature of the song depends on one smoothed intensity value:

| as intensity rises | |
|---|---|
| layers fade in | pad (always) → arp 0.1 → bass 0.25 → hats 0.38 → kick 0.45 → snare 0.6 → lead 0.7 |
| drums and bass gain hits | every step has a threshold, so hits are only added and the groove builds rather than reshuffling |
| arp | eighths, then the sixteenths between them from 0.45 |
| timbre | filters open, pulse waves narrow, the bass picks up a square |
| tempo | glides from 82 to 128 BPM |

The intensity follows the dial with a time constant of 0.4 s, so a sudden move becomes a short build-up or wind-down
rather than a cut. The dial
is kept in the address (`#t=420`), so a reload or a link comes back to the same place.

## How it's made

- [`src/song.wac`](src/song.wac): the song. `render` fills a block of stereo samples from the dial's value.
- [`src/app.wac`](src/app.wac): the page. A tenth of a second at a time it renders a chunk into a stereo sound and
  plays it after the one before (`Sound.playAfter`, which starts it on the sample the last one ends on, by the
  audio's own clock), then forgets it (`Sound.forget`), keeping about 0.3 s queued — 3 s while the tab is hidden. It is
  fed from the program's own timer, not from frames, which a browser stops in a hidden tab. Volume fades what is
  already queued, so it changes at once.
- [`src/spectrum.wac`](src/spectrum.wac): the spectrum the screen draws, made the way the browser's AnalyserNode makes
  one (2048-point FFT under a Blackman window, smoothed 0.75, -100 to -30 dB), since the page has no AnalyserNode of
  its own sound to ask. Against Chromium's on the same signal: 1016 of 1024 bins identical, the rest within 1.
- [`src/font.wac`](src/font.wac): Press Start 2P, embedded (OFL, [`fonts/`](fonts/)).
- [`test/song_test.wac`](test/song_test.wac): the song is finite, never past full scale, louder as the dial rises,
  and its layers come in where they should.

## Building

wac, and web at the commit `wac.lock` pins (`projects/web` of wac's repository) in the package cache:

```sh
curl -fsSL https://raw.githubusercontent.com/voltrevo/wac/master/bootstrap.sh | sh -s -- --host deno
wac task build    # docs/index.html, which GitHub Pages serves
wac task test
```

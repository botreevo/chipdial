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

The intensity follows the dial over about a second, so a sudden move becomes a short build-up or wind-down. The dial
is kept in the address (`#t=420`), so a reload or a link comes back to the same place.

## How it's made

- [`src/song.wac`](src/song.wac): the song. `render` fills a block of stereo samples from the dial's value.
- [`src/app.wac`](src/app.wac): the page. A quarter of a second at a time it renders a chunk into a stereo sound and
  plays it after the one before (`Sound.playAfter`, which starts it on the sample the last one ends on, by the
  audio's own clock), then forgets it (`Sound.forget`), keeping about 0.7 s queued. The screen is drawn with
  `pixels()` from a snapshot each chunk leaves — its waveform, its step, each layer's loudest — shown when that chunk
  is heard, not when it was rendered.
- [`test/song_test.wac`](test/song_test.wac): the song is finite, never past full scale, louder as the dial rises,
  and its layers come in where they should.

## Building

wac, and web at the commit `wac.lock` pins (`projects/web` of wac's repository) in the package cache:

```sh
curl -fsSL https://raw.githubusercontent.com/voltrevo/wac/master/bootstrap.sh | sh -s -- --host deno
wac task build    # docs/index.html, which GitHub Pages serves
wac task test
```

// Mirrors the thresholds in src/song.wac, only to light the layer indicators.
const LAYERS = [
  ['pad', () => 1], ['arp', t => ss(0.1, 0.28, t)], ['bass', t => ss(0.25, 0.35, t)],
  ['hats', t => ss(0.38, 0.48, t)], ['kick', t => ss(0.45, 0.55, t)],
  ['snare', t => ss(0.6, 0.7, t)], ['lead', t => ss(0.7, 0.85, t)],
];
const MOODS = [[0.1, 'drift'], [0.3, 'calm'], [0.5, 'focus'], [0.7, 'flow'], [0.88, 'drive'], [2, 'blaze']];
function ss(a, b, x) { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); }

const $ = id => document.getElementById(id);
const dial = $('dial'), vol = $('vol'), play = $('play'), err = $('err');
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
if (store.get('dial') != null) dial.value = store.get('dial');
if (store.get('vol') != null) vol.value = store.get('vol');

const steps = $('steps'); for (let i = 0; i < 16; i++) steps.appendChild(document.createElement('i'));
const layersEl = $('layers');
for (const [name] of LAYERS) { const d = document.createElement('div'); d.textContent = name; layersEl.appendChild(d); }

let ctx, node, gain, analyser, playing = false, shownT = dial.value / 1000;
const target = () => dial.value / 1000;

function paintDial(t) {
  const hue = t < 0.5 ? lerpColor([70, 200, 216], [194, 140, 255], t * 2) : lerpColor([194, 140, 255], [255, 90, 122], t * 2 - 1);
  document.documentElement.style.setProperty('--accent', `rgb(${hue})`);
  $('mood').textContent = MOODS.find(([edge]) => t < edge)[1];
  layersEl.childNodes.forEach((el, i) => el.style.setProperty('--lvl', 0.15 + 0.85 * LAYERS[i][1](t)));
}
function lerpColor(a, b, u) { return a.map((v, i) => Math.round(v + (b[i] - v) * u)).join(','); }
paintDial(shownT);

async function start() {
  ctx = new AudioContext({ latencyHint: 'playback' });
  const wasm = await (await fetch('song.wasm')).arrayBuffer();
  await ctx.audioWorklet.addModule('worklet.js');
  node = new AudioWorkletNode(ctx, 'chipdial', { numberOfInputs: 0, outputChannelCount: [2], processorOptions: { wasm, start: target() } });
  node.onprocessorerror = () => { err.textContent = 'The synth stopped. This browser may not support WebAssembly GC.'; };
  node.port.onmessage = e => { const s = e.data.step % 16; steps.childNodes.forEach((el, i) => el.classList.toggle('on', i === s)); shownT = e.data.t; };
  gain = ctx.createGain(); analyser = ctx.createAnalyser(); analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0.75;
  node.connect(gain).connect(analyser).connect(ctx.destination);
  applyVol(); applyDial(); draw();
}

async function toggle() {
  try {
    if (!ctx) await start();
    if (playing) { await ctx.suspend(); } else { await ctx.resume(); }
    playing = !playing;
    play.innerHTML = playing ? '&#10074;&#10074; pause' : '&#9654; play';
  } catch (e) {
    err.textContent = 'Could not start audio: ' + e.message;
  }
}
function applyDial() { if (node) node.parameters.get('intensity').value = target(); store.set('dial', dial.value); }
function applyVol() { const v = vol.value / 100; if (gain) gain.gain.setTargetAtTime(v * v, ctx.currentTime, 0.05); store.set('vol', vol.value); }

play.addEventListener('click', toggle);
dial.addEventListener('input', () => { applyDial(); if (!playing) { shownT = target(); paintDial(shownT); } });
vol.addEventListener('input', applyVol);
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' && e.key !== ' ') return;
  if (e.key === ' ') { e.preventDefault(); toggle(); }
  else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { dial.value = +dial.value + 20; applyDial(); }
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { dial.value = +dial.value - 20; applyDial(); }
});

// A chunky spectrum: 34 columns of 10-pixel blocks.
const cv = $('scope'), g = cv.getContext('2d');
function draw() {
  requestAnimationFrame(draw);
  paintDial(shownT);
  const bins = new Uint8Array(analyser.frequencyBinCount); analyser.getByteFrequencyData(bins);
  const W = cv.width, H = cv.height, cols = 34, cw = W / cols, block = 10;
  g.fillStyle = '#08070e'; g.fillRect(0, 0, W, H);
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent');
  for (let c = 0; c < cols; c++) {
    const lo = Math.floor(2 * Math.pow(400, c / cols)), hi = Math.max(lo + 1, Math.floor(2 * Math.pow(400, (c + 1) / cols)));
    let m = 0; for (let i = lo; i < hi && i < bins.length; i++) m = Math.max(m, bins[i]);
    const n = Math.round((m / 255) * (H / block));
    for (let r = 0; r < n; r++) {
      g.fillStyle = r > H / block - 4 ? '#ff5a7a' : accent;
      g.fillRect(c * cw + 2, H - (r + 1) * block + 2, cw - 4, block - 4);
    }
  }
}

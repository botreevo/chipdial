// Hosts the wac song. All the sound is in song.wasm; this only moves samples.
class ChipDial extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'intensity', defaultValue: 0.3, minValue: 0, maxValue: 1, automationRate: 'k-rate' }];
  }
  constructor(options) {
    super();
    const { wasm, start } = options.processorOptions;
    this.x = new WebAssembly.Instance(new WebAssembly.Module(wasm), {}).exports;
    this.song = this.x.create(sampleRate, 128);
    this.x.jump(this.song, start);
    this.lastStep = -1;
  }
  process(_inputs, outputs, params) {
    const out = outputs[0];
    const L = out[0], R = out[1] || out[0];
    const { x, song } = this;
    x.render(song, params.intensity[0], L.length);
    for (let i = 0; i < L.length; i++) { L[i] = x.left(song, i); R[i] = x.right(song, i); }
    const step = x.step(song);
    if (step !== this.lastStep) { this.lastStep = step; this.port.postMessage({ step, t: x.intensity(song) }); }
    return true;
  }
}
registerProcessor('chipdial', ChipDial);

import { readFileSync, writeFileSync } from 'node:fs';
const x = new WebAssembly.Instance(new WebAssembly.Module(readFileSync(process.argv[2])), {}).exports;
const R = 48000, B = 128;
function run(secs, tfn, jump) {
  const s = x.create(R, B); if (jump != null) x.jump(s, jump);
  const n = Math.floor(secs * R / B); const L = new Float32Array(n * B), Rr = new Float32Array(n * B);
  for (let b = 0; b < n; b++) { x.render(s, tfn(b * B / R), B); for (let i = 0; i < B; i++) { L[b*B+i] = x.left(s, i); Rr[b*B+i] = x.right(s, i); } }
  return [L, Rr];
}
function stats([L, R]) { let p = 0, e = 0; for (let i = 0; i < L.length; i++) { p = Math.max(p, Math.abs(L[i]), Math.abs(R[i])); e += L[i]*L[i] + R[i]*R[i]; } return { peak: +p.toFixed(3), rms: +Math.sqrt(e / (2*L.length)).toFixed(3), nan: L.some(Number.isNaN) }; }
function wav(name, [L, R]) {
  const n = L.length, buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(R_, 24); buf.writeUInt32LE(R_ * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { buf.writeInt16LE(Math.round(L[i] * 32767), 44 + i*4); buf.writeInt16LE(Math.round(R[i] * 32767), 46 + i*4); }
  writeFileSync(name, buf);
}
const R_ = R;
for (const t of [0, 0.2, 0.4, 0.6, 0.8, 1]) console.log('t=' + t, stats(run(12, () => t, t)));
const sweep = run(180, sec => sec / 170, 0);
console.log('sweep', stats(sweep));
// windowed RMS along the sweep (2s windows) to look for jumps
const w = 2 * R, rows = [];
for (let i = 0; i + w <= sweep[0].length; i += w) { let e = 0; for (let j = i; j < i + w; j++) e += sweep[0][j]**2; rows.push(Math.sqrt(e / w).toFixed(3)); }
console.log(rows.join(' '));
if (process.argv[3]) wav(process.argv[3], sweep);

/**
 * Sound effects, synthesised with the Web Audio API (no audio files to download).
 *
 *   playSound('whoosh')  - paper plane flying past      playSound('stamp')   - rubber stamp slam
 *   playSound('tearStub') / ('tearHalf') - paper ripping playSound('success') - confirmation chime
 *   ... see SOUNDS below.
 *
 * Browsers only allow audio after a user gesture, so the AudioContext is created
 * lazily on the first sound. A mute switch (navbar) is remembered in localStorage.
 */

const KEY = 'vjti_sound';

function readPref() {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
}

let enabled = readPref();
const listeners = new Set();

export function isSoundEnabled() { return enabled; }
export function setSoundEnabled(v) {
  enabled = !!v;
  try { localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch { /* storage unavailable */ }
  listeners.forEach(l => l());
}
export function subscribeSound(l) { listeners.add(l); return () => listeners.delete(l); }

// ───────────────────────── audio graph ─────────────────────────

const noiseCache = new WeakMap();
function noiseBuffer(ctx) {
  let buf = noiseCache.get(ctx);
  if (!buf) {
    buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noiseCache.set(ctx, buf);
  }
  return buf;
}

/** master gain -> gentle compressor (prevents clipping when sounds overlap) -> speakers */
function buildMaster(ctx) {
  const master = ctx.createGain();
  master.gain.value = 0.7;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 6;
  master.connect(comp);
  comp.connect(ctx.destination);
  return master;
}

let live = null; // { ctx, master }
function liveGraph() {
  if (!live) {
    const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return null;
    const ctx = new AC();
    live = { ctx, master: buildMaster(ctx) };
  }
  return live;
}

export function audioReady() { return !!live && live.ctx.state === 'running'; }

/** Call from a click/tap handler to satisfy the browser's autoplay rules. */
export async function unlockAudio() {
  const g = liveGraph();
  if (!g) return false;
  try { await g.ctx.resume(); } catch { /* ignore */ }
  return g.ctx.state === 'running';
}

// ───────────────────────── primitives ─────────────────────────

/** A shaped burst of filtered noise. */
function noise(ctx, out, { t, dur, f0, f1, q = 1, g = 0.3, attack = 0.004, type = 'bandpass', pan = 0 }) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  const filt = ctx.createBiquadFilter();
  filt.type = type;
  filt.Q.value = q;
  filt.frequency.setValueAtTime(f0, t);
  if (f1) filt.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(g, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filt);
  filt.connect(gain);
  let tail = gain;
  if (pan && ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    gain.connect(p);
    tail = p;
  }
  tail.connect(out);
  src.start(t, Math.random() * 2);
  src.stop(t + dur + 0.05);
}

/** A pitched tone with an exponential decay. */
function tone(ctx, out, { t, f0, f1, dur, type = 'sine', g = 0.25, attack = 0.004 }) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  if (f1) osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(g, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain);
  gain.connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

/** Paper ripping: a rapid scatter of short, bright noise grains that swells and fades. */
function rip(ctx, out, t0, len, intensity, band) {
  let t = t0;
  const end = t0 + len;
  while (t < end) {
    const p = (t - t0) / len;
    const shape = Math.pow(Math.sin(Math.PI * Math.min(p * 1.08, 1)), 0.7);
    const f = band[0] + Math.random() * (band[1] - band[0]);
    noise(ctx, out, {
      t, dur: 0.01 + Math.random() * 0.026, f0: f, q: 1.4 + Math.random() * 3,
      g: intensity * 0.55 * shape * (0.45 + Math.random() * 0.75), attack: 0.002,
    });
    t += 0.007 + Math.random() * 0.03 * (1.25 - shape * 0.6);
  }
  // continuous fibre "hiss" under the grains
  noise(ctx, out, { t: t0, dur: len, f0: 3600, q: 0.6, g: intensity * 0.12, attack: len * 0.25 });
}

const creaks = (ctx, out, t0, times, g = 0.12) => times.forEach(dt =>
  noise(ctx, out, { t: t0 + dt, dur: 0.06, f0: 800 + Math.random() * 700, q: 4, g, attack: 0.01 }));

// ───────────────────────── the sounds ─────────────────────────

const SOUNDS = {
  /** Paper plane passing by: air whoosh that sweeps up and away, left -> right (matches the 2.6s flight). */
  whoosh(ctx, out, t) {
    const dur = 2.6;
    const layer = (f0, f1, f2, q, peak, type) => {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx);
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = type;
      bp.Q.value = q;
      bp.frequency.setValueAtTime(f0, t);
      bp.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.48);
      bp.frequency.exponentialRampToValueAtTime(f2, t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + dur * 0.48);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      src.connect(bp);
      bp.connect(g);
      let tail = g;
      if (ctx.createStereoPanner) {
        const p = ctx.createStereoPanner();
        p.pan.setValueAtTime(-0.9, t);
        p.pan.linearRampToValueAtTime(0.9, t + dur);
        g.connect(p);
        tail = p;
      }
      tail.connect(out);
      src.start(t, Math.random() * 2);
      src.stop(t + dur + 0.05);
    };
    layer(260, 2400, 420, 0.9, 1.0, 'bandpass');   // main air sweep
    layer(120, 600, 160, 0.6, 0.6, 'lowpass');       // low body
  },

  /** Rubber stamp: a quick swoosh down, then a heavy thud with a paper "slap". Impact at +0.46s. */
  stamp(ctx, out, t) {
    noise(ctx, out, { t, dur: 0.45, f0: 500, f1: 3200, q: 0.8, g: 0.22, attack: 0.3, type: 'highpass' });
    const hit = t + 0.46;
    tone(ctx, out, { t: hit, f0: 170, f1: 42, dur: 0.3, g: 0.9, attack: 0.002 });
    noise(ctx, out, { t: hit, dur: 0.11, f0: 1100, q: 0.7, g: 0.6, attack: 0.001, type: 'lowpass' });
    noise(ctx, out, { t: hit, dur: 0.03, f0: 3500, q: 0.7, g: 0.28, attack: 0.001, type: 'highpass' });
    noise(ctx, out, { t: hit + 0.05, dur: 0.18, f0: 300, q: 1, g: 0.12, attack: 0.01, type: 'lowpass' }); // body ring-out
  },

  /** The ADMITTED stamp landing on the torn ticket (impact immediately). */
  stampThump(ctx, out, t) {
    tone(ctx, out, { t, f0: 150, f1: 48, dur: 0.24, g: 0.9, attack: 0.002 });
    noise(ctx, out, { t, dur: 0.09, f0: 1000, q: 0.7, g: 0.6, attack: 0.001, type: 'lowpass' });
    noise(ctx, out, { t, dur: 0.025, f0: 3300, q: 0.7, g: 0.3, attack: 0.001, type: 'highpass' });
  },

  /** Stub being torn off a ticket (matches the 2.1s scan animation): creaks -> rip -> snap -> flutter. */
  tearStub(ctx, out, t) {
    creaks(ctx, out, t, [0.04, 0.14, 0.27]);
    rip(ctx, out, t + 0.4, 0.78, 1, [2200, 6500]);
    noise(ctx, out, { t: t + 1.18, dur: 0.03, f0: 3000, q: 0.8, g: 0.35, attack: 0.001, type: 'highpass' });
    tone(ctx, out, { t: t + 1.18, f0: 700, f1: 300, dur: 0.05, g: 0.12 });
    rip(ctx, out, t + 1.25, 0.6, 0.22, [3000, 7000]);
  },

  /** Whole ticket ripped in two (matches the 2.4s cancel animation): deeper, longer, two pulls. */
  tearHalf(ctx, out, t) {
    creaks(ctx, out, t, [0.05, 0.15, 0.28, 0.4], 0.14);
    tone(ctx, out, { t: t + 0.48, f0: 115, f1: 70, dur: 0.25, g: 0.22 });
    rip(ctx, out, t + 0.5, 1.05, 1.35, [1400, 5000]);
    rip(ctx, out, t + 0.95, 0.62, 0.95, [2500, 7000]);
    noise(ctx, out, { t: t + 1.5, dur: 0.035, f0: 2800, q: 0.8, g: 0.4, attack: 0.001, type: 'highpass' });
    rip(ctx, out, t + 1.55, 0.75, 0.3, [3000, 7000]);
  },

  /** Entry scanner beep-beep. */
  admit(ctx, out, t) {
    tone(ctx, out, { t, f0: 1568, dur: 0.1, type: 'square', g: 0.4, attack: 0.002 });
    tone(ctx, out, { t: t + 0.12, f0: 2093, dur: 0.18, type: 'square', g: 0.4, attack: 0.002 });
  },

  /** Cheerful confirmation arpeggio. */
  success(ctx, out, t) {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      tone(ctx, out, { t: t + i * 0.085, f0: f, dur: 0.45, g: 0.35 });
      tone(ctx, out, { t: t + i * 0.085, f0: f * 2, dur: 0.3, g: 0.08, type: 'triangle' });
    });
  },

  /** Triumphant little fanfare (results declared). */
  fanfare(ctx, out, t) {
    [[392, 0], [523.25, 0.13], [659.25, 0.26], [783.99, 0.4]].forEach(([f, dt]) => {
      tone(ctx, out, { t: t + dt, f0: f, dur: 0.35, type: 'sawtooth', g: 0.07 });
      tone(ctx, out, { t: t + dt, f0: f, dur: 0.35, type: 'triangle', g: 0.14 });
    });
    [523.25, 659.25, 783.99, 1046.5].forEach(f => tone(ctx, out, { t: t + 0.58, f0: f, dur: 0.9, type: 'triangle', g: 0.12 }));
    noise(ctx, out, { t: t + 0.58, dur: 0.5, f0: 5000, q: 0.6, g: 0.07, attack: 0.01, type: 'highpass' }); // cymbal shimmer
  },

  welcome(ctx, out, t) {
    tone(ctx, out, { t, f0: 659.25, dur: 0.3, g: 0.4 });
    tone(ctx, out, { t: t + 0.11, f0: 880, dur: 0.5, g: 0.45 });
  },

  /** Soft toast pop. */
  pop(ctx, out, t) { tone(ctx, out, { t, f0: 520, f1: 900, dur: 0.09, g: 0.95 }); },

  /** Low buzz for errors. */
  error(ctx, out, t) {
    tone(ctx, out, { t, f0: 190, f1: 130, dur: 0.24, type: 'square', g: 0.3 });
    tone(ctx, out, { t: t + 0.13, f0: 150, f1: 105, dur: 0.24, type: 'square', g: 0.3 });
  },

  tick(ctx, out, t) { tone(ctx, out, { t, f0: 1500, f1: 1100, dur: 0.045, g: 0.9 }); },

  /** Notification bell. */
  ping(ctx, out, t) {
    tone(ctx, out, { t, f0: 1174.66, dur: 0.6, g: 0.5 });
    tone(ctx, out, { t, f0: 1760, dur: 0.4, g: 0.18 });
  },

  /** Paper being picked up / slid out (opening a ticket). */
  paper(ctx, out, t) {
    noise(ctx, out, { t, dur: 0.22, f0: 2200, f1: 3400, q: 0.8, g: 0.55, attack: 0.05 });
    noise(ctx, out, { t: t + 0.05, dur: 0.12, f0: 5200, q: 1, g: 0.25, attack: 0.02 });
  },

  /** Paper being scrunched (deleting). */
  crumple(ctx, out, t) {
    for (let i = 0; i < 9; i++) {
      noise(ctx, out, { t: t + i * 0.04 + Math.random() * 0.02, dur: 0.035, f0: 1200 + Math.random() * 2600, q: 2, g: 0.6, attack: 0.002 });
    }
  },
};

// Some sounds are layered combos
SOUNDS.scanTear = (ctx, out, t) => {
  SOUNDS.tearStub(ctx, out, t);
  SOUNDS.stampThump(ctx, out, t + 2.08);   // the ADMITTED stamp slams down at the end of the tear
};

export const SOUND_NAMES = Object.keys(SOUNDS);

/** Play a named sound. Safe to call anywhere: it silently does nothing if muted or unsupported. */
export function playSound(name, { delay = 0 } = {}) {
  if (!enabled || !SOUNDS[name]) return;
  // lets tests / debugging see which sound fired
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('vjti-sound', { detail: name }));
  try {
    const g = liveGraph();
    if (!g) return;
    if (g.ctx.state === 'suspended') g.ctx.resume().catch(() => {});
    SOUNDS[name](g.ctx, g.master, g.ctx.currentTime + delay + 0.02);
  } catch { /* audio is optional; never break the UI */ }
}

/** Render a sound offline and report loudness (used to verify the synthesis without speakers). */
export async function renderOffline(name, seconds = 3.5) {
  const ctx = new OfflineAudioContext(2, Math.ceil(44100 * seconds), 44100);
  SOUNDS[name](ctx, buildMaster(ctx), 0);
  const buf = await ctx.startRendering();
  const d = buf.getChannelData(0);
  let peak = 0;
  let sum = 0;
  let first = -1;
  let last = -1;
  for (let i = 0; i < d.length; i++) {
    const a = Math.abs(d[i]);
    if (a > peak) peak = a;
    sum += d[i] * d[i];
    if (a > 0.01) { if (first < 0) first = i; last = i; }
  }
  return { name, peak: +peak.toFixed(3), rms: +Math.sqrt(sum / d.length).toFixed(4), startSec: first < 0 ? null : +(first / 44100).toFixed(2), endSec: last < 0 ? null : +(last / 44100).toFixed(2) };
}

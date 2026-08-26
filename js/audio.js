// ============================================================
// DOUBLE LIFE v2 - audio.js
// Synth-only audio. Wet, gritty, low. One-shot sfx recipes,
// live loop textures (drill, scrape, suction, carve) and a
// small sequencer for the swamp/clinic tunes.
// ============================================================
(function () {
  const G = window.GAME;
  let ctx = null, master = null, noiseBuf = null;
  const loops = {};
  const A = (G.audio = { mode: null });

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.8;
      master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return true;
    } catch (e) { ctx = null; return false; }
  }

  A.unlock = function () {
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  };
  function muted() { return G.state && G.state.muted; }

  function env(t0, peak, dur, curve) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.006);
    if (curve === 'exp') g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    else g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    g.connect(master);
    return g;
  }
  function osc(type, freq, t0, dur, peak, freqEnd) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur);
    o.connect(env(t0, peak, dur, 'exp'));
    o.start(t0); o.stop(t0 + dur + 0.03);
  }
  function noise(t0, dur, peak, filterType, freq, q, freqEnd) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf; src.loop = true;
    let node = src;
    if (filterType) {
      const f = ctx.createBiquadFilter();
      f.type = filterType; f.frequency.setValueAtTime(freq, t0); f.Q.value = q || 1;
      if (freqEnd) f.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), t0 + dur);
      src.connect(f); node = f;
    }
    node.connect(env(t0, peak, dur));
    src.start(t0); src.stop(t0 + dur + 0.03);
  }
  const N2F = (m) => 440 * Math.pow(2, (m - 69) / 12);

  A.sfx = function (name, p) {
    if (!ensure() || muted()) return;
    A.unlock();
    const t = ctx.currentTime;
    p = p || {};
    switch (name) {
      case 'click': osc('square', 300, t, 0.045, 0.07, 200); break;
      case 'clack': osc('square', 180, t, 0.05, 0.08, 90); noise(t, 0.04, 0.05, 'lowpass', 1400); break;
      case 'hover': osc('square', 520, t, 0.02, 0.025); break;
      case 'back': osc('square', 260, t, 0.06, 0.06, 150); break;
      case 'denied': osc('sawtooth', 150, t, 0.1, 0.08, 80); osc('sawtooth', 120, t + 0.1, 0.16, 0.07, 60); break;
      case 'coin': osc('square', N2F(80), t, 0.05, 0.06); osc('square', N2F(87), t + 0.05, 0.14, 0.06); break;
      case 'buy': A.sfx('coin'); osc('triangle', N2F(72), t + 0.05, 0.2, 0.07); break;
      case 'unlock': [60, 67, 72, 76].forEach((n, i) => osc('triangle', N2F(n), t + i * 0.08, 0.3, 0.07));
        noise(t, 0.5, 0.02, 'highpass', 3000); break;

      // --- parlour ---
      case 'carve': noise(t, 0.1, 0.09, 'bandpass', 700, 1.4); osc('sawtooth', 90, t, 0.09, 0.05, 60); break;
      case 'carveTick': noise(t, 0.03, 0.05, 'bandpass', 400 + (p.f || 0) * 900, 3); break;
      case 'scoopOff': osc('sine', 260, t, 0.14, 0.16, 70); noise(t, 0.09, 0.09, 'lowpass', 700); break;
      case 'plop': osc('sine', 200, t, 0.16, 0.2, 55); noise(t + 0.01, 0.1, 0.09, 'lowpass', 420); break;
      case 'splat': noise(t, 0.22, 0.16, 'lowpass', 380, 1, 120); osc('sine', 120, t, 0.14, 0.12, 45); break;
      case 'squelch': noise(t, 0.2, 0.11, 'bandpass', 500, 0.7, 180); osc('sine', 90, t, 0.16, 0.08, 50); break;
      case 'pour': noise(t, 0.14, 0.06, 'lowpass', 600); break;
      case 'grit': osc('square', G.rand(1400, 2400), t, 0.018, 0.03); break;
      case 'grab': osc('square', 240, t, 0.045, 0.06, 340); break;
      // the cat: a low warm flutter, amplitude-wobbled by two detuned saws
      case 'purr': for (let i = 0; i < 12; i++) osc('sine', 58 + (i % 2) * 6, t + i * 0.045, 0.055, 0.055, 44);
        noise(t, 0.5, 0.012, 'lowpass', 300); break;
      // a shell coming off: a snap, a hiss, then a warm chord
      case 'reveal': osc('square', 180, t, 0.05, 0.09, 900);
        noise(t + 0.03, 0.4, 0.07, 'highpass', 1400, 0.8);
        [60, 64, 67, 72].forEach((n, i) => osc('triangle', N2F(n), t + 0.14 + i * 0.06, 0.36, 0.06)); break;
      case 'step': noise(t, 0.05, 0.035, 'lowpass', 500); osc('sine', 90, t, 0.04, 0.04, 60); break;
      case 'shutter': noise(t, 0.35, 0.1, 'lowpass', 700, 1, 200); osc('sawtooth', 140, t, 0.3, 0.05, 40); break;
      case 'bell': osc('triangle', 1320, t, 0.35, 0.09); osc('triangle', 1760, t + 0.02, 0.45, 0.04); break;
      case 'doorbell': osc('triangle', 660, t, 0.3, 0.09); osc('triangle', 494, t + 0.16, 0.4, 0.09);
        noise(t, 0.3, 0.015, 'highpass', 2000); break;
      case 'chew': for (let i = 0; i < 4; i++) { osc('square', 120, t + i * 0.11, 0.06, 0.07, 80);
        noise(t + i * 0.11, 0.05, 0.05, 'lowpass', 900); } break;
      case 'perfect': [67, 72, 76, 79, 84].forEach((n, i) => osc('triangle', N2F(n), t + i * 0.055, 0.2, 0.07)); break;
      case 'good': [67, 74, 79].forEach((n, i) => osc('triangle', N2F(n), t + i * 0.07, 0.16, 0.06)); break;
      case 'bad': osc('sawtooth', N2F(53), t, 0.2, 0.07); osc('sawtooth', N2F(49), t + 0.18, 0.3, 0.07); break;

      // --- clinic ---
      case 'probe': osc('sine', 1400, t, 0.05, 0.05); osc('sine', 1900, t + 0.04, 0.07, 0.04); break;
      case 'bookOpen': noise(t, 0.22, 0.06, 'lowpass', 1600); osc('sine', 140, t, 0.12, 0.05, 90); break;
      case 'bookFlip': noise(t, 0.11, 0.05, 'highpass', 1800); break;
      case 'dxRight': [72, 79, 84].forEach((n, i) => osc('triangle', N2F(n), t + i * 0.06, 0.22, 0.08)); break;
      case 'dxWrong': osc('sawtooth', 190, t, 0.14, 0.09, 110); osc('sawtooth', 140, t + 0.14, 0.26, 0.09, 70); break;
      case 'scrape': noise(t, 0.09, 0.08, 'bandpass', 2400, 2.4); break;
      case 'crack': noise(t, 0.07, 0.2, 'highpass', 1800); osc('square', 420, t, 0.05, 0.1, 130);
        noise(t + 0.05, 0.2, 0.1, 'lowpass', 700); break;
      case 'wetPull': noise(t, 0.3, 0.14, 'lowpass', 800, 1, 200); osc('sine', 150, t, 0.26, 0.1, 48); break;
      case 'spurt': noise(t, 0.35, 0.17, 'lowpass', 1100, 1, 250); osc('sine', 200, t, 0.2, 0.1, 60); break;
      case 'lance': noise(t, 0.05, 0.13, 'highpass', 2600); osc('sine', 700, t, 0.06, 0.08, 180);
        noise(t + 0.06, 0.3, 0.11, 'lowpass', 500, 1, 160); break;
      case 'nerve': osc('sawtooth', 900, t, 0.16, 0.12, 200); noise(t, 0.2, 0.1, 'highpass', 1400); break;
      case 'fillDone': osc('triangle', N2F(76), t, 0.18, 0.09); osc('triangle', N2F(83), t + 0.08, 0.3, 0.08); break;
      case 'clean': [79, 84, 88].forEach((n, i) => osc('triangle', N2F(n), t + i * 0.05, 0.24, 0.08)); break;
      case 'scream': {
        const o = ctx.createOscillator(); o.type = 'sawtooth';
        o.frequency.setValueAtTime(340, t);
        o.frequency.exponentialRampToValueAtTime(760, t + 0.09);
        o.frequency.exponentialRampToValueAtTime(280, t + 0.5);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 17;
        const lg = ctx.createGain(); lg.gain.value = 42;
        lfo.connect(lg); lg.connect(o.frequency);
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 1.6;
        o.connect(f); f.connect(env(t, 0.11, 0.55));
        o.start(t); o.stop(t + 0.6); lfo.start(t); lfo.stop(t + 0.6);
        noise(t, 0.5, 0.03, 'bandpass', 1500, 1.2);
        break;
      }
      case 'groan': {
        const o = ctx.createOscillator(); o.type = 'sawtooth';
        o.frequency.setValueAtTime(120, t);
        o.frequency.exponentialRampToValueAtTime(78, t + 0.7);
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520;
        o.connect(f); f.connect(env(t, 0.085, 0.75));
        o.start(t); o.stop(t + 0.8);
        break;
      }
      case 'croak': {
        const o = ctx.createOscillator(); o.type = 'square';
        o.frequency.setValueAtTime(150, t);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 26;
        const lg = ctx.createGain(); lg.gain.value = 60;
        lfo.connect(lg); lg.connect(o.frequency);
        o.connect(env(t, 0.075, 0.3));
        o.start(t); o.stop(t + 0.35); lfo.start(t); lfo.stop(t + 0.35);
        break;
      }
      case 'hiss': noise(t, 0.5, 0.055, 'highpass', 4200); break;
      case 'heart': osc('sine', 62, t, 0.16, 0.16, 40); osc('sine', 58, t + 0.2, 0.2, 0.11, 36); break;
      case 'day': [55, 60, 64, 67].forEach((n, i) => osc('triangle', N2F(n), t + i * 0.1, 0.35, 0.08)); break;
      case 'night': [53, 48, 45, 41].forEach((n, i) => osc('sine', N2F(n), t + i * 0.13, 0.5, 0.09)); break;
      case 'swish': noise(t, 0.24, 0.07, 'bandpass', 900, 2); break;

      // --- robots ---
      case 'order': [76, 83, 79].forEach((n, i) => osc('square', N2F(n), t + i * 0.07, 0.08, 0.05)); break;
      case 'servo': osc('sawtooth', 320, t, 0.1, 0.05, 520); noise(t, 0.08, 0.03, 'highpass', 2600); break;
      case 'zap': noise(t, 0.06, 0.16, 'highpass', 3200); osc('square', 1800, t, 0.04, 0.09, 300);
        noise(t + 0.05, 0.14, 0.07, 'bandpass', 1400, 2); break;
      case 'weld': noise(t, 0.3, 0.1, 'bandpass', 2200, 1.4); osc('sawtooth', 120, t, 0.28, 0.05); break;
      case 'clank': osc('square', 180, t, 0.07, 0.11, 90); noise(t, 0.14, 0.12, 'bandpass', 700, 1.6);
        osc('triangle', 900, t, 0.05, 0.05); break;
      case 'boot': [48, 55, 60, 67, 72].forEach((n, i) => osc('square', N2F(n), t + i * 0.06, 0.14, 0.05)); break;
    }
  };

  // ---------- loop textures ----------
  const LOOP_DEFS = {
    carve: () => {
      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 620; f.Q.value = 1.1;
      const g = ctx.createGain(); g.gain.value = 0;
      src.connect(f); f.connect(g); g.connect(master); src.start();
      return { stop: () => { try { src.stop(); } catch (e) {} }, gain: g, peak: 0.13, filter: f };
    },
    drill: () => {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 78;
      const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 156;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 11;
      const lg = ctx.createGain(); lg.gain.value = 16;
      lfo.connect(lg); lg.connect(o.frequency);
      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1100;
      const g = ctx.createGain(); g.gain.value = 0;
      const g2 = ctx.createGain(); g2.gain.value = 0.4;
      o.connect(g); o2.connect(g2); g2.connect(g); src.connect(f); f.connect(g);
      g.connect(master);
      o.start(); o2.start(); lfo.start(); src.start();
      return { stop: () => { try { o.stop(); o2.stop(); lfo.stop(); src.stop(); } catch (e) {} },
               gain: g, peak: 0.07, pitch: o };
    },
    scrape: () => {
      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = 3.2;
      const g = ctx.createGain(); g.gain.value = 0;
      src.connect(f); f.connect(g); g.connect(master); src.start();
      return { stop: () => { try { src.stop(); } catch (e) {} }, gain: g, peak: 0.1, filter: f };
    },
    suction: () => {
      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520; f.Q.value = 4;
      const g = ctx.createGain(); g.gain.value = 0;
      src.connect(f); f.connect(g); g.connect(master); src.start();
      return { stop: () => { try { src.stop(); } catch (e) {} }, gain: g, peak: 0.11 };
    },
    pour: () => {
      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 640;
      const g = ctx.createGain(); g.gain.value = 0;
      src.connect(f); f.connect(g); g.connect(master); src.start();
      return { stop: () => { try { src.stop(); } catch (e) {} }, gain: g, peak: 0.08 };
    },
    goo: () => {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 62;
      const g = ctx.createGain(); g.gain.value = 0;
      o.connect(g); g.connect(master); o.start();
      return { stop: () => { try { o.stop(); } catch (e) {} }, gain: g, peak: 0.07 };
    },
    // low room tone for the clinic
    room: () => {
      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 180;
      const g = ctx.createGain(); g.gain.value = 0;
      src.connect(f); f.connect(g); g.connect(master); src.start();
      return { stop: () => { try { src.stop(); } catch (e) {} }, gain: g, peak: 0.05 };
    },
  };

  A.loop = function (name, on, intensity) {
    if (!ensure()) return;
    if (on && muted()) on = false;
    let L = loops[name];
    if (on) {
      if (!L) L = loops[name] = LOOP_DEFS[name]();
      const it = intensity === undefined ? 1 : G.clamp(intensity, 0, 1);
      L.gain.gain.setTargetAtTime(L.peak * it, ctx.currentTime, 0.04);
      if (L.filter) L.filter.frequency.setTargetAtTime(400 + it * 2400, ctx.currentTime, 0.06);
      if (L.pitch) L.pitch.frequency.setTargetAtTime(64 + it * 46, ctx.currentTime, 0.05);
      if (L.killT) { clearTimeout(L.killT); L.killT = null; }
    } else if (L) {
      L.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      if (!L.killT) L.killT = setTimeout(() => { L.stop(); delete loops[name]; }, 320);
    }
  };
  A.stopAllLoops = function () { for (const k in loops) { try { loops[k].stop(); } catch (e) {} delete loops[k]; } };

  // ---------- music ----------
  const SONGS = {
    day: {   // swamp-funk shuffle, minor
      bpm: 104, steps: 32, leadType: 'square', leadGain: 0.035,
      lead: [64, 0, 67, 0, 71, 0, 67, 0, 69, 0, 67, 0, 64, 0, 62, 0,
             64, 0, 67, 0, 71, 0, 74, 0, 72, 71, 67, 64, 62, 0, 0, 0],
      bass: [40, 35, 38, 33], bassType: 'sawtooth', bassGain: 0.055, hat: 2,
    },
    night: { // clinic dirge
      bpm: 72, steps: 32, leadType: 'sine', leadGain: 0.05,
      lead: [57, 0, 0, 0, 60, 0, 0, 0, 58, 0, 0, 0, 55, 0, 0, 0,
             57, 0, 0, 0, 62, 0, 0, 61, 60, 0, 0, 0, 0, 0, 0, 0],
      bass: [33, 33, 31, 29], bassType: 'sine', bassGain: 0.075, hat: 8,
    },
    title: {
      bpm: 88, steps: 32, leadType: 'triangle', leadGain: 0.05,
      lead: [52, 0, 59, 0, 64, 0, 62, 0, 59, 0, 0, 0, 57, 0, 0, 0,
             52, 0, 59, 0, 64, 0, 67, 0, 66, 64, 62, 59, 57, 0, 0, 0],
      bass: [40, 40, 38, 33], bassType: 'sawtooth', bassGain: 0.06, hat: 4,
    },
  };
  let mStep = 0, mNext = 0;

  A.music = function (mode) {
    if (A.mode === mode) return;
    A.mode = mode;
    mStep = 0;
    if (ctx) mNext = ctx.currentTime + 0.1;
  };
  A.tick = function () {
    if (!ctx || !A.mode || muted()) return;
    if (ctx.state === 'suspended') return;
    const song = SONGS[A.mode];
    if (!song) return;
    const spb = 60 / song.bpm / 2;
    if (mNext < ctx.currentTime - 0.5) mNext = ctx.currentTime + 0.05;
    while (mNext < ctx.currentTime + 0.25) {
      const s = mStep % song.steps;
      const n = song.lead[s];
      if (n) osc(song.leadType, N2F(n), mNext, spb * 1.8, song.leadGain);
      if (s % 8 === 0) osc(song.bassType, N2F(song.bass[Math.floor(s / 8) % song.bass.length]), mNext, spb * 3.4, song.bassGain);
      else if (s % 8 === 4) osc(song.bassType, N2F(song.bass[Math.floor(s / 8) % song.bass.length] + 7), mNext, spb * 2.2, song.bassGain * 0.6);
      if (s % song.hat === 1) noise(mNext, 0.028, 0.011, 'highpass', 6500);
      mStep++;
      mNext += spb;
    }
  };
})();

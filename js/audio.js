// ============================================================
// DOUBLE LIFE - audio.js
// All sound is synthesized with WebAudio: no audio files.
// - one-shot sfx recipes (plops, dings, coins, pops...)
// - loopable textures (scrub, drill, spray, pour) with live gain
// - a tiny 8th-note chiptune sequencer for day/night tunes
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
      master.gain.value = 0.85;
      master.connect(ctx.destination);
      // shared white-noise buffer
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

  function noise(t0, dur, peak, filterType, freq, q) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf; src.loop = true;
    let node = src;
    if (filterType) {
      const f = ctx.createBiquadFilter();
      f.type = filterType; f.frequency.value = freq; f.Q.value = q || 1;
      src.connect(f); node = f;
    }
    node.connect(env(t0, peak, dur));
    src.start(t0); src.stop(t0 + dur + 0.03);
  }

  const N2F = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // ---------- one-shot sfx ----------
  A.sfx = function (name, p) {
    if (!ensure() || muted()) return;
    A.unlock();
    const t = ctx.currentTime;
    p = p || {};
    switch (name) {
      case 'click': osc('square', 660, t, 0.04, 0.06); break;
      case 'hover': osc('square', 880, t, 0.025, 0.03); break;
      case 'coin': osc('square', N2F(83), t, 0.06, 0.07); osc('square', N2F(88), t + 0.06, 0.16, 0.07); break;
      case 'plop':
        osc('sine', 320, t, 0.12, 0.22, 70);
        noise(t + 0.01, 0.09, 0.1, 'lowpass', 500);
        break;
      case 'scoopPop': osc('sine', 200, t, 0.1, 0.16, 480); noise(t, 0.05, 0.06, 'lowpass', 900); break;
      case 'scoopTick': osc('square', 500 + (p.f || 0) * 600, t, 0.03, 0.035); break;
      case 'crumble': noise(t, 0.18, 0.09, 'lowpass', 600); osc('sine', 220, t, 0.15, 0.06, 90); break;
      case 'splat': noise(t, 0.16, 0.14, 'lowpass', 420); osc('sine', 150, t, 0.1, 0.1, 60); break;
      case 'sprinkle': osc('square', G.rand(1500, 2300), t, 0.02, 0.03); break;
      case 'plip': osc('sine', 900, t, 0.06, 0.1, 1400); break;
      case 'grab': osc('square', 300, t, 0.04, 0.05, 420); break;
      case 'back': osc('square', 420, t, 0.05, 0.05, 260); break;
      case 'ding': osc('triangle', N2F(96), t, 0.3, 0.12); osc('triangle', N2F(100), t + 0.07, 0.3, 0.1); break;
      case 'sparkle': osc('triangle', N2F(103), t, 0.2, 0.07); osc('triangle', N2F(108), t + 0.05, 0.25, 0.06); break;
      case 'bell': osc('triangle', 1568, t, 0.4, 0.12); osc('triangle', 2093, t + 0.02, 0.5, 0.05); break;
      case 'dingdong': osc('triangle', 988, t, 0.25, 0.1); osc('triangle', 784, t + 0.18, 0.35, 0.1); break;
      case 'nom': for (let i = 0; i < 3; i++) { osc('square', 160, t + i * 0.12, 0.07, 0.07, 120); noise(t + i * 0.12, 0.05, 0.03, 'lowpass', 800); } break;
      case 'yay': [76, 79, 84].forEach((n, i) => osc('square', N2F(n), t + i * 0.07, 0.14, 0.07)); break;
      case 'perfect': [72, 76, 79, 84, 88].forEach((n, i) => osc('square', N2F(n), t + i * 0.06, 0.18, 0.07)); break;
      case 'sad': osc('square', N2F(64), t, 0.18, 0.07); osc('square', N2F(60), t + 0.2, 0.3, 0.07); break;
      case 'ouch': osc('square', 260, t, 0.08, 0.08, 160); break;
      case 'pullPop': osc('square', 220, t, 0.1, 0.09, 620); noise(t + 0.08, 0.05, 0.06, 'highpass', 1500); break;
      case 'toothClean': [88, 93, 96].forEach((n, i) => osc('triangle', N2F(n), t + i * 0.05, 0.22, 0.09)); break;
      case 'fillDone': osc('triangle', N2F(84), t, 0.2, 0.1); osc('triangle', N2F(91), t + 0.09, 0.3, 0.09); break;
      case 'unlock': [72, 76, 79, 84, 79, 88].forEach((n, i) => osc('square', N2F(n), t + i * 0.07, 0.2, 0.08)); noise(t, 0.4, 0.02, 'highpass', 4000); break;
      case 'day': [67, 72, 76, 79].forEach((n, i) => osc('triangle', N2F(n), t + i * 0.09, 0.3, 0.09)); break;
      case 'night': [64, 60, 57, 55].forEach((n, i) => osc('sine', N2F(n), t + i * 0.11, 0.4, 0.09)); break;
      case 'swish': noise(t, 0.2, 0.08, 'bandpass', 1200, 2); break;
      case 'buy': A.sfx('coin'); A.sfx('yay'); break;
      case 'denied': osc('square', 180, t, 0.09, 0.07); osc('square', 150, t + 0.1, 0.12, 0.07); break;
    }
  };

  // ---------- loop textures ----------
  const LOOP_DEFS = {
    scrub: () => {
      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 1.6;
      const g = ctx.createGain(); g.gain.value = 0;
      src.connect(f); f.connect(g); g.connect(master); src.start();
      return { stop: () => { try { src.stop(); } catch (e) {} }, gain: g, peak: 0.14 };
    },
    drill: () => {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 92;
      const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 184;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 9;
      const lg = ctx.createGain(); lg.gain.value = 14;
      lfo.connect(lg); lg.connect(o.frequency);
      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 900;
      const g = ctx.createGain(); g.gain.value = 0;
      const g2 = ctx.createGain(); g2.gain.value = 0.35;
      o.connect(g); o2.connect(g2); g2.connect(g); src.connect(f); f.connect(g);
      g.connect(master);
      o.start(); o2.start(); lfo.start(); src.start();
      return { stop: () => { try { o.stop(); o2.stop(); lfo.stop(); src.stop(); } catch (e) {} }, gain: g, peak: 0.055 };
    },
    spray: () => {
      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2600;
      const g = ctx.createGain(); g.gain.value = 0;
      src.connect(f); f.connect(g); g.connect(master); src.start();
      return { stop: () => { try { src.stop(); } catch (e) {} }, gain: g, peak: 0.09 };
    },
    pour: () => {
      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 750;
      const g = ctx.createGain(); g.gain.value = 0;
      src.connect(f); f.connect(g); g.connect(master); src.start();
      return { stop: () => { try { src.stop(); } catch (e) {} }, gain: g, peak: 0.08 };
    },
    goo: () => {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 74;
      const g = ctx.createGain(); g.gain.value = 0;
      o.connect(g); g.connect(master); o.start();
      return { stop: () => { try { o.stop(); } catch (e) {} }, gain: g, peak: 0.07 };
    },
  };

  // A.loop('drill', true, 0..1) each frame while active
  A.loop = function (name, on, intensity) {
    if (!ensure()) return;
    if (on && muted()) on = false;
    let L = loops[name];
    if (on) {
      if (!L) { L = loops[name] = LOOP_DEFS[name](); }
      const target = L.peak * (intensity === undefined ? 1 : G.clamp(intensity, 0, 1));
      L.gain.gain.setTargetAtTime(target, ctx.currentTime, 0.04);
      L.lastOn = performance.now();
    } else if (L) {
      L.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      if (!L.killT) L.killT = setTimeout(() => { L.stop(); delete loops[name]; }, 300);
    }
    if (L && on && L.killT) { clearTimeout(L.killT); L.killT = null; }
  };
  A.stopAllLoops = function () { for (const k in loops) { try { loops[k].stop(); } catch (e) {} delete loops[k]; } };

  // ---------- music sequencer ----------
  const SONGS = {
    day: {
      bpm: 118, steps: 32, leadType: 'square', leadGain: 0.042,
      lead: [72, 0, 76, 0, 79, 0, 76, 0, 81, 0, 79, 0, 76, 0, 74, 0,
             72, 0, 76, 0, 79, 0, 84, 0, 81, 79, 76, 74, 72, 0, 0, 0],
      bass: [48, 43, 45, 41], bassType: 'triangle', bassGain: 0.06, hat: 2,
    },
    night: {
      bpm: 84, steps: 32, leadType: 'sine', leadGain: 0.06,
      lead: [69, 0, 0, 72, 0, 0, 74, 0, 76, 0, 0, 74, 72, 0, 0, 0,
             69, 0, 0, 72, 0, 0, 74, 0, 72, 0, 0, 69, 0, 0, 0, 0],
      bass: [45, 40, 41, 43], bassType: 'sine', bassGain: 0.07, hat: 4,
    },
    title: {
      bpm: 100, steps: 32, leadType: 'triangle', leadGain: 0.055,
      lead: [72, 0, 76, 0, 79, 0, 76, 0, 81, 0, 79, 0, 76, 0, 74, 0,
             72, 0, 76, 0, 79, 0, 84, 0, 81, 79, 76, 74, 72, 0, 0, 0],
      bass: [48, 43, 45, 41], bassType: 'triangle', bassGain: 0.055, hat: 2,
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
    const spb = 60 / song.bpm / 2; // 8th notes
    if (mNext < ctx.currentTime - 0.5) mNext = ctx.currentTime + 0.05;
    while (mNext < ctx.currentTime + 0.25) {
      const s = mStep % song.steps;
      const n = song.lead[s];
      if (n) osc(song.leadType, N2F(n), mNext, spb * 1.7, song.leadGain);
      if (s % 8 === 0) osc(song.bassType, N2F(song.bass[(Math.floor(s / 8)) % song.bass.length]), mNext, spb * 3.2, song.bassGain);
      else if (s % 8 === 4) osc(song.bassType, N2F(song.bass[(Math.floor(s / 8)) % song.bass.length] + 7), mNext, spb * 2.2, song.bassGain * 0.7);
      if (s % song.hat === 1) noise(mNext, 0.03, 0.012, 'highpass', 6000);
      mStep++;
      mNext += spb;
    }
  };
})();

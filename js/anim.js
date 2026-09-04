// ============================================================
// DOUBLE LIFE v11 - anim.js  ·  THE PERFORMANCE
//
// Everything in this game used to stand still and wait for the text
// to finish typing. This is the layer that fixes that.
//
// A CLIP is a named piece of acting. Ask for one at a time and you get
// back a POSE: a bag of offsets that the draw code applies to the parts
// it was already drawing. Nothing here draws anything itself, so any
// character - a nineteen-part machine, a human, a dog - can be given a
// walk, a gesture or a reaction without touching its sprite code.
//
// The rules the whole thing obeys:
//   · legs and arms are always in opposition (contralateral gait)
//   · the body bobs at TWICE the stride, because you rise on each step
//   · weight leads: the torso leans into the direction of travel
//   · nothing is ever perfectly still - idle still breathes and blinks
//   · a blink is 0.09s, and it happens on a schedule you cannot predict
// ============================================================
(function () {
  const G = window.GAME;

  // a blink that does not look metronomic: long random gaps, short shut
  function blinkAt(t, seed) {
    const period = 2.6 + ((Math.sin((seed || 0) * 12.9898) * 43758.5453) % 1 + 1) % 1 * 3.4;
    const ph = ((t + (seed || 0) * 7.3) % period) / period;
    return ph > 1 - 0.09 / period * 6 ? 1 : 0;
  }
  // a value that drifts: two slow sines beaten together, never repeating
  // in a way the eye can catch
  function drift(t, a, b) { return Math.sin(t * a) * 0.6 + Math.sin(t * b + 1.7) * 0.4; }

  const CLIP = {
    // ---- standing there, alive ----
    idle(t, o) {
      const br = Math.sin(t * 1.5);
      return {
        bob: br * 0.5, breathe: br,
        sway: drift(t, 0.31, 0.17) * 0.7,
        legL: 0, legR: 0,
        armL: drift(t, 0.4, 0.23) * 0.06, armR: drift(t, 0.37, 0.19) * 0.06,
        headTurn: drift(t, 0.23, 0.13) * 0.14,
        headTilt: drift(t, 0.19, 0.29) * 0.08,
        blink: blinkAt(t, o.seed),
      };
    },

    // ---- a walk cycle. The one thing that makes a crowd a crowd. ----
    walk(t, o) {
      const sp = o.speed === undefined ? 1 : o.speed;
      const ph = t * 5.4 * sp;
      const s = Math.sin(ph);
      return {
        // rise twice per stride, and dip lowest at the passing position
        bob: -Math.abs(Math.cos(ph)) * 1.5 + 0.7,
        breathe: Math.sin(t * 2.2) * 0.4,
        sway: Math.sin(ph * 0.5) * 0.5,
        lean: 0.22 * (o.dir === undefined ? 1 : o.dir),
        legL: s, legR: -s,
        armL: -s * 0.8, armR: s * 0.8,          // opposition
        headTurn: (o.dir === undefined ? 1 : o.dir) * 0.1 + Math.sin(ph) * 0.04,
        headTilt: Math.cos(ph) * 0.05,
        step: s,                                 // for footfall dust
        blink: blinkAt(t, o.seed),
      };
    },

    // ---- flat out, which is what a rout looks like ----
    run(t, o) {
      const sp = o.speed === undefined ? 1 : o.speed;
      const ph = t * 9 * sp;
      const s = Math.sin(ph);
      return {
        bob: -Math.abs(Math.cos(ph)) * 3 + 1.4,
        breathe: Math.sin(t * 5) * 0.8,
        sway: Math.sin(ph * 0.5) * 0.8,
        lean: 0.7 * (o.dir === undefined ? 1 : o.dir),
        legL: s * 1.5, legR: -s * 1.5,
        armL: -s * 1.4, armR: s * 1.4,
        headTurn: (o.dir === undefined ? 1 : o.dir) * 0.2,
        headTilt: -0.1,
        step: s,
        blink: 0,
      };
    },

    // ---- mid-sentence. Mouth, head and one hand, all on the beat. ----
    talk(t, o) {
      const em = o.emph === undefined ? 1 : o.emph;
      const m = Math.abs(Math.sin(t * 8.4)) * 0.7 + Math.abs(Math.sin(t * 13.1)) * 0.3;
      return {
        bob: Math.sin(t * 1.6) * 0.5 - m * 0.5,
        breathe: Math.sin(t * 1.6),
        sway: drift(t, 0.4, 0.27) * 0.7,
        legL: 0, legR: 0,
        armL: drift(t, 1.7, 2.6) * 0.22 * em, armR: drift(t, 2.1, 1.3) * 0.3 * em,
        headTurn: drift(t, 0.7, 1.3) * 0.16,
        headTilt: Math.sin(t * 3.1) * 0.1 * em,
        mouth: m,
        blink: blinkAt(t, o.seed),
      };
    },

    // ---- putting a hand out. p drives it, so the shot can time it. ----
    reach(t, o) {
      const p = G.clamp(o.p === undefined ? 1 : o.p, 0, 1);
      const e = G.easeOut(p);
      return {
        bob: Math.sin(t * 1.5) * 0.4,
        breathe: Math.sin(t * 1.5) * 0.6,
        lean: e * 0.5 * (o.dir === undefined ? 1 : o.dir),
        legL: e * 0.2, legR: -e * 0.1,
        armL: (o.dir === undefined || o.dir > 0) ? -0.2 * e : -1.5 * e,
        armR: (o.dir === undefined || o.dir > 0) ? 1.5 * e : 0.2 * e,
        reach: e,
        headTurn: e * 0.3 * (o.dir === undefined ? 1 : o.dir),
        headTilt: e * 0.12,
        blink: blinkAt(t, o.seed),
      };
    },

    // ---- taking something, then holding it up to look at it ----
    take(t, o) {
      const p = G.clamp(o.p === undefined ? 1 : o.p, 0, 1);
      const grab = G.clamp(p * 2.2, 0, 1), up = G.clamp((p - 0.5) / 0.5, 0, 1);
      return {
        bob: Math.sin(t * 1.5) * 0.4 - up * 1.2,
        breathe: Math.sin(t * 1.5) * 0.6,
        lean: (grab - up) * 0.4,
        legL: 0, legR: 0,
        armL: -0.1, armR: G.lerp(1.3 * grab, -1.1, G.easeInOut(up)),
        reach: grab * (1 - up),
        hold: up,
        headTurn: -up * 0.16,
        headTilt: up * 0.24,
        blink: blinkAt(t, o.seed),
      };
    },

    // ---- pointing at something you have only just noticed ----
    point(t, o) {
      const p = G.clamp(o.p === undefined ? 1 : o.p, 0, 1);
      const e = G.backOut(G.clamp(p * 1.6, 0, 1));
      return {
        bob: -e * 0.8 + Math.sin(t * 2.4) * 0.3,
        breathe: Math.sin(t * 3) * 0.8,
        lean: -e * 0.2 * (o.dir === undefined ? 1 : o.dir),
        legL: -e * 0.25, legR: e * 0.15,
        armL: (o.dir === undefined || o.dir > 0) ? 0.1 : -1.9 * e,
        armR: (o.dir === undefined || o.dir > 0) ? 1.9 * e : 0.1,
        armUp: e,
        headTurn: e * 0.5 * (o.dir === undefined ? 1 : o.dir),
        headTilt: -e * 0.2,
        blink: 0,
      };
    },

    // ---- seeing it. A hard recoil that settles into a stare. ----
    startle(t, o) {
      const p = G.clamp(o.p === undefined ? 1 : o.p, 0, 1);
      const hit = Math.exp(-p * 5) * Math.sin(p * 26);
      const set = G.easeOut(G.clamp(p * 1.4, 0, 1));
      return {
        bob: -set * 1.6 + hit * 2.4,
        breathe: Math.sin(t * 6) * 1.2,
        squash: -hit * 0.1,
        lean: -set * 0.5,
        legL: -set * 0.4, legR: set * 0.2,
        armL: -set * 0.7 + hit * 0.6, armR: set * 0.7 - hit * 0.6,
        headTurn: 0,
        headTilt: -set * 0.3,
        stare: set,
        mouth: set * 0.62,          // and the mouth goes with it
        blink: 0,
      };
    },

    // ---- switched off, or nearly ----
    slump(t, o) {
      return {
        bob: 2.4 + Math.sin(t * 0.7) * 0.3,
        breathe: Math.sin(t * 0.7) * 0.3,
        sway: drift(t, 0.11, 0.07) * 0.5,
        legL: 0.1, legR: -0.1,
        armL: -0.15, armR: -0.15,
        headTurn: 0.1, headTilt: 0.5,
        blink: 0, droop: 1,
      };
    },

    // ---- a hand raised on the way out of frame ----
    wave(t, o) {
      const p = G.clamp(o.p === undefined ? 1 : o.p, 0, 1);
      const up = Math.sin(G.clamp(p, 0, 1) * Math.PI);
      return {
        bob: Math.sin(t * 1.6) * 0.5,
        breathe: Math.sin(t * 1.6) * 0.6,
        legL: 0, legR: 0,
        armL: -0.1, armR: -1.5 * up,
        armUp: up,
        flap: Math.sin(t * 11) * up,
        headTurn: -0.2 * up, headTilt: -0.1 * up,
        blink: blinkAt(t, o.seed),
      };
    },
  };

  // ------------------------------------------------------------
  // ASK FOR A POSE.  G.pose('walk', t, { speed, dir, seed, p })
  // Unset fields come back as 0, so a draw function can read any field
  // off any clip without checking.
  // ------------------------------------------------------------
  const ZERO = {
    bob: 0, breathe: 0, sway: 0, lean: 0, squash: 0,
    legL: 0, legR: 0, armL: 0, armR: 0, armUp: 0,
    headTurn: 0, headTilt: 0, mouth: 0, blink: 0,
    reach: 0, hold: 0, step: 0, stare: 0, droop: 0, flap: 0,
  };
  G.pose = function (clip, t, o) {
    o = o || {};
    const fn = CLIP[clip] || CLIP.idle;
    const out = Object.assign({}, ZERO, fn(t || 0, o));
    // a blend, so a shot can cross-fade one performance into another
    if (o.into && CLIP[o.into]) {
      const w = G.clamp(o.blend === undefined ? 0 : o.blend, 0, 1);
      const b = Object.assign({}, ZERO, CLIP[o.into](t || 0, o));
      for (const k in out) out[k] = G.lerp(out[k], b[k], w);
    }
    return out;
  };
  G.CLIPS = Object.keys(CLIP);
})();

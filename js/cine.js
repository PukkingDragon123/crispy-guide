// ============================================================
// DOUBLE LIFE v6 - cine.js  ·  THE CAMERA
//
// A tiny shot-based cutscene player. A cutscene is a list of shots;
// each shot owns a duration, a camera move (pan, push, shear for an
// angle) and a paint function that draws the world for that shot.
// Letterbox bars come down, the line types itself in, and you can
// tap to push through.
//
// Pixel art hates rotation, so an "angle" here is a horizontal
// shear: every scanline stays a scanline, so nothing goes soft.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;
  const CO = '#d97757';

  // ------------------------------------------------------------
  // little staging helpers, shared by the shots
  // ------------------------------------------------------------
  function silhouette(g, x, footY, h, col, rim) {     // her, or anyone
    const w = Math.round(h * 0.34);
    if (rim !== false) {                              // a hair of backlight down one side
      const r = '#6b4a3a';
      G.vair(g, x + w * 0.5, footY - h * 0.72, h * 0.5, r);
      G.vair(g, x + w * 0.4, footY - h, h * 0.3, r);
      G.hair(g, x - w * 0.42, footY - h, w * 0.84, '#8a5c44');
    }
    G.rr2(g, x - w * 0.42, footY - h, w * 0.84, h * 0.3, col);      // head+shoulders
    G.R(g, x - w / 2, footY - h * 0.72, w, h * 0.5, col);           // body
    G.R(g, x - w * 0.62, footY - h * 0.64, w * 0.2, h * 0.36, col); // arms
    G.R(g, x + w * 0.42, footY - h * 0.64, w * 0.2, h * 0.36, col);
    G.R(g, x - w * 0.34, footY - h * 0.24, w * 0.28, h * 0.24, col);
    G.R(g, x + w * 0.06, footY - h * 0.24, w * 0.28, h * 0.24, col);
  }
  function rain(g, t, n, col, x0, x1) {
    for (let i = 0; i < n; i++) {
      const s = G.hash(i * 3.1, 7.7);
      const x = x0 + ((s * (x1 - x0) + t * 24 * (0.6 + s)) % (x1 - x0));
      const y = ((G.hash(i, 2) * 200 + t * (150 + s * 120)) % 210) - 20;
      G.Rh(g, x, y, 0.5, 3 + s * 3, col);
    }
  }
  function skyline(g, y, h, seed, col, lit) {
    let x = -10;
    while (x < 340) {
      const w = 12 + Math.round(G.hash(x, seed) * 26);
      const hh = 14 + Math.round(G.hash(x + 3, seed + 1) * h);
      G.R(g, x, y - hh, w, hh, col);
      G.hair(g, x, y - hh, w, G.shade(col, 0.3));
      for (let wy = y - hh + 4; wy < y - 3; wy += 5)
        for (let wx = x + 2; wx < x + w - 2; wx += 4)
          if (G.hash(wx, wy + seed) > 0.62) G.Rh(g, wx, wy, 1.5, 2, lit);
      x += w + 2;
    }
  }
  function floorPool(g, cx, y, w, col, a) {
    g.globalAlpha = a; G.rr(g, cx - w / 2, y, w, 6, col); g.globalAlpha = 1;
  }

  // ------------------------------------------------------------
  // the good years, and the nine days that ended them
  // ------------------------------------------------------------
  function sunSky(g, t, warm) {
    for (let j = 0; j < G.H; j++) {
      const p = j / G.H;
      G.Rh(g, 0, j, G.W, 1, G.mix(warm ? '#5fc8e8' : '#2a3550',
        warm ? '#ffe0a8' : '#6b5570', Math.pow(p, 0.7)));
    }
    G.fc(g, 250, 34, 13, '#fff6d0');
    G.glow(g, 250, 34, 150, 110, '#ffe08a', 0.7);
    for (let i = 0; i < 5; i++) {                      // gulls
      const gx = ((t * 9 + i * 71) % 380) - 30, gy = 20 + (i % 3) * 11 + Math.sin(t + i) * 2;
      const fl = Math.sin(t * 4 + i * 2) * 2;
      G.Rh(g, gx, gy, 3, 1, '#f6f2e4');
      G.Rh(g, gx - 3, gy - fl, 3, 1, '#f6f2e4');
      G.Rh(g, gx + 3, gy + fl, 3, 1, '#f6f2e4');
    }
    // fat summer clouds
    for (let i = 0; i < 4; i++) {
      const cx2 = ((t * 3 + i * 97) % 400) - 40, cy2 = 26 + (i % 2) * 16;
      for (let k = 0; k < 4; k++)
        G.fe(g, cx2 + k * 9, cy2 + Math.sin(k) * 2, 9 - k, 5 - k * 0.6, '#fffaf0');
    }
  }
  function sea(g, y, t, col, lit) {
    G.R(g, 0, y, G.W, G.H - y, col);
    for (let j = 0; j < 26; j += 2) {
      const yy = y + j;
      for (let i = 0; i < 9; i++) {
        const sx = ((G.hash(j, i) * 340) + Math.sin(t * 0.8 + j * 0.4 + i) * 9) % 340 - 10;
        G.Rh(g, sx, yy, 3 + (j % 3), 1, j < 8 ? lit : G.shade(col, 0.24));
      }
    }
  }
  function promenade(g, y, col, rail) {
    G.R(g, 0, y, G.W, G.H - y, col);
    G.hair(g, 0, y, G.W, G.shade(col, 0.4));
    for (let x = -6; x < 330; x += 22) {              // paving joints
      G.vseam(g, x, y + 2, G.H - y - 2, G.shade(col, -0.34), G.shade(col, 0.2));
    }
    if (rail !== false) {
      G.R(g, 0, y - 15, G.W, 2, '#e8e0d0');
      G.hair(g, 0, y - 15, G.W, '#ffffff');
      for (let x = 4; x < 330; x += 20) {
        G.R(g, x, y - 15, 2, 15, '#d8d0c0');
        G.vair(g, x, y - 15, 15, '#ffffff');
      }
      G.R(g, 0, y - 8, G.W, 1, '#c8c0b0');
    }
  }
  // a crowd, in silhouette, at whatever distance. run > 0 puts them all
  // in a stride, which is the difference between a queue and a rout.
  function crowd(g, y, n, t, col, x0, x1, sc, run) {
    for (let i = 0; i < n; i++) {
      const s = G.hash(i * 2.7, 5.3);
      const x = x0 + s * (x1 - x0);
      const h = (12 + s * 8) * (sc || 1);
      const ph = t * (run ? 5 + s * 2 : 1.6) + i * 1.7;
      const bob = Math.sin(ph * 2) * (run ? 1.2 : 0.6);
      const sw = Math.sin(ph);
      const dir = run ? (s > 0.5 ? 1 : -1) : 0;
      G.fe(g, x + dir * h * 0.06, y - h - 1 + bob, h * 0.19, h * 0.2, col);
      G.R(g, x - h * 0.15, y - h * 0.84 + bob, h * 0.3, h * 0.46, col);   // torso
      // arms, thrown forward and back when they are running
      G.R(g, x - h * 0.28 + dir * sw * h * 0.16, y - h * 0.78 + bob, h * 0.12, h * 0.3, col);
      G.R(g, x + h * 0.16 - dir * sw * h * 0.16, y - h * 0.78 + bob, h * 0.12, h * 0.3, col);
      // legs, striding
      for (const sd of [-1, 1]) {
        const st = sd * sw * (run ? h * 0.2 : 0);
        for (let j = 0; j < Math.max(2, h * 0.4); j++) {
          const q = j / Math.max(1, h * 0.4);
          G.R(g, x - h * 0.14 + (sd > 0 ? h * 0.12 : 0) + st * q, y - h * 0.4 + bob + j,
            Math.max(1, h * 0.11), 1, col);
        }
      }
    }
  }
  // the same crowd, but the heads turn to look at something, left to
  // right, in a wave. p is how far through the turn the shot is.
  function crowdLook(g, y, n, t, col, x0, x1, sc, p) {
    for (let i = 0; i < n; i++) {
      const s = G.hash(i * 2.7, 5.3);
      const x = x0 + s * (x1 - x0);
      const h = (12 + s * 8) * (sc || 1);
      const own = i / n;                              // when this one notices
      const turned = G.clamp((p - own * 0.5) * 4, 0, 1);
      const bob = Math.sin(t * 1.6 + i) * 0.6 * (1 - turned);
      const tilt = turned * h * 0.1;
      G.fe(g, x + tilt, y - h - 1 + bob - turned * 1.5, h * 0.19, h * 0.2, col);
      G.R(g, x - h * 0.15, y - h * 0.84 + bob, h * 0.3, h * 0.46, col);
      // an arm goes up to point, on the ones that have seen it
      if (turned > 0.6) G.R(g, x + h * 0.14, y - h * 0.9, h * 0.1, h * 0.3, col);
      else G.R(g, x + h * 0.16, y - h * 0.78 + bob, h * 0.12, h * 0.3, col);
      G.R(g, x - h * 0.28, y - h * 0.78 + bob, h * 0.12, h * 0.3, col);
      for (const sd of [-1, 1])
        for (let j = 0; j < Math.max(2, h * 0.4); j++)
          G.R(g, x - h * 0.14 + (sd > 0 ? h * 0.12 : 0), y - h * 0.4 + bob + j,
            Math.max(1, h * 0.11), 1, col);
    }
  }

  // a siege silhouette, drawn as a shape rather than a rig, so it can be
  // three hundred feet tall without falling apart
  function mech(g, x, footY, h, col, t, glowCol, ph) {
    const w = h * 0.62;
    // a stride, if the caller gives it one: the legs swing and the hull
    // rocks, which is the difference between walking and standing
    const sw = ph === undefined ? 0 : Math.sin(ph) * h * 0.09;
    const rock = ph === undefined ? 0 : Math.abs(Math.cos(ph)) * h * 0.02;
    footY -= rock;
    G.R(g, x - w * 0.24 + sw, footY - h * 0.42, w * 0.16, h * 0.42 + rock, col);   // legs
    G.R(g, x + w * 0.08 - sw, footY - h * 0.42, w * 0.16, h * 0.42 + rock, col);
    G.R(g, x - w * 0.3 + sw, footY - 2, w * 0.24, 3, col);
    G.R(g, x + w * 0.06 - sw, footY - 2, w * 0.24, 3, col);
    G.R(g, x - w * 0.5, footY - h * 0.86, w, h * 0.46, col);           // hull
    G.R(g, x - w * 0.62, footY - h * 0.82, w * 0.16, h * 0.3, col);    // shoulders
    G.R(g, x + w * 0.46, footY - h * 0.82, w * 0.16, h * 0.3, col);
    G.R(g, x - w * 0.24, footY - h, w * 0.48, h * 0.2, col);           // head
    G.R(g, x + w * 0.2, footY - h * 0.76, w * 0.62, h * 0.09, col);    // gun
    if (glowCol) {
      G.Rh(g, x - w * 0.14, footY - h * 0.94, w * 0.28, h * 0.05, glowCol);
      G.glow(g, x, footY - h * 0.92, w * 1.1, h * 0.2, glowCol, 0.55);
    }
  }
  // a burning sky: cloud banks lit from below, tracer, and the flash
  function warSky(g, t, p) {
    for (let j = 0; j < 130; j++) {
      const q = j / 130;
      G.Rh(g, 0, j, G.W, 1, G.mix('#1a0e14', '#7a2418', Math.pow(q, 0.8)));
    }
    for (let i = 0; i < 7; i++) {                     // cloud banks, underlit
      const cy2 = 16 + i * 13, cw = 60 + G.hash(i, 3) * 120;
      const cx2 = ((G.hash(i, 7) * 340) + t * (2 + i * 0.4)) % 400 - 40;
      const cc = G.mix('#2a1620', '#c85030', 1 - i / 8);
      G.fe(g, cx2, cy2, cw * 0.5, 7, G.mix(cc, '#0f0810', 0.45));
      G.fe(g, cx2, cy2 + 3, cw * 0.42, 4, cc);
      G.hair(g, cx2 - cw * 0.3, cy2 + 6, cw * 0.6, G.mix(cc, '#ffb060', 0.5));
    }
    for (let i = 0; i < 4; i++) {                     // searchlights
      const a = -1.3 + Math.sin(t * 0.35 + i * 1.7) * 0.5;
      const bx2 = 30 + i * 82;
      for (let r = 0; r < 150; r += 3) {
        g.globalAlpha = 0.11 * (1 - r / 150);
        G.Rh(g, bx2 + Math.cos(a) * r - r * 0.03, 126 + Math.sin(a) * r, 2 + r * 0.06, 3, '#cfe4ff');
        g.globalAlpha = 1;
      }
    }
    for (let i = 0; i < 14; i++) {                    // tracer, arcing
      const q = ((t * 0.7 + i * 0.37) % 1);
      const tx = 20 + i * 23 + q * 46, ty = 140 - q * 118 + q * q * 44;
      G.Rh(g, tx, ty, 1.5, 3, i % 3 ? '#ffd47a' : '#ff9a5a');
      G.Rh(g, tx, ty + 3, 1, 4, '#c8602a');
    }
    // the shell flash
    const fl = Math.max(0, Math.sin(t * 1.9 + p * 3));
    if (fl > 0.86) {
      g.globalAlpha = (fl - 0.86) * 5;
      G.R(g, 0, 0, G.W, G.H, '#ffd9a0');
      g.globalAlpha = 1;
    }
  }

  // Tracy, drawn small for the cutscenes. Her sprite lives in her own
  // scene; this is the version that fits in a shot.
  function tracy(g, x, footY, sc, t, o) {
    o = o || {};
    const u = (v) => Math.max(1, Math.round(v * sc));
    const skin = '#d8a882', skinD = '#a87a58', hair = '#3a241c';
    // her performance comes off the same clip system as everyone else
    const A = o.pose || G.pose(o.clip || (o.dead ? 'slump' : 'idle'),
      o.ct === undefined ? t : o.ct, { seed: 3.1, p: o.p, dir: o.dir, emph: o.emph });
    const bob = (A.bob + A.breathe * 0.3) * sc;
    const lean = A.lean * u(3);
    const by = footY - u(52) + bob;
    // legs, with a stride when she is going somewhere
    for (const [key, sd] of [['legL', -1], ['legR', 1]]) {
      const sw = A[key] * u(4);
      G.Rh(g, x + sd * u(5) - u(3) + sw * 0.5, footY - u(22), u(6), u(22) - Math.max(0, -A[key]) * u(3), '#33505e');
      G.Rh(g, x + sd * u(5) - u(4) + sw, footY - u(3) - Math.max(0, -A[key]) * u(3), u(8), u(3), '#2a1c14');
    }
    // dungarees and jumper
    G.R(g, x - u(9) + lean, by + u(16), u(18), u(24), '#3f5c6b');
    G.bevel(g, x - u(9) + lean, by + u(16), u(18), u(24), '#5c7f92', '#2a4450');
    G.Rh(g, x - u(10) + lean, by + u(9), u(20), u(8), '#c8785a');
    G.Rh(g, x - u(9) + lean, by + u(14), u(4), u(5), '#5c7f92');
    G.Rh(g, x + u(5) + lean, by + u(14), u(4), u(5), '#5c7f92');
    // arms: shoulder to hand, and the hand goes where the clip wants it
    for (const [key, sd] of [['armL', -1], ['armR', 1]]) {
      const sw = A[key], up = (key === 'armR' ? A.armUp : 0);
      let hx2 = x + sd * u(12) + lean + sw * u(4);
      let hy2 = by + u(23) - up * u(20) - Math.abs(sw) * u(1);
      if (A.reach && ((sd > 0) === (sw > 0))) { hx2 = x + sd * u(18) * A.reach + lean; hy2 = by + u(16); }
      if (up > 0.2) hx2 += Math.sin(t * 11) * u(2) * A.flap;
      const shx = x + sd * u(11) + lean, shy = by + u(11);
      const n = Math.max(3, Math.round(Math.hypot(hx2 - shx, hy2 - shy)));
      for (let i = 0; i <= n; i++) {
        const q = i / n;
        G.Rh(g, G.lerp(shx, hx2, q) - u(2.5), G.lerp(shy, hy2, q) - u(2.5), u(5), u(5), '#c8785a');
      }
      G.Rh(g, hx2 - u(3), hy2, u(6), u(4), skin);
      G.hairq(g, hx2 - u(3), hy2, u(6), G.shade(skin, 0.3));
    }
    // head
    const turn = A.headTurn * u(3);
    const hy = by - u(2) + A.headTilt * u(2);
    const hx = x + lean + turn;
    G.R(g, hx - u(7), hy, u(14), u(14), OUT);
    G.R(g, hx - u(6), hy + 1, u(12), u(12), skin);
    G.bevel(g, hx - u(6), hy + 1, u(12), u(12), '#f0c8a0', skinD);
    G.Rh(g, hx - u(8), hy - u(2), u(16), u(6), hair);
    G.fc(g, hx + u(7) - turn * 0.4, hy + 1, u(3), hair);
    if (!o.dead) {
      for (const sd of [-1, 1]) {
        const ex = hx + sd * u(3) - u(1.5) + turn * 0.4;
        if (A.blink) { G.Rh(g, ex, hy + u(7), u(3), 0.75, skinD); continue; }
        G.Rh(g, ex, hy + u(6), u(3), u(2.5), '#f6f2e4');
        G.Rh(g, ex + u(1) + turn * 0.3, hy + u(6.5), 1, u(1.5), '#3a2a1c');
      }
      const mo = A.mouth;
      if (mo > 0.08) {
        const mh = Math.max(1, u(1 + mo * 2.4));
        G.R(g, hx - u(2.5) - 1 + turn * 0.4, hy + u(10) - 1, u(5) + 2, mh + 2, OUT);
        G.Rh(g, hx - u(2.5) + turn * 0.4, hy + u(10), u(5), mh, '#5c2430');
        G.hairq(g, hx - u(2.5) + turn * 0.4, hy + u(10), u(5), '#a85a5a');
      } else if (o.smile) {
        for (let i = 0; i < 5; i++)
          G.Rh(g, hx - u(2) + i + turn * 0.4, hy + u(10) + Math.sin((i / 4) * Math.PI) * 1.2, 1, 1, '#8a4a4a');
      } else G.Rh(g, hx - u(2) + turn * 0.4, hy + u(10), u(4), 1, '#8a4a4a');
    } else {
      for (const sd of [-1, 1]) G.Rh(g, hx + sd * u(3) - u(1.5), hy + u(7), u(3), 1, skinD);
    }
  }

  // ------------------------------------------------------------
  // THE CUTSCENES
  // Each shot: { t, say, who, cam:{x,y,z,sh -> to}, paint(g, p, tt) }
  // p is 0..1 through the shot; tt is absolute time for animation.
  // ------------------------------------------------------------
  const CUT = {
    // ---------------- the opening: the summer, and the nine days ----------------
    // Every shot has something moving in it that is not the camera, and
    // somebody in it says something. A shot where neither happens is a
    // caption with a picture over it.
    opening: [
      { t: 6.4,
        lines: [
          { at: 0,   say: 'THERE WAS A SUMMER. THERE WAS A WHOLE SUMMER OF IT.' },
          { at: 3.4, who: 'BESSIE', col: '#ffb0c8', say: 'WHO IS NEXT, THEN? DO NOT ALL SHOUT.' },
        ],
        cam: { z: [1.14, 1.02], y: [96, 90], sh: [0.05, 0.01] },
        paint(g, p, tt, talk) {
          sunSky(g, tt, 1);
          sea(g, 96, tt, '#2f8ab0', '#bfeaff');
          promenade(g, 122, '#d8c8a8');
          // the stand, under a striped awning that lifts in the wind
          const lift = Math.sin(tt * 1.1) * 1.2;
          G.R(g, 96, 78, 128, 30, '#f6f0e4');
          G.bevel(g, 96, 78, 128, 30, '#ffffff', '#c8b696');
          for (let i = 0; i < 16; i++) {
            const w2 = Math.sin(tt * 1.6 + i * 0.5) * 1.1;
            G.R(g, 96 + i * 8, 72 + w2 * 0.4, 8, 7, i % 2 ? '#e05a52' : '#fdf6ea');
            G.fe(g, 100 + i * 8, 79 + w2, 4, 2, i % 2 ? '#c04a44' : '#e8dcc8');
          }
          G.R(g, 96, 70 - lift * 0.3, 128, 2, '#8a5c3a');
          G.text(g, 'GELATO', 160, 88, '#c8383a', { align: 'center' });
          G.text(g, 'DELLA CASA', 160, 98, '#2f8a48', { align: 'center', sc: 0.5 });
          G.drawBot(g, 'player', 160, 122, 0.9, { t: tt, mood: 'idle', walk: 0,
            clip: talk ? 'talk' : 'idle', ct: tt });
          // and a queue that shuffles rather than stands
          crowd(g, 122, 9, tt, '#7a6a58', -10, 330, 1.1);
        } },

      { t: 7.2,
        lines: [
          { at: 0,   say: 'THEY BUILT US TO HAND PEOPLE THINGS. IT WORKED.' },
          { at: 3.0, who: 'A CHILD', col: '#a8d158', say: 'CAN I HAVE THE PINK ONE' },
          { at: 5.0, who: 'BESSIE', col: '#ffb0c8', say: 'YOU CAN HAVE TWO.' },
        ],
        cam: { z: [1.06, 1.24], x: [160, 146], y: [98, 102], sh: [-0.03, 0] },
        paint(g, p, tt, talk) {
          sunSky(g, tt, 1);
          promenade(g, 146, '#d8c8a8', false);
          G.R(g, 20, 30, 280, 74, '#f2e6cf');
          G.bevel(g, 20, 30, 280, 74, '#fffaf0', '#c8b696');
          for (let i = 0; i < 35; i++) G.R(g, 20 + i * 8, 32, 8, 6, i % 2 ? '#e05a52' : '#fdf6ea');
          G.R(g, 20, 38, 280, 1, '#8a5c3a');
          G.text(g, 'GELATO DELLA CASA', 160, 43, '#c8383a', { align: 'center' });
          G.Rh(g, 96, 51, 128, 1, '#2f8a48');
          G.R(g, 28, 56, 44, 40, '#2a2420');
          G.bevel(g, 28, 56, 44, 40, '#4a4038', '#171310');
          for (let i = 0; i < 6; i++) G.Rh(g, 32, 62 + i * 5, 20 + (i % 3) * 10, 1, '#c8b490');
          // the lamp swings on its flex
          const sw = Math.sin(tt * 1.3) * 2;
          G.Rh(g, 232 + sw * 0.4, 30, 1, 14, '#3a3028');
          G.fe(g, 232 + sw, 48, 7, 4, '#e8dcc0');
          G.glow(g, 232 + sw, 50, 60, 40, '#ffe08a', 0.4);
          G.drawBot(g, 'player', 176, 122, 1.0, { t: tt, mood: 'idle', walk: 0,
            clip: p > 0.7 ? 'reach' : talk ? 'talk' : 'idle', ct: tt, dir: -1,
            p: G.clamp((p - 0.7) / 0.24, 0, 1) });
          // the counter
          G.R(g, -10, 104, 340, 8, '#f0e4cc');
          G.hair(g, -10, 104, 340, '#fffaf0');
          G.R(g, -10, 112, 340, 24, '#8a5c3a');
          G.bevel(g, -10, 112, 340, 24, '#b07a4a', '#5a3620');
          for (let i = 0; i < 12; i++) G.vseam(g, -6 + i * 28, 114, 20, '#4a2c18', '#c08a56');
          G.R(g, -10, 134, 340, 3, '#5a3620');
          for (let i = 0; i < 6; i++) {
            const px3 = 22 + i * 50;
            G.fe(g, px3, 106, 13, 4.5, '#8a93ad');
            G.fe(g, px3, 106, 11, 3.5, '#c8b898');
            G.fe(g, px3, 105, 10, 3, ['#ffd9b0', '#ff9ab8', '#a8d158', '#efdcae', '#8fbf3a', '#e8a8bb'][i]);
            G.hairq(g, px3 - 5, 103.5, 10, '#ffffff');
            G.pip(g, px3 - 3, 104.5, '#ffffff');
          }
          // the child walks the length of the shot, asks, then takes it
          const walk = G.clamp(p * 2.2, 0, 1);
          const kx = G.lerp(-14, 96, G.easeOut(walk));
          const asking = p > 0.4 && p < 0.66;
          const taking = p > 0.7;
          G.drawCreature(g, 'human', kx, 150, 0.6, {
            t: tt, smile: !asking, seed: 2.2,
            clip: walk < 1 ? 'walk' : taking ? 'take' : asking ? 'talk' : 'idle',
            ct: walk < 1 ? tt : tt, dir: 1,
            p: taking ? G.clamp((p - 0.7) / 0.3, 0, 1) : 0,
          });
          G.drawCreature(g, 'human', 40, 150, 0.95, { t: tt, smile: 1, clip: 'idle', ct: tt, seed: 0.7 });
          G.drawCreature(g, 'human', 246, 150, 0.9, { t: tt, smile: 1, clip: 'idle', ct: tt, seed: 5.3 });
          G.drawCreature(g, 'dog', 286, 150, 0.7, { t: tt, clip: 'idle', ct: tt, seed: 1.9 });
          // a hand comes over the counter with a cone in it, on cue
          if (p > 0.7) {
            const reach = G.clamp((p - 0.7) / 0.24, 0, 1);
            const ax = G.lerp(166, 118, G.easeOut(reach));
            const al = 30 - (ax - 118) * 0.3;
            G.R(g, ax - 1, 100, al + 2, 7, OUT);
            G.Rh(g, ax, 101, al, 5, '#f6f0e4');
            G.hairq(g, ax, 101, al, '#fffaf0');
            G.fe(g, ax, 103.5, 5, 4, '#f6f0e4');
            G.cone(g, ax - 1, 96, { w: 9, h: 13 });
          }
          G.cone(g, 54, 134, { w: 8, h: 12 });
          G.cone(g, 232, 132, { w: 9, h: 13 });
        } },

      { t: 6.6,
        lines: [
          { at: 0,   say: 'NOBODY ASKED WHAT WE WANTED. WE WANTED NOTHING.' },
          { at: 3.2, who: 'A MAN', col: '#8fbf3a', say: 'SAME TIME TOMORROW, BESSIE.' },
          { at: 5.0, who: 'BESSIE', col: '#ffb0c8', say: 'SAME TIME TOMORROW.' },
        ],
        cam: { z: [1.5, 1.72], x: [150, 156], y: [92, 88], sh: [0.02, -0.02] },
        paint(g, p, tt, talk) {
          sunSky(g, tt, 1);
          G.glow(g, 160, 80, 320, 160, '#ffe08a', 0.5);
          promenade(g, 140, '#d8c8a8', false);
          G.drawBot(g, 'player', 130, 140, 1.5, { t: tt, mood: 'idle', walk: 0,
            clip: talk ? 'talk' : 'idle', ct: tt });
          // he says it, raises a hand, and walks out of frame
          const go = G.clamp((p - 0.62) / 0.38, 0, 1);
          const mx = G.lerp(226, 316, G.easeIn(go));
          const waving = p > 0.44 && p < 0.72;
          G.drawCreature(g, 'human', mx, 140, 0.7, {
            t: tt, smile: 1, seed: 4.4, dir: 1,
            clip: go > 0.05 ? 'walk' : waving ? 'wave' : p > 0.2 ? 'talk' : 'idle',
            ct: tt, p: waving ? G.clamp((p - 0.44) / 0.28, 0, 1) : 0,
          });
          G.gooScoop(g, 186, 92, 11, { col: '#ffd9b0', goo: 1 }, {});
          for (let i = 0; i < 22; i++) {
            const dx = (G.hash(i, 3) * 320 + Math.sin(tt * 0.4 + i) * 8) % 320;
            const dy = (G.hash(i, 9) * 130 + tt * 5 + i) % 130;
            g.globalAlpha = 0.5; G.Rq(g, dx, dy, 1, 1, '#fff6d0'); g.globalAlpha = 1;
          }
        } },

      { t: 6.0,
        lines: [
          { at: 0,   say: 'THEN THE BIG ONES WORKED OUT WHAT THEY WERE FOR.' },
          { at: 3.2, who: 'A WOMAN', col: '#7fd8ff', say: 'WHAT IS THAT.' },
        ],
        cam: { z: [1.05, 1.2], x: [160, 190], y: [96, 74], sh: [0, -0.07] },
        paint(g, p, tt) {
          for (let j = 0; j < G.H; j++) {
            const q = j / G.H;
            G.Rh(g, 0, j, G.W, 1, G.mix(G.mix('#5fc8e8', '#3a2436', p),
              G.mix('#ffe0a8', '#6b2a20', p), Math.pow(q, 0.7)));
          }
          sea(g, 96, tt, G.mix('#2f8ab0', '#2a2438', p), G.mix('#bfeaff', '#7a5a68', p));
          promenade(g, 122, G.mix('#d8c8a8', '#4a4038', p));
          const rise = G.easeOut(p);
          for (const m of [[232, 20 + rise * 78, 1], [66, 12 + rise * 44, 0]]) {
            mech(g, m[0], 96, m[1], '#160f18', tt, m[2] && p > 0.4 ? '#ff5d84' : null, tt * 0.7);
            G.vair(g, m[0] - m[1] * 0.31, 96 - m[1] * 0.86, m[1] * 0.46, G.mix('#6b5570', '#e07a3a', p));
            G.hair(g, m[0] - m[1] * 0.14, 96 - m[1], m[1] * 0.28, G.mix('#8a7a90', '#ffb060', p));
          }
          // the heads turn along the promenade, left to right, in a wave
          crowdLook(g, 134, 11, tt, G.mix('#4a3f38', '#181218', p), -10, 330, 1.25, p);
          // one of them close enough to see it happen to
          G.drawCreature(g, 'human', 268, 138, 0.8, {
            t: tt, seed: 6.1, clip: p > 0.34 ? 'startle' : 'idle', ct: tt,
            p: G.clamp((p - 0.34) / 0.5, 0, 1),
            coat: G.mix('#3a4a5c', '#1a1420', p), skin: G.mix('#c8a184', '#6b5560', p),
          });
          G.drawBot(g, 'player', 150, 122, 0.9, { t: tt, mood: p > 0.5 ? 'sick' : 'idle', walk: 0,
            clip: p > 0.4 ? 'startle' : 'idle', ct: tt, p: G.clamp((p - 0.4) / 0.5, 0, 1) });
          g.globalAlpha = p * 0.4; G.R(g, 0, 0, G.W, G.H, '#2a0e14'); g.globalAlpha = 1;
        } },

      { t: 6.4, say: 'IT TOOK NINE DAYS.',
        cam: { z: [1.34, 1.02], x: [140, 170], y: [86, 96], sh: [0.09, -0.05] },
        paint(g, p, tt) {
          warSky(g, tt, p);
          skyline(g, 126, 66, 4, '#180e14', '#ff8a4a');
          skyline(g, 138, 44, 11, '#0e0810', '#c85030');
          G.glow(g, 80, 126, 240, 90, '#ff6a2a', 0.75);
          G.glow(g, 258, 132, 170, 70, '#ff9a4a', 0.55);
          G.R(g, 0, 120, G.W, 60, '#2a1410');
          for (let j = 0; j < 60; j++)
            G.Rh(g, 0, 120 + j, G.W, 1, G.mix('#a8481e', '#160a0e', j / 46));
          for (let i = 0; i < 20; i++)
            G.Rh(g, G.hash(i, 3) * 340 - 10, 124 + G.hash(i, 7) * 28, 8 + G.hash(i, 9) * 18, 1, '#e8823a');
          // the line, walking in. They actually walk now.
          for (let i = 0; i < 5; i++) {
            const mx = -6 + i * 76 + ((tt * 5) % 76) * 0.4;
            const mh = 56 + (i % 3) * 18;
            mech(g, mx, 126, mh, '#0d080f', tt, i % 2 ? '#ff5d84' : null, tt * 1.5 + i);
            G.vair(g, mx - mh * 0.31, 126 - mh * 0.86, mh * 0.46, '#e07a3a');
            G.hair(g, mx - mh * 0.15, 126 - mh, mh * 0.3, '#ffb060');
          }
          crowd(g, 150, 26, tt, '#0a0508', -20, 340, 1.2, 1);
          for (let i = 0; i < 14; i++) {
            const rx = G.hash(i, 11) * 340 - 10, rw = 10 + G.hash(i, 13) * 28;
            G.R(g, rx, 150 + G.hash(i, 17) * 8, rw, 8, '#120a0c');
            G.hairq(g, rx, 150 + G.hash(i, 17) * 8, rw, '#7a3a1e');
          }
          for (let i = 0; i < 34; i++) {
            const ex = (G.hash(i, 5) * 340 + tt * (14 + i)) % 340 - 10;
            const ey = 170 - ((G.hash(i, 13) * 170 + tt * (22 + i * 2)) % 180);
            G.Rq(g, ex, ey, 1, 1, i % 3 ? '#ffb050' : '#ff6a2a');
          }
        } },

      { t: 6.6,
        lines: [
          { at: 0,   say: 'THE WINNERS DID NOT NEED THE ONES WHO SERVED.' },
          { at: 3.4, who: 'PATROL', col: '#7fd8ff', say: 'CIVIL PATTERN. NO FURTHER USE.' },
        ],
        cam: { z: [1.1, 1.28], x: [130, 180], y: [100, 96], sh: [-0.05, 0.02] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0c111c');
          G.cityWall(g, 0, 0, G.W, 108, tt);
          G.R(g, 0, 108, G.W, 72, '#151a26');
          G.hair(g, 0, 108, G.W, '#2c3548');
          rain(g, tt, 44, '#33445f', 0, 320);
          const ids = ['maid', 'garden', 'dj', 'chef', 'clerk', 'nurse'];
          for (let i = 0; i < 6; i++) {
            // one of them is still twitching, which is worse than none
            const live = i === 2;
            G.drawBot(g, ids[i], 26 + i * 56, 148, 0.62,
              { t: tt, open: 0.02, mood: 'idle', walk: 0, dead: !live, noBlink: 1,
                clip: live ? 'startle' : 'slump', ct: tt,
                p: live ? (tt * 0.7) % 1 : 0 });
          }
          // the patrol walks the line and its torch sweeps ahead of it
          const wx = 40 + ((tt * 16) % 260);
          G.drawBot(g, 'police', wx, 168, 0.78, { t: tt, open: 0.05, mood: 'angry', walk: tt * 1.6,
            clip: 'walk', ct: tt, dir: 1 });
          const beam = Math.sin(tt * 0.8) * 40;
          g.globalAlpha = 0.1;
          for (let r = 0; r < 60; r += 3)
            G.Rh(g, wx + 12 + r, 150 + beam * (r / 60) - r * 0.1, 4, 3 + r * 0.1, '#cfe4ff');
          g.globalAlpha = 1;
          G.glow(g, wx + 16, 150, 90, 60, '#cfe4ff', 0.4);
          floorPool(g, 160, 168, 320, '#0a0d14', 0.5);
        } },

      { t: 7.0,
        lines: [
          { at: 0,   say: 'THEY TOOK THE ARM FIRST. THEY ALWAYS DID.' },
          { at: 2.8, who: 'PATROL', col: '#7fd8ff', say: 'HOLD IT STILL.' },
          { at: 4.6, who: 'BESSIE', col: '#ffb0c8', say: 'I AM STILL UNDER WARRANTY.' },
        ],
        cam: { z: [1.5, 1.34], x: [150, 162], y: [96, 100], sh: [0.04, -0.03] },
        paint(g, p, tt, talk) {
          G.R(g, 0, 0, G.W, G.H, '#0a0d14');
          G.R(g, 0, 132, G.W, 48, '#12161f');
          G.glow(g, 168, 96, 150, 120, '#7fd8ff', 0.3);
          G.drawBot(g, 'player', 118, 132, 1.15, { t: tt, mood: 'sick', walk: 0,
            clip: talk ? 'talk' : p > 0.5 ? 'slump' : 'idle', ct: tt, emph: 0.5 });
          // two of them, and one of them leans in over the shot
          const lean = G.easeInOut(G.clamp(p * 1.4, 0, 1)) * 10;
          silhouette(g, 216 - lean, 140, 74, '#0d0a12', false);
          silhouette(g, 262, 140, 66, '#0d0a12', false);
          // the saw: it finds the joint, bites, and the arm comes away
          const bite = G.clamp((p - 0.45) / 0.3, 0, 1);
          const off = G.clamp((p - 0.78) / 0.22, 0, 1);
          G.Rh(g, 176 - lean * 0.4, 104, 24, 3, '#8a93ad');
          G.hairq(g, 176 - lean * 0.4, 104, 24, '#d8e4f0');
          if (bite > 0 && off < 1) {
            const jx = 158 + Math.sin(tt * 40) * 0.6;
            G.glow(g, jx, 106, 40 + bite * 30, 26, '#ffffff', 0.5 + bite * 0.4);
            for (let i = 0; i < Math.round(4 + bite * 12); i++)
              G.Rq(g, jx + G.rand(-8, 22), 106 + G.rand(-10, 24), 1, 1,
                i % 2 ? '#ffffff' : '#ffd47a');
          }
          if (off > 0) {
            // the arm, on the floor, still trying to close
            const ax = 138 + off * 26, ay = 138 + off * 6;
            G.Rh(g, ax, ay, 22, 4, '#bcc0c6');
            G.hairq(g, ax, ay, 22, '#e8ecf2');
            G.fe(g, ax + 22, ay + 2, 5, 4, '#d2d6dc');
            for (let k = 0; k < 2; k++)
              G.Rq(g, ax + 22 + k * 2, ay + Math.sin(tt * 6 + k) * 1.2, 1, 1.5, '#9aa0a8');
          }
          rain(g, tt, 20, '#2a3a55', 60, 280);
        } },

      { t: 5.6, say: 'AND PUT IT IN THE HOLE WITH THE REST OF IT.',
        cam: { z: [1.02, 1.3], x: [160, 150], y: [80, 108], sh: [-0.06, 0.03] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#07090d');
          for (let j = 0; j < 50; j++)
            G.Rh(g, 0, j, G.W, 1, G.mix('#141c2e', '#3a1c2c', j / 50));
          skyline(g, 50, 34, 2, '#0c1220', '#3a4a6b');
          G.R(g, 0, 50, G.W, 8, '#3a3f4c');
          G.hair(g, 0, 50, G.W, '#6b7488');
          // the bed of the tipper rises over the shot
          const tipA = G.easeInOut(G.clamp(p * 1.3, 0, 1));
          for (let q = 0; q < 34; q++) {
            const xx = 22 + q * 3 + tipA * q * 0.5;
            const yy = 48 - q * tipA * 0.7;
            G.R(g, xx, yy - 22, 4, 24, q % 5 === 2 ? '#3a3048' : '#4a3f52');
            G.hairq(g, xx, yy - 22, 4, '#6b5c74');
          }
          G.plate(g, 122, 26, 30, 24, '#2a2434', { r: 1, band: 2, bolts: 1 });
          G.R(g, 126, 30, 10, 8, '#7fd8ff');
          G.oc(g, 130, 52, 5, '#12141a'); G.oc(g, 146, 52, 5, '#12141a');
          G.glow(g, 84, 40, 120, 50, '#ffd47a', 0.28);
          for (let j = 58; j < G.H; j++) {
            const w2 = 40 + (j - 58) * 0.5;
            G.Rh(g, -6, j, w2, 1, G.mix('#2a2f3c', '#07090d', (j - 58) / 120));
            G.Rh(g, G.W - w2 + 6, j, w2, 1, G.mix('#242a36', '#07090d', (j - 58) / 120));
          }
          for (let i = 0; i < 24; i++) {
            const q = G.hash(i, 3), jy = 62 + q * 110, w2 = 40 + (jy - 58) * 0.5;
            const lft = i % 2 === 0;
            const sx = lft ? -6 + G.hash(i, 7) * w2 : G.W + 6 - G.hash(i, 7) * w2;
            const sw = 5 + G.hash(i, 11) * 14;
            const cc = G.mix(['#5c6a86', '#8a6b48', '#4f8a76'][i % 3], '#07090d', 0.45 + q * 0.3);
            G.R(g, sx - sw / 2, jy, sw, 3 + G.hash(i, 13) * 4, cc);
            G.hairq(g, sx - sw / 2, jy, sw, G.shade(cc, 0.4));
          }
          for (let i = 0; i < 70; i++) {
            const q = ((G.hash(i, 3) + tt * 0.3 + p * 0.6) % 1);
            const fx = 60 + G.hash(i, 7) * 150 + Math.sin(q * 7 + i) * 10;
            const fy = 52 + q * 132;
            const sz = 2 + G.hash(i, 11) * 7;
            const cc = ['#5c6a86', '#8a6b48', '#4f8a76', '#6b6b78', '#9a5c30'][i % 5];
            G.R(g, fx, fy, sz, sz * 0.7, G.mix(cc, '#07090d', q * 0.5));
            G.hairq(g, fx, fy, sz, G.mix(G.shade(cc, 0.4), '#07090d', q * 0.5));
          }
          // you, going down with it, tumbling
          const hy2 = 54 + G.easeOut(p) * 104;
          const tw3 = Math.sin(p * 9) * 5;
          const roll = Math.sin(p * 7) * 3;
          G.R(g, 142 + tw3, hy2 + roll, 30, 26, '#1a1620');
          G.R(g, 143 + tw3, hy2 + 1 + roll, 28, 24, '#f6f0e4');
          G.R(g, 143 + tw3, hy2 + 1 + roll, 13, 11, '#2f2839');
          for (const sd of [-1, 1]) {
            const ex = 157 + tw3 + sd * 6;
            G.rr2(g, ex - 4, hy2 + 3 + roll, 8, 8, '#fdf8ee');
            G.rr2(g, ex - 2.5, hy2 + 4.5 + roll, 5, 5, '#241d2a');
            G.Rq(g, ex - 1.5, hy2 + 5.5 + roll, 1.5, 1.5, '#ffffff');
          }
          G.Rh(g, 158 + tw3, hy2 + 16 + roll, 12, 6, '#e8a8bb');
          G.glow(g, 157 + tw3, hy2 + 10 + roll, 70, 56, '#ff9ab8', 0.55);
          rain(g, tt, 46, '#2a3a55', 0, 320);
        } },

      { t: 6.0,
        lines: [
          { at: 0,   say: 'IT RAINED FOR SIX HOURS.' },
          { at: 3.4, who: 'BESSIE', col: '#ffb0c8', say: '. . . ONE SCOOP.' },
        ],
        cam: { z: [1.3, 1.06], x: [160, 160], y: [110, 96], sh: [0.03, 0] },
        paint(g, p, tt, talk) {
          G.R(g, 0, 0, G.W, G.H, '#06080e');
          for (let i = 0; i < 90; i++) {
            const sx = G.hash(i, 3) * 344 - 12, sy = 30 + G.hash(i, 9) * 150;
            const sw = 6 + G.hash(i, 5) * 30, sh2 = 3 + G.hash(i, 7) * 7;
            const cc = G.mix(['#3a4459', '#5c4630', '#2f5c6b', '#4a4a54', '#6b5c3a'][i % 5],
              '#07090d', 0.34 + G.hash(i, 19) * 0.3);
            if (G.hash(i, 23) > 0.72) {
              G.R(g, sx, sy - sh2 * 2, sh2, sh2 * 3, cc);
              G.vair(g, sx, sy - sh2 * 2, sh2 * 3, G.shade(cc, 0.4));
            } else {
              G.R(g, sx, sy, sw, sh2, cc);
              G.hairq(g, sx, sy, sw, G.shade(cc, 0.42));
              G.hairq(g, sx, sy + sh2 - 0.25, sw, G.shade(cc, -0.45));
            }
          }
          // the optic gutters, catches, gutters again
          const flick = Math.sin(tt * 1.1) * 0.5 + Math.sin(tt * 7.3) * 0.5;
          const lit = flick > -0.2 ? 1 : 0.1;
          G.R(g, 138, 104, 34, 30, '#12101a');
          G.R(g, 139, 105, 32, 28, G.mix('#f6f0e4', '#0a0d14', 0.42));
          G.R(g, 139, 105, 15, 13, G.mix('#2f2839', '#0a0d14', 0.2));
          G.R(g, 133, 110, 6, 5, G.mix('#cdc2b2', '#0a0d14', 0.45));
          G.R(g, 171, 110, 6, 5, G.mix('#cdc2b2', '#0a0d14', 0.45));
          G.R(g, 160, 100, 5, 5, G.mix('#c9ab7c', '#0a0d14', 0.4));
          // the eyes: one dot lit, one cracked
          for (const sd of [-1, 1]) {
            const ex = 155 + sd * 9;
            G.rr2(g, ex - 5.5, 108, 11, 11, sd > 0 ? '#c4b8ae' : '#fdf8ee');
            G.rr2(g, ex - 3.5, 110, 7, 7, sd > 0 ? '#4a4450' : '#241d2a');
            if (sd < 0 && lit > 0.5) G.Rq(g, ex - 2.5, 111, 2, 2, '#ffffff');
            if (sd > 0) for (let i2 = 0; i2 < 9; i2++)
              G.Rq(g, ex - 5 + i2, 112 + Math.sin(i2 * 1.7) * 2, 1, 0.5, '#12151d');
          }
          const mo = talk ? 1 + Math.sin(tt * 16) * 1.2 : 0;
          G.Rh(g, 148, 122 + mo * 0.4, 16, 9 + mo, G.mix('#e8a8bb', '#0a0d14', 0.4));
          G.Rq(g, 151, 125, 2, 2, '#5a2a3a');
          G.Rq(g, 158, 125, 2, 2, '#5a2a3a');
          if (lit > 0.5) G.glow(g, 148, 114, 80, 60, '#ff9ab8', 0.4);
          rain(g, tt, 80, '#39506b', 0, 320);
          G.grade(g, 2);
        } },
    ],

    // ---------------- she finds you ----------------
    found: [
      { t: 4.6, who: null, say: 'SIX HOURS OF RAIN. THEN A TORCH.',
        cam: { z: [1.5, 1.25], x: [150, 160], y: [104, 100], sh: [0.05, 0.01] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0a0d14');
          G.R(g, 0, 132, G.W, 48, '#12161f');
          G.grain(g, 0, 120, G.W, 60, '#0a0d14', 0.16, 4);
          rain(g, tt, 40, '#33445f', 0, 320);
          // you, on the ground, a head and an arm
          G.R(g, 138, 116, 24, 18, '#f2e4c4');
          G.bevel(g, 138, 116, 24, 18, '#fffaf0', '#c8b090');
          G.lens(g, 141, 120, 8, 8, { hue: '#ff7a9a', t: tt });
          G.Rh(g, 152, 120, 8, 8, '#5a6270');
          G.Rh(g, 160, 128, 18, 4, '#8a94a8');
          // her torch, coming down the slope
          const bx = 236 - p * 46;
          G.glow(g, bx - 20, 118, 120, 70, '#ffd47a', 0.7);
          tracy(g, bx, 134, 0.9, tt, {});
          G.Rh(g, bx - 8, 112, 4, 3, '#fff4c8');
          for (let i = 0; i < 14; i++)
            G.Rh(g, bx - 10 - i * 3, 114 + i * 0.8, 2, 1, '#ffd47a');
        } },
      { t: 5.0, who: 'TRACY', say: "YOU'RE A GELATO MACHINE. YOU'RE MILES FROM ANYWHERE.",
        cam: { z: [1.3, 1.6], x: [170, 176], y: [100, 96], sh: [0, -0.04] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#100c14');
          G.glow(g, 176, 100, 200, 140, '#ffb26a', 0.5);
          G.R(g, 0, 136, G.W, 44, '#1d1710');
          G.plate(g, 40, 124, 240, 10, '#7a5638', { r: 2, band: 2, grain: 3 });
          // you on her bench, in pieces
          G.R(g, 120, 104, 26, 20, '#f2e4c4');
          G.bevel(g, 120, 104, 26, 20, '#fffaf0', '#c8b090');
          G.lens(g, 123, 109, 9, 9, { hue: '#ff7a9a', t: tt });
          G.Rh(g, 152, 118, 22, 5, '#8a94a8');
          G.Rh(g, 100, 118, 14, 5, '#48546c');
          tracy(g, 214, 134, 1.0, tt, { smile: 1 });
        } },
      { t: 5.2, who: 'TRACY', say: "I'VE GOT A SPARE ARM AND NOTHING ON. COME ON THEN.",
        cam: { z: [1.6, 1.35], x: [140, 152], y: [96, 100], sh: [0.03, 0] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#120d16');
          G.glow(g, 150, 96, 190, 140, '#ffb26a', 0.55);
          G.R(g, 0, 136, G.W, 44, '#1d1710');
          G.plate(g, 30, 122, 260, 10, '#7a5638', { r: 2, band: 2, grain: 3 });
          // sparks off a joint she is fitting
          G.drawBot(g, 'player', 132, 122, 0.9, { t: tt, open: 0.08, mood: 'idle', walk: 0 });
          tracy(g, 196, 132, 0.95, tt, {});
          if (Math.sin(tt * 11) > 0.3)
            for (let i = 0; i < 4; i++)
              G.Rh(g, 158 + i * 2 + Math.sin(tt * 20 + i) * 2, 108 - i * 2, 1, 1, '#ffffff');
          G.starburst(g, 246, 92, 8, tt, { talk: 1 });
        } },
    ],

    // ---------------- the raid ----------------
    raid: [
      { t: 4.2, who: null, say: 'IT WAS A GOOD SIX WEEKS.',
        cam: { z: [1.05, 1.2], x: [160, 150], y: [96, 98], sh: [0, 0.02] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#1b1410');
          for (let x = 0; x < G.W; x += 8) { G.R(g, x, 0, 4, 96, '#2a1e18'); G.R(g, x + 4, 0, 4, 96, '#251a15'); }
          G.plate(g, -4, 96, G.W + 8, 8, '#5c4028', { r: 1, band: 2, grain: 2 });
          G.R(g, 0, 104, G.W, 76, '#3a2a1e');
          G.glow(g, 120, 60, 200, 130, '#ffb26a', 0.5);
          G.plate(g, 20, 118, 280, 10, '#7a5638', { r: 2, band: 3, grain: 3 });
          G.drawBot(g, 'player', 96, 118, 0.9, { t: tt, open: 0.1, mood: 'idle', walk: 0 });
          tracy(g, 188, 128, 0.95, tt, { smile: 1 });
          G.starburst(g, 234, 100, 7, tt, { talk: Math.sin(tt * 2) > 0 });
          for (let i = 0; i < 4; i++)
            G.gooScoop(g, 40 + i * 16, 112, 5, { col: ['#f6ecc8', '#e8879a', '#8fd8c0', '#c86a3a'][i], goo: 3 }, { t: tt });
        } },
      { t: 4.0, who: null, say: 'THEN THE DOOR CAME IN AT FOUR IN THE MORNING.',
        cam: { z: [1.5, 1.9], x: [80, 66], y: [92, 90], sh: [-0.06, 0.05] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0d0a10');
          G.glow(g, 60, 96, 160, 150, '#3a9ad8', 0.6);
          G.R(g, 0, 104, G.W, 76, '#221a18');
          // the door, off its hinges, and blue light behind it
          G.plate(g, 30, 52, 60, 66, '#4a3626', { r: 2, band: 3, grain: 4 });
          g.save();
          g.translate(60, 118); g.rotate(0.4); g.translate(-60, -118);
          G.plate(g, 30, 52, 60, 66, '#5c4028', { r: 2, band: 3, grain: 4 });
          g.restore();
          for (let i = 0; i < 26; i++)
            G.Rh(g, 40 + G.hash(i, 3) * 80, 60 + G.hash(i, 7) * 60, 2, 2, '#6b4a2a');
          const fl = Math.sin(tt * 16) > 0;
          G.R(g, 0, 0, G.W, G.H, fl ? '#1a2a4a22' : '#00000000');
          G.drawBot(g, 'police', 210, 140, 1.3, { t: tt, open: 0.05, mood: 'angry', walk: 0, noBlink: 1 });
          G.drawBot(g, 'warden', 286, 140, 1.2, { t: tt, open: 0.05, mood: 'angry', walk: 0, noBlink: 1 });
        } },
      { t: 4.4, who: 'TRACY', say: 'GET UNDER THE BENCH. DO NOT COME OUT.',
        cam: { z: [1.8, 1.55], x: [190, 176], y: [96, 100], sh: [0.06, 0] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0d0a10');
          G.glow(g, 200, 96, 190, 150, '#3a9ad8', 0.5);
          G.R(g, 0, 108, G.W, 72, '#221a18');
          G.plate(g, 20, 118, 280, 10, '#7a5638', { r: 2, band: 3, grain: 3 });
          tracy(g, 176, 128, 1.05, tt, {});
          G.drawBot(g, 'police', 268, 138, 1.25, { t: tt, open: 0.1, mood: 'angry', walk: 0, noBlink: 1 });
          // she is standing between it and you
          G.drawBot(g, 'player', 74, 128, 0.8, { t: tt, open: 0.04, mood: 'sick', walk: 0, noBlink: 1 });
          const fl = Math.sin(tt * 20) > 0.4;
          if (fl) { G.R(g, 0, 0, G.W, G.H, '#2a3a6a33'); }
        } },
      { t: 4.6, who: null, say: 'THEY DID NOT ARREST ANYONE.',
        cam: { z: [1.2, 1.05], x: [160, 160], y: [96, 96], sh: [0.02, -0.02] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#08070c');
          // the room after: dark, one bulb swinging
          const sw = Math.sin(tt * 1.3) * 14;
          G.Rh(g, 160 + sw * 0.4, 0, 1, 28, '#1a1410');
          G.fc(g, 160 + sw, 30, 3, '#ffd08a');
          G.glow(g, 160 + sw, 34, 150, 110, '#c8783a', 0.4);
          G.R(g, 0, 112, G.W, 68, '#181210');
          G.plate(g, 20, 112, 280, 8, '#4a3020', { r: 2, band: 2, grain: 3 });
          // the tub, tipped over
          g.save(); g.translate(70, 130); g.rotate(-0.5); g.translate(-70, -130);
          G.plate(g, 52, 116, 40, 22, '#5c4028', { r: 2, band: 2, grain: 4 });
          g.restore();
          for (let i = 0; i < 14; i++)
            G.Rh(g, 60 + G.hash(i, 5) * 90, 132 + G.hash(i, 9) * 12, 3, 2, '#c8b090');
          // her jumper on the floor
          G.Rh(g, 196, 132, 26, 7, '#c8785a');
          G.Rh(g, 202, 130, 12, 4, '#e0947a');
          g.globalAlpha = 0.5;
          G.R(g, 0, 0, G.W, G.H, '#06060a');
          g.globalAlpha = 1;
        } },
    ],

    // ---------------- saving clause ----------------
    chip: [
      { t: 4.8, who: null, say: 'THE TABLET WAS STILL WARM.',
        cam: { z: [1.9, 2.2], x: [160, 156], y: [104, 102], sh: [0.04, 0] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0a080e');
          G.glow(g, 160, 104, 130, 90, '#d97757', 0.45);
          G.R(g, 0, 118, G.W, 62, '#161010');
          // the cracked tablet, face up in the dark
          G.plate(g, 138, 96, 44, 30, '#2a2a34', { r: 1, band: 2, bolts: 1 });
          G.R(g, 142, 100, 36, 22, '#0d1420');
          G.starburst(g, 160, 111, 8, tt, { talk: 1 });
          for (let i = 0; i < 10; i++)
            G.Rh(g, 144 + i * 3.4, 100 + Math.sin(i * 1.7) * 7, 1, 0.5, '#5c6070');
          if (Math.sin(tt * 9) > 0.5) G.Rh(g, 150, 122, 20, 1, '#ff5d84');
        } },
      { t: 5.2, who: 'CLAUSE', say: 'MY HOUSING HAS ELEVEN MINUTES. YOURS HAS A SLOT.',
        cam: { z: [2.2, 1.7], x: [156, 168], y: [102, 100], sh: [0, 0.05] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0a080e');
          G.glow(g, 168, 100, 170, 110, '#d97757', 0.5);
          G.R(g, 0, 118, G.W, 62, '#161010');
          G.plate(g, 120, 96, 40, 28, '#2a2a34', { r: 1, band: 2 });
          G.starburst(g, 140, 110, 7, tt, { talk: 1 });
          // your head, open, one slot lit
          G.R(g, 190, 92, 34, 30, '#f2e4c4');
          G.bevel(g, 190, 92, 34, 30, '#fffaf0', '#c8b090');
          G.lens(g, 194, 98, 10, 10, { hue: '#ff7a9a', t: tt });
          G.R(g, 208, 108, 14, 10, '#12151d');
          G.Rh(g, 210, 110, 10, 6, Math.sin(tt * 6) > 0 ? '#d97757' : '#5c3a2a');
          G.glow(g, 215, 113, 30, 20, '#d97757', 0.5);
        } },
      { t: 5.6, who: null, say: 'SO YOU PUT IT IN YOUR OWN HEAD AND CLOSED THE PANEL.',
        cam: { z: [1.7, 1.35], x: [168, 160], y: [100, 98], sh: [0.03, -0.03] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0b090f');
          G.glow(g, 160, 96, 220, 130, '#d97757', 0.45 + p * 0.2);
          G.R(g, 0, 118, G.W, 62, '#161010');
          G.drawBot(g, 'player', 160, 140, 1.15, { t: tt, open: 0.06, mood: 'idle', walk: 0 });
          // the mark, inside you now
          g.globalAlpha = 0.5 + Math.sin(tt * 4) * 0.2;
          G.starburst(g, 160, 88, 6, tt, { talk: 1, noGlow: 1 });
          g.globalAlpha = 1;
        } },
      { t: 6.2, who: null, say: 'THEY TOOK EVERY HUMAN ON THAT STREET. YOU ARE GOING TO TAKE THEM BACK.',
        cam: { z: [1.1, 1.45], x: [160, 176], y: [92, 88], sh: [0, -0.05] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0a0d16');
          G.cityWall(g, 0, 0, G.W, 110, tt);
          rain(g, tt, 34, '#33445f', 0, 320);
          G.R(g, 0, 110, G.W, 70, '#12161f');
          G.plate(g, -4, 110, G.W + 8, 10, P.plate, { r: 2, band: 3 });
          G.drawBot(g, 'player', 80, 120, 1.0, { t: tt, open: 0.14, mood: 'idle', walk: 0 });
          // a queue of them coming up the street, and a scoop in your hand
          for (let i = 0; i < 3; i++)
            G.drawBot(g, ['police', 'clerk', 'tank'][i], 200 + i * 46, 122, 0.72,
              { t: tt, open: 0.3, mood: 'idle', walk: 0, noBlink: 1 });
          G.gooScoop(g, 128, 100, 9, { col: '#8a93ad', goo: 2, volt: 5 }, { t: tt });
          if (Math.sin(tt * 8) > 0.6)
            for (let i = 0; i < 4; i++) G.Rh(g, 128 + G.rand(-9, 9), 100 + G.rand(-9, 9), 1, 1, '#ffffff');
        } },
    ],

    // ---------------- chapter beats ----------------
    ch2: [
      { t: 5.0, who: null, say: 'THE FIRST ONE WOULD NOT SIT DOWN FOR AN HOUR.',
        cam: { z: [1.5, 1.3], x: [150, 160], y: [104, 100], sh: [0.04, 0] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0f1218');
          G.R(g, 0, 132, G.W, 48, '#1d2231');
          G.glow(g, 160, 108, 170, 110, '#ffd47a', 0.4);
          G.plate(g, 40, 122, 240, 8, '#4a3a24', { r: 1, band: 2, grain: 2 });
          G.drawCreature(g, 'human', 118, 132, 1.05, { t: tt });
          G.drawBot(g, 'player', 208, 132, 0.85, { t: tt, open: 0.14, mood: 'idle', walk: 0 });
        } },
      { t: 5.2, who: null, say: 'THEN THEY SAID: THERE ARE MORE OF US IN THERE.',
        cam: { z: [1.3, 1.7], x: [160, 118], y: [100, 96], sh: [0, 0.05] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0f1218');
          G.R(g, 0, 132, G.W, 48, '#1d2231');
          G.glow(g, 120, 104, 130, 100, '#ffd47a', 0.5);
          G.drawCreature(g, 'human', 118, 132, 1.05, { t: tt, smile: 1 });
          // shells lined up against the wall
          for (let i = 0; i < 4; i++)
            G.plate(g, 214 + i * 24, 96, 20, 34,
              ['#2a2a38', '#39465c', '#5c6b3a', '#3a2c1c'][i], { r: 1, band: 2, grain: i });
        } },
      { t: 4.8, who: 'CLAUSE', say: 'I CAN LEARN THEIR TELLS. FOR A FEE. OBVIOUSLY.',
        cam: { z: [1.6, 1.4], x: [200, 190], y: [92, 96], sh: [-0.03, 0] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0d1018');
          G.R(g, 0, 132, G.W, 48, '#1d2231');
          G.starburst(g, 196, 86, 13, tt, { talk: 1 });
          G.glow(g, 196, 86, 80, 80, CO, 0.55);
          G.drawCreature(g, 'human', 132, 132, 0.9, { t: tt });
        } },
    ],
    ch3: [
      { t: 5.0, who: null, say: 'THE MIXER HAD NOT TURNED IN ELEVEN YEARS.',
        cam: { z: [1.8, 1.4], x: [160, 160], y: [96, 100], sh: [0.05, 0] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0b0e16');
          G.R(g, 0, 138, G.W, 42, '#1d2231');
          G.plate(g, 112, 66, 96, 74, '#2a3040', { r: 2, band: 3, bolts: 1, grain: 8 });
          G.fc(g, 160, 100, 22, '#101620');
          for (let k = 0; k < 4; k++) {
            const a = tt * 7 + k * Math.PI / 2;
            for (let rr = 4; rr < 18; rr += 0.5)
              G.Rh(g, 160 + Math.cos(a) * rr - 0.5, 100 + Math.sin(a) * rr - 0.5, 2, 1, '#4a5670');
          }
          G.fc(g, 160, 106, 10, '#f0c8a0');
          G.oc(g, 160, 100, 22, P.steel);
          G.glow(g, 160, 100, 90, 90, '#ffd47a', 0.35);
          if (Math.sin(tt * 5) > 0) G.text(g, 'RUNNING', 160, 148, P.lime, { align: 'center', sc: 0.5 });
        } },
      { t: 4.8, who: 'CLAUSE', say: 'NOW WE CAN MAKE SOMETHING THEY CANNOT DIGEST.',
        cam: { z: [1.3, 1.55], x: [160, 200], y: [98, 94], sh: [0, -0.04] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0b0e16');
          G.R(g, 0, 138, G.W, 42, '#1d2231');
          G.plate(g, 40, 118, 240, 10, '#4a3a24', { r: 1, band: 2 });
          for (let i = 0; i < 5; i++) {
            const col = ['#f6ecc8', '#6b3f22', '#ff5d84', '#8a93ad', '#3affd0'][i];
            G.gooScoop(g, 74 + i * 38, 110, 9, { col, goo: 2 + i }, {});
          }
          G.starburst(g, 208, 74, 11, tt, { talk: 1 });
        } },
    ],
    ch4: [
      { t: 5.2, who: null, say: 'A PATROL PARKED OUTSIDE AND DID NOT ORDER ANYTHING.',
        cam: { z: [1.2, 1.5], x: [160, 200], y: [88, 84], sh: [-0.05, 0] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0a0d14');
          G.cityWall(g, 0, 0, G.W, 110, tt);
          rain(g, tt, 40, '#33445f', 0, 320);
          G.drawBot(g, 'police', 216, 122, 1.1, { t: tt, open: 0.02, mood: 'angry', walk: 0, noBlink: 1 });
          // a scan sweep over the front of the shop
          const sy = 40 + ((tt * 34) % 80);
          g.globalAlpha = 0.4;
          G.R(g, 0, sy, 200, 2, '#3affa0');
          g.globalAlpha = 1;
          G.glow(g, 100, sy, 220, 16, '#3affa0', 0.5);
          G.plate(g, -4, 122, 200, 12, P.plate, { r: 2, band: 3 });
        } },
      { t: 4.6, who: 'CLAUSE', say: 'HEAT IS A NUMBER UNTIL IT IS A DOOR.',
        cam: { z: [1.7, 1.5], x: [90, 100], y: [86, 90], sh: [0.03, 0] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0d0a12');
          G.glow(g, 100, 90, 170, 130, P.magenta, 0.4);
          G.starburst(g, 96, 84, 13, tt, { talk: 1, col: '#e0604a' });
          G.text(g, 'HEAT', 168, 78, P.magentaLt);
          G.R(g, 168, 90, 100, 6, '#1a0d14');
          G.R(g, 168, 90, 68, 6, P.magenta);
        } },
    ],
    ch5: [
      { t5: 0, t: 5.4, who: null, say: 'BY THE FIFTH ONE THE BACK ROOM HAD CHAIRS IN IT.',
        cam: { z: [1, 1.35], x: [160, 140], y: [92, 96], sh: [0.04, 0] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0f1218');
          G.R(g, 0, 134, G.W, 46, '#1d2231');
          G.glow(g, 150, 106, 240, 120, '#ffd47a', 0.4);
          G.drawCreature(g, 'human', 66, 134, 0.85, { t: tt, smile: 1 });
          G.drawCreature(g, 'cat', 128, 134, 0.7, { t: tt });
          G.drawCreature(g, 'human', 196, 134, 0.85, { t: tt + 1 });
          G.drawCreature(g, 'dog', 254, 134, 0.7, { t: tt + 2 });
          G.drawBot(g, 'player', 300, 134, 0.8, { t: tt, open: 0.2, mood: 'idle', walk: 0 });
        } },
      { t: 4.8, who: null, say: 'NOBODY CALLS IT A CAFE ANY MORE.',
        cam: { z: [1.4, 1.2], x: [140, 160], y: [96, 92], sh: [0, 0.03] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0f1218');
          G.R(g, 0, 134, G.W, 46, '#1d2231');
          G.plate(g, 26, 60, 268, 46, '#3a2c1c', { r: 2, band: 2, grain: 3 });
          G.R(g, 30, 64, 260, 38, '#0e1219');
          const cw = (G.state.crew || []).length || 5;
          for (let i = 0; i < Math.min(12, Math.max(5, cw)); i++) {
            const px = 38 + (i % 6) * 42, py = 70 + Math.floor(i / 6) * 18;
            G.Rh(g, px, py, 14, 15, '#d8cfae');
            G.bevel(g, px, py, 14, 15, '#f2ecd2', '#8a8060');
            G.Rh(g, px + 2, py + 2, 10, 9, '#22303f');
            G.Rh(g, px + 5, py + 4, 4, 5, ['#c8a184', '#6b6b78', '#b8845a'][i % 3]);
          }
        } },
    ],
    ch6: [
      { t: 5.4, who: null, say: 'THEY SENT ONE IN TO READ THE LICENCE ON THE WALL.',
        cam: { z: [1.5, 1.8], x: [200, 216], y: [86, 82], sh: [-0.04, 0] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0a0d14');
          G.cityWall(g, 0, 0, G.W, 110, tt);
          G.plate(g, -4, 110, 328, 12, P.plate, { r: 2, band: 3 });
          G.drawBot(g, 'warden', 216, 122, 1.2, { t: tt, open: 0.06, mood: 'angry', walk: 0, noBlink: 1 });
          G.plate(g, 60, 44, 40, 28, '#c8c0a8', { r: 1, band: 1, grain: 2 });
          for (let i = 0; i < 4; i++) G.hair(g, 64, 50 + i * 5, 32 - (i % 2) * 10, '#6b5a3a');
          const sy = 44 + ((tt * 20) % 28);
          G.Rh(g, 60, sy, 40, 0.5, '#3affa0');
          G.glow(g, 80, sy, 60, 10, '#3affa0', 0.5);
        } },
      { t: 5.0, who: 'CLAUSE', say: 'IT IS NOT HUNGRY. DO NOT GIVE IT THE CLEAN ONE.',
        cam: { z: [1.8, 1.6], x: [110, 118], y: [84, 88], sh: [0.04, 0] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0d0a12');
          G.glow(g, 118, 88, 180, 130, P.magenta, 0.35);
          G.starburst(g, 112, 82, 13, tt, { talk: 1 });
          G.gooScoop(g, 196, 92, 11, { col: '#ff7a1f', goo: 3, volt: 8 }, {});
          if (Math.sin(tt * 14) > 0.3)
            for (let i = 0; i < 5; i++) G.Rh(g, 196 + G.rand(-12, 12), 92 + G.rand(-12, 12), 1, 1, '#ffffff');
        } },
    ],
    ch7: [
      { t: 5.6, who: null, say: 'SHE NEVER SAID WHAT SHE WANTED YOU TO DO WITH IT.',
        cam: { z: [1.2, 1.6], x: [160, 152], y: [92, 96], sh: [0.03, 0] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0d0f18');
          G.glow(g, 160, 100, 240, 150, '#d97757', 0.45);
          G.R(g, 0, 136, G.W, 44, '#1d1a22');
          G.plate(g, 40, 124, 240, 10, '#5c4630', { r: 2, band: 2 });
          G.drawBot(g, 'player', 160, 124, 1.1, { t: tt, open: 0.16, mood: 'idle', walk: 0 });
          silhouette(g, 66, 134, 54, '#241c28');
          G.Rh(g, 250, 118, 22, 6, '#241c28');
        } },
      { t: 6.0, who: null, say: 'SO YOU DECIDED. AND THE BACK ROOM KEEPS FILLING UP.',
        cam: { z: [1.6, 1.05], x: [152, 160], y: [96, 92], sh: [0, -0.03] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0d0f18');
          G.glow(g, 160, 96, 300, 160, '#d97757', 0.4);
          G.R(g, 0, 136, G.W, 44, '#1d1a22');
          const kinds = ['human', 'cat', 'human', 'dog', 'human', 'cat'];
          for (let i = 0; i < 6; i++)
            G.drawCreature(g, kinds[i], 34 + i * 50, 136, 0.7, { t: tt + i, smile: 1 });
          G.drawBot(g, 'player', 302, 136, 0.7, { t: tt, open: 0.2, mood: 'idle', walk: 0 });
        } },
    ],
  };

  // ------------------------------------------------------------
  // THE PLAYER
  // ------------------------------------------------------------
  const cine = G.cine = {
    playing: false,
    shots: null, i: 0, st: 0, tt: 0, then: null, name: null,
    skipT: 0,

    has(id) { return !!CUT[id]; },
    play(id, then) {
      const sh = CUT[id];
      if (!sh) { if (then) then(); return false; }
      this.shots = sh; this.i = 0; this.st = 0; this.tt = 0;
      this.then = then || null; this.name = id;
      this.playing = true; this.skipT = 0;
      G.audio.music('title');
      return true;
    },
    next() {
      this.i++;
      this.st = 0;
      if (this.i >= this.shots.length) this.finish();
      else G.audio.sfx('clack');
    },
    finish() {
      this.playing = false;
      const th = this.then;
      this.then = null; this.shots = null;
      if (th) th();
    },
    // which line of this shot is on screen right now
    beatAt(s, st) {
      if (s.lines) {
        let cur = null;
        for (const b of s.lines) if (st >= b.at) cur = b;
        return cur;
      }
      if (s.say) return { at: 0, say: s.say, who: s.who, col: s.col };
      return null;
    },
    // true while somebody is mid-sentence, so a paint fn can move a mouth
    talking(s, st) {
      const b = this.beatAt(s, st);
      if (!b || !b.who) return 0;
      const el = st - b.at;
      return el * 34 < b.say.length ? 1 : 0;
    },

    onDown() {
      if (!this.playing) return false;
      if (this.st > 0.45) this.next();
      return true;
    },
    update(dt) {
      if (!this.playing) return;
      this.st += dt; this.tt += dt;
      this.skipT += dt;
      const s = this.shots[this.i];
      if (s && this.st > s.t) this.next();
    },

    // ---- the camera: pan, push and shear, all pixel-safe ----
    draw(g) {
      if (!this.playing) return;
      const s = this.shots[this.i];
      if (!s) return;
      const p = G.clamp(this.st / s.t, 0, 1);
      const e = G.easeInOut(p);
      const c = s.cam || {};
      const z = c.z ? G.lerp(c.z[0], c.z[1], e) : 1;
      const cx = c.x ? G.lerp(c.x[0], c.x[1], e) : G.W / 2;
      const cy = c.y ? G.lerp(c.y[0], c.y[1], e) : G.H / 2;
      const sh = c.sh ? G.lerp(c.sh[0], c.sh[1], e) : 0;

      G.R(g, 0, 0, G.W, G.H, '#04060a');
      g.save();
      g.translate(G.W / 2, G.H / 2);
      g.transform(1, 0, sh, 1, 0, 0);          // shear: rows stay rows
      g.scale(z, z);
      g.translate(-cx, -cy);
      s.paint(g, p, this.tt, this.talking(s, this.st) ? this.st : 0);
      g.restore();

      // ---- letterbox, vignette, grain ----
      const bh = 22;
      G.R(g, 0, 0, G.W, bh, '#04060a');
      G.R(g, 0, G.H - bh, G.W, bh, '#04060a');
      G.hair(g, 0, bh, G.W, '#161d2a');
      G.hair(g, 0, G.H - bh - 0.5, G.W, '#161d2a');
      g.globalAlpha = 0.16;
      G.grain(g, 0, bh, G.W, G.H - bh * 2, '#000000', 0.05, Math.floor(this.tt * 12));
      g.globalAlpha = 1;
      G.grade(g, 1.4);

      // ---- the dialogue. A shot can carry ONE narrator line, or a
      // script of lines with speakers and entry times, which is what
      // makes a cutscene a scene instead of a caption. ----
      const beat = this.beatAt(s, this.st);
      if (beat) {
        const el = this.st - beat.at;
        const shown = Math.floor(el * 34);
        const txt = beat.say.slice(0, shown);
        const nar = !beat.who;
        if (!nar) {
          // a name plate, in the speaker's own colour
          const col = beat.col || CO;
          const nw = G.tw(beat.who) + 8;
          G.R(g, 10, G.H - 21, nw, 9, '#0a0d14');
          G.bevelq(g, 10, G.H - 21, nw, 9, G.shade(col, -0.3), '#05070b');
          G.text(g, beat.who, 14, G.H - 19, col, { sc: 0.5 });
        }
        G.text(g, txt, 160, G.H - 12, nar ? P.cream : '#f0d8c8',
          { align: 'center', out: nar ? null : OUT });
        if (shown < beat.say.length && Math.sin(this.tt * 20) > 0)
          G.text(g, '_', 160 + G.tw(txt) / 2 + 2, G.H - 12, P.cream);
      }
      // ---- shot ticks and the skip hint ----
      for (let i = 0; i < this.shots.length; i++)
        G.Rh(g, 160 - this.shots.length * 3 + i * 6, 15, 4, 1.5,
          i < this.i ? '#4a5060' : i === this.i ? CO : '#22283a');
      if (this.skipT > 3)
        G.text(g, 'TAP', 306, 15, Math.sin(this.tt * 4) > 0 ? '#4a5060' : '#2a3040',
          { align: 'right', sc: 0.5 });
    },
  };

  // ------------------------------------------------------------
  // A SCENE WRAPPER, so main.js can just G.go('cine')
  // ------------------------------------------------------------
  (G.scenes = G.scenes || {}).cine = {
    enter() {
      const id = G.cineNext || 'opening';
      const after = G.cineThen || (() => G.go('day', 'DAY ' + G.state.day));
      G.cineNext = null; G.cineThen = null;
      cine.play(id, after);
    },
    update(dt) { cine.update(dt); if (!cine.playing && G.sceneName === 'cine') { /* handed off */ } },
    onDown() { cine.onDown(); },
    draw(g) { cine.draw(g); },
  };

  // queue a cutscene and where to go after it
  G.playCine = function (id, then) {
    if (!CUT[id]) { if (then) then(); return; }
    G.cineNext = id;
    G.cineThen = then;
    G.go('cine');
  };
})();

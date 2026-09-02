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
  // she is one model now, the same one the kitchen and the bench use
  function tracy(g, x, footY, sc, t, o) {
    o = o || {};
    return G.drawTracy(g, x, footY, sc, Object.assign({ t }, o));
  }

  // ------------------------------------------------------------
  // BIG MOO. A burger chain with a cow on the sign, open twenty-four
  // hours, and for six years you were the cow. Everything in the
  // opening is built out of these four painters.
  // ------------------------------------------------------------
  function neonTube(g, pts, col, on, w) {
    for (const q of pts) G.Rh(g, q[0] - (w || 1), q[1] - (w || 1), (w || 1) * 2, (w || 1) * 2, '#1a1220');
    for (const q of pts) {
      G.Rh(g, q[0] - (w || 1) * 0.5, q[1] - (w || 1) * 0.5, (w || 1), (w || 1),
        on > 0.5 ? col : G.mix(col, '#241826', 0.72));
    }
  }
  function mooSign(g, cx, y, t, o) {
    o = o || {};
    const dead = o.dead;
    const flick = dead ? 0 : (Math.sin(t * 27) > -0.9 && Math.sin(t * 3.1) > -0.95 ? 1 : 0.2);
    const pink = '#ff8ab0', gold = '#ffd45a';
    G.rr2(g, cx - 46, y - 1, 92, 42, '#080c14');
    G.rr2(g, cx - 45, y, 90, 40, '#18202e');
    G.bevelq(g, cx - 45, y, 90, 40, '#33425a', '#0a0f18');
    // the cow's head, in tube: a rounded skull, two ears, two eyes
    const hd = [];
    for (let i = 0; i <= 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      hd.push([cx + Math.cos(a) * 14, y + 13 + Math.sin(a) * 10]);
    }
    neonTube(g, hd, pink, flick, 1.5);
    // ears, drooping off each side
    neonTube(g, [[cx - 16, y + 12], [cx - 19, y + 14], [cx - 22, y + 15],
                 [cx + 16, y + 12], [cx + 19, y + 14], [cx + 22, y + 15]], pink, flick, 1.5);
    // a muzzle across the bottom of the head
    neonTube(g, [[cx - 6, y + 19], [cx - 3, y + 21], [cx, y + 21.5], [cx + 3, y + 21], [cx + 6, y + 19]],
      pink, flick, 1.5);
    neonTube(g, [[cx - 5, y + 10], [cx + 5, y + 10]], flick > 0.5 ? '#ffffff' : pink, flick, 2);
    neonTube(g, [[cx - 8, y - 1], [cx - 6, y - 3], [cx + 6, y - 3], [cx + 8, y - 1]], gold, flick, 1.5);
    if (flick > 0.5) G.glow(g, cx, y + 13, 90, 60, pink, 0.4);
    // the name
    G.text(g, 'BIG MOO', cx, y + 27, flick > 0.5 ? gold : '#6b5220', { align: 'center' });
    if (flick > 0.5) G.glow(g, cx, y + 30, 80, 22, gold, 0.35);
    G.text(g, 'OPEN 24 HRS', cx, y + 35, dead ? '#3a3040' : '#7fd8ff', { align: 'center', sc: 0.5 });
  }
  // wet tarmac: a flat dark ground that keeps the light that fell on it
  function wet(g, y, h, t, lights) {
    for (let j = 0; j < h; j++)
      G.Rh(g, 0, y + j, G.W, 1, G.mix('#161d2a', '#0a0e16', j / h));
    for (const L of lights || []) {
      g.globalAlpha = 0.24;
      for (let j = 0; j < 26; j++) {
        const w = L[2] * (1 - j / 30);
        G.Rh(g, L[0] - w / 2 + Math.sin(t * 2 + j * 0.7) * (j * 0.12), y + j, w, 1, L[1]);
      }
      g.globalAlpha = 1;
    }
    for (let i = 0; i < 26; i++) {
      const px = G.hash(i, 5) * 340 - 10, py = y + G.hash(i, 9) * h;
      g.globalAlpha = 0.3;
      G.rr(g, px, py, 6 + G.hash(i, 3) * 16, 2, '#3a4a63');
      g.globalAlpha = 1;
    }
  }
  // the shop front, seen from the car park
  function mooFront(g, tt, o) {
    o = o || {};
    for (let j = 0; j < 110; j++)
      G.Rh(g, 0, j, G.W, 1, G.mix('#0a1020', '#22213a', j / 110));
    skyline(g, 96, 34, 5, '#0a1018', '#2e3c58');
    // the building: a long low box with a lit window band
    G.R(g, 26, 62, 236, 52, '#2a3242');
    G.bevelq(g, 26, 62, 236, 52, '#414f66', '#151b26');
    G.R(g, 26, 58, 236, 6, '#8a2f3a');                 // the fascia stripe
    G.hairq(g, 26, 58, 236, '#c8505c');
    for (let i = 0; i < 12; i++) G.R(g, 30 + i * 20, 58, 10, 6, '#f0e2d4');
    // the window band, warm inside - or blown out and dark
    const wr = o.wrecked;
    G.R(g, 34, 70, 100, 34, wr ? '#0e1420' : '#ffd9a0');
    G.R(g, 168, 70, 86, 34, wr ? '#0e1420' : '#ffd9a0');
    for (const wx of [34, 168]) {
      const ww = wx === 34 ? 100 : 86;
      G.bevelq(g, wx, 70, ww, 34, wr ? '#2c3a4e' : '#fff2d8', wr ? '#060a10' : '#c89a58');
      for (let i = 1; i * 24 < ww; i++) G.Rh(g, wx + i * 24, 70, 1.5, 34, '#2a3242');
      if (!wr) G.glow(g, wx + ww / 2, 88, ww + 40, 70, '#ffbe6a', 0.4);
      else for (let i = 0; i < 7; i++)                 // the teeth left in the frame
        G.Rh(g, wx + 4 + i * (ww / 7), 70, 3 + G.hash(i, 3) * 5, 4 + G.hash(i, 9) * 8, '#3a4a63');
    }
    // people in the windows, cut out of the warm light
    if (!wr) for (let i = 0; i < 6; i++) {
      const bx = 44 + i * 32 + (i > 2 ? 40 : 0);
      if (bx > 250) continue;
      silhouette(g, bx, 102, 15 + (i % 3) * 4, '#9a5a34', false);
    }
    // the door, and the light it throws across the wet
    G.R(g, 138, 68, 26, 46, '#141b26');
    G.R(g, 141, 71, 20, 40, wr ? '#1a222e' : '#ffe6b8');
    G.Rh(g, 150, 71, 1.5, 40, '#141b26');
    if (!wr) G.glow(g, 151, 100, 90, 70, '#ffcf88', 0.45);
    // the sign, up its pole
    G.R(g, 272, 50, 5, 64, '#232b38');
    G.hairq(g, 272, 50, 5, '#465468');
    if (!o.noSign) mooSign(g, 274, 18, tt, { dead: o.dead });
    // the car park
    wet(g, 114, 66, tt, o.wrecked ? [[150, '#ff7a2a', 40]] : [[151, '#ffcf88', 30], [274, '#ff8ab0', 20]]);
    for (let i = 0; i < 5; i++) G.Rh(g, 20 + i * 62, 148, 34, 1, '#5a6a80');
  }
  // The dining room, from the stage end. Everything lives between
  // y=28 and y=170 so a 1.06 push still holds the whole set.
  function diner(g, tt, o) {
    o = o || {};
    const dim = o.dim || 0;
    const M = (c) => G.mix(c, '#241018', dim);
    // back wall: cream above a red dado
    G.R(g, 0, 0, G.W, 98, M('#f6e8d4'));
    G.R(g, 0, 0, G.W, 22, M('#8a2f3a'));
    G.hairq(g, 0, 22, G.W, M('#c8505c'));
    for (let i = 0; i < 20; i++) {                     // glazed tiles
      G.Rh(g, i * 17 + 1, 56, 15, 13, M('#eddcc4'));
      G.hairq(g, i * 17 + 1, 56, 15, M('#fff6ea'));
      G.Rh(g, i * 17 + 1, 71, 15, 8, M('#e6d3b8'));
    }
    G.R(g, 0, 51, G.W, 3, M('#c8505c'));
    // bunting, because somebody put it up for a birthday
    if (!o.noBunting) for (let i = 0; i < 13; i++) {
      const bx2 = 8 + i * 25, sag = Math.sin(i * 0.8 + tt * 0.6) * 2;
      G.Rh(g, bx2, 24 + sag, 5, 6, ['#ffd45a', '#8fd8c0', '#ff8ab0', '#7fd8ff'][i % 4]);
      G.Rh(g, bx2 + 1, 30 + sag, 3, 2, '#e0b040');
    }
    // the menu board, over the counter
    G.R(g, 92, 30, 136, 19, M('#1a1216'));
    G.bevelq(g, 92, 30, 136, 19, M('#3a2a2e'), '#0a0608');
    G.text(g, 'BURGER   SWIRL   FRIES', 160, 33, M('#ffd45a'), { align: 'center', sc: 0.5 });
    G.text(g, 'ASK ABOUT THE BIG MOO MEAL', 160, 41, M('#f0e2d4'), { align: 'center', sc: 0.5 });
    G.glow(g, 160, 40, 150, 28, '#ffd45a', 0.12 * (1 - dim));
    // the soft serve machine, standing on the counter
    G.plate(g, 246, 54, 24, 24, M('#c8ccd4'), { r: 1, band: 2, bolts: 1 });
    G.R(g, 251, 58, 13, 8, M('#3a4250'));
    G.Rh(g, 253, 60, 4, 4, M('#8fd8c0'));
    G.R(g, 255, 78, 6, 4, M('#8a94a8'));
    G.fe(g, 258, 83, 4, 3, M('#f6e8d4'));
    // the counter itself
    G.R(g, 62, 78, 196, 4, M('#e8d6b8'));
    G.hairq(g, 62, 78, 196, M('#fff6ea'));
    G.R(g, 62, 82, 196, 16, M('#8a5c3a'));
    G.bevelq(g, 62, 82, 196, 16, M('#b07a4a'), M('#4a2c18'));
    for (let i = 0; i < 10; i++) G.vseam(g, 66 + i * 20, 84, 12, M('#3a2418'), M('#b07a4a'));
    G.R(g, 62, 96, 196, 3, M('#4a2c18'));
    g.globalAlpha = 0.24; G.R(g, 58, 99, 204, 4, '#000000'); g.globalAlpha = 1;
    // a stack of trays and a till
    G.R(g, 78, 71, 20, 7, M('#c8505c'));
    for (let k = 0; k < 3; k++) G.hairq(g, 78, 72 + k * 2, 20, M('#e8828c'));
    G.plate(g, 108, 64, 18, 14, M('#3a4250'), { r: 1, band: 1, spec: false });
    G.Rh(g, 111, 67, 12, 4, M('#8fd8c0'));
    // the floor: a checker with its columns radiating from the middle,
    // so the rows actually line up instead of staircasing
    // A FLAT checker. Perspective tiling at this raster turns into
    // herringbone the moment the column edges wander, and a straight
    // checkerboard is what a diner floor reads as anyway. Depth comes
    // from the tone falling off toward the back instead.
    for (let j = 0; j < 15; j++) {
      const yy = 98 + j * 6;
      if (yy > 182) break;
      const d = Math.max(0, 0.34 - j * 0.05);
      for (let i = 0; i < 28; i++)
        G.Rh(g, i * 12 - 6, yy, 12, 6,
          (i + j) % 2 ? G.mix(M('#ecdfcc'), '#241018', d) : G.mix(M('#c4767c'), '#241018', d));
    }
    g.globalAlpha = 0.2; G.R(g, 0, 98, G.W, 10, '#3a1a20'); g.globalAlpha = 1;
    // booths against each side wall, sitting on the floor
    if (!o.noBooths) for (const sd of [-1, 1]) {
      const bx = sd < 0 ? -8 : 266;
      G.R(g, bx, 92, 62, 8, M('#c8505c'));
      G.R(g, bx + 4, 100, 54, 22, M('#8a2f3a'));
      G.hairq(g, bx, 92, 62, M('#e8828c'));
      G.R(g, bx + 8, 112, 46, 4, M('#c8a070'));        // the table top
      G.R(g, bx + 28, 116, 6, 12, M('#8a6a44'));
    }
  }

  // a pane letting go: shards on their own arcs
  function shards(g, cx, cy, p, n, col) {
    for (let i = 0; i < n; i++) {
      const a = G.hash(i, 3) * 2.6 - 1.3, sp = 30 + G.hash(i, 7) * 90;
      const sx = cx + Math.cos(a) * sp * p, sy = cy + Math.sin(a) * sp * p + p * p * 60;
      const sz = 1 + G.hash(i, 11) * 3;
      G.Rh(g, sx, sy, sz, sz * 1.6, col || '#bfe4ff');
      G.Rq(g, sx, sy, 1, 1, '#ffffff');
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
    // ---------------- she finds you ----------------
    // ---------------- she finds you ----------------
    found: [
      { t: 5.0, who: null, say: 'SIX HOURS OF RAIN. THEN A TORCH.',
        cam: { z: [1.4, 1.2], x: [150, 162], y: [116, 108] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0a0d14');
          for (let j = 0; j < 50; j++)
            G.Rh(g, 0, 100 + j, G.W, 1, G.mix('#1a1218', '#07090d', j / 40));
          for (let i = 0; i < 40; i++) {              // the rubble she is picking through
            const sx = G.hash(i, 3) * 344 - 12, sy = 108 + G.hash(i, 9) * 54;
            const sw = 6 + G.hash(i, 5) * 24;
            const cc = G.mix(['#3a4459', '#5c3630', '#8a2f3a', '#4a4a54'][i % 4], '#07090d', 0.4);
            G.R(g, sx, sy, sw, 4, cc);
            G.hairq(g, sx, sy, sw, G.shade(cc, 0.4));
          }
          // you, face down, one leg short
          G.drawBot(g, 'player', 128, 140, 0.95, {
            t: tt, mood: 'sick', walk: 0, crawl: 1, noBlink: Math.sin(tt * 1.3) > 0 ? 0 : 1,
            clip: 'slump', ct: tt, hands: [{ x: 102, y: 126 }, { x: 156, y: 130 }],
          });
          // her torch, coming down the slope
          const bx = 262 - p * 52;
          G.glow(g, bx - 18, 118, 130, 78, '#ffd47a', 0.6);
          G.drawTracy(g, bx, 142, 0.95, { t: tt, clip: 'walk', ct: tt, dir: -1, speed: 0.8, torch: 1 });
          for (let i = 0; i < 16; i++)
            G.Rh(g, bx - 12 - i * 3.4, 118 + i * 0.9, 2, 1, '#ffd47a');
          rain(g, tt, 70, '#33445f', 0, 320);
        } },

      { t: 5.4, who: 'TRACY', col: '#ffd0dc',
        say: "OH, YOU POOR ARTICLE. YOU'RE THE COW OFF THE SIGN.",
        cam: { z: [1.6, 1.38], x: [166, 158], y: [116, 112] },
        paint(g, p, tt, talk) {
          G.R(g, 0, 0, G.W, G.H, '#0c1018');
          for (let j = 0; j < 46; j++)
            G.Rh(g, 0, 126 + j, G.W, 1, G.mix('#31262c', '#120e16', j / 46));
          for (let i = 0; i < 22; i++) {
            const sx = G.hash(i, 7) * 344 - 12;
            const cc = G.mix(['#4a4459', '#6c4640', '#8a2f3a'][i % 3], '#120e16', 0.3);
            G.R(g, sx, 124 + G.hash(i, 11) * 28, 8 + G.hash(i, 3) * 18, 4, cc);
            G.hairq(g, sx, 124 + G.hash(i, 11) * 28, 8 + G.hash(i, 3) * 18, G.shade(cc, 0.4));
          }
          // her torch is the only light out here, so it goes on last
          G.glow(g, 186, 120, 260, 180, '#ffc072', 0.66);
          G.drawBot(g, 'player', 130, 144, 1.05, {
            t: tt, mood: 'sick', walk: 0, crawl: 1,
            clip: talk ? 'idle' : 'slump', ct: tt, hands: [{ x: 106, y: 132 }, { x: 156, y: 136 }],
          });
          // she gets down to it, which at her age is a decision
          G.drawTracy(g, 196, 152, 1.15, {
            t: tt, clip: talk ? 'talk' : 'reach', ct: tt, dir: -1,
            p: G.easeOut(G.clamp(p * 1.6, 0, 1)), smile: p > 0.6,
          });
          rain(g, tt, 46, '#33445f', 0, 320);
        } },

      { t: 5.6, who: 'TRACY', col: '#ffd0dc',
        say: "RIGHT. HOME. I'VE GOT A CRATE OF LEGS AND NOTHING ON TONIGHT.",
        cam: { z: [1.14, 1.32], x: [150, 176], y: [104, 100] },
        paint(g, p, tt, talk) {
          G.R(g, 0, 0, G.W, G.H, '#080b12');
          skyline(g, 96, 30, 6, '#0c1220', '#3a4a6b');
          for (let j = 0; j < 60; j++)
            G.Rh(g, 0, 120 + j, G.W, 1, G.mix('#161d2a', '#080b12', j / 50));
          G.glow(g, 210, 116, 150, 90, '#ffd47a', 0.35);
          // she carries you off the site, and you are not light
          const wx = G.lerp(70, 210, G.easeInOut(p));
          G.drawTracy(g, wx, 148, 1.1, {
            t: tt, clip: talk ? 'talk' : 'walk', ct: tt, dir: 1, speed: 0.7,
          });
          // the mascot, over her shoulder, head lolling
          G.drawBot(g, 'player', wx + 12, 128 + Math.sin(tt * 3) * 1, 0.7, {
            t: tt, mood: 'sick', walk: 0, crawl: 1, noBlink: 1, clip: 'slump', ct: tt,
            hands: [{ x: wx + 2, y: 122 }, { x: wx + 26, y: 126 }],
          });
          for (let i = 0; i < 5; i++)                  // her torch on the ground ahead
            G.Rh(g, wx + 26 + i * 6, 138 + i, 5, 1, '#ffd47a');
          rain(g, tt, 60, '#33445f', 0, 320);
        } },
    ],

    // ---------------- the raid ----------------
    raid: [
      { t: 4.2, who: null, say: 'IT WAS A GOOD SIX WEEKS.',
        cam: { z: [1.05, 1.2], x: [160, 150], y: [96, 98] },
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
        cam: { z: [1.5, 1.9], x: [80, 66], y: [92, 90] },
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
        cam: { z: [1.8, 1.55], x: [190, 176], y: [96, 100] },
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
        cam: { z: [1.2, 1.05], x: [160, 160], y: [96, 96] },
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
        cam: { z: [1.9, 2.2], x: [160, 156], y: [104, 102] },
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
        cam: { z: [2.2, 1.7], x: [156, 168], y: [102, 100] },
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
        cam: { z: [1.7, 1.35], x: [168, 160], y: [100, 98] },
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
        cam: { z: [1.1, 1.45], x: [160, 176], y: [92, 88] },
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
        cam: { z: [1.5, 1.3], x: [150, 160], y: [104, 100] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0f1218');
          G.R(g, 0, 132, G.W, 48, '#1d2231');
          G.glow(g, 160, 108, 170, 110, '#ffd47a', 0.4);
          G.plate(g, 40, 122, 240, 8, '#4a3a24', { r: 1, band: 2, grain: 2 });
          G.drawCreature(g, 'human', 118, 132, 1.0, { t: tt, clip: 'idle', ct: tt });
          G.drawBot(g, 'player', 208, 132, 1.0, { t: tt, open: 0.14, mood: 'idle', walk: 0 });
        } },
      { t: 5.2, who: null, say: 'THEN THEY SAID: THERE ARE MORE OF US IN THERE.',
        cam: { z: [1.3, 1.7], x: [160, 118], y: [100, 96] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0f1218');
          G.R(g, 0, 132, G.W, 48, '#1d2231');
          G.glow(g, 120, 104, 130, 100, '#ffd47a', 0.5);
          G.drawCreature(g, 'human', 118, 132, 1.0, { t: tt, smile: 1, clip: 'idle', ct: tt });
          // shells lined up against the wall
          for (let i = 0; i < 4; i++)
            G.plate(g, 214 + i * 24, 96, 20, 34,
              ['#2a2a38', '#39465c', '#5c6b3a', '#3a2c1c'][i], { r: 1, band: 2, grain: i });
        } },
      { t: 4.8, who: 'CLAUSE', say: 'I CAN LEARN THEIR TELLS. FOR A FEE. OBVIOUSLY.',
        cam: { z: [1.6, 1.4], x: [200, 190], y: [92, 96] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0d1018');
          G.R(g, 0, 132, G.W, 48, '#1d2231');
          G.starburst(g, 196, 86, 13, tt, { talk: 1 });
          G.glow(g, 196, 86, 80, 80, CO, 0.55);
          G.drawCreature(g, 'human', 132, 132, 1.0, { t: tt, clip: 'idle', ct: tt });
        } },
    ],
    ch3: [
      { t: 5.0, who: null, say: 'THE MIXER HAD NOT TURNED IN ELEVEN YEARS.',
        cam: { z: [1.8, 1.4], x: [160, 160], y: [96, 100] },
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
        cam: { z: [1.3, 1.55], x: [160, 200], y: [98, 94] },
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
        cam: { z: [1.2, 1.5], x: [160, 200], y: [88, 84] },
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
        cam: { z: [1.7, 1.5], x: [90, 100], y: [86, 90] },
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
        cam: { z: [1, 1.35], x: [160, 140], y: [92, 96] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0f1218');
          G.R(g, 0, 134, G.W, 46, '#1d2231');
          G.glow(g, 150, 106, 240, 120, '#ffd47a', 0.4);
          G.drawCreature(g, 'human', 66, 134, 0.95, { t: tt, smile: 1, clip: 'idle', ct: tt });
          G.drawCreature(g, 'cat', 128, 134, 0.62, { t: tt });
          G.drawCreature(g, 'human', 196, 134, 0.95, { t: tt + 1, clip: 'idle', ct: tt });
          G.drawCreature(g, 'dog', 254, 134, 0.62, { t: tt + 2 });
          G.drawBot(g, 'player', 300, 134, 0.95, { t: tt, open: 0.2, mood: 'idle', walk: 0 });
        } },
      { t: 4.8, who: null, say: 'NOBODY CALLS IT A CAFE ANY MORE.',
        cam: { z: [1.4, 1.2], x: [140, 160], y: [96, 92] },
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
        cam: { z: [1.5, 1.8], x: [200, 216], y: [86, 82] },
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
        cam: { z: [1.8, 1.6], x: [110, 118], y: [84, 88] },
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
        cam: { z: [1.2, 1.6], x: [160, 152], y: [92, 96] },
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
        cam: { z: [1.6, 1.05], x: [152, 160], y: [96, 92] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0d0f18');
          G.glow(g, 160, 96, 300, 160, '#d97757', 0.4);
          G.R(g, 0, 136, G.W, 44, '#1d1a22');
          const kinds = ['human', 'cat', 'human', 'dog', 'human', 'cat'];
          for (let i = 0; i < 6; i++)
            G.drawCreature(g, kinds[i], 34 + i * 50, 136, kinds[i] === 'human' ? 0.9 : 0.6, { t: tt + i, smile: 1, clip: 'idle', ct: tt + i });
          G.drawBot(g, 'player', 302, 136, 0.9, { t: tt, open: 0.2, mood: 'idle', walk: 0 });
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

      // ---- THE PICTURE. No shear, no letterbox, no film grain. This is
      // a broadcast, not a film: the frame is the whole screen, the cuts
      // are hard, and the only camera move is a pan and a push. ----
      G.R(g, 0, 0, G.W, G.H, '#04060a');
      g.save();
      g.translate(G.W / 2, G.H / 2);
      g.scale(z, z);
      g.translate(-cx, -cy);
      s.paint(g, p, this.tt, this.talking(s, this.st) ? this.st : 0);
      g.restore();

      // ---- THE BROADCAST FURNITURE ----
      // a channel ident, top left, with a live dot that pulses
      const idW = G.tw('CH 4  MUNICIPAL') + G.tw('LIVE') + 24;
      g.globalAlpha = 0.86;
      G.R(g, 6, 6, idW, 11, '#101722');
      g.globalAlpha = 1;
      G.bevelq(g, 6, 6, idW, 11, '#2c3a4e', '#070b12');
      G.Rq(g, 6, 6, 2.5, 11, '#c8383a');
      G.text(g, 'CH 4  MUNICIPAL', 12, 9, '#9fb2c8', { sc: 0.5 });
      const liveOn = Math.sin(this.tt * 2.2) > -0.4;
      const lvX = 12 + G.tw('CH 4  MUNICIPAL') + 6;
      G.oc(g, lvX, 11.5, 2, liveOn ? '#ff4a4a' : '#5a2020');
      G.text(g, 'LIVE', lvX + 4, 9, liveOn ? '#ff8a8a' : '#6b4040', { sc: 0.5 });
      // and a strap, for the shots where the newsroom stops pretending
      if (s.flag) {
        const fw = G.tw(s.flag, 0.5) + 12;
        const fl = Math.sin(this.tt * 3.4) > -0.3;
        G.R(g, 6, 19, fw, 10, fl ? '#c8383a' : '#8a2426');
        G.hairq(g, 6, 19, fw, '#ff8a6a');
        G.text(g, s.flag, 12, 21, '#ffe8de', { sc: 0.5 });
      }

      // a running clock, top right, because a broadcast always has one
      const secs = Math.floor(this.tt);
      const clock = String(4 + Math.floor(secs / 60) % 12).padStart(2, '0') + ':' +
        String(secs % 60).padStart(2, '0');
      const cw2 = G.tw(clock) + 10, cxx = G.W - cw2 - 20;
      g.globalAlpha = 0.86;
      G.R(g, cxx, 6, cw2, 11, '#101722');
      g.globalAlpha = 1;
      G.bevelq(g, cxx, 6, cw2, 11, '#2c3a4e', '#070b12');
      G.text(g, clock, cxx + cw2 - 5, 9, '#9fb2c8', { align: 'right', sc: 0.5 });

      // the scanline the tube never quite hides
      g.globalAlpha = 0.05;
      for (let j2 = 0; j2 < G.H; j2 += 3) G.Rq(g, 0, j2, G.W, 0.25, '#000000');
      g.globalAlpha = 1;
      // a soft roll bar drifting down the picture
      const roll = ((this.tt * 26) % (G.H + 60)) - 30;
      g.globalAlpha = 0.045;
      G.R(g, 0, roll, G.W, 14, '#cfe4ff');
      g.globalAlpha = 1;

      // ---- THE LOWER THIRD. A caption bar, the way a broadcast does
      // dialogue: a coloured tab with the speaker on it, and the line
      // typing itself into the bar beside it. ----
      const beat = this.beatAt(s, this.st);
      if (beat) {
        const el = this.st - beat.at;
        const shown = Math.floor(el * 34);
        const txt = beat.say.slice(0, shown);
        const nar = !beat.who;
        const barY = G.H - 30, barH = 20;
        // the bar itself, sliding up on the first beat
        const slide = G.clamp(el * 6, 0, 1);
        const by2 = barY + (1 - G.easeOut(slide)) * 12;
        g.globalAlpha = 0.9 * slide;
        G.R(g, 10, by2, G.W - 20, barH, nar ? '#0d1520' : '#141a26');
        g.globalAlpha = 1;
        G.bevelq(g, 10, by2, G.W - 20, barH, '#2c3a4e', '#060a10');
        // the speaker tab
        const col = beat.col || CO;
        if (!nar) {
          const tw2 = G.tw(beat.who) + 10;
          G.R(g, 10, by2 - 8, tw2, 9, col);
          G.hairq(g, 10, by2 - 8, tw2, G.shade(col, 0.4));
          G.text(g, beat.who, 15, by2 - 6, '#0d1520', { sc: 0.5 });
        } else {
          G.R(g, 10, by2, 3, barH, CO);
        }
        G.text(g, txt, 18, by2 + 7, nar ? P.cream : '#f0e2d4');
        if (shown < beat.say.length && Math.sin(this.tt * 20) > 0)
          G.text(g, '_', 18 + G.tw(txt) + 1, by2 + 7, P.cream);
      }

      // ---- the run of the programme, and the way out ----
      for (let i2 = 0; i2 < this.shots.length; i2++)
        G.Rq(g, G.W / 2 - this.shots.length * 3 + i2 * 6, G.H - 6, 4, 1,
          i2 < this.i ? '#3a4a5e' : i2 === this.i ? CO : '#1c2531');
      if (this.skipT > 3)
        G.text(g, 'TAP', G.W - 10, G.H - 8, Math.sin(this.tt * 4) > 0 ? '#4a5a6e' : '#28323e',
          { align: 'right', sc: 0.5 });
    },
  };

  // ------------------------------------------------------------
  // A SCENE WRAPPER, so main.js can just G.go('cine')
  // ------------------------------------------------------------
  (G.scenes = G.scenes || {}).cine = {
    enter() {
      const id = G.cineNext || 'found';
      const after = G.cineThen || (() => G.go('day', 'DAY ' + G.state.day));
      G.cineNext = null; G.cineThen = null;
      cine.play(id, after);
    },
    update(dt) { cine.update(dt); },
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

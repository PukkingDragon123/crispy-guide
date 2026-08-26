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

  // Tracy, drawn small for the cutscenes. Her sprite lives in her own
  // scene; this is the version that fits in a shot.
  function tracy(g, x, footY, sc, t, o) {
    o = o || {};
    const u = (v) => Math.max(1, Math.round(v * sc));
    const skin = '#d8a882', skinD = '#a87a58', hair = '#3a241c';
    const bob = Math.sin(t * 1.6) * 0.6 * sc;
    const by = footY - u(52) + bob;
    // legs
    for (const sd of [-1, 1]) {
      G.Rh(g, x + sd * u(5) - u(3), footY - u(22), u(6), u(22), '#33505e');
      G.Rh(g, x + sd * u(5) - u(4), footY - u(3), u(8), u(3), '#2a1c14');
    }
    // dungarees and jumper
    G.R(g, x - u(9), by + u(16), u(18), u(24), '#3f5c6b');
    G.bevel(g, x - u(9), by + u(16), u(18), u(24), '#5c7f92', '#2a4450');
    G.Rh(g, x - u(10), by + u(9), u(20), u(8), '#c8785a');
    G.Rh(g, x - u(9), by + u(14), u(4), u(5), '#5c7f92');
    G.Rh(g, x + u(5), by + u(14), u(4), u(5), '#5c7f92');
    // arms
    for (const sd of [-1, 1]) {
      G.Rh(g, x + sd * u(12) - u(2), by + u(11), u(5), u(13), '#c8785a');
      G.Rh(g, x + sd * u(12) - u(3), by + u(23), u(6), u(4), skin);
    }
    // head
    const hy = by - u(2);
    G.R(g, x - u(7), hy, u(14), u(14), OUT);
    G.R(g, x - u(6), hy + 1, u(12), u(12), skin);
    G.bevel(g, x - u(6), hy + 1, u(12), u(12), '#f0c8a0', skinD);
    G.Rh(g, x - u(8), hy - u(2), u(16), u(6), hair);
    G.fc(g, x + u(7), hy + 1, u(3), hair);
    if (!o.dead) {
      for (const sd of [-1, 1]) {
        G.Rh(g, x + sd * u(3) - u(1.5), hy + u(6), u(3), u(2.5), '#f6f2e4');
        G.Rh(g, x + sd * u(3) - 0.5, hy + u(6.5), 1, u(1.5), '#3a2a1c');
      }
      if (o.smile) for (let i = 0; i < 5; i++)
        G.Rh(g, x - u(2) + i, hy + u(10) + Math.sin((i / 4) * Math.PI) * 1.2, 1, 1, '#8a4a4a');
      else G.Rh(g, x - u(2), hy + u(10), u(4), 1, '#8a4a4a');
    } else {
      for (const sd of [-1, 1]) G.Rh(g, x + sd * u(3) - u(1.5), hy + u(7), u(3), 1, skinD);
    }
  }

  // ------------------------------------------------------------
  // THE CUTSCENES
  // Each shot: { t, say, who, cam:{x,y,z,sh -> to}, paint(g, p, tt) }
  // p is 0..1 through the shot; tt is absolute time for animation.
  // ------------------------------------------------------------
  const CUT = {
    // ---------------- the opening ----------------
    opening: [
      { t: 4.2, who: null, say: 'THE MACHINES DID NOT ARRIVE. THEY WERE DELIVERED.',
        cam: { z: [1, 1.1], y: [4, -2], sh: [0.06, 0.02] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0a1020');
          G.glow(g, 160, 40, 320, 120, '#1d2c4a', 1);
          skyline(g, 150, 96, 1, '#111826', '#3a4a6b');
          skyline(g, 168, 62, 9, '#0b1120', '#243252');
          rain(g, tt, 60, '#2a3a55', 0, 320);
          // three patrol lights crossing the sky
          for (let i = 0; i < 3; i++) {
            const lx = ((tt * 26 + i * 120) % 380) - 30;
            G.Rh(g, lx, 30 + i * 9, 5, 1.5, '#7fd8ff');
            G.glow(g, lx, 30 + i * 9, 26, 10, '#3a9ad8', 0.6);
          }
        } },
      { t: 4.0, who: null, say: 'THEY BUILT A CITY THAT DOES NOT NEED ANYONE IN IT.',
        cam: { z: [1.12, 1.24], x: [150, 176], y: [104, 100], sh: [-0.04, -0.01] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0c111c');
          G.cityWall(g, 0, 0, G.W, 140, tt);
          G.R(g, 0, 140, G.W, 40, '#151a26');
          G.hair(g, 0, 140, G.W, '#2c3548');
          rain(g, tt, 40, '#33445f', 0, 320);
          // a column of units walking, all in step
          for (let i = 0; i < 5; i++) {
            const id = ['soldier', 'police', 'soldier', 'warden', 'police'][i];
            G.drawBot(g, id, 40 + i * 62, 148, 0.7,
              { t: tt, open: 0.05, mood: 'angry', walk: tt * 1.6, noBlink: 1 });
          }
          floorPool(g, 160, 148, 300, '#0a0d14', 0.5);
        } },
      { t: 4.4, who: null, say: 'YOU WERE IN A SKIP BEHIND A SHOP THAT HAD CLOSED.',
        cam: { z: [1.1, 1.42], x: [160, 156], y: [104, 106], sh: [0.04, 0] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0a0d14');
          G.R(g, 0, 128, G.W, 52, '#12161f');
          G.grain(g, 0, 128, G.W, 52, '#0a0d14', 0.14, 4);
          // the skip
          G.plate(g, 96, 100, 128, 44, '#3a5c4a', { r: 2, band: 3, bolts: 1, grain: 3, hazard: 1 });
          G.R(g, 102, 104, 116, 8, '#16281f');
          // scrap sticking out of it
          for (let i = 0; i < 7; i++) {
            const sx = 106 + i * 16, sh2 = 6 + ((i * 5) % 4) * 4;
            G.Rh(g, sx, 100 - sh2, 8, sh2, ['#48546c', '#6b5a3a', '#3a4459'][i % 3]);
            G.hair(g, sx, 100 - sh2, 8, '#8fa0bc');
          }
          // you, mostly buried, one optic still lit
          const lit = Math.sin(tt * 1.6) > 0.2 ? 1 : 0.15;
          G.plate(g, 150, 82, 30, 20, '#5c6b3a', { r: 2, band: 2, grain: 6 });
          G.lens(g, 156, 87, 8, 8, { hue: '#ff5d84', t: tt, noGlow: !lit });
          if (lit > 0.5) G.glow(g, 160, 91, 40, 26, '#ff5d84', 0.7);
          rain(g, tt, 30, '#2a3a55', 60, 260);
        } },
      { t: 4.6, who: null, say: 'SHE HAD NO REASON TO STOP. SHE STOPPED.',
        cam: { z: [1.3, 1.15], x: [172, 178], y: [104, 100], sh: [0, 0.03] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0b0e16');
          G.R(g, 0, 130, G.W, 50, '#141924');
          G.glow(g, 190, 100, 180, 140, '#d97757', 0.55);
          G.plate(g, 96, 100, 128, 44, '#3a5c4a', { r: 2, band: 3, grain: 3 });
          G.plate(g, 150, 82, 30, 20, '#5c6b3a', { r: 2, band: 2, grain: 6 });
          G.lens(g, 156, 87, 8, 8, { hue: '#ff5d84', t: tt });
          // her, backlit, reaching in
          silhouette(g, 232, 146, 62, '#1a1520');
          G.Rh(g, 200, 104, 30, 4, '#1a1520');
          floorPool(g, 232, 146, 40, '#3a2a24', 0.5);
          rain(g, tt, 24, '#33445f', 120, 300);
        } },
      { t: 4.4, who: null, say: 'SHE CLEANED YOUR HOPPERS. SHE GAVE YOU A NAME.',
        cam: { z: [1.3, 1.15], x: [140, 148], y: [96, 100], sh: [0.02, -0.02] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#100c14');
          G.glow(g, 160, 96, 220, 150, '#d97757', 0.6);
          G.R(g, 0, 138, G.W, 42, '#1d1720');
          // a workbench, a lamp, and you sat on it
          G.plate(g, 40, 128, 240, 10, '#5c4630', { r: 2, band: 2, grain: 2 });
          G.Rh(g, 92, 60, 0.5, 26, '#241c24');
          G.fc(g, 92, 88, 4, '#ffe89a');
          G.glow(g, 92, 90, 70, 54, '#ffd47a', 0.7);
          G.drawBot(g, 'player', 168, 128, 1.0, { t: tt, open: 0.2, mood: 'idle', walk: 0 });
          silhouette(g, 96, 138, 56, '#241c28');
          // sparks off a joint she is working
          if (Math.sin(tt * 9) > 0.5)
            for (let i = 0; i < 3; i++)
              G.Rh(g, 140 + i * 3 + Math.sin(tt * 20 + i) * 2, 108 - i * 2, 1, 1, '#ffffff');
        } },
      { t: 4.6, who: null, say: 'THE SHOP OPENED AGAIN. FOR ONE CUSTOMER AT A TIME.',
        cam: { z: [1.15, 1.3], x: [160, 150], y: [92, 96], sh: [-0.03, 0] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0c1018');
          G.cityWall(g, 0, 0, G.W, 96, tt);
          const fl = Math.sin(tt * 11) > 0.9 ? 0.3 : 1;
          G.R(g, 90, 30, 140, 4, fl > 0.5 ? P.magentaLt : P.magentaDk);
          G.glow(g, 160, 44, 190, 70, P.magenta, 0.9 * fl);
          G.text(g, 'SCOOP  ·  24 HR', 160, 40, fl > 0.5 ? P.cyanLt : P.cyanDk,
            { align: 'center', out: OUT });
          G.plate(g, -4, 96, 328, 12, P.plate, { r: 2, band: 3, bolts: 1 });
          G.drawBot(g, 'player', 92, 100, 0.9, { t: tt, open: 0.25, mood: 'idle', walk: 0 });
          G.drawBot(g, 'clerk', 232, 100, 0.9, { t: tt, open: 0.4, mood: 'idle', walk: 0 });
          G.cone(g, 160, 96, { w: 14, h: 18 });
        } },
      { t: 5.0, who: null, say: 'THEN ONE MORNING SHE DID NOT COME IN.',
        cam: { z: [1.2, 1.05], x: [156, 160], y: [96, 94], sh: [0, 0.04] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0a0d14');
          G.cityWall(g, 0, 0, G.W, 96, tt);
          g.globalAlpha = 0.55; G.R(g, 0, 0, G.W, G.H, '#05070c'); g.globalAlpha = 1;
          G.plate(g, -4, 96, 328, 12, P.plate, { r: 2, band: 3 });
          // an empty stool with a coat over it
          G.plate(g, 216, 120, 26, 5, '#3a2c1c', { r: 1, band: 1 });
          for (const sd of [-1, 1]) G.Rh(g, 228 + sd * 9, 125, 2, 22, '#2e2416');
          G.Rh(g, 214, 96, 30, 26, '#241c28');
          G.drawBot(g, 'player', 96, 108, 0.9,
            { t: tt, open: 0.06, mood: 'sick', walk: 0, noBlink: 1 });
          G.glow(g, 96, 90, 90, 70, '#d97757', 0.3);
        } },
      { t: 5.4, who: 'CLAUSE', say: 'SHE LEFT ME RUNNING. SO WE ARE STILL OPEN.',
        cam: { z: [1.35, 1.2], x: [116, 124], y: [88, 92], sh: [0.03, 0] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0b0e16');
          G.cityWall(g, 0, 0, G.W, 96, tt);
          G.plate(g, -4, 96, 328, 12, P.plate, { r: 2, band: 3 });
          G.drawBot(g, 'player', 84, 108, 0.9, { t: tt, open: 0.2, mood: 'idle', walk: 0 });
          G.plate(g, 128, 100, 20, 16, P.plateDk, { r: 1, band: 2 });
          G.Rh(g, 137, 74, 1, 26, P.hullDk);
          G.starburst(g, 138, 66, 12, tt, { talk: 1 });
          G.glow(g, 138, 66, 70, 70, CO, 0.5);
        } },
      { t: 5.6, who: null, say: 'AND EVERY MACHINE THAT WALKS IN OWES HER SOMETHING.',
        cam: { z: [1, 1.3], x: [160, 216], y: [92, 90], sh: [0, -0.05] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0b0e16');
          G.cityWall(g, 0, 0, G.W, 96, tt);
          G.plate(g, -4, 96, 328, 12, P.plate, { r: 2, band: 3 });
          G.drawBot(g, 'player', 60, 108, 0.9, { t: tt, open: 0.2, mood: 'idle', walk: 0 });
          G.drawBot(g, 'tank', 236, 108, 1.0, { t: tt, open: 0.5, mood: 'angry', walk: 0 });
          G.gooScoop(g, 150, 84, 9, { col: '#8a93ad', goo: 2, volt: 4 }, {});
          if (Math.sin(tt * 12) > 0.4)
            for (let i = 0; i < 4; i++)
              G.Rh(g, 236 + G.rand(-14, 14), 70 + G.rand(0, 24), 1, 1, '#ffffff');
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
      s.paint(g, p, this.tt);
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

      // ---- the line, typing itself in ----
      if (s.say) {
        const shown = Math.floor(this.st * 34);
        const txt = s.say.slice(0, shown);
        if (s.who) G.text(g, s.who, 12, G.H - 17, CO, { sc: 0.5 });
        G.text(g, txt, 160, G.H - 13, s.who ? '#f0d8c8' : P.cream, { align: 'center' });
        if (shown < s.say.length && Math.sin(this.tt * 20) > 0)
          G.text(g, '_', 160 + G.tw(txt) / 2 + 2, G.H - 13, P.cream);
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

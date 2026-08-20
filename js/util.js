// ============================================================
// DOUBLE LIFE v2 - util.js
// 320x180 canvas. Chunky, bold, flat-shaded pixel art.
// Core: math, crisp pixel primitives, texture/dither helpers,
// a world camera, gore/blood particles and global juice.
// ============================================================
(function () {
  const G = (window.GAME = {});
  G.W = 320;
  G.H = 180;

  // ---------- math ----------
  G.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  G.lerp = (a, b, t) => a + (b - a) * t;
  G.rand = (a, b) => a + Math.random() * (b - a);
  G.irand = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  G.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  G.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  G.inRect = (px, py, x, y, w, h) => px >= x && px < x + w && py >= y && py < y + h;
  G.easeOut = (t) => 1 - (1 - t) * (1 - t);
  G.easeIn = (t) => t * t;
  G.easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  G.backOut = (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  G.angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
  // deterministic hash noise -> 0..1 (stable texture without storing arrays)
  G.hash = function (x, y) {
    let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };

  // ---------- palette : swamp-noir ----------
  const P = G.PAL = {
    // Bold and flat: three or four tones per material, hard black
    // outlines, no dithered mush. Night blues behind, hot greens and
    // creams in front.
    ink:      '#0d1220',   // universal outline
    ink2:     '#161f33',
    night:    '#1a2438',   // sky / room ground
    night2:   '#232f4a',
    night3:   '#2e3d5c',
    sewer:    '#2a3348',   // brick
    sewerLt:  '#3a4560',
    sewerDk:  '#1c2333',
    rust:     '#8a5230',
    rustLt:   '#b87a44',
    slime:    '#4a6b3a',
    slimeLt:  '#6b9450',
    steel:    '#6b7f96',
    steel2:   '#96aac0',
    chrome:   '#d8e4f0',
    bone:     '#f4f0e0',   // enamel
    boneDk:   '#d8d0b8',
    boneShade:'#b0a488',
    gum:      '#d9607a',
    gumDk:    '#a83d5c',
    gumLit:   '#f08aa0',
    maw:      '#5c1a28',   // mouth interior
    mawDk:    '#3d0f1c',
    blood:    '#d92038',
    bloodDk:  '#8a1424',
    bloodLit: '#ff4a5c',
    pus:      '#e8d84a',
    rot:      '#3a2410',
    plaque:   '#b8c03a',
    plaqueLt: '#d8e05a',
    neonG:    '#7ee858',
    neonP:    '#ff5c9c',
    neonC:    '#4ad8f0',
    amber:    '#ffb43a',
    gold:     '#ffd44a',
    cream:    '#f4f0e0',
    warn:     '#ff7a4a',
    // croc / player greens
    croc:     '#6bbf42',
    crocLt:   '#8ed95c',
    crocDk:   '#3d7a26',
    crocDk2:  '#2a5518',
  };
  G.OUT = P.ink;
  G.WHITE = P.cream;

  const shadeCache = {};
  G.shade = function (hex, f) {
    const key = hex + '|' + f;
    if (shadeCache[key]) return shadeCache[key];
    let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    if (f >= 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
    const out = '#' + [r, g, b].map((v) => Math.round(G.clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
    shadeCache[key] = out;
    return out;
  };
  // push a colour toward a tint (used for night grading / sickly light)
  const mixCache = {};
  G.mix = function (a, b, t) {
    const key = a + '|' + b + '|' + t;
    if (mixCache[key]) return mixCache[key];
    const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
    const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
    const out = '#' + pa.map((v, i) => Math.round(G.clamp(v + (pb[i] - v) * t, 0, 255)).toString(16).padStart(2, '0')).join('');
    mixCache[key] = out;
    return out;
  };

  // ---------- crisp pixel drawing ----------
  G.R = function (g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  G.fc = function (g, cx, cy, r, c) {
    g.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy);
    const R2 = r * r, ir = Math.ceil(r);
    for (let dy = -ir; dy <= ir; dy++) {
      const t = R2 - dy * dy; if (t < 0) continue;
      const w = Math.floor(Math.sqrt(t) + 0.0001);
      g.fillRect(cx - w, cy + dy, 2 * w + 1, 1);
    }
  };
  G.fe = function (g, cx, cy, rx, ry, c) {
    g.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy);
    const iry = Math.ceil(ry);
    for (let dy = -iry; dy <= iry; dy++) {
      const t = 1 - (dy * dy) / (ry * ry); if (t < 0) continue;
      const w = Math.floor(rx * Math.sqrt(t) + 0.0001);
      g.fillRect(cx - w, cy + dy, 2 * w + 1, 1);
    }
  };
  G.oc = function (g, cx, cy, r, c) {
    g.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy);
    const ir = Math.ceil(r), R2 = r * r;
    let prev = -1;
    for (let dy = -ir; dy <= ir; dy++) {
      const t = R2 - dy * dy; if (t < 0) continue;
      const w = Math.floor(Math.sqrt(t) + 0.0001);
      const th = prev < 0 ? 2 * w + 1 : Math.max(1, prev - w + 1);
      if (prev < 0) g.fillRect(cx - w, cy + dy, 2 * w + 1, 1);
      else { g.fillRect(cx - w, cy + dy, th, 1); g.fillRect(cx + w - th + 1, cy + dy, th, 1); }
      if (R2 - (dy + 1) * (dy + 1) < 0) g.fillRect(cx - w, cy + dy, 2 * w + 1, 1);
      prev = w;
    }
  };
  G.rr = function (g, x, y, w, h, c) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    g.fillStyle = c; g.fillRect(x + 1, y, w - 2, h); g.fillRect(x, y + 1, w, h - 2);
  };
  G.rr2 = function (g, x, y, w, h, c) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    g.fillStyle = c;
    g.fillRect(x + 2, y, w - 4, h); g.fillRect(x + 1, y + 1, w - 2, h - 2); g.fillRect(x, y + 2, w, h - 4);
  };
  // 1px line (Bresenham, crisp)
  G.line = function (g, x0, y0, x1, y1, c, thick) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    g.fillStyle = c;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, n = 0;
    const t = thick || 1;
    while (n++ < 4000) {
      g.fillRect(x0, y0, t, t);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  };

  // ---------- texture helpers (what makes it read as "detailed") ----------
  // ordered 4x4 bayer dither between two colours; ratio 0..1 of colB
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  G.dither = function (g, x, y, w, h, colA, colB, ratio) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    if (colA) { g.fillStyle = colA; g.fillRect(x, y, w, h); }
    g.fillStyle = colB;
    const thr = ratio * 16;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (BAYER[((j & 3) << 2) | (i & 3)] < thr) g.fillRect(x + i, y + j, 1, 1);
    }
  };
  // vertical gradient made of dithered bands (top->bottom colA->colB)
  G.gradV = function (g, x, y, w, h, colA, colB, steps) {
    steps = steps || 6;
    const bh = Math.ceil(h / steps);
    for (let s = 0; s < steps; s++) {
      const t = s / (steps - 1 || 1);
      const yy = y + s * bh, hh = Math.min(bh, y + h - yy);
      if (hh <= 0) break;
      G.R(g, x, yy, w, hh, G.mix(colA, colB, t));
      if (s > 0) G.dither(g, x, yy, w, Math.min(2, hh), null, G.mix(colA, colB, t - 1 / steps), 0.5);
    }
  };
  // speckle noise over a rect (grime, pores, warts)
  G.speckle = function (g, x, y, w, h, col, density, seed) {
    seed = seed || 0;
    g.fillStyle = col;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (G.hash(x + i + seed * 31, y + j - seed * 17) < density) g.fillRect(Math.round(x + i), Math.round(y + j), 1, 1);
    }
  };
  // reptile scale field clipped to a callback-shaped mask region
  G.scales = function (g, x, y, w, h, col, size, seed) {
    size = size || 4; seed = seed || 0;
    for (let j = 0; j < h; j += size) {
      const off = ((j / size) & 1) ? Math.floor(size / 2) : 0;
      for (let i = -off; i < w; i += size) {
        const n = G.hash(i + seed, j - seed);
        if (n < 0.42) continue;
        G.R(g, x + i, y + j, size - 1, 1, col);
        if (n > 0.8) G.R(g, x + i, y + j + 1, 1, size - 2, col);
      }
    }
  };

  // soft radial glow built from dithered rings - no visible alpha banding
  G.glow = function (g, cx, cy, rx, ry, col, strength) {
    strength = strength === undefined ? 1 : strength;
    const steps = 7;
    for (let i = steps; i >= 1; i--) {
      const p = i / steps;
      g.globalAlpha = 0.035 * strength * (1 - p * 0.55);
      G.fe(g, cx, cy, rx * p, ry * p, col);
      g.globalAlpha = 1;
    }
    // dither the outer edge so the falloff does not read as a ring
    g.globalAlpha = 0.05 * strength;
    G.fe(g, cx, cy, rx * 0.55, ry * 0.55, col);
    g.globalAlpha = 1;
  };

  G.panel = function (g, x, y, w, h, fill, border) {
    G.rr2(g, x, y, w, h, border || P.ink);
    G.rr2(g, x + 1, y + 1, w - 2, h - 2, fill);
  };
  // heavier framed panel with bevel — used for all HUD chrome
  G.frame = function (g, x, y, w, h, fill) {
    G.rr2(g, x, y, w, h, P.ink);
    G.rr2(g, x + 1, y + 1, w - 2, h - 2, G.shade(fill, -0.45));
    G.rr2(g, x + 2, y + 2, w - 4, h - 4, fill);
    G.R(g, x + 3, y + 2, w - 6, 1, G.shade(fill, 0.22));
    G.R(g, x + 3, y + h - 3, w - 6, 1, G.shade(fill, -0.3));
  };

  // ------------------------------------------------------------
  // BOXEL - the core shape of this art style. A flat face with a
  // hard top light band, a hard bottom shadow band, a 1px black
  // outline and softened corners. Three tones, no gradients.
  // ------------------------------------------------------------
  G.box = function (g, x, y, w, h, col, o) {
    o = o || {};
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    if (w < 2 || h < 2) { G.R(g, x, y, w, h, col); return; }
    const lit = o.lit || G.shade(col, 0.26);
    const dk = o.dk || G.shade(col, -0.3);
    const r = o.r === undefined ? (w > 8 && h > 8 ? 2 : 1) : o.r;
    const rr = r >= 2 ? G.rr2 : G.rr;
    // outline
    if (o.out !== false) rr(g, x - 1, y - 1, w + 2, h + 2, o.outCol || P.ink);
    rr(g, x, y, w, h, col);
    // hard bands, inset so the corners stay clean
    const bt = o.band === undefined ? Math.max(1, Math.round(h * 0.2)) : o.band;
    if (bt > 0) {
      G.R(g, x + r, y, w - r * 2, bt, lit);
      G.R(g, x + r, y + h - bt, w - r * 2, bt, dk);
    }
    // side turn
    if (w > 6) G.R(g, x + w - 2, y + bt, 2, h - bt * 2, G.shade(col, -0.16));
    if (o.spec !== false && w > 5 && h > 5) G.R(g, x + r + 1, y + 1, 2, 1, G.shade(col, 0.5));
  };

  // a boxel with a chosen face colour per row band - used for anything
  // that should read as a stack of cubes (crates, bricks, tubs)
  G.boxStack = function (g, x, y, w, h, cols, o) {
    const n = cols.length;
    const bh = h / n;
    for (let i = 0; i < n; i++) {
      G.box(g, x, y + i * bh, w, Math.ceil(bh) + (i < n - 1 ? 0 : 0), cols[i],
        Object.assign({ out: i === 0, r: 1 }, o || {}));
    }
    if (o && o.out !== false) G.rr(g, x - 1, y - 1, w + 2, h + 2, P.ink);
  };

  // ---------- camera ----------
  const cam = G.cam = {
    x: 0, y: 0, tx: 0, ty: 0,
    minX: 0, maxX: 0, minY: 0, maxY: 0,
    sx: 0, sy: 0,        // shake offset
    set(minX, maxX, minY, maxY) { this.minX = minX; this.maxX = maxX; this.minY = minY || 0; this.maxY = maxY || 0; },
    goto(x, y, snap) {
      this.tx = G.clamp(x, this.minX, this.maxX);
      if (y !== undefined && y !== null) this.ty = G.clamp(y, this.minY, this.maxY);
      if (snap) { this.x = this.tx; this.y = this.ty; }
    },
    nudge(dx, dy) { this.goto(this.tx + dx, this.ty + (dy || 0)); },
    update(dt) {
      this.x += (this.tx - this.x) * Math.min(1, dt * 9);
      this.y += (this.ty - this.y) * Math.min(1, dt * 9);
      if (Math.abs(this.tx - this.x) < 0.05) this.x = this.tx;
      if (Math.abs(this.ty - this.y) < 0.05) this.y = this.ty;
    },
    reset(minX, maxX, minY, maxY) {
      this.set(minX || 0, maxX || 0, minY || 0, maxY || 0);
      this.x = this.tx = G.clamp(0, this.minX, this.maxX);
      this.y = this.ty = G.clamp(0, this.minY, this.maxY);
    },
    // apply to context; call G.cam.pop(g) after
    push(g) { g.save(); g.translate(-Math.round(this.x + this.sx), -Math.round(this.y + this.sy)); },
    pop(g) { g.restore(); },
    // screen<->world
    wx(sx) { return sx + Math.round(this.x); },
    wy(sy) { return sy + Math.round(this.y); },
  };

  // ---------- mouse / pointer ----------
  // x,y are SCREEN coords; wx,wy are WORLD coords (camera applied)
  G.mouse = { x: -99, y: -99, wx: -99, wy: -99, down: false, vx: 0, vy: 0, touch: false, wheel: 0 };

  // ---------- global juice ----------
  G.shakeT = 0; G.shakeMag = 0;
  G.shake = function (mag, t) { G.shakeMag = Math.max(G.shakeMag, mag); G.shakeT = Math.max(G.shakeT, t || 0.18); };

  G.flash = { t: 0, col: '#fff', life: 0.1 };
  G.screenFlash = function (col, life) { G.flash.t = life || 0.1; G.flash.life = life || 0.1; G.flash.col = col; };

  G.toasts = [];
  G.toastCX = 0;              // scenes set these to steer toasts clear of art
  G.toastY = 0;
  G.toast = function (str, col) { G.toasts.push({ str, col: col || P.cream, t: 0 }); if (G.toasts.length > 3) G.toasts.shift(); };

  G.sparks = [];
  G.spark = function (x, y, col, n, spd) {
    n = n || 8;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = G.rand(14, spd || 56);
      G.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 16, t: 0, life: G.rand(0.3, 0.7),
        col: Array.isArray(col) ? G.pick(col) : col, star: Math.random() < 0.3, world: true });
    }
  };

  // ---------- gore ----------
  // blood droplets: arc out, then leave a persistent stain via onLand
  G.gore = [];
  G.stains = [];
  G.bleed = function (x, y, n, opts) {
    opts = opts || {};
    n = n || 6;
    const dir = opts.dir === undefined ? -Math.PI / 2 : opts.dir;
    const spread = opts.spread === undefined ? 1.5 : opts.spread;
    for (let i = 0; i < n; i++) {
      const a = dir + G.rand(-spread, spread);
      const s = G.rand(20, opts.force || 110);
      G.gore.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: G.rand(0.5, 1.3),
        r: G.rand(0.8, 2.2), col: Math.random() < 0.25 ? P.bloodLit : (Math.random() < 0.6 ? P.blood : P.bloodDk),
        floor: opts.floor === undefined ? null : opts.floor, stain: opts.stain !== false,
      });
    }
  };
  // slow oozing drool of blood down a surface
  G.ooze = [];
  G.addOoze = function (x, y, col, len) {
    G.ooze.push({ x, y, y0: y, col: col || P.blood, len: len || G.rand(6, 18), t: 0, spd: G.rand(6, 16), w: G.rand(1, 2) });
    if (G.ooze.length > 90) G.ooze.shift();
  };
  G.addStain = function (x, y, r, col) {
    G.stains.push({ x, y, r, col: col || P.bloodDk, t: 0 });
    if (G.stains.length > 160) G.stains.shift();
  };
  G.clearGore = function () { G.gore.length = 0; G.stains.length = 0; G.ooze.length = 0; };

  // ---------- flies ----------
  // Little dark specks that loiter and dart. Sewer atmosphere.
  G.flies = [];
  G.spawnFlies = function (n, x, y, rad) {
    G.flies.length = 0;
    for (let i = 0; i < n; i++) {
      G.flies.push({
        hx: x + G.rand(-rad, rad), hy: y + G.rand(-rad * 0.6, rad * 0.6),
        x: x, y: y, ph: G.rand(0, 6.28), sp: G.rand(1.4, 3.2),
        rx: G.rand(6, 18), ry: G.rand(4, 12), dart: 0,
      });
    }
  };
  G.updateFlies = function (dt) {
    for (const f of G.flies) {
      f.ph += dt * f.sp;
      f.dart -= dt;
      if (f.dart <= 0) { f.dart = G.rand(1.2, 4); f.hx += G.rand(-14, 14); f.hy += G.rand(-8, 8); }
      f.x = f.hx + Math.cos(f.ph) * f.rx + Math.sin(f.ph * 2.7) * 3;
      f.y = f.hy + Math.sin(f.ph * 1.3) * f.ry;
    }
  };
  G.drawFlies = function (g) {
    for (const f of G.flies) {
      G.R(g, f.x, f.y, 2, 1, '#0d1220');
      // wing blur every other frame-ish
      if (Math.sin(f.ph * 9) > 0) G.R(g, f.x - 1, f.y - 1, 1, 1, '#3a4560');
      else G.R(g, f.x + 2, f.y - 1, 1, 1, '#3a4560');
    }
  };

  G.coinFlies = [];
  G.flyCoin = function (x, y, amount) {
    const n = G.clamp(Math.round(amount / 4) + 1, 1, 7);
    const per = amount / n;
    for (let i = 0; i < n; i++) G.coinFlies.push({ x, y, sx: x, sy: y, t: -i * 0.06, amt: per, arc: G.rand(20, 52) });
  };

  G.floaters = [];
  G.floatText = function (str, x, y, col, big) { G.floaters.push({ str, x, y, col: col || P.gold, t: 0, big: !!big }); };

  G.updateJuice = function (dt) {
    if (G.shakeT > 0) {
      G.shakeT -= dt;
      cam.sx = G.rand(-G.shakeMag, G.shakeMag);
      cam.sy = G.rand(-G.shakeMag, G.shakeMag);
      if (G.shakeT <= 0) { G.shakeMag = 0; cam.sx = 0; cam.sy = 0; }
    }
    if (G.flash.t > 0) G.flash.t -= dt;

    for (let i = G.sparks.length - 1; i >= 0; i--) {
      const s = G.sparks[i];
      s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 150 * dt;
      if (s.t > s.life) G.sparks.splice(i, 1);
    }
    for (let i = G.gore.length - 1; i >= 0; i--) {
      const b = G.gore[i];
      b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 340 * dt; b.vx *= 0.995;
      const hitFloor = b.floor !== null && b.y >= b.floor;
      if (hitFloor || b.t > b.life) {
        if (b.stain) G.addStain(b.x, hitFloor ? b.floor : b.y, b.r * G.rand(1.1, 2.1), Math.random() < 0.4 ? P.blood : P.bloodDk);
        if (hitFloor && Math.random() < 0.3) G.addOoze(b.x, b.floor, P.bloodDk, G.rand(3, 10));
        G.gore.splice(i, 1);
      }
    }
    for (let i = G.ooze.length - 1; i >= 0; i--) {
      const o = G.ooze[i];
      o.t += dt;
      o.y += o.spd * dt;
      o.spd *= 0.985;
      if (o.y - o.y0 > o.len) { o.spd = 0; }
      if (o.t > 22) G.ooze.splice(i, 1);
    }
    for (let i = G.stains.length - 1; i >= 0; i--) { G.stains[i].t += dt; }

    for (let i = G.coinFlies.length - 1; i >= 0; i--) {
      const c = G.coinFlies[i];
      c.t += dt * 1.7;
      if (c.t < 0) continue;
      if (c.t >= 1) {
        G.state.money += c.amt;
        G.state.moneyShown = Math.min(G.state.moneyShown, G.state.money - c.amt);
        G.audio.sfx('coin');
        G.coinFlies.splice(i, 1);
        continue;
      }
      const e = G.easeInOut(c.t);
      c.x = G.lerp(c.sx, 24, e);
      c.y = G.lerp(c.sy, 14, e) - Math.sin(c.t * Math.PI) * c.arc;
    }
    for (let i = G.floaters.length - 1; i >= 0; i--) {
      const f = G.floaters[i];
      f.t += dt; f.y -= 15 * dt;
      if (f.t > 1.2) G.floaters.splice(i, 1);
    }
    for (let i = G.toasts.length - 1; i >= 0; i--) {
      const t = G.toasts[i];
      t.t += dt;
      if (t.t > 2.8) G.toasts.splice(i, 1);
    }
    if (G.state) {
      if (G.state.moneyShown === undefined) G.state.moneyShown = G.state.money;
      const d = G.state.money - G.state.moneyShown;
      if (Math.abs(d) < 0.4) G.state.moneyShown = G.state.money;
      else G.state.moneyShown += d * Math.min(1, dt * 7);
    }
  };

  // stains/ooze live in world space: draw inside camera transform
  G.drawGoreWorld = function (g) {
    for (const s of G.stains) {
      g.globalAlpha = G.clamp(0.85 - s.t * 0.006, 0.3, 0.85);
      G.fe(g, s.x, s.y, s.r, s.r * 0.62, s.col);
      if (s.r > 2.4) G.fe(g, s.x - s.r * 0.4, s.y, s.r * 0.35, s.r * 0.3, G.shade(s.col, -0.25));
      g.globalAlpha = 1;
    }
    for (const o of G.ooze) {
      const h = o.y - o.y0;
      G.R(g, o.x, o.y0, o.w, h, o.col);
      G.fc(g, o.x, o.y, o.w * 0.9 + 0.5, o.col);
      G.R(g, o.x, o.y0, 1, Math.max(1, h * 0.4), G.shade(o.col, 0.22));
    }
    for (const b of G.gore) {
      const st = Math.min(1, Math.hypot(b.vx, b.vy) / 200);
      G.fe(g, b.x, b.y, b.r, b.r * (1 + st * 1.4), b.col);
    }
    for (const s of G.sparks) {
      if (!s.world) continue;
      const a = 1 - s.t / s.life;
      g.globalAlpha = a;
      if (s.star && a > 0.4) { G.R(g, s.x - 1, s.y, 3, 1, s.col); G.R(g, s.x, s.y - 1, 1, 3, s.col); }
      else G.R(g, s.x, s.y, 1, 1, s.col);
      g.globalAlpha = 1;
    }
  };

  // HUD-space juice
  G.drawJuice = function (g) {
    for (const c of G.coinFlies) {
      if (c.t < 0) continue;
      const wob = Math.abs(Math.sin(c.t * 9));
      G.fe(g, c.x, c.y, 2.5 + wob, 3.5, P.ink);
      G.fe(g, c.x, c.y - 1, 1.5 + wob, 2.5, P.gold);
      G.R(g, c.x, c.y - 2, 1, 1, '#fff3b0');
    }
    for (const f of G.floaters) {
      const a = f.t > 0.8 ? 1 - (f.t - 0.8) / 0.4 : 1;
      g.globalAlpha = Math.max(0, a);
      G.text(g, f.str, f.x, f.y, f.col, { align: 'center', out: P.ink, sc: f.big ? 2 : 1 });
      g.globalAlpha = 1;
    }
    let ty = G.toastY || 40;
    for (const t of G.toasts) {
      const a = t.t < 0.15 ? t.t / 0.15 : t.t > 2.35 ? 1 - (t.t - 2.35) / 0.45 : 1;
      const w = G.tw(t.str) + 16;
      const cx = G.clamp(G.toastCX || G.W / 2, w / 2 + 2, G.W - w / 2 - 2);
      g.globalAlpha = Math.max(0, a);
      G.frame(g, cx - w / 2, ty, w, 16, '#16211f');
      G.text(g, t.str, cx, ty + 5, t.col, { align: 'center' });
      g.globalAlpha = 1;
      ty += 19;
    }
    if (G.flash.t > 0) {
      g.globalAlpha = (G.flash.t / G.flash.life) * 0.55;
      G.R(g, 0, 0, G.W, G.H, G.flash.col);
      g.globalAlpha = 1;
    }
  };

  // vignette + scanline grade, drawn last for the grimy look
  // At 320x180 a scanline grade eats the image. Just a soft corner
  // darkening so the frame holds together.
  G.grade = function (g, strength, tint) {
    strength = strength === undefined ? 1 : strength;
    if (strength <= 0) return;
    for (let i = 0; i < 4; i++) {
      g.globalAlpha = 0.07 * strength;
      const inset = i * 4;
      G.R(g, 0, inset, G.W, 2, tint || '#000');
      G.R(g, 0, G.H - inset - 2, G.W, 2, tint || '#000');
      G.R(g, inset, 0, 2, G.H, tint || '#000');
      G.R(g, G.W - inset - 2, 0, 2, G.H, tint || '#000');
      g.globalAlpha = 1;
    }
  };

  // ---------- shared button ----------
  G.drawBtn = function (g, x, y, w, h, label, opts) {
    opts = opts || {};
    const hov = !opts.disabled && G.inRect(G.mouse.x, G.mouse.y, x, y, w, h);
    const base = opts.disabled ? '#3d4a4a' : opts.col || P.gum;
    const face = hov && G.mouse.down ? G.shade(base, -0.2) : hov ? G.shade(base, 0.16) : base;
    const dy = hov && G.mouse.down ? 1 : 0;
    G.rr2(g, x, y + 3, w, h, P.ink);
    G.rr2(g, x, y + dy, w, h, P.ink);
    G.rr2(g, x + 1, y + 1 + dy, w - 2, h - 2, G.shade(face, -0.4));
    G.rr2(g, x + 2, y + 2 + dy, w - 4, h - 4, face);
    G.R(g, x + 3, y + 2 + dy, w - 6, 1, G.shade(face, 0.34));
    if (label) G.text(g, label, x + w / 2, y + Math.floor((h - 7) / 2) + dy, opts.tcol || P.cream, { align: 'center', out: opts.out });
    return hov;
  };

  // horizontal skill meter (used by scooping + drilling)
  // zones: [{a,b,col}] normalised 0..1 target bands
  G.meter = function (g, x, y, w, h, val, zones, opts) {
    opts = opts || {};
    G.rr(g, x - 1, y - 1, w + 2, h + 2, P.ink);
    G.R(g, x, y, w, h, '#101a18');
    for (const z of zones || []) {
      G.R(g, x + Math.round(z.a * w), y, Math.max(1, Math.round((z.b - z.a) * w)), h, z.col);
      G.R(g, x + Math.round(z.a * w), y, Math.max(1, Math.round((z.b - z.a) * w)), 1, G.shade(z.col, 0.3));
    }
    const px = x + Math.round(G.clamp(val, 0, 1) * (w - 2));
    G.R(g, px - 1, y - 2, 3, h + 4, P.ink);
    G.R(g, px, y - 2, 1, h + 4, opts.needle || P.cream);
    if (opts.label) G.text(g, opts.label, x + w / 2, y - 11, opts.labelCol || P.steel2, { align: 'center', out: P.ink });
  };
})();

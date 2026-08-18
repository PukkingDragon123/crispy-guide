// ============================================================
// DOUBLE LIFE - util.js
// Core helpers: math, crisp pixel drawing primitives, mouse,
// global juice (toasts, coin flies, sparkles, screenshake).
// Everything renders on a 480x270 canvas upscaled with
// nearest-neighbor, and every shape is built from fillRect
// scanlines so pixels stay chunky and crisp.
// ============================================================
(function () {
  const G = (window.GAME = {});
  G.W = 480;
  G.H = 270;

  // ---------- math ----------
  G.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  G.lerp = (a, b, t) => a + (b - a) * t;
  G.rand = (a, b) => a + Math.random() * (b - a);
  G.irand = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  G.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  G.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  G.inRect = (px, py, x, y, w, h) => px >= x && px < x + w && py >= y && py < y + h;
  // easing
  G.easeOut = (t) => 1 - (1 - t) * (1 - t);
  G.easeIn = (t) => t * t;
  G.easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  G.backOut = (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  G.angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };

  // ---------- palette ----------
  G.OUT = '#3b2b40';        // universal outline plum
  G.WHITE = '#fff8f2';

  // shade('#rrggbb', f) -> lighten (f>0) or darken (f<0)
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

  // ---------- crisp pixel drawing ----------
  // rectangle
  G.R = function (g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  // filled circle via scanlines (crisp)
  G.fc = function (g, cx, cy, r, c) {
    g.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy);
    const R2 = r * r, ir = Math.ceil(r);
    for (let dy = -ir; dy <= ir; dy++) {
      const t = R2 - dy * dy; if (t < 0) continue;
      const w = Math.floor(Math.sqrt(t) + 0.0001);
      g.fillRect(cx - w, cy + dy, 2 * w + 1, 1);
    }
  };
  // filled ellipse via scanlines
  G.fe = function (g, cx, cy, rx, ry, c) {
    g.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy);
    const iry = Math.ceil(ry);
    for (let dy = -iry; dy <= iry; dy++) {
      const t = 1 - (dy * dy) / (ry * ry); if (t < 0) continue;
      const w = Math.floor(rx * Math.sqrt(t) + 0.0001);
      g.fillRect(cx - w, cy + dy, 2 * w + 1, 1);
    }
  };
  // circle outline (1px ring, crisp)
  G.oc = function (g, cx, cy, r, c) {
    g.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy);
    const ir = Math.ceil(r), R2 = r * r;
    let prev = -1;
    for (let dy = -ir; dy <= ir; dy++) {
      const t = R2 - dy * dy; if (t < 0) continue;
      const w = Math.floor(Math.sqrt(t) + 0.0001);
      if (prev < 0) { g.fillRect(cx - w, cy + dy, 2 * w + 1, 1); }
      else {
        g.fillRect(cx - w, cy + dy, Math.max(1, prev - w + 1), 1);
        g.fillRect(cx + w - Math.max(1, prev - w + 1) + 1, cy + dy, Math.max(1, prev - w + 1), 1);
      }
      if (dy === ir || R2 - (dy + 1) * (dy + 1) < 0) g.fillRect(cx - w, cy + dy, 2 * w + 1, 1);
      prev = w;
    }
  };
  // rounded rect, 1px corner cut
  G.rr = function (g, x, y, w, h, c) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    g.fillStyle = c;
    g.fillRect(x + 1, y, w - 2, h);
    g.fillRect(x, y + 1, w, h - 2);
  };
  // rounded rect, 2px corner cut
  G.rr2 = function (g, x, y, w, h, c) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    g.fillStyle = c;
    g.fillRect(x + 2, y, w - 4, h);
    g.fillRect(x + 1, y + 1, w - 2, h - 2);
    g.fillRect(x, y + 2, w, h - 4);
  };
  // outlined rounded panel (fill + border)
  G.panel = function (g, x, y, w, h, fill, border) {
    G.rr2(g, x, y, w, h, border || G.OUT);
    G.rr2(g, x + 1, y + 1, w - 2, h - 2, fill);
  };

  // ---------- mouse / pointer ----------
  G.mouse = { x: -99, y: -99, down: false, vx: 0, vy: 0, px: -99, py: -99, touch: false };

  // ---------- global juice ----------
  G.shakeT = 0; G.shakeMag = 0;
  G.shake = function (mag, t) { G.shakeMag = Math.max(G.shakeMag, mag); G.shakeT = Math.max(G.shakeT, t || 0.18); };

  G.toasts = [];
  G.toast = function (str, col) { G.toasts.push({ str, col: col || '#fff8f2', t: 0 }); if (G.toasts.length > 3) G.toasts.shift(); };

  G.sparks = [];
  // burst of sparkle pixels
  G.spark = function (x, y, col, n, spd) {
    n = n || 8;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = G.rand(12, spd || 46);
      G.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 14, t: 0, life: G.rand(0.35, 0.7), col: Array.isArray(col) ? G.pick(col) : col, star: Math.random() < 0.35 });
    }
  };

  G.coinFlies = [];
  // coin flies from (x,y) to the HUD, then credits money
  G.flyCoin = function (x, y, amount) {
    const n = G.clamp(Math.round(amount / 3) + 1, 1, 6);
    const per = amount / n;
    for (let i = 0; i < n; i++) {
      G.coinFlies.push({ x, y, sx: x, sy: y, t: -i * 0.07, amt: per, arc: G.rand(18, 42) });
    }
  };

  G.floaters = []; // floating text like "+$6" or "PERFECT!"
  G.floatText = function (str, x, y, col) { G.floaters.push({ str, x, y, col: col || '#ffe66e', t: 0 }); };

  G.updateJuice = function (dt) {
    if (G.shakeT > 0) { G.shakeT -= dt; if (G.shakeT <= 0) G.shakeMag = 0; }
    for (let i = G.sparks.length - 1; i >= 0; i--) {
      const s = G.sparks[i];
      s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 130 * dt;
      if (s.t > s.life) G.sparks.splice(i, 1);
    }
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
      c.x = G.lerp(c.sx, 16, e);
      c.y = G.lerp(c.sy, 9, e) - Math.sin(c.t * Math.PI) * c.arc;
    }
    for (let i = G.floaters.length - 1; i >= 0; i--) {
      const f = G.floaters[i];
      f.t += dt; f.y -= 14 * dt;
      if (f.t > 1.1) G.floaters.splice(i, 1);
    }
    for (let i = G.toasts.length - 1; i >= 0; i--) {
      const t = G.toasts[i];
      t.t += dt;
      if (t.t > 2.6) G.toasts.splice(i, 1);
    }
    // money counter tween
    if (G.state) {
      if (G.state.moneyShown === undefined) G.state.moneyShown = G.state.money;
      const d = G.state.money - G.state.moneyShown;
      if (Math.abs(d) < 0.4) G.state.moneyShown = G.state.money;
      else G.state.moneyShown += d * Math.min(1, dt * 7);
    }
  };

  G.drawJuice = function (g) {
    // sparkles
    for (const s of G.sparks) {
      const a = 1 - s.t / s.life;
      g.globalAlpha = a;
      if (s.star && a > 0.4) {
        G.R(g, s.x - 1, s.y, 3, 1, s.col); G.R(g, s.x, s.y - 1, 1, 3, s.col);
      } else {
        G.R(g, s.x, s.y, 1, 1, s.col);
      }
      g.globalAlpha = 1;
    }
    // coins
    for (const c of G.coinFlies) {
      if (c.t < 0) continue;
      const wob = Math.abs(Math.sin(c.t * 9));
      G.fe(g, c.x, c.y, 2 + wob, 3, '#3b2b40');
      G.fe(g, c.x, c.y - 1, 1 + wob, 2, '#ffd94a');
      G.R(g, c.x, c.y - 2, 1, 1, '#fff3b0');
    }
    // floating text
    for (const f of G.floaters) {
      const a = f.t > 0.7 ? 1 - (f.t - 0.7) / 0.4 : 1;
      g.globalAlpha = Math.max(0, a);
      G.text(g, f.str, f.x, f.y, f.col, { align: 'center', out: G.OUT });
      g.globalAlpha = 1;
    }
    // toasts
    let ty = 30;
    for (const t of G.toasts) {
      const a = t.t < 0.15 ? t.t / 0.15 : t.t > 2.2 ? 1 - (t.t - 2.2) / 0.4 : 1;
      const w = G.tw(t.str) + 12;
      g.globalAlpha = Math.max(0, a) * 0.92;
      G.panel(g, G.W / 2 - w / 2, ty, w, 13, '#3b2b40', '#3b2b40');
      G.text(g, t.str, G.W / 2, ty + 3, t.col, { align: 'center' });
      g.globalAlpha = 1;
      ty += 16;
    }
  };

  // ---------- shared button ----------
  G.drawBtn = function (g, x, y, w, h, label, opts) {
    opts = opts || {};
    const hov = !opts.disabled && G.inRect(G.mouse.x, G.mouse.y, x, y, w, h);
    const base = opts.disabled ? '#8d8398' : opts.col || '#ff8fb0';
    const face = hov && G.mouse.down ? G.shade(base, -0.15) : hov ? G.shade(base, 0.12) : base;
    const dy = hov && G.mouse.down ? 1 : 0;
    G.rr2(g, x, y + 2, w, h, G.OUT); // drop shadow
    G.rr2(g, x, y + dy, w, h, G.OUT);
    G.rr2(g, x + 1, y + 1 + dy, w - 2, h - 2, face);
    G.R(g, x + 3, y + 2 + dy, w - 6, 1, G.shade(face, 0.35));
    if (label) G.text(g, label, x + w / 2, y + Math.floor((h - 7) / 2) + dy, opts.tcol || '#fff', { align: 'center' });
    return hov;
  };
})();

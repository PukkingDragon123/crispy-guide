// ============================================================
// DOUBLE LIFE v2 - sprites.js
// The art bible. Every sprite is procedural pixel work built
// from scanline primitives: 4-5 tone ramps, scale/wart texture,
// hard rim light, and BEADY DOT EYES on every character.
// Nothing here is cute. Everything is saturated and lit hard.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  function orr(g, x, y, w, h, col) { G.rr(g, x - 1, y - 1, w + 2, h + 2, OUT); G.rr(g, x, y, w, h, col); }
  function orr2(g, x, y, w, h, col) { G.rr2(g, x - 1, y - 1, w + 2, h + 2, OUT); G.rr2(g, x, y, w, h, col); }
  function ofc(g, cx, cy, r, col) { G.fc(g, cx, cy, r + 1, OUT); G.fc(g, cx, cy, r, col); }
  function ofe(g, cx, cy, rx, ry, col) { G.fe(g, cx, cy, rx + 1, ry + 1, OUT); G.fe(g, cx, cy, rx, ry, col); }
  G.orr = orr; G.orr2 = orr2; G.ofc = ofc; G.ofe = ofe;

  // ------------------------------------------------------------
  // BEADY DOT EYE - the signature of the whole cast.
  // A sunken socket, a hard bright ring, a single 1px pupil dot.
  // ------------------------------------------------------------
  G.dotEye = function (g, x, y, opts) {
    opts = opts || {};
    const r = opts.r || 3;                 // socket radius
    const sclera = opts.sclera || '#f4e9b8';
    if (opts.closed) {
      G.R(g, x - r, y, r * 2 + 1, 1, OUT);
      G.R(g, x - r + 1, y + 1, r * 2 - 1, 1, G.shade(sclera, -0.55));
      return;
    }
    G.fc(g, x, y, r + 1, OUT);            // socket rim
    G.fc(g, x, y, r, sclera);             // bright eye
    if (opts.slit) {                       // reptile vertical slit
      G.R(g, x, y - r + 1, 1, r * 2 - 1, OUT);
      G.R(g, x, y - 1, 1, 2, opts.pupil || '#000');
    } else {
      const px = x + (opts.lookX || 0), py = y + (opts.lookY || 0);
      G.R(g, px, py, 1, 1, opts.pupil || '#000');   // the DOT
      if (r > 2) G.R(g, px, py - 1, 1, 1, OUT);
    }
    G.R(g, x - r + 1, y - r, 1, 1, '#ffffff');      // spec
    if (opts.brow) { G.R(g, x - r - 1, y - r - 1, r * 2 + 3, 2, opts.brow); }
  };


  // ------------------------------------------------------------
  // TWO-PASS TAPERED LIMB
  // Beads drawn outline-then-fill per bead overdraw their
  // neighbours and read as a chain of blobs. Passing the whole
  // spine twice (all outlines, then all fills) yields one solid
  // silhouette - this is how every limb/tail/coil is built.
  // spine: [{x,y,r}]
  // ------------------------------------------------------------
  G.limb = function (g, spine, col, colDark, colLit, opts) {
    opts = opts || {};
    const gw = opts.grow === undefined ? 1.5 : opts.grow;
    if (!spine || !spine.length) return;
    // Densify first: beads further apart than half their radius leave
    // visible bulges in the union, which is what makes a limb read as a
    // string of spheres instead of a tube.
    if (spine.length > 1) {
      const dense = [];
      for (let i = 0; i < spine.length; i++) {
        dense.push(spine[i]);
        if (i + 1 < spine.length) {
          const p0 = spine[i], p1 = spine[i + 1];
          const d = Math.hypot(p1.x - p0.x, p1.y - p0.y);
          const step = Math.max(0.8, Math.min(p0.r, p1.r) * 0.4);
          const n = Math.floor(d / step);
          for (let k = 1; k < n; k++) {
            const tt = k / n;
            dense.push({ x: p0.x + (p1.x - p0.x) * tt, y: p0.y + (p1.y - p0.y) * tt, r: p0.r + (p1.r - p0.r) * tt });
          }
        }
      }
      spine = dense;
    }
    // Accumulate the union of all beads into per-row spans, then fill
    // ONCE. Shading is applied by position across the span, so the limb
    // reads as one solid tube instead of a string of shaded blobs.
    let minY = 1e9, maxY = -1e9;
    for (const s of spine) { minY = Math.min(minY, s.y - s.r - gw); maxY = Math.max(maxY, s.y + s.r + gw); }
    minY = Math.floor(minY); maxY = Math.ceil(maxY);
    const H = maxY - minY + 1;
    if (H <= 0 || H > 1600) return;
    const lo = new Float32Array(H).fill(1e9), hi = new Float32Array(H).fill(-1e9);
    const loO = new Float32Array(H).fill(1e9), hiO = new Float32Array(H).fill(-1e9);
    for (const s of spine) {
      const r = s.r, ro = r + gw;
      const y0 = Math.floor(s.y - ro), y1 = Math.ceil(s.y + ro);
      for (let yy = y0; yy <= y1; yy++) {
        const i = yy - minY; if (i < 0 || i >= H) continue;
        const dy = yy - s.y;
        const to = ro * ro - dy * dy;
        if (to > 0) { const w = Math.sqrt(to); if (s.x - w < loO[i]) loO[i] = s.x - w; if (s.x + w > hiO[i]) hiO[i] = s.x + w; }
        const ti = r * r - dy * dy;
        if (ti > 0) { const w = Math.sqrt(ti); if (s.x - w < lo[i]) lo[i] = s.x - w; if (s.x + w > hi[i]) hi[i] = s.x + w; }
      }
    }
    // outline
    g.fillStyle = OUT;
    for (let i = 0; i < H; i++) if (hiO[i] > -1e8) g.fillRect(Math.round(loO[i]), minY + i, Math.round(hiO[i] - loO[i]) + 1, 1);
    // body: base fill, lit edge on the light (left) side, core shadow on the right
    let firstRow = -1, lastRow = -1;
    for (let i = 0; i < H; i++) { if (hi[i] > -1e8) { if (firstRow < 0) firstRow = i; lastRow = i; } }
    const span = Math.max(1, lastRow - firstRow);
    for (let i = 0; i < H; i++) {
      if (hi[i] < -1e8) continue;
      const x0 = Math.round(lo[i]), x1 = Math.round(hi[i]), w = x1 - x0 + 1;
      const p = (i - firstRow) / span;                    // 0 at the top of the limb
      // slightly lighter toward the top so the form turns
      g.fillStyle = p < 0.18 ? G.shade(col, 0.12) : p > 0.86 ? G.shade(col, -0.14) : col;
      g.fillRect(x0, minY + i, w, 1);
      if (w > 3) {
        const lw = Math.max(1, Math.round(w * 0.2));
        if (colLit) { g.fillStyle = colLit; g.fillRect(x0, minY + i, lw, 1); }
        if (colDark) { g.fillStyle = colDark; g.fillRect(x1 - lw + 1, minY + i, lw, 1); }
        if (w > 6) { g.fillStyle = G.shade(col, 0.3); g.fillRect(x0 + lw, minY + i, 1, 1); }
      }
    }
    // banding (snake rings) as straight rows, not ellipses
    if (opts.bands) {
      const every = opts.bandEvery || 5;
      for (let i = firstRow; i <= lastRow; i++) {
        if (Math.floor((i - firstRow) / every) % 2) continue;
        if (hi[i] < -1e8) continue;
        const x0 = Math.round(lo[i]) + 1, x1 = Math.round(hi[i]) - 1;
        if (x1 <= x0) continue;
        g.fillStyle = opts.bands;
        g.fillRect(x0, minY + i, x1 - x0 + 1, 1);
      }
    }
    // sparse scale texture down the middle of the form
    if (opts.scale) {
      g.fillStyle = opts.scale;
      for (let i = firstRow + 2; i <= lastRow - 2; i += 3) {
        if (hi[i] < -1e8) continue;
        const x0 = Math.round(lo[i]), x1 = Math.round(hi[i]);
        const cx = (x0 + x1) / 2, half = (x1 - x0) / 2;
        for (let k = -1; k <= 1; k++) {
          const px = Math.round(cx + k * half * 0.42) + ((i & 1) ? 1 : 0);
          if (px <= x0 + 1 || px >= x1 - 1) continue;
          g.fillRect(px, minY + i, 2, 1);
        }
      }
    }
  };

  // ------------------------------------------------------------
  // ORGANIC SKULL - scanline profile, not a rectangle.
  // Narrow crown -> heavy brow -> wide cheek -> tapered jaw.
  // Returns metrics the caller uses to place features.
  // ------------------------------------------------------------
  G.skull = function (g, cx, top, w, h, col, colDark, colLit, opts) {
    opts = opts || {};
    const flat = opts.flat || 0;      // 0 = tall skull, 1 = flat amphibian head
    const rows = [];
    for (let j = 0; j < h; j++) {
      const p = j / (h - 1);
      // brow at 0.28, cheek bulge at 0.55, jaw taper after 0.78
      let k = 0.52 + 0.30 * Math.sin(Math.pow(p, 0.62) * Math.PI * 0.98)
                   + 0.18 * Math.exp(-Math.pow((p - 0.5) / 0.28, 2));
      if (p > 0.8) k *= 1 - (p - 0.8) * (flat ? 1.1 : 1.9);
      if (p < 0.3) k *= 0.74 + Math.pow(p / 0.3, 0.9) * 0.26;
      k = Math.max(0.06, k * (1 + flat * 0.26));
      rows.push(Math.max(2, Math.round(w * 0.5 * k)));
    }
    // outline pass
    for (let j = 0; j < h; j++) G.R(g, cx - rows[j] - 2, top + j, rows[j] * 2 + 4, 1, OUT);
    G.R(g, cx - rows[0] - 2, top - 2, rows[0] * 2 + 4, 2, OUT);
    G.R(g, cx - rows[h - 1] - 2, top + h, rows[h - 1] * 2 + 4, 2, OUT);
    // fill pass with vertical ramp
    for (let j = 0; j < h; j++) {
      const p = j / (h - 1);
      const c = p < 0.16 ? G.mix(colLit, col, p / 0.16) : G.mix(col, colDark, Math.pow((p - 0.16) / 0.84, 1.5) * 0.85);
      G.R(g, cx - rows[j], top + j, rows[j] * 2 + 1, 1, c);
      // hard rim light down the right edge, core shadow on the left
      G.R(g, cx + rows[j] - 1, top + j, 2, 1, colLit);
      G.R(g, cx - rows[j], top + j, 1, 1, G.shade(colDark, -0.3));
    }
    return { rows, halfAt: (p) => rows[G.clamp(Math.round(p * (h - 1)), 0, h - 1)] };
  };

  // tapering snout wedge pointing LEFT (dir=-1) or RIGHT (dir=1)
  G.snout = function (g, bx, by, len, hgt, dir, col, colDark, colLit) {
    // a muzzle: swells off the skull, tapers to a rounded tip, and
    // droops slightly so it never reads as a straight barrel
    len = Math.max(2, Math.round(len));
    hgt = Math.max(2, Math.round(hgt));
    const prof = [];
    for (let i = 0; i < len; i++) {
      const p = i / Math.max(1, len - 1);
      const taper = 1 - Math.pow(p, 1.35) * 0.5;
      const tip = p > 0.82 ? (1 - (p - 0.82) / 0.18) * 0.35 + 0.65 : 1;
      prof.push({
        h: Math.max(2, Math.round(hgt * taper * tip)),
        drop: Math.round(Math.pow(p, 1.6) * hgt * 0.3),
      });
    }
    for (let i = 0; i < len; i++) {
      const x = bx + dir * i;
      G.R(g, x - 1, by + prof[i].drop - 1, 3, prof[i].h + 2, OUT);
    }
    for (let i = 0; i < len; i++) {
      const p = i / Math.max(1, len - 1);
      const x = bx + dir * i, y0 = by + prof[i].drop, hh = prof[i].h;
      G.R(g, x, y0, 1, hh, G.mix(col, colDark, p * 0.55));
      G.R(g, x, y0, 1, 1, colLit);
      G.R(g, x, y0 + 1, 1, 1, G.shade(col, 0.16));
      G.R(g, x, y0 + hh - 1, 1, 1, G.shade(colDark, -0.3));
    }
    const li = len - 1;
    return { tipX: bx + dir * li, tipY: by + prof[li].drop, tipH: prof[li].h, drop: prof[li].drop };
  };


  // ------------------------------------------------------------
  // BIG CARTOON EYE
  // A shaded eyeball (never a flat disc): white sclera with a
  // soft lower bounce, coloured iris, black pupil, two speculars,
  // a skin-toned lid riding over the top, and a brow.
  // ------------------------------------------------------------
  G.eye = function (g, x, y, r, o) {
    o = o || {};
    const iris = o.iris || '#3a7a8c';
    const skin = o.skin || '#4e8c2a';
    const lookX = o.lookX || 0, lookY = o.lookY || 0;
    x = Math.round(x); y = Math.round(y);

    if (o.closed) {
      // a closed lid is a lash line with a lit crease, not a bar
      for (let i = -r; i <= r; i++) {
        const d = 1 - Math.abs(i) / (r + 0.001);
        G.R(g, x + i, y + Math.round(-d * 1.5), 1, 2, OUT);
        G.R(g, x + i, y + Math.round(-d * 1.5) - 1, 1, 1, G.shade(skin, 0.2));
      }
      if (o.brow) drawBrow(g, x, y - r - 3, r, o.brow, skin);
      return;
    }

    // socket shadow so the eye sits IN the head
    G.fe(g, x, y + 1, r + 2, r + 1.4, G.shade(skin, -0.5));
    // sclera as a lit ball
    G.fe(g, x, y, r + 1, r + 0.6, OUT);
    for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) {
      const t = 1 - (dy * dy) / (r * r); if (t < 0) continue;
      const hw = Math.floor(r * Math.sqrt(t));
      const p = (dy + r) / (2 * r);
      const c = p < 0.34 ? '#ffffff' : p < 0.72 ? '#f4f1e6' : '#d9d2c2';
      G.R(g, x - hw, y + dy, hw * 2 + 1, 1, c);
    }
    // iris: a shaded ball of its own, offset by the gaze
    const ir = Math.max(2, r * 0.62);
    const ix = x + lookX * (r - ir) * 0.9, iy = y + lookY * (r - ir) * 0.9 + 0.4;
    for (let dy = -Math.ceil(ir); dy <= Math.ceil(ir); dy++) {
      const t = 1 - (dy * dy) / (ir * ir); if (t < 0) continue;
      const hw = Math.floor(ir * Math.sqrt(t));
      const p = (dy + ir) / (2 * ir);
      G.R(g, ix - hw, iy + dy, hw * 2 + 1, 1,
        p < 0.3 ? G.shade(iris, -0.35) : p < 0.68 ? iris : G.shade(iris, 0.3));
    }
    // pupil
    const pr = Math.max(1, ir * (o.wide ? 0.66 : 0.48));
    G.fe(g, ix, iy, pr, pr * 1.04, '#0a0a0c');
    // speculars: one hard, one small bounce
    G.R(g, Math.round(ix - ir * 0.55), Math.round(iy - ir * 0.6), 2, 2, '#ffffff');
    G.R(g, Math.round(ix + ir * 0.35), Math.round(iy + ir * 0.45), 1, 1, '#e8f4ff');
    // upper lid riding over the ball
    const lidDrop = o.lid === undefined ? 0.26 : o.lid;
    if (lidDrop > 0) {
      const ld = Math.round(r * 2 * lidDrop);
      for (let dy = 0; dy < ld; dy++) {
        const yy = y - r + dy;
        const t = 1 - Math.pow((yy - y) / r, 2); if (t < 0) continue;
        const hw = Math.floor((r + 1) * Math.sqrt(t));
        G.R(g, x - hw, yy, hw * 2 + 1, 1, dy === ld - 1 ? OUT : G.shade(skin, -0.12));
      }
    }
    if (o.brow) drawBrow(g, x, y - r - 2, r, o.brow, skin);
  };

  // an angled brow ridge; ang<0 = worried, ang>0 = angry
  function drawBrow(g, x, y, r, ang, skin) {
    const n = Math.round(r * 2.2);
    for (let i = 0; i < n; i++) {
      const p = i / (n - 1) - 0.5;
      const yy = y + Math.round(p * ang * r * 0.9) - Math.round(Math.cos(p * 3) * 1.2);
      G.R(g, x + Math.round(p * r * 2.2), yy, 1, 3, OUT);
      G.R(g, x + Math.round(p * r * 2.2), yy - 1, 1, 1, G.shade(skin, -0.35));
    }
  }

  // ------------------------------------------------------------
  // DOME - a lit sphere in quantised pixel bands, run-length
  // filled. This is what replaces every flat circle.
  // ------------------------------------------------------------
  G.dome = function (g, cx, cy, r, col, o) {
    o = o || {};
    const sq = o.squash === undefined ? 1 : o.squash;      // >1 = wider
    const rx = r * sq, ry = r / Math.sqrt(sq);
    cx = Math.round(cx); cy = Math.round(cy);
    const LX = -0.52, LY = -0.62, LZ = 0.59;
    const ramp = [
      G.shade(col, 0.62), G.shade(col, 0.34), G.shade(col, 0.1),
      col, G.shade(col, -0.2), G.shade(col, -0.42), G.shade(col, -0.6),
    ];
    // outline
    G.fe(g, cx, cy, rx + 1, ry + 1, OUT);
    const iry = Math.ceil(ry);
    for (let dy = -iry; dy <= iry; dy++) {
      const tt = 1 - (dy * dy) / (ry * ry); if (tt < 0) continue;
      const hw = Math.floor(rx * Math.sqrt(tt));
      let runStart = -hw, runIdx = -1;
      for (let dx = -hw; dx <= hw + 1; dx++) {
        let idx = -2;
        if (dx <= hw) {
          const nx = dx / rx, ny = dy / ry;
          const nz2 = 1 - nx * nx - ny * ny;
          const nz = nz2 > 0 ? Math.sqrt(nz2) : 0;
          let lam = nx * LX + ny * LY + nz * LZ;
          lam = (lam + 0.32) / 1.3;
          // a touch of rim light on the dark limb keeps it from going flat
          const rim = Math.pow(1 - nz, 3) * 0.34;
          lam = G.clamp(lam + rim * (dx > 0 ? 1 : 0.25), 0, 1);
          idx = lam > 0.9 ? 0 : lam > 0.74 ? 1 : lam > 0.6 ? 2 : lam > 0.45 ? 3 : lam > 0.3 ? 4 : lam > 0.16 ? 5 : 6;
        }
        if (idx !== runIdx) {
          if (runIdx >= 0) G.R(g, cx + runStart, cy + dy, dx - runStart, 1, ramp[runIdx]);
          runIdx = idx; runStart = dx;
        }
      }
    }
    if (o.spec !== false) {
      G.R(g, Math.round(cx - rx * 0.42), Math.round(cy - ry * 0.52), 2, 2, '#ffffff');
      G.R(g, Math.round(cx - rx * 0.52), Math.round(cy - ry * 0.36), 1, 1, '#ffffff');
    }
    return { rx, ry };
  };

  // ------------------------------------------------------------
  // GARMENTS - every customer is dressed. A torso piece plus a
  // head piece, keyed per species so the cast reads as characters.
  // ------------------------------------------------------------
  const OUTFITS = {
    bullfrog:   { top: 'waistcoat', hat: 'flatcap',  c1: '#7a2f2f', c2: '#c9a227', hc: '#3c4a2a' },
    toad:       { top: 'dungarees', hat: 'bucket',   c1: '#3f5b8a', c2: '#d9c48a', hc: '#6b7a3a' },
    treefrog:   { top: 'tee',       hat: 'beanie',   c1: '#e8722a', c2: '#f4d03f', hc: '#2f6b8a' },
    axolotl:    { top: 'frill',     hat: 'bow',      c1: '#f4f1e6', c2: '#ff6f9c', hc: '#ff3d7f' },
    newt:       { top: 'hoodie',    hat: 'hood',     c1: '#2b2f3a', c2: '#ff7a18', hc: '#2b2f3a' },
    viper:      { top: 'shirt',     hat: 'fedora',   c1: '#22252e', c2: '#c0392b', hc: '#16181f' },
    python:     { top: 'scarf',     hat: 'flatcap',  c1: '#8a5a2a', c2: '#e0c068', hc: '#5a4020' },
    gecko:      { top: 'shirt',     hat: 'glasses',  c1: '#e8e2d0', c2: '#2f6b8a', hc: '#3a3f46' },
    iguana:     { top: 'vest',      hat: 'bandana',  c1: '#2f5c3a', c2: '#c9a227', hc: '#c0392b' },
    gator:      { top: 'jersey',    hat: 'cap',      c1: '#2f4a8a', c2: '#f4f1e6', hc: '#c0392b' },
    turtle:     { top: 'apron',     hat: 'newsboy',  c1: '#5a4a2a', c2: '#a8925a', hc: '#4a4030' },
    salamander: { top: 'hoodie',    hat: 'phones',   c1: '#7a2318', c2: '#ffb03a', hc: '#2b2f3a' },
  };
  G.outfitOf = (id) => OUTFITS[id] || OUTFITS.gator;

  // torso garment. box = {x,y,w,h} of the torso the cloth wraps
  function drawTop(g, kind, box, of, t) {
    const { x, y, w, h } = box;
    const c1 = of.c1, c2 = of.c2;
    const lit = G.shade(c1, 0.26), dk = G.shade(c1, -0.36);
    function cloth(bx, by, bw, bh) {
      G.rr(g, bx - 1, by - 1, bw + 2, bh + 2, OUT);
      G.rr(g, bx, by, bw, bh, c1);
      G.R(g, bx + 1, by + 1, bw - 3, 1, lit);            // shoulder highlight
      G.R(g, bx, by + bh - 2, bw, 2, dk);                // hem shadow
      G.R(g, bx + bw - 2, by + 2, 1, bh - 4, G.shade(c1, 0.14));
      // fabric folds
      for (let i = 1; i < 3; i++) G.R(g, bx + 2, by + Math.round(bh * i / 3), bw - 4, 1, G.shade(c1, -0.16));
    }
    if (kind === 'waistcoat') {
      cloth(x, y + 2, w, h - 2);
      G.R(g, x + Math.round(w * 0.42), y + 2, 2, h - 4, dk);          // opening
      for (let i = 0; i < 3; i++) G.R(g, x + Math.round(w * 0.34), y + 5 + i * 5, 2, 2, c2);
      G.R(g, x, y + 2, 3, h - 4, G.shade(c1, -0.2));                  // lapel
    } else if (kind === 'dungarees') {
      cloth(x, y + Math.round(h * 0.3), w, Math.round(h * 0.7));
      G.R(g, x + 2, y + 1, 3, Math.round(h * 0.36), c1);              // straps
      G.R(g, x + w - 6, y + 1, 3, Math.round(h * 0.36), c1);
      G.R(g, x + 2, y + 1, 3, 1, lit); G.R(g, x + w - 6, y + 1, 3, 1, lit);
      G.R(g, x + 3, y + Math.round(h * 0.34), 2, 2, c2);
      G.R(g, x + w - 5, y + Math.round(h * 0.34), 2, 2, c2);
      G.R(g, x + Math.round(w * 0.3), y + Math.round(h * 0.5), Math.round(w * 0.4), 5, G.shade(c1, -0.22));
    } else if (kind === 'hoodie') {
      cloth(x - 1, y, w + 2, h);
      G.R(g, x + Math.round(w * 0.44), y + 3, 2, Math.round(h * 0.5), dk);
      G.R(g, x + 1, y + Math.round(h * 0.52), w - 2, 2, G.shade(c1, -0.3));
      G.R(g, x + 2, y + Math.round(h * 0.6), 4, 2, c2);               // drawstring
      G.R(g, x + w - 6, y + Math.round(h * 0.6), 4, 2, c2);
      // kangaroo pocket
      G.rr(g, x + 3, y + Math.round(h * 0.66), w - 6, Math.round(h * 0.24), G.shade(c1, -0.18));
    } else if (kind === 'tee') {
      cloth(x, y + 1, w, h - 1);
      G.R(g, x + Math.round(w * 0.28), y + Math.round(h * 0.28), Math.round(w * 0.44), Math.round(h * 0.3), c2);
      G.R(g, x + Math.round(w * 0.34), y + Math.round(h * 0.34), Math.round(w * 0.3), 2, G.shade(c2, -0.4));
    } else if (kind === 'shirt') {
      cloth(x, y, w, h);
      G.R(g, x + Math.round(w * 0.46), y + 1, 2, h - 3, dk);
      for (let i = 0; i < 3; i++) G.R(g, x + Math.round(w * 0.4), y + 4 + i * 5, 1, 1, '#0a0a0c');
      // collar wings
      G.R(g, x + Math.round(w * 0.3), y, 4, 3, G.shade(c1, 0.2));
      G.R(g, x + Math.round(w * 0.56), y, 4, 3, G.shade(c1, 0.2));
      // tie
      G.R(g, x + Math.round(w * 0.44), y + 3, 3, Math.round(h * 0.5), c2);
      G.R(g, x + Math.round(w * 0.44), y + 2, 3, 2, G.shade(c2, -0.3));
    } else if (kind === 'vest') {
      cloth(x, y + 3, w, h - 3);
      G.R(g, x + 1, y + 3, w - 2, 2, c2);
      G.R(g, x + Math.round(w * 0.44), y + 5, 2, h - 8, dk);
      G.R(g, x + 2, y + Math.round(h * 0.55), 5, 4, G.shade(c1, -0.25));   // pocket
    } else if (kind === 'jersey') {
      cloth(x, y + 1, w, h - 1);
      G.R(g, x, y + Math.round(h * 0.36), w, 3, c2);
      G.R(g, x + Math.round(w * 0.36), y + Math.round(h * 0.5), 4, 6, c2);  // number
      G.R(g, x + Math.round(w * 0.52), y + Math.round(h * 0.5), 3, 6, c2);
    } else if (kind === 'apron') {
      cloth(x + 1, y + Math.round(h * 0.22), w - 2, Math.round(h * 0.78));
      G.R(g, x + Math.round(w * 0.32), y, 2, Math.round(h * 0.26), G.shade(c1, -0.2));
      G.R(g, x + Math.round(w * 0.6), y, 2, Math.round(h * 0.26), G.shade(c1, -0.2));
      G.speckle(g, x + 2, y + Math.round(h * 0.3), w - 4, Math.round(h * 0.6), '#7a1a24', 0.05, 4);
    } else if (kind === 'frill') {
      // frilly collar only - the axolotl keeps its gills clear
      for (let i = 0; i < 5; i++) {
        const fx = x + 1 + i * Math.round((w - 2) / 5);
        G.fe(g, fx + 2, y + 3, 4, 3.4, OUT);
        G.fe(g, fx + 2, y + 3, 3, 2.6, i % 2 ? c1 : c2);
      }
      cloth(x + 2, y + 6, w - 4, h - 6);
    } else if (kind === 'scarf') {
      // long knitted scarf, torso bare-ish
      G.rr(g, x - 1, y + 1, w + 2, 7, OUT);
      G.rr(g, x, y + 2, w, 5, c1);
      for (let i = 0; i < w; i += 3) G.R(g, x + i, y + 2, 1, 5, G.shade(c1, i % 6 ? -0.2 : 0.2));
      const tail = Math.round(h * 0.7);
      G.rr(g, x + 2, y + 7, 6, tail, OUT);
      G.rr(g, x + 3, y + 7, 4, tail - 1, c2);
      for (let i = 0; i < tail; i += 3) G.R(g, x + 3, y + 7 + i, 4, 1, G.shade(c2, -0.22));
    }
  }

  // head accessory. head = {cx, top, w, h}
  function drawHat(g, kind, head, of, t) {
    const cx = head.cx, top = head.top, w = head.w;
    const c = of.hc, lit = G.shade(c, 0.28), dk = G.shade(c, -0.4);
    if (kind === 'flatcap') {
      G.rr(g, cx - w * 0.5, top - 5, w, 8, OUT);
      G.rr(g, cx - w * 0.5 + 1, top - 4, w - 2, 6, c);
      G.R(g, cx - w * 0.4, top - 4, w * 0.5, 1, lit);
      G.rr(g, cx - w * 0.64, top, w * 0.44, 6, OUT);              // peak, forward-left
      G.rr(g, cx - w * 0.62, top + 1, w * 0.4, 4, dk);
      G.R(g, cx - w * 0.62, top + 1, w * 0.38, 1, G.shade(c, 0.1));
    } else if (kind === 'cap') {
      G.rr(g, cx - w * 0.48, top - 6, w * 0.96, 9, OUT);
      G.rr(g, cx - w * 0.46, top - 5, w * 0.92, 7, c);
      G.R(g, cx - w * 0.3, top - 5, w * 0.4, 1, lit);
      G.R(g, cx - 1, top - 7, 2, 2, dk);                           // button
      G.rr(g, cx + w * 0.28, top - 2, w * 0.4, 6, OUT);            // peak worn backwards
      G.rr(g, cx + w * 0.3, top - 1, w * 0.36, 4, dk);
      G.R(g, cx + w * 0.3, top - 1, w * 0.34, 1, G.shade(c, 0.1));
    } else if (kind === 'bucket') {
      G.rr(g, cx - w * 0.46, top - 6, w * 0.92, 8, OUT);
      G.rr(g, cx - w * 0.44, top - 5, w * 0.88, 6, c);
      G.rr(g, cx - w * 0.7, top + 1, w * 1.4, 4, OUT);
      G.rr(g, cx - w * 0.68, top + 2, w * 1.36, 2, G.shade(c, -0.2));
      G.R(g, cx - w * 0.3, top - 5, w * 0.3, 1, lit);
    } else if (kind === 'beanie') {
      G.rr(g, cx - w * 0.46, top - 7, w * 0.92, 10, OUT);
      G.rr(g, cx - w * 0.44, top - 6, w * 0.88, 8, c);
      for (let i = 0; i < 4; i++) G.R(g, cx - w * 0.4 + i * w * 0.24, top - 6, 1, 8, G.shade(c, -0.2));
      G.rr(g, cx - w * 0.48, top + 1, w * 0.96, 4, G.shade(c, 0.16));   // turn-up
      G.fe(g, cx, top - 9, 3, 2.6, G.shade(c, 0.34));                    // bobble
    } else if (kind === 'hood') {
      G.rr(g, cx - w * 0.62, top - 6, w * 1.24, 16, OUT);
      G.rr(g, cx - w * 0.6, top - 5, w * 1.2, 14, c);
      G.rr(g, cx - w * 0.44, top - 1, w * 0.88, 12, G.shade(c, -0.45));  // the opening
      G.R(g, cx - w * 0.5, top - 5, w * 0.5, 1, G.shade(c, 0.24));
    } else if (kind === 'fedora') {
      G.rr(g, cx - w * 0.78, top + 1, w * 1.56, 4, OUT);
      G.rr(g, cx - w * 0.76, top + 2, w * 1.52, 2, G.shade(c, -0.18));
      G.rr(g, cx - w * 0.4, top - 9, w * 0.8, 11, OUT);
      G.rr(g, cx - w * 0.38, top - 8, w * 0.76, 9, c);
      G.R(g, cx - w * 0.38, top - 2, w * 0.76, 3, of.c2);                 // band
      G.R(g, cx - w * 0.3, top - 8, 2, 6, G.shade(c, -0.5));             // crown crease
      G.R(g, cx - w * 0.24, top - 8, w * 0.3, 1, lit);
    } else if (kind === 'newsboy') {
      G.fe(g, cx, top - 2, w * 0.54, 5.4, OUT);
      G.fe(g, cx, top - 2, w * 0.5, 4.6, c);
      G.fe(g, cx - w * 0.16, top - 3.5, w * 0.2, 2, lit);
      G.rr(g, cx - w * 0.6, top + 1, w * 0.4, 3, OUT);
      G.rr(g, cx - w * 0.58, top + 1, w * 0.36, 2, dk);
    } else if (kind === 'bandana') {
      G.rr(g, cx - w * 0.48, top - 2, w * 0.96, 6, OUT);
      G.rr(g, cx - w * 0.46, top - 1, w * 0.92, 4, c);
      for (let i = 0; i < 5; i++) G.R(g, cx - w * 0.4 + i * w * 0.2, top, 1, 1, '#f4f1e6');
      G.R(g, cx + w * 0.4, top + 1, 4, 2, c);                            // knot tail
      G.R(g, cx + w * 0.44, top + 3, 3, 2, G.shade(c, -0.2));
    } else if (kind === 'bow') {
      G.R(g, cx - w * 0.36, top - 3, 5, 4, OUT); G.R(g, cx - w * 0.35, top - 2, 4, 2, c);
      G.R(g, cx - w * 0.16, top - 3, 5, 4, OUT); G.R(g, cx - w * 0.15, top - 2, 4, 2, c);
      G.R(g, cx - w * 0.24, top - 2, 2, 2, G.shade(c, -0.3));
    } else if (kind === 'glasses') {
      // drawn AFTER the eyes by the caller
    } else if (kind === 'phones') {
      G.rr(g, cx - w * 0.52, top - 4, w * 1.04, 4, OUT);
      G.rr(g, cx - w * 0.5, top - 3, w, 2, c);
      for (const s of [-1, 1]) {
        G.rr(g, cx + s * w * 0.52 - 3, top + 1, 6, 8, OUT);
        G.rr(g, cx + s * w * 0.52 - 2, top + 2, 4, 6, c);
        G.R(g, cx + s * w * 0.52 - 2, top + 3, 1, 4, of.c2);
      }
    }
  }
  // round spectacles sit over the eyes
  function drawGlasses(g, e1, e2, ey, r, col) {
    for (const ex of [e1, e2]) {
      G.oc(g, ex, ey, r + 1.6, OUT);
      G.oc(g, ex, ey, r + 1, col);
      G.R(g, ex - r, ey - r, 2, 1, '#ffffff');
    }
    G.R(g, Math.min(e1, e2) + r + 2, ey, Math.abs(e2 - e1) - r * 2 - 3, 1, col);
    G.R(g, Math.max(e1, e2) + r + 2, ey - 1, 4, 1, col);
  }
  G.drawTopGarment = drawTop;
  G.drawHatAcc = drawHat;
  G.drawGlassesAcc = drawGlasses;

  // small helper: jagged teeth row poking from a jaw line
  function fangs(g, x, y, w, n, up, col) {
    col = col || P.bone;
    const step = w / n;
    for (let i = 0; i < n; i++) {
      const fx = Math.round(x + i * step + step * 0.15);
      const fw = Math.max(1, Math.round(step * 0.55));
      const fh = 2 + ((i * 7) % 3);
      G.R(g, fx - 1, up ? y - fh - 1 : y, fw + 2, fh + 1, OUT);
      G.R(g, fx, up ? y - fh : y, fw, fh, col);
    }
  }
  G.fangs = fangs;

  // ============================================================
  // CUSTOMER RIG  (feet at x,y; faces LEFT; ~66px tall at scale 1)
  // A real skeleton: shoes, shins, thighs, hips, chest, shoulders,
  // arms with elbows, neck, skull, snout. Then clothes. Then eyes.
  // o: {walk, mood:'idle'|'angry'|'happy'|'sick', scale}
  // ============================================================
  G.drawCust = function (g, spId, x, y, t, o) {
    o = o || {};
    const S = o.scale || 1;
    const a = G.animalById(spId);
    const of = G.outfitOf(spId);
    const C = a.col, C2 = a.col2, BEL = a.belly;
    const LIT = G.shade(C, 0.3), DK = G.shade(C2, -0.32);
    const mood = o.mood || 'idle';
    x = Math.round(x); y = Math.round(y);
    const u = (v) => v * S;                        // scale helper

    const walk = o.walk;
    const gait = walk ? Math.sin(t * 7.5) : 0;
    const bob = walk ? Math.abs(Math.sin(t * 7.5)) * u(1.6) : Math.sin(t * 1.7) * u(0.7);
    const base = Math.round(y - bob);

    // ground shadow (soft, dithered - not a hard ellipse)
    g.globalAlpha = 0.34;
    G.fe(g, x, y + 1, u(9), u(2), '#000');
    g.globalAlpha = 0.16;
    G.fe(g, x, y + 1, u(13), u(3), '#000');
    g.globalAlpha = 1;

    if (spId === 'viper' || spId === 'python') { drawSerpent(g, a, of, x, y, t, o, S); return; }

    const isFrog = spId === 'bullfrog' || spId === 'toad' || spId === 'treefrog';
    const isCroc = spId === 'gator' || spId === 'turtle';

    // ---- skeleton keypoints (66px tall at scale 1) ----
    const hipY   = base - u(22);
    const waistY = base - u(31);
    const chestY = base - u(40);
    const shldY  = base - u(41);
    const neckY  = base - u(45);
    const headB  = base - u(45);
    const headH  = u(19), headW = u(19);
    const headTop = headB - headH;

    // ---------- one continuous leg: hip -> knee -> ankle ----------
    function leg(px, phase, far) {
      const sw = phase * u(2.4);
      const col = far ? G.shade(C2, -0.3) : C2;
      const lit = far ? G.shade(C2, -0.08) : G.shade(C2, 0.3);
      const kneeY = hipY + u(9);
      const ankY  = base - u(5) - Math.max(0, phase) * u(1.2);
      G.limb(g, [
        { x: px, y: hipY, r: u(2.9) },
        { x: px + sw * 0.5, y: kneeY, r: u(2.4) },
        { x: px + sw, y: ankY, r: u(2.1) },
      ], col, G.shade(col, -0.3), lit, { grow: 1.2 });
      // knee crease
      G.R(g, px + sw * 0.5 - u(1.6), kneeY, u(3.2), 1, G.shade(col, -0.35));
      // shoe
      const fx = px + sw;
      G.rr(g, fx - u(4.6), ankY - u(0.4), u(7.6), u(5.2), OUT);
      G.rr(g, fx - u(4), ankY, u(6.6), u(4), far ? G.shade(of.c1, -0.48) : G.shade(of.c1, -0.24));
      G.R(g, fx - u(4), ankY, u(4.4), 1, G.shade(of.c1, 0.1));
      G.R(g, fx - u(4.6), ankY + u(3.6), u(7.6), u(1.2), OUT);
      G.R(g, fx - u(5.6), ankY + u(1.6), u(1.4), u(1.2), P.bone);   // toe claw
      if (isFrog) G.R(g, fx - u(6.8), ankY + u(2.4), u(1.8), u(1), C2);
    }
    leg(x + u(3.4), -gait, true);

    // ---------- torso: ribcage over a narrow waist ----------
    const torso = [];
    for (let i = 0; i <= 8; i++) {
      const p = i / 8;                               // 0 = hips, 1 = chest
      const ty = hipY - (hipY - chestY) * p;
      const rr = u(5.2) + u(2.4) * Math.pow(p, 1.4) - u(0.9) * Math.sin(p * Math.PI * 0.9);
      torso.push({ x: x + Math.sin(p * 0.9) * u(0.9), y: ty, r: rr });
    }
    G.limb(g, torso, C, G.shade(C2, -0.22), LIT, { grow: 1.4 });
    // belly scutes: thin bars down the near flank
    for (let i = 1; i < 8; i++) {
      const sg = torso[i];
      G.R(g, sg.x - sg.r + u(0.8), sg.y, Math.max(2, sg.r * 0.62), 1, i % 2 ? BEL : G.shade(BEL, -0.26));
    }
    if (spId === 'toad') for (const sg of torso) G.speckle(g, sg.x - sg.r * 0.4, sg.y - 1, sg.r * 1.2, 2, DK, 0.2, 3);
    if (spId === 'iguana') for (let i = 2; i < 8; i += 2)
      G.R(g, torso[i].x + torso[i].r - u(1.4), torso[i].y - u(1.8), u(1.6), u(2.6), DK);

    // ---------- clothes on the torso ----------
    const tBox = {
      x: Math.round(x - u(6.6)), y: Math.round(chestY + u(1)),
      w: Math.round(u(13.2)), h: Math.round(hipY - chestY + u(3)),
    };
    drawTop(g, of.top, tBox, of, t);

    if (spId === 'turtle') {
      G.dome(g, x + u(2.4), (hipY + waistY) / 2, u(6.6), C2, { squash: 1.12, spec: false });
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        if (Math.abs(i) + Math.abs(j) > 1) continue;
        G.R(g, x + u(2.4) + i * u(3.4) - u(1.4), (hipY + waistY) / 2 + j * u(3) - u(1.1), u(2.8), u(2.2),
          G.shade(C2, i === 0 && j === 0 ? 0.32 : 0.08));
      }
    }

    // ---------- near leg over the hem ----------
    leg(x - u(2.6), gait, false);

    // ---------- one continuous arm: shoulder -> elbow -> hand ----------
    function arm(sd, phase, far) {
      const col = far ? G.shade(C, -0.3) : C;
      const lit = far ? G.shade(C, -0.08) : LIT;
      const swing = phase * u(1.8);
      // attach at the outer edge of the ribcage, not inside it
      const shoulderR = torso[8].r;
      const sx2 = x + sd * (shoulderR - u(0.6));
      const elbX = sx2 + sd * u(1.6) + swing, elbY = shldY + u(7.5);
      const hndX = sx2 + sd * u(1.2) + swing * 1.6, hndY = shldY + u(14);
      G.limb(g, [
        { x: sx2, y: shldY, r: u(2.5) },
        { x: elbX, y: elbY, r: u(2.1) },
        { x: hndX, y: hndY, r: u(1.9) },
      ], col, G.shade(col, -0.3), lit, { grow: 1.2 });
      // short sleeve capping the shoulder
      G.rr(g, sx2 - u(2.6), shldY - u(1.4), u(5.2), u(5), OUT);
      G.rr(g, sx2 - u(2.2), shldY - u(1), u(4.4), u(4.2), G.shade(of.c1, far ? -0.44 : -0.08));
      G.R(g, sx2 - u(2.2), shldY - u(1), u(3), 1, G.shade(of.c1, 0.18));
      // three-fingered hand
      G.limb(g, [{ x: hndX, y: hndY, r: u(2.2) }, { x: hndX - u(0.6), y: hndY + u(1.6), r: u(1.9) }],
        col, null, lit, { grow: 1.1 });
      for (let f = 0; f < 3; f++)
        G.R(g, hndX + sd * u(0.6) - u(2.2) + f * u(1.5), hndY + u(2.4), u(1.1), u(1.4), P.bone);
    }
    arm(1, -gait, true);

    // ---------- neck ----------
    G.limb(g, [{ x: x, y: chestY + u(1), r: u(3.4) }, { x: x - u(0.5), y: neckY, r: u(2.8) }],
      C, G.shade(C2, -0.3), LIT, { grow: 1.2 });
    G.R(g, x - u(4), neckY + u(0.5), u(8), u(2), G.shade(of.c1, -0.28));
    G.R(g, x - u(4), neckY + u(0.5), u(5.4), 1, G.shade(of.c1, 0.12));

    // ---------- head ----------
    const hcx = x - u(1);
    // crests behind
    if (spId === 'salamander' || spId === 'newt')
      for (let i = 0; i < 4; i++) G.fe(g, hcx - u(4) + i * u(4), headTop + u(1), u(2.2), u(2), BEL);
    if (spId === 'iguana') for (let i = 0; i < 4; i++)
      G.R(g, hcx + u(2) + i * u(2.6), headTop - u(3) - (i % 2) * u(1.6), u(2), u(4), DK);
    if (spId === 'axolotl') for (let sd = 0; sd < 3; sd++) {
      const gy = headTop + u(6) + sd * u(4);
      const sp = [];
      for (let k = 0; k < 4; k++) sp.push({ x: hcx + u(7) + k * u(3), y: gy - k * u(1.8), r: u(2.2) - k * u(0.35) });
      G.limb(g, sp, '#ff8fb4', '#c93f6e', '#ffc2d6', { grow: 1.1 });
    }

    const sk = G.skull(g, hcx, headTop, headW, headH, C, C2, LIT, { flat: isFrog ? 0.5 : isCroc ? 0.28 : 0.12 });
    G.scales(g, hcx - headW * 0.28, headTop + u(4), headW * 0.56, headH - u(9), DK, Math.max(2, Math.round(u(3))), 7);
    if (spId === 'toad') G.speckle(g, hcx - headW * 0.34, headTop + u(3), headW * 0.68, headH - u(6), DK, 0.15, 9);

    // snout
    const snY = headTop + Math.round(headH * (isFrog ? 0.52 : 0.46));
    const snLen = isCroc ? u(10) : isFrog ? u(5) : u(7.5);
    const snH = isCroc ? u(7.5) : u(7);
    const sn = G.snout(g, hcx - sk.halfAt(0.6) + u(2), snY, snLen, snH, -1, C, C2, LIT);
    G.R(g, sn.tipX + u(0.5), snY + u(1.2), u(2), u(2), OUT);
    G.R(g, sn.tipX + u(0.5), snY + u(1.2), u(1), u(1), G.shade(C2, -0.4));
    const jawY = snY + snH;
    G.R(g, sn.tipX, jawY - 1, snLen, 1, OUT);
    if (isCroc) { fangs(g, sn.tipX + u(2), jawY - 1, snLen - u(5), 4, false, P.bone); fangs(g, sn.tipX + u(3), snY + u(1), snLen - u(7), 3, true, P.boneDk); }
    else if (mood === 'angry') fangs(g, sn.tipX + u(2), jawY - 1, snLen - u(5), 3, false, P.bone);
    G.limb(g, [{ x: sn.tipX + u(2), y: jawY + u(1), r: u(2) }, { x: sn.tipX + snLen - u(1), y: jawY + u(1.4), r: u(2.6) }],
      C2, null, G.shade(C2, 0.24), { grow: 1.1 });
    // mouth line / smile
    if (mood === 'happy') { G.R(g, sn.tipX + u(3), jawY - u(2), snLen - u(7), 2, '#4a0e1e'); G.R(g, sn.tipX + u(4), jawY - u(1), snLen - u(9), 1, '#c94a5e'); }
    if (mood === 'sick') { G.fe(g, hcx - u(6), headTop + headH - u(2), u(3), u(2), '#8fbf5a'); }
    if (spId === 'iguana') { G.fe(g, sn.tipX + u(5), jawY + u(4), u(4), u(3.6), OUT); G.fe(g, sn.tipX + u(5), jawY + u(4), u(3), u(2.8), G.shade(BEL, -0.1)); }

    // hat goes on before the eyes for hoods, after for the rest
    const headBox = { cx: hcx, top: headTop, w: headW, h: headH };
    if (of.hat === 'hood') drawHat(g, 'hood', headBox, of, t);

    // ---------- BIG CARTOON EYES ----------
    const eyeR = u(isFrog ? 3.9 : 3.7);
    const eyeY = headTop + Math.round(headH * (isFrog ? 0.24 : 0.34));
    const spread = Math.round(sk.halfAt(0.34) * 0.58);
    const e1 = hcx - spread, e2 = hcx + spread;
    const brow = mood === 'angry' ? 0.9 : mood === 'sick' ? -0.7 : mood === 'happy' ? -0.15 : 0;
    const blink = Math.sin(t * 1.15 + x * 0.21) > 0.972;
    const irisCol = { bullfrog: '#c9a227', toad: '#b0762a', treefrog: '#d9b12a', axolotl: '#3a3a4a',
      newt: '#e8722a', gecko: '#2f8aa0', iguana: '#c9a227', gator: '#3a7a4a', turtle: '#8a6a2a',
      salamander: '#c0392b' }[spId] || '#3a7a8c';
    if (isFrog) {   // frogs: eyes ride high on bulging mounds
      for (const ex of [e1, e2]) G.dome(g, ex, headTop + u(1.8), eyeR + u(0.8), C, { squash: 1.04, spec: false });
      G.eye(g, e1, headTop + u(1), eyeR, { iris: irisCol, skin: C, closed: blink, brow, lookX: -0.35, lid: 0.2 });
      G.eye(g, e2, headTop + u(1), eyeR, { iris: irisCol, skin: C, closed: blink, brow, lookX: -0.35, lid: 0.2 });
      if (of.hat === 'glasses') drawGlasses(g, e1, e2, headTop + u(1), eyeR, of.hc);
    } else {
      G.eye(g, e1, eyeY, eyeR, { iris: irisCol, skin: C, closed: blink, brow, lookX: -0.4,
        lid: mood === 'sick' ? 0.5 : 0.24, wide: mood === 'angry' });
      G.eye(g, e2, eyeY, eyeR, { iris: irisCol, skin: C, closed: blink, brow, lookX: -0.4,
        lid: mood === 'sick' ? 0.5 : 0.24, wide: mood === 'angry' });
      if (of.hat === 'glasses') drawGlasses(g, e1, e2, eyeY, eyeR, of.hc);
    }
    if (of.hat !== 'hood' && of.hat !== 'glasses') drawHat(g, of.hat, headBox, of, t);

    // ---------- near arm, over everything ----------
    arm(-1, gait, false);
  };

  // serpents: coiled body, waistcoat and a hat, big eyes
  function drawSerpent(g, a, of, x, y, t, o, S) {
    const u = (v) => v * S;
    const C = a.col, C2 = a.col2, BEL = a.belly;
    const wig = Math.sin(t * (o.walk ? 5.5 : 1.6));
    const spine = [];
    for (let i = 0; i < 30; i++) {
      const p = i / 29;
      spine.push({
        x: x + u(4) + Math.sin(p * 4.1 + t * 2) * u(9) * (0.3 + p * 0.7),
        y: y - u(2) - p * u(40),
        r: u(6.6) - p * u(3.2),
      });
    }
    G.limb(g, spine, C, G.shade(C2, -0.1), G.shade(C, 0.32), { scale: G.shade(C2, -0.24), bands: C2, bandEvery: 5 });
    for (let i = 2; i < 30; i += 5) G.fe(g, spine[i].x - spine[i].r * 0.42, spine[i].y + 1, u(2), u(1.3), BEL);
    // a little waistcoat around the upper coil
    const wb = { x: Math.round(x - u(5)), y: Math.round(y - u(40)), w: Math.round(u(15)), h: Math.round(u(15)) };
    drawTop(g, 'waistcoat', wb, of, t);

    const hy = y - u(52), hx = x + u(3) + wig * u(2.4);
    const sk = G.skull(g, hx, hy, u(21), u(13), C, C2, G.shade(C, 0.32), { flat: 0.9 });
    G.scales(g, hx - u(7), hy + u(2), u(14), u(7), G.shade(C2, -0.22), Math.max(2, Math.round(u(3))), 4);
    const sn = G.snout(g, hx - sk.halfAt(0.6) + u(2), hy + u(5), u(9), u(5.5), -1, C, C2, G.shade(C, 0.32));
    G.R(g, sn.tipX + u(1), hy + u(6), u(1.6), 1, OUT);
    G.R(g, sn.tipX, hy + u(10), u(13), 1, OUT);
    G.R(g, sn.tipX + u(1), hy + u(11), u(2.4), u(4), OUT); G.R(g, sn.tipX + u(1), hy + u(11), u(1.6), u(3.2), P.bone);
    G.R(g, sn.tipX + u(8), hy + u(11), u(2.4), u(3.2), OUT); G.R(g, sn.tipX + u(8), hy + u(11), u(1.6), u(2.4), P.bone);
    const eyeR = u(3.6);
    const blink = Math.sin(t * 1.2 + x * 0.3) > 0.975;
    G.eye(g, hx - u(5), hy + u(4.5), eyeR, { iris: '#c9a227', skin: C, closed: blink, lookX: -0.4, lid: 0.22, brow: o.mood === 'angry' ? 0.9 : 0 });
    G.eye(g, hx + u(5), hy + u(4.5), eyeR, { iris: '#c9a227', skin: C, closed: blink, lookX: -0.4, lid: 0.22, brow: o.mood === 'angry' ? 0.9 : 0 });
    drawHat(g, of.hat, { cx: hx, top: hy, w: u(21), h: u(13) }, of, t);
    if (Math.sin(t * 2) > 0.72) {
      G.R(g, sn.tipX - u(7), hy + u(8), u(8), 1, '#e0135e');
      G.R(g, sn.tipX - u(11), hy + u(6), u(4), 1, '#e0135e'); G.R(g, sn.tipX - u(11), hy + u(10), u(4), 1, '#e0135e');
    }
  }

  // ============================================================
  // BIG PATIENT FACE (the chair). Centred at cx,cy.
  // o: {mood:'worry'|'idle'|'agony'|'relief'|'out', mouth:0..1,
  //     t, sweat, flinch}
  // ============================================================
  G.drawFace = function (g, spId, cx, cy, o) {
    o = o || {};
    const a = G.animalById(spId);
    const of = G.outfitOf(spId);
    const C = a.col, C2 = a.col2, BEL = a.belly;
    const LIT = G.shade(C, 0.3), DK = G.shade(C2, -0.32);
    const t = o.t || 0;
    const mood = o.mood || 'idle';
    const flinch = o.flinch ? Math.sin(t * 44) * 2.5 : 0;
    cx = Math.round(cx + flinch); cy = Math.round(cy + Math.sin(t * 1.5) * 1.2);
    const isFrog = spId === 'bullfrog' || spId === 'toad' || spId === 'treefrog';
    const isCroc = spId === 'gator' || spId === 'turtle';
    const W = 88, H = 64, top = cy - 43;

    // frills / crests / gills behind
    if (spId === 'axolotl') for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
      const gy = top + 22 + i * 13, sp = [];
      for (let k = 0; k < 5; k++) sp.push({ x: cx + s * (W * 0.42 + k * 4), y: gy - k, r: 4 - k * 0.5 });
      G.limb(g, sp, '#ff8fb4', '#c93f6e', '#ffc2d6', { grow: 1.2 });
    }
    if (spId === 'iguana') for (let i = 0; i < 8; i++) G.R(g, cx - 38 + i * 10, top - 7 - (i % 2) * 4, 5, 10, C2);
    if (spId === 'salamander' || spId === 'newt') for (let i = 0; i < 6; i++) G.fe(g, cx - 34 + i * 14, top + 4, 5.5, 4.6, BEL);

    const sk = G.skull(g, cx, top, W, H, C, C2, LIT, { flat: isFrog ? 0.34 : isCroc ? 0.18 : 0.05 });
    G.scales(g, cx - W * 0.3, top + 12, W * 0.6, H - 26, DK, 5, 11);
    if (spId === 'toad') G.speckle(g, cx - W * 0.36, top + 8, W * 0.72, H - 20, DK, 0.1, 5);

    // hood/hat sits behind the eyes
    const headBox = { cx, top, w: W, h: H };
    if (of.hat === 'hood') drawHat(g, 'hood', headBox, of, t);

    // brow ridge, contoured
    const browY = top + Math.round(H * 0.24);
    const bhw = sk.halfAt(0.28);
    for (let i = 0; i < 5; i++) {
      const inset = Math.round(Math.pow(i / 4, 1.6) * 4);
      G.R(g, cx - bhw + 2 + inset, browY + i, (bhw - 2 - inset) * 2, 1,
        i === 0 ? G.shade(DK, 0.34) : i === 4 ? G.shade(DK, -0.4) : DK);
    }

    // ---- big eyes ----
    const ey = top + Math.round(H * 0.42);
    const esp = Math.round(sk.halfAt(0.42) * 0.62);
    const eyeR = mood === 'agony' ? 11 : 9.5;
    const closed = mood === 'out' || (mood === 'relief' && Math.sin(t * 2) > -0.4) ||
                   (mood !== 'agony' && Math.sin(t * 1.2 + 1) > 0.982);
    const brow = mood === 'agony' ? 1.15 : mood === 'worry' ? -0.85 : mood === 'relief' ? -0.2 : 0;
    const irisCol = { bullfrog: '#c9a227', toad: '#b0762a', treefrog: '#d9b12a', axolotl: '#3a3a4a',
      newt: '#e8722a', gecko: '#2f8aa0', iguana: '#c9a227', gator: '#3a7a4a', turtle: '#8a6a2a',
      salamander: '#c0392b', viper: '#c9a227', python: '#c9a227' }[spId] || '#3a7a8c';
    for (const s of [-1, 1]) {
      const ex = cx + s * esp;
      if (isFrog) G.dome(g, ex, ey - 3, eyeR + 3, C, { squash: 1.04, spec: false });
      G.eye(g, ex, ey - (isFrog ? 3 : 0), eyeR, {
        iris: irisCol, skin: C, closed, brow,
        lookX: mood === 'agony' ? 0 : Math.sin(t * 0.7) * 0.3,
        lookY: mood === 'agony' ? -0.35 : 0.1,
        lid: mood === 'out' ? 0.6 : mood === 'agony' ? 0.06 : 0.22,
        wide: mood === 'agony',
      });
      if (mood === 'agony' && !closed) {
        G.R(g, ex - s * 8, ey - 6, 4, 1, P.blood);
        G.R(g, ex - s * 9, ey - 4, 3, 1, P.blood);
      }
    }
    if (of.hat === 'glasses') drawGlasses(g, cx - esp, cx + esp, ey, eyeR, of.hc);

    if (o.sweat) for (let i = 0; i < 3; i++) {
      const sy = top + 6 + ((t * 26 + i * 22) % 36);
      G.fe(g, cx - 30 + i * 30, sy, 2, 3.4, '#a9d8ff');
      G.R(g, cx - 31 + i * 30, sy - 1, 1, 1, '#fff');
    }

    // ---- muzzle ----
    const mTop = top + H - 6;
    const mH = isCroc ? 26 : isFrog ? 16 : 21;
    const mW = Math.round(sk.halfAt(0.9) * 2.05);
    const rows = [];
    for (let j = 0; j < mH; j++) {
      const p = j / (mH - 1);
      rows.push(Math.max(6, Math.round(mW * 0.5 * (1 - Math.pow(p, 1.8) * (isCroc ? 0.14 : 0.24)))));
    }
    for (let j = 0; j < mH; j++) G.R(g, cx - rows[j] - 2, mTop + j, rows[j] * 2 + 4, 1, OUT);
    G.R(g, cx - rows[mH - 1] - 2, mTop + mH, rows[mH - 1] * 2 + 4, 2, OUT);
    for (let j = 0; j < mH; j++) {
      const p = j / (mH - 1);
      G.R(g, cx - rows[j], mTop + j, rows[j] * 2 + 1, 1, G.mix(G.shade(C, 0.06), C2, p * 0.8));
      G.R(g, cx + rows[j] - 1, mTop + j, 2, 1, LIT);
      G.R(g, cx - rows[j], mTop + j, 1, 1, G.shade(DK, -0.2));
    }
    G.R(g, cx - rows[2] + 4, mTop + 3, 4, 4, OUT);
    G.R(g, cx + rows[2] - 8, mTop + 3, 4, 4, OUT);
    G.R(g, cx - 1, mTop + 2, 2, Math.round(mH * 0.4), G.shade(C2, -0.18));
    G.fe(g, cx - mW * 0.6, mTop + mH * 0.5, 5, 8, G.shade(DK, -0.2));
    G.fe(g, cx + mW * 0.6, mTop + mH * 0.5, 5, 8, G.shade(DK, -0.2));

    if ((o.mouth || 0) < 0.08) {
      const jy = mTop + mH - 4;
      G.R(g, cx - rows[mH - 3] + 2, jy, rows[mH - 3] * 2 - 4, 2, OUT);
      if (mood !== 'out') fangs(g, cx - rows[mH - 3] + 5, jy, rows[mH - 3] * 2 - 10, 5, true, P.boneDk);
    }
    if (of.hat !== 'hood' && of.hat !== 'glasses') drawHat(g, of.hat, headBox, of, t);
    return { mouthX: cx, mouthY: mTop + mH - 4, skullTop: top, w: W, h: H };
  };

  // ============================================================
  // FIRST-PERSON CROCODILE ARMS
  // A solid tapered limb from off-screen up to a clawed hand at
  // (tipX,tipY). side: -1 left, +1 right.
  // ============================================================
  G.drawArm = function (g, tipX, tipY, side, o) {
    o = o || {};
    const C = o.col || '#4c7a42', C2 = G.shade(C, -0.44), LIT = G.shade(C, 0.32);
    tipX = Math.round(tipX); tipY = Math.round(tipY);
    // The forearm enters from just off the bottom edge, close under the hand,
    // so it reads as foreshortened rather than sprawling across the screen.
    const reach = o.reach === undefined ? 26 : o.reach;
    const ax = o.anchorX !== undefined ? o.anchorX : tipX + side * reach;
    const ay = o.anchorY !== undefined ? o.anchorY : G.H + 16;
    // elbow bows outward so the arm reads as a real limb, not a stick
    const ex = G.lerp(ax, tipX, 0.5) + side * 9;
    const ey = G.lerp(ay, tipY, 0.55);
    const spine = [];
    const N = 22;
    for (let i = 0; i <= N; i++) {
      const p = i / N;
      // quadratic bezier anchor -> elbow -> tip
      const q = 1 - p;
      const px = q * q * ax + 2 * q * p * ex + p * p * tipX;
      const py = q * q * ay + 2 * q * p * ey + p * p * tipY;
      spine.push({ x: px, y: py, r: G.lerp(o.thick || 33, 15, Math.pow(p, 0.7)) });
    }
    G.limb(g, spine, C, G.shade(C2, 0.1), LIT, { grow: 2, scale: C2 });
    // crosswise belly scutes (banded, not a row of snake dots)
    for (let i = 3; i < N - 2; i += 3) {
      const s = spine[i], nx = spine[i + 1];
      const ang = Math.atan2(nx.y - s.y, nx.x - s.x) + Math.PI / 2;
      const bw = s.r * 0.74;
      for (let k = -1; k <= 1; k += 0.5) {
        G.R(g, s.x + Math.cos(ang) * bw * k - side * s.r * 0.18,
               s.y + Math.sin(ang) * bw * k, 2, 2, G.shade('#b9c184', -0.14 - Math.abs(k) * 0.14));
      }
    }
    // hard rim light down the outer edge of the whole limb
    for (const s of spine) G.fe(g, s.x + side * s.r * 0.68, s.y, s.r * 0.24, s.r * 0.5, LIT);
    // rubber glove cuff
    const cuffI = Math.round(N * 0.76), cf = spine[cuffI];
    G.fe(g, cf.x, cf.y, cf.r + 3, cf.r * 0.62 + 3, OUT);
    G.fe(g, cf.x, cf.y, cf.r + 2, cf.r * 0.62 + 2, o.cuff || '#1f3b34');
    G.fe(g, cf.x, cf.y - 1.5, cf.r + 1, cf.r * 0.3, G.shade(o.cuff || '#1f3b34', 0.4));
    G.R(g, cf.x - cf.r, cf.y + 1, cf.r * 2, 1, G.shade(o.cuff || '#1f3b34', -0.4));

    // ---- clawed hand ----
    const grip = o.grip === undefined ? 0.5 : o.grip;
    const pSp = [];
    for (let i = 0; i < 5; i++) pSp.push({ x: tipX - side * i * 1.9, y: tipY + 5 + i * 1, r: 12 - i * 0.9 });
    G.limb(g, pSp, C, null, LIT, { grow: 1.6, scale: C2 });
    for (let f = 0; f < 3; f++) {
      const fa = (-0.85 + f * 0.7) * side + (o.angle || 0) - Math.PI / 2;
      const showClaw = f !== 1;                 // middle claw stays tucked
      const bend = 16 - grip * 5;
      const fSp = [];
      for (let k = 0; k < 4; k++) {
        fSp.push({ x: tipX + Math.cos(fa) * (bend * 0.33 * k), y: tipY + 4 + Math.sin(fa) * (bend * 0.33 * k), r: 5.2 - k * 0.7 });
      }
      G.limb(g, fSp, C, null, LIT, { grow: 1.2 });
      const tip = fSp[3];
      if (showClaw) {
        G.fe(g, tip.x + Math.cos(fa) * 3.2, tip.y + Math.sin(fa) * 3.2, 3, 3, OUT);
        G.fe(g, tip.x + Math.cos(fa) * 3.2, tip.y + Math.sin(fa) * 3.2, 1.9, 1.9, '#9d9078');
      }
    }
    // thumb wrapping the other way
    const thSp = [];
    for (let k = 0; k < 3; k++) thSp.push({ x: tipX + side * (10 + k * 3.2), y: tipY + 9 - k * 1.6, r: 5.4 - k * 0.75 });
    G.limb(g, thSp, C, null, LIT, { grow: 1.2 });
    G.fe(g, thSp[2].x + side * 3, thSp[2].y - 1, 3.2, 3, OUT);
    G.fe(g, thSp[2].x + side * 3, thSp[2].y - 1, 2.2, 2, '#c9bda0');
  };

  // ============================================================
  // THE PINT: a big rectangular tub, sliced into flavour layers,
  // with a live carved surface. surf[] = 0..1 depth per column.
  // ============================================================
  G.drawPint = function (g, x, y, w, h, layers, surf, o) {
    o = o || {};
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const nCols = surf ? surf.length : 1;
    const colW = w / nCols;

    // --- steel tub shell ---
    G.rr2(g, x - 5, y - 7, w + 10, h + 16, OUT);
    G.rr2(g, x - 4, y - 6, w + 8, h + 14, P.steel);
    G.gradV(g, x - 3, y + h - 2, w + 6, 12, P.steel2, G.shade(P.steel, -0.5), 5);
    G.R(g, x - 3, y + h + 8, w + 6, 2, G.shade(P.steel, -0.6));
    // inner well shadow
    G.R(g, x - 2, y - 4, w + 4, h + 4, '#0d1413');

    // --- layered ice cream, carved from the top ---
    const nl = layers.length;
    const layerH = h / nl;
    for (let c = 0; c < nCols; c++) {
      const cx = x + c * colW;
      const cw = Math.ceil(colW) + 1;
      const depth = G.clamp(surf ? surf[c] : 0, 0, 1);
      const topY = y + depth * h;
      // empty carved cavity above the surface
      if (depth > 0.003) {
        G.R(g, cx, y, cw, topY - y, '#101a19');
        G.R(g, cx, topY - 2, cw, 2, '#1c2b28');
      }
      // the remaining column of layers
      for (let l = 0; l < nl; l++) {
        const f = G.flavorById(layers[l]) || G.DATA.flavors[0];
        const ly0 = y + l * layerH, ly1 = ly0 + layerH;
        const drawY0 = Math.max(ly0, topY);
        if (drawY0 >= ly1) continue;
        G.R(g, cx, drawY0, cw, ly1 - drawY0, f.col);
        // internal shading: darker with depth, plus a lit carve rim
        G.R(g, cx, ly1 - 2, cw, 2, G.shade(f.col, -0.3));
        if (drawY0 === topY) {
          G.R(g, cx, topY, cw, 1, G.shade(f.col, 0.45));      // carved surface highlight
          G.R(g, cx, topY + 1, cw, 1, G.shade(f.col, 0.16));
        }
        if (f.fleck && (c % 3 === 0)) {
          const fy = drawY0 + ((c * 7) % Math.max(1, Math.floor(ly1 - drawY0)));
          G.R(g, cx + 1, fy, 1, 1, f.fleck);
        }
      }
      // frost speckle on the untouched top skin
      if (depth < 0.02 && c % 2 === 0) G.R(g, cx, y, 1, 1, '#ffffff22');
    }
    // layer seams across the whole tub (dithered, reads as strata)
    for (let l = 1; l < nl; l++) {
      const ly = y + l * layerH;
      for (let c = 0; c < nCols; c++) {
        if ((surf ? surf[c] : 0) * h > l * layerH) continue;
        const cx = x + c * colW;
        G.dither(g, cx, ly - 1, Math.ceil(colW) + 1, 2, null, '#00000055', 0.6);
      }
    }
    // tub rim over the top
    G.R(g, x - 4, y - 6, w + 8, 4, P.steel2);
    G.R(g, x - 4, y - 6, w + 8, 1, P.chrome);
    G.R(g, x - 4, y - 3, w + 8, 2, G.shade(P.steel, -0.45));
    G.R(g, x - 2, y - 1, w + 4, 1, '#0d1413');

    // ---- FLAVOUR IDENTIFICATION ----
    // The name is printed straight onto the stratum it belongs to, so
    // there is never any doubt which band is which flavour - and no
    // side labels to collide with the neighbouring tub.
    if (o.legend !== false) {
      const nl2 = layers.length;
      const lh = h / nl2;
      for (let l = 0; l < nl2; l++) {
        const f = G.flavorById(layers[l]) || G.DATA.flavors[0];
        const ly = y + l * lh;
        if (lh < 11) continue;
        // is this band still there, or has it been dug away?
        let visible = 0;
        for (let c = 0; c < nCols; c++) if ((surf ? surf[c] : 0) * h <= (l + 0.55) * lh) visible++;
        if (visible < nCols * 0.25) continue;
        const short = f.name.split(' ')[0];
        const tw2 = G.tw(short);
        if (tw2 + 8 > w) continue;
        const tx = x + Math.round((w - tw2) / 2);
        const ty = Math.round(ly + lh / 2 - 3);
        // a legible plate the colour of the flavour, keyed light or dark
        const lum = parseInt(f.col.slice(1, 3), 16) * 0.3 + parseInt(f.col.slice(3, 5), 16) * 0.59 + parseInt(f.col.slice(5, 7), 16) * 0.11;
        const ink = lum > 140 ? G.shade(f.col, -0.75) : G.shade(f.col, 0.85);
        G.R(g, tx - 3, ty - 2, tw2 + 6, 11, lum > 140 ? '#00000030' : '#ffffff22');
        G.text(g, short, tx, ty, ink);
      }
    }
    if (o.locked) {
      g.globalAlpha = 0.72; G.R(g, x - 4, y - 6, w + 8, h + 14, '#060a09'); g.globalAlpha = 1;
      G.text(g, 'LOCKED', x + w / 2, y + h / 2 - 4, P.steel2, { align: 'center', out: OUT });
    }
  };

  // scoop ball with hard rim light + drip
  // A scoop is a lit dome with a churned crown, a soft melt lip and
  // a sheen - never a flat disc.
  G.drawScoopBall = function (g, cx, cy, r, flavor, squish) {
    const f = typeof flavor === 'string' ? G.flavorById(flavor) : flavor;
    if (!f) return;
    const sq = 1 + (squish || 0) * 1.2;
    const d = G.dome(g, cx, cy, r, f.col, { squash: sq, spec: false });
    const rx = d.rx, ry = d.ry;
    // churned swirl ridges following the curvature
    for (let i = -2; i <= 2; i++) {
      const yy = cy + i * (ry * 0.36);
      const tt = 1 - Math.pow((yy - cy) / ry, 2);
      if (tt <= 0) continue;
      const hw = rx * Math.sqrt(tt);
      const shade = i < 0 ? 0.2 : -0.14;
      G.R(g, cx - hw + 2, yy, hw * 2 - 4, 1, G.shade(f.col, shade));
      // little scoop nubs along the ridge
      for (let k = -2; k <= 2; k++) {
        const nx = cx + k * (hw * 0.36);
        if (Math.abs(nx - cx) > hw - 3) continue;
        G.R(g, nx, yy - 1, 2, 1, G.shade(f.col, i < 0 ? 0.36 : 0.06));
      }
    }
    // melt lip at the bottom, slightly darker and wetter
    G.fe(g, cx, cy + ry - 1.5, rx * 0.78, 2, G.shade(f.col, -0.4));
    G.fe(g, cx, cy + ry - 2.5, rx * 0.6, 1.4, G.shade(f.col, -0.24));
    // hard sheen
    G.R(g, Math.round(cx - rx * 0.44), Math.round(cy - ry * 0.56), 3, 2, G.shade(f.col, 0.7));
    G.R(g, Math.round(cx - rx * 0.5), Math.round(cy - ry * 0.4), 2, 1, '#ffffff');
    // flecks embedded, following the sphere
    if (f.fleck) for (let i = 0; i < Math.max(5, r * 0.9); i++) {
      const ang = (i * 2.399) % 6.283, rr = ((i * 37) % 100) / 100 * 0.72;
      G.R(g, cx + Math.cos(ang) * rx * rr, cy + Math.sin(ang) * ry * rr, 1, 1,
        G.shade(f.fleck, Math.sin(ang) < 0 ? 0.2 : -0.2));
    }
  };

  // cone / cup, tip or base at (x, baseY)
  G.drawBase = function (g, kind, x, baseY) {
    if (kind === 'cone') {
      const h = 34, w2 = 14;
      for (let i = 0; i <= h; i++) {
        const w = Math.max(1, Math.round(w2 * i / h));
        const c = G.mix('#7a4a1c', '#d99a44', i / h);
        G.R(g, x - w, baseY - i, w * 2, 1, c);
      }
      G.R(g, x - 1, baseY - 3, 1, 3, '#5c3512');
      // waffle lattice
      for (let yy = 3; yy < h - 1; yy += 4) {
        const w = Math.round(w2 * yy / h);
        for (let xx = -w + 1; xx < w - 1; xx += 4) {
          G.R(g, x + xx + (yy / 4 % 2 ? 2 : 0), baseY - yy, 2, 1, '#5c3512');
        }
        G.R(g, x - w + 1, baseY - yy, w * 2 - 2, 1, '#00000030');
      }
      G.R(g, x - w2 - 1, baseY - h - 2, w2 * 2 + 2, 3, OUT);
      G.R(g, x - w2, baseY - h - 1, w2 * 2, 2, '#e8b060');
      G.R(g, x - w2, baseY - h - 1, w2 * 2, 1, '#f7d79a');
    } else {
      G.rr(g, x - 15, baseY - 22, 30, 22, OUT);
      G.rr(g, x - 14, baseY - 21, 28, 20, '#25333a');
      G.gradV(g, x - 13, baseY - 20, 26, 18, '#3b5460', '#16232a', 5);
      G.R(g, x - 12, baseY - 20, 3, 17, '#6e93a3');
      G.R(g, x - 16, baseY - 25, 32, 4, OUT);
      G.R(g, x - 15, baseY - 24, 30, 2, P.steel2);
      G.R(g, x - 15, baseY - 24, 30, 1, P.chrome);
      G.text(g, 'DL', x, baseY - 14, '#7fa0ae', { align: 'center' });
    }
  };

  // tiny order icon for bubbles / notebooks
  G.drawOrderIcon = function (g, order, x, y) {
    if (order.base === 'cone') {
      for (let i = 0; i <= 10; i++) {
        const w = Math.max(1, Math.round(4 * i / 10));
        G.R(g, x - w, y - i, w * 2, 1, G.mix('#7a4a1c', '#d99a44', i / 10));
      }
    } else {
      G.R(g, x - 5, y - 8, 10, 8, '#2c3f48');
      G.R(g, x - 6, y - 9, 12, 2, P.steel2);
    }
    let sy = y - (order.base === 'cone' ? 13 : 11);
    for (let i = 0; i < order.scoops.length; i++) {
      const f = G.flavorById(order.scoops[i]);
      if (!f) continue;
      G.fc(g, x, sy, 4.5, OUT); G.fc(g, x, sy, 4, f.col);
      G.R(g, x - 2, sy - 2, 2, 1, G.shade(f.col, 0.4));
      sy -= 6;
    }
    const ty = y - (order.base === 'cone' ? 13 : 11) - (order.scoops.length - 1) * 6;
    if (order.sauce) {
      const s = G.sauceById(order.sauce);
      G.R(g, x - 4, ty - 4, 9, 2, s.col);
      G.R(g, x - 4, ty - 2, 1, 3, s.col); G.R(g, x + 2, ty - 2, 1, 4, s.col);
    }
    if (order.top) for (let i = 0; i < 4; i++)
      G.R(g, x - 4 + i * 3, ty - 6 - (i % 2) * 2, 2, 2, G.topBitCol(order.top));
  };

  // ============================================================
  // TEETH
  // th = {x,y,w,h,up}. Enamel with cusps, root shadow, gum line.
  // ============================================================
  G.drawEnamel = function (g, th, o) {
    o = o || {};
    const x = th.x, y = th.y, w = th.w, h = th.h;
    const base = o.dead ? '#918e7e' : P.bone;
    const mid  = o.dead ? '#6d6a5c' : P.boneDk;
    const dk   = o.dead ? '#494638' : P.boneShade;
    const up = th.up;
    // --- scanline profile: root narrow, body full, crown slightly belled ---
    const rows = [];
    for (let j = 0; j < h; j++) {
      const p = up ? j / (h - 1) : 1 - j / (h - 1);   // p=0 at the root, 1 at the crown
      let k = 0.60 + 0.40 * Math.pow(p, 0.55);
      if (p > 0.86) k -= (p - 0.86) * 1.5;            // biting edge tucks in
      if (p < 0.08) k *= 0.72 + p * 3.4;              // root tapers into the gum
      rows.push(Math.max(3, Math.round(w * 0.5 * k)));
    }
    // outline
    for (let j = 0; j < h; j++) G.R(g, x + w / 2 - rows[j] - 2, y + j, rows[j] * 2 + 4, 1, OUT);
    // fill with a strong ramp: bright crown, shadowed neck
    for (let j = 0; j < h; j++) {
      const p = up ? j / (h - 1) : 1 - j / (h - 1);
      const c = p > 0.5 ? G.mix(mid, G.shade(base, 0.12), Math.pow((p - 0.5) / 0.5, 0.7))
                        : G.mix(G.shade(dk, -0.34), mid, Math.pow(p / 0.5, 1.3));
      const hw = rows[j];
      G.R(g, x + w / 2 - hw, y + j, hw * 2 + 1, 1, c);
      G.R(g, x + w / 2 + hw - 2, y + j, 2, 1, G.shade(c, -0.3));       // far-side turn
      G.R(g, x + w / 2 - hw, y + j, 1, 1, G.shade(dk, -0.35));         // core shadow
    }
    // vertical developmental grooves - irregular, not a printed grid
    for (let i = 0; i < 3; i++) {
      const gx = x + w / 2 + Math.round((i - 1) * w * 0.24) + ((th.i || 0) % 2 ? 1 : -1);
      const gy0 = up ? y + Math.round(h * 0.3) : y + Math.round(h * 0.12);
      const gh = Math.round(h * 0.5);
      g.globalAlpha = 0.5;
      G.R(g, gx, gy0, 1, gh, G.shade(mid, -0.22));
      g.globalAlpha = 1;
    }
    // hard specular band down the near edge
    const spx = x + w / 2 - Math.round(w * 0.28);
    G.R(g, spx, y + Math.round(h * (up ? 0.22 : 0.16)), 3, Math.round(h * 0.6), G.shade(base, 0.4));
    G.R(g, spx, y + Math.round(h * (up ? 0.22 : 0.16)), 2, Math.round(h * 0.2), '#ffffff');
    // --- occlusal surface: real cusps on the biting edge ---
    const edgeY = up ? y + h - 1 : y;
    const nc = w >= 50 ? 4 : w >= 40 ? 3 : 2;
    const hwE = rows[up ? h - 1 : 0];
    for (let c = 0; c < nc; c++) {
      const cw = (hwE * 2) / nc;
      const cxp = x + w / 2 - hwE + cw * c;
      const bump = 3 + ((c + (th.i || 0)) % 2) * 2;
      for (let b = 0; b < bump; b++) {
        const inset = Math.round(Math.pow(b / bump, 1.5) * cw * 0.22);
        G.R(g, cxp + inset, up ? edgeY - b : edgeY + b, Math.max(1, cw - inset * 2), 1,
          b === 0 ? G.shade(base, 0.3) : G.shade(mid, -0.1));
      }
      // fissure between cusps
      if (c > 0) G.R(g, cxp, up ? edgeY - 5 : edgeY, 1, 5, G.shade(dk, -0.3));
    }
    // wet highlight along the very edge
    G.R(g, x + w / 2 - hwE + 2, up ? edgeY - bumpTop(nc) : edgeY, hwE * 2 - 4, 1, G.shade(base, 0.5));
    function bumpTop(n) { return 5; }
    // grime settled in the fissures and at the gum margin
    if (o.stain) {
      G.speckle(g, x + w / 2 - hwE + 2, up ? edgeY - 7 : edgeY + 1, hwE * 2 - 4, 7, '#6b5a2a', 0.2, (th.i || 1) * 3);
      const ry = up ? y + 2 : y + h - 8;
      G.speckle(g, x + w / 2 - rows[up ? 0 : h - 1], ry, rows[up ? 0 : h - 1] * 2, 6, '#7a6438', 0.16, th.i || 2);
    }
  };

  // symptom overlays. s = symptom instance {lx,ly,r,...}
  G.drawSymptom = function (g, kind, th, s, t) {
    const px = th.x + s.lx, py = th.y + s.ly;
    switch (kind) {
      case 'caries': {
        const r = s.r * (s.stage === 'drilled' ? 1.15 : 1);
        if (s.stage === 'drilled') {
          G.fc(g, px, py, r + 1, OUT);
          G.fc(g, px, py, r, '#3a2c22');
          G.fc(g, px, py - 1, r * 0.6, '#1a120e');
          G.R(g, px - r, py - r + 1, 2, 2, G.shade(P.bone, -0.1));
        } else {
          G.fc(g, px, py, r + 1.6, G.shade('#6b5a2a', -0.2));   // demineralised halo
          G.fc(g, px, py, r, P.rot);
          G.fc(g, px + 0.5, py + 0.5, r * 0.62, '#0a0705');
          // ragged edge
          for (let i = 0; i < 7; i++) {
            const a = i * 0.9 + t * 0.05;
            G.R(g, px + Math.cos(a) * (r + 1), py + Math.sin(a) * (r + 1), 1, 1, P.rot);
          }
        }
        if (s.fill > 0) {
          const fr = r - 1, rows = Math.round(fr * 2 * G.clamp(s.fill, 0, 1));
          for (let d = 0; d < rows; d++) {
            const yy = py + fr - d;
            const ww = Math.floor(Math.sqrt(Math.max(0, fr * fr - (yy - py) * (yy - py))));
            G.R(g, px - ww, yy, ww * 2 + 1, 1, G.mix('#9aa8ae', '#dfeaef', d / Math.max(1, rows)));
          }
          if (s.fill >= 1) { G.R(g, px - 2, py - 2, 2, 1, '#ffffff'); }
        }
        break;
      }
      case 'tartar': {
        for (const b of s.blobs) {
          if (b.gone) continue;
          G.fe(g, th.x + b.x, th.y + b.y, b.r + 0.6, b.r * 0.8 + 0.6, '#6f761b');
          G.fe(g, th.x + b.x, th.y + b.y, b.r, b.r * 0.8, P.plaque);
          G.fe(g, th.x + b.x - b.r * 0.3, th.y + b.y - b.r * 0.3, b.r * 0.4, b.r * 0.3, P.plaqueLt);
          G.speckle(g, th.x + b.x - b.r, th.y + b.y - b.r, b.r * 2, b.r * 1.6, '#8a9126', 0.3, b.x);
        }
        break;
      }
      case 'fracture': {
        // jagged split with a dark interior
        let cxp = px, cyp = th.up ? th.y + 2 : th.y + th.h - 2;
        const dir = th.up ? 1 : -1;
        for (let i = 0; i < s.pts.length; i++) {
          const p = s.pts[i];
          G.line(g, cxp, cyp, th.x + p.x, th.y + p.y, s.bonded ? '#c9d3d8' : '#120d0a', s.bonded ? 2 : 2);
          if (!s.bonded && i % 2 === 0) G.R(g, th.x + p.x - 1, th.y + p.y, 1, 1, '#3a2c22');
          cxp = th.x + p.x; cyp = th.y + p.y;
        }
        if (s.bonded) { G.R(g, px - 1, py - 4, 2, 2, '#ffffff'); }
        else if (Math.sin(t * 3) > 0.6) G.R(g, px, cyp - 2 * dir, 1, 2, P.bloodLit);
        break;
      }
      case 'abscess': {
        if (s.lanced) {
          G.fe(g, px, py, s.r * 0.8, s.r * 0.6, '#5c1226');
          G.fe(g, px, py - 1, s.r * 0.5, s.r * 0.3, '#2a0812');
          break;
        }
        const pulse = 1 + Math.sin(t * 3.4) * 0.09;
        G.fe(g, px, py, s.r * pulse + 1.5, s.r * 0.86 * pulse + 1.5, P.gumDk);
        G.fe(g, px, py, s.r * pulse, s.r * 0.86 * pulse, P.gumLit);
        G.fe(g, px - s.r * 0.25, py - s.r * 0.3, s.r * 0.45, s.r * 0.3, '#e8788c');
        // pus head
        G.fc(g, px + s.r * 0.15, py - s.r * 0.1, s.r * 0.4 * pulse, P.pus);
        G.fc(g, px + s.r * 0.05, py - s.r * 0.2, s.r * 0.2, '#f6f2a8');
        // taut skin veins
        for (let i = 0; i < 4; i++) {
          const a = i * 1.6 + 0.4;
          G.line(g, px + Math.cos(a) * s.r * 0.7, py + Math.sin(a) * s.r * 0.6,
                    px + Math.cos(a) * (s.r + 3), py + Math.sin(a) * (s.r + 2), '#7d1024');
        }
        break;
      }
      case 'impacted': break;   // the tooth itself is drawn tilted by night.js
      case 'necrosis': {
        // dark core bleeding through translucent enamel
        G.fe(g, px, py, s.r * 0.78 + 1.5, s.r * 1.05 + 1.5, '#4a4438');
        G.fe(g, px, py, s.r * 0.7, s.r, '#26221a');
        G.speckle(g, px - s.r * 0.7, py - s.r, s.r * 1.4, s.r * 2, '#0d0b08', 0.32, 3);
        if (s.opened) { G.fc(g, px, py, s.r * 0.7, '#120d0a'); G.R(g, px - 1, py - s.r, 2, s.r * 2, '#2a1410'); }
        if (s.fill > 0) {
          const rows = Math.round(s.r * 2 * s.fill);
          for (let d = 0; d < rows; d++) G.R(g, px - s.r * 0.6, py + s.r - d, s.r * 1.2, 1, '#c9d3d8');
        }
        break;
      }
      case 'foreign': {
        if (s.pulled) break;
        const wob = s.grabbed ? Math.sin(t * 30) * 1.2 : 0;
        const bx = px + wob, by2 = py;
        G.R(g, bx - 1, by2 - 1, s.w + 2, s.h + 2, OUT);
        G.R(g, bx, by2, s.w, s.h, s.col);
        G.R(g, bx, by2, Math.max(1, s.w - 1), 1, G.shade(s.col, 0.4));
        // pressure blood at the margin
        G.R(g, bx - 1, by2 + s.h, s.w + 2, 1, P.bloodDk);
        break;
      }
      case 'gingiva': {
        // puffy weeping gum band
        const gy = th.up ? th.y + th.h - 2 : th.y - 4;
        G.fe(g, th.x + th.w / 2, gy + (th.up ? 3 : 2), th.w * 0.55, 5, P.gumLit);
        G.fe(g, th.x + th.w / 2, gy + (th.up ? 2 : 1), th.w * 0.5, 3.5, '#e0546a');
        G.speckle(g, th.x + 2, gy - 1, th.w - 4, 6, P.blood, 0.22, th.i || 2);
        if (!s.cleaned && Math.sin(t * 1.7 + th.x) > 0.5) {
          G.addOoze(th.x + th.w / 2 + G.rand(-6, 6), gy + 2, P.blood, G.rand(4, 12));
        }
        break;
      }
    }
  };

  // ============================================================
  // TOOLS - drawn as held instruments, tip at (x,y)
  // ============================================================
  G.drawTool = function (g, id, x, y, o) {
    o = o || {};
    const ang = o.ang || 0;
    const st = P.steel2, stD = P.steel, ch = P.chrome;
    function shaft(len, w, col) {
      for (let i = 0; i < len; i++) {
        const px = x - Math.sin(ang) * -i, py = y - i;
        G.R(g, px - w / 2 - 1, py, w + 2, 1, OUT);
        G.R(g, px - w / 2, py, w, 1, i % 7 < 4 ? (col || st) : stD);
        G.R(g, px - w / 2, py, 1, 1, ch);
      }
    }
    switch (id) {
      case 'probe':
        shaft(26, 4);
        G.R(g, x - 1, y - 4, 2, 5, OUT); G.R(g, x, y - 4, 1, 4, ch);
        G.R(g, x - 2, y + 1, 1, 1, ch);
        break;
      case 'scale':
        shaft(24, 5);
        G.R(g, x - 2, y - 6, 4, 7, OUT); G.R(g, x - 1, y - 6, 2, 6, ch);
        G.R(g, x - 3, y - 1, 4, 2, OUT); G.R(g, x - 3, y - 1, 3, 1, ch);
        break;
      case 'drill': {
        const spin = o.active ? Math.floor((o.t || 0) * 40) % 3 : 0;
        shaft(30, 7, '#7fa3b5');
        G.R(g, x - 4, y - 12, 8, 6, OUT); G.R(g, x - 3, y - 11, 6, 4, '#8fb8d8');
        G.R(g, x - 3, y - 11, 6, 1, ch);
        G.R(g, x - 2, y - 7, 4, 5, OUT); G.R(g, x - 1, y - 7, 2, 5, st);
        // burr head
        G.fc(g, x, y, 2.6, OUT); G.fc(g, x, y, 2, spin === 0 ? ch : (spin === 1 ? st : '#e8f4fa'));
        if (o.active) { G.R(g, x - 3, y - 1, 1, 1, '#fff'); G.R(g, x + 2, y + 1, 1, 1, '#fff'); }
        break;
      }
      case 'fill':
        shaft(26, 5, '#d8d2c0');
        G.R(g, x - 3, y - 7, 6, 8, OUT); G.R(g, x - 2, y - 7, 4, 7, '#e8e2d0');
        G.R(g, x - 1, y - 1, 2, 3, OUT); G.R(g, x - 1, y - 1, 1, 2, ch);
        break;
      case 'forceps':
      case 'extract': {
        const open = o.grip ? 1 : 3;
        for (let s = -1; s <= 1; s += 2) {
          for (let i = 0; i < 22; i++) {
            const px = x + s * (open + i * 0.32), py = y - i;
            G.R(g, px - 1, py, 3, 1, OUT); G.R(g, px, py, 2, 1, i % 5 < 3 ? st : stD);
          }
          G.R(g, x + s * open - 1, y - 3, 3, 5, OUT);
          G.R(g, x + s * open - 1, y - 3, 2, 4, ch);
        }
        break;
      }
      case 'lance':
        shaft(24, 4, '#c9d6dc');
        G.R(g, x - 2, y - 7, 4, 8, OUT);
        G.R(g, x - 1, y - 7, 2, 7, '#eef7fb');
        G.R(g, x - 1, y - 7, 1, 5, '#ffffff');
        G.R(g, x, y - 1, 1, 2, '#ffffff');
        break;
      case 'suction': {
        for (let i = 0; i < 28; i++) {
          const px = x + Math.sin(i * 0.28) * 3, py = y - i;
          G.R(g, px - 3, py, 7, 1, OUT);
          G.R(g, px - 2, py, 5, 1, i % 4 < 2 ? '#2b6b78' : '#1d4b55');
        }
        G.R(g, x - 4, y - 5, 8, 6, OUT);
        G.R(g, x - 3, y - 5, 6, 5, '#3fa3b5');
        G.R(g, x - 3, y - 5, 6, 1, '#8fe0ef');
        G.R(g, x - 2, y, 4, 2, '#0d1a1d');
        break;
      }
    }
  };

  // ============================================================
  // PROPS
  // ============================================================
  G.drawBottle = function (g, x, y, sauce, held) {
    const c = sauce.col, lit = G.shade(c, 0.35);
    const yy = held ? y - 26 : y - 26;
    G.rr2(g, x - 8, yy, 16, 26, OUT);
    G.rr2(g, x - 7, yy + 1, 14, 24, G.shade(c, -0.45));
    G.rr2(g, x - 6, yy + 2, 12, 22, c);
    G.R(g, x - 5, yy + 3, 2, 18, lit);
    G.R(g, x + 4, yy + 4, 1, 16, G.shade(c, 0.15));
    G.R(g, x - 7, yy + 10, 14, 6, '#e8e2d0');
    G.R(g, x - 5, yy + 11, 10, 4, c);
    G.R(g, x - 4, yy + 12, 3, 2, '#0d1413');
    if (held) {   // nozzle down
      G.R(g, x - 3, y - 1, 6, 4, OUT); G.R(g, x - 2, y - 1, 4, 3, G.shade(c, -0.2));
      G.R(g, x - 1, y + 2, 2, 3, OUT);
    } else {
      G.R(g, x - 3, yy - 4, 6, 5, OUT); G.R(g, x - 2, yy - 4, 4, 4, G.shade(c, -0.2));
      G.R(g, x - 1, yy - 7, 2, 4, P.steel);
    }
  };

  G.drawJar = function (g, x, y, top, held) {
    const yy = y - 26;
    G.rr2(g, x - 9, yy, 18, 26, OUT);
    G.rr2(g, x - 8, yy + 1, 16, 24, '#1b2c33');
    G.gradV(g, x - 7, yy + 2, 14, 22, '#2f4a54', '#16242a', 4);
    // contents
    for (let i = 0; i < 22; i++) {
      const bx = x - 6 + ((i * 5) % 12), by = yy + 8 + Math.floor(i / 4) * 3;
      G.R(g, bx, by, 2, 2, top.multi ? G.MULTI_COLS[top.id][i % G.MULTI_COLS[top.id].length] : top.col);
    }
    G.R(g, x - 7, yy + 3, 2, 18, '#7fb0c0');   // glass shine
    G.R(g, x - 9, yy - 5, 18, 6, OUT);
    G.R(g, x - 8, yy - 4, 16, 4, P.steel);
    G.R(g, x - 8, yy - 4, 16, 1, P.chrome);
    if (held) { G.R(g, x - 6, y + 1, 12, 1, OUT); for (let i = 0; i < 4; i++) G.R(g, x - 5 + i * 3, y, 1, 1, '#0d1413'); }
  };

  G.drawToothIcon = function (g, x, y, col) {
    col = col || P.bone;
    G.rr(g, x, y, 9, 8, col);
    G.R(g, x, y + 7, 4, 4, col); G.R(g, x + 5, y + 7, 4, 4, col);
    G.R(g, x + 1, y + 1, 3, 3, G.shade(col, 0.3));
    G.R(g, x + 1, y + 6, 7, 1, G.shade(col, -0.25));
  };

  // grimy neon sign, letters lit by a flickering tube
  G.drawNeon = function (g, x, y, str, col, t, sc) {
    sc = sc || 2;
    const flick = (Math.sin(t * 13) > 0.93 || Math.sin(t * 4.1) > 0.985) ? 0.35 : 1;
    const w = G.tw(str, sc);
    g.globalAlpha = 0.20 * flick;
    for (let r = 5; r > 0; r--) G.text(g, str, x, y + (r % 2), G.shade(col, -0.1), { align: 'center', sc });
    g.globalAlpha = 1;
    G.text(g, str, x, y, flick > 0.5 ? col : G.shade(col, -0.55), { align: 'center', sc, out: OUT });
    if (flick > 0.5) G.text(g, str, x, y - 1, G.shade(col, 0.55), { align: 'center', sc });
    return w;
  };

  // clawed cursor
  G.drawCursor = function (g, x, y) {
    G.R(g, x - 1, y - 1, 4, 12, OUT);
    G.R(g, x, y, 2, 9, '#4f7a48');
    G.R(g, x, y, 1, 7, '#7fb06a');
    G.R(g, x, y + 9, 2, 3, P.bone);
    G.R(g, x + 3, y + 3, 3, 8, OUT);
    G.R(g, x + 4, y + 4, 1, 6, '#4f7a48');
    G.R(g, x + 4, y + 10, 1, 2, P.bone);
  };
})();

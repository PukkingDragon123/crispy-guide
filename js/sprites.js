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
    const gw = opts.grow || 1.5;
    for (const s of spine) G.fe(g, s.x, s.y, s.r + gw, s.r + gw, OUT);
    for (const s of spine) G.fe(g, s.x, s.y, s.r, s.r, col);
    if (colDark) for (const s of spine) G.fe(g, s.x, s.y + s.r * 0.42, s.r * 0.72, s.r * 0.4, colDark);
    if (colLit) for (const s of spine) G.fe(g, s.x - s.r * 0.28, s.y - s.r * 0.36, s.r * 0.44, s.r * 0.3, colLit);
    if (opts.bands) {
      for (let i = 0; i < spine.length; i += opts.bandEvery || 5) {
        const s = spine[i];
        G.fe(g, s.x, s.y, s.r * 0.95, s.r * 0.95, opts.bands);
      }
    }
    if (opts.scale) for (let i = 0; i < spine.length; i += 2) {
      const s = spine[i];
      G.scales(g, s.x - s.r * 0.8, s.y - s.r * 0.8, s.r * 1.6, s.r * 1.4, opts.scale, 3, i);
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
      if (p < 0.34) k *= 0.58 + Math.pow(p / 0.34, 0.8) * 0.42;
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
    for (let i = 0; i < len; i++) {
      const p = i / len;
      const hh = Math.max(2, Math.round(hgt * (1 - p * 0.42)));
      const x = bx + dir * i;
      G.R(g, x - 1, by - 1, 3, hh + 2, OUT);
    }
    for (let i = 0; i < len; i++) {
      const p = i / len;
      const hh = Math.max(2, Math.round(hgt * (1 - p * 0.42)));
      const x = bx + dir * i;
      G.R(g, x, by, 1, hh, G.mix(col, colDark, p * 0.5));
      G.R(g, x, by, 1, 1, colLit);
      G.R(g, x, by + hh - 1, 1, 1, G.shade(colDark, -0.25));
    }
    return { tipX: bx + dir * len, tipY: by };
  };

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
  // WALKING CUSTOMER  (feet baseline at x,y; faces LEFT)
  // o: {walk, mood:'idle'|'angry'|'happy'|'sick', t}
  // ~52px tall. Hunched spine, long tapered snout, clawed feet.
  // ============================================================
  G.drawCust = function (g, spId, x, y, t, o) {
    o = o || {};
    x = Math.round(x); y = Math.round(y);
    const a = G.animalById(spId);
    const C = a.col, C2 = a.col2, BEL = a.belly;
    const LIT = G.shade(C, 0.34), DK = G.shade(C2, -0.3);
    const walk = o.walk;
    const gait = walk ? Math.sin(t * 8) : 0;
    const bob = walk ? Math.abs(Math.sin(t * 8)) * 2 : Math.sin(t * 1.8) * 0.8;
    const by = Math.round(y - bob);

    g.globalAlpha = 0.42; G.fe(g, x, y + 1, 16, 3, '#000'); g.globalAlpha = 1;
    if (spId === 'viper' || spId === 'python') { drawSerpent(g, a, x, y, t, o); return; }

    const isFrog = spId === 'bullfrog' || spId === 'toad' || spId === 'treefrog';
    const longTail = spId === 'gator' || spId === 'iguana' || spId === 'gecko' || spId === 'newt' || spId === 'salamander';

    // ---- tail (one solid two-pass limb) ----
    if (!isFrog) {
      const n = longTail ? 22 : 11;
      const sway = Math.sin(t * (walk ? 8 : 2.2)) * 3;
      const spine = [];
      for (let i = 0; i < n; i++) {
        const p = i / n;
        spine.push({
          x: x + 9 + i * (longTail ? 1.5 : 1),
          y: by - 22 + p * 12 + Math.sin(p * 2.6 + t * 3) * 2.5 + sway * p,
          r: Math.max(1.2, (1 - p) * 5),
        });
      }
      G.limb(g, spine, C, G.shade(C2, -0.15), LIT, { scale: DK, bands: spId === 'python' ? C2 : null });
      if (spId === 'iguana') for (let i = 2; i < n; i += 3)
        G.R(g, spine[i].x, spine[i].y - spine[i].r - 2, 1, 3, DK);
    }

    // ---- legs ----
    const legY = by - 13;
    const lp = walk ? gait * 3 : 0;
    function leg(lx, ph, back) {
      const kx = Math.round(lx + ph * 1.5);
      const len = 11 + Math.abs(ph);
      const col = back ? G.shade(C2, -0.18) : C2;
      G.R(g, kx - 3, legY, 6, len + 1, OUT);
      G.R(g, kx - 2, legY, 4, len, col);
      G.R(g, kx - 2, legY, 1, len - 2, G.shade(col, 0.3));
      const fy = legY + len;
      G.R(g, kx - 6, fy, 11, 4, OUT);
      G.R(g, kx - 5, fy, 9, 3, col);
      G.R(g, kx - 6, fy + 1, 2, 1, P.bone); G.R(g, kx - 3, fy + 2, 2, 1, P.bone); G.R(g, kx + 1, fy + 2, 2, 1, P.bone);
      if (isFrog) { G.R(g, kx - 8, fy + 1, 3, 2, OUT); G.R(g, kx - 8, fy + 1, 3, 1, col); }
    }
    leg(x + 6, -lp, true);
    leg(x - 3, lp, false);

    // ---- torso: hunched, tapered (two-pass) ----
    const tSpine = [];
    for (let i = 0; i < 12; i++) {
      const p = i / 11;
      tSpine.push({
        x: x - 1 + Math.sin(p * 1.5) * 3,
        y: by - 14 - p * 20,
        r: 11.5 - Math.pow(Math.abs(p - 0.42) * 2.1, 1.7) * 4.2,
      });
    }
    G.limb(g, tSpine, C, G.shade(C2, -0.1), LIT, { grow: 1.6 });
    // belly plates on the left/front flank
    for (let i = 1; i < 10; i++) {
      const s = tSpine[i];
      G.R(g, s.x - s.r + 1, s.y - 1, Math.max(2, s.r * 0.55), 2, i % 2 ? BEL : G.shade(BEL, -0.2));
    }
    // dorsal scales + spikes
    for (let i = 1; i < 11; i++) {
      const s = tSpine[i];
      G.scales(g, s.x, s.y - 3, s.r - 1, 6, DK, 3, i);
    }
    if (spId === 'iguana') for (let i = 2; i < 11; i += 2) {
      const s = tSpine[i];
      G.R(g, s.x + s.r - 2, s.y - 3, 2, 4, DK);
    }
    if (spId === 'toad') for (const s of tSpine) G.speckle(g, s.x - s.r, s.y - 3, s.r * 2, 6, DK, 0.15, 3);
    if (spId === 'turtle') {
      G.fe(g, x + 3, by - 26, 14, 13, OUT);
      G.fe(g, x + 3, by - 26, 13, 12, C2);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        const d = Math.abs(i) + Math.abs(j);
        if (d > 1 && Math.random() < 0) continue;
        G.R(g, x + 3 + i * 6 - 2, by - 26 + j * 5 - 2, 5, 4, d === 0 ? G.shade(C2, 0.34) : G.shade(C2, 0.12 - d * 0.06));
      }
    }
    if (spId === 'axolotl') for (let i = 0; i < 3; i++) {
      const gy = by - 46 + i * 4;
      const sp = [];
      for (let k = 0; k < 4; k++) sp.push({ x: x + 5 + k * 3.2, y: gy - k * (2.4 - i * 0.6), r: 2.4 - k * 0.45 });
      G.limb(g, sp, '#ff5f8f', '#c93f6e', '#ffa8c4', { grow: 1 });
    }

    // ---- arm ----
    const ap = walk ? -gait * 2.5 : 0;
    const aSp = [];
    for (let i = 0; i < 6; i++) aSp.push({ x: x - 9 - i * 0.6, y: by - 26 + ap + i * 2.2, r: 3.2 - i * 0.22 });
    G.limb(g, aSp, C, null, LIT, { grow: 1.2 });
    const hEnd = aSp[5];
    G.fe(g, hEnd.x - 1, hEnd.y + 3, 4, 3.4, OUT);
    G.fe(g, hEnd.x - 1, hEnd.y + 3, 3, 2.6, C2);
    G.R(g, hEnd.x - 3, hEnd.y + 5, 2, 1, P.bone); G.R(g, hEnd.x, hEnd.y + 5, 2, 1, P.bone);

    // ---- head ----
    drawHead(g, a, spId, x, by - 52, t, o, 20, 17);
  };

  // organic head builder. (x = body centre, hy = crown y)
  function drawHead(g, a, spId, x, hy, t, o, hw, hh) {
    const C = a.col, C2 = a.col2, BEL = a.belly;
    const LIT = G.shade(C, 0.34), DK = G.shade(C2, -0.3);
    const mood = o.mood || 'idle';
    const blink = Math.sin(t * 1.1 + x * 0.3) > 0.985;
    const isCroc = spId === 'gator' || spId === 'turtle';
    const isFrog = spId === 'bullfrog' || spId === 'toad' || spId === 'treefrog';
    const cx = x - 1;

    // crest/frills BEHIND the skull
    if (spId === 'gecko') { G.rr(g, cx - 2, hy - 3, hw - 2, 4, C2); }
    if (spId === 'salamander' || spId === 'newt')
      for (let i = 0; i < 4; i++) G.fc(g, cx - 5 + i * 5, hy - 2, 2.6, BEL);
    if (spId === 'iguana') for (let i = 0; i < 4; i++) G.R(g, cx + 2 + i * 3, hy - 4 - (i % 2) * 2, 2, 5, DK);

    const sk = G.skull(g, cx, hy, hw, hh, C, C2, LIT, { flat: isFrog ? 1 : (isCroc ? 0.6 : 0.2) });
    G.scales(g, cx - hw * 0.3, hy + 4, hw * 0.6, hh - 8, DK, 3, 7);

    // ---- snout, tapering LEFT ----
    const snoutY = hy + Math.round(hh * (isFrog ? 0.5 : 0.42));
    const snoutLen = isCroc ? 19 : isFrog ? 9 : 13;
    const snoutH = isCroc ? 7 : isFrog ? 8 : 7;
    const sx0 = cx - sk.halfAt(0.55) + 2;
    const sn = G.snout(g, sx0, snoutY, snoutLen, snoutH, -1, C, C2, LIT);
    G.R(g, sn.tipX + 1, snoutY + 1, 2, 2, OUT);      // nostril
    // jaw + teeth
    const jawY = snoutY + snoutH;
    G.R(g, sn.tipX, jawY - 1, snoutLen, 1, OUT);
    if (isCroc || mood === 'angry') fangs(g, sn.tipX + 2, jawY - 1, snoutLen - 5, isCroc ? 5 : 3, false, P.bone);
    if (isCroc) fangs(g, sn.tipX + 3, snoutY + 1, snoutLen - 7, 3, true, P.boneDk);
    const jSp = [];
    for (let i = 0; i < 6; i++) jSp.push({ x: sn.tipX + 2 + i * (snoutLen / 6), y: jawY + 1, r: 2.2 + i * 0.16 });
    G.limb(g, jSp, C2, null, G.shade(C2, 0.24), { grow: 1 });

    if (isFrog) {
      G.fe(g, cx - 1, hy + hh - 2, hw * 0.42, 4, C2);
      G.fe(g, cx - 1, hy + hh - 3, hw * 0.38, 3, G.shade(C, -0.06));
      if (spId === 'toad') G.speckle(g, cx - hw * 0.4, hy + 3, hw * 0.8, hh - 6, DK, 0.17, 9);
    }
    if (spId === 'iguana') { G.fe(g, sn.tipX + 6, jawY + 5, 5, 4.5, OUT); G.fe(g, sn.tipX + 6, jawY + 5, 4, 3.5, G.shade(BEL, -0.1)); }
    if (spId === 'axolotl') G.R(g, cx - 6, hy + hh - 3, 12, 1, '#ff5f8f');

    // ---- BEADY DOT EYES ----
    const eyeY = hy + Math.round(hh * (isFrog ? 0.17 : 0.3));
    const eSpread = Math.round(sk.halfAt(isFrog ? 0.2 : 0.32) * 0.62);
    const e1 = cx - eSpread, e2 = cx + eSpread;
    const eOpt = {
      r: isFrog ? 3 : 2,
      slit: !isFrog,
      sclera: mood === 'sick' ? '#c2cf8a' : (isFrog ? '#f2c21f' : '#f4e9b8'),
      closed: blink && mood !== 'angry',
    };
    if (isFrog) {                       // bulging eyes riding on the crown
      for (const ex of [e1, e2]) { G.fc(g, ex, hy + 1, 5, OUT); G.fc(g, ex, hy + 1, 4, C); G.fc(g, ex, hy, 3, G.shade(C, 0.2)); }
      G.dotEye(g, e1, hy, eOpt); G.dotEye(g, e2, hy, eOpt);
    } else {
      for (const ex of [e1, e2]) { G.fe(g, ex, eyeY, 3.4, 3, DK); }
      G.dotEye(g, e1, eyeY, eOpt); G.dotEye(g, e2, eyeY, eOpt);
    }
    if (mood === 'angry') { G.R(g, e1 - 3, eyeY - 4, 6, 2, OUT); G.R(g, e2 - 3, eyeY - 4, 6, 2, OUT); }
    if (mood === 'happy') G.R(g, sn.tipX + 3, jawY - 2, snoutLen - 7, 2, '#4a0e1e');
  }
  G.drawHeadRaw = drawHead;

  // serpents: one thick coiled body, wedge head
  function drawSerpent(g, a, x, y, t, o) {
    const C = a.col, C2 = a.col2, BEL = a.belly;
    const wig = Math.sin(t * (o.walk ? 6 : 1.8));
    // coil from the ground upward, S-curved
    const spine = [];
    for (let i = 0; i < 34; i++) {
      const p = i / 33;
      spine.push({
        x: x + 6 + Math.sin(p * 4.4 + t * 2.2) * 11 * (0.25 + p * 0.75),
        y: y - 2 - p * 40,
        r: 7.2 - p * 3.6,
      });
    }
    G.limb(g, spine, C, G.shade(C2, -0.12), G.shade(C, 0.34), { scale: G.shade(C2, -0.24), bands: C2, bandEvery: 5 });
    for (let i = 3; i < 34; i += 6) G.fe(g, spine[i].x - spine[i].r * 0.45, spine[i].y + 1, 2.2, 1.4, BEL);

    // head: wedge, flat and wide
    const hy = y - 48, hx = x + 4 + wig * 3;
    const sk = G.skull(g, hx, hy, 22, 12, C, C2, G.shade(C, 0.34), { flat: 1.15 });
    G.scales(g, hx - 7, hy + 2, 14, 7, G.shade(C2, -0.22), 3, 4);
    const sn = G.snout(g, hx - sk.halfAt(0.6) + 2, hy + 4, 9, 6, -1, C, C2, G.shade(C, 0.34));
    G.R(g, sn.tipX + 1, hy + 5, 2, 1, OUT);
    // gape + fangs
    G.R(g, sn.tipX, hy + 10, 13, 1, OUT);
    G.R(g, sn.tipX + 1, hy + 11, 3, 5, OUT); G.R(g, sn.tipX + 1, hy + 11, 2, 4, P.bone);
    G.R(g, sn.tipX + 8, hy + 11, 3, 4, OUT); G.R(g, sn.tipX + 8, hy + 11, 2, 3, P.bone);
    // heat pit + dot eyes
    G.R(g, sn.tipX + 4, hy + 6, 2, 2, OUT);
    G.dotEye(g, hx - 5, hy + 4, { r: 2, slit: true, sclera: '#f2c21f' });
    G.dotEye(g, hx + 5, hy + 4, { r: 2, slit: true, sclera: '#f2c21f' });
    G.R(g, hx - 8, hy + 1, 7, 2, G.shade(C2, -0.3));
    G.R(g, hx + 2, hy + 1, 7, 2, G.shade(C2, -0.3));
    // tongue flick
    if (Math.sin(t * 2.1) > 0.7) {
      G.R(g, sn.tipX - 7, hy + 8, 8, 1, '#e0135e');
      G.R(g, sn.tipX - 11, hy + 6, 4, 1, '#e0135e'); G.R(g, sn.tipX - 11, hy + 10, 4, 1, '#e0135e');
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
    const C = a.col, C2 = a.col2, BEL = a.belly;
    const LIT = G.shade(C, 0.3), DK = G.shade(C2, -0.32);
    const t = o.t || 0;
    const mood = o.mood || 'idle';
    const flinch = o.flinch ? Math.sin(t * 44) * 2.5 : 0;
    cx = Math.round(cx + flinch); cy = Math.round(cy + Math.sin(t * 1.5) * 1.2);
    const isFrog = spId === 'bullfrog' || spId === 'toad' || spId === 'treefrog';
    const isCroc = spId === 'gator' || spId === 'turtle';

    const W = 78, H = 70, top = cy - 46;

    // ---- frills / crests / gills BEHIND ----
    if (spId === 'axolotl') for (let s = -1; s <= 1; s += 2) for (let i = 0; i < 3; i++) {
      const gy = top + 22 + i * 14;
      const sp = [];
      for (let k = 0; k < 5; k++) sp.push({ x: cx + s * (W * 0.42 + k * 4), y: gy - k, r: 4 - k * 0.5 });
      G.limb(g, sp, '#ff5f8f', '#c93f6e', '#ffb0c8', { grow: 1.2 });
    }
    if (spId === 'iguana') for (let i = 0; i < 8; i++)
      G.R(g, cx - 38 + i * 10, top - 7 - (i % 2) * 4, 5, 10, C2);
    if (spId === 'salamander' || spId === 'newt') for (let i = 0; i < 6; i++)
      G.fc(g, cx - 34 + i * 14, top + 4, 5.5, BEL);
    if (spId === 'gecko') G.rr2(g, cx - W * 0.42, top - 6, W * 0.84, 9, C2);
    if (spId === 'python' || spId === 'viper') for (let s = -1; s <= 1; s += 2)
      G.R(g, cx + s * 40, top + 10, 12, 6, C2);

    // ---- organic skull ----
    const sk = G.skull(g, cx, top, W, H, C, C2, LIT, { flat: isFrog ? 0.38 : (isCroc ? 0.2 : 0.05) });
    G.scales(g, cx - W * 0.3, top + 12, W * 0.6, H - 26, DK, 5, 11);
    if (spId === 'toad') G.speckle(g, cx - W * 0.36, top + 8, W * 0.72, H - 20, DK, 0.1, 5);
    if (spId === 'turtle') G.speckle(g, cx - W * 0.34, top + 8, W * 0.68, H - 20, G.shade(C, 0.2), 0.06, 2);

    // heavy brow ridge
    const browY = top + Math.round(H * 0.26);
    const bhw = sk.halfAt(0.3);
    for (let i = 0; i < 5; i++) {
      const inset = Math.round(Math.pow(i / 4, 1.6) * 4);
      G.R(g, cx - bhw + 2 + inset, browY + i, (bhw - 2 - inset) * 2, 1,
        i === 0 ? G.shade(DK, 0.34) : i === 4 ? G.shade(DK, -0.4) : DK);
    }

    // ---- deep sockets + beady dot eyes ----
    const ey = top + Math.round(H * 0.42);
    const esp = Math.round(sk.halfAt(0.42) * 0.56);
    const closed = mood === 'out' || (mood === 'relief' && Math.sin(t * 2) > -0.4) ||
                   (mood !== 'agony' && Math.sin(t * 1.2 + 1) > 0.985);
    for (const s of [-1, 1]) {
      const ex = cx + s * esp;
      G.fe(g, ex, ey, 8, 7, DK);                        // orbit
      G.fe(g, ex, ey + 1, 6.5, 5, G.shade(DK, -0.42));
      if (isFrog) { G.fc(g, ex, ey - 3, 7.5, OUT); G.fc(g, ex, ey - 3, 6.5, C); G.fc(g, ex, ey - 4, 5, G.shade(C, 0.18)); }
      G.dotEye(g, ex, ey - (isFrog ? 3 : 0), {
        r: mood === 'agony' ? 4 : 3,
        slit: !isFrog,
        sclera: mood === 'agony' ? '#fff6cc' : (isFrog ? '#f2c21f' : '#f4e9b8'),
        closed,
        lookX: mood === 'agony' ? 0 : Math.round(Math.sin(t * 0.7)),
      });
      if (mood === 'agony') {
        G.R(g, ex - s * 7, ey - 5, 4, 1, P.blood);
        G.R(g, ex - s * 8, ey - 3, 3, 1, P.blood);
        G.R(g, ex + s * 6, ey + 4, 3, 1, P.blood);
      }
    }
    if (mood === 'agony') { G.R(g, cx - esp - 8, ey - 11, 13, 3, OUT); G.R(g, cx + esp - 5, ey - 11, 13, 3, OUT); }
    else if (mood === 'worry') { G.R(g, cx - esp - 8, ey - 10, 13, 2, OUT); G.R(g, cx + esp - 5, ey - 12, 13, 2, OUT); }

    if (o.sweat) for (let i = 0; i < 3; i++) {
      const sy = top + 6 + ((t * 26 + i * 22) % 36);
      G.fe(g, cx - 30 + i * 30, sy, 2, 3.4, '#a9d8ff');
      G.R(g, cx - 31 + i * 30, sy - 1, 1, 1, '#fff');
    }

    // ---- muzzle: tapered wedge projecting DOWN, narrower than skull ----
    const mTop = top + H - 6;
    const mH = isCroc ? 27 : isFrog ? 17 : 22;
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
    // nostrils + philtrum
    G.R(g, cx - rows[2] + 4, mTop + 3, 4, 4, OUT);
    G.R(g, cx + rows[2] - 8, mTop + 3, 4, 4, OUT);
    G.R(g, cx - 1, mTop + 2, 2, Math.round(mH * 0.4), G.shade(C2, -0.18));
    // jaw hinge shadows
    G.fe(g, cx - mW * 0.6, mTop + mH * 0.5, 5, 8, G.shade(DK, -0.2));
    G.fe(g, cx + mW * 0.6, mTop + mH * 0.5, 5, 8, G.shade(DK, -0.2));

    // closed jaw when the clinic is not holding the mouth open
    if ((o.mouth || 0) < 0.08) {
      const jy = mTop + mH - 4;
      G.R(g, cx - rows[mH - 3] + 2, jy, rows[mH - 3] * 2 - 4, 2, OUT);
      if (mood !== 'out') fangs(g, cx - rows[mH - 3] + 5, jy, rows[mH - 3] * 2 - 10, 5, true, P.boneDk);
    }
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
    // label plate
    if (o.label) {
      const lw = G.tw(o.label) + 10;
      G.frame(g, x + w / 2 - lw / 2, y + h + 12, lw, 13, '#16211f');
      G.text(g, o.label, x + w / 2, y + h + 16, o.labelCol || P.cream, { align: 'center' });
    }
    if (o.locked) {
      g.globalAlpha = 0.72; G.R(g, x - 4, y - 6, w + 8, h + 14, '#060a09'); g.globalAlpha = 1;
      G.text(g, 'LOCKED', x + w / 2, y + h / 2 - 4, P.steel2, { align: 'center', out: OUT });
    }
  };

  // scoop ball with hard rim light + drip
  G.drawScoopBall = function (g, cx, cy, r, flavor, squish) {
    const f = typeof flavor === 'string' ? G.flavorById(flavor) : flavor;
    if (!f) return;
    const rx = r * (1 + (squish || 0)), ry = r * (1 - (squish || 0) * 0.55);
    G.fe(g, cx, cy, rx + 1, ry + 1, OUT);
    G.fe(g, cx, cy, rx, ry, f.col);
    // scoop ridges (the curl you get off a real scoop)
    for (let i = -2; i <= 2; i++) {
      const yy = cy + i * (ry * 0.42);
      const ww = Math.sqrt(Math.max(0, 1 - Math.pow((yy - cy) / ry, 2))) * rx;
      G.R(g, cx - ww + 1, yy, ww * 2 - 2, 1, G.shade(f.col, i < 0 ? 0.22 : -0.16));
    }
    G.fe(g, cx - rx * 0.32, cy - ry * 0.34, rx * 0.34, ry * 0.28, G.shade(f.col, 0.42));
    G.R(g, cx + rx - 2, cy - ry * 0.2, 1, Math.max(1, ry), G.shade(f.col, 0.3));
    G.fe(g, cx, cy + ry - 1.5, rx * 0.65, 1.6, G.shade(f.col, -0.35));
    if (f.fleck) for (let i = 0; i < Math.max(4, r * 0.8); i++) {
      const a = (i * 2.399) % 6.283, rr = ((i * 37) % 100) / 100 * r * 0.7;
      G.R(g, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.82, 1, 1, f.fleck);
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

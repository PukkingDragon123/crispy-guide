// ============================================================
// DOUBLE LIFE v14 - folk.js  ·  THE PEOPLE
//
// Humans in this game used to be one sprite with a recoloured coat.
// This is the replacement: a genome, and a rig that draws it.
//
// G.folk(seed) turns a number into a PERSON - height, girth, skull
// shape, nose, hair, clothes, shoes, a pair of glasses, whether they
// have a belly, and one nervous habit they cannot help doing. The
// same seed always gives the same person, so the woman at the end of
// the counter is the same woman in the next shot.
//
// The proportions are deliberately wrong: the head is a third of the
// body, the shoes are enormous, the arms are noodles. That is what
// makes a cartoon read as a cartoon rather than a short adult.
//
// Everything is drawn on the quarter-unit grid (one native pixel),
// row by row, OUTLINES FIRST and fills second - do it per row and
// each row's outline paints over the last row's fill and the whole
// person turns into a black blob.
// ============================================================
(function () {
  const G = window.GAME;
  const OUT = G.PAL.ink;

  // ------------------------------------------------------------
  // the wardrobe
  // ------------------------------------------------------------
  const SKIN = ['#f4d0ac', '#eeba90', '#dda676', '#c88a58', '#ab6f47',
    '#8c5734', '#6d4127', '#f8dcc0', '#e2a684', '#bb7f56'];
  const HAIRC = ['#2a1c14', '#4a2c18', '#7a4a20', '#b07a3a', '#d8b060', '#8a8a94',
    '#e8e2d8', '#8a3a2a', '#3a2a3a', '#2f4a7a', '#c05a8a', '#3f8a6b'];
  const GREY = ['#c8c8d0', '#e8e4dc', '#a8a8b4', '#f2eee6'];
  const CLOTH = ['#e0574a', '#e88a3a', '#f0c04a', '#8fbf3a', '#3aa878', '#3a8ac8',
    '#5a5ac8', '#a05ac8', '#e07aa8', '#f2ece0', '#4a5568', '#8a6a4a', '#2f7a6b', '#c8b48a'];
  const PANTS = ['#3a4a68', '#2f3a4a', '#5c4a3a', '#6b6b78', '#3a5c4a',
    '#7a4a4a', '#8a7a5a', '#4a3a5c', '#2a2a34', '#a8946a'];
  const SHOEC = ['#2a1c18', '#3a2a24', '#5c3a2a', '#c8483a', '#f2ece0', '#3a4a68', '#8a6a3a'];
  const TOPS = ['tee', 'shirt', 'jumper', 'vest', 'dress', 'hoodie', 'coat', 'stripe'];
  const SLEEVE = { tee: 0.42, shirt: 0.92, jumper: 0.96, vest: 0.06, dress: 0.34, hoodie: 0.96, coat: 1, stripe: 0.66, cardi: 0.94 };

  // ------------------------------------------------------------
  // THE GENOME. One number in, one whole person out.
  // ------------------------------------------------------------
  const cache = new Map();
  G.folk = function (seed) {
    seed = seed === undefined ? 3.3 : seed;
    const key = Math.round(seed * 997);
    if (cache.has(key)) return cache.get(key);
    const h = (i) => G.hash(seed * 12.9898 + i * 7.13 + 0.31, i * 3.77 + 1.7);
    const pick = (arr, i) => arr[Math.min(arr.length - 1, Math.floor(h(i) * arr.length))];

    const kid = h(0) > 0.76;
    const old = !kid && h(1) > 0.82;
    const g = {
      seed, kid, old,
      // ---- build ----
      h: kid ? G.lerp(0.58, 0.78, h(2)) : old ? G.lerp(0.86, 0.98, h(2)) : G.lerp(0.92, 1.16, h(2)),
      girth: kid ? G.lerp(0.9, 1.12, h(3)) : G.lerp(0.8, 1.52, h(3)),
      head: kid ? G.lerp(1.3, 1.5, h(4)) : G.lerp(1.02, 1.3, h(4)),
      wide: G.lerp(0.86, 1.08, h(5)),
      skull: pick(['round', 'egg', 'pear', 'box', 'long', 'round', 'pear'], 6),
      legL: G.lerp(0.84, 1.18, h(7)),
      armL: G.lerp(0.9, 1.24, h(8)),
      neck: kid ? 0.3 : G.lerp(0.3, 1.8, h(9)),
      belly: !kid && h(10) > 0.66,
      stoop: old ? G.lerp(0.3, 0.8, h(11)) : h(11) > 0.86 ? 0.3 : 0,
      // ---- face ----
      nose: pick(['button', 'bulb', 'beak', 'spud', 'ski', 'squish'], 12),
      eye: G.lerp(0.9, 1.4, h(13)),
      gap: G.lerp(0.9, 1.22, h(14)),
      brow: h(15) * 2 - 1,
      ears: G.lerp(0.8, 1.6, h(16)),
      teeth: h(17) > 0.5,
      freck: kid ? h(18) > 0.45 : h(18) > 0.86,
      blush: kid || old || h(19) > 0.7,
      specs: h(20) > (old ? 0.35 : 0.76) ? (h(21) > 0.5 ? 'round' : 'square') : 0,
      facial: (kid || h(22) < 0.56) ? 'none' : pick(['stache', 'beard', 'chops', 'stubble'], 23),
      skin: pick(SKIN, 24),
      // ---- hair ----
      hairS: kid ? pick(['mop', 'bowl', 'tails', 'puff', 'spike'], 25)
        : old ? pick(['bald', 'combover', 'bun', 'flat', 'puff'], 25)
          : pick(['mop', 'bowl', 'bald', 'combover', 'puff', 'bun', 'tails', 'spike', 'flat', 'curl'], 25),
      hairC: old ? pick(GREY, 26) : pick(HAIRC, 26),
      // ---- clothes ----
      topKind: kid ? pick(['tee', 'stripe', 'hoodie', 'dress'], 27) : pick(TOPS, 27),
      top: pick(CLOTH, 28),
      top2: pick(CLOTH, 29),
      bottom: pick(PANTS, 30),
      shorts: kid ? h(31) > 0.4 : h(31) > 0.88,
      shoe: pick(SHOEC, 32),
      shoeSz: G.lerp(1.0, 1.55, h(33)),
      hat: h(34) > 0.84 ? pick(['cap', 'beanie', 'crown', 'party'], 35) : 'none',
      // ---- something in the hand, because people carry things ----
      prop: h(39) > 0.52 ? ['bag', 'cup', 'cone', 'phone', 'lolly', 'balloon', 'brolly', 'flowers'][Math.floor(h(40) * 8)] : 'none',
      scarf: h(41) > 0.76,
      // ---- the thing they cannot help doing ----
      quirk: pick(['rock', 'scratch', 'check', 'bounce', 'peer', 'none', 'none', 'none'], 36),
      ph: h(37) * 6.283,
      sp: G.lerp(0.84, 1.22, h(38)),
    };
    cache.set(key, g);
    return g;
  };

  // ------------------------------------------------------------
  // THE HABIT. A small pose the clip system knows nothing about,
  // added on top of an idle so a room of people is never a row of
  // statues doing the same breath.
  // ------------------------------------------------------------
  G.folkQuirk = function (gene, t) {
    const ph = t * gene.sp + gene.ph;
    const z = { bob: 0, sway: 0, lean: 0, headTurn: 0, headTilt: 0, armL: 0, armR: 0, armUp: 0, scratch: 0 };
    // most habits are periodic bursts, not constant motion
    const burst = (per, len) => {
      const c = ((ph / per) % 1 + 1) % 1;
      return c > 1 - len ? Math.sin((c - (1 - len)) / len * Math.PI) : 0;
    };
    switch (gene.quirk) {
      case 'rock':
        z.sway = Math.sin(ph * 1.15) * 1.5; z.lean = Math.sin(ph * 1.15) * 0.1;
        z.bob = -Math.abs(Math.sin(ph * 1.15)) * 0.5; break;
      case 'scratch': {
        const b = burst(9.4, 0.26);
        z.armUp = b * 0.9; z.armR = -b * 0.5; z.headTilt = b * 0.2; z.scratch = b; break;
      }
      case 'check': {
        const b = burst(7.7, 0.2);
        z.armL = -b * 0.9; z.headTilt = b * 0.42; z.headTurn = -b * 0.2; break;
      }
      case 'bounce':
        z.bob = -Math.abs(Math.sin(ph * 2.3)) * 1.3 + 0.5; break;
      case 'peer': {
        const b = burst(6.2, 0.34);
        z.headTurn = Math.sin(b * 3.14) * 0.55; z.lean = b * 0.12; break;
      }
    }
    return z;
  };

  // ------------------------------------------------------------
  // drawing primitives, all on the quarter-unit (one native pixel)
  // grid, all obeying outline-pass-then-fill-pass
  // ------------------------------------------------------------
  const q = (v) => Math.round(v * 4) / 4;

  // ------------------------------------------------------------
  // THE MASCOT'S MATERIAL, ON A PERSON.
  //
  // Everything the cow is made of has five things going on: a hard
  // black outline, a base tone, a LIT CROWN across the top, a SHADED
  // BELLY across the bottom, a rim down each edge, and one short
  // specular streak on the light shoulder. People used to be a flat
  // fill with a single bright row, which is why they read as cardboard
  // standing next to it. Now they are made of the same stuff.
  // ------------------------------------------------------------
  function tones(c) {
    return {
      hi: G.shade(c, 0.5), lit: G.shade(c, 0.24), base: c,
      dk: G.shade(c, -0.22), dk2: G.shade(c, -0.46),
    };
  }
  function band(T, p) {
    return p < 0.09 ? T.hi : p < 0.21 ? T.lit
      : p > 0.9 ? T.dk2 : p > 0.76 ? T.dk : T.base;
  }

  // a solid of revolution: half-width as a function of 0..1 down it
  function body(g, cx, top, h, hwOf, c, o) {
    o = o || {};
    const T = tones(c);
    const n = Math.max(3, Math.round(h * 4));
    const W = [];
    for (let i = 0; i < n; i++) W.push(Math.max(0.25, q(hwOf((i + 0.5) / n))));
    cx = q(cx); top = q(top);
    for (let i = 0; i < n; i++) G.Rh(g, cx - W[i] - 0.25, top + i * 0.25, W[i] * 2 + 0.5, 0.25, OUT);
    G.Rh(g, cx - W[0] + 0.25, top - 0.25, W[0] * 2 - 0.5, 0.25, OUT);
    G.Rh(g, cx - W[n - 1] + 0.25, top + n * 0.25, W[n - 1] * 2 - 0.5, 0.25, OUT);
    for (let i = 0; i < n; i++) {
      const p = (i + 0.5) / n, y = top + i * 0.25;
      G.Rh(g, cx - W[i], y, W[i] * 2, 0.25, band(T, p));
      G.Rh(g, cx - W[i], y, 0.25, 0.25, T.hi);                 // rim, light side
      G.Rh(g, cx + W[i] - 0.25, y, 0.25, 0.25, T.dk2);         // rim, shadow side
      // the specular streak down the light shoulder
      if (!o.flat && p > 0.17 && p < 0.31 && W[i] > 1.6)
        G.Rh(g, cx - W[i] * 0.58, y, 0.25, 0.25, T.hi);
    }
  }

  // a round blob, shaded like a ball and not like a disc.
  // out=null skips the outline (for marks that live inside a shape)
  function ball(g, cx, cy, r, col, out, lit) {
    const T = tones(col);
    const n = Math.max(2, Math.round(r * 8));
    const W = [];
    for (let i = 0; i < n; i++) {
      const d = (i + 0.5) / n * 2 - 1;
      W.push(Math.max(0.25, q(r * Math.sqrt(Math.max(0, 1 - d * d)))));
    }
    cx = q(cx); const top = q(cy - r);
    if (out) {
      for (let i = 0; i < n; i++) G.Rh(g, cx - W[i] - 0.25, top + i * 0.25, W[i] * 2 + 0.5, 0.25, out);
      G.Rh(g, cx - W[0] + 0.25, top - 0.25, W[0] * 2 - 0.5, 0.25, out);
      G.Rh(g, cx - W[n - 1] + 0.25, top + n * 0.25, W[n - 1] * 2 - 0.5, 0.25, out);
    }
    for (let i = 0; i < n; i++) {
      const p = (i + 0.5) / n, y = top + i * 0.25;
      G.Rh(g, cx - W[i], y, W[i] * 2, 0.25,
        lit ? (p < 0.18 ? T.hi : p < 0.34 ? T.lit : p > 0.86 ? T.dk2 : p > 0.7 ? T.dk : T.base) : col);
    }
    // one catch-light, up and to the left, the way the cow's eye has one
    if (lit && r >= 1.25) G.Rq(g, cx - r * 0.42, top + r * 0.5, 1, 1,
      typeof lit === 'string' ? lit : T.hi);
  }

  // a noodle: a tapered outlined run from joint to joint, lit down one
  // side and shaded down the other
  function noodle(g, x0, y0, x1, y1, w0, w1, col, lit) {
    const T = tones(col);
    const d = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) * 3));
    const P = [];
    for (let i = 0; i <= d; i++) {
      const p = i / d;
      P.push([q(G.lerp(x0, x1, p)), q(G.lerp(y0, y1, p)), Math.max(0.5, q(G.lerp(w0, w1, p)))]);
    }
    for (const s of P) G.Rh(g, s[0] - s[2] / 2 - 0.25, s[1] - s[2] / 2 - 0.25, s[2] + 0.5, s[2] + 0.5, OUT);
    for (let i = 0; i < P.length; i++) {
      const s = P[i], p = i / P.length;
      G.Rh(g, s[0] - s[2] / 2, s[1] - s[2] / 2, s[2], s[2], p < 0.16 ? T.lit : T.base);
      G.Rh(g, s[0] - s[2] / 2, s[1] - s[2] / 2, 0.25, s[2], lit || T.hi);
      G.Rh(g, s[0] + s[2] / 2 - 0.25, s[1] - s[2] / 2, 0.25, s[2], T.dk2);
    }
  }

  // a stitched seam, a hem, a cuff: the small stuff that turns a
  // coloured block into a garment
  function hem(g, x, y, w, c) {
    G.Rh(g, q(x), q(y), q(w), 0.5, G.shade(c, -0.3));
    G.Rh(g, q(x), q(y), q(w), 0.25, G.shade(c, 0.3));
  }
  function stitch(g, x, y, w, c) {
    for (let i = 0; i < w; i += 1.5) G.Rq(g, x + i, y, 1, 1, c);
  }

  // ------------------------------------------------------------
  // THE RIG
  // ------------------------------------------------------------
  G.drawFolk = function (g, x, footY, scale, o) {
    o = o || {};
    const S = scale || 1;
    const gene = o.gene || G.folk(o.seed);
    const t = o.t || 0;
    x = q(x); footY = q(footY);

    const skin = o.skin || gene.skin;
    const skinL = G.shade(skin, 0.24), skinD = G.shade(skin, -0.3);
    const top = o.coat || gene.top;
    const topL = G.shade(top, 0.3), topD = G.shade(top, -0.36);
    const pants = o.pants || gene.bottom;
    const hairC = o.hair || gene.hairC;

    // ---- the performance ----
    const A = o.pose || G.pose(o.clip || (o.walk ? 'walk' : 'idle'),
      (o.ct === undefined ? (o.walk || t) : o.ct) + gene.ph * 0.33,
      { speed: (o.speed === undefined ? 1 : o.speed) * gene.sp, dir: o.dir,
        seed: o.seed === undefined ? gene.ph : o.seed, p: o.p, emph: o.emph,
        into: o.into, blend: o.blend });
    const clip = o.clip || (o.walk ? 'walk' : 'idle');
    const Q = (!o.noQuirk && (clip === 'idle' || clip === 'talk'))
      ? G.folkQuirk(gene, t) : null;
    const qv = (k) => A[k] + (Q ? (Q[k] || 0) : 0);

    // ---- the skeleton ----
    // 50 * h puts an adult at 46..58 units and a child at 29..39,
    // which is G.SZ.ADULT either side of the middle
    const tot = 50 * gene.h * S;
    const hdH = tot * 0.25 * gene.head;
    const legH = tot * 0.40 * gene.legL;
    const nkH = tot * 0.028 * gene.neck;
    const torH = G.clamp(tot - hdH - legH - nkH, tot * 0.15, tot * 0.32);
    const shW = torH * 1.2 * gene.girth;
    const hipW = shW * (gene.belly ? 0.94 : 0.78);
    const hdW = hdH * gene.wide;

    const bob = (A.bob + A.breathe * 0.3 + (Q ? Q.bob : 0)) * S;
    const lean = (qv('lean')) * tot * 0.06 + gene.stoop * tot * 0.03;
    const sway = (qv('sway')) * S * 0.5;
    const hipY = footY - legH;
    const torT = hipY - torH * (1 + A.squash * 0.5) + bob;
    const torHn = hipY - torT;
    const nkY = torT - nkH;
    const hdT = nkY - hdH;

    // ---- the shadow it stands in ----
    g.globalAlpha = 0.28;
    G.rr(g, x - tot * 0.17, footY - 1.5, tot * 0.34, 3, '#000000');
    g.globalAlpha = 1;

    // ============ legs ============
    const bare = gene.topKind === 'dress' || gene.shorts;
    const legCol = bare ? skin : pants;
    const legLit = bare ? skinL : G.shade(pants, 0.2);
    const shoeW = tot * 0.125 * gene.shoeSz, shoeH = Math.max(1, tot * 0.05);
    for (const [key, sd] of [['legL', -1], ['legR', 1]]) {
      const sw = A[key];
      const hx0 = x + sd * hipW * 0.3 + lean * 0.35 + sway;
      const fx = hx0 + sw * legH * 0.34;
      const lift = Math.max(0, -sw) * legH * 0.24;
      const fy = footY - lift;
      const kx = (hx0 + fx) / 2 + Math.max(0, sw) * legH * 0.07;
      const ky = hipY + (fy - hipY) * 0.5 - lift * 0.28;
      noodle(g, hx0, hipY - torHn * 0.1, kx, ky, tot * 0.085, tot * 0.07, G.shade(legCol, -0.1), legLit);
      noodle(g, kx, ky, fx, fy - shoeH * 0.55, tot * 0.07, tot * 0.055, G.shade(legCol, -0.2), G.shade(legLit, -0.1));
      if (bare && !gene.shorts) {                     // a sock over the shin
        G.Rh(g, q(fx - tot * 0.05), q(fy - shoeH - tot * 0.05), q(tot * 0.1), q(tot * 0.05), '#f2ece0');
      }
      // the shoe: far too big, which is the whole joke, and now it has
      // a toe cap, a sole and a lace on it
      const sx = q(fx - shoeW * 0.5), sy = q(fy - shoeH);
      const sw2 = q(shoeW), sh2 = q(shoeH);
      G.rr2(g, sx - 0.25, sy - 0.25, sw2 + 0.5, sh2 + 0.5, OUT);
      G.rr2(g, sx, sy, sw2, sh2, gene.shoe);
      G.Rh(g, sx + 0.5, sy, sw2 - 1, 0.25, G.shade(gene.shoe, 0.4));
      G.Rh(g, sx + 0.75, sy + 0.25, sw2 * 0.34, 0.25, G.shade(gene.shoe, 0.6));
      ball(g, sx + sw2 * 0.82, sy + sh2 * 0.45, sh2 * 0.5, gene.shoe, null, 1);
      G.Rh(g, sx, sy + sh2 - 0.75, sw2, 0.75, G.shade(gene.shoe, -0.5));
      G.Rh(g, sx, sy + sh2 - 1, sw2, 0.25, '#e8e2d6');
      G.Rq(g, sx + sw2 * 0.3, sy + sh2 * 0.34, 1, 1, '#f0e8dc');
      G.Rq(g, sx + sw2 * 0.46, sy + sh2 * 0.34, 1, 1, '#f0e8dc');
      if (A.step && sd * A.step > 0.86 && lift < 1) {
        g.globalAlpha = 0.3;
        for (let k = 0; k < 3; k++) G.Rq(g, fx - shoeW * 0.5 - k * 1.5, fy - 0.5 - k * 0.5, 2, 1, '#a89882');
        g.globalAlpha = 1;
      }
    }

    // ============ torso ============
    const cxT = x + lean + sway;
    const bellyP = gene.belly ? 0.22 : 0;
    const torHw = (p) => {
      const shoulder = 1 - Math.pow(Math.max(0, 0.2 - p) / 0.2, 2) * 0.28;
      const waist = 1 - Math.sin(p * Math.PI) * (0.1 - bellyP);
      return G.lerp(shW, hipW, p) * 0.5 * shoulder * waist;
    };
    body(g, cxT, torT, torHn, torHw, top);

    // ---- what they are wearing on it ----
    const tW = shW * 0.5;
    const K = gene.topKind;
    if (K === 'shirt') {
      for (let i = 0; i < 4; i++) G.Rq(g, cxT - 0.5, torT + torHn * (0.25 + i * 0.17), 1, 1, G.shade(top, -0.5));
      G.Rh(g, cxT - tW * 0.55, torT + torHn * 0.04, tW * 0.5, 0.5, '#f6f2e6');
      G.Rh(g, cxT + tW * 0.05, torT + torHn * 0.04, tW * 0.5, 0.5, '#f6f2e6');
    } else if (K === 'stripe') {
      for (let i = 0; i < 7; i++)
        G.Rh(g, cxT - tW * 0.94, torT + torHn * (0.1 + i * 0.12), tW * 1.88, Math.max(0.5, torHn * 0.055), gene.top2);
    } else if (K === 'vest') {
      G.Rh(g, cxT - tW * 0.62, torT, tW * 0.34, torHn * 0.5, gene.top2);
      G.Rh(g, cxT + tW * 0.28, torT, tW * 0.34, torHn * 0.5, gene.top2);
    } else if (K === 'hoodie') {
      G.Rh(g, cxT - tW * 0.8, torT + torHn * 0.5, tW * 1.6, Math.max(1, torHn * 0.22), topD);
      G.Rh(g, cxT - tW * 0.2, torT, tW * 0.4, torHn * 0.16, G.shade(top, -0.55));
    } else if (K === 'coat') {
      G.Rh(g, cxT - 0.25, torT + torHn * 0.1, 0.5, torHn * 0.9, topD);
      G.Rh(g, cxT - tW * 0.8, torT + torHn * 0.02, tW * 0.5, torHn * 0.3, topL);
      G.Rh(g, cxT + tW * 0.3, torT + torHn * 0.02, tW * 0.5, torHn * 0.3, topL);
      G.Rh(g, cxT - tW, hipY - 0.5, tW * 2, 1, topD);
    } else if (K === 'dress') {
      const hemY = hipY + legH * 0.22, hemY0 = torHn;
      body(g, cxT, hipY - hemY0 * 0.1, hemY - hipY + hemY0 * 0.1,
        (p) => G.lerp(hipW * 0.5, hipW * 0.86, p), top);
      for (let i = 0; i < 5; i++)
        G.Rh(g, cxT - hipW * 0.4 + i * hipW * 0.2, hemY - torHn * 0.1, 0.25, torHn * 0.1, topD);
      hem(g, cxT - hipW * 0.43, hemY - 0.5, hipW * 0.86, top);
    } else if (K === 'cardi') {
      // knitted, worn open, one button done up out of habit
      G.Rh(g, cxT - tW * 0.34, torT + torHn * 0.06, tW * 0.68, torHn * 0.94, gene.top2);
      for (let i = 0; i < 9; i++)
        G.Rh(g, cxT - tW * 0.34, torT + torHn * (0.08 + i * 0.1), tW * 0.68, 0.25, G.shade(gene.top2, -0.14));
      G.Rh(g, cxT - tW * 0.38, torT + torHn * 0.04, 0.5, torHn * 0.94, topD);
      G.Rh(g, cxT + tW * 0.34, torT + torHn * 0.04, 0.5, torHn * 0.94, topD);
      G.Rh(g, cxT - tW * 0.58, torT + torHn * 0.02, tW * 0.24, torHn * 0.16, topL);
      G.Rh(g, cxT + tW * 0.34, torT + torHn * 0.02, tW * 0.24, torHn * 0.16, topL);
      G.Rq(g, cxT + tW * 0.28, torT + torHn * 0.4, 1, 1, '#f6f2e6');
      for (let i = 0; i < 4; i++)                     // the cable knit down each side
        G.Rh(g, cxT - tW * 0.62, torT + torHn * (0.24 + i * 0.16), tW * 0.2, 0.25, topL);
    } else if (K === 'jumper') {
      G.Rh(g, cxT - tW * 0.9, torT + torHn * 0.02, tW * 1.8, Math.max(0.5, torHn * 0.08), topL);
      for (let i = 0; i < 3; i++)
        G.Rh(g, cxT - tW * 0.5 + i * tW * 0.5 - 0.5, torT + torHn * 0.4, 1, 1, gene.top2);
    }
    // ---- the small stuff that turns a coloured block into clothes ----
    hem(g, cxT - torHw(0.98), hipY - 1.5, torHw(0.98) * 2, top);
    // a collar, with the shadow it casts on the chest
    const colW = tW * 0.5;
    G.Rh(g, q(cxT - colW * 0.5), q(torT + torHn * 0.02), q(colW), 0.5, G.shade(top, 0.4));
    g.globalAlpha = 0.3;
    G.Rh(g, q(cxT - colW * 0.55), q(torT + torHn * 0.06), q(colW * 1.1), 0.5, '#000000');
    g.globalAlpha = 1;
    if (gene.scarf) {                                  // and a scarf, on some
      const sc2 = gene.top2;
      G.Rh(g, q(cxT - tW * 0.72), q(torT + torHn * 0.04) - 0.25, q(tW * 1.44), q(torHn * 0.16) + 0.5, OUT);
      G.Rh(g, q(cxT - tW * 0.7), q(torT + torHn * 0.04), q(tW * 1.4), q(torHn * 0.14), sc2);
      G.Rh(g, q(cxT - tW * 0.7), q(torT + torHn * 0.04), q(tW * 1.4), 0.25, G.shade(sc2, 0.4));
      G.Rh(g, q(cxT + tW * 0.22) - 0.25, q(torT + torHn * 0.16) - 0.25, q(tW * 0.3) + 0.5, q(torHn * 0.3) + 0.5, OUT);
      G.Rh(g, q(cxT + tW * 0.22), q(torT + torHn * 0.16), q(tW * 0.3), q(torHn * 0.3), G.shade(sc2, -0.12));
      for (let i = 0; i < 4; i++)
        G.Rq(g, cxT + tW * 0.24 + i * 1.5, torT + torHn * 0.44, 1, 1, G.shade(sc2, -0.4));
    }
    if (o.onTorso) o.onTorso(g, { cxT, torT, torHn, shW, hipW, tW, tot, hipY, legH, torHw });
    if (o.badge) {                                     // a name badge, for staff
      G.Rh(g, cxT + tW * 0.3, torT + torHn * 0.2, tW * 0.5, torHn * 0.16, '#f2ece0');
      G.Rh(g, cxT + tW * 0.34, torT + torHn * 0.24, tW * 0.42, 0.25, '#8a94a8');
    }

    // ============ arms ============
    let handR = null, handL = null;
    const sl = SLEEVE[K] === undefined ? 0.8 : SLEEVE[K];
    const armLen = tot * 0.29 * gene.armL;
    for (const [key, sd] of [['armL', -1], ['armR', 1]]) {
      const sw = qv(key);
      const up = (key === 'armR' ? qv('armUp') : (Q && Q.armL < -0.4 ? 0 : 0));
      const shx = cxT + sd * shW * 0.5, shy = torT + torHn * 0.16;
      let hx2 = shx + sd * tot * 0.03 + sw * armLen * 0.42;
      let hy2 = shy + armLen * (0.95 - Math.abs(sw) * 0.1) - up * armLen * 1.7;
      // only the arm the clip actually threw out reaches; the other
      // one hanging out at the same angle is a T-pose
      let reaching = 0;
      if (A.reach > 0.05 && Math.abs(sw) > 0.6 && ((sd > 0) === (sw > 0))) {
        // out and DOWN. A reach held level with the shoulder is a rod
        // with a knob on it, not somebody showing you something.
        hx2 = shx + sd * armLen * 0.86 * A.reach + sw * tot * 0.05;
        hy2 = shy + armLen * 0.74 - A.reach * tot * 0.035;
        reaching = 1;
      }
      if (A.hold && key === 'armR') { hx2 = shx - sd * tot * 0.05; hy2 = shy + tot * 0.04 - A.hold * tot * 0.1; }
      if (Q && Q.scratch > 0.1 && key === 'armR') {    // scratching the head
        hx2 = cxT + hdW * 0.34 + Math.sin(t * 17) * tot * 0.02;
        hy2 = hdT + hdH * 0.24;
      }
      if (Q && gene.quirk === 'check' && key === 'armL' && Q.armL < -0.1) {
        hx2 = cxT - shW * 0.2; hy2 = torT + torHn * 0.36;
      }
      if (up > 0.2) hx2 += Math.sin(t * 11) * tot * 0.035 * A.flap;
      const ex = (shx + hx2) / 2 - sd * tot * (reaching ? 0.012 : 0.035);
      const ey = (shy + hy2) / 2 + tot * (reaching ? 0.05 : 0.02);
      const w0 = tot * 0.075, w1 = tot * 0.055;
      // sleeve to where it ends, then bare forearm
      const sxE = G.lerp(shx, ex, Math.min(1, sl / 0.5)), syE = G.lerp(shy, ey, Math.min(1, sl / 0.5));
      let cuffX = null, cuffY = 0;
      if (sl >= 0.5) {
        noodle(g, shx, shy, ex, ey, w0, w1, G.shade(top, -0.2), topL);
        const p2 = Math.min(1, (sl - 0.5) / 0.5);
        const mx = G.lerp(ex, hx2, p2), my = G.lerp(ey, hy2, p2);
        if (p2 > 0.02) noodle(g, ex, ey, mx, my, w1, w1 * 0.9, G.shade(top, -0.28), topL);
        if (p2 < 0.98) { noodle(g, mx, my, hx2, hy2, w1 * 0.9, w1 * 0.8, skin, skinL); cuffX = mx; cuffY = my; }
      } else {
        noodle(g, shx, shy, sxE, syE, w0, w1, G.shade(top, -0.2), topL);
        noodle(g, sxE, syE, hx2, hy2, w1, w1 * 0.82, skin, skinL);
        cuffX = sxE; cuffY = syE;
      }
      // a cuff exactly where the sleeve stops, no wider than the arm
      if (cuffX !== null) {
        G.Rh(g, q(cuffX - w1 * 0.58), q(cuffY - w1 * 0.5), q(w1 * 1.16), 0.5, G.shade(top, 0.4));
        G.Rh(g, q(cuffX - w1 * 0.58), q(cuffY), q(w1 * 1.16), 0.25, G.shade(top, -0.4));
      }
      // a mitten of a hand, shaded like the cow's
      ball(g, hx2, hy2 + tot * 0.02, tot * 0.058, skin, OUT, 1);
      if (sd > 0) handR = { x: hx2, y: hy2 + tot * 0.02 };
      else handL = { x: hx2, y: hy2 + tot * 0.02 };
    }
    // and whatever they came in carrying
    if ((o.prop || gene.prop) !== 'none' && !o.dead)
      prop(g, o.prop || gene.prop, handL || handR, tot, gene, t);

    // ============ neck ============
    const turn = qv('headTurn') * hdW * 0.14;
    const tilt = qv('headTilt');
    const hxc = cxT + turn * 0.4;
    if (nkH > 0.4) {
      G.Rh(g, q(hxc - tot * 0.035) - 0.25, q(nkY - 0.25), q(tot * 0.07) + 0.5, q(nkH) + 0.75, OUT);
      G.Rh(g, q(hxc - tot * 0.035), q(nkY), q(tot * 0.07), q(nkH) + 0.5, G.mix(skin, '#5a3a2a', 0.4));
    }

    // ============ head ============
    const hx = cxT + turn;
    const hyT = hdT + tilt * hdH * 0.08 + bob * 0.3;
    const hcx = hx, hcy = hyT + hdH * 0.5;
    // ears go on before the skull so their inner edge tucks behind it
    const earR = hdH * 0.1 * gene.ears;
    for (const sd of [-1, 1]) {
      ball(g, hcx + sd * (hdW * 0.5 - earR * 0.3) + turn * 0.2, hyT + hdH * 0.5, earR, skin, OUT, skinL);
      ball(g, hcx + sd * (hdW * 0.5 + earR * 0.1) + turn * 0.2, hyT + hdH * 0.5, earR * 0.4, skinD, null);
    }
    // hair that sits behind the skull
    hairBack(g, gene, hcx, hyT, hdW, hdH, hairC, turn);
    // the skull itself
    const shape = gene.skull;
    body(g, hcx, hyT, hdH, (p) => {
      const r = Math.sqrt(Math.max(0.02, 1 - Math.pow(p * 2 - 1, 2) * 0.88));
      let k = r;
      if (shape === 'egg') k = r * (0.8 + 0.2 * p);
      else if (shape === 'pear') k = r * (0.76 + 0.32 * p);
      else if (shape === 'box') k = (p < 0.1 || p > 0.92) ? 0.82 : 1;
      else if (shape === 'long') k = Math.min(1, r * 1.24);
      return hdW * 0.5 * k;
    }, skin);

    // ---- the face. THE SAME THREE MARKS THE COW HAS: a light ring,
    // a dark round, a white pip. Bigger than they were, because bigger
    // is cuter, and nothing else in the eye at all. ----
    const eyY = hyT + hdH * (gene.kid ? 0.52 : 0.47);
    const eyX = hdW * 0.235 * gene.gap;
    // never let the two rounds touch, whatever the genome asked for
    const eR = Math.min(hdH * 0.105 * gene.eye, eyX * 0.72);
    const dead = o.dead;
    // a soft cheek tone and a chin shadow, so the face is not a flat field
    g.globalAlpha = 0.5;
    ball(g, hcx + turn * 0.5, hyT + hdH * 0.86, hdW * 0.3, skinD, null);
    g.globalAlpha = 1;
    for (const sd of [-1, 1]) {
      const ex = hcx + sd * eyX + turn * 0.7;
      const ey = eyY + eR * 0.4;
      if (dead) { G.Rh(g, q(ex - eR), q(ey), q(eR * 2), 0.25, skinD); continue; }
      if (A.blink && !o.noBlink) {
        // a shut lid, with a lash under it
        G.Rh(g, q(ex - eR), q(ey - eR * 0.1), q(eR * 2), 0.5, '#3a2a30');
        G.Rh(g, q(ex - eR * 0.7), q(ey + eR * 0.4), q(eR * 1.4), 0.25, skinD);
        continue;
      }
      const wide = A.stare ? 1.3 : 1;
      const r = eR * wide;
      ball(g, ex, ey, r + 0.25, '#fdf8ee', null);              // the light ring
      ball(g, ex, ey, r, '#241d2a', null);                      // the round
      G.Rq(g, ex - r * 0.34, ey - r * 0.4, 1, 1, '#ffffff');    // the pip
      if (r > 1.6) G.Rq(g, ex + r * 0.28, ey + r * 0.24, 1, 1, '#6b5f78');
      // one thin brow, well clear of the eye, only where the face wants one
      if (Math.abs(gene.brow) > 0.25 || A.stare) {
        const lift = A.stare ? -eR * 0.5 : 0;
        G.Rh(g, q(ex - eR * 0.9), q(ey - r - eR * 0.85 + lift + sd * gene.brow * eR * 0.35),
          q(eR * 1.8), 0.25, G.mix(G.shade(hairC, -0.2), '#3a2a24', 0.4));
      }
    }
    if (gene.blush && !dead) {
      for (const sd of [-1, 1]) {
        g.globalAlpha = 0.42;
        ball(g, hcx + sd * hdW * 0.35 + turn * 0.5, eyY + eR * 2.1, hdH * 0.085, '#e07a8a', null);
        g.globalAlpha = 0.24;
        ball(g, hcx + sd * hdW * 0.35 + turn * 0.5, eyY + eR * 1.9, hdH * 0.055, '#ff9ab8', null);
        g.globalAlpha = 1;
      }
    }
    if (gene.freck) for (let i = 0; i < 6; i++) {
      const sd = i < 3 ? -1 : 1;
      G.Rq(g, hcx + sd * hdW * (0.2 + (i % 3) * 0.09) + turn * 0.5, eyY + eR * (1.8 + (i % 2) * 0.5), 1, 1, skinD);
    }
    // ---- the nose ----
    const nY = hyT + hdH * 0.6, nX = hcx + turn * 0.85;
    if (gene.nose === 'button') ball(g, nX, nY, hdH * 0.06, G.mix(skin, '#e79a90', 0.45), skinD, G.shade(skin, 0.4));
    else if (gene.nose === 'bulb') { ball(g, nX, nY + hdH * 0.02, hdH * 0.1, G.mix(skin, '#e08a80', 0.3), OUT, skinL); }
    else if (gene.nose === 'beak') {
      const n2 = Math.max(2, Math.round(hdH * 0.16 * 4));
      for (let i = 0; i < n2; i++) G.Rh(g, q(nX - 0.5), q(nY - hdH * 0.08 + i * 0.25), q(0.5 + i * 0.25) + 0.5, 0.25, OUT);
      for (let i = 0; i < n2; i++) G.Rh(g, q(nX - 0.25), q(nY - hdH * 0.08 + i * 0.25), q(0.25 + i * 0.25), 0.25, skinD);
    } else if (gene.nose === 'spud') { ball(g, nX, nY, hdH * 0.11, skinD, OUT); ball(g, nX, nY - hdH * 0.02, hdH * 0.07, skin, null); }
    else if (gene.nose === 'ski') {
      for (let i = 0; i < 4; i++) G.Rh(g, q(nX - 0.5 + i * 0.25), q(nY - hdH * 0.1 + i * hdH * 0.05), 1.25, 0.5, skinD);
      G.Rh(g, q(nX + 0.25), q(nY + hdH * 0.05), 0.75, 0.25, OUT);
    } else { G.Rh(g, q(nX - hdH * 0.09), q(nY), q(hdH * 0.18), 0.5, skinD); }
    if (gene.specs && !dead) specs(g, gene, hcx + turn * 0.7, eyY + eR * 0.4, eyX, eR, hdW);

    // ---- the mouth. One arc, the ends turned up, and a lighter pixel
    // under it so it sits IN the face instead of on it. ----
    const mY = hyT + hdH * 0.79, mW = hdW * 0.32;
    const mx0 = hcx + turn * 0.7;
    if (dead) {
      G.Rh(g, q(mx0 - mW * 0.5), q(mY), q(mW), 0.5, skinD);
    } else if (A.mouth > 0.08) {
      // open: a small rounded shape with the smile corners left in
      const oh = Math.max(0.75, hdH * 0.055 + A.mouth * hdH * 0.19);
      const ow = mW * (0.66 + A.mouth * 0.36);
      G.rr2(g, q(mx0 - ow * 0.5) - 0.25, q(mY) - 0.25, q(ow) + 0.5, q(oh) + 0.5, OUT);
      G.rr2(g, q(mx0 - ow * 0.5), q(mY), q(ow), q(oh), '#6b2440');
      if (gene.teeth) G.Rh(g, q(mx0 - ow * 0.38), q(mY), q(ow * 0.76), 0.5, '#fbf8f2');
      G.Rh(g, q(mx0 - ow * 0.2), q(mY + oh - 0.5), q(ow * 0.4), 0.25, '#c0546a');
      G.Rq(g, mx0 - ow * 0.5 - 0.75, mY - 0.5, 1, 1, '#a04a62');
      G.Rq(g, mx0 + ow * 0.5 - 0.25, mY - 0.5, 1, 1, '#a04a62');
    } else {
      const wideS = (o.smile || A.hold) ? 1.24 : 1;
      const dip = (o.smile || A.hold) ? hdH * 0.06 : hdH * 0.03;
      const n2 = Math.max(4, Math.round(mW * wideS * 4));
      for (let i = 0; i < n2; i++) {
        const p2 = i / (n2 - 1);
        const yy = mY + Math.sin(p2 * Math.PI) * dip;
        G.Rh(g, q(mx0 - mW * wideS * 0.5 + p2 * mW * wideS), q(yy), 0.25, 0.5, '#a04a62');
        G.Rh(g, q(mx0 - mW * wideS * 0.5 + p2 * mW * wideS), q(yy + 0.5), 0.25, 0.25, '#ffd8e0');
      }
      // the ends turn up, which is the entire expression
      G.Rq(g, mx0 - mW * wideS * 0.5 - 0.5, mY - 0.5, 1, 1, '#a04a62');
      G.Rq(g, mx0 + mW * wideS * 0.5 - 0.25, mY - 0.5, 1, 1, '#a04a62');
      if (gene.teeth && (o.smile || A.hold))
        G.Rh(g, q(mx0 - mW * 0.3), q(mY + dip * 0.5), q(mW * 0.6), 0.25, '#fbf8f2');
    }
    if (o.onHead) o.onHead(g, { hcx, hyT, hdW, hdH, turn, eyY, eyX, eR, mY, nY, skin, skinD, skinL });
    facialHair(g, gene, hcx + turn * 0.7, hyT, hdW, hdH, hairC, mY, nY);
    hairFront(g, gene, hcx, hyT, hdW, hdH, hairC, turn);
    if ((o.hat || gene.hat) !== 'none') hat(g, o.hat || gene.hat, hcx, hyT, hdW, hdH, turn, gene);

    return { headTop: hyT, cx: hcx, hand: handR, pose: A, gene, hdH, hdW };
  };

  // ------------------------------------------------------------
  // WHAT THEY ARE CARRYING. Everybody in a real room has something in
  // one hand, and it is the cheapest character detail there is.
  // ------------------------------------------------------------
  function prop(g, kind, h, tot, gene, t) {
    if (!h) return;
    const x = q(h.x), y = q(h.y), u = (v) => q(tot * v);
    if (kind === 'bag') {
      const w = u(0.14), hh = u(0.17);
      G.Rh(g, x - w / 2 - 0.25, y + u(0.03) - 0.25, w + 0.5, hh + 0.5, OUT);
      G.Rh(g, x - w / 2, y + u(0.03), w, hh, gene.top2);
      G.Rh(g, x - w / 2, y + u(0.03), w, 0.5, G.shade(gene.top2, 0.4));
      G.Rh(g, x - w / 2, y + u(0.03) + hh - 0.5, w, 0.5, G.shade(gene.top2, -0.4));
      for (let i = 0; i < 3; i++)                          // a handle over the top
        G.Rq(g, x - w * 0.3 + i * w * 0.3, y + u(0.01), 1, 1, G.shade(gene.top2, -0.5));
      stitch(g, x - w / 2 + 0.5, y + u(0.03) + hh * 0.4, w - 1, G.shade(gene.top2, -0.3));
    } else if (kind === 'cup') {
      const w = u(0.075), hh = u(0.12);
      for (let j = 0; j < hh; j += 0.25) {
        const hw = (w / 2) * (0.74 + 0.26 * (1 - j / hh));
        G.Rh(g, x - hw - 0.25, y + j, hw * 2 + 0.5, 0.25, OUT);
        G.Rh(g, x - hw, y + j, hw * 2, 0.25, j < 0.75 ? '#fbf4e8' : '#e4d6c2');
      }
      G.Rh(g, x - w * 0.62, y - 0.5, w * 1.24, 0.75, '#c8505c');
      G.Rh(g, x + w * 0.1, y - u(0.05), 0.5, u(0.05), '#e8828c');
    } else if (kind === 'cone') {
      G.cone(g, x, y + u(0.11), { w: u(0.075), h: u(0.11) });
      ball(g, x, y + u(0.02), u(0.045), '#ffd9b0', OUT, 1);
    } else if (kind === 'phone') {
      const w = u(0.055), hh = u(0.09);
      G.Rh(g, x - w / 2 - 0.25, y - 0.25, w + 0.5, hh + 0.5, OUT);
      G.Rh(g, x - w / 2, y, w, hh, '#2a2a34');
      G.Rh(g, x - w / 2 + 0.25, y + 0.5, w - 0.5, hh - 1, Math.sin(t * 3) > -0.4 ? '#8fd8ff' : '#3a4a5c');
      G.glow(g, x, y + hh * 0.5, u(0.16), u(0.16), '#8fd8ff', 0.24);
    } else if (kind === 'lolly') {
      G.Rh(g, x - 0.25, y, 0.5, u(0.1), '#d8c4a0');
      ball(g, x, y - u(0.01), u(0.05), ['#ff8ab0', '#8fd8c0', '#ffd45a'][Math.floor(gene.ph) % 3], OUT, 1);
    } else if (kind === 'balloon') {
      // it wants to be over the head, or it is not a balloon
      const bx = x + Math.sin(t * 1.3 + gene.ph) * u(0.05), by = y - u(0.62);
      for (let i = 0; i < 14; i++)
        G.Rq(g, G.lerp(x, bx, i / 13), G.lerp(y, by + u(0.08), i / 13), 1, 1, '#c8b490');
      ball(g, bx, by, u(0.075), ['#e0574a', '#3a8ac8', '#ffd45a'][Math.floor(gene.ph * 2) % 3], OUT, 1);
      G.Rq(g, bx - 0.5, by + u(0.075), 1, 1, OUT);
    } else if (kind === 'brolly') {
      G.Rh(g, x - 0.25, y - u(0.3), 0.5, u(0.34), '#4a5568');
      for (let i = 0; i < 9; i++) {
        const dx = (i - 4) * u(0.038), dip = Math.abs(i - 4) * u(0.012);
        G.Rh(g, x + dx - u(0.022), y - u(0.31) + dip - 0.25, u(0.044), 0.75, OUT);
        G.Rh(g, x + dx - u(0.022), y - u(0.31) + dip, u(0.044), 0.5, i % 2 ? gene.top2 : '#f6ead8');
      }
      G.Rq(g, x - 0.5, y - u(0.33), 1, 1, '#8a6a44');
    } else if (kind === 'flowers') {
      // a wrap in the fist, stems out of the top of it
      G.Rh(g, q(x - u(0.035)) - 0.25, q(y - u(0.02)) - 0.25, q(u(0.07)) + 0.5, q(u(0.075)) + 0.5, OUT);
      G.Rh(g, q(x - u(0.035)), q(y - u(0.02)), q(u(0.07)), q(u(0.075)), '#f6ead8');
      G.Rh(g, q(x - u(0.035)), q(y - u(0.02)), q(u(0.07)), 0.25, '#ffffff');
      for (let i = 0; i < 4; i++) {
        const lean = (i - 1.5) * u(0.022);
        const fy = y - u(0.03);
        for (let k = 0; k < 8; k++)
          G.Rh(g, q(x + lean * (k / 7)), q(fy - k * u(0.014)), 0.5, u(0.02), '#6b9a4a');
        ball(g, x + lean, fy - u(0.1), u(0.03),
          ['#e0574a', '#f0a8bc', '#ffd45a', '#b48ae0'][i], OUT, 1);
      }
    }
  }

  // ------------------------------------------------------------
  // hair, in two layers so a bun sits behind and a fringe in front
  // ------------------------------------------------------------
  function hairBack(g, gene, cx, top, w, h, c, turn) {
    const s = gene.hairS, cd = G.shade(c, -0.3);
    if (s === 'bunwave') {
      ball(g, cx + turn * 0.3, top - h * 0.02, w * 0.19, '#cfc9bf', OUT, '#eeeae2');
      for (let i = 0; i < 3; i++)
        G.Rh(g, q(cx - w * 0.12 + i * w * 0.12 + turn * 0.3), q(top - h * 0.1), 0.25, q(h * 0.1), '#b6b0a6');
      G.Rh(g, q(cx - w * 0.07 + turn * 0.3), q(top - h * 0.05), q(w * 0.14), 0.25, '#c8a24a');
      return;
    }
    if (s === 'puff') ball(g, cx, top + h * 0.32, w * 0.66, cd, OUT);
    else if (s === 'bun') ball(g, cx + turn * 0.4, top - h * 0.02, w * 0.26, cd, OUT, G.shade(c, 0.2));
    else if (s === 'tails') for (const sd of [-1, 1])
      ball(g, cx + sd * w * 0.6 + turn * 0.3, top + h * 0.34, w * 0.22, cd, OUT, G.shade(c, 0.2));
    else if (s === 'curl') for (let i = 0; i < 5; i++)
      ball(g, cx - w * 0.4 + i * w * 0.2 + turn * 0.3, top + h * 0.04, w * 0.14, cd, OUT);
    else if (s === 'spike') {
      for (let i = 0; i < 5; i++) {
        const sx = cx - w * 0.36 + i * w * 0.18 + turn * 0.3;
        const sh = h * (0.16 + (i % 2) * 0.1);
        const n = Math.max(2, Math.round(sh * 4));
        for (let j = 0; j < n; j++) {
          const hw = Math.max(0.25, w * 0.09 * (j / n));
          G.Rh(g, q(sx - hw) - 0.25, q(top + h * 0.1 - sh + j * 0.25), q(hw * 2) + 0.5, 0.25, OUT);
        }
        for (let j = 0; j < n; j++) {
          const hw = Math.max(0.25, w * 0.09 * (j / n));
          G.Rh(g, q(sx - hw), q(top + h * 0.1 - sh + j * 0.25), q(hw * 2), 0.25, cd);
        }
      }
    }
  }
  function hairFront(g, gene, cx, top, w, h, c, turn) {
    const s = gene.hairS, cl = G.shade(c, 0.34);
    if (s === 'bunwave') {
      // a soft silver set: a shallow cap, a scalloped hairline, two wisps
      const base = '#ded8ce', hi = '#f6f2ea', lo = '#b6b0a6';
      const rows = Math.max(3, Math.round(h * 0.22 * 4));
      const W = [];
      for (let i = 0; i < rows; i++) {
        const p2 = (i + 0.5) / rows;
        W.push(Math.max(0.5, q(w * 0.5 * Math.sqrt(Math.max(0.05, 1 - Math.pow((1 - p2) * 0.92, 2))) * 1.06)));
      }
      for (let i = 0; i < rows; i++) G.Rh(g, q(cx - W[i] + turn * 0.35) - 0.25, q(top - 0.25 + i * 0.25), W[i] * 2 + 0.5, 0.25, OUT);
      for (let i = 0; i < rows; i++)
        G.Rh(g, q(cx - W[i] + turn * 0.35), q(top - 0.25 + i * 0.25), W[i] * 2, 0.25, i < rows * 0.4 ? hi : base);
      const fy2 = top - 0.25 + rows * 0.25;
      // a scalloped hairline: outlines in one pass, fills in the next,
      // so the curls merge into one soft edge instead of six beads
      const cur = [];
      for (let i = 0; i < 6; i++) cur.push(cx - w * 0.4 + i * w * 0.16 + turn * 0.35);
      for (const bx of cur) ball(g, bx, fy2 - w * 0.02, w * 0.095, OUT, null);
      for (const bx of cur) ball(g, bx, fy2 - w * 0.03, w * 0.085, base, null, hi);
      for (let i = 0; i < 4; i++)                      // combed strands
        G.Rh(g, q(cx - w * 0.3 + i * w * 0.2 + turn * 0.35), q(top + h * 0.02), 0.25, q(h * 0.09), lo);
      for (const sd of [-1, 1])                        // the wisps she never gets in
        G.Rh(g, q(cx + sd * w * 0.45 + turn * 0.3) - (sd > 0 ? q(w * 0.08) : 0), q(top + h * 0.12), q(w * 0.08), q(h * 0.26), base);
      return;
    }
    if (s === 'bald') {
      G.Rh(g, q(cx - w * 0.2 + turn * 0.4), q(top + h * 0.1), q(w * 0.24), 0.5, G.shade(gene.skin, 0.5));
      if (gene.old) for (const sd of [-1, 1])
        G.Rh(g, q(cx + sd * w * 0.42 + turn * 0.3), q(top + h * 0.2), q(w * 0.1), q(h * 0.18), c);
      return;
    }
    if (s === 'combover') {
      for (let i = 0; i < 6; i++)
        G.Rh(g, q(cx - w * 0.42 + turn * 0.3), q(top + h * 0.08 + i * 0.5), q(w * (0.5 + i * 0.06)), 0.5, i < 2 ? cl : c);
      return;
    }
    // everyone else gets a cap of hair over the crown
    const depth = s === 'bowl' ? 0.36 : s === 'mop' ? 0.3 : s === 'flat' ? 0.2 : 0.26;
    const n = Math.max(3, Math.round(h * depth * 4));
    const W = [];
    for (let i = 0; i < n; i++) {
      const p = (i + 0.5) / n;
      W.push(Math.max(0.5, q(w * 0.5 * Math.sqrt(Math.max(0.04, 1 - Math.pow((1 - p) * 0.9, 2))) * 1.06)));
    }
    for (let i = 0; i < n; i++) G.Rh(g, q(cx - W[i] + turn * 0.35) - 0.25, q(top - 0.25 + i * 0.25), W[i] * 2 + 0.5, 0.25, OUT);
    for (let i = 0; i < n; i++) {
      G.Rh(g, q(cx - W[i] + turn * 0.35), q(top - 0.25 + i * 0.25), W[i] * 2, 0.25, i < n * 0.3 ? cl : c);
    }
    // the fringe: flat for a bowl, ragged for a mop
    const fy = top - 0.25 + n * 0.25;
    if (s === 'mop') {
      for (let i = 0; i < 7; i++) {
        const fx = cx - w * 0.44 + i * w * 0.145 + turn * 0.35;
        const fh = h * (0.05 + G.hash(i * 3.3, gene.seed) * 0.13);
        G.Rh(g, q(fx) - 0.25, q(fy) - 0.25, q(w * 0.13) + 0.5, q(fh) + 0.5, OUT);
        G.Rh(g, q(fx), q(fy), q(w * 0.13), q(fh), c);
      }
    } else if (s === 'bowl') {
      G.Rh(g, q(cx - w * 0.48 + turn * 0.35) - 0.25, q(fy) - 0.25, q(w * 0.96) + 0.5, q(h * 0.06) + 0.5, OUT);
      G.Rh(g, q(cx - w * 0.48 + turn * 0.35), q(fy), q(w * 0.96), q(h * 0.06), c);
    } else if (s === 'flat') {
      G.Rh(g, q(cx - w * 0.48 + turn * 0.35), q(fy - 0.5), q(w * 0.4), 0.5, cl);
    }
    for (const sd of [-1, 1])                            // sideburns down past the ear
      G.Rh(g, q(cx + sd * w * 0.46 + turn * 0.3) - (sd > 0 ? q(w * 0.08) : 0), q(top + h * 0.16), q(w * 0.08), q(h * 0.2), c);
  }
  function facialHair(g, gene, cx, top, w, h, c, mY, nY) {
    const f = gene.facial;
    if (f === 'none') return;
    const cd = G.shade(c, -0.16);
    if (f === 'stache' || f === 'beard' || f === 'chops') {
      G.Rh(g, q(cx - w * 0.15), q(nY + h * 0.04), q(w * 0.3), q(h * 0.045), cd);
      G.Rh(g, q(cx - w * 0.19), q(nY + h * 0.05), q(w * 0.05), q(h * 0.03), cd);
      G.Rh(g, q(cx + w * 0.14), q(nY + h * 0.05), q(w * 0.05), q(h * 0.03), cd);
    }
    if (f === 'beard') {
      body(g, cx, mY + h * 0.02, h * 0.2, (p) => w * 0.3 * (1 - p * 0.45), cd);
    } else if (f === 'chops') {
      for (const sd of [-1, 1]) G.Rh(g, q(cx + sd * w * 0.36 - (sd > 0 ? q(w * 0.1) : 0)), q(top + h * 0.5), q(w * 0.1), q(h * 0.24), cd);
    } else if (f === 'stubble') {
      g.globalAlpha = 0.34;
      G.Rh(g, q(cx - w * 0.3), q(mY - h * 0.03), q(w * 0.6), q(h * 0.16), '#3a2a2a');
      g.globalAlpha = 1;
    }
  }
  function specs(g, gene, cx, ey, eyX, eR, w) {
    const rim = gene.specs === 'half' ? '#6b4a2a' : '#2a2a34', r = eR * 1.5;
    for (const sd of [-1, 1]) {
      const ex = cx + sd * eyX;
      if (gene.specs === 'half') {
        // half-moons: a lens under each eye, gold, worn down the nose
        const lw = r * 1.05, lh = eR * 0.95, ly = ey + eR * 0.15;
        G.Rh(g, q(ex - lw), q(ly), q(lw * 2), 0.25, rim);            // straight top
        const rows = Math.max(2, Math.round(lh * 4));
        for (let j = 1; j <= rows; j++) {
          const hw = Math.max(0.25, q(lw * Math.sqrt(Math.max(0, 1 - Math.pow(j / rows, 2)))));
          G.Rh(g, q(ex - hw), q(ly + j * 0.25), 0.25, 0.25, rim);
          G.Rh(g, q(ex + hw - 0.25), q(ly + j * 0.25), 0.25, 0.25, rim);
          g.globalAlpha = 0.18;
          G.Rh(g, q(ex - hw), q(ly + j * 0.25), q(hw * 2), 0.25, '#cfe4ff');
          g.globalAlpha = 1;
          if (j === rows) G.Rh(g, q(ex - hw), q(ly + j * 0.25), q(hw * 2), 0.25, rim);
        }
        G.Rh(g, q(ex + sd * lw), q(ly), q(w * 0.09), 0.25, rim);     // temple arm
        continue;
      }
      // A RIM, not a lens. The eye behind it is the character; a filled
      // pane over a dark round is just a dark round with a smudge on it.
      if (gene.specs === 'round') {
        const n2 = 22;
        for (let k = 0; k < n2; k++) {
          const a2 = (k / n2) * Math.PI * 2;
          G.Rq(g, ex + Math.cos(a2) * r, ey + eR * 0.1 + Math.sin(a2) * r, 1, 1, rim);
        }
      } else {
        G.Rh(g, q(ex - r), q(ey - r * 0.75), q(r * 2), 0.25, rim);
        G.Rh(g, q(ex - r), q(ey + r * 0.65), q(r * 2), 0.25, rim);
        G.Rh(g, q(ex - r), q(ey - r * 0.75), 0.25, q(r * 1.4), rim);
        G.Rh(g, q(ex + r - 0.25), q(ey - r * 0.75), 0.25, q(r * 1.4), rim);
      }
      // one glint across the glass, which is all you need
      G.Rq(g, ex - r * 0.45, ey - r * 0.45, 1, 1, '#ffffff');
      G.Rq(g, ex - r * 0.2, ey - r * 0.2, 1, 1, '#e8f2ff');
      G.Rh(g, q(ex + sd * r), q(ey), q(w * 0.1), 0.25, rim);
    }
    G.Rh(g, q(cx - eyX * 0.4), q(ey), q(eyX * 0.8), 0.25, rim);
  }
  function hat(g, kind, cx, top, w, h, turn, gene) {
    const hx = cx + turn * 0.35;
    if (kind === 'cap') {
      const c = gene.top2;
      body(g, hx, top - h * 0.16, h * 0.22, (p) => w * 0.5 * (0.7 + p * 0.32), c);
      G.Rh(g, q(hx - w * 0.1), q(top + h * 0.05) - 0.25, q(w * 0.62) + 0.5, q(h * 0.05) + 0.5, OUT);
      G.Rh(g, q(hx - w * 0.1), q(top + h * 0.05), q(w * 0.62), q(h * 0.05), G.shade(c, -0.2));
      ball(g, hx, top - h * 0.16, w * 0.05, G.shade(c, 0.4), null);
    } else if (kind === 'beanie') {
      const c = gene.top2;
      body(g, hx, top - h * 0.14, h * 0.3, (p) => w * 0.5 * (0.62 + p * 0.42), c);
      G.Rh(g, q(hx - w * 0.5), q(top + h * 0.08), q(w), q(h * 0.07), G.shade(c, 0.2));
      ball(g, hx, top - h * 0.2, w * 0.11, '#f6f2e6', OUT);
    } else if (kind === 'crown') {
      const c = '#f0c04a';
      const n = 5;
      for (let i = 0; i < n; i++) {
        const sx = hx - w * 0.44 + i * w * 0.22;
        const sh = h * 0.15;
        const rows = Math.max(2, Math.round(sh * 4));
        for (let j = 0; j < rows; j++) {
          const hw = Math.max(0.25, w * 0.09 * (j / rows));
          G.Rh(g, q(sx - hw) - 0.25, q(top - sh + j * 0.25), q(hw * 2) + 0.5, 0.25, OUT);
        }
        for (let j = 0; j < rows; j++) {
          const hw = Math.max(0.25, w * 0.09 * (j / rows));
          G.Rh(g, q(sx - hw), q(top - sh + j * 0.25), q(hw * 2), 0.25, c);
        }
      }
      G.Rh(g, q(hx - w * 0.5) - 0.25, q(top - 0.25), q(w) + 0.5, q(h * 0.1) + 0.5, OUT);
      G.Rh(g, q(hx - w * 0.5), q(top), q(w), q(h * 0.1), c);
      G.Rh(g, q(hx - w * 0.5), q(top), q(w), 0.25, '#ffe6a0');
      G.Rh(g, q(hx - w * 0.1), q(top + h * 0.03), q(w * 0.2), 0.5, '#c8383a');
    } else if (kind === 'party') {
      const c = gene.top2, sh = h * 0.38;
      const rows = Math.max(3, Math.round(sh * 4));
      for (let j = 0; j < rows; j++) {
        const hw = Math.max(0.25, w * 0.3 * (j / rows));
        G.Rh(g, q(hx - hw) - 0.25, q(top - sh + j * 0.25), q(hw * 2) + 0.5, 0.25, OUT);
      }
      for (let j = 0; j < rows; j++) {
        const hw = Math.max(0.25, w * 0.3 * (j / rows));
        G.Rh(g, q(hx - hw), q(top - sh + j * 0.25), q(hw * 2), 0.25, (j >> 1) % 2 ? c : '#f6f2e6');
      }
      ball(g, hx, top - sh, w * 0.09, '#e07aa8', OUT);
    }
  }

  // ------------------------------------------------------------
  // TRACY. Not a seed - a person. Seventy-odd, four foot eleven in
  // her shoes, silver bun, half-moons worn down the nose, and an
  // apron she has been making gelato in since before the machines
  // could hold a scoop. Same rig as everybody else so she stands in
  // the same world, with her own clothes layered over the top.
  // ------------------------------------------------------------
  const TRACY = {
    seed: 1001, kid: false, old: true,
    h: 0.84, girth: 1.2, head: 1.3, wide: 1.02, skull: 'round',
    legL: 0.86, armL: 0.94, neck: 0.34, belly: true, stoop: 0.55,
    nose: 'button', eye: 1.18, gap: 0.98, brow: -0.25, ears: 0.95,
    teeth: true, freck: false, blush: true, specs: 'half', facial: 'none',
    skin: '#f2cdaa',
    hairS: 'bunwave', hairC: '#eae6de',
    topKind: 'cardi', top: '#d98ba6', top2: '#f7e8ec', bottom: '#5f6f8c',
    shorts: false, shoe: '#7a4a34', shoeSz: 1.0, hat: 'none',
    quirk: 'rock', ph: 1.2, sp: 0.85,
  };
  G.TRACY = TRACY;

  G.drawTracy = function (g, x, footY, scale, o) {
    o = o || {};
    const t = o.t || 0;
    const opts = Object.assign({}, o, {
      gene: TRACY,
      // ---- the apron. Mint stripes, a cone patch and two deep pockets ----
      onTorso(g2, c) {
        // cut to the shape of her, one pixel inside the outline
        const y0 = c.torT + c.torHn * 0.36, ah = c.torHn * 0.62;
        const rows = Math.max(3, Math.round(ah * 4));
        const ay = y0, aw = c.torHw(0.6) * 2;
        for (let i = 0; i < rows; i++) {
          const yy = y0 + i * 0.25;
          const hw = Math.max(0.5, q(c.torHw((yy - c.torT) / c.torHn) * 0.82));
          G.Rh(g2, q(c.cxT - hw), q(yy), hw * 2, 0.25, '#fbf4e8');
          for (let k = 0; k < 5; k++) {
            const sx = c.cxT - hw + hw * 0.36 * k + hw * 0.12;
            if (sx + hw * 0.12 < c.cxT + hw) G.Rh(g2, q(sx), q(yy), Math.max(0.25, q(hw * 0.14)), 0.25, '#bfe4d4');
          }
          if (i === 0 || i === rows - 1) G.Rh(g2, q(c.cxT - hw), q(yy), hw * 2, 0.25, '#e2d6c2');
        }
        const ax = c.cxT - aw * 0.5;
        // the bib strap up over one shoulder
        G.Rh(g2, q(c.cxT - c.tW * 0.44), q(c.torT + c.torHn * 0.08), 0.5, q(c.torHn * 0.3), '#fbf4e8');
        G.Rh(g2, q(c.cxT + c.tW * 0.38), q(c.torT + c.torHn * 0.08), 0.5, q(c.torHn * 0.3), '#fbf4e8');
        // waistband and a bow at the hip
        G.Rh(g2, q(ax), q(ay + ah * 0.22), q(aw), 0.75, '#e3a9bd');
        G.Rh(g2, q(ax - 0.5), q(ay + ah * 0.2), 1.25, 1.5, '#e3a9bd');
        // pocket
        G.Rh(g2, q(c.cxT + c.tW * 0.06), q(ay + ah * 0.46), q(c.tW * 0.42), q(ah * 0.34), '#f0e4d2');
        G.Rh(g2, q(c.cxT + c.tW * 0.06), q(ay + ah * 0.46), q(c.tW * 0.42), 0.25, '#d8c6ae');
        // and the cone she embroidered on it herself, badly
        const px = c.cxT - c.tW * 0.3, py = ay + ah * 0.5;
        ball(g2, px, py - c.tW * 0.14, c.tW * 0.16, '#f6c8d8', null, '#ffe6ee');
        for (let i = 0; i < 4; i++)
          G.Rh(g2, q(px - c.tW * (0.14 - i * 0.035)), q(py - c.tW * 0.02 + i * 0.5),
            q(c.tW * (0.28 - i * 0.07)), 0.5, '#e0b070');
      },
      // ---- the chain on her glasses, and the lines round her eyes ----
      onHead(g2, c) {
        const r = c.eR * 1.5;
        for (const sd of [-1, 1]) {
          const ex = c.hcx + sd * c.eyX + c.turn * 0.7;
          for (let i = 0; i < 4; i++)
            G.Rq(g2, ex + sd * (r + 0.25 + i * 0.25), c.eyY + c.eR * (0.7 + i * 0.5), 1, 1, '#c8a24a');
          // crow's feet, because she has laughed a lot
          G.Rq(g2, ex + sd * (r + 0.5), c.eyY, 1, 1, c.skinD);
          G.Rq(g2, ex + sd * (r + 0.75), c.eyY + 0.5, 1, 1, c.skinD);
        }
        // hairpins in the bun
        G.Rh(g2, q(c.hcx - c.hdW * 0.1 + c.turn * 0.4), q(c.hyT - c.hdH * 0.14), q(c.hdW * 0.2), 0.25, '#c8a24a');
      },
    });
    const r = G.drawFolk(g, x, footY, scale, opts);
    // a cone in the free hand, if the shot wants one
    if (o.cone && r.hand) G.cone(g, r.hand.x, r.hand.y + r.hdH * 0.1, { w: r.hdW * 0.42, h: r.hdH * 0.6 });
    if (o.torch && r.hand) {
      G.Rh(g, q(r.hand.x - r.hdW * 0.06), q(r.hand.y - r.hdH * 0.1), q(r.hdW * 0.12), q(r.hdH * 0.3), '#4a5568');
      G.glow(g, r.hand.x, r.hand.y - r.hdH * 0.2, r.hdW * 4, r.hdH * 3, '#ffd47a', 0.55);
    }
    return r;
  };

  // expose the small parts, because Tracy and the shop crowd want them
  G.folkBall = ball;
  G.folkBody = body;
  G.folkNoodle = noodle;
})();

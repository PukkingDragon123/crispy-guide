// ============================================================
// DOUBLE LIFE v10 - dump.js  ·  THE WASTELAND
//
// The first thing you do in this game is cross two miles of tip on
// your hands, because you do not have anything else.
//
// You are a head, a torn-off tank and two arms. PRESS where you want
// a hand and it reaches out and sinks into the muck. Then DRAG BACK
// and it hauls you toward itself - both axes, so that is also how you
// get over a mound. Let go mid-haul and you keep the momentum.
//
// Two hands, so you can plant one, pull, plant the other and walk on
// them; or plant both and vault. Nothing here is a cliff. Everything
// here is a slope you can slide back down.
//
// The tip is generated: forty kinds of rubbish scattered across a
// heightfield, three parallax ranges of mountains of it behind, and
// twelve things that came off the lorry whole and are lying on top.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  // ------------------------------------------------------------
  // A BOX. Every piece of rubbish is made of these: an outline, a
  // body, a lit top edge and a shaded bottom. Three calls, and the
  // heap reads as solid instead of as noise.
  // ------------------------------------------------------------
  function bx(g, x, y, w, h, c, o) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    if (w < 1 || h < 1) return;
    G.R(g, x - 1, y - 1, w + 2, h + 2, OUT);
    G.R(g, x, y, w, h, c);
    if (h > 1) G.R(g, x, y, w, 1, G.shade(c, 0.34));
    if (h > 2) G.R(g, x, y + h - 1, w, 1, G.shade(c, -0.4));
    if (w > 2 && h > 2) G.R(g, x + w - 1, y + 1, 1, h - 2, G.shade(c, -0.26));
    if (o && o.grain && w > 3 && h > 3) G.grain(g, x + 1, y + 1, w - 2, h - 2, G.shade(c, -0.5), 0.14, o.grain);
  }
  // a leaning bar: a plank, a pipe, a length of rebar
  function bar(g, x, y, len, th, tilt, c) {
    for (let q = 0; q < len; q++) {
      const xx = x + q * tilt, yy = y - q;
      G.R(g, Math.round(xx) - 1, Math.round(yy), th + 2, 1, OUT);
      G.R(g, Math.round(xx), Math.round(yy), th, 1, q < 2 ? G.shade(c, 0.45) : q > len - 3 ? G.shade(c, -0.4) : c);
    }
  }

  // ------------------------------------------------------------
  // THE RUBBISH. Forty painters. Each draws around (x, y) with y at
  // the bottom of the piece, at scale s, tinted toward the depth of
  // the pit by the caller.
  // ------------------------------------------------------------
  const JUNK = {
    crt(g, x, y, s, c, sd) {
      const w = Math.round(15 * s), h = Math.round(13 * s);
      bx(g, x - w / 2, y - h, w, h, c, { grain: sd });
      bx(g, x - w / 2 + 2, y - h + 2, w - 5, h - 6, G.mix('#0d1420', c, 0.25));
      G.Rh(g, x - w / 2 + 3, y - h + 3, (w - 7) * 0.5, 1, G.shade(c, 0.5));
      for (let k = 0; k < 2; k++) G.oc(g, x + w / 2 - 2, y - h + 3 + k * 4, 1, G.shade(c, 0.4));
      G.R(g, x - 1, y - h - Math.round(7 * s), 1, Math.round(7 * s), G.shade(c, 0.2));
      G.R(g, x - Math.round(4 * s), y - h - Math.round(7 * s), Math.round(8 * s), 1, G.shade(c, 0.3));
    },
    fridge(g, x, y, s, c, sd) {
      const w = Math.round(13 * s), h = Math.round(26 * s);
      bx(g, x - w / 2, y - h, w, h, G.mix('#c8ccd0', c, 0.55), { grain: sd });
      G.R(g, x - w / 2, y - h + Math.round(h * 0.34), w, 1, G.shade(c, -0.5));
      G.Rh(g, x + w / 2 - 3, y - h + Math.round(h * 0.14), 1.5, Math.round(h * 0.16), G.shade(c, -0.6));
      G.Rh(g, x + w / 2 - 3, y - h + Math.round(h * 0.46), 1.5, Math.round(h * 0.2), G.shade(c, -0.6));
      G.grain(g, x - w / 2 + 1, y - h + 2, w - 2, h - 4, '#5a4a2a', 0.1, sd + 3);
    },
    barrel(g, x, y, s, c, sd) {
      const w = Math.round(12 * s), h = Math.round(17 * s);
      const dent = G.hash(sd, 3) > 0.6 ? 1 : 0;
      for (let j = 0; j < h; j++) {
        const p = j / (h - 1);
        const hw = Math.max(1, Math.round((w / 2) * (1 - (dent ? Math.exp(-Math.pow((p - 0.55) * 4, 2)) * 0.34 : 0))));
        G.R(g, x - hw - 1, y - h + j, hw * 2 + 2, 1, OUT);
        G.R(g, x - hw, y - h + j, hw * 2, 1, j < 2 ? G.shade(c, 0.34) : p > 0.9 ? G.shade(c, -0.4) : c);
      }
      for (let k = 1; k < 3; k++) G.R(g, x - w / 2, y - h + Math.round(h * k / 3), w, 1, G.shade(c, -0.45));
      G.grain(g, x - w / 2 + 1, y - h + 3, w - 2, h - 6, '#6b3f22', 0.2, sd);
    },
    crate(g, x, y, s, c, sd) {
      const w = Math.round(18 * s), h = Math.round(12 * s);
      bx(g, x - w / 2, y - h, w, h, G.mix('#7a5c3a', c, 0.4), { grain: sd });
      for (let k = 1; k < 3; k++) G.R(g, x - w / 2, y - h + Math.round(h * k / 3), w, 1, G.shade(c, -0.42));
      G.R(g, x - w / 2, y - h, 1, h, G.shade(c, 0.3));
      G.Rh(g, x - w * 0.24, y - h * 0.62, w * 0.4, 2, G.shade(c, -0.55));
    },
    pallet(g, x, y, s, c, sd) {
      const w = Math.round(22 * s), h = Math.round(7 * s);
      for (let k = 0; k < 3; k++)
        bx(g, x - w / 2, y - h + k * Math.round(h / 3), w, Math.max(1, Math.round(h / 4)), G.mix('#8a6a44', c, 0.4));
      for (const d of [-1, 1]) G.R(g, x + d * (w / 2 - 2), y - h, 2, h, G.shade(c, -0.3));
    },
    pipe(g, x, y, s, c, sd) {
      const len = Math.round(24 * s), th = Math.max(2, Math.round(4 * s));
      const tilt = (G.hash(sd, 5) - 0.5) * 0.9;
      for (let q = 0; q < len; q++) {
        const xx = x - len * 0.5 + q, yy = y - q * tilt;
        G.R(g, Math.round(xx), Math.round(yy) - 1, 1, th + 2, OUT);
        G.R(g, Math.round(xx), Math.round(yy), 1, th, c);
        G.R(g, Math.round(xx), Math.round(yy), 1, 1, G.shade(c, 0.45));
      }
      for (const d of [0, 1]) {
        const xx = x - len * 0.5 + d * (len - 2), yy = y - (d * (len - 2)) * tilt;
        bx(g, xx - 1, yy - 1, 3, th + 2, G.shade(c, 0.15));
      }
    },
    girder(g, x, y, s, c, sd) {
      const len = Math.round(30 * s), th = Math.max(3, Math.round(6 * s));
      const tilt = (G.hash(sd, 9) - 0.5) * 0.6;
      for (let q = 0; q < len; q++) {
        const xx = x - len * 0.5 + q, yy = y - q * tilt;
        G.R(g, Math.round(xx), Math.round(yy) - 1, 1, th + 2, OUT);
        G.R(g, Math.round(xx), Math.round(yy), 1, th, q % 7 === 3 ? G.shade(c, -0.3) : c);
        G.R(g, Math.round(xx), Math.round(yy), 1, 1, G.shade(c, 0.4));
        G.R(g, Math.round(xx), Math.round(yy) + th - 1, 1, 1, G.shade(c, -0.45));
        if (q % 9 === 4) G.R(g, Math.round(xx), Math.round(yy) + 1, 1, th - 2, G.shade(c, -0.55));
      }
    },
    sofa(g, x, y, s, c, sd) {
      const w = Math.round(28 * s), h = Math.round(13 * s);
      bx(g, x - w / 2, y - h, w, h, G.mix('#6b4a5a', c, 0.4), { grain: sd });
      bx(g, x - w / 2, y - h - Math.round(6 * s), w * 0.9, Math.round(7 * s), G.mix('#7a5468', c, 0.4));
      for (let k = 0; k < 3; k++)
        G.R(g, x - w * 0.3 + k * w * 0.3, y - h - Math.round(2 * s), 1, Math.round(3 * s), G.shade(c, -0.5));
      for (let k = 0; k < 3; k++) {                    // springs, burst out of it
        const sx2 = x - w * 0.24 + k * w * 0.24;
        for (let q = 0; q < 5; q++)
          G.Rh(g, sx2 + Math.sin(q * 1.7 + k) * 2, y - h - 2 - q * 1.5, 1, 1, G.shade(c, 0.55));
      }
    },
    mattress(g, x, y, s, c, sd) {
      const w = Math.round(30 * s), h = Math.round(7 * s);
      const tilt = (G.hash(sd, 11) - 0.5) * 0.5;
      for (let q = 0; q < w; q++) {
        const yy = y - h - q * tilt;
        G.R(g, x - w / 2 + q, Math.round(yy) - 1, 1, h + 2, OUT);
        G.R(g, x - w / 2 + q, Math.round(yy), 1, h, q % 6 < 3 ? G.mix('#c8bca8', c, 0.5) : G.mix('#a89c88', c, 0.5));
        G.R(g, x - w / 2 + q, Math.round(yy), 1, 1, G.shade(c, 0.5));
      }
      G.grain(g, x - w * 0.3, y - h - 1, w * 0.5, h, '#5a3a28', 0.24, sd);
    },
    bag(g, x, y, s, c, sd) {
      const w = Math.round(13 * s), h = Math.round(12 * s);
      for (let j = 0; j < h; j++) {
        const p = j / (h - 1);
        const hw = Math.max(1, Math.round((w / 2) * (0.34 + 0.66 * Math.sin(Math.min(1, p * 1.25) * Math.PI * 0.62 + 0.4))));
        G.R(g, x - hw - 1, y - h + j, hw * 2 + 2, 1, OUT);
        G.R(g, x - hw, y - h + j, hw * 2, 1, j < 2 ? G.shade(c, 0.3) : p > 0.86 ? G.shade(c, -0.42) : c);
      }
      G.R(g, x - 2, y - h - Math.round(3 * s), 4, Math.round(3 * s), G.shade(c, -0.2));
      G.Rh(g, x - 3, y - h - Math.round(3 * s), 6, 1, G.shade(c, 0.3));
      G.Rh(g, x - w * 0.2, y - h * 0.5, w * 0.3, 1, G.shade(c, 0.4));
    },
    cans(g, x, y, s, c, sd) {
      for (let k = 0; k < 4; k++) {
        const cx2 = x + (G.hash(sd, k * 3.1) - 0.5) * 14 * s;
        const cy2 = y - Math.floor(k / 2) * Math.round(4 * s);
        const cw = Math.max(2, Math.round(4 * s)), ch = Math.max(2, Math.round(5 * s));
        bx(g, cx2, cy2 - ch, cw, ch, k % 2 ? G.mix('#c04a3a', c, 0.4) : G.mix('#3a8ac0', c, 0.4));
        G.R(g, cx2, cy2 - ch, cw, 1, G.shade(c, 0.6));
      }
    },
    bottle(g, x, y, s, c, sd) {
      for (let k = 0; k < 3; k++) {
        const cx2 = x + (k - 1) * Math.round(5 * s), bh = Math.round((8 + k * 2) * s);
        bx(g, cx2 - 1, y - bh, Math.max(2, Math.round(3 * s)), bh, G.mix(k === 1 ? '#3f6b5c' : '#6b5c3a', c, 0.35));
        G.R(g, cx2, y - bh - Math.round(3 * s), 1, Math.round(3 * s), G.shade(c, 0.2));
        G.Rh(g, cx2 - 1, y - bh + 1, 1, bh * 0.4, G.shade(c, 0.55));
      }
    },
    chair(g, x, y, s, c, sd) {
      const w = Math.round(11 * s), h = Math.round(9 * s);
      bx(g, x - w / 2, y - h, w, Math.max(2, Math.round(2.5 * s)), G.mix('#8a6a44', c, 0.4));
      bar(g, x - w / 2, y - h, Math.round(11 * s), Math.max(2, Math.round(2 * s)), 0.18, G.mix('#8a6a44', c, 0.4));
      for (const d of [-1, 1]) G.R(g, x + d * (w / 2 - 1), y - h + 2, Math.max(1, Math.round(2 * s)), h - 2, G.shade(c, -0.2));
    },
    washer(g, x, y, s, c, sd) {
      const w = Math.round(15 * s), h = Math.round(16 * s);
      bx(g, x - w / 2, y - h, w, h, G.mix('#c8ccd0', c, 0.5), { grain: sd });
      G.oc(g, x, y - h * 0.5, Math.max(2, Math.round(4.5 * s)) + 1, OUT);
      G.oc(g, x, y - h * 0.5, Math.max(2, Math.round(4.5 * s)), G.mix('#1a2028', c, 0.4));
      G.oc(g, x, y - h * 0.5, Math.max(1, Math.round(2.5 * s)), G.mix('#3a4450', c, 0.4));
      for (let k = 0; k < 3; k++) G.Rh(g, x - w * 0.3 + k * 3, y - h + 2, 1.5, 1.5, G.shade(c, -0.5));
    },
    cone(g, x, y, s, c, sd) {
      const h = Math.round(11 * s), w = Math.round(9 * s);
      for (let j = 0; j < h; j++) {
        const p = j / (h - 1);
        const hw = Math.max(1, Math.round((w / 2) * (0.16 + 0.84 * p)));
        G.R(g, x - hw - 1, y - h + j, hw * 2 + 2, 1, OUT);
        G.R(g, x - hw, y - h + j, hw * 2, 1,
          p > 0.42 && p < 0.62 ? G.mix('#f0f0f0', c, 0.4) : G.mix('#e0602a', c, 0.35));
      }
      bx(g, x - w / 2 - 1, y - 2, w + 2, 2, G.mix('#e0602a', c, 0.35));
    },
    trolley(g, x, y, s, c, sd) {
      const w = Math.round(20 * s), h = Math.round(12 * s);
      G.R(g, x - w / 2 - 1, y - h - 1, w + 2, h + 2, OUT);
      for (let k = 0; k <= 4; k++) G.R(g, x - w / 2 + k * (w / 4), y - h, 1, h, G.mix('#8a93ad', c, 0.35));
      for (let k = 0; k <= 3; k++) G.R(g, x - w / 2, y - h + k * (h / 3), w, 1, G.mix('#8a93ad', c, 0.35));
      for (const d of [-1, 1]) G.oc(g, x + d * (w / 2 - 2), y + 1, Math.max(1, Math.round(2 * s)), G.shade(c, -0.4));
    },
    botarm(g, x, y, s, c, sd) {
      const len = Math.round(18 * s), th = Math.max(2, Math.round(4 * s));
      const tilt = (G.hash(sd, 13) - 0.5) * 1.1;
      bar(g, x - len * 0.3, y, len, th, tilt, G.mix('#8a93ad', c, 0.3));
      const ex = x - len * 0.3 + len * tilt, ey = y - len;
      bx(g, ex - 1, ey - Math.round(4 * s), th + 2, Math.round(4 * s), G.mix('#5c6a86', c, 0.3));
      for (let k = 0; k < 3; k++)
        G.R(g, Math.round(ex + k * 2 - 2), Math.round(ey - Math.round(6 * s)), 1, Math.round(3 * s), G.mix('#c2cbe0', c, 0.3));
      G.Rh(g, x - len * 0.3, y - 1, 3, 2, '#6b3f22');
    },
    bothead(g, x, y, s, c, sd) {
      const w = Math.round(12 * s), h = Math.round(11 * s);
      bx(g, x - w / 2, y - h, w, h, G.mix('#7a8298', c, 0.35), { grain: sd });
      for (const d of [-1, 1]) {
        G.oc(g, x + d * w * 0.24, y - h * 0.62, Math.max(1, Math.round(2 * s)) + 1, OUT);
        G.oc(g, x + d * w * 0.24, y - h * 0.62, Math.max(1, Math.round(2 * s)),
          G.hash(sd, 17) > 0.7 && d > 0 ? G.mix('#ff5d84', c, 0.2) : G.mix('#1a2028', c, 0.3));
      }
      G.Rh(g, x - w * 0.3, y - h * 0.24, w * 0.6, 1.5, G.shade(c, -0.5));
      for (let k = 0; k < 3; k++) G.Rh(g, x - w * 0.2 + k * 2.4, y - h * 0.24, 1, 1.5, G.shade(c, 0.2));
    },
    bottorso(g, x, y, s, c, sd) {
      const w = Math.round(16 * s), h = Math.round(15 * s);
      bx(g, x - w / 2, y - h, w, h, G.mix('#6b7488', c, 0.35), { grain: sd });
      G.R(g, x - w * 0.28, y - h * 0.7, Math.round(w * 0.56), Math.round(h * 0.44), G.mix('#12151d', c, 0.4));
      for (let k = 0; k < 4; k++)
        G.Rh(g, x - w * 0.24 + k * (w * 0.16), y - h * 0.62 + Math.sin(k * 2 + sd) * 2, 1, Math.round(h * 0.3), G.mix('#3a5a7a', c, 0.3));
      G.Rh(g, x - w * 0.2, y - h + 1, w * 0.4, 1, G.shade(c, 0.5));
    },
    spring(g, x, y, s, c, sd) {
      const h = Math.round(10 * s);
      for (let q = 0; q < h; q++)
        G.Rh(g, x + Math.sin(q * 0.9 + sd) * Math.round(3 * s), y - q, Math.max(1, Math.round(2 * s)), 1, G.mix('#8a93ad', c, 0.3));
    },
    wire(g, x, y, s, c, sd) {
      for (let k = 0; k < 3; k++) {
        const col = k === 0 ? G.mix('#2f5c6b', c, 0.3) : k === 1 ? G.mix('#6b3f22', c, 0.3) : G.mix('#3a4459', c, 0.3);
        for (let q = 0; q < 16; q++) {
          const p = q / 15;
          G.Rh(g, x - 9 * s + p * 18 * s + Math.sin(p * 7 + k * 2 + sd) * 2,
            y - Math.sin(p * Math.PI) * (4 + k * 2) * s, 1, 1, col);
        }
      }
    },
    tins(g, x, y, s, c, sd) {
      for (let k = 0; k < 5; k++) {
        const cx2 = x + (G.hash(sd, k * 2.7) - 0.5) * 16 * s, cy2 = y - (k % 2) * Math.round(3 * s);
        bx(g, cx2, cy2 - Math.round(3 * s), Math.max(2, Math.round(4 * s)), Math.round(3 * s),
          G.mix(k % 2 ? '#a8a08a' : '#8a7a5a', c, 0.4));
      }
    },
    carton(g, x, y, s, c, sd) {
      const w = Math.round(16 * s), h = Math.round(9 * s);
      const tilt = (G.hash(sd, 19) - 0.5) * 0.7;
      for (let q = 0; q < w; q++) {
        const yy = y - h - q * tilt;
        G.R(g, x - w / 2 + q, Math.round(yy) - 1, 1, h + 2, OUT);
        G.R(g, x - w / 2 + q, Math.round(yy), 1, h, G.mix('#9a7a52', c, 0.4));
        G.R(g, x - w / 2 + q, Math.round(yy), 1, 1, G.shade(c, 0.42));
      }
      G.Rh(g, x - w * 0.2, y - h * 0.6, w * 0.4, 1, G.shade(c, -0.5));
    },
    wheel(g, x, y, s, c, sd) {
      const r = Math.max(3, Math.round(7 * s));
      G.oc(g, x, y - r, r + 1, OUT);
      G.oc(g, x, y - r, r, G.mix('#1a1c22', c, 0.3));
      G.oc(g, x, y - r, Math.max(1, Math.round(r * 0.5)), G.mix('#8a93ad', c, 0.3));
      for (let k = 0; k < 5; k++) {
        const a2 = k * Math.PI * 0.4 + sd;
        G.Rh(g, x + Math.cos(a2) * r * 0.75 - 0.5, y - r + Math.sin(a2) * r * 0.75 - 0.5, 1, 1, G.shade(c, 0.3));
      }
    },
    paint(g, x, y, s, c, sd) {
      const w = Math.round(8 * s), h = Math.round(8 * s);
      bx(g, x - w / 2, y - h, w, h, G.mix('#8a93ad', c, 0.35));
      const pc = G.mix(G.hash(sd, 23) > 0.5 ? '#3a8ac0' : '#c04a3a', c, 0.3);
      G.Rh(g, x - w / 2, y - h, w, 1.5, pc);
      G.Rh(g, x + w / 2 - 1, y - h + 1, Math.round(5 * s), 1, pc);
      G.Rh(g, x + w / 2 + 2, y - 2, Math.round(7 * s), 2, pc);
    },
    sign(g, x, y, s, c, sd) {
      const w = Math.round(16 * s), h = Math.round(10 * s);
      bar(g, x, y, Math.round(12 * s), 2, 0.1, G.mix('#5c6a86', c, 0.3));
      bx(g, x - w / 2, y - Math.round(12 * s) - h, w, h, G.mix('#3a6b4a', c, 0.35));
      G.Rh(g, x - w * 0.32, y - Math.round(12 * s) - h * 0.6, w * 0.64, 1.5, G.mix('#e8e0c8', c, 0.3));
      G.Rh(g, x - w * 0.2, y - Math.round(12 * s) - h * 0.3, w * 0.4, 1, G.mix('#e8e0c8', c, 0.3));
    },
    duct(g, x, y, s, c, sd) {
      const len = Math.round(20 * s), th = Math.max(3, Math.round(6 * s));
      for (let q = 0; q < len; q++) {
        const yy = y - th - Math.sin(q / len * 2.2) * 4 * s;
        G.R(g, x - len / 2 + q, Math.round(yy) - 1, 1, th + 2, OUT);
        G.R(g, x - len / 2 + q, Math.round(yy), 1, th, q % 3 ? G.mix('#8a93ad', c, 0.3) : G.mix('#5a6278', c, 0.3));
      }
    },
    panel(g, x, y, s, c, sd) {
      const w = Math.round(19 * s), h = Math.round(11 * s);
      const tilt = (G.hash(sd, 29) - 0.5) * 0.8;
      for (let q = 0; q < w; q++) {
        const yy = y - h - q * tilt;
        G.R(g, x - w / 2 + q, Math.round(yy) - 1, 1, h + 2, OUT);
        G.R(g, x - w / 2 + q, Math.round(yy), 1, h, c);
        G.R(g, x - w / 2 + q, Math.round(yy), 1, 1, G.shade(c, 0.45));
        if (q === Math.floor(w * 0.5)) G.R(g, x - w / 2 + q, Math.round(yy) + 1, 1, h - 2, G.shade(c, -0.5));
      }
      for (let k = 0; k < 2; k++)
        G.Rh(g, x - w * 0.3 + k * w * 0.6, y - h - (x - w * 0.3 + k * w * 0.6 - (x - w / 2)) * tilt + 2, 1, 1, G.shade(c, -0.6));
    },
    doll(g, x, y, s, c, sd) {
      const s2 = Math.max(1, Math.round(2.2 * s));
      G.oc(g, x, y - s2 * 4, s2 + 1, OUT);
      G.oc(g, x, y - s2 * 4, s2, G.mix('#e8c8b0', c, 0.3));
      bx(g, x - s2, y - s2 * 3, s2 * 2, s2 * 3, G.mix('#c04a6a', c, 0.35));
      for (const d of [-1, 1]) G.Rh(g, x + d * (s2 + 0.5), y - s2 * 2.6, 1, s2 * 1.6, G.mix('#e8c8b0', c, 0.3));
      G.Rh(g, x - 1, y - s2 * 4.2, 0.5, 0.5, '#1a1620');
      G.Rh(g, x + 0.5, y - s2 * 4.2, 0.5, 0.5, '#1a1620');
    },
    radiator(g, x, y, s, c, sd) {
      const w = Math.round(16 * s), h = Math.round(11 * s);
      for (let k = 0; k < 6; k++)
        bx(g, x - w / 2 + k * (w / 6), y - h, Math.max(1, Math.round(w / 8)), h, G.mix('#a8a49a', c, 0.4));
      G.R(g, x - w / 2, y - h, w, 1, G.shade(c, 0.4));
    },
    case(g, x, y, s, c, sd) {
      const w = Math.round(15 * s), h = Math.round(10 * s);
      bx(g, x - w / 2, y - h, w, h, G.mix('#6b4a2a', c, 0.4), { grain: sd });
      G.R(g, x - w / 2, y - h * 0.5, w, 1, G.shade(c, -0.5));
      G.Rh(g, x - 2, y - h - 2, 4, 2, G.mix('#8a6a44', c, 0.3));
      for (const d of [-1, 1]) G.Rh(g, x + d * w * 0.3, y - h * 0.5 - 1, 2, 2, G.shade(c, 0.4));
    },
    brolly(g, x, y, s, c, sd) {
      const len = Math.round(14 * s);
      bar(g, x, y, len, 1, 0.5, G.mix('#3a4459', c, 0.3));
      const tx = x + len * 0.5, ty = y - len;
      for (let k = 0; k < 4; k++) {
        const a2 = -2.4 + k * 0.5;
        for (let q = 0; q < Math.round(7 * s); q++)
          G.Rh(g, tx + Math.cos(a2) * q, ty + Math.sin(a2) * q, 1, 1, G.mix('#2f3a52', c, 0.3));
      }
    },
    tv2(g, x, y, s, c, sd) {
      const w = Math.round(20 * s), h = Math.round(11 * s);
      bx(g, x - w / 2, y - h, w, h, G.mix('#2a2a34', c, 0.3));
      bx(g, x - w / 2 + 2, y - h + 2, w - 4, h - 4, G.mix('#0d1420', c, 0.3));
      for (let j = 0; j < h - 5; j += 2) G.Rh(g, x - w / 2 + 3, y - h + 3 + j, w - 6, 0.5, G.mix('#1e3a4a', c, 0.3));
    },
    keyb(g, x, y, s, c, sd) {
      const w = Math.round(17 * s), h = Math.round(4 * s);
      bx(g, x - w / 2, y - h, w, h, G.mix('#4a4a54', c, 0.35));
      for (let k = 0; k < 9; k++) G.Rh(g, x - w / 2 + 1 + k * ((w - 2) / 9), y - h + 1, 1, 1, G.shade(c, 0.4));
    },
    plank(g, x, y, s, c, sd) {
      const len = Math.round(26 * s), th = Math.max(2, Math.round(4 * s));
      const tilt = (G.hash(sd, 31) - 0.5) * 1.4;
      bar(g, x - len * 0.4, y, len, th, tilt, G.mix('#7a5c3a', c, 0.42));
      for (let k = 0; k < 2; k++) {                    // nails
        const q = Math.round(len * (0.2 + k * 0.55));
        G.Rh(g, x - len * 0.4 + q * tilt + th, y - q - 1, 2, 1, G.mix('#c2cbe0', c, 0.2));
      }
    },
    bucket(g, x, y, s, c, sd) {
      const w = Math.round(9 * s), h = Math.round(8 * s);
      for (let j = 0; j < h; j++) {
        const hw = Math.max(1, Math.round((w / 2) * (1 - j / h * 0.28)));
        G.R(g, x - hw - 1, y - h + j, hw * 2 + 2, 1, OUT);
        G.R(g, x - hw, y - h + j, hw * 2, 1, j < 1 ? G.shade(c, 0.4) : G.mix('#5a6a7a', c, 0.35));
      }
      for (let q = 0; q < 9; q++)
        G.Rh(g, x - w * 0.5 + q * (w / 8), y - h - Math.sin(q / 8 * Math.PI) * 4 * s, 1, 1, G.mix('#8a93ad', c, 0.3));
    },
    screen(g, x, y, s, c, sd) {
      const w = Math.round(13 * s), h = Math.round(9 * s);
      const tilt = (G.hash(sd, 37) - 0.5) * 0.9;
      for (let q = 0; q < w; q++) {
        const yy = y - h - q * tilt;
        G.R(g, x - w / 2 + q, Math.round(yy) - 1, 1, h + 2, OUT);
        G.R(g, x - w / 2 + q, Math.round(yy), 1, h, G.mix('#101820', c, 0.3));
      }
      if (G.hash(sd, 41) > 0.82) G.Rh(g, x - w * 0.3, y - h * 0.5, w * 0.5, 1, G.mix('#3affa0', c, 0.1));
    },
    drum(g, x, y, s, c, sd) {
      const w = Math.round(14 * s), h = Math.round(6 * s);
      for (let j = 0; j < h; j++) {
        const hw = Math.max(1, Math.round((w / 2) * (0.86 + 0.14 * Math.sin(j / h * Math.PI))));
        G.R(g, x - hw - 1, y - h + j, hw * 2 + 2, 1, OUT);
        G.R(g, x - hw, y - h + j, hw * 2, 1, j < 1 ? G.shade(c, 0.4) : c);
      }
      G.oc(g, x, y - h, Math.max(2, Math.round(w * 0.3)), G.shade(c, 0.2));
    },
    shoe(g, x, y, s, c, sd) {
      const w = Math.round(9 * s), h = Math.round(4 * s);
      bx(g, x - w / 2, y - h, w, h, G.mix('#4a3524', c, 0.4));
      bx(g, x - w / 2 - 1, y - 2, w + 2, 2, G.mix('#2a1f18', c, 0.4));
      G.Rh(g, x - w * 0.2, y - h - 1, w * 0.5, 1.5, G.mix('#6b5a3a', c, 0.3));
    },
    book(g, x, y, s, c, sd) {
      for (let k = 0; k < 3; k++) {
        const bw = Math.round((10 - k) * s), bh = Math.max(1, Math.round(2 * s));
        bx(g, x - bw / 2 + (G.hash(sd, k) - 0.5) * 4, y - (k + 1) * bh, bw, bh,
          G.mix(k === 0 ? '#7a3a4a' : k === 1 ? '#3a5a4a' : '#6b5a3a', c, 0.4));
      }
    },
    lamp(g, x, y, s, c, sd) {
      const h = Math.round(13 * s);
      bar(g, x, y, h, 1, 0.16, G.mix('#4a4a54', c, 0.3));
      const tx = x + h * 0.16, ty = y - h;
      for (let j = 0; j < Math.round(5 * s); j++) {
        const hw = Math.max(1, Math.round((5 * s) * (0.4 + j / (5 * s) * 0.6)));
        G.R(g, tx - hw - 1, ty + j, hw * 2 + 2, 1, OUT);
        G.R(g, tx - hw, ty + j, hw * 2, 1, G.mix('#a89060', c, 0.35));
      }
    },
    tyre2(g, x, y, s, c, sd) {
      const r = Math.max(3, Math.round(8 * s));
      G.oc(g, x, y - r * 0.6, r + 1, OUT);
      G.oc(g, x, y - r * 0.6, r, G.mix('#15161a', c, 0.25));
      G.oc(g, x, y - r * 0.6, Math.max(1, Math.round(r * 0.45)), G.mix('#0a0d14', c, 0.2));
      for (let k = 0; k < 8; k++) {
        const a2 = k * Math.PI / 4 + sd;
        G.Rh(g, x + Math.cos(a2) * (r - 1) - 0.5, y - r * 0.6 + Math.sin(a2) * (r - 1) - 0.5, 1, 1, G.mix('#3a3d45', c, 0.3));
      }
    },
  };
  // ---- and the restaurant itself, in pieces ----
  Object.assign(JUNK, {
    tray(g, x, y, s, c, sd) {
      const w = Math.round(16 * s), h = Math.round(4 * s);
      bx(g, x - w / 2, y - h, w, h, '#b8434c');
      G.Rh(g, x - w / 2 + 1, y - h + 1, w - 2, 1, '#7a2830');
      G.Rh(g, x - w / 2 + 2, y - h, w - 4, 0.5, '#e8828c');
    },
    booth(g, x, y, s, c, sd) {
      const w = Math.round(18 * s), h = Math.round(11 * s);
      bx(g, x - w / 2, y - h, w, h, '#8a2f3a', { grain: sd });
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++)
        G.Rq(g, x - w / 2 + 3 + i * (w / 3.4), y - h + 3 + j * (h / 2.6), 1, 1, '#4a1620');
      G.Rh(g, x - w / 2, y - h, w, 1, '#c8505c');
      G.Rh(g, x - w / 2 + 1, y - 2, w - 2, 2, '#3a2a2a');       // the burnt underside
    },
    letter(g, x, y, s, c, sd) {
      // a letter off the sign: a neon tube in a burnt steel can
      const w = Math.round(11 * s), h = Math.round(14 * s);
      bx(g, x - w / 2, y - h, w, h, '#2a3242');
      const on = G.hash(Math.round(x), 3) > 0.72;
      const col = on ? '#ff8ab0' : '#5c3a48';
      G.Rh(g, x - w / 2 + 2, y - h + 2, w - 4, 1, col);
      G.Rh(g, x - w / 2 + 2, y - h + 2, 1, h - 4, col);
      G.Rh(g, x + w / 2 - 3, y - h + 2, 1, h - 4, col);
      G.Rh(g, x - w / 2 + 2, y - 3, w - 4, 1, col);
      if (on) G.glow(g, x, y - h / 2, w * 3, h * 2, '#ff8ab0', 0.3);
    },
    cupb(g, x, y, s, c, sd) {
      const w = Math.round(6 * s), h = Math.round(8 * s);
      for (let j = 0; j < h; j++) {
        const hw = (w / 2) * (0.72 + 0.28 * (1 - j / h));
        G.R(g, x - hw - 1, y - h + j, hw * 2 + 2, 1, OUT);
        G.R(g, x - hw, y - h + j, hw * 2, 1, j < 2 ? '#f0e2d4' : '#d8c8b4');
      }
      G.Rh(g, x - w / 2 - 1, y - h, w + 2, 1.5, '#c8505c');
      G.Rh(g, x + 1, y - h - Math.round(5 * s), 1, Math.round(5 * s), '#e8828c');
    },
    fryer(g, x, y, s, c, sd) {
      const w = Math.round(13 * s), h = Math.round(7 * s);
      bx(g, x - w / 2, y - h, w, h, '#8a94a8');
      for (let i = 1; i < 5; i++) G.vairq(g, x - w / 2 + i * (w / 5), y - h + 1, h - 2, '#4a5468');
      G.Rh(g, x + w / 2 - 1, y - h - Math.round(4 * s), Math.round(7 * s), 1.5, '#5c6470');
    },
    crownp(g, x, y, s, c, sd) {
      const w = Math.round(10 * s);
      for (let i = 0; i < 4; i++) {
        const px = x - w / 2 + i * (w / 3.4);
        G.R(g, px - 1, y - Math.round(5 * s) - 1, 3, Math.round(5 * s) + 1, OUT);
        G.R(g, px, y - Math.round(5 * s), 2, Math.round(5 * s), '#d8a83a');
      }
      G.R(g, x - w / 2 - 1, y - 3, w + 2, 4, OUT);
      G.R(g, x - w / 2, y - 2, w, 2, '#e0b040');
      G.Rh(g, x - w / 2, y - 2, w, 0.5, '#ffd45a');
    },
  });
  const JUNK_KEYS = Object.keys(JUNK);

  // ------------------------------------------------------------
  // THE WASTELAND. A horizontal world: two thousand six hundred units
  // of tip, mountains of it on the horizon, and you on your hands.
  // ------------------------------------------------------------
  const W1 = 1420;                    // world x of the road out
  const HOR = 76;                     // the horizon
  const ARM = 54;                     // how far a hand gets from the body
  const BR = 11;                      // body radius

  // The mounds you have to get over. None of them is a cliff: the tallest
  // is about a head and a half, which is the whole point - you are meant
  // to be on the ground, hauling, not climbing.
  const MOUNDS = [
    { x: 190,  w: 92,  h: 11 }, { x: 360,  w: 104, h: 14 },
    { x: 540,  w: 88,  h: 12 }, { x: 720,  w: 116, h: 17 },
    { x: 900,  w: 96,  h: 13 }, { x: 1080, w: 108, h: 16 },
    { x: 1260, w: 100, h: 14 },
  ];
  // Things that came off the tip whole and are lying on the surface. You
  // haul over them, and their tops are the best grip in the game.
  const WRECKS = [
    { x: 260,  kind: 'fridge' }, { x: 440,  kind: 'car' },
    { x: 620,  kind: 'pipes' },  { x: 810,  kind: 'bus' },
    { x: 990,  kind: 'fridge' }, { x: 1170, kind: 'pipes' },
    { x: 1340, kind: 'car' },
  ];
  const SIGN = { x: 700 };

  // ---- WHAT IS LEFT OF THE PEOPLE. Five places along the crawl where
  // you stop and call out. Nothing calls back until the last one. ----
  const CALLS = [
    { x: 210,  art: 'crown', say: 'A PAPER CROWN. SIZE SMALL.' },
    { x: 470,  art: 'tray',  say: 'TABLE FOUR. NOBODY AT TABLE FOUR.' },
    { x: 720,  art: 'shoe',  say: 'ONE SHOE. I CALLED. NOTHING CALLED BACK.' },
    { x: 980,  art: 'badge', say: 'A STAFF BADGE. THE NAME IS BURNT OFF IT.' },
    { x: 1230, art: 'radio', say: 'A RADIO, STILL ON. NOBODY ON IT.' },
  ];
  const CALLART = {
    crown(g, x, y, t) { JUNK.crownp(g, x, y, 1.1, '#e0b040', 2); },
    tray(g, x, y, t) {
      JUNK.tray(g, x, y, 1.2, '#b8434c', 2);
      JUNK.cupb(g, x + 9, y, 1, '#f0e2d4', 2);
    },
    shoe(g, x, y, t) {
      G.R(g, x - 7, y - 6, 15, 7, OUT);
      G.R(g, x - 6, y - 5, 13, 5, '#3a2a24');
      G.hairq(g, x - 6, y - 5, 13, '#6b5244');
      G.Rh(g, x - 2, y - 8, 5, 3, '#3a2a24');
      G.Rq(g, x, y - 4, 1, 1, '#c8b490');
    },
    badge(g, x, y, t) {
      G.R(g, x - 6, y - 5, 13, 6, OUT);
      G.R(g, x - 5, y - 4, 11, 4, '#e8dccb');
      G.Rh(g, x - 5, y - 4, 11, 1, '#c8505c');
      for (let i = 0; i < 4; i++) G.Rq(g, x - 3 + i * 2, y - 2, 1, 1, '#3a2a24');
      if (Math.sin(t * 3) > 0.4) G.glow(g, x, y - 3, 22, 14, '#ffd47a', 0.24);
    },
    radio(g, x, y, t) {
      G.R(g, x - 7, y - 9, 15, 10, OUT);
      G.R(g, x - 6, y - 8, 13, 8, '#3a4250');
      G.Rh(g, x - 4, y - 6, 6, 4, '#12161f');
      for (let i = 0; i < 4; i++)
        G.Rq(g, x - 4 + G.rand(0, 6), y - 6 + G.rand(0, 4), 1, 1, Math.random() < 0.5 ? '#7fd8ff' : '#2a3a4a');
      G.Rh(g, x + 4, y - 15, 1, 7, '#8a94a8');
      G.Rq(g, x + 4, y - 16, 1, 1, '#ff4a4a');
    },
  };

  function ground(x) {
    let h = 130;
    h -= Math.sin(x * 0.0131) * 8;
    h -= Math.sin(x * 0.0307 + 1.7) * 4;
    h -= Math.sin(x * 0.0061 + 4.2) * 12;
    for (const m of MOUNDS) {
      const d = (x - m.x) / m.w;
      if (Math.abs(d) < 1) h -= m.h * Math.pow(Math.cos(d * Math.PI * 0.5), 1.5);
    }
    return h;
  }
  function slope(x) { return (ground(x + 3) - ground(x - 3)) / 6; }

  // how well a hand holds where it lands: hard junk holds, loose slope gives
  function gripAt(x, y) {
    const w = WRECKS.find((k) => Math.abs(k.x - x) < 22);
    if (w) return 1.35;
    const sl = Math.abs(slope(x));
    return G.clamp(1.2 - sl * 0.3, 0.85, 1.3);
  }

  // ------------------------------------------------------------
  // THE SCENE
  // ------------------------------------------------------------
  const dump = (G.scenes = G.scenes || {}).dump = {
    enter() {
      this.t = 0;
      this.state = 'wake';            // wake | crawl | over | done
      this.wakeT = 0;
      this.bx = 40; this.by = ground(40) - BR;
      this.vx = 0; this.vy = 0;
      this.best = this.bx;
      this.hands = [
        { x: this.bx - 20, y: this.by + 12, grip: null, side: -1, reach: 0, tone: '#d2d6dc', slip: 0 },
        { x: this.bx + 20, y: this.by + 12, grip: null, side: 1, reach: 0, tone: '#f6f0e4', slip: 0 },
      ];
      this.active = null;             // the hand the stroke is driving
      this.goal = null;               // where you tapped
      this.anchor = 1;                // which hand takes the next stroke
      this.strokeT = 0;
      this.found = 0;
      this.calls = CALLS.map((c) => ({ x: c.x, art: c.art, say: c.say, hit: 0, pulse: 0 }));
      this.strain = 0;
      this.grunt = 0;
      this.msg = null; this.msgT = 9;
      this.grit = [];
      this.camX = 0; this.camY = 0;
      this.buildJunk();
      G.steam.length = 0;
      G.audio.music('title');
      G.hideCursor = false;
    },

    // ---------- the surface scatter ----------
    buildJunk() {
      this.junk = [];
      const SC = ['#5c6a86', '#8a6b48', '#3f7f92', '#9a5c30', '#6b7a9a',
                  '#6b6b78', '#a8825c', '#4f8a76', '#7a6ba0', '#9a8548'];
      for (let x = -60; x < W1 + 120; x += 7) {
        const n = 2 + Math.floor(G.hash(x, 1.3) * 2.6);
        for (let k = 0; k < n; k++) {
          const h1 = G.hash(x * 1.9, k * 3.7);
          const kind = JUNK_KEYS[Math.floor(G.hash(x, k * 5.3) * JUNK_KEYS.length) % JUNK_KEYS.length];
          const z = G.hash(x, k * 2.1);                 // 0 sunk, 1 sitting on top
          const wx = x + h1 * 7;
          // stack: some of it is buried, some sits on the surface, and
          // some is piled a body's height above it
          const pile = G.hash(x, k * 4.3);
          this.junk.push({
            x: wx, k: kind, z,
            dy: pile > 0.87 ? -(5 + pile * 20) : (1 - z) * 6,
            s: 0.45 + z * 1.1,
            c: SC[Math.floor(G.hash(x, k + 7) * 10) % 10],
            sd: (x * 0.37 + k * 1.9) % 6.28,
          });
        }
      }
      this.junk.sort((a, b) => a.z - b.z);
      // ---- MOUNTAINS OF IT. Each range is a run of overlapping heaps,
      // not a ridge line: a tip is built by tipping, so it is cones on
      // cones. Four ranges, the nearest one tall enough to lose the sky. ----
      this.ranges = [];
      const SPEC = [
        { n: 26, hi: 96, lo: 54, wid: 150, tone: '#2a2636', lit: '#4a4258' },
        { n: 22, hi: 76, lo: 40, wid: 170, tone: '#332e40', lit: '#544c66' },
        { n: 18, hi: 56, lo: 28, wid: 200, tone: '#3d3648', lit: '#5f5670' },
        { n: 14, hi: 38, lo: 18, wid: 240, tone: '#474054', lit: '#6b6278' },
      ];
      for (let r = 0; r < 4; r++) {
        const sp = SPEC[r], heaps = [];
        for (let i = 0; i < sp.n; i++) {
          heaps.push({
            x: (i + G.hash(i * 3.1, r) * 0.7) * sp.wid,
            w: sp.wid * (0.5 + G.hash(i, r + 5) * 0.55),
            h: sp.lo + G.hash(i * 1.7, r + 9) * (sp.hi - sp.lo),
            sd: G.hash(i, r + 13) * 6.28,
          });
        }
        this.ranges.push({ heaps, span: sp.n * sp.wid, tone: sp.tone, lit: sp.lit });
      }
    },

    // the silhouette of a range at a given world x, in units above its base
    rangeH(r, wx) {
      const R = this.ranges[r];
      let h = 3;
      let k = ((wx % R.span) + R.span) % R.span;
      for (const m of R.heaps) {
        for (const off of [-R.span, 0, R.span]) {
          const d = (k - m.x - off) / m.w;
          if (Math.abs(d) >= 1) continue;
          // a tipped cone: steep sides, a broken crest
          let hh = m.h * Math.pow(1 - Math.abs(d), 0.62);
          hh += Math.sin(k * 0.31 + m.sd) * m.h * 0.06;
          hh -= Math.abs(Math.sin(k * 0.9 + m.sd * 2)) * m.h * 0.04;
          if (hh > h) h = hh;
        }
      }
      return h;
    },

    progress() { return G.clamp((this.best - 40) / (W1 - 40), 0, 1); },
    onScreenX(wx) { return wx - Math.round(this.camX); },
    onScreenY(wy) { return wy - Math.round(this.camY); },
    toWorldX(sx) { return sx + Math.round(this.camX); },
    toWorldY(sy) { return sy + Math.round(this.camY); },
    say(m) { this.msg = m; this.msgT = 0; },

    // ---------- input: press to reach, hold to haul, let go to fly ----------
    onDown(x, y) {
      if (this.state === 'wake') { this.wakeT = 99; return; }
      if (this.state === 'over') { this.finish(); return; }
      if (this.state !== 'crawl') return;
      const wx = this.toWorldX(x), wy = this.toWorldY(y);
      // the sign, if you are close enough to touch it
      if (!G.foundEgg('e_moo') && Math.abs(wx - SIGN.x) < 22 &&
          Math.abs(this.bx - SIGN.x) < 70) {
        G.showEgg(G.findEgg('e_moo'));
        return;
      }
      // TAP TO MOVE. One point. The hands work out the rest.
      this.goal = { x: wx, y: wy, t: 0 };
      G.audio.sfx('grab');
    },

    onMove(x, y) {
      if (G.mouse.down && this.goal) { this.goal.x = this.toWorldX(x); this.goal.y = this.toWorldY(y); }
    },

    onUp() { /* the goal outlives the press: a tap is enough */ },

    // ---------- update ----------
    update(dt) {
      dt = Math.min(dt, 1 / 30);
      this.t += dt;
      this.msgT += dt;
      G.updateSteam(dt);
      const M = G.mouse;

      if (this.state === 'wake') {
        this.wakeT += dt;
        if (this.wakeT > 4.6) { this.state = 'crawl'; G.audio.sfx('boot'); }
        this.camX = G.clamp(this.bx - 130, 0, W1 - G.W);
        this.camY = G.clamp(this.by - 108, -10, 60);
        return;
      }

      // ---- THE STROKE. You tap; the hands do the work. One hand
      // reaches out ahead along the way you asked for, sinks into the
      // debris and hauls until the body is under it. Then the other one
      // does it. That is the whole crawl, and it is one finger. ----
      const A = this.hands[this.anchor];
      this.active = null;
      this.strain = Math.max(0, this.strain - dt * 0.8);
      if (this.goal) {
        this.goal.t += dt;
        const gap = this.goal.x - this.bx;
        if (Math.abs(gap) < 18) {
          this.goal = null;
          for (const h of this.hands) h.grip = null;
          this.strokeT = 0;
        } else {
          const dir = gap < 0 ? -1 : 1;
          if (!A.grip) {
            this.active = A;
            // reach: a point ahead of you, on whatever surface is there
            const tx = this.bx + dir * Math.min(ARM * 0.88, Math.abs(gap) + 12);
            const ty = ground(tx) - 2;
            A.reach = Math.min(1, A.reach + dt * 7);
            A.x = G.lerp(A.x, tx, Math.min(1, dt * 11));
            A.y = G.lerp(A.y, ty, Math.min(1, dt * 11));
            if (G.dist(A.x, A.y, tx, ty) < 5) {
              A.x = tx; A.y = ty;
              A.grip = { x: tx, y: ty, hold: gripAt(tx, ty) };
              A.slip = 0; this.strokeT = 0;
              G.audio.sfx('clank'); G.shake(1.1, 0.08);
              for (let i = 0; i < 7; i++)
                this.grit.push({ x: tx + G.rand(-5, 5), y: ty + G.rand(-2, 3),
                  vx: G.rand(-16, 16), vy: G.rand(-24, 4), t: 0, life: G.rand(0.3, 0.9) });
            }
          } else {
            // haul: toward the planted hand in BOTH axes, which is also
            // how you get up the side of a heap
            this.strokeT += dt;
            const dx = A.grip.x - this.bx, dy = A.grip.y - 6 - this.by;
            const d = Math.hypot(dx, dy) || 1;
            this.vx += (dx / d) * 340 * dt;
            this.vy += (dy / d) * 340 * dt;
            this.strain = Math.min(1.4, this.strain + dt * 0.46 / Math.max(0.6, A.grip.hold));
            this.grunt -= dt;
            if (this.grunt <= 0) { this.grunt = 0.45; G.audio.sfx('strain'); }
            if (Math.random() < dt * 22)
              this.grit.push({ x: A.grip.x + G.rand(-7, 7), y: A.grip.y + G.rand(-3, 4),
                vx: G.rand(-20, 20), vy: G.rand(-30, 6), t: 0, life: G.rand(0.3, 1) });
            // loose footing gives, but only after a long pull on bad ground
            A.slip += dt * Math.max(0, 1.15 - A.grip.hold);
            if (A.slip > 2.8) {
              A.grip = null; A.slip = 0; A.reach = 0; this.strokeT = 0;
              this.anchor = 1 - this.anchor;
              G.audio.sfx('snap'); G.shake(2.4, 0.2);
              this.say('IT GIVES');
              for (let i = 0; i < 14; i++)
                this.grit.push({ x: A.x + G.rand(-9, 9), y: A.y + G.rand(-4, 6),
                  vx: G.rand(-40, 40), vy: G.rand(-40, 10), t: 0, life: G.rand(0.4, 1.2) });
            } else if (d < ARM * 0.32 || this.strokeT > 1.6) {
              // the body is under the hand: let go and swap over
              A.grip = null; A.reach = 0; this.strokeT = 0;
              this.anchor = 1 - this.anchor;
            }
          }
        }
      } else {
        for (const h of this.hands) h.grip = null;
      }
      let held = 0;
      for (const h of this.hands) { if (h.grip) { h.x = h.grip.x; h.y = h.grip.y; held++; } }

      // ---- gravity, and the weight of having no legs. The damping is
      // light on purpose: a hard pull has to still be moving you when
      // you let go, or none of this is worth doing. ----
      this.vy += (held ? 170 : 340) * dt;
      this.vx *= Math.pow(held ? 0.30 : 0.16, dt);
      this.vy *= Math.pow(0.55, dt);
      this.vx = G.clamp(this.vx, -85, 85);
      this.vy = G.clamp(this.vy, -260, 300);
      this.bx += this.vx * dt;
      this.by += this.vy * dt;

      // ---- the arm is rigid: you cannot get further from a planted hand
      // than the arm is long, and pulling against it is what lifts you ----
      for (const h of this.hands) {
        if (!h.grip) continue;
        const dx = this.bx - h.grip.x, dy = this.by - h.grip.y;
        const d = Math.hypot(dx, dy);
        if (d > ARM) {
          const k = ARM / d;
          this.bx = h.grip.x + dx * k;
          this.by = h.grip.y + dy * k;
          const nx = dx / d, ny = dy / d;
          const out = this.vx * nx + this.vy * ny;
          if (out > 0) { this.vx -= nx * out; this.vy -= ny * out; }
        }
      }

      // ---- the ground ----
      this.bx = G.clamp(this.bx, 18, W1 + 40);
      const gy = ground(this.bx) - BR;
      if (this.by > gy) {
        if (this.vy > 90) {
          G.audio.sfx('thud'); G.shake(Math.min(4, this.vy / 40), 0.16);
          for (let i = 0; i < 12; i++)
            this.grit.push({ x: this.bx + G.rand(-11, 11), y: gy + BR, vx: G.rand(-40, 40),
              vy: G.rand(-34, -4), t: 0, life: G.rand(0.3, 0.9) });
        }
        this.by = gy;
        if (this.vy > 0) this.vy = 0;
        const sl = slope(this.bx);
        // you slide back down anything steep, because you have no legs
        if (!held && Math.abs(sl) > 0.6) this.vx -= sl * 110 * dt;
        this.vx *= Math.pow(held ? 0.45 : 0.78, dt);
        if (!held && Math.abs(this.vx) < 4 && Math.abs(sl) < 0.3) this.vx *= 0.2;
      }
      this.by = Math.max(this.by, 20);
      this.best = Math.max(this.best, this.bx);

      // free hands trail beside the body
      for (const h of this.hands) {
        if (h.grip || (h === A && this.goal)) continue;
        h.x = G.lerp(h.x, this.bx + h.side * 20, Math.min(1, dt * 7));
        h.y = G.lerp(h.y, Math.min(ground(this.bx + h.side * 20) - 2, this.by + 12), Math.min(1, dt * 7));
      }

      // ---- the camera ----
      this.camX = G.lerp(this.camX, G.clamp(this.bx - 118, 0, W1 - G.W + 40), Math.min(1, dt * 4));
      this.camY = G.lerp(this.camY, G.clamp(this.by - 104, -14, 64), Math.min(1, dt * 3));

      // ---- what is left of the people, and calling out at it ----
      for (const c of this.calls) {
        if (c.pulse > 0) c.pulse = Math.max(0, c.pulse - dt);
        if (c.hit || Math.abs(this.bx - c.x) > 30) continue;
        c.hit = 1; c.pulse = 1.6; this.found++;
        this.say(c.say);
        G.audio.sfx('order');
      }

      // ---- out ----
      if (this.bx >= W1 && this.state === 'crawl') {
        this.state = 'over'; this.overT = 0;
        G.audio.sfx('unlock'); G.screenFlash('#ffe4b0', 0.3);
      }
      if (this.state === 'over') {
        this.overT += dt;
        this.bx += dt * 8;
        this.by = ground(this.bx) - BR;
        if (this.overT > 4.4) this.finish();
      }

      for (let i = this.grit.length - 1; i >= 0; i--) {
        const s = this.grit[i];
        s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 130 * dt;
        if (s.t > s.life) this.grit.splice(i, 1);
      }
    },

    finish() {
      if (this.state === 'done') return;
      this.state = 'done';
      G.playCine('found', () => G.go('legfit', 'THE BENCH'));
    },

    // ---------- draw ----------
    draw(g) {
      const t = this.t;
      const cx0 = this.camX, cy0 = this.camY;
      G.toastY = -50;

      // ===== the sky: a sick yellow haze with a dead sun in it =====
      G.ramp(g, 0, 0, G.W, HOR + 10 - Math.round(cy0 * 0.1), '#3a3348', '#a8794e', 26);
      const sunX = 236 - cx0 * 0.015, sunY = 36 - cy0 * 0.08;
      G.glow(g, sunX, sunY, 190, 140, '#d8a050', 0.55);
      for (let j = -12; j <= 11; j++) {
        const hw = Math.round(Math.sqrt(Math.max(0, 144 - j * j)) * (j > 7 ? 0.7 : 1));
        if (hw < 1) continue;
        G.R(g, sunX - hw, sunY + j, hw * 2, 1, j < -6 ? '#fff0c8' : j > 6 ? '#d8a058' : '#f0d090');
      }
      for (let k = 0; k < 3; k++) {                    // a haze ring around it
        g.globalAlpha = 0.1 - k * 0.03;
        G.oc(g, sunX, sunY, 15 + k * 6, '#e8c078');
        g.globalAlpha = 1;
      }
      // smoke plumes off the far side of the tip
      for (let i = 0; i < 5; i++) {
        const px = ((i * 97 + 40) - cx0 * 0.08) % 460 - 70;
        for (let j = 0; j < 16; j++) {
          const q = j / 15;
          g.globalAlpha = 0.1 * (1 - q);
          G.Rh(g, px + Math.sin(q * 4 + i + t * 0.2) * 9 - q * 4, HOR - 8 - q * 46, 8 + q * 16, 4, '#6b5a52');
          g.globalAlpha = 1;
        }
      }
      // the city, far off, where the machines are
      const cxo = -cx0 * 0.06;
      let bx2 = -20;
      while (bx2 < 360) {
        const bw = 8 + Math.round(G.hash(bx2, 3) * 14);
        const bh = 8 + Math.round(G.hash(bx2 + 5, 7) * 26);
        G.R(g, bx2 + cxo, HOR - bh - 2, bw, bh, '#5c5062');
        G.hairq(g, bx2 + cxo, HOR - bh - 2, bw, '#7a6c7e');
        bx2 += bw + 3;
      }
      // birds, because something still lives out here
      for (let i = 0; i < 6; i++) {
        const bxx = ((i * 61 + t * 7) % 420) - 50 - cx0 * 0.1;
        const byy = 22 + (i % 3) * 9 + Math.sin(t * 0.8 + i) * 3 - cy0 * 0.1;
        const fl = Math.sin(t * 5 + i * 2) * 1.5;
        G.Rq(g, bxx, byy, 1.5, 0.25, '#2a2434');
        G.Rq(g, bxx - 1.5, byy - fl * 0.25, 1.5, 0.25, '#2a2434');
      }

      // ===== MOUNTAINS OF IT. Four ranges of tipped heaps, each nearer
      // one darker, taller and more obviously made of rubbish. =====
      for (let r = 0; r < 4; r++) {
        const par = 0.07 + r * 0.09;
        const R = this.ranges[r];
        const base = HOR + 4 + r * 11 - cy0 * (0.1 + r * 0.13);
        for (let sx = -1; sx <= G.W + 1; sx++) {
          const wx = sx + cx0 * par;
          const hh = this.rangeH(r, wx);
          const top = Math.round(base - hh);
          G.R(g, sx, top, 1, G.H - top, R.tone);
          // the crest catches the sun
          G.hairq(g, sx, top, 1, R.lit);
          G.hairq(g, sx, top + 0.25, 1, G.mix(R.lit, R.tone, 0.5));
          // and it is all rubbish: speckle, denser the nearer the range
          const dens = 0.3 + r * 0.16;
          if (G.hash(sx * 1.7, 9 + r) < dens) {
            const jy = top + 1 + G.hash(sx, 11 + r) * Math.min(hh, G.H - top - 2);
            const jw = 1 + G.hash(sx, 13 + r) * (1.5 + r);
            G.Rq(g, sx, jy, jw, G.hash(sx, 19) > 0.6 ? 1 : 0.5,
              G.hash(sx, 17 + r) > 0.5 ? R.lit : G.mix(R.tone, '#0f0d16', 0.4));
          }
          // strata: the tip was built in lifts and you can see them
          if (r >= 2) for (let k = 1; k < 4; k++) {
            const sy2 = top + hh * (k / 4);
            if (sy2 < G.H) G.hairq(g, sx, sy2, 1, G.mix(R.tone, R.lit, 0.35));
          }
        }
        // recognisable junk breaking the silhouette of the near ranges
        if (r >= 2) {
          const step = 46;
          for (let i = -1; i < G.W / step + 2; i++) {
            const wx = Math.floor((i * step + cx0 * par) / step) * step;
            const sx = wx - cx0 * par;
            if (G.hash(wx, 23 + r) < 0.42) continue;
            const hh = this.rangeH(r, wx);
            const top = base - hh;
            const kind = ['fridge', 'tyre2', 'crt', 'sofa', 'pipe', 'girder', 'trolley', 'drum'][
              Math.floor(G.hash(wx, 29 + r) * 8) % 8];
            const fn = JUNK[kind];
            if (fn) fn(g, sx, top + 3, 0.5 + r * 0.24, G.mix(R.tone, '#0f0d16', 0.22), G.hash(wx, 31));
          }
        }
        // a hazy band where each range meets the next
        g.globalAlpha = 0.15;
        G.R(g, 0, base - 2, G.W, 7, '#a8907a');
        g.globalAlpha = 1;
      }

      // ===== the near ground. A tip is not soil: it is layers of stuff
      // crushed flat, so it gets strata, a warm crust and edges of things
      // sticking out of the face of it. =====
      const colDeep = '#231f2c';
      for (let sx = -2; sx <= G.W + 2; sx++) {
        const wx = sx + cx0;
        const gy = ground(wx) - cy0;
        const sl = slope(wx);
        // slope lighting: the faces turned to the sun are warmer
        const lit = G.clamp(0.5 - sl * 1.7, 0, 1);
        const crust = G.mix('#5a5064', G.mix('#9a8878', '#c0a888', lit), 0.32 + lit * 0.5);
        G.R(g, sx, gy, 1, G.H - gy + 30, colDeep);
        // strata, five lifts of it, each a touch different
        for (let k = 0; k < 5; k++) {
          const y0 = gy + 4 + k * 7 + Math.sin(wx * 0.02 + k) * 2;
          const cc = ['#3e3648', '#463c50', '#37303f', '#4a4054', '#332c3c'][k];
          G.R(g, sx, y0, 1, 7, cc);
          G.hairq(g, sx, y0, 1, G.shade(cc, 0.22));
        }
        // the crust: two native pixels of warm dust over the whole surface
        G.Rq(g, sx, gy, 1, 1.5, crust);
        G.hairq(g, sx, gy, 1, G.shade(crust, 0.4));
        G.hairq(g, sx, gy + 1.5, 1, G.shade(crust, -0.34));
        // edges of things crushed into the face
        const h1 = G.hash(Math.round(wx), 3);
        if (h1 > 0.55) {
          const jy = gy + 2 + G.hash(Math.round(wx), 7) * 30;
          const jw = 1 + G.hash(Math.round(wx), 9) * 4;
          const jc = ['#6b6478', '#7a5c3a', '#3f6b7a', '#8a5c48', '#5c6a86'][
            Math.floor(G.hash(Math.round(wx), 11) * 5) % 5];
          G.Rq(g, sx, jy, jw, G.hash(Math.round(wx), 13) > 0.6 ? 1.25 : 0.75, jc);
          G.hairq(g, sx, jy, jw, G.shade(jc, 0.34));
        }
        // and a dust haze right along the ground line
        if (G.hash(Math.round(wx), 21) > 0.72) {
          g.globalAlpha = 0.2;
          G.Rq(g, sx, gy - 1.5, 1, 1.5, '#a89882');
          g.globalAlpha = 1;
        }
      }

      // ===== the wrecks, sitting on the surface =====
      for (const wk of WRECKS) {
        const sx = this.onScreenX(wk.x);
        if (sx < -70 || sx > G.W + 70) continue;
        this.drawWreck(g, wk, sx, ground(wk.x) - cy0, t);
      }

      // ===== the scatter =====
      for (const j of this.junk) {
        const sx = this.onScreenX(j.x);
        if (sx < -34 || sx > G.W + 34) continue;
        const gy = ground(j.x) - cy0 + j.dy;
        const col = G.mix(j.c, '#2e2a38', 0.1 + (1 - j.z) * 0.36);
        const fn = JUNK[j.k];
        if (!fn) continue;
        if (j.z > 0.45) {
          g.globalAlpha = 0.3 * j.z;
          G.Rh(g, j.x - cx0 - 9 * j.s, gy, 18 * j.s, 1.5, '#1e1a26');
          g.globalAlpha = 1;
        }
        fn(g, sx, gy, j.s, col, j.sd);
      }

      // ===== your own sign =====
      this.drawSign(g, t);

      // ===== you =====
      this.drawSelf(g, t);

      // ===== speed. When a yank actually lands you are travelling, and
      // the frame should say so. =====
      const spd = Math.hypot(this.vx, this.vy);
      if (spd > 60) {
        const sx2 = this.onScreenX(this.bx), sy2 = this.onScreenY(this.by);
        const a2 = G.clamp((spd - 60) / 150, 0, 1);
        g.globalAlpha = a2 * 0.5;
        for (let k = 1; k <= 5; k++) {
          const q = k / 5;
          G.Rq(g, sx2 - (this.vx / spd) * q * 26, sy2 - (this.vy / spd) * q * 26 - 2 + k, 3 - q * 2, 0.5, '#cfc2ae');
        }
        g.globalAlpha = 1;
      }

      // ===== fires still going in the heap, and the smoke off them =====
      for (let i = 0; i < 9; i++) {
        const fx = 90 + i * 158;
        const sx = this.onScreenX(fx);
        if (sx < -60 || sx > G.W + 60) continue;
        const gy2 = this.onScreenY(ground(fx)) - 2;
        const fl = 0.65 + Math.sin(t * 5 + i * 2.1) * 0.35;
        G.glow(g, sx, gy2 - 4, 46 * fl, 26 * fl, '#ff7a2a', 0.32);
        for (let k = 0; k < 4; k++)
          G.Rh(g, sx - 3 + k * 2, gy2 - 2 - k * 2 - fl * 3, 2, 3, k % 2 ? '#ffb050' : '#e0762a');
        g.globalAlpha = 0.16;
        for (let k = 0; k < 9; k++) {
          const sy2 = gy2 - 8 - ((t * 13 + k * 9 + i * 5) % 78);
          G.Rh(g, sx - 4 + Math.sin(sy2 * 0.09 + i) * 5, sy2, 5 + k * 0.7, 4, '#8a7c88');
        }
        g.globalAlpha = 1;
      }

      // ===== what is left of the people =====
      for (const c of this.calls) {
        const sx = this.onScreenX(c.x);
        if (sx < -40 || sx > G.W + 40) continue;
        const gy2 = this.onScreenY(ground(c.x));
        if (!c.hit) {                                  // a hint of light on it
          g.globalAlpha = 0.2 + Math.sin(t * 2 + c.x) * 0.06;
          G.glow(g, sx, gy2 - 6, 40, 26, '#ffd47a', 0.5);
          g.globalAlpha = 1;
        }
        (CALLART[c.art] || CALLART.tray)(g, sx, gy2, t);
        if (c.pulse > 0) {
          g.globalAlpha = c.pulse / 1.6;
          G.oc(g, sx, gy2 - 6, 10 + (1.6 - c.pulse) * 22, '#ffd47a');
          g.globalAlpha = 1;
        }
      }

      // ===== where you told it to go =====
      if (this.goal && this.state === 'crawl') {
        const gx2 = this.onScreenX(this.goal.x), gy3 = this.onScreenY(ground(this.goal.x));
        const pl = 0.5 + Math.sin(t * 7) * 0.5;
        g.globalAlpha = 0.5 + pl * 0.4;
        G.oc(g, gx2, gy3 - 3, 6 + pl * 2, '#b6ff3a');
        G.Rq(g, gx2 - 0.5, gy3 - 12 - pl * 2, 1, 5, '#b6ff3a');
        g.globalAlpha = 1;
      }

      // ===== grit =====
      for (const s of this.grit) {
        g.globalAlpha = Math.max(0, 1 - s.t / s.life) * 0.9;
        G.Rq(g, this.onScreenX(s.x), this.onScreenY(s.y), 1, 1, '#8a7c64');
        g.globalAlpha = 1;
      }

      // ===== foreground: junk right under the lens, out of focus =====
      for (let i = 0; i < 34; i++) {
        const fx = ((i * 137) - cx0 * 1.4) % 900;
        const sx = ((fx % 460) + 460) % 460 - 70;
        if (sx < -46 || sx > G.W + 46) continue;
        const fw = 18 + G.hash(i, 7) * 44;
        const fy = G.H - 16 + G.hash(i, 3) * 20 - cy0 * 0.06;
        G.R(g, sx - 1, fy - 1, fw + 2, 26, '#08060c');
        G.R(g, sx, fy, fw, 24, '#14111c');
        G.hairq(g, sx, fy, fw, '#241f2e');
        if (G.hash(i, 11) > 0.5) {                    // the odd shape you can name
          const fn = JUNK[['tyre2', 'drum', 'crate', 'sofa'][i % 4]];
          if (fn) fn(g, sx + fw / 2, fy + 3, 1.1, '#141019', G.hash(i, 13));
        }
      }

      // ===== weather: grit on the wind, not rain. It is a dry tip. =====
      for (let i = 0; i < 40; i++) {
        const s = G.hash(i * 3.1, 7.7);
        const dx2 = ((s * 400 + t * (40 + s * 90)) % 400) - 40;
        const dy2 = ((G.hash(i, 2) * 200 + t * 14) % 200) - 10;
        g.globalAlpha = 0.3 + s * 0.3;
        G.Rq(g, dx2, dy2, 1 + s * 2, 0.5, '#a89882');
        g.globalAlpha = 1;
      }

      // ===== the chrome =====
      if (this.state === 'wake') this.drawWake(g, t);
      else if (this.state === 'over' || this.state === 'done') this.drawOver(g, t);
      else this.drawHud(g, t);
      G.grade(g, 1.4);
    },

    // ---- the things that came off the tip whole ----
    drawWreck(g, wk, sx, gy, t) {
      if (wk.kind === 'fridge') {
        bx(g, sx - 9, gy - 22, 18, 24, '#8e9298', { grain: 3 });
        G.R(g, sx - 9, gy - 13, 18, 1, '#1a1d24');
        G.Rh(g, sx + 5, gy - 19, 1.5, 5, '#2a2e36');
        G.hairq(g, sx - 9, gy - 22, 18, '#c8ccd2');
        G.grainq(g, sx - 8, gy - 20, 16, 20, '#5a4a2a', 0.05, 5);
      } else if (wk.kind === 'car') {
        // a car door and a wing, leaning together
        for (let q = 0; q < 22; q++) {
          const yy = gy - 1 - q, xx = sx - 12 + q * 0.5;
          G.R(g, xx - 1, yy, 15, 1, OUT);
          G.R(g, xx, yy, 13, 1, q < 2 ? '#a05a4a' : q > 18 ? '#5c2e26' : '#7a3f34');
        }
        G.Rq(g, sx - 7, gy - 16, 8, 4, '#2a3038');
        G.hairq(g, sx - 7, gy - 16, 8, '#5c6a7a');
        for (let q = 0; q < 14; q++)
          G.R(g, sx + 8 + q * 0.4, gy - 1 - q, 9, 1, q < 2 ? '#8a6a48' : '#5c4430');
      } else if (wk.kind === 'pipes') {
        for (let k = 0; k < 5; k++) {
          const px3 = sx - 14 + (k % 3) * 11, py3 = gy - 5 - Math.floor(k / 3) * 9;
          for (let j = 0; j < 9; j++) {
            const hw = Math.max(1, Math.round(4.5 * Math.sqrt(Math.max(0, 1 - Math.pow((j - 4) / 4.5, 2)))));
            G.R(g, px3 - hw, py3 - 9 + j, hw * 2, 1, j < 2 ? '#8fa0bc' : j > 7 ? '#2a3040' : '#5c6a86');
          }
          G.oc(g, px3, py3 - 4.5, 3, '#1a1f2a');
        }
      } else {
        // a bus, roof toward you, half sunk
        bx(g, sx - 30, gy - 20, 60, 22, '#3a6b4a', { grain: 7 });
        for (let i = 0; i < 3; i++) {
          bx(g, sx - 24 + i * 18, gy - 17, 13, 9, '#101820');
          G.hairq(g, sx - 23 + i * 18, gy - 16, 5, '#4a5a6a');
        }
        G.R(g, sx - 30, gy - 7, 60, 2, '#e8d068');
        G.hairq(g, sx - 30, gy - 20, 60, '#6b9a78');
        for (const d of [-1, 1]) G.oc(g, sx + d * 20, gy - 1, 5, '#12141a');
      }
    },

    // ---- the sign. It is yours. It was over the door. ----
    drawSign(g, t) {
      const sx = this.onScreenX(SIGN.x);
      if (sx < -60 || sx > G.W + 60) return;
      const gy = ground(SIGN.x) - this.camY;
      const found = G.foundEgg('e_moo'), near = Math.abs(this.bx - SIGN.x) < 70;
      // leaning out of the muck at an angle
      bx(g, sx - 24, gy - 20, 48, 17, G.mix('#4a3a52', '#2e2a38', 0.2), { grain: 4 });
      G.R(g, sx - 21, gy - 18, 42, 13, G.mix('#e8dcc8', '#2e2a38', found ? 0.1 : 0.3));
      const hc = G.mix('#f6f0e4', '#2e2a38', found ? 0.06 : 0.26);
      G.R(g, sx - 17, gy - 16, 12, 9, hc);
      G.R(g, sx - 17, gy - 16, 12, 3, G.mix('#241d2a', '#2e2a38', 0.15));
      G.R(g, sx - 20, gy - 14, 3, 3, hc);
      G.R(g, sx - 5, gy - 14, 3, 3, hc);
      G.R(g, sx - 14, gy - 9, 7, 3, G.mix('#ffb8c8', '#2e2a38', found ? 0.06 : 0.26));
      G.Rq(g, sx - 15, gy - 18, 2, 2, G.mix('#e4d3a8', '#2e2a38', 0.15));
      G.Rq(g, sx - 7, gy - 18, 2, 2, G.mix('#e4d3a8', '#2e2a38', 0.15));
      for (let i = 0; i < 5; i++)
        G.Rh(g, sx - 1 + i * 4, gy - 15, 3, 5, G.mix('#c8383a', '#2e2a38', found ? 0.12 : 0.4));
      for (let i = 0; i < 4; i++)
        G.Rh(g, sx + i * 4, gy - 9, 3, 3, G.mix('#2f8a48', '#2e2a38', found ? 0.16 : 0.44));
      if (!found && near) {
        g.globalAlpha = 0.3 + Math.sin(t * 3) * 0.16;
        G.oc(g, sx, gy - 11, 24, '#ffe4b0');
        g.globalAlpha = 1;
      }
      if (found) G.glow(g, sx, gy - 11, 54, 30, '#ffd47a', 0.3);
    },

    // ---- you. ONE model: the same drawBot rig every other scene uses,
    // in crawl mode - legless, with both hands placed where the physics
    // put them. There used to be a second cow hand-drawn in this file,
    // which is why it never quite matched the one in the shop. ----
    drawSelf(g, t) {
      const sx = Math.round(this.onScreenX(this.bx));
      const sy = Math.round(this.onScreenY(this.by));

      // a tip is forty kinds of rubbish and you are one pale thing in it
      g.globalAlpha = 0.16;
      for (let r = 0; r < 8; r++) G.fe(g, sx, sy + 4, 46 - r * 5, 38 - r * 4.2, '#171320');
      g.globalAlpha = 1;
      const gy = ground(this.bx) - this.camY;
      g.globalAlpha = G.clamp(0.55 - (gy - sy - BR) / 60, 0.1, 0.55);
      for (let r = 0; r < 4; r++) G.fe(g, sx, gy + 1, 20 - r * 3, 4 - r * 0.7, '#120f18');
      g.globalAlpha = 1;

      G.drawBot(g, 'player', sx, sy + 20, 0.9, {
        t, walk: 0, mood: this.strain > 0.6 ? 'sick' : 'idle',
        crawl: 1,
        clip: this.strain > 0.1 ? 'startle' : 'idle',
        ct: t, p: G.clamp(this.strain, 0, 1),
        hands: this.hands.map((h) => ({
          x: this.onScreenX(h.x), y: this.onScreenY(h.y),
        })),
      });

      // dust under whichever hand is holding
      for (const h of this.hands) {
        if (!h.grip) continue;
        const hx = this.onScreenX(h.x), hy = this.onScreenY(h.y);
        g.globalAlpha = 0.5;
        for (let i = 0; i < 3; i++) G.Rq(g, hx + G.rand(-6, 6), hy + 2 + i, 1, 1, '#8a7c64');
        g.globalAlpha = 1;
        if (h.slip > 0.3) G.pip(g, hx, hy - 6, Math.sin(t * 20) > 0 ? '#ff7a8a' : '#8a3a44');
      }
    },

    // ---- the boot sequence ----
    drawWake(g, t) {
      const w = this.wakeT;
      const a = G.clamp((w - 0.6) / 2.2, 0, 1);
      g.globalAlpha = 1 - a;
      G.R(g, 0, 0, G.W, G.H, '#04060a');
      g.globalAlpha = 1;
      if (w > 1.2) {
        const lines = [
          'POWER . . . 4%',
          'RIGHT LEG . . . NOT FOUND',
          'LEFT LEG . . . PRESENT',
          'SITE . . . BIG MOO, UNIT 4',
          'OTHER STAFF . . . SEARCHING',
        ];
        for (let i = 0; i < lines.length; i++) {
          const st = 1.2 + i * 0.5;
          if (w < st) break;
          const shown = Math.floor((w - st) * 26);
          G.text(g, lines[i].slice(0, shown), 14, 16 + i * 9,
            i === 4 ? '#ffd47a' : i === 3 ? '#b6ff3a' : '#5c8a9a', { sc: 0.5 });
        }
      }
      if (w > 3.4) {
        const fl = Math.sin(t * 5) > 0;
        G.text(g, 'FIND SOMEBODY.', 160, 146, fl ? '#ffe4b0' : '#8a7458',
          { align: 'center', out: OUT });
        G.text(g, 'TAP WHERE YOU WANT TO GO  ·  IT WILL CRAWL THERE', 160, 158, '#6b5f4a',
          { align: 'center', sc: 0.5 });
      }
    },

    // ---- crawling chrome: distance, strain, and which hand is where ----
    drawHud(g, t) {
      const pr = this.progress();
      // the distance rail across the top
      G.R(g, 44, 8, 232, 6, '#1a1622');
      G.bevel(g, 44, 8, 232, 6, '#3a3448', '#0e0c14');
      G.R(g, 45, 9, Math.max(1, Math.round(230 * pr)), 4, '#8a7a4a');
      G.hairq(g, 45, 9, Math.max(1, Math.round(230 * pr)), '#e8d068');
      // the mounds marked on it, so the shape of the run is visible
      for (const m of MOUNDS) {
        const mx = 45 + (m.x / W1) * 230;
        G.Rq(g, mx, 6.5, 0.5, 1.5, '#5c5470');
      }
      G.Rq(g, 45 + pr * 230 - 0.5, 6, 1.5, 10, '#fff0d4');
      G.text(g, 'THE ROAD', 278, 9, '#6b7f96', { sc: 0.5 });
      G.text(g, Math.round(pr * 100) + '%', 40, 9, '#8fa0bc', { align: 'right', sc: 0.5 });

      // the strain gauge, only while you are pulling
      if (this.strain > 0.02) {
        const gx = 110, gw = 100;
        G.R(g, gx, 158, gw, 8, '#12141c');
        G.bevel(g, gx, 158, gw, 8, '#2a3040', '#050709');
        const f = G.clamp(this.strain / 1.4, 0, 1);
        const col = f > 0.78 ? P.magenta : f > 0.5 ? P.hazard : '#b6ff3a';
        G.R(g, gx + 1, 159, Math.round((gw - 2) * f), 6, col);
        G.hairq(g, gx + 1, 159, Math.round((gw - 2) * f), '#ffffff');
        G.text(g, f > 0.78 ? 'IT IS GOING TO GIVE' : 'PULL', gx + gw / 2, 148,
          f > 0.78 ? P.magentaLt : '#c8b490', { align: 'center', sc: 0.5 });
      } else if (!this.goal) {
        G.text(g, 'TAP WHERE YOU WANT TO GO', 160, 158, Math.sin(t * 3) > 0 ? '#8a7458' : '#5c5040',
          { align: 'center', sc: 0.5 });
      }
      // who you have found. It stays on nought for a long time.
      G.text(g, 'FOUND', 12, 150, '#5c5470', { sc: 0.5 });
      for (let i = 0; i < this.calls.length; i++) {
        const c = this.calls[i];
        G.R(g, 12 + i * 8, 158, 6, 8, c.hit ? '#4a3a22' : '#1a1622');
        G.bevelq(g, 12 + i * 8, 158, 6, 8, c.hit ? '#8a7a4a' : '#3a3448', '#0e0c14');
        if (c.hit) G.Rq(g, 14 + i * 8, 161, 2, 2, '#ffd47a');
      }
      // and what just happened to you
      if (this.msg && this.msgT < 2.2) {
        const a = Math.min(1, this.msgT * 4) * Math.min(1, (2.2 - this.msgT) * 2);
        g.globalAlpha = a;
        G.text(g, this.msg, 160, 24, '#c8b490', { align: 'center', sc: 0.5, out: OUT });
        g.globalAlpha = 1;
      }
    },

    // ---- out ----
    drawOver(g, t) {
      const o = this.overT || 0;
      g.globalAlpha = Math.min(0.5, o * 0.36);
      G.R(g, 0, 0, G.W, G.H, '#1a1208');
      g.globalAlpha = 1;
      G.glow(g, 160, 70, 320, 170, '#ffd47a', Math.min(0.55, o * 0.36));
      if (o > 0.6) {
        const a = G.clamp((o - 0.6) / 0.6, 0, 1);
        g.globalAlpha = a;
        G.text(g, 'THE ROAD.', 160, 58, '#ffe4b0', { align: 'center', out: OUT, sc: 2 });
        g.globalAlpha = 1;
      }
      if (o > 1.6) {
        const a = G.clamp((o - 1.6) / 0.6, 0, 1);
        g.globalAlpha = a;
        G.text(g, 'FIVE THINGS THAT USED TO BELONG TO SOMEBODY.', 160, 92, '#c8b490',
          { align: 'center', sc: 0.5 });
        G.text(g, 'AND THEN SOMEBODY SHINES A TORCH AT YOU.', 160, 100, '#c8b490',
          { align: 'center', sc: 0.5 });
        g.globalAlpha = 1;
      }
      if (o > 2.8) G.text(g, 'TAP', 160, 150, Math.sin(t * 4) > 0 ? '#8a7458' : '#4a4030',
        { align: 'center', sc: 0.5 });
    },
  };
})();

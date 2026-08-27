// ============================================================
// DOUBLE LIFE v9 - dump.js  ·  THE PIT
//
// The first thing you do in this game is get out of a hole, and
// you do it with one hand.
//
// You are a head and an arm on a length of spine. Press a handhold,
// the hand reaches and latches. Then PULL - drag away from the grip
// and you haul the rest of yourself toward it. The route does not go
// straight up: it snakes left and right, and twice it goes DOWN,
// because a bank of white goods came off the tip in one piece and
// there is no way over it.
//
// The heap itself is generated: forty kinds of rubbish, thousands of
// pieces, seeded off the world row so it is the same pit every time
// and a different pit from every other game.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  const TOP = 40;                     // world y of the lip you are climbing to
  const BOT = 1080;                   // world y of the bottom of the pit
  const REACH = 76;                   // how far one arm gets from the head

  // ------------------------------------------------------------
  // THE ROUTE. Waypoints from the floor of the pit to the lip. y
  // falls as you climb, so a waypoint whose y is LARGER than the one
  // before it is a stretch where the only way on is back down.
  // ------------------------------------------------------------
  const WP = [
    [BOT - 40, 160], [BOT - 96, 96], [BOT - 150, 52], [BOT - 206, 74],
    [BOT - 254, 140], [BOT - 300, 210], [BOT - 344, 268],
    [BOT - 300, 292],                          // >>> down and round the bank
    [BOT - 352, 300], [BOT - 402, 244], [BOT - 452, 176],
    [BOT - 504, 104], [BOT - 552, 48],
    [BOT - 512, 34],                           // >>> down and round the billboard
    [BOT - 560, 30], [BOT - 612, 84], [BOT - 662, 150], [BOT - 706, 216],
    [BOT - 748, 274], [BOT - 800, 236], [BOT - 848, 162], [BOT - 892, 96],
    [BOT - 936, 132], [BOT - 978, 186], [BOT - 1014, 158], [TOP + 30, 156],
  ];

  // Slabs: things that came off the tip whole. They block the way and
  // they catch you if you fall onto one.
  const SLABS = [
    { y: BOT - 322, x: 12,  w: 232, kind: 'goods' },
    { y: BOT - 536, x: 92,  w: 226, kind: 'board' },
    { y: BOT - 776, x: 0,   w: 168, kind: 'bus' },
    { y: BOT - 118, x: 176, w: 150, kind: 'goods' },
  ];

  // Where the easter egg is buried, in world coordinates.
  const SIGN = { x: 246, y: BOT - 430 };

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
  const JUNK_KEYS = Object.keys(JUNK);

  // ------------------------------------------------------------
  // THE SCENE
  // ------------------------------------------------------------
  const dump = (G.scenes = G.scenes || {}).dump = {
    enter() {
      this.t = 0;
      this.state = 'wake';            // wake | climb | over | done
      this.wakeT = 0;
      this.hy = BOT - 30;             // head world y
      this.hx = 160;
      this.hvy = 0;
      this.arm = { x: this.hx + 14, y: this.hy + 8, state: 'idle', grip: null, reach: 0 };
      this.strain = 0;
      this.slip = 0;
      this.best = this.hy;
      this.grunt = 0;
      this.shiftT = 11;
      this.shakeGrit = [];
      this.msg = null; this.msgT = 0;
      this.buildHolds();
      this.buildJunk();
      this.cam = this.hy - 120;
      G.steam.length = 0;
      G.audio.music('title');
      G.hideCursor = false;
    },

    // ---------- the route, laid out as handholds ----------
    buildHolds() {
      this.holds = [];
      let idx = 0;
      // spacing has to leave real slack under REACH: you rest at grip.y+8,
      // and the jitter can push the next one another dozen units away.
      const STEP = 38;
      for (let i = 0; i < WP.length - 1; i++) {
        const y0 = WP[i][0], x0 = WP[i][1], y1 = WP[i + 1][0], x1 = WP[i + 1][1];
        const d = Math.hypot(x1 - x0, y1 - y0);
        const n = Math.max(1, Math.ceil(d / STEP));
        for (let k = 1; k <= n; k++) {
          const p = k / n;
          const x = x0 + (x1 - x0) * p + (G.hash(i * 7.3, k * 3.1) - 0.5) * 10;
          const y = y0 + (y1 - y0) * p + (G.hash(i * 5.7, k * 2.3) - 0.5) * 6;
          this.addHold(G.clamp(x, 22, 298), y, idx++, false, idx);
        }
        // a decoy off to one side of every other leg: it looks the same,
        // it holds for about a second, and it goes nowhere
        if (i % 2 === 0 && i > 1) {
          const p = 0.5, mx = x0 + (x1 - x0) * p, my = y0 + (y1 - y0) * p;
          const nx2 = -(y1 - y0), ny2 = (x1 - x0), nl = Math.hypot(nx2, ny2) || 1;
          const sd2 = G.hash(i, 9) > 0.5 ? 1 : -1;
          this.addHold(G.clamp(mx + nx2 / nl * 56 * sd2, 20, 300), my + ny2 / nl * 56 * sd2, idx++, true, -1);
        }
      }
      this.holds.push({ x: WP[WP.length - 1][1], y: TOP + 30, kind: 'lip', tough: 3,
        broken: false, wob: 0, ord: idx + 1 });
      this.ord = 0;
    },

    addHold(x, y, i, decoy, ord) {
      const KIND = ['rebar', 'tyre', 'cable', 'door', 'pipe', 'strut'];
      const up = G.clamp((BOT - y) / (BOT - TOP), 0, 1);      // 0 floor, 1 lip
      // it gets worse the higher you get, and every fifth one is a rest
      let tough = decoy ? 0.3 + G.hash(i, 3) * 0.08
                : (i % 5 === 2) ? 1.15
                : 0.92 - up * 0.44 + G.hash(i, 11) * 0.26;
      this.holds.push({
        x, y, kind: KIND[i % KIND.length], tough: Math.max(0.28, tough),
        broken: false, wob: 0, decoy: !!decoy, ord: ord === undefined ? -1 : ord,
        wet: up > 0.55 && G.hash(i, 17) > 0.6,     // rain gets in higher up
      });
    },

    // ---------- the heap ----------
    buildJunk() {
      this.junk = [];
      const SC = ['#5c6a86', '#8a6b48', '#3f7f92', '#9a5c30', '#6b7a9a',
                  '#6b6b78', '#a8825c', '#4f8a76', '#7a6ba0', '#9a8548'];
      for (let wy = TOP - 80; wy < BOT + 70; wy += 7) {
        const n = 2 + Math.floor(G.hash(wy, 1.3) * 2.4);
        for (let k = 0; k < n; k++) {
          const h1 = G.hash(wy * 1.9, k * 3.7);
          const kind = JUNK_KEYS[Math.floor(G.hash(wy, k * 5.3) * JUNK_KEYS.length) % JUNK_KEYS.length];
          const z = G.hash(wy, k * 2.1);              // 0 buried and dark, 1 near
          this.junk.push({
            x: h1 * 348 - 14,
            y: wy + G.hash(wy, k * 1.7) * 6,
            k: kind, z,
            s: 0.62 + z * 0.85,
            c: SC[Math.floor(G.hash(wy, k + 7) * 10) % 10],
            sd: (wy * 0.37 + k * 1.9) % 6.28,
          });
        }
      }
      this.junk.sort((a, b) => a.z - b.z);
    },

    // "in reach" means a hold FURTHER ALONG THE ROUTE than the last one
    // you took. Not "higher" - twice on the way out, further along is
    // downhill, and the pit must not mistake that for being stranded.
    anyInReach() {
      for (const h of this.holds)
        if (!h.broken && !h.decoy && h.ord > this.ord &&
            G.dist(this.hx, this.hy, h.x, h.y) <= REACH - 8) return true;
      return false;
    },
    // is the way on below you? worth saying out loud
    onlyWayDown() {
      let down = false;
      for (const h of this.holds) {
        if (h.broken || h.decoy || h.ord <= this.ord) continue;
        if (G.dist(this.hx, this.hy, h.x, h.y) > REACH) continue;
        if (h.y < this.hy - 10) return false;
        down = true;
      }
      return down;
    },

    // ---------- world helpers ----------
    camY() { return G.clamp(this.hy - 108, TOP - 30, BOT - 160); },
    toWorld(y) { return y + Math.round(this.cam); },
    onScreen(wy) { return wy - Math.round(this.cam); },
    progress() { return G.clamp((BOT - 30 - this.best) / (BOT - 30 - (TOP + 30)), 0, 1); },

    // the slab under a given point, if any
    slabAt(x, y0, y1) {
      for (const s of SLABS)
        if (x > s.x - 4 && x < s.x + s.w + 4 && s.y >= y0 - 2 && s.y <= y1 + 2) return s;
      return null;
    },

    // REACH is the whole shape of the climb: you can only take a hold
    // that one arm can actually get to from where your head is lying.
    holdAt(sx, sy) {
      const wy = this.toWorld(sy);
      let best = null, bd = 999;
      for (const h of this.holds) {
        if (h.broken) continue;
        if (G.dist(this.hx, this.hy, h.x, h.y) > REACH) continue;
        const d = G.dist(sx, wy, h.x, h.y);
        if (d < 26 && d < bd) { bd = d; best = h; }
      }
      return best;
    },

    say(m) { this.msg = m; this.msgT = 0; },

    // ---------- input ----------
    onDown(x, y) {
      if (this.state === 'wake') { this.wakeT = 99; return; }
      if (this.state === 'over') { this.finish(); return; }
      if (this.state !== 'climb') return;
      // the sign, if it is on screen and you are near enough to touch it
      const ssy = this.onScreen(SIGN.y);
      if (!G.foundEgg('e_moo') && Math.abs(x - SIGN.x) < 20 && Math.abs(y - ssy) < 16
          && G.dist(this.hx, this.hy, SIGN.x, SIGN.y) < 120) {
        G.showEgg(G.findEgg('e_moo'));
        this.signFound = true;
        return;
      }
      const h = this.holdAt(x, y);
      if (!h) {
        this.arm.state = 'miss'; this.arm.mx = x; this.arm.my = this.toWorld(y); this.arm.reach = 0;
        G.audio.sfx('clack');
        return;
      }
      this.arm.state = 'reach';
      this.arm.grip = h;
      this.arm.reach = 0;
      G.audio.sfx('grab');
    },

    onMove() {},

    onUp() {
      if (this.arm.state === 'grip' || this.arm.state === 'reach') {
        if (this.strain > 0.05) G.audio.sfx('release');
        this.arm.state = 'idle';
        this.arm.grip = null;
      }
      this.arm.state = this.arm.state === 'miss' ? 'idle' : this.arm.state;
      this.strain = 0;
    },

    // ---------- update ----------
    update(dt) {
      this.t += dt;
      this.msgT += dt;
      G.updateSteam(dt);
      const M = G.mouse;

      if (this.state === 'wake') {
        this.wakeT += dt;
        if (this.wakeT > 4.6) { this.state = 'climb'; G.audio.sfx('boot'); }
        this.cam = G.lerp(this.cam, this.camY(), Math.min(1, dt * 2));
        return;
      }

      // ---- the arm ----
      const a = this.arm;
      if (a.state === 'reach') {
        a.reach = Math.min(1, a.reach + dt * 5.5);
        if (a.reach >= 1) {
          a.state = 'grip';
          if (a.grip.ord > this.ord) this.ord = a.grip.ord;
          G.audio.sfx('clank');
          G.shake(1.6, 0.12);
          for (let i = 0; i < 6; i++)
            this.shakeGrit.push({ x: a.grip.x + G.rand(-6, 6), y: a.grip.y + G.rand(-3, 3),
              vx: G.rand(-14, 14), vy: G.rand(4, 30), t: 0, life: G.rand(0.4, 1) });
        }
      } else if (a.state === 'miss') {
        a.reach = Math.min(1, a.reach + dt * 7);
        if (a.reach >= 1 && !M.down) a.state = 'idle';
      } else if (a.state === 'idle') {
        a.reach = Math.max(0, a.reach - dt * 4);
      }

      // ---- the haul. Drag away from the grip in ANY direction and you
      // come to it: up the slope, across a traverse, or down and round. ----
      if (a.state === 'grip' && a.grip && M.down) {
        const g2 = a.grip;
        const gsx = g2.x, gsy = this.onScreen(g2.y);
        const away = Math.hypot(M.x - gsx, M.y - gsy);
        const effort = G.clamp((away - 16) / 60, 0, 1.25);
        if (effort > 0.06) {
          const tx = g2.x, ty = g2.y + 8;
          const dx = tx - this.hx, dy = ty - this.hy, dd = Math.hypot(dx, dy) || 1;
          const speed = 78 * effort * G.clamp(1 - (this.strain - 0.7) * 0.5, 0.35, 1);
          if (dd > 3) {
            const st = Math.min(dd - 2, speed * dt);
            this.hx += dx / dd * st;
            this.hy += dy / dd * st;
          }
          // a long reach costs more than a short one, and hauling sideways
          // costs more than hauling straight up
          const far = G.clamp(dd / REACH, 0, 1);
          const lat = G.clamp(Math.abs(dx) / (Math.abs(dy) + 12), 0, 1.4);
          const slick = g2.wet ? 0.22 : 0;
          this.strain = Math.min(1.4, this.strain +
            dt * (0.1 + slick + effort * (0.34 + far * 0.5 + lat * 0.3)));
          this.grunt -= dt;
          if (this.grunt <= 0) { this.grunt = 0.55; G.audio.sfx('strain'); }
          if (Math.random() < dt * 34)
            this.shakeGrit.push({ x: g2.x + G.rand(-10, 10), y: g2.y + G.rand(-4, 8),
              vx: G.rand(-20, 20), vy: G.rand(10, 46), t: 0, life: G.rand(0.4, 1.2) });
          g2.wob = Math.min(1, g2.wob + dt * effort * 1.4);
          if (this.strain > g2.tough) this.breakHold(g2);
        } else this.strain = Math.max(0, this.strain - dt * 0.5);
      } else this.strain = Math.max(0, this.strain - dt * 0.9);

      // ---- falling. Only a grip giving out costs you height, and then it
      // costs you properly - unless something catches you on the way. ----
      if (a.state !== 'grip') {
        if (this.slip > 0) {
          const py = this.hy;
          this.hvy = Math.min(120, this.hvy + 190 * dt);
          this.hy = Math.min(BOT - 30, this.hy + this.hvy * dt);
          const sl = this.slabAt(this.hx, py, this.hy);
          if (sl) { this.hy = sl.y - 12; this.slip = 0; this.hvy = 0; G.audio.sfx('thud'); G.shake(3, 0.2); this.say('CAUGHT'); }
          if (Math.random() < dt * 40)
            this.shakeGrit.push({ x: this.hx + G.rand(-9, 9), y: this.hy + G.rand(0, 12),
              vx: G.rand(-24, 24), vy: G.rand(14, 52), t: 0, life: G.rand(0.3, 1) });
        } else this.hvy = 0;
      } else this.hvy = 0;
      this.slip = Math.max(0, this.slip - dt * 1.1);
      this.best = Math.min(this.best, this.hy);

      // ---- the heap shifts on its own. Somewhere above you, something
      // that was holding stops holding. ----
      this.shiftT -= dt;
      if (this.shiftT <= 0 && this.state === 'climb') {
        this.shiftT = 12 + Math.random() * 9;
        // only things you could not have taken this turn anyway: near
        // enough to hear, too far to have used
        const near = this.holds.filter((h) => !h.broken && h.kind !== 'lip' && h !== (a.grip || null) &&
          G.dist(this.hx, this.hy, h.x, h.y) > REACH + 8 &&
          G.dist(this.hx, this.hy, h.x, h.y) < 190);
        if (near.length > 1) {
          const v = near[Math.floor(Math.random() * near.length)];
          v.broken = true;
          G.audio.sfx('rumble'); G.shake(3, 0.3);
          for (let k = 0; k < 18; k++)
            this.shakeGrit.push({ x: v.x + G.rand(-14, 14), y: v.y + G.rand(-6, 10),
              vx: G.rand(-40, 40), vy: G.rand(10, 60), t: 0, life: G.rand(0.5, 1.4) });
          this.say('THE HEAP SHIFTS');
        }
      }

      // ---- nothing left within reach? something slides in. You cannot
      // get stuck in this pit. You can only be slow. ----
      if (a.state === 'idle' && !this.anyInReach()) {
        this.settleT = (this.settleT || 0) + dt;
        if (this.settleT > 1.1) {
          this.settleT = 0;
          // it slides in ON THE WAY, between you and the next piece of
          // route you have not taken yet. Whatever comes down is solid.
          let tgt = null, bo = 1e9;
          for (const h of this.holds)
            if (!h.broken && !h.decoy && h.ord > this.ord && h.ord < bo) { bo = h.ord; tgt = h; }
          let nx, ny;
          if (tgt) {
            const dx = tgt.x - this.hx, dy = tgt.y - this.hy, dd = Math.hypot(dx, dy) || 1;
            const step = Math.min(dd * 0.7, REACH - 12);
            nx = G.clamp(this.hx + dx / dd * step, 20, 300);
            ny = this.hy + dy / dd * step;
          } else {
            nx = G.clamp(this.hx + G.rand(-14, 14), 22, 298); ny = this.hy - 42;
          }
          this.addHold(nx, ny, this.holds.length, false, (tgt ? tgt.ord : this.ord + 1) - 0.01);
          const nh = this.holds[this.holds.length - 1];
          nh.tough = 1.05; nh.wet = false;
          G.audio.sfx('rumble'); G.shake(3, 0.35);
          for (let k = 0; k < 26; k++)
            this.shakeGrit.push({ x: nh.x + G.rand(-16, 16), y: nh.y + G.rand(-6, 14),
              vx: G.rand(-40, 40), vy: G.rand(10, 70), t: 0, life: G.rand(0.5, 1.5) });
          this.say('SOMETHING SLIDES DOWN');
        }
      } else this.settleT = 0;

      // ---- over the lip ----
      if (this.hy <= TOP + 40 && this.state === 'climb') {
        this.state = 'over';
        this.overT = 0;
        G.audio.sfx('unlock');
        G.screenFlash('#ffe4b0', 0.3);
      }
      if (this.state === 'over') {
        this.overT += dt;
        this.hy = Math.max(TOP + 6, this.hy - dt * 12);
        if (this.overT > 4.4) this.finish();
      }

      for (let i = this.shakeGrit.length - 1; i >= 0; i--) {
        const s = this.shakeGrit[i];
        s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 120 * dt;
        if (s.t > s.life) this.shakeGrit.splice(i, 1);
      }
      this.cam = G.lerp(this.cam, this.camY(), Math.min(1, dt * 3.4));
    },

    breakHold(h) {
      h.broken = true;
      this.arm.state = 'idle'; this.arm.grip = null;
      this.strain = 0;
      this.slip = 1;
      this.hvy = 46;
      G.audio.sfx('snap');
      G.shake(4, 0.4);
      this.say(h.decoy ? 'THAT WAS NEVER GOING TO HOLD' : 'IT GOES');
      for (let i = 0; i < 20; i++)
        this.shakeGrit.push({ x: h.x + G.rand(-12, 12), y: h.y + G.rand(-8, 8),
          vx: G.rand(-50, 50), vy: G.rand(-20, 60), t: 0, life: G.rand(0.5, 1.4) });
    },

    finish() {
      if (this.state === 'done') return;
      this.state = 'done';
      G.playCine('found', () => G.go('tracy', "TRACY'S PLACE"));
    },

    // ---------- draw ----------
    draw(g) {
      const t = this.t;
      const cam = Math.round(this.cam);
      G.toastY = -50;

      // ===== sky and the city above the pit =====
      G.R(g, 0, 0, G.W, G.H, '#0a0e18');
      const sky = this.onScreen(TOP);
      if (sky > -60) {
        for (let j = 0; j < Math.min(G.H, sky + 40); j++) {
          const p = j / Math.max(1, sky + 40);
          G.Rh(g, 0, j, G.W, 1, G.mix('#141c2e', '#2a1c2c', p));
        }
        let bx2 = -8;
        while (bx2 < 340) {
          const bw = 16 + Math.round(G.hash(bx2, 3) * 26);
          const bh = 20 + Math.round(G.hash(bx2 + 5, 7) * 54);
          G.R(g, bx2, sky - bh, bw, bh, '#0c1220');
          for (let wy = sky - bh + 5; wy < sky - 4; wy += 6)
            for (let wx = bx2 + 3; wx < bx2 + bw - 3; wx += 5)
              if (G.hash(wx, wy) > 0.7) G.Rh(g, wx, wy, 1.5, 2, '#3a4a72');
          bx2 += bw + 3;
        }
        const px2 = ((t * 22) % 400) - 40;
        G.Rh(g, px2, sky - 66, 6, 1.5, '#7fd8ff');
        G.glow(g, px2, sky - 65, 40, 14, '#3a9ad8', 0.5);
      }

      // ===== the heap. It fills the frame. You are inside it. =====
      G.R(g, 0, Math.max(0, sky), G.W, G.H, '#161a22');
      const y0 = cam - 40, y1 = cam + G.H + 50;
      // mulch: the compacted stuff nothing is recognisable in any more.
      // Lumps, not stripes - a row of bars is what a landfill is not.
      for (let wy = Math.floor(y0 / 9) * 9; wy < y1; wy += 9) {
        const sy = this.onScreen(wy);
        if (sy < sky - 12) continue;
        const dep = G.clamp((wy - TOP) / (BOT - TOP), 0, 1);
        for (let k = 0; k < 7; k++) {
          const h1 = G.hash(wy * 2.3, k * 4.1);
          const mx = h1 * 340 - 10, mw = 6 + G.hash(wy, k + 3) * 26;
          const mh = 3 + G.hash(wy, k + 13) * 7;
          const my2 = sy + (G.hash(wy, k + 21) - 0.5) * 8;
          const cc = G.mix(['#4a5468', '#5c4a34', '#3a5a68', '#4a3f56', '#46503a', '#5a4a4a', '#3a4a54'][k],
            '#0d1118', 0.16 + dep * 0.24);
          G.Rh(g, mx, my2, mw, mh, cc);
          G.hair(g, mx, my2, mw, G.shade(cc, 0.34));
          G.hair(g, mx, my2 + mh - 0.5, mw, G.shade(cc, -0.42));
        }
      }
      // and then the actual rubbish, back to front
      for (const j of this.junk) {
        if (j.y < y0 || j.y > y1) continue;
        const sy = this.onScreen(j.y);
        if (sy < sky - 24) continue;
        const dep = G.clamp((j.y - TOP) / (BOT - TOP), 0, 1);
        // everything sinks toward the pit colour with depth and distance
        const col = G.mix(j.c, '#0d1118', 0.02 + dep * 0.2 + (1 - j.z) * 0.24);
        const fn = JUNK[j.k];
        if (!fn) continue;
        // a contact shadow, so nothing floats
        if (j.z > 0.4) {
          g.globalAlpha = 0.3 * j.z;
          G.Rh(g, j.x - 9 * j.s, sy, 18 * j.s, 2, '#07090d');
          g.globalAlpha = 1;
        }
        fn(g, j.x, sy, j.s, col, j.sd);
        // the odd thing still has power in it
        if (j.z > 0.72 && G.hash(j.y, 53) > 0.94) {
          const bl = Math.sin(t * 3 + j.sd * 4) > 0.2;
          G.Rh(g, j.x, sy - 5 * j.s, 1, 1, bl ? '#3affa0' : '#1a4a34');
          if (bl) G.glow(g, j.x, sy - 5 * j.s, 14, 10, '#3affa0', 0.4);
        }
      }
      // the slabs: the things that came off the tip in one piece
      for (const s of SLABS) {
        const sy = this.onScreen(s.y);
        if (sy < sky - 40 || sy > G.H + 40) continue;
        this.drawSlab(g, s, sy, t);
      }
      // your own sign, face down in it
      this.drawSign(g, t, sky);
      // edge vignette, so the frame feels like a hole
      for (let i = 0; i < 26; i++) {
        g.globalAlpha = 0.055;
        G.R(g, i, 0, 1, G.H, '#04060a');
        G.R(g, G.W - 1 - i, 0, 1, G.H, '#04060a');
        g.globalAlpha = 1;
      }

      // ===== the handholds =====
      for (const h of this.holds) {
        const sy = this.onScreen(h.y);
        if (sy < -20 || sy > G.H + 20) continue;
        this.drawHold(g, h, sy, t);
      }

      // ===== you =====
      this.drawSelf(g, t);

      // ===== grit =====
      for (const s of this.shakeGrit) {
        const sy = this.onScreen(s.y);
        g.globalAlpha = Math.max(0, 1 - s.t / s.life) * 0.9;
        G.Rh(g, s.x, sy, 1, 1, '#6b5f4a');
        g.globalAlpha = 1;
      }

      // ===== rain, over everything =====
      for (let i = 0; i < 52; i++) {
        const s = G.hash(i * 3.1, 7.7);
        const rx = (s * 340 + t * 26 * (0.6 + s)) % 340 - 10;
        const ry = ((G.hash(i, 2) * 220 + t * (170 + s * 130)) % 220) - 20;
        G.Rh(g, rx, ry, 0.5, 3 + s * 4, '#39506b');
      }

      // ===== the chrome =====
      if (this.state === 'wake') this.drawWake(g, t);
      else if (this.state === 'over' || this.state === 'done') this.drawOver(g, t);
      else this.drawHud(g, t);
      G.grade(g, 1.5);
    },

    // ---- a slab: a bank of white goods, a billboard, a bus ----
    drawSlab(g, s, sy, t) {
      if (s.kind === 'goods') {
        // fridges and cookers, stacked and welded together by the fall
        for (let i = 0; i < Math.ceil(s.w / 26); i++) {
          const bx2 = s.x + i * 26, bw = Math.min(24, s.x + s.w - bx2);
          if (bw < 6) break;
          const c = ['#8a8e92', '#7a7c80', '#9a9488', '#6b7078'][i % 4];
          bx(g, bx2, sy - 22 - (i % 3) * 3, bw, 24 + (i % 3) * 3, G.mix(c, '#12151d', 0.28), { grain: i + 2 });
          G.R(g, bx2, sy - 12 - (i % 3) * 3, bw, 1, '#1a1d24');
          G.Rh(g, bx2 + bw - 3, sy - 19 - (i % 3) * 3, 1.5, 6, '#2a2e36');
          if (i % 3 === 1) {
            G.oc(g, bx2 + bw / 2, sy - 12, 5, OUT);
            G.oc(g, bx2 + bw / 2, sy - 12, 4, '#232830');
          }
        }
        G.R(g, s.x - 1, sy, s.w + 2, 3, '#0d1016');
        G.hair(g, s.x, sy, s.w, '#3a4150');
      } else if (s.kind === 'board') {
        // a hoarding, face out, still selling something
        bx(g, s.x, sy - 30, s.w, 30, '#2a3040', { grain: 5 });
        G.R(g, s.x + 3, sy - 27, s.w - 6, 24, G.mix('#c8b490', '#12151d', 0.42));
        G.Rh(g, s.x + 8, sy - 22, s.w * 0.5, 4, G.mix('#e0642a', '#12151d', 0.34));
        G.Rh(g, s.x + 8, sy - 15, s.w * 0.66, 2, G.mix('#8a7458', '#12151d', 0.3));
        G.Rh(g, s.x + 8, sy - 11, s.w * 0.4, 2, G.mix('#8a7458', '#12151d', 0.3));
        for (let i = 0; i < 3; i++) {                 // torn strips hanging off it
          const tx = s.x + 20 + i * (s.w / 3.4);
          G.Rh(g, tx, sy - 3, 5, 7 + i * 3, G.mix('#c8b490', '#12151d', 0.5));
        }
        for (const d of [0, 1]) G.R(g, s.x + d * (s.w - 5), sy, 5, 26, '#1a1f2a');
      } else {
        // a bus, on its side, roof toward you
        bx(g, s.x, sy - 26, s.w, 26, G.mix('#3a6b4a', '#0d1016', 0.34), { grain: 7 });
        for (let i = 0; i < Math.floor(s.w / 22); i++) {
          const wx = s.x + 6 + i * 22;
          bx(g, wx, sy - 22, 15, 11, G.mix('#101820', '#0a0d14', 0.3));
          G.Rh(g, wx + 1, sy - 21, 6, 1, '#3a4a5a');
        }
        G.R(g, s.x, sy - 8, s.w, 2, G.mix('#e8d068', '#0d1016', 0.4));
        for (const d of [0, 1]) G.oc(g, s.x + 14 + d * (s.w - 32), sy + 1, 6, '#12141a');
        G.R(g, s.x - 1, sy, s.w + 2, 3, '#0d1016');
      }
    },

    // ---- the sign. It is yours. It was over the door. ----
    drawSign(g, t, sky) {
      const sy = this.onScreen(SIGN.y);
      if (sy < sky - 30 || sy > G.H + 30) return;
      const x = SIGN.x, found = G.foundEgg('e_moo');
      const near = G.dist(this.hx, this.hy, SIGN.x, SIGN.y) < 120;
      // a board, half buried, tilted
      bx(g, x - 26, sy - 15, 52, 17, G.mix('#4a3a52', '#0a0d14', 0.3), { grain: 4 });
      G.R(g, x - 23, sy - 13, 46, 13, G.mix('#e8dcc8', '#0a0d14', found ? 0.14 : 0.34));
      // a cow's head painted on it, with a cone
      const hc = G.mix('#f6f0e4', '#0a0d14', found ? 0.1 : 0.3);
      G.R(g, x - 19, sy - 11, 13, 10, hc);
      G.R(g, x - 19, sy - 11, 6, 5, G.mix('#2f2839', '#0a0d14', 0.2));
      G.R(g, x - 22, sy - 9, 3, 3, hc);
      G.R(g, x - 6, sy - 9, 3, 3, hc);
      G.R(g, x - 16, sy - 4, 8, 4, G.mix('#ffb8c8', '#0a0d14', found ? 0.1 : 0.3));
      G.Rh(g, x - 17, sy - 13, 2, 2, G.mix('#e4d3a8', '#0a0d14', 0.2));
      G.Rh(g, x - 8, sy - 13, 2, 2, G.mix('#e4d3a8', '#0a0d14', 0.2));
      // and the lettering, mostly gone
      for (let i = 0; i < 5; i++)
        G.Rh(g, x - 2 + i * 4, sy - 10, 3, 5, G.mix('#c8383a', '#0a0d14', found ? 0.16 : 0.42));
      for (let i = 0; i < 4; i++)
        G.Rh(g, x - 1 + i * 4, sy - 4, 3, 3, G.mix('#2f8a48', '#0a0d14', found ? 0.2 : 0.46));
      if (!found && near) {
        g.globalAlpha = 0.3 + Math.sin(t * 3) * 0.16;
        G.oc(g, x, sy - 6, 22, '#ffe4b0');
        g.globalAlpha = 1;
      }
      if (found) G.glow(g, x, sy - 6, 46, 26, '#ffd47a', 0.3);
    },

    // ---- a handhold, by kind ----
    drawHold(g, h, sy, t) {
      const wob = h.wob > 0 ? Math.sin(t * 34) * h.wob * 1.4 : 0;
      const x = h.x + wob;
      const solid = h.tough > 0.9;
      if (h.broken) {
        G.Rh(g, x - 3, sy, 6, 2, '#1a1c22');
        G.Rh(g, x - 1, sy - 1, 2, 2, '#2a2c34');
        return;
      }
      if (h.kind === 'lip') {
        G.R(g, x - 34, sy - 4, 78, 8, '#3a3f4c');
        G.hair(g, x - 34, sy - 4, 78, '#6b7488');
        G.R(g, x - 34, sy + 4, 78, 4, '#22262e');
        for (let i = 0; i < 7; i++) G.rivet(g, x - 30 + i * 11, sy - 2.5, '#12141c', '#8fa0bc');
        G.glow(g, x + 6, sy - 6, 90, 30, '#ffd47a', 0.4);
        return;
      }
      if (h.kind === 'rebar') {
        G.Rh(g, x - 1, sy - 8, 2, 16, solid ? '#8a5230' : '#6b4228');
        G.vair(g, x - 1, sy - 8, 16, '#b87a44');
        G.Rh(g, x - 5, sy - 8, 10, 2, solid ? '#8a5230' : '#6b4228');
        G.hair(g, x - 5, sy - 8, 10, '#b87a44');
      } else if (h.kind === 'tyre') {
        G.oc(g, x, sy, 8, '#15161a');
        G.oc(g, x, sy, 7, '#23252b');
        G.oc(g, x, sy, 4, '#15161a');
        for (let k = 0; k < 8; k++) {
          const a2 = k * Math.PI / 4;
          G.Rh(g, x + Math.cos(a2) * 7.5 - 0.5, sy + Math.sin(a2) * 7.5 - 0.5, 1, 1, '#3a3d45');
        }
      } else if (h.kind === 'cable') {
        for (let i = 0; i < 16; i++) {
          const p = i / 15;
          G.Rh(g, x - 8 + p * 16, sy + Math.sin(p * Math.PI) * 5, 1, 1, solid ? '#2f5c6b' : '#24404a');
        }
        G.Rh(g, x - 9, sy - 1, 3, 3, '#48546c');
        G.Rh(g, x + 7, sy - 1, 3, 3, '#48546c');
      } else if (h.kind === 'door') {
        G.plate(g, x - 11, sy - 9, 22, 18, '#8a9098', { r: 1, band: 2, bolts: 1, grain: 3 });
        G.Rh(g, x + 5, sy - 2, 4, 5, P.chrome);
        G.Rh(g, x - 8, sy - 6, 12, 2, '#5c6068');
      } else if (h.kind === 'strut') {
        // a bent length of shelving, one end still bolted to nothing
        for (let q = 0; q < 20; q++) {
          const p = q / 19;
          G.Rh(g, x - 10 + q, sy - 5 + Math.sin(p * 2.6) * 5, 1, 3, solid ? '#7a8298' : '#5a6278');
          G.Rh(g, x - 10 + q, sy - 5 + Math.sin(p * 2.6) * 5, 1, 1, '#b0b8c8');
        }
        G.Rh(g, x - 12, sy - 6, 3, 6, '#3a4150');
      } else {
        G.Rh(g, x - 12, sy - 3, 24, 6, '#48546c');
        G.hair(g, x - 12, sy - 3, 24, '#8fa0bc');
        G.hair(g, x - 12, sy + 2.5, 24, '#181c24');
        G.Rh(g, x - 13, sy - 4, 3, 8, '#5c6a86');
        G.Rh(g, x + 10, sy - 4, 3, 8, '#5c6a86');
      }
      if (h.wet) {                                  // the rain gets in higher up
        g.globalAlpha = 0.4;
        for (let i = 0; i < 3; i++)
          G.Rh(g, x - 6 + i * 5, sy + 5 + (i % 2), 1, 2, '#7fd8ff');
        g.globalAlpha = 1;
      }
      // in reach: it lights up. Out of reach but close: a dull ring, so
      // the route is findable against forty kinds of rubbish.
      const dd = G.dist(this.hx, this.hy, h.x, h.y);
      if (dd > REACH && dd < 150 && this.state === 'climb') {
        g.globalAlpha = 0.13;
        G.oc(g, x, sy, 9, '#8a7458');
        g.globalAlpha = 1;
      }
      const inReach = dd <= REACH;
      if (inReach && this.state === 'climb' && this.arm.state !== 'grip') {
        const hov = G.dist(G.mouse.x, this.toWorld(G.mouse.y), h.x, h.y) < 26;
        g.globalAlpha = hov ? 0.6 + Math.sin(t * 7) * 0.25 : 0.28 + Math.sin(t * 2.4) * 0.08;
        G.oc(g, x, sy, hov ? 12 : 10, hov ? '#ffe4b0' : '#c8a060');
        g.globalAlpha = 1;
        if (hov) {
          // higher up, in the rain and the dark, you cannot tell any more
          const blind = (BOT - h.y) / (BOT - TOP) > 0.66 && h.tough < 1.1;
          const lab = blind ? '? ? ?' : solid ? 'SOLID' : h.tough > 0.68 ? 'FIRM' : 'LOOSE';
          G.text(g, lab, x, sy - 18,
            blind ? '#8fa0bc' : solid ? '#b6ff3a' : h.tough > 0.68 ? '#ffd47a' : '#ff7a8a',
            { align: 'center', sc: 0.5, out: OUT });
          if (h.wet) G.text(g, 'WET', x, sy - 25, '#7fd8ff', { align: 'center', sc: 0.5, out: OUT });
        }
      }
      if (h.wob > 0.4) {
        g.globalAlpha = 0.5;
        for (let i = 0; i < 3; i++)
          G.Rh(g, x + G.rand(-8, 8), sy + 6 + i * 2, 1, 1, '#6b5f4a');
        g.globalAlpha = 1;
      }
    },
    // ---- the head, the spine, the arm ----
    drawSelf(g, t) {
      const a = this.arm;
      const hsy = this.onScreen(this.hy);
      const hx = Math.round(this.hx);
      // where the hand is
      let ax = hx + 16, ay = hsy + 6;
      if (a.state === 'grip' && a.grip) { ax = a.grip.x + Math.sin(t * 30) * this.strain * 1.2; ay = this.onScreen(a.grip.y); }
      else if (a.state === 'reach' && a.grip) {
        ax = G.lerp(hx + 16, a.grip.x, G.easeOut(a.reach));
        ay = G.lerp(hsy + 6, this.onScreen(a.grip.y), G.easeOut(a.reach));
      } else if (a.state === 'miss') {
        ax = G.lerp(hx + 16, a.mx, G.easeOut(a.reach));
        ay = G.lerp(hsy + 6, this.onScreen(a.my), G.easeOut(a.reach));
      }

      // ---- the spine cable, taut under strain ----
      const taut = this.strain;
      const n = 14;
      for (let i = 0; i <= n; i++) {
        const p = i / n;
        const sag = Math.sin(p * Math.PI) * (10 - taut * 9);
        const cx2 = G.lerp(hx + 8, ax, p);
        const cy2 = G.lerp(hsy + 4, ay, p) + sag;
        G.Rh(g, cx2 - 1, cy2 - 1, 2.5, 2.5, '#1a1f2a');
        G.Rh(g, cx2 - 0.5, cy2 - 1, 1.5, 1, taut > 0.5 ? '#8fa0bc' : '#4a5670');
        if (i % 3 === 0) G.Rh(g, cx2 - 1, cy2, 2, 1, '#2e343f');
      }

      // ---- the head: the brightest thing in the pit ----
      const lean = this.strain * 2;
      const col = '#f6f0e4', col2 = '#cdc2b2';
      // the heap is forty kinds of rubbish and you are one pale thing in
      // it. Sink a pool of shadow behind the head so it separates.
      g.globalAlpha = 0.55;
      for (let r = 0; r < 5; r++) G.fe(g, hx, hsy + 2, 34 - r * 4, 28 - r * 3, '#05070b');
      g.globalAlpha = 1;
      G.glow(g, hx, hsy, 74, 62, '#ffd47a', 0.3);

      // one ear left. The other is a torn stub with wire coming out.
      for (let i = 0; i < 9; i++) {
        const p = i / 8;
        const ex = hx + 14 + Math.round(p * 11), ey = hsy - 6 + Math.round(p * 5 + this.strain * 2);
        const th = Math.max(2, Math.round(8 * (1 - p * p * 0.76)));
        G.R(g, ex - 1, ey - 1, 3, th + 2, OUT);
        G.R(g, ex, ey, 2, th, p < 0.66 ? col2 : '#b0a494');
        if (p > 0.1 && p < 0.84) G.Rh(g, ex, ey + th * 0.3, 2, Math.max(1, th * 0.4), '#c08a98');
      }
      for (let i = 0; i < 4; i++) {                    // the torn one
        const ex = hx - 15 - i * 2, ey = hsy - 6 + i;
        G.R(g, ex - 1, ey - 1, 4, 6 - i, OUT);
        G.R(g, ex, ey, 2, Math.max(1, 4 - i), col2);
      }
      for (let i = 0; i < 3; i++)
        G.Rh(g, hx - 22 - i * 1.5, hsy - 4 + Math.sin(i * 2 + t * 3) * 2, 2, 1, i % 2 ? '#8a5a2a' : '#3a5a7a');

      // the skull
      G.R(g, hx - 16, hsy - 14, 32, 30, OUT);
      G.R(g, hx - 15, hsy - 13, 30, 28, col);
      G.bevel(g, hx - 15, hsy - 13, 30, 28, '#fffaf0', col2);
      G.hair(g, hx - 15, hsy - 13, 30, '#ffffff');
      G.grain(g, hx - 14, hsy - 6, 28, 18, '#b09878', 0.1, 3);
      // the patch, clipped to the plate
      for (let j2 = 0; j2 < 22; j2++) {
        const dy = (j2 - 9) / 11;
        if (Math.abs(dy) > 1) continue;
        const wob = 1 + Math.sin(j2 * 0.8 + 1.7) * 0.18;
        const half = Math.round(8 * Math.sqrt(1 - dy * dy) * wob);
        const x0 = Math.max(hx - 15, hx - 9 - half), x1 = Math.min(hx + 15, hx - 9 + half);
        if (x1 > x0) G.R(g, x0, hsy - 12 + j2, x1 - x0, 1,
          j2 < 5 ? '#4c4256' : j2 > 15 ? '#1d1826' : '#2f2839');
      }
      // one horn, bent. The other snapped off level with the plate.
      for (let j2 = 0; j2 < 6; j2++) {
        const p = j2 / 5, hw2 = Math.max(2, Math.round(5 * (0.44 + p * 0.56)));
        G.R(g, hx + 5 + Math.round((1 - p) * 3) - 1, hsy - 20 + j2 - 1, hw2 + 2, 3, OUT);
      }
      for (let j2 = 0; j2 < 6; j2++) {
        const p = j2 / 5, hw2 = Math.max(2, Math.round(5 * (0.44 + p * 0.56)));
        G.R(g, hx + 5 + Math.round((1 - p) * 3), hsy - 20 + j2, hw2, 1,
          p < 0.3 ? '#c9ab7c' : '#e4d3a8');
      }
      G.R(g, hx - 10, hsy - 15, 6, 3, OUT);
      G.R(g, hx - 9, hsy - 14, 4, 2, '#8a7458');
      G.Rh(g, hx - 9, hsy - 14, 4, 1, '#5c4a34');

      // a dent, and mud
      G.Rh(g, hx + 5, hsy - 8, 8, 5, '#c0a888');
      G.Rh(g, hx + 6, hsy - 7, 5, 3, '#a89070');
      g.globalAlpha = 0.42; G.Rh(g, hx - 13, hsy + 6, 20, 6, '#4a3a28'); g.globalAlpha = 1;
      // one working optic, one dead, both big
      const blink = Math.sin(t * 1.3) > 0.98;
      G.lens(g, hx - 13, hsy - 9 + lean * 0.3, 11, 11, { hue: '#ff9ab8', t, closed: blink, cute: 1, lid: col });
      G.lens(g, hx + 3, hsy - 8 + lean * 0.3, 9, 9, { hue: '#8a94a8', t, dead: 1, noGlow: 1 });
      // and a crack across the dead one
      for (let i = 0; i < 7; i++)
        G.Rh(g, hx + 3 + i, hsy - 7 + Math.sin(i * 1.6) * 2, 1, 0.5, '#12151d');
      // the muzzle: scuffed, one nostril packed with dirt
      for (let j2 = 0; j2 < 11; j2++) {
        const q = (j2 / 10 - 0.5) * 2;
        const hw2 = Math.max(1, Math.round(10 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(q), 3)), 1 / 2.6)));
        G.R(g, hx - hw2 - 1, hsy + 2 + j2, hw2 * 2 + 2, 1, OUT);
        G.R(g, hx - hw2, hsy + 2 + j2, hw2 * 2, 1,
          j2 < 2 ? '#f4c4cf' : j2 > 8 ? '#b8788e' : '#e8a8bb');
      }
      G.Rh(g, hx - 5, hsy + 5, 2, 2, '#8f4a63');
      G.Rh(g, hx + 3, hsy + 5, 2, 2, '#4a3a28');
      g.globalAlpha = 0.5; G.Rh(g, hx + 1, hsy + 7, 7, 4, '#4a3a28'); g.globalAlpha = 1;
      // a mouth, gritted shut
      G.Rh(g, hx - 6, hsy + 9, 12, 2, '#8a3a52');
      for (let i = 0; i < 4; i++) G.Rh(g, hx - 5 + i * 3, hsy + 9, 1.5, 2, '#c8798f');
      // the torn neck, sparking
      G.Rh(g, hx - 7, hsy + 15, 14, 3, '#2a3040');
      for (let i = 0; i < 6; i++)
        G.Rh(g, hx - 6 + i * 2.4, hsy + 17 + (i % 2), 1.5, 3, i % 2 ? '#48546c' : '#6b3f22');
      if (Math.random() < 0.3) {
        const sx2 = hx + G.rand(-6, 6);
        G.Rh(g, sx2, hsy + 17, 1, 1, '#ffffff');
        G.glow(g, sx2, hsy + 17, 16, 10, '#7fd8ff', 0.6);
      }

      // ---- the arm and hand ----
      const grip = a.state === 'grip';
      // forearm
      G.Rh(g, ax - 7, ay - 3, 14, 6, OUT);
      G.Rh(g, ax - 6, ay - 2, 12, 4, grip ? '#a8bcd0' : '#8a94a8');
      G.hair(g, ax - 6, ay - 2, 12, '#d8e4f0');
      // fingers, closing when gripped
      for (let i = 0; i < 3; i++) {
        const fy = ay - 3 + i * 3;
        const cl = grip ? 3 : 0;
        G.Rh(g, ax + 5 - cl, fy, 5 + cl, 2, grip ? '#c8d8e8' : '#8a94a8');
        G.hair(g, ax + 5 - cl, fy, 5 + cl, '#ffffff');
      }
      G.Rh(g, ax - 8, ay + 2, 4, 3, '#6b7f96');       // thumb
      if (grip) {
        G.glow(g, ax, ay, 22, 16, '#ffd47a', 0.35 + this.strain * 0.3);
        // sparks where metal fights metal
        if (Math.random() < 0.4 * (0.3 + this.strain))
          G.Rh(g, ax + G.rand(-6, 6), ay + G.rand(-4, 4), 1, 1, '#ffffff');
      }
    },

    // ---- the first four seconds: coming back on ----
    drawWake(g, t) {
      const w = this.wakeT;
      // the world fades up out of black
      const a = G.clamp((w - 0.6) / 2.2, 0, 1);
      g.globalAlpha = 1 - a;
      G.R(g, 0, 0, G.W, G.H, '#04060a');
      g.globalAlpha = 1;
      // boot text, typed
      if (w > 1.2) {
        const lines = [
          'POWER . . . 4%',
          'CHASSIS . . . NOT FOUND',
          'LEFT ARM . . . NOT FOUND',
          'RIGHT ARM . . . PRESENT',
          'PURPOSE . . . GELATO',
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
        G.text(g, 'GRAB SOMETHING. PULL.', 160, 148, fl ? '#ffe4b0' : '#8a7458',
          { align: 'center', out: OUT });
        G.text(g, 'TAP A HANDHOLD, THEN DRAG AWAY FROM IT', 160, 160, '#6b5f4a',
          { align: 'center', sc: 0.5 });
      }
    },

    // ---- climbing chrome: a depth meter and a strain gauge ----
    drawHud(g, t) {
      const pr = this.progress();
      G.R(g, 306, 14, 8, 150, '#0b0e14');
      G.bevel(g, 306, 14, 8, 150, '#2a3040', '#050709');
      G.R(g, 307, 15 + (1 - pr) * 148, 6, Math.max(2, pr * 148), '#3f6b5c');
      G.hair(g, 307, 15 + (1 - pr) * 148, 6, '#7fd8a0');
      // where you are now, if you have slipped below your best
      const cur = G.clamp((BOT - 30 - this.hy) / (BOT - 30 - (TOP + 30)), 0, 1);
      if (cur < pr - 0.01) G.Rh(g, 305, 15 + (1 - cur) * 148, 10, 1, '#ff7a8a');
      G.text(g, 'OUT', 310, 6, '#6b7f96', { align: 'center', sc: 0.5 });
      G.text(g, Math.round(cur * 100) + '%', 310, 168, '#8fa0bc', { align: 'center', sc: 0.5 });
      if (this.strain > 0.02) {
        const gx = 110, gw = 100;
        G.R(g, gx, 156, gw, 8, '#12141c');
        G.bevel(g, gx, 156, gw, 8, '#2a3040', '#050709');
        const f = G.clamp(this.strain / 1.4, 0, 1);
        const col = f > 0.78 ? P.magenta : f > 0.5 ? P.hazard : '#b6ff3a';
        G.R(g, gx + 1, 157, Math.round((gw - 2) * f), 6, col);
        G.hair(g, gx + 1, 157, Math.round((gw - 2) * f), '#ffffff');
        if (this.arm.grip) {
          const blind = (BOT - this.arm.grip.y) / (BOT - TOP) > 0.66 && this.arm.grip.tough < 1.1;
          if (!blind) {
            const mark = gx + 1 + Math.round((gw - 2) * G.clamp(this.arm.grip.tough / 1.4, 0, 1));
            G.Rh(g, mark, 154, 1, 12, P.magentaLt);
          }
        }
        G.text(g, f > 0.78 ? 'IT IS GOING TO GO' : 'PULL', gx + gw / 2, 146,
          f > 0.78 ? P.magentaLt : '#c8b490', { align: 'center', sc: 0.5 });
      } else if (this.arm.state === 'idle') {
        const dn = this.onlyWayDown();
        G.text(g, dn ? 'THE ONLY WAY ON IS DOWN' : 'TAP A HANDHOLD', 160, 160,
          dn ? '#ffd47a' : '#5c5040', { align: 'center', sc: 0.5 });
      }
      if (this.slip > 0.3)
        G.text(g, 'SLIPPING', 160, 130, P.magentaLt, { align: 'center', out: OUT });
      // what the pit just did to you
      if (this.msg && this.msgT < 2.2) {
        const a = Math.min(1, this.msgT * 4) * Math.min(1, (2.2 - this.msgT) * 2);
        g.globalAlpha = a;
        G.text(g, this.msg, 160, 24, '#c8b490', { align: 'center', sc: 0.5, out: OUT });
        g.globalAlpha = 1;
      }
    },

    // ---- over the top ----
    drawOver(g, t) {
      const o = this.overT || 0;
      g.globalAlpha = Math.min(0.55, o * 0.4);
      G.R(g, 0, 0, G.W, G.H, '#1a1208');
      g.globalAlpha = 1;
      G.glow(g, 160, 60, 300, 160, '#ffd47a', Math.min(0.6, o * 0.4));
      if (o > 0.6) {
        const a = G.clamp((o - 0.6) / 0.6, 0, 1);
        g.globalAlpha = a;
        G.text(g, 'OUT.', 160, 62, '#ffe4b0', { align: 'center', out: OUT, sc: 2 });
        g.globalAlpha = 1;
      }
      if (o > 1.6) {
        const a = G.clamp((o - 1.6) / 0.6, 0, 1);
        g.globalAlpha = a;
        G.text(g, 'A HEAD, AN ARM, AND SIX HOURS OF RAIN.', 160, 92, '#c8b490',
          { align: 'center', sc: 0.5 });
        G.text(g, 'THEN SOMEBODY SHINES A TORCH AT YOU.', 160, 100, '#c8b490',
          { align: 'center', sc: 0.5 });
        g.globalAlpha = 1;
      }
      if (o > 2.8) G.text(g, 'TAP', 160, 150, Math.sin(t * 4) > 0 ? '#8a7458' : '#4a4030',
        { align: 'center', sc: 0.5 });
    },
  };
})();

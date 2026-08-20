// ============================================================
// DOUBLE LIFE v3 - art3.js
// The chunky pass. At 320x180 detail is the enemy: everything
// here is built from flat boxel faces, three tones, hard black
// outlines and big readable silhouettes.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  // ------------------------------------------------------------
  // THE EYE. A fat white lozenge with a black vertical slit and a
  // single hard glint. No gradients, no iris rings.
  // ------------------------------------------------------------
  // ------------------------------------------------------------
  // THE EYE. Big and cartoony and legible from 6px to 26px: a
  // quantised round ball, hard black rim, a fat coloured iris, a
  // black pupil and one square catch-light. Never a rounded square.
  // ------------------------------------------------------------
  const ballRows = (w, h) => {
    const rows = [], rx = w / 2, ry = h / 2;
    for (let j = 0; j < h; j++) {
      const dy = (j + 0.5 - ry) / ry;
      rows.push(Math.max(1, Math.round(rx * Math.sqrt(Math.max(0, 1 - dy * dy)))));
    }
    return rows;
  };
  G.ballRows = ballRows;

  function drawBrow(g, x, y, w, h, b, col) {
    const th = Math.max(2, Math.round(h * 0.2));
    for (let i = -2; i < w + 2; i++) {
      const pr = i / (w + 3) - 0.5;
      const yy = y - th - 1 + Math.round(pr * b * h * 0.5);
      G.R(g, x + i, yy, 1, th, OUT);
      G.R(g, x + i, yy, 1, 1, col);
    }
  }

  G.eye3 = function (g, x, y, w, h, o) {
    o = o || {};
    x = Math.round(x); y = Math.round(y);
    w = Math.max(6, Math.round(w)); h = Math.max(6, Math.round(h));
    const cx = x + w / 2, cy = y + h / 2;
    const skin = o.skin || P.croc, skinDk = o.skinDk || P.crocDk2, skinLt = o.skinLt || P.crocLt;
    if (o.closed) {
      const rws = ballRows(w, h);
      const lid = Math.max(2, Math.round(h * 0.68));
      for (let j = 0; j < h; j++) G.R(g, Math.round(cx - rws[j]) - 1, y + j, rws[j] * 2 + 2, 1, OUT);
      // the sliver of eye still showing under the lid
      for (let j = lid; j < h - 1; j++)
        G.R(g, Math.round(cx - rws[j]), y + j, rws[j] * 2, 1, j === lid ? '#100c16' : G.shade(o.iris || '#c9a227', -0.2));
      // the lid itself, in skin, with lashes at the crease
      for (let j = 0; j < lid; j++) G.R(g, Math.round(cx - rws[j]), y + j, rws[j] * 2, 1, j < 2 ? skinDk : skin);
      G.R(g, Math.round(cx - rws[lid]) - 1, y + lid, rws[lid] * 2 + 2, 1, OUT);
      G.R(g, Math.round(cx - rws[2]), y + 2, rws[2] * 2, 1, skinLt);
      if (o.brow !== undefined) drawBrow(g, x, y, w, h, o.brow, skinDk);
      return;
    }
    const rows = ballRows(w, h);
    // hard rim all round
    for (let j = 0; j < h; j++) G.R(g, Math.round(cx - rows[j]) - 1, y + j, rows[j] * 2 + 2, 1, OUT);
    G.R(g, Math.round(cx - rows[0]), y - 1, rows[0] * 2, 1, OUT);
    G.R(g, Math.round(cx - rows[h - 1]), y + h, rows[h - 1] * 2, 1, OUT);
    // sclera, cool in the lower third so the ball has volume
    for (let j = 0; j < h; j++) {
      const c = j === 0 ? '#c4bda6' : j >= h - 2 ? '#cdc6b0' : j >= h - 3 ? '#e4dec8' : '#f8f4e6';
      G.R(g, Math.round(cx - rows[j]), y + j, rows[j] * 2, 1, c);
    }
    // iris: a fat round block filling most of the ball
    const ir = Math.max(3, Math.round(Math.min(w, h) * 0.64));
    const ix = cx + (o.lookX || 0) * (w / 2 - ir / 2 - 1);
    const iy = cy + (o.lookY || 0) * (h / 2 - ir / 2 - 1) + (h - ir) * 0.1;
    const iris = o.iris || '#c9a227';
    const irD = G.shade(iris, -0.34), irL = G.shade(iris, 0.3);
    const ir0 = Math.round(iy - ir / 2);
    const irows = ballRows(ir, ir);
    for (let j = 0; j < ir; j++) {
      const c = j < ir * 0.34 ? irD : j > ir * 0.76 ? irL : iris;
      G.R(g, Math.round(ix - irows[j]), ir0 + j, irows[j] * 2, 1, c);
    }
    // pupil: a slit for the reptiles, a fat dot for everyone else
    const pw = Math.max(2, Math.round(ir * (o.slit ? 0.3 : 0.46)));
    const ph = o.slit ? Math.max(3, ir - 1) : pw;
    const prows = o.slit ? null : ballRows(pw, ph);
    for (let j = 0; j < ph; j++) {
      const hw = prows ? prows[j] : pw / 2;
      G.R(g, Math.round(ix - hw), Math.round(iy - ph / 2) + j, Math.max(1, Math.round(hw * 2)), 1, '#100c16');
    }
    // one hard square catch-light, top-left
    const gl = Math.max(1, Math.round(Math.min(w, h) * 0.2));
    G.R(g, Math.round(cx - rows[Math.max(1, Math.round(h * 0.22))] * 0.72), Math.round(y + h * 0.18), gl, gl, '#ffffff');
    // lid
    if (o.lid) {
      const ld = Math.round(h * G.clamp(o.lid, 0, 1));
      for (let j = 0; j < ld && j < h; j++) G.R(g, Math.round(cx - rows[j]) - 1, y + j, rows[j] * 2 + 2, 1, skin);
      const k = Math.min(h - 1, ld);
      if (ld > 0) G.R(g, Math.round(cx - rows[k]) - 1, y + ld, rows[k] * 2 + 2, 1, OUT);
    }
    if (o.brow !== undefined) drawBrow(g, x, y, w, h, o.brow, skinDk);
  };

  // ------------------------------------------------------------
  // SPECIES SKIN + BUILD. Each animal gets a colour ramp and a
  // body build so the cast is not all one size.
  // ------------------------------------------------------------
  const SKIN = {
    bullfrog:   { i: '#d9a227', c: '#6bbf42', l: '#8ed95c', d: '#3d7a26', d2: '#2a5518', belly: '#c8e07a' },
    toad:       { i: '#c98a2a', c: '#a8813a', l: '#c9a256', d: '#6b5020', d2: '#4a3614', belly: '#d9bc7a' },
    treefrog:   { i: '#e8b400', c: '#3ad97a', l: '#6bf0a0', d: '#1f8a4a', d2: '#136030', belly: '#d9ffb8' },
    axolotl:    { i: '#3a3a52', c: '#f090b8', l: '#ffb8d4', d: '#c25c86', d2: '#8a3a5c', belly: '#ffd8e8' },
    newt:       { i: '#ff8a2a', c: '#3a3a4a', l: '#56566b', d: '#22222e', d2: '#14141c', belly: '#ff8a2a' },
    viper:      { i: '#e8c000', c: '#4a9a5a', l: '#6bc47a', d: '#2a6236', d2: '#1a4222', belly: '#d9d07a' },
    python:     { i: '#c07a20', c: '#c9a256', l: '#e8c47a', d: '#8a6b30', d2: '#5c4620', belly: '#f0dca8' },
    gecko:      { i: '#2a8ad9', c: '#4ac0e0', l: '#7adcf4', d: '#2680a0', d2: '#175468', belly: '#c8f0ff' },
    iguana:     { i: '#c9d92a', c: '#7ac44a', l: '#9ee06b', d: '#4a8a2a', d2: '#305c18', belly: '#c8e08a' },
    gator:      { i: '#d9c227', c: '#6bbf42', l: '#8ed95c', d: '#3d7a26', d2: '#2a5518', belly: '#c8e07a' },
    turtle:     { i: '#a86b20', c: '#8aa84a', l: '#a8c46b', d: '#5c7530', d2: '#3d4f1c', belly: '#d9c47a' },
    salamander: { i: '#ffd42a', c: '#d94a2a', l: '#f0704a', d: '#9a2e18', d2: '#6b1e0e', belly: '#ffb43a' },
  };
  G.skinOf = (id) => SKIN[id] || SKIN.gator;

  // build: how the bust is proportioned. Variety across the cast.
  const BUILD = {
    bullfrog:   { w: 1.18, h: 0.92, snout: 0.72, eye: 1.18, jaw: 1.15 },
    toad:       { w: 1.22, h: 0.88, snout: 0.66, eye: 1.05, jaw: 1.2 },
    treefrog:   { w: 0.92, h: 0.96, snout: 0.6,  eye: 1.3,  jaw: 1.0 },
    axolotl:    { w: 1.05, h: 0.9,  snout: 0.55, eye: 1.2,  jaw: 0.95 },
    newt:       { slit: 1, w: 0.84, h: 1.02, snout: 0.95, eye: 0.9,  jaw: 0.9 },
    viper:      { slit: 1, w: 0.9,  h: 0.82, snout: 1.05, eye: 1.0,  jaw: 1.05 },
    python:     { slit: 1, w: 1.0,  h: 0.8,  snout: 1.15, eye: 0.95, jaw: 1.1 },
    gecko:      { slit: 1, w: 0.96, h: 0.94, snout: 0.85, eye: 1.35, jaw: 0.95 },
    iguana:     { slit: 1, w: 1.04, h: 0.98, snout: 1.0,  eye: 0.95, jaw: 1.0 },
    gator:      { slit: 1, w: 1.14, h: 0.9,  snout: 1.3,  eye: 0.9,  jaw: 1.25 },
    turtle:     { slit: 1, w: 1.1,  h: 0.86, snout: 0.8,  eye: 0.9,  jaw: 1.1 },
    salamander: { w: 0.88, h: 1.0,  snout: 0.9,  eye: 1.1,  jaw: 0.95 },
  };
  G.buildOf = (id) => BUILD[id] || BUILD.gator;

  // ------------------------------------------------------------
  // CUSTOMER BUST - the close two-shot subject. Big cartoony head,
  // front three-quarter, with a mouth that really opens.
  // o: {t, open:0..1, mood, chew, hat}
  // ------------------------------------------------------------
  G.drawBust = function (g, spId, cx, cy, scale, o) {
    o = o || {};
    const S = scale || 1;
    const u = (v) => Math.round(v * S);
    const sk = G.skinOf(spId), bd = G.buildOf(spId);
    const of = G.outfitOf ? G.outfitOf(spId) : { c1: '#7a2f2f', c2: '#c9a227', hc: '#3c4a2a', hat: 'flatcap' };
    const t = o.t || 0;
    const open = G.clamp(o.open === undefined ? 0 : o.open, 0, 1);
    const bob = Math.sin(t * 1.8) * u(1);
    cx = Math.round(cx); cy = Math.round(cy + bob);

    const HW = u(30 * bd.w), HH = u(26 * bd.h);          // head half-w, half-h
    const top = cy - HH;

    // ---- shoulders: a real garment, not a coloured slab ----
    const shY = cy + HH - u(6);
    const shW = Math.round(HW * 3.0), shH = Math.max(12, u(34));
    const shX = Math.round(cx - shW / 2);
    if (G.drawTopGarment) G.drawTopGarment(g, of.top, { x: shX, y: shY, w: shW, h: shH }, of, t);
    else G.box(g, shX, shY, shW, shH, of.c1,
      { lit: G.shade(of.c1, 0.24), dk: G.shade(of.c1, -0.32), r: 2 });
    // shoulder seams where the sleeves are set in
    const sm = G.shade(of.c1, -0.34);
    G.R(g, shX + Math.round(shW * 0.2), shY + 2, 1, shH - 4, sm);
    G.R(g, shX + shW - Math.round(shW * 0.2), shY + 2, 1, shH - 4, sm);
    // a collar that wraps the neck, with a hard notch
    const cw2 = Math.round(HW * 1.25), ch2 = Math.max(4, u(6));
    G.rr(g, cx - cw2 / 2 - 1, shY - ch2, cw2 + 2, ch2 + 2, OUT);
    G.rr(g, cx - cw2 / 2, shY - ch2 + 1, cw2, ch2, G.shade(of.c1, 0.12));
    G.R(g, cx - cw2 / 2 + 1, shY - ch2 + 1, cw2 - 2, 1, G.shade(of.c1, 0.34));
    G.R(g, cx - 1, shY - ch2 + 1, 2, ch2, OUT);
    // neck in shadow behind the collar
    G.R(g, cx - Math.round(HW * 0.34), shY - ch2 - u(3), Math.round(HW * 0.68), u(4), sk.d);

    // ---- skull: one bold rounded box, with a bright rim so even the
    // darkest species reads against the dark room ----
    G.rr2(g, cx - HW - 1, top - 1, HW * 2 + 2, HH * 2 - u(4) + 2, G.shade(sk.l, 0.15));
    G.box(g, cx - HW, top, HW * 2, HH * 2 - u(4), sk.c,
      { lit: sk.l, dk: sk.d, r: 3, band: Math.max(2, u(5)) });
    // a couple of flat darker spots - texture without noise
    G.R(g, cx - HW + u(6), top + u(9), u(5), u(3), sk.d);
    G.R(g, cx + HW - u(12), top + u(7), u(4), u(3), sk.d);
    G.R(g, cx - u(3), top + u(5), u(6), u(2), sk.d);

    // ---- BIG cartoon eyes, sitting proud on the brow of the skull ----
    const eW = Math.max(7, Math.round(HW * 0.60 * bd.eye));
    const eH = Math.max(7, Math.round(HW * 0.55 * bd.eye));
    const eSp = Math.round(HW * 0.47);
    const eyY = top + Math.max(u(4), Math.round(HH * 0.30));
    const blink = !o.noBlink && Math.sin(t * 1.1 + cx * 0.2) > 0.992;
    const mood = o.mood || 'idle';
    for (const s of [-1, 1]) {
      const ex = cx + s * eSp - Math.round(eW / 2);
      // the socket the ball bulges out of
      G.rr2(g, ex - 2, eyY - 2, eW + 4, eH + 4, sk.l);
      G.rr2(g, ex - 3, eyY - 1, eW + 6, eH + 3, OUT);
      G.rr2(g, ex - 2, eyY - 2, eW + 4, eH + 4, sk.l);
      G.eye3(g, ex, eyY, eW, eH, {
        skin: sk.c, skinLt: sk.l, skinDk: sk.d, iris: sk.i, slit: bd.slit,
        closed: blink || mood === 'happy',
        lookX: mood === 'angry' ? s * -0.3 : Math.sin(t * 0.6) * 0.3,
        lookY: mood === 'sick' ? 0.35 : open > 0.6 ? -0.15 : 0,
        brow: mood === 'angry' ? -s * 0.95
          : mood === 'sick' || mood === 'worried' ? s * 0.7 : undefined,
      });
    }

    // ---- snout / muzzle block ----
    const mW = Math.round(HW * 1.5 * bd.snout / 1.0);
    const mTop = Math.round(Math.max(eyY + eH + u(2), top + HH * 1.08));
    const mH = u(13);
    G.box(g, cx - mW / 2, mTop, mW, mH, sk.c, { lit: sk.l, dk: sk.d, r: 2, band: Math.max(1, u(3)) });
    // nostrils
    G.R(g, cx - mW / 2 + u(5), mTop + u(3), u(3), u(3), sk.d2);
    G.R(g, cx + mW / 2 - u(8), mTop + u(3), u(3), u(3), sk.d2);

    // ---- THE MOUTH. Opens for real. ----
    const jawY = mTop + mH - u(1);
    const gape = Math.round(open * u(24) * bd.jaw);
    if (gape > 1) {
      const mw = Math.round(mW * 0.86);
      // the whole mouth group gets a hard black frame so it reads as a
      // gaping maw in front of the chest, not a hole cut in the shirt
      G.rr2(g, cx - mW / 2 - 1, jawY - 1, mW + 2, gape + u(11), OUT);
      // dark maw, throat going darker toward the back
      G.box(g, cx - mw / 2, jawY, mw, gape, P.maw,
        { lit: P.gum, dk: P.mawDk, r: 2, band: Math.max(1, u(2)) });
      const thH = Math.max(1, Math.round(gape * 0.34));
      G.rr(g, cx - mw * 0.3, jawY + Math.round(gape * 0.3), mw * 0.6, thH, P.mawDk);
      // upper teeth
      const nT = G.clamp(Math.round(mw / Math.max(6, u(9))), 3, 9);
      const step = Math.max(3, Math.round(mw / nT));
      for (let i = 0; i < nT; i++) {
        const tw = Math.max(2, step - 1);
        const tx = cx - mw / 2 + 1 + i * step;
        G.box(g, tx, jawY + 1, tw, Math.max(3, u(5)), P.bone,
          { lit: '#ffffff', dk: P.boneDk, r: 1, band: 1, spec: false });
      }
      // tongue rising from the floor of the mouth
      if (gape > Math.max(5, u(7))) {
        const tgH = Math.max(3, u(6));
        const tgY = jawY + gape - tgH;
        G.rr(g, cx - mw * 0.38 - 1, tgY - 1, mw * 0.76 + 2, tgH + 2, OUT);
        G.box(g, cx - mw * 0.36, tgY, mw * 0.72, tgH, P.gum,
          { lit: P.gumLit, dk: P.gumDk, r: 2, band: 1, spec: false });
        G.R(g, cx - 1, tgY + 1, 2, tgH - 2, P.gumDk);   // median furrow
      }
      // lower teeth on the jaw lip
      for (let i = 0; i < nT - 1; i++) {
        const tw = Math.max(2, step - 2);
        const tx = cx - mw / 2 + step * i + Math.max(2, u(3));
        G.box(g, tx, jawY + gape - Math.max(2, u(3)), tw, Math.max(2, u(3)), P.bone,
          { lit: '#ffffff', dk: P.boneDk, r: 1, band: 0, spec: false });
      }
      // lower jaw block
      G.box(g, cx - mW / 2, jawY + gape - u(1), mW, u(9), sk.c,
        { lit: sk.l, dk: sk.d, r: 2, band: Math.max(1, u(2)) });
    } else {
      // closed: a hard mouth line with a couple of fangs poking up
      G.R(g, cx - mW / 2 + u(2), jawY, mW - u(4), u(2), OUT);
      if (mood !== 'sick') for (let i = 0; i < 3; i++)
        G.R(g, cx - u(9) + i * u(9), jawY - u(3), u(3), u(3), P.bone);
      G.box(g, cx - mW / 2, jawY + u(1), mW, u(8), sk.c,
        { lit: sk.l, dk: sk.d, r: 2, band: Math.max(1, u(2)) });
    }

    // ---- hat ----
    if (G.drawHatAcc) G.drawHatAcc(g, of.hat, { cx, top, w: HW * 2, h: HH * 2 }, of, t);

    // species tells, kept to one flat shape each
    if (spId === 'axolotl') for (const s of [-1, 1]) for (let i = 0; i < 3; i++)
      G.box(g, cx + s * (HW + u(1)) - (s < 0 ? u(9) : 0), top + u(8) + i * u(7), u(9), u(4), '#ff7ab0',
        { lit: '#ffb0d0', dk: '#c04a80', r: 1, band: 1, spec: false });
    if (spId === 'iguana') for (let i = 0; i < 5; i++)
      G.R(g, cx - u(12) + i * u(6), top - u(4), u(3), u(5), sk.d);
    if (spId === 'turtle') G.box(g, cx - HW * 0.5, top + u(1), HW, u(6), sk.d, { r: 2, band: 1, spec: false });
    return { mouthX: cx, mouthY: jawY, jawY, headTop: top, hw: HW };
  };

  // ------------------------------------------------------------
  // THE MAW - the clinic view. A giant croc head filling the frame
  // with the jaws held apart, exactly the reference framing.
  // Returns the rect of the open mouth cavity.
  // ------------------------------------------------------------
  G.drawMaw = function (g, spId, x, y, w, h, o) {
    o = o || {};
    const sk = G.skinOf(spId);
    const t = o.t || 0;
    const flinch = o.flinch ? Math.round(Math.sin(t * 40) * 2) : 0;
    x = Math.round(x + flinch); y = Math.round(y);

    const upperH = Math.round(h * 0.34);
    const lowerH = Math.round(h * 0.2);
    const cavY = y + upperH;
    const cavH = h - upperH - lowerH;

    // ---- upper jaw slab ----
    G.box(g, x, y, w, upperH, sk.c, { lit: sk.l, dk: sk.d, r: 3, band: Math.round(upperH * 0.26) });
    // flat spots
    for (let i = 0; i < 3; i++) {
      G.R(g, x + 30 + i * Math.round(w / 3.2), y + 17 + (i % 2) * 6, 7, 4, sk.d);
    }
    // nostrils - big enough to read, sitting below the light band
    for (const nx of [x + Math.round(w * 0.35), x + Math.round(w * 0.57)]) {
      G.rr(g, nx - 1, y + Math.round(upperH * 0.42) - 1, 10, 8, sk.d2);
      G.rr(g, nx, y + Math.round(upperH * 0.42), 8, 6, '#1a2a12');
      G.R(g, nx + 1, y + Math.round(upperH * 0.42) + 1, 3, 1, sk.d);
    }

    // ---- eyes riding on the snout ----
    const eW = 22, eH = 15;
    const mood = o.mood || 'idle';
    const blink = mood === 'out' || (mood === 'relief' && Math.sin(t * 2) > -0.3) ||
                  (mood !== 'agony' && Math.sin(t * 1.2 + 1) > 0.975);
    for (const s of [-1, 1]) {
      const ex = x + w / 2 + s * Math.round(w * 0.29) - eW / 2;
      G.box(g, ex - 5, y - 7, eW + 10, eH + 11, sk.c,
        { lit: sk.l, dk: sk.d, r: 4, band: 4, spec: false });
      G.eye3(g, ex, y - 2, eW, eH, {
        skin: sk.c, skinLt: sk.l, skinDk: sk.d2, closed: blink,
        wide: mood === 'agony',
        lookX: mood === 'agony' ? 0 : Math.sin(t * 0.7) * 0.3,
        brow: mood === 'agony' ? 1.2 : mood === 'worry' ? -1 : undefined,
      });
    }

    // ---- the cavity ----
    G.R(g, x + 4, cavY, w - 8, cavH, P.mawDk);
    // walls catch a little light near the lips
    G.R(g, x + 4, cavY, w - 8, 4, '#4a1420');
    G.R(g, x + 4, cavY + cavH - 4, w - 8, 4, '#4a1420');
    G.R(g, x + 4, cavY, 5, cavH, '#4a1420');
    G.R(g, x + w - 9, cavY, 5, cavH, '#4a1420');
    // throat
    G.box(g, x + w / 2 - 30, cavY + cavH / 2 - 12, 60, 24, '#2a0a14', { r: 3, band: 2, spec: false });

    // ---- gum bars ----
    G.box(g, x + 6, cavY - 1, w - 12, 6, P.gum, { lit: P.gumLit, dk: P.gumDk, r: 1, band: 1, spec: false });
    G.box(g, x + 6, cavY + cavH - 5, w - 12, 6, P.gum, { lit: P.gumLit, dk: P.gumDk, r: 1, band: 1, spec: false });

    // ---- lower jaw slab ----
    G.box(g, x, y + h - lowerH, w, lowerH, sk.c,
      { lit: sk.l, dk: sk.d, r: 3, band: Math.round(lowerH * 0.3) });
    G.R(g, x + 10, y + h - lowerH + 8, w - 20, 2, sk.d);

    return { x: x + 8, y: cavY + 5, w: w - 16, h: cavH - 10, upperGum: cavY + 5, lowerGum: cavY + cavH - 5 };
  };

  // ------------------------------------------------------------
  // A CHUNKY TOOTH - flat cream face, hard shadow, optional number
  // ------------------------------------------------------------
  G.tooth3 = function (g, th, o) {
    o = o || {};
    const base = o.dead ? '#9a9686' : P.bone;
    // a slight taper toward the biting edge so it reads as a tooth
    const rows = [];
    for (let j = 0; j < th.h; j++) {
      const p = th.up ? j / (th.h - 1) : 1 - j / (th.h - 1);
      const round = Math.min(j, th.h - 1 - j) < 2 ? (Math.min(j, th.h - 1 - j) === 0 ? 2 : 1) : 0;
      rows.push(Math.round(th.w / 2 - Math.pow(p, 2.4) * th.w * 0.04) - round);
    }
    const cx = th.x + th.w / 2;
    for (let j = 0; j < th.h; j++) G.R(g, cx - rows[j] - 1, th.y + j, rows[j] * 2 + 2, 1, OUT);
    for (let j = 0; j < th.h; j++) {
      const p = th.up ? j / (th.h - 1) : 1 - j / (th.h - 1);
      const c = p < 0.16 ? '#ffffff' : p < 0.74 ? base : o.dead ? '#6b6858' : P.boneDk;
      G.R(g, cx - rows[j], th.y + j, rows[j] * 2, 1, c);
      G.R(g, cx + rows[j] - 2, th.y + j, 2, 1, G.shade(c, -0.14));
    }
    // one soft central groove
    G.R(g, Math.round(cx), th.y + 4, 1, th.h - 8, G.shade(base, -0.14));
    // biting edge
    const ey = th.up ? th.y + th.h - 3 : th.y;
    G.R(g, cx - rows[th.up ? th.h - 1 : 0] + 1, ey, rows[th.up ? th.h - 1 : 0] * 2 - 2, 3, G.shade(base, -0.22));
    if (o.label !== undefined) {
      G.text(g, '' + o.label, th.x + th.w / 2, th.up ? th.y + 3 : th.y + th.h - 10,
        '#8a8474', { align: 'center' });
    }
  };

  // ------------------------------------------------------------
  // MITT - a small chunky glove holding whatever tool you picked.
  // No forearm reaching across the screen.
  // ------------------------------------------------------------
  G.drawMitt = function (g, x, y, o) {
    o = o || {};
    const col = o.col || '#e8dcc0', dk = G.shade(col, -0.3), lit = G.shade(col, 0.2);
    x = Math.round(x); y = Math.round(y);
    const grip = o.grip ? 1 : 0;
    // cuff
    G.box(g, x - 7, y + 7, 14, 6, '#3a6b8a', { r: 1, band: 1, spec: false });
    // palm
    G.box(g, x - 6, y - 1, 12, 9, col, { lit, dk, r: 2, band: 2 });
    // thumb
    G.box(g, x + 4, y - 3, 5, 6, col, { lit, dk, r: 1, band: 1, spec: false });
    // two chunky fingers curling over the shaft
    G.box(g, x - 7, y - 5 + grip, 6, 5, col, { lit, dk, r: 1, band: 1, spec: false });
    G.box(g, x - 2, y - 6 + grip, 6, 5, col, { lit, dk, r: 1, band: 1, spec: false });
  };

  // ------------------------------------------------------------
  // ICE CREAM, chunky and appetising: a stacked cone with real
  // drip lobes on each scoop instead of a smooth dome.
  // ------------------------------------------------------------
  G.cone3 = function (g, x, baseY, scoops, o) {
    o = o || {};
    x = Math.round(x); baseY = Math.round(baseY);
    const cw = o.w || 22, ch = o.h || 26;
    // waffle cone: a point at the bottom widening to the rim, with the
    // lattice cut across it and a hard lit edge down one side
    for (let i = 0; i < ch; i++) {
      const p = i / (ch - 1);
      const hw = Math.max(1, Math.round((cw / 2) * (0.16 + 0.84 * p)));
      const yy = baseY - i;
      G.R(g, x - hw - 1, yy, hw * 2 + 2, 1, OUT);
      G.R(g, x - hw, yy, hw * 2, 1, G.mix('#8a5620', '#d09a44', p));
      G.R(g, x - hw, yy, 1, 1, '#e8b45c');
      if (i % 4 === 1 && hw > 2) G.R(g, x - hw + 1, yy, hw * 2 - 2, 1, '#6b3d12');
    }
    for (let d = -1; d < 2; d++) {
      const xx = x + Math.round(d * cw * 0.22);
      for (let i = 2; i < ch - 1; i += 4) G.R(g, xx, baseY - i, 1, 1, '#6b3d12');
    }
    // the rim the ice cream sits in
    const rimY = baseY - ch;
    G.rr(g, x - cw / 2 - 1, rimY - 3, cw + 2, 5, OUT);
    G.box(g, x - cw / 2, rimY - 2, cw, 4, '#e8c47a', { lit: '#fff0c0', dk: '#b08a44', r: 1, band: 1, spec: false });
    // scoops, the bottom one bedded down into the rim
    let sy = rimY - 1;
    for (let i = 0; i < scoops.length; i++) {
      const f = G.flavorById(scoops[i]);
      if (!f) continue;
      const r = Math.max(4, Math.round((o.sr || 11) - i * 1.4));
      G.scoop3(g, x, sy - Math.round(r * 0.72), r, f,
        { squash: o.squash && i === scoops.length - 1 ? o.squash : 0 });
      sy -= Math.round(r * 1.35);
    }
    return { topY: sy };
  };

  // one scoop: flat top-lit face, hard shadow underside, drip lobes
  G.scoop3 = function (g, cx, cy, r, flavor, o) {
    o = o || {};
    const f = typeof flavor === 'string' ? G.flavorById(flavor) : flavor;
    if (!f) return;
    const c = f.col;
    const tone = [G.shade(c, 0.6), G.shade(c, 0.28), c, G.shade(c, -0.26), G.shade(c, -0.46)];
    const sq = 1 + (o.squash || 0);
    const rx = Math.max(3, Math.round(r * sq)), ry = Math.max(3, Math.round(r / sq));
    cx = Math.round(cx); cy = Math.round(cy);
    // a real ball: one run-length shaded scanline at a time, tone taken
    // from the sphere normal against a single hard top-left key light.
    const tn = [];
    for (let j = -ry; j < ry; j++) {
      const dy = (j + 0.5) / ry;
      const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - dy * dy)));
      if (hw <= 0) continue;
      const yy = cy + j, n2 = hw * 2;
      G.R(g, cx - hw - 1, yy, n2 + 2, 1, OUT);
      tn.length = 0;
      for (let k = 0; k < n2; k++) {
        const nx = (-hw + k + 0.5) / rx;
        const nz = Math.sqrt(Math.max(0.02, 1 - nx * nx - dy * dy));
        const li = nx * -0.46 + dy * -0.56 + nz * 0.69;
        tn.push(li > 0.9 ? 0 : li > 0.68 ? 1 : li > 0.36 ? 2 : li > 0.1 ? 3 : 4);
      }
      let k0 = 0;
      for (let k = 1; k <= n2; k++) {
        if (k === n2 || tn[k] !== tn[k0]) { G.R(g, cx - hw + k0, yy, k - k0, 1, tone[tn[k0]]); k0 = k; }
      }
    }
    // one churned ridge following the curvature
    for (let i = -rx + 2; i < rx - 2; i++) {
      const nx = i / rx;
      if (Math.abs(nx) > 0.84) continue;
      G.R(g, cx + i, cy + Math.round(ry * 0.14 + Math.sin(nx * 2.2) * ry * 0.24), 1, 1, tone[3]);
    }
    // drip lobes hanging off the lower rim, seated on the real silhouette
    const lobes = rx > 8 ? 3 : 2;
    for (let i = 0; i < lobes; i++) {
      const nx = ((i + 0.5) / lobes * 2 - 1) * 0.66;
      const lx = cx + Math.round(nx * rx) - 3;
      const ly = cy + Math.round(ry * Math.sqrt(Math.max(0, 1 - nx * nx))) - 2;
      const lh = 3 + ((i + cx) % 2) * 2;
      G.rr(g, lx - 1, ly, 8, lh + 2, OUT);
      G.rr(g, lx, ly, 6, lh, tone[3]);
      G.R(g, lx + 1, ly + lh - 2, 4, 1, tone[4]);
    }
    // hard specular block
    G.R(g, cx - Math.round(rx * 0.52), cy - Math.round(ry * 0.56),
      Math.max(2, Math.round(rx * 0.32)), Math.max(1, Math.round(ry * 0.2)), '#ffffff');
    // chunky inclusions
    if (f.fleck) for (let i = 0; i < 4; i++) {
      const ax = cx - Math.round(rx * 0.5) + ((i * 7) % Math.max(1, rx));
      const ay = cy - Math.round(ry * 0.2) + ((i * 5) % Math.max(1, ry));
      G.R(g, ax, ay, 2, 2, f.fleck);
    }
  };

  // ------------------------------------------------------------
  // SEWER ROOM DRESSING - brick, pipes, drips, grime, and a grate
  // ------------------------------------------------------------
  G.sewerWall = function (g, x, y, w, h, t) {
    G.R(g, x, y, w, h, P.sewer);
    // brick courses
    for (let ry = 0; ry < h; ry += 9) {
      const off = ((ry / 9) & 1) ? 11 : 0;
      G.R(g, x, y + ry, w, 1, P.sewerDk);
      for (let bx = -off; bx < w; bx += 22) G.R(g, x + bx + off, y + ry, 1, 9, P.sewerDk);
      // a few lighter bricks
      for (let bx = -off; bx < w; bx += 22) {
        const hs = G.hash(bx + ry, ry);
        if (hs > 0.86) G.R(g, x + bx + off + 1, y + ry + 1, 20, 7, P.sewerLt);
        else if (hs < 0.1) G.R(g, x + bx + off + 1, y + ry + 1, 20, 7, P.sewerDk);
      }
    }
    // slime running down from the top
    for (let i = 0; i < w; i += 37) {
      const sx = x + i + (G.hash(i, 3) * 20 | 0);
      const sh = 12 + (G.hash(i, 9) * 40 | 0);
      G.R(g, sx, y, 3, sh, P.slime);
      G.R(g, sx, y, 1, sh, P.slimeLt);
      G.R(g, sx, y + sh, 3, 2, P.slimeLt);
    }
  };

  G.pipe = function (g, x, y, len, vertical, t) {
    const c = P.rust, lit = P.rustLt, dk = G.shade(c, -0.4);
    if (vertical) {
      G.box(g, x, y, 10, len, c, { lit, dk, r: 1, band: 0, spec: false });
      G.R(g, x + 1, y, 2, len, lit);
      G.R(g, x + 8, y, 2, len, dk);
      for (let i = 14; i < len; i += 30) G.box(g, x - 2, y + i, 14, 5, G.shade(c, -0.18), { r: 1, band: 1, spec: false });
    } else {
      G.box(g, x, y, len, 10, c, { lit, dk, r: 1, band: 3, spec: false });
      for (let i = 14; i < len; i += 34) G.box(g, x + i, y - 2, 5, 14, G.shade(c, -0.18), { r: 1, band: 1, spec: false });
    }
  };

  G.grate = function (g, x, y, w, h) {
    G.box(g, x, y, w, h, '#2a3140', { r: 1, band: 1, spec: false });
    for (let i = 3; i < w - 2; i += 5) G.R(g, x + i, y + 2, 2, h - 4, '#101620');
    G.R(g, x + 1, y + 1, w - 2, 1, '#3f4a5c');
  };

  // dripping water from a point
  G.drips = [];
  G.dripFrom = function (x, y) { G.drips.push({ x, y, sy: y, vy: 0, t: 0 }); };
  G.updateDrips = function (dt, floorY) {
    if (Math.random() < dt * 1.2 && G.drips.length < 14) return;
    for (let i = G.drips.length - 1; i >= 0; i--) {
      const d = G.drips[i];
      d.vy += 180 * dt; d.y += d.vy * dt; d.t += dt;
      if (d.y > floorY) G.drips.splice(i, 1);
    }
  };
  G.drawDrips = function (g) {
    for (const d of G.drips) { G.R(g, d.x, d.y, 1, 3, '#6b9450'); G.R(g, d.x, d.y, 1, 1, '#a8d47a'); }
  };
})();

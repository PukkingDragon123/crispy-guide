// ============================================================
// DOUBLE LIFE - moobot.js  ·  THE MASCOT, BUILT TO THE SHEET
//
// Every version before this one bent the generic robot rig into a cow:
// a procedural skull profile, a snout with a mouth line on it, hanging
// ears, a barrel torso with a bulge parameter. You can push that rig a
// long way and it still comes out looking like a rig that has been
// pushed, because every shape in it is a curve with a name like
// `skull(p)` rather than a shape somebody drew.
//
// This is not that. It is a model sheet, part by part:
//
//   · a broad cream head, nearly square, corners knocked off
//   · two black hide patches on it
//   · a red crew cap with the chain's letter, peak forward
//   · tan horn nubs out from under the peak
//   · ONE black visor with two amber slits
//   · a round pink muzzle, two nostrils, no mouth
//   · ear cans either side with the O roundel on them
//   · a red apron with cream straps over a cream body
//   · short dark arms, short dark legs, dark feet
//
// G.drawBot(g, 'player', ...) routes here, so every caller in the game
// -- the walkable scenes, the cutscene silhouettes, the loading card,
// the crawl -- gets this and nothing else has to know.
// ============================================================
(function () {
  const G = window.GAME;
  const OUT = G.PAL.ink;

  // ---- the sheet's seven colours, and the tones either side of them ----
  const C = {
    red: '#c0342e', redL: '#e0584f', redD: '#8c211d', redK: '#5e1513',
    cream: '#f7f0e4', creamL: '#fffbf2', creamD: '#dcd1bf', creamK: '#b8ab97',
    ink: '#2b2b2b', inkL: '#494750', inkD: '#191920',
    tan: '#d19b57', tanL: '#eebe86', tanD: '#a2743c',
    pink: '#e79a9a', pinkL: '#f6bcbc', pinkD: '#b56a6a',
    gold: '#f5c445', goldL: '#ffe79a',
    brown: '#7c4a2c',
  };

  // ---- a rounded box, row by row, so every edge is a hard pixel ----
  function rows(w, h, r) {
    const out = [];
    r = Math.min(r, Math.floor(Math.min(w, h) / 2));
    for (let j = 0; j < h; j++) {
      let ins = 0;
      if (j < r) { const d = r - j - 0.5; ins = Math.round(r - Math.sqrt(Math.max(0, r * r - d * d))); }
      else if (j >= h - r) { const d = j - (h - r) + 0.5; ins = Math.round(r - Math.sqrt(Math.max(0, r * r - d * d))); }
      out.push(ins);
    }
    return out;
  }
  // outline pass for the WHOLE shape, then the fill: do it row by row and
  // each row's black lands on the fill of the row above it
  function box(g, x, y, w, h, r, fill, o) {
    o = o || {};
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    if (w < 1 || h < 1) return [];
    if (o.out !== false) {
      const ro = rows(w + 2, h + 2, r + 1);
      for (let j = 0; j < h + 2; j++)
        G.R(g, x - 1 + ro[j], y - 1 + j, w + 2 - ro[j] * 2, 1, o.out || OUT);
    }
    const rf = rows(w, h, r);
    for (let j = 0; j < h; j++) {
      const p = j / Math.max(1, h - 1);
      G.R(g, x + rf[j], y + j, w - rf[j] * 2, 1,
        o.lit && p < 0.14 ? o.lit : o.dk && p > 0.84 ? o.dk : fill);
    }
    return rf;
  }
  // a filled blob with an outline, for muzzles and cans
  function blob(g, cx, cy, rx, ry, fill, o) {
    o = o || {};
    const iry = Math.ceil(ry);
    if (o.out !== false)
      for (let j = -iry - 1; j <= iry + 1; j++) {
        const t = 1 - (j * j) / ((ry + 1) * (ry + 1));
        if (t < 0) continue;
        const w = Math.round((rx + 1) * Math.sqrt(t));
        G.R(g, Math.round(cx) - w, Math.round(cy) + j, w * 2 + 1, 1, o.out || OUT);
      }
    for (let j = -iry; j <= iry; j++) {
      const t = 1 - (j * j) / (ry * ry);
      if (t < 0) continue;
      const w = Math.round(rx * Math.sqrt(t));
      const p = (j + ry) / (2 * ry);
      G.R(g, Math.round(cx) - w, Math.round(cy) + j, w * 2 + 1, 1,
        o.lit && p < 0.2 ? o.lit : o.dk && p > 0.8 ? o.dk : fill);
    }
  }

  // ---- the hide patches. Fixed shapes, clipped to the head, so the cow
  // has the SAME markings in every frame of every scene. ----
  const PATCH = [
    // [cx, cy, rx, ry] as fractions of the head box, and a wobble seed.
    // They live on the CHEEKS and the temples: anything above -0.30 is
    // under the cap and nobody ever sees it.
    [-0.33, 0.02, 0.15, 0.13, 1.7],
    [0.33, 0.20, 0.13, 0.12, 4.1],
    [-0.28, 0.30, 0.10, 0.08, 2.6],
  ];

  // ------------------------------------------------------------
  // THE HAND, on its own.
  //
  // Published, because the counter needs to show you carrying a cone and
  // a second hand drawn by a second file is how a game ends up with two
  // of everything. sd is which way it faces: -1 left, +1 right.
  // ------------------------------------------------------------
  G.mooHand = function (g2, hxp, hyp, r, sd, grip) {
    grip = G.clamp(grip || 0, 0, 1);
    if (r < 2.2) {                       // tiny: a pale pip, and that is honest
      const q = Math.max(1, Math.round(r * 1.5));
      if (q > 1) G.R(g2, hxp - q / 2 - 0.5, hyp - q / 2 - 0.5, q + 1, q + 1, OUT);
      G.R(g2, hxp - q / 2, hyp - q / 2, q, q, C.cream);
      return;
    }
    const w = Math.max(3, Math.round(r * 2 * (1 - grip * 0.24)));
    const h = Math.max(3, Math.round(r * 2 * (1 - grip * 0.06)));
    const x0 = Math.round(hxp - w / 2), y0 = Math.round(hyp - h / 2);
    // THE CUFF, clear of the palm. At y0-1 the palm's own outline pass
    // painted straight over it and the glove had no wrist at all.
    const cw = Math.max(2, Math.round(w * 0.64));   // a wrist, not a bracelet
    G.R(g2, Math.round(hxp - cw / 2) - 1, y0 - 4, cw + 2, 4, OUT);
    G.R(g2, Math.round(hxp - cw / 2), y0 - 3, cw, 2, C.red);
    G.hairq(g2, Math.round(hxp - cw / 2), y0 - 3, cw, C.redL);
    // the palm
    box(g2, x0, y0, w, h, Math.max(1, Math.round(r * 0.75)), C.cream,
      { lit: C.creamL, dk: C.creamD });
    // THE THUMB, after the palm and not before it: drawn first, the
    // palm's outline swallowed it whole and the mitt was a bean.
    const tw = Math.max(2, Math.round(r * 0.85)), th2 = Math.max(3, Math.round(r * 1.15));
    const tx = sd < 0 ? x0 + w - 1 : x0 - tw + 1;
    box(g2, tx, y0 + Math.round(h * 0.1), tw, th2, Math.max(1, Math.round(tw * 0.4)),
      C.cream, { lit: C.creamL, dk: C.creamD });
    // grooves between the fingers, on the outboard half
    if (h >= 5) {
      const gx = sd < 0 ? x0 + 1 : x0 + Math.round(w * 0.42);
      const gw = Math.max(1, Math.round(w * 0.56));
      for (let k = 1; k <= 2; k++) {
        const gy = y0 + Math.round(h * (0.28 + k * 0.24));
        if (gy >= y0 + h - 1) break;
        G.Rq(g2, gx, gy, gw, 0.5, grip > 0.4 ? C.creamK : C.creamD);
      }
    }
    // closed round something: a dark gap where the fingers meet
    if (grip > 0.5 && w >= 4)
      G.Rq(g2, x0 + (sd < 0 ? 0.5 : w - 1), y0 + h * 0.3, 0.5, h * 0.4, C.creamK);
  };

  // ------------------------------------------------------------
  // THE PANEL IN HIS CHEEK.
  //
  // Everything this machine has ever been told arrived through it, and
  // two scenes now open it -- the boot on the title, and the night he
  // put clause in there himself. One painter, so they cannot drift.
  //
  // Takes the metrics drawMooBot hands back. `open` is 0 shut, 1 wide.
  // A shutter, not a lid: a panel that lifts off leaves a pale slab
  // hanging in front of his face at six pixels across.
  // ------------------------------------------------------------
  G.mooSlot = function (g, m, open, lift) {
    if (!m) return null;
    open = G.clamp(open || 0, 0, 1);
    lift = lift || 0;
    const hh = Math.max(4, m.headY - m.headTop);
    const S2 = {
      w: Math.max(4, Math.round(m.hw * 0.36)),
      h: Math.max(3, Math.round(hh * 0.34)),
      x: m.cx + Math.round(m.hw * 0.44),
      y: m.headTop + Math.round(hh * 1.42) - lift,
    };
    const frame = G.mix('#b8a68a', '#0d0a12', Math.min(1, open * 3));
    G.R(g, S2.x - 1, S2.y - 1, S2.w + 2, S2.h + 2, frame);
    G.R(g, S2.x, S2.y, S2.w, S2.h, open > 0.03 ? '#05070c' : C.cream);
    const oh = open * S2.h;
    const half = Math.max(0, (S2.h - oh) / 2);
    if (half > 0.1) {
      G.Rh(g, S2.x, S2.y, S2.w, half, C.cream);
      G.Rh(g, S2.x, S2.y + S2.h - half, S2.w, half, C.cream);
      G.hairq(g, S2.x, S2.y + half - 0.25, S2.w, '#9a8a70');
      G.hairq(g, S2.x, S2.y + S2.h - half, S2.w, '#fffaf0');
    }
    if (open > 0.03) {
      G.Rq(g, S2.x, S2.y + S2.h - half - 0.5, S2.w, 0.5, G.mix('#3a2a14', '#ffc46a', open));
      G.glow(g, S2.x + S2.w / 2, S2.y + S2.h / 2, 18, 13, '#ffbe6a', 1.1 * open);
    }
    return S2;
  };

  // ============================================================
  // THE MASCOT
  // ============================================================
  G.drawMooBot = function (g, cx, footY, scale, o) {
    o = o || {};
    const S = scale || 1;
    const u = (v) => Math.max(1, Math.round(v * S));
    const t = o.t || 0;
    cx = Math.round(cx); footY = Math.round(footY);

    // the performance layer the rest of the cast uses, so this animates
    // off the same clips as everybody else
    const A = o.pose || (o.clip ? G.pose(o.clip, o.ct === undefined ? t : o.ct,
      { speed: o.speed, dir: o.dir, seed: cx * 0.011, p: o.p, emph: o.emph }) : null);
    const bob = A ? Math.round(A.bob + A.breathe * 0.4) : 0;
    const lean = A ? Math.round(A.lean * u(2.5) + A.sway * 0.5) : 0;
    const sq = G.clamp(o.sq || 0, -0.3, 0.3);
    const mood = o.mood || 'idle';
    const dir = o.dir || 0;
    const blink = !o.noBlink && Math.sin(t * 1.1 + cx * 0.3) > 0.9975;

    // ---- the budget. 12 + 16 + 24 = 52, which is G.SZ.MASCOT, which is
    // an adult head to heel. The cap and the horns ride above that, the
    // way a hat does. ----
    const legH = Math.max(3, Math.round(u(12) * (1 + sq * 0.8)));
    const bodyH = Math.max(4, Math.round(u(16) * (1 + sq * 0.5)));
    const bodyW = Math.max(6, Math.round(u(21) * (1 - sq * 0.45)));
    const headH = Math.max(6, Math.round(u(24) * (1 + sq * 0.3)));
    const headW = Math.max(8, Math.round(u(30) * (1 - sq * 0.3)));

    const crawl = !!o.crawl;
    const bodyY = crawl ? footY - Math.round(bodyH * 0.7) : footY - legH - bodyH + bob;
    const headY = bodyY - headH + Math.max(1, u(2));
    const hx = cx + lean + (A ? Math.round(A.headTurn * u(2)) : 0);
    const hy = headY + (A ? Math.round(A.headTilt * u(1)) : 0);

    // ---- the ground shadow ----
    g.globalAlpha = 0.3;
    G.rr(g, cx - bodyW * 0.62, footY - 2, bodyW * 1.24, 4, '#000000');
    g.globalAlpha = 1;

    // ============================================================
    // LEGS AND FEET. Short dark stubs set apart, with a boot on each.
    // ============================================================
    const swing = Math.sin((o.walk || 0) * 9) * u(2.2);
    if (!crawl) {
      const lw = Math.max(2, Math.round(u(6.5)));
      const spread = Math.round(bodyW * 0.26);
      // THE LEG HANGS OFF THE HIP, IT DOES NOT FLOAT UNDER IT. Moving
      // the whole leg by the swing offset while the body moved by its
      // own bob left a stripe of daylight between the apron hem and the
      // top of the leg on every other frame of the walk. The top is
      // pinned into the body and the BOOT rides the cycle; the shank is
      // whatever is left between them. And a foot only ever lifts --
      // let it go negative and the down-phase foot sinks into the floor.
      const hip = bodyY + bodyH - Math.max(1, u(2));
      for (const sd of [-1, 1]) {
        const off = Math.min(0, sd < 0 ? swing : -swing);
        const lx = cx + lean + sd * spread;
        const fh = Math.max(2, u(4.5));
        const ft = footY - fh + off;
        box(g, lx - lw / 2, hip, lw, Math.max(2, ft - hip + 1), Math.max(1, u(1.5)), C.inkL,
          { lit: C.inkL, dk: C.ink });
        // the boot: wider than the leg, with a lit toe cap
        const fw = lw + Math.max(1, u(3));
        box(g, lx - fw / 2, ft, fw, fh, Math.max(1, u(1.5)), C.ink,
          { lit: C.inkL, dk: C.inkD });
        G.Rq(g, lx - fw / 2 + u(1), ft + 0.5, Math.max(1, u(2)), 0.75, '#6b6878');
      }
    }

    // ============================================================
    // THE BODY. A cream barrel with the crew apron over it.
    // ============================================================
    const bx = cx + lean - bodyW / 2;
    box(g, bx, bodyY, bodyW, bodyH, Math.max(2, u(3)), C.cream,
      { lit: C.creamL, dk: C.creamD });

    if (o.apron !== false) {
      // the apron: a bib and skirt in one, narrower at the top, with the
      // cream straps of the body showing either side of it
      const aw = Math.round(bodyW * 0.64), ah = Math.round(bodyH * 0.78);
      const ay = bodyY + Math.round(bodyH * 0.22);
      const aRows = rows(aw, ah, Math.max(1, u(2)));
      for (let j = 0; j < ah + 2; j++) {
        const k = G.clamp(j - 1, 0, ah - 1);
        const wide = Math.round(aw * (j < ah * 0.3 ? 1 : 1.18));
        const ins = aRows[k] + Math.round((wide - aw) / -2);
        G.R(g, cx + lean - wide / 2 + ins - 1, ay - 1 + j, wide - ins * 2 + 2, 1, OUT);
      }
      for (let j = 0; j < ah; j++) {
        const wide = Math.round(aw * (j < ah * 0.3 ? 1 : 1.18));
        const ins = aRows[j] + Math.round((wide - aw) / -2);
        const p = j / Math.max(1, ah - 1);
        G.R(g, cx + lean - wide / 2 + ins, ay + j, wide - ins * 2, 1,
          j < 1 ? C.redL : p > 0.92 ? C.redK : p > 0.8 ? C.redD : C.red);
      }
      // two cream straps up over the shoulders
      for (const sd of [-1, 1]) {
        const sx = cx + lean + sd * Math.round(aw * 0.36);
        const n = Math.max(2, Math.round(bodyH * 0.24));
        for (let k = 0; k <= n; k++) {
          const q = k / n, w2 = Math.max(1, u(2.2));
          G.R(g, Math.round(sx + sd * q * u(2) - w2 / 2) - 1, ay - k - 1, w2 + 2, 1, OUT);
        }
        for (let k = 0; k <= n; k++) {
          const q = k / n, w2 = Math.max(1, u(2.2));
          G.R(g, Math.round(sx + sd * q * u(2) - w2 / 2), ay - k, w2, 1, C.cream);
          G.Rq(g, Math.round(sx + sd * q * u(2) - w2 / 2), ay - k, 0.75, 1, C.creamL);
        }
      }
      // and the badge on it. A RED roundel on a red apron is a dark ring
      // with nothing in it; the sheet has it the other way round, and so
      // does every crew apron ever printed -- a cream disc with the head
      // on it in the house red.
      // And the head only goes on the badge where there is a badge big
      // enough to take one. At five units of radius the whole model --
      // skull, cap, visor, two cans -- comes to about nine pixels, and
      // nine pixels of cow is a white cross on a red apron.
      const br = Math.max(2, Math.round(aw * 0.22));
      const bcy = ay + Math.round(ah * 0.34);
      G.fc(g, cx + lean, bcy, br + 1, OUT);
      G.fc(g, cx + lean, bcy, br, C.cream);
      if (br >= 8) G.mooLogo(g, cx + lean, bcy, Math.round(br * 0.94),
        { flat: true, word: false, tone: C.red });
      else if (br >= 4) { G.fc(g, cx + lean, bcy, br * 0.72, C.red);
                          G.fc(g, cx + lean, bcy, br * 0.34, C.cream); }
      else G.fc(g, cx + lean, bcy, Math.max(1, br * 0.6), C.red);
    }

    // ============================================================
    // ARMS, AND ACTUAL HANDS.
    //
    // They were stubs: two dark rounded bars hung at the sides, and
    // wherever a scene asked for a reach, a line with a dark blob on the
    // end of it. A mascot whose whole job is handing people food should
    // be seen to have something to hand it with.
    //
    // An arm is now a bar to the elbow and a bar from it, and it ends in
    // a HAND: a cream glove, because four dark fingers on a dark sleeve
    // is a smudge at any size this game draws, and a pale mitt against
    // this palette is unmistakable at six pixels. A thumb on the inboard
    // side says which hand it is; two grooves on the outboard edge let
    // you count three fingers if you go looking.
    // ============================================================
    const aw2 = Math.max(2, u(4.5));
    const armY = bodyY + Math.round(bodyH * 0.22);
    // NOT through u(): it floors at one logical unit, so at the scales
    // the HUD and the shop rows draw him at, the hands came out wider
    // than his legs. A hand is allowed to be smaller than a pixel and
    // fall back to a pip.
    const hnd = 3.5 * S;
    const hands = [null, null];

    // a thick segment, drawn as a run of squares. Outline pass first for
    // the whole limb, then the fill, or each square's black lands on the
    // one before it.
    function seg(x0, y0, x1, y1, th, col) {
      const d = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0)));
      for (let k = 0; k <= d; k++) {
        const q = k / d;
        G.R(g, G.lerp(x0, x1, q) - th / 2, G.lerp(y0, y1, q) - th / 2, th, th, col);
      }
    }

    // ---- shoulder, elbow, hand ----
    function limb(sd, hxp, hyp, grip) {
      const sx = cx + lean + sd * (bodyW / 2 - u(1.2));
      const sy = armY;
      // the elbow sits outboard of the straight line, so an arm bends the
      // way an arm bends instead of reading as a pipe
      const exx = (sx + hxp) / 2 + sd * u(1.8);
      const eyy = (sy + hyp) / 2 + u(0.6);
      for (let pass = 0; pass < 2; pass++) {
        const th = pass ? aw2 : aw2 + 1.5;
        const col = pass ? C.inkL : OUT;
        seg(sx, sy, exx, eyy, th, col);
        seg(exx, eyy, hxp, hyp, th * (pass ? 0.88 : 1), col);
      }
      // a lit edge down the top of the upper arm
      G.Rq(g, Math.min(sx, exx), Math.min(sy, eyy) - aw2 / 2, Math.abs(exx - sx) + 1, 0.5, '#5c5a66');
      G.mooHand(g, hxp, hyp, hnd, sd, grip);
      return { x: Math.round(hxp), y: Math.round(hyp) };
    }

    const grips = o.grip === undefined ? [0, 0]
      : (Array.isArray(o.grip) ? o.grip : [o.grip, o.grip]);
    if (o.hands) {
      for (let i = 0; i < 2; i++) {
        const sd = i ? 1 : -1, H = o.hands[i];
        if (!H) continue;
        hands[i] = limb(sd, H.x, H.y, H.grip === undefined ? grips[i] : H.grip);
      }
    } else {
      // hanging, with the swing the clip asked for
      for (let i = 0; i < 2; i++) {
        const sd = i ? 1 : -1;
        const sw = A ? (i ? A.armR : A.armL) * u(3.4) : 0;
        const hxp = cx + lean + sd * (bodyW / 2 + u(1.2)) + sw * 0.45;
        const hyp = armY + Math.round(bodyH * 0.66) + Math.abs(sw) * 0.3;
        hands[i] = limb(sd, hxp, hyp, grips[i]);
      }
    }

    // ============================================================
    // THE HEAD. Broad, nearly square, corners knocked off.
    // ============================================================
    const hX = hx - headW / 2;
    const hr = Math.max(2, Math.round(headW * 0.26));

    // ---- ear cans go down first, so the head tucks over the mount ----
    const canW = Math.max(3, Math.round(headW * 0.19));
    const canH = Math.max(4, Math.round(headH * 0.36));
    const canY = hy + Math.round(headH * 0.32);
    for (const sd of [-1, 1]) {
      const ccx = hx + sd * Math.round(headW * 0.56);
      box(g, ccx - canW / 2, canY, canW, canH, Math.max(2, Math.round(canW * 0.44)), C.ink,
        { lit: C.inkL, dk: C.inkD });
      // the roundel on the cup. NOTHING ROUND SURVIVES DOWN HERE: a disc
      // of two or three units, rasterised row by row, is a diamond, and
      // a lighter pip in the middle of one turns it into a first-aid
      // cross -- which is what the mascot had stamped on both ears at
      // every size the game actually draws him. So it is a RING where
      // there is room for a ring, and a SQUARE where there is not.
      const rr = Math.min(canW, canH) * 0.40;
      const cy2 = canY + Math.round(canH * 0.46);
      if (rr >= 5) {
        G.fc(g, ccx, cy2, rr + 0.5, OUT);
        G.fc(g, ccx, cy2, rr, C.red);
        G.oc(g, ccx, cy2, rr * 0.55, C.cream);
      } else {
        const q = Math.max(1, Math.round(rr * 1.5));
        G.R(g, ccx - q / 2 - 1, cy2 - q / 2 - 1, q + 2, q + 2, OUT);
        G.R(g, ccx - q / 2, cy2 - q / 2, q, q, C.red);
        if (q >= 3) {
          const c2 = Math.max(1, Math.round(q * 0.4));
          G.R(g, ccx - c2 / 2, cy2 - c2 / 2, c2, c2, C.cream);
        }
      }
    }

    // ---- the head box ----
    const hRows = box(g, hX, hy, headW, headH, hr, C.cream,
      { lit: C.creamL, dk: C.creamD });
    // a turn down the far side, so it is a solid and not a card
    for (let j = 2; j < headH - 2; j++)
      G.Rq(g, hX + headW - hRows[j] - 1, hy + j, 1, 1, C.creamD);

    // ---- the hide patches, clipped to the head ----
    for (const P of PATCH) {
      const pcx = hx + P[0] * headW, pcy = hy + headH / 2 + P[1] * headH;
      const prx = P[2] * headW, pry = P[3] * headH;
      if (prx < 1.2 || pry < 1.2) continue;
      for (let j = 0; j < headH; j++) {
        const dy = (hy + j - pcy) / pry;
        if (Math.abs(dy) > 1) continue;
        const wob = 1 + Math.sin(j * 0.9 + P[4]) * 0.18 + Math.sin(j * 2.3 + P[4] * 3) * 0.1;
        const half = Math.round(prx * Math.sqrt(1 - dy * dy) * wob);
        if (half < 1) continue;
        const x0 = Math.max(hX + hRows[j], Math.round(pcx - half));
        const x1 = Math.min(hX + headW - hRows[j], Math.round(pcx + half));
        if (x1 > x0) G.R(g, x0, hy + j, x1 - x0, 1,
          j < (pcy - hy) - pry * 0.5 ? C.inkL : C.ink);
      }
    }

    // ============================================================
    // THE VISOR. One dark plate, two amber slits. The whole face.
    // ============================================================
    const vw = Math.max(5, Math.round(headW * 0.60));
    const vh = Math.max(4, Math.round(headH * 0.27));
    const vy = hy + Math.round(headH * 0.29);
    box(g, hx - vw / 2, vy, vw, vh, Math.max(1, u(2)), '#171420',
      { lit: '#3e3a4e', dk: '#0b0912' });
    G.Rq(g, hx - vw / 2 + vw * 0.1, vy + vh * 0.72, vw * 0.3, 0.25, '#4a4560');
    G.Rq(g, hx + vw * 0.18, vy + vh * 0.2, vw * 0.16, 0.25, '#6b6480');
    if (!o.dead) {
      const sw3 = Math.max(1, Math.round(vw * 0.11));
      const sh3 = blink ? Math.max(0.75, u(0.75)) : Math.max(1.5, Math.round(vh * 0.46));
      const sy = vy + Math.round(vh * 0.28) + (blink ? Math.round(vh * 0.22) : 0);
      const look = Math.round(Math.sin(t * 0.55) * u(1)) + Math.round(dir * u(1.5));
      for (const sd of [-1, 1]) {
        // angry drops the inner end, hurt lifts it. One row of pixels is
        // the entire range this face has, and that is the point of it.
        const tilt = mood === 'angry' ? Math.max(1, u(1)) : mood === 'sick' ? -Math.max(1, u(1)) : 0;
        const sx = hx + sd * Math.round(vw * 0.24) - sw3 / 2 + look;
        const yy = sy + (sd < 0 ? tilt : tilt) * 0;
        for (let j = 0; j < sh3; j++)
          G.Rh(g, sx + (tilt ? (j / sh3) * tilt * sd * 0.6 : 0), yy + j, sw3, 1,
            j < 1 ? C.goldL : C.gold);
        if (!blink) G.glow(g, sx + sw3 / 2, yy + sh3 / 2, u(8), u(6), C.gold, 0.45);
      }
    }

    // ============================================================
    // THE MUZZLE. A round pink pad and two nostrils. No mouth.
    // ============================================================
    const mw = Math.max(3, Math.round(headW * 0.30));
    const mh = Math.max(3, Math.round(headH * 0.22));
    const my = hy + Math.round(headH * 0.70);
    blob(g, hx, my, mw / 2, mh / 2, C.pink, { lit: C.pinkL, dk: C.pinkD });
    if (mw >= 7) {
      const br2 = Math.sin(t * 1.5) > 0 ? 0.5 : 0;
      for (const sd of [-1, 1])
        G.Rh(g, hx + sd * Math.round(mw * 0.19) - 0.75, my - mh * 0.06, 1.5, 1.5 + br2, C.pinkD);
    }

    // ============================================================
    // HORNS, then the CAP over their roots.
    // ============================================================
    const capW = Math.max(5, Math.round(headW * 0.58));
    const capH = Math.max(4, Math.round(headH * 0.30));
    const capY = hy - Math.round(capH * 0.55);
    for (const sd of [-1, 1]) {
      const N = Math.max(3, Math.round(u(5)));
      const bxh = hx + sd * Math.round(capW * 0.44);
      const byh = capY + Math.round(capH * 0.62);
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const q = i / N;
        pts.push([bxh + sd * (q * headW * 0.10 + Math.sin(q * 2.2) * headW * 0.035),
                  byh - q * headH * 0.155 - Math.sin(q * 1.6) * headH * 0.03,
                  Math.max(0.75, headH * 0.058 * (1 - q * 0.42))]);
      }
      for (const q of pts) G.R(g, q[0] - q[2] - 1, q[1] - q[2] - 1, q[2] * 2 + 2, q[2] * 2 + 2, OUT);
      for (let i = 0; i <= N; i++) {
        const q = pts[i], p = i / N;
        G.R(g, q[0] - q[2], q[1] - q[2], q[2] * 2, q[2] * 2,
          p < 0.25 ? C.tanD : p > 0.7 ? C.tanL : C.tan);
        G.Rq(g, q[0] - q[2] * 0.6, q[1] - q[2] * 0.9, Math.max(0.5, q[2] * 0.6), 0.75, '#fff0cc');
      }
    }
    // the crown
    // a DOME. Squat and square-cornered it is a red bar laid across the
    // top of the head, which is what a cap is not.
    const crRows = rows(capW, capH * 2, Math.max(2, Math.round(capW * 0.42)));
    for (let j = 0; j < capH + 2; j++) {
      const k = G.clamp(j - 1, 0, capH - 1);
      G.R(g, hx - capW / 2 + crRows[k] - 1, capY - 1 + j, capW - crRows[k] * 2 + 2, 1, OUT);
    }
    for (let j = 0; j < capH; j++) {
      const p = j / Math.max(1, capH - 1);
      G.R(g, hx - capW / 2 + crRows[j], capY + j, capW - crRows[j] * 2, 1,
        j < 1 ? C.redL : p > 0.86 ? C.redD : C.red);
    }
    // the peak, wider, coming toward you
    const pw = Math.max(6, Math.round(headW * 0.66));
    const ph = Math.max(2, Math.round(capH * 0.28));
    const py = capY + capH - 1;
    const pRows = rows(pw, ph * 2, Math.max(1, u(2)));
    for (let j = 0; j < ph + 2; j++) {
      const k = G.clamp(j - 1, 0, ph - 1);
      G.R(g, hx - pw / 2 + pRows[k] - 1, py - 1 + j, pw - pRows[k] * 2 + 2, 1, OUT);
    }
    for (let j = 0; j < ph; j++)
      G.R(g, hx - pw / 2 + pRows[j], py + j, pw - pRows[j] * 2, 1,
        j < 1 ? C.red : j > ph - 2 ? C.redK : C.redD);
    // the button, and the letter
    G.fc(g, hx, capY + 1, Math.max(0.75, u(1)), C.redD);
    if (capW >= 14) {
      const sc = capW >= 22 ? 1 : 0.5;
      G.text(g, 'M', hx, capY + Math.round(capH * 0.30), C.cream, { align: 'center', sc });
    }

    // what got shaken over it stays on it
    if (o.shellBits) for (const s of o.shellBits) G.R(g, s.x, s.y, 2, 2, s.col);
    if (o.shellCoat) for (const s of o.shellCoat) G.R(g, s.x, s.y, 2, 2, s.col);

    let tellRect = null;
    if (o.tell) tellRect = G.drawTell(g, {
      cx, footY, headTop: hy, mouthY: my, torsoY: bodyY,
      hw: Math.round(headW / 2),
    }, o.tell, t, u);

    return {
      cx, footY, tellRect, hands,
      handR: hnd,
      headTop: hy, headY: hy + headH / 2, mouthY: my, gape: 0,
      hw: Math.round(headW / 2), top: capY - Math.round(headH * 0.2),
      torsoY: bodyY, torsoW: bodyW, torsoH: bodyH, hue: C.gold,
      y: hy,
    };
  };
})();

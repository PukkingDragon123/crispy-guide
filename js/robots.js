// ============================================================
// DOUBLE LIFE v4 - robots.js  ·  THE CAST AND THE CITY
// Every customer is a machine. Boxy plated chassis, glowing lens
// optics, antennae, vents, cable bundles and a hinged intake jaw
// that drops wide open. Same chunky boxel language as art3.js,
// repainted for a neon-and-chrome city.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  // ------------------------------------------------------------
  // THE OPTIC. A lens, not an eyeball: hard rim, dark bezel, a
  // saturated iris ring around a bright hot core, one square
  // catch-light, and a scanning band that sweeps across it.
  // Legible from 6px to 26px.
  // ------------------------------------------------------------
  const ballRows = G.ballRows || function (w, h) {
    const rows = [], rx = w / 2, ry = h / 2;
    for (let j = 0; j < h; j++) {
      const dy = (j + 0.5 - ry) / ry;
      rows.push(Math.max(1, Math.round(rx * Math.sqrt(Math.max(0, 1 - dy * dy)))));
    }
    return rows;
  };

  G.optic = function (g, x, y, w, h, o) {
    o = o || {};
    x = Math.round(x); y = Math.round(y);
    w = Math.max(6, Math.round(w)); h = Math.max(6, Math.round(h));
    const cx = x + w / 2, cy = y + h / 2;
    const hue = o.hue || P.cyan;
    const hueDk = G.shade(hue, -0.5), hueLt = G.shade(hue, 0.55);

    if (o.dead) {                                  // powered down
      const rws = ballRows(w, h);
      for (let j = 0; j < h; j++) G.R(g, Math.round(cx - rws[j]) - 1, y + j, rws[j] * 2 + 2, 1, OUT);
      for (let j = 1; j < h - 1; j++) G.R(g, Math.round(cx - rws[j]), y + j, rws[j] * 2, 1, P.plateDk);
      G.R(g, x + 2, Math.round(cy) - 1, w - 4, 2, P.plateDk2);
      if (o.brow !== undefined) visorBrow(g, x, y, w, h, o.brow, o.browMinY);
      return;
    }
    if (o.closed) {                                // shutter down
      const rws = ballRows(w, h);
      const lid = Math.max(2, Math.round(h * 0.7));
      for (let j = 0; j < h; j++) G.R(g, Math.round(cx - rws[j]) - 1, y + j, rws[j] * 2 + 2, 1, OUT);
      for (let j = lid; j < h - 1; j++)
        G.R(g, Math.round(cx - rws[j]), y + j, rws[j] * 2, 1, j === lid ? OUT : hueDk);
      for (let j = 0; j < lid; j++)
        G.R(g, Math.round(cx - rws[j]), y + j, rws[j] * 2, 1, j < 2 ? P.plateDk : P.plate);
      G.R(g, Math.round(cx - rws[2]), y + 2, rws[2] * 2, 1, P.plateLt);
      if (o.brow !== undefined) visorBrow(g, x, y, w, h, o.brow, o.browMinY);
      return;
    }

    const rows = ballRows(w, h);
    // rim
    for (let j = 0; j < h; j++) G.R(g, Math.round(cx - rows[j]) - 1, y + j, rows[j] * 2 + 2, 1, OUT);
    G.R(g, Math.round(cx - rows[0]), y - 1, rows[0] * 2, 1, OUT);
    G.R(g, Math.round(cx - rows[h - 1]), y + h, rows[h - 1] * 2, 1, OUT);
    // bezel: bare metal ring the lens is seated in
    for (let j = 0; j < h; j++) {
      const c = j < 2 ? P.hullLt : j >= h - 2 ? P.hullDk : P.hull;
      G.R(g, Math.round(cx - rows[j]), y + j, rows[j] * 2, 1, c);
    }
    // glass: dark well
    const gw = Math.max(4, w - 2), gh = Math.max(4, h - 2);
    const grows = ballRows(gw, gh);
    const gy = y + Math.round((h - gh) / 2);
    for (let j = 0; j < gh; j++) G.R(g, Math.round(cx - grows[j]), gy + j, grows[j] * 2, 1, P.plateDk2);
    // iris ring
    const ir = Math.max(3, Math.round(Math.min(w, h) * 0.74));
    const ix = cx + (o.lookX || 0) * (w / 2 - ir / 2 - 1);
    const iy = cy + (o.lookY || 0) * (h / 2 - ir / 2 - 1);
    const irows = ballRows(ir, ir);
    const ir0 = Math.round(iy - ir / 2);
    for (let j = 0; j < ir; j++) {
      const c = j < ir * 0.3 ? hueDk : j > ir * 0.74 ? hueLt : hue;
      G.R(g, Math.round(ix - irows[j]), ir0 + j, irows[j] * 2, 1, c);
    }
    // hot core
    const pw = Math.max(2, Math.round(ir * (o.slit ? 0.3 : 0.44)));
    const ph = o.slit ? Math.max(3, ir - 1) : pw;
    const prows = o.slit ? null : ballRows(pw, ph);
    for (let j = 0; j < ph; j++) {
      const hw = prows ? prows[j] : pw / 2;
      G.R(g, Math.round(ix - hw), Math.round(iy - ph / 2) + j, Math.max(1, Math.round(hw * 2)), 1, '#ffffff');
    }
    // scan band sweeping down the glass
    if (gh > 7) {
      const sy = gy + 1 + Math.floor(((o.t || 0) * 9 + x * 0.7) % (gh - 2));
      const k = G.clamp(sy - gy, 0, gh - 1);
      G.R(g, Math.round(cx - grows[k]), sy, grows[k] * 2, 1, G.shade(hue, 0.7));
    }
    // catch-light
    const gl = Math.max(1, Math.round(Math.min(w, h) * 0.18));
    G.R(g, Math.round(cx - rows[Math.max(1, Math.round(h * 0.24))] * 0.66), Math.round(y + h * 0.2), gl, gl, '#ffffff');
    if (o.brow !== undefined) visorBrow(g, x, y, w, h, o.brow, o.browMinY);
  };

  // an angled armour shade over the lens: the robot equivalent of a brow
  function visorBrow(g, x, y, w, h, b, minY) {
    const th = Math.max(2, Math.round(h * 0.22));
    for (let i = -2; i < w + 2; i++) {
      const pr = i / (w + 3) - 0.5;
      let yy = y - th - 1 + Math.round(pr * b * h * 0.5);
      if (minY !== undefined && yy < minY) yy = minY;
      G.R(g, x + i, yy, 1, th, OUT);
      G.R(g, x + i, yy, 1, 1, P.plateLt);
      G.R(g, x + i, yy + 1, 1, Math.max(1, th - 1), P.plate);
    }
  }

  // ------------------------------------------------------------
  // MODELS. Each robot is a chassis colour ramp, an accent neon,
  // a build (so the cast rigs to genuinely different sizes) and a
  // head silhouette variant.
  // ------------------------------------------------------------
  const MODELS = {
    dozer:    { c: '#c9552f', l: '#ef8455', d: '#8a2f16', d2: '#5c1c0c', hue: '#ffb01f', head: 'brick' },
    sable:    { c: '#2f3350', l: '#4c5480', d: '#1c1f33', d2: '#101220', hue: '#ff2f8e', head: 'visor' },
    chrome:   { c: '#9aa6c0', l: '#d2dcee', d: '#66708a', d2: '#414a5e', hue: '#22e0ff', head: 'dome' },
    minty:    { c: '#2fb894', l: '#5fe0ba', d: '#1a7a60', d2: '#0f5040', hue: '#b6ff3a', head: 'brick' },
    rustbolt: { c: '#8a5230', l: '#b87a44', d: '#5c3620', d2: '#3a2214', hue: '#ffb01f', head: 'bucket' },
    violetta: { c: '#6a3fb8', l: '#9a72e0', d: '#472680', d2: '#2c1554', hue: '#c49bff', head: 'visor' },
    pixel:    { c: '#e0c02f', l: '#ffe268', d: '#a08414', d2: '#6b570a', hue: '#22e0ff', head: 'crt' },
    medibot:  { c: '#e4e8f0', l: '#ffffff', d: '#a8b0c0', d2: '#767e8e', hue: '#ff2f8e', head: 'dome' },
    tank:     { c: '#3f5a3a', l: '#5f8055', d: '#283a24', d2: '#182415', hue: '#b6ff3a', head: 'bucket' },
    neonkid:  { c: '#2a3f6b', l: '#456099', d: '#1a2844', d2: '#0f1828', hue: '#ff7ab8', head: 'crt' },
    cargo:    { c: '#b8862f', l: '#e0b055', d: '#7d5a18', d2: '#52390c', hue: '#ffb01f', head: 'brick' },
    spindle:  { c: '#4a4f66', l: '#6f7694', d: '#32364a', d2: '#1e202e', hue: '#3affd0', head: 'antenna' },
  };
  G.modelOf = (id) => MODELS[id] || MODELS.chrome;

  const BUILD = {
    dozer:    { w: 1.26, h: 0.9,  jaw: 1.3,  eye: 0.9,  ant: 'stub' },
    sable:    { w: 0.94, h: 1.0,  jaw: 0.95, eye: 1.1,  ant: 'fin' },
    chrome:   { w: 1.02, h: 0.96, jaw: 1.05, eye: 1.15, ant: 'rod' },
    minty:    { w: 1.1,  h: 0.92, jaw: 1.15, eye: 1.0,  ant: 'dish' },
    rustbolt: { w: 1.18, h: 0.86, jaw: 1.2,  eye: 0.85, ant: 'stub' },
    violetta: { w: 0.9,  h: 1.04, jaw: 0.9,  eye: 1.25, ant: 'fin' },
    pixel:    { w: 0.98, h: 0.98, jaw: 1.0,  eye: 1.3,  ant: 'rod' },
    medibot:  { w: 1.06, h: 0.94, jaw: 1.0,  eye: 1.1,  ant: 'dish' },
    tank:     { w: 1.3,  h: 0.84, jaw: 1.35, eye: 0.8,  ant: 'stub' },
    neonkid:  { w: 0.88, h: 1.02, jaw: 0.9,  eye: 1.35, ant: 'rod' },
    cargo:    { w: 1.22, h: 0.88, jaw: 1.25, eye: 0.9,  ant: 'dish' },
    spindle:  { w: 0.84, h: 1.08, jaw: 0.85, eye: 1.2,  ant: 'antenna' },
  };
  G.robotBuildOf = (id) => BUILD[id] || BUILD.chrome;

  // ------------------------------------------------------------
  // ANTENNAE / HEAD FURNITURE
  // ------------------------------------------------------------
  function antenna(g, kind, cx, top, w, m, t) {
    const u = Math.max(1, Math.round(w / 30));
    if (kind === 'rod') {
      const sway = Math.round(Math.sin(t * 2.2) * u);
      G.R(g, cx - 1, top - u * 9, 2 + 1, u * 9, OUT);
      G.R(g, cx - 1, top - u * 9, 2, u * 9, P.hull);
      G.R(g, cx - 2 + sway, top - u * 12, 5, 4, OUT);
      G.R(g, cx - 1 + sway, top - u * 11, 3, 2, m.hue);
      G.glow(g, cx + sway, top - u * 11, 5, 5, m.hue, 0.8);
    } else if (kind === 'fin') {
      for (let i = 0; i < 4; i++)
        G.box(g, cx - u * 8 + i * u * 5, top - u * 4 - i, u * 3, u * 5 + i, m.d,
          { lit: m.l, dk: m.d2, r: 1, band: 1, spec: false });
      G.R(g, cx - u * 8, top - u * 4, u * 18, 1, m.hue);
    } else if (kind === 'dish') {
      G.rr(g, cx - u * 7, top - u * 7, u * 14, u * 5, OUT);
      G.rr(g, cx - u * 6, top - u * 6, u * 12, u * 4, P.hullDk);
      G.R(g, cx - u * 4, top - u * 5, u * 8, 1, P.hullLt);
      G.R(g, cx - 1, top - u * 9, 2, u * 4, OUT);
      G.R(g, cx - 1, top - u * 9, 1, u * 4, P.hull);
    } else if (kind === 'antenna') {
      for (const s of [-1, 1]) {
        G.R(g, cx + s * u * 5 - 1, top - u * 10, 2, u * 10, OUT);
        G.R(g, cx + s * u * 5 - 1, top - u * 10, 1, u * 10, P.hull);
        G.R(g, cx + s * u * 5 - 2, top - u * 12, 4, 3, m.hue);
      }
    } else {                                        // stub: a warning lamp
      const blink = Math.sin(t * 4) > 0;
      G.box(g, cx - u * 3, top - u * 4, u * 6, u * 4, P.plateDk, { r: 1, band: 1, spec: false });
      G.R(g, cx - u * 2, top - u * 3, u * 4, u * 2, blink ? P.hazard : G.shade(P.hazard, -0.6));
      if (blink) G.glow(g, cx, top - u * 2, 7, 6, P.hazard, 0.8);
    }
  }

  // ------------------------------------------------------------
  // THE BUST. The close two-shot subject: a big plated head with
  // two optics and an intake hatch that really drops open.
  // o: {t, open:0..1, mood, hat, sprinkled}
  // ------------------------------------------------------------
  G.robotBust = function (g, id, cx, cy, scale, o) {
    o = o || {};
    const S = scale || 1;
    const u = (v) => Math.round(v * S);
    const m = G.modelOf(id), bd = G.robotBuildOf(id);
    const t = o.t || 0;
    const open = G.clamp(o.open === undefined ? 0 : o.open, 0, 1);
    const mood = o.mood || 'idle';
    const bob = Math.sin(t * 1.8) * u(1);
    cx = Math.round(cx); cy = Math.round(cy + bob);

    const HW = u(26 * bd.w), HH = u(27 * bd.h);
    const top = cy - HH;
    const headH = HH * 2 - u(4);

    // ---- torso / shoulder plating behind ----
    const shY = cy + HH - u(4);
    const shW = Math.round(HW * 2.6), shH = Math.max(12, u(32));
    const shX = Math.round(cx - shW / 2);
    G.box(g, shX, shY, shW, shH, m.d, { lit: m.l, dk: m.d2, r: 2, band: Math.max(2, u(5)) });
    // shoulder pauldrons, sitting below the jaw line so they read as shoulders
    for (const s of [-1, 1]) {
      const pw2 = Math.round(HW * 0.62);
      const px = s < 0 ? shX - Math.round(pw2 * 0.55) : shX + shW - Math.round(pw2 * 0.45);
      G.box(g, px, shY + u(6), pw2, Math.round(shH * 0.7), m.c,
        { lit: m.l, dk: m.d2, r: 2, band: Math.max(1, u(3)) });
      G.R(g, px + 2, shY + u(9), pw2 - 4, 1, m.hue);
    }
    // chest vent + a live status bar
    const vw = Math.round(HW * 0.9);
    G.box(g, cx - vw / 2, shY + u(6), vw, u(11), P.plateDk2, { r: 1, band: 1, spec: false });
    for (let i = 0; i < 4; i++) G.R(g, cx - vw / 2 + 2, shY + u(7) + i * Math.max(2, u(3)), vw - 4, 1, P.plateDk);
    const bar = Math.round((vw - 6) * (0.45 + Math.sin(t * 3) * 0.3));
    G.R(g, cx - vw / 2 + 3, shY + u(8), Math.max(1, bar), Math.max(1, u(2)), m.hue);
    // cable bundle out of the neck
    for (let i = -1; i < 2; i++) {
      const bx = cx + i * u(6);
      for (let k = 0; k < u(9); k++)
        G.R(g, bx + Math.round(Math.sin(k * 0.6 + i) * 1.5), shY - u(4) + k, 2, 1,
          i === 0 ? P.magentaDk : i < 0 ? P.cyanDk : P.violet);
    }

    // ---- head slab ----
    G.rr2(g, cx - HW - 2, top - 2, HW * 2 + 4, headH + 4, OUT);
    G.rr2(g, cx - HW - 1, top - 1, HW * 2 + 2, headH + 2, G.shade(m.l, 0.4));
    G.box(g, cx - HW, top, HW * 2, headH, m.c, { lit: m.l, dk: m.d, r: 3, band: Math.max(2, u(5)) });
    // panel seams + rivets: flat detail, no noise
    G.R(g, cx - HW + u(3), top + u(3), HW * 2 - u(6), 1, m.d);
    G.R(g, cx - HW + u(3), top + headH - u(4), HW * 2 - u(6), 1, m.d);
    for (const s of [-1, 1]) {
      G.R(g, cx + s * (HW - u(4)), top + u(5), 2, 2, P.hullDk);
      G.R(g, cx + s * (HW - u(4)), top + headH - u(8), 2, 2, P.hullDk);
    }
    // model badge: a neon strip across the brow
    G.R(g, cx - HW + u(5), top + u(6), HW * 2 - u(10), Math.max(1, u(2)), m.hue);
    G.R(g, cx - HW + u(5), top + headH - u(3), HW * 2 - u(10), 1, G.shade(m.hue, -0.35));
    // head variant furniture
    if (m.head === 'crt') {                          // a screen face bezel
      G.box(g, cx - HW + u(3), top + u(9), HW * 2 - u(6), headH - u(20), P.plateDk2,
        { r: 2, band: 1, spec: false });
    } else if (m.head === 'dome') {                  // a lit crown band
      G.R(g, cx - HW + u(6), top + u(1), HW * 2 - u(12), Math.max(1, u(2)), m.hue);
    } else if (m.head === 'bucket') {                // riveted band round the jaw
      G.R(g, cx - HW, top + headH - u(11), HW * 2, Math.max(2, u(3)), m.d);
      for (let i = 0; i < 5; i++) G.R(g, cx - HW + u(5) + i * Math.round(HW * 0.42), top + headH - u(10), 2, 2, P.hull);
    } else if (m.head === 'visor') {                 // one dark visor slab behind both optics
      G.box(g, cx - HW + u(2), top + u(9), HW * 2 - u(4), Math.round(headH * 0.36), P.plateDk2,
        { r: 2, band: 1, spec: false });
    }

    // ---- optics ----
    const eW = Math.max(7, Math.round(HW * 0.6 * bd.eye));
    const eH = Math.max(7, Math.round(HW * 0.55 * bd.eye));
    const eSp = Math.round(HW * 0.47);
    const eyY = top + Math.max(u(5), Math.round(HH * 0.32));
    const blink = !o.noBlink && Math.sin(t * 1.1 + cx * 0.2) > 0.9975;
    for (const s of [-1, 1]) {
      const ex = cx + s * eSp - Math.round(eW / 2);
      G.rr2(g, cx + s * eSp - Math.round(eW / 2) - 3, eyY - 1, eW + 6, eH + 3, OUT);
      G.optic(g, ex, eyY, eW, eH, {
        t, hue: m.hue, dead: o.dead,
        closed: blink || mood === 'happy',
        slit: mood === 'angry',
        lookX: mood === 'angry' ? s * -0.3 : Math.sin(t * 0.6) * 0.3,
        lookY: mood === 'sick' ? 0.35 : open > 0.6 ? -0.15 : 0,
        brow: mood === 'angry' ? -s * 0.95
          : mood === 'sick' || mood === 'worried' ? s * 0.7 : undefined,
        browMinY: top + Math.max(1, u(2)),
      });
      if (!o.dead) G.glow(g, cx + s * eSp, eyY + eH / 2, eW, eH, m.hue, 0.7);
    }

    // ---- intake muzzle ----
    const mW = Math.round(HW * 1.5);
    const mTop = Math.round(Math.max(eyY + eH + u(2), top + HH * 1.08));
    const mH = u(13);
    G.box(g, cx - mW / 2, mTop, mW, mH, m.c, { lit: m.l, dk: m.d, r: 2, band: Math.max(1, u(3)) });
    // intake grille slots where a nose would be
    for (let i = -1; i < 2; i++)
      G.R(g, cx + i * u(7) - 1, mTop + Math.round(mH * 0.3), Math.max(2, u(3)), Math.max(2, u(4)), P.plateDk2);

    // ---- THE HATCH. Drops open on a hinge. ----
    const jawY = mTop + mH - u(1);
    const gape = Math.round(open * u(24) * bd.jaw);
    if (gape > 1) {
      const mw = Math.round(mW * 0.86);
      G.rr2(g, cx - mW / 2 - 1, jawY - 1, mW + 2, gape + u(11), OUT);
      // dark intake throat
      G.box(g, cx - mw / 2, jawY, mw, gape, P.oil, { lit: P.oilLt, dk: '#150e20', r: 2, band: Math.max(1, u(2)) });
      const thH = Math.max(1, Math.round(gape * 0.34));
      G.rr(g, cx - mw * 0.3, jawY + Math.round(gape * 0.3), mw * 0.6, thH, '#120c1c');
      // upper crusher plates, in place of teeth
      const nT = G.clamp(Math.round(mw / Math.max(6, u(9))), 3, 9);
      const step = Math.max(3, Math.round(mw / nT));
      for (let i = 0; i < nT; i++) {
        const tw = Math.max(2, step - 1);
        G.box(g, cx - mw / 2 + 1 + i * step, jawY + 1, tw, Math.max(3, u(5)), P.hull,
          { lit: P.hullLt, dk: P.hullDk, r: 1, band: 1, spec: false });
      }
      // conveyor tongue: a lit belt running back into the throat
      if (gape > Math.max(5, u(7))) {
        const tgH = Math.max(3, u(6));
        const tgY = jawY + gape - tgH;
        G.rr(g, cx - mw * 0.38 - 1, tgY - 1, mw * 0.76 + 2, tgH + 2, OUT);
        G.box(g, cx - mw * 0.36, tgY, mw * 0.72, tgH, P.plateDk,
          { lit: P.plate, dk: P.plateDk2, r: 2, band: 1, spec: false });
        const off = Math.floor((t * 14) % Math.max(2, u(5)));
        for (let i = 0; i < 6; i++) {
          const bx = cx - mw * 0.34 + off + i * Math.max(2, u(5));
          if (bx < cx + mw * 0.34) G.R(g, bx, tgY + 1, 1, tgH - 2, m.hue);
        }
      }
      // lower crusher plates on the hatch lip
      for (let i = 0; i < nT - 1; i++) {
        const tw = Math.max(2, step - 2);
        G.box(g, cx - mw / 2 + step * i + Math.max(2, u(3)), jawY + gape - Math.max(2, u(3)),
          tw, Math.max(2, u(3)), P.hull, { lit: P.hullLt, dk: P.hullDk, r: 1, band: 0, spec: false });
      }
      // the hatch itself
      G.box(g, cx - mW / 2, jawY + gape - u(1), mW, u(9), m.c,
        { lit: m.l, dk: m.d, r: 2, band: Math.max(1, u(2)) });
      G.R(g, cx - mW / 2 + u(3), jawY + gape + u(2), mW - u(6), 1, m.d);
    } else {
      // shut: a hard seam with a lit indicator
      G.R(g, cx - mW / 2 + u(2), jawY, mW - u(4), Math.max(2, u(2)), OUT);
      G.R(g, cx - u(4), jawY, u(8), 1, mood === 'angry' ? P.magenta : m.hue);
      G.box(g, cx - mW / 2, jawY + u(1), mW, u(8), m.c,
        { lit: m.l, dk: m.d, r: 2, band: Math.max(1, u(2)) });
    }

    // ---- hat / accessory ----
    if (o.hat && G.drawHatAcc) G.drawHatAcc(g, o.hat, { cx, top, w: HW * 2, h: headH }, { hc: m.hue, c1: m.c, c2: m.hue }, t);
    else antenna(g, bd.ant, cx, top, HW * 2, m, t);

    // ---- sprinkles, for the robots that want them on themselves ----
    if (o.sprinkled) {
      for (let i = 0; i < 16; i++) {
        const hx = cx - HW + Math.round(G.hash(i * 3.1, 7) * HW * 2);
        const hy = top + u(4) + Math.round(G.hash(i * 5.7, 11) * (headH - u(8)));
        G.R(g, hx, hy, 2, 2, G.MULTI_COLS.grit[i % G.MULTI_COLS.grit.length]);
      }
    }
    return { mouthX: cx, mouthY: jawY, jawY, headTop: top, hw: HW, hue: m.hue };
  };

  // ------------------------------------------------------------
  // THE PLAYER'S HAND. A servo claw: two chunky plated digits and
  // a lit knuckle, no forearm.
  // ------------------------------------------------------------
  G.servoMitt = function (g, x, y, o) {
    o = o || {};
    const col = o.col || P.hull, dk = P.hullDk, lit = P.hullLt;
    x = Math.round(x); y = Math.round(y);
    const grip = o.grip ? 1 : 0;
    G.box(g, x - 7, y + 7, 14, 6, P.plateDk, { r: 1, band: 1, spec: false });
    G.R(g, x - 5, y + 9, 10, 1, P.cyan);
    G.box(g, x - 6, y - 1, 12, 9, col, { lit, dk, r: 2, band: 2 });
    G.R(g, x - 4, y + 2, 8, 1, P.cyanDk);
    G.box(g, x + 4, y - 3, 5, 6, col, { lit, dk, r: 1, band: 1, spec: false });
    G.box(g, x - 7, y - 5 + grip, 6, 5, col, { lit, dk, r: 1, band: 1, spec: false });
    G.box(g, x - 2, y - 6 + grip, 6, 5, col, { lit, dk, r: 1, band: 1, spec: false });
  };

  // ------------------------------------------------------------
  // THE CITY. Plated walls with neon strips, hanging signs,
  // conduit, steam and a rain of sparks.
  // ------------------------------------------------------------
  G.cityWall = function (g, x, y, w, h, t) {
    G.R(g, x, y, w, h, P.city);
    // big wall panels
    for (let py = 0; py < h; py += 30) {
      for (let px = -((py / 30 | 0) % 2) * 22; px < w; px += 44) {
        G.R(g, x + px, y + py, 42, 28, ((px * 3 + py * 7) % 132 === 0) ? P.cityLt : P.city);
        G.R(g, x + px, y + py, 42, 1, P.cityAcc);
        G.R(g, x + px, y + py + 27, 42, 1, P.cityDk);
        G.R(g, x + px, y + py, 1, 28, P.cityDk);
      }
    }
    // two conduit runs with sparse lit nodes
    for (let i = 0; i < 2; i++) {
      const cy2 = y + 18 + i * Math.round(h / 2.1);
      if (cy2 > y + h - 6) break;
      G.R(g, x, cy2, w, 3, P.cityDk);
      G.R(g, x, cy2, w, 1, P.cityAcc);
      for (let k = 14; k < w; k += 74) {
        const on = Math.sin(t * 2 + k * 0.2 + i) > 0;
        G.R(g, x + k, cy2 - 1, 4, 5, on ? (i % 2 ? P.magenta : P.cyan) : P.cityAcc);
      }
    }
    G.speckle(g, x, y, w, h, P.cityDk, 0.025, 3);
  };

  // a hanging neon glyph sign
  G.hangSign = function (g, x, y, w, h, col, t, glyph) {
    const sway = Math.sin(t * 1.1 + x * 0.1) * 1;
    const sx = Math.round(x + sway);
    G.R(g, sx + Math.round(w / 2) - 1, y - 6, 2, 6, P.plateDk);
    G.box(g, sx, y, w, h, P.cityDk, { lit: P.cityAcc, dk: '#0a0b12', r: 1, band: 1, spec: false });
    const on = Math.sin(t * 7 + x) > -0.85;
    const c = on ? col : G.shade(col, -0.65);
    // glyph: a couple of hard bars, reads as signage at this size
    if (glyph === 0) { G.R(g, sx + 3, y + 3, w - 6, 2, c); G.R(g, sx + 3, y + h - 5, w - 6, 2, c); G.R(g, sx + 3, y + 3, 2, h - 6, c); }
    else if (glyph === 1) { G.R(g, sx + Math.round(w / 2) - 1, y + 3, 2, h - 6, c); G.R(g, sx + 3, y + 3, w - 6, 2, c); }
    else { G.R(g, sx + 3, y + 3, w - 6, 2, c); G.R(g, sx + 3, y + Math.round(h / 2) - 1, w - 6, 2, c); G.R(g, sx + w - 5, y + 3, 2, h - 6, c); }
    if (on) G.glow(g, sx + w / 2, y + h / 2, w, h, col, 0.85);
  };

  // conduit pipe with a lit seam - the cyberpunk cousin of G.pipe
  G.conduit = function (g, x, y, len, vertical, col) {
    if (vertical) {
      G.R(g, x - 1, y, 10, len, OUT);
      G.R(g, x, y, 8, len, P.plateDk);
      G.R(g, x, y, 2, len, P.plate);
      G.R(g, x + 6, y, 1, len, P.plateDk2);
      for (let k = 6; k < len; k += 18) { G.R(g, x - 1, y + k, 10, 3, P.plate); G.R(g, x - 1, y + k, 10, 1, P.plateLt); }
      for (let k = 12; k < len; k += 26) G.R(g, x + 3, y + k, 2, 6, col || P.cyan);
    } else {
      G.R(g, x, y - 1, len, 10, OUT);
      G.R(g, x, y, len, 8, P.plateDk);
      G.R(g, x, y, len, 2, P.plate);
      G.R(g, x, y + 6, len, 1, P.plateDk2);
      for (let k = 6; k < len; k += 18) { G.R(g, x + k, y - 1, 3, 10, P.plate); G.R(g, x + k, y - 1, 1, 10, P.plateLt); }
      for (let k = 12; k < len; k += 26) G.R(g, x + k, y + 3, 6, 2, col || P.cyan);
    }
  };

  // ------------------------------------------------------------
  // STEAM. Vents puffing up out of the floor, in place of flies.
  // ------------------------------------------------------------
  G.steam = [];
  G.puffSteam = function (x, y) { G.steam.push({ x, y, t: 0, life: G.rand(1.1, 1.9), r: G.rand(3, 6), vx: G.rand(-6, 6) }); };
  G.updateSteam = function (dt) {
    for (let i = G.steam.length - 1; i >= 0; i--) {
      const s = G.steam[i];
      s.t += dt; s.y -= dt * 14; s.x += s.vx * dt; s.r += dt * 5;
      if (s.t > s.life) G.steam.splice(i, 1);
    }
  };
  G.drawSteam = function (g) {
    for (const s of G.steam) {
      const a = 1 - s.t / s.life;
      g.globalAlpha = a * 0.2;
      G.rr(g, s.x - s.r, s.y - s.r * 0.6, s.r * 2, s.r * 1.2, P.hullLt);
      g.globalAlpha = 1;
    }
  };

  // ------------------------------------------------------------
  // AN OPENED CHASSIS, for the workshop: a hull cavity with bays.
  // ------------------------------------------------------------
  G.chassisFrame = function (g, x, y, w, h, m, t) {
    // outer hull
    G.box(g, x - 6, y - 6, w + 12, h + 12, m.c, { lit: m.l, dk: m.d, r: 3, band: 5 });
    G.R(g, x - 3, y - 3, w + 6, 1, m.hue);
    // the open cavity
    G.box(g, x, y, w, h, P.plateDk2, { lit: P.plateDk, dk: '#0b0d16', r: 2, band: 2, spec: false });
    // interior ribs
    for (let i = 0; i < 5; i++) G.R(g, x + 4, y + 6 + i * Math.round(h / 5.4), w - 8, 1, P.plateDk);
    // loom of cables down both sides
    for (const s of [0, 1]) {
      const bx = s ? x + w - 7 : x + 3;
      for (let k = 0; k < h - 4; k++)
        G.R(g, bx + Math.round(Math.sin(k * 0.35 + s * 2) * 2), y + 2 + k, 2, 1,
          k % 9 < 3 ? P.magentaDk : k % 9 < 6 ? P.cyanDk : P.violet);
    }
    // a live bus bar across the top
    const bw = w - 20;
    G.R(g, x + 10, y + 2, bw, 2, P.plateDk);
    const sweep = Math.floor((t * 40) % Math.max(1, bw));
    G.R(g, x + 10 + sweep, y + 2, 8, 2, m.hue);
  };
})();

// ============================================================
// MODULES AND FAULTS - the workshop's subject matter.
// A bay holds one module: a board with chips, a heatsink, a pin
// row and a status lamp. Faults are drawn on top of it.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  // ---- the healthy module ----
  G.moduleBox = function (g, m, o) {
    o = o || {};
    const x = Math.round(m.x), y = Math.round(m.y), w = Math.round(m.w), h = Math.round(m.h);
    const dead = o.dead;
    const board = dead ? '#1a2420' : '#1d3a30';
    // bay recess behind it
    G.box(g, x - 2, y - 2, w + 4, h + 4, P.plateDk2, { lit: P.plateDk, dk: '#090b12', r: 1, band: 1, spec: false });
    // the board
    G.box(g, x, y, w, h, board, { lit: G.shade(board, 0.3), dk: G.shade(board, -0.4), r: 1, band: 2, spec: false });
    // copper traces
    for (let i = 1; i < 4; i++) G.R(g, x + 2, y + Math.round(h * i / 4), w - 4, 1, dead ? '#2a3830' : '#3d7a58');
    for (let i = 0; i < 2; i++) G.R(g, x + Math.round(w * (0.3 + i * 0.4)), y + 2, 1, h - 4, dead ? '#2a3830' : '#3d7a58');
    // a fat chip
    const cw = Math.max(6, Math.round(w * 0.42)), chh = Math.max(5, Math.round(h * 0.3));
    const cx0 = x + Math.round((w - cw) / 2), cy0 = y + Math.round(h * 0.2);
    G.box(g, cx0, cy0, cw, chh, '#22262e', { lit: '#3a4048', dk: '#0f1216', r: 1, band: 1, spec: false });
    G.R(g, cx0 + 2, cy0 + 1, cw - 4, 1, '#5a626e');
    for (let i = 0; i < 3; i++) {                      // chip legs
      G.R(g, cx0 - 2, cy0 + 2 + i * 2, 2, 1, P.hullDk);
      G.R(g, cx0 + cw, cy0 + 2 + i * 2, 2, 1, P.hullDk);
    }
    // heatsink fins
    const hs = y + Math.round(h * 0.56);
    for (let i = 0; i < 4; i++) G.R(g, x + 3 + i * 4, hs, 3, Math.max(3, Math.round(h * 0.16)), i % 2 ? P.hullDk : P.hull);
    // pin row along the bottom
    for (let i = 0; i < Math.floor((w - 4) / 3); i++) G.R(g, x + 2 + i * 3, y + h - 3, 2, 3, dead ? P.hullDk : '#d8b048');
    // status lamp
    const lit = dead ? '#3a1520' : o.fixed ? P.lime : P.cyan;
    G.R(g, x + w - 5, y + 2, 3, 3, OUT);
    G.R(g, x + w - 5, y + 2, 2, 2, lit);
    if (!dead) G.glow(g, x + w - 4, y + 3, 5, 5, lit, 0.7);
  };

  // ---- faults drawn onto a module ----
  // s is the live fault state built by night.js materialise()
  G.drawFault = function (g, kind, m, s, t) {
    const x = Math.round(m.x), y = Math.round(m.y), w = Math.round(m.w), h = Math.round(m.h);

    if (kind === 'sugarcrust') {
      for (const b of s.blobs) {
        if (b.gone) continue;
        const bx = x + Math.round(b.x), by = y + Math.round(b.y), r = Math.round(b.r);
        G.rr(g, bx - r - 1, by - r - 1, r * 2 + 2, r * 2 + 2, OUT);
        G.rr(g, bx - r, by - r, r * 2, r * 2, P.sugarCrust);
        G.R(g, bx - r + 1, by - r + 1, r, 1, '#ffffff');
        G.R(g, bx - r + 1, by + r - 2, r * 2 - 2, 1, G.shade(P.sugarCrust, -0.3));
      }
      return;
    }
    if (kind === 'syrupshort') {
      const ph = Math.round(h * 0.42 * (s.cleaned ? 0.25 : 1));
      const py = y + h - 4 - ph;
      G.rr(g, x + 1, py, w - 2, ph, G.shade(P.syrupGoo, -0.45));
      G.rr(g, x + 2, py + 1, w - 4, ph - 2, P.syrupGoo);
      G.R(g, x + 3, py + 1, Math.round(w * 0.4), 1, G.shade(P.syrupGoo, 0.5));
      if (!s.soldered) {                                // the shorted joint arcs
        const on = Math.sin(t * 22) > 0.3;
        if (on) {
          G.R(g, x + Math.round(s.jx), y + Math.round(s.jy), 2, 2, '#ffffff');
          G.glow(g, x + s.jx, y + s.jy, 8, 8, P.cyanLt, 1);
        }
      }
      return;
    }
    if (kind === 'sprinklejam') {
      // a gear with coloured rods packed into its teeth
      const gx = x + Math.round(w * 0.5), gy = y + Math.round(h * 0.5);
      const r = Math.max(5, Math.round(Math.min(w, h) * 0.3));
      const spin = s.freed ? t * 3 : 0;
      G.rr(g, gx - r - 1, gy - r - 1, r * 2 + 2, r * 2 + 2, OUT);
      G.rr(g, gx - r, gy - r, r * 2, r * 2, P.hullDk);
      G.rr(g, gx - r + 2, gy - r + 2, r * 2 - 4, r * 2 - 4, P.hull);
      G.R(g, gx - 1, gy - 1, 2, 2, P.plateDk2);
      for (let i = 0; i < 6; i++) {
        const a = spin + i * Math.PI / 3;
        G.R(g, gx + Math.round(Math.cos(a) * r) - 1, gy + Math.round(Math.sin(a) * r) - 1, 3, 3, P.hullLt);
      }
      if (!s.freed) for (const b of s.bits)
        G.R(g, x + Math.round(b.x), y + Math.round(b.y), 3, 2, b.col);
      return;
    }
    if (kind === 'coldseize') {
      const a = s.thawed ? 0.3 : 1;
      g.globalAlpha = a;
      G.rr(g, x + 1, y + 1, w - 2, h - 2, '#bfe8ff44');
      for (const c of s.crystals)
        G.R(g, x + Math.round(c.x), y + Math.round(c.y), c.w, c.h, c.w > 2 ? '#dff4ff' : P.coolantLt);
      g.globalAlpha = 1;
      if (!s.oiled && s.thawed) {                       // dry bearing squeals
        G.R(g, x + Math.round(w * 0.5) - 3, y + Math.round(h * 0.5) - 3, 6, 6, OUT);
        G.R(g, x + Math.round(w * 0.5) - 2, y + Math.round(h * 0.5) - 2, 4, 4, P.hazard);
      }
      return;
    }
    if (kind === 'dairyrot') {
      // a mottled sour patch chewing in from one corner
      const rw = Math.round(w * 0.5), rh = Math.round(h * 0.5);
      const rx = s.corner ? x + w - rw - 1 : x + 1, ry = y + h - rh - 3;
      if (!s.cleaned) {
        G.rr(g, rx, ry, rw, rh, '#6b7a30');
        for (let i = 0; i < 9; i++)
          G.R(g, rx + Math.round(G.hash(i, 3) * (rw - 2)), ry + Math.round(G.hash(i, 9) * (rh - 2)), 2, 2,
            i % 2 ? '#9aad3a' : '#4a5a1a');
      }
      if (!s.cut) {                                     // the eaten terminal
        G.R(g, rx + 2, ry + rh - 4, rw - 4, 3, s.cleaned ? '#5a3a1a' : '#3a2a10');
      } else if (!s.soldered) {
        G.R(g, rx + 2, ry + rh - 4, rw - 4, 3, P.hullDk);
      }
      return;
    }
    if (kind === 'nutcrack') {
      if (s.welded) {                                   // a bead of weld
        for (let i = 0; i < s.pts.length - 1; i++)
          G.line(g, x + s.pts[i].x, y + s.pts[i].y, x + s.pts[i + 1].x, y + s.pts[i + 1].y, P.hazard, 3);
        return;
      }
      for (let i = 0; i < s.pts.length - 1; i++) {
        G.line(g, x + s.pts[i].x, y + s.pts[i].y, x + s.pts[i + 1].x, y + s.pts[i + 1].y, OUT, 3);
        G.line(g, x + s.pts[i].x, y + s.pts[i].y, x + s.pts[i + 1].x, y + s.pts[i + 1].y, '#0a0c14', 1);
      }
      return;
    }
    if (kind === 'wedged') {
      if (s.pulled) return;
      const ox = x + Math.round(s.lx), oy = y + Math.round(s.ly);
      G.box(g, ox - 1, oy - 1, s.w + 2, s.h + 2, OUT, { r: 1, band: 0, spec: false });
      G.box(g, ox, oy, s.w, s.h, s.col, { lit: G.shade(s.col, 0.35), dk: G.shade(s.col, -0.4), r: 1, band: 1 });
      if (s.grabbed) G.R(g, ox - 2, oy - 3, s.w + 4, 2, P.cyan);
      return;
    }
    if (kind === 'overload') {
      if (!s.swapped) {
        // scorched board and a blown fuse
        G.rr(g, x + 2, y + Math.round(h * 0.3), w - 4, Math.round(h * 0.4), '#1a1014');
        for (let i = 0; i < 8; i++)
          G.R(g, x + 3 + Math.round(G.hash(i, 5) * (w - 6)), y + Math.round(h * 0.32) + Math.round(G.hash(i, 13) * (h * 0.34)), 2, 2,
            i % 3 ? '#3a2020' : '#0d0808');
        const fx = x + Math.round(w * 0.5) - 4, fy = y + Math.round(h * 0.44);
        G.box(g, fx, fy, 9, 5, '#2a1a1a', { r: 1, band: 1, spec: false });
        G.R(g, fx + 2, fy + 2, 5, 1, '#8a4a20');
        if (Math.sin(t * 9) > 0.5) G.R(g, fx + 3, fy + 1, 3, 3, P.hazard);
      } else if (!s.soldered) {
        G.R(g, x + Math.round(w * 0.5) - 5, y + Math.round(h * 0.44), 11, 5, P.hull);
        G.R(g, x + Math.round(w * 0.5) - 5, y + Math.round(h * 0.44) + 5, 11, 1, P.hazard);
      }
      return;
    }
  };

  // ---- the scanner's preview thumbnail of a fault ----
  G.faultThumb = function (g, kind, x, y, w, h, t) {
    G.box(g, x, y, w, h, P.plateDk2, { lit: P.plateDk, dk: '#080a10', r: 1, band: 1, spec: false });
    const m = { x: x + 4, y: y + 4, w: w - 8, h: h - 8 };
    G.moduleBox(g, m, {});
    const s = G.sampleFault(kind, m);
    G.drawFault(g, kind, m, s, t);
    // scanline overlay so it reads as a scan, not a photo
    for (let j = 0; j < h; j += 3) { g.globalAlpha = 0.16; G.R(g, x, y + j, w, 1, P.cyanLt); g.globalAlpha = 1; }
  };

  // a deterministic exemplar of each fault, for the scanner page
  G.sampleFault = function (kind, m) {
    const w = m.w, h = m.h;
    if (kind === 'sugarcrust') return { blobs: [{ x: w * 0.3, y: h * 0.72, r: 4 }, { x: w * 0.62, y: h * 0.66, r: 3 }] };
    if (kind === 'syrupshort') return { jx: w * 0.5, jy: h * 0.6 };
    if (kind === 'sprinklejam') return { bits: [
      { x: w * 0.5 - 6, y: h * 0.3, col: '#ff2f8e' }, { x: w * 0.5 + 4, y: h * 0.36, col: '#22e0ff' },
      { x: w * 0.5 - 2, y: h * 0.68, col: '#b6ff3a' }, { x: w * 0.5 + 6, y: h * 0.58, col: '#ffcf2e' }] };
    if (kind === 'coldseize') return { crystals: [
      { x: w * 0.2, y: h * 0.3, w: 3, h: 3 }, { x: w * 0.6, y: h * 0.24, w: 2, h: 4 },
      { x: w * 0.4, y: h * 0.62, w: 4, h: 2 }, { x: w * 0.74, y: h * 0.66, w: 2, h: 3 }] };
    if (kind === 'dairyrot') return { corner: 1 };
    if (kind === 'nutcrack') return { pts: [{ x: w * 0.2, y: 2 }, { x: w * 0.44, y: h * 0.4 }, { x: w * 0.3, y: h * 0.7 }, { x: w * 0.6, y: h - 2 }] };
    if (kind === 'wedged') return { lx: w * 0.55, ly: h * 0.34, w: 5, h: 9, col: '#c9a06a' };
    if (kind === 'overload') return {};
    return {};
  };

  // ---- mechanic tool sprites: a shaft plus a distinct head ----
  G.mechTool = function (g, id, x, y, o) {
    o = o || {};
    const st = P.hull, stD = P.hullDk, ch = P.hullLt;
    function shaft(len, wd, col) {
      for (let i = 0; i < len; i++) {
        G.R(g, x - wd / 2 - 1, y - i, wd + 2, 1, OUT);
        G.R(g, x - wd / 2, y - i, wd, 1, i % 7 < 4 ? (col || st) : stD);
        G.R(g, x - wd / 2, y - i, 1, 1, ch);
      }
    }
    const t = o.t || 0, act = o.active;
    switch (id) {
      case 'scan':                                      // handheld scanner
        shaft(16, 5);
        G.box(g, x - 6, y - 26, 12, 11, P.plateDk, { lit: P.plate, dk: P.plateDk2, r: 1, band: 1 });
        G.R(g, x - 4, y - 24, 8, 7, act && Math.sin(t * 18) > 0 ? P.cyanLt : P.cyanDk);
        break;
      case 'scrape':                                    // flat blade
        shaft(22, 4);
        G.R(g, x - 4, y - 27, 8, 6, OUT); G.R(g, x - 3, y - 26, 6, 4, ch);
        break;
      case 'blow':                                      // air nozzle
        shaft(18, 6);
        G.box(g, x - 5, y - 26, 10, 9, P.plateDk, { lit: P.plate, dk: P.plateDk2, r: 1, band: 1 });
        G.R(g, x - 2, y - 30, 4, 5, P.hull);
        if (act) for (let i = 0; i < 5; i++) G.R(g, x - 4 + G.irand(0, 8), y - 34 - G.irand(0, 8), 2, 2, P.cyanLt);
        break;
      case 'vac':                                       // vacuum snout
        shaft(16, 6);
        G.R(g, x - 7, y - 24, 14, 4, OUT); G.R(g, x - 6, y - 23, 12, 2, P.plate);
        G.R(g, x - 4, y - 20, 8, 3, P.plateDk2);
        if (act) G.R(g, x - 3, y - 28, 6, 4, P.cyanDk);
        break;
      case 'heat':                                      // heat gun coil
        shaft(18, 5);
        G.box(g, x - 5, y - 27, 10, 9, P.plateDk, { lit: P.plate, dk: P.plateDk2, r: 1, band: 1 });
        for (let i = 0; i < 3; i++) G.R(g, x - 3 + i * 3, y - 25, 2, 5, act ? P.hazard : '#6b4a20');
        if (act) G.glow(g, x, y - 24, 12, 10, P.hazard, 1);
        break;
      case 'oil':                                       // oil can
        shaft(14, 5);
        G.box(g, x - 6, y - 25, 12, 10, '#3a2a14', { lit: '#6b5028', dk: '#20150a', r: 1, band: 1 });
        G.R(g, x + 4, y - 29, 3, 6, P.hull);
        if (act) G.R(g, x + 5, y - 32, 2, 3, P.hazard);
        break;
      case 'solder':                                    // iron with a hot tip
        shaft(24, 4);
        G.R(g, x - 2, y - 30, 4, 6, OUT);
        G.R(g, x - 1, y - 29, 2, 5, act ? P.hazard : '#8a6a3a');
        if (act) G.glow(g, x, y - 28, 8, 8, P.hazard, 1.2);
        break;
      case 'weld':                                      // welder with an arc
        shaft(20, 6);
        G.R(g, x - 4, y - 28, 8, 6, OUT); G.R(g, x - 3, y - 27, 6, 4, P.hullDk);
        if (act) {
          for (let i = 0; i < 4; i++) G.R(g, x - 3 + G.irand(0, 6), y - 33 - G.irand(0, 4), 2, 2, i % 2 ? '#ffffff' : P.cyanLt);
          G.glow(g, x, y - 31, 14, 12, P.cyanLt, 1.4);
        }
        break;
      case 'pull':                                      // pliers
        shaft(14, 4);
        for (const s of [-1, 1]) {
          G.R(g, x + s * 2 - 1, y - 26, 2, 12, OUT);
          G.R(g, x + s * 2 - 1, y - 26, 1, 12, ch);
        }
        break;
      case 'swap':                                      // module lifter fork
        shaft(16, 5);
        G.R(g, x - 7, y - 24, 14, 3, OUT); G.R(g, x - 6, y - 23, 12, 1, ch);
        for (const s of [-1, 1]) { G.R(g, x + s * 6 - 1, y - 30, 2, 7, OUT); G.R(g, x + s * 6 - 1, y - 30, 1, 7, P.hull); }
        break;
      default:
        shaft(20, 4);
    }
  };
})();

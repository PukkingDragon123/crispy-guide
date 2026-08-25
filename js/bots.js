// ============================================================
// DOUBLE LIFE v5 - bots.js  ·  THE OCCUPATION, DRAWN
// Every machine is assembled from a frame descriptor, so the
// SILHOUETTE comes from the job: a siege unit rides treads under a
// slab of armour, a maid unit stands on a skirted column, an
// orchestra unit has a violin for a waist. Six bases, ten torsos,
// nine heads, eleven arm sets and fifteen props, mixed per
// archetype so no two read alike.
//
// Everything is scanline fillRect work. Materials get four tones,
// a contact shadow and a specular so the metal has weight.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  // ------------------------------------------------------------
  // FRAMES. base / torso / head / arms / prop, plus proportions.
  // ------------------------------------------------------------
  const FRAME = {
    tank:    { base: 'tread',  torso: 'slab',    head: 'wedge',   arms: 'heavy',   prop: 'cannon',  w: 1.5,  h: 0.84, hs: 0.92 },
    maid:    { base: 'skirt',  torso: 'narrow',  head: 'dome',    arms: 'slim',    prop: 'apron',   w: 0.9,  h: 1.06, hs: 1.0 },
    mafia:   { base: 'legs',   torso: 'boxy',    head: 'tophat',  arms: 'heavy',   prop: 'cigar',   w: 1.2,  h: 1.0,  hs: 0.95, emblem: 'knot' },
    police:  { base: 'wheel',  torso: 'boxy',    head: 'helmet',  arms: 'baton',   prop: 'siren',   w: 1.0,  h: 1.0,  hs: 0.95, emblem: 'badge' },
    fat:     { base: 'plinth', torso: 'barrel',  head: 'small',   arms: 'stub',    prop: 'funnel',  w: 1.72, h: 0.9,  hs: 0.74 },
    violin:  { base: 'legs',   torso: 'violin',  head: 'narrowH', arms: 'bow',     prop: 'scroll',  w: 0.86, h: 1.16, hs: 0.8 },
    chef:    { base: 'legs',   torso: 'boxy',    head: 'dome',    arms: 'many',    prop: 'toque',   w: 1.1,  h: 1.0,  hs: 0.9, emblem: 'stamp' },
    nurse:   { base: 'wheel',  torso: 'narrow',  head: 'dome',    arms: 'syringe', prop: 'cross',   w: 0.95, h: 1.02, hs: 1.0 },
    judge:   { base: 'plinth', torso: 'robe',    head: 'boxy',    arms: 'gavel',   prop: 'wig',     w: 1.28, h: 1.04, hs: 0.9 },
    miner:   { base: 'tread',  torso: 'boxy',    head: 'lamp',    arms: 'drill',   prop: 'none',    w: 1.2,  h: 0.94, hs: 0.9, emblem: 'star' },
    priest:  { base: 'skirt',  torso: 'narrow',  head: 'bell',    arms: 'slim',    prop: 'halo',    w: 0.9,  h: 1.18, hs: 0.85 },
    dj:      { base: 'plinth', torso: 'drum',    head: 'crt',     arms: 'slim',    prop: 'phones',  w: 1.06, h: 0.98, hs: 1.06 },
    clerk:   { base: 'legs',   torso: 'filing',  head: 'boxy',    arms: 'stamp',   prop: 'specs',   w: 1.1,  h: 0.96, hs: 0.88 },
    soldier: { base: 'legs',   torso: 'boxy',    head: 'helmet',  arms: 'rifle',   prop: 'webbing', w: 1.05, h: 1.0,  hs: 0.88, emblem: 'chevron' },
    scav:    { base: 'legs',   torso: 'junk',    head: 'bucket',  arms: 'claw',    prop: 'aerial',  w: 1.0,  h: 1.0,  hs: 0.9 },
    courier: { base: 'wheel',  torso: 'boxpack', head: 'wedge',   arms: 'slim',    prop: 'aerial',  w: 0.95, h: 0.96, hs: 0.84 },
    garden:  { base: 'tread',  torso: 'narrow',  head: 'dome',    arms: 'can',     prop: 'moss',    w: 1.0,  h: 1.0,  hs: 0.9 },
    warden:  { base: 'legs',   torso: 'slab',    head: 'lamp',    arms: 'heavy',   prop: 'shackle', w: 1.32, h: 1.08, hs: 0.9 },
    // YOU. A soft-serve machine on salvaged tread, with a swirl still set in
    // the dispenser head forty years after the shop closed.
    player:  { base: 'tread',  torso: 'barrel',  head: 'dome',    arms: 'can',     prop: 'swirl',   w: 1.14, h: 0.98, hs: 0.98 },
  };
  G.frameOf = (id) => FRAME[id] || FRAME.police;

  // ------------------------------------------------------------
  // MATERIAL. Four tones plus a contact shadow and a specular, so
  // the plate reads as bent metal rather than a flat swatch.
  // ------------------------------------------------------------
  function plate(g, x, y, w, h, c, o) {
    o = o || {};
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    if (w < 1 || h < 1) return;
    const lit = o.lit || G.shade(c, 0.3), dk = o.dk || G.shade(c, -0.34), dk2 = G.shade(c, -0.58);
    const r = o.r === undefined ? 2 : o.r;
    G.rr2(g, x - 1, y - 1, w + 2, h + 2, OUT);
    if (r >= 2) G.rr2(g, x, y, w, h, c); else G.R(g, x, y, w, h, c);
    const band = Math.max(1, Math.min(Math.round(h * 0.28), o.band || 3));
    G.R(g, x + 1, y, w - 2, band, lit);                 // top light
    G.R(g, x + 1, y + h - band - 1, w - 2, band + 1, dk); // bottom shade
    G.R(g, x + 1, y + h - 1, w - 2, 1, dk2);            // contact edge
    if (o.side !== false) G.R(g, x + w - 2, y + 1, 1, h - 2, dk);
    if (o.spec !== false && w > 5 && h > 4) G.R(g, x + 2, y + 1, Math.max(1, Math.round(w * 0.3)), 1, '#ffffff');
    if (o.rivets && w > 10) for (let i = 0; i < 2; i++)
      G.R(g, x + 2 + i * (w - 6), y + Math.round(h * 0.5), 2, 2, dk2);
  }
  G.plate = plate;

  // a lit strip: the neon accent that says which unit this is
  function accent(g, x, y, w, h, col) { G.R(g, x, y, w, h, col); G.glow(g, x + w / 2, y + h / 2, w, h + 4, col, 0.6); }

  // ------------------------------------------------------------
  // THE OPTIC. Kept from v4 and tightened: a lens with a metal
  // bezel, a coloured iris and a white core.
  // ------------------------------------------------------------
  const ballRows = G.ballRows || function (w, h) {
    const rows = [], rx = w / 2, ry = h / 2;
    for (let j = 0; j < h; j++) {
      const dy = (j + 0.5 - ry) / ry;
      rows.push(Math.max(1, Math.round(rx * Math.sqrt(Math.max(0, 1 - dy * dy)))));
    }
    return rows;
  };
  G.lens = function (g, x, y, w, h, o) {
    o = o || {};
    x = Math.round(x); y = Math.round(y);
    w = Math.max(4, Math.round(w)); h = Math.max(4, Math.round(h));
    const cx = x + w / 2, cy = y + h / 2;
    const hue = o.hue || P.cyan;
    const rows = ballRows(w, h);
    for (let j = 0; j < h; j++) G.R(g, Math.round(cx - rows[j]) - 1, y + j, rows[j] * 2 + 2, 1, OUT);
    if (o.dead) {
      for (let j = 1; j < h - 1; j++) G.R(g, Math.round(cx - rows[j]), y + j, rows[j] * 2, 1, P.plateDk);
      G.R(g, x + 1, Math.round(cy), w - 2, 1, P.plateDk2);
      return;
    }
    if (o.closed) {
      const lid = Math.max(1, Math.round(h * 0.72));
      for (let j = lid; j < h - 1; j++) G.R(g, Math.round(cx - rows[j]), y + j, rows[j] * 2, 1, G.shade(hue, -0.4));
      for (let j = 0; j < lid; j++) G.R(g, Math.round(cx - rows[j]), y + j, rows[j] * 2, 1, j < 1 ? P.hullLt : P.hull);
      return;
    }
    for (let j = 0; j < h; j++) {                        // bezel
      const c = j < 1 ? P.hullLt : j >= h - 1 ? P.hullDk : P.hull;
      G.R(g, Math.round(cx - rows[j]), y + j, rows[j] * 2, 1, c);
    }
    const ir = Math.max(2, Math.round(Math.min(w, h) * 0.76));
    const irows = ballRows(ir, ir);
    const ix = cx + (o.lookX || 0) * (w / 2 - ir / 2);
    const iy = cy + (o.lookY || 0) * (h / 2 - ir / 2);
    const ir0 = Math.round(iy - ir / 2);
    for (let j = 0; j < ir; j++) {
      const c = j < ir * 0.28 ? G.shade(hue, -0.45) : j > ir * 0.74 ? G.shade(hue, 0.4) : hue;
      G.R(g, Math.round(ix - irows[j]), ir0 + j, irows[j] * 2, 1, c);
    }
    const pw = Math.max(1, Math.round(ir * (o.slit ? 0.3 : 0.44)));
    const ph = o.slit ? Math.max(2, ir - 1) : pw;
    const prows = o.slit ? null : ballRows(pw, ph);
    for (let j = 0; j < ph; j++) {
      const hw = prows ? prows[j] : pw / 2;
      G.R(g, Math.round(ix - hw), Math.round(iy - ph / 2) + j, Math.max(1, Math.round(hw * 2)), 1, '#ffffff');
    }
    if (w > 6) G.R(g, Math.round(cx - rows[1] * 0.6), y + 1, 1, 1, '#ffffff');
    if (!o.noGlow) G.glow(g, cx, cy, w * 0.9, h * 0.9, hue, 0.7);
  };

  // ============================================================
  // BASES - how it stands
  // ============================================================
  function drawBase(g, kind, cx, footY, bw, u, b, t, walk) {
    const c = b.col, c2 = b.col2, hue = b.hue;
    if (kind === 'tread') {
      const w = Math.round(bw * 1.06), h = u(11);
      plate(g, cx - w / 2, footY - h, w, h, c2, { r: 2, band: 2 });
      // road wheels + a moving track
      const off = Math.floor((walk * 20) % Math.max(2, u(5)));
      for (let i = 0; i < 5; i++) {
        const wx = cx - w / 2 + u(3) + i * ((w - u(6)) / 4);
        G.R(g, wx - 2, footY - h + u(3), 4, h - u(5), P.plateDk2);
      }
      for (let k = 0; k < w; k += Math.max(3, u(5))) {
        G.R(g, cx - w / 2 + ((k + off) % w), footY - h, 2, 2, P.hullDk);
        G.R(g, cx - w / 2 + ((k + off) % w), footY - 3, 2, 2, P.hullDk);
      }
      G.R(g, cx - w / 2 + 2, footY - 2, w - 4, 2, P.plateDk2);
      return { top: footY - h, w };
    }
    if (kind === 'wheel') {
      const r = u(8);
      const spin = walk * 5;
      G.rr2(g, cx - r - 1, footY - r * 2 - 1, r * 2 + 2, r * 2 + 2, OUT);
      const rows = ballRows(r * 2, r * 2);
      for (let j = 0; j < r * 2; j++)
        G.R(g, Math.round(cx - rows[j]), footY - r * 2 + j, rows[j] * 2, 1, j < r * 0.5 ? P.plate : P.plateDk);
      for (let i = 0; i < 4; i++) {
        const a = spin + i * Math.PI / 2;
        G.R(g, cx + Math.round(Math.cos(a) * r * 0.6) - 1, footY - r + Math.round(Math.sin(a) * r * 0.6) - 1, 3, 3, P.hull);
      }
      G.R(g, cx - 2, footY - r - 2, 4, 4, P.hullLt);
      // fork
      plate(g, cx - u(4), footY - r * 2 - u(6), u(8), u(7), c2, { r: 1, band: 1 });
      return { top: footY - r * 2 - u(5), w: r * 2 };
    }
    if (kind === 'skirt') {
      const w = Math.round(bw * 0.96), h = u(20);
      // a flared column, drawn as a stack of widening rows
      for (let j = 0; j < h; j++) {
        const p = j / (h - 1);
        const hw = Math.round((w / 2) * (0.42 + 0.58 * p));
        G.R(g, cx - hw - 1, footY - h + j, hw * 2 + 2, 1, OUT);
        G.R(g, cx - hw, footY - h + j, hw * 2, 1, j < 2 ? G.shade(c, 0.25) : p > 0.86 ? G.shade(c, -0.4) : c);
        if (j % 5 === 2) G.R(g, cx - hw + 1, footY - h + j, hw * 2 - 2, 1, G.shade(c, -0.2));
      }
      G.R(g, cx - Math.round(w * 0.4), footY - 2, Math.round(w * 0.8), 2, P.plateDk2);
      return { top: footY - h, w };
    }
    if (kind === 'plinth') {
      const w = Math.round(bw * 1.0), h = u(9);
      plate(g, cx - w / 2, footY - h, w, h, P.plateDk, { r: 1, band: 2 });
      G.R(g, cx - w / 2 + 2, footY - h + 2, w - 4, 1, hue);
      G.R(g, cx - w / 2 - 2, footY - 3, w + 4, 3, P.plate);
      return { top: footY - h, w };
    }
    // legs: two piston columns with a stride
    const sw = Math.sin(walk * 6) * u(2);
    const lw = Math.max(3, u(7)), lh = u(17);
    for (const s of [-1, 1]) {
      const lx = cx + s * Math.round(bw * 0.24) - lw / 2;
      const ly = footY - lh + (s < 0 ? sw : -sw);
      plate(g, lx, ly, lw, lh - Math.abs(sw), c2, { r: 1, band: 2, spec: false });
      G.R(g, lx + 1, ly + Math.round(lh * 0.4), lw - 2, 2, P.plateDk2);   // knee
      plate(g, lx - 2, footY - 4 + (s < 0 ? sw : -sw), lw + 4, 4, P.plateDk, { r: 1, band: 1, spec: false });
    }
    return { top: footY - lh, w: Math.round(bw * 0.7) };
  }

  // ============================================================
  // TORSOS - what it is for
  // ============================================================
  // a small badge stamped on the chest: the unit's insignia
  function drawEmblem(g, kind, cx, y, u, hue) {
    if (kind === 'badge') {                              // police shield
      G.rr2(g, cx - u(4), y - u(4), u(8), u(8), '#d8dce4');
      G.rr2(g, cx - u(3), y - u(3), u(6), u(6), '#3a5a9a');
      G.R(g, cx - 1, y - u(2), 2, u(4), '#ffe89a');
    } else if (kind === 'star') {                        // miner's guild mark
      G.R(g, cx - u(4), y - 1, u(8), 2, '#ffd44a');
      G.R(g, cx - 1, y - u(4), 2, u(8), '#ffd44a');
    } else if (kind === 'chevron') {                     // infantry rank
      for (let i = 0; i < 2; i++) {
        G.R(g, cx - u(4), y - u(2) + i * u(3), u(4), 2, '#e8e0c0');
        G.R(g, cx, y - u(3) + i * u(3), u(4), 2, '#e8e0c0');
      }
    } else if (kind === 'stamp') {                        // clerk's seal
      G.rr2(g, cx - u(4), y - u(4), u(8), u(8), '#8a2a3a');
      G.R(g, cx - u(2), y - u(1), u(4), 2, '#e8d8c0');
    } else if (kind === 'knot') {                         // enforcer's family knot
      G.R(g, cx - u(4), y - u(3), u(8), 2, hue);
      G.R(g, cx - u(3), y, u(6), 2, hue);
      G.R(g, cx - u(2), y + u(3), u(4), 2, hue);
    }
  }

  function drawTorso(g, kind, cx, baseTop, bw, u, b, t, o) {
    const c = b.col, c2 = b.col2, hue = b.hue;
    let w = bw, h = u(26);
    if (kind === 'slab')    { w = Math.round(bw * 1.1); h = u(24); }
    if (kind === 'narrow')  { w = Math.round(bw * 0.62); h = u(28); }
    if (kind === 'barrel')  { w = Math.round(bw * 1.12); h = u(30); }
    if (kind === 'violin')  { w = Math.round(bw * 0.78); h = u(32); }
    if (kind === 'robe')    { w = Math.round(bw * 1.02); h = u(30); }
    if (kind === 'filing')  { w = Math.round(bw * 0.94); h = u(28); }
    if (kind === 'drum')    { w = Math.round(bw * 0.98); h = u(24); }
    if (kind === 'junk')    { w = Math.round(bw * 0.94); h = u(26); }
    if (kind === 'boxpack') { w = Math.round(bw * 0.9);  h = u(26); }
    const y = baseTop - h;

    if (kind === 'barrel') {
      // a bulging tank: rows widening then narrowing
      for (let j = 0; j < h; j++) {
        const p = j / (h - 1);
        const bulge = Math.sin(p * Math.PI) * 0.22 + 0.78;
        const hw = Math.round((w / 2) * bulge);
        G.R(g, cx - hw - 1, y + j, hw * 2 + 2, 1, OUT);
        G.R(g, cx - hw, y + j, hw * 2, 1, j < 3 ? G.shade(c, 0.28) : p > 0.82 ? G.shade(c, -0.4) : c);
      }
      // hoop bands
      for (let k = 1; k < 4; k++) {
        const j = Math.round(h * k / 4), p = j / (h - 1);
        const hw = Math.round((w / 2) * (Math.sin(p * Math.PI) * 0.22 + 0.78));
        G.R(g, cx - hw, y + j, hw * 2, 2, G.shade(c, -0.3));
        G.R(g, cx - hw, y + j, hw * 2, 1, G.shade(c, 0.12));
      }
      // a full-belly gauge
      G.R(g, cx - u(9), y + Math.round(h * 0.42), u(18), u(7), P.plateDk2);
      G.R(g, cx - u(8), y + Math.round(h * 0.42) + 1, Math.round(u(16) * (0.55 + Math.sin(t * 1.4) * 0.3)), u(5), hue);
    } else if (kind === 'violin') {
      // an hourglass resonator with f-holes and a bridge
      for (let j = 0; j < h; j++) {
        const p = j / (h - 1);
        const waist = 1 - Math.exp(-Math.pow((p - 0.5) * 3.4, 2)) * 0.42;
        const hw = Math.round((w / 2) * waist);
        G.R(g, cx - hw - 1, y + j, hw * 2 + 2, 1, OUT);
        G.R(g, cx - hw, y + j, hw * 2, 1, j < 2 ? G.shade(c, 0.34) : p > 0.88 ? G.shade(c, -0.42) : c);
        if (j % 7 === 3) G.R(g, cx - hw + 1, y + j, hw * 2 - 2, 1, G.shade(c, 0.1));
      }
      for (const s of [-1, 1]) {
        const fx = cx + s * u(7);
        for (let k = 0; k < u(9); k++) G.R(g, fx + Math.round(Math.sin(k * 0.5) * 1.4), y + u(9) + k, 2, 1, P.plateDk2);
      }
      G.R(g, cx - u(8), y + Math.round(h * 0.6), u(16), 2, G.shade(c, -0.5));
      for (let i = 0; i < 4; i++) G.R(g, cx - u(6) + i * u(4), y + u(4), 1, h - u(10), i % 2 ? P.hullLt : P.hull);
    } else if (kind === 'robe') {
      // wide shoulders falling into a straight robe
      for (let j = 0; j < h; j++) {
        const p = j / (h - 1);
        const hw = Math.round((w / 2) * (0.72 + 0.28 * Math.min(1, p * 2)));
        G.R(g, cx - hw - 1, y + j, hw * 2 + 2, 1, OUT);
        G.R(g, cx - hw, y + j, hw * 2, 1, j < 2 ? G.shade(c, 0.26) : p > 0.86 ? G.shade(c, -0.4) : c);
      }
      // pleats
      for (let i = -2; i <= 2; i++) G.R(g, cx + i * u(6), y + u(8), 1, h - u(10), G.shade(c, -0.24));
      G.R(g, cx - u(10), y + u(2), u(20), 2, hue);
    } else if (kind === 'filing') {
      plate(g, cx - w / 2, y, w, h, c, { r: 1, band: 3, rivets: 1 });
      // three drawers, one hanging open
      for (let i = 0; i < 3; i++) {
        const dy = y + 3 + i * Math.round((h - 6) / 3);
        const outp = i === 1 ? u(3) : 0;
        plate(g, cx - w / 2 + 2 - outp, dy, w - 4, Math.round((h - 8) / 3), c2, { r: 1, band: 1, spec: false });
        G.R(g, cx - u(4) - outp, dy + Math.round((h - 8) / 6), u(8), 2, P.hullDk);
      }
    } else if (kind === 'drum') {
      plate(g, cx - w / 2, y, w, h, c, { r: 2, band: 3 });
      // a speaker cone with a live cabinet
      const sr = Math.round(Math.min(w, h) * 0.36);
      const rows = ballRows(sr * 2, sr * 2);
      const puls = 1 + Math.sin(t * 9) * 0.1;
      for (let j = 0; j < sr * 2; j++) {
        const hw = Math.round(rows[j] * puls);
        G.R(g, cx - hw, y + Math.round(h / 2) - sr + j, hw * 2, 1, j < sr * 0.7 ? P.plateDk2 : '#0d0f16');
      }
      const inner = ballRows(sr, sr);
      for (let j = 0; j < sr; j++)
        G.R(g, cx - inner[j], y + Math.round(h / 2) - Math.round(sr / 2) + j, inner[j] * 2, 1,
          j < sr * 0.3 ? G.shade(hue, -0.35) : hue);
      G.R(g, cx - 2, y + Math.round(h / 2) - 2, 4, 4, '#ffffff');
      for (let i = 0; i < 3; i++) G.R(g, cx - w / 2 + 2, y + 2 + i * 2, w - 4, 1, G.shade(c, 0.2));
    } else if (kind === 'junk') {
      // mismatched panels bolted together
      plate(g, cx - w / 2, y, w, h, c, { r: 1, band: 2 });
      plate(g, cx - w / 2 + u(2), y + u(3), Math.round(w * 0.5), Math.round(h * 0.44), c2, { r: 1, band: 1, spec: false });
      plate(g, cx + u(1), y + Math.round(h * 0.5), Math.round(w * 0.42), Math.round(h * 0.4), P.plateDk, { r: 1, band: 1, spec: false });
      G.R(g, cx - w / 2 + 1, y + Math.round(h * 0.48), w - 2, 1, P.hullDk);
      for (let i = 0; i < 5; i++)
        G.R(g, cx - w / 2 + 3 + ((i * 7) % (w - 6)), y + 2 + ((i * 5) % (h - 4)), 2, 2, i % 2 ? P.hullDk : P.rust);
    } else if (kind === 'boxpack') {
      plate(g, cx - w / 2, y, w, h, c, { r: 1, band: 3 });
      // a strapped delivery crate on the back
      plate(g, cx - w / 2 - u(3), y + u(4), Math.round(w * 0.5), Math.round(h * 0.7), '#8a6a3a', { r: 1, band: 2 });
      G.R(g, cx - w / 2 - u(3), y + u(4) + Math.round(h * 0.3), Math.round(w * 0.5), 2, '#5c4420');
      G.R(g, cx - u(6), y + u(4), u(12), 1, hue);
    } else if (kind === 'slab') {
      plate(g, cx - w / 2, y, w, h, c, { r: 2, band: 4, rivets: 1 });
      // sloped glacis and a vision slit
      for (let j = 0; j < u(7); j++)
        G.R(g, cx - w / 2 + 1 + j, y + j, w - 2 - j * 2, 1, G.shade(c, 0.16 - j * 0.03));
      G.R(g, cx - u(12), y + u(9), u(24), u(4), P.plateDk2);
      accent(g, cx - u(11), y + u(10), u(22), 1, hue);
    } else {
      plate(g, cx - w / 2, y, w, h, c, { r: 2, band: 3, rivets: kind === 'boxy' ? 1 : 0 });
      // chest vent + status light on the plain frames
      G.R(g, cx - Math.round(w * 0.3), y + Math.round(h * 0.32), Math.round(w * 0.6), Math.round(h * 0.34), P.plateDk2);
      for (let i = 0; i < 3; i++)
        G.R(g, cx - Math.round(w * 0.28), y + Math.round(h * 0.34) + i * 3, Math.round(w * 0.56), 1, P.plateDk);
      G.R(g, cx - Math.round(w * 0.26), y + Math.round(h * 0.36),
        Math.round(w * 0.52 * (0.5 + Math.sin(t * 2.6) * 0.4)), 2, hue);
      if (o && o.emblem) drawEmblem(g, o.emblem, cx, y + Math.round(h * 0.78), u, hue);
    }
    return { y, w, h, top: y };
  }

  // ============================================================
  // HEADS - the face of the job. Returns the mouth line.
  // ============================================================
  function drawHead(g, kind, cx, neckY, hw, u, b, t, o) {
    const c = b.col, c2 = b.col2, hue = b.hue;
    const mood = o.mood || 'idle';
    let w = hw * 2, h = u(20);
    if (kind === 'small')   { w = hw * 1.2; h = u(14); }
    if (kind === 'narrowH') { w = hw * 1.2; h = u(24); }
    if (kind === 'bell')    { w = hw * 1.8; h = u(24); }
    if (kind === 'lamp')    { w = hw * 1.6; h = u(18); }
    if (kind === 'wedge')   { w = hw * 2.1; h = u(17); }
    if (kind === 'crt')     { w = hw * 2.1; h = u(20); }
    const y = neckY - h;

    // neck
    G.R(g, cx - u(4), neckY - 2, u(8), u(5), P.plateDk);
    G.R(g, cx - u(3), neckY - 1, u(6), u(3), P.plate);

    if (kind === 'bell') {
      for (let j = 0; j < h; j++) {
        const p = j / (h - 1);
        const hh = Math.round((w / 2) * (0.4 + 0.6 * Math.pow(p, 0.7)));
        G.R(g, cx - hh - 1, y + j, hh * 2 + 2, 1, OUT);
        G.R(g, cx - hh, y + j, hh * 2, 1, j < 2 ? G.shade(c, 0.3) : p > 0.86 ? G.shade(c, -0.38) : c);
      }
    } else if (kind === 'dome') {
      for (let j = 0; j < h; j++) {
        const p = j / (h - 1);
        const cap = p < 0.45 ? Math.sqrt(Math.max(0, 1 - Math.pow(1 - p / 0.45, 2))) : 1;
        const hh = Math.round((w / 2) * (0.42 + 0.58 * cap));
        G.R(g, cx - hh - 1, y + j, hh * 2 + 2, 1, OUT);
        G.R(g, cx - hh, y + j, hh * 2, 1, j < 2 ? G.shade(c, 0.32) : p > 0.88 ? G.shade(c, -0.36) : c);
      }
    } else if (kind === 'wedge') {
      for (let j = 0; j < h; j++) {
        const p = j / (h - 1);
        const hh = Math.round((w / 2) * (0.56 + 0.44 * p));
        G.R(g, cx - hh - 1, y + j, hh * 2 + 2, 1, OUT);
        G.R(g, cx - hh, y + j, hh * 2, 1, j < 2 ? G.shade(c, 0.3) : p > 0.86 ? G.shade(c, -0.38) : c);
      }
    } else {
      plate(g, cx - w / 2, y, w, h, c, { r: kind === 'crt' ? 3 : 2, band: 3 });
    }
    if (kind === 'crt') {
      plate(g, cx - w / 2 + 2, y + 2, w - 4, h - 7, '#0d1420', { r: 2, band: 1, spec: false });
      for (let j = y + 3; j < y + h - 6; j += 3) { g.globalAlpha = 0.14; G.R(g, cx - w / 2 + 3, j, w - 6, 1, hue); g.globalAlpha = 1; }
    }

    // ---- optics ----
    const single = kind === 'lamp';
    const eh = Math.max(4, Math.round(h * (single ? 0.52 : 0.42)));
    const ew = single ? Math.round(w * 0.5) : Math.max(4, Math.round(w * 0.3));
    const ey = y + Math.round(h * (kind === 'crt' ? 0.24 : 0.2));
    const blink = !o.noBlink && Math.sin(t * 1.1 + cx * 0.3) > 0.9975;
    if (single) {
      G.lens(g, cx - ew / 2, ey, ew, eh, { hue, closed: blink, dead: o.dead, slit: mood === 'angry',
        lookX: Math.sin(t * 0.6) * 0.25 });
    } else {
      const sp = Math.round(w * 0.23);
      for (const s of [-1, 1]) {
        G.lens(g, cx + s * sp - ew / 2, ey, ew, eh, { hue, closed: blink, dead: o.dead,
          slit: mood === 'angry', lookX: mood === 'angry' ? s * -0.3 : Math.sin(t * 0.6) * 0.25,
          lookY: mood === 'sick' ? 0.3 : 0 });
      }
      // brow shade for mood
      if (mood === 'angry' || mood === 'sick') {
        for (const s of [-1, 1]) {
          const bxx = cx + s * sp - ew / 2 - 1;
          for (let i = 0; i < ew + 2; i++) {
            const pr = i / (ew + 1) - 0.5;
            const bb = mood === 'angry' ? -s * 0.9 : s * 0.7;
            const yy = Math.max(y + 1, ey - 3 + Math.round(pr * bb * eh * 0.6));
            G.R(g, bxx + i, yy, 1, 2, OUT);
            G.R(g, bxx + i, yy, 1, 1, G.shade(c, 0.3));
          }
        }
      }
    }

    // ---- intake: a shuttered mouth that opens ----
    const my = y + Math.round(h * 0.7);
    const mw = Math.round(w * 0.62);
    const open = G.clamp(o.open || 0, 0, 1);
    const gape = Math.round(open * u(11));
    G.R(g, cx - mw / 2 - 1, my - 1, mw + 2, Math.max(3, gape + u(4)) + 2, OUT);
    if (gape > 1) {
      G.R(g, cx - mw / 2, my, mw, gape, '#150f1c');
      G.R(g, cx - mw / 2, my, mw, 1, '#2a1f34');
      // grille teeth top and bottom
      const nT = Math.max(3, Math.round(mw / Math.max(4, u(6))));
      const st = Math.max(2, Math.round(mw / nT));
      for (let i = 0; i < nT; i++) {
        G.R(g, cx - mw / 2 + i * st, my, Math.max(1, st - 1), Math.max(1, u(2)), P.hull);
        G.R(g, cx - mw / 2 + i * st, my + gape - Math.max(1, u(2)), Math.max(1, st - 1), Math.max(1, u(2)), P.hullDk);
      }
      if (gape > u(5)) {                                  // a lit feed belt down the throat
        const off = Math.floor((t * 16) % Math.max(2, u(4)));
        for (let i = 0; i < 5; i++) {
          const bxx = cx - mw * 0.3 + off + i * Math.max(2, u(4));
          if (bxx < cx + mw * 0.3) G.R(g, bxx, my + gape - u(3), 1, u(2), hue);
        }
      }
    } else {
      G.R(g, cx - mw / 2, my, mw, Math.max(2, u(3)), P.plateDk2);
      for (let i = 0; i < 4; i++) G.R(g, cx - mw / 2 + 1 + i * Math.max(2, Math.round(mw / 4)), my, 1, Math.max(2, u(3)), P.hullDk);
    }
    return { y, w, h, mouthY: my, gape, top: y };
  }

  // ============================================================
  // ARMS - the tool of the trade
  // ============================================================
  function drawArms(g, kind, cx, ty, tw, th, u, b, t, o) {
    const c = b.col2, hue = b.hue;
    const sway = Math.sin(t * 1.6) * u(1);
    const sy = ty + Math.round(th * 0.2);
    function limb(s, len, wd, col) {
      const x = cx + s * (tw / 2 + wd / 2 - 1);
      plate(g, x - wd / 2, sy, wd, len, col || c, { r: 1, band: 2, spec: false });
      G.R(g, x - wd / 2, sy + Math.round(len * 0.45), wd, 2, P.plateDk2);
      return { x, y: sy + len };
    }
    if (kind === 'heavy') {
      for (const s of [-1, 1]) {
        const e = limb(s, Math.round(th * 0.9) + sway * s, u(9));
        plate(g, e.x - u(6), e.y - u(2), u(12), u(9), P.plateDk, { r: 2, band: 2 });   // fist
        G.R(g, e.x - u(4), e.y + u(1), u(8), 1, hue);
      }
    } else if (kind === 'stub') {
      for (const s of [-1, 1]) {
        const e = limb(s, Math.round(th * 0.42), u(8));
        plate(g, e.x - u(4), e.y - 1, u(8), u(5), P.plateDk, { r: 1, band: 1, spec: false });
      }
    } else if (kind === 'many') {
      for (const s of [-1, 1]) for (let k = 0; k < 2; k++) {
        const e = limb(s, Math.round(th * (0.6 + k * 0.28)) + sway * s, u(4));
        if (k === 0) { plate(g, e.x - u(3), e.y, u(6), u(6), P.hull, { r: 1, band: 1, spec: false }); }
        else { G.R(g, e.x - 1, e.y, 2, u(7), P.hullLt); G.R(g, e.x - u(3), e.y + u(6), u(6), 2, P.hull); }
      }
    } else if (kind === 'drill') {
      limb(-1, Math.round(th * 0.7), u(7));
      const e = limb(1, Math.round(th * 0.5), u(9));
      // a conical bit
      for (let j = 0; j < u(13); j++) {
        const hw = Math.max(1, Math.round(u(5) * (1 - j / u(13))));
        G.R(g, e.x - hw - 1, e.y + j, hw * 2 + 2, 1, OUT);
        G.R(g, e.x - hw, e.y + j, hw * 2, 1, j % 3 ? P.hull : P.hullDk);
      }
    } else if (kind === 'bow') {
      limb(-1, Math.round(th * 0.62), u(5));
      const e = limb(1, Math.round(th * 0.5), u(5));
      const bx = e.x, by = e.y;
      G.line(g, bx - u(2), by, bx + u(16), by - u(9), '#4a2f18', 3);
      G.line(g, bx - u(1), by + 1, bx + u(15), by - u(8), '#e8dcc0', 1);
    } else if (kind === 'syringe') {
      limb(-1, Math.round(th * 0.6), u(5));
      const e = limb(1, Math.round(th * 0.46), u(6));
      plate(g, e.x - u(3), e.y, u(6), u(10), '#e8f4ff', { r: 1, band: 1 });
      G.R(g, e.x - u(2), e.y + u(2), u(4), u(5), hue);
      G.R(g, e.x - 1, e.y + u(10), 2, u(5), P.hullLt);
    } else if (kind === 'baton') {
      limb(-1, Math.round(th * 0.6), u(6));
      const e = limb(1, Math.round(th * 0.46), u(6));
      plate(g, e.x - u(2), e.y, u(4), u(14), '#22283a', { r: 1, band: 1, spec: false });
      G.R(g, e.x - u(2), e.y + u(12), u(4), 2, hue);
    } else if (kind === 'gavel') {
      limb(-1, Math.round(th * 0.6), u(6));
      const e = limb(1, Math.round(th * 0.44), u(6));
      G.R(g, e.x - 1, e.y, 2, u(8), '#6b4a22');
      plate(g, e.x - u(6), e.y + u(6), u(12), u(6), '#8a5a28', { r: 1, band: 1 });
    } else if (kind === 'stamp') {
      limb(-1, Math.round(th * 0.58), u(5));
      const e = limb(1, Math.round(th * 0.42), u(5));
      G.R(g, e.x - 1, e.y, 2, u(6), P.hullDk);
      plate(g, e.x - u(5), e.y + u(5), u(10), u(5), '#2a2a38', { r: 1, band: 1, spec: false });
      G.R(g, e.x - u(4), e.y + u(9), u(8), 1, '#c02020');
    } else if (kind === 'rifle') {
      limb(-1, Math.round(th * 0.6), u(6));
      const e = limb(1, Math.round(th * 0.4), u(6));
      G.R(g, e.x - u(2), e.y, u(4), u(4), P.plateDk);
      G.R(g, e.x - u(1), e.y - u(12), u(3), u(16), '#26262e');
      G.R(g, e.x - u(1), e.y - u(12), 1, u(16), P.hullDk);
      G.R(g, e.x - u(4), e.y + u(2), u(8), u(3), '#3a3a46');
    } else if (kind === 'claw') {
      limb(-1, Math.round(th * 0.7), u(5));
      const e = limb(1, Math.round(th * 0.55), u(6));
      for (const d of [-1, 1]) {
        G.R(g, e.x + d * u(3) - 1, e.y, 2, u(7), P.hull);
        G.R(g, e.x + d * u(4) - 1, e.y + u(6), 2, u(3), P.hullLt);
      }
    } else if (kind === 'can') {
      limb(-1, Math.round(th * 0.6), u(5));
      const e = limb(1, Math.round(th * 0.44), u(6));
      plate(g, e.x - u(5), e.y, u(10), u(8), '#4a6b8a', { r: 1, band: 1 });
      G.R(g, e.x + u(4), e.y + u(1), u(6), 2, '#4a6b8a');
      for (let i = 0; i < 3; i++) G.R(g, e.x + u(9) + i, e.y + u(3) + i * 2, 1, 1, '#7adcf4');
    } else {                                             // slim
      for (const s of [-1, 1]) {
        const e = limb(s, Math.round(th * 0.72) + sway * s, u(5));
        plate(g, e.x - u(3), e.y, u(6), u(6), P.hull, { r: 1, band: 1, spec: false });
      }
    }
  }

  // ============================================================
  // PROPS - the last touch of personality
  // ============================================================
  function drawProp(g, kind, cx, hd, u, b, t) {
    const hue = b.hue, c = b.col;
    const top = hd.y, w = hd.w;
    if (kind === 'cannon') {
      G.R(g, cx + w * 0.3, top - u(3), u(20), u(6), OUT);
      G.R(g, cx + w * 0.3, top - u(2), u(19), u(4), P.plateDk);
      G.R(g, cx + w * 0.3, top - u(2), u(19), 1, P.plate);
      G.R(g, cx + w * 0.3 + u(17), top - u(3), u(4), u(6), P.hullDk);
    } else if (kind === 'apron') {
      const ay = top + hd.h + u(5);
      G.R(g, cx - u(3), ay - u(3), u(6), u(4), '#f8f8f2');            // bib strap
      G.rr2(g, cx - u(9), ay, u(18), u(15), '#c8c8c0');
      G.rr2(g, cx - u(8), ay, u(16), u(14), '#f8f8f2');
      G.R(g, cx - u(8), ay + 1, u(16), 1, '#ffffff');
      G.R(g, cx - u(10), ay + u(9), u(20), u(3), '#e0e0d8');           // waist tie
      G.R(g, cx - u(10), ay + u(9), u(20), 1, '#ffffff');
      for (let i = 0; i < 5; i++) G.R(g, cx - u(8) + i * u(4), ay + u(13), u(3), 2, '#e8e8e0'); // frill
      G.R(g, cx + u(6), ay + u(9), u(5), u(6), '#e0e0d8');             // a duster tucked in
      for (let i = 0; i < 4; i++) G.R(g, cx + u(7) + i, ay + u(15) + i, 2, 2, '#d8c48a');
    } else if (kind === 'tophat') {
      G.R(g, cx - u(13), top - u(2), u(26), u(3), OUT);
      G.R(g, cx - u(12), top - u(1), u(24), 2, '#1a1a22');
      plate(g, cx - u(8), top - u(13), u(16), u(12), '#1a1a22', { r: 1, band: 2, spec: false });
      G.R(g, cx - u(8), top - u(5), u(16), 2, '#5c2030');
    } else if (kind === 'siren') {
      const on = Math.sin(t * 7) > 0;
      G.R(g, cx - u(6), top - u(5), u(12), u(5), P.plateDk);
      G.R(g, cx - u(5), top - u(4), u(5), u(3), on ? '#ff3a4a' : '#5c1a22');
      G.R(g, cx + 0, top - u(4), u(5), u(3), on ? '#2a6aff' : '#1a2a5c');
      if (on) G.glow(g, cx, top - u(3), u(16), u(9), '#ff3a6a', 1);
    } else if (kind === 'funnel') {
      for (let j = 0; j < u(9); j++) {
        const hw = Math.round(u(11) * (1 - j / u(11)));
        G.R(g, cx - hw - 1, top - u(9) + j, hw * 2 + 2, 1, OUT);
        G.R(g, cx - hw, top - u(9) + j, hw * 2, 1, j < 2 ? P.hullLt : P.hull);
      }
    } else if (kind === 'swirl') {
      // dispenser collar, then three tapering coils and a tip
      G.R(g, cx - u(9), top - u(3), u(18), u(4), OUT);
      G.R(g, cx - u(8), top - u(2), u(16), u(2), P.steel);
      G.R(g, cx - u(8), top - u(2), u(16), 1, P.steel2);
      const coil = [[u(8), u(4)], [u(6), u(3)], [u(4), u(3)]];
      let sy = top - u(4);
      for (let i = 0; i < coil.length; i++) {
        const hw = coil[i][0], hh = coil[i][1];
        const off = (i % 2 ? 1 : -1) * u(1);
        for (let j = 0; j < hh; j++) {
          const p = j / Math.max(1, hh - 1);
          const ww = Math.round(hw * (1 - p * 0.18));
          G.R(g, cx + off - ww - 1, sy - hh + j, ww * 2 + 2, 1, OUT);
          G.R(g, cx + off - ww, sy - hh + j, ww * 2, 1,
            j === 0 ? '#fffaea' : p > 0.72 ? '#c8bc98' : '#f2e6c2');
        }
        sy -= hh;
      }
      G.R(g, cx - u(1), sy - u(3), u(2), u(3), '#f2e6c2');
      G.R(g, cx - u(1), sy - u(3), u(2), 1, '#fffaea');
    } else if (kind === 'scroll') {
      G.R(g, cx - 1, top - u(9), 2, u(10), '#4a2f18');
      for (let i = 0; i < 4; i++) G.R(g, cx - u(3) + i * 2, top - u(8), 1, u(4), '#e8dcc0');
      G.R(g, cx - u(3), top - u(11), u(6), u(3), '#6b4a28');
    } else if (kind === 'toque') {
      for (let j = 0; j < u(11); j++) {
        const p = j / u(11);
        const hw = Math.round(u(10) * (0.62 + 0.38 * Math.sin(p * Math.PI)));
        G.R(g, cx - hw - 1, top - u(11) + j, hw * 2 + 2, 1, OUT);
        G.R(g, cx - hw, top - u(11) + j, hw * 2, 1, j < 2 ? '#ffffff' : '#e0e0d8');
      }
      G.R(g, cx - u(9), top - u(2), u(18), u(3), '#f8f8f0');
    } else if (kind === 'cross') {
      G.R(g, cx - u(6), top + hd.h + u(8), u(12), u(12), '#ffffff');
      G.R(g, cx - u(5), top + hd.h + u(11), u(10), u(4), '#e02030');
      G.R(g, cx - u(2), top + hd.h + u(9), u(4), u(10), '#e02030');
    } else if (kind === 'wig') {
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
        G.R(g, cx + s * (u(7) + k * 2) - 1, top + u(2) + k * u(3), u(4), u(6), '#e8e4dc');
        G.R(g, cx + s * (u(7) + k * 2) - 1, top + u(2) + k * u(3), u(4), 1, '#ffffff');
      }
      G.R(g, cx - u(9), top - u(3), u(18), u(5), '#f0ece4');
      G.R(g, cx - u(9), top - u(3), u(18), 1, '#ffffff');
    } else if (kind === 'halo') {
      const hy = top - u(7);
      G.rr(g, cx - u(10), hy, u(20), u(4), G.shade(hue, -0.3));
      G.rr(g, cx - u(9), hy + 1, u(18), 2, hue);
      G.glow(g, cx, hy + 2, u(26), u(9), hue, 1.1);
    } else if (kind === 'phones') {
      for (const s of [-1, 1]) plate(g, cx + s * (w / 2 - u(1)) - u(3), top + u(4), u(6), u(9), '#22222c', { r: 1, band: 1, spec: false });
      G.rr(g, cx - w / 2 - u(1), top - u(3), w + u(2), u(4), '#22222c');
      for (const s of [-1, 1]) G.R(g, cx + s * (w / 2 - u(1)) - u(2), top + u(6), u(4), 2, hue);
    } else if (kind === 'specs') {
      for (const s of [-1, 1]) {
        G.rr2(g, cx + s * u(6) - u(5), top + u(5), u(10), u(8), '#d8dce4');
        G.rr2(g, cx + s * u(6) - u(4), top + u(6), u(8), u(6), '#0d1420');
      }
      G.R(g, cx - u(2), top + u(8), u(4), 1, '#d8dce4');
    } else if (kind === 'webbing') {
      G.R(g, cx - u(10), top + hd.h + u(9), u(20), u(4), '#3a3f2a');
      for (let i = 0; i < 3; i++) plate(g, cx - u(8) + i * u(7), top + hd.h + u(8), u(5), u(6), '#4a5236', { r: 1, band: 1, spec: false });
    } else if (kind === 'aerial') {
      G.R(g, cx + u(5), top - u(11), 2, u(12), OUT);
      G.R(g, cx + u(5), top - u(11), 1, u(12), P.hull);
      G.R(g, cx + u(4), top - u(13), 4, 3, hue);
      G.glow(g, cx + u(6), top - u(12), 6, 6, hue, 0.9);
    } else if (kind === 'moss') {
      for (let i = 0; i < 7; i++) {
        const mx = cx - w / 2 + Math.round(G.hash(i * 3.7, 2) * w);
        G.R(g, mx, top + Math.round(G.hash(i * 5.1, 6) * hd.h * 0.7), 3, 2, i % 2 ? '#4a8a3a' : '#6bb04a');
      }
      G.R(g, cx + u(4), top - u(4), 2, u(5), '#4a8a3a');
      G.R(g, cx + u(3), top - u(6), 4, 3, '#ff8ac0');
    } else if (kind === 'helmetPlume') {
      G.R(g, cx - 1, top - u(8), 2, u(8), P.hullDk);
      G.R(g, cx - u(2), top - u(11), u(4), u(4), hue);
    } else if (kind === 'shackle') {
      for (const s of [-1, 1]) {
        G.rr2(g, cx + s * (w / 2 + u(3)) - u(4), top + hd.h + u(12), u(8), u(8), P.hullDk);
        G.rr2(g, cx + s * (w / 2 + u(3)) - u(3), top + hd.h + u(13), u(6), u(6), P.cityDk);
      }
      G.R(g, cx - w / 2 - u(2), top + hd.h + u(15), w + u(4), 2, P.hullDk);
    } else if (kind === 'cigar') {
      G.R(g, cx + u(5), hd.mouthY + u(1), u(9), 2, '#5c3a1a');
      G.R(g, cx + u(13), hd.mouthY + u(1), 2, 2, Math.sin(t * 5) > 0 ? '#ff8a3a' : '#c04a10');
      for (let i = 0; i < 3; i++)
        G.R(g, cx + u(14) + i * 2, hd.mouthY - u(2) - i * 2 + Math.round(Math.sin(t * 2 + i) * 1.5), 2, 1, '#6b6b7a');
    }
  }

  // ============================================================
  // THE WHOLE MACHINE
  // o: {t, open, mood, walk, dead, scale, sprinkled, shellBits, shellCoat}
  // ============================================================
  G.drawBot = function (g, id, cx, footY, scale, o) {
    o = o || {};
    const S = scale || 1;
    const u = (v) => Math.max(1, Math.round(v * S));
    const b = G.botById(id), fr = G.frameOf(id);
    const t = o.t || 0, walk = o.walk === undefined ? t : o.walk;
    cx = Math.round(cx); footY = Math.round(footY);
    const bw = Math.round(u(30) * fr.w);

    // ground shadow
    g.globalAlpha = 0.3;
    G.rr(g, cx - bw * 0.6, footY - 2, bw * 1.2, 4, '#000000');
    g.globalAlpha = 1;

    const base = drawBase(g, fr.base, cx, footY, bw, u, b, t, walk);
    const torso = drawTorso(g, fr.torso, cx, base.top + 1, bw, u, b, t, { emblem: fr.emblem });
    drawArms(g, fr.arms, cx, torso.y, torso.w, torso.h, u, b, t, o);
    const hw = Math.round(u(11) * fr.hs);
    const hd = drawHead(g, fr.head, cx, torso.y + 1, hw, u, b, t, o);
    drawProp(g, fr.prop, cx, hd, u, b, t);
    if (fr.head === 'helmet') {
      // a real helmet shell over the boxy head
      G.rr2(g, cx - hd.w / 2 - 2, hd.y - u(3), hd.w + 4, u(9), OUT);
      G.rr2(g, cx - hd.w / 2 - 1, hd.y - u(2), hd.w + 2, u(7), b.col2);
      G.R(g, cx - hd.w / 2, hd.y - u(1), hd.w, 1, G.shade(b.col2, 0.35));
      G.R(g, cx - hd.w / 2 - 3, hd.y + u(4), hd.w + 6, u(2), G.shade(b.col2, -0.3));
    }

    // what got shaken over it stays on it
    if (o.shellBits) for (const s of o.shellBits) G.R(g, s.x, s.y, 2, 2, s.col);
    if (o.shellCoat) for (const s of o.shellCoat) G.R(g, s.x, s.y, 2, 2, s.col);

    return { cx, headTop: hd.y, headY: hd.y + hd.h / 2, mouthY: hd.mouthY, gape: hd.gape,
             hw: Math.round(Math.max(hd.w / 2, torso.w / 2)), top: Math.min(hd.y - u(12), hd.y),
             torsoY: torso.y, torsoW: torso.w, torsoH: torso.h, hue: b.hue };
  };

  // ------------------------------------------------------------
  // GOOEY ICE CREAM. Thick, wet, slow. A scoop is a hard-shaded
  // ball with sagging drip lobes and stretched strands that follow
  // the tool when you lift it.
  // ------------------------------------------------------------
  G.gooScoop = function (g, cx, cy, r, flav, o) {
    o = o || {};
    if (!flav) return;
    const c = flav.col;
    const tone = [G.shade(c, 0.62), G.shade(c, 0.3), c, G.shade(c, -0.26), G.shade(c, -0.48)];
    const sq = 1 + (o.squash || 0);
    const rx = Math.max(2, Math.round(r * sq)), ry = Math.max(2, Math.round(r / sq));
    cx = Math.round(cx); cy = Math.round(cy);
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
      for (let k = 1; k <= n2; k++)
        if (k === n2 || tn[k] !== tn[k0]) { G.R(g, cx - hw + k0, yy, k - k0, 1, tone[tn[k0]]); k0 = k; }
    }
    // goo: sagging lobes off the underside, longer the gooier the mix
    const goo = G.clamp((flav.goo || 0) / 4, 0.25, 1.6);
    const lobes = rx > 7 ? 3 : 2;
    for (let i = 0; i < lobes; i++) {
      const nx = ((i + 0.5) / lobes * 2 - 1) * 0.7;
      const lx = cx + Math.round(nx * rx);
      const ly = cy + Math.round(ry * Math.sqrt(Math.max(0, 1 - nx * nx)));
      const lh = Math.round((3 + ((i + cx) % 3)) * goo);
      for (let j = 0; j < lh; j++) {
        const hw = Math.max(1, Math.round(3 * (1 - j / (lh + 1))));
        G.R(g, lx - hw - 1, ly + j, hw * 2 + 2, 1, OUT);
        G.R(g, lx - hw, ly + j, hw * 2, 1, j > lh - 2 ? tone[4] : tone[3]);
      }
      if (lh > 3) G.R(g, lx - 1, ly + lh, 2, 2, tone[4]);
    }
    // one hard wet highlight and a churned ridge
    G.R(g, cx - Math.round(rx * 0.5), cy - Math.round(ry * 0.56),
      Math.max(2, Math.round(rx * 0.34)), Math.max(1, Math.round(ry * 0.2)), '#ffffff');
    for (let i = -rx + 2; i < rx - 2; i++) {
      const nx = i / rx;
      if (Math.abs(nx) > 0.82) continue;
      G.R(g, cx + i, cy + Math.round(ry * 0.16 + Math.sin(nx * 2.2) * ry * 0.22), 1, 1, tone[3]);
    }
    if (flav.fleck) for (let i = 0; i < 5; i++)
      G.R(g, cx - Math.round(rx * 0.55) + ((i * 7) % Math.max(1, rx)), cy - Math.round(ry * 0.3) + ((i * 5) % Math.max(1, ry)), 2, 2, flav.fleck);
  };

  // a stretched strand of ice cream between two points
  G.gooStrand = function (g, x0, y0, x1, y1, col, thick) {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 2));
    for (let i = 0; i <= n; i++) {
      const p = i / n;
      const w = Math.max(1, Math.round(thick * (1 - Math.abs(p - 0.5) * 1.1)));
      const sag = Math.sin(p * Math.PI) * thick * 0.6;
      const x = G.lerp(x0, x1, p), y = G.lerp(y0, y1, p) + sag;
      G.R(g, Math.round(x - w / 2) - 1, Math.round(y), w + 2, 1, OUT);
      G.R(g, Math.round(x - w / 2), Math.round(y), w, 1, col);
    }
  };

  // a waffle cone, point down
  G.cone = function (g, x, baseY, o) {
    o = o || {};
    const cw = o.w || 20, ch = o.h || 24;
    x = Math.round(x); baseY = Math.round(baseY);
    for (let i = 0; i < ch; i++) {
      const p = i / (ch - 1);
      const hw = Math.max(1, Math.round((cw / 2) * (0.16 + 0.84 * p)));
      const yy = baseY - i;
      G.R(g, x - hw - 1, yy, hw * 2 + 2, 1, OUT);
      G.R(g, x - hw, yy, hw * 2, 1, G.mix('#8a5620', '#d09a44', p));
      G.R(g, x - hw, yy, 1, 1, '#e8b45c');
      if (i % 4 === 1 && hw > 2) G.R(g, x - hw + 1, yy, hw * 2 - 2, 1, '#6b3d12');
    }
    const rimY = baseY - ch;
    G.rr(g, x - cw / 2 - 1, rimY - 3, cw + 2, 5, OUT);
    plate(g, x - cw / 2, rimY - 2, cw, 4, '#e8c47a', { r: 1, band: 1 });
    return rimY - 2;
  };

  // a paper cup
  G.cup = function (g, x, baseY, o) {
    o = o || {};
    const cw = o.w || 22, ch = o.h || 16;
    x = Math.round(x); baseY = Math.round(baseY);
    for (let i = 0; i < ch; i++) {
      const p = i / (ch - 1);
      const hw = Math.round((cw / 2) * (0.72 + 0.28 * p));
      const yy = baseY - i;
      G.R(g, x - hw - 1, yy, hw * 2 + 2, 1, OUT);
      G.R(g, x - hw, yy, hw * 2, 1, i < 2 ? '#c8ccd8' : '#e8ecf4');
    }
    G.R(g, x - cw / 2, baseY - ch, cw, 2, '#f8fafe');
    return baseY - ch;
  };
})();

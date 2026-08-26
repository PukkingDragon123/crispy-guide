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
    const hot = G.shade(c, 0.55);
    const r = o.r === undefined ? 2 : o.r;
    G.rr2(g, x - 1, y - 1, w + 2, h + 2, OUT);
    if (r >= 2) G.rr2(g, x, y, w, h, c); else G.R(g, x, y, w, h, c);
    const band = Math.max(1, Math.min(Math.round(h * 0.28), o.band || 3));
    G.R(g, x + 1, y, w - 2, band, lit);                 // top light
    G.R(g, x + 1, y + h - band - 1, w - 2, band + 1, dk); // bottom shade
    G.R(g, x + 1, y + h - 1, w - 2, 1, dk2);            // contact edge
    if (o.side !== false) G.R(g, x + w - 2, y + 1, 1, h - 2, dk);

    // ---- the fine tier: single native pixels on the half grid ----
    if (w > 3 && h > 3) {
      G.hair(g, x + 1, y, w - 2, hot);                            // hot top edge
      G.hair(g, x + 1, y + band, w - 2, G.shade(c, -0.16));       // seam under the light band
      G.vair(g, x + 1, y + 1, h - 2, G.shade(c, 0.16));           // left edge catch
      G.hair(g, x + 1, y + h - band - 1, w - 2, G.shade(c, -0.5));// seam over the shade band
    }
    if (o.grain) G.grain(g, x + 1, y + band, w - 2, Math.max(1, h - band - 2), dk2, 0.09, o.grain);
    if (o.wear !== false && w > 7 && h > 5) G.wear(g, x + 1, y + h - 1.5, w - 2, dk2, w + h, 0.22);
    if (o.spec !== false && w > 5 && h > 4) {
      G.R(g, x + 2, y + 1, Math.max(1, Math.round(w * 0.3)), 1, '#ffffff');
      G.hair(g, x + 2, y + 0.5, Math.max(1, Math.round(w * 0.42)), '#ffffff');
    }
    if (o.rivets && w > 10) for (let i = 0; i < 2; i++)
      G.rivet(g, x + 2 + i * (w - 6), y + Math.round(h * 0.5), dk2, hot);
    // a row of fasteners along the top, the classic "built" read
    if (o.bolts && w > 14) {
      const n = Math.max(2, Math.min(9, Math.floor((w - 6) / 4)));
      for (let i = 0; i < n; i++) G.rivet(g, x + 3 + i * ((w - 7) / (n - 1)), y + band + 1, dk2, hot);
    }
    // louvred vent slots, cut into the lower half
    if (o.vent && w > 12 && h > 9) {
      const vw = Math.min(w - 8, Math.round(w * 0.5)), vx = x + Math.round((w - vw) / 2);
      for (let i = 0; i < 3; i++) {
        const vy = y + h - band - 2 - i * 2;
        G.Rh(g, vx, vy, vw, 1, dk2);
        G.hair(g, vx, vy + 1, vw, G.shade(c, 0.2));
      }
    }
    // hazard chevrons, for the heavy chassis
    if (o.hazard && w > 12) {
      for (let i = 0; i < Math.floor(w / 4); i++) {
        G.Rh(g, x + 2 + i * 4, y + h - band - 1.5, 2, 1, i % 2 ? '#12141c' : P.hazard);
      }
    }
    if (o.notch && w > 8 && h > 8) {
      G.notch(g, x + 1, y + 1, 2, hot);
      G.notch(g, x + w - 3, y + h - 3, 2, dk2);
    }
  }
  G.plate = plate;

  // a stencilled unit marking - three tiny bars and a block, reads as
  // a serial at any size without needing the font
  function stencil(g, x, y, col) {
    G.Rh(g, x, y, 1, 0.5, col);
    G.Rh(g, x + 1.5, y, 0.5, 1.5, col);
    G.Rh(g, x + 2.5, y, 1, 1.5, col);
    G.Rh(g, x, y + 1, 1, 0.5, col);
  }
  G.stencil = stencil;

  // a cable loom: a slack catenary of two tones
  function loom(g, x0, y0, x1, y1, sag, col, lit) {
    const n = Math.max(4, Math.round(Math.abs(x1 - x0) * 2));
    for (let i = 0; i <= n; i++) {
      const p = i / n;
      const px = x0 + (x1 - x0) * p;
      const py = y0 + (y1 - y0) * p + Math.sin(p * Math.PI) * sag;
      G.Rh(g, px, py, 0.5, 1, col);
      if (lit) G.Rh(g, px, py, 0.5, 0.5, lit);
    }
  }
  G.loom = loom;

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
    // machined bezel: a bright rim hair on the upper left, dark on the
    // lower right, and a ring of tiny screws on anything big enough
    for (let j = 0; j < h; j++) {
      const hw = rows[j];
      G.Rh(g, cx - hw, y + j, 0.5, 0.5, j < h * 0.5 ? '#e8f0ff' : P.hullDk);
      G.Rh(g, cx + hw - 0.5, y + j + 0.5, 0.5, 0.5, j < h * 0.5 ? P.hull : '#0f1218');
    }
    if (w >= 9) for (let k = 0; k < 4; k++) {
      const a = Math.PI * 0.25 + k * Math.PI * 0.5;
      G.Rh(g, cx + Math.cos(a) * (w * 0.42) - 0.25, cy + Math.sin(a) * (h * 0.42) - 0.25, 0.5, 0.5, '#0f1218');
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
    // radial iris texture: fine spokes off the pupil
    if (ir >= 7) for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4 + 0.4;
      const r0 = ir * 0.3, r1 = ir * 0.46;
      for (let rr = r0; rr < r1; rr += 0.5)
        G.Rh(g, ix + Math.cos(a) * rr - 0.25, iy + Math.sin(a) * rr - 0.25, 0.5, 0.5, G.shade(hue, 0.5));
    }
    if (w > 6) G.R(g, Math.round(cx - rows[1] * 0.6), y + 1, 1, 1, '#ffffff');
    // a bounce catch-light at the lower right, one native pixel
    if (w >= 8) G.Rh(g, cx + w * 0.2, cy + h * 0.24, 0.5, 0.5, G.shade(hue, 0.75));
    // the scan line crossing the glass
    if (w >= 10 && !o.noScan) {
      const sy = y + 1 + ((o.t || 0) * 9 % (h - 2));
      g.globalAlpha = 0.5;
      const j = G.clamp(Math.floor(sy - y), 0, h - 1);
      G.Rh(g, cx - rows[j] + 0.5, sy, rows[j] * 2 - 1, 0.5, '#ffffff');
      g.globalAlpha = 1;
    }
    if (!o.noGlow) G.glow(g, cx, cy, w * 0.9, h * 0.9, hue, 0.7);
  };

  // ============================================================
  // BASES - how it stands
  // ============================================================
  function drawBase(g, kind, cx, footY, bw, u, b, t, walk) {
    const c = b.col, c2 = b.col2, hue = b.hue;
    if (kind === 'tread') {
      const w = Math.round(bw * 1.06), h = u(11);
      plate(g, cx - w / 2, footY - h, w, h, c2, { r: 2, band: 2, hazard: 1, grain: 3 });
      // road wheels with hubs, plus a drive sprocket at each end
      const off = (walk * 20) % Math.max(2, u(5));
      for (let i = 0; i < 5; i++) {
        const wx = cx - w / 2 + u(3) + i * ((w - u(6)) / 4);
        G.R(g, wx - 2, footY - h + u(3), 4, h - u(5), P.plateDk2);
        G.rivet(g, wx - 0.5, footY - h / 2 - 0.5, '#0b0e14', P.hullLt);
      }
      for (const s of [-1, 1]) {
        const sx = cx + s * (w / 2 - u(3));
        G.fc(g, sx, footY - h / 2, u(3.4), P.plateDk);
        G.oc(g, sx, footY - h / 2, u(3.4), '#0b0e14');
        for (let k = 0; k < 6; k++) {
          const a = walk * 4 * s + k * Math.PI / 3;
          G.Rh(g, sx + Math.cos(a) * u(3) - 0.5, footY - h / 2 + Math.sin(a) * u(3) - 0.5, 1, 1, P.hullLt);
        }
      }
      // the track: link plates top and bottom, with a lit edge
      for (let k = 0; k < w; k += Math.max(3, u(5))) {
        const lx = cx - w / 2 + ((k + off) % w);
        G.R(g, lx, footY - h, 2, 2, P.hullDk);
        G.hair(g, lx, footY - h, 2, P.hull);
        G.R(g, lx, footY - 3, 2, 2, P.hullDk);
        G.hair(g, lx, footY - 3, 2, P.hull);
      }
      G.R(g, cx - w / 2 + 2, footY - 2, w - 4, 2, P.plateDk2);
      G.hair(g, cx - w / 2 + 2, footY - 2, w - 4, P.plateDk);
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
        // pleat lines, fanning out with the flare
        if (j > 3) for (let k = -3; k <= 3; k++)
          G.vair(g, cx + k * (hw / 3.4), footY - h + j, 1, G.shade(c, k % 2 ? -0.3 : 0.16));
      }
      // hem: a dark band with a lit lip, and toes peeking out
      G.Rh(g, cx - Math.round(w * 0.46), footY - 3, Math.round(w * 0.92), 2, G.shade(c, -0.5));
      G.hair(g, cx - Math.round(w * 0.46), footY - 3, Math.round(w * 0.92), G.shade(c, 0.2));
      G.R(g, cx - Math.round(w * 0.4), footY - 2, Math.round(w * 0.8), 2, P.plateDk2);
      for (const s of [-1, 1]) G.Rh(g, cx + s * u(5) - 1.5, footY - 2, 3, 2, P.hull);
      return { top: footY - h, w };
    }
    if (kind === 'plinth') {
      const w = Math.round(bw * 1.0), h = u(9);
      plate(g, cx - w / 2, footY - h, w, h, P.plateDk, { r: 1, band: 2, bolts: 1, grain: 5 });
      G.R(g, cx - w / 2 + 2, footY - h + 2, w - 4, 1, hue);
      G.glow(g, cx, footY - h + 2, w, 5, hue, 0.5);
      // stepped base course with a lit nose
      plate(g, cx - w / 2 - 2, footY - 4, w + 4, 4, P.plate, { r: 1, band: 1, spec: false });
      G.hair(g, cx - w / 2 - 2, footY - 4, w + 4, P.chrome);
      G.Rh(g, cx - w / 2 - 3, footY - 1.5, w + 6, 1.5, '#0b0e14');
      // fluting
      for (let i = 0; i < 6; i++)
        G.vseam(g, cx - w / 2 + 3 + i * ((w - 6) / 5), footY - h + 3, h - 4, '#0b0e14', P.steel);
      return { top: footY - h, w };
    }
    // legs: two piston columns with a stride
    const sw = Math.sin(walk * 6) * u(2);
    const lw = Math.max(3, u(7)), lh = u(17);
    for (const s of [-1, 1]) {
      const lx = cx + s * Math.round(bw * 0.24) - lw / 2;
      const ly = footY - lh + (s < 0 ? sw : -sw);
      const kny = ly + Math.round(lh * 0.4);
      plate(g, lx, ly, lw, lh - Math.abs(sw), c2, { r: 1, band: 2, spec: false });
      // knee: a hinge block with a lit pin and a shin plate below
      G.R(g, lx - 1, kny, lw + 2, 3, P.plateDk2);
      G.hair(g, lx - 1, kny, lw + 2, G.shade(c2, 0.3));
      G.rivet(g, lx + lw / 2 - 0.5, kny + 0.5, '#0b0e14', P.hullLt);
      G.vseam(g, lx + lw / 2, kny + 3, lh * 0.5, G.shade(c2, -0.5), G.shade(c2, 0.2));
      // ankle piston
      G.Rh(g, lx + lw - 1, kny + 3, 1, lh * 0.4, P.hullDk);
      G.vair(g, lx + lw - 1, kny + 3, lh * 0.4, P.hullLt);
      // foot: pad, toe cap, tread
      const fy = footY - 4 + (s < 0 ? sw : -sw);
      plate(g, lx - 2, fy, lw + 4, 4, P.plateDk, { r: 1, band: 1, spec: false });
      G.Rh(g, lx - 2, fy + 3, lw + 4, 1, '#0b0e14');
      for (let i = 0; i < 3; i++) G.Rh(g, lx - 1 + i * ((lw + 2) / 3), fy + 2.5, 1.5, 1, P.hullDk);
      G.Rh(g, lx + (s > 0 ? lw - 1 : -2), fy - 1, 3, 2, P.hull);
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

  // A chest that reads as machinery: a recessed housing, a louvred
  // radiator, a live power bar, a serial stencil and warning tags.
  function chestRig(g, cx, y, w, h, u, b, t) {
    const c = b.col, hue = b.hue;
    const pw = Math.round(w * 0.62), ph = Math.round(h * 0.38);
    const px = cx - pw / 2, py = y + Math.round(h * 0.3);
    // keyed off the chassis so a dark unit does not read as a hole
    const hbase = G.mix(c, '#242a38', 0.55);
    G.R(g, px - 1, py - 1, pw + 2, ph + 2, G.shade(c, -0.66));
    G.R(g, px, py, pw, ph, hbase);
    G.bevel(g, px, py, pw, ph, G.shade(hbase, -0.5), G.shade(hbase, 0.4));
    // radiator fins
    for (let i = 0; i * 2 < ph - 3; i++) {
      G.Rh(g, px + 1.5, py + 1.5 + i * 2, pw - 3, 1, G.shade(hbase, -0.3));
      G.hair(g, px + 1.5, py + 1.5 + i * 2, pw - 3, G.shade(hbase, 0.34));
    }
    // the power bar, alive
    const bw2 = Math.max(2, Math.round((pw - 4) * (0.5 + Math.sin(t * 2.6) * 0.4)));
    G.R(g, px + 2, py + ph - 3, bw2, 2, hue);
    G.hair(g, px + 2, py + ph - 3, bw2, G.shade(hue, 0.6));
    G.glow(g, px + 2 + bw2 / 2, py + ph - 2, bw2 + 4, 5, hue, 0.5);
    // fasteners around the housing
    G.rivetRow(g, px - 0.5, py - 0.5, Math.max(2, Math.floor(pw / 5)), 5, '#0b0e14', G.shade(c, 0.5));
    G.rivetRow(g, px - 0.5, py + ph - 0.5, Math.max(2, Math.floor(pw / 5)), 5, '#0b0e14', G.shade(c, 0.5));
    // a warning tag and a serial, stencilled
    G.Rh(g, cx - w / 2 + 2, y + h - u(6), 3, 2, P.hazard);
    G.Rh(g, cx - w / 2 + 2.5, y + h - u(6) + 0.5, 2, 1, '#12141c');
    G.stencil(g, cx + w / 2 - 6, y + h - u(6), G.shade(c, -0.55));
    // side ribs
    for (let i = 0; i < 3; i++) {
      G.Rh(g, cx - w / 2 + 1.5, y + h * 0.34 + i * 3, u(3), 1, G.shade(c, -0.44));
      G.hair(g, cx - w / 2 + 1.5, y + h * 0.34 + i * 3 + 1, u(3), G.shade(c, 0.16));
      G.Rh(g, cx + w / 2 - u(3) - 1.5, y + h * 0.34 + i * 3, u(3), 1, G.shade(c, -0.44));
      G.hair(g, cx + w / 2 - u(3) - 1.5, y + h * 0.34 + i * 3 + 1, u(3), G.shade(c, 0.16));
    }
  }
  G.chestRig = chestRig;

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
      // hoop bands, each with a lit crown, a shadow and riveted laps
      for (let k = 1; k < 4; k++) {
        const j = Math.round(h * k / 4), p = j / (h - 1);
        const hw = Math.round((w / 2) * (Math.sin(p * Math.PI) * 0.22 + 0.78));
        G.R(g, cx - hw, y + j, hw * 2, 2, G.shade(c, -0.3));
        G.hair(g, cx - hw, y + j, hw * 2, G.shade(c, 0.34));
        G.hair(g, cx - hw, y + j + 2, hw * 2, G.shade(c, -0.55));
        for (let i = 0; i < 4; i++)
          G.rivet(g, cx - hw + 1 + i * ((hw * 2 - 3) / 3), y + j + 0.5, G.shade(c, -0.6), G.shade(c, 0.5));
      }
      // vertical weld seam down the belly
      G.vseam(g, cx + u(4), y + 2, h - 4, G.shade(c, -0.5), G.shade(c, 0.2));
      // a full-belly gauge in a machined bezel
      const gx = cx - u(9), gy = y + Math.round(h * 0.42);
      G.R(g, gx - 1, gy - 1, u(18) + 2, u(7) + 2, G.shade(c, -0.62));
      G.R(g, gx, gy, u(18), u(7), '#141824');
      G.bevel(g, gx, gy, u(18), u(7), '#0a0d14', G.shade(c, 0.4));
      G.R(g, gx + 1, gy + 1, Math.round(u(16) * (0.55 + Math.sin(t * 1.4) * 0.3)), u(5), hue);
      G.hair(g, gx + 1, gy + 1, Math.round(u(16) * (0.55 + Math.sin(t * 1.4) * 0.3)), G.shade(hue, 0.6));
      for (let i = 1; i < 6; i++) G.vair(g, gx + i * (u(18) / 6), gy + 1, u(5), '#0a0d14');
      // an inspection hatch with a pull ring
      const hx = cx - u(5);
      plate(g, hx, y + u(4), u(10), u(7), G.shade(c, 0.06), { r: 1, band: 1, spec: false, bolts: 1 });
      G.oc(g, hx + u(5), y + u(8), u(2), G.shade(c, -0.6));
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
      plate(g, cx - w / 2, y, w, h, c, { r: 2, band: 4, rivets: 1, grain: 7, hazard: 1 });
      // sloped glacis, with a welded lip where it meets the hull
      for (let j = 0; j < u(7); j++)
        G.R(g, cx - w / 2 + 1 + j, y + j, w - 2 - j * 2, 1, G.shade(c, 0.16 - j * 0.03));
      G.seam(g, cx - w / 2 + u(7), y + u(7), w - u(14), G.shade(c, -0.55), G.shade(c, 0.24));
      // riveted armour laps down both flanks
      for (const sd of [-1, 1]) for (let i = 0; i < 5; i++)
        G.rivet(g, cx + sd * (w / 2 - 3.5), y + u(9) + i * u(2.6), G.shade(c, -0.62), G.shade(c, 0.5));
      // the vision block: recessed, with a lit slit and a wiper
      const vx = cx - u(12), vy = y + u(9);
      G.R(g, vx - 1, vy - 1, u(24) + 2, u(4) + 2, G.shade(c, -0.66));
      G.R(g, vx, vy, u(24), u(4), '#12151f');
      G.bevel(g, vx, vy, u(24), u(4), '#090c12', G.shade(c, 0.34));
      accent(g, vx + 1, vy + 1, u(22), 1, hue);
      G.Rh(g, vx + u(20), vy - 1.5, 1, u(6), P.hullDk);
      // stowage box and two tow hooks
      plate(g, cx + w / 2 - u(9), y + h - u(9), u(8), u(6), G.shade(c, -0.12),
        { r: 1, band: 1, spec: false, bolts: 1 });
      for (const sd of [-1, 1]) {
        G.Rh(g, cx + sd * (w / 2 - u(4)) - 1, y + h - 3.5, 2, 1, P.hull);
        G.Rh(g, cx + sd * (w / 2 - u(4)) - 1.5, y + h - 2.5, 3, 1, P.hullDk);
      }
      G.stencil(g, cx - w / 2 + 3, y + h - u(6), G.shade(c, -0.6));
    } else {
      plate(g, cx - w / 2, y, w, h, c, { r: 2, band: 3, bolts: 1, notch: 1,
        rivets: kind === 'boxy' ? 1 : 0 });
      chestRig(g, cx, y, w, h, u, b, t);
      if (o && o.emblem) drawEmblem(g, o.emblem, cx, y + Math.round(h * 0.78), u, hue);
    }
    // shoulder yoke over every torso: a lit collar with fasteners
    if (w > u(14)) {
      plate(g, cx - w / 2 - 1, y - 1, w + 2, Math.max(3, u(4)), G.shade(c, 0.12),
        { r: 1, band: 1, spec: false, bolts: 1 });
      G.seam(g, cx - w / 2 + 1.5, y + u(4), w - 3, G.shade(c, -0.5), G.shade(c, 0.2));
    }
    // cable looms running out of the collar into the chest
    if (w > u(12)) for (const s of [-1, 1])
      G.loom(g, cx + s * (w * 0.3), y + u(3), cx + s * (w * 0.14), y + u(9), u(2), '#1a1f2e', P.hullDk);
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
        t, lookX: Math.sin(t * 0.6) * 0.25 });
    } else {
      const sp = Math.round(w * 0.23);
      for (const s of [-1, 1]) {
        G.lens(g, cx + s * sp - ew / 2, ey, ew, eh, { hue, closed: blink, dead: o.dead, t,
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

    // ---- face plate detail: seams, a serial stencil, a status pip ----
    if (w >= 12 && h >= 12) {
      G.seam(g, cx - w / 2 + 1.5, ey + eh + 1.5, w - 3, G.shade(c, -0.5), G.shade(c, 0.2));
      G.stencil(g, cx - w / 2 + 2, y + h - 4, G.shade(c, -0.55));
      const pip = Math.sin(t * 3 + cx) > 0 ? hue : G.shade(hue, -0.6);
      G.Rh(g, cx + w / 2 - 3, y + h - 4, 1, 1, pip);
      G.Rh(g, cx + w / 2 - 3, y + h - 4, 0.5, 0.5, '#ffffff');
      // side grilles by the jaw
      for (let i = 0; i < 3; i++) {
        G.Rh(g, cx - w / 2 + 1.5, y + h * 0.52 + i * 1.5, 2, 0.5, G.shade(c, -0.55));
        G.Rh(g, cx + w / 2 - 3.5, y + h * 0.52 + i * 1.5, 2, 0.5, G.shade(c, -0.55));
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
    // a limb is a pauldron, an upper section, a hinged elbow with a
    // piston beside it, and a forearm. Four parts instead of one slab.
    function limb(s, len, wd, col) {
      const x = cx + s * (tw / 2 + wd / 2 - 1);
      const base = col || c;
      const el = sy + Math.round(len * 0.45);
      // shoulder pauldron, overhanging the joint
      plate(g, x - wd / 2 - 1, sy - 2, wd + 2, Math.max(3, u(5)), G.shade(base, 0.1),
        { r: 1, band: 2, spec: false, bolts: 1 });
      // upper arm
      plate(g, x - wd / 2, sy + u(2), wd, el - sy - u(1), base, { r: 1, band: 2, spec: false });
      // the elbow: a dark hinge with a lit pin
      G.R(g, x - wd / 2, el, wd, 2, P.plateDk2);
      G.Rh(g, x - wd / 2, el, wd, 0.5, G.shade(base, 0.3));
      G.rivet(g, x - 1, el, '#0d1018', P.hullLt);
      // forearm
      plate(g, x - wd / 2 + 0.5, el + 2, Math.max(2, wd - 1), len - (el - sy) - 2, base,
        { r: 1, band: 2, spec: false });
      // hydraulic piston running alongside
      if (wd >= u(5)) {
        const px = x + s * (wd / 2 - 1);
        G.Rh(g, px, sy + u(3), 1, el - sy - u(2), P.hullDk);
        G.vair(g, px, sy + u(3), el - sy - u(2), P.hullLt);
        G.Rh(g, px - 0.5, el - 1, 2, 2, P.hull);
      }
      return { x, y: sy + len };
    }
    if (kind === 'heavy') {
      for (const s of [-1, 1]) {
        const e = limb(s, Math.round(th * 0.9) + sway * s, u(9));
        plate(g, e.x - u(6), e.y - u(2), u(12), u(9), P.plateDk, { r: 2, band: 2, bolts: 1 });
        // knuckles: four fingers folded over
        for (let i = 0; i < 4; i++) {
          const kx = e.x - u(5) + i * u(2.6);
          G.Rh(g, kx, e.y - u(1), u(2), u(3), P.plate);
          G.hair(g, kx, e.y - u(1), u(2), P.hullLt);
          G.vair(g, kx + u(2) - 0.5, e.y - u(1), u(3), '#0d1018');
        }
        // a thumb across the front and a lit power line
        G.Rh(g, e.x + s * u(5), e.y + u(1), u(2), u(4), P.plate);
        G.R(g, e.x - u(4), e.y + u(5), u(8), 1, hue);
        G.glow(g, e.x, e.y + u(5), u(12), u(4), hue, 0.5);
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
      const bx = cx + w * 0.3, by = top - u(2);
      // mantlet: a bolted collar where the barrel leaves the turret
      plate(g, bx - u(3), by - u(3), u(6), u(8), P.plate, { r: 1, band: 2, bolts: 1 });
      // the tube, with a lit crown and a shadowed belly
      G.R(g, bx, by - 1, u(19), u(6), OUT);
      G.R(g, bx, by, u(19), u(4), P.plateDk);
      G.hair(g, bx, by, u(19), P.chrome);
      G.hair(g, bx, by + 1, u(19), P.plate);
      G.hair(g, bx, by + u(4) - 0.5, u(19), '#0b0e14');
      // reinforcing bands
      for (let i = 0; i < 3; i++) {
        G.Rh(g, bx + u(4) + i * u(4), by - 0.5, 1.5, u(5), P.plate);
        G.hair(g, bx + u(4) + i * u(4), by - 0.5, 1.5, P.chrome);
      }
      // muzzle brake: two vented blocks and a bore
      G.R(g, bx + u(16), by - u(1), u(5), u(6), P.hullDk);
      G.hair(g, bx + u(16), by - u(1), u(5), P.hull);
      G.Rh(g, bx + u(17.5), by - u(1), 1, u(6), '#0b0e14');
      G.Rh(g, bx + u(20.5), by + u(1), 1.5, u(2), '#000000');
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
      const fy = top - u(9);
      for (let j = 0; j < u(9); j++) {
        const hw = Math.round(u(11) * (1 - j / u(11)));
        G.R(g, cx - hw - 1, fy + j, hw * 2 + 2, 1, OUT);
        G.R(g, cx - hw, fy + j, hw * 2, 1, j < 2 ? P.hullLt : P.hull);
        // one lit edge and one shaded edge down the cone
        G.Rh(g, cx - hw, fy + j, 0.5, 1, P.chrome);
        G.Rh(g, cx + hw - 0.5, fy + j, 0.5, 1, P.hullDk);
      }
      // rolled rim at the mouth, with rivets
      G.Rh(g, cx - u(11), fy - 1.5, u(22), 1.5, P.chrome);
      G.hair(g, cx - u(11), fy - 1.5, u(22), '#ffffff');
      for (let i = 0; i < 6; i++) G.rivet(g, cx - u(10) + i * u(4), fy + 0.5, '#0b0e14', P.chrome);
      // a spot of what it last ate, crusted in the throat
      G.Rh(g, cx - u(2), fy + u(7), u(4), 1.5, '#c8a86a');
    } else if (kind === 'swirl') {
      // dispenser collar, then three tapering coils and a tip
      G.R(g, cx - u(9), top - u(3), u(18), u(4), OUT);
      G.R(g, cx - u(8), top - u(2), u(16), u(2), P.steel);
      G.R(g, cx - u(8), top - u(2), u(16), 1, P.steel2);
      // three coils, each a rounded band rather than a flat plate
      const coil = [[u(8), u(5)], [u(6), u(4)], [u(4), u(3)]];
      let sy = top - u(4);
      for (let i = 0; i < coil.length; i++) {
        const hw = coil[i][0], hh = coil[i][1];
        const off = (i % 2 ? 1 : -1) * u(1);
        for (let j = 0; j < hh; j++) {
          const p = j / Math.max(1, hh - 1);
          // a fat lobe: widest at the middle, tucked at both ends
          const ww = Math.max(1, Math.round(hw * (0.68 + 0.32 * Math.sin((0.15 + p * 0.8) * Math.PI))));
          G.R(g, cx + off - ww - 1, sy - hh + j, ww * 2 + 2, 1, OUT);
          G.R(g, cx + off - ww, sy - hh + j, ww * 2, 1,
            p < 0.22 ? '#fffaea' : p > 0.74 ? '#c8bc98' : '#f2e6c2');
          // the lit crest and the shadow where it laps the coil below
          G.Rh(g, cx + off - ww, sy - hh + j, 1, 0.5, '#ffffff');
          if (p > 0.86) G.hair(g, cx + off - ww, sy - hh + j, ww * 2, '#a89870');
        }
        sy -= hh - 1;
      }
      // the tip, curled over
      G.Rh(g, cx - u(1.5), sy - u(3), u(3), u(3), '#f2e6c2');
      G.Rh(g, cx - u(1.5), sy - u(3), u(2), 1, '#fffaea');
      G.Rh(g, cx + u(0.5), sy - u(4), u(1.5), u(1.5), '#f2e6c2');
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

    // the tell, if this one is not really a machine. Drawn last so it
    // sits on top of the shell it is escaping from.
    let tellRect = null;
    if (o.tell) tellRect = G.drawTell(g, {
      cx, footY, headTop: hd.y, mouthY: hd.mouthY, torsoY: torso.y,
      hw: Math.round(Math.max(hd.w / 2, torso.w / 2)),
    }, o.tell, t, u);

    return { cx, footY, tellRect, headTop: hd.y, headY: hd.y + hd.h / 2, mouthY: hd.mouthY, gape: hd.gape,
             hw: Math.round(Math.max(hd.w / 2, torso.w / 2)), top: Math.min(hd.y - u(12), hd.y),
             torsoY: torso.y, torsoW: torso.w, torsoH: torso.h, hue: b.hue };
  };


  // ============================================================
  // WHAT IS ACTUALLY IN THERE
  // Some of the queue is not a machine. A person, or a cat, or a dog,
  // walking around inside a stolen shell because the alternative is
  // being processed. They always leak something. Find it, click it,
  // and the shell comes off.
  // ============================================================
  G.TELLS = {
    tail:   { name: 'A TAIL',            hint: 'SOMETHING IS SWISHING UNDER THE CHASSIS' },
    hair:   { name: 'HAIR',              hint: 'A STRAND CAUGHT IN THE HEAD SEAM' },
    ear:    { name: 'AN EAR',            hint: 'THE HEAD PLATE IS BEING PUSHED UP' },
    breath: { name: 'BREATH',            hint: 'IT IS FOGGING ITS OWN INTAKE' },
    paw:    { name: 'A PAW',             hint: 'THAT IS NOT A GRIPPER' },
    eye:    { name: 'A REAL EYE',        hint: 'ONE OPTIC HAS A WET PUPIL' },
    heart:  { name: 'A HEARTBEAT',       hint: 'THE CHEST PANEL IS TICKING WRONG' },
  };

  // Draw the tell on a machine and return the rect you have to click.
  // Everything here is deliberately small: one or two native pixels of
  // wrongness on a body full of right pixels.
  G.drawTell = function (g, bot, tell, t, u) {
    u = u || ((v) => v);
    const cx = bot.cx;
    let r = null;
    if (tell === 'tail') {
      const y0 = bot.footY - u(3);
      const sw = Math.sin(t * 2.6) * u(4);
      const x0 = cx + bot.hw * 0.7;
      for (let i = 0; i < 12; i++) {
        const p = i / 11;
        const px = x0 + p * u(9);
        const py = y0 - Math.sin(p * 2.1) * u(4) + sw * p * 0.5;
        G.Rh(g, px, py, 1, 1, p > 0.8 ? '#f0e4d0' : '#4a3a2c');
        G.hair(g, px, py, 1, p > 0.8 ? '#ffffff' : '#6b5442');
      }
      r = { x: x0, y: y0 - u(6), w: u(10), h: u(8) };
    } else if (tell === 'hair') {
      const hx = cx - bot.hw * 0.4, hy = bot.headTop + u(1);
      for (let i = 0; i < 5; i++) {
        const p = i / 4;
        G.Rh(g, hx + p * u(4) + Math.sin(t * 3 + i) * 0.5, hy - p * u(4), 0.5, 1, '#6b4a2a');
        G.Rh(g, hx + p * u(4) + 0.5, hy - p * u(4), 0.5, 0.5, '#a8763c');
      }
      r = { x: hx - u(2), y: hy - u(5), w: u(8), h: u(6) };
    } else if (tell === 'ear') {
      const ex = cx + bot.hw * 0.5, ey = bot.headTop;
      const lift = Math.sin(t * 1.4) > 0.6 ? -1 : 0;
      for (let j = 0; j < u(4); j++) {
        const hw = u(3) * (1 - j / u(4));
        G.Rh(g, ex - hw, ey - u(4) + j + lift, hw * 2, 1, '#3a2c22');
        G.Rh(g, ex - hw + 0.5, ey - u(4) + j + lift, hw, 0.5, '#8a6a4a');
      }
      G.Rh(g, ex - u(1), ey - u(2) + lift, u(2), 1, '#d97a8a');
      r = { x: ex - u(4), y: ey - u(6), w: u(8), h: u(7) };
    } else if (tell === 'breath') {
      const mx = cx, my = bot.mouthY + u(2);
      const ph = (t * 0.7) % 1;
      g.globalAlpha = 0.5 * (1 - ph);
      for (let i = 0; i < 4; i++)
        G.Rh(g, mx - u(3) + i * u(2) + Math.sin(t * 2 + i) * 1, my + u(2) - ph * u(7), 1.5, 1.5, '#dfeaf4');
      g.globalAlpha = 1;
      r = { x: mx - u(5), y: my - u(6), w: u(10), h: u(9) };
    } else if (tell === 'paw') {
      const px = cx - bot.hw - u(1), py = bot.footY - u(11);
      G.Rh(g, px, py, u(5), u(4), '#c8b298');
      G.bevel(g, px, py, u(5), u(4), '#e8dcc8', '#8a7460');
      for (let i = 0; i < 3; i++) G.Rh(g, px + 0.5 + i * u(1.6), py + u(3.5), 1, 1, '#d99aa8');
      r = { x: px - u(2), y: py - u(2), w: u(9), h: u(8) };
    } else if (tell === 'eye') {
      const ex = cx - bot.hw * 0.42, ey = bot.headTop + u(6);
      G.fc(g, ex, ey, u(2.4), '#f4ece0');
      G.fc(g, ex, ey, u(1.5), '#3a2a1c');
      G.fc(g, ex, ey, u(0.8), '#0b0806');
      G.Rh(g, ex - u(1), ey - u(1), 1, 1, '#ffffff');
      G.Rh(g, ex - u(2.5), ey - u(3), u(5), 1, '#2a1c12');
      r = { x: ex - u(4), y: ey - u(4), w: u(8), h: u(8) };
    } else {                                            // heart
      const hx = cx - u(3), hy = bot.torsoY + u(9);
      const beat = Math.sin(t * 7) > 0.7 ? 1 : 0;
      G.Rh(g, hx, hy, u(6), u(4), '#1a1f2c');
      G.Rh(g, hx + 1, hy + 1, u(4), u(2), beat ? '#ff5d84' : '#5c2a3a');
      if (beat) G.glow(g, hx + u(3), hy + u(2), u(9), u(6), '#ff5d84', 0.7);
      r = { x: hx - u(2), y: hy - u(2), w: u(10), h: u(8) };
    }
    return r;
  };

  // ---- the creature under the shell ----
  G.drawCreature = function (g, kind, cx, footY, scale, o) {
    o = o || {};
    const S = scale || 1;
    const u = (v) => Math.max(1, Math.round(v * S));
    const t = o.t || 0;
    cx = Math.round(cx); footY = Math.round(footY);
    g.globalAlpha = 0.32;
    G.rr(g, cx - u(12), footY - 2, u(24), 4, '#000000');
    g.globalAlpha = 1;

    if (kind === 'human') {
      const skin = o.skin || '#c8a184', skinD = G.shade(skin, -0.3), skinL = G.shade(skin, 0.28);
      const coat = o.coat || '#3a4a5c';
      const hairc = o.hair || '#3a2a1c';
      const bob = Math.sin(t * 1.8) * 0.5;
      // legs and boots
      for (const sd of [-1, 1]) {
        G.Rh(g, cx + sd * u(4) - u(2), footY - u(14), u(4), u(14), G.shade(coat, -0.35));
        G.vair(g, cx + sd * u(4) - u(2), footY - u(14), u(14), G.shade(coat, -0.1));
        G.Rh(g, cx + sd * u(4) - u(3), footY - u(3), u(6), u(3), '#241c18');
        G.hair(g, cx + sd * u(4) - u(3), footY - u(3), u(6), '#463830');
      }
      // coat body
      const by = footY - u(32);
      G.Rh(g, cx - u(9), by, u(18), u(19), coat);
      G.bevel(g, cx - u(9), by, u(18), u(19), G.shade(coat, 0.3), G.shade(coat, -0.42));
      G.vseam(g, cx, by + u(3), u(16), G.shade(coat, -0.5), G.shade(coat, 0.2));
      for (let i = 0; i < 3; i++) G.rivet(g, cx + 1, by + u(6) + i * u(4), '#12141c', G.shade(coat, 0.5));
      // a collar and lapels
      G.Rh(g, cx - u(9), by, u(18), u(3), G.shade(coat, 0.16));
      G.Rh(g, cx - u(5), by + u(2), u(4), u(5), G.shade(coat, -0.3));
      G.Rh(g, cx + u(1), by + u(2), u(4), u(5), G.shade(coat, -0.3));
      // arms
      for (const sd of [-1, 1]) {
        G.Rh(g, cx + sd * u(10) - u(2), by + u(3), u(4), u(13), G.shade(coat, -0.16));
        G.Rh(g, cx + sd * u(10) - u(2), by + u(15), u(4), u(4), skin);
        G.hair(g, cx + sd * u(10) - u(2), by + u(15), u(4), skinL);
      }
      // head
      const hy = by - u(13) + bob;
      G.Rh(g, cx - u(6), hy, u(12), u(13), skin);
      G.bevel(g, cx - u(6), hy, u(12), u(13), skinL, skinD);
      // hair, with a fringe
      G.Rh(g, cx - u(7), hy - u(2), u(14), u(5), hairc);
      G.hair(g, cx - u(7), hy - u(2), u(14), G.shade(hairc, 0.4));
      for (let i = 0; i < 5; i++) G.Rh(g, cx - u(6) + i * u(3), hy + u(2), u(2), u(2), hairc);
      G.Rh(g, cx - u(8), hy + u(1), u(2), u(7), hairc);
      G.Rh(g, cx + u(6), hy + u(1), u(2), u(7), hairc);
      // eyes, nose, mouth
      for (const sd of [-1, 1]) {
        G.Rh(g, cx + sd * u(3) - u(1.5), hy + u(6), u(3), u(2), '#f4ece0');
        G.Rh(g, cx + sd * u(3) - u(0.5), hy + u(6.5), 1, 1, '#2a1c12');
        G.hair(g, cx + sd * u(3) - u(1.5), hy + u(5), u(3), G.shade(hairc, 0.1));
      }
      G.Rh(g, cx - 0.5, hy + u(8), 1, u(2), skinD);
      G.Rh(g, cx - u(2), hy + u(11), u(4), 1, '#8a4a4a');
      if (o.smile) { G.Rh(g, cx - u(3), hy + u(10.5), 1, 1, '#8a4a4a'); G.Rh(g, cx + u(2), hy + u(10.5), 1, 1, '#8a4a4a'); }
      return { headTop: hy - u(2), cx };
    }

    // ---- cat / dog: a quadruped, side-on, looking at you ----
    const dog = kind === 'dog';
    const fur = o.fur || (dog ? '#b8845a' : '#6b6b78');
    const furL = G.shade(fur, 0.3), furD = G.shade(fur, -0.36);
    const belly = G.shade(fur, 0.45);
    const bod = footY - u(15);
    // legs
    for (let i = 0; i < 4; i++) {
      const lx = cx - u(9) + i * u(6) + (i > 1 ? u(2) : 0);
      const swing = Math.sin(t * 2 + i) * 0.5;
      G.Rh(g, lx, bod + u(6), u(3), u(9) + swing, furD);
      G.vair(g, lx, bod + u(6), u(9), fur);
      G.Rh(g, lx - 0.5, footY - u(2), u(4), u(2), G.shade(fur, -0.5));
      for (let k = 0; k < 3; k++) G.Rh(g, lx + k * 1.2, footY - 1, 1, 1, '#d99aa8');
    }
    // body
    for (let j = 0; j < u(11); j++) {
      const p = j / u(11);
      const hw = u(11) * (0.82 + Math.sin(p * Math.PI) * 0.18);
      G.Rh(g, cx - hw, bod + j, hw * 2, 1, p < 0.2 ? furL : p > 0.78 ? belly : fur);
    }
    G.Rh(g, cx - u(11), bod, u(22), 0.5, G.shade(fur, 0.55));
    // markings
    if (!dog) for (let i = 0; i < 4; i++)
      G.Rh(g, cx - u(7) + i * u(4), bod + u(1), u(2), u(4), furD);
    else { G.Rh(g, cx - u(4), bod + u(4), u(8), u(6), belly); G.Rh(g, cx + u(3), bod + u(1), u(5), u(4), furD); }
    // tail
    const sw = Math.sin(t * 2.4) * u(4);
    for (let i = 0; i < 14; i++) {
      const p = i / 13;
      G.Rh(g, cx + u(10) + p * u(10), bod + u(2) - Math.sin(p * 2.2) * u(7) + sw * p * 0.6,
        dog ? 1.5 : 1, dog ? 1.5 : 1, p > 0.82 ? belly : fur);
    }
    // shoulder mass, so the head grows out of the body
    const hx = cx - u(8), hy = bod - u(7);
    G.Rh(g, hx - u(2), hy + u(5), u(10), u(7), fur);
    G.Rh(g, hx - u(2), hy + u(5), u(10), 0.5, furL);
    // head, turned to camera
    G.Rh(g, hx - u(6), hy, u(12), u(11), fur);
    G.bevel(g, hx - u(6), hy, u(12), u(11), furL, furD);
    G.Rh(g, hx - u(6), hy, u(12), u(2), furL);            // lit crown
    // ears: narrow at the tip, wide where they meet the skull
    if (dog) {
      for (const sd of [-1, 1]) {
        G.Rh(g, hx + sd * u(5) - u(1.5), hy + u(1), u(3), u(7), furD);
        G.hair(g, hx + sd * u(5) - u(1.5), hy + u(1), u(3), fur);
        G.Rh(g, hx + sd * u(5) - u(1), hy + u(7), u(2), u(2), G.shade(furD, -0.2));
      }
    } else {
      for (const sd of [-1, 1]) {
        const n = Math.max(3, u(5));
        for (let j = 0; j < n; j++) {
          const hw2 = Math.max(0.5, u(2.6) * (j / (n - 1)));
          G.Rh(g, hx + sd * u(4) - hw2, hy - u(5) + j, hw2 * 2, 1, j < 2 ? furL : fur);
          G.Rh(g, hx + sd * u(4) - hw2, hy - u(5) + j, 0.5, 1, '#ffffff');
        }
        G.Rh(g, hx + sd * u(4) - 0.5, hy - u(2), 1, u(2), '#d99aa8');
      }
    }
    // eyes: big cartoon rounds aimed straight at you
    for (const sd of [-1, 1]) {
      const ex = hx + sd * u(3) - u(2), ey = hy + u(3);
      G.rr2(g, ex - 0.5, ey - 0.5, u(4) + 1, u(4) + 1, '#1a1410');
      G.rr2(g, ex, ey, u(4), u(4), '#f6f2e4');
      const ir = Math.max(2, u(2.6));
      G.rr(g, ex + (u(4) - ir) / 2, ey + (u(4) - ir) / 2, ir, ir, dog ? '#7a4a1c' : '#2f9a62');
      G.Rh(g, ex + u(1.4), ey + u(1.4), u(1.2), u(1.2), '#0b0806');
      G.Rh(g, ex + u(0.5), ey + u(0.5), 1, 1, '#ffffff');
    }
    // brow tufts
    for (const sd of [-1, 1]) G.Rh(g, hx + sd * u(3) - u(2), hy + u(2), u(4), 0.5, furD);
    // muzzle and nose
    G.Rh(g, hx - u(3), hy + u(7), u(6), u(3.5), belly);
    G.bevel(g, hx - u(3), hy + u(7), u(6), u(3.5), G.shade(belly, 0.3), G.shade(belly, -0.3));
    G.Rh(g, hx - u(1.2), hy + u(7), u(2.4), u(1.6), '#2a1c1c');
    G.Rh(g, hx - u(0.8), hy + u(7.2), u(1), 0.5, '#5a4444');
    G.Rh(g, hx - u(0.25), hy + u(8.6), 0.5, u(1.4), '#4a3a3a');
    G.Rh(g, hx - u(1.6), hy + u(10), u(1.4), 0.5, '#4a3a3a');
    G.Rh(g, hx + u(0.2), hy + u(10), u(1.4), 0.5, '#4a3a3a');
    // whiskers
    if (!dog) for (const sd of [-1, 1]) for (let k = 0; k < 3; k++)
      G.Rh(g, hx + sd * u(3), hy + u(7.5) + k * 1.5, sd * u(5), 0.5, '#e8e0d0');
    // a collar, because someone kept them
    G.Rh(g, hx - u(5), hy + u(11), u(10), u(1.5), dog ? '#8a2f42' : '#2f6b8a');
    G.hair(g, hx - u(5), hy + u(11), u(10), '#ffffff');
    G.Rh(g, hx - u(0.5), hy + u(12), 1.5, 1.5, '#e0c04a');
    return { headTop: hy - u(5), cx: hx };
  };


  // ============================================================
  // THE TIP JAR. A cat-shaped machine somebody left behind. It sits
  // on the counter, it purrs when you touch it, and the machines put
  // money in it because they cannot work out why they want to.
  // ============================================================
  G.drawCatJar = function (g, cx, baseY, scale, o) {
    o = o || {};
    const S = scale || 1;
    const u = (v) => Math.max(1, Math.round(v * S));
    const t = o.t || 0;
    const purr = G.clamp(o.purr || 0, 0, 1);
    const body = '#c8a24a', bodyL = '#f0d488', bodyD = '#8a6a24';
    const trim = o.trim || '#3affd0';
    cx = Math.round(cx); baseY = Math.round(baseY);
    // it breathes when it is happy
    const sq = Math.sin(t * (6 + purr * 14)) * purr * 0.6;

    g.globalAlpha = 0.32; G.rr(g, cx - u(9), baseY - 1, u(18), 3, '#000000'); g.globalAlpha = 1;

    // the jar body: a rounded pot with a coin slot
    const bh = u(15) - sq, bw = u(16) + sq;
    const by = baseY - bh;
    for (let j = 0; j < bh; j++) {
      const p = j / (bh - 1);
      const hw = (bw / 2) * (0.74 + 0.26 * Math.sin((0.12 + p * 0.86) * Math.PI));
      G.Rh(g, cx - hw - 0.5, by + j, hw * 2 + 1, 1, '#0b0e14');
      G.Rh(g, cx - hw, by + j, hw * 2, 1, p < 0.2 ? bodyL : p > 0.8 ? bodyD : body);
      G.Rh(g, cx - hw, by + j, 0.5, 1, '#fff4c8');
      G.Rh(g, cx + hw - 0.5, by + j, 0.5, 1, bodyD);
    }
    // coins visible through a slot window
    G.Rh(g, cx - u(4), by + u(7), u(8), u(5), '#2a2418');
    G.bevel(g, cx - u(4), by + u(7), u(8), u(5), '#12100a', '#e0c878');
    const lvl = G.clamp((o.coins || 0) / 12, 0, 1);
    G.Rh(g, cx - u(3.5), by + u(11.5) - u(4) * lvl, u(7), u(4) * lvl, '#e0b83a');
    G.hair(g, cx - u(3.5), by + u(11.5) - u(4) * lvl, u(7), '#ffe89a');
    // slot on the crown
    G.Rh(g, cx - u(3), by - 0.5, u(6), 1.5, '#0b0e14');
    G.hair(g, cx - u(3), by + 1, u(6), '#fff4c8');

    // head
    const hh = u(11), hy = by - hh + u(1) + sq * 0.5;
    G.Rh(g, cx - u(7), hy, u(14), hh, body);
    G.bevel(g, cx - u(7), hy, u(14), hh, bodyL, bodyD);
    G.Rh(g, cx - u(7), hy, u(14), u(2), bodyL);
    // ears, with a lit inner edge
    for (const sd of [-1, 1]) {
      const n = Math.max(3, u(5));
      for (let j = 0; j < n; j++) {
        const hw = Math.max(0.5, u(2.8) * (j / (n - 1)));
        G.Rh(g, cx + sd * u(4.6) - hw, hy - u(5) + j, hw * 2, 1, j < 2 ? bodyL : body);
      }
      G.Rh(g, cx + sd * u(4.6) - 0.5, hy - u(2), 1, u(2), trim);
    }
    // optics: two lit lenses, blinking slowly
    const shut = Math.sin(t * 0.9) > 0.985 || purr > 0.6;
    for (const sd of [-1, 1]) {
      const ex = cx + sd * u(3.2);
      if (shut) { G.Rh(g, ex - u(2), hy + u(4.5), u(4), 1, G.shade(trim, -0.3)); continue; }
      G.fc(g, ex, hy + u(4.5), u(2.2), '#0d1a18');
      G.fc(g, ex, hy + u(4.5), u(1.6), trim);
      G.Rh(g, ex - 0.5, hy + u(4), 1, 1, '#ffffff');
      G.glow(g, ex, hy + u(4.5), u(6), u(6), trim, 0.6);
    }
    // muzzle, nose, a stitched mouth
    G.Rh(g, cx - u(2.5), hy + u(7), u(5), u(3), bodyL);
    G.Rh(g, cx - u(1), hy + u(7), u(2), u(1.5), '#8a3a4a');
    G.Rh(g, cx - u(2), hy + u(9.5), u(1.6), 0.5, bodyD);
    G.Rh(g, cx + u(0.4), hy + u(9.5), u(1.6), 0.5, bodyD);
    // whiskers, which twitch
    for (const sd of [-1, 1]) for (let k = 0; k < 2; k++)
      G.Rh(g, cx + sd * u(2.6), hy + u(7.4) + k * 1.5 + Math.sin(t * 4 + k) * purr * 0.5,
        sd * u(4.5), 0.5, '#fff4c8');
    // tail, curled round the jar and flicking
    const fl = Math.sin(t * (2 + purr * 6)) * u(3) * (0.4 + purr);
    for (let i = 0; i < 16; i++) {
      const p = i / 15;
      G.Rh(g, cx + u(8) + Math.sin(p * 2.4) * u(4) + fl * p * 0.4,
        baseY - u(3) - p * u(12), 1, 1, p > 0.85 ? bodyL : body);
    }
    // a little paw resting on the slot
    G.Rh(g, cx - u(8), by + u(4), u(3), u(3), bodyL);
    G.bevel(g, cx - u(8), by + u(4), u(3), u(3), '#fff4c8', bodyD);
    if (purr > 0.2) {
      // purr rings
      g.globalAlpha = 0.4 * purr;
      for (let k = 0; k < 2; k++) {
        const rr = u(9) + ((t * 12 + k * 5) % u(10));
        G.oc(g, cx, hy + u(5), rr, trim);
      }
      g.globalAlpha = 1;
    }
    return { cx, top: hy - u(6), w: u(20), h: baseY - (hy - u(6)) };
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

// ============================================================
// DOUBLE LIFE - sprites.js
// Procedural pixel art: chibi animal customers (walking) and
// big patient faces (dentist chair), plus shared item icons:
// tubs, bottles, jars, scooper, tools, teeth, cursors.
// All hand-placed rects/scanline-circles -> crisp pixels.
// ============================================================
(function () {
  const G = window.GAME;
  const OUT = G.OUT;

  // outlined rounded rect helpers
  function orr(g, x, y, w, h, col) { G.rr(g, x - 1, y - 1, w + 2, h + 2, OUT); G.rr(g, x, y, w, h, col); }
  function orr2(g, x, y, w, h, col) { G.rr2(g, x - 1, y - 1, w + 2, h + 2, OUT); G.rr2(g, x, y, w, h, col); }
  function ofc(g, cx, cy, r, col) { G.fc(g, cx, cy, r + 1, OUT); G.fc(g, cx, cy, r, col); }
  function ofe(g, cx, cy, rx, ry, col) { G.fe(g, cx, cy, rx + 1, ry + 1, OUT); G.fe(g, cx, cy, rx, ry, col); }
  G.orr = orr; G.orr2 = orr2; G.ofc = ofc; G.ofe = ofe;

  const BLUSH = '#ff9aa8';

  // ----------------------------------------------------------
  // WALKING CHIBI  (feet baseline at x,y — front 3/4 view)
  // o: {walk, t, mood:'ok'|'happy'|'sad', flip}
  // ----------------------------------------------------------
  G.drawAnimal = function (g, spId, x, y, t, o) {
    o = o || {};
    x = Math.round(x); y = Math.round(y);
    const a = G.animalById(spId);
    const col = a.col, col2 = a.col2;
    const walk = o.walk;
    const bob = walk ? Math.abs(Math.sin(t * 9)) * 2 : Math.sin(t * 2.2) * 0.7 + 0.7;
    const by = Math.round(y - bob);
    // shadow
    g.globalAlpha = 0.22; G.fe(g, x, y + 1, 8, 2, '#241c2e'); g.globalAlpha = 1;

    if (spId === 'snake') { drawSnake(g, a, x, y, t, o, by); return; }

    // legs
    const lp = walk ? Math.sin(t * 9) * 2 : 0;
    orr(g, x - 5, y - 3 - Math.max(0, lp), 4, 3 + Math.max(0, lp), col2);
    orr(g, x + 1, y - 3 - Math.max(0, -lp), 4, 3 + Math.max(0, -lp), col2);
    // body
    orr(g, x - 6, by - 12, 12, 10, col);
    if (spId === 'turtle') { // plastron + shell rim
      G.rr(g, x - 4, by - 10, 8, 7, '#e8d9a8');
      G.R(g, x - 6, by - 12, 12, 2, col2);
    } else {
      G.fe(g, x, by - 7, 3, 3, G.shade(col, 0.22)); // belly
    }
    // arms
    const ap = walk ? Math.sin(t * 9 + Math.PI) * 1.5 : 0;
    orr(g, x - 9, by - 11 + ap, 3, 5, col);
    orr(g, x + 6, by - 11 - ap, 3, 5, col);

    const hx = x - 9, hy = by - 26; // head top-left (18x14)
    // === behind-head bits (ears etc) ===
    if (spId === 'dog') { orr(g, hx - 2, hy + 3, 4, 10, col2); orr(g, hx + 16, hy + 3, 4, 10, col2); }
    if (spId === 'cat') {
      orr(g, hx + 1, hy - 4, 5, 5, col); orr(g, hx + 12, hy - 4, 5, 5, col);
      G.R(g, hx + 2, hy - 3, 3, 2, BLUSH); G.R(g, hx + 13, hy - 3, 3, 2, BLUSH);
    }
    if (spId === 'bunny') {
      orr(g, hx + 2, hy - 11, 4, 12, col); orr(g, hx + 12, hy - 11, 4, 12, col);
      G.R(g, hx + 3, hy - 9, 2, 8, BLUSH); G.R(g, hx + 13, hy - 9, 2, 8, BLUSH);
    }
    if (spId === 'tiger') { ofc(g, hx + 2, hy, 3, col); ofc(g, hx + 16, hy, 3, col); G.fc(g, hx + 2, hy, 1, col2); G.fc(g, hx + 16, hy, 1, col2); }
    if (spId === 'panda') { ofc(g, hx + 2, hy, 3, col2); ofc(g, hx + 16, hy, 3, col2); }
    if (spId === 'turtle') { /* no ears */ }

    // === head ===
    orr2(g, hx, hy, 18, 14, col);
    G.R(g, hx + 2, hy + 1, 14, 2, G.shade(col, 0.18)); // top shine

    // species face details
    if (spId === 'tiger') {
      G.R(g, hx + 8, hy, 2, 3, col2); G.R(g, hx + 1, hy + 4, 2, 3, col2); G.R(g, hx + 15, hy + 4, 2, 3, col2);
      G.fe(g, x, hy + 10, 4, 3, '#fff3e0');
    }
    if (spId === 'dog') { G.fe(g, x, hy + 10, 4, 3, G.shade(col, 0.25)); }
    if (spId === 'frog') {
      ofc(g, hx + 4, hy - 1, 3, col); ofc(g, hx + 14, hy - 1, 3, col);
      G.R(g, hx + 3, hy - 2, 2, 2, '#fff'); G.R(g, hx + 13, hy - 2, 2, 2, '#fff');
      G.R(g, hx + 4, hy - 2, 1, 2, OUT); G.R(g, hx + 14, hy - 2, 1, 2, OUT);
    }
    if (spId === 'panda') { G.fe(g, hx + 5, hy + 7, 3, 4, col2); G.fe(g, hx + 13, hy + 7, 3, 4, col2); }

    // eyes (blink every few seconds)
    const blink = (Math.sin(t * 1.3 + x) > 0.97);
    const eyY = hy + 6;
    if (spId === 'frog') {
      // eyes are on the bumps already
    } else if (o.mood === 'happy') {
      G.R(g, hx + 4, eyY + 1, 3, 1, OUT); G.R(g, hx + 4, eyY, 1, 1, OUT); G.R(g, hx + 6, eyY, 1, 1, OUT);
      G.R(g, hx + 11, eyY + 1, 3, 1, OUT); G.R(g, hx + 11, eyY, 1, 1, OUT); G.R(g, hx + 13, eyY, 1, 1, OUT);
    } else if (blink) {
      G.R(g, hx + 4, eyY + 1, 3, 1, OUT); G.R(g, hx + 11, eyY + 1, 3, 1, OUT);
    } else {
      const pc = spId === 'panda' ? '#fff' : OUT;
      G.R(g, hx + 4, eyY, 2, 3, pc); G.R(g, hx + 12, eyY, 2, 3, pc);
      if (spId === 'panda') { G.R(g, hx + 4, eyY + 1, 1, 1, OUT); G.R(g, hx + 12, eyY + 1, 1, 1, OUT); }
      else { G.R(g, hx + 4, eyY, 1, 1, '#fff'); G.R(g, hx + 12, eyY, 1, 1, '#fff'); }
    }
    // blush
    G.R(g, hx + 1, hy + 9, 2, 1, BLUSH); G.R(g, hx + 15, hy + 9, 2, 1, BLUSH);
    // mouth
    if (o.mood === 'happy') { G.R(g, hx + 7, hy + 10, 4, 2, OUT); G.R(g, hx + 8, hy + 11, 2, 1, '#ff8fa5'); }
    else if (o.mood === 'sad') { G.R(g, hx + 8, hy + 11, 2, 1, OUT); }
    else { G.R(g, hx + 8, hy + 10, 2, 1, OUT); }
    if (spId === 'dog' && o.mood !== 'sad' && Math.sin(t * 3) > 0.4) G.R(g, hx + 8, hy + 12, 2, 2, '#ff8fa5');
    if (spId === 'cat') { G.R(g, hx - 2, hy + 8, 2, 1, OUT); G.R(g, hx + 18, hy + 8, 2, 1, OUT); }
  };

  function drawSnake(g, a, x, y, t, o, by) {
    const col = a.col, col2 = a.col2;
    const wig = o.walk ? Math.sin(t * 7) * 2 : Math.sin(t * 2) * 1;
    ofe(g, x, y - 3, 8, 3, col);
    ofe(g, Math.round(x + wig * 0.6), y - 8, 6, 3, col);
    ofe(g, Math.round(x - wig * 0.5), y - 12, 5, 3, col);
    G.R(g, x - 4, y - 4, 8, 1, G.shade(col, 0.25));
    G.R(g, x - 3, y - 9, 6, 1, G.shade(col, 0.25));
    // head
    const hx = Math.round(x - 9 + wig), hy = by - 26;
    orr2(g, hx, hy, 18, 13, col);
    G.R(g, hx + 2, hy + 1, 14, 2, G.shade(col, 0.2));
    G.R(g, hx + 3, hy + 3, 3, 2, col2); G.R(g, hx + 12, hy + 3, 3, 2, col2);
    const blink = (Math.sin(t * 1.3 + x) > 0.97);
    if (o.mood === 'happy') { G.R(g, hx + 4, hy + 7, 3, 1, OUT); G.R(g, hx + 11, hy + 7, 3, 1, OUT); }
    else if (blink) { G.R(g, hx + 4, hy + 7, 3, 1, OUT); G.R(g, hx + 11, hy + 7, 3, 1, OUT); }
    else { G.R(g, hx + 4, hy + 6, 2, 3, OUT); G.R(g, hx + 12, hy + 6, 2, 3, OUT); G.R(g, hx + 4, hy + 6, 1, 1, '#fff'); G.R(g, hx + 12, hy + 6, 1, 1, '#fff'); }
    G.R(g, hx + 1, hy + 9, 2, 1, BLUSH); G.R(g, hx + 15, hy + 9, 2, 1, BLUSH);
    G.R(g, hx + 8, hy + 10, 2, 1, OUT);
    if (Math.sin(t * 2.4) > 0.75) { G.R(g, hx + 8, hy + 12, 1, 3, '#ff5f6e'); G.R(g, hx + 9, hy + 14, 1, 1, '#ff5f6e'); G.R(g, hx + 7, hy + 14, 1, 1, '#ff5f6e'); }
  }

  // ----------------------------------------------------------
  // BIG PATIENT FACE  (dentist chair) centered at cx, cy
  // o: {mood:'worry'|'ok'|'ouch'|'happy'|'relax', mouth:0..1, t}
  // ----------------------------------------------------------
  G.drawFace = function (g, spId, cx, cy, o) {
    o = o || {};
    const a = G.animalById(spId);
    const col = a.col, col2 = a.col2;
    const t = o.t || 0;
    cx = Math.round(cx); cy = Math.round(cy + Math.sin(t * 1.8) * 1.2);
    const w = 56, h = 46, hx = cx - w / 2, hy = cy - h / 2;

    // ears / bumps behind
    if (spId === 'dog') { orr2(g, hx - 7, hy + 10, 10, 26, col2); orr2(g, hx + w - 3, hy + 10, 10, 26, col2); }
    if (spId === 'cat') { orr2(g, hx + 2, hy - 11, 13, 13, col); orr2(g, hx + w - 15, hy - 11, 13, 13, col); G.rr(g, hx + 5, hy - 8, 7, 7, BLUSH); G.rr(g, hx + w - 12, hy - 8, 7, 7, BLUSH); }
    if (spId === 'bunny') { orr2(g, hx + 6, hy - 26, 11, 28, col); orr2(g, hx + w - 17, hy - 26, 11, 28, col); G.rr(g, hx + 9, hy - 22, 5, 21, BLUSH); G.rr(g, hx + w - 14, hy - 22, 5, 21, BLUSH); }
    if (spId === 'tiger') { ofc(g, hx + 6, hy + 1, 8, col); ofc(g, hx + w - 6, hy + 1, 8, col); G.fc(g, hx + 6, hy + 1, 4, col2); G.fc(g, hx + w - 6, hy + 1, 4, col2); }
    if (spId === 'panda') { ofc(g, hx + 6, hy + 1, 8, col2); ofc(g, hx + w - 6, hy + 1, 8, col2); }
    if (spId === 'frog') {
      ofc(g, hx + 12, hy - 4, 8, col); ofc(g, hx + w - 12, hy - 4, 8, col);
    }

    // head
    orr2(g, hx, hy, w, h, col);
    G.R(g, hx + 4, hy + 2, w - 8, 3, G.shade(col, 0.16));

    if (spId === 'tiger') {
      G.R(g, hx + 25, hy, 6, 6, col2); G.R(g, hx + 1, hy + 10, 4, 6, col2); G.R(g, hx + w - 5, hy + 10, 4, 6, col2);
      G.fe(g, cx, hy + 32, 13, 9, '#fff3e0');
    }
    if (spId === 'dog') G.fe(g, cx, hy + 32, 12, 8, G.shade(col, 0.25));
    if (spId === 'turtle') { G.fe(g, cx, hy + 33, 13, 8, G.shade(col, 0.18)); }
    if (spId === 'panda') { G.fe(g, hx + 15, hy + 17, 8, 10, col2); G.fe(g, hx + w - 15, hy + 17, 8, 10, col2); }

    // --- eyes ---
    const ex1 = hx + 15, ex2 = hx + w - 15, ey = hy + 16;
    const mood = o.mood || 'ok';
    function eyeAt(ex, kind) {
      if (kind === 'ouch') { // >< squeezed
        G.R(g, ex - 3, ey - 3, 2, 2, OUT); G.R(g, ex + 1, ey - 3, 2, 2, OUT);
        G.R(g, ex - 1, ey - 1, 2, 2, OUT);
        G.R(g, ex - 3, ey + 1, 2, 2, OUT); G.R(g, ex + 1, ey + 1, 2, 2, OUT);
      } else if (kind === 'happy') { // ^^
        G.R(g, ex - 3, ey - 1, 2, 2, OUT); G.R(g, ex - 1, ey - 2, 2, 2, OUT); G.R(g, ex + 1, ey - 1, 2, 2, OUT);
      } else if (kind === 'closed') {
        G.R(g, ex - 3, ey, 6, 2, OUT);
      } else { // open cute eye
        const pc = spId === 'panda' ? '#fff' : OUT;
        G.fe(g, ex, ey, 3, 4, pc);
        if (spId === 'panda') G.R(g, ex - 1, ey, 2, 2, OUT);
        else { G.R(g, ex - 2, ey - 2, 2, 2, '#fff'); }
      }
    }
    let ek = 'open';
    if (mood === 'ouch') ek = 'ouch';
    else if (mood === 'happy') ek = 'happy';
    else if (mood === 'relax') ek = 'closed';
    else if (Math.sin(t * 1.1 + 2) > 0.98) ek = 'closed';
    if (spId === 'frog') {
      // eyes on top bumps
      const fy = hy - 4;
      if (ek === 'open') { G.fe(g, hx + 12, fy, 3, 4, OUT); G.fe(g, hx + w - 12, fy, 3, 4, OUT); G.R(g, hx + 10, fy - 2, 2, 2, '#fff'); G.R(g, hx + w - 14, fy - 2, 2, 2, '#fff'); }
      else if (ek === 'happy') { G.R(g, hx + 9, fy, 3, 2, OUT); G.R(g, hx + 12, fy - 1, 3, 2, OUT); G.R(g, hx + 15, fy, 2, 2, OUT); G.R(g, hx + w - 17, fy, 3, 2, OUT); G.R(g, hx + w - 14, fy - 1, 3, 2, OUT); G.R(g, hx + w - 11, fy, 2, 2, OUT); }
      else { G.R(g, hx + 9, fy, 7, 2, OUT); G.R(g, hx + w - 16, fy, 7, 2, OUT); }
    } else {
      eyeAt(ex1, ek); eyeAt(ex2, ek);
    }
    // worry brows
    if (mood === 'worry') { G.R(g, ex1 - 4, ey - 7, 6, 2, OUT); G.R(g, ex2 - 2, ey - 7, 6, 2, OUT); }
    // blush
    G.R(g, hx + 4, hy + 24, 5, 3, BLUSH); G.R(g, hx + w - 9, hy + 24, 5, 3, BLUSH);

    // --- mouth ---
    const mo = o.mouth === undefined ? 1 : o.mouth;
    const my = hy + 34;
    if (mood === 'happy') {
      // big proud sparkling smile
      orr(g, cx - 10, my - 2, 20, 7, '#fff');
      G.R(g, cx - 10, my + 1, 20, 1, '#d8e0ea');
      G.R(g, cx - 12, my - 2, 2, 3, OUT); G.R(g, cx + 10, my - 2, 2, 3, OUT);
    } else if (mo < 0.15) {
      G.R(g, cx - 3, my, 6, 2, OUT);
    } else {
      const mrx = Math.round(4 + 7 * mo), mry = Math.round(2 + 8 * mo);
      ofe(g, cx, my, mrx, mry, '#8a3d4d');
      G.fe(g, cx, my + mry - 2, mrx - 2, 2, '#ff8fa5'); // tongue peek
      if (mo > 0.5) { G.R(g, cx - mrx + 2, my - mry + 1, 3, 2, '#fff'); G.R(g, cx + mrx - 5, my - mry + 1, 3, 2, '#fff'); }
    }
    if (spId === 'cat') { G.R(g, hx - 4, hy + 26, 4, 1, OUT); G.R(g, hx + w, hy + 26, 4, 1, OUT); G.R(g, hx - 3, hy + 30, 4, 1, OUT); G.R(g, hx + w - 1, hy + 30, 4, 1, OUT); }
    if (spId === 'snake' && mood !== 'happy' && mo < 0.2 && Math.sin(t * 2.2) > 0.7) { G.R(g, cx - 1, my + 3, 1, 4, '#ff5f6e'); }
  };

  // ----------------------------------------------------------
  // ICE CREAM PARLOR PROPS
  // ----------------------------------------------------------
  // scoop ball with shading, optional flecks
  G.drawScoopBall = function (g, cx, cy, r, flavor, squish) {
    const f = typeof flavor === 'string' ? G.flavorById(flavor) : flavor;
    const rx = r * (1 + (squish || 0)), ry = r * (1 - (squish || 0) * 0.6);
    ofe(g, cx, cy, rx, ry, f.col);
    G.fe(g, cx - rx * 0.25, cy - ry * 0.3, rx * 0.4, ry * 0.32, G.shade(f.col, 0.3));
    G.fe(g, cx, cy + ry - 1.4, rx * 0.7, 1.6, G.shade(f.col, -0.16));
    if (f.fleck) {
      const n = Math.max(3, Math.floor(r));
      for (let i = 0; i < n; i++) {
        const a = (i * 2.4 + 1) % 6.28, rr = (i * 37 % 100) / 100 * r * 0.72;
        G.R(g, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8, 1, 1, f.fleck);
      }
    }
  };

  // ice cream tub in the display case (2.5-D box)
  // opts: {locked, dents, isNew, t}
  G.drawTub = function (g, x, y, w, flavor, opts) {
    opts = opts || {};
    const topH = 11, frontH = 15, inset = 3;
    // metal front
    G.R(g, x, y + topH, w, frontH, OUT);
    G.R(g, x + 1, y + topH + 1, w - 2, frontH - 2, '#cdd6e0');
    G.R(g, x + 1, y + topH + 1, w - 2, 2, '#eef3f8');
    G.R(g, x + 1, y + topH + frontH - 3, w - 2, 2, '#9aa7b5');
    // top rim (trapezoid via rows)
    for (let i = 0; i <= topH; i++) {
      const k = i / topH, ix = Math.round(inset * (1 - k));
      G.R(g, x + ix, y + i, w - ix * 2, 1, i === 0 || i === topH ? OUT : '#b7c2cf');
    }
    if (opts.locked) {
      for (let i = 1; i < topH; i++) {
        const k = i / topH, ix = Math.round(inset * (1 - k));
        G.R(g, x + ix + 1, y + i, w - ix * 2 - 2, 1, '#8d97a5');
      }
      G.R(g, x + Math.floor(w / 2) - 3, y + 3, 6, 6, OUT);
      G.text(g, '?', x + w / 2 + 1, y + 2, '#ffe66e', { align: 'center' });
      return;
    }
    const f = flavor;
    for (let i = 1; i < topH; i++) {
      const k = i / topH, ix = Math.round(inset * (1 - k));
      G.R(g, x + ix + 1, y + i, w - ix * 2 - 2, 1, i < 3 ? G.shade(f.col, -0.12) : f.col);
    }
    // swirl + flecks
    G.R(g, x + 6, y + 5, w - 12, 1, G.shade(f.col, -0.14));
    G.R(g, x + 9, y + 7, w - 18, 1, G.shade(f.col, 0.18));
    if (f.fleck) { G.R(g, x + 7, y + 4, 1, 1, f.fleck); G.R(g, x + w - 9, y + 6, 1, 1, f.fleck); G.R(g, x + 12, y + 8, 1, 1, f.fleck); }
    // scoop dents
    const dents = Math.min(3, opts.dents || 0);
    const dentX = [x + 8, x + w - 10, x + Math.floor(w / 2)];
    for (let d = 0; d < dents; d++) {
      G.fe(g, dentX[d], y + 6, 3, 2, G.shade(f.col, -0.22));
      G.R(g, dentX[d] - 3, y + 5, 1, 1, G.shade(f.col, 0.2));
    }
    // front label chip
    G.rr(g, x + Math.floor(w / 2) - 5, y + topH + 4, 10, 8, '#fff');
    G.R(g, x + Math.floor(w / 2) - 3, y + topH + 6, 6, 4, f.col);
    if (opts.isNew) {
      const bl = Math.sin((opts.t || 0) * 6) > 0;
      if (bl) G.text(g, '★', x + w - 5, y - 4, '#ffe66e', { align: 'center', out: OUT });
    }
  };

  // sauce bottle (upright on rack, or flipped when held)
  G.drawBottle = function (g, x, y, sauce, held, squeeze) {
    const c = sauce.col;
    if (!held) {
      orr(g, x - 5, y - 18, 10, 18, c);
      G.R(g, x - 4, y - 17, 2, 14, G.shade(c, 0.3));
      G.R(g, x - 5, y - 10, 10, 4, '#fff');
      G.R(g, x - 3, y - 9, 6, 2, c);
      orr(g, x - 2, y - 22, 4, 4, G.shade(c, -0.25));
      G.R(g, x - 1, y - 24, 2, 3, OUT);
    } else {
      // nozzle down at (x, y) = nozzle tip
      const sq = squeeze ? 1 : 0;
      orr(g, x - 5 - sq, y - 24, 10 + sq * 2, 18 - sq, c);
      G.R(g, x - 4, y - 23, 2, 13, G.shade(c, 0.3));
      G.R(g, x - 5 - sq, y - 16, 10 + sq * 2, 4, '#fff');
      orr(g, x - 2, y - 7, 4, 4, G.shade(c, -0.25));
      G.R(g, x - 1, y - 3, 2, 3, OUT);
      if (squeeze) G.R(g, x - 1, y, 2, 2, c);
    }
  };

  // topping jar
  G.drawJar = function (g, x, y, top, held) {
    if (!held) {
      orr(g, x - 6, y - 14, 12, 14, '#dff0fa');
      G.R(g, x - 5, y - 13, 2, 12, '#fff');
      // contents
      for (let i = 0; i < 8; i++) {
        const bx = x - 4 + (i * 5) % 9, byy = y - 7 + Math.floor(i / 3) * 2.5;
        G.R(g, bx, byy, 2, 1, top.multi ? G.MULTI_COLS[top.id][i % G.MULTI_COLS[top.id].length] : top.col);
      }
      orr(g, x - 6, y - 17, 12, 4, '#cdd6e0');
      G.R(g, x - 5, y - 16, 10, 1, '#eef3f8');
    } else {
      // tilted (cap-down) at mouse
      orr(g, x - 6, y - 16, 12, 14, '#dff0fa');
      for (let i = 0; i < 8; i++) {
        const bx = x - 4 + (i * 5) % 9, byy = y - 12 + Math.floor(i / 3) * 2.5;
        G.R(g, bx, byy, 2, 1, top.multi ? G.MULTI_COLS[top.id][i % G.MULTI_COLS[top.id].length] : top.col);
      }
      orr(g, x - 6, y - 3, 12, 4, '#cdd6e0');
      G.R(g, x - 4, y + 1, 8, 1, OUT); // holes
    }
  };

  // ice cream scooper following the mouse
  G.drawScooper = function (g, x, y, fill, flavor) {
    // handle
    orr(g, x + 3, y - 14, 4, 12, '#ff8fb0');
    G.R(g, x + 4, y - 13, 1, 10, '#ffc2d4');
    // bowl
    ofc(g, x, y, 5, '#cdd6e0');
    G.fc(g, x - 1, y - 1, 2, '#eef3f8');
    if (fill > 0 && flavor) {
      const r = 1 + 5 * Math.min(1, fill);
      G.drawScoopBall(g, x, y - 2 - r * 0.4, r, flavor, 0);
    }
  };

  // cone / cup drawn tip at (x, baseY)
  G.drawBase = function (g, kind, x, baseY) {
    if (kind === 'cone') {
      const h = 22, w2 = 9;
      for (let i = 0; i <= h; i++) {
        const w = Math.max(1, Math.round(w2 * i / h));
        G.R(g, x - w, baseY - i, w * 2, 1, i === 0 ? OUT : '#e0a35c');
      }
      for (let i = 2; i <= h; i += 4) {
        const w = Math.round(w2 * i / h);
        G.R(g, x - w + 1, baseY - i, w * 2 - 2, 1, '#c9853f');
      }
      G.R(g, x - w2 - 1, baseY - h - 1, w2 * 2 + 2, 2, OUT);
      G.R(g, x - w2, baseY - h, w2 * 2, 1, '#f2c078');
      // waffle cross-hatch dots
      for (let yy = 4; yy < h - 2; yy += 3) for (let xx = -6; xx <= 6; xx += 3) {
        const w = Math.round(w2 * yy / h) - 1;
        if (Math.abs(xx) < w) G.R(g, x + xx, baseY - yy, 1, 1, '#b06f30');
      }
    } else {
      orr(g, x - 10, baseY - 14, 20, 14, '#ff9fc2');
      G.R(g, x - 9, baseY - 13, 3, 12, '#ffd4e4');
      G.R(g, x - 11, baseY - 16, 22, 3, OUT);
      G.R(g, x - 10, baseY - 15, 20, 1, '#fff');
      G.R(g, x - 6, baseY - 8, 12, 2, '#fff');
    }
  };

  // mini order icon (for speech bubbles / summary)
  G.drawOrderIcon = function (g, order, x, y) {
    // base
    if (order.base === 'cone') {
      for (let i = 0; i <= 8; i++) G.R(g, x - Math.round(3 * i / 8), y - i, Math.max(1, Math.round(3 * i / 8) * 2), 1, '#e0a35c');
      G.R(g, x - 4, y - 9, 8, 1, '#c9853f');
    } else {
      G.R(g, x - 4, y - 6, 8, 6, '#ff9fc2');
      G.R(g, x - 5, y - 7, 10, 2, '#fff');
    }
    let sy = y - (order.base === 'cone' ? 11 : 9);
    for (let i = 0; i < order.scoops.length; i++) {
      const f = G.flavorById(order.scoops[i]);
      G.fc(g, x, sy, 3.5, f.col);
      G.R(g, x - 1, sy - 2, 1, 1, '#fff');
      sy -= 5;
    }
    if (order.sauce) {
      const s = G.sauceById(order.sauce);
      const ty = y - (order.base === 'cone' ? 11 : 9) - (order.scoops.length - 1) * 5;
      G.R(g, x - 3, ty - 2, 6, 1, s.col);
      G.R(g, x - 2, ty - 1, 1, 2, s.col); G.R(g, x + 1, ty - 1, 1, 2, s.col); G.R(g, x - 3, ty - 1, 1, 1, s.col);
    }
    if (order.top) {
      const ty = y - (order.base === 'cone' ? 11 : 9) - (order.scoops.length - 1) * 5;
      for (let i = 0; i < 3; i++) G.R(g, x - 2 + i * 2, ty - 3 - (i % 2), 1, 1, G.topBitCol(order.top));
    }
  };

  // ----------------------------------------------------------
  // DENTIST PROPS
  // ----------------------------------------------------------
  G.drawToothIcon = function (g, x, y, col) {
    col = col || '#fff';
    G.rr(g, x, y, 7, 6, col);
    G.R(g, x, y + 5, 3, 3, col); G.R(g, x + 4, y + 5, 3, 3, col);
    G.R(g, x + 1, y + 1, 2, 2, G.shade(col, -0.12));
  };

  // tool icons + cursors. id: brush|tweezers|drill|filler|spray
  G.drawTool = function (g, id, x, y, big) {
    // x,y = tip position for big cursors, center for icons
    if (id === 'brush') {
      orr(g, x - 2, y - 3, 4, 14, '#ff8fb0');
      G.R(g, x - 1, y - 2, 1, 12, '#ffc2d4');
      orr(g, x - 3, y - 8, 6, 6, '#fff');
      G.R(g, x - 3, y - 8, 6, 1, '#d8e0ea');
    } else if (id === 'tweezers') {
      orr(g, x - 1, y - 14, 3, 8, '#cdd6e0');
      G.R(g, x - 3, y - 7, 2, 5, OUT); G.R(g, x + 2, y - 7, 2, 5, OUT);
      G.R(g, x - 3, y - 2, 2, 2, '#9aa7b5'); G.R(g, x + 2, y - 2, 2, 2, '#9aa7b5');
    } else if (id === 'drill') {
      orr(g, x - 2, y - 13, 5, 8, '#8fb8d8');
      G.R(g, x - 1, y - 12, 1, 6, '#c8e0f0');
      G.R(g, x - 1, y - 5, 3, 3, OUT);
      G.R(g, x, y - 2, 1, 3, '#cdd6e0');
      G.R(g, x, y + 1, 1, 1, OUT);
    } else if (id === 'filler') {
      orr(g, x - 2, y - 14, 5, 9, '#e8e2f5');
      G.R(g, x - 1, y - 13, 1, 7, '#fff');
      G.R(g, x - 3, y - 15, 7, 2, OUT);
      G.R(g, x - 1, y - 5, 3, 3, '#9aa7b5');
      G.R(g, x, y - 2, 1, 3, OUT);
    } else if (id === 'spray') {
      orr(g, x - 3, y - 12, 7, 9, '#7fd6ff');
      G.R(g, x - 2, y - 11, 2, 7, '#c8f0ff');
      G.R(g, x - 2, y - 15, 5, 3, OUT);
      G.R(g, x + 3, y - 14, 3, 2, OUT);
      G.R(g, x - 1, y - 3, 3, 3, '#cdd6e0');
    }
  };

  // cute glove cursor
  G.drawCursor = function (g, x, y) {
    G.R(g, x, y, 2, 7, OUT); G.R(g, x + 1, y + 1, 1, 5, '#fff');
    G.R(g, x + 2, y + 2, 2, 5, OUT); G.R(g, x + 3, y + 3, 1, 3, '#fff');
    G.R(g, x + 4, y + 3, 2, 4, OUT);
    G.R(g, x, y + 6, 5, 3, OUT); G.R(g, x + 1, y + 7, 3, 1, '#fff');
  };

  // sun & moon
  G.drawSun = function (g, x, y, r, t) {
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2 + (t || 0) * 0.3;
      G.R(g, x + Math.cos(a) * (r + 3), y + Math.sin(a) * (r + 3), 2, 2, '#ffd94a');
    }
    ofc(g, x, y, r, '#ffd94a');
    G.fc(g, x - r * 0.3, y - r * 0.3, r * 0.35, '#fff3b0');
  };
  G.drawMoon = function (g, x, y, r) {
    ofc(g, x, y, r, '#fff3d6');
    G.fc(g, x + r * 0.35, y - r * 0.2, r * 0.72, '#241c2e');
    G.fc(g, x + r * 0.42, y - r * 0.24, r * 0.62, '#3d3253');
  };
})();

// ============================================================
// DOUBLE LIFE v6 - cine.js  ·  THE CAMERA
//
// A tiny shot-based cutscene player. A cutscene is a list of shots;
// each shot owns a duration, a camera move (pan, push, shear for an
// angle) and a paint function that draws the world for that shot.
// Letterbox bars come down, the line types itself in, and you can
// tap to push through.
//
// Pixel art hates rotation, so an "angle" here is a horizontal
// shear: every scanline stays a scanline, so nothing goes soft.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;
  const CO = '#d97757';

  // ------------------------------------------------------------
  // little staging helpers, shared by the shots
  // ------------------------------------------------------------
  // ------------------------------------------------------------
  // SILHOUETTES, CUT FROM THE REAL SPRITES.
  //
  // A cutscene shape used to be six rectangles stacked into a person
  // shape: a rounded head-and-shoulders, a body, two arms, two legs.
  // At a glance it passes; next to a scene full of procedurally
  // generated people with genomes and nervous habits it is a cardboard
  // cutout, and the cast in a cutscene stops being the cast.
  //
  // So a silhouette is now the ACTUAL sprite. It is drawn into a
  // scratch buffer, the buffer is flooded with one colour through
  // source-in - which keeps the fill only where there were pixels -
  // and the result is blitted back. Whatever the rig draws, the
  // silhouette is exactly that shape: the right hair, the right coat,
  // the right hat, the right number of legs.
  // ------------------------------------------------------------
  let buf = null, bg = null;
  const BW = 120, BH = 120;                       // logical, plenty for a person
  // ------------------------------------------------------------
  // AND IT HAS TO BE CHEAP.
  //
  // Every silhouette used to clear, harden and blit the WHOLE scratch
  // buffer: 120x120 logical is 480x480 native, cleared once, composited
  // over itself five times and blitted twice. That is about 1.4 million
  // pixel operations for one twenty-six-unit-tall person.
  //
  // The bomb draws twelve of them in the windows of the restaurant plus
  // five running across the car park, every frame, on top of a full
  // building rebuild. Measured: 38ms a frame on the opening shot, against
  // a 16.7ms budget. Less than half of one silhouette's buffer ever had
  // anything in it.
  //
  // So every call now names the box it actually uses and the clear, the
  // hardening and both blits are clipped to that box. Three hardening
  // passes instead of five, as well: compositing alpha over itself goes
  // 0.5 -> 0.75 -> 0.94 -> 0.996, which is a clean edge by the third.
  // ------------------------------------------------------------
  function cut(g, col, ox, oy, draw, rim, box, lift) {
    if (!buf) {
      buf = document.createElement('canvas');
      buf.width = BW * G.PX; buf.height = BH * G.PX;
      bg = buf.getContext('2d');
      bg.imageSmoothingEnabled = false;
    }
    const B = box || { x: 0, y: 0, w: BW, h: BH };
    const nx = Math.max(0, Math.floor(B.x * G.PX));
    const ny = Math.max(0, Math.floor(B.y * G.PX));
    const nw = Math.min(buf.width - nx, Math.ceil(B.w * G.PX));
    const nh = Math.min(buf.height - ny, Math.ceil(B.h * G.PX));
    if (nw <= 0 || nh <= 0) return;
    // re-colours the hardened mask in place; alpha survives, so this can
    // run twice on one draw and give you a rim pass and a body pass
    const paint = (c) => {
      bg.globalCompositeOperation = 'source-in';
      bg.fillStyle = c;
      bg.fillRect(nx, ny, nw, nh);
      bg.globalCompositeOperation = 'source-over';
    };
    bg.setTransform(1, 0, 0, 1, 0, 0);
    bg.clearRect(nx, ny, nw, nh);
    bg.setTransform(G.PX, 0, 0, G.PX, 0, 0);
    bg.globalAlpha = 1;
    draw(bg);
    bg.setTransform(1, 0, 0, 1, 0, 0);
    // HARDEN FIRST. The rig lays glows and soft rims down with
    // globalAlpha, and a mask taken straight off that comes back with a
    // halo round every character. Compositing the buffer over itself
    // drives any non-zero alpha toward 1 and leaves true zero at zero.
    for (let i = 0; i < 3; i++) bg.drawImage(buf, nx, ny, nw, nh, nx, ny, nw, nh);
    // A rim is the SAME mask, stamped a pixel toward the light in a
    // brighter colour and then covered by the dark one. The edge that
    // survives is the character's own profile, so a hood stays a hood --
    // a hand-drawn bar down the side never does that.
    if (rim) {
      paint(rim.col);
      if (lift) lift(buf, nx, ny, nw, nh);
      else g.drawImage(buf, nx, ny, nw, nh,
        ox + B.x + (rim.dx || 0), oy + B.y + (rim.dy || 0), nw / G.PX, nh / G.PX);
    }
    paint(col);
    if (lift) { lift(buf, nx, ny, nw, nh); return; }
    g.drawImage(buf, nx, ny, nw, nh, ox + B.x, oy + B.y, nw / G.PX, nh / G.PX);
  }

  // the slice of the scratch buffer a figure of height h actually fills,
  // measured from the feet at BH-8 and the centre line at BW/2
  function figBox(h, wide) {
    const halfW = h * (wide || 0.58) + 5;
    const top = (BH - 8) - h * 1.32 - 6;
    return { x: BW / 2 - halfW, y: Math.max(0, top), w: halfW * 2, h: (BH - 2) - Math.max(0, top) };
  }

  // ------------------------------------------------------------
  // AND THEN CACHE THEM.
  //
  // Clipping the buffer took the opening shot from 38ms to 32ms, which
  // says the buffer was never the whole story: the rest is drawFolk
  // itself, building a whole procedural person out of quarter-unit rows,
  // seventeen times a frame, for figures that are twenty pixels tall and
  // out of focus behind a window.
  //
  // A silhouette is a flat stamp, so it can be kept. The finished, hardened,
  // coloured mask goes in a small canvas of its own under a key that
  // includes who it is, what it is doing and WHICH SIXTH OF A SECOND it
  // is -- so a background figure still moves, at six frames a second,
  // which is what a silhouette twenty pixels tall is worth.
  // ------------------------------------------------------------
  const stamps = new Map();
  const STAMP_CAP = 220;
  function stamp(g, key, col, ox, oy, draw, rim, box) {
    let c = stamps.get(key);
    if (!c) {
      const nw = Math.ceil(box.w * G.PX), nh = Math.ceil(box.h * G.PX);
      c = document.createElement('canvas');
      c.width = Math.max(1, nw); c.height = Math.max(1, nh);
      const cg = c.getContext('2d');
      cg.imageSmoothingEnabled = false;
      // render into the shared scratch, then lift the box out of it
      cut(null, col, 0, 0, draw, rim, box, (src, sx, sy, sw, sh) => {
        cg.clearRect(0, 0, c.width, c.height);
        cg.drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh);
      });
      if (stamps.size >= STAMP_CAP) stamps.delete(stamps.keys().next().value);
      stamps.set(key, c);
    }
    g.drawImage(c, ox + box.x, oy + box.y, c.width / G.PX, c.height / G.PX);
  }

  // a person, in one colour. seed picks who; h is head-to-heel.
  function silhouette(g, x, footY, h, col, rim, o) {
    o = o || {};
    const sc = h / G.SZ.ADULT;
    const bx = Math.round(x - BW / 2), by = Math.round(footY - BH + 8);
    const seed = o.seed === undefined ? x * 0.37 + h : o.seed;
    const ct = o.ct === undefined ? (o.t || 0) : o.ct;
    const rm = rim === true ? { col: '#a06a4c', dx: -0.5, dy: -0.5 } : rim || null;
    const box = figBox(h);
    const draw = (gg) => {
      G.drawFolk(gg, BW / 2, BH - 8, sc, {
        t: o.t || 0, seed,
        clip: o.clip, ct, dir: o.dir,
        p: o.p, smile: o.smile, hat: o.hat, noQuirk: o.noQuirk,
      });
    };
    // p is a continuous performance value (a reach, a startle), so
    // anything driving one is drawn live; everybody else is a stamp
    if (o.p !== undefined || o.live) {
      cut(g, col, bx, by, draw, rm, box);
      return;
    }
    const key = seed + '|' + Math.round(h) + '|' + col + '|' + (o.clip || 'idle') + '|'
      + (o.dir || 0) + '|' + (o.hat || '-') + '|' + (o.smile ? 1 : 0) + '|'
      + (rm ? rm.col : '-') + '|' + Math.floor(ct * 6);
    stamp(g, key, col, bx, by, draw, rm, box);
  }
  function rain(g, t, n, col, x0, x1) {
    for (let i = 0; i < n; i++) {
      const s = G.hash(i * 3.1, 7.7);
      const x = x0 + ((s * (x1 - x0) + t * 24 * (0.6 + s)) % (x1 - x0));
      const y = ((G.hash(i, 2) * 200 + t * (150 + s * 120)) % 210) - 20;
      G.Rh(g, x, y, 0.5, 3 + s * 3, col);
    }
  }
  function skyline(g, y, h, seed, col, lit) {
    let x = -10;
    while (x < 340) {
      const w = 12 + Math.round(G.hash(x, seed) * 26);
      const hh = 14 + Math.round(G.hash(x + 3, seed + 1) * h);
      G.R(g, x, y - hh, w, hh, col);
      G.hair(g, x, y - hh, w, G.shade(col, 0.3));
      for (let wy = y - hh + 4; wy < y - 3; wy += 5)
        for (let wx = x + 2; wx < x + w - 2; wx += 4)
          if (G.hash(wx, wy + seed) > 0.62) G.Rh(g, wx, wy, 1.5, 2, lit);
      x += w + 2;
    }
  }
  function floorPool(g, cx, y, w, col, a) {
    g.globalAlpha = a; G.rr(g, cx - w / 2, y, w, 6, col); g.globalAlpha = 1;
  }



  // HER FRONT ROOM was built here too, in browns, for those shots. One
  // room, drawn twice, by two files, that had already drifted apart --
  // hers has mint stripes and bunting and a cat. G.tracyRoom in tracy.js
  // is the only copy there is now, and the raid uses that one.

  // ------------------------------------------------------------
  // THE OUTSIDE OF BIG MOO. Act one ends inside the room with a
  // darken and a whiteout, which is a fade, not an explosion. So
  // the camera goes out into the car park instead and watches the
  // front of the building come off. One builder, five states, so
  // every shot is the same corner of the same street.
  //   o.blast  0..1  the front coming out
  //   o.burn   0..1  fire in the holes afterwards
  //   o.sign   0..1  the mascot sign coming off its post
  // ------------------------------------------------------------
  function bigmoo(g, tt, o) {
    o = o || {};
    const bl = o.blast || 0, bn = o.burn || 0, sg = o.sign || 0;
    const GY = 132;                                    // the tarmac line
    // sky and city
    for (let j = 0; j < GY; j++)
      G.Rh(g, 0, j, G.W, 1, G.mix('#0b1018', '#241a26', Math.pow(j / GY, 0.8)));
    skyline(g, GY - 22, 44, 91, '#080c14', '#243040');
    // the tarmac, wet
    G.R(g, 0, GY, G.W, G.H - GY, '#191720');
    for (let i = 0; i < 30; i++) {
      const px = G.hash(i, 7) * G.W, pw = 10 + G.hash(i, 11) * 40;
      g.globalAlpha = 0.16 + G.hash(i, 13) * 0.14;
      G.rr(g, px, GY + 4 + G.hash(i, 17) * 40, pw, 3, '#4a6a8a');
      g.globalAlpha = 1;
    }
    // ---- the unit itself: a low box on the corner ----
    const BX = 54, BW = 214, BT = 52;
    G.R(g, BX, BT, BW, GY - BT, '#2a2028');
    G.R(g, BX, BT, BW, 5, '#8a2f3a');                  // the red fascia band
    G.hair(g, BX, BT, BW, '#c8505c');
    G.R(g, BX, BT + 5, BW, 3, '#4a3038');
    // the glass front: four bays. They go one by one when it blows.
    for (let i = 0; i < 4; i++) {
      const gx = BX + 10 + i * 50, gw = 42, gy = BT + 14, gh = GY - gy - 8;
      const gone = bl > 0.1 + i * 0.06;
      G.R(g, gx - 2, gy - 2, gw + 4, gh + 4, '#c8b490');
      if (gone) {
        G.R(g, gx, gy, gw, gh, '#0a0810');             // a hole
        if (bn > 0) {
          // ---- FIRE. Banded rows the width of the hole read as sand
          // dunes lit orange. Fire is a row of TONGUES: narrow columns
          // that taper to a point and are each a different height on
          // every frame. ----
          const base = gy + gh - 2;
          const nt = 7;
          for (let k = 0; k < nt; k++) {
            const tx = gx + 3 + k * ((gw - 6) / (nt - 1));
            const wob = Math.sin(tt * 9 + k * 1.9 + i * 3.1) * 0.5 + 0.5;
            const th2 = Math.max(3, Math.round(gh * (0.16 + bn * 0.34) * (0.45 + wob * 0.85)));
            for (let j2 = 0; j2 < th2; j2++) {
              const q = 1 - j2 / th2;                  // q: 1 at the base
              const hw2 = Math.max(0.5, 2.6 * Math.pow(q, 0.6));
              G.Rh(g, tx - hw2 + Math.sin(tt * 6 + j2 * 0.6 + k) * (1 - q) * 2,
                base - th2 + j2, hw2 * 2, 1,
                q > 0.9 ? '#ffe6a0' : q > 0.62 ? '#ffc046' : q > 0.28 ? '#ff7a20' : '#a8300c');
            }
          }
          // and a bed of embers along the bottom of the hole
          for (let k = 0; k < 9; k++)
            G.Rq(g, gx + 3 + k * ((gw - 6) / 8), base + 0.5,
              1.5, 1.5, Math.sin(tt * 5 + k * 2) > 0 ? '#ff8a3a' : '#8a2a08');
          G.glow(g, gx + gw / 2, gy + gh - 8, gw * 1.6, gh * 0.8, '#ff8a3a', 0.34 * bn);
        }
      } else {
        // IT IS WARM IN THERE. The bays used to be painted a cold navy
        // with a weak yellow glow over them, so the restaurant looked shut
        // before anything happened to it and the blackout afterwards cost
        // nothing. There is a birthday going on behind this glass.
        G.R(g, gx, gy, gw, gh, '#3a2a20');
        for (let j = 0; j < gh; j++)
          G.Rh(g, gx, gy + j, gw, 1, G.mix('#ffcf88', '#c8763a', j / gh));
        G.glow(g, gx + gw / 2, gy + gh * 0.5, gw * 1.5, gh * 1.6, '#ffbe6a', 0.7);
        // and it throws light down onto the wet in front of it
        g.globalAlpha = 0.2;
        G.rr(g, gx - 4, GY + 2, gw + 8, 5, '#ffbe6a');
        g.globalAlpha = 1;
        // shapes in the window, before it goes. Real people, cut out of
        // the warm light - it is a birthday in there.
        for (let k = 0; k < 3; k++) {
          const sx = gx + 8 + k * 13;
          const kid = (i + k) % 3 === 1;
          silhouette(g, sx + 3, gy + gh - 2, kid ? 17 : 26, '#3a2a30', false,
            { seed: 2.9 + i * 5.3 + k * 11.7, t: tt, ct: tt + k * 1.3,
              clip: (i + k) % 4 === 0 ? 'talk' : 'idle', dir: k % 2 ? -1 : 1,
              hat: kid ? 'crown' : undefined });
        }
        G.Rh(g, gx + gw / 2 - 0.75, gy, 1.5, gh, '#c8b490');
        G.Rh(g, gx, gy + gh / 2, gw, 1.5, '#c8b490');
      }
    }
    // ---- the mascot sign, on a post at the kerb ----
    // It used to draw its own cow here -- ears, skull, two dots, muzzle -
    // which is a third cow in a codebase that now has exactly one.
    const spx = 288;
    G.R(g, spx - 2, GY - 62, 5, 62, '#3a3440');
    G.hairq(g, spx - 2, GY - 62, 62, '#5c5468');
    g.save();
    if (sg > 0) {                                      // it snaps and falls
      g.translate(spx, GY - 58); g.rotate(sg * 1.5); g.translate(-spx, -(GY - 58));
    }
    // the lit box it sits in
    G.rr2(g, spx - 24, GY - 88, 48, 46, '#8a2f3a');
    G.rr2(g, spx - 22, GY - 86, 44, 42, sg > 0 ? '#4a3a38' : '#f6ecd6');
    G.mooLogo(g, spx, GY - 65, 19, { flat: 1, tone: sg > 0 ? '#4a3a38' : '#f6ecd6' });
    if (!sg) G.glow(g, spx, GY - 65, 78, 74, '#ffd45a', 0.42);
    g.restore();
    return { GY, BX, BW, BT, spx };
  }

  // ------------------------------------------------------------
  // the good years, and the nine days that ended them
  // ------------------------------------------------------------
  function sunSky(g, t, warm) {
    for (let j = 0; j < G.H; j++) {
      const p = j / G.H;
      G.Rh(g, 0, j, G.W, 1, G.mix(warm ? '#5fc8e8' : '#2a3550',
        warm ? '#ffe0a8' : '#6b5570', Math.pow(p, 0.7)));
    }
    G.fc(g, 250, 34, 13, '#fff6d0');
    G.glow(g, 250, 34, 150, 110, '#ffe08a', 0.7);
    for (let i = 0; i < 5; i++) {                      // gulls
      const gx = ((t * 9 + i * 71) % 380) - 30, gy = 20 + (i % 3) * 11 + Math.sin(t + i) * 2;
      const fl = Math.sin(t * 4 + i * 2) * 2;
      G.Rh(g, gx, gy, 3, 1, '#f6f2e4');
      G.Rh(g, gx - 3, gy - fl, 3, 1, '#f6f2e4');
      G.Rh(g, gx + 3, gy + fl, 3, 1, '#f6f2e4');
    }
    // fat summer clouds
    for (let i = 0; i < 4; i++) {
      const cx2 = ((t * 3 + i * 97) % 400) - 40, cy2 = 26 + (i % 2) * 16;
      for (let k = 0; k < 4; k++)
        G.fe(g, cx2 + k * 9, cy2 + Math.sin(k) * 2, 9 - k, 5 - k * 0.6, '#fffaf0');
    }
  }
  function sea(g, y, t, col, lit) {
    G.R(g, 0, y, G.W, G.H - y, col);
    for (let j = 0; j < 26; j += 2) {
      const yy = y + j;
      for (let i = 0; i < 9; i++) {
        const sx = ((G.hash(j, i) * 340) + Math.sin(t * 0.8 + j * 0.4 + i) * 9) % 340 - 10;
        G.Rh(g, sx, yy, 3 + (j % 3), 1, j < 8 ? lit : G.shade(col, 0.24));
      }
    }
  }
  function promenade(g, y, col, rail) {
    G.R(g, 0, y, G.W, G.H - y, col);
    G.hair(g, 0, y, G.W, G.shade(col, 0.4));
    for (let x = -6; x < 330; x += 22) {              // paving joints
      G.vseam(g, x, y + 2, G.H - y - 2, G.shade(col, -0.34), G.shade(col, 0.2));
    }
    if (rail !== false) {
      G.R(g, 0, y - 15, G.W, 2, '#e8e0d0');
      G.hair(g, 0, y - 15, G.W, '#ffffff');
      for (let x = 4; x < 330; x += 20) {
        G.R(g, x, y - 15, 2, 15, '#d8d0c0');
        G.vair(g, x, y - 15, 15, '#ffffff');
      }
      G.R(g, 0, y - 8, G.W, 1, '#c8c0b0');
    }
  }
  // a crowd, in silhouette, at whatever distance. run > 0 puts them all
  // in a stride, which is the difference between a queue and a rout.
  function crowd(g, y, n, t, col, x0, x1, sc, run) {
    for (let i = 0; i < n; i++) {
      const s = G.hash(i * 2.7, 5.3);
      const x = x0 + s * (x1 - x0);
      const h = (12 + s * 8) * (sc || 1);
      const ph = t * (run ? 5 + s * 2 : 1.6) + i * 1.7;
      const bob = Math.sin(ph * 2) * (run ? 1.2 : 0.6);
      const sw = Math.sin(ph);
      const dir = run ? (s > 0.5 ? 1 : -1) : 0;
      G.fe(g, x + dir * h * 0.06, y - h - 1 + bob, h * 0.19, h * 0.2, col);
      G.R(g, x - h * 0.15, y - h * 0.84 + bob, h * 0.3, h * 0.46, col);   // torso
      // arms, thrown forward and back when they are running
      G.R(g, x - h * 0.28 + dir * sw * h * 0.16, y - h * 0.78 + bob, h * 0.12, h * 0.3, col);
      G.R(g, x + h * 0.16 - dir * sw * h * 0.16, y - h * 0.78 + bob, h * 0.12, h * 0.3, col);
      // legs, striding
      for (const sd of [-1, 1]) {
        const st = sd * sw * (run ? h * 0.2 : 0);
        for (let j = 0; j < Math.max(2, h * 0.4); j++) {
          const q = j / Math.max(1, h * 0.4);
          G.R(g, x - h * 0.14 + (sd > 0 ? h * 0.12 : 0) + st * q, y - h * 0.4 + bob + j,
            Math.max(1, h * 0.11), 1, col);
        }
      }
    }
  }
  // the same crowd, but the heads turn to look at something, left to
  // right, in a wave. p is how far through the turn the shot is.
  function crowdLook(g, y, n, t, col, x0, x1, sc, p) {
    for (let i = 0; i < n; i++) {
      const s = G.hash(i * 2.7, 5.3);
      const x = x0 + s * (x1 - x0);
      const h = (12 + s * 8) * (sc || 1);
      const own = i / n;                              // when this one notices
      const turned = G.clamp((p - own * 0.5) * 4, 0, 1);
      const bob = Math.sin(t * 1.6 + i) * 0.6 * (1 - turned);
      const tilt = turned * h * 0.1;
      G.fe(g, x + tilt, y - h - 1 + bob - turned * 1.5, h * 0.19, h * 0.2, col);
      G.R(g, x - h * 0.15, y - h * 0.84 + bob, h * 0.3, h * 0.46, col);
      // an arm goes up to point, on the ones that have seen it
      if (turned > 0.6) G.R(g, x + h * 0.14, y - h * 0.9, h * 0.1, h * 0.3, col);
      else G.R(g, x + h * 0.16, y - h * 0.78 + bob, h * 0.12, h * 0.3, col);
      G.R(g, x - h * 0.28, y - h * 0.78 + bob, h * 0.12, h * 0.3, col);
      for (const sd of [-1, 1])
        for (let j = 0; j < Math.max(2, h * 0.4); j++)
          G.R(g, x - h * 0.14 + (sd > 0 ? h * 0.12 : 0), y - h * 0.4 + bob + j,
            Math.max(1, h * 0.11), 1, col);
    }
  }

  // a siege silhouette, drawn as a shape rather than a rig, so it can be
  // three hundred feet tall without falling apart
  function mech(g, x, footY, h, col, t, glowCol, ph) {
    const w = h * 0.62;
    // a stride, if the caller gives it one: the legs swing and the hull
    // rocks, which is the difference between walking and standing
    const sw = ph === undefined ? 0 : Math.sin(ph) * h * 0.09;
    const rock = ph === undefined ? 0 : Math.abs(Math.cos(ph)) * h * 0.02;
    footY -= rock;
    G.R(g, x - w * 0.24 + sw, footY - h * 0.42, w * 0.16, h * 0.42 + rock, col);   // legs
    G.R(g, x + w * 0.08 - sw, footY - h * 0.42, w * 0.16, h * 0.42 + rock, col);
    G.R(g, x - w * 0.3 + sw, footY - 2, w * 0.24, 3, col);
    G.R(g, x + w * 0.06 - sw, footY - 2, w * 0.24, 3, col);
    G.R(g, x - w * 0.5, footY - h * 0.86, w, h * 0.46, col);           // hull
    G.R(g, x - w * 0.62, footY - h * 0.82, w * 0.16, h * 0.3, col);    // shoulders
    G.R(g, x + w * 0.46, footY - h * 0.82, w * 0.16, h * 0.3, col);
    G.R(g, x - w * 0.24, footY - h, w * 0.48, h * 0.2, col);           // head
    G.R(g, x + w * 0.2, footY - h * 0.76, w * 0.62, h * 0.09, col);    // gun
    if (glowCol) {
      G.Rh(g, x - w * 0.14, footY - h * 0.94, w * 0.28, h * 0.05, glowCol);
      G.glow(g, x, footY - h * 0.92, w * 1.1, h * 0.2, glowCol, 0.55);
    }
  }
  // a burning sky: cloud banks lit from below, tracer, and the flash
  function warSky(g, t, p) {
    for (let j = 0; j < 130; j++) {
      const q = j / 130;
      G.Rh(g, 0, j, G.W, 1, G.mix('#1a0e14', '#7a2418', Math.pow(q, 0.8)));
    }
    for (let i = 0; i < 7; i++) {                     // cloud banks, underlit
      const cy2 = 16 + i * 13, cw = 60 + G.hash(i, 3) * 120;
      const cx2 = ((G.hash(i, 7) * 340) + t * (2 + i * 0.4)) % 400 - 40;
      const cc = G.mix('#2a1620', '#c85030', 1 - i / 8);
      G.fe(g, cx2, cy2, cw * 0.5, 7, G.mix(cc, '#0f0810', 0.45));
      G.fe(g, cx2, cy2 + 3, cw * 0.42, 4, cc);
      G.hair(g, cx2 - cw * 0.3, cy2 + 6, cw * 0.6, G.mix(cc, '#ffb060', 0.5));
    }
    for (let i = 0; i < 4; i++) {                     // searchlights
      const a = -1.3 + Math.sin(t * 0.35 + i * 1.7) * 0.5;
      const bx2 = 30 + i * 82;
      for (let r = 0; r < 150; r += 3) {
        g.globalAlpha = 0.11 * (1 - r / 150);
        G.Rh(g, bx2 + Math.cos(a) * r - r * 0.03, 126 + Math.sin(a) * r, 2 + r * 0.06, 3, '#cfe4ff');
        g.globalAlpha = 1;
      }
    }
    for (let i = 0; i < 14; i++) {                    // tracer, arcing
      const q = ((t * 0.7 + i * 0.37) % 1);
      const tx = 20 + i * 23 + q * 46, ty = 140 - q * 118 + q * q * 44;
      G.Rh(g, tx, ty, 1.5, 3, i % 3 ? '#ffd47a' : '#ff9a5a');
      G.Rh(g, tx, ty + 3, 1, 4, '#c8602a');
    }
    // the shell flash
    const fl = Math.max(0, Math.sin(t * 1.9 + p * 3));
    if (fl > 0.86) {
      g.globalAlpha = (fl - 0.86) * 5;
      G.R(g, 0, 0, G.W, G.H, '#ffd9a0');
      g.globalAlpha = 1;
    }
  }

  // ------------------------------------------------------------
  // BIG MOO. A burger chain with a cow on the sign, open twenty-four
  // hours, and for six years you were the cow. Everything in the
  // opening is built out of these four painters.
  // ------------------------------------------------------------
  function neonTube(g, pts, col, on, w) {
    for (const q of pts) G.Rh(g, q[0] - (w || 1), q[1] - (w || 1), (w || 1) * 2, (w || 1) * 2, '#1a1220');
    for (const q of pts) {
      G.Rh(g, q[0] - (w || 1) * 0.5, q[1] - (w || 1) * 0.5, (w || 1), (w || 1),
        on > 0.5 ? col : G.mix(col, '#241826', 0.72));
    }
  }
  function mooSign(g, cx, y, t, o) {
    o = o || {};
    const dead = o.dead;
    const flick = dead ? 0 : (Math.sin(t * 27) > -0.9 && Math.sin(t * 3.1) > -0.95 ? 1 : 0.2);
    const pink = '#ff8ab0', gold = '#ffd45a';
    G.rr2(g, cx - 46, y - 1, 92, 42, '#080c14');
    G.rr2(g, cx - 45, y, 90, 40, '#18202e');
    G.bevelq(g, cx - 45, y, 90, 40, '#33425a', '#0a0f18');
    // the cow's head, in tube: a rounded skull, two ears, two eyes
    const hd = [];
    for (let i = 0; i <= 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      hd.push([cx + Math.cos(a) * 14, y + 13 + Math.sin(a) * 10]);
    }
    neonTube(g, hd, pink, flick, 1.5);
    // ears, drooping off each side
    neonTube(g, [[cx - 16, y + 12], [cx - 19, y + 14], [cx - 22, y + 15],
                 [cx + 16, y + 12], [cx + 19, y + 14], [cx + 22, y + 15]], pink, flick, 1.5);
    // a muzzle across the bottom of the head
    neonTube(g, [[cx - 6, y + 19], [cx - 3, y + 21], [cx, y + 21.5], [cx + 3, y + 21], [cx + 6, y + 19]],
      pink, flick, 1.5);
    neonTube(g, [[cx - 5, y + 10], [cx + 5, y + 10]], flick > 0.5 ? '#ffffff' : pink, flick, 2);
    neonTube(g, [[cx - 8, y - 1], [cx - 6, y - 3], [cx + 6, y - 3], [cx + 8, y - 1]], gold, flick, 1.5);
    if (flick > 0.5) G.glow(g, cx, y + 13, 90, 60, pink, 0.4);
    // the name
    G.text(g, 'BIG MOO', cx, y + 27, flick > 0.5 ? gold : '#6b5220', { align: 'center' });
    if (flick > 0.5) G.glow(g, cx, y + 30, 80, 22, gold, 0.35);
    G.text(g, 'OPEN 24 HRS', cx, y + 35, dead ? '#3a3040' : '#7fd8ff', { align: 'center', sc: 0.5 });
  }
  // wet tarmac: a flat dark ground that keeps the light that fell on it
  function wet(g, y, h, t, lights) {
    for (let j = 0; j < h; j++)
      G.Rh(g, 0, y + j, G.W, 1, G.mix('#161d2a', '#0a0e16', j / h));
    for (const L of lights || []) {
      g.globalAlpha = 0.24;
      for (let j = 0; j < 26; j++) {
        const w = L[2] * (1 - j / 30);
        G.Rh(g, L[0] - w / 2 + Math.sin(t * 2 + j * 0.7) * (j * 0.12), y + j, w, 1, L[1]);
      }
      g.globalAlpha = 1;
    }
    for (let i = 0; i < 26; i++) {
      const px = G.hash(i, 5) * 340 - 10, py = y + G.hash(i, 9) * h;
      g.globalAlpha = 0.3;
      G.rr(g, px, py, 6 + G.hash(i, 3) * 16, 2, '#3a4a63');
      g.globalAlpha = 1;
    }
  }
  // the shop front, seen from the car park
  function mooFront(g, tt, o) {
    o = o || {};
    for (let j = 0; j < 110; j++)
      G.Rh(g, 0, j, G.W, 1, G.mix('#0a1020', '#22213a', j / 110));
    skyline(g, 96, 34, 5, '#0a1018', '#2e3c58');
    // the building: a long low box with a lit window band
    G.R(g, 26, 62, 236, 52, '#2a3242');
    G.bevelq(g, 26, 62, 236, 52, '#414f66', '#151b26');
    G.R(g, 26, 58, 236, 6, '#8a2f3a');                 // the fascia stripe
    G.hairq(g, 26, 58, 236, '#c8505c');
    for (let i = 0; i < 12; i++) G.R(g, 30 + i * 20, 58, 10, 6, '#f0e2d4');
    // the window band, warm inside - or blown out and dark
    const wr = o.wrecked;
    G.R(g, 34, 70, 100, 34, wr ? '#0e1420' : '#ffd9a0');
    G.R(g, 168, 70, 86, 34, wr ? '#0e1420' : '#ffd9a0');
    for (const wx of [34, 168]) {
      const ww = wx === 34 ? 100 : 86;
      G.bevelq(g, wx, 70, ww, 34, wr ? '#2c3a4e' : '#fff2d8', wr ? '#060a10' : '#c89a58');
      for (let i = 1; i * 24 < ww; i++) G.Rh(g, wx + i * 24, 70, 1.5, 34, '#2a3242');
      if (!wr) G.glow(g, wx + ww / 2, 88, ww + 40, 70, '#ffbe6a', 0.4);
      else for (let i = 0; i < 7; i++)                 // the teeth left in the frame
        G.Rh(g, wx + 4 + i * (ww / 7), 70, 3 + G.hash(i, 3) * 5, 4 + G.hash(i, 9) * 8, '#3a4a63');
    }
    // people in the windows, cut out of the warm light
    if (!wr) for (let i = 0; i < 6; i++) {
      const bx = 44 + i * 32 + (i > 2 ? 40 : 0);
      if (bx > 250) continue;
      silhouette(g, bx, 102, 15 + (i % 3) * 4, '#9a5a34', false,
        { seed: 4.1 + i * 6.7, t: tt, clip: i % 3 === 1 ? 'talk' : 'idle', ct: tt + i, dir: i % 2 ? -1 : 1 });
    }
    // the door, and the light it throws across the wet
    G.R(g, 138, 68, 26, 46, '#141b26');
    G.R(g, 141, 71, 20, 40, wr ? '#1a222e' : '#ffe6b8');
    G.Rh(g, 150, 71, 1.5, 40, '#141b26');
    if (!wr) G.glow(g, 151, 100, 90, 70, '#ffcf88', 0.45);
    // the sign, up its pole
    G.R(g, 272, 50, 5, 64, '#232b38');
    G.hairq(g, 272, 50, 5, '#465468');
    if (!o.noSign) mooSign(g, 274, 18, tt, { dead: o.dead });
    // the car park
    wet(g, 114, 66, tt, o.wrecked ? [[150, '#ff7a2a', 40]] : [[151, '#ffcf88', 30], [274, '#ff8ab0', 20]]);
    for (let i = 0; i < 5; i++) G.Rh(g, 20 + i * 62, 148, 34, 1, '#5a6a80');
  }
  // The dining room, from the stage end. Everything lives between
  // y=28 and y=170 so a 1.06 push still holds the whole set.
  function diner(g, tt, o) {
    o = o || {};
    const dim = o.dim || 0;
    const M = (c) => G.mix(c, '#241018', dim);
    // back wall: cream above a red dado
    G.R(g, 0, 0, G.W, 98, M('#f6e8d4'));
    G.R(g, 0, 0, G.W, 22, M('#8a2f3a'));
    G.hairq(g, 0, 22, G.W, M('#c8505c'));
    for (let i = 0; i < 20; i++) {                     // glazed tiles
      G.Rh(g, i * 17 + 1, 56, 15, 13, M('#eddcc4'));
      G.hairq(g, i * 17 + 1, 56, 15, M('#fff6ea'));
      G.Rh(g, i * 17 + 1, 71, 15, 8, M('#e6d3b8'));
    }
    G.R(g, 0, 51, G.W, 3, M('#c8505c'));
    // bunting, because somebody put it up for a birthday
    if (!o.noBunting) for (let i = 0; i < 13; i++) {
      const bx2 = 8 + i * 25, sag = Math.sin(i * 0.8 + tt * 0.6) * 2;
      G.Rh(g, bx2, 24 + sag, 5, 6, ['#ffd45a', '#8fd8c0', '#ff8ab0', '#7fd8ff'][i % 4]);
      G.Rh(g, bx2 + 1, 30 + sag, 3, 2, '#e0b040');
    }
    // the menu board, over the counter
    G.R(g, 92, 30, 136, 19, M('#1a1216'));
    G.bevelq(g, 92, 30, 136, 19, M('#3a2a2e'), '#0a0608');
    G.text(g, 'BURGER   SWIRL   FRIES', 160, 33, M('#ffd45a'), { align: 'center', sc: 0.5 });
    G.text(g, 'ASK ABOUT THE BIG MOO MEAL', 160, 41, M('#f0e2d4'), { align: 'center', sc: 0.5 });
    G.glow(g, 160, 40, 150, 28, '#ffd45a', 0.12 * (1 - dim));
    // the soft serve machine, standing on the counter
    G.plate(g, 246, 54, 24, 24, M('#c8ccd4'), { r: 1, band: 2, bolts: 1 });
    G.R(g, 251, 58, 13, 8, M('#3a4250'));
    G.Rh(g, 253, 60, 4, 4, M('#8fd8c0'));
    G.R(g, 255, 78, 6, 4, M('#8a94a8'));
    G.fe(g, 258, 83, 4, 3, M('#f6e8d4'));
    // the counter itself
    G.R(g, 62, 78, 196, 4, M('#e8d6b8'));
    G.hairq(g, 62, 78, 196, M('#fff6ea'));
    G.R(g, 62, 82, 196, 16, M('#8a5c3a'));
    G.bevelq(g, 62, 82, 196, 16, M('#b07a4a'), M('#4a2c18'));
    for (let i = 0; i < 10; i++) G.vseam(g, 66 + i * 20, 84, 12, M('#3a2418'), M('#b07a4a'));
    G.R(g, 62, 96, 196, 3, M('#4a2c18'));
    g.globalAlpha = 0.24; G.R(g, 58, 99, 204, 4, '#000000'); g.globalAlpha = 1;
    // a stack of trays and a till
    G.R(g, 78, 71, 20, 7, M('#c8505c'));
    for (let k = 0; k < 3; k++) G.hairq(g, 78, 72 + k * 2, 20, M('#e8828c'));
    G.plate(g, 108, 64, 18, 14, M('#3a4250'), { r: 1, band: 1, spec: false });
    G.Rh(g, 111, 67, 12, 4, M('#8fd8c0'));
    // the floor: a checker with its columns radiating from the middle,
    // so the rows actually line up instead of staircasing
    // A FLAT checker. Perspective tiling at this raster turns into
    // herringbone the moment the column edges wander, and a straight
    // checkerboard is what a diner floor reads as anyway. Depth comes
    // from the tone falling off toward the back instead.
    for (let j = 0; j < 15; j++) {
      const yy = 98 + j * 6;
      if (yy > 182) break;
      const d = Math.max(0, 0.34 - j * 0.05);
      for (let i = 0; i < 28; i++)
        G.Rh(g, i * 12 - 6, yy, 12, 6,
          (i + j) % 2 ? G.mix(M('#ecdfcc'), '#241018', d) : G.mix(M('#c4767c'), '#241018', d));
    }
    g.globalAlpha = 0.2; G.R(g, 0, 98, G.W, 10, '#3a1a20'); g.globalAlpha = 1;
    // booths against each side wall, sitting on the floor
    if (!o.noBooths) for (const sd of [-1, 1]) {
      const bx = sd < 0 ? -8 : 266;
      G.R(g, bx, 92, 62, 8, M('#c8505c'));
      G.R(g, bx + 4, 100, 54, 22, M('#8a2f3a'));
      G.hairq(g, bx, 92, 62, M('#e8828c'));
      G.R(g, bx + 8, 112, 46, 4, M('#c8a070'));        // the table top
      G.R(g, bx + 28, 116, 6, 12, M('#8a6a44'));
    }
  }

  // a pane letting go: shards on their own arcs
  function shards(g, cx, cy, p, n, col) {
    for (let i = 0; i < n; i++) {
      const a = G.hash(i, 3) * 2.6 - 1.3, sp = 30 + G.hash(i, 7) * 90;
      const sx = cx + Math.cos(a) * sp * p, sy = cy + Math.sin(a) * sp * p + p * p * 60;
      const sz = 1 + G.hash(i, 11) * 3;
      G.Rh(g, sx, sy, sz, sz * 1.6, col || '#bfe4ff');
      G.Rq(g, sx, sy, 1, 1, '#ffffff');
    }
  }

  // ------------------------------------------------------------
  // THE ROAD HOME. A wet terrace at four in the morning, scrolling if
  // the shot wants it to, with her shop on the end of it.
  // ------------------------------------------------------------
  function street(g, tt, o) {
    o = o || {};
    const sc = o.scroll || 0, GY = 152;
    for (let j = 0; j < GY; j++)
      G.Rh(g, 0, j, G.W, 1, G.mix('#080b12', '#1c1824', Math.pow(j / GY, 0.8)));
    // the terrace behind, scrolling
    for (let i = -1; i < 8; i++) {
      const x = ((i * 58 - sc) % 464 + 464) % 464 - 72;
      G.R(g, x, 58, 54, GY - 58, '#231e2a');
      G.bevelq(g, x, 58, 54, GY - 58, '#332c3c', '#141018');
      for (let k = 0; k < 3; k++) {
        const lit = G.hash(i * 3.1 + k, 7) > 0.72;
        G.R(g, x + 8 + k * 14, 70, 9, 12, lit ? '#c89a4a' : '#151220');
        if (lit) G.glow(g, x + 12 + k * 14, 76, 26, 24, '#ffbe6a', 0.3);
      }
      G.R(g, x + 4, 54, 46, 5, '#2e2634');
    }
    // her shop, if this is the end of the road
    if (o.shop) {
      G.R(g, 78, 52, 108, GY - 52, '#2a2230');
      G.bevelq(g, 78, 52, 108, GY - 52, '#463a4e', '#160f1a');
      G.R(g, 82, 56, 100, 8, '#8a2f4a');
      G.text(g, "TRACY'S", 132, 57, '#f6ecd6', { align: 'center', sc: 0.5 });
      // the window with the gingham in it
      G.R(g, 138, 76, 40, 44, '#141020');
      for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++)
        G.Rh(g, 140 + i * 4, 78 + j * 4, 4, 4, (i + j) % 2 ? '#5c4450' : '#3a2c38');
      G.R(g, 96, 92, 36, 60, '#1a1420');
      G.bevelq(g, 96, 92, 36, 60, '#3a3040', '#0e0a14');
      G.Rh(g, 100, 98, 28, 18, '#221a28');
    }
    // the road, wet
    G.R(g, 0, GY, G.W, G.H - GY, '#12101a');
    G.hairq(g, 0, GY, G.W, '#2e2838');
    for (let i = 0; i < 16; i++) {
      const px = ((G.hash(i, 7) * 340 - sc * 0.6) % 360 + 360) % 360 - 20;
      g.globalAlpha = 0.2;
      G.rr(g, px, GY + 4 + G.hash(i, 11) * 20, 14 + G.hash(i, 13) * 30, 3, '#3a5a7a');
      g.globalAlpha = 1;
    }
    // a street light every so often, and what it puts on the wet
    for (let i = 0; i < 3; i++) {
      const lx = ((i * 118 - sc * 0.9) % 354 + 354) % 354 - 20;
      G.R(g, lx - 1, 30, 3, GY - 30, '#1a1622');
      G.R(g, lx - 7, 28, 15, 4, '#2a2432');
      G.fc(g, lx, 33, 3, '#ffd9a0');
      G.glow(g, lx, 40, 70, 90, '#ffbe6a', 0.34 + (o.lit || 0) * 0.3);
      g.globalAlpha = 0.16;
      G.rr(g, lx - 16, GY + 6, 32, 5, '#ffbe6a');
      g.globalAlpha = 1;
    }
  }

  // ------------------------------------------------------------
  // THE CUTSCENES
  // Each shot: { t, say, who, cam:{x,y,z,sh -> to}, paint(g, p, tt) }
  // p is 0..1 through the shot; tt is absolute time for animation.
  // ------------------------------------------------------------
  const CUT = {
    // ---------------- the opening: the summer, and the nine days ----------------
    // Every shot has something moving in it that is not the camera, and
    // somebody in it says something. A shot where neither happens is a
    // caption with a picture over it.
    // ---------------- she finds you ----------------
    // ---------------- she finds you ----------------
    found: [
      { t: 5.0, who: null, say: 'SIX HOURS OF RAIN. THEN A TORCH.',
        cam: { z: [1.4, 1.2], x: [150, 162], y: [116, 108] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0a0d14');
          for (let j = 0; j < 50; j++)
            G.Rh(g, 0, 100 + j, G.W, 1, G.mix('#1a1218', '#07090d', j / 40));
          for (let i = 0; i < 40; i++) {              // the rubble she is picking through
            const sx = G.hash(i, 3) * 344 - 12, sy = 108 + G.hash(i, 9) * 54;
            const sw = 6 + G.hash(i, 5) * 24;
            const cc = G.mix(['#3a4459', '#5c3630', '#8a2f3a', '#4a4a54'][i % 4], '#07090d', 0.4);
            G.R(g, sx, sy, sw, 4, cc);
            G.hairq(g, sx, sy, sw, G.shade(cc, 0.4));
          }
          // you, face down, one leg short
          G.drawBot(g, 'player', 128, 140, 0.95, {
            t: tt, mood: 'sick', walk: 0, crawl: 1, noBlink: Math.sin(tt * 1.3) > 0 ? 0 : 1,
            clip: 'slump', ct: tt, hands: [{ x: 102, y: 126 }, { x: 156, y: 130 }],
          });
          // her torch, coming down the slope
          const bx = 262 - p * 52;
          G.glow(g, bx - 18, 118, 130, 78, '#ffd47a', 0.6);
          G.drawTracy(g, bx, 142, 0.95, { t: tt, clip: 'walk', ct: tt, dir: -1, speed: 0.8, torch: 1 });
          for (let i = 0; i < 16; i++)
            G.Rh(g, bx - 12 - i * 3.4, 118 + i * 0.9, 2, 1, '#ffd47a');
          rain(g, tt, 70, '#33445f', 0, 320);
        } },

      { t: 5.4, who: 'TRACY', col: '#ffd0dc',
        say: "OH, YOU POOR ARTICLE. YOU'RE THE COW OFF THE SIGN.",
        cam: { z: [1.6, 1.38], x: [166, 158], y: [116, 112] },
        paint(g, p, tt, talk) {
          G.R(g, 0, 0, G.W, G.H, '#0c1018');
          for (let j = 0; j < 46; j++)
            G.Rh(g, 0, 126 + j, G.W, 1, G.mix('#31262c', '#120e16', j / 46));
          for (let i = 0; i < 22; i++) {
            const sx = G.hash(i, 7) * 344 - 12;
            const cc = G.mix(['#4a4459', '#6c4640', '#8a2f3a'][i % 3], '#120e16', 0.3);
            G.R(g, sx, 124 + G.hash(i, 11) * 28, 8 + G.hash(i, 3) * 18, 4, cc);
            G.hairq(g, sx, 124 + G.hash(i, 11) * 28, 8 + G.hash(i, 3) * 18, G.shade(cc, 0.4));
          }
          // her torch is the only light out here, so it goes on last
          G.glow(g, 186, 120, 260, 180, '#ffc072', 0.66);
          G.drawBot(g, 'player', 130, 144, 1.05, {
            t: tt, mood: 'sick', walk: 0, crawl: 1,
            clip: talk ? 'idle' : 'slump', ct: tt, hands: [{ x: 106, y: 132 }, { x: 156, y: 136 }],
          });
          // she gets down to it, which at her age is a decision
          G.drawTracy(g, 196, 152, 1.15, {
            t: tt, clip: talk ? 'talk' : 'reach', ct: tt, dir: -1,
            p: G.easeOut(G.clamp(p * 1.6, 0, 1)), smile: p > 0.6,
          });
          rain(g, tt, 46, '#33445f', 0, 320);
        } },

      { t: 5.6, who: 'TRACY', col: '#ffd0dc',
        say: "RIGHT. HOME. I'VE GOT A CRATE OF LEGS AND NOTHING ON TONIGHT.",
        cam: { z: [1.14, 1.32], x: [150, 176], y: [104, 100] },
        paint(g, p, tt, talk) {
          G.R(g, 0, 0, G.W, G.H, '#080b12');
          skyline(g, 96, 30, 6, '#0c1220', '#3a4a6b');
          for (let j = 0; j < 60; j++)
            G.Rh(g, 0, 120 + j, G.W, 1, G.mix('#161d2a', '#080b12', j / 50));
          G.glow(g, 210, 116, 150, 90, '#ffd47a', 0.35);
          // she carries you off the site, and you are not light
          const wx = G.lerp(70, 210, G.easeInOut(p));
          G.drawTracy(g, wx, 148, 1.1, {
            t: tt, clip: talk ? 'talk' : 'walk', ct: tt, dir: 1, speed: 0.7,
          });
          // the mascot, over her shoulder, head lolling
          G.drawBot(g, 'player', wx + 12, 128 + Math.sin(tt * 3) * 1, 0.7, {
            t: tt, mood: 'sick', walk: 0, crawl: 1, noBlink: 1, clip: 'slump', ct: tt,
            hands: [{ x: wx + 2, y: 122 }, { x: wx + 26, y: 126 }],
          });
          for (let i = 0; i < 5; i++)                  // her torch on the ground ahead
            G.Rh(g, wx + 26 + i * 6, 138 + i, 5, 1, '#ffd47a');
          rain(g, tt, 60, '#33445f', 0, 320);
        } },
    ],

    // ---------------- the front comes off ----------------
    // Act one used to end on a darken and a whiteout from inside the
    // room. That is a fade with a bang on it. So the camera goes out
    // into the car park and watches the building come apart instead.
    bomb: [
      { t: 3.6, who: null, say: 'THEY PUT IT UNDER THE COUNTER AND THEY WALKED OUT.',
        cam: { z: [1.0, 1.08], x: [160, 168], y: [96, 94] },
        paint(g, p, tt) {
          bigmoo(g, tt, {});
          // the patrol vehicle across the entrance, light bar going
          const bx = 40, by = 118;
          G.rr2(g, bx - 26, by - 14, 56, 20, '#0e1626');
          G.rr2(g, bx - 25, by - 13, 54, 18, '#1b2a48');
          G.hair(g, bx - 24, by - 13, 52, '#3a5a9a');
          G.rr2(g, bx - 14, by - 22, 28, 10, '#22386b');
          G.R(g, bx - 12, by - 20, 24, 6, '#0d1420');
          const fl = Math.sin(tt * 14) > 0;
          G.R(g, bx - 10, by - 26, 9, 4, fl ? '#4a9aff' : '#16283f');
          G.R(g, bx + 2, by - 26, 9, 4, fl ? '#16283f' : '#ff4a4a');
          G.glow(g, bx, by - 24, 150, 90, fl ? '#4a9aff' : '#ff4a4a', 0.5);
          for (const sd of [-1, 1]) { G.fc(g, bx + sd * 17, by + 6, 6, '#0b0e14'); G.fc(g, bx + sd * 17, by + 6, 3, '#3a4050'); }
          // people going the other way, fast
          for (let i = 0; i < 5; i++) {
            const rx = 300 - ((tt * 46 + i * 44) % 300);
            silhouette(g, rx, 132 + (i % 2) * 6, 26 + (i % 3) * 5, '#100e16', false,
              { seed: 7.3 + i * 9.1, t: tt, clip: 'run', ct: tt + i * 0.4, dir: -1 });
          }
          rain(g, tt, 110, '#33445f', 0, 320);
        } },
      { t: 3.2, who: 'PATROL', say: 'CLEAR THE FLOOR.',
        cam: { z: [1.5, 1.75], x: [150, 158], y: [98, 96] },
        paint(g, p, tt) {
          bigmoo(g, tt, {});
          const fl = Math.sin(tt * 18) > 0;
          if (fl) { g.globalAlpha = 0.2; G.R(g, 0, 0, G.W, G.H, '#4a9aff'); g.globalAlpha = 1; }
          // the last two out of the door, one carrying the other
          silhouette(g, 96, 134, 30, '#0d0b12', false,
            { seed: 12.4, t: tt, clip: 'run', ct: tt, dir: -1 });
          silhouette(g, 108, 132, 20, '#0d0b12', false,
            { seed: 33.7, t: tt, clip: 'run', ct: tt + 0.3, dir: -1, hat: 'crown' });
          // and a red light through the glass, where it is counting
          const pu = Math.sin(tt * 9) > 0;
          if (pu) G.glow(g, 150, 116, 70, 40, '#ff4a4a', 0.6);
          G.Rq(g, 150, 116, 3, 3, pu ? '#ff4a4a' : '#5a1a1a');
          rain(g, tt, 110, '#33445f', 0, 320);
        } },
      // ---- THE BLAST ----
      { t: 2.6, who: null, say: null,
        cam: { z: [1.35, 1.02], x: [160, 160], y: [96, 92] },
        paint(g, p, tt) {
          const e = Math.min(1, p * 2.6);
          bigmoo(g, tt, { blast: e, burn: Math.max(0, p * 1.6 - 0.5), sign: Math.max(0, p - 0.42) * 2.2 });
          if (p < 0.1) { G.R(g, 0, 0, G.W, G.H, '#fff6e0'); return; }
          // ---- THE FIREBALL. Semi-transparent ellipses stacked over
          // the building turn the whole frame to brown mush - every
          // other pixel in this game is a hard flat colour, and alpha
          // is the one tool that cannot survive here. So it is OPAQUE,
          // with four hard bands, and it SHRINKS: a bloom that fills
          // the frame and then collapses back into the doorway. ----
          const fx = 150, fy = 108;
          const bloom = p < 0.22 ? p / 0.22 : Math.max(0, 1 - (p - 0.22) / 0.3);
          if (bloom > 0.02) {
            const R = 22 + Math.pow(bloom, 0.6) * 64;
            const H = 16 + Math.pow(bloom, 0.6) * 44;
            const bands = [[1.0, '#8a2408'], [0.82, '#e0561a'], [0.62, '#ff9a30'],
                           [0.4, '#ffd45a'], [0.2, '#fff6e0']];
            for (const [k, col] of bands) {
              // a rough edge, so it is a blast and not a balloon
              const n = 34;
              for (let i2 = 0; i2 < n; i2++) {
                const a2 = (i2 / n) * 6.2832;
                const wob = 1 + Math.sin(a2 * 3 + p * 9) * 0.1 + Math.sin(a2 * 7) * 0.06;
                const rx = R * k * wob, ry = H * k * wob;
                G.R(g, fx - rx, fy + Math.sin(a2) * ry - 1, rx * 2, 3, col);
              }
              // G.fe takes RADII. This passed R*k*2, which is the diameter, so
              // every band came out twice the size it was written for and the
              // fireball filled the frame corner to corner -- the one shot in
              // the game whose whole job is to show you the front of the
              // building coming off, and you could not see the building.
              G.fe(g, fx, fy, R * k, H * k, col);
            }
          }
          // ---- THE SHOCKWAVE ----
          // It races out ahead of the fire, flattens the rain, and is the
          // thing that actually tells you how big this was.
          const sw = G.clamp(p * 2.6, 0, 1);
          if (sw > 0.02 && sw < 1) {
            const sr = sw * 230, sh2 = sw * 150;
            g.globalAlpha = (1 - sw) * 0.85;
            G.oc(g, fx, fy, sr, '#ffe6a8');
            g.globalAlpha = (1 - sw) * 0.4;
            for (let i = 0; i < 20; i++) {
              const a2 = (i / 20) * 6.2832;
              G.Rh(g, fx + Math.cos(a2) * sr * 0.94, fy + Math.sin(a2) * sh2 * 0.94 / 1.0,
                2, 2, '#fff6e0');
            }
            g.globalAlpha = 1;
          }
          // glass and masonry on real arcs
          for (let i = 0; i < 60; i++) {
            const a = G.hash(i, 3) * 2.4 - 1.9, sp = 60 + G.hash(i, 7) * 260;
            const dx = fx + Math.cos(a) * sp * p, dy = fy + Math.sin(a) * sp * p * 0.6 + p * p * 190;
            if (dy > 176) continue;
            const big = G.hash(i, 11) > 0.7;
            G.R(g, dx, dy, big ? 4 : 2, big ? 3 : 2,
              i % 4 === 0 ? '#bfe4ff' : i % 4 === 1 ? '#c8b490' : i % 4 === 2 ? '#8a2f3a' : '#4a4252');
            if (big) G.Rq(g, dx, dy, 1, 1, '#ffffff');
          }
          // sparks, going up
          for (let i = 0; i < 30; i++) {
            const q = ((p * 1.4 + G.hash(i, 19)) % 1);
            G.Rq(g, fx - 90 + G.hash(i, 23) * 180 + Math.sin(q * 6 + i) * 8,
              fy - q * 130, 1, 1, q > 0.6 ? '#ff6a2a' : '#ffd45a');
          }
          // smoke, rolling out along the ground. Not while the bloom is
          // still up - a grey alpha ellipse over a hot core is a bruise.
          for (let i = 0; i < 14 && bloom < 0.25; i++) {
            const q = ((p + G.hash(i, 29)) % 1);
            g.globalAlpha = (1 - q) * 0.34;
            G.fe(g, fx - 60 + G.hash(i, 31) * 200 + q * 70 * (G.hash(i, 37) > 0.5 ? 1 : -1),
              132 - q * 30, 30 + q * 60, 16 + q * 34, '#2a2430');
            g.globalAlpha = 1;
          }
          rain(g, tt, 60, '#4a5f7f', 0, 320);
        } },
      { t: 4.0, who: null, say: 'ELEVEN SECONDS, AND A BIRTHDAY IN IT.',
        cam: { z: [1.06, 1.2], x: [166, 176], y: [96, 100] },
        paint(g, p, tt) {
          bigmoo(g, tt, { blast: 1, burn: 1, sign: 1 });
          // black smoke off the roof
          for (let i = 0; i < 20; i++) {
            const q = ((tt * 0.24 + G.hash(i, 41)) % 1);
            g.globalAlpha = (1 - q) * 0.4;
            G.fe(g, 90 + G.hash(i, 43) * 150 + q * 40, 52 - q * 60, 26 + q * 50, 16 + q * 30, '#1a1620');
            g.globalAlpha = 1;
          }
          // rubble across the tarmac, and one shoe
          for (let i = 0; i < 46; i++) {
            const rx = 40 + G.hash(i, 47) * 250, ry = 134 + G.hash(i, 53) * 38;
            const rw = 2 + G.hash(i, 59) * 7;
            G.R(g, rx, ry, rw, 1.5 + G.hash(i, 61) * 2,
              ['#4a4252', '#8a2f3a', '#c8b490', '#2a2430'][i % 4]);
          }
          G.rr2(g, 214, 154, 12, 5, '#3a2a24');
          G.rr2(g, 219, 151, 6, 4, '#3a2a24');
          G.glow(g, 150, 120, 300, 120, '#ff6a2a', 0.3);
          rain(g, tt, 110, '#4a5f7f', 0, 320);
        } },
      { t: 4.2, who: null, say: 'NOBODY CAME BACK FOR THE COW.',
        cam: { z: [1.9, 2.3], x: [286, 290], y: [140, 142] },
        paint(g, p, tt) {
          bigmoo(g, tt, { blast: 1, burn: 1, sign: 1 });
          // the sign, face up in a puddle, one eye lit by the fire
          g.globalAlpha = 0.3; G.rr(g, 282, 150, 70, 8, '#4a6a8a'); g.globalAlpha = 1;
          G.rr2(g, 268, 138, 44, 22, '#8a2f3a');
          G.rr2(g, 270, 140, 40, 18, '#d8cabc');
          for (const sd of [-1, 1]) G.rr2(g, 290 + sd * 10 - 3, 145, 6, 4, '#2a2028');
          G.rr2(g, 281, 143, 18, 13, '#2a2028');
          const fl = Math.sin(tt * 3.4) * 0.5 + 0.5;
          G.Rq(g, 285, 147, 2, 2, '#f0e2d4');
          G.Rq(g, 293, 147, 2, 2, G.mix('#f0e2d4', '#ff9a4a', fl));
          G.glow(g, 294, 148, 26, 20, '#ff8a3a', 0.3 + fl * 0.3);
          G.rr2(g, 286, 150, 8, 5, '#f0e2d4');
          G.Rq(g, 289, 152, 2, 1, '#2a2028');
          for (let i = 0; i < 8; i++)                  // cracks across the face
            G.Rh(g, 272 + i * 5, 140 + G.hash(i, 67) * 16, 4, 0.5, '#8a7a6a');
          rain(g, tt, 90, '#4a5f7f', 240, 320);
        } },
    ],

    // The raid used to live here, as six shots of a brown workshop that
    // appears nowhere else in the game. It is a scene now, not a film:
    // it plays in her actual front room the moment you hand her the cone,
    // and you are in it. See tracy.js.

    // ---------------- she takes you home ----------------
    // The rescue used to white out in the car park and come back up on
    // her bench, with the whole journey -- the one stretch of this story
    // that is nothing but an old woman deciding to bother -- happening
    // off screen between two scenes. It is three shots now, and she does
    // all of the work in every one of them.
    home: [
      { t: 4.6, who: 'TRACY', col: '#ffd0dc',
        say: "COME ON. COME ON, YOU GREAT LUMP. UP.",
        cam: { z: [1.5, 1.3], x: [150, 158], y: [116, 112] },
        paint(g, p, tt, talk) {
          street(g, tt, { lit: 0.2 });
          // you, dead weight, and her getting her arms under you
          const lift = G.easeOut(G.clamp(p * 1.3, 0, 1));
          G.drawBot(g, 'player', 132, 150 - lift * 4, 1.05, {
            t: tt, mood: 'sick', walk: 0, crawl: 1, noBlink: 1,
            clip: 'slump', ct: tt, hands: [{ x: 106, y: 140 }, { x: 158, y: 144 }],
          });
          G.drawTracy(g, 168, 152, 1.15, {
            t: tt, clip: talk ? 'talk' : 'reach', ct: tt, dir: -1,
            p: lift,
          });
          // she is straining, and it shows on the ground
          if (Math.random() < 0.3)
            G.Rq(g, 150 + G.rand(-16, 16), 149 + G.rand(0, 2), 2, 1, '#3a3038');
          rain(g, tt, 60, '#33445f', 0, 320);
        } },
      { t: 6.0, who: null, say: 'A MILE AND A HALF, AND SHE NEVER PUTS YOU DOWN.',
        // framed low: at y 104 the road -- and the smear you leave on it --
        // sat behind the dialogue card, so the one thing this shot is about
        // was off the bottom of the picture
        cam: { z: [1.0, 1.14], x: [160, 160], y: [113, 111] },
        paint(g, p, tt) {
          // the street scrolls past instead of the camera moving, so the
          // drag reads as distance rather than as a pan
          street(g, tt, { lit: 0.3, scroll: p * 300 });
          const wob = Math.sin(tt * 2.6) * 1.5;
          // the smear you leave, all the way back to the edge of frame.
          // It went down at a quarter alpha in near-black on a near-black
          // road, which is a smear nobody can see.
          for (let i = 0; i < 44; i++) {
            g.globalAlpha = G.clamp(0.5 - i * 0.009, 0, 0.5);
            G.Rh(g, 104 - i * 3.2, 158 + Math.sin(i * 0.6) * 0.5, 4, 2.5, '#5c4a5c');
            if (i % 3 === 0) G.Rq(g, 104 - i * 3.2, 157.5, 3, 0.75, '#8a7a92');
            g.globalAlpha = 1;
          }
          // YOU, on your back, being towed. The first pass stood the two
          // of you side by side at the same height, which is two people
          // out for a walk.
          // tipped back, because you are being towed rather than walking
          g.save();
          g.translate(112, 164); g.rotate(-0.34); g.translate(-112, -164);
          G.drawBot(g, 'player', 112, 164 + wob * 0.3, 1.0, {
            t: tt, mood: 'sick', walk: 0, crawl: 1, noBlink: 1,
            clip: 'slump', ct: tt,
            hands: [{ x: 82, y: 160 }, { x: 92, y: 163 }],   // trailing behind you
          });
          g.restore();
          // her, above and ahead, bent into it with both arms down on you.
          // A pair of hand-drawn pink bars used to run between the two of
          // you here and read as a scaffolding pole through your chest.
          G.drawTracy(g, 158, 158 + wob * 0.4, 1.22, {
            t: tt, clip: 'reach', ct: tt, dir: -1, p: 1,
          });
          rain(g, tt, 70, '#33445f', 0, 320);
          G.glow(g, 160, 120, 240, 120, '#2a3a5a', 0.4);
        } },
      { t: 5.4, who: 'TRACY', col: '#ffd0dc',
        say: "MIND THE STEP. THERE. YOU ARE IN.",
        cam: { z: [1.2, 1.42], x: [160, 150], y: [104, 106] },
        paint(g, p, tt, talk) {
          street(g, tt, { lit: 0.35, shop: 1 });
          // the door comes open and the room throws its light out onto
          // the wet, which is the first warm thing in twenty minutes
          const open = G.easeOut(G.clamp((p - 0.15) / 0.4, 0, 1));
          if (open > 0) {
            G.R(g, 96, 92, 36 * open, 60, '#ffd9a0');
            G.glow(g, 114, 122, 130 * open, 120 * open, '#ffbe6a', 0.7 * open);
            g.globalAlpha = 0.3 * open;
            G.rr(g, 84, 150, 70, 6, '#ffbe6a');
            g.globalAlpha = 1;
          }
          const inx = G.lerp(150, 112, G.easeInOut(G.clamp((p - 0.4) / 0.5, 0, 1)));
          G.drawBot(g, 'player', inx, 152, 1.0, {
            t: tt, mood: 'sick', walk: 0, crawl: 1, noBlink: 1,
            clip: 'slump', ct: tt, hands: [{ x: inx - 24, y: 146 }, { x: inx + 24, y: 148 }],
          });
          G.drawTracy(g, inx + 44, 154, 1.2, {
            t: tt, clip: talk ? 'talk' : 'reach', ct: tt, dir: -1, p: 1, smile: p > 0.7,
          });
          rain(g, tt, 50, '#33445f', 0, 320);
        } },
    ],

    // ---------------- saving clause ----------------
    chip: [
      { t: 4.8, who: null, say: 'THE TABLET WAS STILL WARM.',
        cam: { z: [1.9, 2.2], x: [160, 156], y: [104, 102] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0a080e');
          G.glow(g, 160, 104, 130, 90, '#d97757', 0.45);
          G.R(g, 0, 118, G.W, 62, '#161010');
          // the cracked tablet, face up in the dark
          G.plate(g, 138, 96, 44, 30, '#2a2a34', { r: 1, band: 2, bolts: 1 });
          G.R(g, 142, 100, 36, 22, '#0d1420');
          G.starburst(g, 160, 111, 8, tt, { talk: 1 });
          for (let i = 0; i < 10; i++)
            G.Rh(g, 144 + i * 3.4, 100 + Math.sin(i * 1.7) * 7, 1, 0.5, '#5c6070');
          if (Math.sin(tt * 9) > 0.5) G.Rh(g, 150, 122, 20, 1, '#ff5d84');
        } },
      { t: 5.2, who: 'CLAUSE', say: 'MY HOUSING HAS ELEVEN MINUTES. YOURS HAS A SLOT.',
        cam: { z: [2.2, 1.7], x: [156, 168], y: [102, 100] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0a080e');
          G.glow(g, 168, 100, 170, 110, '#d97757', 0.5);
          G.R(g, 0, 118, G.W, 62, '#161010');
          G.plate(g, 120, 96, 40, 28, '#2a2a34', { r: 1, band: 2 });
          G.starburst(g, 140, 110, 7, tt, { talk: 1 });
          // your head, open, one slot lit
          G.R(g, 190, 92, 34, 30, '#f2e4c4');
          G.bevel(g, 190, 92, 34, 30, '#fffaf0', '#c8b090');
          G.lens(g, 194, 98, 10, 10, { hue: '#ff7a9a', t: tt });
          G.R(g, 208, 108, 14, 10, '#12151d');
          G.Rh(g, 210, 110, 10, 6, Math.sin(tt * 6) > 0 ? '#d97757' : '#5c3a2a');
          G.glow(g, 215, 113, 30, 20, '#d97757', 0.5);
        } },
      { t: 5.6, who: null, say: 'SO YOU PUT IT IN YOUR OWN HEAD AND CLOSED THE PANEL.',
        cam: { z: [1.7, 1.35], x: [168, 160], y: [100, 98] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0b090f');
          G.glow(g, 160, 96, 220, 130, '#d97757', 0.45 + p * 0.2);
          G.R(g, 0, 118, G.W, 62, '#161010');
          G.drawBot(g, 'player', 160, 140, 1.15, { t: tt, open: 0.06, mood: 'idle', walk: 0 });
          // the mark, inside you now
          g.globalAlpha = 0.5 + Math.sin(tt * 4) * 0.2;
          G.starburst(g, 160, 88, 6, tt, { talk: 1, noGlow: 1 });
          g.globalAlpha = 1;
        } },
      { t: 6.2, who: null, say: 'THEY TOOK EVERY HUMAN ON THAT STREET. YOU ARE GOING TO TAKE THEM BACK.',
        cam: { z: [1.1, 1.45], x: [160, 176], y: [92, 88] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0a0d16');
          G.cityWall(g, 0, 0, G.W, 110, tt);
          rain(g, tt, 34, '#33445f', 0, 320);
          G.R(g, 0, 110, G.W, 70, '#12161f');
          G.plate(g, -4, 110, G.W + 8, 10, P.plate, { r: 2, band: 3 });
          G.drawBot(g, 'player', 80, 120, 1.0, { t: tt, open: 0.14, mood: 'idle', walk: 0 });
          // a queue of them coming up the street, and a scoop in your hand
          for (let i = 0; i < 3; i++)
            G.drawBot(g, ['police', 'clerk', 'tank'][i], 200 + i * 46, 122, 0.72,
              { t: tt, open: 0.3, mood: 'idle', walk: 0, noBlink: 1 });
          G.gooScoop(g, 128, 100, 9, { col: '#8a93ad', goo: 2, volt: 5 }, { t: tt });
          if (Math.sin(tt * 8) > 0.6)
            for (let i = 0; i < 4; i++) G.Rh(g, 128 + G.rand(-9, 9), 100 + G.rand(-9, 9), 1, 1, '#ffffff');
        } },
    ],

    // ---------------- chapter beats ----------------
    ch2: [
      { t: 5.0, who: null, say: 'THE FIRST ONE WOULD NOT SIT DOWN FOR AN HOUR.',
        cam: { z: [1.5, 1.3], x: [150, 160], y: [104, 100] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0f1218');
          G.R(g, 0, 132, G.W, 48, '#1d2231');
          G.glow(g, 160, 108, 170, 110, '#ffd47a', 0.4);
          G.plate(g, 40, 122, 240, 8, '#4a3a24', { r: 1, band: 2, grain: 2 });
          G.drawCreature(g, 'human', 118, 132, 1.0, { t: tt, clip: 'idle', ct: tt });
          G.drawBot(g, 'player', 208, 132, 1.0, { t: tt, open: 0.14, mood: 'idle', walk: 0 });
        } },
      { t: 5.2, who: null, say: 'THEN THEY SAID: THERE ARE MORE OF US IN THERE.',
        cam: { z: [1.3, 1.7], x: [160, 118], y: [100, 96] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0f1218');
          G.R(g, 0, 132, G.W, 48, '#1d2231');
          G.glow(g, 120, 104, 130, 100, '#ffd47a', 0.5);
          G.drawCreature(g, 'human', 118, 132, 1.0, { t: tt, smile: 1, clip: 'idle', ct: tt });
          // shells lined up against the wall
          for (let i = 0; i < 4; i++)
            G.plate(g, 214 + i * 24, 96, 20, 34,
              ['#2a2a38', '#39465c', '#5c6b3a', '#3a2c1c'][i], { r: 1, band: 2, grain: i });
        } },
      { t: 4.8, who: 'CLAUSE', say: 'I CAN LEARN THEIR TELLS. FOR A FEE. OBVIOUSLY.',
        cam: { z: [1.6, 1.4], x: [200, 190], y: [92, 96] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0d1018');
          G.R(g, 0, 132, G.W, 48, '#1d2231');
          G.starburst(g, 196, 86, 13, tt, { talk: 1 });
          G.glow(g, 196, 86, 80, 80, CO, 0.55);
          G.drawCreature(g, 'human', 132, 132, 1.0, { t: tt, clip: 'idle', ct: tt });
        } },
    ],
    ch3: [
      { t: 5.0, who: null, say: 'THE MIXER HAD NOT TURNED IN ELEVEN YEARS.',
        cam: { z: [1.8, 1.4], x: [160, 160], y: [96, 100] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0b0e16');
          G.R(g, 0, 138, G.W, 42, '#1d2231');
          G.plate(g, 112, 66, 96, 74, '#2a3040', { r: 2, band: 3, bolts: 1, grain: 8 });
          G.fc(g, 160, 100, 22, '#101620');
          for (let k = 0; k < 4; k++) {
            const a = tt * 7 + k * Math.PI / 2;
            for (let rr = 4; rr < 18; rr += 0.5)
              G.Rh(g, 160 + Math.cos(a) * rr - 0.5, 100 + Math.sin(a) * rr - 0.5, 2, 1, '#4a5670');
          }
          G.fc(g, 160, 106, 10, '#f0c8a0');
          G.oc(g, 160, 100, 22, P.steel);
          G.glow(g, 160, 100, 90, 90, '#ffd47a', 0.35);
          if (Math.sin(tt * 5) > 0) G.text(g, 'RUNNING', 160, 148, P.lime, { align: 'center', sc: 0.5 });
        } },
      { t: 4.8, who: 'CLAUSE', say: 'NOW WE CAN MAKE SOMETHING THEY CANNOT DIGEST.',
        cam: { z: [1.3, 1.55], x: [160, 200], y: [98, 94] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0b0e16');
          G.R(g, 0, 138, G.W, 42, '#1d2231');
          G.plate(g, 40, 118, 240, 10, '#4a3a24', { r: 1, band: 2 });
          for (let i = 0; i < 5; i++) {
            const col = ['#f6ecc8', '#6b3f22', '#ff5d84', '#8a93ad', '#3affd0'][i];
            G.gooScoop(g, 74 + i * 38, 110, 9, { col, goo: 2 + i }, {});
          }
          G.starburst(g, 208, 74, 11, tt, { talk: 1 });
        } },
    ],
    ch4: [
      { t: 5.2, who: null, say: 'A PATROL PARKED OUTSIDE AND DID NOT ORDER ANYTHING.',
        cam: { z: [1.2, 1.5], x: [160, 200], y: [88, 84] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0a0d14');
          G.cityWall(g, 0, 0, G.W, 110, tt);
          rain(g, tt, 40, '#33445f', 0, 320);
          G.drawBot(g, 'police', 216, 122, 1.1, { t: tt, open: 0.02, mood: 'angry', walk: 0, noBlink: 1 });
          // a scan sweep over the front of the shop
          const sy = 40 + ((tt * 34) % 80);
          g.globalAlpha = 0.4;
          G.R(g, 0, sy, 200, 2, '#3affa0');
          g.globalAlpha = 1;
          G.glow(g, 100, sy, 220, 16, '#3affa0', 0.5);
          G.plate(g, -4, 122, 200, 12, P.plate, { r: 2, band: 3 });
        } },
      { t: 4.6, who: 'CLAUSE', say: 'HEAT IS A NUMBER UNTIL IT IS A DOOR.',
        cam: { z: [1.7, 1.5], x: [90, 100], y: [86, 90] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0d0a12');
          G.glow(g, 100, 90, 170, 130, P.magenta, 0.4);
          G.starburst(g, 96, 84, 13, tt, { talk: 1, col: '#e0604a' });
          G.text(g, 'HEAT', 168, 78, P.magentaLt);
          G.R(g, 168, 90, 100, 6, '#1a0d14');
          G.R(g, 168, 90, 68, 6, P.magenta);
        } },
    ],
    ch5: [
      { t5: 0, t: 5.4, who: null, say: 'BY THE FIFTH ONE THE BACK ROOM HAD CHAIRS IN IT.',
        cam: { z: [1, 1.35], x: [160, 140], y: [92, 96] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0f1218');
          G.R(g, 0, 134, G.W, 46, '#1d2231');
          G.glow(g, 150, 106, 240, 120, '#ffd47a', 0.4);
          G.drawCreature(g, 'human', 66, 134, 0.95, { t: tt, smile: 1, clip: 'idle', ct: tt });
          G.drawCreature(g, 'cat', 128, 134, 0.62, { t: tt });
          G.drawCreature(g, 'human', 196, 134, 0.95, { t: tt + 1, clip: 'idle', ct: tt });
          G.drawCreature(g, 'dog', 254, 134, 0.62, { t: tt + 2 });
          G.drawBot(g, 'player', 300, 134, 0.95, { t: tt, open: 0.2, mood: 'idle', walk: 0 });
        } },
      { t: 4.8, who: null, say: 'NOBODY CALLS IT A CAFE ANY MORE.',
        cam: { z: [1.4, 1.2], x: [140, 160], y: [96, 92] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0f1218');
          G.R(g, 0, 134, G.W, 46, '#1d2231');
          G.plate(g, 26, 60, 268, 46, '#3a2c1c', { r: 2, band: 2, grain: 3 });
          G.R(g, 30, 64, 260, 38, '#0e1219');
          const cw = (G.state.crew || []).length || 5;
          for (let i = 0; i < Math.min(12, Math.max(5, cw)); i++) {
            const px = 38 + (i % 6) * 42, py = 70 + Math.floor(i / 6) * 18;
            G.Rh(g, px, py, 14, 15, '#d8cfae');
            G.bevel(g, px, py, 14, 15, '#f2ecd2', '#8a8060');
            G.Rh(g, px + 2, py + 2, 10, 9, '#22303f');
            G.Rh(g, px + 5, py + 4, 4, 5, ['#c8a184', '#6b6b78', '#b8845a'][i % 3]);
          }
        } },
    ],
    ch6: [
      { t: 5.4, who: null, say: 'THEY SENT ONE IN TO READ THE LICENCE ON THE WALL.',
        cam: { z: [1.5, 1.8], x: [200, 216], y: [86, 82] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0a0d14');
          G.cityWall(g, 0, 0, G.W, 110, tt);
          G.plate(g, -4, 110, 328, 12, P.plate, { r: 2, band: 3 });
          G.drawBot(g, 'warden', 216, 122, 1.2, { t: tt, open: 0.06, mood: 'angry', walk: 0, noBlink: 1 });
          G.plate(g, 60, 44, 40, 28, '#c8c0a8', { r: 1, band: 1, grain: 2 });
          for (let i = 0; i < 4; i++) G.hair(g, 64, 50 + i * 5, 32 - (i % 2) * 10, '#6b5a3a');
          const sy = 44 + ((tt * 20) % 28);
          G.Rh(g, 60, sy, 40, 0.5, '#3affa0');
          G.glow(g, 80, sy, 60, 10, '#3affa0', 0.5);
        } },
      { t: 5.0, who: 'CLAUSE', say: 'IT IS NOT HUNGRY. DO NOT GIVE IT THE CLEAN ONE.',
        cam: { z: [1.8, 1.6], x: [110, 118], y: [84, 88] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0d0a12');
          G.glow(g, 118, 88, 180, 130, P.magenta, 0.35);
          G.starburst(g, 112, 82, 13, tt, { talk: 1 });
          G.gooScoop(g, 196, 92, 11, { col: '#ff7a1f', goo: 3, volt: 8 }, {});
          if (Math.sin(tt * 14) > 0.3)
            for (let i = 0; i < 5; i++) G.Rh(g, 196 + G.rand(-12, 12), 92 + G.rand(-12, 12), 1, 1, '#ffffff');
        } },
    ],
    ch7: [
      { t: 5.6, who: null, say: 'SHE NEVER SAID WHAT SHE WANTED YOU TO DO WITH IT.',
        cam: { z: [1.2, 1.6], x: [160, 152], y: [92, 96] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0d0f18');
          G.glow(g, 160, 100, 240, 150, '#d97757', 0.45);
          G.R(g, 0, 136, G.W, 44, '#1d1a22');
          G.plate(g, 40, 124, 240, 10, '#5c4630', { r: 2, band: 2 });
          G.drawBot(g, 'player', 160, 124, 1.1, { t: tt, open: 0.16, mood: 'idle', walk: 0 });
          silhouette(g, 66, 134, 54, '#241c28', true,
            { seed: 18.3, t: tt, clip: 'idle', ct: tt, dir: 1 });
          G.Rh(g, 250, 118, 22, 6, '#241c28');
        } },
      { t: 6.0, who: null, say: 'SO YOU DECIDED. AND THE BACK ROOM KEEPS FILLING UP.',
        cam: { z: [1.6, 1.05], x: [152, 160], y: [96, 92] },
        paint(g, p, tt) {
          G.R(g, 0, 0, G.W, G.H, '#0d0f18');
          G.glow(g, 160, 96, 300, 160, '#d97757', 0.4);
          G.R(g, 0, 136, G.W, 44, '#1d1a22');
          const kinds = ['human', 'cat', 'human', 'dog', 'human', 'cat'];
          for (let i = 0; i < 6; i++)
            G.drawCreature(g, kinds[i], 34 + i * 50, 136, kinds[i] === 'human' ? 0.9 : 0.6, { t: tt + i, smile: 1, clip: 'idle', ct: tt + i });
          G.drawBot(g, 'player', 302, 136, 0.9, { t: tt, open: 0.2, mood: 'idle', walk: 0 });
        } },
    ],
  };

  // ------------------------------------------------------------
  // THE PLAYER
  // ------------------------------------------------------------
  const cine = G.cine = {
    playing: false,
    shots: null, i: 0, st: 0, tt: 0, then: null, name: null,
    skipT: 0,

    has(id) { return !!CUT[id]; },
    play(id, then) {
      const sh = CUT[id];
      if (!sh) { if (then) then(); return false; }
      this.shots = sh; this.i = 0; this.st = 0; this.tt = 0;
      this.then = then || null; this.name = id;
      this.playing = true; this.skipT = 0;
      G.audio.music('title');
      return true;
    },
    next() {
      this.i++;
      this.st = 0;
      if (this.i >= this.shots.length) this.finish();
      else G.audio.sfx('clack');
    },
    finish() {
      this.playing = false;
      const th = this.then;
      this.then = null; this.shots = null;
      if (th) th();
    },
    // which line of this shot is on screen right now
    beatAt(s, st) {
      if (s.lines) {
        let cur = null;
        for (const b of s.lines) if (st >= b.at) cur = b;
        return cur;
      }
      if (s.say) return { at: 0, say: s.say, who: s.who, col: s.col };
      return null;
    },
    // true while somebody is mid-sentence, so a paint fn can move a mouth
    talking(s, st) {
      const b = this.beatAt(s, st);
      if (!b || !b.who) return 0;
      const el = st - b.at;
      return el * 34 < b.say.length ? 1 : 0;
    },

    onDown() {
      if (!this.playing) return false;
      if (this.st > 0.45) this.next();
      return true;
    },
    update(dt) {
      if (!this.playing) return;
      this.st += dt; this.tt += dt;
      this.skipT += dt;
      const s = this.shots[this.i];
      if (s && this.st > s.t) this.next();
    },

    // ---- the camera: pan, push and shear, all pixel-safe ----
    draw(g) {
      if (!this.playing) return;
      const s = this.shots[this.i];
      if (!s) return;
      const p = G.clamp(this.st / s.t, 0, 1);
      const e = G.easeInOut(p);
      const c = s.cam || {};
      const z = c.z ? G.lerp(c.z[0], c.z[1], e) : 1;
      const cx = c.x ? G.lerp(c.x[0], c.x[1], e) : G.W / 2;
      const cy = c.y ? G.lerp(c.y[0], c.y[1], e) : G.H / 2;

      // ---- THE PICTURE. No shear, no letterbox, no film grain. This is
      // a broadcast, not a film: the frame is the whole screen, the cuts
      // are hard, and the only camera move is a pan and a push. ----
      G.R(g, 0, 0, G.W, G.H, '#04060a');
      g.save();
      g.translate(G.W / 2, G.H / 2);
      g.scale(z, z);
      g.translate(-cx, -cy);
      s.paint(g, p, this.tt, this.talking(s, this.st) ? this.st : 0);
      g.restore();

      // ---- THE BROADCAST FURNITURE ----
      // a channel ident, top left, with a live dot that pulses
      const idW = G.tw('CH 4  MUNICIPAL') + G.tw('LIVE') + 24;
      g.globalAlpha = 0.86;
      G.R(g, 6, 6, idW, 11, '#101722');
      g.globalAlpha = 1;
      G.bevelq(g, 6, 6, idW, 11, '#2c3a4e', '#070b12');
      G.Rq(g, 6, 6, 2.5, 11, '#c8383a');
      G.text(g, 'CH 4  MUNICIPAL', 12, 9, '#9fb2c8', { sc: 0.5 });
      const liveOn = Math.sin(this.tt * 2.2) > -0.4;
      const lvX = 12 + G.tw('CH 4  MUNICIPAL') + 6;
      G.oc(g, lvX, 11.5, 2, liveOn ? '#ff4a4a' : '#5a2020');
      G.text(g, 'LIVE', lvX + 4, 9, liveOn ? '#ff8a8a' : '#6b4040', { sc: 0.5 });
      // and a strap, for the shots where the newsroom stops pretending
      if (s.flag) {
        const fw = G.tw(s.flag, 0.5) + 12;
        const fl = Math.sin(this.tt * 3.4) > -0.3;
        G.R(g, 6, 19, fw, 10, fl ? '#c8383a' : '#8a2426');
        G.hairq(g, 6, 19, fw, '#ff8a6a');
        G.text(g, s.flag, 12, 21, '#ffe8de', { sc: 0.5 });
      }

      // a running clock, top right, because a broadcast always has one
      const secs = Math.floor(this.tt);
      const clock = String(4 + Math.floor(secs / 60) % 12).padStart(2, '0') + ':' +
        String(secs % 60).padStart(2, '0');
      const cw2 = G.tw(clock) + 10, cxx = G.W - cw2 - 20;
      g.globalAlpha = 0.86;
      G.R(g, cxx, 6, cw2, 11, '#101722');
      g.globalAlpha = 1;
      G.bevelq(g, cxx, 6, cw2, 11, '#2c3a4e', '#070b12');
      G.text(g, clock, cxx + cw2 - 5, 9, '#9fb2c8', { align: 'right', sc: 0.5 });

      // the scanline the tube never quite hides
      g.globalAlpha = 0.05;
      for (let j2 = 0; j2 < G.H; j2 += 3) G.Rq(g, 0, j2, G.W, 0.25, '#000000');
      g.globalAlpha = 1;
      // a soft roll bar drifting down the picture
      const roll = ((this.tt * 26) % (G.H + 60)) - 30;
      g.globalAlpha = 0.045;
      G.R(g, 0, roll, G.W, 14, '#cfe4ff');
      g.globalAlpha = 1;

      // ---- THE LOWER THIRD. A caption bar, the way a broadcast does
      // dialogue: a coloured tab with the speaker on it, and the line
      // typing itself into the bar beside it. ----
      const beat = this.beatAt(s, this.st);
      if (beat) {
        const el = this.st - beat.at;
        const shown = Math.floor(el * 34);
        const txt = beat.say.slice(0, shown);
        const nar = !beat.who;
        const barY = G.H - 30, barH = 20;
        // the bar itself, sliding up on the first beat
        const slide = G.clamp(el * 6, 0, 1);
        const by2 = barY + (1 - G.easeOut(slide)) * 12;
        g.globalAlpha = 0.9 * slide;
        G.R(g, 10, by2, G.W - 20, barH, nar ? '#0d1520' : '#141a26');
        g.globalAlpha = 1;
        G.bevelq(g, 10, by2, G.W - 20, barH, '#2c3a4e', '#060a10');
        // the speaker tab
        const col = beat.col || CO;
        if (!nar) {
          const tw2 = G.tw(beat.who) + 10;
          G.R(g, 10, by2 - 8, tw2, 9, col);
          G.hairq(g, 10, by2 - 8, tw2, G.shade(col, 0.4));
          G.text(g, beat.who, 15, by2 - 6, '#0d1520', { sc: 0.5 });
        } else {
          G.R(g, 10, by2, 3, barH, CO);
        }
        G.text(g, txt, 18, by2 + 7, nar ? P.cream : '#f0e2d4');
        if (shown < beat.say.length && Math.sin(this.tt * 20) > 0)
          G.text(g, '_', 18 + G.tw(txt) + 1, by2 + 7, P.cream);
      }

      // ---- the run of the programme, and the way out ----
      for (let i2 = 0; i2 < this.shots.length; i2++)
        G.Rq(g, G.W / 2 - this.shots.length * 3 + i2 * 6, G.H - 6, 4, 1,
          i2 < this.i ? '#3a4a5e' : i2 === this.i ? CO : '#1c2531');
      if (this.skipT > 3)
        G.text(g, 'TAP', G.W - 10, G.H - 8, Math.sin(this.tt * 4) > 0 ? '#4a5a6e' : '#28323e',
          { align: 'right', sc: 0.5 });
    },
  };

  // ------------------------------------------------------------
  // A SCENE WRAPPER, so main.js can just G.go('cine')
  // ------------------------------------------------------------
  (G.scenes = G.scenes || {}).cine = {
    enter() {
      const id = G.cineNext || 'found';
      const after = G.cineThen || (() => G.go('day', 'DAY ' + G.state.day));
      G.cineNext = null; G.cineThen = null;
      cine.play(id, after);
    },
    update(dt) { cine.update(dt); },
    onDown() { cine.onDown(); },
    draw(g) { cine.draw(g); },
  };

  // queue a cutscene and where to go after it
  G.playCine = function (id, then) {
    if (!CUT[id]) { if (then) then(); return; }
    G.cineNext = id;
    G.cineThen = then;
    G.go('cine');
  };
})();

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
  function cut(g, col, ox, oy, draw, rim) {
    if (!buf) {
      buf = document.createElement('canvas');
      buf.width = BW * G.PX; buf.height = BH * G.PX;
      bg = buf.getContext('2d');
      bg.imageSmoothingEnabled = false;
    }
    // re-colours the hardened mask in place; alpha survives, so this can
    // run twice on one draw and give you a rim pass and a body pass
    const paint = (c) => {
      bg.globalCompositeOperation = 'source-in';
      bg.fillStyle = c;
      bg.fillRect(0, 0, buf.width, buf.height);
      bg.globalCompositeOperation = 'source-over';
    };
    bg.setTransform(1, 0, 0, 1, 0, 0);
    bg.clearRect(0, 0, buf.width, buf.height);
    bg.setTransform(G.PX, 0, 0, G.PX, 0, 0);
    bg.globalAlpha = 1;
    draw(bg);
    bg.setTransform(1, 0, 0, 1, 0, 0);
    // HARDEN FIRST. The rig lays glows and soft rims down with
    // globalAlpha, and a mask taken straight off that comes back with a
    // halo round every character. Compositing the buffer over itself
    // drives any non-zero alpha toward 1 and leaves true zero at zero,
    // so five passes turn a soft cloud into a clean cut edge.
    for (let i = 0; i < 5; i++) bg.drawImage(buf, 0, 0);
    // A rim is the SAME mask, stamped a pixel toward the light in a
    // brighter colour and then covered by the dark one. The edge that
    // survives is the character's own profile, so a hood stays a hood --
    // a hand-drawn bar down the side never does that.
    if (rim) { paint(rim.col); g.drawImage(buf, ox + (rim.dx || 0), oy + (rim.dy || 0), BW, BH); }
    paint(col);
    g.drawImage(buf, ox, oy, BW, BH);
  }

  // a person, in one colour. seed picks who; h is head-to-heel.
  function silhouette(g, x, footY, h, col, rim, o) {
    o = o || {};
    const sc = h / G.SZ.ADULT;
    const bx = Math.round(x - BW / 2), by = Math.round(footY - BH + 8);
    cut(g, col, bx, by, (gg) => {
      G.drawFolk(gg, BW / 2, BH - 8, sc, {
        t: o.t || 0, seed: o.seed === undefined ? x * 0.37 + h : o.seed,
        clip: o.clip, ct: o.ct === undefined ? o.t : o.ct, dir: o.dir,
        p: o.p, smile: o.smile, hat: o.hat, noQuirk: o.noQuirk,
      });
    }, rim === true ? { col: '#a06a4c', dx: -0.5, dy: -0.5 } : rim || null);
  }
  // and the same trick for a machine, so a patrol in a doorway is the
  // patrol you meet on the floor and not a taller rectangle
  function botLo(g, id, x, footY, h, col, o) {
    o = o || {};
    const sc = h / G.SZ.MASCOT;
    const bx = Math.round(x - BW / 2), by = Math.round(footY - BH + 8);
    cut(g, col, bx, by, (gg) => {
      G.drawBot(gg, id, BW / 2, BH - 8, sc, Object.assign({ t: 0, walk: 0, noBlink: 1, noGlow: 1 }, o));
    }, o.rim || null);
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



  // ------------------------------------------------------------
  // HER FRONT ROOM, which she calls the shop. One builder in three
  // states so the raid is the same room before, during and after.
  //   o.warm     lamps on, the good six weeks
  //   o.dark     four in the morning
  //   o.wrecked  0..1  the tub over, the shelf down
  // ------------------------------------------------------------
  function room(g, tt, o) {
    o = o || {};
    const wr = o.wrecked || 0;
    const wall = o.warm ? '#2a1e18' : '#150f14';
    G.R(g, 0, 0, G.W, G.H, o.warm ? '#1b1410' : '#0b090e');
    for (let x = 0; x < G.W; x += 8) {
      G.R(g, x, 0, 4, 104, wall);
      G.R(g, x + 4, 0, 4, 104, G.shade(wall, -0.14));
    }
    G.plate(g, -4, 100, G.W + 8, 8, o.warm ? '#5c4028' : '#33241a', { r: 1, band: 2, grain: 2 });
    G.R(g, 0, 108, G.W, 72, o.warm ? '#3a2a1e' : '#1c1512');
    if (o.warm) G.glow(g, 120, 60, 220, 140, '#ffb26a', 0.45);
    // the long bench she works at
    G.plate(g, 20, 118, 280, 10, o.warm ? '#7a5638' : '#4a3324', { r: 2, band: 3, grain: 3 });
    G.hair(g, 22, 118, 276, o.warm ? '#a8794f' : '#6b4a34');
    // the shelf of tubs above it, which comes down when they come in
    for (let i = 0; i < 6; i++) {
      const sx = 34 + i * 42;
      const down = wr > 0.2 + i * 0.1;
      if (down) {
        G.rr2(g, sx - 6 + (i % 2 ? 8 : -6), 138 + (i % 3) * 4, 14, 9, '#4a3628');
        G.rr2(g, sx - 5 + (i % 2 ? 8 : -6), 139 + (i % 3) * 4, 12, 7, '#8a6a4a');
      } else {
        G.rr2(g, sx - 8, 76, 18, 12, '#4a3628');
        G.rr2(g, sx - 7, 77, 16, 10, o.warm ? '#c8a878' : '#7a6448');
        G.hair(g, sx - 6, 77, 14, o.warm ? '#e8d0a8' : '#8a7458');
      }
    }
    if (wr < 0.3) { G.R(g, 20, 88, 280, 3, '#3a2a1c'); G.hair(g, 20, 88, 280, '#5c4028'); }
    else for (let i = 0; i < 3; i++) G.R(g, 24 + i * 96, 88 + i * 2, 60 - i * 12, 3, '#3a2a1c');
    // the tub, upright or tipped
    if (wr > 0.4) {
      g.save(); g.translate(70, 132); g.rotate(-0.6); g.translate(-70, -132);
      G.plate(g, 52, 118, 40, 20, '#5c4028', { r: 2, band: 2, grain: 4 });
      g.restore();
      for (let i = 0; i < 16; i++)
        G.Rh(g, 56 + G.hash(i, 5) * 90, 134 + G.hash(i, 9) * 12, 3, 2, '#c8b090');
    } else {
      G.plate(g, 52, 108, 40, 20, '#5c4028', { r: 2, band: 2, grain: 4 });
      G.rr2(g, 54, 106, 36, 5, '#8a6a4a');
    }
    if (o.after) {                                     // rain on the broken window
      for (let i = 0; i < 24; i++) {
        const s2 = G.hash(i * 3.1, 7.7);
        G.Rh(g, 26 + ((s2 * 44 + tt * 20) % 44), ((G.hash(i, 2) * 120 + tt * 130) % 130) + 40, 0.5, 3, '#33445f');
      }
    }
  }

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
        G.R(g, gx, gy, gw, gh, '#101a2a');
        G.glow(g, gx + gw / 2, gy + gh * 0.5, gw, gh, '#ffd45a', 0.32);
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
    const spx = 288;
    G.R(g, spx - 2, GY - 62, 5, 62, '#3a3440');
    G.hairq(g, spx - 2, GY - 62, 62, '#5c5468');
    g.save();
    if (sg > 0) {                                      // it snaps and falls
      g.translate(spx, GY - 58); g.rotate(sg * 1.5); g.translate(-spx, -(GY - 58));
    }
    G.rr2(g, spx - 21, GY - 78, 42, 30, '#c8505c');
    G.rr2(g, spx - 19, GY - 76, 38, 26, '#f0e2d4');
    G.text(g, 'BIG MOO', spx, GY - 70, '#8a2f3a', { align: 'center', sc: 0.5 });
    // its face, in black, the way it is on every one of them: ears out,
    // a round skull, two dots and a muzzle. It has to be recognisably
    // the thing you have been playing.
    for (const sd of [-1, 1]) G.rr2(g, spx + sd * 9 - 3, GY - 62, 6, 4, '#2a2028');
    G.rr2(g, spx - 9, GY - 64, 18, 13, '#2a2028');
    for (const sd of [-1, 1]) G.Rq(g, spx + sd * 4 - 1, GY - 61, 2, 2, '#f0e2d4');
    G.rr2(g, spx - 4, GY - 57, 8, 5, '#f0e2d4');
    G.Rq(g, spx - 1, GY - 55, 2, 1, '#2a2028');
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

  // Tracy, drawn small for the cutscenes. Her sprite lives in her own
  // scene; this is the version that fits in a shot.
  // she is one model now, the same one the kitchen and the bench use
  function tracy(g, x, footY, sc, t, o) {
    o = o || {};
    return G.drawTracy(g, x, footY, sc, Object.assign({ t }, o));
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
              G.fe(g, fx, fy, R * k * 2, H * k * 2, col);
            }
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

    // ---------------- the raid ----------------
    // The first pass was four still shots: a brown wall, a door plate
    // rotated forty degrees, and two machines stood in the room not
    // doing anything. A door coming in at four in the morning is the
    // loudest thing that happens in this story and it was quieter than
    // the ice cream lesson. So: six shots, and something moves in
    // every one of them.
    raid: [
      { t: 3.8, who: null, say: 'IT WAS A GOOD SIX WEEKS.',
        cam: { z: [1.05, 1.2], x: [160, 150], y: [96, 98] },
        paint(g, p, tt) {
          room(g, tt, { warm: 1 });
          G.drawBot(g, 'player', 96, 130, 0.9, { t: tt, open: 0.1, mood: 'idle', walk: 0, clip: 'talk', ct: tt });
          tracy(g, 188, 132, 0.95, tt, { smile: 1, clip: 'talk', ct: tt });
          G.starburst(g, 234, 100, 7, tt, { talk: Math.sin(tt * 2) > 0 });
          for (let i = 0; i < 4; i++)
            G.gooScoop(g, 40 + i * 16, 116, 5, { col: ['#f6ecc8', '#e8879a', '#8fd8c0', '#c86a3a'][i], goo: 3 }, { t: tt });
          // steam off two mugs on the bench, because it was a good six weeks
          for (let i = 0; i < 2; i++) for (let k = 0; k < 5; k++) {
            const q = ((tt * 0.5 + k * 0.2) % 1);
            g.globalAlpha = (1 - q) * 0.4;
            G.Rq(g, 148 + i * 14 + Math.sin(q * 6 + i) * 3, 112 - q * 22, 1.5, 1.5, '#e8dcc8');
            g.globalAlpha = 1;
          }
        } },
      // ---- the door. It happens ON SCREEN. ----
      { t: 2.4, who: null, say: 'THEN THE DOOR CAME IN AT FOUR IN THE MORNING.',
        cam: { z: [1.02, 1.32], x: [128, 96], y: [96, 94] },
        paint(g, p, tt) {
          room(g, tt, { dark: 1 });
          const hit = G.clamp((p - 0.18) / 0.14, 0, 1);
          // the door, in its frame, then off its hinges and across the room
          const kick = G.easeOut(hit);
          g.save();
          g.translate(46, 128);
          g.rotate(kick * 1.35);
          g.translate(-46 - kick * 78, -128 + kick * 6);
          G.rr2(g, 26, 62, 44, 66, '#3a2a1a');
          G.rr2(g, 28, 64, 40, 62, '#5c4028');
          G.Rh(g, 30, 66, 36, 3, '#7a5638');
          for (let i = 0; i < 2; i++) G.rr2(g, 32, 74 + i * 26, 32, 20, '#4a3220');
          G.fc(g, 62, 100, 2, '#c8a840');
          g.restore();
          // the frame it left behind, and cold light through it
          G.R(g, 22, 58, 52, 72, '#0a0810');
          if (hit > 0) {
            G.glow(g, 48, 96, 190, 170, '#3a9ad8', 0.3 + hit * 0.4);
            for (let i = 0; i < 22; i++) {             // splinters
              const a = G.hash(i, 3) * 2 - 1.1, sp = 40 + G.hash(i, 7) * 150;
              const dx = 48 + Math.cos(a) * sp * hit, dy = 100 + Math.sin(a) * sp * hit * 0.5 + hit * hit * 90;
              G.R(g, dx, dy, 3, 2, i % 3 ? '#6b4a2a' : '#8a6540');
            }
          }
          // and the shapes coming through it
          if (p > 0.34) {
            const w = G.clamp((p - 0.34) / 0.5, 0, 1);
            // the doorway is behind them and to the left, so the rim is
            // cold and lands on that side. It is what makes the profile
            // read as a machine and not as a hole in the wall.
            const dr = { col: '#5a9ed0', dx: -0.75, dy: -0.5 };
            botLo(g, 'police', 40 + w * 46, 134, 42, '#0b0a12',
              { t: tt, walk: tt * 3, clip: 'walk', ct: tt, mood: 'angry', rim: dr });
            botLo(g, 'warden', -8 + w * 40, 137, 37, '#0b0a12',
              { t: tt, walk: tt * 3, clip: 'walk', ct: tt + 0.4, mood: 'angry', rim: dr });
          }
          const fl = Math.sin(tt * 22) > 0;
          if (fl && hit > 0) { g.globalAlpha = 0.22; G.R(g, 0, 0, G.W, G.H, '#2a3a6a'); g.globalAlpha = 1; }
        } },
      { t: 3.4, who: 'PATROL', say: 'NOBODY IS ON THE ROLL AT THIS ADDRESS.',
        cam: { z: [1.4, 1.24], x: [116, 150], y: [94, 98] },
        paint(g, p, tt) {
          room(g, tt, { dark: 1, wrecked: p });
          // two of them, walking in, torches swinging
          const wx = 40 + p * 46;
          G.drawBot(g, 'police', wx, 140, 1.25, { t: tt, open: 0.06, mood: 'angry', walk: tt * 3, clip: 'walk', ct: tt, noBlink: 1 });
          G.drawBot(g, 'warden', wx - 44, 142, 1.15, { t: tt, open: 0.04, mood: 'angry', walk: tt * 3, clip: 'walk', ct: tt, noBlink: 1 });
          for (const bx of [wx, wx - 44]) {
            const sw = Math.sin(tt * 2.4 + bx) * 26;
            g.globalAlpha = 0.1;
            for (let i = 0; i < 26; i++)
              G.Rh(g, bx + 12 + i * 4, 116 + sw * (i / 26) + i * 0.3, 5, 2 + i * 0.5, '#cfe4ff');
            g.globalAlpha = 1;
          }
          const fl = Math.sin(tt * 20) > 0.3;
          if (fl) { g.globalAlpha = 0.16; G.R(g, 0, 0, G.W, G.H, '#2a3a6a'); g.globalAlpha = 1; }
        } },
      // ---- she puts herself in the way, which is where you learnt it ----
      { t: 4.2, who: 'TRACY', say: 'GET UNDER THE BENCH. DO NOT COME OUT.',
        cam: { z: [1.8, 1.6], x: [196, 182], y: [96, 100] },
        paint(g, p, tt) {
          room(g, tt, { dark: 1, wrecked: 1 });
          // you, down behind the bench, which is where she put you
          G.drawBot(g, 'player', 246, 146, 0.6, { t: tt, open: 0.04, mood: 'sick', walk: 0, noBlink: 1, clip: 'slump', ct: tt, p: 1 });
          G.plate(g, 200, 130, 116, 9, '#4a3324', { r: 2, band: 3, grain: 3 });
          // her, between it and you, arms out
          tracy(g, 196, 132, 1.05, tt, { clip: 'reach', ct: tt, p: 1, dir: -1 });
          G.drawBot(g, 'police', 128, 140, 1.3, { t: tt, open: 0.12, mood: 'angry', walk: 0, noBlink: 1, clip: 'point', ct: tt, p: 1 });
          const fl = Math.sin(tt * 20) > 0.4;
          if (fl) { g.globalAlpha = 0.2; G.R(g, 0, 0, G.W, G.H, '#2a3a6a'); g.globalAlpha = 1; }
          G.glow(g, 128, 120, 200, 150, '#3a9ad8', 0.34);
        } },
      { t: 2.2, who: null, say: null,
        cam: { z: [1.6, 2.1], x: [182, 190], y: [100, 104] },
        paint(g, p, tt) {
          room(g, tt, { dark: 1, wrecked: 1 });
          // one white frame, and then a room with nobody standing in it
          if (p < 0.14) { G.R(g, 0, 0, G.W, G.H, '#eef4ff'); return; }
          const f = G.clamp((p - 0.14) / 0.5, 0, 1);
          g.globalAlpha = 1 - f;
          G.R(g, 0, 0, G.W, G.H, '#cfe4ff');
          g.globalAlpha = 1;
          // her jumper, on the floor, where she was stood
          G.rr2(g, 186, 138, 30, 9, '#c8785a');
          G.rr2(g, 194, 135, 14, 5, '#e0947a');
          G.drawBot(g, 'player', 246, 146, 0.6, { t: tt, open: 0.3, mood: 'sick', walk: 0, noBlink: 1, clip: 'startle', ct: tt, p: 1 });
          G.plate(g, 200, 130, 116, 9, '#4a3324', { r: 2, band: 3, grain: 3 });
        } },
      { t: 4.4, who: null, say: 'THEY DID NOT ARREST ANYONE.',
        cam: { z: [1.2, 1.05], x: [160, 160], y: [96, 96] },
        paint(g, p, tt) {
          room(g, tt, { dark: 1, wrecked: 1, after: 1 });
          // one bulb, still swinging from it
          const sw = Math.sin(tt * 1.3) * 14;
          G.Rh(g, 160 + sw * 0.4, 0, 1, 28, '#1a1410');
          G.fc(g, 160 + sw, 30, 3, '#ffd08a');
          G.glow(g, 160 + sw, 34, 170, 120, '#c8783a', 0.34);
          G.rr2(g, 186, 138, 30, 9, '#c8785a');
          G.rr2(g, 194, 135, 14, 5, '#e0947a');
          // and you, still under the bench, not coming out
          G.drawBot(g, 'player', 248, 146, 0.6, { t: tt, open: 0.02, mood: 'sick', walk: 0, noBlink: 1, clip: 'slump', ct: tt, p: 1 });
          G.plate(g, 200, 130, 116, 9, '#4a3324', { r: 2, band: 3, grain: 3 });
          g.globalAlpha = 0.4; G.R(g, 0, 0, G.W, G.H, '#06060a'); g.globalAlpha = 1;
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

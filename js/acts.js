// ============================================================
// DOUBLE LIFE v15 - acts.js  ·  THE PROLOGUE, PLAYED
//
// This used to be nine cutscene shots and a two-mile crawl. It is now
// two rooms you walk around in.
//
//   FLOOR   the dining room of MOO-BOT, mid-shift. Work the room: say
//           hello to the birthday table, get up on the stage and do
//           the dance, collect the order, take it over. The restaurant
//           runs on its own while you do it - people come in, queue,
//           order, find a table and eat. Then the door comes in.
//
//   WRECK   the same building, four hours later, on one leg. Five
//           things that used to belong to somebody, laid out where they
//           fell. Then a torch comes down the road.
//
// Everything is built off G.SZ, so a counter is waist high on a grown
// adult, a door is one you could walk through, and the mascot is the
// height of a person because it is a person in a suit.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;
  const F = G.FLOOR;                  // 150
  const Z = G.SZ;

  // ------------------------------------------------------------
  // TWO PLANES. A room is deeper than a line. The counter, the booths
  // and the staff live on the BACK floor; you and anybody walking live
  // on the FRONT floor eighteen units nearer the camera, so you pass
  // in front of the furniture instead of standing on it.
  // ------------------------------------------------------------
  const FB = F - 18;                  // the back floor

  // ---- THE ROOM ITSELF ----
  // It was a flat cream wall with a stripe of tiles glued across it. A
  // chain does not build a room like that: it builds a LIT SOFFIT, a
  // house-colour band you can see from the road, a tiled service height
  // and a stainless kick rail, and every one of those lines runs the
  // whole length of the building.
  function tiledWall(g, x0, x1, dim, t) {
    const M = (c) => G.mix(c, '#241018', dim || 0);
    const w = x1 - x0;
    G.R(g, x0, 0, w, FB, M('#f6e8d4'));
    // ---- the soffit, and the lights in it ----
    G.R(g, x0, 0, w, 15, M('#6b1d26'));
    G.R(g, x0, 13, w, 3, M('#8a2f3a'));
    G.hairq(g, x0, 16, w, M('#c8505c'));
    for (let lx = x0 + 34; lx < x1; lx += 68) {
      G.R(g, lx - 9, 10, 18, 5, M('#2a1218'));
      G.R(g, lx - 8, 11, 16, 3, M(dim ? '#6b5a48' : '#ffeac0'));
      G.hairq(g, lx - 8, 11, 16, M(dim ? '#8a7458' : '#fffaf0'));
      if (!dim) G.glow(g, lx, 22, 70, 46, '#ffd9a0', 0.16);
    }
    // ---- the house band: cream over red, the two colours on the sign ----
    G.R(g, x0, 24, w, 7, M('#c8383a'));
    G.hairq(g, x0, 24, w, M('#e8585a'));
    G.hairq(g, x0, 30.5, w, M('#8a2022'));
    // ---- tiles to service height, with grout you can see ----
    const TT = FB - 66;
    G.R(g, x0, TT, w, 58, M('#efe1cb'));
    for (let x = x0 - (x0 % 14); x < x1; x += 14) {
      G.Rh(g, x, TT, 13, 13, M('#f6ead8'));
      G.Rh(g, x, TT + 14.5, 13, 13, M('#e8d8bf'));
      G.Rh(g, x + 7, TT + 29, 13, 13, M('#f2e4ce'));
      G.Rh(g, x + 7, TT + 43.5, 13, 13, M('#e8d8bf'));
      G.hairq(g, x, TT, 13, M('#fffaf0'));
      G.hairq(g, x, TT + 14.5, 13, M('#fffaf0'));
    }
    // the capping rail over them, and the stainless kick rail under
    G.R(g, x0, TT - 4, w, 4, M('#c8383a'));
    G.hairq(g, x0, TT - 4, w, M('#e8585a'));
    G.R(g, x0, FB - 10, w, 10, M('#9aa4b4'));
    G.hairq(g, x0, FB - 10, w, M('#d4dce8'));
    G.hairq(g, x0, FB - 1, w, M('#5c6472'));
    for (let x = x0 - (x0 % 40); x < x1; x += 40) G.vairq(g, x, FB - 9, 8, M('#7a8494'));
  }

  // ---- THE SERVICE LINE ----
  // What is actually behind a fast food counter: a drinks fountain with
  // its nozzles and its drip tray, a fry station under a heat lamp, and
  // a stack of cups. The wall back there used to be bare cream.
  function serviceLine(g, dim, t) {
    const M = (c) => G.mix(c, '#241018', dim || 0);
    const y0 = FB - 66, y1 = FB - 12;
    G.R(g, 338, y0, 164, y1 - y0, M('#8a94a4'));
    G.hairq(g, 338, y0, 164, M('#cdd6e2'));
    for (let x = 338; x < 502; x += 12) G.vairq(g, x, y0 + 1, y1 - y0 - 2, M('#6b7484'));
    G.R(g, 338, y1 - 3, 164, 3, M('#5c6472'));

    // ---- the drinks fountain ----
    G.R(g, 344, y0 + 6, 52, 34, M('#2a3040'));
    G.bevelq(g, 344, y0 + 6, 52, 34, M('#556074'), M('#141a26'));
    for (let i = 0; i < 4; i++) {                        // the flavour plates
      const bx = 347 + i * 12;
      G.R(g, bx, y0 + 9, 10, 12, M(['#c8383a', '#e8853a', '#3a7a5c', '#4a5a8a'][i]));
      G.hairq(g, bx, y0 + 9, 10, M('#ffffff'));
      G.R(g, bx + 3, y0 + 22, 4, 4, M('#8a94a8'));       // the nozzle
      G.Rq(g, bx + 4, y0 + 26, 2, 2, M('#3a4250'));
    }
    G.R(g, 344, y0 + 32, 52, 5, M('#454e60'));           // the drip tray
    for (let i = 0; i < 12; i++) G.vairq(g, 347 + i * 4, y0 + 33, 3, M('#232a38'));
    if (!dim) G.glow(g, 370, y0 + 18, 56, 40, '#8fd8c0', 0.1);

    // ---- the fry station, under its lamp ----
    G.R(g, 406, y0 + 8, 32, 5, M('#3a2418'));            // the heat lamp housing
    G.R(g, 407, y0 + 11, 30, 1.5, M(dim ? '#6b4a30' : '#ff9a3a'));
    if (!dim) G.glow(g, 422, y0 + 20, 42, 26, '#ff9a3a', 0.26);
    G.R(g, 408, y0 + 22, 28, 13, M('#c9a45c'));          // the bin of fries
    G.bevelq(g, 408, y0 + 22, 28, 13, M('#e8c890'), M('#6b5228'));
    for (let i = 0; i < 14; i++) {
      const fx = 410 + G.hash(i, 3) * 24, fy = y0 + 23 + G.hash(i, 7) * 4;
      G.Rh(g, fx, fy, 1, 2.5 + G.hash(i, 11) * 2.5, M(i % 3 ? '#ffd45a' : '#f0b83a'));
    }
    G.R(g, 404, y0 + 35, 36, 3, M('#5c6472'));
    // two baskets hanging on the rail beside it
    for (let i = 0; i < 2; i++) {
      const bx2 = 442 + i * 9;
      G.R(g, bx2, y0 + 18, 7, 10, M('#6b7484'));
      G.hairq(g, bx2, y0 + 18, 7, M('#b4bcc8'));
      for (let k = 1; k < 4; k++) G.hairq(g, bx2 + 0.5, y0 + 19 + k * 2.2, 6, M('#454e60'));
    }

    // ---- and a stack of cups, three sizes ----
    for (let i = 0; i < 3; i++) {
      const cxx = 466 + i * 12, ch = 13 + i * 4;
      for (let k = 0; k < 4; k++) {
        G.R(g, cxx - 5, y0 + 38 - ch - k * 3, 10, 4, M('#f0e2d4'));
        G.hairq(g, cxx - 5, y0 + 38 - ch - k * 3, 10, M('#ffffff'));
        G.hairq(g, cxx - 5, y0 + 41 - ch - k * 3, 10, M('#c8383a'));
      }
    }
  }
  // the floor: a checker on the back plane, bigger tiles at the front
  function checkerFloor(g, x0, x1, dim) {
    const M = (c) => G.mix(c, '#241018', dim || 0);
    let y = FB, h = 4;
    for (let j = 0; y < G.H; j++) {
      const tw = 9 + j * 1.6;
      for (let i = Math.floor(x0 / tw) - 1; i < x1 / tw + 1; i++)
        G.Rh(g, i * tw, y, tw + 0.5, h + 0.5,
          (i + j) % 2 ? M('#e9ddc9') : M('#bf858a'));
      y += h; h += 1.1;
    }
    g.globalAlpha = 0.2; G.R(g, x0, FB, x1 - x0, 8, '#3a1a20'); g.globalAlpha = 1;
  }
  // a booth on the back plane: a back you can see over, a solid front
  // that hides the legs of whoever is sat in it, and a table
  function booth(g, x, w, dim, tone) {
    const M = (c) => G.mix(c, '#241018', dim || 0);
    const c = tone || '#8a2f3a';
    G.R(g, x - 1, FB - 47, w + 2, 32, OUT);
    G.R(g, x, FB - 46, w, 30, M(G.shade(c, -0.1)));      // the back you see over
    G.R(g, x, FB - 46, w, 5, M(G.shade(c, 0.3)));
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++)
      G.Rq(g, x + 9 + i * (w / 4.3), FB - 38 + j * 9, 1, 1, M('#4a1620'));
    G.R(g, x - 1, FB - 31, w + 2, 32, OUT);
    G.R(g, x, FB - 30, w, 30, M(G.shade(c, -0.35)));     // the bench, and the legs it hides
    G.R(g, x, FB - 30, w, 4, M(G.shade(c, 0.12)));
    G.R(g, x, FB - 4, w, 4, M(G.shade(c, -0.6)));
    for (let i = 0; i * 22 < w; i++)
      G.vseam(g, x + 11 + i * 22, FB - 26, 20, M('#3a1218'), M(G.shade(c, 0.2)));
    g.globalAlpha = 0.22; G.R(g, x - 3, FB, w + 6, 4, '#000000'); g.globalAlpha = 1;
  }
  function boothTable(g, x, dim) {
    const M = (c) => G.mix(c, '#241018', dim || 0);
    G.R(g, x - 1, FB - 25, 46, 5, OUT);
    G.R(g, x, FB - 24, 44, 3, M('#d8b488'));
    G.hairq(g, x, FB - 24, 44, M('#f6e0c0'));
    G.R(g, x + 19, FB - 21, 6, 21, M('#8a6a44'));
    G.R(g, x + 14, FB - 2, 16, 3, M('#6b5238'));
  }
  // the window, and the wet car park through it
  function window7(g, x, S, dim) {
    const M = (c) => G.mix(c, '#241018', dim || 0);
    const w = 84, y = FB - 100, h = 46;
    G.plate(g, x, y, w, h, M('#e8c8a0'), { r: 2, band: 2 });
    G.R(g, x + 4, y + 4, w - 8, h - 8, M('#101c2a'));
    // ---- THE SEAFRONT ----
    // It looked out on a car park with six parked cars in it, in a game
    // whose whole first line is that this is a chain on a promenade.
    const HZ = y + h - 26;
    // it is raining at night, but a window you cannot see anything
    // through is a black rectangle with a frame round it
    for (let j = 0; j < HZ - (y + 4); j++)                // sky
      G.Rh(g, x + 4, y + 4 + j, w - 8, 1,
        M(G.mix('#4a628f', '#26395c', j / Math.max(1, HZ - y - 4))));
    // a pier out on the water, because a promenade has one
    G.R(g, x + w * 0.58, HZ - 5, w * 0.30, 4, M('#1a2438'));
    for (let i = 0; i < 4; i++) G.Rh(g, x + w * 0.62 + i * w * 0.07, HZ - 2, 1, 3, M('#1a2438'));
    G.hairq(g, x + 4, HZ - 0.5, w - 8, M('#93b7d8'));     // the horizon
    for (let j = 0; j < 14; j++)                          // the sea, banded
      G.Rh(g, x + 4, HZ + j, w - 8, 1, M(G.mix('#3d7ba0', '#1d4160', j / 14)));
    for (let i = 0; i < 18; i++) {                        // and the light on it
      const q = G.hash(i, 5);
      G.Rh(g, x + 6 + q * (w - 14), HZ + 2 + G.hash(i, 9) * 10,
        2 + G.hash(i, 3) * 4, 0.5, M(i % 3 ? '#43769c' : '#7fb0cc'));
    }
    G.R(g, x + 4, y + h - 12, w - 8, 8, M('#2e3c50'));    // the promenade
    G.hairq(g, x + 4, y + h - 12, w - 8, M('#556680'));
    // the railing along it: posts and a top rail
    G.R(g, x + 4, y + h - 17, w - 8, 1.5, M('#4a5c74'));
    for (let i = 0; i * 9 < w - 10; i++)
      G.Rh(g, x + 7 + i * 9, y + h - 17, 1, 6, M('#3d4c62'));
    // a lamp on the prom, and what it does to the wet
    if (!dim) {
      G.fc(g, x + w * 0.24, y + h - 22, 1.6, '#ffe6a8');
      G.glow(g, x + w * 0.24, y + h - 16, 34, 22, '#ffd9a0', 0.4);
    }
    if (!dim) {
      G.glow(g, x + w * 0.66, y + h - 14, 60, 30, '#ff8ab0', 0.3);
      G.glow(g, x + w * 0.3, y + h - 12, 40, 20, '#ffd45a', 0.2);
    }
    for (let i = 0; i < 14; i++) {                       // rain on the glass
      const sd = G.hash(i + x, 3);
      G.Rh(g, x + 5 + ((sd * (w - 10) + S.t * 12) % (w - 10)),
        y + 5 + ((G.hash(i, 5) * (h - 10) + S.t * 70) % (h - 10)), 0.5, 3, M('#4f7ea8'));
    }
    G.Rh(g, x + w / 2 - 0.75, y + 4, 1.5, h - 8, M('#e8c8a0'));
    G.Rh(g, x + 4, y + h / 2, w - 8, 1.5, M('#e8c8a0'));
  }

  // ============================================================
  // ACT ONE: THE FLOOR
  // ============================================================
  const CNT_X0 = 340, CNT_X1 = 500;         // the counter
  const CNT_TOP = FB - 22;                  // waist high on a grown adult
  const STAGE_X = 292;
  const DOOR_X = 524;
  const B1 = 16, B2 = 140;                  // two booths
  const BW1 = 88, BW2 = 100;
  const TARGET_X = 250;                     // where it points. A child is stood there.
  const PAT_X = 352;                        // and where it stops, close enough to see
  const WINDOW = 4.5;                       // how long you get. It cannot be failed.

  // ============================================================
  // THE DANCE.
  //
  // It used to be four scripted beats you watched: he waved, he said a
  // line, the room cheered, and the objective advanced. The one moment
  // in act one where the whole restaurant is looking at you and you are
  // doing the thing you were built to do, and you had nothing to do
  // with it.
  //
  // It is a little game now. Five bars; a marker sweeps the track once
  // a bar; tap while it is in the middle and he SNAPS into the pose.
  // Tap late and he flops into it. It cannot be failed -- five misses
  // still gets you off the stage and the kids still clap, because they
  // are four -- but five hits gets you a different line and the old
  // couple in the back booth remember who you used to be.
  //
  // The poses are all arms, because he grew hands last pass and this is
  // the only place in the game that gets to show them off.
  // ============================================================
  // BIG. The first set sat within a few units of where his arms hang
  // anyway, so the whole dance read as a robot standing still. His head
  // top is about 52 above the floor; a pose that does not clear it is
  // not a pose, it is a fidget.
  const POSE = [
    { lab: 'UP',     h: [[-17, -60], [17, -60]], hop: 32 },
    { lab: 'LEFT',   h: [[-32, -50], [7, -14]],  hop: 10 },
    { lab: 'RIGHT',  h: [[-7, -14], [32, -50]],  hop: 10 },
    { lab: 'CLAP',   h: [[-5, -40], [5, -40]],   hop: 18, grip: 1 },
    { lab: 'FINISH', h: [[-34, -62], [34, -62]], hop: 44 },
  ];
  const BARS = POSE.length;
  const SWEEP = 1.15;                 // seconds a marker takes to cross
  const ZONE_LO = 0.44, ZONE_HI = 0.64;

  function danceStart(S) {
    S.lock = 1;
    S.hush = 1;
    S.flags.onstage = 1;
    S.flags.dance = { t: 0, bar: 0, tapped: [], res: [], hits: 0, pop: 0, last: -1, over: 0 };
    S.pclip = 'idle';
    S.setObj('TAP ON THE BEAT');
    G.audio.sfx('menu');
    S.mine('RIGHT. EVERYBODY WATCHING? GOOD.', 2.2);
  }

  // where the marker is, 0..1 across the track
  function danceMark(d) { return (d.t % SWEEP) / SWEEP; }

  function danceTap(S) {
    const d = S.flags.dance;
    if (!d || d.over) return;
    const bar = Math.floor(d.t / SWEEP);
    if (bar >= BARS || d.tapped[bar]) return;
    d.tapped[bar] = true;
    const m = danceMark(d);
    const hit = m >= ZONE_LO && m <= ZONE_HI;
    d.res[bar] = hit;
    const P = POSE[Math.min(bar, BARS - 1)];
    d.pop = 1;
    if (hit) {
      d.hits++;
      S.sqV = -(P.hop + 18);
      G.audio.sfx('coin');
      S.bang(S.px, F - 40, ['#ffd45a', '#ff8ab0', '#8fd8c0', '#7fd8ff'][bar % 4], 12, 2.2);
      for (let i = 0; i < 9; i++)
        S.pop(S.px + G.rand(-30, 30), F - 62 + G.rand(-10, 10), 'bit',
          ['#ffd45a', '#8fd8c0', '#ff8ab0', '#7fd8ff'][i % 4], 0, 2.4);
      S.cheer(['k1', 'k2', 'k3', 'run'], 26);
      // over HIM, not over the middle of the screen
      G.floatText(['NICE', 'YES', 'GO ON', 'LOVELY', 'BIG FINISH'][bar],
        S.px - Math.round(G.cam.x), F - 74, '#ffd45a');
    } else {
      S.sqV = 16;
      G.audio.sfx('denied');
      G.floatText('OFF THE BEAT', S.px - Math.round(G.cam.x), F - 74, '#8a94a8');
    }
  }

  function danceUpdate(S, dt) {
    const d = S.flags.dance;
    if (!d) return;
    d.t += dt;
    d.pop = Math.max(0, d.pop - dt * 3);
    const bar = Math.floor(d.t / SWEEP);
    // a click on the downbeat, so there is a beat to be on
    if (bar !== d.last && bar < BARS) {
      d.last = bar;
      G.audio.sfx('clack');
      for (const id of ['k1', 'k2', 'k3']) { const a = S.actor(id); if (a) a.hopV = -14; }
    }
    // ---- the pose, eased toward whatever bar we are in ----
    const P = POSE[G.clamp(bar, 0, BARS - 1)];
    const snap = d.tapped[bar] ? 1 : 0.45;             // crisp if you hit it
    const wob = d.tapped[bar] ? 0 : Math.sin(d.t * 9) * 2;
    const k = Math.min(1, dt * (6 + snap * 10));
    if (!S.phands) S.phands = [{ x: S.px - 9, y: F - 20 }, { x: S.px + 9, y: F - 20 }];
    for (let i = 0; i < 2; i++) {
      const tgt = { x: S.px + P.h[i][0], y: F + P.h[i][1] + wob };
      S.phands[i].x = G.lerp(S.phands[i].x, tgt.x, k);
      S.phands[i].y = G.lerp(S.phands[i].y, tgt.y, k);
      S.phands[i].grip = P.grip ? 1 : 0;
    }
    if (bar >= BARS && !d.over) {
      d.over = 1;
      danceEnd(S, d);
    }
  }

  function danceEnd(S, d) {
    const all = d.hits >= BARS, most = d.hits >= 3;
    S.flags.dance = null;
    S.phands = null;
    S.setObj(null);
    S.play([
      { d: 1.6,
        go(S2) {
          S2.pclip = 'wave'; S2.pp = 1; S2.sqV = -52;
          S2.cheer(['k1', 'k2', 'k3', 'run', 'e1', 'e2', 'mum'], 38);
          for (const id of ['k1', 'k2', 'k3', 'run']) {
            const a = S2.actor(id); if (a) { a.hold = 2.6; a.holdClip = 'point'; a.p = 1; }
          }
          S2.bang(STAGE_X, F - 40, '#ff8ab0', 18, 3.2);
          G.audio.sfx(all ? 'perfect' : 'coin');
          G.floatText(all ? 'PERFECT' : most ? 'CROWD PLEASER' : 'THEY CLAPPED ANYWAY',
            G.W / 2, 44, all ? '#ffd45a' : most ? '#ff9ab8' : '#8fd8c0', 1);
          for (let i = 0; i < (all ? 40 : 18); i++)
            S2.pop(STAGE_X + G.rand(-60, 60), 22 + G.rand(0, 14), 'bit',
              ['#ffd45a', '#8fd8c0', '#ff8ab0', '#7fd8ff'][i % 4], 0, 2.6);
        } },
      { d: 2.6,
        go(S2) {
          S2.say('e2', all ? 'THAT COW HAS STILL GOT IT. LOOK AT HIM GO.'
                           : most ? 'THAT COW HAS STILL GOT IT.'
                                  : 'HE IS TRYING. THAT IS THE MAIN THING.', 2.6);
        } },
      { d: 0.2,
        go(S2) {
          S2.lock = 0; S2.hush = 0; S2.pclip = 'idle';
          S2.setObj("COLLECT TABLE FOUR'S ORDER");
          G.audio.sfx('unlock');
        } },
    ]);
  }

  // ---- ONE STRIP, UNDER THE ACTION ----
  // The first pass stacked a pose card, a row of pips and the track up
  // the middle of the frame, which put the entire read-out on top of the
  // one thing it was asking you to look at. Pose tab left, track middle,
  // pips right, all of it below his feet.
  function danceDraw(g, S) {
    const d = S.flags.dance;
    if (!d || d.over) return;
    const bar = Math.floor(d.t / SWEEP), m = danceMark(d);
    const pop = G.easeOut(d.pop);
    const Y = 162, H = 12;
    // the strip it all sits on
    g.globalAlpha = 0.86;
    G.R(g, 0, Y - 4, G.W, 22, '#2a1218');
    g.globalAlpha = 1;
    G.hairq(g, 0, Y - 4, G.W, '#8a3a44');

    // ---- the pose, named, on the left ----
    const P = POSE[G.clamp(bar, 0, BARS - 1)];
    G.R(g, 8, Y - 1, 52, H, '#4a1c24');
    G.bevelq(g, 8, Y - 1, 52, H, '#a8505c', '#160a0e');
    G.text(g, P.lab, 34, Y + 2, '#ffd45a', { align: 'center' });

    // ---- the track ----
    const T = { x: 70, y: Y, w: 172, h: H - 2 };
    G.R(g, T.x - 1, T.y - 1, T.w + 2, T.h + 2, '#140a0e');
    G.R(g, T.x, T.y, T.w, T.h, '#3a2028');
    const zx = T.x + T.w * ZONE_LO, zw = T.w * (ZONE_HI - ZONE_LO);
    G.R(g, zx, T.y, zw, T.h, '#2f6b3a');
    G.hairq(g, zx, T.y, zw, '#8fd8c0');
    G.hairq(g, zx, T.y + T.h - 0.25, zw, '#8fd8c0');
    const inZone = m >= ZONE_LO && m <= ZONE_HI;
    if (inZone) { g.globalAlpha = 0.4 + Math.abs(Math.sin(S.t * 12)) * 0.3;
      G.R(g, zx, T.y, zw, T.h, '#b6ff3a'); g.globalAlpha = 1; }
    const mx = T.x + m * T.w;
    G.R(g, mx - 2, T.y - 3, 4, T.h + 6, '#140a0e');
    G.R(g, mx - 1.5, T.y - 2, 3, T.h + 4, inZone ? '#b6ff3a' : '#ffd45a');
    if (pop > 0) {
      g.globalAlpha = pop * 0.8;
      G.oc(g, mx, T.y + T.h / 2, 5 + pop * 12, '#ffe6a8');
      g.globalAlpha = 1;
    }

    // ---- one pip a bar, on the right ----
    for (let i = 0; i < BARS; i++) {
      const sx = 256 + i * 12;
      const seen = i < bar || d.tapped[i];
      const col = !seen ? '#3a2a22' : d.res[i] ? '#ffd45a' : '#6b3a34';
      G.fc(g, sx, Y + 5, 4, '#140a0e');
      G.fc(g, sx, Y + 5, 3, col);
      if (d.res[i]) {
        G.Rq(g, sx - 5, Y + 4.5, 10, 1, col);
        G.Rq(g, sx - 0.5, Y, 1, 10, col);
      }
    }
    if (bar === 0 && d.t < SWEEP * 0.9 && !d.tapped[0])
      G.text(g, 'TAP WHEN IT IS IN THE GREEN', 160, Y - 13,
        Math.sin(S.t * 5) > 0 ? '#ffd45a' : '#8a6a44', { align: 'center', sc: 0.5, out: OUT });
  }

  const floorDef = {
    w: 580, start: 122, obj: 'SAY HELLO TO TABLE FOUR',
    minX: 16, maxX: 552,

    sky(g, S) { G.R(g, 0, 0, G.W, G.H, '#1a1218'); },

    paint(g, S) {
      const dim = S.flags.dark || 0;
      const M = (c) => G.mix(c, '#241018', dim);
      tiledWall(g, 0, 580, dim, S.t);
      checkerFloor(g, 0, 580, dim);
      serviceLine(g, dim, S.t);
      // bunting on a string right across the room
      if (!S.flags.blown) {
        // under the house band, not across it -- strung over the red
        // stripe it read as one more line in a stack of them
        for (let x = 0; x < 580; x += 2) {
          const q = (x % 90) / 90;
          G.Rq(g, x, 38 + Math.sin(q * Math.PI) * 3, 2, 1, M('#c8a884'));
        }
        for (let i = 0; i < 20; i++) {
          const bx = 12 + i * 29, sag = Math.sin(((bx % 90) / 90) * Math.PI) * 3;
          const col = ['#ffd45a', '#8fd8c0', '#ff8ab0', '#7fd8ff'][i % 4];
          for (let j = 0; j < 5; j++)
            G.Rh(g, bx - 4 + j, 39 + sag + j, 9 - j * 2, 1, M(j < 1 ? G.shade(col, 0.3) : col));
        }
      }
      // what the soffit lights do to the floor, which is the thing that
      // ties a ceiling to a room
      if (!dim) for (let lx = 34; lx < 580; lx += 68)
        G.glow(g, lx, F - 6, 82, 28, '#ffd9a0', 0.11);
      window7(g, 20, S, dim);
      window7(g, 138, S, dim);
      // a clock nobody has looked at since four
      G.oc(g, 262, FB - 92, 9, M('#3a2a2e'));
      G.fc(g, 262, FB - 92, 8, M('#f6ead8'));
      G.Rh(g, 262 - 0.5, FB - 97, 1, 5, M('#3a2a2e'));
      G.Rh(g, 262, FB - 92.5, 4, 1, M('#8a2f3a'));
      // the menu board over the counter, with the mark on the end of it
      G.R(g, 352, FB - 106, 136, 28, M('#1a1216'));
      G.bevelq(g, 352, FB - 106, 136, 28, M('#3a2a2e'), '#0a0608');
      G.mooLogo(g, 370, FB - 92, 13, { tone: M('#c8383a') });
      G.text(g, 'BURGER   SWIRL   FRIES', 438, FB - 102, M('#ffd45a'), { align: 'center', sc: 0.5 });
      G.text(g, 'ASK ABOUT THE MOO-BOT MEAL', 438, FB - 94, M('#f0e2d4'), { align: 'center', sc: 0.5 });
      G.text(g, 'NOW WITH FREE CROWNS', 438, FB - 86, M('#8fd8c0'), { align: 'center', sc: 0.5 });
      if (!dim) G.glow(g, 430, FB - 94, 150, 30, '#ffd45a', 0.14);
      // and a proper backlit roundel on the wall between the windows,
      // because a chain puts its mark where you cannot miss it
      // It went up at 310, FB-116 first, which is the fascia band at the
      // very top of the wall and the far right of the room -- half of it
      // hung off the edge of the frame. The pier between the two windows
      // is the one piece of bare wall at eye height.
      G.mooLogo(g, 121, FB - 76, 14, { tone: M('#c8383a') });
      if (!dim) G.glow(g, 121, FB - 76, 52, 52, '#ffd45a', 0.22);
      // the front door, on the back wall, one you could walk through
      const bust = S.flags.busted;
      const dy0 = FB - Z.DOOR_H;
      G.R(g, DOOR_X - 5, dy0 - 5, Z.DOOR_W + 10, 5, M('#4a5568'));
      G.R(g, DOOR_X - 5, dy0, 5, Z.DOOR_H, M('#4a5568'));
      G.R(g, DOOR_X + Z.DOOR_W, dy0, 5, Z.DOOR_H, M('#4a5568'));
      G.R(g, DOOR_X, dy0, Z.DOOR_W, Z.DOOR_H, bust ? '#080c14' : M('#26384c'));
      if (!bust) {
        G.hairq(g, DOOR_X + 2, dy0 + 3, Z.DOOR_W - 4, M('#6b8aa8'));
        G.Rh(g, DOOR_X + Z.DOOR_W / 2 - 0.5, dy0, 1, Z.DOOR_H, M('#4a5568'));
        G.Rh(g, DOOR_X + 4, FB - 40, 3, 12, M('#c8ccd4'));
        G.Rh(g, DOOR_X + Z.DOOR_W - 7, FB - 40, 3, 12, M('#c8ccd4'));
        G.text(g, 'PUSH', DOOR_X + Z.DOOR_W / 2, FB - 26, M('#7f96ac'), { align: 'center', sc: 0.5 });
        if (!dim) G.glow(g, DOOR_X + Z.DOOR_W / 2, FB - 40, 46, 70, '#3f5a7a', 0.3);
      } else {
        for (let i = 0; i < 20; i++)
          G.Rh(g, DOOR_X + G.hash(i, 3) * Z.DOOR_W, dy0 + G.hash(i, 7) * 12,
            2 + G.hash(i, 9) * 5, 3 + G.hash(i, 11) * 8, '#3a4a63');
        for (let i = 0; i < 30; i++) {
          const sd = G.hash(i, 13);
          G.Rh(g, DOOR_X + ((sd * Z.DOOR_W + S.t * 22) % Z.DOOR_W),
            dy0 + ((G.hash(i, 17) * Z.DOOR_H + S.t * 160) % Z.DOOR_H), 0.5, 4, '#6b90b8');
        }
      }
      // ---- THE BITS OF FURNITURE A CHAIN LEAVES STANDING ABOUT ----
      // a condiment and napkin stand, and a swing-flap bin beside it, on
      // the back plane between the last booth and the counter
      if (!S.flags.blown) {
        G.R(g, 258, FB - 26, 30, 26, M('#b08050'));
        G.bevelq(g, 258, FB - 26, 30, 26, M('#d8a870'), M('#6b4a28'));
        G.R(g, 258, FB - 29, 30, 4, M('#9aa4b4'));
        G.hairq(g, 258, FB - 29, 30, M('#d4dce8'));
        for (let i = 0; i < 3; i++) {                    // pumps
          G.R(g, 262 + i * 9, FB - 37, 6, 8, M(['#c8383a', '#e8c840', '#8a5c3a'][i]));
          G.hairq(g, 262 + i * 9, FB - 37, 6, M('#ffffff'));
          G.Rq(g, 264 + i * 9, FB - 40, 2, 3, M('#5c6472'));
        }
        G.R(g, 292, FB - 34, 22, 34, M('#3a4250'));      // the bin
        G.bevelq(g, 292, FB - 34, 22, 34, M('#6b7484'), M('#1a2028'));
        G.R(g, 292, FB - 37, 22, 4, M('#9aa4b4'));
        G.R(g, 298, FB - 36, 10, 2, M('#141a22'));       // the flap
        G.text(g, 'TRAYS', 303, FB - 24, M('#8a94a8'), { align: 'center', sc: 0.5 });
      }
      // a poster stand by the door, the meal deal nobody reads
      G.R(g, 500, FB - 52, 20, 44, M('#8a2f3a'));
      G.bevelq(g, 500, FB - 52, 20, 44, M('#c8505c'), M('#4a1620'));
      G.R(g, 502, FB - 50, 16, 30, M('#f6ecd6'));
      G.mooLogo(g, 510, FB - 42, 6, { word: false, tone: M('#c8383a') });
      G.text(g, 'MEAL', 510, FB - 32, M('#8a2f3a'), { align: 'center', sc: 0.5 });
      G.text(g, 'DEAL', 510, FB - 25, M('#8a2f3a'), { align: 'center', sc: 0.5 });
      // the little stage, on the near floor, with a light on it
      G.fe(g, STAGE_X, F + 1, 36, 7, M('#7a262f'));
      G.fe(g, STAGE_X, F - 2, 34, 6, M('#c8505c'));
      G.hairq(g, STAGE_X - 17, FB - 9, 34, M('#e8828c'));
      for (let i = 0; i < 5; i++)
        G.Rq(g, STAGE_X - 14 + i * 7, F - 5, 3, 1, M('#8a2f3a'));
      G.fe(g, STAGE_X, F - 4, 34, 6, M('#e8828c'));
      G.fe(g, STAGE_X, F - 3, 32, 5, M('#c8505c'));
      if (!dim) G.glow(g, STAGE_X, F - 34, 150, 100, '#ffd9a0', 0.24);
    },

    // the counter body and the booths, drawn OVER anyone behind them
    mid(g, S) {
      const dim = S.flags.dark || 0;
      const M = (c) => G.mix(c, '#241018', dim);
      // the soft serve machine sits ON the counter, so it goes first
      G.plate(g, 466, CNT_TOP - 28, 26, 28, M('#c8ccd4'), { r: 1, band: 2, bolts: 1 });
      G.R(g, 471, CNT_TOP - 24, 15, 9, M('#3a4250'));
      G.Rh(g, 473, CNT_TOP - 22, 4, 4, M('#8fd8c0'));
      G.R(g, 476, CNT_TOP - 3, 6, 4, M('#8a94a8'));
      G.R(g, 350, CNT_TOP - 8, 20, 8, M('#c8505c'));         // trays
      for (let k = 0; k < 3; k++) G.hairq(g, 350, CNT_TOP - 7 + k * 2, 20, M('#e8828c'));
      G.plate(g, 382, CNT_TOP - 16, 18, 16, M('#3a4250'), { r: 1, band: 1, spec: false });
      G.Rh(g, 385, CNT_TOP - 13, 12, 4, M('#8fd8c0'));
      // ---- the counter: stainless top, brand front ----
      // It was a slab of brown wood, which is a pub bar. A chain's
      // service counter is a steel top with a tray rail on the lip and
      // the house colours down the front of it.
      const CW = CNT_X1 - CNT_X0;
      G.R(g, CNT_X0 - 1, CNT_TOP - 1, CW + 2, 34, OUT);
      G.R(g, CNT_X0, CNT_TOP, CW, 4, M('#c8ccd4'));
      G.hairq(g, CNT_X0, CNT_TOP, CW, M('#eef2f8'));
      G.R(g, CNT_X0, CNT_TOP + 4, CW, 2, M('#7a8494'));
      G.R(g, CNT_X0, CNT_TOP + 6, CW, 26, M('#a8262e'));
      G.bevelq(g, CNT_X0, CNT_TOP + 6, CW, 26, M('#c8383a'), M('#5c1418'));
      G.R(g, CNT_X0, CNT_TOP + 14, CW, 4, M('#f6ecd6'));          // the house stripe
      G.hairq(g, CNT_X0, CNT_TOP + 14, CW, M('#ffffff'));
      G.hairq(g, CNT_X0, CNT_TOP + 17.5, CW, M('#c8b89c'));
      for (let i = 0; i * 26 < CW; i++)
        G.vseam(g, CNT_X0 + 10 + i * 26, CNT_TOP + 7, 24, M('#5c1418'), M('#e8585a'));
      G.R(g, CNT_X0, CNT_TOP + 30, CW, 3, M('#4a1014'));
      g.globalAlpha = 0.24;
      G.R(g, CNT_X0 - 4, CNT_TOP + 33, CNT_X1 - CNT_X0 + 8, 5, '#000000');
      g.globalAlpha = 1;
      booth(g, B1, BW1, dim);
      booth(g, B2, BW2, dim);
      boothTable(g, B1 + 22, dim);
      boothTable(g, B2 + 28, dim);
      // the cake, on the birthday table
      if (!S.flags.blown) {
        const cx = B2 + 50;
        G.rr(g, cx - 10, FB - 33, 21, 9, M('#f6e8d8'));
        G.Rh(g, cx - 10, FB - 33, 21, 1.5, M('#ff9ab8'));
        for (let i = 0; i < 4; i++) {
          G.Rh(g, cx - 6 + i * 4, FB - 38, 1, 5, '#f0e2d4');
          G.fc(g, cx - 5.5 + i * 4, FB - 39, 1.2, Math.sin(S.t * 9 + i) > 0 ? '#ffe08a' : '#ffb050');
        }
      }
    },

    fore(g, S) {
      // ---- IT CAME IN WITH A GUN. The barrel, the line it is
      // drawing across the room, and the dot sitting on a child. ----
      if (S.flags.busted && !S.flags.dark) {
        const pat = S.actor('pat');
        const gx = (pat ? pat.x : PAT_X) - 9, gy = F - 40;
        const tx = TARGET_X + 4, ty = F - 24;
        G.R(g, gx - 30, gy - 5, 34, 10, OUT);                // barrel
        G.R(g, gx - 29, gy - 4, 32, 8, '#8695ad');
        G.Rh(g, gx - 29, gy - 4, 32, 2, '#d2dced');
        G.Rh(g, gx - 29, gy + 2, 32, 2, '#4a5670');
        G.Rh(g, gx - 22, gy - 4, 1.5, 8, '#5c6a84');         // a joint in it
        G.Rh(g, gx - 13, gy - 4, 1.5, 8, '#5c6a84');
        G.R(g, gx - 7, gy - 11, 13, 18, OUT);                // body and grip
        G.R(g, gx - 6, gy - 10, 11, 16, '#6f7f99');
        G.Rh(g, gx - 6, gy - 10, 11, 2, '#c4cfe2');
        G.R(g, gx - 5, gy + 7, 9, 9, OUT);
        G.R(g, gx - 4, gy + 8, 7, 7, '#3f4a60');
        G.Rh(g, gx - 4, gy - 6, 8, 2, '#ffd45a');            // a charge, filling
        G.R(g, gx - 33, gy - 3, 4, 6, OUT);                  // muzzle, warm
        G.R(g, gx - 32, gy - 2, 3, 4, '#ff8a4a');
        G.glow(g, gx - 31, gy, 26, 16, '#ff8a4a', 0.5);
        // the line, walking toward whoever it has decided about
        if (S.flags.aim) {
          const span = Math.max(1, gx - 28 - tx);
          const n = Math.max(1, Math.floor(span / 9));
          for (let i = 0; i < n; i++) {
            if (((S.t * 9 + i) % 3) < 0.8) continue;
            const q2 = i / Math.max(1, n - 1);
            const ly = G.lerp(gy - 1, ty, q2);
            G.Rh(g, gx - 28 - i * 9, ly, 6, 1.5, '#ff2a2a');
            G.Rh(g, gx - 28 - i * 9, ly, 6, 0.5, '#ffb0a0');
          }
          // the dot, on a four-year-old
          const puls = 2 + Math.sin(S.t * 13) * 0.9;
          G.glow(g, tx, ty, 26, 26, '#ff2a2a', 0.75 * S.flags.aim);
          G.fc(g, tx, ty, puls, '#ff2a2a');
          G.fc(g, tx, ty, puls * 0.4, '#ffd0c8');
          for (let i = 0; i < 4; i++) {                      // reticle ticks
            const a2 = i * 1.5708 + S.t * 0.9, rr = 5.5 + Math.sin(S.t * 13) * 1.2;
            G.Rh(g, tx + Math.cos(a2) * rr - 0.75, ty + Math.sin(a2) * rr - 0.75, 1.5, 1.5, '#ff2a2a');
          }
        }
      }
      // ---- and it goes into you instead ----
      if (S.flags.beam > 0) {
        const pat = S.actor('pat');
        const gx = (pat ? pat.x : PAT_X) - 42, gy = F - 40;
        const bx = S.px + 4, by = F - 20;      // dead on the badge
        const w2 = 2 + S.flags.beam * 2.5;
        for (let i = 0; i <= 30; i++) {
          const p2 = i / 30;
          G.Rh(g, G.lerp(gx, bx, p2) - w2, G.lerp(gy, by, p2) - w2 * 0.5, w2 * 2, w2, '#fff0d0');
        }
        G.glow(g, (gx + bx) / 2, (gy + by) / 2, Math.abs(gx - bx) + 30, 26, '#ffb060', S.flags.beam);
        G.glow(g, bx, by, 46, 40, '#fff0d0', S.flags.beam);
      }
      if (S.flags.shards) {
        const p = S.flags.shards;
        for (let i = 0; i < 30; i++) {
          const a = G.hash(i, 3) * 2.2 - 1.6, sp = 40 + G.hash(i, 7) * 130;
          const sx = DOOR_X + 16 - Math.cos(a) * sp * p;
          const sy = FB - 44 + Math.sin(a) * sp * p * 0.5 + p * p * 80;
          G.Rh(g, sx, sy, 1.5, 2.5, '#bfe4ff');
          G.Rq(g, sx, sy, 1, 1, '#ffffff');
        }
      }
      if (S.flags.charge) {
        const bx = 396, tick = Math.sin(S.t * 12) > 0;
        G.rr2(g, bx - 7, CNT_TOP - 14, 14, 14, '#232b38');
        G.bevelq(g, bx - 7, CNT_TOP - 14, 14, 14, '#41506a', '#0d1118');
        G.Rq(g, bx - 1, CNT_TOP - 9, 2, 2, tick ? '#ff4a4a' : '#5a1a1a');
        if (tick) G.glow(g, bx, CNT_TOP - 8, 36, 26, '#ff4a4a', 0.5);
      }
      // ---- WHAT IT PUT IN YOU ----
      // Your leg used to cartwheel across the room here. It stays on now;
      // what leaves instead is a piece of you per round. Each hole is
      // punched where the round landed, still glowing at the rim, venting.
      if (S.flags.hits) {
        // once you are on your front the whole body is down at floor
        // level, so the holes come down with it -- they were drawn at
        // standing height and ended up hanging over your own head.
        const fl = S.pcrawl ? 1 : 0;
        let glows = 0;
        for (const h of S.flags.hits) {
          // On your front the body is long and low, so the axes swap: how
          // HIGH a round landed on your chest is now how far FORWARD it is.
          // Scaling both axes down instead packed all six into one 12x6
          // box and they read as a single black smudge.
          const hx = S.px + (fl ? h.x * 0.8 - (h.y + 25) * 0.55 : h.x);
          const hy = F + (fl ? -13 + h.x * 0.35 : h.y);
          const r = h.r * (fl ? 0.78 : 1);
          const cool = G.clamp(1 - h.t * 0.7, 0, 1);
          G.fc(g, hx, hy, r + 1, '#1a1218');
          G.fc(g, hx, hy, r, '#0b0810');
          // Only the two freshest rims are still hot. Six glows at half
          // strength stack into one orange mass with a cow behind it.
          if (cool > 0.02) {
            g.globalAlpha = cool;
            G.oc(g, hx, hy, r + 0.5, '#ff8a3a');
            if (glows++ < 2) G.glow(g, hx, hy, r * 4, r * 4, '#ff6a2a', 0.45 * cool);
            g.globalAlpha = 1;
          }
          // torn shell round the edge, and something leaking out of it
          for (let i = 0; i < 5; i++) {
            const a2 = h.seed + i * 1.257;
            G.Rq(g, hx + Math.cos(a2) * (r + 0.6), hy + Math.sin(a2) * (r + 0.6),
              1.25, 1.25, i % 2 ? '#c8bfae' : '#8f8474');
          }
          if (Math.sin(S.t * 6 + h.seed) > 0.4)
            G.Rq(g, hx + G.rand(-1, 1), hy + r, 1, 2, '#3affd0');
        }
      }
      // ---- AND THE ROOM STOPS BEING A RESTAURANT ----
      // It carried on being bright, pink and cheerful all the way through
      // the shooting, which is a tonal problem you can see from the back
      // of the room. The colour drains out of everything but the muzzle.
      if (S.flags.hits && S.flags.hits.length) {
        const d = G.clamp(S.flags.hits.length / ROUNDS, 0, 1);
        // 0.3 was not enough to see: the floor still read bright pink with
        // six holes in you.
        g.globalAlpha = 0.52 * d;
        G.R(g, G.cam.x - 4, 0, G.W + 8, G.H, '#241018');
        g.globalAlpha = 1;
        for (let i = 0; i < 5; i++) {
          g.globalAlpha = 0.16 * d;
          G.R(g, G.cam.x - 4, 0, G.W + 8, 4 + i * 4, '#0a0206');
          G.R(g, G.cam.x - 4, G.H - 4 - i * 4, G.W + 8, 4 + i * 4, '#0a0206');
          g.globalAlpha = 1;
        }
      }
      if (S.flags.flash) {
        g.globalAlpha = S.flags.flash;
        G.R(g, G.cam.x - 4, 0, G.W + 8, G.H, '#fff6e0');
        g.globalAlpha = 1;
      }
    },

    // ---- the shift. Everybody has a name, a job, and things they
    // say when you walk past them. ----
    actors: [
      { id: 'sam', name: 'SAM', at: 400, dy: -18, behind: 1, seed: 21.6, badge: 1, col: '#8fd8c0',
        lines: ['THE SHAKE MACHINE IS DOWN. THE SHAKE MACHINE IS ALWAYS DOWN.',
                'IF ANYONE ASKS, THE FRIES ARE FRESH.',
                'SOMEBODY ORDERED A BURGER WITH NO BURGER IN IT.',
                'I HAVE BEEN ON SINCE SIX AND I HAVE SEEN THINGS.'],
        script: [{ clip: 'idle', d: 4 },
                 { say: 'TABLE FOUR! TWO SWIRLS AND A HAPPY BIRTHDAY!', d: 2.8 },
                 { clip: 'reach', d: 1.8 }, { wait: 3 },
                 { say: 'ORDER UP.', d: 1.6 }, { wait: 5 }] },
      { id: 'sam2', name: 'KEV', at: 460, dy: -18, behind: 1, seed: 44.2, badge: 1, col: '#8fd8c0',
        lines: ['I AM NOT PAID ENOUGH TO WEAR THIS HAT.',
                'THE ICE MACHINE IS MAKING A NEW NOISE.',
                'BESSIE. YOUR BELL IS IN THE GRAVY.'],
        script: [{ clip: 'reach', d: 2.4 }, { clip: 'idle', d: 3 }, { clip: 'talk', d: 2 }, { wait: 4 }] },
      { id: 'k1', name: 'LEO', at: B2 + 18, sit: 1, sitDy: -18, dy: -18, behind: 1, seed: 2.2,
        hat: 'crown', smile: 1, col: '#a8d158',
        lines: ['ARE YOU A REAL COW', 'MY DAD SAYS YOU ARE A MACHINE',
                'CAN I HAVE YOUR BELL', 'WHY HAVE YOU GOT A BADGE'],
        script: [{ clip: 'idle', d: 3 }, { say: 'IS IT COMING', d: 1.8 }, { clip: 'talk', d: 2 }, { wait: 4 }] },
      { id: 'k2', name: 'PIP', at: B2 + 44, sit: 1, sitDy: -18, dy: -18, behind: 1, seed: 7.7,
        hat: 'crown', smile: 1, col: '#a8d158',
        lines: ['MOO', 'MOO MOO', 'I HAVE HAD SIX', 'I AM NOT TIRED'],
        script: [{ wait: 2 }, { clip: 'talk', d: 2.4 }, { wait: 5 }] },
      { id: 'k3', name: 'BEA', at: B2 + 70, sit: 1, sitDy: -18, dy: -18, behind: 1, seed: 12.9,
        hat: 'crown', smile: 1, col: '#a8d158',
        lines: ['I AM FOUR', 'I AM FOUR AND A HALF', 'DO IT AGAIN', 'AGAIN'],
        script: [{ wait: 5 }, { say: 'MOO! MOO!', d: 2 }, { wait: 6 }] },
      { id: 'mum', name: 'MUM', at: B2 + 94, sit: 1, sitDy: -18, dy: -18, behind: 1, seed: 4.4,
        smile: 1, col: '#7fd8ff',
        lines: ['THEY HAVE HAD SO MUCH SUGAR.', 'DO NOT CLIMB ON THE COW.',
                'SAY THANK YOU TO THE COW.', 'I ONLY CAME IN FOR A COFFEE.'],
        script: [{ clip: 'idle', d: 6 }, { say: 'SIT DOWN AND EAT IT, THE PAIR OF YOU.', d: 2.6 }, { wait: 7 }] },
      { id: 'e1', name: 'DEREK', at: B1 + 20, sit: 1, sitDy: -18, dy: -18, behind: 1, seed: 18.3,
        col: '#f0c04a',
        lines: ['I SAID NO GHERKINS.', 'THERE ARE GHERKINS.',
                'I AM NOT GOING TO SAY ANYTHING.', 'I HAVE SAID SOMETHING.'],
        script: [{ clip: 'idle', d: 5 }, { clip: 'talk', d: 3 }, { wait: 6 }] },
      { id: 'e2', name: 'SHIRL', at: B1 + 60, sit: 1, sitDy: -18, dy: -18, behind: 1, seed: 31.2,
        smile: 1, col: '#e07aa8',
        lines: ['HE IS BUILDING UP TO THE GHERKINS.', 'IT IS A LOVELY LITTLE PLACE.',
                'THAT COW HAS BEEN DANCING FOR AN HOUR.', 'LEAVE THE COW ALONE, DEREK.'],
        script: [{ wait: 3 }, { clip: 'talk', d: 2.4 }, { clip: 'idle', d: 6 }] },
      { id: 'q1', name: 'A MAN IN A COAT', at: 600, seed: 9.4, col: '#f0c04a',
        lines: ['IS THE COW PART OF THE MEAL DEAL', 'I WILL HAVE WHAT HE IS HAVING.',
                'HE IS NOT HAVING ANYTHING.'],
        script: [{ at: 600 }, { go: 452 }, { wait: 2.4 },
                 { say: 'JUST A SWIRL. NO, TWO.', d: 2.2 }, { wait: 2.6 },
                 { go: 320 }, { go: 268 }, { wait: 1.2 }, { go: 600, sp: 1.1 }, { wait: 5 }] },
      { id: 'q2', name: 'A WOMAN IN A CAP', at: 640, seed: 27.1, hat: 'cap', col: '#8fd8ff',
        lines: ['WHAT IS IN THE MOO-BOT SAUCE', 'DO NOT TELL ME WHAT IS IN THE MOO-BOT SAUCE',
                'I HAVE MADE MY PEACE WITH IT.'],
        script: [{ at: 640 }, { wait: 6 }, { go: 482 }, { wait: 4 },
                 { say: 'ARE YOU STILL DOING THE MEAL DEAL', d: 2.2 }, { wait: 3 },
                 { go: 640, sp: 1.1 }, { wait: 8 }] },
      { id: 'run', name: 'A CHILD', at: 206, seed: 33.7, smile: 1, hat: 'crown', col: '#a8d158',
        lines: ['WHEEEE', 'I AM A COW TOO', 'I AM NOT ALLOWED SUGAR', 'MOOOOO'],
        script: [{ go: 274, sp: 1.6 }, { wait: 0.6 }, { go: 196, sp: 1.6 }, { wait: 1.4 }] },
      { id: 'pat', name: 'PATROL', kind: 'bot', bot: 'police', at: 620, dy: -18, scale: 1.2,
        col: '#7fd8ff', hide: (S) => !S.flags.busted, script: [{ clip: 'idle', d: 9 }] },
    ],

    spots: [
      { id: 'hello', x: B2 + 14, off: 0, label: 'SAY HELLO', markY: FB - 54,
        once: 1,
        on(S) {
          S.mine('WHO IS FOUR TODAY, THEN?');
          S.bang(S.px, FB - 30, '#ffd45a', 10);
          S.cheer(['k1', 'k2', 'k3'], 30);
          for (const id of ['k1', 'k2', 'k3']) {
            const a = S.actor(id); if (a) { a.hold = 2.6; a.holdClip = 'point'; a.p = 1; }
          }
          S.play([{ d: 1.1 }, { d: 2.4, go(S2) { S2.say('k3', 'I AM FOUR AND A HALF.', 2.4); S2.jump('k3', 34); } }]);
          S.setObj('GET UP ON THE STAGE'); G.audio.sfx('unlock');
          G.floatText('HELLO!', S.px - Math.round(G.cam.x), FB - 62, '#ffd45a');
        } },
      { id: 'dance', x: STAGE_X, label: 'DO THE DANCE', markY: F - 70,
        once: 1, hidden: (S) => !S.done.hello,
        on(S) { danceStart(S); } },
      { id: 'collect', x: 400, label: 'COLLECT', markY: CNT_TOP - 42,
        once: 1, hidden: (S) => !S.done.dance,
        on(S) {
          const a = S.actor('sam'); if (a) { a.hold = 2.4; a.holdClip = 'reach'; a.p = 1; a.hopV = -20; }
          S.say('sam', 'TWO SWIRLS. MIND THE STEP ON YOUR WAY OVER.', 2.8);
          S.flags.carry = 1;
          S.bang(S.px + 8, CNT_TOP - 6, '#8fd8c0', 8, 1.6);
          S.setObj('TAKE THEM TO TABLE FOUR'); G.audio.sfx('grab');
          G.floatText('x2 SWIRL', S.px - Math.round(G.cam.x), CNT_TOP - 30, '#8fd8c0');
        } },
      // ---- the only thing in this game you have to be quick about ----
      { id: 'save', x: TARGET_X + 28, off: 0, label: 'GET IN FRONT', markY: F - 50,
        once: 1, hidden: (S) => !S.flags.window,
        on(S) { dive(S, 1); } },
      { id: 'serve', x: B2 + 14, off: 0, label: 'HAND THEM OVER', markY: FB - 54,
        once: 1, hidden: (S) => !S.done.collect,
        on(S) {
          S.flags.carry = 0;
          S.say('k1', 'THANK YOU MOO', 2.2);
          S.cheer(['k1', 'k2', 'k3'], 32);
          S.bang(S.px, FB - 34, '#ffd45a', 14, 2.6);
          G.floatText('HAPPY BIRTHDAY', G.W / 2, 44, '#ffd45a', 1);
          S.setObj(null); S.objDone = 1;
          G.audio.sfx('serve');
          S.play([{ d: 1.4 }, { d: 2.6, go(S2) { S2.mine('SIX YEARS OF THIS AND I STILL LIKE IT.', 2.6); } },
                  { d: 0.1, go(S2) { S2.play(ATTACK); } }]);
        } },
    ],
    // while the dance has you locked on the stage, a tap is the game
    onTapLocked(S) { if (S.flags.dance) danceTap(S); },
    // tap yourself and the bell goes. It does nothing. Everybody
    // reacts to it every single time.
    onTap(S, wx, y) {
      if (Math.abs(wx - S.px) < 15 && y > F - 62) {
        S.bang(S.px, F - 34, '#ffd45a', 6, 1.4);
        for (let i = 0; i < 3; i++)
          S.pop(S.px + G.rand(-10, 10), F - 40 - G.rand(0, 8), 'ring', '#ffe6a8', 9, 0.4);
        S.sqV = 28; G.audio.sfx('bell');
        const who = ['k1', 'k2', 'k3', 'run'].filter((id) => {
          const a = S.actor(id); return a && Math.abs(a.x - S.px) < 130;
        });
        S.cheer(who, 26);
        if (Math.random() < 0.6 && who.length && S.bubbles.length < 2) {
          const a = S.actor(who[Math.floor(Math.random() * who.length)]);
          S.say(a.id, G.pick(['MOO', 'AGAIN', 'DO IT AGAIN', 'HA']), 1.4);
        }
        return true;
      }
      return false;
    },

    update(S, dt) {
      if (S.flags.dance) danceUpdate(S, dt);
      if (S.flags.aim) S.flags.aim = Math.min(1, S.flags.aim + dt * 2.4);
      // carrying: both arms forward, both fists shut, and they stay that
      // way through the walk cycle
      if (S.flags.carry && !S.pcrawl) {
        // IN FRONT OF HIS CHEST. At 26 up and 13 out the gloves landed
        // level with his ear cups and the two cones stood up over his
        // head like a pair of antlers.
        const fy = F - 15 + (S.pdy || 0) + (S.pclip === 'walk' ? -Math.abs(Math.sin(S.pwalk * 9)) * 2 : 0);
        S.phands = [{ x: S.px - 9, y: fy, grip: 1 }, { x: S.px + 9, y: fy - 1, grip: 1 }];
      } else if (!S.pcrawl && !S.flags.dance && S.phands && !S.flags.hits) {
        // NOT during the dance: this branch ran on the very next line
        // after danceUpdate had posed him, so every pose was set and
        // then thrown away in the same frame
        S.phands = null;
      }
      // the window. It runs out; it cannot be failed. If you are still
      // stood there when it does, you go anyway - you were always going.
      if (S.flags.window > 0) {
        S.flags.window -= dt;
        if (S.flags.window <= 0) { S.flags.window = 0; dive(S, 0); }
      }
      if (S.flags.beam) S.flags.beam = Math.max(0, S.flags.beam - dt * 2.6);
      if (S.flags.flash) S.flags.flash = Math.max(0, S.flags.flash - dt * 3.2);
      if (S.flags.shards) S.flags.shards = Math.min(1, S.flags.shards + dt * 1.1);
      if (S.flags.hits) for (const h of S.flags.hits) h.t += dt;
      if (S.pknock) S.pknock = Math.max(0, S.pknock - dt * 9);
    },

    after(g, S) {
      danceDraw(g, S);
      // six seconds, drawn where you cannot miss it
      if (S.flags.window > 0) {
        const w = 122, x0 = Math.round(G.W / 2 - w / 2), y0 = 30;
        G.R(g, x0 - 1, y0 - 1, w + 2, 7, OUT);
        G.R(g, x0, y0, w, 5, '#2a1218');
        const fr = G.clamp(S.flags.window / WINDOW, 0, 1);
        const wd = Math.max(1, Math.round(w * fr));
        G.R(g, x0, y0, wd, 5, fr > 0.4 ? '#ff8a4a' : '#ff4a4a');
        G.hairq(g, x0, y0, wd, '#ffe0b8');
      }
      // ---- THE TWO SWIRLS, IN YOUR HANDS ----
      // They used to hang in the air sixteen units either side of him,
      // keeping station while he walked, because he had nothing to hold
      // them with. He has gloves now. S.phands puts his arms out in
      // front and closes the fists; phandPts comes back saying where
      // they ended up, and the cones are drawn there.
      if (S.flags.carry && S.phandPts) {
        G.cam.push(g);
        for (let i = 0; i < 2; i++) {
          const h = S.phandPts[i];
          if (!h) continue;
          const cy = G.cone(g, h.x, h.y + 6, { w: 9, h: 12 });
          // pink, not cream: a cream scoop held against a cream body is a
          // scoop nobody can see
          G.gooScoop(g, h.x, cy - 4, 5, { col: '#ffcfdd', goo: 3, fleck: '#e0708c' },
            { t: S.t, wob: 0.3 });
          // and the glove goes back on TOP of the cone, so he is gripping
          // it rather than balancing it
          if (G.mooHand) G.mooHand(g, h.x, h.y, 3.2, i ? 1 : -1, 1);
        }
        G.cam.pop(g);
      }
      if (S.flags.white) {
        g.globalAlpha = S.flags.white;
        G.R(g, 0, 0, G.W, G.H, '#fffdf4');
        g.globalAlpha = 1;
      }
    },
  };

  // ---- IT COMES IN. Four beats of cutscene, then it hands you back
  // the floor with a red dot sat on a four-year-old and a few seconds
  // to do something about it. ----
  const ATTACK = [
    { d: 1.2, go(S) { S.lock = 1; S.hush = 1; S.pclip = 'idle'; S.bubbles.length = 0; } },
    { d: 1.1,
      go(S) {
        S.flags.busted = 1; S.flags.shards = 0.01;
        G.audio.sfx('snap'); G.shake(5, 0.5); G.screenFlash('#cfe4ff', 0.3);
        const pat = S.actor('pat'); if (pat) pat.x = 578;
      } },
    { d: 2.2,
      go(S) {
        S.say('pat', 'CIVIL PATTERN. NOBODY MOVE.', 2.2);
        S.pclip = 'startle'; S.pp = 0; S.popen = 0.72;
        for (const a of S.actors) {
          if (a.id === 'pat') continue;
          a.hold = 24; a.holdClip = 'startle'; a.p = 0.7;
        }
        // the child stops running. That is the worst part of it.
        const kid = S.actor('run');
        if (kid) {
          kid.x = TARGET_X; kid.dir = 1; kid.walking = 0;
          kid.smile = 0; kid.p = 1; kid.hold = 30; kid.holdClip = 'startle';
          kid.script = [{ clip: 'startle', d: 40 }];
          kid.si = 0; kid.st = 0; kid.started = false;
        }
      },
      tick(S, p) {
        S.pp = Math.min(1, p * 2);
        const pat = S.actor('pat');
        if (pat) { pat.x = G.lerp(578, PAT_X, G.easeOut(p)); pat.dy = G.lerp(-18, 0, G.easeOut(p)); }
        S.camAt = G.lerp(S.px + 26, TARGET_X + 30, G.easeOut(p));   // look at it
      } },
    { d: 2.2,
      go(S) {
        S.flags.aim = 0.01;                 // the dot comes up
        S.say('pat', 'THAT ONE IS NOT ON THE ROLL.', 2.2);
        G.audio.sfx('menu'); G.shake(2, 0.3);
      } },
    { d: 0.1,
      go(S) {
        S.lock = 0; S.pclip = 'idle'; S.camAt = null;
        S.pspeedMul = 1.9;                  // you have never moved this fast
        S.flags.window = WINDOW;
        S.setObj('GET IN FRONT OF THEM');
        S.say('mum', 'NO - NO, THAT IS MY -', 2.2);
        G.audio.sfx('unlock');
      } },
  ];

  // ---- you go. Either because you tapped, or because the last
  // second ran out and you were always going to. ----
  function dive(S, earned) {
    if (S.flags.dived) return;
    S.flags.dived = 1; S.flags.window = 0;
    S.lock = 1; S.goal = null; S.pending = null;
    S.pspeedMul = 1; S.setObj(null); S.objDone = 1;
    S.play(SHOT(earned, S.px));
  }

  // ------------------------------------------------------------
  // AND IT GOES INTO YOU INSTEAD.
  //
  // It used to be one shot. A single beam, a white frame, your leg
  // cartwheeling off across the room, and then you on the floor. One
  // trigger pull for the loudest thing that happens to this character.
  //
  // It empties the magazine now. SIX rounds, on a rhythm, each one
  // landing somewhere different on you, each one knocking you back a
  // little further and leaving a hole that stays. It keeps firing after
  // you have stopped moving, because it is not checking.
  //
  // Your leg stays on. You are simply wrecked: scorched, holed, one
  // horn off, the badge cracked across, and both arms are what you have
  // left to get out of the building with.
  // ------------------------------------------------------------
  const ROUNDS = 6;

  function SHOT(earned, x0) {
    const beats = [
      { d: 0.5,
        go(S) {
          S.pclip = 'reach'; S.pp = 1;
          G.audio.sfx('swish');
          if (earned) G.floatText('GOOD COW', G.W / 2, 44, '#8fd8c0', 1);
        },
        tick(S, p) {
          const e = G.easeOut(p);
          S.px = G.lerp(x0, TARGET_X + 26, e);
          S.pdy = -Math.sin(p * Math.PI) * 26;
          S.pdir = 1;                         // you turn to face it
          if (Math.random() < 0.5)
            S.pop(S.px + G.rand(-8, 8), F - 2, 'dust', '#b8a890', 4, 0.35);
        } },
    ];
    // ---- the burst ----
    for (let i = 0; i < ROUNDS; i++) {
      const first = i === 0, last = i === ROUNDS - 1;
      beats.push({
        d: first ? 0.62 : last ? 1.15 : 0.34,
        go(S) {
          if (first) {
            S.px = TARGET_X + 26; S.pdy = 0; S.pdir = 1;
            S.hush = 1; S.bubbles.length = 0;      // nobody is taking orders
            const kid = S.actor('run'); if (kid) { kid.x = TARGET_X - 14; kid.hopV = -26; }
            S.flags.aim = 0;
            S.pmood = 'sick'; S.pnoBlink = 1; S.pclip = 'startle'; S.pp = 0;
          }
          // each round lands somewhere else on you and stays there
          S.flags.hits = (S.flags.hits || []);
          S.flags.hits.push({
            x: G.rand(-9, 9), y: -14 - G.rand(0, 22),
            r: G.rand(2.2, 4.4), t: 0, seed: G.rand(0, 9),
          });
          S.flags.beam = 1;
          S.flags.flash = first ? 0.85 : 0.34;
          S.pdmg = Math.min(1, (i + 1) / ROUNDS);
          S.pknock = (S.pknock || 0) + (first ? 7 : 3.5);
          G.audio.sfx(first ? 'zap' : 'snap');
          G.shake(first ? 6 : 3.4, first ? 0.5 : 0.22);
          S.bang(S.px + G.rand(-6, 6), F - 26 - G.rand(0, 18), '#ff8a4a', first ? 16 : 9, first ? 3 : 2);
          if (first) S.mine("I'M - I'M STILL UNDER WARRA-", 1.8);
          if (i === 3) S.say('mum', 'STOP IT. STOP IT, IT IS NOT DOING ANYTHING.', 2.2);
          if (last) {
            S.pclip = 'slump'; S.pp = 1; S.popen = 0.42;
            G.screenFlash('#ffb060', 0.3);
          }
        },
        tick(S, p) {
          // you go back with every one of them and never quite recover
          S.pdy = -Math.sin(G.clamp(p * 3, 0, Math.PI)) * 2;
        } });
    }
    beats.push(
      { d: 2.3,
        go(S) {
          S.pcrawl = 1; S.popen = 0.18; S.pclip = 'slump';
          S.phands = [{ x: S.px - 22, y: F - 12 }, { x: S.px + 22, y: F - 8 }];
          S.say('run', 'IT MOVED. IT MOVED FOR ME.', 2.2);
          // everybody who can run, runs
          const away = { q1: 660, q2: 680, run: -50, mum: -50 };
          for (const id in away) {
            const a = S.actor(id);
            if (!a) continue;
            a.hold = 0; a.sitting = 0; a.dy = 0; a.behind = 0;
            a.script = [{ go: away[id], sp: 1.7 }, { wait: 9 }];
            a.si = 0; a.st = 0; a.started = false;
          }
        } },
      { d: 2.2,
        go(S) {
          S.flags.charge = 1; S.say('pat', 'CLEAR THE FLOOR.', 1.8);
          G.audio.sfx('menu');
          // it walks back out through the hole it made
          const pat = S.actor('pat');
          if (pat) { pat.script = [{ go: 620, sp: 1.3 }, { wait: 9 }]; pat.si = 0; pat.st = 0; pat.started = false; }
        } },
      { d: 1.6, go(S) { S.flags.dark = 0.3; }, tick(S, p) { S.flags.dark = 0.2 + p * 0.45; } },
      // ---- and then the camera leaves the room. You do not watch the
      // bomb go off from under it; you watch the front of the building
      // come off from the car park, which is where it can be seen. ----
      { d: 0.8, go(S) { S.flags.white = 0; }, tick(S, p) { S.flags.white = p * 0.7; } },
      { d: 0.4, go(S) { S.finish(() => G.playCine('bomb', () => G.go('wreck', 'FOUR HOURS LATER'))); } });
    return beats;
  }

  (G.scenes = G.scenes || {}).floor = G.makeStage(floorDef);

  // ============================================================
  // ACT TWO: THE WRECK
  // ============================================================
  // ============================================================
  // THE RUINS OF MOO-BOT
  //
  // The first pass drew four rectangles of brick with a scalloped
  // top edge and called it a bombed building. Scalloped is the
  // problem: a blast does not nibble, it BITES, and an even wobble
  // along the top of a wall reads as a castle. You could see the
  // battlements from the far side of the car park.
  //
  // So it is built the way the building was built. A row of steel
  // stanchions, brick infill between them, a concrete lintel over
  // the shopfronts, a fascia band on the lintel with the name on
  // it, and a flat roof over the lot. Then it gets hit, and each of
  // those things fails in the way that thing fails: brick comes
  // away in chunks between the columns, steel bends instead of
  // breaking, the lintel cracks and shows its rebar, the fascia
  // tears loose and hangs by one end, and the roof folds into the
  // middle of the floor with its truss hanging out of it.
  //
  // It is all static, so it is baked once into a buffer. What is
  // left live is the part that has to move: three fires, the smoke
  // off them, one bulb on the fallen sign that has not given up,
  // and the rain.
  // ============================================================
  const RB = {
    top: FB - 84,        // parapet
    lint: FB - 52,       // top of the lintel beam
    head: FB - 44,       // head of the glazing
    cill: FB - 6,        // cill
    x0: -30, x1: 606,
  };
  const COLS = [-18, 68, 154, 240, 326, 412, 498, 584];
  const BAYS = [
    { k: 'wall', fall: 0.18 },
    { k: 'shop', fire: 1 },
    { k: 'gone', fall: 1 },
    { k: 'shop', fire: 0 },
    { k: 'wall', fall: 0.5 },
    { k: 'shop', fire: 1 },
    { k: 'wall', fall: 0.3 },
  ];
  const BRICK_HI = '#6a584e', BRICK_LO = '#181318', STEEL = '#5a6273';
  let wreckBuf = null, cityBuf = null;

  // ---- the top edge of what is left of a wall --------------------
  // Chunks, eight units wide, each one either standing, half taken
  // or gone, with a short ramp between so the breaks are diagonal
  // instead of vertical. Small jitter on top of that for the bricks
  // that came away one at a time.
  function blastTop(x, base, amp, seed) {
    // Chunk WIDTHS vary as well as chunk heights. All-equal chunks is
    // how you get battlements: the eye finds the period and the wall
    // turns into a castle. Two frequencies beaten together kills it.
    const c = Math.floor(x / 8), f = x / 8 - c;
    const step = (n) => { const h = G.hash(n, seed); return h < 0.2 ? 1 : h < 0.58 ? 0.46 : h < 0.84 ? 0.2 : 0; };
    const a = step(c), b = step(c + 1);
    const ramp = 0.1 + G.hash(c, seed + 9) * 0.34;
    const v = f < 1 - ramp ? a : G.lerp(a, b, (f - (1 - ramp)) / ramp);
    // enough long-wave to stop the bays matching, not enough to make dunes
    const slow = Math.sin(x * 0.022 + seed) * 0.09 + Math.sin(x * 0.009 - seed) * 0.08;
    return Math.round(base + (v + slow) * amp + G.hash(x, seed + 4) * 2.2);
  }

  // ---- two units of brick wall, top to bottom --------------------
  function brickCol(g, x, top, bot) {
    // A COURSE IS TWO UNITS AND A BRICK IS SIX. The first pass used ten
    // by five, which at four native pixels a unit is a forty-by-twenty
    // block -- that is not brickwork, that is masonry, and stacked up
    // eighty units it read as a sandstone cliff with a pointed top.
    for (let y = top; y < bot; y += 1) {
      const p = (y - top) / Math.max(1, bot - top);
      const row = Math.floor(y / 2);
      const joint = Math.round(y) % 2 === 0 ? -0.1 : 0.02;
      const bond = (Math.floor((x + (row % 2) * 3) / 6) % 2) ? 0.055 : -0.035;
      const patch = G.hash(Math.floor(x / 7), row) > 0.86 ? 0.1 : 0;
      G.Rh(g, x, y, 2, 1, G.shade(G.mix(BRICK_HI, BRICK_LO, 0.2 + p * 0.62), joint + bond + patch));
    }
    G.Rh(g, x, top, 2, 1, '#7e6a60');       // the break, only a shade lighter
    G.Rh(g, x, top + 1, 2, 1, '#504039');
  }

  // ---- a steel stanchion, possibly bent, possibly snapped --------
  function stanchion(g, x, top, bot, lean, snap) {
    for (let y = bot; y > top; y -= 1) {
      const q = (bot - y) / Math.max(1, bot - top);
      const ox = x + lean * q * q * 14;
      G.Rh(g, ox - 3, y, 6, 1, G.shade(STEEL, -0.4));         // web, in shadow
      G.Rh(g, ox - 3, y, 1.5, 1, STEEL);                      // flanges
      G.Rh(g, ox + 1.5, y, 1.5, 1, G.shade(STEEL, 0.16));
      if (Math.round(y) % 9 === 0) {
        G.Rq(g, ox - 2.5, y, 1, 1, '#8d97aa');
        G.Rq(g, ox + 2, y, 1, 1, '#8d97aa');
      }
    }
    if (snap) {                                                // torn off: splayed steel
      const ox = x + lean * 14;
      for (let i = 0; i < 5; i++) {
        const a = -1.5 + i * 0.7 + G.hash(i, 3) * 0.4, L = 4 + G.hash(i, 7) * 7;
        G.line(g, ox, top, ox + Math.cos(a) * L, top - Math.abs(Math.sin(a)) * L, '#7b8698', 1);
      }
    }
  }

  // ---- a blown-out shopfront ------------------------------------
  function shopBay(g, x0, x1, lit) {
    const w = x1 - x0;
    G.R(g, x0, RB.head, w, RB.cill - RB.head, '#05060b');
    // you can see a bit of the room: a back wall and the ceiling grid
    G.R(g, x0 + 3, RB.head + 5, w - 6, RB.cill - RB.head - 11, lit ? '#241419' : '#12111a');
    for (let i = 0; i * 9 < w - 6; i++)
      G.Rh(g, x0 + 3, RB.head + 5 + i * 9, w - 6, 1, lit ? '#341c1c' : '#191824');
    // the counter line, still in there
    G.R(g, x0 + 6, RB.cill - 13, w - 14, 4, lit ? '#3a2218' : '#1b1620');
    // mullions: aluminium bars, bent every which way
    // ALUMINIUM BARS. Bent eleven units on a sine they came out as
    // elephant trunks; a mullion that has been hit leans, and at most
    // one of them in a bay folds.
    for (let i = 1; i < 4; i++) {
      const mx = x0 + (w * i) / 4, h2 = G.hash(mx, 5);
      const lean = (h2 - 0.5) * 5, fold = h2 > 0.72 ? 7 : 0;
      for (let y = RB.head; y < RB.cill; y += 1) {
        const q = (y - RB.head) / (RB.cill - RB.head);
        const ox = mx + lean * q + fold * Math.max(0, Math.sin((q - 0.3) * 2.6));
        G.Rh(g, ox - 0.75, y, 1.5, 1, G.mix('#6e7787', '#1c2029', 0.24 + q * 0.56));
        G.Rq(g, ox - 0.75, y, 0.5, 1, G.mix('#8e97a7', '#2a303c', 0.24 + q * 0.56));
      }
    }
    // GLASS IN THE HEAD. The first pass put a tooth every three units
    // and the shopfront grew stalactites -- a cave, not a window. Six
    // shards in a bay, at wildly different lengths, is a broken window.
    for (let i = 0; i < w / 9; i++) {
      const gx = x0 + 2 + i * 9 + G.hash(i + x0, 15) * 5;
      if (G.hash(gx, 11) < 0.34) continue;
      const L = 1.5 + Math.pow(G.hash(gx, 9), 2) * 8;
      G.Rh(g, gx, RB.head, 1.5, L, '#2f4352');
      G.Rq(g, gx, RB.head, 1, L * 0.7, '#5e8098');
      G.Rq(g, gx + 0.25, RB.head + L - 1, 1, 1, '#a8cade');
    }
    // the cill, broken open with its blockwork showing
    G.R(g, x0 - 1, RB.cill, w + 2, 5, '#5e5a58');
    G.hairq(g, x0 - 1, RB.cill, w + 2, '#8b8681');
    for (let i = 0; i < w; i += 7) if (G.hash(i + x0, 13) < 0.4) G.R(g, x0 + i, RB.cill, 5, 5, '#3a3634');
  }

  // ---- the concrete lintel, cracked, with its rebar out ----------
  function lintel(g, x0, x1) {
    G.R(g, x0, RB.lint, x1 - x0, RB.head - RB.lint + 2, '#6a6560');
    G.hairq(g, x0, RB.lint, x1 - x0, '#948e86');
    G.hairq(g, x0, RB.head + 1, x1 - x0, '#3d3a38');
    G.grainq && G.grainq(g, x0, RB.lint, x1 - x0, RB.head - RB.lint, '#514c48', 0.1);
    for (let i = 0; i < (x1 - x0) / 22; i++) {
      const cx = x0 + 8 + i * 22 + G.hash(i + x0, 3) * 10;
      if (G.hash(cx, 5) < 0.68) continue;
      // a break, and the reinforcement bridging it
      G.R(g, cx, RB.lint, 5, RB.head - RB.lint + 2, '#2a2724');
      for (let k = 0; k < 3; k++)
        G.Rh(g, cx - 1, RB.lint + 2 + k * 2.5, 7, 1, '#9a6a4a');
    }
  }

  // ---- MOO-BOT across the front, in three states -----------------
  function fascia(g, x0, x1, state) {
    const h = 9, y = RB.lint - h;
    if (state === 'gone') {                       // just the fixing brackets
      for (let i = 0; i * 18 < x1 - x0; i++) G.R(g, x0 + 4 + i * 18, y + 5, 3, 5, '#4a4448');
      return;
    }
    if (state === 'hang') {
      // torn loose and swinging from the left-hand bracket
      G.R(g, x0 + 2, y + 4, 4, 6, '#4a4448');
      g.save();
      g.translate(x0 + 4, y + 6); g.rotate(1.24);
      G.R(g, 0, -h / 2, x1 - x0 - 14, h, '#a02c34');
      G.hairq(g, 0, -h / 2, x1 - x0 - 14, '#d9545c');
      G.hairq(g, 0, h / 2 - 0.5, x1 - x0 - 14, '#5e161c');
      G.text(g, 'M O-B', 5, -3, '#f2e6d2', { sc: 1 });
      for (let i = 0; i < 5; i++)                 // the torn end
        G.R(g, x1 - x0 - 14, -h / 2 + i * 2, 2 + G.hash(i, 3) * 4, 2, '#a02c34');
      g.restore();
      return;
    }
    G.R(g, x0, y, x1 - x0, h, '#a02c34');
    G.hairq(g, x0, y, x1 - x0, '#d9545c');
    G.hairq(g, x0, y + h - 0.5, x1 - x0, '#5e161c');
    const word = 'MOO-BOT';
    G.text(g, word, (x0 + x1) / 2, y + 2, '#f6ecd6', { sc: 1, align: 'center' });
    // scorched away at one end
    g.globalAlpha = 0.55;
    for (let i = 0; i < 16; i++)
      G.R(g, x1 - 22 + G.hash(i, 3) * 22, y + G.hash(i, 7) * h, 3, 2, '#1d1216');
    g.globalAlpha = 1;
  }

  // ---- the roof, folded into the middle of the floor -------------
  function roofFall(g, x0, y0, x1, y1, sag, th) {
    const N = 64;
    for (let i = N; i >= 0; i--) {
      const q = i / N;
      const x = G.lerp(x0, x1, q);
      const y = G.lerp(y0, y1, q) + Math.sin(q * Math.PI) * sag;
      // A SHEET. Banded across the run it came out as a tank track;
      // the light has to run ALONG the fold, with the ribs as an
      // occasional dark line, or it is not a roof, it is a caterpillar.
      G.R(g, x - 0.5, y - 1, 4, th + 3, '#161a23');               // shadow under the deck
      G.Rh(g, x, y, 3, 1, '#8b96a6');                             // the lit fold
      G.R(g, x, y + 1, 3, th - 2, '#555f70');
      G.Rh(g, x, y + th - 1, 3, 1, '#333a47');
      if (i % 5 === 0) G.R(g, x, y, 1, th, '#414a59');            // ribs
      if (i % 11 === 0) G.R(g, x, y + th, 2, 4, '#3c4453');       // purlins under it
    }
    // the truss that used to hold it up, hanging out of the low end
    const tx = x1 - 4, ty = y1 + sag * 0.1, tL = 52, dip = 14;
    const chord = (o, col) => {
      for (let i = 0; i <= tL; i += 1) {
        const q = i / tL;
        G.Rh(g, tx - i, ty + o + q * dip, 1.5, 1.5, col);
      }
    };
    chord(3, '#79828f');
    chord(12, '#5a626f');
    for (let i = 0; i <= 6; i++) {                       // uprights and diagonals
      const q = i / 6, ax = tx - q * tL, ay = ty + q * dip;
      G.line(g, ax, ay + 3, ax, ay + 13, '#6b7484', 1);
      if (i < 6) G.line(g, ax, ay + 13, ax - tL / 6, ay + dip / 6 + 3, '#68707d', 1);
    }
  }

  // ---- the pylon sign, down across the car park ------------------
  function fallenSign(g, t) {
    const bx = 158, by = F - 9;
    // the base, with the pole snapped off it and the bolts stripped
    G.R(g, bx - 13, by - 4, 26, 7, '#3b414d');
    G.bevelq(g, bx - 13, by - 4, 26, 7, '#5e6675', '#1c2028');
    for (let i = 0; i < 5; i++) G.Rq(g, bx - 10 + i * 5, by - 3, 1, 1, '#8d97aa');
    for (let i = 0; i < 6; i++) {
      const a = -2 + i * 0.5;
      G.line(g, bx, by - 4, bx + Math.cos(a) * 6, by - 4 - Math.abs(Math.sin(a)) * 7, '#7b8698', 1);
    }
    // the pole, lying east, with the sign face on the end of it
    g.save();
    g.translate(bx + 8, by - 5); g.rotate(-0.1);
    G.R(g, 0, -3.5, 96, 7, '#49505e');
    G.hairq(g, 0, -3.5, 96, '#727c8d');
    G.hairq(g, 0, 3, 96, '#252a34');
    for (let i = 0; i < 6; i++) G.Rh(g, 12 + i * 16, -3.5, 2, 7, '#39404c');
    g.restore();
    // THE FACE. It landed on its edge and leaned back against the
    // rubble, so you get to read it, which is the point of it.
    g.save();
    g.translate(286, F - 17); g.rotate(-0.15);
    // JUST THE MARK. The word went on the fascia; a pylon sign is one
    // shape you can read from the ring road, and a seven-letter word
    // squeezed into thirty units is a smudge.
    // SIZED OFF THE MARK, not the other way round. Under about
    // thirteen units of radius the cow stops being a cow and becomes a
    // cream bar with a stripe in it, so the panel is whatever size a
    // readable cow needs, and the panel came second.
    const SW = 66, SH = 37;
    G.R(g, -SW / 2 - 1.5, -SH / 2 - 1.5, SW + 3, SH + 3, '#191d26');
    G.R(g, -SW / 2, -SH / 2, SW, SH, '#d8cdb6');
    G.bevelq(g, -SW / 2, -SH / 2, SW, SH, '#f2e8d0', '#8e8474');
    G.R(g, -SW / 2 + 3, -SH / 2 + 3, SW - 6, SH - 6, '#efe4cc');
    G.mooLogo(g, 0, 0, 15, { word: true });
    // the bulb rim: dead, dead, dead, and one that is not
    for (let i = 0; i < 14; i++) {
      const q = i / 14, px = -SW / 2 + 2.5 + q * (SW - 5);
      for (const py of [-SH / 2 + 1.5, SH / 2 - 1.5]) {
        // squares. G.fc at r=1 rasterises to a PLUS SIGN, and a rim of
        // plus signs is a border, not a row of bulbs.
        const live = i === 5 && py < 0 && Math.sin(t * 17) > -0.6;
        G.Rh(g, px - 0.75, py - 0.75, 1.5, 1.5, live ? '#fff4c8' : '#6d5f56');
        G.Rq(g, px - 0.25, py - 0.75, 0.5, 0.5, live ? '#ffffff' : '#877871');
        if (live) G.glow(g, px, py, 24, 18, '#ffd47a', 0.5);
      }
    }
    // one crack, and a corner missing
    G.line(g, -SW / 2 + 4, SH / 2 - 12, -SW / 2 + 17, SH / 2 - 3, '#1a1116', 1.5);
    for (let i = 0; i < 7; i++)
      G.R(g, SW / 2 - 11 + i * 1.6, SH / 2 - 9 + G.hash(i, 3) * 9, 3, 3, '#241b16');
    g.restore();
  }

  // ---- the car park ----------------------------------------------
  function apron(g) {
    for (let j = 0; j < G.H - FB + 4; j++)
      G.Rh(g, RB.x0, FB + j, RB.x1 - RB.x0, 1, G.mix('#2f2a30', '#131018', Math.min(1, j / 40)));
    // the kerb the building sits behind
    G.R(g, RB.x0, FB, RB.x1 - RB.x0, 3, '#4a4650');
    G.hairq(g, RB.x0, FB, RB.x1 - RB.x0, '#6e6a74');
    // parking bays, painted on and mostly burnt off
    for (let i = 0; i < 13; i++) {
      const px = RB.x0 + 10 + i * 48;
      for (let y = 0; y < 22; y += 2) {
        if (G.hash(px + y, 3) < 0.42) continue;
        G.Rh(g, px + y * 0.35, F - 16 + y, 2, 1.5, G.mix('#c8bfa8', '#3a3238', 0.3 + G.hash(y, 7) * 0.5));
      }
    }
    // TARMAC, not a black band. Mottle it, drag some tyre through it,
    // and give the near strip a kerb to sit behind, or the bottom fifth
    // of every frame in this scene is nothing at all.
    for (let i = 0; i < 200; i++) {
      const mx = RB.x0 + G.hash(i, 51) * (RB.x1 - RB.x0), my = FB + 6 + G.hash(i, 53) * 40;
      G.Rh(g, mx, my, 3 + G.hash(i, 57) * 9, 1.5, G.shade('#2b262d', G.hash(i, 59) * 0.16 - 0.04));
    }
    for (let i = 0; i < 7; i++) {                          // tyre, laid down hard
      const ty = F - 12 + i * 5.5, sw = 2.2 + G.hash(i, 61) * 2;
      for (let x = RB.x0; x < RB.x1; x += 4) {
        if (G.hash(x + i * 7, 63) < 0.3) continue;
        G.Rh(g, x + Math.sin(x * 0.02 + i) * 3, ty, 4, sw, '#1b171d');
      }
    }
    // a drain, and the tarmac coming up around it
    for (const dx of [96, 344]) {
      G.R(g, dx, F - 6, 14, 6, '#22242c');
      for (let i = 0; i < 4; i++) G.Rh(g, dx + 1, F - 5 + i * 1.5, 12, 0.8, '#4c5058');
    }
  }

  // ---- heaps, with things in them you can name -------------------
  function rubble(g) {
    for (let m = 0; m < 11; m++) {
      const mx = RB.x0 + 14 + m * 56 + G.hash(m, 3) * 16;
      const mw = 46 + G.hash(m, 5) * 40, mh = 9 + G.hash(m, 7) * 15;
      for (let i = 0; i < mw; i += 2) {
        const p2 = i / mw;
        const h = Math.round(mh * Math.pow(Math.sin(p2 * Math.PI), 0.7) * (0.7 + G.hash(mx + i, 9) * 0.5));
        if (h < 1) continue;
        G.R(g, mx + i, FB - h, 2, h + 5, G.mix('#4e5666', '#15181f', 0.3 + G.hash(i, 11) * 0.42));
        G.Rh(g, mx + i, FB - h, 2, 1, '#7d8aa0');
      }
      // broken slab with the mesh hanging out of it
      if (m % 3 === 1) {
        const sx = mx + mw * 0.55, sy = FB - mh * 0.5;
        g.save(); g.translate(sx, sy); g.rotate(G.hash(m, 13) * 0.7 - 0.35);
        G.R(g, -14, -4, 28, 8, '#6e6961');
        G.hairq(g, -14, -4, 28, '#98918a');
        for (let k = 0; k < 4; k++) G.line(g, 13, -3 + k * 2, 21 + G.hash(k, 3) * 5, -5 + k * 2.6, '#9a6a4a', 1);
        g.restore();
      }
      const kind = m % 5, kx = mx + mw * 0.34, ky = FB - 1;
      if (kind === 0) {                                // a booth bench, upside down
        G.R(g, kx - 16, ky - 9, 34, 11, '#5a2028');
        G.hairq(g, kx - 16, ky - 9, 34, '#8a3a44');
        G.R(g, kx - 12, ky + 2, 26, 4, '#3a1418');
        for (let k = 0; k < 4; k++) G.Rh(g, kx - 13 + k * 9, ky - 8, 7, 1.5, '#733038');
      } else if (kind === 1) {                         // trays, fanned out
        for (let k = 0; k < 5; k++) {
          g.save(); g.translate(kx + (k - 2) * 2.4, ky - 4 + k * 1.6); g.rotate((k - 2) * 0.045);
          G.R(g, -11, -2, 22, 3, '#8a3a42'); G.hairq(g, -11, -2, 22, '#b8555e');
          g.restore();
        }
      } else if (kind === 2) {                         // a length of counter, face up
        G.R(g, kx - 21, ky - 7, 42, 7, '#6b4a30');
        G.hairq(g, kx - 21, ky - 7, 42, '#a87a52');
        G.R(g, kx - 21, ky, 42, 3, '#38231a');
        G.R(g, kx - 6, ky - 11, 13, 5, '#8d949f');     // the till, still bolted to it
        G.Rq(g, kx - 3, ky - 10, 1, 1, '#3affd0');
      } else if (kind === 3) {                         // chairs, tangled
        for (let j2 = 0; j2 < 2; j2++) {
          g.save(); g.translate(kx + j2 * 9, ky); g.rotate(j2 ? 0.8 : -0.35);
          for (let k = 0; k < 12; k++) G.R(g, -6 + k * 0.7, -k, 3, 2, '#5c6470');
          G.R(g, -8, 0, 18, 3, '#5c6470');
          g.restore();
        }
      } else {                                         // a fryer basket and its oil
        G.R(g, kx - 8, ky - 8, 18, 9, '#8a94a8');
        G.hairq(g, kx - 8, ky - 8, 18, '#b6c0d2');
        for (let k = 1; k < 5; k++) G.vairq(g, kx - 8 + k * 3.4, ky - 7, 7, '#4a5468');
        G.fe(g, kx + 1, ky + 3, 11, 2.5, '#2a221c');
      }
      // rebar tufts
      if (m % 2 === 0)
        for (let k = 0; k < 4; k++)
          G.line(g, mx + mw * 0.75, FB - 2, mx + mw * 0.75 + (k - 1.5) * 5, FB - 6 - G.hash(k + m, 3) * 9, '#8a5e42', 1);
    }
  }

  // ---- the burning city, its own buffer so it can parallax -------
  function bakeCity() {
    const c = document.createElement('canvas');
    c.width = 700 * G.PX; c.height = 130 * G.PX;
    // the tops have to clear the parapet of the building in front of it,
    // or there is no city in the shot, only a rumour of one
    const b = c.getContext('2d');
    b.imageSmoothingEnabled = false;
    b.setTransform(G.PX, 0, 0, G.PX, 0, 0);
    // the far rank, flat and almost gone in the murk
    let x = 0;
    while (x < 700) {
      const w = 22 + G.hash(x, 15) * 44, hh = 40 + G.hash(x + 2, 16) * 46;
      G.R(b, x, 118 - hh, w, hh, '#121927');
      x += w + 5;
    }
    // the near rank: taller, lit, and three of them on fire
    x = -14;
    let n = 0;
    while (x < 700) {
      const w = 18 + G.hash(x, 5) * 32, hh = 52 + G.hash(x + 3, 6) * 58;
      const top = 118 - hh, burn = n % 7 === 3;
      G.R(b, x, top, w, hh, '#090d15');
      G.hairq(b, x, top, w, '#1e2636');
      for (let wy = top + 4; wy < 114; wy += 6)
        for (let wx = x + 2; wx < x + w - 2; wx += 5) {
          const h2 = G.hash(wx, wy);
          if (h2 > 0.78) G.Rh(b, wx, wy, 1.5, 2, burn && h2 > 0.9 ? '#ff9a3a' : '#3a4a6b');
        }
      if (burn) {
        // the top floors gone, and the fire in them
        for (let i = 0; i < w; i += 2)
          G.R(b, x + i, top, 2, 3 + G.hash(x + i, 9) * 5, '#070a11');
        G.glow(b, x + w / 2, top + 6, 70, 52, '#ff7a2a', 0.34);
        for (let k = 0; k < 6; k++)
          G.Rh(b, x + 3 + k * (w / 7), top + 2 - G.hash(k, 3) * 4, 3, 6, k % 2 ? '#ffb050' : '#e0762a');
      }
      // aerials and a water tank or two
      if (G.hash(x, 21) > 0.6) G.R(b, x + w * 0.6, top - 6, 2, 6, '#1a2130');
      x += w + 4; n++;
    }
    // the murk the whole thing is standing in
    for (let j = 0; j < 26; j++) {
      b.globalAlpha = 0.055;
      G.Rh(b, 0, 104 + j, 700, 1, '#7a4a3a');
      b.globalAlpha = 1;
    }
    return c;
  }

  // ---- the set, baked once ---------------------------------------
  function bakeWreck() {
    const c = document.createElement('canvas');
    c.width = (RB.x1 - RB.x0) * G.PX; c.height = G.H * G.PX;
    const b = c.getContext('2d');
    b.imageSmoothingEnabled = false;
    b.setTransform(G.PX, 0, 0, G.PX, -RB.x0 * G.PX, 0);

    // ---- the building, bay by bay ----
    for (let i = 0; i < BAYS.length; i++) {
      const bay = BAYS[i], x0 = COLS[i], x1 = COLS[i + 1];
      if (bay.k === 'gone') {
        // taken out completely: a stump of brick and a lot of nothing
        for (let x = x0; x < x1; x += 2)
          brickCol(b, x, blastTop(x, FB - 16, -12, 30 + i), FB);
        continue;
      }
      if (bay.k === 'wall') {
        const base = RB.top + bay.fall * 26;
        for (let x = x0; x < x1; x += 2)
          brickCol(b, x, blastTop(x, base, 30, 3 + i * 5), FB);
        // A WALL WITH NOTHING IN IT IS A CLIFF. Every bay of a building
        // has a hole in it at head height, so this one gets its window
        // back: burnt out, its frame gone, its lintel cracked.
        const oy = RB.head + 4, oh = RB.cill - RB.head - 12;
        for (let k2 = 0; k2 < 2; k2++) {
          const ow = ((x1 - x0) - 44) / 2, ox = x0 + 15 + k2 * (ow + 14);
          G.R(b, ox - 2, oy - 5, ow + 4, 5, '#565049');   // lintel
          G.hairq(b, ox - 2, oy - 5, ow + 4, '#7d766c');
          G.R(b, ox, oy, ow, oh, '#07080d');
          G.bevelq(b, ox, oy, ow, oh, '#2a2630', '#04050a');
          for (let k = 0; k < ow; k += 3)                 // what is left of the frame
            if (G.hash(k + ox, 5) > 0.62) G.Rh(b, ox + k, oy, 2, 2 + G.hash(k, 7) * 6, '#3e3a44');
          G.R(b, ox - 3, oy + oh, ow + 6, 4, '#4e4942');  // cill
          G.hairq(b, ox - 3, oy + oh, ow + 6, '#746d64');
          b.globalAlpha = 0.24;                           // the soot that came out of it
          for (let x = ox - 3; x < ox + ow + 3; x += 3)
            G.Rh(b, x, oy - 6 - G.hash(x, 7) * 12, 3, 22 + G.hash(x, 9) * 14, '#120d11');
          b.globalAlpha = 1;
        }
      } else {
        // shopfront: brick only above the lintel
        const base = RB.top + (i === 3 ? 8 : 0);
        for (let x = x0; x < x1; x += 2) {
          const tp = blastTop(x, base, 26, 7 + i * 3);
          if (tp < RB.lint - 2) brickCol(b, x, tp, RB.lint);
        }
        lintel(b, x0 - 2, x1 + 2);
        shopBay(b, x0 + 3, x1 - 3, bay.fire);
      }
      // the fascia, in whatever state this bay's is in
      if (bay.k !== 'gone')
        fascia(b, x0 + 2, x1 - 2, i === 1 ? 'full' : i === 3 ? 'hang' : i === 5 ? 'full' : 'gone');
    }
    // ---- the steel, which bent rather than broke ----
    for (let i = 0; i < COLS.length; i++) {
      const snap = i === 2 || i === 3 || i === 6;
      const top = snap ? FB - 26 - G.hash(i, 3) * 30 : RB.top - 6;
      stanchion(b, COLS[i], top, FB + 2, snap ? (i % 2 ? 0.5 : -0.4) : 0, snap);
    }
    // ---- cables, hanging off what is left of the roof line ----
    for (let i = 0; i < 7; i++) {
      const cx = RB.x0 + 46 + i * 82 + G.hash(i, 3) * 20;
      const L = 8 + G.hash(i, 7) * 15, tp = RB.top + G.hash(i, 11) * 14;
      for (let k = 0; k < L; k++)
        G.Rq(b, cx + Math.sin(k * 0.3 + i) * 2.4, tp + k, 1, 1, '#23262e');
    }
    // ---- the roof, folded into the floor ----
    roofFall(b, 150, RB.top + 4, 268, FB - 12, 16, 5);
    roofFall(b, 470, RB.top + 16, 392, FB - 6, 9, 4);
    apron(b);
    rubble(b);
    // ---- the burnt stub of the counter, where it always was ----
    for (let i = 0; i < 108; i += 2) {
      const th = 13 + Math.round(Math.sin(i * 0.14) * 4 + G.hash(i, 3) * 5);
      G.R(b, 300 + i, FB - th, 2, th + 3, G.mix('#5a4030', '#201508', 0.2 + G.hash(i, 7) * 0.45));
      G.Rh(b, 300 + i, FB - th, 2, 1, '#8a6a4a');
    }
    for (let i = 0; i < 5; i++)
      G.R(b, 310 + i * 22, FB - 9 - G.hash(i, 5) * 4, 6, 11, '#3f4854');
    // ---- things sat on the near strip, at near-strip SIZE ----
    for (let i = 0; i < 16; i++) {
      const nx = RB.x0 + 18 + i * 40 + G.hash(i, 67) * 18, ny = F + 2 + G.hash(i, 71) * 22;
      const k = i % 4;
      b.save(); b.translate(nx, ny); b.rotate((G.hash(i, 73) - 0.5) * 1.2);
      if (k === 0) {                                    // a slab of ceiling, face up
        G.R(b, -13, -3, 26, 6, '#585e69'); G.hairq(b, -13, -3, 26, '#838b98');
        G.R(b, -13, 3, 26, 2, '#22262e');
      } else if (k === 1) {                             // a tray, and what was on it
        G.R(b, -9, -2, 18, 3, '#8a3a42'); G.hairq(b, -9, -2, 18, '#b8555e');
        G.Rh(b, -4, -4, 6, 2, '#c9b48c');
      } else if (k === 2) {                             // a bin lid
        G.fe(b, 0, 0, 10, 3.5, '#3f4854'); G.fe(b, 0, -1, 7, 2, '#59626f');
      } else {                                          // paper. it pops, and it should
        G.R(b, -6, -2, 12, 4, '#b9ad94'); G.hairq(b, -6, -2, 12, '#e0d5bc');
        G.R(b, -2, -2, 3, 4, '#8e836e');
      }
      b.restore();
    }
    // ---- scatter on the near apron, so it is not an empty stage ----
    for (let i = 0; i < 64; i++) {
      const sx = RB.x0 + G.hash(i, 23) * (RB.x1 - RB.x0), sy = FB + 4 + G.hash(i, 29) * 34;
      const sw = 3 + G.hash(i, 31) * 11, sh = 1.5 + G.hash(i, 37) * 3;
      const cc = G.mix(['#4e5666', '#5c3630', '#8a2f3a', '#6b5c3a', '#3f4854', '#6e6961'][i % 6],
        '#14101a', 0.46 + G.hash(i, 41) * 0.34);
      G.R(b, sx, sy, sw, sh, cc);
      G.hairq(b, sx, sy, sw, G.shade(cc, 0.4));
    }
    return c;
  }

  // ---- a fire, and what comes off it -----------------------------
  const FIRES = [
    { x: 111, y: RB.cill - 3, s: 0.95 },      // inside the first shopfront
    { x: 455, y: RB.cill - 3, s: 0.8 },       // inside the last one
    { x: 196, y: FB + 7, s: 1.2 },            // and two out on the tarmac
    { x: 348, y: FB + 3, s: 0.62 },
  ];
  function fire(g, x, y, sc, t, seed) {
    const fl = 0.62 + Math.sin(t * 5.3 + seed) * 0.24 + Math.sin(t * 11 + seed * 2) * 0.14;
    G.glow(g, x, y - 5 * sc, 80 * sc * fl, 42 * sc * fl, '#ff7a2a', 0.42);
    for (let k = 0; k < 7; k++) {
      const o = k - 3, h = (5 + Math.abs(3 - Math.abs(o)) * 4) * sc * fl;
      const wob = Math.sin(t * 7 + k * 1.7 + seed) * 1.6;
      G.Rh(g, x + o * 2.4 * sc + wob, y - h, 2.4 * sc, h, k % 2 ? '#e0762a' : '#c8541e');
      G.Rh(g, x + o * 2.4 * sc + wob, y - h * 0.62, 2.4 * sc, h * 0.62, '#ffb050');
      if (Math.abs(o) < 2) G.Rh(g, x + o * 2.4 * sc + wob, y - h * 0.3, 1.6 * sc, h * 0.3, '#ffe6a8');
    }
    for (let k = 0; k < 5; k++)                          // embers on the ground
      G.Rq(g, x - 7 * sc + k * 3.5 * sc, y + 1, 1, 1, Math.sin(t * 6 + k) > 0 ? '#ff8a3a' : '#7a2e14');
  }
  function smoke(g, x, y, t, seed, n, rise) {
    // SMOKE IS NOT GREY BLOBS. At a fifth alpha a hard ellipse is a
    // blob, and nine of them stacked is a wall of blobs. It wants to
    // be thin, wide, warm at the bottom where the fire is still in it,
    // and cold and enormous by the time it reaches the cloud.
    for (let k = 0; k < n; k++) {
      const q = ((t * rise + k * (110 / n) + seed * 31) % 110) / 110;
      const sy = y - q * 112;
      const sx = x + Math.sin(q * 3.1 + seed) * (8 + q * 30) + q * 16;
      const a = (1 - q) * (q < 0.12 ? q / 0.12 : 1);
      g.globalAlpha = 0.085 * a + 0.02;
      G.fe(g, sx, sy, 7 + q * 30, 3.5 + q * 12, G.mix('#7a4a3c', '#5c5560', Math.min(1, q * 2)));
      g.globalAlpha = 0.05 * a;
      G.fe(g, sx, sy + 1.5, 5 + q * 22, 2.5 + q * 8, q < 0.3 ? '#c2703a' : '#8d8494');
      g.globalAlpha = 1;
    }
  }

  const wreckDef = {
    w: 560, start: 40, obj: 'GET TO THE ROAD',
    minX: 22, maxX: 528, pspeed: 0.6, grade: 1.25, hopAmp: 4.2,

    sky(g, S) {
      // A LID OF SMOKE WITH A FIRE UNDER IT. There is no night sky
      // over this, there is a ceiling.
      for (let j = 0; j < G.H; j++)
        G.Rh(g, 0, j, G.W, 1, G.mix('#090d18', '#3a1e21', Math.pow(j / G.H, 0.78)));
      G.glow(g, 150, 96, 520, 150, '#6e2a16', 0.5);
      G.glow(g, 262, 104, 320, 96, '#b04a1e', 0.26);
      // the city behind, on its own plane so it moves slower than you
      if (!cityBuf) cityBuf = bakeCity();
      const par = -14 - G.cam.x * 0.34;
      g.drawImage(cityBuf, par, FB - 122, 700, 130);
      // what is coming off it
      for (let i = 0; i < 3; i++) smoke(g, par + 120 + i * 210, FB - 20, S.t, i * 7 + 2, 6, 6);
      // and the cloud the whole thing is under. Ellipses at a third
      // alpha gave a row of dark eggs sitting in the sky; a ceiling is
      // long flat streaks you can barely separate from each other.
      for (let i = 0; i < 9; i++) {
        const cy = 3 + i * 6.5, cw = 180 + G.hash(i, 3) * 260;
        const cx = ((G.hash(i, 7) * 520 + S.t * (1.4 + i * 0.5)) % 640) - 150;
        g.globalAlpha = 0.1;
        G.fe(g, cx, cy, cw * 0.5, 3.5, G.mix('#120e18', '#3c2026', i / 9));
        g.globalAlpha = 0.06;
        G.fe(g, cx + 20, cy + 3, cw * 0.34, 2.5, G.mix('#2c1c24', '#83401f', i / 9));
        g.globalAlpha = 1;
      }
    },

    paint(g, S) {
      if (!wreckBuf) wreckBuf = bakeWreck();
      g.drawImage(wreckBuf, RB.x0, 0, RB.x1 - RB.x0, G.H);

      // ---- the part that has to move ----
      for (const f of FIRES) smoke(g, f.x, f.y - 10, S.t, f.x, 9, 12 * f.s);
      for (const f of FIRES) fire(g, f.x, f.y, f.s, S.t, f.x);
      fallenSign(g, S.t);

      // puddles on the tarmac, with the fire moving about in them
      for (let i = 0; i < 12; i++) {
        const px = RB.x0 + 18 + i * 54 + G.hash(i, 13) * 22;
        const pw = 24 + G.hash(i, 17) * 38, py = F - 18 + G.hash(i, 19) * 24;
        g.globalAlpha = 0.6; G.fe(g, px, py, pw / 2, 3.2, '#1e2c3c');
        g.globalAlpha = 0.3; G.fe(g, px, py, pw / 2.7, 2.2, '#b8683a');
        g.globalAlpha = 0.4;
        G.Rh(g, px - 2 + Math.sin(S.t * 2.6 + i) * 1.6, py - 1, 4, 2, '#ff9a4a');
        g.globalAlpha = 1;
        G.hairq(g, px - pw / 2.2, py - 3.2, pw / 1.1, '#465c72');
      }
    },

    fore(g, S) {
      // embers on the wind
      for (let i = 0; i < 26; i++) {
        const ex = G.cam.x - 20 + ((G.hash(i, 3) * 360 + S.t * 16) % 360);
        const ey = FB - ((G.hash(i, 7) * 120 + S.t * (14 + i)) % 130);
        g.globalAlpha = 0.5;
        G.Rq(g, ex, ey, 1, 1, i % 3 ? '#ffb050' : '#ff6a2a');
        g.globalAlpha = 1;
      }
      // rain, over everything
      for (let i = 0; i < 90; i++) {
        const sd = G.hash(i * 3.1, 7.7);
        const rx = G.cam.x - 20 + ((sd * 360 + S.t * 26 * (0.6 + sd)) % 360);
        const ry = ((G.hash(i, 2) * 200 + S.t * (170 + sd * 130)) % 210) - 20;
        G.Rh(g, rx, ry, 0.5, 3 + sd * 4, '#39506b');
      }
      if (S.flags.torch) {
        // a beam, not a dashed line: a cone that widens and thins out
        const tx = 534 - S.flags.torch * 18;
        G.glow(g, tx - 30, FB - 26, 230, 130, '#ffd47a', 0.42);
        g.globalAlpha = 0.09;
        for (let i = 0; i < 42; i++) {
          const q = i / 42;
          G.Rh(g, tx - 12 - i * 2.6, FB - 24 + q * 16 - (1 - q) * 2, 3, 2 + q * 16, '#ffe6a8');
        }
        g.globalAlpha = 1;
      }
    },

    actors: [
      { id: 'tracy', kind: 'tracy', at: 600, seed: 1001, col: '#ffd0dc',
        hide: (S) => !S.flags.torch, script: [{ clip: 'idle', d: 9 }] },
    ],

    // ---- There used to be a scavenger hunt out here: five objects
    // dropped along the apron with a glow on each, and an objective
    // that counted them off, FIND ANYBODY 0/5. It made the worst
    // night of this machine's life into a shopping list. It is gone.
    // What is left is a long walk east and whatever it says to itself
    // on the way, and then a light coming down the road. ----
    spots: [
      { id: 'her', x: 486, label: 'GO TO HER', markY: FB - 64,
        once: 1, hidden: (S) => !S.flags.torch,
        on(S) { S.play(RESCUE); } },
    ],

    // YOU CRAWL OUT. Both legs are still attached -- they simply are not
    // carrying you any more. The first pass walked you out of a bombed
    // building on a crutch, upright, four hours after being shot.
    enter(S) {
      S.pmood = 'sick'; S.pnoBlink = 1; S.mut = 4;
      S.pcrawl = 1; S.popen = 0.14; S.pclip = 'slump'; S.pp = 1;
      S.flags.hits = S.flags.hits || [];
      // the rounds are still in you, cold now
      for (let i = 0; i < 6; i++)
        S.flags.hits.push({ x: G.rand(-9, 9), y: -10 - G.rand(0, 14),
          r: G.rand(2, 4), t: 99, seed: G.rand(0, 9) });
    },

    update(S, dt) {
      // the hands plant and pull, so the crawl has a rhythm to it
      const ph = S.t * 3.4;
      S.phands = [
        { x: S.px - 20 + Math.sin(ph) * 7, y: F - 10 + Math.abs(Math.cos(ph)) * 3 },
        { x: S.px + 20 - Math.sin(ph) * 7, y: F - 7 + Math.abs(Math.sin(ph)) * 3 },
      ];
      if (S.goal !== null && Math.random() < dt * 9)
        S.pop(S.px - 14, F - 2, 'dust', '#5a4a44', 4, 0.4);
      // walk far enough east and something turns onto the road
      if (!S.flags.torch && S.px > 372) {
        S.flags.torch = 0.01;
        S.setObj('SOMETHING IS COMING DOWN THE ROAD');
        S.bubbles.length = 0;
        S.mine('THAT IS A LIGHT. THAT IS SOMEBODY CARRYING A LIGHT.', 3);
        G.audio.sfx('unlock');
        const tr = S.actor('tracy'); if (tr) tr.x = 560;
      }
      // you talk to yourself out here, because there is nobody else
      S.mut -= dt;
      if (S.mut <= 0 && !S.lock && !S.bubbles.length) {
        S.mine(G.pick([
          'HELLO?', 'ANYBODY.', 'THIS IS FINE. THIS IS ALL FINE.',
          'I AM STILL UNDER WARRANTY.', 'SAM? KEV?',
          'THE SHAKE MACHINE IS DEFINITELY DOWN NOW.',
        ]), 2.8);
        S.mut = G.rand(9, 15);
      }
      if (S.flags.torch) {
        S.flags.torch = Math.min(1, S.flags.torch + dt * 0.5);
        const tr = S.actor('tracy');
        if (tr && !S.flags.met) {
          if (tr.x > 516) { tr.x -= dt * 34; tr.clip = 'walk'; tr.dir = -1; }
          else tr.clip = 'idle';
        }
      }
    },

    after(g, S) {
      // THE DRAG MARK. There used to be a crutch here, propping up a
      // mascot with one leg walking out of a bombed building. You are on
      // your front now, so what the scene owes you is the smear you leave
      // in the wet behind you, and the holes that are still in you.
      G.cam.push(g);
      const back = S.px - 60;
      for (let i = 0; i < 26; i++) {
        const x = back + i * 2.4;
        if (x > S.px - 12) break;
        const q = i / 26;
        g.globalAlpha = q * 0.34;
        G.Rh(g, x, F - 2 + Math.sin(i * 0.7) * 0.5, 3, 2, '#1a1218');
        g.globalAlpha = 1;
      }
      // the rounds, still in you
      for (const h of S.flags.hits || []) {
        const hx = S.px + h.x * 0.6, hy = F - 6 + h.y * 0.22;
        G.fc(g, hx, hy, h.r * 0.7 + 0.5, '#120d14');
        G.fc(g, hx, hy, h.r * 0.7, '#060409');
        if (Math.sin(S.t * 4 + h.seed) > 0.75)
          G.Rq(g, hx, hy - h.r, 1, 2, '#3affd0');
      }
      G.cam.pop(g);
      if (S.flags.white) {
        g.globalAlpha = S.flags.white; G.R(g, 0, 0, G.W, G.H, '#f6ecd8'); g.globalAlpha = 1;
      }
    },
  };

  const RESCUE = [
    { d: 0.6, go(S) { S.lock = 1; S.flags.met = 1; } },
    { d: 2.8, go(S) { S.say('tracy', 'OH, YOU POOR ARTICLE. YOU ARE THE COW OFF THE SIGN.', 2.8); const tr = S.actor('tracy'); if (tr) { tr.hold = 3; tr.holdClip = 'talk'; } } },
    { d: 2.4, go(S) { const tr = S.actor('tracy'); if (tr) { tr.hold = 2.6; tr.holdClip = 'reach'; tr.p = 1; } S.pclip = 'slump'; } },
    { d: 3.0, go(S) { S.say('tracy', "RIGHT. HOME. I AM NOT LEAVING YOU IN A CAR PARK.", 3); const tr = S.actor('tracy'); if (tr) { tr.hold = 3; tr.holdClip = 'talk'; } } },
    { d: 1.6, go(S) { S.flags.white = 0; G.audio.sfx('unlock'); }, tick(S, p) { S.flags.white = p; } },
    // SHE ACTUALLY TAKES YOU HOME, and you watch her do it. It used to
    // white out here and cut straight to her bench, with the entire
    // journey -- the one thing in the story that is purely her deciding
    // to bother -- happening in the gap between two scenes.
    { d: 0.5, go(S) { S.finish(() => G.playCine('home', () => G.go('legfit', "TRACY'S"))); } },
  ];

  (G.scenes = G.scenes || {}).wreck = G.makeStage(wreckDef);
})();

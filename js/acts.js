// ============================================================
// DOUBLE LIFE v15 - acts.js  ·  THE PROLOGUE, PLAYED
//
// This used to be nine cutscene shots and a two-mile crawl. It is now
// two rooms you walk around in.
//
//   FLOOR   the dining room of BIG MOO, mid-shift. Work the room: say
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

  function tiledWall(g, x0, x1, dim) {
    const M = (c) => G.mix(c, '#241018', dim || 0);
    G.R(g, x0, 0, x1 - x0, FB, M('#f6e8d4'));
    G.R(g, x0, 0, x1 - x0, 20, M('#8a2f3a'));           // the fascia band inside
    G.hairq(g, x0, 20, x1 - x0, M('#c8505c'));
    for (let x = x0; x < x1; x += 17) {                  // glazed tiles to shoulder height
      G.Rh(g, x + 1, FB - 64, 15, 14, M('#eddcc4'));
      G.hairq(g, x + 1, FB - 64, 15, M('#fff6ea'));
      G.Rh(g, x + 1, FB - 49, 15, 14, M('#e6d3b8'));
      G.hairq(g, x + 1, FB - 49, 15, M('#f6ead8'));
    }
    G.R(g, x0, FB - 68, x1 - x0, 3, M('#c8505c'));
    G.R(g, x0, FB - 8, x1 - x0, 8, M('#b39ea2'));        // skirting
    G.hairq(g, x0, FB - 8, x1 - x0, M('#d8c4c8'));
  }
  // the floor: a checker on the back plane, bigger tiles at the front
  function checkerFloor(g, x0, x1, dim) {
    const M = (c) => G.mix(c, '#241018', dim || 0);
    let y = FB, h = 4;
    for (let j = 0; y < G.H; j++) {
      const tw = 9 + j * 1.6;
      for (let i = Math.floor(x0 / tw) - 1; i < x1 / tw + 1; i++)
        G.Rh(g, i * tw, y, tw + 0.5, h + 0.5,
          (i + j) % 2 ? M('#ecdfcc') : M('#c4767c'));
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
    // sky, the far kerb, and the sign's glow off the wet
    for (let j = 0; j < h - 8; j++)
      G.Rh(g, x + 4, y + 4 + j, w - 8, 1, M(G.mix('#1a2740', '#0c141f', j / (h - 8))));
    G.R(g, x + 4, y + h - 20, w - 8, 16, M('#0e1622'));
    G.hairq(g, x + 4, y + h - 20, w - 8, M('#2c3a4e'));
    if (!dim) {
      G.glow(g, x + w * 0.66, y + h - 14, 60, 30, '#ff8ab0', 0.3);
      G.glow(g, x + w * 0.3, y + h - 12, 40, 20, '#ffd45a', 0.2);
    }
    for (let i = 0; i < 6; i++) {                        // parked cars, tiny
      const cx = x + 8 + i * 13;
      G.R(g, cx, y + h - 16, 9, 4, M('#1c2a3c'));
      G.Rq(g, cx + 1, y + h - 17, 3, 1, M('#3f5a7a'));
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

  const floorDef = {
    w: 580, start: 122, obj: 'SAY HELLO TO TABLE FOUR',
    minX: 16, maxX: 552,

    sky(g, S) { G.R(g, 0, 0, G.W, G.H, '#1a1218'); },

    paint(g, S) {
      const dim = S.flags.dark || 0;
      const M = (c) => G.mix(c, '#241018', dim);
      tiledWall(g, 0, 580, dim);
      checkerFloor(g, 0, 580, dim);
      // bunting on a string right across the room
      if (!S.flags.blown) {
        for (let x = 0; x < 580; x += 2) {
          const q = (x % 90) / 90;
          G.Rq(g, x, 24 + Math.sin(q * Math.PI) * 3, 2, 1, M('#c8a884'));
        }
        for (let i = 0; i < 20; i++) {
          const bx = 12 + i * 29, sag = Math.sin(((bx % 90) / 90) * Math.PI) * 3;
          const col = ['#ffd45a', '#8fd8c0', '#ff8ab0', '#7fd8ff'][i % 4];
          for (let j = 0; j < 5; j++)
            G.Rh(g, bx - 4 + j, 25 + sag + j, 9 - j * 2, 1, M(j < 1 ? G.shade(col, 0.3) : col));
        }
      }
      window7(g, 20, S, dim);
      window7(g, 138, S, dim);
      // a clock nobody has looked at since four
      G.oc(g, 262, FB - 92, 9, M('#3a2a2e'));
      G.fc(g, 262, FB - 92, 8, M('#f6ead8'));
      G.Rh(g, 262 - 0.5, FB - 97, 1, 5, M('#3a2a2e'));
      G.Rh(g, 262, FB - 92.5, 4, 1, M('#8a2f3a'));
      // the menu board over the counter
      G.R(g, 358, FB - 104, 124, 24, M('#1a1216'));
      G.bevelq(g, 358, FB - 104, 124, 24, M('#3a2a2e'), '#0a0608');
      G.text(g, 'BURGER   SWIRL   FRIES', 420, FB - 100, M('#ffd45a'), { align: 'center', sc: 0.5 });
      G.text(g, 'ASK ABOUT THE BIG MOO MEAL', 420, FB - 92, M('#f0e2d4'), { align: 'center', sc: 0.5 });
      G.text(g, 'NOW WITH FREE CROWNS', 420, FB - 84, M('#8fd8c0'), { align: 'center', sc: 0.5 });
      if (!dim) G.glow(g, 420, FB - 94, 138, 28, '#ffd45a', 0.14);
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
      // the counter itself
      G.R(g, CNT_X0 - 1, CNT_TOP - 1, CNT_X1 - CNT_X0 + 2, 34, OUT);
      G.R(g, CNT_X0, CNT_TOP, CNT_X1 - CNT_X0, 5, M('#e8d6b8'));
      G.hairq(g, CNT_X0, CNT_TOP, CNT_X1 - CNT_X0, M('#fff6ea'));
      G.R(g, CNT_X0, CNT_TOP + 5, CNT_X1 - CNT_X0, 27, M('#8a5c3a'));
      G.bevelq(g, CNT_X0, CNT_TOP + 5, CNT_X1 - CNT_X0, 27, M('#b07a4a'), M('#4a2c18'));
      for (let i = 0; i * 22 < CNT_X1 - CNT_X0; i++)
        G.vseam(g, CNT_X0 + 8 + i * 22, CNT_TOP + 8, 21, M('#3a2418'), M('#b07a4a'));
      G.R(g, CNT_X0, CNT_TOP + 30, CNT_X1 - CNT_X0, 3, M('#4a2c18'));
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
      if (S.flags.leg) {
        const p = S.flags.leg;
        const lx = S.px - p * 90, ly = F - 32 + Math.sin(p * 3.1) * 18 + p * p * 34;
        G.R(g, lx - 4, ly - 1, 9, 22, OUT);
        G.R(g, lx - 3, ly, 7, 20, '#efe7d8');
        G.hairq(g, lx - 3, ly, 7, '#ffffff');
        G.R(g, lx - 5, ly + 18, 11, 6, '#4a3f56');
      }
      if (S.flags.flash) {
        g.globalAlpha = S.flags.flash;
        G.R(g, G.cam.x - 4, 0, G.W + 8, G.H, '#fff6e0');
        g.globalAlpha = 1;
      }
    },

    // ---- the shift ----
    actors: [
      // behind the counter, all shift
      { id: 'sam', at: 400, dy: -18, behind: 1, seed: 21.6, badge: 1, col: '#8fd8c0',
        script: [{ clip: 'idle', d: 4 },
                 { say: 'TABLE FOUR! TWO SWIRLS AND A HAPPY BIRTHDAY!', d: 2.8 },
                 { clip: 'reach', d: 1.8 }, { wait: 3 },
                 { say: 'ORDER UP.', d: 1.6 }, { wait: 5 }] },
      { id: 'sam2', at: 460, dy: -18, behind: 1, seed: 44.2, badge: 1, col: '#8fd8c0',
        script: [{ clip: 'reach', d: 2.4 }, { clip: 'idle', d: 3 }, { clip: 'talk', d: 2 }, { wait: 4 }] },
      // the birthday table: three kneeling on the bench in paper crowns
      { id: 'k1', at: B2 + 18, sit: 1, sitDy: -18, dy: -18, behind: 1, seed: 2.2,
        hat: 'crown', smile: 1, col: '#a8d158',
        script: [{ clip: 'idle', d: 3 }, { say: 'IS IT COMING', d: 1.8 }, { clip: 'talk', d: 2 }, { wait: 4 }] },
      { id: 'k2', at: B2 + 44, sit: 1, sitDy: -18, dy: -18, behind: 1, seed: 7.7,
        hat: 'crown', smile: 1, col: '#a8d158',
        script: [{ wait: 2 }, { clip: 'talk', d: 2.4 }, { wait: 5 }] },
      { id: 'k3', at: B2 + 70, sit: 1, sitDy: -18, dy: -18, behind: 1, seed: 12.9,
        hat: 'crown', smile: 1, col: '#a8d158',
        script: [{ wait: 5 }, { say: 'MOO! MOO!', d: 2 }, { wait: 6 }] },
      { id: 'mum', at: B2 + 94, sit: 1, sitDy: -18, dy: -18, behind: 1, seed: 4.4, smile: 1, col: '#7fd8ff',
        script: [{ clip: 'idle', d: 6 }, { say: 'SIT DOWN AND EAT IT, THE PAIR OF YOU.', d: 2.6 }, { wait: 7 }] },
      // a couple in the far booth, eating
      { id: 'e1', at: B1 + 20, sit: 1, sitDy: -18, dy: -18, behind: 1, seed: 18.3,
        script: [{ clip: 'idle', d: 5 }, { clip: 'talk', d: 3 }, { wait: 6 }] },
      { id: 'e2', at: B1 + 60, sit: 1, sitDy: -18, dy: -18, behind: 1, seed: 31.2, smile: 1,
        script: [{ wait: 3 }, { clip: 'talk', d: 2.4 }, { clip: 'idle', d: 6 }] },
      // and two who come in, queue, order and go and sit down
      { id: 'q1', at: 600, seed: 9.4, col: '#f0c04a',
        script: [{ at: 600 }, { go: 452 }, { wait: 2.4 },
                 { say: 'JUST A SWIRL. NO, TWO.', d: 2.2 }, { wait: 2.6 },
                 { go: 320 }, { go: 268 }, { wait: 1.2 }, { go: 600, sp: 1.1 }, { wait: 5 }] },
      { id: 'q2', at: 640, seed: 27.1, hat: 'cap',
        script: [{ at: 640 }, { wait: 6 }, { go: 482 }, { wait: 4 },
                 { say: 'ARE YOU STILL DOING THE MEAL DEAL', d: 2.2 }, { wait: 3 },
                 { go: 640, sp: 1.1 }, { wait: 8 }] },
      // a kid who will not sit down
      { id: 'run', at: 206, seed: 33.7, smile: 1, hat: 'crown',
        script: [{ go: 274, sp: 1.6 }, { wait: 0.6 }, { go: 196, sp: 1.6 }, { wait: 1.4 }] },
      // and the thing that comes through the door
      { id: 'pat', kind: 'bot', bot: 'police', at: 620, dy: -18, scale: 1.2, col: '#7fd8ff',
        hide: (S) => !S.flags.busted, script: [{ clip: 'idle', d: 9 }] },
    ],

    spots: [
      { id: 'hello', x: B2 + 14, off: 0, label: 'SAY HELLO', markY: FB - 54,
        once: 1,
        on(S) {
          S.mine('WHO IS FOUR TODAY, THEN?');
          for (const id of ['k1', 'k2', 'k3']) {
            const a = S.actor(id); if (a) { a.hold = 2.6; a.holdClip = 'point'; a.p = 1; }
          }
          S.play([{ d: 1.0 }, { d: 2.4, go(S2) { S2.say('k3', 'MOO! MOO! MOO!', 2.4); } }]);
          S.obj = 'GET UP ON THE STAGE'; G.audio.sfx('unlock');
        } },
      { id: 'dance', x: STAGE_X, label: 'DO THE DANCE', markY: FB - 90,
        once: 1, hidden: (S) => !S.done.hello,
        on(S) {
          S.flags.onstage = 1;
          S.play([
            { d: 0.4, go(S2) { S2.lock = 1; S2.pclip = 'wave'; S2.pp = 0.5; G.audio.sfx('menu'); } },
            { d: 3.2,
              go(S2) { S2.mine('WHO WANTS A SWIRL, THEN? EVERYBODY? RIGHT.', 3); },
              tick(S2, p) { S2.pclip = p < 0.5 ? 'wave' : 'talk'; S2.pp = Math.sin(p * 6.28) * 0.5 + 0.5; } },
            { d: 1.6, go(S2) { for (const id of ['k1', 'k2', 'k3', 'run']) { const a = S2.actor(id); if (a) { a.hold = 2.2; a.holdClip = 'point'; a.p = 1; } } G.audio.sfx('coin'); } },
            { d: 0.2, go(S2) { S2.lock = 0; S2.pclip = 'idle'; S2.obj = "COLLECT TABLE FOUR'S ORDER"; G.audio.sfx('unlock'); } },
          ]);
        } },
      { id: 'collect', x: 400, label: 'COLLECT', markY: CNT_TOP - 42,
        once: 1, hidden: (S) => !S.done.dance,
        on(S) {
          const a = S.actor('sam'); if (a) { a.hold = 2.4; a.holdClip = 'reach'; a.p = 1; }
          S.say('sam', 'TWO SWIRLS. MIND THE FLOOR, IT IS WET.', 2.6);
          S.flags.carry = 1;
          S.obj = 'TAKE THEM TO TABLE FOUR'; G.audio.sfx('grab');
        } },
      { id: 'serve', x: B2 + 14, off: 0, label: 'HAND THEM OVER', markY: FB - 54,
        once: 1, hidden: (S) => !S.done.collect,
        on(S) {
          S.flags.carry = 0;
          S.say('k1', 'THANK YOU MOO', 2);
          S.obj = null; S.objDone = 1;
          G.audio.sfx('serve');
          S.play(ATTACK);
        } },
    ],

    update(S, dt) {
      if (S.flags.flash) S.flags.flash = Math.max(0, S.flags.flash - dt * 2.2);
      if (S.flags.shards) S.flags.shards = Math.min(1, S.flags.shards + dt * 1.1);
      if (S.flags.leg) S.flags.leg = Math.min(1, S.flags.leg + dt * 0.9);
    },

    after(g, S) {
      if (S.flags.carry) {
        G.cam.push(g);
        G.cone(g, S.px - 16, F - 30, { w: 9, h: 12 });
        G.cone(g, S.px + 16, F - 30, { w: 9, h: 12 });
        G.cam.pop(g);
      }
      if (S.flags.white) {
        g.globalAlpha = S.flags.white;
        G.R(g, 0, 0, G.W, G.H, '#fffdf4');
        g.globalAlpha = 1;
      }
    },
  };

  // ---- the eight seconds it takes ----
  const ATTACK = [
    { d: 1.4, go(S) { S.lock = 1; S.pclip = 'idle'; } },
    { d: 1.2,
      go(S) {
        S.flags.busted = 1; S.flags.shards = 0.01;
        G.audio.sfx('snap'); G.shake(5, 0.5); G.screenFlash('#cfe4ff', 0.3);
        const pat = S.actor('pat'); if (pat) pat.x = 578;
      } },
    { d: 2.2,
      go(S) {
        S.say('pat', 'CIVIL PATTERN. NOBODY MOVE.', 2.4);
        S.pclip = 'startle'; S.pp = 0;
        for (const a of S.actors) { if (a.id === 'pat') continue; a.hold = 6; a.holdClip = 'startle'; a.p = 0.7; }
      },
      tick(S, p) { S.pp = Math.min(1, p * 2); const pat = S.actor('pat'); if (pat) pat.x = G.lerp(578, 508, G.easeOut(p)); } },
    { d: 1.0,
      go(S) {
        S.flags.flash = 1; S.flags.leg = 0.01; S.plegOff = 1; S.pmood = 'sick'; S.pnoBlink = 1;
        G.audio.sfx('zap'); G.shake(6, 0.6);
        S.mine("I'M - I'M STILL UNDER WARRA-", 2.2);
      } },
    { d: 2.0,
      go(S) {
        S.pcrawl = 1; S.phands = [{ x: S.px - 22, y: F - 12 }, { x: S.px + 22, y: F - 8 }];
        // everybody who can run, runs
        const away = { q1: 660, q2: 680, run: -50, mum: -50 };
        for (const id in away) {
          const a = S.actor(id);
          if (a) { a.hold = 0; a.sitting = 0; a.dy = 0; a.behind = 0; a.script = [{ go: away[id], sp: 1.7 }, { wait: 9 }]; a.si = 0; a.st = 0; a.started = false; }
        }
      } },
    { d: 2.0,
      go(S) { S.flags.charge = 1; S.say('pat', 'CLEAR THE FLOOR.', 1.8); G.audio.sfx('menu'); } },
    { d: 1.4, go(S) { S.flags.dark = 0.4; }, tick(S, p) { S.flags.dark = 0.2 + p * 0.4; } },
    { d: 1.2, go(S) { S.flags.white = 0; G.audio.sfx('boom'); G.shake(8, 1); },
      tick(S, p) { S.flags.white = p; } },
    { d: 0.6, go(S) { S.finish(() => G.go('wreck', 'FOUR HOURS LATER')); } },
  ];

  (G.scenes = G.scenes || {}).floor = G.makeStage(floorDef);

  // ============================================================
  // ACT TWO: THE WRECK
  // ============================================================
  const FIND = [
    { id: 'crown', x: 66,  label: 'A PAPER CROWN', say: 'A PAPER CROWN. SIZE SMALL.' },
    { id: 'tray',  x: 176, label: 'A TRAY',        say: 'TABLE FOUR. NOBODY AT TABLE FOUR.' },
    { id: 'shoe',  x: 244, label: 'A SHOE',        say: 'ONE SHOE. I CALLED. NOTHING CALLED BACK.' },
    { id: 'badge', x: 348, label: 'A STAFF BADGE', say: 'A BADGE. THE NAME IS BURNT OFF IT.' },
    { id: 'radio', x: 436, label: 'A RADIO',       say: 'A RADIO, STILL ON. NOBODY ON IT.' },
  ];
  const FINDART = {
    crown(g, x, t) {
      for (let i = 0; i < 5; i++) {
        const px = x - 9 + i * 4;
        G.R(g, px - 1, FB - 11, 4, 9, OUT); G.R(g, px, FB - 10, 3, 8, '#d8a83a');
      }
      G.R(g, x - 11, FB - 5, 23, 6, OUT); G.R(g, x - 10, FB - 4, 21, 4, '#e0b040');
      G.hairq(g, x - 10, FB - 4, 21, '#ffd45a');
    },
    tray(g, x, t) {
      G.R(g, x - 15, FB - 8, 31, 8, OUT); G.R(g, x - 14, FB - 7, 29, 6, '#b8434c');
      G.hairq(g, x - 14, FB - 7, 29, '#e8828c');
      G.R(g, x + 8, FB - 18, 8, 11, OUT); G.R(g, x + 9, FB - 17, 6, 10, '#f0e2d4');
      G.Rh(g, x + 11, FB - 24, 1.5, 7, '#e8828c');
    },
    shoe(g, x, t) {
      G.R(g, x - 13, FB - 11, 27, 11, OUT); G.R(g, x - 12, FB - 10, 25, 9, '#3a2a24');
      G.hairq(g, x - 12, FB - 10, 25, '#6b5244');
      G.R(g, x - 4, FB - 17, 10, 7, OUT); G.R(g, x - 3, FB - 16, 8, 6, '#3a2a24');
      G.Rq(g, x, FB - 7, 1, 1, '#c8b490');
    },
    badge(g, x, t) {
      G.R(g, x - 11, FB - 10, 23, 10, OUT); G.R(g, x - 10, FB - 9, 21, 8, '#e8dccb');
      G.Rh(g, x - 10, FB - 9, 21, 2, '#c8505c');
      for (let i = 0; i < 5; i++) G.Rq(g, x - 6 + i * 3, FB - 5, 2, 1, '#3a2a24');
      if (Math.sin(t * 3) > 0.4) G.glow(g, x, FB - 6, 34, 22, '#ffd47a', 0.3);
    },
    radio(g, x, t) {
      G.R(g, x - 13, FB - 18, 27, 18, OUT); G.R(g, x - 12, FB - 17, 25, 16, '#3a4250');
      G.Rh(g, x - 9, FB - 14, 12, 8, '#12161f');
      for (let i = 0; i < 5; i++)
        G.Rq(g, x - 9 + G.rand(0, 11), FB - 14 + G.rand(0, 7), 1, 1,
          Math.random() < 0.5 ? '#7fd8ff' : '#2a3a4a');
      for (let i = 0; i < 3; i++) G.Rh(g, x + 5, FB - 13 + i * 3, 6, 1.5, '#5c6470');
      G.Rh(g, x + 9, FB - 32, 1.5, 15, '#8a94a8'); G.Rq(g, x + 9, FB - 33, 1, 1, '#ff4a4a');
    },
  };

  const wreckDef = {
    w: 560, start: 40, obj: 'FIND ANYBODY  ·  0 / 5',
    minX: 22, maxX: 528, pspeed: 0.6, grade: 1.25,

    sky(g, S) {
      for (let j = 0; j < G.H; j++)
        G.Rh(g, 0, j, G.W, 1, G.mix('#0d1220', '#2e1c22', Math.pow(j / G.H, 0.85)));
    },

    paint(g, S) {
      // ---- the city, a long way off and still lit ----
      let x = -10;
      while (x < 580) {
        const w = 16 + Math.round(G.hash(x, 5) * 30), hh = 18 + Math.round(G.hash(x + 3, 6) * 34);
        G.R(g, x, FB - 62 - hh, w, hh, '#0b1018');
        for (let wy = FB - 58 - hh; wy < FB - 68; wy += 6)
          for (let wx = x + 2; wx < x + w - 2; wx += 5)
            if (G.hash(wx, wy) > 0.72) G.Rh(g, wx, wy, 1.5, 2, '#3a4a6b');
        x += w + 3;
      }
      // ---- WHAT IS LEFT OF THE BUILDING. A wall, standing on the
      // floor, with a top edge that got taken off it. ----
      const bays = [[8, 148], [176, 132], [326, 96], [438, 118]];
      for (const [bx, bw] of bays) {
        // the ragged top of the wall, bay by bay
        for (let i = 0; i < bw; i += 2) {
          const top = FB - 60 + Math.round(Math.sin((bx + i) * 0.09) * 5 + G.hash(bx + i, 3) * 7);
          for (let y = top; y < FB; y += 1) {
            const p2 = (y - top) / (FB - top);
            // block courses, and it gets sootier the further down you go
            const course = (Math.round(y) % 7 === 0) ? -0.18 : 0;
            const bond = (Math.round((bx + i) / 11) + Math.floor(y / 7)) % 2 ? 0.05 : 0;
            G.Rh(g, bx + i, y, 2, 1,
              G.shade(G.mix('#7d6c64', '#2e2528', 0.2 + p2 * 0.62), course + bond));
          }
          G.Rh(g, bx + i, top, 2, 1, '#9d8b80');
        }
        // soot up the wall from where the fire went out of the windows
        g.globalAlpha = 0.17;
        for (let i = 0; i < bw; i += 3)
          G.Rh(g, bx + i, FB - 38 - G.hash(i + bx, 7) * 12, 3, 22 + G.hash(i, 9) * 10, '#150f12');
        g.globalAlpha = 1;
        // the fascia stripe, still there in patches
        for (let i = 0; i * 16 < bw; i++) {
          if (G.hash(bx + i, 11) < 0.34) continue;
          const fy = FB - 58 + Math.round(Math.sin((bx + i * 16) * 0.09) * 4);
          G.R(g, bx + i * 16, fy, 15, 5, i % 2 ? '#8a2f3a' : '#d8cbb8');
          G.hairq(g, bx + i * 16, fy, 15, i % 2 ? '#c8505c' : '#f0e6d4');
        }
      }
      // ---- window openings punched through it ----
      for (const wx of [30, 200, 348, 462]) {
        G.R(g, wx, FB - 48, 62, 34, '#0a0c14');
        G.bevelq(g, wx, FB - 48, 62, 34, '#2c2830', '#050609');
        for (let i = 0; i < 9; i++) {                    // the teeth left in the frame
          G.Rh(g, wx + 3 + i * 6.6, FB - 48, 3 + G.hash(i + wx, 3) * 3, 3 + G.hash(i, 9) * 8, '#4a4450');
          G.Rh(g, wx + 3 + i * 6.6, FB - 17 - G.hash(i, 5) * 6, 3, 3 + G.hash(i, 7) * 6, '#4a4450');
        }
        g.globalAlpha = 0.4; G.glow(g, wx + 31, FB - 30, 70, 44, '#1a2740', 0.6); g.globalAlpha = 1;
      }
      // ---- the roof, on the floor ----
      for (const q of [[92, 62, 0.68], [268, 74, -0.52], [452, 56, 0.44]]) {
        for (let k = 0; k < q[1]; k++) {
          G.R(g, q[0] + k * q[2] - 1, FB - 2 - k - 1, 6, 3, OUT);
          G.R(g, q[0] + k * q[2], FB - 2 - k, 4, 2, k % 7 < 4 ? '#5a6474' : '#3f4854');
        }
      }
      // a truss lying flat across the middle
      for (let i = 0; i < 60; i++) {
        G.R(g, 150 + i * 2, FB - 6 - Math.round(Math.sin(i * 0.5) * 2), 3, 2, '#4a5568');
        if (i % 4 === 0) G.R(g, 150 + i * 2, FB - 10, 2, 6, '#3f4854');
      }
      // ---- the ground, wet, with the fires on it ----
      for (let j = 0; j < G.H - FB + 4; j++)
        G.Rh(g, 0, FB + j, 580, 1, G.mix('#33272c', '#14101a', j / 34));
      G.hairq(g, 0, FB, 580, '#4a3c40');
      // ---- rubble in heaps, not in a line ----
      for (let m = 0; m < 9; m++) {
        const mx = 24 + m * 62 + G.hash(m, 3) * 14;
        const mw = 44 + G.hash(m, 5) * 34, mh = 8 + G.hash(m, 7) * 14;
        for (let i = 0; i < mw; i += 2) {
          const p2 = i / mw;
          const h = Math.round(mh * Math.sin(p2 * Math.PI) * (0.7 + G.hash(mx + i, 9) * 0.5));
          if (h < 1) continue;
          G.R(g, mx + i, FB - h, 2, h + 4, G.mix('#4a5262', '#161a24', 0.28 + G.hash(i, 11) * 0.4));
          G.Rh(g, mx + i, FB - h, 2, 1, '#77839a');
        }
        // and things you can name, sat in it
        const kind = m % 5;
        const kx = mx + mw * 0.4, ky = FB - 1;
        if (kind === 0) {                                // a booth bench, upside down
          G.R(g, kx - 16, ky - 8, 34, 10, '#5a2028');
          G.hairq(g, kx - 16, ky - 8, 34, '#8a3a44');
          G.R(g, kx - 12, ky + 2, 26, 4, '#3a1418');
        } else if (kind === 1) {                         // a tray stack
          for (let k = 0; k < 4; k++) G.R(g, kx - 10 + k, ky - 6 + k * 2, 20, 2, '#8a3a42');
        } else if (kind === 2) {                         // a length of counter
          G.R(g, kx - 20, ky - 6, 40, 6, '#6b4a30');
          G.hairq(g, kx - 20, ky - 6, 40, '#a87a52');
          G.R(g, kx - 20, ky, 40, 3, '#3a2418');
        } else if (kind === 3) {                         // a chair frame
          for (let k = 0; k < 12; k++) G.R(g, kx - 6 + k * 0.8, ky - k, 3, 2, '#5c6470');
          G.R(g, kx - 8, ky, 18, 3, '#5c6470');
        } else {                                         // a fryer basket
          G.R(g, kx - 8, ky - 7, 18, 8, '#8a94a8');
          for (let k = 1; k < 5; k++) G.vairq(g, kx - 8 + k * 3.4, ky - 6, 6, '#4a5468');
        }
      }
      // the burnt stub of the counter, where it always was
      for (let i = 0; i < 118; i += 2) {
        const th = 14 + Math.round(Math.sin(i * 0.14) * 4 + G.hash(i, 3) * 5);
        G.R(g, 356 + i, FB - th, 2, th, G.mix('#5a4030', '#221609', 0.2 + G.hash(i, 7) * 0.45));
        G.Rh(g, 356 + i, FB - th, 2, 1, '#8a6a4a');
      }
      g.globalAlpha = 0.3;
      G.R(g, 356, FB - 9, 118, 9, '#120c08');
      g.globalAlpha = 1;
      for (let i = 0; i < 5; i++)                        // the stools that were bolted to it
        G.R(g, 366 + i * 24, FB - 8 - G.hash(i, 5) * 4, 6, 10, '#3f4854');
      // ---- the sign's cow head, face down in a puddle, still trying ----
      const fk = Math.sin(S.t * 19) > -0.75 ? 1 : 0.15;
      G.R(g, 274, FB - 14, 56, 16, '#1a2230');
      G.bevelq(g, 274, FB - 14, 56, 16, '#2e3a4e', '#0a0f16');
      const hd = [];
      for (let i = 0; i <= 22; i++) {
        const a2 = (i / 22) * Math.PI * 2;
        hd.push([302 + Math.cos(a2) * 20, FB - 6 + Math.sin(a2) * 6]);
      }
      for (const q of hd) G.Rh(g, q[0] - 1.5, q[1] - 1.5, 3, 3, '#12101a');
      for (const q of hd) G.Rh(g, q[0] - 0.75, q[1] - 0.75, 1.5, 1.5, fk > 0.5 ? '#ff8ab0' : '#5c3a48');
      for (const e of [[-24, -1], [24, -1]])
        G.Rh(g, 302 + e[0], FB - 7, 3, 3, fk > 0.5 ? '#ff8ab0' : '#5c3a48');
      G.Rh(g, 296, FB - 9, 2, 2, fk > 0.5 ? '#ffffff' : '#4a3038');
      G.Rh(g, 306, FB - 9, 2, 2, fk > 0.5 ? '#ffffff' : '#4a3038');
      if (fk > 0.5) G.glow(g, 302, FB - 6, 90, 36, '#ff8ab0', 0.34);
      // ---- two fires, and the smoke off them ----
      for (const f of [[128, 1], [406, 0.85]]) {
        const fl = 0.65 + Math.sin(S.t * 5 + f[0]) * 0.35;
        G.glow(g, f[0], FB - 6, 76 * fl * f[1], 40 * fl, '#ff7a2a', 0.4);
        for (let k = 0; k < 7; k++)
          G.Rh(g, f[0] - 6 + k * 2, FB - 4 - k * 2.4 - fl * 5, 2, 5, k % 2 ? '#ffb050' : '#e0762a');
        g.globalAlpha = 0.13;
        for (let k = 0; k < 11; k++) {
          const sy = FB - 14 - ((S.t * 13 + k * 9 + f[0]) % 100);
          G.Rh(g, f[0] - 5 + Math.sin(sy * 0.08 + f[0]) * 7, sy, 7 + k * 0.9, 4, '#8a7c88');
        }
        g.globalAlpha = 1;
      }
      // ---- puddles on the near floor, holding the fire ----
      for (let i = 0; i < 9; i++) {
        const px = 20 + i * 62 + G.hash(i, 13) * 20, pw = 26 + G.hash(i, 17) * 34;
        g.globalAlpha = 0.35;
        G.fe(g, px, FB + 10 + G.hash(i, 19) * 14, pw / 2, 3, '#2a3a4a');
        g.globalAlpha = 0.18;
        G.fe(g, px, FB + 10 + G.hash(i, 19) * 14, pw / 2.6, 2, '#c8703a');
        g.globalAlpha = 1;
      }
      // scatter on the near floor, so it is not an empty apron
      for (let i = 0; i < 70; i++) {
        const sx = G.hash(i, 23) * 580, sy = FB + 4 + G.hash(i, 29) * 26;
        const sw = 3 + G.hash(i, 31) * 10, sh = 1.5 + G.hash(i, 37) * 3;
        const cc = G.mix(['#4a5262', '#5c3630', '#8a2f3a', '#6b5c3a', '#3f4854'][i % 5],
          '#14101a', 0.34 + G.hash(i, 41) * 0.3);
        G.R(g, sx, sy, sw, sh, cc);
        G.hairq(g, sx, sy, sw, G.shade(cc, 0.4));
      }
      // ---- the things ----
      for (const f of FIND) {
        if (!S.done[f.id]) {
          g.globalAlpha = 0.22 + Math.sin(S.t * 2 + f.x) * 0.06;
          G.glow(g, f.x, FB - 8, 54, 34, '#ffd47a', 0.55);
          g.globalAlpha = 1;
        }
        FINDART[f.id](g, f.x, S.t);
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

    spots: FIND.map((f) => ({
      id: f.id, x: f.x, label: f.label, markY: FB - 30, once: 1,
      on(S) {
        S.mine(f.say, 2.8);
        S.found = (S.found || 0) + 1;
        G.audio.sfx('order');
        S.obj = 'FIND ANYBODY  ·  ' + S.found + ' / 5';
        if (S.found >= 5) {
          S.obj = 'SOMETHING IS COMING DOWN THE ROAD';
          S.flags.torch = 0.01;
          const tr = S.actor('tracy'); if (tr) tr.x = 560;
        }
      },
    })).concat([
      { id: 'her', x: 486, label: 'GO TO HER', markY: FB - 64,
        once: 1, hidden: (S) => !S.flags.torch,
        on(S) { S.play(RESCUE); } },
    ]),

    enter(S) { S.found = 0; S.plegOff = 1; S.pmood = 'sick'; },

    update(S, dt) {
      S.pdy = S.pclip === 'walk' ? -Math.abs(Math.sin(S.t * 7)) * 3 : 0;
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
      // the crutch, so the missing leg reads at a glance
      G.cam.push(g);
      const cx = S.px + 13, top = F - 34 + (S.pdy || 0), bot = F - 1;
      G.R(g, cx - 2, top - 1, 5, bot - top + 2, OUT);
      G.R(g, cx - 1, top, 3, bot - top, '#8a94a8');
      G.vairq(g, cx - 1, top, bot - top, '#d8e4f0');
      G.R(g, cx - 5, top - 3, 11, 4, '#5c6470');
      G.hairq(g, cx - 5, top - 3, 11, '#a8b0bc');
      G.R(g, cx - 4, bot - 1, 9, 3, '#3a2a24');
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
    { d: 3.0, go(S) { S.say('tracy', 'RIGHT. HOME. I HAVE GOT A CRATE OF LEGS AND NOTHING ON TONIGHT.', 3); const tr = S.actor('tracy'); if (tr) { tr.hold = 3; tr.holdClip = 'talk'; } } },
    { d: 1.6, go(S) { S.flags.white = 0; G.audio.sfx('unlock'); }, tick(S, p) { S.flags.white = p; } },
    { d: 0.5, go(S) { S.finish(() => G.go('legfit', 'THE BENCH')); } },
  ];

  (G.scenes = G.scenes || {}).wreck = G.makeStage(wreckDef);
})();

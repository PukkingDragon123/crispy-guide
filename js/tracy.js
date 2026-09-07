// ============================================================
// DOUBLE LIFE v22 - tracy.js  ·  TRACY'S PLACE
//
// Her front room, which she calls the shop. Mint and cream stripes, a
// rose border, bunting she put up when you woke up and never took down,
// and more things pinned to the walls than there is wall.
//
// TWO ACTS, ONE ROOM, NO CUT.
//
//   THE LESSON   one pit, one cone, one very patient human and her AI on
//                a cracked tablet. Every step is gated, so you cannot get
//                it wrong - you can only not have done it yet.
//
//   THE BREAK-IN which used to be six shots of a cutscene in a brown
//                workshop that appears nowhere else in the game. It
//                happens HERE now, four minutes after you hand her the
//                cone, in the room you have been standing in - same
//                bunting, same jars, same cat - and you are in it: she
//                tells you to hide and you have to go and do it, and
//                then you watch the whole thing from under the counter
//                through a gap you chose.
//
// One painter draws the room in every state the story needs it in, so
// the warm version and the wrecked version can never drift apart.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  const CNT_Y = 104;                 // the counter surface
  const PIT = { x: 30, y: 108, w: 62, h: 30 };
  const CONE_X = 132;
  // her tablet, propped on the counter. It was at 176, which is the middle
  // of the counter and therefore the middle of everything that has to
  // happen on it -- she stood in it, her cardigan landed under it and her
  // glasses went behind it.
  const TAB = { x: 152, y: 74 };
  const TRACY_X = 248, TRACY_Y = 146;
  // the front door, on the back wall. There was never one before - the
  // room simply had no way in, which is fine for a tutorial and useless
  // the moment somebody has to come through it.
  const DOOR = { x: 6, y: 32, w: 34, h: 72 };
  // The gap at the far end of the counter, which is where you go. It
  // started at 234, which is exactly where she stands for the whole
  // lesson: she spent the hide beat pointing at a hole her own skirt was
  // covering. Past her, and past the cat.
  const HIDE = { x: 260, y: 118, w: 52, h: 22 };
  const PEEK_X = 286;                // where your head comes back up
  // where everybody stands once it kicks off. The counter is the floor
  // line for the back plane, the same two-plane trick the walkable
  // scenes use: they stand behind it and it cuts them off at the shin.
  const BACK_Y = 116;
  // where everybody ends up. She was at 176, which is where her tablet
  // is propped, so the room painted a cracked screen across her chest.
  const POST = { pol: 108, war: 62, tracy: 224 };

  // ---- the lesson, one beat at a time ----
  const STEPS = [
    { id: 'hello',  need: null,
      say: "THERE. ARM'S ON. TRY NOT TO LOSE THIS ONE.",
      hint: null },
    { id: 'clause', need: null,
      say: "THIS IS CLAUSE. SAY HELLO, CLAUSE.",
      hint: null },
    { id: 'cone',   need: 'cone',
      say: "RIGHT. TAKE A CONE OFF THE STAND.",
      hint: 'TAP THE CONE' },
    { id: 'sweep',  need: 'ball',
      say: "NOW PRESS INTO THE GELATO AND SWEEP. DON'T STAB IT.",
      hint: 'PRESS THE PIT AND DRAG' },
    { id: 'drop',   need: 'built',
      say: "GOOD. NOW PUT IT ON THE CONE.",
      hint: 'LET GO OVER THE CONE' },
    { id: 'serve',  need: 'served',
      say: "GIVE IT HERE THEN. I'VE BEEN UP SINCE FOUR.",
      hint: 'TAP TRACY' },
    { id: 'done',   need: null,
      say: "OH. OH, THAT'S PROPER. YOU'RE GOING TO BE FINE.",
      hint: null },
  ];

  // ---- and then the rest of the night ----
  // d: 0 means the beat waits for you. Everything else runs on a clock.
  const RAID = [
    { id: 'quiet', d: 3.0, who: 'TRACY',
      say: "SIT YOURSELF DOWN. I'LL PUT THE KETTLE ON AND WE'LL DO SAUCES." },
    { id: 'bang',  d: 3.0, who: null, say: null },
    { id: 'hide',  d: 0,   who: 'TRACY',
      say: "GET BEHIND THE COUNTER. GO ON. NOW, LOVE." },
    { id: 'door',  d: 2.4, who: null, say: null },
    { id: 'in',    d: 3.6, who: 'PATROL', col: '#8fd8ff',
      say: 'NOBODY IS ON THE ROLL AT THIS ADDRESS.' },
    { id: 'her',   d: 4.0, who: 'TRACY',
      say: "THERE'S NOBODY HERE BUT ME AND THE CAT. LOOK ALL YOU LIKE." },
    { id: 'white', d: 2.0, who: null, say: null },
    { id: 'gone',  d: 5.0, who: null, say: null },
    { id: 'out',   d: 0,   who: null, say: null },
  ];

  // ============================================================
  // THE ROOM. One painter, every state the story needs.
  //   o.dark     0..1  the lamps down, four in the morning
  //   o.wrecked  0..1  the shelf down, the jars off, the tub over
  //   o.doorOff  0..1  the front door gone and the weather coming in
  //   o.surf     the dug gelato surface, if a lesson is happening in it
  //   o.noCat    the cat has had enough and gone
  //   o.back     drawn after the wall and BEFORE the counter, so anybody
  //              standing on the back plane gets their shins hidden by it
  // ============================================================
  G.tracyRoom = function (g, t, o) {
    o = o || {};
    const dk = o.dark || 0;
    const wr = o.wrecked || 0;
    // one dimmer for the whole room, so nothing forgets to get dark
    const M = (c) => (dk ? G.mix(c, '#0e1018', dk * 0.72) : c);

    // ---- the papered wall, in mint and cream stripes ----
    G.R(g, 0, 0, G.W, G.H, M('#f3e6d2'));
    for (let x = 0; x < G.W; x += 12) {
      G.R(g, x, 0, 6, 96, M('#e9f2e4'));
      G.R(g, x + 6, 0, 6, 96, M('#f7efe0'));
      G.vairq(g, x + 6, 0, 96, M('#dfe9d8'));
    }
    // a rose border along the top
    G.R(g, 0, 0, G.W, 12, M('#dbeae0'));
    for (let i = 0; i < 27; i++) {
      const rx = 6 + i * 12, ry = 6 + Math.sin(i * 0.9) * 1.5;
      G.fc(g, rx, ry, 2.4, M('#f0a8bc'));
      G.fc(g, rx, ry, 1.2, M('#ffd0dc'));
      G.Rq(g, rx + 2.5, ry + 1.5, 2, 1, M('#8fbf7a'));
      G.Rq(g, rx - 4, ry + 1, 2, 1, M('#8fbf7a'));
    }
    G.R(g, 0, 12, G.W, 1.5, M('#d8a8b8'));
    // the dado, in painted board
    G.plate(g, -4, 92, G.W + 8, 5, M('#e8dcc6'), { r: 1, band: 2, spec: false });
    G.R(g, 0, 97, G.W, 24, M('#cfe0d4'));
    for (let x = 0; x < G.W; x += 14) G.vseam(g, x, 97, 24, M('#b3c9ba'), M('#e6f1e6'));

    // ---- the window, with gingham curtains and a box of geraniums ----
    G.plate(g, 210, 16, 72, 56, M('#e8c8a0'), { r: 2, band: 2 });
    G.R(g, 214, 20, 64, 48, M('#9fc4dd'));
    for (let j = 0; j < 48; j += 1)
      G.Rh(g, 214, 20 + j, 64, 1, M(G.mix('#bcd9ec', '#7fa8c8', j / 48)));
    // rain outside, and a good deal more of it once it is four in the morning
    const rn = 16 + Math.round(dk * 22);
    for (let i = 0; i < rn; i++) {
      const sd = G.hash(i, 3);
      G.Rh(g, 215 + ((sd * 62 + t * (10 + dk * 20)) % 62),
        21 + ((G.hash(i, 5) * 46 + t * (44 + dk * 90)) % 46), 0.5, 3, M('#cfe4ff'));
    }
    G.Rh(g, 245, 20, 1.5, 48, M('#e8c8a0'));
    G.Rh(g, 214, 43, 64, 1.5, M('#e8c8a0'));
    if (wr > 0.4) {                                  // a pane goes with everything else
      for (let i = 0; i < 7; i++)
        G.Rh(g, 248 + i * 4, 24 + Math.sin(i * 1.9) * 8, 4, 0.5, M('#f2fbff'));
      G.R(g, 246, 22, 30, 20, '#0d1420');
      for (let i = 0; i < 9; i++)
        G.Rh(g, 246 + G.hash(i, 5) * 28, 22 + G.hash(i, 9) * 6, 2 + G.hash(i, 3) * 4,
          2 + G.hash(i, 7) * 6, M('#8fb8d8'));
    }
    for (const sd of [-1, 1]) {                      // gingham curtains
      const cx2 = sd < 0 ? 212 : 268;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 11; j++)
        G.Rh(g, cx2 + i * 4, 18 + j * 4, 4, 4, M((i + j) % 2 ? '#f6c8d2' : '#fbeef0'));
      G.Rh(g, cx2, 18, 12, 1, M('#e0a0b0'));
      G.Rh(g, cx2 + (sd < 0 ? 11 : 0), 40, 1, 22, M('#e0a0b0'));
    }
    G.Rh(g, 208, 14, 76, 2, M('#c8a884'));
    G.plate(g, 216, 70, 60, 8, M('#b8785c'), { r: 1, band: 1, spec: false });
    for (let i = 0; i < 7; i++) {                    // geraniums
      const fx = 221 + i * 8, sw = Math.sin(t * 1.2 + i) * 1;
      G.Rh(g, fx + sw, 64, 1, 7, M('#6b9a4a'));
      G.fc(g, fx + sw, 63, 2.2, M(['#e0574a', '#f0a8bc', '#ffd45a'][i % 3]));
      G.Rq(g, fx + sw - 1, 62, 1, 1, M('#ffffff'));
    }

    // ---- THE FRONT DOOR ----
    tracyDoor(g, t, o, M);

    // ---- her lamp, which is still the whole mood ----
    // it swings on its flex once somebody has been through the room
    const sw = wr > 0.4 ? Math.sin(t * 1.3) * 7 : 0;
    const lx = 108 + sw;
    G.Rh(g, 108, 0, 1.5, 12, M('#c8a884'));
    G.plate(g, lx - 13, 12, 26, 4, M('#e0574a'), { r: 1, band: 2 });
    for (let j = 0; j < 6; j++) {
      const w = 26 - j * 3;
      G.Rh(g, lx - w / 2, 16 + j, w, 1, M(j < 2 ? '#ff8a7a' : '#c8483a'));
    }
    // the bulb keeps burning whatever else happens, and in the dark it is
    // the only thing in the room that does
    G.fc(g, lx, 24, 3, '#fff4c8');
    G.glow(g, lx, 28, 200, 160, '#ffd9a0', 0.42 - dk * 0.18);

    // ---- bunting: a string first, then triangles hanging off it ----
    // half of it comes down when they do
    for (let x = 0; x < G.W; x += 2) {
      const q = (x % 80) / 80;
      const sag = Math.sin(q * Math.PI) * 3 + Math.sin(t * 0.5 + x * 0.02) * 0.5;
      if (wr > 0.3 && x > 150) continue;
      G.Rq(g, x, 15 + sag, 2, 1, M('#c8a884'));
    }
    for (let i = 0; i < 12; i++) {
      const bx = 8 + i * 26;
      const col = ['#f6c8d2', '#cfe4c8', '#ffe6a8', '#cfe0f0'][i % 4];
      const down = wr > 0.3 && bx > 150;
      if (down) {                                    // fallen, hanging off the shelf
        const dy = 30 + ((i * 13) % 40);
        for (let j = 0; j < 5; j++)
          G.Rh(g, bx - 4 + j + 6, dy + j, 9 - j * 2, 1, M(j < 1 ? G.shade(col, 0.3) : col));
        continue;
      }
      const sag = Math.sin(((bx % 80) / 80) * Math.PI) * 3 + Math.sin(t * 0.5 + bx * 0.02) * 0.5;
      for (let j = 0; j < 5; j++)
        G.Rh(g, bx - 4 + j, 16 + sag + j, 9 - j * 2, 1, M(j < 1 ? G.shade(col, 0.3) : col));
    }

    // ---- two framed photographs of a shop that is not there any more ----
    for (let i = 0; i < 2; i++) {
      const tilt = wr > 0.5 ? (i ? 3 : -2) : 0;
      const fx = 50 + i * 30, fy = 28 + (i % 2) * 6 + tilt;
      G.plate(g, fx, fy, 24, 20, M('#c8a884'), { r: 1, band: 1, spec: false });
      G.R(g, fx + 3, fy + 3, 18, 14, M(i === 1 ? '#8fbfd8' : '#e8d8c0'));
      if (i === 1) { G.R(g, fx + 3, fy + 11, 18, 6, M('#c8a070')); G.fc(g, fx + 12, fy + 8, 3, M('#f0a8bc')); }
      else { G.fc(g, fx + 8, fy + 9, 3, M('#d8a882')); G.fc(g, fx + 15, fy + 9, 3, M('#d8a882')); }
    }

    // ---- a shelf of jars in colours she chose to look at, not to sell ----
    G.plate(g, 122, 44, 76, 3, M('#c8a884'), { r: 1, band: 1, spec: false });
    for (let i = 0; i < 5; i++) {
      const jx = 126 + i * 14;
      const col = ['#f0a8bc', '#8fd8c0', '#ffd45a', '#b48ae0', '#8fbfd8'][i];
      // three of the five end up on the counter
      const off = wr > 0.25 + i * 0.12 && i % 2 === 0;
      if (off) continue;
      G.plate(g, jx, 33, 10, 11, M(G.mix(col, '#f3e6d2', 0.5)), { r: 1, band: 1, spec: false });
      G.Rh(g, jx + 1, 35, 8, 6, M(col));
      G.hair(g, jx + 1, 35, 8, M(G.shade(col, 0.5)));
      G.Rh(g, jx + 2, 31, 6, 2, M('#c8a884'));
      G.Rq(g, jx + 3, 30, 4, 1, M('#e8dccb'));
    }

    // ---- a pot plant she talks to ----
    // It lived at 8,68 until the door took that wall, then at 292, where
    // half of it hung off the right edge of the screen. It stands on the
    // counter by the door now, which is where a shop keeps one, and it is
    // the first thing the door flattens on its way in.
    const px = 12, pdy = wr > 0.45 ? 6 : 0, plean = wr > 0.45 ? 0.9 : 0;
    G.plate(g, px - 8, 92 + pdy, 16, 12, M('#c8785a'), { r: 1, band: 2 });
    G.Rh(g, px - 10, 90 + pdy, 20, 3, M('#e0947a'));
    for (let i = 0; i < 6; i++) {
      const a2 = -1.9 + i * 0.42 + plean, ln = 12 + (i % 3) * 5;
      for (let k = 0; k < ln; k++)
        G.Rh(g, px + Math.cos(a2) * k + Math.sin(t * 1.1 + i) * (k * 0.05),
          90 + pdy + Math.sin(a2) * k, 1.5, 1.5, M(k > ln - 4 ? '#a8d878' : '#6b9a4a'));
    }
    if (wr > 0.45) for (let i = 0; i < 7; i++)        // and the soil it lost
      G.Rq(g, px + 6 + G.hash(i, 5) * 20, 100 + G.hash(i, 9) * 4, 2, 1, M('#4a3020'));

    // ---- motes of dust in the lamplight ----
    for (const m of (o.motes || [])) {
      g.globalAlpha = 0.34 * (1 - dk * 0.5);
      G.Rh(g, m.x, m.y, 1, 1, '#ffd9a0');
      g.globalAlpha = 1;
    }

    // ---- whoever is standing on the back plane, before the counter ----
    if (o.back) o.back(g);

    // ===== the counter =====
    G.plate(g, -4, CNT_Y, G.W + 8, 10, M('#e8dcc6'), { r: 2, band: 3, grain: 2 });
    G.hair(g, -4, CNT_Y, G.W + 8, M('#fffaf0'));
    for (let x = 0; x < G.W; x += 18) G.vseam(g, x, CNT_Y + 2, 8, M('#c8b89c'), M('#fffaf0'));
    G.R(g, -4, CNT_Y + 10, G.W + 8, 4, M('#c9b89c'));
    // the front, in mint and cream stripes like a deckchair
    for (let i = 0; i < 24; i++)
      G.R(g, -4 + i * 14, CNT_Y + 14, 7, 22, M(i % 2 ? '#cfe4d8' : '#fbf3e6'));
    G.R(g, -4, CNT_Y + 14, G.W + 8, 1, M('#b3c9ba'));
    // THE GAP. A missing board at the far end, and the dark under the
    // counter behind it. It is scenery for the whole lesson and then it
    // is the only thing in the room that matters.
    G.R(g, HIDE.x, HIDE.y, HIDE.w, HIDE.h, M('#241c18'));
    G.R(g, HIDE.x, HIDE.y, HIDE.w, 2, '#12100e');
    G.hair(g, HIDE.x, HIDE.y + HIDE.h - 0.5, HIDE.w, M('#8a7a62'));
    for (const sd of [0, HIDE.w - 1.5])
      G.vair(g, HIDE.x + sd, HIDE.y, HIDE.h, M('#b3a68e'));
    // a stack of boxes and a dustpan in there, so it reads as a real gap
    G.Rh(g, HIDE.x + 4, HIDE.y + 12, 14, 10, M('#3f342a'));
    G.Rh(g, HIDE.x + 20, HIDE.y + 15, 10, 7, M('#4a3c30'));
    G.Rh(g, HIDE.x + 36, HIDE.y + 14, 12, 8, M('#38302a'));

    // a checked cloth over one end
    for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++)
      G.Rh(g, 168 + i * 5, CNT_Y - 2 + j * 4, 5, 4, M((i + j) % 2 ? '#f0a8bc' : '#fbeef0'));

    // ---- the jars that came off the shelf, on the counter ----
    if (wr > 0.25) for (let i = 0; i < 5; i += 2) {
      const col = ['#f0a8bc', '#8fd8c0', '#ffd45a', '#b48ae0', '#8fbfd8'][i];
      const jx = 126 + i * 14 + (i - 2) * 5;
      G.Rh(g, jx, CNT_Y - 5, 11, 5, M(G.mix(col, '#f3e6d2', 0.5)));
      G.Rh(g, jx + 1, CNT_Y - 4, 7, 3, M(col));
      for (let k = 0; k < 4; k++)
        G.Rq(g, jx + 11 + k * 3, CNT_Y - 1 + (k % 2), 2, 1, M(col));
    }

    // ---- the cat, asleep on the warm end of the counter ----
    if (!o.noCat)
      G.drawCreature(g, 'cat', 298, CNT_Y + 1, 0.6,
        { t, clip: o.catUp ? 'idle' : 'slump', ct: t, fur: M('#e8c8a0') });

    // ===== her gelato pit, in a wooden tub =====
    tracyTub(g, t, o, M);

    // ===== the cone stand =====
    if (wr > 0.5) {                                  // over, and the cones out
      G.plate(g, CONE_X - 26, CNT_Y - 3, 24, 4, M('#c8a884'), { r: 1, band: 1 });
      for (let i = 0; i < 3; i++)
        G.cone(g, CONE_X - 26 + i * 11, CNT_Y - 1, { w: 9, h: 11 });
    } else {
      G.plate(g, CONE_X - 12, CNT_Y - 4, 24, 5, M('#c8a884'), { r: 1, band: 1 });
    }

    // ===== clause, on a cracked tablet propped on the counter =====
    // face down on the counter afterwards, still lit, which is the whole
    // reason there is a next scene
    const tx = TAB.x, ty = wr > 0.6 ? TAB.y + 14 : TAB.y;
    G.plate(g, tx, ty, 30, 24, M('#2a2a34'), { r: 1, band: 2, bolts: 1 });
    G.R(g, tx + 3, ty + 3, 24, 18, '#0d1420');
    for (let j = ty + 4; j < ty + 20; j += 3) {
      g.globalAlpha = 0.12; G.Rh(g, tx + 4, j, 22, 1, '#d97757'); g.globalAlpha = 1;
    }
    for (let i = 0; i < 8; i++)                      // the crack
      G.Rh(g, tx + 6 + i * 2.6, ty + 4 + Math.sin(i * 1.7) * 5, 1, 0.5, '#5c6070');
    G.Rh(g, tx, ty + 22, 30, 3, M('#1a1a22'));
    return { tabletX: tx + 15, tabletY: ty + 12 };
  };

  // ---- the front door, and the bell over it ----
  function tracyDoor(g, t, o, M) {
    const off = o.doorOff || 0;
    const D = DOOR;
    // the frame, and a step under it
    G.plate(g, D.x - 5, D.y - 5, D.w + 10, D.h + 6, M('#c8a884'), { r: 1, band: 2, grain: 3 });
    G.R(g, D.x, D.y, D.w, D.h, off > 0 ? '#0a0a12' : M('#e0d0b4'));
    if (off > 0) {
      // cold light, and the weather coming into a warm room
      G.glow(g, D.x + D.w / 2, D.y + D.h * 0.6, 150, 170, '#3a9ad8', 0.24 + off * 0.34);
      for (let i = 0; i < 20; i++) {
        const sd = G.hash(i, 3);
        G.Rh(g, D.x + 2 + ((sd * (D.w - 5) + t * 16) % (D.w - 5)),
          D.y + ((G.hash(i, 5) * D.h + t * 170) % D.h), 0.5, 4, '#7fb8e8');
      }
      // the splinters left standing in the frame
      for (let i = 0; i < 11; i++) {
        const sx = D.x + G.hash(i, 7) * (D.w - 4);
        G.Rh(g, sx, D.y, 2 + G.hash(i, 9) * 4, 3 + G.hash(i, 13) * 9, M('#8a6540'));
        G.Rh(g, sx, D.y + D.h - 3 - G.hash(i, 17) * 7, 2, 3 + G.hash(i, 19) * 7, M('#8a6540'));
      }
      // wet on the boards, catching what light there is
      g.globalAlpha = 0.3;
      G.rr(g, D.x - 2, CNT_Y - 6, D.w + 10, 5, '#4a6a8a');
      g.globalAlpha = 1;
    } else {
      // two panels, a bit of glass and a knob she has polished for years
      G.bevel(g, D.x, D.y, D.w, D.h, M('#f2e4cc'), M('#9a7a5a'));
      G.R(g, D.x + 4, D.y + 5, D.w - 8, 22, M('#bcd9ec'));
      G.bevelq(g, D.x + 4, D.y + 5, D.w - 8, 22, M('#e8f4ff'), M('#8aa8c0'));
      G.Rh(g, D.x + D.w / 2 - 0.75, D.y + 5, 1.5, 22, M('#c8a884'));
      for (let i = 0; i < 2; i++) {
        const py = D.y + 32 + i * 20;
        G.R(g, D.x + 5, py, D.w - 10, 16, M('#d6c4a6'));
        G.bevelq(g, D.x + 5, py, D.w - 10, 16, M('#9a7a5a'), M('#f2e4cc'));
      }
      G.fc(g, D.x + D.w - 7, D.y + 42, 2.4, M('#c8a24a'));
      G.Rq(g, D.x + D.w - 8, D.y + 41, 1, 1, M('#ffe6a8'));
      // OPEN, turned round to CLOSED hours ago
      G.Rh(g, D.x + 7, D.y + 12, 20, 8, M('#f6e8d4'));
      G.text(g, 'CLOSED', D.x + 17, D.y + 14, M('#c8505c'), { align: 'center', sc: 0.5 });
    }
    // the shop bell on its curl of brass, which is how she knows
    const bx = D.x + D.w + 4, by = D.y - 2;
    const ring = o.bell || 0;
    const swing = ring > 0 ? Math.sin(t * 26) * ring * 3 : 0;
    G.Rh(g, bx - 0.5, by - 6, 1, 6, M('#a8843a'));
    G.fe(g, bx + swing, by + 2, 4, 3.5, M('#e0b83a'));
    G.fe(g, bx + swing, by + 1, 3, 2.5, M('#ffe08a'));
    G.Rq(g, bx + swing - 0.5, by + 5, 1, 1.5, M('#8a6a24'));
    if (ring > 0) {
      g.globalAlpha = ring;
      for (let k = 0; k < 3; k++)
        G.oc(g, bx + swing, by + 2, 6 + k * 4 + ring * 4, '#ffe08a');
      g.globalAlpha = 1;
    }
  }

  // ---- the tub the gelato lives in ----
  function tracyTub(g, t, o, M) {
    const wr = o.wrecked || 0;
    const flav = o.flav || { col: '#f2e0b0', fleck: '#6b3f22' };
    if (wr > 0.45) {
      // over on its side, and the good stuff across the counter
      g.save();
      g.translate(PIT.x + 20, PIT.y + 20); g.rotate(-0.38); g.translate(-(PIT.x + 20), -(PIT.y + 20));
      G.plate(g, PIT.x - 7, PIT.y - 8, PIT.w + 14, PIT.h + 22, M('#c8a884'),
        { r: 2, band: 2, grain: 3, bolts: 1 });
      // the staves and the two steel hoops, or it is just a dark slab
      for (let i = 0; i < 7; i++)
        G.vseam(g, PIT.x - 4 + i * 11, PIT.y - 6, PIT.h + 18, M('#8a6a48'), M('#dcc4a0'));
      for (const hy of [PIT.y - 2, PIT.y + PIT.h + 6]) {
        G.Rh(g, PIT.x - 7, hy, PIT.w + 14, 2.5, M('#8a94a8'));
        G.hair(g, PIT.x - 7, hy, PIT.w + 14, M('#d8e4f0'));
      }
      // the open mouth of it, facing us now
      G.R(g, PIT.x + 2, PIT.y + 2, PIT.w - 4, PIT.h + 4, M('#2a1c14'));
      G.bevelq(g, PIT.x + 2, PIT.y + 2, PIT.w - 4, PIT.h + 4, M('#120c08'), M('#6b5238'));
      g.restore();
      for (let i = 0; i < 22; i++) {
        const sx = PIT.x + 14 + G.hash(i, 5) * 70, sy = CNT_Y - 4 + G.hash(i, 9) * 6;
        G.Rh(g, sx, sy, 2 + G.hash(i, 3) * 4, 2, M(G.shade(flav.col, -0.1)));
        if (G.hash(i, 11) > 0.7) G.Rq(g, sx + 1, sy, 1, 1, M(flav.fleck));
      }
      return;
    }
    G.plate(g, PIT.x - 7, PIT.y - 8, PIT.w + 14, PIT.h + 22, M('#c8a884'),
      { r: 2, band: 2, grain: 3, bolts: 1 });
    // steel rim round the mouth of the tub
    G.R(g, PIT.x - 4, PIT.y - 5, PIT.w + 8, PIT.h + 8, M('#2a1c14'));
    G.Rh(g, PIT.x - 4, PIT.y - 5, PIT.w + 8, 2, M('#8a94a8'));
    G.hair(g, PIT.x - 4, PIT.y - 5, PIT.w + 8, M('#d8e4f0'));
    for (const sd of [-1, 1])
      G.vair(g, PIT.x + (sd > 0 ? PIT.w + 3 : -4), PIT.y - 4, PIT.h + 6, M('#6b7f96'));
    // the surface, dug where you have been
    const surf = o.surf;
    for (let j = 0; j < 10; j++) for (let i = 0; i < 16; i++) {
      const d = surf ? surf[j * 16 + i] : 0;
      const cw = PIT.w / 16, chh = PIT.h / 10;
      // a soft dome across the tub, so it reads as a mass and not a swatch
      const nx = (i + 0.5) / 16 * 2 - 1, ny = (j + 0.5) / 10 * 2 - 1;
      const dome = 1 - Math.min(1, (nx * nx * 0.55 + ny * ny * 0.75));
      const lit = G.clamp(0.5 + dome * 0.5 - d * 0.55, 0, 1);
      const col = G.mix(G.shade(flav.col, -0.5), G.mix(flav.col, '#ffffff', 0.2), lit);
      G.Rh(g, PIT.x + i * cw, PIT.y + j * chh, cw + 0.5, chh + 0.5, M(col));
      if (G.hash(i * 3.1, j * 2.7) > 0.9)            // flecks of chocolate through it
        G.Rh(g, PIT.x + i * cw + 1, PIT.y + j * chh + 1, 1.5, 1.5, M(flav.fleck));
    }
    // one previous scoop scar, so it looks used
    for (let k = 0; k < 3; k++)
      G.Rh(g, PIT.x + 8 + k * 16, PIT.y + 4 + (k % 2) * 3, 7, 1, M(G.shade(flav.col, -0.32)));
    // frost on the rim, and her label chalked on the front board
    g.globalAlpha = 0.3;
    G.Rh(g, PIT.x - 3, PIT.y - 3, PIT.w + 6, 2, '#dff0ff');
    g.globalAlpha = 1;
    // her label, chalked on the front board. It used to sit at +4 below the
    // tub, which is under the dialogue card, so the one hand-written thing
    // in the room has been sawn in half for eight versions.
    G.Rh(g, PIT.x - 4, PIT.y + PIT.h - 7, PIT.w + 8, 9, M('#3a4a44'));
    G.hairq(g, PIT.x - 4, PIT.y + PIT.h - 7, PIT.w + 8, M('#5c7068'));
    G.text(g, 'GELATO DELLA CASA', PIT.x + PIT.w / 2, PIT.y + PIT.h - 5, M('#e8f2e6'),
      { align: 'center', sc: 0.5 });
  }

  // ============================================================
  const tracy = (G.scenes = G.scenes || {}).tracy = {
    // the layout, so a harness drives the real geometry
    geom: { CNT_Y, PIT, CONE_X, TRACY_X, TRACY_Y, DOOR, HIDE, PEEK_X, BACK_Y, POST },
    enter() {
      this.t = 0;
      this.act = 'lesson';
      this.step = 0;
      this.stepT = 0;
      this.hold = null;            // { kind:'sweep'|'ball', ... }
      this.build = null;           // { base, scoops }
      this.surf = new Float32Array(16 * 10);
      this.parts = [];
      this.served = false;
      this.eatT = 0;
      this.clap = 0;
      this.flav = { col: '#f2e0b0', goo: 3, fleck: '#6b3f22', name: 'HERS' };
      this.motes = [];
      for (let i = 0; i < 14; i++)
        this.motes.push({ x: G.rand(10, 310), y: G.rand(20, 150), a: Math.random() * 6.3,
          sp: G.rand(2, 7) });
      // ---- the raid, all of it off until it is not ----
      this.beat = 0; this.beatT = 0; this.lastBang = -1;
      this.dark = 0; this.wreck = 0; this.doorOff = 0; this.bell = 0;
      this.hid = 0; this.hideP = 0; this.nagT = 0;
      this.doorKick = 0; this.white = 0; this.shards = [];
      this.her = { x: TRACY_X, y: TRACY_Y, sc: 1.9 };
      this.bots = null;
      G.steam.length = 0;
      G.audio.music('title');
    },

    cur() { return STEPS[Math.min(this.step, STEPS.length - 1)]; },
    beatOf() { return RAID[Math.min(this.beat, RAID.length - 1)]; },
    advance() {
      if (this.step < STEPS.length - 1) { this.step++; this.stepT = 0; G.audio.sfx('order'); }
    },
    // has the current step's requirement been met?
    met() {
      const n = this.cur().need;
      if (!n) return false;
      if (n === 'cone') return !!(this.build && this.build.base === 'cone');
      if (n === 'ball') return !!(this.hold && this.hold.kind === 'ball');
      if (n === 'built') return !!(this.build && this.build.scoops.length);
      if (n === 'served') return this.served;
      return false;
    },

    // ---------------- input ----------------
    onDown(x, y) {
      if (this.act === 'raid') return this.raidDown(x, y);
      const st = this.cur();
      // the talky beats just advance on a tap
      if (!st.need) {
        // the prompt only appears at 0.8, so do not accept a tap before it
        if (st.id === 'done') { if (this.stepT > 1) this.startRaid(); return; }
        if (this.stepT > 0.5) this.advance();
        return;
      }
      // the cone stand
      if (G.inRect(x, y, CONE_X - 13, CNT_Y - 28, 26, 32)) {
        if (this.build) { G.audio.sfx('back'); return; }
        this.build = { base: 'cone', scoops: [] };
        G.audio.sfx('grab');
        return;
      }
      // her tablet, which is clause
      if (G.inRect(x, y, TAB.x - 4, TAB.y - 4, 38, 32)) {
        G.audio.sfx('menu');
        this.clauseSay = G.pick([
          'HELLO. I AM A FAVOUR SHE IS DOING YOU.',
          'SHE WROTE MY PERSONALITY IN ONE EVENING. IT SHOWS.',
          'I HAVE A RECIPE INDEX. IT HAS TWO RECIPES IN IT.',
          'DO NOT LET HER TELL YOU SHE IS FINE.',
        ]);
        this.clauseT = 3.4;
        return;
      }
      // the pit
      if (G.inRect(x, y, PIT.x - 3, PIT.y - 3, PIT.w + 6, PIT.h + 6)) {
        if (this.hold) return;
        this.hold = { kind: 'sweep', fill: 0, lastX: x, lastY: y, moved: 0 };
        G.audio.sfx('grab');
        return;
      }
      // giving it to her
      if (this.build && this.build.scoops.length &&
          G.inRect(x, y, TRACY_X - 26, TRACY_Y - 76, 52, 76)) {
        this.serve();
        return;
      }
    },
    onUp() {
      if (this.act === 'raid') return;
      const h = this.hold;
      if (!h) return;
      if (h.kind === 'sweep') {
        G.audio.loop('carve', false);
        if (h.fill < 0.3) { this.hold = null; G.audio.sfx('back'); return; }
        G.audio.sfx(h.fill > 0.7 ? 'perfect' : 'scoopOff');
        this.hold = { kind: 'ball', r: 10, bx: G.mouse.x, by: G.mouse.y, wob: 1 };
        G.floatText('NICE', G.mouse.x, G.mouse.y - 16, P.lime);
        return;
      }
      if (h.kind === 'ball') {
        this.hold = null;
        // over the cone? it lands
        if (this.build && this.build.base === 'cone' &&
            G.dist(G.mouse.x, G.mouse.y, CONE_X, CNT_Y - 30) < 30) {
          this.build.scoops.push({ wob: 1 });
          G.audio.sfx('plop');
          G.spark(CONE_X, CNT_Y - 34, ['#ffffff', this.flav.col], 10, 40);
        } else {
          G.audio.sfx('splat');
          for (let i = 0; i < 8; i++)
            this.parts.push({ x: G.mouse.x, y: G.mouse.y, vx: G.rand(-30, 30),
              vy: G.rand(-30, 10), t: 0, life: 0.6, col: this.flav.col });
          G.floatText('ON THE FLOOR', G.mouse.x, G.mouse.y - 14, P.warn);
        }
      }
    },
    serve() {
      this.served = true;
      // SHE HAS IT NOW. The build used to stay on the stand for the rest of
      // the scene, so a cone she had already eaten was still standing there
      // through the whole break-in.
      this.build = null;
      this.eatT = 0.001;
      this.clap = 1;
      G.audio.sfx('good');
      G.flyCoin(TRACY_X, TRACY_Y - 50, 0);
    },

    // ============================================================
    // THE BREAK-IN
    // ============================================================
    startRaid() {
      G.markChapter('ch1');
      G.state.tut = 99;                        // she already taught you
      G.save();
      this.act = 'raid';
      this.beat = 0; this.beatT = 0;
      this.hold = null;
      G.audio.sfx('clack');
    },
    nextBeat() {
      if (this.beat >= RAID.length - 1) return;
      this.beat++; this.beatT = 0;
      const id = this.beatOf().id;
      if (id === 'bang') { this.bell = 1; G.audio.sfx('snap'); G.shake(3, 0.4); }
      if (id === 'hide') { this.nagT = 0; }
      if (id === 'door') {
        this.doorKick = 0.001;
        G.audio.sfx('snap'); G.shake(6, 0.6); G.screenFlash('#cfe4ff', 0.28);
        for (let i = 0; i < 26; i++)
          this.shards.push({ a: G.hash(i, 3) * 1.8 - 0.5, sp: 40 + G.hash(i, 7) * 150,
            t: 0, col: G.hash(i, 11) > 0.6 ? '#bcd9ec' : '#8a6540' });
      }
      if (id === 'in') {
        this.bots = { pol: -30, war: -70 };
        G.audio.sfx('boot');
      }
      if (id === 'white') { this.white = 1; G.audio.sfx('zap'); G.shake(7, 0.5); }
      // THEY GO. The first pass never cleared them, so the room sat there
      // saying THEY DID NOT ARREST ANYONE with two of them stood in it,
      // sweeping their torches over an empty counter.
      if (id === 'gone') { this.bots = null; }
      if (id === 'gone') { G.audio.sfx('back'); }
    },
    raidDown(x, y) {
      const b = this.beatOf();
      if (b.id === 'hide') {
        if (G.inRect(x, y, HIDE.x - 6, HIDE.y - 6, HIDE.w + 12, HIDE.h + 12)) this.goHide();
        return;
      }
      if (b.id === 'out') { if (this.beatT > 0.6) this.leave(); return; }
      // everything else is on a clock, but a tap pushes it along
      if (this.beatT > 0.9) this.nextBeat();
    },
    goHide() {
      if (this.hid) return;
      this.hid = 1;
      G.audio.sfx('grab');
      G.floatText('HIDDEN', PEEK_X, HIDE.y - 12, P.lime);
      this.nextBeat();
    },
    leave() {
      G.save();
      G.playCine('chip', () => {
        G.newDayStats();
        G.state.today.demand = G.rollDemand();
        G.go('day', 'DAY 1');
      });
    },

    // ---------------- update ----------------
    update(dt) {
      this.t += dt;
      if (this.clauseT > 0) this.clauseT -= dt;

      // dust in the lamplight
      for (const m of this.motes) {
        m.a += dt * 0.6;
        m.x += Math.cos(m.a) * m.sp * dt;
        m.y += (Math.sin(m.a * 0.7) * m.sp * 0.6 - 2) * dt;
        if (m.y < 14) m.y = 152;
      }
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p2 = this.parts[i];
        p2.t += dt; p2.x += p2.vx * dt; p2.y += p2.vy * dt; p2.vy += 180 * dt;
        if (p2.t > p2.life) this.parts.splice(i, 1);
      }

      if (this.act === 'raid') { this.raidUpdate(dt); return; }

      this.stepT += dt;
      if (this.clap > 0) this.clap = Math.max(0, this.clap - dt * 0.5);
      const M = G.mouse;

      // sweeping
      const h = this.hold;
      if (h && h.kind === 'sweep') {
        if (!M.down) { this.onUp(); }
        else {
          const inside = G.inRect(M.x, M.y, PIT.x, PIT.y, PIT.w, PIT.h);
          const moved = G.dist(M.x, M.y, h.lastX, h.lastY);
          h.moved = moved;
          h.lastX = M.x; h.lastY = M.y;
          if (inside) {
            const gx = Math.floor((M.x - PIT.x) / PIT.w * 16);
            const gy = Math.floor((M.y - PIT.y) / PIT.h * 10);
            for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
              const d = Math.hypot(i, j);
              if (d > 2.4) continue;
              const k = (gy + j) * 16 + (gx + i);
              if (k < 0 || k >= this.surf.length) continue;
              const bite = (1 - d / 2.8) * dt * 2.2;
              this.surf[k] = Math.min(1, this.surf[k] + bite);
              h.fill = Math.min(1.2, h.fill + bite * (0.5 + Math.min(1, moved * 0.09)));
            }
            G.audio.loop('carve', true);
            if (Math.random() < dt * 30)
              this.parts.push({ x: M.x + G.rand(-6, 6), y: M.y + G.rand(-4, 4),
                vx: G.rand(-20, 20), vy: G.rand(-34, -6), t: 0, life: 0.5, col: this.flav.col });
          } else G.audio.loop('carve', false);
        }
      }
      if (h && h.kind === 'ball') { h.bx = M.x; h.by = M.y; h.wob = Math.max(0, h.wob - dt * 1.6); }
      for (const b of (this.build ? this.build.scoops : [])) b.wob = Math.max(0, b.wob - dt * 1.4);

      // her eating it
      if (this.eatT > 0) {
        this.eatT += dt;
        if (this.eatT > 2.6 && this.step < STEPS.length - 1) this.advance();
      }

      // the gate: once the step's requirement lands, she moves on
      if (this.met() && this.stepT > 0.35) this.advance();
    },

    raidUpdate(dt) {
      this.beatT += dt;
      const b = this.beatOf();
      const id = b.id;

      // the light goes out of the room the moment somebody knocks
      const wantDark = id === 'quiet' ? 0 : 1;
      this.dark = G.lerp(this.dark, wantDark, Math.min(1, dt * 1.4));
      // and it gets taken apart from the door beat on
      const wantWreck = (id === 'door' || id === 'in') ? 0.3
        : (id === 'her') ? 0.5 : (id === 'white' || id === 'gone' || id === 'out') ? 1 : 0;
      this.wreck = G.lerp(this.wreck, wantWreck, Math.min(1, dt * 0.9));
      this.doorOff = G.lerp(this.doorOff, id === 'quiet' || id === 'bang' || id === 'hide' ? 0 : 1,
        Math.min(1, dt * 4));
      this.bell = Math.max(0, this.bell - dt * 0.7);
      this.hideP = G.lerp(this.hideP, this.hid ? 1 : 0, Math.min(1, dt * 3.4));
      this.white = Math.max(0, this.white - dt * 0.9);
      if (this.doorKick > 0) this.doorKick = Math.min(1, this.doorKick + dt * 0.85);
      for (const s of this.shards) s.t += dt;

      // where she is. She goes round the counter to meet them, which is
      // the whole point of her.
      const backNow = id !== 'quiet' && id !== 'bang' && (id !== 'hide' || this.hid);
      const k = Math.min(1, dt * 2.6);
      if (id === 'white' || id === 'gone' || id === 'out') {
        // she is not anywhere any more
      } else if (backNow) {
        this.her.x = G.lerp(this.her.x, POST.tracy, k);
        this.her.y = G.lerp(this.her.y, BACK_Y, k);
        this.her.sc = G.lerp(this.her.sc, 1.35, k);
      }

      // them, walking in
      if (this.bots) {
        this.bots.pol = G.lerp(this.bots.pol, POST.pol, Math.min(1, dt * 1.7));
        this.bots.war = G.lerp(this.bots.war, POST.war, Math.min(1, dt * 1.5));
      }

      // three bangs on the door, then the knock stops being a knock
      if (id === 'bang') {
        const n = Math.floor(this.beatT / 0.75);
        if (n !== this.lastBang && n < 3) {
          this.lastBang = n;
          this.bell = 1; G.audio.sfx('clack'); G.shake(2.4, 0.22);
        }
      }

      // HIDE waits for you, and then stops waiting. Nobody is going to
      // sit in this room being told to hide for a minute and a half.
      if (id === 'hide' && !this.hid) {
        this.nagT += dt;
        if (this.nagT > 13) { this.goHide(); G.floatText('SHE PUTS YOU THERE', 160, 60, P.warn); }
        return;
      }
      if (b.d > 0 && this.beatT > b.d) this.nextBeat();
    },

    // ---------------- draw ----------------
    draw(g) {
      const t = this.t;
      G.toastY = -40;
      const raid = this.act === 'raid';
      const b = raid ? this.beatOf() : null;
      const gone = raid && (b.id === 'white' || b.id === 'gone' || b.id === 'out');

      G.tracyRoom(g, t, {
        dark: raid ? this.dark : 0,
        wrecked: raid ? this.wreck : 0,
        doorOff: raid ? this.doorOff : 0,
        bell: raid ? this.bell : 0,
        surf: this.surf,
        flav: this.flav,
        motes: this.motes,
        noCat: raid && (b.id === 'door' || b.id === 'in' || b.id === 'her' || b.id === 'white'),
        catUp: raid && (b.id === 'gone' || b.id === 'out'),
        // anybody standing on the back plane goes in here, so the counter
        // hides their feet the way a counter does
        back: (gg) => {
          if (!raid) return;
          if (this.bots) {
            G.drawBot(gg, 'warden', this.bots.war, BACK_Y, 1.05,
              { t, open: 0.05, mood: 'angry', walk: t * 3, noBlink: 1,
                clip: Math.abs(this.bots.war - POST.war) > 2 ? 'walk' : 'idle', ct: t, dir: 1 });
            G.drawBot(gg, 'police', this.bots.pol, BACK_Y, 1.15,
              { t, open: 0.07, mood: 'angry', walk: t * 3, noBlink: 1,
                clip: Math.abs(this.bots.pol - POST.pol) > 2 ? 'walk'
                  : b.id === 'her' ? 'point' : 'idle', ct: t, p: 1, dir: 1 });
            // a torch each, sweeping the room
            for (const bx of [this.bots.pol, this.bots.war]) {
              const sw2 = Math.sin(t * 2.2 + bx) * 22;
              gg.globalAlpha = 0.09;
              for (let i = 0; i < 24; i++)
                G.Rh(gg, bx + 10 + i * 4, 70 + sw2 * (i / 24) + i * 0.3, 5, 2 + i * 0.5, '#cfe4ff');
              gg.globalAlpha = 1;
            }
          }
          if (!gone) this.drawHer(gg, t, true);
        },
      });

      // ---- her cardigan, over the counter where she was stood ----
      // It was on the back-plane floor, which is exactly what the counter
      // is drawn to hide. It is the only thing left of her in the room, so
      // it goes on top of the counter, with a sleeve hanging down the front.
      if (gone) {
        const cx = POST.tracy;
        // it belongs to the dark room, so it is dimmed with everything
        // else -- at full brightness it read as a prop somebody had put
        // there rather than as something dropped
        const D = (c) => G.mix(c, '#0e1018', 0.3);
        const rose = D('#c8785a'), roseDk = D('#a85a42'), roseLt = D('#e0947a');
        // A HEAP, not a shape. Two rounded rectangles with three buttons on
        // read as a stool; wool that has fallen off a person has an
        // irregular edge, so the profile is built row by row with a bit of
        // noise in the width and the rows show through as knit.
        // BOTTOM HEAVY. The first pass put the widest row two thirds of
        // the way up, which is a mushroom cap; cloth that has dropped is
        // fattest where it hit and tapers as it folds over itself.
        const rows = 7;
        for (let j = 0; j < rows; j++) {
          const q = j / (rows - 1);
          const w = (16 - q * 9) * (0.86 + G.hash(j * 3.1, 7) * 0.26);
          const yy = CNT_Y - 1 - j * 1.5;
          const off = (G.hash(j, 11) - 0.5) * 4;
          G.Rh(g, cx - w + off, yy, w * 2, 2, j === 0 ? roseDk : rose);
          G.hair(g, cx - w + off + 1, yy, w * 2 - 2, j % 2 ? roseLt : roseDk);
        }
        // the collar, folded back on itself
        G.Rh(g, cx - 6, CNT_Y - 11.5, 13, 3, roseLt);
        G.Rh(g, cx - 4, CNT_Y - 11, 9, 1.5, rose);
        // two sleeves: one flung along the counter, one over the front lip.
        // Each ends in a cuff, or a tapering run of pixels is just a tail.
        for (let k = 0; k < 9; k++)
          G.Rh(g, cx + 13 + k, CNT_Y - 4 + Math.sin(k * 0.4) * 1.5, 1.5, 4 - k * 0.24, rose);
        G.Rh(g, cx + 21, CNT_Y - 3, 4, 3, roseLt);
        G.hair(g, cx + 21, CNT_Y - 3, 4, D('#f2c8a8'));
        for (let k = 0; k < 8; k++)
          G.Rh(g, cx - 15 - k * 0.4, CNT_Y - 1 + k, 4 - k * 0.16, 1, rose);
        G.Rh(g, cx - 19, CNT_Y + 6, 4, 3, roseLt);
        // the buttons she chose in 1994
        for (let i = 0; i < 3; i++) G.Rq(g, cx - 8 + i * 7, CNT_Y - 5 - i * 1.5, 2, 2, D('#f6e8d4'));
        // AND HER GLASSES, beside it. Nothing else in the room says as
        // plainly that a person was standing here a second ago.
        // Two rings and a soft wash turned into a puddle at this raster.
        // Glasses this small have to be drawn as glasses are drawn on a
        // sign: two hard rectangles, a bridge between them, one arm out.
        const gx2 = cx - 32, gy2 = CNT_Y - 5;
        const wire = D('#9aa6b8'), lens = D('#5c6a7e');
        for (const sd of [0, 8]) {
          G.Rh(g, gx2 + sd, gy2, 6, 5, wire);
          G.Rh(g, gx2 + sd + 1, gy2 + 1, 4, 3, lens);
          G.hairq(g, gx2 + sd + 1, gy2 + 1, 4, D('#d8e4f0'));
        }
        G.Rh(g, gx2 + 6, gy2 + 1.5, 2, 1, wire);
        for (let k = 0; k < 6; k++)                     // one arm, folded out
          G.Rq(g, gx2 + 14 + k, gy2 + 1 + k * 0.5, 1, 1, wire);
      }

      // the door leaf, coming into the room
      // and it is gone once it is down behind the counter
      if (raid && this.doorKick > 0 && this.doorKick < 0.97) this.drawKick(g, t);

      // ===== the cone stand, and whatever is on it =====
      if (!raid || this.wreck < 0.5) {
        G.cone(g, CONE_X, CNT_Y - 4, { w: 15, h: 20 });
        if (this.build) {
          let cy2 = CNT_Y - 32;
          for (let i = 0; i < this.build.scoops.length; i++) {
            G.gooScoop(g, CONE_X, cy2, 10 - i, this.flav, { t, wob: this.build.scoops[i].wob });
            cy2 -= 12;
          }
        }
      }

      // ===== clause's face on the tablet =====
      const tx = TAB.x + 15, ty = (raid && this.wreck > 0.6 ? TAB.y + 14 : TAB.y) + 12;
      G.starburst(g, tx, ty, 7, t, { talk: this.clauseT > 0 || (raid && b.id === 'out') });

      // ===== her, on the near side, while there is still a lesson on =====
      if (!raid) this.drawTracy(g, t);

      // ===== held things =====
      const h = this.hold;
      if (h && h.kind === 'sweep') {
        // the scoop in your hand, digging
        G.Rh(g, G.mouse.x - 6, G.mouse.y - 4, 12, 8, '#8a94a8');
        G.bevel(g, G.mouse.x - 6, G.mouse.y - 4, 12, 8, '#d8e4f0', '#4a5670');
        const f = G.clamp(h.fill, 0, 1);
        if (f > 0.1) G.gooScoop(g, G.mouse.x, G.mouse.y - 2, 3 + f * 7, this.flav, { t });
        G.Rh(g, G.mouse.x + 5, G.mouse.y + 3, 3, 12, '#6b5a3a');
      } else if (h && h.kind === 'ball') {
        G.gooScoop(g, h.bx, h.by, 10, this.flav, { t, wob: h.wob });
        G.Rh(g, h.bx + 5, h.by + 6, 3, 12, '#6b5a3a');
      }
      for (const p2 of this.parts) {
        g.globalAlpha = Math.max(0, 1 - p2.t / p2.life);
        G.Rh(g, p2.x, p2.y, 2, 2, p2.col);
        g.globalAlpha = 1;
      }

      if (raid) {
        this.drawHideMark(g, t);
        this.drawUnder(g, t);
        this.drawRaidTalk(g, t);
        if (this.white > 0.02) {
          g.globalAlpha = Math.min(1, this.white * 1.4);
          G.R(g, 0, 0, G.W, G.H, '#eef4ff');
          g.globalAlpha = 1;
        }
      } else {
        this.drawTalk(g, t);
      }
      G.grade(g, 1);
    },

    // ---- the door, off its hinges, going across the room ----
    drawKick(g, t) {
      // It used to rotate 1.5 radians about its own foot and translate 92
      // units LEFT, which parked the leaf up in the top corner of the room
      // and left it hanging there, in mid-air, for the rest of the scene.
      // It swings past horizontal and goes DOWN now, behind the counter,
      // and the draw is culled the moment it has landed.
      const p = G.easeOut(this.doorKick);
      const D = DOOR;
      g.save();
      g.translate(D.x + 4, D.y + D.h);
      g.rotate(p * 1.95);
      g.translate(-(D.x + 4) + p * 40, -(D.y + D.h) + p * 34);
      G.R(g, D.x, D.y, D.w, D.h, '#c8a884');
      G.bevel(g, D.x, D.y, D.w, D.h, '#e8dcc6', '#8a6a48');
      G.R(g, D.x + 4, D.y + 5, D.w - 8, 22, '#5c6a7a');
      for (let i = 0; i < 2; i++)
        G.R(g, D.x + 5, D.y + 32 + i * 20, D.w - 10, 16, '#b09070');
      g.restore();
      // and the glass it was carrying
      for (const s of this.shards) {
        const q = Math.min(1, s.t * 1.5);
        if (q >= 1) continue;
        const sx = D.x + D.w / 2 + Math.cos(s.a) * s.sp * q;
        const sy = D.y + 30 + Math.sin(s.a) * s.sp * q * 0.5 + q * q * 90;
        G.Rh(g, sx, sy, 2, 3, s.col);
        G.Rq(g, sx, sy, 1, 1, '#ffffff');
      }
    },

    // ---- WHERE TO GO. The one interactive beat in the whole break-in,
    // so it gets the loudest mark the game owns. ----
    drawHideMark(g, t) {
      if (this.beatOf().id !== 'hide' || this.hid) return;
      G.hot(g, HIDE.x, HIDE.y, HIDE.w, HIDE.h, 'GET UNDER HERE', { pad: 4, pipY: HIDE.y - 12 });
      for (let k = 0; k < 2; k++) {
        const q = ((t * 0.8 + k * 0.5) % 1);
        g.globalAlpha = (1 - q) * 0.7;
        G.oc(g, HIDE.x + HIDE.w / 2, HIDE.y + HIDE.h / 2, 22 + q * 22, P.lime);
        g.globalAlpha = 1;
      }
    },

    // ---- and once you are in it ----
    drawUnder(g, t) {
      const p = G.easeOut(this.hideP);
      if (p < 0.02) return;
      const y0 = Math.round(G.lerp(182, 130, p));
      // You, down in the dark, with your head clearing the edge. footY was
      // y0 + 59, which left about four units of skull above the lip - at
      // this raster that is a cream smudge, and the whole point of the shot
      // is that you can see yourself watching.
      G.drawBot(g, 'player', PEEK_X, y0 + 46, 1.25,
        { t, open: 0.06, mood: 'sick', walk: 0, noBlink: 1, clip: 'slump', ct: t, p: 1 });
      // the near edge of the counter, and the underside of it
      G.plate(g, -4, y0, G.W + 8, 6, '#8a7258', { r: 1, band: 2, grain: 3 });
      G.hair(g, -4, y0, G.W + 8, '#d8c4a0');
      G.R(g, -4, y0 + 6, G.W + 8, G.H - y0 - 6, '#150f0c');
      for (let i = 0; i < 24; i++)
        G.R(g, -4 + i * 14, y0 + 6, 7, G.H - y0 - 6, i % 2 ? '#241d18' : '#1b1613');
      G.grain(g, 0, y0 + 6, G.W, G.H - y0 - 6, '#0c0908', 0.1, 4);
      // and the whole room goes quiet and dark around the gap you are in
      g.globalAlpha = 0.4 * p;
      G.R(g, 0, 0, G.W, y0, '#05070c');
      g.globalAlpha = 1;
      for (let i = 0; i < 5; i++) {                  // a hard vignette closing in
        g.globalAlpha = 0.11 * p;
        G.R(g, 0, 0, G.W, 3 + i * 3, '#000000');
        G.R(g, 0, 0, 3 + i * 3, y0, '#000000');
        G.R(g, G.W - 3 - i * 3, 0, 3 + i * 3, y0, '#000000');
        g.globalAlpha = 1;
      }
    },

    // ---- her ----
    drawTracy(g, t) {
      const x = TRACY_X, fy = TRACY_Y;
      const eat = this.eatT > 0;
      const wants = this.build && this.build.scoops.length && !eat;
      // one model, the same one the cutscenes use
      const clip = eat ? 'take' : wants ? 'reach' : this.talking() ? 'talk' : 'idle';
      // Her room is a close-up: the counter top is 42 screen units off
      // her floor, so at 1.9 that counter is waist high on her, which is
      // what a counter is.
      const r = G.drawTracy(g, x, fy, 1.9, {
        t, clip, ct: t, dir: -1, smile: this.step >= 5 || eat,
        p: eat ? G.clamp(this.eatT / 1.2, 0, 1) : 1,
      });
      // the cone in her hand while she eats it
      if (eat && r.hand) {
        const left = Math.max(0, 1 - this.eatT / 2.6);
        G.cone(g, r.hand.x, r.hand.y + 8, { w: 10, h: 13 });
        if (left > 0.1) G.gooScoop(g, r.hand.x, r.hand.y - 2, 4 + left * 5, this.flav, { t });
      }
      if (this.clap > 0.2) {
        g.globalAlpha = this.clap;
        for (let i = 0; i < 6; i++) {
          const a2 = t * 4 + i;
          G.Rh(g, x + Math.cos(a2) * 24, r.headTop + 6 + Math.sin(a2) * 16, 1.5, 1.5, '#ffd47a');
        }
        g.globalAlpha = 1;
      }
    },
    // her, during the raid: same model, moving between two planes
    drawHer(g, t, back) {
      const b = this.beatOf();
      const talking = this.beatT * 34 < ((b.who === 'TRACY' && b.say) ? b.say.length : 0);
      const clip = b.id === 'her' ? 'reach' : b.id === 'hide' ? 'point'
        : talking ? 'talk' : b.id === 'bang' ? 'startle' : 'idle';
      G.drawTracy(g, this.her.x, this.her.y, this.her.sc, {
        t, clip, ct: t, dir: b.id === 'quiet' ? -1 : -1,
        smile: b.id === 'quiet', p: 1,
      });
    },

    // she is mid-line while her card is still typing itself out
    talking() {
      const st = this.cur();
      return this.stepT * 34 < st.say.length;
    },

    // ---- what she is saying, and what you have to do ----
    drawTalk(g, t) {
      const st = this.cur();
      // her line, in a warm speech card - AT FULL SIZE, because it is
      // the only thing in the room actually talking to you
      const bw = 226, bx = 8, by = 142;
      G.plate(g, bx, by, bw, 34, '#2e1f16',
        { r: 2, band: 2, lit: '#432d20', dk: '#170f0a', spec: false });
      G.R(g, bx + 2, by + 2, bw - 4, 1, '#c8783a');
      const nw = G.tw('TRACY', 0.5) + 8;
      G.R(g, bx + 4, by - 8, nw, 9, '#c8783a');
      G.text(g, 'TRACY', bx + 8, by - 6, '#1a1418', { sc: 0.5 });
      const shown = Math.floor(this.stepT * 34);
      const said = st.say.slice(0, shown);
      const lines = G.wrap(said, bw - 16, 1);
      for (let i = 0; i < Math.min(3, lines.length); i++)
        G.text(g, lines[i], bx + 8, by + 6 + i * 10, '#f6e8d4');
      if (shown < st.say.length && Math.sin(t * 18) > 0)
        G.text(g, '_', bx + 8 + G.tw(lines[Math.min(2, lines.length - 1)] || '', 1) + 1,
          by + 6 + Math.min(2, Math.max(0, lines.length - 1)) * 10, '#f6e8d4');
      // what to do, if anything
      if (st.hint && this.stepT > 0.9) {
        const fl = Math.sin(t * 4) > 0;
        const hl = G.wrap(st.hint, 68, 0.5);
        G.plate(g, 240, 142, 76, 34, '#1a2418', { r: 2, band: 2, spec: false });
        G.R(g, 242, 144, 72, 1, P.lime);
        G.text(g, 'DO THIS', 244, 146, '#6b8a4a', { sc: 0.5 });
        for (let i = 0; i < hl.length; i++)
          G.text(g, hl[i], 244, 155 + i * 7, fl ? '#dfffcf' : '#8ab06a', { sc: 0.5 });
      } else if (!st.need && this.stepT > 0.8) {
        G.text(g, st.id === 'done' ? 'TAP TO GO ON' : 'TAP', 278, 158,
          Math.sin(t * 4) > 0 ? '#c8a884' : '#6b5240', { align: 'center', sc: 0.5 });
      }
      // clause's own line, if you poked the tablet
      if (this.clauseT > 0) {
        g.globalAlpha = Math.min(1, this.clauseT);
        G.plate(g, 120, 56, 132, 14, '#191016', { r: 1, band: 1, spec: false });
        G.R(g, 122, 58, 128, 1, '#d97757');
        G.text(g, this.clauseSay.slice(0, 42), 124, 60, '#f0d8c8', { sc: 0.5 });
        g.globalAlpha = 1;
      }
      // a step counter, so it feels like a lesson with an end
      for (let i = 0; i < STEPS.length; i++)
        G.Rh(g, 118 + i * 6, 136, 4, 3, i < this.step ? '#c8783a' : i === this.step ? '#ffd47a' : '#3a2a22');
    },

    // ---- and what gets said while the room comes apart ----
    drawRaidTalk(g, t) {
      const b = this.beatOf();
      // the beats with nothing said still get a caption, because silence
      // with nothing on screen to read is just a pause
      const NARR = { bang: 'SOMEBODY IS KNOCKING. IT IS FOUR IN THE MORNING.',
                     door: null, white: null,
                     gone: 'THEY DID NOT ARREST ANYONE.',
                     out: 'THE TABLET WAS STILL WARM.' };
      const say = b.say || NARR[b.id];
      if (!say) return;
      const who = b.say ? b.who : null;
      const col = b.col || '#c8783a';
      const bw = 300, bx = 10, by = 146;
      g.globalAlpha = 0.92;
      G.R(g, bx, by, bw, 26, who ? '#2e1f16' : '#0d1018');
      g.globalAlpha = 1;
      G.bevelq(g, bx, by, bw, 26, '#4a3628', '#0a0806');
      if (who) {
        const nw = G.tw(who, 0.5) + 8;
        G.R(g, bx + 4, by - 8, nw, 9, col);
        G.text(g, who, bx + 8, by - 6, '#1a1418', { sc: 0.5 });
      } else G.R(g, bx, by, 3, 26, '#d97757');
      const shown = Math.floor(this.beatT * 34);
      const lines = G.wrap(say.slice(0, shown), bw - 16, 1);
      for (let i = 0; i < Math.min(2, lines.length); i++)
        G.text(g, lines[i], bx + 8, by + 5 + i * 10, who ? '#f6e8d4' : P.cream);
      if (b.id === 'out' && this.beatT > 1.2)
        G.text(g, 'TAP', G.W - 12, by + 15, Math.sin(t * 4) > 0 ? '#c8a884' : '#5a4638',
          { align: 'right', sc: 0.5 });
    },
  };
})();

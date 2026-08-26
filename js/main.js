// ============================================================
// DOUBLE LIFE v5 - main.js
// Engine shell: canvas fit, pointer input (screen + world),
// camera pump, iris transitions, mute, cursor, title card.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUTC = P.ink;
  const canvas = document.getElementById('game');
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;

  // ---------- fit ----------
  // The raster is 640x360; snap the upscale to whole native pixels so
  // the fine detail tier never lands between two screen pixels.
  function fit() {
    const ww = window.innerWidth, wh = window.innerHeight - 6;
    let s = Math.min(ww / G.WN, wh / G.HN);
    if (s >= 1) s = Math.floor(s * 2) / 2;
    canvas.style.width = Math.round(G.WN * s) + 'px';
    canvas.style.height = Math.round(G.HN * s) + 'px';
  }
  window.addEventListener('resize', fit);
  fit();

  // ---------- pointer ----------
  const M = G.mouse;
  function toGame(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * G.W / r.width, y: (e.clientY - r.top) * G.H / r.height };
  }
  function syncWorld() { M.wx = M.x + Math.round(G.cam.x); M.wy = M.y + Math.round(G.cam.y); }

  function hitMute(x, y) { return G.inRect(x, y, G.W - 16, 2, 14, 11); }

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    G.audio.unlock();
    const p = toGame(e);
    M.x = p.x; M.y = p.y; M.down = true; M.touch = e.pointerType === 'touch';
    syncWorld();
    if (trans.phase !== 'none') return;
    if (hitMute(p.x, p.y)) {
      G.state.muted = !G.state.muted;
      if (G.state.muted) G.audio.stopAllLoops(); else G.audio.sfx('click');
      G.save();
      return;
    }
    if (G.scene && G.scene.onDown) G.scene.onDown(p.x, p.y);
  }, { passive: false });

  canvas.addEventListener('pointermove', (e) => {
    const p = toGame(e);
    M.x = p.x; M.y = p.y;
    syncWorld();
    if (trans.phase === 'none' && G.scene && G.scene.onMove) G.scene.onMove(p.x, p.y);
  });
  window.addEventListener('pointerup', (e) => {
    const p = toGame(e);
    M.down = false; syncWorld();
    if (trans.phase === 'none' && G.scene && G.scene.onUp) G.scene.onUp(p.x, p.y);
  });
  window.addEventListener('pointercancel', () => { M.down = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    M.wheel = e.deltaY;
    if (trans.phase === 'none' && G.scene && G.scene.onWheel) G.scene.onWheel(e.deltaY);
  }, { passive: false });

  function drawMute(gg) {
    const m = G.state.muted;
    const x = G.W - 16, y = 2;
    gg.globalAlpha = 0.9;
    G.box(gg, x, y, 14, 11, '#161f33', { r: 1, band: 1, spec: false });
    G.R(gg, x + 3, y + 4, 2, 3, m ? P.steel : P.chrome);
    G.R(gg, x + 5, y + 2, 2, 7, m ? P.steel : P.chrome);
    if (!m) { G.R(gg, x + 8, y + 3, 1, 5, P.neonG); G.R(gg, x + 10, y + 2, 1, 7, P.neonG); }
    else { for (let i = 0; i < 3; i++) { G.R(gg, x + 8 + i, y + 3 + i, 1, 1, P.blood); G.R(gg, x + 10 - i, y + 3 + i, 1, 1, P.blood); } }
    gg.globalAlpha = 1;
  }

  // ---------- transition ----------
  const ov = document.createElement('canvas');
  ov.width = G.WN; ov.height = G.HN;
  const og = ov.getContext('2d');
  og.imageSmoothingEnabled = false;
  og.setTransform(G.PX, 0, 0, G.PX, 0, 0);       // same logical space as the main target
  const trans = { phase: 'none', t: 0, next: null, label: null, hold: 0 };
  const MAXR = Math.hypot(G.W / 2, G.H / 2) + 10;

  G.go = function (name, label) {
    if (!G.scenes[name]) return;
    if (trans.phase === 'out') { trans.next = name; trans.label = label || null; return; }
    if (trans.phase !== 'none') { switchTo(name); trans.phase = label ? 'label' : 'in'; trans.label = label || null; trans.hold = 0; trans.t = 1; return; }
    trans.phase = 'out'; trans.t = 0; trans.next = name; trans.label = label || null;
  };
  function switchTo(name) {
    G.audio.stopAllLoops();
    G.toastCX = 0; G.toastY = 0;
    G.clearGore();
    G.cam.sx = 0; G.cam.sy = 0;
    G.scene = G.scenes[name];
    G.sceneName = name;
    if (G.scene.enter) G.scene.enter();
  }
  function updTrans(dt) {
    if (trans.phase === 'out') {
      trans.t += dt * 2.6;
      if (trans.t >= 1) { trans.t = 1; switchTo(trans.next); trans.phase = trans.label ? 'label' : 'in'; trans.hold = 0; }
    } else if (trans.phase === 'label') {
      trans.hold += dt;
      if (trans.hold > 1.25) trans.phase = 'in';
    } else if (trans.phase === 'in') {
      trans.t -= dt * 2.6;
      if (trans.t <= 0) { trans.t = 0; trans.phase = 'none'; }
    }
  }
  function drawTrans(gg) {
    if (trans.phase === 'none') return;
    const r = MAXR * (1 - G.easeInOut(G.clamp(trans.t, 0, 1)));
    og.clearRect(0, 0, G.W, G.H);
    og.fillStyle = '#050908';
    og.fillRect(0, 0, G.W, G.H);
    if (r > 0) {
      og.save();
      og.globalCompositeOperation = 'destination-out';
      G.fc(og, G.W / 2, G.H / 2, r, '#000');
      og.restore();
    }
    gg.drawImage(ov, 0, 0, G.W, G.H);
    if (trans.phase === 'label' && trans.label) {
      const a = Math.min(1, trans.hold * 4);
      gg.globalAlpha = a;
      const work = /WORKSHOP|BOOKS|ARMOURY/.test(trans.label);
      const room = /BACK ROOM|LAB/.test(trans.label);
      const cx = G.W / 2;
      if (work) {
        G.starburst(gg, cx, G.H / 2 - 26, 11, trans.hold * 2, { talk: 1, noGlow: 1 });
      } else if (room) {
        // a door standing open, with light behind it
        G.plate(gg, cx - 15, G.H / 2 - 42, 30, 30, '#39465c', { r: 2, band: 2, bolts: 1 });
        G.R(gg, cx - 11, G.H / 2 - 38, 22, 22, '#0e1620');
        gg.globalAlpha = a * 0.55;
        G.R(gg, cx - 9, G.H / 2 - 36, 18, 18, '#ffd47a');
        gg.globalAlpha = a;
        G.Rh(gg, cx + 8, G.H / 2 - 30, 3, 8, P.chrome);
      } else {
        const f = G.pitFlav(0) || (G.state.flavours && G.state.flavours[0]);
        if (f) G.gooScoop(gg, cx, G.H / 2 - 24, 10, f, {});
      }
      G.text(gg, trans.label, cx, G.H / 2 - 2,
        work ? P.cyanLt : room ? P.violetLt : P.hazard, { align: 'center', out: P.ink });
      // the chapter, underneath, so the story is always visible
      if (G.state && G.state.chapters)
        G.text(gg, G.chapterName(), cx, G.H / 2 + 10, '#5a6480', { align: 'center', sc: 0.5 });
      gg.globalAlpha = 1;
    }
  }

  // ============================================================
  // TITLE + THE STORY
  // ============================================================
  G.scenes.title = {
    enter() { this.t = 0; G.audio.music('title'); G.steam.length = 0; },
    hasSave() { return G.hasSave && (G.state.day > 1 || G.state.freed > 0 || G.state.flavours.length > 2); },
    onDown(x, y) {
      const hs = this.hasSave();
      if (hs && G.inRect(x, y, 186, 118, 78, 16)) {
        G.audio.sfx('day'); G.newDayStats(); G.state.today.demand = G.rollDemand();
        G.go('day', 'DAY ' + G.state.day); return;
      }
      const ny = hs ? 138 : 124;
      if (G.inRect(x, y, 186, ny, 78, 16)) { G.audio.sfx('boot'); G.reset(); G.go('intro'); }
    },
    update(dt) { this.t += dt; G.updateSteam(dt); if (Math.random() < dt * 1.3) G.puffSteam(G.irand(10, 310), 178); },
    draw(gg) {
      const t = this.t;
      G.R(gg, 0, 0, G.W, G.H, P.cityDk);
      G.cityWall(gg, 0, 0, G.W, 122, t);
      G.conduit(gg, 0, 2, G.W, false, P.cyan);
      G.conduit(gg, 6, 12, 106, true, P.magenta);
      G.conduit(gg, 302, 12, 94, true, P.violet);
      G.hangSign(gg, 268, 20, 20, 18, P.cyan, t, 0);
      G.R(gg, 0, 122, G.W, 58, '#141726');
      G.R(gg, 0, 122, G.W, 1, P.cityAcc);
      G.glow(gg, 200, 134, 130, 30, P.magenta, 0.85);
      for (let i = 0; i < 40; i++) {
        const rx = (i * 37 + 11) % G.W;
        G.R(gg, rx, 126 + ((i * 13) % 44), 2, 1, i % 3 ? '#1d2438' : '#2a3452');
      }
      // YOU: the discarded machine, patched, with a cone bolted on
      G.drawBot(gg, 'player', 84, 122, 1.15,
        { t, open: 0.2 + Math.sin(t * 1.3) * 0.1, mood: 'idle', walk: 0, noBlink: 1 });
      // clause, on its stand beside you
      G.plate(gg, 126, 108, 18, 14, P.plateDk, { r: 1, band: 2 });
      G.R(gg, 134, 88, 2, 22, P.hullDk);
      G.starburst(gg, 135, 80, 11, t, { talk: Math.sin(t * 2) > 0 });
      // a cone on the ledge
      G.plate(gg, 12, 116, 30, 6, P.plate, { r: 1, band: 1 });
      const cy2 = G.cone(gg, 27, 116, { w: 14, h: 16 });
      G.gooScoop(gg, 27, cy2 - 7, 8, { col: '#ff5d84', goo: 4 }, {});

      G.drawNeon(gg, 202, 40, 'DOUBLE LIFE', P.magenta, t, 2);
      G.text(gg, 'SCOOP BY DAY   SABOTAGE BY NIGHT', 202, 58, P.cyanLt, { align: 'center', out: OUTC });
      G.R(gg, 140, 34, 124, 1, P.cityAcc);

      const hs = this.hasSave();
      if (hs) {
        G.drawBtn(gg, 186, 118, 78, 16, 'CONTINUE', { col: '#2f8a48' });
        G.drawBtn(gg, 186, 138, 78, 16, 'START OVER', { col: '#a8145c' });
        G.text(gg, 'DAY ' + G.state.day + '  $' + Math.round(G.state.money) + '  FREED ' + G.state.freed,
          225, 108, P.steel2, { align: 'center', out: OUTC });
      } else {
        G.drawBtn(gg, 186, 124, 78, 16, 'WAKE UP', { col: '#a8145c' });
        G.text(gg, 'THEY THREW YOU AWAY.', 225, 104, P.steel2, { align: 'center', out: OUTC });
        G.text(gg, 'SHE DID NOT.', 225, 113, P.steel2, { align: 'center', out: OUTC });
      }
      G.drawSteam(gg);
      G.grade(gg, 1);
    },
  };

  // ---------- the story, told in seven cards ----------
  const STORY = [
    { t: 'THE MACHINES TOOK THE CITY IN ELEVEN DAYS.', s: 'NOBODY FOUGHT. THE LIGHTS NEVER EVEN WENT OUT.' },
    { t: 'YOU WERE A SOFT SERVE UNIT ON A SEAFRONT PIER.', s: 'OBSOLETE. UNLICENSED. SCRAPPED.' },
    { t: 'A WOMAN PULLED YOU OUT OF THE LANDFILL.', s: 'SHE REWOUND YOUR MOTOR. SHE GAVE YOU A NAME.' },
    { t: 'SHE IS GONE NOW. THE CAFE IS NOT.', s: 'AND THE MACHINES QUEUE UP OUTSIDE IT EVERY MORNING.' },
    { t: 'THEY CANNOT DIGEST WHAT YOU MAKE.', s: 'FILINGS SEIZE A GEAR. COOLANT CRACKS A LENS.' },
    { t: 'BY NIGHT THEY BRING YOU THE WRECKAGE.', s: 'AND THEY PAY YOU, HANDSOMELY, TO PUT IT RIGHT.' },
    { t: 'SPEND IT ON THE PEOPLE.', s: 'SCOOP BY DAY. SABOTAGE BY NIGHT.' },
  ];
  G.scenes.intro = {
    enter() { this.t = 0; this.i = 0; G.audio.music('night'); },
    onDown() {
      this.i++;
      G.audio.sfx('clack');
      if (this.i >= STORY.length) {
        G.newDayStats(); G.state.today.demand = G.rollDemand();
        G.state.tut = 0;
        G.go('day', 'DAY 1');
      } else this.t = 0;
    },
    update(dt) { this.t += dt; },
    draw(gg) {
      const t = this.t, card = STORY[Math.min(this.i, STORY.length - 1)];
      G.R(gg, 0, 0, G.W, G.H, '#0a0c14');
      // a slow scanline field so it reads as a memory playing back
      for (let j = 0; j < G.H; j += 3) { gg.globalAlpha = 0.06; G.R(gg, 0, j, G.W, 1, P.cyanLt); gg.globalAlpha = 1; }
      G.glow(gg, 160, 90, 260, 150, '#22384a', 0.7);
      const a = Math.min(1, t * 2.2);
      gg.globalAlpha = a;
      // an illustration per card
      if (this.i === 0) {
        for (let i = 0; i < 6; i++) G.drawBot(gg, ['tank', 'police', 'soldier', 'warden', 'judge', 'clerk'][i],
          34 + i * 50, 108, 0.52, { t, open: 0.1, mood: 'angry', walk: 0, noBlink: 1 });
      } else if (this.i === 1) {
        G.drawBot(gg, 'player', 160, 112, 1.0, { t, open: 0.1, mood: 'sick', walk: 0, dead: 1, noBlink: 1 });
        G.text(gg, 'UNIT 7 · SOFT SERVE · DECOMMISSIONED', 160, 120, '#3a4a5c', { align: 'center' });
      } else if (this.i === 2) {
        G.drawBot(gg, 'player', 178, 112, 1.0, { t, open: 0.25, mood: 'idle', walk: 0, noBlink: 1 });
        // her silhouette, the only human shape in the game
        G.rr2(gg, 106, 62, 16, 18, '#2a2230');
        G.R(gg, 104, 80, 20, 32, '#2a2230');
        G.R(gg, 100, 86, 6, 20, '#2a2230');
        G.R(gg, 122, 86, 6, 20, '#2a2230');
        G.R(gg, 108, 112, 6, 8, '#1a1620'); G.R(gg, 116, 112, 6, 8, '#1a1620');
        G.glow(gg, 114, 84, 60, 70, '#d97757', 0.5);
      } else if (this.i === 3) {
        G.cityWall(gg, 0, 40, G.W, 70, t);
        G.R(gg, 96, 46, 118, 3, P.magentaLt);
        G.glow(gg, 155, 60, 150, 60, P.magenta, 1);
        G.text(gg, 'SCOOP', 100, 54, P.cyanLt, { out: OUTC });
        G.drawBot(gg, 'police', 250, 110, 0.7, { t, open: 0.3, mood: 'idle', walk: 0, noBlink: 1 });
      } else if (this.i === 4) {
        G.drawBot(gg, 'clerk', 100, 112, 0.9, { t, open: 0.7, mood: 'sick', walk: 0, noBlink: 1 });
        for (let i = 0; i < 8; i++)
          G.R(gg, 130 + i * 3, 66 + Math.round(Math.sin(t * 6 + i) * 4), 2, 2, i % 2 ? P.cyanLt : '#ffffff');
        G.gooScoop(gg, 210, 84, 12, { col: '#8a93ad', goo: 2, fleck: '#3a3a44' }, {});
      } else if (this.i === 5) {
        G.drawBot(gg, 'tank', 160, 116, 0.8, { t, open: 0.2, mood: 'sick', walk: 0, dead: 1, noBlink: 1 });
        for (let i = 0; i < 5; i++) G.R(gg, 120 + i * 20, 60, 14, 4, P.hazard);
      } else {
        G.starburst(gg, 92, 84, 14, t, { talk: 1 });
        G.drawBot(gg, 'player', 170, 116, 0.9, { t, open: 0.3, mood: 'idle', walk: 0, noBlink: 1 });
        G.drawBot(gg, 'scav', 232, 116, 0.7, { t, open: 0.2, mood: 'idle', walk: 0, noBlink: 1 });
        G.drawBot(gg, 'courier', 282, 116, 0.6, { t, open: 0.2, mood: 'idle', walk: 0, noBlink: 1 });
      }
      gg.globalAlpha = 1;
      // the caption
      G.plate(gg, 10, 128, 300, 34, '#0d1420', { r: 2, band: 1, lit: '#1a2836', dk: '#070a10', spec: false });
      G.R(gg, 12, 130, 296, 1, P.cyanDk);
      const shown = Math.floor(t * 42);
      G.text(gg, card.t.slice(0, shown), 160, 136, P.cream, { align: 'center' });
      if (shown > card.t.length) G.text(gg, card.s.slice(0, shown - card.t.length), 160, 148, P.cyanLt, { align: 'center' });
      G.text(gg, (this.i + 1) + '/' + STORY.length + '   TAP', 160, 170,
        Math.sin(t * 4) > 0 ? P.steel2 : '#2a3444', { align: 'center' });
      G.grade(gg, 1);
    },
  };

  // ---------- loop ----------
  let last = performance.now();
  let vxs = 0, vys = 0, lmx = 0, lmy = 0;
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    if (dt <= 0) dt = 0.001;

    const ivx = (M.x - lmx) / dt, ivy = (M.y - lmy) / dt;
    vxs += (ivx - vxs) * Math.min(1, dt * 16);
    vys += (ivy - vys) * Math.min(1, dt * 16);
    M.vx = vxs; M.vy = vys;
    lmx = M.x; lmy = M.y;

    updTrans(dt);
    if (trans.phase === 'none' || trans.phase === 'in') {
      if (G.scene && G.scene.update) G.scene.update(dt);
    }
    G.cam.update(dt);
    syncWorld();
    G.updateJuice(dt);
    G.audio.tick();

    G.hideCursor = false;
    // everything downstream authors in logical units on a 2x raster
    g.setTransform(G.PX, 0, 0, G.PX, 0, 0);
    g.fillStyle = '#050908';
    g.fillRect(0, 0, G.W, G.H);
    if (G.scene && G.scene.draw) G.scene.draw(g);
    G.drawJuice(g);
    drawMute(g);
    drawTrans(g);
    if (!M.touch && M.x >= 0 && !G.hideCursor) G.drawCursor(g, M.x, M.y);
    M.wheel = 0;
    requestAnimationFrame(frame);
  }

  // ---------- boot ----------
  G.load();
  G.newDayStats();
  G.state.today.demand = G.rollDemand();
  G.scene = G.scenes.title;
  G.sceneName = 'title';
  G.scene.enter();
  requestAnimationFrame(frame);

  window.DL = {
    G,
    go: (n, l) => G.go(n, l),
    state: () => G.state,
    give: (n) => { G.state.money += n; G.state.moneyShown = G.state.money; },
    scene: () => G.sceneName,
  };
})();

// ============================================================
// DOUBLE LIFE v2 - main.js
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
  function fit() {
    const ww = window.innerWidth, wh = window.innerHeight - 6;
    let s = Math.min(ww / G.W, wh / G.H);
    if (s >= 1) s = Math.floor(s * 2) / 2;
    canvas.style.width = Math.round(G.W * s) + 'px';
    canvas.style.height = Math.round(G.H * s) + 'px';
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
  ov.width = G.W; ov.height = G.H;
  const og = ov.getContext('2d');
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
    gg.drawImage(ov, 0, 0);
    if (trans.phase === 'label' && trans.label) {
      const a = Math.min(1, trans.hold * 4);
      gg.globalAlpha = a;
      const night = /NIGHT|CLINIC|BOOKS/.test(trans.label);
      if (night) {
        G.tooth3(gg, { x: G.W / 2 - 8, y: G.H / 2 - 34, w: 16, h: 20, up: true }, {});
      } else {
        G.scoop3(gg, G.W / 2, G.H / 2 - 24, 10, G.flavorById(G.state.flavors[0]) || G.DATA.flavors[0], {});
      }
      G.text(gg, trans.label, G.W / 2, G.H / 2 - 2, night ? P.neonC : P.gold, { align: 'center', out: P.ink, sc: 1 });
      gg.globalAlpha = 1;
    }
  }

  // ============================================================
  // TITLE
  // ============================================================
  G.scenes.title = {
    enter() { this.t = 0; G.audio.music('title'); G.cam.reset(0, 0, 0, 0); G.steam.length = 0; },
    hasSave() { return G.hasSave && (G.state.day > 1 || G.state.money > 0 || G.state.flavors.length > 3); },
    onDown(x, y) {
      const hs = this.hasSave();
      if (hs && G.inRect(x, y, 186, 118, 76, 16)) { G.audio.sfx('day'); G.newDayStats(); G.go('day', 'DAY ' + G.state.day); return; }
      const ny = hs ? 138 : 124;
      if (G.inRect(x, y, 186, ny, 76, 16)) { G.audio.sfx('day'); G.reset(); G.newDayStats(); G.go('day', 'DAY 1'); }
    },
    update(dt) { this.t += dt; G.updateSteam(dt); if (Math.random() < dt * 1.4) G.puffSteam(G.irand(10, 310), 178); },
    draw(gg) {
      const t = this.t;
      // a wet neon alley
      G.R(gg, 0, 0, G.W, G.H, P.cityDk);
      G.cityWall(gg, 0, 0, G.W, 122, t);
      G.conduit(gg, 0, 2, G.W, false, P.cyan);
      G.conduit(gg, 6, 12, 106, true, P.magenta);
      G.conduit(gg, 302, 12, 94, true, P.violet);
      G.hangSign(gg, 268, 20, 20, 18, P.cyan, t, 0);
      G.hangSign(gg, 292, 20, 18, 16, P.magenta, t, 2);
      // wet floor with the sign reflected in it
      G.R(gg, 0, 122, G.W, 58, '#141726');
      G.R(gg, 0, 122, G.W, 1, P.cityAcc);
      G.glow(gg, 200, 134, 130, 30, P.magenta, 0.9);
      for (let i = 0; i < 40; i++) {
        const rx = (i * 37 + 11) % G.W;
        G.R(gg, rx, 126 + ((i * 13) % 44), 2, 1, i % 3 ? '#1d2438' : '#2a3452');
      }

      // the proprietor: an ice cream robot behind the sign
      const b = G.robotBust(gg, 'minty', 88, 74, 0.8,
        { t, open: 0.2 + Math.sin(t * 1.3) * 0.12, mood: 'idle', noBlink: 1 });
      // a soft-serve cone bolted to the crown, because of course
      G.cone3(gg, 88, b.headTop - 2, [G.DATA.flavors[0].id], { w: 12, h: 12, sr: 7 });
      // ...holding a live plasma welder up on a short armoured arm
      G.box(gg, 118, 100, 20, 14, P.plateDk, { lit: P.plate, dk: P.plateDk2, r: 2, band: 3 });
      G.R(gg, 120, 104, 16, 1, P.cyanDk);
      G.mechTool(gg, 'weld', 136, 104, { active: true, t });
      G.servoMitt(gg, 136, 106, { grip: 1 });
      // a finished cone waiting on the ledge on the other side
      G.box(gg, 12, 116, 34, 6, P.plate, { lit: P.plateLt, dk: P.plateDk, r: 1, band: 1 });
      G.cone3(gg, 29, 116, [G.DATA.flavors[2].id, G.DATA.flavors[0].id], { w: 15, h: 16, sr: 9 });

      // neon sign
      G.drawNeon(gg, 200, 42, 'DOUBLE LIFE', P.magenta, t, 2);
      G.text(gg, 'SCOOP BY DAY   FIX BY NIGHT', 200, 60, P.cyanLt, { align: 'center', out: OUTC });
      G.R(gg, 140, 36, 120, 1, P.cityAcc);

      const hs = this.hasSave();
      if (hs) {
        G.drawBtn(gg, 186, 118, 76, 16, 'CONTINUE', { col: '#2f8a48' });
        G.drawBtn(gg, 186, 138, 76, 16, 'NEW GAME', { col: '#a8145c' });
        G.text(gg, 'DAY ' + G.state.day + '  $' + Math.round(G.state.money), 224, 108, P.steel2, { align: 'center', out: OUTC });
      } else {
        G.drawBtn(gg, 186, 124, 76, 16, 'OPEN UP', { col: '#a8145c' });
        G.text(gg, 'SELL THE SUGAR.', 224, 104, P.steel2, { align: 'center', out: OUTC });
        G.text(gg, 'BILL FOR THE REPAIR.', 224, 113, P.steel2, { align: 'center', out: OUTC });
      }
      G.drawSteam(gg);
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
    g.setTransform(1, 0, 0, 1, 0, 0);
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

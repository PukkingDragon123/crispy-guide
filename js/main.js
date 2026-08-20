// ============================================================
// DOUBLE LIFE v2 - main.js
// Engine shell: canvas fit, pointer input (screen + world),
// camera pump, iris transitions, mute, cursor, title card.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
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

  function hitMute(x, y) { return G.inRect(x, y, G.W - 20, 2, 18, 14); }

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
    const x = G.W - 20, y = 2;
    gg.globalAlpha = 0.9;
    G.frame(gg, x, y, 18, 14, '#16211f');
    G.R(gg, x + 4, y + 6, 3, 3, m ? P.steel : P.chrome);
    G.R(gg, x + 7, y + 4, 2, 7, m ? P.steel : P.chrome);
    if (!m) { G.R(gg, x + 11, y + 5, 1, 5, P.neonG); G.R(gg, x + 13, y + 3, 1, 9, P.neonG); }
    else { for (let i = 0; i < 4; i++) { G.R(gg, x + 10 + i, y + 4 + i, 1, 1, P.blood); G.R(gg, x + 13 - i, y + 4 + i, 1, 1, P.blood); } }
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
        G.drawToothIcon(gg, G.W / 2 - 5, G.H / 2 - 40, P.bone);
        G.fe(gg, G.W / 2, G.H / 2 - 24, 9, 3, P.bloodDk);
      } else {
        G.drawScoopBall(gg, G.W / 2, G.H / 2 - 34, 11, G.flavorById(G.state.flavors[0]) || G.DATA.flavors[0], 0);
      }
      G.text(gg, trans.label, G.W / 2, G.H / 2 - 6, night ? P.neonC : P.gold, { align: 'center', out: P.ink, sc: 2 });
      gg.globalAlpha = 1;
    }
  }

  // ============================================================
  // TITLE
  // ============================================================
  G.scenes.title = {
    enter() { this.t = 0; G.audio.music('title'); G.cam.reset(0, 0, 0, 0); },
    hasSave() { return G.hasSave && (G.state.day > 1 || G.state.money > 0 || G.state.flavors.length > 3); },
    onDown(x, y) {
      const hs = this.hasSave();
      if (hs && G.inRect(x, y, 330, 240, 140, 24)) { G.audio.sfx('day'); G.newDayStats(); G.go('day', 'DAY ' + G.state.day); return; }
      const ny = hs ? 270 : 244;
      if (G.inRect(x, y, 330, ny, 140, 24)) {
        G.audio.sfx('day'); G.reset(); G.newDayStats(); G.go('day', 'DAY 1');
      }
    },
    update(dt) { this.t += dt; },
    draw(gg) {
      const t = this.t;
      // --- sky: bruised dusk on the left, black night on the right ---
      G.gradV(gg, 0, 0, 320, 200, '#3a1c2e', '#12100f', 7);
      G.gradV(gg, 320, 0, 320, 200, '#0d1418', '#080c0b', 6);
      // stars
      for (let i = 0; i < 40; i++) {
        const sx = 330 + (i * 71) % 300, sy = (i * 43) % 170;
        if (Math.sin(t * 1.7 + i) > -0.1) G.R(gg, sx, sy, 1, 1, i % 5 ? '#2c3b44' : '#7f96a3');
      }
      // sickly sun sinking left, bone moon right
      G.fc(gg, 74, 150, 22, '#5a1f24');
      G.fc(gg, 74, 150, 18, '#a33a24');
      G.fc(gg, 74, 148, 13, '#d9702e');
      G.fc(gg, 500, 52, 17, '#1a2226');
      G.fc(gg, 500, 52, 15, '#d8d2bc');
      G.fc(gg, 507, 47, 11, '#0d1418');
      G.speckle(gg, 486, 38, 30, 30, '#a8a291', 0.05, 3);

      // --- skyline of the swamp town ---
      for (let i = 0; i < 22; i++) {
        const bx = i * 31 - 10, bh = 40 + ((i * 37) % 58), by = 200 - bh;
        G.R(gg, bx, by, 30, bh, i % 2 ? '#0a1210' : '#0d1614');
        G.R(gg, bx, by, 30, 1, '#16241f');
        for (let w = 0; w < 6; w++) {
          const wx = bx + 4 + (w % 3) * 9, wy = by + 6 + Math.floor(w / 3) * 13;
          if (((i * 7 + w * 13) % 5) < 2) G.R(gg, wx, wy, 4, 5, Math.sin(t * 2 + i + w) > 0.9 ? '#3a3020' : '#6b5320');
        }
      }
      // wet road
      G.gradV(gg, 0, 200, 640, 90, '#0f1a18', '#070c0b', 5);
      G.R(gg, 0, 200, 640, 1, '#1d3630');
      // reflected neon smear on the wet road (soft, dithered - not a bar)
      G.glow(gg, 320, 224, 190, 22, P.neonP, 1.1);
      G.glow(gg, 320, 258, 140, 14, P.neonC, 0.8);
      gg.globalAlpha = 0.1;
      G.dither(gg, 150, 214, 340, 30, null, P.neonP, 0.35);
      gg.globalAlpha = 1;

      // --- the crocodile proprietor, hulking in the middle ---
      const bob = Math.sin(t * 1.4) * 1.5;
      const cx = 152, base = 300 + bob;
      gg.globalAlpha = 0.5; G.fe(gg, cx, base + 2, 46, 6, '#000'); gg.globalAlpha = 1;
      G.drawCust(gg, 'gator', cx, base + 6, t, { mood: 'angry', scale: 2.5 });
      // the tools of both trades, one in each claw
      G.drawScoopBall(gg, cx - 40, base - 40, 9, G.DATA.flavors[5], 0);
      G.R(gg, cx - 42, base - 30, 4, 14, P.steel);
      G.R(gg, cx - 41, base - 29, 2, 12, P.chrome);
      G.drawTool(gg, 'drill', cx + 40, base - 26, { active: true, t });

      // --- the cast shuffling past along the kerb ---
      const ids = G.DATA.animals.map((a) => a.id);
      for (let i = 0; i < ids.length; i++) {
        const ax = (t * 26 + i * 74) % (640 + 90) - 45;
        gg.globalAlpha = 0.92;
        G.drawCust(gg, ids[i], ax, 336, t + i * 1.7, { walk: true, mood: i % 4 === 0 ? 'sick' : 'idle' });
        gg.globalAlpha = 1;
      }

      // --- neon logo ---
      G.drawNeon(gg, 320, 34, 'DOUBLE LIFE', P.neonP, t, 4);
      G.drawNeon(gg, 320, 76, 'SCOOP BY DAY   DRILL BY NIGHT', P.neonC, t * 0.7 + 3, 1);
      // hanging sign bracket
      G.R(gg, 200, 24, 240, 2, '#16241f');
      G.R(gg, 200, 20, 3, 8, '#16241f'); G.R(gg, 437, 20, 3, 8, '#16241f');

      // --- buttons ---
      const hs = this.hasSave();
      if (hs) {
        G.drawBtn(gg, 330, 240, 140, 24, 'CONTINUE', { col: '#2f6b3a' });
        G.drawBtn(gg, 330, 270, 140, 24, 'NEW GAME', { col: P.gum });
        G.text(gg, 'DAY ' + G.state.day + '   $' + Math.round(G.state.money), 400, 230, P.steel2, { align: 'center', out: P.ink });
      } else {
        G.drawBtn(gg, 330, 244, 140, 24, 'OPEN UP', { col: P.gum });
        G.text(gg, 'SELL THE SUGAR. BILL FOR THE DAMAGE.', 400, 214, P.steel2, { align: 'center', out: P.ink });
      }
      G.grade(gg, 1.1);
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

// ============================================================
// DOUBLE LIFE - main.js
// Canvas setup, pointer input, scene manager with an iris-wipe
// transition, the title screen, HUD extras (mute), pixel cursor
// and the game loop.
// ============================================================
(function () {
  const G = window.GAME;
  const canvas = document.getElementById('game');
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;

  // ---------- scale to window ----------
  function fit() {
    const ww = window.innerWidth, wh = window.innerHeight - 8;
    let s = Math.min(ww / G.W, wh / G.H);
    if (s >= 1) s = Math.floor(s);
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
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    G.audio.unlock();
    const p = toGame(e);
    M.x = p.x; M.y = p.y; M.down = true;
    M.touch = e.pointerType === 'touch';
    if (trans.phase === 'none' && G.scene) {
      if (hitMute(p.x, p.y)) { toggleMute(); return; }
      if (G.scene.onDown) G.scene.onDown(p.x, p.y);
    }
  }, { passive: false });
  canvas.addEventListener('pointermove', (e) => {
    const p = toGame(e);
    M.x = p.x; M.y = p.y;
    if (trans.phase === 'none' && G.scene && G.scene.onMove) G.scene.onMove(p.x, p.y);
  });
  window.addEventListener('pointerup', (e) => {
    const p = toGame(e);
    M.down = false;
    if (trans.phase === 'none' && G.scene && G.scene.onUp) G.scene.onUp(p.x, p.y);
  });
  window.addEventListener('pointercancel', () => { M.down = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // mute button
  function hitMute(x, y) { return G.inRect(x, y, 460, 2, 18, 14); }
  function toggleMute() {
    G.state.muted = !G.state.muted;
    if (G.state.muted) G.audio.stopAllLoops();
    G.save();
    if (!G.state.muted) G.audio.sfx('click');
  }
  function drawMute(gg) {
    const m = G.state.muted;
    gg.globalAlpha = 0.85;
    G.panel(gg, 460, 2, 18, 14, '#3b2b40', G.OUT);
    G.R(gg, 464, 7, 3, 4, m ? '#8d8398' : '#fff');
    G.R(gg, 467, 5, 2, 8, m ? '#8d8398' : '#fff');
    if (!m) { G.R(gg, 471, 6, 1, 6, '#7be98a'); G.R(gg, 473, 4, 1, 10, '#7be98a'); }
    else { G.R(gg, 471, 5, 1, 1, '#ff6e6e'); G.R(gg, 472, 6, 1, 1, '#ff6e6e'); G.R(gg, 473, 7, 1, 1, '#ff6e6e'); G.R(gg, 473, 5, 1, 1, '#ff6e6e'); G.R(gg, 472, 6, 1, 1, '#ff6e6e'); G.R(gg, 471, 7, 1, 1, '#ff6e6e'); }
    gg.globalAlpha = 1;
  }

  // ---------- transition (iris wipe) ----------
  const overlay = document.createElement('canvas');
  overlay.width = G.W; overlay.height = G.H;
  const og = overlay.getContext('2d');
  const trans = { phase: 'none', t: 0, next: null, label: null, holdT: 0 };
  const MAXR = Math.hypot(G.W / 2, G.H / 2) + 8;

  G.go = function (name, label) {
    if (trans.phase !== 'none') { switchTo(name); trans.phase = label ? 'label' : 'in'; trans.label = label; trans.holdT = 0; trans.t = 1; return; }
    trans.phase = 'out'; trans.t = 0; trans.next = name; trans.label = label || null;
  };
  function switchTo(name) {
    G.audio.stopAllLoops();
    G.scene = G.scenes[name];
    G.sceneName = name;
    if (G.scene.enter) G.scene.enter();
  }
  function updateTrans(dt) {
    if (trans.phase === 'out') {
      trans.t += dt * 2.4;
      if (trans.t >= 1) {
        trans.t = 1;
        switchTo(trans.next);
        trans.phase = trans.label ? 'label' : 'in';
        trans.holdT = 0;
      }
    } else if (trans.phase === 'label') {
      trans.holdT += dt;
      if (trans.holdT > 1.1) trans.phase = 'in';
    } else if (trans.phase === 'in') {
      trans.t -= dt * 2.4;
      if (trans.t <= 0) { trans.t = 0; trans.phase = 'none'; }
    }
  }
  function drawTrans(gg) {
    if (trans.phase === 'none') return;
    const r = MAXR * (1 - G.easeInOut(G.clamp(trans.t, 0, 1)));
    og.clearRect(0, 0, G.W, G.H);
    og.fillStyle = '#241c2e';
    og.fillRect(0, 0, G.W, G.H);
    if (r > 0) {
      og.save();
      og.globalCompositeOperation = 'destination-out';
      G.fc(og, G.W / 2, G.H / 2, r, '#000');
      og.restore();
    }
    gg.drawImage(overlay, 0, 0);
    if (trans.phase === 'label' && trans.label) {
      const a = Math.min(1, trans.holdT * 4);
      gg.globalAlpha = a;
      G.text(gg, trans.label, G.W / 2, G.H / 2 - 8, '#ffe66e', { align: 'center', out: G.OUT, sc: 1 });
      const night = trans.label.includes('NIGHT') || trans.label.includes('CLINIC');
      if (night) G.drawMoon(gg, G.W / 2, G.H / 2 - 28, 9);
      else G.drawSun(gg, G.W / 2, G.H / 2 - 28, 9, trans.holdT);
      gg.globalAlpha = 1;
    }
  }

  // ---------- title scene ----------
  G.scenes.title = {
    enter() { this.t = 0; G.audio.music('title'); },
    onDown(x, y) {
      const hasSave = G.hasSave && (G.state.day > 1 || G.state.money > 0 || G.state.flavors.length > 3);
      if (hasSave && G.inRect(x, y, 190, 168, 100, 20)) {
        G.audio.sfx('day');
        G.go('day', 'DAY ' + G.state.day + ' · SCOOPS OPEN!');
        return;
      }
      const ny = hasSave ? 194 : 174;
      if (G.inRect(x, y, 190, ny, 100, 20)) {
        G.audio.sfx('day');
        G.reset();
        G.newDayStats();
        G.go('day', 'DAY 1 · SCOOPS OPEN!');
      }
    },
    update(dt) { this.t += dt; },
    draw(gg) {
      const t = this.t;
      // split day/night background
      G.R(gg, 0, 0, 240, 270, '#9fdcff');
      G.R(gg, 240, 0, 240, 270, '#2a1c3e');
      for (let y = 0; y < 270; y += 18) {
        const off = (y / 18) % 2 === 0;
        G.R(gg, off ? 234 : 240, y, 6, 18, off ? '#2a1c3e' : '#9fdcff');
      }
      G.drawSun(gg, 60, 52, 14, t);
      G.drawMoon(gg, 420, 52, 12);
      for (let i = 0; i < 26; i++) {
        const sx = 250 + (i * 47) % 220, sy = (i * 31) % 240;
        if (Math.sin(t * 2 + i) > -0.1) G.R(gg, sx, sy, 1, 1, '#8d7bd5');
      }
      // clouds
      const cx = (t * 8) % 300 - 30;
      G.fe(gg, cx, 30, 14, 5, '#fff'); G.fe(gg, cx + 10, 26, 10, 4, '#fff');
      G.fe(gg, cx + 120, 70, 12, 4, '#fff');

      // big icons
      const bob = Math.sin(t * 2.4) * 3;
      // ice cream (left)
      G.drawBase(gg, 'cone', 90, 150 + bob);
      G.drawScoopBall(gg, 90, 118 + bob, 11, G.flavorById('straw'), 0);
      G.drawScoopBall(gg, 90, 103 + bob, 10, G.flavorById('vanilla'), 0);
      G.R(gg, 84, 96 + bob, 2, 2, '#ff6e9c'); G.R(gg, 94, 100 + bob, 2, 1, '#7fd6ff'); G.R(gg, 88, 92 + bob, 1, 2, '#ffd94a');
      // tooth (right)
      const tb = Math.sin(t * 2.4 + 1.5) * 3;
      G.rr2(gg, 372, 104 + tb, 34, 26, '#fdf6ee');
      G.R(gg, 374, 128 + tb, 12, 12, '#fdf6ee'); G.R(gg, 392, 128 + tb, 12, 12, '#fdf6ee');
      G.R(gg, 376, 108 + tb, 4, 4, '#e3d2c8');
      G.R(gg, 380, 112 + tb, 3, 3, G.OUT); G.R(gg, 395, 112 + tb, 3, 3, G.OUT);
      G.R(gg, 386, 120 + tb, 6, 2, G.OUT);
      G.R(gg, 378, 117 + tb, 3, 2, '#ff9aa8'); G.R(gg, 397, 117 + tb, 3, 2, '#ff9aa8');
      if (Math.sin(t * 3) > 0.6) G.text(gg, '★', 412, 100 + tb, '#fff');

      // logo
      const ly = 60 + Math.sin(t * 2) * 2;
      G.text(gg, 'DOUBLE', 240, ly, '#ffe66e', { align: 'center', out: G.OUT, sc: 4 });
      G.text(gg, 'LIFE', 240, ly + 34, '#ff9ad5', { align: 'center', out: G.OUT, sc: 4 });
      G.text(gg, 'SCOOP BY DAY · DRILL BY NIGHT', 240, ly + 72, '#fff', { align: 'center', out: G.OUT });

      // parade of animals at the bottom
      const ids = G.DATA.animals.map(a => a.id);
      for (let i = 0; i < ids.length; i++) {
        const ax = (t * 30 + i * 64) % (480 + 64) - 32;
        G.drawAnimal(gg, ids[i], ax, 258, t + i, { walk: true, mood: i % 3 === 0 ? 'happy' : 'ok' });
      }

      // buttons
      const hasSave = G.hasSave && (G.state.day > 1 || G.state.money > 0 || G.state.flavors.length > 3);
      if (hasSave) {
        G.drawBtn(gg, 190, 168, 100, 20, 'CONTINUE', { col: '#7bc96a' });
        G.drawBtn(gg, 190, 194, 100, 20, 'NEW GAME', { col: '#ff8fb0' });
        G.text(gg, 'DAY ' + G.state.day + ' · $' + G.state.money, 240, 152, '#5d4b70', { align: 'center', out: '#fff' });
      } else {
        G.drawBtn(gg, 190, 174, 100, 20, 'PLAY!', { col: '#ff8fb0' });
      }
      G.text(gg, 'SERVE SWEETS. CAUSE CAVITIES. FIX THEM FOR CASH.', 240, ly + 88, '#8d7b95', { align: 'center' });
    },
  };

  // ---------- loop ----------
  let last = performance.now();
  let vxs = 0, vys = 0, lastMx = 0, lastMy = 0;
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    if (dt <= 0) dt = 0.001;

    // mouse velocity (smoothed)
    const ivx = (M.x - lastMx) / dt, ivy = (M.y - lastMy) / dt;
    vxs += (ivx - vxs) * Math.min(1, dt * 14);
    vys += (ivy - vys) * Math.min(1, dt * 14);
    M.vx = vxs; M.vy = vys;
    lastMx = M.x; lastMy = M.y;

    updateTrans(dt);
    if (trans.phase === 'none' || trans.phase === 'in') {
      if (G.scene && G.scene.update) G.scene.update(dt);
    }
    G.updateJuice(dt);
    G.audio.tick();

    // draw
    G.hideCursor = false;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, G.W, G.H);
    if (G.shakeT > 0) {
      g.setTransform(1, 0, 0, 1, Math.round(G.rand(-G.shakeMag, G.shakeMag)), Math.round(G.rand(-G.shakeMag, G.shakeMag)));
    }
    if (G.scene && G.scene.draw) G.scene.draw(g);
    G.drawJuice(g);
    g.setTransform(1, 0, 0, 1, 0, 0);
    drawMute(g);
    drawTrans(g);
    // pixel cursor
    if (!M.touch && M.x >= 0 && !G.hideCursor) {
      const sc = G.scene;
      const holding = sc && sc.hold;
      if (!holding) G.drawCursor(g, M.x, M.y);
    }
    requestAnimationFrame(frame);
  }

  // ---------- boot ----------
  G.load();
  G.scene = G.scenes.title;
  G.sceneName = 'title';
  G.scene.enter();
  requestAnimationFrame(frame);

  // debug hooks (used by automated tests)
  window.DL = {
    G,
    go: (n, l) => G.go(n, l),
    state: () => G.state,
    give: (n) => { G.state.money += n; },
    scene: () => G.sceneName,
  };
})();

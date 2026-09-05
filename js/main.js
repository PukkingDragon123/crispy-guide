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
  G.__trans = trans;                            // so a harness can hold a card open
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
      const cx = G.W / 2;
      const hd = trans.hold;
      // ---- IS THIS THE START OF A DAY? Then it is a sunrise and a
      // clock, and not a small orange robot. ----
      const dawn = /^DAY /.test(trans.label);
      if (dawn) {
        const rise = G.easeOut(G.clamp(hd * 1.5, 0, 1));
        const sy = G.H / 2 - 20 - rise * 14;
        G.glow(gg, cx, sy, 120, 90, '#ffb24a', 0.5 * a);
        // rays, turning
        for (let i = 0; i < 12; i++) {
          const an = hd * 0.5 + i * 0.5236;
          const ln = 13 + (i % 2 ? 4 : 9) + Math.sin(hd * 3 + i) * 2;
          for (let k = 4; k < ln; k++) {
            const ry = sy + Math.sin(an) * k;
            if (ry > G.H / 2 - 18) break;            // nothing shines below the horizon
            G.Rq(gg, cx + Math.cos(an) * k - 0.5, ry - 0.5, 1.5, 1.5,
              k > ln - 3 ? '#c87a2a' : '#ffb24a');
          }
        }
        // the disc
        G.fc(gg, cx, sy, 9, '#c8862a');
        G.fc(gg, cx, sy, 8, '#ffc04a');
        G.fc(gg, cx, sy, 5, '#ffe6a8');
        G.Rq(gg, cx - 3, sy - 4, 3, 2, '#fff8e0');
        // the horizon LAST, so it cuts the rays off and the sun reads as
        // coming up from behind the world instead of floating on it
        G.R(gg, cx - 70, G.H / 2 - 18, 140, 1, '#5c4a3a');
        gg.globalAlpha = a * 0.5;
        G.R(gg, cx - 70, G.H / 2 - 17, 140, 3, '#2a2018');
        gg.globalAlpha = a;
        // and the clock: a shift is twelve hours and it starts now
        const ck = cx + 46, cy2 = G.H / 2 - 32;        // clear of the horizon
        G.oc(gg, ck, cy2, 12, '#2a2018');
        G.fc(gg, ck, cy2, 11, '#f2e4d0');
        G.oc(gg, ck, cy2, 11, '#8a6a44');
        G.fc(gg, ck, cy2, 9, '#fff8ec');
        for (let i = 0; i < 12; i++) {                 // a mark an hour
          const an = i * 0.5236, q = i % 3 === 0;
          G.Rq(gg, ck + Math.cos(an) * 8 - 0.5, cy2 + Math.sin(an) * 8 - 0.5,
            q ? 1.5 : 1, q ? 1.5 : 1, q ? '#3a2a20' : '#a08a70');
        }
        const hh = -1.9 + hd * 0.6;                    // the hands, coming round to open
        G.line(gg, ck, cy2, ck + Math.cos(hh) * 5, cy2 + Math.sin(hh) * 5, '#2a2018');
        G.line(gg, ck, cy2, ck + Math.cos(hh + 0.12) * 5, cy2 + Math.sin(hh + 0.12) * 5, '#2a2018');
        const mm = hd * 4 - 1.6;
        G.line(gg, ck, cy2, ck + Math.cos(mm) * 8, cy2 + Math.sin(mm) * 8, '#c8383a');
        G.fc(gg, ck, cy2, 1.5, '#2a2018');
      } else {
        // ---- EVERY OTHER LOAD: clause, coming to find you. It flies in
        // from the left on an arc, trailing sparks, spinning up its rays,
        // and blinks a little "working on it" under itself. ----
        const fly = G.easeOut(G.clamp(hd * 2.1, 0, 1));
        const bx = G.lerp(cx - 62, cx, fly);
        const by = G.H / 2 - 26 + Math.sin(hd * 4.2) * 2.6 - (1 - fly) * 10;
        // the trail it came in on
        for (let i = 1; i < 11; i++) {
          const q = i / 11;
          const tx = G.lerp(cx - 62, bx, 1 - q * 0.5);
          const ty = G.H / 2 - 26 + Math.sin((hd - q * 0.18) * 4.2) * 2.6 - (1 - fly) * 10;
          gg.globalAlpha = a * (1 - q) * 0.75;
          const r2 = Math.max(0.5, 3 - q * 2.6);
          G.Rq(gg, tx - r2 / 2, ty - r2 / 2, r2, r2, q < 0.4 ? '#ffc9a8' : '#f0794f');
          gg.globalAlpha = a;
        }
        const talk = Math.sin(hd * 7) > -0.2;
        // a ring going out from it, so the card has a heartbeat
        for (let i = 0; i < 2; i++) {
          const q = ((hd * 0.9 + i * 0.5) % 1);
          gg.globalAlpha = a * (1 - q) * 0.4;
          G.oc(gg, bx, by, 12 + q * 22, '#ff9a6a');
          gg.globalAlpha = a;
        }
        G.starburst(gg, bx, by, 16 + Math.sin(hd * 5) * 1.2, hd * 1.6,
          { talk, col: '#f0794f', lit: '#ffc9a8' });
        // three dots, filling one at a time, because it is thinking
        for (let i = 0; i < 3; i++) {
          const on = ((hd * 3) % 3) >= i;
          const r2 = on ? 2.5 : 1.5;
          G.Rq(gg, cx - 7 + i * 7 - r2 / 2, G.H / 2 - 9 - r2 / 2, r2, r2,
            on ? '#ffc9a8' : '#4a3230');
        }
      }
      G.text(gg, trans.label, cx, G.H / 2 - 2,
        dawn ? '#ffd48a' : P.hazard, { align: 'center', out: P.ink });
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
    enter() {
      this.t = 0; this.panel = null; this.sel = 0; this.confirm = false;
      G.audio.music('title'); G.steam.length = 0;
    },
    hasSave() { return G.hasSave && (G.state.day > 1 || G.state.freed > 0 || G.state.flavours.length > 2); },

    // only what you have actually earned appears in the column
    entries() {
      const hs = this.hasSave();
      const out = [];
      if (hs) out.push({ id: 'go',   lab: 'CONTINUE',   col: '#2f8a48' });
      out.push({ id: 'new', lab: hs ? 'START OVER' : 'WAKE UP', col: '#a8145c' });
      if (hs && G.unlocked('quests')) out.push({ id: 'quests', lab: 'QUESTS', col: '#2a5c6b' });
      if (hs && G.unlocked('story')) out.push({ id: 'story', lab: 'THE STORY', col: '#3a2a5c' });
      if ((G.state.eggs || []).length) out.push({ id: 'eggs', lab: 'SECRETS', col: '#5c4a20' });
      return out;
    },
    rowY(i) { return 104 + i * 15; },

    onDown(x, y) {
      // ---- a panel is up ----
      if (this.panel) {
        if (G.inRect(x, y, 272, 18, 44, 13)) { this.panel = null; G.audio.sfx('back'); return; }
        if (this.panel === 'story') {
          const seen = (G.state.chapters || []);
          for (let i = 0; i < seen.length; i++)
            if (G.inRect(x, y, 12, 38 + i * 15, 296, 14)) {
              const ch = G.CHAPTERS.find((c) => c.id === seen[i]);
              const id = (ch && ch.cine) || seen[i];
              if (!G.cine.has(id)) { G.audio.sfx('bad'); return; }
              G.audio.sfx('click');
              G.playCine(id, () => G.go('title'));
              return;
            }
        }
        return;
      }
      // ---- the confirm strip over START OVER ----
      if (this.confirm) {
        if (G.inRect(x, y, 186, 140, 38, 14)) {
          G.audio.sfx('boot'); G.reset(); this.confirm = false;
          G.go('floor', 'BIG MOO');
          return;
        }
        if (G.inRect(x, y, 228, 140, 36, 14)) { this.confirm = false; G.audio.sfx('back'); return; }
        return;
      }
      // ---- your own swirl, for anyone who tries ----
      if (G.inRect(x, y, 74, 54, 22, 18)) {
        G.audio.sfx('clack');
        G.showEgg(G.findEgg('e_swirl'));
        return;
      }
      const rows = this.entries();
      for (let i = 0; i < rows.length; i++) {
        if (!G.inRect(x, y, 186, this.rowY(i), 78, 14)) continue;
        const e = rows[i];
        G.audio.sfx('menu');
        if (e.id === 'go') {
          G.audio.sfx('day'); G.newDayStats(); G.state.today.demand = G.rollDemand();
          G.go('day', 'DAY ' + G.state.day);
        } else if (e.id === 'new') {
          if (this.hasSave()) this.confirm = true;
          else { G.reset(); G.go('floor', 'BIG MOO'); }
        } else {
          if (e.id === 'quests') for (const q of G.checkQuests()) G.toast('QUEST: ' + q.name + '  +$' + q.pay, P.lime);
          G.toasts.length = 0;
          this.panel = e.id;
        }
        return;
      }
    },
    update(dt) { this.t += dt; G.updateSteam(dt); if (Math.random() < dt * 1.3) G.puffSteam(G.irand(10, 310), 178); },

    // ================= the panels =================
    drawPanel(gg, t) {
      const p2 = this.panel;
      gg.globalAlpha = 0.86;
      G.R(gg, 0, 0, G.W, G.H, '#05070c');
      gg.globalAlpha = 1;
      const titles = { quests: 'THE JOB', story: 'THE STORY SO FAR', eggs: 'SECRETS' };
      G.cosy(gg, 4, 16, 264, 15, { col: P.wood, trim: P.lampLt });
      G.text(gg, titles[p2], 10, 20, P.lampLt);
      G.drawBtn(gg, 272, 18, 44, 13, 'CLOSE', { col: '#5c2030' });

      if (p2 === 'quests') {
        const act = G.activeQuests();
        const done = (G.state.questsDone || []);
        G.text(gg, 'ON NOW', 12, 36, P.steel, { sc: 0.5 });
        for (let i = 0; i < act.length; i++) {
          const q = act[i], ry = 42 + i * 22;
          const pr = G.questProgress(q), fr = pr / q.goal;
          G.cosy(gg, 10, ry, 300, 19, { col: '#241a12', lamp: false });
          G.R(gg, 10, ry, 2, 19, P.lampDk);
          G.text(gg, q.name, 16, ry + 2, P.cream);
          G.text(gg, q.desc, 16, ry + 11, P.steel2, { sc: 0.5 });
          G.R(gg, 210, ry + 11, 70, 4, '#0d1220');
          G.R(gg, 210, ry + 11, Math.round(70 * fr), 4, fr >= 1 ? P.lime : P.hazard);
          G.text(gg, pr + '/' + q.goal, 210, ry + 3, P.steel2, { sc: 0.5 });
          G.text(gg, '+$' + q.pay, 306, ry + 3, P.hazard, { align: 'right', sc: 0.5 });
        }
        if (!act.length) G.text(gg, 'EVERY ONE OF THEM. DONE.', 160, 60, P.lime, { align: 'center' });
        // the finished ones, as a tally strip
        G.text(gg, 'DONE  ' + done.length + '/' + G.QUESTS.length, 12, 116, P.steel, { sc: 0.5 });
        for (let i = 0; i < G.QUESTS.length; i++) {
          const on = done.indexOf(G.QUESTS[i].id) >= 0;
          G.Rh(gg, 12 + i * 8, 124, 6, 6, on ? '#2f8a48' : '#1c2130');
          G.bevel(gg, 12 + i * 8, 124, 6, 6, on ? '#b6ff9a' : '#2c3348', '#0b0e14');
        }
        G.text(gg, 'THEY PAY ON COMPLETION. NOBODY ASKED YOU TO DO ANY OF IT.',
          12, 136, '#46506b', { sc: 0.5 });
      }

      if (p2 === 'story') {
        const seen = (G.state.chapters || []);
        G.text(gg, 'TAP A CHAPTER TO WATCH IT AGAIN', 12, 33, '#46506b', { sc: 0.5 });
        for (let i = 0; i < G.CHAPTERS.length; i++) {
          const c = G.CHAPTERS[i];
          const has = seen.indexOf(c.id) >= 0;
          const ry = 38 + i * 15;
          if (ry > 140) break;
          G.plate(gg, 12, ry, 296, 14, has ? '#1a1428' : '#111520', { r: 1, band: 1, spec: false });
          G.R(gg, 12, ry, 2, 14, has ? P.violetLt : '#2a3040');
          G.text(gg, has ? (i + 1) + '.  ' + c.name : (i + 1) + '.  - - - -',
            18, ry + 3, has ? P.cream : '#3a4458');
          if (has && G.cine.has(c.cine || c.id)) G.text(gg, 'REPLAY', 302, ry + 4, P.lampLt,
            { align: 'right', sc: 0.5 });
          else if (has) G.text(gg, 'SEEN', 302, ry + 4, P.steel, { align: 'right', sc: 0.5 });
        }
      }

      if (p2 === 'eggs') {
        const got = (G.state.eggs || []);
        G.text(gg, got.length + ' OF ' + G.EGGS.length + ' FOUND', 12, 33, P.hazard, { sc: 0.5 });
        for (let i = 0; i < G.EGGS.length; i++) {
          const e = G.EGGS[i], has = got.indexOf(e.id) >= 0;
          const ry = 39 + i * 13;
          if (ry > 142) break;
          G.plate(gg, 12, ry, 296, 12, has ? '#1a1408' : '#111520', { r: 1, band: 1, spec: false });
          G.R(gg, 12, ry, 2, 12, has ? '#e0b83a' : '#2a3040');
          G.text(gg, has ? e.name : '? ? ?', 18, ry + 1, has ? '#ffe89a' : '#3a4458', { sc: 0.5 });
          G.text(gg, has ? e.note : e.hint, 110, ry + 1,
            has ? '#c8b490' : '#46506b', { sc: 0.5 });
        }
      }
    },
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
      G.hair(gg, 0, 123, G.W, '#2c3852');
      G.glow(gg, 200, 134, 130, 30, P.magenta, 0.85);
      for (let i = 0; i < 40; i++) {
        const rx = (i * 37 + 11) % G.W;
        G.R(gg, rx, 126 + ((i * 13) % 44), 2, 1, i % 3 ? '#1d2438' : '#2a3452');
      }
      // wet pavement: the sign reflected in it
      gg.globalAlpha = 0.16;
      for (let i = 0; i < 26; i++)
        G.Rh(gg, 140 + (i * 7 % 130), 126 + (i % 8) * 5, 6, 1, P.magentaLt);
      gg.globalAlpha = 1;
      // a drain and a puddle by your treads
      G.oc(gg, 40, 150, 6, '#0d1119');
      gg.globalAlpha = 0.3; G.rr(gg, 60, 152, 46, 8, '#22303f'); gg.globalAlpha = 1;
      // YOU: the discarded machine, patched, with a cone bolted on
      G.drawBot(gg, 'player', 84, 122, 1.15,
        { t, open: 0.2 + Math.sin(t * 1.3) * 0.1, mood: 'idle', walk: 0, noBlink: 1 });
      // clause, on its stand beside you
      G.plate(gg, 126, 108, 18, 14, P.plateDk, { r: 1, band: 2, bolts: 1 });
      G.R(gg, 134, 88, 2, 22, P.hullDk);
      G.vair(gg, 134, 88, 22, P.hull);
      G.starburst(gg, 135, 80, 11, t, { talk: Math.sin(t * 2) > 0 });
      // the tip jar cat, if you ever bought one
      if (G.has('tipjar')) {
        G.plate(gg, 46, 118, 24, 5, P.plateDk, { r: 1, band: 1 });
        G.drawCatJar(gg, 58, 118, 0.68, { t, purr: Math.sin(t * 0.7) > 0.7 ? 1 : 0, coins: 7 });
      }
      // a cone on the ledge
      G.plate(gg, 12, 116, 30, 6, P.plate, { r: 1, band: 1 });
      const cy2 = G.cone(gg, 27, 116, { w: 14, h: 16 });
      G.gooScoop(gg, 27, cy2 - 7, 8, { col: '#ff5d84', goo: 4 }, {});

      G.drawNeon(gg, 202, 40, 'DOUBLE LIFE', P.magenta, t, 2);
      G.text(gg, 'SCOOP BY DAY   SABOTAGE BY NIGHT', 202, 58, P.cyanLt, { align: 'center', out: OUTC });
      G.R(gg, 140, 34, 124, 1, P.cityAcc);

      const hs = this.hasSave();
      // ---- the save card, then the menu column ----
      if (hs && !this.panel) {
        G.cosy(gg, 176, 66, 98, 32, { col: '#241a12', trim: P.lampLt });
        G.text(gg, 'SHIFT ' + G.state.day, 181, 70, P.cream, { sc: 0.5 });
        G.text(gg, '$' + Math.round(G.state.money), 270, 70, P.hazard, { align: 'right', sc: 0.5 });
        G.text(gg, G.chapterName(), 181, 76, P.violetLt, { sc: 0.5 });
        G.text(gg, (G.state.crew || []).length + ' RESCUED  ·  ' + (G.state.eggs || []).length
          + '/' + G.EGGS.length + ' SECRETS', 181, 82, P.steel, { sc: 0.5 });
        G.text(gg, (G.state.questsDone || []).length + '/' + G.QUESTS.length + ' QUESTS  ·  HEAT '
          + Math.round(G.state.suspicion * 100) + '%', 181, 88, P.steel, { sc: 0.5 });
        // a row of pips for the pits you have built
        for (let i = 0; i < 5; i++)
          G.Rh(gg, 181 + i * 6, 92, 4, 4, i < G.pitCount() ? P.lime : '#232c3e');
      } else if (!hs && !this.panel) {
        G.text(gg, 'THEY THREW YOU AWAY.', 225, 76, P.steel2, { align: 'center', out: OUTC });
        G.text(gg, 'SHE DID NOT.', 225, 86, P.steel2, { align: 'center', out: OUTC });
      }
      const rows = this.entries();
      if (!this.panel) for (let i = 0; i < rows.length; i++)
        G.drawBtn(gg, 186, this.rowY(i), 78, 14, rows[i].lab, { col: rows[i].col });
      // the confirm strip, so START OVER cannot happen by accident
      if (this.confirm) {
        G.cosy(gg, 176, 118, 98, 38, { col: '#2a1218', trim: P.magenta });
        G.text(gg, 'THROW ALL OF IT AWAY?', 225, 124, P.magentaLt, { align: 'center', sc: 0.5 });
        G.text(gg, 'SHIFT ' + G.state.day + ', ' + (G.state.crew || []).length + ' RESCUED',
          225, 131, P.steel2, { align: 'center', sc: 0.5 });
        G.drawBtn(gg, 186, 140, 38, 14, 'YES', { col: '#a8145c' });
        G.drawBtn(gg, 228, 140, 36, 14, 'NO', { col: '#2a3446' });
      }
      G.drawSteam(gg);
      if (this.panel) this.drawPanel(gg, t);
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

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
  // TITLE  ·  THE STREET, AND THREE CHIPS
  //
  // It used to be a shop window with a neon sign over it, a column of
  // buttons beside it, and ONE save shown as a card that said SHIFT 7.
  // START OVER threw that save away, behind a confirm strip, because
  // there was nowhere else for a second run to live.
  //
  // Now it is four in the morning on a wet road with nobody on it but
  // you, and the saves are objects: three data chips on a rail in the
  // foreground. Pick one up and it goes in your head, which is exactly
  // where the last one went.
  // ============================================================

  // ---- THE STREET ----
  // One perspective, two linear functions. q is depth: 0 at the
  // vanishing point, ~0.87 at the bottom of the frame. Everything in
  // the scene is placed by (world offset, q), so the road, the kerbs,
  // the terraces and the lamps all agree about where the horizon is.
  const VX = 160, HZ = 76, DROP = 104;
  const S_OF = (q) => 0.05 + q * 2.6;          // lateral scale at depth q
  const Y_OF = (q) => HZ + q * DROP;           // ground line at depth q
  const Q_AT = (y) => (y - HZ) / DROP;
  const ROAD = 70, KERB = 82, WALL = 88;

  // the lamps, so the animated pass knows where to put their light
  const LAMPS = [];
  const PUDDLES = [];
  let streetBuf = null;

  // ------------------------------------------------------------
  // Painted ONCE into a buffer at native resolution and blitted after
  // that. The geometry of a street does not change; only the rain, the
  // lamps, the water and the mascot do. Marching the terraces is about
  // two thousand vertical strips, which is fine once and absurd sixty
  // times a second.
  // ------------------------------------------------------------
  function buildStreet() {
    const c = document.createElement('canvas');
    c.width = G.WN; c.height = G.HN;
    const b = c.getContext('2d');
    b.imageSmoothingEnabled = false;
    b.setTransform(G.PX, 0, 0, G.PX, 0, 0);
    LAMPS.length = 0; PUDDLES.length = 0;

    // ---- sky: a sodium haze sitting on the roofs, cold above it ----
    for (let j = 0; j < HZ + 8; j++)
      G.Rh(b, 0, j, G.W, 1, G.mix('#080b14', '#3a2b33', Math.pow(j / (HZ + 8), 1.7)));
    // cloud banks, underlit by the city they are sitting on
    for (let i = 0; i < 8; i++) {
      const cy = 10 + i * 11, cw = 70 + G.hash(i, 3) * 150;
      const cx = G.hash(i, 7) * 380 - 40;
      const col = G.mix('#141020', '#4e3440', 1 - i / 10);
      G.fe(b, cx, cy, cw * 0.5, 6, G.mix(col, '#0a0810', 0.45));
      G.fe(b, cx, cy + 3, cw * 0.42, 4, col);
      G.hairq(b, cx - cw * 0.3, cy + 6.5, cw * 0.6, G.mix(col, '#9a5e46', 0.5));
    }

    // ---- THE TERRACES ----
    // Marched as vertical strips one native pixel wide. A "building" is
    // a run of strips sharing a hash, so windows come out as columns of
    // the right width instead of a stripe per strip.
    const DQ = 0.0011;
    for (const sd of [-1, 1]) {
      for (let q = 1.18; q > 0.028; q -= DQ) {
        const S = S_OF(q), gy = Y_OF(q);
        const x = VX + sd * WALL * S;
        if (x < -6 || x > G.W + 6) continue;
        const bi = Math.floor(q * 7.5) * 2 + (sd < 0 ? 0 : 1);
        const bh = 44 + G.hash(bi, 3) * 34;              // world height
        const roof = gy - bh * S;
        // haze: the far end of the street is full of rain
        // haze: the far end of the street is full of rain. Kept low, and
        // kept COLD, so the terrace stays a silhouette and the warm
        // windows are the only bright thing in it.
        const fog = G.clamp(1 - q * 1.9, 0, 0.52);
        const base = ['#161320', '#1c1724', '#12101c', '#201828'][bi % 4];
        const face = G.mix(G.shade(base, sd < 0 ? 0.08 : -0.12), '#2e3346', fog);
        G.Rq(b, x, roof, 0.25, Math.max(1, gy - roof + 1), face);
        // cornice and parapet
        G.Rq(b, x, roof - 1.25, 0.25, 1.5, G.mix(G.shade(base, 0.5), '#2e3346', fog));
        // ---- windows ----
        if (S > 0.14) {
          for (let f = 0; f < 6; f++) {
            const wh = 7 + f * 9.5;                      // world height of the sill
            if (wh + 6 > bh) break;
            const wy = gy - wh * S, hgt = Math.max(0.5, 5.5 * S);
            const key = G.hash(bi * 13.7 + f * 3.1, Math.floor(q * 46));
            if (key > 0.88) continue;                    // a gap in the terrace
            // most of this city is asleep. A third of the windows lit is
            // a skyline; two thirds is a texture.
            const lit = key < 0.30;
            const col = lit
              ? G.mix(['#ffc46a', '#ffd9a0', '#8fc8ff', '#ff9a6a'][Math.floor(key * 97) % 4],
                      '#2e3346', fog * 0.6)
              : G.mix('#08070e', '#2e3346', fog);
            G.Rq(b, x, wy - hgt, 0.25, hgt, col);
            if (lit && S > 0.5 && G.hash(bi + f, Math.floor(q * 12)) > 0.72)
              G.Rq(b, x, wy - hgt * 0.5, 0.25, hgt * 0.3, '#2a1c18');   // somebody at it
          }
          // ground floor: shutters, with the odd one still trading
          const sy = gy - 13 * S;
          const shut = G.hash(bi * 5.3, Math.floor(q * 20));
          G.Rq(b, x, sy, 0.25, Math.max(1, gy - sy), shut > 0.82
            ? G.mix('#4a1e24', '#2e3346', fog) : G.mix('#0a0912', '#2e3346', fog));
          if (shut > 0.95) G.Rq(b, x, sy + 2 * S, 0.25, Math.max(0.5, 5 * S),
            G.mix('#ffbe6a', '#2e3346', fog * 0.5));
        }
      }
    }

    // ---- THE ROAD ----
    // Row by row, because every row is a different depth. Wet asphalt:
    // near black under your feet, hazy and light toward the horizon,
    // where all the lamps are pooling.
    for (let y = HZ; y < G.H; y += 0.25) {
      const q = Q_AT(y), S = S_OF(q);
      const half = ROAD * S, kb = KERB * S;
      const fog = G.clamp(1 - q * 1.7, 0, 0.62);
      // pavement each side
      G.Rq(b, VX - kb, y, kb * 2, 0.25, G.mix('#191621', '#2e3346', fog));
      // THE ROAD. Wet tarmac at night is not black: it is a mirror with
      // a city on it, and the far end of it is the brightest thing here
      // because every lamp on the street is pooling into it.
      G.Rq(b, VX - half, y, half * 2, 0.25,
        G.mix(G.mix('#39415a', '#14131e', G.clamp(q * 1.35, 0, 1)), '#3c4560', fog));
      // kerb hairs, lit along the top edge
      G.Rq(b, VX - kb, y, Math.max(0.25, 1.5 * S), 0.25, G.mix('#464056', '#2e3346', fog));
      G.Rq(b, VX + kb - Math.max(0.25, 1.5 * S), y, Math.max(0.25, 1.5 * S), 0.25,
        G.mix('#464056', '#2e3346', fog));
    }
    // the centre line, dashed, running away from you
    for (let k = 0; k < 22; k++) {
      const q = 0.035 + Math.pow(k / 22, 2.1) * 1.15;
      const S = S_OF(q), y = Y_OF(q);
      const w = Math.max(0.25, 1.6 * S), h = Math.max(0.25, 5 * S);
      if (y > G.H) break;
      G.Rq(b, VX - w / 2, y - h, w, h, G.mix('#b0a480', '#3c4560', G.clamp(1 - q * 1.8, 0, 0.6)));
    }
    // drain covers and a service hatch, so the tarmac has things in it
    for (const [wx, q] of [[-62, 0.42], [58, 0.21], [-56, 0.14]]) {
      const S = S_OF(q), y = Y_OF(q);
      G.Rq(b, VX + wx * S - 5 * S, y - 2.5 * S, 10 * S, 5 * S, '#15131c');
      for (let i = 0; i < 4; i++)
        G.Rq(b, VX + wx * S - 4 * S + i * 2.4 * S, y - 2 * S, Math.max(0.25, 0.8 * S),
          Math.max(0.25, 4 * S), '#0a0910');
    }

    // ---- THE LAMPS ----
    // Poles and heads are geometry, so they are baked. Their light is
    // not: it flickers, and it has to go on top of the rain.
    for (const sd of [-1, 1]) {
      for (const q of [0.055, 0.12, 0.215, 0.35, 0.52]) {
        const S = S_OF(q), gy = Y_OF(q);
        const x = VX + sd * 76 * S;
        if (x < -20 || x > G.W + 20) continue;
        const hy = gy - 34 * S;                     // the head
        const fog = G.clamp(1 - q * 1.7, 0, 0.55);
        const pole = G.mix('#4a4458', '#2e3346', fog);
        G.Rq(b, x - Math.max(0.25, 0.9 * S), hy, Math.max(0.5, 1.8 * S), gy - hy, pole);
        G.vairq(b, x - Math.max(0.25, 0.9 * S), hy, gy - hy, G.shade(pole, 0.4));
        // the arm, reaching out over the road
        const arm = 10 * S;
        G.Rq(b, sd < 0 ? x : x - arm, hy, arm, Math.max(0.25, 1.3 * S), pole);
        const lx = x + sd * arm, ly = hy + 1.5 * S;
        G.Rq(b, lx - 2.8 * S, ly, 5.6 * S, Math.max(0.5, 2.4 * S), G.shade(pole, -0.3));
        G.Rq(b, lx - 2.2 * S, ly + 2.2 * S, 4.4 * S, Math.max(0.5, 1.2 * S), '#ffe6b0');
        LAMPS.push({ x: lx, y: ly + 1.6 * S, S, q, seed: LAMPS.length * 3.7 });
      }
    }

    // ---- STANDING WATER ----
    // Where the camber has given up. Baked as a darker, smoother patch;
    // what it holds is put back every frame.
    for (let i = 0; i < 11; i++) {
      const q = 0.09 + G.hash(i, 3) * 0.78;
      const S = S_OF(q), y = Y_OF(q);
      const wx = (G.hash(i, 7) * 2 - 1) * 66;
      const x = VX + wx * S, rw = (7 + G.hash(i, 11) * 16) * S, rh = Math.max(0.5, rw * 0.22);
      if (y > G.H + 6) continue;
      G.fe(b, x, y, rw, rh, G.mix('#4a5a76', '#2a3348', G.clamp(q * 1.3, 0, 0.8)));
      G.fe(b, x, y - rh * 0.3, rw * 0.86, rh * 0.5, G.mix('#6b7e9c', '#33405c', q));
      PUDDLES.push({ x, y, rw, rh, q, seed: i * 5.1 });
    }
    return c;
  }

  // ---- and what moves in it ----
  // The lamps flicker, the rain comes in at an angle, the road hands
  // the light back, and there is steam off a grate because there always
  // is. None of this is baked: it is the whole reason the shot is alive.
  function streetLive(g, t) {
    // the light each lamp is throwing, and the pool of it on the wet
    for (const L of LAMPS) {
      const dying = L.seed > 16 && L.seed < 20;
      const fl = 0.8 + Math.sin(t * 2.1 + L.seed) * 0.12
        + (dying && Math.sin(t * 27 + L.seed) > 0.72 ? -0.55 : 0);
      const r = 22 * L.S + 7;
      // G.glow lays down 0.035 alpha a ring, so half strength on a lamp
      // is a lamp you cannot find. These ARE the light in this picture.
      G.glow(g, L.x, L.y, r * 2.6, r * 2.0, '#ffbe6a', 1.7 * fl);
      G.glow(g, L.x, L.y, r * 1.1, r * 0.9, '#fff2d0', 1.3 * fl);
      G.Rq(g, L.x - 1.4 * L.S, L.y - 1 * L.S, Math.max(0.5, 2.8 * L.S),
        Math.max(0.5, 2 * L.S), fl > 0.5 ? '#fff0c8' : '#6b5230');
      // the cone it drops onto the road, widening as it falls
      const gy = Y_OF(L.q);
      g.globalAlpha = 0.085 * fl;
      for (let k = 0; k < 14; k++) {
        const p = k / 14, w = (2 + p * 18) * L.S;
        G.Rq(g, L.x - w / 2, L.y + p * (gy - L.y), w, (gy - L.y) / 14 + 0.25, '#ffd89a');
      }
      g.globalAlpha = 1;
      // THE POOL. Where the cone lands is the brightest patch of road on
      // the street, and it is the thing that tells you the road is wet.
      g.globalAlpha = 0.3 * fl;
      G.fe(g, L.x, gy, 13 * L.S, 3.2 * L.S, '#c8a468');
      g.globalAlpha = 0.5 * fl;
      G.fe(g, L.x, gy, 7 * L.S, 1.7 * L.S, '#ffdca0');
      g.globalAlpha = 1;
      // and what the water gives back: broken bars, not a mirror
      if (L.S > 0.25) {
        g.globalAlpha = 0.42 * fl;
        for (let k = 0; k < 9; k++) {
          const ry = gy + k * 1.6 * L.S;
          if (ry > G.H) break;
          const wob = Math.sin(t * 1.7 + k * 0.9 + L.seed) * 1.6 * L.S;
          G.Rq(g, L.x - 1.6 * L.S + wob, ry, Math.max(0.25, 3.2 * L.S),
            Math.max(0.25, 0.9 * L.S), k < 3 ? '#ffcf8a' : '#c08a4a');
        }
        g.globalAlpha = 1;
      }
    }
    // the haze at the end of the street, which is what makes it a
    // street going somewhere rather than a corridor with a wall on it
    G.glow(g, VX, HZ + 4, 150, 44, '#6b6a86', 0.9);
    G.glow(g, VX, HZ + 2, 64, 22, '#a09ab0', 0.7);
    // a dead traffic light, still doing its amber, a long way down
    const ta = Math.sin(t * 2.6) > 0;
    // on the right-hand kerb rather than at the vanishing point, which
    // is where the mascot's head is
    const tq = 0.30, tS = S_OF(tq), tgy = Y_OF(tq);
    const tx = VX + 82 * tS, thy = tgy - 26 * tS;
    G.Rq(g, tx - 0.5 * tS, thy, Math.max(0.5, tS), tgy - thy, '#221d2c');
    G.Rq(g, tx - 1.6 * tS, thy - 5 * tS, 3.2 * tS, 5.5 * tS, '#191622');
    G.Rq(g, tx - 0.8 * tS, thy - 4 * tS, 1.6 * tS, 1.6 * tS, ta ? '#ffb03a' : '#3a2a14');
    if (ta) G.glow(g, tx, thy - 3 * tS, 22, 20, '#ffb03a', 1.2);

    // the water, shivering
    for (const P2 of PUDDLES) {
      g.globalAlpha = 0.2;
      for (let k = 0; k < 3; k++) {
        const wob = Math.sin(t * 2.2 + k * 2.1 + P2.seed) * P2.rw * 0.2;
        G.Rq(g, P2.x - P2.rw * 0.6 + wob, P2.y - P2.rh * 0.4 + k * P2.rh * 0.5,
          P2.rw * 1.2, 0.25, '#5a7a9a');
      }
      g.globalAlpha = 1;
      // A ring per puddle read as a crop circle: a perfect ellipse
      // outline is the one shape standing water never makes. A drop
      // makes a short bright dash that spreads and dies instead.
      const rp = ((t * 0.9 + P2.seed) % 1);
      if (rp < 0.45) {
        g.globalAlpha = (1 - rp / 0.45) * 0.5;
        const rw = Math.max(0.5, rp * P2.rw * 1.3);
        G.Rq(g, P2.x - rw, P2.y - P2.rh * 0.2, rw * 2, 0.25, '#9fb8d4');
        g.globalAlpha = 1;
      }
    }

    // steam off a grate, because the city is still warm underneath
    g.globalAlpha = 0.1;
    for (let i = 0; i < 13; i++) {
      const p = ((t * 0.18 + G.hash(i, 23)) % 1);
      G.fe(g, 112 + Math.sin(p * 3 + i) * 9, 128 - p * 42, 7 + p * 16, 4 + p * 11, '#7a7488');
    }
    g.globalAlpha = 1;

    // ---- THE RAIN ----
    // Two layers at different speeds so the street has depth in it, and
    // it comes in on the wind rather than straight down.
    // THREE layers, and it falls across the whole frame. Rain that
    // starts below the rooftops is a sprinkler; rain you can see against
    // the sky is weather.
    for (let layer = 0; layer < 3; layer++) {
      const n = [70, 150, 90][layer];
      const sp = [120, 300, 540][layer];
      const len = [3.5, 7, 13][layer];
      const col = ['#3f5878', '#7f9ac0', '#c8dcf4'][layer];
      const wid = [0.25, 0.25, 0.5][layer];
      const alp = [0.34, 0.6, 0.72][layer];
      for (let i = 0; i < n; i++) {
        const s = G.hash(i * 3.1 + layer * 17, 7.7);
        const y = ((G.hash(i, 2 + layer) * 280 + t * (sp + s * sp * 0.6)) % 260) - 50;
        const x = ((s * 420 + y * 0.44 + layer * 37) % 400) - 40;
        g.globalAlpha = alp;
        G.Rq(g, x, y, wid, len * (0.6 + s * 0.8), col);
        g.globalAlpha = 1;
      }
    }
    // and the drops that pass through a lamp, which are the bright ones
    for (const L of LAMPS) {
      if (L.S < 0.4) continue;
      for (let i = 0; i < 8; i++) {
        const s = G.hash(i * 5.7, L.seed);
        const y = L.y + ((s * 60 + t * 260) % 56);
        const gy = Y_OF(L.q);
        if (y > gy) continue;
        g.globalAlpha = 0.8;
        G.Rq(g, L.x - 7 * L.S + s * 14 * L.S + (y - L.y) * 0.4, y, 0.25, 5, '#ffe6b8');
        g.globalAlpha = 1;
      }
    }
    // and where it lands: ticks on the tarmac, thickest near the camera
    for (let i = 0; i < 46; i++) {
      const ph = ((t * 2.4 + G.hash(i, 31) * 3) % 1);
      if (ph > 0.32) continue;
      const q = 0.06 + G.hash(i, 37) * 0.82;
      const S = S_OF(q), y = Y_OF(q);
      const x = VX + (G.hash(i, 41) * 2 - 1) * ROAD * S;
      if (y > G.H) continue;
      const r = ph / 0.32;
      g.globalAlpha = (1 - r) * 0.5;
      G.Rq(g, x - r * 2 * S, y, Math.max(0.25, r * 4 * S), 0.25, '#8aa4c0');
      g.globalAlpha = 1;
    }
    // one sheet of it blowing through, so the wind is visible
    g.globalAlpha = 0.05 + Math.max(0, Math.sin(t * 0.5)) * 0.07;
    G.R(g, 0, 0, G.W, G.H, '#6b84a8');
    g.globalAlpha = 1;
  }

  // your own reflection, which is broken bars of you in the standing
  // water rather than a mirror, because that is what wet tarmac does
  function mooReflection(g, cx, footY, t) {
    const cols = ['#f2e4c4', '#c8383a', '#f2e4c4', '#ffb03a', '#8a6a48', '#c8383a'];
    g.globalAlpha = 0.3;
    for (let k = 0; k < 13; k++) {
      const p = k / 13;
      const wob = Math.sin(t * 1.9 + k * 0.8) * (1 + p * 4);
      const w = (13 - p * 7);
      g.globalAlpha = (1 - p) * 0.3;
      G.Rq(g, cx - w / 2 + wob, footY + 1 + k * 1.25, w, 0.75,
        G.mix(cols[k % cols.length], '#101828', 0.42 + p * 0.4));
    }
    g.globalAlpha = 1;
  }

  // ------------------------------------------------------------
  // A DATA CHIP.
  //
  // Board stock with the corners knocked off, a keying notch cut out of
  // the top left so it can only go in one way up, gold contact fingers
  // along the bottom edge and a status LED. An unused chip is the same
  // card in grey stock with nothing etched on it yet.
  // ------------------------------------------------------------
  function chipCard(g, x, y, w, h, n, sum, o) {
    o = o || {};
    const t = o.t || 0;
    const hot = G.clamp(o.hot || 0, 0, 1);
    const used = !!sum;
    const body = used ? G.mix('#123326', '#1e5a3c', hot * 0.55)
                      : G.mix('#20242f', '#2f3545', hot * 0.5);
    const edge = used ? G.mix('#2f7a52', '#7ae0a8', hot) : G.mix('#3a4152', '#6b7488', hot);
    const gold = G.mix('#9a7a2a', '#ffd45a', hot * 0.8);
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    // a shadow under it that grows as it lifts off the rail
    g.globalAlpha = 0.42;
    G.rr2(g, x + 2 + hot * 2, y + h + 1 + hot * 3, w - 4, 3, '#05070c');
    g.globalAlpha = 1;
    // the card
    G.rr2(g, x - 1, y - 1, w + 2, h + 2, '#05070c');
    G.rr2(g, x, y, w, h, body);
    G.bevelq(g, x + 1, y + 1, w - 2, h - 2, G.shade(body, 0.5), G.shade(body, -0.45));
    // the keying notch, top left
    G.R(g, x, y, 7, 4, '#05070c');
    G.R(g, x + 1, y + 1, 5, 3, G.shade(body, -0.6));
    // silkscreen: a few traces wandering up out of the contacts
    for (let i = 0; i < 5; i++) {
      const tx = x + 12 + i * 15;
      const th = 5 + ((i * 7) % 4) * 3;
      G.Rq(g, tx, y + h - 5 - th, 0.5, th, G.mix(body, gold, 0.3));
      G.Rq(g, tx, y + h - 5 - th, 4 + (i % 3) * 3, 0.5, G.mix(body, gold, 0.3));
    }
    // the contact fingers along the bottom lip
    G.R(g, x + 5, y + h - 4, w - 10, 4, G.shade(body, -0.55));
    for (let i = 0; i * 6 < w - 12; i++)
      G.Rh(g, x + 7 + i * 6, y + h - 3.5, 4, 3, gold);
    G.hairq(g, x + 5, y + h - 4, w - 10, G.shade(gold, 0.3));
    // the slot number, etched into the board
    G.text(g, '0' + (n + 1), x + w - 4, y + 3, G.mix(edge, body, 0.35),
      { align: 'right', sc: 0.5 });
    // status LED
    const led = used ? (Math.sin(t * 2.2 + n) > -0.5 ? '#5cffa8' : '#1e6b48') : '#3a2020';
    G.Rq(g, x + 4, y + 5.5, 2, 2, '#05070c');
    G.Rq(g, x + 4.25, y + 5.75, 1.5, 1.5, led);
    if (used) G.glow(g, x + 5, y + 6.5, 12, 10, '#5cffa8', 0.35 + hot * 0.3);

    if (used) {
      // the chapter and the money share a row, so the name is measured
      // against what is actually left rather than the whole card
      const cash = '$' + sum.money;
      let ch = sum.chapter;
      const room = w - 16 - G.tw(cash, 0.5);
      while (G.tw(ch, 0.5) > room && ch.length > 3) ch = ch.slice(0, -1);
      G.text(g, 'SHIFT ' + sum.day, x + 9, y + 4, '#dff6e4');
      G.text(g, cash, x + w - 4, y + 11, '#ffd45a', { align: 'right', sc: 0.5 });
      G.text(g, ch, x + 6, y + 11, '#a88ad8', { sc: 0.5 });
      G.text(g, sum.crew + ' RESCUED  ' + sum.eggs + '/' + G.EGGS.length + ' SECRETS',
        x + 6, y + 16, '#7f96a8', { sc: 0.5 });
      // a pip per pit built, and the heat on the far right
      for (let i = 0; i < 5; i++)
        G.Rq(g, x + 6 + i * 4, y + 22, 2.5, 2.5, i < sum.pits ? '#b6ff3a' : '#1c2a22');
      G.text(g, 'HEAT ' + sum.heat + '%', x + w - 4, y + 21,
        sum.heat > 60 ? '#ff5a8a' : '#6b8a72', { align: 'right', sc: 0.5 });
    } else {
      G.text(g, 'NO DATA', x + w / 2, y + 7, G.mix('#5a6478', '#9fb0c8', hot),
        { align: 'center' });
      G.text(g, 'BLANK STOCK  ·  START A RUN', x + w / 2, y + 17,
        G.mix('#39414f', '#6b7488', hot), { align: 'center', sc: 0.5 });
      // scratches, because it has been in a drawer
      for (let i = 0; i < 4; i++)
        G.Rq(g, x + 12 + G.hash(i, n + 3) * (w - 30), y + 6 + G.hash(i, 9) * 18,
          3 + G.hash(i, 5) * 7, 0.25, G.shade(body, 0.25));
    }
    // brackets, when it is the one you are holding
    if (o.pick) {
      const L = 6;
      for (const [ox, oy, sx, sy] of [[x - 2, y - 2, 1, 1], [x + w + 2, y - 2, -1, 1],
                                      [x - 2, y + h + 2, 1, -1], [x + w + 2, y + h + 2, -1, -1]]) {
        G.Rq(g, sx > 0 ? ox : ox - L, sy > 0 ? oy : oy - 0.5, L, 0.5, '#b6ff3a');
        G.Rq(g, sx > 0 ? ox : ox - 0.5, sy > 0 ? oy : oy - L, 0.5, L, '#b6ff3a');
      }
    }
  }

  // ---- the layout ----
  const CHIP_W = 92, CHIP_H = 30, CHIP_Y = 147;
  const CHIP_X = [8, 114, 220];
  const PLAY_B = { x: 121, y: 126, w: 78, h: 15 };
  const MOO = { x: 160, y: 116, s: 0.95 };
  const TABS = [{ id: 'quests', lab: 'QUESTS' }, { id: 'story', lab: 'THE STORY' },
                { id: 'eggs', lab: 'SECRETS' }];

  // ---- THE BOOT, in seconds off one clock ----
  // The chip comes off the rail, flies to your head, the panel opens,
  // it seats, the panel shuts and you come up. Everything below reads
  // this clock rather than owning a phase, so the hatch can start
  // opening while the chip is still in the air.
  const T_LIFT = 0.32, T_FLY = 0.94, T_SEAT = 1.24, T_SHUT = 1.48,
        T_SURGE = 2.28, T_OUT = 2.72;

  G.scenes.title = {
    enter() {
      this.t = 0; this.panel = null; this.confirm = false; this.boot = null;
      this.erase = false; this.bits = [];
      G.readSlots();
      this.sel = G.lastSlot();
      if (this.sel < 0) this.sel = 0;
      // selecting a chip loads it, so the face and the panels are
      // showing the real run rather than a fresh one
      this.pickSlot(this.sel, true);
      if (!streetBuf) streetBuf = buildStreet();
      G.audio.music('title');
      G.steam.length = 0;
    },

    // Loading a slot costs nothing and commits nothing: the disk is only
    // written on the next autosave, so browsing the chips is free.
    pickSlot(i, quiet) {
      this.sel = i;
      this.erase = false;
      if (G.slotUsed(i)) G.loadSlot(i);
      else { G.reset(); G.slot = i; }
      if (!quiet) G.audio.sfx('clack');
    },
    chipRect(i) { return { x: CHIP_X[i], y: CHIP_Y, w: CHIP_W, h: CHIP_H }; },
    tabRect(i) { return { x: 258, y: 16 + i * 14, w: 54, h: 12 }; },
    showTabs() {
      if (!G.slotUsed(this.sel)) return [];
      return TABS.filter((tb) => tb.id === 'eggs'
        ? (G.state.eggs || []).length : G.unlocked(tb.id));
    },

    // ---------- input ----------
    onDown(x, y) {
      if (this.boot) {                             // tap through the boot
        if (this.boot.t < T_SHUT) this.boot.t = T_SHUT;
        return;
      }
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
      // ---- erasing a chip, behind a confirm on the chip itself ----
      if (this.erase) {
        const r = this.chipRect(this.sel);
        if (G.inRect(x, y, r.x + 8, r.y + 13, 34, 12)) {
          G.audio.sfx('denied'); G.wipeSlot(this.sel); this.pickSlot(this.sel, true);
          G.toast('CHIP ' + (this.sel + 1) + ' WIPED', '#ff7ab8');
          return;
        }
        if (G.inRect(x, y, r.x + 50, r.y + 13, 34, 12)) { this.erase = false; G.audio.sfx('back'); return; }
        return;
      }
      // ---- the wipe tab ----
      // It HANGS OFF the top of the chip, so it has to be tested before
      // the chips and on its own: nested inside the chip's own hit box
      // it was drawn eight pixels above anything clickable.
      if (G.slotUsed(this.sel)) {
        const r = this.chipRect(this.sel);
        if (G.inRect(x, y, r.x + r.w - 17, r.y - 17, 19, 16)) {
          this.erase = true; G.audio.sfx('menu'); return;
        }
      }
      // ---- the chips ----
      for (let i = 0; i < G.SLOTS; i++) {
        const r = this.chipRect(i);
        if (!G.inRect(x, y, r.x - 2, r.y - 6, r.w + 4, r.h + 8)) continue;
        if (i === this.sel) { this.start(); return; }   // tap it twice to go
        this.pickSlot(i);
        return;
      }
      // ---- PLAY ----
      if (G.inRect(x, y, PLAY_B.x, PLAY_B.y, PLAY_B.w, PLAY_B.h)) { this.start(); return; }
      // ---- the side tabs ----
      const tabs = this.showTabs();
      for (let i = 0; i < tabs.length; i++) {
        const r = this.tabRect(i);
        if (!G.inRect(x, y, r.x, r.y, r.w, r.h)) continue;
        G.audio.sfx('menu');
        if (tabs[i].id === 'quests')
          for (const q of G.checkQuests()) G.toast('QUEST: ' + q.name + '  +$' + q.pay, P.lime);
        G.toasts.length = 0;
        this.panel = tabs[i].id;
        return;
      }
      // ---- and your own crown, for anyone who prods the mascot ----
      if (G.slotUsed(this.sel) && G.inRect(x, y, MOO.x - 16, MOO.y - 50, 32, 50)) {
        G.audio.sfx('clack');
        G.showEgg(G.findEgg('e_swirl'));
      }
    },

    start() {
      if (this.boot) return;
      this.boot = { t: 0, i: this.sel, fresh: !G.slotUsed(this.sel), banged: false, lit: false };
      G.audio.sfx('servo');
    },

    update(dt) {
      this.t += dt;
      if (this.boot) {
        const b = this.boot;
        b.t += dt;
        if (!b.banged && b.t >= T_SHUT) {
          b.banged = true; G.audio.sfx('clank'); G.shake(2, 0.18);
        }
        if (!b.lit && b.t >= T_SHUT + 0.16) {
          b.lit = true;
          G.audio.sfx(b.fresh ? 'boot' : 'unlock');
          G.screenFlash('#ffd9a0', 0.22);
          // the juice layer only draws sparks inside a camera transform,
          // and this scene has no camera, so it keeps its own
          for (let i = 0; i < 20; i++)
            this.bits.push({ x: MOO.x + G.rand(-13, 13), y: MOO.y - 42 + G.rand(-9, 7),
              vx: G.rand(-46, 46), vy: G.rand(-76, -12), t: 0, life: G.rand(0.3, 0.8),
              col: G.pick(['#ffd45a', '#ffbe6a', '#fff2a8']) });
        }
        if (b.t >= T_OUT) {
          const fresh = b.fresh;
          this.boot = null;
          if (fresh) { G.reset(); G.slot = b.i; G.go('floor', 'MOO-BOT'); }
          else {
            G.newDayStats(); G.state.today.demand = G.rollDemand();
            G.go('day', 'DAY ' + G.state.day);
          }
          return;
        }
      }
      for (let i = this.bits.length - 1; i >= 0; i--) {
        const s = this.bits[i];
        s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 190 * dt;
        if (s.t > s.life) this.bits.splice(i, 1);
      }
      G.updateSteam(dt);
    },

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

    // ---------- draw ----------
    draw(gg) {
      const t = this.t;
      const b = this.boot;
      const bt = b ? b.t : 0;
      G.toastY = 40; G.toastCX = 160;

      // ---- the street ----
      gg.save();
      gg.setTransform(1, 0, 0, 1, 0, 0);
      gg.drawImage(streetBuf, 0, 0);
      gg.restore();
      streetLive(gg, t);

      // ---- YOU, in the middle of it ----
      // a squash on the boot, so coming up reads in the body and not
      // only in the lights
      let sq = 0, lift = 0;
      if (b && bt > T_SHUT) {
        const k = G.clamp((bt - T_SHUT) / 0.34, 0, 1);
        sq = Math.sin(k * Math.PI) * -0.16;                  // brace, then stretch
        lift = Math.sin(G.clamp((bt - T_SHUT - 0.2) / 0.5, 0, 1) * Math.PI) * 3;
      }
      // he was floating: a figure with nothing under it reads as a
      // sticker, however good the rig is
      gg.globalAlpha = 0.5;
      G.fe(gg, MOO.x, MOO.y + 1, 15, 3, '#0c1018');
      gg.globalAlpha = 0.3;
      G.fe(gg, MOO.x, MOO.y + 1, 21, 4, '#121722');
      gg.globalAlpha = 1;
      mooReflection(gg, MOO.x, MOO.y, t);
      // the street is behind him and every lamp on it is pointed this
      // way, so he comes with a cold edge and a warm haze round him
      G.glow(gg, MOO.x, MOO.y - 24, 74, 62, '#6b7ea8', 0.5);
      const m = G.drawBot(gg, 'player', MOO.x, MOO.y - lift, MOO.s, {
        t, mood: 'idle', walk: 0, clip: 'idle', ct: t, sq, noBlink: b ? 1 : 0,
      });

      // ---- the panel in the side of your head ----
      // Everything this machine has ever been told arrived through this
      // slot, which is where the last chip went in.
      // hh is HALF the skull, so the chin is headTop + 2*hh. The panel
      // goes low and outboard -- under the ear can, beside the muzzle.
      // Taken off the head centre it sat squarely on his face.
      const hh = Math.max(4, m.headY - m.headTop);
      const slot = {
        w: Math.max(4, Math.round(m.hw * 0.36)),
        h: Math.max(3, Math.round(hh * 0.34)),
        x: MOO.x + Math.round(m.hw * 0.44),
        y: m.headTop + Math.round(hh * 1.42) - lift,
      };
      let open = 0;
      if (b) {
        if (bt < T_FLY - 0.06) open = G.clamp((bt - (T_FLY - 0.36)) / 0.30, 0, 1);
        else if (bt < T_SEAT) open = 1;
        else open = 1 - G.clamp((bt - T_SEAT) / (T_SHUT - T_SEAT), 0, 1);
      }
      // A SHUTTER, not a lid. A panel that lifts off leaves a pale slab
      // hanging in front of his face at this size; two halves parting
      // reads as a slot opening and costs six pixels.
      // Shut, it is a seam in his cheek, not a hole: a hard black frame
      // on a cream face reads as a sticking plaster. The frame only goes
      // black as the thing actually opens.
      const CR = '#f2e4c4';
      const frame = G.mix('#b8a68a', '#0d0a12', Math.min(1, open * 3));
      G.R(gg, slot.x - 1, slot.y - 1, slot.w + 2, slot.h + 2, frame);
      G.R(gg, slot.x, slot.y, slot.w, slot.h, open > 0.03 ? '#05070c' : CR);
      const oh = open * slot.h;
      const half = Math.max(0, (slot.h - oh) / 2);
      if (half > 0.1) {
        G.Rh(gg, slot.x, slot.y, slot.w, half, CR);
        G.Rh(gg, slot.x, slot.y + slot.h - half, slot.w, half, CR);
        G.hairq(gg, slot.x, slot.y + half - 0.25, slot.w, '#9a8a70');
        G.hairq(gg, slot.x, slot.y + slot.h - half, slot.w, '#fffaf0');
      }
      if (open > 0.03) {
        G.Rq(gg, slot.x, slot.y + slot.h - half - 0.5, slot.w, 0.5,
          G.mix('#3a2a14', '#ffc46a', open));
        G.glow(gg, slot.x + slot.w / 2, slot.y + slot.h / 2, 18, 13, '#ffbe6a', 1.1 * open);
      }

      // ---- the chip, in the air ----
      if (b && bt > T_LIFT && bt < T_SEAT) {
        const p = G.clamp((bt - T_LIFT) / (T_FLY - T_LIFT), 0, 1);
        const e = G.easeInOut(p);
        const r0 = this.chipRect(b.i);
        const x0 = r0.x + r0.w / 2, y0 = r0.y + r0.h / 2 - 8;
        const x1 = slot.x + slot.w / 2, y1 = slot.y + slot.h / 2;
        const seat = G.clamp((bt - T_FLY) / (T_SEAT - T_FLY), 0, 1);
        const cx = G.lerp(x0, x1, e);
        const cy = G.lerp(y0, y1, e) - Math.sin(p * Math.PI) * 15;
        // shrink EARLY. A full-size card sailing past your ear reads as
        // a billboard being thrown at you, not a chip going in.
        const sc = G.lerp(1, 0.13, Math.pow(e, 0.55)) * (1 - seat * 0.85);
        // a card shrinking on both axes at once stays a 3:1 bar all the
        // way in. The width collapses faster, and a tumble squeeze on top
        // of that, so it reads as a chip turning to go into a slot.
        const tumble = 0.34 + 0.66 * Math.abs(Math.cos(p * 7.2));
        const w = Math.max(1, CHIP_W * sc * G.lerp(1, 0.55, e) * tumble);
        const h = Math.max(1, CHIP_H * sc * G.lerp(1, 1.25, e));
        // a trail, so it reads as thrown rather than teleported
        for (let k = 1; k < 7; k++) {
          const q = G.clamp(p - k * 0.045, 0, 1), ee = G.easeInOut(q);
          gg.globalAlpha = (1 - k / 7) * 0.4;
          G.Rq(gg, G.lerp(x0, x1, ee) - 1, G.lerp(y0, y1, ee) - Math.sin(q * Math.PI) * 15 - 1,
            2, 2, k < 3 ? '#b6ff3a' : '#3f7a2a');
          gg.globalAlpha = 1;
        }
        const body = b.fresh ? '#2f3545' : '#1e5a3c';
        const cl = Math.round(cx - w / 2), ct = Math.round(cy - h / 2);
        G.rr2(gg, cl - 0.5, ct - 0.5, w + 1, h + 1, '#05070c');
        G.rr2(gg, cl, ct, w, h, body);
        // Contacts the whole way in -- but a gold band with pips cut out
        // of it is four colours inside five pixels at the end of the
        // flight, and four colours in five pixels is mud. Under ten it
        // gets one gold hair and nothing else.
        if (w > 10) {
          G.R(gg, cl + 1, ct + h - h * 0.26, w - 2, h * 0.26, '#8a6a20');
          for (let k = 0; k * 4 < w - 4; k++)
            G.Rq(gg, cl + 2 + k * 4, ct + h - h * 0.24, 2, h * 0.2, '#ffd45a');
        } else {
          G.Rh(gg, cl, ct + h - 0.5, w, 0.5, '#ffd45a');
        }
        if (w > 10) {
          G.bevelq(gg, cl + 0.5, ct + 0.5, w - 1, h - 1,
            G.shade(body, 0.5), G.shade(body, -0.4));
          G.R(gg, cl, ct, Math.min(5, w * 0.25), Math.min(3, h * 0.3), '#05070c');
          G.Rq(gg, cl + w - 3.5, ct + 1.5, 2, 2, b.fresh ? '#6b3030' : '#5cffa8');
        }
        G.glow(gg, cx, cy, w * 2.2 + 12, h * 2.2 + 12, b.fresh ? '#8ab0ff' : '#5cffa8', 0.4);
      }

      // ---- and you come up ----
      if (b && bt > T_SHUT) {
        const sg = G.clamp((bt - T_SHUT) / (T_SURGE - T_SHUT), 0, 1);
        // ON the slits, not above them: at 0.62 of a half-skull the bar
        // landed on the browline and the eyes never changed
        const vy = m.headTop + Math.round(hh * 0.78) - lift;
        const vw = Math.round(m.hw * 1.15);
        const pulse = 0.5 + Math.sin(bt * 22) * 0.3 * (1 - sg);
        // the two slits, coming up hot
        const hotC = G.mix('#ffb03a', '#fffbe8', Math.min(1, sg * 1.4 + pulse * 0.4));
        for (const sd of [-1, 1]) {
          const bx = MOO.x + sd * vw * 0.34 - vw * 0.13;
          G.Rq(gg, bx, vy, vw * 0.26, Math.max(1, hh * 0.28), hotC);
          G.glow(gg, bx + vw * 0.13, vy + 1, 20, 14, '#ffd45a', 1.4 * (0.4 + sg));
        }
        G.glow(gg, MOO.x, vy + 1, 60 * (0.5 + sg), 40 * (0.5 + sg), '#ffbe6a', 0.5 * (0.4 + sg));
        // rings going out, and the rain round him catching it
        for (let k = 0; k < 2; k++) {
          const q = ((sg * 1.6 + k * 0.5) % 1);
          if (q > 0.98) continue;
          gg.globalAlpha = (1 - q) * 0.45;
          G.oc(gg, MOO.x, vy + 4, 8 + q * 62, '#ffd9a0');
          gg.globalAlpha = 1;
        }
        gg.globalAlpha = 0.16 * (1 - sg);
        G.glow(gg, MOO.x, MOO.y - 26, 200, 150, '#ffbe6a', 1);
        gg.globalAlpha = 1;
      }
      for (const s of this.bits) {
        gg.globalAlpha = 1 - s.t / s.life;
        G.Rq(gg, s.x, s.y, 1, 1, s.col);
        gg.globalAlpha = 1;
      }

      // ---- THE SIGN ----
      G.drawNeon(gg, 160, 14, 'DOUBLE LIFE', P.magenta, t, 2);
      G.text(gg, 'SCOOP BY DAY   SABOTAGE BY NIGHT', 160, 36, P.cyanLt,
        { align: 'center', out: OUTC });

      // ---- the rack the chips sit in, and everything on it ----
      if (!b) {
        // A SCRIM, not a lid. Board green needs something behind it or
        // it fights the tarmac, but a flat wash over the bottom third
        // threw away the road, the water and every reflection in it.
        // So: a ramp that only closes up under the chips themselves.
        for (let j = 0; j < 40; j++) {
          gg.globalAlpha = Math.pow(j / 40, 1.5) * 0.82;
          G.Rh(gg, 0, 140 + j, G.W, 1, '#05070c');
          gg.globalAlpha = 1;
        }
        G.R(gg, 0, 143, G.W, 1, '#2a3446');
        G.hairq(gg, 0, 143.25, G.W, '#141c28');

        const sel = this.sel;
        const used = G.slotUsed(sel);
        // PLAY
        const lab = used ? 'CONTINUE' : 'NEW RUN';
        G.drawBtn(gg, PLAY_B.x, PLAY_B.y, PLAY_B.w, PLAY_B.h, lab,
          { col: used ? '#2f8a48' : '#a8145c' });
        G.text(gg, used ? 'CHIP ' + (sel + 1) + ' IS IN YOUR HAND'
                        : 'A BLANK CHIP. START AGAIN.', 160, PLAY_B.y - 8,
          '#8fa0bc', { align: 'center', sc: 0.5, out: OUTC });

        for (let i = 0; i < G.SLOTS; i++) {
          const r = this.chipRect(i);
          const on = i === sel;
          const hov = G.inRect(G.mouse.x, G.mouse.y, r.x - 2, r.y - 6, r.w + 4, r.h + 8);
          const hot = on ? 1 : hov ? 0.55 : 0;
          const rise = on ? 5 : hov ? 2 : 0;
          chipCard(gg, r.x, r.y - rise, r.w, r.h, i, G.slots[i], { t, hot, pick: on });
          // the way to throw one away, on the chip you are holding
          if (on && G.slots[i] && !this.erase) {
            // hung off the top edge, not laid over the face: inside the
            // card it sat on the money
            G.rr(gg, r.x + r.w - 14, r.y - rise - 9, 13, 10, '#05070c');
            G.rr(gg, r.x + r.w - 13, r.y - rise - 8, 11, 9, '#5c2030');
            G.hairq(gg, r.x + r.w - 12, r.y - rise - 7.5, 9, '#a8506a');
            G.text(gg, 'X', r.x + r.w - 7.5, r.y - rise - 6, '#ff9ab8',
              { align: 'center', sc: 0.5 });
          }
          if (on && this.erase) {
            G.R(gg, r.x + 2, r.y - rise + 2, r.w - 4, r.h - 4, '#2a1218');
            G.bevelq(gg, r.x + 2, r.y - rise + 2, r.w - 4, r.h - 4, '#8a3a52', '#0d0810');
            G.text(gg, 'WIPE CHIP ' + (i + 1) + '?', r.x + r.w / 2, r.y - rise + 4,
              '#ff7ab8', { align: 'center', sc: 0.5 });
            G.drawBtn(gg, r.x + 8, r.y - rise + 13, 34, 12, 'WIPE', { col: '#a8145c' });
            G.drawBtn(gg, r.x + 50, r.y - rise + 13, 34, 12, 'KEEP', { col: '#2a3446' });
          }
        }

        // the side tabs, for a run that has earned them
        const tabs = this.showTabs();
        for (let i = 0; i < tabs.length; i++) {
          const r = this.tabRect(i);
          const hov = G.inRect(G.mouse.x, G.mouse.y, r.x, r.y, r.w, r.h);
          gg.globalAlpha = 0.88;
          G.rr(gg, r.x, r.y, r.w, r.h, hov ? '#2a3a4c' : '#111825');
          gg.globalAlpha = 1;
          G.bevelq(gg, r.x, r.y, r.w, r.h, '#2c3a4e', '#070b12');
          G.text(gg, tabs[i].lab, r.x + r.w / 2, r.y + 3,
            hov ? '#dfeaf4' : '#6b7a90', { align: 'center', sc: 0.5 });
        }
      }

      G.drawSteam(gg);
      if (this.panel) this.drawPanel(gg, t);
      // the whiteout at the end of the boot, into the game
      if (b && bt > T_SURGE) {
        gg.globalAlpha = G.clamp((bt - T_SURGE) / (T_OUT - T_SURGE), 0, 1);
        G.R(gg, 0, 0, G.W, G.H, '#f6ecd8');
        gg.globalAlpha = 1;
      }
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

    G.now += dt;                        // wall clock every scene can read
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

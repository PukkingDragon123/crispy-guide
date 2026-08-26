// ============================================================
// DOUBLE LIFE v8 - tracy.js  ·  TRACY'S KITCHEN
//
// She got you out of the pit, bolted her own spare arm on, and now
// she is teaching you the only thing worth knowing. One pit, one
// cone, one very patient human, and her AI on a cracked tablet.
//
// This is the tutorial, and it is the warmest room in the game.
// Every step is gated, so you cannot get it wrong - you can only
// not have done it yet.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  const CNT_Y = 104;                 // the counter surface
  const PIT = { x: 30, y: 108, w: 62, h: 30 };
  const CONE_X = 132, CONE_Y = CNT_Y;
  const TRACY_X = 248, TRACY_Y = 146;

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

  const tracy = (G.scenes = G.scenes || {}).tracy = {
    enter() {
      this.t = 0;
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
      G.steam.length = 0;
      G.audio.music('title');
    },

    cur() { return STEPS[Math.min(this.step, STEPS.length - 1)]; },
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
      const st = this.cur();
      // the talky beats just advance on a tap
      if (!st.need) {
        if (st.id === 'done') { this.finish(); return; }
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
      if (G.inRect(x, y, 176, 74, 30, 24)) {
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
      this.eatT = 0.001;
      this.clap = 1;
      G.audio.sfx('good');
      G.flyCoin(TRACY_X, TRACY_Y - 50, 0);
    },
    finish() {
      G.markChapter('ch1');
      G.state.tut = 99;                        // she already taught you
      G.playCine('raid', () => G.playCine('chip', () => {
        G.newDayStats();
        G.state.today.demand = G.rollDemand();
        G.go('day', 'DAY 1');
      }));
    },

    // ---------------- update ----------------
    update(dt) {
      this.t += dt;
      this.stepT += dt;
      if (this.clauseT > 0) this.clauseT -= dt;
      if (this.clap > 0) this.clap = Math.max(0, this.clap - dt * 0.5);
      const M = G.mouse;

      // dust in the lamplight
      for (const m of this.motes) {
        m.a += dt * 0.6;
        m.x += Math.cos(m.a) * m.sp * dt;
        m.y += (Math.sin(m.a * 0.7) * m.sp * 0.6 - 2) * dt;
        if (m.y < 14) m.y = 152;
      }

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

      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p2 = this.parts[i];
        p2.t += dt; p2.x += p2.vx * dt; p2.y += p2.vy * dt; p2.vy += 180 * dt;
        if (p2.t > p2.life) this.parts.splice(i, 1);
      }
    },

    // ---------------- draw ----------------
    draw(g) {
      const t = this.t;
      G.toastY = -40;
      // ===== a warm room =====
      G.R(g, 0, 0, G.W, G.H, '#1b1410');
      // wallpaper: a faded stripe, wood dado below
      for (let x = 0; x < G.W; x += 8) {
        G.R(g, x, 0, 4, 92, '#2a1e18');
        G.R(g, x + 4, 0, 4, 92, '#251a15');
        G.vair(g, x, 0, 92, '#372620');
      }
      G.grain(g, 0, 0, G.W, 92, '#3a2a22', 0.05, 4);
      G.plate(g, -4, 88, G.W + 8, 6, '#5c4028', { r: 1, band: 2, grain: 2 });
      G.R(g, 0, 94, G.W, 26, '#3a2a1e');
      for (let x = 0; x < G.W; x += 26) G.vseam(g, x, 94, 26, '#2a1c14', '#4a3626');
      G.grain(g, 0, 94, G.W, 26, '#2a1c14', 0.07, 9);

      // a window with rain, and the city being a long way off
      G.plate(g, 214, 12, 66, 52, '#4a3626', { r: 2, band: 2, grain: 5 });
      G.R(g, 218, 16, 58, 44, '#131b28');
      for (let i = 0; i < 20; i++) {
        const s = G.hash(i, 3);
        G.Rh(g, 219 + ((s * 56 + t * 12) % 56), 17 + ((G.hash(i, 5) * 44 + t * 60) % 44), 0.5, 3, '#3a5a72');
      }
      G.Rh(g, 246, 16, 1.5, 44, '#4a3626');
      G.Rh(g, 218, 37, 58, 1.5, '#4a3626');
      G.glow(g, 247, 38, 60, 46, '#2f4a6b', 0.4);

      // her lamp, which is the whole mood
      G.Rh(g, 96, 0, 1.5, 14, '#2a1c14');
      G.plate(g, 82, 14, 30, 5, '#8a4a2a', { r: 1, band: 2 });
      for (let j = 0; j < 6; j++) {
        const w = 30 - j * 3;
        G.Rh(g, 97 - w / 2, 19 + j, w, 1, j < 2 ? '#c86a3a' : '#8a4a2a');
      }
      G.fc(g, 97, 27, 3, '#fff4c8');
      G.glow(g, 97, 30, 190, 150, '#ffb26a', 0.5);
      // and a string of little bulbs, because she is like that
      for (let i = 0; i < 9; i++) {
        const bx = 8 + i * 24, by = 8 + Math.sin(i * 0.9) * 4;
        G.Rh(g, bx, by, 1, 1.5, '#2a1c14');
        const on = Math.sin(t * 2 + i) > -0.6;
        G.fc(g, bx, by + 3, 1.6, on ? '#ffe4a0' : '#6b5230');
        if (on) G.glow(g, bx, by + 3, 14, 12, '#ffc06a', 0.4);
      }
      // shelves of jars
      for (const sy of [40, 62]) {
        G.plate(g, 8, sy, 74, 3, '#5c4028', { r: 1, band: 1, spec: false });
        for (let i = 0; i < 5; i++) {
          const jx = 12 + i * 14;
          const col = ['#c86a3a', '#8fd8c0', '#e8879a', '#ffd47a', '#b48ae0'][i];
          G.plate(g, jx, sy - 11, 10, 11, G.mix(col, '#3a2a22', 0.35), { r: 1, band: 1, spec: false });
          G.Rh(g, jx + 1, sy - 9, 8, 6, col);
          G.hair(g, jx + 1, sy - 9, 8, G.shade(col, 0.5));
          G.Rh(g, jx + 2, sy - 13, 6, 2, '#8a7458');
        }
      }
      // motes of dust
      for (const m of this.motes) {
        g.globalAlpha = 0.34;
        G.Rh(g, m.x, m.y, 1, 1, '#ffd9a0');
        g.globalAlpha = 1;
      }

      // ===== the counter =====
      G.plate(g, -4, CNT_Y, G.W + 8, 10, '#7a5638', { r: 2, band: 3, grain: 3 });
      G.hair(g, -4, CNT_Y, G.W + 8, '#b88a58');
      for (let x = 0; x < G.W; x += 18) G.vseam(g, x, CNT_Y + 2, 8, '#5c4028', '#8a6440');
      G.R(g, -4, CNT_Y + 10, G.W + 8, 4, '#4a3020');
      // a checked cloth over one end
      for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++)
        G.Rh(g, 168 + i * 5, CNT_Y - 2 + j * 4, 5, 4, (i + j) % 2 ? '#c8483a' : '#f2e4d0');

      // ===== her gelato pit, in a wooden tub =====
      G.plate(g, PIT.x - 7, PIT.y - 8, PIT.w + 14, PIT.h + 22, '#5c4028',
        { r: 2, band: 2, grain: 4, bolts: 1 });
      // steel rim round the mouth of the tub
      G.R(g, PIT.x - 4, PIT.y - 5, PIT.w + 8, PIT.h + 8, '#2a1c14');
      G.Rh(g, PIT.x - 4, PIT.y - 5, PIT.w + 8, 2, '#8a94a8');
      G.hair(g, PIT.x - 4, PIT.y - 5, PIT.w + 8, '#d8e4f0');
      for (const sd of [-1, 1]) G.vair(g, PIT.x + (sd > 0 ? PIT.w + 3 : -4), PIT.y - 4, PIT.h + 6, '#6b7f96');
      // the surface, dug where you have been
      for (let j = 0; j < 10; j++) for (let i = 0; i < 16; i++) {
        const d = this.surf[j * 16 + i];
        const cw = PIT.w / 16, chh = PIT.h / 10;
        // a soft dome across the tub, so it reads as a mass and not a swatch
        const nx = (i + 0.5) / 16 * 2 - 1, ny = (j + 0.5) / 10 * 2 - 1;
        const dome = 1 - Math.min(1, (nx * nx * 0.55 + ny * ny * 0.75));
        const lit = G.clamp(0.5 + dome * 0.5 - d * 0.55, 0, 1);
        const col = G.mix(G.shade(this.flav.col, -0.5), G.mix(this.flav.col, '#ffffff', 0.2), lit);
        G.Rh(g, PIT.x + i * cw, PIT.y + j * chh, cw + 0.5, chh + 0.5, col);
        // flecks of chocolate through it
        if (G.hash(i * 3.1, j * 2.7) > 0.9)
          G.Rh(g, PIT.x + i * cw + 1, PIT.y + j * chh + 1, 1.5, 1.5, this.flav.fleck);
      }
      // one previous scoop scar, so it looks used
      for (let k = 0; k < 3; k++)
        G.Rh(g, PIT.x + 8 + k * 16, PIT.y + 4 + (k % 2) * 3, 7, 1,
          G.shade(this.flav.col, -0.32));
      // a lit lip and a scoop resting in it
      // frost on the rim, and her label chalked on the front board
      g.globalAlpha = 0.3;
      G.Rh(g, PIT.x - 3, PIT.y - 3, PIT.w + 6, 2, '#dff0ff');
      g.globalAlpha = 1;
      G.Rh(g, PIT.x - 4, PIT.y + PIT.h + 4, PIT.w + 8, 8, '#2a1c14');
      G.text(g, 'GELATO DELLA CASA', PIT.x + PIT.w / 2, PIT.y + PIT.h + 5, '#e0c8a0',
        { align: 'center', sc: 0.5 });

      // ===== the cone stand =====
      G.plate(g, CONE_X - 12, CNT_Y - 4, 24, 5, '#5c4028', { r: 1, band: 1 });
      if (!this.build) {
        G.cone(g, CONE_X, CNT_Y - 4, { w: 15, h: 20 });
      } else {
        G.cone(g, CONE_X, CNT_Y - 4, { w: 15, h: 20 });
        let cy2 = CNT_Y - 32;
        for (let i = 0; i < this.build.scoops.length; i++) {
          G.gooScoop(g, CONE_X, cy2, 10 - i, this.flav, { t, wob: this.build.scoops[i].wob });
          cy2 -= 12;
        }
      }

      // ===== clause, on a cracked tablet propped on the counter =====
      G.plate(g, 176, 74, 30, 24, '#2a2a34', { r: 1, band: 2, bolts: 1 });
      G.R(g, 179, 77, 24, 18, '#0d1420');
      for (let j = 78; j < 94; j += 3) { g.globalAlpha = 0.12; G.Rh(g, 180, j, 22, 1, '#d97757'); g.globalAlpha = 1; }
      G.starburst(g, 191, 86, 7, t, { talk: this.clauseT > 0 });
      // the crack
      for (let i = 0; i < 8; i++) G.Rh(g, 182 + i * 2.6, 78 + Math.sin(i * 1.7) * 5, 1, 0.5, '#5c6070');
      G.Rh(g, 176, 96, 30, 3, '#1a1a22');

      // ===== Tracy =====
      this.drawTracy(g, t);

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

      // ===== the lesson =====
      this.drawTalk(g, t);
      G.grade(g, 1);
    },

    // ---- her ----
    drawTracy(g, t) {
      const x = TRACY_X, fy = TRACY_Y;
      const eat = this.eatT > 0;
      const bob = Math.sin(t * 1.6) * 0.6;
      const skin = '#d8a882', skinD = '#a87a58', hair = '#3a241c';
      const by = fy - 74 + bob;
      // legs and boots
      for (const sd of [-1, 1]) {
        G.Rh(g, x + sd * 5 - 4, by + 46, 7, 22, '#33505e');
        G.vair(g, x + sd * 5 - 4, by + 46, 22, '#4a6a7a');
        G.Rh(g, x + sd * 5 - 5, fy - 4, 9, 4, '#2a1c14');
        G.hair(g, x + sd * 5 - 5, fy - 4, 9, '#4a3626');
      }
      G.R(g, x - 12, by + 20, 24, 28, '#3f5c6b');                 // dungarees
      G.bevel(g, x - 12, by + 20, 24, 28, '#5c7f92', '#2a4450');
      G.Rh(g, x - 9, by + 22, 6, 8, '#33505e');                   // pocket
      G.Rh(g, x - 12, by + 18, 5, 6, '#5c7f92');                  // straps
      G.Rh(g, x + 7, by + 18, 5, 6, '#5c7f92');
      G.Rh(g, x - 13, by + 30, 26, 2, '#2a4450');
      // a jumper under it
      G.Rh(g, x - 13, by + 12, 26, 10, '#c8785a');
      G.hair(g, x - 13, by + 12, 26, '#e0947a');
      // arms: one holding a rag, one out for the cone
      const reach = this.build && this.build.scoops.length && !eat ? 1 : 0;
      G.Rh(g, x - 18, by + 14, 6, 16, '#c8785a');
      G.Rh(g, x - 19, by + 28, 7, 5, skin);
      const rax = x + 12 - reach * 10, ray = by + 14 + reach * 6;
      G.Rh(g, rax, ray, 6, 14 - reach * 4, '#c8785a');
      G.Rh(g, rax - 1, ray + (14 - reach * 4), 8, 5, skin);
      G.hair(g, rax - 1, ray + (14 - reach * 4), 8, '#f0c8a0');
      // head
      const hy = by - 2;
      G.R(g, x - 9, hy, 18, 18, OUT);
      G.R(g, x - 8, hy + 1, 16, 16, skin);
      G.bevel(g, x - 8, hy + 1, 16, 16, '#f0c8a0', skinD);
      // hair: a bun and a loose strand
      G.Rh(g, x - 10, hy - 2, 20, 7, hair);
      G.hair(g, x - 10, hy - 2, 20, '#5c3a2c');
      G.fc(g, x + 9, hy + 1, 4, hair);
      G.Rh(g, x - 11, hy + 3, 3, 9, hair);
      G.Rh(g, x - 12, hy + 5, 2, 5, hair);
      // eyes: kind, and tired
      const blink = Math.sin(t * 0.9) > 0.985;
      for (const sd of [-1, 1]) {
        const ex = x + sd * 4;
        if (blink) { G.Rh(g, ex - 2, hy + 8, 4, 1, skinD); continue; }
        G.Rh(g, ex - 2.5, hy + 6.5, 5, 3.5, '#f6f2e4');
        G.Rh(g, ex - 1, hy + 7, 2, 2.5, '#3a5a4a');
        G.Rh(g, ex - 0.5, hy + 7.5, 1, 1.5, '#1a1410');
        G.Rh(g, ex - 1.5, hy + 7, 1, 1, '#ffffff');
        G.Rh(g, ex - 2.5, hy + 5.5, 5, 0.5, hair);
        // the shadows under them
        g.globalAlpha = 0.3; G.Rh(g, ex - 2, hy + 10.5, 4, 1, '#8a5a4a'); g.globalAlpha = 1;
      }
      G.Rh(g, x - 0.5, hy + 10, 1, 2, skinD);
      // mouth: she is either talking, smiling or eating
      if (eat) {
        const ph = (this.eatT * 3) % 1;
        const o = 1 + Math.sin(ph * Math.PI) * 2;
        G.Rh(g, x - 2, hy + 12, 5, o, '#8a4a4a');
      } else if (this.step >= 5) {
        for (let i = 0; i < 7; i++)
          G.Rh(g, x - 3 + i, hy + 12 + Math.sin((i / 6) * Math.PI) * 1.4, 1, 1, '#8a4a4a');
      } else G.Rh(g, x - 2, hy + 12, 5, 1, '#8a4a4a');
      // the cone in her hand while she eats it
      if (eat) {
        const left = Math.max(0, 1 - this.eatT / 2.6);
        G.cone(g, rax + 3, ray + 12, { w: 10, h: 13 });
        if (left > 0.1) G.gooScoop(g, rax + 3, ray + 2, 4 + left * 5, this.flav, { t });
      }
      // her name, chalked on the counter edge
      G.text(g, 'TRACY', x, fy - 6, '#c8a884', { align: 'center', sc: 0.5 });
      if (this.clap > 0.2) {
        g.globalAlpha = this.clap;
        for (let i = 0; i < 5; i++) {
          const a2 = t * 4 + i;
          G.Rh(g, x + Math.cos(a2) * 22, hy + 4 + Math.sin(a2) * 14, 1.5, 1.5, '#ffd47a');
        }
        g.globalAlpha = 1;
      }
    },

    // ---- what she is saying, and what you have to do ----
    drawTalk(g, t) {
      const st = this.cur();
      // her line, in a warm speech card
      const bw = 200, bx = 14, by = 150;
      G.plate(g, bx, by, bw, 26, '#2e1f16',
        { r: 2, band: 2, lit: '#432d20', dk: '#170f0a', spec: false });
      G.R(g, bx + 2, by + 2, bw - 4, 1, '#c8783a');
      G.text(g, 'TRACY', bx + 5, by + 4, '#c8783a', { sc: 0.5 });
      const shown = Math.floor(this.stepT * 34);
      G.text(g, st.say.slice(0, shown), bx + 5, by + 12, '#f2e4d0', { sc: 0.5 });
      if (shown < st.say.length && Math.sin(t * 18) > 0)
        G.text(g, '_', bx + 5 + G.tw(st.say.slice(0, shown), 0.5), by + 12, '#f2e4d0', { sc: 0.5 });
      // what to do, if anything
      if (st.hint && this.stepT > 0.9) {
        const fl = Math.sin(t * 4) > 0;
        G.plate(g, 220, 150, 96, 26, '#1a2418', { r: 2, band: 2, spec: false });
        G.R(g, 222, 152, 92, 1, P.lime);
        G.text(g, 'DO THIS', 224, 154, '#6b8a4a', { sc: 0.5 });
        G.text(g, st.hint, 224, 162, fl ? '#dfffcf' : '#8ab06a', { sc: 0.5 });
      } else if (!st.need && this.stepT > 0.8) {
        G.text(g, st.id === 'done' ? 'TAP TO GO ON' : 'TAP', 268, 162,
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
        G.Rh(g, 118 + i * 6, 144, 4, 3, i < this.step ? '#c8783a' : i === this.step ? '#ffd47a' : '#3a2a22');
    },
  };
})();

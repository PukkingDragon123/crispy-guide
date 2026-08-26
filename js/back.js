// ============================================================
// DOUBLE LIFE v6 - back.js  ·  THE BACK ROOM
//
// The room behind the café, and the only place you are alone. You
// walk it. Four machines and a wall of faces, laid out left to
// right, and you have to go and stand at a thing before you can
// use it. The panels themselves are the lab's, borrowed - this
// scene is the room they live in.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  const ROOM_W = 620;                 // wider than the screen; the camera follows
  const FLOOR = 138;                  // where feet land
  const WALK_LO = 16, WALK_HI = ROOM_W - 16;

  // every station: where it is, how close you must be, what it opens
  const STATIONS = [
    { id: 'up',    x: 26,  r: 22, name: 'UP TO THE FLOOR', verb: 'CLIMB',    tab: -1 },
    { id: 'term',  x: 118, r: 26, name: 'THE TERMINAL',    verb: 'ORDER',    tab: 0 },
    { id: 'mixer', x: 232, r: 30, name: 'THE MIXER',       verb: 'MIX',      tab: 1 },
    { id: 'cold',  x: 344, r: 28, name: 'THE COLD ROOM',   verb: 'LOAD',     tab: 2 },
    { id: 'wall',  x: 440, r: 24, name: 'THE WALL',        verb: 'LOOK',     tab: -2 },
    { id: 'down',  x: 528, r: 30, name: 'DOWN TO THE BENCH', verb: 'GO DOWN', tab: -3 },
  ];

  const back = (G.scenes = G.scenes || {}).back = {
    enter() {
      this.t = 0;
      this.px = 60; this.vx = 0; this.target = null; this.face = 1;
      this.open = null;                 // the station panel currently up
      this.step = 0;
      this.cam = 0;
      this.hint = 0;
      this.drips = [];
      for (let i = 0; i < 7; i++) this.drips.push({ x: G.rand(20, ROOM_W - 20), t: G.rand(0, 3) });
      G.steam.length = 0;
      G.audio.music('title');
      if (G.clause) { G.clause.enter('back'); }
    },

    near() {
      for (const s of STATIONS) if (Math.abs(this.px - s.x) < s.r) return s;
      return null;
    },
    camX() { return G.clamp(this.px - G.W / 2, 0, ROOM_W - G.W); },

    // ---------------- input ----------------
    onDown(x, y) {
      if (G.clause && G.clause.onDown(x, y)) return;

      // a station panel is up: its own chrome first, then the lab's
      if (this.open !== null) {
        if (G.inRect(x, y, 268, 16, 48, 13)) { this.close(); return; }
        if (this.open === -2) { this.crewDown(x, y); return; }
        if (y >= 30 && y < 149) { G.scenes.lab.onDown(x, y); return; }
        return;
      }

      if (y >= 150) {                                     // the tray
        const s = this.near();
        if (s && G.inRect(x, y, 190, 152, 92, 16)) { this.use(s); return; }
        if (G.inRect(x, y, 4, 152, 58, 16)) { G.audio.sfx('click'); G.go('day', 'THE FLOOR'); return; }
        return;
      }

      const wx = x + this.camX();
      // clicking a station walks you to it and uses it on arrival
      for (const s of STATIONS)
        if (Math.abs(wx - s.x) < s.r + 8 && y < 148) {
          if (Math.abs(this.px - s.x) < s.r) { this.use(s); return; }
          this.target = { x: s.x, then: s.id };
          return;
        }
      this.target = { x: G.clamp(wx, WALK_LO, WALK_HI), then: null };
    },

    use(s) {
      if (s.tab === -1) { G.audio.sfx('click'); G.go('day', 'THE FLOOR'); return; }
      if (s.tab === -3) { G.audio.sfx('night'); G.save(); G.go('night', 'THE WORKSHOP'); return; }
      if (s.tab === -2) { G.audio.sfx('clack'); this.open = -2; this.sel = 0; return; }
      G.audio.sfx('clack');
      const lab = G.scenes.lab;
      if (!lab.slots) lab.enter();
      lab.tab = s.tab;
      lab.scroll = 0;
      this.open = s.tab;
      if (G.clause) G.clause.at(300, 160, 166, 4, 276);
    },
    close() { G.audio.sfx('back'); this.open = null; },
    crewDown(x, y) {
      const cw = G.state.crew || [];
      for (let i = 0; i < cw.length && i < 12; i++) {
        const cx = 22 + (i % 6) * 48, cy = 40 + Math.floor(i / 6) * 54;
        if (G.inRect(x, y, cx, cy, 44, 50)) { this.sel = i; G.audio.sfx('clack'); return; }
      }
    },
    onUp() { if (this.open !== null) G.scenes.lab.onUp && G.scenes.lab.onUp(); },
    onWheel(d) { if (this.open !== null && G.scenes.lab.onWheel) G.scenes.lab.onWheel(d); },

    // ---------------- update ----------------
    update(dt) {
      this.t += dt;
      if (G.clause) G.clause.update(dt);
      G.updateSteam(dt);
      for (const d of this.drips) { d.t += dt; if (d.t > 3) d.t = 0; }
      if (this.open !== null) { if (G.scenes.lab.update) G.scenes.lab.update(dt); return; }

      // walking: accelerate toward the target, stop when you get there
      const tg = this.target;
      if (tg) {
        const dx = tg.x - this.px;
        if (Math.abs(dx) < 2) {
          this.px = tg.x; this.vx = 0;
          const then = tg.then;
          this.target = null;
          if (then) { const s = STATIONS.find((q) => q.id === then); if (s) this.use(s); }
        } else {
          this.face = dx > 0 ? 1 : -1;
          this.vx = G.lerp(this.vx, this.face * 62, Math.min(1, dt * 9));
        }
      } else this.vx = G.lerp(this.vx, 0, Math.min(1, dt * 12));
      this.px = G.clamp(this.px + this.vx * dt, WALK_LO, WALK_HI);
      if (Math.abs(this.vx) > 8) {
        this.step += Math.abs(this.vx) * dt;
        if (this.step > 13) { this.step = 0; G.audio.sfx('step'); }
      }
      this.cam = G.lerp(this.cam, this.camX(), Math.min(1, dt * 7));
      this.hint += dt;
    },

    // ---------------- draw ----------------
    draw(g) {
      const t = this.t;
      const cam = Math.round(this.cam);
      G.toastCX = 160; G.toastY = 40;
      G.R(g, 0, 0, G.W, G.H, '#0b0e16');

      g.save();
      g.translate(-cam, 0);
      this.room(g, t);
      this.player(g, t);
      g.restore();

      // ---- chrome ----
      this.hud(g, t);
      if (this.open !== null) this.panel(g, t);
      if (G.clause) { G.clause.at(300, 160, 166, 4, 276); G.clause.draw(g); }
      G.grade(g, 1);
    },

    // ===================== the room =====================
    room(g, t) {
      // ---- back wall: breeze block, damp, a strip light every so often ----
      G.R(g, 0, 0, ROOM_W, FLOOR, '#151a26');
      for (let by = 4; by < FLOOR; by += 11)
        for (let bx = 0; bx < ROOM_W; bx += 22) {
          const off = (by / 11) % 2 ? 11 : 0;
          G.Rh(g, bx + off, by, 21, 10, '#1a2030');
          G.hair(g, bx + off, by, 21, '#242c40');
          G.vair(g, bx + off, by, 10, '#232b3e');
          G.hair(g, bx + off, by + 10, 21, '#0f131d');
          if (G.hash(bx, by) > 0.9) G.grain(g, bx + off + 2, by + 2, 17, 6, '#0e1219', 0.2, bx);
        }
      // damp bloom low on the wall
      g.globalAlpha = 0.3;
      G.R(g, 0, FLOOR - 26, ROOM_W, 26, '#0d1a1c');
      g.globalAlpha = 1;
      // strip lights and their pools
      for (let lx = 60; lx < ROOM_W; lx += 120) {
        G.R(g, lx - 16, 8, 32, 4, '#2a3242');
        G.bevel(g, lx - 16, 8, 32, 4, '#465268', '#0b0e14');
        const on = G.hash(lx, 3) > 0.12 || Math.sin(t * 9 + lx) > 0;
        G.Rh(g, lx - 14, 11, 28, 1.5, on ? '#dfeaf4' : '#3a4459');
        if (on) G.glow(g, lx, 22, 90, 70, '#8fd8ff', 0.34);
      }
      // conduit and drips
      G.Rh(g, 0, 22, ROOM_W, 2, '#2a3242');
      G.hair(g, 0, 22, ROOM_W, '#48546c');
      for (const d of this.drips) {
        const p = d.t / 3;
        G.Rh(g, d.x, 24 + p * (FLOOR - 26), 0.5, 1.5, '#5fbfd8');
        if (p > 0.94) G.Rh(g, d.x - 1.5, FLOOR - 2, 4, 1, '#1d3a44');
      }

      // ---- floor ----
      G.R(g, 0, FLOOR, ROOM_W, G.H - FLOOR, '#1d2231');
      G.hair(g, 0, FLOOR, ROOM_W, '#39445c');
      for (let fx = 0; fx < ROOM_W; fx += 16) G.vseam(g, fx, FLOOR + 1, G.H - FLOOR, '#141924', '#252c3d');
      G.grain(g, 0, FLOOR, ROOM_W, G.H - FLOOR, '#121620', 0.09, 4);
      // a drain, because everything in here leaks
      G.oc(g, 300, FLOOR + 12, 7, '#0d1119');
      for (let i = -1; i < 2; i++) G.Rh(g, 294, FLOOR + 10 + i * 3, 12, 1, '#0d1119');

      this.dressing(g, t);
      this.terminal(g, t);
      this.mixer(g, t);
      this.cold(g, t);
      this.wall(g, t);
      this.stairs(g, t);
      this.hatch(g, t);

      // ---- the marker over whatever you are standing at ----
      const s = this.near();
      if (s && this.open === null) {
        const bob = Math.sin(t * 4) * 1.5;
        for (let i = 0; i < 5; i++)
          G.Rh(g, s.x - 4 + i, 34 + bob + Math.abs(i - 2), 1, 1, P.lime);
        // keep the caption inside the viewport even at the ends of the room
        const half = G.tw(s.name, 0.5) / 2;
        const lx = G.clamp(s.x, this.cam + half + 6, this.cam + G.W - half - 6);
        G.text(g, s.name, lx, 26 + bob, P.lime, { align: 'center', sc: 0.5, out: OUT });
      }
    },

    // ---- everything that is not a station, so the room feels lived in ----
    dressing(g, t) {
      // a run of shelving above the terminal, stacked with stock crates
      for (const sx of [76, 296, 402]) {
        G.plate(g, sx, 44, 76, 4, '#4a3a24', { r: 1, band: 1, spec: false, grain: 4 });
        for (const bx of [sx + 4, sx + 68]) G.plate(g, bx, 48, 4, 8, '#2e2416', { r: 1, band: 1, spec: false });
        // crates and tins on it
        for (let i = 0; i < 4; i++) {
          const cx = sx + 6 + i * 17, hh = 10 + ((i * 5 + sx) % 3) * 3;
          const col = ['#8a6a3a', '#5c6a86', '#7a5c4a', '#3f6b5c'][(i + sx) % 4];
          G.plate(g, cx, 44 - hh, 15, hh, col, { r: 1, band: 2, spec: false, bolts: 1 });
          G.Rh(g, cx + 3, 44 - hh + 3, 9, 3, G.shade(col, -0.5));
          G.hair(g, cx + 3, 44 - hh + 6, 9, G.shade(col, 0.3));
        }
      }
      // a poster: THE MACHINES ARE YOUR NEIGHBOURS, defaced
      G.plate(g, 176, 40, 44, 34, '#c8b890', { r: 1, band: 1, spec: false, grain: 5 });
      G.R(g, 178, 42, 40, 30, '#d8cba0');
      G.R(g, 180, 44, 36, 14, '#3a5a7a');
      G.drawBot(g, 'police', 198, 58, 0.22, { t, open: 0.1, mood: 'idle', walk: 0, noBlink: 1 });
      for (let i = 0; i < 3; i++) G.hair(g, 181, 61 + i * 3, 34 - i * 6, '#6b5a3a');
      // sprayed over the top
      G.line(g, 180, 68, 214, 46, '#c02040', 2);
      G.line(g, 180, 46, 214, 68, '#c02040', 2);
      G.Rh(g, 176, 40, 3, 3, '#8a2f42'); G.Rh(g, 217, 40, 3, 3, '#8a2f42');
      // a tool board with things hanging off it
      G.plate(g, 258, 40, 30, 26, '#3a2c1c', { r: 1, band: 1, spec: false, grain: 6 });
      for (let i = 0; i < 4; i++) {
        const hx = 262 + i * 7;
        G.Rh(g, hx, 43, 1, 3, '#5c6a86');
        if (i % 2) { G.Rh(g, hx - 1, 46, 3, 11, '#48546c'); G.Rh(g, hx - 2, 55, 5, 3, '#2a3242'); }
        else { G.Rh(g, hx - 0.5, 46, 2, 14, '#6b5a3a'); G.Rh(g, hx - 2, 58, 5, 2, '#8a94a8'); }
      }
      // a bucket and a mop leaning in the corner
      G.plate(g, 480, FLOOR - 12, 14, 12, '#48546c', { r: 1, band: 2 });
      G.Rh(g, 481, FLOOR - 9, 12, 3, '#2f5c6b');
      G.Rh(g, 494, FLOOR - 46, 1.5, 46, '#6b5a3a');
      G.Rh(g, 491, FLOOR - 50, 8, 6, '#8a94a8');
      // stacked sacks under the shelf
      for (let i = 0; i < 3; i++)
        G.plate(g, 386 + i * 3, FLOOR - 10 - i * 7, 26 - i * 3, 8, '#9a8a68',
          { r: 2, band: 1, spec: false, grain: i + 1 });
      // a wall clock, because the shift has an end
      G.fc(g, 66, 40, 8, '#d8d0b8');
      G.oc(g, 66, 40, 8, '#0b0e14');
      const mn = t * 0.4;
      G.Rh(g, 66 + Math.cos(mn) * 5 - 0.5, 40 + Math.sin(mn) * 5 - 0.5, 1, 1, '#2a2418');
      G.Rh(g, 66 + Math.cos(mn * 12) * 3 - 0.5, 40 + Math.sin(mn * 12) * 3 - 0.5, 1, 1, '#8a2f42');
      G.Rh(g, 65.5, 39.5, 1, 1, '#0b0e14');
    },

    // ---- the terminal you order stock from ----
    terminal(g, t) {
      const x = 118;
      // desk
      G.plate(g, x - 30, FLOOR - 22, 60, 6, '#5c4630', { r: 1, band: 2, grain: 2 });
      for (const sd of [-1, 1]) G.plate(g, x + sd * 24 - 2, FLOOR - 16, 4, 16, '#3a2c1c', { r: 1, band: 1, spec: false });
      G.Rh(g, x - 26, FLOOR - 10, 52, 1.5, '#3a2c1c');
      // tower under the desk, blinking
      G.plate(g, x + 12, FLOOR - 15, 14, 15, '#232a38', { r: 1, band: 1, vent: 1 });
      G.Rh(g, x + 14, FLOOR - 13, 2, 2, Math.sin(t * 7) > 0 ? P.lime : '#1a2a1e');
      // CRT
      const my = FLOOR - 22 - 30;
      G.plate(g, x - 22, my, 44, 32, '#c8c0a8', { r: 2, band: 2, bolts: 1, grain: 6 });
      G.R(g, x - 18, my + 3, 36, 22, '#0b1a14');
      G.bevel(g, x - 18, my + 3, 36, 22, '#0a0d12', '#e8e2cc');
      // a live shell prompt
      for (let i = 0; i < 6; i++) {
        const w = 8 + ((i * 7 + Math.floor(t * 2)) % 22);
        G.Rh(g, x - 16, my + 5 + i * 3, w, 1, i % 2 ? '#2f8a5c' : '#3affa0');
      }
      const cur = Math.sin(t * 6) > 0;
      if (cur) G.Rh(g, x - 16, my + 23, 3, 1.5, '#3affa0');
      for (let sy = my + 3; sy < my + 25; sy += 2) { g.globalAlpha = 0.12; G.Rh(g, x - 18, sy, 36, 0.5, '#000'); g.globalAlpha = 1; }
      G.glow(g, x, my + 14, 60, 44, '#3affa0', 0.4);
      // keyboard and a mug
      G.plate(g, x - 16, FLOOR - 24, 26, 4, '#2a3242', { r: 1, band: 1, spec: false });
      for (let i = 0; i < 9; i++) G.Rh(g, x - 15 + i * 2.8, FLOOR - 23.5, 2, 1, '#48546c');
      G.plate(g, x + 14, FLOOR - 27, 7, 7, '#8a3a4a', { r: 1, band: 1 });
      G.Rh(g, x + 21, FLOOR - 25, 2.5, 3, '#8a3a4a');
      G.Rh(g, x + 15, FLOOR - 26, 5, 1, '#5c2030');
      G.text(g, 'ORDER', x - 12, FLOOR - 6, '#46506b', { align: 'center', sc: 0.5 });
    },

    // ---- the mixer: hoppers, a drum, a motor ----
    mixer(g, t) {
      const x = 232;
      const spin = t * (G.scenes.lab && G.scenes.lab.churn > 0 ? 9 : 1.6);
      // frame
      G.plate(g, x - 34, FLOOR - 58, 68, 58, '#2a3040', { r: 2, band: 3, bolts: 1, notch: 1, grain: 8 });
      G.R(g, x - 30, FLOOR - 54, 60, 26, '#171c28');
      G.bevel(g, x - 30, FLOOR - 54, 60, 26, '#0b0e14', '#3c465c');
      // three hoppers on top, with what is in them
      const slots = (G.scenes.lab && G.scenes.lab.slots) || [];
      for (let i = 0; i < 3; i++) {
        const hx = x - 22 + i * 22;
        for (let j = 0; j < 9; j++) {
          const hw = 9 * (1 - j / 12);
          G.Rh(g, hx - hw, FLOOR - 66 + j, hw * 2, 1, j < 2 ? P.chrome : P.hull);
        }
        const id = slots[i];
        if (id && G.ingById(id)) G.Rh(g, hx - 5, FLOOR - 64, 10, 3, G.ingById(id).col);
        G.Rh(g, hx - 9, FLOOR - 67.5, 18, 1.5, P.chrome);
      }
      // the drum: a glass window with paddles turning behind it
      G.oc(g, x, FLOOR - 40, 15, '#0b0e14');
      G.fc(g, x, FLOOR - 40, 14, '#101620');
      for (let k = 0; k < 4; k++) {
        const a = spin + k * Math.PI / 2;
        for (let rr = 3; rr < 12; rr += 0.5)
          G.Rh(g, x + Math.cos(a) * rr - 0.5, FLOOR - 40 + Math.sin(a) * rr - 0.5, 1.5, 1, '#4a5670');
      }
      const prev = G.scenes.lab && G.scenes.lab.preview;
      if (prev) { G.fc(g, x, FLOOR - 36, 7, prev.col); G.hair(g, x - 5, FLOOR - 41, 8, G.shade(prev.col, 0.5)); }
      G.oc(g, x, FLOOR - 40, 14, P.steel);
      for (let k = 0; k < 8; k++) {
        const a = k * Math.PI / 4;
        G.Rh(g, x + Math.cos(a) * 15 - 0.5, FLOOR - 40 + Math.sin(a) * 15 - 0.5, 1, 1, '#0b0e14');
      }
      // motor, belt and a pressure dial
      G.plate(g, x + 20, FLOOR - 26, 13, 13, '#3a4459', { r: 1, band: 1, vent: 1 });
      G.fc(g, x + 26, FLOOR - 20, 4, '#12161f');
      const ang = -1.9 + Math.sin(t * 1.3) * 0.7;
      G.Rh(g, x + 26 + Math.cos(ang) * 2 - 0.5, FLOOR - 20 + Math.sin(ang) * 2 - 0.5, 1, 1, P.hazard);
      G.oc(g, x + 26, FLOOR - 20, 4, P.steel);
      G.loom(g, x + 15, FLOOR - 30, x + 21, FLOOR - 22, 2, '#12161f', '#3a4459');
      // feet
      for (const sd of [-1, 1]) G.plate(g, x + sd * 28 - 3, FLOOR - 4, 8, 4, '#232a38', { r: 1, band: 1, spec: false });
      G.text(g, 'MIX', x, FLOOR - 8, '#46506b', { align: 'center', sc: 0.5 });
    },

    // ---- the cold room door ----
    cold(g, t) {
      const x = 344;
      G.plate(g, x - 30, FLOOR - 64, 60, 64, '#39465c', { r: 2, band: 3, bolts: 1, grain: 11 });
      G.R(g, x - 25, FLOOR - 58, 50, 54, '#22303f');
      G.bevel(g, x - 25, FLOOR - 58, 50, 54, '#0e1620', '#5c6e88');
      // a frosted window with the line behind it
      G.R(g, x - 17, FLOOR - 52, 34, 20, '#7fb8c8');
      G.bevel(g, x - 17, FLOOR - 52, 34, 20, '#bfe4ee', '#3a5a66');
      const n = G.pitCount();
      for (let i = 0; i < Math.min(4, n); i++) {
        const f = G.pitFlav(i);
        G.Rh(g, x - 15 + i * 8, FLOOR - 44, 6, 9, f ? f.col : '#5c7a86');
        G.hair(g, x - 15 + i * 8, FLOOR - 44, 6, '#ffffff');
      }
      g.globalAlpha = 0.4; G.R(g, x - 17, FLOOR - 52, 34, 20, '#cfeaf2'); g.globalAlpha = 1;
      G.grain(g, x - 17, FLOOR - 52, 34, 20, '#ffffff', 0.12, 2);
      // handle, hinges, a thermometer
      G.plate(g, x + 14, FLOOR - 34, 5, 14, P.chrome, { r: 1, band: 1 });
      for (const hy of [FLOOR - 56, FLOOR - 12]) G.plate(g, x - 28, hy, 6, 6, P.steel, { r: 1, band: 1, spec: false });
      G.Rh(g, x - 6, FLOOR - 26, 12, 8, '#12161f');
      G.text(g, '-9', x, FLOOR - 25, P.cyanLt, { align: 'center', sc: 0.5 });
      // cold spilling out at the threshold
      g.globalAlpha = 0.24 + Math.sin(t * 1.6) * 0.06;
      G.R(g, x - 26, FLOOR - 8, 52, 8, '#9fd8e8');
      g.globalAlpha = 1;
      G.text(g, 'THE LINE', x, FLOOR - 8, '#46506b', { align: 'center', sc: 0.5 });
    },

    // ---- the wall of everyone you got out ----
    wall(g, t) {
      const x = 440;
      G.plate(g, x - 34, FLOOR - 62, 68, 46, '#3a2c1c', { r: 2, band: 2, grain: 3 });
      G.R(g, x - 31, FLOOR - 59, 62, 40, '#0e1219');
      // cork
      G.grain(g, x - 31, FLOOR - 59, 62, 40, '#2a2214', 0.35, 12);
      const cw = G.state.crew || [];
      if (!cw.length) {
        G.text(g, 'NOBODY YET', x, FLOOR - 42, '#3a4458', { align: 'center', sc: 0.5 });
        G.text(g, 'WATCH THE QUEUE', x, FLOOR - 36, '#31394a', { align: 'center', sc: 0.5 });
      }
      // two rows of six, spread over the whole board, with string between them
      G.Rh(g, x - 29, FLOOR - 40, 58, 0.5, '#8a7a52');
      for (let i = 0; i < cw.length && i < 12; i++) {
        const px = x - 28 + (i % 6) * 10, py = FLOOR - 57 + Math.floor(i / 6) * 20;
        const tilt = ((i * 7) % 3) - 1;
        G.Rh(g, px, py + tilt * 0.5, 8, 11, '#d8cfae');
        G.bevel(g, px, py + tilt * 0.5, 8, 11, '#f2ecd2', '#8a8060');
        const k = cw[i].kind;
        G.Rh(g, px + 1, py + 1.5 + tilt * 0.5, 6, 6, '#22303f');
        G.Rh(g, px + 2.5, py + 3 + tilt * 0.5, 3, 4,
          k === 'human' ? '#c8a184' : k === 'cat' ? '#6b6b78' : '#b8845a');
        G.Rh(g, px + 1, py + 8.5 + tilt * 0.5, 6, 1, '#8a8060');
        G.Rh(g, px + 3.5, py - 0.5 + tilt * 0.5, 1, 1, '#c02020');
      }
      // a scrap of paper with her handwriting on it
      G.Rh(g, x + 14, FLOOR - 34, 15, 13, '#e8e0c8');
      for (let i = 0; i < 4; i++) G.hair(g, x + 16, FLOOR - 31 + i * 3, 11 - (i % 2) * 4, '#6b5a3a');
      G.text(g, 'THE WALL', x, FLOOR - 8, '#46506b', { align: 'center', sc: 0.5 });
    },

    stairs(g, t) {
      const x = 26;
      for (let i = 0; i < 5; i++) {
        G.plate(g, x - 24 + i * 4, FLOOR - 8 - i * 8, 26 - i * 3, 8, '#39445c',
          { r: 1, band: 1, spec: false });
        G.hair(g, x - 24 + i * 4, FLOOR - 8 - i * 8, 26 - i * 3, '#5c6a86');
      }
      g.globalAlpha = 0.45;
      G.R(g, x - 26, FLOOR - 52, 40, 20, '#ffd47a');
      g.globalAlpha = 1;
      G.text(g, 'FLOOR', x, FLOOR - 4, '#46506b', { align: 'center', sc: 0.5 });
    },

    hatch(g, t) {
      const x = 570;
      // a stairwell cut into the floor, going down to the bench
      const w = 46;
      G.R(g, x - w / 2, FLOOR - 34, w, 34 + 10, '#060810');
      G.bevel(g, x - w / 2, FLOOR - 34, w, 44, '#2a3242', '#040609');
      // steps descending away from you
      for (let i = 0; i < 6; i++) {
        const sy = FLOOR - 30 + i * 5, iw = w - 8 - i * 4;
        G.Rh(g, x - iw / 2, sy, iw, 3, '#1d2432');
        G.hair(g, x - iw / 2, sy, iw, '#3f4a60');
        G.hair(g, x - iw / 2, sy + 3, iw, '#0a0d14');
      }
      // a handrail on the near side
      G.Rh(g, x - w / 2 - 2, FLOOR - 38, 2, 22, '#48546c');
      G.Rh(g, x + w / 2, FLOOR - 38, 2, 22, '#48546c');
      G.Rh(g, x - w / 2 - 2, FLOOR - 38, w + 4, 2, '#5c6a86');
      G.hair(g, x - w / 2 - 2, FLOOR - 38, w + 4, '#8fa0bc');
      // work light spilling up out of the hole
      g.globalAlpha = 0.22 + Math.sin(t * 2.2) * 0.05;
      G.R(g, x - w / 2 + 4, FLOOR - 30, w - 8, 26, '#ffb26a');
      g.globalAlpha = 1;
      // a hazard chevron strip at the lip
      for (let i = 0; i < 10; i++)
        G.Rh(g, x - w / 2 + i * 5, FLOOR - 42, 3, 2, i % 2 ? '#12141c' : P.hazard);
      G.text(g, 'BENCH', x, FLOOR - 50, '#46506b', { align: 'center', sc: 0.5 });
      const n = (G.state.today && G.state.today.jobs) ? G.state.today.jobs.length : 0;
      if (n) {
        G.plate(g, x - 20, FLOOR - 66, 40, 12, '#2a1420', { r: 1, band: 1, spec: false });
        G.text(g, n + ' JOB' + (n > 1 ? 'S' : '') + ' WAITING', x, FLOOR - 63, P.magentaLt,
          { align: 'center', sc: 0.5 });
        G.glow(g, x, FLOOR - 60, 52, 20, P.magenta, 0.4);
      }
    },

    // ---- you, walking ----
    player(g, t) {
      const walking = Math.abs(this.vx) > 8;
      const bob = walking ? Math.abs(Math.sin(this.step * 0.5)) * 1 : 0;
      G.drawBot(g, 'player', this.px, FLOOR + 4 - bob, 0.86, {
        t, open: 0.12, mood: 'idle', walk: walking ? this.step * 0.5 : 0, noBlink: 0,
      });
    },

    // ---- tray and the interact button ----
    hud(g, t) {
      const st = G.state;
      G.R(g, 0, 0, G.W, 16, '#0a0d14');
      G.hair(g, 0, 16, G.W, '#252c3d');
      G.plate(g, 2, 2, 52, 12, P.ink2, { r: 1, band: 1, spec: false });
      G.R(g, 6, 6, 4, 5, P.hazard);
      G.text(g, '$' + Math.round(st.moneyShown), 13, 4, P.hazard);
      G.text(g, 'THE BACK ROOM  ·  SHIFT ' + st.day, 60, 4, P.violetLt);
      const n = G.pitCount();
      const loaded = st.pits.slice(0, n).filter((p) => p && p.qty > 0).length;
      const stock = Object.keys(st.shelf).filter((k) => st.shelf[k] > 0).length;
      G.text(g, 'CREW ' + (st.crew || []).length, 214, 3, P.lime, { sc: 0.5 });
      G.text(g, 'CALLS ' + st.calls, 214, 9, P.steel, { sc: 0.5 });
      G.text(g, loaded + '/' + n + ' PITS', 262, 3, loaded ? P.lime : P.magenta, { sc: 0.5 });
      G.text(g, 'STOCK ' + stock, 262, 9, P.steel, { sc: 0.5 });

      G.R(g, 0, 150, G.W, 30, '#0c0d16');
      G.R(g, 0, 150, G.W, 1, P.violet);
      G.drawBtn(g, 4, 152, 58, 16, '< FLOOR', { col: '#2a5c6b' });
      if (this.open === null) {
        const s = this.near();
        if (s) {
          G.drawBtn(g, 190, 152, 92, 16, s.verb, { col: '#3a2a5c' });
          G.text(g, s.name, 236, 170, P.steel, { align: 'center', sc: 0.5 });
        } else G.text(g, 'TAP THE FLOOR TO WALK', 150, 157, '#46506b', { align: 'center' });
      }
    },

    // ---- a station's panel, drawn over the room ----
    panel(g, t) {
      g.globalAlpha = 0.72;
      G.R(g, 0, 0, G.W, G.H, '#05070c');
      g.globalAlpha = 1;
      const lab = G.scenes.lab;
      const titles = { 0: 'ORDER STOCK', 1: 'THE MIXER', 2: 'THE COLD ROOM' };
      G.plate(g, 4, 16, 260, 13, '#241a34', { r: 1, band: 1, spec: false });
      G.text(g, this.open === -2 ? 'THE WALL' : titles[this.open], 8, 19, P.violetLt);
      G.drawBtn(g, 268, 16, 48, 13, 'CLOSE', { col: '#5c2030' });
      if (this.open === -2) { this.crewPanel(g, t); return; }
      if (this.open === 0) lab.drawOrder(g, t);
      else if (this.open === 1) lab.drawMixer(g, t);
      else lab.drawLine(g, t);
    },

    // ---- the crew wall, in full ----
    crewPanel(g, t) {
      const cw = G.state.crew || [];
      G.plate(g, 4, 32, 312, 114, '#1a1208', { r: 2, band: 2, lit: '#2c2010', dk: '#0d0904', spec: false });
      if (!cw.length) {
        G.text(g, 'NOBODY IS ON THIS WALL YET.', 160, 76, '#6b5a3a', { align: 'center' });
        G.text(g, 'WATCH THE QUEUE. SOME OF THEM ARE NOT MACHINES.', 160, 88, '#4a4030',
          { align: 'center', sc: 0.5 });
        return;
      }
      for (let i = 0; i < cw.length && i < 12; i++) {
        const c = cw[i];
        const cx = 22 + (i % 6) * 48, cy = 40 + Math.floor(i / 6) * 54;
        const on = this.sel === i;
        // a taped photo
        G.plate(g, cx, cy, 44, 50, on ? '#e8dcb8' : '#d0c6a4', { r: 1, band: 2, spec: false, grain: i + 2 });
        G.R(g, cx + 3, cy + 3, 38, 32, '#22303f');
        G.drawCreature(g, c.kind, cx + 22, cy + 34, 0.34, { t, smile: on });
        G.text(g, c.name.slice(0, 8), cx + 22, cy + 37, '#2a2418', { align: 'center', sc: 0.5 });
        G.text(g, 'DAY ' + c.day, cx + 22, cy + 42, '#6b5a3a', { align: 'center', sc: 0.5 });
        G.Rh(g, cx + 18, cy - 1.5, 8, 3, '#c8b878');           // tape
        if (on) G.R(g, cx, cy, 44, 1, P.hazard);
      }
      const sel = cw[G.clamp(this.sel || 0, 0, cw.length - 1)];
      if (sel) {
        G.R(g, 8, 130, 304, 12, '#0d0904');
        G.text(g, sel.name + '  ·  ' + sel.desc, 12, 133, P.lime, { sc: 0.5 });
      }
    },
  };
})();

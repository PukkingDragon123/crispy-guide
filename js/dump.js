// ============================================================
// DOUBLE LIFE v8 - dump.js  ·  THE PIT
//
// The first thing you do in this game is get out of a hole, and
// you do it with one hand.
//
// You are a head and an arm on a length of spine. Press a handhold,
// the hand reaches and latches. Then PULL - drag away from the grip
// and you haul the rest of yourself up after it. The scrap shifts,
// the cable goes taut, the grip strains, and if you are greedy it
// lets go and you slide. Ratchet up the slope, handhold by
// handhold, until you are over the lip.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  const TOP = 40;                     // world y of the lip you are climbing to
  const BOT = 940;                    // world y of the bottom of the pit
  const SLOPE = 0.10;                 // how far the slope leans right per unit up
  const REACH = 78;                   // how far one arm gets from the head

  // Where the face of the scrap is at a given world y. It leans out as it
  // rises, so the whole climb stays framed without a second camera axis.
  function slopeX(wy) { return 150 + (BOT - wy) * SLOPE; }

  const dump = (G.scenes = G.scenes || {}).dump = {
    enter() {
      this.t = 0;
      this.state = 'wake';            // wake | climb | over | done
      this.wakeT = 0;
      // you
      this.hy = BOT - 30;             // head world y
      this.hx = slopeX(this.hy) + 26;
      this.hvy = 0;
      this.arm = { x: this.hx + 14, y: this.hy + 8, state: 'idle', grip: null, reach: 0 };
      this.strain = 0;
      this.pull = null;               // { gx, gy, sx, sy } when dragging
      this.slip = 0;
      this.best = this.hy;
      this.grunt = 0;
      this.shakeGrit = [];
      // handholds up the slope: rebar, tyres, cable, a fridge door
      this.holds = [];
      let y = BOT - 60;
      let i = 0;
      while (y > TOP + 20) {
        // two per band, staggered left and right: break one and the other
        // is still there. You are never left with nothing.
        this.addHold(slopeX(y) + 10 + ((i * 17) % 9), y, i);
        this.addHold(slopeX(y) + 34 + ((i * 23) % 11), y - 12 - ((i * 7) % 9), i + 3);
        y -= 40 + ((i * 11) % 14);
        i++;
      }
      // the last one is always solid: the lip itself
      this.holds.push({ x: slopeX(TOP + 30) + 16, y: TOP + 30, kind: 'lip', tough: 3, broken: false, wob: 0 });
      this.cam = this.hy - 120;
      G.steam.length = 0;
      G.audio.music('title');
      G.hideCursor = false;
    },

    addHold(x, y, i) {
      const KIND = ['rebar', 'tyre', 'cable', 'door', 'pipe'];
      this.holds.push({
        x, y, kind: KIND[i % KIND.length],
        // how much haul it takes before it gives; the good ones look it
        tough: 0.55 + ((i * 13) % 7) / 10,
        broken: false, wob: 0,
      });
    },

    // is there anything at all left to grab from here?
    anyInReach() {
      for (const h of this.holds)
        if (!h.broken && h.y < this.hy - 6 && G.dist(this.hx, this.hy, h.x, h.y) <= REACH) return true;
      return false;
    },

    // ---------- world helpers ----------
    camY() { return G.clamp(this.hy - 118, TOP - 30, BOT - 170); },
    toWorld(y) { return y + Math.round(this.cam); },
    onScreen(wy) { return wy - Math.round(this.cam); },
    progress() { return G.clamp((BOT - 30 - this.hy) / (BOT - 30 - (TOP + 30)), 0, 1); },

    // REACH is the whole shape of the climb: you can only take a hold
    // that one arm can actually get to from where your head is lying.
    holdAt(sx, sy) {
      const wy = this.toWorld(sy);
      let best = null, bd = 999;
      for (const h of this.holds) {
        if (h.broken) continue;
        if (G.dist(this.hx, this.hy, h.x, h.y) > REACH) continue;   // out of reach
        const d = G.dist(sx, wy, h.x, h.y);
        if (d < 30 && h.y < this.hy + 14 && d < bd) { bd = d; best = h; }
      }
      return best;
    },

    // ---------- input ----------
    onDown(x, y) {
      if (this.state === 'wake') { this.wakeT = 99; return; }
      if (this.state === 'over') { this.finish(); return; }
      if (this.state !== 'climb') return;
      const h = this.holdAt(x, y);
      if (!h) {
        // slapping at nothing still costs you a little dignity
        this.arm.state = 'miss'; this.arm.mx = x; this.arm.my = this.toWorld(y); this.arm.reach = 0;
        G.audio.sfx('clack');
        return;
      }
      this.arm.state = 'reach';
      this.arm.grip = h;
      this.arm.reach = 0;
      G.audio.sfx('grab');
    },

    onMove(x, y) {
      if (this.arm.state === 'grip' && G.mouse.down) {
        if (!this.pull) this.pull = { sx: x, sy: y, base: this.hy, moved: 0 };
      }
    },

    onUp() {
      if (this.arm.state === 'grip' || this.arm.state === 'reach') {
        if (this.strain > 0.05) G.audio.sfx('release');
        this.arm.state = 'idle';
        this.arm.grip = null;
      }
      this.arm.state = this.arm.state === 'miss' ? 'idle' : this.arm.state;
      this.pull = null;
      this.strain = 0;
    },

    // ---------- update ----------
    update(dt) {
      this.t += dt;
      G.updateSteam(dt);
      const M = G.mouse;

      if (this.state === 'wake') {
        this.wakeT += dt;
        if (this.wakeT > 4.6) { this.state = 'climb'; G.audio.sfx('boot'); }
        this.cam = G.lerp(this.cam, this.camY(), Math.min(1, dt * 2));
        return;
      }

      // ---- the arm ----
      const a = this.arm;
      if (a.state === 'reach') {
        a.reach = Math.min(1, a.reach + dt * 5.5);
        if (a.reach >= 1) {
          a.state = 'grip';
          G.audio.sfx('clank');
          G.shake(1.6, 0.12);
          for (let i = 0; i < 6; i++)
            this.shakeGrit.push({ x: a.grip.x + G.rand(-6, 6), y: a.grip.y + G.rand(-3, 3),
              vx: G.rand(-14, 14), vy: G.rand(4, 30), t: 0, life: G.rand(0.4, 1) });
        }
      } else if (a.state === 'miss') {
        a.reach = Math.min(1, a.reach + dt * 7);
        if (a.reach >= 1 && !M.down) a.state = 'idle';
      } else if (a.state === 'idle') {
        a.reach = Math.max(0, a.reach - dt * 4);
      }

      // ---- the haul ----
      if (a.state === 'grip' && a.grip && M.down) {
        const g2 = a.grip;
        // how far you have dragged away from the grip, on screen
        const gsx = g2.x, gsy = this.onScreen(g2.y);
        const away = G.clamp((M.y - gsy) / 60, 0, 1.6) * 0.7
                   + G.clamp((gsx - M.x) / 90, -0.3, 1) * 0.3;
        const effort = G.clamp(away, 0, 1.3);
        if (effort > 0.06) {
          // haul: the head climbs toward the grip, slower the further it is
          const gap = Math.max(6, this.hy - g2.y);
          const speed = 84 * effort * G.clamp(1 - (this.strain - 0.7) * 0.5, 0.35, 1);
          this.hy = Math.max(g2.y + 8, this.hy - speed * dt);
          this.hx = G.lerp(this.hx, g2.x + 8, Math.min(1, dt * 2.4));
          this.strain = Math.min(1.35, this.strain + dt * (0.12 + effort * 0.42));
          this.grunt -= dt;
          if (this.grunt <= 0) { this.grunt = 0.55; G.audio.sfx('strain'); }
          if (Math.random() < dt * 34)
            this.shakeGrit.push({ x: g2.x + G.rand(-10, 10), y: g2.y + G.rand(-4, 8),
              vx: G.rand(-20, 20), vy: G.rand(10, 46), t: 0, life: G.rand(0.4, 1.2) });
          g2.wob = Math.min(1, g2.wob + dt * effort * 1.4);
          // the grip gives out
          if (this.strain > g2.tough) {
            g2.broken = true;
            a.state = 'idle'; a.grip = null;
            this.strain = 0;
            this.slip = 1;
            this.hvy = 40;
            G.audio.sfx('snap');
            G.shake(4, 0.4);
            for (let i = 0; i < 20; i++)
              this.shakeGrit.push({ x: g2.x + G.rand(-12, 12), y: g2.y + G.rand(-8, 8),
                vx: G.rand(-50, 50), vy: G.rand(-20, 60), t: 0, life: G.rand(0.5, 1.4) });
          }
        } else this.strain = Math.max(0, this.strain - dt * 0.5);
      } else this.strain = Math.max(0, this.strain - dt * 0.9);

      // ---- the scrap holds you where you stop. Only a grip giving out
      // costs you height, and then it costs you properly. ----
      if (a.state !== 'grip') {
        if (this.slip > 0) {
          this.hvy = Math.min(96, this.hvy + 150 * dt);
          this.hy = Math.min(BOT - 30, this.hy + this.hvy * dt);
          if (Math.random() < dt * 40)
            this.shakeGrit.push({ x: this.hx + G.rand(-9, 9), y: this.hy + G.rand(0, 12),
              vx: G.rand(-24, 24), vy: G.rand(14, 52), t: 0, life: G.rand(0.3, 1) });
        } else this.hvy = 0;
        this.hx = G.lerp(this.hx, slopeX(this.hy) + 26, Math.min(1, dt * 1.6));
      } else this.hvy = 0;
      this.slip = Math.max(0, this.slip - dt * 1.35);

      // the highest you have been, for the meter
      this.best = Math.min(this.best, this.hy);

      // ---- nothing left within reach? the scrap shifts and gives you one.
      // You cannot get stuck in this pit. You can only be slow. ----
      if (a.state === 'idle' && !this.anyInReach()) {
        this.settleT = (this.settleT || 0) + dt;
        if (this.settleT > 1.1) {
          this.settleT = 0;
          const ny = this.hy - 44;
          this.addHold(slopeX(ny) + 16 + G.rand(-6, 10), ny, this.holds.length);
          const nh = this.holds[this.holds.length - 1];
          nh.tough = 0.95;                       // whatever slides in is solid
          G.audio.sfx('rumble');
          G.shake(3, 0.35);
          for (let k = 0; k < 26; k++)
            this.shakeGrit.push({ x: nh.x + G.rand(-16, 16), y: nh.y + G.rand(-6, 14),
              vx: G.rand(-40, 40), vy: G.rand(10, 70), t: 0, life: G.rand(0.5, 1.5) });
          G.floatText('SOMETHING SLIDES DOWN', 160, 60, '#c8b490');
        }
      } else this.settleT = 0;

      // ---- over the lip ----
      if (this.hy <= TOP + 34 && this.state === 'climb') {
        this.state = 'over';
        this.overT = 0;
        G.audio.sfx('unlock');
        G.screenFlash('#ffe4b0', 0.3);
      }
      if (this.state === 'over') {
        this.overT += dt;
        this.hy = Math.max(TOP + 6, this.hy - dt * 12);
        if (this.overT > 4.4) this.finish();
      }

      // ---- grit ----
      for (let i = this.shakeGrit.length - 1; i >= 0; i--) {
        const s = this.shakeGrit[i];
        s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 120 * dt;
        if (s.t > s.life) this.shakeGrit.splice(i, 1);
      }
      this.cam = G.lerp(this.cam, this.camY(), Math.min(1, dt * 3.4));
    },

    finish() {
      if (this.state === 'done') return;
      this.state = 'done';
      G.playCine('found', () => G.go('tracy', "TRACY'S PLACE"));
    },

    // ---------- draw ----------
    draw(g) {
      const t = this.t;
      const cam = Math.round(this.cam);
      G.toastY = -50;

      // ===== sky and the city above the pit =====
      G.R(g, 0, 0, G.W, G.H, '#0a0e18');
      const sky = this.onScreen(TOP);
      if (sky > -60) {
        g.save();
        // a bruised sky, brighter toward the lip
        for (let j = 0; j < Math.min(G.H, sky + 40); j++) {
          const p = j / Math.max(1, sky + 40);
          G.Rh(g, 0, j, G.W, 1, G.mix('#141c2e', '#2a1c2c', p));
        }
        g.restore();
        // towers on the skyline, and a patrol light sweeping
        let bx = -8;
        while (bx < 340) {
          const bw = 16 + Math.round(G.hash(bx, 3) * 26);
          const bh = 20 + Math.round(G.hash(bx + 5, 7) * 54);
          G.R(g, bx, sky - bh, bw, bh, '#0c1220');
          for (let wy = sky - bh + 5; wy < sky - 4; wy += 6)
            for (let wx = bx + 3; wx < bx + bw - 3; wx += 5)
              if (G.hash(wx, wy) > 0.7) G.Rh(g, wx, wy, 1.5, 2, '#3a4a72');
          bx += bw + 3;
        }
        const px2 = ((t * 22) % 400) - 40;
        G.Rh(g, px2, sky - 66, 6, 1.5, '#7fd8ff');
        G.glow(g, px2, sky - 65, 40, 14, '#3a9ad8', 0.5);
      }

      // ===== the heap: it fills the frame. You are inside it. =====
      G.R(g, 0, Math.max(0, sky), G.W, G.H, '#0d1016');
      const y0 = cam - 24, y1 = cam + G.H + 24;
      const SCRAP = ['#3a4459', '#5c4630', '#2f5c6b', '#6b3f22', '#48546c',
                     '#4a4a54', '#7a5c4a', '#3f6b5c'];
      for (let wy = Math.floor(y0 / 6) * 6; wy < y1; wy += 6) {
        const sy = this.onScreen(wy);
        if (sy < sky - 8) continue;
        // a band of junk right across the frame, stable per world row
        const depth = G.clamp((wy - TOP) / (BOT - TOP), 0, 1);
        // a big chunk in silhouette every so often, to break the banding
        if (G.hash(wy, 71) > 0.9) {
          const cx3 = G.hash(wy, 73) * 300 + 10, cw = 24 + G.hash(wy, 79) * 40;
          const ch = 14 + G.hash(wy, 83) * 22;
          const cc = G.mix(SCRAP[Math.floor(G.hash(wy, 89) * 8) % 8], '#07090f', 0.55 + depth * 0.2);
          G.R(g, cx3, sy - ch * 0.4, cw, ch, cc);
          G.hair(g, cx3, sy - ch * 0.4, cw, G.shade(cc, 0.5));
          G.vair(g, cx3, sy - ch * 0.4, ch, G.shade(cc, 0.3));
        }
        for (let k = 0; k < 7; k++) {
          const h1 = G.hash(wy * 1.7, k * 3.3);
          let col = SCRAP[Math.floor(G.hash(wy, k + 5) * 8) % 8];
          // it gets darker and bluer the further down the pit you are
          col = G.mix(col, '#0a0d14', 0.32 + depth * 0.34);
          if (k > 4) {
            // upright pieces: planks, bars, a chair leg. They break the barcode.
            const jx = h1 * 320 - 6;
            const jw = 2 + Math.floor(G.hash(wy, k + 23) * 4);
            const jh = 8 + G.hash(wy, k + 29) * 22;
            const tilt = (G.hash(wy, k + 31) - 0.5) * 0.5;
            for (let q = 0; q < jh; q++)
              G.Rh(g, jx + q * tilt, sy - q, jw, 1, q < 2 ? G.shade(col, 0.4) : col);
            continue;
          }
          const jx = h1 * 330 - 12;
          const jw = 10 + G.hash(wy, k + 9) * 40;
          const jh = 3 + Math.floor(G.hash(wy, k + 17) * 4);
          G.R(g, jx, sy, jw, jh, col);
          G.hair(g, jx, sy, jw, G.shade(col, 0.42));
          G.hair(g, jx, sy + jh - 0.5, jw, G.shade(col, -0.45));
          if (h1 > 0.86) G.grain(g, jx + 1, sy + 1, jw - 2, jh - 1, '#12151d', 0.2, wy + k);
        }
        // the odd recognisable thing, half buried
        const h2 = G.hash(wy, 41);
        if (h2 > 0.955) {
          const bx2 = G.hash(wy, 43) * 280 + 12;
          G.plate(g, bx2, sy - 4, 20, 9, G.mix('#8a9098', '#0a0d14', depth * 0.4),
            { r: 1, band: 1, spec: false, bolts: 1 });
        } else if (h2 > 0.92) {
          const bx2 = G.hash(wy, 47) * 290 + 8;
          G.oc(g, bx2, sy, 5, G.mix('#23252b', '#0a0d14', depth * 0.3));
        }
      }
      // the climbing lane: a soft shadow so your eye follows it up
      for (let j = Math.max(0, sky); j < G.H; j += 2) {
        const lw = 76;
        const lx = slopeX(this.toWorld(j)) - 12;
        g.globalAlpha = 0.2;
        G.Rh(g, lx - lw / 2, j, lw, 2, '#05070c');
        g.globalAlpha = 1;
      }
      // edge vignette, so the frame feels like a hole
      for (let i = 0; i < 22; i++) {
        g.globalAlpha = 0.05;
        G.R(g, i, 0, 1, G.H, '#04060a');
        G.R(g, G.W - 1 - i, 0, 1, G.H, '#04060a');
        g.globalAlpha = 1;
      }

      // ===== the handholds =====
      for (const h of this.holds) {
        const sy = this.onScreen(h.y);
        if (sy < -20 || sy > G.H + 20) continue;
        this.drawHold(g, h, sy, t);
      }

      // ===== you =====
      this.drawSelf(g, t);

      // ===== grit =====
      for (const s of this.shakeGrit) {
        const sy = this.onScreen(s.y);
        g.globalAlpha = Math.max(0, 1 - s.t / s.life) * 0.9;
        G.Rh(g, s.x, sy, 1, 1, '#6b5f4a');
        g.globalAlpha = 1;
      }

      // ===== rain, over everything =====
      for (let i = 0; i < 46; i++) {
        const s = G.hash(i * 3.1, 7.7);
        const rx = (s * 340 + t * 26 * (0.6 + s)) % 340 - 10;
        const ry = ((G.hash(i, 2) * 220 + t * (170 + s * 130)) % 220) - 20;
        G.Rh(g, rx, ry, 0.5, 3 + s * 4, '#39506b');
      }

      // ===== the chrome =====
      if (this.state === 'wake') this.drawWake(g, t);
      else if (this.state === 'over' || this.state === 'done') this.drawOver(g, t);
      else this.drawHud(g, t);
      G.grade(g, 1.5);
    },

    // ---- a handhold, by kind ----
    drawHold(g, h, sy, t) {
      const wob = h.wob > 0 ? Math.sin(t * 34) * h.wob * 1.4 : 0;
      const x = h.x + wob;
      const solid = h.tough > 0.9;
      if (h.broken) {
        // a stump and a scar where it used to be
        G.Rh(g, x - 3, sy, 6, 2, '#1a1c22');
        G.Rh(g, x - 1, sy - 1, 2, 2, '#2a2c34');
        return;
      }
      if (h.kind === 'lip') {
        // the concrete lip: a lit edge you can see from the bottom
        G.R(g, x - 30, sy - 4, 70, 8, '#3a3f4c');
        G.hair(g, x - 30, sy - 4, 70, '#6b7488');
        G.R(g, x - 30, sy + 4, 70, 4, '#22262e');
        for (let i = 0; i < 6; i++) G.rivet(g, x - 26 + i * 11, sy - 2.5, '#12141c', '#8fa0bc');
        G.glow(g, x + 6, sy - 6, 90, 30, '#ffd47a', 0.4);
        return;
      }
      if (h.kind === 'rebar') {
        G.Rh(g, x - 1, sy - 8, 2, 16, solid ? '#8a5230' : '#6b4228');
        G.vair(g, x - 1, sy - 8, 16, '#b87a44');
        G.Rh(g, x - 5, sy - 8, 10, 2, solid ? '#8a5230' : '#6b4228');
        G.hair(g, x - 5, sy - 8, 10, '#b87a44');
      } else if (h.kind === 'tyre') {
        G.oc(g, x, sy, 8, '#15161a');
        G.oc(g, x, sy, 7, '#23252b');
        G.oc(g, x, sy, 4, '#15161a');
        for (let k = 0; k < 8; k++) {
          const a2 = k * Math.PI / 4;
          G.Rh(g, x + Math.cos(a2) * 7.5 - 0.5, sy + Math.sin(a2) * 7.5 - 0.5, 1, 1, '#3a3d45');
        }
      } else if (h.kind === 'cable') {
        for (let i = 0; i < 16; i++) {
          const p = i / 15;
          G.Rh(g, x - 8 + p * 16, sy + Math.sin(p * Math.PI) * 5, 1, 1, solid ? '#2f5c6b' : '#24404a');
        }
        G.Rh(g, x - 9, sy - 1, 3, 3, '#48546c');
        G.Rh(g, x + 7, sy - 1, 3, 3, '#48546c');
      } else if (h.kind === 'door') {
        G.plate(g, x - 11, sy - 9, 22, 18, '#8a9098', { r: 1, band: 2, bolts: 1, grain: 3 });
        G.Rh(g, x + 5, sy - 2, 4, 5, P.chrome);
        G.Rh(g, x - 8, sy - 6, 12, 2, '#5c6068');
      } else {                                      // pipe
        G.Rh(g, x - 12, sy - 3, 24, 6, '#48546c');
        G.hair(g, x - 12, sy - 3, 24, '#8fa0bc');
        G.hair(g, x - 12, sy + 2.5, 24, '#181c24');
        G.Rh(g, x - 13, sy - 4, 3, 8, '#5c6a86');
        G.Rh(g, x + 10, sy - 4, 3, 8, '#5c6a86');
      }
      // in reach and above you: it lights up. Out of reach: it does not.
      const inReach = G.dist(this.hx, this.hy, h.x, h.y) <= REACH && h.y < this.hy + 14;
      if (inReach && this.state === 'climb' && this.arm.state !== 'grip') {
        const hov = G.dist(G.mouse.x, this.toWorld(G.mouse.y), h.x, h.y) < 30;
        g.globalAlpha = hov ? 0.6 + Math.sin(t * 7) * 0.25 : 0.3 + Math.sin(t * 2.4) * 0.08;
        G.oc(g, x, sy, hov ? 12 : 10, hov ? '#ffe4b0' : '#c8a060');
        g.globalAlpha = 1;
        if (hov) {
          // a hint at how solid it is, so the choice means something
          const solid = h.tough > 0.9;
          G.text(g, solid ? 'SOLID' : h.tough > 0.75 ? 'FIRM' : 'LOOSE', x, sy - 18,
            solid ? '#b6ff3a' : h.tough > 0.75 ? '#ffd47a' : '#ff7a8a',
            { align: 'center', sc: 0.5, out: OUT });
        }
      }
      if (h.wob > 0.4) {                            // dust shaking loose as it strains
        g.globalAlpha = 0.5;
        for (let i = 0; i < 3; i++)
          G.Rh(g, x + G.rand(-8, 8), sy + 6 + i * 2, 1, 1, '#6b5f4a');
        g.globalAlpha = 1;
      }
    },

    // ---- the head, the spine, the arm ----
    drawSelf(g, t) {
      const a = this.arm;
      const hsy = this.onScreen(this.hy);
      const hx = Math.round(this.hx);
      // where the hand is
      let ax = hx + 16, ay = hsy + 6;
      if (a.state === 'grip' && a.grip) { ax = a.grip.x + Math.sin(t * 30) * this.strain * 1.2; ay = this.onScreen(a.grip.y); }
      else if (a.state === 'reach' && a.grip) {
        ax = G.lerp(hx + 16, a.grip.x, G.easeOut(a.reach));
        ay = G.lerp(hsy + 6, this.onScreen(a.grip.y), G.easeOut(a.reach));
      } else if (a.state === 'miss') {
        ax = G.lerp(hx + 16, a.mx, G.easeOut(a.reach));
        ay = G.lerp(hsy + 6, this.onScreen(a.my), G.easeOut(a.reach));
      }

      // ---- the spine cable, taut under strain ----
      const taut = this.strain;
      const n = 14;
      for (let i = 0; i <= n; i++) {
        const p = i / n;
        const sag = Math.sin(p * Math.PI) * (10 - taut * 9);
        const cx2 = G.lerp(hx + 8, ax, p);
        const cy2 = G.lerp(hsy + 4, ay, p) + sag;
        G.Rh(g, cx2 - 1, cy2 - 1, 2.5, 2.5, '#1a1f2a');
        G.Rh(g, cx2 - 0.5, cy2 - 1, 1.5, 1, taut > 0.5 ? '#8fa0bc' : '#4a5670');
        if (i % 3 === 0) G.Rh(g, cx2 - 1, cy2, 2, 1, '#2e343f');
      }

      // ---- the head: the brightest thing in the pit ----
      const lean = this.strain * 2;
      const col = '#f2e4c4', col2 = '#c8b090';
      G.glow(g, hx, hsy, 60, 50, '#ffd47a', 0.22);
      G.R(g, hx - 16, hsy - 14, 32, 30, OUT);
      G.R(g, hx - 15, hsy - 13, 30, 28, col);
      G.bevel(g, hx - 15, hsy - 13, 30, 28, '#fffaf0', col2);
      G.hair(g, hx - 15, hsy - 13, 30, '#ffffff');
      G.grain(g, hx - 14, hsy - 6, 28, 18, '#b09878', 0.1, 3);
      // a chef's collar band, all that is left of the toque
      G.Rh(g, hx - 15, hsy - 13, 30, 3, '#fdf6ea');
      G.hair(g, hx - 15, hsy - 10, 30, '#c8b090');
      // a dent, and mud
      G.Rh(g, hx + 5, hsy - 8, 8, 5, '#c0a888');
      G.Rh(g, hx + 6, hsy - 7, 5, 3, '#a89070');
      g.globalAlpha = 0.42; G.Rh(g, hx - 13, hsy + 6, 20, 6, '#4a3a28'); g.globalAlpha = 1;
      // one working optic, one dead, both big
      const blink = Math.sin(t * 1.3) > 0.98;
      G.lens(g, hx - 12, hsy - 8 + lean * 0.3, 11, 11, { hue: '#ff7a9a', t, closed: blink });
      G.lens(g, hx + 1, hsy - 8 + lean * 0.3, 11, 11, { hue: '#8a94a8', t, dead: 1, noGlow: 1 });
      // and a crack across the dead one
      for (let i = 0; i < 7; i++)
        G.Rh(g, hx + 2 + i, hsy - 6 + Math.sin(i * 1.6) * 2, 1, 0.5, '#12151d');
      // a moustache, because of course
      G.Rh(g, hx - 7, hsy + 4, 14, 2, '#4a3524');
      G.Rh(g, hx - 9, hsy + 4.5, 3, 1.5, '#4a3524');
      G.Rh(g, hx + 6, hsy + 4.5, 3, 1.5, '#4a3524');
      // a mouth grille, gritted
      G.Rh(g, hx - 7, hsy + 7, 14, 4, '#2a1f2c');
      for (let i = 0; i < 5; i++) G.Rh(g, hx - 6 + i * 3, hsy + 7, 1.5, 4, '#5c4a52');
      // the torn neck, sparking
      G.Rh(g, hx - 7, hsy + 15, 14, 3, '#2a3040');
      for (let i = 0; i < 6; i++)
        G.Rh(g, hx - 6 + i * 2.4, hsy + 17 + (i % 2), 1.5, 3, i % 2 ? '#48546c' : '#6b3f22');
      if (Math.random() < 0.3) {
        const sx2 = hx + G.rand(-6, 6);
        G.Rh(g, sx2, hsy + 17, 1, 1, '#ffffff');
        G.glow(g, sx2, hsy + 17, 16, 10, '#7fd8ff', 0.6);
      }

      // ---- the arm and hand ----
      const grip = a.state === 'grip';
      // forearm
      G.Rh(g, ax - 7, ay - 3, 14, 6, OUT);
      G.Rh(g, ax - 6, ay - 2, 12, 4, grip ? '#a8bcd0' : '#8a94a8');
      G.hair(g, ax - 6, ay - 2, 12, '#d8e4f0');
      // fingers, closing when gripped
      for (let i = 0; i < 3; i++) {
        const fy = ay - 3 + i * 3;
        const cl = grip ? 3 : 0;
        G.Rh(g, ax + 5 - cl, fy, 5 + cl, 2, grip ? '#c8d8e8' : '#8a94a8');
        G.hair(g, ax + 5 - cl, fy, 5 + cl, '#ffffff');
      }
      G.Rh(g, ax - 8, ay + 2, 4, 3, '#6b7f96');       // thumb
      if (grip) {
        G.glow(g, ax, ay, 22, 16, '#ffd47a', 0.35 + this.strain * 0.3);
        // sparks where metal fights metal
        if (Math.random() < 0.4 * (0.3 + this.strain))
          G.Rh(g, ax + G.rand(-6, 6), ay + G.rand(-4, 4), 1, 1, '#ffffff');
      }
    },

    // ---- the first four seconds: coming back on ----
    drawWake(g, t) {
      const w = this.wakeT;
      // the world fades up out of black
      const a = G.clamp((w - 0.6) / 2.2, 0, 1);
      g.globalAlpha = 1 - a;
      G.R(g, 0, 0, G.W, G.H, '#04060a');
      g.globalAlpha = 1;
      // boot text, typed
      if (w > 1.2) {
        const lines = [
          'POWER . . . 4%',
          'CHASSIS . . . NOT FOUND',
          'LEFT ARM . . . NOT FOUND',
          'RIGHT ARM . . . PRESENT',
          'PURPOSE . . . GELATO',
        ];
        for (let i = 0; i < lines.length; i++) {
          const st = 1.2 + i * 0.5;
          if (w < st) break;
          const shown = Math.floor((w - st) * 26);
          G.text(g, lines[i].slice(0, shown), 14, 16 + i * 9,
            i === 4 ? '#ffd47a' : i === 3 ? '#b6ff3a' : '#5c8a9a', { sc: 0.5 });
        }
      }
      if (w > 3.4) {
        const fl = Math.sin(t * 5) > 0;
        G.text(g, 'GRAB SOMETHING. PULL.', 160, 148, fl ? '#ffe4b0' : '#8a7458',
          { align: 'center', out: OUT });
        G.text(g, 'TAP A HANDHOLD, THEN DRAG AWAY FROM IT', 160, 160, '#6b5f4a',
          { align: 'center', sc: 0.5 });
      }
    },

    // ---- climbing chrome: a depth meter and a strain gauge ----
    drawHud(g, t) {
      const pr = this.progress();
      // depth rail down the right edge
      G.R(g, 306, 14, 8, 150, '#0b0e14');
      G.bevel(g, 306, 14, 8, 150, '#2a3040', '#050709');
      G.R(g, 307, 15 + (1 - pr) * 148, 6, Math.max(2, pr * 148), '#3f6b5c');
      G.hair(g, 307, 15 + (1 - pr) * 148, 6, '#7fd8a0');
      G.text(g, 'OUT', 310, 6, '#6b7f96', { align: 'center', sc: 0.5 });
      G.text(g, Math.round(pr * 100) + '%', 310, 168, '#8fa0bc', { align: 'center', sc: 0.5 });
      // the strain gauge, only while you are pulling
      if (this.strain > 0.02) {
        const gx = 110, gw = 100;
        G.R(g, gx, 156, gw, 8, '#12141c');
        G.bevel(g, gx, 156, gw, 8, '#2a3040', '#050709');
        const f = G.clamp(this.strain / 1.35, 0, 1);
        const col = f > 0.78 ? P.magenta : f > 0.5 ? P.hazard : '#b6ff3a';
        G.R(g, gx + 1, 157, Math.round((gw - 2) * f), 6, col);
        G.hair(g, gx + 1, 157, Math.round((gw - 2) * f), '#ffffff');
        // where this grip gives out
        if (this.arm.grip) {
          const mark = gx + 1 + Math.round((gw - 2) * G.clamp(this.arm.grip.tough / 1.35, 0, 1));
          G.Rh(g, mark, 154, 1, 12, P.magentaLt);
        }
        G.text(g, f > 0.78 ? 'IT IS GOING TO GO' : 'PULL', gx + gw / 2, 146,
          f > 0.78 ? P.magentaLt : '#c8b490', { align: 'center', sc: 0.5 });
      } else if (this.arm.state === 'idle') {
        G.text(g, 'TAP A HANDHOLD', 160, 160, '#5c5040', { align: 'center', sc: 0.5 });
      }
      if (this.slip > 0.3)
        G.text(g, 'SLIPPING', 160, 130, P.magentaLt, { align: 'center', out: OUT });
    },

    // ---- over the top ----
    drawOver(g, t) {
      const o = this.overT || 0;
      g.globalAlpha = Math.min(0.55, o * 0.4);
      G.R(g, 0, 0, G.W, G.H, '#1a1208');
      g.globalAlpha = 1;
      G.glow(g, 160, 60, 300, 160, '#ffd47a', Math.min(0.6, o * 0.4));
      if (o > 0.6) {
        const a = G.clamp((o - 0.6) / 0.6, 0, 1);
        g.globalAlpha = a;
        G.text(g, 'OUT.', 160, 62, '#ffe4b0', { align: 'center', out: OUT, sc: 2 });
        g.globalAlpha = 1;
      }
      if (o > 1.6) {
        const a = G.clamp((o - 1.6) / 0.6, 0, 1);
        g.globalAlpha = a;
        G.text(g, 'A HEAD, AN ARM, AND SIX HOURS OF RAIN.', 160, 92, '#c8b490',
          { align: 'center', sc: 0.5 });
        G.text(g, 'THEN SOMEBODY SHINES A TORCH AT YOU.', 160, 100, '#c8b490',
          { align: 'center', sc: 0.5 });
        g.globalAlpha = 1;
      }
      if (o > 2.8) G.text(g, 'TAP', 160, 150, Math.sin(t * 4) > 0 ? '#8a7458' : '#4a4030',
        { align: 'center', sc: 0.5 });
    },
  };
})();

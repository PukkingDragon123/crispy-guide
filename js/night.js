// ============================================================
// DOUBLE LIFE - night.js
// Dr. Molar's night clinic. The very kids you sugared up today
// arrive with plaque, cavities and cookie bits. Full-mouth view
// with 16 pixel teeth. Tools: brush (scrub plaque), tweezers
// (pull stuck bits), drill (clear cavities), filler (fill the
// holes), spray (rinse the foam). Every fixed thing pays.
// ============================================================
(function () {
  const G = window.GAME;
  const OUT = G.OUT;

  const MX = 158, MY = 30, MW = 312, MH = 198;   // mouth panel
  const TRAY_Y = 234;
  const TOOLS = ['brush', 'tweezers', 'drill', 'filler', 'spray'];
  const TOOL_NAMES = { brush: 'BRUSH', tweezers: 'TWEEZERS', drill: 'DRILL', filler: 'FILLER', spray: 'SPRAY' };
  const UPW = [30, 26, 24, 22, 22, 24, 26, 30], UPH = [24, 26, 28, 30, 30, 28, 26, 24];
  const LOW = [26, 24, 22, 20, 20, 22, 24, 26], LOH = [20, 22, 24, 26, 26, 24, 22, 20];

  const night = G.scenes.night = {
    enter() {
      if (!G.state.today) G.newDayStats();
      this.t = 0;
      this.tool = 'brush';
      this.parts = [];      // debris/crumbs
      this.foam = [];
      this.water = [];
      this.flyBits = [];    // pulled bits flying away
      this.pi = -1;
      this.patients = (G.state.today && G.state.today.patients.length) ? [...G.state.today.patients]
        : [{ sp: 'turtle', name: 'TOBI', cav: 1, plaque: 3, bits: 2, sweet: 6 }];
      this.doneAll = false;
      this.grab = null;     // tweezer grab
      this.lastBx = 0; this.lastBy = 0;
      this.nextPatient();
      G.audio.music('night');
      if (!G.state.tut.night) { G.state.tut.night = 1; G.toast("TODAY'S KIDS ARE BACK... WITH CAVITIES!", '#c9a3ff'); }
    },
    exitLoops() { G.audio.loop('scrub', false); G.audio.loop('drill', false); G.audio.loop('spray', false); },

    // ---------- teeth setup ----------
    layoutTeeth() {
      const teeth = [];
      let sum = 0; for (const w of UPW) sum += w + 3;
      let x = MX + Math.round((MW - (sum - 3)) / 2);
      for (let i = 0; i < 8; i++) {
        const arc = Math.round(Math.sin(i / 7 * Math.PI) * 5);
        teeth.push({ x, y: MY + 14 + arc, w: UPW[i], h: UPH[i], up: true, i });
        x += UPW[i] + 3;
      }
      sum = 0; for (const w of LOW) sum += w + 3;
      x = MX + Math.round((MW - (sum - 3)) / 2);
      for (let i = 0; i < 8; i++) {
        const arc = Math.round(Math.sin(i / 7 * Math.PI) * 5);
        teeth.push({ x, y: MY + MH - 14 - arc - LOH[i], w: LOW[i], h: LOH[i], up: false, i: i + 8 });
        x += LOW[i] + 3;
      }
      return teeth;
    },

    nextPatient() {
      this.exitLoops();
      this.pi++;
      if (this.pi >= this.patients.length) { this.doneAll = true; return; }
      const p = this.patients[this.pi];
      this.p = p;
      this.patT = 0;
      this.mood = 'worry';
      this.moodT = 0;
      this.happyT = 0;
      this.foam.length = 0; this.water.length = 0; this.parts.length = 0;
      this.teeth = this.layoutTeeth();
      for (const th of this.teeth) {
        th.plaque = null; th.grid = null; th.gridN = 0; th.cavity = null; th.bits = []; th.flash = 0; th.paid = false;
      }
      // distribute plaque
      const idxs = this.teeth.map((_, i) => i).sort(() => Math.random() - 0.5);
      let k = 0;
      for (let n = 0; n < p.plaque && k < idxs.length; n++, k++) this.addPlaque(this.teeth[idxs[k]]);
      for (let n = 0; n < p.cav && k < idxs.length; n++, k++) this.addCavity(this.teeth[idxs[k]]);
      for (let n = 0; n < p.bits; n++) {
        const th = this.teeth[G.irand(0, 15)];
        const side = Math.random() < 0.5;
        th.bits.push({
          lx: side ? 1 : th.w - 3, ly: G.irand(4, th.h - 6),
          col: Math.random() < 0.5 ? '#8a5a3b' : G.pick(G.MULTI_COLS.sprinkles),
          shape: Math.random() < 0.5 ? 'spr' : 'sml', dx: 0, dy: 0,
        });
      }
      G.toast(p.name + ' THE ' + G.animalById(p.sp).name + (p.cav ? ' · ' + p.cav + ' CAVIT' + (p.cav > 1 ? 'IES!' : 'Y!') : ' · CHECK-UP'), '#c9f0ff');
      G.audio.sfx('dingdong');
    },

    addPlaque(th) {
      const c = document.createElement('canvas');
      c.width = th.w; c.height = th.h;
      const cg = c.getContext('2d');
      const cell = 3;
      const gw = Math.ceil(th.w / cell), gh = Math.ceil(th.h / cell);
      th.grid = new Array(gw * gh).fill(false);
      th.gw = gw; th.gh = gh; th.cell = cell; th.gridN = 0;
      const blobs = G.irand(2, 4);
      for (let b = 0; b < blobs; b++) {
        const bx = G.rand(4, th.w - 4), by = G.rand(4, th.h - 4), br = G.rand(3.5, 6);
        G.fc(cg, bx, by, br, '#a8b85c');
        G.fc(cg, bx - br * 0.25, by - br * 0.3, br * 0.5, '#c2cf74');
        for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
          const cx = gx * cell + 1.5, cy = gy * cell + 1.5;
          if (G.dist(cx, cy, bx, by) <= br && !th.grid[gy * gw + gx]) { th.grid[gy * gw + gx] = true; th.gridN++; }
        }
      }
      th.plaque = c;
      th.plaqueG = cg;
      th.hadPlaque = true;
    },
    addCavity(th) {
      th.cavity = {
        lx: G.rand(th.w * 0.3, th.w * 0.7), ly: G.rand(th.h * 0.3, th.h * 0.65),
        r: G.rand(3.5, 5), hp: 1, stage: 'decay', fill: 0, germT: G.rand(0, 6), panic: 0,
      };
    },

    // ---------- helpers ----------
    issuesLeft() {
      let plaque = 0, cav = 0, bits = 0;
      for (const th of this.teeth) {
        if (th.gridN > 0) plaque++;
        if (th.cavity && th.cavity.stage !== 'filled') cav++;
        bits += th.bits.length;
      }
      return { plaque, cav, bits, total: plaque + cav + bits };
    },
    pay(x, y, amt, label) {
      if (G.hasUp('comfy')) amt = Math.round(amt * 1.25);
      G.state.today.nightEarn += amt;
      G.flyCoin(x, y, amt);
      G.floatText((label ? label + ' ' : '') + '+$' + amt, x, y - 8, '#7be98a');
    },
    toothAt(x, y, pad) {
      pad = pad || 0;
      for (const th of this.teeth) if (G.inRect(x, y, th.x - pad, th.y - pad, th.w + pad * 2, th.h + pad * 2)) return th;
      return null;
    },

    // ---------- input ----------
    onDown(x, y) {
      // tool buttons
      for (let i = 0; i < TOOLS.length; i++) {
        const bx = 170 + i * 46;
        if (G.inRect(x, y, bx, TRAY_Y + 4, 40, 28)) {
          if (this.tool !== TOOLS[i]) { this.tool = TOOLS[i]; G.audio.sfx('click'); }
          return;
        }
      }
      // done button
      if (this.p && this.issuesLeft().total === 0 && this.happyT === 0 && G.inRect(x, y, 404, TRAY_Y + 4, 66, 28)) {
        this.finishPatient(); return;
      }
      // tweezer grab
      if (this.tool === 'tweezers') {
        for (const th of this.teeth) {
          for (const bit of th.bits) {
            if (G.dist(x, y, th.x + bit.lx, th.y + bit.ly) < 6) {
              this.grab = { th, bit, sx: x, sy: y };
              G.audio.sfx('grab');
              return;
            }
          }
        }
      }
    },
    onUp() {
      if (this.grab) { this.grab.bit.dx = 0; this.grab.bit.dy = 0; this.grab = null; }
    },

    finishPatient() {
      const foamLeft = this.foam.length;
      let amt = 3 + (foamLeft === 0 ? 4 : 0);
      if (G.hasUp('comfy')) amt = Math.round(amt * 1.25);
      G.state.today.nightEarn += amt;
      G.flyCoin(MX + MW / 2, MY + MH / 2, amt);
      G.floatText(foamLeft === 0 ? 'SPARKLING! +$' + amt : 'CHECK-UP +$' + amt, MX + MW / 2, MY + MH / 2 - 10, foamLeft === 0 ? '#7fd6ff' : '#ffe66e');
      G.audio.sfx('perfect');
      this.happyT = 0.01;
      this.mood = 'happy';
      for (let i = 0; i < 4; i++) setTimeout(() => G.spark(G.rand(MX + 40, MX + MW - 40), G.rand(MY + 30, MY + MH - 40), ['#fff', '#7fd6ff', '#ffe66e'], 8), i * 120);
    },

    // ---------- update ----------
    update(dt) {
      this.t += dt;
      const M = G.mouse;
      if (this.doneAll) {
        this.exitLoops();
        G.save();
        G.go('summary', 'CLINIC CLOSED');
        return;
      }
      if (this.patT < 1) this.patT = Math.min(1, this.patT + dt * 2.2);
      if (this.happyT > 0) {
        this.happyT += dt;
        if (this.happyT > 1.6) { G.state.totCavFixed += this.p.cav; this.nextPatient(); }
        this.exitLoops();
        return;
      }
      if (this.moodT > 0) { this.moodT -= dt; if (this.moodT <= 0 && this.mood !== 'happy') this.mood = 'worry'; }

      const inMouth = G.inRect(M.x, M.y, MX, MY, MW, MH);
      let scrubbing = false, drilling = false, spraying = false;

      // germs bounce
      for (const th of this.teeth) {
        if (th.cavity) th.cavity.germT += dt;
        if (th.flash > 0) th.flash -= dt;
      }

      // --- brush ---
      if (this.tool === 'brush' && M.down && inMouth) {
        const speed = Math.hypot(M.vx, M.vy);
        const R = G.hasUp('bigbrush') ? 9 : 6;
        const power = G.clamp(speed / 130, 0.15, 1.6);
        scrubbing = speed > 8;
        for (const th of this.teeth) {
          if (!th.grid || th.gridN === 0) continue;
          const lx = M.x - th.x, ly = M.y - th.y;
          if (lx < -R || ly < -R || lx > th.w + R || ly > th.h + R) continue;
          // erase visual plaque
          th.plaqueG.save();
          th.plaqueG.globalCompositeOperation = 'destination-out';
          G.fc(th.plaqueG, lx, ly, R * Math.min(1, power + 0.3), '#000');
          th.plaqueG.restore();
          // clear logic grid
          for (let gy = 0; gy < th.gh; gy++) for (let gx = 0; gx < th.gw; gx++) {
            const idx = gy * th.gw + gx;
            if (!th.grid[idx]) continue;
            const cx = gx * th.cell + 1.5, cy = gy * th.cell + 1.5;
            if (G.dist(cx, cy, lx, ly) <= R * Math.min(1, power + 0.2)) {
              th.grid[idx] = false; th.gridN--;
              if (Math.random() < 0.5) this.parts.push({ x: th.x + cx, y: th.y + cy, vx: G.rand(-30, 30), vy: G.rand(-50, -10), col: '#a8b85c', t: 0, life: 0.5, grav: 220 });
            }
          }
          if (th.gridN === 0) {
            th.flash = 0.5;
            G.audio.sfx('toothClean');
            G.spark(th.x + th.w / 2, th.y + th.h / 2, ['#fff', '#7fd6ff'], 10);
            this.pay(th.x + th.w / 2, th.y + th.h / 2, 3);
            this.mood = 'relax'; this.moodT = 1;
          }
        }
        // foam
        if (scrubbing && this.foam.length < 220 && Math.random() < 0.75) {
          this.foam.push({ x: M.x + G.rand(-5, 5), y: M.y + G.rand(-5, 5), r: G.rand(1.5, 3), seed: Math.random() * 6 });
        }
      }
      G.audio.loop('scrub', scrubbing, G.clamp(Math.hypot(M.vx, M.vy) / 260, 0.25, 1));

      // --- drill ---
      if (this.tool === 'drill' && M.down && inMouth) {
        for (const th of this.teeth) {
          const c = th.cavity;
          if (!c || c.stage !== 'decay') continue;
          if (G.dist(M.x, M.y, th.x + c.lx, th.y + c.ly) < c.r + 5) {
            drilling = true;
            c.hp -= dt * (G.hasUp('turbodrill') ? 0.9 : 0.45);
            c.panic = 1;
            G.shake(1, 0.05);
            this.mood = 'ouch'; this.moodT = 0.3;
            if (Math.random() < 0.6) this.parts.push({ x: th.x + c.lx + G.rand(-3, 3), y: th.y + c.ly, vx: G.rand(-50, 50), vy: G.rand(-70, -20), col: G.pick(['#4a2b1f', '#6b4a52', '#ffd94a']), t: 0, life: 0.4, grav: 300 });
            if (c.hp <= 0) {
              c.stage = 'drilled'; c.panic = 0;
              G.audio.sfx('pullPop');
              G.spark(th.x + c.lx, th.y + c.ly, ['#c9a3ff', '#fff'], 12);
              G.floatText('GERM GONE!', th.x + c.lx, th.y + c.ly - 10, '#c9a3ff');
            }
          } else c.panic = 0;
        }
      } else for (const th of this.teeth) if (th.cavity) th.cavity.panic = 0;
      G.audio.loop('drill', drilling, 1);

      // --- filler ---
      if (this.tool === 'filler' && M.down && inMouth) {
        for (const th of this.teeth) {
          const c = th.cavity;
          if (!c || c.stage !== 'drilled') continue;
          if (G.dist(M.x, M.y, th.x + c.lx, th.y + c.ly) < c.r + 5) {
            c.fill += dt * 1.3;
            G.audio.loop('goo', true, 0.8);
            if (c.fill >= 1) {
              c.stage = 'filled'; c.fill = 1;
              th.flash = 0.5;
              G.audio.loop('goo', false);
              G.audio.sfx('fillDone');
              G.spark(th.x + c.lx, th.y + c.ly, ['#fff', '#cdd6e0'], 10);
              this.pay(th.x + c.lx, th.y + c.ly, 6);
              this.mood = 'relax'; this.moodT = 1;
            }
          }
        }
      } else G.audio.loop('goo', false);

      // --- tweezers ---
      if (this.grab) {
        const gb = this.grab;
        gb.bit.dx = G.clamp((M.x - gb.sx) * 0.35, -4, 4) + Math.sin(this.t * 30) * 0.5;
        gb.bit.dy = G.clamp((M.y - gb.sy) * 0.35, -4, 4);
        if (G.dist(M.x, M.y, gb.sx, gb.sy) > 13) {
          // POP!
          const th = gb.th, bit = gb.bit;
          th.bits.splice(th.bits.indexOf(bit), 1);
          this.flyBits.push({ x: th.x + bit.lx, y: th.y + bit.ly, vx: G.rand(-40, 40), vy: -90, col: bit.col, shape: bit.shape, t: 0 });
          G.audio.sfx('pullPop');
          G.spark(th.x + bit.lx, th.y + bit.ly, ['#fff', bit.col], 8);
          this.pay(th.x + bit.lx, th.y + bit.ly, 2);
          this.grab = null;
          this.mood = 'relax'; this.moodT = 0.8;
        }
      }

      // --- spray ---
      if (this.tool === 'spray' && M.down && inMouth) {
        spraying = true;
        for (let i = 0; i < 3; i++) this.water.push({ x: M.x + G.rand(-2, 2), y: M.y + 2, vx: G.rand(-14, 14), vy: G.rand(60, 120), t: 0 });
        if (this.water.length > 160) this.water.splice(0, this.water.length - 160);
      }
      G.audio.loop('spray', spraying, 1);

      // water vs foam
      for (let i = this.water.length - 1; i >= 0; i--) {
        const w = this.water[i];
        w.t += dt; w.x += w.vx * dt; w.y += w.vy * dt; w.vy += 160 * dt;
        let hit = false;
        for (let j = this.foam.length - 1; j >= 0; j--) {
          const f = this.foam[j];
          if (G.dist(w.x, w.y, f.x, f.y) < f.r + 2) {
            this.foam.splice(j, 1); hit = true;
            if (Math.random() < 0.4) G.audio.sfx('plip');
            this.parts.push({ x: f.x, y: f.y, vx: G.rand(-20, 20), vy: G.rand(-30, 0), col: '#dff3ff', t: 0, life: 0.3, grav: 150 });
            break;
          }
        }
        if (hit || w.y > MY + MH - 4 || w.t > 1) this.water.splice(i, 1);
      }

      // particles
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i];
        p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.grav || 0) * dt;
        if (p.t > p.life) this.parts.splice(i, 1);
      }
      for (let i = this.flyBits.length - 1; i >= 0; i--) {
        const p = this.flyBits[i];
        p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt;
        if (p.t > 1.2) this.flyBits.splice(i, 1);
      }
    },

    // ---------- draw ----------
    draw(g) {
      const t = this.t;
      // clinic wall
      G.R(g, 0, 0, 480, 270, '#bfe3da');
      for (let x = 0; x < 480; x += 32) G.R(g, x, 0, 16, 270, '#b4dcd2');
      G.R(g, 0, 190, 480, 80, '#8fc7ba');
      G.R(g, 0, 188, 480, 2, '#5f9e8f');
      // window + moon + stars
      G.panel(g, 22, 14, 70, 52, '#2a1c3e', OUT);
      G.drawMoon(g, 44, 32, 9);
      for (let i = 0; i < 8; i++) {
        const sx = 28 + (i * 37) % 60, sy = 20 + (i * 23) % 40;
        if (Math.sin(t * 2 + i) > 0) G.R(g, sx, sy, 1, 1, '#fff');
      }
      G.R(g, 22, 40, 70, 2, OUT); G.R(g, 55, 14, 2, 52, OUT);
      // poster
      G.panel(g, 104, 20, 40, 46, '#fff', OUT);
      G.drawToothIcon(g, 119, 28, '#fdf6ee');
      G.text(g, 'BRUSH', 124, 44, '#5f9e8f', { align: 'center' });
      G.text(g, 'EM ALL', 124, 53, '#5f9e8f', { align: 'center' });

      if (!this.p) return;
      const slide = G.easeOut(this.patT);

      // ------- patient in chair (left) -------
      const px = 76, py = Math.round(196 - slide * 60); // face center
      // chair
      G.orr2(g, 20, 118, 116, 130, '#7fb8d8');
      G.R(g, 22, 120, 112, 6, '#a8d2e8');
      G.orr2(g, 28, 96, 100, 34, '#a8d2e8'); // headrest
      // body blanket
      G.orr2(g, 40, py + 34, 74, Math.max(8, 210 - py), '#ffd4e4');
      for (let yy = py + 40; yy < 240; yy += 8) G.R(g, 46, yy, 62, 2, '#ffb8d0');
      // face
      const mood = this.happyT > 0 ? 'happy' : this.mood;
      G.drawFace(g, this.p.sp, px, py, { mood, mouth: this.happyT > 0 ? 0 : 1, t });
      // name tag
      G.panel(g, 26, 246, 104, 15, '#fff', OUT);
      G.text(g, this.p.name, 78, 250, '#5d4b70', { align: 'center' });
      // sleepy Zzz when relaxed
      if (mood === 'relax') G.text(g, 'Z', px + 34 + Math.sin(t * 3) * 2, py - 34 - (t * 8 % 6), '#fff', { out: OUT });

      // ------- mouth cam panel -------
      G.panel(g, MX - 4, MY - 4, MW + 8, MH + 8, '#8a3d4d', '#fff');
      G.R(g, MX, MY, MW, MH, '#7a3644');
      G.R(g, MX, MY, MW, 8, '#5f2a36');
      // tongue
      G.fe(g, MX + MW / 2, MY + MH - 4, 70, 16, '#e06e86');
      G.fe(g, MX + MW / 2, MY + MH - 6, 60, 10, '#ea8ba0');
      G.R(g, MX + MW / 2 - 1, MY + MH - 16, 2, 10, '#c85a72');
      // uvula
      G.fe(g, MX + MW / 2, MY + 10, 4, 5, '#c85a72');

      // gums
      for (let i = 0; i < 8; i++) {
        const arc = Math.round(Math.sin(i / 7 * Math.PI) * 5);
        const th = this.teeth[i];
        G.fe(g, th.x + th.w / 2, MY + 10 + arc, th.w / 2 + 2, 8, '#d8697f');
      }
      for (let i = 0; i < 8; i++) {
        const arc = Math.round(Math.sin(i / 7 * Math.PI) * 5);
        const th = this.teeth[i + 8];
        G.fe(g, th.x + th.w / 2, MY + MH - 10 - arc, th.w / 2 + 2, 8, '#d8697f');
      }

      // teeth
      for (const th of this.teeth) this.drawTooth(g, th);

      // foam
      for (const f of this.foam) {
        const wob = Math.sin(t * 5 + f.seed) * 0.5;
        G.fc(g, f.x, f.y + wob, f.r, '#f4fbff');
        G.R(g, f.x - 1, f.y - 1 + wob, 1, 1, '#fff');
      }
      // water
      for (const w of this.water) G.R(g, w.x, w.y, 1, 3, '#8fd6ff');
      // debris/particles
      for (const p of this.parts) {
        g.globalAlpha = 1 - p.t / p.life;
        G.R(g, p.x, p.y, 2, 2, p.col);
        g.globalAlpha = 1;
      }
      for (const p of this.flyBits) {
        const alt = Math.floor(p.t * 12) % 2;
        if (p.shape === 'spr') { if (alt) G.R(g, p.x, p.y - 1, 1, 3, p.col); else G.R(g, p.x - 1, p.y, 3, 1, p.col); }
        else G.R(g, p.x - 1, p.y - 1, 2, 2, p.col);
      }

      // issue counters (top of mouth)
      const info = this.issuesLeft();
      let ix = MX + 6;
      const chip = (draw, n, col) => {
        if (n <= 0) return;
        G.panel(g, ix, MY + 4, 34, 13, '#3b2b40', OUT);
        draw(ix + 4, MY + 6);
        G.text(g, '×' + n, ix + 16, MY + 7, col);
        ix += 38;
      };
      chip((x, y) => { G.fc(g, x + 3, y + 4, 3.5, '#a8b85c'); G.R(g, x + 1, y + 2, 2, 2, '#c2cf74'); }, info.plaque, '#c2cf74');
      chip((x, y) => { G.fc(g, x + 3, y + 4, 3.5, '#8a63c9'); G.R(g, x + 1, y + 3, 2, 2, '#fff'); G.R(g, x + 4, y + 3, 2, 2, '#fff'); }, info.cav, '#c9a3ff');
      chip((x, y) => { G.R(g, x, y + 2, 3, 3, '#8a5a3b'); G.R(g, x + 4, y + 4, 2, 2, '#ff6e9c'); }, info.bits, '#ffcf9e');
      if (info.total === 0 && this.foam.length > 0) {
        G.panel(g, ix, MY + 4, 70, 13, '#3b2b40', OUT);
        G.text(g, 'RINSE FOAM!', ix + 5, MY + 7, '#7fd6ff');
      }

      // patient count
      G.text(g, 'PATIENT ' + (this.pi + 1) + '/' + this.patients.length, MX + MW - 6, MY + 7, '#ffd4e4', { align: 'right' });

      // happy overlay
      if (this.happyT > 0) {
        g.globalAlpha = Math.min(0.55, this.happyT);
        G.R(g, MX, MY, MW, MH, '#2a1c3e');
        g.globalAlpha = 1;
        G.text(g, 'ALL CLEAN!', MX + MW / 2, MY + MH / 2 - 12, '#7fd6ff', { align: 'center', out: OUT, sc: 2 });
        G.text(g, '♥ THANK YOU DR MOLAR ♥', MX + MW / 2, MY + MH / 2 + 10, '#ff9ad5', { align: 'center', out: OUT });
      }

      // ------- tray -------
      G.R(g, 0, TRAY_Y, 480, 36, '#eef6f4');
      G.R(g, 0, TRAY_Y, 480, 2, OUT);
      G.text(g, 'TOOLS:', 136, TRAY_Y + 14, '#5f9e8f', { align: 'right' });
      for (let i = 0; i < TOOLS.length; i++) {
        const bx = 170 + i * 46, sel = this.tool === TOOLS[i];
        G.panel(g, bx, TRAY_Y + 4, 40, 28, sel ? '#ffe66e' : '#fff', sel ? '#d9a520' : OUT);
        G.drawTool(g, TOOLS[i], bx + 20, TRAY_Y + 26);
      }
      G.text(g, TOOL_NAMES[this.tool], 136, TRAY_Y + 24, '#a88bb5', { align: 'right' });
      const done = this.issuesLeft().total === 0 && this.happyT === 0;
      G.drawBtn(g, 404, TRAY_Y + 4, 66, 28, 'DONE ✓', { col: done ? '#7bc96a' : '#b8c4c0', disabled: !done });

      // hint
      const hints = {
        brush: 'SCRUB THE GREEN PLAQUE!',
        tweezers: 'GRAB A CRUMB AND PULL!',
        drill: 'HOLD ON A CAVITY GERM!',
        filler: 'FILL THE DRILLED HOLES!',
        spray: 'RINSE ALL THE FOAM!',
      };
      if (this.t % 6 < 3 && this.happyT === 0) G.text(g, hints[this.tool], MX + MW / 2, MY + MH - 11, '#ffd4e4', { align: 'center', out: '#5f2a36' });

      // HUD money + tool cursor
      G.panel(g, 4, 3, 64, 13, '#3b2b40', OUT);
      G.fe(g, 12, 9, 3, 4, '#ffd94a'); G.R(g, 11, 6, 1, 2, '#fff3b0');
      G.text(g, '$' + Math.round(G.state.moneyShown), 20, 6, '#ffe66e');
      G.panel(g, 74, 3, 78, 13, '#3b2b40', OUT);
      G.text(g, 'NIGHT ' + G.state.day, 80, 6, '#c9a3ff');

      const M = G.mouse;
      if (G.inRect(M.x, M.y, MX - 10, MY - 10, MW + 20, MH + 20)) {
        const jig = (this.tool === 'drill' && M.down) ? Math.sin(t * 60) * 1.5 : 0;
        G.drawTool(g, this.tool, Math.round(M.x + jig), Math.round(M.y), true);
        G.hideCursor = true;
      }
    },

    drawTooth(g, th) {
      // tooth body
      const col = '#fdf6ee';
      G.rr2(g, th.x - 1, th.y - 1, th.w + 2, th.h + 2, '#caa8a8');
      G.rr2(g, th.x, th.y, th.w, th.h, col);
      G.R(g, th.x + 2, th.y + 2, 2, th.h - 5, '#fff');
      G.R(g, th.x + 2, th.y + th.h - 3, th.w - 4, 2, '#e3d2c8');
      // molar groove for wide teeth
      if (th.w >= 26) G.R(g, th.x + th.w / 2 - 1, th.y + (th.up ? th.h - 7 : 4), 2, 4, '#e3d2c8');

      // cavity
      const c = th.cavity;
      if (c) {
        const cx = th.x + c.lx, cy = th.y + c.ly;
        if (c.stage === 'decay') {
          const r = c.r * (0.45 + 0.55 * c.hp);
          G.fc(g, cx, cy, r + 1, '#6b4a52');
          G.fc(g, cx, cy, r, '#4a2b1f');
          G.R(g, cx - r - 1, cy, 1, 1, '#4a2b1f'); G.R(g, cx + r, cy - 1, 1, 1, '#4a2b1f');
          // cute germ
          const gt = c.germT;
          const gy = cy - 1 + (c.panic ? Math.sin(gt * 40) * 1.5 : Math.sin(gt * 4) * 1);
          G.R(g, cx - 2, gy - 2, 2, 2, '#fff'); G.R(g, cx + 1, gy - 2, 2, 2, '#fff');
          if (Math.sin(gt * 1.7) > 0.92) { G.R(g, cx - 2, gy - 1, 2, 1, '#4a2b1f'); G.R(g, cx + 1, gy - 1, 2, 1, '#4a2b1f'); }
          else { G.R(g, cx - 1, gy - 2, 1, 1, OUT); G.R(g, cx + 2, gy - 2, 1, 1, OUT); }
          if (c.panic) G.text(g, '!', cx + 5, cy - 10, '#ff6e6e', { out: '#fff' });
        } else if (c.stage === 'drilled') {
          G.fc(g, cx, cy, c.r, '#8a6a6a');
          G.fc(g, cx, cy - 0.5, c.r - 1.5, '#5d4444');
          // rising fill
          if (c.fill > 0) {
            const fr = c.r - 1;
            const rows = Math.round(fr * 2 * G.clamp(c.fill, 0, 1));
            for (let dy = 0; dy < rows; dy++) {
              const yy = cy + fr - dy;
              const w = Math.floor(Math.sqrt(Math.max(0, fr * fr - (yy - cy) * (yy - cy))));
              G.R(g, cx - w, yy, w * 2 + 1, 1, '#cdd6e0');
            }
          }
        } else if (c.stage === 'filled') {
          G.fc(g, cx, cy, c.r - 0.5, '#cdd6e0');
          G.fc(g, cx - 1, cy - 1, 1.4, '#eef3f8');
          if (Math.sin(this.t * 3 + cx) > 0.85) G.text(g, '★', cx + 3, cy - 8, '#fff');
        }
      }

      // plaque overlay
      if (th.plaque && th.gridN > 0) g.drawImage(th.plaque, th.x, th.y);

      // stuck bits
      for (const bit of th.bits) {
        const bx = th.x + bit.lx + (bit.dx || 0), by = th.y + bit.ly + (bit.dy || 0);
        G.R(g, bx - 1, by - 1, 1, 1, OUT);
        if (bit.shape === 'spr') G.R(g, bx - 1, by, 3, 2, bit.col);
        else G.R(g, bx - 1, by - 1, 3, 3, bit.col);
      }

      // clean flash
      if (th.flash > 0) {
        g.globalAlpha = th.flash * 1.6;
        G.rr2(g, th.x, th.y, th.w, th.h, '#fff');
        g.globalAlpha = 1;
      }
      // sparkle on perfect teeth
      if (!th.cavity && th.gridN === 0 && !th.bits.length && th.hadPlaque) {
        if (Math.sin(this.t * 2.5 + th.x) > 0.93) G.R(g, th.x + 3, th.y + 3, 2, 2, '#fff');
      }
    },
  };
})();

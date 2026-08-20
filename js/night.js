// ============================================================
// DOUBLE LIFE v3 - night.js  ·  THE CLINIC
// 320x180. The patient's head fills the frame. Probe a tooth,
// name it in the notebook, then the instruments just work.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  const TRAY_Y = 158;
  const TOOLS = ['probe', 'scale', 'drill', 'fill', 'forceps', 'extract', 'lance', 'suction'];
  const MAW = { x: 10, y: 22, w: 300, h: 128 };
  const NUP = 6, NLO = 5;

  const night = (G.scenes = G.scenes || {}).night = {
    enter() {
      if (!G.state.today) G.newDayStats();
      this.t = 0;
      this.tool = 'probe';
      this.book = false;
      this.bookTooth = null;
      this.act = null;
      this.chips = [];
      this.pulled = [];
      this.pi = -1;
      this.msg = null; this.msgT = 0;
      this.pain = 0;
      this.doneAll = false;
      this.flinch = 0;
      G.cam.reset(0, 0, 0, 0);
      G.spawnFlies(5, 160, 80, 60);
      const src = (G.state.today.patients || []).slice();
      this.queue = src.length ? src
        : [{ sp: 'gator', name: 'CHOMP', sugar: 14, symptoms: ['caries', 'tartar', 'abscess'] }];
      G.audio.music('night');
      this.next();
      if (!G.state.tut.clinic) {
        G.state.tut.clinic = 1;
        G.toast('PROBE A TOOTH, NAME IT IN THE BOOK', P.neonC);
      }
    },

    layout(cav) {
      const teeth = [];
      const us = Math.floor(cav.w / NUP);
      for (let i = 0; i < NUP; i++) {
        teeth.push({ x: cav.x + 3 + i * us, y: cav.y + 3, w: us - 9, h: 24, up: true, i, tilt: 0 });
      }
      const ls = Math.floor((cav.w - 24) / NLO);
      for (let i = 0; i < NLO; i++) {
        teeth.push({ x: cav.x + 16 + i * ls, y: cav.y + cav.h - 27, w: ls - 9, h: 24, up: false, i: i + NUP, tilt: 0 });
      }
      for (const th of teeth) {
        th.sym = null; th.examined = false; th.charted = false; th.step = 0; th.done = false; th.flash = 0;
      }
      return teeth;
    },

    materialise(th, kind) {
      const w = th.w, h = th.h;
      const s = { kind };
      if (kind === 'caries') { s.lx = w * 0.5; s.ly = h * 0.45; s.r = G.rand(4, 6); s.stage = 'decay'; s.fill = 0; }
      if (kind === 'necrosis') { s.lx = w * 0.5; s.ly = h * 0.46; s.r = G.rand(5, 7); s.opened = false; s.fill = 0; }
      if (kind === 'tartar') {
        s.blobs = [];
        for (let i = 0, n = G.irand(2, 3); i < n; i++)
          s.blobs.push({ x: G.rand(4, w - 4), y: th.up ? G.rand(h * 0.6, h - 4) : G.rand(4, h * 0.4), r: G.rand(3, 5), gone: false });
      }
      if (kind === 'abscess') { s.lx = w * 0.5; s.ly = th.up ? h + 5 : -5; s.r = G.rand(6, 8); s.lanced = false; }
      if (kind === 'fracture') {
        s.lx = w * 0.5; s.bonded = false; s.pts = [];
        let cy = th.up ? 3 : h - 3;
        for (let i = 0; i < 3; i++) { cy += (th.up ? 1 : -1) * (h / 3.4); s.pts.push({ x: w * 0.5 + G.rand(-4, 4), y: cy }); }
      }
      if (kind === 'foreign') {
        s.lx = Math.random() < 0.5 ? 2 : w - 6; s.ly = h * 0.42;
        s.w = G.irand(4, 5); s.h = G.irand(7, 10);
        s.col = G.pick(['#f4f0e0', '#a8813a', '#4a4a7a', '#ff5c9c']);
        s.grabbed = false; s.pulled = false;
      }
      if (kind === 'gingiva') { s.cleaned = false; s.prog = 0; }
      if (kind === 'impacted') { th.tilt = G.rand(0.24, 0.4) * (Math.random() < 0.5 ? -1 : 1); s.out = false; }
      th.sym = s;
    },

    next() {
      G.audio.loop('drill', false); G.audio.loop('scrape', false); G.audio.loop('suction', false);
      this.pi++;
      this.act = null; this.book = false; this.bookTooth = null;
      this.pain = 0;
      G.clearGore();
      this.chips.length = 0; this.pulled.length = 0;
      if (this.pi >= this.queue.length) { this.doneAll = true; return; }
      const p = this.queue[this.pi];
      this.p = p;
      this.cav = { x: MAW.x + 8, y: MAW.y + Math.round(MAW.h * 0.34) + 5,
                   w: MAW.w - 16, h: MAW.h - Math.round(MAW.h * 0.34) - Math.round(MAW.h * 0.2) - 10 };
      this.teeth = this.layout(this.cav);
      const idx = this.teeth.map((_, i) => i).sort(() => Math.random() - 0.5);
      let k = 0;
      for (const sid of p.symptoms) { if (k >= idx.length) break; this.materialise(this.teeth[idx[k++]], sid); }
      this.mood = 'worry'; this.moodT = 0; this.winT = 0;
      G.audio.sfx('doorbell');
      G.toast(p.name + ' · ' + p.symptoms.length + ' FINDING' + (p.symptoms.length > 1 ? 'S' : ''), P.neonC);
    },

    // ---------- helpers ----------
    sick() { return this.teeth.filter((th) => th.sym && !th.done); },
    fieldDirty() { return G.stains.length > 5; },
    canFinish() { return this.sick().length === 0 && !this.fieldDirty() && this.winT === 0; },
    say(m, col) { this.msg = m; this.msgCol = col || P.warn; this.msgT = 2.2; },
    hurt(a, agony) {
      this.pain = G.clamp(this.pain + a * (G.hasUp('sedative') ? 0.5 : 0.8), 0, 0.96);
      this.mood = agony ? 'agony' : 'worry';
      this.moodT = agony ? 0.8 : 0.4;
    },
    pay(amt, x, y, label) {
      G.state.today.nightEarn += amt;
      G.flyCoin(x, y, amt);
      G.floatText((label ? label + ' ' : '') + '+$' + amt, x, y - 8, P.neonG);
    },
    toothAt(x, y, pad) {
      pad = pad === undefined ? 4 : pad;
      for (const th of this.teeth) if (G.inRect(x, y, th.x - pad, th.y - pad, th.w + pad * 2, th.h + pad * 2)) return th;
      return null;
    },
    step(th) { return th.sym && th.charted ? G.sympById(th.sym.kind).steps[th.step] : null; },
    advance(th) {
      const sym = G.sympById(th.sym.kind);
      th.step++;
      if (th.step >= sym.steps.length) {
        th.done = true; th.flash = 0.5;
        this.mood = 'relief'; this.moodT = 1.2;
        G.audio.sfx('clean');
        G.spark(th.x + th.w / 2, th.y + th.h / 2, ['#fff', P.neonC], 10);
        this.pay(sym.pay, th.x + th.w / 2, th.y + th.h / 2, 'FIXED');
        G.state.today.fixed++; G.state.totFixed++;
      } else {
        G.audio.sfx('fillDone');
        this.say('NEXT: ' + G.toolById(sym.steps[th.step]).name, P.neonC);
      }
    },

    // ---------- input ----------
    onDown(x, y) {
      if (this.doneAll) return;

      if (this.book) {
        if (G.inRect(x, y, 268, 12, 42, 13)) { this.book = false; G.audio.sfx('bookFlip'); return; }
        const list = G.DATA.symptoms;
        for (let i = 0; i < list.length; i++) {
          const ry = 40 + i * 15;
          if (G.inRect(x, y, 160, ry, 148, 14)) {
            const th = this.bookTooth;
            if (!th || !th.sym) { this.book = false; return; }
            if (list[i].id === th.sym.kind) {
              th.charted = true;
              if (!G.state.dxSeen.includes(list[i].id)) G.state.dxSeen.push(list[i].id);
              G.audio.sfx('dxRight');
              this.pay(5, th.x + th.w / 2, th.y + th.h / 2, 'CHARTED');
              this.say('IT IS ' + list[i].dx + ' - USE THE ' + G.toolById(list[i].steps[0]).name, P.neonG);
              this.book = false;
            } else {
              G.audio.sfx('dxWrong');
              G.state.today.misdx++; G.state.totMisdx++;
              this.flinch = 0.4; this.hurt(0.08, false);
              this.say('NO. LOOK AGAIN.', P.blood);
              G.shake(2, 0.2);
            }
            return;
          }
        }
        return;
      }

      // tray
      if (y >= TRAY_Y) {
        for (let i = 0; i < TOOLS.length; i++) {
          if (G.inRect(x, y, 3 + i * 24, TRAY_Y + 3, 22, 18)) {
            if (this.tool !== TOOLS[i]) { this.tool = TOOLS[i]; this.act = null; G.audio.sfx('clack'); }
            return;
          }
        }
        if (G.inRect(x, y, 199, TRAY_Y + 3, 42, 18)) { this.book = true; G.audio.sfx('bookOpen'); return; }
        if (G.inRect(x, y, 245, TRAY_Y + 3, 70, 18)) {
          if (this.canFinish()) this.finish();
          else if (this.sick().length) this.say('FINDINGS STILL OPEN', P.warn);
          else this.say('SUCTION THE BLOOD FIRST', P.warn);
        }
        return;
      }

      if (this.tool === 'suction') { this.act = { type: 'suction' }; return; }

      const th = this.toothAt(x, y);
      if (!th) return;

      if (this.tool === 'probe') {
        G.audio.sfx('probe');
        if (!th.sym) { this.say('THIS ONE IS FINE', P.steel2); return; }
        th.examined = true; this.bookTooth = th; this.book = true;
        G.audio.sfx('bookOpen');
        return;
      }
      if (!th.sym) { G.audio.sfx('denied'); this.say('LEAVE THE GOOD ONES', P.warn); return; }
      if (!th.examined) { G.audio.sfx('denied'); this.say('PROBE IT FIRST', P.warn); return; }
      if (!th.charted) { G.audio.sfx('denied'); this.say('NAME IT IN THE BOOK', P.warn); this.book = true; this.bookTooth = th; return; }
      if (th.done) { this.say('ALREADY DONE', P.steel2); return; }
      const need = this.step(th);
      if (this.tool !== need) { G.audio.sfx('denied'); this.say('NEEDS THE ' + G.toolById(need).name, P.warn); return; }

      const s = th.sym;
      if (this.tool === 'drill') this.act = { type: 'drill', th, depth: 0 };
      else if (this.tool === 'fill') this.act = { type: 'fill', th, level: 0 };
      else if (this.tool === 'scale') this.act = { type: 'scale', th };
      else if (this.tool === 'lance') {
        s.lanced = true;
        G.audio.sfx('lance');
        G.bleed(th.x + s.lx, th.y + s.ly, 16, { dir: th.up ? Math.PI / 2 : -Math.PI / 2, force: 90, floor: th.up ? this.cav.y + this.cav.h : this.cav.y + this.cav.h });
        for (let i = 0; i < 8; i++) this.chips.push({ x: th.x + s.lx, y: th.y + s.ly, vx: G.rand(-50, 50), vy: G.rand(-60, -10), col: P.pus, t: 0, life: 0.5 });
        G.state.today.blood += 6;
        G.screenFlash(P.pus, 0.08);
        this.mood = 'relief'; this.moodT = 1.2;
        this.advance(th);
      } else if (this.tool === 'forceps') {
        if (G.dist(x, y, th.x + s.lx, th.y + s.ly) > 12) { this.say('GRIP THE OBJECT', P.warn); return; }
        s.grabbed = true;
        this.act = { type: 'forceps', th, sx: x, sy: y };
        G.audio.sfx('grab');
      } else if (this.tool === 'extract') {
        this.act = { type: 'extract', th, loose: 0, lastSide: 0 };
        G.audio.sfx('grab');
      }
    },

    onUp() {
      const a = this.act;
      if (!a) return;
      if (a.type === 'drill') G.audio.loop('drill', false);
      if (a.type === 'fill') G.audio.loop('goo', false);
      if (a.type === 'scale') G.audio.loop('scrape', false);
      if (a.type === 'suction') G.audio.loop('suction', false);
      if (a.type === 'forceps' && a.th.sym) a.th.sym.grabbed = false;
      this.act = null;
    },

    finish() {
      let bonus = 8;
      if (G.state.today.misdx === 0) bonus += 5;
      this.pay(bonus, 160, 80, 'CLEAN');
      G.audio.sfx('perfect');
      this.winT = 0.01;
      this.mood = 'relief';
    },

    // ---------- update ----------
    update(dt) {
      this.t += dt;
      if (this.doneAll) { G.audio.stopAllLoops(); G.save(); G.go('summary', 'BOOKS CLOSED'); return; }
      const M = G.mouse;
      if (this.msgT > 0) this.msgT -= dt;
      if (this.flinch > 0) this.flinch -= dt;
      if (this.moodT > 0) { this.moodT -= dt; if (this.moodT <= 0) this.mood = 'worry'; }
      this.pain = Math.max(0, this.pain - dt * 0.09);
      for (const th of this.teeth) if (th.flash > 0) th.flash -= dt;
      G.updateFlies(dt);

      if (this.winT > 0) {
        this.winT += dt;
        G.audio.stopAllLoops();
        if (this.winT > 1.6) this.next();
        return;
      }

      const a = this.act;
      let drilling = false, scraping = false, sucking = false;
      const floor = this.cav.y + this.cav.h;

      if (a && a.type === 'drill' && M.down) {
        const th = a.th, s = th.sym;
        if (G.dist(M.x, M.y, th.x + s.lx, th.y + s.ly) < s.r + 14) {
          drilling = true;
          a.depth += dt * (G.hasUp('carbide') ? 1.15 : 0.62);
          if (Math.random() < 0.6) this.chips.push({ x: th.x + s.lx + G.rand(-2, 2), y: th.y + s.ly, vx: G.rand(-40, 40), vy: G.rand(-50, -15), col: G.pick(['#3a2410', '#b0a488', '#f4f0e0']), t: 0, life: 0.35 });
          G.shake(0.5, 0.05);
          if (a.depth >= 1) {
            if (s.kind === 'necrosis') s.opened = true; else s.stage = 'drilled';
            G.audio.sfx('crack');
            G.spark(th.x + s.lx, th.y + s.ly, ['#f4f0e0', '#b0a488'], 10);
            G.bleed(th.x + s.lx, th.y + s.ly, 5, { force: 45, floor });
            G.state.today.blood += 2;
            this.hurt(0.06, false);
            this.advance(th);
            this.act = null;
            G.audio.loop('drill', false);
          }
        }
      }
      G.audio.loop('drill', drilling, 1);

      if (a && a.type === 'fill' && M.down) {
        const th = a.th, s = th.sym;
        a.level += dt * 0.8;
        s.fill = G.clamp(a.level, 0, 1);
        G.audio.loop('goo', true, 0.85);
        if (a.level >= 1) {
          s.fill = 1; if (s.pts) s.bonded = true;
          G.audio.loop('goo', false);
          G.audio.sfx('fillDone');
          G.spark(th.x + th.w / 2, th.y + th.h / 2, ['#fff', P.chrome], 10);
          this.advance(th);
          this.act = null;
        }
      } else if (a && a.type === 'fill') G.audio.loop('goo', false);

      if (a && a.type === 'scale' && M.down) {
        const th = a.th, s = th.sym;
        scraping = Math.hypot(M.vx, M.vy) > 10;
        if (s.kind === 'tartar') {
          for (const b of s.blobs) {
            if (b.gone) continue;
            if (G.dist(M.x, M.y, th.x + b.x, th.y + b.y) < b.r + 8) {
              b.r -= dt * 12;
              if (Math.random() < 0.5) this.chips.push({ x: th.x + b.x, y: th.y + b.y, vx: G.rand(-30, 30), vy: G.rand(-40, -8), col: P.plaque, t: 0, life: 0.4 });
              if (b.r <= 1.4) { b.gone = true; G.audio.sfx('scrape'); G.spark(th.x + b.x, th.y + b.y, ['#fff', P.plaqueLt], 8); }
            }
          }
          if (s.blobs.every((b) => b.gone)) { this.advance(th); G.audio.loop('scrape', false); this.act = null; }
        } else if (s.kind === 'gingiva') {
          const gy = th.up ? th.y + th.h : th.y;
          if (Math.abs(M.y - gy) < 16 && M.x > th.x - 6 && M.x < th.x + th.w + 6) {
            s.prog += dt * 0.8;
            if (Math.random() < 0.3) { G.bleed(M.x, M.y, 2, { force: 30, floor }); G.state.today.blood += 1; }
            if (s.prog >= 1) { s.cleaned = true; this.advance(th); G.audio.loop('scrape', false); this.act = null; }
          }
        }
      }
      G.audio.loop('scrape', scraping, 0.9);

      if (a && a.type === 'forceps' && M.down) {
        const th = a.th, s = th.sym;
        if (G.dist(M.x, M.y, a.sx, a.sy) > 12) {
          s.pulled = true;
          G.audio.sfx('wetPull');
          this.pulled.push({ x: th.x + s.lx, y: th.y + s.ly, vx: G.rand(-25, 25), vy: -80, col: s.col, w: s.w, h: s.h, t: 0 });
          G.bleed(th.x + s.lx, th.y + s.ly, 5, { force: 50, floor });
          G.state.today.blood += 2;
          this.advance(th);
          this.act = null;
        }
      }

      if (a && a.type === 'extract' && M.down) {
        const th = a.th;
        a.loose = G.clamp(a.loose + dt * 0.22, 0, 1);
        const dir = M.vx > 40 ? 1 : M.vx < -40 ? -1 : 0;
        if (dir !== 0 && dir !== a.lastSide) {
          a.lastSide = dir;
          a.loose = G.clamp(a.loose + 0.14, 0, 1);
          G.audio.sfx('clack');
          th.tilt = (th.tilt || 0) + dir * 0.05;
          G.bleed(th.x + th.w / 2, th.up ? th.y + th.h : th.y, 3, { force: 35, floor });
          G.state.today.blood += 1;
          G.shake(1.2, 0.08);
        }
        if (a.loose >= 1) {
          G.audio.sfx('crack'); G.audio.sfx('spurt');
          G.screenFlash(P.blood, 0.16);
          G.shake(5, 0.4);
          G.bleed(th.x + th.w / 2, th.up ? th.y + th.h : th.y, 26, { dir: th.up ? Math.PI / 2 : -Math.PI / 2, force: 120, floor });
          for (let i = 0; i < 4; i++) G.addOoze(th.x + G.rand(2, th.w - 2), th.up ? th.y + th.h - 3 : th.y + 3, P.blood, G.rand(6, 16));
          G.state.today.blood += 18;
          this.pulled.push({ x: th.x + th.w / 2, y: th.y + th.h / 2, vx: G.rand(-30, 30), vy: -110, col: P.bone, w: th.w * 0.5, h: th.h * 0.55, t: 0, tooth: true });
          th.sym.out = true;
          this.hurt(0.16, true);
          this.flinch = 0.6;
          this.advance(th);
          this.act = null;
        }
      }

      if (a && a.type === 'suction' && M.down) {
        sucking = true;
        for (let i = G.stains.length - 1; i >= 0; i--) {
          const s = G.stains[i];
          if (G.dist(M.x, M.y, s.x, s.y) < 16) { s.r -= dt * 20; if (s.r <= 1) G.stains.splice(i, 1); }
        }
        for (let i = G.ooze.length - 1; i >= 0; i--) if (G.dist(M.x, M.y, G.ooze[i].x, G.ooze[i].y) < 16) G.ooze.splice(i, 1);
        const th = this.toothAt(M.x, M.y, 14);
        if (th && th.charted && !th.done && this.step(th) === 'suction') {
          th.sucked = (th.sucked || 0) + dt;
          if (th.sucked > 0.7) this.advance(th);
        }
      } else if (a && a.type === 'suction' && !M.down) this.act = null;
      G.audio.loop('suction', sucking, 1);

      for (let i = this.chips.length - 1; i >= 0; i--) {
        const p = this.chips[i];
        p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt;
        if (p.t > p.life) this.chips.splice(i, 1);
      }
      for (let i = this.pulled.length - 1; i >= 0; i--) {
        const p = this.pulled[i];
        p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * dt;
        if (p.t > 1.4) this.pulled.splice(i, 1);
      }
      for (const th of this.teeth) {
        if (th.sym && th.charted && !th.done && Math.random() < dt * 0.4)
          G.addOoze(th.x + G.rand(2, th.w - 2), th.up ? th.y + th.h - 2 : th.y + 2, P.bloodDk, G.rand(2, 6));
      }
    },

    // ---------- draw ----------
    draw(g) {
      G.toastY = 126;                  // down on the lower jaw, off the teeth
      const t = this.t;
      if (!this.teeth) return;

      // ---- sewer clinic room ----
      G.R(g, 0, 0, G.W, G.H, P.night);
      G.sewerWall(g, 0, 0, G.W, 120, t);
      G.pipe(g, 0, 4, G.W, false, t);
      G.pipe(g, 2, 14, 96, true, t);
      G.grate(g, 12, 128, 34, 14);
      // one bare bulb over the chair
      const sw = Math.sin(t * 0.9) * 5;
      G.R(g, 160 + sw * 0.4, 0, 1, 14, '#2e3d5c');
      G.box(g, 157 + sw, 13, 8, 7, '#ffe9a8', { lit: '#ffffff', dk: '#c9a83a', r: 1, band: 1 });
      G.glow(g, 160 + sw, 26, 90, 60, '#ffdf9a', 1.1);
      G.R(g, 0, 120, G.W, 60, P.night2);
      G.R(g, 0, 120, G.W, 1, P.night3);

      // ---- the patient ----
      const cav = G.drawMaw(g, this.p.sp, MAW.x, MAW.y, MAW.w, MAW.h, {
        t, mood: this.winT > 0 ? 'relief' : this.mood, flinch: this.flinch > 0,
      });
      for (const th of this.teeth) this.drawTooth(g, th, t);

      G.drawGoreWorld(g);
      for (const p of this.chips) { g.globalAlpha = 1 - p.t / p.life; G.R(g, p.x, p.y, 2, 2, p.col); g.globalAlpha = 1; }
      for (const p of this.pulled) {
        g.globalAlpha = G.clamp(1.4 - p.t, 0, 1);
        if (p.tooth) G.box(g, p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, P.bone, { r: 1, band: 1, spec: false });
        else G.box(g, p.x, p.y, p.w, p.h, p.col, { r: 1, band: 0, spec: false });
        g.globalAlpha = 1;
      }
      G.drawFlies(g);

      // ---- mitt + instrument ----
      const M = G.mouse;
      if (M.y < TRAY_Y - 4 && M.x >= 0) {
        const jig = (this.act && this.act.type === 'drill' && M.down) ? Math.sin(t * 50) * 1 : 0;
        G.drawTool(g, this.tool, Math.round(M.x + jig), Math.round(M.y), { active: M.down, t, grip: M.down });
        G.drawMitt(g, Math.round(M.x + jig), Math.round(M.y) + 12, { grip: M.down });
        G.hideCursor = true;
      }

      // ---- progress bar for the current procedure ----
      const a = this.act;
      if (a && (a.type === 'drill' || a.type === 'fill' || a.type === 'extract' ||
                (a.type === 'scale' && a.th.sym.kind === 'gingiva'))) {
        let prog = 0, lab = '';
        if (a.type === 'drill') { prog = a.depth; lab = 'BORING'; }
        else if (a.type === 'fill') { prog = a.level; lab = 'PACKING'; }
        else if (a.type === 'extract') { prog = a.loose; lab = 'LOOSENING'; }
        else { prog = a.th.sym.prog || 0; lab = 'SCALING'; }
        prog = G.clamp(prog, 0, 1);
        G.box(g, 106, 140, 108, 11, '#161f33', { r: 1, band: 1, spec: false });
        G.R(g, 109, 143, 102, 5, '#0d1220');
        G.R(g, 109, 143, Math.round(102 * prog), 5, G.mix(P.amber, P.neonG, prog));
        G.text(g, lab, 160, 131, P.steel2, { align: 'center', out: OUT });
      }

      // ---- HUD ----
      G.box(g, 2, 2, 52, 12, '#161f33', { r: 1, band: 1, spec: false });
      G.R(g, 6, 6, 4, 5, P.gold);
      G.text(g, '$' + Math.round(G.state.moneyShown), 13, 4, P.gold);
      G.box(g, 58, 2, 44, 12, '#161f33', { r: 1, band: 1, spec: false });
      G.text(g, (this.pi + 1) + '/' + this.queue.length, 62, 4, P.neonC);
      const open = this.sick().length;
      G.box(g, 106, 2, 62, 12, '#161f33', { r: 1, band: 1, spec: false });
      G.text(g, open ? open + ' TO FIX' : 'ALL FIXED', 110, 4, open ? P.warn : P.neonG);
      if (this.fieldDirty()) {
        G.box(g, 172, 2, 54, 12, '#161f33', { r: 1, band: 1, spec: false });
        G.text(g, 'BLOODY', 176, 4, P.bloodLit);
      }
      // ouch meter, kept up in the HUD row where the patient can't cover it
      G.box(g, 212, 2, 86, 12, '#161f33', { r: 1, band: 1, spec: false });
      G.text(g, 'OUCH', 216, 4, P.steel, {});
      G.R(g, 244, 5, 50, 6, '#0d1220');
      G.R(g, 244, 5, Math.round(50 * this.pain), 6, this.pain > 0.6 ? P.bloodLit : P.amber);

      if (this.msgT > 0) {
        const w = G.tw(this.msg) + 10;
        g.globalAlpha = Math.min(1, this.msgT * 2);
        G.box(g, 160 - w / 2, 139, w, 12, '#1a0d14', { r: 1, band: 1, spec: false });
        G.text(g, this.msg, 160, 142, this.msgCol, { align: 'center' });
        g.globalAlpha = 1;
      }

      // ---- tray ----
      G.R(g, 0, TRAY_Y - 2, G.W, G.H - TRAY_Y + 2, '#101828');
      G.R(g, 0, TRAY_Y - 2, G.W, 1, P.night3);
      for (let i = 0; i < TOOLS.length; i++) {
        const bx = 3 + i * 24, sel = this.tool === TOOLS[i];
        G.box(g, bx, TRAY_Y + 3, 22, 18, sel ? '#3d7ac8' : '#1c2740', { r: 1, band: 2, spec: false });
        G.drawTool(g, TOOLS[i], bx + 11, TRAY_Y + 18, { t });
      }
      G.box(g, 199, TRAY_Y + 3, 42, 18, '#5c4a8a', { r: 1, band: 2 });
      G.text(g, 'BOOK', 220, TRAY_Y + 9, '#e8e0ff', { align: 'center' });
      const cf = this.canFinish();
      G.box(g, 245, TRAY_Y + 3, 70, 18, cf ? '#3d9a4a' : '#28323f', { r: 1, band: 2 });
      G.text(g, 'DISCHARGE', 280, TRAY_Y + 9, cf ? '#e8ffe8' : '#5a6470', { align: 'center' });

      if (this.book) this.drawBook(g, t);

      if (this.winT > 0) {
        g.globalAlpha = Math.min(0.7, this.winT * 0.6);
        G.R(g, 0, 0, G.W, G.H, '#0d1220');
        g.globalAlpha = 1;
        G.text(g, 'DISCHARGED', 160, 74, P.neonC, { align: 'center', out: OUT, sc: 2 });
        G.text(g, 'THEY ALWAYS COME BACK', 160, 94, P.steel2, { align: 'center', out: OUT });
      }
      G.grade(g, 1);
    },

    drawTooth(g, th, t) {
      const s = th.sym;
      if (s && s.kind === 'impacted' && s.out) {
        // socket
        G.box(g, th.x + 2, th.up ? th.y + th.h - 12 : th.y, th.w - 4, 12, '#3d0f1c', { r: 1, band: 1, spec: false });
        G.speckle(g, th.x + 3, th.up ? th.y + th.h - 11 : th.y + 1, th.w - 6, 10, P.blood, 0.28, th.i);
        return;
      }
      g.save();
      if (th.tilt) {
        g.translate(th.x + th.w / 2, th.y + th.h / 2);
        g.rotate(th.tilt);
        g.translate(-(th.x + th.w / 2), -(th.y + th.h / 2));
      }
      G.tooth3(g, th, { dead: s && s.kind === 'necrosis' });
      if (s) G.drawSymptom(g, s.kind, th, s, t);
      if (th.done) G.text(g, '✓', th.x + th.w / 2, th.up ? th.y + 3 : th.y + th.h - 10, '#3d9a4a', { align: 'center', out: OUT });
      else if (th.charted) G.text(g, '' + (th.step + 1), th.x + th.w / 2, th.up ? th.y + 3 : th.y + th.h - 10, P.gold, { align: 'center', out: OUT });
      else if (th.examined) G.text(g, '?', th.x + th.w / 2, th.up ? th.y + 3 : th.y + th.h - 10, P.warn, { align: 'center', out: OUT });
      if (th.flash > 0) { g.globalAlpha = th.flash * 1.5; G.rr2(g, th.x, th.y, th.w, th.h, '#ffffff'); g.globalAlpha = 1; }
      g.restore();
    },

    drawBook(g, t) {
      g.globalAlpha = 0.72; G.R(g, 0, 0, G.W, G.H, '#0d1220'); g.globalAlpha = 1;
      G.box(g, 6, 8, 308, 148, '#c9c0a0', { lit: '#ddd4b4', dk: '#a89a78', r: 2, band: 3, spec: false });
      G.R(g, 158, 10, 2, 144, '#a89a78');
      G.text(g, 'CASE', 12, 14, '#3a3524');
      G.text(g, 'WHAT IS IT?', 164, 14, '#3a3524');
      G.box(g, 268, 12, 42, 13, '#8a4a3a', { r: 1, band: 2 });
      G.text(g, 'CLOSE', 289, 15, '#ffe8e0', { align: 'center' });

      const th = this.bookTooth;
      if (th && th.sym) {
        const sym = G.sympById(th.sym.kind);
        G.text(g, this.p.name + '  TOOTH ' + (th.i + 1), 12, 26, '#5a5238');
        // magnified specimen
        G.box(g, 12, 36, 62, 66, '#3d0f1c', { r: 1, band: 1, spec: false });
        g.save();
        g.beginPath(); g.rect(13, 37, 60, 64); g.clip();
        g.translate(43, 70); g.scale(1.9, 1.9); g.translate(-(th.x + th.w / 2), -(th.y + th.h / 2));
        G.tooth3(g, th, { dead: th.sym.kind === 'necrosis' });
        G.drawSymptom(g, th.sym.kind, th, th.sym, t);
        g.restore();
        // the sign, wrapped
        const words = sym.sign.split(' ');
        let line = '', ly = 108;
        for (const w of words) {
          if (G.tw(line + ' ' + w) > 132) { G.text(g, line, 12, ly, '#2a2418'); ly += 10; line = w; }
          else line = line ? line + ' ' + w : w;
        }
        if (line) G.text(g, line, 12, ly, '#2a2418');
        if (G.hasUp('loupe')) G.text(g, 'LOUPE: ' + sym.dx, 12, ly + 14, '#2a6b34');
      } else {
        G.text(g, 'PROBE A TOOTH FIRST.', 12, 30, '#5a5238');
        G.text(g, 'LEARNED ' + G.state.dxSeen.length + '/' + G.DATA.symptoms.length, 12, 46, '#2a2418');
      }

      const list = G.DATA.symptoms;
      for (let i = 0; i < list.length; i++) {
        const ry = 40 + i * 15;
        const known = G.state.dxSeen.includes(list[i].id);
        const hov = G.inRect(G.mouse.x, G.mouse.y, 160, ry, 148, 14);
        G.R(g, 160, ry, 148, 14, hov ? '#b8ae8c' : '#c2b896');
        G.R(g, 160, ry, 2, 14, known ? '#2a6b34' : '#8a7a58');
        G.text(g, list[i].dx, 166, ry + 4, '#2a2418');
        if (known) G.text(g, '✓', 302, ry + 4, '#2a6b34');
      }
      G.hideCursor = false;
    },
  };
})();

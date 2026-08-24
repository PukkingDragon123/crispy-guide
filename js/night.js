// ============================================================
// DOUBLE LIFE v4 - night.js  ·  THE WORKSHOP
// 320x180. A robot lies open on the bench, its chassis cavity
// filling the frame with six module bays. Scan a bay, name the
// fault on the diagnostic tablet, and the tools just work.
//
// Every fault in here is something you did to them this afternoon.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  const TRAY_Y = 158;
  const TOOLS = ['scan', 'scrape', 'blow', 'vac', 'heat', 'oil', 'solder', 'weld', 'pull', 'swap'];
  const CAV = { x: 16, y: 40, w: 288, h: 98 };
  const NBAY = 6;                                  // 3 across, 2 down
  const DX_CANDIDATES = 3;                         // the tablet narrows it to three

  const night = (G.scenes = G.scenes || {}).night = {
    enter() {
      if (!G.state.today) G.newDayStats();
      this.t = 0;
      this.tool = 'scan';
      this.book = false;
      this.bookBay = null;
      this.act = null;
      this.chips = [];
      this.pulled = [];
      this.pi = -1;
      this.msg = null; this.msgT = 0;
      this.load = 0;                               // the "OVERLOAD" readout
      this.doneAll = false;
      this.jolt = 0;
      G.cam.reset(0, 0, 0, 0);
      G.steam.length = 0;
      const src = (G.state.today.jobs || []).slice();
      this.queue = src.length ? src
        : [{ sp: 'dozer', name: 'DOZ-9', sugar: 14, faults: ['sugarcrust', 'sprinklejam', 'syrupshort'] }];
      G.audio.music('night');
      this.next();
      if (!G.state.tut.shop) {
        G.state.tut.shop = 1;
        this.say('SCAN A BAY, THEN NAME IT ON THE TABLET', P.cyanLt);
        this.msgT = 5;
      }
    },

    layout() {
      const bays = [];
      const cols = 3, rows = 2;
      const bw = Math.floor((CAV.w - 20) / cols) - 8;
      const bh = Math.floor((CAV.h - 14) / rows) - 6;
      for (let r = 0; r < rows; r++) {
        for (let cI = 0; cI < cols; cI++) {
          bays.push({
            x: CAV.x + 12 + cI * (bw + 12),
            y: CAV.y + 8 + r * (bh + 10),
            w: bw, h: bh, i: r * cols + cI,
            fault: null, scanned: false, charted: false, step: 0, done: false, flash: 0,
          });
        }
      }
      return bays;
    },

    materialise(m, kind) {
      const w = m.w, h = m.h;
      const s = { kind };
      if (kind === 'sugarcrust') {
        s.blobs = [];
        for (let i = 0, n = G.irand(2, 3); i < n; i++)
          s.blobs.push({ x: G.rand(6, w - 6), y: G.rand(h * 0.55, h - 5), r: G.rand(3, 5), gone: false });
      }
      if (kind === 'syrupshort') { s.jx = w * 0.5 + G.rand(-6, 6); s.jy = h * 0.62; s.cleaned = false; s.soldered = false; }
      if (kind === 'sprinklejam') {
        s.freed = false; s.bits = [];
        for (let i = 0, n = G.irand(4, 6); i < n; i++)
          s.bits.push({ x: w * 0.5 + G.rand(-9, 9), y: h * 0.5 + G.rand(-9, 9), col: G.pick(G.MULTI_COLS.sprinkles), gone: false });
      }
      if (kind === 'coldseize') {
        s.thawed = false; s.oiled = false; s.crystals = [];
        for (let i = 0, n = G.irand(4, 6); i < n; i++)
          s.crystals.push({ x: G.rand(3, w - 5), y: G.rand(3, h - 5), w: G.irand(2, 4), h: G.irand(2, 4) });
      }
      if (kind === 'dairyrot') { s.corner = Math.random() < 0.5 ? 0 : 1; s.cleaned = false; s.cut = false; s.soldered = false; }
      if (kind === 'nutcrack') {
        s.welded = false; s.pts = [];
        let cy = 2;
        for (let i = 0; i < 4; i++) { s.pts.push({ x: w * 0.3 + G.rand(-6, 10), y: cy }); cy += h / 3.2; }
      }
      if (kind === 'wedged') {
        s.lx = Math.random() < 0.5 ? 3 : w - 9; s.ly = h * 0.34;
        s.w = G.irand(4, 6); s.h = G.irand(7, 10);
        s.col = G.pick(['#c9a06a', '#e8d8b0', '#3a2418', '#6ee06e', '#d8a03a']);
        s.grabbed = false; s.pulled = false;
      }
      if (kind === 'overload') { s.swapped = false; s.soldered = false; }
      m.fault = s;
    },

    next() {
      G.audio.loop('drill', false); G.audio.loop('scrape', false);
      G.audio.loop('suction', false); G.audio.loop('goo', false);
      this.pi++;
      this.act = null; this.book = false; this.bookBay = null;
      this.load = 0;
      G.clearGore();
      this.chips.length = 0; this.pulled.length = 0;
      if (this.pi >= this.queue.length) { this.doneAll = true; return; }
      const p = this.queue[this.pi];
      this.p = p;
      this.model = G.modelOf(p.sp);
      this.bays = this.layout();
      const idx = this.bays.map((_, i) => i).sort(() => Math.random() - 0.5);
      let k = 0;
      for (const fid of p.faults) { if (k >= idx.length) break; this.materialise(this.bays[idx[k++]], fid); }
      this.mood = 'worried'; this.moodT = 0; this.winT = 0;
      G.audio.sfx('boot');
      G.toast(p.name + ' · ' + p.faults.length + ' FAULT' + (p.faults.length > 1 ? 'S' : ''), P.cyanLt);
    },

    // ---------- helpers ----------
    broken() { return this.bays.filter((m) => m.fault && !m.done); },
    bayDirty() { return G.stains.length > 10; },
    canFinish() { return this.broken().length === 0 && !this.bayDirty() && this.winT === 0; },
    say(m, col) { this.msg = m; this.msgCol = col || P.warn; this.msgT = 2.2; },
    stress(a, big) {
      this.load = G.clamp(this.load + a * (G.hasUp('sedative') ? 0.5 : 0.8), 0, 0.96);
      this.mood = big ? 'angry' : 'worried';
      this.moodT = big ? 0.8 : 0.4;
    },
    pay(amt, x, y, label) {
      G.state.today.nightEarn += amt;
      G.flyCoin(x, y, amt);
      G.floatText((label ? label + ' ' : '') + '+$' + amt, x, y - 8, P.lime);
    },
    bayAt(x, y, pad) {
      pad = pad === undefined ? 4 : pad;
      for (const m of this.bays) if (G.inRect(x, y, m.x - pad, m.y - pad, m.w + pad * 2, m.h + pad * 2)) return m;
      return null;
    },
    step(m) { return m.fault && m.charted ? G.faultById(m.fault.kind).steps[m.step] : null; },
    // the tablet only ever offers three answers: the real one plus two decoys
    candidates(m) {
      if (m.dxList) return m.dxList;
      const all = G.DATA.faults.map((f) => f.id).filter((id) => id !== m.fault.kind);
      const pickTwo = [];
      const shuffled = all.sort(() => Math.random() - 0.5);
      for (let i = 0; i < DX_CANDIDATES - 1; i++) pickTwo.push(shuffled[i]);
      m.dxList = [m.fault.kind].concat(pickTwo).sort(() => Math.random() - 0.5);
      return m.dxList;
    },
    advance(m) {
      const f = G.faultById(m.fault.kind);
      m.step++;
      if (m.step >= f.steps.length) {
        m.done = true; m.flash = 0.5;
        this.mood = 'happy'; this.moodT = 1.2;
        G.audio.sfx('clean');
        G.spark(m.x + m.w / 2, m.y + m.h / 2, ['#fff', P.lime], 12);
        this.pay(f.pay, m.x + m.w / 2, m.y + m.h / 2, 'FIXED');
        G.state.today.fixed++; G.state.totFixed++;
      } else {
        G.audio.sfx('fillDone');
        this.say('NEXT: ' + G.toolById(f.steps[m.step]).name, P.cyanLt);
      }
    },

    // ---------- input ----------
    onDown(x, y) {
      if (this.doneAll) return;

      if (this.book) {
        if (G.inRect(x, y, 268, 12, 42, 13)) { this.book = false; G.audio.sfx('bookFlip'); return; }
        const m = this.bookBay;
        if (!m || !m.fault) { this.book = false; return; }
        const list = this.candidates(m);
        for (let i = 0; i < list.length; i++) {
          const ry = 54 + i * 22;
          if (G.inRect(x, y, 158, ry, 152, 20)) {
            const f = G.faultById(list[i]);
            if (list[i] === m.fault.kind) {
              m.charted = true;
              if (!G.state.dxSeen.includes(f.id)) G.state.dxSeen.push(f.id);
              G.audio.sfx('dxRight');
              this.pay(5, m.x + m.w / 2, m.y + m.h / 2, 'LOGGED');
              this.say('IT IS ' + f.dx + ' - USE THE ' + G.toolById(f.steps[0]).name, P.lime);
              this.book = false;
            } else {
              G.audio.sfx('dxWrong');
              G.state.today.misdx++; G.state.totMisdx++;
              this.jolt = 0.4; this.stress(0.08, false);
              this.say('NO. RESCAN IT.', P.magenta);
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
          if (G.inRect(x, y, 2 + i * 19, TRAY_Y + 3, 17, 18)) {
            if (this.tool !== TOOLS[i]) { this.tool = TOOLS[i]; this.act = null; G.audio.sfx('clack'); }
            return;
          }
        }
        if (G.inRect(x, y, 196, TRAY_Y + 3, 46, 18)) { this.book = true; G.audio.sfx('bookOpen'); return; }
        if (G.inRect(x, y, 246, TRAY_Y + 3, 70, 18)) {
          if (this.canFinish()) this.finish();
          else if (this.broken().length) this.say('FAULTS STILL OPEN', P.warn);
          else this.say('VACUUM THE SPILL FIRST', P.warn);
        }
        return;
      }

      if (this.tool === 'vac') { this.act = { type: 'vac' }; return; }

      const m = this.bayAt(x, y);
      if (!m) return;

      if (this.tool === 'scan') {
        G.audio.sfx('probe');
        if (!m.fault) { this.say('THIS BAY IS CLEAN', P.steel2); return; }
        m.scanned = true; this.bookBay = m; this.book = true;
        G.audio.sfx('bookOpen');
        return;
      }
      if (!m.fault) { G.audio.sfx('denied'); this.say('LEAVE THE GOOD ONES', P.warn); return; }
      if (!m.scanned) { G.audio.sfx('denied'); this.say('SCAN IT FIRST', P.warn); return; }
      if (!m.charted) { G.audio.sfx('denied'); this.say('NAME IT ON THE TABLET', P.warn); this.book = true; this.bookBay = m; return; }
      if (m.done) { this.say('ALREADY DONE', P.steel2); return; }
      const need = this.step(m);
      if (this.tool !== need) { G.audio.sfx('denied'); this.say('NEEDS THE ' + G.toolById(need).name, P.warn); return; }

      const s = m.fault;
      if (this.tool === 'scrape') this.act = { type: 'scrape', m };
      else if (this.tool === 'blow') this.act = { type: 'blow', m, prog: 0 };
      else if (this.tool === 'heat') this.act = { type: 'heat', m, prog: 0 };
      else if (this.tool === 'oil') this.act = { type: 'oil', m, prog: 0 };
      else if (this.tool === 'solder') this.act = { type: 'solder', m, prog: 0 };
      else if (this.tool === 'weld') this.act = { type: 'weld', m, prog: 0 };
      else if (this.tool === 'pull') {
        if (G.dist(x, y, m.x + s.lx + s.w / 2, m.y + s.ly + s.h / 2) > 14) { this.say('GRIP THE OBJECT', P.warn); return; }
        s.grabbed = true;
        this.act = { type: 'pull', m, sx: x, sy: y };
        G.audio.sfx('grab');
      } else if (this.tool === 'swap') {
        this.act = { type: 'swap', m, loose: 0, lastSide: 0 };
        G.audio.sfx('grab');
      }
    },

    onUp() {
      const a = this.act;
      if (!a) return;
      if (a.type === 'blow' || a.type === 'weld') G.audio.loop('drill', false);
      if (a.type === 'oil' || a.type === 'solder' || a.type === 'heat') G.audio.loop('goo', false);
      if (a.type === 'scrape') G.audio.loop('scrape', false);
      if (a.type === 'vac') G.audio.loop('suction', false);
      if (a.type === 'pull' && a.m.fault) a.m.fault.grabbed = false;
      this.act = null;
    },

    finish() {
      let bonus = 9;
      if (G.state.today.misdx === 0) bonus += 6;
      this.pay(bonus, 160, 80, 'SIGNED OFF');
      G.audio.sfx('perfect');
      this.winT = 0.01;
      this.mood = 'happy';
      G.state.totJobs++;
    },

    // ---------- update ----------
    update(dt) {
      this.t += dt;
      if (this.doneAll) { G.audio.stopAllLoops(); G.save(); G.go('summary', 'BOOKS CLOSED'); return; }
      const M = G.mouse;
      if (this.msgT > 0) this.msgT -= dt;
      if (this.jolt > 0) this.jolt -= dt;
      if (this.moodT > 0) { this.moodT -= dt; if (this.moodT <= 0) this.mood = 'worried'; }
      this.load = Math.max(0, this.load - dt * 0.1);
      for (const m of this.bays) if (m.flash > 0) m.flash -= dt;
      G.updateSteam(dt);
      if (Math.random() < dt * 1.1) G.puffSteam(G.irand(10, 310), 176);

      if (this.winT > 0) {
        this.winT += dt;
        G.audio.stopAllLoops();
        if (this.winT > 1.6) this.next();
        return;
      }

      const a = this.act;
      let blowing = false, scraping = false, sucking = false, gooing = false;
      const floor = CAV.y + CAV.h - 8;

      // ---- SCRAPER: flake the crust off, or cut back a rotted terminal ----
      if (a && a.type === 'scrape' && M.down) {
        const m = a.m, s = m.fault;
        scraping = Math.hypot(M.vx, M.vy) > 10;
        if (s.kind === 'sugarcrust') {
          for (const b of s.blobs) {
            if (b.gone) continue;
            if (G.dist(M.x, M.y, m.x + b.x, m.y + b.y) < b.r + 13) {
              b.r -= dt * 17;
              if (Math.random() < 0.5) this.chips.push({ x: m.x + b.x, y: m.y + b.y, vx: G.rand(-30, 30), vy: G.rand(-40, -8), col: P.sugarCrust, t: 0, life: 0.4 });
              if (b.r <= 1.4) { b.gone = true; G.audio.sfx('scrape'); G.spark(m.x + b.x, m.y + b.y, ['#fff', P.sugarCrust], 8); }
            }
          }
          if (s.blobs.every((b) => b.gone)) { this.advance(m); G.audio.loop('scrape', false); this.act = null; }
        } else if (s.kind === 'dairyrot') {
          a.prog = (a.prog || 0) + dt * 0.85;
          if (Math.random() < 0.4) this.chips.push({ x: M.x, y: M.y, vx: G.rand(-26, 26), vy: G.rand(-40, -8), col: '#9aad3a', t: 0, life: 0.4 });
          if (a.prog >= 1) { s.cut = true; this.advance(m); G.audio.loop('scrape', false); this.act = null; }
        }
      }
      G.audio.loop('scrape', scraping, 0.9);

      // ---- BLOWER: blast the sprinkles out of the gear ----
      if (a && a.type === 'blow' && M.down) {
        const m = a.m, s = m.fault;
        blowing = true;
        a.prog += dt * (G.hasUp('carbide') ? 1.5 : 0.85);
        for (const b of s.bits) {
          if (b.gone) continue;
          b.x += G.rand(-1, 1) * 4; b.y -= dt * 22;
          if (b.y < -4) {
            b.gone = true;
            this.chips.push({ x: m.x + b.x, y: m.y + b.y, vx: G.rand(-50, 50), vy: G.rand(-70, -20), col: b.col, t: 0, life: 0.5 });
          }
        }
        G.shake(0.5, 0.05);
        if (a.prog >= 1) {
          s.freed = true;
          for (const b of s.bits) b.gone = true;
          G.audio.sfx('zap');
          G.spark(m.x + m.w / 2, m.y + m.h / 2, ['#fff', P.cyanLt], 14);
          this.advance(m);
          this.act = null;
          G.audio.loop('drill', false);
        }
      }

      // ---- HEATER: thaw the frost ----
      if (a && a.type === 'heat' && M.down) {
        const m = a.m, s = m.fault;
        gooing = true;
        a.prog += dt * 0.8;
        for (const c of s.crystals) if (Math.random() < dt * 6) { c.w = Math.max(1, c.w - 1); c.h = Math.max(1, c.h - 1); }
        if (Math.random() < 0.3) G.puffSteam(m.x + G.rand(4, m.w - 4), m.y + G.rand(4, m.h - 4));
        if (a.prog >= 1) {
          s.thawed = true;
          G.audio.sfx('fillDone');
          G.spark(m.x + m.w / 2, m.y + m.h / 2, ['#fff', P.coolantLt], 10);
          this.advance(m);
          this.act = null;
        }
      }

      // ---- OILER: flood the bearing ----
      if (a && a.type === 'oil' && M.down) {
        const m = a.m, s = m.fault;
        gooing = true;
        a.prog += dt * 0.9;
        if (Math.random() < 0.4) this.chips.push({ x: M.x, y: M.y, vx: G.rand(-10, 10), vy: G.rand(10, 30), col: '#6b5028', t: 0, life: 0.35 });
        if (a.prog >= 1) {
          s.oiled = true;
          G.audio.sfx('fillDone');
          this.advance(m);
          this.act = null;
        }
      }

      // ---- SOLDER: re-run the joint ----
      if (a && a.type === 'solder' && M.down) {
        const m = a.m, s = m.fault;
        gooing = true;
        a.prog += dt * 0.85;
        if (Math.random() < 0.5) this.chips.push({ x: M.x + G.rand(-2, 2), y: M.y, vx: G.rand(-14, 14), vy: G.rand(-30, -6), col: P.hullLt, t: 0, life: 0.3 });
        if (Math.random() < 0.2) G.puffSteam(M.x, M.y);
        if (a.prog >= 1) {
          s.soldered = true;
          G.audio.sfx('fillDone');
          G.spark(m.x + m.w / 2, m.y + m.h / 2, ['#fff', P.hazard], 10);
          this.advance(m);
          this.act = null;
        }
      }

      // ---- WELDER: close the crack, with a lot of arc ----
      if (a && a.type === 'weld' && M.down) {
        const m = a.m, s = m.fault;
        blowing = true;
        a.prog += dt * (G.hasUp('carbide') ? 1.4 : 0.78);
        if (Math.random() < 0.8) this.chips.push({ x: M.x + G.rand(-3, 3), y: M.y, vx: G.rand(-70, 70), vy: G.rand(-80, -10), col: Math.random() < 0.5 ? '#ffffff' : P.cyanLt, t: 0, life: 0.4 });
        G.shake(0.7, 0.05);
        if (a.prog >= 1) {
          s.welded = true;
          G.audio.sfx('weld'); G.screenFlash(P.cyanLt, 0.1);
          G.spark(m.x + m.w / 2, m.y + m.h / 2, ['#fff', P.cyanLt, P.hazard], 16);
          this.advance(m);
          this.act = null;
          G.audio.loop('drill', false);
        }
      }
      G.audio.loop('drill', blowing, 1);
      G.audio.loop('goo', gooing, 0.85);

      // ---- PULLERS: draw the wedged object out ----
      if (a && a.type === 'pull' && M.down) {
        const m = a.m, s = m.fault;
        if (G.dist(M.x, M.y, a.sx, a.sy) > 12) {
          s.pulled = true;
          G.audio.sfx('wetPull');
          this.pulled.push({ x: m.x + s.lx, y: m.y + s.ly, vx: G.rand(-25, 25), vy: -80, col: s.col, w: s.w, h: s.h, t: 0 });
          G.bleed(m.x + s.lx, m.y + s.ly, 4, { force: 45, floor, cols: ['#4a3a5e', '#2a1f3a', '#6b5a80'] });
          G.state.today.mess += 2;
          this.advance(m);
          this.act = null;
        }
      }

      // ---- SWAPPER: rock the dead module out of its socket ----
      if (a && a.type === 'swap' && M.down) {
        const m = a.m;
        a.loose = G.clamp(a.loose + dt * 0.3, 0, 1);
        const dir = M.vx > 40 ? 1 : M.vx < -40 ? -1 : 0;
        if (dir !== 0 && dir !== a.lastSide) {
          a.lastSide = dir;
          a.loose = G.clamp(a.loose + 0.16, 0, 1);
          G.audio.sfx('clank');
          m.tilt = (m.tilt || 0) + dir * 0.04;
          G.shake(1.2, 0.08);
        }
        if (a.loose >= 1) {
          G.audio.sfx('crack'); G.audio.sfx('zap');
          G.screenFlash(P.cyanLt, 0.14);
          G.shake(4, 0.35);
          G.bleed(m.x + m.w / 2, m.y + m.h / 2, 14, { dir: -Math.PI / 2, force: 100, floor, cols: ['#3affd0', '#12a888', '#a8ffe8'] });
          for (let i = 0; i < 3; i++) G.addOoze(m.x + G.rand(2, m.w - 2), m.y + m.h - 3, P.coolantDk, G.rand(6, 14));
          G.state.today.mess += 14;
          this.pulled.push({ x: m.x + m.w / 2, y: m.y + m.h / 2, vx: G.rand(-30, 30), vy: -110, col: '#1d3a30', w: m.w * 0.6, h: m.h * 0.6, t: 0, module: true });
          m.fault.swapped = true;
          m.tilt = 0;
          this.stress(0.16, true);
          this.jolt = 0.5;
          this.advance(m);
          this.act = null;
        }
      }

      // ---- VACUUM: clear the bay ----
      if (a && a.type === 'vac' && M.down) {
        sucking = true;
        for (let i = G.stains.length - 1; i >= 0; i--) {
          const s = G.stains[i];
          if (G.dist(M.x, M.y, s.x, s.y) < 24) { s.r -= dt * 30; if (s.r <= 1) G.stains.splice(i, 1); }
        }
        for (let i = G.ooze.length - 1; i >= 0; i--) if (G.dist(M.x, M.y, G.ooze[i].x, G.ooze[i].y) < 24) G.ooze.splice(i, 1);
        const m = this.bayAt(M.x, M.y, 14);
        if (m && m.charted && !m.done && this.step(m) === 'vac') {
          m.vacd = (m.vacd || 0) + dt;
          if (m.fault.kind === 'syrupshort') m.fault.cleaned = true;
          if (m.fault.kind === 'dairyrot') m.fault.cleaned = true;
          if (m.vacd > 0.7) this.advance(m);
        }
      } else if (a && a.type === 'vac' && !M.down) this.act = null;
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
      // untreated faults keep weeping
      for (const m of this.bays) {
        if (m.fault && m.charted && !m.done && Math.random() < dt * 0.35)
          G.addOoze(m.x + G.rand(2, m.w - 2), m.y + m.h - 2, P.oilLt, G.rand(2, 6));
      }
    },

    // ---------- draw ----------
    draw(g) {
      G.toastY = 20; G.toastCX = 0;
      const t = this.t;
      if (!this.bays) return;

      // ---- the workshop ----
      G.R(g, 0, 0, G.W, G.H, P.cityDk);
      G.cityWall(g, 0, 0, G.W, G.H, t);
      G.conduit(g, 0, 2, G.W, false, P.magenta);
      // the inspection lamp
      const lampY = 8;
      G.R(g, 158, 0, 3, lampY, P.plateDk);
      G.box(g, 132, lampY, 56, 7, P.plateDk, { lit: P.plate, dk: P.plateDk2, r: 1, band: 1 });
      G.R(g, 136, lampY + 6, 48, 2, '#fff8d8');
      G.glow(g, 160, 60, 190, 96, '#ffeec0', 1.3);
      // the bench
      G.box(g, 0, CAV.y + CAV.h + 8, G.W, 26, P.plate, { lit: P.plateLt, dk: P.plateDk, r: 2, band: 4 });

      // ---- the robot on the bench ----
      const jx = this.jolt > 0 ? Math.round(Math.sin(t * 60) * 2) : 0;
      g.save(); g.translate(jx, 0);
      G.chassisFrame(g, CAV.x, CAV.y, CAV.w, CAV.h, this.model, t);
      // its head, tipped back off the top of the cavity, watching you work
      const hx = CAV.x + 36;
      G.robotBust(g, this.p.sp, hx, CAV.y - 16, 0.44,
        { t, open: this.mood === 'angry' ? 0.8 : 0.2, mood: this.mood });

      // ---- bays ----
      for (const m of this.bays) {
        const sel = G.inRect(G.mouse.x, G.mouse.y, m.x - 4, m.y - 4, m.w + 8, m.h + 8);
        // bay label
        G.R(g, m.x - 2, m.y - 9, 22, 8, P.plateDk2);
        G.text(g, 'B' + (m.i + 1), m.x, m.y - 8, m.done ? P.lime : m.fault ? P.hazard : P.steel);
        g.save();
        if (m.tilt) { g.translate(m.x + m.w / 2, m.y + m.h); g.rotate(m.tilt); g.translate(-(m.x + m.w / 2), -(m.y + m.h)); }
        G.moduleBox(g, m, { dead: m.fault && m.fault.kind === 'overload' && !m.fault.swapped, fixed: m.done || !m.fault });
        if (m.fault) G.drawFault(g, m.fault.kind, m, m.fault, t);
        g.restore();
        if (m.flash > 0) {
          g.globalAlpha = m.flash * 1.6;
          G.rr(g, m.x - 3, m.y - 3, m.w + 6, m.h + 6, P.lime);
          g.globalAlpha = 1;
        }
        // selection frame + state pip
        if (sel && !this.book) {
          const c = m.done ? P.lime : m.fault ? P.hazard : P.steel;
          for (let i = 0; i < 4; i++) {
            const cx2 = m.x - 3 + (i % 2) * (m.w + 4), cy2 = m.y - 3 + ((i >> 1) & 1) * (m.h + 4);
            G.R(g, cx2, cy2, 3, 1, c); G.R(g, cx2, cy2, 1, 3, c);
          }
        }
        if (m.fault && !m.done) {
          const pip = m.charted ? P.lime : m.scanned ? P.hazard : P.magenta;
          if (Math.sin(t * 5 + m.i) > -0.4) G.R(g, m.x + m.w - 3, m.y - 8, 5, 5, pip);
        }
      }
      G.drawGoreWorld(g);
      for (const p of this.chips) G.R(g, p.x, p.y, 2, 2, p.col);
      for (const p of this.pulled) {
        g.globalAlpha = G.clamp(1.4 - p.t, 0, 1);
        if (p.module) G.box(g, p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, p.col, { lit: '#2f5c48', dk: '#0d1a14', r: 1, band: 1 });
        else G.box(g, p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, p.col, { r: 1, band: 1 });
        g.globalAlpha = 1;
      }
      g.restore();
      G.drawSteam(g);

      // ---- HUD ----
      G.box(g, 2, 2, 50, 12, P.ink2, { r: 1, band: 1, spec: false });
      G.R(g, 6, 6, 4, 5, P.hazard);
      G.text(g, '$' + Math.round(G.state.moneyShown), 13, 4, P.hazard);
      G.box(g, 56, 2, 46, 12, P.ink2, { r: 1, band: 1, spec: false });
      G.text(g, (this.pi + 1) + '/' + this.queue.length, 60, 4, P.cyanLt);
      const open = this.broken().length;
      G.box(g, 106, 2, 62, 12, P.ink2, { r: 1, band: 1, spec: false });
      G.text(g, open ? open + ' TO FIX' : 'ALL CLEAR', 110, 4, open ? P.warn : P.lime);
      if (this.bayDirty()) {
        G.box(g, 172, 2, 40, 12, P.ink2, { r: 1, band: 1, spec: false });
        G.text(g, 'SPILL', 176, 4, P.coolantLt);
      }
      // overload readout
      G.box(g, 216, 2, 82, 12, P.ink2, { r: 1, band: 1, spec: false });
      G.text(g, 'LOAD', 220, 4, P.steel2);
      G.R(g, 246, 5, 48, 6, '#0d1220');
      G.R(g, 246, 5, Math.round(48 * this.load), 6, this.load > 0.6 ? P.magenta : P.hazard);

      if (this.msgT > 0) {
        const w = G.tw(this.msg) + 10;
        g.globalAlpha = Math.min(1, this.msgT * 2);
        G.box(g, 160 - w / 2, 141, w, 12, '#140f22', { r: 1, band: 1, spec: false });
        G.text(g, this.msg, 160, 144, this.msgCol, { align: 'center' });
        g.globalAlpha = 1;
      }

      // ---- tray ----
      G.R(g, 0, TRAY_Y - 2, G.W, G.H - TRAY_Y + 2, '#0c0d16');
      G.R(g, 0, TRAY_Y - 2, G.W, 1, P.cyanDk);
      for (let i = 0; i < TOOLS.length; i++) {
        const bx = 2 + i * 19, on = this.tool === TOOLS[i];
        G.box(g, bx, TRAY_Y + 3, 17, 18, on ? P.cyanDk : '#1a1e2a', { r: 1, band: 1, spec: false });
        if (on) G.R(g, bx, TRAY_Y + 3, 17, 1, P.cyanLt);
        G.mechTool(g, TOOLS[i], bx + 9, TRAY_Y + 20, { t, active: on && this.act });
      }
      G.box(g, 196, TRAY_Y + 3, 46, 18, this.book ? P.violet : '#3a2a5c', { r: 1, band: 2 });
      G.text(g, 'TABLET', 219, TRAY_Y + 8, '#f0e8ff', { align: 'center' });
      const fin = this.canFinish();
      G.box(g, 246, TRAY_Y + 3, 70, 18, fin ? '#2f8a48' : '#20242e', { r: 1, band: 2 });
      G.text(g, 'SIGN OFF', 281, TRAY_Y + 8, fin ? '#e8ffe8' : '#4a5060', { align: 'center' });

      // ---- the tablet ----
      if (this.book) this.tablet(g);

      if (this.winT > 0) {
        g.globalAlpha = Math.min(0.7, this.winT * 0.9);
        G.R(g, 0, 0, G.W, G.H, P.cityDk);
        g.globalAlpha = 1;
        G.text(g, this.p.name + ' REBOOTED', 160, 74, P.lime, { align: 'center', out: OUT, sc: 2 });
        G.text(g, 'NEXT ON THE BENCH', 160, 94, P.cyanLt, { align: 'center', out: OUT });
      }
      G.grade(g, 1);
    },

    // the diagnostic tablet: the scan on the left, three answers on the right
    tablet(g) {
      const t = this.t;
      const m = this.bookBay;
      G.box(g, 6, 8, 308, 146, '#141a2a', { lit: '#232c44', dk: '#0a0d16', r: 2, band: 3, spec: false });
      G.R(g, 8, 10, 304, 1, P.cyanDk);
      G.text(g, 'DIAGNOSTIC', 12, 14, P.cyanLt);
      G.text(g, this.p.name + '  BAY ' + (m ? m.i + 1 : '?'), 12, 24, P.steel2);
      G.box(g, 268, 12, 42, 13, '#5c2030', { r: 1, band: 1 });
      G.text(g, 'CLOSE', 289, 15, '#ffd8e0', { align: 'center' });

      if (!m || !m.fault) { G.text(g, 'NOTHING SELECTED', 160, 80, P.steel, { align: 'center' }); return; }
      const f = G.faultById(m.fault.kind);
      // the scan image
      G.faultThumb(g, m.fault.kind, 14, 38, 128, 74, t);
      G.R(g, 14, 116, 128, 1, P.cyanDk);
      // the sign, wrapped over two lines
      const words = f.sign.split(' ');
      let l1 = '', l2 = '';
      for (const w of words) { if (G.tw(l1 + w) < 122) l1 += (l1 ? ' ' : '') + w; else l2 += (l2 ? ' ' : '') + w; }
      G.text(g, l1, 14, 122, P.cream);
      if (l2) G.text(g, l2, 14, 132, P.cream);
      if (G.hasUp('loupe') && f.book) G.text(g, 'LOGGED ' + G.state.dxSeen.length + '/' + G.DATA.faults.length, 14, 144, P.steel);

      G.text(g, 'WHAT IS IT?', 158, 38, P.hazard);
      const list = this.candidates(m);
      for (let i = 0; i < list.length; i++) {
        const ff = G.faultById(list[i]);
        const ry = 54 + i * 22;
        const hov = G.inRect(G.mouse.x, G.mouse.y, 158, ry, 152, 20);
        G.box(g, 158, ry, 152, 20, hov ? P.cyanDk : '#1d2436', { r: 1, band: 1, spec: false });
        G.R(g, 158, ry, 2, 20, hov ? P.cyanLt : P.plateDk);
        G.text(g, ff.dx, 164, ry + 3, hov ? '#ffffff' : P.cream);
        const known = G.state.dxSeen.includes(ff.id);
        G.text(g, known ? ff.book.slice(0, 30) : 'NOT YET LOGGED', 164, ry + 12, known ? P.steel2 : P.steel);
      }
      G.text(g, 'PICK THE RIGHT ONE.', 158, 122, P.steel);
    },
  };
})();

// ============================================================
// DOUBLE LIFE v2 - night.js  ·  THE CLINIC
// Examine the tooth. Name the disease in the notebook. Only then
// may you cut. Seven instruments that simply work while you hold
// them - no timing windows, no punishment - and blood that stays
// on the field until you suck it off.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  const WORLD = 900, WH = 300;
  const TRAY_Y = 302;
  const TOOLS = ['probe', 'scale', 'drill', 'fill', 'forceps', 'extract', 'lance', 'suction'];
  const UW = [62, 54, 46, 40, 40, 46, 54, 62];
  const LW = [56, 48, 42, 36, 36, 42, 48, 56];

  const night = (G.scenes = G.scenes || {}).night = {
    enter() {
      if (!G.state.today) G.newDayStats();
      this.t = 0;
      this.tool = 'probe';
      this.book = false;
      this.bookTooth = null;
      this.act = null;
      this.panDrag = null;
      this.parts = [];
      this.chips = [];
      this.pulled = [];
      this.pi = -1;
      this.msg = null; this.msgT = 0;
      this.pain = 0;
      this.doneAll = false;
      this.beat = 0; this.lastRock = 0;
      G.cam.reset(0, WORLD - G.W, 0, 0);
      G.cam.goto(130, 0, true);
      const src = (G.state.today.patients || []).slice();
      this.queue = src.length ? src : [{ sp: 'gator', name: 'CHOMP', sugar: 14, symptoms: ['caries', 'tartar', 'abscess'] }];
      G.audio.music('night');
      this.next();
      if (!G.state.tut.clinic) {
        G.state.tut.clinic = 1;
        G.toast('PROBE A TOOTH, THEN NAME IT IN THE BOOK', P.neonC);
      }
    },

    layout() {
      const teeth = [];
      let x = 40;
      for (let i = 0; i < 8; i++) {
        const arc = Math.round(Math.sin(i / 7 * Math.PI) * 9);
        teeth.push({ x, y: 46 + arc, w: UW[i], h: 60 + (i === 0 || i === 7 ? 5 : 0), up: true, i, tilt: 0 });
        x += UW[i] + 42;
      }
      x = 46;
      for (let i = 0; i < 8; i++) {
        const arc = Math.round(Math.sin(i / 7 * Math.PI) * 9);
        teeth.push({ x, y: 194 - arc, w: LW[i], h: 56, up: false, i: i + 8, tilt: 0 });
        x += LW[i] + 48;
      }
      for (const th of teeth) {
        th.sym = null; th.examined = false; th.charted = false; th.step = 0; th.done = false; th.flash = 0;
      }
      return teeth;
    },

    materialise(th, kind) {
      const w = th.w, h = th.h;
      const s = { kind };
      if (kind === 'caries') { s.lx = w * 0.5; s.ly = h * 0.42; s.r = G.rand(7, 10); s.stage = 'decay'; s.fill = 0; }
      if (kind === 'necrosis') { s.lx = w * 0.5; s.ly = h * 0.44; s.r = G.rand(10, 13); s.opened = false; s.fill = 0; }
      if (kind === 'tartar') {
        s.blobs = [];
        const n = G.irand(3, 5);
        for (let i = 0; i < n; i++) s.blobs.push({ x: G.rand(8, w - 8), y: th.up ? G.rand(h * 0.6, h - 8) : G.rand(8, h * 0.4), r: G.rand(5, 9), gone: false });
      }
      if (kind === 'abscess') { s.lx = w * 0.5; s.ly = th.up ? h + 8 : -8; s.r = G.rand(11, 15); s.lanced = false; }
      if (kind === 'fracture') {
        s.lx = w * 0.5; s.bonded = false; s.pts = [];
        let cy = th.up ? 6 : h - 6;
        for (let i = 0; i < 4; i++) {
          cy += (th.up ? 1 : -1) * (h / 4.6);
          s.pts.push({ x: w * 0.5 + G.rand(-7, 7), y: cy });
        }
      }
      if (kind === 'foreign') {
        s.lx = Math.random() < 0.5 ? 3 : w - 9; s.ly = h * 0.42;
        s.w = G.irand(6, 9); s.h = G.irand(11, 16);
        s.col = G.pick(['#efe6d2', '#7a5228', '#3f3268', '#ff2e88']);
        s.grabbed = false; s.pulled = false;
      }
      if (kind === 'gingiva') { s.cleaned = false; s.prog = 0; }
      if (kind === 'impacted') { th.tilt = G.rand(0.3, 0.5) * (Math.random() < 0.5 ? -1 : 1); s.out = false; }
      th.sym = s;
    },

    next() {
      G.audio.loop('drill', false); G.audio.loop('scrape', false); G.audio.loop('suction', false);
      this.pi++;
      this.act = null; this.book = false; this.bookTooth = null;
      this.pain = 0;
      G.clearGore();
      this.chips.length = 0; this.pulled.length = 0; this.parts.length = 0;
      if (this.pi >= this.queue.length) { this.doneAll = true; return; }
      const p = this.queue[this.pi];
      this.p = p;
      this.teeth = this.layout();
      const idx = this.teeth.map((_, i) => i).sort(() => Math.random() - 0.5);
      let k = 0;
      for (const sid of p.symptoms) {
        if (k >= idx.length) break;
        this.materialise(this.teeth[idx[k++]], sid);
      }
      this.mood = 'worry';
      this.moodT = 0;
      this.winT = 0;
      G.audio.sfx('doorbell');
      G.toast(p.name + ' · ' + G.animalById(p.sp).name + ' · ' + p.symptoms.length + ' FINDING' + (p.symptoms.length > 1 ? 'S' : ''), P.neonC);
    },

    // ---------- helpers ----------
    sick() { return this.teeth.filter((th) => th.sym && !th.done); },
    fieldDirty() { return G.stains.length > 6; },
    allTreated() { return this.sick().length === 0; },
    canFinish() { return this.allTreated() && !this.fieldDirty() && this.winT === 0; },
    say(m, col) { this.msg = m; this.msgCol = col || P.warn; this.msgT = 2.2; },
    // A discomfort readout only: it rises while you work and settles
    // again on its own. Nothing here can cost the player the case.
    hurt(amount, agony) {
      this.pain = G.clamp(this.pain + amount * (G.hasUp('sedative') ? 0.5 : 0.8), 0, 0.96);
      this.mood = agony ? 'agony' : 'worry';
      this.moodT = agony ? 0.8 : 0.4;
    },
    pay(amt, x, y, label) {
      if (G.hasUp('comfy')) amt = Math.round(amt * 1.25);
      G.state.today.nightEarn += amt;
      G.flyCoin(x - Math.round(G.cam.x), y - Math.round(G.cam.y), amt);
      G.floatText((label ? label + '  ' : '') + '+$' + amt, x - Math.round(G.cam.x), y - Math.round(G.cam.y) - 12, P.neonG);
    },
    toothAt(wx, wy, pad) {
      pad = pad || 6;
      for (const th of this.teeth) if (G.inRect(wx, wy, th.x - pad, th.y - pad, th.w + pad * 2, th.h + pad * 2)) return th;
      return null;
    },
    step(th) { return th.sym && th.charted ? G.sympById(th.sym.kind).steps[th.step] : null; },
    advance(th) {
      const sym = G.sympById(th.sym.kind);
      th.step++;
      if (th.step >= sym.steps.length) {
        th.done = true; th.flash = 0.6;
        this.mood = 'relief'; this.moodT = 1.2;
        G.audio.sfx('clean');
        G.spark(th.x + th.w / 2 - Math.round(G.cam.x), th.y + th.h / 2, ['#fff', P.neonC], 14);
        this.pay(sym.pay, th.x + th.w / 2, th.y + th.h / 2, 'TREATED');
        G.state.today.fixed++;
        G.state.totFixed++;
      } else {
        G.audio.sfx('fillDone');
        this.say('NEXT: ' + G.toolById(sym.steps[th.step]).name, P.neonC);
      }
    },

    // ---------- input ----------
    onDown(sx, sy) {
      if (this.doneAll) return;
      const wx = sx + Math.round(G.cam.x), wy = sy + Math.round(G.cam.y);

      // ---- notebook overlay ----
      if (this.book) {
        // close
        if (G.inRect(sx, sy, 560, 30, 52, 18)) { this.book = false; G.audio.sfx('bookFlip'); return; }
        const list = G.DATA.symptoms;
        for (let i = 0; i < list.length; i++) {
          const ry = 74 + i * 26;
          if (G.inRect(sx, sy, 330, ry, 278, 24)) {
            const th = this.bookTooth;
            if (!th || !th.sym) { this.book = false; return; }
            if (list[i].id === th.sym.kind) {
              th.charted = true;
              if (!G.state.dxSeen.includes(list[i].id)) G.state.dxSeen.push(list[i].id);
              G.audio.sfx('dxRight');
              this.pay(5, th.x + th.w / 2, th.y + th.h / 2, 'CHARTED');
              this.say('CHARTED: ' + list[i].dx + ' - BEGIN WITH ' + G.toolById(list[i].steps[0]).name, P.neonG);
              this.book = false;
              this.mood = 'worry'; this.moodT = 0.3;
            } else {
              G.audio.sfx('dxWrong');
              G.state.today.misdx++;
              G.state.totMisdx++;
              G.state.money = Math.max(0, G.state.money - 4);
              G.state.moneyShown = G.state.money;
              this.hurt(0.1, false);
              this.flinch = 0.4;
              this.say('WRONG. THAT IS NOT WHAT YOU ARE LOOKING AT. -$4', P.blood);
              G.shake(2, 0.2);
            }
            return;
          }
        }
        return;
      }

      // ---- tray (screen space) ----
      if (sy >= TRAY_Y - 4) {
        for (let i = 0; i < TOOLS.length; i++) {
          if (G.inRect(sx, sy, 8 + i * 54, TRAY_Y + 4, 48, 46)) {
            if (this.tool !== TOOLS[i]) { this.tool = TOOLS[i]; this.act = null; G.audio.sfx('clack'); }
            return;
          }
        }
        if (G.inRect(sx, sy, 448, TRAY_Y + 4, 82, 46)) { this.book = true; this.bookTooth = this.bookTooth || null; G.audio.sfx('bookOpen'); return; }
        if (G.inRect(sx, sy, 540, TRAY_Y + 4, 92, 46)) {
          if (this.canFinish()) this.finish();
          else if (!this.allTreated()) this.say('FINDINGS STILL OPEN', P.warn);
          else this.say('SUCTION THE FIELD FIRST', P.warn);
          return;
        }
        return;
      }

      // ---- suction works anywhere in the cavity ----
      if (this.tool === 'suction') { this.act = { type: 'suction' }; return; }

      const th = this.toothAt(wx, wy);
      if (!th) { this.panDrag = { sx, camX: G.cam.tx }; return; }

      // ---- probe: examine ----
      if (this.tool === 'probe') {
        G.audio.sfx('probe');
        if (!th.sym) { this.say('NOTHING WRONG WITH THIS ONE', P.steel2); return; }
        th.examined = true;
        this.bookTooth = th;
        this.book = true;
        G.audio.sfx('bookOpen');
        return;
      }

      // ---- gates ----
      if (!th.sym) { G.audio.sfx('denied'); this.say('LEAVE THE HEALTHY ONES ALONE', P.warn); return; }
      if (!th.examined) { G.audio.sfx('denied'); this.say('PROBE IT FIRST', P.warn); return; }
      if (!th.charted) { G.audio.sfx('denied'); this.say('NOT CHARTED - NAME IT IN THE BOOK', P.warn); this.book = true; this.bookTooth = th; return; }
      if (th.done) { this.say('ALREADY DEALT WITH', P.steel2); return; }
      const need = this.step(th);
      if (this.tool !== need) {
        G.audio.sfx('denied');
        this.say('WRONG INSTRUMENT - THIS NEEDS THE ' + G.toolById(need).name, P.warn);
        return;
      }

      // ---- start the procedure ----
      const s = th.sym;
      if (this.tool === 'drill') this.act = { type: 'drill', th, depth: 0 };
      else if (this.tool === 'fill') this.act = { type: 'fill', th, level: 0 };
      else if (this.tool === 'scale') this.act = { type: 'scale', th, prog: 0, band: 0, tot: 0 };
      else if (this.tool === 'lance') {
        if (G.dist(wx, wy, th.x + s.lx, th.y + s.ly) > s.r + 20) { this.say('PUT THE BLADE ON THE SWELLING', P.warn); return; }
        // one clean cut - no timing ring to beat
        s.lanced = true;
        G.audio.sfx('lance');
        G.bleed(th.x + s.lx, th.y + s.ly, 24, { dir: th.up ? Math.PI / 2 : -Math.PI / 2, spread: 0.9, force: 150, floor: th.up ? 190 : 214 });
        for (let i = 0; i < 12; i++) this.chips.push({ x: th.x + s.lx, y: th.y + s.ly, vx: G.rand(-90, 90), vy: G.rand(-110, -20), col: P.pus, t: 0, life: 0.6 });
        G.state.today.blood += 6;
        G.screenFlash('#d9d34a', 0.1);
        this.mood = 'relief'; this.moodT = 1.4;
        this.advance(th);
        this.act = null;
      } else if (this.tool === 'forceps') {
        if (G.dist(wx, wy, th.x + s.lx, th.y + s.ly) > 20) { this.say('GRIP THE OBJECT ITSELF', P.warn); return; }
        s.grabbed = true;
        this.act = { type: 'forceps', th, sx: wx, sy: wy };
        G.audio.sfx('grab');
      } else if (this.tool === 'extract') {
        this.act = { type: 'extract', th, loose: 0, lastSide: 0 };
        G.audio.sfx('grab');
      }
    },

    onMove(sx, sy) {
      if (this.panDrag) G.cam.goto(this.panDrag.camX - (sx - this.panDrag.sx), null);
    },

    onUp(sx, sy) {
      this.panDrag = null;
      const a = this.act;
      if (!a) return;
      const th = a.th;

      if (a.type === 'drill') { G.audio.loop('drill', false); this.act = null; return; }
      if (a.type === 'fill') { G.audio.loop('goo', false); this.act = null; return; }
      if (a.type === 'scale') {
        G.audio.loop('scrape', false);
        this.act = null;
        return;
      }
      if (a.type === 'forceps') { th.sym.grabbed = false; this.act = null; return; }
      if (a.type === 'extract') { this.act = null; return; }
      if (a.type === 'suction') { G.audio.loop('suction', false); this.act = null; return; }
      this.act = null;
    },

    onWheel(d) { G.cam.nudge(d > 0 ? 70 : -70); },

    finish() {
      let bonus = 8;
      if (G.state.today.misdx === 0) bonus += 6;
      this.pay(bonus, WORLD / 2, 150, 'CLEAN CASE');
      G.audio.sfx('perfect');
      this.winT = 0.01;
      this.mood = 'relief';
    },

    // ---------- update ----------
    update(dt) {
      this.t += dt;
      if (this.doneAll) {
        G.audio.stopAllLoops();
        G.save();
        G.go('summary', 'BOOKS CLOSED');
        return;
      }
      const M = G.mouse;
      const wx = M.wx, wy = M.wy;
      if (this.msgT > 0) this.msgT -= dt;
      this.pain = Math.max(0, this.pain - dt * 0.09);   // discomfort settles on its own
      if (this.flinch > 0) this.flinch -= dt;
      if (this.moodT > 0) { this.moodT -= dt; if (this.moodT <= 0 && this.mood !== 'out') this.mood = 'worry'; }
      for (const th of this.teeth) if (th.flash > 0) th.flash -= dt;
      this.beat += dt;

      if (this.winT > 0) {
        this.winT += dt;
        G.audio.stopAllLoops();
        if (this.winT > 1.8) this.next();
        return;
      }

      const a = this.act;
      let drilling = false, scraping = false, sucking = false;

      // ---- drill ----
      if (a && a.type === 'drill' && M.down) {
        const th = a.th, s = th.sym;
        const near = G.dist(wx, wy, th.x + s.lx, th.y + s.ly) < s.r + 22;
        if (near) {
          drilling = true;
          a.depth += dt * (G.hasUp('carbide') ? 1.15 : 0.62);
          if (Math.random() < 0.6) this.chips.push({ x: th.x + s.lx + G.rand(-4, 4), y: th.y + s.ly,
            vx: G.rand(-70, 70), vy: G.rand(-90, -30), col: G.pick(['#3a2c22', '#8a7a5a', '#e8dcc0']), t: 0, life: 0.4 });
          G.shake(0.6, 0.05);
          if (a.depth >= 1) {
            if (s.kind === 'necrosis') s.opened = true; else s.stage = 'drilled';
            G.audio.sfx('crack');
            G.spark(th.x + s.lx - Math.round(G.cam.x), th.y + s.ly, ['#e8dcc0', '#8a7a5a'], 14);
            G.bleed(th.x + s.lx, th.y + s.ly, 7, { force: 70, floor: th.up ? 190 : 214 });
            G.state.today.blood += 2;
            this.hurt(0.06, false);
            this.advance(th);
            this.act = null;
            G.audio.loop('drill', false);
          }
        }
      }
      G.audio.loop('drill', drilling, 1);

      // ---- fill ----
      if (a && a.type === 'fill' && M.down) {
        const th = a.th, s = th.sym;
        a.level += dt * 0.8;
        s.fill = G.clamp(a.level, 0, 1);
        G.audio.loop('goo', true, 0.85);
        if (a.level >= 1) {
          s.fill = 1;
          G.audio.loop('goo', false);
          G.audio.sfx('fillDone');
          G.spark(th.x + (s.lx === undefined ? th.w / 2 : s.lx) - Math.round(G.cam.x),
                  th.y + (s.ly === undefined ? th.h / 2 : s.ly), ['#fff', P.chrome], 12);
          this.advance(th);
          this.act = null;
        }
      } else if (a && a.type === 'fill') G.audio.loop('goo', false);

      // ---- scale ----
      if (a && a.type === 'scale' && M.down) {
        const th = a.th, s = th.sym;
        const spd = Math.hypot(M.vx, M.vy);
        a.tot += dt;
        scraping = spd > 12;
        if (s.kind === 'tartar') {
          for (const b of s.blobs) {
            if (b.gone) continue;
            if (G.dist(wx, wy, th.x + b.x, th.y + b.y) < b.r + 12) {
              b.r -= dt * 18;
              if (Math.random() < 0.5) this.chips.push({ x: th.x + b.x, y: th.y + b.y, vx: G.rand(-50, 50), vy: G.rand(-70, -10),
                col: P.plaque, t: 0, life: 0.45 });
              if (b.r <= 2) { b.gone = true; G.audio.sfx('scrape'); G.spark(th.x + b.x - Math.round(G.cam.x), th.y + b.y, ['#fff', P.plaqueLt], 10); }
            }
          }
          if (s.blobs.every((b) => b.gone)) { this.advance(th); G.audio.loop('scrape', false); this.act = null; }
        } else if (s.kind === 'gingiva') {
          const gy = th.up ? th.y + th.h : th.y;
          if (Math.abs(wy - gy) < 26 && wx > th.x - 8 && wx < th.x + th.w + 8) {
            s.prog += dt * 0.8;
            if (Math.random() < 0.3) { G.bleed(wx, wy, 2, { force: 40, floor: th.up ? 190 : 210 }); G.state.today.blood += 1; }
            if (s.prog >= 1) { s.cleaned = true; this.advance(th); G.audio.loop('scrape', false); this.act = null; }
          }
        }
      }
      G.audio.loop('scrape', scraping, 0.9);

      // ---- lance: the ring closes on its own; click to strike ----
      // ---- forceps: pull against resistance ----
      if (a && a.type === 'forceps' && M.down) {
        const th = a.th, s = th.sym;
        const d = G.dist(wx, wy, a.sx, a.sy);
        if (d > 16) {
          s.pulled = true;
          G.audio.sfx('wetPull');
          this.pulled.push({ x: th.x + s.lx, y: th.y + s.ly, vx: G.rand(-40, 40), vy: -140, col: s.col, w: s.w, h: s.h, t: 0 });
          G.bleed(th.x + s.lx, th.y + s.ly, 7, { force: 80, floor: th.up ? 190 : 214 });
          G.state.today.blood += 2;
          G.spark(th.x + s.lx - Math.round(G.cam.x), th.y + s.ly, ['#fff', s.col], 8);
          this.advance(th);
          this.act = null;
        }
      }

      // ---- extract: rock on the beat, then it lifts ----
      if (a && a.type === 'extract' && M.down) {
        const th = a.th;
        // simply holding works; waggling is faster. It always comes out.
        a.loose = G.clamp(a.loose + dt * 0.2, 0, 1);
        const dir = M.vx > 55 ? 1 : M.vx < -55 ? -1 : 0;
        if (a.loose >= 1 || (dir !== 0 && dir !== a.lastSide)) {
          a.lastSide = dir || a.lastSide;
          {
            a.loose = G.clamp(a.loose + 0.14, 0, 1);
            G.audio.sfx('clack');
            th.tilt = (th.tilt || 0) + dir * 0.06;
            G.bleed(th.x + th.w / 2, th.up ? th.y + th.h : th.y, 4, { force: 60, floor: th.up ? 190 : 214 });
            G.state.today.blood += 1;
            G.shake(1.4, 0.08);
            if (a.loose >= 1) {
              // OUT
              G.audio.sfx('crack'); G.audio.sfx('spurt'); G.audio.sfx('scream');
              G.screenFlash(P.blood, 0.2);
              G.shake(7, 0.5);
              G.bleed(th.x + th.w / 2, th.up ? th.y + th.h : th.y, 40,
                { dir: th.up ? Math.PI / 2 : -Math.PI / 2, spread: 1.2, force: 220, floor: th.up ? 194 : 220 });
              for (let i = 0; i < 6; i++) G.addOoze(th.x + G.rand(4, th.w - 4), th.up ? th.y + th.h - 4 : th.y + 4, P.blood, G.rand(10, 26));
              G.state.today.blood += 22;
              G.state.totBlood = (G.state.totBlood || 0) + 22;
              this.pulled.push({ x: th.x + th.w / 2, y: th.y + th.h / 2, vx: G.rand(-60, 60), vy: -190,
                col: P.bone, w: th.w * 0.5, h: th.h * 0.6, t: 0, tooth: true });
              th.sym.out = true;
              this.hurt(0.16, true);
              this.flinch = 0.7;
              this.advance(th);
              this.act = null;
            }
          }
        }
      }

      // ---- suction ----
      if (a && a.type === 'suction' && M.down) {
        sucking = true;
        for (let i = G.stains.length - 1; i >= 0; i--) {
          const s = G.stains[i];
          if (G.dist(wx, wy, s.x, s.y) < 26) {
            s.r -= dt * 22;
            if (s.r <= 1) G.stains.splice(i, 1);
          }
        }
        for (let i = G.ooze.length - 1; i >= 0; i--) {
          const o = G.ooze[i];
          if (G.dist(wx, wy, o.x, o.y) < 26) G.ooze.splice(i, 1);
        }
        // suction can also be a required step (abscess/necrosis/impacted/gingiva)
        const th = this.toothAt(wx, wy, 22);
        if (th && th.charted && !th.done && this.step(th) === 'suction') {
          th.sucked = (th.sucked || 0) + dt;
          if (th.sucked > 0.75) this.advance(th);
        }
      } else if (a && a.type === 'suction' && !M.down) { this.act = null; }
      G.audio.loop('suction', sucking, 1);

      // particles
      for (let i = this.chips.length - 1; i >= 0; i--) {
        const p = this.chips[i];
        p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 340 * dt;
        if (p.t > p.life) this.chips.splice(i, 1);
      }
      for (let i = this.pulled.length - 1; i >= 0; i--) {
        const p = this.pulled[i];
        p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt;
        if (p.t > 1.6) this.pulled.splice(i, 1);
      }
      // passive bleeding from open work
      for (const th of this.teeth) {
        if (th.sym && th.charted && !th.done && Math.random() < dt * 0.5) {
          G.addOoze(th.x + G.rand(4, th.w - 4), th.up ? th.y + th.h - 2 : th.y + 2, P.bloodDk, G.rand(3, 9));
        }
      }
    },

    // ---------- draw ----------
    draw(g) {
      const t = this.t;
      const camX = Math.round(G.cam.x);
      if (!this.teeth) return;

      // ===== world: the oral cavity =====
      G.cam.push(g);
      // throat depth
      G.gradV(g, 0, 0, WORLD, WH, '#2a0c12', '#0d0407', 7);
      G.fe(g, WORLD / 2, 140, 190, 66, '#160609');
      G.fe(g, WORLD / 2, 142, 112, 38, '#0a0305');
      // the overhead lamp pool, soft so it does not band into rings
      G.glow(g, camX + G.W / 2, 138, 300, 190, '#ffe6c0', 1.5);

      // ---- gum arches: one formed ridge of tissue, scalloped between
      // each tooth and lit from above, instead of a row of pink discs
      const ridge = (up) => {
        const set = this.teeth.filter((th) => th.up === up);
        if (!set.length) return;
        const x0 = set[0].x - 26;
        const last = set[set.length - 1];
        const x1 = last.x + last.w + 26;
        const thick = 17;
        for (let px = x0; px < x1; px++) {
          let near = set[0], best = 1e9;
          for (const th of set) {
            const d = Math.abs(px - (th.x + th.w / 2));
            if (d < best) { best = d; near = th; }
          }
          const half = near.w / 2;
          const lobe = best < half + 6 ? Math.pow(Math.cos((best / (half + 6)) * Math.PI * 0.5), 0.7) : 0;
          const baseY = up ? near.y + 6 : near.y + near.h - 6;
          const edge = Math.round(baseY + (up ? 1 : -1) * (lobe * 10 - 4));
          for (let k = 0; k < thick; k++) {
            const yy = up ? edge - k : edge + k;
            const p = k / thick;
            G.R(g, px, yy, 1, 1,
              p < 0.1 ? P.gumLit : p < 0.34 ? P.gum : p < 0.7 ? G.shade(P.gum, -0.22) : P.gumDk);
          }
          if ((px & 3) !== 3) G.R(g, px, edge, 1, 1, G.shade(P.gumLit, 0.25));
        }
      };
      ridge(true);
      ridge(false);
      // tongue
      // tongue: a domed muscle with a median furrow, lit from above
      const tW = 200, tH = 30, tCX = WORLD / 2, tCY = 168;
      for (let dx = -tW; dx <= tW; dx++) {
        const nx = dx / tW;
        const prof = Math.pow(Math.max(0, 1 - nx * nx), 0.62);
        if (prof <= 0.01) continue;
        const halfH = tH * prof;
        for (let dy = -halfH; dy <= halfH; dy++) {
          const ny = dy / (halfH || 1);
          const lam = G.clamp(0.5 - ny * 0.62 - Math.abs(nx) * 0.2, 0, 1);
          G.R(g, tCX + dx, tCY + dy, 1, 1,
            lam > 0.78 ? '#cf5a70' : lam > 0.6 ? '#b8384e' : lam > 0.4 ? '#96263c' : lam > 0.22 ? '#7a1c2e' : '#511020');
        }
      }
      G.R(g, tCX - 1, tCY - tH + 6, 2, tH * 1.4, '#6b1626');
      G.speckle(g, tCX - tW * 0.8, tCY - tH * 0.6, tW * 1.6, tH * 1.2, '#701c2c', 0.13, 4);

      // teeth
      for (const th of this.teeth) this.drawTooth(g, th, t);

      // a lip of gum drawn OVER each root so the teeth are seated in tissue
      for (const th of this.teeth) {
        const s = th.sym;
        if (s && s.kind === 'impacted' && s.out) continue;
        const ry = th.up ? th.y : th.y + th.h - 6;
        G.fe(g, th.x + th.w / 2, ry + 3, th.w * 0.42, 5, P.gumDk);
        G.fe(g, th.x + th.w / 2, ry + 2, th.w * 0.38, 3.5, P.gum);
        G.fe(g, th.x + th.w / 2 - th.w * 0.14, ry + 1, th.w * 0.12, 1.5, P.gumLit);
        // interdental papilla wedged between neighbours
        G.fe(g, th.x - 8, ry + 3, 5, 5, G.shade(P.gum, -0.2));
      }

      // gore on top of the teeth
      G.drawGoreWorld(g);
      for (const p of this.chips) {
        g.globalAlpha = 1 - p.t / p.life;
        G.R(g, p.x, p.y, 2, 2, p.col);
        g.globalAlpha = 1;
      }
      for (const p of this.pulled) {
        g.globalAlpha = G.clamp(1.6 - p.t, 0, 1);
        if (p.tooth) {
          G.rr2(g, p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, OUT);
          G.rr2(g, p.x - p.w / 2 + 1, p.y - p.h / 2 + 1, p.w - 2, p.h - 2, P.bone);
          G.R(g, p.x - p.w / 2 + 2, p.y + p.h / 2 - 5, p.w - 4, 4, P.blood);
        } else {
          G.R(g, p.x - 1, p.y - 1, p.w + 2, p.h + 2, OUT);
          G.R(g, p.x, p.y, p.w, p.h, p.col);
        }
        g.globalAlpha = 1;
      }
      G.cam.pop(g);

      // ===== screen space =====
      // croc arms + instruments
      const M = G.mouse;
      G.drawArm(g, 108, 288, -1, { grip: 0.9, reach: 22, thick: 30 });
      // the mirror in the left claw
      G.R(g, 104, 254, 4, 34, P.steel);
      G.fc(g, 106, 250, 9, OUT); G.fc(g, 106, 250, 8, '#a8c4cf');
      G.fc(g, 104, 248, 4, '#e8f4fa');
      const tipX = G.clamp(M.x, 14, G.W - 14), tipY = G.clamp(M.y, 40, TRAY_Y - 10);
      if (M.y < TRAY_Y - 6 && M.x >= 0) {
        G.drawArm(g, tipX, tipY + 24, 1, { grip: M.down ? 1 : 0.4, reach: 24, thick: 31 });
        const jig = (this.act && (this.act.type === 'drill') && M.down) ? Math.sin(t * 70) * 1.6 : 0;
        G.drawTool(g, this.tool, Math.round(tipX + jig), Math.round(tipY), { active: M.down, t, grip: M.down });
        G.hideCursor = true;
      }

      // one honest progress bar for whatever is under the instrument
      const act = this.act;
      if (act && (act.type === 'drill' || act.type === 'fill' || act.type === 'extract' ||
                  (act.type === 'scale' && act.th.sym.kind === 'gingiva'))) {
        let prog = 0, label = '';
        if (act.type === 'drill') { prog = act.depth; label = 'BORING IT OUT'; }
        else if (act.type === 'fill') { prog = act.level; label = 'PACKING IT FULL'; }
        else if (act.type === 'extract') { prog = act.loose; label = 'WORKING IT LOOSE'; }
        else { prog = act.th.sym.prog || 0; label = 'SCALING THE MARGIN'; }
        prog = G.clamp(prog, 0, 1);
        G.frame(g, G.W / 2 - 82, 262, 164, 15, '#16211f');
        G.R(g, G.W / 2 - 78, 266, 156, 7, '#0d1413');
        G.R(g, G.W / 2 - 78, 266, Math.round(156 * prog), 7, G.mix(P.amber, P.neonG, prog));
        for (let i = 8; i < 156; i += 8) G.R(g, G.W / 2 - 78 + i, 266, 1, 7, '#00000033');
        G.text(g, label, G.W / 2, 251, P.steel2, { align: 'center', out: OUT });
      }

      // ---- patient status panel ----
      G.frame(g, 4, 3, 124, 96, '#101a19');
      const fmood = this.winT > 0 ? 'relief' : this.mood;
      g.save();
      g.beginPath(); g.rect(7, 6, 118, 68); g.clip();
      G.drawFace(g, this.p.sp, 66, 62, { mood: fmood, mouth: 1, t, sweat: this.pain > 0.3, flinch: this.flinch > 0 });
      g.restore();
      G.R(g, 7, 74, 118, 1, '#243330');
      G.text(g, this.p.name, 66, 78, P.cream, { align: 'center' });
      G.text(g, 'OUCH', 9, 88, P.steel, {});
      G.R(g, 34, 89, 88, 5, '#0d1413');
      G.R(g, 34, 89, Math.round(88 * this.pain), 5, this.pain > 0.7 ? P.bloodLit : this.pain > 0.4 ? P.amber : '#2f8a45');

      // ---- HUD ----
      G.frame(g, 136, 3, 74, 16, '#16211f');
      G.fe(g, 147, 11, 4, 5, P.gold);
      G.text(g, '$' + Math.round(G.state.moneyShown), 156, 7, P.gold);
      G.frame(g, 218, 3, 96, 16, '#16211f');
      G.text(g, 'CASE ' + (this.pi + 1) + '/' + this.queue.length, 224, 7, P.neonC);
      const open = this.sick().length;
      G.frame(g, 318, 3, 104, 16, '#16211f');
      G.text(g, open ? open + ' OPEN FINDING' + (open > 1 ? 'S' : '') : 'ALL TREATED', 324, 7, open ? P.warn : P.neonG);
      if (this.fieldDirty()) {
        G.frame(g, 426, 3, 92, 16, '#16211f');
        G.text(g, 'FIELD BLOODY', 432, 7, P.bloodLit);
      }

      // message line
      if (this.msgT > 0) {
        g.globalAlpha = Math.min(1, this.msgT * 2);
        const w = G.tw(this.msg) + 14;
        G.frame(g, G.W / 2 - w / 2, 228, w, 15, '#160a0c');
        G.text(g, this.msg, G.W / 2, 232, this.msgCol, { align: 'center' });
        g.globalAlpha = 1;
      } else if (this.t % 8 < 4 && !this.act) {
        G.text(g, G.toolById(this.tool).hint, G.W / 2, 232, '#5d7a72', { align: 'center' });
      }

      // ---- tray ----
      G.R(g, 0, TRAY_Y - 2, G.W, G.H - TRAY_Y + 2, '#0a1210');
      G.R(g, 0, TRAY_Y - 2, G.W, 2, '#243330');
      G.gradV(g, 0, TRAY_Y, G.W, 12, '#1a2624', '#0d1615', 3);
      for (let i = 0; i < TOOLS.length; i++) {
        const bx = 8 + i * 54, sel = this.tool === TOOLS[i];
        G.frame(g, bx, TRAY_Y + 4, 48, 46, sel ? '#3d3a1c' : '#141f1d');
        if (sel) G.rr2(g, bx, TRAY_Y + 4, 48, 46, P.gold);
        G.drawTool(g, TOOLS[i], bx + 24, TRAY_Y + 44, { t });
        G.text(g, G.toolById(TOOLS[i]).name.slice(0, 7), bx + 24, TRAY_Y + 46 - 2, sel ? P.gold : '#4d6060', { align: 'center' });
      }
      G.drawBtn(g, 448, TRAY_Y + 4, 82, 46, 'BOOK', { col: '#3a2f5c' });
      const cf = this.canFinish();
      G.drawBtn(g, 540, TRAY_Y + 4, 92, 46, 'DISCHARGE', { col: cf ? '#2f6b3a' : '#2b3634', disabled: !cf });

      // ---- notebook overlay ----
      if (this.book) this.drawBook(g, t);

      // between-patient stinger
      if (this.winT > 0) {
        g.globalAlpha = Math.min(0.68, this.winT * 0.6);
        G.R(g, 0, 0, G.W, G.H, '#050908');
        g.globalAlpha = 1;
        G.text(g, 'DISCHARGED', G.W / 2, 140, P.neonC, { align: 'center', out: OUT, sc: 2 });
        G.text(g, this.p.name + ' WILL BE BACK. THEY ALWAYS COME BACK.', G.W / 2, 172, P.steel2, { align: 'center', out: OUT });
      }

      G.grade(g, 1.25, '#12060a');
    },

    drawTooth(g, th, t) {
      const s = th.sym;
      if (s && s.kind === 'impacted' && s.out) {
        // empty socket
        const sw = th.w * 0.42, sy0 = th.up ? th.y + th.h - 14 : th.y + 2;
        for (let dy = 0; dy < 14; dy++) {
          const p = dy / 13;
          const hw = sw * Math.sqrt(Math.max(0, 1 - Math.pow(p * 2 - 1, 2))) * 0.9 + 2;
          G.R(g, th.x + th.w / 2 - hw, sy0 + dy, hw * 2, 1,
            p < 0.2 ? '#3d1018' : p < 0.5 ? '#25090f' : '#100305');
        }
        G.speckle(g, th.x + 4, sy0, th.w - 8, 14, P.blood, 0.3, th.i);
        return;
      }
      g.save();
      if (th.tilt) {
        g.translate(th.x + th.w / 2, th.y + th.h / 2);
        g.rotate(th.tilt);
        g.translate(-(th.x + th.w / 2), -(th.y + th.h / 2));
      }
      G.drawEnamel(g, th, { dead: s && s.kind === 'necrosis', stain: !!s });
      if (s) G.drawSymptom(g, s.kind, th, s, t);
      // charting marks
      if (th.done) {
        G.text(g, '✓', th.x + th.w / 2, th.up ? th.y + 6 : th.y + th.h - 14, '#2f8a45', { align: 'center', out: OUT });
      } else if (th.charted) {
        G.oc(g, th.x + th.w / 2, th.up ? th.y + 12 : th.y + th.h - 12, 8, P.gold);
        G.text(g, '' + (th.step + 1), th.x + th.w / 2, th.up ? th.y + 9 : th.y + th.h - 15, P.gold, { align: 'center' });
      } else if (th.examined) {
        G.text(g, '?', th.x + th.w / 2, th.up ? th.y + 6 : th.y + th.h - 14, P.warn, { align: 'center', out: OUT });
      }
      if (th.flash > 0) {
        g.globalAlpha = th.flash * 1.4;
        G.rr2(g, th.x, th.y, th.w, th.h, '#ffffff');
        g.globalAlpha = 1;
      }
      g.restore();
    },

    drawBook(g, t) {
      g.globalAlpha = 0.74; G.R(g, 0, 0, G.W, G.H, '#050908'); g.globalAlpha = 1;
      // the spread
      G.rr2(g, 18, 22, 604, 268, '#0a0d0a');
      G.rr2(g, 20, 24, 600, 264, '#3a3524');
      G.rr2(g, 22, 26, 596, 260, '#d9d0b0');
      G.R(g, 318, 26, 4, 260, '#a89a78');
      G.speckle(g, 24, 28, 592, 256, '#b8ab88', 0.06, 5);
      // coffee ring + blood thumbprint
      G.oc(g, 90, 250, 22, '#b09a6a');
      G.oc(g, 90, 250, 21, '#bda878');
      G.fe(g, 560, 262, 7, 9, '#8a2030');
      G.speckle(g, 552, 252, 16, 20, '#6d1424', 0.3, 9);

      G.text(g, 'CASE NOTES', 40, 36, '#3a3524');
      G.text(g, 'DIAGNOSES', 336, 36, '#3a3524');
      G.drawBtn(g, 560, 30, 52, 18, 'CLOSE', { col: '#6b3a2a' });

      // ---- left page: the tooth under the loupe ----
      const th = this.bookTooth;
      if (th && th.sym) {
        const sym = G.sympById(th.sym.kind);
        G.text(g, 'PATIENT: ' + this.p.name, 40, 54, '#5a5238');
        G.text(g, 'TOOTH #' + (th.i + 1) + (th.up ? '  UPPER' : '  LOWER'), 40, 66, '#5a5238');
        // magnified specimen
        const bx = 46, by = 84, bw = 120, bh = 128;
        G.rr2(g, bx - 2, by - 2, bw + 4, bh + 4, '#3a3524');
        G.R(g, bx, by, bw, bh, '#2a0c12');
        g.save();
        g.beginPath(); g.rect(bx, by, bw, bh); g.clip();
        g.translate(bx + bw / 2, by + bh / 2);
        g.scale(1.55, 1.55);
        g.translate(-(th.x + th.w / 2), -(th.y + th.h / 2));
        G.fe(g, th.x + th.w / 2, th.up ? th.y + 6 : th.y + th.h - 6, th.w * 0.6, 20, P.gum);
        G.drawEnamel(g, th, { dead: th.sym.kind === 'necrosis', stain: true });
        G.drawSymptom(g, th.sym.kind, th, th.sym, t);
        g.restore();
        // loupe glint
        g.globalAlpha = 0.14; G.fe(g, bx + 30, by + 24, 26, 14, '#ffffff'); g.globalAlpha = 1;

        // the written sign
        G.text(g, 'PRESENTS AS:', 180, 88, '#5a5238');
        const words = sym.sign.split(' ');
        let line = '', ly = 102;
        for (const w of words) {
          if (G.tw(line + ' ' + w) > 118) { G.text(g, line, 180, ly, '#2a2418'); ly += 12; line = w; }
          else line = line ? line + ' ' + w : w;
        }
        if (line) G.text(g, line, 180, ly, '#2a2418');
        G.text(g, 'SUGAR LOAD: ' + this.p.sugar, 180, ly + 20, '#7a3020');
        if (G.hasUp('loupe')) {
          G.text(g, 'LOUPE HINT:', 180, ly + 40, '#2f6b3a');
          G.text(g, sym.dx, 180, ly + 52, '#2f6b3a');
        }
        G.text(g, 'NAME IT ON THE RIGHT.', 46, 226, '#7a3020');
        G.text(g, 'A WRONG CALL COSTS $4.', 46, 240, '#7a3020');
      } else {
        G.text(g, 'NO TOOTH UNDER THE LOUPE.', 40, 60, '#5a5238');
        G.text(g, 'SELECT THE PROBE AND CLICK A TOOTH', 40, 78, '#5a5238');
        G.text(g, 'TO OPEN ITS PAGE.', 40, 90, '#5a5238');
        // learned entries
        let ly = 120;
        G.text(g, 'LEARNED SO FAR: ' + G.state.dxSeen.length + '/' + G.DATA.symptoms.length, 40, ly, '#2a2418');
      }

      // ---- right page: the diagnosis list ----
      const list = G.DATA.symptoms;
      for (let i = 0; i < list.length; i++) {
        const ry = 74 + i * 26;
        const known = G.state.dxSeen.includes(list[i].id);
        const hov = G.inRect(G.mouse.x, G.mouse.y, 330, ry, 278, 24);
        G.rr(g, 330, ry, 278, 24, hov ? '#c2b894' : '#cfc6a6');
        G.R(g, 330, ry, 3, 24, known ? '#2f6b3a' : '#8a7a58');
        G.text(g, list[i].dx, 340, ry + 4, '#2a2418');
        if (known) {
          const bl = list[i].book.toUpperCase();
          G.text(g, bl.slice(0, 46), 340, ry + 14, '#6a6048');
        } else {
          G.text(g, 'NOT YET SEEN', 340, ry + 14, '#8a7a58');
        }
      }
      G.hideCursor = false;
    },
  };
})();

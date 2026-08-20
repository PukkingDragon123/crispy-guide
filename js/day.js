// ============================================================
// DOUBLE LIFE v3 - day.js  ·  THE PARLOUR
// 320x180, pulled right up to the counter. The customer's head
// fills the right of the frame with its mouth hanging open; the
// labelled pints and the cone fill the left. A damp brick room
// with rusted pipes, drips and flies.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  const WORLD = 400;
  const COUNTER = 128;
  const NPINT = 2, PW = 72, PH = 62, PY = 62, PX0 = 10, PGAP = 12;
  const COLS = 36;
  const PLX = 196, PLY = 152;                    // plate: cone base sits here
  const STAND = { cone: { x: 172, y: 104 }, cup: { x: 196, y: 104 } };
  const BIN = { x: 218, y: 108, w: 20, h: 26 };
  const RACK_S = { x: 252, y: 96 }, RACK_T = { x: 316, y: 96 };
  const CUST = { x: 252, y: 66 };                // screen space
  const SAUCE_NEED = 16, TOP_NEED = 7;

  function pintRect(i) { return { x: PX0 + i * (PW + PGAP), y: PY, w: PW, h: PH }; }

  const day = (G.scenes = G.scenes || {}).day = {
    enter() {
      if (!G.state.today) G.newDayStats();
      this.t = 0;
      G.cam.reset(0, WORLD - G.W, 0, 0);
      G.cam.goto(0, 0, true);
      this.pints = [];
      for (let i = 0; i < NPINT; i++)
        this.pints.push({ layers: G.makePint(i), surf: new Array(COLS).fill(0) });
      this.hold = null;
      this.build = null;
      this.drops = []; this.bits = []; this.parts = []; this.rest = [];
      this.serving = null;
      this.cust = null;
      this.panDrag = null;
      this.endT = 0;
      this.total = Math.min(3 + G.state.day, 7);
      this.left = this.total;
      this.spawnT = 0.6;
      this.binWob = 0;
      this.bag = [];
      while (this.bag.length < this.total) {
        const sh = G.DATA.animals.map((a) => a.id).sort(() => Math.random() - 0.5);
        for (const id of sh) if (this.bag.length < this.total) this.bag.push(id);
      }
      G.spawnFlies(4, 150, 40, 60);
      G.audio.music('day');
      if (!G.state.tut.scoop) G.toast('HOLD A FLAVOUR BAND', P.gold);
    },

    // ---------------- customer ----------------
    genOrder() {
      const d = G.state.day;
      const n = G.irand(1, Math.min(3, 1 + Math.ceil(d / 2)));
      const scoops = [];
      for (let i = 0; i < n; i++) scoops.push(G.pick(G.state.flavors));
      return {
        base: Math.random() < 0.7 ? 'cone' : 'cup',
        scoops,
        sauce: Math.random() < 0.3 + d * 0.05 ? G.pick(G.state.sauces) : null,
        top: Math.random() < 0.3 + d * 0.05 ? G.pick(G.state.tops) : null,
      };
    },
    spawn() {
      const sp = this.bag[this.total - this.left];
      const a = G.animalById(sp);
      this.left--;
      this.cust = {
        sp, name: G.pick(a.names), order: this.genOrder(),
        st: 'arrive', t: 0, wait: 0, mood: 'idle', open: 0, eat: null, slide: 1,
      };
      G.audio.sfx('doorbell');
    },

    // ---------------- build geometry ----------------
    scoopPos(i, ox, oy, base) {
      ox = ox === undefined ? PLX : ox; oy = oy === undefined ? PLY : oy;
      base = base || (this.build && this.build.base) || 'cone';
      let cy = (base === 'cup' ? oy - 16 : oy - 27) - 8;
      for (let k = 1; k <= i; k++) cy -= (10 - k) + 3;
      return { x: ox, y: cy, r: 10 - i };
    },

    // ---------------- input ----------------
    onDown(sx, sy) {
      if (this.endT > 0) return;
      const wx = sx + Math.round(G.cam.x), wy = sy;

      if (sy >= 158) {                                  // tray row
        if (G.inRect(sx, sy, 234, 161, 40, 16) && this.build && this.build.scoops.length && this.cust && this.cust.st === 'order') {
          G.audio.sfx('click'); this.serve(); return;
        }
        if (G.inRect(sx, sy, 278, 161, 38, 16)) { G.cam.nudge(G.cam.tx > 40 ? -80 : 80); G.audio.sfx('clack'); return; }
        return;
      }

      // bin
      if (G.inRect(wx, wy, BIN.x - 3, BIN.y - 4, BIN.w + 6, BIN.h + 6)) {
        if (this.build) { this.binWob = 1; G.audio.sfx('splat'); this.puff(BIN.x + 10, BIN.y, '#6b5a3a', 7); this.build = null; }
        return;
      }
      // bases
      for (const k of ['cone', 'cup']) {
        const s = STAND[k];
        if (G.inRect(wx, wy, s.x - 12, s.y - 12, 24, 34)) {
          if (!this.build) {
            this.build = { base: k, scoops: [], coat: [], bits: [], sauceAmt: {}, topAmt: {}, wob: 0, wobV: 0, pop: 0 };
            G.audio.sfx('clack');
          } else G.toast('BIN THAT ONE FIRST', P.warn);
          return;
        }
      }
      // pints: press the stratum you want
      for (let i = 0; i < NPINT; i++) {
        const r = pintRect(i);
        if (G.inRect(wx, wy, r.x - 4, r.y - 5, r.w + 8, r.h + 12)) {
          const pint = this.pints[i];
          const nl = pint.layers.length;
          const li = G.clamp(Math.floor(((wy - r.y) / r.h) * nl), 0, nl - 1);
          this.hold = { kind: 'scoop', pi: i, li, fid: pint.layers[li], fill: 0, tick: 0 };
          G.audio.sfx('grab');
          if (!G.state.tut.scoop) { G.state.tut.scoop = 1; G.toast('HOLD UNTIL IT IS FULL', P.neonG); }
          return;
        }
      }
      // sauces
      const sl = G.state.sauces;
      for (let i = 0; i < sl.length; i++) {
        const bx = RACK_S.x + 9 + i * 15;
        if (G.inRect(wx, wy, bx - 7, RACK_S.y + 4, 14, 26)) {
          this.hold = { kind: 'sauce', sid: sl[i], gx: sx, gy: sy, emit: 0 }; G.audio.sfx('grab'); return;
        }
      }
      // grit
      const tl = G.state.tops;
      for (let i = 0; i < tl.length; i++) {
        const bx = RACK_T.x + 9 + (i % 3) * 16, by = RACK_T.y + 6 + Math.floor(i / 3) * 24;
        if (G.inRect(wx, wy, bx - 7, by, 14, 22)) {
          this.hold = { kind: 'jar', tid: tl[i], gx: sx, gy: sy, emit: 0 }; G.audio.sfx('grab'); return;
        }
      }
      this.panDrag = { sx, camX: G.cam.tx };
    },

    onMove(sx) { if (this.panDrag) G.cam.goto(this.panDrag.camX - (sx - this.panDrag.sx), null); },

    onUp(sx, sy) {
      this.panDrag = null;
      const h = this.hold;
      if (!h) return;
      const wx = sx + Math.round(G.cam.x), wy = sy;
      if (h.kind === 'scoop') {
        G.audio.loop('carve', false);
        if (h.fill < 0.36) { this.hold = null; G.audio.sfx('splat'); this.puff(wx, wy, G.flavorById(h.fid).col, 6); return; }
        this.popBall(h);
        return;
      }
      if (h.kind === 'ball') {
        this.hold = null;
        if (G.inRect(wx, wy, BIN.x - 3, BIN.y - 4, BIN.w + 6, BIN.h + 6)) {
          this.binWob = 1; G.audio.sfx('splat'); this.puff(BIN.x + 10, BIN.y, G.flavorById(h.fid).col, 7); return;
        }
        const b = this.build;
        if (b && b.scoops.length < 3) {
          const np = this.scoopPos(b.scoops.length);
          if (G.dist(wx, wy, np.x, np.y) < 26) {
            b.scoops.push(h.fid); b.wobV = 4; b.pop = 1;
            G.audio.sfx('plop'); G.shake(1, 0.08);
            G.spark(np.x - Math.round(G.cam.x), np.y, ['#fff', G.flavorById(h.fid).col], 8);
            const f = G.flavorById(h.fid);
            G.floatText(f.name.split(' ')[0], np.x - Math.round(G.cam.x), np.y - 16, f.col);
            return;
          }
        }
        this.puff(wx, wy, G.flavorById(h.fid).col, 8);
        G.audio.sfx('splat');
        G.addStain(wx, PLY + 2, 4, G.flavorById(h.fid).col);
        return;
      }
      this.hold = null;
      G.audio.loop('pour', false);
      G.audio.sfx('back');
    },

    onWheel(d) { G.cam.nudge(d > 0 ? 40 : -40); },

    popBall(h) {
      G.audio.sfx('scoopOff');
      G.spark(G.mouse.x, G.mouse.y, ['#ffffff', G.flavorById(h.fid).col], 8, 40);
      this.hold = { kind: 'ball', fid: h.fid, pi: h.pi, born: this.t, bx: G.mouse.wx, by: G.mouse.y };
    },
    puff(x, y, col, n) {
      for (let i = 0; i < (n || 6); i++)
        this.parts.push({ x, y, vx: G.rand(-40, 40), vy: G.rand(-60, -14), col: i % 3 ? col : '#fff', t: 0, life: G.rand(0.25, 0.5), grav: 220 });
    },

    // ---------------- serve ----------------
    check() {
      const b = this.build, c = this.cust;
      if (!b || !c) return null;
      const o = c.order;
      const have = {}, need = {};
      for (const f of b.scoops) have[f] = (have[f] || 0) + 1;
      for (const f of o.scoops) need[f] = (need[f] || 0) + 1;
      let ok = b.scoops.length === o.scoops.length;
      for (const k in need) if ((have[k] || 0) !== need[k]) ok = false;
      for (const k in have) if (!need[k]) ok = false;
      return {
        base: b.base === o.base, scoops: ok,
        sauce: !o.sauce || (b.sauceAmt[o.sauce] || 0) >= SAUCE_NEED,
        top: !o.top || (b.topAmt[o.top] || 0) >= TOP_NEED,
      };
    },
    rollSymptoms(b, sugar) {
      let hard = 0;
      for (const k in b.topAmt) { const tp = G.topById(k); if (tp && tp.hard >= 2) hard++; }
      const pool = ['tartar', 'gingiva'];
      if (sugar >= 8) pool.push('caries', 'caries');
      if (sugar >= 14) pool.push('necrosis', 'abscess');
      if (sugar >= 20) pool.push('abscess', 'caries');
      for (let i = 0; i < hard; i++) pool.push('fracture', 'foreign');
      if (hard && sugar >= 12) pool.push('impacted');
      const n = G.clamp(1 + Math.floor(sugar / 8) + (hard ? 1 : 0), 1, 4);
      const out = [];
      for (let i = 0; i < n; i++) out.push(G.pick(pool));
      return out;
    },
    serve() {
      const c = this.cust, b = this.build;
      if (!c || !b || !b.scoops.length) return;
      const chk = this.check(), o = c.order;
      let pay = 5 + 4 * o.scoops.length + (o.sauce ? 4 : 0) + (o.top ? 3 : 0);
      let verdict;
      if (chk.base && chk.scoops && chk.sauce && chk.top) { verdict = 'perfect'; pay += c.wait < 14 ? 4 : 2; G.state.today.perfect++; }
      else if (chk.scoops) { verdict = 'ok'; pay = Math.ceil(pay * 0.66); }
      else { verdict = 'bad'; pay = Math.ceil(pay * 0.4); }

      let sugar = 0;
      for (const f of b.scoops) sugar += (G.flavorById(f) || {}).sugar || 2;
      for (const k in b.sauceAmt) sugar += Math.min(5, Math.round(b.sauceAmt[k] / SAUCE_NEED * 3));
      for (const k in b.topAmt) sugar += Math.min(4, Math.round(b.topAmt[k] / TOP_NEED * 2));
      sugar = Math.round(sugar);
      G.state.today.sugar += sugar;
      G.state.today.patients.push({ sp: c.sp, name: c.name, sugar, symptoms: this.rollSymptoms(b, sugar) });

      this.serving = { build: b, x: PLX - Math.round(G.cam.x), y: PLY, t: 0, pay, verdict };
      this.build = null;
      this.drops.length = 0; this.bits.length = 0;
      c.st = 'served';
      G.audio.sfx('swish');
    },

    // ---------------- update ----------------
    update(dt) {
      this.t += dt;
      const M = G.mouse;
      const wx = M.wx, wy = M.y;
      if (this.binWob > 0) this.binWob -= dt * 3;
      G.updateFlies(dt);
      G.updateDrips(dt, 178);
      if (Math.random() < dt * 0.7) G.dripFrom(G.irand(20, 300), 14);

      if (!this.cust && this.left > 0) {
        this.spawnT -= dt;
        if (this.spawnT <= 0) { this.spawn(); this.spawnT = 1.2; }
      }

      const c = this.cust;
      if (c) {
        c.t += dt;
        if (c.st === 'arrive') {
          c.slide = Math.max(0, c.slide - dt * 2.6);
          if (c.slide <= 0) { c.st = 'order'; }
        }
        if (c.st === 'order') {
          c.wait += dt;
          // mouth hangs open, waiting to be fed
          c.open = 0.66 + Math.sin(this.t * 1.6) * 0.14;
          if (c.wait > 28) c.mood = 'angry';
        }
        if (c.st === 'eat') {
          c.eat.t += dt;
          // chomp: the jaw slams shut and springs open
          const ph = (c.eat.t * 3.4) % 1;
          // wide open through most of the cycle, snapping shut on each bite
          c.open = 0.2 + 0.72 * Math.pow(Math.sin(ph * Math.PI), 0.55);
          c.eat.left = Math.max(0, 1 - c.eat.t / 1.7);
          if (Math.floor(c.eat.t * 3.4) !== c.eat.bites) {
            c.eat.bites = Math.floor(c.eat.t * 3.4);
            G.audio.sfx('chew');
            for (let i = 0; i < 4; i++)
              this.parts.push({ x: CUST.x + G.rand(-8, 8), y: 108, vx: G.rand(-24, 24), vy: G.rand(-40, -6),
                col: G.flavorById(c.eat.build.scoops[0]).col, t: 0, life: 0.4, grav: 200, screen: true });
          }
          if (c.eat.t > 1.9) {
            const v = c.eat.verdict;
            if (v === 'perfect') { G.audio.sfx('perfect'); c.mood = 'happy'; G.floatText('PERFECT +$' + c.eat.pay, CUST.x, 40, P.neonG); }
            else if (v === 'ok') { G.audio.sfx('good'); c.mood = 'happy'; G.floatText('+$' + c.eat.pay, CUST.x, 40, P.gold); }
            else { G.audio.sfx('bad'); c.mood = 'angry'; G.floatText('WRONG +$' + c.eat.pay, CUST.x, 40, P.warn); }
            G.flyCoin(CUST.x, 52, c.eat.pay);
            G.state.today.dayEarn += c.eat.pay;
            G.state.today.kidsServed++;
            G.state.totKids++;
            const p = G.state.today.patients[G.state.today.patients.length - 1];
            if (p) G.floatText(p.symptoms.length + ' TONIGHT', CUST.x, 30, '#b46bff');
            c.st = 'leave';
            c.open = 0;
          }
        }
        if (c.st === 'leave') {
          c.slide += dt * 2.2;
          if (c.slide > 1.2) { this.cust = null; }
        }
      }

      if (this.serving) {
        const s = this.serving;
        s.t += dt * 1.7;
        const e = G.easeInOut(Math.min(1, s.t));
        s.x = G.lerp(PLX - Math.round(G.cam.x), CUST.x, e);
        s.y = G.lerp(PLY, 118, e) - Math.sin(Math.min(1, s.t) * Math.PI) * 26;
        if (s.t >= 1) {
          this.cust.st = 'eat';
          this.cust.eat = { t: 0, build: s.build, pay: s.pay, verdict: s.verdict, bites: -1, left: 1 };
          this.serving = null;
        }
      }

      // ---- held ----
      const h = this.hold;
      if (h && h.kind === 'scoop' && M.down) {
        const pint = this.pints[h.pi], r = pintRect(h.pi);
        h.fill = Math.min(1, h.fill + dt * (G.hasUp('coldarm') ? 1.5 : 1.15));
        const col = Math.floor(((wx - r.x) / r.w) * COLS);
        const bandTop = h.li / pint.layers.length;
        for (let k = -6; k <= 6; k++) {
          const ci = col + k;
          if (ci < 0 || ci >= COLS) continue;
          const fall = Math.sqrt(Math.max(0, 1 - (k / 6.5) * (k / 6.5)));
          const target = bandTop + 0.07 + fall * 0.2;
          if (pint.surf[ci] < target) pint.surf[ci] = Math.min(target, pint.surf[ci] + dt * 1.1 * fall);
        }
        h.tick += dt;
        if (h.tick > 0.06) {
          h.tick = 0;
          G.audio.sfx('carveTick', { f: h.fill });
          const fc = G.flavorById(h.fid);
          this.parts.push({ x: wx + G.rand(-5, 5), y: wy + G.rand(-3, 3), vx: G.rand(-26, 26), vy: G.rand(-50, -12),
            col: Math.random() < 0.5 ? fc.col : G.shade(fc.col, 0.3), t: 0, life: 0.32, grav: 220 });
        }
        G.audio.loop('carve', true, 0.35 + h.fill * 0.65);
        if (h.fill >= 1) this.popBall(h);
      } else G.audio.loop('carve', false);

      if (h && h.kind === 'ball') {
        h.bx += (wx - h.bx) * Math.min(1, dt * 18);
        h.by += (wy - h.by) * Math.min(1, dt * 18);
      }
      let pouring = false;
      if (h && h.kind === 'sauce') {
        if (G.dist(M.x, M.y, h.gx, h.gy) > 6) {
          pouring = true;
          h.emit -= dt;
          if (h.emit <= 0 && this.drops.length < 70) {
            h.emit = 0.05;
            this.drops.push({ x: wx, y: wy + 4, vx: G.rand(-5, 5), vy: 26, col: G.sauceById(h.sid).col, sid: h.sid, mode: 'fall' });
          }
        }
        G.audio.loop('pour', pouring, 0.85);
      }
      if (h && h.kind === 'jar') {
        const shake = Math.abs(M.vx) > 120;
        h.emit -= dt;
        if (G.dist(M.x, M.y, h.gx, h.gy) > 5 && h.emit <= 0 && this.bits.length < 60) {
          h.emit = shake ? 0.05 : 0.12;
          for (let i = 0; i < (shake ? 2 : 1); i++) {
            const tp = G.topById(h.tid);
            this.bits.push({ x: wx + G.rand(-4, 4), y: wy + 4, vx: G.rand(-20, 20) + G.clamp(M.vx * 0.12, -30, 30),
              vy: 10, col: G.topBitCol(h.tid), tid: h.tid, shape: tp && tp.hard >= 2 ? 'big' : 'sml', t: 0, bounces: 0 });
          }
          G.audio.sfx('grit');
        }
      }

      // ---- sauce physics ----
      const b = this.build;
      for (let i = this.drops.length - 1; i >= 0; i--) {
        const d = this.drops[i];
        if (d.mode === 'fall') {
          d.vy += 340 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
          let hit = false;
          if (b) for (let si = b.scoops.length - 1; si >= 0 && !hit; si--) {
            const sp = this.scoopPos(si);
            if (G.dist(d.x, d.y, sp.x, sp.y) <= sp.r + 1) {
              hit = true;
              this.coat(d, 1.6);
              if (Math.random() < 0.75) { d.mode = 'slide'; d.si = si; d.ang = Math.atan2(d.y - sp.y, d.x - sp.x); }
              else this.drops.splice(i, 1);
            }
          }
          if (hit) continue;
          if (d.y > PLY + 2) { G.addStain(d.x, Math.min(d.y, PLY + 2), G.rand(1.5, 3), d.col); this.drops.splice(i, 1); }
        } else if (d.mode === 'slide') {
          if (!b || d.si >= b.scoops.length) { d.mode = 'fall'; continue; }
          const sp = this.scoopPos(d.si);
          const dir = G.angDiff(Math.PI / 2, d.ang) > 0 ? 1 : -1;
          d.ang += dir * (62 / sp.r) * dt;
          d.x = sp.x + Math.cos(d.ang) * (sp.r - 0.5);
          d.y = sp.y + Math.sin(d.ang) * (sp.r - 0.5);
          if (Math.random() < 0.9) this.coat(d, 1.3);
          const rem = Math.abs(G.angDiff(Math.PI / 2, d.ang));
          if (rem < 0.22 || (rem < 1.1 && Math.random() < 0.05)) { d.mode = 'fall'; d.vy = 20; }
        }
      }
      // ---- grit physics ----
      for (let i = this.bits.length - 1; i >= 0; i--) {
        const p = this.bits[i];
        p.vy += 320 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.t += dt;
        let stuck = false;
        if (b) for (let si = b.scoops.length - 1; si >= 0; si--) {
          const sp = this.scoopPos(si);
          if (G.dist(p.x, p.y, sp.x, sp.y) <= sp.r + 1 && p.vy > 0) {
            if (Math.random() < 0.88) {
              b.bits.push({ lx: p.x - PLX, ly: p.y - PLY, col: p.col, shape: p.shape });
              if (b.bits.length > 160) b.bits.shift();
              b.topAmt[p.tid] = (b.topAmt[p.tid] || 0) + 1;
              stuck = true;
            } else { p.vy *= -0.4; p.vx += G.rand(-16, 16); }
            break;
          }
        }
        if (stuck) { this.bits.splice(i, 1); continue; }
        if (p.y >= PLY + 1) {
          p.y = PLY + 1; p.vy *= -0.4; p.vx *= 0.7; p.bounces++;
          if (p.bounces >= 2 || Math.abs(p.vy) < 14) {
            this.rest.push({ x: p.x, y: PLY + G.rand(0, 3), col: p.col, shape: p.shape, t: 0 });
            if (this.rest.length > 34) this.rest.shift();
            this.bits.splice(i, 1);
          }
        }
        if (p.x < -10 || p.x > WORLD + 10) this.bits.splice(i, 1);
      }
      for (let i = this.rest.length - 1; i >= 0; i--) { this.rest[i].t += dt; if (this.rest[i].t > 5) this.rest.splice(i, 1); }

      if (b) {
        b.wobV += -b.wob * 70 * dt - b.wobV * 9 * dt; b.wob += b.wobV * dt;
        if (b.pop > 0) b.pop = Math.max(0, b.pop - dt * 3.4);
      }
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i];
        p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.grav || 0) * dt;
        if (p.t > p.life) this.parts.splice(i, 1);
      }

      if (this.left === 0 && !this.cust && !this.serving) {
        this.endT += dt;
        if (this.endT > 1.4) { G.audio.sfx('night'); G.save(); G.go('night', 'NIGHT ' + G.state.day); }
      }
    },

    coat(d, r) {
      const b = this.build; if (!b) return;
      b.coat.push({ lx: d.x - PLX, ly: d.y - PLY, r, col: d.col });
      if (b.coat.length > 700) b.coat.shift();
      b.sauceAmt[d.sid] = (b.sauceAmt[d.sid] || 0) + 1;
    },

    // ---------------- draw ----------------
    draw(g) {
      const t = this.t;
      const camX = Math.round(G.cam.x);
      G.toastCX = 112; G.toastY = 160; // down in the tray, clear of the art

      // ===== the room =====
      G.R(g, 0, 0, G.W, G.H, P.night);
      G.sewerWall(g, 0, 0, G.W, COUNTER - 8, t);
      G.pipe(g, 0, 4, G.W, false, t);
      G.pipe(g, 4, 14, 60, true, t);
      G.grate(g, 274, 96, 34, 14);
      G.drawDrips(g);
      // a flickering strip light over the counter
      const fl = (Math.sin(t * 11) > 0.9 || Math.sin(t * 3.3) > 0.98) ? 0.4 : 1;
      G.box(g, 96, 12, 128, 6, fl > 0.5 ? '#ffe9a8' : '#5a5230', { lit: '#ffffff', dk: '#c9a83a', r: 1, band: 1 });
      G.glow(g, 160, 30, 150, 70, '#ffdf9a', 1.2 * fl);
      // grimy sign, tucked under the strip light where nothing else lands
      G.text(g, 'COLD CUTS', 86, 22, fl > 0.5 ? P.neonP : '#5a2a44', { out: OUT });
      G.text(g, 'NO REFUNDS', 86, 32, '#6b7f96');

      G.cam.push(g);
      // ---- counter slab ----
      G.box(g, -4, COUNTER - 8, WORLD + 8, 16, '#3a4560', { lit: '#56628a', dk: '#232b3f', r: 2, band: 3 });
      G.R(g, 0, COUNTER + 6, WORLD, 40, P.night2);
      G.speckle(g, 0, COUNTER + 8, WORLD, 36, '#151d2e', 0.1, 4);

      // ---- pints ----
      for (let i = 0; i < NPINT; i++) {
        const r = pintRect(i), pt = this.pints[i];
        G.drawPint(g, r.x, r.y, r.w, r.h, pt.layers, pt.surf, { legend: true });
      }


      // ---- bases + bin ----

      G.cone3(g, STAND.cone.x, COUNTER - 6, [], { w: 16, h: 20 });
      G.box(g, STAND.cup.x - 8, STAND.cup.y + 2, 16, 16, '#3a5a6b', { r: 1, band: 2 });
      const bw = this.binWob > 0 ? Math.sin(t * 40) * 1 : 0;
      G.box(g, BIN.x + bw, BIN.y, BIN.w, BIN.h, '#2b3644', { r: 1, band: 2 });
      G.R(g, BIN.x - 2 + bw, BIN.y - 3, BIN.w + 4, 3, '#3f4d5e');

      // ---- syrup + grit ----
      G.text(g, 'SYRUP', RACK_S.x + 4, RACK_S.y - 8, P.steel2, { out: OUT });
      G.box(g, RACK_S.x, RACK_S.y + 26, 56, 5, '#4a3a26', { r: 1, band: 1, spec: false });
      const sl = G.state.sauces;
      for (let i = 0; i < sl.length; i++) {
        if (this.hold && this.hold.kind === 'sauce' && this.hold.sid === sl[i]) continue;
        const s = G.sauceById(sl[i]);
        G.box(g, RACK_S.x + 3 + i * 15, RACK_S.y + 8, 11, 18, s.col, { r: 1, band: 3 });
        G.R(g, RACK_S.x + 5 + i * 15, RACK_S.y + 5, 7, 4, '#8a95a8');
      }
      G.text(g, 'GRIT', RACK_T.x + 4, RACK_T.y - 8, P.steel2, { out: OUT });
      G.box(g, RACK_T.x, RACK_T.y + 26, 52, 5, '#4a3a26', { r: 1, band: 1, spec: false });
      const tl = G.state.tops;
      for (let i = 0; i < tl.length; i++) {
        if (this.hold && this.hold.kind === 'jar' && this.hold.tid === tl[i]) continue;
        const tp = G.topById(tl[i]);
        const bx = RACK_T.x + 3 + (i % 3) * 16, by = RACK_T.y + 6 + Math.floor(i / 3) * 24;
        G.box(g, bx, by, 12, 20, '#22303c', { r: 1, band: 2 });
        for (let k = 0; k < 5; k++) G.R(g, bx + 2 + (k % 3) * 3, by + 6 + Math.floor(k / 3) * 4, 2, 2, G.topBitCol(tp.id));
        G.R(g, bx, by - 2, 12, 3, '#8a95a8');
      }

      // ---- plate + build ----
      G.box(g, PLX - 14, PLY + 1, 28, 4, '#3f4d5e', { r: 1, band: 1, spec: false });
      G.drawGoreWorld(g);
      for (const r of this.rest) { g.globalAlpha = G.clamp(1 - r.t / 5, 0, 1); this.drawBit(g, r.x, r.y, r); g.globalAlpha = 1; }
      if (this.build) this.drawBuild(g, PLX, PLY, this.build);
      if (this.hold && this.hold.kind === 'ball' && this.build && this.build.scoops.length < 3) {
        const np = this.scoopPos(this.build.scoops.length);
        const near = G.dist(G.mouse.wx, G.mouse.y, np.x, np.y) < 26;
        g.globalAlpha = 0.4 + Math.abs(Math.sin(t * 5)) * (near ? 0.6 : 0.2);
        for (let i = 0; i < 10; i += 2) {
          const a = (i / 10) * Math.PI * 2;
          G.R(g, np.x + Math.cos(a) * np.r, np.y + Math.sin(a) * np.r * 0.8, 2, 2, near ? P.neonG : P.chrome);
        }
        g.globalAlpha = 1;
      }
      for (const d of this.drops) G.R(g, d.x, d.y, 2, 2, d.col);
      for (const p of this.bits) this.drawBit(g, p.x, p.y, p);
      for (const p of this.parts) {
        if (p.screen) continue;
        g.globalAlpha = 1 - p.t / p.life; G.R(g, p.x, p.y, 2, 2, p.col); g.globalAlpha = 1;
      }
      G.cam.pop(g);

      // ===== screen space: the customer, right in your face =====
      const c = this.cust;
      if (c) {
        const sl2 = G.easeOut(G.clamp(1 - c.slide, 0, 1));
        const cxp = CUST.x + Math.round((1 - sl2) * 90);
        const bust = G.drawBust(g, c.sp, cxp, CUST.y, 0.92, { t, open: c.open, mood: c.mood });
        // eating: the cone is held up into the corner of the mouth and
        // visibly eaten away, bite by bite, in a chunky mitt
        if (c.st === 'eat' && c.eat) {
          const sc = c.eat.left;
          if (sc > 0.04) {
            const scp = c.eat.build.scoops;
            const ex = cxp - Math.round(bust.hw * 0.42);
            const ey = bust.jawY + 40 - Math.round(Math.sin(c.eat.t * 3.4 * Math.PI * 2) * 2);
            // whole scoops stay whole; only the one being eaten shrinks
            const full = Math.floor(scp.length * sc);
            const frac = (scp.length * sc) - full;
            const r = G.cone3(g, ex, ey, scp.slice(0, full), { w: 15, h: 20, sr: 9 });
            if (frac > 0.1 && full < scp.length) {
              const rr = Math.max(3, Math.round(9 * frac));
              G.scoop3(g, ex, r.topY - rr + 2, rr, scp[full], {});
            }
            G.drawMitt(g, ex - 9, ey - 12, { grip: 1 });
          }
        }
        // order bubble
        if (c.st === 'order') this.bubble(g, c, cxp, bust.headTop);
      }
      for (const p of this.parts) {
        if (!p.screen) continue;
        g.globalAlpha = 1 - p.t / p.life; G.R(g, p.x, p.y, 2, 2, p.col); g.globalAlpha = 1;
      }
      if (this.serving) this.drawBuild(g, this.serving.x, this.serving.y, this.serving.build, true);
      G.drawFlies(g);

      // ---- held implement + mitt ----
      const M = G.mouse, h = this.hold;
      if (h && M.x >= 0) {
        const rx = G.clamp(M.x, 6, G.W - 6), ry = G.clamp(M.y, 20, 154);
        if (h.kind === 'scoop') {
          G.R(g, rx + 3, ry - 4, 4, 16, P.steel);
          G.box(g, rx - 6, ry - 2, 12, 9, P.steel, { lit: P.chrome, dk: '#3f4d5e', r: 2, band: 2 });
          if (h.fill > 0.05) G.scoop3(g, rx, ry - 2 - h.fill * 4, 3 + h.fill * 6, h.fid, {});
          G.drawMitt(g, rx + 4, ry + 10, { grip: 1 });
        } else if (h.kind === 'ball') {
          G.scoop3(g, h.bx - camX, h.by - 4, 9, h.fid, {});
          G.drawMitt(g, h.bx - camX + 8, h.by + 6, { grip: 1 });
        } else if (h.kind === 'sauce') {
          const s = G.sauceById(h.sid);
          G.box(g, rx - 5, ry - 18, 11, 18, s.col, { r: 1, band: 3 });
          G.R(g, rx - 1, ry, 2, 3, G.shade(s.col, -0.4));
          G.drawMitt(g, rx + 6, ry - 8, { grip: 1 });
        } else if (h.kind === 'jar') {
          G.box(g, rx - 6, ry - 18, 12, 18, '#22303c', { r: 1, band: 2 });
          G.R(g, rx - 5, ry, 10, 2, '#8a95a8');
          G.drawMitt(g, rx + 7, ry - 8, { grip: 1 });
        }
        G.hideCursor = true;
      }

      // ---- HUD ----
      G.box(g, 2, 2, 50, 12, '#161f33', { r: 1, band: 1, spec: false });
      G.R(g, 6, 6, 4, 5, P.gold);
      G.text(g, '$' + Math.round(G.state.moneyShown), 13, 4, P.gold);
      G.box(g, 56, 2, 54, 12, '#161f33', { r: 1, band: 1, spec: false });
      G.text(g, 'DAY ' + G.state.day + ' ' + G.state.today.kidsServed + '/' + this.total, 60, 4, P.cream);
      const pn = G.state.today.patients.reduce((a, p) => a + p.symptoms.length, 0);
      if (pn) {
        G.box(g, 114, 2, 46, 12, '#161f33', { r: 1, band: 1, spec: false });
        G.text(g, pn + ' TONIGHT', 118, 4, '#b46bff');
      }
      if (h && h.kind === 'scoop') {
        const f = G.flavorById(h.fid);
        G.R(g, 108, 148, Math.round(104 * h.fill), 4, h.fill >= 1 ? P.neonG : G.mix(P.amber, P.neonG, h.fill));
        G.text(g, f.name, 160, 140, f.col, { align: 'center', out: OUT });
      }

      // ---- tray ----
      G.R(g, 0, 156, G.W, 24, '#101828');
      G.R(g, 0, 156, G.W, 1, P.night3);
      const canServe = this.build && this.build.scoops.length && c && c.st === 'order';
      G.box(g, 234, 161, 40, 16, canServe ? '#3d9a4a' : '#28323f', { r: 1, band: 2 });
      G.text(g, 'SERVE', 254, 166, canServe ? '#e8ffe8' : '#5a6470', { align: 'center' });
      G.box(g, 278, 161, 38, 16, '#3d7ac8', { r: 1, band: 2 });
      G.text(g, G.cam.tx > 40 ? '< BAR' : 'BAR >', 297, 166, '#e8f0ff', { align: 'center' });
      if (this.t % 7 < 3.5 && !h && !G.toasts.length) {
        const hint = !this.build ? 'TAP A CONE TO START'
          : !this.build.scoops.length ? 'HOLD A FLAVOUR BAND'
          : 'SYRUP, GRIT, THEN SERVE';
        G.text(g, hint, 110, 166, '#4a5a6b');
      }

      if (this.endT > 0) {
        g.globalAlpha = Math.min(0.75, this.endT * 0.6);
        G.R(g, 0, 0, G.W, G.H, '#0d1220');
        g.globalAlpha = 1;
        G.text(g, 'SHUTTERS DOWN', 160, 76, P.gold, { align: 'center', out: OUT, sc: 2 });
        G.text(g, 'GO AND FIX WHAT YOU SOLD', 160, 96, P.steel2, { align: 'center', out: OUT });
      }
      G.grade(g, 1);
    },

    drawBit(g, x, y, p) {
      if (p.shape === 'big') { G.R(g, x - 1, y - 1, 3, 3, OUT); G.R(g, x - 1, y - 1, 2, 2, p.col); }
      else G.R(g, x, y, 2, 2, p.col);
    },

    drawBuild(g, ox, oy, b, screen) {
      const sq = (b.pop || 0) * 0.3;
      G.cone3(g, ox, oy, b.scoops, { w: b.base === 'cup' ? 20 : 18, h: b.base === 'cup' ? 16 : 26, sr: 10, squash: sq });
      for (const cc of b.coat) G.R(g, ox + cc.lx, oy + cc.ly, 2, 2, cc.col);
      for (const bit of b.bits) this.drawBit(g, ox + bit.lx, oy + bit.ly, bit);
    },

    bubble(g, c, cxp, headTop) {
      const o = c.order;
      const uniq = [];
      for (const f of o.scoops) { const u = uniq.find((x) => x.id === f); if (u) u.n++; else uniq.push({ id: f, n: 1 }); }
      const rows = uniq.length + (o.sauce ? 1 : 0) + (o.top ? 1 : 0) + 1;
      const bw = 74, bh = 16 + rows * 9;
      const bx = 3, by = 17;
      G.box(g, bx, by, bw, bh, '#e4dcc4', { lit: '#f4eeda', dk: '#b8ae94', r: 2, band: 2, spec: false });
      // name plate, inside the card so it never rides up into the HUD
      G.R(g, bx + 1, by + 1, bw - 2, 10, '#3a3524');
      G.text(g, c.name, bx + 4, by + 2, '#e4dcc4');
      const chk = this.check() || {};
      let ry = by + 13;
      const tick = (ok) => { if (ok) G.text(g, '✓', bx + bw - 8, ry, '#2a6b34'); };
      G.text(g, 'ORDER: ' + (o.base === 'cone' ? 'CONE' : 'CUP'), bx + 4, ry, '#3a3524'); tick(chk.base); ry += 9;
      for (const u of uniq) {
        const f = G.flavorById(u.id);
        G.R(g, bx + 4, ry, 6, 6, OUT); G.R(g, bx + 4, ry, 5, 5, f.col);
        G.text(g, '*' + u.n + ' ' + f.name.split(' ')[0], bx + 12, ry, '#3a3524');
        const have = this.build ? this.build.scoops.filter((s) => s === u.id).length : 0;
        if (this.build && have >= u.n) tick(true);
        ry += 9;
      }
      if (o.sauce) { G.R(g, bx + 4, ry + 1, 6, 4, G.sauceById(o.sauce).col); G.text(g, 'SYRUP', bx + 12, ry, '#3a3524'); tick(chk.sauce); ry += 9; }
      if (o.top) { for (let i = 0; i < 3; i++) G.R(g, bx + 4 + i * 3, ry + 1 + (i % 2) * 2, 2, 2, G.topBitCol(o.top)); G.text(g, 'GRIT', bx + 14, ry, '#3a3524'); tick(chk.top); }
      // patience
      const pw = G.clamp(1 - c.wait / 34, 0, 1);
      G.R(g, bx, by + bh + 1, bw, 3, '#0d1220');
      G.R(g, bx, by + bh + 1, Math.round(bw * pw), 3, pw > 0.5 ? '#3d9a4a' : pw > 0.22 ? P.amber : P.blood);
      G.R(g, bx + bw, by + 10, 3, 2, '#e4dcc4');
    },
  };
})();

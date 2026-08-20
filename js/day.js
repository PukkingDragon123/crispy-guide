// ============================================================
// DOUBLE LIFE v2 - day.js  ·  THE PARLOUR
// A pannable counter. Every pint is a steel tub of labelled
// flavour strata: press the band you want and hold while the
// scoop fills, then carry the dome over and set it on the cone.
// No meters, no timing - just weight, sound and a satisfying pop.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  const WORLD = 1040;
  const COUNTER = 150;                 // world y of the counter lip
  const NPINT = 5, PINT_W = 58, PINT_H = 74, PINT_Y = 178, PINT_X0 = 34, PINT_GAP = 12;
  const COLS = 56;                     // carve resolution per pint
  const PLX = 536, PLY = 326;          // assembly plate (base sits here)
  const BIN = { x: 430, y: 250, w: 40, h: 56 };
  const STAND = { cone: { x: 452, y: 200 }, cup: { x: 492, y: 200 } };
  const RACK_S = { x: 700, y: 232 }, RACK_T = { x: 838, y: 226 };
  const QX = [560, 640, 720, 800], QY = 146;
  const SAUCE_NEED = 26, TOP_NEED = 10;

  function pintRect(i) { return { x: PINT_X0 + i * (PINT_W + PINT_GAP), y: PINT_Y, w: PINT_W, h: PINT_H }; }

  const day = (G.scenes = G.scenes || {}).day = {
    enter() {
      if (!G.state.today) G.newDayStats();
      this.t = 0;
      G.cam.reset(0, WORLD - G.W, 0, 0);
      G.cam.goto(20, 0, true);
      // pints: layered, with a persistent carve surface for the whole shift
      this.pints = [];
      for (let i = 0; i < NPINT; i++) {
        this.pints.push({ layers: G.makePint(i), surf: new Array(COLS).fill(0), spent: 0 });
      }
      this.hold = null;      // {kind:'scoop'|'ball'|'sauce'|'jar', ...}
      this.build = null;
      this.drops = []; this.bits = []; this.balls = []; this.parts = []; this.rest = [];
      this.serving = null;
      this.custs = [];
      this.panDrag = null;
      this.endT = 0;
      this.total = Math.min(4 + G.state.day, 9);
      this.left = this.total;
      this.spawnT = 1.0;
      this.binWob = 0;
      this.bag = [];
      while (this.bag.length < this.total) {
        const sh = G.DATA.animals.map((a) => a.id).sort(() => Math.random() - 0.5);
        for (const id of sh) if (this.bag.length < this.total) this.bag.push(id);
      }
      G.audio.music('day');
      if (!G.state.tut.scoop) G.toast('PRESS A FLAVOUR BAND AND HOLD TO SCOOP', P.gold);
    },

    // ---------------- customers ----------------
    genOrder() {
      const d = G.state.day;
      const n = G.irand(1, Math.min(3, 1 + Math.ceil(d / 2)));
      const scoops = [];
      for (let i = 0; i < n; i++) scoops.push(G.pick(G.state.flavors));
      return {
        base: Math.random() < 0.68 ? 'cone' : 'cup',
        scoops,
        sauce: Math.random() < 0.34 + d * 0.05 ? G.pick(G.state.sauces) : null,
        top: Math.random() < 0.34 + d * 0.05 ? G.pick(G.state.tops) : null,
      };
    },
    spawn() {
      const sp = this.bag[this.total - this.left];
      const a = G.animalById(sp);
      this.left--;
      let slot = 0;
      for (const c of this.custs) if (c.slot < 90) slot = Math.max(slot, c.slot + 1);
      this.custs.push({ sp, name: G.pick(a.names), order: this.genOrder(), x: WORLD + 40, y: QY,
        slot, state: 'walk', t: 0, wait: 0, mood: 'idle', eat: null });
      G.audio.sfx('doorbell');
    },
    front() { return this.custs.find((c) => c.slot === 0 && (c.state === 'queue' || c.state === 'order')); },

    // ---------------- build geometry ----------------
    scoopPos(i, ox, oy, base) {
      ox = ox === undefined ? PLX : ox; oy = oy === undefined ? PLY : oy;
      base = base || (this.build && this.build.base) || 'cone';
      let cy = (base === 'cup' ? oy - 24 : oy - 34) - 12;
      for (let k = 1; k <= i; k++) cy -= (16 - k * 2) + 4;
      return { x: ox, y: cy, r: 15 - i * 2 };
    },
    coneHalfW(y, oy) {
      oy = oy === undefined ? PLY : oy;
      const h = 34;
      if (y < oy - h || y > oy) return -1;
      return Math.max(1, 14 * (oy - y) / h);
    },

    // ---------------- input ----------------
    onDown(sx, sy) {
      if (this.endT > 0) return;
      const wx = sx + Math.round(G.cam.x), wy = sy + Math.round(G.cam.y);

      // edge pan tabs (screen space)
      if (G.inRect(sx, sy, 0, 150, 16, 160)) { G.cam.nudge(-150); G.audio.sfx('clack'); return; }
      if (G.inRect(sx, sy, G.W - 16, 150, 16, 160)) { G.cam.nudge(150); G.audio.sfx('clack'); return; }
      // serve
      const c = this.front();
      if (c && this.build && this.build.scoops.length && G.inRect(wx, wy, PLX - 96, 300, 58, 20)) {
        G.audio.sfx('click'); this.serve(); return;
      }
      // bin
      if (G.inRect(wx, wy, BIN.x - 4, BIN.y - 8, BIN.w + 8, BIN.h + 10)) {
        if (this.build) { this.binWob = 1; G.audio.sfx('splat'); this.puff(BIN.x + 20, BIN.y, '#6b5a3a', 10); this.build = null; }
        return;
      }
      // base dispensers
      for (const k of ['cone', 'cup']) {
        const s = STAND[k];
        if (G.inRect(wx, wy, s.x - 18, s.y - 16, 36, 46)) {
          if (!this.build) {
            this.build = { base: k, scoops: [], coat: [], bits: [], sauceAmt: {}, topAmt: {}, wob: 0, wobV: 0, qual: [], pop: 0 };
            G.audio.sfx('clack'); G.spark(PLX, PLY - 20, P.chrome, 6);
          } else G.toast('BIN THE ONE IN YOUR CLAW FIRST', P.warn);
          return;
        }
      }
      // pints -> press the flavour stratum you want and hold
      for (let i = 0; i < NPINT; i++) {
        const r = pintRect(i);
        if (G.inRect(wx, wy, r.x - 6, r.y - 8, r.w + 12, r.h + 18)) {
          const pint = this.pints[i];
          const nl = pint.layers.length;
          const li = G.clamp(Math.floor(((wy - r.y) / r.h) * nl), 0, nl - 1);
          this.hold = { kind: 'scoop', pi: i, li, fid: pint.layers[li], fill: 0, tick: 0, dx: wx };
          G.audio.sfx('grab');
          const f = G.flavorById(pint.layers[li]);
          if (f) G.floatText(f.name, wx - Math.round(G.cam.x), r.y - 18, f.col);
          if (!G.state.tut.scoop) { G.state.tut.scoop = 1; G.toast('HOLD UNTIL THE SCOOP IS FULL', P.neonG); }
          return;
        }
      }
      // sauce bottles
      const sl = G.state.sauces;
      for (let i = 0; i < sl.length; i++) {
        const bx = RACK_S.x + 16 + i * 30, by = RACK_S.y + 46;
        if (G.inRect(wx, wy, bx - 11, by - 32, 22, 38)) {
          this.hold = { kind: 'sauce', sid: sl[i], gx: sx, gy: sy, emit: 0 }; G.audio.sfx('grab'); return;
        }
      }
      // topping jars
      const tl = G.state.tops;
      for (let i = 0; i < tl.length; i++) {
        const bx = RACK_T.x + 18 + (i % 3) * 34, by = RACK_T.y + 40 + Math.floor(i / 3) * 44;
        if (G.inRect(wx, wy, bx - 12, by - 30, 24, 36)) {
          this.hold = { kind: 'jar', tid: tl[i], gx: sx, gy: sy, emit: 0 }; G.audio.sfx('grab'); return;
        }
      }
      // otherwise: drag the room
      this.panDrag = { sx, camX: G.cam.tx };
    },

    onMove(sx, sy) {
      if (this.panDrag) G.cam.goto(this.panDrag.camX - (sx - this.panDrag.sx), null);
    },

    onUp(sx, sy) {
      this.panDrag = null;
      const h = this.hold;
      if (!h) return;
      const wx = sx + Math.round(G.cam.x), wy = sy + Math.round(G.cam.y);

      if (h.kind === 'scoop') {
        G.audio.loop('carve', false);
        if (h.fill < 0.38) {
          this.hold = null;
          G.audio.sfx('splat');
          this.puff(wx, wy, G.flavorById(h.fid).col, 8);
          return;
        }
        this.popBall(h);
        return;
      }
      if (h.kind === 'ball') {
        this.hold = null;
        if (G.inRect(wx, wy, BIN.x - 4, BIN.y - 8, BIN.w + 8, BIN.h + 10)) {
          this.binWob = 1; G.audio.sfx('splat'); this.puff(BIN.x + 20, BIN.y, G.flavorById(h.fid).col, 10); return;
        }
        const b = this.build;
        if (b) {
          const np = this.scoopPos(b.scoops.length);
          if (b.scoops.length < 3 && G.dist(wx, wy, np.x, np.y) < 40) {
            b.scoops.push(h.fid); b.qual.push(h.qual);
            b.wobV = 5; b.pop = 1;
            this.pints[h.pi].spent++;
            G.audio.sfx('plop');
            G.shake(1.2, 0.09);
            G.spark(np.x - Math.round(G.cam.x), np.y - Math.round(G.cam.y), ['#fff', G.flavorById(h.fid).col], 12);
            const f2 = G.flavorById(h.fid);
            G.floatText(f2.name, np.x - Math.round(G.cam.x), np.y - Math.round(G.cam.y) - 26, f2.col);
            return;
          }
          if (b.scoops.length >= 3) G.toast('THAT CONE IS FULL', P.gold);
        }
        this.balls.push({ x: wx, y: wy, vx: G.clamp(G.mouse.vx * 0.3, -80, 80), vy: -30, fid: h.fid });
        return;
      }
      // sauce / jar released
      this.hold = null;
      G.audio.loop('pour', false);
      G.audio.sfx('back');
    },

    onWheel(d) { G.cam.nudge(d > 0 ? 70 : -70); },

    // the scoop comes free of the tub as a finished dome
    popBall(h) {
      G.audio.sfx('scoopOff');
      G.spark(G.mouse.x, G.mouse.y, ['#ffffff', G.flavorById(h.fid).col], 10, 60);
      this.hold = { kind: 'ball', fid: h.fid, qual: 1, pi: h.pi, born: this.t,
                    bx: G.mouse.wx, by: G.mouse.wy };
    },

    puff(x, y, col, n) {
      for (let i = 0; i < (n || 8); i++)
        this.parts.push({ x, y, vx: G.rand(-60, 60), vy: G.rand(-90, -20), col: i % 3 ? col : '#fff',
                          t: 0, life: G.rand(0.3, 0.7), grav: 300 });
    },

    // ---------------- serve ----------------
    check() {
      const b = this.build, c = this.front();
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

    // sugar -> the symptoms you will be treating tonight
    rollSymptoms(b, sugar) {
      let hard = 0;
      for (const k in b.topAmt) { const tp = G.topById(k); if (tp && tp.hard >= 2) hard += 1; }
      const pool = [];
      if (sugar >= 10) pool.push('caries', 'caries');
      if (sugar >= 16) pool.push('necrosis', 'abscess');
      if (sugar >= 22) pool.push('abscess', 'caries');
      if (sugar < 12) pool.push('tartar', 'gingiva');
      pool.push('tartar', 'gingiva');
      for (let i = 0; i < hard; i++) pool.push('fracture', 'foreign');
      if (hard && sugar >= 14) pool.push('impacted');
      const n = G.clamp(1 + Math.floor(sugar / 7) + (hard ? 1 : 0), 1, 5);
      const out = [];
      for (let i = 0; i < n && pool.length; i++) out.push(G.pick(pool));
      return out.length ? out : ['tartar'];
    },

    serve() {
      const c = this.front(), b = this.build;
      if (!c || !b || !b.scoops.length) return;
      const chk = this.check(), o = c.order;
      const avgQ = b.qual.length ? b.qual.reduce((a, x) => a + x, 0) / b.qual.length : 1;
      let pay = 5 + 4 * o.scoops.length + (o.sauce ? 4 : 0) + (o.top ? 3 : 0);
      let verdict;
      if (chk.base && chk.scoops && chk.sauce && chk.top) {
        verdict = 'perfect'; pay += c.wait < 16 ? 5 : c.wait < 30 ? 3 : 1; G.state.today.perfect++;
      } else if (chk.scoops) { verdict = 'ok'; pay = Math.ceil(pay * 0.66); }
      else { verdict = 'bad'; pay = Math.ceil(pay * 0.4); }
      pay = Math.max(1, Math.round(pay * avgQ));

      // sugar load
      let sugar = 0;
      for (const f of b.scoops) sugar += (G.flavorById(f) || {}).sugar || 2;
      for (const k in b.sauceAmt) sugar += Math.min(6, Math.round(b.sauceAmt[k] / SAUCE_NEED * 3)) * ((G.sauceById(k) || {}).sugar || 2) * 0.5;
      for (const k in b.topAmt) sugar += Math.min(5, Math.round(b.topAmt[k] / TOP_NEED * 2)) * ((G.topById(k) || {}).sugar || 2) * 0.5;
      sugar = Math.round(sugar);
      G.state.today.sugar += sugar;

      G.state.today.patients.push({ sp: c.sp, name: c.name, sugar, symptoms: this.rollSymptoms(b, sugar) });

      this.serving = { build: b, x: PLX, y: PLY, t: 0, cust: c, pay, verdict };
      this.build = null;
      this.drops.length = 0; this.bits.length = 0;
      c.state = 'served';
      G.audio.sfx('swish');
    },

    // ---------------- update ----------------
    update(dt) {
      this.t += dt;
      const M = G.mouse;
      const wx = M.wx, wy = M.wy;
      if (this.binWob > 0) this.binWob -= dt * 3;

      // spawn
      const q = this.custs.filter((c) => c.state === 'walk' || c.state === 'queue' || c.state === 'order').length;
      if (this.left > 0 && q < 4) {
        this.spawnT -= dt;
        if (this.spawnT <= 0) { this.spawn(); this.spawnT = G.rand(2.6, 5.2); }
      }

      // customers
      for (const c of this.custs) {
        c.t += dt;
        if (c.state === 'walk' || c.state === 'queue') {
          const tx = QX[Math.min(c.slot, 3)];
          if (c.x > tx + 1) { c.x -= 52 * dt; c.walk = true; }
          else { c.x = tx; c.walk = false; c.state = c.slot === 0 ? 'order' : 'queue'; }
        }
        if (c.state === 'order') {
          c.wait += dt;
          if (c.wait > 34) c.mood = 'angry';
        }
        if (c.state === 'eating') {
          c.eat.t += dt;
          if (c.eat.t > 1.3) {
            const v = c.eat.verdict;
            if (v === 'perfect') { G.audio.sfx('perfect'); c.mood = 'happy'; G.floatText('PERFECT  +$' + c.eat.pay, c.x - Math.round(G.cam.x), 96, P.neonG); }
            else if (v === 'ok') { G.audio.sfx('good'); c.mood = 'idle'; G.floatText('+$' + c.eat.pay, c.x - Math.round(G.cam.x), 96, P.gold); }
            else { G.audio.sfx('bad'); c.mood = 'angry'; G.floatText('WRONG  +$' + c.eat.pay, c.x - Math.round(G.cam.x), 96, P.warn); }
            G.flyCoin(c.x - Math.round(G.cam.x), 110, c.eat.pay);
            G.state.today.dayEarn += c.eat.pay;
            G.state.today.kidsServed++;
            G.state.totKids++;
            const p = G.state.today.patients[G.state.today.patients.length - 1];
            if (p) G.floatText(p.symptoms.length + ' PROBLEM' + (p.symptoms.length > 1 ? 'S' : '') + ' TONIGHT', c.x - Math.round(G.cam.x), 82, '#b46bff');
            c.state = 'leave'; c.eat = null;
            for (const o of this.custs) if (o.slot > c.slot && o.slot < 90) o.slot--;
            c.slot = 99;
          }
        }
        if (c.state === 'leave') { c.x += 60 * dt; c.walk = true; }
      }
      this.custs = this.custs.filter((c) => c.x < WORLD + 70);

      // serving flight
      if (this.serving) {
        const s = this.serving;
        s.t += dt * 1.9;
        const e = G.easeInOut(Math.min(1, s.t));
        s.x = G.lerp(PLX, s.cust.x, e);
        s.y = G.lerp(PLY, s.cust.y - 10, e) - Math.sin(Math.min(1, s.t) * Math.PI) * 46;
        if (s.t >= 1) {
          s.cust.state = 'eating';
          s.cust.eat = { t: 0, build: s.build, pay: s.pay, verdict: s.verdict };
          this.serving = null;
          G.audio.sfx('chew');
        }
      }

      // ---- held ----
      const h = this.hold;
      let pouring = false;
      if (h && h.kind === 'scoop' && M.down) {
        const pint = this.pints[h.pi];
        const r = pintRect(h.pi);
        const rate = G.hasUp('coldarm') ? 1.5 : 1.15;      // fills in well under a second
        h.fill = Math.min(1, h.fill + dt * rate);
        // a divot opens under the cursor: the tub visibly gets used up
        const col = Math.floor(((wx - r.x) / r.w) * COLS);
        const bandTop = (h.li / pint.layers.length);
        for (let k = -5; k <= 5; k++) {
          const ci = col + k;
          if (ci < 0 || ci >= COLS) continue;
          const fall = 1 - Math.abs(k) / 6;
          const target = bandTop + 0.1 + fall * 0.12;
          if (pint.surf[ci] < target) pint.surf[ci] = Math.min(target, pint.surf[ci] + dt * 0.55 * fall);
        }
        h.tick += dt;
        if (h.tick > 0.06) {
          h.tick = 0;
          G.audio.sfx('carveTick', { f: h.fill });
          const fc2 = G.flavorById(h.fid);
          this.parts.push({ x: wx + G.rand(-7, 7), y: wy + G.rand(-4, 4),
            vx: G.rand(-40, 40), vy: G.rand(-80, -20),
            col: Math.random() < 0.5 ? fc2.col : G.shade(fc2.col, 0.3), t: 0, life: 0.4, grav: 320 });
        }
        G.audio.loop('carve', true, 0.35 + h.fill * 0.65);
        if (h.fill >= 1) this.popBall(h);
      } else G.audio.loop('carve', false);

      if (h && h.kind === 'ball') {
        h.bx += (wx - h.bx) * Math.min(1, dt * 18);
        h.by += (wy - h.by) * Math.min(1, dt * 18);
      }
      if (h && h.kind === 'sauce') {
        if (G.dist(M.x, M.y, h.gx, h.gy) > 10) {
          pouring = true;
          h.emit -= dt;
          if (h.emit <= 0 && this.drops.length < 150) {
            h.emit = 0.045;
            this.drops.push({ x: wx + G.rand(-2, 2), y: wy + 6, vx: G.rand(-8, 8), vy: 40,
              col: G.sauceById(h.sid).col, sid: h.sid, mode: 'fall' });
          }
        }
        G.audio.loop('pour', pouring, 0.85);
      }
      if (h && h.kind === 'jar') {
        const shake = Math.abs(M.vx) > 190;
        h.emit -= dt;
        if (G.dist(M.x, M.y, h.gx, h.gy) > 8 && h.emit <= 0 && this.bits.length < 110) {
          h.emit = shake ? 0.055 : 0.14;
          for (let i = 0; i < (shake ? 3 : 1); i++) {
            const tp = G.topById(h.tid);
            this.bits.push({ x: wx + G.rand(-6, 6), y: wy + 6, vx: G.rand(-30, 30) + G.clamp(M.vx * 0.14, -50, 50),
              vy: 14, col: G.topBitCol(h.tid), tid: h.tid,
              shape: tp && tp.multi ? 'spr' : (tp && tp.hard >= 2 ? 'big' : 'sml'), t: 0, bounces: 0 });
          }
          G.audio.sfx('grit');
        }
      }

      // ---- sauce droplet physics ----
      const b = this.build;
      for (let i = this.drops.length - 1; i >= 0; i--) {
        const d = this.drops[i];
        if (d.mode === 'fall') {
          d.vy += 560 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
          let hit = false;
          if (b) {
            for (let si = b.scoops.length - 1; si >= 0 && !hit; si--) {
              const sp = this.scoopPos(si);
              if (G.dist(d.x, d.y, sp.x, sp.y) <= sp.r + 1) {
                hit = true;
                this.coat(d, 2.4);
                if (Math.random() < 0.78) { d.mode = 'slide'; d.si = si; d.ang = Math.atan2(d.y - sp.y, d.x - sp.x); }
                else this.drops.splice(i, 1);
              }
            }
            if (!hit && b.base === 'cone') {
              const hw = this.coneHalfW(d.y);
              if (hw > 0 && Math.abs(d.x - PLX) <= hw) { this.coat(d, 1.8); d.mode = 'cone'; d.vy = 0; continue; }
            }
          }
          if (hit) continue;
          if (d.y > PLY + 4) { G.addStain(d.x, Math.min(d.y, PLY + 4), G.rand(2, 4), d.col); this.drops.splice(i, 1); }
        } else if (d.mode === 'slide') {
          if (!b || d.si >= b.scoops.length) { d.mode = 'fall'; continue; }
          const sp = this.scoopPos(d.si);
          const dir = G.angDiff(Math.PI / 2, d.ang) > 0 ? 1 : -1;
          d.ang += dir * (92 / sp.r) * dt;
          d.x = sp.x + Math.cos(d.ang) * (sp.r - 0.5);
          d.y = sp.y + Math.sin(d.ang) * (sp.r - 0.5);
          if (Math.random() < 0.9) this.coat(d, G.rand(1.6, 2.6));
          const rem = Math.abs(G.angDiff(Math.PI / 2, d.ang));
          if (rem < 0.2 || (rem < 1.1 && Math.random() < 0.05)) { d.mode = 'fall'; d.vy = 30; d.vx = Math.cos(d.ang) * 10; }
        } else if (d.mode === 'cone') {
          d.y += 52 * dt;
          const hw = this.coneHalfW(d.y);
          if (hw <= 0 || Math.abs(d.x - PLX) > hw) { d.mode = 'fall'; d.vy = 34; continue; }
          if (Math.random() < 0.85) this.coat(d, 1.5);
          if (d.y >= PLY - 2) { d.mode = 'fall'; d.vy = 24; }
        }
      }

      // ---- topping physics ----
      for (let i = this.bits.length - 1; i >= 0; i--) {
        const p = this.bits[i];
        p.vy += 520 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.t += dt;
        let stuck = false;
        if (b) {
          for (let si = b.scoops.length - 1; si >= 0; si--) {
            const sp = this.scoopPos(si);
            if (G.dist(p.x, p.y, sp.x, sp.y) <= sp.r + 1 && p.vy > 0) {
              if (Math.random() < 0.88) {
                b.bits.push({ lx: p.x - PLX, ly: p.y - PLY, col: p.col, shape: p.shape });
                if (b.bits.length > 300) b.bits.shift();
                b.topAmt[p.tid] = (b.topAmt[p.tid] || 0) + 1;
                stuck = true;
              } else { p.vy *= -0.42; p.vx += G.rand(-30, 30); }
              break;
            }
          }
        }
        if (stuck) { this.bits.splice(i, 1); continue; }
        if (p.y >= PLY + 2) {
          p.y = PLY + 2; p.vy *= -0.42; p.vx *= 0.7; p.bounces++;
          if (p.bounces >= 2 || Math.abs(p.vy) < 22) {
            this.rest.push({ x: p.x, y: PLY + G.rand(1, 5), col: p.col, shape: p.shape, t: 0 });
            if (this.rest.length > 70) this.rest.shift();
            this.bits.splice(i, 1);
          }
        }
        if (p.x < -20 || p.x > WORLD + 20) this.bits.splice(i, 1);
      }
      for (let i = this.rest.length - 1; i >= 0; i--) { this.rest[i].t += dt; if (this.rest[i].t > 6) this.rest.splice(i, 1); }

      // dropped balls
      for (let i = this.balls.length - 1; i >= 0; i--) {
        const p = this.balls[i];
        p.vy += 520 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.y >= PLY + 4) {
          G.addStain(p.x, PLY + 5, 7, G.flavorById(p.fid).col);
          this.puff(p.x, PLY, G.flavorById(p.fid).col, 12);
          G.audio.sfx('splat'); G.shake(2, 0.14);
          this.balls.splice(i, 1);
        }
      }

      if (b) {
        b.wobV += -b.wob * 70 * dt - b.wobV * 9 * dt; b.wob += b.wobV * dt;
        if (b.pop > 0) b.pop = Math.max(0, b.pop - dt * 3.4);
      }

      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i];
        p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.grav || 0) * dt;
        if (p.t > p.life) this.parts.splice(i, 1);
      }

      // end of shift
      if (this.left === 0 && this.custs.length === 0 && !this.serving) {
        this.endT += dt;
        if (this.endT > 1.6) { G.audio.sfx('night'); G.save(); G.go('night', 'NIGHT ' + G.state.day); }
      }
    },

    coat(d, r) {
      const b = this.build; if (!b) return;
      b.coat.push({ lx: d.x - PLX, ly: d.y - PLY, r, col: d.col });
      if (b.coat.length > 1400) b.coat.shift();
      b.sauceAmt[d.sid] = (b.sauceAmt[d.sid] || 0) + 1;
    },

    // ---------------- draw ----------------
    draw(g) {
      const t = this.t;
      const camX = Math.round(G.cam.x);

      // ===== world =====
      G.cam.push(g);

      // back wall: dirty tile
      G.gradV(g, 0, 0, WORLD, COUNTER, '#16211f', '#0c1412', 5);
      for (let x = 0; x < WORLD; x += 26) {
        G.R(g, x, 0, 1, COUNTER, '#0a1210');
        for (let y = 13; y < COUNTER; y += 22) G.R(g, x, y, 26, 1, '#0a1210');
      }
      // grime creeping up the wall
      G.dither(g, 0, COUNTER - 34, WORLD, 34, null, '#070d0c', 0.5);
      // extractor duct along the top, with drips
      G.R(g, 0, 0, WORLD, 14, '#141d1b');
      G.R(g, 0, 13, WORLD, 2, '#0a1210');
      for (let x = 12; x < WORLD; x += 46) {
        G.R(g, x, 0, 3, 14, '#1d2926');
        G.R(g, x + 20, 14, 2, 5, '#0a1210');
      }
      // a shelf of grimy tins over the back bar
      G.R(g, 640, 92, 300, 4, '#2a231a');
      G.R(g, 640, 92, 300, 1, '#4a3a26');
      for (let i = 0; i < 9; i++) {
        const tx = 650 + i * 33, th2 = 16 + (i % 3) * 5;
        G.rr(g, tx, 92 - th2, 18, th2, '#0a1210');
        G.rr(g, tx + 1, 93 - th2, 16, th2 - 1, i % 2 ? '#3c4a3a' : '#4a3a2a');
        G.R(g, tx + 2, 94 - th2, 3, th2 - 3, '#5f7358');
        G.R(g, tx + 1, 92 - Math.floor(th2 / 2), 16, 3, i % 3 ? '#8a6a20' : '#6b2b2b');
      }
      // a chalk price list on the left wall
      G.rr2(g, 22, 24, 128, 96, '#0a1210');
      G.rr2(g, 24, 26, 124, 92, '#16211f');
      G.text(g, 'PRICES', 86, 32, '#c9d24a', { align: 'center' });
      G.R(g, 36, 42, 100, 1, '#2c3f3a');
      G.text(g, 'SCOOP      4', 34, 50, '#7f9a92');
      G.text(g, 'SYRUP      4', 34, 62, '#7f9a92');
      G.text(g, 'GRIT       3', 34, 74, '#7f9a92');
      G.text(g, 'NO REFUNDS', 34, 92, '#8a5a3a');
      G.text(g, 'NO QUESTIONS', 34, 104, '#8a5a3a');

      // neon signs
      G.drawNeon(g, 200, 22, 'COLD CUTS', P.neonP, t, 3);
      G.drawNeon(g, 200, 52, 'SCOOPS  ·  ALL NIGHT', P.neonC, t * 0.8 + 2, 1);
      G.drawNeon(g, 760, 30, 'SYRUP', P.neonG, t * 1.1 + 4, 2);
      // sodium lamp over the syrup bar / cold spill out of the well
      G.glow(g, 800, 118, 130, 92, P.amber, 1.1);
      G.glow(g, 190, 172, 210, 74, P.neonC, 0.9);

      // counter lip
      G.R(g, 0, COUNTER - 6, WORLD, 6, '#22312c');
      G.R(g, 0, COUNTER - 6, WORLD, 1, '#3b544b');
      G.R(g, 0, COUNTER, WORLD, 4, '#0a1210');

      // customers behind the counter
      const ord = [...this.custs].sort((a, b2) => (b2.slot === 99 ? -1 : b2.slot) - (a.slot === 99 ? -1 : a.slot));
      for (const c of ord) {
        G.drawCust(g, c.sp, c.x, c.y, c.t, { walk: c.walk, mood: c.mood });
        if (c.state === 'eating' && c.eat) {
          const sc = 1 - c.eat.t / 1.4;
          if (sc > 0.2) this.drawBuild(g, c.x - 14, c.y - 18, c.eat.build, sc);
        }
      }

      // bench
      G.gradV(g, 0, COUNTER + 4, WORLD, 210, '#1a2624', '#0d1615', 6);
      G.R(g, 0, COUNTER + 4, WORLD, 2, '#2c3f3a');
      G.speckleBench = G.speckleBench || null;

      // ---- chilled well ----
      G.rr2(g, PINT_X0 - 18, PINT_Y - 22, NPINT * (PINT_W + PINT_GAP) + 24, PINT_H + 60, '#0a1210');
      G.rr2(g, PINT_X0 - 16, PINT_Y - 20, NPINT * (PINT_W + PINT_GAP) + 20, PINT_H + 56, '#25333a');
      G.gradV(g, PINT_X0 - 14, PINT_Y - 18, NPINT * (PINT_W + PINT_GAP) + 16, 16, '#4a6b75', '#25333a', 4);
      G.text(g, 'CHILLED WELL', PINT_X0 + 118, PINT_Y - 32, P.steel2, { align: 'center', out: OUT });
      for (let i = 0; i < NPINT; i++) {
        const r = pintRect(i), pt = this.pints[i];
        const f = G.flavorById(pt.layers[0]);
        G.drawPint(g, r.x, r.y, r.w, r.h, pt.layers, pt.surf, {
          label: f ? f.name.split(' ')[0] : '', labelCol: f ? f.col : P.cream,
        });
        // frost breath
        if ((i + Math.floor(t)) % 3 === 0) {
          g.globalAlpha = 0.1;
          G.fe(g, r.x + r.w / 2, r.y - 12 - (t * 8 % 10), 12, 4, '#cfe8ff');
          g.globalAlpha = 1;
        }
      }

      // ---- assembly bench ----
      G.text(g, 'ASSEMBLY', 500, 176, P.steel2, { align: 'center', out: OUT });
      G.rr2(g, 430, 190, 130, 44, '#101b19');
      G.drawBase(g, 'cone', STAND.cone.x, STAND.cone.y + 28);
      G.drawBase(g, 'cup', STAND.cup.x, STAND.cup.y + 30);
      // bin
      const bw = this.binWob > 0 ? Math.sin(t * 44) * 2 : 0;
      G.rr2(g, BIN.x + bw, BIN.y, BIN.w, BIN.h, '#0a1210');
      G.rr2(g, BIN.x + 1 + bw, BIN.y + 1, BIN.w - 2, BIN.h - 2, '#2b3a3a');
      for (let i = 0; i < 4; i++) G.R(g, BIN.x + 5 + i * 9 + bw, BIN.y + 5, 3, BIN.h - 12, '#1c2828');
      G.R(g, BIN.x - 3 + bw, BIN.y - 5, BIN.w + 6, 6, '#3b4d4d');
      G.text(g, 'BIN', BIN.x + BIN.w / 2, BIN.y + BIN.h + 4, '#4d6060', { align: 'center' });

      // plate + build
      G.fe(g, PLX, PLY + 5, 30, 6, '#0a1210');
      G.fe(g, PLX, PLY + 4, 28, 5, '#3b4d4d');
      G.drawGoreWorld(g);
      for (const r of this.rest) { g.globalAlpha = G.clamp(1 - r.t / 6, 0, 1); this.drawBit(g, r.x, r.y, r); g.globalAlpha = 1; }
      if (this.build) this.drawBuild(g, PLX, PLY, this.build, 1);
      // ghost target for the next scoop: a dashed seat, not a ring
      if (this.hold && this.hold.kind === 'ball' && this.build && this.build.scoops.length < 3) {
        const np = this.scoopPos(this.build.scoops.length);
        const near = G.dist(G.mouse.wx, G.mouse.wy, np.x, np.y) < 40;
        const pulse = 0.4 + Math.abs(Math.sin(t * 5)) * (near ? 0.6 : 0.25);
        g.globalAlpha = pulse;
        for (let i = 0; i < 14; i++) {
          if (i % 2) continue;
          const a2 = (i / 14) * Math.PI * 2;
          G.R(g, np.x + Math.cos(a2) * np.r, np.y + Math.sin(a2) * np.r * 0.8, 2, 2, near ? P.neonG : P.chrome);
        }
        g.globalAlpha = 1;
        if (near) G.text(g, 'SET IT DOWN', np.x, np.y - np.r - 16, P.neonG, { align: 'center', out: OUT });
      }
      // what is already on the cone, named
      if (this.build && this.build.scoops.length) {
        let ly = PLY - 118;
        for (let i = this.build.scoops.length - 1; i >= 0; i--) {
          const f4 = G.flavorById(this.build.scoops[i]);
          if (!f4) continue;
          const nm = f4.name.split(' ')[0];
          const w4 = G.tw(nm) + 13;
          G.frame(g, PLX + 26, ly, w4, 12, '#111b19');
          G.R(g, PLX + 29, ly + 3, 5, 5, OUT);
          G.R(g, PLX + 29, ly + 3, 4, 4, f4.col);
          G.text(g, nm, PLX + 36, ly + 3, f4.col);
          ly += 14;
        }
      }
      // serve button (world space, by the plate)
      const fc = this.front();
      if (fc && this.build && this.build.scoops.length) {
        const hov = G.inRect(G.mouse.wx, G.mouse.wy, PLX - 96, 300, 58, 20);
        G.rr2(g, PLX - 96, 302, 58, 20, OUT);
        G.rr2(g, PLX - 95, 301, 56, 18, hov ? '#3d8a49' : '#2f6b3a');
        G.text(g, 'SERVE', PLX - 67, 306, P.cream, { align: 'center' });
      }

      // ---- syrup & grit bar ----
      G.text(g, 'SYRUP', RACK_S.x + 46, RACK_S.y - 12, P.steel2, { align: 'center', out: OUT });
      G.rr2(g, RACK_S.x, RACK_S.y, 100, 56, '#101b19');
      G.R(g, RACK_S.x + 2, RACK_S.y + 48, 96, 3, '#2b3a3a');
      const sl = G.state.sauces;
      for (let i = 0; i < sl.length; i++) {
        if (this.hold && this.hold.kind === 'sauce' && this.hold.sid === sl[i]) continue;
        G.drawBottle(g, RACK_S.x + 16 + i * 30, RACK_S.y + 48, G.sauceById(sl[i]), false);
      }
      G.text(g, 'GRIT', RACK_T.x + 50, RACK_T.y - 12, P.steel2, { align: 'center', out: OUT });
      G.rr2(g, RACK_T.x, RACK_T.y, 112, 92, '#101b19');
      const tl = G.state.tops;
      for (let i = 0; i < tl.length; i++) {
        if (this.hold && this.hold.kind === 'jar' && this.hold.tid === tl[i]) continue;
        G.drawJar(g, RACK_T.x + 18 + (i % 3) * 34, RACK_T.y + 40 + Math.floor(i / 3) * 44, G.topById(tl[i]), false);
      }

      // loose physics objects
      for (const d of this.drops) { G.R(g, d.x - 1, d.y - 1, 2, 3, d.col); G.R(g, d.x - 1, d.y - 1, 1, 1, G.shade(d.col, 0.4)); }
      for (const p of this.bits) this.drawBit(g, p.x, p.y, p, Math.floor(p.t * 11) % 2);
      for (const p of this.balls) G.drawScoopBall(g, p.x, p.y, 13, p.fid, 0);
      for (const p of this.parts) {
        g.globalAlpha = 1 - p.t / p.life;
        G.R(g, p.x, p.y, 2, 2, p.col);
        g.globalAlpha = 1;
      }

      // order bubble for the front customer
      if (fc && fc.state === 'order') this.bubble(g, fc);

      if (this.serving) this.drawBuild(g, this.serving.x, this.serving.y, this.serving.build, 1);

      G.cam.pop(g);

      // ===== screen space =====
      // croc arms: left cradles the build, right holds the implement
      const M = G.mouse;
      const bx = PLX - camX;
      G.drawArm(g, G.clamp(bx - 40, 34, G.W - 70), 340, -1, { grip: 1, reach: 20, thick: 26 });
      const h = this.hold;
      const rx = G.clamp(M.x, 18, G.W - 18), ry = G.clamp(M.y, 70, G.H - 10);
      if (M.x >= 0) G.drawArm(g, rx, ry + 20, 1, { grip: h ? 1 : 0.35, reach: 22, thick: 25 });
      if (h) {
        if (h.kind === 'scoop') {
          // the steel scoop, with the dome swelling inside its bowl
          G.R(g, rx + 4, ry - 6, 6, 26, OUT);
          G.R(g, rx + 5, ry - 5, 4, 24, P.steel);
          G.R(g, rx + 5, ry - 5, 2, 22, P.chrome);
          G.dome(g, rx, ry + 2, 9, P.steel, { squash: 1.15, spec: false });
          G.R(g, rx - 6, ry - 2, 12, 3, G.shade(P.steel, 0.3));
          if (h.fill > 0.05) G.drawScoopBall(g, rx, ry - 2 - h.fill * 6, 4 + h.fill * 9, h.fid, 0);
        } else if (h.kind === 'ball') {
          const age = G.clamp((t - (h.born || 0)) * 6, 0, 1);
          const r0 = 13 + (1 - age) * 4;
          G.drawScoopBall(g, h.bx - camX, h.by - Math.round(G.cam.y) - 6, r0, h.fid, Math.sin(t * 9) * 0.04);
        } else if (h.kind === 'sauce') {
          G.drawBottle(g, rx, ry + 8, G.sauceById(h.sid), true);
        } else if (h.kind === 'jar') {
          G.drawJar(g, rx, ry + 8, G.topById(h.tid), true);
        }
        G.hideCursor = true;
      }

      // the flavour you are currently pulling, named on screen
      if (h && h.kind === 'scoop') {
        const f3 = G.flavorById(h.fid);
        const lab = f3.name;
        const lw = G.tw(lab) + 26;
        G.frame(g, G.W / 2 - lw / 2, 300, lw, 17, '#16211f');
        G.R(g, G.W / 2 - lw / 2 + 4, 305, 7, 7, OUT);
        G.R(g, G.W / 2 - lw / 2 + 4, 305, 6, 6, f3.col);
        G.R(g, G.W / 2 - lw / 2 + 4, 305, 6, 1, G.shade(f3.col, 0.4));
        G.text(g, lab, G.W / 2 + 6, 305, f3.col, { align: 'center' });
        // fill readout as a chunky bar, no target band to hit
        G.R(g, G.W / 2 - lw / 2 + 2, 318, lw - 4, 4, '#0d1413');
        G.R(g, G.W / 2 - lw / 2 + 2, 318, Math.round((lw - 4) * h.fill), 4,
          h.fill >= 1 ? P.neonG : G.mix(P.amber, P.neonG, h.fill));
      }

      // pan affordances
      const camAtL = G.cam.tx <= 1, camAtR = G.cam.tx >= WORLD - G.W - 1;
      for (const [ex, dirL] of [[0, true], [G.W - 16, false]]) {
        if (dirL ? camAtL : camAtR) continue;
        g.globalAlpha = 0.5 + Math.sin(t * 3) * 0.14;
        G.R(g, ex, 150, 16, 160, '#0a1210');
        for (let i = 0; i < 3; i++) {
          const ax = dirL ? ex + 11 - i * 3 : ex + 5 + i * 3;
          G.R(g, ax, 224 - i * 2, 2, 4 + i * 4, P.steel2);
        }
        g.globalAlpha = 1;
      }

      this.hud(g);
      G.grade(g, 1);

      if (this.endT > 0) {
        g.globalAlpha = Math.min(0.72, this.endT * 0.5);
        G.R(g, 0, 0, G.W, G.H, '#050908');
        g.globalAlpha = 1;
        G.text(g, 'SHUTTERS DOWN', G.W / 2, 150, P.gold, { align: 'center', out: OUT, sc: 2 });
        G.text(g, 'NOW GO AND FIX WHAT YOU SOLD THEM', G.W / 2, 180, P.steel2, { align: 'center', out: OUT });
      }
    },

    drawBit(g, x, y, p, alt) {
      if (p.shape === 'spr') { if (alt) G.R(g, x, y - 1, 1, 4, p.col); else G.R(g, x - 2, y, 4, 1, p.col); }
      else if (p.shape === 'big') { G.R(g, x - 2, y - 2, 4, 4, OUT); G.R(g, x - 1, y - 1, 3, 3, p.col); G.R(g, x - 1, y - 1, 1, 1, G.shade(p.col, 0.45)); }
      else { G.R(g, x - 1, y - 1, 3, 3, p.col); G.R(g, x - 1, y - 1, 1, 1, G.shade(p.col, 0.4)); }
    },

    drawBuild(g, ox, oy, b, scale) {
      if (scale < 1) g.globalAlpha = G.clamp(scale + 0.25, 0, 1);
      G.drawBase(g, b.base, ox, oy);
      for (let i = 0; i < b.scoops.length; i++) {
        const sp = this.scoopPos(i, ox, oy, b.base);
        const top = i === b.scoops.length - 1;
        // the freshly-set scoop squashes then settles
        const squash = top ? G.clamp(b.wob * 0.1, -0.28, 0.28) + (b.pop || 0) * 0.34 : 0;
        const drop = top ? -(b.pop || 0) * 4 : 0;
        G.drawScoopBall(g, sp.x, sp.y + drop, sp.r * (scale < 1 ? scale : 1), b.scoops[i], squash);
      }
      if (scale >= 1) {
        for (const c of b.coat) G.fc(g, ox + c.lx, oy + c.ly, c.r, c.col);
        for (const bit of b.bits) this.drawBit(g, ox + bit.lx, oy + bit.ly, bit);
      }
      g.globalAlpha = 1;
    },

    bubble(g, c) {
      const o = c.order;
      const uniq = [];
      for (const f of o.scoops) { const u = uniq.find((x) => x.id === f); if (u) u.n++; else uniq.push({ id: f, n: 1 }); }
      const rows = 1 + uniq.length + (o.sauce ? 1 : 0) + (o.top ? 1 : 0);
      const bw = 104, bh = 18 + rows * 11;
      let bx = Math.round(c.x - bw / 2), by = 96 - bh;
      G.frame(g, bx, by, bw, bh, '#e6e0cc');
      G.R(g, c.x - 4, 96, 8, 4, '#e6e0cc');
      G.R(g, c.x - 2, 100, 4, 3, '#e6e0cc');
      G.drawOrderIcon(g, o, bx + 17, by + bh - 9);
      const chk = this.check() || {};
      let ry = by + 6;
      const lx = bx + 36;
      const tick = (ok) => { if (ok) G.text(g, '✓', bx + bw - 11, ry, '#2f8a45'); };
      G.text(g, o.base === 'cone' ? 'CONE' : 'CUP', lx, ry, '#3a3a30'); tick(chk.base); ry += 11;
      for (const u of uniq) {
        const f = G.flavorById(u.id);
        G.R(g, lx, ry, 7, 7, OUT); G.R(g, lx, ry, 6, 6, f.col);
        G.R(g, lx, ry, 6, 1, G.shade(f.col, 0.4));
        G.text(g, '×' + u.n, lx + 10, ry, '#3a3a30');
        const have = this.build ? this.build.scoops.filter((s) => s === u.id).length : 0;
        if (this.build && have >= u.n && this.build.scoops.length <= o.scoops.length) tick(true);
        ry += 11;
      }
      if (o.sauce) {
        const s = G.sauceById(o.sauce);
        G.R(g, lx, ry + 2, 8, 2, s.col); G.R(g, lx + 1, ry + 4, 1, 3, s.col); G.R(g, lx + 5, ry + 4, 1, 4, s.col);
        G.text(g, 'SYRUP', lx + 11, ry, '#3a3a30'); tick(chk.sauce); ry += 11;
      }
      if (o.top) {
        for (let i = 0; i < 4; i++) G.R(g, lx + i * 3, ry + 2 + (i % 2) * 2, 2, 2, G.topBitCol(o.top));
        G.text(g, 'GRIT', lx + 14, ry, '#3a3a30'); tick(chk.top); ry += 11;
      }
      G.text(g, c.name, bx + bw / 2, by - 10, P.cream, { align: 'center', out: OUT });
      // patience bar
      const pw = G.clamp(1 - c.wait / 44, 0, 1);
      G.R(g, bx, by + bh + 2, bw, 3, '#0a1210');
      G.R(g, bx, by + bh + 2, Math.round(bw * pw), 3, pw > 0.5 ? '#2f8a45' : pw > 0.22 ? P.amber : P.blood);
    },

    hud(g) {
      G.frame(g, 4, 3, 74, 16, '#16211f');
      G.fe(g, 15, 11, 4, 5, P.gold); G.R(g, 13, 7, 2, 2, '#fff3b0');
      G.text(g, '$' + Math.round(G.state.moneyShown), 24, 7, P.gold);
      G.frame(g, 82, 3, 92, 16, '#16211f');
      G.text(g, 'DAY ' + G.state.day + '  ' + G.state.today.kidsServed + '/' + this.total, 88, 7, P.cream);
      // sugar / tonight's workload
      const pn = G.state.today.patients.reduce((a, p) => a + p.symptoms.length, 0);
      if (pn > 0) {
        G.frame(g, 178, 3, 96, 16, '#16211f');
        G.drawToothIcon(g, 184, 5, P.bone);
        G.text(g, '×' + pn + ' TONIGHT', 196, 7, '#b46bff');
      }
      if (this.t % 8 < 4 && !this.hold) {
        const hint = !this.build ? 'TAP A CONE OR CUP TO START'
          : !this.build.scoops.length ? 'PRESS A FLAVOUR BAND AND HOLD, THEN DRAG IT OVER'
          : 'DRIZZLE, SHAKE, THEN SERVE';
        g.globalAlpha = 0.8;
        G.text(g, hint, G.W / 2, 286, '#5d7a72', { align: 'center' });
        g.globalAlpha = 1;
      }
    },
  };
})();

// ============================================================
// DOUBLE LIFE v4 - day.js  ·  THE KIOSK
// 320x180, pulled right up to the counter of a neon ice cream
// stand. A robot's head fills the right of frame with its intake
// hatch hanging open; the labelled tubs fill the left.
//
// The twist: the order chit blanks out after a few seconds. You
// have to remember it. RECALL peeks for a small cut of the tip.
// And most robots want something strange doing to them.
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
  const CUST = { x: 248, y: 62 };                // screen space
  const CSCALE = 0.92;
  const SAUCE_NEED = 14, TOP_NEED = 6;
  const HEAD_NEED = 6;                           // bits/drops that must land ON the robot
  const MEM_SHOW = 6.0;                          // seconds the chit stays readable
  const PEEK_LEN = 1.4, PEEK_COST = 2;
  const PATIENCE = 40;

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
      this.bust = null;
      this.bag = [];
      while (this.bag.length < this.total) {
        const sh = G.DATA.robots.map((a) => a.id).sort(() => Math.random() - 0.5);
        for (const id of sh) if (this.bag.length < this.total) this.bag.push(id);
      }
      G.steam.length = 0;
      G.audio.music('day');
      if (!G.state.tut.scoop) G.toast('HOLD A FLAVOUR BAND', P.hazard);
    },

    // ---------------- customer ----------------
    genOrder(quirk) {
      const d = G.state.day;
      let n = G.irand(1, Math.min(3, 1 + Math.ceil(d / 2)));
      const scoops = [];
      if (quirk === 'twin') {
        n = Math.max(2, n);
        const f = G.pick(G.state.flavors);
        for (let i = 0; i < n; i++) scoops.push(f);
      } else {
        for (let i = 0; i < n; i++) scoops.push(G.pick(G.state.flavors));
      }
      const bare = quirk === 'nosprink' || quirk === 'handfeed';
      if (quirk === 'handfeed') scoops.length = Math.min(scoops.length, 2);
      return {
        base: quirk === 'cuponly' ? 'cup' : quirk === 'handfeed' ? 'none' : (Math.random() < 0.7 ? 'cone' : 'cup'),
        scoops,
        sauce: !bare && quirk !== 'sauceme' && Math.random() < 0.3 + d * 0.05 ? G.pick(G.state.sauces) : null,
        top: !bare && quirk !== 'onhead' && Math.random() < 0.3 + d * 0.05 ? G.pick(G.state.tops) : null,
      };
    },
    rollQuirk() {
      // day 1 is plain so the basics land first; quirks ramp in after that
      if (G.state.day <= 1) return 'none';
      const pool = ['none', 'none', 'quick', 'twin', 'cuponly', 'onhead', 'handfeed', 'nosprink'];
      if (G.state.day >= 3) pool.push('sauceme', 'onhead', 'handfeed');
      return G.pick(pool);
    },
    spawn() {
      const sp = this.bag[this.total - this.left];
      const a = G.robotById(sp);
      this.left--;
      const quirk = this.rollQuirk();
      this.cust = {
        sp, name: G.pick(a.names), cls: a.cls, quirk,
        order: this.genOrder(quirk),
        st: 'arrive', t: 0, wait: 0, mood: 'idle', open: 0, eat: null, slide: 1,
        memo: MEM_SHOW + (G.hasUp('loupe') ? 4 : 0),   // countdown before the chit blanks
        peek: 0, peeks: 0,
        headBits: 0, headSauce: 0, fed: 0, sprinkled: false,
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
    // the robot's head, in SCREEN space, for the quirks that target it
    headRect() {
      const b = this.bust;
      if (!b) return { x: CUST.x - 30, y: CUST.y - 30, w: 60, h: 70 };
      return { x: b.cx - b.hw - 4, y: b.headTop - 8, w: b.hw * 2 + 8, h: (b.jawY - b.headTop) + 26 };
    },
    mouthRect() {
      const b = this.bust;
      if (!b) return { x: CUST.x - 20, y: CUST.y + 10, w: 40, h: 34 };
      return { x: b.cx - 24, y: b.jawY - 6, w: 48, h: 34 };
    },

    // ---------------- input ----------------
    onDown(sx, sy) {
      if (this.endT > 0) return;
      const wx = sx + Math.round(G.cam.x), wy = sy;
      const c = this.cust;

      if (sy >= 158) {                                  // tray row
        if (G.inRect(sx, sy, 232, 161, 40, 16) && this.canServe()) { G.audio.sfx('click'); this.serve(); return; }
        if (G.inRect(sx, sy, 186, 161, 42, 16)) {        // RECALL
          if (c && c.st === 'order') {
            if (c.memo > 0) { G.toast('IT IS STILL ON THE CHIT', P.steel2); return; }
            c.peek = PEEK_LEN; c.peeks++;
            G.audio.sfx('bookOpen');
          }
          return;
        }
        if (G.inRect(sx, sy, 276, 161, 40, 16)) { G.cam.nudge(G.cam.tx > 40 ? -80 : 80); G.audio.sfx('clack'); return; }
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
      // tubs: press the stratum you want
      for (let i = 0; i < NPINT; i++) {
        const r = pintRect(i);
        if (G.inRect(wx, wy, r.x - 4, r.y - 5, r.w + 8, r.h + 12)) {
          const pint = this.pints[i];
          const nl = pint.layers.length;
          const li = G.clamp(Math.floor(((wy - r.y) / r.h) * nl), 0, nl - 1);
          this.hold = { kind: 'scoop', pi: i, li, fid: pint.layers[li], fill: 0, tick: 0 };
          G.audio.sfx('grab');
          if (!G.state.tut.scoop) { G.state.tut.scoop = 1; G.toast('HOLD UNTIL IT IS FULL', P.lime); }
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
      // toppings
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
        if (h.fill < 0.32) { this.hold = null; G.audio.sfx('splat'); this.puff(wx, wy, G.flavorById(h.fid).col, 6); return; }
        this.popBall(h);
        return;
      }
      if (h.kind === 'ball') {
        this.hold = null;
        // hand-feed: drop a bare scoop straight into the intake
        const c = this.cust;
        const mr = this.mouthRect();
        if (c && c.st === 'order' && G.inRect(sx, sy, mr.x, mr.y, mr.w, mr.h)) {
          c.fed++;
          c.mood = 'happy';
          G.audio.sfx('plop'); G.shake(1.2, 0.1);
          G.spark(sx, sy, ['#ffffff', G.flavorById(h.fid).col], 12, 50);
          G.floatText('FED', sx, sy - 14, P.lime);
          if (!this.handBuild) this.handBuild = { base: 'none', scoops: [], coat: [], bits: [], sauceAmt: {}, topAmt: {} };
          this.handBuild.scoops.push(h.fid);
          return;
        }
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

    // ---------------- scoring ----------------
    // The build being judged is the cone/cup, or the pile of
    // hand-fed scoops for a handfeed robot.
    judged() {
      const c = this.cust;
      if (c && c.quirk === 'handfeed') return this.handBuild || { base: 'none', scoops: [], sauceAmt: {}, topAmt: {} };
      return this.build;
    },
    canServe() {
      const c = this.cust;
      if (!c || c.st !== 'order') return false;
      const b = this.judged();
      return !!(b && b.scoops.length);
    },
    check() {
      const c = this.cust;
      const b = this.judged();
      if (!b || !c) return null;
      const o = c.order, q = c.quirk;
      const have = {}, need = {};
      for (const f of b.scoops) have[f] = (have[f] || 0) + 1;
      for (const f of o.scoops) need[f] = (need[f] || 0) + 1;
      let ok = b.scoops.length === o.scoops.length;
      for (const k in need) if ((have[k] || 0) !== need[k]) ok = false;
      for (const k in have) if (!need[k]) ok = false;
      const anySauce = Object.keys(b.sauceAmt || {}).some((k) => b.sauceAmt[k] > 2);
      const anyTop = Object.keys(b.topAmt || {}).some((k) => b.topAmt[k] > 2);
      return {
        base: b.base === o.base,
        scoops: ok,
        sauce: !o.sauce || (b.sauceAmt[o.sauce] || 0) >= SAUCE_NEED,
        top: !o.top || (b.topAmt[o.top] || 0) >= TOP_NEED,
        quirk: q === 'onhead' ? c.headBits >= HEAD_NEED
          : q === 'sauceme' ? c.headSauce >= HEAD_NEED
          : q === 'handfeed' ? c.fed >= o.scoops.length
          : q === 'nosprink' ? (!anySauce && !anyTop)
          : q === 'quick' ? c.wait < 14
          : true,
      };
    },
    rollFaults(b, sugar) {
      let hard = 0;
      for (const k in (b.topAmt || {})) { const tp = G.topById(k); if (tp && tp.hard >= 2) hard++; }
      const sticky = Object.keys(b.sauceAmt || {}).length > 0;
      const pool = ['sugarcrust', 'sprinklejam'];
      if (sticky) pool.push('syrupshort', 'dairyrot');
      if (sugar >= 8) pool.push('sugarcrust', 'coldseize');
      if (sugar >= 14) pool.push('overload', 'dairyrot');
      if (sugar >= 20) pool.push('overload', 'syrupshort');
      for (let i = 0; i < hard; i++) pool.push('nutcrack', 'wedged');
      const n = G.clamp(1 + Math.floor(sugar / 9) + (hard ? 1 : 0), 1, 4);
      const out = [];
      for (let i = 0; i < n; i++) out.push(G.pick(pool));
      return out;
    },
    serve() {
      const c = this.cust, b = this.judged();
      if (!c || !b || !b.scoops.length) return;
      const chk = this.check(), o = c.order;
      const q = G.quirkById(c.quirk);
      let pay = 6 + 4 * o.scoops.length + (o.sauce ? 4 : 0) + (o.top ? 3 : 0);
      let verdict;
      if (chk.base && chk.scoops && chk.sauce && chk.top && chk.quirk) {
        verdict = 'perfect';
        pay += (q.pay || 3) + (c.wait < 16 ? 4 : 2);
        G.state.today.perfect++;
      } else if (chk.scoops && chk.quirk) { verdict = 'ok'; pay = Math.ceil(pay * 0.7); }
      else { verdict = 'bad'; pay = Math.ceil(pay * 0.45); }
      pay = Math.max(2, pay - c.peeks * PEEK_COST);

      let sugar = 0;
      for (const f of b.scoops) sugar += (G.flavorById(f) || {}).sugar || 2;
      for (const k in (b.sauceAmt || {})) sugar += Math.min(5, Math.round(b.sauceAmt[k] / SAUCE_NEED * 3));
      for (const k in (b.topAmt || {})) sugar += Math.min(4, Math.round(b.topAmt[k] / TOP_NEED * 2));
      sugar += Math.round((c.headBits + c.headSauce) / 8);      // what went on the shell counts too
      sugar = Math.round(sugar);
      G.state.today.sugar += sugar;
      G.state.today.jobs.push({ sp: c.sp, name: c.name, sugar, faults: this.rollFaults(b, sugar) });

      if (c.quirk === 'handfeed') {
        // already in the intake: go straight to chewing
        c.st = 'eat';
        c.eat = { t: 0, build: b, pay, verdict, bites: -1, left: 0.001 };
      } else {
        this.serving = { build: b, x: PLX - Math.round(G.cam.x), y: PLY, t: 0, pay, verdict };
        this.build = null;
        c.st = 'served';
      }
      this.handBuild = null;
      this.drops.length = 0; this.bits.length = 0;
      G.audio.sfx('swish');
    },

    // ---------------- update ----------------
    update(dt) {
      this.t += dt;
      const M = G.mouse;
      const wx = M.wx, wy = M.y;
      if (this.binWob > 0) this.binWob -= dt * 3;
      G.updateSteam(dt);
      if (Math.random() < dt * 1.4) G.puffSteam(G.irand(10, 310), 176);

      if (!this.cust && this.left > 0) {
        this.spawnT -= dt;
        if (this.spawnT <= 0) { this.spawn(); this.spawnT = 1.2; }
      }

      const c = this.cust;
      if (c) {
        c.t += dt;
        if (c.st === 'arrive') {
          c.slide = Math.max(0, c.slide - dt * 2.6);
          if (c.slide <= 0) {
            c.st = 'order';
            G.audio.sfx('order');
            if (c.quirk !== 'none') G.toast(G.quirkById(c.quirk).hint, P.hazard);
          }
        }
        if (c.st === 'order') {
          c.wait += dt;
          if (c.memo > 0) c.memo -= dt;
          if (c.peek > 0) c.peek -= dt;
          // intake hangs open, waiting to be fed
          c.open = 0.66 + Math.sin(this.t * 1.6) * 0.14;
          if (c.wait > PATIENCE * 0.72) c.mood = 'angry';
        }
        if (c.st === 'eat') {
          c.eat.t += dt;
          const ph = (c.eat.t * 3.4) % 1;
          c.open = 0.2 + 0.72 * Math.pow(Math.sin(ph * Math.PI), 0.55);
          c.eat.left = Math.max(0, 1 - c.eat.t / 1.7);
          if (Math.floor(c.eat.t * 3.4) !== c.eat.bites) {
            c.eat.bites = Math.floor(c.eat.t * 3.4);
            G.audio.sfx('chew');
            const col = G.flavorById(c.eat.build.scoops[0]).col;
            for (let i = 0; i < 4; i++)
              this.parts.push({ x: CUST.x + G.rand(-8, 8), y: 108, vx: G.rand(-24, 24), vy: G.rand(-40, -6),
                col, t: 0, life: 0.4, grav: 200, screen: true });
          }
          if (c.eat.t > 1.9) {
            const v = c.eat.verdict;
            if (v === 'perfect') { G.audio.sfx('perfect'); c.mood = 'happy'; G.floatText('PERFECT +$' + c.eat.pay, CUST.x, 36, P.lime); }
            else if (v === 'ok') { G.audio.sfx('good'); c.mood = 'happy'; G.floatText('+$' + c.eat.pay, CUST.x, 36, P.hazard); }
            else { G.audio.sfx('bad'); c.mood = 'angry'; G.floatText('WRONG +$' + c.eat.pay, CUST.x, 36, P.warn); }
            G.flyCoin(CUST.x, 48, c.eat.pay);
            G.state.today.dayEarn += c.eat.pay;
            G.state.today.botsServed++;
            G.state.totBots++;
            const p = G.state.today.jobs[G.state.today.jobs.length - 1];
            if (p) G.floatText(p.faults.length + ' IN THE SHOP', CUST.x, 26, P.violetLt);
            c.st = 'leave';
            c.open = 0;
          }
        }
        if (c.st === 'leave') {
          c.slide += dt * 2.2;
          if (c.slide > 1.2) { this.cust = null; this.handBuild = null; }
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
        h.fill = Math.min(1, h.fill + dt * (G.hasUp('steady') ? 1.6 : 1.2));
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
            // pouring over the robot is SCREEN space; over the bench is world space
            const hr = this.headRect();
            const onHead = c && c.st === 'order' && G.inRect(M.x, M.y, hr.x, hr.y, hr.w, hr.h);
            this.drops.push({ x: onHead ? M.x : wx, y: (onHead ? M.y : wy) + 4, vx: G.rand(-5, 5), vy: 26,
              col: G.sauceById(h.sid).col, sid: h.sid, mode: 'fall', screen: onHead });
          }
        }
        G.audio.loop('pour', pouring, 0.85);
      }
      if (h && h.kind === 'jar') {
        const shake = Math.abs(M.vx) > 120;
        h.emit -= dt;
        if (G.dist(M.x, M.y, h.gx, h.gy) > 5 && h.emit <= 0 && this.bits.length < 60) {
          h.emit = shake ? 0.05 : 0.12;
          const hr = this.headRect();
          const onHead = c && c.st === 'order' && G.inRect(M.x, M.y, hr.x, hr.y, hr.w, hr.h);
          for (let i = 0; i < (shake ? 2 : 1); i++) {
            const tp = G.topById(h.tid);
            this.bits.push({ x: (onHead ? M.x : wx) + G.rand(-4, 4), y: (onHead ? M.y : wy) + 4,
              vx: G.rand(-20, 20) + G.clamp(M.vx * 0.12, -30, 30), vy: 10,
              col: G.topBitCol(h.tid), tid: h.tid, shape: tp && tp.hard >= 2 ? 'big' : 'sml',
              t: 0, bounces: 0, screen: onHead });
          }
          G.audio.sfx('grit');
        }
      }

      // ---- sauce physics ----
      const b = this.build;
      for (let i = this.drops.length - 1; i >= 0; i--) {
        const d = this.drops[i];
        if (d.screen) {                              // landing on the robot's shell
          d.vy += 340 * dt; d.y += d.vy * dt; d.x += d.vx * dt;
          const hr = this.headRect();
          if (d.y > hr.y + hr.h * 0.55 || d.y > 150) {
            if (c && G.inRect(d.x, d.y, hr.x, hr.y, hr.w, hr.h + 20)) {
              c.headSauce++;
              c.shellCoat = c.shellCoat || [];
              const sy = hr.y + hr.h * 0.14 + Math.random() * hr.h * 0.55;
              c.shellCoat.push({ x: d.x, y: Math.round(Math.min(d.y, sy)), col: d.col });
              if (c.shellCoat.length > 220) c.shellCoat.shift();
            }
            this.drops.splice(i, 1);
          }
          continue;
        }
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
      // ---- topping physics ----
      for (let i = this.bits.length - 1; i >= 0; i--) {
        const p = this.bits[i];
        p.vy += 320 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.t += dt;
        if (p.screen) {                              // sticking to the robot
          const hr = this.headRect();
          if (p.y > hr.y + hr.h * 0.5 || p.y > 150) {
            if (c && G.inRect(p.x, p.y, hr.x, hr.y, hr.w, hr.h + 20)) {
              c.headBits++;
              c.shellBits = c.shellBits || [];
              const sy = hr.y + hr.h * 0.16 + Math.random() * hr.h * 0.5;
              c.shellBits.push({ x: p.x, y: Math.round(Math.min(p.y, sy)), col: p.col, shape: p.shape });
              if (c.shellBits.length > 140) c.shellBits.shift();
              if (c.headBits >= HEAD_NEED) c.sprinkled = true;
            }
            this.bits.splice(i, 1);
          }
          continue;
        }
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
        if (this.endT > 1.4) { G.audio.sfx('night'); G.save(); G.go('night', 'SHIFT ' + G.state.day); }
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
      G.toastCX = 92; G.toastY = 160;

      // ===== the street =====
      G.R(g, 0, 0, G.W, G.H, P.cityDk);
      G.cityWall(g, 0, 0, G.W, COUNTER - 8, t);
      G.conduit(g, 0, 3, G.W, false, P.cyan);
      G.conduit(g, 6, 13, 54, true, P.magenta);
      // hanging signage down the wall
      G.hangSign(g, 104, 26, 18, 16, P.magenta, t, 0);
      G.hangSign(g, 128, 26, 18, 16, P.cyan, t, 1);
      G.hangSign(g, 152, 26, 18, 16, P.violet, t, 2);
      // the kiosk's own neon strip over the counter
      const fl = (Math.sin(t * 13) > 0.94) ? 0.35 : 1;
      G.R(g, 92, 12, 136, 4, fl > 0.5 ? P.magentaLt : P.magentaDk);
      G.R(g, 92, 11, 136, 1, fl > 0.5 ? '#ffffff' : P.magentaDk);
      G.glow(g, 160, 26, 150, 66, P.magenta, 1.1 * fl);
      // kiosk lettering, tucked under the strip where nothing else lands
      G.text(g, 'SOFT SERVE', 90, 20, fl > 0.5 ? P.cyanLt : P.cyanDk, { out: OUT });
      G.text(g, '24 HR', 90, 30, P.steel);

      G.cam.push(g);
      // ---- counter slab ----
      G.box(g, -4, COUNTER - 8, WORLD + 8, 16, P.plate, { lit: P.plateLt, dk: P.plateDk, r: 2, band: 3 });
      G.R(g, -4, COUNTER - 8, WORLD + 8, 1, P.cyanDk);
      // the lower assembly shelf, where the cone actually gets built
      G.box(g, -4, COUNTER + 6, WORLD + 8, 46, P.plateDk, { lit: P.plate, dk: P.plateDk2, r: 2, band: 4 });
      G.R(g, -4, COUNTER + 7, WORLD + 8, 1, P.cyanDk);
      G.speckle(g, 0, COUNTER + 10, WORLD, 40, '#0e1018', 0.08, 4);
      // a strip of under-counter light along the back of the shelf
      G.R(g, 0, COUNTER + 10, WORLD, 1, '#2a3450');

      // ---- tubs ----
      for (let i = 0; i < NPINT; i++) {
        const r = pintRect(i), pt = this.pints[i];
        G.drawPint(g, r.x, r.y, r.w, r.h, pt.layers, pt.surf, { legend: true });
      }

      // ---- bases + bin ----
      G.cone3(g, STAND.cone.x, COUNTER - 6, [], { w: 16, h: 20 });
      G.box(g, STAND.cup.x - 8, STAND.cup.y + 2, 16, 16, P.plateDk, { lit: P.plate, dk: P.plateDk2, r: 1, band: 2 });
      G.R(g, STAND.cup.x - 6, STAND.cup.y + 4, 12, 1, P.cyanDk);
      const bw = this.binWob > 0 ? Math.sin(t * 40) * 1 : 0;
      G.box(g, BIN.x + bw, BIN.y, BIN.w, BIN.h, P.plateDk, { r: 1, band: 2 });
      G.R(g, BIN.x - 2 + bw, BIN.y - 3, BIN.w + 4, 3, P.plate);

      // ---- sauce + toppings ----
      G.text(g, 'SAUCE', RACK_S.x + 4, RACK_S.y - 8, P.cyanLt, { out: OUT });
      G.box(g, RACK_S.x, RACK_S.y + 26, 56, 5, P.plateDk, { r: 1, band: 1, spec: false });
      const sl = G.state.sauces;
      for (let i = 0; i < sl.length; i++) {
        if (this.hold && this.hold.kind === 'sauce' && this.hold.sid === sl[i]) continue;
        const s = G.sauceById(sl[i]);
        G.box(g, RACK_S.x + 3 + i * 15, RACK_S.y + 8, 11, 18, s.col, { r: 1, band: 3 });
        G.R(g, RACK_S.x + 5 + i * 15, RACK_S.y + 5, 7, 4, P.hull);
      }
      G.text(g, 'TOPPINGS', RACK_T.x + 4, RACK_T.y - 8, P.cyanLt, { out: OUT });
      G.box(g, RACK_T.x, RACK_T.y + 26, 52, 5, P.plateDk, { r: 1, band: 1, spec: false });
      const tl = G.state.tops;
      for (let i = 0; i < tl.length; i++) {
        if (this.hold && this.hold.kind === 'jar' && this.hold.tid === tl[i]) continue;
        const tp = G.topById(tl[i]);
        const bx = RACK_T.x + 3 + (i % 3) * 16, by = RACK_T.y + 6 + Math.floor(i / 3) * 24;
        G.box(g, bx, by, 12, 20, P.plateDk2, { r: 1, band: 2 });
        for (let k = 0; k < 5; k++) G.R(g, bx + 2 + (k % 3) * 3, by + 6 + Math.floor(k / 3) * 4, 2, 2, G.topBitCol(tp.id));
        G.R(g, bx, by - 2, 12, 3, P.hull);
      }

      // ---- plate + build ----
      G.box(g, PLX - 16, PLY + 1, 32, 5, P.hullDk, { lit: P.hull, dk: P.plateDk2, r: 1, band: 1 });
      G.R(g, PLX - 14, PLY + 2, 28, 1, P.cyanDk);
      G.drawGoreWorld(g);
      for (const r of this.rest) { g.globalAlpha = G.clamp(1 - r.t / 5, 0, 1); this.drawBit(g, r.x, r.y, r); g.globalAlpha = 1; }
      if (this.build) this.drawBuild(g, PLX, PLY, this.build);
      if (this.hold && this.hold.kind === 'ball' && this.build && this.build.scoops.length < 3) {
        const np = this.scoopPos(this.build.scoops.length);
        const near = G.dist(G.mouse.wx, G.mouse.y, np.x, np.y) < 26;
        g.globalAlpha = 0.4 + Math.abs(Math.sin(t * 5)) * (near ? 0.6 : 0.2);
        for (let i = 0; i < 10; i += 2) {
          const a = (i / 10) * Math.PI * 2;
          G.R(g, np.x + Math.cos(a) * np.r, np.y + Math.sin(a) * np.r * 0.8, 2, 2, near ? P.lime : P.hullLt);
        }
        g.globalAlpha = 1;
      }
      for (const d of this.drops) if (!d.screen) G.R(g, d.x, d.y, 2, 2, d.col);
      for (const p of this.bits) if (!p.screen) this.drawBit(g, p.x, p.y, p);
      for (const p of this.parts) {
        if (p.screen) continue;
        g.globalAlpha = 1 - p.t / p.life; G.R(g, p.x, p.y, 2, 2, p.col); g.globalAlpha = 1;
      }
      G.cam.pop(g);

      // ===== screen space: the robot, right in your face =====
      const c = this.cust;
      if (c) {
        const sl2 = G.easeOut(G.clamp(1 - c.slide, 0, 1));
        const cxp = CUST.x + Math.round((1 - sl2) * 90);
        const bust = G.robotBust(g, c.sp, cxp, CUST.y, CSCALE,
          { t, open: c.open, mood: c.mood, sprinkled: false });
        bust.cx = cxp;
        this.bust = bust;
        // what landed on its shell, drawn on the shell
        if (c.shellCoat) for (const s of c.shellCoat) G.R(g, s.x + (cxp - CUST.x), s.y, 2, 2, s.col);
        if (c.shellBits) for (const s of c.shellBits) this.drawBit(g, s.x + (cxp - CUST.x), s.y, s);
        // eating: the cone comes up into the intake in a servo mitt
        if (c.st === 'eat' && c.eat && c.eat.left > 0.04 && c.eat.build.base !== 'none') {
          const scp = c.eat.build.scoops;
          const ex = cxp - Math.round(bust.hw * 0.42);
          const ey = bust.jawY + 40 - Math.round(Math.sin(c.eat.t * 3.4 * Math.PI * 2) * 2);
          const full = Math.floor(scp.length * c.eat.left);
          const frac = (scp.length * c.eat.left) - full;
          const r = G.cone3(g, ex, ey, scp.slice(0, full), { w: 15, h: 20, sr: 9 });
          if (frac > 0.1 && full < scp.length) {
            const rr = Math.max(3, Math.round(9 * frac));
            G.scoop3(g, ex, r.topY - rr + 2, rr, scp[full], {});
          }
          G.servoMitt(g, ex - 9, ey - 12, { grip: 1 });
        }
        if (c.st === 'order') this.chit(g, c, cxp, bust);
      }
      for (const d of this.drops) if (d.screen) G.R(g, d.x, d.y, 2, 2, d.col);
      for (const p of this.bits) if (p.screen) this.drawBit(g, p.x, p.y, p);
      for (const p of this.parts) {
        if (!p.screen) continue;
        g.globalAlpha = 1 - p.t / p.life; G.R(g, p.x, p.y, 2, 2, p.col); g.globalAlpha = 1;
      }
      if (this.serving) this.drawBuild(g, this.serving.x, this.serving.y, this.serving.build, true);
      G.drawSteam(g);

      // ---- held implement + servo mitt ----
      const M = G.mouse, h = this.hold;
      if (h && M.x >= 0) {
        const rx = G.clamp(M.x, 6, G.W - 6), ry = G.clamp(M.y, 20, 154);
        if (h.kind === 'scoop') {
          G.R(g, rx + 3, ry - 4, 4, 16, P.hull);
          G.box(g, rx - 6, ry - 2, 12, 9, P.hull, { lit: P.hullLt, dk: P.hullDk, r: 2, band: 2 });
          if (h.fill > 0.05) G.scoop3(g, rx, ry - 2 - h.fill * 4, 3 + h.fill * 6, h.fid, {});
          G.servoMitt(g, rx + 4, ry + 10, { grip: 1 });
        } else if (h.kind === 'ball') {
          G.scoop3(g, h.bx - camX, h.by - 4, 9, h.fid, {});
          G.servoMitt(g, h.bx - camX + 8, h.by + 6, { grip: 1 });
        } else if (h.kind === 'sauce') {
          const s = G.sauceById(h.sid);
          G.box(g, rx - 5, ry - 18, 11, 18, s.col, { r: 1, band: 3 });
          G.R(g, rx - 1, ry, 2, 3, G.shade(s.col, -0.4));
          G.servoMitt(g, rx + 6, ry - 8, { grip: 1 });
        } else if (h.kind === 'jar') {
          G.box(g, rx - 6, ry - 18, 12, 18, P.plateDk2, { r: 1, band: 2 });
          for (let k = 0; k < 5; k++) G.R(g, rx - 4 + (k % 3) * 3, ry - 13 + Math.floor(k / 3) * 4, 2, 2, G.topBitCol(h.tid));
          G.R(g, rx - 5, ry, 10, 2, P.hull);
          G.servoMitt(g, rx + 7, ry - 8, { grip: 1 });
        }
        G.hideCursor = true;
      }

      // ---- HUD ----
      G.box(g, 2, 2, 50, 12, P.ink2, { r: 1, band: 1, spec: false });
      G.R(g, 6, 6, 4, 5, P.hazard);
      G.text(g, '$' + Math.round(G.state.moneyShown), 13, 4, P.hazard);
      G.box(g, 56, 2, 54, 12, P.ink2, { r: 1, band: 1, spec: false });
      G.text(g, 'DAY ' + G.state.day + ' ' + G.state.today.botsServed + '/' + this.total, 60, 4, P.cream);
      const pn = G.state.today.jobs.reduce((a, p) => a + p.faults.length, 0);
      if (pn) {
        G.box(g, 114, 2, 52, 12, P.ink2, { r: 1, band: 1, spec: false });
        G.text(g, pn + ' IN SHOP', 118, 4, P.violetLt);
      }
      if (h && h.kind === 'scoop') {
        const f = G.flavorById(h.fid);
        G.R(g, 108, 148, Math.round(104 * h.fill), 4, h.fill >= 1 ? P.lime : G.mix(P.hazard, P.lime, h.fill));
        G.text(g, f.name, 160, 140, f.col, { align: 'center', out: OUT });
      }

      // ---- tray ----
      G.R(g, 0, 156, G.W, 24, '#0c0d16');
      G.R(g, 0, 156, G.W, 1, P.cyanDk);
      const c2 = this.cust;
      const canRecall = c2 && c2.st === 'order' && c2.memo <= 0;
      G.box(g, 186, 161, 42, 16, canRecall ? P.violet : '#20242e', { r: 1, band: 2 });
      G.text(g, 'RECALL', 207, 166, canRecall ? '#f0e8ff' : '#4a5060', { align: 'center' });
      const cs = this.canServe();
      G.box(g, 232, 161, 40, 16, cs ? '#2f8a48' : '#20242e', { r: 1, band: 2 });
      G.text(g, 'SERVE', 252, 166, cs ? '#e8ffe8' : '#4a5060', { align: 'center' });
      G.box(g, 276, 161, 40, 16, P.cyanDk, { r: 1, band: 2 });
      G.text(g, G.cam.tx > 40 ? '< BENCH' : 'BENCH >', 296, 166, '#e8f8ff', { align: 'center' });
      if (this.t % 7 < 3.5 && !h && !G.toasts.length) {
        const hint = !this.build && (!c2 || c2.quirk !== 'handfeed') ? 'TAP A CONE TO START'
          : c2 && c2.quirk === 'handfeed' ? 'DROP A BARE SCOOP IN ITS MOUTH'
          : !this.build.scoops.length ? 'HOLD A FLAVOUR BAND'
          : 'SAUCE, TOPPINGS, THEN SERVE';
        G.text(g, hint, 4, 166, '#46506b');
      }

      if (this.endT > 0) {
        g.globalAlpha = Math.min(0.75, this.endT * 0.6);
        G.R(g, 0, 0, G.W, G.H, P.cityDk);
        g.globalAlpha = 1;
        G.text(g, 'SHUTTERS DOWN', 160, 76, P.magentaLt, { align: 'center', out: OUT, sc: 2 });
        G.text(g, 'GO AND FIX WHAT YOU SOLD', 160, 96, P.cyanLt, { align: 'center', out: OUT });
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

    // ---------------- the order chit ----------------
    // One horizontal strip across the top of the wall, laid out from a
    // measured cell list so it can never overflow its box. Readable for
    // a few seconds, then the cells redact themselves and you are on
    // your own. The quirk keeps its own tab, because remembering a weird
    // habit on top of the order is not fun - the order is.
    chit(g, c, cxp, bust) {
      const o = c.order;
      const shown = c.memo > 0 || c.peek > 0;
      const uniq = [];
      for (const f of o.scoops) { const u = uniq.find((x) => x.id === f); if (u) u.n++; else uniq.push({ id: f, n: 1 }); }
      const chk = this.check() || {};
      const jb = this.judged();

      // ---- measure ----
      const cells = [];
      const baseTxt = o.base === 'cone' ? 'CONE' : o.base === 'cup' ? 'CUP' : 'NO CONE';
      cells.push({ w: G.tw(baseTxt), ok: chk.base, draw: (x, y) => G.text(g, baseTxt, x, y, '#3a3524') });
      for (const u of uniq) {
        const f = G.flavorById(u.id);
        const lbl = (u.n > 1 ? 'x' + u.n + ' ' : '') + f.name.split(' ')[0].slice(0, 4);
        const have = jb ? jb.scoops.filter((sc) => sc === u.id).length : 0;
        cells.push({ w: G.tw(lbl) + 9, ok: have >= u.n, draw: (x, y) => {
          G.R(g, x, y, 7, 7, OUT); G.R(g, x, y, 6, 6, f.col);
          G.text(g, lbl, x + 9, y, '#3a3524');
        } });
      }
      if (o.sauce) cells.push({ w: 8, ok: chk.sauce, draw: (x, y) => {
        G.R(g, x, y, 8, 7, OUT); G.R(g, x, y + 1, 7, 5, G.sauceById(o.sauce).col);
      } });
      if (o.top) cells.push({ w: 11, ok: chk.top, draw: (x, y) => {
        for (let i = 0; i < 3; i++) G.R(g, x + i * 4, y + 1 + (i % 2) * 3, 3, 3, G.topBitCol(o.top));
      } });

      const NAME_W = 44, PAD = 5;
      let need = NAME_W + 4;
      for (const cl of cells) need += cl.w + PAD;
      const bx = 3, by = 17, bh = 15;
      const bw = G.clamp(need, 120, 234);
      G.box(g, bx, by, bw, bh, '#e4dcc4', { lit: '#f4eeda', dk: '#b8ae94', r: 2, band: 2, spec: false });
      G.R(g, bx + 1, by + 1, NAME_W - 3, bh - 2, '#2a2f42');
      G.text(g, c.name.slice(0, 7), bx + 4, by + 4, '#d8e4f0');
      G.R(g, bx + NAME_W - 7, by + 4, 3, 7, shown ? P.lime : P.magenta);

      // ---- draw ----
      let cx2 = bx + NAME_W + 1;
      for (const cl of cells) {
        if (cx2 + cl.w > bx + bw - 2) break;
        if (shown) { cl.draw(cx2, by + 4); if (cl.ok) G.R(g, cx2 + cl.w - 3, by + 2, 3, 3, '#2a6b34'); }
        else G.R(g, cx2, by + 4, cl.w, 7, '#b8ae94');
        cx2 += cl.w + PAD;
      }

      // memo timer, then patience, in two hard bars under the strip
      const my = by + bh;
      const full = MEM_SHOW + (G.hasUp('loupe') ? 4 : 0);
      G.R(g, bx, my, bw, 3, '#0d1220');
      if (c.memo > 0) G.R(g, bx, my, Math.round(bw * G.clamp(c.memo / full, 0, 1)), 3, P.cyan);
      else if (c.peek > 0) G.R(g, bx, my, Math.round(bw * (c.peek / PEEK_LEN)), 3, P.violet);
      const pw = G.clamp(1 - c.wait / PATIENCE, 0, 1);
      G.R(g, bx, my + 4, bw, 2, '#0d1220');
      G.R(g, bx, my + 4, Math.round(bw * pw), 2, pw > 0.5 ? '#3d9a4a' : pw > 0.22 ? P.hazard : P.magenta);
      if (c.memo <= 0 && c.peek <= 0)
        G.text(g, 'FROM MEMORY - RECALL COSTS $' + PEEK_COST, bx + 2, my + 8, P.magentaLt, { out: OUT });

      // ---- the quirk badge, its own tab to the right of the chit ----
      if (c.quirk !== 'none') {
        const q = G.quirkById(c.quirk);
        const qx = bx + bw + 3, qw = G.W - qx - 3;
        const pulse = Math.sin(this.t * 4) > 0 ? P.hazard : G.shade(P.hazard, -0.25);
        G.box(g, qx, by, qw, bh, '#2a1f10', { lit: '#4a3618', dk: '#160e06', r: 1, band: 1, spec: false });
        G.R(g, qx, by, qw, 1, pulse);
        G.text(g, q.label, qx + qw / 2, by + 4, chk.quirk ? P.lime : pulse, { align: 'center' });
        let prog = -1;
        if (c.quirk === 'onhead') prog = c.headBits / HEAD_NEED;
        else if (c.quirk === 'sauceme') prog = c.headSauce / HEAD_NEED;
        else if (c.quirk === 'handfeed') prog = c.fed / o.scoops.length;
        G.R(g, qx, by + bh, qw, 3, '#0d1220');
        if (prog >= 0) G.R(g, qx, by + bh, Math.round(qw * G.clamp(prog, 0, 1)), 3, P.lime);
        else if (chk.quirk) G.R(g, qx, by + bh, qw, 3, P.lime);
      }
    },
  };
})();

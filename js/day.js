// ============================================================
// DOUBLE LIFE v5 - day.js  ·  THE CAFE
// 320x180. Up to five flat pits sunk into the counter, seen from
// above. You press into a pit and SWEEP: the surface furrows, the
// ladle fills, and when you lift it the ice cream comes up in
// stretched gooey strands.
//
// The machines do not name a flavour. They name a craving. You
// decide which of your inventions to give them - and whether to
// give them the one with filings in it.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  const WORK_Y = 90;                              // the back work shelf surface
  const DECK_Y = 96, DECK_H = 54;                 // the pit deck in front of it
  const PIT_W = 52, PIT_H = 32, PIT_X0 = 6, PIT_PITCH = 60;
  const GX = 16, GY = 10;                         // heightfield resolution per pit
  const CUST = { x: 262, y: WORK_Y + 4 };         // where a machine stands (feet)
  const CSCALE = 1.05;
  const PLATE = { x: 96, y: WORK_Y };             // where the cone gets built
  const CONE_ST = 20, CUP_ST = 48;                // base stands on the shelf
  const RACK_S = 128, RACK_T = 172;               // sauce / topping shelf positions
  const JAR_X = 76;                               // the tip jar cat's spot on the shelf
  const PERFECT_LO = 0.76, PERFECT_HI = 1.16, SLOP = 1.42;
  const SAUCE_NEED = 12, TOP_NEED = 5;
  const PATIENCE = 42;

  function pitRect(i) { return { x: PIT_X0 + i * PIT_PITCH, y: DECK_Y + 7, w: PIT_W, h: PIT_H }; }

  const day = (G.scenes = G.scenes || {}).day = {
    enter() {
      if (!G.state.today) { G.newDayStats(); G.state.today.demand = G.rollDemand(); }
      this.t = 0;
      this.n = G.pitCount();
      // a fresh heightfield per pit each morning
      this.surf = [];
      for (let i = 0; i < 5; i++) this.surf.push(new Float32Array(GX * GY));
      this.hold = null;
      this.build = null;
      this.drops = []; this.bits = []; this.parts = [];
      this.serving = null;
      this.cust = null;
      this.endT = 0;
      this.total = (G.state.today.queue || 5);
      this.left = this.total;
      this.jar = { purr: 0, coins: 0, cool: 0, pets: 0 };
      this.reveal = null;                             // a disguise coming off
      this.flies = [];
      for (let i = 0; i < 5; i++) this.flies.push({ x: G.rand(10, 300), y: G.rand(30, 80),
        a: Math.random() * 6.28, sp: G.rand(10, 22), t: 0 });
      this.spawnT = 0.8;
      this.bot = null;
      this.bag = [];
      const pool = G.DATA.bots.map((b) => b.id);
      while (this.bag.length < this.total) {
        const sh = pool.slice().sort(() => Math.random() - 0.5);
        for (const id of sh) if (this.bag.length < this.total) this.bag.push(id);
      }
      // the crowd the district sent today shows up more often
      if (G.state.today.demand && G.state.today.demand.crowd) this.bag[0] = G.state.today.demand.crowd;
      G.steam.length = 0;
      G.audio.music('day');
      if (G.clause) G.clause.enter('day');
    },

    // ---------------- customers ----------------
    genOrder(bot) {
      const d = G.state.day;
      return {
        base: Math.random() < 0.68 ? 'cone' : 'cup',
        n: G.irand(1, Math.min(3, 1 + Math.floor(d / 3))),
        want: bot.taste,                              // the craving, not a flavour
        sauce: Math.random() < 0.22 + d * 0.04 ? G.pick(G.state.sauces) : null,
        top: Math.random() < 0.22 + d * 0.04 ? G.pick(G.state.tops) : null,
      };
    },
    spawn() {
      const id = this.bag[this.total - this.left];
      const b = G.botById(id);
      this.left--;
      // some of them are not machines
      const dis = G.rollDisguise();
      this.cust = {
        id, bot: b, name: G.pick(b.names),
        order: this.genOrder(b),
        st: 'arrive', t: 0, wait: 0, mood: 'idle', open: 0, slide: 1,
        walk: 0, read: false, shellBits: null, shellCoat: null,
        sauceOn: 0, topOn: 0,
        dis, tell: dis ? G.pick(dis.tells) : null, spotted: false,
      };
      G.audio.sfx('doorbell');
      if (dis && G.has('scanner') && G.clause)
        G.clause.say('SCANNER SAYS LOOK AGAIN. ' + G.TELLS[this.cust.tell].hint, P.lime, 4.4);
    },

    // ---------------- geometry ----------------
    scoopSeat(i) {
      const base = this.build && this.build.base === 'cup' ? PLATE.y - 20 : PLATE.y - 30;
      let cy = base - 8;
      for (let k = 1; k <= i; k++) cy -= (10 - k) + 3;
      return { x: PLATE.x, y: cy, r: 10 - i };
    },
    mouthRect() {
      const b = this.bot;
      if (!b) return { x: CUST.x - 18, y: 40, w: 36, h: 26 };
      return { x: b.cx - 20, y: b.mouthY - 8, w: 40, h: 28 };
    },
    botRect() {
      const b = this.bot;
      if (!b) return { x: CUST.x - 30, y: 24, w: 60, h: 80 };
      return { x: b.cx - b.hw - 4, y: b.top - 4, w: b.hw * 2 + 8, h: (CUST.y - b.top) };
    },

    // ---------------- input ----------------
    onDown(x, y) {
      if (G.clause && G.clause.onDown(x, y)) return;

      if (this.reveal) { this.reveal.skip = true; return; }

      if (y >= 150) {                                  // the tray
        if (G.inRect(x, y, 4, 152, 40, 16)) {
          if (!G.state.today.closed) {
            G.clause && G.clause.say('THE FLOOR IS OPEN. BACK ROOM AFTER CLOSE.', P.warn, 2.8);
            G.audio.sfx('bad');
          } else { G.audio.sfx('click'); G.go('back', 'THE BACK ROOM'); }
          return;
        }
        if (G.inRect(x, y, 48, 152, 34, 16)) { if (G.clause) G.clause.ask('read'); return; }
        if (G.inRect(x, y, 86, 152, 34, 16)) { if (G.clause) G.clause.ask('pick'); return; }
        if (G.inRect(x, y, 124, 152, 34, 16)) { if (G.clause) G.clause.ask('spot'); return; }
        if (G.inRect(x, y, 162, 152, 34, 16)) { if (G.clause) G.clause.ask('trend'); return; }
        if (G.inRect(x, y, 194, 152, 48, 16) && this.canServe()) { G.audio.sfx('click'); this.serve(); return; }
        if (G.inRect(x, y, 246, 152, 32, 16)) {          // bin
          if (this.build) { G.audio.sfx('splat'); this.puff(PLATE.x, PLATE.y - 10, '#6b5a3a', 8); this.build = null; }
          return;
        }
        return;
      }

      // the tell on a machine that is not a machine
      const c0 = this.cust;
      if (c0 && c0.dis && !c0.spotted && this.bot && this.bot.tellRect &&
          (c0.st === 'order' || c0.st === 'eat')) {
        const r = this.bot.tellRect;
        if (G.inRect(x, y, r.x - 3, r.y - 3, r.w + 6, r.h + 6)) { this.spot(); return; }
      }

      // the tip jar cat, if you bought one
      if (G.has('tipjar') && G.inRect(x, y, JAR_X - 11, WORK_Y - 30, 22, 34)) { this.pet(); return; }

      // cone / cup stands on the back shelf
      if (G.inRect(x, y, CONE_ST - 11, WORK_Y - 26, 22, 30)) { this.take('cone'); return; }
      if (G.inRect(x, y, CUP_ST - 11, WORK_Y - 20, 22, 24)) { this.take('cup'); return; }

      // sauce bottles + topping jars, in a row along the shelf
      const sl = G.state.sauces;
      for (let i = 0; i < sl.length; i++)
        if (G.inRect(x, y, RACK_S + i * 14 - 6, WORK_Y - 22, 13, 24)) {
          this.hold = { kind: 'sauce', sid: sl[i], gx: x, gy: y, emit: 0 }; G.audio.sfx('grab'); return;
        }
      const tl = G.state.tops;
      for (let i = 0; i < tl.length; i++)
        if (G.inRect(x, y, RACK_T + i * 14 - 6, WORK_Y - 22, 13, 24)) {
          this.hold = { kind: 'jar', tid: tl[i], gx: x, gy: y, emit: 0 }; G.audio.sfx('grab'); return;
        }

      // ---- the pits: press in and start sweeping ----
      for (let i = 0; i < this.n; i++) {
        const r = pitRect(i);
        if (!G.inRect(x, y, r.x - 2, r.y - 2, r.w + 4, r.h + 4)) continue;
        const pit = G.state.pits[i];
        if (!pit || pit.qty <= 0) { G.toast('THAT PIT IS EMPTY - CHURN MORE IN THE LAB', P.warn); return; }
        const f = G.flavById(pit.fid);
        if (!f) { G.toast('NOTHING LOADED THERE', P.warn); return; }
        this.hold = { kind: 'sweep', pi: i, fid: pit.fid, fill: 0, tick: 0, path: [], lastX: x, lastY: y, lift: 0 };
        G.audio.sfx('grab');
        if (G.state.tut < 3) G.clause && G.clause.tut(3);
        return;
      }
    },

    // ---- petting the cat ----
    pet() {
      const j = this.jar;
      j.purr = 1;
      j.pets++;
      G.audio.sfx('purr');
      if (j.cool > 0) { G.floatText('PURR', JAR_X, WORK_Y - 34, P.cyanLt); return; }
      j.cool = 5.5;
      const mul = (G.has('catnip') ? 2 : 1) * (G.hasPerk('p_purr') ? 1.5 : 1);
      const tip = Math.round((2 + G.irand(0, 3) + G.state.day) * mul);
      j.coins = Math.min(12, j.coins + 1);
      G.state.today.tips += tip;
      G.state.today.dayEarn += tip;
      G.state.tips += tip;
      G.flyCoin(JAR_X, WORK_Y - 18, tip);
      G.floatText('+$' + tip + ' TIP', JAR_X, WORK_Y - 38, P.hazard);
    },

    // ---- pulling a disguise off ----
    spot() {
      const c = this.cust;
      if (!c || !c.dis || c.spotted) return;
      c.spotted = true;
      const kind = c.dis.kind;
      const name = G.crewName(kind);
      const perk = G.crewPerk(kind);
      const pay = c.dis.pay + G.state.day * 6;
      G.state.crew = G.state.crew || [];
      G.state.crew.push({ kind, name, perk: perk.id, desc: perk.desc, day: G.state.day });
      G.state.money += pay;
      G.state.today.dayEarn += pay;
      G.state.today.spotted++;
      G.state.spotted++;
      G.state.suspicion = Math.max(0, G.state.suspicion - 0.05);
      G.audio.sfx('unlock');
      G.shake(3, 0.3);
      G.screenFlash('#ffffff', 0.12);
      this.reveal = { t: 0, kind, name, perk, pay, line: G.pick(c.dis.lines), skip: false,
                      bits: [] };
      // the shell comes apart
      for (let i = 0; i < 22; i++)
        this.reveal.bits.push({ x: CUST.x + G.rand(-16, 16), y: G.rand(30, 86),
          vx: G.rand(-52, 52), vy: G.rand(-90, -20), r: G.rand(1, 3),
          col: G.pick([c.bot.col, c.bot.col2, P.plateDk, P.hull]), t: 0, life: G.rand(0.7, 1.5) });
      G.save();
    },

    onMove() { /* sweeping is handled in update from the live cursor */ },

    onUp() {
      const h = this.hold;
      if (!h) { return; }
      if (h.kind === 'sweep') {
        G.audio.loop('carve', false);
        if (h.fill < 0.28) { this.hold = null; G.audio.sfx('back'); return; }
        // lift it out: the ball comes up on strands
        const f = G.flavById(h.fid);
        const pit = G.state.pits[h.pi];
        pit.qty = Math.max(0, pit.qty - 1);
        const grade = h.fill > SLOP ? 'slop' : h.fill >= PERFECT_LO && h.fill <= PERFECT_HI ? 'perfect' : 'ok';
        G.audio.sfx(grade === 'perfect' ? 'perfect' : 'scoopOff');
        if (grade === 'perfect') { G.spark(G.mouse.x, G.mouse.y, ['#ffffff', f.col], 14, 55); G.floatText('CLEAN SCOOP', G.mouse.x, G.mouse.y - 16, P.lime); }
        else if (grade === 'slop') G.floatText('SLOPPY', G.mouse.x, G.mouse.y - 16, P.warn);
        this.hold = { kind: 'ball', fid: h.fid, grade, r: grade === 'slop' ? 11 : grade === 'perfect' ? 10 : 8,
                      bx: G.mouse.x, by: G.mouse.y, from: { x: G.mouse.x, y: G.mouse.y }, born: this.t };
        return;
      }
      if (h.kind === 'ball') {
        this.hold = null;
        const c = this.cust;
        const mr = this.mouthRect();
        // straight into the intake
        if (c && c.st === 'order' && G.inRect(G.mouse.x, G.mouse.y, mr.x, mr.y, mr.w, mr.h)) {
          if (!this.build) this.build = { base: 'none', scoops: [], grades: [], coat: [], bits: [], sauceAmt: {}, topAmt: {} };
          this.build.scoops.push(h.fid); this.build.grades.push(h.grade);
          G.audio.sfx('plop'); G.shake(1.2, 0.1);
          G.floatText('FED', G.mouse.x, G.mouse.y - 12, P.lime);
          return;
        }
        const b = this.build;
        if (b && b.base !== 'none' && b.scoops.length < 3) {
          const seat = this.scoopSeat(b.scoops.length);
          if (G.dist(G.mouse.x, G.mouse.y, seat.x, seat.y) < 26) {
            b.scoops.push(h.fid); b.grades.push(h.grade); b.pop = 1;
            G.audio.sfx('plop'); G.shake(1, 0.08);
            const f = G.flavById(h.fid);
            G.spark(seat.x, seat.y, ['#fff', f.col], 8);
            G.floatText(f.name.split(' ')[0], seat.x, seat.y - 16, f.col);
            return;
          }
        }
        const f = G.flavById(h.fid);
        this.puff(G.mouse.x, G.mouse.y, f ? f.col : '#fff', 8);
        G.audio.sfx('splat');
        return;
      }
      this.hold = null;
      G.audio.loop('pour', false);
    },

    take(kind) {
      if (this.build && this.build.base !== 'none') { G.toast('BIN THAT ONE FIRST', P.warn); return; }
      this.build = { base: kind, scoops: [], grades: [], coat: [], bits: [], sauceAmt: {}, topAmt: {}, pop: 0 };
      G.audio.sfx('clack');
      if (G.state.tut < 4) G.clause && G.clause.tut(4);
    },
    puff(x, y, col, n) {
      for (let i = 0; i < (n || 6); i++)
        this.parts.push({ x, y, vx: G.rand(-40, 40), vy: G.rand(-60, -14), col: i % 3 ? col : '#fff',
                          t: 0, life: G.rand(0.25, 0.5), grav: 220 });
    },

    // ---------------- scoring ----------------
    canServe() {
      const c = this.cust;
      return !!(c && c.st === 'order' && this.build && this.build.scoops.length);
    },
    // how well the build answers the craving
    grade() {
      const c = this.cust, b = this.build;
      if (!c || !b || !b.scoops.length) return null;
      const o = c.order;
      let taste = 0, volt = 0, clean = 0;
      for (let i = 0; i < b.scoops.length; i++) {
        const f = G.flavById(b.scoops[i]);
        if (!f) continue;
        taste += G.match(f, c.bot);
        volt += f.volt || 0;
        clean += b.grades[i] === 'perfect' ? 1 : b.grades[i] === 'slop' ? -0.5 : 0.3;
      }
      const nb = b.scoops.length;
      return {
        taste: taste / nb,
        volt,
        clean: clean / nb,
        count: nb === o.n,
        base: b.base === o.base || (o.base === 'cone' && b.base === 'none'),
        sauce: !o.sauce || (b.sauceAmt[o.sauce] || 0) >= SAUCE_NEED,
        top: !o.top || (b.topAmt[o.top] || 0) >= TOP_NEED,
      };
    },
    // volt turns into tonight's faults, and into heat
    rollFaults(volt, bot) {
      const sys = G.sysById(bot.sys);
      const n = G.clamp(1 + Math.floor(volt / 4), 1, 4);
      const out = [];
      for (let i = 0; i < n; i++) out.push(G.pick(sys.faults).id);
      return out;
    },
    serve() {
      const c = this.cust, b = this.build;
      if (!c || !b) return;
      const gr = this.grade(), o = c.order;
      const bot = c.bot;
      let pay = Math.round((5 + 4 * b.scoops.length) * bot.pay);
      pay += Math.round(gr.taste * 9);
      pay += Math.round(gr.clean * 5);
      if (gr.count) pay += 3;
      if (gr.base) pay += 2;
      if (gr.sauce && o.sauce) pay += 4;
      if (gr.top && o.top) pay += 3;
      pay = Math.max(2, pay);
      let verdict = gr.taste > 0.35 && gr.count ? 'perfect' : gr.taste > -0.1 ? 'ok' : 'bad';
      if (verdict === 'perfect') G.state.today.perfect++;

      // the sabotage
      const volt = gr.volt;
      G.state.today.volt += volt;
      G.state.totVolt += volt;
      if (volt > 0) {
        G.state.today.jobs.push({ id: c.id, name: c.name, sys: bot.sys, volt,
                                  faults: this.rollFaults(volt, bot) });
        G.state.suspicion = G.clamp(G.state.suspicion + volt * 0.012 * (G.has('jammer') ? 0.6 : 1), 0, 1);
        if (G.hasAlly('a_tank')) G.state.suspicion = Math.min(G.state.suspicion, 0.7);
      }

      if (b.base === 'none') {
        c.st = 'eat';
        c.eat = { t: 0, build: b, pay, verdict, volt, bites: -1, left: 0.001 };
      } else {
        this.serving = { build: b, x: PLATE.x, y: PLATE.y - 24, t: 0, pay, verdict, volt };
        c.st = 'served';
      }
      this.build = null;
      this.drops.length = 0; this.bits.length = 0;
      G.audio.sfx('swish');
      if (G.state.tut < 6) G.clause && G.clause.tut(6);
    },

    // ---------------- update ----------------
    update(dt) {
      this.t += dt;
      const M = G.mouse;
      G.updateSteam(dt);
      if (Math.random() < dt * 1.1) G.puffSteam(G.irand(10, 310), 178);
      if (G.clause) G.clause.update(dt);

      // the cat
      const j = this.jar;
      if (j) {
        j.purr = Math.max(0, j.purr - dt * 0.7);
        j.cool = Math.max(0, j.cool - dt);
      }
      // flies, because this is still a back street
      for (const f of this.flies) {
        f.t += dt;
        f.a += Math.sin(f.t * 3.1) * dt * 4;
        f.x += Math.cos(f.a) * f.sp * dt;
        f.y += Math.sin(f.a * 1.4) * f.sp * 0.6 * dt;
        if (f.x < 6) f.x = 314; if (f.x > 314) f.x = 6;
        if (f.y < 24) f.y = 84; if (f.y > 86) f.y = 26;
      }

      // a disguise coming off holds the floor until it is done
      if (this.reveal) {
        const r = this.reveal;
        r.t += dt;
        for (const b of r.bits) {
          b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 260 * dt;
        }
        if (r.t > 0.35 && !r.snd) { r.snd = 1; G.audio.sfx('reveal'); }
        if (r.t > 4.2 || (r.skip && r.t > 0.8)) {
          this.reveal = null;
          if (this.cust) { this.cust.st = 'leave'; this.cust.open = 0; }
        }
        return;
      }

      if (!this.cust && this.left > 0 && !G.state.today.closed) {
        this.spawnT -= dt;
        if (this.spawnT <= 0) { this.spawn(); this.spawnT = 1.4; }
      }

      const c = this.cust;
      if (c) {
        c.t += dt;
        if (c.st === 'arrive') {
          c.slide = Math.max(0, c.slide - dt * 2.2);
          c.walk += dt;
          if (c.slide <= 0) {
            c.st = 'order';
            G.audio.sfx('order');
            if (G.state.tut < 2) G.clause && G.clause.tut(2);
          }
        }
        if (c.st === 'order') {
          c.wait += dt;
          c.open = 0.5 + Math.sin(this.t * 1.5) * 0.16;
          if (c.wait > PATIENCE * botPatience(c) * 0.74) c.mood = 'angry';
        }
        if (c.st === 'eat') {
          c.eat.t += dt;
          const ph = (c.eat.t * 3.2) % 1;
          c.open = 0.22 + 0.7 * Math.pow(Math.sin(ph * Math.PI), 0.55);
          c.eat.left = Math.max(0, 1 - c.eat.t / 1.7);
          if (Math.floor(c.eat.t * 3.2) !== c.eat.bites) {
            c.eat.bites = Math.floor(c.eat.t * 3.2);
            G.audio.sfx('chew');
            const f = G.flavById(c.eat.build.scoops[0]);
            for (let i = 0; i < 4; i++)
              this.parts.push({ x: CUST.x + G.rand(-8, 8), y: (this.bot ? this.bot.mouthY : 60) + 6,
                vx: G.rand(-24, 24), vy: G.rand(-40, -6), col: f ? f.col : '#fff', t: 0, life: 0.4, grav: 200 });
          }
          if (c.eat.t > 1.9) {
            const v = c.eat.verdict;
            if (v === 'perfect') { G.audio.sfx('perfect'); c.mood = 'happy'; G.floatText('+$' + c.eat.pay + ' PERFECT', CUST.x, 40, P.lime); }
            else if (v === 'ok') { G.audio.sfx('good'); c.mood = 'happy'; G.floatText('+$' + c.eat.pay, CUST.x, 40, P.hazard); }
            else { G.audio.sfx('bad'); c.mood = 'angry'; G.floatText('+$' + c.eat.pay + ' GRUDGING', CUST.x, 40, P.warn); }
            G.flyCoin(CUST.x, 50, c.eat.pay);
            G.state.today.dayEarn += c.eat.pay;
            G.state.today.served++;
            G.state.totBots++;
            if (c.dis && !c.spotted) {
              // you fed a person a scoop of iron filings and did not notice
              G.state.today.missed++;
              G.state.missed++;
              G.floatText('SOMETHING WAS WRONG', CUST.x, 30, P.magentaLt);
              c.st = 'leave'; c.open = 0;
            } else if (c.eat.volt > 0) {
              c.st = 'glitch'; c.gt = 0;
            } else { c.st = 'leave'; c.open = 0; }
          }
        }
        if (c.st === 'glitch') {
          // the additive lands: it seizes, sparks and staggers out
          c.gt += dt;
          c.mood = 'sick';
          c.open = 0.3 + Math.sin(c.gt * 22) * 0.3;
          if (Math.random() < dt * 14)
            G.spark(CUST.x + G.rand(-16, 16), (this.bot ? this.bot.torsoY : 70) + G.rand(0, 20),
              ['#ffffff', P.cyanLt, P.hazard], 3, 60);
          if (c.gt < 0.1) { G.audio.sfx('zap'); G.shake(3, 0.3); G.screenFlash(P.cyanLt, 0.1); }
          if (c.gt > 1.5) {
            G.floatText('MALFUNCTION', CUST.x, 34, P.magentaLt);
            c.st = 'leave'; c.open = 0;
          }
        }
        if (c.st === 'leave') {
          c.slide += dt * 1.8; c.walk += dt;
          if (c.slide > 1.2) { this.cust = null; this.bot = null; }
        }
      }

      if (this.serving) {
        const s = this.serving;
        s.t += dt * 1.6;
        const e = G.easeInOut(Math.min(1, s.t));
        s.x = G.lerp(PLATE.x, CUST.x, e);
        s.y = G.lerp(PLATE.y - 24, (this.bot ? this.bot.mouthY : 60) + 24, e) - Math.sin(Math.min(1, s.t) * Math.PI) * 22;
        if (s.t >= 1) {
          this.cust.st = 'eat';
          this.cust.eat = { t: 0, build: s.build, pay: s.pay, verdict: s.verdict, volt: s.volt, bites: -1, left: 1 };
          this.serving = null;
        }
      }

      // ---- the sweep ----
      const h = this.hold;
      if (h && h.kind === 'sweep' && M.down) {
        const r = pitRect(h.pi);
        const inside = G.inRect(M.x, M.y, r.x, r.y, r.w, r.h);
        const f = G.flavById(h.fid);
        if (inside) {
          const gx = G.clamp(Math.floor(((M.x - r.x) / r.w) * GX), 0, GX - 1);
          const gy = G.clamp(Math.floor(((M.y - r.y) / r.h) * GY), 0, GY - 1);
          const surf = this.surf[h.pi];
          const moved = Math.hypot(M.x - h.lastX, M.y - h.lastY);
          h.lastX = M.x; h.lastY = M.y;
          // the ladle is a round tool: press a disc of cells down
          let got = 0;
          const R = G.has('ladle') ? 2.4 : 1.9;
          for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
            const cxi = gx + i, cyi = gy + j;
            if (cxi < 0 || cxi >= GX || cyi < 0 || cyi >= GY) continue;
            const d = Math.hypot(i, j);
            if (d > R) continue;
            const k = cyi * GX + cxi;
            const bite = (1 - d / (R + 0.4)) * dt * 1.9;
            const before = surf[k];
            surf[k] = Math.min(1, surf[k] + bite);
            got += surf[k] - before;
          }
          // sweeping earns more than standing still: reward the drag
          const rate = 0.55 + Math.min(1, moved * 0.08) * 0.9;
          h.fill = Math.min(1.6, h.fill + got * rate * (G.has('ladle') ? 1.25 : 1));
          h.path.push({ x: M.x, y: M.y, t: 0 });
          if (h.path.length > 40) h.path.shift();
          h.tick += dt;
          if (h.tick > 0.055) {
            h.tick = 0;
            G.audio.sfx('carveTick', { f: Math.min(1, h.fill) });
            this.parts.push({ x: M.x + G.rand(-4, 4), y: M.y + G.rand(-3, 3), vx: G.rand(-22, 22),
              vy: G.rand(-42, -10), col: Math.random() < 0.5 ? f.col : G.shade(f.col, 0.35),
              t: 0, life: 0.3, grav: 210 });
          }
          G.audio.loop('carve', true, 0.3 + Math.min(1, h.fill) * 0.7);
        } else G.audio.loop('carve', false);
        for (const p of h.path) p.t += dt;
      } else if (h && h.kind === 'sweep') G.audio.loop('carve', false);

      if (h && h.kind === 'ball') {
        h.bx += (M.x - h.bx) * Math.min(1, dt * 20);
        h.by += (M.y - h.by) * Math.min(1, dt * 20);
        h.lift = Math.min(1, (this.t - h.born) * 3);
      }

      // ---- sauce + toppings ----
      let pouring = false;
      if (h && h.kind === 'sauce') {
        if (G.dist(M.x, M.y, h.gx, h.gy) > 6) {
          pouring = true;
          h.emit -= dt;
          if (h.emit <= 0 && this.drops.length < 60) {
            h.emit = 0.05;
            this.drops.push({ x: M.x, y: M.y + 4, vx: G.rand(-5, 5), vy: 26,
              col: G.sauceById(h.sid).col, sid: h.sid });
          }
        }
        G.audio.loop('pour', pouring, 0.85);
      }
      if (h && h.kind === 'jar') {
        const shake = Math.abs(M.vx) > 110;
        h.emit -= dt;
        if (G.dist(M.x, M.y, h.gx, h.gy) > 5 && h.emit <= 0 && this.bits.length < 55) {
          h.emit = shake ? 0.05 : 0.12;
          for (let i = 0; i < (shake ? 2 : 1); i++) {
            const tp = G.topById(h.tid);
            this.bits.push({ x: M.x + G.rand(-4, 4), y: M.y + 4,
              vx: G.rand(-18, 18) + G.clamp(M.vx * 0.1, -28, 28), vy: 10,
              col: G.topBitCol(h.tid), tid: h.tid, big: tp && tp.grit >= 3, t: 0 });
          }
          G.audio.sfx('grit');
        }
      }

      // ---- droplet + topping physics ----
      const b = this.build, c2 = this.cust;
      const br = this.botRect();
      for (let i = this.drops.length - 1; i >= 0; i--) {
        const d = this.drops[i];
        d.vy += 330 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
        let hit = false;
        if (b && b.base !== 'none') for (let si = b.scoops.length - 1; si >= 0 && !hit; si--) {
          const sp = this.scoopSeat(si);
          if (G.dist(d.x, d.y, sp.x, sp.y) <= sp.r + 1) {
            hit = true;
            b.coat.push({ lx: d.x - PLATE.x, ly: d.y - (PLATE.y - 4), col: d.col });
            if (b.coat.length > 400) b.coat.shift();
            b.sauceAmt[d.sid] = (b.sauceAmt[d.sid] || 0) + 1;
            this.drops.splice(i, 1);
          }
        }
        if (hit) continue;
        // on the machine itself
        if (c2 && c2.st === 'order' && G.inRect(d.x, d.y, br.x, br.y, br.w, br.h)) {
          c2.sauceOn++;
          c2.shellCoat = c2.shellCoat || [];
          c2.shellCoat.push({ x: d.x, y: d.y, col: d.col });
          if (c2.shellCoat.length > 200) c2.shellCoat.shift();
          this.drops.splice(i, 1); continue;
        }
        if (d.y > 150) { this.drops.splice(i, 1); }
      }
      for (let i = this.bits.length - 1; i >= 0; i--) {
        const p = this.bits[i];
        p.vy += 310 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.t += dt;
        let stuck = false;
        if (b && b.base !== 'none') for (let si = b.scoops.length - 1; si >= 0; si--) {
          const sp = this.scoopSeat(si);
          if (G.dist(p.x, p.y, sp.x, sp.y) <= sp.r + 1 && p.vy > 0) {
            b.bits.push({ lx: p.x - PLATE.x, ly: p.y - (PLATE.y - 4), col: p.col, big: p.big });
            if (b.bits.length > 120) b.bits.shift();
            b.topAmt[p.tid] = (b.topAmt[p.tid] || 0) + 1;
            stuck = true; break;
          }
        }
        if (stuck) { this.bits.splice(i, 1); continue; }
        if (c2 && c2.st === 'order' && G.inRect(p.x, p.y, br.x, br.y, br.w, br.h)) {
          c2.topOn++;
          c2.shellBits = c2.shellBits || [];
          c2.shellBits.push({ x: p.x, y: p.y, col: p.col });
          if (c2.shellBits.length > 140) c2.shellBits.shift();
          this.bits.splice(i, 1); continue;
        }
        if (p.y > 150 || p.t > 3) this.bits.splice(i, 1);
      }
      if (b && b.pop > 0) b.pop = Math.max(0, b.pop - dt * 3.4);
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i];
        p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.grav || 0) * dt;
        if (p.t > p.life) this.parts.splice(i, 1);
      }

      if (this.left === 0 && !this.cust && !this.serving) {
        if (!G.state.today.closed) {
          G.state.today.closed = true;
          G.audio.sfx('shutter');
          const met = G.goalMet();
          G.clause && G.clause.say(met ? 'QUOTA MET. THE BACK ROOM IS YOURS.'
            : 'SHORT TODAY. THE BACK ROOM IS STILL YOURS.', met ? P.lime : P.warn, 4);
          if (!met) G.state.suspicion = Math.min(1, G.state.suspicion + 0.06);
          G.save();
        }
        this.endT += dt;
      }
    },

    // ---------------- draw ----------------
    draw(g) {
      const t = this.t;
      G.toastCX = 70; G.toastY = 34;

      // ===== the street outside the window =====
      G.R(g, 0, 0, G.W, G.H, P.cityDk);
      G.cityWall(g, 0, 0, G.W, WORK_Y, t);
      G.conduit(g, 0, 2, G.W, false, P.cyan);
      G.hangSign(g, 226, 16, 16, 14, P.magenta, t, 0);
      G.hangSign(g, 246, 16, 14, 12, P.cyan, t, 2);

      // ---- the room it actually is: tiles, pipes, a fan, a notice ----
      // wall tiling behind the shelf, grouted on the fine grid
      for (let ty = 30; ty < WORK_Y - 4; ty += 8)
        for (let tx = 0; tx < 220; tx += 12) {
          const off = (ty / 8) % 2 ? 6 : 0;
          G.hair(g, tx + off, ty, 11.5, '#232a3a');
          G.vair(g, tx + off, ty, 7.5, '#1c2230');
          if (G.hash(tx, ty) > 0.88) G.grain(g, tx + off + 1, ty + 1, 10, 6, '#2e374a', 0.16, tx + ty);
        }
      // a run of pipe along the top of the tiles, with brackets and a drip
      G.Rh(g, 0, 30, 220, 2.5, '#3a4459');
      G.hair(g, 0, 30, 220, '#5b6a86');
      G.hair(g, 0, 32, 220, '#1c2230');
      for (let bx = 14; bx < 216; bx += 34) {
        G.Rh(g, bx, 29, 3, 5, '#2a3242');
        G.rivet(g, bx + 1, 31, '#12141c', '#6b7f96');
      }
      const drip = (t * 0.6) % 1;
      G.Rh(g, 148, 33 + drip * 18, 0.5, 1.5, '#5fbfd8');
      // extraction fan, turning - kept left, where the order tag never lands
      const fx = 26, fy = 54;
      G.R(g, fx - 12, fy - 12, 24, 24, '#151a26');
      G.bevel(g, fx - 12, fy - 12, 24, 24, '#2a3242', '#0b0e14');
      for (let k = 0; k < 4; k++) {
        const a = t * 3.4 + k * Math.PI / 2;
        for (let rr = 2; rr < 10; rr += 0.5)
          G.Rh(g, fx + Math.cos(a) * rr - 0.5, fy + Math.sin(a) * rr * 0.7 - 0.5, 1.5, 1, '#3f4a60');
      }
      G.fc(g, fx, fy, 2, '#6b7f96');
      for (let i = -1; i < 2; i++) { G.hair(g, fx - 11, fy + i * 7, 22, '#0f131c'); }
      // a first aid box and a fire bucket, behind where the machine stands
      G.plate(g, 226, 34, 20, 16, '#d8d0c0', { r: 1, band: 2, spec: false });
      G.R(g, 233, 38, 6, 2, '#c02020'); G.R(g, 235, 36, 2, 6, '#c02020');
      G.plate(g, 252, 38, 14, 12, '#8a2f42', { r: 2, band: 2 });
      G.Rh(g, 253, 40, 12, 2, '#5c2030');
      G.Rh(g, 258, 34, 2, 4, P.steel);
      // hanging cable with a bare bulb over the counter
      G.Rh(g, 76, 30, 0.5, 12, '#1a1f2c');
      G.fc(g, 76, 45, 3, '#ffe89a');
      G.fc(g, 76, 45, 1.5, '#ffffff');
      G.glow(g, 76, 46, 46, 34, '#ffd47a', 0.55);
      // grime in the corners
      G.grain(g, 0, WORK_Y - 14, 220, 12, '#0e1219', 0.1, 9);
      // the café's own sign, tucked left where nothing else lands
      const fl = (Math.sin(t * 13) > 0.94) ? 0.35 : 1;
      G.R(g, 8, 18, 96, 3, fl > 0.5 ? P.magentaLt : P.magentaDk);
      G.glow(g, 60, 30, 130, 56, P.magenta, 0.9 * fl);
      G.text(g, 'SCOOP  ·  24 HR', 10, 24, fl > 0.5 ? P.cyanLt : P.cyanDk, { out: OUT });

      // ===== the machine at the counter =====
      const c = this.reveal ? null : this.cust;
      if (c) {
        const sl = G.easeOut(G.clamp(1 - c.slide, 0, 1));
        const cx = CUST.x + Math.round((1 - sl) * 74);
        this.bot = G.drawBot(g, c.id, cx, CUST.y, CSCALE, {
          t, open: c.open, mood: c.mood, walk: c.walk,
          shellBits: c.shellBits, shellCoat: c.shellCoat,
          tell: (c.dis && !c.spotted && c.st !== 'arrive') ? c.tell : null,
        });
        // the UV lamp makes the wrongness faintly visible
        if (this.bot.tellRect && G.has('lamp')) {
          const r = this.bot.tellRect;
          g.globalAlpha = 0.28 + Math.sin(t * 3) * 0.12;
          G.oc(g, r.x + r.w / 2, r.y + r.h / 2, Math.max(r.w, r.h) / 2 + 2, '#b48ae0');
          g.globalAlpha = 1;
        }
        // what it says it wants, in a speech tag over its head
        if (c.st === 'order') this.speech(g, c, cx, this.bot);
        // eating: the cone comes up to the intake
        if (c.st === 'eat' && c.eat && c.eat.left > 0.04 && c.eat.build.base !== 'none') {
          const scp = c.eat.build.scoops;
          const ex = cx - Math.round(this.bot.hw * 0.5);
          const ey = this.bot.mouthY + 32 - Math.round(Math.sin(c.eat.t * 3.2 * Math.PI * 2) * 2);
          this.drawBuild(g, ex, ey, c.eat.build, c.eat.left);
        }
      }

      // ===== the back work shelf =====
      G.plate(g, -4, WORK_Y, 224, 10, P.plate, { r: 2, band: 3 });
      G.R(g, -4, WORK_Y + 1, 224, 1, P.cyanDk);
      // cone + cup stands
      G.plate(g, CONE_ST - 11, WORK_Y - 4, 22, 5, P.plateDk, { r: 1, band: 1 });
      G.cone(g, CONE_ST, WORK_Y - 4, { w: 14, h: 18 });
      G.plate(g, CUP_ST - 11, WORK_Y - 4, 22, 5, P.plateDk, { r: 1, band: 1 });
      G.cup(g, CUP_ST, WORK_Y - 4, { w: 16, h: 12 });
      // sauce bottles
      const sl2 = G.state.sauces;
      for (let i = 0; i < sl2.length; i++) {
        if (this.hold && this.hold.kind === 'sauce' && this.hold.sid === sl2[i]) continue;
        const s = G.sauceById(sl2[i]);
        G.plate(g, RACK_S + i * 14 - 6, WORK_Y - 20, 12, 20, s.col, { r: 1, band: 2 });
        G.R(g, RACK_S + i * 14 - 3, WORK_Y - 23, 6, 4, P.hull);
      }
      // topping jars
      const tl2 = G.state.tops;
      for (let i = 0; i < tl2.length; i++) {
        if (this.hold && this.hold.kind === 'jar' && this.hold.tid === tl2[i]) continue;
        const tp = G.topById(tl2[i]);
        G.plate(g, RACK_T + i * 14 - 6, WORK_Y - 20, 12, 20, P.plateDk2, { r: 1, band: 2 });
        for (let k = 0; k < 5; k++)
          G.R(g, RACK_T + i * 14 - 4 + (k % 3) * 3, WORK_Y - 15 + Math.floor(k / 3) * 4, 2, 2, G.topBitCol(tp.id));
        G.R(g, RACK_T + i * 14 - 6, WORK_Y - 22, 12, 3, P.hull);
      }
      G.text(g, 'SAUCE', RACK_S - 6, WORK_Y - 29, P.cyanLt, { out: OUT });
      G.text(g, 'TOPS', RACK_T - 6, WORK_Y - 29, P.cyanLt, { out: OUT });

      // the tip jar cat, sat between the cups and the sauces
      if (G.has('tipjar')) {
        G.plate(g, JAR_X - 12, WORK_Y - 4, 24, 5, P.plateDk, { r: 1, band: 1 });
        G.drawCatJar(g, JAR_X, WORK_Y - 4, 0.92, { t, purr: this.jar.purr, coins: this.jar.coins });
        if (this.jar.cool <= 0)
          G.text(g, 'PET', JAR_X, WORK_Y - 36, Math.sin(t * 4) > 0 ? P.hazard : P.cream,
            { align: 'center', sc: 0.5, out: OUT });
      }

      // ===== the pit deck, sunk in front =====
      G.plate(g, -4, DECK_Y, G.W + 8, DECK_H, P.plate, { r: 2, band: 4 });
      G.R(g, -4, DECK_Y + 1, G.W + 8, 1, P.cyanDk);
      for (let i = 0; i < 5; i++) {
        const r = pitRect(i);
        if (i >= this.n) { this.drawBlank(g, r, i); continue; }
        this.drawPit(g, i, r, t);
      }

      // the build on the plate
      G.plate(g, PLATE.x - 13, PLATE.y - 4, 26, 5, P.hullDk, { r: 1, band: 1 });
      if (this.build && this.build.base !== 'none') this.drawBuild(g, PLATE.x, PLATE.y - 4, this.build, 1);
      if (this.serving) this.drawBuild(g, this.serving.x, this.serving.y, this.serving.build, 1);
      // a seat marker while carrying a ball
      if (this.hold && this.hold.kind === 'ball' && this.build && this.build.base !== 'none' && this.build.scoops.length < 3) {
        const sp = this.scoopSeat(this.build.scoops.length);
        const near = G.dist(G.mouse.x, G.mouse.y, sp.x, sp.y) < 26;
        g.globalAlpha = 0.4 + Math.abs(Math.sin(t * 5)) * (near ? 0.6 : 0.2);
        for (let i = 0; i < 10; i += 2) {
          const a = (i / 10) * Math.PI * 2;
          G.R(g, sp.x + Math.cos(a) * sp.r, sp.y + Math.sin(a) * sp.r * 0.8, 2, 2, near ? P.lime : P.hullLt);
        }
        g.globalAlpha = 1;
      }

      for (const d of this.drops) G.R(g, d.x, d.y, 2, 2, d.col);
      for (const p of this.bits) { if (p.big) { G.R(g, p.x - 1, p.y - 1, 3, 3, OUT); G.R(g, p.x - 1, p.y - 1, 2, 2, p.col); } else G.R(g, p.x, p.y, 2, 2, p.col); }
      for (const p of this.parts) {
        g.globalAlpha = 1 - p.t / p.life; G.R(g, p.x, p.y, 2, 2, p.col); g.globalAlpha = 1;
      }
      G.drawSteam(g);

      // ---- the held tool ----
      this.drawHand(g, t);

      // ---- HUD ----
      this.hud(g);
      if (G.clause) { G.clause.at(297, 162, 166, 4, 284); G.clause.draw(g); }

      // ===== a disguise coming off, held on screen =====
      if (this.reveal) { this.drawReveal(g, t); G.grade(g, 1); return; }

      // ===== the shift is over: a card you can read, not a wall =====
      if (this.endT > 0) {
        const a = G.clamp(this.endT * 1.4, 0, 1);
        g.globalAlpha = a * 0.6;
        G.R(g, 0, 20, G.W, 128, '#05070c');
        g.globalAlpha = 1;
        const gl = G.state.today.goal, met = G.goalMet();
        G.plate(g, 60, 44, 200, 70, '#141a26',
          { r: 2, band: 2, lit: '#242c3e', dk: '#080b12', spec: false });
        G.R(g, 62, 46, 196, 1, met ? P.lime : P.magenta);
        G.text(g, 'SHUTTERS DOWN', 160, 52, P.magentaLt, { align: 'center', out: OUT });
        // the two lines of the day, scored
        G.text(g, 'SERVED', 72, 68, P.steel2, { sc: 0.5 });
        G.text(g, G.state.today.served + ' / ' + gl.quota, 248, 68,
          G.state.today.served >= gl.quota ? P.lime : P.magenta, { align: 'right', sc: 0.5 });
        G.text(g, 'TAKE', 72, 76, P.steel2, { sc: 0.5 });
        G.text(g, '$' + G.state.today.dayEarn + ' / $' + gl.take, 248, 76,
          G.state.today.dayEarn >= gl.take ? P.lime : P.magenta, { align: 'right', sc: 0.5 });
        G.text(g, 'TIPS', 72, 84, P.steel2, { sc: 0.5 });
        G.text(g, '$' + G.state.today.tips, 248, 84, P.hazard, { align: 'right', sc: 0.5 });
        G.text(g, 'RESCUED', 72, 92, P.steel2, { sc: 0.5 });
        G.text(g, '' + G.state.today.spotted, 248, 92, G.state.today.spotted ? P.lime : P.steel,
          { align: 'right', sc: 0.5 });
        if (G.state.today.missed) {
          G.text(g, 'LET THROUGH', 72, 100, P.magenta, { sc: 0.5 });
          G.text(g, '' + G.state.today.missed, 248, 100, P.magenta, { align: 'right', sc: 0.5 });
        }
        G.text(g, met ? 'QUOTA MET' : 'SHORT. THEY WILL NOTICE.', 160, 106,
          met ? P.lime : P.warn, { align: 'center', sc: 0.5 });
        if (this.endT > 0.7)
          G.text(g, 'BACK ROOM >', 160, 126, Math.sin(t * 4) > 0 ? P.violetLt : P.violet,
            { align: 'center', out: OUT });
      }
      G.grade(g, 1);
    },

    // ---- a pit, seen from above ----
    drawPit(g, i, r, t) {
      const pit = G.state.pits[i];
      const f = pit ? G.flavById(pit.fid) : null;
      // the well: a chrome rim with a hard inner shadow so it reads as sunk
      G.plate(g, r.x - 4, r.y - 4, r.w + 8, r.h + 8, P.hullDk, { r: 2, band: 2 });
      G.R(g, r.x - 3, r.y - 3, r.w + 6, 1, P.hullLt);
      G.R(g, r.x - 2, r.y - 2, r.w + 4, r.h + 4, '#0b0d14');
      G.R(g, r.x - 2, r.y - 2, r.w + 4, 2, '#05060a');
      G.R(g, r.x - 2, r.y - 2, 2, r.h + 4, '#05060a');
      if (!f || pit.qty <= 0) {
        G.R(g, r.x, r.y, r.w, r.h, '#14161f');
        for (let j = 0; j < r.h; j += 4) G.R(g, r.x, r.y + j, r.w, 1, '#1b1e29');
        G.text(g, 'EMPTY', r.x + r.w / 2, r.y + r.h / 2 - 3, '#4a5060', { align: 'center' });
        this.pitLabel(g, r, i, pit, f);
        return;
      }
      const surf = this.surf[i];
      const cw = r.w / GX, ch = r.h / GY;
      const c = f.col;
      const tone = [G.shade(c, 0.45), G.shade(c, 0.2), c, G.shade(c, -0.24), G.shade(c, -0.46), G.shade(c, -0.66)];
      // the flat surface, shaded by how deep it has been dug
      for (let gy = 0; gy < GY; gy++) {
        for (let gx = 0; gx < GX; gx++) {
          const d = surf[gy * GX + gx];
          // light comes from the top-left, so a furrow lights its far wall
          const dl = gx > 0 ? surf[gy * GX + gx - 1] : d;
          const du = gy > 0 ? surf[(gy - 1) * GX + gx] : d;
          const slope = (d - dl) + (d - du);
          let k = d < 0.06 ? 1 : d < 0.3 ? 2 : d < 0.6 ? 3 : d < 0.85 ? 4 : 5;
          if (slope < -0.12) k = Math.max(0, k - 2);
          else if (slope > 0.12) k = Math.min(5, k + 1);
          G.R(g, r.x + gx * cw, r.y + gy * ch, Math.ceil(cw), Math.ceil(ch), tone[k]);
        }
      }
      // churn swirls in the undug surface, so a full pit reads as ice cream
      for (let gy = 0; gy < GY; gy++) for (let gx = 0; gx < GX; gx++) {
        if (surf[gy * GX + gx] > 0.05) continue;
        const ph = Math.sin(gx * 0.9 + gy * 0.55 + i * 2.1);
        if (ph > 0.62) G.R(g, r.x + gx * cw, r.y + gy * ch, Math.ceil(cw), 1, tone[1]);
        else if (ph < -0.72) G.R(g, r.x + gx * cw, r.y + gy * ch, Math.ceil(cw), 1, tone[3]);
      }
      // a wet sheen along the top edge, and the shadow the rim casts in
      G.R(g, r.x, r.y, r.w, 1, G.shade(c, 0.62));
      g.globalAlpha = 0.35;
      G.R(g, r.x, r.y, r.w, 2, '#000000');
      G.R(g, r.x, r.y, 2, r.h, '#000000');
      g.globalAlpha = 1;
      if (f.fleck) for (let k = 0; k < 10; k++) {
        const fx = r.x + 2 + Math.round(G.hash(k * 3.3, i) * (r.w - 4));
        const fy = r.y + 2 + Math.round(G.hash(k * 7.1, i + 3) * (r.h - 4));
        const gxi = G.clamp(Math.floor(((fx - r.x) / r.w) * GX), 0, GX - 1);
        const gyi = G.clamp(Math.floor(((fy - r.y) / r.h) * GY), 0, GY - 1);
        if (surf[gyi * GX + gxi] < 0.5) G.R(g, fx, fy, 2, 2, f.fleck);
      }
      // the sweep path glows while you are cutting
      const h = this.hold;
      if (h && h.kind === 'sweep' && h.pi === i)
        for (const p of h.path) {
          const a = G.clamp(1 - p.t / 0.5, 0, 1);
          if (a <= 0) continue;
          g.globalAlpha = a * 0.5;
          G.R(g, p.x - 1, p.y - 1, 3, 3, G.shade(c, 0.7));
          g.globalAlpha = 1;
        }
      this.pitLabel(g, r, i, pit, f);
    },
    // name plate on the deck lip, battery tucked in the corner of the well
    pitLabel(g, r, i, pit, f) {
      const nm = f ? f.name.split(' ')[0].slice(0, 9) : 'EMPTY';
      G.R(g, r.x - 3, r.y + r.h + 2, r.w + 6, 9, '#0d1220');
      G.text(g, nm, r.x + r.w / 2, r.y + r.h + 3, f ? f.col : '#4a5060', { align: 'center' });
      const bx = r.x + 2, by = r.y + 2, bw = 18, bh = 7;
      G.R(g, bx - 1, by - 1, bw + 4, bh + 2, OUT);
      G.R(g, bx, by, bw, bh, '#12141c');
      G.R(g, bx + bw, by + 2, 2, bh - 4, P.hullDk);
      const frac = pit && pit.max ? G.clamp(pit.qty / pit.max, 0, 1) : 0;
      for (let k = 0; k < Math.round(frac * 5); k++)
        G.R(g, bx + 1 + k * 3.4, by + 1, 3, bh - 2, frac > 0.5 ? P.lime : frac > 0.22 ? P.hazard : P.magenta);
      const qty = '' + (pit ? pit.qty : 0);
      G.R(g, bx + bw + 4, by - 1, G.tw(qty) + 3, bh + 2, '#0d1220');
      G.text(g, qty, bx + bw + 6, by, P.cream);
    },
    drawBlank(g, r, i) {
      G.plate(g, r.x - 3, r.y - 3, r.w + 6, r.h + 6, P.plateDk2, { r: 2, band: 1, spec: false });
      for (let j = 0; j < r.h; j += 5) G.R(g, r.x, r.y + j, r.w, 2, '#181a24');
      G.text(g, 'PIT ' + (i + 1), r.x + r.w / 2, r.y + r.h / 2 - 8, '#3a4050', { align: 'center' });
      G.text(g, 'LOCKED', r.x + r.w / 2, r.y + r.h / 2 + 2, '#3a4050', { align: 'center' });
    },

    // ---- the cone or cup with its scoops ----
    drawBuild(g, ox, oy, b, left) {
      let top;
      if (b.base === 'cup') top = G.cup(g, ox, oy, { w: 20, h: 14 });
      else if (b.base === 'cone') top = G.cone(g, ox, oy, { w: 18, h: 24 });
      else top = oy;
      const keepN = left === undefined ? b.scoops.length : Math.ceil(b.scoops.length * left);
      let sy = top - 2;
      for (let i = 0; i < Math.min(keepN, b.scoops.length); i++) {
        const f = G.flavById(b.scoops[i]);
        if (!f) continue;
        const r = Math.max(4, 10 - i);
        G.gooScoop(g, ox, sy - Math.round(r * 0.72), r, f,
          { squash: b.pop && i === b.scoops.length - 1 ? b.pop * 0.3 : 0 });
        sy -= Math.round(r * 1.3);
      }
      for (const cc of b.coat) G.R(g, ox + cc.lx, oy + cc.ly, 2, 2, cc.col);
      for (const bt of b.bits) {
        if (bt.big) { G.R(g, ox + bt.lx - 1, oy + bt.ly - 1, 3, 3, OUT); G.R(g, ox + bt.lx - 1, oy + bt.ly - 1, 2, 2, bt.col); }
        else G.R(g, ox + bt.lx, oy + bt.ly, 2, 2, bt.col);
      }
    },

    // ---- the ladle, the jar, the ball on its strands ----
    drawHand(g, t) {
      const M = G.mouse, h = this.hold;
      if (!h || M.x < 0) return;
      const x = G.clamp(M.x, 4, G.W - 4), y = G.clamp(M.y, 18, 148);
      if (h.kind === 'sweep') {
        const f = G.flavById(h.fid);
        // a round ladle head with the gathered ice cream heaped in it
        const rr = G.has('ladle') ? 9 : 8;
        G.R(g, x + rr - 2, y - 16, 3, 18, P.hull);
        G.rr2(g, x - rr - 1, y - 5, rr * 2 + 2, rr + 6, OUT);
        G.rr2(g, x - rr, y - 4, rr * 2, rr + 4, P.hull);
        G.R(g, x - rr + 2, y - 3, rr * 2 - 4, 1, P.hullLt);
        if (h.fill > 0.06 && f) {
          const hr = Math.round(2 + Math.min(1.2, h.fill) * (rr - 1));
          G.gooScoop(g, x, y - 2 - Math.round(hr * 0.4), hr, f, { squash: 0.25 });
        }
        // the fill ring
        const fr = G.clamp(h.fill, 0, 1.4);
        const col = h.fill > SLOP ? P.magenta : h.fill >= PERFECT_LO ? P.lime : P.hazard;
        for (let i = 0; i < 16; i++) {
          if (i / 16 > fr / 1.4) break;
          const a = -Math.PI / 2 + (i / 16) * Math.PI * 2;
          G.R(g, x + Math.cos(a) * (rr + 5), y - 1 + Math.sin(a) * (rr + 5), 2, 2, col);
        }
        // the perfect window, marked on the ring
        for (const m of [PERFECT_LO, PERFECT_HI]) {
          const a = -Math.PI / 2 + (m / 1.4) * Math.PI * 2;
          G.R(g, x + Math.cos(a) * (rr + 8), y - 1 + Math.sin(a) * (rr + 8), 2, 2, P.lime);
        }
        G.hideCursor = true;
        return;
      }
      if (h.kind === 'ball') {
        const f = G.flavById(h.fid);
        if (f) {
          // strands still hanging back to where it came from
          if (h.lift < 1) {
            const a = 1 - h.lift;
            g.globalAlpha = a;
            G.gooStrand(g, h.from.x - 3, h.from.y, h.bx - 2, h.by + h.r, G.shade(f.col, -0.2), Math.max(1, Math.round(3 * a)));
            G.gooStrand(g, h.from.x + 3, h.from.y, h.bx + 2, h.by + h.r, G.shade(f.col, -0.3), Math.max(1, Math.round(2 * a)));
            g.globalAlpha = 1;
          }
          G.gooScoop(g, h.bx, h.by, h.r, f, {});
        }
        G.R(g, h.bx + 8, h.by - 14, 3, 16, P.hull);
        G.hideCursor = true;
        return;
      }
      if (h.kind === 'sauce') {
        const s = G.sauceById(h.sid);
        G.plate(g, x - 6, y - 20, 12, 20, s.col, { r: 1, band: 3 });
        G.R(g, x - 1, y, 2, 3, G.shade(s.col, -0.4));
      } else if (h.kind === 'jar') {
        G.plate(g, x - 6, y - 20, 12, 20, P.plateDk2, { r: 1, band: 2 });
        for (let k = 0; k < 5; k++) G.R(g, x - 4 + (k % 3) * 3, y - 15 + Math.floor(k / 3) * 4, 2, 2, G.topBitCol(h.tid));
        G.R(g, x - 5, y, 10, 2, P.hull);
      }
      G.hideCursor = true;
    },

    // ---- what the machine asks for ----
    speech(g, c, cx, bot) {
      const o = c.order;
      const bw = 104, bh = c.read ? 42 : 32;
      // it hangs on the wall beside the machine, never over it - the cast is
      // tall, wide and horned, and a tag over the head buried all of that
      const bx = G.clamp(cx - (bot.hw + 4) - bw, 110, 114);
      const by = 16;                          // under the HUD, over the bench labels
      G.plate(g, bx, by, bw, bh, '#e4dcc4', { r: 2, band: 2, lit: '#f4eeda', dk: '#b8ae94', spec: false });
      for (let i = 0; i < 6; i++) G.R(g, bx + bw, by + 11 + i, 6 - i, 1, i < 2 ? '#f4eeda' : '#e4dcc4');
      G.R(g, bx + bw, by + 17, 5, 1, '#0d1018');
      G.R(g, bx + 1, by + 1, bw - 2, 9, '#2a2f42');
      const cls = c.bot.name.replace(' UNIT', '');
      const nameplate = c.name + '  ' + cls;
      G.text(g, G.tw(nameplate) <= bw - 8 ? nameplate : c.name, bx + 3, by + 2, '#d8e4f0');
      // the craving, plus how many and in what
      const want = o.want.toUpperCase();
      G.text(g, 'WANTS ' + want, bx + 3, by + 13, '#3a3524');
      let sx = bx + 3;
      G.text(g, 'x' + o.n + ' ' + (o.base === 'cone' ? 'CONE' : 'CUP'), sx, by + 21, '#3a3524');
      sx += 44;
      if (o.sauce) { G.R(g, sx, by + 21, 6, 6, G.sauceById(o.sauce).col); sx += 9; }
      if (o.top) { for (let i = 0; i < 3; i++) G.R(g, sx + i * 3, by + 22 + (i % 2) * 2, 2, 2, G.topBitCol(o.top)); sx += 12; }
      // patience
      const pw = G.clamp(1 - c.wait / (PATIENCE * botPatience(c)), 0, 1);
      G.R(g, bx, by + bh, bw, 3, '#0d1220');
      G.R(g, bx, by + bh, Math.round(bw * pw), 3, pw > 0.5 ? '#3d9a4a' : pw > 0.22 ? P.hazard : P.magenta);
      // clause.ai's read, if you have paid for it - inside the tag, not under it
      if (c.read) {
        G.R(g, bx + 2, by + 30, bw - 4, 10, '#1a2a3a');
        G.text(g, 'HATES ' + (c.bot.hates === 'none' ? 'NOTHING' : c.bot.hates.toUpperCase()),
          bx + 5, by + 31, P.cyanLt);
      }
      // the current build's read-out, so you can judge the match
      const gr = this.grade();
      if (gr) {
        const m = gr.taste;
        const col = m > 0.35 ? P.lime : m > -0.1 ? P.hazard : P.magenta;
        G.R(g, bx + bw - 26, by + 12, 24, 8, '#1a1f2c');
        G.text(g, (m >= 0 ? '+' : '') + Math.round(m * 100) + '%', bx + bw - 24, by + 13, col);
      }
    },

    // ---- the shell comes off and somebody is standing there ----
    drawReveal(g, t) {
      const r = this.reveal;
      const e = G.clamp(r.t / 0.5, 0, 1);
      // pull focus: darken everything but the middle
      g.globalAlpha = 0.9 * e;
      G.R(g, 0, 0, G.W, G.H, '#05070c');
      g.globalAlpha = 1;
      // cinematic bars
      const bh = Math.round(20 * e);
      G.R(g, 0, 0, G.W, bh, '#04060a');
      G.R(g, 0, G.H - bh, G.W, bh, '#04060a');
      G.hair(g, 0, bh, G.W, '#1a2130');
      G.hair(g, 0, G.H - bh - 0.5, G.W, '#1a2130');
      // a warm pool of light on the floor
      G.glow(g, 160, 116, 150, 90, '#d97757', 0.5 * e);
      G.rr(g, 120, 138, 80, 6, '#12141c');

      // the shell in pieces
      for (const b of r.bits) {
        if (b.t > b.life) continue;
        g.globalAlpha = Math.max(0, 1 - b.t / b.life);
        G.Rh(g, b.x, b.y, b.r, b.r, b.col);
        g.globalAlpha = 1;
      }
      // whoever it is, rising into the light
      const rise = G.easeOut(G.clamp((r.t - 0.3) / 0.7, 0, 1));
      const sc = 1.35 + rise * 0.15;
      if (r.t > 0.24) G.drawCreature(g, r.kind, 160, 140, sc, { t, smile: r.t > 1.4 });
      // the name plate
      if (r.t > 0.9) {
        const a2 = G.clamp((r.t - 0.9) / 0.35, 0, 1);
        g.globalAlpha = a2;
        G.plate(g, 74, 26, 172, 26, '#141018',
          { r: 2, band: 2, lit: '#241a22', dk: '#0a070c', spec: false });
        G.R(g, 76, 28, 168, 1, '#d97757');
        G.text(g, r.name, 160, 31, '#f4eeda', { align: 'center' });
        G.text(g, r.kind.toUpperCase() + '  ·  RESCUED', 160, 41, '#d97757', { align: 'center', sc: 0.5 });
        g.globalAlpha = 1;
      }
      // what they say, and what they will do for you
      if (r.t > 1.5) {
        const a3 = G.clamp((r.t - 1.5) / 0.4, 0, 1);
        g.globalAlpha = a3;
        G.plate(g, 30, 146, 260, 26, '#0d1420',
          { r: 2, band: 1, lit: '#1a2836', dk: '#070a10', spec: false });
        G.R(g, 32, 148, 256, 1, P.cyanDk);
        G.text(g, r.line.slice(0, 46), 160, 151, P.cream, { align: 'center', sc: 0.5 });
        G.text(g, r.perk.desc.slice(0, 44), 160, 160, P.lime, { align: 'center', sc: 0.5 });
        G.text(g, '+$' + r.pay, 160, 167, P.hazard, { align: 'center', sc: 0.5 });
        g.globalAlpha = 1;
      }
      if (r.t > 2.6) G.text(g, 'TAP', 300, 166, Math.sin(t * 5) > 0 ? P.steel2 : '#2a3140',
        { align: 'right', sc: 0.5 });
    },

    hud(g) {
      const st = G.state;
      const gl = st.today.goal || { quota: 0, take: 0 };
      // ---- money ----
      G.plate(g, 2, 2, 52, 12, P.ink2, { r: 1, band: 1, spec: false });
      G.R(g, 6, 6, 4, 5, P.hazard);
      G.text(g, '$' + Math.round(st.moneyShown), 13, 4, P.hazard);
      G.bevel(g, 2, 2, 52, 12, '#2a3446', '#070a12');

      // ---- today's goal: a served counter and a take bar, both live ----
      const qOK = st.today.served >= gl.quota, tOK = st.today.dayEarn >= gl.take;
      G.plate(g, 58, 2, 128, 12, P.ink2, { r: 1, band: 1, spec: false });
      G.bevel(g, 58, 2, 128, 12, '#2a3446', '#070a12');
      G.text(g, 'D' + st.day + '  ' + G.chapterName(), 61, 3, P.steel2, { sc: 0.5 });
      // quota pips, on the second row beside the take bar
      for (let i = 0; i < gl.quota; i++) {
        const px = 61 + i * 5;
        const on = st.today.served > i;
        G.Rh(g, px, 8.5, 3.5, 3.5, on ? P.lime : '#20263a');
        G.bevel(g, px, 8.5, 3.5, 3.5, on ? '#b6ff9a' : '#2c3348', '#0b0e14');
      }
      G.text(g, st.today.served + '/' + gl.quota, 61 + gl.quota * 5 + 2, 8,
        qOK ? P.lime : P.steel2, { sc: 0.5 });
      if (st.today.closed) G.text(g, 'CLOSED', 183, 3, P.magentaLt, { sc: 0.5, align: 'right' });
      // take bar, with the figures beside it rather than over it
      const tf = G.clamp(st.today.dayEarn / Math.max(1, gl.take), 0, 1);
      const bx0 = 61 + gl.quota * 5 + 24;
      G.R(g, bx0, 9, 183 - bx0 - 34, 4, '#0d1220');
      G.R(g, bx0, 9, Math.round((183 - bx0 - 34) * tf), 4, tOK ? P.lime : P.hazard);
      G.hair(g, bx0, 9, Math.round((183 - bx0 - 34) * tf), tOK ? '#dfffcf' : '#ffd8a0');
      G.text(g, '$' + st.today.dayEarn + '/' + gl.take, 183, 8, tOK ? P.lime : P.steel2,
        { sc: 0.5, align: 'right' });

      // ---- heat ----
      G.plate(g, 190, 2, 62, 12, P.ink2, { r: 1, band: 1, spec: false });
      G.bevel(g, 190, 2, 62, 12, '#2a3446', '#070a12');
      G.text(g, 'HEAT', 193, 4, P.steel2, { sc: 0.5 });
      G.R(g, 193, 9, 56, 3, '#0d1220');
      G.R(g, 193, 9, Math.round(56 * st.suspicion), 3,
        st.suspicion > 0.66 ? P.magenta : st.suspicion > 0.33 ? P.hazard : P.lime);
      G.text(g, Math.round(st.suspicion * 100) + '%', 249, 4,
        st.suspicion > 0.66 ? P.magenta : P.steel2, { sc: 0.5, align: 'right' });
      // ---- crew count, so the rescues feel like a tally ----
      G.plate(g, 256, 2, 46, 12, P.ink2, { r: 1, band: 1, spec: false });
      G.bevel(g, 256, 2, 46, 12, '#2a3446', '#070a12');
      G.text(g, 'CREW ' + (st.crew || []).length, 259, 3, P.violetLt, { sc: 0.5 });
      G.text(g, '+' + st.spotted, 259, 9, P.lime, { sc: 0.5 });
      G.text(g, '-' + st.missed, 299, 9, st.missed ? P.magenta : '#46506b',
        { sc: 0.5, align: 'right' });

      // tray
      G.R(g, 0, 150, G.W, 30, '#0c0d16');
      G.R(g, 0, 150, G.W, 1, P.cyanDk);
      G.drawBtn(g, 4, 152, 40, 16, st.today.closed ? 'BACK >' : 'LAB',
        { col: st.today.closed ? '#2f8a48' : '#2a2434' });
      // four things you can ask clause for, then serve and bin
      const tier = G.tierIdx(), calls = G.state.calls > 0;
      const ask = (bx, lab, need) => G.drawBtn(g, bx, 152, 34, 16, lab,
        { col: tier >= need && calls ? '#2a5c6b' : '#20242e' });
      ask(48, 'READ', 1); ask(86, 'PICK', 2); ask(124, 'SPOT', 1); ask(162, 'TREND', 2);
      const cs = this.canServe();
      G.drawBtn(g, 200, 152, 44, 16, 'SERVE', { col: cs ? '#2f8a48' : '#20242e' });
      G.drawBtn(g, 248, 152, 30, 16, 'BIN', { col: '#5c2030' });
      G.text(g, 'CALLS ' + G.state.calls, 6, 170, P.steel, { sc: 0.5 });
      const h = this.hold;
      if (h && h.kind === 'sweep')
        G.text(g, h.fill > SLOP ? 'TOO MUCH - BIN IT' : h.fill >= PERFECT_LO ? 'LET GO NOW' : 'KEEP SWEEPING',
          100, 170, h.fill > SLOP ? P.magenta : h.fill >= PERFECT_LO ? P.lime : P.hazard, { sc: 0.5 });
      else if (!(G.clause && G.clause.msg))
        G.text(g, st.today.closed ? 'SHIFT OVER - GO THROUGH THE BACK'
          : 'PRESS A PIT AND SWEEP', 48, 170, '#46506b', { sc: 0.5 });
    },
  };

  function botPatience(c) { return c.bot ? c.bot.patience : 1; }
})();

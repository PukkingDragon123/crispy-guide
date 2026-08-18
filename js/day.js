// ============================================================
// DOUBLE LIFE - day.js
// The ice cream parlor. Animal kids queue up and order; you
// hold a tub to scoop, drag the scoop onto a cone/cup, squeeze
// real-physics sauce that drips down the scoops, and shake
// toppings that bounce and stick. Sweetness causes cavities...
// which is tonight's business.
// ============================================================
(function () {
  const G = window.GAME;
  const OUT = G.OUT;

  // layout
  const TUB_W = 34, TUB_GAP = 2, TUB_Y = 150, TUB_X0 = 60;
  const PLX = 225, PLY = 256;          // assembly plate anchor (base tip)
  const COUNTER_Y = 148, WORK_Y = 196;
  const QUEUE_X = [240, 292, 344, 396], QUEUE_Y = 154;
  const SAUCE_NEED = 22, TOP_NEED = 8;
  const TRASH = { x: 14, y: 224, w: 30, h: 34 };
  const STAND = { cone: { x: 66, y: 252 }, cup: { x: 104, y: 252 } };
  const RACK_S = { x: 292, y: 210, w: 92, h: 52 };   // sauce rack
  const RACK_T = { x: 390, y: 202, w: 84, h: 62 };   // topping rack

  function tubRect(i) { return { x: TUB_X0 + i * (TUB_W + TUB_GAP), y: TUB_Y, w: TUB_W, h: 26 }; }

  const day = (G.scenes = G.scenes || {}).day = {
    enter() {
      G.newDayStats();
      this.t = 0;
      this.build = null;
      this.hold = null;
      this.drops = [];      // sauce droplets
      this.fbits = [];      // falling topping bits
      this.balls = [];      // dropped scoop balls (physics)
      this.parts = [];      // crumbs/puffs
      this.splats = [];     // counter decals
      this.counterBits = []; // rested topping bits
      this.flybacks = [];
      this.serving = null;
      this.dents = {};
      this.endT = 0;
      this.spawnT = 1.2;
      this.custs = [];
      this.totalKids = Math.min(4 + G.state.day, 9);
      this.remaining = this.totalKids;
      // species bag: shuffle, repeat
      const bag = [];
      while (bag.length < this.totalKids) {
        const shuffled = G.DATA.animals.map(a => a.id).sort(() => Math.random() - 0.5);
        for (const id of shuffled) if (bag.length < this.totalKids) bag.push(id);
      }
      this.bag = bag;
      G.audio.music('day');
      if (!G.state.tut.day) { G.toast('WELCOME TO YOUR SWEET LITTLE SHOP!', '#ffd94a'); }
    },

    // ---------- customers ----------
    genOrder() {
      const d = G.state.day;
      const maxScoops = Math.min(3, 1 + Math.ceil(d / 2));
      const n = G.irand(1, maxScoops);
      const scoops = [];
      for (let i = 0; i < n; i++) scoops.push(G.pick(G.state.flavors));
      const sauce = Math.random() < 0.35 + d * 0.06 ? G.pick(G.state.sauces) : null;
      const top = Math.random() < 0.35 + d * 0.06 ? G.pick(G.state.tops) : null;
      return { base: Math.random() < 0.7 ? 'cone' : 'cup', scoops, sauce, top };
    },
    spawnCust() {
      const sp = this.bag[this.totalKids - this.remaining];
      const a = G.animalById(sp);
      this.remaining--;
      let slot = 0;
      for (const c of this.custs) if (c.slot < 90) slot = Math.max(slot, c.slot + 1);
      this.custs.push({
        sp, name: G.pick(a.names),
        order: this.genOrder(),
        x: 504, y: QUEUE_Y, slot,
        state: 'enter', t: 0, waitT: 0, mood: 'ok', eat: null,
      });
      G.audio.sfx('dingdong');
    },
    front() { return this.custs.find(c => c.slot === 0 && (c.state === 'queue' || c.state === 'ordering')); },

    // ---------- build helpers ----------
    scoopPos(i, ox, oy, base) {
      ox = ox === undefined ? PLX : ox; oy = oy === undefined ? PLY : oy;
      base = base || (this.build && this.build.base) || 'cone';
      const rimY = base === 'cup' ? oy - 14 : oy - 21;
      const r = 11 - i;
      let cy = rimY - 8;
      for (let k = 1; k <= i; k++) cy -= (11 - k) + 3;
      return { x: ox, y: cy, r };
    },
    nextScoopPos() { return this.scoopPos(this.build.scoops.length); },

    paintCoat(x, y, r, col, sid) {
      const b = this.build; if (!b) return;
      b.coat.push({ lx: x - PLX, ly: y - PLY, r, col });
      if (b.coat.length > 1500) b.coat.shift();
      b.sauceAmt[sid] = (b.sauceAmt[sid] || 0) + 1;
    },

    coneHalfW(y) { // outer half width of the cone at height y (tip at PLY)
      const h = 21, top = PLY - h;
      if (y < top || y > PLY) return -1;
      return Math.max(1, 9 * (PLY - y) / h);
    },

    // ---------- order check ----------
    checkParts() {
      const b = this.build, c = this.front();
      if (!b || !c) return null;
      const o = c.order;
      const cnt = {};
      for (const f of b.scoops) cnt[f] = (cnt[f] || 0) + 1;
      const need = {};
      for (const f of o.scoops) need[f] = (need[f] || 0) + 1;
      let scoopsOk = b.scoops.length === o.scoops.length;
      for (const f in need) if ((cnt[f] || 0) !== need[f]) scoopsOk = false;
      for (const f in cnt) if (!need[f]) scoopsOk = false;
      return {
        base: b.base === o.base,
        scoops: scoopsOk,
        sauce: !o.sauce || (b.sauceAmt[o.sauce] || 0) >= SAUCE_NEED,
        top: !o.top || (b.topAmt[o.top] || 0) >= TOP_NEED,
      };
    },

    serve() {
      const c = this.front(); if (!c || !this.build || !this.build.scoops.length) return;
      const chk = this.checkParts();
      const o = c.order;
      let price = 3 + 2 * o.scoops.length + (o.sauce ? 3 : 0) + (o.top ? 2 : 0);
      let verdict;
      if (chk.base && chk.scoops && chk.sauce && chk.top) {
        verdict = 'perfect';
        price += c.waitT < 14 ? 3 : c.waitT < 26 ? 2 : 1;
        G.state.today.perfect++;
      } else if (chk.scoops) { verdict = 'ok'; price = Math.ceil(price * 0.7); }
      else { verdict = 'meh'; price = Math.ceil(price * 0.45); }
      // sweetness -> tonight's cavities
      const b = this.build;
      let sauceTot = 0; for (const k in b.sauceAmt) sauceTot += b.sauceAmt[k];
      let topTot = 0; for (const k in b.topAmt) topTot += b.topAmt[k];
      const sweet = b.scoops.length * 2 + Math.min(6, Math.round(sauceTot / SAUCE_NEED * 3)) +
                    Math.min(4, Math.round(topTot / TOP_NEED * 2)) + (b.base === 'cone' ? 1 : 0);
      const extraSweet = sauceTot > SAUCE_NEED * 1.8 || topTot > TOP_NEED * 1.8;
      if (extraSweet && verdict !== 'meh') { price += 1; G.floatText('SO SWEET!', c.x, c.y - 44, '#ff8ade'); }
      const cav = G.clamp(Math.round(sweet / 4), sweet >= 6 ? 1 : 0, 3);
      const plaque = G.clamp(2 + Math.floor(sweet / 3), 2, 6);
      const bits = G.clamp(Math.floor(topTot / 5) + (b.topAmt.cookie || b.topAmt.chip ? 1 : 0), 0, 4);
      G.state.today.patients.push({ sp: c.sp, name: c.name, cav, plaque, bits, sweet });
      G.state.today.cavCaused += cav;
      G.state.totCavCaused += cav;
      // launch flight
      this.serving = { build: b, x: PLX, y: PLY, t: 0, cust: c, price, verdict, sweet };
      this.build = null;
      this.drops.length = 0; this.fbits.length = 0;
      c.state = 'served';
      G.audio.sfx('swish');
    },

    finishServe() {
      const s = this.serving; const c = s.cust;
      c.state = 'eating'; c.eat = { t: 0, build: s.build, price: s.price, verdict: s.verdict };
      this.serving = null;
      G.audio.sfx('nom');
    },

    // ---------- input ----------
    onDown(x, y) {
      if (this.endT > 0) return;
      // serve button
      const c = this.front();
      if (c && this.build && this.build.scoops.length && G.inRect(x, y, PLX - 90, 210, 52, 17)) { G.audio.sfx('click'); this.serve(); return; }
      // trash
      if (G.inRect(x, y, TRASH.x - 3, TRASH.y - 6, TRASH.w + 6, TRASH.h + 8)) {
        if (this.build) { this.trashWob = 1; G.audio.sfx('splat'); G.spark(TRASH.x + 15, TRASH.y + 6, ['#cdd6e0', '#fff'], 8); this.build = null; }
        return;
      }
      // base stands
      for (const kind of ['cone', 'cup']) {
        const s = STAND[kind];
        if (G.inRect(x, y, s.x - 15, s.y - 34, 30, 40)) {
          if (!this.build) {
            this.build = { base: kind, scoops: [], coat: [], bits: [], sauceAmt: {}, topAmt: {}, wob: 0, wobV: 0, born: this.t };
            G.audio.sfx('scoopPop'); G.spark(PLX, PLY - 12, '#fff', 6);
            G.state.tut.base = 1;
          } else G.toast('TRASH THE OLD ONE FIRST!', '#ffb0b0');
          return;
        }
      }
      // tubs -> start scooping
      for (let i = 0; i < G.DATA.flavors.length; i++) {
        const r = tubRect(i);
        if (G.inRect(x, y, r.x, r.y, r.w, r.h)) {
          const f = G.DATA.flavors[i];
          if (!G.owned('flavors', f.id)) { G.toast('LOCKED! BUY IT IN THE SHOP', '#ffb0b0'); G.audio.sfx('denied'); return; }
          this.hold = { kind: 'scoop', fid: f.id, tub: i, fill: 0, bx: x, by: y, tick: 0 };
          G.audio.sfx('grab');
          return;
        }
      }
      // sauce bottles
      const sList = G.state.sauces;
      for (let i = 0; i < sList.length; i++) {
        const bx = RACK_S.x + 14 + i * 22, by = RACK_S.y + 44;
        if (G.inRect(x, y, bx - 8, by - 26, 16, 30)) {
          this.hold = { kind: 'sauce', sid: sList[i], homeX: bx, homeY: by, grabX: x, grabY: y, emitT: 0 };
          G.audio.sfx('grab'); return;
        }
      }
      // topping jars
      const tList = G.state.tops;
      for (let i = 0; i < tList.length; i++) {
        const bx = RACK_T.x + 16 + (i % 3) * 26, by = RACK_T.y + 26 + Math.floor(i / 3) * 30;
        if (G.inRect(x, y, bx - 8, by - 20, 16, 24)) {
          this.hold = { kind: 'jar', tid: tList[i], homeX: bx, homeY: by, grabX: x, grabY: y, emitT: 0 };
          G.audio.sfx('grab'); return;
        }
      }
    },

    onUp(x, y) {
      const h = this.hold; if (!h) return;
      this.hold = null;
      if (h.kind === 'scoop') { G.audio.sfx('crumble'); this.puff(x, y, G.flavorById(h.fid).col); return; }
      if (h.kind === 'ball') {
        // trash?
        if (G.inRect(x, y, TRASH.x - 3, TRASH.y - 6, TRASH.w + 6, TRASH.h + 8)) {
          this.trashWob = 1; G.audio.sfx('splat'); this.puff(TRASH.x + 15, TRASH.y + 4, G.flavorById(h.fid).col); return;
        }
        const b = this.build;
        if (b) {
          const np = this.nextScoopPos();
          if (b.scoops.length < 3 && G.dist(x, y, np.x, np.y) < 20) {
            b.scoops.push(h.fid);
            b.wobV = 3.2;
            this.dents[h.tub] = (this.dents[h.tub] || 0) + 1;
            G.audio.sfx('plop');
            G.spark(np.x, np.y - np.r, ['#fff', G.flavorById(h.fid).col], 10);
            G.state.tut.scoop = 1;
            return;
          }
          if (b.scoops.length >= 3) G.toast('FULL! SERVE IT!', '#ffd94a');
        }
        // dropped: real fall
        this.balls.push({ x, y, vx: G.clamp(G.mouse.vx * 0.25, -60, 60), vy: -20, fid: h.fid });
        return;
      }
      // sauce / jar go home
      this.flybacks.push({ kind: h.kind, id: h.sid || h.tid, x, y, hx: h.homeX, hy: h.homeY, t: 0 });
      G.audio.sfx('back');
      G.audio.loop('pour', false);
    },

    puff(x, y, col) {
      for (let i = 0; i < 8; i++) this.parts.push({ x, y, vx: G.rand(-40, 40), vy: G.rand(-60, -10), col: i % 2 ? col : '#fff', t: 0, life: G.rand(0.3, 0.6), grav: 200 });
    },

    // ---------- update ----------
    update(dt) {
      this.t += dt;
      const M = G.mouse;
      if (this.trashWob > 0) this.trashWob -= dt * 3;

      // spawn customers
      const queueCount = this.custs.filter(c => c.state === 'enter' || c.state === 'queue' || c.state === 'ordering').length;
      if (this.remaining > 0 && queueCount < Math.min(4, this.totalKids)) {
        this.spawnT -= dt;
        if (this.spawnT <= 0) { this.spawnCust(); this.spawnT = G.rand(2.5, 5); }
      }

      // customers
      for (const c of this.custs) {
        c.t += dt;
        if (c.state === 'enter' || c.state === 'queue') {
          const tx = QUEUE_X[Math.min(c.slot, 3)];
          if (c.x > tx + 1) { c.x -= 46 * dt; c.walk = true; }
          else { c.x = tx; c.walk = false; c.state = c.slot === 0 ? 'ordering' : 'queue'; }
        }
        if (c.state === 'ordering') {
          c.waitT += dt;
          if (!G.state.tut.order) { G.state.tut.order = 1; G.toast('MAKE WHAT THE BUBBLE SHOWS!', '#ffd94a'); }
        }
        if (c.state === 'eating') {
          c.eat.t += dt;
          if (c.eat.t > 1.25) {
            const v = c.eat.verdict;
            if (v === 'perfect') { G.audio.sfx('perfect'); G.floatText('PERFECT! +$' + c.eat.price, c.x, c.y - 48, '#7bE98a'); c.mood = 'happy'; }
            else if (v === 'ok') { G.audio.sfx('yay'); G.floatText('+$' + c.eat.price, c.x, c.y - 48, '#ffe66e'); c.mood = 'happy'; }
            else { G.audio.sfx('sad'); G.floatText('HMM... +$' + c.eat.price, c.x, c.y - 48, '#ffb0b0'); c.mood = 'sad'; }
            G.flyCoin(c.x, c.y - 30, c.eat.price);
            G.state.today.dayEarn += c.eat.price;
            G.state.today.kidsServed++;
            G.state.totKids++;
            // cavity forecast pop
            const p = G.state.today.patients[G.state.today.patients.length - 1];
            if (p && p.cav > 0) { G.floatText('+' + p.cav + ' CAVITY!', c.x, c.y - 58, '#c9a3ff'); }
            c.state = 'leaving'; c.eat = null;
            for (const o of this.custs) if (o.slot > c.slot) o.slot--;
            c.slot = 99;
          }
        }
        if (c.state === 'leaving') { c.x += 52 * dt; c.walk = true; }
      }
      this.custs = this.custs.filter(c => c.x < 520);

      // serving flight
      if (this.serving) {
        const s = this.serving;
        s.t += dt * 1.8;
        const e = G.easeInOut(Math.min(1, s.t));
        s.x = G.lerp(PLX, s.cust.x, e);
        s.y = G.lerp(PLY, s.cust.y - 6, e) - Math.sin(Math.min(1, s.t) * Math.PI) * 34;
        if (s.t >= 1) this.finishServe();
      }

      // ----- held things -----
      const h = this.hold;
      let pouring = false;
      if (h) {
        if (h.kind === 'scoop') {
          const r = tubRect(h.tub);
          if (!G.inRect(M.x, M.y, r.x - 2, r.y - 2, r.w + 4, r.h + 4)) {
            G.audio.sfx('crumble'); this.puff(M.x, M.y, G.flavorById(h.fid).col); this.hold = null;
          } else {
            h.fill += dt * (G.hasUp('goldscoop') ? 2.3 : 1.2);
            h.tick += dt;
            if (h.tick > 0.09) { h.tick = 0; G.audio.sfx('scoopTick', { f: h.fill }); this.parts.push({ x: M.x + G.rand(-8, 8), y: r.y + 8, vx: G.rand(-20, 20), vy: G.rand(-50, -20), col: G.shade(G.flavorById(h.fid).col, -0.1), t: 0, life: 0.4, grav: 240 }); }
            if (h.fill >= 1) { h.kind = 'ball'; h.bx = M.x; h.by = M.y; G.audio.sfx('scoopPop'); G.spark(M.x, M.y, '#fff', 6); if (!G.state.tut.drag) { G.state.tut.drag = 1; G.toast('DRAG IT ONTO THE CONE!', '#ffd94a'); } }
          }
        } else if (h.kind === 'ball') {
          h.bx += (M.x - h.bx) * Math.min(1, dt * 16);
          h.by += (M.y - h.by) * Math.min(1, dt * 16);
        } else if (h.kind === 'sauce') {
          const moved = G.dist(M.x, M.y, h.grabX, h.grabY) > 8;
          if (moved) {
            pouring = true;
            h.emitT -= dt;
            if (h.emitT <= 0 && this.drops.length < 130) {
              h.emitT = 0.05;
              const col = G.sauceById(h.sid).col;
              this.drops.push({ x: M.x + G.rand(-1.5, 1.5), y: M.y + 2, vx: G.rand(-6, 6), vy: 30, col, sid: h.sid, mode: 'fall' });
              if (!G.state.tut.sauce) { G.state.tut.sauce = 1; G.toast('DRIZZLE IT ALL OVER!', '#ffd94a'); }
            }
          }
          G.audio.loop('pour', pouring, 0.8);
        } else if (h.kind === 'jar') {
          const moved = G.dist(M.x, M.y, h.grabX, h.grabY) > 8;
          const shake = Math.abs(M.vx) > 170;
          h.emitT -= dt;
          if (moved && h.emitT <= 0 && this.fbits.length < 90) {
            const n = shake ? 3 : 1;
            h.emitT = shake ? 0.06 : 0.13;
            for (let i = 0; i < n; i++) this.spawnBit(h.tid, M.x + G.rand(-4, 4), M.y + 2, G.rand(-24, 24) + G.clamp(M.vx * 0.12, -40, 40));
            G.audio.sfx('sprinkle');
          }
        }
      } else G.audio.loop('pour', false);

      // ----- physics: sauce droplets -----
      const b = this.build;
      for (let i = this.drops.length - 1; i >= 0; i--) {
        const d = this.drops[i];
        if (d.mode === 'fall') {
          d.vy += 480 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
          if (b) {
            let hit = false;
            for (let si = b.scoops.length - 1; si >= 0 && !hit; si--) {
              const sp = this.scoopPos(si);
              const ds = G.dist(d.x, d.y, sp.x, sp.y);
              if (ds <= sp.r + 1) {
                hit = true;
                this.paintCoat(d.x, d.y, G.rand(1.5, 2.4), d.col, d.sid);
                if (Math.random() < 0.75) { d.mode = 'slide'; d.si = si; d.ang = Math.atan2(d.y - sp.y, d.x - sp.x); }
                else this.drops.splice(i, 1);
              }
            }
            if (!hit && b.base === 'cone') {
              const hw = this.coneHalfW(d.y);
              if (hw > 0 && Math.abs(d.x - PLX) <= hw) {
                this.paintCoat(d.x, d.y, 1.6, d.col, d.sid);
                d.mode = 'cone'; d.vy = 0;
                continue;
              }
            } else if (!hit && b.base === 'cup') {
              if (d.y >= PLY - 16 && d.y <= PLY - 12 && Math.abs(d.x - PLX) <= 11) {
                this.paintCoat(d.x, d.y, 1.8, d.col, d.sid);
                d.mode = 'cupwall'; d.vy = 0;
                continue;
              }
            }
            if (hit) continue;
          }
          if (d.y > PLY + 2 || d.y > 266) {
            this.addSplat(d.x, Math.min(d.y, 264), d.col);
            this.drops.splice(i, 1);
          }
        } else if (d.mode === 'slide') {
          if (!b || d.si >= b.scoops.length) { d.mode = 'fall'; continue; }
          const sp = this.scoopPos(d.si);
          const dir = G.angDiff(Math.PI / 2, d.ang) > 0 ? 1 : -1;
          d.ang += dir * (78 / sp.r) * dt;
          d.x = sp.x + Math.cos(d.ang) * (sp.r - 0.5);
          d.y = sp.y + Math.sin(d.ang) * (sp.r - 0.5);
          if (Math.random() < 0.85) this.paintCoat(d.x, d.y, G.rand(1.2, 2), d.col, d.sid);
          const rem = Math.abs(G.angDiff(Math.PI / 2, d.ang));
          if (rem < 0.18 || (rem < 1.1 && Math.random() < 0.05)) { d.mode = 'fall'; d.vy = 26; d.vx = Math.cos(d.ang) * 8; }
        } else if (d.mode === 'cone') {
          d.y += 42 * dt;
          const hw = this.coneHalfW(d.y);
          if (hw <= 0 || Math.abs(d.x - PLX) > hw) { d.mode = 'fall'; d.vy = 30; continue; }
          if (Math.random() < 0.8) this.paintCoat(d.x, d.y, 1.4, d.col, d.sid);
          if (d.y >= PLY - 2) { d.mode = 'fall'; d.vy = 20; }
        } else if (d.mode === 'cupwall') {
          d.y += 40 * dt;
          if (Math.random() < 0.8) this.paintCoat(d.x, d.y, 1.4, d.col, d.sid);
          if (d.y >= PLY - 3) { this.addSplat(d.x, PLY - 2, d.col); this.drops.splice(i, 1); }
        }
      }

      // ----- physics: topping bits -----
      for (let i = this.fbits.length - 1; i >= 0; i--) {
        const p = this.fbits[i];
        p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.t += dt;
        let stuck = false;
        if (b) {
          for (let si = b.scoops.length - 1; si >= 0; si--) {
            const sp = this.scoopPos(si);
            if (G.dist(p.x, p.y, sp.x, sp.y) <= sp.r + 0.5 && p.vy > 0) {
              if (Math.random() < 0.85) {
                b.bits.push({ lx: p.x - PLX, ly: p.y - PLY, col: p.col, shape: p.shape, tid: p.tid });
                if (b.bits.length > 260) b.bits.shift();
                b.topAmt[p.tid] = (b.topAmt[p.tid] || 0) + 1;
                G.audio.sfx('plip');
                stuck = true;
              } else { p.vy *= -0.4; p.vx += G.rand(-25, 25); }
              break;
            }
          }
          if (!stuck && b.base === 'cone' && p.vy > 0) {
            const hw = this.coneHalfW(p.y);
            if (hw > 0 && Math.abs(p.x - PLX) <= hw && Math.random() < 0.3) {
              b.bits.push({ lx: p.x - PLX, ly: p.y - PLY, col: p.col, shape: p.shape, tid: p.tid });
              b.topAmt[p.tid] = (b.topAmt[p.tid] || 0) + 1;
              stuck = true;
            }
          }
        }
        if (stuck) { this.fbits.splice(i, 1); continue; }
        if (p.y >= 258) {
          p.y = 258; p.vy *= -0.45; p.vx *= 0.7; p.bounces = (p.bounces || 0) + 1;
          if (p.bounces >= 2 || Math.abs(p.vy) < 18) {
            this.counterBits.push({ x: p.x, y: 258 + G.rand(0, 4), col: p.col, shape: p.shape, t: 0 });
            if (this.counterBits.length > 60) this.counterBits.shift();
            this.fbits.splice(i, 1);
          }
        }
        if (p.x < -5 || p.x > 485) this.fbits.splice(i, 1);
      }
      for (let i = this.counterBits.length - 1; i >= 0; i--) { this.counterBits[i].t += dt; if (this.counterBits[i].t > 4) this.counterBits.splice(i, 1); }

      // dropped scoop balls
      for (let i = this.balls.length - 1; i >= 0; i--) {
        const p = this.balls[i];
        p.vy += 460 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.y >= 254) {
          this.addSplat(p.x, 256, G.flavorById(p.fid).col, 6);
          this.puff(p.x, 252, G.flavorById(p.fid).col);
          G.audio.sfx('splat'); G.shake(1.5, 0.12);
          this.balls.splice(i, 1);
        }
      }

      // wobble spring on build
      if (b) { b.wobV += -b.wob * 60 * dt - b.wobV * 8 * dt; b.wob += b.wobV * dt; }

      // particles & decals
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i];
        p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.grav || 0) * dt;
        if (p.t > p.life) this.parts.splice(i, 1);
      }
      for (let i = this.splats.length - 1; i >= 0; i--) { this.splats[i].t += dt; if (this.splats[i].t > 7) this.splats.splice(i, 1); }
      for (let i = this.flybacks.length - 1; i >= 0; i--) {
        const f = this.flybacks[i]; f.t += dt * 4;
        if (f.t >= 1) this.flybacks.splice(i, 1);
      }

      // ----- end of day -----
      if (this.remaining === 0 && this.custs.length === 0 && !this.serving) {
        this.endT += dt;
        if (this.endT > 1.4) {
          G.audio.sfx('night');
          G.save();
          G.go('night', 'NIGHT ' + G.state.day + ' · DR MOLAR\'S CLINIC');
        }
      }
    },

    addSplat(x, y, col, r) {
      this.splats.push({ x, y, col, r: r || G.rand(2, 3.5), t: 0 });
      if (this.splats.length > 80) this.splats.shift();
    },

    // ---------- draw ----------
    draw(g) {
      const t = this.t;
      // wall
      G.R(g, 0, 0, 480, 86, '#ffe3ec');
      for (let x = 0; x < 480; x += 24) G.R(g, x, 0, 12, 86, '#ffd7e4');
      // window with sky
      const prog = G.clamp(1 - (this.remaining + this.custs.length) / this.totalKids, 0, 1);
      G.panel(g, 366, 12, 86, 56, prog > 0.75 ? '#ffb27f' : '#9fdcff', OUT);
      const sunX = 380 + prog * 58, sunY = 52 - Math.sin(prog * Math.PI) * 24;
      G.drawSun(g, sunX, sunY, 8, t);
      if (prog > 0.75) { g.globalAlpha = 0.35; G.R(g, 367, 13, 84, 54, '#ff7f6e'); g.globalAlpha = 1; }
      G.R(g, 366, 38, 86, 2, OUT); G.R(g, 406, 12, 2, 56, OUT);
      // menu board
      G.panel(g, 20, 12, 110, 54, '#5d4b70', OUT);
      G.text(g, "TODAY'S MENU", 75, 18, '#ffd94a', { align: 'center' });
      G.text(g, 'SCOOP...... $2', 30, 30, '#fff');
      G.text(g, 'SAUCE...... $3', 30, 40, '#ffc2d4');
      G.text(g, 'TOPPING.... $2', 30, 50, '#c9f0ff');
      // shelf with jars
      G.R(g, 160, 40, 180, 4, '#d99cb4');
      for (let i = 0; i < 5; i++) {
        const jx = 175 + i * 36;
        G.rr(g, jx, 26, 12, 14, ['#ffd4e4', '#c9f0ff', '#ffe9b0', '#d8f5d0', '#e8dcff'][i]);
        G.R(g, jx + 2, 24, 8, 3, '#8d97a5');
      }
      // awning
      for (let x = 0; x < 480; x += 30) {
        const c = (x / 30) % 2 === 0 ? '#ff8fb0' : '#fff6f9';
        G.R(g, x, 78, 30, 12, c);
        G.fe(g, x + 15, 90, 15, 4, c);
      }
      G.R(g, 0, 76, 480, 2, OUT);
      // floor
      for (let row = 0; row < 4; row++) {
        const ry = 94 + row * 14, rh = 14;
        for (let x = -1; x < 17; x++) {
          const even = (x + row) % 2 === 0;
          G.R(g, x * 30 + (row % 2) * 15, ry, 30, rh, even ? '#e8bfa0' : '#dfb190');
        }
        g.globalAlpha = 0.16 * (3 - row) / 3; G.R(g, 0, ry, 480, rh, '#241c2e'); g.globalAlpha = 1;
      }
      G.R(g, 0, 92, 480, 2, '#c99b7d');

      // customers (queue back first, front last)
      const sorted = [...this.custs].sort((a, b) => (b.slot === 99 ? -1 : b.slot) - (a.slot === 99 ? -1 : a.slot));
      for (const c of sorted) {
        G.drawAnimal(g, c.sp, c.x, c.y, c.t, { walk: c.walk, mood: c.mood });
        if (c.state === 'queue' && c.slot > 0) {
          g.globalAlpha = 0.7;
          G.text(g, '...', c.x, c.y - 42, '#fff', { align: 'center', out: OUT });
          g.globalAlpha = 1;
        }
        if (c.state === 'eating' && c.eat) {
          const sc = 1 - c.eat.t / 1.3;
          if (sc > 0.15) this.drawBuild(g, c.x, c.y - 8, c.eat.build, sc);
          if (Math.floor(c.eat.t * 6) % 2 === 0) this.puffOnce = 0;
        }
      }

      // counter + tubs
      G.R(g, 0, COUNTER_Y - 4, 480, 4, '#fff');
      G.R(g, 0, COUNTER_Y - 5, 480, 1, OUT);
      G.R(g, 0, COUNTER_Y, 480, 48, '#f7b7cd');
      G.R(g, 0, COUNTER_Y, 480, 3, '#ffd7e4');
      for (let i = 0; i < G.DATA.flavors.length; i++) {
        const r = tubRect(i), f = G.DATA.flavors[i];
        const locked = !G.owned('flavors', f.id);
        G.drawTub(g, r.x, r.y, r.w, f, { locked, dents: this.dents[i] || 0, isNew: G.state.newIds.includes(f.id), t });
      }
      // glass shine over tubs
      g.globalAlpha = 0.14; G.R(g, TUB_X0, TUB_Y - 6, G.DATA.flavors.length * 36 - 2, 7, '#fff'); g.globalAlpha = 1;
      // flavor tooltip on hover
      if (!this.hold && !G.mouse.touch) {
        for (let i = 0; i < G.DATA.flavors.length; i++) {
          const r = tubRect(i);
          if (G.inRect(G.mouse.x, G.mouse.y, r.x, r.y, r.w, r.h)) {
            const f = G.DATA.flavors[i];
            const locked = !G.owned('flavors', f.id);
            const label = locked ? f.name + ' · $' + f.price : f.name;
            const w = G.tw(label) + 10;
            const tx = G.clamp(r.x + r.w / 2 - w / 2, 2, 478 - w);
            G.panel(g, tx, r.y - 16, w, 13, '#3b2b40', OUT);
            G.text(g, label, tx + 5, r.y - 13, locked ? '#ffb0b0' : '#ffe66e');
            break;
          }
        }
      }

      // workspace
      G.R(g, 0, WORK_Y, 480, 74, '#fff0f5');
      G.R(g, 0, WORK_Y, 480, 2, OUT);
      G.R(g, 0, WORK_Y + 2, 480, 3, '#ffd7e4');
      // splats & counter bits
      for (const s of this.splats) {
        g.globalAlpha = G.clamp(1.2 - s.t / 7, 0.15, 0.8);
        G.fe(g, s.x, s.y, s.r + 1, s.r * 0.5, s.col);
        g.globalAlpha = 1;
      }
      for (const cb of this.counterBits) {
        g.globalAlpha = G.clamp(1 - cb.t / 4, 0, 1);
        this.drawBit(g, cb.x, cb.y, cb);
        g.globalAlpha = 1;
      }

      // trash
      const tw = this.trashWob > 0 ? Math.sin(this.t * 40) * 2 : 0;
      G.orr(g, TRASH.x + tw, TRASH.y + 4, TRASH.w, TRASH.h - 4, '#9aa7b5');
      G.R(g, TRASH.x + 3 + tw, TRASH.y + 8, 4, TRASH.h - 12, '#7f8b99');
      G.R(g, TRASH.x + 12 + tw, TRASH.y + 8, 4, TRASH.h - 12, '#7f8b99');
      G.R(g, TRASH.x + 21 + tw, TRASH.y + 8, 4, TRASH.h - 12, '#7f8b99');
      G.orr(g, TRASH.x - 2 + tw, TRASH.y, TRASH.w + 4, 5, '#b9c4d1');
      G.text(g, 'TRASH', TRASH.x + TRASH.w / 2, TRASH.y + TRASH.h + 4, '#c9a3b5', { align: 'center' });

      // base stands
      G.panel(g, STAND.cone.x - 16, 218, 68, 44, '#ffe9f1', OUT);
      G.text(g, 'BASES', STAND.cone.x + 18, 211, '#c9a3b5', { align: 'center' });
      G.drawBase(g, 'cone', STAND.cone.x, STAND.cone.y - 2);
      G.drawBase(g, 'cup', STAND.cup.x, STAND.cup.y - 2);
      if (!this.build) {
        const pulse = Math.sin(t * 5) > 0;
        if (pulse) G.text(g, '↑', STAND.cone.x + 18, 240, '#ff6e9c', { align: 'center', out: '#fff' });
      }

      // plate + build
      G.fe(g, PLX, PLY + 2, 22, 5, '#d8c2cc');
      G.fe(g, PLX, PLY + 1, 20, 4, '#fff');
      if (this.build) this.drawBuild(g, PLX, PLY, this.build, 1);
      // ghost ring for next scoop
      if (this.hold && this.hold.kind === 'ball' && this.build && this.build.scoops.length < 3) {
        const np = this.nextScoopPos();
        if (Math.sin(t * 8) > -0.3) { g.globalAlpha = 0.5; G.oc(g, np.x, np.y, np.r, '#fff'); g.globalAlpha = 1; }
      }

      // sauce rack
      G.panel(g, RACK_S.x, RACK_S.y, RACK_S.w, RACK_S.h, '#ffe9f1', OUT);
      G.text(g, 'SAUCE', RACK_S.x + RACK_S.w / 2, RACK_S.y - 8, '#c9a3b5', { align: 'center' });
      const sList = G.state.sauces;
      for (let i = 0; i < sList.length; i++) {
        const s = G.sauceById(sList[i]);
        const bx = RACK_S.x + 14 + i * 22, by = RACK_S.y + 44;
        const heldThis = this.hold && this.hold.kind === 'sauce' && this.hold.sid === s.id;
        const fb = this.flybacks.find(f => f.kind === 'sauce' && f.id === s.id);
        if (!heldThis && !fb) G.drawBottle(g, bx, by, s, false);
        else if (fb) G.drawBottle(g, G.lerp(fb.x, fb.hx, G.easeOut(fb.t)), G.lerp(fb.y, fb.hy, G.easeOut(fb.t)), s, false);
      }

      // topping rack
      G.panel(g, RACK_T.x, RACK_T.y, RACK_T.w, RACK_T.h, '#ffe9f1', OUT);
      G.text(g, 'TOPPINGS', RACK_T.x + RACK_T.w / 2, RACK_T.y - 8, '#c9a3b5', { align: 'center' });
      const tList = G.state.tops;
      for (let i = 0; i < tList.length; i++) {
        const tp = G.topById(tList[i]);
        const bx = RACK_T.x + 16 + (i % 3) * 26, by = RACK_T.y + 26 + Math.floor(i / 3) * 30;
        const heldThis = this.hold && this.hold.kind === 'jar' && this.hold.tid === tp.id;
        const fb = this.flybacks.find(f => f.kind === 'jar' && f.id === tp.id);
        if (!heldThis && !fb) G.drawJar(g, bx, by, tp, false);
        else if (fb) G.drawJar(g, G.lerp(fb.x, fb.hx, G.easeOut(fb.t)), G.lerp(fb.y, fb.hy, G.easeOut(fb.t)), tp, false);
      }

      // droplets & bits in flight
      for (const d of this.drops) { G.R(g, d.x - 1, d.y - 1, 2, 3, d.col); }
      for (const p of this.fbits) this.drawBit(g, p.x, p.y, p, Math.floor(p.t * 10) % 2);
      for (const p of this.balls) G.drawScoopBall(g, p.x, p.y, 8, p.fid, 0);
      for (const p of this.parts) {
        g.globalAlpha = 1 - p.t / p.life;
        G.R(g, p.x, p.y, 1.5, 1.5, p.col);
        g.globalAlpha = 1;
      }

      // serve button
      const c = this.front();
      if (c && this.build && this.build.scoops.length) {
        G.drawBtn(g, PLX - 90, 210, 52, 17, 'SERVE', { col: '#7bc96a' });
      }

      // order bubble
      if (c && c.state === 'ordering') this.drawBubble(g, c);

      // serving flight
      if (this.serving) this.drawBuild(g, this.serving.x, this.serving.y, this.serving.build, 1 - this.serving.t * 0.25);

      // held items on top
      const M = G.mouse, h = this.hold;
      if (h) {
        if (h.kind === 'scoop') G.drawScooper(g, M.x, M.y, h.fill, G.flavorById(h.fid));
        else if (h.kind === 'ball') { G.drawScoopBall(g, h.bx, h.by - 4, 8 + Math.sin(t * 10) * 0.5, h.fid, Math.sin(t * 12) * 0.06); G.drawScooper(g, h.bx + 4, h.by + 4, 0, null); }
        else if (h.kind === 'sauce') G.drawBottle(g, M.x, M.y, G.sauceById(h.sid), true, true);
        else if (h.kind === 'jar') G.drawJar(g, M.x, M.y, G.topById(h.tid), true);
      }

      // HUD
      this.drawHud(g);

      // day end curtain
      if (this.endT > 0) {
        g.globalAlpha = Math.min(0.5, this.endT * 0.5);
        G.R(g, 0, 0, 480, 270, '#2a1c3e');
        g.globalAlpha = 1;
        G.text(g, 'CLOSING TIME...', 240, 120, '#ffd94a', { align: 'center', out: OUT, sc: 2 });
        G.text(g, 'ALL THAT SUGAR... SOMEONE SHOULD CHECK THOSE TEETH', 240, 145, '#fff', { align: 'center', out: OUT });
      }
    },

    drawBit(g, x, y, p, alt) {
      if (p.shape === 'spr') { if (alt) G.R(g, x, y - 1, 1, 3, p.col); else G.R(g, x - 1, y, 3, 1, p.col); }
      else if (p.shape === 'big') { G.R(g, x - 1, y - 1, 3, 3, p.col); G.R(g, x - 1, y - 1, 1, 1, G.shade(p.col, 0.4)); }
      else G.R(g, x - 1, y - 1, 2, 2, p.col);
    },
    spawnBit(tid, x, y, vx) {
      const tp = G.topById(tid);
      const shape = tid === 'sprinkles' ? 'spr' : (tid === 'gummy' || tid === 'mallow') ? 'big' : 'sml';
      this.fbits.push({ x, y, vx, vy: 10, col: G.topBitCol(tid), tid, shape, t: 0 });
    },

    drawBuild(g, ox, oy, b, scale) {
      // scale only shrinks visually while flying/eating (approx by alpha+offset)
      if (scale < 1) { g.globalAlpha = G.clamp(scale + 0.2, 0, 1); }
      G.drawBase(g, b.base, ox, oy);
      for (let i = 0; i < b.scoops.length; i++) {
        const sp = this.scoopPos(i, ox, oy, b.base);
        const sq = i === b.scoops.length - 1 ? G.clamp(b.wob * 0.14, -0.3, 0.3) : 0;
        G.drawScoopBall(g, sp.x, sp.y, sp.r * (scale < 1 ? scale : 1), b.scoops[i], sq);
      }
      if (scale >= 1) {
        for (const cb of b.coat) G.fc(g, ox + cb.lx, oy + cb.ly, cb.r, cb.col);
        for (const bit of b.bits) this.drawBit(g, ox + bit.lx, oy + bit.ly, bit);
      }
      g.globalAlpha = 1;
    },

    drawBubble(g, c) {
      const o = c.order;
      const uniq = [];
      for (const f of o.scoops) { const u = uniq.find(x => x.id === f); if (u) u.n++; else uniq.push({ id: f, n: 1 }); }
      const rows = 1 + uniq.length + (o.sauce ? 1 : 0) + (o.top ? 1 : 0);
      const bw = 78, bh = 16 + rows * 9;
      let bx = Math.round(c.x - bw / 2), by = 118 - bh;
      bx = G.clamp(bx, 4, 476 - bw);
      G.panel(g, bx, by, bw, bh, '#fff', OUT);
      G.R(g, c.x - 3, 118, 6, 3, '#fff');
      G.R(g, c.x - 2, 121, 4, 2, '#fff');
      G.R(g, c.x - 1, 123, 2, 2, '#fff');
      // left: item icon
      G.drawOrderIcon(g, o, bx + 14, by + bh - 8);
      // right: checklist
      const chk = this.checkParts() || {};
      let ry = by + 6;
      const lx = bx + 30;
      const mark = (ok) => { if (ok) G.text(g, '✓', bx + bw - 9, ry, '#5fbf60'); };
      G.text(g, o.base === 'cone' ? 'CONE' : 'CUP', lx, ry, '#8d7b95'); mark(chk.base); ry += 9;
      for (const u of uniq) {
        const f = G.flavorById(u.id);
        G.R(g, lx, ry + 1, 5, 5, f.col); G.R(g, lx, ry + 1, 5, 1, G.shade(f.col, 0.3));
        G.text(g, '×' + u.n, lx + 8, ry, '#8d7b95');
        const have = (this.build ? this.build.scoops.filter(s => s === u.id).length : 0);
        if (this.build && have >= u.n && this.build.scoops.length <= o.scoops.length) mark(true);
        ry += 9;
      }
      if (o.sauce) {
        const s = G.sauceById(o.sauce);
        G.R(g, lx, ry + 2, 6, 2, s.col); G.R(g, lx + 1, ry + 4, 1, 2, s.col); G.R(g, lx + 4, ry + 4, 1, 2, s.col);
        G.text(g, 'SAUCE', lx + 9, ry, '#8d7b95');
        mark(chk.sauce && o.sauce); ry += 9;
      }
      if (o.top) {
        for (let i = 0; i < 3; i++) G.R(g, lx + i * 3, ry + 2 + (i % 2), 2, 2, G.topBitCol(o.top));
        G.text(g, 'TOPS', lx + 11, ry, '#8d7b95');
        mark(chk.top && o.top); ry += 9;
      }
      G.text(g, c.name, bx + bw / 2, by - 8, '#fff', { align: 'center', out: OUT });
    },

    drawHud(g) {
      // money
      G.panel(g, 4, 3, 64, 13, '#3b2b40', OUT);
      G.fe(g, 12, 9, 3, 4, '#ffd94a'); G.R(g, 11, 6, 1, 2, '#fff3b0');
      G.text(g, '$' + Math.round(G.state.moneyShown), 20, 6, '#ffe66e');
      // day + kids
      const served = G.state.today.kidsServed;
      G.panel(g, 74, 3, 92, 13, '#3b2b40', OUT);
      G.text(g, 'DAY ' + G.state.day + '  ' + served + '/' + this.totalKids, 80, 6, '#fff');
      // cavity forecast
      const cav = G.state.today.cavCaused;
      if (cav > 0) {
        G.panel(g, 172, 3, 46, 13, '#3b2b40', OUT);
        G.drawToothIcon(g, 178, 5, '#fff');
        G.text(g, '×' + cav, 190, 6, '#c9a3ff');
      }
      // hint line
      let hint = '';
      if (!this.build) hint = 'TAP A CONE OR CUP TO START';
      else if (!this.build.scoops.length) hint = 'HOLD A TUB TO SCOOP · DRAG ONTO THE ' + this.build.base.toUpperCase();
      else if (this.front()) hint = 'ADD SAUCE + TOPS · THEN PRESS SERVE';
      if (hint && this.t % 6 < 3.5) {
        g.globalAlpha = 0.85;
        G.text(g, hint, 240, 189, '#a88bb5', { align: 'center' });
        g.globalAlpha = 1;
      }
    },
  };
})();

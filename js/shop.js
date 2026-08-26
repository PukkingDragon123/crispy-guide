// ============================================================
// DOUBLE LIFE v5 - shop.js  ·  THE BOOKS + THE ARMOURY
// clause closes the day out, then you spend it: more pits, better
// tools, weapons for the resistance, machines you turned, and a
// bigger plan for clause itself.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  // ================= THE BOOKS =================
  G.scenes.summary = {
    enter() {
      this.t = 0;
      if (G.clause) { G.clause.buildReport(); G.clause.enter('summary'); }
      G.steam.length = 0;
      G.audio.music('title');
    },
    onDown(x, y) {
      if (this.t > 0.5 && G.inRect(x, y, 112, 152, 96, 16)) { G.audio.sfx('click'); G.go('shop', 'THE ARMOURY'); }
    },
    update(dt) {
      this.t += dt;
      G.updateSteam(dt);
      if (Math.random() < dt * 0.7) G.puffSteam(G.irand(20, 300), 176);
      if (G.clause) G.clause.update(dt);
    },
    draw(g) {
      const t = this.t;
      G.R(g, 0, 0, G.W, G.H, P.cityDk);
      G.cityWall(g, 0, 0, G.W, G.H, t);
      g.globalAlpha = 0.5; G.R(g, 0, 0, G.W, G.H, '#0a0810'); g.globalAlpha = 1;
      G.glow(g, 160, 70, 240, 130, '#d97757', 0.5);
      if (G.clause) G.clause.drawReport(g, t);
      G.drawSteam(g);
      if (t > 0.5) G.drawBtn(g, 112, 152, 96, 16, 'ARMOURY >', { col: '#8a3a2a' });
      G.grade(g, 1);
    },
  };

  // ================= THE ARMOURY =================
  const TABS = ['UPGRADES', 'ARMS', 'CREW', 'CLAUSE'];
  const ROWS = 6;                       // rows per page

  G.scenes.shop = {
    enter() {
      this.t = 0;
      this.tab = 0;
      this.page = 0;
      this.flash = null;
      G.steam.length = 0;
      G.audio.music('title');
      if (G.clause) G.clause.enter('shop');
    },
    all() {
      if (this.tab === 0) return G.DATA.arms.filter((a) => a.kind === 'shop' || a.kind === 'lab');
      if (this.tab === 1) return G.DATA.arms.filter((a) => a.kind === 'war');
      if (this.tab === 2) return G.DATA.allies;
      return G.DATA.tiers.slice(1);
    },
    pages() { return Math.max(1, Math.ceil(this.all().length / ROWS)); },
    rows() { return this.all().slice(this.page * ROWS, this.page * ROWS + ROWS); },
    buy(it) {
      if (this.tab === 3) {
        const idx = G.DATA.tiers.indexOf(it);
        if (idx <= G.tierIdx()) { G.clause.say('ALREADY ON THAT PLAN OR BETTER.', P.steel2, 2.4); return; }
        if (G.state.money < it.price) { G.clause.say('NOT ENOUGH.', P.warn, 2); return; }
        G.state.money -= it.price;
        G.state.tier = idx;
        G.state.calls = it.calls;
        G.audio.sfx('unlock');
        G.clause.say('UPGRADED TO ' + it.name + '. THANK YOU.', P.lime, 3);
        G.save();
        return;
      }
      const owned = this.tab === 2 ? G.hasAlly(it.id) : G.has(it.id);
      if (owned) { G.clause.say('YOU HAVE THAT.', P.steel2, 2); return; }
      if (G.state.money < it.price) { G.clause.say('NOT ENOUGH.', P.warn, 2); return; }
      G.state.money -= it.price;
      if (this.tab === 2) G.state.allies.push(it.id);
      else G.state.owned.push(it.id);
      // buying a pit builds it empty
      if (it.id.slice(0, 3) === 'pit') {
        const n = G.pitCount();
        while (G.state.pits.length < n) G.state.pits.push({ fid: null, qty: 0, max: G.has('chiller') ? 18 : 12 });
      }
      if (it.id === 'chiller') for (const p of G.state.pits) p.max = 18;
      G.state.newIds.push(it.id);
      G.audio.sfx('unlock');
      this.flash = { t: 0 };
      G.clause.say(this.tab === 2 ? it.name + ' IS WITH US NOW.' : 'FITTED: ' + it.name + '.', P.lime, 3);
      G.save();
    },
    onDown(x, y) {
      if (G.clause && G.clause.onDown(x, y)) return;
      for (let i = 0; i < TABS.length; i++)
        if (G.inRect(x, y, 4 + i * 62, 16, 58, 13)) { this.tab = i; this.page = 0; G.audio.sfx('clack'); return; }
      const list = this.rows();
      for (let i = 0; i < list.length && i < ROWS; i++)
        if (G.inRect(x, y, 8, 32 + i * 17, 304, 15)) { this.buy(list[i]); return; }
      if (this.pages() > 1) {
        if (G.inRect(x, y, 8, 136, 18, 11)) { this.page = (this.page + this.pages() - 1) % this.pages(); G.audio.sfx('clack'); return; }
        if (G.inRect(x, y, 30, 136, 18, 11)) { this.page = (this.page + 1) % this.pages(); G.audio.sfx('clack'); return; }
      }
      if (G.inRect(x, y, 4, 152, 68, 16)) { G.audio.sfx('click'); G.go('back', 'THE BACK ROOM'); return; }
      if (G.inRect(x, y, 216, 152, 100, 16)) {
        G.audio.sfx('day');
        // the piggy bank keeps a slice of the take overnight
        if (G.has('piggy')) {
          const keep = Math.round((G.state.today ? G.state.today.dayEarn : 0) * 0.1);
          if (keep > 0) { G.state.money += keep; G.toast('PIGGY BANK +$' + keep, P.hazard); }
        }
        G.state.day++;
        G.newDayStats();
        G.state.today.demand = G.rollDemand();
        if (G.hasAlly('a_scav') || G.hasPerk('p_mouse')) {   // something turns up overnight
          const id = G.pick(G.DATA.ing).id;
          G.state.shelf[id] = (G.state.shelf[id] || 0) + 1;
        }
        G.save();
        // a chapter that has come true plays before the doors open
        const ch = G.dueChapter();
        if (ch && G.cine.has(ch.id)) {
          G.markChapter(ch.id);
          G.save();
          G.playCine(ch.id, () => G.go('day', 'DAY ' + G.state.day));
        } else {
          if (ch) G.markChapter(ch.id);
          G.go('day', 'DAY ' + G.state.day);
        }
      }
    },
    update(dt) {
      this.t += dt;
      if (this.flash) { this.flash.t += dt; if (this.flash.t > 0.5) this.flash = null; }
      G.updateSteam(dt);
      if (Math.random() < dt * 0.8) G.puffSteam(G.irand(10, 310), 176);
      if (G.clause) G.clause.update(dt);
      if (G.state.money !== G.state.moneyShown)
        G.state.moneyShown += (G.state.money - G.state.moneyShown) * Math.min(1, dt * 8);
    },
    draw(g) {
      const t = this.t;
      G.toastY = 138; G.toastCX = 110;
      G.R(g, 0, 0, G.W, G.H, P.cityDk);
      G.cityWall(g, 0, 0, G.W, G.H, t);
      g.globalAlpha = 0.55; G.R(g, 0, 0, G.W, G.H, '#0a0c14'); g.globalAlpha = 1;
      // ---- the lock-up: racking, crates, a strip light, a roller door ----
      for (let r = 0; r < 3; r++) {
        const ry2 = 46 + r * 40;
        G.plate(g, -6, ry2, 332, 4, '#3a2c1c', { r: 1, band: 1, spec: false, grain: r + 1 });
        for (let cxx = 8; cxx < 320; cxx += 54) G.plate(g, cxx, ry2 + 4, 4, 36, '#2e2416', { r: 1, band: 1, spec: false });
        for (let i = 0; i < 7; i++) {
          const bx = 14 + i * 46, hh = 12 + ((i * 5 + r) % 3) * 5;
          const col = ['#5c6a86', '#7a5c4a', '#3f6b5c', '#6b5a3a'][(i + r) % 4];
          G.plate(g, bx, ry2 - hh, 34, hh, col, { r: 1, band: 2, spec: false, bolts: 1 });
          G.Rh(g, bx + 6, ry2 - hh + 4, 20, 3, G.shade(col, -0.5));
        }
      }
      g.globalAlpha = 0.62; G.R(g, 0, 28, G.W, 124, '#090c14'); g.globalAlpha = 1;
      // one strip light over the counter
      G.R(g, 132, 30, 56, 4, '#2a3242');
      G.Rh(g, 134, 33, 52, 1.5, '#dfeaf4');
      G.glow(g, 160, 46, 200, 90, '#8fd8ff', 0.28);
      G.conduit(g, 0, 2, G.W, false, P.magenta);
      G.glow(g, 160, 80, 240, 130, '#ff7a4a', 0.3);

      // HUD
      G.plate(g, 2, 2, 56, 12, P.ink2, { r: 1, band: 1, spec: false });
      G.R(g, 6, 6, 4, 5, P.hazard);
      G.text(g, '$' + Math.round(G.state.moneyShown), 13, 4, P.hazard);
      G.plate(g, 62, 2, 74, 12, P.ink2, { r: 1, band: 1, spec: false });
      G.text(g, 'THE ARMOURY', 66, 4, P.magentaLt);
      G.plate(g, 200, 2, 116, 12, P.ink2, { r: 1, band: 1, spec: false });
      G.text(g, 'FREED ' + G.state.freed + '  ·  HEAT ' + Math.round(G.state.suspicion * 100) + '%', 204, 4,
        G.state.suspicion > 0.6 ? P.magenta : P.lime);

      for (let i = 0; i < TABS.length; i++) {
        const on = this.tab === i;
        G.plate(g, 4 + i * 62, 16, 58, 13, on ? '#8a3a2a' : '#1c1e2a', { r: 1, band: 1, spec: false });
        if (on) G.R(g, 4 + i * 62, 16, 58, 1, P.hazard);
        G.text(g, TABS[i], 4 + i * 62 + 29, 19, on ? '#ffe8dc' : '#5a6070', { align: 'center' });
      }

      const list = this.rows();
      for (let i = 0; i < list.length && i < ROWS; i++) {
        const it = list[i], ry = 32 + i * 17;
        const owned = this.tab === 3 ? G.DATA.tiers.indexOf(it) <= G.tierIdx()
          : this.tab === 2 ? G.hasAlly(it.id) : G.has(it.id);
        const aff = G.state.money >= it.price;
        const hov = G.inRect(G.mouse.x, G.mouse.y, 8, ry, 304, 16);
        G.plate(g, 8, ry, 304, 15, owned ? '#1a3a24' : hov && aff ? '#4a2a1a' : '#1a1e28',
          { r: 1, band: 1, spec: false });
        G.R(g, 8, ry, 2, 15, owned ? P.lime : aff ? P.hazard : '#3a3a44');
        // a little portrait for crew rows
        if (this.tab === 2) {
          G.drawBot(g, it.sp, 22, ry + 14, 0.19, { t, open: 0.2, mood: 'idle', walk: t + i, noBlink: 1 });
          G.text(g, it.name, 34, ry + 1, owned ? P.lime : P.cream);
          G.text(g, it.desc, 34, ry + 9, P.steel2);
        } else {
          G.text(g, it.name, 14, ry + 1, owned ? P.lime : P.cream);
          if (this.tab === 3) {
            G.text(g, (it.perks || []).join('  ·  '), 14, ry + 9, P.steel2);
            G.text(g, it.calls + ' CALLS/DAY', 246, ry + 9, P.cyanLt, { align: 'right' });
          } else G.text(g, it.desc, 14, ry + 9, P.steel2);
        }
        G.text(g, owned ? 'OWNED' : '$' + it.price, 306, ry + 4,
          owned ? P.lime : aff ? P.hazard : '#6b5a60', { align: 'right' });
      }
      if (!list.length) G.text(g, 'NOTHING HERE', 160, 80, '#4a5060', { align: 'center' });

      // paging, when a tab has more than fits
      if (this.pages() > 1) {
        G.plate(g, 8, 136, 18, 11, '#2a3a4c', { r: 1, band: 1, spec: false });
        G.text(g, '<', 17, 138, P.cream, { align: 'center', sc: 0.5 });
        G.plate(g, 30, 136, 18, 11, '#2a3a4c', { r: 1, band: 1, spec: false });
        G.text(g, '>', 39, 138, P.cream, { align: 'center', sc: 0.5 });
        G.text(g, (this.page + 1) + '/' + this.pages(), 54, 138, P.steel, { sc: 0.5 });
      }

      // the line at a glance, so you know if you can even open tomorrow
      const n = G.pitCount();
      G.text(g, 'LINE:', 76, 138, P.steel, { sc: 0.5 });
      for (let i = 0; i < 5; i++) {
        const px = 98 + i * 20;
        const pit = G.state.pits[i];
        const f = pit ? G.flavById(pit.fid) : null;
        G.plate(g, px, 136, 16, 11, i < n ? P.plateDk : '#161822', { r: 1, band: 1, spec: false });
        if (i < n && f) { G.R(g, px + 2, 138, 12, 7, f.col); G.hair(g, px + 2, 138, 12, G.shade(f.col, 0.5)); }
        else if (i < n) G.text(g, '-', px + 8, 138, '#4a5060', { align: 'center', sc: 0.5 });
      }
      const loaded = G.state.pits.slice(0, n).filter((p) => p && p.qty > 0).length;
      G.text(g, loaded ? loaded + '/' + n + ' LOADED' : 'NOTHING LOADED - GO BACK',
        204, 138, loaded ? P.lime : P.magenta, { sc: 0.5 });
      G.text(g, 'CREW ' + (G.state.crew || []).length + '  ·  RESCUED ' + G.state.spotted,
        204, 144, P.violetLt, { sc: 0.5 });

      G.drawSteam(g);
      G.R(g, 0, 150, G.W, 30, '#0c0d16');
      G.R(g, 0, 150, G.W, 1, P.magenta);
      G.drawBtn(g, 4, 152, 68, 16, '< BACK', { col: '#3a2a5c' });
      G.drawBtn(g, 216, 152, 100, 16, 'OPEN TOMORROW', { col: loaded ? '#2f8a48' : '#5c2030' });
      if (G.clause) { G.clause.at(258, 22, 166, 4, 286, true); G.clause.draw(g); }
      if (this.flash) {
        g.globalAlpha = (1 - this.flash.t / 0.5) * 0.4;
        G.R(g, 0, 0, G.W, G.H, P.hazard);
        g.globalAlpha = 1;
      }
      G.grade(g, 1);
    },
  };
})();

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

  G.scenes.shop = {
    enter() {
      this.t = 0;
      this.tab = 0;
      this.flash = null;
      G.steam.length = 0;
      G.audio.music('title');
      if (G.clause) G.clause.enter('shop');
    },
    rows() {
      if (this.tab === 0) return G.DATA.arms.filter((a) => a.kind === 'shop' || a.kind === 'lab');
      if (this.tab === 1) return G.DATA.arms.filter((a) => a.kind === 'war');
      if (this.tab === 2) return G.DATA.allies;
      return G.DATA.tiers.slice(1);
    },
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
        if (G.inRect(x, y, 4 + i * 56, 16, 52, 13)) { this.tab = i; G.audio.sfx('clack'); return; }
      const list = this.rows();
      for (let i = 0; i < list.length && i < 6; i++)
        if (G.inRect(x, y, 8, 32 + i * 17, 304, 15)) { this.buy(list[i]); return; }
      if (G.inRect(x, y, 4, 152, 68, 16)) { G.audio.sfx('click'); G.go('lab', 'THE LAB'); return; }
      if (G.inRect(x, y, 216, 152, 100, 16)) {
        G.audio.sfx('day');
        G.state.day++;
        G.newDayStats();
        G.state.today.demand = G.rollDemand();
        if (G.hasAlly('a_scav')) {                     // the magpie brings something home
          const id = G.pick(G.DATA.ing).id;
          G.state.shelf[id] = (G.state.shelf[id] || 0) + 1;
        }
        G.save();
        G.go('day', 'DAY ' + G.state.day);
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
      g.globalAlpha = 0.45; G.R(g, 0, 0, G.W, G.H, '#0a0c14'); g.globalAlpha = 1;
      G.conduit(g, 0, 2, G.W, false, P.magenta);
      G.glow(g, 160, 80, 240, 130, '#ff7a4a', 0.4);

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
        G.plate(g, 4 + i * 56, 16, 52, 13, on ? '#8a3a2a' : '#1c1e2a', { r: 1, band: 1, spec: false });
        if (on) G.R(g, 4 + i * 56, 16, 52, 1, P.hazard);
        G.text(g, TABS[i].slice(0, 8), 4 + i * 56 + 26, 19, on ? '#ffe8dc' : '#5a6070', { align: 'center' });
      }

      const list = this.rows();
      for (let i = 0; i < list.length && i < 6; i++) {
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

      // the line at a glance, so you know if you can even open tomorrow
      const n = G.pitCount();
      G.text(g, 'LINE:', 8, 142, P.steel);
      for (let i = 0; i < 5; i++) {
        const px = 34 + i * 22;
        const pit = G.state.pits[i];
        const f = pit ? G.flavById(pit.fid) : null;
        G.plate(g, px, 138, 18, 10, i < n ? P.plateDk : '#161822', { r: 1, band: 1, spec: false });
        if (i < n && f) G.R(g, px + 2, 140, 14, 6, f.col);
        else if (i < n) G.text(g, '-', px + 9, 140, '#4a5060', { align: 'center' });
      }
      const loaded = G.state.pits.slice(0, n).filter((p) => p && p.qty > 0).length;
      G.text(g, loaded ? loaded + '/' + n + ' PITS LOADED' : 'NO PITS LOADED - GO TO THE LAB',
        152, 140, loaded ? P.lime : P.magenta);

      G.drawSteam(g);
      G.R(g, 0, 150, G.W, 30, '#0c0d16');
      G.R(g, 0, 150, G.W, 1, P.magenta);
      G.drawBtn(g, 4, 152, 68, 16, '< LAB', { col: '#3a2a5c' });
      G.drawBtn(g, 216, 152, 100, 16, 'OPEN TOMORROW', { col: loaded ? '#2f8a48' : '#5c2030' });
      if (G.clause) { G.clause.at(240, 22, 166, 4, 286, true); G.clause.draw(g); }
      if (this.flash) {
        g.globalAlpha = (1 - this.flash.t / 0.5) * 0.4;
        G.R(g, 0, 0, G.W, G.H, P.hazard);
        g.globalAlpha = 1;
      }
      G.grade(g, 1);
    },
  };
})();

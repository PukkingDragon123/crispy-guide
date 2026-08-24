// ============================================================
// DOUBLE LIFE v4 - shop.js  ·  THE BOOKS + THE STOCKROOM
// 320x180. A terminal readout under a work lamp, then a lock-up
// you pan across where every purchase is an object on a shelf.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  // ================= SUMMARY =================
  G.scenes.summary = {
    enter() {
      this.t = 0;
      const d = G.state.today || {};
      this.rows = [
        ['UNITS SERVED', '' + (d.botsServed || 0), P.cream],
        ['SUGAR PUSHED', '' + (d.sugar || 0), P.magentaLt],
        ['KIOSK', '$' + (d.dayEarn || 0), P.hazard],
        ['WORKSHOP', '$' + (d.nightEarn || 0), P.cyanLt],
        ['FAULTS CAUSED', '' + (d.jobs || []).reduce((a, p) => a + p.faults.length, 0), P.violetLt],
        ['FAULTS FIXED', '' + (d.fixed || 0), P.lime],
        ['COOLANT LOST', (d.mess || 0) + 'ML', P.coolantLt],
      ];
      this.stamped = 0;
      G.audio.music('title');
      G.cam.reset(0, 0, 0, 0);
      G.steam.length = 0;
    },
    onDown(x, y) {
      if (this.t > 0.4 && G.inRect(x, y, 116, 158, 88, 16)) { G.audio.sfx('click'); G.go('shop', 'LOCK-UP'); }
    },
    update(dt) {
      this.t += dt;
      G.updateSteam(dt);
      if (Math.random() < dt * 0.8) G.puffSteam(G.irand(10, 310), 176);
      const want = Math.floor((this.t - 0.3) / 0.2);
      while (this.stamped < Math.min(want, this.rows.length)) {
        this.stamped++; G.audio.sfx('clack'); G.shake(0.6, 0.05);
      }
    },
    draw(g) {
      const t = this.t;
      G.R(g, 0, 0, G.W, G.H, P.cityDk);
      G.cityWall(g, 0, 0, G.W, 100, t);
      G.conduit(g, 0, 2, G.W, false, P.cyan);
      G.glow(g, 100, 60, 140, 84, P.cyanLt, 0.9);
      // bench
      G.box(g, -4, 118, G.W + 8, 66, P.plate, { lit: P.plateLt, dk: P.plateDk, r: 2, band: 5 });
      G.R(g, -4, 118, G.W + 8, 1, P.cyanDk);
      // work lamp
      G.conduit(g, 26, 6, 38, true, P.magenta);
      G.box(g, 16, 44, 26, 9, P.plateDk, { r: 2, band: 2 });
      G.R(g, 20, 52, 18, 2, '#fff8d8');

      // the terminal readout
      G.box(g, 58, 14, 204, 132, '#0f1a24', { lit: '#1d3040', dk: '#070c12', r: 2, band: 3, spec: false });
      G.R(g, 60, 16, 200, 1, P.cyanDk);
      for (let j = 18; j < 144; j += 3) { g.globalAlpha = 0.1; G.R(g, 60, j, 200, 1, P.cyanLt); g.globalAlpha = 1; }
      G.text(g, 'SHIFT ' + G.state.day + ' - THE BOOKS', 160, 22, P.cyanLt, { align: 'center' });
      G.R(g, 82, 32, 156, 1, P.cyanDk);
      for (let i = 0; i < this.stamped; i++) {
        const r = this.rows[i], ry = 38 + i * 13;
        G.text(g, r[0], 82, ry, P.steel2);
        G.text(g, r[1], 238, ry, r[2], { align: 'right' });
        // a hard scan-line flicker on the freshest row
        if (i === this.stamped - 1 && Math.sin(t * 30) > 0) G.R(g, 82, ry - 1, 156, 9, '#22e0ff18');
      }
      if (this.stamped >= this.rows.length) {
        const net = (G.state.today.dayEarn || 0) + (G.state.today.nightEarn || 0);
        G.R(g, 82, 130, 156, 1, P.cyanDk);
        G.text(g, 'NET', 82, 134, P.cream);
        G.text(g, '$' + net, 238, 134, P.lime, { align: 'right' });
      }
      if (t > 1.9) G.text(g, 'YOU SOLD THE FAULT AND BILLED FOR THE FIX.', 160, 150, P.steel, { align: 'center' });
      if (t > 0.4) G.drawBtn(g, 116, 158, 88, 16, 'LOCK-UP >', { col: '#3a2a5c' });
      G.box(g, 2, 2, 50, 12, P.ink2, { r: 1, band: 1, spec: false });
      G.R(g, 6, 6, 4, 5, P.hazard);
      G.text(g, '$' + Math.round(G.state.moneyShown), 13, 4, P.hazard);
      G.drawSteam(g);
      G.grade(g, 1);
    },
  };

  // ================= STOCKROOM =================
  const SW = 620;
  const ZONES = [
    { id: 'flavors', label: 'FLAVOURS', x: 8, w: 180, key: 'flavors', data: () => G.DATA.flavors },
    { id: 'sauces', label: 'SAUCES', x: 200, w: 120, key: 'sauces', data: () => G.DATA.sauces },
    { id: 'tops', label: 'TOPPINGS', x: 332, w: 132, key: 'tops', data: () => G.DATA.tops },
    { id: 'upgrades', label: 'WORKSHOP', x: 476, w: 132, key: 'upgrades', data: () => G.DATA.upgrades },
  ];
  function slots(z) {
    const out = [], items = z.data();
    for (let i = 0; i < items.length; i++) {
      if (z.id === 'flavors') out.push({ x: z.x + 20 + (i % 5) * 36, y: 74 + Math.floor(i / 5) * 50, item: items[i] });
      else if (z.id === 'sauces') out.push({ x: z.x + 24 + (i % 3) * 36, y: 74 + Math.floor(i / 3) * 50, item: items[i] });
      else if (z.id === 'tops') out.push({ x: z.x + 24 + (i % 3) * 38, y: 74 + Math.floor(i / 3) * 50, item: items[i] });
      else out.push({ x: z.x + 24 + (i % 3) * 38, y: 74 + Math.floor(i / 3) * 50, item: items[i] });
    }
    return out;
  }

  G.scenes.shop = {
    enter() {
      this.t = 0;
      G.cam.reset(0, SW - G.W, 0, 0);
      this.panDrag = null;
      this.slots = [];
      for (const z of ZONES) for (const s of slots(z)) this.slots.push(Object.assign(s, { z }));
      this.flash = null;
      G.steam.length = 0;
      G.audio.music('title');
    },
    tagRect(s) { return { x: s.x - 15, y: s.y + 11, w: 30, h: 10 }; },
    onDown(sx, sy) {
      if (G.inRect(sx, sy, 244, 160, 72, 16)) {
        G.audio.sfx('day'); G.state.day++; G.newDayStats(); G.save();
        G.go('day', 'DAY ' + G.state.day); return;
      }
      if (G.inRect(sx, sy, 0, 60, 10, 90)) { G.cam.nudge(-90); G.audio.sfx('clack'); return; }
      if (G.inRect(sx, sy, G.W - 10, 60, 10, 90)) { G.cam.nudge(90); G.audio.sfx('clack'); return; }
      const wx = sx + Math.round(G.cam.x), wy = sy;
      for (const s of this.slots) {
        const owned = G.state[s.z.key].includes(s.item.id) || s.item.price === 0;
        if (owned) continue;
        const r = this.tagRect(s);
        if (G.inRect(wx, wy, r.x - 3, r.y - 3, r.w + 6, r.h + 6) || G.dist(wx, wy, s.x, s.y) < 16) {
          if (G.state.money >= s.item.price) {
            G.state.money -= s.item.price;
            G.state.moneyShown = G.state.money;
            G.state[s.z.key].push(s.item.id);
            G.state.newIds.push(s.item.id);
            G.save();
            G.audio.sfx('unlock');
            G.spark(s.x - Math.round(G.cam.x), s.y, [P.hazard, '#fff', P.lime], 14, 60);
            G.toast('STOCKED ' + s.item.name, P.hazard);
            this.flash = { x: s.x, y: s.y, t: 0 };
          } else { G.audio.sfx('denied'); G.toast('NOT ENOUGH', P.warn); }
          return;
        }
      }
      this.panDrag = { sx, camX: G.cam.tx };
    },
    onMove(sx) { if (this.panDrag) G.cam.goto(this.panDrag.camX - (sx - this.panDrag.sx), null); },
    onUp() { this.panDrag = null; },
    onWheel(d) { G.cam.nudge(d > 0 ? 50 : -50); },
    update(dt) {
      this.t += dt;
      G.updateSteam(dt);
      if (Math.random() < dt * 1.1) G.puffSteam(G.irand(10, 310), 176);
      if (this.flash) { this.flash.t += dt; if (this.flash.t > 0.5) this.flash = null; }
    },
    draw(g) {
      const t = this.t;
      const camX = Math.round(G.cam.x);
      G.R(g, 0, 0, G.W, G.H, P.night);
      G.cityWall(g, 0, 0, G.W, 130, t);
      G.conduit(g, 0, 2, G.W, false, P.cyan);
      G.hangSign(g, 40, 108, 18, 16, P.magenta, t, 1);
      const sw = Math.sin(t * 1.1) * 12;
      G.R(g, 160 + sw * 0.3, 0, 1, 22, '#2e3d5c');
      G.box(g, 157 + sw, 21, 7, 6, '#ffe9a8', { lit: '#ffffff', dk: '#c9a83a', r: 1, band: 1 });
      G.glow(g, 160 + sw, 40, 130, 80, '#ffdf9a', 1.1);
      G.R(g, 0, 130, G.W, 50, P.night2);
      G.R(g, 0, 130, G.W, 1, P.night3);

      G.cam.push(g);
      for (const z of ZONES) {
        G.box(g, z.x + z.w / 2 - 34, 34, 68, 12, '#161f33', { r: 1, band: 1, spec: false });
        G.text(g, z.label, z.x + z.w / 2, 37, P.hazard, { align: 'center' });
        if (z.id === 'flavors') {
          G.box(g, z.x, 50, z.w, 100, '#1d3040', { lit: '#2f4c62', dk: '#0e1a24', r: 2, band: 6 });
          g.globalAlpha = 0.12; G.R(g, z.x + 3, 53, z.w - 6, 94, P.cyan); g.globalAlpha = 1;
        } else if (z.id === 'upgrades') {
          G.box(g, z.x, 50, z.w, 100, P.plateDk, { lit: P.plate, dk: P.plateDk2, r: 2, band: 5 });
          G.R(g, z.x + z.w - 9, 84, 4, 14, P.chrome);
        } else {
          G.box(g, z.x, 50, z.w, 100, '#241d33', { lit: '#3c3150', dk: '#150f20', r: 2, band: 4 });
          for (let r = 0; r < 2; r++) { G.R(g, z.x + 3, 88 + r * 50, z.w - 6, 4, '#3a2f4e'); G.R(g, z.x + 3, 88 + r * 50, z.w - 6, 1, P.violet); }
        }
      }
      for (const s of this.slots) {
        const owned = G.state[s.z.key].includes(s.item.id) || s.item.price === 0;
        const afford = G.state.money >= s.item.price;
        if (!owned) g.globalAlpha = 0.6;
        if (s.z.id === 'flavors') G.drawPint(g, s.x - 13, s.y - 14, 26, 24, [s.item.id], new Array(8).fill(0.05), { legend: false });
        else if (s.z.id === 'sauces') { G.box(g, s.x - 6, s.y - 12, 12, 20, s.item.col, { r: 1, band: 3 }); G.R(g, s.x - 4, s.y - 15, 8, 4, '#8a95a8'); }
        else if (s.z.id === 'tops') {
          G.box(g, s.x - 7, s.y - 12, 14, 20, '#22303c', { r: 1, band: 2 });
          for (let k = 0; k < 5; k++) G.R(g, s.x - 5 + (k % 3) * 4, s.y - 7 + Math.floor(k / 3) * 4, 2, 2, G.topBitCol(s.item.id));
        } else {
          const icon = { coldarm: 'vac', steady: 'swap', loupe: 'scan', sedative: 'oil', carbide: 'weld' }[s.item.id] || 'scan';
          G.mechTool(g, icon, s.x, s.y + 8, { t });
        }
        g.globalAlpha = 1;
        const nm = s.item.name.split(' ')[0].slice(0, 6);
        const nw = G.tw(nm) + 6;
        G.R(g, s.x - nw / 2, s.y - 28, nw, 9, '#0d1220');
        G.text(g, nm, s.x, s.y - 26, owned ? P.steel2 : P.cream, { align: 'center' });
        const r = this.tagRect(s);
        if (owned) {
          G.box(g, r.x, r.y, r.w, r.h, '#16281a', { r: 1, band: 1, spec: false });
          G.text(g, 'HELD', s.x, r.y + 2, P.lime, { align: 'center' });
        } else {
          const hov = G.inRect(G.mouse.wx, G.mouse.y, r.x - 3, r.y - 3, r.w + 6, r.h + 6);
          G.box(g, r.x, r.y, r.w, r.h, hov ? (afford ? '#2f5c28' : '#5c2b2b') : '#2a2418', { r: 1, band: 1, spec: false });
          G.text(g, '$' + s.item.price, s.x, r.y + 2, afford ? P.hazard : '#6b5a60', { align: 'center' });
        }
        if (G.state.newIds.includes(s.item.id) && Math.sin(t * 6) > 0)
          G.text(g, 'NEW', s.x + 12, s.y - 36, P.magentaLt, { out: OUT });
      }
      if (this.flash) {
        g.globalAlpha = 1 - this.flash.t / 0.5;
        G.oc(g, this.flash.x, this.flash.y, 6 + this.flash.t * 40, P.hazard);
        g.globalAlpha = 1;
      }
      G.cam.pop(g);

      G.box(g, 2, 2, 56, 12, '#161f33', { r: 1, band: 1, spec: false });
      G.R(g, 6, 6, 4, 5, P.hazard);
      G.text(g, '$' + Math.round(G.state.moneyShown), 13, 4, P.hazard);
      G.text(g, 'LOCK-UP', 160, 4, P.cyanLt, { align: 'center', out: OUT });
      // minimap
      const mw = 70, mx = 160 - mw / 2;
      G.R(g, mx, 16, mw, 4, '#0d1220');
      for (const z of ZONES) G.R(g, mx + (z.x / SW) * mw, 16, (z.w / SW) * mw, 4, '#2c3f4a');
      G.R(g, mx + (camX / SW) * mw, 15, (G.W / SW) * mw, 6, '#ffffff44');
      const atL = G.cam.tx <= 1, atR = G.cam.tx >= SW - G.W - 1;
      for (const [ex, dirL] of [[0, true], [G.W - 10, false]]) {
        if (dirL ? atL : atR) continue;
        g.globalAlpha = 0.5 + Math.sin(t * 3) * 0.15;
        G.R(g, ex, 60, 10, 90, '#0d1220');
        for (let i = 0; i < 3; i++) G.R(g, dirL ? ex + 6 - i * 2 : ex + 3 + i * 2, 102 - i, 2, 3 + i * 3, P.steel2);
        g.globalAlpha = 1;
      }
      G.drawBtn(g, 244, 160, 72, 16, 'NEXT DAY >', { col: '#a8621f' });
      G.text(g, 'DRAG THE FLOOR', 6, 166, '#3d5049');
      G.drawSteam(g);
      G.grade(g, 1);
    },
  };
})();

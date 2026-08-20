// ============================================================
// DOUBLE LIFE v2 - shop.js  ·  THE BOOKS + THE BACK ROOM
// summary: a ledger stamped line by line under a desk lamp.
// shop:    a pannable stockroom under one swinging bulb where
//          every purchase is a physical object on a shelf.
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
        ['CONES SOLD', (d.kidsServed || 0) + '  (' + (d.perfect || 0) + ' PERFECT)', P.cream],
        ['SUGAR PUSHED', '' + (d.sugar || 0), '#ff8ade'],
        ['PARLOUR TAKE', '$' + (d.dayEarn || 0), P.gold],
        ['CLINIC TAKE', '$' + (d.nightEarn || 0), P.neonC],
        ['PROBLEMS CAUSED', '' + (d.patients || []).reduce((a, p) => a + p.symptoms.length, 0), '#b46bff'],
        ['PROBLEMS FIXED', '' + (d.fixed || 0), P.neonG],
        ['MISDIAGNOSES', '' + (d.misdx || 0), (d.misdx ? P.warn : P.steel2)],
        ['BLOOD SPILLED', (d.blood || 0) + ' ML', P.bloodLit],
      ];
      this.stamped = 0;
      G.audio.music('title');
      G.cam.reset(0, 0, 0, 0);
    },
    onDown(x, y) {
      if (this.t > 0.5 && G.inRect(x, y, 246, 314, 148, 26)) { G.audio.sfx('click'); G.go('shop', 'STOCKROOM'); }
    },
    update(dt) {
      this.t += dt;
      const want = Math.floor((this.t - 0.35) / 0.24);
      while (this.stamped < Math.min(want, this.rows.length)) {
        this.stamped++;
        G.audio.sfx('clack');
        G.shake(0.8, 0.06);
      }
    },
    draw(g) {
      const t = this.t;
      // desk in the dark
      G.gradV(g, 0, 0, G.W, G.H, '#0d1211', '#060908', 6);
      // lamp cone from the top-left
      g.globalAlpha = 0.1;
      for (let i = 8; i > 0; i--) G.fe(g, 300, 130, 120 + i * 26, 80 + i * 18, '#ffd9a0');
      g.globalAlpha = 1;
      // desk surface
      G.gradV(g, 0, 250, G.W, 110, '#3a2a1c', '#1a1210', 5);
      G.R(g, 0, 250, G.W, 2, '#5c4128');
      G.speckle(g, 0, 252, G.W, 106, '#241a12', 0.08, 3);

      // the ledger page
      G.rr2(g, 116, 26, 408, 250, '#0a0d0a');
      G.rr2(g, 118, 28, 404, 246, '#cfc6a6');
      G.speckle(g, 120, 30, 400, 242, '#b8ab88', 0.05, 7);
      for (let i = 0; i < 9; i++) G.R(g, 130, 74 + i * 22, 380, 1, '#b0a382');
      G.R(g, 150, 30, 1, 244, '#c08a8a');
      G.text(g, 'DAY ' + G.state.day + '  ·  THE BOOKS', 320, 42, '#2a2418', { align: 'center' });
      G.R(g, 160, 56, 320, 1, '#8a7a58');

      for (let i = 0; i < this.stamped; i++) {
        const r = this.rows[i];
        const ry = 62 + i * 22;
        G.text(g, r[0], 160, ry, '#2a2418');
        // ink-stamped value, slightly rotated feel via offset shadow
        G.text(g, r[1], 490, ry, '#6b1424', { align: 'right' });
        G.text(g, r[1], 489, ry - 1, r[2] === P.steel2 ? '#3a3524' : G.mix(r[2], '#3a1418', 0.35), { align: 'right' });
      }
      if (this.stamped >= this.rows.length) {
        const net = (G.state.today.dayEarn || 0) + (G.state.today.nightEarn || 0);
        G.R(g, 160, 246, 320, 1, '#8a7a58');
        G.text(g, 'NET', 160, 252, '#2a2418');
        G.text(g, '$' + net, 490, 252, '#1a4a24', { align: 'right' });
      }

      if (t > 2.3) {
        G.text(g, 'YOU SOLD THEM THE DISEASE AND BILLED THEM FOR THE CURE.',
          320, 292, '#8a7a68', { align: 'center' });
      }
      if (t > 0.5) G.drawBtn(g, 246, 314, 148, 26, 'STOCKROOM  →', { col: P.gum });

      G.frame(g, 4, 3, 78, 16, '#16211f');
      G.fe(g, 15, 11, 4, 5, P.gold);
      G.text(g, '$' + Math.round(G.state.moneyShown), 24, 7, P.gold);
      G.grade(g, 1);
    },
  };

  // ================= SHOP =================
  const SW = 1150;
  const ZONES = [
    { id: 'flavors', label: 'FLAVOURS', x: 20, w: 330, key: 'flavors', data: () => G.DATA.flavors },
    { id: 'sauces', label: 'SYRUPS', x: 372, w: 230, key: 'sauces', data: () => G.DATA.sauces },
    { id: 'tops', label: 'GRIT', x: 624, w: 250, key: 'tops', data: () => G.DATA.tops },
    { id: 'upgrades', label: 'CLINIC', x: 896, w: 236, key: 'upgrades', data: () => G.DATA.upgrades },
  ];

  // where each item physically sits in the room
  function slots(z) {
    const out = [];
    const items = z.data();
    for (let i = 0; i < items.length; i++) {
      if (z.id === 'flavors') out.push({ x: z.x + 26 + (i % 5) * 60, y: 132 + Math.floor(i / 5) * 104, item: items[i] });
      else if (z.id === 'sauces') out.push({ x: z.x + 34 + (i % 4) * 52, y: 150 + Math.floor(i / 4) * 92, item: items[i] });
      else if (z.id === 'tops') out.push({ x: z.x + 36 + (i % 3) * 62, y: 150 + Math.floor(i / 3) * 92, item: items[i] });
      else out.push({ x: z.x + 40 + (i % 3) * 66, y: 148 + Math.floor(i / 3) * 92, item: items[i] });
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
      G.audio.music('title');
    },
    tagRect(s) { return { x: s.x - 22, y: s.y + 18, w: 44, h: 16 }; },
    onDown(sx, sy) {
      // screen-space HUD first
      if (G.inRect(sx, sy, G.W - 118, G.H - 34, 112, 26)) {
        G.audio.sfx('day');
        G.state.day++;
        G.newDayStats();
        G.save();
        G.go('day', 'DAY ' + G.state.day);
        return;
      }
      if (G.inRect(sx, sy, 0, 120, 16, 180)) { G.cam.nudge(-180); G.audio.sfx('clack'); return; }
      if (G.inRect(sx, sy, G.W - 16, 120, 16, 180)) { G.cam.nudge(180); G.audio.sfx('clack'); return; }

      const wx = sx + Math.round(G.cam.x), wy = sy + Math.round(G.cam.y);
      for (const s of this.slots) {
        const r = this.tagRect(s);
        const owned = G.state[s.z.key].includes(s.item.id) || s.item.price === 0;
        if (owned) continue;
        if (G.inRect(wx, wy, r.x - 4, r.y - 4, r.w + 8, r.h + 8) || G.dist(wx, wy, s.x, s.y) < 26) {
          if (G.state.money >= s.item.price) {
            G.state.money -= s.item.price;
            G.state.moneyShown = G.state.money;
            G.state[s.z.key].push(s.item.id);
            G.state.newIds.push(s.item.id);
            G.save();
            G.audio.sfx('unlock');
            G.spark(s.x - Math.round(G.cam.x), s.y - Math.round(G.cam.y), [P.gold, '#fff', P.neonG], 18, 90);
            G.toast('STOCKED: ' + s.item.name, P.gold);
            this.flash = { x: s.x, y: s.y, t: 0 };
          } else {
            G.audio.sfx('denied');
            G.toast('NOT ENOUGH IN THE TILL', P.warn);
          }
          return;
        }
      }
      this.panDrag = { sx, camX: G.cam.tx };
    },
    onMove(sx) { if (this.panDrag) G.cam.goto(this.panDrag.camX - (sx - this.panDrag.sx), null); },
    onUp() { this.panDrag = null; },
    onWheel(d) { G.cam.nudge(d > 0 ? 80 : -80); },
    update(dt) {
      this.t += dt;
      if (this.flash) { this.flash.t += dt; if (this.flash.t > 0.6) this.flash = null; }
    },
    draw(g) {
      const t = this.t;
      const camX = Math.round(G.cam.x);
      G.cam.push(g);

      // ---- room shell ----
      G.gradV(g, 0, 0, SW, 300, '#101a17', '#070d0c', 6);
      for (let x = 0; x < SW; x += 34) G.R(g, x, 0, 2, 300, '#0a1210');
      G.gradV(g, 0, 288, SW, 72, '#1a2320', '#0c1110', 4);
      G.R(g, 0, 288, SW, 2, '#2c3a34');
      G.speckle(g, 0, 290, SW, 68, '#0a1210', 0.07, 5);

      // swinging bulb, its cone of light following the swing
      const sw = Math.sin(t * 1.1) * 26;
      const bx = camX + G.W / 2 + sw, by = 46;
      G.R(g, bx, 0, 1, by - 6, '#2c3a34');
      G.fc(g, bx, by, 6, '#3a3524');
      G.fc(g, bx, by, 5, '#ffe9a8');
      G.fc(g, bx - 1, by - 1, 2, '#ffffff');
      g.globalAlpha = 0.09;
      for (let i = 9; i > 0; i--) G.fe(g, bx, by + 90, 60 + i * 20, 60 + i * 16, '#ffdf9a');
      g.globalAlpha = 1;

      // ---- zones ----
      for (const z of ZONES) {
        // zone signage
        G.frame(g, z.x + z.w / 2 - 52, 62, 104, 18, '#16211f');
        G.text(g, z.label, z.x + z.w / 2, 67, P.gold, { align: 'center' });
        // the fixture
        if (z.id === 'flavors') {
          // chest freezer
          G.rr2(g, z.x, 108, z.w, 176, '#0a1210');
          G.rr2(g, z.x + 2, 110, z.w - 4, 172, '#25333a');
          G.gradV(g, z.x + 4, 112, z.w - 8, 22, '#5a7c88', '#25333a', 4);
          G.R(g, z.x + 4, 276, z.w - 8, 6, '#16242a');
          g.globalAlpha = 0.1; G.R(g, z.x + 4, 112, z.w - 8, 170, P.neonC); g.globalAlpha = 1;
        } else if (z.id === 'sauces' || z.id === 'tops') {
          // shelving
          G.rr2(g, z.x, 108, z.w, 176, '#0a1210');
          G.rr2(g, z.x + 2, 110, z.w - 4, 172, '#2a231a');
          for (let r = 0; r < 2; r++) {
            G.R(g, z.x + 4, 158 + r * 92, z.w - 8, 6, '#4a3a26');
            G.R(g, z.x + 4, 158 + r * 92, z.w - 8, 1, '#6b5638');
          }
        } else {
          // steel instrument cabinet
          G.rr2(g, z.x, 108, z.w, 176, '#0a1210');
          G.rr2(g, z.x + 2, 110, z.w - 4, 172, '#2b3a3a');
          for (let r = 0; r < 2; r++) G.R(g, z.x + 6, 156 + r * 92, z.w - 12, 4, '#4a5c5c');
          G.R(g, z.x + z.w - 16, 180, 6, 22, P.chrome);
          g.globalAlpha = 0.08; G.R(g, z.x + 4, 112, z.w - 8, 170, '#ffffff'); g.globalAlpha = 1;
        }
      }

      // ---- goods ----
      for (const s of this.slots) {
        const owned = G.state[s.z.key].includes(s.item.id) || s.item.price === 0;
        const afford = G.state.money >= s.item.price;
        const isNew = G.state.newIds.includes(s.item.id);
        if (!owned) { g.globalAlpha = 0.55; }
        // the object itself
        if (s.z.id === 'flavors') {
          G.drawPint(g, s.x - 22, s.y - 26, 44, 44, [s.item.id], new Array(12).fill(0.04), {});
        } else if (s.z.id === 'sauces') {
          G.drawBottle(g, s.x, s.y + 10, s.item, false);
        } else if (s.z.id === 'tops') {
          G.drawJar(g, s.x, s.y + 10, s.item, false);
        } else {
          const icon = { coldarm: 'suction', steady: 'scale', loupe: 'probe', sedative: 'fill', carbide: 'drill' }[s.item.id] || 'probe';
          G.drawTool(g, icon, s.x, s.y + 12, { t });
        }
        g.globalAlpha = 1;

        // name
        G.text(g, s.item.name.split(' ')[0], s.x, s.y - 40, owned ? P.steel2 : P.cream, { align: 'center', out: OUT });
        if (s.z.id === 'upgrades') G.text(g, s.item.desc, s.x, s.y + 38, '#4d6060', { align: 'center' });

        // price tag on a string
        const r = this.tagRect(s);
        if (owned) {
          G.frame(g, r.x, r.y, r.w, r.h, '#16281a');
          G.text(g, 'HELD', s.x, r.y + 4, P.neonG, { align: 'center' });
        } else {
          const hov = G.inRect(G.mouse.wx, G.mouse.wy, r.x - 4, r.y - 4, r.w + 8, r.h + 8);
          G.R(g, s.x, s.y + 12, 1, 6, '#8a7a58');
          G.frame(g, r.x, r.y, r.w, r.h, hov ? (afford ? '#3d5c28' : '#5c2b2b') : '#2a2418');
          G.text(g, '$' + s.item.price, s.x, r.y + 4, afford ? P.gold : '#8a6a6a', { align: 'center' });
        }
        if (isNew && Math.sin(t * 6) > 0) G.text(g, 'NEW', s.x + 26, s.y - 40, P.neonP, { out: OUT });
      }

      if (this.flash) {
        g.globalAlpha = 1 - this.flash.t / 0.6;
        G.oc(g, this.flash.x, this.flash.y, 10 + this.flash.t * 60, P.gold);
        g.globalAlpha = 1;
      }
      G.drawGoreWorld(g);
      G.cam.pop(g);

      // ---- screen HUD ----
      G.frame(g, 4, 3, 88, 18, '#16211f');
      G.fe(g, 16, 12, 4.5, 5.5, P.gold); G.R(g, 14, 8, 2, 2, '#fff3b0');
      G.text(g, '$' + Math.round(G.state.moneyShown), 26, 7, P.gold);
      G.text(g, 'STOCKROOM', G.W / 2, 8, P.steel2, { align: 'center', out: OUT });

      // minimap of the room
      const mw = 120, mx = G.W / 2 - mw / 2, my = 24;
      G.R(g, mx, my, mw, 6, '#0a1210');
      for (const z of ZONES) {
        G.R(g, mx + (z.x / SW) * mw, my, (z.w / SW) * mw, 6, '#2c3f3a');
      }
      G.R(g, mx + (camX / SW) * mw, my - 1, (G.W / SW) * mw, 8, '#ffffff44');
      G.R(g, mx + (camX / SW) * mw, my - 1, 1, 8, P.chrome);

      // edge arrows
      const atL = G.cam.tx <= 1, atR = G.cam.tx >= SW - G.W - 1;
      for (const [ex, dirL] of [[0, true], [G.W - 16, false]]) {
        if (dirL ? atL : atR) continue;
        g.globalAlpha = 0.5 + Math.sin(t * 3) * 0.14;
        G.R(g, ex, 120, 16, 180, '#0a1210');
        for (let i = 0; i < 3; i++) {
          const ax = dirL ? ex + 11 - i * 3 : ex + 5 + i * 3;
          G.R(g, ax, 208 - i * 2, 2, 4 + i * 4, P.steel2);
        }
        g.globalAlpha = 1;
      }

      G.drawBtn(g, G.W - 118, G.H - 34, 112, 26, 'NEXT DAY  →', { col: '#a8621f' });
      G.text(g, 'DRAG THE FLOOR TO WALK THE ROOM', 8, G.H - 14, '#3d5049');
      G.grade(g, 1);
    },
  };
})();

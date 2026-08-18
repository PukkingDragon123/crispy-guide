// ============================================================
// DOUBLE LIFE - shop.js
// Day summary screen + the mobile-style unlock shop
// (flavors / sauces / toppings / clinic upgrades).
// ============================================================
(function () {
  const G = window.GAME;
  const OUT = G.OUT;

  // ---------------- SUMMARY ----------------
  G.scenes.summary = {
    enter() {
      this.t = 0;
      const td = G.state.today || { dayEarn: 0, nightEarn: 0, cavCaused: 0, kidsServed: 0, perfect: 0, patients: [] };
      this.td = td;
      G.audio.music('title');
    },
    onDown(x, y) {
      if (this.t > 0.6 && G.inRect(x, y, 190, 232, 100, 20)) {
        G.audio.sfx('click');
        G.go('shop', 'SWEET SHOPPING');
      }
    },
    update(dt) { this.t += dt; },
    draw(g) {
      const t = this.t, td = this.td;
      G.R(g, 0, 0, 480, 270, '#2a1c3e');
      for (let i = 0; i < 40; i++) {
        const sx = (i * 97) % 480, sy = (i * 53) % 260;
        if (Math.sin(t * 2 + i) > -0.2) G.R(g, sx, sy, 1, 1, '#5d4b70');
      }
      G.drawSun(g, 120, 40, 10, t);
      G.drawMoon(g, 360, 40, 10);
      G.text(g, 'DAY ' + G.state.day + ' COMPLETE!', 240, 30, '#ffe66e', { align: 'center', out: OUT, sc: 2 });

      const rows = [
        ['SCOOPS SOLD', td.kidsServed + (td.kidsServed === 1 ? ' KID (' : ' KIDS (') + td.perfect + ' PERFECT)', '#ffc2d4'],
        ['ICE CREAM MONEY', '$' + td.dayEarn, '#ffe66e'],
        ['CLINIC MONEY', '$' + td.nightEarn, '#7fd6ff'],
        ['CAVITIES CAUSED', '' + td.cavCaused, '#c9a3ff'],
        ['CAVITIES FIXED', '' + td.cavCaused, '#7be98a'],
      ];
      let y = 70;
      for (let i = 0; i < rows.length; i++) {
        if (t < 0.25 + i * 0.22) break;
        G.panel(g, 120, y, 240, 18, '#3b2b40', OUT);
        G.text(g, rows[i][0], 130, y + 5, '#fff');
        G.text(g, rows[i][1], 350, y + 5, rows[i][2], { align: 'right' });
        y += 22;
      }
      if (t > 1.5) {
        G.text(g, 'CAUSE IT BY DAY... FIX IT BY NIGHT...', 240, 188, '#a88bb5', { align: 'center' });
        G.text(g, 'BUSINESS IS BOOMING! ♥', 240, 200, '#ff9ad5', { align: 'center' });
      }
      if (t > 0.6) G.drawBtn(g, 190, 232, 100, 20, 'SHOP →', { col: '#ff8fb0' });
      // total money
      G.panel(g, 4, 3, 64, 13, '#3b2b40', OUT);
      G.fe(g, 12, 9, 3, 4, '#ffd94a');
      G.text(g, '$' + Math.round(G.state.moneyShown), 20, 6, '#ffe66e');
    },
  };

  // ---------------- SHOP ----------------
  const TABS = [
    { id: 'flavors', label: 'FLAVORS', key: 'flavors', data: () => G.DATA.flavors },
    { id: 'sauces', label: 'SAUCES', key: 'sauces', data: () => G.DATA.sauces },
    { id: 'tops', label: 'TOPPINGS', key: 'tops', data: () => G.DATA.tops },
    { id: 'upgrades', label: 'CLINIC', key: 'upgrades', data: () => G.DATA.upgrades },
  ];

  G.scenes.shop = {
    enter() {
      this.t = 0;
      this.tab = 0;
      G.state.newIds = [];
      G.audio.music('title');
    },
    cardRect(i) {
      const col = i % 3, row = Math.floor(i / 3);
      return { x: 14 + col * 152, y: 58 + row * 42, w: 146, h: 38 };
    },
    onDown(x, y) {
      // tabs
      for (let i = 0; i < TABS.length; i++) {
        if (G.inRect(x, y, 14 + i * 90, 26, 84, 18)) { this.tab = i; G.audio.sfx('click'); return; }
      }
      // next day
      if (G.inRect(x, y, 356, 240, 110, 22)) {
        G.audio.sfx('day');
        G.state.day++;
        G.save();
        G.go('day', 'DAY ' + G.state.day + ' · SCOOPS OPEN!');
        return;
      }
      // buy buttons
      const tab = TABS[this.tab], items = tab.data();
      for (let i = 0; i < items.length; i++) {
        const r = this.cardRect(i), it = items[i];
        const owned = G.state[tab.key].includes(it.id);
        if (owned || it.price === 0) continue;
        if (G.inRect(x, y, r.x + r.w - 44, r.y + r.h - 18, 40, 14)) {
          if (G.state.money >= it.price) {
            G.state.money -= it.price;
            G.state.moneyShown = G.state.money;
            G.state[tab.key].push(it.id);
            G.state.newIds.push(it.id);
            G.save();
            G.audio.sfx('unlock');
            G.spark(r.x + r.w / 2, r.y + r.h / 2, ['#ffe66e', '#fff', '#ff9ad5'], 16, 70);
            G.toast('UNLOCKED: ' + it.name + '!', '#ffe66e');
          } else {
            G.audio.sfx('denied');
            G.toast('NOT ENOUGH COINS!', '#ffb0b0');
          }
          return;
        }
      }
    },
    update(dt) { this.t += dt; },
    drawIcon(g, tabId, it, x, y) {
      if (tabId === 'flavors') {
        for (let i = 0; i <= 7; i++) G.R(g, x - Math.round(3 * i / 7), y + 8 - i, Math.max(1, Math.round(3 * i / 7) * 2), 1, '#e0a35c');
        G.drawScoopBall(g, x, y - 3, 5, it, 0);
      } else if (tabId === 'sauces') {
        G.drawBottle(g, x, y + 10, it, false);
      } else if (tabId === 'tops') {
        G.drawJar(g, x, y + 8, it, false);
      } else {
        if (it.id === 'goldscoop') { G.ofc(g, x, y + 2, 5, '#ffd94a'); G.orr(g, x + 3, y - 8, 3, 9, '#e0a35c'); }
        if (it.id === 'bigbrush') G.drawTool(g, 'brush', x, y + 8);
        if (it.id === 'turbodrill') G.drawTool(g, 'drill', x, y + 8);
        if (it.id === 'comfy') { G.orr(g, x - 6, y - 4, 12, 10, '#7fb8d8'); G.orr(g, x - 6, y - 8, 12, 4, '#a8d2e8'); }
      }
    },
    draw(g) {
      const t = this.t;
      G.R(g, 0, 0, 480, 270, '#3b2b52');
      for (let x = 0; x < 480; x += 26) G.R(g, x, 0, 13, 270, '#41305c');
      G.text(g, 'THE SWEET SHOP', 240, 8, '#ffe66e', { align: 'center', out: OUT, sc: 1 });

      // tabs
      for (let i = 0; i < TABS.length; i++) {
        const sel = i === this.tab;
        G.panel(g, 14 + i * 90, 26, 84, 18, sel ? '#ff8fb0' : '#5d4b70', OUT);
        G.text(g, TABS[i].label, 14 + i * 90 + 42, 31, sel ? '#fff' : '#b8a8c5', { align: 'center' });
      }

      // cards
      const tab = TABS[this.tab], items = tab.data();
      for (let i = 0; i < items.length; i++) {
        const r = this.cardRect(i), it = items[i];
        const owned = G.state[tab.key].includes(it.id) || it.price === 0;
        G.panel(g, r.x, r.y, r.w, r.h, owned ? '#4a3d68' : '#fff4f8', OUT);
        this.drawIcon(g, tab.id, it, r.x + 16, r.y + 18);
        G.text(g, it.name, r.x + 34, r.y + 6, owned ? '#b8a8c5' : '#5d4b70');
        if (tab.id === 'upgrades') G.text(g, it.desc, r.x + 34, r.y + 16, owned ? '#8d7b95' : '#a88bb5');
        if (owned) {
          G.text(g, G.state[tab.key].includes(it.id) || it.price === 0 ? '✓ OWNED' : '', r.x + r.w - 8, r.y + r.h - 14, '#7be98a', { align: 'right' });
        } else {
          const afford = G.state.money >= it.price;
          G.drawBtn(g, r.x + r.w - 44, r.y + r.h - 18, 40, 14, '$' + it.price, { col: afford ? '#7bc96a' : '#8d8398', tcol: '#fff' });
        }
      }

      // money + next day
      G.panel(g, 4, 3, 70, 15, '#3b2b40', OUT);
      G.fe(g, 13, 10, 3.5, 4.5, '#ffd94a'); G.R(g, 12, 7, 1, 2, '#fff3b0');
      G.text(g, '$' + Math.round(G.state.moneyShown), 22, 7, '#ffe66e');
      const pulse = Math.sin(t * 5) > 0 ? 1 : 0;
      G.drawBtn(g, 356, 240, 110, 22, 'NEXT DAY →', { col: pulse ? '#ffb84d' : '#ffa53a' });
      G.text(g, 'BUY FLAVORS TO GET RICHER KIDS... AND RICHER CAVITIES', 14, 246, '#8d7b95');
    },
  };
})();

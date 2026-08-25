// ============================================================
// DOUBLE LIFE v5 - lab.js  ·  THE BACKROOMS
// Behind the café: a shelf, a mixer and a cold room. Order stock
// online through clause, drop ingredients into the mixer to invent
// a flavour, churn it into a batch, then load the batches onto the
// line for tomorrow.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  const TABS = ['ORDER', 'MIXER', 'THE LINE'];
  const SLOTS = 4;
  // mixer geometry, shared by the drawing and the hit tests so they cannot drift
  const HOP_Y = 43, SH_Y = 105, IDEA_Y = 106, CHURN_Y = 122;
  const PAGE = 7;                          // order rows per page

  const lab = (G.scenes = G.scenes || {}).lab = {
    enter() {
      this.t = 0;
      this.tab = 0;
      this.scroll = 0;
      this.slots = [null, null, null, null];
      this.preview = null;
      this.churn = 0;                      // 0..1 mixer animation
      this.churnFlav = null;
      this.suggest = null;
      this.sel = 0;                        // selected batch on the line tab
      G.steam.length = 0;
      G.audio.music('title');
      if (G.clause) {
        G.clause.enter('lab');
        if (G.state.tut < 9) G.clause.tut(8);
      }
    },

    // ---------------- helpers ----------------
    shelfList() {
      return G.DATA.ing.filter((i) => !i.illegal || G.state.day >= 2);
    },
    recompute() {
      const ids = this.slots.filter(Boolean);
      this.preview = ids.length >= 2 ? G.mixFlavour(ids, 3) : null;
    },
    batchSize() { return G.has('churn2') ? 16 : 8; },

    doChurn() {
      const ids = this.slots.filter(Boolean);
      if (ids.length < 2) { G.clause.say('THE MIXER NEEDS AT LEAST TWO THINGS.', P.warn, 2.6); return; }
      for (const id of ids) if ((G.state.shelf[id] || 0) <= 0) {
        G.clause.say('NO ' + G.ingById(id).name + ' ON THE SHELF.', P.warn, 2.6); return;
      }
      for (const id of ids) G.state.shelf[id]--;
      const f = G.mixFlavour(ids, (G.state.flavours.length * 17 + 5) % 9973);
      // if we have made this exact mix before, reuse the recipe
      const key = ids.slice().sort().join(',');
      const existing = G.state.flavours.find((x) => (x.parts || []).slice().sort().join(',') === key);
      const use = existing || f;
      if (!existing) G.state.flavours.push(f);
      const qty = this.batchSize();
      const bat = G.state.batches.find((b) => b.fid === use.id);
      if (bat) bat.qty += qty; else G.state.batches.push({ fid: use.id, qty });
      this.churn = 0.001;
      this.churnFlav = use;
      G.audio.sfx('unlock');
      G.clause.say((existing ? 'ANOTHER ' : 'NEW RECIPE: ') + use.name + '. ' + qty + ' SCOOPS.', P.lime, 3.2);
      G.save();
    },

    loadPit(pi) {
      const b = G.state.batches[this.sel];
      if (!b || b.qty <= 0) { G.clause.say('NOTHING SELECTED IN THE COLD ROOM.', P.warn, 2.4); return; }
      const pit = G.state.pits[pi] || (G.state.pits[pi] = { fid: null, qty: 0, max: 12 });
      const cap = G.has('chiller') ? 18 : 12;
      const take = Math.min(b.qty, cap);
      pit.fid = b.fid; pit.qty = take; pit.max = cap;
      b.qty -= take;
      if (b.qty <= 0) G.state.batches.splice(this.sel, 1);
      this.sel = G.clamp(this.sel, 0, Math.max(0, G.state.batches.length - 1));
      G.audio.sfx('clack');
      const f = G.flavById(pit.fid);
      G.clause.say('PIT ' + (pi + 1) + ' LOADED WITH ' + (f ? f.name : '?') + '.', P.cyanLt, 2.6);
      G.save();
    },

    // ---------------- input ----------------
    onDown(x, y) {
      if (G.clause && G.clause.onDown(x, y)) return;
      // tabs
      for (let i = 0; i < TABS.length; i++)
        if (G.inRect(x, y, 4 + i * 70, 16, 66, 13)) { this.tab = i; this.scroll = 0; G.audio.sfx('clack'); return; }
      // tray
      if (y >= 150) {
        if (G.inRect(x, y, 4, 152, 58, 16)) { G.audio.sfx('click'); G.go('day', 'THE CAFE'); return; }
        if (G.inRect(x, y, 66, 152, 52, 16)) { G.clause.ask('recipe'); return; }
        if (G.inRect(x, y, 122, 152, 52, 16)) { G.clause.ask('restock'); return; }
        return;
      }

      if (this.tab === 0) {                     // ---- ORDER ----
        const list = this.shelfList();
        for (let i = 0; i < PAGE; i++) {
          const k = this.scroll + i;
          if (k >= list.length) break;
          const ry = 45 + i * 12;
          const ing = list[k];
          if (G.inRect(x, y, 232, ry - 1, 34, 11)) { G.clause.order(ing.id, 1); G.save(); return; }
          if (G.inRect(x, y, 270, ry - 1, 42, 11)) { G.clause.order(ing.id, 5); G.save(); return; }
        }
        if (G.inRect(x, y, 10, 133, 18, 11)) { this.scroll = Math.max(0, this.scroll - PAGE); G.audio.sfx('clack'); return; }
        if (G.inRect(x, y, 32, 133, 18, 11)) {
          this.scroll = Math.min(Math.max(0, list.length - PAGE), this.scroll + PAGE);
          G.audio.sfx('clack'); return;
        }
        return;
      }

      if (this.tab === 1) {                     // ---- MIXER ----
        // slot row: click to clear
        for (let i = 0; i < SLOTS; i++)
          if (G.inRect(x, y, 8 + i * 30, HOP_Y, 26, 24)) { this.slots[i] = null; this.recompute(); G.audio.sfx('back'); return; }
        // shelf grid: click to load into the first free slot
        const have = this.shelfList().filter((i) => (G.state.shelf[i.id] || 0) > 0);
        for (let i = 0; i < have.length && i < 16; i++) {
          const gx = 8 + (i % 8) * 24, gy = SH_Y + Math.floor(i / 8) * 20;
          if (G.inRect(x, y, gx, gy, 22, 18)) {
            const free = this.slots.indexOf(null);
            if (free < 0) { G.clause.say('MIXER IS FULL. TAP A SLOT TO CLEAR IT.', P.warn, 2.4); return; }
            this.slots[free] = have[i].id;
            this.recompute();
            G.audio.sfx('grab');
            return;
          }
        }
        if (G.inRect(x, y, 210, CHURN_Y, 100, 20)) { this.doChurn(); return; }
        if (this.suggest && G.inRect(x, y, 210, IDEA_Y, 100, 14)) {
          this.slots = [null, null, null, null];
          for (let i = 0; i < Math.min(SLOTS, this.suggest.length); i++) this.slots[i] = this.suggest[i];
          this.recompute(); G.audio.sfx('clack'); return;
        }
        return;
      }

      // ---- THE LINE ----
      const bl = G.state.batches;
      for (let i = 0; i < bl.length && i < 6; i++)
        if (G.inRect(x, y, 8, 36 + i * 16, 132, 14)) { this.sel = i; G.audio.sfx('clack'); return; }
      const n = G.pitCount();
      for (let i = 0; i < 5; i++) {
        const px = 156 + (i % 3) * 54, py = 36 + Math.floor(i / 3) * 44;
        if (G.inRect(x, y, px, py, 50, 40)) {
          if (i >= n) { G.clause.say('THAT PIT IS NOT BUILT YET. ARMOURY.', P.warn, 2.6); return; }
          this.loadPit(i); return;
        }
      }
    },

    onUp() {},
    onWheel(d) {
      if (this.tab === 0) {
        const list = this.shelfList();
        this.scroll = G.clamp(this.scroll + (d > 0 ? 2 : -2), 0, Math.max(0, list.length - PAGE));
      }
    },

    update(dt) {
      this.t += dt;
      if (this.churn > 0) { this.churn += dt * 0.7; if (this.churn > 1) this.churn = 0; }
      G.updateSteam(dt);
      if (Math.random() < dt * 0.7) G.puffSteam(G.irand(20, 300), 176);
      if (G.clause) G.clause.update(dt);
      if (G.state.money !== G.state.moneyShown)
        G.state.moneyShown += (G.state.money - G.state.moneyShown) * Math.min(1, dt * 8);
    },

    // ---------------- draw ----------------
    draw(g) {
      const t = this.t;
      G.toastY = 138; G.toastCX = 110;
      // the backroom: bare block, pipes, a strip light
      G.R(g, 0, 0, G.W, G.H, '#111420');
      G.cityWall(g, 0, 0, G.W, G.H, t);
      g.globalAlpha = 0.45; G.R(g, 0, 0, G.W, G.H, '#0c0e16'); g.globalAlpha = 1;
      G.conduit(g, 0, 2, G.W, false, P.violet);
      G.R(g, 60, 10, 200, 2, '#e8f0d8');
      G.glow(g, 160, 60, 220, 120, '#dfe8ff', 0.5);

      // HUD
      G.plate(g, 2, 2, 54, 12, P.ink2, { r: 1, band: 1, spec: false });
      G.R(g, 6, 6, 4, 5, P.hazard);
      G.text(g, '$' + Math.round(G.state.moneyShown), 13, 4, P.hazard);
      G.plate(g, 60, 2, 76, 12, P.ink2, { r: 1, band: 1, spec: false });
      G.text(g, 'THE LAB · DAY ' + G.state.day, 64, 4, P.violetLt);

      // tabs
      for (let i = 0; i < TABS.length; i++) {
        const on = this.tab === i;
        G.plate(g, 4 + i * 70, 16, 66, 13, on ? '#3a2a5c' : '#1c1e2a', { r: 1, band: 1, spec: false });
        if (on) G.R(g, 4 + i * 70, 16, 66, 1, P.violetLt);
        G.text(g, TABS[i], 4 + i * 70 + 33, 19, on ? '#f0e8ff' : '#5a6070', { align: 'center' });
      }

      if (this.tab === 0) this.drawOrder(g, t);
      else if (this.tab === 1) this.drawMixer(g, t);
      else this.drawLine(g, t);

      G.drawSteam(g);
      // tray
      G.R(g, 0, 150, G.W, 30, '#0c0d16');
      G.R(g, 0, 150, G.W, 1, P.violet);
      G.drawBtn(g, 4, 152, 58, 16, '< CAFE', { col: '#2a5c6b' });
      G.drawBtn(g, 66, 152, 52, 16, 'IDEA', { col: G.tierIdx() >= 3 ? '#3a2a5c' : '#20242e' });
      G.drawBtn(g, 122, 152, 52, 16, 'RESTOCK', { col: G.tierIdx() >= 4 ? '#3a2a5c' : '#20242e' });
      G.text(g, 'CALLS ' + G.state.calls, 182, 156, P.steel);
      if (G.clause) { G.clause.at(300, 163, 166, 4, 286); G.clause.draw(g); }
      G.grade(g, 1);
    },

    // ---- the online order form ----
    drawOrder(g, t) {
      G.plate(g, 4, 32, 312, 114, '#0f1420', { r: 2, band: 1, lit: '#1d2836', dk: '#080c12', spec: false });
      for (let j = 34; j < 144; j += 3) { g.globalAlpha = 0.08; G.R(g, 6, j, 308, 1, P.cyanLt); g.globalAlpha = 1; }
      const list = this.shelfList();
      G.text(g, 'STOCK', 10, 34, P.cyanLt);
      G.text(g, 'ON SHELF', 176, 34, P.steel);
      G.text(g, 'x1', 249, 34, P.steel, { align: 'center' });
      G.text(g, 'x5', 291, 34, P.steel, { align: 'center' });
      for (let i = 0; i < PAGE; i++) {
        const k = this.scroll + i;
        if (k >= list.length) break;
        const ing = list[k], ry = 45 + i * 12;
        G.R(g, 8, ry - 1, 300, 11, i % 2 ? '#131a26' : '#0f1620');
        G.R(g, 10, ry + 1, 7, 7, OUT); G.R(g, 10, ry + 1, 6, 6, ing.col);
        G.text(g, ing.name, 20, ry, ing.illegal ? P.magentaLt : P.cream);
        // the properties that matter
        let px = 108;
        for (const k2 of ['sweet', 'rich', 'sour', 'bitter', 'cold', 'arom', 'grit', 'volt']) {
          if (!ing[k2]) continue;
          const col = k2 === 'volt' ? P.magenta : P.steel2;
          G.text(g, k2.slice(0, 2).toUpperCase() + ing[k2], px, ry, col);
          px += 18;
          if (px > 168) break;
        }
        G.text(g, '' + (G.state.shelf[ing.id] || 0), 196, ry, (G.state.shelf[ing.id] || 0) > 0 ? P.lime : '#4a5060');
        const aff1 = G.state.money >= ing.price, aff5 = G.state.money >= ing.price * 5;
        G.plate(g, 232, ry - 1, 34, 11, aff1 ? '#2a5c3a' : '#2a2028', { r: 1, band: 1, spec: false });
        G.text(g, '$' + ing.price, 249, ry, aff1 ? P.cream : '#6b5a60', { align: 'center' });
        G.plate(g, 270, ry - 1, 42, 11, aff5 ? '#2a4c5c' : '#2a2028', { r: 1, band: 1, spec: false });
        G.text(g, '$' + ing.price * 5, 291, ry, aff5 ? P.cream : '#6b5a60', { align: 'center' });
      }
      // paging strip, kept clear of the buy buttons
      const up = this.scroll > 0, dn = this.scroll + PAGE < list.length;
      G.R(g, 8, 130, 300, 1, '#1d2836');
      G.plate(g, 10, 133, 18, 11, up ? '#2a3a4c' : '#161c26', { r: 1, band: 1, spec: false });
      G.text(g, '^', 19, 135, up ? P.cream : '#3a4050', { align: 'center' });
      G.plate(g, 32, 133, 18, 11, dn ? '#2a3a4c' : '#161c26', { r: 1, band: 1, spec: false });
      G.text(g, 'v', 41, 135, dn ? P.cream : '#3a4050', { align: 'center' });
      G.text(g, (this.scroll + 1) + '-' + Math.min(list.length, this.scroll + PAGE) + ' OF ' + list.length,
        56, 135, P.steel);
      G.text(g, 'CLAUSE CAN RESTOCK THE LOT', 306, 135, '#3f4a5e', { align: 'right' });
    },

    // ---- the mixer ----
    drawMixer(g, t) {
      // the machine itself
      G.plate(g, 4, 32, 200, 112, '#161a26', { r: 2, band: 2, lit: '#242c3e', dk: '#0b0e16', spec: false });
      G.text(g, 'HOPPERS', 8, 34, P.violetLt);
      for (let i = 0; i < SLOTS; i++) {
        const sx = 8 + i * 30, sy = HOP_Y;
        G.plate(g, sx, sy, 26, 24, '#0f1218', { r: 1, band: 1, spec: false });
        const id = this.slots[i];
        if (id) {
          const ing = G.ingById(id);
          G.R(g, sx + 3, sy + 3, 20, 12, ing.col);
          G.R(g, sx + 3, sy + 3, 20, 2, G.shade(ing.col, 0.4));
          G.text(g, ing.name.slice(0, 4), sx + 13, sy + 17, P.cream, { align: 'center' });
        } else G.text(g, '+', sx + 13, sy + 8, '#3a4050', { align: 'center', sc: 2 });
      }
      // the drum - label sits clear to its right, nothing over the glass
      const dy = 70;
      G.plate(g, 8, dy, 112, 24, '#0f1218', { r: 2, band: 1, spec: false });
      const spin = this.churn > 0 ? t * 9 : t * 1.2;
      for (let i = 0; i < 4; i++) {
        const a = spin + i * Math.PI / 2;
        const px = 64 + Math.cos(a) * 34, py = dy + 12 + Math.sin(a) * 7;
        G.R(g, px - 2, py - 2, 5, 5, this.preview ? this.preview.col : P.hullDk);
      }
      if (this.preview) {
        G.gooScoop(g, 64, dy + 13, this.churn > 0 ? 7 + Math.sin(t * 20) * 2 : 7, this.preview, {});
      }
      G.text(g, 'DRUM', 126, dy + 4, '#4a5060');
      G.text(g, this.churn > 0 ? 'CHURNING' : 'IDLE', 126, dy + 13, this.churn > 0 ? P.lime : '#3a4050');

      // the shelf you can drop from
      G.text(g, 'SHELF', 8, SH_Y - 9, P.steel2);
      const have = this.shelfList().filter((i) => (G.state.shelf[i.id] || 0) > 0);
      for (let i = 0; i < have.length && i < 16; i++) {
        const gx = 8 + (i % 8) * 24, gy = SH_Y + Math.floor(i / 8) * 20;
        const ing = have[i];
        G.plate(g, gx, gy, 22, 18, '#1a2030', { r: 1, band: 1, spec: false });
        G.R(g, gx + 2, gy + 2, 18, 7, ing.col);
        G.text(g, ing.name.slice(0, 3), gx + 11, gy + 11, P.cream, { align: 'center' });
        G.text(g, '' + G.state.shelf[ing.id], gx + 18, gy + 1, P.lime, { align: 'right' });
      }
      if (!have.length) G.text(g, 'SHELF IS BARE - GO TO ORDER', 104, SH_Y + 6, '#4a5060', { align: 'center' });

      // the read-out
      G.plate(g, 208, 32, 108, 72, '#0f1420', { r: 2, band: 1, spec: false });
      if (this.preview) {
        const f = this.preview;
        G.R(g, 212, 35, 100, 8, f.col);
        G.R(g, 212, 35, 100, 2, G.shade(f.col, 0.45));
        G.text(g, f.name.slice(0, 16), 262, 45, f.illegal ? P.magentaLt : P.cream, { align: 'center' });
        let ry = 54;
        const shown = G.DATA.props.filter((k) => f[k] > 0).sort((a, b) => f[b] - f[a]).slice(0, 5);
        for (const k of shown) {
          G.text(g, k.toUpperCase(), 212, ry, k === 'volt' ? P.magenta : P.steel2);
          G.R(g, 258, ry + 1, 50, 5, '#0d1220');
          G.R(g, 258, ry + 1, Math.round(50 * G.clamp(f[k] / 10, 0, 1)), 5, k === 'volt' ? P.magenta : P.cyan);
          ry += 9;
        }
        if (G.has('assay')) {
          G.text(g, 'VALUE $' + f.value, 212, 97, P.hazard);
          G.text(g, 'COST $' + f.cost, 312, 97, P.warn, { align: 'right' });
        }
      } else {
        G.text(g, 'LOAD TWO OR MORE', 262, 58, '#4a5060', { align: 'center' });
        G.text(g, 'HOPPERS', 262, 68, '#4a5060', { align: 'center' });
      }
      if (this.suggest) G.drawBtn(g, 210, IDEA_Y, 100, 14, 'USE IDEA', { col: '#3a2a5c' });
      G.drawBtn(g, 210, CHURN_Y, 100, 20, 'CHURN x' + this.batchSize(),
        { col: this.preview ? '#2f8a48' : '#20242e' });
    },

    // ---- the cold room and the line ----
    drawLine(g, t) {
      G.plate(g, 4, 32, 144, 112, '#0f1420', { r: 2, band: 1, spec: false });
      G.text(g, 'COLD ROOM', 8, 34, P.cyanLt);
      const bl = G.state.batches;
      if (!bl.length) G.text(g, 'NOTHING CHURNED', 76, 84, '#4a5060', { align: 'center' });
      for (let i = 0; i < bl.length && i < 6; i++) {
        const b = bl[i], f = G.flavById(b.fid);
        const ry = 36 + i * 16, on = this.sel === i;
        G.plate(g, 8, ry, 132, 14, on ? '#2a4c5c' : '#182030', { r: 1, band: 1, spec: false });
        if (on) G.R(g, 8, ry, 132, 1, P.cyanLt);
        G.R(g, 11, ry + 3, 8, 8, OUT);
        G.R(g, 11, ry + 3, 7, 7, f ? f.col : '#555');
        G.text(g, f ? f.name.slice(0, 13) : '?', 22, ry + 4, P.cream);
        G.text(g, b.qty + ' SC', 136, ry + 4, P.lime, { align: 'right' });
      }
      G.text(g, 'TAP A BATCH, THEN A PIT', 8, 135, '#4a5060');

      // the line
      const n = G.pitCount();
      for (let i = 0; i < 5; i++) {
        const px = 156 + (i % 3) * 54, py = 36 + Math.floor(i / 3) * 44;
        const pit = G.state.pits[i];
        const f = pit ? G.flavById(pit.fid) : null;
        if (i >= n) {
          G.plate(g, px, py, 50, 40, '#161822', { r: 1, band: 1, spec: false });
          G.text(g, 'LOCKED', px + 25, py + 17, '#3a4050', { align: 'center' });
          continue;
        }
        G.plate(g, px, py, 50, 40, P.plateDk, { r: 1, band: 1 });
        G.R(g, px + 3, py + 3, 44, 22, '#0b0d14');
        if (f) {
          G.R(g, px + 4, py + 4, 42, 20, f.col);
          G.R(g, px + 4, py + 4, 42, 2, G.shade(f.col, 0.45));
          G.text(g, f.name.split(' ')[0].slice(0, 7), px + 25, py + 12, G.shade(f.col, -0.7), { align: 'center' });
        } else G.text(g, 'EMPTY', px + 25, py + 11, '#4a5060', { align: 'center' });
        // battery
        const frac = pit && pit.max ? G.clamp(pit.qty / pit.max, 0, 1) : 0;
        G.R(g, px + 4, py + 28, 30, 8, '#12141c');
        G.R(g, px + 34, py + 30, 2, 4, P.hullDk);
        for (let k = 0; k < Math.round(frac * 5); k++)
          G.R(g, px + 5 + k * 6, py + 29, 5, 6, frac > 0.5 ? P.lime : frac > 0.22 ? P.hazard : P.magenta);
        G.text(g, 'P' + (i + 1), px + 46, py + 29, P.steel2, { align: 'right' });
      }
    },
  };
})();

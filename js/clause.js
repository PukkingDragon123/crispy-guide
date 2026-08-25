// ============================================================
// DOUBLE LIFE v5 - clause.js  ·  CLAUSE.AI
// The assistant the human left running on the café terminal. A
// starburst on a stand who walks you through the job, orders your
// ingredients, reads a customer's tastes, calls the district's
// trends, and closes the books at night.
//
// It only does what you are paying for. Buy a bigger plan in the
// armoury and more of it switches on.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  // Claude's colours
  const CO = '#d97757', COL = '#f0a184', COD = '#9c4a30', CINK = '#2a1610';

  // ------------------------------------------------------------
  // THE STARBURST. Tapered spokes off a centre, drawn per scanline
  // so it stays crisp. Spins gently, flares when it is talking.
  // ------------------------------------------------------------
  G.starburst = function (g, cx, cy, r, t, o) {
    o = o || {};
    cx = Math.round(cx); cy = Math.round(cy);
    const n = 8;
    const spin = (o.spin === false ? 0 : t * 0.35) + (o.phase || 0);
    const flare = 1 + (o.talk ? Math.sin(t * 9) * 0.12 : 0);
    const col = o.col || CO, lit = o.lit || COL, dk = COD;
    for (let i = 0; i < n; i++) {
      const a = spin + (i / n) * Math.PI * 2;
      const len = r * flare * (i % 2 ? 0.66 : 1);
      const ca = Math.cos(a), sa = Math.sin(a);
      const steps = Math.max(2, Math.round(len));
      for (let k = 0; k <= steps; k++) {
        const p = k / steps;
        const w = Math.max(1, Math.round(r * 0.36 * (1 - p * 0.92)));
        const px = cx + ca * len * p, py = cy + sa * len * p;
        G.R(g, Math.round(px - w / 2) - 1, Math.round(py - w / 2) - 1, w + 2, w + 2, OUT);
      }
      for (let k = 0; k <= steps; k++) {
        const p = k / steps;
        const w = Math.max(1, Math.round(r * 0.36 * (1 - p * 0.92)));
        const px = cx + ca * len * p, py = cy + sa * len * p;
        G.R(g, Math.round(px - w / 2), Math.round(py - w / 2), w, w, p < 0.35 ? lit : p > 0.75 ? dk : col);
      }
    }
    const hr = Math.max(2, Math.round(r * 0.3));
    G.rr2(g, cx - hr - 1, cy - hr - 1, hr * 2 + 2, hr * 2 + 2, OUT);
    G.rr2(g, cx - hr, cy - hr, hr * 2, hr * 2, lit);
    G.R(g, cx - 1, cy - 1, 2, 2, '#ffffff');
    if (!o.noGlow) G.glow(g, cx, cy, r * 2.2, r * 2.2, col, 0.8);
  };

  // ------------------------------------------------------------
  // THE TUTORIAL. Nine beats, each fired once, keyed off things
  // you actually do rather than a wall of text up front.
  // ------------------------------------------------------------
  const TUT = [
    { n: 0, txt: 'I AM CLAUSE. SHE LEFT ME RUNNING FOR YOU.' },
    { n: 1, txt: 'A MACHINE IS COMING. IT NAMES A CRAVING.' },
    { n: 2, txt: 'MATCH IT FROM A PIT. % IS HOW CLOSE.' },
    { n: 3, txt: 'PRESS A PIT AND SWEEP. STOP IN THE GREEN.' },
    { n: 4, txt: 'TAKE A CONE, THEN DROP THE BALL ON IT.' },
    { n: 5, txt: 'SAUCE AND TOPS OFF THE SHELF. THEN SERVE.' },
    { n: 6, txt: 'VOLT IN THE MIX BREAKS THEM. ON PURPOSE.' },
    { n: 7, txt: 'TONIGHT YOU CHARGE THEM TO FIX IT.' },
    { n: 8, txt: 'IN THE LAB YOU ORDER AND INVENT. ASK ME.' },
  ];

  // greedy word wrap into at most `max` lines that each fit `w` pixels
  function wrap(txt, w, max) {
    const words = txt.split(' '), out = [];
    let line = '';
    for (const word of words) {
      const cand = line ? line + ' ' + word : word;
      if (G.tw(cand) <= w || !line) line = cand;
      else { out.push(line); line = word; if (out.length >= max) break; }
    }
    if (out.length < max && line) out.push(line);
    return out;
  }

  const cl = G.clause = {
    ax: 300, ay: 164, barY: 137, barL: 4, barR: 292,
    msg: null, msgT: 0, msgCol: '#f4eeda',
    queue: [],
    t: 0, talk: 0,
    scene: 'day',
    open: false,                       // the report panel
    report: null,

    at(ax, ay, barY, barL, barR, inline) {
      this.ax = ax; this.ay = ay; this.barY = barY;
      this.barL = barL === undefined ? 4 : barL;
      this.barR = barR === undefined ? ax - 14 : barR;
      this.inline = !!inline;                 // tag beside the mark, for tight strips
    },
    enter(scene) {
      this.scene = scene;
      this.t = 0;
      this.open = false;
      this.queue.length = 0;
      if (scene === 'day') {
        if (G.state.tut < 1) this.tut(0);
        else this.say('SHIFT ' + G.state.day + '. DOORS OPEN.', COL, 2.4);
      }
    },

    say(txt, col, dur) {
      this.msg = txt; this.msgCol = col || '#f4eeda'; this.msgT = dur || 3.4;
      this.talk = Math.min(1.2, (dur || 3.4) * 0.5);
      G.audio.sfx('order');
    },
    // queue several lines to play in order
    lines(arr, col) {
      for (const a of arr) this.queue.push({ txt: a, col: col || '#f4eeda' });
      if (!this.msg) this.pump();
    },
    pump() {
      if (!this.queue.length) return;
      const q = this.queue.shift();
      this.say(q.txt, q.col, 3.0);
    },

    // fire tutorial beat n, once, and only in order
    tut(n) {
      if (G.state.tut > n) return;
      const step = TUT[n];
      if (!step) return;
      G.state.tut = n + 1;
      this.say(step.txt, COL, 4.2);
    },

    // ------------------------------------------------------------
    // ASKING IT THINGS. Each costs a call; the plan sets the cap
    // and which asks are unlocked at all.
    // ------------------------------------------------------------
    need(tier, what) {
      if (G.tierIdx() < tier) {
        this.say('THAT NEEDS THE ' + G.DATA.tiers[tier].name + ' PLAN.', P.warn, 3);
        return false;
      }
      if (G.state.calls <= 0) { this.say('OUT OF CALLS TODAY.', P.warn, 2.6); return false; }
      G.state.calls--;
      return true;
    },
    ask(kind) {
      if (kind === 'read') {
        if (!this.need(1)) return;
        const d = G.scenes.day, c = d && d.cust;
        if (!c) { this.say('NOBODY AT THE COUNTER.', P.steel2, 2.2); return; }
        c.read = true;
        const b = c.bot;
        this.lines([
          b.name + '. ' + b.job + '.',
          'WANTS ' + b.taste.toUpperCase() + '. HATES ' + (b.hates === 'none' ? 'NOTHING' : b.hates.toUpperCase()) + '.',
          '"' + b.line + '"',
        ], P.cyanLt);
        return;
      }
      if (kind === 'trend') {
        if (!this.need(2)) return;
        const dm = G.state.today.demand || {};
        this.lines([
          'DISTRICT IS CHASING ' + String(dm.hot || 'SWEET').toUpperCase() + ' TODAY.',
          'NOBODY WANTS ' + String(dm.cool || 'SOUR').toUpperCase() + '.',
          'EXPECT A LOT OF ' + G.botById(dm.crowd || 'police').name + '.',
        ], P.hazard);
        return;
      }
      if (kind === 'recipe') {
        if (!this.need(3)) return;
        const have = Object.keys(G.state.shelf).filter((k) => G.state.shelf[k] > 0);
        if (have.length < 2) { this.say('YOUR SHELF IS BARE. ORDER SOMETHING.', P.warn, 3); return; }
        // pick the best-scoring trio the shelf can actually make
        let best = null;
        for (let a = 0; a < have.length; a++) for (let b = a + 1; b < have.length; b++)
          for (let c = b + 1; c <= have.length; c++) {
            const ids = c === have.length ? [have[a], have[b]] : [have[a], have[b], have[c]];
            const f = G.mixFlavour(ids, 7);
            if (!f) continue;
            const score = f.value + f.volt * 2 - f.cost * 0.25;
            if (!best || score > best.score) best = { score, f, ids };
          }
        if (!best) { this.say('NOTHING WORTH CHURNING.', P.warn, 2.6); return; }
        this.lines([
          'TRY ' + best.ids.map((i) => G.ingById(i).name).join(' + '),
          'THAT MAKES ' + best.f.name + '. VALUE ' + best.f.value + ', VOLT ' + best.f.volt + '.',
        ], P.violetLt);
        if (G.scenes.lab) G.scenes.lab.suggest = best.ids.slice();
        return;
      }
      if (kind === 'forecast') {
        if (!this.need(3)) return;
        const v = G.state.today.volt;
        const s = Math.round(G.state.suspicion * 100);
        this.lines([
          'VOLT SERVED TODAY: ' + v + '. THAT IS ' + Math.max(1, Math.floor(v / 4)) + ' JOBS TONIGHT.',
          'HEAT AT ' + s + '%. ' + (s > 66 ? 'THEY ARE ASKING QUESTIONS.' : s > 33 ? 'KEEP IT STEADY.' : 'NOBODY SUSPECTS YOU.'),
        ], P.magentaLt);
        return;
      }
      if (kind === 'restock') {
        if (!this.need(4)) return;
        // enterprise: top the shelf up from what is cheap and useful
        let spent = 0;
        for (const id of ['cream', 'milk', 'sugar', 'vanilla', 'cocoa']) {
          const ing = G.ingById(id);
          if (spent + ing.price > G.state.money) break;
          G.state.shelf[id] = (G.state.shelf[id] || 0) + 2;
          spent += ing.price * 2;
        }
        G.state.money -= spent;
        G.state.today.spent += spent;
        this.say('SHELF TOPPED UP. $' + spent + '.', P.lime, 3);
        return;
      }
    },

    // buy one unit of an ingredient - the lab calls this
    order(id, qty) {
      const ing = G.ingById(id);
      if (!ing) return false;
      qty = qty || 1;
      let price = ing.price * qty;
      if (ing.illegal && G.has('virus')) price = Math.round(price * 0.5);
      if (ing.arom && G.hasAlly('a_garden')) price = Math.round(price * 0.5);
      if (price > G.state.money) { this.say('NOT ENOUGH FOR THAT.', P.warn, 2.2); return false; }
      G.state.money -= price;
      G.state.today.spent += price;
      G.state.shelf[id] = (G.state.shelf[id] || 0) + qty;
      G.audio.sfx('coin');
      this.say('ORDERED ' + qty + ' ' + ing.name + '. $' + price + '.'
        + (ing.illegal ? ' NO PAPER TRAIL.' : ''), ing.illegal ? P.magentaLt : P.lime, 2.6);
      return true;
    },

    // ------------------------------------------------------------
    // END OF DAY. What it can tell you depends on the plan.
    // ------------------------------------------------------------
    buildReport() {
      const d = G.state.today || {};
      const tier = G.tierIdx();
      const rows = [
        ['SERVED', '' + (d.served || 0), P.cream],
        ['COUNTER', '$' + (d.dayEarn || 0), P.hazard],
        ['WORKSHOP', '$' + (d.nightEarn || 0), P.cyanLt],
      ];
      if (tier >= 2) {
        rows.push(['STOCK SPENT', '$' + (d.spent || 0), P.warn]);
        rows.push(['VOLT SERVED', '' + (d.volt || 0), P.magentaLt]);
        rows.push(['JOBS FIXED', '' + (d.fixed || 0), P.lime]);
      }
      if (tier >= 3) {
        rows.push(['MISDIAGNOSED', '' + (d.misdx || 0), P.magenta]);
        rows.push(['HEAT', Math.round(G.state.suspicion * 100) + '%',
          G.state.suspicion > 0.6 ? P.magenta : P.lime]);
      }
      if (tier >= 4) rows.push(['FREED', '' + G.state.freed + ' PEOPLE', P.violetLt]);
      const net = (d.dayEarn || 0) + (d.nightEarn || 0) - (d.spent || 0);
      // log the shift so the trend panel has something to draw
      const h = G.state.hist || (G.state.hist = []);
      const last = h[h.length - 1];
      if (last && last.d === G.state.day) { last.net = net; last.served = d.served || 0; }
      else h.push({ d: G.state.day, net: net, served: d.served || 0 });
      while (h.length > 8) h.shift();
      this.report = { rows, net, tier, hist: h };
      return this.report;
    },

    // ------------------------------------------------------------
    update(dt) {
      this.t += dt;
      if (this.msgT > 0) {
        this.msgT -= dt;
        if (this.msgT <= 0) { this.msg = null; this.pump(); }
      }
      if (this.talk > 0) this.talk -= dt;
    },

    // returns true when it swallowed the click
    onDown(x, y) {
      // the avatar itself: tap for the next tutorial beat or a nudge
      if (G.inRect(x, y, this.ax - 11, this.ay - 11, 22, 24)) {
        if (G.state.tut < TUT.length) this.tut(G.state.tut);
        else this.say(G.pick([
          'STILL HERE.',
          'THE PITS DRAIN. WATCH THE BATTERIES.',
          'SHE WOULD HAVE LIKED THIS ONE.',
          'HEAT AT ' + Math.round(G.state.suspicion * 100) + '%.',
          'ASK ME FOR A READ ON THE NEXT ONE.',
        ]), COL, 2.8);
        return true;
      }
      return false;
    },

    // the avatar on its stand, top right, plus the speech bar
    draw(g) {
      const t = this.t;
      const ax = this.ax, ay = this.ay;
      G.starburst(g, ax, ay, this.inline ? 6 : 8, t, { talk: this.talk > 0 });
      if (this.inline) {
        G.R(g, ax + 8, ay - 4, 28, 8, '#1a1214');
        G.text(g, G.tier().name.slice(0, 5), ax + 10, ay - 3, CO);
      } else {
        G.R(g, ax - 11, ay + 9, 22, 7, '#1a1214');
        G.text(g, G.tier().name.slice(0, 5), ax, ay + 10, CO, { align: 'center' });
      }
      if (this.msg) {
        // one line if it fits, otherwise the strip grows upward - never sideways
        const maxw = this.barR - this.barL;
        const ls = wrap(this.msg, maxw - 12, 3);
        let tw = 0;
        for (const l of ls) tw = Math.max(tw, G.tw(l));
        const w = Math.min(maxw, tw + 12);
        const h = 6 + ls.length * 9 - 2;
        const bx = this.barR - w, by = this.barY + 13 - h;
        G.plate(g, bx, by, w, h, '#1a1214', { r: 2, band: 1, lit: '#33201a', dk: '#0d0806', spec: false });
        G.R(g, bx + 1, by + 1, w - 2, 1, CO);
        for (let i = 0; i < ls.length; i++) G.text(g, ls[i], bx + 5, by + 4 + i * 9, this.msgCol);
      }
    },

    // a full-screen report card, used by the summary scene
    drawReport(g, t) {
      const r = this.report || this.buildReport();
      G.plate(g, 22, 16, 276, 136, '#141018', { r: 2, band: 2, lit: '#241a22', dk: '#0a070c', spec: false });
      G.R(g, 24, 18, 272, 1, CO);
      G.starburst(g, 42, 34, 8, t, { talk: 1 });
      G.text(g, 'CLAUSE.AI  ·  SHIFT ' + G.state.day, 58, 30, COL);
      G.text(g, G.tier().name + ' PLAN', 58, 40, CO);
      G.R(g, 30, 50, 260, 1, '#33201a');
      for (let i = 0; i < r.rows.length; i++) {
        const row = r.rows[i], ry = 52 + i * 9;
        G.text(g, row[0], 34, ry, P.steel2);
        G.text(g, row[1], 168, ry, row[2], { align: 'right' });
      }

      // ---- the trend, in the space the ledger does not need ----
      const hs = r.hist || [];
      G.R(g, 176, 52, 1, 68, '#33201a');
      G.text(g, 'SHIFT NET', 184, 52, CO);
      const base = 114, top = 64;
      G.R(g, 184, base, 104, 1, '#33201a');
      let peak = 1;
      for (const e of hs) peak = Math.max(peak, Math.abs(e.net));
      const now = hs.length ? hs[hs.length - 1] : null;
      if (now) G.text(g, '$' + now.net, 292, 52, now.net >= 0 ? P.lime : P.magenta, { align: 'right' });
      for (let i = 0; i < hs.length; i++) {
        const e = hs[i], bx = 184 + i * 13;
        const hgt = Math.max(2, Math.round((Math.abs(e.net) / peak) * (base - top)));
        const up = e.net >= 0, last = i === hs.length - 1;
        G.R(g, bx, up ? base - hgt : base + 1, 11, hgt, up ? (last ? '#2f8a48' : '#255f36') : '#8a2f42');
        G.R(g, bx, up ? base - hgt : base + hgt, 11, 1, up ? P.lime : P.magenta);
        G.text(g, '' + e.d, bx + 5, base + 3, last ? CO : '#5a4a44', { align: 'center' });
      }
      // the day numbers under the bars are the legend; anything more collides
      // with the NET rule below
      const ny = 52 + r.rows.length * 9 + 2;
      G.R(g, 30, ny, 260, 1, '#33201a');
      G.text(g, 'NET', 34, ny + 3, P.cream);
      G.text(g, '$' + r.net, 286, ny + 3, r.net >= 0 ? P.lime : P.magenta, { align: 'right' });
      if (ny + 14 < 142)
        G.text(g, r.tier < 4 ? 'UPGRADE MY PLAN FOR THE REST OF THE NUMBERS.' : 'ALL OF IT. NO LIMITS.',
          160, ny + 14, '#6b5248', { align: 'center' });
    },
  };
})();

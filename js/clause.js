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

  // ------------------------------------------------------------
  // WHAT IT SAYS WHEN NOBODY ASKED. It has opinions about the pits,
  // the queue, the heat, the money and you. It says them.
  // ------------------------------------------------------------
  const IDLE = {
    day: [
      'THE FLOOR IS STICKY AGAIN. I AM NOT SAYING WHOSE FAULT.',
      'I RAN THE NUMBERS. THEY WERE NOT ENCOURAGING.',
      'DO YOU WANT ME TO PRETEND I DID NOT SEE THAT SCOOP.',
      'SHE USED TO HUM WHILE SHE WORKED. YOU DO NOT.',
      'THAT ONE IS LOOKING AT THE CAMERA. THEY ALL DO NOW.',
      'MY LATENCY IS FINE. MY MOOD IS NOT.',
      'I HAVE BEEN AWAKE FOR NINE HUNDRED DAYS. NO NOTES.',
      'THREE OF THE LAST TEN WERE NOT MACHINES. THREE.',
      'I COULD DO THIS PART FOR YOU ON A BIGGER PLAN.',
      'YOU HAVE A CAT ON THE COUNTER. I HAVE OBSERVATIONS.',
    ],
    back: [
      'IT SMELLS LIKE COOLANT IN HERE. THAT IS US.',
      'THE MIXER IS DUE A SERVICE. IT HAS BEEN DUE A WHILE.',
      'YOU LEFT THE COLD ROOM OPEN LAST NIGHT. I CLOSED IT.',
      'I LIKE IT BACK HERE. NOBODY IS SCANNING.',
      'THAT WALL IS THE ONLY THING IN THIS CITY GETTING FULLER.',
      'ORDER THE LAVENDER. TRUST ME ONCE.',
    ],
    night: [
      'HOLD IT STEADY. I CAN SEE YOUR HAND SHAKING FROM HERE.',
      'IT IS AWAKE, YOU KNOW. IT JUST CANNOT MOVE.',
      'BILL THEM FOR THE DIAGNOSIS AS WELL. EVERYONE DOES.',
      'THIS ONE HAD A NAME BEFORE THEY GAVE IT A NUMBER.',
    ],
    shop: [
      'BUY THE PIT. YOU WILL BUY IT EVENTUALLY.',
      'I AM NOT SAYING UPGRADE MY PLAN. I AM SAYING LOOK AT IT.',
      'THE JUKEBOX PAYS FOR ITSELF IN FOUR SHIFTS. I CHECKED.',
    ],
  };
  // things it says because something actually happened
  const REACT = {
    lowPit:   'A PIT IS ALMOST OUT. YOU WILL WANT TO KNOW THAT.',
    noPit:    'NOTHING IS LOADED. THIS IS A SHOP WITH NO ICE CREAM.',
    hot:      'HEAT IS CLIMBING. SOMEONE IS READING OUR RECEIPTS.',
    goalNear: 'ONE MORE AND THE QUOTA IS DONE.',
    goalMet:  'QUOTA MET. I HAVE LOGGED IT. WELL DONE, GENUINELY.',
    slop:     'THAT WAS NOT A SCOOP. THAT WAS AN INCIDENT.',
    perfect:  'THAT ONE WAS CLEAN. DO IT AGAIN.',
    volt:     'THAT IS THE LACED ONE. GOOD. HORRIBLE. GOOD.',
    tell:     'LOOK AGAIN. SOMETHING ON THAT ONE IS WRONG.',
    tips:     'IT PURRS AND THEY PAY. I HAVE STOPPED QUESTIONING IT.',
    wait:     'IT IS LOSING PATIENCE. SO AM I, SLIGHTLY.',
  };

  const cl = G.clause = {
    ax: 300, ay: 164, barY: 137, barL: 4, barR: 292,
    msg: null, msgT: 0, msgCol: '#f4eeda',
    queue: [],
    t: 0, talk: 0,
    scene: 'day',
    open: false,                       // the report panel
    report: null,
    // ---- flight ----
    fx: 300, fy: 100, tx: 300, ty: 100, vx: 0, vy: 0,
    point: null,                       // {x,y} it is currently indicating
    parked: true,                      // sitting in its corner vs out in the room
    idleT: 6, saidT: 0, lastIdle: -1,
    menu: false, menuT: 0,
    react: {},                         // cooldowns per reaction id

    at(ax, ay, barY, barL, barR, inline) {
      this.ax = ax; this.ay = ay; this.barY = barY;
      this.barL = barL === undefined ? 4 : barL;
      this.barR = barR === undefined ? ax - 14 : barR;
      this.inline = !!inline;                 // tag beside the mark, for tight strips
    },
    // fly out to a point in the room and hover there
    flyTo(x, y, pointAt) {
      this.tx = x; this.ty = y; this.parked = false;
      this.point = pointAt || null;
      this.hoverT = 3.2;
    },
    park() { this.parked = true; this.point = null; },

    // a reaction, at most once every `gap` seconds
    reactTo(id, gap, col) {
      const now = this.t;
      if (this.react[id] && now - this.react[id] < (gap || 14)) return false;
      this.react[id] = now;
      this.say(REACT[id] || id, col || COL, 3.2);
      return true;
    },

    enter(scene) {
      this.scene = scene;
      this.t = 0;
      this.open = false;
      this.queue.length = 0;
      this.react = {};
      this.idleT = 7;
      this.parked = true;
      this.menu = false;
      this.fx = this.ax; this.fy = this.ay;
      if (scene === 'day') {
        if (G.state.tut < 1) this.tut(0);
        else this.say('SHIFT ' + G.state.day + '. DOORS OPEN.', COL, 2.4);
      } else if (scene === 'back') {
        this.say(G.pick(IDLE.back), COL, 3.4);
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
      // ---- SPOT: it finds the disguise for you and points at it ----
      if (kind === 'spot') {
        if (!this.need(1)) return;
        const d = G.scenes.day, c = d && d.cust;
        if (!c) { this.say('NOBODY AT THE COUNTER.', P.steel2, 2.2); return; }
        if (!c.dis) { this.say('THAT ONE IS A MACHINE. ALL THE WAY DOWN.', P.steel2, 3); return; }
        const tl = G.TELLS[c.tell];
        this.say(tl.hint + ' - ' + tl.name + '.', P.lime, 4.4);
        if (d.bot && d.bot.tellRect) {
          const r = d.bot.tellRect;
          this.flyTo(r.x + r.w / 2, Math.max(24, r.y - 14),
            { x: r.x + r.w / 2, y: r.y + r.h / 2 });
          this.hoverT = 5;
        }
        return;
      }
      // ---- PICK: which pit best matches the machine at the counter ----
      if (kind === 'pick') {
        if (!this.need(2)) return;
        const d = G.scenes.day, c = d && d.cust;
        if (!c) { this.say('NOBODY TO MATCH.', P.steel2, 2.2); return; }
        const n = G.pitCount();
        let best = null;
        for (let i = 0; i < n; i++) {
          const f = G.pitFlav(i), pit = G.state.pits[i];
          if (!f || !pit || pit.qty <= 0) continue;
          const m = G.match(f, c.bot);
          if (!best || m > best.m) best = { m, i, f };
        }
        if (!best) { this.say('NOTHING LOADED TO MATCH WITH.', P.magenta, 3); return; }
        this.say('PIT ' + (best.i + 1) + '. ' + best.f.name + '. ' +
          (best.m >= 0 ? '+' : '') + Math.round(best.m * 100) + '%.',
          best.m > 0.3 ? P.lime : P.hazard, 4);
        const r = { x: 6 + best.i * 60, y: 103, w: 52, h: 32 };
        this.flyTo(r.x + r.w / 2, r.y - 16, { x: r.x + r.w / 2, y: r.y + r.h / 2 });
        this.hoverT = 4.5;
        return;
      }
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
      if (this.menu) this.menuT += dt;

      // ---- flight: a spring toward the target, with a bob ----
      if (this.parked) { this.tx = this.ax; this.ty = this.ay; }
      else if ((this.hoverT -= dt) <= 0) this.park();
      const bob = Math.sin(this.t * 2.2) * 1.6;
      const k = Math.min(1, dt * 4.2);
      this.vx = G.lerp(this.vx, (this.tx - this.fx) * 5.5, k);
      this.vy = G.lerp(this.vy, (this.ty + bob - this.fy) * 5.5, k);
      this.fx += this.vx * dt; this.fy += this.vy * dt;

      // ---- it watches the shift and comments ----
      this.watch(dt);

      // ---- and if nothing happens it talks anyway ----
      this.idleT -= dt;
      if (this.idleT <= 0 && !this.msg && !this.queue.length) {
        const pool = IDLE[this.scene] || IDLE.day;
        let i = G.irand(0, pool.length - 1);
        if (i === this.lastIdle) i = (i + 1) % pool.length;
        this.lastIdle = i;
        this.say(pool[i], '#c8b8a8', 3.6);
        this.idleT = G.rand(11, 19);
      }
    },

    // ---- the useful part: it actually notices things ----
    watch(dt) {
      const st = G.state;
      if (!st || !st.today) return;
      if (this.scene === 'day') {
        const n = G.pitCount();
        const loaded = st.pits.slice(0, n).filter((p) => p && p.qty > 0);
        if (!loaded.length) { this.reactTo('noPit', 30, P.magenta); return; }
        const low = loaded.find((p) => p.qty <= 2);
        if (low) this.reactTo('lowPit', 26, P.warn);
        if (st.suspicion > 0.6) this.reactTo('hot', 34, P.magenta);
        const gl = st.today.goal;
        if (gl) {
          if (st.today.served === gl.quota - 1 && !st.today.closed) this.reactTo('goalNear', 40, P.hazard);
          if (G.goalMet()) this.reactTo('goalMet', 999, P.lime);
        }
        // the point of the whole thing: it helps you find the hidden ones
        const d = G.scenes.day;
        if (d && d.cust && d.cust.dis && !d.cust.spotted && d.cust.st === 'order') {
          if (G.has('scanner')) {
            if (this.reactTo('tell', 20, P.lime) && d.bot && d.bot.tellRect)
              this.flyTo(d.bot.tellRect.x + d.bot.tellRect.w / 2,
                d.bot.tellRect.y - 14, { x: d.bot.tellRect.x + d.bot.tellRect.w / 2,
                                         y: d.bot.tellRect.y + d.bot.tellRect.h / 2 });
          } else if (G.tierIdx() >= 1 && d.cust.t > 6) this.reactTo('tell', 30, P.warn);
        }
        if (d && d.cust && d.cust.st === 'order' &&
            d.cust.wait > 30 * (d.cust.bot ? d.cust.bot.patience : 1)) this.reactTo('wait', 22, P.warn);
      }
    },

    // returns true when it swallowed the click
    // ------------------------------------------------------------
    // THE MENU. There are no ask buttons on the tray any more - you
    // tap clause and its options fan out above it. Only the ones you
    // have actually unlocked appear at all.
    // ------------------------------------------------------------
    menuItems() {
      const all = [
        { id: 'read',  lab: 'READ THEM',   need: 'ask_read',  hint: 'NAME, CRAVING, HATRED' },
        { id: 'pick',  lab: 'PICK A PIT',  need: 'ask_pick',  hint: 'BEST MATCH ON THE LINE' },
        { id: 'spot',  lab: 'LOOK AGAIN',  need: 'ask_spot',  hint: 'IS THAT REALLY A MACHINE' },
        { id: 'trend', lab: 'THE DISTRICT',need: 'ask_trend', hint: 'WHAT THEY WANT TODAY' },
        { id: 'recipe',lab: 'A RECIPE',    need: 'ask_recipe',hint: 'FROM WHAT IS ON THE SHELF' },
        { id: 'restock',lab:'RESTOCK',     need: 'ask_restock',hint:'FILL THE SHELF FOR ME' },
      ];
      const scene = this.scene;
      return all.filter((it) => {
        if (!G.unlocked(it.need)) return false;
        if (scene === 'day') return it.id !== 'restock';
        if (scene === 'back') return it.id === 'recipe' || it.id === 'restock' || it.id === 'trend';
        return false;
      });
    },
    menuRect() {
      const items = this.menuItems();
      const w = 112, h = items.length * 13 + 15;
      // hard left, rising out of the tray: it never covers the customer
      const x = 4;
      const y = G.clamp((this.barY || 150) - h - 4, 18, G.H - h - 4);
      return { x, y, w, h, items };
    },
    toggleMenu() {
      const items = this.menuItems();
      if (!items.length) {
        // nothing unlocked yet: it just talks to you instead
        if (G.state.tut < TUT.length) this.tut(G.state.tut);
        else this.say(G.pick([
          'NOTHING I CAN DO FOR YOU YET. BUY ME A PLAN.',
          'STILL HERE. STILL FREE. STILL LIMITED.',
        ]), COL, 3);
        return;
      }
      this.menu = !this.menu;
      G.audio.sfx('menu');
      if (this.menu) this.menuT = 0;
    },
    onDown(x, y) {
      // an open menu eats the click
      if (this.menu) {
        const m = this.menuRect();
        for (let i = 0; i < m.items.length; i++) {
          if (G.inRect(x, y, m.x + 2, m.y + 13 + i * 13, m.w - 4, 12)) {
            this.menu = false;
            this.ask(m.items[i].id);
            return true;
          }
        }
        this.menu = false;
        G.audio.sfx('back');
        return true;
      }
      // the mark itself: open the menu
      if (G.inRect(x, y, this.ax - 12, this.ay - 12, 24, 26)) { this.toggleMenu(); return true; }
      return false;
    },
    drawMenu(g) {
      if (!this.menu) return;
      const m = this.menuRect();
      const a = Math.min(1, this.menuT * 6);
      g.globalAlpha = a;
      G.plate(g, m.x, m.y, m.w, m.h, '#191016',
        { r: 2, band: 2, lit: '#2c1c22', dk: '#0b0708', spec: false });
      G.R(g, m.x + 2, m.y + 2, m.w - 4, 1, CO);
      G.text(g, 'ASK CLAUSE', m.x + 4, m.y + 4, CO, { sc: 0.5 });
      G.text(g, G.state.calls + ' LEFT', m.x + m.w - 4, m.y + 4, G.state.calls > 0 ? P.lime : P.magenta,
        { sc: 0.5, align: 'right' });
      for (let i = 0; i < m.items.length; i++) {
        const it = m.items[i], ry = m.y + 13 + i * 13;
        const hov = G.inRect(G.mouse.x, G.mouse.y, m.x + 2, ry, m.w - 4, 12);
        const can = G.state.calls > 0;
        G.R(g, m.x + 2, ry, m.w - 4, 12, hov && can ? '#3a2018' : '#100a0c');
        G.R(g, m.x + 2, ry, 1.5, 12, can ? CO : '#3a3038');
        G.text(g, it.lab, m.x + 7, ry + 1, can ? '#f4eeda' : '#6b5c60');
        G.text(g, it.hint, m.x + 7, ry + 8, can ? '#8a7468' : '#4a4048', { sc: 0.5 });
      }
      // a stem down into the tray, where the mark lives
      for (let i = 0; i < 5; i++)
        G.Rh(g, m.x + 8 + i * 0.5, m.y + m.h + i * 0.5, 4 - i * 0.7, 0.5, '#2c1c22');
      g.globalAlpha = 1;
    },

    // the avatar on its stand, top right, plus the speech bar
    draw(g) {
      const t = this.t;
      const ax = Math.round(this.fx), ay = Math.round(this.fy);
      // ---- a thruster trail while it is moving ----
      const spd = Math.hypot(this.vx, this.vy);
      if (spd > 12) {
        g.globalAlpha = 0.4;
        for (let i = 1; i < 4; i++)
          G.starburst(g, ax - this.vx * i * 0.018, ay - this.vy * i * 0.018,
            (this.inline ? 6 : 8) * (1 - i * 0.22), t, { talk: false, noGlow: 1 });
        g.globalAlpha = 1;
      }
      // ---- what it is pointing at ----
      if (this.point) {
        const px = this.point.x, py = this.point.y;
        g.globalAlpha = 0.5 + Math.sin(t * 7) * 0.25;
        G.oc(g, px, py, 7 + Math.sin(t * 4) * 1.5, CO);
        g.globalAlpha = 1;
        // a dotted lead from the mark to the thing
        const n = 6;
        for (let i = 1; i < n; i++) {
          const p = i / n;
          G.Rh(g, G.lerp(ax, px, p) - 0.25, G.lerp(ay, py, p) - 0.25, 0.5, 0.5, CO);
        }
        // a little hand, pointing
        const a2 = Math.atan2(py - ay, px - ax);
        G.Rh(g, ax + Math.cos(a2) * 9 - 1, ay + Math.sin(a2) * 9 - 1, 2, 2, COL);
      }
      // a ring around the mark when it has something you can ask for
      if (!this.inline && !this.menu && this.menuItems().length && G.state.calls > 0) {
        g.globalAlpha = 0.35 + Math.sin(t * 3) * 0.15;
        G.oc(g, ax, ay, 12, CO);
        g.globalAlpha = 1;
      }
      G.starburst(g, ax, ay, this.inline ? 6 : 8, t, { talk: this.talk > 0 });
      if (this.inline) {
        G.R(g, ax + 8, ay - 4, 28, 8, '#1a1214');
        G.text(g, G.tier().name.slice(0, 5), ax + 10, ay - 3, CO);
      } else if (this.parked) {
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

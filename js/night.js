// ============================================================
// DOUBLE LIFE v5 - night.js  ·  THE WORKSHOP
// 320x180. What you opened up depends on what walked in. A siege
// unit is plate and bolts; an orchestra unit is strings and a
// resonator; a records unit is a gear train and a mainspring.
// Eight interiors, twenty-four repairs, five ways of using a tool:
// hold on it, sweep it, wind it, click each, or drag it home.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  const BAY = { x: 28, y: 32, w: 264, h: 90 };
  const TRAY_Y = 152;

  // ------------------------------------------------------------
  // Every repair is one of five gestures.
  //   hold   - keep the tool on a spot
  //   sweep  - drag across a set of spots
  //   wind   - drag in circles about a centre
  //   click  - tap each spot once
  //   drag   - pick a thing up and put it somewhere
  // ------------------------------------------------------------
  const ACT = {
    seal:    [{ tool: 'clamp',   g: 'hold',  at: 'joint' }],
    airlock: [{ tool: 'bleed',   g: 'hold',  at: 'bubble' }],
    sludge:  [{ tool: 'purge',   g: 'sweep', at: 'plug' }, { tool: 'bleed', g: 'hold', at: 'joint' }],
    jam:     [{ tool: 'tweeze',  g: 'drag',  at: 'debris' }],
    spring:  [{ tool: 'wind',    g: 'wind',  at: 'spring' }],
    dry:     [{ tool: 'lube',    g: 'click', at: 'pivots' }, { tool: 'wind', g: 'wind', at: 'spring' }],
    scale:   [{ tool: 'descale', g: 'sweep', at: 'crust' }],
    over:    [{ tool: 'vent',    g: 'hold',  at: 'valve' }],
    out:     [{ tool: 'vent',    g: 'hold',  at: 'valve' }, { tool: 'ignite', g: 'click', at: 'burner' }],
    detune:  [{ tool: 'tune',    g: 'sweep', at: 'pegs' }],
    crack:   [{ tool: 'resin',   g: 'sweep', at: 'split' }],
    muted:   [{ tool: 'pick',    g: 'drag',  at: 'gunk' }, { tool: 'tune', g: 'sweep', at: 'pegs' }],
    dead:    [{ tool: 'patch',   g: 'hold',  at: 'node' }],
    cross:   [{ tool: 'probe',   g: 'click', at: 'ends' }, { tool: 'patch', g: 'hold', at: 'node' }],
    loop:    [{ tool: 'reset',   g: 'hold',  at: 'core' }],
    fog:     [{ tool: 'polish',  g: 'wind',  at: 'lens' }],
    mirror:  [{ tool: 'align',   g: 'drag',  at: 'mirror' }],
    iris:    [{ tool: 'free',    g: 'hold',  at: 'iris' }, { tool: 'polish', g: 'wind', at: 'lens' }],
    belt:    [{ tool: 'tension', g: 'drag',  at: 'belt' }],
    burnt:   [{ tool: 'rewind',  g: 'wind',  at: 'coil' }],
    skip:    [{ tool: 'calib',   g: 'hold',  at: 'encoder' }],
    buckle:  [{ tool: 'press',   g: 'hold',  at: 'dent' }],
    sheared: [{ tool: 'bolt',    g: 'click', at: 'holes' }],
    weldc:   [{ tool: 'weld',    g: 'sweep', at: 'seam' }, { tool: 'press', g: 'hold', at: 'dent' }],
  };

  const night = (G.scenes = G.scenes || {}).night = {
    enter() {
      if (!G.state.today) G.newDayStats();
      this.t = 0;
      this.pi = -1;
      this.tool = null;
      this.book = false;
      this.act = null;
      this.msg = null; this.msgT = 0;
      this.chips = [];
      this.doneAll = false;
      this.jolt = 0;
      this.winT = 0;
      G.steam.length = 0;
      const src = (G.state.today.jobs || []).slice();
      this.queue = src.length ? src
        : [{ id: 'police', name: 'PC-44', sys: 'optical', volt: 5, faults: ['fog', 'mirror'] }];
      G.audio.music('night');
      this.next();
      if (G.state.tut < 8) { this.say('READ THE SIGN, NAME THE FAULT, THEN PICK THE TOOL.', P.cyanLt); this.msgT = 5; }
    },

    // ---------------- setup ----------------
    next() {
      G.audio.stopAllLoops();
      this.pi++;
      this.act = null; this.book = false; this.tool = null;
      this.chips.length = 0;
      G.clearGore();
      if (this.pi >= this.queue.length) { this.doneAll = true; return; }
      const j = this.queue[this.pi];
      this.job = j;
      this.sys = G.sysById(j.sys);
      this.bot = G.botById(j.id);
      this.parts = this.buildParts(j.sys);
      this.faults = [];
      const seen = {};
      for (const fid of j.faults) {
        if (seen[fid]) continue;                     // one of each per machine
        seen[fid] = 1;
        const f = G.faultOf(j.sys, fid);
        if (!f) continue;
        this.faults.push({ id: fid, def: f, named: false, step: 0, prog: 0, done: false,
                           flash: 0, state: this.faultState(j.sys, fid) });
      }
      if (!this.faults.length) this.faults.push({ id: this.sys.faults[0].id, def: this.sys.faults[0],
        named: false, step: 0, prog: 0, done: false, flash: 0, state: this.faultState(j.sys, this.sys.faults[0].id) });
      this.sel = 0;
      this.mood = 'sick';
      G.audio.sfx('boot');
      this.say(this.faults.length + ' FAULT' + (this.faults.length > 1 ? 'S' : '')
        + ' IN THE ' + this.sys.name + '.', P.cyanLt);
    },

    // fixed furniture for each system, laid out inside BAY
    buildParts(sys) {
      const B = BAY, cx = B.x + B.w / 2, cy = B.y + B.h / 2;
      if (sys === 'hydraulic') {
        const pipes = [];
        for (let i = 0; i < 3; i++) pipes.push({ y: B.y + 18 + i * 24 });
        return { pipes, joints: [{ x: B.x + 70, y: B.y + 18 }, { x: B.x + 150, y: B.y + 42 }, { x: B.x + 200, y: B.y + 66 }],
                 res: { x: B.x + 14, y: B.y + 20, w: 34, h: 50 } };
      }
      if (sys === 'clockwork')
        return { gears: [{ x: cx - 62, y: cy, r: 20 }, { x: cx - 28, y: cy - 6, r: 14 }, { x: cx + 3, y: cy + 4, r: 17 }],
                 spring: { x: cx + 74, y: cy, r: 22 },
                 pivots: [{ x: cx - 62, y: cy }, { x: cx - 28, y: cy - 6 }, { x: cx + 3, y: cy + 4 }] };
      if (sys === 'boiler')
        return { burner: { x: B.x + 30, y: B.y + 58, w: 56, h: 22 },
                 fins: { x: B.x + 100, y: B.y + 16, w: 96, h: 56 },
                 gauge: { x: B.x + 226, y: B.y + 24, r: 20 },
                 valve: { x: B.x + 226, y: B.y + 70 } };
      if (sys === 'acoustic')
        return { body: { x: B.x + 40, y: B.y + 12, w: 130, h: 64 },
                 strings: 4, pegs: [0, 1, 2, 3].map((i) => ({ x: B.x + 196 + i * 20, y: B.y + 26 })),
                 reed: { x: B.x + 216, y: B.y + 62 } };
      if (sys === 'neural') {
        const nodes = [];
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
          nodes.push({ x: Math.round(cx + Math.cos(a) * 74), y: Math.round(cy + Math.sin(a) * 32) });
        }
        return { nodes, core: { x: cx, y: cy } };
      }
      if (sys === 'optical')
        return { lens: { x: B.x + 62, y: cy, r: 30 }, mirror: { x: B.x + 168, y: B.y + 24, w: 26, h: 8 },
                 mark: { x: B.x + 186, y: B.y + 16 }, iris: { x: B.x + 226, y: cy, r: 20 } };
      if (sys === 'servo')
        return { motor: { x: B.x + 22, y: B.y + 22, w: 48, h: 44 },
                 pulleys: [{ x: B.x + 108, y: cy, r: 18 }, { x: B.x + 190, y: cy, r: 12 }],
                 coil: { x: B.x + 46, y: B.y + 44, r: 16 },
                 encoder: { x: B.x + 236, y: cy, r: 18 } };
      // armour
      const plates = [];
      for (let i = 0; i < 3; i++) plates.push({ x: B.x + 16 + i * 84, y: B.y + 14, w: 76, h: 40 });
      return { plates, holes: [0, 1, 2, 3].map((i) => ({ x: B.x + 34 + i * 62, y: B.y + 66 })),
               seam: { x0: B.x + 20, y0: B.y + 60, x1: B.x + 244, y1: B.y + 60 },
               dent: { x: B.x + 130, y: B.y + 32 } };
    },

    // per-fault live state
    faultState(sys, fid) {
      const s = {};
      if (fid === 'seal')    s.joint = G.irand(0, 2);
      if (fid === 'airlock') { s.p = 0.1; s.dir = 1; }
      if (fid === 'sludge')  { s.spots = [0, 1, 2, 3, 4].map((i) => ({ p: 0.2 + i * 0.14, gone: false })); s.joint = 1; }
      if (fid === 'jam')     { s.gx = 0; s.gy = 0; s.held = false; s.out = false; }
      if (fid === 'spring')  s.turn = 0;
      if (fid === 'dry')     { s.lit = [false, false, false]; s.turn = 0; }
      if (fid === 'scale')   s.crust = [0, 1, 2, 3, 4, 5].map((i) => ({ i, gone: false }));
      if (fid === 'over')    s.press = 1;
      if (fid === 'out')     { s.press = 1; s.lit2 = false; }
      if (fid === 'detune')  s.pegs = [false, false, false, false];
      if (fid === 'crack')   s.pts = [0, 1, 2, 3, 4].map((i) => ({ i, gone: false }));
      if (fid === 'muted')   { s.held = false; s.out = false; s.pegs = [false, false, false, false]; }
      if (fid === 'dead')    s.node = G.irand(0, 6);
      if (fid === 'cross')   { s.a = G.irand(0, 6); s.b = (s.a + 3) % 7; s.hitA = false; s.hitB = false; s.node = s.a; }
      if (fid === 'loop')    s.drain = 0;
      if (fid === 'fog')     s.turn = 0;
      if (fid === 'mirror')  { s.off = 14; s.held = false; }
      if (fid === 'iris')    { s.free = 0; s.turn = 0; }
      if (fid === 'belt')    { s.off = 16; s.held = false; }
      if (fid === 'burnt')   s.turn = 0;
      if (fid === 'skip')    s.cal = 0;
      if (fid === 'buckle')  s.press = 0;
      if (fid === 'sheared') s.holes = [false, false, false, false];
      if (fid === 'weldc')   { s.seam = [0, 1, 2, 3, 4, 5].map((i) => ({ i, gone: false })); s.press = 0; }
      return s;
    },

    // ---------------- helpers ----------------
    cur() { return this.faults[this.sel] || null; },
    openFaults() { return this.faults.filter((f) => !f.done); },
    canFinish() { return this.openFaults().length === 0 && this.winT === 0; },
    say(m, col) { this.msg = m; this.msgCol = col || P.warn; this.msgT = 2.4; },
    needTool() { const f = this.cur(); return f && f.named && !f.done ? ACT[f.id][f.step].tool : null; },
    needGest() { const f = this.cur(); return f && f.named && !f.done ? ACT[f.id][f.step].g : null; },
    pay(amt, x, y, label) {
      let a = amt;
      if (G.has('railspk')) a = Math.round(a * 1.4);
      else if (G.has('emp')) a = Math.round(a * 1.2);
      G.state.today.nightEarn += a;
      G.state.money += a;
      G.flyCoin(x, y, a);
      G.floatText((label ? label + ' ' : '') + '+$' + a, x, y - 8, P.lime);
    },
    advance() {
      const f = this.cur();
      const chain = ACT[f.id];
      f.step++;
      f.prog = 0;
      if (f.step >= chain.length) {
        f.done = true; f.flash = 0.6;
        G.audio.sfx('clean');
        G.spark(BAY.x + BAY.w / 2, BAY.y + BAY.h / 2, ['#fff', P.lime], 14);
        this.pay(f.def.pay, BAY.x + BAY.w / 2, BAY.y + 20, 'FIXED');
        G.state.today.fixed++; G.state.totFixed++;
        this.mood = 'idle';
        const nxt = this.faults.findIndex((x) => !x.done);
        if (nxt >= 0) { this.sel = nxt; this.tool = null; }
      } else {
        G.audio.sfx('fillDone');
        this.say('NOW THE ' + G.toolById(chain[f.step].tool).name, P.cyanLt);
        this.tool = null;
      }
    },

    // ---------------- input ----------------
    onDown(x, y) {
      if (this.doneAll || this.winT > 0) return;

      if (this.book) {                             // name the fault
        if (G.inRect(x, y, 262, 16, 46, 13)) { this.book = false; G.audio.sfx('bookFlip'); return; }
        const list = this.sys.faults;
        for (let i = 0; i < list.length; i++) {
          const ry = 62 + i * 24;
          if (!G.inRect(x, y, 26, ry, 268, 22)) continue;
          const f = this.cur();
          if (!f) { this.book = false; return; }
          if (list[i].id === f.id) {
            f.named = true;
            if (G.state.seen.indexOf(f.id) < 0) G.state.seen.push(f.id);
            G.audio.sfx('dxRight');
            this.pay(5, BAY.x + BAY.w / 2, BAY.y + 20, 'LOGGED');
            this.say('IT IS ' + f.def.name + '. USE THE ' + G.toolById(ACT[f.id][0].tool).name, P.lime);
            this.book = false;
          } else {
            G.audio.sfx('dxWrong');
            if (G.hasAlly('a_nurse') && !this.freebie) { this.freebie = 1; this.say('CLOSE. TRY AGAIN, NO CHARGE.', P.hazard); }
            else { G.state.today.misdx++; G.state.totMisdx++; this.jolt = 0.4; G.shake(2, 0.2); this.say('NO. READ IT AGAIN.', P.magenta); }
          }
          return;
        }
        return;
      }

      if (y >= TRAY_Y) {                           // the tray
        const tools = this.sys.tools;
        for (let i = 0; i < tools.length; i++)
          if (G.inRect(x, y, 4 + i * 54, TRAY_Y + 3, 52, 20)) {
            this.tool = tools[i]; this.act = null; G.audio.sfx('clack');
            this.say(G.toolById(tools[i]).hint, P.steel2);
            return;
          }
        if (G.inRect(x, y, 172, TRAY_Y + 3, 54, 20)) { this.book = true; G.audio.sfx('bookOpen'); return; }
        if (G.inRect(x, y, 230, TRAY_Y + 3, 86, 20)) {
          if (this.canFinish()) this.finish();
          else this.say('FAULTS STILL OPEN', P.warn);
        }
        return;
      }

      // pick which fault you are working on
      if (this.faults.length > 1)
        for (let i = 0; i < this.faults.length; i++)
          if (G.inRect(x, y, 4 + i * 64, 17, 60, 10)) { this.sel = i; this.tool = null; this.act = null; return; }

      const f = this.cur();
      if (!f || f.done) return;
      if (!f.named) { this.book = true; G.audio.sfx('bookOpen'); return; }
      const need = this.needTool();
      if (this.tool !== need) { G.audio.sfx('denied'); this.say('NEEDS THE ' + G.toolById(need).name, P.warn); return; }
      this.act = { g: this.needGest(), sx: x, sy: y, ang: null, turned: 0 };
      // click gestures resolve immediately
      if (this.act.g === 'click') this.clickAt(x, y, f);
      if (this.act.g === 'drag') this.grabAt(x, y, f);
      G.audio.sfx('grab');
    },
    onUp() {
      G.audio.stopAllLoops();
      const f = this.cur();
      if (f && f.state) { f.state.held = false; }
      this.act = null;
    },

    clickAt(x, y, f) {
      const s = f.state, pt = this.parts;
      if (f.id === 'dry') {
        pt.pivots.forEach((p, i) => { if (!s.lit[i] && G.dist(x, y, p.x, p.y) < 16) { s.lit[i] = true; G.audio.sfx('grit'); } });
        if (s.lit.every(Boolean)) this.advance();
      } else if (f.id === 'out') {
        if (G.dist(x, y, pt.burner.x + pt.burner.w / 2, pt.burner.y + pt.burner.h / 2) < 30) {
          s.lit2 = true; G.audio.sfx('zap'); G.screenFlash(P.hazard, 0.1); this.advance();
        }
      } else if (f.id === 'cross') {
        const a = pt.nodes[s.a], b = pt.nodes[s.b];
        if (!s.hitA && G.dist(x, y, a.x, a.y) < 14) { s.hitA = true; G.audio.sfx('probe'); }
        else if (!s.hitB && G.dist(x, y, b.x, b.y) < 14) { s.hitB = true; G.audio.sfx('probe'); }
        if (s.hitA && s.hitB) this.advance();
      } else if (f.id === 'sheared') {
        pt.holes.forEach((h, i) => { if (!s.holes[i] && G.dist(x, y, h.x, h.y) < 14) { s.holes[i] = true; G.audio.sfx('clank'); } });
        if (s.holes.every(Boolean)) this.advance();
      }
    },
    grabAt(x, y, f) {
      const s = f.state, pt = this.parts;
      if (f.id === 'jam') { const gr = this.gearDebris(); if (G.dist(x, y, gr.x, gr.y) < 16) s.held = true; }
      if (f.id === 'muted') { if (G.dist(x, y, pt.reed.x, pt.reed.y) < 16) s.held = true; }
      if (f.id === 'mirror') { if (G.dist(x, y, pt.mirror.x + s.off, pt.mirror.y) < 18) s.held = true; }
      if (f.id === 'belt') { if (G.dist(x, y, pt.pulleys[1].x, pt.pulleys[1].y + s.off) < 18) s.held = true; }
      if (!s.held) this.say('GRIP IT PROPERLY', P.warn);
    },
    gearDebris() {
      const g0 = this.parts.gears[1];
      return { x: g0.x + g0.r - 2, y: g0.y - g0.r + 4 };
    },

    finish() {
      let bonus = 10;
      if (G.state.today.misdx === 0) bonus += 6;
      this.pay(bonus, 160, 70, 'SIGNED OFF');
      G.audio.sfx('perfect');
      this.winT = 0.01;
      // every machine you patch up is one more day the people get
      G.state.freed++;
      G.state.suspicion = Math.max(0, G.state.suspicion - 0.05);
    },

    // ---------------- update ----------------
    update(dt) {
      this.t += dt;
      if (this.doneAll) { G.audio.stopAllLoops(); G.save(); G.go('summary', 'BOOKS CLOSED'); return; }
      const M = G.mouse;
      if (this.msgT > 0) this.msgT -= dt;
      if (this.jolt > 0) this.jolt -= dt;
      for (const f of this.faults) if (f.flash > 0) f.flash -= dt;
      G.updateSteam(dt);
      if (Math.random() < dt * 0.8) G.puffSteam(G.irand(10, 310), 178);
      for (let i = this.chips.length - 1; i >= 0; i--) {
        const p = this.chips[i];
        p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt;
        if (p.t > p.life) this.chips.splice(i, 1);
      }
      if (this.winT > 0) {
        this.winT += dt;
        if (this.winT > 1.7) this.next();
        return;
      }
      const f = this.cur();
      if (!f) return;
      const s = f.state, pt = this.parts;

      // the airlock bubble drifts along the line, but the bleed key pins it
      if (f.id === 'airlock' && !f.done) {
        const bp = this.pipePoint(0, s.p);
        const pinned = this.act && this.act.g === 'hold' && M.down && G.dist(M.x, M.y, bp.x, bp.y) < 16;
        if (!pinned) {
          s.p += s.dir * dt * 0.16;
          if (s.p > 0.92) { s.p = 0.92; s.dir = -1; }
          if (s.p < 0.08) { s.p = 0.08; s.dir = 1; }
        }
      }

      const a = this.act;
      if (!a || !M.down) { G.audio.stopAllLoops(); return; }
      const gest = a.g;
      let working = false;

      if (gest === 'hold') {
        const tgt = this.holdTarget(f);
        if (tgt && G.dist(M.x, M.y, tgt.x, tgt.y) < (tgt.r || 18)) {
          working = true;
          f.prog += dt * (G.has('carbide') ? 0.95 : 0.62);
          if (Math.random() < 0.5) this.spit(M.x, M.y, tgt.col || P.hullLt);
          if (f.prog >= 1) { this.applyHold(f); return; }
        }
      } else if (gest === 'sweep') {
        const list = this.sweepTargets(f);
        const moved = Math.hypot(M.vx, M.vy) > 8;
        working = moved;
        for (const tg of list) {
          if (tg.o.gone) continue;
          if (G.dist(M.x, M.y, tg.x, tg.y) < 14) {
            tg.o.gone = true;
            G.audio.sfx('scrape');
            for (let i = 0; i < 3; i++) this.spit(tg.x, tg.y, tg.col);
          }
        }
        if (list.length && list.every((tg) => tg.o.gone)) { this.advance(); return; }
      } else if (gest === 'wind') {
        const c = this.windCentre(f);
        if (c) {
          const ang = Math.atan2(M.y - c.y, M.x - c.x);
          if (a.ang !== null) {
            let d = ang - a.ang;
            while (d > Math.PI) d -= Math.PI * 2;
            while (d < -Math.PI) d += Math.PI * 2;
            if (Math.abs(d) < 1) { a.turned += Math.abs(d); working = Math.abs(d) > 0.01; }
          }
          a.ang = ang;
          const need = 10;                            // radians of winding
          if (f.id === 'spring' || f.id === 'dry') s.turn = G.clamp(a.turned / need, 0, 1);
          if (f.id === 'fog' || f.id === 'iris') s.turn = G.clamp(a.turned / need, 0, 1);
          if (f.id === 'burnt') s.turn = G.clamp(a.turned / need, 0, 1);
          f.prog = G.clamp(a.turned / need, 0, 1);
          if (Math.random() < 0.3 && working) this.spit(M.x, M.y, P.hullLt);
          if (a.turned >= need) { this.advance(); return; }
        }
      } else if (gest === 'drag') {
        if (s.held) {
          working = true;
          if (f.id === 'jam') {
            s.gx = M.x - this.gearDebris().x; s.gy = M.y - this.gearDebris().y;
            if (Math.hypot(s.gx, s.gy) > 34) { s.out = true; G.audio.sfx('wetPull'); this.advance(); return; }
          } else if (f.id === 'muted') {
            s.gx = M.x - pt.reed.x; s.gy = M.y - pt.reed.y;
            if (Math.hypot(s.gx, s.gy) > 30) { s.out = true; G.audio.sfx('wetPull'); this.advance(); return; }
          } else if (f.id === 'mirror') {
            s.off = G.clamp(M.x - pt.mirror.x, -4, 22);
            if (Math.abs(s.off) < 3) { s.off = 0; G.audio.sfx('clank'); this.advance(); return; }
          } else if (f.id === 'belt') {
            s.off = G.clamp(M.y - pt.pulleys[1].y, -2, 24);
            if (s.off < 3) { s.off = 0; G.audio.sfx('clank'); this.advance(); return; }
          }
        }
      }
      G.audio.loop(gest === 'sweep' ? 'scrape' : gest === 'wind' ? 'goo' : 'drill', working, 0.9);
    },

    holdTarget(f) {
      const pt = this.parts, s = f.state;
      if (f.id === 'seal' || f.id === 'sludge') { const j = pt.joints[s.joint]; return { x: j.x, y: j.y, col: '#7ab8ff' }; }
      if (f.id === 'airlock') { const p = this.pipePoint(0, s.p); return { x: p.x, y: p.y, r: 15, col: '#bfe8ff' }; }
      if (f.id === 'over' || f.id === 'out') return { x: pt.valve.x, y: pt.valve.y, col: '#ffd0a0' };
      if (f.id === 'dead' || f.id === 'cross') { const n = pt.nodes[s.node]; return { x: n.x, y: n.y, col: P.violetLt }; }
      if (f.id === 'loop') return { x: pt.core.x, y: pt.core.y, r: 26, col: P.violetLt };
      if (f.id === 'iris') return { x: pt.iris.x, y: pt.iris.y, r: 22, col: P.cyanLt };
      if (f.id === 'skip') return { x: pt.encoder.x, y: pt.encoder.y, r: 20, col: P.lime };
      if (f.id === 'buckle' || f.id === 'weldc') return { x: pt.dent.x, y: pt.dent.y, r: 20, col: P.hullLt };
      return null;
    },
    sweepTargets(f) {
      const pt = this.parts, s = f.state, out = [];
      if (f.id === 'sludge') for (const o of s.spots) { const p = this.pipePoint(1, o.p); out.push({ x: p.x, y: p.y, o, col: '#3a2a1a' }); }
      if (f.id === 'scale') for (const o of s.crust) out.push({ x: pt.fins.x + 10 + o.i * 14, y: pt.fins.y + 18, o, col: P.sugarCrust });
      if (f.id === 'crack') for (const o of s.pts) out.push({ x: pt.body.x + 24 + o.i * 20, y: pt.body.y + 18 + (o.i % 2) * 14, o, col: '#c9a06a' });
      if (f.id === 'weldc') for (const o of s.seam) out.push({ x: pt.seam.x0 + 14 + o.i * 38, y: pt.seam.y0, o, col: P.cyanLt });
      if (f.id === 'detune' || f.id === 'muted') {
        for (let i = 0; i < 4; i++) out.push({ x: pt.pegs[i].x, y: pt.pegs[i].y,
          o: { get gone() { return s.pegs[i]; }, set gone(v) { s.pegs[i] = v; } }, col: '#e8dcc0' });
      }
      return out;
    },
    windCentre(f) {
      const pt = this.parts;
      if (f.id === 'spring' || f.id === 'dry') return pt.spring;
      if (f.id === 'fog' || f.id === 'iris') return pt.lens;
      if (f.id === 'burnt') return pt.coil;
      return null;
    },
    applyHold(f) {
      const s = f.state;
      if (f.id === 'over' || f.id === 'out') s.press = 0;
      if (f.id === 'buckle' || f.id === 'weldc') s.press = 1;
      if (f.id === 'loop') s.drain = 1;
      if (f.id === 'iris') s.free = 1;
      if (f.id === 'skip') s.cal = 1;
      G.audio.sfx('fillDone');
      this.advance();
    },
    spit(x, y, col) {
      this.chips.push({ x, y, vx: G.rand(-40, 40), vy: G.rand(-50, -10), col, t: 0, life: 0.36 });
    },
    pipePoint(pipe, p) {
      const pl = this.parts.pipes[pipe] || this.parts.pipes[0];
      return { x: BAY.x + 10 + p * (BAY.w - 20), y: pl.y };
    },

    // ---------------- draw ----------------
    draw(g) {
      const t = this.t;
      G.toastY = -40; G.toastCX = 0;
      if (!this.faults) return;
      G.R(g, 0, 0, G.W, G.H, P.cityDk);
      G.cityWall(g, 0, 0, G.W, G.H, t);
      g.globalAlpha = 0.4; G.R(g, 0, 0, G.W, G.H, '#0a0c14'); g.globalAlpha = 1;
      // the inspection lamp: a stem, a shade, a hot tube and a cage
      G.R(g, 156, 0, 3, 8, P.plateDk);
      G.vair(g, 157, 0, 8, P.chrome);
      for (let j = 0; j < 7; j++) {
        const hw = 30 - j * 2;
        G.Rh(g, 158 - hw, 8 + j, hw * 2, 1, j < 2 ? P.steel2 : P.plateDk);
      }
      G.hair(g, 128, 8, 60, P.chrome);
      G.R(g, 132, 14, 52, 2, '#fff8d8');
      G.hair(g, 132, 14, 52, '#ffffff');
      for (let i = 0; i < 9; i++) G.vair(g, 134 + i * 6, 14, 2, '#7a6a48');
      G.glow(g, 158, 70, 220, 110, '#ffeec0', 1.15);
      // a cool bounce from the left, so the bay is not lit from one side only
      G.glow(g, 40, 60, 130, 100, '#8fb8ff', 0.28);

      const jx = this.jolt > 0 ? Math.round(Math.sin(t * 60) * 2) : 0;
      g.save(); g.translate(jx, 0);

      // the bench it is laid out on: a steel top, a scored surface and
      // the clutter of a place where things get taken apart
      G.plate(g, 0, BAY.y + BAY.h + 6, G.W, 24, P.plate, { r: 2, band: 3, bolts: 1, grain: 4 });
      G.hair(g, 0, BAY.y + BAY.h + 7, G.W, P.chrome);
      for (let i = 0; i < 30; i++)
        G.hair(g, G.hash(i, 3) * 300 + 6, BAY.y + BAY.h + 12 + G.hash(i, 9) * 12,
          4 + G.hash(i, 5) * 14, '#4a5670');
      // a vice at one end and a parts tin at the other
      G.plate(g, 6, BAY.y + BAY.h - 4, 22, 12, '#3a4459', { r: 1, band: 2, bolts: 1 });
      G.Rh(g, 10, BAY.y + BAY.h - 1, 14, 3, '#5c6a86');
      G.Rh(g, 16, BAY.y + BAY.h + 2, 3, 8, '#48546c');
      G.plate(g, 292, BAY.y + BAY.h - 2, 24, 10, '#2f5c6b', { r: 1, band: 2 });
      for (let i = 0; i < 5; i++)
        G.Rh(g, 295 + i * 4, BAY.y + BAY.h - 1, 2, 2, ['#8a94a8', '#c9a02a', '#8a94a8'][i % 3]);

      // the opened panel, with a hinged lid thrown back and a lit lip
      G.plate(g, BAY.x - 6, BAY.y - 6, BAY.w + 12, BAY.h + 12, this.bot.col,
        { r: 3, band: 4, lit: this.bot.col2, dk: G.shade(this.bot.col, -0.45),
          bolts: 1, notch: 1, grain: 5 });
      G.R(g, BAY.x - 3, BAY.y - 3, BAY.w + 6, 1, this.bot.hue);
      G.glow(g, BAY.x + BAY.w / 2, BAY.y - 3, BAY.w, 10, this.bot.hue, 0.4);
      // fasteners all round the opening, some of them lying loose on the bench
      for (let i = 0; i < 9; i++) {
        G.rivet(g, BAY.x - 4.5 + i * (BAY.w / 8), BAY.y - 4.5, '#0b0e14', G.shade(this.bot.col, 0.5));
        G.rivet(g, BAY.x - 4.5 + i * (BAY.w / 8), BAY.y + BAY.h + 2.5, '#0b0e14', G.shade(this.bot.col, 0.5));
      }
      for (let i = 0; i < 4; i++)
        G.rivet(g, 40 + i * 13 + (i % 2) * 4, BAY.y + BAY.h + 16, '#0b0e14', P.chrome);
      G.plate(g, BAY.x, BAY.y, BAY.w, BAY.h, '#0d1018', { r: 2, band: 1, lit: '#181d28', dk: '#070a10', spec: false });
      G.bevel(g, BAY.x, BAY.y, BAY.w, BAY.h, '#050709', '#2a3446');
      // the chassis floor: ribs and a couple of loom runs so it has depth
      for (let j = BAY.y + 6; j < BAY.y + BAY.h - 2; j += 9) {
        G.R(g, BAY.x + 3, j, BAY.w - 6, 1, '#151a24');
        G.hair(g, BAY.x + 3, j + 1, BAY.w - 6, '#1d2432');
      }
      for (const sx of [BAY.x + 5, BAY.x + BAY.w - 7])
        for (let k = 0; k < BAY.h - 6; k++)
          G.R(g, sx + Math.round(Math.sin(k * 0.3) * 2), BAY.y + 3 + k, 2, 1,
            k % 9 < 3 ? '#2a1f44' : k % 9 < 6 ? '#12303a' : '#1d2436');

      this.drawSystem(g, t);

      for (const p of this.chips) G.R(g, p.x, p.y, 2, 2, p.col);
      g.restore();
      G.drawSteam(g);

      // ---- HUD ----
      G.plate(g, 2, 2, 54, 12, P.ink2, { r: 1, band: 1, spec: false });
      G.R(g, 6, 6, 4, 5, P.hazard);
      G.text(g, '$' + Math.round(G.state.money), 13, 4, P.hazard);
      G.plate(g, 60, 2, 46, 12, P.ink2, { r: 1, band: 1, spec: false });
      G.text(g, (this.pi + 1) + '/' + this.queue.length, 64, 4, P.cyanLt);
      // two plates, so neither name gets cut in half
      G.plate(g, 110, 2, 80, 12, P.ink2, { r: 1, band: 1, spec: false });
      G.text(g, this.job.name.slice(0, 12), 114, 4, this.bot.hue);
      G.plate(g, 194, 2, 84, 12, P.ink2, { r: 1, band: 1, spec: false });
      G.text(g, this.sys.name.slice(0, 13), 198, 4, this.sys.col);
      // the patient, as a chip in the corner
      G.plate(g, 282, 2, 34, 26, '#12141c', { r: 1, band: 1, spec: false });
      G.drawBot(g, this.job.id, 299, 27, 0.24,
        { t, open: this.mood === 'sick' ? 0.5 : 0.15, mood: this.mood, walk: 0, noBlink: 1 });

      // fault tabs
      for (let i = 0; i < this.faults.length; i++) {
        const f = this.faults[i], on = this.sel === i;
        G.plate(g, 4 + i * 64, 17, 60, 10, f.done ? '#1a3a24' : on ? '#3a2a1a' : '#1a1e28', { r: 1, band: 1, spec: false });
        if (on) G.R(g, 4 + i * 64, 17, 60, 1, P.hazard);
        G.text(g, f.done ? 'DONE' : f.named ? f.def.name.split(' ')[0].slice(0, 8) : 'FAULT ' + (i + 1),
          4 + i * 64 + 30, 19, f.done ? P.lime : on ? P.hazard : '#5a6070', { align: 'center' });
      }

      // the sign, and the tool you need
      const f = this.cur();
      if (f && !f.done) {
        const txt = f.named ? G.toolById(ACT[f.id][f.step].tool).hint : f.def.sign;
        G.R(g, 0, 126, G.W, 10, '#0d1018');
        G.text(g, txt, 160, 127, f.named ? P.cyanLt : P.hazard, { align: 'center' });
        if (f.named && f.prog > 0) {
          G.R(g, 100, 138, 120, 4, '#0d1220');
          G.R(g, 100, 138, Math.round(120 * G.clamp(f.prog, 0, 1)), 4, P.lime);
          G.R(g, Math.round(100 + 120 * G.clamp(f.prog, 0, 1)) - 1, 137, 2, 6, '#ffffff');
        }
      }
      if (this.msgT > 0) {
        const w = G.tw(this.msg) + 10;
        g.globalAlpha = Math.min(1, this.msgT * 2);
        G.plate(g, 160 - w / 2, 139, w, 11, '#140f22', { r: 1, band: 1, spec: false });
        G.text(g, this.msg, 160, 142, this.msgCol, { align: 'center' });
        g.globalAlpha = 1;
      }

      // ---- tray ----
      G.R(g, 0, TRAY_Y, G.W, G.H - TRAY_Y, '#0c0d16');
      G.R(g, 0, TRAY_Y, G.W, 1, P.cyanDk);
      const tools = this.sys.tools;
      const need = this.needTool();
      for (let i = 0; i < tools.length; i++) {
        const bx = 4 + i * 54, on = this.tool === tools[i], want = need === tools[i];
        G.plate(g, bx, TRAY_Y + 3, 52, 20, on ? P.cyanDk : want ? '#2a3a1e' : '#1a1e2a', { r: 1, band: 1, spec: false });
        if (want) G.R(g, bx, TRAY_Y + 3, 52, 1, P.lime);
        G.text(g, G.toolById(tools[i]).name.split(' ')[0].slice(0, 8), bx + 26, TRAY_Y + 5,
          on ? '#ffffff' : P.cream, { align: 'center' });
        if (f && f.named && want)
          G.text(g, ACT[f.id][f.step].g.toUpperCase(), bx + 26, TRAY_Y + 14, P.lime, { align: 'center' });
      }
      G.drawBtn(g, 172, TRAY_Y + 3, 54, 20, 'MANUAL', { col: this.book ? P.violet : '#3a2a5c' });
      G.drawBtn(g, 230, TRAY_Y + 3, 86, 20, 'SIGN OFF', { col: this.canFinish() ? '#2f8a48' : '#20242e' });

      if (this.book) this.manual(g, t);
      if (this.winT > 0) {
        g.globalAlpha = Math.min(0.72, this.winT * 0.9);
        G.R(g, 0, 0, G.W, G.H, P.cityDk);
        g.globalAlpha = 1;
        G.text(g, this.job.name + ' REBOOTED', 160, 72, P.lime, { align: 'center', out: OUT, sc: 2 });
        G.text(g, 'ANOTHER DAY FOR THE PEOPLE', 160, 92, P.cyanLt, { align: 'center', out: OUT });
      }
      G.grade(g, 1);
    },

    // the fault manual: three candidates, all from this system
    manual(g, t) {
      G.plate(g, 18, 12, 284, 132, '#141a2a', { r: 2, band: 2, lit: '#232c44', dk: '#0a0d16', spec: false });
      G.R(g, 20, 14, 280, 1, P.cyanDk);
      G.text(g, this.sys.name + ' MANUAL', 24, 18, P.cyanLt);
      G.text(g, this.sys.desc, 24, 28, P.steel2);
      G.drawBtn(g, 262, 16, 46, 13, 'CLOSE', { col: '#5c2030' });
      const f = this.cur();
      G.text(g, f ? 'YOU SEE: ' + f.def.sign : 'NOTHING SELECTED', 24, 44, P.hazard);
      const list = this.sys.faults;
      for (let i = 0; i < list.length; i++) {
        const ry = 62 + i * 24;
        const hov = G.inRect(G.mouse.x, G.mouse.y, 26, ry, 268, 22);
        G.plate(g, 26, ry, 268, 22, hov ? P.cyanDk : '#1d2436', { r: 1, band: 1, spec: false });
        G.R(g, 26, ry, 2, 22, hov ? P.cyanLt : P.plateDk);
        G.text(g, list[i].name, 32, ry + 3, hov ? '#ffffff' : P.cream);
        const known = G.state.seen.indexOf(list[i].id) >= 0;
        G.text(g, known ? list[i].sign : 'NOT YET LOGGED', 32, ry + 13, known ? P.steel2 : P.steel);
        G.text(g, '$' + list[i].pay, 288, ry + 8, P.hazard, { align: 'right' });
      }
    },

    // ============================================================
    // THE INTERIORS
    // ============================================================
    drawSystem(g, t) {
      const s = this.sys, pt = this.parts;
      const f = this.cur();
      const fid = f ? f.id : null;
      const st = f ? f.state : {};
      const B = BAY;
      const has = (id) => this.faults.some((x) => x.id === id && !x.done);
      const stOf = (id) => { const x = this.faults.find((y) => y.id === id); return x ? x.state : null; };

      if (s === G.sysById('hydraulic')) {
        // reservoir + three runs of pipe with joints
        G.plate(g, pt.res.x, pt.res.y, pt.res.w, pt.res.h, '#1a2c3e', { r: 2, band: 2 });
        const lvl = Math.round(pt.res.h * 0.6 + Math.sin(t * 2) * 2);
        G.R(g, pt.res.x + 2, pt.res.y + pt.res.h - lvl, pt.res.w - 4, lvl - 2, '#2f6a9a');
        G.R(g, pt.res.x + 2, pt.res.y + pt.res.h - lvl, pt.res.w - 4, 1, '#7ab8ff');
        for (const pl of pt.pipes) {
          G.R(g, B.x + 8, pl.y - 4, B.w - 16, 8, OUT);
          G.R(g, B.x + 9, pl.y - 3, B.w - 18, 6, '#3a4658');
          G.R(g, B.x + 9, pl.y - 3, B.w - 18, 2, '#59677c');
        }
        for (let i = 0; i < pt.joints.length; i++) {
          const j = pt.joints[i];
          G.plate(g, j.x - 7, j.y - 7, 14, 14, P.hullDk, { r: 1, band: 1 });
          const sealS = stOf('seal') || stOf('sludge');
          if ((has('seal') || has('sludge')) && sealS && sealS.joint === i) {
            for (let k = 0; k < 4; k++) G.R(g, j.x - 2 + k, j.y + 6 + ((Math.floor(t * 8) + k) % 6), 2, 2, '#7ab8ff');
            G.R(g, j.x - 8, j.y - 8, 16, 16, '#7ab8ff33');
          }
        }
        if (has('airlock')) {
          const p = this.pipePoint(0, stOf('airlock').p);
          G.rr2(g, p.x - 5, p.y - 4, 10, 8, '#bfe8ff');
          G.R(g, p.x - 3, p.y - 3, 4, 2, '#ffffff');
        }
        if (has('sludge')) for (const o of stOf('sludge').spots) {
          if (o.gone) continue;
          const p = this.pipePoint(1, o.p);
          G.R(g, p.x - 6, p.y - 3, 12, 6, '#3a2a12');
          G.R(g, p.x - 5, p.y - 2, 10, 2, '#5c4420');
        }
      } else if (s === G.sysById('clockwork')) {
        for (let i = 0; i < pt.gears.length; i++) {
          const gr = pt.gears[i];
          const spin = t * (i % 2 ? -1.2 : 1.2) * (has('jam') ? 0.08 : 1) + i;
          this.gear(g, gr.x, gr.y, gr.r, spin, '#c9a02a');
          if (has('dry') && !stOf('dry').lit[i]) {
            if (Math.sin(t * 12 + i) > 0.4) G.R(g, gr.x - 2, gr.y - gr.r - 6, 4, 4, P.hazard);
          }
        }
        // the mainspring
        const sp = pt.spring, coil = has('spring') ? (stOf('spring').turn || 0) : has('dry') ? (stOf('dry').turn || 0) : 1;
        G.plate(g, sp.x - sp.r - 4, sp.y - sp.r - 4, sp.r * 2 + 8, sp.r * 2 + 8, '#1a1e28', { r: 2, band: 1, spec: false });
        for (let k = 0; k < 5; k++) {
          const rr = sp.r - k * 4 * (0.6 + coil * 0.5);
          if (rr < 2) break;
          G.oc(g, sp.x, sp.y, rr, k % 2 ? '#e8c060' : '#a8802a');
        }
        G.R(g, sp.x - 2, sp.y - 2, 4, 4, P.hullLt);
        if (has('jam') && !stOf('jam').out) {
          const d = this.gearDebris(), ss = stOf('jam');
          const dx = d.x + (ss.held ? ss.gx : 0), dy = d.y + (ss.held ? ss.gy : 0);
          if (!ss.held && Math.sin(t * 6) > 0) G.oc(g, dx, dy, 11, '#ffb01f66');
          G.rr2(g, dx - 5, dy - 5, 11, 11, OUT);
          G.rr2(g, dx - 4, dy - 4, 9, 9, '#e8dcc0');
          G.R(g, dx - 3, dy - 3, 5, 2, '#ffffff');
          G.R(g, dx - 2, dy, 4, 3, '#ff8ac0');       // a sugar-set lump of your own making
          G.R(g, dx, dy + 2, 2, 2, '#8fbf3a');
        }
      } else if (s === G.sysById('boiler')) {
        const bu = pt.burner, fi = pt.fins, ga = pt.gauge;
        G.plate(g, bu.x, bu.y, bu.w, bu.h, '#2a1c14', { r: 2, band: 2 });
        const lit2 = !has('out') || (stOf('out') && stOf('out').lit2);
        for (let i = 0; i < 5; i++) {
          const fx = bu.x + 6 + i * 10;
          if (lit2) {
            const fh = 6 + Math.round(Math.sin(t * 9 + i) * 3);
            G.R(g, fx, bu.y - fh, 5, fh, '#ff8a2a');
            G.R(g, fx + 1, bu.y - fh + 2, 3, fh - 2, '#ffd44a');
          } else G.R(g, fx, bu.y - 2, 5, 2, '#3a2a20');
        }
        if (lit2) G.glow(g, bu.x + bu.w / 2, bu.y - 4, 60, 26, '#ff9a3a', 1);
        // exchanger fins
        G.plate(g, fi.x, fi.y, fi.w, fi.h, '#2a3240', { r: 2, band: 2 });
        for (let i = 0; i < 6; i++) {
          G.R(g, fi.x + 8 + i * 14, fi.y + 4, 8, fi.h - 8, '#59677c');
          G.R(g, fi.x + 8 + i * 14, fi.y + 4, 8, 2, '#8a97ad');
        }
        if (has('scale')) for (const o of stOf('scale').crust) {
          if (o.gone) continue;
          G.rr2(g, fi.x + 6 + o.i * 14, fi.y + 12, 12, 14, P.sugarCrust);
          G.R(g, fi.x + 8 + o.i * 14, fi.y + 14, 6, 2, '#ffffff');
        }
        // gauge
        const press = has('over') ? stOf('over').press : has('out') ? stOf('out').press : 0.4;
        G.plate(g, ga.x - ga.r, ga.y - ga.r, ga.r * 2, ga.r * 2, '#e8e4d8', { r: 3, band: 1 });
        G.oc(g, ga.x, ga.y, ga.r - 3, '#3a3a44');
        for (let i = 0; i < 5; i++) {
          const a2 = -Math.PI * 0.85 + (i / 4) * Math.PI * 1.7;
          G.R(g, ga.x + Math.cos(a2) * (ga.r - 6), ga.y + Math.sin(a2) * (ga.r - 6), 2, 2, i > 2 ? '#c02020' : '#3a3a44');
        }
        const na = -Math.PI * 0.85 + G.clamp(press, 0, 1) * Math.PI * 1.7;
        G.line(g, ga.x, ga.y, ga.x + Math.cos(na) * (ga.r - 7), ga.y + Math.sin(na) * (ga.r - 7), '#c02020', 2);
        // valve
        G.plate(g, pt.valve.x - 8, pt.valve.y - 8, 16, 16, P.hullDk, { r: 2, band: 1 });
        G.R(g, pt.valve.x - 2, pt.valve.y - 10, 4, 6, P.hull);
        if (press > 0.7) for (let i = 0; i < 3; i++)
          G.R(g, pt.valve.x - 4 + i * 4, pt.valve.y - 14 - ((Math.floor(t * 12) + i) % 8), 2, 3, '#dfe8ff');
      } else if (s === G.sysById('acoustic')) {
        const bd = pt.body;
        // resonator: an hourglass shell
        for (let j = 0; j < bd.h; j++) {
          const p = j / (bd.h - 1);
          const waist = 1 - Math.exp(-Math.pow((p - 0.5) * 3.2, 2)) * 0.4;
          const hw = Math.round((bd.w / 2) * waist);
          G.R(g, bd.x + bd.w / 2 - hw - 1, bd.y + j, hw * 2 + 2, 1, OUT);
          G.R(g, bd.x + bd.w / 2 - hw, bd.y + j, hw * 2, 1, j < 2 ? '#e0a860' : p > 0.88 ? '#5c3a18' : '#b8862f');
        }
        // the neck the strings run over
        G.plate(g, bd.x + bd.w - 6, bd.y + 8, pt.pegs[3].x - bd.x - bd.w + 14, 44, '#3a2412',
          { r: 1, band: 2, spec: false });
        for (let i = 0; i < 5; i++) G.R(g, bd.x + bd.w + 6 + i * 14, bd.y + 10, 1, 40, '#5c4020');
        // strings: taut hairs, or one clean sag per string if the peg is slack
        const sx0 = bd.x + 6, sx1 = pt.pegs[3].x, sL = Math.max(1, sx1 - sx0);
        for (let i = 0; i < 4; i++) {
          const sy = bd.y + 12 + i * 11;
          const slack = has('detune') && !stOf('detune').pegs[i];
          for (let x = sx0; x < sx1; x += 0.5) {
            const u = (x - sx0) / sL;
            const sag = slack ? Math.sin(u * Math.PI) * 3.5 + Math.sin(t * 14 + u * 5) * 0.5 : 0;
            G.Rh(g, x, sy + sag, 0.5, slack ? 1 : 0.5, slack ? '#fff4d8' : (i % 2 ? '#e8dcc0' : '#c8bca0'));
          }
          // the bridge saddle each string crosses
          G.Rh(g, bd.x + bd.w * 0.62, sy - 0.5, 1, 2, '#2a1a08');
        }
        // bridge and tailpiece, so the strings are anchored to something
        G.plate(g, bd.x + bd.w * 0.6, bd.y + 8, 4, 44, '#2a1a08', { r: 1, band: 1, spec: false });
        G.plate(g, bd.x + 2, bd.y + 10, 5, 40, '#3a2412', { r: 1, band: 1, spec: false, bolts: 1 });
        for (let i = 0; i < 4; i++) {
          const pg = pt.pegs[i];
          const tuned = !has('detune') || stOf('detune').pegs[i];
          G.plate(g, pg.x - 5, pg.y - 5, 10, 10, tuned ? '#4a3a20' : '#8a6a2a', { r: 1, band: 1 });
          G.R(g, pg.x - 1, pg.y - 8, 2, 5, P.hullDk);
          if (!tuned && Math.sin(t * 8 + i) > 0) G.R(g, pg.x - 6, pg.y - 6, 12, 12, '#ffb01f33');
        }
        if (has('crack')) {
          const ss = stOf('crack');
          for (let k = 0; k < ss.pts.length - 1; k++) {
            const a = ss.pts[k], b2 = ss.pts[k + 1];
            const ax = bd.x + 24 + a.i * 20, ay = bd.y + 18 + (a.i % 2) * 14;
            const bx2 = bd.x + 24 + b2.i * 20, by2 = bd.y + 18 + (b2.i % 2) * 14;
            if (a.gone && b2.gone) { G.line(g, ax, ay, bx2, by2, '#e8b45c', 3); G.line(g, ax, ay, bx2, by2, '#ffe8b8', 1); }
            else { G.line(g, ax, ay, bx2, by2, OUT, 3); G.line(g, ax, ay, bx2, by2, '#140c04', 1); }
          }
          for (const o of ss.pts) {
            if (o.gone) continue;
            const px = bd.x + 24 + o.i * 20, py = bd.y + 18 + (o.i % 2) * 14;
            G.R(g, px - 2, py - 2, 4, 4, '#2a1a08');
            if (Math.sin(t * 7 + o.i) > 0.3) G.R(g, px - 4, py - 4, 8, 8, '#ffb01f33');
          }
        }
        if (has('muted') && !stOf('muted').out) {
          const ss = stOf('muted');
          const rx = pt.reed.x + (ss.held ? ss.gx : 0), ry = pt.reed.y + (ss.held ? ss.gy : 0);
          G.rr2(g, rx - 5, ry - 4, 10, 8, OUT);
          G.rr2(g, rx - 4, ry - 3, 8, 6, '#c93a6a');
        }
      } else if (s === G.sysById('neural')) {
        // links first
        for (let i = 0; i < pt.nodes.length; i++) {
          const a = pt.nodes[i], b = pt.nodes[(i + 1) % pt.nodes.length];
          const hot = has('loop') && !stOf('loop').drain;
          G.line(g, a.x, a.y, b.x, b.y, hot && Math.sin(t * 14 + i) > 0 ? P.violetLt : '#3a2a5c', 1);
          G.line(g, a.x, a.y, pt.core.x, pt.core.y, '#2a1f44', 1);
        }
        if (has('cross')) {
          const ss = stOf('cross');
          const a = pt.nodes[ss.a], b = pt.nodes[ss.b];
          G.line(g, a.x, a.y, b.x, b.y, Math.sin(t * 20) > 0 ? '#ffffff' : P.magenta, 2);
          if (!ss.hitA) G.R(g, a.x - 8, a.y - 8, 16, 16, '#ff2f8e33');
          if (!ss.hitB) G.R(g, b.x - 8, b.y - 8, 16, 16, '#ff2f8e33');
        }
        for (let i = 0; i < pt.nodes.length; i++) {
          const n = pt.nodes[i];
          const deadN = has('dead') && stOf('dead').node === i;
          const col = deadN ? '#2a2030' : P.violet;
          G.rr2(g, n.x - 6, n.y - 6, 12, 12, OUT);
          G.rr2(g, n.x - 5, n.y - 5, 10, 10, col);
          if (!deadN) { G.R(g, n.x - 2, n.y - 2, 4, 4, P.violetLt); G.glow(g, n.x, n.y, 14, 14, P.violet, 0.6); }
        }
        const cr = has('loop') && !stOf('loop').drain ? 14 + Math.sin(t * 18) * 3 : 12;
        G.rr2(g, pt.core.x - cr, pt.core.y - cr * 0.7, cr * 2, cr * 1.4, OUT);
        G.rr2(g, pt.core.x - cr + 1, pt.core.y - cr * 0.7 + 1, cr * 2 - 2, cr * 1.4 - 2, '#3a2a5c');
        G.R(g, pt.core.x - 4, pt.core.y - 3, 8, 6, P.violetLt);
      } else if (s === G.sysById('optical')) {
        const le = pt.lens, mi = pt.mirror, ir = pt.iris;
        // the beam
        const off = has('mirror') ? stOf('mirror').off : 0;
        G.line(g, le.x, le.y, mi.x + off + 13, mi.y + 4, has('fog') && stOf('fog').turn < 1 ? '#2a4a58' : P.cyanLt, 2);
        G.line(g, mi.x + off + 13, mi.y + 4, ir.x, ir.y, P.cyanLt, 2);
        // lens stack: a real glass disc in a metal barrel
        G.fc(g, le.x, le.y, le.r + 2, OUT);
        G.fc(g, le.x, le.y, le.r + 1, P.hullDk);
        G.fc(g, le.x, le.y, le.r - 1, '#16323d');
        for (let j = -le.r + 2; j < 0; j++) {          // a specular sweep across the glass
          const hw = Math.round(Math.sqrt(Math.max(0, (le.r - 2) * (le.r - 2) - j * j)));
          G.R(g, le.x - hw, le.y + j, Math.max(1, Math.round(hw * 0.8)), 1, '#1d4655');
        }
        for (let k = 1; k < 3; k++) G.oc(g, le.x, le.y, le.r - 1 - k * 8, '#2a5a6b');
        const fogged = has('fog') && stOf('fog').turn < 1;
        if (fogged) {
          const fa = 1 - (stOf('fog').turn || 0);
          g.globalAlpha = 0.6 * fa;
          for (let j = -le.r + 2; j < le.r - 1; j += 2) {   // clipped to the glass
            const hw = Math.round(Math.sqrt(Math.max(0, (le.r - 2) * (le.r - 2) - j * j)));
            G.R(g, le.x - hw, le.y + j, hw * 2, 1, '#c8d8e0');
          }
          g.globalAlpha = 1;
        }
        G.fc(g, le.x, le.y, 5, fogged ? '#8fa8b8' : P.cyanLt);
        if (!fogged) G.glow(g, le.x, le.y, le.r * 1.6, le.r * 1.6, P.cyan, 0.7);
        // mirror on its mount + the alignment mark
        G.R(g, pt.mark.x - 1, pt.mark.y, 2, 8, P.lime);
        G.R(g, pt.mark.x - 5, pt.mark.y - 2, 10, 2, P.lime);
        G.plate(g, mi.x + off, mi.y, mi.w, mi.h, P.hullLt, { r: 1, band: 1 });
        G.R(g, mi.x + off + 1, mi.y + 1, mi.w - 2, 2, '#ffffff');
        // iris
        const opened = !has('iris') || stOf('iris').free;
        G.fc(g, ir.x, ir.y, ir.r + 2, OUT);
        G.fc(g, ir.x, ir.y, ir.r + 1, P.hullDk);
        G.fc(g, ir.x, ir.y, ir.r - 1, '#101820');
        // six blades closing over the aperture
        const ap = opened ? ir.r * 0.42 : ir.r * 0.86;
        for (let i = 0; i < 6; i++) {
          const a2 = (i / 6) * Math.PI * 2 + (opened ? 0.5 : 0.1);
          for (let k = 0; k < 3; k++)
            G.line(g, ir.x + Math.cos(a2) * (ir.r - k), ir.y + Math.sin(a2) * (ir.r - k),
              ir.x + Math.cos(a2 + 1.05) * ap, ir.y + Math.sin(a2 + 1.05) * ap,
              k === 0 ? P.hullLt : P.hull, 2);
        }
        if (opened) { G.fc(g, ir.x, ir.y, 4, P.cyanLt); G.glow(g, ir.x, ir.y, 26, 26, P.cyan, 1); }
        else if (Math.sin(t * 5) > 0.2) G.oc(g, ir.x, ir.y, ir.r + 4, '#ffb01f55');
      } else if (s === G.sysById('servo')) {
        const mo = pt.motor, co = pt.coil, en = pt.encoder;
        G.plate(g, mo.x, mo.y, mo.w, mo.h, '#2a3240', { r: 2, band: 2 });
        // windings: a wound copper bobbin
        const burnt = has('burnt') && (stOf('burnt').turn || 0) < 1;
        G.fc(g, co.x, co.y, co.r + 1, OUT);
        G.fc(g, co.x, co.y, co.r, burnt ? '#3a2418' : '#8a5a20');
        for (let k = 0; k < 6; k++) {
          const rr = co.r - k * 3;
          if (rr < 2) break;
          G.oc(g, co.x, co.y, rr, burnt ? (k % 2 ? '#241610' : '#452a18') : (k % 2 ? '#c98a3a' : '#e8b45c'));
        }
        G.fc(g, co.x, co.y, 3, P.hullDk);
        if (burnt) for (let i = 0; i < 4; i++)
          G.R(g, co.x - 8 + i * 5, co.y - co.r - 4 - ((Math.floor(t * 10) + i) % 6), 2, 3, '#5a5a6b');
        // belt over two pulleys
        const boff = has('belt') ? stOf('belt').off : 0;
        const p0 = pt.pulleys[0], p1 = pt.pulleys[1];
        for (const sgn of [-1, 1]) {
          const y0 = p0.y + sgn * p0.r, y1 = p1.y + sgn * p1.r + (sgn > 0 ? boff : 0);
          const slipped = boff > 3 && sgn > 0;
          G.line(g, p0.x, y0, p1.x, y1, OUT, 5);
          G.line(g, p0.x, y0, p1.x, y1, slipped ? '#4a2222' : '#22262e', 3);
          G.line(g, p0.x, y0 - (sgn > 0 ? 1 : 0), p1.x, y1 - (sgn > 0 ? 1 : 0),
            slipped ? '#7a3a3a' : '#3a4250', 1);
        }
        for (const pu of pt.pulleys) {
          G.fc(g, pu.x, pu.y, pu.r + 1, OUT);
          G.fc(g, pu.x, pu.y, pu.r, P.hullDk);
          G.fc(g, pu.x, pu.y, pu.r - 3, '#59677c');
          for (let j = -pu.r + 3; j < 0; j++) {
            const hw = Math.round(Math.sqrt(Math.max(0, (pu.r - 3) * (pu.r - 3) - j * j)));
            G.R(g, pu.x - hw, pu.y + j, Math.max(1, Math.round(hw * 0.7)), 1, '#8a97ad');
          }
          const sp2 = t * 3;
          for (let i = 0; i < 4; i++) {
            const a2 = sp2 + (i / 4) * Math.PI * 2;
            G.R(g, pu.x + Math.cos(a2) * (pu.r - 6), pu.y + Math.sin(a2) * (pu.r - 6), 2, 2, P.hullLt);
          }
          G.fc(g, pu.x, pu.y, 3, P.plateDk2);
        }
        if (boff > 3) {
          G.R(g, p1.x - 11, p1.y + boff - 4, 22, 8, OUT);
          G.R(g, p1.x - 10, p1.y + boff - 3, 20, 6, '#4a2222');
          if (Math.sin(t * 6) > 0) G.oc(g, p1.x, p1.y + boff, 13, '#ffb01f66');
        }
        // encoder disc
        const skipS = has('skip') && !stOf('skip').cal;
        G.fc(g, en.x, en.y, en.r + 1, OUT);
        G.fc(g, en.x, en.y, en.r, '#1d2a20');
        G.oc(g, en.x, en.y, en.r - 1, P.hullDk);
        for (let i = 0; i < 16; i++) {
          const a2 = (i / 16) * Math.PI * 2 + t * (skipS ? 4 + Math.sin(t * 20) * 3 : 1.6);
          G.R(g, en.x + Math.cos(a2) * (en.r - 4) - 1, en.y + Math.sin(a2) * (en.r - 4) - 1, 3, 3,
            i % 2 ? P.lime : '#20301f');
        }
        G.fc(g, en.x, en.y, 4, skipS ? P.magenta : P.lime);
      } else {
        // ---- armour ----
        const dented = has('buckle') || has('weldc');
        for (let i = 0; i < pt.plates.length; i++) {
          const pl = pt.plates[i];
          G.plate(g, pl.x, pl.y, pl.w, pl.h, this.bot.col2, { r: 2, band: 3, rivets: 1 });
          if (dented && i === 1) {
            const pr = (stOf('buckle') || stOf('weldc')).press || 0;
            const d = Math.round(8 * (1 - pr));
            for (let j = 0; j < pl.h - 8; j++) {
              const w = Math.round(d * Math.sin((j / (pl.h - 8)) * Math.PI));
              if (w <= 0) continue;
              G.R(g, pl.x + pl.w / 2 - w, pl.y + 4 + j, w * 2, 1, G.shade(this.bot.col2, -0.5));
            }
          }
        }
        for (let i = 0; i < pt.holes.length; i++) {
          const h2 = pt.holes[i];
          const filled = !has('sheared') || stOf('sheared').holes[i];
          G.oc(g, h2.x, h2.y, 6, OUT);
          G.oc(g, h2.x, h2.y, 5, filled ? P.hull : '#0d1018');
          if (filled) { G.R(g, h2.x - 3, h2.y - 3, 6, 6, P.hullLt); G.R(g, h2.x - 1, h2.y - 3, 2, 6, P.hullDk); }
          else if (Math.sin(t * 6 + i) > 0.3) G.oc(g, h2.x, h2.y, 8, '#ff5a2a55');
        }
        if (has('weldc')) for (const o of stOf('weldc').seam) {
          const sx = pt.seam.x0 + 14 + o.i * 38;
          if (o.gone) { G.R(g, sx - 8, pt.seam.y0 - 2, 16, 4, P.hazard); G.R(g, sx - 8, pt.seam.y0 - 2, 16, 1, '#ffe89a'); }
          else { G.R(g, sx - 9, pt.seam.y0 - 3, 18, 6, OUT); G.R(g, sx - 8, pt.seam.y0 - 2, 16, 4, '#0a0c12'); }
        }
      }
    },

    gear(g, cx, cy, r, ang, col) {
      const n = Math.max(8, Math.round(r * 0.8));
      for (let i = 0; i < n; i++) {                 // teeth first, under the rim
        const a = ang + (i / n) * Math.PI * 2;
        G.R(g, cx + Math.cos(a) * (r + 1) - 2, cy + Math.sin(a) * (r + 1) - 2, 5, 5, OUT);
        G.R(g, cx + Math.cos(a) * (r + 1) - 1, cy + Math.sin(a) * (r + 1) - 1, 3, 3, G.shade(col, 0.3));
      }
      G.fc(g, cx, cy, r + 1, OUT);
      G.fc(g, cx, cy, r, col);
      G.fc(g, cx, cy, r - 2, G.shade(col, -0.22));
      // a lit crescent so it reads as a turned disc
      for (let j = -r; j < 0; j++) {
        const hw = Math.round(Math.sqrt(Math.max(0, r * r - j * j)));
        G.R(g, cx - hw + 1, cy + j, Math.max(1, Math.round(hw * 0.7)), 1, G.shade(col, 0.2));
      }
      // spokes
      for (let i = 0; i < 4; i++) {
        const a = ang * 1.0 + (i / 4) * Math.PI * 2;
        G.line(g, cx + Math.cos(a) * 3, cy + Math.sin(a) * 3,
          cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4), G.shade(col, -0.4), 2);
      }
      G.fc(g, cx, cy, 4, P.hullDk);
      G.R(g, cx - 1, cy - 1, 2, 2, P.hullLt);
    },
  };
})();

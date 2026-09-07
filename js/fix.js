// ============================================================
// DOUBLE LIFE v14 - fix.js  ·  THE BENCH
//
// She carried you off the site in a shopping trolley, put you on the
// bench under the good lamp, and went and got the crate marked SPARES.
// This is the six minutes where you get a leg back.
//
// Six stages, each gated, each a different verb:
//   SEAT   drag the leg into the socket until it goes home
//   LINES  three leads, three ports, and they are not in the same order
//   BOLTS  tap a bolt, hold to torque, let go inside the green
//   PRIME  hold the pump twice, and it stops itself at the top
//   POWER  throw the switch
//   TOES   wiggle all three, in any order, because she wants to see it work
//
// Nothing here can be failed at all. See the note above the constants.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  const BENCH_Y = 126;                 // the bench surface
  // ---- YOU, on the bench. This used to be an abstract plate stencilled
  // DAIRY UNIT 4 with a hole cut in it - a diagram of a hip rather than
  // a hip. It is the whole machine now, sat on the edge of her bench
  // with one leg gone, and every coordinate below is derived from where
  // the rig actually puts the socket, not chosen by eye. ----
  const ME = { cx: 90, footY: 138, sc: 1.5 };
  const SOCK = { x: 101, y: 118, r: 13 };  // = ME's hip, where the leg goes
  // the spare, lying on the bench past the switch. It used to float at
  // 232,96 with its hoof inside Tracy.
  const RACK = { x: 210, y: 116 };
  const PORTS_X = 38;                      // the junction box on the bench
  // The pump hangs on the pegboard directly ABOVE the leg now. It used to
  // stand on the bench at 140,116 -- which was clear space back when the
  // socket was a diagram up in the corner, and is the middle of your new
  // shin now that you are sat on the bench at full size. Its body and
  // gauge were covering two thirds of the leg, toe lamps and all.
  const PUMP = { x: 150, y: 78 };
  const SWITCH = { x: 186, y: 112 };
  // short enough to lie in a clear stretch of bench at either end -- on
  // the rack without reaching Tracy, and fitted without reaching the switch
  const LEG_LEN = 56;

  // ---- HOW HARD THIS IS ALLOWED TO BE ----
  // It was a reaction test in five parts. The needle climbed, you had a
  // third of a second to let go inside a narrow band, and if you were
  // slow the bolt stripped and you did it again. That is a fine minigame
  // and a terrible thing to put between a player and the rest of the
  // story, ten minutes in, while a woman waits to teach you the game.
  //
  // So the timing came out of it. The green band now runs all the way to
  // the top of the gauge and the needle CLAMPS there instead of stripping,
  // which means holding the driver down and letting go whenever you like
  // always seats the bolt. The only way to get it wrong is to let go
  // almost immediately, which is not a thing anybody does by accident.
  // Same for the pump: it fills, it stops at the top, the seal never
  // blows. Everything you can touch got a bigger hit box, the leads snap
  // from twice as far, and the toes take any order.
  //
  // Nothing here can be failed. What is left is the FEEL of it -- the
  // needle, the clunk, the sparks, her leaning in - which is the part
  // that was ever worth having.
  const TQ_LO = 0.3;                    // past here the bolt bites, full stop
  const PR_LO = 0.28;
  const PUMPS = 2;                      // was three good strokes
  // hit boxes, all of them generous. A finger on a phone is about 8
  // logical units across and every one of these used to be smaller.
  const R_LEG = 52, R_SEAT = 40, R_LEAD = 17, R_PORT = 24,
        R_BOLT = 17, R_PUMP = 34, R_TOE = 16;
  // how long you can be stuck on a step before the scene points at the
  // answer rather than letting you hunt for it
  const NUDGE = 7;

  const LEAD = [
    { id: 'hyd', col: '#e0574a', lit: '#ff8a7a', name: 'HYD' },
    { id: 'pwr', col: '#f0c04a', lit: '#ffe08a', name: 'PWR' },
    { id: 'sig', col: '#3a8ac8', lit: '#8fd8ff', name: 'SIG' },
  ];

  const STEPS = [
    { id: 'seat',  hint: 'DRAG THE LEG INTO THE SOCKET',
      say: "RIGHT. IT'S A LEG. LINE IT UP AND PUSH IT HOME." },
    { id: 'lines', hint: 'MATCH EACH LEAD TO ITS PORT',
      say: "THREE LEADS. RED TO RED. DO NOT GUESS AT IT." },
    { id: 'bolts', hint: 'HOLD EACH BOLT UNTIL IT GOES GREEN',
      say: "FOUR BOLTS. HOLD THE DRIVER ON TILL IT BITES. TAKE YOUR TIME." },
    { id: 'prime', hint: 'HOLD THE PUMP, TWICE',
      say: "NOW PRIME IT. TWO GOOD LONG PULLS." },
    { id: 'power', hint: 'THROW THE SWITCH',
      say: "GO ON THEN. WAKE IT UP." },
    { id: 'toes',  hint: 'TAP ALL THREE TOES',
      say: "WIGGLE THEM FOR ME. ANY ORDER. HUMOUR AN OLD WOMAN." },
    { id: 'done',  hint: null,
      say: "THERE. YOU'VE GOT A LEG. TRY NOT TO LOSE THIS ONE." },
  ];

  const fix = (G.scenes = G.scenes || {}).legfit = {
    // the layout, so a harness drives the real geometry instead of
    // remembering where the socket used to be
    geom: { ME, SOCK, RACK, PORTS_X, PUMP, SWITCH, BENCH_Y, LEG_LEN },
    enter() {
      this.t = 0;
      this.step = 0;
      this.stepT = 0;
      this.msg = null; this.msgT = 9;
      this.spark = [];
      this.shakeT = 0;

      // ---- the leg, on the rack ----
      this.leg = { x: RACK.x, y: RACK.y, drag: 0, seated: 0, tilt: 0.5, glow: 0, gx: -26, gy: 0 };
      this.lit = [0, 0, 0];                       // which toes have wiggled

      // ---- the leads, and the ports they do not line up with ----
      this.leads = LEAD.map((L, i) => ({
        id: L.id, col: L.col, lit: L.lit, name: L.name,
        hx: 0, hy: 0, drag: 0, to: null, i,
      }));
      // park them on the leg straight away: they used to sit at 0,0 until
      // the seat stage moved them, so anything that started the scene at a
      // later step drew three cables into the top corner of the screen
      for (const L of this.leads) { const h = this.leadHome(L.i); L.hx = h.x; L.hy = h.y; }
      const order = [2, 0, 1];                    // the ports are shuffled
      this.ports = order.map((k, i) => ({
        id: LEAD[k].id, col: LEAD[k].col, lit: LEAD[k].lit, name: LEAD[k].name,
        x: PORTS_X, y: 88 + i * 14, taken: 0,
      }));

      // ---- four bolts round the collar ----
      this.bolts = [];
      for (let i = 0; i < 4; i++) {
        const a = Math.PI * 0.25 + i * Math.PI * 0.5;
        this.bolts.push({ a, x: SOCK.x + Math.cos(a) * 20, y: SOCK.y + Math.sin(a) * 20,
          seated: 0, torque: 0, spin: 0 });
      }
      this.bolt = -1;                             // the one in the driver
      this.driving = 0;

      // ---- the prime ----
      this.press = 0; this.pumps = 0; this.pumping = 0;

      // ---- the wake-up ----
      this.power = 0; this.toe = 0; this.toeT = 0;

      G.steam.length = 0;
      G.audio.music('title');
      G.hideCursor = false;
    },

    cur() { return STEPS[Math.min(this.step, STEPS.length - 1)]; },
    advance() {
      if (this.step < STEPS.length - 1) { this.step++; this.stepT = 0; G.audio.sfx('order'); }
    },
    say(m) { this.msg = m; this.msgT = 0; },
    burst(x, y, n, col) {
      for (let i = 0; i < n; i++)
        this.spark.push({ x, y, vx: G.rand(-40, 40), vy: G.rand(-50, 6),
          t: 0, life: G.rand(0.25, 0.7), col });
    },

    // Where a plug parks when it is not in a port: the clear stretch of
    // bench face to the right of you. This used to be leg coordinates,
    // which put three plugs up at head height once the socket moved down
    // onto the bench and stretched the cables across the room and over
    // your face. Bench coordinates are safe here because the leads only
    // exist once the leg is seated.
    leadHome(i) { return { x: RACK.x + i * 20, y: BENCH_Y + 4 }; },

    // ---------------- input ----------------
    onDown(x, y) {
      const st = this.cur();
      if (st.id === 'done') { if (this.stepT > 0.6) this.finish(); return; }

      if (st.id === 'seat') {
        // anywhere on the leg picks it up, and it keeps the grip you took
        // it by so it does not jump out from under the pointer
        if (G.dist(x, y, this.leg.x + LEG_LEN / 2, this.leg.y) < R_LEG) {
          this.leg.drag = 1;
          this.leg.gx = this.leg.x - x; this.leg.gy = this.leg.y - y;
          G.audio.sfx('grab');
        }
        return;
      }
      if (st.id === 'lines') {
        // the nearest loose plug wins, so two plugs parked close together
        // cannot fight over a tap
        let best = null, bd = R_LEAD;
        for (const L of this.leads) {
          if (L.to) continue;
          const d = G.dist(x, y, L.hx, L.hy);
          if (d < bd) { bd = d; best = L; }
        }
        if (best) { best.drag = 1; G.audio.sfx('grab'); }
        return;
      }
      if (st.id === 'bolts') {
        let best = -1, bd = R_BOLT;
        for (let i = 0; i < 4; i++) {
          const b = this.bolts[i];
          if (b.seated) continue;
          const d = G.dist(x, y, b.x, b.y);
          if (d < bd) { bd = d; best = i; }
        }
        if (best >= 0) { this.bolt = best; this.driving = 1; G.audio.sfx('grab'); }
        return;
      }
      if (st.id === 'prime') {
        if (G.dist(x, y, PUMP.x, PUMP.y - 8) < R_PUMP) { this.pumping = 1; G.audio.sfx('grab'); }
        return;
      }
      if (st.id === 'power') {
        if (G.inRect(x, y, SWITCH.x - 15, SWITCH.y - 18, 30, 28)) {
          this.power = 0.001;
          G.audio.sfx('boot'); G.shake(3, 0.3); G.screenFlash('#cfe4ff', 0.2);
          this.burst(this.leg.x + 20, this.leg.y, 16, '#7fd8ff');
          this.advance();
        }
        return;
      }
      if (st.id === 'toes') {
        // ANY ORDER. It used to insist on left-to-right and tell you off
        // for wiggling the wrong toe, which is a memory test bolted onto
        // the one beat in the scene that is pure delight.
        this.lit = this.lit || [0, 0, 0];
        for (let i = 0; i < 3; i++) {
          const tx = this.leg.x + LEG_LEN - 2, ty = this.leg.y - 12 + i * 12;
          if (G.dist(x, y, tx, ty) >= R_TOE || this.lit[i]) continue;
          this.lit[i] = 1; this.toe++; this.toeT = 0;
          G.audio.sfx('click'); this.burst(tx, ty, 7, '#b6ff3a');
          if (this.toe >= 3) { this.advance(); G.audio.sfx('unlock'); }
          return;
        }
        return;
      }
    },

    onMove(x, y) {
      if (this.leg.drag) {
        this.leg.x = x + (this.leg.gx === undefined ? -26 : this.leg.gx);
        this.leg.y = y + (this.leg.gy || 0);
      }
      for (const L of this.leads) if (L.drag) { L.hx = x; L.hy = y; }
    },

    onUp() {
      const st = this.cur();
      if (this.leg.drag) {
        this.leg.drag = 0;
        if (G.dist(this.leg.x, this.leg.y, SOCK.x + 8, SOCK.y) < R_SEAT) {
          this.leg.x = SOCK.x + 8; this.leg.y = SOCK.y; this.leg.seated = 1;
          this.leg.tilt = 0;
          G.audio.sfx('clank'); G.shake(2.6, 0.2);
          this.burst(SOCK.x + 6, SOCK.y, 12, '#cfe4ff');
          for (let i = 0; i < 3; i++) {
            const h = this.leadHome(i);
            this.leads[i].hx = h.x; this.leads[i].hy = h.y;
          }
          this.advance();
        } else { G.audio.sfx('back'); this.say('NOT EVEN CLOSE, LOVE.'); }
      }
      for (const L of this.leads) {
        if (!L.drag) continue;
        L.drag = 0;
        // the plug goes to whichever free port is nearest, from a long way
        // off, so this is aiming at a colour and not threading a needle
        let hit = null, hd = R_PORT;
        for (const pt of this.ports) {
          if (pt.taken) continue;
          const d = G.dist(L.hx, L.hy, pt.x, pt.y);
          if (d < hd) { hd = d; hit = pt; }
        }
        if (hit && hit.id === L.id) {
          hit.taken = 1; L.to = hit;
          L.hx = hit.x; L.hy = hit.y;
          G.audio.sfx('click'); this.burst(hit.x, hit.y, 6, L.lit);
          if (this.leads.every((q) => q.to)) this.advance();
        } else {
          // wrong hole: she says so, and that is the whole punishment.
          // It used to snap the lead back across the bench and shake the
          // screen, which reads as a mistake you have to undo.
          if (hit) { this.say("THAT HOLE'S " + hit.name + '. YOU HAVE GOT ' + L.name + '.'); G.audio.sfx('back'); }
          const h = this.leadHome(L.i);
          L.hx = h.x; L.hy = h.y;
        }
      }
      if (this.driving) {
        // the bolt: let go inside the band or do it again
        const b = this.bolts[this.bolt];
        this.driving = 0;
        if (b && b.torque > TQ_LO) {
          b.seated = 1; b.torque = 0.8;
          G.audio.sfx('clank'); this.burst(b.x, b.y, 6, '#b6ff3a');
          if (this.bolts.every((q) => q.seated)) this.advance();
        } else if (b) {
          // the only failure left: letting go before the needle moved
          b.torque = 0;
          this.say('HOLD IT DOWN, LOVE. GIVE IT A SECOND.');
          G.audio.sfx('back');
        }
        this.bolt = -1;
      }
      if (this.pumping) {
        this.pumping = 0;
        if (this.press > PR_LO) {
          this.pumps++; G.audio.sfx('click');
          this.burst(PUMP.x + 12, PUMP.y - 12, 8, '#8fd8c0');
          if (this.pumps >= PUMPS) this.advance();
        } else {
          this.say('LONGER. LEAN ON IT.');
          G.audio.sfx('back');
        }
        this.press = 0;
      }
    },

    // ---------------- update ----------------
    update(dt) {
      dt = Math.min(dt, 1 / 30);
      this.t += dt; this.stepT += dt; this.msgT += dt;
      const st = this.cur();

      // the bolt in the driver. It climbs and then it SITS at the top -
      // it used to strip at 1.0 and throw the whole bolt away, which
      // punished the one thing a first-time player does, which is hold on
      // and watch what happens.
      if (this.driving && this.bolt >= 0) {
        const b = this.bolts[this.bolt];
        b.torque = Math.min(1, b.torque + dt * 0.62);
        b.spin += dt * (3 + b.torque * 9);
        if (Math.random() < dt * 20) this.burst(b.x, b.y, 1, '#8a94a8');
      }
      for (const b of this.bolts) if (!b.seated && !(this.driving && this.bolts[this.bolt] === b))
        b.torque = Math.max(0, b.torque - dt * 1.6);

      // the pump, same deal: it fills and it stops. No blown seal.
      if (this.pumping) this.press = Math.min(1, this.press + dt * 0.8);
      else this.press = Math.max(0, this.press - dt * 0.9);

      // it wakes up
      if (this.power > 0) this.power = Math.min(1, this.power + dt * 1.4);
      this.leg.glow = G.lerp(this.leg.glow, this.power, Math.min(1, dt * 4));
      if (st.id === 'toes') this.toeT += dt;

      for (let i = this.spark.length - 1; i >= 0; i--) {
        const s = this.spark[i];
        s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 140 * dt;
        if (s.t > s.life) this.spark.splice(i, 1);
      }
      G.updateSteam(dt);
    },

    finish() {
      G.state.legFixed = 1;
      G.save();
      G.go('tracy', "TRACY'S PLACE");
    },

    // ---------------- draw ----------------
    draw(g) {
      const t = this.t;
      const st = this.cur();
      G.toastY = -40;

      // ===== her workshop corner =====
      G.R(g, 0, 0, G.W, G.H, '#2a2028');
      // pegboard
      G.R(g, 0, 0, G.W, BENCH_Y, '#4a3a34');
      G.grain(g, 0, 0, G.W, BENCH_Y, '#3a2c28', 0.06, 5);
      for (let y = 8; y < BENCH_Y - 8; y += 9)
        for (let x = 8; x < G.W - 6; x += 9) G.Rq(g, x, y, 1, 1, '#332622');
      G.plate(g, -4, BENCH_Y - 6, G.W + 8, 6, '#6b4a34', { r: 1, band: 2, grain: 2 });
      // the tool rail
      for (let i = 0; i < 8; i++) {
        const tx = 14 + i * 24;
        if (tx > 200) break;
        G.Rh(g, tx - 3, 8, 6, 1.5, '#4a5568');
        const k = i % 4;
        if (k === 0) { G.Rh(g, tx - 1.5, 9, 3, 16, '#8a94a8'); G.Rh(g, tx - 3, 22, 6, 4, '#8a94a8'); }
        else if (k === 1) { G.Rh(g, tx - 1, 9, 2, 20, '#6b7f96'); G.Rh(g, tx - 4, 24, 8, 3, '#c8a24a'); }
        else if (k === 2) { for (let j = 0; j < 12; j++) G.Rh(g, tx - 2 + (j % 2), 9 + j, 4, 1, '#b8bcc4'); }
        else { G.Rh(g, tx - 3, 9, 6, 10, '#8a5c3a'); G.Rh(g, tx - 1, 19, 2, 8, '#8a94a8'); }
      }
      // a shelf of jars of screws
      G.plate(g, 208, 26, 92, 3, '#6b4a34', { r: 1, band: 1, spec: false });
      for (let i = 0; i < 5; i++) {
        const jx = 214 + i * 17;
        G.plate(g, jx, 14, 12, 12, '#3a3a44', { r: 1, band: 1, spec: false });
        G.Rh(g, jx + 1, 18, 10, 7, ['#c8a24a', '#8a94a8', '#c8505c', '#8fd8c0', '#b48ae0'][i]);
        G.hairq(g, jx + 1, 18, 10, '#ffffff');
      }
      // the good lamp, right over the joint
      G.Rh(g, 118, 0, 1.5, 12, '#3a2c28');
      for (let j = 0; j < 7; j++)
        G.Rh(g, 119 - (26 - j * 3.4) / 2, 12 + j, 26 - j * 3.4, 1, j < 2 ? '#e0c04a' : '#8a6a24');
      G.fc(g, 119, 20, 3, '#fff4c8');
      G.glow(g, 119, 30, 210, 150, '#ffd47a', 0.42);
      // a photo pinned up, of a shop that is not there any more
      G.plate(g, 254, 46, 34, 26, '#e8dccb', { r: 1, band: 1, spec: false });
      G.R(g, 257, 49, 28, 17, '#3a5a6b');
      G.R(g, 257, 58, 28, 8, '#8a6a44');
      G.Rh(g, 262, 52, 8, 6, '#e8828c');
      G.text(g, '1998', 271, 67, '#8a7458', { align: 'center', sc: 0.5 });

      // ===== the bench =====
      G.plate(g, -4, BENCH_Y, G.W + 8, 12, '#8a5c3a', { r: 2, band: 3, grain: 4 });
      G.hair(g, -4, BENCH_Y, G.W + 8, '#c8945c');
      for (let x = 0; x < G.W; x += 22) G.vseam(g, x, BENCH_Y + 2, 9, '#5c3a20', '#a87a4a');
      G.R(g, -4, BENCH_Y + 12, G.W + 8, G.H - BENCH_Y - 12, '#3a2820');
      G.grain(g, 0, BENCH_Y + 12, G.W, 44, '#2a1c16', 0.08, 7);
      // a vice at the left end, and a mug she has not finished
      G.plate(g, 6, BENCH_Y - 14, 22, 14, '#5c6470', { r: 1, band: 2, bolts: 1 });
      G.Rh(g, 10, BENCH_Y - 18, 14, 4, '#8a94a8');
      G.Rh(g, 2, BENCH_Y - 10, 6, 3, '#3a4250');
      G.plate(g, 292, BENCH_Y - 12, 14, 12, '#c8505c', { r: 1, band: 1, spec: false });
      G.Rh(g, 294, BENCH_Y - 10, 10, 3, '#6b3a2a');
      // screws that got away
      for (let i = 0; i < 9; i++)
        G.Rq(g, 40 + G.hash(i, 3) * 230, BENCH_Y + 3 + G.hash(i, 7) * 6, 2, 1, '#8a94a8');

      // ===== YOU. The hip, close up, with the hole in it. =====
      this.drawMe(g, t);

      // ===== the leg =====
      this.drawLeg(g, t);
      // ===== her =====
      const wants = st.id === 'done';
      G.drawTracy(g, 288, BENCH_Y + 2, 1.0, {
        t, clip: this.stepT * 34 < st.say.length ? 'talk' : (st.id === 'bolts' || st.id === 'lines') ? 'reach' : 'idle',
        ct: t, dir: -1, smile: wants, p: 0.7,
      });

      // ===== the leads =====
      this.drawLeads(g, t);

      // ===== the bolts, and the torque gauge =====
      if (this.step >= 2) this.drawBolts(g, t);

      // ===== the pump and the switch =====
      this.drawPump(g, t);
      this.drawSwitch(g, t);

      // ===== stuck? then stop being coy about where the thing is =====
      this.nudge(g, t);

      // ===== sparks =====
      for (const s of this.spark) {
        g.globalAlpha = Math.max(0, 1 - s.t / s.life);
        G.Rq(g, s.x, s.y, 1, 1, s.col);
        g.globalAlpha = 1;
      }

      // ===== the lesson =====
      this.drawTalk(g, t);
      G.grade(g, 1);
    },

    // ---- YOU. All of you, sat on the edge of her bench with one leg
    // off, having a cry about it. ----
    drawMe(g, t) {
      // where you are sat, so you are on the bench and not hovering
      g.globalAlpha = 0.34;
      G.fe(g, ME.cx + 2, BENCH_Y + 1, 26, 4, '#1a1008');
      g.globalAlpha = 1;

      const done = this.cur().id === 'done';
      // the crying eases off once the leg is in, and stops when it works
      const cry = done ? 0 : this.step >= 4 ? 0.4 : 1;
      G.drawBot(g, 'player', ME.cx, ME.footY, ME.sc, {
        t, walk: 0, noBlink: done ? 0 : 1,
        // the socket stays empty the whole way through: the leg you are
        // fitting IS the leg, so the rig must not draw a second one over it
        legOff: 1,
        mood: done ? 'idle' : 'sick',
        open: done ? 0.1 : 0.24 + Math.sin(t * 1.3) * 0.06,
        clip: done ? 'idle' : 'slump', ct: t, p: 1,
        cry,
      });

      // ---- the junction box on the bench, and the loom out of it ----
      const bx = PORTS_X - 15, by = 80;
      G.plate(g, bx, by, 30, 52, '#2a3040', { r: 2, band: 2, bolts: 1 });
      G.R(g, bx + 3, by + 4, 24, 44, '#141a24');
      G.bevelq(g, bx + 3, by + 4, 24, 44, '#0b0e14', '#4a5468');
      G.text(g, 'LOOM', bx + 15, by - 7, '#6b7f96', { align: 'center', sc: 0.5 });
      for (const pt of this.ports) {
        G.oc(g, pt.x, pt.y, 6, '#12161f');
        G.fc(g, pt.x, pt.y, 4, pt.taken ? pt.col : G.shade(pt.col, -0.55));
        G.fc(g, pt.x, pt.y, 2, '#12161f');
        if (pt.taken) G.glow(g, pt.x, pt.y, 22, 16, pt.lit, 0.4);
        G.text(g, pt.name, pt.x + 9, pt.y - 3, pt.taken ? pt.lit : '#8fa0bc', { sc: 0.5 });
      }
      // a fat cable from the box up to the bench edge, because it is
      // plugged into something
      G.loom(g, bx + 15, by, bx + 26, by - 14, 5, '#1a1f2e', '#5c6470');

      // ---- the socket she cut clean, right where the leg came off ----
      G.fc(g, SOCK.x, SOCK.y, SOCK.r + 2, OUT);
      G.fc(g, SOCK.x, SOCK.y, SOCK.r + 1, '#a8b4c8');
      G.fc(g, SOCK.x, SOCK.y, SOCK.r - 1, '#6b7788');
      G.oc(g, SOCK.x, SOCK.y, SOCK.r, '#d8e4f0');
      G.fc(g, SOCK.x, SOCK.y, SOCK.r - 4, '#232b38');
      G.fc(g, SOCK.x, SOCK.y, SOCK.r - 6, this.leg.seated ? '#3a4250' : '#0d1118');
      for (let i = 0; i < 10; i++) {
        const a2 = i * 0.628;
        G.Rq(g, SOCK.x + Math.cos(a2) * (SOCK.r - 1.5), SOCK.y + Math.sin(a2) * (SOCK.r - 1.5), 1, 1, '#8a94a8');
      }
      G.Rh(g, SOCK.x - 1, SOCK.y - SOCK.r, 2, 4, '#8a94a8');   // the keyway
      if (!this.leg.seated) {
        // torn loom still live in the hole
        for (let i = 0; i < 5; i++)
          G.Rh(g, SOCK.x - 6 + i * 3, SOCK.y - 4 + (i % 2) * 2, 2, 6, i % 2 ? '#48546c' : '#6b3f22');
        if (Math.random() < 0.16) {
          G.pip(g, SOCK.x + G.rand(-6, 6), SOCK.y + G.rand(-4, 4), '#ffffff');
          G.glow(g, SOCK.x, SOCK.y, 34, 24, '#7fd8ff', 0.5);
        }
        // the ghost of where it goes
        const fl = Math.sin(t * 4) > 0 ? 1 : 0.4;
        g.globalAlpha = 0.3 * fl;
        G.oc(g, SOCK.x + 8, SOCK.y, 11, '#b6ff3a');
        for (let i = 0; i < 8; i++) G.Rq(g, SOCK.x + 20 + i * 7, SOCK.y - 0.5, 3, 1, '#b6ff3a');
        g.globalAlpha = 1;
      }
    },

    // ---- the leg out of the crate marked SPARES ----
    drawLeg(g, t) {
      const L = this.leg;
      const x = Math.round(L.x), y = Math.round(L.y);
      const lit = L.glow;
      const c = '#bcc0c6';
      g.globalAlpha = 0.3;
      G.rr(g, x - 4, BENCH_Y - 2, LEG_LEN + 12, 4, '#000000');
      g.globalAlpha = 1;
      // the ball joint at the inboard end
      G.oc(g, x, y, 10, OUT);
      G.fc(g, x, y, 9, '#8a94a8');
      G.fc(g, x, y, 6, '#c8ccd4');
      G.Rq(g, x - 3, y - 3, 2, 2, '#ffffff');
      // the shaft, with a knee band two thirds along
      G.R(g, x + 6, y - 9, LEG_LEN - 20, 18, OUT);
      G.R(g, x + 7, y - 8, LEG_LEN - 22, 16, c);
      G.R(g, x + 7, y - 8, LEG_LEN - 22, 3, '#e8ecf2');
      G.R(g, x + 7, y + 5, LEG_LEN - 22, 3, '#7a828e');
      for (let i = 0; i < 3; i++) G.vseam(g, x + 16 + i * 14, y - 6, 12, '#5c6470', '#e8ecf2');
      const kx = x + 40;
      G.R(g, kx - 2, y - 11, 8, 22, OUT);
      G.R(g, kx - 1, y - 10, 6, 20, '#8a94a8');
      G.hair(g, kx - 1, y - 10, 6, '#d8e4f0');
      G.rivet(g, kx + 2, y, '#0b0e14', '#e8ecf2');
      // the hoof
      G.R(g, x + LEG_LEN - 16, y - 11, 18, 22, OUT);
      G.R(g, x + LEG_LEN - 15, y - 10, 16, 20, '#4a3f56');
      G.hair(g, x + LEG_LEN - 15, y - 10, 16, '#7a6a88');
      G.R(g, x + LEG_LEN - 15, y + 8, 16, 2, '#221a2c');
      // three toe lamps, which is what she is going to make you wiggle.
      // Any of them, in any order, so every unlit one is breathing at you
      // at once rather than queueing up.
      const lt = this.lit || [0, 0, 0];
      for (let i = 0; i < 3; i++) {
        const tx = x + LEG_LEN - 2, ty = y - 12 + i * 12;
        const on = this.step >= 5 && lt[i];
        const nxt = this.step === 5 && !lt[i] && Math.sin(t * 6 + i * 1.1) > -0.2;
        G.oc(g, tx, ty, 4, '#12161f');
        G.fc(g, tx, ty, 3, on ? '#b6ff3a' : nxt ? '#7fd8ff' : '#2a3a2a');
        if (on || nxt) G.glow(g, tx, ty, 20, 16, on ? '#b6ff3a' : '#7fd8ff', 0.5);
      }
      if (lit > 0.05) {
        g.globalAlpha = lit * 0.5;
        G.glow(g, x + LEG_LEN / 2, y, LEG_LEN + 40, 44, '#7fd8ff', 0.6);
        g.globalAlpha = 1;
        for (let i = 0; i < 3; i++)
          G.Rh(g, x + 12 + i * 18, y - 8 + Math.sin(t * 6 + i) * 0.5, 6, 1, '#7fd8ff');
      }
      if (!L.seated) {
        G.text(g, 'SPARES', x + LEG_LEN / 2 - 8, y + 14, '#8a7458', { align: 'center', sc: 0.5 });
      }
    },

    // ---- three leads, and the sag in them ----
    // Each lead is ROOTED in the new leg and its free end is either
    // parked on the bench, in your hand, or in a port. It used to be the
    // other way round -- rooted at the parking spot with nothing joining
    // it to you -- and three unattached blocks on a bench read as litter,
    // not as something to pick up.
    leadRoot(i) { return { x: SOCK.x + 11 + i * 5, y: SOCK.y + 3 }; },
    drawLeads(g, t) {
      if (this.step < 1) return;
      for (const L of this.leads) {
        const r = this.leadRoot(L.i);
        const ex = L.hx, ey = L.hy;
        const sag = 3 + Math.abs(ex - r.x) * 0.05 + Math.max(0, r.y - ey) * 0.2;
        const n = 44;
        const at = (q) => [G.lerp(r.x, ex, q),
          G.lerp(r.y, ey, q) + Math.sin(q * Math.PI) * sag];
        for (let i = 0; i <= n; i++) { const c = at(i / n); G.Rh(g, c[0] - 1, c[1] - 1, 3, 3, OUT); }
        for (let i = 0; i <= n; i++) {
          const c = at(i / n);
          G.Rh(g, c[0] - 0.5, c[1] - 0.5, 2, 2, L.col);
          G.Rq(g, c[0] - 0.5, c[1] - 0.5, 1, 1, L.lit);
        }
        // the collar it comes out of your leg through
        G.R(g, r.x - 3, r.y - 4, 5, 8, '#4a5568');
        G.hairq(g, r.x - 3, r.y - 4, 5, '#8a94a8');
        // the plug on the end. A loose one is lit and breathing, because
        // it is the thing the stage is asking you to find.
        const loose = !L.to && !L.drag;
        if (loose) G.glow(g, ex, ey, 24, 20, L.lit, 0.24 + Math.sin(t * 4 + L.i) * 0.16);
        G.R(g, ex - 5, ey - 5, 11, 11, OUT);
        G.R(g, ex - 4, ey - 4, 9, 9, loose ? L.lit : L.col);
        G.R(g, ex - 3, ey - 3, 7, 7, L.col);
        G.hairq(g, ex - 3, ey - 3, 7, L.lit);
        G.Rq(g, ex - 1, ey - 1, 2, 2, '#12161f');
        if (loose) G.text(g, L.name, ex, ey - 11, L.lit, { align: 'center', sc: 0.5 });
      }
      // and the port names again on top: every run into the box crosses
      // the label it is aimed at, so drawing them once under the cables
      // left you plugging leads into words you could not read
      for (const pt of this.ports)
        G.text(g, pt.name, pt.x + 9, pt.y - 3, pt.taken ? pt.lit : '#8fa0bc', { sc: 0.5 });
    },

    // ---- WHERE THE THING IS ----
    // Every stage lights its own target already, but quietly, in the way
    // a thing you have found is lit. If you have been on a step for a
    // while without solving it the scene stops being subtle: a ring lands
    // on exactly what to touch, and it stays until you touch it. Nobody
    // should be stuck in the tutorial hunting for a pump.
    nudge(g, t) {
      if (this.stepT < NUDGE) return;
      const st = this.cur();
      let p = null;
      if (st.id === 'seat') p = { x: SOCK.x + 8, y: SOCK.y, r: 18 };
      else if (st.id === 'lines') {
        const L = this.leads.find((q) => !q.to);
        if (L) p = { x: L.hx, y: L.hy, r: 12 };
      } else if (st.id === 'bolts') {
        const b = this.bolts.find((q) => !q.seated);
        if (b) p = { x: b.x, y: b.y, r: 11 };
      } else if (st.id === 'prime') p = { x: PUMP.x, y: PUMP.y - 8, r: 20 };
      else if (st.id === 'power') p = { x: SWITCH.x, y: SWITCH.y - 4, r: 18 };
      else if (st.id === 'toes') {
        const i = this.lit.indexOf(0);
        if (i >= 0) p = { x: this.leg.x + LEG_LEN - 2, y: this.leg.y - 12 + i * 12, r: 10 };
      }
      if (!p) return;
      // two rings running outward, so it reads as "here" and not as decor
      for (let k = 0; k < 2; k++) {
        const q = ((t * 0.9 + k * 0.5) % 1);
        g.globalAlpha = (1 - q) * 0.85;
        G.oc(g, p.x, p.y, p.r + q * 12, '#b6ff3a');
        g.globalAlpha = 1;
      }
      G.pill(g, p.x, p.y - p.r - 5, 'HERE', '#b6ff3a');
    },

    // ---- four bolts, and a needle that says when to stop ----
    drawBolts(g, t) {
      for (let i = 0; i < 4; i++) {
        const b = this.bolts[i];
        const r = b.seated ? 4 : 5;
        // a hex cap: a ring, a face, and a driver slot that turns
        G.oc(g, b.x, b.y, r + 1, OUT);
        G.fc(g, b.x, b.y, r, b.seated ? '#7f8894' : '#a6aeb8');
        G.fc(g, b.x, b.y, r - 1.5, b.seated ? '#5c6470' : '#8a94a8');
        const a = b.spin;
        G.Rh(g, b.x - Math.cos(a) * r * 0.75, b.y - Math.sin(a) * r * 0.75,
          Math.max(1, Math.abs(Math.cos(a)) * r * 1.5 + 1), Math.max(1, Math.abs(Math.sin(a)) * r * 1.5 + 1), '#3a4250');
        G.Rq(g, b.x - r * 0.6, b.y - r * 0.6, 1, 1, '#e8ecf2');
        if (b.seated) G.Rq(g, b.x - 0.5, b.y - r - 2.5, 1, 1, '#b6ff3a');
        else if (this.step === 2 && Math.sin(t * 5 + i) > 0.3)
          G.glow(g, b.x, b.y, 18, 14, '#ffd47a', 0.35);
      }
      // The torque gauge, on the pegboard. It used to sit at 26,108 --
      // which is the bench, which is where YOU are: a 78-unit bar right
      // across your face, the socket, the bolts you were driving and the
      // three port labels. A gauge you have to look through the readout
      // to read. It lives on the empty board above the loom now, in the
      // one big clear rectangle in the room.
      if (this.bolt >= 0) {
        const b = this.bolts[this.bolt];
        const gx = 14, gy = 44, gw = 78;
        G.plate(g, gx, gy, gw, 12, '#232b38', { r: 1, band: 2, spec: false });
        G.R(g, gx + 2, gy + 2, gw - 4, 8, '#12161f');
        // the green runs to the end of the gauge, because the end of the
        // gauge is where it stops. There is no red any more.
        G.R(g, gx + 2 + (gw - 4) * TQ_LO, gy + 2, (gw - 4) * (1 - TQ_LO), 8, '#2a4a30');
        const f = G.clamp(b.torque, 0, 1);
        const ok = f > TQ_LO;
        G.R(g, gx + 2, gy + 2, Math.max(1, (gw - 4) * f), 8, ok ? '#b6ff3a' : '#c8a24a');
        G.Rq(g, gx + 2 + (gw - 4) * f - 0.5, gy, 1, 12, '#ffffff');
        G.text(g, ok ? 'LET GO ANY TIME' : 'HOLD IT', gx + gw / 2, gy - 8,
          ok ? '#dfffcf' : '#8a7458', { align: 'center', sc: 0.5 });
      }
    },

    // ---- the hydraulic pump ----
    drawPump(g, t) {
      const on = this.step === 3;
      const push = this.pumping ? 4 : 0;
      // the line running from the pump to the joint, laid over the bench
      for (let i = 0; i < 22; i++) {
        const q = i / 21;
        const cx = G.lerp(PUMP.x - 12, SOCK.x + 4, q);
        const cy = G.lerp(PUMP.y - 2, SOCK.y + 12, q) + Math.sin(q * Math.PI) * 9;
        G.Rh(g, cx - 1, cy - 1, 3, 3, '#2a2028');
        G.Rh(g, cx - 0.5, cy - 0.5, 2, 2, '#6b4a3a');
      }
      G.plate(g, PUMP.x - 14, PUMP.y - 8, 28, 16, '#5c6470', { r: 1, band: 2, bolts: 1 });
      G.Rh(g, PUMP.x - 2, PUMP.y - 20 + push, 4, 14, '#8a94a8');
      G.plate(g, PUMP.x - 10, PUMP.y - 26 + push, 20, 6, '#c8505c', { r: 1, band: 1, spec: false });
      // the pressure gauge
      const gx = PUMP.x + 20, gy = PUMP.y - 30;
      G.plate(g, gx, gy, 12, 34, '#232b38', { r: 1, band: 1, spec: false });
      G.R(g, gx + 2, gy + 2, 8, 30, '#12161f');
      // green from the low mark to the top, and the top is where it stops
      G.R(g, gx + 2, gy + 2, 8, 30 * (1 - PR_LO), '#2a4a30');
      const f = G.clamp(this.press, 0, 1);
      G.R(g, gx + 2, gy + 32 - 30 * f, 8, Math.max(1, 30 * f),
        f > PR_LO ? '#b6ff3a' : '#3a8ac8');
      for (let i = 0; i < 3; i++)
        G.Rq(g, gx + 2, gy + 2 + i * 10, 8, 0.5, '#4a5568');
      // how many good strokes
      for (let i = 0; i < PUMPS; i++) {
        G.R(g, PUMP.x - 12 + i * 9, PUMP.y + 10, 7, 5, i < this.pumps ? '#2a4a30' : '#232b38');
        G.bevelq(g, PUMP.x - 12 + i * 9, PUMP.y + 10, 7, 5, i < this.pumps ? '#6bbf7a' : '#3a4250', '#0e0c14');
      }
      if (on && !this.pumping && Math.sin(t * 4) > 0)
        G.glow(g, PUMP.x, PUMP.y - 14, 44, 40, '#ffd47a', 0.3);
    },

    // ---- the switch ----
    drawSwitch(g, t) {
      const on = this.power > 0;
      G.plate(g, SWITCH.x - 14, SWITCH.y - 14, 28, 26, '#3a4250', { r: 1, band: 2, bolts: 1 });
      G.R(g, SWITCH.x - 7, SWITCH.y - 10, 14, 16, '#12161f');
      G.R(g, SWITCH.x - 5, on ? SWITCH.y - 2 : SWITCH.y - 8, 10, 8, on ? '#c8383a' : '#8a94a8');
      G.hairq(g, SWITCH.x - 5, on ? SWITCH.y - 2 : SWITCH.y - 8, 10, '#e8ecf2');
      G.fc(g, SWITCH.x, SWITCH.y + 8, 2, on ? '#b6ff3a' : '#3a2a2a');
      G.text(g, on ? 'ON' : 'OFF', SWITCH.x, SWITCH.y - 22, on ? '#b6ff3a' : '#8a7458',
        { align: 'center', sc: 0.5 });
      if (this.step === 4 && Math.sin(t * 5) > 0)
        G.glow(g, SWITCH.x, SWITCH.y - 2, 46, 42, '#b6ff3a', 0.35);
    },

    // ---- what she is saying, and what you have to do ----
    drawTalk(g, t) {
      const st = this.cur();
      const bw = 214, bx = 8, by = 142;
      G.plate(g, bx, by, bw, 34, '#2e1f16',
        { r: 2, band: 2, lit: '#432d20', dk: '#170f0a', spec: false });
      G.R(g, bx + 2, by + 2, bw - 4, 1, '#c8783a');
      const nw = G.tw('TRACY', 0.5) + 8;
      G.R(g, bx + 4, by - 8, nw, 9, '#c8783a');
      G.text(g, 'TRACY', bx + 8, by - 6, '#1a1418', { sc: 0.5 });
      const shown = Math.floor(this.stepT * 34);
      const lines = G.wrap(st.say.slice(0, shown), bw - 16, 1);
      for (let i = 0; i < Math.min(3, lines.length); i++)
        G.text(g, lines[i], bx + 8, by + 6 + i * 10, '#f6e8d4');
      if (shown < st.say.length && Math.sin(t * 18) > 0)
        G.text(g, '_', bx + 8 + G.tw(lines[Math.min(2, lines.length - 1)] || '', 1) + 1,
          by + 6 + Math.min(2, Math.max(0, lines.length - 1)) * 10, '#f6e8d4');
      // the job
      if (st.hint) {
        const fl = Math.sin(t * 4) > 0;
        const hl = G.wrap(st.hint, 76, 0.5);
        G.plate(g, 228, 142, 86, 34, '#1a2418', { r: 2, band: 2, spec: false });
        G.R(g, 230, 144, 82, 1, P.lime);
        G.text(g, 'DO THIS', 232, 146, '#6b8a4a', { sc: 0.5 });
        for (let i = 0; i < hl.length; i++)
          G.text(g, hl[i], 232, 155 + i * 7, fl ? '#dfffcf' : '#8ab06a', { sc: 0.5 });
      } else if (this.stepT > 0.8) {
        G.text(g, 'TAP TO GO ON', 270, 158, Math.sin(t * 4) > 0 ? '#c8a884' : '#6b5240',
          { align: 'center', sc: 0.5 });
      }
      // whatever just went wrong
      if (this.msg && this.msgT < 2.2) {
        const a = Math.min(1, this.msgT * 4) * Math.min(1, (2.2 - this.msgT) * 2);
        g.globalAlpha = a;
        G.text(g, this.msg, 160, 130, '#ffd47a', { align: 'center', out: OUT });
        g.globalAlpha = 1;
      }
      // the run of the job
      for (let i = 0; i < STEPS.length; i++)
        G.Rh(g, 110 + i * 6, 136, 4, 3, i < this.step ? '#c8783a' : i === this.step ? '#ffd47a' : '#3a2a22');
    },
  };
})();

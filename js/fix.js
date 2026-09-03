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
//   PRIME  pump the hydraulics up into the band without blowing the seal
//   POWER  throw the switch
//   TOES   wiggle them, one at a time, because she wants to see it work
//
// Nothing here can be failed permanently. A stripped bolt is a bolt you
// do again. That is the whole difficulty curve.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  const BENCH_Y = 126;                 // the bench surface
  const HIP = { x: 26, y: 32, w: 78, h: 68 };
  const SOCK = { x: 104, y: 66, r: 14 };   // where the leg goes
  const RACK = { x: 226, y: 100 };         // where the leg starts
  const PORTS_X = 50;                      // the hip's port block
  const PUMP = { x: 140, y: 116 };
  const SWITCH = { x: 206, y: 112 };
  const LEG_LEN = 74;

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
    { id: 'bolts', hint: 'TAP A BOLT, HOLD TO TORQUE',
      say: "FOUR BOLTS. HOLD TILL THE NEEDLE SITS IN THE GREEN." },
    { id: 'prime', hint: 'HOLD THE PUMP, LET GO IN THE GREEN',
      say: "NOW PRIME IT. THREE GOOD STROKES, NOT FOUR." },
    { id: 'power', hint: 'THROW THE SWITCH',
      say: "GO ON THEN. WAKE IT UP." },
    { id: 'toes',  hint: 'TAP EACH TOE AS IT LIGHTS',
      say: "WIGGLE THEM FOR ME. ALL THREE. HUMOUR AN OLD WOMAN." },
    { id: 'done',  hint: null,
      say: "THERE. YOU'VE GOT A LEG. TRY NOT TO LOSE THIS ONE." },
  ];

  const fix = (G.scenes = G.scenes || {}).legfit = {
    enter() {
      this.t = 0;
      this.step = 0;
      this.stepT = 0;
      this.msg = null; this.msgT = 9;
      this.spark = [];
      this.shakeT = 0;

      // ---- the leg, on the rack ----
      this.leg = { x: RACK.x, y: RACK.y, drag: 0, seated: 0, tilt: 0.5, glow: 0 };

      // ---- the leads, and the ports they do not line up with ----
      this.leads = LEAD.map((L, i) => ({
        id: L.id, col: L.col, lit: L.lit, name: L.name,
        hx: 0, hy: 0, drag: 0, to: null, i,
      }));
      const order = [2, 0, 1];                    // the ports are shuffled
      this.ports = order.map((k, i) => ({
        id: LEAD[k].id, col: LEAD[k].col, lit: LEAD[k].lit, name: LEAD[k].name,
        x: PORTS_X, y: 48 + i * 16, taken: 0,
      }));

      // ---- four bolts round the collar ----
      this.bolts = [];
      for (let i = 0; i < 4; i++) {
        const a = Math.PI * 0.25 + i * Math.PI * 0.5;
        this.bolts.push({ a, x: SOCK.x + Math.cos(a) * 20, y: SOCK.y + Math.sin(a) * 20,
          seated: 0, torque: 0, spin: 0, strip: 0 });
      }
      this.bolt = -1;                             // the one in the driver
      this.driving = 0;

      // ---- the prime ----
      this.press = 0; this.pumps = 0; this.pumping = 0; this.blow = 0;

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

    // where the leads hang off the seated leg
    leadHome(i) { return { x: this.leg.x + 14, y: 48 + i * 16 }; },

    // ---------------- input ----------------
    onDown(x, y) {
      const st = this.cur();
      if (st.id === 'done') { if (this.stepT > 0.6) this.finish(); return; }

      if (st.id === 'seat') {
        if (G.dist(x, y, this.leg.x + 26, this.leg.y) < 34) {
          this.leg.drag = 1; G.audio.sfx('grab');
        }
        return;
      }
      if (st.id === 'lines') {
        for (const L of this.leads) {
          if (L.to) continue;
          if (G.dist(x, y, L.hx, L.hy) < 9) { L.drag = 1; G.audio.sfx('grab'); return; }
        }
        return;
      }
      if (st.id === 'bolts') {
        for (let i = 0; i < 4; i++) {
          const b = this.bolts[i];
          if (b.seated) continue;
          if (G.dist(x, y, b.x, b.y) < 10) {
            this.bolt = i; this.driving = 1; G.audio.sfx('grab');
            return;
          }
        }
        return;
      }
      if (st.id === 'prime') {
        if (G.dist(x, y, PUMP.x, PUMP.y - 8) < 24) { this.pumping = 1; G.audio.sfx('grab'); }
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
        for (let i = 0; i < 3; i++) {
          const tx = this.leg.x + LEG_LEN - 2, ty = this.leg.y - 12 + i * 12;
          if (G.dist(x, y, tx, ty) < 10) {
            if (i === this.toe) {
              this.toe++; this.toeT = 0;
              G.audio.sfx('click'); this.burst(tx, ty, 7, '#b6ff3a');
              if (this.toe >= 3) { this.advance(); G.audio.sfx('unlock'); }
            } else { G.audio.sfx('back'); this.say('NOT THAT ONE.'); }
            return;
          }
        }
        return;
      }
    },

    onMove(x, y) {
      if (this.leg.drag) { this.leg.x = x - 26; this.leg.y = y; }
      for (const L of this.leads) if (L.drag) { L.hx = x; L.hy = y; }
    },

    onUp() {
      const st = this.cur();
      if (this.leg.drag) {
        this.leg.drag = 0;
        if (G.dist(this.leg.x, this.leg.y, SOCK.x + 8, SOCK.y) < 22) {
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
        let hit = null;
        for (const pt of this.ports)
          if (!pt.taken && G.dist(L.hx, L.hy, pt.x, pt.y) < 12) hit = pt;
        if (hit && hit.id === L.id) {
          hit.taken = 1; L.to = hit;
          L.hx = hit.x; L.hy = hit.y;
          G.audio.sfx('click'); this.burst(hit.x, hit.y, 6, L.lit);
          if (this.leads.every((q) => q.to)) this.advance();
        } else {
          if (hit) { this.say(hit.name + ' IS NOT ' + L.name + '.'); G.audio.sfx('snap'); G.shake(2, 0.14); }
          const h = this.leadHome(L.i);
          L.hx = h.x; L.hy = h.y;
        }
      }
      if (this.driving) {
        // the bolt: let go inside the band or do it again
        const b = this.bolts[this.bolt];
        this.driving = 0;
        if (b && b.torque > 0.6 && b.torque < 0.9) {
          b.seated = 1; b.torque = 0.75;
          G.audio.sfx('clank'); this.burst(b.x, b.y, 6, '#b6ff3a');
          if (this.bolts.every((q) => q.seated)) this.advance();
        } else if (b) {
          b.torque = 0;
          if (b.strip) { this.say('YOU STRIPPED IT. GO AGAIN.'); G.shake(3, 0.2); }
          else this.say('NOT TIGHT ENOUGH.');
          b.strip = 0;
          G.audio.sfx('back');
        }
        this.bolt = -1;
      }
      if (this.pumping) {
        this.pumping = 0;
        if (this.press > 0.58 && this.press < 0.88) {
          this.pumps++; G.audio.sfx('click');
          this.burst(PUMP.x + 12, PUMP.y - 12, 8, '#8fd8c0');
          if (this.pumps >= 3) this.advance();
        } else {
          this.say(this.press >= 0.88 ? 'TOO HARD. LET IT BREATHE.' : 'NOT ENOUGH IN IT.');
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

      // the bolt in the driver
      if (this.driving && this.bolt >= 0) {
        const b = this.bolts[this.bolt];
        b.torque += dt * 0.52;
        b.spin += dt * (3 + b.torque * 9);
        if (b.torque > 1) { b.torque = 1; b.strip = 1; }
        if (Math.random() < dt * 20) this.burst(b.x, b.y, 1, '#8a94a8');
      }
      for (const b of this.bolts) if (!b.seated && !(this.driving && this.bolts[this.bolt] === b))
        b.torque = Math.max(0, b.torque - dt * 1.6);

      // the pump
      if (this.pumping) {
        this.press += dt * 0.72;
        if (this.press > 1) { this.press = 0; this.pumping = 0; this.blow = 1; G.audio.sfx('snap'); G.shake(4, 0.24);
          this.say('SEAL BLEW. START THAT ONE AGAIN.'); }
      } else this.press = Math.max(0, this.press - dt * 0.9);
      this.blow = Math.max(0, this.blow - dt * 2);

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

      // ===== her =====
      const wants = st.id === 'done';
      G.drawTracy(g, 288, BENCH_Y + 2, 1.0, {
        t, clip: this.stepT * 34 < st.say.length ? 'talk' : (st.id === 'bolts' || st.id === 'lines') ? 'reach' : 'idle',
        ct: t, dir: -1, smile: wants, p: 0.7,
      });

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
      this.drawHip(g, t);

      // ===== the leg =====
      this.drawLeg(g, t);

      // ===== the leads =====
      this.drawLeads(g, t);

      // ===== the bolts, and the torque gauge =====
      if (this.step >= 2) this.drawBolts(g, t);

      // ===== the pump and the switch =====
      this.drawPump(g, t);
      this.drawSwitch(g, t);

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

    // ---- the hip: your plating, and the socket she cut clean ----
    drawHip(g, t) {
      const c = '#f6f0e4', cd = '#c9bfae';
      G.R(g, HIP.x - 1, HIP.y - 1, HIP.w + 2, HIP.h + 2, OUT);
      G.R(g, HIP.x, HIP.y, HIP.w, HIP.h, c);
      G.bevel(g, HIP.x, HIP.y, HIP.w, HIP.h, '#ffffff', cd);
      G.R(g, HIP.x, HIP.y, HIP.w, 3, '#ffffff');
      G.R(g, HIP.x, HIP.y + HIP.h - 3, HIP.w, 3, G.shade(cd, -0.2));
      for (let i = 0; i < 3; i++) G.rivet(g, HIP.x + 6, HIP.y + 12 + i * 20, '#12141c', '#ffffff');
      G.text(g, 'DAIRY UNIT 4', HIP.x + HIP.w - 6, HIP.y + HIP.h - 9, '#b8ac98', { align: 'right', sc: 0.5 });
      // the port recess, sunk into the plate
      G.R(g, PORTS_X - 14, 38, 30, 60, '#2a3040');
      G.bevelq(g, PORTS_X - 14, 38, 30, 60, '#12161f', '#5c6470');
      for (const pt of this.ports) {
        G.oc(g, pt.x, pt.y, 6, '#12161f');
        G.fc(g, pt.x, pt.y, 4, pt.taken ? pt.col : G.shade(pt.col, -0.55));
        G.fc(g, pt.x, pt.y, 2, '#12161f');
        if (pt.taken) G.glow(g, pt.x, pt.y, 22, 16, pt.lit, 0.4);
        G.text(g, pt.name, pt.x + 8, pt.y - 3, pt.taken ? pt.lit : '#8fa0bc', { sc: 0.5 });
      }
      // the socket: a machined collar cut into the right face
      G.oc(g, SOCK.x, SOCK.y, SOCK.r + 2, OUT);
      G.fc(g, SOCK.x, SOCK.y, SOCK.r, '#5c6470');
      G.fc(g, SOCK.x, SOCK.y, SOCK.r - 3, '#232b38');
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
      // three toe lamps, which is what she is going to make you wiggle
      for (let i = 0; i < 3; i++) {
        const tx = x + LEG_LEN - 2, ty = y - 12 + i * 12;
        const on = this.step >= 5 && i < this.toe;
        const nxt = this.step === 5 && i === this.toe && Math.sin(t * 6) > -0.2;
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
    drawLeads(g, t) {
      if (this.step < 1) return;
      for (const L of this.leads) {
        const h = this.leadHome(L.i);
        const ex = L.drag || L.to ? L.hx : h.x, ey = L.drag || L.to ? L.hy : h.y;
        // the run, with a sag in the middle
        const n = 44;
        for (let i = 0; i <= n; i++) {
          const q = i / n;
          const cx = G.lerp(h.x, ex, q);
          const cy = G.lerp(h.y, ey, q) + Math.sin(q * Math.PI) * (3 + Math.abs(ex - h.x) * 0.06);
          G.Rh(g, cx - 1, cy - 1, 3, 3, OUT);
        }
        for (let i = 0; i <= n; i++) {
          const q = i / n;
          const cx = G.lerp(h.x, ex, q);
          const cy = G.lerp(h.y, ey, q) + Math.sin(q * Math.PI) * (3 + Math.abs(ex - h.x) * 0.06);
          G.Rh(g, cx - 0.5, cy - 0.5, 2, 2, L.col);
          G.Rq(g, cx - 0.5, cy - 0.5, 1, 1, L.lit);
        }
        // the plug on the end
        G.R(g, ex - 4, ey - 4, 9, 9, OUT);
        G.R(g, ex - 3, ey - 3, 7, 7, L.col);
        G.hairq(g, ex - 3, ey - 3, 7, L.lit);
        G.Rq(g, ex - 1, ey - 1, 2, 2, '#12161f');
        if (!L.to && !L.drag && Math.sin(t * 4 + L.i) > 0.4)
          G.glow(g, ex, ey, 20, 16, L.lit, 0.4);
        // the collar it comes out of
        G.R(g, h.x - 3, h.y - 4, 5, 8, '#4a5568');
        G.hairq(g, h.x - 3, h.y - 4, 5, '#8a94a8');
      }
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
      // the torque gauge on the bench
      if (this.bolt >= 0) {
        const b = this.bolts[this.bolt];
        const gx = 26, gy = 108, gw = 78;
        G.plate(g, gx, gy, gw, 12, '#232b38', { r: 1, band: 2, spec: false });
        G.R(g, gx + 2, gy + 2, gw - 4, 8, '#12161f');
        G.R(g, gx + 2 + (gw - 4) * 0.6, gy + 2, (gw - 4) * 0.3, 8, '#2a4a30');
        G.R(g, gx + 2 + (gw - 4) * 0.9, gy + 2, (gw - 4) * 0.1, 8, '#4a1c24');
        const f = G.clamp(b.torque, 0, 1);
        G.R(g, gx + 2, gy + 2, Math.max(1, (gw - 4) * f), 8,
          b.strip ? P.magenta : f > 0.6 && f < 0.9 ? '#b6ff3a' : '#c8a24a');
        G.Rq(g, gx + 2 + (gw - 4) * f - 0.5, gy, 1, 12, '#ffffff');
        G.text(g, b.strip ? 'STRIPPED' : f > 0.6 && f < 0.9 ? 'LET GO' : 'TORQUE',
          gx + gw / 2, gy - 8, b.strip ? P.magentaLt : f > 0.6 && f < 0.9 ? '#dfffcf' : '#8a7458',
          { align: 'center', sc: 0.5 });
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
      G.R(g, gx + 2, gy + 2 + 30 * (1 - 0.88), 8, 30 * 0.3, '#2a4a30');
      const f = G.clamp(this.press, 0, 1);
      G.R(g, gx + 2, gy + 32 - 30 * f, 8, Math.max(1, 30 * f),
        this.blow > 0 ? P.magenta : f > 0.58 && f < 0.88 ? '#b6ff3a' : '#3a8ac8');
      for (let i = 0; i < 3; i++)
        G.Rq(g, gx + 2, gy + 2 + i * 10, 8, 0.5, '#4a5568');
      // how many good strokes
      for (let i = 0; i < 3; i++) {
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

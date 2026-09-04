// ============================================================
// DOUBLE LIFE v15 - stage.js  ·  A PLACE, NOT A SHOT
//
// The prologue used to be nine shots of a camera looking at things.
// This is the replacement: a walkable side-on room with a floor line,
// a scrolling camera, people in it who are doing something, things
// you can walk up to, and beats that fire when you get there.
//
// Everything obeys ONE SCALE (see G.SZ): an adult is 52 units head to
// heel at draw scale 1.0, standing on G.FLOOR, and every prop in the
// room is sized off that. Nobody is drawn at 0.5 next to somebody at
// 1.4 any more, which is what made the old scenes look wrong.
//
// A stage is a data object. G.makeStage(def) turns it into a scene:
//   def.w            world width in units
//   def.paint(g,S)   the set, in world space, behind everybody
//   def.fore(g,S)    the set, in front of everybody
//   def.actors[]     people, each running a SCRIPT
//   def.spots[]      places you can walk up to and use
//   def.beats[]      a timeline that runs on its own
//
// An actor script is a list of intentions, and it loops:
//   { go: 210 }      walk there
//   { wait: 1.4 }    stand there
//   { say: 'OI' }    a bubble over the head
//   { clip: 'talk', d: 2 }
//   { at: 40 }       be there now (used to loop back offstage)
//   { sit: 1 } / { sit: 0 }
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  const WALK = 46;                    // units per second, an adult
  const REACH = 16;                   // how near a spot counts as "at" it

  // ------------------------------------------------------------
  // A SPEECH BUBBLE, AT FULL SIZE.
  //
  // These used to be at the fine tier - half-height glyphs on a
  // matchbox - which is a strange choice for the only thing in the
  // scene that is actually talking to you. Full-size type, a name tab
  // in the speaker's own colour, and it pops in: overshoots upward on
  // a back-out and settles, with a wobble on the tail.
  // ------------------------------------------------------------
  function bubble(g, cx, topY, text, col, who, a, pop, t) {
    const lines = G.wrap(text, 132);
    let wide = 0;
    for (const l of lines) wide = Math.max(wide, G.tw(l));
    const bw = Math.max(44, wide + 14), bh = lines.length * 10 + 11;
    // the pop: up past where it lands, then back down onto it
    const e = G.backOut(G.clamp(pop, 0, 1));
    const rise = (1 - e) * -7;
    // keep the whole card on screen; the tail still points at whoever
    // said it, so a speaker at the edge does not get a clipped bubble.
    // Bubbles are drawn INSIDE the camera transform, so the bounds have
    // to be pushed into world space or the card lands at world zero.
    const cam0 = Math.round(G.cam.x + G.cam.sx);
    const bx = Math.round(G.clamp(cx - bw / 2, cam0 + 3,
      Math.max(cam0 + 3, cam0 + G.W - bw - 3)));
    // never let it climb into the objective plate, tab and all
    let by = Math.round(Math.max(who ? 36 : 27, topY - bh - 6 + rise));
    const rect = { x: bx, y: by, w: bw, h: bh };
    g.globalAlpha = a;
    // a soft drop shadow, so it sits over the room
    g.globalAlpha = a * 0.26;
    G.rr2(g, bx + 1, by + 2, bw, bh, '#000000');
    g.globalAlpha = a;
    G.rr2(g, bx - 1, by - 1, bw + 2, bh + 2, OUT);
    G.rr2(g, bx, by, bw, bh, '#fdf7ea');
    G.Rh(g, bx + 1, by + 1, bw - 2, 0.5, '#ffffff');
    G.Rh(g, bx + 1, by + bh - 1, bw - 2, 0.5, '#d6c6ab');
    G.R(g, bx, by, bw, 2, col);                              // the speaker's stripe
    G.Rh(g, bx, by + 2, bw, 0.5, G.shade(col, -0.4));
    // the tail: a stalk that actually reaches the person talking, so a
    // bubble pushed up out of the way still points at its owner
    const tw2 = Math.sin(t * 7) * 0.5;
    const drop = G.clamp(topY - (by + bh) - 1, 3, 16);
    const steps = Math.max(5, Math.round(drop));
    for (let i = 0; i < steps; i++) {
      const p = i / (steps - 1), w2 = Math.max(1, 7 * (1 - p) * (1 - p * 0.3));
      G.Rh(g, cx - w2 / 2 - 0.5 + tw2 * p * 2, by + bh + p * drop, w2 + 1, 1.5, OUT);
    }
    for (let i = 0; i < steps; i++) {
      const p = i / (steps - 1), w2 = Math.max(1, 7 * (1 - p) * (1 - p * 0.3));
      G.Rh(g, cx - w2 / 2 + tw2 * p * 2, by + bh + p * drop - 0.5, w2, 1, '#fdf7ea');
    }
    for (let i = 0; i < lines.length; i++)
      G.text(g, lines[i], bx + 7, by + 6 + i * 10, '#2a2028');
    // the name, on a tab hanging off the top corner
    if (who) {
      const nw = G.tw(who, 0.5) + 8;
      G.R(g, bx + 3, by - 8, nw, 9, col);
      G.Rh(g, bx + 3, by - 8, nw, 0.5, G.shade(col, 0.45));
      G.Rh(g, bx + 3, by - 0.5, nw, 0.5, G.shade(col, -0.45));
      G.text(g, who, bx + 7, by - 6, '#1a1418', { sc: 0.5 });
    }
    g.globalAlpha = 1;
    return rect;
  }

  // ------------------------------------------------------------
  // THE JUICE. Rings, stars, dust and little jumps. None of it is
  // load-bearing and all of it is why the thing feels alive.
  // ------------------------------------------------------------
  function pops(g, S) {
    for (const p of S.pops) {
      const q = p.t / p.life, a = 1 - q;
      g.globalAlpha = a;
      if (p.kind === 'ring') {
        G.oc(g, p.x, p.y, 3 + G.easeOut(q) * p.r, p.col);
        if (q < 0.5) G.oc(g, p.x, p.y, 1 + G.easeOut(q) * p.r * 0.6, '#ffffff');
      } else if (p.kind === 'star') {
        const r = 1.5 + (1 - q) * 1.5;
        G.Rh(g, p.x - r, p.y - 0.25, r * 2, 0.5, p.col);
        G.Rh(g, p.x - 0.25, p.y - r, 0.5, r * 2, p.col);
        G.Rq(g, p.x - 0.5, p.y - 0.5, 1, 1, '#ffffff');
      } else if (p.kind === 'dust') {
        G.oc(g, p.x, p.y, 1 + q * 4, p.col);
      } else if (p.kind === 'bit') {
        const spin = Math.abs(Math.sin(p.t * 8));
        G.Rh(g, p.x, p.y, 1.5 + spin, 0.5 + spin * 0.5, p.col);
      } else {
        G.Rq(g, p.x, p.y, 1, 1, p.col);
      }
      g.globalAlpha = 1;
    }
  }

  // ------------------------------------------------------------
  // one person on the floor
  // ------------------------------------------------------------
  function stepOf(a) { return a.script && a.script.length ? a.script[a.si % a.script.length] : null; }

  function actorNext(a) {
    a.si++; a.st = 0; a.started = false;
    if (a.once && a.si >= a.script.length) { a.si = a.script.length - 1; a.spent = true; }
  }

  function actorUpdate(a, dt, S) {
    a.t += dt;
    // a spring, for the little jump they do when something happens
    if (a.hop === undefined) a.hop = 0;
    a.hopV = (a.hopV || 0) - a.hop * 90 * dt - (a.hopV || 0) * 7 * dt;
    a.hop += a.hopV * dt;
    // and they look at you when you get near, because people do
    if (!a.sitting && Math.abs(S.px - a.x) < 52 && !a.walking)
      a.look = Math.sign(S.px - a.x) || 1;
    else a.look = 0;
    if (a.hold > 0) { a.hold -= dt; a.clip = a.holdClip || 'idle'; return; }
    const s = stepOf(a);
    if (!s || a.spent) { a.clip = a.rest || 'idle'; return; }
    if (!a.started) {
      a.started = true;
      if (s.say) S.say(a.id, s.say, s.d || 2.4);
      if (s.at !== undefined) { a.x = s.at; }
      if (s.sit !== undefined) { a.sitting = !!s.sit; a.dy = a.sitting ? (a.sitDy === undefined ? 8 : a.sitDy) : 0; a.behind = a.sitting ? 1 : a.behind0; }
      if (s.face) a.dir = s.face;
      if (s.do) s.do(S, a);
    }
    a.st += dt;
    if (s.go !== undefined) {
      const d = s.go - a.x;
      const sp = (s.sp || 1) * WALK;
      if (Math.abs(d) <= sp * dt) { a.x = s.go; a.clip = 'idle'; a.walking = 0; actorNext(a); }
      else {
        a.x += Math.sign(d) * sp * dt; a.dir = Math.sign(d); a.walking = 1;
        a.clip = s.sp > 1.4 ? 'run' : 'walk';
        // dust off the heel, twice a stride
        if (Math.sin(a.t * 9) > 0.94 && S.pops.length < 90)
          S.pops.push({ x: a.x - a.dir * 3, y: S.floor + (a.dy || 0) - 1, t: 0, life: 0.34,
            r: 3, col: '#b8a890', kind: 'dust' });
        return;
      }
      return;
    }
    a.clip = s.clip || (s.say ? 'talk' : 'idle');
    const dur = s.d !== undefined ? s.d : (s.wait !== undefined ? s.wait : 0.3);
    if (a.st >= dur) actorNext(a);
  }

  function actorDraw(g, a, S) {
    const fy = S.floor + (a.dy || 0) - Math.max(0, a.hop || 0);
    const o = {
      t: a.t, clip: a.clip, ct: a.t, dir: a.look || a.dir, seed: a.seed,
      look: a.look,
      smile: a.smile, hat: a.hat, badge: a.badge, dead: a.dead,
      p: a.p === undefined ? 0.8 : a.p, speed: a.sp || 1,
    };
    if (a.sitting) { o.clip = 'idle'; o.noQuirk = 1; }
    const sc = a.scale === undefined ? 1 : a.scale;
    let r;
    if (a.kind === 'tracy') r = G.drawTracy(g, a.x, fy, sc, o);
    else if (a.kind === 'bot') {
      o.mood = a.mood || 'idle'; o.walk = a.clip === 'walk' ? a.t : 0;
      o.open = a.open || 0; o.legOff = a.legOff; o.crawl = a.crawl;
      o.hands = a.hands;
      r = G.drawBot(g, a.bot || 'player', a.x, fy, sc, o);
      r = { headTop: r ? r.y : fy - G.SZ.MASCOT, cx: a.x };
    } else r = G.drawFolk(g, a.x, fy, sc, o);
    a.headTop = r && r.headTop !== undefined ? r.headTop : fy - G.SZ.ADULT;
    return r;
  }

  // ------------------------------------------------------------
  // THE STAGE
  // ------------------------------------------------------------
  G.makeStage = function (def) {
    const S = {
      def, t: 0, floor: def.floor === undefined ? G.FLOOR : def.floor,
      w: def.w || 320,
      px: def.start === undefined ? 60 : def.start,
      pdir: 1, pclip: 'idle', pwalk: 0,
      goal: null, pending: null, lock: 0,
      actors: [], bubbles: [], done: {},
      obj: def.obj || null, objDone: 0, objT: 0,
      q: null, qi: 0, qt: 0, qfired: false,
      flags: {}, over: 0,
      pops: [], sq: 0, sqV: 0, chat: 2.5, land: 0,
      pspeedMul: 1, pdy: 0, camAt: null, hush: 0,
    };
    S.pop = (x, y, kind, col, r, life) => {
      if (S.pops.length > 120) return;
      S.pops.push({ x, y, kind: kind || 'star', col: col || '#ffd45a',
        r: r === undefined ? 12 : r, t: 0, life: life === undefined ? 0.5 : life });
    };
    // a burst you can feel: a ring, a spray of stars and a shake
    S.bang = (x, y, col, n, shake) => {
      S.pop(x, y, 'ring', col || '#ffd45a', 14, 0.42);
      for (let i = 0; i < (n || 8); i++) {
        const a2 = Math.random() * 6.28, sp = G.rand(4, 16);
        S.pop(x + Math.cos(a2) * sp, y + Math.sin(a2) * sp * 0.7, 'star',
          col || '#ffd45a', 0, G.rand(0.3, 0.62));
      }
      if (shake !== 0) G.shake(shake || 2.2, 0.2);
    };
    S.jump = (id, force) => { const a = S.actor(id); if (a) a.hopV = -(force || 34); };
    S.cheer = (ids, force) => { for (const id of ids) S.jump(id, force); };

    S.actor = (id) => S.actors.find((a) => a.id === id);
    S.setObj = (txt) => { S.obj = txt; S.objT = 0; };
    S.say = (id, text, secs) => {
      const life = secs || Math.max(1.6, 1.1 + String(text).length * 0.055);
      // one line at a time. Two bubbles on a 320x180 screen means one
      // of them is under the objective plate and neither is readable.
      S.bubbles.length = 0;
      S.bubbles.push({ id, text, t: 0, life });
      if (id !== 'you') G.audio.sfx('order');
    };
    S.mine = (text, secs) => S.say('you', text, secs);
    // a beat list: [{ d, go(S) }]
    S.play = (steps) => { S.q = steps.slice(); S.qi = 0; S.qt = 0; S.qfired = false; };
    S.spot = (id) => (def.spots || []).find((k) => k.id === id);
    S.walkTo = (x) => { S.goal = x; S.pending = null; };
    S.finish = (fn) => { if (S.over) return; S.over = 1; fn(); };

    const scene = {
      enter() {
        S.t = 0; S.actors = []; S.bubbles = []; S.done = {}; S.flags = {};
        S.px = def.start === undefined ? 60 : def.start;
        S.goal = null; S.pending = null; S.lock = 0; S.q = null; S.over = 0;
        S.objDone = 0; S.obj = def.obj || null; S.objT = 0;
        S.pspeedMul = 1; S.pdy = 0; S.camAt = null; S.hush = 0;
        S.pcrawl = 0; S.phands = null;
        S.plegOff = 0; S.pmood = null; S.pnoBlink = 0; S.pp = 0.8; S.popen = 0;
        for (const a of def.actors || []) {
          S.actors.push(Object.assign({
            t: G.rand(0, 4), si: 0, st: 0, started: false, dir: 1,
            clip: 'idle', hold: 0, x: a.at !== undefined ? a.at : 0,
            seed: a.seed === undefined ? 3.3 : a.seed, kind: a.kind || 'folk',
          }, a, { behind0: a.behind || 0 }));
        }
        G.cam.reset(0, Math.max(0, S.w - G.W), 0, 0);
        G.cam.goto(G.clamp(S.px - G.W / 2, 0, Math.max(0, S.w - G.W)), 0, true);
        G.steam.length = 0;
        if (def.enter) def.enter(S);
      },

      onDown(x, y) {
        if (S.lock) { if (def.onTapLocked) def.onTapLocked(S); return; }
        const wx = x + Math.round(G.cam.x);
        if (def.onTap && def.onTap(S, wx, y)) return;
        // a spot you can use, if you tapped near it
        let best = null, bd = 1e9;
        for (const k of def.spots || []) {
          if (k.once && S.done[k.id]) continue;
          if (k.hidden && k.hidden(S)) continue;
          const d = Math.abs(wx - k.x);
          if (d < 26 && d < bd && Math.abs(y - (S.floor - 24)) < 70) { bd = d; best = k; }
        }
        if (best) { S.goal = best.x + (best.off || 0); S.pending = best; G.audio.sfx('click'); return; }
        S.goal = G.clamp(wx, def.minX === undefined ? 8 : def.minX,
          def.maxX === undefined ? S.w - 8 : def.maxX);
        S.pending = null;
      },
      onMove() {},
      onUp() {},

      update(dt) {
        dt = Math.min(dt, 1 / 30);
        S.t += dt; S.objT += dt;
        if (S.land > 0) S.land -= dt;
        G.updateSteam(dt);

        // ---- the timeline, if a beat is running ----
        if (S.q) {
          const s = S.q[S.qi];
          if (!s) { S.q = null; }
          else {
            if (!S.qfired) { S.qfired = true; if (s.go) s.go(S); }
            if (s.tick) s.tick(S, S.qt / Math.max(0.01, s.d || 1));
            S.qt += dt;
            if (S.qt >= (s.d === undefined ? 0.1 : s.d)) { S.qi++; S.qt = 0; S.qfired = false; }
          }
        }

        // ---- the springs. Squash when you stop, stretch when you go. ----
        S.sqV -= S.sq * 260 * dt; S.sqV -= S.sqV * 9 * dt; S.sq += S.sqV * dt;
        for (let i = S.pops.length - 1; i >= 0; i--) {
          const p = S.pops[i]; p.t += dt;
          if (p.kind === 'star') { p.y -= dt * 12; }
          if (p.kind === 'dust') { p.y -= dt * 5; }
          if (p.kind === 'bit') { p.y += dt * 44; p.x += Math.sin(p.t * 7 + p.y) * dt * 26; }
          if (p.t > p.life) S.pops.splice(i, 1);
        }

        // ---- you ----
        const speed = (def.pspeed || 1) * (S.pspeedMul || 1) * WALK;
        if (!S.lock && S.goal !== null) {
          const d = S.goal - S.px;
          if (Math.abs(d) <= speed * dt) {
            S.px = S.goal; S.goal = null; S.pclip = 'idle';
            // land: squash, a puff of dust, a small thump
            S.sqV = 44; S.land = 0.2;
            for (let i = 0; i < 5; i++)
              S.pop(S.px + G.rand(-7, 7), S.floor - 1, 'dust', '#b8a890', 3, G.rand(0.2, 0.4));
            if (S.pending) {
              const k = S.pending; S.pending = null;
              if (!(k.once && S.done[k.id])) {
                S.done[k.id] = 1;
                if (k.on) k.on(S);
              }
            }
          } else {
            if (S.pclip !== 'walk') S.sqV = -30;             // stretch off the mark
            S.px += Math.sign(d) * speed * dt;
            S.pdir = Math.sign(d);
            S.pclip = 'walk'; S.pwalk += dt;
            // a real bouncy walk, and dust where the foot lands
            if (Math.sin(S.pwalk * 9) > 0.95)
              for (let i = 0; i < 2; i++)
                S.pop(S.px - S.pdir * 4 + G.rand(-2, 2), S.floor - 1, 'dust', '#b8a890', 3, 0.3);
          }
        } else if (!S.lock) S.pclip = def.pidle || 'idle';

        for (const a of S.actors) actorUpdate(a, dt, S);
        // ---- AMBIENT CHATTER. Walk past somebody with something to
        // say and they say it. This is most of what makes a room feel
        // like it has people in it rather than props. ----
        S.chat -= dt;
        if (S.chat <= 0 && !S.lock && !S.hush && !S.bubbles.length) {
          const near = S.actors.filter((a) => a.lines && a.lines.length &&
            Math.abs(a.x - S.px) < 46 && (a.said || 0) <= 0 && (!a.hide || !a.hide(S)));
          if (near.length) {
            const a = near[Math.floor(Math.random() * near.length)];
            a.li = ((a.li || 0) + 1) % a.lines.length;
            S.say(a.id, a.lines[a.li], 2.6);
            a.hopV = -22;
            a.said = G.rand(9, 16);
            S.chat = G.rand(2.6, 5);
          } else S.chat = 1.1;
        }
        for (const a of S.actors) if (a.said > 0) a.said -= dt;
        for (let i = S.bubbles.length - 1; i >= 0; i--) {
          S.bubbles[i].t += dt;
          if (S.bubbles[i].t > S.bubbles[i].life) S.bubbles.splice(i, 1);
        }

        // ---- camera keeps you a bit ahead of centre, unless a beat
        // has told it to look somewhere else ----
        const cAt = S.camAt === null || S.camAt === undefined
          ? S.px + S.pdir * 26 : S.camAt;
        G.cam.goto(G.clamp(cAt - G.W / 2, 0, Math.max(0, S.w - G.W)), 0);

        if (def.update) def.update(S, dt);
      },

      draw(g) {
        const t = S.t;
        G.toastY = -40;
        if (def.sky) def.sky(g, S);
        G.cam.push(g);
        if (def.paint) def.paint(g, S);
        // TWO DEPTHS. Anyone behind the counter or sat in a booth is
        // drawn first and then the counter front and the booth backs go
        // over the top of them, which is what makes them look sat down
        // rather than sunk into the floor.
        const cast = S.actors.slice().sort((a, b) => (a.dy || 0) - (b.dy || 0));
        for (const a of cast) if (a.behind && (!a.hide || !a.hide(S))) actorDraw(g, a, S);
        if (def.mid) def.mid(g, S);
        for (const a of cast) if (!a.behind && (!a.hide || !a.hide(S))) actorDraw(g, a, S);
        // you: a hop on every other step, a dip on landing, and a
        // squash-and-stretch spring over the top of both
        const hopA = def.hopAmp === undefined ? 2.4 : def.hopAmp;
        const bob = S.pclip === 'walk' ? -Math.abs(Math.sin(S.pwalk * 9)) * hopA : 0;
        const dip = S.land > 0 ? (S.land / 0.2) * 1.2 : 0;
        const pr = G.drawBot(g, 'player', S.px,
          S.floor + (S.pdy || def.pdy || 0) + bob + dip,
          def.pscale === undefined ? 1 : def.pscale, {
            t, walk: S.pclip === 'walk' ? S.pwalk : 0, clip: S.pclip, ct: t,
            dir: S.pdir, mood: S.pmood || 'idle', open: S.popen || 0,
            legOff: S.plegOff, crawl: S.pcrawl, hands: S.phands, p: S.pp,
            noBlink: S.pnoBlink, sq: G.clamp(S.sq * 0.045, -0.12, 0.15),
          });
        S.pheadTop = pr ? pr.y : S.floor - G.SZ.MASCOT;
        if (S.pcrawl) S.pheadTop = S.floor - 26;
        if (def.fore) def.fore(g, S);
        pops(g, S);
        // the marks over things you can still use
        for (const k of def.spots || []) {
          if (k.once && S.done[k.id]) continue;
          if (k.hidden && k.hidden(S)) continue;
          const near = Math.abs(S.px - k.x) < 54;
          const bnc = Math.abs(Math.sin(t * 2.6 + k.x));
          const kb = -bnc * (near ? 5 : 3);
          const ky = (k.markY === undefined ? S.floor - 40 : k.markY) + kb + 3;
          G.glow(g, k.x, ky + 4, 22 + bnc * 8, 22, '#b6ff3a', near ? 0.44 : 0.24);
          // a pulse ring on the ground under it
          const pr2 = ((t * 0.9) % 1);
          g.globalAlpha = (1 - pr2) * (near ? 0.5 : 0.28);
          G.oc(g, k.x, S.floor - 2, 3 + pr2 * 12, '#b6ff3a');
          g.globalAlpha = 1;
          // a chevron pointing down at the thing
          for (let i = 0; i < 4; i++) {
            G.Rh(g, k.x - 4 + i - 0.5, ky + i - 0.5, 10 - i * 2, 2, OUT);
            G.Rh(g, k.x - 4 + i, ky + i, 9 - i * 2, 1, i < 1 ? '#dfffcf' : '#8ede3a');
          }
          if (near && k.label) {
            const lw = G.tw(k.label, 0.5) + 8;
            G.R(g, k.x - lw / 2, ky - 11, lw, 9, '#16200f');
            G.bevelq(g, k.x - lw / 2, ky - 11, lw, 9, '#33501f', '#080c05');
            G.text(g, k.label, k.x, ky - 9, '#dfffcf', { align: 'center', sc: 0.5 });
          }
        }
        // bubbles
        for (const b of S.bubbles) {
          const a = Math.min(1, b.t * 7) * Math.min(1, (b.life - b.t) * 5);
          let cx, top, col = '#c8783a', who = null;
          if (b.id === 'you') { cx = S.px; top = S.pheadTop; col = '#ff9ab8'; who = 'BESSIE'; }
          else {
            const ac = S.actor(b.id);
            if (!ac) continue;
            cx = ac.x; top = ac.headTop === undefined ? S.floor - G.SZ.ADULT : ac.headTop;
            col = ac.col || '#c8783a'; who = ac.name || null;
          }
          bubble(g, cx, top, b.text, col, who, a, b.t * 4.5, t);
        }
        G.cam.pop(g);
        // ---- chrome ----
        if (def.hud) def.hud(g, S);
        else G.stageHud(g, S);
        if (def.after) def.after(g, S);
        G.grade(g, def.grade === undefined ? 1 : def.grade);
      },
    };
    scene.S = S;
    return scene;
  };

  // ------------------------------------------------------------
  // the default chrome: what you are meant to be doing, and a nudge
  // that you can walk
  // ------------------------------------------------------------
  G.stageHud = function (g, S) {
    if (S.obj) {
      const w = Math.max(110, G.tw(S.obj) + 24);
      // it drops in and overshoots, and flashes for a moment after
      const e = G.backOut(G.clamp(S.objT * 3.4, 0, 1));
      const y = -20 + e * 26;
      const fl = S.objT < 0.9 && Math.sin(S.objT * 30) > 0;
      G.plate(g, G.W / 2 - w / 2, y, w, 18, fl ? '#2e4a1e' : '#1a2418',
        { r: 2, band: 2, spec: false });
      G.R(g, G.W / 2 - w / 2 + 2, y + 2, w - 4, 1, P.lime);
      G.text(g, S.obj, G.W / 2, y + 6, S.objDone ? '#6b8a4a' : fl ? '#ffffff' : '#dfffcf',
        { align: 'center' });
    }
    if (S.t < 7 && !S.lock) {
      const fl = Math.sin(S.t * 4) > 0;
      G.text(g, 'TAP WHERE YOU WANT TO WALK', G.W / 2, G.H - 7,
        fl ? '#e8dcc8' : '#8a7c68', { align: 'center', sc: 0.5, out: OUT });
    }
  };

  // a small helper the acts use: is she standing next to something
  G.nearSpot = (S, id) => {
    const k = S.spot(id);
    return k && Math.abs(S.px - k.x) < REACH * 2;
  };
})();

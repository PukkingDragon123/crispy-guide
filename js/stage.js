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
  // a speech bubble that sits over a head and wraps
  // ------------------------------------------------------------
  function bubble(g, cx, topY, text, col, a) {
    const words = String(text).split(' ');
    const lines = []; let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (G.tw(test, 0.5) > 84 && cur) { lines.push(cur); cur = w; } else cur = test;
    }
    if (cur) lines.push(cur);
    let wide = 0;
    for (const l of lines) wide = Math.max(wide, G.tw(l, 0.5));
    const bw = wide + 10, bh = lines.length * 7 + 7;
    const bx = Math.round(cx - bw / 2), by = Math.round(topY - bh - 5);
    g.globalAlpha = a;
    G.rr2(g, bx - 1, by - 1, bw + 2, bh + 2, OUT);
    G.rr2(g, bx, by, bw, bh, '#fbf4e6');
    G.Rh(g, bx + 1, by + bh - 1, bw - 2, 0.5, '#d8c8ae');
    // the tail, pointing down at whoever is talking
    for (let i = 0; i < 4; i++)
      G.Rh(g, cx - 2.5 + i * 0.5, by + bh + i * 0.75, 5 - i * 1.2, 1, i === 3 ? OUT : '#fbf4e6');
    G.Rh(g, bx, by, bw, 1, col);
    for (let i = 0; i < lines.length; i++)
      G.text(g, lines[i], bx + 5, by + 4 + i * 7, '#2a2028', { sc: 0.5 });
    g.globalAlpha = 1;
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
      if (Math.abs(d) <= sp * dt) { a.x = s.go; a.clip = 'idle'; actorNext(a); }
      else { a.x += Math.sign(d) * sp * dt; a.dir = Math.sign(d); a.clip = s.sp > 1.4 ? 'run' : 'walk'; }
      return;
    }
    a.clip = s.clip || (s.say ? 'talk' : 'idle');
    const dur = s.d !== undefined ? s.d : (s.wait !== undefined ? s.wait : 0.3);
    if (a.st >= dur) actorNext(a);
  }

  function actorDraw(g, a, S) {
    const fy = S.floor + (a.dy || 0) - (a.sitting ? -0 : 0);
    const o = {
      t: a.t, clip: a.clip, ct: a.t, dir: a.dir, seed: a.seed,
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
      obj: def.obj || null, objDone: 0,
      q: null, qi: 0, qt: 0, qfired: false,
      flags: {}, over: 0,
    };

    S.actor = (id) => S.actors.find((a) => a.id === id);
    S.say = (id, text, secs) => {
      const life = secs || Math.max(1.6, 1.1 + String(text).length * 0.055);
      S.bubbles = S.bubbles.filter((b) => b.id !== id);
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
        S.objDone = 0; S.obj = def.obj || null;
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
        S.t += dt;
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

        // ---- you ----
        const speed = (def.pspeed || 1) * WALK;
        if (!S.lock && S.goal !== null) {
          const d = S.goal - S.px;
          if (Math.abs(d) <= speed * dt) {
            S.px = S.goal; S.goal = null; S.pclip = 'idle';
            if (S.pending) {
              const k = S.pending; S.pending = null;
              if (!(k.once && S.done[k.id])) {
                S.done[k.id] = 1;
                if (k.on) k.on(S);
              }
            }
          } else {
            S.px += Math.sign(d) * speed * dt;
            S.pdir = Math.sign(d);
            S.pclip = 'walk'; S.pwalk += dt;
          }
        } else if (!S.lock) S.pclip = def.pidle || 'idle';

        for (const a of S.actors) actorUpdate(a, dt, S);
        for (let i = S.bubbles.length - 1; i >= 0; i--) {
          S.bubbles[i].t += dt;
          if (S.bubbles[i].t > S.bubbles[i].life) S.bubbles.splice(i, 1);
        }

        // ---- camera keeps you a bit ahead of centre ----
        G.cam.goto(G.clamp(S.px - G.W / 2 + S.pdir * 26, 0, Math.max(0, S.w - G.W)), 0);

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
        // you
        const pr = G.drawBot(g, 'player', S.px, S.floor + (S.pdy || def.pdy || 0),
          def.pscale === undefined ? 1 : def.pscale, {
            t, walk: S.pclip === 'walk' ? S.pwalk : 0, clip: S.pclip, ct: t,
            dir: S.pdir, mood: S.pmood || 'idle', open: S.popen || 0,
            legOff: S.plegOff, crawl: S.pcrawl, hands: S.phands, p: S.pp,
            noBlink: S.pnoBlink,
          });
        S.pheadTop = pr ? pr.y : S.floor - G.SZ.MASCOT;
        if (S.pcrawl) S.pheadTop = S.floor - 26;
        if (def.fore) def.fore(g, S);
        // the marks over things you can still use
        for (const k of def.spots || []) {
          if (k.once && S.done[k.id]) continue;
          if (k.hidden && k.hidden(S)) continue;
          const near = Math.abs(S.px - k.x) < 54;
          const bob = Math.sin(t * 3 + k.x) * 1.6;
          const ky = (k.markY === undefined ? S.floor - 40 : k.markY) + bob;
          G.glow(g, k.x, ky + 4, 22, 22, '#b6ff3a', near ? 0.4 : 0.24);
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
          const a = Math.min(1, b.t * 6) * Math.min(1, (b.life - b.t) * 4);
          let cx, top, col = '#c8783a';
          if (b.id === 'you') { cx = S.px; top = S.pheadTop; col = '#ff9ab8'; }
          else {
            const ac = S.actor(b.id);
            if (!ac) continue;
            cx = ac.x; top = ac.headTop === undefined ? S.floor - G.SZ.ADULT : ac.headTop;
            col = ac.col || '#c8783a';
          }
          bubble(g, cx, top, b.text, col, a);
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
      const w = Math.max(96, G.tw(S.obj, 0.5) + 20);
      G.plate(g, G.W / 2 - w / 2, 6, w, 16, '#1a2418', { r: 2, band: 2, spec: false });
      G.R(g, G.W / 2 - w / 2 + 2, 8, w - 4, 1, P.lime);
      G.text(g, S.obj, G.W / 2, 13, S.objDone ? '#6b8a4a' : '#dfffcf',
        { align: 'center', sc: 0.5 });
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

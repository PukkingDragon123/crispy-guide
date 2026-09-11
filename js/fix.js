// ============================================================
// DOUBLE LIFE v23 - fix.js  ·  CLAUSE TEACHES YOU A CIRCUIT
//
// She dragged you a mile and a half through the rain and got you onto
// her bench. Six rounds went into you. Your legs are still attached;
// what is not working is the board behind your chest panel.
//
// WHAT THIS USED TO BE
//
// A leg-fitting minigame. Six stages, six verbs -- seat, lines, bolts,
// prime, power, toes -- every one of them invented for this scene and
// never seen again. Twenty minutes of tutorial that taught you nothing
// about the game you were about to play, because the game you were
// about to play is a repair bench with five gestures on it.
//
// WHAT IT IS NOW
//
// The repair bench. Not a version of it, not a simplified one for
// beginners: this scene IS G.scenes.night, delegated to through the
// prototype chain, running on the same neural system, the same three
// tools, the same five gestures, the same progress bar and the same
// target rings. Every method below either sets the scene up or gets out
// of the way. If the workshop changes, this changes with it, because
// there is only one of it.
//
// The only differences are the ones the fiction needs:
//   · the machine on the bench is YOU
//   · you are in her front room, not a lock-up under the arches
//   · clause names the fault, because you cannot read the manual yet
//   · nobody is paying you
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;
  const OUT = P.ink;

  // what is wrong with you, in the order she gets to it. These are real
  // faults out of the neural system's own table -- the same three you
  // will be billing machines for by the end of the week.
  // one line each, and each one short enough to stay ONE line in the
  // strip. A two-line bubble grows upward into the sign band and hides
  // the very hint it is telling you to read.
  const BOARD = [
    { fault: 'dead',  say: 'THE DARK ONE IS DEAD. TAKE THE PATCH AND HOLD IT ON.' },
    { fault: 'cross', say: 'THOSE TWO ARE CROSSED. PROBE BOTH ENDS, THEN PATCH.' },
    { fault: 'loop',  say: 'THE CORE IS CHASING ITS TAIL. HOLD THE RESET ON IT.' },
  ];

  // ---- the scene. Everything it does not define, the workshop does. ----
  const tut = Object.create(null);

  tut.tut = 1;                       // the flag the shared code reads
  tut.outScene = 'tracy';
  tut.outLabel = "TRACY'S";

  // one machine on the bench, and it is you
  tut.jobs = function () {
    return [{
      id: 'player', name: 'YOU', sys: 'neural', volt: 0,
      faults: BOARD.map((b) => b.fault),
    }];
  };

  tut.onEnter = function () {
    this.beat = -1;
    this.motes = [];
    for (let i = 0; i < 12; i++)
      this.motes.push({ x: G.rand(10, 310), y: G.rand(20, 150) });
    // every fault is already named: clause reads the board for you, which
    // is the whole reason it is in your head by the end of the night
    for (const f of this.faults) f.named = true;
    if (G.clause) G.clause.enter('legfit');
    this.step();
  };

  // clause says the next line when the next fault comes up
  tut.step = function () {
    const i = this.faults.findIndex((f) => !f.done);
    if (i === this.beat) return;
    this.beat = i;
    const b = BOARD[i];
    if (!b) {
      if (G.clause) G.clause.say('THAT IS THE BOARD. YOU ARE A MECHANIC NOW.', P.lime, 4);
      return;
    }
    // clause says it, and only clause. The workshop already prints the
    // tool hint on its own sign line, so adding this.say(tip) on top put
    // three layers of instruction across the bottom of the frame at once.
    if (G.clause) G.clause.say(b.say, P.cyanLt, 5);
  };

  tut.update = function (dt) {
    G.scenes.night.update.call(this, dt);
    if (G.clause) G.clause.update(dt);
    if (this.faults) this.step();
  };

  tut.draw = function (g) {
    G.scenes.night.draw.call(this, g);
    // clause, on her cracked tablet at the end of the bench, doing the
    // job Tracy used to do -- because clause is the one that will still
    // be there tomorrow night, and the night after that
    // it perches in the margin beside the board, and its strip sits in
    // the band between the sign and the tray: barY 160 put the bubble
    // bottom at 173, straight over the tools you are being told to pick up.
    if (G.clause) {
      G.clause.at(305, 46, 137, 4, 316);
      G.clause.draw(g);
    }

  };

  tut.enter = function () {
    // the workshop's own enter, with our hooks on the way through
    G.scenes.night.enter.call(this);
    G.hideCursor = false;
  };

  // the layout, so a harness drives the real thing
  tut.geom = function () { return { bay: G.scenes.night.BAY }; };

  // ---- wire it up once the workshop exists ----
  // fix.js loads before night.js, so the prototype is attached lazily on
  // the first enter rather than at definition time.
  const scene = (G.scenes = G.scenes || {}).legfit = {
    enter() {
      if (!this.__wired) {
        Object.setPrototypeOf(tut, G.scenes.night);
        Object.setPrototypeOf(this, tut);
        this.__wired = 1;
      }
      tut.enter.call(this);
    },
  };
  scene.__wired = 0;
})();

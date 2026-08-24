// ============================================================
// DOUBLE LIFE v4 - state.js
// Data: robot cast + quirks, ordinary ice cream flavours,
// ice-cream-inflicted robot faults -> diagnoses -> repairs,
// stockroom, save/load.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;

  G.DATA = {
    // ---------- flavours: ordinary ice cream, cyberpunk lighting ----------
    flavors: [
      { id: 'vanilla',   name: 'VANILLA',    col: '#f6ecc8', price: 0,   sugar: 2 },
      { id: 'choc',      name: 'CHOCOLATE',  col: '#7a4a28', price: 0,   sugar: 3 },
      { id: 'strawberry',name: 'STRAWBERRY', col: '#ff5d84', price: 0,   sugar: 3 },
      { id: 'mint',      name: 'MINT CHIP',  col: '#5fe0ba', price: 40,  sugar: 2, fleck: '#2a2233' },
      { id: 'coffee',    name: 'COFFEE',     col: '#a8703c', price: 70,  sugar: 3 },
      { id: 'cookies',   name: 'COOKIES',    col: '#e8dcc0', price: 105, sugar: 4, fleck: '#3a2a20' },
      { id: 'banana',    name: 'BANANA',     col: '#ffd94a', price: 150, sugar: 4 },
      { id: 'blueberry', name: 'BLUEBERRY',  col: '#5b7cff', price: 200, sugar: 4 },
      { id: 'pistachio', name: 'PISTACHIO',  col: '#a8d158', price: 270, sugar: 3, fleck: '#4a6b20' },
      { id: 'caramel',   name: 'CARAMEL',    col: '#e09a3a', price: 350, sugar: 5 },
    ],
    sauces: [
      { id: 'fudge',   name: 'HOT FUDGE',    col: '#3a1f14', price: 0,   sugar: 3 },
      { id: 'berry',   name: 'BERRY SAUCE',  col: '#c8265c', price: 55,  sugar: 3 },
      { id: 'butter',  name: 'BUTTERSCOTCH', col: '#e0912a', price: 120, sugar: 4 },
      { id: 'toffee',  name: 'SALT TOFFEE',  col: '#a86a2a', price: 190, sugar: 4 },
    ],
    tops: [
      { id: 'sprinkles', name: 'SPRINKLES',  col: '#ff2f8e', multi: true, price: 0,   sugar: 2, hard: 0 },
      { id: 'nuts',      name: 'NUTS',       col: '#c9a06a', price: 60,  sugar: 1, hard: 2 },
      { id: 'chips',     name: 'CHOC CHIPS', col: '#3a2418', price: 95,  sugar: 2, hard: 2 },
      { id: 'gummy',     name: 'GUMMY BEARS',col: '#6ee06e', multi: true, price: 145, sugar: 4, hard: 1 },
      { id: 'brittle',   name: 'PEANUT BRITTLE', col: '#d8a03a', price: 210, sugar: 2, hard: 3 },
      { id: 'wafer',     name: 'WAFER SHARDS',   col: '#e8d8b0', price: 290, sugar: 3, hard: 2 },
    ],
    upgrades: [
      { id: 'coldarm',  name: 'CHILL COIL',   desc: 'TUBS STAY SOFT LONGER',   price: 90 },
      { id: 'steady',   name: 'SERVO GRIP',   desc: 'SCOOPS FILL FASTER',      price: 160 },
      { id: 'loupe',    name: 'ORDER BUFFER', desc: 'ORDER STAYS UP LONGER',   price: 240 },
      { id: 'sedative', name: 'SURGE DAMPER', desc: 'ROBOTS SPARK LESS',       price: 330 },
      { id: 'carbide',  name: 'PLASMA BIT',   desc: 'CUTS TWICE AS FAST',      price: 420 },
    ],

    // ---------- the cast: twelve machines ----------
    robots: [
      { id: 'dozer',    name: 'DOZER',    cls: 'HAULER',  names: ['DOZ-9', 'BRICK', 'MULE', 'SHUNT'] },
      { id: 'sable',    name: 'SABLE',    cls: 'COURIER', names: ['SABLE', 'NOIR', 'WISP', 'SHADE'] },
      { id: 'chrome',   name: 'CHROME',   cls: 'GREETER', names: ['CHRM-1', 'POLISH', 'GLEAM', 'MIRROR'] },
      { id: 'minty',    name: 'MINTY',    cls: 'SWEEPER', names: ['MINTY', 'FRESH', 'SPRIG', 'TILE'] },
      { id: 'rustbolt', name: 'RUSTBOLT', cls: 'DOCKER',  names: ['RUSTY', 'BOLT', 'SEIZE', 'FLAKE'] },
      { id: 'violetta', name: 'VIOLETTA', cls: 'SINGER',  names: ['VIOLET', 'ARIA', 'LUME', 'HUSH'] },
      { id: 'pixel',    name: 'PIXEL',    cls: 'ARCADE',  names: ['PIXEL', 'BLIP', 'SCORE', 'COIN'] },
      { id: 'medibot',  name: 'MEDIBOT',  cls: 'MEDIC',   names: ['MEDI', 'SUTURE', 'SALINE', 'GAUZE'] },
      { id: 'tank',     name: 'TANK',     cls: 'GUARD',   names: ['TANK', 'RIVET', 'WALL', 'BUNKER'] },
      { id: 'neonkid',  name: 'NEONKID',  cls: 'RUNNER',  names: ['NEON', 'FLICK', 'BUZZ', 'STREAK'] },
      { id: 'cargo',    name: 'CARGO',    cls: 'LIFTER',  names: ['CARGO', 'CRATE', 'PALLET', 'LOAD'] },
      { id: 'spindle',  name: 'SPINDLE',  cls: 'CLERK',   names: ['SPINDLE', 'THIN', 'REED', 'WIRE'] },
    ],

    // ---------- quirks: the weird habit each customer might have ----------
    // Each one changes what "done right" means, and is shown as one
    // short line on the order chit before it blanks out.
    quirks: [
      { id: 'none',     label: '',                     hint: '' },
      { id: 'onhead',   label: 'SPRINKLE ME',          hint: 'SHAKE THE JAR OVER THE ROBOT, NOT THE CONE',
        icon: 'head', pay: 6 },
      { id: 'handfeed', label: 'HAND FEED ME',         hint: 'CARRY A BARE SCOOP TO ITS MOUTH',
        icon: 'hand', pay: 7 },
      { id: 'sauceme',  label: 'SAUCE ME',             hint: 'POUR THE SAUCE OVER THE ROBOT',
        icon: 'head', pay: 6 },
      { id: 'twin',     label: 'ALL ONE FLAVOUR',      hint: 'EVERY SCOOP THE SAME FLAVOUR',
        icon: 'twin', pay: 5 },
      { id: 'cuponly',  label: 'CUP ONLY',             hint: 'BUILD IT IN A CUP',
        icon: 'cup', pay: 4 },
      { id: 'nosprink', label: 'NOTHING ON TOP',       hint: 'NO SAUCE AND NOTHING ON TOP AT ALL',
        icon: 'bare', pay: 4 },
      { id: 'quick',    label: 'IN A HURRY',           hint: 'SERVE FAST FOR A BIG TIP',
        icon: 'fast', pay: 9 },
    ],

    // ---------- faults: what the ice cream does to a machine ----------
    // sign: what you SEE in the bay. dx: scanner diagnosis label.
    // steps: the ordered repair the diagnosis unlocks.
    faults: [
      { id: 'sugarcrust', sign: 'HARD SUGAR CRUST OVER THE CONTACTS',  dx: 'SUGAR CRUST',  pay: 12,
        steps: ['scrape'], mess: 1,
        book: 'Dried sugar has welded itself to the pins. Scrape it back to bare metal.' },
      { id: 'syrupshort', sign: 'SYRUP POOLED ACROSS THE BOARD',       dx: 'SYRUP SHORT',  pay: 20,
        steps: ['vac', 'solder'], mess: 3,
        book: 'Sauce got in and bridged the traces. Vacuum the pool, then re-run the joint.' },
      { id: 'sprinklejam',sign: 'SPRINKLES PACKED INTO THE GEARS',     dx: 'GRIT JAM',     pay: 14,
        steps: ['blow'], mess: 1,
        book: 'Hundreds of little sugar rods in the teeth of the gear. Blast them out.' },
      { id: 'coldseize',  sign: 'FROSTED, SEIZED SOLID',               dx: 'COLD SEIZE',   pay: 18,
        steps: ['heat', 'oil'], mess: 1,
        book: 'Chilled until the bearing locked. Warm it through, then oil it.' },
      { id: 'dairyrot',   sign: 'SOURED CREAM EATING THE TERMINAL',    dx: 'DAIRY ROT',    pay: 26,
        steps: ['vac', 'scrape', 'solder'], mess: 3,
        book: 'Milk fat turned acid and chewed the terminal. Clear it, cut it back, rebuild it.' },
      { id: 'nutcrack',   sign: 'HOUSING CRACKED BY SOMETHING HARD',   dx: 'IMPACT CRACK', pay: 22,
        steps: ['weld'], mess: 2,
        book: 'A nut or a brittle shard went through under load. Weld the shell shut.' },
      { id: 'wedged',     sign: 'SOMETHING SOLID WEDGED IN THE SLOT',  dx: 'FOREIGN BODY', pay: 13,
        steps: ['pull'], mess: 1,
        book: 'Whatever you put on top of their cone. Grip it and draw it out.' },
      { id: 'overload',   sign: 'SCORCHED, FUSE POPPED',               dx: 'SUGAR SURGE',  pay: 24,
        steps: ['swap', 'solder'], mess: 2,
        book: 'Too much sugar, too fast, and the rail let go. Drop in a new module and tie it in.' },
    ],

    // ---------- mechanic tools ----------
    tools: [
      { id: 'scan',   name: 'SCANNER', hint: 'CLICK A BAY TO SCAN IT' },
      { id: 'scrape', name: 'SCRAPER', hint: 'DRAG OVER THE CRUST AND IT FLAKES AWAY' },
      { id: 'blow',   name: 'BLOWER',  hint: 'HOLD TO BLAST THE GRIT OUT' },
      { id: 'vac',    name: 'VACUUM',  hint: 'HOLD OVER SPILLS TO CLEAR THE BAY' },
      { id: 'heat',   name: 'HEATER',  hint: 'HOLD ON THE FROST UNTIL IT THAWS' },
      { id: 'oil',    name: 'OILER',   hint: 'HOLD TO FLOOD THE BEARING' },
      { id: 'solder', name: 'SOLDER',  hint: 'HOLD TO RE-RUN THE JOINT' },
      { id: 'weld',   name: 'WELDER',  hint: 'HOLD TO CLOSE THE CRACK' },
      { id: 'pull',   name: 'PULLERS', hint: 'GRIP IT AND DRAG IT OUT' },
      { id: 'swap',   name: 'SWAPPER', hint: 'HOLD AND WAGGLE TO LIFT THE MODULE OUT' },
    ],
  };

  // ---------- lookups ----------
  G.flavorById = (id) => G.DATA.flavors.find((f) => f.id === id);
  G.sauceById = (id) => G.DATA.sauces.find((f) => f.id === id);
  G.topById = (id) => G.DATA.tops.find((f) => f.id === id);
  G.robotById = (id) => G.DATA.robots.find((a) => a.id === id) || G.DATA.robots[0];
  G.quirkById = (id) => G.DATA.quirks.find((q) => q.id === id) || G.DATA.quirks[0];
  G.faultById = (id) => G.DATA.faults.find((s) => s.id === id);
  G.toolById = (id) => G.DATA.tools.find((t) => t.id === id);
  // compatibility shim: the v3 animal renderers in sprites.js are dead code
  // now, but keep them from throwing if anything still reaches for them.
  G.animalById = () => ({ id: 'chrome', name: 'CHROME', col: '#9aa6c0', col2: '#66708a', belly: '#d2dcee', names: ['CHRM-1'] });
  G.owned = (kind, id) => G.state[kind].includes(id);
  G.hasUp = (id) => G.state.upgrades.includes(id);

  G.MULTI_COLS = {
    sprinkles: ['#ff2f8e', '#ffcf2e', '#22e0ff', '#b6ff3a', '#c49bff', '#ff8a3d'],
    gummy: ['#6ee06e', '#ff3b4e', '#ffcf2e', '#ff2f8e', '#22e0ff'],
    grit: ['#ff2f8e', '#ffcf2e', '#22e0ff', '#b6ff3a', '#c49bff', '#ff8a3d'],
  };
  G.topBitCol = function (id) {
    const t = G.topById(id);
    if (t && t.multi) return G.pick(G.MULTI_COLS[id] || [t.col]);
    return t ? t.col : '#fff';
  };

  // ---------- save ----------
  const SAVE_KEY = 'doubleLife.save.v4';

  function freshState() {
    return {
      money: 0, moneyShown: 0, day: 1,
      flavors: ['vanilla', 'choc', 'strawberry'],
      sauces: ['fudge'],
      tops: ['sprinkles'],
      upgrades: [],
      muted: false,
      tut: {},
      dxSeen: [],                     // fault ids the scanner has logged
      totJobs: 0, totFixed: 0, totBots: 0, totMess: 0, totMisdx: 0,
      newIds: [],
      today: null,
    };
  }

  G.hasSave = false;
  G.load = function () {
    G.state = freshState();
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.day) {
          for (const k in G.state) if (s[k] !== undefined) G.state[k] = s[k];
          G.state.moneyShown = G.state.money;
          G.state.today = null;
          // guard against a save written before the flavour rename
          if (!G.flavorById(G.state.flavors[0])) G.state.flavors = ['vanilla', 'choc', 'strawberry'];
          if (!G.sauceById(G.state.sauces[0])) G.state.sauces = ['fudge'];
          if (!G.topById(G.state.tops[0])) G.state.tops = ['sprinkles'];
          G.hasSave = true;
        }
      }
    } catch (e) { /* private mode - play unsaved */ }
  };
  G.save = function () {
    try {
      const s = Object.assign({}, G.state);
      delete s.today;
      localStorage.setItem(SAVE_KEY, JSON.stringify(s));
      G.hasSave = true;
    } catch (e) { /* ignore */ }
  };
  G.reset = function () {
    const muted = G.state ? G.state.muted : false;
    G.state = freshState();
    G.state.muted = muted;
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  };

  G.newDayStats = function () {
    G.state.today = { dayEarn: 0, nightEarn: 0, botsServed: 0, perfect: 0, sugar: 0,
                      jobs: [], mess: 0, misdx: 0, fixed: 0 };
  };

  // ---------- tub layer generation ----------
  // A tub is a rectangle sliced into horizontal flavour layers.
  G.makePint = function (idx) {
    const own = G.state.flavors;
    const n = own.length;
    const nl = G.clamp(1 + Math.floor(n / 3) + (idx % 2), 1, 4);
    const layers = [];
    // walk the owned list with a stride that is coprime-ish to its length so
    // successive tubs get distinct strata instead of all starting on the same flavour
    const stride = 1 + (idx % Math.max(1, n - 1));
    let cur = (idx * 2 + idx * idx) % n;
    for (let i = 0; i < nl; i++) {
      layers.push(own[cur % n]);
      cur = (cur + stride) % n;
    }
    return layers;
  };
})();

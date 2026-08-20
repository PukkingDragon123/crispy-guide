// ============================================================
// DOUBLE LIFE v2 - state.js
// Data: amphibian/reptile cast, saturated flavour layers,
// dental symptoms -> diagnoses -> procedures, shop, save/load.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;

  G.DATA = {
    // ---------- flavours (saturated, sinister) ----------
    flavors: [
      { id: 'bone',    name: 'BONE VANILLA',   col: '#f2e2b8', price: 0,   sugar: 2 },
      { id: 'tar',     name: 'TAR LIQUORICE',  col: '#2a2233', price: 0,   sugar: 3, fleck: '#6a5a80' },
      { id: 'bog',     name: 'BOG MINT',       col: '#12c98a', price: 0,   sugar: 2, fleck: '#0a5c42' },
      { id: 'blood',   name: 'BLOOD ORANGE',   col: '#ff5312', price: 40,  sugar: 3 },
      { id: 'grub',    name: 'GRUB PISTACHIO', col: '#8ec72e', price: 70,  sugar: 2, fleck: '#43601a' },
      { id: 'viper',   name: 'VIPER BERRY',    col: '#e0135e', price: 105, sugar: 4 },
      { id: 'yolk',    name: 'EGG CUSTARD',    col: '#ffbe12', price: 150, sugar: 4 },
      { id: 'abyss',   name: 'ABYSS BLUE',     col: '#2b57ff', price: 200, sugar: 4, fleck: '#a9c4ff' },
      { id: 'rot',     name: 'ROT PLUM',       col: '#7c25c4', price: 270, sugar: 5 },
      { id: 'toxic',   name: 'TOXIC LIME',     col: '#b4ff1f', price: 350, sugar: 5, fleck: '#3f7a00' },
    ],
    sauces: [
      { id: 'tarsyrup', name: 'TAR SYRUP',    col: '#161122', price: 0,   sugar: 3 },
      { id: 'bloodsyr', name: 'BLOOD SYRUP',  col: '#b3122b', price: 55,  sugar: 3 },
      { id: 'venom',    name: 'VENOM DRIZZLE',col: '#79ff2e', price: 120, sugar: 4 },
      { id: 'bile',     name: 'HONEY BILE',   col: '#ffab1f', price: 190, sugar: 4 },
    ],
    tops: [
      { id: 'grit',    name: 'SUGAR GRIT',    col: '#ff2e88', multi: true, price: 0,   sugar: 2, hard: 0 },
      { id: 'shard',   name: 'BONE SHARDS',   col: '#efe6d2', price: 60,  sugar: 1, hard: 2 },
      { id: 'beetle',  name: 'BEETLE SHELLS', col: '#3f3268', price: 95,  sugar: 2, hard: 2 },
      { id: 'worm',    name: 'GUMMY WORMS',   col: '#6ee06e', multi: true, price: 145, sugar: 4, hard: 1 },
      { id: 'cricket', name: 'CRICKET CRUNCH',col: '#7a5228', price: 210, sugar: 2, hard: 2 },
      { id: 'glass',   name: 'SUGAR GLASS',   col: '#cfe8ff', price: 290, sugar: 3, hard: 3 },
    ],
    upgrades: [
      { id: 'coldarm',  name: 'COLD ARM',     desc: 'PINT STAYS SOFT LONGER', price: 90 },
      { id: 'steady',   name: 'STEADY CLAW',  desc: 'WIDER SKILL BANDS',      price: 160 },
      { id: 'loupe',    name: 'SURGEON LOUPE',desc: 'SYMPTOM HINTS IN BOOK',  price: 240 },
      { id: 'sedative', name: 'SEDATIVE GAS', desc: 'PATIENTS FLINCH LESS',   price: 330 },
      { id: 'carbide',  name: 'CARBIDE BURR', desc: 'DRILLS TWICE AS FAST',   price: 420 },
    ],

    // ---------- the cast: amphibians & reptiles, all dot eyes ----------
    animals: [
      { id: 'bullfrog', name: 'BULLFROG', kind: 'amph', col: '#4e8c2a', col2: '#2f5c17', belly: '#c9d96a',
        names: ['GURT', 'CROAK', 'BUSTER', 'WHELM'] },
      { id: 'toad',     name: 'CANE TOAD', kind: 'amph', col: '#8a6a34', col2: '#5a4420', belly: '#c7ab6e',
        names: ['LUMP', 'WART', 'DUNGO', 'MIRE'] },
      { id: 'treefrog', name: 'TREE FROG', kind: 'amph', col: '#25d17a', col2: '#128a52', belly: '#e8ffb0',
        names: ['PIP', 'STICKY', 'LEAF', 'DEW'] },
      { id: 'axolotl',  name: 'AXOLOTL',  kind: 'amph', col: '#ff9fc4', col2: '#d9628f', belly: '#ffd6e6',
        names: ['GILLY', 'MOPE', 'FRILL', 'PALE'] },
      { id: 'newt',     name: 'FIRE NEWT', kind: 'amph', col: '#25252e', col2: '#12121a', belly: '#ff7a18',
        names: ['EMBER', 'SOOT', 'CINDER', 'ASH'] },
      { id: 'viper',    name: 'PIT VIPER', kind: 'rept', col: '#2f7d4f', col2: '#17492c', belly: '#d3c56a',
        names: ['HISS', 'FANG', 'COIL', 'RATTLE'] },
      { id: 'python',   name: 'PYTHON',   kind: 'rept', col: '#b08a3c', col2: '#6d5320', belly: '#e6d59a',
        names: ['NOODLE', 'SQUEEZE', 'MONTY', 'LOOP'] },
      { id: 'gecko',    name: 'GECKO',    kind: 'rept', col: '#3fb8d6', col2: '#1f7a91', belly: '#bff0ff',
        names: ['SUCTION', 'BLINK', 'TACK', 'GLASS'] },
      { id: 'iguana',   name: 'IGUANA',   kind: 'rept', col: '#4fa03a', col2: '#2b6320', belly: '#a8d17a',
        names: ['SPIKE', 'REGAL', 'FROND', 'BASK'] },
      { id: 'gator',    name: 'GATOR KID', kind: 'rept', col: '#4a6b4a', col2: '#2a4230', belly: '#c2c98a',
        names: ['CHOMP', 'SNAP', 'LEVEE', 'BAYOU'] },
      { id: 'turtle',   name: 'SNAPPER',  kind: 'rept', col: '#5c7a3a', col2: '#37501f', belly: '#c9b06a',
        names: ['SHELL', 'GRIT', 'MUD', 'ANVIL'] },
      { id: 'salamander', name: 'SALAMANDER', kind: 'amph', col: '#c73b1f', col2: '#7d1f0e', belly: '#ffb03a',
        names: ['FLARE', 'SCORCH', 'RUST', 'MOLT'] },
    ],

    // ---------- dental symptoms ----------
    // sign: what you SEE on the tooth. dx: notebook diagnosis id.
    // steps: ordered procedure the diagnosis unlocks.
    symptoms: [
      { id: 'caries',   sign: 'BLACK PIT IN THE CROWN',        dx: 'CARIES',      pay: 16,
        steps: ['drill', 'fill'], gore: 1,
        book: 'A dark pit that eats inward. Bore it out clean, then pack the hole.' },
      { id: 'tartar',   sign: 'CRUSTED YELLOW-GREEN BUILDUP',  dx: 'TARTAR',      pay: 11,
        steps: ['scale'], gore: 1,
        book: 'Hardened crust along the gum line. Scrape it off at a steady speed.' },
      { id: 'abscess',  sign: 'SWOLLEN BULGE, PUS HEAD',       dx: 'ABSCESS',     pay: 26,
        steps: ['lance', 'suction'], gore: 3,
        book: 'A pressurised sac in the gum. Lance the head, then clear the field.' },
      { id: 'fracture', sign: 'JAGGED CRACK, SHARP EDGES',     dx: 'FRACTURE',    pay: 20,
        steps: ['fill'], gore: 1,
        book: 'A split running down the enamel. Bond it before it shears apart.' },
      { id: 'impacted', sign: 'TILTED, CROWDING ITS NEIGHBOUR',dx: 'IMPACTION',   pay: 34,
        steps: ['extract', 'suction'], gore: 4,
        book: 'Wedged in sideways. It will not be saved. Rock it out and pack the socket.' },
      { id: 'necrosis', sign: 'GREY-DEAD, DARK CORE',          dx: 'NECROSIS',    pay: 30,
        steps: ['drill', 'suction', 'fill'], gore: 2,
        book: 'The pulp died. Open it, clear the canal, seal it shut.' },
      { id: 'foreign',  sign: 'SOMETHING WEDGED IN THE GAP',   dx: 'FOREIGN BODY',pay: 12,
        steps: ['forceps'], gore: 1,
        book: 'Whatever you sold them today. Grip it and pull it free.' },
      { id: 'gingiva',  sign: 'GUM WEEPING BLOOD, PUFFY',      dx: 'GINGIVITIS',  pay: 14,
        steps: ['scale', 'suction'], gore: 2,
        book: 'Inflamed, bleeding tissue. Scale the margin, then clear the blood.' },
    ],

    // ---------- tools ----------
    tools: [
      { id: 'probe',   name: 'PROBE',   hint: 'CLICK A TOOTH TO EXAMINE IT' },
      { id: 'scale',   name: 'SCALER',  hint: 'DRAG ALONG THE TOOTH - KEEP SPEED IN THE BAND' },
      { id: 'drill',   name: 'DRILL',   hint: 'HOLD TO SINK - RELEASE IN THE GREEN, NOT THE NERVE' },
      { id: 'fill',    name: 'FILLER',  hint: 'HOLD TO PACK - STOP ON THE LINE' },
      { id: 'forceps', name: 'FORCEPS', hint: 'GRIP, THEN DRAG SIDE TO SIDE IN RHYTHM' },
      { id: 'extract', name: 'ELEVATOR',hint: 'ROCK LEFT AND RIGHT ON THE BEAT UNTIL IT LIFTS' },
      { id: 'lance',   name: 'SCALPEL', hint: 'CLICK WHEN THE RING IS TIGHT ON THE HEAD' },
      { id: 'suction', name: 'SUCTION', hint: 'HOLD OVER BLOOD TO CLEAR THE FIELD' },
    ],
  };

  // ---------- lookups ----------
  G.flavorById = (id) => G.DATA.flavors.find((f) => f.id === id);
  G.sauceById = (id) => G.DATA.sauces.find((f) => f.id === id);
  G.topById = (id) => G.DATA.tops.find((f) => f.id === id);
  G.animalById = (id) => G.DATA.animals.find((a) => a.id === id) || G.DATA.animals[0];
  G.sympById = (id) => G.DATA.symptoms.find((s) => s.id === id);
  G.toolById = (id) => G.DATA.tools.find((t) => t.id === id);
  G.owned = (kind, id) => G.state[kind].includes(id);
  G.hasUp = (id) => G.state.upgrades.includes(id);

  G.MULTI_COLS = {
    grit: ['#ff2e88', '#ffcf2e', '#2ee6ff', '#6dff3f', '#b46bff', '#ff6a3d'],
    worm: ['#6ee06e', '#ff3b4e', '#ffcf2e', '#ff2e88', '#2ee6ff'],
  };
  G.topBitCol = function (id) {
    const t = G.topById(id);
    if (t && t.multi) return G.pick(G.MULTI_COLS[id] || [t.col]);
    return t ? t.col : '#fff';
  };

  // ---------- save ----------
  const SAVE_KEY = 'doubleLife.save.v2';

  function freshState() {
    return {
      money: 0, moneyShown: 0, day: 1,
      flavors: ['bone', 'tar', 'bog'],
      sauces: ['tarsyrup'],
      tops: ['grit'],
      upgrades: [],
      muted: false,
      tut: {},
      dxSeen: [],                     // symptom ids the notebook has learned
      totCav: 0, totFixed: 0, totKids: 0, totBlood: 0, totMisdx: 0,
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
    G.state.today = { dayEarn: 0, nightEarn: 0, kidsServed: 0, perfect: 0, sugar: 0,
                      patients: [], blood: 0, misdx: 0, fixed: 0 };
  };

  // ---------- pint layer generation ----------
  // A pint is a rectangle sliced into horizontal flavour layers.
  // Deeper layers need deeper carving -> that is the day's skill curve.
  G.makePint = function (idx) {
    const own = G.state.flavors;
    const n = own.length;
    const nl = G.clamp(1 + Math.floor(n / 3) + (idx % 2), 1, 4);
    const layers = [];
    // walk the owned list with a stride that is coprime-ish to its length so
    // successive pints get distinct strata instead of all starting on the same flavour
    const stride = 1 + (idx % Math.max(1, n - 1));
    let cur = (idx * 2 + idx * idx) % n;
    for (let i = 0; i < nl; i++) {
      layers.push(own[cur % n]);
      cur = (cur + stride) % n;
    }
    return layers;
  };
})();

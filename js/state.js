// ============================================================
// DOUBLE LIFE - state.js
// Game data definitions (flavors, sauces, toppings, animal
// species, clinic upgrades) + save/load via localStorage.
// ============================================================
(function () {
  const G = window.GAME;

  G.DATA = {
    flavors: [
      { id: 'vanilla',   name: 'VANILLA',     col: '#fff3d6', price: 0 },
      { id: 'choco',     name: 'CHOCOLATE',   col: '#9c6b45', price: 0 },
      { id: 'straw',     name: 'STRAWBERRY',  col: '#ffa3bc', price: 0 },
      { id: 'mint',      name: 'MINT CHIP',   col: '#9fe6c2', price: 25, fleck: '#3f5d4a' },
      { id: 'banana',    name: 'BANANA',      col: '#ffe08a', price: 45 },
      { id: 'blueberry', name: 'BLUEBERRY',   col: '#8fa7ff', price: 70 },
      { id: 'bubble',    name: 'BUBBLEGUM',   col: '#ff8ade', price: 105, fleck: '#7fd6ff' },
      { id: 'matcha',    name: 'MATCHA',      col: '#accf7d', price: 150 },
      { id: 'mango',     name: 'MANGO',       col: '#ffb84d', price: 210 },
      { id: 'galaxy',    name: 'GALAXY',      col: '#7a68e8', price: 300, fleck: '#ffe66e' },
    ],
    sauces: [
      { id: 'chocsauce', name: 'CHOCO SAUCE', col: '#4e2d17', price: 0 },
      { id: 'strawsauce', name: 'BERRY SAUCE', col: '#ff5f8f', price: 35 },
      { id: 'caramel',   name: 'CARAMEL',     col: '#e09b3a', price: 80 },
      { id: 'honey',     name: 'HONEY',       col: '#ffcf4d', price: 140 },
    ],
    tops: [
      { id: 'sprinkles', name: 'SPRINKLES',   col: '#ff6e9c', multi: true, price: 0 },
      { id: 'cookie',    name: 'COOKIE BITS', col: '#8a5a3b', price: 30 },
      { id: 'chip',      name: 'CHOCO CHIPS', col: '#4a2b1f', price: 65 },
      { id: 'gummy',     name: 'GUMMY BEARS', col: '#6ee06e', multi: true, price: 110 },
      { id: 'mallow',    name: 'MARSHMALLOW', col: '#fffdf8', price: 170 },
    ],
    upgrades: [
      { id: 'goldscoop', name: 'GOLD SCOOP',  desc: 'SCOOP 2X FASTER',   price: 60 },
      { id: 'bigbrush',  name: 'MEGA BRUSH',  desc: 'BIGGER SCRUB AREA', price: 90 },
      { id: 'turbodrill', name: 'TURBO DRILL', desc: 'DRILL 2X FASTER',  price: 130 },
      { id: 'comfy',     name: 'COMFY CHAIR', desc: '+25% CLINIC PAY',   price: 200 },
    ],
    animals: [
      { id: 'turtle', name: 'TURTLE', col: '#8fd177', col2: '#5e8f52', names: ['TOBI', 'SHELLY', 'MOSS', 'KAME'] },
      { id: 'dog',    name: 'PUPPY',  col: '#d9a566', col2: '#a87b4f', names: ['BISCUIT', 'REX', 'MOCHI', 'WAFFLES'] },
      { id: 'cat',    name: 'KITTY',  col: '#bdb6cf', col2: '#948cab', names: ['LUNA', 'MIMI', 'SOOT', 'PUDDING'] },
      { id: 'bunny',  name: 'BUNNY',  col: '#fdf3ee', col2: '#e3c8c2', names: ['CLOVER', 'PIP', 'THUMPER', 'MOFU'] },
      { id: 'tiger',  name: 'TIGER',  col: '#ffa04d', col2: '#d97c2e', names: ['RAJA', 'TORA', 'ZIGZAG', 'RUSTY'] },
      { id: 'frog',   name: 'FROGGY', col: '#8ad06e', col2: '#5f9e4a', names: ['KERO', 'LILY', 'HOPS', 'BOG'] },
      { id: 'panda',  name: 'PANDA',  col: '#f7f3ec', col2: '#3a3440', names: ['BAO', 'BAMBOO', 'PON', 'YUKI'] },
      { id: 'snake',  name: 'SNAKE',  col: '#b48ae0', col2: '#8a5fc0', names: ['NOODLE', 'SLINKY', 'ZuZU', 'BOOP'] },
    ],
  };

  const SAVE_KEY = 'doubleLife.save.v1';

  function freshState() {
    return {
      money: 0,
      moneyShown: 0,
      day: 1,
      flavors: ['vanilla', 'choco', 'straw'],
      sauces: ['chocsauce'],
      tops: ['sprinkles'],
      upgrades: [],
      muted: false,
      tut: {},                       // tutorial hints already shown
      totCavCaused: 0, totCavFixed: 0, totKids: 0,
      newIds: [],                    // recently bought -> show NEW! badge
      today: null,                   // per-day stats, filled by day scene
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
    } catch (e) { /* private mode etc - play without saving */ }
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

  // convenience lookups
  G.flavorById = (id) => G.DATA.flavors.find((f) => f.id === id);
  G.sauceById = (id) => G.DATA.sauces.find((f) => f.id === id);
  G.topById = (id) => G.DATA.tops.find((f) => f.id === id);
  G.animalById = (id) => G.DATA.animals.find((a) => a.id === id);
  G.owned = (kind, id) => G.state[kind].includes(id);
  G.hasUp = (id) => G.state.upgrades.includes(id);

  // multi-colored topping bits (sprinkles / gummies)
  G.MULTI_COLS = {
    sprinkles: ['#ff6e9c', '#ffd94a', '#7fd6ff', '#9be66e', '#c9a3ff', '#ff9d5c'],
    gummy: ['#6ee06e', '#ff7070', '#ffd94a', '#ff9ad5', '#7fd6ff'],
  };
  G.topBitCol = function (id) {
    const t = G.topById(id);
    if (t && t.multi) return G.pick(G.MULTI_COLS[id] || [t.col]);
    return t ? t.col : '#fff';
  };

  // start-of-day sugar forecast helpers
  G.newDayStats = function () {
    G.state.today = { dayEarn: 0, nightEarn: 0, cavCaused: 0, kidsServed: 0, patients: [], perfect: 0 };
  };
})();

// ============================================================
// DOUBLE LIFE v5 - state.js
// You are a discarded ice cream machine. A human dug you out of
// the scrap and gave you a name. The machines run the city now.
// You serve them ice cream they cannot digest, charge them to
// put right what it does, and spend the money arming the people.
//
// Data: 18 robot archetypes with purposes, personalities, internal
// systems and tastes; an ingredient catalogue you order online; a
// mixer that turns ingredients into flavours; batches, pits, the
// armoury, and clause.ai's subscription tiers.
// ============================================================
(function () {
  const G = window.GAME;
  const P = G.PAL;

  // ------------------------------------------------------------
  // INGREDIENTS. Bought online. Every one carries properties, and
  // VOLT is the one that matters: it is what their systems cannot
  // take. High volt earns you a bigger repair bill and more heat.
  // ------------------------------------------------------------
  const ING = [
    // --- bases ---
    { id: 'cream',   name: 'CREAM',        cat: 'BASE', price: 4,  col: '#f6ecc8', rich: 3, sweet: 1 },
    { id: 'milk',    name: 'MILK',         cat: 'BASE', price: 2,  col: '#faf4e2', rich: 1, sweet: 1 },
    { id: 'custard', name: 'CUSTARD',      cat: 'BASE', price: 7,  col: '#ffe9a0', rich: 4, sweet: 2 },
    { id: 'soy',     name: 'SOY BASE',     cat: 'BASE', price: 5,  col: '#e8dcc0', rich: 2, bitter: 1 },
    { id: 'oilbase', name: 'MACHINE OIL',  cat: 'BASE', price: 9,  col: '#3a2f1a', rich: 5, volt: 2, illegal: 1 },
    // --- sweeteners ---
    { id: 'sugar',   name: 'SUGAR',        cat: 'SWEET', price: 2, col: '#ffffff', sweet: 4 },
    { id: 'honey',   name: 'HONEY',        cat: 'SWEET', price: 6, col: '#e0a12a', sweet: 4, rich: 2 },
    { id: 'syrup',   name: 'CORN SYRUP',   cat: 'SWEET', price: 4, col: '#d8b45a', sweet: 5, goo: 3 },
    { id: 'sweeten', name: 'SWEETENER',    cat: 'SWEET', price: 8, col: '#e8f0ff', sweet: 6, volt: 1 },
    // --- flavours ---
    { id: 'vanilla', name: 'VANILLA POD',  cat: 'TASTE', price: 9,  col: '#efdcae', sweet: 2, arom: 3 },
    { id: 'cocoa',   name: 'COCOA',        cat: 'TASTE', price: 8,  col: '#6b3f22', bitter: 2, rich: 3 },
    { id: 'straw',   name: 'STRAWBERRY',   cat: 'TASTE', price: 7,  col: '#ff5d84', sweet: 3, sour: 2 },
    { id: 'mint',    name: 'MINT',         cat: 'TASTE', price: 6,  col: '#5fe0ba', cold: 3, arom: 2 },
    { id: 'coffee',  name: 'COFFEE BEAN',  cat: 'TASTE', price: 10, col: '#a8703c', bitter: 3, arom: 3 },
    { id: 'pistach', name: 'PISTACHIO',    cat: 'TASTE', price: 13, col: '#a8d158', rich: 2, salty: 1, grit: 1 },
    { id: 'banana',  name: 'BANANA',       cat: 'TASTE', price: 6,  col: '#ffd94a', sweet: 3, goo: 2 },
    { id: 'lemon',   name: 'LEMON',        cat: 'TASTE', price: 5,  col: '#fff05a', sour: 4, cold: 1 },
    { id: 'matcha',  name: 'MATCHA',       cat: 'TASTE', price: 15, col: '#8fbf3a', bitter: 3, arom: 4 },
    { id: 'lavend',  name: 'LAVENDER',     cat: 'TASTE', price: 14, col: '#b48ae0', arom: 5 },
    { id: 'liquor',  name: 'LIQUORICE',    cat: 'TASTE', price: 11, col: '#22202c', bitter: 4, arom: 2 },
    // --- additives: the interesting ones ---
    { id: 'salt',    name: 'SEA SALT',     cat: 'ADD', price: 3,  col: '#e8eef4', salty: 4 },
    { id: 'chilli',  name: 'CHILLI',       cat: 'ADD', price: 7,  col: '#e02020', heat: 4, volt: 1 },
    { id: 'charcoal',name: 'CHARCOAL',     cat: 'ADD', price: 9,  col: '#1a1a20', bitter: 2, grit: 3 },
    { id: 'glitter', name: 'EDIBLE GLITTER', cat: 'ADD', price: 12, col: '#ffd0f0', grit: 2, arom: 1, spark: 1 },
    { id: 'popcand', name: 'POPPING CANDY',cat: 'ADD', price: 10, col: '#ff8ad8', sweet: 2, spark: 3, volt: 1 },
    { id: 'coolant', name: 'COOLANT',      cat: 'ADD', price: 18, col: '#3affd0', cold: 6, volt: 3, illegal: 1 },
    { id: 'ironfil', name: 'IRON FILINGS', cat: 'ADD', price: 16, col: '#8a93ad', grit: 5, volt: 3, illegal: 1 },
    { id: 'magdust', name: 'MAGNET DUST',  cat: 'ADD', price: 24, col: '#5a4f78', grit: 3, volt: 5, illegal: 1 },
    { id: 'acid',    name: 'BATTERY ACID', cat: 'ADD', price: 30, col: '#c9ff2a', sour: 6, volt: 6, illegal: 1 },
    { id: 'thermite',name: 'THERMITE',     cat: 'ADD', price: 44, col: '#ff7a1f', heat: 8, volt: 8, illegal: 1 },
  ];
  const PROPS = ['sweet', 'rich', 'sour', 'bitter', 'salty', 'cold', 'heat', 'arom', 'grit', 'goo', 'spark', 'volt'];

  // ------------------------------------------------------------
  // SYSTEMS. What is inside a machine decides how you repair it.
  // ------------------------------------------------------------
  const SYSTEMS = {
    hydraulic: { name: 'HYDRAULIC', desc: 'PRESSURE LINES AND A RESERVOIR',
      col: '#3a7ac0', tools: ['bleed', 'clamp', 'purge'],
      faults: [
        { id: 'seal',   name: 'BLOWN SEAL',    sign: 'FLUID WEEPING FROM A JOINT', steps: ['clamp'], pay: 16 },
        { id: 'airlock',name: 'AIR LOCK',      sign: 'A BUBBLE STALLED IN THE LINE', steps: ['bleed'], pay: 14 },
        { id: 'sludge', name: 'SLUDGED LINE',  sign: 'THE LINE IS PACKED SOLID', steps: ['purge', 'bleed'], pay: 24 },
      ] },
    clockwork: { name: 'CLOCKWORK', desc: 'GEAR TRAINS AND A MAINSPRING',
      col: '#c9a02a', tools: ['tweeze', 'wind', 'lube'],
      faults: [
        { id: 'jam',    name: 'JAMMED TRAIN',  sign: 'SOMETHING IN THE GEAR TEETH', steps: ['tweeze'], pay: 15 },
        { id: 'spring', name: 'SLACK SPRING',  sign: 'THE MAINSPRING HAS RUN DOWN', steps: ['wind'], pay: 12 },
        { id: 'dry',    name: 'DRY PIVOTS',    sign: 'THE PIVOTS ARE SQUEALING', steps: ['lube', 'wind'], pay: 22 },
      ] },
    boiler: { name: 'BOILER', desc: 'A BURNER AND A HEAT EXCHANGER',
      col: '#e0642a', tools: ['descale', 'vent', 'ignite'],
      faults: [
        { id: 'scale',  name: 'SCALED CORE',   sign: 'CRUST OVER THE EXCHANGER', steps: ['descale'], pay: 18 },
        { id: 'over',   name: 'OVERPRESSURE',  sign: 'THE GAUGE IS IN THE RED', steps: ['vent'], pay: 15 },
        { id: 'out',    name: 'FLAMEOUT',      sign: 'THE BURNER IS COLD AND DARK', steps: ['vent', 'ignite'], pay: 25 },
      ] },
    acoustic: { name: 'ACOUSTIC', desc: 'A RESONATOR AND TENSIONED STRINGS',
      col: '#b8862f', tools: ['tune', 'resin', 'pick'],
      faults: [
        { id: 'detune', name: 'DETUNED',       sign: 'THE STRINGS ARE ALL FLAT', steps: ['tune'], pay: 14 },
        { id: 'crack',  name: 'CRACKED BODY',  sign: 'A SPLIT ACROSS THE RESONATOR', steps: ['resin'], pay: 20 },
        { id: 'muted',  name: 'MUTED REED',    sign: 'SOMETHING IS DAMPING THE REED', steps: ['pick', 'tune'], pay: 23 },
      ] },
    neural: { name: 'NEURAL', desc: 'A LATTICE OF NODES AND LINKS',
      col: '#9a5cff', tools: ['probe', 'patch', 'reset'],
      faults: [
        { id: 'dead',   name: 'DEAD NODE',     sign: 'ONE NODE HAS GONE DARK', steps: ['patch'], pay: 20 },
        { id: 'cross',  name: 'CROSSED LINK',  sign: 'TWO LINKS ARE SHORTED TOGETHER', steps: ['probe', 'patch'], pay: 26 },
        { id: 'loop',   name: 'SEIZURE LOOP',  sign: 'THE WHOLE LATTICE IS FIRING', steps: ['reset'], pay: 22 },
      ] },
    optical: { name: 'OPTICAL', desc: 'A LENS STACK AND MIRRORS',
      col: '#22c0e0', tools: ['polish', 'align', 'free'],
      faults: [
        { id: 'fog',    name: 'FOGGED LENS',   sign: 'THE GLASS HAS CLOUDED OVER', steps: ['polish'], pay: 13 },
        { id: 'mirror', name: 'BENT MIRROR',   sign: 'THE BEAM IS WALKING OFF LINE', steps: ['align'], pay: 19 },
        { id: 'iris',   name: 'STUCK IRIS',    sign: 'THE APERTURE WILL NOT MOVE', steps: ['free', 'polish'], pay: 24 },
      ] },
    servo: { name: 'SERVO', desc: 'MOTOR STACKS, BELTS AND ENCODERS',
      col: '#3affa0', tools: ['tension', 'rewind', 'calib'],
      faults: [
        { id: 'belt',   name: 'SLIPPED BELT',  sign: 'A BELT HAS JUMPED ITS PULLEY', steps: ['tension'], pay: 15 },
        { id: 'burnt',  name: 'BURNT WINDING', sign: 'A COIL IS SCORCHED BLACK', steps: ['rewind'], pay: 24 },
        { id: 'skip',   name: 'ENCODER SKIP',  sign: 'THE COUNT KEEPS LOSING STEPS', steps: ['calib'], pay: 17 },
      ] },
    armour: { name: 'ARMOUR', desc: 'PLATE, BOLTS AND WELD',
      col: '#8a93ad', tools: ['press', 'bolt', 'weld'],
      faults: [
        { id: 'buckle', name: 'BUCKLED PLATE', sign: 'A PLATE HAS FOLDED INWARD', steps: ['press'], pay: 18 },
        { id: 'sheared',name: 'SHEARED BOLTS', sign: 'THE BOLT HEADS ARE GONE', steps: ['bolt'], pay: 16 },
        { id: 'weldc',  name: 'CRACKED WELD',  sign: 'THE SEAM HAS OPENED UP', steps: ['weld', 'press'], pay: 26 },
      ] },
  };

  // ------------------------------------------------------------
  // TOOLS. Grouped by the system that needs them.
  // ------------------------------------------------------------
  const TOOLS = {
    bleed:  { name: 'BLEED KEY', hint: 'HOLD ON THE BUBBLE UNTIL IT PASSES' },
    clamp:  { name: 'CLAMP',     hint: 'HOLD ON THE LEAK TO CINCH IT SHUT' },
    purge:  { name: 'PURGE GUN', hint: 'HOLD TO FLUSH THE LINE THROUGH' },
    tweeze: { name: 'TWEEZERS',  hint: 'GRIP THE DEBRIS AND DRAG IT CLEAR' },
    wind:   { name: 'WINDER',    hint: 'DRAG IN CIRCLES TO WIND IT UP' },
    lube:   { name: 'OILER',     hint: 'HOLD ON EACH DRY PIVOT' },
    descale:{ name: 'DESCALE',  hint: 'DRAG OVER THE CRUST TO STRIP IT' },
    vent:   { name: 'VENT KEY',  hint: 'HOLD TO BLEED THE PRESSURE DOWN' },
    ignite: { name: 'IGNITER',   hint: 'CLICK THE BURNER TO RELIGHT IT' },
    tune:   { name: 'TUNING KEY',hint: 'DRAG EACH PEG UNTIL THE NOTE SITS' },
    resin:  { name: 'RESIN GUN', hint: 'DRAG ALONG THE CRACK TO FILL IT' },
    pick:   { name: 'REED PICK', hint: 'GRIP WHAT IS ON THE REED AND PULL' },
    probe:  { name: 'PROBE',     hint: 'CLICK BOTH ENDS OF THE CROSSED LINK' },
    patch:  { name: 'PATCH PEN', hint: 'HOLD ON THE NODE TO REGROW IT' },
    reset:  { name: 'RESET ROD', hint: 'HOLD ANYWHERE TO DRAIN THE LATTICE' },
    polish: { name: 'POLISH',    hint: 'DRAG OVER THE GLASS IN CIRCLES' },
    align:  { name: 'ALIGN KEY', hint: 'DRAG THE MIRROR BACK ONTO THE MARK' },
    free:   { name: 'IRIS KEY',  hint: 'HOLD ON THE IRIS TO WORK IT LOOSE' },
    tension:{ name: 'TENSION', hint: 'DRAG THE BELT BACK ONTO THE PULLEY' },
    rewind: { name: 'REWINDER',  hint: 'DRAG IN CIRCLES TO LAY NEW WIRE' },
    calib:  { name: 'CALIBRATE',hint: 'HOLD UNTIL THE COUNT SETTLES' },
    press:  { name: 'PRESS',     hint: 'HOLD ON THE DENT TO PUSH IT OUT' },
    bolt:   { name: 'BOLT GUN',  hint: 'CLICK EACH EMPTY BOLT HOLE' },
    weld:   { name: 'WELDER',    hint: 'DRAG ALONG THE SEAM TO CLOSE IT' },
  };

  // ------------------------------------------------------------
  // THE OCCUPATION. Eighteen archetypes. Each one is a job, a
  // silhouette, a temperament, an internal system and a taste.
  // taste: which property it wants most. hates: what ruins it.
  // ------------------------------------------------------------
  const BOTS = [
    { id: 'tank',    name: 'SIEGE UNIT',   job: 'ARMOUR CORPS', sys: 'armour',
      taste: 'rich',   hates: 'sour',   pay: 1.4, patience: 1.4, mood: 'blunt',
      col: '#5c6b3a', col2: '#8a9a56', hue: '#b6ff3a',
      line: 'FUEL. NOT FLAVOUR.', names: ['BRK-9', 'BULWARK', 'SIEGE', 'RAMPART'] },
    { id: 'maid',    name: 'MAID UNIT',    job: 'DOMESTIC', sys: 'servo',
      taste: 'arom',   hates: 'grit',   pay: 1.0, patience: 1.6, mood: 'fussy',
      col: '#e8e4ee', col2: '#b8b4c8', hue: '#ff9ad0',
      line: 'A SMALL ONE. TIDY, PLEASE.', names: ['MIMI', 'DUSTER', 'PARLOUR', 'LINEN'] },
    { id: 'mafia',   name: 'ENFORCER',     job: 'FAMILY BUSINESS', sys: 'hydraulic',
      taste: 'bitter', hates: 'sweet',  pay: 1.6, patience: 0.8, mood: 'menacing',
      col: '#2a2a38', col2: '#4a4a60', hue: '#ff2f4e',
      line: 'MAKE IT BITTER. LIKE THE CITY.', names: ['DON-1', 'KNUCKLE', 'VIG', 'CEMENT'] },
    { id: 'police',  name: 'PATROL UNIT',  job: 'CIVIC ORDER', sys: 'optical',
      taste: 'sweet',  hates: 'heat',   pay: 1.2, patience: 1.0, mood: 'officious',
      col: '#22386b', col2: '#3a5a9a', hue: '#4a9aff',
      line: 'STANDARD ISSUE. NO ADDITIVES.', names: ['PC-44', 'BATON', 'WHISTLE', 'BEAT'] },
    { id: 'fat',     name: 'CONSUMER UNIT',job: 'DEMAND MODELLING', sys: 'boiler',
      taste: 'sweet',  hates: 'salty',  pay: 1.8, patience: 1.8, mood: 'greedy',
      col: '#c9762a', col2: '#e8a05a', hue: '#ffd44a',
      line: 'MORE. ALL OF IT. MORE.', names: ['BIG-7', 'HOPPER', 'GULLET', 'SILO'] },
    { id: 'violin',  name: 'ORCHESTRA UNIT', job: 'STATE CULTURE', sys: 'acoustic',
      taste: 'arom',   hates: 'goo',    pay: 1.5, patience: 1.2, mood: 'snobbish',
      col: '#8a4a22', col2: '#c07a3a', hue: '#ffcf7a',
      line: 'SOMETHING WITH STRUCTURE.', names: ['VLN-3', 'ADAGIO', 'ROSIN', 'CATGUT'] },
    { id: 'chef',    name: 'KITCHEN UNIT', job: 'NUTRIENT ISSUE', sys: 'boiler',
      taste: 'salty',  hates: 'sweet',  pay: 1.3, patience: 0.9, mood: 'critical',
      col: '#e4e8ee', col2: '#b0b6c2', hue: '#ff6a3a',
      line: 'I WILL BE JUDGING THIS.', names: ['ESC-8', 'BRAISE', 'MIREPOIX', 'LADLE'] },
    { id: 'nurse',   name: 'MEDICAL UNIT', job: 'POPULATION HEALTH', sys: 'neural',
      taste: 'cold',   hates: 'volt',   pay: 1.1, patience: 1.5, mood: 'clinical',
      col: '#f0f4f8', col2: '#c0cad6', hue: '#3affd0',
      line: 'NOTHING UNSTERILE.', names: ['RN-2', 'SALINE', 'SUTURE', 'SWAB'] },
    { id: 'judge',   name: 'MAGISTRATE',   job: 'COMPLIANCE', sys: 'neural',
      taste: 'bitter', hates: 'spark',  pay: 1.7, patience: 1.1, mood: 'pompous',
      col: '#22202c', col2: '#45414f', hue: '#c49bff',
      line: 'PLAIN. AUSTERE. AS THE LAW REQUIRES.', names: ['JDG-1', 'GAVEL', 'STATUTE', 'WRIT'] },
    { id: 'miner',   name: 'EXCAVATOR',    job: 'DEEP EXTRACTION', sys: 'hydraulic',
      taste: 'grit',   hates: 'arom',   pay: 1.2, patience: 1.3, mood: 'weary',
      col: '#6b5a2a', col2: '#9a8548', hue: '#ffb01f',
      line: 'SOMETHING WITH BITE IN IT.', names: ['DIG-6', 'SEAM', 'ADIT', 'FACE'] },
    { id: 'priest',  name: 'CHAPLAIN UNIT',job: 'MORALE', sys: 'optical',
      taste: 'cold',   hates: 'heat',   pay: 1.1, patience: 1.7, mood: 'solemn',
      col: '#e8e2d0', col2: '#b8b0a0', hue: '#ffe89a',
      line: 'SOMETHING WHITE AND QUIET.', names: ['CHP-5', 'VESPER', 'CENSER', 'MATINS'] },
    { id: 'dj',      name: 'ENTERTAINMENT',job: 'MOOD CONTROL', sys: 'acoustic',
      taste: 'spark',  hates: 'bitter', pay: 1.3, patience: 0.7, mood: 'hyper',
      col: '#2a1f4a', col2: '#4a3a80', hue: '#ff2f8e',
      line: 'MAKE IT GO OFF IN MY HEAD.', names: ['DJ-X', 'BREAK', 'BASSBIN', 'CUE'] },
    { id: 'clerk',   name: 'RECORDS UNIT', job: 'ADMINISTRATION', sys: 'clockwork',
      taste: 'sweet',  hates: 'heat',   pay: 0.9, patience: 1.9, mood: 'pedantic',
      col: '#4a4436', col2: '#736a52', hue: '#d8c47a',
      line: 'AS PER THE STANDING ORDER.', names: ['CLK-0', 'FOLIO', 'STAMP', 'LEDGER'] },
    { id: 'soldier', name: 'INFANTRY',     job: 'PACIFICATION', sys: 'servo',
      taste: 'salty',  hates: 'arom',   pay: 1.2, patience: 0.9, mood: 'terse',
      col: '#3a4a32', col2: '#5c7050', hue: '#a8d158',
      line: 'RATIONS. QUICKLY.', names: ['PVT-3', 'WEBBING', 'PICKET', 'TRENCH'] },
    { id: 'scav',    name: 'SCRAPPER',     job: 'UNLICENSED', sys: 'clockwork',
      taste: 'volt',   hates: 'none',   pay: 0.8, patience: 1.6, mood: 'feral',
      col: '#5a4a3a', col2: '#8a7258', hue: '#ff8a3a',
      line: 'ANYTHING. I EAT ANYTHING.', names: ['SCRP', 'MAGPIE', 'TALLOW', 'GLEAN'] },
    { id: 'courier', name: 'COURIER UNIT', job: 'LOGISTICS', sys: 'servo',
      taste: 'cold',   hates: 'goo',    pay: 1.0, patience: 0.6, mood: 'impatient',
      col: '#c92a4a', col2: '#e85a78', hue: '#ffd44a',
      line: 'FAST. I AM ON A CLOCK.', names: ['CUR-9', 'DASH', 'PARCEL', 'ROUTE'] },
    { id: 'garden',  name: 'HORTICULTURAL',job: 'GREEN ZONES', sys: 'hydraulic',
      taste: 'arom',   hates: 'volt',   pay: 1.0, patience: 1.8, mood: 'gentle',
      col: '#3a6b3a', col2: '#5c9a56', hue: '#8fe05a',
      line: 'SOMETHING THAT GREW, PLEASE.', names: ['GRD-4', 'TRELLIS', 'LOAM', 'BLOOM'] },
    { id: 'warden',  name: 'WARDEN UNIT',  job: 'DETENTION', sys: 'armour',
      taste: 'bitter', hates: 'sweet',  pay: 1.5, patience: 1.0, mood: 'cruel',
      col: '#3a3a44', col2: '#5c5c6b', hue: '#ff5a2a',
      line: 'COLD. AND DO NOT SPEAK.', names: ['WRD-2', 'KEYRING', 'BLOCK-C', 'CURFEW'] },
  ];

  // ------------------------------------------------------------
  // TOPPINGS. Ordered like ingredients, shaken on at the counter.
  // ------------------------------------------------------------
  const TOPS = [
    { id: 'sprinkles', name: 'SPRINKLES',   price: 0,  col: '#ff2f8e', multi: 1, grit: 1 },
    { id: 'nuts',      name: 'NUTS',        price: 40, col: '#c9a06a', grit: 3 },
    { id: 'chips',     name: 'CHOC CHIPS',  price: 55, col: '#3a2418', rich: 2 },
    { id: 'gummy',     name: 'GUMMY BEARS', price: 70, col: '#6ee06e', multi: 1, goo: 2 },
    { id: 'brittle',   name: 'BRITTLE',     price: 95, col: '#d8a03a', grit: 4 },
    { id: 'bolts',     name: 'STEEL BOLTS', price: 140, col: '#8a93ad', grit: 5, volt: 3, illegal: 1 },
    { id: 'fuses',     name: 'LIVE FUSES',  price: 200, col: '#ff7a1f', spark: 4, volt: 5, illegal: 1 },
  ];

  // ------------------------------------------------------------
  // SAUCES. Poured over the scoop, same idea.
  // ------------------------------------------------------------
  const SAUCES = [
    { id: 'fudge',  name: 'HOT FUDGE',    price: 0,   col: '#3a1f14', rich: 3, goo: 3 },
    { id: 'berry',  name: 'BERRY',        price: 45,  col: '#c8265c', sour: 2, sweet: 2 },
    { id: 'butter', name: 'BUTTERSCOTCH', price: 80,  col: '#e0912a', sweet: 4, goo: 3 },
    { id: 'brine',  name: 'BRINE',        price: 120, col: '#8fbfa0', salty: 5, volt: 2, illegal: 1 },
    { id: 'flux',   name: 'SOLDER FLUX',  price: 190, col: '#c9ff2a', volt: 6, spark: 2, illegal: 1 },
  ];

  // ------------------------------------------------------------
  // THE ARMOURY. Where the repair money goes.
  // ------------------------------------------------------------
  const ARMS = [
    { id: 'pit2',    name: '2ND PIT',      kind: 'shop', price: 120, desc: 'ONE MORE FLAVOUR ON THE LINE' },
    { id: 'pit3',    name: '3RD PIT',      kind: 'shop', price: 300, desc: 'THREE FLAVOURS AT ONCE' },
    { id: 'pit4',    name: '4TH PIT',      kind: 'shop', price: 620, desc: 'FOUR FLAVOURS AT ONCE' },
    { id: 'pit5',    name: '5TH PIT',      kind: 'shop', price: 1100, desc: 'THE FULL COUNTER' },
    { id: 'chiller', name: 'CHILLER COIL', kind: 'shop', price: 180, desc: 'PITS DRAIN SLOWER' },
    { id: 'ladle',   name: 'HEAVY LADLE',  kind: 'shop', price: 240, desc: 'BIGGER, FASTER SCOOPS' },
    { id: 'churn2',  name: 'TWIN CHURN',   kind: 'lab',  price: 260, desc: 'BATCHES COME OUT DOUBLE' },
    { id: 'assay',   name: 'ASSAY BENCH',  kind: 'lab',  price: 340, desc: 'SEE A MIX BEFORE YOU CHURN IT' },
    { id: 'patience',name: 'LONGER LEASH', kind: 'shop', price: 200, desc: 'MACHINES WAIT 40% LONGER' },
    { id: 'jukebox', name: 'JUKEBOX',       kind: 'shop', price: 220, desc: 'MUSIC ON THE FLOOR: BETTER TIPS' },
    { id: 'tipjar',  name: 'TIP JAR CAT',   kind: 'shop', price: 160, desc: 'A CAT ROBOT ON THE COUNTER. PET IT.' },
    { id: 'catnip',  name: 'CATNIP TIN',    kind: 'shop', price: 300, desc: 'THE CAT PURRS HARDER. TIPS DOUBLE.' },
    { id: 'piggy',   name: 'PIGGY BANK',    kind: 'shop', price: 340, desc: 'KEEP 10% OF THE TAKE OVERNIGHT' },
    { id: 'sign',    name: 'NEON SIGN',     kind: 'shop', price: 280, desc: 'ONE MORE MACHINE THROUGH THE DOOR' },
    { id: 'lamp',    name: 'UV LAMP',       kind: 'lab',  price: 240, desc: 'A DISGUISE TELL FAINTLY GLOWS' },
    { id: 'scanner', name: 'BONE SCANNER',  kind: 'lab',  price: 460, desc: 'CLAUSE NAMES THE TELL OUT LOUD' },
    { id: 'emp',     name: 'EMP BATON',    kind: 'war',  price: 400, desc: 'RESISTANCE: +20% REPAIR FEES' },
    { id: 'jammer',  name: 'SIGNAL JAMMER',kind: 'war',  price: 560, desc: 'SUSPICION FALLS FASTER' },
    { id: 'railspk', name: 'RAIL SPIKE',   kind: 'war',  price: 900, desc: 'RESISTANCE: +40% REPAIR FEES' },
    { id: 'virus',   name: 'VIRUS DARTS',  kind: 'war',  price: 1300, desc: 'ILLEGAL STOCK COSTS HALF' },
  ];

  // Recruitable allies. Robots you turned. Each gives a passive.
  const ALLIES = [
    { id: 'a_scav',   name: 'MAGPIE',   sp: 'scav',    price: 260,  desc: 'SCAVENGES: FREE INGREDIENT DAILY' },
    { id: 'a_courier',name: 'DASH',     sp: 'courier', price: 380,  desc: 'RUNS DELIVERIES: ORDERS ARRIVE FREE' },
    { id: 'a_chef',   name: 'MIREPOIX', sp: 'chef',    price: 540,  desc: 'TASTES MIXES: +15% ON A GOOD MATCH' },
    { id: 'a_nurse',  name: 'SALINE',   sp: 'nurse',   price: 700,  desc: 'PATCHES YOU UP: ONE FREE MISDIAGNOSIS' },
    { id: 'a_garden', name: 'BLOOM',    sp: 'garden',  price: 880,  desc: 'GROWS STOCK: AROMATICS HALF PRICE' },
    { id: 'a_tank',   name: 'BULWARK',  sp: 'tank',    price: 1200, desc: 'STANDS GUARD: SUSPICION CAPPED' },
  ];

  // ------------------------------------------------------------
  // CLAUSE.AI. Your assistant. Buy a bigger plan, get more help.
  // ------------------------------------------------------------
  const TIERS = [
    { id: 'free',  name: 'FREE',       price: 0,    calls: 4,
      perks: ['WALKS YOU THROUGH THE JOB', 'TAKES INGREDIENT ORDERS'] },
    { id: 'hobby', name: 'HOBBY',      price: 150,  calls: 8,
      perks: ['READS A CUSTOMER BEFORE IT ORDERS', 'FLAGS WHAT IT HATES'] },
    { id: 'pro',   name: 'PRO',        price: 420,  calls: 16,
      perks: ['DAILY DEMAND TRENDS', 'END OF DAY BREAKDOWN'] },
    { id: 'scale', name: 'SCALE',      price: 900,  calls: 32,
      perks: ['SUGGESTS RECIPES FROM YOUR SHELF', 'FORECASTS VOLT AND HEAT'] },
    { id: 'ultra', name: 'ENTERPRISE', price: 1800, calls: 99,
      perks: ['RESTOCKS THE SHELF ON ITS OWN', 'FULL ANALYTICS, NO LIMITS'] },
  ];

  G.DATA = { ing: ING, props: PROPS, systems: SYSTEMS, tools: TOOLS, bots: BOTS,
             tops: TOPS, sauces: SAUCES, arms: ARMS, allies: ALLIES, tiers: TIERS };

  // ---------- lookups ----------
  G.ingById   = (id) => ING.find((i) => i.id === id);
  // YOU. Not a customer, so not in the demand pool, but the rig needs a record.
  const PLAYER = { id: 'player', name: 'SOFT SERVE UNIT', job: 'DECOMMISSIONED', sys: 'clockwork',
    taste: 'sweet', hates: 'none', pay: 1, patience: 1, mood: 'idle',
    col: '#7a8a5c', col2: '#a8bc7a', hue: '#ff5d84',
    line: 'I STILL WORK.', names: ['YOU'] };
  G.botById    = (id) => (id === 'player' ? PLAYER : BOTS.find((b) => b.id === id) || BOTS[0]);
  G.sysById    = (id) => SYSTEMS[id] || SYSTEMS.servo;
  G.toolById   = (id) => TOOLS[id] || { name: id.toUpperCase(), hint: '' };
  G.topById    = (id) => TOPS.find((t) => t.id === id);
  G.sauceById  = (id) => SAUCES.find((s) => s.id === id);
  G.armById    = (id) => ARMS.find((a) => a.id === id);
  G.allyById   = (id) => ALLIES.find((a) => a.id === id);
  // ------------------------------------------------------------
  // WHO IS HIDING. A shell walks in, but there is someone in it.
  // Humans are hiding because the alternative is being processed.
  // Cats and dogs are hiding because a human hid them. Rarer, and
  // worth more, because nobody else is looking for them.
  // ------------------------------------------------------------
  const DISGUISE = [
    { kind: 'human', name: 'PERSON', weight: 68, pay: 60,
      tells: ['hair', 'breath', 'eye', 'heart'],
      lines: ['I THOUGHT YOU WERE ONE OF THEM.', 'DO NOT SAY MY NAME OUT LOUD.',
              'THREE WEEKS IN THIS THING. THREE WEEKS.', 'IS IT TRUE YOU KNEW HER?'] },
    { kind: 'cat',   name: 'CAT',    weight: 20, pay: 110,
      tells: ['tail', 'ear', 'paw', 'eye'],
      lines: ['(IT LOOKS AT YOU AND DECIDES YOU ARE FINE)', '(A SLOW BLINK)',
              '(IT SITS DOWN IN THE MIDDLE OF YOUR FLOOR)'] },
    { kind: 'dog',   name: 'DOG',    weight: 12, pay: 140,
      tells: ['tail', 'breath', 'paw', 'heart'],
      lines: ['(THE WHOLE CHASSIS IS WAGGING)', '(IT HAS BEEN HOLDING THAT IN FOR HOURS)',
              '(IT PUTS ITS HEAD UNDER YOUR NOZZLE ARM)'] },
  ];
  const CREW_NAMES = {
    human: ['ODILE', 'MARGIT', 'TOBIAS', 'SAFIYA', 'RENKO', 'HOLLIS', 'IVEN', 'BEA'],
    cat:   ['PICKLE', 'SEVEN', 'MRS ASH', 'DUMPLING', 'COMMA'],
    dog:   ['BISCUIT', 'RUDDER', 'BIG MO', 'PATCH'],
  };
  // what a rescue does for you once they are on the crew
  const CREW_PERKS = {
    human: [{ id: 'p_line',  desc: 'WORKS THE LINE: PITS DRAIN SLOWER' },
            { id: 'p_books', desc: 'KEEPS THE BOOKS: +10% ON EVERY REPAIR' },
            { id: 'p_watch', desc: 'WATCHES THE DOOR: HEAT RISES SLOWER' },
            { id: 'p_mix',   desc: 'GOOD PALATE: +10% ON A GOOD MATCH' }],
    cat:   [{ id: 'p_purr',  desc: 'SITS BY THE TIP JAR: TIPS UP' },
            { id: 'p_mouse', desc: 'KEEPS THE STORE CLEAN: FREE STOCK SOMETIMES' }],
    dog:   [{ id: 'p_bark',  desc: 'BARKS AT PATROLS: HEAT CAPPED' },
            { id: 'p_fetch', desc: 'FETCHES: ORDERS ARRIVE FREE' }],
  };
  G.DISGUISE = DISGUISE;

  // how likely the next machine is not a machine
  G.disguiseChance = function () {
    const base = 0.14 + Math.min(0.16, (G.state.day - 1) * 0.02);
    return base + (G.has('lamp') ? 0.06 : 0);
  };
  G.rollDisguise = function () {
    if (Math.random() > G.disguiseChance()) return null;
    let tot = 0;
    for (const d of DISGUISE) tot += d.weight;
    let r = Math.random() * tot;
    for (const d of DISGUISE) { r -= d.weight; if (r <= 0) return d; }
    return DISGUISE[0];
  };
  G.crewName = function (kind) {
    const pool = CREW_NAMES[kind] || CREW_NAMES.human;
    const taken = (G.state.crew || []).map((c) => c.name);
    const free = pool.filter((n) => taken.indexOf(n) < 0);
    return free.length ? G.pick(free) : G.pick(pool) + '-2';
  };
  G.crewPerk = function (kind) {
    const pool = CREW_PERKS[kind] || CREW_PERKS.human;
    const have = (G.state.crew || []).map((c) => c.perk);
    const free = pool.filter((p) => have.indexOf(p.id) < 0);
    return (free.length ? G.pick(free) : G.pick(pool));
  };
  G.hasPerk = (id) => (G.state.crew || []).some((c) => c.perk === id);
  G.crewOf = (kind) => (G.state.crew || []).filter((c) => c.kind === kind).length;

  // ------------------------------------------------------------
  // THE SHIFT. A quota and a number. Miss them and the district
  // notices a café that is not really a café.
  // ------------------------------------------------------------
  G.rollGoal = function (day) {
    const quota = Math.min(9, 3 + Math.floor((day - 1) * 0.7)) + (G.has('sign') ? 1 : 0);
    const take = 40 + (day - 1) * 26;
    return { quota, take, served: 0, earned: 0 };
  };
  G.goalMet = function () {
    const t = G.state.today;
    if (!t || !t.goal) return false;
    return t.served >= t.goal.quota && t.dayEarn >= t.goal.take;
  };
  // the floor closes when the queue is done, whether or not you hit it
  G.shiftDone = function () {
    const t = G.state.today;
    return !!(t && t.closed);
  };

  // ------------------------------------------------------------
  // CHAPTERS. The story moves when the world does, not on a timer.
  // ------------------------------------------------------------
  const CHAPTERS = [
    { id: 'ch1', name: 'THE SHELL',      when: (st) => st.day >= 1 },
    { id: 'ch2', name: 'THE FIRST ONE',  when: (st) => (st.crew || []).length >= 1 },
    { id: 'ch3', name: 'THE BACKROOM',   when: (st) => (st.flavours || []).length >= 4 },
    { id: 'ch4', name: 'ATTENTION',      when: (st) => st.suspicion >= 0.4 },
    { id: 'ch5', name: 'A CREW',         when: (st) => (st.crew || []).length >= 3 },
    { id: 'ch6', name: 'THE PATROL',     when: (st) => st.suspicion >= 0.75 },
    { id: 'ch7', name: 'WHAT SHE WANTED',when: (st) => (st.crew || []).length >= 6 },
  ];
  G.CHAPTERS = CHAPTERS;
  // the next chapter that has come true but has not been played
  G.dueChapter = function () {
    const seen = G.state.chapters || [];
    for (const c of CHAPTERS)
      if (seen.indexOf(c.id) < 0 && c.when(G.state)) return c;
    return null;
  };
  G.markChapter = function (id) {
    G.state.chapters = G.state.chapters || [];
    if (G.state.chapters.indexOf(id) < 0) G.state.chapters.push(id);
  };
  G.chapterName = function () {
    const seen = G.state.chapters || [];
    for (let i = CHAPTERS.length - 1; i >= 0; i--)
      if (seen.indexOf(CHAPTERS[i].id) >= 0) return CHAPTERS[i].name;
    return CHAPTERS[0].name;
  };

  G.tierIdx    = () => G.clamp(G.state.tier || 0, 0, TIERS.length - 1);
  G.tier       = () => TIERS[G.tierIdx()];
  G.has        = (id) => G.state.owned.indexOf(id) >= 0;
  G.hasAlly    = (id) => G.state.allies.indexOf(id) >= 0;
  G.faultOf    = (sysId, fid) => G.sysById(sysId).faults.find((f) => f.id === fid);
  G.pitCount   = () => 1 + (G.has('pit2') ? 1 : 0) + (G.has('pit3') ? 1 : 0)
                         + (G.has('pit4') ? 1 : 0) + (G.has('pit5') ? 1 : 0);

  G.MULTI_COLS = {
    sprinkles: ['#ff2f8e', '#ffcf2e', '#22e0ff', '#b6ff3a', '#c49bff', '#ff8a3d'],
    gummy: ['#6ee06e', '#ff3b4e', '#ffcf2e', '#ff2f8e', '#22e0ff'],
  };
  G.topBitCol = function (id) {
    const t = G.topById(id);
    if (t && t.multi) return G.pick(G.MULTI_COLS[id] || [t.col]);
    return t ? t.col : '#fff';
  };

  // ------------------------------------------------------------
  // MIXING. Two to four ingredients make a flavour. Properties add
  // up, the colour blends, and the name comes out of whatever is
  // loudest in the mix.
  // ------------------------------------------------------------
  const ADJ = { sweet: 'SUGAR', rich: 'VELVET', sour: 'SHARP', bitter: 'BLACK', salty: 'SALT',
                cold: 'FROST', heat: 'EMBER', arom: 'BLOOM', grit: 'GRAVEL', goo: 'TAR',
                spark: 'FIZZ', volt: 'LIVE' };
  const NOUN = ['SWIRL', 'CRUSH', 'RIPPLE', 'CHURN', 'DRIFT', 'SLAB', 'CLOUD', 'SEAM'];

  G.mixFlavour = function (ids, seed) {
    const parts = ids.map(G.ingById).filter(Boolean);
    if (!parts.length) return null;
    const f = { id: 'mix' + (seed === undefined ? Date.now() % 100000 : seed), parts: ids.slice() };
    for (const k of PROPS) f[k] = 0;
    let r = 0, g2 = 0, b = 0, illegal = 0;
    for (const p of parts) {
      for (const k of PROPS) f[k] += p[k] || 0;
      r += parseInt(p.col.slice(1, 3), 16);
      g2 += parseInt(p.col.slice(3, 5), 16);
      b += parseInt(p.col.slice(5, 7), 16);
      if (p.illegal) illegal = 1;
    }
    const n = parts.length;
    // pull the blend away from mud: push the channels apart a little
    const mid = (r + g2 + b) / (3 * n);
    const sat = (v) => G.clamp(Math.round(mid + (v / n - mid) * 1.45), 8, 250);
    f.col = '#' + [sat(r), sat(g2), sat(b)].map((v) => v.toString(16).padStart(2, '0')).join('');
    f.illegal = illegal;
    // the loudest two properties name it
    const rank = PROPS.slice().sort((a, b2) => f[b2] - f[a]);
    const top = rank[0];
    f.lead = top;
    f.name = (ADJ[top] || 'PLAIN') + ' ' + NOUN[(f.sweet * 3 + f.rich * 5 + f.volt * 7 + n) % NOUN.length];
    f.cost = parts.reduce((a, p) => a + p.price, 0);
    // what it is worth over the counter, and what it does to a machine
    f.value = 6 + Math.round((f.sweet + f.rich + f.arom + f.cold) * 0.7);
    f.fleck = f.grit >= 3 ? '#3a3a44' : (f.spark >= 3 ? '#ffffff' : null);
    return f;
  };

  // How well a flavour suits a given archetype: -1 .. +1
  G.match = function (flav, bot) {
    if (!flav || !bot) return 0;
    const want = flav[bot.taste] || 0;
    const hate = bot.hates === 'none' ? 0 : (flav[bot.hates] || 0);
    return G.clamp((want * 0.22) - (hate * 0.28), -1, 1);
  };

  // ---------- save ----------
  const SAVE_KEY = 'doubleLife.save.v5';

  function starterFlavours() {
    const a = G.mixFlavour(['cream', 'sugar', 'vanilla'], 1);
    a.name = 'PLAIN VANILLA';
    const b = G.mixFlavour(['milk', 'sugar', 'cocoa'], 2);
    b.name = 'PLAIN CHOCOLATE';
    return [a, b];
  }

  function freshState() {
    const fl = starterFlavours();
    return {
      money: 40, moneyShown: 40, day: 1,
      shelf: { cream: 3, milk: 3, sugar: 4, vanilla: 2, cocoa: 2 },   // ingredient counts
      flavours: fl,                                   // invented recipes
      batches: [{ fid: fl[0].id, qty: 12 }],          // churned, waiting in the cold room
      pits: [{ fid: fl[0].id, qty: 12, max: 12 }],    // loaded on the line
      sauces: ['fudge'],
      tops: ['sprinkles'],
      owned: [],                                      // armoury + shop + lab upgrades
      allies: [],
      tier: 0,                                        // clause.ai plan
      calls: 4,                                       // help left today
      suspicion: 0,                                   // 0..1; the occupation notices
      freed: 0,                                       // people helped
      muted: false,
      tut: 0,                                         // tutorial step
      seen: [],                                       // fault ids logged
      hist: [],                                       // closing net per shift, for the trend
      crew: [],                                       // people, cats and dogs you got out
      chapters: [],                                   // story beats already played
      spotted: 0, missed: 0,                          // disguises found and let through
      tips: 0,                                        // what the cat brought in
      totBots: 0, totFixed: 0, totMisdx: 0, totVolt: 0,
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
          if (!G.state.flavours || !G.state.flavours.length) G.state.flavours = starterFlavours();
          if (!G.state.pits || !G.state.pits.length)
            G.state.pits = [{ fid: G.state.flavours[0].id, qty: 12, max: 12 }];
          for (const k of ['crew', 'chapters', 'hist']) if (!G.state[k]) G.state[k] = [];
          for (const k of ['spotted', 'missed', 'tips']) if (G.state[k] === undefined) G.state[k] = 0;
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

  G.flavById = function (id) {
    return (G.state.flavours || []).find((f) => f.id === id) || null;
  };
  // day.js and the lab both need "what is actually in this pit"
  G.pitFlav = function (i) {
    const p = G.state.pits[i];
    return p ? G.flavById(p.fid) : null;
  };

  G.newDayStats = function () {
    G.state.calls = G.tier().calls;
    G.state.today = { dayEarn: 0, nightEarn: 0, served: 0, perfect: 0, volt: 0,
                      jobs: [], misdx: 0, fixed: 0, spent: 0, demand: {},
                      goal: G.rollGoal(G.state.day), closed: false, tips: 0,
                      spotted: 0, missed: 0, queue: 0 };
    // how many walk in before the shutters come down
    G.state.today.queue = G.state.today.goal.quota + 2;
  };
  // patience multiplier from upgrades and crew
  G.patienceMul = function () {
    let m = 1;
    if (G.has('patience')) m *= 1.4;
    if (G.hasPerk('p_watch')) m *= 1.1;
    return m;
  };

  // rolling demand: what the district is asking for today
  G.rollDemand = function () {
    const d = {};
    const pool = ['sweet', 'rich', 'bitter', 'cold', 'arom', 'salty', 'sour', 'grit'];
    const shuffled = pool.slice().sort(() => Math.random() - 0.5);
    d.hot = shuffled[0];
    d.cool = shuffled[1];
    d.crowd = G.pick(BOTS).id;
    return d;
  };
})();

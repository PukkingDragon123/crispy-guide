# 🐊 DOUBLE LIFE

**Sell the sugar. Bill for the damage.**

A chunky pixel-art simulator at **320×180**. By day you run a grimy ice cream
counter under a leaking sewer ceiling, carving scoops out of layered steel pints
for a queue of amphibians and reptiles. By night you are the only dentist in
town, and every patient in your chair is a customer you poisoned that afternoon.

![Title](screenshots/title.png)

**▶ Play it:** open `index.html` in a browser. No build, no dependencies, no
assets — every sprite, sound and note is generated in code.

---

## ☀️ The parlour

![The counter](screenshots/day.png)

A close two-shot: your pints on the left, your customer's enormous open mouth on
the right, and a rusty sewer wall behind you both with pipes, a floor grate,
drips and flies. Drag the floor to pan the counter over to the syrup bar.

### Scooping

![Scooping](screenshots/scooping.png)

Pints are **big rectangular tubs sliced into flavour strata, and every stratum is
labelled right on the ice cream** — you can always see which band is which
flavour. There are no meters and no timing windows:

- **Press the band you want and hold.** The scoop digs in, a ball swells inside
  the bowl, crumbs fly and the pitch rises until it comes free with a pop.
- The tub visibly craters where you dug, and **stays** cratered for the shift.
- **Carry the ball over and set it on the cone.** A dashed seat shows where it
  lands; on release it squashes, settles and names itself.

Scoops are round, hard-shaded balls — five flat tones taken off the sphere normal
against one top-left key light, a square specular, drip lobes hanging off the
lower rim and a churned ridge across the face. Waffle cones taper to a point with
a lattice cut across them.

Stack up to three, drizzle syrup whose droplets genuinely land, cling, run around
the curve of a scoop and drip off the bottom, then shake a jar of grit that
bounces and sticks where it falls. Serve.

### Eating

![Eating](screenshots/eating.png)

Serve it and you watch them eat it. The cone comes up in a chunky mitt into the
corner of a mouth that chomps at 3.4 Hz — wide open through most of the cycle,
snapping shut on each bite. Whole scoops stay whole; the one being eaten shrinks
bite by bite while crumbs spray. Every gram of sugar is logged against tonight.

## 🌙 The clinic

![The clinic](screenshots/clinic.png)

One hard lamp, eleven teeth filling the whole frame, and the kids from this
afternoon staring down at you over their own gums.

### You must name the disease before you may cut

![The notebook](screenshots/notebook.png)

Probe a tooth to examine it, then open the **notebook** and match what you can see
against the diagnosis list. Get it right and the tooth is charted and its
procedure unlocks. Get it wrong and the patient jolts and the book stays open.
Nothing can be treated until it is charted — identifying the disease is the whole
puzzle.

Eight findings, each with its own look and its own ordered fix:

| Finding | Presents as | Procedure |
|---|---|---|
| **Caries** | Black pit in the crown | Drill → fill |
| **Tartar** | Crusted yellow-green buildup | Scale |
| **Abscess** | Swollen bulge, pus head | Lance → suction |
| **Fracture** | Jagged crack, sharp edges | Bond |
| **Impaction** | Tilted, crowding its neighbour | Extract → suction |
| **Necrosis** | Grey-dead, dark core | Drill → clear → seal |
| **Foreign body** | Something wedged in the gap | Forceps |
| **Gingivitis** | Gum weeping blood | Scale → suction |

### The instruments just work

Once a tooth is charted, its procedure runs on feel, not on timing. Hold the
instrument and it happens, with one honest progress bar and a lot of feedback:

- **Drill** — hold on the lesion until the decay is bored out. No nerve to hit.
- **Scaler** — drag over the crust and it flakes off in chips.
- **Scalpel** — put the blade on the swelling and it opens.
- **Elevator** — hold and waggle; the tooth wobbles further each time and then
  comes out with a crack, a gush and a dark bleeding socket.
- **Forceps** — grip the wedged object and pull away.
- **Filler** — hold to pack the hole full.
- **Suction** — blood pools, stains and runs down the teeth, and it stays there.
  The field must be clear before you can discharge.

There is an **OUCH** readout that rises while you work and settles on its own. It
is there for the wince, not to punish you — nothing in the clinic can cost you a
case.

## 🛒 The stockroom

![Stockroom](screenshots/stockroom.png)

Pan a back room under one swinging bulb. Everything for sale is a physical object
on a shelf with a name plate and a price tag: a chest freezer of pints, a rack of
syrups, jars of grit, and a steel cabinet of clinic upgrades (Carbide Burr,
Surgeon Loupe, Steady Claw, Sedative Gas). Richer flavours mean sweeter orders,
which means worse teeth, which means better nights.

## The cast

Twelve amphibians and reptiles, all dressed and all built out of hard-edged
boxel volumes. Every face is a big rounded skull slab with:

- **Big cartoon eyes** — a quantised round ball in a hard black rim, a fat
  coloured iris, a slit pupil for the reptiles and a fat dot for the amphibians,
  one square catch-light, working lids and brows that go angry, worried or sick.
  They stay legible from 6 px to 26 px.
- **A mouth that really opens** — the jaw drops in front of the chest, framed in
  hard black, with an upper tooth row, a domed tongue with a median furrow, a
  darkening throat and a lower tooth row on the jaw lip.
- **Real cloth** — waistcoats, dungarees with straps, hoodies, jerseys, lab
  coats, aprons and scarves, each with a wrapped collar, set-in shoulder seams,
  fabric folds and a hem shadow. Hats and glasses on top.
- **Per-species build** — width, height, snout length, eye size and jaw throw all
  vary, so the cast rigs to genuinely different sizes.

Bullfrog · cane toad · tree frog · axolotl · fire newt · pit viper · python ·
gecko · iguana · gator kid · snapper · salamander. You are the crocodile, and
what you show of yourself is a small chunky mitt holding the tool.

## Tech

- **320×180** canvas, nearest-neighbour upscaled; every shape is scanline
  `fillRect` work so the pixels stay hard
- Flat-shaded "boxel" language: 3–5 tones per material, hard light and shadow
  bands, 1 px black outlines, no dithered gradients pretending to be soft
- Round things are quantised per scanline with real terminators and rim light —
  never flat discs, never rounded squares standing in for balls
- Characters are a procedural rig: skull, eye sockets, snout, jaw, chest, then
  cloth, then accessories. Limbs fill from a densified spine as a single span
  per scanline, so they read as tubes rather than strings of spheres
- Layered pints with a live dig surface and on-band flavour labels
- Custom 5×7 bitmap font
- All audio synthesised with WebAudio: wet squelches, bone cracks, drill whine,
  suction, screams, and two sequenced tracks
- Droplet, particle, gore and carve simulation, not canned animation
- Save via `localStorage`; mouse and touch

Made with Claude Code.

# 🍦 DOUBLE LIFE

**They took the world. You have gelato.**

A zero-dependency pixel-art game at **1280×720**. You are a **mascot**: a big
cream head with two dot eyes and one smile behind a pair of black shades, ears
that hang, a slim body with the BIG MOO roundel on the chest, a flower lei, and
long legs with daylight between them. For six years you were the face of BIG
MOO, a beachfront burger chain with a cow on the sign, open twenty-four hours.

Then a patrol machine walked in through the front door, put **six rounds** into
you, and left a charge under the counter. Your legs still work. Almost nothing
else does. You came back on four hours later in the wreck, on your front,
dragging yourself over what used to be the car park, looking for anybody at all.

An old woman called **Tracy**, who has been making gelato since before machines
could hold a scoop, found you with a torch and dragged you a mile and a half
home through the rain without once putting you down. Then she opened your chest
panel, propped a cracked tablet on the bench, and let the thing living on it
talk you through repairing your own board. Then she taught you the only thing
worth knowing. Then a patrol came through *her* door at four in the morning and
took everyone on the street.

**So now you serve them something laced. Their systems fail. You bill them to
put it right. And you watch the queue, because some of what walks in is not a
machine at all — and every one of those you get out is one they do not.**

![Title](screenshots/title.png)

**▶ Play it:** open `index.html` in a browser. No build step, no dependencies,
no asset files — every sprite, sound and note is generated in code.

The menu carries your save, and two logs it opens once you have earned them:

![Quests](screenshots/quests.png)

**QUESTS** — twelve of them, and none was asked of you. Each one is a thing the
shop actually needs, they pay on completion, and the panel settles up any you
finished without noticing.

![The story](screenshots/storylog.png)

**THE STORY** — every chapter you have seen, and any of them replayable.

![Secrets](screenshots/secrets.png)

**SECRETS** — nine of them. Nobody tells you about these; the ones you have not
found show you where to look, which is more than the game gives you anywhere
else.

---

## 🪶 It is a good deal easier than it was

Every number below moved in the same direction, for the same reason: this is a
game about scooping ice cream for a robot and having a small cry on a bench,
and none of it was improved by being difficult.

| | Was | Is |
|---|---|---|
| Clean-scoop window | 0.76 – 1.16 | **0.66 – 1.34** |
| Slop starts at | 1.42 | **1.72** |
| How long they queue | 42 | **64** |
| Quota, day *n* | 3 + 0.7*n*, up to 9 | **2 + 0.45*n*, up to 7** |
| Take, day *n* | 40 + 26*n* | **30 + 16*n*** |
| Repair hold target | 18 units | **26 units** |
| Repair hold speed | 1.6 s | **1.05 s** |
| Repair sweep brush | 14 units | **20 units** |
| Winding | 10 radians | **6 radians** |
| First misdiagnosis | costs you | **free, and warns you** |
| Torque band | 0.30 wide | **0.52 wide**, needle 25% slower |
| Pressure band | 0.30 wide | **0.52 wide**, needle 25% slower |
| Walking speed | 46 / s | **62 / s** |

The two bench bands are now **one constant each**, read by the test *and* by
the gauge that paints it, so the green stripe can never claim a window the code
does not honour.

Nothing was removed to do this. Every fault is still one of the five gestures,
every scoop is still a sweep you have to feel, and the one thing you are still
expected to find for yourself — the tell on a machine that is not a machine —
is untouched.

---

## 🕹️ The prologue is a place, not a picture

The first act of this game used to be nine cutscene shots and a two-mile
crawl — a camera looking at things while you waited. It is now **two rooms you
walk around in**. Tap where you want to go and the mascot walks there. Tap the
green pin over something and it walks over and uses it.

Everything in them runs off `stage.js`: a floor line, a scrolling camera, a
cast of people each running their own **script of intentions**, places you can
walk up to and use, speech bubbles over the right heads, and beats that fire
when you get there.

### Nothing tells you what to do. The room shows you

There used to be a green banner nailed across the top of the screen with
`SAY HELLO TO TABLE FOUR` in it, and it stayed there until you did. A
permanent instruction over a room built to be looked at, in a game whose
whole first act is *go and look at this place before it stops existing*.

The banner now **says its piece and leaves** — 3.4 seconds up, 0.7 fading
out — and the job of pointing is handed to a **quest marker**, in three parts:

- **A pin in the air**, hanging with its point on the thing. A disc with a hole
  punched through it and a spike under it, bobbing. `G.questPin()` in `util.js`.
- **A ring pulsing on the floor** underneath it, flat and in perspective, where
  you have to stand.
- **An arrow on the frame edge** when the thing is off screen, bright at the tip
  and dark at the base, so it points instead of just sitting there.

**No text on any of them** unless you point at one, and then it is the thing's
name and nothing else.

### Two things it was, before it was that

It was a **green banner** pinned to the top of the frame reading
`SAY HELLO TO TABLE FOUR`, which is a quest log bolted over a restaurant: it
never says *where* table four is, and once you have read it it just sits there.

Then it was a **line of your own hoof prints** walking away from you across the
floor toward whatever was live — in the world, at the scale of the room, and on
a two-tone checker floor, eight small green marks scattered over the tiles read
as litter. That went too.

It never printed a distance. The first pass did: `348M`, which is the width of
the room in logical units with a unit stuck on the end of it.

![The floor of BIG MOO](screenshots/floor.png)

**ACT ONE — the floor.** Mid-shift at a burger chain with a cow on the sign.
There is a **birthday party in the second booth**, a couple eating in the
first, two staff behind the counter, a queue that forms and clears, and a kid
who will not sit down.

![The brand mark](screenshots/bigmoo-logo.png)

The sign is a real one. `G.mooLogo()` draws **one brand mark** — a red enamel
disc with a highlight arc on the rim, a cream field, the cow in shades, and
`BIG MOO` under it with `SINCE 1971` below that when there is room — and it
sizes itself down the way a real mark does: wordmark and date at 26 units,
wordmark alone at 19, just the cow's head at 13 and under. It is the sign on
the post at the kerb, the roundel on the menu board, the badge on your chest
and the roundel on the wall, and it used to be **three different cows drawn by
hand in three different files**.

The room is **two planes deep**: the counter, the booths and the staff stand on
a back floor eighteen units further away, so you walk *in front* of the
furniture instead of standing in it, and anyone sat in a booth is cut off at
the chest by the bench in front of them — which is what sitting down looks
like from the side.

![Table four](screenshots/floor-party.png)

Four jobs, in order, each gated behind the last. **Say hello to table four.**

> **BESSIE:** WHO IS FOUR TODAY, THEN?
> **A CHILD:** MOO! MOO! MOO!

![The stage](screenshots/floor-stage.png)

**Get up on the stage and do the dance.** Control is taken off you for three
seconds, you wave, the whole table points at once, and it is handed back.

![The counter](screenshots/floor-counter.png)

**Collect table four's order** — the staff member you walk up to reaches under
the counter and hands you two swirls, which you then carry, in both hands,
until you put them down.

> **SAM:** TWO SWIRLS. MIND THE STEP ON YOUR WAY OVER.

![The door](screenshots/floor-door.png)

**Take them over.** And when you do, the door comes off its hinges. Everybody
in the room recoils on the same frame — mouths open, arms out, the whole room
at once. The glass goes out in thirty pieces on thirty different arcs.
Something rolls in through the hole where the door was, steps down out of the
back of the room into the lane you walk in, and brings a gun with it.

> **PATROL:** CIVIL PATTERN. NOBODY MOVE.

![The aim](screenshots/floor-aim.png)

The child who has spent the whole shift running the length of the room stops
running. A dashed red line crawls out of the barrel, finds them, and settles.
The dot sits on their chest and pulses. Nobody in the room is going to do
anything about it.

> **PATROL:** THAT ONE IS NOT ON THE ROLL.

### The only thing in this game you have to be quick about

Then it gives you the floor back.

![Get in front of them](screenshots/floor-window.png)

**GET IN FRONT OF THEM.** A bar runs down at the top of the screen, you move
almost twice as fast as you have all shift, and there is a marker on the boards
between the child and the barrel. You have four and a half seconds.

**It cannot be failed.** If the bar empties while you are still stood by the
booth, you go anyway — the same jump, from wherever you were standing, because
that was always what you were going to do. Getting there yourself just means
you got there yourself.

![The shot](screenshots/floor-shot.png)

You jump. You land between them. And then it does not stop.

**Six rounds.** Not one shot and a leg cartwheeling across the room — a burst,
the first one hard and the rest arriving 0.34 seconds apart, and every one of
them **stays**. Each round punches a hole where it landed, and the hole is
still there in the next frame, and the one after that, and in every scene for
the rest of the night: a black bore, torn shell round the rim, a glow on the
two freshest ones and something venting out of the bottom of each.

Your legs are fine. That is the point. Nothing that happens to you here can be
fixed by bolting on a spare.

Three things happen at once as the count climbs, all of them driven off
`hits.length / 6`:

| | |
|---|---|
| **You** | knocked back further each round, damage ramping to full, and on the last one you go down on your front |
| **The room** | the colour drains out of it, 0.52 of `#241018` over everything and a hard vignette closing in from four sides — it used to stay bright pink and cheerful all the way through, which is a tonal problem you can see from the back of the room |
| **The floor** | goes quiet. Every bubble in the room is cleared on the first round and nobody starts another one |

> **BESSIE:** I'M — I'M STILL UNDER WARRA—
> **A CHILD:** IT MOVED. IT MOVED FOR ME.

And then you crawl. On your front, holes and all — and because the body is now
long and low rather than tall, the wounds **swap axes**: how high a round landed
on your chest is how far forward it is on the floor. Mapped straight down both
axes instead, all six packed into one twelve-by-six box and read as a single
black smudge.

Everybody who can run runs. A small box with a red light on it goes under the
counter, and the thing that put it there walks back out through the hole it
made.

> **PATROL:** CLEAR THE FLOOR.

### And then the camera leaves the room

![The car park](screenshots/bomb-out.png)

Act one used to end on a darken and a whiteout from *inside*, which is a fade
with a bang on it. The camera now goes out into the **car park** and watches
the front of the building come off.

BIG MOO on its corner in the rain: the lit fascia, four glass bays with people
still moving behind them, the patrol vehicle parked across the entrance with
its light bar going, and the mascot sign on its post at the kerb. People going
the other way, fast. A red light counting behind the glass.

![The blast](screenshots/bomb-blast.png)

Then the front goes. The bays blow one after another, left to right; **a
shockwave** that races out ahead of the fire and flattens the rain, which is the
thing that actually tells you how big this was; a hard fireball core out of the
doorway that **shrinks instead of growing**, because a ninety-percent-alpha
ellipse over the whole frame is a sepia filter with sparks in it; sixty pieces
of glass, masonry, fascia and brick on their own arcs with gravity on them;
embers going up; smoke rolling out along the tarmac; and the sign snapping off
its post and going end over end out of frame.

*(`G.fe` takes **radii**. The fireball passed it `R*k*2`, which is a diameter,
so every band came out twice the size it was written for and filled the frame
corner to corner — the one shot in the game whose entire job is to show you the
front of a building coming off, and you could not see the building.)*

### It also used to cost 38 milliseconds a frame

The budget at 60fps is 16.7. The bomb's opening shot was measured at **38.15**,
and the cause was not the fire: it was `cut()`, the function that stamps a
character silhouette. Every call cleared a full 480×480 native scratch buffer,
hardened its alpha by compositing it over itself **five** times, and blitted the
whole thing — and the car-park shot draws twelve people in the windows and five
running for the road, every frame.

Two changes, measured after each:

| | ms/frame |
|---|---|
| Before | **38.15** |
| Clip every buffer operation to the figure's own box, and harden three times instead of five | **32.0** |
| Cache the stamp: background figures re-render at 6fps, keyed on pose, scale, colour, direction and hat | **7.09** |

With the shockwave added back on top, the worst shot in the sequence now runs
at **9.23 ms**. The cache holds 220 stamps and evicts oldest-first.

### She does not leave you there

![She drags you home](screenshots/drag-home.png)

Act two used to end on her finding you and then a cut to a bench. **You see the
mile and a half now** — three shots of it.

She gets her arms under you and lifts, and you are dead weight. Then the street
**scrolls past you** rather than the camera panning, so the distance is
something happening to you rather than a camera move: terraced fronts, two lit
windows in a hundred, lamps, wet road, rain, and you tipped back on the tarmac
with a smear behind you all the way to the edge of frame. Then her door, and
the light out of her front room onto the wet, which is the first warm thing in
twenty minutes.

> **TRACY:** COME ON. COME ON, YOU GREAT LUMP. UP.
> **A MILE AND A HALF, AND SHE NEVER PUTS YOU DOWN.**
> **TRACY:** MIND THE STEP. THERE. YOU ARE IN.

![Nobody came back](screenshots/bomb-sign.png)

Afterwards, still outside: fire in the four window holes — **tongues**, narrow
and tapered and a different height every frame, not the banded rows that read
as sand dunes — black smoke off the roof, rubble across the car park, and one
shoe. Then a push in on the sign, face up in a puddle, cracked across, with
one of its eyes lit by the building.

> **ELEVEN SECONDS, AND A BIRTHDAY IN IT.**
> **NOBODY CAME BACK FOR THE COW.**

---

## 🗣️ Everybody has a name and a mouth

The dialogue used to be half-size text in a small white box. It is now **full
size**, wrapped to the width of the bubble by `G.wrap`, with a **name tab**
hanging off the top corner in the speaker's own colour — so you can read a
line from across the room and you always know who said it.

**One line on screen at a time.** Three hundred and twenty units across and a
hundred and eighty down does not hold two bubbles: the second one ends up
under the objective plate with its name tab buried, so a new line replaces the
old one. The bubble pops in on a **back-out curve** — up past where it lands,
then down onto it — and its tail is a **tapering stalk that reaches the head
of whoever is talking**, however far up the bubble had to be pushed to stay
clear of the chrome.

And they talk **unprompted**. Every actor in act one carries a name and a pool
of things they say:

> **SAM:** THE SHAKE MACHINE IS DOWN. THE SHAKE MACHINE IS ALWAYS DOWN.
> **DEREK:** I HAVE HAD THE SAME THING EVERY FRIDAY FOR ELEVEN YEARS.
> **MUM:** DO NOT CLIMB ON THE COW.
> **A MAN IN A COAT:** IS THE COW REAL.

While you walk around, the room picks somebody **within forty-six units of
you** who has not spoken for a while, hops them, and gives them a line off
their own pool — then waits two and a half to five seconds and does it again.
Walk from one end of the floor to the other and you get a different four
lines every time, and each of them is somebody's, not the room's.

### And now you can just go and ask them

![Click to talk](screenshots/talk.png)

That was the whole of it: the cast talked *at* you on a timer and there was
nothing you could do about it either way. **Tap anybody and they will talk to
you.** You walk over, they turn round, they hop, and they say the next line
they have not used yet — so the cast is something you can *work through*
rather than something that occasionally shouts as you pass.

Everybody with something to say wears a **little speech mark** over their
head: outlined at full strength whatever else is going on, filled brighter
when you are near them, and with their **name on a tab** when the pointer is
on them. A green pin over a live spot suppresses the speech mark under it
— a pin and a bubble on the same head is two calls to action fighting over
eleven pixels, and the spot is the plot while the person is the joke.

The line along the bottom of the screen says what the pointer is actually on:

> TAP A MAN IN A COAT TO TALK

---

## 🍮 The bounce

Nothing in a walkable scene moves at a constant velocity any more.

- **A squash spring.** `S.sq` is a real spring — a stiffness, a damping and a
  velocity. It kicks negative when you leave the mark (stretch) and slams
  positive when you arrive (squash). The barrel torso reads it, and so do the
  legs, so the whole body compresses together instead of the belly giving
  while the feet stay bolted down.
- **A hop in the walk.** Every step lifts you off the floor by a couple of
  units, and the landing adds a dip on top of it.
- **Dust.** Five puffs where you land, and one at every footfall on the way.
- **Pops.** `S.pop` throws `ring`, `star`, `dust` and `bit` — the last one is
  confetti, with gravity and a tumble on it. `S.bang` fires a burst and shakes
  the camera; `S.cheer` makes a list of people jump.
- **A plate that arrives.** The objective drops in on a back-out curve and
  flashes for nine tenths of a second every time it changes.
- **People who notice you.** An actor within fifty-two units turns their head
  toward you, and their pupils track you inside it.

Every job on the floor now ends in something: saying hello sets the whole
booth cheering, the dance drops confetti, collecting the order rings the
counter bell, handing it over pops five stars and a **3 / 4** over your head.

### One thing that does nothing at all

- **Your own bell.** Tap yourself, above the waist, and you ring the bell on
  your collar. Rings go out, stars come off it, the whole room hops, and
  somebody says **MOO** or **AGAIN**. It is repeatable. It is worth nothing.

There used to be a mop bucket and a wet floor sign down at the end of the
counter, and walking into them put you on your back. They are gone. The floor
you walk in act one is now clear from the booths to the door — nothing to
trip over, nothing between you and the last twelve seconds of the shift.

---


## 🧱 Act two: the wreck

![The wreck](screenshots/wreck.png)

The same building, four hours later. The wall is still standing — burnt
blockwork with the top taken off it, four window holes punched through, the
fascia still there in patches — and the roof is on the floor. Two fires still
going. Rain, embers on the wind, and puddles holding the firelight.

You come to **on your front in the ruins**, with six cold holes in you and a
drag smear behind you, and the first thing the scene asks you to do is get out
from under what is left of the building. You move at about half speed, because
you are pulling yourself along with your hands.

![The long walk](screenshots/wreck-find.png)

**There is nothing out here to collect.** There used to be: five objects laid
along the apron with a glow on each — a paper crown, a tray from table four,
one shoe, a badge with the name burnt off, a radio still on — and an objective
that counted them off, **FIND ANYBODY · 0 / 5**. It turned the worst night of
this machine's life into a shopping list, and it is gone.

What is left is **a long walk east** and whatever you say to yourself on the
way, because there is nobody else to say it to.

> **BESSIE:** HELLO?
> **BESSIE:** THIS IS FINE. THIS IS ALL FINE.
> **BESSIE:** SAM? KEV?

![The torch](screenshots/wreck-tracy.png)

Get far enough down the road and **something turns onto it carrying a light**.
She walks to you, you walk to her, and she gets down onto the rubble to reach
it — which at her age is a decision.

> **TRACY:** OH, YOU POOR ARTICLE. YOU ARE THE COW OFF THE SIGN.
> **TRACY:** RIGHT. HOME. I HAVE GOT A CRATE OF LEGS AND NOTHING ON TONIGHT.

---

## 📏 One scale for the whole game

![One scale](screenshots/scale.png)

Everything used to be sized by eye. That is why a counter came up to a grown
woman's shoulder in one room and to her knee in another, and why a customer
stood next to the mascot at half its height.

So there is a table now, and one rule: **an adult is 52 logical units head to
heel at draw scale 1.0, standing on the floor line.** A door is 78, because
you should be able to walk through it. A counter top is 22, because that is
waist high. A table is 20, a booth back is 32, a seat pad is 12.

In a walkable scene **everybody is drawn at 1.0** and the room is built around
them. The mascot comes out at 52 as well, because a mascot is a person in a
suit.

---

## 🍨 Tracy

![Tracy](screenshots/tracy-model.png)

Seventy-odd, four foot eleven in her shoes, a silver set she does the front of
herself, half-moons worn down the nose on a beaded chain, and an apron she has
been making gelato in since before machines could hold a scoop. She is built on
exactly the same rig as everybody else in the game — same skeleton, same clips —
with her own clothes layered over the top through two hooks, so she stands in
the same world as the crowd rather than beside it.

She turns up at the end of act two with a torch, and she is the one who walks
to *you*.

---

## 🔌 Three faults, and clause reading them out

![The board](screenshots/circuit.png)

She puts you under the good lamp, opens your chest panel and props a cracked
tablet against the counter. **The tablet does the talking.** She has never seen
a board like yours in her life; the thing living on the tablet has seen
thousands.

### This scene *is* the workshop

Not a version of it. Not a simplified one for beginners. `js/fix.js` is 136
lines and **every one of its methods either sets the scene up or gets out of the
way**:

```js
Object.setPrototypeOf(tut, G.scenes.night);
Object.setPrototypeOf(this, tut);
```

The tutorial delegates to the night workshop through the prototype chain. Same
neural system, same three tools, same five gestures, same target rings, same
progress bar, same sign line, same tray. If the workshop changes, this changes
with it, because there is only one of it.

Four things differ, and they are the four the fiction needs:

| | |
|---|---|
| The machine on the bench | is **you** — one job, id `player`, name `YOU` |
| The room | is her front room, dimmed, drawn by the same `G.tracyRoom()` painter as everything else that happens in it |
| The faults | come pre-**named**, because you cannot read the manual yet. Clause reads them out |
| The money | is not there. Nobody is paying you, and there is no `$40` on the board |

Three faults, and they are three real entries out of the neural system's own
table — the same three you will be billing machines for by the end of the week:

> **CLAUSE:** THE DARK ONE IS DEAD. TAKE THE PATCH AND HOLD IT ON.
> **CLAUSE:** THOSE TWO ARE CROSSED. PROBE BOTH ENDS, THEN PATCH.
> **CLAUSE:** THE CORE IS CHASING ITS TAIL. HOLD THE RESET ON IT.
> **CLAUSE:** THAT IS THE BOARD. YOU ARE A MECHANIC NOW.

**Nothing here can be failed.** The tools are the right tools, the faults are
already diagnosed, and the manual gate is open.

### What it replaced, and why

A leg-fitting minigame. 788 lines, six stages, six verbs — `seat`, `lines`,
`bolts`, `prime`, `power`, `toes` — **every one of them invented for this scene
and never seen again**. Twenty minutes of tutorial that taught you nothing about
the game you were about to play, because the game you were about to play is a
repair bench with five gestures on it. You learned to plug a hydraulic lead into
a loom box exactly once, and then the credits could have rolled.

### The bottom of the frame holds one voice at a time

The first pass put **five layers of instruction across the bottom of the
screen** simultaneously: the workshop's sign line, a redundant tip printed under
it, the workshop's own `3 FAULTS IN THE NEURAL` plate, clause's bubble, and a
line reading `SHE IS WATCHING YOU DO IT` — with the tray underneath all of it
and clause's strip sitting on top of the tools it was telling you to pick up.

Now: the **sign line** carries the gesture (`HOLD ON THE NODE TO REGROW IT`),
clause's strip sits in the band between the sign and the tray and holds it
alone, and every line it says is short enough to stay **one line**, because a
two-line bubble grows upward into the sign band and covers the very hint it is
telling you to read.

---

## 🏠 Her front room, which she calls the shop

![Tracy's front room](screenshots/tracy-room.png)

Mint and cream stripes, a rose border, bunting she put up when you woke up and
never took down, five jars in colours she chose to look at rather than to sell,
two photographs of a shop that is not there any more, a cat asleep on the warm
end of the counter, and a tub of gelato with `GELATO DELLA CASA` chalked on the
board.

### She has more plants than she has room for

Four of them, and they are built rather than stamped:

- **A big one in the corner under the lamp**, six paddle leaves fanning out of a
  terracotta pot with a heart painted on the rim. A leaf is rows of pixels
  stacked upward from the stem, drifting sideways as they climb and fattest past
  the middle, with a midrib down it and the light on the fat side. **All the
  outlines go down first and the fill comes after** — do it row by row and every
  row's black lands on the row below it. Its pot is behind the counter, so you
  only ever see the top half of it, which is how a plant that size looks in a
  room that small.
- **A macramé hanger** in the corner by the window, three cords off the ceiling
  with beads on them, two sprigs standing out of the pot and everything else
  falling out of it.
- **Something trailing off the end of the jar shelf**, as there always is.
- **Geraniums in the window box**, which were always there.

A trailing runner is one continuous stem that sags and sways, with a leaf out to
**alternate sides on its own little stalk**. Sat tight against the stem they
merge into a lumpy green column and the whole thing reads as a bead curtain.

And around them: a **clock she winds on Sundays**, with hands that keep real
time and stop at 4:41 when they come through the door; **three postcards** taped
under it from people who got out; **a sampler in a hoop**, half finished, as it
has been for years; a jam jar of **daisies** on the gingham; her **mug**, still
steaming; her **knitting**, which is going to be a scarf, she says; and a folded
**blanket** under the cat, which is the only reason it is allowed up there.

Every one of them has a wrecked state. The clock cracks and stops. A postcard
comes off the wall. The hoop goes off its nail. The jar goes over and the water
runs across the counter. The wool unravels the length of it.

*(The room costs 6.4 ms a frame to draw, up from 5.2 before the greenery.)*

**One painter draws this room in every state the story needs it in** —
`G.tracyRoom(g, t, o)`, with `dark`, `wrecked`, `doorOff` and a `back` hook for
anybody standing behind the counter. So the warm version and the wrecked
version cannot drift apart, because they are the same function.

It also has **a front door** now. It never did: the room simply had no way in,
which is fine for a tutorial and useless the moment somebody has to come
through it. Panelled, with a bit of glass, a sign turned round to `CLOSED`
hours ago, and a brass shop bell on a curl of wire over the top.

### The break-in is not a cutscene any more

It used to be six shots of a **brown workshop that appears nowhere else in the
game** — a second, worse copy of her room, built by a different file, in
different colours. Both are gone. The raid happens **here**, in the room you
have been standing in for the whole lesson, straight after you hand her the
cone, with no cut and no camera move.

Nine beats:

| | |
|---|---|
| `quiet` | *"Sit yourself down. I'll put the kettle on and we'll do sauces."* |
| `bang` | Three bangs on the door. The bell goes each time. The lamps go down. |
| `hide` | **"Get behind the counter. Go on. Now, love."** — and this beat waits for you |
| `door` | It comes off its hinges and across the room, with the glass |
| `in` | Two machines walk in, torches sweeping. *"Nobody is on the roll at this address."* |
| `her` | She puts herself between them and the counter |
| `white` | One white frame |
| `gone` | *"They did not arrest anyone."* |
| `out` | *"The tablet was still warm."* |

### And you have to go and hide

There is a missing board at the far end of the counter, and the dark under it.
It is scenery for the entire lesson, and then it is the only thing in the room
that matters. When she tells you to hide it gets **the loudest mark the game
owns** — brackets, a name tab reading `GET UNDER HERE`, and two rings running
outward — and you tap it.

The view goes with you. The near edge of the counter rises across the bottom of
the frame, the room darkens and a hard vignette closes in, and **your own head
comes up over the lip**: both eyes, both ears, watching. She goes round the
counter to meet them, on the back plane, where the counter cuts her off at the
knee — the same two-plane trick the walkable scenes use, so she is *in* the room
rather than in front of it.

Nothing here can be failed either. If you sit there being told to hide for
thirteen seconds, she picks you up and puts you in the gap herself.

![The room afterwards](screenshots/raid.png)

Afterwards the room is the same room, wrecked: the shelf down, three jars on
the counter, a pane out of the window, the tub over on its side with its hoops
and staves showing, the cones out, the bunting hanging off one end, her pot
plant flat and its soil across the counter, the clock stopped, the tea over. The cat comes back. And on the
counter where she was standing: **her cardigan, and her glasses.**

---

### Every shape in a cutscene is a real character

![Silhouettes](screenshots/silhouettes.png)

A cutscene silhouette used to be six rectangles stacked into a person
shape — a rounded head-and-shoulders, a body, two arms, two legs. At a
glance it passes. Next to a game full of procedurally generated people
with genomes and nervous habits, it is a cardboard cutout, and the cast in
a cutscene stops being the cast.

So a silhouette is now **the actual sprite**. It is drawn into a scratch
buffer, the buffer's alpha is hardened by compositing it over itself five
times — the rig lays glows down with `globalAlpha` and a mask taken
straight off that comes back with a halo round everybody — and then it is
flooded with one colour through `source-in`, which keeps the fill only
where there were pixels.

A rim light is the same mask again, stamped one pixel toward the light in a
brighter colour and then covered by the dark one, so the edge that
survives is the character's own profile — a hood stays a hood, which a
hand-drawn bar down the side never does.

Whatever the rig draws, the silhouette is exactly that: the right hair,
the right coat, the right hat, the right number of legs. The people in the
windows of BIG MOO minutes before it goes are twelve different people, one
of them a four-year-old in a paper crown, and the two running out of the
door as the counter starts counting are a grown adult carrying a child.

![The chip](screenshots/chip.png)

The tablet was still warm. Clause's housing had eleven minutes left and your
head had a slot, so you pulled its core out and put it in your own, and closed
the panel.

**Seven chapters** after that, and they move when the world does rather than on a
timer: the first person you get out, her recipes running again, the first patrol
that parks outside and does not order anything, the back room with chairs in it,
and the same patrol coming back.

![A chapter](screenshots/cine-chapter.png)

The seven mid-game chapters are still cutscenes — they are short, and they are
somebody else's news broadcast rather than your shift. Same set the whole way
through: the ident, the clock, the scanlines, the roll bar and the lower third.
The camera pans and pushes and nothing rotates, so every scanline stays a
scanline. Everybody in them is drawn at the same scale as everybody else now,
which they were not.

---

## ☀️ The floor

![Opening up](screenshots/opening-up.png)

Every shift starts with the shutter. It rattles up slat by slat, dust comes off
it, the sign flickers on, warm light spills under the bottom rail onto the pits,
and whoever was already waiting outside is standing there when it clears. At the
close it rolls back down.

![The café](screenshots/cafe.png)

One narrow room, and it looks like a room: tiled to shoulder height, a run of
pipe with a drip coming off it, an extraction fan, a bare bulb on a cable, a
first-aid box, grime in the corners and flies that will not leave.

### What can I touch?

![The marks](screenshots/marks.png)

Two base stands, six sauce bottles, four topping jars, five pits and a cat, and
**every one of them used to be an invisible rectangle**. They all did
something and none of them said so, and a player who has not read the source
has no way to find that out except by tapping the whole screen.

There is now one mark for *everything you can touch*, in every scene — and it
is the **same pin** the walkable rooms hang over an objective, at a third the
size, so one mark means one thing everywhere in the game:

| | |
|---|---|
| **Resting** | a small pin, in the thing's own colour, hanging over it and breathing |
| **Pointed at** | brackets round the thing and its **name** on a tab |

The back room drew its own chevron for four versions, which meant two different
marks for one idea. It draws `G.questPin` now, like everything else.

It does **not** light everything at once, which would just be a wall of pips.
It lights **the step you are on** — a base, then a scoop, then whatever you
want on top — so the marks double as the recipe, and the line along the bottom
of the screen names the same step in words:

> TAKE A CONE OR A CUP → PRESS A PIT AND SWEEP → SAUCE AND TOPS, THEN SERVE

The one thing it will not point at is **the tell on a disguise**. That is the
only thing in the game you are meant to spot for yourself.

Along the top: **today's goal**. A row of pips for the quota, a bar for the
take, both filling as you work, plus the heat on you and a tally of who you have
got out. Miss the quota and the district notices a café that is not really a
café.

### The pits

You start with **one pit** and can build up to **five**. A pit is one flavour,
**lying flat**, so you scoop it the way a real one is scooped — **top down**.

![Scooping](screenshots/scooping.png)

Every pit surface is a live **heightfield**, lit by its own slope, so a furrow
you dug an hour ago is still there in the light.

- **Press in and sweep.** The fill rate rises the further you drag, so a long
  confident arc beats a jab.
- **Stop in the green.** Under-filled reads `OK`, in the window `PERFECT`, past
  it collapses into `SLOP`.
- **Let go on a cone, a cup, or the machine's own intake.**

![Carrying](screenshots/carry.png)

![Jelly](screenshots/jelly.png)

A scoop is not a hard ball — it is a **set jelly**. Seven tone bands off a
plumped superellipse with a wrap term, so the terminator is a gradient rather
than a cliff. A long soft sheen laid along the shoulder with a hot core inside
it. A **subsurface rim** where light comes through the far side, so the shaded
edge is brighter than the middle. Drips that grow out of the ball through a
pinched neck into a bead about to let go. And it wobbles when it lands and never
quite stops.

### The tip jar

![The cat](screenshots/tipjar.png)

Buy the **TIP JAR CAT** and a cat-shaped machine somebody left behind sits on
your counter. Pet it. It purrs, its whiskers twitch, purr rings come off it,
coins stack up behind the slot window, and the customers put money in because
they cannot work out why they want to. Add the **CATNIP TIN** and it doubles.

### Some of them are not machines

![Spotting a tell](screenshots/spotting.png)

People are hiding inside stolen shells, because the alternative is being
processed. Cats and dogs are hiding because a human hid them — rarer, and worth
more, because nobody else is looking for them.

They always leak something. **Seven tells**, each one or two native pixels of
wrongness on a body full of right pixels:

| Tell | What you're looking at |
|---|---|
| **A tail** | Something swishing under the chassis |
| **Hair** | A strand caught in the head seam |
| **An ear** | The head plate being pushed up from inside |
| **Breath** | It is fogging its own intake |
| **A paw** | That is not a gripper |
| **A real eye** | One optic has a wet pupil |
| **A heartbeat** | The chest panel is ticking wrong |

Click the tell and the shell comes apart.

![A rescue](screenshots/rescue.png)

They get a name, a perk, and a photo on the wall in the back room. Serve one
without noticing and you fed a person a scoop of iron filings — that goes in the
books too, under LET THROUGH.

Buy the **UV LAMP** and a tell glows faintly. Buy the **BONE SCANNER** and
clause.ai names it out loud and flies over to point at it.

### Closing

![Shutters down](screenshots/shift-over.png)

When the queue is done the shutters come down and you get the day scored:
served, take, tips, rescued, let through. **Only then does the back room
open** — the floor is the floor, and you work it until it closes.

---

## ⏳ The card between two places

![Loading](screenshots/card-clause.png)

Every scene change goes through a card, and the card used to show one of
four stock icons picked off a regex against the label: a scoop, a door, a
hand, a starburst.

It is now **clause**, every time. It flies in from the left on an arc,
trailing ten sparks that fade behind it, spins its rays up, throws two
rings out from itself like a heartbeat, and blinks three dots underneath
because it is thinking about it.

![A new day](screenshots/card-day.png)

Unless a day is starting. Then it is a **sunrise**: a disc coming up over
a horizon line with twelve rays turning around it, and a clock beside it
with its hands coming round to opening time.

---

## 🚪 The back room

![The back room](screenshots/backroom.png)

Not a menu. A room, wider than the screen, that you walk. Tap the floor and you
go there; tap a machine and you walk to it and use it. Breeze block, damp bloom,
strip lights that flicker, a drain, shelving stacked with stock crates, a
defaced recruitment poster, a tool board, a mop in a bucket.

**Every live station is marked** — a pin just above it, hanging where the
thing actually is rather than in a tidy row along the ceiling, plus a ring
pulsing on the floor at its feet so you can see how far off you are. It used
to mark only the station you were *already standing at*, which tells you
nothing you did not know: a room wider than the screen with no signposts is a
room you find by walking into things.

**Six things to stand at:**

| Station | What it does |
|---|---|
| **The stairs** | Back up to the floor |
| **The terminal** | Order stock — 30 ingredients, four aisles |
| **The mixer** | Four hoppers into a drum: invent a flavour |
| **The cold room** | Load churned batches onto the line for tomorrow |
| **The wall** | Everyone you got out, pinned up with string |
| **The stairwell** | Down to the bench, where tonight's jobs are |

![The terminal](screenshots/terminal.png)
![The mixer](screenshots/mixer.png)

The mixer read-out shows what comes out before you commit: the blended colour
pushed toward saturation, the properties that survived, and a **generated name**
taken from whatever shouts loudest — `VELVET CHURN`, `GRAVEL SLAB`, `MAGNET
SWIRL`.

![The cold room](screenshots/coldroom.png)

The cold room holds every batch with its quantity. Tap a batch, tap a pit, and
it loads. **This is how you open tomorrow.**

![The wall](screenshots/crewwall.png)

And the wall is the only thing in this city getting fuller.

![The stairwell](screenshots/stairwell.png)

---

## 🌙 The bench

![The workshop](screenshots/workshop.png)

You broke them. Now bill them. Every job is a machine you served that
afternoon, and **which system you are opening depends on what it is**: a steel
bench scored by years of this, an inspection lamp with a cage on it, the chassis
opened up with its fasteners lying loose beside it.

Eight systems, each a hand-built interior with its own three tools and three
faults:

| System | Inside it | Tools |
|---|---|---|
| **Hydraulic** | Pressure lines and a reservoir | Bleed · clamp · purge |
| **Clockwork** | Gear trains and a mainspring | Tweezers · winder · lube |
| **Boiler** | A burner and a heat exchanger | Descaler · vent · igniter |
| **Acoustic** | A resonator and tensioned strings | Tuner · resin · pick |
| **Neural** | A lattice of nodes and links | Probe · patch · reset |
| **Optical** | A lens stack and mirrors | Polish · align · iris key |
| **Servo** | Motor stacks, belts and encoders | Tension · rewind · calibrate |
| **Armour** | Plate, bolts and weld | Press · bolt · weld |

![Clockwork](screenshots/clockwork.png)
![Optical](screenshots/optical.png)

### Read it, name it, then fix it

![The manual](screenshots/manual.png)

Each fault shows a symptom in plain words — *a bubble stalled in the line*, *the
mainspring has run down*, *a plate has folded inward* — and the manual offers
**three candidates**. Only three, ever.

**Twenty-four faults, and every repair is one of five honest gestures:**
**hold** the tool on the part (12), **sweep** it across (6), **wind** it in
circles (5), **click** exactly on the thing (4), **drag** it out (4). No timing
windows, no rhythm games.

### And it shows you where the tool goes

![Where the tool goes](screenshots/where.png)

Picking the right tool told you *which* tool and then left you to find the
joint. Three identical joints on three identical pipes, one of them leaking,
and the only way to find out which was to drag the cursor over the machine
until something crunched.

Every gesture already knew the point it was testing against; nothing ever drew
it. Now **a ring goes round every live target** the moment you are holding the
right tool — the leaking joint, all six patches of crust, the four pegs, the
one loose bolt — and it says what to do with it: `HOLD` over a hold, three
marks orbiting a wind, an arrow off the side of a drag.

**Naming a fault is a reading test, not a reflex test**, so it stopped
charging you for the first miss. One wrong answer is free and just says
*warmer*; after two the manual marks the right line **THIS ONE** in green. A
reading test you cannot pass is a wall, not a puzzle.

---

## 🤖 clause.ai

The assistant she left running. A coral **starburst** that **flies** — it hangs
in its corner until it has something to say, then crosses the room, hovers over
the thing it is talking about and points at it with a dotted lead.

It talks constantly, and it complains:

> *I RAN THE NUMBERS. THEY WERE NOT ENCOURAGING.*
> *SHE USED TO HUM WHILE SHE WORKED. YOU DO NOT.*
> *THAT WAS NOT A SCOOP. THAT WAS AN INCIDENT.*
> *I HAVE BEEN AWAKE FOR NINE HUNDRED DAYS. NO NOTES.*

It also **watches**, and says something when it matters: a pit about to run dry,
nothing loaded at all, heat climbing, one more to hit quota, a machine losing
patience, and — the useful one — *look again, something on that one is wrong*.

### Tap it to ask it

![Ask clause](screenshots/ask-clause.png)

There are no ask buttons on the tray. You tap clause and its options rise out of
the corner — and **only the ones you have actually unlocked appear at all**,
because a greyed-out button is a promise nobody made you.

| Ask | What you get |
|---|---|
| **READ THEM** | The machine's name, craving, hatred and its line |
| **PICK A PIT** | Which pit best matches whoever is at the counter, with the % |
| **LOOK AGAIN** | It names the tell and flies over to point at it |
| **THE DISTRICT** | What the district is chasing today, and what nobody wants |
| **A RECIPE** | The best mix your shelf can actually make |
| **RESTOCK** | It fills the shelf for you |

The same rule runs everywhere: no cup stand until day two, no bin until there is
something in it, no back-room door until the shutter is down, no mixer until you
have two things on the shelf, no wall until somebody is on it.

![The books](screenshots/books.png)

At the end of every shift it closes the books — served, counter, workshop, stock
spent, volt served, jobs fixed, misdiagnoses, heat, net — beside a **shift-net
trend** going back eight shifts. How much of that you get to see depends on what
you are paying it.

| Plan | Price | Calls/day | What it unlocks |
|---|---|---|---|
| **FREE** | — | 4 | Walks you through the job, takes ingredient orders |
| **HOBBY** | $150 | 8 | Reads a customer before it orders, flags what it hates |
| **PRO** | $420 | 16 | Daily demand trends, end-of-day breakdown |
| **SCALE** | $900 | 32 | Suggests recipes from your shelf, forecasts volt and heat |
| **ENTERPRISE** | $1800 | 99 | Restocks the shelf on its own, full analytics, no limits |

---

## 🔧 The armoury

![The armoury](screenshots/armoury.png)

A lock-up racked with crates. Four tabs, paged.

**UPGRADES** — the 2nd through 5th pit, the chiller coil, the heavy ladle, the
twin churn, the assay bench, and the new ones:

| Upgrade | What it does |
|---|---|
| **LONGER LEASH** | Machines wait 40% longer |
| **JUKEBOX** | Music on the floor: better tips |
| **TIP JAR CAT** | A cat robot on the counter. Pet it. |
| **CATNIP TIN** | The cat purrs harder. Tips double. |
| **PIGGY BANK** | Keep 10% of the take overnight |
| **NEON SIGN** | One more machine through the door |
| **UV LAMP** | A disguise tell faintly glows |
| **BONE SCANNER** | clause names the tell out loud |
| **DOOR BELL** | You hear them coming sooner |
| **STRIPED AWNING** | It looks like a real shop |
| **TWO STOOLS** | They wait longer sitting down |
| **BETTER EXTRACT** | No more flies |
| **SPRINKLE GUN** | Toppings land where you aim |
| **TWIN SCOOP** | Two balls in one sweep |
| **DEEP FREEZE** | Pits hold 24 scoops |
| **HONEST LEDGER** | See every price before you buy |
| **CENTRIFUGE** | Mix five ingredients at once |
| **FIELD COOLER** | Batches keep overnight |
| **TOOL ROLL** | Repairs go 25% faster |
| **DECOY SHELL** | One missed disguise costs nothing |

![Arms](screenshots/arms.png)

**ARMS** — the EMP baton and rail spike raise what the resistance pays for
repairs, the signal jammer bleeds off heat, the virus darts halve illegal stock.

![Crew](screenshots/crew.png)

**CREW** — six machines you turned, bought. The people, cats and dogs are not
for sale: you find those.

**CLAUSE** — the plans above. Then `OPEN TOMORROW`, and any chapter that has
come true plays before the doors open.

---

## 🤖 Everything that is not you

![The cast](screenshots/bots.png)

Eighteen archetypes come out of one frame descriptor — `{base, torso, head,
arms, prop, emblem}` plus proportions — and for a long time every one of them
came out looking like a filing cabinet.

That was not a colour problem. It was a **shape** problem, and it was the same
shape eighteen times: a thirty-by-thirty slab with a grille cut in it, a small
head perched on the corner of it, five little grey plates stacked in a column
for each arm, and two posts with flat pads for legs. Recolouring a filing
cabinet gets you a second filing cabinet. So:

### The shell is a curve now, not a box

Every chassis is a **solid of revolution** — a half-width as a function of how
far down it you are — and the profile table *is* the cast:

```js
const PROFILE = {
  slab:    (p) => 1.0 - Math.pow(p, 2.2) * 0.3 + Math.sin(p * 3.14) * 0.06,
  boxy:    (p) => 0.88 + Math.sin(p * 3.14) * 0.16 - Math.pow(p, 3) * 0.16,
  robe:    (p) => 0.6 + Math.pow(p, 1.7) * 0.62,        // shoulders into a skirt
  violin:  (p) => 0.62 + Math.sin(p * 6.28 - 1.57) * 0.3,  // two bulges, a waist
  drum:    (p) => 0.72 + Math.sin(p * 3.14) * 0.28,
  // ...
};
```

Read that as a row of silhouettes with every colour switched off and you can
still tell the siege unit from the priest. That is the job colour was failing
to do.

### Head-forward, like everything else in the game

The mascot and the people are drawn at cartoon proportions — a big head on a
short body — and the machines were not. Torso heights came down from 24–32
units to **17–21**, head scale went up from 0.74–1.06 to **1.18–1.32**, and the
head became the biggest single mass on the machine.

### An arm has four parts, and they are the parts an arm has

A ball in the shoulder, a tapering upper arm, a ball at the elbow, a tapering
forearm, and a **mitten** — the same mitten the mascot has, so the whole cast
came out of one box of parts. Legs got the same treatment: a hip ball, a thigh,
a knee ball, a shin and a **boot with a toe cap**. The arms also stopped being
painted in the flat accent colour, which on a near-black chassis is a pair of
pale bars stood next to the body rather than part of it.

### The eyes were the worst of it

![Optics](screenshots/bots-eyes.png)

The optic was a camera lens drawn in full: a screwed bezel, a saturated iris
filling three quarters of the glass, a white pupil in the middle of *that*,
eight radial spokes, a scan line and a hard glow. At eight pixels across all of
it collapses into **one bright saturated donut with a hole in it** — which
reads as an inflamed eye, not as a thing that is looking at you. Eighteen of
them is a shooting gallery.

It is now the same three marks the cow has and the people have: **a dark round,
one white pip, and the unit's colour as a single crescent of bounce light along
the bottom of the pupil** — the way a dark eye catches a room. The colour it
lost lives in the status pip and the chest, where it belongs.

### A face needs something to read against

Half these chassis are near-black, and two dark eyes on a dark skull is a hole
with a hat on it. So every face now gets an **inset panel** a couple of steps
off the shell — *recessed* on a light chassis, **lifted** on a dark one, chosen
off the chassis luminance — and the eyes and the mouth have a value to sit on
whatever colour the unit came out of the factory.

Along the way: the plinth became a **hover skirt** with a downdraft that stirs
the dust, because a plinth under a robot reads as a museum exhibit; the wheel
became a **tyre with tread on it and three spokes that turn** instead of a grey
ball with four dots; the clerk's spectacles became a **rim and a glint** rather
than two pale discs over two dark optics, which is a blindfold; the magistrate
got a **jabot**, because a near-black robe on a dark set is a hole in the
picture; and the fat one stopped being a rowing boat.

The mascot's own path — the hoof chassis, the milk tank, the scoop arms, the
cow skull, the dot eyes — is untouched by all of it. It took eleven versions to
get her right and none of this was allowed near her.

---

## 🧬 One model

There used to be three cows. The rig drew one, the wasteland hand-drew its own
head and torso because the player is legless out there, and two cutscene
close-ups drew a third. Every time the face changed, two of them silently
stopped matching.

Now there is one. `drawBot` took a **crawl mode**: no legs, a torn hip that
sparks, and both hands placed by the caller — so the site passes in the positions
its physics produced and gets back the same cow the shop sells gelato with, same
head, same badge, same bell. The cutscenes pass nothing special at all.

It also took a **`legOff` mode** — one leg gone, a torn skirt of plate and a
severed loom arcing where it used to bolt on — and a **`spare` flag** off the
save. Neither fires in the prologue any more: the patrol puts six rounds into
your **body**, your legs stay on, and what you carry out of BIG MOO is damage
rather than a missing part.

**And the proportions are a costume's.** The head is half again the size it was,
the arms are cream instead of steel and the feet are far too big. It is not a
machine that happens to look friendly; it is somebody in a suit, which is what a
mascot is.

### It was a barrel with a cow balanced on it

The body was `w 1.04` against a head of `hs 1.36`: a **35-unit torso under a
32-unit head**, bulging outward on a single sine curve so the widest row was
level with the shoulders. Two 7-wide legs stood 4 units apart underneath it.
That silhouette is a filing cabinet on castors, and no amount of detail on top
fixes it.

| | Was | Is |
|---|---|---|
| Torso width | 35 | **22** — narrower than the head, which is 30 |
| Torso profile | one sine bulge | **a taper**: neck, out to the shoulders, in to a waist, no hip flare |
| Torso height | 18 | **16** |
| Legs | 7 wide, 15 long, 4 apart | **6 wide, 18 long, 14 apart** |
| Arms | 4.6 wide, to mid-body | **3.4 wide, to the hip**, and a tone darker than the body |
| Head | 32 × 19, ears out sideways at eye level | **30 × 19, ears narrow and long, pinned below the eyeline so they hang** |

It still totals **52 units head to heel**, which is `G.SZ.MASCOT`, which is an
adult — the budget just went into legs instead of belly. The first pass at this
forgot that and came out 63 units tall, standing a head over everybody in the
room.

Two more things that only showed up once it was slim. The **arms are drawn in
the same cream as the body over the body**, so at the same tone they merged into
one wide mass and the waist counted for nothing; they are a shade darker now.
And a cream body with a badge on it is a fridge, so the suit got **one black
patch, on the hip** — one, because a 22-by-16 chest with a roundel on it has
room for exactly one marking and a second lands under the lei.

### One necklace

The collar and the cowbell went round the same neck as the lei, and on a chest
this short the bell hung straight down through the middle of the flowers and out
the other side into the badge. **The lei is the necklace now** — seven small
blooms on a short string at the throat, rather than eleven big ones across the
whole chest — and the bell comes back off the beach.

The legs took two goes. Stubby ones came out as a **pair of dark blocks side by
side**, which does not read as legs — it reads as a filing cabinet with a cow
on top. So the leg got its structure back, in four parts: a long **cream
shank** with a soft crease where the knee is, a fat **white boot cuff** that
overhangs the shank, a short **black stocking** under it, and a **split hoof**
wider than the leg it is on. The dark is now clearly a boot with a sock above
it, and the gap between the two legs is wide enough to see the floor through.

The badge went the same way, and it is now **one function for the whole brand**:
`G.mooLogo(g, cx, cy, r, o)`. Big shapes only — ears, horn nubs, a skull, shades
above eleven units of radius, and a **pink muzzle in its own colour** with two
nostrils, because a muzzle painted the same cream as the field behind it is not
a muzzle, it is a hole in the badge. Everything drops out as the radius falls:
nostrils, then the shades, then the wordmark, then the date.

The wordmark is sized to the **cream field with two units of margin either
side**. Sized to the disc instead it filled the field edge to edge, and at
thirteen units the small cut crossed onto the red rim.

---

## 🧍 The people

![The people](screenshots/folk.png)

Humans used to be one sprite with a recoloured coat. Now a **seed becomes a
person**: height, girth, skull shape, nose, eye size and spacing, brow angle,
ear size, hair style and colour, facial hair, glasses, freckles, blush, what
they are wearing on top and underneath, how big their shoes are, whether they
have a belly, whether they stoop — and **one nervous habit they cannot help
doing**.

The same seed always gives you the same person, so the woman at the end of the
counter is the same woman in the next shot.

The proportions are deliberately wrong. The head is a third of the body, the
shoes are far too big, the arms are noodles and the torso is short. That is what
makes a cartoon read as a cartoon rather than as a short adult.

**And they are made of the same stuff the cow is.** Everything the mascot is
built from has five things going on: a hard black outline, a base tone, a **lit
crown** across the top, a **shaded belly** across the bottom, a rim down each
edge and one short specular streak on the light shoulder. People used to be a
flat fill with a single bright row, which is exactly why they read as cardboard
standing next to it. Now every torso, limb, hand, shoe and skull goes through
the same five-tone treatment — and so do the cats and the dogs.

**Same eyes, too.** The cow's face is three marks: a one-pixel light ring, a
dark round, a white pip. So that is what everybody has now — bigger than
before, because bigger is cuter — with a second dim catch-light in the larger
ones, a lid with a lash under it when they blink, and a thin brow set well
clear of the eye only on the faces whose genome asked for one. Glasses are a
**rim and a glint**, never a filled pane, because a pane over a dark round is
just a smudge.

The detail that came with it: collars that cast a shadow on the chest, hems on
every garment, cuffs exactly where the sleeve stops, scarves with a tail and
a fringe, shoes with a toe cap and a lace and a white sole, a chin shadow, and
two-tone blush. Half of them are **carrying something** — a bag, a paper cup, a
cone, a phone, a lolly, a balloon on a string, an umbrella, or a wrapped bunch
of flowers.

**The habit** is a small pose the clip system knows nothing about, added on top
of an idle so a room of people is never a row of statues doing the same breath.
Most of them are periodic bursts rather than constant motion: one rocks on the
spot, one scratches the back of its head every nine seconds or so, one checks a
wrist, one bounces, one cranes to see past whoever is in front. Everybody also
gets a phase offset and a speed multiplier, so a crowd never walks in lockstep.

**And they have somewhere to be.** In a walkable scene every person runs a
**script of intentions** that loops: walk to the counter, wait, order, walk to
a booth, sit down, talk, get up, leave. Staff stay behind the counter. Children
run. Nobody stands in the middle of the floor doing nothing, which is the thing
that makes a set look like a set.

### Coarser, and drawn with a fatter pen

People used to be drawn on the **quarter-unit** grid — one native pixel — the
same grid the cow's rivets and seams are on. At that resolution a human is a
smooth, slightly soft thing standing next to a mascot built out of chunky
plates, and the two do not look like they come from the same box of crayons.

So the whole of `folk.js` was moved down one tier. Every rectangle a person is
made of now goes through a single snapper —

```js
const GR = 0.5;                                  // the grid: two native pixels
const q = (v) => Math.round(v / GR) * GR;
function R(g, x, y, w, h, c) {
  const x0 = q(x), y0 = q(y);
  G.Rh(g, x0, y0, Math.max(GR, q(x + w) - x0), Math.max(GR, q(y + h) - y0), c);
}
```

— and there are **174 call sites**, so there is no back door. Limbs step in
half-units. Outlines are half-units, which is **two native pixels of black**
instead of one. Hems, stitches, rims and catch-lights are all half-unit blocks
with half-unit minimums, so nothing can quietly shrink back to a hairline.

The result is bigger pixels, blunter edges and a heavier black line around
everybody — the same drawing, done with a fatter pen, at the weight the mascot
was already drawn at.

Everything is still drawn row by row with **outlines in one pass and fills in
the second**. Do it per row and each row's outline paints over the last row's
fill and the whole person turns into a black blob. That mistake has been made
in this repository three times.

---

## 🎬 The performance

![Clips](screenshots/clips.png)

Everything in this game used to stand still and wait for the text to finish
typing. `anim.js` is the layer that fixes that.

A **clip** is a named piece of acting. Ask for one and you get back a **pose**: a
bag of offsets that the draw code applies to the parts it was already drawing.
Nothing in the animation layer draws anything itself, so any character — a
nineteen-part machine, a human, a dog — can be given a walk, a gesture or a
reaction without touching its sprite code.

`idle` · `walk` · `run` · `talk` · `reach` · `take` · `point` · `startle` ·
`slump` · `wave`

![One stride](screenshots/stride.png)

The rules the whole thing obeys:

- **legs and arms are always in opposition** — contralateral gait, the thing that
  separates walking from waddling
- **the body bobs at twice the stride**, because you rise on each step
- **weight leads**: the torso leans into the direction of travel
- **nothing is ever perfectly still** — idle still breathes and blinks
- a blink is a tenth of a second, on a schedule you cannot predict

Humans got rebuilt around it: hips, two legs with a knee that bends on the back
leg, a torso that leans and squashes on the breath, two arms with elbows whose
*hands* go where the clip says — which is the only way a reach or a point reads
at all — and a head that turns, tilts, blinks and talks. The dogs and cats got a
diagonal gait, so the near fore and the far hind swing together. The machines got
bob, lean, sway and arm swing, plus a mouth that opens on the beat.

And a clip can cross-fade into another one, so a shot can hand a character from
`walk` to `take` without a cut.

---

## The cast

Eighteen archetypes plus you, and the **silhouette comes from the job**. The
siege unit rolls on hazard-striped tread and carries a cannon with a muzzle
brake. The maid is narrow over a pleated skirt. The consumer unit is a riveted
barrel on a fluted plinth with a funnel bolted to its face. The orchestra unit
is a violin body on thin legs with a bow for an arm.

None of it is flat: every plate carries a hot top edge, a panel seam, an edge
catch, fastener rows, louvred vents and edge wear. Every chest is a recessed
housing with radiator fins, a live power bar and a stencilled serial. Every limb
is four parts — pauldron, upper arm, hinged elbow with a pin, forearm — with a
hydraulic piston alongside. Every optic has a machined bezel with a screw ring,
radial iris spokes, a bounce catch-light and a scan line crossing the glass.

![The mascot](screenshots/cow.png)

You are the nineteenth, and you are not built to be liked — you are built to be
**recognised**. It is a mascot, and it is drawn like one: few big shapes, hard
contrast, nothing on the face that is trying to be an instrument.

**The eyes.** Two dots. That is the whole eye.

The version before this one had a pale field, a brow *and* a blush stacked around
each dot, in a head nineteen pixels tall — four value blocks fighting over the
same nine pixels, which is mud, not a face. So it is one dark round, one white
pip, and a single native pixel of light around the edge: invisible on a white
face, just enough to keep the eye from vanishing into a marking.

**The mouth.** One curve. A soft upward arc a few pixels wide, one unit thick,
with a single lighter pixel under it so it sits *in* the snout rather than on it,
and two pixels at the ends that turn up — which is the entire expression. Open,
it becomes one small rounded shape with the corners left in place, so it reads as
an open smile and not a puncture. There used to be a cavity in here with a square
tooth and a tongue in it; none of that survives the fact that the mouth is six
pixels across.

**The snout** is a tone, not a sticker: barely pinker than the face, with no
outline on it at all, and two single pixels for nostrils. Whatever is drawn on
top of it is the only mark down there.

**The patch.** One, on the cheek, never over an eye. A black patch ringing a
black dot merges into one dark mass at game scale, and then the cow has no eyes.
A second patch was tried and dropped: wherever it went it landed on a horn or an
eye, and one marking reads as a hide anyway.

**The horns are nubs** — two rounded ivory domes three pixels high, sitting on
top of the skull. They were tapered spikes leaning outward with a stepped dark
curl between them, which is a goat with a mohawk.

**The ears hang.** A rounded flap that droops down and out with a pink inside and
a cream rim, attached past the edge of the skull so it actually clears it. Before
that they were two-pixel tapers pointing straight out at eye level, which reads
as a fin.

**The badge.** The BIG MOO roundel stamped on the milk tank — the real one, out
of `G.mooLogo()`, at whatever radius fits — so the mark on your chest is the
mark on the sign is the mark on the menu board. Every mascot's badge is the
mascot.

Around it: a **cowbell** on a narrow strap, one broad belt instead of three farm
hoops, two soft mitten arms — one of them bright steel, because it is not yours —
and four stocky legs in black stockings on split hooves, with a tail that keeps
time behind it whether or not anyone is watching.

![The beach mascot](screenshots/mascot-beach.png)

**And it dresses for the beach**, because BIG MOO is a beachfront chain and the
cow on the sign has been wearing shades since 1971. A pair of hard black
sunglasses across the eyes, and a **flower lei** — eleven blooms in six colours,
each one a leaf, an outlined disc and two highlights, hung on a string that dips
across the chest. It sits **below** the collar and the bell, and it is wider than
the torso: level with the collar, the collar and the bell covered all but two
petals of it.

And that is the lot. The apron, the held disher and the hide blobs across the
shoulders were all cut: at this size every extra shape is one the eye has to
resolve before it gets to the face, and the badge is the only thing the chest
needs on it.

`DAIRY UNIT`, filed under `GELATERIA`, and the only thing it ever says is *one
scoop, always one more*.

Eleven of the archetypes carry a lighter version of the same softening — the maid, the chef, the
nurse, the clerk, the courier, the horticultural unit and the rest get the blush
and the brow. The siege unit, the enforcer, the magistrate and the warden do
not.

---

## Tech

- **1280×720** raster, snapped to whole native pixels on upscale
- **Three grids.** Everything is authored in one **320×180 logical** space drawn
  through a 4× transform, so a logical 1 is four hard pixels, and the same
  layout code drives two independent detail tiers over it:
  - **half-units** (`Rh`, `hair`, `vair`, `bevel`, `seam`, `rivet`, `grain`,
    `wear`, `notch`) — 2 native pixels, the structural tier: panel seams, hoop
    bands, plate edges
  - **quarter-units** (`Rq`, `hairq`, `vairq`, `pip`, `bevelq`, `rim`, `dither`,
    `grainq`, `ramp`) — **one native pixel**, the polish tier: specular streaks
    on glass, rim light down a form, catch-lights, honest ordered dithering,
    dust hazes, sky ramps
  Big flat forms, 2px structure, 1px polish — and not a single coordinate in any
  scene had to move to gain it.
- Two type sizes off one 5×7 bitmap face: the standard tier, and a **fine tier**
  at half scale for dense read-outs
- A **cosy layer** over the cold one: wood, cream paper and lamplight for
  anything that is information rather than machinery — warm drop shadows under
  the buttons, a lamp hairline on every lip, panels that look like paper on a
  board, and counter-edge trays instead of steel bars. The cold steel stays where
  it means something, which is inside the machines.
- Flat-shaded "boxel" language: 3–5 tones per material, hard light and shadow
  bands, 1px black outlines, no dithered mush
- **Frame-descriptor characters**: base, torso, head, arms, prop and emblem
  mixed per archetype
- **Sphere-normal scoop shading**; **heightfield pit surfaces** with slope
  lighting
- A shot-based **cutscene camera**: pan and push only, presented as a television
  broadcast — ident, clock, scanlines, roll bar, lower-third captions.
  A shot carries either one narrator line or a **script of timed lines** with
  speakers and name plates, and paint functions are handed a `talking` flag so
  mouths move while their owner is mid-sentence
- A **clip/pose animation layer** (`anim.js`) that no sprite code has to know
  about: ten named clips return pose offsets, and `drawBot`, `drawFolk` and
  Tracy all read the same fields. Contralateral gait, double-frequency bob,
  weight-leading lean, unpredictable blinks, and cross-fades between clips
- A **walkable stage** (`stage.js`): a floor line, a scrolling camera, tap to
  walk, hotspots you walk up to and use, speech bubbles that find the right
  head, a beat timeline that can take control and hand it back, and **two depth
  planes** so furniture on the back floor occludes the people sat behind it
- **A third, coarser tier for people.** `folk.js` draws entirely on the
  **half-unit** grid through its own snapper, with half-unit outlines — two
  native pixels of black — so humans carry the same line weight as the plated
  machines standing next to them
- **Profile-driven machines.** Every robot chassis, and every head that is not
  the cow's, is a solid of revolution off a half-width curve — one table of
  profiles, one shell painter, outline pass then fill pass — instead of a
  rounded box per part. Limbs are ball-joint / taper / ball-joint / taper with
  a mitten or a boot on the end, out of the same four helpers
- **One scale table** (`G.SZ`) that every walkable room is built from: an adult
  is 52 units, a door is 78, a counter top is 22
- A **camera override** on the stage (`S.camAt`): a beat can point the camera
  at a spot instead of at you, and hand it back by setting it to `null`
- A **speed multiplier** on the player (`S.pspeedMul`), so the one moment in
  the game that is timed can move you at nearly twice your walking pace
- **Procedural people** (`folk.js`): a seed becomes a genome — height, girth,
  skull shape, nose, eye size, hair, facial hair, glasses, clothes, shoes, hat,
  what they are carrying, and one nervous habit — and the rig draws it on the
  quarter-unit grid, outlines in one pass and fills in the next. Cartoon
  proportions on purpose: the head is a third of the body and the shoes are
  enormous
- **One material for the whole cast.** Outline, base, lit crown, shaded belly,
  two rims and a specular — the mascot's treatment, applied to every person,
  cat and dog, so nothing in a room is made of different stuff to anything else
- **Dialogue at full size**, wrapped by `G.wrap`, one bubble at a time, with a
  name tab in the speaker's colour and a tail that reaches their head
- **A juice layer in the stage**: a real squash spring that reaches the legs,
  a hop in the walk, footfall dust, four kinds of pop (rings, stars, dust,
  tumbling confetti), camera shake, an objective plate that drops in on a
  back-out curve, actors that hop and track you with their pupils
- All audio synthesised with WebAudio — servo whines, arc zaps, a cat's purr, a
  shell coming off, a shutter rolling, footsteps, and the five-note arpeggio for
  a secret. No sample files.
- A single `unlocked(id)` table drives every hidden control, so the UI can only
  show you what you have
- Save via `localStorage`; mouse and touch

## Layout

```
index.html          canvas + boot
js/util.js          maths, primitives, the half and quarter detail tiers, juice
js/anim.js          the clip/pose animation layer: ten clips, one pose bag
js/folk.js          the people: a genome per seed, and the rig that draws it
js/stage.js         the walkable stage: floor, camera, actors, spots, beats
js/font.js          5×7 bitmap font, standard and fine tiers
js/audio.js         WebAudio synthesis
js/state.js         ingredients, systems, 19 frames, disguises, crew, chapters
js/sprites.js       shared props, cones, cups, city furniture
js/art3.js          walls, conduit, neon, steam
js/robots.js        legacy chassis helpers still used by the city art
js/bots.js          the rig: frames, plate detail, optics and dot eyes,
                    posed creatures, tells, the tip jar cat, goo scoops
js/clause.js        clause.ai — flight, chatter, asks, the books
js/cine.js          the cutscene camera and every story beat
js/acts.js          act one, the floor of BIG MOO; act two, the wreck
js/tracy.js         her front room, and the lesson
js/fix.js           the bench: fitting the leg, six stages
js/day.js           the floor: pits, sweeping, tips, spotting, closing
js/lab.js           the station panels: order, mixer, the line
js/back.js          the back room you walk
js/night.js         the bench: eight systems, 24 faults, five gestures
js/shop.js          the books and the armoury
js/main.js          title, transitions, main loop
```

Made with Claude Code.

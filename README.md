# 🍦 DOUBLE LIFE

**They took the world. You have gelato.**

A zero-dependency pixel-art game at **1280×720**. You are a **mascot**: two dot
eyes, one smile, a cream hide, two black patches, a cowbell and a brand roundel
on the belly. For six years you were the face of BIG MOO, a burger chain with a
cow on the sign, open twenty-four hours.

Then a patrol machine walked in through the front door, shot one of your legs
off and put a charge under the counter. You came back on four hours later in
the wreck, on one leg and a length of scaffold pipe, looking for anybody at
all.

An old woman called **Tracy**, who has been making gelato since before machines
could hold a scoop, found you with a torch, carried you home, bolted a leg out
of a crate marked SPARES onto you and taught you the only thing worth knowing.
Then a patrol came through *her* door at four in the morning and took everyone
on the street.

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
green chevron over something and it walks over and uses it.

Everything in them runs off `stage.js`: a floor line, a scrolling camera, a
cast of people each running their own **script of intentions**, places you can
walk up to and use, speech bubbles over the right heads, and beats that fire
when you get there.

![The floor of BIG MOO](screenshots/floor.png)

**ACT ONE — the floor.** Mid-shift at a burger chain with a cow on the sign.
There is a **birthday party in the second booth**, a couple eating in the
first, two staff behind the counter, a queue that forms and clears, and a kid
who will not sit down.

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

You jump. You land between them. The shot is a white line from the muzzle into
your chest, and then: one frame of flash, your leg leaving on a real arc with
the hoof still on it, a torn socket arcing where it used to bolt on, and a
mascot on the floor with its smile turned upside down for the first time in
the game.

> **BESSIE:** I'M — I'M STILL UNDER WARRA—
> **A CHILD:** IT MOVED. IT MOVED FOR ME.

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

Then the front goes. The bays blow one after another, left to right; a hard
fireball core out of the doorway that **shrinks instead of growing**, because a
ninety-percent-alpha ellipse over the whole frame is a sepia filter with sparks
in it; sixty pieces of glass, masonry, fascia and brick on their own arcs with
gravity on them; embers going up; smoke rolling out along the tarmac; and the
sign snapping off its post and going end over end out of frame.

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
on them. A green chevron over a live spot suppresses the speech mark under it
— a chevron and a bubble on the same head is two calls to action fighting over
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

You are on **one leg and a length of scaffold pipe**, which is why you move at
about half speed and hop when you walk.

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

## 🔩 The crate marked SPARES

She puts you under the good lamp and goes and gets the crate. **Six stages, six
different verbs**, and none of them can be failed permanently — a stripped bolt
is a bolt you do again.

![Seat it](screenshots/bench-seat.png)

**SEAT.** Drag the leg off the rack and into the socket. There is a ghost of
where it goes, a keyway to line up, and it goes home with a clank you can feel.

![Three leads](screenshots/bench-lines.png)

**LINES.** Three leads come out of the new leg — hydraulic, power, signal — and
three ports wait in the loom box bolted to the bench, **and they are not in the
same order**. Every lead is rooted in your leg and its loose end lies lit on the
bench until you pick it up, so the cable is attached to you the whole way across
and sags under its own weight as you move it. Put a lead in the wrong hole and it
says so and springs back.

![Torque](screenshots/bench-bolts.png)

**BOLTS.** Four of them round the collar. Tap one to get the driver on it, then
**hold** — the head turns, the needle climbs — and let go inside the green band.
Let go early and it is not tight. Hold past the end of the gauge and you strip
the thread and start that one again.

**PRIME.** A hydraulic pump, hung on the pegboard right above the leg with its
hose draped down to the joint. Hold to build pressure and release inside the
band, three good strokes, not four — go over the top and the seal blows and that
stroke does not count.

![Toes](screenshots/bench-on.png)

**POWER**, and then **TOES** — three lamps down the hoof light one at a time and
you tap each one as it comes up, because she wants to see it work.

> **TRACY:** THERE. YOU'VE GOT A LEG. TRY NOT TO LOSE THIS ONE.

From here on, **every scene in the game draws that leg** — it is a different
colour to the rest of you and it always will be.

### And it is you on the bench, not a diagram of you

![Crying](screenshots/bench-cry.png)

The whole sequence used to be worked on an abstract plate stencilled
**DAIRY UNIT 4** with a hole cut in it. A diagram of a hip rather than a
hip. It is the whole machine now, sat on the edge of her bench with one
leg gone — and **every coordinate in the minigame is derived from where
the rig actually puts the socket**, rather than chosen by eye, so the
collar she cut is on the hip it came off.

Putting you on the bench at full size meant restaging the bench around
you. The pump went up onto the pegboard and the spare went along to the
clear stretch past the switch, because at this size your new shin lies
straight through where both of them used to stand — the leg was being
drawn correctly and then covered up, toe lamps and all, by a pressure
gauge.

And you are crying about it. A wet lower lid, a track down each cheek,
and a drop that lets go every couple of seconds, each eye on its own
clock. It eases off once the leg is in and stops the moment it works,
which is the only thing in this game that measures how you are doing.

---

## 🏠 Her front room, which she calls the shop

![Tracy's kitchen](screenshots/tracy.png)

Mint and cream stripes, a rose border, bunting on a string that sags properly,
gingham curtains and a box of geraniums in the window, three framed photographs
of a shop that is not there any more, a shelf of jars in colours she chose to
look at rather than to sell, a spider plant she talks to, and a cat asleep on the
warm end of the counter.

It is also the tutorial. One tub of gelato, one cone, one very patient human, and
her AI on a cracked tablet. Every step is gated, so you cannot get it wrong — you
can only not have done it yet. Take a cone. Press into the gelato and sweep,
*don't stab it*. Put it on the cone. Give it here then, she's been up since four.

![The first one](screenshots/tracy-taste.png)

> *OH. OH, THAT'S PROPER. YOU'RE GOING TO BE FINE.*

Poke the tablet and clause introduces itself, badly.

---

## 🚨 Then the door came in

![The raid](screenshots/raid.png)

The raid used to be four still shots: a brown wall, a door plate rotated forty
degrees to say it had fallen, and two machines stood in the room not doing
anything. A door coming in at four in the morning is the loudest thing that
happens in this story and it was quieter than the ice cream lesson.

It is now **six shots, and something moves in every one of them.**

It was a good six weeks — the two of them talking over the bench, steam off two
mugs, four flavours out on the counter, clause chattering on the shelf.

Then **the door comes in on screen**: it swings off its hinges in the frame you
are watching, tumbles across the room, and leaves a black hole with cold blue
light in it and twenty-two splinters on their own arcs. Two shapes step
through, torch beams swinging. The shelf of tubs comes down one tub at a time.
Her tub goes over.

She puts herself between it and you and tells you to get under the bench —
which, four hours and one whole life earlier, is where you learnt to do the
thing you do at the end of act one.

> **TRACY:** GET UNDER THE BENCH. DO NOT COME OUT.

One white frame. Then the same room, with nobody standing in it, her jumper on
the floor where she was, and a mascot still under the bench, not coming out.

> **THEY DID NOT ARREST ANYONE.**

Her front room is built once and drawn in three states — before, during and
after — so it is demonstrably the same room getting wrecked, rather than three
paintings of a similar room.

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

A rim light is the same mask again, stamped one pixel toward whatever is
behind them in a brighter colour and then covered by the dark one, so the
edge that survives is the character's own profile. The two machines in her
doorway are lit cold down their left side because that is where the
doorway is.

Whatever the rig draws, the silhouette is exactly that: the right hair,
the right coat, the right hat, the right number of legs. The two shapes
coming through her door are **the patrol and the warden**, walking, with
their real chassis. The people in the windows of BIG MOO minutes before it
goes are twelve different people, one of them a four-year-old in a paper
crown.

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

There is now one mark for *everything you can touch*, in every scene:

| | |
|---|---|
| **Resting** | a small chevron, in the thing's own colour, breathing over it |
| **Pointed at** | brackets round the thing and its **name** on a tab |

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

**Every live station is marked** — a chevron just above it, hanging where the
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
severed loom arcing where it used to bolt on — which is what the shot in the
opening actually does to you, and a **`spare` flag** that comes off the save, so
from the moment Tracy finishes the fitting, every scene in the game draws the
mismatched leg without being told to.

**And the proportions are a costume's.** The head is half again the size it was,
the body is a third shorter, the arms are cream instead of steel and the feet
are far too big. It is not a machine that happens to look friendly; it is
somebody in a suit, which is what a mascot is.

The legs took two goes. Stubby ones came out as a **pair of dark blocks side by
side**, which does not read as legs — it reads as a filing cabinet with a cow
on top. So the leg got its structure back, in four parts: a long **cream
shank** with a soft crease where the knee is, a fat **white boot cuff** that
overhangs the shank, a short **black stocking** under it, and a **split hoof**
wider than the leg it is on. The dark is now clearly a boot with a sock above
it, and the gap between the two legs is wide enough to see the floor through.

The badge went the same way. A cow's head drawn at seven pixels of radius with
sunglasses on it is four grey pixels fighting for room, so the icon is now big
shapes only — ears, horn nubs, a skull, and a **pink muzzle in its own colour**
with two nostrils, because a muzzle painted the same cream as the field behind
it is not a muzzle, it is a hole in the badge. The eyes drop out entirely once
the roundel is too small to hold them.

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

**The badge.** A red roundel stamped on the milk tank: a cream field with its own
head on it, in black. Every mascot's badge is the mascot.

Around it: a **cowbell** on a narrow strap, one broad belt instead of three farm
hoops, two soft mitten arms — one of them bright steel, because it is not yours —
and four stocky legs in black stockings on split hooves, with a tail that keeps
time behind it whether or not anyone is watching.

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

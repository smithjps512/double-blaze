# Make a clickable prototype in Figma

Step by step. Nothing skipped.

By the end of this you will have a link you can send to anybody, and when they
open it they can tap around your app as if it were real. It is not real. That is
the point of a prototype: **find out whether your idea works before anybody
spends three weeks building it.**

Set aside about forty minutes for your first one. The second one takes ten.

## What you need before you start

- A Figma account. Your school one is fine and it is free.
- **Your team's design brief**, open in another tab. Every frame name and every
  layer name in this guide comes off that page, and if you make them up instead
  your builders cannot find anything.
- No drawing skill whatsoever. Grey boxes are completely acceptable.

> **A note about the pictures below.** They are diagrams, drawn to show you
> where things are and what they do. They are not screenshots, so Figma will not
> look exactly like them, and Figma changes its buttons every few months anyway.
> If something has moved, the *name* of the thing is still right. Search for the
> name.

---

## The whole idea, in one sentence

A prototype is **screens, plus arrows between them.**

That is it. Everything below is just the careful version of those two things.

![The Figma window: the tools along the top, your layers on the left, your screens in the middle, and the panel on the right where a design becomes a prototype.](/build/figma/ui-map.svg)

---

# Part 1: Set the file up

### Step 1. Open a new design file

Go to figma.com and sign in. On your dashboard, click **New design file**. An
empty canvas opens.

### Step 2. Name it immediately

Click the file name at the top (it says *Untitled*) and type your app's name.
Do this now, not later. Four files called *Untitled* is a real problem that
happens to real teams every single time.

### Step 3. Find your bearings

Three areas, and you will use all three:

- **Left:** your layers. Everything you draw appears in this list.
- **Middle:** the canvas. Infinite. You cannot run out of room.
- **Right:** the panel that changes what is selected. It has two tabs at the
  top: **Design** and **Prototype**. Right now you are in Design.

### Step 4. Learn two ways to move around

- **Space bar held down + drag** moves the canvas.
- **Ctrl/Cmd + scroll** zooms.
- **Shift + 1** zooms out to fit everything on screen. Learn this one. You will
  use it forty times an hour.

---

# Part 2: One frame per screen

A **frame** is a screen. This is the single most important idea in this guide,
so here it is as a picture:

![Four screens drawn inside one frame cannot be linked together. Four separate frames can.](/build/figma/frames.svg)

If you draw all four of your screens inside one big frame, Figma has no way to
move between them, because as far as Figma is concerned you have drawn one
screen with a lot on it. Separate frames, or nothing works.

### Step 5. Draw your first frame

Press **F** on your keyboard. That is the Frame tool.

Look at the right panel. It has now filled with a list of sizes: phones,
tablets, laptops. Pick one and click it, and Figma makes a frame that exact
size.

- Building something people use on a phone? Pick a phone size.
- Not sure? Pick a phone size. It is easier to make a phone design bigger later
  than to squeeze a laptop design smaller.

### Step 6. Name it, exactly

Double-click the frame's name (it will say something like *Frame 1*, floating
just above the top-left corner) and type the name from your design brief.

`Cars`. `CarDetail`. `SignIn`. Capital letters and all, exactly as your brief
writes it.

**Why exactly?** Because your builders are creating a file with that name in
Anvil. When they open your design and see `CarDetail`, they know precisely which
of their screens it is. When they see *Frame 7*, they are guessing.

### Step 7. Do it again for every screen in your brief

Press **F**, pick the same size, name it. Repeat.

Lay them out left to right in the order somebody would actually go through them.
Your first screen on the left, the one it leads to next to it, and so on. Your
canvas becomes a map of your app, which is useful before you have drawn a single
button.

### Step 8. Check yourself

Look at the layers list on the left. You should see one entry per screen, all
named properly, matching your design brief. If a name is wrong, fix it now.
Renaming forty layers later is nobody's idea of a good afternoon.

---

# Part 3: Put things on the frames

### Step 9. Draw the boxes

You are not making art yet. You are working out where things go.

- **R** is the rectangle tool. Drag one out.
- **T** is the text tool. Click, then type.
- Drag things around. Figma shows red lines when edges line up.

Make each screen roughly right: a title at the top, a list in the middle, a
button at the bottom. Grey rectangles standing in for pictures are completely
fine.

### Step 10. Name your layers off the design brief

This is the second thing that matters most, and it takes ten seconds per layer.

Double-click a layer's name in the left panel and type its real name:
`btn_back`, `lbl_car_name`, `rp_cars`.

Three reasons, and the third one surprises people:

1. Your builder can find their own component in your design.
2. You can find things yourself when there are sixty layers.
3. **Smart animate**, the good animation later in this guide, works by matching
   layers that have *identical names* in two frames. Named layers get smooth
   animation for free. Layers called *Rectangle 41* get nothing.

### Step 11. Make the buttons look like buttons

A button needs to look pressable, or nobody will press it in your test.

Draw a rectangle, give it a rounded corner (the corner radius box in the Design
panel on the right), put text on it, and make it a colour that stands out from
everything else on the screen.

### Step 12. Use your own real words

Not "Lorem ipsum". Not "Button 1". Not "Item".

Real car names. Real prices. The actual sentence from your user story. Fake
content is always exactly the right length, which hides every layout problem you
have.

---

# Part 4: Turn it into a prototype

This is the part everybody thinks is hard. It is dragging a line.

### Step 13. Switch to the Prototype tab

Select something first, then click **Prototype** at the top of the right panel.

Nothing dramatic happens. But now, when you select a layer, a **small blue
circle** appears on its right-hand edge. That circle is the whole feature.

### Step 14. Drag your first connection

![Select the button, drag from the blue circle on its edge, and drop it on the frame you want to open.](/build/figma/connection.svg)

1. Click your button. Say `btn_back` on the `CarDetail` screen.
2. Hover over the blue circle on its edge. Your cursor changes and a **+**
   appears.
3. **Click the circle and drag.** A line follows your mouse. Designers call it
   a **noodle**, genuinely.
4. **Drop it anywhere on the frame you want to open.** The whole frame lights up
   blue when you are over it.

The noodle stays there as an arrow. You just made your app clickable.

### Step 15. Look at what Figma filled in

A small box appeared. It says something like:

- **On click**
- **Navigate to** → `Cars`
- **Instant**

Figma guessed all three, and its guesses are right almost every time. Here is
what each one is:

![One connection has four settings: what the person does, what the app does, which screen it opens, and how it looks moving.](/build/figma/interaction.svg)

**Leave all four alone for now.** Get every screen connected first. Making it
pretty is Part 6 and it is much less important than it feels.

### Step 16. Connect everything else

Go through your screens and ask, for every single thing that looks tappable:
*if somebody taps this, what should happen?*

- Tapping a car in the list → opens `CarDetail`
- Tapping the back button → goes back to `Cars`
- Tapping *Parts* in the menu → opens `Parts`

Draw a noodle for each one.

If the honest answer is "nothing, yet", that is a real finding. Write it down.
A button that leads nowhere is a hole in your plan, not a hole in your design.

### Step 17. Use Back instead of pointing at a screen

For a back button, there is something better than pointing it at the previous
screen.

Select the button, drag the noodle out and **drop it on empty canvas**. Then in
the box, change the action from *Navigate to* to **Back**.

*Back* means "undo the last move, wherever it came from". So if somebody can
reach `CarDetail` from two different places, one Back button gets them home from
both. Pointing at a specific screen only works from one.

### Step 18. Tell Figma where to start

![The flag marks the screen your prototype opens on. Preview plays it inside the editor; Present plays it full screen in a new tab.](/build/figma/flow-and-play.svg)

Click on empty canvas so nothing is selected, then click your **first** frame,
the one somebody sees when they open your app.

In the Prototype panel on the right, find **Flow starting point** and click the
**+** next to it.

A blue flag appears above your frame saying *Flow 1*. Double-click that name and
call it something real, like `Browse cars`.

**Do not skip this.** Without a starting point, Figma has to guess where to
begin, and it usually guesses wrong.

---

# Part 5: Play it

### Step 19. Preview it while you work

There is a **Preview** option that plays your prototype in a small window
without leaving the editor. Use this constantly. It is a two-second loop: click
around, spot something broken, fix it, click around again.

### Step 20. Present it properly

The **▶ Present** button at the top right opens your prototype full screen in a
new browser tab. This is the version you show people.

Click through it. Every arrow you drew is now a real tap.

### Step 21. Test it on somebody who is not you

This is the actual point of the whole exercise, and most teams skip it.

Find somebody who has not seen your design. Do not explain it. Say **one**
sentence, like "find out how much horsepower the Charger has", and then say
nothing at all and watch what they do.

Where they hesitate is where your design is wrong. Not where they are stupid.
Where your design is wrong. Watching this happen for the first time is genuinely
uncomfortable and it is the most useful ten minutes of the whole project.

### Step 22. Send the link

Hover next to **Flow starting point** in the Prototype panel and click **Copy
link**. That link opens your prototype, playing, for whoever you send it to.

Send it to your teacher. Send it to the people building your app. Send it to
somebody at home.

---

# Part 6: Make it good (only after all of it works)

Everything below is optional. **A prototype where every screen connects and
nothing is animated beats a beautiful one where two buttons do nothing.**

### Animation

Click a connection's arrow to select it, then change the animation:

| Animation | What it looks like | Use it for |
|---|---|---|
| **Instant** | Snaps straight there | Everything, until you have a reason |
| **Dissolve** | Fades across | Changing content in place |
| **Move in / Push** | New screen slides over | Going deeper into something |
| **Smart animate** | Matching layers glide | Two frames that are nearly the same |

**Smart animate** is the impressive one. It works by finding layers with
**exactly the same name** in both frames and animating between wherever they
are. Same name, smooth movement. Different name, no animation. This is the
payoff for Step 10.

### Overlays, for pop-ups

A menu that slides over the screen, or an "are you sure?" box, is an
**overlay**: it appears *on top of* the screen instead of replacing it.

Draw the pop-up as its own small frame off to one side. Then drag a noodle from
the button to it and change the action from *Navigate to* to **Open overlay**.

### Hover states

Change the trigger from *On click* to **While hovering** and the design changes
only while the mouse is over it. Nice on a laptop design. Pointless on a phone
design, because a finger cannot hover.

---

# Questions people ask

The same questions come up in every period. Here they are, with the honest
answers.

### How do I start?

Step 5. Draw one frame with the phone preset, name it after your first screen,
and put the real words from your app on it. Do not start by making it look good.
Start by making it exist. Looking good is Part 6, and it goes much faster once
there is something to make good.

Which screen is first? Whichever one your build cards say a user sees when they
open the app. If your team has not decided, that is a decision for the team, not
for Figma.

### How do I make it look like a real app on my phone?

Real apps are boring in a way that is hard to notice. Almost all of this is
restraint:

- **A phone sized frame.** The preset, not a laptop shape. If it is the wrong
  shape nothing you do afterwards will make it feel like an app.
- **One thing per row, stacked down the page.** Look at any app on your phone:
  a title, then a box, then a button, each the full width. Side by side is for
  two small things, like Cancel and Save.
- **Buttons you could actually tap.** Wide, at least as tall as a fingertip, and
  every button on the app the same height. One button per screen is the one
  that matters, and it gets the colour.
- **One colour, plus grey.** Pick one accent colour. Write down its hex code.
  Use it on the main button and almost nowhere else. Everything else is black,
  white and grey. This one rule is most of what "professional" means.
- **The same spacing everywhere.** Pick a gap, use it between everything.
  Apps look tidy because the gaps match, not because anything in them is fancy.
- **Real words.** Your app's real screen title, real button labels, a real
  example of the thing a user would type. No *Lorem ipsum*, no *Button*.
- **A back button on every screen you can go into.**

That list is also, exactly, what Anvil can build. Pretty and buildable are the
same thing here, and that is not a coincidence: your builders will thank you.

What does not make it look like an app: gradients, shadows on everything,
custom shaped buttons, five colours, five fonts, animations. Those look
impressive in Figma for about a minute and then cannot be built.

### How do I make a button?

Step 11 for the look. Step 14 for making it go somewhere when you tap it. A
button that does not go anywhere is a rectangle.

### How do I make the screen scroll?

Make the frame taller than the phone, so the content runs off the bottom. Then
select the frame, open the Prototype tab, and under **Scroll behavior** set
overflow to **Vertical**. Now when you play it, it scrolls.

Before you do, ask whether the screen really needs to be that long. Anvil stacks
components down the page and scrolls on its own, so a long screen is fine to
build. A screen that scrolls sideways is not, and a screen that needs a lot of
scrolling is often two screens.

### How do I type into a box in my prototype?

You cannot, and it is not you. A Figma prototype is a picture that changes
when you tap it. It does not take typed text.

So do what every designer does: draw the box empty, and draw the same screen
again with the box filled in with an example of what a user would type. Connect
a tap on the empty box to the filled in screen. When somebody plays it, it feels
like typing.

The real typing happens in Anvil, in a TextBox, and your builders get that for
free. Your job is to show what it should look like empty and full. Draw both.

### How do I add a feature?

Check your design brief. If the feature is there, it has a screen and a set of
names, so draw it. If it is not there, it is not in your team's architecture,
and drawing it first is exactly how a design and the code drift apart.

A new feature starts as a user story, in the story studio, then becomes a build
card, then a name in the architecture, then a frame in Figma. Go and talk to
your builders. That is not a delay, it is the process working.

### How do I link Figma to Anvil? Where is the export?

There is no link, no import and no export that does it. People look for the
button for a long time, so hear it once: **the design is instructions for a
person.** Your builder opens your Figma file on one screen and Anvil's designer
on the other, and rebuilds it, component by component, using your layer names
to find their own components.

That is why the names matter so much, and it is why the handoff is a list of
four things rather than a file: hex codes, the sizes that repeat, a picture of
every frame, and the icons on their own. **[Designing for
Anvil](/build/figma.html)** has the handoff, step by step.

### How do I centre text, make something bigger, change a colour...

Ordinary Figma questions. Ask the helper below and it will just tell you. If
you would rather watch, the Figma videos are on **[Things to
watch](/build/watch-list.html)**.

---

# When it goes wrong

Find your problem. Every one of these happens to everybody.

| What is happening | What is actually wrong |
|---|---|
| **I click and nothing happens** | You are in the editor, not playing it. Press ▶ Present. |
| **It still does nothing when playing** | That thing has no noodle on it. Go back and check every button. |
| **I cannot see the blue circle** | You are on the Design tab. Click Prototype. |
| **The noodle will not stick to anything** | You dropped it on a shape instead of a frame. Drop it on the frame itself, when the whole thing goes blue. |
| **My prototype starts on the wrong screen** | No flow starting point, or it is on the wrong frame. Step 18. |
| **Half my screens are missing when I play it** | Nothing links to them. A screen with no arrow pointing at it can never be reached. |
| **My frames are inside each other** | You drew a frame on top of a frame. Drag it out in the layers list on the left. |
| **My back button goes to the wrong place** | Use the **Back** action instead of pointing at a screen. Step 17. |
| **Smart animate does nothing** | The layers have different names in the two frames. Make them identical. |
| **The text is enormous when I play it** | Your frame is a laptop size but you are viewing it on a phone. Check which preset you used. |

---

# Videos

Reading beats watching for the steps. Watching beats reading for the *feel* of
it: where somebody's mouse goes, how fast it is, what it looks like when it
works.

**[Things to watch](/build/watch-list.html)** has the Figma ones, plus the
videos for writing stories and for Anvil, all in one place. Start with *Figma
for Edu: Prototyping 101*, which Figma made for schools.

---

# Before you call it finished

- [ ] One frame per screen, named exactly as your design brief names it
- [ ] Every layer named off the design brief, not *Rectangle 12*
- [ ] Every button that looks tappable has a noodle on it
- [ ] A back button on every screen you can go deeper into
- [ ] A flow starting point on your first screen, with a real name
- [ ] Real words from your own app, no lorem ipsum
- [ ] Played it in Present and clicked every single thing
- [ ] Watched one person who has never seen it try to use it
- [ ] Sent the link to whoever is building it

That last one is the whole job. A prototype nobody tried is a drawing.

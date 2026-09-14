# Start your design with AI, and finish it yourself

No em dashes anywhere in this document or any copy it generates.

Figma can now draw a first version of your app from a description. That is
worth using, because a blank canvas is where most designs die, and a first
version you can argue with is better than a first version you have to summon.

Two things to know before you start, and they are the whole page:

1. **The prompt is your user story.** You have already written the sentence
   that tells a design tool what to draw. Do not write a new one.
2. **What comes back is a starting point, not a design.** It will be pretty and
   it will be wrong in the same four ways every time. Fixing those four things
   is the design work, and it is yours.

---

## Which AI do you have?

Open Figma and look. Your school's plan decides what you see, and the guide
branches on it, so check first rather than hunting for a button that is not
there.

| What you see | What it is | Go to |
|---|---|---|
| A **Make** tab on the home screen, or **Figma Make** in the file menu | A tool that builds a working web page from a prompt | Part A |
| A sparkle icon in the toolbar of a design file, or **First Draft** under Actions | AI inside the design editor: it draws frames on your canvas | Part B |
| Neither | Plain Figma. You are not missing much, and Part C is for you | Part C |

If you are not sure, ask your teacher which plan the class is on. Do not spend
a lesson looking.

---

## Part A: Figma Make

Make builds a real, working web page from a description. It is the most
impressive of the three and the one most likely to lead you astray, because
what it builds is not an Anvil app and never will be. You are using it for the
**look**: the colours, the type, the spacing, the way a screen is arranged.
Everything it does that a screen cannot do in Anvil is paint, not building, and
you will strip it out in Part D.

### 1. Write the prompt from your story

Open your build card. Take the story sentence and the criteria, and put them
into this shape:

```
Design the [screen name] screen of an app called [product name].

The user is [the "as a" part of your story].
They want to [the "I want" part], so that [the "so that" part].

On this screen you can see:
- [criterion 1, in plain words]
- [criterion 2]
- [criterion 3]

Keep it simple: one column, things stacked down the page, real
words not placeholder text. Mobile width. No decoration, no
animation, no illustrations.
```

Two rules for the prompt:

- **One screen per prompt.** Ask for the whole app and you get a landing page
  with a hero, a pricing table and a footer, none of which are in your story.
- **The last paragraph is not optional.** Without it you get gradients, floating
  shapes and buttons that grow when you hover. Every one of those is a thing
  your builder has to leave out later.

### 2. Read what came back against your criteria

Before you touch anything, go down your card's **Done when** list and find each
line on the screen. Every criterion should be visible. Anything on the screen
that is not on your card is decoration the tool added to fill space, and the
next step is to delete it.

### 3. Get it on to a design canvas

Make produces a web page. Your builder needs frames. Use the option to copy the
design to a Figma design file (the wording changes; look for **copy to Figma**
or **open in Design**). Now it is layers you can rename, which is Part D.

---

## Part B: First Draft, inside the design editor

First Draft draws frames directly on your canvas from a description, using
Figma's own component kits. It is closer to what you want than Make, because
the result is already frames and layers.

### 1. The same prompt

Use the prompt shape from Part A, one screen at a time. Add a line at the end:

```
Use a plain, simple kit. No illustrations.
```

First Draft will offer you a choice of kits. Pick the plainest one, usually the
one called something like Basic or Wireframe. The decorated kits look
wonderful and are made of things Anvil does not have.

### 2. Do not let it keep going

First Draft can regenerate, restyle and add screens. Resist. Generate one
screen, check it against your card the way Part A says, then stop and go to
Part D. Regenerating five times to get the perfect first draft is a lesson
gone, and the perfect first draft does not exist.

---

## Part C: Plain Figma, no AI

You are not behind. Every screen in this class is a column of components, and
a column is quick to draw once you stop trying to make the first one beautiful.

1. Draw a frame at phone width (360 wide is fine). Name it after the screen.
2. Down the frame, one under the next, put a rectangle or a text layer for
   every line on your card's **Done when** list. Grey boxes are fine. A grey box
   labelled `btn_save` is a design; a beautiful button called Rectangle 12 is
   not.
3. Turn on **Auto layout** on the frame (select it, then Shift + A). Now the
   boxes stack themselves with even gaps and you never nudge anything again.
4. Go to Part D, which is the same for everybody.

**[Make a clickable prototype in Figma](/build/prototype-steps.html)** has all
of this with pictures if you want the step by step version.

---

## Part D: The four things every AI design gets wrong

This is the part that is the same whichever tool you used, and it is the actual
design work. An AI-started screen is wrong in these four ways every single
time. Fix them in this order.

### 1. It made up numbers and words

*Join 18,000 students. 42 lessons. 94% pass rate.* Aisha K., Marcus T. and
fourteen other students who do not exist. A design tool fills every gap with
something plausible, and plausible is worse than blank because nobody notices
it is fake until it is in the app.

Replace every made-up number with a real one or delete it. Replace every
pretend person with a real thing from your product plan. If your app has no
lessons yet, the card that says *42 lessons* is lying, and a design that lies
gets built as it is.

### 2. It added things your story never asked for

A search bar. A profile picture. Three tabs. A footer with links to a privacy
policy. Go back to your build card. If a thing on the screen is not on the
card, it is not in your app, and your builder will either build it (and it
will do nothing) or skip it (and the design will not match). Delete it.

Sometimes the tool adds something and you think, *oh, we do need that*. Good.
That is a finding. Write it on the story, propose the change on your cards
page, and then keep it. Adding to the story is the right way to add to the
screen. Adding to the screen on its own is how a design and an app drift apart.

### 3. Every layer is called Frame 214

Open the layers panel. Rename every layer that will become a component to the
name on your **design brief**: `btn_save`, `lbl_total`, `rp_houses`. This is
the one rule the whole team depends on, and it is written up on
**[Designing for Anvil](/build/figma.html)**. It takes ten minutes for a screen
and it is the ten minutes that make the design usable.

Delete layers that are decoration. The faint grid, the floating symbols, the
glow behind the card, the shadow under the button: if it does not have a name
on your brief, it is paint. Anvil cannot draw it and your builder should not
spend an afternoon trying.

### 4. It used effects Anvil does not have

Go through the screen and look for these. Every one is a thing to change now
rather than a conversation with your builder later.

| In the AI design | Why Anvil cannot | Do this instead |
|---|---|---|
| A gradient | Components take one colour | Pick the colour from one end |
| A button that changes when you hover | Animation needs CSS | Nothing. It is fine. |
| Rounded corners on a photo | Image is a rectangle | Square photo, or a rounded box around it |
| A card with a soft shadow | Shadow needs CSS | A card with a thin border. Your builder can do this with a role; see [Make Anvil look like your Figma](/build/look.html) |
| Things side by side in a grid | A list is one column | One column. It is the same things. |
| Row three looks different from row one | A list is one row, repeated | Make every row the same |
| A progress bar that fills | A rectangle with a changing width | `3 / 10` as text |
| Text in two styles in one line (*finally* in italics) | A label is one style | Split into two labels, or drop the italics |

Some of these your builder **can** do, with a bit of pasted CSS: pill buttons,
rounded cards, a real font. That is the next page. But do it on purpose, after
the app works, not because the AI drew it.

---

## Making it pretty on purpose

Once the screen is honest (real words, only the things on the card, named
layers, nothing Anvil cannot draw), make it good. Three things do most of it.

### Colour: one main colour, and the set that goes with it

Pick **one** colour for buttons and headings. Then get the rest from it rather
than by eye. Two ways:

- **Material Theme Builder**, a free Figma plugin. Give it your one colour and
  it generates the full set, with names (Primary, On Primary, Primary
  Container, Surface) that match the names in Anvil's colour scheme editor
  exactly. This is the closest thing to a cheat code in this project.
- **Tints of your own colour.** Your main colour at full strength for buttons,
  the same colour at 10% for a light panel behind things, and near-black text
  on near-white background for everything else.

Check the contrast: white text on your main colour should be easy to read.
If it is not, darken the colour rather than shrinking the text. Anvil's newer
theme gives you an *On Primary* colour for this reason, and it should be white
or near-black, never a third colour.

Write the hex codes down as you go. There is a table for them on
**[Designing for Anvil](/build/figma.html)**, and hex codes are the only form a
colour can cross into Anvil in.

### Type: two sizes, one font, maybe two

A heading size and a body size. Everything on the screen is one or the other.
A third size is for the one big number on a results screen, if you have one.

One font is enough. If you want two, make them clearly different (a serif for
headings, a plain sans for everything else) and use the second one only for
headings. Google Fonts is where your builder can get either for free, so pick
from there. **Do not pick a font you cannot name**; your builder has to type it.

### Space: pick one gap and use it everywhere

Eight pixels, or sixteen. Every gap between things on the screen is one of
those two numbers or a multiple. That one rule is most of what makes a screen
look designed rather than arranged. Auto layout will keep it for you once you
set it.

---

## Before you hand it over

- [ ] Every line on the build card is something you can point to on the screen
- [ ] Nothing on the screen is missing from the card
- [ ] Every number and name on it is real, or it is gone
- [ ] Every component layer has its name from the design brief
- [ ] The empty state, the error state and the full state are drawn too
      (see rule 5 on [Designing for Anvil](/build/figma.html))
- [ ] No gradients, hover effects, shadows or grids you are counting on
- [ ] One main colour, and its hex code written down
- [ ] Two text sizes, one or two named fonts, one gap

Then the handoff is the same as for everybody, at the bottom of
**[Designing for Anvil](/build/figma.html)**: pictures, numbers, names, and the
link.

## When you are stuck

Ask on your **design brief** page. That helper has your brief open, so it can
tell you whether the thing the AI drew is in your architecture, and whether
Anvil can build it. It will not draw anything for you, which is fine, because
the AI already did that part and the rest is the bit worth learning.

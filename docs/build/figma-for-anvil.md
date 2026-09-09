# Designing for Anvil

For the designers. You already know how to use Figma, so this is not a Figma
tutorial. This is the part nobody has told you yet: **your team has already
decided the name of every button on every screen, and it is written down.**

Open your team's design brief. It lists every screen your app has, and inside
each one, the exact name of every label, box and button on it. Those names came
from your builders. If your Figma layers use the same names, the person writing
the code can open your design and find their own components in it. If they do
not, they are guessing, and guessing is where a design quietly stops being the
thing that gets built.

That is the whole job of these five rules.

**If you have not built a clickable prototype before**, do that first:
**[Make a clickable prototype in Figma](/build/prototype-steps.html)** is the
step by step version, with pictures. This page is the rules; that page is the
buttons to press.

---

## 1. One frame per screen, named after the screen

Your brief has a table of frame names: `SignIn`, `Home`, `AddPoints`. Use those
exact words as your frame names. Capital letters and all.

Not `Home v2`. Not `home FINAL`. Not `Untitled`. If you need versions, use
Figma's version history, which is what it is for.

**Why it matters:** in Anvil every one of those names is a real file that
somebody creates. When your builder is looking at three of your frames and two
of their Forms, matching names is the only thing keeping them straight.

## 2. Layer names are not decoration

Rename your layers to match the component names in your brief. `btn_save`,
`lbl_error`, `rp_houses`. Underscores, lowercase, exactly as written.

This is the rule that people skip, and it is the one that matters most. A design
where every text layer is called "Text" and every rectangle is called
"Rectangle 47" tells your builder nothing. A design where the layer is called
`lbl_streak` tells them precisely which line of their code draws it.

**The prefix tells you what it is.** Every one of these teams uses the same
short code at the front of a name:

| Prefix | What it is | What it looks like |
|---|---|---|
| `lbl_` | Label | Text on the screen. Not clickable. |
| `btn_` | Button | A rectangle you click. |
| `txt_` | TextBox | One line you type into. |
| `dd_` | DropDown | A box that opens a list of choices. |
| `chk_` | CheckBox | A small square that ticks. |
| `rp_` | RepeatingPanel | One row design, repeated for each row of data. |
| `img_` | Image | A picture. |

So `lbl_error` is text, and `btn_back` is a button, and you can read the whole
screen off the list before you draw a single thing.

## 3. Design what Anvil can actually build

This is the hard one, and it is the difference between a design that gets built
and a design that gets admired and then ignored.

Anvil gives your builders a fixed set of components. They are not drawing
rectangles like you are; they are dragging a Button onto a Form. A Button can
have different text, a different colour, a different size, and an icon. It
cannot have a custom shape, a gradient, or a hover animation without somebody
writing CSS, and nobody in this class is writing CSS.

Your team's design brief lists every component *your* app uses, and for each one
what can be changed and what cannot. Read that table before you start. Ten
minutes there saves a period of drawing something nobody can produce.

**The other constraint is where things sit.** By default an Anvil Form stacks
things down the screen, one under the next, in full-width rows. Components can
be put side by side, and there is a container that lets you place things at
exact positions, but that one has a fixed width and stops working properly on a
phone.

The practical version: **a design that stacks down the page in rows is easy to
build. A design where things are scattered around at particular positions is
not.** Design with the grain of the tool. That is not settling for less; it is
what designing for a real material means, and every designer who has ever
worked with a manufacturing process has done exactly this.

## 4. A repeating list is one row, designed once

If your brief says a screen has something starting with `rp_`, that is a
RepeatingPanel: your builder designs **one** row, and Anvil stamps out a copy of
it for every piece of data.

So draw the one row properly. Then, separately, show what four or five of them
look like stacked up, so everyone can see the rhythm.

What you cannot do is make row three look different from row one. If your design
has a "featured" first result in a bigger box, that is not one repeating design
any more, and it is worth knowing that before you draw it, not after.

## 5. Draw the bad day, not just the good one

This is the thing that separates a designer from someone who makes screens look
nice, and if you take one habit from this project, take this one.

Every screen has three states:

- **Empty.** Nobody has added anything yet. The list is blank. What does the
  screen say? On the first day of your app being real, this is the *only* state
  anyone sees.
- **Wrong.** Somebody typed something the app will not accept. Most of your
  teams already have a `lbl_error` in the brief. It exists. Nobody has decided
  what it looks like. Red text? A box? Where?
- **Full.** Somebody has used this for a month. Long names, forty rows, a review
  that is a paragraph instead of four words.

Draw all three. If you only draw the happy one, your builder invents the other
two while writing code, at speed, and it shows.

And use **real content**. Real trail names, real prices, the actual words from
your user stories. Not "Lorem ipsum", not "Item 1". Fake content hides every
problem a design has, because fake content is always the perfect length.

---

## The handoff

When you are done, your builder needs three things from you, and nothing else:

1. **A picture of each frame.** Export a PNG per frame and drop it in your
   team's folder. They will keep it open next to the Anvil editor.
2. **Your colours as hex codes.** `#630031`, not "dark red". Anvil's colour
   scheme editor takes a hex code typed in by hand, so a hex code is the only
   form your colours can actually arrive in.
3. **Which layer is which component.** If you followed rule 2, you have already
   done this and it took no extra time at all.

**Dev Mode does most of this for you.** Your education account has it. Switch it
on and it will read out the exact hex codes, font sizes and spacing of anything
you click, which is precisely the list your builder needs to type into Anvil.
You do not need to write any of it out by hand.

## Handing it over, step by step

**There is no export button, and there is no Figma plugin for Anvil.** Nobody
presses a thing in Figma and gets an Anvil app out. Say that out loud to your
team once, because somebody will go looking for it and lose an afternoon.

What actually crosses over is three things: **names, numbers, and pictures.**
Names your builder types on components, numbers they type into the theme,
pictures they keep open beside the editor. That is the whole link, and doing it
properly takes about fifteen minutes.

### 1. Turn Dev Mode on

Top right of the Figma toolbar, the switch that says **Dev Mode**. Your
education account has it.

Now clicking any layer shows its exact colour, font, size, spacing and corner
radius down the right hand side, in numbers you can copy. You are reading these
out rather than exporting them, so the less typing you do by hand the fewer
typos your builder inherits.

### 2. Write the colours down as hex codes

Click your main colour, copy the hex, and put it in the table below. Six of them
is usually the lot.

`#630031`. Not "dark red", not "the maroon one". Anvil's colour scheme takes a
hex code typed in by hand, so a hex code is the only form a colour can arrive
in.

| What it is | Hex |
|---|---|
| Main colour, buttons and headings | |
| The colour that goes on top of it | |
| Page background | |
| Card or panel background | |
| Normal text | |
| Something has gone wrong | |

### 3. Write down the sizes that repeat

Three numbers, not thirty. Your builder is setting these once in a theme, not
per component.

| What it is | Number |
|---|---|
| Heading font size | |
| Normal text size | |
| Corner radius on buttons and cards | |
| Gap between things | |

### 4. Export a picture of every frame

Select a frame, find **Export** at the bottom of the right hand panel, choose
**PNG**, and export at **2x** so it stays sharp when somebody zooms in.

One file per screen, named after the screen. `Dashboard.png`, not
`Screenshot 2026-09-09.png`. Your builder is going to have these open next to
the Anvil editor all lesson.

### 5. Export the icons and pictures on their own

Anything that is a real image rather than a shape: a logo, an icon, a photo.
Select it, export it, **SVG for icons and logos** and **PNG for photos**. An
icon exported as a PNG goes fuzzy the moment anybody looks at it on a better
screen.

Shapes you drew, like a rectangle behind a button, are **not** images. Anvil
draws those itself and your builder sets a colour. Exporting them as pictures is
the most common way a design ends up impossible to build.

### 6. Send the four things

1. The PNGs, one per screen.
2. The two tables above, filled in.
3. The icons and photos.
4. **The link to your Figma file**, so they can click a layer and read a number
   you forgot to write down. Copy link, and check the sharing is set so your
   team can actually open it.

Then sit with your builder while they set the colours up. Ten minutes together
now saves the conversation where the app is the wrong blue and nobody can
remember which blue was right.

**What happens to it next** is written up for them on
[First steps in Anvil](/build/first-steps.html), in the part about building from
a designer's Figma. Worth reading even though it is not your job: it says what
your builder can and cannot do with what you sent, and it will change what you
send next time.

## One thing worth knowing about colour

Anvil's newer theme is built on Google's Material Design 3, and Material Design
3 has an official **Figma plugin** called Material Theme Builder. You pick one
main colour, and it generates the full matching set.

If your team is choosing colours from scratch and arguing about it, that is a
faster and better-looking route than picking five colours by eye, and it hands
you exactly the set of values Anvil's colour scheme is expecting. It is
optional. It is also the closest thing to a cheat code in this whole project.

## When you are stuck

Same three kinds of stuck as everyone else on your team:

1. **You do not know what a screen is for.** Read your team's build cards.
2. **You do not know what goes on a screen.** Your design brief lists it.
3. **You do not know whether Anvil can do the thing you drew.** Ask on your
   design brief page, or ask your builders, or ask the teacher.

The one question worth asking your builders before you hand anything over:
**can you find every one of your components in this design?** If the answer is
no, you have just found the gap for free.

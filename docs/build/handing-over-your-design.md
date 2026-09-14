# Handing over your design

No em dashes anywhere in this document or any copy it generates.

Your design is finished when somebody who has never met you can build it. Not
when it looks good. This page is how you hand it over so that happens, and it
is short because most of the work is naming things.

The idea underneath it: **a story and a screen are linked by a name.** Your
story has a heading. Your build card has the same heading. Your design brief
names the screens and every component on them. If your Figma file uses those
same names, anybody can walk from a sentence you wrote to the frame that shows
it, and back, without asking you. That walk is what a review is, and what a
build is, and it is the whole reason the names matter.

---

## How the file is organised

**One file for the team**, named after your product. Not one per person.

**One page per build card.** Name the page exactly like the card, number and
all:

```
Card 1 · Car gallery
Card 2 · Parts library
Card 3 · Horsepower builder
```

Everything on that page is that story, and nothing else goes on it. This is the
link between a story and a design, and it costs you nothing but a name.

**One frame per screen**, named exactly as your design brief names the form:
`Cars`, `CarDetail`, `Builder`. A card that needs two screens has two frames on
its page. A screen that two cards use is on both pages.

**States as suffixes.** The plain frame is the good day. Add:

```
Builder / empty     nothing picked yet
Builder / error     somebody did something the app refuses
Builder / full      a month of real use, long names, lots of rows
```

**Layers named after components.** `lbl_total_hp`, `chk_turbo`, `btn_reset`.
This is the rule on [Designing for Anvil](/build/figma.html) and it is the one
people skip. A layer called Rectangle 47 tells your builder nothing. A layer
called `lbl_total_hp` tells them exactly which line of code draws it.

**A Cover page first**, before Card 1: the product name, the team name, one
sentence about what the app is for, your colours as hex codes, and your one or
two fonts by name. No student names anywhere in the file, on any page. The
file already shows who owns it and that is as far as it goes.

## What goes in the frames

**Real words from your story.** The criterion "Every upgrade you pick adds
horsepower" should be visible on the Builder frame as the thing it describes:
a checkbox called turbo, a number that is bigger. Not "Lorem ipsum", not
"Item 1", not a number a design tool made up to fill space. Made-up numbers are
the single most common thing that has to be stripped out of a design before it
can be built, and they hide every real problem because they are always the
perfect length.

**Only what is on the card.** If a thing is on the screen and not on the card,
one of two things is true: it is decoration, and it goes; or you have found a
missing part of the story, and it goes on the story first, through the propose
box on your cards page. Then it is on the card, and then it can be on the
screen.

**Nothing Anvil cannot draw.** Gradients, hover effects, shadows, rows that
differ from each other. The list, and what to do instead, is on
[Start your design with AI](/build/figma-ai.html), Part D, and it applies
whether or not an AI drew your first version.

## Sharing it

1. In Figma, press **Share**. Add your teacher's school email as a viewer.
   Do not switch the file to "anyone with the link": that makes it public,
   and it does not need to be.
2. Copy the link.
3. Open your team's **design brief** page and find **Share your design** at
   the bottom. Paste the link, and if your builders have published the Anvil
   app, paste that link too. Write one line about what is finished and what is
   not.
4. Press Send. Your teacher gets an email. Nothing on your pages changes.

## What happens next

Your file gets read against your own documents, page by page, and a **Design
review** appears in your chain of pages. It says, in order:

- which cards have a page and which do not
- which screens from your brief have a frame and which do not
- which frames are missing an empty or an error state
- which components from your brief are not in the frame, and which layers in
  the frame are not in your brief
- which text is placeholder, and which numbers look made up

Every line comes from your design and your documents disagreeing, so it can
be checked, and it gets shorter as you fix things. Nothing on it is a judgement
of whether the design is any good. That is a conversation with people.

When the review is clean, or close to it, your design is the one that gets
built for demo day, in the colours and the shape you drew. When it is not, the
version that gets built is a guess, and the guess will be plainer than yours.

---

## The checklist

Go down it before you press Send. Every line is something the review will
check, so ticking it here saves a round.

- [ ] One file, named after the product, shared with the teacher's email as a viewer
- [ ] A Cover page: product name, team name, purpose, hex codes, fonts. No student names.
- [ ] One page per build card, named `Card N · title` exactly as the card is
- [ ] Every screen in the design brief has a frame, named exactly as the brief names it
- [ ] Every frame has an `/ empty` and an `/ error` state beside it
- [ ] Every component in the brief is a layer with that name in its frame
- [ ] No layer that will be built is still called Frame, Rectangle, or Text
- [ ] Every number and name on every frame is real, or from your stories
- [ ] Nothing on a frame that is not on its card
- [ ] No gradients, hover effects, shadows, or rows that differ from each other
- [ ] The Anvil link, if the builders have published

## When you are stuck

Ask on your **design brief** page. That helper has your brief open and can
tell you whether a name matches and whether Anvil can build what you drew. It
will not draw anything for you, and it cannot see your Figma file. The review
can, which is why you share it.

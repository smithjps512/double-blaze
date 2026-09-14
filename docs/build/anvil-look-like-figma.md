# Make Anvil look like your Figma

No em dashes anywhere in this document or any copy it generates.

Your app works. Your designer's screens are open beside the editor, and the app
is the right colour but it does not look like the design: the buttons are
square, the font is the default, the cards have no edges. This page is the
gap between those two, and it closes in about forty minutes.

The idea underneath it, which is worth more than the CSS: **a look lives in one
place, and components point at it by name.** You are not going to style forty
buttons. You are going to say what a button looks like once, and then tell each
button that it is one.

Do this **after** the app does what the cards say. A pretty app that does not
work is a design. A working app that is plain is an app, and it is a far
shorter walk from there to good looking than from the other direction.

---

## 1. Colours, into the theme, once

In the App Browser on the left, open **Theme**, then **Colour Scheme**. You will
see a list of named colours. Type your designer's hex codes in.

**Which names you see depends on which theme your app was made with.** Look at
the first name in the list.

**If it says "Primary", "On Primary", "Primary Container"** you are on Anvil's
Material 3 theme. This is what a new app gets.

| Theme colour | What to put there |
|---|---|
| Primary | Your main colour: buttons, headings |
| On Primary | The colour of text on your main colour, usually white |
| Primary Container | A light tint of your main colour, for panels behind things |
| On Primary Container | Text on that tint, usually your main colour or near-black |
| Secondary | Your second colour, if there is one; otherwise a darker main |
| Surface | Page background, usually white or near-white |
| On Surface | Normal text, near-black |
| On Surface Variant | Quieter text: captions, hints |
| Outline | Borders and dividers, light grey |
| Error | Something has gone wrong: a red |

**If it says "Primary 500", "Primary 700", "Secondary 500"** you are on the
older Material Design theme.

| Theme colour | What to put there |
|---|---|
| Primary 500 | Your main colour |
| Primary 700 | A darker version of it |
| Primary 100 | A light tint of it |
| Secondary 500 | Your second colour |
| Background | Page background |
| Text | Normal text |
| Divider | Borders, light grey |
| Error | A red |

If a name in your list is not in the table, leave it. If you have a colour with
nowhere to go, put it on whichever name is closest.

**From now on, set colours by name.** In the Properties panel, a component's
background and foreground are dropdowns of these names. Pick *Primary*, not a
hex. The day the team changes the blue, you change it here and every button
follows. Type `#1a4fd6` on to a button by hand and you will be hunting for that
button in March.

**Check it:** run the app. Headings and buttons should already be your colour.
If nothing changed, the colours went into a different theme's names; look at
the first name in the list again.

---

## 2. The font, into theme.css, once

In the App Browser, under **Theme**, open **theme.css**. This is the one place
in the whole project where CSS lives, and you are going to paste into it rather
than write it. Nobody in this class is writing CSS.

Your designer gave you a font name. Find it on Google Fonts, click **Get font**,
then **Get embed code**, and copy the line that starts `@import`. It looks like
this, with your font's name in it:

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
```

**That line goes at the very top of theme.css**, above everything that is
already there. CSS insists that imports come first, and an import anywhere else
is ignored without a word.

Then, at the very bottom of the file:

```css
body, .anvil-container, .anvil-component {
  font-family: 'DM Sans', system-ui, sans-serif;
}
```

with your font's name where `DM Sans` is. Run the app. If the text changed,
you are done with fonts. If it did not, search theme.css for `font-family` and
change the first one you find; some themes set the font somewhere the line
above does not reach.

A second font, for headings only, is set on a role, which is the next part.

---

## 3. Roles: a shape with a name

A **role** is a name you give a component so that a rule in theme.css applies
to it. You add the name once under **Theme**, then **Roles**. Then any
component can be given that role from the **role** dropdown in its Properties
panel, and it takes on the look.

This is how a square button becomes a pill, how a plain ColumnPanel becomes a
card with an edge, and how one label gets the heading font. It is the whole
trick.

### The five roles most designs need

Add these under **Theme**, then **Roles**, spelled exactly like this:

| Role | Give it to | What it does |
|---|---|---|
| `pill` | Buttons | A fully rounded button with room around the text |
| `card` | ColumnPanels | A white box with a thin border and rounded corners: every list row, every panel of things |
| `panel` | ColumnPanels | A big rounded box with a coloured background and lots of padding: a hero, a call to action |
| `display` | Labels | The heading font, if you have a second one, with tight line height |
| `eyebrow` | Labels | Small capitals with wide spacing: the little label above a heading |

### The CSS for them

Paste this at the bottom of theme.css, under the font lines. Change the two
numbers your designer gave you: the corner radius, and the border colour (put
your *Outline* hex there).

```css
/* Buttons */
.anvil-role-pill button {
  border-radius: 999px;
  padding: 12px 28px;
  font-weight: 600;
  text-transform: none;
  box-shadow: none;
}

/* Boxes */
.anvil-role-card {
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 8px;
}
.anvil-role-panel {
  border-radius: 24px;
  padding: 32px 24px;
}

/* Text */
.anvil-role-display, .anvil-role-display * {
  font-family: 'DM Serif Display', Georgia, serif;
  font-weight: 400;
  line-height: 1.1;
}
.anvil-role-eyebrow, .anvil-role-eyebrow * {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
```

If you have a heading font, its `@import` goes on the same top line as the
body font (Google Fonts gives you one line for both when you select two).
If you do not, delete the `display` block and skip that role.

### Check it before you style a screen

Drag a Button on to any form. Set its **role** to `pill`, its background to
*Primary* and its foreground to *On Primary*. Run the app.

You should see a rounded button in your colour, in your font. Then:

- **Right shape, wrong font:** the `@import` line is not first in the file.
- **Right font, square:** the role name is spelled differently in Roles than
  in theme.css. It has to match in three places: Roles, the component's role
  property, and after `anvil-role-` in the file.
- **Square and wrong font:** theme.css did not save, or the app did not run
  again. It only reaches the app when it runs.

Fix that one button. Every other component on every screen is a variation of
it.

---

## 4. Boxes: how a screen gets its shape

A Figma screen is made of boxes inside boxes: a card with a heading and two
lines of text, a row with a name on the left and a number on the right. Anvil
has containers for exactly those, and once you know two of them you can read
almost any design as a list of containers.

| You see in the Figma | Use in Anvil | Prefix |
|---|---|---|
| A box with things stacked inside it | **ColumnPanel** with the `card` or `panel` role | `card_` |
| Things side by side on one line | **FlowPanel** | `fp_` |
| The same box repeated for every item | **RepeatingPanel**, with the row designed once as a ColumnPanel inside its template | `rp_` |
| A screen with a narrow middle and space either side | A ColumnPanel with a `narrow` role: `max-width: 640px; margin: 0 auto;` | `card_` |
| A grid, two or three across | One column. Anvil lists are one column, and the design is the same things. | `rp_` |

So a leaderboard row that shows a name, a house and a points total is: a
RepeatingPanel, whose row template is a ColumnPanel with the `card` role,
holding a FlowPanel with three labels in it. Three containers, named
`rp_scores`, `card_row`, `fp_row`. That is how the whole screen reads.

Two new prefixes, then: `card_` for a ColumnPanel used as a box, `fp_` for a
FlowPanel used to put things side by side. Put them on your architecture page
with the rest, so your designer names the layers to match.

---

## 5. What to leave in the Figma

Some of the design is paint. Half of building from a real design is knowing
which parts are the building and which are the paint, and leaving the paint
alone with a clear conscience.

| In the Figma | Leave it because | Instead |
|---|---|---|
| A gradient behind the hero | Backgrounds are one colour | The colour from one end, on a `panel` |
| Buttons that grow on hover | Animation | Nothing. Nobody misses it on a Chromebook. |
| A soft shadow under every card | Needs more CSS than it is worth | The thin border the `card` role gives you |
| A progress bar that fills up | A rectangle with a percentage width | `3 / 10` in a label |
| A photo with rounded corners | Image is a rectangle | The photo inside a `card` |
| Text in two styles on one line | A label is one style | Two labels in a FlowPanel |
| Icons drawn as shapes | Not images | Anvil's built-in icon set on the Button, or an SVG your designer exports |
| A shape exported as a picture of a button | A picture cannot be clicked | A Button with the `pill` role |

If your designer wants one of these badly, the conversation is not about
whether Anvil can. It is about whether it is worth a lesson. Sometimes it is,
and the `card` and `panel` roles are exactly that trade: a bit of pasted CSS,
once, for a look the whole app gets.

---

## 6. Get it close, then stop

**Your app will not look identical to the Figma and it is not supposed to.**
Right colours, right font, rounded where the design is rounded, real content,
nothing missing, and every state drawn (empty, wrong, full) actually reachable.
That is finished. It will look like the design to everyone who is not the
designer, and the designer will see the five percent, and that five percent is
where teams lose the week they needed for the build.

Put the two screens side by side, the Figma and the app, and show them to
somebody who has never seen either. If they say *oh, it is the same*, stop.

---

## When it does not take

Three things to check, in order, before asking anyone:

1. **Is the role name the same in three places?** Roles, the component's role
   property, and after `anvil-role-` in theme.css. One letter off in any of the
   three and nothing happens, silently.
2. **Did theme.css save, and did you run the app again?**
3. **Widen the rule.** If `.anvil-role-pill button` does nothing on your theme,
   change it to `.anvil-role-pill button, .anvil-role-pill .btn` and try again.
   Themes differ in how deep the real element sits, and widening the rule is
   how you find it.

If it is still square, bring the role name and a screenshot to the helper on
your **design brief** page, or paste the CSS into the *it is not working* box on
this page's helper with what you expected. Both are allowed to talk about CSS,
because there is no Python in it to give away.

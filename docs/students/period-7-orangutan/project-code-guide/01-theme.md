# 1. Colours, fonts and roles: set once

No em dashes anywhere in this document or any copy it generates.

Everything on every screen of your design is made from three blues, two
fonts, and about eight shapes: a pill button, a rounded card, a rounded blue
panel, a chip, a small capitals label. Anvil lets you define each of those
**once** and then point components at them by name. That is the whole trick,
and it takes twenty minutes.

Do not skip this page and go and colour buttons one at a time. You will colour
forty of them, and the day the team changes the blue you will do it again.

## 1. Colours, into the theme

In the App Browser on the left, open **Theme**, then **Colour Scheme**. You will
see a list of named colours. Type the hex codes in.

Which names you see depends on which theme your app was made with. Look at the
first name in the list:

**If the list says "Primary", "On Primary", "Primary Container"** you are on
Anvil's Material 3 theme.

| Theme colour | Hex |
|---|---|
| Primary | `#1a4fd6` |
| On Primary | `#ffffff` |
| Primary Container | `#e8effe` |
| On Primary Container | `#1a4fd6` |
| Secondary | `#0f2d80` |
| On Secondary | `#ffffff` |
| Tertiary | `#f5b800` |
| Surface | `#ffffff` |
| On Surface | `#111827` |
| On Surface Variant | `#6b7280` |
| Surface Variant | `#f9fafb` |
| Outline | `#e5e7eb` |
| Outline Variant | `#f3f4f6` |
| Error | `#e11d48` |

**If the list says "Primary 500", "Primary 700", "Secondary 500"** you are on
the older Material Design theme.

| Theme colour | Hex |
|---|---|
| Primary 500 | `#1a4fd6` |
| Primary 700 | `#0f2d80` |
| Primary 100 | `#e8effe` |
| Secondary 500 | `#f5b800` |
| Background | `#ffffff` |
| Text | `#111827` |
| Disabled | `#9ca3af` |
| Divider | `#e5e7eb` |
| Error | `#e11d48` |

If a name in your list is not in the table, leave it. If a name in the table is
not in your list, put the hex on whichever of yours is closest.

From now on, when a page says *background: Primary*, you pick that named colour
from the dropdown in the Properties panel rather than typing a hex. Anywhere a
page gives a bare hex like `#dcfce7`, it is a one off colour that is not worth a
theme entry; type it into the property.

## 2. Fonts, into theme.css

In the App Browser, under **Theme**, open **theme.css**. This is the one place
in the whole project where you type CSS, and you are going to paste it rather
than write it.

**The very first line of the file** must be this, above everything else,
because CSS insists that imports come first:

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;600&display=swap');
```

Then, anywhere below it:

```css
body, .anvil-container, .anvil-component {
  font-family: 'DM Sans', system-ui, sans-serif;
}
```

Run the app. If the text has changed to DM Sans, you are done. If it has not,
search theme.css for `font-family` and change the first one you find to
`'DM Sans', system-ui, sans-serif`; some themes set the font in a place the
line above does not reach.

The serif and the mono font are not set on the whole app. They are set on
roles, which is the next part.

## 3. Roles: a shape with a name

A **role** is a name you give a component so that a rule in theme.css applies
to it. You add the name once under **Theme**, then **Roles**, and then any
component can be given it from the **role** dropdown in its Properties panel.

Add these eleven. Spelling matters, because the CSS on page 6 uses the names:

| Role | Give it to | What it does |
|---|---|---|
| `display` | Labels | The serif headline font, tight line height. |
| `eyebrow` | Labels | Small capitals with wide letter spacing: "RANKINGS". |
| `mono` | Labels | The mono font, for numbers and points. |
| `pill` | Buttons | A fully rounded button with generous padding. |
| `pill-outline` | Buttons | The same shape, transparent with a thin border. |
| `panel` | ColumnPanels | Rounded corners of 24 and big padding. The blue hero, the navy call to action, your rank card, the results level card. |
| `card` | ColumnPanels | A white box with a 2 pixel grey border and corners of 16. Every list row. |
| `card-you` | ColumnPanels | The same card with a blue border and light blue fill. Your leaderboard row. |
| `correct` | ColumnPanels and Labels | Green fill, green border, corners of 16. |
| `wrong` | ColumnPanels and Labels | Red fill, red border, corners of 16. |
| `chip` | Labels | A small rounded tag: "42 lessons", "Basic", "Ages 16+". |

And four more that are optional, for when the first eleven are in and you want
to go further:

| Role | Give it to | What it does |
|---|---|---|
| `answer` | TextBoxes and DropDowns | The big rounded answer box with the blue border when you click into it. |
| `subject-icon` | Labels | The 48 by 48 blue rounded square with "x²" in it. |
| `avatar` | Labels | The 36 pixel grey circle with one letter in it. |
| `narrow` | ColumnPanels | Holds the middle of a screen at 640 wide and centred, the way the quiz sits in the middle of the page. |

Page 6 has the CSS for all fifteen. Paste it under the font lines. Then in the
designer, click a component, find **role**, and pick.

**A role can be set from code too**, which is how one box turns green or red:

```python
self.card_feedback.role = "correct"
self.card_feedback.role = "wrong"
```

That is the same idea as Pattern 14, show and hide, but for the look of a thing
rather than whether it is there.

## 4. Check it before you build a screen

Drag a Button on to any form, set its **role** to `pill`, its background to
Primary and its foreground to On Primary, and run the app. You should see a
blue pill with white text in DM Sans, and it should look like the "Get started"
button in the top right of your home screen.

If it is a pill but the wrong font, the import line is not first. If it is the
right font but square, the role name is spelled differently in Roles than in
theme.css. If it is square and the wrong font, theme.css did not save.

Fix that one button first. Every other component on every other page is a
variation of it.

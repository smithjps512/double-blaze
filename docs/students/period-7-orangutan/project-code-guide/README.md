# Math Bros Inc.: making Anvil look like the Figma

No em dashes anywhere in this document or any copy it generates.

Your app works. This folder is about the other half: making the Anvil app you
built look like the Math Bros Inc. design you made in Figma. It is written from
the design's own code, so every colour, every font size and every word on every
screen below is the real one, not a guess from a screenshot.

**There is no import button.** Anvil cannot open a Figma file. What crosses
over is **names, numbers and pictures**, and this folder is those three things
already done: the pictures are here, the numbers are on page 1, and the names
are on pages 2 to 5. What is left is typing them in, which is about two lessons
for the whole app.

## The one rule

**Get it close, then stop.**

Anvil components look like Anvil components. With the colours, the fonts and a
handful of rounded corners, your app will be recognisably the Figma. It will
not be pixel for pixel identical, and chasing the last five percent is where a
team loses the week it needed for the build. Page 7 lists the things in your
design that are not worth chasing, and why.

## What is in here

Read page 1 first and do it once. Then take the screens in whatever order you
like; each one stands on its own.

| Page | What it covers |
|---|---|
| `01-theme.md` | Colours into the theme, fonts into theme.css, and the eleven roles every screen below uses. Do this first, once. |
| `02-home.md` | The home screen: nav, blue hero, navy call to action, six subjects. |
| `03-placement.md` | The placement test and its results screen. |
| `04-practice-and-quiz.md` | The subject list and the adaptive quiz. |
| `05-leaderboard.md` | Your rank card, the ranked rows, the footer. |
| `06-theme-css.md` | The whole theme.css addition, in one place, to paste. |
| `07-what-not-to-chase.md` | What the Figma does that Anvil should not, and six things in the design your team should decide. |

The pictures are the design at two sizes: laptop, and a phone for the two
screens most likely to be looked at on one. They were taken from the design's
own code with the real fonts loaded, so what you see is what the Figma shows.

## What came across from Figma

This is the handoff table from [Designing for Anvil](/build/figma.html),
filled in. Your designer does not need to do it again.

**Colours, as hex codes.** Six is usually the lot; your design uses a few more
because it has three blues.

| What it is | Hex |
|---|---|
| Main colour: buttons, hero, headings on blue | `#1a4fd6` |
| The colour that goes on top of it | `#ffffff` |
| Dark blue: the call to action card, level 5 icons | `#0f2d80` |
| Mid blue: some subject icons | `#1239a8` |
| Light blue: chips, the selected choice, your leaderboard row | `#e8effe` |
| Page background | `#ffffff` |
| Card border | `#f3f4f6` |
| Box border on text boxes and choices | `#e5e7eb` |
| Heading text | `#111827` |
| Normal text | `#374151` |
| Quiet text: subtitles, the back link, the rank number | `#9ca3af` |
| Something went right | `#16a34a` on `#f0fdf4`, border `#86efac` |
| Something went wrong | `#e11d48` on `#fff1f2`, border `#fda4af` |
| Accent: the yellow dot, the number one footer | `#f5b800` |

**Sizes that repeat.** Set once, in the theme and the roles, not per component.

| What it is | Number |
|---|---|
| Hero headline | 56 to 72 |
| Section heading ("Six disciplines.") | 40 to 48 |
| A question | 30 |
| Normal text | 16 |
| Small capitals labels ("RANKINGS", "QUESTION 2") | 12, letter spacing wide |
| Corner radius on buttons | 999 (a pill) |
| Corner radius on cards and rows | 16 |
| Corner radius on the big blue panels | 24 |
| Gap between rows in a list | 8 to 12 |
| Padding inside a card | 16 tall, 20 wide |

**Fonts.** Three, all free from Google Fonts, and page 1 says how to get them
into Anvil in two lines.

| Where | Font |
|---|---|
| Headlines and questions | DM Serif Display |
| Everything else | DM Sans |
| Numbers, points, "2 / 35", the badge | JetBrains Mono |

## The names on these pages

Every component below has a name, and the names follow your architecture page:
`lbl_` for a Label, `btn_` for a Button, `txt_` for a TextBox, `dd_` for a
DropDown, `rp_` for a RepeatingPanel. Two more, because a design this shaped
needs boxes:

| Prefix | What it is |
|---|---|
| `card_` | A ColumnPanel used as a box with a colour or a border. |
| `fp_` | A FlowPanel, for things that sit side by side on one line. |
| `lnk_` | A Link. Text you can click, for the nav and the back arrows. |

**If your Anvil already uses different names, keep yours.** Write yours next to
ours in the margin and carry on. The name is not the point; the look is. What
does matter is that the name in the designer and the name in your code match,
which is the same rule as always.

## Your two placement stories disagree, and the Figma picked one

Your build card 1 says *the student is never shown their level*. Your Figma
shows it, in a big blue card that says **Recommended level: Advanced, Ages
16+**, because your placement story also says *needs to tell which age group
the student should go in*. Both sentences are yours.

The pages here build what the Figma does. If your team decides the level should
stay secret, that is one line on the results screen,
`self.card_level.visible = False`, and a change to your story. Decide it out
loud, together, before you build the results screen, and write the answer on
your build card. Page 7 has the rest of the things like this.

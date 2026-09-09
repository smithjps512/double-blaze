# 7. What not to chase

No em dashes anywhere in this document or any copy it generates.

A Figma Make design is a working web page, and a web page can do things an
Anvil component cannot. That is not Anvil being worse; it is Anvil giving you
a fixed set of parts so that a team of three can build an app in a term. Half
of designing for a real material is knowing which parts of the drawing are the
building and which are the paint.

Two lists. The first is paint: things in your design to leave out, with what
to do instead. The second is things the design decided that your team has not,
and should.

## Leave these out

| In the Figma | Why not | Instead |
|---|---|---|
| The faint grid and the floating ∑, π and ∞ on the hero | Drawn with CSS backgrounds. No component. | A plain blue panel. It reads the same. |
| The gradient glow on the navy card | Same. | Plain navy. |
| The word *finally* in italics inside a headline | A Label is one style throughout. | Upright, or three labels in a FlowPanel. |
| Buttons that grow on hover and shrink on click | Animation. | Nothing. Nobody misses it on a Chromebook. |
| The thin blue bar across the top of the placement test that fills as you go | A rectangle with a percentage width. | `2 / 35` in the corner, which is already there. |
| The five level bars on the quiz | Five rectangles that change colour. | `●●○○○` in a label. One line of code. |
| The four choice boxes in a two by two grid, one turning blue when picked | Four buttons that each remember whether they are chosen. | A DropDown. Your story asks for choosing from several, and a DropDown is choosing from several. |
| The grey points bar on every leaderboard row | Width as a percentage of the top score. | The number next to it says the same thing. |
| The letter in a circle beside every name | Doable with the `avatar` role, and it is optional. | Do it last, if at all. |
| The subject icons in three different blues | Three shades of one colour. | Primary for all six. |
| Six subjects in a three by two grid | A RepeatingPanel is one column. | One column, like the phone view. It is the same six things. |
| The submit button greyed out until you type | The button watching the box. | Press it empty and get an alert. That is Pattern 6 and it is what the rest of your app does. |

If a designer on your team wants one of these badly, the thing to do is not to
argue about Anvil. It is to ask which of the two lists it belongs on, and
whether it is worth a lesson. Sometimes it is.

## Things the Figma decided that your team has not

**1. The level is shown.** Your card 1 says the student is never shown their
level. Your results screen says **Recommended level: Advanced, Ages 16+**.
Your two stories disagree with each other, and the Figma sided with one. Pick,
together, and change the card or the screen. It is one line either way.

**2. Six buttons that go nowhere.** Courses, Get started, Explore courses, See
how it works, View curriculum, and the three footer links. In a design that is
fine; in an app a button that does nothing is a bug somebody will report. Wire
each one to something (Get started and Explore courses could both open
Practice) or leave it off. Do not build a button and leave it dead.

**3. Numbers that are not true.** *Join 18,000 students.* *42 lessons.* *94%
pass rate.* The design tool made those up to fill space, and your team already
deleted one row of them. There are no lessons yet. Take the lesson counts off
the subject cards, or make them mean something, like how many practice
questions that subject has, which is 20.

**4. Fifteen pretend students on the leaderboard.** Aisha K., Marcus T., and
so on, with their points written into the code. In Anvil the leaderboard reads
a table, so they would be rows you add. Decide whether you want them at all. A
leaderboard of your real class is more motivating than one you cannot beat,
and *has to compare your amount of points to other people's* means real other
people.

**5. Some answers cannot be typed.** These written questions expect an answer
with a character that is not on a keyboard:

| Question | Expected |
|---|---|
| What is ∫ 3x² dx? | `x³ + C` |
| What is the derivative of eˣ? | `eˣ` |
| Evaluate ∫ eˣ dx. | `eˣ + C` |
| If f(x) = x⁴, what is f'(x)? | `4x³` |
| What is the second derivative of f(x) = x⁴? | `12x²` |
| What is the period of y = sin(x)? | `2π` |
| Convert 180° to radians. | `π` |

Two honest fixes. Make them multiple choice, which is a change to the
question rows. Or, before comparing, tidy both answers the same way:
lower case, spaces removed, `²` swapped for `^2`, `π` for `pi`, `−` for `-`.
That is a small function that both quiz screens share, and it also means a
student who types `X + 8` for `x + 8` is not told they are wrong.

**6. Two questions with a problem in them.** One multiple choice question
puts its own answer in the question: *Using the product rule, find d/dx
[x·sin(x)]. Enter: sin(x) + x·cos(x).* Another has the choice *Both B and C*
when nothing is labelled A, B, C or D. Fix the rows.

**7. Points live in one browser.** The design keeps your points in the
browser's own storage, so a different Chromebook is a different you. Yours will
keep them in a table, which is better, and it means the app has to know who
you are. A name typed once on the home screen is the smallest way; signing in
with Pattern 12 is the proper way. Either is a decision your architecture page
does not make yet.

**8. The "stepping back a level" message never shows.** The design works out
which tip to show after it has already reset the count of wrong answers, so
the message for stepping down is unreachable and the yellow warning appears
instead, as the picture on page 4 shows. When you write yours, work the message
out first, then reset. A bug in the mockup is not a bug you have to copy.

Write the answers to 1, 2, 4 and 7 on your build cards. They are decisions,
and decisions that live only in a conversation get made twice.

# Getting your first thing working in Anvil

No em dashes anywhere in this document or any copy it generates.

The Pattern Book tells you what to type. This page tells you **where to type it**
and what to click. If you have read a pattern and still do not know where it
goes, you are in the right place, and you are not behind.

Do this whole page once, even if it feels too easy. It takes about ten minutes
and it is the difference between "I do not know how to start" and "I know how to
start, I just have to do it".

---

## Part 1: One button that does something

The goal is not a feature. The goal is to see the app react to you. Once that
works, every pattern in the book is a variation of it.

**1. Find the two views.** Open one of your Forms. At the top there is a
**Design** view and a **Code** view. Design is where you drag things onto the
page. Code is where the Python lives. You will move between them constantly.

**2. Drag a Button on.** In Design view, find Button in the toolbox and drag it
onto the form.

**3. Give it a name you chose.** With the button selected, look at the
**Properties** panel on the right. There are two different things there and
mixing them up is the single most common problem in this class:

- **name** is what your *code* calls it. Set this to something from your
  architecture page, like `btn_save`.
- **text** is what the *user reads on the button*. Set this to "Save" or
  whatever it should say.

They are not the same and they do not have to match. Your code only ever uses
**name**.

**4. Make Anvil write the handler.** With the button still selected, find the
**click** event in the Properties panel and click it. Anvil switches you to Code
view and writes an empty function for you.

**Do not type this function yourself.** Let Anvil write it. If you type it by
hand the name may not match and the button will do nothing, with no error, which
is the most confusing failure there is.

**5. Put one line in it.**

```python
print("the button worked")
```

**6. Run the app.** Press **Run**, click your button, and look at the output
panel at the bottom of the editor.

If you see `the button worked`, you are done and everything else is built on
this. If you do not, go to the error page and look up "my button does nothing".

**7. Now make it change the screen.** Go back to Design, drag a **Label** on,
name it `lbl_message`, and change your handler to:

```python
self.lbl_message.text = "the button worked"
```

Run it again. That is Pattern 1 and Pattern 3 together, and it is most of what
your app does.

---

## Part 2: Where database code goes

This part catches everybody, and it is not your fault. It is a rule about Anvil
you cannot guess.

**Database code does not go in your Form.** If you put
`app_tables.something.add_row(...)` in a button handler, Anvil will refuse it,
because code running in the browser is not allowed to write to your tables. That
is a safety feature, not a bug.

Database code goes in a **Server Module**, and your form asks the server module
to do the work.

**1. Make the table.** In the sidebar on the left, click the **Data** icon, then
**Add New Table**. Name it what your architecture page says. Add the columns
your architecture page lists, with the right types.

**2. Make a Server Module.** In the **App Browser**, under **Server Code**,
click the blue **+ Add Server Module** button.

**3. In the Server Module**, type the top two lines first, every time:

```python
import anvil.server
from anvil.tables import app_tables
```

Then the function, with the decorator above it:

```python
@anvil.server.callable
def add_thing(value):
    app_tables.your_table.add_row(your_column=value)
```

`@anvil.server.callable` is what makes the function reachable from your form. Without
it you get an error saying there is no such server function.

**4. Back in your Form**, call it from the button handler:

```python
anvil.server.call('add_thing', "hello")
```

The name in the quotes must match the name after `def` **exactly**. This is the
second most common problem in this class.

**5. Run it, click the button, then go and look at your table** in the Data
section. There should be a row in it.

Seeing a row you created appear in a table is the moment this stops being an
exercise.

---

## Part 3: The order to work in, always

1. Design view: drag the thing on, **name** it from your architecture page.
2. Click its event so Anvil writes the handler.
3. Add **one line**. Run it. Check it worked.
4. Add the next line. Run it. Check it worked.

**Run after every line while you are learning.** It feels slow. It is much
faster than writing fifteen lines and then trying to work out which one is
wrong, and it means you always know exactly which line broke it: the one you
just typed.

---

## Part 4: Building from your designer's Figma

If somebody on your team is designing in Figma, this is what you do with what
they hand you. Their half of it, the exports and the two tables of numbers, is
on [Designing for Anvil](/build/figma.html), and it is worth a read so you know
what to ask them for.

**There is no import button.** Anvil cannot open a Figma file and there is no
plugin that turns one into an app. Do not go looking, and do not let anybody
spend a lesson looking. The link between the two is **names, numbers and
pictures**, moved across by hand in about fifteen minutes, and then it is done
for the whole project.

### 1. Put the colours in once, in the theme

Not on each component. In the editor sidebar, open **Theme**, then the colour
scheme, and type in the hex codes your designer gave you.

Now every component can be set to a colour **by name** rather than by hex. Set a
button to your main colour, and the day your team changes that colour, you
change it in one place and every button follows. Set it to `#630031` by hand and
you will be hunting for that button in March.

This is the single highest value thing on this page and it takes four minutes.

### 2. Keep the PNG open beside the editor

Their export of the screen, on one side, Anvil on the other. You are not
measuring anything off it; you are checking that you have not forgotten a label.

### 3. Name every component off the architecture page, not off the design

Your designer named their layers `btn_save` and `lbl_total` because your
architecture page says so. **You use the same names.** That is what makes their
design readable by you: they click a layer, read the name, and it is a thing
that exists in your app.

If a layer name and your architecture disagree, **the architecture wins** and
somebody has to go and fix the design. Two names for one thing is how a team
ends up with two of it.

### 4. Upload the icons and pictures

Their SVGs and PNGs go in as assets, and an **Image** component points at one.

Anything that is a plain shape, like a coloured rectangle behind a button, is
**not** a picture. Anvil draws it. If your designer exported a button as an
image, hand it back: a picture of a button cannot be clicked, cannot change
colour, and cannot have its text changed.

### 5. Get it close, then stop

**Your app will not look identical to the Figma and it is not supposed to.**
Anvil components look like Anvil components, and chasing the last five percent
of a design is where teams lose the week they needed for the build.

Right colours, right text, right things in roughly the right order, nothing
missing. That is finished. If your designer wants a detail Anvil will not do,
that is a real conversation to have together, and usually the answer is a
slightly different design rather than a week of CSS.

### What to do when Anvil will not do the thing they drew

Ask on your design brief page, where the helper has your screens and your
component names in front of it. Most of the time there is a component that does
almost the thing, and almost is fine.

---

## Part 5: When to look where

| What is happening | Where to go |
|---|---|
| I do not know what this feature should do | Your build card |
| I do not know what Python to write | The Pattern Book |
| I do not know what name to put in the blank | Your architecture page |
| I do not know where to type it | This page |
| Anvil is showing me red text | The error page |
| My button does nothing and there is no error | The error page |

---

## Sources

The editor steps above follow Anvil's own documentation:
[Build your first app](https://anvil.works/docs/get-started/build-first-app),
[Server Code](https://anvil.works/docs/server.html),
[Data Tables](https://anvil.works/docs/data-tables/quickstart).

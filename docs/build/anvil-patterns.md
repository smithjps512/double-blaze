# The Anvil Pattern Book

No em dashes anywhere in this document or any copy it generates.

This is the third document in the chain, and the only one shared by every team.
Your build card sends you to your architecture. Your architecture sends you
here, to a numbered pattern. This page has the code.

**Every pattern has blanks that look like `___`.** They are not there to be
annoying. The blank is always a name that only your team knows: your button,
your table, your form. Your architecture document has those names. If you cannot
fill a blank, you are not stuck on Python, you are missing something from your
own design, and that is worth two minutes with your architecture page.

## Before anything else: two ways Anvil writes event handlers

When you click an event in the Anvil designer, it writes a handler for you. New
Anvil writes it with a decorator:

```python
@handle("button_1", "click")
def button_1_click(self, **event_args):
    """This method is called when the button is clicked."""
    pass
```

Older Anvil apps, and older tutorials, leave the decorator off and rely on the
name matching:

```python
def button_1_click(self, **event_args):
    pass
```

**Use whichever one your Anvil already wrote for you.** Do not delete the line
Anvil generated and type the other one. The patterns below show the decorator
form. If your screen does not show `@handle`, ignore that line and keep the rest.

---

## Pattern 1: Make a button do something

**When you need it:** any story where somebody taps, clicks, presses or submits.
This is the most common pattern in the book and almost every other pattern sits
inside it.

```python
@handle("___button_name___", "click")
def ___button_name____click(self, **event_args):
    # everything you want to happen goes here, indented
    pass
```

**How to test it:** put `print("it worked")` inside, run the app, click the
button, and look at the output panel at the bottom of the Anvil editor.

---

## Pattern 2: Read what somebody typed

**When you need it:** your acceptance criteria say the user enters, types, fills
in or writes something.

```python
typed_in = self.___text_box_name___.text
```

`.text` is always a string, even when it looks like a number. To do maths with
it, convert it first:

```python
points = int(self.___text_box_name___.text)
```

**Watch out:** `int()` crashes if the box is empty or has letters in it. Pattern
6 is how you stop that.

---

## Pattern 3: Put something on the screen

**When you need it:** your Then clause says the app shows, displays or tells the
user something.

```python
self.___label_name___.text = "whatever you want to say"
```

You can build the sentence from a value:

```python
self.___label_name___.text = f"{house_name} has {total} points"
```

---

## Pattern 4: Go to another screen

**When you need it:** your story moves the user from one screen to another.

```python
open_form('___FormName___')
```

The form name is the name in your Anvil app's list of forms, spelled exactly,
in quotes. It is not the file name and not the title on the page.

---

## Pattern 5: Tell the user something happened

**When you need it:** the Then clause says the app confirms, warns or reports.

A message the user must dismiss:

```python
alert("___your message___")
```

A small message that fades on its own:

```python
Notification("___your message___").show()
```

**Which one:** `alert` for something that must be read, like an error.
`Notification` for something nice, like "Saved".

---

## Pattern 6: Check before you act

**When you need it:** any acceptance criterion with the word "must", a limit, a
minimum, or a rule. This is where most of your criteria actually live.

```python
if ___the_thing_that_must_be_true___:
    # do the real work here
else:
    alert("___what the user did wrong___")
```

A worked example, for a rule like "no more than 50 points at a time":

```python
points = int(self.text_box_points.text)
if points <= 50:
    # save the points
else:
    alert("You can only add 50 points at a time.")
```

**Test it by breaking it on purpose.** Type 51. If you do not see the alert, the
rule is not really there.

---

## Pattern 7: Save something to the database

**When you need it:** your story says saved, stored, added, kept, or recorded.

Database code runs on the **server**, not in the form. That is two pieces.

In your **Server Module**:

```python
import anvil.server
from anvil.tables import app_tables

@anvil.server.callable
def add____thing___(___argument___):
    app_tables.___table_name___.add_row(___column___=___argument___)
```

In your **form**, inside a button click:

```python
anvil.server.call('add____thing___', ___the_value___)
```

The name in quotes must match the function name after `def` exactly.

**Your teacher sets up the table and tells you the table name and the column
names.** You write the two pieces above.

---

## Pattern 8: Get things back out of the database

**When you need it:** your story says view, see, show a list, check or look up.

In your **Server Module**:

```python
@anvil.server.callable
def get____things___():
    return list(app_tables.___table_name___.search())
```

In your **form**:

```python
rows = anvil.server.call('get____things___')
```

`rows` is a list. Each item is a row, and you read a column with square
brackets: `rows[0]['___column___']`.

---

## Pattern 9: Show a list on the screen

**When you need it:** anywhere your app shows more than one of something:
houses, quiz questions, saved rooms, listings.

Drag a **RepeatingPanel** onto your form. Then:

```python
self.___repeating_panel_name___.items = anvil.server.call('get____things___')
```

Inside the panel's **item template** form, each copy can read its own row:

```python
self.___label_name___.text = self.item['___column___']
```

`self.item` is the one row this copy is showing. This is the pattern people find
strangest at first and use most often afterwards.

---

## Pattern 10: Change something already saved

**When you need it:** adding to a total, editing, updating, or ticking something
off.

In your **Server Module**:

```python
@anvil.server.callable
def add_points_to____thing___(___name___, amount):
    row = app_tables.___table_name___.get(___column___=___name___)
    row['___number_column___'] = row['___number_column___'] + amount
```

`.get()` finds one row. It returns `None` if nothing matches, so guard it with
Pattern 6 if that can happen.

---

## Pattern 11: Put a list in order

**When you need it:** leaderboards, standings, newest first, highest first.

```python
from anvil.tables import app_tables
import anvil.tables as tables

@anvil.server.callable
def get_ranked____things___():
    return list(app_tables.___table_name___.search(
        tables.order_by("___column___", ascending=False)
    ))
```

`ascending=False` puts the biggest first, which is what a leaderboard wants.
Leave it out for smallest first or A to Z.

---

## Pattern 12: Only let some people in

**When you need it:** any story with accounts, sign in, or "only teachers can".

Turn on the **Users** service in your Anvil app first.

```python
import anvil.users

@handle("___button_name___", "click")
def ___button_name____click(self, **event_args):
    user = anvil.users.login_with_form()
    if user:
        open_form('___FormName___')
```

To find out who is signed in, anywhere:

```python
user = anvil.users.get_user()
```

`user` is `None` when nobody is signed in, which is exactly the check Pattern 6
wants.

---

## Pattern 13: Let somebody choose from a list

**When you need it:** picking a house, a category, a subject, a room.

Set the choices, usually in `__init__`:

```python
self.___drop_down_name___.items = ["___choice one___", "___choice two___"]
```

Read what they picked:

```python
chosen = self.___drop_down_name___.selected_value
```

---

## Pattern 14: Show and hide things

**When you need it:** settings that turn a feature off, answers that appear
after you submit, anything that is sometimes there and sometimes not.

```python
self.___component_name___.visible = False
self.___component_name___.visible = True
```

Anything on a form has `.visible`, including a whole panel of things at once.

---

## When your pattern is not in this book

That is a real answer, not a failure. It usually means one of two things:

1. **The feature is bigger than one pattern.** Most are three or four patterns
   stacked: read the box, check the rule, save the row, say it worked. Your
   architecture page tells you which ones and in what order.
2. **The feature is not buildable in Anvil in the time you have.** Recognising
   that early is a professional skill, not a defeat. Your architecture page says
   which parts of your app are in the buildable slice and which are stubbed, and
   why.

---

## Sources

The Anvil APIs above follow Anvil's own documentation:
[Events](https://anvil.works/docs/client/events),
[Using Data Tables from Python](https://anvil.works/docs/data-tables/data-tables-in-code),
[anvil.tables](https://anvil.works/docs/api/anvil.tables),
[Users](https://anvil.works/docs/users).

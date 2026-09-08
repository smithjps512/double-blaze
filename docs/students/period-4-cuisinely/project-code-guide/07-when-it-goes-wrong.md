# 7. When it goes wrong

No em dashes anywhere in this document or any copy it generates.

The shared page [When Anvil shows you red text](/build/errors.html) explains what
each kind of error means. This page is narrower: these are the errors **this
app** throws, with the line in **your** code that causes each one.

Find your error. Read the last line of the red text first, and match the words.

## Before you read any further

Two questions, in this order, every time. They will save you more time than the
rest of this page.

**1. Is the server working?** Open the server console at the bottom of the Anvil
editor and type:

```python
anvil.server.call('get_restaurants')
```

Rows come back, or they do not. If they do not, the bug is in `ServerModule1` or
in your tables, and nothing you do to a form will help.

**2. Does the table actually have rows in it?** An empty table and broken code
look identical from the outside. Click the table in the editor and look.

---

## Errors about names

### `AttributeError: 'Restaurants' object has no attribute 'rp_restaurants'`

The component is not on the form, or it is not called that.

Click it in Design view and look at **name** in the Properties panel on the
right. Anvil calls things `repeating_panel_1` when you drag them on. Your
architecture page says `rp_restaurants`. One of the two has to change and it
should be the designer.

The complete list of names this code expects is at the bottom of page 6.

**If the component is definitely there and definitely named right**, check that
your line is **below** `self.init_components(**properties)`. Above it, the
component genuinely does not exist yet, and the error is telling the truth.

### `AttributeError: 'ItemDetail' object has no attribute 'item'`

You wrote `self.item` on a form that is not a row template.

`self.item` only exists on `RestaurantRow`, `MenuRow` and `OrderRow`, because
Anvil sets it on the copies it makes inside a RepeatingPanel. On `ItemDetail` the
row is in `self.item_row`, because you put it there.

### `AttributeError: 'NoneType' object has no attribute 'text'`

Something you expected is empty, so there is nothing to read `.text` off.

In this app it is almost always `open_form` called without its argument. Opening
`Menu` with no `restaurant_name` leaves it `None`, and then
`self.lbl_restaurant_name.text = restaurant_name` is putting nothing into a
label.

Check the `open_form` line that got you here, not the line that threw the error.
**The error appears one screen after the mistake**, which is why this one is
annoying.

### `NameError: name 'app_tables' is not defined`

The top of `ServerModule1` is missing `from anvil.tables import app_tables`. All
four imports on page 1 are needed.

### `NameError: name 'tables' is not defined`

You have `from anvil.tables import app_tables` but not `import anvil.tables as
tables`. They look like the same line and they are not. `tables.order_by` needs
the second one.

---

## Errors about passing things between screens

### `TypeError: __init__() got an unexpected keyword argument 'restaurant_name'`

**This is the error you are most likely to be looking at.**

You wrote `open_form('Menu', restaurant_name=...)` but `Menu.__init__` still says
`def __init__(self, **properties)`.

Anvil writes that line for you and it does not know you are about to pass
something in. **You have to add the argument yourself:**

```python
    def __init__(self, restaurant_name=None, **properties):
```

`self` first, your argument in the middle, `**properties` last. The spelling has
to match the `open_form` line exactly.

The three forms that need an argument: `Menu` and `Order` take
`restaurant_name`, `ItemDetail` takes `item_row`.

### `TypeError: __init__() missing 1 required positional argument`

Same idea, one step further on. You added the argument but left off the `=None`:

```python
    def __init__(self, restaurant_name, **properties):     # crashes if opened plain
    def __init__(self, restaurant_name=None, **properties): # this one
```

Without a default, opening that form any other way, including Anvil opening it as
your startup form, is a crash.

---

## Errors about the server

### Something saying `No server function matching "get_menu"`

The wording of the error class around it varies between Anvil versions. The part
that identifies it is **"no server function matching"**, followed by the name you
called.

Three things cause this and it is worth checking all three:

1. The name in quotes does not match the name after `def`. `get_menu` and
   `get_menus` are different functions.
2. `@anvil.server.callable` is missing from above the function, or is spelled
   wrong, or has an empty line between it and the `def`. It has to sit directly
   on top.
3. The function is in a **Client Module** or a Form instead of a **Server
   Module**. Look at which file it is in.

### `TypeError: get_menu() takes 1 positional argument but 2 were given`

You passed one thing too many.

```python
anvil.server.call('get_menu', restaurant_name)   # one argument
```

The function name in quotes is **not** an argument. Everything after it is.

### Something about not being able to serialise, or send, a value

You returned a search result without wrapping it in `list()`.

```python
    return app_tables.menu_items.search(restaurant=restaurant_name)          # no
    return list(app_tables.menu_items.search(restaurant=restaurant_name))    # yes
```

---

## No error at all, but it is wrong

These are worse than errors, because nothing tells you where to look.

### The list is empty and the server console says there are rows

Your RepeatingPanel has no **Item Template** set. Click the panel, look at
Properties, and choose the row form.

### The right number of rows appear but they are all blank

The panel is fine. The row form is the problem: the labels on it are named
something other than what the code says, or the column names in `self.item[...]`
do not match your table.

**Count the blank rows.** If there are four restaurants and four blank lines, the
data arrived and the row form is not showing it. That one observation splits this
bug in half.

### Every restaurant shows the same menu, or an empty one

The `restaurant` column in `menu_items` does not exactly match the `name` column
in `restaurants`.

Put the two tables side by side and read them character by character. Capital
letters count. **A space on the end is invisible and counts.** This is the single
most common non-error bug in this app.

### The price filter always finds nothing

The choices in `dd_price_range.items` are not spelled the way the `price_range`
column spells them. `$$` in the dropdown and `Medium` in the table will never
match, and nothing will tell you.

### The order saves even though the address was empty

A `return` is missing after one of the `show_error` calls, or the checks are
underneath `anvil.server.call('place_order', ...)` instead of above it.

Read the order of the lines in `btn_place_order_click` from top to bottom and
ask: is there any way to reach the save line with an empty address? That is the
real test, and your Card 2 is only met when the answer is no.

### Something you unticked is in the order

The `change` handler on `OrderRow` is missing, or it is attached to the wrong
component.

Click `chk_order_item` in Design view, look for **change** in the events list on
the right, and make sure it points at `chk_order_item_change`.

### Prices show as `$8.5`

You wrote `f"${self.item['price']}"` and left out the `:.2f`.

---

## When your error is not on this page

Say so. It is a genuinely useful thing to report, not an admission that you could
not find it.

Bring three things and you will get an answer in about a minute:

1. **The last line of the red text**, copied exactly.
2. **Which file and which line** Anvil highlighted.
3. **What you had just clicked** when it happened.

Without those three, the first five minutes of anybody helping you is spent
getting them, and you can get them faster than they can.

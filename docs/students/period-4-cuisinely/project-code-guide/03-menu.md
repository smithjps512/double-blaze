# 3. Feature 2: one restaurant's menu

No em dashes anywhere in this document or any copy it generates.

**Your Card 2, first half.** Choosing a restaurant shows only that restaurant's
menu.

The word doing the work in that sentence is **only**. Showing every menu item in
the database is easy and wrong. Showing one restaurant's is this page.

Two forms again: `Menu`, and `MenuRow` for one line of it.

## Menu

```python
from ._anvil_designer import MenuTemplate
from anvil import *
import anvil.server


class Menu(MenuTemplate):
    def __init__(self, restaurant_name=None, **properties):
        self.init_components(**properties)

        self.restaurant_name = restaurant_name
        self.lbl_restaurant_name.text = restaurant_name

        self.rp_menu_items.items = anvil.server.call('get_menu', restaurant_name)
```

### Catching what the last screen threw

```python
    def __init__(self, restaurant_name=None, **properties):
```

Compare this with the `Restaurants` form, which just said
`def __init__(self, **properties)`. The difference is `restaurant_name=None`, and
it is the other half of the `open_form('Menu', restaurant_name=...)` line from
the last page.

**Anvil writes `def __init__(self, **properties)` for you and you have to add the
argument yourself.** Nothing in the designer does this. That is why this trips
everybody up: the form looks finished and it is not.

The `=None` is a default, and it is there so that opening this form with nothing
gives you a blank screen instead of a crash. A blank screen is much easier to
work out than a crash.

Three rules for this line, and breaking any one of them gives you an error that
does not obviously point here:

1. **`self` first.** Always.
2. **Your argument in the middle**, spelled exactly as the other form spells it.
3. **`**properties` last.** It has to be last. Anvil puts things in there and
   `init_components` needs them.

```python
        self.restaurant_name = restaurant_name
```

This line looks like it does nothing. It does something important.

`restaurant_name` on its own is a **local variable**. It exists inside `__init__`
and it is gone the moment `__init__` finishes. If a button on this screen needs
the restaurant name later, it cannot have it.

Writing it onto `self` **keeps it for as long as the screen is open**, and any
other method on this form can read `self.restaurant_name`. That is what `self`
is for: it is the screen's memory.

We do not actually need it on this particular form, because `MenuRow` gets the
restaurant from its own row. It is here because you will need it on the very next
screen and it is easier to see the difference when both are in front of you.

```python
        self.rp_menu_items.items = anvil.server.call('get_menu', restaurant_name)
```

The same shape as the restaurant list: ask the server, hand the list to the
panel. The only difference is that this time you are passing something in, and
that argument is the entire reason the menu is the right menu.

## MenuRow

Create it as a form called `MenuRow` and set it as the **Item Template** of
`rp_menu_items`.

Components: `lbl_item_name`, `lbl_item_price`, and a button called `btn_more`.

```python
from ._anvil_designer import MenuRowTemplate
from anvil import *


class MenuRow(MenuRowTemplate):
    def __init__(self, **properties):
        self.init_components(**properties)

        self.lbl_item_name.text = self.item['item']
        self.lbl_item_price.text = f"${self.item['price']:.2f}"

    @handle("btn_more", "click")
    def btn_more_click(self, **event_args):
        open_form('ItemDetail', item_row=self.item)
```

### Money, printed properly

```python
        self.lbl_item_price.text = f"${self.item['price']:.2f}"
```

The `:.2f` inside the curly brackets means **two numbers after the point,
always**. Without it, a price of `8.5` shows on screen as `$8.5`, which no menu
anywhere has ever said.

The `$` at the front is just a dollar sign you typed. It is outside the curly
brackets, so it is not part of the calculation.

This is a small thing and it is the difference between an app that looks like a
school project and one that does not. There are a lot of small things like this
and they are all worth ten seconds.

### Handing over a whole row

```python
        open_form('ItemDetail', item_row=self.item)
```

Last time we passed a name, which is one piece of text. This time we pass
`self.item`, which is **the entire row**: the item, the price, the calories, the
information, all of it, in one go.

You are allowed to do that, and here it is the better choice. The alternative
would be passing the item's name and having `ItemDetail` go back to the server to
look the row up again. That is a second server call, a second chance to spell
something wrong, and a second thing to go wrong, all to fetch something you were
already holding.

**Pass what you already have.** Look it up again only when you do not.

Notice we are not passing the restaurant name here. We do not need to: a
`menu_items` row already has a `restaurant` column on it, so `ItemDetail` can
read it straight off the row when it needs to get back to the menu. Your table
design is doing you a favour.

## Test it

1. Server console: `anvil.server.call('get_menu', 'one of your restaurant names')`
   gives back rows. **Type a real name from your table**, exactly.
2. Open a restaurant from the list. The name at the top is the one you clicked.
3. Only that restaurant's items are listed.
4. Open a different restaurant. Different items.
5. Click **more** on an item. The detail screen opens.

**If the menu is empty for every restaurant**, step 1 is where the problem is:
the `restaurant` column in `menu_items` does not hold the same text as the `name`
column in `restaurants`. Look at both tables side by side and read the spelling
character by character. A trailing space is invisible and counts.

**If the menu shows every item from every restaurant**, you have called
`get_menu` without the argument, or `get_menu` is searching without the filter.
Check both files.

**If you get `TypeError: __init__() got an unexpected keyword argument
'restaurant_name'`**, you passed it but you never added it to `Menu.__init__`.
That one is on this page, near the top.

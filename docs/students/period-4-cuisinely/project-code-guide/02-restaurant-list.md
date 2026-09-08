# 2. Feature 1: the restaurant list

No em dashes anywhere in this document or any copy it generates.

**Your Card 1.** Every restaurant shows its name, address and rating, you can
narrow the list by price range, and it works without signing in.

This is the screen your architecture page tells you to build first, and it is the
right one, because it is the first time you see data you did not type appear on a
screen you made.

Two forms: `Restaurants`, and `RestaurantRow`, which describes one line of it.

## Restaurants

```python
from ._anvil_designer import RestaurantsTemplate
from anvil import *
import anvil.server


class Restaurants(RestaurantsTemplate):
    def __init__(self, **properties):
        self.init_components(**properties)

        self.dd_price_range.items = ["Any", "$", "$$", "$$$"]
        self.dd_price_range.selected_value = "Any"

        self.rp_restaurants.items = anvil.server.call('get_restaurants', "Any")

    @handle("btn_scan", "click")
    def btn_scan_click(self, **event_args):
        chosen = self.dd_price_range.selected_value
        self.rp_restaurants.items = anvil.server.call('get_restaurants', chosen)
```

### `__init__` is the screen opening

`__init__` runs **once, the moment the screen opens**, before anybody has done
anything. It is where you put everything that has to be true before the user
arrives.

```python
        self.init_components(**properties)
```

This line builds every component you dragged on in the designer. **It has to be
first.** Every line after it can talk about `self.dd_price_range` because
`init_components` has just made it exist. Put a line above it that mentions a
component and you get
`AttributeError: 'Restaurants' object has no attribute 'dd_price_range'`, and it
will look for all the world like you named something wrong.

```python
        self.dd_price_range.items = ["Any", "$", "$$", "$$$"]
        self.dd_price_range.selected_value = "Any"
```

Pattern 13. The first line fills the dropdown with choices. The second one picks
one so the box is not blank when the screen opens.

**"Any" is a choice you invented**, and it is doing real work: it is how somebody
gets back to the full list after filtering. A filter with no way off is a trap.
Notice that `get_restaurants` already understands `"Any"`, which is why it is
spelled the same in both files. Change it in one place and you have to change it
in the other.

The `$`, `$$` and `$$$` have to match what is in the `price_range` column of your
`restaurants` table **exactly**. If your table says `Cheap` and your dropdown
says `$`, filtering will always find nothing, with no error to tell you why.

```python
        self.rp_restaurants.items = anvil.server.call('get_restaurants', "Any")
```

Pattern 9 and Pattern 8 in one line, and it is worth reading right to left:

1. `anvil.server.call('get_restaurants', "Any")` asks the server for the rows.
2. `.items = ` hands that list to the RepeatingPanel.
3. The panel then makes **one copy of `RestaurantRow` for every row in the
   list**, all by itself.

You never write a loop. That is the part people find strange. You give the panel
a list and it does the rest.

### The scan button

```python
    @handle("btn_scan", "click")
    def btn_scan_click(self, **event_args):
```

Pattern 1. **If your Anvil did not write the `@handle` line, delete it** and keep
the rest. Both styles work. What does not work is having one style in the
designer and the other in your code, which is a real cause of "my button does
nothing".

```python
        chosen = self.dd_price_range.selected_value
        self.rp_restaurants.items = anvil.server.call('get_restaurants', chosen)
```

Read the dropdown, ask the server again with it, hand the new list to the panel.
**Setting `.items` a second time replaces everything on screen.** You do not
clear the old list first and you should not try to.

## RestaurantRow

This is a **separate form** and it describes one line of the list. Create it with
**+ > Form**, call it `RestaurantRow`, and then click your RepeatingPanel on
`Restaurants` and set its **Item Template** to it.

It needs four components on it: `lbl_name`, `lbl_address`, `lbl_rating` and a
button called `btn_view_menu`.

```python
from ._anvil_designer import RestaurantRowTemplate
from anvil import *


class RestaurantRow(RestaurantRowTemplate):
    def __init__(self, **properties):
        self.init_components(**properties)

        self.lbl_name.text = self.item['name']
        self.lbl_address.text = self.item['address']
        self.lbl_rating.text = f"{self.item['rating']} out of 5"

    @handle("btn_view_menu", "click")
    def btn_view_menu_click(self, **event_args):
        open_form('Menu', restaurant_name=self.item['name'])
```

### `self.item` is the one row this copy is showing

This is the idea in Pattern 9 that everybody has to read twice.

There is only **one** `RestaurantRow` form in your app. Anvil makes a copy of it
for every row in the list, and inside each copy, `self.item` is that copy's own
row. The tenth copy's `self.item` is the tenth restaurant. You never say which
one. Anvil has already decided before your `__init__` runs.

So `self.item['name']` reads the `name` column **of this row**. The square
brackets and the quotes matter, and the spelling inside the quotes has to match
your table's column name exactly.

```python
        self.lbl_rating.text = f"{self.item['rating']} out of 5"
```

Pattern 3, with an f-string. The `f` before the quote is what makes the
`{ }` work; without it you get the words `{self.item['rating']}` on screen, which
is a bug that looks exactly like what it is.

`.text` must always end up being **text**. A rating out of your table is a
number, and putting a bare number into `.text` is a common cause of red text. The
f-string turns it into text for you, which is a second reason to use one.

### Opening the next screen with something in its hands

```python
        open_form('Menu', restaurant_name=self.item['name'])
```

**This is the most important line in this whole folder**, and it is almost
certainly the thing you are stuck on.

Pattern 4 shows you `open_form('FormName')`. That opens a screen. But a menu
screen that does not know **which restaurant** is useless, and the Menu form has
no way of finding out on its own.

So you hand it over as you go: anything you write after the form name gets passed
straight into that form's `__init__`. Here we pass `restaurant_name`, and on the
next page you will see `Menu.__init__` catching it under exactly that name.

**The two spellings have to match.** `restaurant_name=` here and
`restaurant_name=None` there. If they do not, you get
`TypeError: __init__() got an unexpected keyword argument`, which is Python
saying "you handed me something and I do not know what it is called".

## Test it

1. Server console: `anvil.server.call('get_restaurants')` gives back rows.
2. Run the app. Every restaurant appears once, best rated at the top.
3. Pick `$` and press scan. The list gets shorter.
4. Pick `Any` and press scan. They all come back.
5. Click a restaurant. A menu screen opens, even if it is still empty.

If step 2 shows nothing at all but step 1 worked, your RepeatingPanel has no
**Item Template** set, or its name is not `rp_restaurants`.

If step 2 shows the right **number** of blank rows, the panel is fine and
`RestaurantRow` is the problem: check the component names on it.

Those two are different bugs with the same symptom, and telling them apart by
counting the blank rows is a trick worth keeping.

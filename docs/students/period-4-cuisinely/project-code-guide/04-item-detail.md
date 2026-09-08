# 4. Feature 3: calories and information

No em dashes anywhere in this document or any copy it generates.

**Your Card 3.** Clicking an item shows its calories, other information shows
too, and you can get back to the menu.

Your architecture page says of this screen: *"This is your third story and the
simplest screen in the app. Read the row, put the numbers in labels. If a screen
feels too easy, you have understood it."*

That is still true. One form, no server call, no list.

## ItemDetail

Components: `lbl_item_name`, `lbl_calories`, `lbl_information`,
`btn_add_to_order`, and a back button called `btn_back`.

```python
from ._anvil_designer import ItemDetailTemplate
from anvil import *


class ItemDetail(ItemDetailTemplate):
    def __init__(self, item_row=None, **properties):
        self.init_components(**properties)

        self.item_row = item_row

        self.lbl_item_name.text = item_row['item']
        self.lbl_calories.text = f"{item_row['calories']:.0f} calories"
        self.lbl_information.text = item_row['information']

    @handle("btn_add_to_order", "click")
    def btn_add_to_order_click(self, **event_args):
        open_form('Order', restaurant_name=self.item_row['restaurant'])

    @handle("btn_back", "click")
    def btn_back_click(self, **event_args):
        open_form('Menu', restaurant_name=self.item_row['restaurant'])
```

## `:.0f`, and why calories are not just a number

```python
        self.lbl_calories.text = f"{item_row['calories']:.0f} calories"
```

A Number column in Anvil holds a **decimal number**, even when everything you
typed into it was whole. So `item_row['calories']` is not `850`, it is `850.0`,
and without the `:.0f` your screen says **850.0 calories**, which no nutrition
label has ever said.

`:.0f` means "no numbers after the point". It is the same tool as the `:.2f` that
puts prices right on the menu, turned the other way.

This is worth noticing for a bigger reason than tidiness. **It is not an error.**
Nothing goes red, nothing gets logged, the app carries on. The only way to find
it is to look at your own screen and ask whether that is really what you meant to
show somebody. A lot of the difference between an app that feels finished and one
that does not is exactly this, found by looking.

## Why there is no server call on this screen

Every other screen starts with `anvil.server.call`. This one does not, and that
is not an omission.

`MenuRow` handed you the whole row when it opened this form. The calories are
already in your hands. Going back to the server to ask for a row you are holding
would be slower, would be more code, and would give you one more place to spell
a table name wrong.

**The fastest database query is the one you did not make.** Recognising when you
already have the answer is worth more than knowing another pattern.

## Where `self.item_row` earns its keep

```python
        self.item_row = item_row
```

On the Menu screen this line was there to show you the idea. Here it is doing
real work, and you can see exactly why by looking at the two buttons underneath.

Both of them say `self.item_row['restaurant']`. Both of them run **long after**
`__init__` has finished, when somebody eventually clicks. The plain
`item_row` variable is long gone by then. `self.item_row` is still there, because
it belongs to the screen rather than to `__init__`.

Take that one line out and both buttons break with
`AttributeError: 'ItemDetail' object has no attribute 'item_row'`. Which is worth
doing once, on purpose, so that when you see that error in real life you know
what it means.

## `self.item` and `self.item_row` are not the same thing

This catches people, so read it slowly.

- **`self.item`** is something **Anvil** sets, and it only exists on a form that
  is the item template of a RepeatingPanel. `RestaurantRow` and `MenuRow` have
  one. You never assign it.
- **`self.item_row`** is something **you** set, on this line, because you chose
  that name. You could have called it `self.dinner`. It would work identically.

`ItemDetail` is not inside a RepeatingPanel, so it has no `self.item` at all.
Writing `self.item['calories']` on this form gives you
`AttributeError: 'ItemDetail' object has no attribute 'item'`, and it is a very
easy mistake to make five minutes after writing `MenuRow`.

## The two buttons

```python
        open_form('Order', restaurant_name=self.item_row['restaurant'])
```

Both of them read the restaurant off the row rather than out of a variable
somebody passed in. This is why we did not bother passing the restaurant name to
`ItemDetail`: a `menu_items` row already knows which restaurant it belongs to.

**A back button matters more than it sounds.** Your Card 3 lists it as a
criterion, and without one, a person who opens an item is stuck on that screen
forever. Anvil has no browser back button behaviour of its own here. If you do
not build the way out, there is no way out.

## Something to notice about your own criteria

Card 3 says *"Other information about the item shows too."*

`self.lbl_information.text = item_row['information']` satisfies that, and it does
it in a single line, and it only works because somebody made an `information`
column when the table was designed. That column is not clever. It is just there.

The whole feature took four lines because the table was the right shape. Most
features that turn out to be hard are hard because of a decision made about a
table three weeks earlier. That is worth knowing before you design your next one.

## Test it

1. Open a restaurant, then an item.
2. The name is the item you clicked, not a different one.
3. The calories show, with the word "calories" after them.
4. The information shows.
5. Press back. You are on the right restaurant's menu, not somebody else's.
6. Press add to order. The order screen opens.

If step 5 lands you on the wrong menu, `self.item_row['restaurant']` is not the
restaurant you think it is. Look at that row in your `menu_items` table.

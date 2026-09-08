# 5. Feature 4: placing an order

No em dashes anywhere in this document or any copy it generates.

**Your Card 2, second half.** You can pick items and enter your address,
ordering without an address is refused, and you are told the order was placed.

This is the biggest screen in your app and the only one where the user can get it
wrong. Your architecture page lists five patterns for it, in order: **1**, **2**,
**6**, **7**, **5**. Click, read, check, save, tell. You will see all five below
in exactly that order.

Two forms: `Order`, and `OrderRow` for one tickable line.

## The problem this screen has to solve

Every other screen shows you things. This one has to **remember** things: which
boxes you ticked, while you go on ticking others.

There are several ways to hold on to that. The one below is the smallest one that
really works, and it uses something you have already got.

## Order

Components: `rp_order_items`, `txt_name`, `txt_address`, `btn_place_order`,
`lbl_error`.

```python
from ._anvil_designer import OrderTemplate
from anvil import *
import anvil.server


class Order(OrderTemplate):
    def __init__(self, restaurant_name=None, **properties):
        self.init_components(**properties)

        self.restaurant_name = restaurant_name
        self.lbl_error.visible = False

        rows = anvil.server.call('get_menu', restaurant_name)

        choices = []
        for row in rows:
            choices.append({
                'item': row['item'],
                'price': row['price'],
                'chosen': False
            })

        self.rp_order_items.items = choices

    @handle("btn_place_order", "click")
    def btn_place_order_click(self, **event_args):
        name = self.txt_name.text
        address = self.txt_address.text

        wanted = []
        for choice in self.rp_order_items.items:
            if choice['chosen']:
                wanted.append(choice['item'])

        if not address:
            self.show_error("Type an address so we know where to deliver it.")
            return

        if not wanted:
            self.show_error("Tick at least one thing to order.")
            return

        self.lbl_error.visible = False
        anvil.server.call('place_order', name, address, ", ".join(wanted))
        Notification("Your order is on its way.").show()
        open_form('Restaurants')

    def show_error(self, message):
        self.lbl_error.text = message
        self.lbl_error.visible = True
```

## OrderRow

Components: `lbl_order_item_name` and a CheckBox called `chk_order_item`.

```python
from ._anvil_designer import OrderRowTemplate
from anvil import *


class OrderRow(OrderRowTemplate):
    def __init__(self, **properties):
        self.init_components(**properties)

        self.lbl_order_item_name.text = f"{self.item['item']}  ${self.item['price']:.2f}"
        self.chk_order_item.checked = self.item['chosen']

    @handle("chk_order_item", "change")
    def chk_order_item_change(self, **event_args):
        self.item['chosen'] = self.chk_order_item.checked
```

## The idea that makes this work

This is the clever part of your app. It is four lines and it is worth ten
minutes.

### Building your own list instead of using the table's

```python
        choices = []
        for row in rows:
            choices.append({
                'item': row['item'],
                'price': row['price'],
                'chosen': False
            })
```

Every other screen handed the rows from the server straight to the panel. This
one does not. It builds a **new list of plain Python dictionaries**, copying
across only the two things the screen needs, and adding one thing the table does
not have: **`chosen`**.

`chosen` is not a column. It never goes near your database. It is a fact about
right now, on this screen, in this person's browser, and it stops existing the
moment they leave. That is exactly what it should be. Do not add a `chosen`
column to your `menu_items` table: two people ordering at once would tick each
other's boxes.

A dictionary is written with curly brackets and reads like a small table: a name,
a colon, a value. `choice['item']` gets a value out by name, exactly like reading
a column off a row. That is not a coincidence. Anvil rows behave like
dictionaries on purpose, which is why the rest of your code barely changes.

### Why ticking a box on one form changes a list on another form

```python
        self.item['chosen'] = self.chk_order_item.checked
```

One line, on `OrderRow`, and it is the whole mechanism.

`self.item` on a row form **is not a copy** of the dictionary in `choices`. It is
that dictionary. The same one. The panel handed each row a reference to an entry
in the list, so writing to `self.item['chosen']` writes straight into the list
that `Order` is still holding.

So by the time somebody presses the button, `self.rp_order_items.items` has
`chosen` set correctly for every line, without `Order` and `OrderRow` ever
talking to each other directly.

**This only works because they are dictionaries you made.** It is worth knowing
that this is one of the two or three genuinely surprising behaviours in Python,
and it catches professionals as often as it catches you.

```python
        self.chk_order_item.checked = self.item['chosen']
```

The line in `__init__` is the same idea running the other way: the box shows what
the dictionary says. It looks pointless when everything starts as `False`, and it
is what makes the screen still correct if you ever set something to already
ticked.

## Checking before you act

```python
        if not address:
            self.show_error("Type an address so we know where to deliver it.")
            return
```

Pattern 6, twice, and the order of the lines is the point.

**`if not address:`** is true when the box is empty. Anvil hands you `""` for an
empty TextBox, and Python treats empty text as false, so `not address` means "the
address is missing". You can write `if address == "":` instead and it means the
same thing. `if not address:` also survives the box handing you `None`, which it
can.

**`return` leaves the method immediately.** Nothing after it runs. That is what
makes this a refusal rather than a complaint: your Card 2 says ordering without
an address is **refused**, and a message on screen followed by the order saving
anyway is not a refusal, it is a lie.

**Both checks happen before `place_order` is called.** Look at the order of the
lines and satisfy yourself that there is no path through this method that saves
a bad order. That is the actual test, and reading for it is a skill.

We check for an empty basket too, which is not on your card. An order for nothing
is not a thing a delivery app should accept, and noticing a missing criterion
while you build is normal. **Go and add it to Card 2.**

### `show_error`

```python
    def show_error(self, message):
        self.lbl_error.text = message
        self.lbl_error.visible = True
```

A method you wrote, that is not a button handler and not `__init__`. You are
allowed to make these and you should.

Both refusals need the same two lines. Written out twice, the day you decide the
error should be red you have to remember there were two of them. Written once,
there is one place to change. Your architecture page starts `lbl_error` invisible
and this is what turns it on.

## Saving it

```python
        anvil.server.call('place_order', name, address, ", ".join(wanted))
```

Pattern 7. Three things go across: the name, the address, and the items as one
piece of text.

**`", ".join(wanted)`** turns a list like `['Burger', 'Fries']` into the text
`"Burger, Fries"`. The `", "` at the front is the glue that goes between them.
This is here because your `orders` table has one text column called `items`, so
the list has to become a sentence before it can be saved.

Is that the best design? No. A proper answer would be a second table with one row
per item in an order, so that you could count how many burgers you sold this
month. You cannot do that with a sentence. **Your table shape has decided what
questions you can ask later**, and that is a real thing to bring up in a design
review rather than a mistake to feel bad about. For four screens and one term,
the sentence is fine.

```python
        Notification("Your order is on its way.").show()
        open_form('Restaurants')
```

Pattern 5, then Pattern 4. Tell them it worked, then take them somewhere sensible
so they are not staring at a form that looks like it did nothing.

**`Notification` and not `alert`.** The Pattern Book's rule: `alert` for
something that must be read, `Notification` for something nice. Making somebody
click OK to acknowledge good news is how you annoy people.

## Test it

Test the refusals first. Everybody tests the happy path and everybody's app
breaks on the other one.

1. Press order with nothing ticked and no address. **You should see the address
   message and no order should save.**
2. Type an address, tick nothing, press order. You should see the second message.
3. Check your `orders` table. **It should still be empty.** This is the real
   test, and it is the one people skip.
4. Now tick two items, type an address and a name, and press order.
5. One row appears in `orders`, with both items in it, separated by a comma.
6. The time is filled in and you never typed it.
7. Tick a box, untick it, tick a different one, then order. Only the last one
   ordered should be in the row.

Step 7 is the test of the dictionary idea. If your order contains something you
unticked, the `change` handler on `OrderRow` is missing or is not attached to
`chk_order_item`.

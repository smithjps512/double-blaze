# 1. The Server Module

No em dashes anywhere in this document or any copy it generates.

**Start here.** Nothing on any screen works until this file exists, because every
screen in your app asks the server for its data.

## Why this is a separate file

Your forms run in the browser, on somebody's laptop. Your tables live on Anvil's
server. Code in a form **cannot touch a table**, ever, and that is a deliberate
safety rule rather than an Anvil quirk: if a browser could reach your tables,
anybody could open the developer tools and help themselves.

So database code goes in a **Server Module**, and forms ask it for things by
name. Two pieces, always:

- The server function is marked `@anvil.server.callable`. That decorator is what
  makes it reachable at all. Without it the function exists and nothing can call
  it.
- The form says `anvil.server.call('the_name', arguments)`. **The name in quotes
  must match the name after `def` exactly**, letter for letter. This is the
  single most common cause of the errors you are getting.

If you do not have a Server Module yet: in the Anvil editor, click the **+**
next to your app's files and choose **Server Module**. It will be called
`ServerModule1`. Leave it called that.

## The whole file

```python
import anvil.server
import anvil.tables as tables
from anvil.tables import app_tables
import datetime


@anvil.server.callable
def get_restaurants(price_range="Any"):
    """Every restaurant, best rated first.

    Pass a price range to narrow it, or "Any" for all of them.
    """
    if price_range == "Any":
        rows = app_tables.restaurants.search(
            tables.order_by("rating", ascending=False)
        )
    else:
        rows = app_tables.restaurants.search(
            tables.order_by("rating", ascending=False),
            price_range=price_range
        )
    return list(rows)


@anvil.server.callable
def get_menu(restaurant_name):
    """Every menu item belonging to one restaurant."""
    return list(app_tables.menu_items.search(restaurant=restaurant_name))


@anvil.server.callable
def place_order(customer, address, items):
    """Save one order. items is a sentence like "Burger, Fries"."""
    app_tables.orders.add_row(
        customer=customer,
        address=address,
        items=items,
        placed=datetime.datetime.now()
    )
```

That is the entire server side of your app. Three functions. It is shorter than
you expected and that is the correct amount of surprised to be.

## Reading it a piece at a time

### The imports

```python
import anvil.server
import anvil.tables as tables
from anvil.tables import app_tables
import datetime
```

All four are needed and none of them is optional:

- `anvil.server` is what `@anvil.server.callable` comes from.
- `app_tables` is how you reach your tables. Miss this line and you get
  `NameError: name 'app_tables' is not defined`, which is the error on the red
  text page.
- `import anvil.tables as tables` is only there for `tables.order_by`. It is a
  different import from the one above it, and you need both. That looks like a
  mistake and is not.
- `datetime` is for stamping the time on an order.

### `get_restaurants`

```python
def get_restaurants(price_range="Any"):
```

The `="Any"` is a **default**. It means somebody can call this function with no
argument at all and Python will act as though they passed `"Any"`. It saves you
having to remember, and it means the list is never accidentally empty.

```python
    if price_range == "Any":
        rows = app_tables.restaurants.search(
            tables.order_by("rating", ascending=False)
        )
    else:
        rows = app_tables.restaurants.search(
            tables.order_by("rating", ascending=False),
            price_range=price_range
        )
```

Two searches, and the only difference is the second one has a filter on it. That
is Pattern 11 with Pattern 6 wrapped round it, exactly as your architecture page
says Feature 1 should be.

**`tables.order_by("rating", ascending=False)`** sorts by the rating column,
biggest first. `ascending=False` is the bit that means "biggest first". Take it
out and your worst restaurant is at the top.

**`price_range=price_range`** looks like nonsense and is not. The left one is the
name of a **column in your table**. The right one is the name of the **argument
to this function**. They happen to be spelled the same because that is the
clearest thing to call both of them. Read it as: find rows where the column
`price_range` equals the value we were handed.

```python
    return list(rows)
```

`search()` hands back something that behaves like a list but is not one. Wrapping
it in `list()` makes it a real list, which is what has to travel back to the
browser. **Forget this and you will get an error about something not being
serialisable**, which is a long word meaning "this cannot be sent".

### `get_menu`

```python
    return list(app_tables.menu_items.search(restaurant=restaurant_name))
```

One line, and it is the line your whole Menu screen is built on. Your
`menu_items` table has a `restaurant` column holding the restaurant's **name as
text**, so searching for a name gets you only that restaurant's items.

This is why the spelling in `menu_items.restaurant` must match
`restaurants.name` exactly. `Tony's Pizza` and `Tonys Pizza` are two different
restaurants as far as this line is concerned, and the second one has an empty
menu. If a menu comes up blank, check this before you check anything else.

### `place_order`

```python
    app_tables.orders.add_row(
        customer=customer,
        address=address,
        items=items,
        placed=datetime.datetime.now()
    )
```

Pattern 7, straight. Every name on the **left** of an `=` is a column in your
`orders` table and has to be spelled the way the table spells it. Every name on
the right is a value this function was handed.

`datetime.datetime.now()` is the time right now, worked out by the server. Note
that it is **not** something the user types. A time somebody can type is a time
somebody can lie about, and the whole reason for an order having a timestamp is
that it is true.

`items` arrives as one piece of text, like `"Burger, Fries"`. The Order screen
does the joining up before it calls this. That is on page 5.

## Test it before you build a single screen

In the Anvil editor there is a **server console** at the bottom. Type this into
it and press enter:

```python
anvil.server.call('get_restaurants')
```

You should see a list of rows come back. If you do:

- your Server Module is saved,
- your function is spelled the way you think it is,
- `@anvil.server.callable` is really there,
- and your table actually has rows in it.

That is four separate things you no longer have to wonder about while you are
debugging a screen. **Do this before every screen.** Working out whether the
problem is the server or the form, before you start looking, saves more time than
anything else in this folder.

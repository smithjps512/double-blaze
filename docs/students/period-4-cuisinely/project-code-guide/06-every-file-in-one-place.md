# 6. Every file, in one place

No em dashes anywhere in this document or any copy it generates.

Nothing but code. No explanations. Seven files, in the order you should build
them.

If you have arrived here first, go back to `README.md` and read the one rule. It
matters more on this page than any other, because this is the page you can copy
without thinking, and copying without thinking is how you end up in exactly the
same position in two weeks with a bigger app.

The explanations for every line are on pages 1 to 5.

---

## `ServerModule1`

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

---

## `Restaurants`

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

---

## `RestaurantRow`

Item template of `rp_restaurants`.

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

---

## `Menu`

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

---

## `MenuRow`

Item template of `rp_menu_items`.

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

---

## `ItemDetail`

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

---

## `Order`

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

---

## `OrderRow`

Item template of `rp_order_items`.

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

---

## Every name this app depends on

If one of these is spelled differently in your app than it is here, the code on
this page will not run. Check the list before you check anything else.

**Forms:** `Restaurants`, `RestaurantRow`, `Menu`, `MenuRow`, `ItemDetail`,
`Order`, `OrderRow`

**Tables and their columns:**

| Table | Columns |
|---|---|
| `restaurants` | `name`, `address`, `rating`, `price_range` |
| `menu_items` | `restaurant`, `item`, `price`, `calories`, `information` |
| `orders` | `customer`, `address`, `items`, `placed` |

**Components, by the form they live on:**

| Form | Components |
|---|---|
| `Restaurants` | `rp_restaurants`, `dd_price_range`, `btn_scan` |
| `RestaurantRow` | `lbl_name`, `lbl_address`, `lbl_rating`, `btn_view_menu` |
| `Menu` | `lbl_restaurant_name`, `rp_menu_items` |
| `MenuRow` | `lbl_item_name`, `lbl_item_price`, `btn_more` |
| `ItemDetail` | `lbl_item_name`, `lbl_calories`, `lbl_information`, `btn_add_to_order`, `btn_back` |
| `Order` | `rp_order_items`, `txt_name`, `txt_address`, `btn_place_order`, `lbl_error` |
| `OrderRow` | `lbl_order_item_name`, `chk_order_item` |

**Server functions:** `get_restaurants`, `get_menu`, `place_order`

Your architecture page is missing six of these. `README.md` says which, and asks
you to go and add them.

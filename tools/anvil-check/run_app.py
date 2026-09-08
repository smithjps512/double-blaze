"""Extract the guide's seven files and actually run them against the stub.

The point is not that the code parses. It is that a student following the guide
gets a working app: the right menu for the right restaurant, a refused order
with no address, and an orders row containing exactly what was ticked.
"""
import re, sys, pathlib, types
import anvil_stub as A

GUIDE = pathlib.Path(__file__).resolve().parents[2] / "docs/students/period-4-cuisinely/project-code-guide"
DATA = GUIDE

blocks = {}
text = (GUIDE / "06-every-file-in-one-place.md").read_text()
for m in re.finditer(r"^## `(\w+)`\n(.*?)```python\n(.*?)```", text, re.S | re.M):
    blocks[m.group(1)] = m.group(3)

expected = ["ServerModule1", "Restaurants", "RestaurantRow", "Menu", "MenuRow",
            "ItemDetail", "Order", "OrderRow"]
missing = [n for n in expected if n not in blocks]
assert not missing, f"guide is missing listings for {missing}"

# Components each form declares, taken from the guide's own name table.
COMPONENTS = {
    "Restaurants":   {"rp_restaurants": A.RepeatingPanel, "dd_price_range": A.DropDown,
                      "btn_scan": A.Button},
    "RestaurantRow": {"lbl_name": A.Label, "lbl_address": A.Label,
                      "lbl_rating": A.Label, "btn_view_menu": A.Button},
    "Menu":          {"lbl_restaurant_name": A.Label, "rp_menu_items": A.RepeatingPanel},
    "MenuRow":       {"lbl_item_name": A.Label, "lbl_item_price": A.Label,
                      "btn_more": A.Button},
    "ItemDetail":    {"lbl_item_name": A.Label, "lbl_calories": A.Label,
                      "lbl_information": A.Label, "btn_add_to_order": A.Button,
                      "btn_back": A.Button},
    "Order":         {"rp_order_items": A.RepeatingPanel, "txt_name": A.TextBox,
                      "txt_address": A.TextBox, "btn_place_order": A.Button,
                      "lbl_error": A.Label},
    "OrderRow":      {"lbl_order_item_name": A.Label, "chk_order_item": A.CheckBox},
}

app_tables = A.AppTables(str(DATA))

def env_for(name):
    """The namespace a file sees, standing in for its imports."""
    server = types.SimpleNamespace(callable=A.callable_, call=A.call,
                                   NoServerFunctionError=A.NoServerFunctionError)
    anvil = types.SimpleNamespace(server=server)
    ns = {
        "anvil": anvil, "app_tables": app_tables,
        "tables": types.SimpleNamespace(order_by=A.order_by),
        "open_form": A.open_form, "alert": A.alert,
        "Notification": A.Notification, "handle": A.handle,
        "__name__": name,
    }
    if name in COMPONENTS:
        tpl = type(f"{name}Template", (A.FormTemplate,), {"COMPONENTS": COMPONENTS[name]})
        ns[f"{name}Template"] = tpl
    return ns

FORMS = {}
IMPORT = re.compile(r"^(from \._anvil_designer import .*|from anvil import \*|import anvil\.server|import anvil\.tables as tables|from anvil\.tables import app_tables|import datetime)$", re.M)

for name in expected:
    src = IMPORT.sub("", blocks[name])
    if name == "ServerModule1":
        src = "import datetime\n" + src
    ns = env_for(name)
    exec(compile(src, f"{name}.py", "exec"), ns)
    if name in COMPONENTS:
        FORMS[name] = ns[name]

A.ITEM_TEMPLATES.update({
    "rp_restaurants": FORMS["RestaurantRow"],
    "rp_menu_items": FORMS["MenuRow"],
    "rp_order_items": FORMS["OrderRow"],
})

def click(form, component):
    for attr in dir(form):
        fn = getattr(form, attr, None)
        if callable(fn) and getattr(fn, "_handles", None) == (component, "click"):
            return fn()
    raise AssertionError(f"no click handler wired to {component} on {type(form).__name__}")

def change(form, component):
    for attr in dir(form):
        fn = getattr(form, attr, None)
        if callable(fn) and getattr(fn, "_handles", None) == (component, "change"):
            return fn()
    raise AssertionError(f"no change handler wired to {component}")

ok = []
def check(label, cond):
    ok.append((label, bool(cond)))
    print(("  PASS  " if cond else "  FAIL  ") + label)

print("Feature 1: the restaurant list")
r = FORMS["Restaurants"]()
check("all six restaurants listed", len(r.rp_restaurants.items) == 6)
check("best rated first", r.rp_restaurants.items[0]["name"] == "Harbour Grill")
check("a row shows its name", r.rp_restaurants.rows[0].lbl_name.text == "Harbour Grill")
check("a row shows its rating as text", r.rp_restaurants.rows[0].lbl_rating.text == "4.9 out of 5")
check("dropdown offers a way back to everything", "Any" in r.dd_price_range.items)

r.dd_price_range.selected_value = "$"
click(r, "btn_scan")
check("filtering narrows the list", len(r.rp_restaurants.items) == 2)
check("filter kept only the cheap ones",
      all(x["price_range"] == "$" for x in r.rp_restaurants.items))
r.dd_price_range.selected_value = "Any"
click(r, "btn_scan")
check("Any brings them all back", len(r.rp_restaurants.items) == 6)

print("\nFeature 2: the menu")
A.OPENED.clear()
tonys = [i for i, x in enumerate(r.rp_restaurants.items)
         if x["name"] == "Tonys Pizza Kitchen"][0]
click(r.rp_restaurants.rows[tonys], "btn_view_menu")
check("clicking a restaurant opens Menu", A.OPENED[-1][0] == "Menu")
check("and carries the restaurant with it",
      A.OPENED[-1][1] == {"restaurant_name": "Tonys Pizza Kitchen"})

m = FORMS["Menu"](**A.OPENED[-1][1])
check("the menu names the restaurant", m.lbl_restaurant_name.text == "Tonys Pizza Kitchen")
check("only that restaurant's items", len(m.rp_menu_items.items) == 3)
check("no other restaurant leaked in",
      all(x["restaurant"] == "Tonys Pizza Kitchen" for x in m.rp_menu_items.items))
check("price printed with two decimals",
      m.rp_menu_items.rows[0].lbl_item_price.text == "$11.00")

other = FORMS["Menu"](restaurant_name="The Green Fork")
check("a different restaurant gives a different menu",
      {x["item"] for x in other.rp_menu_items.items} !=
      {x["item"] for x in m.rp_menu_items.items})
check("opening Menu with nothing does not crash", FORMS["Menu"]() is not None)

print("\nFeature 3: nutrition")
A.OPENED.clear()
click(m.rp_menu_items.rows[0], "btn_more")
check("more opens ItemDetail", A.OPENED[-1][0] == "ItemDetail")
d = FORMS["ItemDetail"](**A.OPENED[-1][1])
check("the item is the one clicked", d.lbl_item_name.text == "Margherita")
check("calories are shown", d.lbl_calories.text == "850 calories")
check("information is shown", "Vegetarian" in d.lbl_information.text)
A.OPENED.clear()
click(d, "btn_back")
check("back returns to the right menu",
      A.OPENED[-1] == ("Menu", {"restaurant_name": "Tonys Pizza Kitchen"}))
A.OPENED.clear()
click(d, "btn_add_to_order")
check("add to order opens Order for that restaurant",
      A.OPENED[-1] == ("Order", {"restaurant_name": "Tonys Pizza Kitchen"}))

print("\nFeature 4: placing an order")
o = FORMS["Order"](**A.OPENED[-1][1])
check("the error label starts hidden", o.lbl_error.visible is False)
check("every menu item is tickable", len(o.rp_order_items.items) == 3)
check("nothing starts ticked", all(not x["chosen"] for x in o.rp_order_items.items))

before = len(app_tables.orders.rows)
click(o, "btn_place_order")
check("empty order is refused", o.lbl_error.visible is True)
check("the refusal mentions the address", "address" in o.lbl_error.text.lower())
check("nothing was saved", len(app_tables.orders.rows) == before)

o.txt_address.text = "12 Test Road"
click(o, "btn_place_order")
check("an address with no items is refused", "Tick at least one" in o.lbl_error.text)
check("still nothing saved", len(app_tables.orders.rows) == before)

o.rp_order_items.rows[0].chk_order_item.checked = True
change(o.rp_order_items.rows[0], "chk_order_item")
o.rp_order_items.rows[2].chk_order_item.checked = True
change(o.rp_order_items.rows[2], "chk_order_item")
check("ticking a row reaches the Order form's list",
      [x["chosen"] for x in o.rp_order_items.items] == [True, False, True])

o.rp_order_items.rows[2].chk_order_item.checked = False
change(o.rp_order_items.rows[2], "chk_order_item")
o.rp_order_items.rows[1].chk_order_item.checked = True
change(o.rp_order_items.rows[1], "chk_order_item")
check("unticking works too",
      [x["chosen"] for x in o.rp_order_items.items] == [True, True, False])

o.txt_name.text = "A Student"
A.NOTIFICATIONS.clear(); A.OPENED.clear()
click(o, "btn_place_order")
check("one order saved", len(app_tables.orders.rows) == before + 1)
row = app_tables.orders.rows[-1]
check("it holds exactly what was ticked", row["items"] == "Margherita, Pepperoni")
check("nothing unticked got in", "Garlic Bread" not in row["items"])
check("the address was saved", row["address"] == "12 Test Road")
check("the name was saved", row["customer"] == "A Student")
check("the time was stamped by the server", row["placed"] is not None)
check("the user was told", A.NOTIFICATIONS == ["Your order is on its way."])
check("and taken somewhere sensible", A.OPENED[-1][0] == "Restaurants")

print("\nThe stub's own traps")
try:
    A.call("get_menus", "x"); check("a misspelt server call raises", False)
except A.NoServerFunctionError:
    check("a misspelt server call raises", True)

failed = [l for l, c in ok if not c]
print(f"\n{len(ok) - len(failed)}/{len(ok)} checks passed")
if failed:
    print("FAILED:"); [print("  -", f) for f in failed]
sys.exit(1 if failed else 0)

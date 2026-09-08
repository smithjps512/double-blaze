"""A stand-in for the parts of Anvil this app touches, so the guide's code can
actually be executed rather than only read."""
import csv, datetime, functools

# ---- data tables -----------------------------------------------------------
class Row(dict):
    pass

class Table:
    def __init__(self, rows): self.rows = rows
    def search(self, *args, **filters):
        out = [r for r in self.rows
               if all(str(r.get(k)) == str(v) for k, v in filters.items())]
        for a in reversed(args):
            if isinstance(a, OrderBy):
                out = sorted(out, key=lambda r: r[a.col], reverse=not a.ascending)
        return SearchIterator(out)
    def get(self, **filters):
        hits = list(self.search(**filters))
        return hits[0] if hits else None
    def add_row(self, **cols):
        r = Row(cols); self.rows.append(r); return r

class SearchIterator:
    """Deliberately NOT a list, like Anvil's, so a missing list() is caught."""
    def __init__(self, rows): self._rows = rows
    def __iter__(self): return iter(self._rows)

class OrderBy:
    def __init__(self, col, ascending=True): self.col, self.ascending = col, ascending

def order_by(col, ascending=True): return OrderBy(col, ascending)

def _load(path, numeric):
    rows = []
    for r in csv.DictReader(open(path)):
        for k in numeric: r[k] = float(r[k])
        rows.append(Row(r))
    return rows

class AppTables:
    def __init__(self, base):
        self.restaurants = Table(_load(f"{base}/restaurants.csv", ["rating"]))
        self.menu_items = Table(_load(f"{base}/menu_items.csv", ["price", "calories"]))
        self.orders = Table([])

# ---- server ----------------------------------------------------------------
REGISTRY = {}
def callable_(fn):
    REGISTRY[fn.__name__] = fn
    return fn

class NoServerFunctionError(Exception): pass

def call(name, *args, **kw):
    if name not in REGISTRY:
        raise NoServerFunctionError(f'No server function matching "{name}"')
    out = REGISTRY[name](*args, **kw)
    # Anvil can only send real lists across the wire.
    if isinstance(out, SearchIterator):
        raise TypeError("Cannot serialise a search iterator. Wrap it in list().")
    return out

# ---- forms -----------------------------------------------------------------
OPENED = []
NOTIFICATIONS = []
ALERTS = []

def open_form(name, **kw): OPENED.append((name, kw))
def alert(msg): ALERTS.append(msg)
class Notification:
    def __init__(self, msg): self.msg = msg
    def show(self): NOTIFICATIONS.append(self.msg)

class Component:
    def __init__(self, name): self._name = name; self.text = None; self.visible = True
class Label(Component): pass
class Button(Component): pass
class TextBox(Component):
    def __init__(self, name): super().__init__(name); self.text = ""
class CheckBox(Component):
    def __init__(self, name): super().__init__(name); self.checked = False
class DropDown(Component):
    def __init__(self, name): super().__init__(name); self.items = []; self.selected_value = None

ITEM_TEMPLATES = {}   # panel name -> row form class, set in the designer

class RepeatingPanel(Component):
    def __init__(self, name):
        super().__init__(name); self._items = []; self.rows = []
    @property
    def items(self): return self._items
    @items.setter
    def items(self, value):
        self._items = value
        self.rows = []
        tpl = ITEM_TEMPLATES.get(self._name)
        if tpl is None: return
        for it in value:                     # Anvil stamps one copy per entry
            row = tpl.__new__(tpl)
            row.item = it                    # Anvil sets self.item before __init__
            row.__init__()
            self.rows.append(row)

class FormTemplate:
    """Stands in for the generated ._anvil_designer template."""
    COMPONENTS = {}
    def init_components(self, **properties):
        for name, kind in self.COMPONENTS.items():
            setattr(self, name, kind(name))

def handle(component, event):
    """The decorator new Anvil writes. Records the wiring so the test can click."""
    def deco(fn):
        fn._handles = (component, event)
        return fn
    return deco

# PC BROS: build architecture

Team: The Dream Team. Tool: Anvil.

## The buildable slice

Your app is small, and that is an advantage. You can finish it.

**In the slice, in this order:**

1. Pick your parts
2. See the price add up
3. Place the order
4. See your orders

**Stubbed, and why:**

- **Actually building and shipping the PC.** That happens in a workshop, not in
  Anvil. Everything the customer touches is buildable.
- **Custom engravings.** A text box on the order. Add it once the four above
  work.

**Two things to settle.** Your plan calls the product both "The dream team" and
"PC BROS", so pick one. And your only story is written from the company's point
of view: "As a PC company I want to make money so I can be rich." That is a
business goal, not a user story. Your customer wants a good PC at a price they
can afford. Card 1 rewrites it that way, and it changes what you build.

## Screens to create

| Form name | What it is |
|---|---|
| `Builder` | Choose each part |
| `Review` | The full build and the total price |
| `MyOrders` | Orders you have placed |

## Components, with the exact names to use

**Builder:** `dd_cpu`, `dd_gpu`, `dd_ram`, `dd_storage`, `dd_case` (DropDowns);
`lbl_running_total`; `btn_review`

**Review:** `lbl_build_summary`, `lbl_total`, `txt_engraving`, `txt_address`,
`btn_place_order`, `lbl_error`

**MyOrders:** `rp_orders` with `lbl_order_line`, `lbl_order_status`

## Data tables

- **parts**: `category`, `name`, `price` (number)
- **orders**: `customer`, `build`, `total` (number), `engraving`, `address`, `status`, `placed` (date and time)

## How each feature gets built

### Feature 1: Pick your parts
Patterns: **8**, **13**.

Fill each dropdown from the parts table, one category each:
`app_tables.parts.search(category="CPU")`.

### Feature 2: The price adds up
Patterns: **13**, **3**, and a little arithmetic.

Read each dropdown's `selected_value`, add the prices, put the total in
`lbl_running_total`. Do it every time a dropdown changes, using the dropdown's
`change` event instead of a button click. That is Pattern 1 with a different
event name, which is a useful thing to discover.

### Feature 3: Place the order
Patterns: **6**, **7**, **5**, **4**.

Refuse an order with no address, or with a part left unchosen.

### Feature 4: See your orders
Patterns: **8**, **11**, **9**.

## What to do when you are stuck

1. Do not know what the app should do, go to your build card.
2. Do not know how to write it, go to the Pattern Book.
3. Do not know what fills the blank, come back here.

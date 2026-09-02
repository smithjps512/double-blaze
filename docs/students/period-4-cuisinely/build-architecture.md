# Cuisinely: build architecture

Team: Cuisinely. Tool: Anvil.

## The buildable slice

**In the slice, in this order:**

1. Restaurant list
2. Restaurant menu
3. Nutrition detail for a menu item
4. Place a delivery order

**Stubbed, and why:**

- **A real map.** Same as any map: it needs an outside service. Your list shows
  each restaurant with its address and rating, which delivers what your story
  asks for. The map is a picture on top of a list, and the list is the part that
  matters.
- **Ratings and reviews.** Your plan marks this optional and no story was
  written for it. Correctly parked.
- **Filters by taste and budget.** In your map story but not in your feature
  list. Add them to the plan, then build them: they are Pattern 13 plus
  Pattern 6, so they are within reach once the list works.

## Screens to create

| Form name | What it is |
|---|---|
| `Restaurants` | Every local restaurant |
| `Menu` | One restaurant's menu |
| `ItemDetail` | One item, with calories and information |
| `Order` | Choose items, enter address, submit |

## Components, with the exact names to use

**Restaurants:** `rp_restaurants` with `lbl_name`, `lbl_rating`, `lbl_address`;
`dd_price_range` (DropDown); `btn_scan`

**Menu:** `lbl_restaurant_name`, `rp_menu_items` with `lbl_item_name`,
`lbl_item_price`

**ItemDetail:** `lbl_item_name`, `lbl_calories`, `lbl_information`,
`btn_add_to_order`

**Order:** `rp_order_items`, `txt_address`, `btn_place_order`, `lbl_error`

## Data tables

- **restaurants**: `name`, `address`, `rating` (number), `price_range`
- **menu_items**: `restaurant` (text), `item`, `price` (number), `calories` (number), `information`
- **orders**: `customer`, `address`, `items`, `placed` (date and time)

## How each feature gets built

### Feature 1: Restaurant list
Patterns: **8**, **9**. Add **13** and **6** for the price range filter.

### Feature 2: Menu
Patterns: **1**, **4** to get here, then **8**, **9** to fill it.

To show only one restaurant's items, pass the restaurant name to your server
function and search with it: `app_tables.menu_items.search(restaurant=name)`.

### Feature 3: Nutrition detail
Patterns: **1**, **4**, **3**.

This is your third story and the simplest screen in the app. Read the row, put
the numbers in labels. If a screen feels too easy, you have understood it.

### Feature 4: Place an order
Patterns: **1**, **2**, **6**, **7**, **5**.

Check the address is not empty before saving. An order with no address is the
most obvious bug in a delivery app.

## What to do when you are stuck

1. Do not know what the app should do, go to your build card.
2. Do not know how to write it, go to the Pattern Book.
3. Do not know what fills the blank, come back here.

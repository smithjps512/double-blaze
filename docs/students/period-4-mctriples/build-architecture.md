# Drone Dropper: build architecture

Team: The McTriples. Tool: Anvil.

## The buildable slice

**In the slice, in this order:**

1. Browse food and place an order
2. Choose a heated or chilled box
3. Allergy question
4. Track your order
5. The delivery time guarantee

**Stubbed, and why:**

- **Actual drones.** Obviously. What you can build is everything the customer
  sees: the order, the box choice, the tracking status and the guarantee. That
  is the whole app from where the customer stands, and it is more than enough.
- **A live map of the drone.** Tracking is a status that moves through
  "preparing", "in the air" and "delivered". That is what tracking is underneath
  the picture.

**Two things to settle before you build.** Your two plans disagree: one says the
food is free if delivery takes over 2 hours, the other says 1 hour. Pick one and
write it down, because it is a number in your code. Also, two of your three
stories are the same story with different titles, which leaves the allergy
notification and the guarantee with no story at all.

## Screens to create

| Form name | What it is |
|---|---|
| `Menu` | Food you can order |
| `OrderOptions` | Box temperature and allergies |
| `Confirm` | Review and place the order |
| `Tracking` | Where your order is and the guarantee clock |

## Components, with the exact names to use

**Menu:** `rp_food` with `lbl_food_name`, `lbl_food_price`; `btn_next`

**OrderOptions:** `dd_box_type` (DropDown: Heated, Chilled, Neither),
`chk_has_allergy` (CheckBox), `txt_allergy` (TextBox, starts invisible),
`btn_next`

**Confirm:** `lbl_summary`, `txt_address`, `btn_place_order`, `lbl_error`

**Tracking:** `lbl_status`, `lbl_time_left`, `lbl_free_notice` (starts invisible)

## Data tables

- **food**: `name`, `price` (number), `category`
- **orders**: `customer`, `address`, `food`, `box_type`, `allergy`, `status`, `placed` (date and time)

## How each feature gets built

### Feature 1: Browse and order
Patterns: **8**, **9**, then **1**, **4**.

### Feature 2: Heated or chilled box
Patterns: **13**, then **2** when you save the order.

Your story says the loader is given a prompt to use the special box. The loader
is a person, not a screen. What the app does is record the choice on the order
so the loader can read it. Spotting the difference between what a person does
and what the app does is most of software design.

### Feature 3: Allergy question
Patterns: **14**, **6**, **2**.

The allergy box only appears when the checkbox is ticked, which is Pattern 14.
If it is ticked and the box is empty, refuse, which is Pattern 6.

### Feature 4: Track your order
Patterns: **8**, **3**.

Read the order's status and put it in a label. Add a button that moves the
status along so you can demonstrate it without owning a drone.

### Feature 5: The guarantee
Patterns: **6**, **14**, **3**.

Compare now against the order's placed time. If more than your agreed number of
hours have passed and the status is not delivered, show the free notice.

**This is the most interesting code in your app** and nobody wrote a story for
it. Write one.

## What to do when you are stuck

1. Do not know what the app should do, go to your build card.
2. Do not know how to write it, go to the Pattern Book.
3. Do not know what fills the blank, come back here.

# AI Room Arranger: build architecture

Team: Nyktilathraiophagos Productions. Tool: Anvil.

Your build cards send you here. This page sends you to the Pattern Book at
`docs/build/anvil-patterns.md`, and your designer's page, the design brief, is
made from this one.

*Teacher: drafted from the six cards. The two stubs below are the decisions
that matter; change them if you disagree and the design brief follows.*

## The buildable slice

Your plan asks for three things Anvil cannot do in a term: scan a room into a
3D model, have an AI recognise the furniture, and let you walk around the
result. That is not your idea being wrong. It is your idea being bigger than
the tool, which is true of most good ideas, and the job now is to find the
version of it that can be built and still does what your stories promise.

Read your three newest stories again. What they actually promise is: I can see
my room, I can move the things in it around, I can put things in and take
things out, and I can look at the result. All four of those can be built,
without any AI and without any 3D, like this:

- **The scan is a photo.** You take a picture of your room and upload it. The
  app keeps it and shows it at the top of the room's page.
- **You name the furniture, not the AI.** Type "bed", "desk", "shelf" and the
  app keeps the list. That is the only part of AI recognition that your stories
  need: a list of what is in the room.
- **Rearranging is choosing a spot.** Every piece of furniture has a spot:
  left wall, right wall, back wall, by the window, middle of the room. Moving
  the bed is changing its spot. The Layout screen shows what is at each spot,
  which is the room seen from above, in words.

**Build in this order:**

1. Sign in
2. Rooms
3. Furniture
4. Layout

**Stubbed, and why:**

- **AI recognition.** Teaching a model to see furniture in a photo is a
  university project, and your story's own criteria say so ("test and improve
  it a countless number of times"). Parked. You type the names instead, which
  takes five seconds a room.
- **3D view and "different angles".** Anvil has no 3D. The Layout screen is the
  room from above. If you want a second angle later, a second photo of the room
  from another wall is a real feature that is one pattern away.

## Screens to create

| Form name | What it is | Who sees it |
|---|---|---|
| `Rooms` | Your rooms, and a way to add one | Signed in users |
| `Room` | One room: its photo, and the furniture in it | Signed in users |
| `Layout` | The same room from above: what is at each spot | Signed in users |

There is no `SignIn` screen. Anvil has a sign in box built in (Pattern 12) and
the `Rooms` screen opens it when nobody is signed in.

## Components to create, with the exact names to use

Use these names. The Pattern Book's blanks are filled with these, and your
designer's Figma layers are named after them.

**Rooms:** `lbl_who` (who is signed in), `btn_sign_in`, `txt_room_name`,
`btn_add_room`, `lbl_error`, `rp_rooms` (RepeatingPanel) with `lbl_room_name`
and `btn_open` inside

**Room:** `lbl_room_name`, `img_room`, `fl_photo` (FileLoader), `btn_save_photo`,
`txt_item_name`, `dd_spot` (DropDown), `btn_add_item`, `lbl_error`, `btn_layout`,
`btn_back`, and `rp_furniture` (RepeatingPanel) with `lbl_item_name`,
`dd_item_spot` (DropDown) and `btn_remove` inside

**Layout:** `lbl_room_name`, `btn_back`, and `rp_spots` (RepeatingPanel) with
`lbl_spot_name` and `lbl_items` inside

Two prefixes you have not seen before: `fl_` is a FileLoader, the button that
opens the phone's camera or the file picker, and `dd_item_spot` inside a row is
how you move a piece of furniture: pick a new spot and it moves.

## Data tables

Your teacher creates these and tells you the exact names.

- **rooms**: `name`, `owner` (link to Users), `photo` (media)
- **furniture**: `room` (link to rooms), `name`, `spot`

The five spots are not a table. They are a list in your code, in one place,
so the two dropdowns cannot disagree:

```python
SPOTS = ["Left wall", "Right wall", "Back wall", "By the window", "Middle of the room"]
```

## How each feature gets built

### Feature 1: Sign in
Patterns, in order: **12**.

Turn on the Users service, put `anvil.users.login_with_form()` behind
`btn_sign_in`, and show who is signed in with `lbl_who`. Your card says the
password needs eight characters with upper and lower case; Anvil's built in
sign in has a minimum length setting, and that is where it goes.

**Build this first**, because every room belongs to somebody, and a room with
no owner cannot be saved for next time.

### Feature 2: Rooms
Patterns, in order: **2**, **6**, **7**, **8**, **9**, **1**, **4**.

Read the name from `txt_room_name`, refuse an empty one into `lbl_error`, save
it with the signed in user as `owner`, then get this user's rooms back and hand
them to `rp_rooms`. `btn_open` in each row opens `Room` with that row.

**The photo is the scan.** On `Room`, `fl_photo` gives you the picture the
moment somebody picks one; `btn_save_photo` saves it into the room's `photo`
column (Pattern 7, with a media column instead of text) and puts it in
`img_room` (Pattern 3). That is your Scan system card, done.

### Feature 3: Furniture
Patterns, in order: **13**, **2**, **6**, **7**, **8**, **9**, **10**.

Fill `dd_spot` from `SPOTS` (Pattern 13). Read the name, refuse an empty one,
save the row with the room and the spot, then list this room's furniture in
`rp_furniture`. Inside each row, `dd_item_spot` is filled from the same list
and its `change` event saves the new spot (Pattern 10). `btn_remove` deletes
the row. That is three cards at once: rearrange, move in and out, and
decorate.

The new idea here is the dropdown inside a repeating row. Each row is its own
little form, so `self.item` is the furniture row and changing its spot is
`self.item['spot'] = self.dd_item_spot.selected_value` followed by a refresh.

### Feature 4: Layout
Patterns, in order: **8**, **9**, **11**.

One row per spot, in the order of `SPOTS`, and inside each row the names of
the furniture at that spot joined with commas. No new patterns, and it is the
screen that makes the whole app make sense, so build it as soon as Feature 3
lists anything.

## What to do when you are stuck

Work out which of the three it is, because the fix is different each time:

1. **You do not know what the app should do.** Go back to your build card.
2. **You know what it should do but not how to say it in Python.** Go to the
   Pattern Book.
3. **You know the pattern but do not know what to put in the blank.** Come back
   to this page. Every blank in the Pattern Book is a name on this page.

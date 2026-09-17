# The Dirt Bikes: build architecture

Team: The Dirt Bikes. Tool: Anvil.

Your build cards send you here. This page sends you to the Pattern Book at
`docs/build/anvil-patterns.md`.

## The buildable slice

Your plan has five features and you have written three stories: order a track,
choose a jump's angle, and choose the gap between jumps. That is the right
three to start with, because the two jump stories are one screen, and the order
story is what happens when that screen is finished.

**In the slice, in this order:**

1. Design the track: a list of jumps, each with an angle and a gap
2. Order the track

**Stubbed for now, and why:**

- **Drawing the track.** Your plan says the track is drawn. Anvil has a Canvas
  that can be drawn on, but reading a shape back out of a drawing and turning
  it into jumps a builder can build is a month of work. A list of jumps, top to
  bottom in the order a rider meets them, is the same information in a form
  the builder can actually read off. Draw it later, on top of the list.
- **Sending in pictures.** Anvil has a FileLoader that takes a photo, and this
  is a real feature with no story yet. Write the story in the story studio,
  then it gets a card and a place here.
- **Bike check.** "Can my bike make this jump" needs a rule: which bikes clear
  which angle and gap. Nobody has written that rule down, and the app cannot
  know it until somebody does. Write it as a table on paper first, then it is
  a story.

## Screens to create

| Form name | What it is |
|---|---|
| `Track` | Your jumps, in order, each with an angle and a gap. Add one, see the list grow. |
| `Order` | Where the track goes, and the button that sends it to the builder |

## Components to create, with the exact names to use

**Track:** `dd_angle` (DropDown: 15, 25, 35, 45 degrees), `txt_gap` (TextBox,
metres to the next jump), `btn_add_jump`, `rp_jumps` (RepeatingPanel) with
`lbl_jump_line` inside, `lbl_track_summary` (Label), `btn_order`, `lbl_error`
(Label, starts invisible)

**Order:** `lbl_track_summary` (Label), `txt_address` (TextBox), `txt_space`
(TextBox, how much room there is), `btn_place_order`, `lbl_error` (Label,
starts invisible)

## Data tables

Your teacher creates these and gives you the exact names.

- **jumps**: `user` (text), `position` (number), `angle` (number), `gap` (number), `when` (date and time)
- **orders**: `user` (text), `address` (text), `space` (text), `jump_count` (number), `status` (text), `when` (date and time)

**A jump is a row, and the gap belongs to the jump.** Your gap story says the
gap is between two jumps, which is true, and the simplest way to store that is
on the second jump: "how far after the one before me". The first jump's gap is
the run-up, and it can be zero. One table, one row per jump, in `position`
order, and the builder reads it top to bottom exactly the way a rider would
ride it.

## How each feature gets built

### Feature 1: Design the track
Patterns: **1**, **2**, **6**, **7**, then **8**, **11**, **9**.

Two stories, one screen. Pick an angle from `dd_angle`, type the gap into
`txt_gap`, press `btn_add_jump`. Check the gap is a number (Pattern 6; a gap of
"big" crashes the app), save a row with the next `position`, then reload
`rp_jumps` newest last, in `position` order, so the list reads like the track.

`lbl_jump_line` says something like `Jump 3: 35 degrees, 12 m after jump 2`.
`lbl_track_summary` counts them: `4 jumps, 41 m of track`. Both come from the
rows, not from anything you store separately.

**Your angle story says "the builder builds that jump with that angle."** In
this version the builder is a person reading your list. That is fine, and it is
honest: the app's job is to say exactly what to build.

### Feature 2: Order the track
Patterns: **4**, then **1**, **2**, **6**, **7**, **5**.

`btn_order` on `Track` opens `Order`. The summary label comes with you. Type the
address and the space, press `btn_place_order`, refuse an empty address (Pattern
6), save one row to **orders** with the jump count and `status` = "ordered", and
say so (Pattern 5). Your story says the track then gets prepared, delivered and
built. Those are things people do, and `status` is where the app writes down
which one has happened.

## What to do when you are stuck

1. Do not know what the app should do, go back to your build card.
2. Know what it should do but not how to write it, go to the Pattern Book.
3. Know the pattern but not what fills the blank, come back to this page.

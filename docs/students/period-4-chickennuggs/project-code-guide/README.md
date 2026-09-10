# TrailRiders: from the Figma to Anvil

No em dashes anywhere in this document or any copy it generates.

Your team has a Figma prototype, and it looks like a real app. Seven screens,
a dark theme, one orange, real trail names. This folder is what happens next:
turning that prototype into something the builders can build, in Anvil, from
the pages your team already has.

The prototype is here, and every page in this folder was read from its own
code, so every colour, size and word below is the real one:

**[TrailRiders prototype in Figma](https://www.figma.com/proto/MXKZKqCkc0r7mfNuAgBEOa/TrailRiders-Prototype?node-id=4-10)**

**There is no import button.** Anvil cannot open a Figma file. What crosses
over is **names, numbers and pictures**, and most of that is already done
here: the numbers are on page 1, the names are on pages 2 to 5, and the
pictures are in this folder. What is left is two lists of steps, one for
whoever owns the Figma and one for whoever owns the Anvil. They are below,
and they can be done at the same time.

## The one thing to know before you start

Your Figma and your architecture page disagree about what the app is.

| Your architecture says the app has | Your Figma has |
|---|---|
| `SignIn` | `home`, with a Get Started button |
| `Trails`, a list | `trail-map`, a map with one trail card at the bottom |
| `TrailDetail` | `trail-detail` |
| `Shop`, riders selling to riders | `shop`, a store with Fox Racing and Add to cart |
| `NewListing` | nothing |
| `HealthAI` | nothing |
| nothing | `ride-tracking`, live GPS speed |
| nothing | `rider-profile` |
| nothing | `community-feed` |

Three screens match, one is a different product, two are missing, and three
were drawn for features nobody wrote a story for. None of that is a disaster;
it is exactly what a prototype is for. But it has to be decided, and the rule
on [Designing for Anvil](/build/figma.html) is that **when the design and the
architecture disagree, the architecture wins**, because the architecture is
what the code is being built from. Page 7 lists every one of these, with what
to do.

## Steps for the designer

About one lesson in Figma. Do them in this order.

1. **Rename the four frames that match** to the names on your design brief:
   `home` becomes `SignIn`, `trail-map` becomes `Trails`, `trail-detail`
   becomes `TrailDetail`, `shop` stays `Shop` with a capital S.
2. **Move the other three frames to a new page called Later.** Do not delete
   `ride-tracking`, `rider-profile` or `community-feed`. They are good, and
   they are not in the slice. A frame on a page called Later is a decision;
   a frame sitting next to the real ones is a trap for your builder.
3. **Rename the layers** to your brief's names. The table is on each screen's
   page: `trail-title` becomes `lbl_trail_name`, `price` becomes `lbl_price`,
   `cta-get-started` becomes `btn_sign_in`. Underscores, lowercase, exactly as
   written. This is the step everybody skips and it is the one that matters.
4. **Add the things the design forgot.** On `TrailDetail`, a label for what the
   trail improves, `lbl_improves`, because your story asks for it and the
   architecture has it. On `Shop`, a button to sell something,
   `btn_new_listing`. Page 3 and page 4 say where.
5. **Draw the two missing screens**, `NewListing` and `HealthAI`, in the same
   style as the rest. Pages 4 and 5 list exactly what goes on each one, with
   the words to use. The HealthAI screen has three states and all three need
   drawing.
6. **Make the repeated things one component.** The product card, the review
   card and the trail card are each drawn twice or three times as separate
   frames. Turn each into a Figma component, design it once, and stack copies.
   That is what a RepeatingPanel is, and it is rule 4 on Designing for Anvil.
7. **Draw the bad day.** An empty `Trails` and an empty `Shop` on the first
   day, `NewListing` with its `lbl_error` showing, and `HealthAI` when the
   five questions are used up. Right now the prototype only has the happy
   version of everything.
8. **Wire the prototype.** In the file's own code the only things that go
   anywhere are Get Started and the five tabs. Nothing opens `TrailDetail`,
   nothing on `TrailDetail` goes back, and no listing opens. Tapping the trail
   card should open the detail; the back arrow should return; the sell button
   should open `NewListing`.
9. **Export.** One PNG per frame at 2x, named after the form: `SignIn.png`,
   `Trails.png`, `TrailDetail.png`, `Shop.png`, `NewListing.png`,
   `HealthAI.png`. Drop them in this folder and they replace the renders that
   are here now. The icons do not need exporting; page 1 says why.

Then ask your builder the one question: **can you find every one of your
components in this?**

## Steps for the builder

About two lessons in Anvil, alongside the build itself. Do step 1 once, then
take the screens in the order your architecture gives them.

1. **Page 1, once.** Colours into the theme, two fonts into theme.css, and the
   roles every screen below uses. Twenty minutes, and never again.
2. **Create the six forms** named off your architecture page, not off the
   Figma: `SignIn`, `Trails`, `TrailDetail`, `Shop`, `NewListing`, `HealthAI`.
   Plus two row forms, `TrailRow` and `ListingRow`, which page 3 and page 4
   explain.
3. **Build in your architecture's order.** Sign in (page 2), trails and detail
   (page 3), shop and new listing (page 4), health AI (page 5). Each page
   reads the design back top to bottom as Anvil components, with the text,
   the colour and the role for each. The patterns for what the components
   *do* are still on your architecture page, and the code for those is still
   in the Pattern Book. Nothing here replaces that.
4. **Keep the picture open beside the editor.** Not to measure from; to check
   you have not forgotten a label.
5. **Icons come from Anvil, not from Figma.** Every icon in the design is a
   plain line icon and Anvil has a set of those built in, on any Label,
   Button or Link, under the icon property. Page 1 has the list of which one
   is which. Nothing to upload.
6. **The five tabs along the bottom are Anvil's navigation column on the
   left.** A bottom tab bar is a phone thing. Anvil's standard layout gives
   you a column of Links down the left side, and that is where Trails, Shop
   and Health AI go. Only three, because Ride, Feed and Profile are not in
   the slice.
7. **Get it close, then stop.** Right colours, right words, right things in
   roughly the right order, nothing missing. That is finished. Page 7 is the
   list of things in this design that are not worth a lesson.

## What is in here

| Page | What it covers |
|---|---|
| `01-theme.md` | Colours into the theme, fonts into theme.css, icons, and the roles. Do this first, once. |
| `02-sign-in.md` | `SignIn`, read from the home screen. |
| `03-trails.md` | `Trails` and `TrailDetail`, read from the map and the detail screen. Why the map is a list. |
| `04-shop.md` | `Shop`, read from the store screen, and `NewListing`, which is not drawn yet. |
| `05-health-ai.md` | `HealthAI`, which is not drawn yet, in three states. |
| `06-theme-css.md` | The whole theme.css addition, in one place, to paste. |
| `07-what-not-to-chase.md` | What the Figma does that Anvil should not, and the nine things the Figma decided that your team has not. |

## The pictures

Seven pictures, one per frame, `01-home.png` to `07-community-feed.png`. They
were rendered from the design's own code with its real fonts, so the layout,
the words, the sizes and the colours are exact. **Two things in them are not
the Figma's:** the photos are greyed out and the icons were redrawn, because
the originals could not be fetched from where the renders were made. Open the
Figma for the photos. When the designer exports the real frames (their step
9), those replace these.

## What came across from Figma

This is the handoff table from [Designing for Anvil](/build/figma.html),
filled in. Your designer does not need to do it again.

**Colours, as hex codes.** Six is usually the lot. Yours needs eight, because
it is a dark theme and dark themes need two greys for surfaces and three for
text.

| What it is | Hex |
|---|---|
| Main colour: buttons, the active tab, the RIDERS in the name, the speed | `#ff5a00` |
| The colour that goes on top of it | `#ffffff` |
| Page background | `#0f110f` |
| Card background: every card, the search bar, the nav bar | `#1a1d1a` |
| Card border | `#2a302a` |
| Raised grey button (Pause Session), and its border | `#242a24`, border `#3d453d` |
| Heading and value text | `#f5f6f5` |
| Normal text: descriptions, placeholders, tab labels | `#a3aaa3` |
| Quiet text: the small capitals labels, timestamps | `#6b726b` |
| Green: the selected shop category, the beginner marker | `#3e6b35`, marker `#2e7d32` |
| Expert difficulty | `#e57373` on a red tint, `#c62828` at 14% |
| Intermediate marker | `#ef6c00` |

**Sizes that repeat.** Set once, in the theme and the roles.

| What it is | Number |
|---|---|
| The app name on the home screen | 44 |
| Screen titles (GEAR SHOP, APEX RIDGE LOOP) | 28 |
| Section titles (TRAIL OVERVIEW, RIDER REPORTS) | 14, capitals |
| Card titles and values | 14 to 16 |
| Normal text | 13 to 14 |
| Small capitals labels (DISTANCE, RIDES DONE) | 10, capitals |
| Corner radius on the big buttons | a pill: half the height, 25 to 28 |
| Corner radius on cards | 16 big, 12 small, 8 on thumbnails |
| Corner radius on chips | 16 (a pill) |
| Padding inside a card | 12 to 16 |
| Gap between cards in a list | 8 to 16 |
| Side margin on every screen | 16 |

**Fonts.** Two, both free from Google Fonts. Page 1 says how to get them into
Anvil in two lines.

| Where | Font |
|---|---|
| Titles, buttons, values, anything in capitals | Archivo, in Bold, ExtraBold and Black |
| Everything else | DM Sans |

## The names on these pages

Every component below has a name, and the names follow your architecture
page: `lbl_` for a Label, `btn_` for a Button, `txt_` for a TextBox, `dd_` for
a DropDown, `rp_` for a RepeatingPanel. Three more, because a design made of
cards needs boxes:

| Prefix | What it is |
|---|---|
| `card_` | A ColumnPanel used as a box with a colour or a border. |
| `fp_` | A FlowPanel, for things that sit side by side on one line. |
| `lnk_` | A Link. Text you can click, for the navigation and the back arrow. |

**Where the Figma and the architecture use different names, the
architecture's name is the one on these pages**, and the Figma's is beside it
so the designer can find the layer to rename.

## One more thing

Your plan calls the app **TrailRider**. Your Figma calls it **TRAILRIDERS**,
and so does one of your stories. Pick one. It goes on the sign in screen in
letters 44 tall, so it is not a small decision, and it is a one line change to
`product-plan.md` either way.

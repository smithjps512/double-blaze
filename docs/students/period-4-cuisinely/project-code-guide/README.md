# Cuisinely: project code guide

No em dashes anywhere in this document or any copy it generates.

This folder is different from every other page you have been given, and you
should know why before you open it.

Everywhere else, the code has blanks in it and your architecture page fills them.
That is on purpose: looking a name up four times is what makes you stop needing
to look it up. **This folder has no blanks.** It is your app, written out, with
your table names and your component names already in it.

Your teacher decided to give it to you because you are past the point where
looking things up is the problem. You have written the code. It is close. It is
throwing errors. What you need now is something to hold yours up against.

## The one rule

**Compare. Do not paste.**

Open your file in Anvil. Open the matching page here. Put them side by side and
read down both at once until you find **the first line that is different**. Fix
that one line. Run it.

Then do it again for the next difference.

The reason is not that pasting is cheating. It is that pasting fixes nine errors
at once and teaches you nothing about any of them, and on the day something
breaks that is not in this folder, you will be exactly as stuck as you are now.
Finding one difference at a time is slow for about twenty minutes and then it is
not, because you start recognising the shapes.

If you paste something and it works and you cannot say **why** it works, you
have not finished. Come back and work out the why.

## What is in here

Read them in this order. Each one is a feature from your architecture page.

| Page | What it covers |
|---|---|
| `01-server-module.md` | The Server Module. Every database function, in one file. Start here, because nothing else works without it. |
| `02-restaurant-list.md` | Feature 1. The list of restaurants and the price filter. |
| `03-menu.md` | Feature 2. One restaurant's menu, and how a screen tells the next screen what to show. |
| `04-item-detail.md` | Feature 3. Calories and information for one item. |
| `05-place-an-order.md` | Feature 4. Ticking items, checking the address, saving the order. |
| `06-every-file-in-one-place.md` | Every file, complete, nothing but code. For when you want to see the whole thing at once. |
| `07-when-it-goes-wrong.md` | The errors this exact app throws, and what causes each one. |

There are also two files of test data, `restaurants.csv` and `menu_items.csv`.
An app with no rows in its tables looks broken even when it is perfect, and you
cannot tell the difference. Put the rows in first.

## Putting the test data in first

`restaurants.csv` has six restaurants. `menu_items.csv` has three items for each
of them, with real calorie counts and real allergy information.

In the Anvil editor, click a table and look for an **import** or **upload CSV**
option. If your version does not offer one, type the rows in. Six and eighteen is
about fifteen minutes and it is not wasted: you will notice things about your own
columns while you do it.

Three things to get right, because each one causes a bug with no error message:

- **`price_range` must be `$`, `$$` or `$$$`**, matching the dropdown on your
  Restaurants screen. If your table says `Cheap` the filter will always find
  nothing and never tell you why.
- **The `restaurant` column in `menu_items` must match the `name` column in
  `restaurants` exactly.** Capital letters count. A space on the end is invisible
  and counts.
- **`rating`, `price` and `calories` must be Number columns**, not Text. Sorting
  text puts 10 before 9.

Then check it worked, before you write any code: open the server console and run
`anvil.server.call('get_restaurants')`.

## Six things this guide adds to your architecture page

Writing the code found six things your architecture page does not have. That is
normal. An architecture page is not wrong when this happens, it is **out of
date**, and the job is to bring it up to date rather than to quietly disagree
with it.

**Three item template forms.** `RestaurantRow`, `MenuRow` and `OrderRow`. Every
RepeatingPanel needs a form that describes one row, and Anvil makes you create it
as a separate form. Your architecture page lists the labels that go inside each
panel but never says which form they live on.

**Two buttons that make the app work at all.** `btn_view_menu` on a restaurant
row, and `btn_more` on a menu row. Your Card 2 says choosing a restaurant shows
its menu and your Card 3 says clicking an item shows its calories, so something
on each row has to be clickable. Nothing on your architecture page is.

**One text box, `txt_name` on `Order`.** Your `orders` table has a `customer`
column and your Order screen has no way to fill it in. Two honest ways out: add
a box for a name, or turn on Anvil's Users service and take it from whoever is
signed in. This guide takes the smaller one. If you would rather sign people in,
that is Pattern 12 and it is a better answer.

**Go and write all six onto `build-architecture.md`.** Ten minutes. A design
document that does not match the app is worse than no design document, because
somebody will trust it.

## One thing this guide does not do

It does not build the map, and it does not build ratings and reviews. Those are
stubbed on your architecture page, and the reasons there still hold.

It also does not build anything for the **restaurant owner**, who your build
cards say is half the reason your app exists and who you have never written a
story for. No amount of code fixes a missing story. That one is still yours.

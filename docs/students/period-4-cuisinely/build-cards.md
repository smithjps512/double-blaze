# Cuisinely: build cards

Team: Cuisinely.

Card updated: 2026-09-09

Next stop: `build-architecture.md`. Then `docs/build/anvil-patterns.md`.

---

## Card 1: Find restaurants near me

**Your story.** As somebody looking for a place to eat locally, I want to see
restaurant locations and ratings, so that I can find new restaurants to eat at.

**Done when:**
- [ ] Every restaurant shows its name, address and rating
- [ ] You can narrow the list by price range
- [ ] It works before signing in

**Build it:** Architecture, Feature 1. Build this first.

---

## Card 2: See a menu and order delivery

**Your story.** As somebody ordering food, I want to view a restaurant's menu
and order from it, so that I can have a delivery.

**Done when:**
- [ ] Choosing a restaurant shows only that restaurant's menu
- [ ] You can pick items and enter your address
- [ ] Ordering without an address is refused
- [ ] You are told the order was placed

**Build it:** Architecture, Features 2 and 4.

---

## Card 3: Check the nutrition

**Your story.** As somebody keeping track of what they eat, I want to see the
nutritional information for a menu item, so that I know what is in my food.

**Done when:**
- [ ] Clicking an item shows its calories
- [ ] Other information about the item shows too
- [ ] You can get back to the menu

**Build it:** Architecture, Feature 3.

---

## The code for all of this

Every feature on these cards is written out in full on the
[project code guide](code-guide-README.html) pages, with your own names already
in it. Compare your file against it a line at a time rather than pasting it. The
guide explains why on its first page.

## A note for the whole team

**You found the restaurant owner.** Your rewritten delivery story has this in
it:

> If a restaurant owner wants to add their business, they would add the address
> in **Add My Place** and type up a brief description of their food style
> (Chinese, Mexican, Japanese, etc.) and their restaurant would then be added to
> the map.

That was the biggest hole in your whole set and you filled it. It also comes
with the cuisine filter, which had been in your map story and in no feature
list, so that is two findings in one paragraph.

**Now the awkward part: it is in the wrong story.** Look at the narrative
sitting above it. *As a user, I want to view local restaurants and their menus,
so that I can make a delivery.* A restaurant owner adding their business is not
somebody viewing a menu to order a delivery. It is a different person, wanting a
different thing, for a different reason, on screens the delivery story never
mentions.

Same again with scenarios 4 and 6, which are both about reviews and ratings.
Reading the reviews is not making a delivery either.

**You have written three stories and put them in one box.** That is a good
problem and it is the most common one in real product work. Splitting them is
about twenty minutes:

1. **Delivery** keeps scenarios 1, 2 and 3. That story is finished.
2. **Reviews and ratings** takes 4 and 6. Its narrative starts *As somebody
   deciding where to eat...* and the reason is not "so I can make a delivery".
3. **Add my place** takes 5, and it is written **As a small restaurant owner**.
   That is the one your plan has been waiting for since the beginning.

Do them in [the story studio](/trail-crew/write), which checks each part as you
type. Your What next page will get shorter as you go, and the "Rating and
reviews has no user story" line on it will disappear when number 2 lands.

**One thing that has not changed.** All three of your stories are still written
for "a user". Your plan names two real groups: somebody hunting for a local
place to eat, and a small restaurant owner who needs to be found. Story 3 above
is the moment to stop writing "a user" and name the person, because for that one
the whole app is different.

**And your acceptance criteria are still the weak part.** "Needs a map" and
"Available deliveries" cannot be true or false, so nothing can be tested against
them, which is why your test plan is thin. Your scenarios are now excellent and
your criteria are not, which is an odd way round and worth ten minutes.

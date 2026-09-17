# Cuisinely: build cards

Team: Cuisinely.

Card updated: 2026-09-17

One card per story, made from your stories file. Change a story and its card changes with it. Next stop: `build-architecture.md`. After that: `docs/build/anvil-patterns.md`.

**There is a working demo of every card on this page**, built from your stories and your own test data, at [/demo/period-4-cuisinely/](/demo/period-4-cuisinely/). Open it on a phone. The six restaurants are the six from your code guide's CSV, and the "About this demo" screen says what is a placeholder.

**You found the restaurant owner, and now they have a story.** The six scenarios that were packed into your delivery story are their own cards now, including Add My Place, which your plan promised from the first line. The three cards marked *New* below need a feature on the architecture page before they are built in Anvil.

---

## Card 1: Signing up

**Your story.** As somebody hungry, I want to sign up with just my email, so that I can order without filling in a form first.

**Done when:**
- [ ] Cuisinely is free and sign up asks for an email and nothing else
- [ ] An empty or badly formed email is refused with a message that says so
- [ ] My delivery address is asked for the first time I order, not at sign up
- [ ] After signing up I land on the map

**Build it:** Demo screen Welcome. Pattern 12, or the smaller answer on the code guide: a name box on Order.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **4** (Go to another screen), **5** (Tell the user something happened), **6** (Check before you act), **7** (Save something to the database), **11** (Put a list in order). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 2: Find a restaurant

**Your story.** As somebody looking for a place to eat locally, I want to see the restaurants near me on a map with their ratings, so that I can find somewhere new to eat.

**Done when:**
- [ ] Every restaurant shows its name, cuisine, price range and rating
- [ ] The cuisine chips narrow the list to that kind of food
- [ ] The price chips ($, $$, $$$) narrow the list to that budget
- [ ] The search box narrows the list as I type

**Build it:** Demo screen Map. Architecture, Feature 1, plus the cuisine and price filters.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **4** (Go to another screen), **6** (Check before you act), **8** (Get things back out of the database), **9** (Show a list on the screen). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 3: See a restaurant

**Your story.** As somebody deciding where to eat, I want to open a restaurant and see its hours, address, rating and menu, so that I know whether it is right for me.

**Done when:**
- [ ] The restaurant screen shows the address, today's hours and whether it is open now
- [ ] The star rating is the average of its reviews, not a typed number
- [ ] The menu lists every item with its price and calories
- [ ] The back arrow returns to the map with my filters still applied

**Build it:** Demo screen Restaurant. Architecture, Feature 2.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **4** (Go to another screen), **7** (Save something to the database), **8** (Get things back out of the database), **9** (Show a list on the screen). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 4: Calories and information of food

**Your story.** As somebody keeping track of what they eat, I want to see the nutrition facts and other information for a menu item, so that I know what is in my food before I order it.

**Done when:**
- [ ] Tapping an item shows its calories and its information
- [ ] Allergens in the information are called out on their own line
- [ ] I can add the item to my order from this screen and choose how many
- [ ] I can get back to the menu

**Build it:** Demo screen Item. Architecture, Feature 3.

**Patterns this probably needs:** **1** (Make a button do something), **3** (Put something on the screen), **4** (Go to another screen), **7** (Save something to the database), **8** (Get things back out of the database), **11** (Put a list in order), **13** (Let somebody choose from a list). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 5: Order a delivery

**Your story.** As somebody ordering food, I want to choose items from one restaurant and have them delivered to my address, so that I can eat without going out.

**Done when:**
- [ ] The order shows every item, how many, and the total
- [ ] I can choose delivery or pickup
- [ ] Ordering for delivery with no address is refused with a message that says why
- [ ] Items from two restaurants cannot be in one order, and the app says so
- [ ] After ordering I am told it worked and the order is in My Orders

**Build it:** Demo screen Order. Architecture, Feature 4.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **5** (Tell the user something happened), **6** (Check before you act), **7** (Save something to the database), **8** (Get things back out of the database), **9** (Show a list on the screen), **11** (Put a list in order), **13** (Let somebody choose from a list). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 6: My orders

**Your story.** As somebody who has ordered, I want to see my orders and where they are, so that I know when to expect my food.

**Done when:**
- [ ] My Orders lists every order, newest first, with the restaurant and total
- [ ] An order's status moves from Placed to Preparing to On the way to Delivered
- [ ] The status in this demo advances on a timer and the screen says so
- [ ] I can reorder the same items with one tap

**Build it:** Demo screen My Orders. New: needs a feature on the architecture page.

**Patterns this probably needs:** **1** (Make a button do something), **3** (Put something on the screen), **4** (Go to another screen), **8** (Get things back out of the database), **9** (Show a list on the screen), **11** (Put a list in order). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 7: Ratings and reviews

**Your story.** As somebody deciding where to eat, I want to read reviews from other users and leave my own after I have eaten, so that ratings come from people who actually ordered.

**Done when:**
- [ ] Every restaurant shows its average star rating and how many reviews it has
- [ ] I can read every review with the reviewer's name and when they wrote it
- [ ] I can only write a review for a restaurant I have ordered from, and the app says so if I have not
- [ ] A review needs a star rating and at least one sentence

**Build it:** Demo screen Reviews. New: needs a reviews table and a feature on the architecture page.

**Patterns this probably needs:** **1** (Make a button do something), **3** (Put something on the screen), **4** (Go to another screen), **5** (Tell the user something happened), **6** (Check before you act), **7** (Save something to the database), **8** (Get things back out of the database), **9** (Show a list on the screen), **10** (Change something already saved), **11** (Put a list in order). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 8: Add my place

**Your story.** As a small restaurant owner, I want to add my restaurant with a description of my food, so that people nearby can find me without a big advertising budget.

**Done when:**
- [ ] The form asks for the name, address, cuisine, price range and a short description
- [ ] Leaving the name or the address empty is refused with a message that says which
- [ ] After adding, my restaurant appears on the map and in the list with a New badge
- [ ] I can add menu items to my place with a price, calories and information

**Build it:** Demo screen Add My Place. New: the owner's feature, which the plan promised and no page had.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **5** (Tell the user something happened), **6** (Check before you act), **7** (Save something to the database), **9** (Show a list on the screen), **14** (Show and hide things). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

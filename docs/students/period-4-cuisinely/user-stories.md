# Cuisinely user stories

Team: Cuisinely

Revised: 2026-09-17

These are the team's stories, tidied so that every one has a person, a want, a
reason, criteria that can be true or false, and a scenario a tester can run.
The six scenarios that had been packed into the delivery story are their own
stories now, including the restaurant owner the plan promised from the start.
The demo at `/demo/period-4-cuisinely/` is built from them.

## Signing up

As somebody hungry, I want to sign up with just my email, so that I can order
without filling in a form first.

  - Cuisinely is free and sign up asks for an email and nothing else
  - An empty or badly formed email is refused with a message that says so
  - My delivery address is asked for the first time I order, not at sign up
  - After signing up I land on the map

  Given I open Cuisinely for the first time
  When I enter my email and press Continue
  Then I see the map of local restaurants

  Given I am on the sign up screen
  When I press Continue with the email box empty
  Then I see a message asking for my email and nothing is saved

## Find a restaurant

As somebody looking for a place to eat locally, I want to see the restaurants
near me on a map with their ratings, so that I can find somewhere new to eat.

  - Every restaurant shows its name, cuisine, price range and rating
  - The cuisine chips narrow the list to that kind of food
  - The price chips ($, $$, $$$) narrow the list to that budget
  - The search box narrows the list as I type
  - When nothing matches, the screen says so instead of going blank

  Given I am on the map
  When I tap the Italian chip
  Then only Italian restaurants are shown on the map and in the list

  Given I am on the map
  When I tap the $ chip
  Then only restaurants with a $ price range are shown

## See a restaurant

As somebody deciding where to eat, I want to open a restaurant and see its
hours, address, rating and menu, so that I know whether it is right for me.

  - The restaurant screen shows the address, today's hours and whether it is open now
  - The star rating is the average of its reviews, not a typed number
  - The menu lists every item with its price and calories
  - The back arrow returns to the map with my filters still applied

  Given I am on the map
  When I tap a restaurant
  Then I see its hours, address, rating and menu

  Given a restaurant closes at 9 pm
  When I open it at 10 pm
  Then it says Closed now and when it opens next

## Calories and information of food

As somebody keeping track of what they eat, I want to see the nutrition facts
and other information for a menu item, so that I know what is in my food
before I order it.

  - Tapping an item shows its calories and its information
  - Allergens in the information are called out on their own line
  - I can add the item to my order from this screen and choose how many
  - I can get back to the menu

  Given I am on a menu
  When I tap an item and then More
  Then I see its calories, its information and any allergens

  Given I am looking at an item
  When I press Add to order
  Then the order badge goes up by one and I am back on the menu

## Order a delivery

As somebody ordering food, I want to choose items from one restaurant and
have them delivered to my address, so that I can eat without going out.

  - The order shows every item, how many, and the total
  - I can choose delivery or pickup
  - Ordering for delivery with no address is refused with a message that says why
  - Items from two restaurants cannot be in one order, and the app says so
  - After ordering I am told it worked and the order is in My Orders

  Given I have items in my order
  When I press Place Order with the address box empty
  Then I see a message asking for my address and nothing is saved

  Given I have items in my order and I have typed my address
  When I press Place Order
  Then I see a confirmation with the order's status and total

## My orders

As somebody who has ordered, I want to see my orders and where they are, so
that I know when to expect my food.

  - My Orders lists every order, newest first, with the restaurant and total
  - An order's status moves from Placed to Preparing to On the way to Delivered
  - The status in this demo advances on a timer and the screen says so
  - I can reorder the same items with one tap

  Given I have placed an order
  When I open My Orders
  Then the order is at the top with its status

  Given an order is Delivered
  When I press Reorder
  Then the same items are in my order again

## Ratings and reviews

As somebody deciding where to eat, I want to read reviews from other users and
leave my own after I have eaten, so that ratings come from people who actually
ordered.

  - Every restaurant shows its average star rating and how many reviews it has
  - I can read every review with the reviewer's name and when they wrote it
  - I can only write a review for a restaurant I have ordered from, and the app says so if I have not
  - A review needs a star rating and at least one sentence

  Given I have never ordered from a restaurant
  When I open its reviews and press Write a review
  Then the app tells me to order from it first

  Given I have ordered from a restaurant
  When I give it four stars, write a sentence and press Post
  Then my review is first in the list and the average rating updates

## Add my place

As a small restaurant owner, I want to add my restaurant with a description
of my food, so that people nearby can find me without a big advertising
budget.

  - The form asks for the name, address, cuisine, price range and a short description
  - Leaving the name or the address empty is refused with a message that says which
  - After adding, my restaurant appears on the map and in the list with a New badge
  - I can add menu items to my place with a price, calories and information

  Given I am a restaurant owner
  When I fill in Add My Place and press Add
  Then my restaurant is on the map with the cuisine I typed

  Given I have added my place
  When I add a menu item with a price and calories
  Then it appears on my restaurant's menu

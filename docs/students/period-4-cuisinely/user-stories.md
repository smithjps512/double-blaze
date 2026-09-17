# Cuisinely user stories

Team: Cuisinely

Revised: 2026-09-17

## Maps with locations of restaurants

As a user, I want to see restaurant locations and ratings on a map, so that I
can find new restaurants to eat at.

  - Good user interface
  - Good coding
  - Good customer support
  Given I want to order food
  When I choose filters for my desired taste and my price range and hit scan
  Then I see local fine food establishments

## Delivery

As a user, I want to view local restaurants and their menus, so that I can make
a delivery.

  - Needs a map
  - Needs to be able to have detailed menus
  - Available deliveries

  1) Signing up. Cuisinely is free, just needs your email address and will eventually need your address (if delivering) and includes in-app purchases.
  2) The user wants to make a delivery order from Example Restaurant. They would go to Cuisinely, and select Example Restaurant on the map, and find the menu. From the menu option, they will select their order, and then add their address to have it delivered.
  3) The user later wants to see the nutrition facts about their meal. All they need to do is simply select the restaurant, then select the item and then more.
  4) If the user wants to check the reviews for Example Restaurant, they would select Example Restaurant on the map, and then click reviews and ratings. From there, they can scroll through all the reviews and comments and leave one if they wish.
  5) If a restaurant owner wants to add their business, they would add the address in Add My Place and type up a brief description of their food style (Chinese, Mexican, Japanese, etc.) and their restaurant would then be added to the map. There will also be a filter setting so you can search within the local restaurants for a certain cuisine and type of restaurant.
  6) Once you select the restaurant you are interested in, below the name will be the average 1 to 5 star review and a reviews button. If they click that button, the customer will then be able to view all the comments left by other users. The add review button will then let them leave their own review and star rating.

  Given someone wants to sign up
  When they just have to log in using their email
  Then the app is free (except for in-app purchases, and should not need any more information) and is now fully accessible to the user

## Calories and information of food

As a user, I want to find information about the food I want to be delivered, so
that I can see the nutritional information and other information about local
restaurants.

  - Select the restaurant, then select the item, then more, to see the nutrition facts

## User reviews

As a User, I want to go on the map order/pickup food and write a revuie, so that other users can see the ratings and general restaurant quality.

  - It will require an account to sign up and write/order food, And they will need to actually order the food to write a review

  Given I am signed in as a user
  When I order food or look at the menu
  Then local delivery services will pick up the food or you could pick it up it up your self.self

## find a resturaunt

As a everyday person, I want to find a local resturaunt, so that I don't have to travel far for food.

  - You will be able to filter through restaurants based off of cuisine, price range, and locality

  Given I want to find a restaurant
  When I open the map option
  Then I can search the area

  Given I have found a local restaurant
  When I select the restaurant
  Then I can see all the information about given resturaunt

  Given I want to add my restaurant to the map
  When I select the 'add my restaurant' button
  Then I will type in the address and give a brief description

  Given I want to find a local restaurant with the cuisine of "Japanese"
  When I select the 'filter' button
  Then I can type in the type of cuisine (in this case, Japanese) and it will now show me all the Japanese restaurants in the area

  Given I want to find a local restaurant with a price range of 30-60 dollars
  When I select the 'filter' button
  Then I can type in the price I want and will see all the restaurants of that range in the area

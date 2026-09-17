# Drone Dropper user stories

Team: The McTriples

Revised: 2026-09-17

## Delivers anywhere in Virginia

As a drone drop user who has purchased food, I want the food delivered to my
house, so that I can eat it.

  - Package tracking
  - The user can see how close their package is to their house
  - The user can get a notification that their food is at their doorstep
  Given the user wants vegetables
  When he clicked the veggie area
  Then it showed all the veggies to deliver

## Temperature controlled boxes

As a drone drop user who is customizing my order, I want to keep my food warm,
so that I can eat it without warming it up.

  - The user has a choice of chilled or heated boxes
  - The loader is given the prompt to use the boxes
  - The loader uses the special box
  Given I use the wrong username
  When I accept the error message
  Then I put the right username in and I sign in correctly

## AI drones

As a drone drop user who has purchased food, I want the food delivered to my
house, so that I can eat it.

  - Package tracking
  - The user can see how close their package is to the house
  - Give the user a notification when the package is delivered, and if it is dark it has a flashing light

## allergy notification

As a user who has alergys, I want it to ask me what allergies I have and to tell me if the food I order has that alergys, so that people can get hurt or killd if the food has a alergin that the person has that leads to a lawsuit.

  - a page to give the app what allergies you have
  - a notifacation system to tell you if the food has th alergin you have
  - to tell the user that food has the alergin and recommend a another food that is simelir

  Given I have a food that has my alergin
  When it sees that the food has the alergin we send a notifacation to notify the user
  Then we give the user a food that is af and is similar

## Delivery Tracker

As a consumer, I want to track my delivery on the app, so that i know when it is going to arrive.

  - consumer can see where there delivery is in process of being prepared
  - consumer can see when delivery is on the way
  - consumer can track exact location of delivery and how fast drone is moving
  - consumer can see drone moving

  Given i have placed an order
  When the order is accepted
  Then i will see the tracker

  Given i see the tracker
  When the order is started
  Then i see order is started

  Given the order has moved from started to ready
  When it is ready
  Then the tracker will change to ready using a drone icon picking it up

  Given when the order drone icon has picked it up
  When i track the order
  Then i see the drone movement AND estimated time AND speed drone is moving

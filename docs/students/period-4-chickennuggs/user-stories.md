# TrailRider user stories

Team: Chicken.nugg

Revised: 2026-09-17

These are the team's stories, tidied so that every one has a person, a want, a
reason, criteria that can be true or false, and a scenario a tester can run.
The four messaging stories became one. The three screens the Figma drew that
had no story (ride tracking, the rider profile, the feed) have one now. The
stories match the seven screens in the Figma prototype, and the demo at
`/demo/period-4-chickennuggs/` is built from them.

## Signing in

As a rider opening TrailRider for the first time, I want to sign in with my
name and email, so that my rides, listings and messages are mine.

  - The home screen has one button, Get Started
  - Sign in asks for a rider name and an email and nothing else
  - Leaving either box empty is refused with a message that says which one
  - After signing in I land on Explore and my name shows on Profile

  Given I am on the home screen
  When I press Get Started and enter my name and email
  Then I see the Explore screen and my name is on my profile

  Given I am on the sign in screen
  When I press Continue with the name box empty
  Then I see a message asking for my name and nothing is saved

## Find a trail

As a mountain biker, I want to search and filter the trails near Blacksburg,
so that I can pick one that suits me today.

  - Every trail shows its name, difficulty, length and estimated time
  - The Expert, Intermediate and Beginner chips narrow the list to that difficulty
  - The search box narrows the list as I type
  - When no trail matches, the screen says so instead of going blank

  Given I am on Explore
  When I tap the Beginner chip
  Then only beginner trails are listed and the chip turns orange

  Given I am on Explore
  When I type "creek" in the search box
  Then only trails with "creek" in their name are listed

## See a trail's details

As a mountain biker, I want to open a trail and read about it, so that I know
what I am getting into before I ride.

  - The detail shows distance, elevation gain and peak elevation
  - The detail shows an overview written by a rider and what the trail improves (legs, core, balance, endurance)
  - The star rating is the average of the rider reports, not a typed number
  - A rider can add a report of their own, and it appears at the top of the list
  - The back arrow returns to Explore with the filter I had still applied

  Given I am on Explore
  When I tap a trail card
  Then I see that trail's detail screen

  Given I am on a trail's detail
  When I write a rider report and press Post
  Then my report is first in Rider Reports and the rating updates

## Track a ride

As a rider on a trail, I want to start a ride session and watch my speed,
distance and time, so that I have a record of the ride when I finish.

  - Start Ride Session starts the clock at 0:00 and distance at 0.0 mi
  - Pause stops the clock and Resume starts it again without losing anything
  - Finish and Save adds the ride to my profile and my recent rides
  - The screen says plainly that speed and distance are simulated in this demo, because a web page cannot promise a phone's GPS

  Given I am on a trail's detail
  When I press Start Ride Session
  Then the live tracking screen opens with the clock running

  Given a ride is running
  When I press Finish and Save
  Then the ride appears in Recent Rides on my profile with its distance and time

## Shop for gear

As a rider, I want to browse gear that other riders are selling, so that I can
find a bike, helmet or part without searching the whole internet.

  - Listings show the item, the price, the seller and the category
  - The Bikes, Helmets, Parts and Apparel chips narrow the list
  - The search box narrows the list as I type
  - Opening a listing shows its description and a Message Seller button
  - There is no cart and no card payment: the listing says cash on pickup

  Given I am on the Shop
  When I tap the Helmets chip
  Then only helmet listings are shown

  Given I am looking at a listing
  When I press Message Seller
  Then a chat with that seller opens with the listing named at the top

## Sell my gear

As a rider with gear I no longer want, I want to post a listing, so that
another rider can buy it from me.

  - The form asks for the item, a price, a category and a short description
  - Leaving the item or the price empty is refused with a message that says which
  - A price that is not a number is refused
  - After posting, my listing is first in the Shop with my name as the seller

  Given I am on the Shop
  When I press the orange plus and fill in every box and press Post Listing
  Then my listing is at the top of the Shop

  Given I am posting a listing
  When I leave the price empty and press Post Listing
  Then I see a message asking for a price and nothing is posted

## Message a seller

As a buyer, I want to message a seller about their listing, so that we can
agree a price and a place to meet.

  - Messages shows one chat per seller I have contacted
  - Each chat shows the listing it is about
  - I can type a message and see it appear in the chat
  - I can delete a chat I no longer want

  Given I have opened a chat from a listing
  When I type "Is this still for sale?" and press Send
  Then my message appears in the chat, and the seller's reply appears under it

  Given I am on Messages
  When I press Delete on a chat
  Then that chat is gone from my list

## Ask the coach

As a rider who wants to get stronger, I want to ask a training coach questions,
so that I get health and riding advice for the trails near me.

  - I can type a question and get an answer
  - Under the answer I can see how many questions I have left
  - After five questions the coach stops answering and says when I can ask again
  - Forty eight hours after the fifth question I can ask five more

  Given I am on Coach with questions left
  When I ask "how do I get better at climbing"
  Then I see an answer and the questions left goes down by one

  Given I have asked five questions
  When I try to ask a sixth
  Then the coach refuses and shows how long until it will answer again

## My rider profile

As a rider, I want a profile that adds up my rides, so that I can see how far
I have come.

  - The profile shows my name and how many rides, miles and feet of climbing I have done
  - Every number comes from rides I actually saved, so a new rider sees zeros
  - Achievements unlock from rides: First Mud after the first ride, Dirt Legend after ten, Alti-Giant after 10,000 ft of climbing
  - Recent Rides lists my last three rides, newest first

  Given I have never saved a ride
  When I open Profile
  Then I see 0 rides, 0.0 mi and 0 ft, and no achievements yet

  Given I finish and save my first ride
  When I open Profile
  Then the ride is in Recent Rides and First Mud is unlocked

## Community feed

As a rider, I want to see what other riders are posting and post myself, so
that I feel part of a local riding community.

  - The feed shows posts newest first with the rider's name and when they posted
  - I can like a post and the count goes up by one, and unlike it
  - I can add a comment and the count goes up by one
  - The orange plus lets me write a post, and an empty post is refused

  Given I am on Feed
  When I press the orange plus, write "Poverty Creek is dry and fast today" and press Post
  Then my post is at the top of the feed with my name on it

  Given I am on Feed
  When I tap the heart on a post
  Then the like count goes up by one and the heart turns orange

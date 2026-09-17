# TrailRider: build cards

Team: Chicken.nugg.

Card updated: 2026-09-17

One card per story, made from your stories file. Change a story and its card changes with it. Next stop: `build-architecture.md`. After that: `docs/build/anvil-patterns.md`.

**There is a working demo of every card on this page**, built from your stories and your Figma, at [/demo/period-4-chickennuggs/](/demo/period-4-chickennuggs/). Open it on a phone. Every screen on it came from a sentence on this page, and the "About this demo" screen says which numbers are placeholders for your team to replace with real Blacksburg trails.

**The Figma won.** Your architecture page said the design should follow it. Your team drew seven screens that hang together as one app, so the stories were rewritten to match the Figma and the four cards marked *New* below need a feature on the architecture page before they are built in Anvil.

---

## Card 1: Signing in

**Your story.** As a rider opening TrailRider for the first time, I want to sign in with my name and email, so that my rides, listings and messages are mine.

**Done when:**
- [ ] The home screen has one button, Get Started
- [ ] Sign in asks for a rider name and an email and nothing else
- [ ] Leaving either box empty is refused with a message that says which one
- [ ] After signing in I land on Explore and my name shows on Profile

**Build it:** Demo screens Home and Sign in. Architecture, Feature 1.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **4** (Go to another screen), **5** (Tell the user something happened), **6** (Check before you act), **7** (Save something to the database), **8** (Get things back out of the database), **12** (Only let some people in). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 2: Find a trail

**Your story.** As a mountain biker, I want to search and filter the trails near Blacksburg, so that I can pick one that suits me today.

**Done when:**
- [ ] Every trail shows its name, difficulty, length and estimated time
- [ ] The Expert, Intermediate and Beginner chips narrow the list to that difficulty
- [ ] The search box narrows the list as I type

**Build it:** Demo screen Explore. Architecture, Feature 2.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **4** (Go to another screen), **6** (Check before you act), **8** (Get things back out of the database), **9** (Show a list on the screen). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 3: See a trail's details

**Your story.** As a mountain biker, I want to open a trail and read about it, so that I know what I am getting into before I ride.

**Done when:**
- [ ] The detail shows distance, elevation gain and peak elevation
- [ ] The detail shows an overview written by a rider and what the trail improves (legs, core, balance, endurance)
- [ ] The star rating is the average of the rider reports, not a typed number
- [ ] A rider can add a report of their own, and it appears at the top of the list
- [ ] The back arrow returns to Explore with the filter I had still applied

**Build it:** Demo screen Trail detail. Architecture, Feature 2.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **4** (Go to another screen), **7** (Save something to the database), **9** (Show a list on the screen), **10** (Change something already saved), **11** (Put a list in order), **14** (Show and hide things). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 4: Track a ride

**Your story.** As a rider on a trail, I want to start a ride session and watch my speed, distance and time, so that I have a record of the ride when I finish.

**Done when:**
- [ ] Start Ride Session starts the clock at 0:00 and distance at 0.0 mi
- [ ] Pause stops the clock and Resume starts it again without losing anything
- [ ] Finish and Save adds the ride to my profile and my recent rides
- [ ] The screen says plainly that speed and distance are simulated in this demo, because a web page cannot promise a phone's GPS

**Build it:** Demo screen Ride. New: needs a feature on the architecture page.

**Patterns this probably needs:** **1** (Make a button do something), **3** (Put something on the screen), **4** (Go to another screen), **6** (Check before you act), **7** (Save something to the database), **14** (Show and hide things). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 5: Shop for gear

**Your story.** As a rider, I want to browse gear that other riders are selling, so that I can find a bike, helmet or part without searching the whole internet.

**Done when:**
- [ ] Listings show the item, the price, the seller and the category
- [ ] The Bikes, Helmets, Parts and Apparel chips narrow the list
- [ ] The search box narrows the list as I type
- [ ] Opening a listing shows its description and a Message Seller button
- [ ] There is no cart and no card payment: the listing says cash on pickup

**Build it:** Demo screen Shop. Architecture, Feature 3.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **4** (Go to another screen), **5** (Tell the user something happened), **6** (Check before you act), **9** (Show a list on the screen), **13** (Let somebody choose from a list). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 6: Sell my gear

**Your story.** As a rider with gear I no longer want, I want to post a listing, so that another rider can buy it from me.

**Done when:**
- [ ] The form asks for the item, a price, a category and a short description
- [ ] Leaving the item or the price empty is refused with a message that says which
- [ ] A price that is not a number is refused
- [ ] After posting, my listing is first in the Shop with my name as the seller

**Build it:** Demo screen Sell. Architecture, Feature 4.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **5** (Tell the user something happened), **6** (Check before you act), **7** (Save something to the database), **8** (Get things back out of the database), **9** (Show a list on the screen), **11** (Put a list in order). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 7: Message a seller

**Your story.** As a buyer, I want to message a seller about their listing, so that we can agree a price and a place to meet.

**Done when:**
- [ ] Messages shows one chat per seller I have contacted
- [ ] Each chat shows the listing it is about
- [ ] I can type a message and see it appear in the chat
- [ ] I can delete a chat I no longer want

**Build it:** Demo screen Messages. New: needs a feature on the architecture page.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **4** (Go to another screen), **5** (Tell the user something happened), **9** (Show a list on the screen), **10** (Change something already saved), **14** (Show and hide things). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 8: Ask the coach

**Your story.** As a rider who wants to get stronger, I want to ask a training coach questions, so that I get health and riding advice for the trails near me.

**Done when:**
- [ ] I can type a question and get an answer
- [ ] Under the answer I can see how many questions I have left
- [ ] After five questions the coach stops answering and says when I can ask again
- [ ] Forty eight hours after the fifth question I can ask five more

**Build it:** Demo screen Coach. Architecture, Feature 5.

**Patterns this probably needs:** **2** (Read what somebody typed), **3** (Put something on the screen), **6** (Check before you act), **8** (Get things back out of the database). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 9: My rider profile

**Your story.** As a rider, I want a profile that adds up my rides, so that I can see how far I have come.

**Done when:**
- [ ] The profile shows my name and how many rides, miles and feet of climbing I have done
- [ ] Every number comes from rides I actually saved, so a new rider sees zeros
- [ ] Achievements unlock from rides: First Mud after the first ride, Dirt Legend after ten, Alti-Giant after 10,000 ft of climbing
- [ ] Recent Rides lists my last three rides, newest first

**Build it:** Demo screen Profile. New: needs a feature on the architecture page.

**Patterns this probably needs:** **3** (Put something on the screen), **4** (Go to another screen), **6** (Check before you act), **7** (Save something to the database), **8** (Get things back out of the database), **9** (Show a list on the screen), **11** (Put a list in order). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 10: Community feed

**Your story.** As a rider, I want to see what other riders are posting and post myself, so that I feel part of a local riding community.

**Done when:**
- [ ] The feed shows posts newest first with the rider's name and when they posted
- [ ] I can like a post and the count goes up by one, and unlike it
- [ ] I can add a comment and the count goes up by one
- [ ] The orange plus lets me write a post, and an empty post is refused

**Build it:** Demo screen Feed. New: needs a feature on the architecture page.

**Patterns this probably needs:** **1** (Make a button do something), **3** (Put something on the screen), **6** (Check before you act), **7** (Save something to the database), **9** (Show a list on the screen), **11** (Put a list in order). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

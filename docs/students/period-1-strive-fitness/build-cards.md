# Strive Fitness: build cards

Team: BMS Crew.

Card updated: 2026-09-17

One card per story, made from your stories file. Change a story and its card changes with it. Next stop: `build-architecture.md`. After that: `docs/build/anvil-patterns.md`.

**There is a working demo of every card on this page**, built from your stories and the sign up flow you drew in Figma, at [/demo/period-1-strive-fitness/](/demo/period-1-strive-fitness/). Open it on a phone. The "About this demo" screen says what is simulated: the run's distance, the weather picker, and pretend payments, exactly as your architecture page decided.

**Nine stories now.** The activity tracker and the run became one. The credit system and the background colours from your plan became one story, because one pays for the other. Food suggestions has a story for the first time. The two cards marked *New* need a feature on the architecture page before they are built in Anvil.

---

## Card 1: Signing up

**Your story.** As a new user, I want to sign up with my email and a PIN, so that my activity is saved to me and nobody else.

**Done when:**
- [ ] Sign up asks for an email and a username, and the username must be unique
- [ ] The password is a 4 digit PIN, and anything else is refused with a message that says so
- [ ] A confirmation code is sent, and in this demo it appears on an Email Inbox screen
- [ ] Typing the wrong code is refused, and the right code signs me in
- [ ] Signing in again later needs only my email and my PIN

**Build it:** Demo screens Sign up, Create password, Verification, Email Inbox, Enter code: the five frames from your Figma. Architecture, Feature 1.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **4** (Go to another screen), **5** (Tell the user something happened), **6** (Check before you act), **7** (Save something to the database), **12** (Only let some people in), **14** (Show and hide things). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 2: Weather based plan

**Your story.** As an app user, I want the app to check the weather and plan my week, so that I know whether to be active inside or outside.

**Done when:**
- [ ] Today's conditions come from a weather pick (sunny, cloudy, rain, storm), standing in for a live service
- [ ] Good weather gives an outdoor plan, bad weather an indoor one, and a storm says stay in
- [ ] The weekly plan shows seven days with an activity each
- [ ] I can accept the plan, reroll a new one, or make my own
- [ ] A plan I accepted shows on the home screen as today's activity

**Build it:** Demo screens Home and This week. Architecture, the weather dropdown and the plan.

**Patterns this probably needs:** **1** (Make a button do something), **3** (Put something on the screen), **4** (Go to another screen), **9** (Show a list on the screen), **13** (Let somebody choose from a list), **14** (Show and hide things). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 3: Start a run

**Your story.** As a runner, I want to start a run and watch my stats live, so that I can see how I am doing and save the run when I finish.

**Done when:**
- [ ] The Run button is on the home screen
- [ ] Start run starts the clock at 0:00
- [ ] The screen shows distance in km and mi, time, average pace and calories
- [ ] Calories are estimated at 60 per kilometre and the screen says so
- [ ] Stop saves the run to my history and offers to post it to the chatroom
- [ ] Distance is simulated in this demo and the screen says so, because a web page cannot promise a phone's GPS

**Build it:** Demo screen Run. Architecture, Feature 5.

**Patterns this probably needs:** **1** (Make a button do something), **3** (Put something on the screen), **4** (Go to another screen), **6** (Check before you act), **7** (Save something to the database), **8** (Get things back out of the database), **10** (Change something already saved), **11** (Put a list in order). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 4: Log an activity and see my history

**Your story.** As a user, I want to log an activity I did without the app and see everything I have done, so that my history is complete.

**Done when:**
- [ ] Log an activity asks for what I did, how far in miles, and how many minutes
- [ ] Miles and minutes must be numbers, and an empty or non number entry is refused
- [ ] History lists every run and activity, newest first, with distance and time
- [ ] History shows my totals: activities, miles and minutes
- [ ] Every logged activity earns credits

**Build it:** Demo screens Log an activity and History. Architecture, Features 2 and 3.

**Patterns this probably needs:** **3** (Put something on the screen), **4** (Go to another screen), **6** (Check before you act), **7** (Save something to the database), **8** (Get things back out of the database), **9** (Show a list on the screen), **10** (Change something already saved), **11** (Put a list in order). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 5: Chatroom

**Your story.** As a consumer, I want to chat with my friends on the app and share what I did, so that we encourage each other.

**Done when:**
- [ ] The chatroom shows everyone's posts, newest first, with likes
- [ ] I can post a message and it appears at the top
- [ ] I can post a run or an activity from my history with one tap
- [ ] The honor code is shown when I first open the chatroom
- [ ] A post with an inappropriate word is refused, and three refused posts block me from posting for the session

**Build it:** Demo screen Chatroom. Architecture, Feature 4, plus the honor code and the three strike block.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **4** (Go to another screen), **5** (Tell the user something happened), **6** (Check before you act), **7** (Save something to the database), **8** (Get things back out of the database), **11** (Put a list in order), **14** (Show and hide things). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 6: Credits and background colors

**Your story.** As a fitness person, I want to earn credits by being active and spend them on backgrounds, so that my app feels like mine.

**Done when:**
- [ ] Every logged activity or saved run earns credits: 10 per activity plus 5 per mile
- [ ] My credits show on the home screen
- [ ] The Edit section lists background colours; some are free and some cost credits
- [ ] Buying a background takes the credits and applies it everywhere in the app
- [ ] A background I cannot afford says how many more credits I need

**Build it:** Demo screen Edit. New: needs a feature on the architecture page.

**Patterns this probably needs:** **3** (Put something on the screen), **4** (Go to another screen), **6** (Check before you act), **7** (Save something to the database), **8** (Get things back out of the database), **9** (Show a list on the screen), **10** (Change something already saved). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 7: Subscription tiers

**Your story.** As a user, I want to upgrade to a paid tier, so that I get no ads and more features.

**Done when:**
- [ ] The tiers are Free, Bronze ($5 a month, no ads) and Gold ($10 a month, Bronze plus multi user access)
- [ ] Free shows an ad banner on the home screen; Bronze and Gold do not
- [ ] Pay is pretend in this demo and the button says so; no card is asked for
- [ ] After paying, the home screen says which tier I am on and the ad is gone
- [ ] Gold lets me add family members who share the account

**Build it:** Demo screen Subscription. Architecture, Feature 6.

**Patterns this probably needs:** **1** (Make a button do something), **3** (Put something on the screen), **4** (Go to another screen), **7** (Save something to the database), **12** (Only let some people in), **13** (Let somebody choose from a list). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 8: AI coach

**Your story.** As a fitness user, I want to ask a coach questions during my workouts, so that I do them right.

**Done when:**
- [ ] I can type a question and get an answer
- [ ] Answers come from a table the team writes, and each has a video link
- [ ] If the question is not in the table, the coach says so and lists what it can help with
- [ ] The coach never gives medical advice and says to tell an adult about pain

**Build it:** Demo screen AI coach. Architecture, Feature 7.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **5** (Tell the user something happened), **6** (Check before you act), **8** (Get things back out of the database), **9** (Show a list on the screen). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 9: Food suggestions

**Your story.** As someone who has just been active, I want healthy food ideas suggested by other users nearby, so that I refuel without searching online.

**Done when:**
- [ ] Food shows suggestions with the place, what to get, and who suggested it
- [ ] I can add a suggestion with a place and a dish
- [ ] Every suggestion has a Report button, and a reported suggestion is hidden and marked for a moderator
- [ ] Suggestions I added show my username

**Build it:** Demo screen Food. New: needs a feature on the architecture page.

**Patterns this probably needs:** **1** (Make a button do something), **3** (Put something on the screen), **4** (Go to another screen), **7** (Save something to the database), **8** (Get things back out of the database), **9** (Show a list on the screen), **14** (Show and hide things). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

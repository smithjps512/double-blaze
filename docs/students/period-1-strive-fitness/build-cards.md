# Strive Fitness: build cards

Team: BMS Crew.

Card updated: 2026-09-17

One card per story. Next stop: `build-architecture.md`. After that:
`docs/build/anvil-patterns.md`.

---

## Card 1: Sign up

**Your story.** As a user, I want to sign up, so that I can use Strive Fitness
to track my steps and health.

**Done when:**
- [ ] A new person can create an account
- [ ] They can sign back in later and see their own data
- [ ] A signed out person cannot see somebody else's activity

**Build it:** Architecture, Feature 1. Read the note there before you start,
because Anvil already does most of this for you.

---

## Card 2: Log an activity

**Your story.** As a runner, I want to record a run, so that I can see myself
getting fitter.

*(Your story said "I want to get more running". That is a wish, not something
the app does. What the app does is let you record a run, so that is the story.
The wish is the "so that".)*

**Done when:**
- [ ] You can enter miles and minutes and save them
- [ ] Typing letters instead of numbers shows a message instead of crashing
- [ ] The run is still there tomorrow

**Build it:** Architecture, Feature 2. Build this one first.

---

## Card 3: See your history

**Your story.** As a runner, I want to see everything I have logged, so that I
can see my progress.

**Done when:**
- [ ] Every activity you saved appears
- [ ] The newest one is at the top
- [ ] You only see your own

**Build it:** Architecture, Feature 3.

---

## Card 4: Chatroom

**Your story.** As a user, I want to chat with friends in the app, so that I can
share my accomplishments with them.

**Done when:**
- [ ] You can post a message and everyone sees it
- [ ] Messages show who wrote them
- [ ] The newest message is at the top

**Build it:** Architecture, Feature 4.

**From your own criteria:** you listed "have a moderator" and "the honor code".
Those are rules for people, not code. Worth writing down as your app's rules
even though nothing gets built for them.

---

## Card 5: Weather based plan

**Your story.** As an app user, I want a plan that matches the weather, so that
I know whether to train inside or outside.

**Done when:**
- [ ] Picking good weather offers outdoor activities
- [ ] Picking bad weather offers indoor activities
- [ ] You can decline the plan and get a different one

**Build it:** Architecture, stubbed list. You pick the weather from a dropdown
instead of the app knowing it. Everything else in your story is unchanged.

---

## Card 6: Start a run

**Your story.** As a person who wants to track my runs, I want to start the run feature on the app, so that I can record a run.

**Done when:**
- [ ] A person who wants to run is able to see stats in real time when the run starts
- [ ] Stats include distance in km and mi, time ran, average pace per distance
- [ ] A person who runs can see calories burned
- [ ] A person who runs can press start
- [ ] The start run button is visible on the home screen as "Run"
- [ ] Pressing Run takes me to the run feature

**Build it:** Architecture, Feature 5. Read the stubbed list first: the clock is real, the distance is typed for now.

**Patterns this probably needs:** **1** (Make a button do something), **3** (Put something on the screen), **4** (Go to another screen). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 7: Subscription tiers

**Your story.** As a user, I want to upgrade to the paid version, so that I can unlock more features.

**Done when:**
- [ ] Upgrade is available
- [ ] Payments can be accepted

**Build it:** Architecture, Feature 6. Read the stubbed list first: there is no real payment in this version, and the page says why.

---

## Card 8: Interactive AI

**Your story.** As a fitness user, I want to be able to use AI through my workouts, so that I can do my workouts right.

**Done when:**
- [ ] A fitness user can ask any question if they need help
- [ ] A fitness user can watch videos if needed

**Build it:** Architecture, Feature 7. The answers come from a table your team writes, which is the feature.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **8** (Get things back out of the database), **13** (Let somebody choose from a list). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 9: Background colors

**Your story.** As a fitness person, I want to be able to change the background , so that I can be able to choose my background.

**Done when:**
- [ ] A user will have a edit section to edit
- [ ] A user will be able to change background whenever

**Build it:** Architecture. Ask your teacher which feature number, then put it here.

**Patterns this probably needs:** **3** (Put something on the screen), **4** (Go to another screen), **6** (Check before you act), **10** (Change something already saved), **13** (Let somebody choose from a list). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

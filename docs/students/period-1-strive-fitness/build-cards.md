# Strive Fitness: build cards

Team: BMS Crew.

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

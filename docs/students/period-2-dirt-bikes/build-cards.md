# The Dirt Bikes: build cards

Team: The Dirt Bikes.

Card updated: 2026-09-17

One card per story, made from your stories file. Change a story and its card changes with it. Next stop: `build-architecture.md`. After that: `docs/build/anvil-patterns.md`.

---

## Card 1: Order a track

**Your story.** As a user, I want to buy a dirt bike track, so that I can ride whenever I want.

**Done when:**
- [ ] They must have enough space on their land
- [ ] They must have a dirt bike or any bike
- [ ] They must have enough money because it is expensive

**Build it:** Architecture, Feature 2. It is the last screen, and it saves what Feature 1 built.

**Patterns this probably needs:** **1** (Make a button do something), **3** (Put something on the screen), **11** (Put a list in order), **12** (Only let some people in). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 2: Jump angle

**Your story.** As a person with a dirt bike, I want to choose the angle of a jump, so that I can use that jump with my dirt bike.

**Done when:**
- [ ] I must have added jumps to my customization
- [ ] I must have the right app

**Build it:** Architecture, Feature 1. Build this one first: a jump with an angle is the smallest thing in your app that is really yours.

**Patterns this probably needs:** **7** (Save something to the database), **13** (Let somebody choose from a list). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 3: Jump gap

**Your story.** As a person with a dirt bike, I want to choose the gap between two jumps, so that I can clear the jumps.

**Done when:**
- [ ] I must have added more than 1 jump to my customization
- [ ] I must have the right app
- [ ] I must have a bike that can hit jumps

**Build it:** Architecture, Feature 1, the same screen as the jump angle. One list of jumps, and the gap is a number on each one after the first.

**Patterns this probably needs:** **1** (Make a button do something), **7** (Save something to the database), **13** (Let somebody choose from a list). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

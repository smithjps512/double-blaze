# Drone Dropper: build cards

Team: The McTriples.

Next stop: `build-architecture.md`. Then `docs/build/anvil-patterns.md`.

---

## Card 1: Order food

**Your story.** As somebody in a rural area who cannot get delivery, I want to
order food to my house, so that I can eat it.

**Done when:**
- [ ] You can see the food and pick something
- [ ] You can enter your address
- [ ] Ordering without an address is refused
- [ ] The order is saved and still there after a refresh

**Build it:** Architecture, Feature 1. Build this first.

---

## Card 2: Keep my food the right temperature

**Your story.** As somebody customizing an order, I want to choose a heated or
chilled box, so that I can eat my food without warming it up.

**Done when:**
- [ ] You can choose heated, chilled or neither
- [ ] The choice is saved with the order
- [ ] The choice appears on the order summary

**Build it:** Architecture, Feature 2.

---

## Card 3: Tell them about my allergy

**Your story.** As somebody with an allergy, I want to say what I am allergic
to, so that my food is safe to eat.

*(This is in your plan as a feature but nobody wrote a story for it. Here is the
story your plan implies. Check it says what you meant.)*

**Done when:**
- [ ] Ticking the allergy box makes a text box appear
- [ ] Ticking it and leaving the box empty is refused
- [ ] The allergy is saved with the order

**Build it:** Architecture, Feature 3.

---

## Card 4: Track my order

**Your story.** As somebody who has ordered, I want to see how close my food is,
so that I know when to expect it.

**Done when:**
- [ ] The order shows a status
- [ ] The status changes as the order progresses
- [ ] You are told when it has been delivered

**Build it:** Architecture, Feature 4.

---

## Card 5: The free food guarantee

**Your story.** As a customer, I want my food free if it arrives late, so that
the promise on the front of the app means something.

*(No story was written for this, and it is the headline promise of your whole
product. Here is a first draft. Fix the number first.)*

**Done when:**
- [ ] The team has agreed whether it is 1 hour or 2
- [ ] An order past the limit and not delivered shows the free notice
- [ ] An order inside the limit does not

**Build it:** Architecture, Feature 5.

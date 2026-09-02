# TrailRider: build cards

Team: Chicken.nugg.

Next stop: `build-architecture.md`. Then `docs/build/anvil-patterns.md`.

---

## Card 1: Sign in

**Your story.** As someone who wants to use TrailRider, I want to sign in, so
that the app knows who I am when I buy, sell or ask a question.

**Done when:**
- [ ] A new rider can make an account and sign back in
- [ ] A signed out person cannot post a listing

**Build it:** Architecture, Feature 1.

---

## Card 2: Find a trail near me

**Your story.** As a mountain biker, I want to look up trails for mountain
biking, so that I can ride trails that suit me.

**Done when:**
- [ ] Every trail shows its name and difficulty
- [ ] Clicking a trail shows its reviews and what it improves
- [ ] The length appears with the trail name

**Build it:** Architecture, Feature 2. Build this first. It is the fastest thing
in your app to get working.

---

## Card 3: Buy from the shop

**Your story.** As a rider, I want to buy a bike or bike equipment, so that I
can get gear from the shop without hunting around online.

**Done when:**
- [ ] Every listing shows what it is and the price
- [ ] Clicking a listing opens its details
- [ ] You can see how to contact the seller

**Build it:** Architecture, Feature 3.

**From your own story:** you wrote "Then I will meet up with them and give them
their purchase." That is the seller acting, in a story about a buyer. Every
story has exactly one narrator, and every Then should be something that person
experiences. Fix the sentence, it will change what you build.

---

## Card 4: Sell my bike

**Your story.** As a seller, I want to list my bike for sale, so that I can make
money on a bike I do not want.

**Done when:**
- [ ] You must be signed in to post
- [ ] A listing needs an item, a price and a photo or receipt
- [ ] The new listing appears in the shop straight away

**Build it:** Architecture, Feature 4.

---

## Card 5: Ask the health AI

**Your story.** As a rider, I want to get health and training advice, so that I
can get stronger and better at biking.

*(Your story said "I want to give health and training advice". You meant get.
Worth fixing, because who gives and who gets decides the whole screen.)*

**Done when:**
- [ ] Asking a question gives an answer
- [ ] The screen shows how many questions you have left
- [ ] The 6th question in a row is refused
- [ ] It tells you that you can ask again in 48 hours

**Build it:** Architecture, Feature 5. This is the best written story in your
set, because the 48 hour rule is something you can pass or fail. Most stories
say "the AI answers well", which nobody can test.

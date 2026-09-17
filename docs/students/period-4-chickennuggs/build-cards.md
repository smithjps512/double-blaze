# TrailRider: build cards

Team: Chicken.nugg.

Card updated: 2026-09-17

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

---

## Card 6: Messenger

**Your story.** As a Buyer I want to, I want to message the buyer, so that the buyer can enjoy their purchase.

**Done when:**
- [ ] You have to be able to text each other in something like a discord. You need the internet, you need a mobile device, or computer

**Build it:** Architecture. Ask your teacher which feature number, then put it here.

**Patterns this probably needs:** **4** (Go to another screen), **8** (Get things back out of the database), **9** (Show a list on the screen). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 7: Messaging

**Your story.** As a Consumer, I want to access the messaging tab and contact a seller, so that I can contact the seller of the item I want to buy so I can ask questions.

**Done when:**
- [ ] I can send up to 30 texts to the seller
- [ ] I can always contact the seller
- [ ] I can ask any questions I have about the product

**Build it:** Architecture. Ask your teacher which feature number, then put it here.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **6** (Check before you act), **10** (Change something already saved). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 8: messaging system (everett version)

**Your story.** As a buyer, I want to acquire a item I found on the store page, so that I can contact the seller and purchase the item.

**Done when:**
- [ ] able to send messages to the seller
- [ ] screenshots can also be sent

**Build it:** Architecture. Ask your teacher which feature number, then put it here.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **4** (Go to another screen), **5** (Tell the user something happened), **7** (Save something to the database), **9** (Show a list on the screen). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 9: Messaging for bikers

**Your story.** As a buyer, sellar, I want to successfully have a buyer communicate and buy a bike or equipment from a sellar, so that a buyer can buy a bike and communicate.

**Done when:**
- [ ] have an accsessible messaging system
- [ ] proof of money
- [ ] be able to message the sellar efficiently
- [ ] be able to buy the bike

**Build it:** Architecture. Ask your teacher which feature number, then put it here.

**Patterns this probably needs:** **1** (Make a button do something), **3** (Put something on the screen), **5** (Tell the user something happened), **8** (Get things back out of the database). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

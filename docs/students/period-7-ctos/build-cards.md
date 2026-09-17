# CTOS: build cards

Team: CTOS.

Card updated: 2026-09-17

One card per story, made from your stories file. Change a story and its card changes with it. Next stop: `build-architecture.md`. After that: `docs/build/anvil-patterns.md`.

**There is a working demo of every card on this page**, built from your stories, at [/demo/period-7-ctos/](/demo/period-7-ctos/). Open it on a phone. Everything you make in it is real inside the browser; the other people are placeholders, and the "About this demo" screen says what is not built yet and why.

**Your narratives became stories with finish lines.** Each one keeps the paragraph you wrote, then adds criteria that can be true or false and a scenario a tester can run. Six of the eleven cards below are marked *New* and need a feature on the architecture page before they are built in Anvil.

---

## Card 1: Signing in

**Your story.** As a person opening CTOS, I want to sign in as a user or continue as a guest, so that I can try the app before I commit to it.

**Done when:**
- [ ] Sign in asks for a username and nothing else
- [ ] Continue as guest needs nothing and shows how many trial days are left
- [ ] A guest sees a banner saying the trial ends in 7 days and can join at any time
- [ ] After signing in I land on Media

**Build it:** Demo screen Welcome. Architecture, Feature 1.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **4** (Go to another screen), **11** (Put a list in order), **12** (Only let some people in). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 2: Shorts and videos

**Your story.** As a user, I want to post a video and watch what others posted, so that I can share with the world and be entertained.

**Done when:**
- [ ] Media lists every post, newest first, marked Short or Video
- [ ] Posting asks for a title, a link and whether it is a Short or a Video
- [ ] A post with no title or no link is refused with a message that says which
- [ ] The Shorts chip shows only Shorts, the Videos chip only Videos
- [ ] I can like a post and the count goes up by one

**Build it:** Demo screen Media. Architecture, Features 2 and 3.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **5** (Tell the user something happened), **6** (Check before you act), **7** (Save something to the database), **8** (Get things back out of the database), **9** (Show a list on the screen), **11** (Put a list in order), **13** (Let somebody choose from a list). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 3: Topics

**Your story.** As a user, I want to read a topic and then test myself on it, so that I learn something and know whether it stuck.

**Done when:**
- [ ] Encyclopedia lists topics by subject with a one line summary
- [ ] A topic page has the text, its sources, and a Take the quiz button when one exists
- [ ] The search box narrows topics as I type
- [ ] I can write a topic of my own with a title, a subject and text

**Build it:** Demo screen Encyclopedia. New: needs a feature on the architecture page.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **4** (Go to another screen), **9** (Show a list on the screen), **11** (Put a list in order). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 4: Quizzing

**Your story.** As a user, I want to build a quiz and take other people's quizzes, so that I can show my knowledge and help others learn.

**Done when:**
- [ ] Create asks for a name and whether it is Traditional or Gamified
- [ ] The plus button adds a question with its answer; the minus button deletes the selected one
- [ ] A quiz can be public, so anyone finds it, or private, so only people with the link do
- [ ] Taking a quiz shows one question at a time and a score at the end
- [ ] The score gets a grade from the team's bands: 96 to 100 is A Awesome, 91 to 95 is A Impressive, 71 to 90 is B Great, 51 to 70 is C Decent, 31 to 50 is D Moderate, 11 to 30 is E Substandard, 0 to 10 is F Terrible

**Build it:** Demo screens Create a quiz and Take a quiz. Architecture, Features 4 and 5.

**Patterns this probably needs:** **1** (Make a button do something), **3** (Put something on the screen), **6** (Check before you act), **7** (Save something to the database), **8** (Get things back out of the database), **9** (Show a list on the screen), **10** (Change something already saved), **13** (Let somebody choose from a list). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 5: In app messaging and calls

**Your story.** As a user, I want to message and call people inside the app, so that I do not have to leave it to talk to my friends.

**Done when:**
- [ ] My profile shows my number combo in the team's format
- [ ] Chats lists my direct messages and group chats with the last message
- [ ] A group chat can hold between 2 and 30 people, and the app refuses a 31st
- [ ] I can type a message and see it appear; a call is a button that shows a call screen with a timer
- [ ] I can delete a message I sent

**Build it:** Demo screen Chats. New: needs a feature on the architecture page.

**Patterns this probably needs:** **1** (Make a button do something), **2** (Read what somebody typed), **3** (Put something on the screen), **4** (Go to another screen), **5** (Tell the user something happened), **6** (Check before you act), **7** (Save something to the database), **9** (Show a list on the screen), **10** (Change something already saved), **14** (Show and hide things). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 6: Streaks

**Your story.** As a user, I want to see my streak with each friend, so that I have a reason to keep in touch.

**Done when:**
- [ ] Each chat shows a streak count in days
- [ ] Sending a message on a new day adds one to the streak
- [ ] Missing a day resets the streak to zero, and the chat says so
- [ ] My longest streak shows on my profile

**Build it:** Demo: the count on each chat. New: needs a feature on the architecture page, after messaging.

**Patterns this probably needs:** **3** (Put something on the screen), **4** (Go to another screen), **5** (Tell the user something happened), **7** (Save something to the database), **9** (Show a list on the screen). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 7: Stickers and reaction images

**Your story.** As a user, I want to send stickers and react to messages, so that I can express myself better than with plain text.

**Done when:**
- [ ] The sticker tray has at least twelve stickers
- [ ] Tapping a sticker sends it as a message
- [ ] Long pressing or tapping a message lets me react with one of six reactions
- [ ] A reaction shows under the message with a count

**Build it:** Demo: the tray and reactions in a chat. New: after messaging.

**Patterns this probably needs:** **1** (Make a button do something), **3** (Put something on the screen), **4** (Go to another screen), **5** (Tell the user something happened), **13** (Let somebody choose from a list), **14** (Show and hide things). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 8: Public and private communities

**Your story.** As a user, I want to make a public community anyone can join or a private one for my friends, so that I can find people who like what I like.

**Done when:**
- [ ] Communities lists public ones with how many members and a Join button
- [ ] Making a community asks for a name, a description and public or private
- [ ] A private community is not listed and is joined by its link
- [ ] Joining a community opens its group chat

**Build it:** Demo screen Communities. New: after messaging.

**Patterns this probably needs:** **1** (Make a button do something), **3** (Put something on the screen), **4** (Go to another screen), **9** (Show a list on the screen). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 9: Avatar

**Your story.** As a user, I want to build an avatar, so that I can show a cool version of myself instead of a plain profile picture.

**Done when:**
- [ ] I can choose a face, a hair style, a colour and an accessory
- [ ] The avatar updates as I pick
- [ ] Saving puts the avatar on my profile and next to my messages
- [ ] I can change it again later

**Build it:** Demo screen Avatar. New: a picture built from parts, not a 3D model.

**Patterns this probably needs:** **1** (Make a button do something), **4** (Go to another screen), **5** (Tell the user something happened), **7** (Save something to the database), **10** (Change something already saved), **13** (Let somebody choose from a list). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 10: Turn features off and on

**Your story.** As a user, I want to turn features I do not use off and back on, so that the app fits me.

**Done when:**
- [ ] Settings lists every feature with a switch
- [ ] Turning a feature off hides its tab and its buttons
- [ ] Turning it back on brings them back with nothing lost
- [ ] Media and Settings cannot be turned off, and the switch says why

**Build it:** Demo screen Settings. New: needs a feature on the architecture page.

**Patterns this probably needs:** **1** (Make a button do something), **3** (Put something on the screen), **4** (Go to another screen), **6** (Check before you act), **8** (Get things back out of the database), **9** (Show a list on the screen), **14** (Show and hide things). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

---

## Card 11: User support

**Your story.** As a user, I want to find help and report a bug, so that I know what to do instead of guessing.

**Done when:**
- [ ] Support has a list of common questions with answers
- [ ] I can report a bug with a title and what happened
- [ ] A report with no title is refused
- [ ] My reports are listed with a status of Received

**Build it:** Demo screen Support. New: needs a feature on the architecture page.

**Patterns this probably needs:** **1** (Make a button do something), **4** (Go to another screen), **6** (Check before you act), **8** (Get things back out of the database), **9** (Show a list on the screen). A first guess from the words in your own criteria, not a verdict. The order goes on your architecture page.

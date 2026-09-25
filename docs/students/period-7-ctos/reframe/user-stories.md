# Reframed user stories

Team: CTOS

Proposal, 25 September. Not adopted yet: the team's own stories are
`user-stories.md` one folder up.

One story per feature in the reframed plan, under the feature's name. Where the
team already wrote a narrative for a feature that carries over, it is kept as
the first paragraph and adjusted as little as possible. The demo at
`/demo/period-7-ctos/` is built from these.

The three languages in the examples are English, Mandarin and Spanish. The
real app would support more; three is enough to show that it is for everyone.

## Choose your language

The first thing a new student sees should already be in their language. If the
first screen is in English, the app has failed the person it is for before
they have pressed anything.

As a new student, I want to choose my language before anything else, so that
I can understand the app from the first screen.

  - The first screen offers each language written in that language: English, 中文, Español
  - Choosing one switches every button, heading and message in the app to it
  - I can change my language later on my profile
  - After choosing, I can sign in with a username or continue as a guest for 7 days

  Given I open the app for the first time
  When I tap 中文
  Then the sign in screen is in Mandarin

  Given I am using the app in Spanish
  When I change my language to English on my profile
  Then the tabs and headings are in English

## Translated messaging

Everyone writes in their own language and reads in theirs. The translation is
the whole point, and it is sometimes wrong, so the original is never hidden.

As a new student, I want to write in my own language and have my classmate
read it in theirs, so that I can talk to people before my English is good
enough.

  - A message I send is shown to me in my language and to the other person in theirs
  - A message I receive is shown in my language with a note saying which language it was written in
  - Every translated message has Show original, and pressing it shows the words as they were written
  - I can delete a message I sent

  Given I use the app in Mandarin and Maya uses it in English
  When Maya writes "Want to sit with us at lunch?"
  Then I read it in Mandarin with a note that it was written in English

  Given a message was translated for me
  When I press Show original
  Then I see it as it was written, in English

## Group chats in any language

Group chats hold between 2 and 30 people, which is the team's number from the
original plan.

As a classmate, I want a group chat where everyone reads in their own language,
so that a whole class can talk together even when we do not share one.

  - Each member reads every message in their own language
  - Each message shows who wrote it and which language they wrote in
  - A group chat holds between 2 and 30 people, and the app refuses a 31st
  - Making a group asks for a name and its members

  Given the class group has an English, a Mandarin and a Spanish speaker
  When I read it in Spanish
  Then all three messages are in Spanish, each marked with the language it was written in

  Given a group has 30 people
  When I try to add one more
  Then the app says the limit is 30

## Calls with live captions

As a new student, I want captions in my language during a call, so that I can
follow what somebody says even when they talk fast.

  - A call shows a timer and the other person's name
  - What the other person says appears as captions in my language
  - I can turn captions off and on during the call
  - Ending the call returns me to the chat

  Given I am in a call with Maya and my language is Spanish
  When Maya speaks
  Then her words appear on screen in Spanish

  Given captions are on
  When I press Captions
  Then the captions go away and the call keeps going

## Quick phrases

As a new student, I want ready-made phrases for school, so that I can say the
important thing quickly even when I cannot find the words.

  - Phrases are grouped by where you need them: Class, Lunch, Getting around, Friends
  - Each phrase shows in my language and in English, with a button to hear it
  - Tapping a phrase in a chat puts it in my message, ready to send
  - A phrase sent from the list is always translated correctly, because it was written by a person

  Given I am in a chat and open Quick phrases
  When I tap "Can you say that more slowly?"
  Then it is in my message box in my language

  Given I open Phrases
  When I press the speaker next to a phrase
  Then the phrase is read aloud in English

## Stickers and reactions

Stickers and reactions say things without words, which is exactly what a new
student needs on the days when writing anything feels like too much.

As a new student, I want to send stickers and react to messages, so that I
can express myself even when I do not have the words.

  - The sticker tray has at least twelve stickers
  - Tapping a sticker sends it as a message
  - Tapping a message lets me react with one of six reactions
  - A reaction shows under the message with a count

  Given I am in a chat
  When I open the sticker tray and tap one
  Then the sticker appears in the chat as my message

  Given I tap a message and pick a reaction
  When I look at the message
  Then the reaction is under it with a count of 1

## Streaks

A streak is an unbroken run of days chatting or calling someone. With a buddy,
it is an unbroken run of days practising a language.

As a buddy, I want to see my streak with the new student I help, so that we
both have a reason to talk every day.

  - Each chat shows a streak count in days
  - Sending a message on a new day adds one to the streak
  - Missing a day resets the streak to zero, and the chat says so
  - My longest streak shows on my profile

  Given my streak with the student I help is 5 days
  When I message them on a new day
  Then the streak says 6 days

  Given I have not messaged somebody for two days
  When I open the chat
  Then the streak says 0 and that it was reset

## School guides

The Encyclopedia from the original plan, pointed at one subject: how this
school works. The things nobody explains because everybody already knows them.

As a new student, I want short guides to how the school works in my language,
so that I know what to do without having to ask about everything.

  - Guides are listed by title with a one line summary, in my language
  - A guide can be read in my language or in English, and switched with one tap
  - Each guide can be read aloud
  - Some guides end with a short practice quiz

  Given I use the app in Mandarin
  When I open the guide to lunch
  Then it is in Mandarin, with a button to read it in English

  Given I am reading a guide in English
  When I press Read aloud
  Then the guide is spoken in English

## Practice

The quiz from the original plan, practising the language instead of a subject.
Traditional is like a test; the team's grade bands are kept.

As a new student, I want to practise the phrases I need, so that I can say
them myself instead of always using the phrase list.

  - Practice shows a phrase in my language and four English answers to choose from
  - A right answer turns green, a wrong one red with the right one shown
  - A round is five questions with a score at the end
  - The score gets a grade from the team's bands: 96 to 100 is A Awesome, 91 to 95 is A Impressive, 71 to 90 is B Great, 51 to 70 is C Decent, 31 to 50 is D Moderate, 11 to 30 is E Substandard, 0 to 10 is F Terrible

  Given I start a round of Practice
  When I answer five questions and get four right
  Then I see 80 percent and the grade B Great

  Given I pick a wrong answer
  When I look at the choices
  Then my answer is red and the right one is green

## School map

The map from the original plan, "know where you should go", for one building.

As a new student, I want a map of the school with rooms named in my language,
so that I can find my classes without getting lost.

  - The map shows the rooms of the school, each named in my language
  - Tapping a room shows its name in my language and in English
  - A room has Ask the way, which opens a chat with "Where is ...?" ready to send
  - The search box finds a room by its name in any language

  Given I use the app in Spanish
  When I tap the library on the map
  Then I see Biblioteca and Library

  Given I have tapped the gym
  When I press Ask the way
  Then a chat opens with "Where is the gym?" in my message box

## Buddies and clubs

The communities from the original plan: public ones anybody at the school can
join, and a private one for you and your buddy.

As a new student, I want a buddy and a club to join, so that I have someone to
ask and somewhere to belong.

  - Clubs lists the school's clubs with how many members and a Join button
  - Joining a club opens its group chat
  - My buddy is shown at the top, with a button to message them
  - I can ask for a buddy, and the request says a teacher will match us

  Given I open Clubs
  When I press Join on Mandarin Club
  Then I am in its group chat

  Given I do not have a buddy
  When I press Ask for a buddy
  Then the app says my request was sent and a teacher will match us

## Avatar

Avatars are a model of yourself, customised to your style, found in your
profile.

As a classmate, I want to build an avatar, so that people can see who I am
without me having to explain it.

  - I can choose a face, a hair style, a colour and an accessory
  - The avatar updates as I pick
  - Saving puts the avatar on my profile and next to my messages
  - I can change it again later

  Given I open Avatar and pick a face, a hair style and a colour
  When I press Save
  Then the avatar is on my profile

  Given I have saved an avatar
  When I send a message
  Then my avatar is next to it

## Turn features off and on

As a classmate, I want to turn features I do not use off and back on, so
that the app fits me.

  - Settings lists every feature with a switch
  - Turning a feature off hides its tab and its buttons
  - Turning it back on brings them back with nothing lost
  - Chats and Settings cannot be turned off, and the switch says why

  Given I turn the School map off
  When I look at the tabs
  Then Map is not there

  Given I turn the School map back on
  When I look at the tabs
  Then Map is back

## Safety and support

The users are children, and a new student is easy to pick on. Getting help has
to be as easy as sending a message, in any language.

As a new student, I want to report or block someone from inside a chat, so
that I am safe even when I cannot explain the problem in English.

  - Every chat has Report and Block
  - A report asks what happened with buttons, so it can be made without typing, and a box for more
  - Blocking someone removes the chat and stops their messages
  - Support has common questions and answers in my language

  Given I am in a chat and press Report
  When I pick "They were unkind" and press Send
  Then the app says a teacher will read it

  Given I block someone
  When I look at Chats
  Then their chat is gone

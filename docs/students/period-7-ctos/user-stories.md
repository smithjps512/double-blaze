# CTOS user stories

Team: CTOS

Revised: 2026-09-17

These are the team's stories, tidied so that every one has a person, a want, a
reason, criteria that can be true or false, and a scenario a tester can run.
The narratives the team wrote are kept as the first paragraph of each story,
because they say what the feature is for better than any list could. The demo
at `/demo/period-7-ctos/` is built from these stories.

## Signing in

Users are permanent accounts. Guests are temporary accounts with a seven day
trial, so anyone can try the app before joining.

As a person opening CTOS, I want to sign in as a user or continue as a guest,
so that I can try the app before I commit to it.

  - Sign in asks for a username and nothing else
  - Continue as guest needs nothing and shows how many trial days are left
  - A guest sees a banner saying the trial ends in 7 days and can join at any time
  - After signing in I land on Media

  Given I press Continue as guest
  When I look at the top of the screen
  Then it says Guest, 7 days left, and offers Join

  Given I am a guest
  When I press Join and type a username
  Then the banner goes away and my username is on my profile

## Shorts and videos

Shorts are short form content: videos 75 seconds or less. Videos are long form.
Both are found in Media.

As a user, I want to post a video and watch what others posted, so that I can
share with the world and be entertained.

  - Media lists every post, newest first, marked Short or Video
  - Posting asks for a title, a link and whether it is a Short or a Video
  - A post with no title or no link is refused with a message that says which
  - The Shorts chip shows only Shorts, the Videos chip only Videos
  - I can like a post and the count goes up by one

  Given I am on Media
  When I press Create, fill in a title and a link, pick Short and press Post
  Then my post is at the top of Media marked Short

  Given I am on Media
  When I tap the Shorts chip
  Then only posts marked Short are listed

## Topics

Topics are informational subjects, read and accompanied by a short, a video or
a quiz. Wikipedia becomes Encyclopedia.

As a user, I want to read a topic and then test myself on it, so that I learn
something and know whether it stuck.

  - Encyclopedia lists topics by subject with a one line summary
  - A topic page has the text, its sources, and a Take the quiz button when one exists
  - The search box narrows topics as I type
  - I can write a topic of my own with a title, a subject and text

  Given I open Encyclopedia
  When I tap a topic
  Then I see its text and its sources

  Given I press Write a topic and fill in a title, a subject and text
  When I press Publish
  Then my topic is at the top of Encyclopedia

## Quizzing

Traditional is like a test. Gamified is like Blooket, Gimkit or Kahoot.

As a user, I want to build a quiz and take other people's quizzes, so that I
can show my knowledge and help others learn.

  - Create asks for a name and whether it is Traditional or Gamified
  - The plus button adds a question with its answer; the minus button deletes the selected one
  - A quiz can be public, so anyone finds it, or private, so only people with the link do
  - Taking a quiz shows one question at a time and a score at the end
  - The score gets a grade from the team's bands: 96 to 100 is A Awesome, 91 to 95 is A Impressive, 71 to 90 is B Great, 51 to 70 is C Decent, 31 to 50 is D Moderate, 11 to 30 is E Substandard, 0 to 10 is F Terrible

  Given I press Create quiz, add three questions and press the arrow to finish
  When I look at Quizzes
  Then my quiz is listed with three questions

  Given I take a five question quiz and get four right
  When the quiz ends
  Then I see 80 percent and the grade B Great

## In app messaging and calls

Everyone gets a number combo in the form (1-15)-###-###-###_###, found in the
dedicated section of the app.

As a user, I want to message and call people inside the app, so that I do not
have to leave it to talk to my friends.

  - My profile shows my number combo in the team's format
  - Chats lists my direct messages and group chats with the last message
  - A group chat can hold between 2 and 30 people, and the app refuses a 31st
  - I can type a message and see it appear; a call is a button that shows a call screen with a timer
  - I can delete a message I sent

  Given I open a chat and type Hello
  When I press Send
  Then Hello appears in the chat with my name

  Given a group chat has 30 people
  When I try to add one more
  Then the app says the limit is 30

## Streaks

A streak is an unbroken run of days chatting or calling someone.

As a user, I want to see my streak with each friend, so that I have a reason
to keep in touch.

  - Each chat shows a streak count in days
  - Sending a message on a new day adds one to the streak
  - Missing a day resets the streak to zero, and the chat says so
  - My longest streak shows on my profile

  Given my streak with Sam is 5 days
  When I message Sam on a new day
  Then the streak says 6 days

  Given I have not messaged Sam for two days
  When I open the chat
  Then the streak says 0 and that it was reset

## Stickers and reaction images

As a user, I want to send stickers and react to messages, so that I can
express myself better than with plain text.

  - The sticker tray has at least twelve stickers
  - Tapping a sticker sends it as a message
  - Long pressing or tapping a message lets me react with one of six reactions
  - A reaction shows under the message with a count

  Given I am in a chat
  When I open the sticker tray and tap one
  Then the sticker appears in the chat as my message

  Given I tap a message and pick a reaction
  When I look at the message
  Then the reaction is under it with a count of 1

## Public and private communities

As a user, I want to make a public community anyone can join or a private one
for my friends, so that I can find people who like what I like.

  - Communities lists public ones with how many members and a Join button
  - Making a community asks for a name, a description and public or private
  - A private community is not listed and is joined by its link
  - Joining a community opens its group chat

  Given I make a public community called Ramen Club
  When I open Communities
  Then Ramen Club is listed with 1 member and I am in its chat

  Given I make a private community
  When I open Communities
  Then it is not in the public list and its link is shown to me

## Avatar

Avatars are a model of yourself, customised to your style, found in your
profile.

As a user, I want to build an avatar, so that I can show a cool version of
myself instead of a plain profile picture.

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

As a user, I want to turn features I do not use off and back on, so that the
app fits me.

  - Settings lists every feature with a switch
  - Turning a feature off hides its tab and its buttons
  - Turning it back on brings them back with nothing lost
  - Media and Settings cannot be turned off, and the switch says why

  Given I turn Quizzing off
  When I look at the tabs
  Then Quizzes is not there

  Given I turn Quizzing back on
  When I look at the tabs
  Then Quizzes is back and my quizzes are still there

## User support

As a user, I want to find help and report a bug, so that I know what to do
instead of guessing.

  - Support has a list of common questions with answers
  - I can report a bug with a title and what happened
  - A report with no title is refused
  - My reports are listed with a status of Received

  Given I open Support
  When I search "avatar"
  Then the questions about avatars are listed

  Given I report a bug with a title and a description
  When I press Send
  Then it is listed under My reports as Received

# Strive Fitness user stories

Team: BMS Crew

Revised: 2026-09-17

These are the team's stories, tidied so that every one has a person, a want, a
reason, criteria that can be true or false, and a scenario a tester can run.
The activity tracker and the run story became one. The credit system and the
background colours from the plan became one story, because one pays for the
other. The demo at `/demo/period-1-strive-fitness/` is built from them and
from the sign up flow the team drew in Figma.

## Signing up

As a new user, I want to sign up with my email and a PIN, so that my activity
is saved to me and nobody else.

  - Sign up asks for an email and a username, and the username must be unique
  - The password is a 4 digit PIN, and anything else is refused with a message that says so
  - A confirmation code is sent, and in this demo it appears on an Email Inbox screen
  - Typing the wrong code is refused, and the right code signs me in
  - Signing in again later needs only my email and my PIN

  Given I am on the sign up screen
  When I type my email and a username and press Continue
  Then I am asked to create a 4 digit PIN

  Given I have created my PIN
  When I open the Email Inbox and type the code it shows into Enter Code
  Then I am signed in and I see the home screen

## Weather based plan

As an app user, I want the app to check the weather and plan my week, so that
I know whether to be active inside or outside.

  - Today's conditions come from a weather pick (sunny, cloudy, rain, storm), standing in for a live service
  - Good weather gives an outdoor plan, bad weather an indoor one, and a storm says stay in
  - The weekly plan shows seven days with an activity each
  - I can accept the plan, reroll a new one, or make my own
  - A plan I accepted shows on the home screen as today's activity

  Given the weather is set to sunny
  When I look at the plan
  Then today's activity is outdoors

  Given I am looking at a generated weekly plan
  When I press Reroll
  Then a different plan appears and I am asked again to accept, reroll or make my own

## Start a run

As a runner, I want to start a run and watch my stats live, so that I can see
how I am doing and save the run when I finish.

  - The Run button is on the home screen
  - Start run starts the clock at 0:00
  - The screen shows distance in km and mi, time, average pace and calories
  - Calories are estimated at 60 per kilometre and the screen says so
  - Stop saves the run to my history and offers to post it to the chatroom
  - Distance is simulated in this demo and the screen says so, because a web page cannot promise a phone's GPS

  Given I am on the home screen and signed in
  When I press Run and then Start run
  Then the clock runs and the distance, pace and calories update

  Given I have finished a run
  When I press Stop and Save
  Then the run is at the top of my history and I am offered Post to chatroom

## Log an activity and see my history

As a user, I want to log an activity I did without the app and see everything
I have done, so that my history is complete.

  - Log an activity asks for what I did, how far in miles, and how many minutes
  - Miles and minutes must be numbers, and an empty or non number entry is refused
  - History lists every run and activity, newest first, with distance and time
  - History shows my totals: activities, miles and minutes
  - Every logged activity earns credits

  Given I log a 3 mile walk for 45 minutes
  When I open History
  Then the walk is at the top with 3.0 mi and 45 min

  Given I have never logged anything
  When I open History
  Then it says so and shows zeros, not made up numbers

## Chatroom

As a consumer, I want to chat with my friends on the app and share what I did,
so that we encourage each other.

  - The chatroom shows everyone's posts, newest first, with likes
  - I can post a message and it appears at the top
  - I can post a run or an activity from my history with one tap
  - The honor code is shown when I first open the chatroom
  - A post with an inappropriate word is refused, and three refused posts block me from posting for the session

  Given I finish a run
  When I press Post to chatroom
  Then a post with my distance and time is at the top of the chatroom

  Given I type an inappropriate word
  When I press Post
  Then the post is refused and the app reminds me of the honor code

## Credits and background colors

As a fitness person, I want to earn credits by being active and spend them on
backgrounds, so that my app feels like mine.

  - Every logged activity or saved run earns credits: 10 per activity plus 5 per mile
  - My credits show on the home screen
  - The Edit section lists background colours; some are free and some cost credits
  - Buying a background takes the credits and applies it everywhere in the app
  - A background I cannot afford says how many more credits I need

  Given I have 20 credits
  When I try to buy a background that costs 50
  Then it says I need 30 more and nothing changes

  Given I have bought a background
  When I open any screen
  Then it has that background

## Subscription tiers

As a user, I want to upgrade to a paid tier, so that I get no ads and more
features.

  - The tiers are Free, Bronze ($5 a month, no ads) and Gold ($10 a month, Bronze plus multi user access)
  - Free shows an ad banner on the home screen; Bronze and Gold do not
  - Pay is pretend in this demo and the button says so; no card is asked for
  - After paying, the home screen says which tier I am on and the ad is gone
  - Gold lets me add family members who share the account

  Given I am on Free
  When I look at the home screen
  Then I see an ad banner

  Given I pick Bronze and press Pay (pretend)
  When I go back to the home screen
  Then the ad is gone and it says Bronze

## AI coach

As a fitness user, I want to ask a coach questions during my workouts, so that
I do them right.

  - I can type a question and get an answer
  - Answers come from a table the team writes, and each has a video link
  - If the question is not in the table, the coach says so and lists what it can help with
  - The coach never gives medical advice and says to tell an adult about pain

  Given I ask "how do I warm up"
  When I press Ask
  Then I see the warm up answer and a video link

  Given I ask about something the table does not have
  When I press Ask
  Then the coach says it cannot help with that yet and shows the topics it can

## Food suggestions

As someone who has just been active, I want healthy food ideas suggested by
other users nearby, so that I refuel without searching online.

  - Food shows suggestions with the place, what to get, and who suggested it
  - I can add a suggestion with a place and a dish
  - Every suggestion has a Report button, and a reported suggestion is hidden and marked for a moderator
  - Suggestions I added show my username

  Given I finish a run
  When I open Food
  Then I see suggestions from other users

  Given a suggestion is bad
  When I press Report
  Then it disappears from the list and says it was sent to a moderator

# Strive Fitness user stories

Team: BMS Crew

Revised: 2026-09-17

## Signing up

As a user, I want to sign up, so that I can use Strive Fitness to track my steps
and health.

  - The user must have a unique username, their email
  - The user must get a confirmation code when signing up
  - The user must have a password that includes a 4 digit pin
  Given I am signing up with Strive Fitness
  When I type in my email
  Then I receive my confirmation code and a 4 digit pin, and I can start tracking my fitness

## Weather

As an app user, I want to check the weather, so that I can see if it is okay to
go outside or not.

  - The user must accept to share location
  - The user must sign up or log in correctly
  - It will show the user the weather of their location
  Given the weather is good
  Then the user will have options for physical fitness outside

  Given the weather is bad
  Then the user will have options for physical fitness inside

  When I want to plan my whole week
  Then the app will allow me to plan based on the weather forecast

  Given I am on the fitness plan page
  When I see the generated weekly plan based on the weather
  If the user clicks accept
  Then the generated weekly plan will appear, and they will be asked to either accept their fitness plan, make their own fitness plan, or reroll a new weekly plan

  Given I am on the fitness plan page
  When I see the generated weekly plan based on the weather
  If the user clicks decline
  Then the generated weekly plan will not appear, and they will be asked to either make their own fitness plan, or reroll a new weekly plan

## Activity tracker

As a runner, I want to get more running, so that I can be more fit.

  - Cardio tracker
  - Speed tracker
  - Mileage tracker
  Given I am running 14 miles
  When I finished running
  Then the app told me that I could post my achievements on the chatroom, so I did and got lots of likes

## Chatroom

As a consumer, I want to chat with my fellow friends on this app, so that I can
share my accomplishments with them.

  - Coding
  - Have a moderator
  - The honor code
  Given I was talking in the chatroom
  When I said some inappropriate things
  Then I got blocked

## Start a run

As a person who wants to track my runs, I want to start the run feature on the app, so that I can record a run.

  - A person who wants to run is able to see stats in real time when the run starts
  - Stats include distance in km and mi, time ran, average pace per distance
  - A person who runs can see calories burned
  - A person who runs can press start
  - The start run button is visible on the home screen as "Run"
  - Pressing Run takes me to the run feature
  Given I am on the home screen and signed in
  When I press Run
  Then I go to the run screen

  Given I am on the run screen
  When I want to start a run
  Then I press "Start run"

  Given I have started a run
  When I look at the run screen
  Then I see my current pace AND I see my current distance already run AND I see total time run

## Subscription tiers

As a user, I want to upgrade to the paid version, so that I can unlock more features.

  - Upgrade is available
  - Payments can be accepted
  Given I am signed in as a user
  When I pay for a subscription tier (whichever one)
  Then I unlock more features through a paid subscription

## Interactive AI

As a fitness user, I want to be able to use AI through my workouts, so that I can do my workouts right.

  - A fitness user can ask any question if they need help
  - A fitness user can watch videos if needed
  Given I type a question in the AI box
  When I click ask
  Then I get an answer

  Given the answer gives me options
  When I decide whether I like it or not
  Then I do it that way or not

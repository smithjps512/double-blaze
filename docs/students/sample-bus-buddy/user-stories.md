# Bus Buddy user stories

Team: Sample Team

## Bus tracker

As a student, I want to see how many minutes until my bus reaches my stop, so
that I stop standing outside guessing.

  Given I have set my bus number and my stop
  When I open the app
  Then I see a countdown in minutes and where the bus is on the route

As a parent, I want to see where my child's bus is, so that I know when to walk
down to the stop.

  Given my child has shared their bus number with me
  When I select their route
  Then I see the same countdown my child sees

## Delay alerts

As a bus driver, I want to report a delay in two taps, so that I am not
answering the same question forty times.

  Given I am on my route and running late
  When I tap report a delay and choose a reason
  Then every rider on my route is told the new arrival time

As a student, I want to be told when my bus is late, so that I do not leave
class early for nothing.

  Given my bus has been reported late
  When the delay is posted
  Then I see the new time and the reason on my home screen

## My stop setup

As a student, I want to choose my bus number and my stop once, so that the app
knows what to show me every morning.

  Given I am opening the app for the first time
  When I enter my bus number
  Then the app saves it and shows me my stop list

  Given I have picked my bus
  When I select my stop from the list
  Then the app remembers it and takes me to the tracker

## Route board

As front office staff, I want to see every route on one screen.

  Given a parent is on the phone asking about a bus
  When I open the route board
  Then I see every route with its status and its next stop

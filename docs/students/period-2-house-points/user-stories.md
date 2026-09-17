# House Point Tracker user stories

Team: House Points

Revised: 2026-09-17

## Add points

As a teacher, I want to add points, so that I can award them when a student does
something good.

  - We must have teacher accounts
  - Make it so only teachers can get in
  - Make it add points to students, not to the house
  Given a student did something good at school
  When I award points
  Then the points are added to that student

## Point cap

As a teacher, I want a maximum number of points a teacher can add at a time, so
that I can prevent students who get hold of the password from adding a bunch of
points.

  - Teachers are not able to add more than 50 points per student a day
  - Students are not able to get through the sign in page
  Given I tried to add more than 50 points to a student in one day
  When the cap stops me
  Then I wait for the next day and add the rest of the points the student earned

## Cloud storage

As a student user, I want to make sure information will be stored correctly, so
that I can check house points and know teachers can change them without worrying
they will be lost.

  - We need to make sure that teachers can put in points
  - We need to make sure the points are stored in the cloud so they are not deleted when teachers clear their cookies
  - We must make sure the storage keeps the points in the same amount and in the right house
  Given a teacher put in points and cleared their cookies afterwards
  When the information was automatically stored in the cloud
  Then the information is in the logs and the point information has been saved

## Point animations

As a student user, I want to admire my house's achievements, so that I can enjoy
the house competition more.

  - We must be able to see the animation every time an individual gains points
  - The animation must be small and short
  - The animation must be entertaining to as many people as possible
  Given you just gained points and saw the animation but did not like it
  When you click the settings button, scroll to the appearance tab and turn off animations
  Then the next time you gain points no animation appears

## Add points to students and houses

As a teacher, I want to add students to a house and add points to a student, therefore also adding points to the house, so that they get the points.

  - A teacher is able to add up to 5 points to a student, effectively adding points to their assigned house
  Given I am signed in as a teacher
  When I add points to a student
  Then their house is awarded the points and it is recorded in a point history list

## House detail

As a teacher, I want to be able to click on each house, see the students in that house, and add points to a specific student, so that I can award specific students who did well in class.

  - I can click further on the house
  - I can see each student in the house
  - I can add points to a specific student and the points also add to the overall house
  Given I am signed in as a teacher
  When I click on each house and see all the students
  Then I am able to add points to each individual student

  Given I am a student
  When I click on my house
  Then I can see the number of points I specifically have

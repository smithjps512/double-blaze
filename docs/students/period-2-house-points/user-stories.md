# House Point Tracker user stories

Team: House Points

Revised: 2026-09-17

## Add points

As a Teacher or admin, I want to add points to individual people, so that people can gain points for their house.

  - Max 5 points per person by one teacher

  Given I am a teacher or admin
  When I give someone between 1-5 points
  Then it saves my addition and adds it to the total as well as the individual person's points

## Point cap

As a teacher, I want limit amout of points given a day, so that not too many points.

  - a teacher adds 4 points AT max a day

  Given 1 day of work
  When I give 4 points
  Then cant give more

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

As a student, I want to, whenever a teacher adds points, see cool animations for each house, so that my bruin pride is boosted an see more interactions and more detail and personality in the website.

  - Whenever a teacher adds points to a specific, I can see a small animation for that house
  - The animation is small and aesthetically pleasing
  - The animation that plays is the animal for that house

  Given I am a student
  When I go into the website and points are being added
  Then I can see a small animation with the animal from that house

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

## Change Logds

As a Admin or teacher, I want to be able to see the point transaction/records of point addition, so that teachers can find any mistakes or any strange occurrences.

  - You must be able to click a button and see point history as a teacher

  Given I am signed in as a teacher or admin
  When I click the point log button
  Then it shows entire point history

## Teacher sign in

As a teacher, I want sign into a special teacher account, so that I can add p oints.

  - a teacher can find the sign in button
  - when clicked, they will be promoted to enter credentials
  - when entering the correct credentials, they will be entered into a special account that can add and subtract points

  Given I want to add points to a student
  When I sign into a teacher account
  Then I can add points

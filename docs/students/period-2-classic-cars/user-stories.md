# Classic Cars user stories

Team: Classic Cars

## Car gallery

As somebody who likes cars, I want to look through cool cars and their stats, so
that I can see which ones are fastest and why.

  - Every car shows its name and a picture
  - Clicking a car shows its year, top speed and horsepower
  - You can get back to the list

  Given I am on the car list
  When I click a car
  Then I see that car's stats on its own page

## Parts library

As somebody who likes cars but does not know how they work, I want to read what
each part of a car does, so that I understand what is happening under the hood.

  - Every part has its own short page
  - Each page says what the part does in plain words
  - Each page says what happens if that part is upgraded

  Given I want to know what a turbo does
  When I click turbo in the parts list
  Then I see a short page explaining it

## Quiz

As a user, I want to take a quiz, so that I can test my knowledge about the cars
and parts I learned about.

  - The questions come from the parts pages
  - I can pick an answer for each question
  - I can press submit when I am done
  - It tells me how many I got right

  Given I have read some of the parts pages
  When I answer the questions and press submit
  Then I see my score out of the number of questions

## Horsepower builder

As somebody who wants a faster car, I want to pick upgrades and watch the
horsepower change, so that I can see what actually makes a car more powerful.

  - You start with a stock engine and a starting horsepower number
  - Every upgrade you pick adds horsepower
  - The total updates as soon as you pick something
  - You can take an upgrade back off

  Given I am on the builder with a stock engine
  When I add a turbo
  Then the horsepower number goes up straight away

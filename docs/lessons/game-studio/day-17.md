# Day 17: Overlaps, score and lives

No em dashes anywhere in this document or any copy it generates.

At the end of today, every student's game has something to collect that adds to the score, and something that takes a life.

## Again (5 minutes)

1. Open yesterday's MakeCode project. Get the hero moving again, from memory,
   in under 3 minutes if you have to start over.

## Watch (5 to 10 minutes)

The teacher does this on the projector, start to finish. Nobody types until it
is done.

1. **Add** a second sprite in **on start**: **set food to sprite of kind
   Food**. Draw a coin. Put it somewhere with **set position**.
2. **Open** the **Sprites** drawer and drag out **on sprite of kind Player
   overlaps otherSprite of kind Food**. Inside it: **Info** drawer, **change
   score by 1**, and **destroy otherSprite**. Walk into the coin. Show the
   score.
3. **Add** an Enemy sprite the same way, and an overlap with **change life by
   -1**. Set life to 3 in on start. Say: you just built your lose condition.
4. **Point** at the overlap block. Say: this is a Given, When, Then. Given the
   hero and a coin, When they overlap, Then the score goes up.

Say out loud: an overlap block is a scenario you can run. Given, When, Then, built.

## Do (25 to 30 minutes)

1. *(again)* Your hero moves with the controller at your chosen speed.
2. **(today)** One thing to collect, with an overlap that adds to the score.
3. **(today)** One thing to avoid, with an overlap that takes a life. Start
   with 3 lives.
4. **(today)** Make the enemy move: give it a velocity, or use **follow** if
   your game has chasing.
5. **(today)** The QA Lead plays everyone's game in the studio and tries to
   break it: what if you touch two coins at once?

Stuck? If the overlap does nothing, check the kinds: the sprite you made has to be the same kind the overlap block asks for.

## Done when

Every student's game adds to the score when collecting and takes a life on a hit, and can be lost.

## Tomorrow adds

A real level: tilemaps, walls, and a camera that follows the hero.

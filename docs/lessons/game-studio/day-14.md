# Day 14: Bad day scenarios

No em dashes anywhere in this document or any copy it generates.

At the end of today, every level has a bad day scenario, and at least one of them is the lose condition.

## Again (5 minutes)

1. Read one happy path out loud, Given, When, Then, without looking.

## Watch (5 to 10 minutes)

The teacher does this on the projector, start to finish. Nobody types until it
is done.

1. **Say**: QA Leads are paid to be weird. Ask the room: what weird things do
   players do in games? (Walk backwards, jump at walls, stand still, press
   every button.) Write them on the board.
2. **Open** Demo Studio's level 1. Press **+ Bad day**. Type: Given Bolt is at
   the edge of a gap, When the player jumps too late, Then Bolt falls, loses a
   heart, and restarts at the last checkpoint.
3. **Add** a weird one for level 3: Given the timer is running, When the player
   stands still, Then the magnets pull Bolt in and the timer keeps going.
4. **Point** at the Core loop tab's lose condition. Say: one of your bad days
   should be how the player loses, written exactly.

Say out loud: every bug a QA tester finds is a bad day nobody wrote down. Write them now, before the build.

## Do (25 to 30 minutes)

1. *(again)* Open your studio. Check every level has a happy path.
2. **(today)** Add a bad day to every level. The QA Lead leads today.
3. **(today)** One bad day must be your lose condition: what exactly happens
   when the player loses?
4. **(today)** Add one weird one: what if the player does something you did not
   plan for?
5. **(today)** Check the Definition of Done on each level. Write down which
   ones are not green yet.

Stuck? Take the happy path and change one word in the When: too early, too late, the wrong button, nothing at all.

## Done when

Every level has a bad day, one of them is the lose condition, and the studio knows which levels are not done yet.

## Tomorrow adds

The Definition of Done review, and design doc v1 goes to Double Blaze.

# How to build your app

No em dashes anywhere in this document or any copy it generates.

You have three documents. They are in a chain on purpose. Follow the chain.

## The chain

**1. Your build cards.** One card per user story, written from what your team
wrote. Each card says what the feature is and what has to be true before you can
call it done. Start here. Always.

**2. Your architecture.** What your app is made of: the screens, the exact names
to give every button and box, the tables your data lives in, and for each
feature, which patterns you need and in what order.

**3. The Pattern Book.** The code. Shared by every team in every period. It is
the only place code lives.

And two pages for when the problem is not the plan:

**First steps in Anvil** is where to type it and what to click. If you have read
a pattern and still do not know where the code goes, start there. Do it once
even if it looks too easy.

**When Anvil shows you red text** is the error page. Find your error, in plain
words, with what to check.

```
build card  ->  architecture  ->  Pattern Book
what to build   how it fits      what to type
```

## If you are the designer

You have a fourth page, and it comes off the same chain: **your design brief**.

It is not a separate document somebody wrote for you. It is your team's
architecture, read back as a list of things to draw: every screen your app has,
and inside each one, the exact name of every button and label your builders have
already agreed on. Change the architecture and your design brief changes with
it, which means a design and the code it turns into cannot quietly drift apart.

Use those names as your Figma layer names. That one habit is the difference
between a design your team builds and a design your team admires and then
ignores.

**Designing for Anvil** is the shared page with the rules, and it is not a Figma
tutorial. It is the part Figma will not tell you: which of the things you can
draw your team can actually build.

## Why you have to look things up

The Pattern Book has the real code and it is correct. But every place where a
name goes, it has a blank that looks like `___`. Your button, your table, your
form.

**Only your architecture page knows those names.** So you cannot copy from the
Pattern Book without reading your own architecture, and you will not know which
pattern to look up without reading your card.

This is deliberate, and here is the honest reason. If we handed you finished
code you would have a working app and you would not be able to build the next
one. Looking something up three or four times is what makes your brain stop
needing to look it up. After the fifth button you will type the handler without
opening anything, and that is the point where you can actually build things.

The blanks are not a puzzle. If you cannot fill one in, you are not stuck on
Python, you are missing something from your own design, and that is worth two
minutes with your team.

## The order to work in

1. **Pick the card your architecture lists first.** It is first for a reason,
   usually because everything else needs it.
2. **Read the card's Done when list.** That is your finish line. Write it on the
   whiteboard.
3. **Find that feature in your architecture.** It gives you a pattern order,
   like "Patterns 1, 2, 6, 7, 5".
4. **Do one pattern at a time.** Get Pattern 1 working before you touch Pattern
   2. Click the button and see something happen, even if it is only a printed
   message.
5. **Tick the Done when boxes.** All ticked means done. Move to the next card.

## Three kinds of stuck, and what to do about each

Work out which one you are in before you ask for help. The fix is different.

**"I do not know what this is supposed to do."**
Go back to your build card. If the card does not say either, that is a real
finding and your team needs to decide it.

**"I know what it should do but not how to write it."**
Go to the Pattern Book. Find the pattern your architecture named.

**"I know the pattern but not what goes in the blank."**
Go back to your architecture. Every blank in the Pattern Book is a name on your
architecture page.

If it is none of those three, then it is a real bug, and that is when to grab a
teacher.

## Things that are true and worth knowing now

**Your app is not going to do everything in your plan.** Every architecture page
has a buildable slice and a stubbed list. That is not us cutting your app down.
Choosing what to build first is what every software team does, and the teams
that skip it are the ones that finish nothing.

**A stub is a decision, not a failure.** "The map is a list for now" is a
sentence a professional says in a meeting every day.

**Test by trying to break it.** If your rule says no more than 50, type 51. If
it goes through, the rule is not built. The only way to know a check works is to
fail it on purpose.

**When your screen does not match this page, believe your screen.** Anvil
changes. If Anvil wrote your event handler a different way from the Pattern
Book, keep what Anvil wrote and use the rest.

## The helper on the build pages

There is an Ask box at the bottom of your build cards and your architecture.

**It will not write your code.** That is on purpose and it is not going to
change, so do not spend the period trying to talk it into it. What it is good
at is the thing that actually slows you down: working out which of the three
kinds of stuck you are in, and telling you which page and which pattern number
answers it.

There are two boxes and they behave differently on purpose.

**"I do not know what to do"** points you at the page and pattern. It will not
write code, because finding it is what makes you able to do it next time. Ask it
things like "which pattern saves something" or "what is Card 3 asking me to do".

**"I tried and it is not working"** is different. Paste the red text Anvil is
showing you and it will explain what the error means and show you the fix.
Nothing in the Pattern Book contains your particular mistake, so there is
nothing to look up, and leaving you stuck would teach you nothing.

You have to have tried first. If you paste nothing and describe nothing, there
is nothing to debug, and it will send you back to the other box.

**The design brief has its own box**, and it works differently again. There is
no code hidden behind it, so it will answer you straight: whether Anvil can
build the thing you drew, what an empty state should say, and the useful one,
whether your design matches what your team is going to build. Describe your
design or list your layer names and ask it. The one thing it will not do is
invent a component name, because a name it made up is exactly the drift your
brief exists to stop.

Your teacher can see every question asked. That is not to catch you out, it is
so that when six teams are stuck on the same thing he knows to stop the class
and explain it once.

## What to do when you finish a card

Show somebody. Then pick the next card. Do not start three features at once,
because three half built features is worth less than one finished one, and it
feels much worse.

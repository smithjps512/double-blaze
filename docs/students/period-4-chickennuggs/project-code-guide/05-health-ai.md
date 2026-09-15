# 5. HealthAI, which nobody has drawn yet

No em dashes anywhere in this document or any copy it generates.

Your architecture says this is the most interesting thing in your whole plan:
*the 5 questions then locked for 48 hours rule is fully buildable*. Your
Figma does not have it. There is no frame, no tab, no button that leads to
it. Of the seven screens in the prototype, three are for features with no
story, and the feature with the best story has no screen.

That is the single most useful finding in the whole prototype, and it is
worth saying out loud to the team before anybody builds anything.

This page is the screen, in words, for both the designer to draw and the
builder to build. It has three states and all three matter, because the
rule is the feature.

## The screen

Everything stacks down the page. Style it like the trail detail screen: dark,
cards, one orange pill.

| Name | Type | Text | Look |
|---|---|---|---|
| `lbl_title` | Label | `HEALTH & TRAINING` | role `display`, 28 |
| `lbl_blurb` | Label | `Ask about training, recovery, or getting ready for a trail near you.` | 13, foreground `#a3aaa3` |
| `lbl_questions_left` | Label | `5 OF 5 QUESTIONS LEFT` | role `chip-active` when there are questions left, role `chip` when there are none |
| `txt_question` | TextBox | placeholder `How should I train for Apex Ridge Loop?` | role `field` |
| `btn_ask` | Button | `ASK` | role `pill`, background Primary, foreground On Primary, full width |
| `card_answer` | ColumnPanel | | role `card-big`, starts invisible |
| `lbl_answer_word` | Label, inside | `COACH SAYS` | role `heading` |
| `lbl_answer` | Label, inside | the answer | 13, foreground `#a3aaa3` |
| `lbl_locked` | Label | `You have used your 5 questions. Ask again in 47 hours.` | role `chip-expert`, full width, starts invisible |

The `lbl_questions_left` chip is the thing the design has to make obvious.
Your card 5 says *The screen shows how many questions you have left*, so it
is not a footnote; it sits right above the box, in orange, and turns grey at
zero.

## The three states, which are the feature

**Fresh.** Five questions left. The chip is orange and says `5 OF 5 QUESTIONS
LEFT`. The box is empty. No answer card. The Ask button is orange.

**Answered.** After a question, the answer card appears under the button with
the reply, and the chip counts down: `4 OF 5 QUESTIONS LEFT`. The question
stays in the box so the rider can see what they asked. Draw this one with a
real question and a real answer from your `ai_answers` table, not "answer
goes here".

**Locked.** Zero left. The chip is grey and says `0 OF 5 QUESTIONS LEFT`. The
red `lbl_locked` label is showing with the hours until they can ask again.
The Ask button is still there and still orange, because your criteria say
*The 6th question in a row is refused* and the way to test that is to press
it and be refused, which is Pattern 6 and Pattern 5. Greying the button out
would hide the thing you are meant to be able to test.

The designer draws all three as three frames: `HealthAI`, `HealthAI-answered`,
`HealthAI-locked`. One form in Anvil, three frames in Figma, because a frame
is a picture of a moment and a form is the thing that moves between them.

## What the builder does

Feature 5 on your architecture page: Patterns 1, 2, 8, 6, 10, 3, in that
order, with the `ai_usage` table doing the counting. The only thing this page
adds is which label to change when, and it is all Pattern 14 and Pattern 3:

- On load: read this rider's row in `ai_usage`, set `lbl_questions_left`, and
  show `lbl_locked` only if `locked_until` is still in the future.
- On a refused question: show `lbl_locked`, do not touch the answer card.
- On an answered question: fill `lbl_answer`, make `card_answer` visible, add
  one to the count, set the chip again.

**Test it by asking six questions.** If the sixth one answers, the feature is
not built. Your architecture says that too and it is worth saying twice.

## How to reach it

The design's bottom bar has Explore, Shop, Ride, Feed and Profile. It needs
a **Coach** tab, or whatever your team calls it, and Ride and Feed can go,
because they have no story. In Anvil that is a Link in the navigation column
with icon `fa:heartbeat`, next to Trails and Shop.

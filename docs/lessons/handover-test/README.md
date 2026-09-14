# Handing over a design, tested

No em dashes anywhere in this document or any copy it generates.

Four days. By the end, every team has handed a Figma file over from their
design brief page, watched it get reviewed against their own documents, broken
it on purpose to see the review catch it, and written up what they found so
somebody else could reproduce it.

It is also the first time anybody has used this feature, which makes the
class the testers. Every day's work is a real test of a real thing, and a fail
found this week is a fail nobody else hits.

The full test plan, all twenty-two tests, is
[Test the handover](/build/test-the-handover.html). Each day below takes a
slice of it.

| Day | Adds | Tests |
|---|---|---|
| [Day 1](day-1.html) | A file that follows the rules, shared from the design brief | T1 to T9 |
| [Day 2](day-2.html) | The review, read against the file, every finding checked | T10 to T14 |
| [Day 3](day-3.html) | Break it on purpose, four ways, and watch the review catch each | T15 to T20 |
| [Day 4](day-4.html) | The unshared file, the fix, and the write-up | T21, T22, Part 4 |

## What the teacher needs before Day 1

- The handover feature deployed: the **Share your design** box is at the
  bottom of every design brief page, and `/build/handover.html` opens.
- `TRAIL_CREW_TEACHER_EMAIL` set, so Day 1's last test can pass.
- Claude Code open on Day 2 with the Figma connector on, to run
  `/design-review <team-folder>` in front of the class.
- A Figma file of your own, shared with yourself, to demonstrate with. Two
  pages and two frames is plenty, and one thing wrong on purpose.

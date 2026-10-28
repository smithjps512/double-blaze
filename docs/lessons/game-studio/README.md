# Game Studio

No em dashes anywhere in this document or any copy it generates.

Six weeks, thirty classes, for sixth grade period 3. The class voted for this
unit 15 to 3. In their words: "I like coding games", "a fun playable game made
by me", "fun with friends". This unit takes that seriously and gives them the
part of making games that decides whether the game is any good: thinking it
through first.

By the end, every studio has:

- a **design doc** in [Game Studio](https://doubleblaze.solutions/studio): a
  pitch, players, a core loop, a world, mechanics, and levels written as player
  stories with checks and scenarios
- a **v1 game** built by Double Blaze from that doc, playtested by the class
- **one mechanic of their own**, built by hand in MakeCode Arcade
- a **v2 game** built from their own change requests, verified against their
  own checks, and launched on [/play](https://doubleblaze.solutions/play)

Everything they already know comes along: purpose is impact (a game's purpose
is the feeling it gives the player), there is always more than one user, user
stories, checks, Given/When/Then scenarios with a happy path and a bad day, the
Definition of Done, and QA reports.

## Studios and roles

Teams of 3 or 4 are called **studios**, formed on day 5 around pitches. Studio
names only, never a student's name, the same rule as Launch Pad.

Every studio has four roles. **Roles rotate every Monday** (days 6, 11, 16, 21
and 26), so everybody does every job at least once. In a studio of 3, the
Producer is also QA Lead.

| Role | Owns | Asks |
|---|---|---|
| **Producer** | The design doc and the plan. Types in /studio. Says what is done. | "Is it done, by our Definition of Done?" |
| **Game Designer** | Mechanics, levels, balance. | "Is it fun? What does the player feel?" |
| **Developer** | Checks and scenarios, with an eye on what can be built. MakeCode in week 4. | "Could somebody build this from what we wrote?" |
| **QA Lead** | Playtests, bad days, QA reports. | "What happens if the player does something weird?" |

Print the role cards from day 1 and keep them on the desks.

## What the teacher needs before day 1

- Chromebooks, one per student, plus at least one per studio that can stay
  signed in to /studio.
- [Game Studio](https://doubleblaze.solutions/studio) open on the projector
  with a demo studio signed in (period 3, team name **Demo Studio**). Nothing
  you do to it touches a real studio.
- [/play](https://doubleblaze.solutions/play) checked: it is where v1 and v2
  appear in weeks 5 and 6.
- Three games the class can play in the first two days. Any free browser game
  the school allows is fine. The class's own W.C.O 27 and Survival on /play
  work well: they were built from 6th grade writing.
- Sticky notes, index cards and markers for the paper prototype on day 10.
- **The day before week 4:** open [arcade.makecode.com](https://arcade.makecode.com)
  on a student Chromebook, start a new project, and press the play button on
  the simulator. If the school filter blocks it, ask for it to be unblocked
  that day, not on day 16.

## The teacher's build weekends

| When | You do | Students see it |
|---|---|---|
| After day 15 | `npm run studio:export`, then Double Blaze builds each studio's v1 from its design doc | Day 21, on /play |
| After day 24 | `npm run studio:export` again (change requests included), then v2 builds | Day 26, on /play |

Approve QA reports at [/play/teacher](https://doubleblaze.solutions/play/teacher)
on days 22 and 23, or studios will have nothing to triage on day 23.

## The days

| Day | Adds | Where |
|---|---|---|
| **Week 1** | **Studio kickoff** | |
| [Day 1](day-1.html) | What a game studio is, the four roles, taking a game apart | Paper |
| [Day 2](day-2.html) | The core loop in games they know | Paper |
| [Day 3](day-3.html) | Player types, and the feeling as the game's purpose | Paper |
| [Day 4](day-4.html) | A pitch: "It's a ___ game where you ___" | Index card |
| [Day 5](day-5.html) | Pitch day, and studios formed around pitches | The room |
| **Week 2** | **The design doc** | |
| [Day 6](day-6.html) | Pitch and Players | /studio |
| [Day 7](day-7.html) | Core loop, how you win, how you lose | /studio |
| [Day 8](day-8.html) | World and story | /studio |
| [Day 9](day-9.html) | Mechanics, with controls and a rule | /studio |
| [Day 10](day-10.html) | A paper prototype, played by another studio | Paper |
| **Week 3** | **Levels as stories** | |
| [Day 11](day-11.html) | Level stories | /studio Levels |
| [Day 12](day-12.html) | Checks a builder could test | /studio Levels |
| [Day 13](day-13.html) | Happy path scenarios | /studio Levels |
| [Day 14](day-14.html) | Bad day scenarios | /studio Levels |
| [Day 15](day-15.html) | Definition of Done review, design doc v1 turned in | /studio Design doc |
| **Week 4** | **MakeCode Arcade** | |
| [Day 16](day-16.html) | Sprites, and moving with the controller | MakeCode |
| [Day 17](day-17.html) | Overlaps, score and lives | MakeCode |
| [Day 18](day-18.html) | Tilemaps and the camera | MakeCode |
| [Day 19](day-19.html) | One mechanic from your own design doc | MakeCode |
| [Day 20](day-20.html) | Test it against your own checks | MakeCode, /studio |
| **Week 5** | **Playtesting** | |
| [Day 21](day-21.html) | v1 is live: play your own, then the playtest protocol | /play |
| [Day 22](day-22.html) | QA other studios' games | /play |
| [Day 23](day-23.html) | Triage: bugs into bad days, must, should, could | /play, /studio |
| [Day 24](day-24.html) | v2 change requests as level stories | /studio |
| [Day 25](day-25.html) | Balance as numbers | /studio |
| **Week 6** | **Launch** | |
| [Day 26](day-26.html) | v2 is live: verify against your checks | /play |
| [Day 27](day-27.html) | Onboarding: a tutorial level story | /studio |
| [Day 28](day-28.html) | A store page and a trailer pitch | /studio, paper |
| [Day 29](day-29.html) | Launch day showcase | /play |
| [Day 30](day-30.html) | Retrospective and portfolio | Paper |

## One rule for the six weeks

**If it is not in the design doc, it is not in the game.** Double Blaze builds
from what the studio wrote and nothing else, the same rule as the prototype
generator. A studio that wants a better game has one lever: write a better
doc. When a playtest finds something missing, the fix is a story, a check or
a scenario, never "can you just add".

# Sandwich Bot

Chef Byte, a friendly and slightly clueless robot, follows students' sandwich
and meal instructions exactly as written. It's from the Intro to Technology
"Exact Instructions Challenge". Just for fun, not graded. Computers do what
you say, not what you mean.

## Pages

| Path | What |
| --- | --- |
| `/trail-crew/sandwich-bot` | Gallery: a card per scene with a Play button |
| `/trail-crew/sandwich-bot/<id>` | Player: Next step, Play all, Back, Replay, speed, full screen, result card, game mode |
| `/trail-crew/sandwich-bot/library` | Every object and every move Chef Byte knows |

Keys: Right arrow = next step (plays one step, then stops), Left arrow =
back, Space = play all or pause, R = replay, F = full screen.

## Access (class only)

Same lock as Race Day: `RACE_DAY_CLASS_PASSWORD`, `RACE_DAY_TEACHER_CODE`,
and the `RACE_DAY_OPEN=1` sub day switch. It fails closed. Pages are `noindex`,
`private, no-store`, and have no link previews. No accounts, no database, and
no outside calls. Nothing a student does in game mode is saved.

## Student privacy (the repo is public)

- Scenes are stored under IDs only (`sub-001`, `sub-002`, ...). There are no
  names anywhere in the repo.
- Credits live in the `SANDWICH_BOT_CREDITS` Vercel setting, as JSON:
  `{"sub-001":"Alex","sub-002":"Sam"}` (first names or initials). They are read on the server after the password check.
- Photos of handwritten instructions are never committed. Type the
  transcription instead.

## Adding a submission

Everything for one submission lives in `sandwich-bot/submissions/<id>/`:

1. `transcription.md`: the exact words, with typos, numbering and spacing kept.
   Show it to the teacher before building the script.
2. `script.json`: the setup, the steps (`text` is the student's exact words),
   and the actions each step turns into. It also holds the gentle "missing
   steps" list and the fix cards. Copy `_template/`.
3. `log.md`: one row per step, saying what Chef Byte does and why.
4. Import the script in `apps/platform/src/lib/sandwich-bot/submissions.ts`.
5. Run `npm test -w @double-blaze/platform`. It lints every script, and the
   check includes no em dashes.

## Rules for reading instructions

- Follow every step literally, in order. Never fill in a missing step.
- Without a named tool, Chef Byte uses the silliest reasonable thing: its
  hand, or the whole closed jar.
- If a step is impossible, Chef Byte shrugs and moves on.
- Read misspellings kindly. The robot is the joke, never the student.
- Keep it kid safe: messes are fine, injuries are not.

## Code

`apps/platform/src/lib/sandwich-bot/`:

- `types.ts`: script format.
- `catalog.ts`: the object library.
- `world.ts`: the kitchen and the literal name lookup. For example, "bread"
  means the bag while the bag is closed.
- `actions.ts`: the action library.
- `engine.ts`: script to keyframes.
- `goals.ts`: checklists and the auto-written result.
- `timeline.ts`: playback interpolation.

The art is in `apps/platform/src/app/trail-crew/sandwich-bot/Art.tsx`.

To add an object, add it to `Kind`, `KINDS`, and `ObjectArt`. To add a move,
add a handler to `ACTIONS`.

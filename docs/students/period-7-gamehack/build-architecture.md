# GAMEHACK: build architecture

Team: GameHack. Tool: Anvil.

## The buildable slice

**In the slice, in this order:**

1. Browse tutorials by game
2. Search for a game
3. Add a tutorial
4. Ask the helper

**Stubbed, and why:**

- **An AI that understands games.** Your helper answers from a table of question
  and answer pairs that you write. That is honest and it works. Building a real
  game-aware AI is a research project.
- **Maps, cheat codes and mods.** No user story for any of them, so there is
  nothing to build from. They are also all the same shape as a tutorial: a title,
  a game, a link. Once tutorials work, adding a type column gets you all three
  at once, which is worth noticing before you build three separate screens.

**One thing to settle first.** One of you wrote "There are no scenarios in our
App, it just gives you links to video game tutorials". The other two wrote
stories about an AI that calculates methods. Those are two different products.
Decide which one GAMEHACK is before you build, because it changes everything
below.

## Screens to create

| Form name | What it is |
|---|---|
| `Games` | Every game with tutorials |
| `Tutorials` | Tutorials for one game |
| `AddTutorial` | Submit a tutorial link |
| `Helper` | Ask a question, get an answer |

## Components, with the exact names to use

**Games:** `txt_search`, `btn_search`, `rp_games` with `lbl_game_name`,
`lbl_tutorial_count`

**Tutorials:** `lbl_game_name`, `rp_tutorials` with `lbl_tutorial_title`,
`lbl_tutorial_link`; `btn_add`

**AddTutorial:** `dd_game`, `txt_title`, `txt_link`, `btn_submit`, `lbl_error`

**Helper:** `txt_question`, `btn_ask`, `lbl_answer`

## Data tables

- **games**: `name`
- **tutorials**: `game` (text), `title`, `link`, `added_by`
- **helper_answers**: `keyword`, `answer`

## How each feature gets built

### Feature 1: Browse tutorials by game
Patterns: **8**, **9**, then **1**, **4** to open one game.

### Feature 2: Search
Patterns: **1**, **2**, **8**, **9**.

Search the table with what was typed:
`app_tables.games.search(name=typed_in)`. That only finds exact matches, which
is a good problem to hit. Solving it properly comes later.

### Feature 3: Add a tutorial
Patterns: **1**, **2**, **13**, **6**, **7**, **5**.

Your criteria say a user must be able to follow the tutorials you have linked.
The check you can actually build is that the link is not empty.

### Feature 4: Ask the helper
Patterns: **1**, **2**, **8**, **6**, **3**.

Look for a keyword from the question in your answers table. If nothing matches,
say so honestly rather than guessing. "I do not know that one yet" is a better
answer than a wrong one, and knowing that is worth more than the feature.

## What to do when you are stuck

1. Do not know what the app should do, go to your build card.
2. Do not know how to write it, go to the Pattern Book.
3. Do not know what fills the blank, come back here.

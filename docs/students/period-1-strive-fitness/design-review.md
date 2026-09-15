# Strive Fitness: design review

Team: BMS Crew.

Reviewed: 2026-09-15

Your Figma file, read against your own design brief, build cards and stories. 1 page, 17 frames, 321 layers. Every line below is two of your documents disagreeing, so it can be checked, and it gets shorter as you fix things. It does not say whether the design is any good. That is a conversation with people.

The rules it checks are on [Handing over your design](/build/handover.html).

## The one next thing

**No page is named after a build card.**

The page is the link between a story and a design. A card with no page is a feature nobody has drawn, or a drawing nobody can trace back to a story.

**Do this:** One page per card, named exactly like the card: "Card 3 · Horsepower builder". Move the frames for that story on to it.

## Do this first

**No page is named after a build card.**

The page is the link between a story and a design. A card with no page is a feature nobody has drawn, or a drawing nobody can trace back to a story.

**Fix:** One page per card, named exactly like the card: "Card 3 · Horsepower builder". Move the frames for that story on to it.

*Where:* Sign up, Log an activity, See your history, Chatroom, Weather based plan

**3 screens have no frame: SignIn, Home, LogActivity.**

Your builders create one Form per screen with exactly these names. A frame with a different name is a screen they cannot find, and a screen with no frame is one they will invent.

**Fix:** Name each frame exactly as the brief does, capital letters and all. States go after a slash: Builder / empty.

*Where:* SignIn, Home, LogActivity

## Then this

**15 frames are not a screen in your brief: £5 - Enter Code, £4 - Email Inbox, £1 - Sign Up, £3 - Verification, £2 - Create Password, £2 - Enter Password, and more.**

A frame nobody can match to a form is either a screen with the wrong name, or a screen your architecture does not have yet.

**Fix:** If it is one of your screens, rename it to match the brief. If it is new, it belongs on the architecture page first, through your builders.

**2 screens have no empty state: History, Chatroom.**

On the first day your app is real, the empty state is the only state anybody sees.

**Fix:** Duplicate the frame, name it "Form / empty", and draw what the screen says when nothing has been added yet.

**2 screens have no error state: History, Chatroom.**

Most briefs have an lbl_error. It exists. Nobody has decided what it looks like, so the builder decides at speed, and it shows.

**Fix:** Duplicate the frame, name it "Form / error", and draw the app refusing something.

**6 components from your brief are not layers in their frames. Chatroom is missing txt_message, btn_post, rp_messages, lbl_message_line.**

The layer name is how a builder finds their component in your design. A layer called Rectangle 47 tells them nothing; one called lbl_total_hp tells them which line draws it.

**Fix:** Select the layer, rename it to the brief's name, exactly. Ten minutes a screen.

*Where:* Chatroom: txt_message, btn_post, rp_messages, lbl_message_line; History: rp_activities, lbl_activity_line

**1 number on the frames is not in your documents: 1234.**

A design tool fills space with plausible numbers, and plausible is worse than blank because nobody notices it is fake until it is in the app.

**Fix:** Replace each one with a real number, or delete it. If it is real, put it in your plan so the next review knows.

## When you have a minute

**There is no Cover page.**

The cover is where your colours and fonts live as hex codes and names, which is the only form they can cross into Anvil in.

**Fix:** Add a first page called Cover: product name, team name, one sentence, hex codes, fonts. No student names.

**1 page is not named after a card: Page 1.**

Anything on a page with no card is either scratch work, which is fine, or a feature that is not on a story, which will not get built.

**Fix:** Rename it after its card, or call it Scratch so everybody knows.

**19 layers still have Figma's default name: image 5, Rectangle, Frame, and more.**

Decoration can keep its default name. Anything that will be built cannot.

**Fix:** Rename the ones that are components. Leave the rest, or delete them if they are paint.

## Cards and pages

| Card | Page |
|---|---|
| Card 1: Sign up | none |
| Card 2: Log an activity | none |
| Card 3: See your history | none |
| Card 4: Chatroom | none |
| Card 5: Weather based plan | none |

## Screens

| Screen | Frames | Empty | Error | Components found |
|---|---|---|---|---|
| `SignIn` | none |  |  |  |
| `Home` | none |  |  |  |
| `LogActivity` | none |  |  |  |
| `History` | History | no | no | missing 2 |
| `Chatroom` | Chatroom | no | no | missing 4 |

## When the review is clean

Share the file again from your design brief page and the next review reads the new version. When nothing disagrees, your design is the one that gets built for demo day.

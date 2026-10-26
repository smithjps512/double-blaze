# Launch Pad: sixth grade plans

No em dashes anywhere in this document or any copy it generates.

Launch Pad is a one day introduction to how every product, program, or
project starts. It is not tied to any other unit. Teams learn three ideas and
write each one down for something that would make a difference in a
community they belong to:

1. **Purpose.** Not what it does: the impact it has. Who is better off, and how.
2. **Users.** There is always more than one. One sentence each on what matters to them.
3. **User stories.** As a ___, I want to ___, so I can ___. Three at least.
   Acceptance criteria are a bonus for teams that get there.

The slides are `docs/presentations/Launch-Pad.pptx` (generator:
`launch-pad.js` beside it). Teams work at **/trail-crew/launch**.

## The day (50 minutes)

| Minutes | What happens |
| --- | --- |
| 0 to 15 | Slides 1 to 13. The three ideas, each with a quick check. |
| 15 to 18 | Slide 14. Teams of 3 or 4, one Chromebook types, open Launch Pad. |
| 18 to 45 | Teams work: idea, purpose, users, three stories. Walk the room. |
| 45 to 50 | Slide 15. Two or three teams read their purpose out loud. |

## The page

Teams type a period and a team name. Everyone on a team types the same name
to open the same plan; teammates can press **Refresh** to read along. It
saves to the class a second after typing stops and keeps a copy on the
Chromebook. If two Chromebooks save over each other, the page asks which one
to keep instead of losing either.

The hints under each box are rules in `apps/platform/src/lib/launch/plan.ts`,
not a model. The one that matters most is the purpose check: a sentence that
starts "It is an app that..." and never says what changes gets asked for the
impact.

Saving needs migration `0045_launch_pad.sql` applied. Without it the page
still works, saves on the Chromebook only, and says so.

## Level up: changing the app after they see it

Once a team has a plan, the **Level up your app** step (last tab, and where a
finished team lands when it opens its plan) is the loop real teams run: look
at what you built, notice what is missing, change the plan, build it again.

- **See my app** builds the team's prototype in the browser from what is on
  screen, with the same export and generator as the gallery, and opens it in
  a new tab. No server, no waiting for the teacher, and it works when saving
  is off. The gallery copy (the one you touched up) is not changed by it.
- **Ideas for your next change** is a to-do list from `levelUp` in
  `apps/platform/src/lib/launch/plan.ts`: a purpose that only says what it
  does, a story for someone who is not a user, a story with nothing to click
  (no acceptance criteria), a user nobody wrote a story for, and always
  "add another story". Each item has a button that opens the exact box, and
  the item disappears when it is fixed.

To put a team's improvements into the gallery, export just that team (naming
it overwrites the folder) and rebuild:
`npm run launch:export -- p3-da-purples` then `npm run launch:prototypes`.

## Over the weekend: from what they wrote to a prototype

```bash
npm run launch:export        # every team into docs/launch/p<period>-<team>/
# touch up product-plan.md and user-stories.md in each folder
npm run launch:prototypes    # builds public/launch/<folder>/ and the gallery
```

The export writes the same `product-plan.md` and `user-stories.md` the
Trail Crew generator reads (see `docs/students/README.md` for the rules), so
everything there applies: a story with no "so that" shows up as one, and a
story with acceptance criteria gets something to click. Touching up is fair,
and worth keeping light; the prototype is most exciting when a team can find
their own sentences in it.

An exported folder is never overwritten unless you pass `--force` or name
it (`npm run launch:export -- p3-the-lions`), so your edits are safe from a
second export. With no Supabase keys in the terminal, save the
`launch_plans` rows as JSON from the dashboard and pass
`--from rows.json`.

Prototypes appear under the workspace on `/trail-crew/launch`, in a gallery
of their own, apart from Trail Crew's. A folder starting `example-` is shown
as the demo link instead of as a team; `example-finders-keepers` is the
worked example from the slides. A folder starting `_` is skipped.

Folder names become public URLs: team names only, never a student's name.
To clear a period for next year:
`delete from public.launch_plans where period = N;`

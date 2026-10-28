# Game Studio designs and builds

No em dashes anywhere in this document or any copy it generates.

Each studio's design doc, exported from doubleblaze.solutions/studio for the
Double Blaze build. The unit is `docs/lessons/game-studio`.

```bash
npm run studio:export                      # every studio, new folders only
npm run studio:export -- p3-pixel-pickles  # one studio, overwrite
```

A folder is `p<period>-<studio>` and holds:

- `game-design.md`: the pitch, the feeling, players, core loop with win and
  lose, world, and mechanics with their controls and exact rules.
- `levels.md`: every level as a player story with checks and Given/When/Then
  scenarios, in the same format as Launch Pad's stories.

## Building a game

Build each game as one HTML file at
`apps/platform/public/demo/<folder>/index.html`, like the Launch Pad apps:
phone sized, with X-ray quoting the studio's own levels and mechanics next
to what was built from them, and anything built without a story tagged as
such. Build from what they wrote: a mechanic with no exact rule is a gap to
point out, not a guess to hide.

Then add the game to `apps/platform/src/data/game-gallery.json` so it shows
first on /play with Play and QA it:

```json
[{ "slug": "p3-pixel-pickles", "gameName": "Pickle Panic", "teamName": "Pixel Pickles",
   "period": 3, "pitch": "It's a platformer where you rescue pickles.",
   "playHref": "/demo/p3-pixel-pickles/index.html" }]
```

The slug must be the folder name, so the studio sees its own reports on
/play, and "Turn into a bad day" opens /studio for that studio.

Build weekends: after day 15 (v1) and after day 24 (v2).

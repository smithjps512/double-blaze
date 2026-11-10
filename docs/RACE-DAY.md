# Race Day

The real CO2 dragster race for Intro to Technology, timed frame by frame from
30 fps phone video. Lives at `/trail-crew/dragster/race-day`, next to the
virtual Dragster Lab.

## Pages

| Path | Who | What |
| --- | --- | --- |
| `/trail-crew/dragster/race-day` | class | Leaderboard: best run per car, place ranges for ties, quality flags |
| `/trail-crew/dragster/race-day/lesson` | class | Video vs. electronic gate, worked on our own runs. Read only |
| `/trail-crew/dragster/race-day/teacher` | teacher | Confirm cars, set periods, enter gate times, add runs, mark reruns |

## Access (class only)

- `RACE_DAY_CLASS_PASSWORD`: students. `RACE_DAY_TEACHER_CODE`: the teacher screen, and it opens the student pages too.
- Fails closed: with no password set every page stays locked, previews included.
- Cookies are an HMAC keyed by the secret, 8 hour life. Change a secret to sign everyone out.
- `noindex` meta, an `X-Robots-Tag` header, `private, no-store` caching, no Open Graph tags, and `/trail-crew` is already disallowed in robots.txt.

## Ties

Video times are ±0.05 s and gate times ±0.001 s. Two cars within the larger of
their uncertainties cannot be ranked, so each car shows a range of places: its
best place counts only the cars that were clearly faster, its worst place
counts every car that was not clearly slower. Logic and tests are in
`apps/platform/src/lib/race-day/model.ts`.

A car's time is its fastest run that is not excluded, preferring runs without a
slow launch. A gate time, once entered, replaces the video time for that run.

## Data

- `supabase/migrations/0050_race_day.sql` creates `race_day_sessions`, `race_day_cars` and `race_day_runs` and seeds the 18 runs from 2026-11-10.
- Without Supabase, the pages read the same data from `src/lib/race-day/seed.ts` and the teacher screen says it cannot save.
- Every car starts unconfirmed and the leaderboard says so until the teacher confirms it.

## Student privacy

Car only, for now. There are no name or photo columns. `identity_level` exists
so a later change can add first name, or full name plus photo, per student once
signed permission is in, defaulting to car only. Photos, names and the clothing
notes used to match cars stay out of this public repo and out of the database.

## Not built yet

- Run detail with a frame-step video scrubber (needs the clips in a private storage bucket).
- Cars gallery and the name and photo privacy levels.
- Average speed (needs the track length).

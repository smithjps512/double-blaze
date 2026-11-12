# Race Day

The real CO2 dragster race for Intro to Technology, timed frame by frame from
30 fps phone video. Lives at `/trail-crew/dragster/race-day`, next to the
virtual Dragster Lab.

## Pages

| Path | Who | What |
| --- | --- | --- |
| `/trail-crew/dragster/race-day` | class | Leaderboard: best run per car, place ranges for ties, quality flags |
| `/trail-crew/dragster/race-day/lesson` | class | Video vs. electronic gate, worked on our own runs. Read only |
| `/trail-crew/dragster/race-day/reflection` | anyone with the link | The CO2 project reflection: 21 answers, 775+ words, turned in to the teacher |
| `/trail-crew/dragster/race-day/teacher` | teacher | Confirm cars, set periods, enter gate times, add runs, mark reruns |
| `/trail-crew/dragster/race-day/teacher/reflections` | teacher | Read, score (out of 20) and comment on reflections, read one question across the class, download a CSV |

## Access (class only)

- `RACE_DAY_CLASS_PASSWORD`: students. `RACE_DAY_TEACHER_CODE`: the teacher screen, and it opens the student pages too.
- Sub days: set `RACE_DAY_OPEN=1` in Vercel and redeploy to open the class pages (leaderboard, lesson, reflection) with no password. Teacher pages still need the teacher code, and the teacher sees a reminder banner while it is on. Delete it and redeploy to lock again.
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

- `supabase/migrations/0050_race_day.sql` creates `race_day_sessions`, `race_day_cars` and `race_day_runs` and seeds the first 18 runs. `0052` adds the afternoon session on 2026-11-10 and the morning session on 2026-11-11, for 27 runs in all.
- Without Supabase, the pages read the same data from `src/lib/race-day/seed.ts` and the teacher screen says it cannot save.
- Every car starts unconfirmed and the leaderboard says so until the teacher confirms it.

## Student privacy

- First names live only in `race_day_students` (migration 0051), never in this repo, which is public.
- Each student links to the car they raced. The link starts as a guess from the photos and the teacher confirms it against the clip.
- Students see cars only. A first name shows next to a car on the leaderboard only when the teacher ticks "Show first name" for that student, after permission is in. `forStudents()` strips everything else before data reaches a class page, and a test checks it.
- No photos are stored anywhere, and clothing notes stay with the teacher.

## Project reflection

The assignment is in `docs/lessons/co2-car-reflection/ASSIGNMENT.md` and the
questions in `apps/platform/src/lib/race-day/reflection.ts`; keep them in step.
The page needs no class password, so students start straight from the link; it shows nothing about anyone else, and reading answers stays behind the teacher code. Students give a full name and period, which live only in
`race_day_reflections` (migration 0054). Drafts save in the student's browser
as they type. Turn in stays locked until every answer meets its word minimum
and is not padded by repetition, and `POST /api/race-day/reflection` runs the
same checks again. Turning in again adds a new row; the teacher screen shows
the newest per student by default.

## Not built yet

- Run detail with a frame-step video scrubber for students. The teacher screen already has a frame viewer that plays clips locally and never uploads them.
- Cars gallery and photos (the full name plus photo level).
- Speed column: average over the 51 ft track (`TRACK_FT` in model.ts).

-- Race Day: two more sessions and nine more runs.
--
-- The afternoon class on 2026-11-10 (session C) and the first class on
-- 2026-11-11 (session D), from the updated runs.json. Sessions now carry
-- their own date. The teacher confirmed the four cars in session D against
-- the clips, so they start confirmed. The students' first names for those
-- runs live only in race_day_students, never here.

alter table public.race_day_sessions add column if not exists race_date date not null default '2026-11-10';

update public.race_day_sessions set label = 'Nov 10 morning session' where id = 'A' and label = 'Morning session';
update public.race_day_sessions set label = 'Nov 10 late morning session' where id = 'B' and label = 'Late morning session';

insert into public.race_day_sessions (id, label, race_date, clips_recorded) values
  ('C', 'Nov 10 afternoon session', '2026-11-10', '14:15 to 14:45'),
  ('D', 'Nov 11 morning session', '2026-11-11', '08:11 to 08:22')
on conflict (id) do nothing;

-- The updated data no longer calls r08 the fastest run: r23 and r20 beat it.
update public.race_day_runs set note = '' where id = 'r08' and note = 'Fastest run of the day so far.';

insert into public.race_day_cars (id, session_id, label, confirmed, match_hint) values
  ('c19', 'C', 'Blue', false, ''),
  ('c20', 'C', 'Dark red', false, ''),
  ('c21', 'C', 'Olive/grey', false, ''),
  ('c22', 'C', 'Blue', false, 'Camera pans during this run. May be the same blue car as r19.'),
  ('c23', 'C', 'Tan/black camo', false, ''),
  ('c24', 'D', 'Silver/white', true, ''),
  ('c25', 'D', 'Grey with red and green', true, ''),
  ('c26', 'D', 'Black with natural wood top', true, ''),
  ('c27', 'D', 'Purple', true, '')
on conflict (id) do nothing;

insert into public.race_day_runs (id, car_id, session_id, clip, start_s, finish_s, elapsed_s, quality, note) values
  ('r19', 'c19', 'C', 'IMG_7824', 3.200, 4.170, 0.970, 'ok', ''),
  ('r20', 'c20', 'C', 'IMG_7824', 10.600, 11.500, 0.900, 'ok', ''),
  ('r21', 'c21', 'C', 'IMG_7825', 6.050, 8.100, 2.050, 'slow_launch', 'Car crept off the gate for about a second before accelerating. Candidate for a rerun.'),
  ('r22', 'c22', 'C', 'IMG_7825', 13.240, 14.370, 1.130, 'ok', 'Camera pans during this run. May be the same blue car as r19, unconfirmed.'),
  ('r23', 'c23', 'C', 'IMG_7833', 5.730, 6.600, 0.870, 'ok', 'Fastest run of the day so far. Car overran the end of the track after the finish. Clip ends with a close-up of the car.'),
  ('r24', 'c24', 'D', 'IMG_7837', 3.930, 5.120, 1.190, 'ok', 'Head-to-head race with r25, both cars released together. Won by about 0.30 s. Start gate is distant in frame.'),
  ('r25', 'c25', 'D', 'IMG_7837', 3.930, 5.420, 1.490, 'ok', 'Head-to-head race with r24, both cars released together. Start gate is distant in frame.'),
  ('r26', 'c26', 'D', 'IMG_7838', 17.370, 18.830, 1.460, 'ok', 'Head-to-head race with r27. Crossed the finish first, about 0.20 s ahead. Start gate is distant in frame.'),
  ('r27', 'c27', 'D', 'IMG_7838', 17.520, 19.030, 1.510, 'ok', 'Head-to-head race with r26. Left the start gate about 0.15 s after the other car, so most of the finish gap came from the launch. Start gate is distant in frame.')
on conflict (id) do nothing;

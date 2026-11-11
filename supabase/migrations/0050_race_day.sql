-- Race Day: real CO2 dragster runs, timed from video, for the class only.
--
-- Intro to Technology raced their cars on 2026-11-10. Each run was timed by
-- stepping through 30 fps iPhone video, so every time carries about 0.05 s of
-- uncertainty. /trail-crew/dragster/race-day shows the standings behind a
-- class password; the teacher screen confirms cars and enters gate times.
--
-- Cars only. There are no student name or photo columns on purpose: the site
-- shows a car until the teacher has signed permission, and identity_level is
-- the switch that a later migration will add names and photos behind. Student
-- photos, names and the clothing notes used to match cars stay out of the
-- database and out of the repo.
--
-- Separate from dragster_runs, which holds the virtual Dragster Lab's
-- simulated times.

create table if not exists public.race_day_sessions (
  id text primary key,
  label text not null,
  -- Set by the teacher once known.
  period integer check (period between 1 and 7),
  clips_recorded text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.race_day_cars (
  id text primary key default ('c' || substr(md5(random()::text), 1, 8)),
  session_id text not null references public.race_day_sessions (id),
  label text not null check (char_length(label) between 1 and 60),
  -- Nothing is final until the teacher has checked the car against its runs.
  confirmed boolean not null default false,
  identity_level text not null default 'car_only'
    check (identity_level in ('car_only', 'first_name', 'full_name_photo')),
  -- Teacher only: a photo clue for confirming the match. Car descriptions only.
  match_hint text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.race_day_runs (
  id text primary key default ('r' || substr(md5(random()::text), 1, 8)),
  car_id text not null references public.race_day_cars (id),
  session_id text not null references public.race_day_sessions (id),
  clip text not null default '',
  start_s numeric(7, 3) not null check (start_s >= 0),
  finish_s numeric(7, 3) not null,
  elapsed_s numeric(6, 3) not null check (elapsed_s > 0),
  -- From the electronic finish gate, entered later when there is one.
  gate_time_s numeric(6, 3) check (gate_time_s > 0),
  quality text not null default 'ok'
    check (quality in ('ok', 'finish_gate_out_of_frame', 'finish_gate_partly_out_of_frame', 'slow_launch')),
  note text not null default '',
  rerun boolean not null default false,
  -- Kept on record but left out of the standings.
  excluded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (finish_s > start_s)
);

create index if not exists race_day_runs_car on public.race_day_runs (car_id);

alter table public.race_day_sessions enable row level security;
alter table public.race_day_cars enable row level security;
alter table public.race_day_runs enable row level security;

-- No policies on purpose. Race Day talks to /api/race-day, which checks the
-- class password or teacher code and writes with the service role.

insert into public.race_day_sessions (id, label, clips_recorded) values
  ('A', 'Morning session', '09:31 to 09:40'),
  ('B', 'Late morning session', '11:02 to 12:02')
on conflict (id) do nothing;

insert into public.race_day_cars (id, session_id, label, match_hint) values
  ('c01', 'A', 'Camo/brown', ''),
  ('c02', 'A', 'Black', ''),
  ('c03', 'A', 'Yellow', ''),
  ('c04', 'A', 'Orange', ''),
  ('c05', 'A', 'Pink', ''),
  ('c06', 'A', 'Green', ''),
  ('c07', 'A', 'Red', ''),
  ('c08', 'A', 'Dark green', ''),
  ('c09', 'B', 'Blue/white', 'Photos IMG_7812 and IMG_7817 show a blue rear, white front rail car. Medium confidence.'),
  ('c10', 'B', 'Green/teal', ''),
  ('c11', 'B', 'Red', 'Photo IMG_7811 shows a red/orange body with a teal top stripe, also seen in clip IMG_7810. Low confidence.'),
  ('c12', 'B', 'Lime green', ''),
  ('c13', 'B', 'Pink/white', 'Photo IMG_7818 shows an unpainted natural wood car that may read as pink/white on video. Low confidence.'),
  ('c14', 'B', 'Pink/magenta', 'Photo IMG_7813 shows a magenta, sculpted body car. Low confidence: r16 may be this car instead.'),
  ('c15', 'B', 'Blue/purple', 'Photo IMG_7813 shows a blue body with a yellow tail. Low confidence.'),
  ('c16', 'B', 'Magenta', 'May be the magenta sculpted car in photo IMG_7813. Unconfirmed.'),
  ('c17', 'B', 'Pink', 'Session B has four pink or magenta cars and four pink or magenta runs, so color alone cannot settle this one.'),
  ('c18', 'B', 'Dark (black or dark maroon)', '')
on conflict (id) do nothing;

insert into public.race_day_runs (id, car_id, session_id, clip, start_s, finish_s, elapsed_s, quality, note) values
  ('r01', 'c01', 'A', 'IMG_7797', 2.180, 3.270, 1.090, 'finish_gate_out_of_frame', 'Finish taken as car leaving bottom of frame. True time likely 0.03 to 0.05 s longer.'),
  ('r02', 'c02', 'A', 'IMG_7797', 2.790, 3.980, 1.190, 'finish_gate_out_of_frame', 'Finish taken as car leaving bottom of frame. True time likely 0.03 to 0.05 s longer.'),
  ('r03', 'c03', 'A', 'IMG_7798', 3.020, 4.350, 1.330, 'ok', ''),
  ('r04', 'c04', 'A', 'IMG_7798', 3.920, 5.250, 1.330, 'ok', ''),
  ('r05', 'c05', 'A', 'IMG_7799', 2.050, 3.150, 1.100, 'ok', ''),
  ('r06', 'c06', 'A', 'IMG_7799', 10.570, 11.850, 1.280, 'ok', ''),
  ('r07', 'c07', 'A', 'IMG_7801', 2.720, 3.680, 0.960, 'ok', ''),
  ('r08', 'c08', 'A', 'IMG_7801', 3.150, 4.080, 0.930, 'ok', 'Fastest run of the day so far.'),
  ('r09', 'c09', 'B', 'IMG_7803', 3.790, 4.800, 1.010, 'ok', ''),
  ('r10', 'c10', 'B', 'IMG_7806', 2.780, 4.000, 1.220, 'ok', ''),
  ('r11', 'c11', 'B', 'IMG_7806', 3.070, 5.350, 2.280, 'slow_launch', 'Car rolled slowly off the gate for about a second before accelerating. Candidate for a rerun.'),
  ('r12', 'c12', 'B', 'IMG_7807', 3.630, 4.950, 1.320, 'ok', ''),
  ('r13', 'c13', 'B', 'IMG_7807', 4.050, 5.480, 1.430, 'ok', ''),
  ('r14', 'c14', 'B', 'IMG_7808', 3.770, 4.850, 1.080, 'finish_gate_partly_out_of_frame', ''),
  ('r15', 'c15', 'B', 'IMG_7808', 16.300, 17.570, 1.270, 'finish_gate_partly_out_of_frame', ''),
  ('r16', 'c16', 'B', 'IMG_7821', 13.250, 14.370, 1.120, 'ok', 'Start read from a small, distant view of the gate, so the start frame is less certain than usual. Possibly the magenta sculpted car in photo IMG_7813, unconfirmed.'),
  ('r17', 'c17', 'B', 'IMG_7822', 1.650, 2.650, 1.000, 'ok', 'Start read from a small, distant view of the gate, so the start frame is less certain than usual.'),
  ('r18', 'c18', 'B', 'IMG_7822', 11.870, 12.840, 0.970, 'ok', 'Start read from a small, distant view of the gate, so the start frame is less certain than usual.')
on conflict (id) do nothing;

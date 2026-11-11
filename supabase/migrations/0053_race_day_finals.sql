-- Race Day: finals.
--
-- The class ran a finals round on 2026-11-11. Finals runs belong to the same
-- cars as their prelim runs but are ranked on their own board, so a finals
-- time never moves a prelim place and the champion comes from the finals.
-- Every existing run is a prelim.

alter table public.race_day_runs
  add column if not exists stage text not null default 'prelim'
  check (stage in ('prelim', 'final'));

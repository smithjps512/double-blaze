-- Tie a vote's plant to its name's plant, in the database rather than only in
-- the route that writes it.
--
-- Found by testing: nothing stopped a row claiming specimen_id 'image-6-png'
-- while its name_id belonged to a name on 'image-5-png'. The vote route already
-- rejects that, so it was never reachable through the app, but a tally that can
-- silently count votes for the wrong plant is not something to leave resting on
-- one if statement in one file.
--
-- The composite foreign key makes the mismatch impossible. It needs a unique
-- key on the parent side to point at, which is what the first statement adds.

alter table public.plant_id_names
  add constraint plant_id_names_id_specimen_key unique (id, specimen_id);

alter table public.plant_id_votes
  drop constraint if exists plant_id_votes_name_id_fkey;

alter table public.plant_id_votes
  add constraint plant_id_votes_name_specimen_fkey
  foreign key (name_id, specimen_id)
  references public.plant_id_names (id, specimen_id)
  on delete cascade;

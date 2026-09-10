-- Photos for Name That Plant.
--
-- Private and served through the app, the same choice showcase-media makes: it
-- keeps the storage URLs out of the open and leaves the cache headers ours to
-- set. That matters more here than usual, because these are photographs
-- attached to a page about children's schoolwork.
--
-- The teacher uploads through the class page itself rather than the Supabase
-- dashboard. Adding a photo is something she will do all year as the FarmBot
-- plants come on, and it should not need a database login.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'greenhouse-media', 'greenhouse-media', false, 8388608,
  array['image/jpeg','image/png','image/webp','image/avif','image/gif']
)
on conflict (id) do nothing;

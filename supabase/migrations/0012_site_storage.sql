-- Storage buckets for customer sites.
--
-- Why serving reads storage rather than Postgres: with a handful of Trailhead
-- sites, rendering from a JSONB column on every cache miss was fine. As a
-- hosting product it means customer uptime depends on the same database that
-- runs billing. Publishing writes rendered artifacts here instead, so a
-- published page is a file on a CDN and the database is only the authoring
-- store.
--
-- site-artifacts: rendered HTML, written at publish time under an immutable
-- {site_id}/{version_id}/ prefix. Immutable prefixes are what make publishing a
-- pointer move and rollback free: the old version's files are still sitting
-- there untouched.
--
-- site-assets: customer uploads (images, audio, documents).
--
-- Both buckets are private. The site runtime reads them with the service role
-- and serves the bytes itself, which keeps storage URLs out of the open and
-- leaves cache headers ours to set. A public bucket would also make every
-- customer's assets enumerable by anyone holding the publishable key.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-artifacts', 'site-artifacts', false, 10485760, array['text/html','text/css','application/json'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-assets', 'site-assets', false, 52428800, null)
on conflict (id) do nothing;

-- Staff-only policies. There is deliberately no anon policy on either bucket.
drop policy if exists site_artifacts_staff_read on storage.objects;
create policy site_artifacts_staff_read on storage.objects
  for select using (bucket_id = 'site-artifacts' and is_staff());

drop policy if exists site_assets_staff_all on storage.objects;
create policy site_assets_staff_all on storage.objects
  for all using (bucket_id = 'site-assets' and is_staff())
  with check (bucket_id = 'site-assets' and is_staff());

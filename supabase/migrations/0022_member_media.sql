-- Storage for things members upload (session 4, and session 5 after it).
--
-- 0012 created two staff-only buckets for the site runtime. This is the first
-- bucket a member writes to, so it is the first one whose policies are about a
-- club's own people rather than about Double Blaze.
--
-- One bucket rather than one per kind. A profile photo and an article's audio
-- have the same owner, the same tenant, and the same access rule, and differ
-- only in size and mime type, which the application checks. Two buckets would
-- mean two sets of nearly identical policies to keep in step.
--
-- Private, like the other two. Reads go through the application, which checks
-- membership and sets its own cache headers. A public bucket would make every
-- member's photo enumerable by anyone holding the publishable key, and this is
-- a club whose whole premise is that its inside is not public.
--
-- ---------------------------------------------------------------------------
-- The path convention is the security model
-- ---------------------------------------------------------------------------
--
--   <site_id>/<member_id>/<random>.<ext>
--
-- Both policies key on those first two segments, so the path is not decoration.
-- A member may write only under their own site and their own member id, which
-- means one club's member cannot write into another club's prefix and one
-- member cannot overwrite another's photo.
--
-- storage.foldername(name) splits on "/", and it is 1-indexed.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'member-media',
  'member-media',
  false,
  -- 50MB, sized for session 5's audio rather than session 4's photos. The
  -- application holds the tighter per-kind limits, because "an avatar may be
  -- 5MB" is a product rule that should not need a migration to change.
  52428800,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav',
    'application/pdf'
  ]
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- A member writes only into their own folder.
drop policy if exists member_media_own_write on storage.objects;
create policy member_media_own_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'member-media'
    and app.is_active_site_member((storage.foldername(name))[1]::uuid)
    and (storage.foldername(name))[2]::uuid
        = app.current_site_member_id((storage.foldername(name))[1]::uuid)
  );

-- And replaces or removes only their own. Administrators can remove anything in
-- their own club, which is what session 9's content removal will need.
drop policy if exists member_media_own_update on storage.objects;
create policy member_media_own_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'member-media'
    and (storage.foldername(name))[2]::uuid
        = app.current_site_member_id((storage.foldername(name))[1]::uuid)
  );

drop policy if exists member_media_own_delete on storage.objects;
create policy member_media_own_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'member-media'
    and (
      (storage.foldername(name))[2]::uuid
        = app.current_site_member_id((storage.foldername(name))[1]::uuid)
      or app.is_site_admin((storage.foldername(name))[1]::uuid)
    )
  );

-- Any active member of that club may read. Note this is the club in the path,
-- not the reader's club: a member of club A reading a path under club B fails,
-- because they are not an active member of B.
drop policy if exists member_media_member_read on storage.objects;
create policy member_media_member_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'member-media'
    and app.is_active_site_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists member_media_staff_all on storage.objects;
create policy member_media_staff_all on storage.objects
  for all using (bucket_id = 'member-media' and is_staff())
  with check (bucket_id = 'member-media' and is_staff());

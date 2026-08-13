-- Bootstrap the Electric Grid engagement.
--
-- Deployment data rather than schema, kept here so the repo records how the
-- first paid site came into existence. Idempotent, so replaying it is
-- harmless.
--
-- These are the first rows ever written to organizations, projects and sites.
-- That is the Trailhead-to-paid conversion becoming a record rather than a
-- story, and sites.source_trailhead_site_id is the attribution link that makes
-- "does Trailhead lead to paid engagements" a query.
--
-- James is seeded as the first administrator to solve the bootstrap problem:
-- approving a member requires being an admin, so somebody has to exist before
-- anybody can be approved. He admits the club's own administrator, after which
-- his role can be reduced or removed.
--
-- The seeded row has a null auth_user_id on purpose. No auth identity exists
-- until he signs in, and the row is claimed by email at first sign-in, which
-- is the same mechanism invitation acceptance uses. Email ownership is proved
-- by the magic link before any claim happens, and the claim only ever matches
-- rows where auth_user_id is still null, so it cannot take over a membership
-- that already belongs to somebody.

do $$
declare
  v_org_id uuid;
  v_project_id uuid;
  v_site_id uuid;
  v_trailhead_site_id uuid;
begin
  select id into v_trailhead_site_id from trailhead_sites where subdomain = 'electricgrid';

  select id into v_org_id from organizations where name = 'AI Interest for Electric Grid';
  if v_org_id is null then
    insert into organizations (name, primary_contact_name, primary_contact_email)
    values ('AI Interest for Electric Grid', 'James Smith', 'smithjps06@gmail.com')
    returning id into v_org_id;
  end if;

  select id into v_project_id from projects where organization_id = v_org_id limit 1;
  if v_project_id is null then
    insert into projects (organization_id, status, start_date)
    values (v_org_id, 'new', current_date)
    returning id into v_project_id;
  end if;

  select id into v_site_id from sites where slug = 'electricgrid';
  if v_site_id is null then
    insert into sites (
      organization_id, project_id, slug, name, runtime, tier, status,
      footer_credit, source_trailhead_site_id
    )
    values (
      v_org_id, v_project_id, 'electricgrid', 'AI Interest for Electric Grid',
      'managed', 'custom', 'draft', false, v_trailhead_site_id
    )
    returning id into v_site_id;
  end if;

  insert into site_members (site_id, email, display_name, role, status, approved_at)
  values (v_site_id, 'smithjps06@gmail.com', 'James Smith', 'admin', 'active', now())
  on conflict (site_id, lower(email)) do update
    set role = 'admin', status = 'active';
end $$;

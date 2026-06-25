-- Activate the launched regions in the database.
--
-- Migration 0003 seeded the expansion regions as coming_soon using
-- ON CONFLICT (slug) DO NOTHING, so re-running it after the seed copy changed
-- never updated the existing rows. This migration explicitly flips every
-- launched region to active and ensures Greater Orlando exists. It does not
-- touch lead_user_id, so any lead assignments are preserved.

insert into regions (slug, name, status, intro_blurb, cities_served, active)
values
  (
    'greater-orlando',
    'Greater Orlando',
    'active',
    'Enterprise-grade technology, delivered across Greater Orlando by a local lead invested in the area''s businesses.',
    array['Orlando','Kissimmee','Sanford','Winter Park','Lake Mary','Apopka'],
    true
  )
on conflict (slug) do update
  set status = excluded.status,
      name = excluded.name,
      intro_blurb = excluded.intro_blurb,
      cities_served = excluded.cities_served,
      active = excluded.active;

update regions
set status = 'active', active = true
where slug in (
  'new-river-roanoke',
  'central-texas',
  'south-texas',
  'central-eastern-virginia',
  'greater-orlando'
);

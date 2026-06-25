# Multi-region support

Double Blaze is multi-region. Regions are data-driven: each region carries its
public copy, its assigned lead, and its readiness state. The public storefront
builds and renders with **zero secrets**, and all region data access is guarded.

## How it fits together

| Layer | File | Role |
|---|---|---|
| Static seed (zero secrets) | `src/lib/regions.ts` | Source of truth for public rendering. The selector, home band, and Header read from here so the site builds and renders with no Supabase project attached. |
| Database table | `supabase/migrations/0003_regions.sql` | `regions` table is the live source of truth once Supabase is configured. Carries `lead_user_id`, `status`, `active`, `cities_served`, etc. |
| Guarded DB access | `src/lib/regions-db.ts` | Server-only. Overlays the DB on the seed, resolves leads, records interest, scopes lead portals, and flips status. Degrades to the seed (or a no-op) when Supabase is absent. |

When Supabase is configured the DB **wins** for `status`, `active`, the lead
assignment, and `local_phone`, so the readiness toggle and lead assignment take
effect without a redeploy. When it is not, the static seed is used as-is.

### Visibility rules

- A region is shown publicly only when `active = true` (the master enable flag).
- Only `status = 'active'` regions are **indexable and linkable**: they appear in
  the sitemap and their page has no `noindex`.
- `status = 'coming_soon'` regions render a "join the list" interest capture and
  are `noindex`. They never appear in the sitemap.

## The four seeded regions

| Slug | Name | Seed status |
|---|---|---|
| `new-river-roanoke` | New River & Roanoke Valleys | **active** (home) |
| `central-texas` | Central Texas | coming_soon |
| `south-texas` | South Texas | coming_soon |
| `central-eastern-virginia` | Central and Eastern Virginia | coming_soon |

Only the home region starts active.

## Adding a region

A region has two homes; add it to both so it works with and without Supabase.

1. **Seed (`src/lib/regions.ts`)** — add an entry to `REGIONS`:

   ```ts
   {
     slug: "south-carolina-upstate",
     name: "Upstate South Carolina",
     status: "coming_soon",         // start coming_soon until a lead is onboarded
     enabled: true,
     introBlurb: "Double Blaze is expanding to the Upstate ...",
     citiesServed: ["Greenville", "Spartanburg", "Anderson"],
     // lead/localPhone/proof are added when the region goes live (see below)
   }
   ```

2. **Database (`supabase/migrations/0004_*.sql`)** — insert the matching row:

   ```sql
   insert into regions (slug, name, status, intro_blurb, cities_served, active)
   values (
     'south-carolina-upstate', 'Upstate South Carolina', 'coming_soon',
     'Double Blaze is expanding to the Upstate ...',
     array['Greenville','Spartanburg','Anderson'], true
   )
   on conflict (slug) do nothing;
   ```

The slug must match exactly in both places. Cities served drive the
`LocalBusiness` / `Service` schema (service-area framing only, never an address
or map pin).

## Assigning a lead (the 1099 agent)

The lead is a `project_lead` user. The region's `lead_user_id` is the
operational link used to assign projects and scope the lead's portal.

1. Onboard the agent as a Clerk user with role `project_lead`; they get mirrored
   into the `users` table.
2. Find their `users.id`, then assign it. Either:

   **Admin API (staff-only):**
   ```bash
   curl -X POST https://your-site/api/admin/regions \
     -H 'Content-Type: application/json' \
     --cookie '<staff session>' \
     -d '{"slug":"south-carolina-upstate","leadUserId":"<users.id>"}'
   ```

   **or SQL:**
   ```sql
   update regions set lead_user_id = '<users.id>'
   where slug = 'south-carolina-upstate';
   ```

3. Add the lead's display copy (name, photo, short bio) and `localPhone` to the
   seed entry so the active region page shows them. The bio/photo are marketing
   content kept in the seed; `lead_user_id` is the routing link in the DB.

### What the lead assignment does

- **Routing:** a start-a-project or checkout from the region tags the
  organization with the region slug and assigns the region's lead as the
  project's `project_lead`. (See `api/checkout`, `api/webhooks/stripe`,
  `api/start-a-project`.)
- **Portal scope:** the lead's execution portal is scoped to their region's
  clients and projects (`getLeadScope` in `regions-db.ts`).
- **Central inbox:** leads from `coming_soon` regions, or projects with no lead,
  land in the central inbox. Start-a-project and interest emails for those
  regions go to `LEADS_TO_EMAIL` (the central inbox) instead of a region lead.

## Readiness gate: flipping coming_soon → active

A region should be set **active only once its lead is onboarded and delivery is
confirmed.** Activating a region makes it publicly indexable, linkable, and
purchasable, and routes real client work to its lead. Do not activate a region
you cannot yet deliver in.

Flip it with the staff-only admin toggle:

```bash
curl -X POST https://your-site/api/admin/regions \
  -H 'Content-Type: application/json' \
  --cookie '<staff session>' \
  -d '{"slug":"south-carolina-upstate","status":"active"}'
```

or in SQL:

```sql
update regions set status = 'active' where slug = 'south-carolina-upstate';
```

The change is live immediately for the region page, the regions index, and the
sitemap. Update the seed `status` to `"active"` in the same release so the
Header selector and home band (which read the static seed for speed) also reflect
it. To pause a region entirely, set `active = false`.

## Checklist to launch a new region

1. Seed entry added (`regions.ts`) and DB row inserted (migration).
2. Lead onboarded as a `project_lead`; `lead_user_id` assigned.
3. Lead display copy + `localPhone` added to the seed entry.
4. Delivery confirmed in-region.
5. Flip `status` to `active` (admin toggle) **and** in the seed for the next deploy.

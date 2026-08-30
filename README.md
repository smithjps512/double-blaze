# Double Blaze Solutions Platform

The operating system of Double Blaze Solutions, a certified veteran-owned small
business: a marketing storefront, a client portal, and an execution portal in
one Next.js codebase. See [`DoubleBlaze_Platform_Build_Spec.md`](./DoubleBlaze_Platform_Build_Spec.md)
for the full spec and sprint plan.

## Stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**, deployed on **Vercel**
- **Clerk** auth, roles: `client`, `project_lead`, `admin`
- **Supabase** Postgres with row-level security
- **Stripe** (Sprint 2), **Resend** transactional email
- **Anthropic API** for the Spark intake agent (Sprint 3)

## Status

- **Sprint 0 (Foundation):** done. App scaffold, Tailwind brand tokens, Clerk
  wiring with three roles, Supabase schema (section 4) with RLS, deploy-ready.
- **Sprint 1 (Storefront):** done. Homepage (header, hero, proof bar,
  brand-idea band, four service cards, three solution cards, why-us band,
  closing CTA, footer with clean entity attribution), services, solutions,
  pricing (four plans + a-la-carte), about, and a start-a-project form that
  emails via Resend. Mobile-first, WCAG 2.2 AA focused, LocalBusiness JSON-LD.

- **Multi-region:** done. Data-driven regions (`/regions`, `/regions/[slug]`),
  a header/home region selector, region-scoped routing (org tag + lead
  assignment), a coming_soon waitlist capture, and a readiness gate. See
  [`docs/REGIONS.md`](./docs/REGIONS.md) for how to add a region and assign a
  lead.

> Note: the marketing storefront builds and runs with **no secrets set**. Auth,
> data, and email features (including region data) activate when their env vars
> are present; regions fall back to a static seed otherwise.

## Repository layout

An npm workspaces monorepo with two deployable apps and three shared packages.
See [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) for the Vercel setup.

```
apps/platform/          doubleblaze.solutions: storefront, portals, Trailhead,
                        Trail Crew, Stripe, Clerk, crons
apps/sites/             *.doubleblaze.solutions and client custom domains:
                        public serving of customer sites, nothing else
packages/site-schema/   content types, block schema, site addressing
packages/site-render/   content to standalone static HTML
packages/site-db/       read access for public serving
packages/prototype-forge/  student product plans and user stories to a
                        clickable prototype
supabase/migrations/    shared, applied once per database
```

The two apps read the same database. The split is at the request path, not at
the data, and exists so a customer site incident is not a Double Blaze
incident and customer traffic never shares an origin with staff auth.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in what you want to enable
npm run dev                  # platform,      http://localhost:3000
npm run dev:sites            # site runtime,  http://localhost:3001
```

`npm run build`, `npm run typecheck`, and `npm test` run across all workspaces
and pass with no env configured.

## Environment

See [`.env.example`](./.env.example). Nothing is required for the public site.
To enable features:

- **Clerk:** set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
  Assign each user a role via Clerk `publicMetadata.role` (`client`,
  `project_lead`, or `admin`). James is the initial `project_lead`.
- **Supabase:** create a project, run the migrations in `supabase/migrations/`
  in order (`0001` schema, `0002` commerce, `0003` regions), and set the three
  `*_SUPABASE_*` vars. Connect Clerk as a third-party auth provider so the RLS
  policies (which read the Clerk `sub` from the JWT) work.
- **Resend:** set `RESEND_API_KEY`. All email sends from and routes to
  `yourteam@doubleblaze.solutions` (with `+leads` and `+intake` subaddresses
  for filtering). Active regions route to their lead instead of the central
  inbox.

## Deploy (Vercel)

1. Import the repo into Vercel (framework auto-detected as Next.js).
2. Add the environment variables you want enabled (see above).
3. Deploy. Every push produces a preview deployment; production tracks the
   chosen branch.

## Project structure

```
src/
  app/                 routes (App Router)
    page.tsx           homepage
    services|solutions|pricing|about|start-a-project/
    regions/ regions/[slug]/   region index + data-driven region pages
    api/start-a-project/route.ts   Resend lead email (region-routed)
    api/region-interest/route.ts   coming_soon waitlist capture
    api/admin/regions/route.ts     staff readiness-gate toggle
    portal/ execution/ sign-in/ sign-up/   auth surfaces (stubs for now)
    sitemap.ts robots.ts
  components/          Header, Footer, PageHero, RegionSelector, ...
  lib/                 brand tokens, catalog, content, auth, supabase,
                       regions (static seed) + regions-db (guarded access)
supabase/migrations/   0001_init.sql, 0002_catalog_commerce.sql, 0003_regions.sql
```

## Content note

The homepage copy in this build is written to the brand from the spec. The
"approved copy deck" and "brand brief" referenced in the kickoff prompt were
not present in the repo; see `docs/CONTENT-NOTES.md`. Drop the final deck in and
the copy in `src/lib/content.ts` + page files is the swap-in point.

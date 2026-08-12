# Double Blaze: Custom Sites and Hosting Architecture

Decision document for the move from "Trailhead builds free brochure sites" to
"Double Blaze builds and hosts custom client sites." Written against the code as
it stands at the time of the first paid custom site: a member site for a
Trailhead customer upgrading to paid.

No em dashes anywhere in this document.

---

## 1. The decision, in one page

Build **one site platform with three runtimes**, not one custom site.

| Runtime | What it is | Who it serves | Serving |
|---|---|---|---|
| **Static** | Rendered HTML, no server behavior | Trailhead, brochure sites | Prerendered files on CDN |
| **Managed** | Same renderer plus opt-in capability modules (members, forms, events, payments) | Paid custom sites, including this member site | Site runtime app, tenant resolved by host |
| **Bespoke** | Its own repo and its own Vercel project | The rare client whose needs are genuinely an application | Separate deployment, same billing and support |

Every site, in every runtime, is one row in one `sites` table, owned by an
`organization`, delivered through a `project`. The runtime is a column, not a
different product.

Four calls that are cheap now and expensive later, in priority order:

1. **Split customer sites off the Double Blaze app into a second Vercel project.**
   Client sites currently run in the same deployment as the storefront, the
   Stripe webhook, the client portal, and the execution portal. Once clients pay
   for uptime, that shared blast radius is a liability, and it also removes the
   cookie and session ambiguity of hosting client member logins on subdomains of
   the same origin family as staff auth.
2. **Version site content and publish by pointer swap.** Today `built_content` is
   overwritten in place. A paying client needs draft, publish, and rollback.
3. **Stop storing model-authored raw HTML as the content of record.** Move to
   structured blocks that the renderer turns into HTML. This is what makes a site
   editable, themeable, and safe to change without a rebuild.
4. **Client-collected money goes through Stripe Connect, never through the Double
   Blaze account.** Decide this before the first member site takes a dollar of
   dues.

---

## 2. What exists today

Facts from the code, not from the briefs.

**Serving.** `src/middleware.ts` matches any `*.doubleblaze.solutions` host that
is not `www` or multi-level, and rewrites to
`/trailhead-site/[subdomain]/[[...path]]`. That route
(`src/app/trailhead-site/[subdomain]/[[...path]]/route.ts`) loads the site row,
requires `status === "published"`, and calls `renderPage`. Response is
`s-maxage=60, stale-while-revalidate=300`.

**Content.** `spark-trailhead.ts` builds one page at a time as an HTML body
fragment. `BuiltSite` is `{ pages: [{slug, title, html}], config: {siteName,
navigation, footerCredit} }`, stored as JSONB in `trailhead_sites.built_content`.
`trailhead-render.ts` wraps each fragment in a complete standalone document with
inlined CSS, adds the nav and footer, and rewrites internal links for one of
three link styles (`export`, `live`, `preview`). That renderer is genuinely good
work and it is the reusable core of everything below.

**Export.** `/api/trailhead/export` zips the rendered pages with a hand-rolled
STORE-method zip. Free, never gated. This promise should carry to paid tiers
unchanged.

**Lifecycle.** `trailhead_site_status` enum, a content approval gate before any
build, a staff review gate before the customer sees anything, and a cron sweep
every five minutes (`runStuckBuildSweep`) that heals stalled builds with grace
windows and a three-failure cap. The lifecycle discipline here is better than
most agencies have. Keep it.

**Business plane.** Migration 0001 already has `organizations`, `users`,
`subscriptions`, `orders`, `projects`, `intake_sessions`, `project_briefs`,
`deliverables`, `approvals`, `messages`, `events`, `meetings`, `notifications`.
Trail Run adds engagements, build tasks, lifecycle events, check-ins.

**The gap that matters.** `trailhead_sites` is keyed to `trailhead_intakes` and
is connected to none of that. It has no `organization_id` and no `project_id`.
`/api/trailhead/upgrade` sets status to `upgraded`, clears `footer_credit`, and
returns a checkout URL. The content does not move anywhere, because there is
nowhere for it to move to. There is no paid site model. That is the thing to
build, and this client is the reason to build it now.

---

## 3. Where today's design stops working

Seven concrete gaps between what exists and what a paid custom member site needs.

1. **No assets.** There is no upload path, no storage bucket, no image handling
   anywhere in the codebase. The intake asks whether the customer has a logo and
   photos, and records the answer as a string. Any custom site needs real file
   handling on day one.
2. **No versioning or rollback.** `storeBuiltContent` overwrites. A client who
   asks for a change and hates it has no way back.
3. **No identity for the client's own members.** This is the defining requirement
   of a member site and Trailhead explicitly excludes it.
4. **No custom domain.** Also explicitly excluded, and it is the single most
   common first ask of a paying client.
5. **Content is model-authored raw HTML.** Fine for a free five-page brochure
   that is rebuilt if it is wrong. Not fine as the system of record for a site a
   client pays for and expects to change. It cannot be safely edited, cannot be
   restyled without a rebuild, and puts unsanitized generated markup into the
   response.
6. **Serving reads Postgres.** With a sixty second cache and ten sites that is
   fine. As a hosting business it means client uptime depends on the same
   database that runs billing.
7. **Shared blast radius.** One Vercel project serves the storefront, the Stripe
   webhook, both portals, the crons, and every client site.

Related, smaller, worth fixing regardless: the middleware wildcard swallows
reserved names. `RESERVED_SUBDOMAINS` in `trailhead.ts` is enforced at intake
validation only, so `app.doubleblaze.solutions` would rewrite to
`/trailhead-site/app` and return 404 rather than reaching anything real. Once
customer sites move to their own project this resolves itself, but until then the
middleware should exempt the reserved list.

---

## 4. Recommended architecture

### 4.1 One monorepo, two Vercel projects

Keep a single repository. Split the deployment.

```
apps/
  platform/    doubleblaze.solutions and www
               storefront, client portal, execution portal,
               Stripe checkout and webhooks, crons, Spark, site builder UI
  sites/       *.doubleblaze.solutions and every client custom domain
               tenant resolution, page serving, capability modules,
               member auth, site forms
packages/
  site-render/     the renderer, promoted out of src/lib/trailhead-render.ts
  site-schema/     block types, site config, zod validators, shared types
  site-db/         typed data access for sites, versions, domains, members
```

Why split rather than keep one app:

- **Failure isolation.** A client site incident stops being a Double Blaze
  revenue incident.
- **Security boundary.** Staff and client-portal auth lives on one origin, client
  end-user auth on another. Worth verifying the current Clerk cookie domain scope
  in production before any client member login ships on a `doubleblaze.solutions`
  subdomain; if session cookies are set on the parent domain they would be sent
  to every customer site.
- **Independent deploys.** Shipping a pricing page change should not redeploy
  every client site, and vice versa.
- **Honest scaling.** Hosting revenue and hosting cost land on the same project.

Vercel domain assignment is per project, and the more specific assignment wins,
so `doubleblaze.solutions` plus `www` on `platform` and
`*.doubleblaze.solutions` on `sites` is the intended configuration. Verify it
with a throwaway subdomain before the cutover described in `docs/TRAILHEAD-DNS.md`,
because that nameserver migration is the prerequisite for all of it and it is the
one step in this plan that can take down company email if it is done in the wrong
order.

### 4.2 Serving: publish to storage, do not read the database

At publish time, render every page and write the artifacts to object storage
(Supabase Storage or Vercel Blob) under an immutable version prefix:

```
sites/{site_id}/{version_id}/index.html
sites/{site_id}/{version_id}/about.html
sites/{site_id}/{version_id}/assets/...
```

`sites.live_version_id` is the pointer. Publishing is a pointer update. Rollback
is a pointer update. The export zip becomes a copy of an artifact that already
exists rather than a re-render, so what the client downloads is byte-identical to
what the world sees.

The `sites` app resolves host to site (cached, no database call on the hot path),
then serves the artifact. Static-runtime sites never touch Postgres to serve a
page. Managed-runtime sites serve the same artifacts and hit the database only
for the dynamic parts: a member session, a form post, an events list.

This also makes the hosting product honest. "We host it" currently means "it is a
row in our billing database." After this it means "it is a versioned artifact on a
CDN with a rollback button."

### 4.3 Data model

New tables, all org-scoped, all with RLS following the existing `is_staff()`
pattern:

```sql
sites
  id, organization_id, project_id
  slug                      -- the doubleblaze.solutions subdomain, always kept
  name
  runtime                   -- 'static' | 'managed' | 'bespoke'
  tier                      -- trailhead | green | blue | black | double_black | custom
  status                    -- reuse the lifecycle enum, generalized
  theme                     -- tokens: colors, type, spacing
  capabilities jsonb        -- enabled modules and their config
  live_version_id
  footer_credit boolean
  source_trailhead_site_id  -- attribution, nullable
  created_at, updated_at

site_versions
  id, site_id, version_number
  content jsonb             -- structured blocks, the system of record
  built_manifest jsonb      -- rendered artifact paths and hashes
  status                    -- draft | building | preview | published | archived
  created_by, published_at, notes

site_domains
  id, site_id, hostname, is_primary
  verification_status, verification_records jsonb
  ssl_status, verified_at

site_assets
  id, site_id, storage_path, kind, alt_text
  width, height, byte_size, checksum

site_members              -- end users of the CLIENT, not of Double Blaze
  id, site_id, email, display_name
  status                  -- invited | active | suspended
  role                    -- member | officer | admin, per-site meaning
  joined_at, metadata jsonb

site_form_submissions
  id, site_id, form_key, payload jsonb, submitted_at, ip_hash
```

`trailhead_sites` stays exactly as it is. Do not migrate the free tier in a big
bang. Trailhead writes a `sites` row on upgrade, and new Trailhead builds start
writing `sites` rows directly once the static runtime is live. Two paths converge
rather than one rewrite that risks a working program.

RLS: staff full access, client read scoped to their organization, `site_members`
readable only through the site runtime's service path. Members never get direct
Postgres access.

### 4.4 Content: blocks, not HTML blobs

Replace `pages[].html` with a typed block list:

```ts
type Block =
  | { type: "hero"; heading: string; sub?: string; media?: AssetRef; cta?: Cta }
  | { type: "prose"; markdown: string }
  | { type: "cards"; items: Card[] }
  | { type: "gallery"; assets: AssetRef[] }
  | { type: "roster"; source: "manual" | "members"; fields: string[] }
  | { type: "events"; source: "manual" | "calendar"; limit: number }
  | { type: "form"; formKey: string; fields: Field[]; deliverTo: string }
  | { type: "members_only"; blocks: Block[] }
  | { type: "html"; html: string };   // escape hatch, staff-authored only
```

Spark's job changes from "write HTML" to "fill in blocks." That is a strictly
easier generation task with a validatable output, and the current per-page
build loop, the boundary checker in `trailhead-boundary.ts`, and the retry logic
all carry over.

What this buys:

- A real editor becomes possible, which is what "site builder" has to mean if
  clients are going to touch their own content.
- Theming applies across every site. Change a token, every site restyles.
- The renderer owns all markup, so output is consistent, accessible, and safe.
- Export still produces plain static HTML with no dependencies, so the promise in
  the Trailhead brief survives intact.

The `html` block is the pressure valve for the one-off thing a client needs that
the block set does not cover. Staff-authored only, never model-authored, never
client-authored.

### 4.5 Member sites: capability modules

The member site is the first managed-runtime site. Build it as four modules that
the next client can also switch on, and resist building a fifth speculatively.

- **members**: invite, accept, sign in, profile, directory, member-only pages.
- **forms**: contact and join forms, submissions stored and emailed via Resend.
- **events**: a schedule with a list and a detail page.
- **payments**: dues and donations, via Connect. See 4.7.

Each module is a row in `capabilities`, a set of blocks it contributes, and a set
of routes the `sites` app mounts when it is enabled. A site with no modules
enabled is byte-identical to a static site, which is what keeps Trailhead cheap.

### 4.6 Member auth: separate from Clerk

Use **Supabase Auth for site members** and keep Clerk for the Double Blaze plane.

Two populations that must never mix:

- Clerk: Double Blaze staff and the client's own account holders, roles `client`,
  `project_lead`, `admin`. Small, known, high privilege.
- Site members: the club's members, the association's directory. Potentially
  thousands, unknown, and belonging to the client rather than to Double Blaze.

Putting a client's members into the Double Blaze Clerk instance would put them in
the same role namespace and the same RLS predicates as staff. That is the wrong
default at one site and unmanageable at twenty. Supabase Auth with a `site_id`
column and RLS keyed on it is the shape that scales, and Postgres RLS is already
the pattern in this codebase.

The cost is two auth systems to reason about. That is the correct trade for a
hard boundary between the people who can see the execution portal and the people
who can see a club roster.

### 4.7 Money: Connect for anything the client collects

Double Blaze's own Stripe account handles what Double Blaze sells: packages,
a-la-carte builds, maintenance, hosting, tips. That is what exists today and it
stays.

Anything a client collects from their own members or customers, dues included,
goes through **Stripe Connect with standard accounts**. The client onboards their
own account, money lands with them, and Double Blaze optionally takes an
application fee.

Routing client dues through the Double Blaze account would make Double Blaze the
merchant of record for someone else's revenue, with the tax reporting, chargeback
liability, and refund exposure that carries. Spec section 9 already establishes
that entity cleanliness matters to this business for certification reasons. The
same instinct applies here.

Note the Trailhead brief bars dues at the free tier. That stays true. Connect is
what makes it a real upgrade rather than a policy line.

### 4.8 Custom domains

`site_domains` plus the Vercel Domains API on the `sites` project. Add domain,
store the verification records, show the client exactly which DNS records to
create, poll until verified, then let them mark it primary. Serve the
`doubleblaze.solutions` subdomain permanently as a 308 to the primary hostname so
links never rot and the slug stays a stable internal handle.

Custom domain remains the headline paid upgrade, which is what the Trailhead
brief already counts on.

---

## 5. Trailhead to paid, made real

This client is the proof case, so build the conversion properly rather than as a
status change.

**Migration on upgrade.** Create the `organization` if it does not exist, create
the `project`, create the `sites` row with `runtime = 'managed'`, and translate
the existing `built_content` into a first `site_versions` row. The blocks
translation is mechanical for anything Spark generated: nav becomes site config,
each page fragment becomes an `html` block that a human then breaks into real
blocks during the custom build. The client's site is live and unchanged
throughout. Nothing goes dark during an upgrade.

**Attribution.** `sites.source_trailhead_site_id` plus a `lifecycle_events` row
on conversion. Then "does Trailhead lead to paid engagements" is a query:
conversion rate, days from publish to upgrade, revenue per Trailhead build
against the ten-per-month capacity. That number decides whether the program grows
or gets capped, which is exactly the decision rule the brief already sets out.

**Delivery.** A custom site is a `project` with `deliverables`, run through the
execution portal that already exists in the spec. Reuse the content approval gate
from Trailhead as the deliverable approval gate. Do not invent a second workflow.

---

## 6. What not to build

- A general purpose page builder with drag and drop. Blocks plus a form editor
  covers what clients actually ask for at this size.
- A theme marketplace, plugins, or anything multi-vendor.
- Per-client Vercel projects as the default. That is the bespoke runtime, and it
  should stay rare enough to be a deliberate exception.
- A rewrite of Trailhead. It works, it is the top of the funnel, and it should
  absorb the new platform gradually.
- Speculative capability modules. Build the four this client needs. The fifth
  gets built when a second client pays for it.

---

## 7. Sequencing

Ordered so the client's site can ship without waiting for the whole platform.

**Phase 0, prerequisite.** Complete the nameserver migration in
`docs/TRAILHEAD-DNS.md`, records recreated first, email verified against the
baseline. Everything else is blocked on this.

**Phase 1, foundations.** `sites`, `site_versions`, `site_domains`, `site_assets`
with RLS. Promote the renderer into `packages/site-render`. Introduce the block
schema with an `html` block so existing Trailhead content round-trips unchanged.

**Phase 2, the split.** Stand up the `sites` app. Move wildcard serving to it.
Publish-to-storage and pointer-swap publishing, with rollback. Trailhead keeps
working throughout, serving the same content from the new path.

**Phase 3, this client.** Custom domain flow. Asset upload. The `members`,
`forms`, and `events` modules. Payments only if they are collecting dues at
launch. Ship the member site.

**Phase 4, close the loop.** The Trailhead upgrade migration and attribution.
Hosting as a billed line item. Client-facing editing for the blocks they should
own.

Phases 1 and 2 are the ones that pay off across every future client. Phase 3 is
the only part that is specific to this one, which is the test of whether the
architecture is right.

---

## 8. Open decisions

Answers change the shape of Phase 3, not the shape of the platform.

1. **Do their members pay dues at launch?** If yes, Connect onboarding is on the
   critical path and the client needs their own Stripe account before build.
2. **Do they edit their own content, or do we?** If we do, Phase 4's editor can
   wait and the block schema is internal only. If they do, the editor is part of
   the deliverable and blocks need friendly labels and validation from the start.
3. **Custom domain at launch or later?** Later means Phase 3 ships faster and the
   domain becomes a visible second win.
4. **Is the member directory public, private, or both?** Public is a block.
   Private means the `members_only` block and member auth are both on the
   critical path.
5. **What is the recurring hosting price?** The a-la-carte maintenance line is
   $29/mo today. A managed site with member auth and payments is a different cost
   base and should carry a different number.

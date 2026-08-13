# Deployment: two apps, one repo

The repo is an npm workspaces monorepo with two deployable apps and three
shared packages.

```
apps/platform/     doubleblaze.solutions and www
                   storefront, portals, Stripe, Clerk, crons, Spark, Trailhead
apps/sites/        *.doubleblaze.solutions and client custom domains
                   public serving of customer sites, nothing else
packages/site-schema/   content types, block schema, site addressing
packages/site-render/   content to standalone static HTML
packages/site-db/       read access for public serving
supabase/migrations/    shared, applied once per database
```

No em dashes anywhere in this document.

---

## Why two deployments

The platform runs Double Blaze's revenue surfaces: the storefront, both
portals, the Stripe webhook, the crons. Customer sites used to be served from
the same deployment, which meant a customer site incident was a Double Blaze
incident, and customer traffic shared an origin with staff authentication.

Splitting them gives failure isolation, a real security boundary before member
authentication ships, and independent deploys: a pricing page change no longer
redeploys every customer site.

Both apps read the same Supabase database. The split is at the request path,
not at the data.

---

## Local development

```bash
npm install            # installs all workspaces, links the packages
npm run dev            # platform on :3000
npm run dev:sites      # site runtime on :3001
npm run build          # builds both apps
npm run typecheck      # all workspaces
npm test               # all workspaces
```

Workspace packages ship TypeScript source rather than a build artifact, and
both apps list them in `transpilePackages`. Editing a package is picked up
without a build step in between.

One resolution detail worth knowing before it bites: imports **inside** the
packages must be extensionless (`./addressing`, not `./addressing.js`).
Webpack will not resolve a `.js` specifier onto a `.ts` file, so a `.js`
specifier passes `tsc` and `node --test` and then fails only at `next build`.
Test files may keep the `.js` form because they run under tsx, which does map
it.

---

## Vercel setup

Two projects from the same repository, distinguished by root directory.

### Project 1: the existing `double-blaze` project

Settings → General → **Root Directory: `apps/platform`**

Everything else stays as it is: the same environment variables, the same
domains, the same cron entries (which live in `apps/platform/vercel.json`).

### Project 2: a new project, suggested name `double-blaze-sites`

- Same Git repository
- Settings → General → **Root Directory: `apps/sites`**
- Environment variables (only these three are needed, because this app does
  not touch Stripe, Clerk, Resend, or Anthropic):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_PRIMARY_DOMAIN` = `doubleblaze.solutions`

That short env list is a feature, not an oversight. The site runtime holds no
payment, auth, or mail credentials, so a compromise of a customer-facing
deployment reaches none of them.

### Domains

| Hostname | Project |
|---|---|
| `doubleblaze.solutions` | platform |
| `www.doubleblaze.solutions` | platform |
| `*.doubleblaze.solutions` | sites |
| any reserved name actually used later (`app.`, `status.`) | platform |
| client custom domains | sites |

Vercel resolves the more specific assignment before the wildcard, so attaching
`app.doubleblaze.solutions` to the platform project overrides the wildcard for
that one name. This is why the reserved subdomain list no longer needs to be
enforced in code at request time: it is enforced by domain assignment. The list
still governs what a customer may claim at intake, which is what it was for
originally.

---

## Cutover order

Changing the root directory affects the **next** deployment, not the one
currently serving. Vercel keeps serving the last successful production build
until a new one succeeds, so a mismatch fails the build rather than taking the
site down.

The safe order:

1. Merge this branch to `main`. The platform build fails on Vercel, because the
   project's root directory is still the repo root and there is no longer a
   Next app there. **Production keeps serving the previous deployment.**
2. Set the platform project's root directory to `apps/platform`.
3. Redeploy the platform project. It should build and go live.
4. Create the sites project with root directory `apps/sites` and its three
   environment variables.
5. Move `*.doubleblaze.solutions` from the platform project to the sites
   project.
6. Verify.

Steps 1 and 2 can be done in either order. Doing 2 first means a redeploy
triggered before the merge would fail, which is equally harmless. What must not
happen is finishing at step 3 without doing 5, because the wildcard would then
point at an app that no longer serves customer sites.

**There is no live customer site to break during this cutover.** Every
`trailhead_sites` row is currently `submitted` or `preview`, and none has a
`live_url`. Nothing is published, which is why this is the cheapest moment this
change will ever be available.

---

## Verifying the cutover

```bash
# Platform still serves its own hostnames
curl -sSI https://doubleblaze.solutions/ | head -1

# The wildcard reaches the sites app and 404s for an unknown subdomain,
# which is the correct answer, not a failure
curl -sSI https://nothing-here-9184.doubleblaze.solutions/ | head -1

# Wildcard TLS actually issued (this is the one that has never been proven)
curl -sSI https://anything.doubleblaze.solutions/ 2>&1 | head -3
```

A certificate error on the third command means the wildcard certificate has not
issued. That is a DNS-level problem rather than a deployment one; see
[`TRAILHEAD-DNS.md`](./TRAILHEAD-DNS.md).

Publishing a Trailhead site is the real end-to-end test, and until the wildcard
certificate is confirmed, publishing one would serve a browser security
warning. Confirm the certificate first, then publish.

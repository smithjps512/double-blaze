# Members app: hostnames, Supabase Auth, and Vercel setup

Setup runbook for `apps/members`, the multi-tenant member application. Written
before the Vercel project exists, so the decisions are settled once rather than
discovered halfway through.

No em dashes anywhere in this document.

---

## 1. The hostname problem

A visitor experiences one site. The public page and the member area share a
brand, a domain, and a "Request to join" button that leads from one to the
other. But they are two deployments with different jobs:

- `apps/sites` serves pre-rendered artifacts from storage. Static, cacheable,
  indexable, no session.
- `apps/members` serves a session-bearing application. Never cached, never
  indexed, every query under row level security.

Both want `electricgrid.doubleblaze.solutions`, and a hostname belongs to
exactly one Vercel project.

### What was considered

**Merge them into one app.** One hostname, no routing problem. Rejected: it
throws away artifact serving, puts marketing traffic through the application,
and gives the public page a session-aware runtime it has no use for. The split
exists for good reasons and this undoes them.

**Path-based routing on one hostname.** `/` to the sites project and
`/members/*` to the members project, via Vercel rewrites or Microfrontends.
This is the best production answer and is worth revisiting at session 10, since
it keeps one hostname, one cookie scope, and no subdomain for a member to
mistype. It is more moving parts than the build phase needs today.

**A second-level subdomain**, `members.electricgrid.doubleblaze.solutions`.
Rejected on TLS: a wildcard certificate covers exactly one label, so
`*.doubleblaze.solutions` does not cover `a.b.doubleblaze.solutions`. It would
need its own certificate and would not benefit from the wildcard already in
place.

### What was chosen

A **single-label sibling hostname** for the build phase:

| Hostname | Project | Serves |
|---|---|---|
| `electricgrid.doubleblaze.solutions` | `double-blaze-sites` | the public page |
| `electricgrid-members.doubleblaze.solutions` | `double-blaze-members` | the member area |

One label, so the existing wildcard certificate covers it with nothing new to
issue.

The part worth noticing: **this needs no special case in code.** The members
app already resolves a tenant by looking up the request hostname in
`site_domains` before falling back to the subdomain convention. Registering
`electricgrid-members.doubleblaze.solutions` as a verified, non-primary domain
for the Electric Grid site makes it resolve through the ordinary custom-domain
path.

That has a second benefit: the build phase exercises the same code path
production will use, rather than a temporary shortcut that gets replaced by
untested code at launch.

It must be **non-primary**. The sites app redirects to a site's primary
hostname when reached at any other name, so marking this one primary would send
member traffic to the public page.

### At session 10

When the club's own domain lands, decide between:

- `members.aigrid.org` beside `aigrid.org`. Their domain, so a second-level
  name gets its own certificate without difficulty. Simple, and the member area
  is visibly a distinct place.
- One hostname with path routing, `aigrid.org/members`. One cookie scope,
  nothing to mistype, and it reads as one site. Vercel Microfrontends is built
  for exactly this and is available on the current plan.

Either works. The second is nicer for members and more setup for us. Nothing
before session 10 depends on the answer.

---

## 2. Supabase Auth

The members app generates sign-in links with the admin API and delivers them
through Resend, so **Supabase's built-in mailer is not used and SMTP does not
need configuring**. What Supabase still owns is the identity, the token, and
the redirect allow-list.

### Steps

1. **Authentication → Providers → Email:** enable it. Leave every other
   provider off; Google arrives once the club has a domain.

2. **Leave "Confirm email" enabled.** Our flow verifies the address by
   delivering the link to it, so this stays consistent with what actually
   happens and keeps unverified addresses out of the identity table.

3. **Authentication → URL Configuration → Site URL:**
   `https://electricgrid-members.doubleblaze.solutions`

4. **Redirect URLs**, add both:
   ```
   https://electricgrid-members.doubleblaze.solutions/**
   https://*.doubleblaze.solutions/**
   ```

   The wildcard entry is the multi-tenant one and matters more than it looks.
   Site URL and the allow-list are **per Supabase project, not per tenant**, so
   every club's hostname has to be permitted here. Without the wildcard, adding
   the second association means remembering to edit an auth setting, which is
   exactly the kind of step that gets forgotten.

5. **Authentication → Rate limits:** the defaults assume Supabase is sending
   the mail. We are not, so the limit that applies is on token generation
   rather than delivery. Worth a look once real sign-ins are flowing; not worth
   pre-tuning.

### What is deliberately not configured

**SMTP.** Configuring it would give Supabase a second, unbranded path to send
mail that bypasses the bounce webhook. Better that there is only one way mail
leaves this platform.

---

## 3. Vercel project

### Create

- **Add New → Project**, same Git repository
- **Project Name:** `double-blaze-members`
- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** `apps/members`
- Leave **"Include files outside the root directory"** enabled. The workspace
  packages live outside `apps/members` and the build fails without it.

### Environment variables

Five, for Production and Preview:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_PRIMARY_DOMAIN   = doubleblaze.solutions
RESEND_API_KEY
EMAIL_FROM                   = support@doubleblaze.solutions
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is new here. The sites project does not need it
because it never runs a query as a signed-in person; this app does, and that
key is what carries a member's own session so row level security applies to
them. The service role key is present too, for the few operations that cannot
run as the member, and the code is explicit about which client each query uses.

`EMAIL_REPLY_TO` is optional and defaults to `LEAD_TO_EMAIL` on the platform.
Add it here only if member replies should go somewhere different.

### Domain

Add `electricgrid-members.doubleblaze.solutions` to this project. It is covered
by the existing wildcard certificate, so nothing new needs issuing.

---

## 4. Order of operations

1. Merge the branch.
2. Create `double-blaze-members` with the root directory and env vars above.
3. Add the hostname to the project.
4. Register the hostname in `site_domains` as verified and **non-primary**
   (a single insert; see the migration).
5. Configure Supabase Auth per section 2.
6. Verify.

Step 4 is the one with no visible symptom if skipped. The app builds, the
hostname resolves, and every request returns "unknown site" because tenant
resolution finds nothing. If the member area 404s after deploying, check that
row first.

---

## 5. Verifying

```bash
# The member area answers and redirects an anonymous visitor to sign in
curl -sSI https://electricgrid-members.doubleblaze.solutions/ | head -3

# The sign-in page renders
curl -sS https://electricgrid-members.doubleblaze.solutions/sign-in | grep -o "<h1>[^<]*</h1>"

# The public page is unaffected and still served by the sites project
curl -sSI https://electricgrid.doubleblaze.solutions/ | head -1
```

Expect a redirect to `/sign-in` from the first, a heading naming the club from
the second, and the third unchanged from whatever it was before.

The real test is a sign-in end to end: request a link, receive it from the
club's domain rather than a supabase.co address, click it once, land signed in,
and find the same link no longer works on a second click.

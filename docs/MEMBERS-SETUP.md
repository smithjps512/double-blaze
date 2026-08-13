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

### The join flow

Nothing below can be checked from a terminal, because every step needs a real
inbox and a browser holding a session. This is the script for the session 3
gate.

Use an address that has never signed in, and one that is not James's, since his
membership is already seeded and he will be sent straight past the questions.

1. From the landing page, click **Request to join**. It should leave the public
   hostname and arrive at the members app's sign-in page.
2. Enter the address, receive the link, click it. Expect the questionnaire, not
   the member area: a signed-in visitor with no membership row is an applicant
   who has not applied yet.
3. Submit with a field empty. Expect the specific field flagged and nothing
   sent.
4. Choose **Neither, or both** for the industry question. The free-text question
   should become required. Choose either of the other two and it should go back
   to optional.
5. Submit a complete answer. Expect the pending notice, with the answers read
   back under "What you told us".
6. Reload, and sign out and back in. Expect the pending notice again rather than
   the questionnaire, which is the check that the row was really written.
7. In the Supabase table editor, confirm one `site_members` row for that address
   with `status = 'pending'`, `role = 'member'`, and the answers in
   `join_answers`.

The thing to watch for at step 7 is `role`. A pending applicant must never
arrive as anything but `member`, and the database refuses anything else, so an
admin row here would be a serious finding rather than a cosmetic one.

### The approval queue

Continue from step 7 above, signed in as James in a second browser or a private
window, so both sides of the decision are in front of you at once.

1. Check the inbox James's membership uses. A "has asked to join" email should
   have arrived when the application was submitted, carrying the answers and a
   link to the queue. If it did not, the application still went in; look for
   `[members]` lines in the Vercel logs for the members project.
2. Open `/admin`. The request should be listed with the same answers.
3. Click **Decline**, then **Cancel**. Nothing should change. Declining asks
   twice on purpose, because it sends an email that cannot be unsent.
4. Click **Approve**. The request should leave the queue and the applicant
   should appear under Members.
5. Check the applicant's inbox for the approval email, and follow its link. They
   should land in the member area rather than on the pending notice.
6. Back in `/admin`, change the applicant's role to **Administrator**.
7. Now change James's own role to Member. The browser asks first. Confirm it.
8. Sign in as James again and open `/admin`. He should be redirected to the
   front door, because he is no longer an administrator. That is the handover
   working.

To check the guard rather than the handover, do step 7 **before** step 6. The
console warns that there is only one administrator, and if you try it anyway the
database refuses with "This is the last administrator." That refusal is the
thing standing between the club and an account nobody can administer, so it is
worth seeing once.

Undoing any of this is a `role` or `status` edit in the Supabase table editor,
which runs as the service role and is not subject to the guard.

### If something behaves unexpectedly

Two suites prove the database rules without needing a browser, and running the
relevant one separates "the interface is wrong" from "the policy is wrong" in a
single step:

- [`../supabase/tests/join_policy.sql`](../supabase/tests/join_policy.sql), what
  an application may and may not claim.
- [`../supabase/tests/admin_queue.sql`](../supabase/tests/admin_queue.sql),
  approval, the last-administrator guard, and the boundary between two clubs.

Both end in a deliberate error carrying their results and roll themselves back,
so they are safe to run against the live project and leave nothing behind.

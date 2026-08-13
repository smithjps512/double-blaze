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
Add it here only if member replies should go somewhere different. With neither
set, a member replying to a club email reaches whatever `EMAIL_FROM` is, which
is Double Blaze rather than the club. Fine during a user test, worth revisiting
before launch.

**Check the spelling of `NEXT_PUBLIC_PRIMARY_DOMAIN` if you ever touch it.** It
was once entered as `EXT_PUBLIC_PRIMARY_DOMAIN`, which Vercel accepts happily
and the application never reads, so it falls through to the default in
`tenant.ts`. The default is the correct value, so nothing broke and nothing
warned. A misnamed variable that looks configured is worse than a missing one.

Two things about it worth knowing together:

- `NEXT_PUBLIC_` variables are inlined at build time, so renaming one does
  nothing until the project is redeployed.
- The value is a bare apex domain: `doubleblaze.solutions`. No scheme, no
  `www`, no trailing slash, and not the members hostname.
  `resolveSiteSubdomain` does `hostname.endsWith("." + primaryDomain)` and
  slices, so anything else silently resolves no tenant and every page 404s.

### One more, so preview deployments can be reviewed

```
PREVIEW_SITE_SLUG = electricgrid     # Preview environment ONLY
```

**Set this on Preview, and nowhere else.** In Vercel that means ticking Preview
and leaving Production unticked.

Without it, the preview build attached to a pull request returns 404 on every
page, because a `something.vercel.app` hostname is neither a verified
`site_domains` row nor a subdomain of the platform domain, so the tenant
resolves to nothing. The practical effect was that a change to the member area
could only be looked at after it had been merged, which is the wrong order and
is how a design pass reached production without anybody having seen it running.

It is fenced three ways, in `apps/members/src/lib/preview.ts`:

- It applies only when the hostname resolved to nothing, so a real club's
  hostname never reaches it.
- It requires this variable, which Production does not have.
- It refuses to work when `VERCEL_ENV` is `production` even if somebody sets it
  there anyway, because the failure mode of a variable ticked into the wrong
  environment is that any hostname pointed at the deployment starts serving a
  real club.

It is not an authentication bypass. A preview deployment still needs a real
session and every query still runs under that member's own row level security.
This decides which club's front door is being shown, not who may open it.

### The member area depends on one `site_domains` row

Worth knowing before somebody tidies the table.

`resolveTenant` looks for a **verified** `site_domains` row matching the
hostname first, and only falls back to parsing a subdomain if there is none.
Electric Grid has such a row for `electricgrid-members.doubleblaze.solutions`,
so that is the path every request takes today.

The fallback would not save it. That hostname's subdomain is
`electricgrid-members`, and the site's slug is `electricgrid`, so a subdomain
lookup finds nothing. Delete or unverify that row and the whole member area
returns 404 with no other symptom.

Session 10 replaces this when the club gets its own domain. Until then, it is a
single row holding the member area up.

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

### Invitations

The other join path, and the one your user testers will actually arrive
through. Use a third address, different again from James's and the applicant's.

1. In `/admin`, under **Invite someone**, enter the address and leave the role
   as Member. Send it.
2. The invitation should appear under "Invitations waiting to be accepted",
   showing when it expires.
3. Check that inbox. The email should say what the club is, who invited them,
   and that there is no approval to wait for.
4. Click the link. It should land straight in the member area, signed in and
   active, with no questionnaire and no pending notice. That is the brief's
   "if invited, the member can join without any further approval".
5. Go back to `/admin`. The invitation should be gone from the waiting list and
   the person should be under Members.
6. Click the same link again. It should refuse with "that invitation has already
   been used", because a link works exactly once.

Then the guest path, with a fourth address:

7. Invite as **Guest**. An access window appears, defaulting to 90 days. Send
   it, accept it, and confirm in the Supabase table editor that the new
   `site_members` row has `role = 'guest'` and an `access_expires_at` about 90
   days out.
8. To see expiry work, set that row's `access_expires_at` to a past timestamp in
   the table editor and reload the member area as that guest. They should lose
   access immediately, because `app.is_active_site_member` treats a lapsed
   window as not being a member.

And revocation:

9. Invite a fifth address, then **Withdraw** the invitation before opening it.
   The link should refuse with "that invitation was withdrawn".

### The library, and the session 5 gate

Two of the three media kinds cannot be verified by any test in this repository,
because both need a real artifact. That is the whole of the session 5 gate, and
the demo seed has left a draft waiting for each one.

The seeded club already holds six members, four published written pieces, and a
three part series, so there is something to look at before any of this.

**The audio.** This is the first real audio upload end to end, the same shape of
gate that session 4 owes for a photo.

1. Sign in as James and open `/library`. The library should list four published
   pieces, newest first, with the series shown as a shelf above them.
2. Go to `/write` and start something new. Choose **Audio**, give it a title, and
   pick a recording. Anything up to 50MB in MP3, M4A, AAC, OGG, or WAV.
3. The player should appear in the form once the upload finishes. Publish it.
4. Open it from the library. The player should play, and the address bar should
   show `/library/<slug>` rather than a storage URL. The bytes come through
   `/api/media` under your own session.
5. Sign out and open the same URL. It should send you to sign in, and the media
   URL on its own should refuse. That is what "gated" has to mean here.
6. Leave your piece published. A real audio article by a real member is better
   demonstration content than a seeded one, and the user test needs at least one
   of each kind.

**The video.** The first real embed.

7. Start something new, choose **Video**, and paste a YouTube or Vimeo address
   from the browser bar. Publish it and check the video plays inside the
   article.
8. Paste something that is not a video link. It should say so rather than
   accepting it, because the id is what gets built into the player and nothing
   an author typed reaches it directly.

Steps 2 to 8 are the gate. The seed also left two drafts, *A conversation about
forecasting horizons* and *A walkthrough of an interconnection queue*, waiting
for the same two artifacts. They belong to seeded members, and nobody publishes
somebody else's draft through the interface on purpose, so finishing those two
is a pair of SQL statements written out at the end of
[`../supabase/seed/electric_grid_demo.sql`](../supabase/seed/electric_grid_demo.sql).
Optional, and worth doing if the user test should show a series that ends in a
recording.

**Reader counts**, which are the part most easily got wrong and the part the
brief asks for by name.

10. Open one of your own published pieces. The count should not move: an author
    reading their own work is not a reader of it.
11. Open it as a second person, from the invitation testing above. It should
    read "Read by 1 member". Reload the page a few times. It should stay at one,
    because a reload inside half an hour is the same read.
12. Confirm that nowhere in the interface says *which* member. The number is
    what an author gets, deliberately, while the club's data policy is still
    open. See build plan section 3 item 3.

**Removal**, which is the whole of the moderation surface for now.

13. As an administrator, open somebody else's piece and take it down. It should
    leave the library at once, and the author should still see it under `/write`
    marked as removed. Restore it, and it should come back as a draft for the
    author to publish again rather than going straight back up.

**Two things to decide while you are in there**, both of which are questions for
the club rather than for the build:

- **What the content area is called.** "Library" is a description, not a name.
  Nothing in the build has invented one.
- **The employer names in the seeded profiles.** They are all invented. If any
  of them collides with a real company, say so and it gets renamed.

### If something behaves unexpectedly

Six suites prove the database rules without needing a browser, and running the
relevant one separates "the interface is wrong" from "the policy is wrong" in a
single step:

- [`../supabase/tests/join_policy.sql`](../supabase/tests/join_policy.sql), what
  an application may and may not claim.
- [`../supabase/tests/admin_queue.sql`](../supabase/tests/admin_queue.sql),
  approval, the last-administrator guard, and the boundary between two clubs.
- [`../supabase/tests/invitations.sql`](../supabase/tests/invitations.sql), who
  can issue, read, and revoke an invitation, which is a credential rather than
  a record.
- [`../supabase/tests/member_media.sql`](../supabase/tests/member_media.sql),
  who can write, read, and delete an uploaded file.
- [`../supabase/tests/articles.sql`](../supabase/tests/articles.sql), the
  library, removal, and the reader counts.
- [`../supabase/tests/demo_seed.sql`](../supabase/tests/demo_seed.sql), the
  purge and the guard that refuses to publish a site holding demo content.

They all end in a deliberate error carrying their results and roll themselves
back, so they are safe to run against the live project and leave nothing behind.
The last one is the only one that touches real rows, and the rollback is what
makes that safe: it purges the demo content and publishes the site, and then
none of it happened.

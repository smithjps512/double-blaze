# Electric Grid: build status and session handoff

Where the build is, what is verified rather than merely written, and what a
fresh session needs to know before touching anything.

**Coming to this cold? Read [`HANDOFF.md`](./HANDOFF.md) first.** It is shorter
and says what matters before any of the detail here does.

Then this document, then [`build-plan.md`](./build-plan.md) for the plan and
[`brief.md`](./brief.md) for the client's own words.

No em dashes anywhere in this document.

---

## 0. The near-term goal, which shapes everything below

**James is running a user test with real testers once session 7 is done.** That
is the target the next four sessions are working toward, and it changes what
"done" means in a way worth stating before anything else.

A tester needs to be able to arrive, look around, and do something. So:

- **Getting in has to be frictionless.** Invitations (3e) are the path testers
  will use. James invites them directly, no questionnaire, no approval queue,
  one click.
- **The club cannot be empty.** This is the part that is easy to miss. A tester
  cannot test "access media", "react to a post", or "connect with members" if
  there is nothing to do it to. The demo seed stopped being housekeeping and
  became part of the deliverable, which is why it now sits between sessions 5
  and 6 rather than at the end.
- **Depth matters less than breadth.** Four features a tester can walk through
  beats two that are polished. Anything genuinely deferrable should be deferred
  and written down here, not built.

The agreed order is **5, then the seed, then 6, then 7.**

---

## 1. Session status

| # | Session | State |
|---|---|---|
| 1 | Platform spine | **Done, verified in production.** Two Vercel projects serving, both confirmed by curl. |
| 2 | Marketing landing page | **Built, at its gate.** Reviewed by James, hero rewritten twice. Not yet shown to the club. |
| 3 | Identity and join | **Built, awaiting its gate.** Schema, email sign-in, the join questionnaire, the approval queue, and invitations. Both join paths from the brief now exist. Sign-in is verified end to end with a real inbox; everything since is verified against the database but not yet by a human. |
| 4 | Profiles and directory | **Built, awaiting its gate.** Photo upload, the profile fields, the first-login prompt, and the directory. Storage policies verified; a real image upload through a browser is the gate. |
| 5 | Articles and media | **Built, awaiting its gate.** Written, audio, and embedded video. Series, drafts, the gated library, removal, and reader counts. 25 behavioural checks pass. The gate is a real audio upload and a real embed, neither of which any test here can reach. |
| - | Demo seed | **Built and run.** Six members, six articles, one series in the live club, all flagged, purgeable in one call, and blocking publication until they go. |
| 6 | Events | Not started. **Next.** |
| 7 | Engagement | Not started. Last one before James's user test. |
| 8-10 | Notifications, admin console, launch | Not started. After the user test. |

### What "verified" means here

Session 1 and session 3b were tested against the live deployment with a real
inbox, not just compiled. Three bugs have been found that way or by exercising
the database directly, and none was reachable by the unit tests. See section 5.

The database rules behind 3c and 3d are verified behaviourally rather than
structurally. Two suites run as actual `authenticated` sessions and prove what
is accepted and what is refused:

| Suite | Covers | Checks |
|---|---|---|
| [`supabase/tests/join_policy.sql`](../../../supabase/tests/join_policy.sql) | What an application may claim | 12, all passing |
| [`supabase/tests/admin_queue.sql`](../../../supabase/tests/admin_queue.sql) | Approval, the last-administrator guard, the multi-tenant boundary | 12, all passing |
| [`supabase/tests/invitations.sql`](../../../supabase/tests/invitations.sql) | Who can issue, read, and revoke a credential | 12, all passing |
| [`supabase/tests/member_media.sql`](../../../supabase/tests/member_media.sql) | Who can write, read, and delete an uploaded file | 8, all passing |
| [`supabase/tests/articles.sql`](../../../supabase/tests/articles.sql) | The library, removal, and the reader counts | 25, all passing |
| [`supabase/tests/demo_seed.sql`](../../../supabase/tests/demo_seed.sql) | The purge, and the guard that refuses to publish over demo content | 5, all passing |

Four of them build two clubs each and prove that one club's administrator can
neither see, approve into, take members from, read the invitations of, nor read
the library of the other. That boundary is the entire commercial case for
`apps/members` being multi-tenant, and it is now tested rather than reasoned
about.

`demo_seed.sql` is the odd one out and deliberately so: it runs against the real
site and the real seeded rows, because what needs proving is that *this* club
cannot go live while *these* rows are in it. The rollback is what makes that
safe against live data.

What is **not** verified is a real person doing any of this in a browser, which
is what the session 3 and 4 gates are for.

### What exists in `apps/members` today

So a fresh session can see the shape without reading every file.

| Route | What it is |
|---|---|
| `/` | The front door. Routes by membership status, and sends a member with no profile to write one |
| `/sign-in` | Email address in, magic link out. Also where every invitation failure explains itself |
| `/join` | The questionnaire. Four questions plus a name |
| `/invite/[token]` | Accepting an invitation. One click to an active membership and a session |
| `/profile` | Editing your own, including the photo |
| `/directory` | Everyone who is active and not hidden |
| `/members/[id]` | One profile, as another member sees it |
| `/library` | The gated library. Everything the club has published, newest first |
| `/library/[slug]` | One article, with its player, its series, and its reader count |
| `/series/[slug]` | One series, in order. Top level, so an article slugged "series" cannot shadow it |
| `/write` | Your own drafts and published work, with their reader counts |
| `/write/new`, `/write/[id]` | The editor. One form for all three kinds |
| `/admin` | The approval queue, the member list with roles, and issuing invitations |
| `/api/media/[...path]` | Serves uploads from the private bucket under the reader's session |
| `/api/articles` | Create, save, publish, and delete your own |
| `/api/articles/[id]/audio` | The audio upload, the same shape as the profile photo |
| `/api/articles/[id]/read` | Records a read. Answers 204 whatever happens |
| `/api/series` | Start a series |
| `/api/admin/articles` | Remove a piece from the library, and restore it |

Libraries: `tenant.ts` resolves the club by hostname, `auth.ts` holds the two
Supabase clients and `getSignedInMember`, `member-context.ts` composes the two
into the "which club, who, and a client carrying their session" that every route
needs, `email.ts` sends as the club, and the five pure modules named in
section 6.

---

## 2. Live infrastructure

Three Vercel projects, all from this repository, distinguished by root
directory. See [`../../DEPLOYMENT.md`](../../DEPLOYMENT.md) and
[`../../MEMBERS-SETUP.md`](../../MEMBERS-SETUP.md).

| Project | Root | Hostname |
|---|---|---|
| `double-blaze` | `apps/platform` | `doubleblaze.solutions`, `www` |
| `double-blaze-sites` | `apps/sites` | `*.doubleblaze.solutions` |
| `double-blaze-members` | `apps/members` | `electricgrid-members.doubleblaze.solutions` |

**Supabase Auth is configured**: email provider on, confirm email on, redirect
allow-list includes `https://*.doubleblaze.solutions/**` (the wildcard matters,
it is what makes the second club not require an auth settings change). SMTP is
deliberately unconfigured; sign-in links are generated by the admin API and
sent through Resend so they carry the verified domain and their failures reach
the bounce webhook.

**Supabase security advisor reports one finding**, `auth_leaked_password_protection`,
which is not applicable: there are no passwords on this project. Sign-in is a
magic link and nothing stores or checks a password. Zero findings otherwise,
and keeping it that way is why migration 0018 puts its definer functions in the
`app` schema rather than in `public`. See section 5.

### Database state

- `organizations`, `projects`, `sites` each have exactly one row: Electric
  Grid. These were the first rows ever written to those tables, and
  `sites.source_trailhead_site_id` carries the Trailhead conversion
  attribution.
- `sites.status` is `draft`. The member area works anyway; only the public page
  requires publication.
- One `site_members` row: James, admin, active, claimed.
- The Trailhead demo (`trailhead_sites.subdomain = 'electricgrid'`) is still at
  `preview` and should stay there. Its export bundle is the artifact that won
  the work.

**Migration history drift, harmless but worth knowing.** The remote records two
migrations the repository does not have, and neither needs reconciling.

The first is a superseded attempt at 0018 that made the identity helpers definer
functions in `public`, replaced minutes later by the `app`-schema version now in
`supabase/migrations/0018`. The resulting schema is identical either way.

The second is `seed_electric_grid_demo`, which is content rather than schema and
therefore lives in [`supabase/seed/`](../../../supabase/seed/electric_grid_demo.sql)
rather than in `migrations/`. It is recorded remotely only because
`apply_migration` is the sole write path from this environment. That is the right
outcome rather than a problem: applying the repository's migrations to a fresh
database produces the correct schema and no invented people.

### The demo content now in the club

Six members, six articles, and one series, all flagged `is_demo`. Four articles
are published; the audio and the video pieces are drafts waiting for the two
artifacts the session 5 gate produces.

Three things protect it, and the third is the one that matters:

- Every row carries `is_demo`, so "which of these is real" is a query.
- `select * from app.purge_site_demo_rows((select id from sites where slug = 'electricgrid'));`
  removes all of it and reports what it removed, including any storage paths the
  row deletion cannot reach.
- **The site cannot be published while any of it exists.** A trigger on `sites`
  refuses, the same way 0019's last-administrator guard refuses. The first two
  defences are only as good as somebody remembering to use them, and the entire
  risk here is that nobody does.

The seeded people are also unclaimable. Their addresses are at `.invalid`, which
nobody can register, and `claimMembershipByEmail` in `auth.ts` skips demo rows
outright, so a seeded membership is not a membership waiting for whoever can
receive its mail.

### How the two halves connect

The landing page's "Request to join" now points at
`https://electricgrid-members.doubleblaze.solutions/sign-in`, an absolute URL
rather than a page slug. It had been `href: "join"`, which resolved to a page on
the static site that does not exist, so the join flow was unreachable from the
marketing page. Session 10 puts both halves behind one hostname with path
routing, per section 1 of [`../../MEMBERS-SETUP.md`](../../MEMBERS-SETUP.md), and
this goes back to a plain path then.

It points at sign-in rather than at the questionnaire because a visitor has to
prove an address first. One link serves everyone: a stranger lands on the
questions after signing in, an applicant lands on their pending notice, and a
member lands in the member area.

---

## 3. Decisions already made

Do not reopen these without a reason. Rationale is in the architecture doc and
the build plan.

- **Tenancy:** clients are rows, never branches or repositories.
  `apps/members` is multi-tenant from the first line.
- **Media:** video embedded from YouTube/Vimeo, audio and documents
  self-hosted. No managed video service yet.
- **Discussion:** reactions and comments only. No forums, no channels.
- **Profiles:** visible to approved members, nothing public. This supersedes
  the Trailhead intake, which said the roster was public.
- **Moderation:** publish immediately, admins can remove.
- **Payments:** none at launch. When they arrive, Stripe Connect, never the
  Double Blaze account.
- **Auth:** Supabase Auth for members, Clerk for Double Blaze staff and client
  account holders. The two planes meet nowhere.

### Open, and blocking at some point

- **Commercial terms.** One-time build plus recurring hosting and maintenance,
  still unpriced. This is the item standing between the brief and a proposal.
- **The club's domain.** Needed for session 10, and separately for a publishable
  Google OAuth consent screen. Google sign-in can be tested without one.
- **Antitrust and competition language.** Raised by James, recorded in the build
  plan section 3. Needs the club's counsel before launch.
- **GDPR.** International membership, so it applies. Build it in from session 4
  rather than retrofitting at session 9.
- **The club's name.** "AI Interest for Electric Grid" reads like a working
  title and appears in the header, every page title, and every email.

---

## 4. Next actions, in order

1. **Session 6: events.** Any member schedules one. Topic, description, and date
   required; conferencing link and physical location optional. Invitations.
   No gate.

   Two things session 5 leaves ready for it. `member-context.ts` is the
   "which club, who, and their session" helper every new route wants, and the
   demo seed is a file to extend rather than one to write: seeded events want
   seeded attendees, and both exist now.

2. **Session 7: engagement.** Member-to-member connections, reactions and
   comments on articles and events. No gate, and the last thing before the user
   test.

   Reactions and comments both hang off `site_articles`, which now exists with a
   settled policy shape to copy. The one design question worth thinking about
   before starting: a comment is member-authored content on somebody else's
   page, so it needs the removal path that articles just got, and probably the
   report path that was deferred to session 9.

3. **Extend the demo seed** as 6 and 7 land. It is
   [`supabase/seed/electric_grid_demo.sql`](../../../supabase/seed/electric_grid_demo.sql),
   and the counts in `supabase/tests/demo_seed.sql` need updating alongside it.

4. **Then the user test**, and only after it, sessions 8 to 10.

### The gates that are owed

Sessions 3, 4, and 5 are all built and all waiting on a human. None of them
blocks sessions 6 and 7 from being built, but all three block the user test,
because a tester hitting a broken sign-in, a broken photo upload, or a player
that does not play ends the test.

- **Session 3 gate.** Needs James, a real inbox, and a second human. Both join
  paths, the queue, the handover, guest expiry, and revocation.
- **Session 4 gate.** The first real image upload end to end, which is the one
  thing no test here can reach.
- **Session 5 gate.** The first real audio upload and the first real embed, plus
  the reader counts and removal. The demo seed has left one draft waiting for
  each artifact, so finishing the gate also finishes the seed.

All three scripts are in section 5 of
[`../../MEMBERS-SETUP.md`](../../MEMBERS-SETUP.md), and they are worth running in
one sitting because they share a setup and the same handful of test addresses.

### Settled in 3c: what the questionnaire asks

The open question was which fields, and it is now closed. Four questions plus a
name, checked against the brief, which asks only for "enough information to
make an approval decision (employer, affiliation to industry/AI)".

| Question | Stored as | Required |
|---|---|---|
| Your name | `display_name` column | Yes |
| Employer | `join_answers.employer` | Yes |
| Role or title | `join_answers.role_title` | Yes |
| Where does your work sit: grid / AI / neither | `join_answers.industry` | Yes |
| What are you hoping to get from the forum | `join_answers.interest` | Only if "neither" |

Two choices worth keeping if the set is revisited:

- **The name is a column, not an answer.** A magic link proves an address and
  says nothing else, and `display_name` is what the queue and later the whole
  directory read.
- **The free text turns required only for "neither".** That is the single case
  where the structured answers decide nothing, so the cost of the field lands on
  the applicants whose application actually needs it. Everyone else answers four
  short questions.

Changing the set later is one edit to `apps/members/src/lib/join.ts`. The form,
the validation, and the pending screen all render from those definitions.

### Settled in 3d: what the approval queue does, and what it does not

`/admin`, visible only to an active administrator. Anyone else is redirected to
the front door rather than shown a refusal, since a member who guesses the URL
has done nothing wrong and gains nothing from learning the page exists.

**In:** the pending requests with their answers, approve, decline, and a role
control on the active membership. **Out, deliberately:**

- **Suspension, removal, reinstating a declined applicant.** Member management
  is session 9. This queue answers one question, which is whether somebody gets
  in.
- **Guest approval.** A guest carries an access window and nobody is asked about
  one here. Guests arrive by invitation, which matches the brief.
- **Approving with a role.** Approval is one decision. Appointing is a separate
  act on the member list, which reads better and is the sequence the handover
  needs anyway.

Three things worth not relearning:

- **The last-administrator guard is in the database**, not the console
  (migration 0019). James stepping back from the role is the point of this
  session, and doing it before appointing a replacement would leave a club
  nobody can administer and no route out except Double Blaze staff and the
  service role. The console warns; the database refuses.
- **The decision emails are best effort, and the console says when one fails.**
  The pending screen promises "we will email you as soon as there is an answer",
  and the administrator is the only person who can find out that the promise was
  not kept, so a send failure is reported to them rather than swallowed into a
  clean success.
- **`approved_by` and `approved_at` record declines too.** 0013's reasoning that
  a decision is only reviewable with its inputs applies to a no as much as a
  yes. The columns keep their names and carry comments saying so (0020), because
  renaming them would mean rewriting the policy in 0017 and the guard in 0013 to
  fix a word.

### Settled in 3e: the guest tier, and what is left of it

Open item 7 in the build plan asked who invites a guest, how long access lasts,
what expires when it does, and what they can still see afterward. Three of the
four were already answered elsewhere and were being carried as open because
nobody had written down where the answer was.

| Question | Answer | Where it came from |
|---|---|---|
| Who invites a guest | An administrator | The brief gives administrators "manage guest access" |
| What expires | Everything, at once | `app.is_active_site_member` in 0013 already treats a lapsed window as not being a member, and every policy keyed on it inherits that |
| What they keep | Their articles | A guest is invited so the membership can read what they wrote. Withdrawing it on expiry defeats the reason for inviting them |
| How long | An administrator picks, defaulting to 90 days | A default, not a decision taken for the club |

So the guest tier was never blocking the build. The default is deliberately a
starting position: 90 days covers a speaker at a scheduled meeting and an author
publishing a piece, which are the two cases the brief names, and the club will
settle the real number by using it.

**The two questions that remained are now answered**, both by James:

1. **Does a guest see the member directory?** **Yes.**
2. **Does a lapsed guest keep read access to the library?** **No.**

Neither needed a code change, because both match what
`app.is_active_site_member` already does. The guest tier is now closed
completely.

### Settled in 4: profiles, and who the directory is for

Every profile field is optional, including the photo. A member is already
admitted by the time they see the form, so a required field would be a barrier
placed after the decision rather than before it. The prompt exists to invite a
profile, not to withhold the site until one exists.

Employer, role, and the free-text answer are prefilled from the join answers, so
a new member's first sight of the form is half filled rather than blank. An
invited member answered no questions, so theirs is empty, which is honest.

Photos live in a private bucket and are served by `/api/media`, never by a
storage URL. A public bucket would make every member's photo enumerable by
anyone holding the publishable key, which is not a thing to do to a club whose
premise is that its inside is not public. **The object path is the security
model**: `<site_id>/<member_id>/<random>`, and both write policies key on those
first two segments, which is why the extension is derived from the mime type
rather than taken from the filename.

**Decided: a guest sees the member directory.** James, at the end of the session
that built this.

The reasoning that supports it: an invited guest was chosen individually by an
administrator, which is a higher bar than the self-application path, and a
speaker or author who cannot see who they are addressing is being asked to
contribute blind.

No code changed, because `site_members_directory_read` keys on
`app.is_active_site_member`, which already includes guests. Worth knowing that
this is now a decision rather than an accident of how that predicate was
written, so a later change to the predicate does not quietly reverse it.

An individual member who does not want to be seen still has
`profile_visibility = 'hidden'`, which removes them from the directory for
everybody rather than only for guests.

### Settled in 5: the library, and what reading data is kept

Six decisions worth not re-deriving, in rough order of how hard they were to
reach.

**One table for three kinds.** A written piece, an audio piece, and an embedded
video differ in one field each and share the author, title, summary, slug,
series, status, and reader count. Three tables would mean three sets of policies,
three slug namespaces, and a union in the query this application runs most. The
rule about which field each kind requires lives in `lib/articles.ts` where the
form, the route, and the tests all read the same definition.

**One row per reader per article, not an event log.** This is the decision that
mattered, because build plan section 3 item 3 flags reading data as a policy
question for session 9 and a schema written carelessly now would answer it by
accident. Two integers on the article answer both questions the brief asks. An
event stream would additionally answer "when did Dana read this, and how often",
which nobody asked for and which is the part with a retention problem.

The consequences, all enforced in migration 0023 rather than in a route:

- A reader sees only their own row. An administrator can see the rows. **An
  author sees the number and never the names**, which is why the counts are
  columns on the article rather than a view over the reads.
- A reload inside half an hour is one read. It makes the number worth showing
  and makes inflating it tedious rather than free.
- An author reading their own piece is not counted.
- A draft cannot be read at all.

If the club later decides per-member reading data should not be kept, the change
is dropping one table and keeping two integers.

**An embed is a provider and an id, never a URL.** An article's video ends up in
an iframe src, so storing what an author pasted would make "publish an article"
mean "embed anything you like in a page other members trust". The URL is parsed
down to a provider and an id, the id is checked against the shape that provider
uses, and the src is rebuilt. YouTube goes through `youtube-nocookie.com`.

**Removal is a status, and only an administrator can set it.** Publish
immediately and remove afterwards was already decided in build plan section 2.
What session 5 added is that the author cannot undo it, cannot delete the row,
and can still see it. A trigger enforces all three, because RLS decides which
rows and only a trigger can decide which columns. Restoring puts it back as a
draft rather than straight into the library: the administrator is undoing their
own removal, not republishing somebody else's work on their behalf.

**The slug follows the title until the first publication, then stops.** A
published article's URL is one other members have already opened.

**Series live at `/series/<slug>`, not under `/library/`.** Nesting them would
put series names and article slugs in one namespace, and an article somebody
titled "Series" would silently shadow the page. A reserved-word list is the other
fix and it is the kind of rule nobody remembers to check.

**Built the way the guest-tier decision needed.** James answered the question
itself: a lapsed guest keeps no read access to the library. What this session
owed was building the library so that answer holds without anybody maintaining
it, which means the library's policies key on `app.is_active_site_member` rather
than inventing a membership test of their own. Check 19 of
`supabase/tests/articles.sql` asserts it, so a change to that predicate now fails
a test instead of quietly reversing a decision.

**Still open, and still the club's to answer:** what the content area is called.
The interface says "the library", which is the plain description the brief
itself uses rather than a name invented here. Options go to James at the gate,
and changing it is one file.

**One consequence worth knowing rather than fixing.** A member who hides their
profile is absent from `site_members_directory_read`, so their articles are
attributed to "a member" rather than to them. That is the honest reading of what
hidden means, and there is no visibility control in the interface yet anyway, so
nobody can reach the state. Worth a decision if session 9 adds one.

### Settled in 3e: what an invitation is worth

**Possession of an invitation link signs the holder in as the invited address.**
That is worth stating plainly rather than discovering. It is the same bargain
the sign-in email already makes, so it adds no new class of exposure: both are
bearer credentials delivered to an inbox. What bounds it is that the link works
exactly once, expires after fourteen days, is revocable until it is used, and
lives in the database only as a SHA-256 hash.

The membership row is created before the session, and the ordering matters. The
row lands with `auth_user_id` null, so a forwarded link that half-redeems leaves
an unclaimed membership that only somebody who can receive mail at the invited
address can attach to.

If the club ever wants the stronger posture, the change is small: redeem the
token, then email a sign-in link to the invited address rather than signing the
clicker in. It costs one extra email and makes the mailbox the credential rather
than the link. Not done now because the brief asks for a join process that is
"simple and common/known to the one joining", and one click is what everyone
else does.

---

## 5. Bugs found by exercising the real thing

Each lived in a seam between components that worked alone, and none was
reachable by the unit tests. Recorded so they are not reintroduced.

**Magic link type mismatch.** `generateLink({type:'magiclink'})` for an address
with no account does not fail, it creates the identity. With email confirmation
enabled that user is unconfirmed, so Supabase stores a *signup* token rather
than a magiclink one. Verifying with the requested type searched the wrong
place and returned "One-time token not found" under the error code
`otp_expired`, which reached the member as a link that expired the instant it
arrived. Fix: read the type out of the `action_link` Supabase returns rather
than assuming, plus a fallback that tries the other types, since a token is
only consumed by a verification that succeeds.

**The privilege guard blocked its own claim.** `app.guard_site_member_self_update`
exists to stop a member editing their own role or status. Claiming a seeded row
runs as the service role, where `is_staff()` and `is_site_admin()` are both
false, so it fell through to the column checks and filling in `auth_user_id` is
exactly what they reject. **The service role bypasses row level security, but
nothing bypasses a trigger.** Fix: the guard applies only to the `authenticated`
role. Note `auth.role()` rather than `current_user`, because inside a
SECURITY DEFINER function `current_user` is the function owner rather than the
caller and would have matched nothing.

**The identity helpers recursed, and had since session 1.** The first insert the
join form ever attempted failed with `stack depth limit exceeded`, SQLSTATE
54001. `is_staff()`, `current_org_id()` and `current_app_user_id()` from
migration 0001 read the `users` table and were not SECURITY DEFINER, so a policy
calling `is_staff()` ran a select against `users`, whose own policy calls
`is_staff()`, forever.

This is the most useful bug of the three, because of how long it hid and why:

- **Every write so far ran as the service role**, which bypasses row level
  security entirely, so no policy was ever evaluated. Sessions 1 through 3b
  never once exercised this path.
- **The reads that did run under a member session were saved by luck.**
  Permissive policies are OR'd, and `site_members_self_read` is cheap and true
  for the reader's own row, so Postgres short-circuited before reaching the
  staff policy. Nothing guarantees that evaluation order. An insert has no
  self-read policy to short-circuit on, which is why the questionnaire hit it
  immediately.

Fix in 0018, and the shape of the fix is the point. Adding SECURITY DEFINER to
the three public functions works and is wrong: PostgREST exposes `public`, so
each becomes an owner-rights RPC endpoint and the security advisor flags all
three for `anon` and `authenticated`. Moving them to `app` outright would mean
dropping and rebuilding every policy in 0001 that names them, since a policy
holds a function by identity rather than by name. So the definer logic moved to
`app`, and the public functions stayed exactly where the policies expect them as
one-line invoker wrappers. The recursion breaks at the `app` call and nothing
new is reachable over REST.

**The lesson worth carrying:** anything a policy calls must not itself be
subject to a policy. `app.is_site_admin` and its siblings in 0013 already had
this right; the older Clerk-plane helpers did not, and no test could have caught
it because no test ran as `authenticated`.

---

## 6. How this codebase is built

Patterns that emerged across sessions 3 and 4 and are worth continuing, because
consistency here is most of what makes the next session cheap. Each one is a
choice that has already paid for itself at least once.

### Every session has the same four pieces

1. **A pure module in `apps/members/src/lib/`.** Field definitions, validation,
   and copy, with no framework and no database. `join.ts`, `admin.ts`,
   `invitations.ts`, `profile.ts`, `articles.ts` are the existing five. The form,
   the API route, and any admin view all render from the same definitions, so
   changing a question is one edit rather than three that drift.
2. **A unit test beside it**, run by `node --test` through tsx. These cover what
   is accepted, what is refused, and the copy. Two checks worth repeating in
   every new one: no em dashes, and none of the coordination language the build
   plan flags in section 3. Strip HTML tags before the second, or `vertical-align`
   will trip it.
3. **A migration**, with the reasoning in the file rather than in a commit
   message. The migrations are the most-read documentation in this repository.
4. **A behavioural SQL suite in `supabase/tests/`**, described below. This is
   what catches the bugs unit tests structurally cannot.

### Security lives in policies, not in routes

The rule that has held: **any query that could run under the member's own
session must.** Row level security is what enforces tenancy and privilege, and
the application's checks exist for the error message rather than the security.
Reaching for the service role to make something work is how tenant isolation
quietly stops being enforced.

The service role is used in exactly three places, each with a written reason:
claiming an unclaimed membership, looking up an invitation by a token the holder
cannot read, and listing administrators to notify about an application.

A corollary the pages follow: **do not add a visibility check to a page when a
policy already decides.** The directory and profile pages have none. A second
opinion in a page can only disagree with the policy, and when it does, the page
is what gets trusted.

### Behavioural database tests, and how to run them

`execute_sql` through the MCP tools is read-only, so the trick is a `do $$ ... $$`
block sent through `apply_migration` that ends in `raise exception` carrying its
results. The exception rolls the whole transaction back, so the test can create
sites, auth identities, members, and storage objects, exercise them, and leave
nothing behind, and the failed migration is never recorded.

Six suites exist. They found the recursion in section 5 and they are the only
thing standing behind the multi-tenant claim. Four rules learned the hard way:

- Impersonating a member takes **both** `set local role authenticated` **and**
  `set_config('request.jwt.claims', ...)`. The role decides whether RLS applies;
  the claims are what `auth.uid()`, `auth.jwt()` and `auth.role()` read. One
  without the other tests nothing.
- `reset role` does **not** clear the claims, so `auth.role()` still reports
  `authenticated` and the guards still fire. Clear the claims too when a step
  needs to act as an administrator.
- **Assert on `row_count` after an update.** An update matching zero rows raises
  nothing, so a change that should have been refused reads as a pass. Several
  early drafts of these suites were green and proving nothing.
- **A trigger can be turned off for a fixture.** The suite runs as the migration
  role, which owns the tables, so `alter table x disable trigger y` inside the
  block is available and rolls back with everything else. Session 5 needed it to
  backdate a read, because the trigger that owns `last_read_at` overwrites any
  value sent to it. The demo seed uses the same move to give its articles a
  spread of publication dates.

### Two of the guards use pg_trigger_depth, and here is why

`app.guard_site_article_author_update` refuses to let an author write the reader
counts, and the counter trigger updates exactly those columns. The counter runs
inside another trigger and the author's request does not, so
`pg_trigger_depth() > 1` is what tells them apart.

This came up because of the lesson in section 5: **the service role bypasses row
level security, and nothing bypasses a trigger.** A SECURITY DEFINER counter
function still runs with the caller's `request.jwt.claims`, so `auth.role()`
still reports `authenticated` and the guard still fires. Depth is the signal that
does not lie, because a member cannot create a trigger and therefore cannot get
a write nested.

The alternative was column-level `revoke update (...)`, which works and means
remembering to grant every column added afterwards. That is the kind of rule
that fails quietly two sessions later.

### Copy

No em dashes, anywhere. Beyond that, everything a member reads goes through the
antitrust pass in build plan section 3: no collaborate, coordinate, align,
agree, or standardize. This applies to email the club sends in its own name, not
just the marketing page, and there is a test enforcing it.

Where a decision affects a person, say the thing rather than the status. A
decline gives no reason because none was asked for. A send failure is reported
to the administrator because they are the only one who can find out. An
applicant sees their own answers read back because the wait is measured in days.

---

## 7. Working notes for a fresh session

Things that cost time to discover in this environment.

- **The agent sandbox cannot reach `doubleblaze.solutions`.** Both `curl` and
  `WebFetch` are refused by the egress proxy. Anything requiring a real HTTP
  request to the live site has to be run by James and pasted back.
- **MCP servers drop and reconnect constantly.** GitHub, Supabase, Vercel and
  Resend all went down and came back several times. `enabledInChat: false` from
  `ListConnectors` reports current attachment, not the user's toggle, so it is
  not evidence of a settings problem. Retry before diagnosing.
- **`execute_sql` is read-only.** Writes need `apply_migration`. Structural
  verification through `pg_policies`, `pg_proc` and `pg_indexes` works well.
- **Behavioural database tests are possible, and worth the trouble.** Send a
  `do $$ ... $$` block through `apply_migration` that ends in
  `raise exception` carrying the results. The exception rolls the whole
  transaction back, so the test can create auth identities and rows, exercise
  them, and leave nothing behind, and the failed migration is never recorded.
  The results arrive in the error message.
  [`supabase/tests/join_policy.sql`](../../../supabase/tests/join_policy.sql) is
  the worked example, and it is what found the recursion in section 5.
  Two things that will otherwise waste an hour:
  - Impersonating a member takes **both** `set local role authenticated` and
    `set_config('request.jwt.claims', ...)`. The role decides whether row level
    security applies; the claims are what `auth.uid()`, `auth.jwt()` and
    `auth.role()` read. Setting one without the other tests nothing.
  - `reset role` does **not** clear the claims, so `auth.role()` still reports
    `authenticated` and the privilege guard still fires. Clear the claims too
    when a step needs to act as an administrator.
  - Assert on `row_count` after an update. An update matching zero rows raises
    nothing, so a check that should have been refused reads as a pass.
- **Images pasted into chat do not reach the filesystem.** Only files attached
  explicitly do. Ask for attachments when a real asset is needed.
- **Supabase auth logs are queryable** through `query_logs` with
  `source = 'auth_logs'`, and they gave the exact cause of the sign-in bug in
  one query. Reach for them early.
- **Preview rendering:** `apps/platform/scripts/render-preview.ts` writes the
  Electric Grid page to a single self-contained HTML file with assets inlined,
  which is how design gates have been delivered.
- **House convention: no em dashes**, anywhere, in docs or generated copy.

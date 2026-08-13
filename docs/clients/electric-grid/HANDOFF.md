# Start here

A transition note for whoever picks this up next. Written at the end of the
session that built 5 and the demo seed, on top of the one that built 3c, 3d, 3e,
and 4, while everything was still fresh.

Read this, then [`status.md`](./status.md). Nothing else is needed to start.

No em dashes anywhere in this document.

---

## In one paragraph

Electric Grid is the first paid site on the custom-sites platform, and the first
conversion from a Trailhead demo to a paid engagement. The marketing page is
built and served statically. Everything behind the login is a multi-tenant
application in `apps/members`, and identity, joining, approval, invitations,
profiles, and now publishing all work. The club is no longer empty: six invented
members and six articles are seeded into it, flagged, purgeable in one call, and
blocking publication until they go. What remains before James can put it in
front of real testers is events, engagement, and three gates that need a human.

## The thing to understand before touching anything

**Row level security is the security model, and the application is not.**

Every query that can run under the member's own Supabase session does. The
policies decide what is visible and what is writable, and the checks in the
routes exist to produce a good error message rather than to enforce anything.
There are exactly three places that use the service role, each with a written
reason in the file.

This is not a stylistic preference. The one time this build got it wrong, the
identity helpers from migration 0001 recursed and every insert by a real member
failed with `stack depth limit exceeded`. It had been broken since session 1 and
nothing caught it, because every write until then had run as the service role,
where no policy is ever evaluated. Section 5 of `status.md` has the whole story.
It is the most useful thing in that document.

The consequence for how you work: **write a behavioural SQL test for anything
new that has a policy.** Section 6 of `status.md` explains the technique, which
gets a real transaction under a real `authenticated` role and rolls itself back.
There are six suites already. They are the reason the multi-tenant claim is a
claim anyone should believe.

The corollary bit people forget, and session 5 hit again: **the service role
bypasses row level security, and nothing bypasses a trigger.** If a definer
function of yours updates a table that has a guard, the guard fires, and
`auth.role()` still reports whatever the caller was. Section 6 of `status.md`
has how session 5 solved it.

## What James wants next, and why it changes the shape of the work

He is running a **user test with real testers after session 7**. Not a demo, a
test. That reframes the remaining sessions:

- Breadth beats depth. Four features a tester can walk through beats two that
  are polished.
- The club cannot be empty, which is why the demo seed moved up between sessions
  5 and 6 and stopped being housekeeping. **This is now done**, and it is the
  reason the next two sessions have something to attach to.
- Invitations are how testers get in, so that path matters more than the
  questionnaire for the next few weeks.

Section 0 of `status.md` says the same thing at more length.

## What is done, and what "done" means

| | State |
|---|---|
| Sessions 1, 2 | Built. Session 2 reviewed by James, not yet shown to the club |
| Session 3 | Built, all four stages. Verified against the database, **not by a human** |
| Session 4 | Built. Verified against the database, **not by a human** |
| Session 5 | Built. Verified against the database, **not by a human** |
| Demo seed | Built and run against the live club |
| Sessions 6, 7 | Not started |

"Verified against the database" means 335 unit tests and six behavioural SQL
suites pass. It does not mean anybody has clicked anything. The sandbox cannot
reach `doubleblaze.solutions`, so sessions 3, 4, and 5 all still owe a gate, and
those gates block the user test rather than the next session. All three scripts
are in section 5 of [`../../MEMBERS-SETUP.md`](../../MEMBERS-SETUP.md), and they
are worth running in one sitting.

Session 5's gate has a useful property: the seed left one draft waiting for a
real recording and one waiting for a real video link, so working through the gate
also finishes the seed.

Take the difference seriously. Two of the three bugs recorded in `status.md`
section 5 were found by a human with a real inbox, and neither was reachable by
any test in this repository.

## Where the surprises are

Five things that cost time to discover, in rough order of how much:

1. **The sandbox cannot reach the live site.** `curl` and `WebFetch` are both
   refused by the egress proxy. Anything needing a real HTTP request has to be
   run by James and pasted back.
2. **`execute_sql` is read-only.** Writes go through `apply_migration`. The
   rollback trick in `status.md` section 6 is how to test behaviour anyway.
3. **A migration file and the remote history can drift.** Two records exist
   remotely that the repository does not have: a superseded attempt at 0018, and
   the demo seed, which is content rather than schema and lives in
   `supabase/seed/`. Neither needs reconciling. Noted in `status.md` section 2
   so nobody tries.
4. **MCP servers drop and reconnect constantly.** Retry before diagnosing.
5. **Images pasted into chat do not reach the filesystem.** Only explicit
   attachments do.

## Decisions that are closed

Do not reopen these without a reason. Rationale is in `status.md` section 3 and
4, and in the build plan.

Tenancy is rows, never branches. Media is embedded video and self-hosted audio.
Discussion is reactions and comments, no forums. Profiles are visible to
approved members and to nobody else. Articles publish immediately and admins can
remove. No payments at launch. Supabase Auth for members, Clerk for staff, and
the two planes meet nowhere.

The guest tier is closed. Most of it was closed in 3e by writing down answers
that already existed elsewhere in the build; the last two were answered by James
directly. **A guest sees the member directory. A lapsed guest keeps no read
access to the library.** Neither needed a code change, because both match what
`app.is_active_site_member` already does, but they are decisions now rather than
side effects of that predicate, so do not let a change to it reverse them
quietly.

Session 5 made the second one harder to reverse by accident. The library's own
policies key on that same predicate rather than inventing a membership test, and
check 19 of `supabase/tests/articles.sql` asserts that a lapsed guest reads
nothing. A change to the predicate now fails a test rather than passing quietly.

Session 5 closed one more that is worth knowing before touching the schema:
**reading data is one row per member per article, never an event log.** Two
integers on the article answer the two questions the brief asks, and the
database deliberately cannot answer "when did Dana read this". Who may see what
is still session 9's to settle, and this is the shape that leaves it the most
room. `status.md` section 4 has the rest.

## Questions that are open, and who owns them

**For the club, via James.** One, and it does not block any build work: do any
of the six seeded employer names collide with a real company? They are all
invented, but the build cannot check that and James can.

**For James, commercially.** Still the item standing between the brief and a
proposal: the one-time build price and the recurring hosting line.

**For counsel, before launch.** GDPR, and the antitrust and competition language
in build plan section 3. The second one is not only a copy note: it shapes the
moderation posture and possibly the article review posture, and it is the reason
every member-facing string in this build avoids the words collaborate,
coordinate, align, agree, and standardize. There is a test enforcing it.

**Still unnamed.** The content area, and arguably the club itself: "AI Interest
for Electric Grid" reads like a working title and appears in every page title
and every email. Session 5 deliberately did not invent a name for the content
area. The interface calls it "the library", which is a description rather than a
name, and swapping it is one file.

## How to start session 6

Read `status.md` section 4, item 1, and the "Settled in 5" part of that section.
Events are the closest thing in the build to articles: member-authored, scoped by
site, published to the club, with a policy shape worth copying rather than
rethinking.

Three things session 5 left ready:

- **`lib/member-context.ts`** is the "which club, who is asking, and a client
  carrying their session" that every route needs. New routes start there.
- **The demo seed** is a file to extend rather than one to write. Seeded events
  want seeded attendees, and six of those now exist. Its counts are asserted in
  `supabase/tests/demo_seed.sql`, so update both together.
- **`supabase/tests/articles.sql`** is the closest template for a new suite.

Then follow the four-piece pattern in `status.md` section 6. A pure module with
its unit test, a migration that explains itself, and a behavioural SQL suite.
That is what the last five sessions did, and it is why this one can start by
reading two documents instead of the whole repository.

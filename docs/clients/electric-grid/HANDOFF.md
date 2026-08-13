# Start here

A transition note for whoever picks this up next. Written at the end of the
session that built 3c, 3d, 3e, and 4, when everything was still fresh.

Read this, then [`status.md`](./status.md). Nothing else is needed to start.

No em dashes anywhere in this document.

---

## In one paragraph

Electric Grid is the first paid site on the custom-sites platform, and the first
conversion from a Trailhead demo to a paid engagement. The marketing page is
built and served statically. Everything behind the login is a multi-tenant
application in `apps/members`, and identity, joining, approval, invitations, and
profiles all now work. What remains before James can put it in front of real
testers is articles, a demo seed, events, and engagement, in that order.

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
There are four suites already. They are the reason the multi-tenant claim is a
claim anyone should believe.

## What James wants next, and why it changes the shape of the work

He is running a **user test with real testers after session 7**. Not a demo, a
test. That reframes the remaining sessions:

- Breadth beats depth. Four features a tester can walk through beats two that
  are polished.
- The club cannot be empty, which is why the demo seed moved up between sessions
  5 and 6 and stopped being housekeeping.
- Invitations are how testers get in, so that path matters more than the
  questionnaire for the next few weeks.

Section 0 of `status.md` says the same thing at more length.

## What is done, and what "done" means

| | State |
|---|---|
| Sessions 1, 2 | Built. Session 2 reviewed by James, not yet shown to the club |
| Session 3 | Built, all four stages. Verified against the database, **not by a human** |
| Session 4 | Built. Verified against the database, **not by a human** |
| Sessions 5, 6, 7 | Not started |

"Verified against the database" means 263 unit tests and four behavioural SQL
suites pass. It does not mean anybody has clicked anything. The sandbox cannot
reach `doubleblaze.solutions`, so sessions 3 and 4 both still owe a gate, and
those gates block the user test rather than the next session. The script is in
section 5 of [`../../MEMBERS-SETUP.md`](../../MEMBERS-SETUP.md).

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
3. **A migration file and the remote history can drift.** One superseded
   attempt at 0018 is recorded remotely and not in the repository. The schema is
   identical either way. Noted in `status.md` section 2 so nobody tries to
   reconcile it.
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

## Questions that are open, and who owns them

**For James, commercially.** Still the item standing between the brief and a
proposal: the one-time build price and the recurring hosting line.

**For counsel, before launch.** GDPR, and the antitrust and competition language
in build plan section 3. The second one is not only a copy note: it shapes the
moderation posture and possibly the article review posture, and it is the reason
every member-facing string in this build avoids the words collaborate,
coordinate, align, agree, and standardize. There is a test enforcing it.

**Still unnamed.** The content area, and arguably the club itself: "AI Interest
for Electric Grid" reads like a working title and appears in every page title
and every email.

## How to start session 5

Read `status.md` section 4, item 1. It carries the design notes so they do not
have to be re-derived: the media split is already decided, moderation is already
decided, the storage bucket already accepts audio, and the content area still
needs a name that should not be invented quietly.

Then follow the four-piece pattern in `status.md` section 6. A pure module with
its unit test, a migration that explains itself, and a behavioural SQL suite.
That is what the last four sessions did, and it is why this one can start by
reading two documents instead of the whole repository.

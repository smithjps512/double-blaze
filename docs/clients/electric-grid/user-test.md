# Preparing the user test

What has to happen before three real testers see this, in order, and the email
to send them when it does.

Written at the end of session 5. Read [`HANDOFF.md`](./HANDOFF.md) and
[`status.md`](./status.md) for where the build stands.

No em dashes anywhere in this document, including the email.

---

## Decided: the test waits for a UI pass

**James saw the member area on the live site and held the test.** Recorded here
because his reason raises the bar rather than merely confirming the
recommendation below.

The three testers are **the three leaders starting the member group**, not an
unaffiliated UAT team. That is a deliberate choice and the right one, because
the people who have to want this are the people whose opinion is worth having.
It also means the test is not only a functional check. Those three are deciding
whether to put their names to the thing, and they will react to how it looks
before they react to what it does.

In his words, it needs some sizzle and not just steak. For this audience sizzle
is not motion or ornament: it is the impression of care and authority, which is
what makes a professional hand over their name and their employer to a
directory. The marketing page already has it. The member area does not yet.

## The recommendation this confirmed

**Hold the test until there has been a UI pass.** One session, and it should
come before the invitations go out rather than after the first round of
feedback.

The member area works and is not ugly. What it is not is *branded*. A tester who
has just read the marketing page and clicks through to sign in lands somewhere
that has no name on it, no header, and a browser tab that says "Members". They
will read that as a prototype, and once somebody has decided they are looking at
a prototype, every piece of feedback that comes back is about the prototype
rather than about the thing being tested.

That is a bad trade, because the expensive part is already done. The hard work in
sessions 3, 4, and 5 is identity, tenancy, policy, and publishing. The missing
part is a shell, and the design language for it already exists and has already
been reviewed: it is session 2's marketing page.

---

## What the member area actually looks like today

So the call can be made on evidence rather than on adjectives.

**What is already right:**

- The five colour tokens in `apps/members/src/app/globals.css` are identical to
  `ELECTRIC_GRID_THEME` in `apps/platform/src/lib/clients/electric-grid.ts`.
  Deep navy, the green accent, the near-white background. It is the same
  palette the client already signed off.
- Typography renders the same on both halves in practice. Neither the marketing
  page nor the member area loads a webfont, so both fall back to `system-ui` for
  body text and Georgia for headings. That is a shared limitation rather than a
  seam between them.
- Reading measure, spacing, form labels, error copy, focus rings, and the
  whole-row radio targets are all deliberate and all fine.

**What is missing, and this is the list:**

1. **No identity anywhere.** No header bar, no club name, no wordmark. The club
   is named only inside body copy on a few pages.
2. **Every browser tab says "Members".** `layout.tsx` sets one static title for
   the whole application.
3. **No footer**, so no obvious place for the policies session 9 adds.
4. **The navigation is an unstyled row of text links** above the content rather
   than a designed header.
5. **Everything is one narrow column of text on white.** No surfaces, no cards,
   no visual hierarchy beyond heading sizes. It reads as a competent internal
   tool.
6. **Two tables overflow on a phone.** `/write` has four columns and `/admin`
   has more. Testers will open this on a phone whatever the email says.
7. **No favicon.**
8. **The theme tokens are hand-copied** into the member area's CSS rather than
   sourced from the site's theme. Correct today, wrong the moment either
   changes, and a second club on the platform would inherit Electric Grid's
   colours.

Item 8 is worth doing regardless of the test, because it is the kind of
duplication that is cheap now and expensive after the second client.

### What the UI pass is, concretely

One session. Not a repaint: a shell, plus applying the existing design language
to five pages.

- Theme tokens sourced from one place, so the two halves cannot drift, and so
  a second club gets its own colours rather than these.
- A real header: club wordmark on the left, navigation on the right, the
  signed-in member and a sign-out on the far right. A footer with the club name
  and room for the policies.
- Per-page titles, so a tab says "The library" rather than "Members".
- Page-level layout for the five pages a tester actually walks through: the
  member home, the library, an article, the directory, and a profile. The
  article page is the one worth spending the most on, because reading is what
  the club is for.
- Empty states that look intentional rather than like something failed.
- The two tables made to work on a phone.
- A favicon.

Optionally load the two real webfonts. Worth a separate decision, because the
marketing page does not load them either and the renderer has a test asserting
it emits no external stylesheet link. Self-hosting them in the member area only
would make the two halves diverge, which is the opposite of the goal.

---

## The action plan

Six steps. Steps 1 to 3 can happen in one sitting.

### 1. Merge the pull request

[PR #36](https://github.com/smithjps512/double-blaze/pull/36). Migrations 0023
and 0024 and the demo seed are already applied to the live Supabase project, so
merging brings the repository into line with the database rather than the other
way round.

**Owner: James. Ten minutes.**

### 2. Confirm the members app is deployed and configured

Before any gate is worth running.

- `double-blaze-members` on Vercel is building from `apps/members` on `main`.
- Its environment variables are set, per section 3 of
  [`../../MEMBERS-SETUP.md`](../../MEMBERS-SETUP.md). All six are present as of
  this writing, and one is misspelled: **`EXT_PUBLIC_PRIMARY_DOMAIN` is missing
  its leading N**. Rename it to `NEXT_PUBLIC_PRIMARY_DOMAIN`, confirm its value
  is the bare `doubleblaze.solutions`, and redeploy, because `NEXT_PUBLIC_`
  variables are inlined at build time.

  Nothing is broken by this today. The application falls through to a default
  that happens to be the same value, and this hostname resolves by its
  `site_domains` row rather than by parsing the subdomain, so the variable is
  not consulted either way. It is worth fixing because config that looks set
  and is not is the kind of thing that costs an afternoon at session 10.
- `electricgrid-members.doubleblaze.solutions` resolves and serves the sign-in
  page.
- Resend still shows the sending domain as verified, because every gate below
  depends on a real email arriving.

**Owner: James. Fifteen minutes.**

### 3. Run the three owed gates

Sessions 3, 4, and 5 are all built and none has been touched by a human. The
full scripts are section 5 of [`../../MEMBERS-SETUP.md`](../../MEMBERS-SETUP.md).
Run them in one sitting: they share a setup and the same handful of throwaway
addresses.

Bring four email addresses you can actually read, plus one other person.

| Gate | What it proves | Why no test here can reach it |
|---|---|---|
| 3 | Both join paths, the approval queue, the admin handover, guest expiry, invitation revocation | Needs a real inbox and a second human |
| 4 | The first real image upload, end to end | Needs a real file through a real browser |
| 5 | The first real audio upload, the first real embed, the reader counts, removal | Same, plus a video that actually resolves |

**This is the step most likely to find something.** Two of the three bugs
recorded in `status.md` section 5 were found by a human with a real inbox, and
neither was reachable by any test in the repository. Budget for finding one.

**Owner: James, plus one other person for part of gate 3. Ninety minutes.**

### 4. The UI pass

See above. Send the word and it gets built.

Worth doing after step 3 rather than before, so that anything the gates turn up
gets fixed in the same pass rather than in a third round.

**Owner: Double Blaze. One session.**

### 5. Settle three things that belong to the club, not to the build

None of these blocks the build. All of them will be noticed by a tester.

| Question | Where it stands | Why it matters for the test |
|---|---|---|
| **What is the content area called?** | The interface says "the library", which is a description rather than a name. Nothing has been invented. | It is the most-used word in the product and the first thing a tester will have an opinion about |
| **Is "AI Interest for Electric Grid" the name?** | It reads like a working title and appears in every page title and every email | Same, and harder to change later |
| **Do the six seeded employer names collide with anything real?** | All invented, but the build cannot check that and you can | A fictional utility that turns out to exist is the one embarrassment worth avoiding |

The two guest-tier questions that used to sit here are closed. A guest sees the
member directory, and a lapsed guest keeps no read access to the library. Both
were answered by James, and neither needed a code change.

The competition and antitrust question raised in build plan section 3 is not
blocking a test of three people looking at a prototype. It does become live the
moment members post real content, and the editor already carries a standing
reminder pointing at published results and methods rather than plans and
capacity. Worth counsel before launch, not before this.

**Owner: James, with the club. One conversation.**

### 6. Send the email, then the invitations, in that order

The invitation email is sent automatically by the admin console and is short. It
will make more sense arriving second, after the context email below.

1. Send the email in the next section to each of the three testers.
2. In `/admin`, under **Invite someone**, issue each of them a Member invitation.
   Not Guest: a guest carries an access window and would lapse mid-test.
3. Confirm all three appear under "Invitations waiting to be accepted".

Give them a fortnight. Invitations expire after fourteen days and can be
reissued.

**Owner: James. Twenty minutes.**

---

## The email

Ready to send once step 4 is done. Three separate emails rather than one with
three names on it: a tester who can see the other two testers is a tester
comparing notes before they have their own opinion.

Written to pass the same antitrust check every member-facing string in this
build passes. No collaborating, coordinating, aligning, agreeing, or
standardizing, and it points at published results and methods rather than at
plans, pricing, or capacity.

---

**Subject:** A first look at the forum, and a favour

Hi [Name],

I am building a private, invitation-only forum for people working on AI in the
electric power industry, and it is far enough along to be worth showing to three
people whose judgement I trust. You are one of the three.

What I am asking for is about half an hour, whenever suits you in the next
fortnight, and then a candid reaction.

**What it is**

A vetted international forum where utility professionals and AI practitioners
publish what they are learning and can find each other. Members apply or are
invited, an administrator approves them, and everything inside is visible only
to members. Nothing in it is public and it is not indexed by search engines.

**What is working today**

- **Signing in.** No password. You put in your email address and a link arrives.
- **Your profile.** A photo, your employer and role, what you work on, and what
  you want to learn or discuss. All of it optional. Visible to other members and
  to nobody else.
- **The member directory.** Everyone who has been admitted, and their profiles.
- **The library.** Written pieces, audio, and video, published by members. You
  can read, listen, and watch.
- **Publishing.** You can write and publish something yourself, save drafts, and
  put a piece into a series. It goes live immediately: members are vetted at the
  door, so there is no queue to wait in.
- **Reader counts.** Each piece shows how many members have read it. Deliberately
  a number and never a list of names.

**One thing to know before you look**

The forum is not full of real people yet. To give you something to actually
read, I have seeded it with six invented members and six articles. The people
are fictional, their employers are fictional, and the articles are written to be
plausible rather than authoritative. There is not a single statistic in any of
them, on purpose. All of it gets deleted before anyone real joins, and the
system refuses to publish the club while any of it is still there.

Anything you publish yourself while testing is real, and I will leave it or
remove it, whichever you prefer.

**What would help most**

Whatever you actually notice, but if it helps to have prompts:

1. Sign in and write a profile. Did anything ask for more than it needed?
2. Read something in the library. Is this a thing you would come back to?
3. Publish something short. Even two paragraphs. Was it obvious how?
4. Look at the member directory. Is this enough to decide whether to reach out to
   somebody?
5. Try it on your phone as well as a computer.
6. The forum's content area is currently just called "the library". If you have a
   better name, I want it.

And the question underneath all of it: **is this something you would use, and if
not, what is missing?**

**What is not built yet**

Being straight about the gaps so you are not testing for them:

- **Events.** Scheduling a meeting or a talk, with invitations.
- **Reactions and comments.** Being able to respond to a piece rather than only
  read it.
- **Connecting with other members** directly.
- **Notifications**, so you hear about a new piece without checking.
- **The policies**, including privacy and non-solicitation.

Those are the next three rounds of work, and they start once I know the
foundation is right. That is really what I am asking you to tell me.

**How to get in**

A separate email from the forum itself has your invitation link. One click and
you are in, with no application to fill in and nothing to wait for. If it does
not arrive, check spam and then tell me.

Reply to this email with anything at all, however rough. Blunt is more useful
than polite.

Thank you,

James

---

## What the first self-test found

James walked the whole thing himself before inviting anybody. Everything worked:
sign-in, the profile, a photo upload, reading articles. One finding, and it is
the useful kind because no test in this repository could have produced it.

**He could not find how to publish audio or video.** The navigation said
"Write", and the three kinds were a radio button inside the editor, so the only
way to discover that a recording could be uploaded was to open a page named
after the one thing that is not a recording.

Nothing was broken. The form worked, the upload worked, and the fields appeared
the moment the kind changed. It was purely a question of what a member is told
exists, which is exactly the class of problem a user test is for and exactly
the class that unit tests and policy suites cannot see.

Three changes came out of it:

- **The navigation says "Publish".** One word, and it stops naming one of three
  things a member can do.
- **The three kinds are three doors on that page**, each a card saying what it
  is, before any form exists. The radio button is still in the editor for
  somebody who changes their mind halfway through.
- **Choosing a file before the piece has a title** used to complain only about
  the title, which read as though choosing the file had done nothing. It now
  says what to do.

Worth keeping in mind for sessions 6 and 7: the same trap is available. An
events feature whose navigation says "Schedule" will hide whatever else events
can do.

## What to do with what comes back

Three things worth separating as the replies arrive, because they have different
answers:

- **Broken.** Goes straight into the next session.
- **Missing.** Check it against sessions 6 to 10 first. Most of it is already
  planned, and knowing that is a better reply than building it.
- **Wrong.** The valuable category and the rarest. Something built on an
  assumption that does not survive contact with the people it was built for.
  These are worth a conversation before a change.

If all three testers say the same thing about the same screen, that is the
change to make before session 6 rather than after session 7.

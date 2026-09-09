# Class chat: data model and the join code flow

No em dashes anywhere in this document or any copy it generates.

A Slack-shaped chat for the software development classes: one channel per class
period, team channels underneath, files and links, and a teacher who can read
everything in one place.

This is the design, not the build. It exists to be argued with before anything
is written.

## The four decisions everything else hangs off

**1. The teacher owns every identity.** Students never type their own name. The
teacher creates a roster, types the display names, and the system hands back a
join code per person. That is the whole authentication story.

**2. There are no direct messages.** Every message is in a channel the teacher
can read. Not "can read if they go looking": the teacher's own view is every
message from every channel in one list.

**3. Nothing is ever deleted, only hidden.** A student removing a message they
are about to be asked about is the exact failure this has to prevent.

**4. The teacher's attention is the scarce resource, not the code.** Nineteen
channels is nothing to build and a great deal to read. Every design choice below
that looks like extra work is there to keep supervision to one page.

---

## Data model

Five tables, prefixed `chat_`. **RLS on, and no policies at all**, the way
`trail_crew_questions` already works: nothing but the service role touches these,
because every read is gated on a session the database cannot see. Public read
would be wrong here in a way it is right for the showcase, and the difference is
worth being deliberate about.

**None of this is ever rendered into a static page or committed to the
repository.** It lives in Supabase and nowhere else. The repository is public.

### `chat_members`

The roster. One row per person the teacher adds.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `period` | text | `period-1`, `period-2` and so on. Scopes everything. |
| `display_name` | text | What everybody sees. The teacher types it. |
| `join_code` | text | Unique. The only credential. |
| `role` | text | `student` or `teacher` |
| `team_slug` | text, null | Their team, matching `docs/students`. Null until assigned. |
| `is_active` | boolean | Revoke without deleting. Checked on every request. |
| `created_at` | timestamptz | |

**`display_name` is the only thing here that describes a child**, and the
teacher chose it. No email, no real name required, no field a student can type
about themselves. That is what makes this defensible and it is worth not
eroding later.

**`is_active` is the revoke.** The session is a signed cookie rather than a row,
so there is nothing to delete; instead every request re-reads the member and a
deactivated one stops working immediately, on every device at once.

### `chat_channels`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `period` | text | |
| `name` | text | "Period 2", or the team name |
| `kind` | text | `period` or `team` |
| `team_slug` | text, null | Set when `kind` is `team` |
| `is_open` | boolean | The switch. Closed means read only. |
| `sort_order` | integer | |
| `created_at` | timestamptz | |

**`is_open` is per channel rather than global** so a period can be closed for
the evening while the teacher is still tidying up, and so one team's channel can
be frozen without silencing the class.

### `chat_messages`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `channel_id` | uuid | references `chat_channels` |
| `member_id` | uuid | references `chat_members` |
| `body` | text | Plain text. Links are found when rendering, not stored apart. |
| `hidden_at` | timestamptz, null | Soft delete. Null means visible. |
| `hidden_by` | uuid, null | Which member hid it |
| `created_at` | timestamptz | Set by the server, never sent by the client |

**`member_id` rather than a copied name.** The opposite of the choice House
Points made, and for the opposite reason: there, storing the house's name kept a
new idea out of a beginner's way. Here a rename has to follow the person, and
the teacher will rename somebody.

**Hidden rather than deleted**, and the teacher's view shows hidden messages
struck through rather than gone. What was said is often the thing that needs
discussing.

### `chat_reports`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `message_id` | uuid | |
| `reported_by` | uuid | member |
| `reason` | text | Optional, short |
| `resolved_at` | timestamptz, null | |
| `created_at` | timestamptz | |

Reporting does not hide anything by itself. A report is a request for a person
to look, and letting a report hide a message hands every student a mute button
pointed at everybody else.

### `chat_attachments` (phase two)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `message_id` | uuid | |
| `path` | text | Inside a private `chat-media` bucket |
| `kind` | text | `image` or `pdf`. Nothing else. |
| `bytes` | integer | |

Not in the first build. Text and links cover sharing a prototype, a Figma or a
source, which is most of what this is for, and images are where it goes wrong.
When it does land, every upload appears in the teacher's view with a delete, and
the allowed types stay exactly those two.

---

## The join code flow

### Making the roster

1. The teacher opens the roster page, picks a period, and types display names.
2. Each row gets a generated `join_code`.
3. A printable sheet: one line per student, name and code, cut into strips.

**Code format: six characters from `23456789ABCDEFGHJKMNPQRSTUVWXYZ`.** No
zero, O, one, I or L, because those are read wrong off a board by everybody and
especially by somebody in a hurry. Thirty one symbols to the sixth is about
900 million, so with a hundred live codes a guess lands roughly once in nine
million attempts. Rate limit the join endpoint anyway, at something like five
tries a minute per address, and it stops being worth anybody's afternoon.

### Joining

1. Student opens `/chat` and types their code.
2. Server finds an **active** member with that code. No match, no reason given
   beyond "that code did not work".
3. Server sets a signed cookie: an HMAC of the member id keyed by a
   `CHAT_SECRET`. Same shape as the showcase admin cookie, so a cookie cannot be
   forged and nothing new has to be stored.
4. **The cookie lasts a school day.** This is a real trade-off and the short
   side is the right one: school devices get shared and carted, and a cookie
   that lasts a month means the next child to open that Chromebook is posting as
   the last one. Eight hours costs a re-entry each morning.
5. Every screen shows **"You are posting as Ada B."** above the message box,
   with a sign out next to it. That line is doing more work than the cookie
   length is: you cannot post without seeing who you are posting as.

### Posting

On every message the server checks, in this order:

1. The cookie is valid and names a member.
2. That member is `is_active`.
3. The channel is `is_open`.
4. The member may see this channel.
5. Rate limit.

**The visibility rule, in one line:** a member can see a channel when
`channel.period == member.period`, and when the channel is a team channel, also
`channel.team_slug == member.team_slug`. A teacher sees every channel in their
periods. That is the whole permission system and it should stay that small.

### Losing a code, and sharing one

A code is reusable, because a student who clears their cookies has to get back
in. Which means a code passed to a friend lets the friend post as them.

The mitigations are the boring ones and they are enough for a classroom:
`is_active` kills a code instantly, regenerating one is a button, and the
display name is on every message so impersonation is visible to thirty people
at once. **Do not build device binding for this.** It fails on shared
Chromebooks, which is exactly the situation it is supposed to help.

---

## What the teacher sees

**Build this first, before any channel page.** It is what makes the rest safe to
switch on.

One page: every message from every channel in the teacher's periods, newest
first. Each row shows the channel, the display name, the time, the body, and a
hide button. Hidden messages stay in the list, struck through. Reports float to
the top.

Also on it: the open and closed switches, and the roster with regenerate and
deactivate.

The point is that the teacher never has to visit nineteen channels to know what
is happening in them. If that stops being true, the feature has outgrown its
supervision and something has to give.

---

## Deliberately not built

- **Direct messages.** Ever. Two students who need to talk privately are in a
  room together.
- **Editing.** Hidden and reposted is honest; edited is not.
- **Threads, presence, typing indicators, notifications.** All of it is polish
  on a thing whose job is a class period.
- **Reactions.** Harmless, genuinely liked by this age group, and still phase
  three. It is another table and another moderation surface.

## Polling, not realtime

Every three to five seconds, fetching messages newer than the last id held. For
thirty people in a room this is indistinguishable from live, and it is a
fraction of the moving parts. Supabase Realtime can go in later without the data
model changing, which is the test of whether the model is right.

---

## A note on what this is next to

Strive Fitness wrote a chatroom story with a moderator, and one of their
acceptance criteria is *"When I said some inappropriate things, Then I got
blocked."* CTOS has in app messaging. Both teams are writing stories about the
thing described above.

**That is worth using.** Once it runs, the teams who wrote those stories can put
their story next to a working build of it and ask what their criteria missed.
Nothing else in this course gives them that, and it costs nothing extra: the
build already has to happen.

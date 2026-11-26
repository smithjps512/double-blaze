# Welcome to Joe's: Product Brief

Client brief drafted by Double Blaze from two days of discovery working inside
the restaurant and interviews with the servers, line cook, and manager, then
reviewed and edited by James. This is the source of record for what the client
asked for and how the diner works today. Items marked **(Proposed)** are Double
Blaze suggestions for the client to confirm. Scope decisions, sequencing, the
data model, and anything Double Blaze decided live in `build-plan.md`.

**Working name: Welcome to Joe's.** The hosting, seating, and serving app for
Joe's Diner.

No em dashes anywhere in this document or any copy it generates.

---

## Purpose

Give Joe's Diner a simple digital host. It greets guests, keeps a fair and
visible waitlist, predicts when a seat will open, assigns servers evenly, tells
servers when food is ready, and knows when a table is clean and ready for the
next party.

This is the first module of a larger plan to automate the whole diner over
time (ordering, financials, supply management, and more). The first build must
be able to pass its data to the modules that follow.

## The problem

Joe's is a small, busy diner where **table turns are everything**. Today the
front of house runs on memory, a clipboard, and a bell.

- **There is usually no host.** Whoever sees a guest seats them, and that does
  not always go well. Parties get missed, seated out of order, or seated in a
  way that wastes seats.
- **The waitlist is in people's heads.** Guests waiting inside (a small area)
  or outside cannot see where they stand or how long the wait is.
- **Server fairness is a paper sheet.** It works, but it depends on someone
  remembering to write it down and then remembering to tell the server they
  have a new table.
- **The food-ready bell is hard to hear.** Servers keep walking back to the
  pass to check for their food, which costs steps and time on every ticket.
- **No one knows a table is ready until someone looks.** Clean tables can sit
  empty while guests wait.
- **Tables do not always get bused quickly.** Bussing right after guests leave
  is critical. A dirty, empty booth looks bad, and guests may see it as a
  place they can sit as soon as it is wiped down.

The servers and the manager asked for three things specifically: **hosting,
wait times, and "table is ready."**

## How it works today

1. **A guest arrives.** Whoever is free greets them. On the busiest days only,
   there is a dedicated host.
2. **The guest waits** inside or outside. There is no list that guests can see.
   Staff do not seat a party until the **entire party is present**.
3. **The party is seated** at a table or at the bar. Some guests take bar
   seats, even in groups, to sit as fast as possible. Others want a table. It
   is the guest's choice.
4. **The server is assigned using the clipboard** (see "Server rotation" below).
   Whoever seats the party writes it down and, if it is not their own table,
   tells the server (if they remember).
5. **The server takes the order** on the existing ordering device. The device
   prints a ticket in the kitchen. **Tickets carry the table number.**
6. **The line cook prepares and plates the food** and sets it at the pass, then
   rings a physical bell.
7. **The server picks up the food** and delivers it. Food rarely waits long
   once a server knows it is ready. The problem is knowing.
8. **The guests leave. The server buses the table.** There is no busser. The
   table is ready when the server has cleaned it.

To-go orders come through DoorDash and Grubhub and stay as they are.

## The space

| Area | Seats | Notes |
| :---- | :---- | :---- |
| Tables 101 to 110 | Mostly 4-person booths | Two tables seat up to 7, the largest party at one table. *Add per-table capacity.* |
| Bar seats bar1 to bar9 | 9 single seats in a row | Shared by all servers; there is no bar server. |
| Waiting area | Small | Many guests wait outside. Shops are nearby. |
| Front counter | Room to secure a tablet | Location for guest check-in. |
| Behind the bar | Where the clipboard lives today | Natural home for the staff screen. |
| The pass | Where the line cook sets finished food | Where the bell is today. |

*Attach: photo of the space, floor sketch with table numbers.*

## Who will use it

| User | What they need |
| :---- | :---- |
| **Guests** | See the wait before checking in, check in quickly at the counter or from their phone, choose bar or table, see an honest wait, browse the menu while waiting, and know when they are being seated. |
| **Servers** | Know immediately when they have a new table and when their food is ready, without carrying a second device. Trust that tables are shared fairly. Mark a table ready after bussing in seconds. |
| **Whoever is seating** (usually a server, sometimes a dedicated host) | See who is next, what is open, and where to put them, in about 5 seconds, often with full hands. |
| **Line cook** | Signal "food ready" for a table with one tap instead of ringing a bell. |
| **Cooks** | A sense of how much order volume to expect over the next stretch of time. Informational only, but they do ask. |
| **Manager / owner** | See the floor, the waitlist, and how the shift is going. Keep the rules fair and consistent. |

## What the app does (first build)

| Feature | Description | Benefit |
| :---- | :---- | :---- |
| **Wait before check-in** | Anyone can see the current estimated wait, for table and for bar, **before** checking in: on the counter tablet's start screen and on the QR code page. | Guests decide with honest information; many will choose the bar on their own. |
| **Guest check-in** | A tablet secured to the front counter (not a full kiosk), **and a QR code** at the door that opens the same check-in on the guest's own phone, from inside or just outside. The guest enters a name, party size, and seating choice: **Table only**, **Bar is fine**, or **First available**, plus an optional phone number for texts. Before they finish, the screen says plainly: **the whole party must be here to be seated, and please stay close.** | Every guest is on the list the moment they arrive, even with no host. A first step toward a Joe's "get in line" feature. |
| **Wait time** | After check-in the guest sees their own estimated wait, based on their seating choice and party size. Like a barber shop where "first available" is faster than asking for a specific stylist, **Bar is fine** and **First available** usually mean a shorter wait. | Honest expectations; a reason to say yes to the bar, which speeds up turns. |
| **Check-in text** | If the guest gave a phone number, they get a text confirming check-in with their estimated wait, a **link to the menu**, and a friendly reminder that the whole party needs to be here and to stay close. | The guest has something to do while waiting, and ordering goes faster once seated. |
| **"You're next" text** | A few minutes before a table is expected to open: "You're next, head back now," with the short hold rule. **(Proposed)** | Guests who step into nearby shops are back before the table is ready. |
| **Waitlist and "Now seating"** | The check-in screen shows who is being seated now and each waiting party's estimated wait. It does **not** promise a strict first-come order, because a large party waiting for one of the two big tables, or a party that chose the bar, may be seated before or after others. The screen says so in a friendly line. What it shows must always be accurate. | Guests waiting inside can see where they stand without feeling skipped. |
| **Staff screen** | One tablet behind the bar, where the clipboard is today. Shows the waitlist, all 19 seats (101 to 110, bar1 to bar9) with their status, and the server rotation. Seating a party takes two taps: the party, then the table or seats. | The app becomes the host. Anyone can seat a party correctly. |
| **Seating suggestions** | When a table or bar seats open, the app suggests the first party in line whose choice and size fit. A party that wants a table only is skipped for bar seats, and keeps its place in line. | Fair order, fewer missed parties, faster seating. |
| **Server rotation** | Replaces the clipboard, with the same rule (see "Server rotation"). The app picks the server and **alerts that server** that they have a new table. | Fairness without paperwork; no more "I forgot to tell you." |
| **Table tablets** | A tablet at each table (101 to 110). When a party is seated, it shows **their name and a friendly welcome** ("We're glad you're here"). The server marks the table ready on it after bussing, and it clears for the next party. It can also show the menu. | A warm welcome, a clear signal that a table is taken, and the place to mark it ready. |
| **Digital bell** | A tablet at the pass shows all 19 seats. The line cook taps the table number when food is ready. A distinct chime plays in the serving area, and a monitor facing staff shows the table with a running timer. | Servers stop walking back to check. Food goes out hotter and faster. |
| **Coming up for the kitchen** | The kitchen tablet shows a simple view of what is coming: guests seated in the last 15 to 30 minutes and guests waiting. Informational only. **(Proposed)** | Cooks can see a rush building before the tickets arrive. |
| **Table ready** | After bussing, the server marks the table ready with a simple tap and a personal code. The table goes back into the open seats, and the next party is suggested. | No more clean tables sitting empty while guests wait. |
| **Thank-you text** | After a visit, guests who gave a phone number and agreed to it get a short "Thanks for dining at Joe's" text with a link to leave a review (see "Text messages"). | More reviews for a small local diner; the first touch of a future loyalty module. |
| **Activity record** | Every step (arrived, seated, server assigned, food ready, table ready, and so on) is recorded with the time and who did it. | Powers wait estimates, shift summaries, and every future module. |

## Rules the app follows

### Server rotation (the clipboard rule)

Today a paper sheet behind the bar has a column for each server on shift (up
to three). When a party is seated, the person seating it writes the table or
bar seat and the server's **new running total of guests** in that server's
column. The next party goes to the server with the **lowest running total**.
Counting guests rather than tables keeps things even when a server takes a
large party. Bar seating is shared the same way.

*Example:* Server 1 has 24 guests, Server 2 has 22, Server 3 has 24. The next
party goes to Server 2.

The app keeps this rule exactly:

- **Lowest total gets the next party.** Who gets the first party of the shift
  does not matter.
- **Ties:** the server who was seated longest ago gets the party. **(Proposed)**
- **Starting mid-shift or at a shift change:** the new server starts **tied
  with the current lowest total**, so they do not get every table until they
  catch up. The app keeps the real number of guests served separately from
  this starting number, so later reporting stays accurate.
- **Pause:** a server can pause their place in the rotation (a break, or when
  swamped). This is rare; servers work for tips and want to be on the floor.
- **Override:** whoever is seating can choose a different server (a regular
  asking for someone, for example). An override still counts toward that
  server's total.
- **Leaving the shift:** a server who is cut leaves the rotation. Their count
  stays on the record.

*Attach: photo of the clipboard sheet.*

### Seating

- **The entire party must be present** before it is seated. Guests are told
  this **before** they check in and reminded **after** check-in (on screen and
  in the check-in text).
- **Stay close.** Guests are told before and after check-in, in a friendly
  way, that the hold is short and they should stay close.
- **Bar groups need seats next to each other.** A party of 3 needs 3 seats in
  a row. The app suggests bar seats that keep open seats together, so a party
  of 2 does not sit in the middle of 4 open seats and leave single seats on
  each side. Today the servers try to manage this and sometimes miss it.
- **Parties larger than 7:** staff ask the party and explain they would be
  split across tables. This is rare. The app lets staff seat one party across
  more than one table.
- **Called but not here:** when a party is called and does not come, the hold
  is **short, under a minute**. Then the next party is seated. The party that
  was not ready stays near the top of the list. **(Proposed: confirm how far
  they move.)**

### Bussing and table ready

- **Guests left (Proposed):** when a party leaves, the server taps **"Guests
  left"** on the table tablet (one tap, no code). The table tablet then shows
  "Getting this table ready for you, please check in at the front," and the
  staff screen shows the table as **needs bussing** with a timer that turns
  amber after a few minutes.
- **Table ready:** after bussing, the server taps **Ready** and enters their
  code. The table tablet clears, and the table returns to the open seats.
- This addresses the dirty-table problem: no one sits at an uncleared table,
  and an empty, dirty table cannot go unnoticed for long.
- **Bar seats** have no tablets. They are marked "guests left" and "ready" on
  the staff tablet behind the bar.

### Food ready

- The line cook taps the table number once per ticket that is ready. A table
  can have more than one ticket (refills, desserts).
- The chime should be distinct and loud enough for the serving area.
- The ready tile shows a running timer and turns amber if food waits more than
  about 2 minutes. **(Proposed)**
- **Escalating chime:** if food waits more than about 2 minutes, a second,
  different tone plays. Distinct, but not rude.
- The tile clears when the cook taps it again after pickup, or on its own after
  a set time. **(Client to choose.)**
- **The physical bell stays as a backup** in case the network drops.
  **(Proposed)**
- **Guests do not see "food ready" in the first build.** Food rarely waits, but
  a guest watching their plate sit in the window would turn a short delay into
  a visible complaint. A softer guest-facing status ("Your order is being
  prepared") can come later. **(Proposed)**

### Text messages

Texts are now part of the first build: check-in confirmation with the menu
link, "you're next," and the thank-you with a review link.

- **Optional.** Guests can check in without a phone number. They will not get
  texts.
- **Guests must come right away.** Turns are everything, and the diner cannot
  hold a table while someone finishes shopping. That is why the alert is
  "You're next, head back now" a few minutes before the table is expected,
  rather than "Your table is ready." **(Proposed)**
- **Consent in plain words** at check-in, covering both the wait updates and
  the thank-you, for example: "Text me wait updates and a thank-you after my
  visit." Every text honors STOP. *Joe's to confirm the exact wording with
  whoever handles their legal questions.*
- **Carrier registration** of the sending number is required before texts can
  go out. It can take days to weeks, so it starts early (see "How it
  launches").

**Thank-you and review text:**

- Sent after the table is marked ready, with a short delay (about 30 to 60
  minutes, set by Joe's) so it arrives after the guest is home.
- One text per party, to the number given at check-in.
- **Not too often for regulars:** at most one review text per phone number
  every 60 to 90 days (set by Joe's). **(Proposed)**
- **Everyone gets the same review link.** The app does not ask "Were you
  happy?" and send only happy guests to Google. Google's policy and the FTC
  rule on consumer reviews do not allow that. If Joe's also wants private
  feedback, it is offered to everyone alongside the review link.

## Devices

Servers already carry the ordering device and should not carry a second one.

| Device | Where | Purpose |
| :---- | :---- | :---- |
| Check-in tablet | Front counter, secured | Wait before check-in, guest check-in, "Now seating" |
| QR code | At the door and the counter | Check in from the guest's own phone |
| Staff tablet | Behind the bar (the clipboard spot) | Waitlist, floor, rotation, seat a party, bar seats left and ready, pause a server |
| Table tablets (10) | One at each table, 101 to 110 | Welcome the seated party by name, "guests left," mark the table ready, show the menu |
| Kitchen tablet | At the pass | Line cook taps "food ready"; coming-up view |
| Monitor and speaker | Serving area, facing staff | Digital bell: chime, escalating chime, ready tables with timers |

**Table tablets: decided.** One at every table. They need charging, spill
protection, and a secure mount. Later they become the home for guest features
at the table, such as order status.

**Server code (Proposed):** each server has a short personal code (for example
4 digits) used to mark a table ready, pause, or accept an override. It tells
the app who did what without anyone carrying a device.

**Ordering device:** the diner keeps its current ordering device; replacing it
would be too disruptive for servers. *To find out: the make and software of
the device, and whether it has an API.* If it does, "food ready," "guests
left" (when the check closes), and the order for each table could come
straight from it later. The first build does not depend on it.

## Scope

| First build (must have) | Nice to have | Later modules |
| :---- | :---- | :---- |
| Guest check-in on the counter tablet and by QR code | Menu rebuilt into one QR hub with check-in | Ordering device integration |
| Wait shown before and after check-in, table and bar | Guest-facing order status | Financials, tips, and labor |
| Texts: check-in with menu link, "you're next," thank-you with review link | Manager dashboard | Supply and inventory |
| Staff screen: floor, waitlist, seating | Private feedback alongside the review link | DoorDash and Grubhub orders |
| Server rotation with alerts to the server | | Loyalty and marketing |
| Table tablets: welcome by name, guests left, table ready | | |
| Digital bell (kitchen tablet, monitor, chime, escalating chime) | | |
| Coming-up view for the kitchen | | |
| Activity record of every step | | |

**Not in the first build:** taking orders, payments, menu changes, to-go and
delivery orders, reservations, and inventory. The menu link points to Joe's
existing online menu.

## Built to grow

This module is the foundation for the rest of the diner. To make sure later
modules can use its data:

- **Shared basics, owned by no single module:** the diner and its seats
  (tables and bar seats), staff and their roles, shifts, guests and parties,
  each visit (one party's stay from arrival to leaving), and tickets.
- **Every step is recorded as it happens**, with the time and who did it:
  checked in, quoted a wait, texted, called, seated, server assigned, server
  paused, food ready, food picked up, guests left, table ready, did not show,
  left the list.
- **What later modules will want from this one:**

| Later module | Data it will use from the first build |
| :---- | :---- |
| Financials, tips, and labor | Guests served per server per shift, shift start and end, who bused which table |
| Supply and inventory | Guests per hour and per day, busy periods |
| Ordering integration | Table numbers and visits, so each order joins the right party |
| Loyalty and marketing | Guest contact details with consent, visit history, review texts sent and clicked |
| Kitchen performance | Time from seating to food ready, number of tickets per table |

Joe's data is kept separate from every other Double Blaze client's data.

## What is critical to quality

- **Fast with full hands.** Any staff action takes a tap or two and about 5
  seconds.
- **Works without a host.** On a normal day, whoever is closest can run the
  front door correctly from the staff screen.
- **The same fairness everyone already trusts.** The rotation follows the
  clipboard rule exactly. No surprises for servers.
- **Honest with guests.** Wait times and the waitlist are always accurate, and
  the rules (whole party, stay close) are clear before and after check-in.
- **Nothing extra to carry.** Servers keep only the ordering device.
- **No change to ordering.** The current ordering device and kitchen ticket
  stay as they are.
- **Simple for guests.** No app download and no account to check in.
- **Keeps working.** If the network drops, the diner can fall back to the bell
  and the clipboard without losing the day.

## How we will measure success

Capture today's numbers during the pilot before switching over. *Baselines
from discovery to be added.*

| Measure | Today | Goal |
| :---- | :---- | :---- |
| Time from a table being ready to the next party being seated | | |
| Time from guests leaving to the table being ready | Not measured | |
| How close wait estimates are to the actual wait | Not measured | |
| Parties that leave before being seated | | |
| Difference in guests served between servers at the end of a shift | | |
| Server trips to the pass to check for food | | |
| Google reviews per month | | |

## How it launches (Proposed)

1. Start carrier registration for the texting number as soon as the brief is
   approved, since it can take days to weeks.
2. Run the app alongside the clipboard and bell during slower shifts for one
   to two weeks.
3. Use it on its own, then use it on the busiest days.

## Open items

- [ ] Make, software, and API availability of the ordering device
- [ ] Seats per table for 101 to 110; which two tables seat 7
- [ ] How the food-ready tile clears: cook taps, or on its own after a set time
- [ ] Where a party that missed its call goes in the list
- [ ] Text consent wording, confirmed by Joe's
- [ ] Review link (Joe's Google Business Profile) and the thank-you delay and frequency
- [ ] Link to Joe's existing online menu
- [ ] Photos: the clipboard sheet, the front counter, the pass, the floor
- [ ] Baselines for the success measures

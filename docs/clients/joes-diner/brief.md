# Joe's Diner: Hosting, Seating, and Serving App: Product Brief

Client brief drafted by Double Blaze from two days of discovery working inside
the restaurant and interviews with the servers, line cook, and manager. This is
the source of record for what the client asked for and how the diner works
today. Items marked **(Proposed)** are Double Blaze suggestions for the client
to confirm. Scope decisions, sequencing, the data model, and anything Double
Blaze decided live in `build-plan.md`.

The app needs a working name. Until it has one, this brief calls it "the app".

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
| **Guests** | Check in quickly when they walk in, choose bar or table, see their place in line and an honest wait, and know when they are being seated. |
| **Servers** | Know immediately when they have a new table and when their food is ready, without carrying a second device. Trust that tables are shared fairly. Mark a table ready after bussing in seconds. |
| **Whoever is seating** (usually a server, sometimes a dedicated host) | See who is next, what is open, and where to put them, in about 5 seconds, often with full hands. |
| **Line cook** | Signal "food ready" for a table with one tap instead of ringing a bell. |
| **Manager / owner** | See the floor, the waitlist, and how the shift is going. Keep the rules fair and consistent. |

## What the app does (first build)

| Feature | Description | Benefit |
| :---- | :---- | :---- |
| **Guest check-in** | A tablet secured to the front counter (not a full kiosk). The guest enters a name, party size, and seating choice: **Table only**, **Bar is fine**, or **First available**. Phone number optional (see "Text messages"). | Every guest is on the list the moment they walk in, even with no host. |
| **Wait time** | At check-in the guest sees their estimated wait, **shown separately for table and bar** when both apply (for example "Table about 20 min, Bar about 5 min"). **(Proposed)** | Honest expectations; many guests will choose the bar on their own, which speeds up turns. |
| **Waitlist and "Now seating"** | The check-in screen shows the waitlist in order and who is being seated now. Staff also call the name. | Guests waiting inside can see where they stand. |
| **Staff screen** | One tablet behind the bar, where the clipboard is today. Shows the waitlist, all 19 seats (101 to 110, bar1 to bar9) with their status, and the server rotation. Seating a party takes two taps: the party, then the table or seats. | The app becomes the host. Anyone can seat a party correctly. |
| **Seating suggestions** | When a table or bar seats open, the app suggests the first party in line whose choice and size fit. A party that wants a table only is skipped for bar seats, and keeps its place in line. | Fair order, fewer missed parties, faster seating. |
| **Server rotation** | Replaces the clipboard, with the same rule (see "Server rotation"). The app picks the server and **alerts that server** that they have a new table. | Fairness without paperwork; no more "I forgot to tell you." |
| **Digital bell** | A tablet at the pass shows all 19 seats. The line cook taps the table number when food is ready. A distinct chime plays in the serving area, and a monitor facing staff shows the table with a running timer. | Servers stop walking back to check. Food goes out hotter and faster. |
| **Table ready** | After bussing, the server marks the table ready with a simple tap and a personal code (see "Devices"). The table goes back into the open seats, and the next party is suggested. | No more clean tables sitting empty while guests wait. |
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

- **The entire party must be present** before it is seated.
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

### Food ready

- The line cook taps the table number once per ticket that is ready. A table
  can have more than one ticket (refills, desserts).
- The chime should be distinct and loud enough for the serving area.
- The ready tile shows a running timer and turns amber if food waits more than
  about 2 minutes. **(Proposed)**
- The tile clears when the cook taps it again after pickup, or on its own after
  a set time. **(Client to choose.)**
- **The physical bell stays as a backup** in case the network drops.
  **(Proposed)**
- **Guests do not see "food ready" in the first build.** Food rarely waits, but
  a guest watching their plate sit in the window would turn a short delay into
  a visible complaint. A softer guest-facing status ("Your order is being
  prepared") can come later. **(Proposed)**

## Devices

Servers already carry the ordering device and should not carry a second one.

| Device | Where | Purpose |
| :---- | :---- | :---- |
| Check-in tablet | Front counter, secured | Guest check-in, wait times, "Now seating" |
| Staff tablet | Behind the bar (the clipboard spot) | Waitlist, floor, rotation, seat a party, mark a table ready, pause a server |
| Kitchen tablet | At the pass | Line cook taps "food ready" |
| Monitor and speaker | Serving area, facing staff | Digital bell: chime and ready tables with timers |
| Table tablets **(open decision)** | One at each table, or fewer | Server marks the table ready after bussing. Could also show the menu, and later customer features such as order status. |

**Open decision: table tablets.** One at every table is the current leaning,
but possibly fewer. James is reviewing the space before deciding. The option
of fewer is shared staff screens (for example, one on a dining room wall in
addition to the one behind the bar) where the server taps the table and enters
their code. Trade-offs: a tablet at each table costs more and needs charging
and spill protection, but it becomes the home for future guest features at
the table.

**Server code (Proposed):** each server has a short personal code (for example
4 digits) used to mark a table ready, pause, or accept an override. It tells
the app who did what without anyone carrying a device.

**Ordering device:** the diner keeps its current ordering device; replacing it
would be too disruptive for servers. *To find out: the make and software of
the device, and whether it has an API.* If it does, "food ready" and the order
for each table could come straight from it later. The first build does not
depend on it.

## Scope

| First build (must have) | Nice to have | Later modules |
| :---- | :---- | :---- |
| Guest check-in on the counter tablet | Join the waitlist by QR code on your own phone | Ordering device integration |
| Waitlist with estimated wait, table and bar | Text messages to waiting guests | Financials, tips, and labor |
| Staff screen: floor, waitlist, seating | Menu QR code rebuilt into one QR hub with check-in | Supply and inventory |
| Server rotation with alerts to the server | Guest-facing order status | DoorDash and Grubhub orders |
| Digital bell (kitchen tablet, monitor, chime) | Manager dashboard | Loyalty and marketing |
| Table ready after bussing | | |
| Activity record of every step | | |

**Not in the first build:** taking orders, payments, menu changes, to-go and
delivery orders, reservations, and inventory.

### Text messages (nice to have)

Guests would love texts because there are shops nearby, but at Joe's **guests
must come right away**. Turns are everything, and the diner cannot hold a
table while someone finishes shopping.

**(Proposed)** When texts are added, send **"You're next, head back now"** a
few minutes before a table is expected to open, instead of "Your table is
ready." Include the hold rule in the message. Texts require the guest's
consent and carrier registration of the sending number.

So texts can be switched on later without rework, the first build already asks
for an optional phone number with consent at check-in and records when each
party was called, seated, or did not show.

## Built to grow

This module is the foundation for the rest of the diner. To make sure later
modules can use its data:

- **Shared basics, owned by no single module:** the diner and its seats
  (tables and bar seats), staff and their roles, shifts, guests and parties,
  each visit (one party's stay from arrival to leaving), and tickets.
- **Every step is recorded as it happens**, with the time and who did it:
  checked in, quoted a wait, called, seated, server assigned, server paused,
  food ready, food picked up, table ready, did not show, left the list.
- **What later modules will want from this one:**

| Later module | Data it will use from the first build |
| :---- | :---- |
| Financials, tips, and labor | Guests served per server per shift, shift start and end, who bused which table |
| Supply and inventory | Guests per hour and per day, busy periods |
| Ordering integration | Table numbers and visits, so each order joins the right party |
| Loyalty and marketing | Guest contact details with consent, visit history |
| Kitchen performance | Time from seating to food ready, number of tickets per table |

Joe's data is kept separate from every other Double Blaze client's data.

## What is critical to quality

- **Fast with full hands.** Any staff action takes a tap or two and about 5
  seconds.
- **Works without a host.** On a normal day, whoever is closest can run the
  front door correctly from the staff screen.
- **The same fairness everyone already trusts.** The rotation follows the
  clipboard rule exactly. No surprises for servers.
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
| How close wait estimates are to the actual wait | Not measured | |
| Parties that leave before being seated | | |
| Difference in guests served between servers at the end of a shift | | |
| Server trips to the pass to check for food | | |

## How it launches (Proposed)

Run the app alongside the clipboard and bell during slower shifts for one to
two weeks, then use it on its own, then use it on the busiest days.

## Open items

- [ ] Make, software, and API availability of the ordering device
- [ ] Table tablets: one per table or shared staff screens
- [ ] Seats per table for 101 to 110; which two tables seat 7
- [ ] How the food-ready tile clears: cook taps, or on its own after a set time
- [ ] Where a party that missed its call goes in the list
- [ ] Photos: the clipboard sheet, the front counter, the pass, the floor
- [ ] Baselines for the success measures
- [ ] A name for the app

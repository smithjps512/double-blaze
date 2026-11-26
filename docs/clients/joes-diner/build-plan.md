# Welcome to Joe's: Build Plan

How the brief in [`brief.md`](./brief.md) gets built. The brief holds what the
client asked for and how the diner works; this document holds Double Blaze's
decisions. Where the build actually stands will live in `status.md`.

No em dashes anywhere in this document or any copy it generates.

---

## 1. What this actually is

A small real-time system for one diner: 19 seats (tables 101 to 110, bar1 to
bar9), up to three servers, one line cook, open **8 am to 2 pm, Wednesday to
Sunday**. About 15 screens all looking at the same live picture of the floor,
plus text messages to guests.

**The core loop is a visit:** a party checks in, waits, is seated with a
server, gets its food, leaves, and the table is reset. Every screen is a
different view of that one loop, and every step is recorded as an event. That
event record is what later modules (ordering, financials, supply) build on.

## 2. Decisions

| Decision | Why |
| :---- | :---- |
| **Lives in this monorepo as `apps/joes-diner`.** | Same stack as Find Me: Next.js, TypeScript, Tailwind, Supabase with row-level security, Vercel. Its own deploy and domain. |
| **Web app on every screen, locked with a kiosk browser.** | No app store, one codebase, any Android tablet works. The kiosk browser keeps each tablet on its one screen, reopens it after a restart, and allows the chime to play without a tap. |
| **Live updates through Supabase Realtime.** | When anyone seats a party or the cook taps a table, every screen updates within a second. No polling, no separate server. |
| **Every action is one database function that also writes the event.** | `seat_party`, `mark_food_ready`, `mark_table_ready`, and so on each change the current state and append the event in one transaction. The record can never disagree with the floor, and screens cannot skip a step. |
| **The event log is append-only.** | Nothing edits or deletes history. A mistake is fixed by a correcting event ("seating undone"), so reports stay honest. |
| **Tablets are paired devices, not user logins.** | A manager pairs each tablet once ("This tablet is Table 104", "Kitchen", "Check-in"). The tablet holds a long-lived device token with only that screen's permissions. No one signs in during service. |
| **Server codes are for accountability, not security.** | A 4-digit code says who marked a table ready or paused. Codes are stored hashed and rate-limited. Real admin actions (adding staff, pairing tablets) need the manager's sign-in. |
| **Guests have no accounts.** | Check-in creates a party with a private link (`/p/<token>`) for its status page. The text messages carry that link. |
| **Rules live in small, tested files.** | Rotation, seating suggestions, bar seat choice, and wait estimates are plain functions with unit tests, separate from screens, so Joe's can ask for a rule change without risk to the rest. |
| **Texts through Twilio, toll-free number with verification.** | At a diner's volume (likely under a few hundred texts a day), a verified toll-free number is simpler to register than a local 10DLC number and is approved for this kind of service text. Revisit if Joe's wants a local area code. |
| **No offline writes in the first build.** | Keeping 15 screens consistent offline is a large project. Instead, every screen shows a clear "offline" banner, and the staff screen shows the last known rotation totals so the clipboard can take over. The physical bell stays. |

## 3. Screens

| Screen | Device | What it shows and does |
| :---- | :---- | :---- |
| **Check-in** | Counter tablet | Start: Joe's logo, current table and bar waits, "Now seating," a big **Check in** button. Flow: name, party size, seating choice, optional phone with consent, then the rules (whole party, stay close) and a confirmation with their estimated wait. Resets itself after 20 seconds. |
| **Guest phone** | Guest's phone (QR code or text link) | The same check-in flow, then a status page: place, estimated wait, the rules, menu link, "Leave the list" button. |
| **Staff** | Tablet behind the bar | Left: the waitlist, with a suggested seat for each party when one fits. Center: the floor, 19 tiles colored by state (open, seated, food ready, needs bussing, ready). Right: the rotation, each server's total, next up, pause. **Seat a party: tap the party, tap the seats, done.** Also: call a party (starts the hold timer), add a walk-in without the counter tablet, mark bar seats left and ready, open and close the day. |
| **Table** | Tablet at each table | Open: Joe's logo and the menu. Seated: "Welcome, Smith party! We're glad you're here." Buttons for staff: **Guests left** (pilot) and **Ready** (with code). Needs bussing: "Getting this table ready for you, please check in at the front." |
| **Kitchen** | Tablet at the pass | 19 big tiles. Tap a table: food ready. Tap again: picked up. Top strip: coming up (guests seated in the last 15 and 30 minutes, guests waiting). |
| **Bell** | Monitor and speaker, serving area | Ready tables as large tiles with timers. Chime on ready; a second, different tone after 2 minutes; tile turns amber. Nothing else on screen. |
| **Manager** | Manager's phone or any browser | Staff list and codes, pair tablets, seat capacities, settings (hold time, chime times, thank-you delay and frequency, review link, menu link), and a simple **Today** report for the pilot. |

## 4. Rules

### Server rotation

Each server on a shift has an **offset** (the virtual starting number) and an
**actual** count of guests seated with them. Rotation uses `offset + actual`.

- **Next up:** the lowest total among servers who are on and not paused.
- **Tie:** the server whose last seating was longest ago. A server with no
  seating yet counts from the time they joined.
- **Join mid-shift:** offset is set to the current lowest total among active
  servers. Actual starts at 0.
- **Pause:** excluded from next up. When they unpause, their total is
  unchanged.
- **Override:** the person seating picks another server. Counts the same as a
  normal seating, and the event records that it was an override.
- **Undo a seating:** a correcting event removes the guests from the count.
- **Reports use actual only.** Offsets exist only for fairness.

### Seating suggestions

When seats open, the app scans the waitlist in check-in order and suggests the
first party that fits:

- **Choice:** Table only parties get tables; Bar is fine parties get bar seats
  or tables; First available gets whichever opens first.
- **Size:** the smallest table that fits. A party of 2 is not suggested for a
  7-seat table while a party of 5 or more is waiting, unless no other table is
  expected to open soon. (Setting, default on.)
- **Whole party present:** each party has a "here" check. A party that is not
  all here is passed over without losing its place.
- **Called but not here:** calling a party starts a 60-second hold on the
  staff screen. When it runs out, staff tap **Skip** and the party moves to
  second in line. (Default; open item in the brief.)
- Suggestions are suggestions. Staff can seat anyone anywhere.

### Bar seats next to each other

For a bar party of N, the app looks at runs of open seats in a row and
suggests N seats that:

1. fit in one run (required),
2. fill a run exactly if one exists,
3. otherwise sit at the end of a run, so the remaining open seats stay
   together.

Example: seats 3 to 6 open, party of 2: suggest 3 and 4 (or 5 and 6), never 4
and 5.

### Wait estimates

Estimates are honest ranges rounded to 5 minutes ("about 15 to 20 minutes"),
shown separately for table and bar.

- **How:** for each seated table, expect it to free up at
  `seated time + typical turn + typical reset`. Walk the waitlist ahead of the
  new party in order, giving each party the first expected opening that fits
  its choice and size. The new party's wait is when the next fitting opening
  is left.
- **Typical turn** starts from discovery numbers (a default by party size,
  for example 35 minutes for 1 to 2 guests, 45 for 3 to 4, 55 for 5 to 7).
  Once there are 30 or more visits for a group, it switches to the median of
  real turns by **party size, weekday or weekend, and hour**.
- **Table turn time** (seated to table ready) is the measure the estimate
  learns from, so it works with or without the "guests left" pilot.
- Every quote is recorded, so the Today report shows how close estimates were.

### Food ready

- One tap per ticket. Tap again when picked up, or the tile clears on its own
  after a set time (setting; the brief leaves the choice to Joe's).
- Chime on ready. A second tone at 2 minutes, then the tile turns amber.
- Time measures use the **first** food ready of the visit.

## 5. Data model

All tables are prefixed `jd_` in the shared Supabase project and have
row-level security. Device tokens, the manager, and Double Blaze admins are
the only roles that can read them; guests reach their own party only through
server routes using the party token.

**Shared basics** (named for the diner, not this module, so later modules use
them directly):

- **jd_seats**: code (`101`, `bar3`), kind (`table`, `bar`), capacity, bar
  position (for adjacency), active.
- **jd_staff**: name, role (`server`, `cook`, `manager`), code hash, active.
- **jd_devices**: label, role (`checkin`, `staff`, `table`, `kitchen`,
  `bell`), seat (for table tablets), token hash, last seen.
- **jd_shifts**: business date, opened at, closed at, opened by.
- **jd_shift_servers**: shift, staff, joined at, left at, offset, actual
  guests, paused, last seated at.
- **jd_guests**: phone (optional), name, text consent (yes or no, wording
  version, time), review text last sent at. Phone numbers are matched only to
  respect the review-text frequency limit and for later loyalty.
- **jd_visits**: one party's stay. Guest, name shown, party size, seating
  choice, source (`counter`, `qr`, `staff`), status (`waiting`, `called`,
  `seated`, `left`, `done`, `no_show`, `left_list`), all here, quoted wait,
  checked in at, called at, seated at, server, first food ready at, guests
  left at, table ready at, party token.
- **jd_visit_seats**: visit, seat (a party can hold several tables or bar
  seats).
- **jd_tickets**: visit, seat, ready at, picked up at. (The ordering
  integration later attaches order details here.)
- **jd_events**: append-only. Type, occurred at, shift, visit, seat, staff,
  device, data (jsonb).
- **jd_messages**: visit, kind (`checkin`, `next_up`, `thank_you`), send at,
  sent at, Twilio id, status. Doubles as the send queue.
- **jd_settings**: one row of tunable values (hold seconds, chime times, turn
  defaults, thank-you delay and frequency, review link, menu link).

**Current state** (which seats are open, who is next) is kept in the tables
above for fast screens. **History** is the event log. Both are written by the
same function, so they always agree.

## 6. Events

Every one carries time, shift, and whichever of visit, seat, staff, and
device apply.

`checked_in`, `wait_quoted`, `marked_all_here`, `called`, `hold_expired`,
`skipped`, `seated`, `server_assigned` (with `override`), `seating_undone`,
`food_ready`, `food_picked_up`, `guests_left`, `table_ready`, `no_show`,
`left_list`, `server_joined`, `server_paused`, `server_resumed`,
`server_left`, `shift_opened`, `shift_closed`, `text_sent`,
`text_delivered`, `text_failed`, `opted_out`.

Later modules read these; they never write into this module's tables except
through their own functions.

## 7. Texts

| Text | Sent when | Content |
| :---- | :---- | :---- |
| Check-in | Right after check-in, if consented | Name, estimated wait, status link, menu link, "whole party needs to be here, please stay close." |
| You're next | When the estimate says a fitting seat opens in about 5 minutes, or staff call the party | "You're next at Joe's, head back now. We can hold your table for about a minute." |
| Thank-you | 30 to 60 minutes after table ready (setting), at most once per number per 60 to 90 days (setting) | "Thanks for having breakfast at Joe's!" with the review link. Same link for everyone. |

- Sent from a server route through Twilio, queued in `jd_messages`, and
  sent every minute by a scheduled job. Twilio reports delivery back to a
  webhook.
- STOP, HELP, and opt-out are handled by Twilio's opt-out handling, and
  recorded on the guest.
- Consent wording is versioned, so we know which words each guest agreed to.
- **Registration starts on day one** (toll-free verification needs the
  business details, the opt-in description, and sample messages; Double
  Blaze drafts the last two).

## 8. Devices and hardware

Planning for effective, relatively inexpensive hardware. Open 6 hours a day,
so a full overnight charge covers a day with screens dimming between uses.
Closed Monday and Tuesday, which are the days for installs and updates.

| Item | Qty | Suggested | Rough cost each |
| :---- | :---- | :---- | :---- |
| Table tablets | 10 | 8 to 9 inch Android tablet (Samsung Galaxy Tab A series or similar) | $120 to $160 |
| Counter, staff, and kitchen tablets | 3 | 11 inch Android tablet, same family | $180 to $240 |
| Kiosk browser license | 13 | One-time per device (for example Fully Kiosk Browser) | under $10 |
| Table stands | 10 | Weighted quick-release tabletop stand, drop in and lift out | $30 to $60 |
| Cases | 13 | Spill-resistant, wipeable (food service) | $20 to $40 |
| Counter, staff, kitchen mounts | 3 | Quick-release mount, plugged in all day | $50 to $100 |
| Charging station | 1 | Labeled multi-device station in the back | $60 to $120 |
| Bell monitor | 1 | 24 to 32 inch monitor or TV | $120 to $200 |
| Bell player and speaker | 1 | Streaming stick or mini PC running a browser, plus a small speaker | $60 to $150 |

**Rough total: $3,000 to $4,500.** Prices to be confirmed before purchase.

- **Each tablet is labeled** with its seat or role, and the screen shows the
  same label in a corner. If two get swapped in the morning, a manager re-pairs
  one in seconds.
- **Morning routine:** tablets off the charger, onto their stands, screens wake
  on the right page. **Closing:** onto the charger. One page in the manager
  view shows any tablet that has not checked in that morning.
- **Wi-Fi check before purchase:** confirm coverage at every table, the pass,
  and behind the bar. A $100 to $200 access point is cheap insurance.

## 9. Build order

| Step | What | Done means |
| :---- | :---- | :---- |
| **0. Setup** | Joe's subaccount in Double Blaze's Twilio account; toll-free verification submitted under Joe's business details. Hardware ordered. Seat capacities, staff list, menu link, review link collected. Wi-Fi checked. | Registration in review; hardware on its way. |
| **1. Floor core** | Schema and events, device pairing, staff codes, staff screen, rotation, seating suggestions, bar seat choice, table ready from the staff screen, open and close the day. | A full shift can run on the staff screen alone, matching the clipboard. |
| **2. Check-in** | Counter tablet and QR check-in, guest status page, wait estimates, "Now seating." | Guests check in with no staff help and see an honest wait. |
| **3. Kitchen and bell** | Kitchen tablet, bell monitor, chimes, coming-up view. | A tap at the pass chimes and shows on the monitor within a second. |
| **4. Table tablets** | Welcome by name, menu, guests left (pilot), ready with code. | A seated party sees its name; a bussed table returns to open from the table. |
| **5. Texts** | Check-in, you're next, thank-you, opt-out, delivery tracking. | Turned on once registration is approved. |
| **6. Pilot** | Run beside the clipboard on slower days for one to two weeks, Today report, tune turn defaults and settings with Joe's. | Joe's decides to switch over, and decides on the guests-left pilot. |

Steps 1 to 4 do not depend on Twilio, so a slow registration does not hold
up the build.

## 10. Things to raise with the client

1. **Twilio account: decided.** Double Blaze owns the account for the pilot,
   with Joe's in its own subaccount so its number, messages, and costs stay
   separate. Joe's may move to its own account once it is running. To keep
   that move easy: the texts go out under Joe's business details from day
   one, the app reads its Twilio keys from settings (a switch is a config
   change, not a code change), and before the move we confirm with Twilio how
   the number and its verification transfer. Cost: a small monthly number fee
   plus a fraction of a cent to about a cent per text.
2. **Guests-left pilot.** Not yet discussed with Joe's. Present it as a pilot
   with the trade-offs in the brief.
3. **Names on table tablets.** The check-in screen says "This name will show
   on your table," so guests can use a first name or a nickname.
4. **Missed call.** Default is to move the party to second in line. Confirm.
5. **Food-ready tile.** Cook taps to clear, or clears itself after a set time.
6. **Keep the physical bell** at the pass as the backup.
7. **Turn defaults.** Ask the manager for typical times by party size so the
   first wait estimates start close.

## 11. Acceptance gate

- Seating a party on the staff screen takes two taps and under 5 seconds.
- Rotation matches the clipboard rule on a replayed real shift, including a
  mid-shift join, a pause, and an override (unit tests).
- Bar suggestions never split an open run when an end placement exists (unit
  tests).
- A kitchen tap reaches the bell monitor and chimes within 1 second on Joe's
  Wi-Fi.
- A guest checks in on the counter tablet in under 30 seconds, and by QR on a
  mid-range Android phone and an iPhone.
- Every action writes exactly one matching event (tests on each function).
- RLS tests prove a table tablet cannot read the waitlist's phone numbers, a
  guest link reaches only its own party, and no other client's app can read
  `jd_` tables.
- Pulling the Wi-Fi shows the offline banner on every screen within 10
  seconds, with the last rotation totals on the staff screen.

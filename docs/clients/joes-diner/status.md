# Welcome to Joe's: Status

Where the build stands. The plan is in [`build-plan.md`](./build-plan.md);
the client's asks are in [`brief.md`](./brief.md).

No em dashes anywhere in this document or any copy it generates.

---

## Done

**Step 1, floor core**, and **step 2, check-in**, in `apps/joes-diner`.

| Piece | Where |
| :---- | :---- |
| Rules: rotation (clipboard rule), seating suggestions, bar seats side by side, wait estimates | `src/lib/rotation.ts`, `seating.ts`, `bar.ts`, `wait.ts` |
| Every floor change and its events | `src/lib/floor.ts` |
| 35 unit tests, including a replayed shift with a mid-shift join, a pause, an override, and an undo | `src/lib/*.test.ts` |
| Database: `jd_` tables, RLS on with no policies (server only), append-only events, `jd_commit` | `supabase/migrations/0058_joes_diner.sql` |
| Staff screen: waitlist, 19 seats, rotation, seat in two taps, call and hold timer, skip, all here, no show, add a walk-in, guests left, table ready with code, undo, open and close the day | `/staff` |
| Counter check-in: waits before check-in, party size, table or bar with both waits, whole-party question, name, rules before and after, waiting list and "Now seating", resets itself | `/checkin` |
| Phone check-in from the QR code, then a private status page that updates itself, with "everyone is here now" and "leave the list" | `/join`, `/p/<link>` |
| Printable QR sign | `/qr` |
| Manager: sign in with the manager code, staff and 4-digit codes, pair a tablet to its screen, see and remove paired tablets | `/manager` |
| Demo mode with sample parties and servers when Supabase is not set | everywhere |

Run it: `npm run dev:joes`, then open http://localhost:3005. With no
Supabase variables it runs in demo mode.

Checked: `npm test` (35 pass), `next build`, and a browser click-through of
seating a party, marking a table ready with a code, counter check-in, phone
check-in to the status page, and the staff screen picking up both new
parties.

## Not yet

- **Step 3, kitchen and bell:** kitchen tablet, bell monitor, chimes, the
  coming-up view, and Supabase Realtime nudges so the bell is under a second.
- **Step 4, table tablets:** welcome by name, menu, guests left (pilot),
  ready with code at the table.
- **Step 5, texts:** Twilio (Double Blaze account, Joe's subaccount),
  check-in, you're next, thank-you with review link. Phone numbers are not
  asked for at check-in until texts are on, so guests are never promised a
  text that will not come.
- **Today report** for the pilot.
- **Manager sign-in by email** instead of the shared manager code.

## Decisions made while building

- **Rules run once, in TypeScript; `jd_commit` saves the result and its
  events in one transaction** (instead of one SQL function per action). Same
  guarantee, no duplicate rules. The build plan is updated.
- **Polling every 2 seconds for now.** Realtime arrives with the bell.
- **"First available" does not put a small party at a 7-seat table when bar
  seats would do.** Found while clicking through the demo.
- **A party still in line never sees "Seating now";** short waits read "Any
  minute now" until they are called.
- **Table capacities are placeholders:** 4 seats, with 105 and 110 seating 7,
  until the real counts come back from Joe's.

## To go live (needs a person)

1. Apply `supabase/migrations/0058_joes_diner.sql` to the database.
2. Create a Vercel project for `apps/joes-diner` with
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `JOES_MANAGER_CODE`, `JOES_SESSION_SECRET`,
   and `NEXT_PUBLIC_SITE_URL`.
3. On `/manager`: add Joe's servers with their codes, then pair the staff
   tablet and the counter tablet.
4. Print the QR sign from `/qr`.

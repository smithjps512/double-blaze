# Find Me: Status

Where the build stands. The plan is [`build-plan.md`](./build-plan.md); the
client's words are [`brief.md`](./brief.md).

No em dashes anywhere in this document or any copy it generates.

---

## Phase 1 (adoption core): built, not yet deployed

| Piece | State | Where |
| :---- | :---- | :---- |
| Browse and pet pages | Done | `/animals`, `/animals/[id]` |
| Match quiz (no account needed) | Done | `/match`, answers in a cookie, then `fm_adopter_answers` after sign in |
| Ranked matches with reasons | Done | `/matches`, `src/lib/matching.ts` |
| Inquiries to the shelter (email + dashboard) | Done | pet page, `fm_inquiries` |
| Favorites | Done | pet page, `/my` |
| Email sign-in link | Done | `/sign-in`, same flow as Paint Your Spot |
| Shelter staff dashboard | Done | `/staff`: inquiries, adoption check-ins, pet list with status |
| Add or edit a pet from a phone, with photo | Done | `/staff/animals/new`, photos to the `find-me-photos` bucket |
| Printable adoption QR poster | Done | `/staff/qr`, one code per shelter |
| QR adoption check-in and care plan | Done | `/adopt/[code]`, `/my/pets/[id]` |
| Care reminders by email | Done | `/api/cron/reminders`, daily Vercel cron |
| Admin: add shelters, invite staff | Done | `/admin`, `FM_ADMIN_EMAILS` |
| Installable (manifest, icons, offline page) | Done | `src/app/manifest.ts`, `public/sw.js` |
| Demo mode | Done | No Supabase env: invented sample shelters and pets, every page labeled |

### Verified

- 35 unit tests (`npm test -w @double-blaze/find-me`): matching, quiz parsing,
  care plan, reminders, forms.
- RLS: `supabase/tests/find_me_rls.sql`, 17 checks, all PASS on Postgres 16.
  Run it in the Supabase SQL editor after applying the migration.
- `next build` passes. Clicked through in a phone browser: quiz to matches,
  pet page, QR check-in to care plan preview, staff dashboard, add pet, QR
  poster. No console errors, no sideways scroll.

### Not verified yet (needs the live project)

- Sign-in emails, inquiry emails, and reminder emails (need Supabase and
  Resend keys). The code is the Paint Your Spot flow, which is proven.
- Photo upload to Supabase Storage.
- The two-minute "add a pet" target with real shelter staff.

## Phase 2 (lost and found): built, not yet deployed

| Piece | Where |
| :---- | :---- |
| Map and list of open posts, filters, "back home" count | `/lost-found` |
| Post a lost or found pet: photo, map spot, secret ID detail | `/lost-found/new` |
| Post page: approximate area, share, flyer, reply form | `/lost-found/[id]`, `/flyer`, `opengraph-image` |
| Owner view: replies with the ID detail check, match suggestions, reunited/close | `/lost-found/[id]` as the poster (demo: `?view=owner`) |
| Private conversations with unread state and throttled email notices | `/messages`, `/messages/[id]` |
| Shelter alerts by email, and a lost and found section on the dashboard | `/staff` |
| Schema | `supabase/migrations/0056_find_me_lost_found.sql` |

### Verified

- 48 unit tests (adds location fuzzing, lost/found matching, the ID detail
  check, post parsing, and message notification rules).
- `supabase/tests/find_me_lost_found_rls.sql`: 19 checks, all PASS on
  Postgres 16. Among them: the public never sees the exact spot or secret, a
  helper cannot read the secret or rewrite their answer, outsiders cannot read
  or post into a conversation, shelter staff see the exact spot but not
  private messages. The Phase 1 suite still passes.
- `next build` passes. Phone browser walkthrough of the map, post page, owner
  view, posting (tap-to-pick on the map), flyer, messages, and share image:
  no console errors, no sideways scroll. Map tiles could not load in the build
  sandbox (tile server blocked there); the map itself and its circles render.

### Not verified yet (needs the live project)

- Posting, replies, and notification emails end to end with real accounts.
- Map tiles on a real network.

## Deployment (client testing)

Live at **https://findme.doubleblaze.solutions** (Vercel project `find-me`,
root `apps/find-me`, production branch `main`).

- **Database:** the shared Double Blaze Supabase project. Migrations `0055`,
  `0056`, and `0057` applied. Both RLS suites were run against the live
  database (17 and 19 checks, all PASS, rolled back, nothing left behind).
  Before applying, a policy scan confirmed no other app's table is readable by
  any signed-in user except deliberately public ones, so Find Me signups gain
  no access to other apps' data.
- **Email:** Resend key "find-me (sending only)", restricted to sending from
  `doubleblaze.solutions`. Sender `Find Me <findme@doubleblaze.solutions>`.
- **Vercel env:** Supabase URL and anon key, `RESEND_API_KEY`,
  `FM_EMAIL_FROM`, `FM_ADMIN_EMAILS`, `NEXT_PUBLIC_SITE_URL`, `FM_MAP_CENTER`,
  `CRON_SECRET`. **`SUPABASE_SERVICE_ROLE_KEY` must be added by hand** (the
  connectors cannot read it): without it, sign-in links, photo uploads, and
  admin invites fail.

### To add a partner shelter

Sign in at `/sign-in` with an admin email, open `/admin`, add the shelter,
and invite its staff. They add pets at `/staff` and print the QR poster.

## Open questions for the client

See build plan section 7. The ones blocking launch: **who are the first
partner shelters**, and **the name and domain**.

## Next up

- Import from the partner shelter's software once we know what it is.
- Push notifications for reminders (daily feeding stays push only).
- Neighbor alerts for lost pets (opt-in, by area).
- A paid map tile provider before real traffic.
- Phase 3: community and giving.

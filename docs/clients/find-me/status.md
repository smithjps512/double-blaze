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

## To go live

1. Apply `supabase/migrations/0055_find_me.sql`, then run
   `supabase/tests/find_me_rls.sql` and confirm every line is PASS.
2. Create a Vercel project with root `apps/find-me`. Set the Supabase,
   Resend, `FM_ADMIN_EMAILS`, `NEXT_PUBLIC_SITE_URL`, and `CRON_SECRET` vars
   (see `.env.example`).
3. Pick the domain (for example `findme.doubleblaze.solutions`) and add it to
   Supabase Auth's allowed redirect URLs.
4. Sign in as an admin, add the partner shelter at `/admin`, and invite its
   staff. They add pets at `/staff` and print the QR poster.

## Open questions for the client

See build plan section 7. The ones blocking launch: **who are the first
partner shelters**, and **the name and domain**.

## Next up

- Import from the partner shelter's software once we know what it is.
- Push notifications for reminders (daily feeding stays push only).
- Phase 2: lost and found.

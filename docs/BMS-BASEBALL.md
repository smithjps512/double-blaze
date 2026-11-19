# BMS Baseball: tryout sign up

A friendly, no-login sign up page for Blacksburg Middle School baseball
tryouts (grades 6 to 8). Lives in `apps/bms-baseball`. Served from a plain
Vercel address (for example `bms-baseball.vercel.app`) so no Double Blaze
branding shows in the URL.

| Route | Who | What |
|---|---|---|
| `/` | Anyone with the link | Welcome page and the sign up form |
| `/admin` | Coach password | Counts by grade and position, filters, list, delete |
| `/admin/export` | Coach password | The filtered list as CSV (opens in Excel or Sheets) |

The form asks for first and last name, grade, positions (pick any, including
"Not sure yet"), years played before this year (0 to 6+), and optionally where
they played, team names, and anything else for the coach.

## Privacy and spam

- Students are minors, so the table is server only: RLS on, no policies, no
  grants to `anon` or `authenticated`. Only this app's server (service role)
  touches it. No email or phone is collected.
- Spam: a hidden honeypot field and a minimum fill time. Bots get a fake
  success. Coaches can delete junk or duplicate rows on `/admin`.
- The page sets `noindex`, so it will not show up in search results.

## One-time setup

1. **Database:** apply `supabase/migrations/0058_bms_baseball.sql` to the
   shared Supabase project.
2. **Vercel:** new project `bms-baseball`, same Git repo, Root Directory
   `apps/bms-baseball`. Its default address becomes
   `https://bms-baseball.vercel.app` (or a close variant if taken).
   Environment variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | shared project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | shared service role key |
| `ADMIN_PASSWORD` | the coach password, 8+ characters. Changing it signs everyone out |

3. Open the page on a phone, submit a test sign up, see it on `/admin`,
   download the CSV, then delete the test row.

## Local development

```bash
npm install
npm run dev -w @double-blaze/bms-baseball    # http://localhost:3005
npm test -w @double-blaze/bms-baseball
```

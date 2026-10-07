# Paint Your Spot: setup and handoff

BMS Paint Your Spot is the staff parking spot fundraiser for Blacksburg Middle
School. Phase 1 is the interest survey. It lives in `apps/paint-your-spot` and
serves `paintyourspot.doubleblaze.solutions`.

No em dashes anywhere in this app: copy, UI, comments, or commits.

## What Phase 1 does

| Route | Who | What |
|---|---|---|
| `/` | Anyone | Landing page: pitch, how it works, the listings, interest meter, BHS photo, rules |
| `/interest` | Signed in @mcps.org staff | The survey. One response per person, editable any time |
| `/admin` | `ADMIN_EMAILS` only | Counts, filters, response table, CSV export, settings |
| `/admin/export` | `ADMIN_EMAILS` only | The filtered table as CSV |
| `/auth/sign-in`, `/auth/callback`, `/auth/sign-out` | | Google sign in through Supabase |

### Rules the code enforces

- **mcps.org only.** Google gets an `hd=mcps.org` hint, but that hint is easy
  to bypass. The callback checks the verified email and signs anyone else straight
  back out. RLS checks the token's email again before any response is written.
- **Boss rule.** A `BOSS_EMAILS` user sees a "Something is happening here" card
  in place of Paint the Boss, never sees the "chip in" option, and the
  database trigger strips `boss` from their answers even if a request is
  crafted by hand. Phase 3 tables must deny reads with `pys_is_boss()`.
- **Roles live in config, enforced by the database.** `ADMIN_EMAILS` and
  `BOSS_EMAILS` are copied onto `pys_profiles` with the service role at sign
  in, and again whenever an admin opens `/admin`. No user can write their own
  profile.
- **Go or no-go.** Phase 1 decides whether the fundraiser happens at all.
  I'm in and Probably both count toward the goal (25 to start) and are shown
  separately. After the deadline (October 16 to start) the page says the
  committee is making the call; it never declares the result itself. Both
  the goal and the deadline are editable in `/admin`.
- **The public count is numbers only.** `pys_interest_counts()` returns the
  I'm in and Probably counts. Just curious is not counted. No names leave
  the database for anyone but admins.

## One-time setup

### 1. Database

Apply `supabase/migrations/0040_paint_your_spot.sql`, then
`0041_paint_your_spot_deadline.sql`, to the shared project (SQL editor or
`supabase db push`). 0041 adds the deadline setting, moves the goal to 25,
and adds the split count. It creates `pys_profiles`,
`pys_interest_responses`, `pys_settings` (seeded with placeholders), their RLS
policies, and the helper functions.

### 2. Google OAuth client

Use a personal or Double Blaze Google account, not an mcps.org account
(district accounts usually cannot create Cloud projects).

1. At console.cloud.google.com, create a project named **Paint Your Spot**.
2. Google Auth Platform, then **Branding**: app name "Paint Your Spot", a support
   email, home page `https://paintyourspot.doubleblaze.solutions`, and
   authorized domains `doubleblaze.solutions` and
   `jtngdjhmapvkdiphvyxe.supabase.co`. Skip the logo, because a logo triggers
   Google's verification review.
3. **Audience**: choose External. Internal only works for projects inside the
   mcps.org Workspace.
4. **Data access**: only `openid`, `.../auth/userinfo.email`, and
   `.../auth/userinfo.profile`. These are non-sensitive scopes, so no review is needed.
5. **Clients**, then Create client, then **Web application**:
   - Authorized JavaScript origin: `https://paintyourspot.doubleblaze.solutions`
   - Authorized redirect URI: `https://jtngdjhmapvkdiphvyxe.supabase.co/auth/v1/callback`
   - Copy the client ID and the client secret.
6. Back on **Audience**, click **Publish app**. While it is in Testing, only
   listed test users can sign in.

MCPS Google Workspace admins can block third party apps. If staff see an
"Access blocked" page, ask MCPS IT to trust the client ID (Admin console,
Security, API controls, App access control). Test with your own account
before you share the link.

### 3. Supabase Auth

- Authentication, then Sign In / Providers, then **Google**: enable it and paste the client
  ID and secret.
- Authentication, then URL Configuration, then **Redirect URLs**: add
  `https://paintyourspot.doubleblaze.solutions/**` (and
  `http://localhost:3003/**` for local work). The wildcard matters, because
  the callback carries a `?next=` parameter. Leave the Site URL as it is,
  because the members app relies on it.

Turning on Google affects the whole shared project. A Google user from
outside MCPS can still end up as an `auth.users` row before the callback signs
them out. They get no `pys_` data and no membership anywhere else, but they do
show up in the user list.

### 4. Vercel

Create a new project called `double-blaze-paint-your-spot`:

- Same Git repository, **Root Directory: `apps/paint-your-spot`**
- Domain: `paintyourspot.doubleblaze.solutions`. A specific subdomain takes
  priority over the `*.doubleblaze.solutions` wildcard on the sites project.
- Environment variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | shared project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | shared anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | shared service role key (used for profile sync only) |
| `NEXT_PUBLIC_SITE_URL` | `https://paintyourspot.doubleblaze.solutions` |
| `ADMIN_EMAILS` | comma separated, your mcps.org address |
| `BOSS_EMAILS` | comma separated, the principal's mcps.org address |
| `INTEREST_GOAL` | optional fallback, default 25 (the admin setting wins) |
| `RESEND_API_KEY`, `PYS_EMAIL_FROM` | optional confirmation email. Falls back to `EMAIL_FROM` |
| `PYS_REPLY_TO` | optional, where replies to the confirmation go |

The staff emails are env vars, not code, because this repository is public.

## Verifying (definition of done)

1. Open the landing page signed out, on a phone. It renders with no horizontal
   scrolling, and prices read Coming soon.
2. Sign in with a personal Gmail account. You land back on `/` with "That
   account is not an @mcps.org account."
3. Sign in with your mcps.org account and submit the survey. You see the thank-you
   screen, and the meter goes up by one if you picked I'm in or Probably.
4. Open `/interest` again. Your answers are filled in. Change one and save. It is still
   one row in `/admin`.
5. In `/admin`, set a Standard fee of 40 and save. The landing page shows $40.
   Try the filters and Download CSV.
6. **Boss rule:** temporarily add a second test mcps.org account to
   `BOSS_EMAILS` and redeploy. Signed in as that account: the landing page shows the 👀 card,
   and the survey has no Paint the Boss option. Remove it afterward.

A boss who opens the link **signed out** still sees the public Paint the Boss
card. The landing page is public on purpose. Bring this up with the committee if it matters.

## Local development

```bash
npm install
npm run dev -w @double-blaze/paint-your-spot    # http://localhost:3003
npm test -w @double-blaze/paint-your-spot
```

The landing page renders with no env set: the meter reads "Counting soon" and
sign in reports that it is not switched on yet.

## Later phases (designed for, not built)

- **Phase 2, spot selection:** `pys_lots`, `pys_spots` (type standard, prime,
  boss, or excluded; polygon; owner; status open, claimed, paid, or painted), `pys_claims`,
  `pys_designs`. The settings table already holds the payment link.
- **Phase 3, Paint the Boss:** `pys_boss_contributions`, `pys_boss_votes` (one
  vote per contributor). Every policy on these tables includes
  `not public.pys_is_boss()`.

## Photos

`public/examples/example-spot-lot.jpg` is the BHS lot photo (no people). The
crime scene photo shows students. It is not in this public repository. Add it
only after permission is confirmed, or after cropping out the people.

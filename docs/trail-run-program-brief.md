# Double Blaze: "Trail Run" Program Brief

Working name: **Trail Run**. Swap candidates if you prefer: First Mile, Proof Month, See It First. This document uses Trail Run throughout; change one constant to rename everywhere.

No em dashes anywhere in this document or in any copy it generates. Commas, colons, and periods only.

---

## 1. What Trail Run is

Trail Run is Double Blaze's first-month-free program for small and independently operated businesses. We build the customer's website or workflow application first. The 30-day clock starts the day their solution launches, not the day they sign up, so build time never eats their evaluation window. During those 30 days they get full Blue Trail capability and see real results before any money changes hands. They can stop anytime before day 31 and walk away clean. If they stay, the first charge and the 12-month term both begin on day 31.

The promise in one line: we build it, you run it for 30 days, then you decide.

### Why this works for the segment
Small business owners do not want to commit to a year of software they have not seen working in their own business. Trail Run removes that risk. It also forces Double Blaze to deliver something genuinely good inside 30 days, which protects our reputation and our retention. And because everyone runs on Blue Trail during the window, the customer can feel where the value actually lands and right-size their tier at day 31 instead of guessing up front.

### Eligibility
No gating. We trust the customer on size. A franchisee or a single-location dealer may sit under a billion dollar parent, but they operate independently and we want to be accommodating. Anyone can take the offer. We exclude no one by rule. (If we later see abuse, we add a soft self-attestation, not a hard gate.)

---

## 2. The customer lifecycle

1. **Sign up.** On the dedicated `/trail-run` page, the customer authorizes their card through a Stripe SetupIntent. No subscription exists yet, so an early charge is impossible by construction. The payment method is saved for launch. Explicit consent captured at the same step: no charge until 30 days after launch, then the selected tier per month with a 12-month term beginning that same date.
2. **Intake.** Spark, our conversational intake agent, captures everything needed to build: business details, brand assets, products and services, the one workflow they most want automated, and the KPIs they care about. Spark assembles a structured Trail Run Build Brief automatically.
3. **Build (free).** Double Blaze builds the standardized Blue Trail starter solution. Internal workspace tracks the checklist. We compress delivery with our own AI tooling, which is the point: our internal process is itself a demo of what we sell.
4. **Launch.** The solution goes live. This event sets Day 0 and the 30-day clock. Customer receives a launch notification with their live URL and a plain summary of what we built.
5. **Run the window.** Customer uses full Blue Trail for 30 days. Value check-ins fire along the way (see section 4), each one showing live results pulled from their KPI dashboard, with clear actions to continue, change tier, or cancel.
6. **Decision point (day 31).** If not canceled, Stripe charges the selected tier (defaults to Blue Trail if they never changed it). The 12-month term begins. Customer transitions into ongoing program management.
7. **Cancel path.** Any time before day 31, the customer cancels in one click from any check-in or the portal. No charge. The built solution is taken offline but retained for 90 days from the cancellation date.
8. **Reactivation (within 90 days).** The customer can come back any time in that 90-day window. They log in with the same email they signed up with, pass a verification step (email code, text code, or a click-to-verify link), and make their first payment. On payment, the solution is restored live and the 12-month term begins on the reactivation date at the selected tier (default Blue Trail). After 90 days with no reactivation, the build and its data are purged.

---

## 3. What we build in the first month

Everyone runs on Blue Trail, so the month-one build is the Blue Trail deliverable, productized and standardized for fast, repeatable delivery:

- Website (new build or refresh)
- Basic ecommerce
- Social setup with one daily AI post
- One workflow automation (the single highest-value process the customer named in intake)
- AI customer support
- Inventory
- KPI dashboard (this is critical: it is what powers the results shown in every check-in)

Design principle: the build must reach a launched, working state quickly so the customer has most of the 30 days to see actual outcomes (leads captured, sales, hours saved). The 30-day clock starting at launch protects this. Standardize a "Trail Run starter build" template so delivery is days, not weeks.

---

## 4. The check-in system

Reframe away from a charge countdown. These are value check-ins, not alarms. Each one leads with what was built and what it produced, then offers the choice. This matches the goal of never calling this a "free trial."

Each check-in shows:
- What we built and what is live
- Live results from the KPI dashboard (leads, sales, time saved)
- One clear set of actions: continue at Blue Trail, change tier, or cancel

**Cadence. Decided and locked: Day 14, Day 7, Day 3, Day 1.** A check-in fires when this many days remain in the window. Fewer touches, less naggy, still well covered. There are no presets and no founder's-spec variant; this is the final cadence (built in T3).

---

## 5. Double Blaze's own onboarding and delivery automation

This is the part that doubles as marketing. The onboarding and program management the customer experiences is a live demonstration of the automation we build for them. Foundations First, applied to ourselves first.

The internal pipeline, fully automated end to end:

1. **Spark intake agent** (Anthropic API): conversational capture, reusing the Game View Spark pattern (capture, then assemble a structured artifact). Captures business profile, goals, current web presence, brand assets, products and services, the priority workflow, and target KPIs.
2. **Automated brief generation:** Spark assembles the Trail Run Build Brief with structured outputs, runs a feasibility check, and routes it to the project lead and admin. The brief row is staff-only; the client sees a separate rendered summary.
3. **Build workspace:** the build is a project record keyed to the engagement, with the staff-only standardized Blue Trail checklist (`build_tasks`), status per task, and internal AI assists for copy, product descriptions, and configuration.
4. **Launch event:** one staff action marks the solution live, creates the trial subscription on the saved card, sets Day 0 and the window end date, records the live URL, and fires the launch notification with the live URL and the client-safe summary.
5. **Lifecycle automation:** a daily scheduled job (Vercel Cron) computes days remaining for every engagement in an active window and fires the matching check-in through Resend, logging each send to an idempotent ledger so a check-in never double-sends.
6. **Conversion event (day 31):** Stripe charges the selected tier, the 12-month term begins, and the org moves to program management.
7. **Program management:** ongoing dashboard, AI support, and the content cadence for whatever tier they landed on.

Selling point to make explicit on the site: the onboarding you are experiencing right now is the same automation we will build into your business.

---

## 6. Technical mechanics

Built on the existing stack: Next.js App Router, TypeScript, Tailwind, Vercel, Clerk (client, project_lead, admin), Supabase Postgres with row-level security, Stripe, Resend, Anthropic API for Spark.

### Resolved engineering decisions
Settled during build and reflecting the shipped code. Detail is folded into the sections below.
- Lifecycle lives on the org side in a dedicated `trail_run_engagements` table. Stripe billing status stays on the subscription. The webhook updates the engagement rather than keeping a second copy of status.
- Card is captured at signup with a SetupIntent. The chargeable subscription and its 30-day trial are created at the launch event, so a charge before launch is impossible by construction.
- The offer has a dedicated `/trail-run` page, value-led, hosting consent and the Start action. The pricing page links to it. Page copy is sourced from `docs/trail-run-messaging.md`.
- The build is a `projects` row keyed to the engagement via `projects.trail_run_engagement_id`. That link is canonical and unique (one build per engagement), enforced by a unique index.
- Spark JSON approach: the Build Brief is assembled with structured outputs (`output_config.format` with a flat JSON schema) so the artifact is schema guaranteed. The intake turns are natural text, and structured field capture is a separate extraction call, never by constraining Spark's chat turns to JSON. Prompt for strict JSON and parse with try and catch is only the fallback for API errors, refusals, or truncation.
- `project_briefs` is staff-only. The client never reads the brief row (it holds internal feasibility flags and the raw intake); the client-facing view is a separate rendered summary, the same one used in the launch email and the portal.
- Check-in cadence is locked to Day 14, 7, 3, 1.

### Stripe
Capture the payment method at signup with a SetupIntent. Do not create a subscription yet. At the launch event (T3), create the subscription on the saved payment method with a clean 30-day trial, defaulting to the Blue Trail price, so the first charge lands at trial end unless canceled. This makes an early charge impossible during the build rather than something we guard against. If the customer changes tier before the window ends, swap the subscription item so the trial-end charge bills the right tier. Do not rely on Stripe's single pre-trial-end webhook to drive the customer experience. Drive all check-ins from our own scheduler so we control cadence and content. Confirm current Stripe behavior for SetupIntents, saved payment methods, and trial subscriptions against Stripe's live documentation before building, since API specifics change.

As built: T1 shipped the SetupIntent path (no subscription at signup), so no placeholder `trial_end` or guard was needed. The T3 launch event creates the subscription on the saved payment method with `trial_end` set to launch plus 30 exactly (a unix timestamp), `trial_settings.end_behavior.missing_payment_method` set to cancel as the net, and Stripe creation keyed by an idempotency key on the engagement so a retried launch never double-creates.

Turn on Stripe Tax and confirm Virginia and Texas treatment with the CPA.

### Data model additions
Building on existing `organizations`, `users`, and subscription tables:
- `trail_run_engagements`: the lifecycle, keyed to the org, with a foreign key to the current subscription. Fields: `status` (signup, building, launched, active_window, converting, converted, canceled, reactivated), `launch_date`, `window_end_date` (launch + 30), `selected_tier` (default blue), `stripe_payment_method_id`, `consent_captured_at`, `cancellation_date`, `retention_expires_at` (cancellation + 90), `reactivated_at`. Stripe billing status (trialing, active, past_due, canceled) is not duplicated here, it stays on the subscription and the webhook keeps the engagement in step. A cancel-then-reactivate produces a new subscription and a new engagement row, so history survives the boundary that a single subscription record would not.
- The build is a `projects` row keyed to the engagement via `projects.trail_run_engagement_id` (canonical, unique per engagement). It also carries `live_url`, set at launch.
- `project_briefs`: the Spark-generated build brief, staff-only. Holds the structured brief, the rendered summary (the only client-facing view), the raw intake snapshot, and non-blocking feasibility flags.
- `build_tasks`: the staff-only standardized Blue Trail checklist with the seven Blue Trail task types and per-task status and notes.
- `lifecycle_events`: an append-only audit of launch, each check-in sent, cancellation, and so on, with timestamps. Immutable facts only; mutable send state lives on the ledger below.
- `trail_run_checkins`: the idempotent check-in send ledger, one row per (engagement, target day in 14/7/3/1) with a status (pending, sent, failed) and a unique index on (engagement, day) as the hard no-double-send guard. The daily run also writes a client dashboard `notifications` row on each successful send.

### Scheduler
Daily job on Vercel Cron, calling a route that enforces a `CRON_SECRET` bearer itself (401 without it, since Vercel Cron only triggers the request and does not authenticate it). For each engagement in `active_window`, compute days remaining; when it is 14, 7, 3, or 1, fire the matching check-in through Resend. Treat the trigger as at-least-once: the run claims a `trail_run_checkins` slot, sends, then marks the slot sent or failed, and a later run retries pending or failed slots whose window has not passed, so a transient failure never silently skips a check-in and an overlap or manual re-trigger never double-sends. Each successful send writes an append-only `lifecycle_events` row and a client `notifications` row. The purge of canceled engagements past `retention_expires_at` is Sprint T4, not this job.

### Reactivation
Customer logs in with the signup email through Clerk, passes verification (email code, SMS code, or click-to-verify link), and makes the first payment. On successful payment, restore the solution live, set `reactivated_at`, move status to reactivated, and begin the 12-month term on the reactivation date at the selected tier. Only available while `retention_expires_at` is in the future.

### Offer entry and presentation
The offer has a dedicated `/trail-run` page, value-led. Sequence on the page: the promise, how it works in plain steps, then the Start action that runs the SetupIntent card capture and consent acknowledgment. Default to Blue Trail, and make clear the tier is chosen at day 31 so the visitor understands they are not locking a tier now. Pull all page copy from `docs/trail-run-messaging.md` so wording has one source of truth. The pricing page carries a single value-led Trail Run section that links here, not a duplicate of the offer or its mechanics.

### Customer portal
One screen the check-in emails link to: live results, what was built, and the three actions (continue, change tier, cancel). If no metrics are flowing yet it shows the build summary with a graceful empty state and does not block. Change level uses the tier-swap (subscription item update, proration off) so the day-31 charge bills the right tier. Cancel cancels the trialing subscription with no charge and stamps `cancellation_date` and `retention_expires_at` (now plus 90); take-offline, purge, and reactivation are T4.

### Homepage hero
The homepage hero is a two-slide slider. Slide 1 is the enterprise hero (unchanged). Slide 2 is results-first and leads to Trail Run. The trust bar is fixed below the slider, unaffected by which slide shows. Card-capture reassurance never appears on the hero; it lives only on the Start action on `/trail-run`. The slider is accessible (keyboard arrows, visible previous and next controls and dots, no auto-advance under prefers-reduced-motion, pause on hover and focus). A `?hero=results` deep-link can open slide 2. Full campaign tooling beyond that single param is backlog, not built.

### Consent and disputes
Mirror the existing 12-month consent capture. At signup on the `/trail-run` page, a required acknowledgment: no charge until 30 days after launch, then the tier price monthly with a 12-month term starting that date. Capture it with a timestamp. This protects against chargebacks and disputes.

---

## 7. Implementation steps (sprint plan)

This slots alongside the existing Sprint 1 (storefront, built) and Sprint 2 (Stripe commerce, in progress).

**Sprint T1: Offer and billing spine. Done.**
SetupIntent card capture and the consent acknowledgment on the dedicated `/trail-run` page. No chargeable subscription is created at signup. The `trail_run_engagements` table and its statuses, keyed to the org with a foreign key to the subscription. Default Blue Trail as the selected tier, with tier-swap support for use before the window ends. Pricing-page Trail Run section linking to `/trail-run`.

**Sprint T2: Intake to brief. Done.**
Spark intake agent flow, automated Trail Run Build Brief generation with feasibility check, internal build workspace and standardized Blue Trail checklist.

**Sprint T3: Launch and lifecycle. Built.**
Launch event creates the subscription on the saved payment method with the 30-day trial, sets Day 0 and the window. Daily scheduler and the Day 14, 7, 3, 1 check-ins through Resend. Customer portal with live results and continue, change, cancel actions. Homepage hero slider and the `/trail-run` hero. Folds in the two T2 follow-ups: `project_briefs` made staff-only and `projects.trail_run_engagement_id` made canonical and unique.

**Sprint T4: Convert and manage.**
Day 31 conversion, term start, handoff to program management. Cancellation flow that takes the build offline and sets the 90-day retention clock. Reactivation flow (signup-email login, verification, first payment, restore, term start). Daily purge of builds past `retention_expires_at`. Admin pipeline dashboard across the whole funnel (signup, building, launched, in window, converted, canceled, reactivated).

---

## 8. Open decisions for you

1. **Cancellation and the built work. Decided.** On cancellation, the build is taken offline and retained for 90 days. Within that window the customer can reactivate by logging in with their signup email, passing verification, and making their first payment, which starts the 12-month term on the reactivation date. After 90 days the build is purged.
2. **Program name.** Trail Run, or one of First Mile, Proof Month, See It First.

(Check-in cadence is no longer open: it is locked to Day 14, 7, 3, 1, see section 4.)

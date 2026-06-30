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

1. **Sign up.** Customer provides payment method through Stripe. No charge. Explicit consent captured at checkout: no charge until [launch date + 30], then [selected tier] per month with a 12-month term beginning that same date.
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

**Cadence.** Two presets, configurable with one constant:
- Recommended (default): Day 14, Day 7, Day 3, Day 1. Fewer touches, less naggy, still well covered.
- Founder's spec: Day 14, then Day 7, 6, 5, 4, 3, 2, 1.

Open decision flagged in section 8.

---

## 5. Double Blaze's own onboarding and delivery automation

This is the part that doubles as marketing. The onboarding and program management the customer experiences is a live demonstration of the automation we build for them. Foundations First, applied to ourselves first.

The internal pipeline, fully automated end to end:

1. **Spark intake agent** (Anthropic API): conversational capture, reusing the Game View Spark pattern (capture, then assemble a structured artifact). Captures business profile, goals, current web presence, brand assets, products and services, the priority workflow, and target KPIs.
2. **Automated brief generation:** Spark assembles the Trail Run Build Brief, runs a feasibility check, and routes it to the project lead and admin.
3. **Build workspace:** project record with the standardized Blue Trail checklist, status per task, and internal AI assists for copy, product descriptions, and configuration.
4. **Launch event:** one action marks the solution live, sets Day 0 and the window end date, and fires the launch notification with the live URL and the "what we built" summary.
5. **Lifecycle automation:** a daily scheduled job computes days remaining for every org in an active window and fires the right check-in through Resend, pulling live KPI numbers, and logs each send.
6. **Conversion event (day 31):** Stripe charges the selected tier, the 12-month term begins, and the org moves to program management.
7. **Program management:** ongoing dashboard, AI support, and the content cadence for whatever tier they landed on.

Selling point to make explicit on the site: the onboarding you are experiencing right now is the same automation we will build into your business.

---

## 6. Technical mechanics

Built on the existing stack: Next.js App Router, TypeScript, Tailwind, Vercel, Clerk (client, project_lead, admin), Supabase Postgres with row-level security, Stripe, Resend, Anthropic API for Spark.

### Stripe
Use a subscription with a 30-day trial so the card is captured at signup with no charge and the first charge lands automatically at trial end unless canceled. Create the subscription on the Blue Trail price by default. If the customer changes tier before the window ends, swap the subscription item to the new price so the trial-end charge bills the right tier. Important: do not rely on Stripe's single pre-trial-end webhook to drive the customer experience. Drive all check-ins from our own scheduler so we control cadence and content. Confirm current Stripe trial behavior and webhook timing against Stripe's live documentation before building, since API specifics change.

Turn on Stripe Tax and confirm Virginia and Texas treatment with the CPA.

### Data model additions
Building on existing `organizations`, `users`, and subscription tables:
- Trail Run lifecycle on the org or subscription: `status` (signup, building, launched, active_window, converting, converted, canceled, reactivated), `launch_date`, `window_end_date` (launch + 30), `selected_tier` (default blue), `stripe_payment_method_id`, `consent_captured_at`, `cancellation_date`, `retention_expires_at` (cancellation + 90), `reactivated_at`.
- `project_briefs`: the Spark-generated build brief.
- `build_tasks`: the standardized Blue Trail checklist with status.
- `lifecycle_events`: launch, each check-in fired, conversion, cancellation, with timestamps.
- `notifications`: scheduled and sent check-ins, fired status, target day.

### Scheduler
Daily job (Vercel Cron or Supabase pg_cron). For each org in `active_window`, compute days remaining, fire the matching check-in through Resend if not already sent for that day, log to `lifecycle_events` and `notifications`. The same daily job purges any canceled org whose `retention_expires_at` has passed, removing the build and its data.

### Reactivation
Customer logs in with the signup email through Clerk, passes verification (email code, SMS code, or click-to-verify link), and makes the first payment. On successful payment, restore the solution live, set `reactivated_at`, move status to reactivated, and begin the 12-month term on the reactivation date at the selected tier. Only available while `retention_expires_at` is in the future.

### Customer portal
One screen the check-in emails link to: live results, what was built, and the three actions (continue, change tier, cancel). One-click cancel with no charge before day 31.

### Consent and disputes
Mirror the existing 12-month consent capture. At checkout, a checkbox acknowledging: no charge until the launch-plus-30 date, then the tier price monthly with a 12-month term starting that date. This protects against chargebacks and disputes.

---

## 7. Implementation steps (sprint plan)

This slots alongside the existing Sprint 1 (storefront, built) and Sprint 2 (Stripe commerce, in progress).

**Sprint T1: Offer and billing spine.**
Stripe trial-mode subscription, card capture, checkout consent, default Blue Trail price, tier-swap logic. Trail Run lifecycle fields and statuses on the org and subscription. Pricing-page presentation of the offer.

**Sprint T2: Intake to brief.**
Spark intake agent flow, automated Trail Run Build Brief generation with feasibility check, internal build workspace and standardized Blue Trail checklist.

**Sprint T3: Launch and lifecycle.**
Launch event sets Day 0 and the window. Daily scheduler and the Day 14, 7, 3, 1 check-ins through Resend. Customer portal with live results and continue, change, cancel actions.

**Sprint T4: Convert and manage.**
Day 31 conversion, term start, handoff to program management. Cancellation flow that takes the build offline and sets the 90-day retention clock. Reactivation flow (signup-email login, verification, first payment, restore, term start). Daily purge of builds past `retention_expires_at`. Admin pipeline dashboard across the whole funnel (signup, building, launched, in window, converted, canceled, reactivated).

---

## 8. Open decisions for you

1. **Cancellation and the built work. Decided.** On cancellation, the build is taken offline and retained for 90 days. Within that window the customer can reactivate by logging in with their signup email, passing verification, and making their first payment, which starts the 12-month term on the reactivation date. After 90 days the build is purged.
2. **Check-in cadence.** Recommended (14, 7, 3, 1) or your full spec (14, 7, 6, 5, 4, 3, 2, 1). Brief defaults to recommended.
3. **Program name.** Trail Run, or one of First Mile, Proof Month, See It First.

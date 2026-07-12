# Double Blaze: Stripe Setup and Test Plan

Covers the Double Blaze Stripe account, the four tier prices, the Trailhead tip presets, the webhook endpoints the build needs, the test-clock scenarios including the off-session failure, and the sandbox-to-live cutover.

No em dashes anywhere.

---

## 0. The thing to understand before you test anything

**There are two independent clocks in this system, and Stripe only controls one of them.**

- **Stripe's clock** governs the subscription: the trial, the day-31 invoice, the charge. A Stripe test clock can fast-forward this.
- **Our clock** governs the check-ins. The Vercel cron computes days remaining against `window_end_date` using the server's real time. A Stripe test clock does not move it. At all.

So advancing a test clock 31 days produces the conversion charge and fires zero check-ins. That is expected, not a bug. To exercise the full arc you must drive both:

1. Give the scheduler a non-production "as of" date override, or backdate `launch_date` and `window_end_date` in the database, so the cron sees the day it should.
2. Advance the Stripe test clock separately for the billing events.

Build the override into the cron route now, gated to non-production. Testing the cadence without it means manually editing timestamps for every run.

---

## 1. Account and environment model

**Account:** Double Blaze is its own Stripe account, a sibling to Game View under the same login. Confirm with the CPA whether the legal entity on the account is Double Blaze Solutions LLC (the Virginia veteran-owned services entity that does the selling) or Garden Prayer Publishing LLC. This determines the tax ID, the payout bank account, and the name on customer statements, and it is painful to change once live subscriptions exist.

**Environments.** Three things, easy to confuse:
- **Sandbox:** an isolated environment with its own data. Uses `pk_test_` and `sk_test_` keys.
- **Test mode:** the account's built-in test environment. Also uses `pk_test_` and `sk_test_` keys.
- **Live mode:** real money. `pk_live_` and `sk_live_`.

Sandbox data and test-mode data do not flow to each other, and neither flows to live. Products, prices, customers, and webhook secrets are per-environment. Know which one you are in at all times.

**Keys.** The publishable key is safe client-side. The secret key is server-only: never behind `NEXT_PUBLIC_`, never in a client component, in any mode. Confirm `.env` and `.env.local` are gitignored before any key is committed. Rotate any key that has been pasted into a screenshot, chat, or ticket.

**Statement descriptor.** Set it to something unmistakably Double Blaze. On day 31 the customer sees this on their card statement, and an unrecognized descriptor is a leading cause of chargebacks. This matters more for Trail Run than for a normal SaaS, because the charge arrives a month after signup.

**Stripe Tax.** Enable it on this account. The Virginia and Texas registration question is still open with the CPA and is a go-live gate, not a footnote. Tax only gets collected where you have a registration configured.

---

## 2. Products and prices

### The four tiers (recurring, monthly)

| Tier | Price | Interval | Notes |
|---|---|---|---|
| Green Trail | $199 | month | Sell |
| Blue Trail | $499 | month | Run. Default for Trail Run. |
| Black Trail | $999 | month | Grow |
| Double Black | $1,499 | month | Scale |

Create one Product per tier with one recurring monthly Price. Create them with the `stripe-seed` script, not by hand in the dashboard, because you will need to recreate them in each environment and hand-copying Price IDs is how mismatches happen.

The 12-month minimum term is a contractual commitment captured at consent, not a Stripe construct. The Stripe object is a plain monthly subscription. Do not model the term as an annual price.

### Trailhead tips (one-time)

Presets are $100, $200, $350, plus name-your-own.

**Do not create Price objects for tips.** Collect the amount on our page, validate it server-side (reject zero, negative, and absurd values, and never trust a client-supplied amount), then pass it as inline `price_data` in a `payment`-mode Checkout Session. Creating a Price per tip permanently clutters the product catalog.

Do not use `submit_type: 'donate'`. A tip is not a charitable donation and that framing implies tax deductibility.

---

## 3. Webhook endpoints and events

One endpoint per environment. The signing secret is per-endpoint and per-environment, so a sandbox secret will not verify test-mode or live events.

Events the build needs:

**Trail Run signup (T1, setup mode)**
- `checkout.session.completed` where the session mode is `setup`. Provisions the org and the engagement, stores the payment method and the consent record. Must be idempotent on the SetupIntent id.
- `setup_intent.succeeded` as a backstop.

**Trail Run launch and window (T3)**
- `customer.subscription.created`
- `customer.subscription.updated` (tier swaps, trial changes)
- `customer.subscription.trial_will_end` (fires about 3 days before trial end). Log it, do not act on it. Our own scheduler drives the check-ins.

**Day-31 conversion (T4)**
- `invoice.payment_succeeded` and `invoice.paid`: the conversion landed. Move the engagement to converted, start the 12-month term.
- `invoice.payment_failed`: the off-session charge failed. This is the path that matters most. See section 5.
- `customer.subscription.deleted`: cancellation, including Stripe cancelling after failed retries.

**Trailhead tips**
- `checkout.session.completed` where the session mode is `payment`. Marks the tip completed. This is the only thing that may write a completed tip row.

**Risk monitoring**
- `charge.dispute.created`: a chargeback. Worth alerting on immediately, because for this program a dispute usually means the day-31 charge surprised someone, which is a signal the check-ins or the descriptor failed.

Use the Stripe CLI to forward events locally and to replay them. Verify the signature on every event and reject unsigned requests.

---

## 4. Test-clock scenarios

Test clocks let you freeze time and advance it, so subscriptions change state and fire webhooks without waiting. Attach the customer to the clock at creation, and any subscription for that customer travels with it.

Two limits worth knowing: you can advance only about two intervals at a time relative to the shortest subscription interval (for a monthly subscription, up to two months per advance, which is plenty for a 30-day window), and each clock caps how many customers and subscriptions can attach to it, so use one clock per scenario rather than piling them up.

Remember section 0: the clock does not move our scheduler. Drive the scheduler separately.

**Scenario A: the happy path.**
Freeze the clock. Sign up through `/trail-run` (SetupIntent, card saved, no subscription created, engagement in signup). Confirm no subscription exists and no charge occurred. Run the launch event. Confirm exactly one subscription exists on the saved payment method, `trial_end` equals launch plus 30, `live_url` is set, and the engagement is in `active_window`. Then, using the scheduler override, walk the days and confirm check-ins fire at 14, 7, 3, and 1, exactly once each. Then advance the Stripe clock past day 30 and confirm the invoice is created and paid at the correct tier and amount, and the engagement moves to converted with the 12-month term starting that day.

**Scenario B: the off-session authentication failure. Run this one deliberately.**
The day-31 charge happens with nobody present. If the card requires authentication, the charge fails. Use Stripe's 3D Secure test card (`4000 0027 6000 3184` triggers a 3DS flow for subscriptions and invoices) and pull the current full list from Stripe's testing docs rather than trusting any card number from memory. Advance past day 30 and confirm the failure is caught, `invoice.payment_failed` is handled, and the customer gets a clear recovery path with a link to authenticate or update their card. A silent lapse here is the worst outcome in the entire system.

**Scenario C: hard decline at day 31.**
Use a decline card (for example an insufficient-funds card). Advance past day 30. Confirm the retry and dunning behavior matches what you configured, and confirm the customer is told rather than quietly losing the service.

**Scenario D: tier change during the window.**
Change tier at, say, day 10. Confirm the subscription item is updated with `proration_behavior: 'none'`, no proration invoice is generated during the trial, and the day-31 charge bills the new tier at the new amount.

**Scenario E: cancel before day 31.**
Cancel at day 20. Confirm the trialing subscription is canceled with zero charge, `cancellation_date` is set, `retention_expires_at` is 90 days out, and advancing the clock past day 31 produces no invoice and no charge. This is the single most important negative test in the program: a customer who cancelled must never be billed.

**Scenario F: the slow build.**
Sign up, but never launch. Advance the clock 60 days. Confirm no subscription is ever created and no charge ever occurs. This is what the SetupIntent architecture buys you, and it should be provable.

**Scenario G: Trailhead tip.**
No clock needed. Confirm a payment-mode Checkout Session with an inline amount completes, the tip is recorded once via webhook, an amount of zero or a negative amount is rejected server-side, and the customer's site stays live whether or not they tip.

---

## 5. Off-session failure handling

The day-31 charge is off-session by design: the card was saved 30-plus days earlier and the customer is not present. Plan for it to sometimes fail.

Decide and configure, before go-live:
- Stripe's retry (smart retries) schedule and how many attempts.
- What happens to the subscription after retries are exhausted: cancel, or leave unpaid.
- What happens to the customer's site or workflow. A billing failure is not the same as a cancellation, and the customer should get a chance to fix it before losing anything.
- The recovery email: from `yourteam@doubleblaze.solutions`, plain, with a one-click link to authenticate or update the card. Not a dunning threat. This is a customer who chose to stay.

Configure Stripe's automatic collection emails or send your own through Resend, but do not do both and do not do neither.

---

## 6. Sandbox to live cutover checklist

Nothing carries over. Work through this in order.

- [ ] CPA sign-off on the legal entity for the account, and on Virginia and Texas tax registration.
- [ ] Business details, bank account for payouts, and tax ID completed on the live account.
- [ ] Statement descriptor set and verified.
- [ ] Stripe Tax enabled in live, with registrations configured for the states you are actually registered in.
- [ ] Run the `stripe-seed` script against live to create the four tier Products and Prices. Do not hand-copy Price IDs.
- [ ] Live Price IDs into the production environment variables.
- [ ] Live secret and publishable keys into production environment variables. Secret key is server-only.
- [ ] Create the live webhook endpoint. Copy the new signing secret into production. It is different from every other environment's.
- [ ] Verify every event in section 3 is subscribed on the live endpoint.
- [ ] Verify `yourteam@doubleblaze.solutions` is a verified sender in Resend, and that `gardenprayerpublishing@gmail.com` never appears in any customer-facing header or copy.
- [ ] `CRON_SECRET` set in production, and the cron route returns 401 without it.
- [ ] The scheduler "as of" override is disabled or unreachable in production.
- [ ] `ANTHROPIC_API_KEY` set in production (server-only).
- [ ] Rotate any key that was exposed during development.
- [ ] Run one real end-to-end signup with a real card, at the lowest tier, on a real launch, and watch the first charge land. Refund it. There is no substitute for this.
- [ ] Alerting configured on `charge.dispute.created` and `invoice.payment_failed`.

---

## 7. Open items carried forward

1. **CPA:** legal entity on the Stripe account, Virginia and Texas tax registration, and treatment of Trailhead tips as business income.
2. **Dunning policy:** retry schedule, post-retry subscription behavior, and what happens to the customer's site during a billing failure.
3. **The scheduler time override:** build it into the cron route, gated to non-production, before attempting any cadence test.

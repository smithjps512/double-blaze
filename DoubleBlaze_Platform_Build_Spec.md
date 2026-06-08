# Double Blaze Platform — Build Spec & Sprint Plan

Working spec for the Double Blaze Solutions website plus the purchase-to-delivery workflow platform. Written to be taken into Claude Code and built in the repo. Style note: no em dashes. Confirm tax, billing-term, and entity items with a CPA and counsel before launch.

---

## 1. What we are building

One Next.js codebase on Vercel with three surfaces, separated by role:

1. **Marketing storefront** (public): promotes the brand and solutions, presents packages and a-la-carte pricing, and drives purchases and consultation requests. This is the lead-gen and revenue engine.
2. **Client portal** (authenticated client): account setup, the Spark intake, project brief acceptance, the project dashboard, deliverable approvals, communications, and the meeting calendar.
3. **Execution portal** (authenticated Double Blaze staff): incoming briefs, the project board, deliverable management, the project-lead calendar, and client communications. Project lead is James to start.

Two ecommerce contexts to keep distinct: (a) Double Blaze selling its own packages and projects through its own checkout (what this platform handles), and (b) the ecommerce features delivered to clients inside the Blue, Black, and Double Black packages (built per client as deliverables, tracked by the platform but not the same checkout).

---

## 2. Recommended stack

Aligned to the tooling you already use across products:

- **Framework**: Next.js (App Router), TypeScript, Tailwind CSS, deployed on Vercel.
- **Auth**: Clerk, with roles (`client`, `project_lead`, `admin`).
- **Database**: Supabase Postgres, row-level security per organization.
- **Payments**: Stripe (subscriptions for the monthly tiers, one-time payments for a-la-carte, plus the recurring maintenance fee). Enable Stripe Tax.
- **Email**: Resend, templated transactional email at each workflow step.
- **Spark (intake agent)**: an LLM-driven intake flow using the Anthropic API, capturing program-specific information and assembling the project brief. This reuses the pattern you proved with Game View's Spark (conversational capture, then assemble a structured artifact).
- **Brand tokens**: from the brand brief (Blaze Maroon `#630031`, Trail Orange `#CF4420`, Impact Orange `#B23A18`, Ridge Green `#2E4A3B`, Hokie Stone Gray `#75787B`, Stone White `#F6F4F1`, Ink `#1C1A19`).

---

## 3. Commercial model as data

Model the catalog in the database and mirror it in Stripe so pricing changes are not hard-coded.

### Monthly packages (12-month minimum term)
| Plan | Price/mo | Stripe price | Notes |
|---|---|---|---|
| Green Trail | $199 | recurring | Website refresh, basic ecommerce, social setup + 1 daily AI post |
| Blue Trail | $499 | recurring | Adds workflow automation, AI customer support, inventory, KPI dashboard |
| Black Trail | $999 | recurring | Adds monthly custom content by Double Blaze, promo and product updates |
| Double Black | $1499 | recurring | Adds monthly video reels, training platform, third-party app integrations |

### A-la-carte / project
| Item | Price | Type | Maintenance |
|---|---|---|---|
| Commerce site, client content | $1,500 | one-time | $29/mo |
| Commerce site, Double Blaze content | $4,500 | one-time | $29/mo |
| Workflow automation | $1,500 per workflow | one-time | none (client hosted) |
| Business dashboard (up to 15 metrics) | $2,500 | one-time | none (client hosted) |

### Billing notes (flag for setup)
- The 12-month minimum is a contract term. Stripe does not enforce a minimum term by itself. Implement it with a Stripe subscription schedule or a minimum-term acknowledgment at checkout plus an early-termination clause in the client agreement. Add a checkout checkbox capturing consent to the 12-month term.
- Maintenance ($29/mo) is a separate recurring price attached when an a-la-carte build is purchased.
- Turn on Stripe Tax and confirm Virginia treatment of these services and any SaaS components with your CPA.

---

## 4. Data model (core tables)

Names are a starting point. All tables carry `id`, `created_at`, `updated_at`, and org scoping where relevant.

- **organizations**: the client business (name, contacts, region, billing ids).
- **users**: linked to Clerk; role; organization (for clients) or staff flag.
- **subscriptions**: organization, plan, status, `term_start`, `min_term_end`, stripe ids.
- **orders**: organization, a-la-carte line items, amounts, stripe payment ids.
- **projects**: organization, source plan or order, status, assigned `project_lead`, dates.
- **intake_sessions**: project, program type, Spark transcript, captured fields (JSONB).
- **project_briefs**: project, content (JSONB), rendered summary, status (`draft`, `submitted_for_acceptance`, `accepted`), accepted_by, accepted_at.
- **deliverables**: project, title, description, `due_date`, status (`pending`, `in_progress`, `submitted`, `approved`, `changes_requested`), artifact links.
- **approvals**: deliverable, client_user, decision, comment, timestamp.
- **messages**: project, author, channel (`dashboard`, `email`), body, related event.
- **events**: project, type, actor, payload (the audit trail of step transitions).
- **meetings**: project, type (`kickoff`, `monthly_delivery`, `quarterly_review`), scheduled_at, status.
- **notifications**: user, type, read state, link.

---

## 5. The purchase-to-delivery workflow

Your nine steps mapped to system states, the actor, and what fires. Every transition writes an `events` row and, where noted, sends a Resend email and a dashboard notification.

1. **Choose and purchase**. Public storefront. Client selects a plan or a-la-carte item and checks out through Stripe (with the 12-month consent box for plans). On success, create `organizations`, `subscriptions` or `orders`, and a `projects` row in status `new`. Fire: purchase confirmation email.
2. **Confirmation and account setup**. Client is invited to create their account (Clerk) and complete their organization profile. Fire: account-setup email with a magic link. State: `account_setup`.
3. **Spark intake and brief generation**. Based on the purchased plan or item, Spark runs the matching question set, writes `intake_sessions`, and assembles a `project_briefs` record (status `submitted_for_acceptance`). State: `brief_ready`.
4. **On-site acceptance and routing**. Client reviews the brief in the portal and accepts it. On acceptance, the brief routes to the execution portal, the project moves to `accepted`, and an initial `deliverables` schedule is generated from the plan template. Fire: brief-accepted email to client and a new-project notification to the project lead.
5. **Kickoff and ongoing communication**. The project lead is prompted to schedule and hold an intro call (a `kickoff` meeting). State: `in_delivery`. Each subsequent step posts to the client dashboard and emails the client.
6. **Deliverable approval**. The project lead submits a deliverable (`submitted`); the client approves or requests changes (`approvals`). Approval advances the deliverable; changes loop it back. Fire: deliverable-ready and decision emails.
7. **Calendar for monthly cadence**. The project lead works against `meetings` of type `monthly_delivery` and deliverable `due_date`s to meet the monthly requirements of the plan.
8. **Monthly delivery communication**. On each monthly delivery, post to the dashboard and email the client a summary of what shipped.
9. **Quarterly reviews**. Auto-schedule a 45-minute `quarterly_review` every quarter, with reminders to both sides.

---

## 6. Spark intake to brief

- **Program-aware question sets**: each plan and a-la-carte item maps to a question set (for example, Green Trail asks about brand, pages, content readiness, and store basics; Double Black adds video, training, and integration targets).
- **Conversational capture**: Spark asks, the client answers, answers are stored as structured fields plus the raw transcript.
- **Brief assembly**: Spark composes a structured project brief (scope, deliverables, assets needed from the client, timeline, and open questions) saved as JSON and rendered for review.
- **Acceptance gate**: the client accepts the brief before anything routes to execution, which sets the scope and protects both sides.
- **Routing**: acceptance creates the project's deliverable schedule from the plan template and notifies the project lead.

---

## 7. Notifications (Resend templates)

Purchase confirmation, account setup, brief ready for acceptance, brief accepted, kickoff scheduled, deliverable submitted, deliverable decision, monthly delivery summary, quarterly review scheduled, and quarterly review reminder. Each email links to the relevant dashboard view.

---

## 8. Sprint plan

- **Sprint 0 — Foundation**: repo, Next.js + Tailwind + TypeScript, brand tokens, Clerk auth with roles, Supabase schema, deploy a skeleton to Vercel.
- **Sprint 1 — Storefront**: homepage (from the copy deck and mockup), services, solutions, pricing (packages + a-la-carte), about, and contact / start-a-project form with Resend notification. Ship this first; it earns business while the rest is built.
- **Sprint 2 — Commerce**: Stripe catalog, checkout for plans (with 12-month consent) and a-la-carte plus maintenance, purchase confirmation, and client account creation on purchase.
- **Sprint 3 — Spark intake**: program-aware question sets, intake sessions, brief generation, and client acceptance.
- **Sprint 4 — Execution portal**: project and deliverable models, project-lead board, kickoff scheduling, deliverable submission.
- **Sprint 5 — Client dashboard**: status, deliverable approvals, communications, KPI display, and the full email notification set.
- **Sprint 6 — Calendar and cadence**: monthly delivery flow, quarterly reviews, reminders, and polish.
- **Later**: client-facing KPI dashboards content, third-party integrations (DoorDash, Zillow, project tools), and the Double Black training platform.

---

## 9. Architecture and certification firewall

This platform is the operating system of Double Blaze Solutions, the certified veteran-owned services entity. Keep it on Double Blaze's own infrastructure, Supabase project, Clerk instance, and Stripe account, with payments flowing to Double Blaze. Do not run it on Garden Prayer's Trellis or any shared Garden Prayer infrastructure. The workflow here overlaps with Trellis patterns (deliverable acceptance, handoff, client communication), so reusing those patterns is smart, but reuse the design, not the shared system. If you want Double Blaze to actually run on Trellis, license it from Garden Prayer at arm's length and host it separately, so the independence behind the veteran-owned certification holds up.

---

## 10. Claude Code kickoff prompt

Point Claude Code at the repo and paste this to start Sprint 0 and Sprint 1:

```
You are building the Double Blaze Solutions platform. Read DoubleBlaze_Platform_Build_Spec.md
in the repo for full context, and the homepage copy deck and brand brief for content and tokens.

Stack: Next.js (App Router) + TypeScript + Tailwind, Clerk auth (roles: client, project_lead,
admin), Supabase Postgres, Stripe, Resend, deployed on Vercel.

Sprint 0: scaffold the Next.js app, add Tailwind with the brand color tokens (Blaze Maroon
#630031, Trail Orange #CF4420, Impact Orange #B23A18, Ridge Green #2E4A3B, Hokie Stone Gray
#75787B, Stone White #F6F4F1, Ink #1C1A19), set up Clerk with the three roles, create the
Supabase schema from section 4 of the spec with RLS, and deploy a skeleton to Vercel.

Sprint 1: build the marketing storefront. Start with the homepage exactly per the copy deck and
the approved layout (header, hero, proof bar, brand-idea band, four service cards, three solution
cards, why-us band, closing CTA, footer with clean entity attribution). Then services, solutions,
pricing (the four plans plus a-la-carte from section 3), about, and a start-a-project form that
sends a Resend email. Mobile-first, fast, accessible to WCAG 2.2 AA, with LocalBusiness schema.

Work sprint by sprint. After Sprint 1, stop and show me the deploy preview before continuing.
```

---

## 11. Open items

- Final product and plan names where bracketed.
- Whether past-client brands may be named in marketing (NDA check).
- Confirm Virginia tax handling for the packages and any SaaS components.
- Confirm the 12-month minimum enforcement approach and early-termination terms with counsel.
- Decide where the emergency-readiness app and other products live relative to this entity (per the firewall plan).

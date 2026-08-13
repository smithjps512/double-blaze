# Electric Grid: Build Plan

How the brief in [`brief.md`](./brief.md) gets
built, in the sessions-and-gates structure the client brief asks for. This
document holds Double Blaze's decisions; the brief holds the client's words.

Architecture context is [`CUSTOM-SITES-ARCHITECTURE.md`](../../CUSTOM-SITES-ARCHITECTURE.md).
This is the first paid site built on that platform, and the first conversion
from Trailhead to a paid engagement.

No em dashes anywhere in this document or any copy it generates.

---

## 1. What this actually is

The architecture doc scoped Electric Grid as a managed site with three
capability modules. The brief describes more than that: multi-role identity with
a time-boxed guest tier, a social graph, user-generated publishing across text
audio and video, a gated library with per-reader analytics, notification
preferences, and donation campaigns.

That is an application, not a site, and it is roughly three to four times the
original Phase 3 estimate. Recording that here so the estimate is corrected in
writing rather than discovered at a gate.

**The platform spine is unaffected.** `sites`, `site_versions`, `site_domains`,
and `site_assets` are still exactly right, and the renderer is still the right
way to build the marketing page. What grows is everything behind the login.

### The split

The build divides at the login boundary, because the halves have different
requirements.

- **The landing page is a site.** Blocks, the shared renderer, static HTML on
  the CDN. Marketing, SEO, fast, visual. Cheap to change forever.
- **Everything behind login is an application.** Postgres with RLS, real auth,
  server rendered. Shares the design system and the domain, not the rendering
  model. It lives in `apps/members`.

`apps/members` is built **multi-tenant from the first line**, not as Electric
Grid's application with tenancy added later. It resolves the club by hostname
the way the site runtime already does, and isolation is row-level security
rather than a separate deployment.

That is a deliberate commercial decision, not over-engineering. An association
member platform is a repeatable thing to sell, so the second club should be
configuration rather than a project, and a feature built for Electric Grid
becomes available to every client after them. See section 2a of the
architecture doc for why this beats one repository per client.

---

## 2. Scope decisions

Four decisions taken with James on review of the brief. Each was chosen as the
leanest option that still serves the brief's stated benefit.

| Decision | Choice | Consequence |
|---|---|---|
| **Media hosting** | Video embedded from YouTube/Vimeo; audio and documents self-hosted in Supabase Storage | Near-zero bandwidth cost and the fastest path to a working library. Video view counts live off-site, so unique-reader analytics cover written and audio articles only. Revisit a managed video service (Mux, Cloudflare Stream) when volume justifies the recurring cost. |
| **Discussion** | Reactions and comments on articles and events. No forums, no channels. | Serves the engagement goal at a fraction of the build. Lets real posting behavior be observed before building a place for it. Forums and channels appear in the brief's prose but not its feature table; they are deferred, not dropped. |
| **Profile visibility** | All admin-approved members see each other. Nothing public. | Matches a vetted professional network and directly serves "connect with members". **This supersedes the Trailhead intake**, which recorded a public roster. Publishing named utility professionals and their employers to the open web is not something to do by default. |
| **Article moderation** | Publish immediately; admins can remove, members can report | Members are already vetted at the door, so gating every post again taxes the activity the brief calls most critical. Removal plus a report path is the safety net. |

### Deferred, with the reason

- **Forums and topic channels.** Revisit once there is evidence members post.
- **Managed video hosting.** Revisit when embedding becomes the constraint.
- **Giving campaigns.** Not needed at launch. When built, the money belongs to
  the club, so it goes through Stripe Connect, never the Double Blaze account.
- **Multi-lingual.** The brief notes an international membership but states no
  translation requirement. English at launch. Keeping copy in the content layer
  rather than hardcoded means this stays a later addition, not a rewrite.

---

## 3. Open items that need a person, not a decision

These do not block the early sessions but do block launch.

1. **GDPR.** International membership with no geographic restriction means EU
   members, and the site holds names, employers, photos, career histories, and
   per-member reading analytics. Consent, data export, and deletion on request
   need to be built in, not retrofitted. Worth counsel alongside the CPA work
   the platform spec already flags.
2. **Antitrust and competition language.** Raised by James during the session 2
   copy review, and it shapes more than wording. Utilities operate under FERC
   and state regulators and are acutely sensitive to anything that reads as
   coordination between competitors, which is why "collaboration" was pulled
   from the headline in favour of "shared learning and publication".

   Three consequences worth carrying through the whole build rather than
   treating as a copy note:

   - **All public copy needs a pass for coordination language.** Words like
     collaborate, coordinate, align, agree, and standardize read differently in
     this industry than in most.
   - **The site needs a competition policy** alongside the non-solicitation
     policy the brief already calls for. Industry bodies routinely open
     meetings with an antitrust reminder, and the equivalent here is a standing
     policy a member agrees to at join, plus a visible reminder on events. This
     belongs in session 9 with the other policies.
   - **Topic framing matters.** The forum's own subject matter includes load
     growth, forecasting, and interconnection, which touch commercially
     sensitive ground. Discussing methods and published results is ordinary
     professional activity; discussing forward-looking plans, costs, or
     capacity between competitors is not. Where that line sits is a question
     for the club's counsel, not for Double Blaze, and the answer shapes the
     moderation policy and possibly the article review posture.

   Double Blaze is not giving legal advice here. The build should assume this
   gets reviewed by the club's counsel before launch, and the copy should be
   easy to change when it comes back.

3. **Analytics visibility and retention.** Per-article unique-reader tracking is
   member-level reading data. Who can see it and how long it is kept belongs in
   the policy a member agrees to at join.
3. **Nonprofit status.** Determines how giving is handled and taxed when it is
   built. The club's exposure, not Double Blaze's, but it shapes the build.
4. **Domain.** What it is, whether it exists, and who controls its DNS.
5. **The content area needs a name.** Flagged in the brief. Options to propose
   at the Session 5 gate.
6. **Guest tier mechanics.** Who invites a guest, how long access lasts, what
   expires when it does, and what they can still see afterward.
7. **Commercial terms.** One-time build plus the recurring hosting and
   maintenance line. Still the open item from the architecture doc, and now the
   thing standing between this brief and a proposal.

---

## 4. Sessions and gates

A gate is a point where a wrong assumption is expensive and a human is required
to verify. Gates are placed where automated testing genuinely cannot reach:
anything needing a real inbox, a real OAuth consent screen, a real file, or the
client's own eyes. Between gates the build continues without waiting.

Each session ends in a PR with migrations, tests, and documentation.

| # | Session | Gate |
|---|---|---|
| 1 | **Platform spine.** `sites`, `site_versions`, `site_domains`, `site_assets` with RLS. Block schema. Renderer promoted to a shared package. Publish to storage with pointer-swap and rollback. | None. Verified by tests. |
| 2 | **Marketing landing page.** The public site, built from blocks, served static. Design system and brand for the club. | **Yes.** Client reviews the look before anything is built on it. This is the content approval gate the Trailhead workflow already proves out. |
| 3 | **Identity and join.** Member, guest, and admin roles. OAuth and email sign-in. Invite path (no approval needed) and request path (admin approval required). Join questionnaire capturing employer and industry affiliation. Admin approval queue. | **Yes.** Needs a real inbox, a real Google consent screen, and a second human. The single most important gate in the build. |
| 4 | **Profiles and directory.** Photo upload, employer, career description, free-form section. First-login profile prompt. Member directory. | **Yes.** First real image upload end to end. |
| 5 | **Articles and media.** Written, audio, and embedded video. Article series. Author is the profile. Draft and publish. The gated library. | **Yes.** First real audio upload and a real embed. Content area naming decided here. |
| 6 | **Events.** Any member schedules. Topic, description, date required. Conferencing link and physical location optional. Invitations. | None. |
| 7 | **Engagement.** Member-to-member connections. Reactions and comments on articles and events. | None. |
| 8 | **Notifications.** New article, event invitation, connection request, approval decisions. Per-member preferences with opt-out. | **Yes.** Delivery has to be verified in a real inbox, and the platform now has the Resend bounce webhook to prove it. |
| 9 | **Admin console, policy, analytics.** Member and guest management, content removal, reports. Per-article total and unique reader counts. Site policies, non-solicitation, privacy, and the GDPR surfaces. | **Yes.** Policy copy needs the client's sign-off and probably counsel's. |
| 10 | **Domain and launch.** Custom domain with verification, canonical set to the primary hostname, `electricgrid.doubleblaze.solutions` 308ing to it. Final review. | **Yes.** Launch. |

### Why this order

Identity is the long pole and everything member-facing depends on it, so it
comes early. The marketing page sits ahead of it because it is a cheap, visible
validation that the spine works end to end, and it gives the client something to
react to while the harder work proceeds. Articles depend on profiles, since the
author is a profile. Notifications come after there is something to notify
about. Analytics and policy land together because they are the same
conversation.

---

## 5. The Trailhead record

`electricgrid` stays at status `preview` so the demo link keeps working through
the build. Its export bundle is the artifact that won the work and is worth
keeping outside the database.

At launch it becomes the conversion record: status `upgraded`, and once the
spine exists, the new `sites` row carries `source_trailhead_site_id` pointing at
it. That is what turns "Trailhead leads to paid engagements" from a story into a
query, which was the reason for running the Trailhead program in the first
place.

The `electricgrid` subdomain is never published. It goes demo, then reserved,
then a permanent redirect to the club's real domain.

# Double Blaze: Trailhead ("We work for tips")

No em dashes anywhere in this document or any copy it generates.

---

## 1. What Trailhead is

Trailhead is the free rung at the bottom of the Double Blaze ladder. Spark builds a simple marketing site or member site first, at no cost and with no card required. When it is ready, the customer sees it, and if they want to keep it they tip us whatever they think it was worth. They can also export the files and host it themselves, or upgrade to a paid package at any time.

It exists because people keep asking for a real site who do not sell online and do not need ecommerce: home businesses, clubs, community groups, associations, small nonprofits, hobby and interest groups. Green Trail is built for order-to-cash, so it is the wrong shape and the wrong price for them. Trailhead meets them where they are and puts them on the trail.

**The ladder:** Trailhead (tip) → Green Trail $199 (Sell) → Blue Trail $499 (Run) → Black Trail $999 (Grow) → Double Black $1,499 (Scale).

**Why it pays for itself:**
1. Upgrade pressure is built in. No custom domain and no ecommerce. The moment a Trailhead customer wants their own domain or wants to take money online, the upgrade is the obvious move, and it is one click.
2. Every site is a billboard. Each Trailhead site carries a "Built by Double Blaze" credit in the footer, removed on any paid tier. Free hosting for static sites costs almost nothing and buys distributed local lead generation.
3. It is the demo. The whole thesis of Double Blaze is that we automate businesses. A fast, high-quality free build is the loudest possible proof.

---

## 2. Scope and capacity

**In scope:** a simple marketing site or a member/club site. Up to 5 pages. Template-driven, built by Spark from the intake form. Hosted free at `chosen-name.doubleblaze.solutions`. Footer credit on every site.

**Not in scope, by design:** ecommerce or any payment collection, custom domain, third-party integrations, scheduling or booking, member dues or paid memberships, ongoing content changes or added features. Each of these is a paid tier, and that is the point.

**Capacity: 10 builds per month.** Show a live counter on the Trailhead page ("3 of 10 builds left this month"), which creates honest scarcity and is true. When the month is full, take waitlist signups for the following month rather than turning people away. If the waitlist grows into a real pipeline, that is the signal to build capacity, not to quietly slip on delivery.

---

## 3. Spark builds the site, and Spark knows its boundaries

Trailhead only works because Spark does the building. A human reviews and publishes. If this ever becomes bespoke hand-building, the economics collapse and the program should be capped or stopped.

Spark's hard boundaries on Trailhead. Spark must never build, promise, or imply any of these:
- Ecommerce, shopping carts, checkout, or any payment collection
- A custom domain (the site lives at a doubleblaze.solutions subdomain, full stop)
- Booking, scheduling, or appointment setting
- Member dues, paid memberships, or gated paid content
- Third-party integrations
- More than 5 pages
- Removal of the "Built by Double Blaze" footer credit

**How Spark handles an out-of-scope request.** Not with a cold refusal. An out-of-scope request is a buying signal, and Spark should treat it as one. Spark names plainly what Trailhead does not include, explains which package does include it, and offers the upgrade, which is automated and one click. If the request is genuinely custom and beyond the packages, Spark says we would be glad to price it and that someone will contact them directly, then flags it internally. The tone stays warm and helpful throughout. We are not saying no, we are pointing up the trail.

**Spark also detects out-of-scope intent in free text.** If an intake answer implies ecommerce, a domain, booking, or dues even when the customer did not ask directly, Spark flags it internally as an upgrade conversation. Non-blocking.

---

## 4. Workflow

1. **Select.** Visitor picks Trailhead from the Double Blaze site ("We work for tips").
2. **Intake.** They complete the Trailhead intake form (section 6). No card, no account friction. We capture their email. The chosen subdomain is checked for availability live.
3. **Route.** The completed intake routes internally to gardenprayerpublishing@gmail.com. The customer never sees that address. All customer-facing communication comes from yourteam@doubleblaze.solutions.
4. **Content approval, before any build.** Spark drafts the site messaging, page copy, and brand choices (colors, tone, structure) from the intake and sends it to the customer to review and approve. The customer edits and signs off on the words and the look here, at the cheap stage. Nothing is built until they approve. This gate is what makes the corrections-only policy in section 5 fair.
5. **Build.** Spark builds the site from the approved content and the selected template. A human reviews before anything is shown.
6. **Ready.** The customer is notified from yourteam@doubleblaze.solutions with a private preview link.
7. **Publish.** On acceptance, the site publishes at `chosen-name.doubleblaze.solutions`.
8. **Tip.** On publish, they receive the tip link. No obligation, and the site stays live either way.
9. **Their choice, anytime.** Keep it hosted free. Export the files and self-host. Or upgrade to a paid package.

---

## 5. Corrections, not revisions

Trailhead does not include revision rounds. It includes corrections.

**We fix our mistakes, always and without argument.** A misspelling, the wrong brand colors, messaging that does not match what the customer approved, a broken link, a factual error. These are our errors and we correct them promptly. This is a matter of pride, not policy.

**We do not do added features, redesigns, or open-ended changes.** Even the paid tiers limit this. The content approval gate in section 4 is what makes this fair: the customer defined and approved their messaging and look before we built anything, so the delivered site is what they signed off on.

**When someone wants more, we are supportive, not rigid.** We hear the concern, and we offer the paths: upgrade to a package (automated, they just pick one), or a custom build, which we will happily price and for which we will contact them directly for more detail. Most people who chose the tips option will not choose custom pricing once they see it is more than any package in front of them, and that is fine. The offer being real is what matters.

---

## 6. Tips

**Presets: $100, $200, $350, plus name-your-own.** Round numbers read as generous, calculated numbers read as an invoice. The top preset is a ceiling on your most enthusiastic customer, so it should be set high enough not to cap them.

**Anchor the value before showing the presets.** State plainly what a site like this normally costs to build, so the presets read as a bargain rather than an ask. The customer should be doing the arithmetic in our favor before they see a number.

**Tip later is a first-class option, not a fallback.** The tip link is permanent and lives in the customer's dashboard. Many people will want to tip once the site brings them their first customer or member, which is exactly the brand thesis applied to the tip itself: prove the value, then let them decide. Say so in the copy.

**No obligation, said plainly.** The site stays live whether they tip or not. A tip extracted by guilt is worth less than the trust it costs.

Mechanics: Stripe Checkout in payment mode, one time, not a subscription. Tips are business income, so confirm treatment with the CPA alongside the Virginia and Texas tax work.

---

## 7. Technical shape

**Subdomains.** Customer sites live at `chosen-name.doubleblaze.solutions`. This requires a wildcard DNS record and a wildcard domain on Vercel, plus middleware that resolves the subdomain to the site record and serves it. Note: the original sketch had this inverted as `doubleblaze.customername.solutions`, which is not a domain we control. The correct form is `customername.doubleblaze.solutions`.

Reserve a blocklist so customers cannot claim `www`, `app`, `api`, `mail`, `admin`, `portal`, `studio`, `docs`, `blog`, `status`, or anything colliding with a current or future Double Blaze route. Validate the chosen name (lowercase, alphanumeric and hyphens, no leading or trailing hyphen, length bounds) and enforce uniqueness at the database level.

**Footer credit.** Every published Trailhead site carries a "Built by Double Blaze" credit in the footer, linking to doubleblaze.solutions. It is removed automatically on upgrade to any paid tier. This is the growth engine, not a nice-to-have.

**Export.** The customer can request their files at any time and self-host. Deliver a static bundle (HTML, CSS, images, assets) as a zip. Export is free and is never gated on a tip. Charging for it, or holding files hostage, would contradict the entire brand.

**Upgrade.** A persistent upgrade path from the Trailhead dashboard into the paid packages, carrying their content forward. A Trailhead customer who upgrades is a warm lead who has already seen our work.

---

## 8. The Trailhead Intake Form

Structured so every section maps to a concrete build output, the same discipline as the Game View template intake form. Spark can run this conversationally or the customer can fill it as a form. Either way it produces the same structured brief, and it feeds the content approval gate in section 4.

### §0 Site identity → *sets up the site record*
- **Site name** (what this is called): ____
- **Chosen web address:** ____.doubleblaze.solutions *(checked live for availability)*
- **Site type:** simple marketing site · member or club site
- **Who you are:** home business · club or group · community organization · nonprofit · association · other: ____
- **Your email** (this is how we reach you): ____
- **Your name:** ____
- **Confirm:** I do not need to sell online or collect payments on this site. *(If they do, route them to Green Trail. This is the qualification gate.)*

### §1 The plain-language pitch → *drives the homepage and all site copy*
- **What you do or who you are, in one sentence:** ____
- **Who this site is for** (the visitor you most want to reach): ____
- **What you want a visitor to do** (pick the main one): learn about us · contact us · join us · visit us in person · find our schedule · other: ____
- **What makes you different, in your own words:** ____

### §2 Pages → *builds the sitemap, capped at 5*
Select up to 5:
- [ ] Home *(required)*
- [ ] About
- [ ] Services or What we do
- [ ] Members or Roster
- [ ] Events or Schedule
- [ ] Gallery or Photos
- [ ] Contact
- [ ] Other: ____

### §3 Content you have → *populates the build*
- **Logo:** upload · we should make you a simple one · none needed
- **Photos:** upload · none yet (we will use tasteful stock)
- **Existing copy or text:** paste or upload · none, write it for me
- **Hours** (if relevant): ____
- **Location or service area:** ____
- **Social links:** ____
- **Anything a visitor must see** (a policy, a schedule, a document): ____

### §4 Member or club specifics → *only shown for member sites*
- **How do people join:** open to anyone · request or application · invite only
- **Is there any fee to join:** no *(required for Trailhead)* · yes → *route to a paid tier, Trailhead does not handle dues*
- **Do you need a private or members-only area:** no · yes → *flag, exceeds Trailhead scope*
- **Roster or member list on the site:** no · yes, public · yes, names only

### §5 Look and feel → *selects the template and the brand choices*
- **Pick a look:** *(a small set of named template previews)*
- **Colors you like or must use:** ____ *(getting this right matters, wrong brand colors are the most common correction)*
- **A site you like the feel of** (paste a link): ____
- **Tone:** warm and friendly · clean and professional · bold and energetic · quiet and classic

### §6 How people reach you → *wires the contact path*
- **Where should contact-form messages go** (email): ____
- **Show a phone number:** no · yes: ____
- **Show a physical address:** no · yes: ____

### §7 Anything else → *catch-all, and the flag list*
- **Anything we should know:** ____
- **Anything you want that was not asked about:** ____ *(internal: anything here implying ecommerce, custom domain, booking, or dues is a flag and an upgrade conversation, not a Trailhead build)*

---

## 9. How this interacts with Trail Run

Trail Run is the first-month-free program for the paid tiers. Trailhead is free-and-tip for the simplest sites. Different offers for different customers, both saying the same thing: results before the bill.

A Trailhead customer who upgrades to a paid package goes through Trail Run normally, meaning they also get their first month free. That is not a loophole to close, it is a smooth ladder. The natural gate is that Trail Run requires a payment method on file and Trailhead does not, so an upgrade is a genuine step up in commitment.

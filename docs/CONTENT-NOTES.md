# Content notes

## Source documents (now in repo)

- `docs/homepage-copy-deck.md` — exact homepage copy. Integrated into
  `src/lib/content.ts`, `src/app/page.tsx`, the LocalBusiness schema
  (`src/lib/site.ts`), and SEO title/meta (`src/app/layout.tsx`).
- `docs/brand-brief.md` — voice and framing. Applied to the services,
  solutions, about, and pricing pages, plus `src/lib/brand.ts`.

Color tokens come from spec section 2; pricing from spec section 3
(`src/lib/catalog.ts`).

## Decisions to confirm before launch (from the deck)

- **NDA on named brands.** The proof bar and brand brief name Disney,
  Universal, the NFL, NASCAR, Procter & Gamble, etc., framed as the team's
  career experience, not Double Blaze projects. Confirm no NDA prevents naming
  them. If restricted, fall back to "Two decades of national-brand product
  experience." (`PROOF_POINTS` in `src/lib/content.ts`).
- **Garden Prayer attribution.** Currently omitted, which is the cleanest
  choice for the veteran-owned independence story. Keep omitted while the site
  only showcases the products as capability. If the site begins to sell or sign
  users up for products owned by Garden Prayer Publishing LLC, add a clear line
  ("Select products are offered through Garden Prayer Publishing LLC").
- **Phone number.** The deck's closing CTA reads "Call [phone] · [email]". No
  phone was provided, so the closing CTA currently shows the email only. Add the
  phone when available.

## Not yet done (deferred, deck items beyond this request)

- **"Work" nav item + page.** The deck nav is Services · Solutions · Work ·
  About. The current nav keeps Pricing in place of Work; no Work/portfolio page
  exists yet. Track-record content (brand brief) would live there and on About.
- **Start-a-project form microcopy.** The deck specifies fields
  (Name · Business · Email · Phone optional · What can we help you build?),
  button "Send project inquiry", and success "Thanks. We will be in touch
  within one business day." The form currently uses its own labels and adds an
  interest selector tied to the catalog. Align if desired.
- **Newsletter signup.** Deck microcopy exists; not built.
- **OG image.** Deck calls for the logo on Blaze Maroon with the tagline; no
  image asset is generated yet.

## Pricing

Pricing in `src/lib/catalog.ts` is from spec section 3 and should not change
without a corresponding spec/Stripe update. The homepage and services pages
surface the "Plans from $199 a month" entry line per the deck.

# Content notes

## Missing source documents

The Sprint 1 kickoff prompt referenced two documents that were **not present in
the repo** at build time:

1. **Homepage copy deck** ("build the homepage exactly per the copy deck")
2. **Brand brief** (for content and tokens)

The brand **color tokens** were available inside the build spec (section 2), so
those are exact. The homepage and page **copy**, the brand-idea framing, the
service/solution naming, and the proof points were written *to the brand* from
the spec, not transcribed from the deck.

## Where to swap in the real copy

When you provide the deck and brand brief, update:

- `src/lib/content.ts` — service cards, solution cards, why-us reasons, proof
  points. This is the primary content source for the homepage and the
  services/solutions pages.
- `src/lib/brand.ts` — tagline, legal/entity line, contact email, region.
- `src/app/page.tsx` — homepage section copy (hero headline, brand-idea band,
  CTA copy).
- `src/app/{services,solutions,pricing,about,start-a-project}/page.tsx` — page
  intros and supporting copy.

Pricing in `src/lib/catalog.ts` is taken directly from spec section 3 and should
not change without a corresponding spec/Stripe update.

## Claims to verify before launch

- **Proof points** in `content.ts` (e.g. "Veteran-owned", "Based in Virginia")
  must be verifiable. Remove or correct anything not yet true.
- Whether past-client brands may be named (NDA check, spec section 11).
- Final product/plan names where the spec left brackets (spec section 11).
- Virginia tax handling and the 12-month term language (confirm with CPA /
  counsel, spec sections 3 and 11).

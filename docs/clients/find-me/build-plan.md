# Find Me: Build Plan

How the brief in [`brief.md`](./brief.md) gets built. The brief holds the
client's words; this document holds Double Blaze's decisions. Where the build
actually stands is in [`status.md`](./status.md).

No em dashes anywhere in this document or any copy it generates.

---

## 1. What this actually is

The brief describes about seven products in one: adoption matching, a shelter
listing tool, a post-adoption care plan, lost and found, a vet network with an
AI assistant and emergency wait times, a social community with giving drives,
and an advertiser-funded game. Each of those is a real product. Built together
they would take many months and need partners we do not have yet (vets,
advertisers, a second shelter).

So we build it in phases, and each phase has to work on its own with real
users. **The core loop is adoption:** a shelter lists an animal, an adopter
finds it through matching, the adoption happens, and the QR code turns that
adopter into a long-term user through the care plan. Every later phase plugs
into an adopter or owner who is already using the app because of that loop.

## 2. Decisions

| Decision | Why |
| :---- | :---- |
| **Installable web app (PWA), not native apps, for launch.** | One codebase, works on any phone, no app store review, installs to the home screen, and supports push notifications on current iOS and Android. Native apps can wrap it later if the stores matter for discovery. |
| **Lives in this monorepo as `apps/find-me`.** | Same stack as our other client apps: Next.js, TypeScript, Tailwind, Supabase with row-level security, Resend, Vercel. Deploys on its own domain. |
| **Dogs and cats at launch; the data model is species-neutral.** | The brief says "animals" for shelters and owners. Matching questions branch by species. Rabbits and others can be enabled with no schema change. |
| **Shelter staff tool first, imports second.** | Partner shelters are not chosen yet. A phone-first "add an animal in under two minutes" tool works for any shelter. Once we know what software the partners use (ShelterLuv, PetPoint, Petfinder, RescueGroups, a spreadsheet), we add an import so they do zero double entry. The import is the real answer to "no extra work for shelters." |
| **Matching is transparent.** | Every match shows its reasons ("Low energy, fits your apartment", "Good with cats"). Adopters trust it more, and shelter staff can see why someone was matched. |
| **No breed in the match score.** | Breed labels at shelters are often guesses, and breed-based screening hurts the dogs who most need homes. We match on behavior and needs the shelter observes (energy, kids, dogs, cats, training). The one exception: an adopter can say their housing restricts size or breed, and that is applied as their filter, not ours. |
| **"Ask a Vet" is triage, never diagnosis.** | An AI that "diagnoses" is a liability for the client and a safety risk for the animal. It answers general care questions and sorts a symptom into "watch at home", "call your vet", or "go to the emergency vet now", and always hands off to a real vet. Phase 4. |
| **Shelters confirm adoptions made through the QR code.** | The new owner gets the care plan immediately on scan. The animal is only marked adopted when shelter staff confirm, so a mistaken or bad-faith scan cannot pull an animal off the site. |

## 3. Phases

### Phase 1: Adoption core (the MVP)

| Feature | Who | What "done" means |
| :---- | :---- | :---- |
| Browse | Anyone | Adoptable dogs and cats from partner shelters, with filters (species, size, age, good with kids/dogs/cats) and a page for each animal. No sign-in needed. |
| Match quiz | Adopter | About ten questions about home, schedule, activity, experience, other pets, kids, and dealbreakers. Takes under three minutes. Saved to their profile. |
| Matches | Adopter | Animals ranked by fit, each with a score and plain reasons. Dealbreakers remove an animal entirely instead of lowering its score. |
| Favorites and inquiries | Adopter | Save animals. Send "I'm interested" to the shelter with a short note; the shelter gets an email and sees it in their queue. |
| Shelter staff tool | Shelter staff | Add or edit an animal from a phone: photo, name, species, age, size, sex, temperament tags, bio. Mark it on hold or adopted. See and respond to inquiries. |
| Adoption QR code | Shelter staff, adopter | Each shelter has one printable QR code. The adopter scans it, picks their new pet from that shelter's list, and gets a care plan. Staff confirm the adoption. |
| Care plan and reminders | New owner | A plan built from species and age: feeding, first vet visit, vaccines, spay/neuter if needed, flea/tick and heartworm, microchip registration, training. Reminders by email, with in-app reminders on the dashboard. |
| Installable | Everyone | Web app manifest, home-screen icon, works well on a phone. |
| Admin | Double Blaze | Add a shelter, invite its staff. |

**Out of Phase 1 on purpose:** lost pets, messaging, community feed, vets,
game, sponsors, imports.

### Phase 2: Lost and found

Decided with the client's representative before building:

| Decision | Why |
| :---- | :---- |
| **Approximate public location.** The poster taps the exact spot; the public sees the center of a ~400 m grid cell, drawn as a circle. | An exact pin on a lost-pet post tells strangers where the owner lives. A fixed grid cell (not random noise) cannot be averaged out by reloading. The exact spot is shared with partner shelters only. |
| **Secret ID detail.** Every post records one private detail that is not in the photo or description. Anyone who replies must describe the pet, and the poster sees the answer beside their detail, with matching words highlighted. The answer cannot be edited later. | The common lost-pet scam is "I have your dog, send money first." Scammers cannot describe a detail they have never seen. Works both ways: finders use it to hand a pet only to its real owner. |
| **In-app conversations only.** No phone number, email, or address is shown anywhere. Email notices say "you have a message", never the content. | Keeps the conversation (and the safety reminder beside it) in the app, which is the brief's reason for posting in the app before social media. |
| **Partner shelters are alerted** by email on every new post, and see open posts (with exact spots and ID details) on their dashboard. | Shelters check intakes and scan microchips. Vets join in Phase 4. |
| **Found posts, with matching.** Lost and found posts are compared on species, distance (within 8 km), dates, size, sex, and color words. Impossible pairs are ruled out, not scored low. | Most reunions are a lost post meeting a found post. Matching uses public fields only, so suggestions never leak a private spot. |
| **Sharing goes back to the app.** Share card image, copy link, Facebook, native share, and a printable flyer with a QR code instead of a phone number. | Public reach without public contact details. |
| **Maps: Leaflet on OpenStreetMap tiles.** No API key. | Free and fine at launch volume. OSM's tile policy limits heavy use; move to a paid tile provider (MapTiler, Stadia, Mapbox) before real scale. |

Not in Phase 2: neighbor alerts by area (needs home locations and opt-in),
push notifications, and vet alerts (Phase 4).

### Phase 3: Community and giving

Photo and story posts about owned pets and shelter pets ("Share this dog"),
shelter spotlights, and food drives with drop-off points and progress meters.
Needs moderation tools and reporting before it opens.

### Phase 4: Vet network

Vet and emergency vet directory, emergency vet availability and posted wait
times (set by the clinic), appointment requests, and the Ask a Vet triage
assistant built on the Anthropic API, with a clear "this is not a diagnosis"
frame and one-tap call buttons.

### Phase 5: Learning game and sponsors

A short, mobile game about pet care and local shelters that features real
adoptable animals, with prize codes funded by advertisers. Players under 13
bring COPPA rules into play, so the game is designed to run without collecting
personal data from kids, and prizes are claimed by a parent account.

## 4. Matching

Two layers.

**Dealbreakers (filters).** An animal is left out entirely if it fails one:

- Wrong species, or the adopter's size limit (often set by a lease).
- The adopter has kids under 10 and the animal is marked "not with kids".
- The adopter has a dog (or cat) and the animal is marked "not with dogs"
  (or cats).
- The adopter is not home for long stretches and the animal needs someone home
  most of the day (e.g. a young puppy or a medical case).

"Unknown" never filters. It shows as "ask the shelter" in the reasons.

**Fit score (0 to 100).** Weighted criteria, each scored 0 to 1:

| Criterion | Compares |
| :---- | :---- |
| Energy | Animal energy level vs adopter activity level |
| Size | Animal size vs adopter preference |
| Age | Animal age group vs adopter preference |
| Experience | Animal training and behavior needs vs adopter experience |
| Home | Animal needs (yard, space) vs home type |
| Time alone | Hours the adopter is away vs how well the animal handles it |
| Grooming | Coat care needs vs adopter tolerance |
| Compatibility bonus | Confirmed good with the kids or pets the adopter has |

The weights live in one file (`apps/find-me/src/lib/matching.ts`) with unit
tests, so they can be tuned with shelter staff feedback without touching the
rest of the app. Long-stay animals can get a small, clearly labeled visibility
boost later if the shelters want it; we would not hide it inside the score.

## 5. Data model (Phase 1)

All tables are prefixed `fm_` in the shared Supabase project and have
row-level security.

- **fm_shelters**: name, slug, city, contact email, phone, website, adoption
  code (the QR code target), active.
- **fm_staff**: user and shelter, role (`staff`, `manager`).
- **fm_profiles**: user, display name, role flags (`is_admin`).
- **fm_animals**: shelter, species, name, sex, age group, birth date
  (approximate), size, breed label, energy, coat care, good with kids / dogs /
  cats (`yes`, `no`, `unknown`), training needs, needs a yard, can be alone,
  special needs, bio, photos, adoption fee, status (`available`, `on_hold`,
  `adopted`), intake date.
- **fm_adopter_answers**: user, answers (jsonb, keyed by question id so a
  reworded question needs no migration), updated at.
- **fm_favorites**: user, animal.
- **fm_inquiries**: user, animal, shelter, message, status (`new`,
  `contacted`, `closed`).
- **fm_adoptions**: user, animal, shelter, pet name, claimed at, status
  (`claimed`, `confirmed`, `rejected`), confirmed by.
- **fm_care_tasks**: adoption, kind, title, details, due date, repeat interval
  in days, done at.

## 6. Roles and privacy

- **Anyone** can browse available animals and shelters.
- **Adopters** see only their own answers, favorites, inquiries, adoptions, and
  care tasks.
- **Shelter staff** manage only their own shelter's animals, and see
  inquiries and adoption claims for their shelter only. They see an adopter's
  name, email, and note for an inquiry, and not their quiz answers unless the
  adopter shares them with the inquiry.
- **Admins** (Double Blaze) manage shelters and staff.

Sign-in is an emailed one-tap link (same pattern as Paint Your Spot), so there
is no password to forget. Google sign-in can be added.

## 7. Things to raise with the client

1. **Partner shelters.** Who are the first one or two, and what software do
   they use today? This decides the import work.
2. **Name.** "Find Me" is a good working name. It also fits lost and found well.
   Check the domain and app store name before branding.
3. **Business model.** Who pays: shelters (probably not), sponsors and
   advertisers, grants and foundations, a premium tier for owners? This
   affects Phase 3 to 5 design, not Phase 1.
4. **Vet AI liability.** We recommend triage only, reviewed by a partner vet,
   with clear disclaimers. Confirm with counsel before Phase 4.
5. **Kids and the game.** COPPA applies to under-13 players. Plan for a
   parent account.
6. **Daily food and water alerts.** Daily push notifications for feeding tend
   to get muted within a week. We suggest the care plan covers feeding, and
   daily reminders are opt-in, while vet, vaccine, and medication reminders are
   on by default.
7. **Adoption incentives.** The brief mentions "extra value for people who
   adopt through the app." Ideas: a free first-visit exam from a partner vet,
   a starter kit from a sponsor, waived microchip registration.

## 8. Acceptance gate for Phase 1

- A shelter staff member adds a real animal from a phone in under two minutes.
- A new adopter goes from landing page to ranked matches in under five minutes.
- An inquiry reaches the shelter by email within a minute.
- Scanning the shelter QR code produces a care plan, and staff can confirm it.
- RLS tests prove an adopter cannot read another adopter's data and a shelter
  cannot edit another shelter's animals.
- Works on a mid-range Android phone and an iPhone over a slow connection.

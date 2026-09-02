# TrailRider: build architecture

Team: Chicken.nugg. Tool: Anvil.

## The buildable slice

Your plan is really five apps: a marketplace, a trail map, a messaging system, a
health AI and a music AI. That is too much, and the fix is not to work faster,
it is to choose. The good news is your stories are strong enough to choose from.

**In the slice, in this order:**

1. Sign in
2. Trail list with difficulty and reviews
3. Shop: browse listings
4. Shop: post a listing
5. Health AI with the 5 question limit

**Stubbed, and why:**

- **A real map.** A map needs an outside mapping service. A list of trails with
  name, difficulty, length and what it improves gives you everything your story
  asks for except the picture. Build the list. The map is a later upgrade.
- **A real AI.** Your health AI answers from a small table of question and
  answer pairs you write yourselves. **The 5 questions then locked for 48 hours
  rule is fully buildable and is the most interesting thing in your whole plan.**
  Build the limit properly, even with canned answers.
- **Music suggestions and the events page.** No user story, so nothing to build
  from.
- **Messaging.** Both your buy and sell stories end with "message the seller",
  and nobody wrote that story. Write it, then build it.

**Cash on pickup instead of in-app payment was a good decision.** It avoided
card handling, refunds and tax. Keep it.

## Screens to create

| Form name | What it is |
|---|---|
| `SignIn` | Sign in or sign up |
| `Trails` | List of trails |
| `TrailDetail` | One trail, its difficulty and reviews |
| `Shop` | All listings |
| `NewListing` | Post something for sale |
| `HealthAI` | Ask a question, see your remaining questions |

## Components, with the exact names to use

**SignIn:** `btn_sign_in`

**Trails:** `rp_trails` with `lbl_trail_name`, `lbl_difficulty`, `lbl_length`

**TrailDetail:** `lbl_name`, `lbl_difficulty`, `lbl_improves`, `rp_reviews`

**Shop:** `rp_listings` with `lbl_item`, `lbl_price`; `btn_new_listing`

**NewListing:** `txt_item`, `txt_price`, `dd_category`, `btn_post`, `lbl_error`

**HealthAI:** `txt_question`, `btn_ask`, `lbl_answer`, `lbl_questions_left`

## Data tables

- **trails**: `name`, `difficulty`, `length` (number), `improves`
- **listings**: `item`, `price` (number), `category`, `seller`, `posted` (date and time)
- **ai_answers**: `keyword`, `answer`
- **ai_usage**: `user`, `asked_count` (number), `locked_until` (date and time)

## How each feature gets built

### Feature 1: Sign in
Patterns: **12**, **4**.

### Feature 2: Trail list and detail
Patterns: **8**, **9** for the list. Then **1** and **4** to open the detail.

### Feature 3: Shop browse
Patterns: **8**, **11** (newest first), **9**.

Same three patterns as the trail list. You are meant to notice that.

### Feature 4: Post a listing
Patterns: **1**, **2**, **13**, **6**, **7**, **5**, **4**.

Your criteria say you need proof, a photo or receipt, and that you must be
logged in. The logged in check is Pattern 6 around `anvil.users.get_user()`.

### Feature 5: Health AI with the question limit
Patterns: **1**, **2**, **8**, **6**, **10**, **3**.

The order matters. Before answering, look up how many questions this user has
asked. If they are at 5, refuse and say when they can ask again. Otherwise
answer and add one to the count.

**Test it by asking six questions.** If the sixth one answers, the feature is
not built.

## What to do when you are stuck

1. Do not know what the app should do, go to your build card.
2. Do not know how to write it, go to the Pattern Book.
3. Do not know what fills the blank, come back here.

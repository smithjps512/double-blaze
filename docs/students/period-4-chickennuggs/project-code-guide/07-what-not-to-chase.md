# 7. What not to chase, and what the Figma decided

No em dashes anywhere in this document or any copy it generates.

A Figma prototype can draw anything, and an Anvil app is made from a fixed
set of parts so that a team of three can build one in a term. Half of
designing for a real material is knowing which parts of the drawing are the
building and which are the paint.

Two lists. The first is paint: things in your design to leave out, with what
to do instead. The second is things the design decided that your team has
not, and should, out loud, before anybody builds them.

## Leave these out

| In the Figma | Why not | Instead |
|---|---|---|
| The map, with the contour lines and the three markers | A map needs a map service, and your architecture already stubbed it. | The list of trail cards. The card under the map is the row. Page 3. |
| The photos fading into black | A CSS gradient over an image. No component. | The photo with a hard edge, or no photo. |
| The forest photo on the home screen | Fine to have, as an Image. | Have it if the export takes five minutes. Otherwise a dark screen with an orange name. |
| The elevation profile chart | A drawn line, and the numbers under it are not in your table. | Nothing. |
| The bottom tab bar | Anvil puts navigation in a column on the left. | Links in the navigation column: Trails, Shop, Coach. |
| The search bar on the map and the shop | A TextBox and a filter on the list. Buildable, but it is not in a story. | Leave it until a story asks for it. |
| The Expert, Intermediate, Beginner filter chips | Three Buttons and Pattern 8 with a condition. Buildable, and not in a story. | Same. A list of ten trails does not need a filter. |
| Two listings across in a grid | A RepeatingPanel is one column. | One column, the Recent Rides row shape. Page 4. |
| Add to cart | There is no cart. Cash on pickup, your plan says. | Click the row to see how to contact the seller. Page 4. |
| The Special Offer banner | A store's thing, and yours is a marketplace. | Nothing. |
| Star ratings on listings | No column, no story. | Nothing. |
| The bookmark button on a trail | No story for saving a trail. | Nothing, or write the story. |
| The floating orange plus button | Floats over the page with CSS. | The same orange pill, at the top of the shop, with words on it. |
| The RIDERS in orange and the TRAIL in white, in one word | A Label is one colour. | All orange. |
| The thin lines between the three stats | Drawn lines. | Nothing. The spacing does the job. |
| Drop shadows on the cards | Anvil cards are flat. | Nothing. The border does the job. |

If a designer on your team wants one of these badly, the thing to do is not
to argue about Anvil. It is to ask which of the two lists it belongs on, and
whether it is worth a lesson. Sometimes it is.

## Things the Figma decided that your team has not

**1. The app is a store.** Fox Racing and Giro Tech are selling, there is a
cart, there is a sale on. Your plan says Facebook Marketplace, riders selling
to riders, cash when you meet. These are two different apps and the second
one is the one with stories. The design's shape is fine; the words and the
button are not. Page 4.

**2. Three screens for features with no story.** Ride tracking, with live
speed and a GPS signal. A rider profile with badges and lifetime stats. A
community feed with posts, likes and comments. Not one of them has a user
story, and your plan does not mention a feed or ride tracking at all. They go
on a page called Later. If the team wants one of them, the price is a story
first, and ride tracking needs a phone's GPS, which a web app in a browser
cannot promise.

**3. No screen for the health AI.** The feature your architecture calls the
most interesting in your plan has no frame, no tab and no button. Page 5 is
the screen in words. Draw it.

**4. No sign in, no new listing.** The two screens a rider fills something
in on are the two the prototype skipped. Those are the screens where things
go wrong, which is why they are the ones that most need drawing.

**5. Nothing in the prototype opens the trail.** In the file's own code, Get
Started and the five tabs are wired and nothing else is. The trail card does
not open the detail, the back arrow does not go back, the listings do not
open, Start Ride goes nowhere. A prototype is screens plus arrows, and this
one is mostly screens. The designer's step 8.

**6. What the trail improves is missing.** Your story asks for it, your table
has it, the design shows elevation instead. Page 3.

**7. Numbers that are not true.** *4+ Trails. 85k Community Riders. 4.9 (42
reviews). 48 sessions. 542.4 mi.* The design tool made them up to fill space.
Take them off, or make each one true from a table.

**8. Squamish, BC.** The trail names, the park, the reviewer, the sellers
were all invented by the design tool, and it put your app in British
Columbia. Real content is rule 5 on Designing for Anvil: the trails near you,
the names of things people in your town would actually sell. The design
tool's words hide every problem a design has, because they are always the
perfect length.

**9. The name.** TrailRider on your plan, TRAILRIDERS on your Figma. One
letter, 44 pixels tall. Pick.

## Things to add to your architecture page

The Figma made three decisions the architecture page should catch up with,
so that the design brief, which is generated from it, tells the designer the
same thing these pages do.

| Add | Where | Why |
|---|---|---|
| `description`, text | `trails` table | The overview on TrailDetail. Your plan promises descriptions. |
| a `reviews` table: `trail`, `reviewer`, `posted`, `text` | Data tables | `rp_reviews` has rows now. Page 3. |
| `ReviewRow`: `lbl_reviewer`, `lbl_when`, `lbl_review` | TrailDetail components | The same. |
| `lbl_seller` | Shop, inside `rp_listings` | The row shows who is selling. `seller` is already a column. |
| a decision on photos | `listings` table, NewListing | Your seller story requires one. Page 4. |
| `Parts` | `dd_category` choices | Your plan says bikes, helmets, parts. |

Write the answers to 1, 2, 5 and 9 on your build cards. They are decisions,
and decisions that live only in a conversation get made twice.

# Running your site

Team: Classic Cars.

Your site is live. You did not write the code for it, and that is not the part
of this you were going to learn the most from anyway. What you have instead is
the thing almost nobody gets to see: **the console behind a real website**.

- The site: `/trail-crew/classic-cars`
- The admin: `/trail-crew/classic-cars/admin`

Your teacher has the passcode.

## What is actually happening

Every car on your site is a **row**. Every part is a row. Every quiz question is
a row. When somebody opens your site, the page is built out of those rows right
then, which is why changing one in the admin changes the site the moment you
save it. There is no separate step where somebody uploads a new version.

That is worth sitting with for a second, because it is the difference between a
website and a document. A document is a thing somebody made. A site like this is
a thing that gets *made again* every time somebody looks at it.

## Your four pages came from your four stories

Nothing on this site does something you did not ask for. Go and check:

| Your story | The page it became |
|---|---|
| Look through cool cars and their stats | The car list, and a page for each car |
| Read what each part of a car does | The parts library |
| Pick upgrades and watch the horsepower change | The builder |
| Take a quiz and find out my score | The quiz |

Your acceptance criteria are in there too. Your builder story said "you can take
an upgrade back off" and you can. Your quiz story said "it tells me how many I
got right" and it does.

This is the thing to notice about this whole unit: **the stories were the spec.**
Somebody who had never met you could build your app from that page.

## The first three things to do

1. **Replace the cars.** The four in there are placeholders we put in so the site
   was not empty on your first day. Picking the cars was your job and it still
   is. Delete ours, add yours. The "replace me" badge disappears the moment you
   edit one.
2. **Add photos.** Every car is sitting there saying "no photo yet", which looks
   exactly as unfinished as it is. Use pictures you are allowed to use.
3. **Read the parts pages and argue with them.** They were written for you. If
   something is wrong, or boring, or explained badly, change it. It is your site
   and your name is on it.

## Two things the admin will teach you if you let it

**The horsepower number is what puts a part in the builder.** Add a part and
leave the horsepower box empty and it gets a page but no tick box, which is
right for brakes. Type a number and it shows up in the builder worth that much.
Type zero and it shows up worth nothing, which is the truth about tires.

One number, in one place, changing three pages. That is what people mean when
they say data drives a site.

**Your quiz questions have to be answerable from your own parts pages.** Your
story says so. If you write a question nobody could get right from what you
wrote, either the question is unfair or the parts page is missing something.
Both of those are worth finding.

## About the passcode

One passcode, shared between the three of you. That means the site cannot tell
which of you added a car, and your teacher cannot take one person's access away
without changing it for everybody.

That is not a mistake, it is a trade, and plenty of small real sites make it.
The day you need to answer "who did this" is the day you build accounts. Now you
know what accounts are actually for, which is more than most people know.

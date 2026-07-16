import type { Metadata } from "next";
import Link from "next/link";
import { TrailheadIntakeForm } from "@/components/TrailheadIntakeForm";
import { TrailheadCapacity } from "@/components/TrailheadCapacity";

export const metadata: Metadata = {
  title: "Trailhead: We Work for Tips",
  description:
    "We build your site first, at no cost. When it is ready, you decide what it was worth. Tip us, or do not. Either way the site is yours.",
};

export default function TrailheadPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-blaze-maroon text-stone-white">
        <div className="container-page py-20 md:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-trail-orange/90">
            Trailhead, where every trail starts
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold sm:text-5xl lg:text-6xl">
            We work for tips.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-white/85">
            You do not sell online. You do not need a shopping cart. You just need
            a real site that looks like you mean it. So we will build it, at no
            cost, and when it is ready you decide what it was worth. Tip us, or
            do not. Either way the site is yours.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a href="#intake" className="btn-primary">
              Start my site
            </a>
            <a href="#how-it-works" className="btn-on-dark">
              See what we build
            </a>
          </div>
          <div className="mt-8">
            <TrailheadCapacity />
          </div>
        </div>
      </section>

      {/* Who this is for */}
      <section className="bg-stone-white">
        <div className="container-page py-16 md:py-20">
          <div className="mx-auto max-w-3xl">
            <p className="eyebrow">Who this is for</p>
            <h2 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">
              Simple sites for people who are not selling online.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink/75">
              Home businesses. Clubs. Community groups. Churches and associations.
              Teams, leagues, and hobby groups. Anyone who needs to be found,
              understood, and contacted, but is not selling anything online and
              should not be paying a monthly bill to have a website.
            </p>
            <p className="mt-4 text-ink/75">
              If you need to take payments, book appointments, or run your
              business through your site, that is{" "}
              <Link href="/pricing" className="font-medium text-impact-orange hover:text-blaze-maroon">
                Green Trail and up
              </Link>
              . This is not that. This is simpler, and it is free.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-ink/[0.03]">
        <div className="container-page py-16 md:py-20">
          <div className="mx-auto max-w-3xl">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">
              Six steps. A few minutes to start.
            </h2>
            <ol className="mt-8 space-y-6">
              {[
                {
                  num: "1",
                  title: "Tell us about it.",
                  body: "A short form, a few minutes.",
                },
                {
                  num: "2",
                  title: "You approve the words and the look.",
                  body: "We draft your messaging, your copy, and your colors, and you sign off before we build anything. Nothing gets built until it says what you want it to say.",
                },
                {
                  num: "3",
                  title: "We build it.",
                  body: "A real site, not a template you have to finish yourself.",
                },
                {
                  num: "4",
                  title: "We show you.",
                  body: "You get a private preview.",
                },
                {
                  num: "5",
                  title: "It goes live.",
                  body: "At the name you pick, yourname.doubleblaze.solutions.",
                },
                {
                  num: "6",
                  title: "You decide what it was worth.",
                  body: "Tip us, or do not. The site stays either way.",
                },
              ].map((step) => (
                <li key={step.num} className="flex gap-4">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-trail-orange text-sm font-bold text-stone-white">
                    {step.num}
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{step.title}</p>
                    <p className="mt-1 text-sm text-ink/70">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-8 text-ink/75">
              Want your own domain, a store, online booking, or a business that
              runs itself?{" "}
              <Link href="/pricing" className="font-medium text-impact-orange hover:text-blaze-maroon">
                Upgrade whenever you are ready.
              </Link>{" "}
              Everything you have carries over.
            </p>
          </div>
        </div>
      </section>

      {/* Why we do this */}
      <section className="bg-stone-white">
        <div className="container-page py-16 md:py-20">
          <div className="mx-auto max-w-3xl">
            <p className="eyebrow">Why we do this</p>
            <h2 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">
              We would rather show you than tell you.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink/75">
              We are not doing this to be nice. We are doing it because we would
              rather show you what we can build than tell you. Most of the
              businesses we work with started out exactly here: a good idea, no
              website, and no interest in paying a monthly bill to find out if it
              would help.
            </p>
            <p className="mt-4 text-ink/75">
              Build first. Prove it. Then let the customer decide. That is the
              whole company, and this is the purest version of it.
            </p>
          </div>
        </div>
      </section>

      {/* What you get / what you do not */}
      <section className="bg-ink/[0.03]">
        <div className="container-page py-16 md:py-20">
          <div className="mx-auto max-w-3xl">
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-bold text-ridge-green">You get</h3>
                <ul className="mt-3 space-y-2 text-sm text-ink/75">
                  {[
                    "A real, well-built site of up to five pages.",
                    "Free hosting at yourname.doubleblaze.solutions.",
                    "Your files, if you ever want them.",
                    "If we get something wrong, a misspelling, the wrong colors, copy that does not match what you approved, we fix it. Our mistakes are always our problem.",
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-ridge-green"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">
                  You do not get, and here is why
                </h3>
                <p className="mt-3 text-sm text-ink/75">
                  No custom domain and no online store. Those are what our paid
                  packages are for, and they start at $199 a month. If you want
                  them, we would love to build them. If you do not, this is
                  genuinely free and it is genuinely yours.
                </p>
                <Link
                  href="/pricing"
                  className="mt-4 inline-block text-sm font-semibold text-impact-orange hover:text-blaze-maroon"
                >
                  See paid packages
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The tip, said honestly */}
      <section className="bg-blaze-maroon text-stone-white">
        <div className="container-page py-16 md:py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold sm:text-3xl">
              The tip, said honestly.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-stone-white/85">
              A site like this normally runs a few thousand dollars to have
              built. You are going to pay whatever you think it was worth.
            </p>
            <p className="mt-4 text-stone-white/85">
              Suggested: $100, $200, $350, or name your own.
            </p>
            <p className="mt-4 text-stone-white/75">
              There is no minimum, and there is no catch. Your site stays live
              whether you tip or not. And you do not have to decide today. The
              tip link is permanent, so if this site brings you your first
              customer or your next ten members and you want to come back and tip
              then, it will still be there. Plenty of people do it that way, and
              we think that is the honest order of things: see the value, then
              decide.
            </p>
            <p className="mt-4 text-stone-white/75">
              If you would rather take the files and host them somewhere else,
              we will send them to you. No charge for that either.
            </p>
          </div>
        </div>
      </section>

      {/* Intake form */}
      <section id="intake" className="bg-stone-white">
        <div className="container-page py-16 md:py-20">
          <div className="mx-auto max-w-2xl">
            <p className="eyebrow">Start your site</p>
            <h2 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">
              Tell us about your site.
            </h2>
            <p className="mt-3 text-ink/75">
              No card, no account. Just tell us what you need.
            </p>
            <div className="mt-8">
              <TrailheadIntakeForm />
            </div>
          </div>
        </div>
      </section>

      {/* Objection handlers */}
      <section className="bg-ink/[0.03]">
        <div className="container-page py-16 md:py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-ink">Common questions</h2>
            <dl className="mt-8 space-y-6">
              {[
                {
                  q: "What is the catch?",
                  a: "There is not one. We think you will like the work enough to tip, and some of you will want a domain or a store later. That is the whole business model.",
                },
                {
                  q: "Do I have to tip?",
                  a: "No. The site stays live either way.",
                },
                {
                  q: "What if I want to move it later?",
                  a: "We will send you the files. No charge.",
                },
                {
                  q: "Why not just use a website builder?",
                  a: "Because you would be building it, not us. We do the work, you look at a finished site.",
                },
                {
                  q: "What if I need to sell online?",
                  a: "Then Trailhead is the wrong fit and Green Trail is the right one. We will tell you that up front rather than build you something that does not work.",
                },
                {
                  q: "What if I do not like it?",
                  a: "You approve the words and the look before we build, so it should not come to that. If we made a mistake, we fix it, no argument.",
                },
                {
                  q: "Can I add more to it later?",
                  a: "Yes, but not on Trailhead. Adding features means moving up to a package, which takes one click, or a custom build, which we will happily price for you. Just ask.",
                },
              ].map((item) => (
                <div key={item.q}>
                  <dt className="font-semibold text-ink">{item.q}</dt>
                  <dd className="mt-1 text-sm text-ink/70">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Listings } from "@/components/Listings";
import { InterestMeter } from "@/components/InterestMeter";
import { RULES, stepsFor } from "@/lib/content";
import { loadInterestCounts, loadSettings } from "@/lib/data";
import { deadlineInfo, toGoal } from "@/lib/settings";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  domain: "That account is not an @mcps.org account. Sign in with your school Google account to join in.",
  signin: "Sign in did not finish. Give it another try.",
  unconfigured: "Sign in is not switched on yet. Check back soon.",
};

function Cta({ signedIn, className = "" }: { signedIn: boolean; className?: string }) {
  const cls = `focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-tape px-7 py-4 font-display text-lg font-extrabold text-ink shadow-sign transition hover:-translate-y-0.5 hover:bg-tape-dark ${className}`;
  return signedIn ? (
    <Link href="/interest" className={cls}>
      I&apos;m interested <span aria-hidden>→</span>
    </Link>
  ) : (
    <a href="/auth/sign-in?next=/interest" className={cls}>
      I&apos;m interested <span aria-hidden>→</span>
    </a>
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, { viewer }, settings, counts] = await Promise.all([
    searchParams,
    getViewer(),
    loadSettings(),
    loadInterestCounts(),
  ]);
  const signedIn = Boolean(viewer);
  const goal = toGoal(settings.interest_goal);
  const deadline = deadlineInfo(settings.interest_deadline);
  const byWhen = deadline && !deadline.closed ? ` by ${deadline.label}` : "";
  const message = error ? ERRORS[error] : null;

  return (
    <>
      {message && (
        <div role="alert" className="bg-sold px-4 py-3 text-center text-sm font-medium text-chalk">
          {message}
        </div>
      )}

      {/* Hero */}
      <section className="asphalt overflow-hidden text-chalk">
        <div className="mx-auto grid max-w-content items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr_1fr] md:py-20">
          <div>
            <p className="inline-block -rotate-2 bg-tape px-3 py-1 font-stencil text-lg uppercase tracking-widest text-ink">
              Now accepting interest
            </p>
            <h1 className="mt-5 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Paint Your Spot
            </h1>
            <p className="mt-5 max-w-xl text-lg text-chalk/85 sm:text-xl">
              Prime BMS parking real estate could be hitting the market. Buy the rights to your spot, paint it
              however you like (within reason), and park on a masterpiece every morning.
            </p>
            <p className="mt-3 max-w-xl text-chalk/70">
              <span className="font-semibold text-tape">Where the money goes:</span> {settings.money_destination}
            </p>
            <p className="mt-3 max-w-xl text-chalk/70">
              <span className="font-semibold text-tape">The catch:</span> it only happens if enough staff want in.
              We&apos;re looking for {goal} hands{byWhen}.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Cta signedIn={signedIn} />
              <a href="#listings" className="focus-ring rounded px-2 py-1 font-semibold text-chalk underline decoration-tape decoration-2 underline-offset-8 hover:text-tape">
                See the listings
              </a>
            </div>
          </div>
          <figure className="relative">
            <div className="relative aspect-[4/3] -rotate-1 overflow-hidden rounded-2xl border-4 border-chalk shadow-2xl">
              <Image
                src="/examples/example-spot-lot.jpg"
                alt="A row of parking spots painted by Blacksburg High School students: a Dad Parking Only sign, blue waves, and a rainbow."
                fill
                priority
                sizes="(min-width: 768px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -left-3 rotate-[-6deg] rounded-md border-4 border-chalk bg-sold px-4 py-2 font-stencil text-2xl uppercase tracking-wider text-chalk shadow-sign sm:-left-6">
              For sale
            </div>
            <figcaption className="mt-8 text-right text-xs text-chalk/60">Spots from Blacksburg High School</figcaption>
          </figure>
        </div>
      </section>

      {/* Interest meter */}
      <section className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Is the market hot?</h2>
        <p className="mt-2 text-muted">
          No interest, no fundraiser. We&apos;re looking for {goal} staff{byWhen} before we plan anything else. Then the
          committee looks at the numbers and makes the call.
        </p>
        <div className="mt-8">
          <InterestMeter counts={counts} goal={goal} deadline={deadline} />
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-extrabold sm:text-4xl">How it works</h2>
        <p className="mt-2 text-muted">Step 1 is happening now. Steps 2 through 4 happen only if we reach the goal.</p>
        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stepsFor(goal, deadline?.closed ? null : deadline?.label ?? null).map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border-2 border-asphalt/10 bg-white p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-bms font-stencil text-2xl text-tape">
                {i + 1}
              </span>
              <h3 className="mt-4 font-display text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 rounded-xl border-l-4 border-bms bg-bms-light p-4 text-sm">
          <strong>About the art student option:</strong> if you request an art student, your extra goes to the BMS
          art department as a donation. It is never a payment to a student.
        </p>
      </section>

      {/* Listings */}
      <section id="listings" className="scroll-mt-4 bg-bms-light py-16">
        <div className="mx-auto max-w-content px-4 sm:px-6">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">The Listings</h2>
          <p className="mt-2 text-muted">What could go on the market, in the Front and Back lots. Prices get set if we reach the goal.</p>
          <div className="mt-8">
            <Listings settings={settings} isBoss={Boolean(viewer?.isBoss)} />
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="asphalt py-16 text-chalk">
        <div className="mx-auto max-w-content px-4 sm:px-6">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Comparable sales</h2>
          <p className="mt-2 text-chalk/70">Spots from Blacksburg High School, where this idea started.</p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <figure className="overflow-hidden rounded-2xl border-4 border-chalk bg-chalk text-ink md:col-span-2">
              <div className="relative aspect-[4/3]">
                <Image
                  src="/examples/example-spot-lot.jpg"
                  alt="A row of painted parking spots at Blacksburg High School: Dad Parking Only in red letters, blue and white waves, and a rainbow."
                  fill
                  sizes="(min-width: 768px) 66vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="px-4 py-3 text-sm font-medium">
                Spots from Blacksburg High School. Note the Dad Parking Only. Legally binding, probably.
              </figcaption>
            </figure>
            <div className="flex flex-col items-center justify-center rounded-2xl border-4 border-dashed border-chalk/40 p-8 text-center">
              <div aria-hidden className="flex h-28 w-20 items-center justify-center border-x-4 border-lane">
                <span className="font-stencil text-4xl text-tape">?</span>
              </div>
              <p className="mt-5 font-display text-2xl font-extrabold">Your spot here</p>
              <p className="mt-2 text-sm text-chalk/70">
                BMS photos go up as soon as the first spots are painted. Be the listing everyone screenshots.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rules */}
      <section className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <details className="group rounded-2xl border-2 border-asphalt bg-white shadow-sign">
          <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-6">
            <span>
              <span className="block font-display text-2xl font-extrabold sm:text-3xl">The fine print</span>
              <span className="mt-1 block text-sm text-muted">House rules, adapted from BHS. Tap to read.</span>
            </span>
            <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tape text-2xl font-bold transition group-open:rotate-45">
              +
            </span>
          </summary>
          <ol className="list-decimal space-y-3 px-6 pb-6 pl-12 marker:font-bold marker:text-bms">
            {RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </details>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-content px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-tape px-6 py-12 text-center sm:px-12">
          <h2 className="font-display text-3xl font-extrabold sm:text-5xl">Make it happen.</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink/80">
            This only goes ahead if enough staff want it. Two minutes, no payment, no commitment. Sign in with your
            MCPS Google account and tell us what you think.
          </p>
          <div className="mt-8">
            <Cta signedIn={signedIn} className="!bg-bms !text-tape hover:!bg-bms-dark" />
          </div>
        </div>
      </section>
    </>
  );
}

import Link from "next/link";
import { PRICE_TIERS, TRAIL_MAP, TRAIL_MAP_INCLUDES, formatPrice } from "@/lib/practice";
import { INTAKE_HREF } from "@/lib/site";

/**
 * Step 1 as a product (James, 2026-11-25): discovery and design bundled into
 * one document the client owns and can take to any qualified builder. The
 * full fee is credited toward Build when they build with us.
 */
export function TrailMapBand({ showCta = true }: { showCta?: boolean }) {
  const starter = PRICE_TIERS[0];
  return (
    <section className="bg-blaze-maroon text-stone-white">
      <div className="container-page grid gap-12 py-20 md:py-24 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <p className="eyebrow text-trail-orange/90">Step 1: the {TRAIL_MAP}</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Start with a map you own.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-stone-white/85">
            Every trail is easier with a guide and a good map. We learn where you
            are, design where you need to go, and hand you a {TRAIL_MAP}: a
            design and architecture document detailed enough for any qualified
            builder to price accurately.
          </p>
          <p className="mt-4 leading-relaxed text-stone-white/80">
            Take it to any builder you like, and we will help you run the bids
            and can manage the build for you. Or build with us: the full{" "}
            {TRAIL_MAP} fee is credited toward your Build and test fee. For
            software, apps, and games, the build itself is already included, so
            you pay only for program management.
          </p>
          <p className="mt-6 text-sm text-stone-white/70">
            {TRAIL_MAP} from{" "}
            <span className="font-semibold text-stone-white">
              {formatPrice(starter.trailMap)}
            </span>{" "}
            for a {starter.name} program.
          </p>
          {showCta && (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={INTAKE_HREF} className="btn-primary">
                Start your {TRAIL_MAP}
              </Link>
              <Link href="/pricing" className="btn-on-dark">
                See prices
              </Link>
            </div>
          )}
        </div>
        <div className="lg:col-span-6">
          <div className="rounded-2xl border border-stone-white/20 bg-ink/25 p-6 md:p-8">
            <h3 className="text-lg font-bold">What your {TRAIL_MAP} includes</h3>
            <ul className="mt-5 space-y-3 text-sm text-stone-white/85">
              {TRAIL_MAP_INCLUDES.map((item) => (
                <li key={item} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-trail-orange"
                  />
                  {item}
                </li>
              ))}
            </ul>
            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-stone-white/15 pt-5 text-sm">
              <div>
                <dt className="text-stone-white/60">Who owns it</dt>
                <dd className="mt-1 font-semibold">You do</dd>
              </div>
              <div>
                <dt className="text-stone-white/60">If you build with us</dt>
                <dd className="mt-1 font-semibold">100% credited</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

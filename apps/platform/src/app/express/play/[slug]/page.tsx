import type { Metadata } from "next";
import Link from "next/link";
import { getGame } from "@/lib/express-db";
import GamePlayer from "../../GamePlayer";

/** One Studio Express game, by its share link. */
export const metadata: Metadata = { title: "Studio Express game", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game) {
    return (
      <section className="bg-stone-white">
        <div className="container-page py-14">
          <h1 className="text-2xl font-bold">No game with that link</h1>
          <p className="mt-2 text-ink/70">Check the link, or find it on the list of today&rsquo;s games.</p>
          <Link href="/express/today" className="btn-primary mt-6 inline-block">
            Today&rsquo;s games
          </Link>
        </div>
      </section>
    );
  }
  const { spec, design } = game;
  return (
    <div className="bg-stone-white">
      <div className="container-page py-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-trail-orange">Studio Express</p>
        <h1 className="text-3xl font-bold">
          {spec.hero.emoji} {spec.title}
        </h1>
        <p className="text-ink/70">
          {spec.tagline} &middot; designed by {design.initials} at {design.studio}
        </p>
        <div className="mx-auto mt-5" style={{ maxWidth: "min(100%, calc((100vh - 235px) * 16 / 9))" }}>
          <GamePlayer spec={spec} />
        </div>
        <p className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link href="/express/today" className="font-medium text-blaze-maroon underline">
            More games from today
          </Link>
          <Link href="/express" className="font-medium text-blaze-maroon underline">
            Design your own
          </Link>
        </p>
      </div>
    </div>
  );
}

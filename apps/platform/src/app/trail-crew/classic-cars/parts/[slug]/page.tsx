import Link from "next/link";
import { notFound } from "next/navigation";
import { getPart } from "@/lib/showcase-db";
import { TEAM } from "../../team";
import s from "../../showcase.module.css";

/**
 * Story 2's detail page. Their three acceptance criteria are the three things
 * on it: its own page, what the part does in plain words, and what happens if
 * it is upgraded.
 */
export const dynamic = "force-dynamic";

export default async function PartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const part = await getPart(TEAM, slug);
  if (!part) notFound();

  return (
    <main className={`${s.wrap} ${s.narrow}`}>
      <Link href="/trail-crew/classic-cars/parts" className={s.back}>
        ← All parts
      </Link>

      <h1 className={s.pageTitle}>{part.name}</h1>

      <div className={s.prose}>
        <h2 className={s.subhead}>What it does</h2>
        <p>{part.whatItDoes || "Nobody has written this one yet."}</p>

        <h2 className={s.subhead}>If you upgrade it</h2>
        <p>{part.ifUpgraded || "Nobody has written this one yet."}</p>
      </div>

      {part.hpGain !== null && (
        <p className={s.footnote}>
          {part.hpGain === 0 ? (
            <>
              In the <Link href="/trail-crew/classic-cars/builder">builder</Link> this
              one adds nothing to the horsepower number, which is the honest
              answer and the most interesting square on that screen.
            </>
          ) : (
            <>
              In the <Link href="/trail-crew/classic-cars/builder">builder</Link> this
              one is worth <strong>+{part.hpGain} hp</strong>.
            </>
          )}
        </p>
      )}

      <Link href="/trail-crew/classic-cars/parts" className={s.back}>
        ← All parts
      </Link>
    </main>
  );
}

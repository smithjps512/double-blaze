import Link from "next/link";
import { notFound } from "next/navigation";
import { getCar } from "@/lib/showcase-db";
import { TEAM } from "../../team";
import s from "../../showcase.module.css";

/**
 * Story 1's detail page. "Clicking a car shows its year, top speed and
 * horsepower" and "you can get back to the list" are two of their three
 * acceptance criteria, so the back link is a requirement rather than a nicety.
 */
export const dynamic = "force-dynamic";

export default async function CarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const car = await getCar(TEAM, slug);
  if (!car) notFound();

  return (
    <main className={s.wrap}>
      <Link href="/trail-crew/classic-cars" className={s.back}>
        ← All cars
      </Link>

      <div className={s.detailFrame}>
        {car.imagePath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/showcase/media/${car.imagePath}`} alt={car.name} />
        ) : (
          <div className={s.noPhoto}>No photo yet</div>
        )}
      </div>

      <p className={s.eyebrow}>{car.year ?? "Year not set"}</p>
      <h1 className={s.pageTitle}>{car.name}</h1>

      <div className={s.specs}>
        <div className={s.spec}>
          <div>
            <span className={s.specValue}>{car.horsepower ?? "—"}</span>
            <span className={s.specUnit}>hp</span>
          </div>
          <div className={s.specLabel}>Horsepower</div>
        </div>
        <div className={s.spec}>
          <div>
            <span className={s.specValue}>{car.topSpeed ?? "—"}</span>
            <span className={s.specUnit}>mph</span>
          </div>
          <div className={s.specLabel}>Top speed</div>
        </div>
        <div className={s.spec}>
          <div>
            <span className={s.specValue}>{car.year ?? "—"}</span>
          </div>
          <div className={s.specLabel}>Year</div>
        </div>
      </div>

      {car.special && (
        <div className={`${s.narrow} ${s.prose}`}>
          <h2 className={s.subhead}>What makes it special</h2>
          <p>{car.special}</p>
        </div>
      )}

      <div className={s.narrow}>
        <p className={s.footnote}>
          Horsepower is the manufacturer&rsquo;s original factory rating and the
          top speed is approximate. Numbers on a car this old come from
          somewhere, and saying where is part of getting them right.
        </p>
      </div>

      <Link href="/trail-crew/classic-cars" className={s.back}>
        ← All cars
      </Link>
    </main>
  );
}

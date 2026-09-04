import Link from "next/link";
import { listCars, listParts, upgradeParts } from "@/lib/showcase-db";
import { TEAM } from "./team";
import s from "./showcase.module.css";

/**
 * Story 1, the car gallery: "I want to look through cool cars and their stats,
 * so that I can see which ones are fastest and why."
 *
 * Their acceptance criteria are the spec for this page: every car shows its
 * name and a picture, clicking a car shows its stats, and you can get back.
 */
export const dynamic = "force-dynamic";

export default async function CarsPage() {
  const [cars, parts] = await Promise.all([listCars(TEAM), listParts(TEAM)]);
  const upgrades = upgradeParts(parts);

  return (
    <main>
      <header className={`${s.wrap} ${s.hero}`}>
        <p className={s.eyebrow}>Classic Cars</p>
        <h1>
          Everybody says the engine is the loud bit. Almost nobody can tell you
          what it is doing.
        </h1>
        <p>
          Look through cars worth looking at, find out what each part under the
          hood actually does, then bolt things on and watch the horsepower move.
        </p>
      </header>

      <div className={s.wrap}>
        <div className={s.sectionHead}>
          <h2>The cars</h2>
          <p>{cars.length === 1 ? "1 car" : `${cars.length} cars`}</p>
        </div>

        {cars.length === 0 ? (
          <div className={s.empty}>
            <strong>No cars yet.</strong>
            This is where they go. Open the admin and add the first one.
          </div>
        ) : (
          <div className={s.grid}>
            {cars.map((car) => (
              <Link key={car.id} href={`/trail-crew/classic-cars/cars/${car.slug}`} className={s.card}>
                <div className={s.frame}>
                  {car.imagePath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/showcase/media/${car.imagePath}`} alt={car.name} loading="lazy" />
                  ) : (
                    <div className={s.noPhoto}>No photo yet</div>
                  )}
                </div>
                <div className={s.cardBody}>
                  <h3 className={s.cardName}>{car.name}</h3>
                  <p className={s.cardYear}>{car.year ?? "Year not set"}</p>
                  <div className={s.cardStats}>
                    <div className={s.stat}>
                      <span className={s.statValue}>{car.horsepower ?? "—"}</span>
                      <span className={s.statLabel}>Horsepower</span>
                    </div>
                    <div className={s.stat}>
                      <span className={s.statValue}>{car.topSpeed ?? "—"}</span>
                      <span className={s.statLabel}>Top speed</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className={s.sectionHead}>
          <h2>Under the hood</h2>
          <p>{parts.length} parts explained</p>
        </div>
        <p className={s.lede}>
          Six parts, in plain words, with what changes if you upgrade each one.{" "}
          {upgrades.length > 0 && (
            <>
              {upgrades.length} of them you can bolt on in the{" "}
              <Link href="/trail-crew/classic-cars/builder">builder</Link> and watch
              the number move.
            </>
          )}
        </p>
        <div className={s.partList}>
          {parts.slice(0, 4).map((part) => (
            <Link key={part.id} href={`/trail-crew/classic-cars/parts/${part.slug}`} className={s.partRow}>
              <h3 className={s.partName}>{part.name}</h3>
              <span className={s.chevron} aria-hidden>
                →
              </span>
            </Link>
          ))}
        </div>
        <p style={{ marginTop: 18 }}>
          <Link href="/trail-crew/classic-cars/parts" className={s.back}>
            All parts →
          </Link>
        </p>
      </div>
    </main>
  );
}

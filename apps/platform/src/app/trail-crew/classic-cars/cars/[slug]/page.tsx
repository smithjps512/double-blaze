import Link from "next/link";
import { notFound } from "next/navigation";
import { getCar, RESEARCH_FIELDS, sourcesForCar } from "@/lib/showcase-db";
import { TEAM } from "../../team";
import s from "../../showcase.module.css";

/**
 * A car's page.
 *
 * Story 1's acceptance criteria are still the floor here: the stats, and a way
 * back. Everything below them is the research the team did, and the reference
 * list at the bottom is the part that makes this worth sending to somebody.
 *
 * Only sections with something in them are rendered. A page that shows eight
 * empty headings looks broken; a short page looks unfinished, which is what it
 * is, and the gap is visible without being decorated.
 */
export const dynamic = "force-dynamic";

export default async function CarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const car = await getCar(TEAM, slug);
  if (!car) notFound();
  const sources = await sourcesForCar(TEAM, car.id);

  const specs = RESEARCH_FIELDS.filter((f) => !f.long).filter(
    (f) => (car[f.key] as string).trim().length > 0,
  );
  const histories = RESEARCH_FIELDS.filter((f) => f.long).filter(
    (f) => (car[f.key] as string).trim().length > 0,
  );

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

      {car.imagePath && car.imageCredit && (
        <p className={s.footnote}>
          {car.imageCredit}
          {car.imageSourceUrl && (
            <>
              {" · "}
              <a href={car.imageSourceUrl} target="_blank" rel="noopener noreferrer nofollow">
                source
              </a>
            </>
          )}
        </p>
      )}

      <p className={s.eyebrow}>
        {[car.manufacturer, car.year ? String(car.year) : ""].filter(Boolean).join(" · ") ||
          "Year not set"}
      </p>
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

      {specs.length > 0 && (
        <div className={s.narrow}>
          <h2 className={s.subhead}>Under the skin</h2>
          <ul className={s.partList}>
            {specs.map((field) => (
              <li key={field.key} className={s.partRow}>
                <span className={s.specLabel}>{field.label}</span>
                <span className={s.partName}>{car[field.key] as string}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {histories.map((field) => (
        <div key={field.key} className={`${s.narrow} ${s.prose}`}>
          <h2 className={s.subhead}>{field.label}</h2>
          {paragraphs(car[field.key] as string).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      ))}

      <div className={s.narrow}>
        <h2 className={s.subhead}>Where this came from</h2>
        {sources.length === 0 ? (
          <p className={s.footnote}>
            Nothing on this page has a source on it yet, which means you should
            not believe any of it.
          </p>
        ) : (
          <ol className={s.prose}>
            {sources.map((source) => (
              <li key={source.id}>
                <a href={source.url} target="_blank" rel="noopener noreferrer nofollow">
                  {source.title}
                </a>
                {source.covers && <> — {source.covers}</>}
              </li>
            ))}
          </ol>
        )}
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

/**
 * Blank lines become paragraphs, and nothing else is interpreted.
 *
 * Rendered as text rather than as markup: this content is typed and pasted into
 * a box by students, and a page that renders whatever arrives is a page that
 * renders whatever arrives.
 */
function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { loadPlants } from "@/lib/plant-showcase";

/**
 * The greenhouse: every plant third period is growing with the FarmBot.
 *
 * Content comes from markdown in `docs/plant-showcase`, read at build time.
 * Nothing runs at request time and nothing reads a database, for the same
 * reason the Trail Crew gallery does not: this page shows the work of minors.
 *
 * Plant names only. No student names, ever.
 */

export const metadata: Metadata = {
  title: "The Greenhouse: third period's plants",
  description:
    "Sixth graders are growing native plants with a FarmBot. Every plant here was researched, drawn and written up by the student growing it.",
  robots: { index: false, follow: false },
};

export default function GreenhousePage() {
  const plants = loadPlants();
  const withPhotos = plants.filter((p) => p.growth.some((entry) => entry.photo)).length;

  return (
    <>
      <PageHero
        eyebrow="The Greenhouse"
        title="Third period is growing these."
        intro="Every plant on this page was chosen, researched, drawn and written up by the sixth grader growing it. As the FarmBot brings them up, their photos go in the growth log."
      />

      <section className="bg-stone-white">
        <div className="container-page py-16 md:py-20">
          {plants.length === 0 ? (
            <p className="text-lg text-ink/70">
              No plants yet. Add a markdown file under{" "}
              <code className="rounded bg-ink/5 px-1.5 py-0.5 text-sm">docs/plant-showcase/plants</code>.
            </p>
          ) : (
            <>
              <p className="eyebrow">
                {plants.length} plants
                {withPhotos > 0 && `, ${withPhotos} with photos`}
              </p>

              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {plants.map((plant) => {
                  const latest = plant.growth.find((entry) => entry.photo);
                  const cover = latest?.photo ?? plant.drawing;

                  return (
                    <Link
                      key={plant.slug}
                      href={`/greenhouse/${plant.slug}`}
                      className="group flex flex-col overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm transition hover:border-trail-orange/40 hover:shadow-md"
                    >
                      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-ridge-green/5">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cover}
                            alt={
                              latest?.photo
                                ? `${plant.name} on ${latest.date}`
                                : `A student drawing of ${plant.name}`
                            }
                            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                          />
                        ) : (
                          <p className="px-6 text-center text-sm text-hokie-gray">
                            No picture yet
                          </p>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col p-6">
                        <h2 className="font-display text-xl font-bold text-blaze-maroon">
                          {plant.name}
                        </h2>
                        {plant.botanical && (
                          <p className="mt-1 text-sm italic text-hokie-gray">{plant.botanical}</p>
                        )}

                        <div className="mt-4 flex flex-1 flex-wrap items-end gap-1.5">
                          {plant.growth.length > 0 && (
                            <span className="rounded-full bg-ridge-green/10 px-2.5 py-1 text-xs font-medium text-ridge-green">
                              {plant.growth.length === 1
                                ? "1 growth update"
                                : `${plant.growth.length} growth updates`}
                            </span>
                          )}
                          {plant.missing.includes("care") && (
                            <span className="rounded-full bg-trail-orange/10 px-2.5 py-1 text-xs font-medium text-impact-orange">
                              Care page still coming
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

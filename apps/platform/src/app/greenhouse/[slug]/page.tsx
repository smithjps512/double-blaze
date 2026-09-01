import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { PlantProse } from "@/components/PlantProse";
import { loadPlant, loadPlants, type Plant } from "@/lib/plant-showcase";

/**
 * One plant: the two pages the student turned in, plus the growth log that
 * fills up as the FarmBot brings the plant on.
 *
 * The page never invents content. A section the student has not turned in says
 * so in plain words rather than being quietly hidden, because a visibly missing
 * care page is the thing that gets it written.
 */

export function generateStaticParams(): Array<{ slug: string }> {
  return loadPlants().map((plant) => ({ slug: plant.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const plant = loadPlant(slug);
  if (!plant) return { title: "Not found", robots: { index: false, follow: false } };

  return {
    title: `${plant.name}: third period's greenhouse`,
    description: `What a sixth grader learned about growing ${plant.name}, and how the plant is doing.`,
    robots: { index: false, follow: false },
  };
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function PlantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const plant = loadPlant(slug);
  if (!plant) notFound();

  return (
    <>
      <PageHero
        eyebrow="The Greenhouse"
        title={plant.name}
        intro={plant.botanical ? `Also known as ${plant.botanical}.` : undefined}
      >
        <Link
          href="/greenhouse"
          className="mt-6 inline-block text-sm font-medium text-trail-orange hover:text-stone-white"
        >
          Back to all plants
        </Link>
      </PageHero>

      {plant.warning && (
        <div className="border-b border-trail-orange/30 bg-trail-orange/10">
          <div className="container-page py-4">
            <p className="text-sm font-medium text-impact-orange">
              <span className="font-bold">Safety: </span>
              {plant.warning}
            </p>
          </div>
        </div>
      )}

      <section className="bg-stone-white">
        <div className="container-page grid gap-10 py-16 md:py-20 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div>
            <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-ink/10 bg-white">
              {plant.drawing ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={plant.drawing}
                  alt={`A student drawing of ${plant.name}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <p className="px-8 text-center text-sm leading-relaxed text-hokie-gray">
                  The drawing for this plant has not been scanned in yet.
                </p>
              )}
            </div>
            {plant.drawing && (
              <p className="mt-3 text-sm text-hokie-gray">Drawn by the student growing it.</p>
            )}
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-blaze-maroon">About this plant</h2>
            <div className="mt-5">
              {plant.about.length > 0 ? (
                <PlantProse blocks={plant.about} />
              ) : (
                <MissingSection what="plant page" />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-ink/10 bg-white">
        <div className="container-page py-16 md:py-20">
          <h2 className="font-display text-2xl font-bold text-blaze-maroon">How to care for it</h2>
          <div className="mt-5 max-w-3xl">
            {plant.care.length > 0 ? (
              <PlantProse blocks={plant.care} />
            ) : (
              <MissingSection what="care page" />
            )}
          </div>
        </div>
      </section>

      <GrowthLog plant={plant} />
    </>
  );
}

function GrowthLog({ plant }: { plant: Plant }) {
  return (
    <section className="border-t border-ink/10 bg-stone-white">
      <div className="container-page py-16 md:py-20">
        <h2 className="font-display text-2xl font-bold text-blaze-maroon">Growth log</h2>
        <p className="mt-2 max-w-2xl text-ink/70">
          Photos and notes from the greenhouse, newest first.
        </p>

        {plant.growth.length === 0 ? (
          <p className="mt-8 max-w-2xl rounded-xl border border-dashed border-ink/20 bg-white p-8 text-center leading-relaxed text-hokie-gray">
            Nothing planted in the log yet. The first entry goes in once this plant
            breaks the soil.
          </p>
        ) : (
          <ol className="mt-8 space-y-10">
            {plant.growth.map((entry) => (
              <li
                key={entry.date + entry.title}
                className="grid gap-6 border-l-2 border-ridge-green/30 pl-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-8"
              >
                <div>
                  <p className="font-display text-lg font-bold text-ridge-green">
                    {formatDate(entry.date)}
                  </p>
                  {entry.title && <p className="mt-1 text-ink/80">{entry.title}</p>}
                </div>

                <div>
                  {entry.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.photo}
                      alt={`${plant.name} on ${formatDate(entry.date)}`}
                      className="w-full rounded-xl border border-ink/10 bg-white object-cover"
                    />
                  ) : (
                    entry.photoName && (
                      <p className="rounded-lg border border-dashed border-trail-orange/40 bg-trail-orange/5 p-4 text-sm text-impact-orange">
                        This entry names a photo, {entry.photoName}, that is not in{" "}
                        <code>public/plant-showcase/{plant.slug}</code> yet.
                      </p>
                    )
                  )}
                  {entry.blocks.length > 0 && (
                    <div className="mt-4">
                      <PlantProse blocks={entry.blocks} />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function MissingSection({ what }: { what: string }) {
  return (
    <p className="rounded-xl border border-dashed border-trail-orange/40 bg-trail-orange/5 p-6 leading-relaxed text-impact-orange">
      This plant&rsquo;s {what} has not been turned in yet, so there is nothing to show
      here. It appears as soon as it is written.
    </p>
  );
}

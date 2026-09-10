import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { NameThatPlant } from "@/components/NameThatPlant";
import { loadSpecimens } from "@/lib/plant-id";

/**
 * Name That Plant: the classroom page where third period puts names on the
 * greenhouse photos that arrived without any.
 *
 * Unlike the rest of the greenhouse, this page is not static. It has to be,
 * because thirty people are writing to the same board at once. What has not
 * changed is the rule: no sign in, no student name, nothing stored that
 * identifies a child. A voter is a random token a browser keeps to itself so
 * one device cannot vote twice.
 *
 * Students reach it on a school Chromebook with nothing but the URL.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Name That Plant: third period's greenhouse",
  description:
    "Third period puts names on the greenhouse photos that arrived without any, and votes on which ones are right.",
  robots: { index: false, follow: false },
};

export default async function NameThatPlantPage() {
  // The first paint is server-rendered so the board is full the moment it
  // opens. The browser takes over once it knows its own voter token.
  const specimens = await loadSpecimens("");

  return (
    <>
      <PageHero
        eyebrow="The Greenhouse"
        title="Name that plant."
        intro="These photos came out of the greenhouse folder with no plant name on them. Put a name on one, or vote for a name somebody else put up. When a name wins and gets checked, that plant goes on the website."
      >
        <Link
          href="/greenhouse"
          className="mt-6 inline-block text-sm font-medium text-trail-orange hover:text-stone-white"
        >
          Back to all plants
        </Link>
      </PageHero>

      <section className="bg-stone-white">
        <div className="container-page py-12 md:py-16">
          {specimens.length === 0 ? (
            <p className="max-w-2xl rounded-xl border border-dashed border-trail-orange/40 bg-trail-orange/5 p-6 leading-relaxed text-impact-orange">
              The class list is not switched on yet. This page needs the database
              settings to be filled in before it can collect anything.
            </p>
          ) : (
            <NameThatPlant initial={specimens} />
          )}

          <p className="mt-10 max-w-2xl text-sm leading-relaxed text-hokie-gray">
            Nobody has to sign in and no names are collected, here or anywhere on
            this site. Each device gets one vote per plant and can change its mind.
          </p>
        </div>
      </section>
    </>
  );
}

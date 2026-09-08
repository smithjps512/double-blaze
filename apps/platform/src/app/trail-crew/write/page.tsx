import type { Metadata } from "next";
import Link from "next/link";
import gallery from "@/data/prototype-gallery.json";
import StoryStudio from "./StoryStudio";

/**
 * The story studio.
 *
 * A form rather than a text box, because the form is the teaching. A student
 * looking at empty boxes labelled "As a", "I want" and "so that" has already
 * been told the shape of a user story without anybody giving a speech, and the
 * box they leave blank is the one worth talking about.
 *
 * Everything on the right hand side is derived from what they type, by rule.
 * The test plan filling itself in as they write is the point: a criterion that
 * cannot be checked visibly produces nothing, and they can see that the problem
 * is in their sentence rather than in the tool.
 */
export const metadata: Metadata = {
  title: "Write a user story",
  description: "Write a story, watch its test plan appear, and see what it would take to build.",
  robots: { index: false, follow: false },
};

interface Entry {
  slug: string;
  productName: string;
  teamName?: string;
}

export default function WriteStoryPage() {
  const teams = (gallery as Entry[]).map((t) => ({
    slug: t.slug,
    label: t.teamName ? `${t.productName} (${t.teamName})` : t.productName,
  }));

  return (
    <div className="bg-stone-white">
      <section className="border-b border-ink/10 bg-white">
        <div className="container-page py-12 md:py-16">
          <p className="eyebrow">Trail Crew</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink md:text-4xl">
            Write a user story
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-ink/75">
            Fill in the boxes on the left. The test plan on the right builds
            itself as you type, out of what you wrote and nothing else. When a
            box is thin, the test plan goes thin with it, and that is the fastest
            way to find out your story is not finished yet.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/60">
            Nothing is saved until you send it, and nothing changes your team&rsquo;s
            documents until your teacher approves it. New to this?{" "}
            <a href="/build/writing-a-story.html" className="underline" target="_blank" rel="noopener">
              Read how a story works
            </a>
            , or go back to{" "}
            <Link href="/trail-crew" className="underline">
              all the teams
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="container-page py-10 md:py-14">
        <StoryStudio teams={teams} />
      </section>
    </div>
  );
}

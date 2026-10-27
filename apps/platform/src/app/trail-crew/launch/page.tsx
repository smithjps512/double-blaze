import type { Metadata } from "next";
import gallery from "@/data/launch-gallery.json";
import LaunchPad from "./LaunchPad";

/**
 * Launch Pad: sixth grade's one day introduction to planning a product.
 *
 * Teams write a purpose, their users, and three user stories for something
 * that would make a difference in their community. The teacher exports what
 * they wrote with `npm run launch:export`, touches it up in docs/launch, and
 * builds a prototype for each team with `npm run launch:prototypes`. Those
 * appear below the workspace, in their own gallery, apart from Trail Crew's.
 *
 * No logins, team names only. See docs/launch/README.md.
 */

export const metadata: Metadata = {
  title: "Launch Pad",
  description: "Start a plan for anything: purpose, users, and user stories.",
  robots: { index: false, follow: false },
};

interface LaunchEntry {
  slug: string;
  productName: string;
  teamName?: string;
  period?: number;
  purpose: string;
  href: string;
  example?: boolean;
  demoHref?: string;
}

const all = gallery as LaunchEntry[];
const entries = all.filter((e) => !e.example);
const example = all.find((e) => e.example);

export default function LaunchPage() {
  return (
    <>
      <LaunchPad exampleHref={example?.href} />
      {entries.length > 0 && (
        <section className="border-t border-ink/10 bg-white">
          <div className="container-page py-12">
            <p className="eyebrow">You wrote it. Here it is.</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-bold text-ink">Your prototypes</h2>
              <a href="/play" className="btn-primary">
                Play them all and QA them at /play
              </a>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-ink/70">
              Every screen in these came from a purpose, a user, or a story a team wrote. Find yours, click around, and notice what is missing.
              That is where next time starts.
            </p>
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {entries.map((e) => (
                <div key={e.slug} className="flex flex-col rounded-xl border border-ink/10 bg-stone-white p-5 shadow-sm">
                  <span className="font-display text-xl font-bold text-blaze-maroon">{e.productName}</span>
                  <span className="text-sm text-hokie-gray">
                    {e.teamName}
                    {e.period ? ` · Period ${e.period}` : ""}
                  </span>
                  <span className="mt-3 flex-1 text-sm text-ink/75">{e.purpose.length > 180 ? `${e.purpose.slice(0, 179).trimEnd()}...` : e.purpose}</span>
                  {e.demoHref && (
                    <a href={e.demoHref} target="_blank" rel="noopener" className="btn-primary mt-4 text-center">
                      Open the working app
                    </a>
                  )}
                  <a href={e.href} target="_blank" rel="noopener" className="mt-3 font-medium text-blaze-maroon underline underline-offset-2">
                    Open the prototype
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

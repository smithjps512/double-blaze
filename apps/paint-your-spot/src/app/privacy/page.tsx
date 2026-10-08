import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

/**
 * Plain language, and only what the app actually does. Google requires a
 * privacy policy link before the sign-in app can leave testing mode.
 */
export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="font-stencil text-lg uppercase tracking-widest text-bms">The fine print, part two</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold">Privacy</h1>
      <p className="mt-2 text-sm text-muted">Last updated October 7, 2026</p>

      <div className="mt-8 space-y-6 leading-relaxed [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold">
        <p>
          Paint Your Spot is a staff fundraiser run by the Blacksburg Middle School Beautification Committee. This
          site is only for BMS staff, and it collects as little as it can.
        </p>

        <section>
          <h2>What we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>
              From Google sign-in: your name and your @mcps.org email address. Nothing else from your Google account.
            </li>
            <li>
              Your survey answers: role, interest level, which listings interest you, preferred lot, who would paint,
              price comfort, and any comments you write.
            </li>
          </ul>
        </section>

        <section>
          <h2>Who sees it</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>The site admin for the committee sees your name, email, and answers.</li>
            <li>Everyone else sees only totals, like how many staff said I&apos;m in. Never names.</li>
            <li>We do not sell or share your information, and there are no ads or trackers on this site.</li>
          </ul>
        </section>

        <section>
          <h2>How it is used</h2>
          <p className="mt-2">
            Only to decide whether the fundraiser happens and to plan it. If you sign up, we may email you about it.
          </p>
        </section>

        <section>
          <h2>Where it is stored</h2>
          <p className="mt-2">
            Answers are stored in a secured database run by Double Blaze Solutions, the company that built this site.
            Access is limited by account, so staff can read only their own answers.
          </p>
        </section>

        <section>
          <h2>How long we keep it</h2>
          <p className="mt-2">
            Until fundraiser planning is finished, then it is deleted. Want your answers removed sooner? Ask the
            committee and we will delete them.
          </p>
        </section>

        <section>
          <h2>Questions</h2>
          <p className="mt-2">Contact James Smith at Blacksburg Middle School.</p>
        </section>
      </div>
    </article>
  );
}

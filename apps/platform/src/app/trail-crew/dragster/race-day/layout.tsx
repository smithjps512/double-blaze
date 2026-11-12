import type { Metadata } from "next";
import Link from "next/link";
import SignOut from "./SignOut";
import { isOpenToAll, isTeacher } from "@/lib/race-day/auth";

/**
 * Race Day: the real race, timed from video, for the class only.
 *
 * Every page under here checks the class password itself (see Gate.tsx and
 * src/lib/race-day/auth.ts); this layout only adds the shared header and
 * keeps search engines and link previews away. No em dashes in any copy here.
 */

export const metadata: Metadata = {
  title: { absolute: "Race Day" },
  description: "Class only.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  openGraph: null,
  twitter: null,
  alternates: { canonical: null },
};

const NAV = [
  { href: "/trail-crew/dragster/race-day", label: "Leaderboard" },
  { href: "/trail-crew/dragster/race-day/lesson", label: "Video vs. gate" },
  { href: "/trail-crew/dragster/race-day/reflection", label: "Reflection" },
  { href: "/trail-crew/dragster/race-day/teacher", label: "Teacher" },
];

export default async function RaceDayLayout({ children }: { children: React.ReactNode }) {
  // Only the teacher sees this, as a reminder to lock up after a sub day.
  const openReminder = isOpenToAll() && (await isTeacher());
  return (
    <div className="min-h-screen bg-stone-white">
      <div className="border-b border-ink/10 bg-white">
        <nav className="container-page flex flex-wrap items-center gap-x-5 gap-y-2 py-3 text-sm" aria-label="Race Day">
          <span className="font-semibold text-blaze-maroon">Race Day</span>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-ink/75 hover:text-trail-orange">
              {n.label}
            </Link>
          ))}
          <Link href="/trail-crew/dragster" className="text-ink/75 hover:text-trail-orange">
            Dragster Lab
          </Link>
          <span className="ml-auto">
            <SignOut />
          </span>
        </nav>
      </div>
      {openReminder && (
        <p className="border-b border-trail-orange/40 bg-trail-orange/10 py-2 text-center text-sm">
          Class pages are open with no password (RACE_DAY_OPEN is on). Delete RACE_DAY_OPEN in Vercel and redeploy to lock them again.
        </p>
      )}
      {children}
    </div>
  );
}

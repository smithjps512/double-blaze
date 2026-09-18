import type { Metadata } from "next";
import Link from "next/link";
import { AS_OF } from "@/data/yamal";
import s from "./tracker.module.css";

/**
 * The Lamine Yamal tracker.
 *
 * A classroom demo of what an AI can do for a sports fan. Not a student
 * team's project and not a Double Blaze product page: it is the thing shown
 * to a room full of Yamal fans to make the point that reading, checking and
 * laying out a pile of numbers is exactly the kind of work an AI does well,
 * and that the fan still has to decide whether to believe it.
 *
 * The numbers live in one file, `src/data/yamal.ts`, and every page says the
 * date they were true. Nothing here is live.
 */

export const metadata: Metadata = {
  title: "Lamine Yamal tracker",
  description:
    "Every team Lamine Yamal has played for and his key numbers at each one, checked against the reporting and dated.",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/trail-crew/yamal", label: "Overview" },
  { href: "/trail-crew/yamal/seasons", label: "Seasons" },
  { href: "/trail-crew/yamal/teams", label: "Teams" },
];

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.site}>
      <nav className={s.bar}>
        <Link href="/trail-crew/yamal" className={s.wordmark}>
          Yamal<span>Tracker</span>
        </Link>
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className={s.navLink}>
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
      <footer className={s.foot}>
        <p>
          Numbers as of {AS_OF}. Built as a Trail Crew demo of AI in sports.{" "}
          <Link href="/trail-crew">See what every team is building</Link>.
        </p>
      </footer>
    </div>
  );
}

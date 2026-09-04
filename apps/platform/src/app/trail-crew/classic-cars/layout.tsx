import type { Metadata } from "next";
import Link from "next/link";
import s from "./showcase.module.css";

/**
 * The Classic Cars site.
 *
 * Built here rather than in Anvil because this team is three people with no
 * developer among them. What they get instead of writing the code is the half
 * of the web nobody shows a thirteen year old: the console behind the site,
 * where adding a row makes a public page change.
 *
 * Every page follows one of the four user stories in their plan, down to the
 * acceptance criteria. Nothing on this site does something they did not ask
 * for, because the point of showing it to the class is that a plan and a set of
 * stories are what a site gets built from.
 */

export const metadata: Metadata = {
  title: "Classic Cars",
  description:
    "Cool cars, what every part under the hood actually does, and what happens to the horsepower when you start bolting things on.",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/trail-crew/classic-cars", label: "Cars" },
  { href: "/trail-crew/classic-cars/parts", label: "Parts" },
  { href: "/trail-crew/classic-cars/builder", label: "Builder" },
  { href: "/trail-crew/classic-cars/quiz", label: "Quiz" },
];

export default function ShowcaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.site}>
      <nav className={s.bar}>
        <Link href="/trail-crew/classic-cars" className={s.wordmark}>
          Classic<span>Cars</span>
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
          Built in class by the Classic Cars team.{" "}
          <Link href="/trail-crew">See what every team is building</Link>.
        </p>
      </footer>
    </div>
  );
}

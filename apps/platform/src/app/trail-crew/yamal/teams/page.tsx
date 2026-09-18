import Link from "next/link";
import { TEAMS } from "@/data/yamal";
import s from "../tracker.module.css";

/**
 * Every team, oldest first: the neighbourhood club, the academy, four Spain
 * age groups, Barcelona, Spain. Each opens to its own page with his numbers
 * there, or with a plain statement that there are none worth trusting.
 */

const KIND_LABEL: Record<string, string> = {
  club: "Club",
  academy: "Academy",
  "youth-national": "Youth national teams",
  national: "National team",
};

export default function TeamsPage() {
  return (
    <main className={s.wrap}>
      <header className={s.hero}>
        <p className={s.eyebrow}>Every team</p>
        <h1 className={s.pageTitle}>Five stops between a park in Granollers and a World Cup final.</h1>
        <p className={s.lede}>
          The first two have no statistics anyone can check, and the page says so rather than
          making some up. The last three are where the numbers are.
        </p>
      </header>

      <div className={s.grid2}>
        {TEAMS.map((team) => (
          <Link key={team.slug} href={`/trail-crew/yamal/teams/${team.slug}`} className={s.card}>
            <p className={s.cardKind}>{KIND_LABEL[team.kind]}</p>
            <h2 className={s.cardName}>{team.name}</h2>
            <p className={s.cardYears}>
              {team.years}. {team.role}.
            </p>
            <p className={s.cardText}>{team.summary}</p>
          </Link>
        ))}
      </div>

      <Link href="/trail-crew/yamal" className={s.back}>
        Back to the overview
      </Link>
    </main>
  );
}

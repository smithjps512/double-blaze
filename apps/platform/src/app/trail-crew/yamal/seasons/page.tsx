import Link from "next/link";
import { AS_OF, SEASONS, clubTotals, contributions, perGame } from "@/data/yamal";
import s from "../tracker.module.css";

/**
 * The full table: every Barcelona season, every competition line, the totals,
 * and what happened. This is the table view the chart on the overview stands
 * in for. Derived rows are marked, because a number worked out by subtraction
 * is a different kind of number from one somebody reported.
 */

export default function SeasonsPage() {
  const club = clubTotals();

  return (
    <main className={s.wrap}>
      <header className={s.hero}>
        <p className={s.eyebrow}>Barcelona, season by season</p>
        <h1 className={s.pageTitle}>Five seasons, from one game to the number 10.</h1>
        <p className={s.lede}>
          All competitions. Rows marked <span className={s.mark}>derived</span> are the season total
          minus the reported lines. Numbers as of {AS_OF}.
        </p>
      </header>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">Season and competition</th>
              <th scope="col" className={s.num}>
                Games
              </th>
              <th scope="col" className={s.num}>
                Goals
              </th>
              <th scope="col" className={s.num}>
                Assists
              </th>
              <th scope="col" className={s.num}>
                G + A
              </th>
              <th scope="col" className={s.num}>
                Per game
              </th>
            </tr>
          </thead>
          <tbody>
            {SEASONS.map((season) => (
              <SeasonRows key={season.id} season={season} />
            ))}
            <tr className={s.total}>
              <td>Barcelona career</td>
              <td className={s.num}>{club.apps}</td>
              <td className={s.num}>{club.goals}</td>
              <td className={s.num}>{club.assists}</td>
              <td className={s.num}>{contributions(club)}</td>
              <td className={s.num}>{perGame(contributions(club), club.apps)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={s.sectionHead}>
        <h2>What happened each year</h2>
        <p>Shirt numbers and the moments</p>
      </div>
      <ol className={s.timeline}>
        {SEASONS.map((season) => (
          <li key={season.id}>
            <h3>
              {season.label}
              {season.inProgress && <span className={s.pill}>In progress</span>}
            </h3>
            <p className={s.when}>
              Age {season.age} at the start. Shirt number {season.shirt}.
              {season.honours.length > 0 && ` Won: ${season.honours.join(", ")}.`}
            </p>
            <ul>
              {season.moments.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <Link href="/trail-crew/yamal" className={s.back}>
        Back to the overview
      </Link>
    </main>
  );
}

function SeasonRows({ season }: { season: (typeof SEASONS)[number] }) {
  return (
    <>
      <tr className={s.season}>
        <td colSpan={6}>
          {season.label}
          {season.inProgress && <span className={s.pill}>In progress</span>}
        </td>
      </tr>
      {season.lines.map((line) => (
        <tr key={line.competition}>
          <td>
            {line.competition}
            {line.derived && <span className={`${s.pill}`}>derived</span>}
          </td>
          <td className={s.num}>{line.apps}</td>
          <td className={s.num}>{line.goals}</td>
          <td className={s.num}>{line.assists}</td>
          <td className={s.num}>{contributions(line)}</td>
          <td className={s.num}>{perGame(contributions(line), line.apps)}</td>
        </tr>
      ))}
      <tr className={s.total}>
        <td>{season.label} total</td>
        <td className={s.num}>{season.total.apps}</td>
        <td className={s.num}>{season.total.goals}</td>
        <td className={s.num}>{season.total.assists}</td>
        <td className={s.num}>{contributions(season.total)}</td>
        <td className={s.num}>{perGame(contributions(season.total), season.total.apps)}</td>
      </tr>
    </>
  );
}

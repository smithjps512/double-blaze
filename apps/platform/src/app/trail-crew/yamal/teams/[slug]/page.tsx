import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AS_OF,
  HONOURS,
  SEASONS,
  SPAIN_CAMPAIGNS,
  SPAIN_TOTAL,
  TEAMS,
  YOUTH_NATIONAL,
  clubTotals,
  contributions,
  findTeam,
  perGame,
} from "@/data/yamal";
import s from "../../tracker.module.css";

/**
 * One team's page. What it shows depends on what can honestly be shown:
 * Barcelona gets the season table, Spain gets the campaigns, the youth teams
 * get the age-group table, and the two clubs from before anyone was counting
 * get the story and a sentence saying why there is no table.
 */

export function generateStaticParams(): Array<{ slug: string }> {
  return TEAMS.map((t) => ({ slug: t.slug }));
}

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const team = findTeam(slug);
  if (!team) notFound();

  return (
    <main className={s.wrap}>
      <Link href="/trail-crew/yamal/teams" className={s.back}>
        All teams
      </Link>
      <header className={s.hero} style={{ paddingTop: 20 }}>
        <p className={s.eyebrow}>{team.years}</p>
        <h1 className={s.pageTitle}>{team.name}</h1>
        <p className={s.lede}>
          {team.role}. {team.summary}
        </p>
      </header>

      {team.slug === "barcelona" && <BarcelonaSection />}
      {team.slug === "spain" && <SpainSection />}
      {team.slug === "spain-youth" && <YouthSection />}
      {(team.slug === "la-torreta" || team.slug === "la-masia") && (
        <div className={s.callout}>
          <h3>Why there is no table here</h3>
          <p>
            Youth football in Spain does not publish player statistics in a form that can be checked
            against a second source, and an AI that fills a gap like this with a plausible number is
            doing the one thing it must not do. The years are real. The numbers would be invented.
          </p>
          <p>
            What is known: {team.slug === "la-torreta"
              ? "Barcelona scouted him here at six, and he joined the academy the following year."
              : "he moved through the age groups faster than his birth year, was training with the first team at 15, and made his debut at 15 years and 290 days."}
          </p>
        </div>
      )}

      <p className={s.note}>Numbers as of {AS_OF}.</p>
    </main>
  );
}

function BarcelonaSection() {
  const club = clubTotals();
  return (
    <>
      <div className={s.tiles}>
        <div className={s.tile}>
          <div>
            <span className={s.tileValue}>{club.apps}</span>
          </div>
          <div className={s.tileLabel}>Games</div>
        </div>
        <div className={s.tile}>
          <div>
            <span className={s.tileValue}>{club.goals}</span>
          </div>
          <div className={s.tileLabel}>Goals</div>
          <div className={s.tileSub}>{perGame(club.goals, club.apps)} per game</div>
        </div>
        <div className={s.tile}>
          <div>
            <span className={s.tileValue}>{club.assists}</span>
          </div>
          <div className={s.tileLabel}>Assists</div>
          <div className={s.tileSub}>{perGame(club.assists, club.apps)} per game</div>
        </div>
        <div className={s.tile}>
          <div>
            <span className={s.tileValue}>{HONOURS.club.length}</span>
          </div>
          <div className={s.tileLabel}>Trophy lines</div>
          <div className={s.tileSub}>Six trophies across three competitions</div>
        </div>
      </div>

      <div className={s.sectionHead}>
        <h2>Season totals</h2>
        <p>
          Full breakdown on the <Link href="/trail-crew/yamal/seasons">seasons page</Link>
        </p>
      </div>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">Season</th>
              <th scope="col">Shirt</th>
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
              <th scope="col">Won</th>
            </tr>
          </thead>
          <tbody>
            {SEASONS.map((season) => (
              <tr key={season.id}>
                <td>
                  {season.label}
                  {season.inProgress && <span className={s.pill}>In progress</span>}
                </td>
                <td>{season.shirt}</td>
                <td className={s.num}>{season.total.apps}</td>
                <td className={s.num}>{season.total.goals}</td>
                <td className={s.num}>{season.total.assists}</td>
                <td className={s.num}>{contributions(season.total)}</td>
                <td>{season.honours.length > 0 ? season.honours.join(", ") : "Nothing that year"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SpainSection() {
  return (
    <>
      <div className={s.tiles}>
        <div className={s.tile}>
          <div>
            <span className={s.tileValue}>{SPAIN_TOTAL.caps}</span>
          </div>
          <div className={s.tileLabel}>Caps</div>
          <div className={s.tileSub}>Through {SPAIN_TOTAL.through}</div>
        </div>
        <div className={s.tile}>
          <div>
            <span className={s.tileValue}>{SPAIN_TOTAL.goals}</span>
          </div>
          <div className={s.tileLabel}>Goals</div>
        </div>
        <div className={s.tile}>
          <div>
            <span className={s.tileValue}>2</span>
          </div>
          <div className={s.tileLabel}>Major titles</div>
          <div className={s.tileSub}>Euro 2024 and World Cup 2026</div>
        </div>
      </div>
      <p className={s.note}>
        The cap count is the 25 reported on 31 March 2026 plus his eight World Cup games. Any
        friendlies in between, and Spain&rsquo;s matches since the final, are not in it yet. That is
        the first number a student should update.
      </p>

      <div className={s.sectionHead}>
        <h2>Campaign by campaign</h2>
        <p>{SPAIN_CAMPAIGNS.length} so far</p>
      </div>
      <ol className={s.timeline}>
        {SPAIN_CAMPAIGNS.map((c) => (
          <li key={c.id}>
            <h3>
              {c.label}
              <span className={`${s.pill} ${c.result === "Winners" ? s.pillWin : ""}`}>{c.result}</span>
            </h3>
            <p className={s.when}>
              {c.years}
              {c.apps !== undefined && `. ${c.apps} games, ${c.goals} goals, ${c.assists} assists`}
            </p>
            <ul>
              {c.moments.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </>
  );
}

function YouthSection() {
  const apps = YOUTH_NATIONAL.reduce((n, r) => n + r.apps, 0);
  const goals = YOUTH_NATIONAL.reduce((n, r) => n + r.goals, 0);
  return (
    <>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">Team</th>
              <th scope="col">Years</th>
              <th scope="col" className={s.num}>
                Games
              </th>
              <th scope="col" className={s.num}>
                Goals
              </th>
            </tr>
          </thead>
          <tbody>
            {YOUTH_NATIONAL.map((r) => (
              <tr key={r.team}>
                <td>{r.team}</td>
                <td>{r.years}</td>
                <td className={s.num}>{r.apps}</td>
                <td className={s.num}>{r.goals}</td>
              </tr>
            ))}
            <tr className={s.total}>
              <td>All age groups</td>
              <td />
              <td className={s.num}>{apps}</td>
              <td className={s.num}>{goals}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className={s.note}>
        He played for the under-19s at 15, one game, before the under-17 run that produced eight
        goals in ten. Age groups are listed in the order he first appeared for them.
      </p>
    </>
  );
}

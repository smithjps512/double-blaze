import Link from "next/link";
import {
  AS_OF,
  AWARDS,
  BIO,
  HONOURS,
  RECORDS,
  SEASONS,
  SOURCES,
  SPAIN_CAMPAIGNS,
  SPAIN_TOTAL,
  TEAMS,
  clubTotals,
  contributions,
  perGame,
} from "@/data/yamal";
import { SeasonChart } from "./SeasonChart";
import s from "./tracker.module.css";

/**
 * The overview: who he is, the headline numbers, the shape of his career,
 * every team, and a plain account of how an AI put the page together.
 *
 * The last section is the reason the page exists. The numbers are the hook;
 * the lesson is that an AI can read a hundred pages and reconcile them, and
 * that it has to show its working for that to be worth anything.
 */

const KIND_LABEL: Record<string, string> = {
  club: "Club",
  academy: "Academy",
  "youth-national": "Youth national teams",
  national: "National team",
};

export default function OverviewPage() {
  const club = clubTotals();
  const trophies = HONOURS.club.length + HONOURS.country.length;
  const current = SEASONS[SEASONS.length - 1];

  return (
    <main>
      <header className={`${s.wrap} ${s.hero}`}>
        <p className={s.eyebrow}>
          {BIO.position}, Barcelona and Spain, number {BIO.clubShirt}
        </p>
        <h1>{BIO.name}. Every team, every number, and where each one came from.</h1>
        <p>
          Born {BIO.born} in {BIO.birthplace}, raised in {BIO.hometown}. A first-team debut at 15, a
          European champion at 17, a world champion at 19. Numbers as of {AS_OF}.
        </p>
      </header>

      <div className={s.wrap}>
        <div className={s.tiles}>
          <div className={s.tile}>
            <div>
              <span className={s.tileValue}>{club.apps}</span>
            </div>
            <div className={s.tileLabel}>Barcelona games</div>
            <div className={s.tileSub}>Since April 2023</div>
          </div>
          <div className={s.tile}>
            <div>
              <span className={s.tileValue}>{club.goals}</span>
            </div>
            <div className={s.tileLabel}>Barcelona goals</div>
            <div className={s.tileSub}>{perGame(club.goals, club.apps)} per game</div>
          </div>
          <div className={s.tile}>
            <div>
              <span className={s.tileValue}>{club.assists}</span>
            </div>
            <div className={s.tileLabel}>Barcelona assists</div>
            <div className={s.tileSub}>{perGame(club.assists, club.apps)} per game</div>
          </div>
          <div className={s.tile}>
            <div>
              <span className={s.tileValue}>{contributions(club)}</span>
            </div>
            <div className={s.tileLabel}>Goals plus assists</div>
            <div className={s.tileSub}>{perGame(contributions(club), club.apps)} per game</div>
          </div>
          <div className={s.tile}>
            <div>
              <span className={s.tileValue}>{SPAIN_TOTAL.caps}</span>
              <span className={s.tileUnit}>caps</span>
            </div>
            <div className={s.tileLabel}>Spain</div>
            <div className={s.tileSub}>{SPAIN_TOTAL.goals} goals, through the World Cup</div>
          </div>
          <div className={s.tile}>
            <div>
              <span className={s.tileValue}>{trophies}</span>
            </div>
            <div className={s.tileLabel}>Trophy lines</div>
            <div className={s.tileSub}>Club and country, including a World Cup</div>
          </div>
        </div>

        <div className={s.sectionHead}>
          <h2>The shape of it</h2>
          <p>{current.inProgress ? `${current.label} is in progress` : "All seasons complete"}</p>
        </div>
        <SeasonChart seasons={SEASONS} />
        <p className={s.note}>
          Each pair of bars is one Barcelona season across every competition. The lighter pair is the
          season still being played. The full breakdown by competition is on the{" "}
          <Link href="/trail-crew/yamal/seasons">seasons page</Link>.
        </p>

        <div className={s.sectionHead}>
          <h2>Every team</h2>
          <p>{TEAMS.length} of them, oldest first</p>
        </div>
        <div className={s.grid2}>
          {TEAMS.map((team) => (
            <Link key={team.slug} href={`/trail-crew/yamal/teams/${team.slug}`} className={s.card}>
              <p className={s.cardKind}>{KIND_LABEL[team.kind]}</p>
              <h3 className={s.cardName}>{team.name}</h3>
              <p className={s.cardYears}>
                {team.years}. {team.role}.
              </p>
              <p className={s.cardText}>{team.summary}</p>
            </Link>
          ))}
        </div>

        <div className={s.sectionHead}>
          <h2>With Spain</h2>
          <p>
            {SPAIN_TOTAL.caps} caps, {SPAIN_TOTAL.goals} goals, through {SPAIN_TOTAL.through}
          </p>
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

        <div className={s.sectionHead}>
          <h2>Honours and awards</h2>
          <p>Team first, then his own</p>
        </div>
        <div className={s.honours}>
          <div className={s.card}>
            <p className={s.cardKind}>With Barcelona</p>
            <ul className={s.plain}>
              {HONOURS.club.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
          <div className={s.card}>
            <p className={s.cardKind}>With Spain</p>
            <ul className={s.plain}>
              {HONOURS.country.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
          <div className={s.card}>
            <p className={s.cardKind}>Individual</p>
            <ul className={s.plain}>
              {AWARDS.map((a) => (
                <li key={a.award}>
                  <span className={s.mark}>{a.year}</span> {a.award}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={s.sectionHead}>
          <h2>Records that are his</h2>
          <p>Ages at the time</p>
        </div>
        <ul className={s.plain}>
          {RECORDS.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>

        <div className={s.sectionHead}>
          <h2>How an AI made this page</h2>
          <p>The part worth talking about in class</p>
        </div>
        <div className={s.callout}>
          <h3>Three things to notice</h3>
          <ol>
            <li>
              <strong>It read a lot, fast.</strong> Club sites, league sites, match reports, award
              announcements and statistics databases, in a few minutes, and turned them into one
              table. A person could do this. A person would not do it every week.
            </li>
            <li>
              <strong>The sources disagreed, and it had to choose.</strong> One site counted 25 assists
              for 2024-25 and another counted 21, because they define an assist differently. Spain
              caps came back as 23, 25 and 27 from pages written on different dates. The page picks
              the most recent figure it can date, says what date that was, and marks any number it
              worked out by subtraction rather than read. That is the honest version. An AI that
              hides this is worse than one that does not know.
            </li>
            <li>
              <strong>It is a snapshot, not a feed.</strong> Nothing on this page updates itself. The
              numbers were true on {AS_OF}, and the next match makes them wrong. A real product would
              read a live statistics service. The AI&rsquo;s job then is the same as it was here: check
              the feed against other sources and say when they differ.
            </li>
          </ol>
          <p>
            Every number lives in one file that a student can edit after the next game. Ask what
            you would change first. Then go and{" "}
            <Link href="/trail-crew/yamal/ask">ask the storyteller</Link> about a season: it has read
            that same file and nothing else.
          </p>
        </div>

        <div className={s.sectionHead}>
          <h2>Where the numbers were checked</h2>
          <p>On {AS_OF}</p>
        </div>
        <ul className={s.plain}>
          {SOURCES.map((src) => (
            <li key={src.url}>
              <a href={src.url} target="_blank" rel="noopener">
                {src.label}
              </a>
            </li>
          ))}
        </ul>
        <p className={s.note}>
          Assists are counted the way the reporting counted them, which is closer to Opta than to
          Transfermarkt. Rows marked as derived on the seasons page are the season total minus the
          lines that were reported, and are arithmetic rather than a claim.
        </p>
      </div>
    </main>
  );
}

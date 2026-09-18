/**
 * Lamine Yamal, by the numbers.
 *
 * One file, on purpose. This tracker is a classroom demo of what an AI can do
 * for a sports fan: read a pile of sources, reconcile them, and lay the result
 * out so a person can check it. Everything the pages show comes from here, so
 * a student who wants to update it after the next match has one place to look.
 *
 * Two rules the numbers follow:
 *
 * 1. Season totals are the figures the reporting agrees on. Where a source
 *    gave a per-competition line, that line is here as written. Where the
 *    reporting only gave a total, the remainder is a row marked `derived`, and
 *    the page says so. A derived row is arithmetic, not a claim.
 * 2. Every count carries the date it was true. Assists in particular differ
 *    between providers (Opta credits more than Transfermarkt does), so the
 *    "as of" date and the sources list are part of the data, not decoration.
 *
 * No em dashes anywhere in this file or in the copy built from it.
 */

export const AS_OF = "18 September 2026";

export interface Line {
  competition: string;
  apps: number;
  goals: number;
  assists: number;
  /** Arithmetic remainder from the season total, not a reported figure. */
  derived?: boolean;
}

export interface Season {
  id: string;
  label: string;
  /** Age at the start of the season, for the axis of the chart. */
  age: number;
  shirt: number;
  inProgress?: boolean;
  lines: Line[];
  total: { apps: number; goals: number; assists: number };
  honours: string[];
  moments: string[];
}

export interface Campaign {
  id: string;
  label: string;
  years: string;
  result: string;
  apps?: number;
  goals?: number;
  assists?: number;
  moments: string[];
}

export interface Team {
  slug: string;
  name: string;
  kind: "club" | "academy" | "youth-national" | "national";
  years: string;
  role: string;
  summary: string;
  record?: { apps: number; goals: number; assists?: number; note?: string };
}

export const BIO = {
  name: "Lamine Yamal",
  fullName: "Lamine Yamal Nasraoui Ebana",
  born: "13 July 2007",
  birthplace: "Esplugues de Llobregat, Catalonia, Spain",
  hometown: "Rocafonda, Mataró",
  position: "Right winger",
  foot: "Left",
  clubShirt: 10,
  countryShirt: 19,
};

/** Barcelona first team, season by season, all competitions. */
export const SEASONS: Season[] = [
  {
    id: "2022-23",
    label: "2022-23",
    age: 15,
    shirt: 41,
    lines: [{ competition: "La Liga", apps: 1, goals: 0, assists: 0 }],
    total: { apps: 1, goals: 0, assists: 0 },
    honours: ["La Liga champions"],
    moments: [
      "Debut on 29 April 2023 against Real Betis at 15 years and 290 days, the youngest player ever to appear for Barcelona in La Liga.",
    ],
  },
  {
    id: "2023-24",
    label: "2023-24",
    age: 16,
    shirt: 27,
    lines: [
      { competition: "La Liga", apps: 37, goals: 5, assists: 5 },
      {
        competition: "Champions League, Copa del Rey and Supercopa",
        apps: 13,
        goals: 2,
        assists: 5,
        derived: true,
      },
    ],
    total: { apps: 50, goals: 7, assists: 10 },
    honours: [],
    moments: [
      "First full season in the first team, 50 games at 16.",
      "Reached the Champions League quarter-final, playing every round.",
      "Won Euro 2024 with Spain in the summer that closed the season.",
    ],
  },
  {
    id: "2024-25",
    label: "2024-25",
    age: 17,
    shirt: 19,
    lines: [
      { competition: "La Liga", apps: 35, goals: 9, assists: 13 },
      { competition: "Champions League", apps: 14, goals: 5, assists: 6 },
      { competition: "Copa del Rey and Supercopa", apps: 6, goals: 4, assists: 6, derived: true },
    ],
    total: { apps: 55, goals: 18, assists: 25 },
    honours: ["La Liga champions", "Copa del Rey winners", "Supercopa de España winners"],
    moments: [
      "A domestic treble at 17: league, cup and Supercopa in one season.",
      "Champions League semi-finalist.",
      "Second in the 2025 Ballon d'Or vote, and a second Kopa Trophy.",
    ],
  },
  {
    id: "2025-26",
    label: "2025-26",
    age: 18,
    shirt: 10,
    lines: [
      { competition: "La Liga", apps: 28, goals: 16, assists: 11 },
      { competition: "Champions League", apps: 10, goals: 6, assists: 4 },
      { competition: "Copa del Rey and Supercopa", apps: 7, goals: 2, assists: 3, derived: true },
    ],
    total: { apps: 45, goals: 24, assists: 18 },
    honours: ["La Liga champions", "Supercopa de España winners"],
    moments: [
      "Took the number 10 shirt.",
      "Named La Liga player of the season and finished as the league's top assist provider.",
      "First professional hat-trick on 28 February 2026 against Villarreal, the youngest La Liga hat-trick of the century.",
      "Copa del Rey semi-finalist and Champions League quarter-finalist.",
    ],
  },
  {
    id: "2026-27",
    label: "2026-27",
    age: 19,
    shirt: 10,
    inProgress: true,
    lines: [
      { competition: "La Liga", apps: 6, goals: 7, assists: 2 },
      { competition: "Champions League", apps: 1, goals: 1, assists: 2, derived: true },
    ],
    total: { apps: 7, goals: 8, assists: 4 },
    honours: [],
    moments: [
      "Season in progress. Eight goals in the first seven games, six of them in three appearances.",
      "Nominated for a third Kopa Trophy. The ceremony is on 26 October 2026.",
    ],
  },
];

/** Spain senior team, by campaign rather than by year, because that is how a fan remembers it. */
export const SPAIN_CAMPAIGNS: Campaign[] = [
  {
    id: "debut",
    label: "Debut and Euro qualifying",
    years: "2023",
    result: "Qualified for Euro 2024",
    moments: [
      "First cap on 8 September 2023 against Georgia, a 7-1 win, at 16 years and 57 days: the youngest player ever to play for Spain.",
      "Scored in that same game, which made him Spain's youngest ever goalscorer too.",
    ],
  },
  {
    id: "euro-2024",
    label: "Euro 2024",
    years: "Germany, June to July 2024",
    result: "Winners",
    apps: 7,
    goals: 1,
    assists: 4,
    moments: [
      "Youngest player, and youngest scorer, in the history of the European Championship.",
      "The semi-final goal against France was voted goal of the tournament.",
      "Young Player of the Tournament and in the Team of the Tournament, the day before his 17th birthday.",
    ],
  },
  {
    id: "nations-league-2025",
    label: "Nations League",
    years: "2024 to 2025",
    result: "Runners-up",
    moments: [
      "Scored twice against France in the semi-final, a 5-4 win, at 17 years, 10 months and 7 days: the youngest player to score two in a game for Spain.",
      "Lost the final to Portugal on penalties on 8 June 2025.",
    ],
  },
  {
    id: "world-cup-2026",
    label: "World Cup 2026",
    years: "Canada, Mexico and the United States, June to July 2026",
    result: "Winners",
    apps: 8,
    goals: 1,
    assists: 0,
    moments: [
      "Scored in the 10th minute against Saudi Arabia in the group stage at 18 years and 343 days, Spain's youngest ever World Cup scorer.",
      "Started seven of the eight games on the way to the final.",
      "Spain beat Argentina 1-0 after extra time on 19 July 2026. At 19 years and 6 days he became the fourth youngest World Cup winner ever.",
    ],
  },
];

/**
 * Spain caps and goals through the World Cup final.
 *
 * Counted forward from the 25 caps and 6 goals reported on 31 March 2026, plus
 * the eight games and one goal at the World Cup. Friendlies between those
 * dates and matches after the final are not in this number, and the page
 * says so next to it.
 */
export const SPAIN_TOTAL = {
  caps: 33,
  goals: 7,
  through: "the World Cup final, 19 July 2026",
};

/** Every team he has been with, oldest first. */
export const TEAMS: Team[] = [
  {
    slug: "la-torreta",
    name: "CF La Torreta",
    kind: "club",
    years: "2012 to 2014",
    role: "First club, ages 5 to 7",
    summary:
      "A neighbourhood club in Granollers, near Mataró, where he first played organised football. Barcelona's scouts saw him here at six. Nobody kept statistics on a six year old, and this page will not invent any.",
  },
  {
    slug: "la-masia",
    name: "FC Barcelona youth (La Masia)",
    kind: "academy",
    years: "2014 to 2023",
    role: "Academy, from age 7 to the first team",
    summary:
      "Joined the academy at seven and moved up an age group at almost every step. By 15 he was training with the first team. Youth league numbers are not published in a form that can be checked, so the academy years are the story here rather than a table.",
  },
  {
    slug: "spain-youth",
    name: "Spain youth teams",
    kind: "youth-national",
    years: "2021 to 2023",
    role: "Under-15, under-16, under-17 and under-19",
    summary:
      "Four age groups in two years. He played above his age at every one of them, and the under-17 record is where the goals started to arrive.",
    record: { apps: 21, goals: 12, note: "Summed from the four age groups below." },
  },
  {
    slug: "barcelona",
    name: "FC Barcelona",
    kind: "club",
    years: "2023 to present",
    role: "First team, number 10",
    summary:
      "Debut at 15, a regular at 16, a treble at 17, and the number 10 shirt at 18. The season table below is his whole first-team career so far.",
  },
  {
    slug: "spain",
    name: "Spain",
    kind: "national",
    years: "2023 to present",
    role: "Senior national team, number 19",
    summary:
      "The youngest player and scorer in Spain's history, then a European champion at 17 and a world champion at 19.",
  },
];

export const YOUTH_NATIONAL = [
  { team: "Spain under-15", years: "2021", apps: 6, goals: 3 },
  { team: "Spain under-16", years: "2022", apps: 4, goals: 1 },
  { team: "Spain under-19", years: "2022", apps: 1, goals: 0 },
  { team: "Spain under-17", years: "2022 to 2023", apps: 10, goals: 8 },
];

export const AWARDS = [
  { year: "2024", award: "Euro 2024 Young Player of the Tournament, Team of the Tournament and Goal of the Tournament" },
  { year: "2024", award: "Kopa Trophy, best player under 21, at 17" },
  { year: "2024", award: "Golden Boy, the youngest winner ever at 17 years and 137 days" },
  { year: "2025", award: "Kopa Trophy again, the first player to win it twice" },
  { year: "2025", award: "Second in the Ballon d'Or vote" },
  { year: "2026", award: "La Liga player of the season, 2025-26" },
  { year: "2026", award: "World Cup winner. Kopa Trophy nominee, decided 26 October 2026" },
];

export const HONOURS = {
  club: [
    "La Liga: 2022-23, 2024-25, 2025-26",
    "Copa del Rey: 2024-25",
    "Supercopa de España: 2024-25, 2025-26",
  ],
  country: ["European Championship: 2024", "World Cup: 2026", "Nations League runner-up: 2024-25"],
};

export const RECORDS = [
  "Youngest player to appear for Barcelona in La Liga: 15 years, 290 days",
  "Youngest player and youngest scorer for Spain: 16 years, 57 days",
  "Youngest player and youngest scorer at a European Championship: 16 years, 362 days",
  "Youngest Golden Boy winner: 17 years, 137 days",
  "First two-time Kopa Trophy winner: 2024 and 2025",
  "Youngest player to score twice in a game for Spain: 17 years, 10 months, 7 days",
  "Youngest La Liga hat-trick of the 21st century: 28 February 2026",
  "Spain's youngest World Cup scorer: 18 years, 343 days",
];

/** Where the numbers were checked, on the "as of" date. */
export const SOURCES = [
  { label: "FC Barcelona: La Liga player of the season 2025-26", url: "https://www.fcbarcelona.com/en/news/4514485/lamine-yamal-202526-laliga-player-of-the-season" },
  { label: "Sports Illustrated: 2026 Kopa Trophy favourites (2025-26 totals)", url: "https://www.si.com/soccer/ballon-dor-2026-ranking-favorites-kopa-trophy-lamine-yamal" },
  { label: "ESPN: first World Cup goal against Saudi Arabia", url: "https://www.espn.com/soccer/story/_/id/49135958/spain-saudi-arabia-2026-world-cup-lamine-yamal-mikel-oyarzabal" },
  { label: "Sky Sports: World Cup final, Spain 1-0 Argentina", url: "https://www.skysports.com/football/news/12098/13564318/2026-world-cup-spain-1-0-argentina-aet-ferran-torres-extra-time-winner-secures-spains-second-title" },
  { label: "NBC News: World Cup semi-final, Spain 2-0 France", url: "https://www.nbcnews.com/sports/soccer/live-blog/spain-france-world-cup-2026-july-14-live-updates-rcna587324" },
  { label: "Golden Boy: 2024 winner", url: "https://www.goldenboyaward.com/winner/lamine-yamal" },
  { label: "Tribuna: season by season statistics", url: "https://tribuna.com/en/persons/lamine-yamal/stat/2025-2026/" },
  { label: "FBref: career statistics", url: "https://fbref.com/en/players/82ec26c1/Lamine-Yamal" },
];

/* --- arithmetic the pages share ----------------------------------------- */

export function sumLines(lines: Line[]) {
  return lines.reduce(
    (acc, l) => ({ apps: acc.apps + l.apps, goals: acc.goals + l.goals, assists: acc.assists + l.assists }),
    { apps: 0, goals: 0, assists: 0 },
  );
}

export function clubTotals(seasons: Season[] = SEASONS) {
  return seasons.reduce(
    (acc, s) => ({
      apps: acc.apps + s.total.apps,
      goals: acc.goals + s.total.goals,
      assists: acc.assists + s.total.assists,
    }),
    { apps: 0, goals: 0, assists: 0 },
  );
}

/** Goals plus assists, the number a fan actually quotes. */
export function contributions(t: { goals: number; assists: number }) {
  return t.goals + t.assists;
}

export function perGame(value: number, apps: number): string {
  if (apps === 0) return "0.00";
  return (value / apps).toFixed(2);
}

export function findTeam(slug: string): Team | undefined {
  return TEAMS.find((t) => t.slug === slug);
}

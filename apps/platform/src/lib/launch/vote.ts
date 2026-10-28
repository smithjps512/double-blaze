/**
 * Class votes at /vote: a ranked ballot and one sentence of why.
 *
 * Ranked rather than one pick, so a kid whose favorite loses still has a say
 * in what wins, and the count is Borda points (first gets the most). Pure, so
 * the page, the API and the tests agree. No em dashes in any copy.
 */

import { checkTeamName } from "./plan";
import { RUDE, UNKIND } from "./qa";

export interface PollOption {
  id: string;
  label: string;
  emoji: string;
  pitch: string;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
}

export const POLL: Poll = {
  id: "p3-whats-next",
  question: "What should our class build next?",
  options: [
    { id: "apps-v2", label: "Level up our apps (v2)", emoji: "🚀", pitch: "Keep our own apps. Write scenarios, use QA feedback, and build version 2." },
    { id: "smart-city", label: "Smart City 2.0", emoji: "🏙️", pitch: "Plan a city system like a product team: who uses it, what they need, and how we know it works." },
    { id: "game-studio", label: "Game studio", emoji: "🎮", pitch: "Plan a game like a real studio: the player, the core loop, levels as stories, and playtesting." },
  ],
};

export const POLLS: Record<string, Poll> = { [POLL.id]: POLL };

export interface Ballot {
  poll: string;
  ranking: string[];
  why: string;
  period: number;
  teamName: string;
  teamKey: string;
}

export type BallotCheck = { ok: true; ballot: Ballot } | { ok: false; error: string };

const clean = (s: unknown, max: number) => (typeof s === "string" ? s.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "");

export function checkBallot(raw: unknown): BallotCheck {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const poll = POLLS[typeof o.poll === "string" ? o.poll : ""];
  if (!poll) return { ok: false, error: "That vote is not open." };
  const period = typeof o.period === "number" ? o.period : Number(o.period);
  if (!Number.isInteger(period) || period < 1 || period > 7) return { ok: false, error: "Pick your period." };
  const team = checkTeamName(o.team);
  if (!team.ok) return { ok: false, error: team.error };

  const ids = poll.options.map((p) => p.id);
  const ranking = Array.isArray(o.ranking) ? o.ranking.filter((x): x is string => typeof x === "string") : [];
  if (ranking.length !== ids.length || new Set(ranking).size !== ids.length || !ranking.every((r) => ids.includes(r))) {
    return { ok: false, error: `Rank all ${ids.length} choices, 1 to ${ids.length}.` };
  }

  // Not clipped: a 300 letter sentence is told to shorten, not silently cut.
  const why = clean(o.why, 1000);
  if (why.length < 5) return { ok: false, error: "Say why your #1 is your #1, in one sentence." };
  if (why.length > 200) return { ok: false, error: "Keep it to one sentence (200 letters or fewer)." };
  if (RUDE.test(why)) return { ok: false, error: "Keep it school appropriate." };
  if (UNKIND.test(why)) return { ok: false, error: "Say why you want your #1, not what you think of the others." };

  return { ok: true, ballot: { poll: poll.id, ranking, why, period, teamName: team.name, teamKey: team.key } };
}

export interface OptionResult {
  id: string;
  label: string;
  emoji: string;
  points: number;
  firsts: number;
}

export interface Tally {
  poll: string;
  voters: number;
  results: OptionResult[];
  /** The option with the most points, or null if nobody has voted or it is a tie at the top. */
  leader: string | null;
}

/** Borda count: with three options, 1st is 3 points, 2nd is 2, 3rd is 1. Sorted by points. */
export function tally(poll: Poll, ballots: Array<{ ranking: string[] }>): Tally {
  const n = poll.options.length;
  const points: Record<string, number> = {};
  const firsts: Record<string, number> = {};
  for (const opt of poll.options) {
    points[opt.id] = 0;
    firsts[opt.id] = 0;
  }
  let voters = 0;
  for (const b of ballots) {
    if (!Array.isArray(b.ranking)) continue;
    voters++;
    b.ranking.forEach((id, i) => {
      if (id in points && i < n) points[id] += n - i;
    });
    if (b.ranking[0] in firsts) firsts[b.ranking[0]]++;
  }
  const results = poll.options
    .map((o) => ({ id: o.id, label: o.label, emoji: o.emoji, points: points[o.id], firsts: firsts[o.id] }))
    .sort((a, b) => b.points - a.points || b.firsts - a.firsts);
  const leader = results.length && results[0].points > 0 && (results.length < 2 || results[0].points > results[1].points || results[0].firsts > results[1].firsts) ? results[0].id : null;
  return { poll: poll.id, voters, results, leader };
}

import "server-only";
import { getSupabaseServiceClient } from "./supabase";
import type { Ballot } from "./launch/vote";

/**
 * Storage for /vote ballots. See supabase/migrations/0047_launch_votes.sql.
 *
 * Service role only. Returns null rather than throwing when Supabase is not
 * configured, so the page can say so and still let a class see the choices.
 */

export interface StoredBallot {
  ranking: string[];
  why: string;
  teamName: string;
  period: number;
}

/** One vote per Chromebook per poll: voting again replaces the old ballot. */
export async function castBallot(ballot: Ballot, voterKey: string): Promise<boolean | null> {
  const db = getSupabaseServiceClient();
  if (!db) return null;
  const { error } = await db.from("launch_votes").upsert(
    {
      poll: ballot.poll,
      period: ballot.period,
      team_key: ballot.teamKey,
      team_name: ballot.teamName,
      voter_key: voterKey,
      ranking: ballot.ranking,
      why: ballot.why,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "poll,voter_key" },
  );
  if (error) console.error("[launch-vote] save failed", error.message);
  return !error;
}

export async function ballotsFor(poll: string): Promise<StoredBallot[] | null> {
  const db = getSupabaseServiceClient();
  if (!db) return null;
  const { data, error } = await db.from("launch_votes").select("ranking, why, team_name, period").eq("poll", poll).order("updated_at", { ascending: true }).limit(500);
  if (error) {
    console.error("[launch-vote] read failed", error.message);
    return null;
  }
  return (data as Array<{ ranking: string[]; why: string; team_name: string; period: number }>).map((r) => ({
    ranking: Array.isArray(r.ranking) ? r.ranking : [],
    why: r.why,
    teamName: r.team_name,
    period: r.period,
  }));
}

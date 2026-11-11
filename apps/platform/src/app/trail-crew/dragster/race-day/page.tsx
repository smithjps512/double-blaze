import Gate from "./Gate";
import Leaderboard from "./Leaderboard";
import { isConfigured, isInClass } from "@/lib/race-day/auth";
import { loadRaceDay } from "@/lib/race-day-db";
import { forStudents } from "@/lib/race-day/model";

/**
 * Race Day leaderboard: every car's best run, with the ±0.05 s the video
 * cannot see past shown honestly as a range of places.
 */
export const dynamic = "force-dynamic";

export default async function RaceDayPage() {
  if (!(await isInClass())) return <Gate role="class" configured={isConfigured("class")} />;
  const { day } = await loadRaceDay();
  return <Leaderboard day={forStudents(day)} />;
}

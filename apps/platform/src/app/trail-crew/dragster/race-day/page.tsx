import Gate from "./Gate";
import Leaderboard from "./Leaderboard";
import { isConfigured, isInClass, isTeacher } from "@/lib/race-day/auth";
import { loadRaceDay } from "@/lib/race-day-db";
import { forStudents } from "@/lib/race-day/model";

/**
 * Race Day leaderboard: every car's best run, with the ±0.05 s the video
 * cannot see past shown honestly as a range of places.
 *
 * Signed in with the teacher code, the same page shows every linked first
 * name, marking the ones students cannot see yet. Students always get the
 * forStudents() view: only names with permission, nothing else about anyone.
 */
export const dynamic = "force-dynamic";

export default async function RaceDayPage() {
  if (!(await isInClass())) return <Gate role="class" configured={isConfigured("class")} />;
  const { day } = await loadRaceDay();
  if (await isTeacher()) {
    const teacherDay = { ...day, cars: day.cars.map((c) => ({ ...c, hint: "" })), students: day.students.map((st) => ({ ...st, carNote: "" })) };
    return <Leaderboard day={teacherDay} teacherView />;
  }
  return <Leaderboard day={forStudents(day)} />;
}

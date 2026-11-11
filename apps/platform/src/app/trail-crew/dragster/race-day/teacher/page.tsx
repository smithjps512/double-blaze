import Gate from "../Gate";
import TeacherAdmin from "./TeacherAdmin";
import { isConfigured, isTeacher } from "@/lib/race-day/auth";
import { loadRaceDay } from "@/lib/race-day-db";

/**
 * The teacher screen: confirm each car against its runs, set class periods,
 * enter gate times, add runs and mark reruns. Teacher code only.
 */
export const dynamic = "force-dynamic";

export default async function TeacherPage() {
  if (!(await isTeacher())) return <Gate role="teacher" configured={isConfigured("teacher")} />;
  const { day, source } = await loadRaceDay();
  return <TeacherAdmin day={day} saving={source === "db"} classLocked={isConfigured("class")} />;
}

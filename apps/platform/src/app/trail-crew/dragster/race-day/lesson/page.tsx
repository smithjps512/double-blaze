import Gate from "../Gate";
import Lesson from "./Lesson";
import { isConfigured, isInClass } from "@/lib/race-day/auth";
import { loadRaceDay } from "@/lib/race-day-db";
import { forStudents } from "@/lib/race-day/model";

/** Video vs. gate: the timing lesson, worked on our own race data. */
export const dynamic = "force-dynamic";

export default async function LessonPage() {
  if (!(await isInClass())) return <Gate role="class" configured={isConfigured("class")} />;
  const { day } = await loadRaceDay();
  return <Lesson day={forStudents(day)} />;
}

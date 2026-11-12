import Gate from "../../Gate";
import ReviewReflections from "./ReviewReflections";
import { isConfigured, isTeacher } from "@/lib/race-day/auth";
import { loadReflections } from "@/lib/race-day-reflections-db";

/** Read, score and comment on the project reflections. Teacher code only. */
export const dynamic = "force-dynamic";

export default async function ReflectionsPage() {
  if (!(await isTeacher())) return <Gate role="teacher" configured={isConfigured("teacher")} />;
  const { rows, source, error } = await loadReflections();
  return <ReviewReflections rows={rows} saving={source === "db" && !error} loadError={error ?? null} />;
}

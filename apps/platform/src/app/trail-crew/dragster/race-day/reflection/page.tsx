import Reflection from "./Reflection";
import { canSave } from "@/lib/race-day-reflections-db";

/**
 * The CO2 dragster project reflection. Open to anyone with the link, no class
 * password, so students can start straight away. The page shows nothing about
 * other students; it only takes this student's answers. Reading them stays
 * behind the teacher code at /teacher/reflections.
 */
export const dynamic = "force-dynamic";

export default function ReflectionPage() {
  return <Reflection saving={canSave()} />;
}

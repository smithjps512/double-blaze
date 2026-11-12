import Gate from "../Gate";
import Reflection from "./Reflection";
import { isConfigured, isInClass } from "@/lib/race-day/auth";
import { canSave } from "@/lib/race-day-reflections-db";

/** The CO2 dragster project reflection. Class password; students turn it in here. */
export const dynamic = "force-dynamic";

export default async function ReflectionPage() {
  if (!(await isInClass())) return <Gate role="class" configured={isConfigured("class")} />;
  return <Reflection saving={canSave()} />;
}

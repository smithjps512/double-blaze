import type { Metadata } from "next";
import { access } from "@/lib/auth";
import { CheckIn } from "@/components/CheckIn";
import { DemoBanner } from "@/components/DemoBanner";
import { NotSetUp } from "@/components/NotSetUp";

export const metadata: Metadata = { title: "Check in" };
export const dynamic = "force-dynamic";

/** The counter tablet at the front door. */
export default async function CounterPage() {
  const a = await access(["checkin"]);
  if (!a.ok) return <NotSetUp screen="check-in counter" />;
  return (
    <>
      <DemoBanner />
      <CheckIn mode="counter" />
    </>
  );
}

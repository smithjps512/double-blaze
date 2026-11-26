import type { Metadata } from "next";
import { access } from "@/lib/auth";
import { DemoBanner } from "@/components/DemoBanner";
import { NotSetUp } from "@/components/NotSetUp";
import { StaffScreen } from "@/components/StaffScreen";

export const metadata: Metadata = { title: "Staff" };
export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const a = await access(["staff"]);
  if (!a.ok) return <NotSetUp screen="staff screen" />;
  return (
    <>
      <DemoBanner />
      <StaffScreen />
    </>
  );
}

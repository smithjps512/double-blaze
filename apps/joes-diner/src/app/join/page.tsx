import type { Metadata } from "next";
import { CheckIn } from "@/components/CheckIn";
import { DemoBanner } from "@/components/DemoBanner";

export const metadata: Metadata = { title: "Check in", description: "Get on the list at Joe's Diner from your phone." };
export const dynamic = "force-dynamic";

/** Where the QR code at the door goes: check in from your own phone. */
export default function JoinPage() {
  return (
    <>
      <DemoBanner />
      <CheckIn mode="phone" />
    </>
  );
}

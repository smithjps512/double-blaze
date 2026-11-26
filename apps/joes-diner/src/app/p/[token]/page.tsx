import type { Metadata } from "next";
import { DemoBanner } from "@/components/DemoBanner";
import { PartyStatus } from "@/components/PartyStatus";

export const metadata: Metadata = { title: "Your spot", referrer: "no-referrer" };
export const dynamic = "force-dynamic";

/** A guest's private status page. The token is the only key. */
export default async function PartyPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { token } = await params;
  const { new: fresh } = await searchParams;
  return (
    <>
      <DemoBanner />
      <PartyStatus token={token} isNew={fresh === "1"} />
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import Gate from "../../dragster/race-day/Gate";
import { isConfigured, isInClass } from "@/lib/race-day/auth";
import { creditFor } from "@/lib/sandwich-bot/credits";
import { findScript } from "@/lib/sandwich-bot/submissions";
import Player from "../Player";

export const dynamic = "force-dynamic";

export default async function SandwichBotScene({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isInClass())) return <Gate role="class" configured={isConfigured("class")} title="Sandwich Bot is for our class" />;
  const { id } = await params;
  const script = findScript(id);
  if (!script) notFound();
  return (
    <>
      <nav className="px-4 pt-3 md:px-6">
        <Link href="/trail-crew/sandwich-bot" className="text-lg font-bold underline underline-offset-4">
          ◀ All scenes
        </Link>
      </nav>
      <Player script={script} madeBy={creditFor(script.id)} />
    </>
  );
}

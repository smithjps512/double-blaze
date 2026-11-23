import Link from "next/link";
import Gate from "../../dragster/race-day/Gate";
import { isConfigured, isInClass } from "@/lib/race-day/auth";
import Library from "./Library";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  if (!(await isInClass())) return <Gate role="class" configured={isConfigured("class")} title="Sandwich Bot is for our class" />;
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/trail-crew/sandwich-bot" className="text-lg font-bold underline underline-offset-4">
        ◀ All scenes
      </Link>
      <h1 className="mt-2 text-4xl font-black">Chef Byte&apos;s kitchen library</h1>
      <p className="mt-1 text-xl">Everything Chef Byte can use, and every move it knows.</p>
      <Library />
    </main>
  );
}

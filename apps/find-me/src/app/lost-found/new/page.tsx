import type { Metadata } from "next";
import Link from "next/link";
import { ReportForm } from "@/components/ReportForm";
import { isDemo } from "@/lib/data";
import { mapCenter } from "@/lib/reports-data";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Post a lost or found pet", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function NewReportPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const kind = (await searchParams).kind === "found" ? "found" : "lost";
  const { viewer } = await getViewer();
  const today = new Date().toISOString().slice(0, 10);

  if (!isDemo() && !viewer) {
    return (
      <section className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-4xl font-extrabold">{kind === "lost" ? "Lost a pet?" : "Found a pet?"}</h1>
        <p className="mt-3 text-muted">
          Sign in with your email first, so people can message you safely in the app. It takes a minute, and no phone
          number is ever shown.
        </p>
        <Link href={`/sign-in?next=${encodeURIComponent(`/lost-found/new?kind=${kind}`)}`} className="btn-primary mt-6">
          Sign in with email
        </Link>
      </section>
    );
  }

  return (
    <div className="container-page max-w-2xl py-10">
      <Link href="/lost-found" className="btn-quiet -ml-3">
        ← Lost and found
      </Link>
      <h1 className="mt-2 font-display text-4xl font-extrabold">{kind === "lost" ? "Post a lost pet" : "Post a found pet"}</h1>
      <p className="mb-6 mt-1 text-muted">
        {kind === "lost"
          ? "We are sorry. Post here, then share the link. Partner shelters are alerted the moment you post."
          : "Thank you for helping. Any vet or shelter can scan for a microchip for free."}
      </p>
      {isDemo() && <p className="mb-6 rounded-2xl bg-sun-light p-4 text-sm">Demo mode: the form works, but nothing is posted.</p>}
      <ReportForm initialKind={kind} center={mapCenter()} today={today} />
    </div>
  );
}

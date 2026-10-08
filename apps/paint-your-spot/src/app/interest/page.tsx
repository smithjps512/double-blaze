import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SurveyForm } from "@/components/SurveyForm";
import { ShareLink } from "@/components/ShareLink";
import { InterestMeter } from "@/components/InterestMeter";
import { loadInterestCounts, loadSettings, siteUrl } from "@/lib/data";
import { deadlineInfo, toGoal } from "@/lib/settings";
import type { SurveyAnswers } from "@/lib/survey";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Interest survey" };

export default async function InterestPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [{ saved }, { viewer, db }] = await Promise.all([searchParams, getViewer()]);
  if (!viewer || !db) redirect("/sign-in?next=/interest");

  if (saved) {
    const [counts, settings] = await Promise.all([loadInterestCounts(), loadSettings()]);
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <p className="inline-block -rotate-3 rounded-md border-4 border-asphalt bg-sold px-5 py-2 font-stencil text-3xl uppercase tracking-widest text-chalk shadow-sign">
          Pending sale
        </p>
        <h1 className="mt-8 font-display text-4xl font-extrabold sm:text-5xl">Your interest is on file!</h1>
        <p className="mt-4 text-lg text-muted">
          No money due, nothing reserved yet. This fundraiser only happens if enough staff want in. If you&apos;re
          excited about it, the best thing you can do now is recruit two colleagues.
        </p>
        <div className="mt-10 text-left">
          <InterestMeter counts={counts} goal={toGoal(settings.interest_goal)} deadline={deadlineInfo(settings.interest_deadline)} />
        </div>
        <div className="mt-10 rounded-2xl border-2 border-bms bg-bms-light p-6 text-left">
          <p className="mb-3 font-display text-lg font-bold">Spread the word</p>
          <ShareLink url={siteUrl()} />
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-6 font-semibold">
          <Link href="/interest" className="focus-ring rounded underline decoration-tape decoration-2 underline-offset-8">
            Edit my answers
          </Link>
          <Link href="/" className="focus-ring rounded underline decoration-tape decoration-2 underline-offset-8">
            Back to the listings
          </Link>
        </div>
      </section>
    );
  }

  const { data } = await db
    .from("pys_interest_responses")
    .select("name, role, interest_level, interests, preferred_lot, painter, keep_yearly, price_comfort, comments")
    .eq("user_id", viewer.id)
    .maybeSingle<SurveyAnswers>();

  const defaults: Partial<SurveyAnswers> = data ?? { name: viewer.name, interests: [] };

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="font-stencil text-lg uppercase tracking-widest text-bms">Interest survey</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">
        {data ? "Update your listing preferences" : "Tell us what you're shopping for"}
      </h1>
      <p className="mt-3 text-muted">
        Two minutes. No payment, no commitment. {data ? "Your earlier answers are filled in below." : "You can change your answers any time."}
      </p>
      <div className="mt-8">
        <SurveyForm email={viewer.email} defaults={defaults} isBoss={viewer.isBoss} isUpdate={Boolean(data)} />
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { pendingCount } from "@/lib/launch-qa-db";
import { QaLinkRequest } from "./QaLinkRequest";

/**
 * Where the teacher gets a fresh link to /play/review. It sends a signed link
 * to the teacher's address and nothing else, so it can be public.
 */
export const metadata: Metadata = { title: "Play: teacher", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PlayTeacherPage() {
  const pending = await pendingCount();
  return (
    <section className="bg-stone-white">
      <div className="container-page py-14">
        <p className="eyebrow">Play and QA</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink">For the teacher</h1>
        <p className="mt-3 max-w-xl text-ink/75">
          QA reports from <Link href="/play" className="underline">/play</Link> wait for you before any team sees them.
          {pending > 0 ? ` ${pending} ${pending === 1 ? "is" : "are"} waiting now.` : " Nothing is waiting right now."} This emails you a
          link that opens them with no sign-in.
        </p>
        <div className="mt-6">
          <QaLinkRequest />
        </div>
      </div>
    </section>
  );
}

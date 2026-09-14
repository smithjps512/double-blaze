import type { Metadata } from "next";
import Link from "next/link";
import { QueueLinkRequest } from "./QueueLinkRequest";

/**
 * Where a teacher goes to get back into the queue.
 *
 * The email links expire, and the queue in the portal needs a staff sign-in
 * that is not always to hand. This page sends a fresh link to the teacher's
 * address and nothing else, so it can be public.
 */
export const metadata: Metadata = {
  title: "Trail Crew: teacher",
  robots: { index: false, follow: false },
};

export default function TeacherPage() {
  return (
    <section className="bg-stone-white">
      <div className="container-page py-14">
        <p className="eyebrow">Trail Crew</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink">For the teacher</h1>
        <p className="mt-3 max-w-xl text-ink/75">
          Story proposals and Spark&rsquo;s architecture drafts wait for you in a queue. Every
          proposal emails you a link that opens it with no sign-in. If you need to get to the
          whole queue, or a link has expired, this sends you a fresh one.
        </p>
        <div className="mt-6">
          <QueueLinkRequest />
        </div>
        <p className="mt-6 text-sm text-ink/60">
          Signed in as staff? The queue is also in the{" "}
          <Link href="/execution/trail-crew" className="underline">
            execution portal
          </Link>
          , with every team&rsquo;s project board beside it.
        </p>
      </div>
    </section>
  );
}

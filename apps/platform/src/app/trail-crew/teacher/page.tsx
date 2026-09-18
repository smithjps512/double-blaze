import type { Metadata } from "next";
import Link from "next/link";
import { QueueLinkRequest } from "./QueueLinkRequest";
import { checkPublishing } from "@/lib/trail-crew-publish";

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

// The publishing check asks GitHub on every load, so this page is never
// cached: a token fixed in Vercel should show as fixed on the next refresh.
export const dynamic = "force-dynamic";

export default async function TeacherPage() {
  const publishing = await checkPublishing();
  const ok = publishing.configured && publishing.canPush === true;
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
        <div
          className={`mt-8 max-w-xl rounded-lg border px-4 py-3 text-sm ${
            ok ? "border-emerald-600/40 bg-emerald-50 text-ink/80" : "border-trail-orange/50 bg-trail-orange/5 text-ink/80"
          }`}
        >
          <p className="font-semibold">
            Publishing check: {ok ? "approvals can commit" : "approvals cannot commit"}
          </p>
          {!publishing.configured ? (
            <p className="mt-1">
              No <code>GITHUB_TOKEN</code> is set in this deployment, so approving a story has nowhere
              to write.
            </p>
          ) : (
            <ul className="mt-1 space-y-0.5">
              <li>
                Token kind: <strong>{publishing.kind}</strong>
                {publishing.login ? (
                  <>
                    , belonging to <strong>{publishing.login}</strong>
                  </>
                ) : null}
              </li>
              <li>
                Commits go to <strong>{publishing.owner}/{publishing.repo}</strong> on branch{" "}
                <strong>{publishing.branch}</strong>
              </li>
              <li>
                Can push:{" "}
                <strong>{publishing.canPush === undefined ? "unknown" : publishing.canPush ? "yes" : "no"}</strong>
              </li>
              {publishing.message ? <li className="mt-1">{publishing.message}</li> : null}
            </ul>
          )}
          {!ok && publishing.configured ? (
            <p className="mt-2 text-ink/70">
              This is the token Vercel is sending, which may not be the one open in GitHub&rsquo;s
              settings. A fine-grained token needs this repository under Repository access and
              Contents set to Read and write. A classic token needs the repo scope. After changing
              the value in Vercel, redeploy, then refresh this page.
            </p>
          ) : null}
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

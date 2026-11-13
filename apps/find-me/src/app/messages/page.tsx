import type { Metadata } from "next";
import Link from "next/link";
import { AnimalPhoto } from "@/components/AnimalPhoto";
import { ReportBadge } from "@/components/ReportCard";
import { listConversations } from "@/lib/conversations";
import { isDemo } from "@/lib/data";
import { reportTitle } from "@/lib/reports-data";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Messages", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const { viewer, db } = await getViewer();
  if (!viewer || !db) {
    return (
      <section className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-4xl font-extrabold">Messages</h1>
        <p className="mt-3 text-muted">
          {isDemo()
            ? "In the live app, owners and finders talk here, privately. No phone numbers or addresses are shown unless someone chooses to share them."
            : "Sign in to see your conversations about lost and found pets."}
        </p>
        {isDemo() ? (
          <Link href="/lost-found/demo-lost-rocket?view=owner" className="btn-primary mt-6">
            See the owner&apos;s view of a post
          </Link>
        ) : (
          <Link href="/sign-in?next=/messages" className="btn-primary mt-6">
            Sign in
          </Link>
        )}
      </section>
    );
  }
  const convs = await listConversations(db, viewer.id);
  return (
    <div className="container-page max-w-2xl py-10">
      <h1 className="font-display text-4xl font-extrabold">Messages</h1>
      {convs.length === 0 ? (
        <p className="mt-4 text-muted">
          No conversations yet. They start when you reply to a{" "}
          <Link href="/lost-found" className="underline">
            lost or found post
          </Link>
          , or someone replies to yours.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white">
          {convs.map((c) => (
            <li key={c.id}>
              <Link href={`/messages/${c.id}`} className="focus-ring flex items-center gap-4 p-4 hover:bg-cream">
                <AnimalPhoto
                  name={c.report.name || "Pet"}
                  species={c.report.species}
                  photoUrl={c.report.photoUrl}
                  className="h-14 w-14 shrink-0 rounded-2xl"
                  sizes="56px"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <ReportBadge report={c.report} />
                    <span className={`truncate ${c.unread ? "font-bold" : "font-semibold"}`}>{reportTitle(c.report)}</span>
                  </span>
                  <span className="block truncate text-sm text-muted">
                    {c.side === "poster" ? "Someone responded to your post" : "Your reply"} · {c.lastMessageAt.slice(0, 10)}
                  </span>
                </span>
                {c.unread && (
                  <span className="h-3 w-3 shrink-0 rounded-full bg-ember" aria-label="Unread" role="img" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

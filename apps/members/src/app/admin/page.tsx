import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant";
import { getSessionClient, getSignedInMember, isAuthConfigured } from "@/lib/auth";
import { summarizeJoinAnswers } from "@/lib/join";
import type { AssignableRole } from "@/lib/admin";
import { DecisionButtons, RolePicker } from "./actions";

/**
 * The approval queue (session 3d).
 *
 * The brief makes administrator approval the gate on membership, so this page
 * is the gate. It shows the requests waiting and, below them, the people
 * already in, because the other thing this session exists for is handing the
 * administrator role to the club and stepping back from it.
 *
 * Every query runs under the administrator's own session. `site_members_admin_all`
 * is what confines them to their own club, so an administrator of a second club
 * on the platform sees their own queue here and nothing else, with no code in
 * this file responsible for that. The route guard below decides what to render,
 * not what may be read.
 *
 * Not here, deliberately: suspension, removal, and content moderation are the
 * admin console in session 9. This is the door, not the building.
 */
export const dynamic = "force-dynamic";

interface MemberRow {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  status: string;
  created_at: string;
  approved_at: string | null;
  join_answers: Record<string, unknown> | null;
}

export default async function AdminPage() {
  const tenant = await resolveTenant();
  if (!tenant) notFound();

  if (!isAuthConfigured()) {
    return (
      <main>
        <h1>{tenant.name}</h1>
        <p className="notice">The member area is not configured yet.</p>
      </main>
    );
  }

  const viewer = await getSignedInMember(tenant.siteId);
  if (!viewer) redirect("/sign-in");

  // Anyone else is sent to the front door rather than shown a refusal. A member
  // who guesses this URL has done nothing wrong and gains nothing from being
  // told the page exists.
  if (viewer.role !== "admin" || viewer.status !== "active") redirect("/");

  const db = await getSessionClient();
  if (!db) notFound();

  const { data } = await db
    .from("site_members")
    .select("id, email, display_name, role, status, created_at, approved_at, join_answers")
    .eq("site_id", tenant.siteId)
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as MemberRow[];
  const pending = rows.filter((r) => r.status === "pending");
  const active = rows.filter((r) => r.status === "active");
  const decided = rows.filter((r) => r.status === "declined" || r.status === "suspended");

  const admins = active.filter((r) => r.role === "admin");

  return (
    <main className="wide">
      <h1>{tenant.name}</h1>
      <p className="muted">
        Signed in as {viewer.displayName ?? viewer.email}, administrator.{" "}
        <Link href="/">Back to the member area</Link>
      </p>

      <h2>
        Requests waiting
        {pending.length > 0 ? <span className="count">{pending.length}</span> : null}
      </h2>

      {pending.length === 0 ? (
        <p className="notice">
          Nothing waiting. New requests appear here, and every administrator is
          emailed when one arrives.
        </p>
      ) : (
        pending.map((row) => (
          <article className="request" key={row.id}>
            <h3>{row.display_name ?? row.email}</h3>
            <p className="muted">
              {row.email} <span className="dot">.</span> applied {formatDate(row.created_at)}
            </p>

            <dl className="answers">
              {summarizeJoinAnswers(row.join_answers).map((answer) => (
                <div key={answer.key}>
                  <dt>{answer.label}</dt>
                  <dd>{answer.value}</dd>
                </div>
              ))}
            </dl>

            <DecisionButtons memberId={row.id} name={row.display_name ?? row.email} />
          </article>
        ))
      )}

      <h2>Members</h2>

      {/* The reason this session exists. James approves the club's own
          administrator and then reduces his role, and the order matters: the
          database refuses to let the last administrator go, so appointing
          comes first. Saying so here is cheaper than hitting the error. */}
      {admins.length === 1 ? (
        <p className="notice">
          There is one administrator. Appoint another before changing this role,
          since a club with none cannot admit anybody.
        </p>
      ) : null}

      <table className="members">
        <thead>
          <tr>
            <th>Member</th>
            <th>Joined</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {active.map((row) => (
            <tr key={row.id}>
              <td>
                <strong>{row.display_name ?? "No name"}</strong>
                <span className="muted"> {row.email}</span>
                {row.id === viewer.memberId ? <span className="you">you</span> : null}
              </td>
              <td className="muted">{formatDate(row.approved_at ?? row.created_at)}</td>
              <td>
                <RolePicker
                  memberId={row.id}
                  current={row.role as AssignableRole}
                  name={row.display_name ?? row.email}
                  isSelf={row.id === viewer.memberId}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {decided.length > 0 ? (
        <>
          <h2>Not active</h2>
          <table className="members">
            <tbody>
              {decided.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.display_name ?? "No name"}</strong>
                    <span className="muted"> {row.email}</span>
                  </td>
                  <td className="muted">{row.status}</td>
                  <td className="muted">
                    {row.approved_at ? formatDate(row.approved_at) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted">
            Declined requests are kept rather than deleted, so the same person
            applying again is visible and a decision taken by mistake can be
            revisited. Reinstating one is session 9.
          </p>
        </>
      ) : null}
    </main>
  );
}

/** A plain, unambiguous date. Not relative, because "3 days ago" in a queue
 *  is worse than a date an administrator can quote back to somebody. */
function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

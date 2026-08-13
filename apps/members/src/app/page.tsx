import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant";
import { getSessionClient, getSignedInMember, isAuthConfigured } from "@/lib/auth";
import { summarizeJoinAnswers } from "@/lib/join";
import { profileCompleteness, profileHeadline, type Profile } from "@/lib/profile";
import { articleMeta } from "@/lib/articles";
import { Masthead, Footer } from "./masthead";

/**
 * The member area's front door. Its only job is to route by membership status,
 * because every state below is a real one someone will land in:
 *
 *   no session        -> sign in
 *   session, no row   -> the join questionnaire
 *   pending           -> waiting on a human
 *   declined          -> a plain answer rather than a silent dead end
 *   suspended         -> told, and told who to contact
 *   active            -> the member area
 *
 * Status is read from the database under the member's own session rather than
 * trusted from anything in the request, so an expired guest or a suspended
 * member cannot hold a stale view of their own access.
 *
 * For an active member this is now a place to arrive rather than a paragraph:
 * the newest three pieces and a few faces, which are the two things that make
 * somebody come back. The navy hero continues the masthead, so the top of the
 * page is one field of the club's colour rather than a thin strip above white.
 */
export const dynamic = "force-dynamic";

interface HomeArticle {
  id: string;
  slug: string;
  kind: string;
  title: string;
  summary: string | null;
  body: string | null;
  author: { id: string; display_name: string | null; profile: Profile | null } | null;
}

export default async function MemberHome() {
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

  const member = await getSignedInMember(tenant.siteId);
  if (!member) redirect("/sign-in");

  // Authenticated, and no membership row for this club. They have proved an
  // address and not applied yet, which is exactly what the questionnaire is
  // for.
  if (!member.memberId) redirect("/join");

  if (member.status === "pending") {
    const answers = summarizeJoinAnswers(member.joinAnswers);
    return (
      <>
        <main className="reading">
          <h1>Your request is with an administrator</h1>
          <p>
            Thank you for applying to {tenant.name}. A person reads every request,
            and most are answered within a few days.
          </p>
          <p className="muted">
            We will email <strong>{member.email}</strong> as soon as there is an
            answer.
          </p>

          {/* Read back what they sent. An applicant who cannot see their own
              answers has no way to tell a submitted form from a lost one, and
              the wait here is measured in days. */}
          {answers.length > 0 ? (
            <>
              <h2 className="section-head">What you told us</h2>
              <dl className="answers">
                {member.displayName ? (
                  <div>
                    <dt>Your name</dt>
                    <dd>{member.displayName}</dd>
                  </div>
                ) : null}
                {answers.map((answer) => (
                  <div key={answer.key}>
                    <dt>{answer.label}</dt>
                    <dd>{answer.value}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : null}
        </main>
        <Footer clubName={tenant.name} />
      </>
    );
  }

  if (member.status === "declined") {
    return (
      <>
        <main className="reading">
          <h1>Your request was not approved</h1>
          <p>
            Membership is limited to people working in or around the electric grid
            and the AI industry. If you believe this was a mistake, reply to the
            email we sent and an administrator will take another look.
          </p>
        </main>
        <Footer clubName={tenant.name} />
      </>
    );
  }

  if (member.status === "suspended") {
    return (
      <>
        <main className="reading">
          <h1>Your membership is on hold</h1>
          <p>
            An administrator has suspended this account. Reply to any email from
            {" "}
            {tenant.name} and someone will explain why.
          </p>
        </main>
        <Footer clubName={tenant.name} />
      </>
    );
  }

  // The brief: "Once a member, the first prompt is to create a profile." A
  // member with nothing written is sent there rather than shown a home page
  // they have no way to take part in yet.
  const completeness = profileCompleteness((member.profile ?? {}) as Profile);
  if (completeness.filled === 0) redirect("/profile?welcome=1");

  const db = await getSessionClient();

  const [latest, faces] = db
    ? await Promise.all([
        db
          .from("site_articles")
          .select(
            "id, slug, kind, title, summary, body," +
              " author:site_members!site_articles_author_id_fkey(id, display_name, profile)",
          )
          .eq("site_id", tenant.siteId)
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(3),
        db
          .from("site_members")
          .select("id, display_name, profile")
          .eq("site_id", tenant.siteId)
          .order("display_name", { ascending: true })
          .limit(4),
      ])
    : [{ data: null }, { data: null }];

  const articles = (latest.data ?? []) as unknown as HomeArticle[];
  const people = (faces.data ?? []) as { id: string; display_name: string | null; profile: Profile | null }[];

  return (
    <>
      <Masthead member={member} clubName={tenant.name} current="/" />

      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">Welcome back</p>
          <h1>{member.displayName?.split(" ")[0] ?? "Hello"}</h1>
          <p className="lede">
            {articles.length === 0
              ? "Nothing has been published yet. The first piece in the library sets the tone for the rest."
              : `${people.length === 1 ? "You are the first member" : "Members are publishing"}, and the newest pieces are below.`}
          </p>
        </div>
      </section>

      <main>
        {!completeness.enough ? (
          <p className="notice">
            <strong>Your profile is still thin.</strong> A photo or a few lines on
            what you work on is what makes other members reach out.{" "}
            <Link href="/profile">Finish it</Link>.
          </p>
        ) : null}

        <section>
          <h2 className="section-head">
            Latest in the library
            <Link className="more" href="/library">
              See all
            </Link>
          </h2>

          {articles.length === 0 ? (
            <p className="notice">
              Nothing yet. <Link href="/write/new">Add the first piece</Link>.
            </p>
          ) : (
            <div className="cards">
              {articles.map((a) => (
                <article className="card" key={a.id}>
                  <span className={`tag ${a.kind}`}>{articleMeta(a)}</span>
                  <h3>
                    <Link href={`/library/${a.slug}`}>{a.title}</Link>
                  </h3>
                  {a.summary ? <p className="muted">{a.summary}</p> : null}
                  <p className="byline sm">
                    <span className="avatar" aria-hidden="true">
                      {(a.author?.display_name ?? "A").trim().charAt(0).toUpperCase()}
                    </span>
                    <span>{a.author?.display_name ?? "A member"}</span>
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="section-head">
            Members
            <Link className="more" href="/directory">
              See all
            </Link>
          </h2>
          <div className="faces">
            {people.map((p) => {
              const name = p.display_name ?? "A member";
              const photo = p.profile?.photo_path;
              return (
                <Link className="face" href={`/members/${p.id}`} key={p.id}>
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="avatar md" src={`/api/media/${photo}`} alt="" />
                  ) : (
                    <span className="avatar md" aria-hidden="true">
                      {name.trim().charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="face-name">{name}</span>
                  <span className="muted sm">{profileHeadline(p.profile) || " "}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {member.role === "admin" ? (
          <p className="notice quiet">
            <strong>You administer this club.</strong> Membership requests are
            reviewed in <Link href="/admin">Admin</Link>, and you are emailed
            whenever one arrives.
          </p>
        ) : null}
      </main>

      <Footer clubName={tenant.name} />
    </>
  );
}

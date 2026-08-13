import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { resolveTenant } from "@/lib/tenant";
import { getSignedInMember, isAuthConfigured } from "@/lib/auth";
import { ARTICLE_COPY } from "@/lib/articles";
import { profileCompleteness, type Profile } from "@/lib/profile";
import { titleFor } from "@/lib/metadata";
import { Masthead, Footer } from "../masthead";

/**
 * Where an invitation lands.
 *
 * Until this page existed, clicking an invitation link redeemed the token,
 * created the membership, signed the person in, and dropped them on the profile
 * form. Somebody who had just been asked to join by name met a page headed
 * "Welcome. Tell the club who you are" with nothing in between saying what they
 * had joined.
 *
 * That is a form rather than a welcome, and it is the wrong first thing to show
 * a person who has not yet seen the inside. A failed invitation, meanwhile, has
 * had an explanation on the sign-in page since 3e, which made the successful
 * path the only one arriving without a word.
 *
 * ---------------------------------------------------------------------------
 * Why it is not skippable, and why it is not a gate either
 * ---------------------------------------------------------------------------
 *
 * The front door sends anybody with an empty profile here, which is every new
 * member however they arrived. The brief asks that "once a member, the first
 * prompt is to create a profile", and that prompt is the first thing on this
 * page. What is added is the sentence above it saying where they are.
 *
 * Nothing is withheld. Every link on the page goes somewhere real, so a member
 * who would rather look around before writing about themselves can. A welcome
 * that will not let you past is a gate, and the profile was deliberately not
 * made into one in session 4.
 */
export const dynamic = "force-dynamic";

export function generateMetadata() {
  return titleFor("Welcome");
}

export default async function WelcomePage() {
  const tenant = await resolveTenant();
  if (!tenant) notFound();
  if (!isAuthConfigured()) notFound();

  const member = await getSignedInMember(tenant.siteId);
  if (!member) redirect("/sign-in");
  if (!member.memberId) redirect("/join");
  if (member.status !== "active") redirect("/");

  const completeness = profileCompleteness((member.profile ?? {}) as Profile);
  const first = member.displayName?.trim().split(" ")[0];

  return (
    <>
      <Masthead member={member} clubName={tenant.name} current="/" />

      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">{tenant.name}</p>
          <h1>{first ? `Welcome, ${first}` : ARTICLE_COPY.welcomeTitle}</h1>
          <p className="lede">{ARTICLE_COPY.welcomeLede}</p>
        </div>
      </section>

      <main>
        <h2 className="section-head">Three things worth doing first</h2>

        <div className="cards">
          <Link className="card start" href="/profile?welcome=1">
            <span className="tag">Start here</span>
            <h3>Write your profile</h3>
            <p className="muted">
              Your name, what you work on, and a photo if you want one. It is
              what other members see, and what anything you publish appears
              under. None of it is required.
            </p>
          </Link>

          <Link className="card start" href="/library">
            <span className="tag">Read</span>
            <h3>Look through the library</h3>
            <p className="muted">
              Written pieces, audio recordings, and video, published by members.
              Nothing in it is public.
            </p>
          </Link>

          <Link className="card start" href="/directory">
            <span className="tag">Meet</span>
            <h3>See who else is here</h3>
            <p className="muted">
              Everyone who has been admitted, what they work on, and where they
              are. Visible only to each other.
            </p>
          </Link>
        </div>

        {completeness.filled > 0 ? (
          <p className="notice quiet">
            You have already started a profile.{" "}
            <Link href="/">Go to the member area</Link>.
          </p>
        ) : (
          <p className="notice quiet">
            Nothing here is public, and nothing is indexed by search engines. If
            you would rather look around before writing anything,{" "}
            <Link href="/">the member area</Link> is open.
          </p>
        )}
      </main>

      <Footer clubName={tenant.name} />
    </>
  );
}

import Link from "next/link";
import type { SignedInMember } from "@/lib/auth";

/**
 * The member area's masthead (session 5b, replacing the plain nav from 4).
 *
 * A server component, because what it shows depends on who is asking and that
 * is already known by the time a page renders. Admin is the only conditional
 * entry: a member who is not one has no use for a link they cannot follow.
 *
 * ---------------------------------------------------------------------------
 * Why a band of colour rather than a row of links
 * ---------------------------------------------------------------------------
 *
 * The previous version was six text links above the content and nothing else,
 * which is what a page looks like when nobody has decided it is a product. The
 * club's name did not appear on any screen, and every browser tab said
 * "Members".
 *
 * A deep band of the club's own primary colour is the cheapest thing available
 * that makes a page read as an institution rather than as a form, which matters
 * here more than usual: the people being asked to put their name, employer, and
 * photo into this are senior professionals in a regulated industry, and the
 * first thing they judge is whether it looks like somewhere that belongs.
 *
 * The mark is a plain tile in the accent colour rather than a logo, because the
 * club does not have one yet. When it does, it replaces the span and nothing
 * else changes.
 */
export function Masthead({
  member,
  clubName,
  current,
}: {
  member: SignedInMember;
  clubName: string;
  current: string;
}) {
  const links = [
    { href: "/", label: "Home" },
    // "Library" is a description rather than the name of the content area,
    // which is still the club's to choose. See build plan section 3 item 6.
    { href: "/library", label: "Library" },
    // "Publish" rather than "Write". A user test found that a member who sees
    // only "Write" concludes that writing is the only thing on offer, and never
    // looks for the audio upload or the video link that live behind it.
    { href: "/write", label: "Publish" },
    { href: "/directory", label: "Members" },
    { href: "/profile", label: "Your profile" },
    ...(member.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  const name = member.displayName?.trim() || member.email;
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const photo = (member.profile as { photo_path?: string } | null)?.photo_path;

  return (
    <header className="masthead">
      <div className="masthead-bar">
        <div className="wrap row">
          <Link className="wordmark" href="/">
            <span className="mark" aria-hidden="true" />
            <span>{clubName}</span>
          </Link>

          <div className="me">
            <span className="me-name">{name}</span>
            {photo ? (
              // next/image is not used anywhere in this app: every photo is
              // served by our own authenticated proxy from a private bucket,
              // which the optimizer cannot reach.
              // eslint-disable-next-line @next/next/no-img-element
              <img className="avatar" src={`/api/media/${photo}`} alt="" />
            ) : (
              <span className="avatar" aria-hidden="true">
                {initial}
              </span>
            )}
          </div>
        </div>
      </div>

      <nav className="masthead-nav" aria-label="Member area">
        <div className="wrap">
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={link.href === current ? "current" : undefined}
                  aria-current={link.href === current ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}

/**
 * The masthead for somebody who is not signed in yet.
 *
 * The same band, without the navigation, because there is nowhere to navigate
 * to until they are in. It exists because the sign-in page is the front door,
 * and until session 6 it was a heading and an email box on a white page with
 * nothing on it to say whose door it was.
 *
 * That mattered more than it looked. The people arriving at it are being asked
 * to hand over an email address to something they have not seen the inside of,
 * and a page carrying no name is a page that has not earned it.
 */
export function PublicMasthead({ clubName }: { clubName: string }) {
  return (
    <header className="masthead">
      <div className="masthead-bar">
        <div className="wrap row">
          <span className="wordmark">
            <span className="mark" aria-hidden="true" />
            <span>{clubName}</span>
          </span>
        </div>
      </div>
    </header>
  );
}

/**
 * The footer.
 *
 * Mostly here to give the page a bottom edge and to reserve the place the
 * policies go. Session 9 adds privacy, non-solicitation, and the competition
 * policy that build plan section 3 calls for, and a footer added at that point
 * would be a layout change on every page rather than three links.
 *
 * The links are inert until those pages exist. Rendering them as plain text
 * rather than as dead anchors is deliberate: a link that goes nowhere is worse
 * than a label that does not claim to.
 */
export function Footer({ clubName }: { clubName: string }) {
  return (
    <footer className="foot">
      <div className="wrap">
        <p className="foot-name">{clubName}</p>
        <p className="muted sm">
          A private forum. Nothing here is public, and nothing is indexed.
        </p>
        <p className="muted sm foot-links">
          <span>Privacy</span>
          <span className="sep">/</span>
          <span>Non-solicitation</span>
          <span className="sep">/</span>
          <span>Competition policy</span>
        </p>
      </div>
    </footer>
  );
}

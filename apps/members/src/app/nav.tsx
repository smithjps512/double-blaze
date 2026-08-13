import Link from "next/link";
import type { SignedInMember } from "@/lib/auth";

/**
 * The member area's navigation.
 *
 * A server component, because what it shows depends on who is asking and that
 * is already known by the time a page renders. Admin is the only conditional
 * entry: a member who is not one has no use for a link they cannot follow.
 */
export function Nav({ member, current }: { member: SignedInMember; current: string }) {
  const links = [
    { href: "/", label: "Home" },
    // "Library" is a description rather than the name of the content area,
    // which is still the club's to choose. See build plan section 3 item 6.
    { href: "/library", label: "Library" },
    { href: "/write", label: "Write" },
    { href: "/directory", label: "Members" },
    { href: "/profile", label: "Your profile" },
    ...(member.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <nav className="site-nav">
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={link.href === current ? "page" : undefined}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
